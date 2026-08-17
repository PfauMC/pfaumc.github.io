import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatSmartTime } from '../../lib/forumFormat'
import { UserHead, RoleBadge } from './ui'
import LoginModal from './LoginModal'

/** Правый верхний угол: уведомления + голова скина. */
export default function UserArea({ compact = false }) {
  const { user, loading } = useForumAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  if (loading) {
    return <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" aria-hidden="true" />
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setLoginOpen(true)}
          className="px-3 h-9 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 text-sm font-semibold transition-colors"
        >
          Войти
        </button>
        {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      </>
    )
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
      <NotificationsBell />
      <UserMenu />
    </div>
  )
}

/* ===== Уведомления ===== */
function NotificationsBell() {
  const { unreadCount, setUnreadCount, refresh } = useForumAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    setError(false)
    api('/forum/notifications')
      .then((data) => {
        setItems(data.notifications)
        setUnreadCount(data.unreadCount)
      })
      .catch(() => setError(true))
  }, [open, setUnreadCount])

  const markAll = async () => {
    await api('/forum/notifications/read-all', { method: 'POST' })
    setItems((list) => list?.map((n) => ({ ...n, isRead: true })) ?? null)
    setUnreadCount(0)
  }

  const openItem = async (item) => {
    setOpen(false)
    if (!item.isRead) {
      api(`/forum/notifications/${item.id}/read`, { method: 'POST' }).then(refresh).catch(() => {})
    }
    if (item.topicId) {
      navigate(`/forum/t/${item.topicId}${item.postNumber ? `?post=${item.postNumber}` : ''}`)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={unreadCount ? `Уведомления, непрочитанных: ${unreadCount}` : 'Уведомления'}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text-light/60 hover:text-accent hover:bg-white/5 transition-colors"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 z-50 sm:w-[22rem] rounded-2xl glass overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
              <span className="font-mono font-semibold text-heading text-sm">Уведомления</span>
              {unreadCount > 0 && (
                <button onClick={markAll} className="text-xs text-accent hover:underline">
                  Отметить всё прочитанным
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {error ? (
                <p className="px-4 py-8 text-center text-sm text-text-light/60">Не удалось загрузить</p>
              ) : !items ? (
                <div className="px-4 py-6 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-bg-section animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-text-light/60">Пока ничего нового</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex gap-3 ${
                      item.isRead ? '' : 'bg-accent/[0.06]'
                    }`}
                  >
                    <UserHead user={item.actor} size={28} link={false} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-light leading-snug">{notificationText(item)}</p>
                      <p className="text-[11px] text-text-light/40 mt-0.5">{formatSmartTime(item.createdAt)}</p>
                    </div>
                    {!item.isRead && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function notificationText(item) {
  const actor = item.actor?.name ?? 'Кто-то'
  const title = item.topicTitle ?? item.payload?.topicTitle ?? 'теме'

  switch (item.type) {
    case 'reply':
      return `${actor} ответил на ваше сообщение в «${title}»`
    case 'mention':
      return `${actor} упомянул вас в «${title}»`
    case 'topic_reply':
      return `${actor} написал в теме «${title}»`
    case 'moderation':
      return item.payload?.action === 'post.delete'
        ? `${actor} удалил ваше сообщение в «${title}»`
        : `${actor} отредактировал ваше сообщение в «${title}»`
    default:
      return `Событие в теме «${title}»`
  }
}

/* ===== Меню пользователя ===== */
function UserMenu() {
  const { user, logout, accounts, switchAccount } = useForumAuth()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(null)
  const [switchError, setSwitchError] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const items = [
    { label: 'Настройки', to: '/forum/settings' },
    { label: 'Мои ответы', to: '/forum/my-posts' },
    { label: 'Подписки', to: '/forum/subscriptions' },
  ]

  const onSwitch = async (uuid) => {
    setSwitching(uuid)
    setSwitchError(false)
    try {
      await switchAccount(uuid)
      setOpen(false)
    } catch {
      setSwitchError(true)
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Меню пользователя"
        className="flex items-center rounded-lg hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <UserHead user={user} size={34} link={false} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl glass overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="font-mono font-semibold text-heading text-sm truncate">{user.name}</p>
              <div className="mt-1"><RoleBadge role={user.role} /></div>
            </div>

            {accounts.length > 1 && (
              <div className="py-1 border-b border-white/5">
                {accounts.map((acc) => (
                  <button
                    key={acc.uuid}
                    onClick={() => onSwitch(acc.uuid)}
                    disabled={acc.isActive || switching !== null}
                    aria-current={acc.isActive ? 'true' : undefined}
                    aria-label={acc.isActive ? `${acc.name} — текущий аккаунт` : `Переключиться на ${acc.name}`}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors enabled:hover:bg-white/5 disabled:cursor-default disabled:opacity-100"
                  >
                    <UserHead user={acc} size={24} link={false} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-text-light truncate">{acc.name}</span>
                      <RoleBadge role={acc.role} className="mt-0.5" />
                    </span>
                    {acc.isActive ? (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                    ) : switching === acc.uuid ? (
                      <span className="w-2 h-2 rounded-full bg-accent/50 animate-pulse flex-shrink-0" aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
                {switchError && (
                  <p className="px-4 py-1.5 text-xs text-red-400">Не удалось переключить аккаунт</p>
                )}
              </div>
            )}

            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-text-light hover:text-accent hover:bg-white/5 transition-colors"
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={async () => { setOpen(false); await logout() }}
              className="w-full text-left px-4 py-2.5 text-sm text-text-light/70 hover:text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
            >
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function BellIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
