import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { generalRules, modeRules } from '../../data/rulesData'
import { mechanicsSections } from './WikiMechanics'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import CopyToast from '../../components/CopyToast'
import { SERVER_VERSION } from '../../config'

const sections = [
  {
    title: 'Начало работы',
    items: [
      { label: '🚀 Как зайти на сервер', to: '/wiki/guide' },
    ],
  },
]

const rulesNav = [
  { label: 'Общие правила', icon: '⚖️', to: '/wiki/rules', children: generalRules },
  { label: 'Ванила', icon: '🌿', to: '/wiki/rules/vanilla', children: modeRules.vanilla },
  { label: 'Политическое выживание', icon: '🔥', to: '/wiki/rules/political-survival', children: modeRules['political-survival'] },
]

const mechanicsNav = [
  { label: 'Механики сервера', icon: '🧭', to: '/wiki/mechanics', children: mechanicsSections },
]

const SERVER_IP = 'play.pfaumc.online'
const DRAWER_ID = 'wiki-nav-drawer'

export default function WikiLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { copied, error, copy } = useCopyToClipboard()
  const menuButtonRef = useRef(null)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname, location.hash])

  useEffect(() => {
    if (!sidebarOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [sidebarOpen])

  const closeSidebar = () => {
    setSidebarOpen(false)
    menuButtonRef.current?.focus()
  }

  const currentPage = [...sections.flatMap(s => s.items), ...rulesNav, ...mechanicsNav].find(i => i.to === location.pathname)
    ?? (location.pathname.startsWith('/wiki/rules') ? { label: '📜 Правила сервера' } : undefined)

  const navContent = (onNavigate) => (
    <>
      <NavLink
        to="/wiki"
        end
        className={({ isActive }) =>
          `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 transition-colors ${
            isActive
              ? 'bg-accent/15 text-accent border border-accent/25'
              : 'text-text-light hover:text-heading hover:bg-white/5'
          }`
        }
        onClick={onNavigate}
      >
        <span className="text-base">📖</span>
        <span>Главная вики</span>
      </NavLink>

      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <div className="text-text-light/40 text-xs font-mono uppercase tracking-widest px-3 mb-2">
            {section.title}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent/15 text-accent border border-accent/25 font-medium'
                        : 'text-text-light hover:text-heading hover:bg-white/5'
                    }`
                  }
                  onClick={onNavigate}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Правила — nested TOC */}
      <div className="mb-5">
        <div className="text-text-light/40 text-xs font-mono uppercase tracking-widest px-3 mb-2">
          Правила
        </div>
        <ul className="space-y-0.5">
          {rulesNav.map((section) => {
            const isActiveSection = location.pathname === section.to
            return (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent/15 text-accent border border-accent/25 font-medium'
                        : 'text-text-light hover:text-heading hover:bg-white/5'
                    }`
                  }
                  onClick={onNavigate}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </NavLink>
                {isActiveSection && (
                  <ul className="mt-0.5 mb-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {section.children.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`${section.to}#${cat.id}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            location.hash === `#${cat.id}`
                              ? 'text-accent font-medium'
                              : 'text-text-light/70 hover:text-heading hover:bg-white/5'
                          }`}
                          onClick={onNavigate}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.category}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Механики — nested TOC */}
      <div className="mb-5">
        <div className="text-text-light/40 text-xs font-mono uppercase tracking-widest px-3 mb-2">
          Механики
        </div>
        <ul className="space-y-0.5">
          {mechanicsNav.map((section) => {
            const isActiveSection = location.pathname === section.to
            return (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent/15 text-accent border border-accent/25 font-medium'
                        : 'text-text-light hover:text-heading hover:bg-white/5'
                    }`
                  }
                  onClick={onNavigate}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </NavLink>
                {isActiveSection && (
                  <ul className="mt-0.5 mb-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {section.children.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`${section.to}#${cat.id}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            location.hash === `#${cat.id}`
                              ? 'text-accent font-medium'
                              : 'text-text-light/70 hover:text-heading hover:bg-white/5'
                          }`}
                          onClick={onNavigate}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.category}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Join card */}
      <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-xl">
        <div className="font-mono text-xs font-bold text-accent mb-1">IP-адрес</div>
        <button
          onClick={() => copy(SERVER_IP)}
          aria-label={`Скопировать IP-адрес сервера ${SERVER_IP}`}
          className="font-mono text-sm text-heading break-all text-left cursor-pointer hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded transition-colors"
        >
          {SERVER_IP}
        </button>
        <div className="text-text-light/50 text-xs mt-1">
          {copied ? <span className="text-accent">✓ Скопировано</span> : `Java Edition ${SERVER_VERSION} · нажмите чтобы скопировать`}
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile top bar */}
        <div className="nav:hidden mb-4">
          <button
            ref={menuButtonRef}
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            aria-controls={DRAWER_ID}
            className="flex items-center gap-2 text-text-light hover:text-heading transition-colors text-sm font-medium border border-white/10 rounded-lg px-4 py-2.5 bg-bg-card w-full"
          >
            <MenuIcon className="w-4 h-4 text-accent" />
            <span>{currentPage?.label ?? 'Вики'}</span>
            <span className="ml-auto text-text-light/40 text-xs">Меню</span>
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden nav:block w-60 flex-shrink-0">
            <div className="sticky top-24">
              {navContent()}
            </div>
          </aside>

          {/* Main content — always full width, drawer never pushes it */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`nav:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <div
          id={DRAWER_ID}
          role="dialog"
          aria-modal="true"
          aria-label="Навигация вики"
          className={`absolute inset-y-0 left-0 w-[85%] max-w-xs bg-bg-main border-r border-white/10 flex flex-col transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
            <span className="font-mono font-bold text-heading text-sm">Навигация</span>
            <button
              onClick={closeSidebar}
              aria-label="Закрыть меню"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-light hover:text-heading transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {navContent(() => setSidebarOpen(false))}
          </div>
        </div>
      </div>

      <CopyToast copied={copied} error={error} successMessage="IP скопирован" />
    </div>
  )
}

function MenuIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
