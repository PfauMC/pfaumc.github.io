import { useEffect } from 'react'
import { useSEO } from '../hooks/useSEO'
import { useApiData } from '../hooks/useApiData'
import { usePlayersOnline } from '../hooks/usePlayersOnline'
import { gameApi } from '../lib/gameApi'
import OnlineChart from '../components/OnlineChart'
import { SERVER_VERSION } from '../config'

const REFRESH_MS = 120_000

export default function StatsPage() {
  useSEO(
    'Онлайн сервера — PfauMC',
    'Статистика Minecraft сервера PfauMC: онлайн сейчас, график за эту и прошлую неделю, аптайм и средние показатели.'
  )

  // Кто именно в сети — из игрового бэкенда: это наши сессии, точные до игрока.
  // График, аптайм, слоты и версия — оттуда же, но это сквозной прокси mcwatch:
  // свою историю онлайна бэкенд не собирает, а сам mcwatch не отдаёт CORS.
  const { data: monitor, loading, error, reload } = useApiData('/monitor', { fetcher: gameApi })
  const { data: online, refresh: refreshOnline } = usePlayersOnline()

  // Ответ кэшируется на стороне сервера на 5 минут — чаще опрашивать нет смысла.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        reload()
        refreshOnline()
      }
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [reload, refreshOnline])

  const onlineCount = online?.count ?? 0
  const maxOnline = monitor?.max_online ?? null
  const fillPct = maxOnline ? Math.round((onlineCount / maxOnline) * 100) : 0
  const players = online?.players ?? []
  // Игровой API отвечает за присутствие, а не за доступность сервера. Если
  // мониторинг недоступен, судим по факту: есть игроки — значит поднят.
  const isUp = monitor ? monitor.is_up : onlineCount > 0 ? true : null

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-2">Статистика сервера</h1>
          <p className="text-text-light text-base">
            Кто в сети — по нашим игровым сессиям. График, аптайм и слоты — по данным мониторинга mcwatch.
          </p>
        </header>

        {error && !monitor ? (
          <div className="card text-center py-10" role="alert">
            <p className="text-text-light mb-4">Не удалось загрузить статистику сервера</p>
            <button onClick={reload} className="btn-ghost text-sm py-2 px-4">Повторить</button>
          </div>
        ) : (
          <>
            {/* Статус */}
            <div className="card mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-card-glow pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border flex-shrink-0 ${
                      loading && !monitor
                        ? 'bg-bg-section border-white/10'
                        : isUp
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    {loading && !monitor ? (
                      <SpinIcon className="w-7 h-7 text-accent animate-spin" />
                    ) : isUp ? (
                      <CheckCircleIcon className="w-7 h-7 text-green-400" />
                    ) : (
                      <OfflineIcon className="w-7 h-7 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-mono text-xl font-bold ${
                        loading && !monitor ? 'text-text-light' : isUp ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {loading && !monitor ? 'Загрузка…' : isUp ? 'Сервер онлайн' : 'Сервер недоступен'}
                    </div>
                    <div className="text-text-light/60 text-sm font-mono mt-0.5 truncate">
                      {monitor?.host ?? 'play.pfaumc.online'}
                    </div>
                    {monitor?.motd?.length > 0 && (
                      <p className="text-text-light/40 text-xs mt-1.5">{monitor.motd.join(' · ')}</p>
                    )}
                  </div>
                </div>

                <div className="sm:ml-auto flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
                  <div className="text-text-light/50 text-xs">Последняя проверка</div>
                  <div className="font-mono text-sm text-text-light">{formatTime(monitor?.checked_at)}</div>
                  <button
                    onClick={reload}
                    disabled={loading}
                    className="text-accent hover:text-accent/80 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1 mt-1"
                  >
                    <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                  </button>
                </div>
              </div>
            </div>

            {/* Онлайн и показатели */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="card col-span-1 sm:col-span-2">
                <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-3">Игроков онлайн</div>
                <div className="flex items-end gap-3 mb-4">
                  <div className="font-mono text-5xl font-bold text-heading tabular-nums">
                    {online ? onlineCount : <span className="opacity-30">—</span>}
                  </div>
                  {maxOnline && (
                    <div className="font-mono text-2xl text-text-light/40 mb-1 tabular-nums">/ {maxOnline}</div>
                  )}
                </div>

                {maxOnline > 0 && (<>
                <div className="w-full h-2 bg-bg-section rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, fillPct)}%`,
                      background:
                        fillPct > 80
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #1DA5E8, #7DD3F8)',
                    }}
                  />
                </div>
                <div className="text-text-light/40 text-xs mt-1.5">{fillPct}% заполнен</div>
                </>)}

                {players.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-2">Кто в сети</div>
                    <div className="flex flex-wrap gap-2">
                      {players.slice(0, 24).map((p) => (
                        <span
                          key={p.uuid}
                          className="inline-flex items-center gap-1.5 bg-bg-section border border-white/5 rounded-lg px-2.5 py-1 text-xs font-mono text-text-light"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                          {p.name}
                        </span>
                      ))}
                      {players.length > 24 && (
                        <span className="text-text-light/40 text-xs self-center">+{players.length - 24} ещё</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <Metric
                  label="Аптайм за 2 недели"
                  value={monitor?.uptime_pct != null ? `${monitor.uptime_pct.toFixed(2)}%` : '—'}
                  desc={monitor?.first_observed_at ? `Наблюдение с ${formatDate(monitor.first_observed_at)}` : 'Внешний мониторинг'}
                />
                <Metric
                  label="Средний онлайн"
                  value={monitor?.avg_day != null ? Math.round(monitor.avg_day) : '—'}
                  desc="за последние сутки"
                />
                <Metric
                  label="Средний за неделю"
                  value={monitor?.avg_week != null ? Math.round(monitor.avg_week) : '—'}
                  desc={monitor?.peak ? `Пик ${monitor.peak.value} — ${formatDate(monitor.peak.at)}` : null}
                />
              </div>
            </div>

            {/* График */}
            <div className="card mb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h2 className="font-mono text-lg font-bold text-heading">Онлайн по часам</h2>
                <span className="text-text-light/40 text-xs">эта неделя против прошлой</span>
              </div>

              {loading && !monitor ? (
                <div className="h-64 rounded-xl bg-bg-section animate-pulse" role="status" aria-label="Загрузка графика" />
              ) : (
                <OnlineChart
                  current={monitor?.weeks?.current?.avg}
                  previous={monitor?.weeks?.previous?.avg}
                  currentStart={monitor?.weeks?.current_start}
                />
              )}
            </div>

            {/* Информация о сервере */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard icon="🧱" title="Версия" value={SERVER_VERSION} desc={monitor?.version ?? 'Java Edition'} />
              <InfoCard icon="🌿" title="Режим" value="Ванила" desc="Честная игра и защита построек" />
              <InfoCard
                icon="🕐"
                title="Режим работы"
                value="24/7"
                desc={monitor?.ip ? `IP ${monitor.ip}` : 'Сервер работает круглосуточно'}
              />
            </div>

            <p className="mt-8 text-center text-text-light/30 text-xs font-mono">
              Кто в сети — игровой бэкенд PfauMC. История и аптайм —{' '}
              <a
                href={monitor?.source ?? 'https://mcwatch.online/servers/pfaumc'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent/60 hover:text-accent transition-colors"
              >
                mcwatch.online
              </a>{' '}
              · обновляется раз в 2 минуты
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function Metric({ label, value, desc }) {
  return (
    <div className="card flex-1">
      <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-2">{label}</div>
      <div className="font-mono text-2xl font-bold text-heading tabular-nums">{value}</div>
      {desc && <div className="text-text-light/40 text-xs mt-1">{desc}</div>}
    </div>
  )
}

function InfoCard({ icon, title, value, desc }) {
  return (
    <div className="card text-center">
      <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
      <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-1">{title}</div>
      <div className="font-mono text-lg font-bold text-heading mb-1">{value}</div>
      <div className="text-text-light/50 text-xs break-words">{desc}</div>
    </div>
  )
}

function CheckCircleIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8,12.5 11,15.5 16,9" />
    </svg>
  )
}

function OfflineIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function SpinIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function RefreshIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
