import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { usePlayerProfile } from '../hooks/usePlayerProfile'
import { avatarUrl, formatExactDateTime, formatPlaytime, formatRelativeTime } from '../utils/playerFormat'
import ActivityHeatmap from '../components/ActivityHeatmap'

export default function PlayerProfilePage() {
  const { nickname } = useParams()
  const { profile, loading, notFound, error, retry } = usePlayerProfile(nickname)

  useSEO(
    profile ? `${profile.name} — профиль игрока | PfauMC` : `Игрок ${nickname} — PfauMC`,
    profile ? `Профиль игрока ${profile.name} на Minecraft сервере PfauMC.` : undefined
  )

  if (loading) return <ProfileSkeleton />

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="font-mono text-2xl font-bold text-heading">Игрок не найден</p>
        <p className="text-text-light text-sm max-w-sm">
          Такого игрока нет в базе, либо он ещё ни разу не заходил на сервер.
        </p>
        <Link to="/players" className="btn-primary mt-2">← К списку игроков</Link>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-text-light">Не удалось загрузить профиль игрока</p>
        <div className="flex gap-3">
          <button onClick={retry} className="btn-primary">Повторить</button>
          <Link to="/players" className="btn-ghost">← К списку игроков</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to="/players" className="inline-flex items-center gap-2 text-text-light/60 hover:text-heading text-sm font-medium mb-8 transition-colors">
          <BackIcon className="w-4 h-4" />
          К списку игроков
        </Link>

        {/* Header card */}
        <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
          <img
            src={avatarUrl(profile.uuid, 160)}
            alt={profile.name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-2xl bg-bg-section flex-shrink-0"
          />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading break-words">{profile.name}</h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full border text-accent bg-accent/10 border-accent/20">
                {profile.role}
              </span>
              <StatusBadge online={profile.online} lastSeen={profile.lastSeen} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <h2 className="font-mono font-bold text-heading text-sm mb-3 uppercase tracking-widest text-text-light/50">
            Статистика
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Всего" value={formatPlaytime(profile.playtime.allTimeMin)} />
            <StatTile label="За месяц" value={formatPlaytime(profile.playtime.monthMin)} />
            <StatTile label="За неделю" value={formatPlaytime(profile.playtime.weekMin)} />
            <StatTile label="Сегодня" value={formatPlaytime(profile.playtime.todayMin)} />
          </div>
        </div>

        {/* Activity heatmap */}
        {profile.activity && profile.activity.some((d) => d.minutes > 0) && (
          <div className="mb-6">
            <h2 className="font-mono font-bold text-heading text-sm mb-3 uppercase tracking-widest text-text-light/50">
              Активность за год
            </h2>
            <div className="card">
              <ActivityHeatmap activity={profile.activity} />
            </div>
          </div>
        )}

        {profile.integrations && profile.integrations.length > 0 && (
          <div>
            <h2 className="font-mono font-bold text-heading text-sm mb-3 uppercase tracking-widest text-text-light/50">
              Интеграции
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.integrations.map((i) => (
                <span key={i.label} className="text-sm text-text-light bg-bg-card border border-white/5 rounded-lg px-3 py-2">
                  {i.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ online, lastSeen }) {
  const [showExact, setShowExact] = useState(false)

  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-medium bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        В сети
      </span>
    )
  }

  if (!lastSeen) {
    return <span className="text-text-light/40 text-xs">Не в сети</span>
  }

  return (
    <button
      onClick={() => setShowExact((v) => !v)}
      title={formatExactDateTime(lastSeen)}
      className="text-text-light/50 hover:text-text-light text-xs transition-colors cursor-pointer"
    >
      {showExact ? formatExactDateTime(lastSeen) : `Был на сервере ${formatRelativeTime(lastSeen)}`}
    </button>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="card text-center py-4">
      <div className="font-mono text-lg font-bold text-heading">{value}</div>
      <div className="text-text-light/50 text-xs mt-1">{label}</div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-bg-card mb-8" />
        <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
          <div className="w-24 h-24 rounded-2xl bg-bg-section flex-shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-6 w-40 rounded bg-bg-section mx-auto sm:mx-0" />
            <div className="h-4 w-24 rounded bg-bg-section mx-auto sm:mx-0" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-16 bg-bg-section" />
          ))}
        </div>
      </div>
    </div>
  )
}

function BackIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}
