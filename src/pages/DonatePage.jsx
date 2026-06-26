import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PaymentModal from '../components/PaymentModal'

const fluxPackages = [
  { amount: 10000, price: 1     },
  { amount: 100,   price: 100   },
  { amount: 250,   price: 250   },
  { amount: 500,   price: 500   },
  { amount: 1000,  price: 1000  },
  { amount: 2000,  price: 2000  },
  { amount: 3000,  price: 3000  },
  { amount: 5000,  price: 5000  },
  { amount: 10000, price: 10000 },
]

export default function DonatePage() {
  const [visible, setVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [paidStatus, setPaidStatus] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    window.scrollTo(0, 0)
    setTimeout(() => setVisible(true), 80)

    const paid = searchParams.get('paid')
    if (paid === 'ok') {
      setPaidStatus('success')
      setSearchParams({}, { replace: true })
    } else if (paid === 'fail') {
      setPaidStatus('fail')
      setSearchParams({}, { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen">

      {/* Paid status banners */}
      {paidStatus === 'success' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-sm font-semibold px-5 py-3 rounded-xl shadow-lg backdrop-blur">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Оплата прошла успешно! Гхыбки будут начислены в течение нескольких минут.
          <button onClick={() => setPaidStatus(null)} className="ml-2 opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      {paidStatus === 'fail' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-red-900/90 border border-red-500/40 text-red-300 text-sm font-semibold px-5 py-3 rounded-xl shadow-lg backdrop-blur">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
          </svg>
          Платёж отменён или отклонён. Попробуйте ещё раз.
          <button onClick={() => setPaidStatus(null)} className="ml-2 opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="relative pt-28 pb-14 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-text-light/60 hover:text-white text-sm font-medium mb-10 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            На главную
          </Link>
          <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-accent font-mono text-sm font-semibold tracking-widest uppercase mb-3">Поддержать сервер</p>
            <h1 className="font-mono text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">Донат</h1>
            <p className="text-text-light text-lg max-w-xl">
              Поддержи сервер и получи внутриигровую валюту — гхыбки.
            </p>
          </div>
        </div>
      </section>

      {/* Currency packages */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h2 className="font-mono text-2xl font-bold text-white mb-2">Гхыбки — игровая валюта</h2>
          <p className="text-text-light">Внутриигровая валюта сервера. Используй для торговли, покупок и обменов.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {fluxPackages.map((pkg) => (
            <div
              key={pkg.amount}
              className="card hover:border-accent/20 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">💎</div>
                <div className="font-mono text-2xl font-bold text-gradient">{pkg.amount.toLocaleString('ru-RU')}</div>
                <div className="text-text-light/50 text-sm">гхыбок</div>
              </div>
              <div className="text-center text-lg font-bold text-white">{pkg.price.toLocaleString('ru-RU')} ₽</div>
              <button
                onClick={() => setSelectedItem({ name: `${pkg.amount.toLocaleString('ru-RU')} гхыбок`, price: pkg.price })}
                className="btn-primary text-sm justify-center"
              >
                Купить
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="border border-white/5 rounded-xl p-5 bg-bg-section text-text-light/50 text-sm text-center">
          Все покупки предоставляются навсегда и не привязаны к сезонам. Возврат средств осуществляется в соответствии с пользовательским соглашением. По вопросам обращайтесь в{' '}
          <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Discord</a>.
        </div>
      </div>

      {/* Payment modal */}
      {selectedItem && (
        <PaymentModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
