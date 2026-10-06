import { useState } from 'react'
import { useForumAuth } from '../../context/ForumAuthContext'
import { useApiData } from '../../hooks/useApiData'
import { usePlayerSearch } from '../../hooks/usePlayerSearch'
import { PLANS, planName, subscriptionApi } from '../../lib/subscriptionApi'
import { FormError, UserHead } from '../../components/forum/ui'
import ModerationShell from './ModerationShell'

export default function SubscriptionAdminPage() {
  const { user } = useForumAuth()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [plan, setPlan] = useState('fun')
  const [days, setDays] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const search = usePlayerSearch(query)
  const isAdmin = ['admin', 'owner'].includes(user?.role?.key)
  const details = useApiData(isAdmin && selected ? `/admin/players/${selected.id}` : null, { fetcher: subscriptionApi })
  const change = async (action) => {
    setBusy(true); setError(null)
    try {
      await subscriptionApi(`/admin/players/${selected.id}`, { method: 'PATCH', body: { action, plan: action === 'end' || action === 'extend' ? null : plan, days: Number(days) } })
      details.reload()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  return <ModerationShell>
    {!isAdmin ? <p className="text-text-light">Доступно только администраторам.</p> : <div className="space-y-5">
      <label className="block text-sm text-text-light">Игрок<input className="w-full mt-2 bg-bg-section border border-white/10 rounded-lg px-3 py-2 text-heading" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Введите ник" /></label>
      {search.loading && <p className="text-xs text-text-light">Ищем…</p>}
      {search.error && <p className="text-xs text-red-400">Поиск не удался.</p>}
      {!!search.results.length && <div className="card flex flex-wrap gap-2">{search.results.map((player) => <button key={player.id} onClick={() => { setSelected(player); setQuery('') }} className="btn-ghost text-sm py-2 px-3">{player.name}</button>)}</div>}
      {selected && <div className="card space-y-4">
        <div className="flex items-center gap-3"><UserHead user={{ uuid: selected.id, name: selected.name }} size={40} link={false} /><strong className="text-heading">{selected.name}</strong></div>
        {details.loading && !details.data ? <p className="text-sm text-text-light">Загружаем…</p> : details.error ? <p className="text-sm text-red-400">Данные недоступны. <button onClick={details.reload} className="underline">Повторить</button></p> : <>
          <p className="text-sm text-text-light">{details.data?.subscription ? `${planName(details.data.subscription.plan)} · ${details.data.subscription.status} · ${new Date(details.data.subscription.startedAt).toLocaleDateString('ru-RU')} — ${new Date(details.data.subscription.expiresAt).toLocaleDateString('ru-RU')}` : 'Подписки нет'}</p>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs text-text-light">Тариф<select className="block bg-bg-section border border-white/10 rounded-lg p-2 mt-1 text-heading" value={plan} onChange={(e) => setPlan(e.target.value)}>{PLANS.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
            <label className="text-xs text-text-light">Дней<input type="number" min="1" max="365" className="block w-24 bg-bg-section border border-white/10 rounded-lg p-2 mt-1 text-heading" value={days} onChange={(e) => setDays(e.target.value)} /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary text-sm py-2 px-3" disabled={busy} onClick={() => change(details.data.subscription ? 'change' : 'grant')}>{details.data.subscription ? 'Изменить тариф' : 'Выдать'}</button>
            {details.data.subscription && <button className="btn-ghost text-sm py-2 px-3" disabled={busy} onClick={() => change('extend')}>Продлить</button>}
            {details.data.subscription && <button className="btn-ghost text-sm py-2 px-3 text-red-400" disabled={busy} onClick={() => change('end')}>Завершить</button>}
          </div>
          <FormError error={error} />
          <h3 className="text-sm font-semibold text-heading">История платежей</h3>
          {details.data.payments.map((payment) => <p key={payment.id} className="text-xs text-text-light break-all">{new Date(payment.createdAt).toLocaleDateString('ru-RU')} · {planName(payment.plan)} · {payment.amountKopecks / 100} ₽ · {payment.status} · {payment.externalPaymentId ?? payment.id}</p>)}
        </>}
      </div>}
    </div>}
  </ModerationShell>
}
