// Мелкие помощники для Netlify Functions v2 (Request/Response).

export class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const badRequest = (m = 'Некорректный запрос') => new HttpError(400, m, 'bad_request')
export const unauthorized = (m = 'Нужна авторизация через Minecraft') => new HttpError(401, m, 'unauthorized')
export const forbidden = (m = 'Недостаточно прав') => new HttpError(403, m, 'forbidden')
export const notFound = (m = 'Не найдено') => new HttpError(404, m, 'not_found')
export const tooMany = (m = 'Слишком часто. Подождите немного') => new HttpError(429, m, 'rate_limited')

export function json(data, { status = 200, headers } = {}) {
  const h = new Headers(headers)
  h.set('Content-Type', 'application/json; charset=utf-8')
  if (!h.has('Cache-Control')) h.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data), { status, headers: h })
}

const MAX_BODY_BYTES = 64 * 1024

export async function readJson(req) {
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) throw badRequest('Слишком большой запрос')
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw badRequest()
    return parsed
  } catch (e) {
    if (e instanceof HttpError) throw e
    throw badRequest('Тело запроса не является JSON')
  }
}

/** Оборачивает обработчик: HttpError -> аккуратный JSON, остальное -> 500. */
export function handle(fn) {
  return async (req, context) => {
    try {
      return await fn(req, context)
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.message, code: e.code }, { status: e.status })
      }
      console.error('forum api error:', e)
      return json({ error: 'Внутренняя ошибка сервера', code: 'internal' }, { status: 500 })
    }
  }
}

/**
 * Разбирает путь после префикса: '/api/forum/topics/12/posts' -> ['topics','12','posts'].
 * Понимает и прямой путь функции (/.netlify/functions/forum/...), на случай
 * если запрос пришёл через redirect, а не через config.path.
 */
export function segments(req, prefix) {
  const path = new URL(req.url).pathname
  const fnPrefix = `/.netlify/functions${prefix.slice(prefix.lastIndexOf('/'))}`
  const base = path.startsWith(fnPrefix) ? fnPrefix : prefix
  return path.slice(base.length).split('/').filter(Boolean).map(decodeURIComponent)
}

export function intParam(value, { min = 1, max = 1e9, fallback = null } = {}) {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) {
    if (fallback === null) throw badRequest('Ожидалось число')
    return fallback
  }
  return Math.min(max, Math.max(min, n))
}
