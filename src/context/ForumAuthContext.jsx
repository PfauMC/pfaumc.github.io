import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/forumApi'

const ForumAuthContext = createContext(null)

const POLL_MS = 60_000

export function ForumAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => () => { mounted.current = false }, [])

  const refresh = useCallback(async () => {
    // Гостю запрос не нужен: CSRF-cookie ставится и снимается вместе с
    // сессионной, так что её отсутствие однозначно означает «сессии нет».
    if (!document.cookie.includes('pfau_csrf=')) {
      if (mounted.current) {
        setUser(null)
        setUnreadCount(0)
        setLoading(false)
      }
      return null
    }
    try {
      const data = await api('/auth/me')
      if (!mounted.current) return data
      setUser(data.user)
      setUnreadCount(data.unreadCount ?? 0)
      return data
    } catch {
      if (mounted.current) setUser(null)
      return null
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Счётчик уведомлений подтягиваем, пока вкладка активна.
  useEffect(() => {
    if (!user) return undefined
    const tick = () => { if (document.visibilityState === 'visible') refresh() }
    const timer = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [user, refresh])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
    setUnreadCount(0)
  }, [])

  const logoutEverywhere = useCallback(async () => {
    await api('/auth/logout-all', { method: 'POST' })
    setUser(null)
    setUnreadCount(0)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      unreadCount,
      setUnreadCount,
      setUser,
      refresh,
      logout,
      logoutEverywhere,
      isModerator: Boolean(user?.role?.canModerate),
    }),
    [user, loading, unreadCount, refresh, logout, logoutEverywhere]
  )

  return <ForumAuthContext.Provider value={value}>{children}</ForumAuthContext.Provider>
}

export function useForumAuth() {
  const ctx = useContext(ForumAuthContext)
  if (!ctx) throw new Error('useForumAuth должен вызываться внутри ForumAuthProvider')
  return ctx
}
