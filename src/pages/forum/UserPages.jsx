import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatSmartTime } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Pagination, LoginNotice, ConfirmDialog, FormError, UserHead, RoleBadge, Toggle,
} from '../../components/forum/ui'

function Shell({ title, children, crumb }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Форум', to: '/forum' }, { label: crumb }]} />
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-6">{title}</h1>
        {children}
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useForumAuth()
  if (loading) return <ListSkeleton rows={3} />
  if (!user) return <LoginNotice text="Этот раздел доступен авторизованным игрокам." />
  return children
}

/* ===== Мои ответы ===== */
export function MyPostsPage() {
  useSEO('Мои ответы — Форум PfauMC')
  const { user } = useForumAuth()
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useApiData(user ? `/forum/my-posts?page=${page}` : null)

  return (
    <Shell title="Мои ответы" crumb="Мои ответы">
      <RequireAuth>
        {loading && !data ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data?.posts.length ? (
          <EmptyState icon="✍️" title="Вы ещё ничего не писали" text="Найдите интересную тему и ответьте в ней." />
        ) : (
          <>
            <div className="space-y-3">
              {data.posts.map((p) => (
                <Link key={p.id} to={`/forum/t/${p.topicId}?post=${p.postNumber}`} className="card block group hover:border-accent/25">
                  <h2 className="font-medium text-heading group-hover:text-accent transition-colors truncate">{p.topicTitle}</h2>
                  <p className="text-xs text-text-light/50 mt-1">
                    {p.categoryTitle} · #{p.postNumber} · {formatSmartTime(p.createdAt)}
                  </p>
                  <p className="text-sm text-text-light/70 mt-2 leading-relaxed">{p.excerpt}</p>
                </Link>
              ))}
            </div>
            <Pagination page={data.page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          </>
        )}
      </RequireAuth>
    </Shell>
  )
}

/* ===== Подписки ===== */
export function SubscriptionsPage() {
  useSEO('Подписки — Форум PfauMC')
  const { user } = useForumAuth()
  const { data, loading, error, reload } = useApiData(user ? '/forum/subscriptions' : null)
  const [busyId, setBusyId] = useState(null)

  const unsubscribe = async (topicId) => {
    setBusyId(topicId)
    try {
      await api(`/forum/topics/${topicId}/subscription`, { method: 'PUT', body: { subscribed: false } })
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Shell title="Подписки" crumb="Подписки">
      <RequireAuth>
        {loading && !data ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data?.topics.length ? (
          <EmptyState icon="🔔" title="Подписок нет" text="Подпишитесь на тему, чтобы получать уведомления о новых ответах." />
        ) : (
          <div className="space-y-3">
            {data.topics.map((t) => (
              <div key={t.id} className="card flex items-center gap-3">
                <UserHead user={t.lastPostAuthor ?? t.author} size={36} link={false} />
                <div className="min-w-0 flex-1">
                  <Link to={`/forum/t/${t.id}`} className="font-medium text-heading hover:text-accent transition-colors truncate block">
                    {t.title}
                    {t.hasUnread && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-accent align-middle" />}
                  </Link>
                  <p className="text-xs text-text-light/50 mt-0.5">
                    {t.categoryTitle} · {formatSmartTime(t.lastPostAt)}
                  </p>
                </div>
                <button
                  onClick={() => unsubscribe(t.id)}
                  disabled={busyId === t.id}
                  className="flex-shrink-0 text-xs py-1.5 px-3 rounded-lg border border-white/10 text-text-light/60 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-50"
                >
                  Отписаться
                </button>
              </div>
            ))}
          </div>
        )}
      </RequireAuth>
    </Shell>
  )
}

/* ===== Настройки ===== */
export function ForumSettingsPage() {
  useSEO('Настройки — Форум PfauMC')
  const { user, setUser, logoutEverywhere } = useForumAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false)

  const update = async (patch) => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const data = await api('/auth/settings', {
        method: 'PATCH',
        body: {
          notifyReplies: user.notify.replies,
          notifyMentions: user.notify.mentions,
          notifySubscriptions: user.notify.subscriptions,
          ...patch,
        },
      })
      setUser(data.user)
      setSaved(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title="Настройки" crumb="Настройки">
      <RequireAuth>
        {user && (
          <div className="space-y-5">
            <div className="card flex items-center gap-4">
              <UserHead user={user} size={56} link={false} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-heading">{user.name}</span>
                  <RoleBadge role={user.role} />
                </div>
                <p className="text-xs text-text-light/50 mt-1">На форуме с {formatSmartTime(user.createdAt)}</p>
              </div>
            </div>

            <section className="card space-y-4">
              <h2 className="font-mono font-semibold text-heading">Уведомления</h2>
              <Toggle
                checked={user.notify.replies}
                onChange={(v) => update({ notifyReplies: v })}
                label="Ответы на мои сообщения"
              />
              <Toggle
                checked={user.notify.mentions}
                onChange={(v) => update({ notifyMentions: v })}
                label="Упоминания через @Ник"
              />
              <Toggle
                checked={user.notify.subscriptions}
                onChange={(v) => update({ notifySubscriptions: v })}
                label="Новые ответы в темах, на которые я подписан"
              />
              {saving && <p className="text-xs text-text-light/50">Сохраняем…</p>}
              {saved && !saving && <p className="text-xs text-green-400">Сохранено</p>}
              <FormError error={error} />
            </section>

            <section className="card space-y-3">
              <h2 className="font-mono font-semibold text-heading">Подписки</h2>
              <p className="text-sm text-text-light/70">Список тем, на которые вы подписаны, — на отдельной странице.</p>
              <Link to="/forum/subscriptions" className="btn-ghost text-sm py-2 px-4 inline-flex">Открыть подписки</Link>
            </section>

            <section className="card space-y-3">
              <h2 className="font-mono font-semibold text-heading">Безопасность</h2>
              <p className="text-sm text-text-light/70">
                Завершите все сессии, если входили с чужого устройства. После этого понадобится новый{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/login</code>.
              </p>
              <button
                onClick={() => setConfirmLogoutAll(true)}
                className="text-sm py-2 px-4 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-500/10 font-semibold transition-colors"
              >
                Завершить все сессии
              </button>
            </section>
          </div>
        )}

        {confirmLogoutAll && (
          <ConfirmDialog
            title="Завершить все сессии?"
            text="Вы выйдете из форума на всех устройствах, включая текущее."
            confirmLabel="Завершить"
            onClose={() => setConfirmLogoutAll(false)}
            onConfirm={async () => {
              await logoutEverywhere()
              setConfirmLogoutAll(false)
            }}
          />
        )}
      </RequireAuth>
    </Shell>
  )
}
