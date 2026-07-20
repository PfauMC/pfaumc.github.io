import { useCallback, useEffect, useState } from 'react'

export function usePlayersOnline(autoRefreshMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchOnline = useCallback(() => {
    setError(false)
    return fetch('/api/players/online')
      .then((r) => {
        if (!r.ok) throw new Error('bad response')
        return r.json()
      })
      .then((json) => setData(json))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchOnline()
    if (autoRefreshMs > 0) {
      const id = setInterval(fetchOnline, autoRefreshMs)
      return () => clearInterval(id)
    }
  }, [fetchOnline, autoRefreshMs])

  return { data, loading, error, refresh: fetchOnline }
}
