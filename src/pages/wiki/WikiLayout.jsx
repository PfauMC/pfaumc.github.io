import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { headingSlug } from '../../lib/markup'
import { wikiFetcher, groupBySection, outline } from '../../lib/wikiApi'
import CopyToast from '../../components/CopyToast'
import { SERVER_VERSION } from '../../config'

const SERVER_IP = 'play.pfaumc.online'
const DRAWER_ID = 'wiki-nav-drawer'

export default function WikiLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { copied, error, copy } = useCopyToClipboard()
  const menuButtonRef = useRef(null)
  const { isModerator } = useForumAuth()

  // Статьи -- из API (или встроенной копии, пока бэкенд вики не выкачен).
  const pagesRequest = useApiData('/pages', { fetcher: wikiFetcher })
  const groups = groupBySection(pagesRequest.data?.pages ?? [])
  const currentSlug = location.pathname.match(/^\/wiki\/([a-z0-9-]+)$/)?.[1] ?? null
  const currentRequest = useApiData(currentSlug ? `/pages/${currentSlug}` : null, { fetcher: wikiFetcher })
  const currentOutline = outline(currentRequest.data?.page?.body)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname, location.hash])
  // После создания, правки или удаления статьи меню должно обновиться.
  const reloadPages = pagesRequest.reload
  useEffect(() => { reloadPages() }, [location.pathname, reloadPages])

  useEffect(() => {
    if (!sidebarOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar()
    }
    document.addEventListener('keydown', onKeyDown)

    // Если окно расширили за пределы мобильного брейкпоинта, пока дровер
    // открыт — сбрасываем состояние, иначе overflow:hidden зависает навсегда.
    const desktopQuery = window.matchMedia('(min-width: 850px)')
    const onDesktop = (e) => { if (e.matches) setSidebarOpen(false) }
    desktopQuery.addEventListener('change', onDesktop)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
      desktopQuery.removeEventListener('change', onDesktop)
    }
  }, [sidebarOpen])

  const closeSidebar = () => {
    setSidebarOpen(false)
    menuButtonRef.current?.focus()
  }

  const currentPage = (pagesRequest.data?.pages ?? []).find((p) => p.slug === currentSlug)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-accent/15 text-accent border border-accent/25 font-medium'
        : 'text-text-light hover:text-heading hover:bg-white/5'
    }`

  const navContent = (onNavigate) => (
    <>
      <NavLink to="/wiki" end className={linkClass} onClick={onNavigate}>
        <span className="text-base">📖</span>
        <span>Главная вики</span>
      </NavLink>
      <div className="mb-4" />

      {groups.map((group) => (
        <div key={group.section} className="mb-5">
          <div className="text-text-light/40 text-xs font-mono uppercase tracking-widest px-3 mb-2">
            {group.section}
          </div>
          <ul className="space-y-0.5">
            {group.pages.map((page) => (
              <li key={page.slug}>
                <NavLink to={`/wiki/${page.slug}`} className={linkClass} onClick={onNavigate}>
                  <span>{page.icon}</span>
                  <span>{page.title}</span>
                </NavLink>
                {page.slug === currentSlug && currentOutline.length > 1 && (
                  <ul className="mt-0.5 mb-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {currentOutline.map((heading) => {
                      const anchor = headingSlug(heading)
                      return (
                        <li key={anchor}>
                          <Link
                            to={`/wiki/${page.slug}#${anchor}`}
                            className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              location.hash === `#${anchor}` ? 'text-accent font-medium' : 'text-text-light/70 hover:text-heading hover:bg-white/5'
                            }`}
                            onClick={onNavigate}
                          >
                            {heading.replace(/<[^>]*>/g, '')}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {isModerator && !pagesRequest.data?.fallback && (
        <Link to="/wiki/new" onClick={onNavigate} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border border-dashed border-accent/40 text-accent hover:bg-accent/10 transition-colors">
          ＋ Новая статья
        </Link>
      )}

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
            <span>{currentPage ? `${currentPage.icon} ${currentPage.title}` : 'Вики'}</span>
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
