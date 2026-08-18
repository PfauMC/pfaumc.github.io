import { useId, useRef, useState } from 'react'
import { isSafeSignatureImageUrl, SIGNATURE_MAX_IMAGES } from '../../lib/markup'
import { ColorPopup } from './FormatPopups'
import EmojiPicker from './EmojiPicker'

export const SIGNATURE_MAX_LENGTH = 500

const ALIGN_BUTTONS = [
  { dir: 'left', label: 'Л', title: 'По левому краю' },
  { dir: 'center', label: 'Ц', title: 'По центру' },
  { dir: 'right', label: 'П', title: 'По правому краю' },
]

/** Компактный редактор подписи — тот же тег-движок, что у сообщений, но со своим уже набором тегов. */
export default function SignatureEditor({ value, onChange }) {
  const [openPopup, setOpenPopup] = useState(null) // 'color' | 'emoji' | null
  const textareaRef = useRef(null)
  const id = useId()

  const closePopup = () => setOpenPopup(null)
  const togglePopup = (name) => setOpenPopup((p) => (p === name ? null : name))
  const setValueClamped = (next) => onChange(next.slice(0, SIGNATURE_MAX_LENGTH))

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

  const insertImage = () => {
    const count = (value.match(/<img:/gi) ?? []).length
    if (count >= SIGNATURE_MAX_IMAGES) {
      window.alert('К подписи можно прикрепить только один файл — сначала удалите вставленное изображение')
      return
    }
    // ponytail: window.prompt буквально то, что просили — «кнопка спрашивает URL».
    const url = window.prompt('Ссылка на изображение (PNG, JPG, WEBP или GIF):')
    if (!url) return
    if (!isSafeSignatureImageUrl(url.trim())) {
      window.alert('Ссылка должна начинаться с http(s):// и вести на файл .png/.jpg/.webp/.gif')
      return
    }
    insertAtCursor(`<img:${url.trim()}>`)
  }

  const toolsDisabled = false
  const tooLong = value.length > SIGNATURE_MAX_LENGTH

  return (
    <div className="relative rounded-2xl border border-white/10 bg-bg-card focus-within:border-accent/40 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-none">
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
          title="Цвет текста"
          isOpen={openPopup === 'color'}
          onToggle={() => togglePopup('color')}
          disabled={toolsDisabled}
          swatch
        >
          <ColorPopup onApply={(hex) => { closePopup(); applyWrap(`<color:${hex}>`, '</color>') }} onClose={closePopup} />
        </PopupTrigger>

        <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0" aria-hidden="true" />

        {ALIGN_BUTTONS.map((a) => (
          <ToolButton
            key={a.dir}
            title={a.title}
            disabled={toolsDisabled}
            onClick={() => applyWrap(`<align:${a.dir}>`, '</align>')}
          >
            {a.label}
          </ToolButton>
        ))}

        <div className="w-px h-5 bg-white/10 mx-0.5 flex-shrink-0" aria-hidden="true" />

        <ToolButton title="Ссылка" disabled={toolsDisabled} onClick={() => applyWrap('[', '](https://)', 'текст')}>
          🔗
        </ToolButton>
        <ToolButton title="Вставить изображение по ссылке" disabled={toolsDisabled} onClick={insertImage}>
          🖼
        </ToolButton>

        <PopupTrigger
          label="😊"
          title="Эмодзи"
          isOpen={openPopup === 'emoji'}
          onToggle={() => togglePopup('emoji')}
          disabled={toolsDisabled}
        >
          <EmojiPicker onPick={(emoji) => insertAtCursor(emoji)} />
        </PopupTrigger>
      </div>

      {openPopup && <div className="fixed inset-0 z-30" onClick={closePopup} aria-hidden="true" />}

      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => setValueClamped(e.target.value.slice(0, SIGNATURE_MAX_LENGTH + 1))}
        placeholder="Ваша подпись под сообщениями на форуме…"
        rows={3}
        aria-label="Текст подписи"
        className="w-full bg-transparent px-4 py-3 text-heading placeholder-text-light/30 text-sm leading-relaxed resize-y focus:outline-none"
      />

      <div className="flex items-center justify-end px-3 py-1.5 border-t border-white/5 bg-black/5 rounded-b-2xl">
        <span className={`text-[11px] tabular-nums ${tooLong ? 'text-red-400' : 'text-text-light/40'}`}>
          {value.length}/{SIGNATURE_MAX_LENGTH}
        </span>
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
