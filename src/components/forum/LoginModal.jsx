import { GAME_API_BASE } from '../../lib/gameApi'
import { PROVIDERS, ProviderIcon } from './providers'
import { Modal } from './ui'

function startUrl(provider, next) {
  return `${GAME_API_BASE}/api/v1/forum/auth/providers/${provider}/start?next=${encodeURIComponent(next)}`
}

/**
 * Вход на форум. Кнопки провайдеров — обычные ссылки: поток заканчивается
 * редиректом обратно на сайт с проставленными куками, поэтому это переход
 * страницы, а не fetch.
 */
export default function LoginModal({ onClose, next }) {
  const path = window.location.pathname
  // Возврат на /auth/* после успешного входа снова показал бы экран входа, поэтому уводим на форум.
  const target = next ?? (path.startsWith('/auth/') ? '/forum' : path + window.location.search)

  return (
    <Modal title="Вход на форум" onClose={onClose}>
      <p className="text-sm text-text-light/80 leading-relaxed mb-4">
        Войдите аккаунтом, которым уже пользуетесь.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <a
            key={p.key}
            href={startUrl(p.key, target)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10 bg-bg-section text-sm font-medium text-heading hover:border-accent/40 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <ProviderIcon provider={p.key} className="w-5 h-5 flex-shrink-0" style={{ color: p.color }} />
            {p.label}
          </a>
        ))}
      </div>

      <p className="text-xs text-text-light/50 leading-relaxed mt-3">
        Сработает, только если этот аккаунт уже привязан к вашему игроку: сначала нужно хотя бы раз авторизоваться
        в игре.
      </p>

      <details className="mt-5 pt-4 border-t border-white/5">
        <summary className="text-sm text-text-light/60 hover:text-accent cursor-pointer select-none transition-colors">
          Привязки ещё нет — войти через Minecraft
        </summary>
        <ol className="space-y-3 text-sm text-text-light leading-relaxed mt-3">
          <Step n={1}>Зайдите на сервер PfauMC в Minecraft.</Step>
          <Step n={2}>
            Введите в чат команду{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/auth</code>.
          </Step>
          <Step n={3}>Откройте одноразовую ссылку, которую пришлёт сервер.</Step>
          <Step n={4}>Подтвердите вход — при желании включите «Запомнить меня».</Step>
        </ol>
        <p className="text-xs text-text-light/50 mt-3">
          Этот путь работает всегда: и для лицензии, и пока внешний аккаунт не привязан. Привязать Google, Яндекс,
          Discord или Telegram можно потом в настройках форума.
        </p>
      </details>
    </Modal>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent/15 text-accent text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  )
}
