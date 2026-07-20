import { useMemo, useState } from 'react'
import { useSEO } from '../hooks/useSEO'
import { usePlayersOnline } from '../hooks/usePlayersOnline'
import { usePlayerSearch } from '../hooks/usePlayerSearch'
import PlayerCard from '../components/PlayerCard'
import { formatOnlineCount } from '../utils/playerFormat'

export default function PlayersPage() {
  useSEO('Игроки — PfauMC', 'Список игроков онлайн и поиск по всем игрокам Minecraft сервера PfauMC.')

  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0

  const { data: online, loading: onlineLoading, error: onlineError, refresh: refreshOnline } = usePlayersOnline()
  const { results, loading: searchLoading, error: searchError, retry: retrySearch } = usePlayerSearch(query)

  const onlineCount = online?.count ?? 0

  const showList = isSearching ? results : online?.players ?? []
  const listLoading = isSearching ? searchLoading : onlineLoading
  const listError = isSearching ? searchError : onlineError
  const retry = isSearching ? retrySearch : refreshOnline

  const emptyMessage = useMemo(() => {
    if (isSearching) return 'Игроки с таким никнеймом не найдены'
    if (online && !online.namesAvailable) return 'Список игроков временно недоступен'
    return 'Сейчас на сервере никого нет'
  }, [isSearching, online])

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-2">Игроки</h1>
          <p className="text-text-light text-base">
            {onlineLoading && !online ? 'Загрузка...' : `Сейчас на сервере: ${formatOnlineCount(onlineCount)}`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-light/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по нику..."
            maxLength={40}
            aria-label="Поиск игроков по нику"
            className="w-full bg-bg-card border border-white/10 rounded-xl pl-11 pr-11 py-3 text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Очистить поиск"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-text-light/40 hover:text-heading hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 transition-colors"
            >
              <ClearIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Result count while searching — kept separate from the online count above */}
        {isSearching && !searchLoading && !searchError && (
          <p className="text-text-light/50 text-sm mb-5">
            {results.length === 0 ? 'Ничего не найдено' : `Найдено: ${formatOnlineCount(results.length)}`}
          </p>
        )}
        {!isSearching && <div className="mb-5" />}

        {/* Content */}
        {listError ? (
          <div className="card text-center py-10">
            <p className="text-text-light mb-4">
              {isSearching ? 'Не удалось выполнить поиск' : 'Не удалось загрузить список игроков'}
            </p>
            <button onClick={retry} className="btn-ghost text-sm py-2 px-4">
              Повторить
            </button>
          </div>
        ) : listLoading && showList.length === 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
          </div>
        ) : showList.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-text-light">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {showList.map((p) => <PlayerCard key={p.uuid} player={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function PlayerCardSkeleton() {
  return (
    <div className="card flex items-center gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-bg-section flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 w-24 rounded bg-bg-section" />
        <div className="h-2.5 w-14 rounded bg-bg-section" />
      </div>
    </div>
  )
}

function SearchIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ClearIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
