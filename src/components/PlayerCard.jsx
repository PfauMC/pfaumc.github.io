import { Link } from 'react-router-dom'
import { usePlayerMeta } from '../hooks/usePlayerMeta'
import { roleLabel } from '../lib/gameApi'
import { formatRelativeTime } from '../utils/playerFormat'
import PlayerHead from './PlayerHead'

export default function PlayerCard({ player }) {
  const { id, name, online, lastSeen } = player
  const meta = usePlayerMeta(id)

  return (
    <Link
      to={`/u/${encodeURIComponent(name)}`}
      className="card group flex items-center gap-3 hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 p-4"
    >
      <div className="relative flex-shrink-0">
        <PlayerHead uuid={id} name={name} size={40} className="rounded-lg" />
        {online && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-bg-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm font-semibold text-heading group-hover:text-accent transition-colors truncate">
          {name}
        </div>
        {meta && <div className="text-text-light/50 text-xs truncate">{roleLabel(meta.role)}</div>}
      </div>

      <div className="flex-shrink-0 text-right">
        {online ? (
          <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            В сети
          </span>
        ) : (
          <span className="text-text-light/40 text-xs">
            {lastSeen ? formatRelativeTime(lastSeen) : 'Не в сети'}
          </span>
        )}
      </div>
    </Link>
  )
}
