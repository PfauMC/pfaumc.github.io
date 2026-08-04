// Тонкая обёртка над fetch для форумного API.
// Сессия живёт в HttpOnly-cookie, поэтому токенов в localStorage нет и быть
// не может; наружу отдаём только CSRF-токен из читаемой cookie.

const CSRF_COOKIE = 'pfau_csrf'

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
  get needsAuth() {
    return this.status === 401
  }
}

function readCsrfCookie() {
  const match = document.cookie.match(/(?:^|;\s*)pfau_csrf=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') headers['X-CSRF-Token'] = readCsrfCookie()

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('Нет соединения с сервером', 0, 'network')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error ?? 'Что-то пошло не так', res.status, data.code)
  return data
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE
