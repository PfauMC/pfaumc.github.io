// Pure helpers over a player's daily-minutes map: { "YYYY-MM-DD": minutes }.
// Kept separate from store.js so the math is unit-testable without Blobs.

export const ACTIVITY_RETENTION_DAYS = 371 // ~53 weeks, GitHub-style heatmap window

function dateKey(d) {
  return d.toISOString().slice(0, 10)
}

export function pruneDaily(daily, now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - ACTIVITY_RETENTION_DAYS)
  const cutoffKey = dateKey(cutoff)
  const pruned = {}
  for (const [date, min] of Object.entries(daily)) {
    if (date >= cutoffKey) pruned[date] = min
  }
  return pruned
}

// today/week(Mon-start)/month totals, derived from the daily map so there's
// a single source of truth (no separate rollover counters to drift out of sync).
export function computeStats(daily, allTimeMin, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayKey = dateKey(today)
  const todayMin = daily[todayKey] ?? 0

  const dow = today.getUTCDay() || 7 // 1=Mon..7=Sun
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() - (dow - 1))
  let weekMin = 0
  for (let d = new Date(monday); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    weekMin += daily[dateKey(d)] ?? 0
  }

  const monthPrefix = dateKey(today).slice(0, 7)
  let monthMin = 0
  for (const [date, min] of Object.entries(daily)) {
    if (date.startsWith(monthPrefix)) monthMin += min
  }

  return { todayMin, weekMin, monthMin, allTimeMin: allTimeMin ?? 0 }
}

// Dense day-by-day series for the activity heatmap, oldest first, zero-filled.
export function buildActivity(daily, days = ACTIVITY_RETENTION_DAYS, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    const key = dateKey(d)
    result.push({ date: key, minutes: daily[key] ?? 0 })
  }
  return result
}
