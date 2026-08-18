import { useState } from 'react'

// Попап «Цвет» панели редактора, с подвкладкой «Градиент» — одна кнопка в
// тулбаре вместо двух. Значения уходят в MiniMessage-теги
// <color:#hex>…</color> и <gradient:#hex:#hex>…</gradient> — см. src/lib/markup.jsx.
// HEX проверяется тем же regex, что и на бэкенде (validate_markup_tokens в
// pfaumc-backend), так что мимо валидного формата в стиль ничего не попадёт ни
// с той, ни с другой стороны.
//
// Направления «горизонтально/вертикально» у градиента нет: настоящий
// MiniMessage-градиент всегда идёт вдоль текста (это чат-строка в игре,
// вертикали там просто неоткуда взяться) — своё расширение поверх стандарта
// не делаем, раз цель в том, чтобы формат был переиспользуемым.

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

const PRESET_COLORS = [
  '#1DA5E8', // brand accent
  '#EF4444',
  '#F59E0B',
  '#FACC15',
  '#22C55E',
  '#14B8A6',
  '#A855F7',
  '#EC4899',
  '#F8FAFC',
  '#94A3B8',
]

export const popupShellClass =
  // Всегда fixed, не absolute: якорная кнопка сидит внутри overflow-x-auto
  // тулбара, а он из-за overflow-x получает overflow-y:auto по правилам CSS
  // (visible+non-visible на разных осях не бывает) — absolute-попап под такой
  // кнопкой обрезался бы контейнером тулбара, даже на десктопе. Fixed завязан
  // на viewport и не режется ничьим overflow.
  'fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-40 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl glass p-3'

function normalizeHex(raw) {
  const value = raw.trim()
  return value.startsWith('#') ? value : `#${value}`
}

function HexField({ value, onChange, label }) {
  const [text, setText] = useState(value)
  const valid = HEX_RE.test(text)

  const commit = (raw) => {
    setText(raw)
    const normalized = normalizeHex(raw)
    if (HEX_RE.test(normalized)) onChange(normalized)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={HEX_RE.test(value) ? value : '#1DA5E8'}
        onChange={(e) => { setText(e.target.value); onChange(e.target.value) }}
        aria-label={label}
        className="w-9 h-9 flex-shrink-0 rounded-lg border border-white/10 bg-transparent cursor-pointer"
      />
      <input
        value={text}
        onChange={(e) => commit(e.target.value)}
        placeholder="#1DA5E8"
        maxLength={7}
        aria-label={`${label}, HEX`}
        className={`min-w-0 flex-1 bg-bg-section border rounded-lg px-2.5 py-1.5 text-xs font-mono text-heading placeholder-text-light/30 focus:outline-none focus:ring-1 transition-colors ${
          valid ? 'border-white/10 focus:border-accent/50 focus:ring-accent/30' : 'border-red-500/50 focus:ring-red-500/30'
        }`}
      />
    </div>
  )
}

function PresetRow({ onPick }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      {PRESET_COLORS.map((hex) => (
        <button
          key={hex}
          type="button"
          title={hex}
          onClick={() => onPick(hex)}
          style={{ background: hex }}
          className="w-6 h-6 rounded-full border border-white/15 hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        />
      ))}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
        active ? 'bg-white/10 text-accent' : 'text-text-light/60 hover:text-text-light'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Цвет и градиент — один попап с подвкладками: два отдельных тега
 * (<color:#hex>/<gradient:#a:#b>) делили один и тот же смысл «цвет текста»,
 * а как две кнопки в тулбаре не помещались по ширине на мобильных.
 * onApply получает { type: 'color', hex } или { type: 'gradient', from, to }.
 */
export function ColorPopup({ onApply, onClose }) {
  const [tab, setTab] = useState('color') // 'color' | 'gradient'
  const [hex, setHex] = useState('#1DA5E8')
  const [from, setFrom] = useState('#1DA5E8')
  const [to, setTo] = useState('#EC4899')

  const isGradient = tab === 'gradient'
  const valid = isGradient ? HEX_RE.test(from) && HEX_RE.test(to) : HEX_RE.test(hex)
  const previewStyle = isGradient
    ? valid
      ? {
          backgroundImage: `linear-gradient(90deg, ${from}, ${to})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
        }
      : undefined
    : valid
      ? { color: hex }
      : undefined

  return (
    <div role="dialog" aria-label="Цвет текста" className={popupShellClass}>
      <div className="flex gap-1 mb-2.5 p-0.5 rounded-lg bg-black/20">
        <TabButton active={!isGradient} onClick={() => setTab('color')}>Цвет</TabButton>
        <TabButton active={isGradient} onClick={() => setTab('gradient')}>Градиент</TabButton>
      </div>

      {isGradient ? (
        <div className="space-y-2">
          <HexField value={from} onChange={setFrom} label="Первый цвет" />
          <HexField value={to} onChange={setTo} label="Второй цвет" />
        </div>
      ) : (
        <>
          <HexField value={hex} onChange={setHex} label="Цвет" />
          <PresetRow onPick={setHex} />
        </>
      )}

      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/5">
        <span className={`text-sm truncate ${isGradient ? 'font-bold' : 'font-medium'}`} style={previewStyle}>
          Пример текста
        </span>
        <div className="flex gap-1.5 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost text-xs py-1.5 px-2.5">
            Отмена
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onApply(isGradient ? { type: 'gradient', from, to } : { type: 'color', hex })}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-40 disabled:pointer-events-none"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}
