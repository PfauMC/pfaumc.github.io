import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { modes } from '../data/modesData'

export default function Modes() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="modes" className="py-20 sm:py-28 bg-bg-section relative scroll-mt-20" ref={ref}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accent font-mono text-sm font-semibold tracking-widest uppercase mb-3">Режимы</p>
          <h2 className="section-title">Выбери свой путь</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Два режима — два стиля игры. Каждый режим — новое приключение.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {modes.map((mode, i) => (
            <ModeCard key={mode.id} mode={mode} visible={visible} delay={i * 150} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </section>
  )
}

function ModeCard({ mode, visible, delay }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/5 bg-bg-card group hover:border-white/10 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${mode.accentColor}, transparent)` }}
      />
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `${mode.accentColor}15` }}
      />

      <div className="relative p-7 sm:p-8">
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full border ${mode.tagColor} mb-3`}>
              {mode.tag}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{mode.emoji}</span>
              <h3 className="font-mono text-3xl font-bold text-heading">{mode.name}</h3>
            </div>
          </div>
        </div>

        <p className="text-text-light leading-relaxed mb-6">{mode.description}</p>

        <ul className="space-y-2.5 mb-7">
          {mode.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-text-light">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke={mode.accentColor} strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke={mode.accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/${mode.id}`}
            className="inline-flex items-center gap-2 font-semibold text-sm transition-colors hover:opacity-80"
            style={{ color: mode.accentColor }}
          >
            Подробнее
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            disabled
            className="inline-flex items-center gap-2 font-semibold text-sm text-text-light/30 cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Карта мира
          </button>
        </div>
      </div>
    </div>
  )
}
