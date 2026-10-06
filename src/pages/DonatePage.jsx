import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForumAuth } from '../context/ForumAuthContext'
import { useSEO } from '../hooks/useSEO'
import { PLANS, periodPrice, planName, planRank, subscriptionApi } from '../lib/subscriptionApi'

export default function DonatePage() {
  useSEO('Подписки — PfauMC', 'Поддержите сервер PfauMC и выберите подписку: Фанат, Меценат или Спонсор.')
  const { user, loading: authLoading } = useForumAuth()
  const [params, setParams] = useSearchParams()
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(null)
  const [months, setMonths] = useState(() => {
    const saved = Number(sessionStorage.getItem('pfau_sub_period'))
    return [1, 3, 12].includes(saved) ? saved : 1
  })
  const [message, setMessage] = useState(null)
  const payment = params.get('payment')

  useEffect(() => {
    if (!user) { setState(null); return }
    let live = true
    setLoading(true)
    subscriptionApi('/me').then((data) => { if (live) setState(data) })
      .catch(() => { if (live) setMessage('Не удалось получить данные подписки. Попробуйте обновить страницу.') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [user?.uuid])

  useEffect(() => {
    if (!user || !payment) return undefined
    let attempts = 0
    let timer
    const check = async () => {
      try {
        const data = await subscriptionApi(`/payments/${encodeURIComponent(payment)}`)
        if (data.payment.status === 'confirmed') {
          setMessage('Оплата подтверждена. Подписка активна!')
          setState(await subscriptionApi('/me'))
          setParams({}, { replace: true })
        } else if (data.payment.status === 'payment_failed') {
          setMessage('Платёж не прошёл. Попробуйте ещё раз.')
          setParams({}, { replace: true })
        } else if (++attempts < 15) {
          timer = setTimeout(check, 3000)
        } else setMessage('Платёж обрабатывается. Проверьте статус позже в настройках.')
      } catch { setMessage('Не удалось проверить платёж. Проверьте историю в настройках.') }
    }
    check()
    return () => clearTimeout(timer)
  }, [user?.uuid, payment])

  const current = state?.subscription?.status === 'active' ? state.subscription.plan : null
  const buy = async (plan) => {
    setBusy(plan); setMessage(null)
    try {
      const { url } = await subscriptionApi('/checkout', { method: 'POST', body: { plan, months } })
      window.location.assign(url)
    } catch { setMessage('Не удалось начать оплату. Попробуйте позже.') }
    finally { setBusy(null) }
  }
  const login = () => {
    sessionStorage.setItem('pfau_login_return', '/donate')
    sessionStorage.setItem('pfau_sub_period', String(months))
  }

  return (
    <main className="min-h-screen pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Link to="/" className="text-sm text-text-light hover:text-accent">← На главную</Link>
        <header className="mt-9 mb-10 max-w-2xl">
          <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase mb-3">Поддержать PfauMC</p>
          <h1 className="font-mono text-3xl sm:text-5xl font-bold text-heading mb-4">Подписки</h1>
          <p className="text-text-light">Выберите удобный способ поддержать сервер. Каждый следующий тариф включает возможности предыдущего.</p>
        </header>
        {message && <div role="status" className="card mb-6 text-sm text-heading">{message}</div>}
        {payment && !message && <div role="status" className="card mb-6 text-sm text-heading">Проверяем подтверждение платежа…</div>}
        {current && <div className="card mb-6 border-accent/30 text-sm text-heading">Текущая подписка: <strong>{planName(current)}</strong> · до {new Date(state.subscription.expiresAt).toLocaleDateString('ru-RU')}</div>}
        <p className="text-sm text-text-light mb-2">Срок подписки</p>
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Срок подписки">
          {[[1, '1 месяц', ''], [3, '3 месяца', '−10%'], [12, '1 год', '−30%']].map(([value, title, discount]) =>
            <button key={value} type="button" onClick={() => { setMonths(value); sessionStorage.setItem('pfau_sub_period', String(value)) }} aria-pressed={months === value}
              className={`rounded-xl px-4 py-2 text-sm border transition-colors ${months === value ? 'border-accent bg-accent/10 text-heading' : 'border-white/10 text-text-light hover:border-accent/40'}`}>
              {title}{discount && <span className="ml-2 text-accent font-semibold">{discount}</span>}
            </button>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const lower = current && planRank(plan.key) < planRank(current)
            const same = current === plan.key
            const priceKopecks = periodPrice(plan, months)
            const label = !user ? 'Войти и оформить' : lower ? 'После окончания текущего периода' : same ? months === 1 ? 'Текущая подписка' : `Продлить на ${months} мес.` : current ? `Перейти на ${plan.key === 'maecenas' ? 'Мецената' : 'Спонсора'}` : 'Оформить подписку'
            return (
              <article key={plan.key} className={`card flex flex-col ${plan.key === 'sponsor' ? 'border-amber-400/30' : plan.key === 'maecenas' ? 'border-violet-400/25' : ''}`}>
                <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">{plan.key}</p>
                <h2 className="font-mono text-2xl font-bold text-heading">{plan.name}</h2>
                <p className="mt-3 mb-6"><strong className="font-mono text-3xl text-heading">{(priceKopecks / 100).toLocaleString('ru-RU', { minimumFractionDigits: priceKopecks % 100 ? 2 : 0 })} ₽</strong><span className="text-text-light"> / {months === 1 ? 'месяц' : months === 3 ? '3 месяца' : 'год'}</span>{months > 1 && <span className="block text-xs text-text-light mt-1">Вместо {plan.price * months} ₽ за {months} мес.</span>}</p>
                <ul className="space-y-3 text-sm text-text-light flex-1 mb-8">
                  {plan.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><span className="text-accent" aria-hidden="true">✓</span>{benefit}</li>)}
                </ul>
                {!authLoading && !user ? <Link to="/auth/game" onClick={login} className="btn-primary justify-center text-center">{label}</Link>
                  : <button className="btn-primary justify-center" disabled={authLoading || loading || busy || same && months === 1 || lower || !state && !!user} onClick={() => buy(plan.key)}>{busy === plan.key ? 'Переходим к оплате…' : authLoading || loading ? 'Загружаем…' : label}</button>}
                {lower && <p className="text-xs text-text-light/60 mt-2">Новый тариф можно оформить после окончания текущего.</p>}
              </article>
            )
          })}
        </div>
        <p className="text-xs text-text-light/60 mt-8">Подписка действует оплаченный срок после подтверждения платежа. Автоматического списания нет. Продлить срок можно вручную.</p>
      </div>
    </main>
  )
}
