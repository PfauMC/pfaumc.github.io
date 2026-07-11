import { useEffect, useMemo, useState } from 'react'

const WIDTH = 640
const HEIGHT = 260
const PAD = { top: 16, right: 12, bottom: 28, left: 32 }
const CHART_W = WIDTH - PAD.left - PAD.right
const CHART_H = HEIGHT - PAD.top - PAD.bottom
const GRID_LINES = [0, 0.25, 0.5, 0.75, 1]
const MAX_LABELS = 7

function niceMax(value) {
  if (value <= 0) return 10
  const withHeadroom = value * 1.2
  const magnitude = 10 ** Math.floor(Math.log10(withHeadroom))
  return Math.ceil(withHeadroom / magnitude) * magnitude
}

// Catmull-Rom -> кубический Безье, чтобы линия шла плавной кривой через точки.
function smoothPath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0][0]},${points[0][1]} L ${points[1][0]},${points[1][1]}`
  }
  let d = `M ${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 === points.length ? i + 1 : i + 2]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
  }
  return d
}

export default function OnlineChart({ series }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const [showTable, setShowTable] = useState(false)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 50)
    return () => clearTimeout(t)
  }, [])

  const n = series.length
  const yMax = useMemo(() => niceMax(Math.max(0, ...series.map((p) => p.value))), [series])

  const x = (i) => (n === 1 ? PAD.left + CHART_W / 2 : PAD.left + (i / (n - 1)) * CHART_W)
  const y = (v) => PAD.top + CHART_H - (v / yMax) * CHART_H

  if (n < 2) {
    return (
      <div className="text-center py-10 text-text-light/50 text-sm">
        Собираем статистику онлайна — график появится в течение нескольких дней.
      </div>
    )
  }

  const points = series.map((p, i) => [x(i), y(p.value)])
  const linePath = smoothPath(points)
  const areaPath = `${linePath} L ${points[n - 1][0]},${PAD.top + CHART_H} L ${points[0][0]},${PAD.top + CHART_H} Z`

  const labelStep = Math.max(1, Math.ceil(n / MAX_LABELS))

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-text-light/70">
        <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(29,165,232,0.8)] animate-pulse" />
        Онлайн игроков по дням
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
              <th className="font-normal py-1">Дата</th>
              <th className="font-normal py-1">Онлайн</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-1.5">{p.label}</td>
                <td className="py-1.5 font-mono">{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = ((e.clientX - rect.left) / rect.width) * WIDTH
              const idx = Math.round(((relX - PAD.left) / CHART_W) * (n - 1))
              setHoverIdx(Math.min(n - 1, Math.max(0, idx)))
            }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="onlineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" className="text-accent" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-accent" />
              </linearGradient>
            </defs>

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

            {series.map((p, i) =>
              i % labelStep !== 0 && i !== n - 1 ? null : (
                <text
                  key={i}
                  x={x(i)} y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-text-light/40 text-[10px] font-mono"
                >
                  {p.label}
                </text>
              )
            )}

            {hoverIdx != null && (
              <line
                x1={x(hoverIdx)} x2={x(hoverIdx)}
                y1={PAD.top} y2={PAD.top + CHART_H}
                className="stroke-white/10"
                strokeWidth="1"
              />
            )}

            <path
              d={areaPath}
              fill="url(#onlineAreaGrad)"
              style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1s ease 0.3s' }}
            />

            <path
              d={linePath}
              fill="none"
              className="stroke-accent"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(29,165,232,0.5))"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: drawn ? 0 : 1,
                transition: 'stroke-dashoffset 1.4s ease',
              }}
            />

            {/* Живая точка на последнем значении */}
            <circle cx={points[n - 1][0]} cy={points[n - 1][1]} r="5" className="fill-accent">
              <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
            </circle>

            {hoverIdx != null && (
              <circle
                cx={points[hoverIdx][0]} cy={points[hoverIdx][1]} r="4"
                className="fill-bg-card stroke-accent"
                strokeWidth="2"
              />
            )}
          </svg>

          {hoverIdx != null && (
            <div
              className="absolute top-1 bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none"
              style={{
                left: `${(x(hoverIdx) / WIDTH) * 100}%`,
                transform: hoverIdx > n - 3 ? 'translateX(-100%)' : hoverIdx < 2 ? 'none' : 'translateX(-50%)',
              }}
            >
              <div className="font-mono text-white font-bold mb-1">{series[hoverIdx].label}</div>
              <div className="flex items-center gap-1.5 text-text-light">
                <span className="w-2 h-2 rounded-full bg-accent" /> {series[hoverIdx].value} игроков
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
