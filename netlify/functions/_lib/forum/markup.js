// Разметка сообщений форума хранится в БД как обычный текст и НИКОГДА не
// превращается в HTML на сервере. Клиент рендерит её в React-элементы
// (src/lib/markup.jsx), поэтому пользовательский HTML в принципе не может
// попасть в DOM — это и есть защита от XSS.
//
// Здесь только то, что нужно серверу: упоминания и текстовый предпросмотр.

const MENTION_RE = /(^|[^\w@])@([A-Za-z0-9_]{1,16})\b/g
const MAX_MENTIONS = 10

/** Уникальные ники из @упоминаний, в нижнем регистре. */
export function extractMentions(body) {
  const found = new Set()
  for (const match of body.matchAll(MENTION_RE)) {
    found.add(match[2].toLowerCase())
    if (found.size >= MAX_MENTIONS) break
  }
  return [...found]
}

/** Короткий предпросмотр без символов разметки. */
export function excerpt(body, length = 160) {
  const plain = body
    .replace(/\[quote(?:=[^\]]*)?\][\s\S]*?\[\/quote\]/gi, ' ')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/[*>_`]+/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > length ? `${plain.slice(0, length - 1).trimEnd()}…` : plain
}
