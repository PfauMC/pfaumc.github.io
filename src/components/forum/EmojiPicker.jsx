import { useMemo, useState } from 'react'
import { EMOJI_CATEGORIES, RECENT_EMOJI_STORAGE_KEY, MAX_RECENT_EMOJI } from '../../lib/emojiData'
// Свой шелл вместо popupShellClass из FormatPopups: там фиксированная ширина
// под цвет/градиент, а этому попапу нужна сетка эмодзи без внутренних отступов.

function readRecent() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_EMOJI_STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((e) => typeof e === 'string').slice(0, MAX_RECENT_EMOJI) : []
  } catch {
    return []
  }
}

/** Запоминает последние использованные — только на этом устройстве, не бэкенд-состояние. */
function pushRecent(emoji) {
  const next = [emoji, ...readRecent().filter((e) => e !== emoji)].slice(0, MAX_RECENT_EMOJI)
  try {
    localStorage.setItem(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* приватный режим и т.п. — просто не запоминаем */
  }
  return next
}

const RECENT_TITLE = 'Недавние'

export default function EmojiPicker({ onPick }) {
  const [query, setQuery] = useState('')
  // Ключ вкладки — заголовок категории, а не индекс: вкладка «Недавние»
  // появляется только после первого выбора и сдвигала бы индексы остальных.
  const [tab, setTab] = useState(EMOJI_CATEGORIES[0].title)
  const [recent, setRecent] = useState(readRecent)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return EMOJI_CATEGORIES.flatMap((cat) => cat.items).filter((e) => e.k.includes(q))
  }, [query])

  const pick = (emoji) => {
    setRecent(pushRecent(emoji))
    onPick(emoji)
  }

  const tabs = recent.length > 0 ? [{ title: RECENT_TITLE, icon: '🕓', items: [] }, ...EMOJI_CATEGORIES] : EMOJI_CATEGORIES
  const activeItems =
    tab === RECENT_TITLE ? recent.map((c) => ({ c, k: '' })) : tabs.find((t) => t.title === tab)?.items ?? tabs[0].items

  return (
    // Fixed, не absolute — та же причина, что и в popupShellClass (FormatPopups.jsx):
    // якорная кнопка живёт внутри overflow-x-auto тулбара.
    <div
      role="dialog"
      aria-label="Эмодзи"
      className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-40 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl glass overflow-hidden"
    >
      <div className="p-2 border-b border-white/5">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск эмодзи…"
          aria-label="Поиск эмодзи"
          className="w-full bg-bg-section border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {!query && (
        <div className="flex items-center gap-0.5 px-1.5 pt-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((cat) => (
            <button
              key={cat.title}
              type="button"
              title={cat.title}
              onClick={() => setTab(cat.title)}
              aria-pressed={tab === cat.title}
              className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-base transition-colors ${
                tab === cat.title ? 'bg-accent/15' : 'hover:bg-white/5'
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      <div className="p-2 max-h-56 overflow-y-auto grid grid-cols-8 gap-0.5">
        {(query ? results : activeItems).length === 0 ? (
          <p className="col-span-8 py-6 text-center text-xs text-text-light/40">Ничего не нашлось</p>
        ) : (
          (query ? results : activeItems).map((e, i) => (
            <button
              key={`${e.c}-${i}`}
              type="button"
              title={e.k}
              onClick={() => pick(e.c)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-xl hover:bg-white/10 transition-colors"
            >
              {e.c}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
