// Авторизация через Minecraft: /api/auth/*
// Плагин выдаёт одноразовый токен, сайт его обменивает на серверную сессию.
import { handle, json, readJson, segments, badRequest, notFound, unauthorized, tooMany, HttpError } from './_lib/forum/http.js'
import {
  SESSION_COOKIE,
  CSRF_COOKIE,
  clearCookie,
  createSession,
  getSession,
  requireCsrf,
  requireUser,
  revokeAllSessions,
  revokeSession,
  safeEqual,
  sha256,
  randomToken,
  shapeUser,
  touchSession,
} from './_lib/forum/auth.js'
import { q, one } from './_lib/forum/db.js'
import { isValidMcName, isValidUuid, requireBool, requireSignature } from './_lib/forum/validate.js'

export const config = { path: '/api/auth/*' }

const TOKEN_TTL_SEC = Number.parseInt(process.env.FORUM_LOGIN_TOKEN_TTL_SEC ?? '300', 10) || 300
const TOKEN_BURST = 5
const TOKEN_BURST_WINDOW_SEC = 60

function siteUrl() {
  return (process.env.FORUM_SITE_URL || process.env.URL || 'https://pfaumc.io').replace(/\/+$/, '')
}

function withCookies(response, cookies) {
  if (!cookies?.length) return response
  const headers = new Headers(response.headers)
  for (const cookie of cookies) headers.append('set-cookie', cookie)
  return new Response(response.body, { status: response.status, headers })
}

/** POST /api/auth/login-token — вызывает Minecraft-плагин по команде /login. */
async function issueLoginToken(req, body) {
  const secret = process.env.FORUM_PLUGIN_SECRET
  if (!secret) throw new HttpError(503, 'Интеграция с сервером не настроена', 'not_configured')

  const header = req.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!provided || !safeEqual(provided, secret)) throw unauthorized('Неверный секрет плагина')

  const uuid = typeof body.uuid === 'string' ? body.uuid.toLowerCase() : ''
  const name = typeof body.name === 'string' ? body.name : ''
  if (!isValidUuid(uuid)) throw badRequest('Некорректный uuid')
  if (!isValidMcName(name)) throw badRequest('Некорректный ник')

  const recent = await one(
    `SELECT count(*)::int AS n FROM forum_login_tokens
      WHERE mc_uuid = $1 AND created_at > now() - ($2 || ' seconds')::interval`,
    [uuid, String(TOKEN_BURST_WINDOW_SEC)]
  )
  if (recent.n >= TOKEN_BURST) throw tooMany('Слишком много запросов входа. Попробуйте через минуту')

  const token = randomToken()
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SEC * 1000)

  await q(
    `INSERT INTO forum_login_tokens (token_hash, mc_uuid, mc_name, expires_at) VALUES ($1, $2, $3, $4)`,
    [sha256(token), uuid, name, expiresAt.toISOString()]
  )
  // Уборка мусора: просроченные токены старше суток не нужны.
  await q("DELETE FROM forum_login_tokens WHERE expires_at < now() - interval '1 day'")

  return json({
    url: `${siteUrl()}/auth/game?token=${token}`,
    token,
    expiresIn: TOKEN_TTL_SEC,
    expiresAt: expiresAt.toISOString(),
  })
}

