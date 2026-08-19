import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { citiesApi } from '../../lib/citiesApi'
import { formatDateTime } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Modal, Field, inputClass, FormError, LoginNotice,
} from '../../components/forum/ui'

const STATUS_LABELS = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
}

export default function CitiesPage() {
  useSEO('Города — PfauMC', 'Города игроков на сервере PfauMC: список городов и заявки на создание.')
  const { user, loading: authLoading } = useForumAuth()
  const [applying, setApplying] = useState(false)

  const cities = useApiData('', { fetcher: citiesApi })
  const mine = useApiData(user ? '/mine' : null, { fetcher: citiesApi })
  const applications = useApiData(user ? '/applications/mine' : null, { fetcher: citiesApi })

  const pendingApplication = applications.data?.applications.find((a) => a.status === 'pending')
  const lastApplication = applications.data?.applications[0]

  const reloadMine = () => { mine.reload(); applications.reload() }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Города' }]} />

        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-2">Города</h1>
            <p className="text-text-light text-base max-w-2xl">
              Города, которые построили и зарегистрировали сами игроки — у каждого свой глава, жители и форум.
            </p>
          </div>
        </header>

        {!authLoading && (
          <div className="mb-6">
            {!user ? (
              <LoginNotice text="Чтобы подать заявку на создание города, нужно войти." />
            ) : mine.data?.city ? (
              <div className="card border-accent/20 bg-accent/5 flex flex-wrap items-center gap-3">
                <span className="text-2xl" aria-hidden="true">🏙️</span>
                <p className="text-sm text-text-light">
                  Вы {mine.data.city.isMayor ? 'глава' : 'житель'} города{' '}
                  <Link to={`/cities/${mine.data.city.slug}`} className="text-heading font-semibold hover:text-accent transition-colors">
                    {mine.data.city.name}
                  </Link>
                </p>
              </div>
            ) : pendingApplication ? (
              <ApplicationStatusCard application={pendingApplication} />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setApplying(true)} className="btn-primary text-sm py-2 px-4">
                  Подать заявку на создание города
                </button>
                {lastApplication?.status === 'rejected' && (
                  <ApplicationStatusCard application={lastApplication} compact />
                )}
              </div>
            )}
          </div>
        )}

        {cities.loading && !cities.data ? (
          <ListSkeleton rows={4} />
        ) : cities.error ? (
          <ErrorState message="Не удалось загрузить города" onRetry={cities.reload} />
        ) : !cities.data?.cities.length ? (
          <EmptyState icon="🏙️" title="Городов пока нет" text="Станьте первым, кто зарегистрирует свой город." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {cities.data.cities.map((city) => (
              <Link
                key={city.id}
                to={`/cities/${city.slug}`}
                className="card hover:border-accent/30 transition-colors block"
              >
                <h2 className="font-mono font-bold text-heading text-lg mb-1">{city.name}</h2>
                {city.description && (
                  <p className="text-text-light/70 text-sm mb-3 line-clamp-2">{city.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-light/50">
                  {city.mayor && <span>Глава: {city.mayor.name}</span>}
                  <span>Жителей: {city.residentCount}</span>
                  <span className="tabular-nums">X {city.x} · Z {city.z}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {applying && (
        <ApplicationForm
          onClose={() => setApplying(false)}
          onSubmitted={() => { setApplying(false); reloadMine() }}
        />
      )}
    </div>
  )
}

function ApplicationStatusCard({ application, compact = false }) {
  return (
    <div className={`card ${compact ? 'py-3' : ''} ${application.status === 'rejected' ? 'border-red-500/20' : 'border-accent/20 bg-accent/5'}`}>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-heading font-semibold">Заявка «{application.name}»</span>
        <StatusBadge status={application.status} />
      </div>
      <p className="text-xs text-text-light/50">Подана {formatDateTime(application.createdAt)}</p>
      {application.status === 'rejected' && application.rejectReason && (
        <p className="text-sm text-red-400 mt-2">Причина отказа: {application.rejectReason}</p>
      )}
    </div>
  )
}

export function StatusBadge({ status }) {
  const cls = {
    pending: 'bg-white/10 text-text-light/70',
    approved: 'bg-green-500/15 text-green-400',
    rejected: 'bg-red-500/15 text-red-400',
  }[status]
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function ApplicationForm({ onClose, onSubmitted }) {
  const [form, setForm] = useState({ name: '', description: '', x: '', z: '', y: '', comment: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await citiesApi('/applications', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description,
          x: Number.parseInt(form.x, 10),
          z: Number.parseInt(form.z, 10),
          y: form.y.trim() ? Number.parseInt(form.y, 10) : null,
          comment: form.comment.trim() || null,
        },
      })
      onSubmitted()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const xOk = form.x.trim() !== '' && Number.isFinite(Number(form.x))
  const zOk = form.z.trim() !== '' && Number.isFinite(Number(form.z))
  const canSubmit = form.name.trim().length >= 3 && form.description.trim().length >= 10 && xOk && zOk

  return (
    <Modal
      title="Заявка на создание города"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>Отмена</button>
          <button onClick={submit} className="btn-primary text-sm py-2 px-4" disabled={busy || !canSubmit}>
            {busy ? 'Отправляем…' : 'Отправить заявку'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Название города">
          <input
            value={form.name}
            onChange={(e) => set({ name: e.target.value.slice(0, 60) })}
            placeholder="Например, «Новоград»"
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field label="Краткое описание">
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value.slice(0, 1000) })}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="X">
            <input
              type="number"
              value={form.x}
              onChange={(e) => set({ x: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Y (необязательно)">
            <input
              type="number"
              value={form.y}
              onChange={(e) => set({ y: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Z">
            <input
              type="number"
              value={form.z}
              onChange={(e) => set({ z: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Дополнительный комментарий (необязательно)">
          <textarea
            value={form.comment}
            onChange={(e) => set({ comment: e.target.value.slice(0, 500) })}
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <p className="text-xs text-text-light/50 leading-relaxed">
          Перед отправкой сервер проверит: что вы ещё не глава другого города, расстояние от спавна
          (от 1000 блоков) и до ближайшего города (от 300 блоков). Игровое время и наличие построек
          в городе проверит хелпер вручную.
        </p>

        <FormError error={error} />
      </div>
    </Modal>
  )
}
