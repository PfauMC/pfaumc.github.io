// Единая точка входа форумного API: /api/forum/*
// Netlify Functions v2 (Request -> Response).
import { handle, json, notFound, badRequest, readJson, segments } from './_lib/forum/http.js'
import { getSession } from './_lib/forum/auth.js'
import { requireId } from './_lib/forum/validate.js'
import * as categories from './_lib/forum/categories.js'
import * as topics from './_lib/forum/topics.js'
import * as posts from './_lib/forum/posts.js'
import * as notifications from './_lib/forum/notifications.js'
import * as moderation from './_lib/forum/moderation.js'
import { search } from './_lib/forum/search.js'

export const config = { path: '/api/forum/*' }

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export default handle(async (req) => {
  const seg = segments(req, '/api/forum')
  const method = req.method
  const ctx = await getSession(req)
  const body = WRITE_METHODS.has(method) ? await readJson(req) : {}

  const at = (i) => seg[i]
  const is = (...parts) =>
    seg.length === parts.length && parts.every((p, i) => (p === '*' ? true : p === seg[i]))

  // ---- Разделы ----
  if (is('groups') && method === 'POST') return categories.createGroup(req, ctx, body)
  if (is('groups', 'reorder') && method === 'POST') return categories.reorderGroups(req, ctx, body)
  if (is('groups', '*')) {
    const id = requireId(at(1), 'id')
    if (method === 'PATCH') return categories.updateGroup(req, ctx, id, body)
    if (method === 'DELETE') return categories.removeGroup(req, ctx, id)
  }

  // ---- Категории ----
  if (is('categories')) {
    if (method === 'GET') return categories.list(req, ctx)
    if (method === 'POST') return categories.create(req, ctx, body)
  }
  if (is('categories', 'reorder') && method === 'POST') return categories.reorder(req, ctx, body)
  if (is('categories', 'deleted') && method === 'GET') return categories.listDeleted(req, ctx)
  if (is('categories', '*')) {
    if (method === 'GET') return json({ category: await categories.getBySlug(at(1), ctx) })
    if (method === 'PATCH') return categories.update(req, ctx, requireId(at(1), 'id'), body)
    if (method === 'DELETE') return categories.remove(req, ctx, requireId(at(1), 'id'))
  }
  if (is('categories', '*', 'restore') && method === 'POST') {
    return categories.restore(req, ctx, requireId(at(1), 'id'))
  }
  if (is('categories', '*', 'topics') && method === 'GET') return topics.listByCategory(req, ctx, at(1))

  // ---- Темы ----
  if (is('topics') && method === 'POST') return topics.create(req, ctx, body)
  if (is('topics', 'deleted') && method === 'GET') return topics.listDeleted(req, ctx)
  if (is('topics', '*')) {
    const id = requireId(at(1), 'id')
    if (method === 'GET') return topics.get(req, ctx, id)
    if (method === 'PATCH') return topics.update(req, ctx, id, body)
    if (method === 'DELETE') return topics.remove(req, ctx, id)
  }
  if (is('topics', '*', 'restore') && method === 'POST') return topics.restore(req, ctx, requireId(at(1), 'id'))
  if (is('topics', '*', 'posts') && method === 'GET') return posts.listByTopic(req, ctx, requireId(at(1), 'id'))
  if (is('topics', '*', 'subscription') && method === 'PUT') {
    return topics.setSubscription(req, ctx, requireId(at(1), 'id'), body)
  }
  if (is('topics', '*', 'read') && method === 'POST') return topics.markRead(req, ctx, requireId(at(1), 'id'), body)
  if (is('subscriptions') && method === 'GET') return topics.listSubscriptions(req, ctx)

  // ---- Сообщения ----
  if (is('posts') && method === 'POST') return posts.create(req, ctx, body)
  if (is('posts', '*')) {
    const id = requireId(at(1), 'id')
    if (method === 'PATCH') return posts.update(req, ctx, id, body)
    if (method === 'DELETE') return posts.remove(req, ctx, id)
  }
  if (is('posts', '*', 'restore') && method === 'POST') return posts.restore(req, ctx, requireId(at(1), 'id'))
  if (is('posts', '*', 'reactions') && method === 'PUT') return posts.react(req, ctx, requireId(at(1), 'id'), body)
  if (is('posts', '*', 'report') && method === 'POST') return posts.report(req, ctx, requireId(at(1), 'id'), body)
  if (is('my-posts') && method === 'GET') return posts.listMine(req, ctx)

  // ---- Поиск ----
  if (is('search') && method === 'GET') return search(req, ctx)

  // ---- Уведомления ----
  if (is('notifications') && method === 'GET') return notifications.list(req, ctx)
  if (is('notifications', 'read-all') && method === 'POST') return notifications.markAllRead(req, ctx)
  if (is('notifications', '*', 'read') && method === 'POST') {
    return notifications.markRead(req, ctx, requireId(at(1), 'id'))
  }

  // ---- Модерация ----
  if (is('reports') && method === 'GET') return moderation.listReports(req, ctx)
  if (is('reports', '*') && method === 'PATCH') return moderation.updateReport(req, ctx, requireId(at(1), 'id'), body)
  if (is('moderation-log') && method === 'GET') return moderation.listLog(req, ctx)

  throw seg.length ? notFound('Неизвестный маршрут API') : badRequest()
})
