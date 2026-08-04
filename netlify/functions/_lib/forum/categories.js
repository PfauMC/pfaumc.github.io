import { q, one, logModeration } from './db.js'
import { badRequest, notFound, json } from './http.js'
import { requireModerator, requireCsrf } from './auth.js'
import * as shape from './shape.js'
import { LIMITS, requireText, optionalText, requireBool, slugify } from './validate.js'

const CATEGORY_SELECT = `
  SELECT c.id, c.slug, c.title, c.description, c.icon, c.position, c.is_visible, c.is_active,
         COALESCE(agg.topic_count, 0)::int  AS topic_count,
         COALESCE(agg.post_count, 0)::int   AS post_count,
         lp.id AS last_post_id, lp.post_number AS last_post_number, lp.created_at AS last_post_at,
         lt.id AS last_topic_id, lt.title AS last_topic_title,
         ${shape.authorFields('lpu', 'lp', 'lpr')},
         COALESCE(unread.has_unread, false) AS has_unread
    FROM forum_categories c
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS topic_count, COALESCE(sum(t.post_count), 0)::int AS post_count
        FROM forum_topics t
       WHERE t.category_id = c.id AND t.deleted_at IS NULL
    ) agg ON true
    LEFT JOIN LATERAL (
      SELECT p.id, p.post_number, p.created_at, p.author_id, p.topic_id
        FROM forum_posts p
        JOIN forum_topics t ON t.id = p.topic_id
       WHERE t.category_id = c.id AND t.deleted_at IS NULL AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT 1
    ) lp ON true
    LEFT JOIN forum_topics lt ON lt.id = lp.topic_id
    LEFT JOIN forum_users lpu ON lpu.id = lp.author_id
    LEFT JOIN forum_roles lpr ON lpr.key = lpu.role_key
    LEFT JOIN LATERAL (
      SELECT EXISTS (
        SELECT 1
          FROM forum_topics t2
          LEFT JOIN forum_topic_read_state rs ON rs.topic_id = t2.id AND rs.user_id = $1
         WHERE $1::bigint IS NOT NULL
           AND t2.category_id = c.id AND t2.deleted_at IS NULL
           AND t2.last_post_at > COALESCE(rs.read_at, $2::timestamptz)
      ) AS has_unread
    ) unread ON true
   WHERE c.deleted_at IS NULL AND ($3 OR c.is_visible)
`

function viewerParams(ctx) {
  return [ctx?.user.id ?? null, ctx?.user.createdAt ?? null, Boolean(ctx?.user.role.canModerate)]
}

export async function list(req, ctx) {
  const rows = await q(`${CATEGORY_SELECT} ORDER BY c.position, c.id`, viewerParams(ctx))
  return json({ categories: rows.map(shape.category) })
}

export async function getBySlug(slug, ctx) {
  const rows = await q(`${CATEGORY_SELECT} AND c.slug = $4 LIMIT 1`, [...viewerParams(ctx), slug])
  if (!rows[0]) throw notFound('Категория не найдена')
  return shape.category(rows[0])
}

async function uniqueSlug(title, excludeId = null) {
  const base = slugify(title)
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const taken = await one('SELECT id FROM forum_categories WHERE slug = $1 AND ($2::bigint IS NULL OR id <> $2)', [
      candidate,
      excludeId,
    ])
    if (!taken) return candidate
  }
  return `${base}-${Date.now().toString(36)}`
}

export async function create(req, ctx, body) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const title = requireText(body.title, 'title', { ...LIMITS.title, label: 'Название' })
  const description = optionalText(body.description, { max: LIMITS.description.max, label: 'Описание' })
  const icon = optionalText(body.icon, { max: LIMITS.icon.max, label: 'Иконка' }) || '💬'
  const slug = await uniqueSlug(title)

  const row = await one(
    `INSERT INTO forum_categories (slug, title, description, icon, position, is_visible, is_active)
     VALUES ($1, $2, $3, $4,
             COALESCE((SELECT max(position) + 1 FROM forum_categories WHERE deleted_at IS NULL), 0),
             $5, $6)
     RETURNING id`,
    [slug, title, description, icon, requireBool(body.isVisible, true), requireBool(body.isActive, true)]
  )

  await logModeration(mod.id, 'category.create', 'category', row.id, { title })
  return json({ category: await getBySlug(slug, ctx) }, { status: 201 })
}

export async function update(req, ctx, id, body) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const current = await one('SELECT * FROM forum_categories WHERE id = $1 AND deleted_at IS NULL', [id])
  if (!current) throw notFound('Категория не найдена')

  const title = body.title == null ? current.title : requireText(body.title, 'title', { ...LIMITS.title, label: 'Название' })
  const description =
    body.description == null
      ? current.description
      : optionalText(body.description, { max: LIMITS.description.max, label: 'Описание' })
  const icon = body.icon == null ? current.icon : optionalText(body.icon, { max: LIMITS.icon.max }) || '💬'
  const isVisible = requireBool(body.isVisible, current.is_visible)
  const isActive = requireBool(body.isActive, current.is_active)
  const slug = title === current.title ? current.slug : await uniqueSlug(title, id)

  await q(
    `UPDATE forum_categories
        SET title = $2, slug = $3, description = $4, icon = $5, is_visible = $6, is_active = $7, updated_at = now()
      WHERE id = $1`,
    [id, title, slug, description, icon, isVisible, isActive]
  )

  await logModeration(mod.id, 'category.update', 'category', id, { title })
  return json({ category: await getBySlug(slug, ctx) })
}

export async function reorder(req, ctx, body) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const ids = Array.isArray(body.ids) ? body.ids.map((v) => Number.parseInt(v, 10)) : []
  if (!ids.length || ids.some((n) => !Number.isSafeInteger(n) || n <= 0)) throw badRequest('Ожидался список id категорий')

  // Один запрос: позиция = индекс в переданном массиве.
  await q(
    `UPDATE forum_categories c
        SET position = ordered.position, updated_at = now()
       FROM (SELECT id, ordinality - 1 AS position FROM unnest($1::bigint[]) WITH ORDINALITY AS t(id, ordinality)) ordered
      WHERE c.id = ordered.id`,
    [ids]
  )

  await logModeration(mod.id, 'category.reorder', 'category', null, { ids })
  return list(req, ctx)
}

export async function remove(req, ctx, id) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const row = await one(
    'UPDATE forum_categories SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING title',
    [id, mod.id]
  )
  if (!row) throw notFound('Категория не найдена')

  await logModeration(mod.id, 'category.delete', 'category', id, { title: row.title })
  return json({ ok: true })
}

export async function restore(req, ctx, id) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const row = await one(
    'UPDATE forum_categories SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 RETURNING slug',
    [id]
  )
  if (!row) throw notFound('Категория не найдена')

  await logModeration(mod.id, 'category.restore', 'category', id, {})
  return json({ category: await getBySlug(row.slug, ctx) })
}

/** Удалённые категории — только для модераторов (восстановление). */
export async function listDeleted(req, ctx) {
  requireModerator(ctx)
  const rows = await q(
    `SELECT id, slug, title, icon, deleted_at FROM forum_categories WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 50`
  )
  return json({
    categories: rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      title: r.title,
      icon: r.icon,
      deletedAt: r.deleted_at,
    })),
  })
}
