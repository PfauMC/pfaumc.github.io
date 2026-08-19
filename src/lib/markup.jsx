import { Link } from 'react-router-dom'

// Разметка сообщений превращается сразу в React-элементы.
// dangerouslySetInnerHTML здесь не используется нигде и использоваться не
// должен: пользовательский HTML физически не может попасть в DOM.
//
// Инлайн-форматирование — подмножество MiniMessage (тот же формат, которым в
// игре описаны роли, см. `pfaumc-backend/src/web/mod.rs`): <b>, <i>, <u>,
// <st>, <color:red>/<color:#hex>/<#hex>, <gradient:#a:#b:...>, <size:12..40>.
// Специально без click/hover/insertion/font/shadow — на вебе им нечего делать,
// а часть (click:run_command) вне игрового клиента просто опасна: любой тег
// не из белого списка ALLOWED_TAGS остаётся на странице как обычный текст,
// а не превращается в HTML/CSS. Параметры (`#hex`, именованный цвет, число
// 12–40) разбираются регуляркой и уходят прямо в объект инлайн-стиля —
// вставить туда что-то кроме проверенного формата нельзя.
//
// Блоки — свои, MiniMessage о них ничего не знает (чат в игре однострочный):
// # / ## / ### / #### заголовки, > цитата, [quote=Ник]…[/quote], списки
// «- » и «1. », [текст](ссылка), голые ссылки, @упоминания.
//
// Бэкенд при публикации (не в черновике) заново проверяет эти же теги —
// см. validate_markup_tokens в pfaumc-backend/src/web/forum.rs — фронтенду
// он не доверяет.

export const FONT_SIZE_MIN = 12
export const FONT_SIZE_MAX = 40

const QUOTE_BLOCK = /\[quote(?:=([^\]\n]{1,32}))?\]([\s\S]*?)\[\/quote\]/gi
const HEADING = /^(#{1,4})\s+(.*)$/

const ALLOWED_TAGS = new Set([
  'b', 'bold', 'i', 'italic', 'em', 'u', 'underlined', 'st', 'strikethrough', 'color', 'gradient', 'size', 'spoiler',
])

// <spoiler> — скрытый текст, видимый только персоналу (хелпер и выше). Завести
// его тоже может только стафф (validate_markup_tokens_with на бэкенде), так что
// автор без роли никогда не окажется по другую сторону своего же тега. Права
// проверяются бэкендом при отдаче сообщения: игроку без доступа сервер присылает
// уже пустой `<spoiler:hidden></spoiler>` — реального текста в ответе нет вообще,
// так что вскрыть его через DevTools нельзя.
const SPOILER_HIDDEN_ARG = 'hidden'

// Подпись под сообщением — тот же движок тегов, но со своим (более узким по
// духу, шире по составу) набором: без градиента/размера, зато с выравниванием
// и картинкой по прямой ссылке. <img:...> самозакрывающийся — см. VOID_TAGS.
export const SIGNATURE_ALLOWED_TAGS = new Set([
  'b', 'bold', 'i', 'italic', 'em', 'u', 'underlined', 'st', 'strikethrough', 'color', 'align', 'img',
])
export const SIGNATURE_MAX_IMAGES = 1

const VOID_TAGS = new Set(['img'])
const ALIGN_VALUES = new Set(['left', 'center', 'right'])
const SIGNATURE_IMAGE_RE = /^https?:\/\/[^\s<>"']+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>"']*)?$/i

export function isSafeSignatureImageUrl(url) {
  return typeof url === 'string' && SIGNATURE_IMAGE_RE.test(url)
}

// 16 стандартных цветов Minecraft-чата — то же множество, что понимает
// MiniMessage без hex.
const NAMED_COLORS = {
  black: '#000000', dark_blue: '#0000AA', dark_green: '#00AA00', dark_aqua: '#00AAAA',
  dark_red: '#AA0000', dark_purple: '#AA00AA', gold: '#FFAA00', gray: '#AAAAAA', grey: '#AAAAAA',
  dark_gray: '#555555', dark_grey: '#555555', blue: '#5555FF', green: '#55FF55', aqua: '#55FFFF',
  red: '#FF5555', light_purple: '#FF55FF', yellow: '#FFFF55', white: '#FFFFFF',
}

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

function resolveColor(value) {
  if (!value) return null
  if (value[0] === '#') return HEX_RE.test(value) ? value : null
  return NAMED_COLORS[value.toLowerCase()] ?? null
}

const clampSize = (n) => Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n || 16))

