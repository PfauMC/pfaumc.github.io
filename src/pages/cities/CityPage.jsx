import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { usePlayerSearch } from '../../hooks/usePlayerSearch'
import { useForumAuth } from '../../context/ForumAuthContext'
import { citiesApi } from '../../lib/citiesApi'
import { formatDateTime } from '../../lib/forumFormat'
import { Breadcrumbs, ListSkeleton, ErrorState, UserHead, FormError, ConfirmDialog } from '../../components/forum/ui'

export default function CityPage() {
  const { slug } = useParams()
  const { user } = useForumAuth()
  const city = useApiData(`/${encodeURIComponent(slug)}`, { fetcher: citiesApi })
  const info = city.data?.city

  useSEO(info ? `${info.name} — города PfauMC` : 'Город — PfauMC', info?.description || undefined)

  const isMayor = Boolean(user && info?.mayor?.id === user.uuid)

  if (city.loading && !city.data) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ListSkeleton rows={4} />
        </div>
      </div>
    )
  }

  if (city.error || !info) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ErrorState
            message={city.error?.status === 404 ? 'Город не найден' : 'Не удалось загрузить город'}
            onRetry={city.error?.status === 404 ? null : city.reload}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Города', to: '/cities' }, { label: info.name }]} />

        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-1">{info.name}</h1>
              <p className="text-xs text-text-light/50">Основан {formatDateTime(info.createdAt)}</p>
            </div>
            {info.forumCategorySlug && (
              <Link to={`/forum/c/${info.forumCategorySlug}`} className="btn-ghost text-sm py-2 px-4 flex-shrink-0">
                Форум города
              </Link>
            )}
          </div>

          {info.description && <p className="text-text-light mt-4 leading-relaxed">{info.description}</p>}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-sm">
            <div>
              <span className="text-text-light/50">Координаты: </span>
              <span className="text-heading tabular-nums">
                X {info.x} {info.y != null && <>· Y {info.y} </>}· Z {info.z}
              </span>
            </div>
            {info.mayor && (
              <div className="flex items-center gap-2">
                <span className="text-text-light/50">Глава:</span>
                <UserHead user={{ name: info.mayor.name, uuid: info.mayor.id }} size={24} />
                <Link to={`/u/${encodeURIComponent(info.mayor.name)}`} className="text-heading hover:text-accent transition-colors">
                  {info.mayor.name}
                </Link>
              </div>
            )}
          </div>
        </div>

        <ResidentsSection city={info} isMayor={isMayor} onChanged={city.reload} />
      </div>
    </div>
  )
}

function ResidentsSection({ city, isMayor, onChanged }) {
  const [managing, setManaging] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const remove = async (residentId) => {
    setBusy(true)
    setError(null)
    try {
      await citiesApi(`/${city.slug}/residents/${residentId}`, { method: 'DELETE' })
      setConfirm(null)
      onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-mono font-bold text-heading">Жители ({city.residents.length})</h2>
        {isMayor && (
          <button onClick={() => setManaging((v) => !v)} className="btn-ghost text-xs py-1.5 px-3">
            {managing ? 'Готово' : 'Управлять'}
          </button>
        )}
      </div>

      <FormError error={error} />

      <div className="space-y-2 mb-4">
        {city.residents.map((resident) => (
          <div key={resident.id} className="flex items-center gap-3 py-1.5">
            <UserHead user={{ name: resident.name, uuid: resident.id }} size={32} />
            <Link to={`/u/${encodeURIComponent(resident.name)}`} className="text-sm text-heading hover:text-accent transition-colors flex-1 min-w-0 truncate">
              {resident.name}
            </Link>
            {resident.id === city.mayor?.id && (
              <span className="text-[11px] text-accent font-medium flex-shrink-0">глава</span>
            )}
            {managing && resident.id !== city.mayor?.id && (
              <button
                onClick={() => setConfirm(resident)}
                className="text-xs text-text-light/50 hover:text-red-400 transition-colors flex-shrink-0"
              >
                Исключить
              </button>
            )}
          </div>
        ))}
      </div>

      {managing && <AddResidentForm citySlug={city.slug} onAdded={onChanged} />}

      {confirm && (
        <ConfirmDialog
          title="Исключить жителя?"
          text={`«${confirm.name}» потеряет право писать на форуме города и город пропадёт из профиля.`}
          confirmLabel="Исключить"
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => remove(confirm.id)}
        />
      )}
    </div>
  )
}

function AddResidentForm({ citySlug, onAdded }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { results, loading } = usePlayerSearch(query)

  const add = async (name) => {
    setBusy(true)
    setError(null)
    try {
      await citiesApi(`/${citySlug}/residents`, { method: 'POST', body: { name } })
      setQuery('')
      onAdded()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pt-4 border-t border-white/5">
      <label className="block text-sm text-text-light/70 mb-1.5">Добавить жителя по нику</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ник игрока"
        disabled={busy}
        className="w-full bg-bg-section border border-white/10 rounded-xl px-3 py-2 text-sm text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
      />
      {query.trim().length >= 2 && (
        <div className="mt-2 space-y-1">
          {loading ? (
            <p className="text-xs text-text-light/40">Ищем…</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-text-light/40">Никого не найдено</p>
          ) : (
            results.slice(0, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => add(r.name)}
                disabled={busy}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left disabled:opacity-50"
              >
                <UserHead user={{ name: r.name, uuid: r.id, skin: r.skin }} size={24} />
                <span className="text-sm text-heading">{r.name}</span>
              </button>
            ))
          )}
        </div>
      )}
      <FormError error={error} />
    </div>
  )
}
