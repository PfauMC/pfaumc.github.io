import { useServerStats } from '../hooks/useServerStats'
import { useOnlineHistory } from '../hooks/useOnlineHistory'
import WeeklyOnlineChart from '../components/WeeklyOnlineChart'
import { useSEO } from '../hooks/useSEO'

export default function StatsPage() {
  useSEO('Онлайн сервера — PfauMC', 'Статистика и график онлайна Minecraft сервера PfauMC в реальном времени.')

  const { stats, loading, lastUpdated, refresh } = useServerStats(60000)
  const { history } = useOnlineHistory()

  const fmtTime = (d) => {
    if (!d) return '—'
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const fillPct = stats ? Math.round((stats.players / Math.max(stats.maxPlayers, 1)) * 100) : 0

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-mono text-3xl sm:text-4xl font-bold text-white mb-2">
            Статистика сервера
          </h1>
          <p className="text-text-light text-base">
            Данные обновляются автоматически раз в минуту
          </p>
        </div>

        {/* Main status card */}
        <div className="card mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-card-glow pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Status indicator */}
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="w-16 h-16 rounded-2xl bg-bg-section border border-white/10 flex items-center justify-center">
                  <SpinIcon className="w-7 h-7 text-accent animate-spin" />
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                  stats?.online
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <span className="text-3xl">{stats?.online ? '🟢' : '🔴'}</span>
                </div>
              )}
              <div>
                <div className={`font-mono text-xl font-bold ${
                  loading ? 'text-text-light' : stats?.online ? 'text-green-400' : 'text-red-400'
                }`}>
                  {loading ? 'Загрузка...' : stats?.online ? 'Сервер онлайн' : 'Сервер недоступен'}
                </div>
                <div className="text-text-light/60 text-sm font-mono mt-0.5">play.pfaumc.online</div>
              </div>
            </div>

            <div className="sm:ml-auto flex flex-col items-start sm:items-end gap-1">
              <div className="text-text-light/50 text-xs">Последнее обновление</div>
              <div className="font-mono text-sm text-text-light">{fmtTime(lastUpdated)}</div>
              <button
                onClick={refresh}
                disabled={loading}
                className="text-accent hover:text-accent/80 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1 mt-1"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Players */}
          <div className="card col-span-1 sm:col-span-2">
            <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-3">Игроков онлайн</div>
            <div className="flex items-end gap-3 mb-4">
              <div className="font-mono text-5xl font-bold text-white">
                {loading ? <span className="opacity-30">—</span> : stats?.players ?? 0}
              </div>
              <div className="font-mono text-2xl text-text-light/40 mb-1">
                / {loading ? '—' : stats?.maxPlayers ?? 0}
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-bg-section rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: loading ? '0%' : `${fillPct}%`,
                  background: fillPct > 80
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #1DA5E8, #7DD3F8)',
                }}
              />
            </div>
            <div className="text-text-light/40 text-xs mt-1.5">{fillPct}% заполнен</div>

            {/* Player list */}
            {stats?.playerList?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-2">Кто в сети</div>
                <div className="flex flex-wrap gap-2">
                  {stats.playerList.slice(0, 20).map(p => (
                    <span
                      key={p.uuid || p.name}
                      className="inline-flex items-center gap-1.5 bg-bg-section border border-white/5 rounded-lg px-2.5 py-1 text-xs font-mono text-text-light"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      {p.name}
                    </span>
                  ))}
                  {stats.playerList.length > 20 && (
                    <span className="text-text-light/40 text-xs self-center">+{stats.playerList.length - 20} ещё</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-4">
            {/* Version */}
            <div className="card flex-1">
              <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-2">Версия</div>
              <div className="font-mono text-2xl font-bold text-white">
                {loading ? <span className="opacity-30">—</span> : stats?.version ?? '—'}
              </div>
              <div className="text-text-light/40 text-xs mt-1">Java Edition</div>
            </div>

            {/* Mode */}
            <div className="card flex-1">
              <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-2">Режимы</div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-white font-medium">Ванила</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  <span className="text-white font-medium">Политическое выживание</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly online chart */}
        <div className="card mb-6">
          <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-4">Онлайн по неделям</div>
          {history ? (
            <WeeklyOnlineChart thisWeek={history.thisWeek} lastWeek={history.lastWeek} />
          ) : (
            <div className="text-center py-10 text-text-light/30 text-sm">Загрузка...</div>
          )}
        </div>

        {/* Server info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoCard
            icon="🕐"
            title="Режим работы"
            value="24/7"
            desc="Сервер работает круглосуточно"
          />
          <InfoCard
            icon="💾"
            title="Автосохранение"
            value="Каждые 5 мин"
            desc="Ваш прогресс в безопасности"
          />
          <InfoCard
            icon="🛡️"
            title="Античит"
            value="Активен"
            desc="Защита от читов и эксплойтов"
          />
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-text-light/30 text-xs font-mono">
          Данные предоставлены api.mcsrvstat.us · Обновляется каждые 60 секунд
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, value, desc }) {
  return (
    <div className="card text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-1">{title}</div>
      <div className="font-mono text-lg font-bold text-white mb-1">{value}</div>
      <div className="text-text-light/50 text-xs">{desc}</div>
    </div>
  )
}

function SpinIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}

function RefreshIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}