// <(закрывающий /)?(имя тега | #hex)(:аргументы)?>
const TAG_RE = /<(\/)?([a-zA-Z_]*|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})((?::[^<>]*)*)>/g

/**
 * Строит дерево тегов из строки (без переносов — сюда всегда приходит одна
 * строка блока, см. blocks()). Стек, а не одна регулярка на токен: тегам
 * MiniMessage разрешено произвольно вкладываться друг в друга.
 */
function parseTags(text, allowedTags = ALLOWED_TAGS) {
  const root = { tag: null, children: [] }
  const stack = [root]
  let cursor = 0
  TAG_RE.lastIndex = 0

  let match
  while ((match = TAG_RE.exec(text))) {
    const [full, closingMark, rawName, rawArgs] = match
    if (match.index > cursor) {
      stack[stack.length - 1].children.push(text.slice(cursor, match.index))
    }
    cursor = TAG_RE.lastIndex

    const closing = closingMark === '/'
    const isHex = rawName.startsWith('#')
    const name = isHex ? 'color' : rawName.toLowerCase()
    const top = () => stack[stack.length - 1]

    if (name === '' && closing) {
      // "</>" — общая закрывашка MiniMessage: закрывает последний открытый тег.
      if (stack.length > 1) stack.pop()
      else top().children.push(full)
      continue
    }
    if (name === '' || (!isHex && !allowedTags.has(name))) {
      // Не наш тег (click/hover/font/… или мусор) — оставляем как обычный текст.
      top().children.push(full)
      continue
    }

    if (closing) {
      const idx = stack.map((n) => n.tag).lastIndexOf(name)
      if (idx > 0) stack.length = idx
      else top().children.push(full) // непарный </tag> — просто текст
      continue
    }

    const args = isHex ? [rawName] : rawArgs ? rawArgs.slice(1).split(':') : []
    const node = { tag: name, args, children: [] }
    top().children.push(node)
    // <img:...> самозакрывающийся: URL может содержать «:», у него нет
    // осмысленного содержимого-потомка, поэтому в стек не идёт.
    if (!VOID_TAGS.has(name)) stack.push(node)
  }

  if (cursor < text.length) stack[stack.length - 1].children.push(text.slice(cursor))
  return root.children
}

