import { useEffect, useState } from 'react'

const DAY_MS = 86400000
export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function mondayStart(date) {
  const dayIdx = (date.getUTCDay() + 6) % 7 // 0 = Monday
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - dayIdx)
  return start
}

function bucketWeek(records, weekStart) {
  const sums = Array(7).fill(0)
  const counts = Array(7).fill(0)
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS)

  for (const r of records) {
    const t = new Date(r.t)
    if (t >= weekStart && t < weekEnd) {
      const dayIdx = Math.floor((t - weekStart) / DAY_MS)
      sums[dayIdx] += r.p
      counts[dayIdx] += 1
    }
  }

  return sums.map((sum, i) => (counts[i] ? Math.round((sum / counts[i]) * 10) / 10 : null))
}

export function useOnlineHistory() {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/online-history.json')
      .then((r) => r.json())
      .then((records) => {
        const thisWeekStart = mondayStart(new Date())
        const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * DAY_MS)
        setHistory({
          thisWeek: bucketWeek(records, thisWeekStart),
          lastWeek: bucketWeek(records, lastWeekStart),
        })
      })
      .catch(() => setHistory({ thisWeek: Array(7).fill(null), lastWeek: Array(7).fill(null) }))
      .finally(() => setLoading(false))
  }, [])

  return { history, loading }
}
