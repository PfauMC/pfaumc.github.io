import { useCallback, useEffect, useMemo, useState } from 'react'
import { gameApi, roleLabel } from '../lib/gameApi'

/** Итоги за сегодня/неделю/месяц из посуточного ряда. */
function summarize(activity, allTimeMin) {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const key = (d) => d.toISOString().slice(0, 10)

  const byDate = new Map(activity.map((d) => [d.date, d.minutes]))
  const todayKey = key(today)

  // Неделя с понедельника, как в остальном интерфейсе.
  const dow = today.getUTCDay() || 7
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() - (dow - 1))

  let weekMin = 0
  for (let d = new Date(monday); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    weekMin += byDate.get(key(d)) ?? 0
  }

  const monthPrefix = todayKey.slice(0, 7)
  let monthMin = 0
  for (const [date, min] of byDate) {
    if (date.startsWith(monthPrefix)) monthMin += min
  }

  return { todayMin: byDate.get(todayKey) ?? 0, weekMin, monthMin, allTimeMin }
}

/** Плотный ряд по дням для теплокарты: бэкенд отдаёт разреженный, нули дорисовываем тут. */
function densify(activity, days = 371) {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const byDate = new Map(activity.map((d) => [d.date, d.minutes]))

  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    result.push({ date, minutes: byDate.get(date) ?? 0 })
  }
  return result
}

/** Ролей может не быть ни одной -- тогда показываем ту же подпись, что и раньше. */
function shapeRoles(roles) {
  const shaped = (roles ?? []).map((r) => ({ key: r.key, title: roleLabel(r), color: r.color }))
  return shaped.length ? shaped : [{ key: 'default', title: roleLabel(null), color: null }]
}

export function usePlayerProfile(nickname) {
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setError(false)
    setRaw(null)

    const key = encodeURIComponent(nickname)
    Promise.all([gameApi(`/players/${key}`), gameApi(`/players/${key}/stats`)])
      .then(([player, stats]) => {
        if (!cancelled) setRaw({ player, stats })
      })
      .catch((e) => {
        if (cancelled) return
        if (e.notFound) setNotFound(true)
        else setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [nickname, reloadKey])

  const profile = useMemo(() => {
    if (!raw) return null
    const { player, stats } = raw
    // API отдаёт секунды, интерфейс считает в минутах — переводим на границе.
    const activity = (stats.activity ?? []).map((d) => ({
      date: d.date,
      minutes: Math.round(d.seconds / 60),
    }))
    // active_seconds — без афк (online_seconds включает афк). Для сессий до 2026-07-03 бэкенд отдаёт active_seconds = 0.
    const allTimeMin = Math.round((stats.playtime?.active_seconds ?? 0) / 60)

    return {
      id: player.id,
      name: player.name ?? nickname,
      roles: shapeRoles(player.pfaumc?.roles),
      skin: player.pfaumc?.skin ?? null,
      online: stats.online,
      lastSeen: stats.last_seen_at,
      firstSeen: player.pfaumc?.first_seen_at,
      playtime: summarize(activity, allTimeMin),
      activity: densify(activity),
      integrations: null,
      city: player.pfaumc?.city ?? null,
      // Действующий бан прямо сейчас -- null, если игрока не забанен. Причина и срок
      // приходят с бэкенда уже проверенными (см. db::punish::active_ban); фронт их
      // не пересчитывает.
      ban: player.pfaumc?.ban
        ? { reason: player.pfaumc.ban.reason, expiresAt: player.pfaumc.ban.expires_at }
        : null,
      // История нарушений, от новых к старым -- порядок уже такой с бэкенда.
      violations: (player.pfaumc?.violations ?? []).map((v) => ({
        kind: v.kind,
        reason: v.reason,
        createdAt: v.created_at,
        expiresAt: v.expires_at,
        status: v.status,
      })),
    }
  }, [raw, nickname])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  return { profile, loading, notFound, error, retry }
}
