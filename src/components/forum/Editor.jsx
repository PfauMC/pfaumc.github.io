import { useId, useRef, useState } from 'react'
import { renderMarkup } from '../../lib/markup'
import { useForumAuth } from '../../context/ForumAuthContext'
import { FormError } from './ui'
import { ColorPopup } from './FormatPopups'
import EmojiPicker from './EmojiPicker'

const MAX_LENGTH = 10000

const HEADING_OPTIONS = [
  { level: 0, label: 'Обычный текст' },
  { level: 1, label: 'Заголовок H1', className: 'font-bold text-lg' },
  { level: 2, label: 'Заголовок H2', className: 'font-bold text-base' },
  { level: 3, label: 'Заголовок H3', className: 'font-bold text-sm' },
  { level: 4, label: 'Заголовок H4', className: 'font-bold text-sm' },
]

const SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40]

const DRAFT_STATUS_LABEL = {
  saving: 'Сохраняем…',
  saved: 'Сохранено',
  error: 'Не удалось сохранить черновик',
}

export default function Editor({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Отправить',
  placeholder = 'Ваш ответ…',
  busy = false,
  // Блокирует отправку по внешней причине (например, не заполнен заголовок темы)
  // — в отличие от busy, не показывает «Отправка…».
  disabled = false,
  error = null,
  autoFocus = false,
  compact = false,
  // Черновики — необязательные пропсы. Не переданы (редактирование уже
  // опубликованного сообщения в PostCard) — статус и кнопка не рендерятся.
  draftStatus = null,
  onSaveDraft = null,
}) {
  const { canViewHidden } = useForumAuth()
  const [preview, setPreview] = useState(false)
  const [openPopup, setOpenPopup] = useState(null) // 'heading' | 'size' | 'color' | 'emoji' | 'more' | null
  const textareaRef = useRef(null)
  const id = useId()

  const closePopup = () => setOpenPopup(null)
  const togglePopup = (name) => setOpenPopup((p) => (p === name ? null : name))

  const setValueClamped = (next) => onChange(next.slice(0, MAX_LENGTH))

  /** Оборачивает выделение (или плейсхолдер, если ничего не выделено) в open/close. */
  const applyWrap = (open, close, placeholder = 'текст') => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const selected = value.slice(start, end)
    const inner = selected || placeholder
    const next = `${value.slice(0, start)}${open}${inner}${close}${value.slice(end)}`
    setValueClamped(next)
    const caretStart = start + open.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caretStart, caretStart + inner.length)
    })
  }

  /** Ставит префикс перед текущей строкой — списки и цитата. */
  const applyPrefix = (prefix) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`
    setValueClamped(next)
    const caret = end + prefix.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  /** Заменяет заголовок текущей строки — снимает старый уровень перед новым (или снимает совсем). */
  const applyHeading = (level) => {
    closePopup()
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start } = el
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    let lineEnd = value.indexOf('\n', start)
    if (lineEnd === -1) lineEnd = value.length
    const line = value.slice(lineStart, lineEnd)
    const stripped = line.replace(/^#{1,4}\s+/, '')
    const nextLine = level > 0 ? `${'#'.repeat(level)} ${stripped}` : stripped
    const next = `${value.slice(0, lineStart)}${nextLine}${value.slice(lineEnd)}`
    setValueClamped(next)
    const caret = lineStart + nextLine.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const SPOILER_OPEN = '<spoiler>'
  const SPOILER_CLOSE = '</spoiler>'

  /** Иконка глаза: оборачивает выделение в <spoiler>, повторный клик по уже скрытому — снимает. */
  const toggleSpoiler = () => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el

    // Выделение сидит внутри обёртки — снимаем сами теги вокруг него.
    const before = value.slice(Math.max(0, start - SPOILER_OPEN.length), start)
    const after = value.slice(end, end + SPOILER_CLOSE.length)
    if (before === SPOILER_OPEN && after === SPOILER_CLOSE) {
      const next = value.slice(0, start - SPOILER_OPEN.length) + value.slice(start, end) + value.slice(end + SPOILER_CLOSE.length)
      setValueClamped(next)
      const caret = start - SPOILER_OPEN.length
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(caret, caret + (end - start))
      })
      return
    }

    // Выделены сами теги вместе с содержимым — тоже снимаем.
    const selected = value.slice(start, end)
    if (selected.startsWith(SPOILER_OPEN) && selected.endsWith(SPOILER_CLOSE) && selected.length >= SPOILER_OPEN.length + SPOILER_CLOSE.length) {
      const stripped = selected.slice(SPOILER_OPEN.length, selected.length - SPOILER_CLOSE.length)
      const next = value.slice(0, start) + stripped + value.slice(end)
      setValueClamped(next)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start, start + stripped.length)
      })
      return
    }

    applyWrap(SPOILER_OPEN, SPOILER_CLOSE)
  }

  const insertAtCursor = (text) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`
    setValueClamped(next)
    const caret = start + text.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !busy) {
      e.preventDefault()
      onSubmit()
    }
  }

  const tooLong = value.length > MAX_LENGTH
  const canSubmit = value.trim().length >= 2 && !tooLong && !busy && !disabled
  const toolsDisabled = preview || busy

  return (
    // Без overflow-hidden на всём блоке: он обрезал бы попапы цвета/градиента/
    // эмодзи и выпадашки H/Размер/⋯ — все они позиционируются absolute внутри
    // (см. свежий баг с той же причиной в шапке темы). Скруглённые углы держит
    // сам bg-black/5 в подвале — единственный кусок, у которого свой фон.
    <div className="relative rounded-2xl border border-white/10 bg-bg-card focus-within:border-accent/40 transition-colors">
      {/* Панель инструментов */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-none">
        <ToolbarMenu
          label="H"
          title="Заголовок"
          isOpen={openPopup === 'heading'}
          onToggle={() => togglePopup('heading')}
          disabled={toolsDisabled}
        >
          {HEADING_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              type="button"
              role="menuitem"
              onClick={() => applyHeading(opt.level)}
              className={`w-full text-left px-3 py-2 text-sm text-text-light hover:text-accent hover:bg-white/5 transition-colors ${opt.className ?? ''}`}
            >
              {opt.label}
            </button>
          ))}
        </ToolbarMenu>

        <ToolbarMenu
          label="Размер"
          title="Размер текста"
          isOpen={openPopup === 'size'}
          onToggle={() => togglePopup('size')}
          disabled={toolsDisabled}
        >
          {SIZE_OPTIONS.map((px) => (
            <button
              key={px}
              type="button"
              role="menuitem"
              onClick={() => { closePopup(); applyWrap(`<size:${px}>`, '</size>') }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-light hover:text-accent hover:bg-white/5 transition-colors"
            >
              <span style={{ fontSize: `${Math.min(20, px)}px` }}>{px} px</span>
            </button>
          ))}
        </ToolbarMenu>

        <ToolButton title="Жирный" disabled={toolsDisabled} onClick={() => applyWrap('<b>', '</b>')} className="font-bold">
          B
        </ToolButton>
        <ToolButton title="Курсив" disabled={toolsDisabled} onClick={() => applyWrap('<i>', '</i>')} className="italic">
          I
        </ToolButton>
        <ToolButton title="Подчёркнутый" disabled={toolsDisabled} onClick={() => applyWrap('<u>', '</u>')} className="underline">
          U
        </ToolButton>
        <ToolButton title="Зачёркнутый" disabled={toolsDisabled} onClick={() => applyWrap('<st>', '</st>')} className="line-through">
          S
        </ToolButton>

        <PopupTrigger
          title="Цвет и градиент текста"
          isOpen={openPopup === 'color'}
          onToggle={() => togglePopup('color')}
          disabled={toolsDisabled}
          swatch
        >
          <ColorPopup
            onApply={(result) => {
              closePopup()
              if (result.type === 'gradient') applyWrap(`<gradient:${result.from}:${result.to}>`, '</gradient>')
              else applyWrap(`<color:${result.hex}>`, '</color>')
            }}
            onClose={closePopup}
          />
        </PopupTrigger>

        <ToolButton title="Ссылка" disabled={toolsDisabled} onClick={() => applyWrap('[', '](https://)', 'текст')}>
          🔗
        </ToolButton>

        {/* Заводить скрытый текст может только стафф — бэкенд всё равно отклонит
            тег от остальных (validate_markup_tokens_with), но без кнопки не
            вводим в заблуждение обычного игрока, который потом не увидит
            свой же текст обратно (redact_spoilers прячет его от всех ниже порога). */}
        {canViewHidden && (
          <ToolButton
            title="Скрытый текст — видно только персоналу (хелпер и выше)"
            disabled={toolsDisabled}
            onClick={toggleSpoiler}
          >
            👁
          </ToolButton>
        )}

        <PopupTrigger
          label="😊"
          title="Эмодзи"
          isOpen={openPopup === 'emoji'}
          onToggle={() => togglePopup('emoji')}
          disabled={toolsDisabled}
        >
          <EmojiPicker onPick={(emoji) => insertAtCursor(emoji)} />
        </PopupTrigger>

        <ToolButton title="Маркированный список" disabled={toolsDisabled} onClick={() => applyPrefix('- ')}>
          •
        </ToolButton>
        <ToolButton title="Нумерованный список" disabled={toolsDisabled} onClick={() => applyPrefix('1. ')}>
          1.
        </ToolButton>
        <ToolButton title="Цитата" disabled={toolsDisabled} onClick={() => applyPrefix('> ')}>
          ❝
        </ToolButton>

        <div className="ml-auto flex-shrink-0 pl-2">
          <button
            type="button"
            onClick={() => { setPreview((p) => !p); closePopup() }}
            aria-pressed={preview}
            className={`px-2.5 h-8 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
              preview ? 'bg-accent/15 text-accent' : 'text-text-light/70 hover:text-accent hover:bg-white/5'
            }`}
          >
            Предпросмотр
          </button>
        </div>
      </div>

      {/* Затемнение под попапами — клик снаружи закрывает */}
      {openPopup && <div className="fixed inset-0 z-30" onClick={closePopup} aria-hidden="true" />}

      {/* Поле / предпросмотр */}
      {preview ? (
        <div className="px-4 py-3 min-h-[7rem] text-text-light text-sm leading-relaxed">
          {value.trim() ? renderMarkup(value, id) : <span className="text-text-light/40">Пока пусто</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => setValueClamped(e.target.value.slice(0, MAX_LENGTH + 1))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={compact ? 4 : 7}
          aria-label="Текст сообщения"
          className="w-full bg-transparent px-4 py-3 text-heading placeholder-text-light/30 text-sm leading-relaxed resize-y focus:outline-none"
        />
      )}

      {/* Низ */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-t border-white/5 bg-black/5 rounded-b-2xl">
        <p className="text-[11px] text-text-light/40 mr-auto hidden sm:block">
          &lt;b&gt;жирный&lt;/b&gt; · [текст](ссылка) · &gt; цитата · @Ник
        </p>
        {draftStatus && (
          <span className={`text-[11px] ${draftStatus === 'error' ? 'text-red-400' : 'text-text-light/40'}`}>
            {DRAFT_STATUS_LABEL[draftStatus]}
          </span>
        )}
        {onSaveDraft && (
          <button type="button" onClick={onSaveDraft} className="text-[11px] text-accent hover:underline">
            Сохранить в черновик
          </button>
        )}
        <span className={`text-[11px] tabular-nums ${tooLong ? 'text-red-400' : 'text-text-light/40'}`}>
          {value.length}/{MAX_LENGTH}
        </span>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost text-xs py-1.5 px-3">
            Отмена
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="btn-primary text-xs py-1.5 px-4 disabled:opacity-40 disabled:pointer-events-none"
        >
          {busy ? 'Отправка…' : submitLabel}
        </button>
      </div>

      <div className="px-3 pb-2 empty:hidden">
        <FormError error={error} />
      </div>
    </div>
  )
}


function ToolButton({ title, disabled, onClick, className = '', children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-sm text-text-light/70 hover:text-accent hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${className}`}
    >
      {children}
    </button>
  )
}

function ToolbarMenu({ label, title, isOpen, onToggle, disabled, children }) {
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        title={title}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={onToggle}
        className={`h-8 px-2 flex-shrink-0 flex items-center gap-0.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
          isOpen ? 'text-accent bg-accent/10' : 'text-text-light/70 hover:text-accent hover:bg-white/5'
        }`}
      >
        {label}
        <span className="text-[8px] opacity-60">▾</span>
      </button>
      {isOpen && (
        // Fixed, не absolute — кнопка сидит в overflow-x-auto тулбаре, который из-за
        // overflow-x получает overflow-y:auto и обрезал бы absolute-меню под собой.
        <div
          role="menu"
          className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-40 w-[min(13rem,calc(100vw-1.5rem))] py-1 max-h-72 overflow-y-auto rounded-xl glass"
        >
          {children}
        </div>
      )}
    </div>
  )
}

/** Триггер попапа (цвет/градиент/эмодзи) — сам попап рендерит вызывающая сторона. */
function PopupTrigger({ label, title, isOpen, onToggle, disabled, swatch, children }) {
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        title={title}
        aria-label={label ? undefined : title}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={onToggle}
        className={`h-8 flex-shrink-0 flex items-center gap-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
          label ? 'px-2' : 'w-8 justify-center'
        } ${isOpen ? 'text-accent bg-accent/10' : 'text-text-light/70 hover:text-accent hover:bg-white/5'}`}
      >
        {swatch && <span className="w-3 h-3 rounded-full bg-gradient-to-br from-accent to-pink-400" aria-hidden="true" />}
        {label}
      </button>
      {isOpen && children}
    </div>
  )
}

