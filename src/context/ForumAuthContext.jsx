import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/forumApi'
import { reportDevice } from '../lib/deviceFingerprint'

const ForumAuthContext = createContext(null)

const POLL_MS = 60_000

export function ForumAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [canViewMultiacc, setCanViewMultiacc] = useState(false)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  // Растёт при каждой смене активного аккаунта: ответ /auth/me, улетевший до
  // переключения, приходит после него и иначе вернул бы прежний аккаунт.
  const epoch = useRef(0)

  // Флаг поднимается на каждом монтировании, а не только на первом: StrictMode в дев-режиме
  // проходит цикл mount → unmount → mount, и без этого ref навсегда оставался бы false,
  // а все ответы /auth/me отбрасывались бы как «пришли после размонтирования».
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const refresh = useCallback(async () => {
    // Гостю запрос не нужен: CSRF-cookie ставится и снимается вместе с
    // сессионной, так что её отсутствие однозначно означает «сессии нет».
    if (!document.cookie.includes('pfau_csrf=')) {
      if (mounted.current) {
        setUser(null)
        setAccounts([])
        setUnreadCount(0)
        setCanViewMultiacc(false)
        setLoading(false)
      }
      return null
    }
    const started = epoch.current
    try {
      const data = await api('/auth/me')
      if (!mounted.current || started !== epoch.current) return data
      setUser(data.user)
      // Список аккаунтов приезжает вместе с сессией: отдельным запросом он мог уйти
      // только после ответа на этот, то есть всегда вторым кругом.
      setAccounts(data.accounts ?? [])
      setUnreadCount(data.unreadCount ?? 0)
      setCanViewMultiacc(Boolean(data.canViewMultiacc))
      return data
    } catch {
      if (mounted.current && started === epoch.current) {
        setUser(null)
        setAccounts([])
        setCanViewMultiacc(false)
      }
      return null
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const activeUuid = user?.uuid
  const deviceReported = useRef(false)
  // Отпечаток -- наблюдение, на экране от него ничего не зависит. Отправленный сразу,
  // он занимает соединение (плюс preflight) в тот момент, когда страница ещё грузит
  // то, что видно, поэтому ждёт простоя.
  useEffect(() => {
    if (!activeUuid || deviceReported.current) return
    deviceReported.current = true
    const whenIdle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1000))
    whenIdle(() => reportDevice())
  }, [activeUuid])

  const switchAccount = useCallback(async (uuid) => {
    const data = await api('/auth/switch', { method: 'POST', body: { uuid } })
    epoch.current += 1
    if (!mounted.current) return data
    setUser(data.user)
    setAccounts((list) => list.map((a) => ({ ...a, isActive: a.uuid === uuid })))
    // Уведомления считаются на аккаунт, старое число к новому не относится.
    setUnreadCount(0)
    refresh()
    return data
  }, [refresh])

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
    epoch.current += 1
    setUser(null)
    setAccounts([])
    setUnreadCount(0)
  }, [])

  const logoutEverywhere = useCallback(async () => {
    await api('/auth/logout-all', { method: 'POST' })
    epoch.current += 1
    setUser(null)
    setAccounts([])
    setUnreadCount(0)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      unreadCount,
      setUnreadCount,
      canViewMultiacc,
      setUser,
      refresh,
      logout,
      logoutEverywhere,
      isModerator: Boolean(user?.role?.canModerate),
      canViewHidden: Boolean(user?.role?.canViewHidden),
      accounts,
      activeAccount: accounts.find((a) => a.isActive) ?? user,
      switchAccount,
    }),
    [user, loading, unreadCount, canViewMultiacc, refresh, logout, logoutEverywhere, accounts, switchAccount]
  )

  return <ForumAuthContext.Provider value={value}>{children}</ForumAuthContext.Provider>
}

export function useForumAuth() {
  const ctx = useContext(ForumAuthContext)
  if (!ctx) throw new Error('useForumAuth должен вызываться внутри ForumAuthProvider')
  return ctx
}
