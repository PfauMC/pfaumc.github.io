import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PfauIcon } from './LoadingScreen'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleSection = (hash) => {
    setMenuOpen(false)
    if (isHome) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  const navItems = [
    { label: 'Главная', action: () => handleSection('#hero') },
    { label: 'Режимы', action: () => handleSection('#modes') },
    { label: 'Правила', action: () => handleSection('#rules') },
    { label: 'Вики', to: '/wiki' },
    { label: 'Статистика', to: '/stats' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled
          ? 'py-3 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.15)]'
          : 'py-5 backdrop-blur-none'
      }`}
      style={{
        background: scrolled ? 'rgba(var(--c-bg-main), 0.78)' : 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <PfauIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
          <div className="leading-none">
            <span className="font-mono font-bold text-xl" style={{ color: 'rgb(var(--c-text-base))' }}>Pfau</span>
            <span className="font-mono font-bold text-xl text-accent">MC</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden nav:flex items-center gap-6">
          {navItems.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={`nav-link text-sm ${location.pathname.startsWith(item.to) ? 'text-accent' : ''}`}
              >
                {item.label}
              </Link>
            ) : (
              <button key={item.label} onClick={item.action} className="nav-link text-sm">
                {item.label}
              </button>
            )
          )}
        </nav>

        {/* Social + theme + CTA */}
        <div className="hidden nav:flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-light/60 hover:text-accent hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          <Link to="/donate" className="btn-ghost text-sm py-2 px-4">
            💎 Донат
          </Link>
          <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-light/60 hover:text-[#29B6F6] hover:bg-white/5 transition-colors">
            <TelegramIcon className="w-5 h-5" />
          </a>
          <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer" aria-label="Discord"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-light/60 hover:text-[#5865F2] hover:bg-white/5 transition-colors">
            <DiscordIcon className="w-5 h-5" />
          </a>
          <a href="https://www.youtube.com/@PfauMC" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-light/60 hover:text-[#FF0000] hover:bg-white/5 transition-colors">
            <YouTubeIcon className="w-5 h-5" />
          </a>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="nav:hidden flex items-center gap-1">
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-light/60 hover:text-accent hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Меню"
          >
            <span className={`w-5 h-0.5 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ background: 'rgb(var(--c-text-base))' }} />
            <span className={`w-5 h-0.5 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} style={{ background: 'rgb(var(--c-text-base))' }} />
            <span className={`w-5 h-0.5 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: 'rgb(var(--c-text-base))' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`nav:hidden transition-all duration-300 overflow-hidden ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-4 border-t border-white/5 bg-bg-main/98 flex flex-col gap-1">
          {navItems.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="text-left text-text-light hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={item.action}
                className="text-left text-text-light hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors font-medium"
              >
                {item.label}
              </button>
            )
          )}
          <Link to="/donate" onClick={() => setMenuOpen(false)}
            className="inline-flex items-center justify-center gap-2 btn-primary text-sm mt-2">
            💎 Донат
          </Link>
          <div className="flex gap-2 mt-2">
            <a href="https://t.me/pfaumc" target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 btn-ghost text-sm py-2">
              <TelegramIcon className="w-4 h-4" /> Telegram
            </a>
            <a href="https://discord.gg/BPmxWwdChY" target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 btn-ghost text-sm py-2">
              <DiscordIcon className="w-4 h-4" /> Discord
            </a>
            <a href="https://www.youtube.com/@PfauMC" target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 btn-ghost text-sm py-2">
              <YouTubeIcon className="w-4 h-4" /> YouTube
            </a>
          </div>
        </div>
      </div>

      {/* Gradient border bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none transition-opacity duration-500"
        style={{
          opacity: scrolled ? 1 : 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(29,165,232,0.15) 25%, rgba(29,165,232,0.35) 50%, rgba(29,165,232,0.15) 75%, transparent 100%)',
        }}
      />
    </header>
  )
}

function SunIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function TelegramIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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

function YouTubeIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}
