import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { one, q } from './db.js'
import { forbidden, unauthorized, HttpError } from './http.js'

export const SESSION_COOKIE = 'pfau_sid'
export const CSRF_COOKIE = 'pfau_csrf'

const DAY_MS = 86400_000
const REMEMBER_DAYS = Number.parseInt(process.env.FORUM_SESSION_DAYS ?? '30', 10) || 30
const SHORT_SESSION_HOURS = 12
/** Ротация секрета сессии, если ей больше суток. */
const ROTATE_AFTER_MS = DAY_MS

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function readCookie(req, name) {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx < 0) continue
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim())
  }
  return null
}

function isSecure(req) {
  return new URL(req.url).protocol === 'https:'
}

export function buildCookie(name, value, { req, maxAgeSec, httpOnly = true }) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax']
  if (httpOnly) parts.push('HttpOnly')
  if (isSecure(req)) parts.push('Secure')
  if (maxAgeSec != null) parts.push(`Max-Age=${maxAgeSec}`)
  return parts.join('; ')
}

export function clearCookie(name, req) {
  return buildCookie(name, '', { req, maxAgeSec: 0, httpOnly: name === SESSION_COOKIE })
}

const USER_FIELDS = `
  u.id, u.mc_uuid, u.name, u.skin_url, u.role_key, u.is_banned, u.ban_reason,
  u.notify_replies, u.notify_mentions, u.notify_subscriptions,
  u.created_at, u.last_login_at,
  r.title AS role_title, r.color AS role_color, r.can_moderate
`

export function shapeUser(row) {
  if (!row) return null
  return {
    id: String(row.id),
    uuid: row.mc_uuid,
    name: row.name,
    skinUrl: row.skin_url,
    role: {
      key: row.role_key,
      title: row.role_title,
      color: row.role_color,
      canModerate: row.can_moderate,
    },
    isBanned: row.is_banned,
    banReason: row.ban_reason,
    notify: {
      replies: row.notify_replies,
      mentions: row.notify_mentions,
      subscriptions: row.notify_subscriptions,
    },
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

/**
 * Текущая сессия или null. Никогда не бросает — гость это нормальный режим.
 * Возвращает { user, session } с сырыми полями сессии.
 */
export async function getSession(req) {
  const raw = readCookie(req, SESSION_COOKIE)
  if (!raw) return null

  const row = await one(
    `SELECT s.id, s.user_id, s.csrf_token, s.remember, s.expires_at, s.last_used_at, ${USER_FIELDS}
       FROM forum_sessions s
       JOIN forum_users u ON u.id = s.user_id
       JOIN forum_roles r ON r.key = u.role_key
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
    [sha256(raw)]
  )
  if (!row) return null

  return {
    user: shapeUser(row),
    session: {
      id: String(row.id),
      csrfToken: row.csrf_token,
      remember: row.remember,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
    },
  }
}

export async function createSession(req, userId, remember) {
  const secret = randomToken()
  const csrf = randomToken(24)
  const ttlMs = remember ? REMEMBER_DAYS * DAY_MS : SHORT_SESSION_HOURS * 3600_000
  const expiresAt = new Date(Date.now() + ttlMs)

  await q(
    `INSERT INTO forum_sessions (user_id, token_hash, csrf_token, remember, user_agent, ip, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      sha256(secret),
      csrf,
      remember,
      (req.headers.get('user-agent') ?? '').slice(0, 200),
      (req.headers.get('x-nf-client-connection-ip') ?? '').slice(0, 60),
      expiresAt.toISOString(),
    ]
  )

  return { csrf, cookies: sessionCookies(req, secret, csrf, remember ? Math.floor(ttlMs / 1000) : null) }
}

function sessionCookies(req, secret, csrf, maxAgeSec) {
  return [
    buildCookie(SESSION_COOKIE, secret, { req, maxAgeSec }),
    // CSRF-cookie читается клиентом и отправляется обратно заголовком (double submit).
    buildCookie(CSRF_COOKIE, csrf, { req, maxAgeSec, httpOnly: false }),
  ]
}

/**
 * Продлевает и при необходимости ротирует секрет сессии.
 * ponytail: вызывается только из GET /api/auth/me — единственная точка, где
 * ответ и так персональный. Ротировать на каждом запросе смысла нет.
 */
export async function touchSession(req, ctx) {
  const stale = Date.now() - new Date(ctx.session.lastUsedAt).getTime() > ROTATE_AFTER_MS
  if (!stale) {
    await q('UPDATE forum_sessions SET last_used_at = now() WHERE id = $1', [ctx.session.id])
    return null
  }

  const secret = randomToken()
  const ttlMs = ctx.session.remember ? REMEMBER_DAYS * DAY_MS : SHORT_SESSION_HOURS * 3600_000
  await q(
    `UPDATE forum_sessions
        SET token_hash = $2, last_used_at = now(), expires_at = now() + ($3 || ' milliseconds')::interval
      WHERE id = $1`,
    [ctx.session.id, sha256(secret), String(ttlMs)]
  )
  return sessionCookies(req, secret, ctx.session.csrfToken, ctx.session.remember ? Math.floor(ttlMs / 1000) : null)
}

export async function revokeSession(sessionId) {
  await q('UPDATE forum_sessions SET revoked_at = now() WHERE id = $1', [sessionId])
}

export async function revokeAllSessions(userId) {
  await q('UPDATE forum_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId])
}

/** Требует авторизованного и незабаненного пользователя. */
export function requireUser(ctx) {
  if (!ctx) throw unauthorized()
  if (ctx.user.isBanned) {
    throw new HttpError(403, ctx.user.banReason ? `Доступ закрыт: ${ctx.user.banReason}` : 'Доступ закрыт', 'banned')
  }
  return ctx.user
}

export function requireModerator(ctx) {
  const user = requireUser(ctx)
  if (!user.role.canModerate) throw forbidden('Действие доступно только модераторам')
  return user
}

/**
 * Double-submit CSRF: заголовок должен совпасть с токеном сессии.
 * SameSite=Lax уже отсекает кросс-сайтовые POST, это второй рубеж.
 */
export function requireCsrf(req, ctx) {
  if (!ctx) throw unauthorized()
  const header = req.headers.get('x-csrf-token')
  if (!header || !safeEqual(header, ctx.session.csrfToken)) {
    throw forbidden('Некорректный CSRF-токен. Обновите страницу')
  }
}
