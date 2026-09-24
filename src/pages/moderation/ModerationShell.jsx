import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useForumAuth } from '../../context/ForumAuthContext'
import { Breadcrumbs, ListSkeleton, EmptyState } from '../../components/forum/ui'

export const MODERATION_TABS = [
  { to: '/moderation/bans', label: 'Бан-лист' },
  { to: '/moderation/reports', label: 'Жалобы' },
  { to: '/moderation/cities', label: 'Заявки на города' },
  { to: '/moderation/guide', label: 'Заявки в путеводитель' },
  { to: '/moderation/log', label: 'Журнал' },
]

/**
 * Общая обёртка раздела «Модерация»: вкладки и проверка доступа. Доступ -- с роли
 * helper (helper/helper+/admin), флаг `isStaff` бэкенд считает на каждый /auth/me.
 * Здесь только вежливое сообщение: каждый эндпоинт раздела проверяет роль сам.
 */
export default function ModerationShell({ children }) {
  const { user, loading, isStaff } = useForumAuth()
  const nav = useRef(null)
  const { pathname } = useLocation()
  // На телефоне вкладки листаются вбок -- активная не должна прятаться за краем.
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname, isStaff])

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Модерация' }]} />
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-4">Модерация</h1>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : !user || !isStaff ? (
          <EmptyState icon="🚫" title="Доступ только для персонала" text="Этот раздел скрыт от обычных игроков." />
        ) : (
          <>
            <nav ref={nav} aria-label="Разделы модерации" className="flex gap-1 overflow-x-auto scrollbar-none border-b border-white/10 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
              {MODERATION_TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    `flex-shrink-0 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      isActive ? 'border-accent text-accent' : 'border-transparent text-text-light/70 hover:text-heading'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
            {children}
          </>
        )}
      </div>
    </div>
  )
}
