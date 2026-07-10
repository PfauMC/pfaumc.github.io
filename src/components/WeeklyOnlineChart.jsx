import { useMemo, useState } from 'react'
import { WEEKDAY_LABELS } from '../hooks/useOnlineHistory'

const WIDTH = 640
const HEIGHT = 240
const PAD = { top: 16, right: 12, bottom: 28, left: 32 }
const CHART_W = WIDTH - PAD.left - PAD.right
const CHART_H = HEIGHT - PAD.top - PAD.bottom
const GRID_LINES = [0, 0.25, 0.5, 0.75, 1]

function niceMax(value) {
  if (value <= 0) return 10
  const withHeadroom = value * 1.2
  const magnitude = 10 ** Math.floor(Math.log10(withHeadroom))
  return Math.ceil(withHeadroom / magnitude) * magnitude
}

// Splits a week's values into contiguous [index, value] runs, skipping gaps (no data yet).
function runsOf(values) {
  const runs = []
  let current = []
  values.forEach((v, i) => {
    if (v == null) {
      if (current.length) runs.push(current)
      current = []
    } else {
      current.push([i, v])
    }
  })
  if (current.length) runs.push(current)
  return runs
}

export default function WeeklyOnlineChart({ thisWeek, lastWeek }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const [showTable, setShowTable] = useState(false)

  const hasData = [...thisWeek, ...lastWeek].some((v) => v != null)
  const yMax = useMemo(
    () => niceMax(Math.max(0, ...thisWeek.filter((v) => v != null), ...lastWeek.filter((v) => v != null))),
    [thisWeek, lastWeek]
  )

  const x = (i) => PAD.left + (i / 6) * CHART_W
  const y = (v) => PAD.top + CHART_H - (v / yMax) * CHART_H

  if (!hasData) {
    return (
      <div className="text-center py-10 text-text-light/50 text-sm">
        Собираем статистику онлайна — график появится в течение нескольких дней.
      </div>
    )
  }

  const thisWeekRuns = runsOf(thisWeek)
  const lastWeekRuns = runsOf(lastWeek)

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-3 text-xs text-text-light/70">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 rounded-full bg-accent" />
          Эта неделя
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 rounded-full bg-accent opacity-35" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px)' }} />
          Прошлая неделя
        </div>
        <button
          onClick={() => setShowTable((s) => !s)}
          className="ml-auto text-text-light/40 hover:text-accent transition-colors"
        >
          {showTable ? 'Показать график' : 'Показать таблицей'}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-xs text-text-light">
          <thead>
            <tr className="text-text-light/40 text-left">
              <th className="font-normal py-1">День</th>
              <th className="font-normal py-1">Эта неделя</th>
              <th className="font-normal py-1">Прошлая неделя</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAY_LABELS.map((label, i) => (
              <tr key={label} className="border-t border-white/5">
                <td className="py-1.5">{label}</td>
                <td className="py-1.5 font-mono">{thisWeek[i] ?? '—'}</td>
                <td className="py-1.5 font-mono text-text-light/50">{lastWeek[i] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
              const idx = Math.round(((relX - PAD.left) / CHART_W) * 6)
              setHoverIdx(Math.min(6, Math.max(0, idx)))
            }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {GRID_LINES.map((f) => (
              <g key={f}>
                <line
                  x1={PAD.left} x2={WIDTH - PAD.right}
                  y1={PAD.top + CHART_H * (1 - f)} y2={PAD.top + CHART_H * (1 - f)}
                  className="stroke-white/5"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 8} y={PAD.top + CHART_H * (1 - f)}
                  textAnchor="end" dominantBaseline="middle"
                  className="fill-text-light/30 text-[9px] font-mono"
                >
                  {Math.round(yMax * f)}
                </text>
              </g>
            ))}

            {WEEKDAY_LABELS.map((label, i) => (
              <text
                key={label}
                x={x(i)} y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-text-light/40 text-[10px] font-mono"
              >
                {label}
              </text>
            ))}

            {hoverIdx != null && (
              <line
                x1={x(hoverIdx)} x2={x(hoverIdx)}
                y1={PAD.top} y2={PAD.top + CHART_H}
                className="stroke-white/10"
                strokeWidth="1"
              />
            )}

            {/* Прошлая неделя — та же линия, но бледнее и пунктиром */}
            {lastWeekRuns.map((run, ri) => (
              <polyline
                key={`lw-${ri}`}
                points={run.map(([i, v]) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                className="stroke-accent"
                strokeOpacity="0.35"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
            ))}
            {lastWeek.map((v, i) => v == null ? null : (
              <circle key={`lwp-${i}`} cx={x(i)} cy={y(v)} r="3" className="fill-bg-card stroke-accent" strokeOpacity="0.35" strokeWidth="1.5" />
            ))}

            {/* Эта неделя — сплошная и яркая */}
            {thisWeekRuns.map((run, ri) => (
              <polyline
                key={`tw-${ri}`}
                points={run.map(([i, v]) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                className="stroke-accent"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}
            {thisWeek.map((v, i) => v == null ? null : (
              <circle key={`twp-${i}`} cx={x(i)} cy={y(v)} r="4" className="fill-accent" />
            ))}
          </svg>

          {hoverIdx != null && (thisWeek[hoverIdx] != null || lastWeek[hoverIdx] != null) && (
            <div
              className="absolute top-1 bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none"
              style={{
                left: `${(x(hoverIdx) / WIDTH) * 100}%`,
                transform: hoverIdx > 4 ? 'translateX(-100%)' : hoverIdx < 2 ? 'none' : 'translateX(-50%)',
              }}
            >
              <div className="font-mono text-white font-bold mb-1">{WEEKDAY_LABELS[hoverIdx]}</div>
              {thisWeek[hoverIdx] != null && (
                <div className="flex items-center gap-1.5 text-text-light">
                  <span className="w-2 h-2 rounded-full bg-accent" /> {thisWeek[hoverIdx]} игроков
                </div>
              )}
              {lastWeek[hoverIdx] != null && (
                <div className="flex items-center gap-1.5 text-text-light/50">
                  <span className="w-2 h-2 rounded-full bg-accent opacity-40" /> {lastWeek[hoverIdx]} игроков
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
