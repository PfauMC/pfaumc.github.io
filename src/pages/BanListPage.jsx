import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { useApiData } from '../hooks/useApiData'
import { useForumAuth } from '../context/ForumAuthContext'
import { gameApi } from '../lib/gameApi'
import { formatExactDateTime } from '../utils/playerFormat'
import { Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Pagination, UserHead, inputClass } from '../components/forum/ui'

const STATUS_LABELS = { active: 'Активен', expired: 'Истёк', lifted: 'Снят' }
const STATUS_STYLE = {
  active: 'text-red-400',
  expired: 'text-text-light/50',
  lifted: 'text-text-light/50',
}

function banExpiry(item) {
  if (item.status !== 'active') return null
  return item.expires_at ? `До ${formatExactDateTime(item.expires_at)}` : 'Навсегда'
}

/** Ждёт паузу в наборе, а не шлёт запрос на каждый символ. */
function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// gameApi ходит с сессией сайта только по явному запросу (withSession) -- бан-лист
// её требует, поэтому не может использовать дефолтный fetcher useApiData (тот шлёт
// анонимные /forum/* запросы через forumApi).
const fetchWithSession = (path, opts) => gameApi(path, { ...opts, withSession: true })

/**
 * `/bans` — бан-лист сайта. Право доступа — точный набор серверных ролей
 * (`helper`/`helper+`/`admin`), проверяется на бэкенде
 * (`Ctx::require_any_role`, GET /api/v1/bans), не порогом can_moderate.
 * `canViewBanlist` здесь — тот же результат, пересчитанный бэкендом на
 * каждый вход (см. GET /forum/auth/me); здесь только вежливое сообщение,
 * если открыть страницу без прав, — не единственная защита.
 */
export default function BanListPage() {
  useSEO('Бан-лист — PfauMC')
  const { user, loading: authLoading, canViewBanlist } = useForumAuth()

  const [query, setQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounced(query)

  useEffect(() => setPage(1), [debouncedQuery, activeOnly])

  const params = new URLSearchParams()
  if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim())
  params.set('active', String(activeOnly))
  params.set('page', String(page))

  const { data, loading, error, reload } = useApiData(canViewBanlist ? `/bans?${params.toString()}` : null, {
    fetcher: fetchWithSession,
  })

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Бан-лист' }]} />
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-6">Бан-лист</h1>

        {authLoading ? (
          <ListSkeleton rows={3} />
        ) : !user || !canViewBanlist ? (
          <EmptyState icon="🚫" title="Доступ только для персонала" text="Этот раздел скрыт от обычных игроков." />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 32))}
                placeholder="Поиск по нику или UUID…"
                className={`${inputClass} flex-1`}
              />
              <div className="flex rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
                {[
                  { key: true, label: 'Активные' },
                  { key: false, label: 'Все' },
                ].map((opt) => (
                  <button
                    key={String(opt.key)}
                    onClick={() => setActiveOnly(opt.key)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeOnly === opt.key ? 'bg-accent text-white' : 'text-text-light/70 hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && !data ? (
              <ListSkeleton rows={6} />
            ) : error ? (
              <ErrorState message="Не удалось загрузить бан-лист" onRetry={reload} />
            ) : !data?.items.length ? (
              <EmptyState
                icon="✅"
                title="Ничего не найдено"
                text={debouncedQuery.trim() ? 'По такому запросу банов нет.' : 'В этом списке пока пусто.'}
              />
            ) : (
              <>
                <div className="space-y-2">
                  {data.items.map((item) => (
                    <div key={item.id} className="card py-3 flex items-center gap-3">
                      <UserHead user={{ uuid: item.gamer_id, name: item.name, skin: item.skin_url ? { url: item.skin_url } : null }} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <Link to={`/u/${encodeURIComponent(item.name ?? item.gamer_id)}`} className="font-mono text-sm text-heading hover:text-accent transition-colors">
                            {item.name ?? item.gamer_id}
                          </Link>
                          <span className={`text-xs ${STATUS_STYLE[item.status] ?? 'text-text-light/50'}`}>
                            {STATUS_LABELS[item.status] ?? item.status}
                          </span>
                          {banExpiry(item) && <span className="text-xs text-text-light/40">· {banExpiry(item)}</span>}
                        </div>
                        {item.reason && <p className="text-sm text-text-light/80 mt-1">{item.reason}</p>}
                        <p className="text-xs text-text-light/40 mt-1">
                          Выдал {item.created_by_name ?? item.created_by} · {formatExactDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={data.page} total={data.total} pageSize={data.page_size} onChange={setPage} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
