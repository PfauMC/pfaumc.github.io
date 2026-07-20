import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { generalRules, modeRules } from '../../data/rulesData'
import { mechanicsSections } from './WikiMechanics'

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

export default function WikiLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ipCopied, setIpCopied] = useState(false)
  const location = useLocation()

  useEffect(() => {
    document.body.classList.add('wiki-copy-enabled')
    return () => document.body.classList.remove('wiki-copy-enabled')
  }, [])

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP)
    } catch {
      const el = document.createElement('textarea')
      el.value = SERVER_IP
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setIpCopied(true)
    setTimeout(() => setIpCopied(false), 2000)
  }

  const currentPage = [...sections.flatMap(s => s.items), ...rulesNav, ...mechanicsNav].find(i => i.to === location.pathname)
    ?? (location.pathname.startsWith('/wiki/rules') ? { label: '📜 Правила сервера' } : undefined)

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile top bar */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 text-text-light hover:text-white transition-colors text-sm font-medium border border-white/10 rounded-lg px-4 py-2.5 bg-bg-card w-full"
          >
            <MenuIcon className="w-4 h-4 text-accent" />
            <span>{currentPage?.label ?? 'Вики'}</span>
            <ChevronIcon className={`w-4 h-4 ml-auto transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-60 flex-shrink-0`}>
            <div className="sticky top-24">
              {/* Wiki home link */}
              <NavLink
                to="/wiki"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 transition-colors ${
                    isActive
                      ? 'bg-accent/15 text-accent border border-accent/25'
                      : 'text-text-light hover:text-white hover:bg-white/5'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
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
                                : 'text-text-light hover:text-white hover:bg-white/5'
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
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
                                : 'text-text-light hover:text-white hover:bg-white/5'
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
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
                                      : 'text-text-light/70 hover:text-white hover:bg-white/5'
                                  }`}
                                  onClick={() => setSidebarOpen(false)}
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
                                : 'text-text-light hover:text-white hover:bg-white/5'
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
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
                                      : 'text-text-light/70 hover:text-white hover:bg-white/5'
                                  }`}
                                  onClick={() => setSidebarOpen(false)}
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
                  onClick={copyIP}
                  title="Скопировать IP"
                  className="font-mono text-sm text-white break-all text-left cursor-pointer hover:text-accent transition-colors"
                >
                  {SERVER_IP}
                </button>
                <div className="text-text-light/50 text-xs mt-1">
                  {ipCopied ? <span className="text-accent">✓ Скопировано</span> : 'Java Edition 1.21+ · нажмите чтобы скопировать'}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
          {ipCopied && <div className="copy-toast">IP скопирован</div>}
        </div>
      </div>
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

function ChevronIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}
