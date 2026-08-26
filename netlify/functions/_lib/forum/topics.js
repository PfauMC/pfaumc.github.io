import { q, one, logModeration } from './db.js'
import { badRequest, forbidden, notFound, json, intParam } from './http.js'
import { requireUser, requireModerator, requireCsrf } from './auth.js'
import * as shape from './shape.js'
import { LIMITS, requireText, requireBool, requireId, requireInt } from './validate.js'

export const PAGE_SIZE = 20

const SORTS = {
  recent: 't.last_post_at DESC',
  new: 't.created_at DESC',
  replies: 't.post_count DESC, t.last_post_at DESC',
  views: 't.views DESC, t.last_post_at DESC',
}

const TOPIC_SELECT = `
  SELECT t.id, t.category_id, t.title, t.is_pinned, t.is_locked, t.reply_cooldown_sec, t.views, t.post_count,
         t.created_at, t.last_post_at, t.deleted_at,
         c.slug AS category_slug, c.title AS category_title, c.is_active AS category_active,
         ${shape.authorFields('au', 'a', 'ar')},
         ${shape.authorFields('lu', 'lp', 'lr')},
         ($1::bigint IS NOT NULL AND t.last_post_at > COALESCE(rs.read_at, $2::timestamptz)) AS has_unread,
         (sub.user_id IS NOT NULL) AS is_subscribed
    FROM forum_topics t
    JOIN forum_categories c ON c.id = t.category_id
    JOIN forum_users au ON au.id = t.author_id
    JOIN forum_roles ar ON ar.key = au.role_key
    LEFT JOIN forum_users lu ON lu.id = t.last_post_user_id
    LEFT JOIN forum_roles lr ON lr.key = lu.role_key
    LEFT JOIN forum_topic_read_state rs ON rs.topic_id = t.id AND rs.user_id = $1
    LEFT JOIN forum_topic_subscriptions sub ON sub.topic_id = t.id AND sub.user_id = $1
`

function viewer(ctx) {
  return [ctx?.user.id ?? null, ctx?.user.createdAt ?? null]
}

export async function listByCategory(req, ctx, slug) {
  const url = new URL(req.url)
  const page = intParam(url.searchParams.get('page'), { fallback: 1, max: 5000 })
  const sortKey = url.searchParams.get('sort') ?? 'recent'
  const orderBy = SORTS[sortKey] ?? SORTS.recent
  const isMod = Boolean(ctx?.user.role.canModerate)

  const category = await one(
    'SELECT id, is_visible FROM forum_categories WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  )
  if (!category || (!category.is_visible && !isMod)) throw notFound('Категория не найдена')

  const params = [...viewer(ctx), category.id, isMod, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  const rows = await q(
    `${TOPIC_SELECT}
      WHERE t.category_id = $3 AND ($4 OR t.deleted_at IS NULL)
      ORDER BY t.is_pinned DESC, ${orderBy}
      LIMIT $5 OFFSET $6`,
    params
  )
  const total = await one(
    'SELECT count(*)::int AS n FROM forum_topics WHERE category_id = $1 AND ($2 OR deleted_at IS NULL)',
    [category.id, isMod]
  )

  return json({
    topics: rows.map(shape.topic),
    page,
    pageSize: PAGE_SIZE,
    total: total.n,
    sort: SORTS[sortKey] ? sortKey : 'recent',
  })
}

export async function get(req, ctx, id) {
  const isMod = Boolean(ctx?.user.role.canModerate)
  const rows = await q(
    `${TOPIC_SELECT}
      WHERE t.id = $3
        AND ($4 OR (t.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_visible))`,
    [...viewer(ctx), id, isMod]
  )
  if (!rows[0]) throw notFound('Тема не найдена')

  // ponytail: просмотры считаем по каждому открытию, без дедупликации по
  // пользователю. Нужна точность — заводите topic_views с (topic_id, viewer, day).
  await q('UPDATE forum_topics SET views = views + 1 WHERE id = $1', [id])

  return json({ topic: shape.topic(rows[0]) })
}

export async function create(req, ctx, body) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const categoryId = requireId(body.categoryId, 'categoryId')
  const title = requireText(body.title, 'title', { ...LIMITS.title, label: 'Заголовок' })
  const text = requireText(body.body, 'body', { ...LIMITS.body, label: 'Сообщение' })

  const category = await one(
    'SELECT id, slug, is_active FROM forum_categories WHERE id = $1 AND deleted_at IS NULL',
    [categoryId]
  )
  if (!category) throw notFound('Категория не найдена')
  if (!category.is_active) throw forbidden('Категория закрыта для новых тем')

  const created = await one(
    `WITH t AS (
       INSERT INTO forum_topics (category_id, author_id, title, last_post_at, last_post_user_id)
       VALUES ($1, $2, $3, now(), $2)
       RETURNING id
     ), p AS (
       INSERT INTO forum_posts (topic_id, author_id, post_number, body)
       SELECT t.id, $2, 1, $4 FROM t
       RETURNING id, topic_id
     ), s AS (
       INSERT INTO forum_topic_subscriptions (user_id, topic_id) SELECT $2, t.id FROM t
       RETURNING topic_id
     )
     SELECT p.topic_id AS topic_id, p.id AS post_id FROM p`,
    [categoryId, mod.id, title, text]
  )

  await logModeration(mod.id, 'topic.create', 'topic', created.topic_id, { title })
  return json({ topicId: String(created.topic_id), categorySlug: category.slug }, { status: 201 })
}

export async function update(req, ctx, id, body) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const current = await one('SELECT * FROM forum_topics WHERE id = $1', [id])
  if (!current) throw notFound('Тема не найдена')

  const title = body.title == null ? current.title : requireText(body.title, 'title', { ...LIMITS.title, label: 'Заголовок' })
  const isPinned = requireBool(body.isPinned, current.is_pinned)
  const isLocked = requireBool(body.isLocked, current.is_locked)
  const replyCooldownSec =
    body.replyCooldownSec == null
      ? current.reply_cooldown_sec
      : requireInt(body.replyCooldownSec, { ...LIMITS.replyCooldownSec, label: 'Задержка' })
  let categoryId = current.category_id

  if (body.categoryId != null) {
    categoryId = requireId(body.categoryId, 'categoryId')
    const target = await one('SELECT id FROM forum_categories WHERE id = $1 AND deleted_at IS NULL', [categoryId])
    if (!target) throw notFound('Категория назначения не найдена')
  }

  await q(
    `UPDATE forum_topics SET title = $2, is_pinned = $3, is_locked = $4, category_id = $5,
            reply_cooldown_sec = $6, updated_at = now()
      WHERE id = $1`,
    [id, title, isPinned, isLocked, categoryId, replyCooldownSec]
  )

  const changes = {}
  if (title !== current.title) changes.title = title
  if (isPinned !== current.is_pinned) changes.isPinned = isPinned
  if (isLocked !== current.is_locked) changes.isLocked = isLocked
  if (replyCooldownSec !== current.reply_cooldown_sec) changes.replyCooldownSec = replyCooldownSec
  if (String(categoryId) !== String(current.category_id)) changes.movedTo = String(categoryId)
  if (Object.keys(changes).length) await logModeration(mod.id, 'topic.update', 'topic', id, changes)

  return get(req, ctx, id)
}

