import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatSmartTime, REPORT_REASON_LABELS, MOD_ACTION_LABELS } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Pagination, UserHead, RoleBadge, FormError,
} from '../../components/forum/ui'

function ModShell({ title, crumb, children }) {
  const { user, loading, isModerator } = useForumAuth()

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Форум', to: '/forum' }, { label: crumb }]} />
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-6">{title}</h1>
        {loading ? (
          <ListSkeleton rows={3} />
        ) : !user || !isModerator ? (
          <EmptyState icon="🚫" title="Доступ только для модераторов" text="Этот раздел скрыт от обычных игроков." />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

/* ===== Жалобы ===== */
export function ReportsPage() {
  useSEO('Жалобы — Форум PfauMC')
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const { isModerator } = useForumAuth()
  const { data, loading, error, reload } = useApiData(
    isModerator ? `/forum/reports?status=${status}&page=${page}` : null
  )
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const resolve = async (report, nextStatus) => {
    setBusyId(report.id)
    setActionError(null)
    try {
      await api(`/forum/reports/${report.id}`, { method: 'PATCH', body: { status: nextStatus } })
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const tabs = [
    { key: 'open', label: 'Открытые', count: data?.counts?.open },
    { key: 'resolved', label: 'Решённые', count: data?.counts?.resolved },
    { key: 'rejected', label: 'Отклонённые', count: data?.counts?.rejected },
  ]

  return (
    <ModShell title="Жалобы" crumb="Жалобы">
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1) }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === tab.key ? 'bg-accent text-white' : 'text-text-light/70 hover:text-accent hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.count != null && <span className="ml-1.5 opacity-70 tabular-nums">{tab.count}</span>}
          </button>
        ))}
      </div>

      <FormError error={actionError} />

      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !data?.reports.length ? (
        <EmptyState icon="✅" title="Жалоб нет" text="В этом разделе пусто." />
      ) : (
        <>
          <div className="space-y-3">
            {data.reports.map((report) => (
              <div key={report.id} className="card">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-light/50 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 font-medium">
                    {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                  </span>
                  <span>{formatSmartTime(report.createdAt)}</span>
                  {report.postDeleted && <span className="text-red-400">· сообщение удалено</span>}
                </div>

                {report.comment && (
                  <p className="text-sm text-text-light/80 mb-2 italic">«{report.comment}»</p>
                )}

                <Link
                  to={`/forum/t/${report.topicId}?post=${report.postNumber}`}
                  className="block rounded-xl border border-white/10 bg-black/10 p-3 hover:border-accent/30 transition-colors"
                >
                  <p className="text-sm font-medium text-heading truncate">{report.topicTitle} · #{report.postNumber}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <UserHead user={report.postAuthor} size={20} link={false} />
                    <span className="text-xs text-text-light/60">{report.postAuthor?.name}</span>
                    <RoleBadge role={report.postAuthor?.role} />
                  </div>
                  <p className="text-sm text-text-light/70 mt-2 leading-relaxed">{report.excerpt}</p>
                </Link>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs text-text-light/50 mr-auto">
                    Пожаловался: {report.reporter?.name}
                  </span>
                  {status !== 'resolved' && (
                    <button
                      onClick={() => resolve(report, 'resolved')}
                      disabled={busyId === report.id}
                      className="text-xs py-1.5 px-3 rounded-lg border border-white/10 text-text-light/70 hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-50"
                    >
                      Принять меры
                    </button>
                  )}
                  {status !== 'rejected' && (
                    <button
                      onClick={() => resolve(report, 'rejected')}
                      disabled={busyId === report.id}
                      className="text-xs py-1.5 px-3 rounded-lg border border-white/10 text-text-light/70 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-50"
                    >
                      Отклонить
                    </button>
                  )}
                  {status !== 'open' && (
                    <button
                      onClick={() => resolve(report, 'open')}
                      disabled={busyId === report.id}
                      className="text-xs py-1.5 px-3 rounded-lg border border-white/10 text-text-light/70 hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-50"
                    >
                      Вернуть в работу
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.page} total={data.counts?.[status] ?? 0} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
    </ModShell>
  )
}

/* ===== Журнал модерации ===== */
export function ModLogPage() {
  useSEO('Журнал модерации — Форум PfauMC')
  const { isModerator } = useForumAuth()
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useApiData(isModerator ? `/forum/moderation-log?page=${page}` : null)

  return (
    <ModShell title="Журнал модерации" crumb="Журнал">
      {loading && !data ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !data?.entries.length ? (
        <EmptyState icon="📋" title="Записей нет" text="Действия модераторов будут появляться здесь." />
      ) : (
        <>
          <div className="space-y-2">
            {data.entries.map((entry) => (
              <div key={entry.id} className="card py-3 flex items-start gap-3">
                <UserHead user={entry.moderator} size={32} link={false} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-light">
                    <span className="font-mono text-heading">{entry.moderator?.name}</span>{' '}
                    {MOD_ACTION_LABELS[entry.action] ?? entry.action}
                    {entry.details?.title && <span className="text-heading"> «{entry.details.title}»</span>}
                  </p>
                  <p className="text-xs text-text-light/40 mt-0.5">{formatSmartTime(entry.createdAt)}</p>
                </div>
                {entry.targetType === 'topic' && entry.targetId && (
                  <Link to={`/forum/t/${entry.targetId}`} className="text-xs text-accent hover:underline flex-shrink-0">
                    тема
                  </Link>
                )}
              </div>
            ))}
          </div>
          <Pagination page={data.page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
    </ModShell>
  )
}

/* ===== Корзина ===== */
export function TrashPage() {
  useSEO('Корзина — Форум PfauMC')
  const { isModerator } = useForumAuth()
  const categories = useApiData(isModerator ? '/forum/categories/deleted' : null)
  const topics = useApiData(isModerator ? '/forum/topics/deleted' : null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const restore = async (kind, id, reload) => {
    setBusy(`${kind}-${id}`)
    setError(null)
    try {
      await api(`/forum/${kind}/${id}/restore`, { method: 'POST' })
      reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  const empty = !categories.data?.categories.length && !topics.data?.topics.length

  return (
    <ModShell title="Корзина" crumb="Корзина">
      <FormError error={error} />

      {categories.loading || topics.loading ? (
        <ListSkeleton rows={4} />
      ) : empty ? (
        <EmptyState icon="🗑️" title="Корзина пуста" text="Удалённые категории и темы появятся здесь." />
      ) : (
        <div className="space-y-8">
          {categories.data?.categories.length > 0 && (
            <section>
              <h2 className="font-mono font-semibold text-heading mb-3">Категории</h2>
              <div className="space-y-2">
                {categories.data.categories.map((c) => (
                  <div key={c.id} className="card py-3 flex items-center gap-3">
                    <span aria-hidden="true" className="text-lg">{c.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-heading truncate">{c.title}</p>
                      <p className="text-xs text-text-light/40">удалена {formatSmartTime(c.deletedAt)}</p>
                    </div>
                    <button
                      onClick={() => restore('categories', c.id, categories.reload)}
                      disabled={busy === `categories-${c.id}`}
                      className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      Восстановить
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topics.data?.topics.length > 0 && (
            <section>
              <h2 className="font-mono font-semibold text-heading mb-3">Темы</h2>
              <div className="space-y-2">
                {topics.data.topics.map((t) => (
                  <div key={t.id} className="card py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/forum/t/${t.id}`} className="text-sm text-heading hover:text-accent transition-colors truncate block">
                        {t.title}
                      </Link>
                      <p className="text-xs text-text-light/40">
                        {t.categoryTitle} · удалена {formatSmartTime(t.deletedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => restore('topics', t.id, topics.reload)}
                      disabled={busy === `topics-${t.id}`}
                      className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      Восстановить
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </ModShell>
  )
}
