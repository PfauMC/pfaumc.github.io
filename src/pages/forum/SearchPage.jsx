import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { formatSmartTime } from '../../lib/forumFormat'
import { Breadcrumbs, UserHead, RoleBadge, ListSkeleton, ErrorState, EmptyState, Pagination, inputClass } from '../../components/forum/ui'
import ForumSearchBar from '../../components/forum/ForumSearchBar'

export default function SearchPage() {
  useSEO('Поиск по форуму — PfauMC', 'Поиск по темам и сообщениям форума PfauMC.')

  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(params.get('categoryId') || params.get('author') || params.get('from') || params.get('to'))
  )

  const categories = useApiData('/forum/categories')
  const search = useApiData(query.trim().length >= 2 ? `/forum/search?${params.toString()}` : null)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setParams(next)
  }

  const results = search.data?.results ?? []

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Форум', to: '/forum' }, { label: 'Поиск' }]} />

        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-5">Поиск по форуму</h1>

        <ForumSearchBar className="mb-3" initial={query} />

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
              <span className="block text-xs text-text-light/60 mb-1.5">Категория</span>
              <select
                value={params.get('categoryId') ?? ''}
                onChange={(e) => setParam('categoryId', e.target.value)}
                className={inputClass}
              >
                <option value="">Все категории</option>
                {(categories.data?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs text-text-light/60 mb-1.5">Автор (ник)</span>
              <input
                value={params.get('author') ?? ''}
                onChange={(e) => setParam('author', e.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16))}
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

            <label className="flex items-center gap-2.5 text-sm text-text-light cursor-pointer">
              <input
                type="checkbox"
                checked={params.get('titlesOnly') === '1'}
                onChange={(e) => setParam('titlesOnly', e.target.checked ? '1' : '')}
                className="accent-[rgb(var(--c-accent))] w-4 h-4"
              />
              Искать только по заголовкам тем
            </label>

            <label className="block">
              <span className="block text-xs text-text-light/60 mb-1.5">Сортировка</span>
              <select value={params.get('sort') ?? 'relevance'} onChange={(e) => setParam('sort', e.target.value)} className={inputClass}>
                <option value="relevance">По релевантности</option>
                <option value="date">По дате</option>
              </select>
            </label>
          </div>
        )}

        {query.trim().length < 2 ? (
          <EmptyState icon="🔎" title="Введите запрос" text="Минимум два символа. Поиск идёт по заголовкам тем и текстам сообщений." />
        ) : search.loading && !search.data ? (
          <ListSkeleton rows={5} />
        ) : search.error ? (
          <ErrorState message="Не удалось выполнить поиск" onRetry={search.reload} />
        ) : results.length === 0 ? (
          <EmptyState icon="🤔" title="Ничего не найдено" text="Попробуйте изменить запрос или снять фильтры." />
        ) : (
          <>
            <p className="text-sm text-text-light/50 mb-4 tabular-nums">Найдено: {search.data.total}</p>
            <div className="space-y-3">
              {results.map((item) => (
                <Link
                  key={item.postId}
                  to={`/forum/t/${item.topicId}?post=${item.postNumber}`}
                  className="card block group hover:border-accent/25"
                >
                  <div className="flex items-start gap-3">
                    <UserHead user={item.author} size={36} link={false} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-heading group-hover:text-accent transition-colors truncate">
                        {item.topicTitle}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-light/50 mt-1">
                        <span>{item.categoryTitle}</span>
                        <span>·</span>
                        <span>{item.author?.name}</span>
                        <RoleBadge role={item.author?.role} />
                        <span>· {formatSmartTime(item.createdAt)}</span>
                        <span>· #{item.postNumber}</span>
                      </div>
                      <p className="text-sm text-text-light/70 mt-2 leading-relaxed">{item.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination
              page={search.data.page}
              total={search.data.total}
              pageSize={search.data.pageSize}
              onChange={(p) => {
                const next = new URLSearchParams(params)
                next.set('page', String(p))
                setParams(next)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