/** POST /api/auth/game — обмен одноразового токена на сессию. */
async function consumeLoginToken(req, body) {
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token || token.length > 200) throw badRequest('Токен не передан')
  const remember = requireBool(body.remember, false)

  // Помечаем использованным тем же запросом — повторно токен не сработает.
  const claimed = await one(
    `UPDATE forum_login_tokens SET used_at = now()
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
      RETURNING mc_uuid, mc_name`,
    [sha256(token)]
  )
  if (!claimed) throw new HttpError(410, 'Ссылка недействительна или уже использована. Введите /login ещё раз', 'token_invalid')

  const skinUrl = typeof body.skinUrl === 'string' && body.skinUrl.startsWith('https://') ? body.skinUrl : null

  const user = await one(
    `INSERT INTO forum_users (mc_uuid, name, name_lower, skin_url, last_login_at)
     VALUES ($1, $2, lower($2), $3, now())
     ON CONFLICT (mc_uuid) DO UPDATE
       SET name = EXCLUDED.name,
           name_lower = EXCLUDED.name_lower,
           skin_url = COALESCE(EXCLUDED.skin_url, forum_users.skin_url),
           last_login_at = now(),
           updated_at = now()
     RETURNING id`,
    [claimed.mc_uuid, claimed.mc_name, skinUrl]
  )

  const { cookies, csrf } = await createSession(req, user.id, remember)
  const fresh = await loadUser(user.id)
  return withCookies(json({ user: fresh.user, csrfToken: csrf }), cookies)
}

async function loadUser(userId) {
  const row = await one(
    `SELECT u.id, u.mc_uuid, u.name, u.skin_url, u.role_key, u.is_banned, u.ban_reason,
            u.forum_banned, u.forum_ban_reason,
            u.notify_replies, u.notify_mentions, u.notify_subscriptions,
            u.signature, u.show_signatures, u.created_at, u.last_login_at,
            r.title AS role_title, r.color AS role_color, r.can_moderate
       FROM forum_users u JOIN forum_roles r ON r.key = u.role_key
      WHERE u.id = $1`,
    [userId]
  )
  return { user: shapeUser(row) }
}

export default handle(async (req) => {
  const seg = segments(req, '/api/auth')
  const method = req.method
  const route = seg.join('/')
  const body = method === 'GET' ? {} : await readJson(req)

  if (route === 'login-token' && method === 'POST') return issueLoginToken(req, body)
  if (route === 'game' && method === 'POST') return consumeLoginToken(req, body)

  if (route === 'me' && method === 'GET') {
    const ctx = await getSession(req)
    if (!ctx) return json({ user: null, csrfToken: null, unreadCount: 0 })

    const rotated = await touchSession(req, ctx)
    const unread = await one(
      'SELECT count(*)::int AS n FROM forum_notifications WHERE user_id = $1 AND read_at IS NULL',
      [ctx.user.id]
    )
    return withCookies(
      json({ user: ctx.user, csrfToken: ctx.session.csrfToken, unreadCount: unread.n }),
      rotated
    )
  }

  if (route === 'logout' && method === 'POST') {
    const ctx = await getSession(req)
    if (ctx) {
      requireCsrf(req, ctx)
      await revokeSession(ctx.session.id)
    }
    return withCookies(json({ ok: true }), [clearCookie(SESSION_COOKIE, req), clearCookie(CSRF_COOKIE, req)])
  }

  if (route === 'logout-all' && method === 'POST') {
    const ctx = await getSession(req)
    const user = requireUser(ctx)
    requireCsrf(req, ctx)
    await revokeAllSessions(user.id)
    return withCookies(json({ ok: true }), [clearCookie(SESSION_COOKIE, req), clearCookie(CSRF_COOKIE, req)])
  }

  if (route === 'settings' && method === 'PATCH') {
    const ctx = await getSession(req)
    const user = requireUser(ctx)
    requireCsrf(req, ctx)

    await q(
      `UPDATE forum_users
          SET notify_replies = $2, notify_mentions = $3, notify_subscriptions = $4,
              signature = $5, show_signatures = $6, updated_at = now()
        WHERE id = $1`,
      [
        user.id,
        requireBool(body.notifyReplies, user.notify.replies),
        requireBool(body.notifyMentions, user.notify.mentions),
        requireBool(body.notifySubscriptions, user.notify.subscriptions),
        body.signature == null ? user.signature : requireSignature(body.signature),
        requireBool(body.showSignatures, user.showSignatures),
      ]
    )
    const fresh = await loadUser(user.id)
    return json({ user: fresh.user })
  }

  throw notFound('Неизвестный маршрут авторизации')
})
