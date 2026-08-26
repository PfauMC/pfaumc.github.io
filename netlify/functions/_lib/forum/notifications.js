import { q, one } from './db.js'
import { json, notFound } from './http.js'
import { requireUser, requireCsrf } from './auth.js'
import * as shape from './shape.js'

const LIMIT = 30

export async function list(req, ctx) {
  const user = requireUser(ctx)

  const rows = await q(
    `SELECT n.id, n.type, n.read_at, n.created_at, n.topic_id, n.post_id, n.payload,
            t.title AS topic_title, p.post_number,
            ${shape.authorFields('acu', 'ac', 'acr')}
       FROM forum_notifications n
       LEFT JOIN forum_topics t ON t.id = n.topic_id
       LEFT JOIN forum_posts p ON p.id = n.post_id
       LEFT JOIN forum_users acu ON acu.id = n.actor_id
       LEFT JOIN forum_roles acr ON acr.key = acu.role_key
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2`,
    [user.id, LIMIT]
  )

  const unread = await one(
    'SELECT count(*)::int AS n FROM forum_notifications WHERE user_id = $1 AND read_at IS NULL',
    [user.id]
  )

  return json({ notifications: rows.map(shape.notification), unreadCount: unread.n })
}

export async function markAllRead(req, ctx) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  await q('UPDATE forum_notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [user.id])
  return json({ ok: true })
}

export async function markRead(req, ctx, id) {
  const user = requireUser(ctx)
  requireCsrf(req, ctx)
  const row = await one(
    'UPDATE forum_notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, user.id]
  )
  if (!row) throw notFound('Уведомление не найдено')
  return json({ ok: true })
}
