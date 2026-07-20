import { useMemo, useState } from 'react'
import { formatPlaytime } from '../utils/playerFormat'

const LEVEL_THRESHOLDS = [0, 1, 30, 90, 180] // minutes
const LEVEL_CLASSES = [
  'bg-white/5',
  'bg-accent/25',
  'bg-accent/45',
  'bg-accent/70',
  'bg-accent',
]
const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

function levelFor(minutes) {
  let level = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (minutes >= LEVEL_THRESHOLDS[i]) { level = i; break }
  }
  return level
}

// Full Jan 1 → Dec 31 grid for `year` (capped at today for the current year),
// zero-filled for any date we don't have minutes for.
function buildYearDays(year, minutesByDate) {
  const today = new Date()
  const isCurrentYear = year === today.getUTCFullYear()
  const start = new Date(Date.UTC(year, 0, 1))
  const end = isCurrentYear ? today : new Date(Date.UTC(year, 11, 31))

  const days = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10)
    days.push({ date, minutes: minutesByDate.get(date) ?? 0 })
  }
  return days
}

function groupIntoWeeks(days) {
  if (days.length === 0) return []
  const firstDow = new Date(`${days[0].date}T00:00:00Z`).getUTCDay() || 7 // 1=Mon..7=Sun
  const padded = [...Array.from({ length: firstDow - 1 }, () => null), ...days]
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
  return weeks
}

export default function ActivityHeatmap({ activity }) {
  const minutesByDate = useMemo(() => new Map((activity ?? []).map((d) => [d.date, d.minutes])), [activity])

  const years = useMemo(() => {
    const set = new Set((activity ?? []).map((d) => Number(d.date.slice(0, 4))))
    return [...set].sort((a, b) => b - a)
  }, [activity])

  const [selectedYear, setSelectedYear] = useState(years[0])

  if (!activity || activity.length === 0 || selectedYear === undefined) return null

  const days = buildYearDays(selectedYear, minutesByDate)
  const weeks = groupIntoWeeks(days)
  let lastMonth = null

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-bg-section border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-accent/50"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex gap-[2px] w-full mb-1">
        {weeks.map((week, i) => {
          const firstDay = week.find(Boolean)
          const month = firstDay ? new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth() : null
          const showLabel = month !== null && month !== lastMonth
          if (showLabel) lastMonth = month
          return (
            <div key={i} className="relative flex-1 min-w-0 max-w-[15px] h-3">
              {showLabel && (
                <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] text-text-light/40 font-mono">
                  {MONTH_NAMES[month]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-[2px] w-full">
        {weeks.map((week, i) => (
          <div key={i} className="flex-1 min-w-0 max-w-[15px] flex flex-col gap-[2px]">
            {week.map((day, j) =>
              day ? <DayCell key={j} day={day} /> : <div key={j} className="w-full aspect-square" />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-light/40">
        <span>Меньше</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-[2px] flex-shrink-0 ${cls}`} />
        ))}
        <span>Больше</span>
      </div>
    </div>
  )
}

function DayCell({ day }) {
  const dateLabel = new Date(`${day.date}T00:00:00Z`).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="relative group/cell w-full aspect-square">
      <div className={`w-full h-full rounded-[1.5px] cursor-default ${LEVEL_CLASSES[levelFor(day.minutes)]}`} />
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 whitespace-nowrap rounded-lg border border-white/10 bg-bg-card px-2.5 py-1.5 text-[11px] opacity-0 shadow-lg transition-opacity group-hover/cell:opacity-100">
        <div className="text-white font-medium">{dateLabel}</div>
        <div className="text-text-light/70">
          {day.minutes > 0 ? `Сыграно: ${formatPlaytime(day.minutes)}` : 'Нет активности'}
        </div>
      </div>
    </div>
  )
}
