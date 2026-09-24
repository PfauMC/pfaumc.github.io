import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ImagePicker from '../components/ImagePicker'
import SquaremapGuideMap from '../components/SquaremapGuideMap'
import { Modal, Field, FormError, LoginNotice, inputClass } from '../components/forum/ui'
import { useForumAuth } from '../context/ForumAuthContext'
import { useApiData } from '../hooks/useApiData'
import { useSEO } from '../hooks/useSEO'
import { guideApi, imageUrl, CATEGORIES } from '../lib/guideApi'


// Города на карту попадают сами — предложить можно всё, кроме них.
const PROPOSABLE = Object.entries(CATEGORIES).filter(([key]) => key !== 'city')

const firstImage = (place) => place.imageIds?.[0] && imageUrl(place.imageIds[0])

const cover = (category, image) => ({
  '--place-color': (CATEGORIES[category] ?? CATEGORIES.other)[2],
  ...(image && { backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }),
})

export default function GuidePage() {
  useSEO('Путеводитель по миру — PfauMC', 'Карта интересных мест, городов, магазинов и построек сервера PfauMC.')
  const { user, isModerator } = useForumAuth()
  const placesRequest = useApiData('/places', { fetcher: guideApi })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(null)
  // На телефоне список -- шторка поверх карты, открытым он закрыл бы её целиком.
  const [listOpen, setListOpen] = useState(() => window.innerWidth >= 760)
  const [applying, setApplying] = useState(false)
  const [notice, setNotice] = useState(null)

  const allPlaces = placesRequest.data?.places ?? []
  const places = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru')
    return allPlaces.filter((place) =>
      (category === 'all' || place.category === category)
      && (!needle || `${place.name} ${place.description} ${CATEGORIES[place.category]?.[0] ?? ''}`.toLocaleLowerCase('ru').includes(needle))
    )
  }, [allPlaces, category, query])

  const choose = useCallback((place) => {
    setSelected(place)
    if (window.innerWidth < 760) setListOpen(false)
  }, [])

  return (
    <main className="guide-shell">
      <section className={`guide-panel ${listOpen ? 'is-open' : ''}`} aria-label="Каталог мест">
        <button className="guide-sheet-handle" onClick={() => setListOpen(false)} aria-label="Скрыть список" />
        <header className="guide-heading">
          <p className="guide-kicker">ПУТЕВОДИТЕЛЬ ПО МИРУ</p>
          <h1>Куда отправимся?</h1>
          <p>Места, ради которых стоит выйти со спавна.</p>
        </header>

        <label className="guide-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Место или категория" aria-label="Поиск мест" />
          {query && <button onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>}
        </label>

        <div className="guide-filters scrollbar-none" aria-label="Категории">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Все</button>
          {Object.entries(CATEGORIES).map(([key, [label]]) => (
            <button key={key} className={category === key ? 'active' : ''} onClick={() => setCategory(key)}>{label}</button>
          ))}
        </div>

        <div className="guide-list scrollbar-none">
          <div className="guide-list-title">
            <span>{placesRequest.loading ? 'Загружаем…' : places.length ? 'Рекомендуем' : 'Мест пока нет'}</span>
            <small>{places.length}</small>
          </div>
          {placesRequest.error && (
            <div className="guide-inline-state"><span>Не удалось загрузить каталог</span><button onClick={placesRequest.reload}>Повторить</button></div>
          )}
          {places.map((place) => (
            <PlaceRow key={place.id} place={place} active={selected?.id === place.id} onClick={() => choose(place)} />
          ))}
        </div>

        {notice && <button className="guide-notice" onClick={() => setNotice(null)}>{notice}</button>}
        <div className="guide-panel-actions">
          <button className="guide-add" onClick={() => setApplying(true)}>＋ Предложить место</button>
        </div>
      </section>

      <section className="guide-map" aria-label="Карта мира PfauMC">
        <SquaremapGuideMap places={places} selected={selected} onSelect={choose} showRegions={['admin', 'owner'].includes(user?.role?.key)} />
        <div className="guide-map-shade" />
        <div className="guide-map-brand"><i /> PFAUMC · МИР</div>
        <button className="guide-list-toggle" onClick={() => setListOpen((open) => !open)}>{listOpen ? 'Скрыть список' : 'Показать места'}</button>
        {selected && (
          <PlaceDetail
            key={selected.id}
            place={selected}
            user={user}
            isModerator={isModerator}
            onClose={() => setSelected(null)}
            onUpdated={placesRequest.reload}
            onDeleted={() => { setSelected(null); placesRequest.reload() }}
          />
        )}
      </section>

      {applying && (user
        ? <ApplicationForm onClose={() => setApplying(false)} onSubmitted={() => { setApplying(false); setNotice('Заявка отправлена — место появится на карте после проверки стаффом.') }} />
        : <Modal title="Предложить место" onClose={() => setApplying(false)}><LoginNotice text="Чтобы предложить место, нужно войти." /></Modal>
      )}
    </main>
  )
}

