// Граф связей между аккаунтами: узел — аккаунт, ребро — общий адрес, подсеть или соцсеть.
//
// Раскладка силовая и живёт на canvas: узлы отталкиваются, рёбра стягивают, кадр за кадром.
// Поэтому вся эта часть императивная и сидит в одном эффекте — гонять сотню узлов через
// состояние React значило бы перерисовывать дерево 60 раз в секунду.
import { useEffect, useMemo, useRef, useState } from 'react'

const KIND_LABELS = {
  'shared-ip': 'общий IP',
  'shared-ip-in-vpn-pool': 'общий IP в VPN-пуле',
  'subnet/24': 'подсеть /24',
  'shared-browser': 'общий браузер',
  'shared-fingerprint': 'совпал отпечаток браузера',
  seed: 'запрошенный аккаунт',
}

function kindLabel(kind) {
  if (!kind) return ''
  if (KIND_LABELS[kind]) return KIND_LABELS[kind]
  if (kind.startsWith('social:')) return `общий ${kind.slice(7)}`
  return kind
}

// Смысловые цвета берём фиксированными: они должны читаться и на светлой, и на тёмной теме,
// а палитра сайта под такую задачу не рассчитана.
const STRONG = '#38bdf8'
const WEAK = '#94a3b8'
const SEED = '#f59e0b'
const PREMIUM = '#22c55e'
const OFFLINE = '#a855f7'

function themeColor(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return raw ? `rgb(${raw})` : fallback
}