const LEAF_INLINE = /(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>"]+|@[A-Za-z0-9_]{1,16})/g

/** Ссылки, голые URL и @упоминания — не теги MiniMessage, разбираются отдельно на листьях дерева. */
function renderLeaf(text, keyPrefix) {
  const parts = text.split(LEAF_INLINE)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (!part) return null
    if (i % 2 === 0) return part

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

function renderTags(nodes, keyPrefix) {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`
    if (typeof node === 'string') return renderLeaf(node, key)

    const kids = renderTags(node.children, key)
    switch (node.tag) {
      case 'b':
      case 'bold':
        return <strong key={key}>{kids}</strong>
      case 'i':
      case 'italic':
      case 'em':
        return <em key={key}>{kids}</em>
      case 'u':
      case 'underlined':
        return <u key={key}>{kids}</u>
      case 'st':
      case 'strikethrough':
        return <s key={key}>{kids}</s>
      case 'color': {
        const hex = resolveColor(node.args[0])
        return (
          <span key={key} style={hex ? { color: hex } : undefined}>
            {kids}
          </span>
        )
      }
      case 'gradient': {
        const stops = node.args.map(resolveColor).filter(Boolean)
        if (stops.length < 2) return <span key={key}>{kids}</span>
        return (
          <span
            key={key}
            style={{
              backgroundImage: `linear-gradient(90deg, ${stops.join(', ')})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {kids}
          </span>
        )
      }
      case 'size':
        return (
          <span key={key} style={{ fontSize: `${clampSize(Number(node.args[0]))}px` }}>
            {kids}
          </span>
        )
      case 'spoiler': {
        if (node.args[0] === SPOILER_HIDDEN_ARG || node.children.length === 0) {
          return (
            <span
              key={key}
              className="inline-flex items-center gap-2 align-middle px-2.5 py-1 my-0.5 rounded-lg border border-dashed border-white/15 bg-white/5 text-text-light/50 select-none"
              title="Доступно только персоналу"
            >
              <span aria-hidden="true">🙈</span>
              <span className="leading-tight">
                <span className="block text-xs font-medium text-text-light/70">Скрытый текст</span>
                <span className="block text-[10px] italic">Доступно только персоналу</span>
              </span>
            </span>
          )
        }
        return (
          <span key={key} className="border-b border-dashed border-accent/50" title="Видно только персоналу">
            {kids}
          </span>
        )
      }
      case 'align': {
        const dir = ALIGN_VALUES.has(node.args[0]) ? node.args[0] : 'left'
        return (
          <div key={key} style={{ textAlign: dir }}>
            {kids}
          </div>
        )
      }
      case 'img': {
        // Аргументы разрезаны по «:» общим механизмом тегов (см. parseTags) —
        // для URL их надо склеить обратно, иначе "https://a.com" ломается на "https"/"//a.com".
        const url = node.args.join(':')
        if (!isSafeSignatureImageUrl(url)) return null
        return (
          <img
            key={key}
            src={url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="inline-block align-middle max-w-full h-auto rounded-md my-1"
            style={{ maxHeight: '160px' }}
          />
        )
      }
      default:
        return <span key={key}>{kids}</span>
    }
  })
}

function inline(text, keyPrefix, allowedTags = ALLOWED_TAGS) {
  return renderTags(parseTags(text, allowedTags), keyPrefix)
}

/**
 * Рендер подписи пользователя — сознательно проще blocks(): без заголовков,
 * цитат и списков (в подписи им не место), только строки и разрешённые
 * инлайн-теги. Высоту и обрезку контролирует контейнер-обёртка (см. SignatureBlock).
 */
export function renderSignature(text, keyPrefix = 'sig') {
  if (!text) return null
  const lines = String(text).split('\n')
  const out = []
  lines.forEach((line, i) => {
    if (i > 0) out.push(<br key={`${keyPrefix}-br${i}`} />)
    out.push(...inline(line, `${keyPrefix}-l${i}`, SIGNATURE_ALLOWED_TAGS))
  })
  return out
}

const headingClass = {
  1: 'font-mono text-2xl sm:text-3xl font-bold text-heading mt-4 mb-2 first:mt-0',
  2: 'font-mono text-xl sm:text-2xl font-bold text-heading mt-3.5 mb-2 first:mt-0',
  3: 'font-mono text-lg sm:text-xl font-bold text-heading mt-3 mb-1.5 first:mt-0',
  4: 'font-mono text-base sm:text-lg font-bold text-heading mt-2.5 mb-1.5 first:mt-0',
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

    const heading = line.match(HEADING)
    if (heading) {
      flush()
      const level = heading[1].length
      const Tag = `h${level}`
      out.push(
        <Tag key={`${keyPrefix}-b${out.length}`} className={headingClass[level]}>
          {inline(heading[2], `${keyPrefix}-b${out.length}`)}
        </Tag>
      )
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