function PlaceRow({ place, active, onClick }) {
  const [label, icon] = CATEGORIES[place.category] ?? CATEGORIES.other
  const image = firstImage(place)
  return (
    <button className={`place-row ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="place-thumb" style={cover(place.category, image)} aria-hidden="true">{!image && icon}</span>
      <span className="place-copy">
        {place.featured && <small className="place-sponsored">РЕКОМЕНДУЕМ</small>}
        <strong>{place.name}</strong><span>{label}</span>
        <span className="place-meta"><b>★ {place.rating ? place.rating.toFixed(1) : '—'}</b> · {place.reviewCount} отзывов</span>
      </span>
      <span className="place-arrow" aria-hidden="true">›</span>
    </button>
  )
}

function PlaceDetail({ place, user, isModerator, onClose, onUpdated, onDeleted }) {
  const path = `/places/${encodeURIComponent(place.slug)}`
  const details = useApiData(path, { fetcher: guideApi })
  const [rating, setRating] = useState('5')
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [prefilled, setPrefilled] = useState(false)
  const [shown, setShown] = useState(0)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const mine = details.data?.myReview
  if (mine && !prefilled) {
    setPrefilled(true)
    setRating(String(mine.rating))
    setBody(mine.body)
    setAnonymous(mine.anonymous)
  }
  const full = details.data?.place ?? place
  const images = full.imageIds ?? []
  const image = images[shown] ? imageUrl(images[shown]) : null
  const [, icon] = CATEGORIES[full.category] ?? CATEGORIES.other

  const run = async (request, done) => {
    setBusy(true); setError(null)
    try {
      await request()
      done()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const refresh = () => { details.reload(); onUpdated() }
  const submitReview = () => run(() => guideApi(`${path}/review`, { method: 'PUT', body: { rating: Number(rating), body, anonymous } }), refresh)
  const deleteReview = (review) => window.confirm('Удалить отзыв?')
    && run(() => guideApi(`${path}/reviews/${review.author.id}`, { method: 'DELETE' }), () => {
      if (review.mine) { setPrefilled(true); setRating('5'); setBody(''); setAnonymous(false) }
      refresh()
    })
  const toggleFeatured = () => run(() => guideApi(path, { method: 'PATCH', body: { featured: !full.featured } }), refresh)
  const remove = () => window.confirm(`Удалить «${full.name}» из путеводителя?`) && run(() => guideApi(path, { method: 'DELETE' }), onDeleted)

  return (
    <article className="place-detail">
      <button className="place-detail-close" onClick={onClose} aria-label="Закрыть карточку">×</button>
      <a className="place-detail-cover" style={cover(full.category, image)} href={image ?? undefined} target="_blank" rel="noreferrer">
        {!image && <span>{icon}</span>}<small>{CATEGORIES[full.category]?.[0]}</small>
      </a>
      {images.length > 1 && (
        <div className="place-gallery">
          {images.map((id, i) => (
            <button key={id} className={i === shown ? 'active' : ''} style={{ backgroundImage: `url("${imageUrl(id)}")` }} onClick={() => setShown(i)} aria-label={`Скриншот ${i + 1}`} />
          ))}
        </div>
      )}
      <div className="place-detail-body">
        <div className="place-detail-title">
          <div>
            <h2>{full.name}</h2>
            {full.ownerName && <p>{full.citySlug ? 'глава' : 'от'} {full.ownerName}</p>}
          </div>
          <strong>★ {full.rating ? full.rating.toFixed(1) : '—'}</strong>
        </div>
        <p className="place-description">{full.description}</p>
        {full.citySlug && <Link className="place-city-link" to={`/cities/${full.citySlug}`}>Страница города →</Link>}
        <div className="place-coords">
          <span>Координаты</span>
          <b>X {full.x}{full.y != null && ` · Y ${full.y}`} · Z {full.z}</b>
          <button onClick={() => navigator.clipboard?.writeText(`${full.x} ${full.y ?? '~'} ${full.z}`)}>Копировать</button>
        </div>
        {user ? (
          <div className="guide-review-form">
            <select value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Оценка">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
            <input value={body} onChange={(e) => setBody(e.target.value.slice(0, 1000))} placeholder="Короткий отзыв" />
            <button onClick={submitReview} disabled={busy}>{busy ? '…' : mine ? 'Обновить' : 'Оценить'}</button>
            <label><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Анонимно — имя увидит только стафф</label>
          </div>
        ) : <p className="guide-review-hint">Войдите, чтобы оценить место.</p>}
        {error && <small className="guide-error">{error}</small>}
        {isModerator && (
          <div className="guide-mod-actions">
            <button onClick={toggleFeatured} disabled={busy}>{full.featured ? 'Снять продвижение' : 'Продвигать'}</button>
            {!full.citySlug && <button onClick={remove} disabled={busy}>Удалить место</button>}
          </div>
        )}
        {!!details.data?.reviews?.length && (
          <div className="guide-reviews">
            {details.data.reviews.map((review, i) => (
              <div key={i}>
                <p>
                  <b>★ {review.rating} · {review.author?.name ?? 'Аноним'}</b>
                  {review.anonymous && review.author && <em> (анонимно)</em>}
                  {review.body && <> — {review.body}</>}
                </p>
                {review.author && (review.mine || isModerator) && <button onClick={() => deleteReview(review)} disabled={busy}>удалить</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function ApplicationForm({ onClose, onSubmitted }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'landmark', x: '', y: '', z: '', ownerName: '', imageIds: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = (patch) => setForm((value) => ({ ...value, ...patch }))
  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const coord = (v) => (v === '' ? null : Number(v))
      await guideApi('/applications', { method: 'POST', body: { ...form, x: coord(form.x), y: coord(form.y), z: coord(form.z) } })
      onSubmitted()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Предложить место" onClose={onClose} wide footer={<><button className="btn-ghost text-sm py-2 px-4" onClick={onClose}>Отмена</button><button className="btn-primary text-sm py-2 px-4" onClick={submit} disabled={busy}>{busy ? 'Отправляем…' : 'Отправить'}</button></>}>
      <div className="space-y-4">
        <Field label="Название"><input className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} autoFocus /></Field>
        <Field label="Описание"><textarea className={`${inputClass} resize-y`} rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Категория"><select className={inputClass} value={form.category} onChange={(e) => set({ category: e.target.value })}>{PROPOSABLE.map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></Field>
          <Field label="Автор или владелец"><input className={inputClass} value={form.ownerName} onChange={(e) => set({ ownerName: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">{['x', 'y', 'z'].map((key) => <Field key={key} label={key.toUpperCase()}><input type="number" className={inputClass} value={form[key]} onChange={(e) => set({ [key]: e.target.value })} /></Field>)}</div>
        <Field label="Скриншоты"><ImagePicker ids={form.imageIds} onChange={(imageIds) => set({ imageIds })} max={3} label="Скриншот" /></Field>
        <FormError error={error} />
      </div>
    </Modal>
  )
}
