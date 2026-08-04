// Раскладка почасового ряда онлайна на «эту» и «прошлую» неделю для графика.
//
// Игровой бэкенд отдаёт плоский ряд точек за N суток. Графику нужны два массива
// по 168 часов, выровненные по дню недели, чтобы недели легли друг на друга.
// Неделя начинается в понедельник 00:00 по Москве — в Москве нет перехода на
// летнее время, поэтому смещение постоянное.

const MSK_OFFSET_MS = 3 * 3600_000
const HOUR_MS = 3600_000
export const WEEK_HOURS = 168

/** Понедельник 00:00 по Москве для указанного момента, в UTC. */
export function weekStart(date) {
  const msk = new Date(date.getTime() + MSK_OFFSET_MS)
  const weekday = (msk.getUTCDay() + 6) % 7 // 0 — понедельник
  const midnight = Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), msk.getUTCDate())
  return new Date(midnight - weekday * 24 * HOUR_MS - MSK_OFFSET_MS)
}

/**
 * @param {{at: string, players: number}[]} points почасовые точки, любой порядок
 * @param {Date} now
 * @returns {{currentStart: string, previousStart: string, current: (number|null)[], previous: (number|null)[]}}
 */
export function splitIntoWeeks(points, now = new Date()) {
  const currentStart = weekStart(now)
  const previousStart = new Date(currentStart.getTime() - 7 * 24 * HOUR_MS)

  const current = new Array(WEEK_HOURS).fill(null)
  const previous = new Array(WEEK_HOURS).fill(null)

  for (const point of points ?? []) {
    const ms = new Date(point.at).getTime()
    if (Number.isNaN(ms)) continue

    const inCurrent = Math.floor((ms - currentStart.getTime()) / HOUR_MS)
    if (inCurrent >= 0 && inCurrent < WEEK_HOURS) {
      current[inCurrent] = point.players
      continue
    }
    const inPrevious = Math.floor((ms - previousStart.getTime()) / HOUR_MS)
    if (inPrevious >= 0 && inPrevious < WEEK_HOURS) {
      previous[inPrevious] = point.players
    }
  }

  return {
    currentStart: currentStart.toISOString(),
    previousStart: previousStart.toISOString(),
    current,
    previous,
  }
}
