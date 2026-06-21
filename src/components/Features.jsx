import { useEffect, useRef, useState } from 'react'

const features = [
  {
    icon: GridIcon,
    title: 'Множество режимов',
    desc: 'Два уникальных режима — Ванила и ГойЛенд — для разных стилей игры. Каждый найдёт своё приключение.',
  },
  {
    icon: UsersIcon,
    title: 'Активное сообщество',
    desc: 'Дружелюбный Discord, регулярные ивенты и живое общение. Здесь ты не один — здесь ты дома.',
  },
  {
    icon: ShieldIcon,
    title: 'Стабильность и защита',
    desc: 'Мощные серверы, антигриф и защита построек. Твоя работа в безопасности 24/7.',
  },
  {
    icon: BoltIcon,
    title: 'Частые обновления',
    desc: 'Мы постоянно развиваем сервер: новые механики, сезоны, ивенты и улучшения каждый месяц.',
  },
]

export default function Features() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="py-20 sm:py-28 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-accent font-mono text-sm font-semibold tracking-widest uppercase mb-3">Почему PfauMC</p>
          <h2 className="section-title">Больше, чем просто сервер</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Мы создали место, где можно играть так, как хочется тебе
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`card group hover:scale-[1.02] transition-all duration-500 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <f.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-text-light text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GridIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function UsersIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ShieldIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9,12 11,14 15,10" />
    </svg>
  )
}

function BoltIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
    </svg>
  )
}
