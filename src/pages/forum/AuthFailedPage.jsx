import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import LoginModal from '../../components/forum/LoginModal'

export default function AuthFailedPage() {
  useSEO('Не удалось войти — PfauMC', 'Внешний аккаунт не привязан ни к одному игроку PfauMC.')

  const [params] = useSearchParams()
  const reason = params.get('reason')
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-start justify-center">
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="card text-center">
          <div className="text-4xl mb-3" aria-hidden="true">🔒</div>

          {reason === 'no_accounts' ? (
            <>
              <h1 className="font-mono text-xl font-bold text-heading mb-2">Аккаунт не привязан</h1>
              <p className="text-text-light/70 text-sm mb-5 leading-relaxed">
                Мы не нашли ни одного игрока PfauMC, привязанного к этому аккаунту. Зайдите на сервер, введите{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/auth</code> и войдите по
                одноразовой ссылке — после этого привязку можно добавить в настройках форума, и вход по кнопке
                заработает.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-mono text-xl font-bold text-heading mb-2">Вход не удался</h1>
              <p className="text-text-light/70 text-sm mb-5 leading-relaxed">
                Авторизация прервалась{reason ? ` (${reason})` : ''}. Попробуйте ещё раз или войдите через игру.
              </p>
            </>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => setLoginOpen(true)} className="btn-ghost text-sm py-2.5 px-5">
              Другой способ входа
            </button>
            <Link to="/forum" className="btn-primary text-sm py-2.5 px-5 inline-flex">На форум</Link>
          </div>
        </div>

        <p className="text-center text-xs text-text-light/40 mt-4">
          Аккаунт на сайте не создаётся сам по себе — он всегда принадлежит игроку сервера.
        </p>
      </div>

      {loginOpen && <LoginModal next="/forum" onClose={() => setLoginOpen(false)} />}
    </div>
  )
}
