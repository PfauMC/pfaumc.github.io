import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import {
  formatCount, formatSmartTime, COUNT_REPLIES, COUNT_VIEWS,
} from '../../lib/forumFormat'
import {
  Breadcrumbs, UserHead, ListSkeleton, ErrorState, EmptyState, Pagination,
} from '../../components/forum/ui'
import TopicForm from '../../components/forum/TopicForm'

const SORTS = [
  { key: 'recent', label: 'По последнему ответу' },
  { key: 'new', label: 'По дате создания' },
  { key: 'replies', label: 'По числу ответов' },
  { key: 'views', label: 'По просмотрам' },
]

export default function CategoryPage() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const { isModerator } = useForumAuth()
  const [creating, setCreating] = useState(false)

  const page = Number.parseInt(params.get('page') ?? '1', 10) || 1
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'recent'

  const category = useApiData(`/forum/categories/${encodeURIComponent(slug)}`)
  const topics = useApiData(`/forum/categories/${encodeURIComponent(slug)}/topics?page=${page}&sort=${sort}`)

  const info = category.data?.category
  useSEO(info ? `${info.title} — Форум PfauMC` : 'Форум PfauMC', info?.description || undefined)

  const setParam = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, String(v))))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (category.error) {
    return (
      <PageShell>
        <ErrorState
          message={category.error.status === 404 ? 'Категория не найдена' : 'Не удалось загрузить категорию'}
          onRetry={category.error.status === 404 ? null : category.reload}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'Форум', to: '/forum' }, { label: info?.title ?? 'Категория' }]}
      />

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading flex items-center gap-2.5">
            {info && <span aria-hidden="true">{info.icon}</span>}
            <span className="min-w-0">{info?.title ?? 'Загрузка…'}</span>
          </h1>
          {info?.description && <p className="text-text-light mt-1.5">{info.description}</p>}
          {info && !info.isActive && (
            <p className="text-text-light/50 text-sm mt-1.5">Категория закрыта для новых сообщений.</p>
          )}
        </div>

        {isModerator && info && (
          <button onClick={() => setCreating(true)} className="btn-primary text-sm py-2 px-4 flex-shrink-0">
            + Тема
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-text-light/60">
          Сортировка
          <select
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value, page: null })}
            className="bg-bg-card border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-heading focus:outline-none focus:border-accent/50 transition-colors"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
        {topics.data && (
          <span className="text-sm text-text-light/40 ml-auto tabular-nums">
            Всего тем: {topics.data.total}
          </span>
        )}
      </div>

      {topics.loading && !topics.data ? (
        <ListSkeleton rows={6} />
      ) : topics.error ? (
        <ErrorState message="Не удалось загрузить темы" onRetry={topics.reload} />
      ) : topics.data.topics.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Тем пока нет"
          text={isModerator ? 'Создайте первую тему в этой категории.' : 'В этой категории ещё ничего не обсуждали.'}
          action={isModerator ? <button onClick={() => setCreating(true)} className="btn-primary text-sm py-2 px-4">Создать тему</button> : null}
        />
      ) : (
        <>
          <div className="space-y-2.5">
            {topics.data.topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} />
            ))}
          </div>
          <Pagination
            page={topics.data.page}
            total={topics.data.total}
            pageSize={topics.data.pageSize}
            onChange={(p) => setParam({ page: p })}
          />
        </>
      )}

      {creating && info && (
        <TopicForm
          categoryId={info.id}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); topics.reload() }}
        />
      )}
    </PageShell>
  )
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">{children}</div>
    </div>
  )
}

function TopicRow({ topic }) {
  return (
    <div className={`card p-0 overflow-hidden group hover:border-accent/25 ${topic.isDeleted ? 'opacity-60 border-red-500/30' : ''}`}>
      <div className="flex flex-col sm:flex-row">
        <Link to={`/forum/t/${topic.id}`} className="flex-1 min-w-0 flex items-start gap-3 p-4 hover:bg-accent/[0.03] transition-colors">
          <UserHead user={topic.author} size={36} link={false} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {topic.isPinned && <StatusIcon title="Закреплена">📌</StatusIcon>}
              {topic.isLocked && <StatusIcon title="Закрыта">🔒</StatusIcon>}
              {topic.isDeleted && <StatusIcon title="Удалена">🗑️</StatusIcon>}
              <h3 className={`font-medium truncate group-hover:text-accent transition-colors ${topic.hasUnread ? 'text-heading font-semibold' : 'text-heading/90'}`}>
                {topic.title}
              </h3>
              {topic.hasUnread && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" aria-label="Есть новые сообщения" />}
            </div>

            <p className="text-xs text-text-light/50 mt-1">
              {topic.author?.name} · {formatSmartTime(topic.createdAt)}
            </p>

            <p className="text-xs text-text-light/40 mt-1.5 sm:hidden tabular-nums">
              {formatCount(topic.replyCount, COUNT_REPLIES)} · {formatCount(topic.views, COUNT_VIEWS)}
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-0.5 text-xs text-text-light/50 flex-shrink-0 tabular-nums">
            <span>{formatCount(topic.replyCount, COUNT_REPLIES)}</span>
            <span>{formatCount(topic.views, COUNT_VIEWS)}</span>
          </div>
        </Link>

        <div className="sm:w-48 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 p-4">
          {topic.lastPostAuthor ? (
            <div className="flex items-center gap-2.5">
              <UserHead user={topic.lastPostAuthor} size={28} />
              <div className="min-w-0">
                <p className="text-xs text-heading truncate">{topic.lastPostAuthor.name}</p>
                <p className="text-[11px] text-text-light/50">{formatSmartTime(topic.lastPostAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-light/40">Ответов нет</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ children, title }) {
  return (
    <span title={title} aria-label={title} className="text-xs flex-shrink-0">
      {children}
    </span>
  )
}
