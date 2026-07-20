import { useCallback, useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 350

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

    fetch(`/api/players/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('bad response')
        return r.json()
      })
      .then((json) => setResults(json.results ?? []))
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

    if (!trimmed) {
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
    if (lastQueryRef.current) runSearch(lastQueryRef.current)
  }, [runSearch])

  return { results, loading, error, retry }
}
