import { useState, useEffect, useCallback } from 'react'
import { SERVER_VERSION } from '../config'

export function useServerStats(autoRefreshMs = 0) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStats = useCallback(() => {
    setLoading(true)
    fetch('https://api.mcsrvstat.us/3/play.pfaumc.online')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          online: data.online ?? false,
          players: data.players?.online ?? 0,
          maxPlayers: data.players?.max ?? 0,
          playerList: data.players?.list ?? [],
          version: data.protocol?.name ?? SERVER_VERSION,
          motd: data.motd?.clean?.[0] ?? 'PfauMC',
          software: data.software ?? null,
          icon: data.icon ?? null,
        })
        setLastUpdated(new Date())
      })
      .catch(() => {
        setStats({ online: false, players: 0, maxPlayers: 0, playerList: [], version: SERVER_VERSION, motd: 'PfauMC', software: null, icon: null })
        setLastUpdated(new Date())
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchStats()
    if (autoRefreshMs > 0) {
      const id = setInterval(fetchStats, autoRefreshMs)
      return () => clearInterval(id)
    }
  }, [fetchStats, autoRefreshMs])

  return { stats, loading, lastUpdated, refresh: fetchStats }
}
