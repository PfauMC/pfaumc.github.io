const MAX_QUERY_LEN = 40
// Minecraft usernames are [A-Za-z0-9_]{1,16}; we allow a bit more so partial/typo'd
// queries still work, but strip anything that can't appear in a real nickname.
const ALLOWED_CHARS = /[^a-zA-Z0-9_]/g

export function sanitizeQuery(raw) {
  if (typeof raw !== 'string') return ''
  return raw.trim().slice(0, MAX_QUERY_LEN).replace(ALLOWED_CHARS, '')
}

export function sanitizeNickname(raw) {
  if (typeof raw !== 'string') return ''
  return raw.trim().slice(0, 16).replace(ALLOWED_CHARS, '')
}

export function isValidUuid(raw) {
  return typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
}

export function clampLimit(raw, { min = 1, max = 40, fallback = 20 } = {}) {
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
