import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { generalRules, modeRules } from '../../data/rulesData'
import { useSEO } from '../../hooks/useSEO'

const TABS = [
  { id: 'general', label: 'Общие правила', icon: '⚖️' },
  { id: 'vanilla', label: 'Ванила', icon: '🌿' },
  { id: 'political-survival', label: 'Политическое выживание', icon: '🔥' },
]

function RuleSection({ id, category, icon, items }) {
  const [open, setOpen] = useState(true)
  const { hash } = useLocation()
  const highlighted = hash === `#${id}`

  return (
    <div id={id} className={`card mb-4 scroll-mt-24 transition-shadow ${highlighted ? 'ring-1 ring-accent/50' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left group"
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <h3 className="font-mono font-bold text-white flex-1 group-hover:text-accent transition-colors">
          {category}
        </h3>
        <span className={`text-text-light/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="mt-4 space-y-2.5">
          {items.map((rule, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <span className="text-text-light text-sm leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function WikiRules() {
  useSEO('Правила сервера — PfauMC Wiki', 'Общие правила и правила режимов Ванила и Политическое выживание на Minecraft сервере PfauMC.')

  const { tab: tabParam } = useParams()
  const { hash } = useLocation()
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : 'general'

  const rules = tab === 'general' ? generalRules : modeRules[tab]

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, tab])

  return (
    <article>
      <div className="mb-8">
        <div className="text-text-light/50 text-xs font-mono uppercase tracking-widest mb-3">Правила</div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold text-white mb-3">
          📜 Правила сервера
        </h1>
        <p className="text-text-light text-base leading-relaxed max-w-2xl">
          Незнание правил не освобождает от ответственности.
          Заходя на сервер, вы соглашаетесь с ними.
        </p>
      </div>

      {/* Important notice */}
      <div className="mb-6 p-4 bg-orange-500/8 border border-orange-500/20 rounded-xl text-sm text-text-light flex gap-3">
        <span className="text-orange-400 text-xl flex-shrink-0">⚠️</span>
        <div>
          <span className="text-orange-400 font-bold">Важно: </span>
          Решения администрации окончательны. За нарушения — временный или постоянный бан.
          Донат не защищает от блокировки.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.id}
            to={t.id === 'general' ? '/wiki/rules' : `/wiki/rules/${t.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-accent text-white shadow-[0_0_15px_rgba(29,165,232,0.3)]'
                : 'bg-bg-section border border-white/5 text-text-light hover:text-white hover:border-white/10'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>

      {/* Rules */}
      <div>
        {rules.map((section) => (
          <RuleSection key={section.id} {...section} />
        ))}
      </div>

      {/* Report */}
      <div className="mt-6 p-4 bg-accent/8 border border-accent/20 rounded-xl text-sm text-text-light">
        <span className="text-accent font-bold">Увидели нарушение? </span>
        Сообщите в{' '}
        <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Discord
        </a>{' '}
        с доказательствами (скриншот/видео) и ником нарушителя.
      </div>
    </article>
  )
}
