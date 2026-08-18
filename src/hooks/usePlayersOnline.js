import { useCallback, useEffect, useState } from 'react'
import { gameApi } from '../lib/gameApi'

/**
 * Кто сейчас в игре — по данным игрового бэкенда.
 *
 * Присутствие там считается по сердцебиению открытой сессии, а не по пингу
 * извне, поэтому список точный и не «залипает» после падения сервера.
 */
export function usePlayersOnline(autoRefreshMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchOnline = useCallback(() => {
    setError(false)
    return gameApi('/players?online=true')
      .then((json) => {
        setData(
          (json.items ?? [])
            .filter((p) => p.name)
            .map((p) => ({ id: p.id, name: p.name, online: p.online, skin: p.skin, roles: p.roles }))
        )
      })
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
