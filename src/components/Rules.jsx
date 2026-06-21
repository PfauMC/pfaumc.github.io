import { useEffect, useRef, useState } from 'react'
import { generalRules, modeRules } from '../data/rulesData'

const tabs = ['Общие', 'Ванила', 'ГойЛенд']
const tabRules = {
  'Общие': generalRules,
  'Ванила': modeRules.vanilla,
  'ГойЛенд': modeRules.goyland,
}

export default function Rules() {
  const [activeTab, setActiveTab] = useState('Общие')
  const [visible, setVisible] = useState(false)
  const [openItems, setOpenItems] = useState({})
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const toggleItem = (key) =>
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))

  const currentRules = tabRules[activeTab]

  return (
    <section id="rules" className="py-20 sm:py-28 relative" ref={ref}>
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accent font-mono text-sm font-semibold tracking-widest uppercase mb-3">Правила</p>
          <h2 className="section-title">Мир без хаоса</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Правила созданы, чтобы каждый получал удовольствие от игры. Незнание правил не освобождает от ответственности.
          </p>
        </div>

        <div className={`flex gap-2 justify-center mb-8 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex bg-bg-card border border-white/5 rounded-xl p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setOpenItems({}) }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-accent text-white shadow-[0_0_12px_rgba(29,165,232,0.3)]'
                    : 'text-text-light hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div key={activeTab} className="space-y-4 animate-fade-in">
          {currentRules.map((section, sIdx) => (
            <div
              key={section.category}
              className={`card transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${sIdx * 80 + 300}ms` }}
            >
              <button
                onClick={() => toggleItem(`section-${sIdx}`)}
                className="w-full flex items-center gap-3 text-left"
              >
                <span className="text-xl">{section.icon}</span>
                <h3 className="font-semibold text-white text-base flex-1">{section.category}</h3>
                <svg
                  className={`w-5 h-5 text-text-light/40 transition-transform duration-200 flex-shrink-0 ${openItems[`section-${sIdx}`] !== false ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${openItems[`section-${sIdx}`] === false ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                <ul className="mt-4 space-y-2.5 pl-2">
                  {section.items.map((item, iIdx) => (
                    <li key={iIdx} className="flex gap-3 text-sm text-text-light leading-relaxed">
                      <span className="text-accent mt-0.5 flex-shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M2 8h12M8 2l6 6-6 6" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-8 text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-text-light/50 text-sm">
            Правила могут обновляться. Следите за изменениями в{' '}
            <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              нашем Discord
            </a>
            .
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </section>
  )
}
