import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ForumSearchBar({ className = '', initial = '' }) {
  const [query, setQuery] = useState(initial)
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    navigate(`/forum/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-light/40 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по форуму…"
        maxLength={120}
        aria-label="Поиск по форуму"
        className="w-full bg-bg-card border border-white/10 rounded-xl pl-11 pr-24 py-3 text-heading placeholder-text-light/30 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
      />
      <button
        type="submit"
        disabled={query.trim().length < 2}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Найти
      </button>
    </form>
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
