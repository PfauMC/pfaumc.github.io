import { useState } from 'react'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { guideApi, imageUrl, CATEGORIES } from '../../lib/guideApi'
import { formatDateTime } from '../../lib/forumFormat'
import { ListSkeleton, ErrorState, EmptyState, FormError } from '../../components/forum/ui'
import { StatusBadge } from '../cities/CitiesPage'
import ModerationShell from './ModerationShell'

const TABS = [
  { key: 'pending', label: 'На рассмотрении' },
  { key: 'approved', label: 'Одобренные' },
  { key: 'rejected', label: 'Отклонённые' },
]

export default function GuideApplicationsPage() {
  useSEO('Заявки в путеводитель — Модерация PfauMC')
  const { isStaff } = useForumAuth()
  const [status, setStatus] = useState('pending')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const applications = useApiData(isStaff ? `/applications?status=${status}` : null, { fetcher: guideApi })

  const decide = async (item, next) => {
    const reason = next === 'rejected' ? window.prompt('Причина отклонения — игрок её увидит') : null
    if (next === 'rejected' && !reason) return
    setBusyId(item.id)
    setError(null)
    try {
      await guideApi(`/applications/${item.id}`, { method: 'PATCH', body: { status: next, reason } })
      applications.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const list = applications.data?.applications ?? []

  return (
    <ModerationShell>
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === tab.key ? 'bg-accent text-white' : 'text-text-light/70 hover:text-accent hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FormError error={error} />

      {applications.loading && !applications.data ? (
        <ListSkeleton rows={4} />
      ) : applications.error ? (
        <ErrorState onRetry={applications.reload} />
      ) : !list.length ? (
        <EmptyState icon="🗺️" title="Заявок нет" text="В этом разделе пусто." />
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <div key={item.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h2 className="font-mono font-bold text-heading">
                    <span aria-hidden="true">{CATEGORIES[item.category]?.[1]} </span>{item.name}
                  </h2>
                  <p className="text-xs text-text-light/50">
                    {item.applicantName} · {formatDateTime(item.createdAt)} · {CATEGORIES[item.category]?.[0]}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <p className="text-sm text-text-light/80 mb-3 leading-relaxed">{item.description}</p>
              <div className="text-xs text-text-light/60 mb-3 tabular-nums">
                Координаты: X {item.x} {item.y != null && <>· Y {item.y} </>}· Z {item.z}
                {item.ownerName && <> · владелец: {item.ownerName}</>}
              </div>

              {!!item.imageIds?.length && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.imageIds.map((id) => (
                    <a key={id} href={imageUrl(id)} target="_blank" rel="noreferrer" className="block w-32 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-accent/50">
                      <img src={imageUrl(id)} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {item.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary text-sm py-1.5 px-4" onClick={() => decide(item, 'approved')} disabled={busyId === item.id}>Одобрить</button>
                  <button
                    className="text-sm py-1.5 px-4 rounded-lg border border-white/10 text-text-light/70 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-50"
                    onClick={() => decide(item, 'rejected')}
                    disabled={busyId === item.id}
                  >
                    Отклонить
                  </button>
                </div>
              )}
              {item.status === 'rejected' && item.rejectReason && (
                <p className="text-sm text-red-400">Причина: {item.rejectReason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </ModerationShell>
  )
}
