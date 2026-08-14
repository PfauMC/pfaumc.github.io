// Тонкая обёртка над fetch для форумного API.
//
// Форум живёт в игровом бэкенде (auth.pfaumc.io/api/v1/forum/*): сайт — статика,
// исполнять серверный код здесь негде. Куки общие для pfaumc.io и auth.pfaumc.io,
// поэтому это один сайт для браузера, а не третья сторона.
//
// Сессия живёт в HttpOnly-cookie, поэтому токенов в localStorage нет и быть
// не может; наружу отдаём только CSRF-токен из читаемой cookie.
import { GAME_API_BASE } from './gameApi'

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

/** API говорит snake_case, интерфейс — camelCase. Переводим на границе, а не в каждом компоненте. */
function convertKeys(value, rename) {
  if (Array.isArray(value)) return value.map((v) => convertKeys(v, rename))
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [rename(k), convertKeys(v, rename)]))
}

const toCamel = (k) => k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
const toSnake = (k) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') headers['X-CSRF-Token'] = readCsrfCookie()

  // Пути в компонентах остались прежними (/forum/... и /auth/...) — префикс один на всех.
  const url = `${GAME_API_BASE}/api/v1/forum${path.startsWith('/forum') ? path.slice(6) : path}`

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      // Кука сессии живёт на .pfaumc.io, а запрос уходит на поддомен — без include не поедет.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(convertKeys(body, toSnake)),
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('Нет соединения с сервером', 0, 'network')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error ?? 'Что-то пошло не так', res.status, data.code)
  return convertKeys(data, toCamel)
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE
