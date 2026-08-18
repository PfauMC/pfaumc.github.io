// Клиент публичного API игрового бэкенда (pfaumc-backend, /api/v1/*).
//
// Ходим прямо из браузера: у бэкенда есть CORS-разрешение для pfaumc.io, поэтому
// прослойка на своём сервере не нужна и сайт остаётся статикой.
//
// Адрес задаётся на сборке через VITE_GAME_API_URL. Значение по умолчанию — боевой
// публичный хост; для локальной разработки положите свой в .env.local.
const BASE = (import.meta.env?.VITE_GAME_API_URL ?? 'https://auth.pfaumc.io').replace(/\/+$/, '')

export class GameApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
  get notFound() {
    return this.status === 404
  }
}

/**
 * `withSession` прикладывает куку сайта: почти всё здесь анонимно, но граф связей
 * узнаёт смотрящего именно по ней. Кука живёт на .pfaumc.io, а запрос уходит на
 * поддомен, поэтому без include она не поедет.
 */
export async function gameApi(path, { signal, withSession = false } = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      signal,
      headers: { Accept: 'application/json' },
      credentials: withSession ? 'include' : 'same-origin',
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new GameApiError('Нет связи с игровым сервером', 0)
  }
  if (!res.ok) {
    throw new GameApiError(res.status === 404 ? 'Не найдено' : 'Игровой сервер не ответил', res.status)
  }
  return res.json()
}

/**
 * Ярлык роли для интерфейса. Бэкенд отдаёт готовый текст в той же форме, что и
 * форум, поэтому одна роль читается одним кодом в обоих местах.
 */
const ROLE_LABELS = {
  default: 'Игрок',
  player: 'Игрок',
  vip: 'VIP',
  helper: 'Хелпер',
  builder: 'Строитель',
  moderator: 'Модератор',
  admin: 'Администратор',
  owner: 'Основатель',
}

export function roleLabel(role) {
  if (!role) return 'Игрок'
  return role.title ?? ROLE_LABELS[role.key] ?? role.key
}

/** Роли ниже этого приоритета не показываем бейджем — это дефолт для всех. */
export function isStaffRole(role) {
  return Boolean(role) && role.priority > 0
}

export const GAME_API_BASE = BASE