export async function remove(req, ctx, id) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const row = await one(
    'UPDATE forum_topics SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING title, category_id',
    [id, mod.id]
  )
  if (!row) throw notFound('Тема не найдена')

  await logModeration(mod.id, 'topic.delete', 'topic', id, { title: row.title })
  return json({ ok: true })
}

export async function restore(req, ctx, id) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const row = await one(
    'UPDATE forum_topics SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 RETURNING title',
    [id]
  )
  if (!row) throw notFound('Тема не найдена')

  await logModeration(mod.id, 'topic.restore', 'topic', id, { title: row.title })
  return json({ ok: true })
}

export async function setSubscription(req, ctx, id, body) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  const subscribed = requireBool(body.subscribed)

  const topic = await one('SELECT id FROM forum_topics WHERE id = $1 AND deleted_at IS NULL', [id])
  if (!topic) throw notFound('Тема не найдена')

  if (subscribed) {
    await q(
      'INSERT INTO forum_topic_subscriptions (user_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, id]
    )
  } else {
    await q('DELETE FROM forum_topic_subscriptions WHERE user_id = $1 AND topic_id = $2', [user.id, id])
  }
  return json({ isSubscribed: subscribed })
}

export async function markRead(req, ctx, id, body) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  const postNumber = Number.parseInt(body.postNumber, 10)
  if (!Number.isSafeInteger(postNumber) || postNumber < 0) throw badRequest('Некорректный postNumber')

  await q(
    `INSERT INTO forum_topic_read_state (user_id, topic_id, last_read_post_number, read_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id, topic_id) DO UPDATE
       SET last_read_post_number = GREATEST(forum_topic_read_state.last_read_post_number, EXCLUDED.last_read_post_number),
           read_at = now()`,
    [user.id, id, postNumber]
  )
  return json({ ok: true })
}

export async function listSubscriptions(req, ctx) {
  const user = requireUser(ctx)
  const rows = await q(
    `${TOPIC_SELECT}
      JOIN forum_topic_subscriptions mysub ON mysub.topic_id = t.id AND mysub.user_id = $1
      WHERE t.deleted_at IS NULL
      ORDER BY t.last_post_at DESC
      LIMIT 100`,
    viewer(ctx)
  )
  return json({ topics: rows.map(shape.topic) })
}

/** Удалённые темы — для восстановления модератором. */
export async function listDeleted(req, ctx) {
  requireModerator(ctx)
  const rows = await q(
    `SELECT t.id, t.title, t.deleted_at, c.title AS category_title
       FROM forum_topics t JOIN forum_categories c ON c.id = t.category_id
      WHERE t.deleted_at IS NOT NULL ORDER BY t.deleted_at DESC LIMIT 50`
  )
  return json({
    topics: rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      categoryTitle: r.category_title,
      deletedAt: r.deleted_at,
    })),
  })
}
