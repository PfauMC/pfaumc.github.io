import { q, one, logModeration } from './db.js'
import { badRequest, json, notFound, intParam } from './http.js'
import { requireModerator, requireCsrf } from './auth.js'
import * as shape from './shape.js'
import { LIMITS, optionalText } from './validate.js'
import { excerpt } from './markup.js'

const PAGE_SIZE = 25

export async function listReports(req, ctx) {
  requireModerator(ctx)
  const url = new URL(req.url)
  const status = ['open', 'resolved', 'rejected'].includes(url.searchParams.get('status'))
    ? url.searchParams.get('status')
    : 'open'
  const page = intParam(url.searchParams.get('page'), { fallback: 1, max: 500 })

  const rows = await q(
    `SELECT rep.id, rep.post_id, rep.reason, rep.comment, rep.status, rep.note,
            rep.created_at, rep.resolved_at,
            p.post_number, p.body, p.deleted_at AS post_deleted_at,
            t.id AS topic_id, t.title AS topic_title,
            ${shape.authorFields('rpu', 'rp', 'rpr')},
            ${shape.authorFields('pau', 'pa', 'par')}
       FROM forum_post_reports rep
       JOIN forum_posts p ON p.id = rep.post_id
       JOIN forum_topics t ON t.id = p.topic_id
       JOIN forum_users rpu ON rpu.id = rep.reporter_id
       JOIN forum_roles rpr ON rpr.key = rpu.role_key
       JOIN forum_users pau ON pau.id = p.author_id
       JOIN forum_roles par ON par.key = pau.role_key
      WHERE rep.status = $1
      ORDER BY rep.created_at DESC
      LIMIT $2 OFFSET $3`,
    [status, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  )

  const counts = await one(
    `SELECT count(*) FILTER (WHERE status = 'open')::int AS open,
            count(*) FILTER (WHERE status = 'resolved')::int AS resolved,
            count(*) FILTER (WHERE status = 'rejected')::int AS rejected
       FROM forum_post_reports`
  )

  return json({
    reports: rows.map((r) => ({
      ...shape.report({ ...r, excerpt: excerpt(r.body, 220) }),
      comment: r.comment,
      postDeleted: Boolean(r.post_deleted_at),
    })),
    counts,
    status,
    page,
    pageSize: PAGE_SIZE,
  })
}

export async function updateReport(req, ctx, id, body) {
  const mod = requireModerator(ctx)
  requireCsrf(req, ctx)

  const status = body.status
  if (!['resolved', 'rejected', 'open'].includes(status)) throw badRequest('Некорректный статус жалобы')
  const note = optionalText(body.note, { max: LIMITS.note.max, label: 'Комментарий' })

  const row = await one(
    `UPDATE forum_post_reports
        SET status = $2,
            note = $3,
            resolved_at = CASE WHEN $2 = 'open' THEN NULL ELSE now() END,
            resolved_by = CASE WHEN $2 = 'open' THEN NULL ELSE $4::bigint END
      WHERE id = $1
      RETURNING post_id`,
    [id, status, note || null, mod.id]
  )
  if (!row) throw notFound('Жалоба не найдена')

  await logModeration(mod.id, `report.${status}`, 'report', id, { postId: String(row.post_id) })
  return json({ ok: true })
}

export async function listLog(req, ctx) {
  requireModerator(ctx)
  const page = intParam(new URL(req.url).searchParams.get('page'), { fallback: 1, max: 500 })

  const rows = await q(
    `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at,
            ${shape.authorFields('mu', 'm', 'mr')}
       FROM forum_moderation_log l
       JOIN forum_users mu ON mu.id = l.moderator_id
       JOIN forum_roles mr ON mr.key = mu.role_key
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2`,
    [PAGE_SIZE, (page - 1) * PAGE_SIZE]
  )
  const total = await one('SELECT count(*)::int AS n FROM forum_moderation_log')

  return json({ entries: rows.map(shape.modLogEntry), page, pageSize: PAGE_SIZE, total: total.n })
}
