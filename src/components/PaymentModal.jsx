import { useState, useEffect } from 'react'
import { createPayment } from '../utils/tbank'

export default function PaymentModal({ item, onClose }) {
  const [nick, setNick] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Закрытие по Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handlePay = async () => {
    const trimmed = nick.trim()
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(trimmed)) {
      setError('Никнейм: 3–16 символов, только латиница, цифры и _')
      return
    }
    setLoading(true)
    setError('')
    try {
      const url = await createPayment({
        amount: item.price,
        description: item.name,
        nick: trimmed,
      })
      window.location.href = url
    } catch (e) {
      setError(e.message || 'Неизвестная ошибка')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-card border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-light/40 hover:text-heading transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-5">
          <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase mb-2">Оплата</p>
          <h3 className="font-mono text-lg font-bold text-heading leading-tight">{item.name}</h3>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-bold text-accent">{item.price.toLocaleString('ru-RU')}</span>
            <span className="text-text-light/60 text-base">₽</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-5" />

        {/* Nick input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-light/80 mb-2">
            Ваш никнейм на сервере
          </label>
          <input
            type="text"
            value={nick}
            onChange={e => { setNick(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && !loading && handlePay()}
            placeholder="Minecraft никнейм"
            maxLength={16}
            autoFocus
            className="w-full bg-bg-section border border-white/10 rounded-xl px-4 py-3 text-heading placeholder-text-light/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors font-mono text-sm"
          />
          {error && (
            <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading || !nick.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-accent text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(29,165,232,0.2)]"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              Подождите...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Оплатить
            </>
          )}
        </button>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-text-light/30 leading-relaxed">
          Нажимая «Оплатить», вы принимаете{' '}
          <a href="/agreement.pdf" target="_blank" rel="noopener noreferrer" className="text-accent/60 hover:text-accent underline transition-colors">
            соглашение
          </a>
          {' '}и{' '}
          <a href="/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-accent/60 hover:text-accent underline transition-colors">
            политику конфиденциальности
          </a>
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-text-light/20 text-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Защищённая оплата — данные карты Т-Банк не передаются сайту
        </div>
      </div>
    </div>
  )
}
