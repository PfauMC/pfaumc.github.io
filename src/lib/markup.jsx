import { Link } from 'react-router-dom'

// Разметка сообщений превращается сразу в React-элементы.
// dangerouslySetInnerHTML здесь не используется нигде и использоваться не
// должен: пользовательский HTML физически не может попасть в DOM.
//
// Поддерживается: **жирный**, *курсив*, `код`, [текст](ссылка), голые ссылки,
// > цитата, [quote=Ник]…[/quote], списки «- » и «1. », @упоминания.

const QUOTE_BLOCK = /\[quote(?:=([^\]\n]{1,32}))?\]([\s\S]*?)\[\/quote\]/gi

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>"]+|@[A-Za-z0-9_]{1,16})/g

function inline(text, keyPrefix) {
  const parts = text.split(INLINE)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (!part) return null
    if (i % 2 === 0) return part

    if (part.startsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`')) {
      return (
        <code key={key} className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[0.9em] text-accent">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>

    if (part.startsWith('@')) {
      const nick = part.slice(1)
      return (
        <Link key={key} to={`/u/${encodeURIComponent(nick)}`} className="text-accent hover:underline font-medium">
          @{nick}
        </Link>
      )
    }

    const named = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    const label = named ? named[1] : part
    const href = named ? named[2] : part
    return (
      <a
        key={key}
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="text-accent hover:underline break-words"
      >
        {label}
      </a>
    )
  })
}

function blocks(text, keyPrefix) {
  const lines = text.split('\n')
  const out = []
  let buffer = []
  let mode = null // 'p' | 'quote' | 'ul' | 'ol'

  const flush = () => {
    if (!buffer.length) return
    const key = `${keyPrefix}-b${out.length}`
    const items = buffer
    buffer = []

    if (mode === 'ul' || mode === 'ol') {
      const Tag = mode === 'ul' ? 'ul' : 'ol'
      out.push(
        <Tag key={key} className={`my-2 pl-5 space-y-1 ${mode === 'ul' ? 'list-disc' : 'list-decimal'}`}>
          {items.map((line, i) => (
            <li key={`${key}-${i}`}>{inline(line, `${key}-${i}`)}</li>
          ))}
        </Tag>
      )
    } else if (mode === 'quote') {
      out.push(
        <blockquote
          key={key}
          className="my-2 border-l-2 border-accent/50 pl-3 text-text-light/80 italic"
        >
          {items.map((line, i) => (
            <p key={`${key}-${i}`}>{inline(line, `${key}-${i}`)}</p>
          ))}
        </blockquote>
      )
    } else {
      out.push(
        <p key={key} className="my-2 first:mt-0 last:mb-0 whitespace-pre-wrap break-words">
          {items.map((line, i) => (
            <span key={`${key}-${i}`}>
              {i > 0 && <br />}
              {inline(line, `${key}-${i}`)}
            </span>
          ))}
        </p>
      )
    }
    mode = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (!line.trim()) {
      flush()
      continue
    }

    let nextMode = 'p'
    let content = line

    if (/^>\s?/.test(line)) {
      nextMode = 'quote'
      content = line.replace(/^>\s?/, '')
    } else if (/^[-*]\s+/.test(line)) {
      nextMode = 'ul'
      content = line.replace(/^[-*]\s+/, '')
    } else if (/^\d{1,3}[.)]\s+/.test(line)) {
      nextMode = 'ol'
      content = line.replace(/^\d{1,3}[.)]\s+/, '')
    }

    if (mode && mode !== nextMode) flush()
    mode = nextMode
    buffer.push(content)
  }
  flush()

  return out
}

/** Рендерит текст сообщения в безопасные React-элементы. */
export function renderMarkup(text, keyPrefix = 'm') {
  if (!text) return null

  const nodes = []
  let cursor = 0
  let index = 0

  for (const match of String(text).matchAll(QUOTE_BLOCK)) {
    if (match.index > cursor) {
      nodes.push(...blocks(text.slice(cursor, match.index), `${keyPrefix}-t${index}`))
    }
    const author = match[1]
    nodes.push(
      <figure
        key={`${keyPrefix}-q${index}`}
        className="my-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2"
      >
        {author && (
          <figcaption className="text-xs text-text-light/60 font-mono mb-1">{author} писал(а):</figcaption>
        )}
        <div className="text-sm text-text-light/85">{blocks(match[2].trim(), `${keyPrefix}-q${index}i`)}</div>
      </figure>
    )
    cursor = match.index + match[0].length
    index++
  }

  if (cursor < text.length) nodes.push(...blocks(text.slice(cursor), `${keyPrefix}-t${index}`))
  return nodes
}

/** Готовая цитата для вставки в редактор. */
export function buildQuote(authorName, body) {
  const trimmed = body.length > 1200 ? `${body.slice(0, 1200)}…` : body
  return `[quote=${authorName}]${trimmed}[/quote]\n\n`
}
