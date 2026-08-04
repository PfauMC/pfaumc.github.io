import { useRef, useState, useId } from 'react'
import { renderMarkup } from '../../lib/markup'
import { FormError } from './ui'

const MAX_LENGTH = 10000

const TOOLS = [
  { label: 'Ж', title: 'Жирный', wrap: ['**', '**'], className: 'font-bold' },
  { label: 'К', title: 'Курсив', wrap: ['*', '*'], className: 'italic' },
  { label: '</>', title: 'Код', wrap: ['`', '`'], className: 'font-mono text-xs' },
  { label: '🔗', title: 'Ссылка', wrap: ['[', '](https://)'] },
  { label: '❝', title: 'Цитата', prefix: '> ' },
  { label: '•', title: 'Список', prefix: '- ' },
  { label: '1.', title: 'Нумерованный список', prefix: '1. ' },
]

export default function Editor({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = 'Отправить',
  placeholder = 'Ваш ответ…',
  busy = false,
  error = null,
  autoFocus = false,
  compact = false,
}) {
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef(null)
  const id = useId()

  const applyTool = (tool) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const selected = value.slice(start, end)

    let next
    let caret
    if (tool.wrap) {
      next = `${value.slice(0, start)}${tool.wrap[0]}${selected || 'текст'}${tool.wrap[1]}${value.slice(end)}`
      caret = start + tool.wrap[0].length + (selected || 'текст').length + tool.wrap[1].length
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      next = `${value.slice(0, lineStart)}${tool.prefix}${value.slice(lineStart)}`
      caret = end + tool.prefix.length
    }

    onChange(next.slice(0, MAX_LENGTH))
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
  const canSubmit = value.trim().length >= 2 && !tooLong && !busy

  return (
    <div className="rounded-2xl border border-white/10 bg-bg-card overflow-hidden focus-within:border-accent/40 transition-colors">
      {/* Панель инструментов */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-none">
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            disabled={preview || busy}
            onClick={() => applyTool(tool)}
            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-sm text-text-light/70 hover:text-accent hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${tool.className ?? ''}`}
          >
            {tool.label}
          </button>
        ))}

        <div className="ml-auto flex-shrink-0 pl-2">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            className={`px-2.5 h-8 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
              preview ? 'bg-accent/15 text-accent' : 'text-text-light/70 hover:text-accent hover:bg-white/5'
            }`}
          >
            Предпросмотр
          </button>
        </div>
      </div>

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
          onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH + 1))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={compact ? 4 : 7}
          aria-label="Текст сообщения"
          className="w-full bg-transparent px-4 py-3 text-heading placeholder-text-light/30 text-sm leading-relaxed resize-y focus:outline-none"
        />
      )}

      {/* Низ */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-t border-white/5 bg-black/5">
        <p className="text-[11px] text-text-light/40 mr-auto hidden sm:block">
          **жирный** · *курсив* · [текст](ссылка) · &gt; цитата · @Ник
        </p>
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
