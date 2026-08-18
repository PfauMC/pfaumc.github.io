import { q, one, tx, logModeration, checkPostRateLimit, checkTopicReplyCooldown } from './db.js'
import { badRequest, forbidden, notFound, tooMany, json, intParam } from './http.js'
import { requireUser, requireModerator, requireCsrf } from './auth.js'
import * as shape from './shape.js'
import { LIMITS, REACTIONS, REPORT_REASONS, requireText, optionalText, requireId } from './validate.js'
import { extractMentions, excerpt } from './markup.js'

export const PAGE_SIZE = 20

const POST_SELECT = `
  SELECT p.id, p.topic_id, p.author_id, p.post_number, p.body, p.created_at, p.edited_at, p.edited_by,
         p.deleted_at, p.reply_to_id,
         rp.post_number AS reply_to_number, ru.name AS reply_to_author,
         ${shape.authorFields('pu', 'a', 'pr')},
         pu.created_at AS a_joined_at,
         (SELECT count(*)::int FROM forum_posts fp
           WHERE fp.author_id = p.author_id AND fp.deleted_at IS NULL) AS a_post_count
    FROM forum_posts p
    JOIN forum_users pu ON pu.id = p.author_id
    JOIN forum_roles pr ON pr.key = pu.role_key
    LEFT JOIN forum_posts rp ON rp.id = p.reply_to_id
    LEFT JOIN forum_users ru ON ru.id = rp.author_id
`

async function loadTopicForRead(topicId, ctx) {
  const isMod = Boolean(ctx?.user.role.canModerate)
  const topic = await one(
    `SELECT t.id, t.is_locked, t.deleted_at, t.reply_cooldown_sec,
            c.is_active, c.is_visible, c.deleted_at AS category_deleted_at, t.title
       FROM forum_topics t JOIN forum_categories c ON c.id = t.category_id
      WHERE t.id = $1`,
    [topicId]
  )
  if (!topic) throw notFound('Тема не найдена')
  if (!isMod && (topic.deleted_at || topic.category_deleted_at || !topic.is_visible)) {
    throw notFound('Тема не найдена')
  }
  return topic
}

async function reactionsFor(postIds, userId) {
  if (!postIds.length) return new Map()
  const rows = await q(
    `SELECT post_id, emoji, count(*)::int AS count,
            COALESCE(bool_or(user_id = $2), false) AS mine
       FROM forum_post_reactions
      WHERE post_id = ANY($1::bigint[])
      GROUP BY post_id, emoji
      ORDER BY count DESC, emoji`,
    [postIds, userId]
  )
  const map = new Map()
  for (const r of rows) {
    const key = String(r.post_id)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push({ emoji: r.emoji, count: r.count, mine: r.mine })
  }
  return map
}

export async function listByTopic(req, ctx, topicId) {
  await loadTopicForRead(topicId, ctx)
  const isMod = Boolean(ctx?.user.role.canModerate)
  const url = new URL(req.url)
  const page = intParam(url.searchParams.get('page'), { fallback: 1, max: 100000 })

  const rows = await q(
    `${POST_SELECT}
      WHERE p.topic_id = $1
      ORDER BY p.post_number
      LIMIT $2 OFFSET $3`,
    [topicId, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  )
  const total = await one('SELECT count(*)::int AS n FROM forum_posts WHERE topic_id = $1', [topicId])

  const reactions = await reactionsFor(rows.map((r) => r.id), ctx?.user.id ?? null)
  const posts = rows.map((r) => {
    const item = shape.post(r, reactions.get(String(r.id)) ?? [])
    // Модератор видит текст удалённого сообщения — иначе нечего восстанавливать.
    if (item.isDeleted && isMod) item.body = r.body
    return item
  })

  return json({ posts, page, pageSize: PAGE_SIZE, total: total.n })
}

/** Вставка с повтором: post_number считается в том же запросе, гонку ловит UNIQUE. */
async function insertPost(topicId, authorId, body, replyToId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await one(
        `WITH nextnum AS (
           SELECT COALESCE(max(post_number), 0) + 1 AS n FROM forum_posts WHERE topic_id = $1
         ), ins AS (
           INSERT INTO forum_posts (topic_id, author_id, post_number, body, reply_to_id)
           SELECT $1, $2, nextnum.n, $3, $4 FROM nextnum
           RETURNING id, post_number
         ), bump AS (
           UPDATE forum_topics
              SET post_count = post_count + 1, last_post_at = now(), last_post_user_id = $2, updated_at = now()
            WHERE id = $1
         )
         SELECT id, post_number FROM ins`,
        [topicId, authorId, body, replyToId]
      )
    } catch (e) {
      if (e?.code !== '23505' || attempt === 2) throw e
    }
  }
  throw badRequest('Не удалось сохранить сообщение, попробуйте ещё раз')
}

