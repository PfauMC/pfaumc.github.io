import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getModeById } from '../data/modesData'
import { generalRules, modeRules } from '../data/rulesData'
import { useServerStats } from '../hooks/useServerStats'

export default function ModePage() {
  const { modeId } = useParams()
  const mode = getModeById(modeId)
  const { stats, loading: statsLoading } = useServerStats()
  const [visible, setVisible] = useState(false)
  const [openSections, setOpenSections] = useState({})

  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [modeId])

  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white text-xl font-mono">Режим не найден</p>
        <Link to="/" className="btn-primary">← На главную</Link>
      </div>
    )
  }

  const specificRules = modeRules[mode.id] ?? []
  const allRules = [
    { group: 'Общие правила', sections: generalRules },
    { group: `Правила режима ${mode.name}`, sections: specificRules },
  ]

  const toggleSection = (key) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${mode.bgGlow} 0%, transparent 70%)` }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          {/* Back */}
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-text-light/60 hover:text-white text-sm font-medium mb-10 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            На главную
          </Link>

          <div className={`transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span
              className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border mb-5 ${mode.tagColor}`}
            >
              {mode.tag}
            </span>

            <div className="flex items-center gap-4 mb-5">
              <span className="text-5xl">{mode.emoji}</span>
              <h1 className="font-mono text-5xl sm:text-6xl font-bold text-white">{mode.name}</h1>
            </div>

            <p className="text-text-light text-lg leading-relaxed max-w-2xl mb-10">
              {mode.fullDescription}
            </p>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4">
              {[
                {
                  label: 'Онлайн сейчас',
                  value: statsLoading
                    ? '...'
                    : stats?.online
                    ? `${stats.players} / ${stats.maxPlayers}`
                    : 'Офлайн',
                  icon: (
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        !statsLoading && stats?.online ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                      }`}
                    />
                  ),
                },
                { label: 'Версия', value: stats?.version ?? '1.21', icon: <CubeIcon /> },
                { label: 'Режим работы', value: '24/7', icon: <ClockIcon /> },
                { label: 'IP адрес', value: 'play.pfaumc.ru', icon: <ServerIcon /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 bg-bg-card border border-white/5 rounded-xl px-4 py-3"
                >
                  <span className="text-text-light/40 flex items-center">{s.icon}</span>
                  <div>
                    <div className="text-xs text-text-light/50 leading-none mb-1">{s.label}</div>
                    <div className="font-mono font-semibold text-white text-sm flex items-center gap-1.5">
                      {s.icon?.props?.className === undefined && s.icon}
                      {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 bg-bg-section border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-mono text-2xl font-bold text-white mb-8">Особенности режима</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {mode.highlights.map((h, i) => (
              <div
                key={h.title}
                className={`card hover:border-white/10 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 80 + 200}ms`, borderLeftColor: mode.accentColor, borderLeftWidth: '2px' }}
              >
                <div className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">{h.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{h.title}</h3>
                    <p className="text-text-light text-sm leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="py-16 relative">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-mono text-2xl font-bold text-white mb-8">Правила</h2>

          <div className="space-y-6">
            {allRules.map(({ group, sections }) => (
              <div key={group}>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3 font-mono"
                  style={{ color: mode.accentColor }}
                >
                  {group}
                </p>
                <div className="space-y-3">
                  {sections.map((section, sIdx) => {
                    const key = `${group}-${sIdx}`
                    const isOpen = openSections[key] !== false
                    return (
                      <div key={key} className="card">
                        <button
                          onClick={() => toggleSection(key)}
                          className="w-full flex items-center gap-3 text-left"
                        >
                          <span className="text-lg">{section.icon}</span>
                          <h3 className="font-semibold text-white text-sm flex-1">{section.category}</h3>
                          <svg
                            className={`w-4 h-4 text-text-light/40 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                          >
                            <polyline points="6,9 12,15 18,9" />
                          </svg>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <ul className="mt-3 space-y-2 pl-2">
                            {section.items.map((item, iIdx) => (
                              <li key={iIdx} className="flex gap-3 text-sm text-text-light leading-relaxed">
                                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: mode.accentColor }}>
                                  <path d="M2 8h12M8 2l6 6-6 6" />
                                </svg>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-text-light/40 text-xs mt-6">
            Правила могут обновляться. Следите за изменениями в{' '}
            <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              нашем Discord
            </a>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-bg-section border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-mono text-3xl font-bold text-white mb-3">Готов начать?</h2>
          <p className="text-text-light mb-8">Подключайся и начинай играть прямо сейчас</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText('play.pfaumc.ru').catch(() => {})
              }}
              className="btn-primary"
            >
              <ServerIcon className="w-4 h-4" />
              Скопировать IP
            </button>
            <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <DiscordIcon className="w-4 h-4" />
              Discord
            </a>
            <Link to="/" className="btn-ghost">← Все режимы</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function CubeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  )
}

function ServerIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function DiscordIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}
