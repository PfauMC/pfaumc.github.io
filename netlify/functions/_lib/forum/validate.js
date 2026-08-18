import { badRequest } from './http.js'

export const LIMITS = {
  title: { min: 3, max: 140 },
  body: { min: 2, max: 10000 },
  description: { max: 300 },
  icon: { max: 8 },
  reason: { min: 3, max: 500 },
  note: { max: 500 },
  search: { max: 120 },
  replyCooldownSec: { min: 0, max: 86400 },
  signature: { max: 500 },
}

const SIGNATURE_MAX_LINES = 5
const SIGNATURE_MAX_IMAGES = 1
const SIGNATURE_IMAGE_TAG_RE = /<img:([^<>]*)>/gi
const SIGNATURE_IMAGE_URL_RE = /^https?:\/\/[^\s<>"']+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>"']*)?$/i

/**
 * Структурная проверка подписи (длина/строки/картинки). Безопасность от
 * XSS обеспечивает сам клиентский рендерер (renderSignature в markup.jsx) —
 * он никогда не превращает непонятные теги в HTML, так что здесь не парсим
 * теги заново, а только ограничиваем то, что реально портит вёрстку форума.
 */
export function requireSignature(raw) {
  const value = cleanText(raw)
  if (value.length > LIMITS.signature.max) throw badRequest(`Подпись: максимум ${LIMITS.signature.max} символов`)
  if (value.split('\n').length > SIGNATURE_MAX_LINES) throw badRequest(`Подпись: максимум ${SIGNATURE_MAX_LINES} строк`)

  const images = [...value.matchAll(SIGNATURE_IMAGE_TAG_RE)]
  if (images.length > SIGNATURE_MAX_IMAGES) throw badRequest('Подпись: можно прикрепить только один файл (фото или гифку)')
  for (const [, url] of images) {
    if (!SIGNATURE_IMAGE_URL_RE.test(url)) {
      throw badRequest('Подпись: ссылка на изображение должна вести на PNG/JPG/WEBP/GIF по http(s)')
    }
  }
  return value
}

/** Разрешённые реакции — эмодзи из белого списка, произвольные не принимаем. */
export const REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '😢']

export const REPORT_REASONS = ['spam', 'insult', 'offtopic', 'rules', 'other']

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/** Чистит текст от управляющих символов и лишних пустых строк. */
export function cleanText(raw) {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

export function requireText(raw, field, { min = 0, max = 1000, label = 'Поле' } = {}) {
  const value = cleanText(raw)
  if (value.length < min) throw badRequest(`${label}: минимум ${min} символов`)
  if (value.length > max) throw badRequest(`${label}: максимум ${max} символов`)
  return value
}

export function optionalText(raw, { max = 1000, label = 'Поле' } = {}) {
  if (raw == null) return ''
  const value = cleanText(raw)
  if (value.length > max) throw badRequest(`${label}: максимум ${max} символов`)
  return value
}

export function requireInt(raw, { min = 0, max = 1e9, label = 'Поле' } = {}) {
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) throw badRequest(`${label}: ожидалось число`)
  if (n < min || n > max) throw badRequest(`${label}: от ${min} до ${max}`)
  return n
}

export function requireBool(raw, fallback = null) {
  if (typeof raw === 'boolean') return raw
  if (fallback === null) throw badRequest('Ожидалось true/false')
  return fallback
}

export function requireId(raw, label = 'id') {
  // Строго целое положительное: parseInt('12abc') === 12 нас не устраивает.
  if (typeof raw === 'string' && !/^\d{1,15}$/.test(raw.trim())) throw badRequest(`Некорректный ${label}`)
  const n = Number.parseInt(raw, 10)
  if (!Number.isSafeInteger(n) || n <= 0) throw badRequest(`Некорректный ${label}`)
  return n
}

export function isValidUuid(raw) {
  return typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
}

export function isValidMcName(raw) {
  return typeof raw === 'string' && /^[A-Za-z0-9_]{1,16}$/.test(raw)
}

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
}

/** Человекочитаемый slug из русского/английского названия. */
export function slugify(title) {
  const base = title
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return base || 'category'
}