export async function create(req, ctx, body) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)

  const topicId = requireId(body.topicId, 'topicId')
  const text = requireText(body.body, 'body', { ...LIMITS.body, label: 'Сообщение' })
  const replyToId = body.replyToPostId == null ? null : requireId(body.replyToPostId, 'replyToPostId')

  const topic = await loadTopicForRead(topicId, ctx)
  if (topic.deleted_at) throw forbidden('Тема удалена')
  if (topic.is_locked) throw forbidden('Тема закрыта для ответов')
  if (!topic.is_active) throw forbidden('Категория закрыта для новых сообщений')

  if (replyToId) {
    const target = await one('SELECT id FROM forum_posts WHERE id = $1 AND topic_id = $2 AND deleted_at IS NULL', [
      replyToId,
      topicId,
    ])
    if (!target) throw badRequest('Сообщение для ответа не найдено')
  }

  const limitError = await checkPostRateLimit(user.id)
  if (limitError) throw tooMany(limitError)

  if (!user.role.canModerate) {
    const cooldownError = await checkTopicReplyCooldown(user.id, topicId, topic.reply_cooldown_sec)
    if (cooldownError) throw tooMany(cooldownError)
  }

  const created = await insertPost(topicId, user.id, text, replyToId)

  const mentions = extractMentions(text)
  const payload = JSON.stringify({ topicTitle: topic.title, excerpt: excerpt(text, 120) })

  // Побочные эффекты публикации — одной транзакцией: уведомления,
  // автоподписка автора на тему и отметка «прочитано» до своего сообщения.
  await tx([
    // Уведомления одним запросом: упоминания > ответ на сообщение > подписка.
    q(
      `INSERT INTO forum_notifications (user_id, type, actor_id, topic_id, post_id, payload)
     SELECT DISTINCT ON (s.user_id) s.user_id, s.type, $1, $2, $3, $4::jsonb
       FROM (
         SELECT u.id AS user_id, 'mention'::text AS type, 1 AS priority
           FROM forum_users u
          WHERE u.name_lower = ANY($5::text[]) AND u.notify_mentions AND NOT u.is_banned
         UNION ALL
         SELECT p.author_id, 'reply', 2
           FROM forum_posts p JOIN forum_users u ON u.id = p.author_id
          WHERE p.id = $6 AND u.notify_replies AND NOT u.is_banned
         UNION ALL
         SELECT sub.user_id, 'topic_reply', 3
           FROM forum_topic_subscriptions sub JOIN forum_users u ON u.id = sub.user_id
          WHERE sub.topic_id = $2 AND u.notify_subscriptions AND NOT u.is_banned
       ) s
      WHERE s.user_id <> $1
      ORDER BY s.user_id, s.priority`,
      [user.id, topicId, created.id, payload, mentions, replyToId]
    ),
    q('INSERT INTO forum_topic_subscriptions (user_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      user.id,
      topicId,
    ]),
    q(
      `INSERT INTO forum_topic_read_state (user_id, topic_id, last_read_post_number, read_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id, topic_id) DO UPDATE SET last_read_post_number = EXCLUDED.last_read_post_number, read_at = now()`,
      [user.id, topicId, created.post_number]
    ),
  ])

  return json({ postId: String(created.id), postNumber: created.post_number }, { status: 201 })
}

export async function update(req, ctx, id, body) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  const text = requireText(body.body, 'body', { ...LIMITS.body, label: 'Сообщение' })

  const current = await one('SELECT id, author_id, topic_id, deleted_at FROM forum_posts WHERE id = $1', [id])
  if (!current || current.deleted_at) throw notFound('Сообщение не найдено')

  const isOwn = String(current.author_id) === String(user.id)
  if (!isOwn && !user.role.canModerate) throw forbidden('Можно редактировать только свои сообщения')
  if (isOwn) {
    const topic = await one('SELECT is_locked FROM forum_topics WHERE id = $1', [current.topic_id])
    if (topic?.is_locked && !user.role.canModerate) throw forbidden('Тема закрыта')
  }

  await q('UPDATE forum_posts SET body = $2, edited_at = now(), edited_by = $3, updated_at = now() WHERE id = $1', [
    id,
    text,
    user.id,
  ])

  if (!isOwn) {
    await logModeration(user.id, 'post.edit', 'post', id, { topicId: String(current.topic_id) })
    await notifyModeration(current.author_id, user.id, current.topic_id, id, 'post.edit')
  }

  return json({ ok: true })
}

export async function remove(req, ctx, id) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)

  const current = await one(
    'SELECT id, author_id, topic_id, post_number, deleted_at FROM forum_posts WHERE id = $1',
    [id]
  )
  if (!current || current.deleted_at) throw notFound('Сообщение не найдено')

  const isOwn = String(current.author_id) === String(user.id)
  if (!isOwn && !user.role.canModerate) throw forbidden('Можно удалять только свои сообщения')
  if (current.post_number === 1 && !user.role.canModerate) {
    throw forbidden('Первое сообщение темы может удалить только модератор')
  }

  // Скрытие и пересчёт счётчиков темы — одной транзакцией.
  await tx([
    q(`UPDATE forum_posts SET deleted_at = now(), deleted_by = $2, updated_at = now() WHERE id = $1`, [id, user.id]),
    recountTopic(current.topic_id),
  ])

  if (!isOwn) {
    await logModeration(user.id, 'post.delete', 'post', id, { topicId: String(current.topic_id) })
    await notifyModeration(current.author_id, user.id, current.topic_id, id, 'post.delete')
  }
  return json({ ok: true })
}

