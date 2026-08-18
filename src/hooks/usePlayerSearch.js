import { useCallback, useEffect, useRef, useState } from 'react'
import { gameApi } from '../lib/gameApi'

const DEBOUNCE_MS = 350
// Бэкенд отвечает 400 на запрос короче двух символов.
const MIN_QUERY = 2

export function usePlayerSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef(null)
  const lastQueryRef = useRef('')

  const runSearch = useCallback((trimmed) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(false)

    gameApi(`/players?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
      .then((json) =>
        setResults(
          (json.items ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            online: r.online,
            skin: r.skin,
            roles: r.roles,
          }))
        )
      )
      .catch((e) => {
        if (e.name !== 'AbortError') setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    lastQueryRef.current = trimmed

    if (trimmed.length < MIN_QUERY) {
      abortRef.current?.abort()
      setResults([])
      setLoading(false)
      setError(false)
      return
    }

    const timer = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  useEffect(() => () => abortRef.current?.abort(), [])

  const retry = useCallback(() => {
    if (lastQueryRef.current.length >= MIN_QUERY) runSearch(lastQueryRef.current)
  }, [runSearch])

  return { results, loading, error, retry }
}
