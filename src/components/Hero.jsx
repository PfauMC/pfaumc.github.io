import { useState, useEffect, useRef } from 'react'

const SERVER_IP = 'play.pfaumc.ru'

export default function Hero() {
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = SERVER_IP
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" ref={ref}>
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Сервер онлайн
            </div>

            {/* Headline */}
            <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              <span className="text-white block">ТВОЙ МИР.</span>
              <span className="text-gradient block">ТВОИ ПРАВИЛА.</span>
            </h1>

            <p className="text-text-light text-lg leading-relaxed mb-8 max-w-lg">
              PfauMC — это Minecraft-сервер, где каждый находит свой стиль игры.
              Ванила для тех, кто ценит классику, и ГойЛенд для тех, кто жаждет приключений.
            </p>

            {/* Server IP */}
            <div className="mb-8">
              <p className="text-text-light/60 text-xs font-mono uppercase tracking-widest mb-2">IP-адрес сервера</p>
              <button
                onClick={copyIP}
                className="group flex items-center gap-3 bg-bg-card border border-white/10 hover:border-accent/40 rounded-xl px-5 py-3.5 transition-all duration-200 hover:bg-accent/5"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="font-mono text-lg font-semibold text-white">{SERVER_IP}</span>
                <span className="ml-auto text-text-light/40 group-hover:text-accent transition-colors text-sm">
                  {copied ? (
                    <span className="text-green-400 font-medium">Скопировано!</span>
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </span>
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <a
                href="https://discord.gg/BPmxWwdChY"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <DiscordIcon className="w-5 h-5" />
                Наш Discord
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#modes')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="btn-ghost"
              >
                Режимы сервера
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/5">
              {[
                { value: '2', label: 'Режима' },
                { value: '24/7', label: 'Онлайн' },
                { value: '1.21', label: 'Версия' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-mono text-2xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-text-light/60 text-sm mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mascot */}
          <div
            className={`relative flex items-center justify-center transition-all duration-1000 delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Glow rings */}
            <div className="absolute w-[36rem] h-[36rem] rounded-full border border-accent/10 animate-[spin_20s_linear_infinite]" />
            <div className="absolute w-[48rem] h-[48rem] rounded-full border border-accent/5 animate-[spin_30s_linear_infinite_reverse]" />
            <div className="absolute w-[42rem] h-[42rem] rounded-full bg-accent/5 blur-3xl" />

            <div className="relative animate-float">
              <div className="absolute inset-0 bg-accent/10 blur-2xl rounded-full scale-75 translate-y-8" />
              <img
                src="/assets/mascot.png"
                alt="PfauMC Mascot"
                className="relative w-[32rem] sm:w-[40rem] lg:w-[44rem] max-w-full object-contain drop-shadow-2xl"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Floating badges */}
            <div className="absolute top-8 right-4 sm:right-8 bg-bg-card/90 backdrop-blur border border-accent/20 rounded-xl px-3 py-2 text-xs font-mono">
              <span className="text-accent">✦</span> <span className="text-white">Ванила</span>
            </div>
            <div className="absolute bottom-12 left-0 sm:left-4 bg-bg-card/90 backdrop-blur border border-accent/20 rounded-xl px-3 py-2 text-xs font-mono">
              <span className="text-accent">✦</span> <span className="text-white">ГойЛенд</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-light/40 hover:text-accent transition-colors animate-bounce"
        aria-label="Прокрутить вниз"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </section>
  )
}

function CopyIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function DiscordIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function ChevronDown({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}
