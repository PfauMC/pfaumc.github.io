import { useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 350

export function usePlayerSearch(query) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      setError(false)
      return
    }

    setLoading(true)
    setError(false)
    const id = ++requestId.current

    const timer = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(trimmed)}`)
        .then((r) => {
          if (!r.ok) throw new Error('bad response')
          return r.json()
        })
        .then((json) => {
          if (requestId.current === id) setResults(json.results ?? [])
        })
        .catch(() => {
          if (requestId.current === id) setError(true)
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  return { results, loading, error }
}
