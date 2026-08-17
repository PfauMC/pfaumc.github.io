import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { avatarUrl } from '../../utils/playerFormat'

/* ===== Голова скина ===== */
export function UserHead({ user, size = 40, className = '', link = true }) {
  if (!user) {
    return (
      <div
        className={`rounded-lg bg-bg-section flex items-center justify-center text-text-light/40 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        ?
      </div>
    )
  }

  const img = (
    <img
      src={user.skinUrl || avatarUrl(user.uuid, size * 2)}
      alt={user.name}
      width={size}
      height={size}
      loading="lazy"
      className={`rounded-lg bg-bg-section object-cover ${className}`}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  )

  if (!link) return img
  return (
    <Link to={`/u/${encodeURIComponent(user.name)}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
      {img}
    </Link>
  )
}

/* ===== Бейдж роли ===== */
export function RoleBadge({ role, className = '' }) {
  if (!role) return null
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none ${className}`}
      style={{ color: role.color, background: `${role.color}1f` }}
    >
      {role.title}
    </span>
  )
}

/* ===== Хлебные крошки ===== */
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Хлебные крошки" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-text-light/60">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span aria-hidden="true" className="text-text-light/30">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-accent transition-colors truncate max-w-[45vw] sm:max-w-xs">
                {item.label}
              </Link>
            ) : (
              <span className="text-text-light truncate max-w-[45vw] sm:max-w-xs" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ===== Состояния ===== */
export function Skeleton({ className = '' }) {
  return <div className={`rounded bg-bg-section animate-pulse ${className}`} />
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Загрузка">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <Skeleton className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message = 'Не удалось загрузить данные', onRetry }) {
  return (
    <div className="card text-center py-10" role="alert">
      <p className="text-text-light mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-sm py-2 px-4">
          Повторить
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = '🗒️', title, text, action }) {
  return (
    <div className="card text-center py-12">
      <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>
      <p className="text-heading font-medium mb-1">{title}</p>
      {text && <p className="text-text-light/60 text-sm max-w-md mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ===== Пагинация ===== */
export function Pagination({ page, total, pageSize, onChange, className = 'mt-6 justify-center' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  const window = []
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) window.push(p)

  const btn = 'min-w-9 h-9 px-2 flex items-center justify-center rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'

  return (
    <nav className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="Пагинация">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} border border-white/10 text-text-light hover:border-accent/40 hover:text-accent disabled:opacity-40 disabled:pointer-events-none`}
      >
        ‹
      </button>

      {window[0] > 1 && (
        <>
          <button onClick={() => onChange(1)} className={`${btn} text-text-light hover:text-accent`}>1</button>
          {window[0] > 2 && <span className="text-text-light/40 px-1">…</span>}
        </>
      )}

      {window.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${btn} ${p === page ? 'bg-accent text-white font-semibold' : 'text-text-light hover:text-accent hover:bg-white/5'}`}
        >
          {p}
        </button>
      ))}

      {window[window.length - 1] < pages && (
        <>
          {window[window.length - 1] < pages - 1 && <span className="text-text-light/40 px-1">…</span>}
          <button onClick={() => onChange(pages)} className={`${btn} text-text-light hover:text-accent`}>{pages}</button>
        </>
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={`${btn} border border-white/10 text-text-light hover:border-accent/40 hover:text-accent disabled:opacity-40 disabled:pointer-events-none`}
      >
        ›
      </button>
    </nav>
  )
}

/* ===== Модальное окно ===== */
export function Modal({ title, onClose, children, footer, wide = false }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} glass rounded-t-2xl sm:rounded-2xl max-h-[92dvh] flex flex-col focus:outline-none`}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/5">
          <h2 className="font-mono font-bold text-heading text-lg">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-light/60 hover:text-heading hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-white/5 flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  )
}

/* ===== Подтверждение опасного действия ===== */
export function ConfirmDialog({ title, text, confirmLabel = 'Подтвердить', danger = true, busy, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`text-sm py-2 px-4 rounded-lg font-semibold text-white transition-colors disabled:opacity-60 ${
              danger ? 'bg-red-500/90 hover:bg-red-500' : 'bg-accent hover:bg-accent-dark'
            }`}
          >
            {busy ? 'Выполняем…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-text-light text-sm leading-relaxed">{text}</p>
    </Modal>
  )
}

/* ===== Плашка «нужен вход» ===== */
export function LoginNotice({ text = 'Чтобы писать на форуме, нужно войти.' }) {
  return (
    <div className="card border-accent/20 bg-accent/5">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">🔐</span>
        <div className="min-w-0">
          <p className="text-heading font-medium mb-1">Нужна авторизация</p>
          <p className="text-text-light/80 text-sm leading-relaxed">
            {text} Нажмите «Войти» в шапке — через привычный аккаунт или командой{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/auth</code> в игре.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ===== Поля форм ===== */
export const inputClass =
  'w-full bg-bg-section border border-white/10 rounded-xl px-3 py-2 text-sm text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors'

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-text-light/70 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <span
        className={`relative w-10 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 flex-shrink-0 ${
          checked ? 'bg-accent' : 'bg-white/10'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </span>
      <span className="text-sm text-text-light">{label}</span>
    </label>
  )
}

/* ===== Инлайн-ошибка формы ===== */
export function FormError({ error }) {
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-red-400 mt-2">
      {error}
    </p>
  )
}