export default function MultiaccGraph({ data }) {
  const canvasRef = useRef(null)
  const [showWeak, setShowWeak] = useState(true)
  const [selectedNick, setSelectedNick] = useState(
    () => (data.nodes.find((n) => n.depth === 0) ?? data.nodes[0])?.nick ?? null
  )

  // Отрисовка идёт вне React, а настройки живут в состоянии — зеркалим их в ref,
  // чтобы кадр читал свежие значения и эффект не пересоздавал раскладку на каждый клик.
  const uiRef = useRef({ showWeak, selectedNick })
  uiRef.current.showWeak = showWeak
  uiRef.current.selectedNick = selectedNick

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    const nodes = data.nodes.map((n, i) => ({
      nick: n.nick,
      depth: n.depth,
      uuidType: n.uuid_type,
      x: Math.cos((i / data.nodes.length) * 6.283) * 180 + (i % 3) * 12,
      y: Math.sin((i / data.nodes.length) * 6.283) * 180 + (i % 5) * 9,
      vx: 0,
      vy: 0,
      r: 9 + Math.min(14, Math.sqrt(n.ips ?? 1) * 3),
    }))
    const byNick = new Map(nodes.map((n) => [n.nick, n]))
    const edges = data.edges.filter((e) => byNick.has(e.a) && byNick.has(e.b))

    const view = { x: 0, y: 0, k: 1 }
    let dragging = null
    let panning = null
    let hover = null
    let frame = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      view.x = r.width / 2
      view.y = r.height / 2
    }

    const visibleEdges = () => edges.filter((e) => uiRef.current.showWeak || e.strength === 'strong')

    const step = () => {
      for (const n of nodes) {
        n.vx -= n.x * 0.0016
        n.vy -= n.y * 0.0016
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d2 = dx * dx + dy * dy || 0.01
          const min = a.r + b.r + 26
          const f = Math.min(9000 / d2, 4)
          const d = Math.sqrt(d2)
          const ux = dx / d
          const uy = dy / d
          a.vx -= ux * f
          a.vy -= uy * f
          b.vx += ux * f
          b.vy += uy * f
          if (d < min) {
            const push = (min - d) * 0.5
            a.vx -= ux * push
            a.vy -= uy * push
            b.vx += ux * push
            b.vy += uy * push
          }
        }
      }
      for (const e of visibleEdges()) {
        const a = byNick.get(e.a)
        const b = byNick.get(e.b)
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 0.01
        const rest = e.strength === 'strong' ? 130 : 190
        const k = e.strength === 'strong' ? 0.012 : 0.005
        const f = (d - rest) * k
        const ux = dx / d
        const uy = dy / d
        a.vx += ux * f
        a.vy += uy * f
        b.vx -= ux * f
        b.vy -= uy * f
      }
      for (const n of nodes) {
        if (n === dragging) {
          n.vx = 0
          n.vy = 0
          continue
        }
        n.vx *= 0.86
        n.vy *= 0.86
        n.x += Math.max(-12, Math.min(12, n.vx))
        n.y += Math.max(-12, Math.min(12, n.vy))
      }
    }

    const draw = () => {
      const r = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, r.width, r.height)
      if (!nodes.length) return
      const selected = byNick.get(uiRef.current.selectedNick) ?? nodes[0]
      const ink = themeColor('--c-text-base', '#fff')
      const inkSoft = themeColor('--c-text-light', '#cbd5e1')
      const surface = themeColor('--c-bg-card', '#1b2330')

      ctx.save()
      ctx.translate(view.x, view.y)
      ctx.scale(view.k, view.k)

      const neighbours = new Set()
      for (const e of visibleEdges()) {
        if (e.a === selected.nick) neighbours.add(e.b)
        if (e.b === selected.nick) neighbours.add(e.a)
      }

      for (const e of visibleEdges()) {
        const a = byNick.get(e.a)
        const b = byNick.get(e.b)
        const touches = e.a === selected.nick || e.b === selected.nick
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = e.strength === 'strong' ? STRONG : WEAK
        ctx.globalAlpha = touches ? 0.95 : 0.28
        ctx.lineWidth = ((e.strength === 'strong' ? 1.8 : 1.2) / view.k) * (touches ? 1.6 : 1)
        ctx.setLineDash(e.strength === 'strong' ? [] : [5 / view.k, 4 / view.k])
        ctx.stroke()
        if (touches) {
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          ctx.setLineDash([])
          ctx.globalAlpha = 1
          ctx.font = `${10 / view.k}px ui-monospace, Menlo, monospace`
          const w = ctx.measureText(e.detail).width
          ctx.fillStyle = surface
          ctx.fillRect(mx - w / 2 - 3 / view.k, my - 7 / view.k, w + 6 / view.k, 13 / view.k)
          ctx.fillStyle = inkSoft
          ctx.textAlign = 'center'
          ctx.fillText(e.detail, mx, my + 3 / view.k)
        }
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      for (const n of nodes) {
        const isSelected = n === selected
        ctx.globalAlpha = !isSelected && !neighbours.has(n.nick) ? 0.45 : 1
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, 6.2832)
        ctx.fillStyle = n.depth === 0 ? SEED : n.uuidType === 'offline' ? OFFLINE : PREMIUM
        ctx.fill()
        if (isSelected || n === hover) {
          ctx.lineWidth = 2.5 / view.k
          ctx.strokeStyle = ink
          ctx.stroke()
        }
        ctx.font = `${(isSelected ? 13 : 12) / view.k}px ui-monospace, Menlo, monospace`
        ctx.textAlign = 'center'
        ctx.fillStyle = ink
        ctx.fillText(n.nick, n.x, n.y + n.r + 13 / view.k)
      }
      ctx.globalAlpha = 1
      ctx.restore()
    }

    const loop = () => {
      step()
      draw()
      frame = requestAnimationFrame(loop)
    }

    const toWorld = (ev) => {
      const r = canvas.getBoundingClientRect()
      return { x: (ev.clientX - r.left - view.x) / view.k, y: (ev.clientY - r.top - view.y) / view.k }
    }
    const pick = (p) => nodes.find((n) => Math.hypot(n.x - p.x, n.y - p.y) <= n.r + 4)

    const onDown = (ev) => {
      const n = pick(toWorld(ev))
      canvas.setPointerCapture(ev.pointerId)
      if (n) {
        dragging = n
        setSelectedNick(n.nick)
      } else {
        panning = { x: ev.clientX - view.x, y: ev.clientY - view.y }
      }
    }
    const onMove = (ev) => {
      const p = toWorld(ev)
      hover = pick(p)
      canvas.style.cursor = hover ? 'pointer' : panning ? 'grabbing' : 'grab'
      if (dragging) {
        dragging.x = p.x
        dragging.y = p.y
      } else if (panning) {
        view.x = ev.clientX - panning.x
        view.y = ev.clientY - panning.y
      }
    }
    const onUp = () => {
      dragging = null
      panning = null
    }
    const onWheel = (ev) => {
      ev.preventDefault()
      const f = ev.deltaY < 0 ? 1.12 : 1 / 1.12
      view.k = Math.max(0.35, Math.min(3, view.k * f))
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Окно графа появляется уже открытым и меняет размер вместе с вьюпортом:
    // одного слушателя resize мало, первый замер приходит именно отсюда.
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    loop()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [data])

  const selected = useMemo(
    () => data.nodes.find((n) => n.nick === selectedNick) ?? data.nodes[0] ?? null,
    [data, selectedNick]
  )

  const links = useMemo(() => {
    if (!selected) return []
    return data.edges
      .filter((e) => (e.a === selected.nick || e.b === selected.nick) && (showWeak || e.strength === 'strong'))
      .map((e) => ({
        other: e.a === selected.nick ? e.b : e.a,
        kind: e.kind,
        detail: e.detail,
        strength: e.strength,
      }))
      .sort((a, b) => a.strength.localeCompare(b.strength) || a.other.localeCompare(b.other))
  }, [data, selected, showWeak])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-light/70">
        <span>{data.nodes.length} аккаунтов · {data.edges.length} связей</span>
        <Swatch color={STRONG} label="точный IP или соцсеть" />
        <Swatch color={WEAK} label="подсеть /24" dashed />
        <Swatch color={SEED} label="запрошенный" round />
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" checked={showWeak} onChange={(e) => setShowWeak(e.target.checked)} />
          показывать слабые связи
        </label>
        {data.masked && (
          <span className="text-amber-400/90" title="Адреса и внешние идентификаторы заменены псевдонимами">
            адреса скрыты
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 rounded-xl bg-bg-section/60 overflow-hidden min-h-[320px] h-[46vh] lg:h-[60vh]">
          <canvas ref={canvasRef} className="w-full h-full touch-none" />
          <p className="absolute bottom-2 left-3 text-[11px] text-text-light/40 pointer-events-none">
            клик — детали, перетаскивание — двигать, колесо — масштаб
          </p>
        </div>

        <aside className="lg:w-80 lg:flex-shrink-0 lg:h-[60vh] lg:overflow-y-auto">
          {selected && <NodeDetails node={selected} links={links} onPick={setSelectedNick} />}
        </aside>
      </div>
    </div>
  )
}

