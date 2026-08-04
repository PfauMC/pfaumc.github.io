import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { UserHead, RoleBadge, FormError } from '../../components/forum/ui'
import { Toggle } from './ForumHome'

export default function AuthGamePage() {
  useSEO('Вход через Minecraft — PfauMC', 'Подтверждение входа на форум PfauMC по одноразовой ссылке из игры.')

  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { user, refresh } = useForumAuth()
  const navigate = useNavigate()

  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await api('/auth/game', { method: 'POST', body: { token, remember } })
      await refresh()
      setDone(data.user)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-start justify-center">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="card text-center">
          <div className="text-4xl mb-3" aria-hidden="true">⛏️</div>

          {done ? (
            <>
              <h1 className="font-mono text-xl font-bold text-heading mb-2">Готово</h1>
              <div className="flex items-center justify-center gap-2.5 my-4">
                <UserHead user={done} size={40} link={false} />
                <div className="text-left">
                  <p className="font-mono font-semibold text-heading">{done.name}</p>
                  <RoleBadge role={done.role} />
                </div>
              </div>
              <p className="text-text-light/70 text-sm mb-5">Вы вошли на форум PfauMC.</p>
              <button onClick={() => navigate('/forum')} className="btn-primary text-sm py-2.5 px-5">
                Перейти на форум
              </button>
            </>
          ) : !token ? (
            <>
              <h1 className="font-mono text-xl font-bold text-heading mb-2">Ссылка неполная</h1>
              <p className="text-text-light/70 text-sm mb-5">
                В адресе нет токена входа. Зайдите на сервер и введите{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/login</code>.
              </p>
              <Link to="/forum" className="btn-ghost text-sm py-2.5 px-5 inline-flex">На форум</Link>
            </>
          ) : user ? (
            <>
              <h1 className="font-mono text-xl font-bold text-heading mb-2">Вы уже вошли</h1>
              <p className="text-text-light/70 text-sm mb-5">
                Аккаунт: <span className="font-mono text-heading">{user.name}</span>. Можно продолжить вход по новой
                ссылке или просто вернуться на форум.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={submit} disabled={busy} className="btn-ghost text-sm py-2.5 px-5">
                  {busy ? 'Входим…' : 'Войти заново'}
                </button>
                <Link to="/forum" className="btn-primary text-sm py-2.5 px-5 inline-flex">На форум</Link>
              </div>
              <FormError error={error} />
            </>
          ) : (
            <>
              <h1 className="font-mono text-xl font-bold text-heading mb-2">Вход через Minecraft</h1>
              <p className="text-text-light/70 text-sm mb-5 leading-relaxed">
                Ссылка одноразовая и действует несколько минут. Подтвердите вход, чтобы продолжить.
              </p>

              <div className="flex justify-center mb-5">
                <Toggle checked={remember} onChange={setRemember} label="Запомнить меня на этом устройстве" />
              </div>

              <button onClick={submit} disabled={busy} className="btn-primary text-sm py-2.5 px-6 w-full justify-center">
                {busy ? 'Проверяем токен…' : 'Войти'}
              </button>

              <FormError error={error} />
            </>
          )}
        </div>

        <p className="text-center text-xs text-text-light/40 mt-4">
          Токен проверяется на сервере и сгорает после первого использования.
        </p>
      </div>
    </div>
  )
}