export async function restore(req, ctx, id) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const row = await one(
    'UPDATE forum_posts SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING topic_id',
    [id]
  )
  if (!row) throw notFound('Сообщение не найдено')
  await recountTopic(row.topic_id)
  await logModeration(mod.id, 'post.restore', 'post', id, { topicId: String(row.topic_id) })
  return json({ ok: true })
}

/** Пересчёт счётчика и последнего сообщения темы — без дрейфа после удалений. */
function recountTopic(topicId) {
  return q(
    `UPDATE forum_topics t
        SET post_count = COALESCE(agg.n, 0),
            last_post_at = COALESCE(agg.last_at, t.created_at),
            last_post_user_id = agg.last_author
       FROM (SELECT count(*)::int AS n,
                    max(created_at) AS last_at,
                    (SELECT author_id FROM forum_posts
                      WHERE topic_id = $1 AND deleted_at IS NULL
                      ORDER BY created_at DESC LIMIT 1) AS last_author
               FROM forum_posts WHERE topic_id = $1 AND deleted_at IS NULL) agg
      WHERE t.id = $1`,
    [topicId]
  )
}

function notifyModeration(userId, actorId, topicId, postId, action) {
  return q(
    `INSERT INTO forum_notifications (user_id, type, actor_id, topic_id, post_id, payload)
     SELECT $1::bigint, 'moderation', $2::bigint, $3::bigint, $4::bigint, $5::jsonb
      WHERE $1::bigint <> $2::bigint`,
    [userId, actorId, topicId, postId, JSON.stringify({ action })]
  )
}

export async function react(req, ctx, id, body) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  const emoji = typeof body.emoji === 'string' ? body.emoji : ''
  if (!REACTIONS.includes(emoji)) throw badRequest('Недопустимая реакция')

  const post = await one('SELECT id FROM forum_posts WHERE id = $1 AND deleted_at IS NULL', [id])
  if (!post) throw notFound('Сообщение не найдено')

  const removed = await one(
    'DELETE FROM forum_post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3 RETURNING post_id',
    [id, user.id, emoji]
  )
  if (!removed) {
    await q('INSERT INTO forum_post_reactions (post_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
      id,
      user.id,
      emoji,
    ])
  }

  const map = await reactionsFor([id], user.id)
  return json({ reactions: map.get(String(id)) ?? [] })
}

export async function report(req, ctx, id, body) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  const reason = typeof body.reason === 'string' ? body.reason : ''
  if (!REPORT_REASONS.includes(reason)) throw badRequest('Выберите причину жалобы')
  const comment = optionalText(body.comment, { max: LIMITS.reason.max, label: 'Комментарий' })

  const post = await one('SELECT id, author_id FROM forum_posts WHERE id = $1 AND deleted_at IS NULL', [id])
  if (!post) throw notFound('Сообщение не найдено')
  if (String(post.author_id) === String(user.id)) throw badRequest('Нельзя пожаловаться на своё сообщение')

  const row = await one(
    `INSERT INTO forum_post_reports (post_id, reporter_id, reason, comment)
     VALUES ($1, $2, $3, $4) ON CONFLICT (post_id, reporter_id) DO NOTHING RETURNING id`,
    [id, user.id, reason, comment || null]
  )
  if (!row) return json({ ok: true, alreadyReported: true })
  return json({ ok: true }, { status: 201 })
}

/** «Мои ответы» — последние сообщения текущего пользователя. */
export async function listMine(req, ctx) {
  const user = requireUser(ctx)
  const page = intParam(new URL(req.url).searchParams.get('page'), { fallback: 1, max: 500 })

  const rows = await q(
    `SELECT p.id, p.topic_id, p.post_number, p.body, p.created_at, p.deleted_at,
            t.title AS topic_title, c.slug AS category_slug, c.title AS category_title
       FROM forum_posts p
       JOIN forum_topics t ON t.id = p.topic_id
       JOIN forum_categories c ON c.id = t.category_id
      WHERE p.author_id = $1 AND p.deleted_at IS NULL AND t.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
    [user.id, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  )
  const total = await one(
    `SELECT count(*)::int AS n FROM forum_posts p JOIN forum_topics t ON t.id = p.topic_id
      WHERE p.author_id = $1 AND p.deleted_at IS NULL AND t.deleted_at IS NULL`,
    [user.id]
  )

  return json({
    posts: rows.map((r) => ({
      id: String(r.id),
      topicId: String(r.topic_id),
      topicTitle: r.topic_title,
      categorySlug: r.category_slug,
      categoryTitle: r.category_title,
      postNumber: r.post_number,
      excerpt: excerpt(r.body, 180),
      createdAt: r.created_at,
    })),
    page,
    pageSize: PAGE_SIZE,
    total: total.n,
  })
}