function Swatch({ color, label, dashed = false, round = false }) {
  return (
    <span className="flex items-center gap-1.5">
      <i
        aria-hidden="true"
        className={round ? 'w-2.5 h-2.5 rounded-full' : 'w-4 h-0 border-t-2'}
        style={round ? { background: color } : { borderColor: color, borderTopStyle: dashed ? 'dashed' : 'solid' }}
      />
      {label}
    </span>
  )
}

function NodeDetails({ node, links, onPick }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-mono font-bold text-heading">{node.nick}</h3>
        <p className="font-mono text-[11px] text-text-light/50 break-all">{node.uuid}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <Chip>{node.depth === 0 ? 'запрошенный' : `шаг ${node.depth}`}</Chip>
        {node.uuid_type && <Chip>{node.uuid_type === 'offline' ? 'нелицензия' : 'лицензия'}</Chip>}
        <Chip>{node.ips} IP</Chip>
        {node.created && <Chip>с {node.created}</Chip>}
      </div>

      {node.depth > 0 && node.linked_by && (
        <p className="text-xs text-text-light/70">
          Попал в граф через <b className="text-heading">{kindLabel(node.linked_by)}</b>{' '}
          <span className="font-mono">{node.evidence}</span>
        </p>
      )}

      <Section title={`Связан с (${links.length})`}>
        {links.length ? (
          <ul className="space-y-1.5">
            {links.map((l, i) => (
              <li key={`${l.other}-${l.kind}-${i}`} className={l.strength === 'strong' ? '' : 'opacity-60'}>
                <button
                  type="button"
                  onClick={() => onPick(l.other)}
                  className="font-mono text-sm text-accent hover:underline"
                >
                  {l.other}
                </button>
                <span className="block text-[11px] text-text-light/60">
                  {kindLabel(l.kind)} <span className="font-mono">{l.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Нет связей при текущих настройках.</Empty>
        )}
      </Section>

      <Section title="Соцсети">
        {node.socials?.length ? (
          <ul className="space-y-1 text-xs">
            {node.socials.map((s, i) => (
              <li key={`${s.provider}-${i}`} className="flex justify-between gap-2">
                <span className="text-text-light/70">{s.provider}</span>
                <span className="font-mono">{s.id}</span>
                <span className="text-text-light/50">{s.shared_with > 0 ? `+${s.shared_with}` : '—'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Привязок нет.</Empty>
        )}
      </Section>

      <Section title={`Сессии (${node.sessions?.length ?? 0})`}>
        {node.sessions?.length ? (
          <ul className="space-y-1 text-[11px]">
            {node.sessions.map((s, i) => (
              <li key={`${s.ip}-${i}`} className="flex justify-between gap-2">
                <span className="font-mono">{s.ip}</span>
                <span className="text-text-light/50">{s.last_seen}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Сессий нет.</Empty>
        )}
      </Section>
    </div>
  )
}

const Chip = ({ children }) => (
  <span className="px-2 py-0.5 rounded-md bg-white/5 text-text-light/80">{children}</span>
)

const Empty = ({ children }) => <p className="text-xs text-text-light/50">{children}</p>

function Section({ title, children }) {
  return (
    <section className="space-y-1.5">
      <h4 className="text-[11px] uppercase tracking-wide text-text-light/40">{title}</h4>
      {children}
    </section>
  )
}
