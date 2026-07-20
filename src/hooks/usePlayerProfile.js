import { useEffect, useState } from 'react'

export function usePlayerProfile(nickname) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setError(false)
    setProfile(null)

    fetch(`/api/players/profile?nickname=${encodeURIComponent(nickname)}`)
      .then(async (r) => {
        if (cancelled) return
        if (r.status === 404) {
          setNotFound(true)
          return
        }
        if (!r.ok) throw new Error('bad response')
        const json = await r.json()
        setProfile(json)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [nickname])

  return { profile, loading, notFound, error }
}
