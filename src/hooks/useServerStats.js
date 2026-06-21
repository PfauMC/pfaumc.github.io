import { useState, useEffect } from 'react'

export function useServerStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://api.mcsrvstat.us/3/play.pfaumc.ru')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          online: data.online ?? false,
          players: data.players?.online ?? 0,
          maxPlayers: data.players?.max ?? 0,
          version: data.version ?? '1.21',
        })
      })
      .catch(() => {
        setStats({ online: false, players: 0, maxPlayers: 0, version: '1.21' })
      })
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
