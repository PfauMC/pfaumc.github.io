import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatSmartTime, REPORT_REASON_LABELS, MOD_ACTION_LABELS } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Pagination, UserHead, RoleBadge, FormError, inputClass,
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

// Что можно восстановить прямо из журнала: по паре (action, targetType) — эндпоинт
// и человекочитаемое имя того, что вернётся.
const RESTORE_FROM_LOG = {
  'post.delete': { kind: 'posts', label: 'сообщение' },
  'topic.delete': { kind: 'topics', label: 'тему' },
}

export function ModLogPage() {
  useSEO('Журнал модерации — Форум PfauMC')
  const { isModerator } = useForumAuth()
  const [params, setParams] = useSearchParams()
  const page = Number.parseInt(params.get('page') ?? '1', 10) || 1
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(params.get('action') || params.get('nickname') || params.get('from') || params.get('to'))
  )
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const query = new URLSearchParams(params)
  query.set('page', String(page))
  const { data, loading, error, reload } = useApiData(isModerator ? `/forum/moderation-log?${query.toString()}` : null)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setParams(next)
  }

  const restore = async (entry) => {
    const target = RESTORE_FROM_LOG[entry.action]
    if (!target) return
    setBusyId(entry.id)
    setActionError(null)
    try {
      await api(`/forum/${target.kind}/${entry.targetId}/restore`, { method: 'POST' })
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ModShell title="Журнал модерации" crumb="Журнал">
      <input
        value={params.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value.slice(0, 100))}
        placeholder="Поиск по нику, действию, тексту…"
        className={`${inputClass} mb-3`}
      />

      <button
        onClick={() => setFiltersOpen((o) => !o)}
        aria-expanded={filtersOpen}
        className="text-sm text-text-light/60 hover:text-accent transition-colors mb-3"
      >
        {filtersOpen ? '− Фильтры' : '+ Фильтры'}
      </button>

      {filtersOpen && (
        <div className="card mb-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block text-xs text-text-light/60 mb-1.5">Действие</span>
            <select value={params.get('action') ?? ''} onChange={(e) => setParam('action', e.target.value)} className={inputClass}>
              <option value="">Любое</option>
              {Object.entries(MOD_ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-text-light/60 mb-1.5">Ник (модератор или тот, кого коснулось)</span>
            <input
              value={params.get('nickname') ?? ''}
              onChange={(e) => setParam('nickname', e.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16))}
              placeholder="Например, Steve"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="block text-xs text-text-light/60 mb-1.5">С даты</span>
            <input type="date" value={params.get('from') ?? ''} onChange={(e) => setParam('from', e.target.value)} className={inputClass} />
          </label>

          <label className="block">
            <span className="block text-xs text-text-light/60 mb-1.5">По дату</span>
            <input type="date" value={params.get('to') ?? ''} onChange={(e) => setParam('to', e.target.value)} className={inputClass} />
          </label>
        </div>
      )}

      <FormError error={actionError} />

      {loading && !data ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !data?.entries.length ? (
        <EmptyState icon="📋" title="Записей нет" text="Действия модераторов будут появляться здесь." />
      ) : (
        <>
          <div className="space-y-2">
            {data.entries.map((entry) => {
              const canRestore = Boolean(RESTORE_FROM_LOG[entry.action] && entry.targetId)
              return (
                <div key={entry.id} className="card py-3">
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <UserHead user={entry.moderator} size={32} link={false} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-light">
                        <span className="font-mono text-heading">{entry.moderator?.name}</span>{' '}
                        {MOD_ACTION_LABELS[entry.action] ?? entry.action}
                        {entry.details?.authorName && (
                          <> у <span className="font-mono text-heading">{entry.details.authorName}</span></>
                        )}
                        {entry.details?.title && <span className="text-heading"> «{entry.details.title}»</span>}
                        {entry.action === 'player.mute' && entry.details?.duration && (
                          <span className="text-text-light/60"> на {entry.details.duration}</span>
                        )}
                        {entry.details?.reason && <span className="text-heading"> «{entry.details.reason}»</span>}
                      </p>
                      <p className="text-xs text-text-light/40 mt-0.5">{formatSmartTime(entry.createdAt)}</p>
                    </div>
                    {entry.targetType === 'topic' && entry.targetId && (
                      <Link to={`/forum/t/${entry.targetId}`} className="text-xs text-accent hover:underline flex-shrink-0">
                        тема
                      </Link>
                    )}
                    {canRestore && (
                      <button
                        onClick={() => restore(entry)}
                        disabled={busyId === entry.id}
                        className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"
                      >
                        Восстановить
                      </button>
                    )}
                  </div>
                  {entry.action === 'post.delete' && entry.details?.body && (
                    <p className="mt-2 ml-11 text-sm text-text-light/70 leading-relaxed border-l-2 border-white/10 pl-3">
                      {entry.details.body}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <Pagination
            page={data.page}
            total={data.total}
            pageSize={data.pageSize}
            onChange={(p) => {
              const next = new URLSearchParams(params)
              next.set('page', String(p))
              setParams(next)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
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

/* ===== Архив ===== */
export function ArchivePage() {
  useSEO('Архив — Форум PfauMC')
  const { isModerator } = useForumAuth()
  const { data, loading, error, reload } = useApiData(isModerator ? '/forum/archive' : null)
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState(null)

  const unarchive = async (kind, id) => {
    setBusy(`${kind}-${id}`)
    setActionError(null)
    try {
      await api(`/forum/${kind}/${id}/unarchive`, { method: 'POST' })
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(null)
    }
  }

  const empty = !data?.categories.length && !data?.topics.length

  return (
    <ModShell title="Архив" crumb="Архив">
      <FormError error={actionError} />

      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : empty ? (
        <EmptyState icon="📦" title="Архив пуст" text="Заархивированные категории и темы появятся здесь." />
      ) : (
        <div className="space-y-8">
          {data.categories.length > 0 && (
            <section>
              <h2 className="font-mono font-semibold text-heading mb-3">Категории</h2>
              <div className="space-y-2">
                {data.categories.map((c) => (
                  <div key={c.id} className="card py-3 flex items-center gap-3">
                    <span aria-hidden="true" className="text-lg">{c.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-heading truncate">{c.title}</p>
                      <p className="text-xs text-text-light/40">в архиве с {formatSmartTime(c.archivedAt)}</p>
                    </div>
                    <button
                      onClick={() => unarchive('categories', c.id)}
                      disabled={busy === `categories-${c.id}`}
                      className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      Вернуть из архива
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.topics.length > 0 && (
            <section>
              <h2 className="font-mono font-semibold text-heading mb-3">Темы</h2>
              <div className="space-y-2">
                {data.topics.map((t) => (
                  <div key={t.id} className="card py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/forum/t/${t.id}`} className="text-sm text-heading hover:text-accent transition-colors truncate block">
                        {t.title}
                      </Link>
                      <p className="text-xs text-text-light/40">
                        {t.categoryTitle} · в архиве с {formatSmartTime(t.archivedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => unarchive('topics', t.id)}
                      disabled={busy === `topics-${t.id}`}
                      className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      Вернуть из архива
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
