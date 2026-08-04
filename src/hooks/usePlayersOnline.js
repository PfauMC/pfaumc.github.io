import { useCallback, useEffect, useState } from 'react'
import { gameApi, roleLabel } from '../lib/gameApi'

/**
 * Кто сейчас в игре — по данным игрового бэкенда.
 *
 * Присутствие там считается по сердцебиению открытой сессии, а не по пингу
 * извне, поэтому список точный и не «залипает» после падения сервера.
 *
 * Форма ответа приводится к той, что уже ждут PlayerCard и страницы, — чтобы
 * смена источника данных не расползлась по всему интерфейсу.
 */
export function usePlayersOnline(autoRefreshMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchOnline = useCallback(() => {
    setError(false)
    return gameApi('/server/online')
      .then((json) => {
        setData({
          online: true,
          count: json.online ?? 0,
          namesAvailable: true,
          players: (json.players ?? [])
            .filter((p) => p.name)
            .map((p) => ({
              uuid: p.gamerId,
              name: p.name,
              role: roleLabel(p.role),
              since: p.sinceAt,
            })),
        })
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
