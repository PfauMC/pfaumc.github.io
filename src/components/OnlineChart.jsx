import { useMemo, useRef, useState } from 'react'

// График онлайна: эта неделя поверх прошлой, ось X — часы недели (Пн 00:00 → Вс 23:00).
// Рисуем инлайновым SVG: ради двух линий тянуть графическую библиотеку незачем.
// ponytail: если понадобятся зум, несколько метрик и брашинг — тогда uPlot.

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const HOURS = 168
const W = 1000
const H = 260
const PAD = { top: 16, right: 12, bottom: 26, left: 38 }

const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const xAt = (hour) => PAD.left + (hour / (HOURS - 1)) * plotW

/** Ломаная с разрывами там, где данных нет. */
function buildPath(values, yAt) {
  let d = ''
  let pen = false
  values.forEach((v, i) => {
    if (v == null) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)} `
    pen = true
  })
  return d.trim()
}

/** Заливка под текущей неделей — только по непрерывному участку от начала. */
function buildArea(values, yAt) {
  const points = []
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) break
    points.push([xAt(i), yAt(values[i])])
  }
  if (points.length < 2) return ''
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const lastX = points[points.length - 1][0].toFixed(1)
  const base = (PAD.top + plotH).toFixed(1)
  return `${line} L${lastX} ${base} L${points[0][0].toFixed(1)} ${base} Z`
}

function niceMax(value) {
  if (value <= 10) return 10
  const step = value <= 50 ? 10 : value <= 200 ? 25 : 100
  return Math.ceil(value / step) * step
}

export default function OnlineChart({ current, previous, currentStart }) {
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)

  const { max, ticks, currentPath, currentArea, previousPath, lastFilled } = useMemo(() => {
    const all = [...(current ?? []), ...(previous ?? [])].filter((v) => v != null)
    const max = niceMax(all.length ? Math.max(...all) : 10)
    const yAt = (v) => PAD.top + plotH - (v / max) * plotH
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ value: Math.round(max * f), y: yAt(max * f) }))

    let lastFilled = -1
    ;(current ?? []).forEach((v, i) => { if (v != null) lastFilled = i })

    return {
      max,
      ticks,
      currentPath: buildPath(current ?? [], yAt),
      currentArea: buildArea(current ?? [], yAt),
      previousPath: buildPath(previous ?? [], yAt),
      lastFilled,
    }
  }, [current, previous])

  const yAt = (v) => PAD.top + plotH - (v / max) * plotH

  const onMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * W
    const hour = Math.round(((x - PAD.left) / plotW) * (HOURS - 1))
    if (hour < 0 || hour >= HOURS) return setHover(null)
    setHover(hour)
  }

  const weekStartMs = currentStart ? new Date(currentStart).getTime() : null
  const hoverLabel = (hour) => {
    const day = DAYS[Math.floor(hour / 24)]
    const time = String(hour % 24).padStart(2, '0')
    return `${day}, ${time}:00`
  }

  const hasCurrent = hover != null && current?.[hover] != null
  const hasPrevious = hover != null && previous?.[hover] != null

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none"
        role="img"
        aria-label="График онлайна за эту и прошлую неделю"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="online-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Сетка и подписи оси Y */}
        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              className="fill-current text-[11px]"
              opacity="0.4"
            >
              {t.value}
            </text>
          </g>
        ))}

        {/* Границы суток и подписи дней */}
        {DAYS.map((day, i) => {
          const x = xAt(i * 24)
          return (
            <g key={day}>
              {i > 0 && (
                <line
                  x1={x}
                  x2={x}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  stroke="currentColor"
                  strokeOpacity="0.06"
                  strokeWidth="1"
                />
              )}
              <text
                x={x + plotW / 14}
                y={H - 8}
                textAnchor="middle"
                className="fill-current text-[11px]"
                opacity="0.4"
              >
                {day}
              </text>
            </g>
          )
        })}

        {/* Прошлая неделя */}
        {previousPath && (
          <path
            d={previousPath}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinejoin="round"
          />
        )}

        {/* Эта неделя */}
        {currentArea && <path d={currentArea} fill="url(#online-fill)" />}
        {currentPath && (
          <path
            d={currentPath}
            fill="none"
            stroke="rgb(var(--c-accent))"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Точка «сейчас» */}
        {lastFilled >= 0 && (
          <circle cx={xAt(lastFilled)} cy={yAt(current[lastFilled])} r="3.5" fill="rgb(var(--c-accent))" />
        )}

        {/* Курсор */}
        {hover != null && (
          <line
            x1={xAt(hover)}
            x2={xAt(hover)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="rgb(var(--c-accent))"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        )}
        {hasCurrent && <circle cx={xAt(hover)} cy={yAt(current[hover])} r="4" fill="rgb(var(--c-accent))" />}
        {hasPrevious && (
          <circle
            cx={xAt(hover)}
            cy={yAt(previous[hover])}
            r="3.5"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        )}
      </svg>

      {/* Всплывающая подсказка */}
      {hover != null && (hasCurrent || hasPrevious) && (
        <div
          className="pointer-events-none absolute top-2 rounded-xl glass px-3 py-2 text-xs"
          style={{
            left: `${(xAt(hover) / W) * 100}%`,
            transform: `translateX(${hover > HOURS * 0.7 ? '-105%' : '5%'})`,
          }}
        >
          <div className="text-text-light/60 mb-1">{hoverLabel(hover)}</div>
          {hasCurrent && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-accent rounded-full" />
              <span className="text-heading font-mono tabular-nums">{Math.round(current[hover])}</span>
              <span className="text-text-light/50">эта неделя</span>
            </div>
          )}
          {hasPrevious && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 rounded-full bg-text-light/50" />
              <span className="text-heading font-mono tabular-nums">{Math.round(previous[hover])}</span>
              <span className="text-text-light/50">прошлая</span>
            </div>
          )}
        </div>
      )}

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-text-light/60">
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-0.5 rounded-full bg-accent" />
          Эта неделя
          {weekStartMs && (
            <span className="text-text-light/40">
              (с {new Date(weekStartMs).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-0.5 rounded-full bg-text-light/40" style={{ backgroundImage: 'none' }} />
          Прошлая неделя
        </span>
        <span className="ml-auto text-text-light/40">средний онлайн по часам, время московское</span>
      </div>
    </div>
  )
}
