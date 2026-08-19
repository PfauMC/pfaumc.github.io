import { useState } from 'react'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { citiesApi } from '../../lib/citiesApi'
import { formatDateTime } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Pagination, Modal, FormError,
} from '../../components/forum/ui'
import { StatusBadge } from './CitiesPage'

export default function CityApplicationsPage() {
  useSEO('Заявки на города — Форум PfauMC')
  const { user, loading: authLoading, isModerator } = useForumAuth()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [rejecting, setRejecting] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const { data, loading, error, reload } = useApiData(
    isModerator ? `/applications?status=${status}&page=${page}` : null,
    { fetcher: citiesApi }
  )

  const approve = async (application) => {
    setBusyId(application.id)
    setActionError(null)
    try {
      await citiesApi(`/applications/${application.id}`, {
        method: 'PATCH',
        body: { status: 'approved', confirmBuildings: true },
      })
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (application, reason) => {
    setBusyId(application.id)
    setActionError(null)
    try {
      await citiesApi(`/applications/${application.id}`, { method: 'PATCH', body: { status: 'rejected', reason } })
      setRejecting(null)
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const tabs = [
    { key: 'pending', label: 'На рассмотрении', count: data?.counts?.pending },
    { key: 'approved', label: 'Одобренные', count: data?.counts?.approved },
    { key: 'rejected', label: 'Отклонённые', count: data?.counts?.rejected },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Города', to: '/cities' }, { label: 'Заявки' }]} />
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-6">Заявки на города</h1>

        {authLoading ? (
          <ListSkeleton rows={3} />
        ) : !user || !isModerator ? (
          <EmptyState icon="🚫" title="Доступ только для хелперов и выше" text="Этот раздел скрыт от обычных игроков." />
        ) : (
          <>
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
            ) : !data?.applications.length ? (
              <EmptyState icon="🏙️" title="Заявок нет" text="В этом разделе пусто." />
            ) : (
              <>
                <div className="space-y-4">
                  {data.applications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      busy={busyId === application.id}
                      onApprove={() => approve(application)}
                      onReject={() => setRejecting(application)}
                    />
                  ))}
                </div>
                <Pagination page={data.page} total={data.counts?.[status] ?? 0} pageSize={data.pageSize} onChange={setPage} />
              </>
            )}
          </>
        )}
      </div>

      {rejecting && (
        <RejectDialog
          application={rejecting}
          busy={busyId === rejecting.id}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => reject(rejecting, reason)}
        />
      )}
    </div>
  )
}

function ChecklistItem({ ok, children }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-green-400' : 'text-red-400'}`}>
      <span aria-hidden="true">{ok ? '✓' : '✗'}</span>
      {children}
    </li>
  )
}

function ApplicationCard({ application, busy, onApprove, onReject }) {
  const c = application.checklist
  const days = c ? Math.floor(c.playtimeSeconds / 86400) : null
  const autoOk = c && c.notMayorOk && c.spawnOk && c.nearestOk
  const [buildingsConfirmed, setBuildingsConfirmed] = useState(false)

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <h2 className="font-mono font-bold text-heading">{application.name}</h2>
          <p className="text-xs text-text-light/50">
            {application.applicant?.name} · {formatDateTime(application.createdAt)}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <p className="text-sm text-text-light/80 mb-3 leading-relaxed">{application.description}</p>

      <div className="text-xs text-text-light/60 mb-3 tabular-nums">
        Координаты: X {application.x} {application.y != null && <>· Y {application.y} </>}· Z {application.z}
      </div>

      {application.comment && (
        <p className="text-sm text-text-light/70 mb-3 italic">«{application.comment}»</p>
      )}

      {c && (
        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3 p-3 rounded-xl bg-black/10 border border-white/5">
          <ChecklistItem ok={c.playtimeOk}>Глава играет больше 7 дней ({days} дн.) — проверить вручную</ChecklistItem>
          <ChecklistItem ok={c.notMayorOk}>Ещё не глава другого города</ChecklistItem>
          <ChecklistItem ok={buildingsConfirmed}>Больше 5 построек — проверить в игре</ChecklistItem>
          <ChecklistItem ok={c.spawnOk}>От спавна {Math.round(c.spawnDistance)} блоков (нужно ≥1000)</ChecklistItem>
          <ChecklistItem ok={c.nearestOk}>
            {c.nearestCity
              ? `До «${c.nearestCity.name}» ${Math.round(c.nearestCity.distance)} блоков (нужно ≥300)`
              : 'Ближайших городов нет'}
          </ChecklistItem>
        </ul>
      )}

      {application.status === 'pending' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-light/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={buildingsConfirmed}
              onChange={(e) => setBuildingsConfirmed(e.target.checked)}
              className="w-4 h-4 rounded accent-accent"
            />
            Проверил(а) в игре: построек больше 5
          </label>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={onApprove}
              disabled={busy || !autoOk || !buildingsConfirmed}
              title={!autoOk ? 'Автоматические проверки не пройдены' : !buildingsConfirmed ? 'Подтвердите постройки' : undefined}
              className="btn-primary text-sm py-1.5 px-4 disabled:opacity-40 disabled:pointer-events-none"
            >
              Одобрить
            </button>
            <button
              onClick={onReject}
              disabled={busy}
              className="text-sm py-1.5 px-4 rounded-lg border border-white/10 text-text-light/70 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-50"
            >
              Отклонить
            </button>
          </div>
        </div>
      )}

      {application.status === 'rejected' && application.rejectReason && (
        <p className="text-sm text-red-400">Причина: {application.rejectReason}</p>
      )}

      {application.status === 'approved' && application.reviewer && (
        <p className="text-xs text-text-light/50">Одобрил: {application.reviewer.name}</p>
      )}
    </div>
  )
}

function RejectDialog({ application, busy, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <Modal
      title={`Отклонить заявку «${application.name}»?`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>Отмена</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy || reason.trim().length === 0}
            className="text-sm py-2 px-4 rounded-lg font-semibold text-white bg-red-500/90 hover:bg-red-500 disabled:opacity-60 transition-colors"
          >
            {busy ? 'Отклоняем…' : 'Отклонить'}
          </button>
        </>
      }
    >
      <label className="block">
        <span className="block text-sm text-text-light/70 mb-1.5">Причина отклонения — игрок её увидит</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          rows={3}
          autoFocus
          className="w-full bg-bg-section border border-white/10 rounded-xl px-3 py-2 text-sm text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors resize-y"
        />
      </label>
    </Modal>
  )
}
