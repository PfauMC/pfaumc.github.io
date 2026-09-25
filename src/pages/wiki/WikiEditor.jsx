import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { wikiApi, wikiFetcher } from '../../lib/wikiApi'
import { formatDateTime } from '../../lib/forumFormat'
import Editor from '../../components/forum/Editor'
import { Field, FormError, ListSkeleton, EmptyState, ConfirmDialog, inputClass } from '../../components/forum/ui'

const BODY_MAX = 100_000

/** Правка статьи (`/wiki/:slug/edit`) и новая статья (`/wiki/new`) -- Хелпер+. */
export default function WikiEditor() {
  const { slug } = useParams()
  const isNew = !slug
  const { user, loading: authLoading, isModerator } = useForumAuth()
  const pageRequest = useApiData(isNew ? null : `/pages/${slug}`, { fetcher: wikiFetcher })
  const pagesRequest = useApiData('/pages', { fetcher: wikiFetcher })
  useSEO(isNew ? 'Новая статья — PfauMC Wiki' : 'Правка статьи — PfauMC Wiki')

  if (authLoading || (!isNew && pageRequest.loading && !pageRequest.data)) return <ListSkeleton rows={4} />
  if (!user || !isModerator) {
    return <EmptyState icon="🚫" title="Редактировать вики могут Хелпер+ и выше" text="Если нашли ошибку в статье — напишите персоналу." />
  }
  if (pageRequest.data?.fallback || pagesRequest.data?.fallback) {
    return <EmptyState icon="⏳" title="Редактирование скоро заработает" text="Вики пока показывает встроенную копию — править её можно будет после обновления сервера." />
  }
  if (!isNew && !pageRequest.data?.page) return <EmptyState icon="📄" title="Статья не найдена" />

  const sections = [...new Set((pagesRequest.data?.pages ?? []).map((p) => p.section))]
  return <EditorForm key={slug ?? 'new'} page={pageRequest.data?.page} sections={sections} />
}

function EditorForm({ page, sections }) {
  const navigate = useNavigate()
  const isNew = !page
  const [form, setForm] = useState(() => ({
    title: page?.title ?? '',
    icon: page?.icon ?? '📄',
    section: page?.section ?? sections[0] ?? '',
    summary: page?.summary ?? '',
    slug: '',
    sortOrder: page?.sortOrder ?? 100,
    body: page?.body ?? '## Новый раздел\n\nТекст раздела.',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const body = { ...form, slug: isNew ? form.slug.trim() || undefined : undefined }
      const res = isNew
        ? await wikiApi('/pages', { method: 'POST', body })
        : await wikiApi(`/pages/${page.slug}`, { method: 'PUT', body })
      navigate(`/wiki/${res.slug}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await wikiApi(`/pages/${page.slug}`, { method: 'DELETE' })
      navigate('/wiki')
    } catch (e) {
      setError(e.message)
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading">{isNew ? 'Новая статья' : 'Правка статьи'}</h1>
        {!isNew && (
          <button onClick={() => setHistoryOpen((o) => !o)} className="ml-auto btn-ghost text-xs py-1.5 px-3">
            {historyOpen ? 'Скрыть историю' : '🕘 История правок'}
          </button>
        )}
      </div>

      {historyOpen && <History slug={page.slug} onRestore={(rev) => { set({ title: rev.title, body: rev.body }); setHistoryOpen(false) }} />}

      <div className="card space-y-4 mb-4">
        <div className="grid sm:grid-cols-[5rem_1fr] gap-3">
          <Field label="Иконка">
            <input value={form.icon} onChange={(e) => set({ icon: e.target.value.slice(0, 16) })} className={`${inputClass} text-center text-lg`} />
          </Field>
          <Field label="Заголовок">
            <input value={form.title} onChange={(e) => set({ title: e.target.value.slice(0, 120) })} className={inputClass} placeholder="Например, «Как построить ферму»" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-[1fr_7rem] gap-3">
          <Field label="Раздел меню">
            <input value={form.section} onChange={(e) => set({ section: e.target.value.slice(0, 60) })} list="wiki-sections" className={inputClass} />
            <datalist id="wiki-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Порядок">
            <input type="number" value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })} className={inputClass} />
          </Field>
        </div>
        <Field label="Короткое описание (для карточки на главной вики)">
          <input value={form.summary} onChange={(e) => set({ summary: e.target.value.slice(0, 300) })} className={inputClass} />
        </Field>
        {isNew && (
          <Field label="Адрес статьи (латиница и дефис; пусто — из заголовка)">
            <div className="flex items-center gap-2">
              <span className="text-text-light/40 text-sm flex-shrink-0">/wiki/</span>
              <input value={form.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) })} className={inputClass} placeholder="kak-postroit-fermu" />
            </div>
          </Field>
        )}
      </div>

      <p className="text-xs text-text-light/50 mb-2">
        Каждый раздел <code className="text-accent">## Заголовок</code> на странице станет отдельной карточкой и пунктом оглавления.
        Кнопка ⚠️ — оранжевая плашка-предупреждение. Ссылки внутри сайта: <code className="text-accent">[текст](/wiki/faq)</code>.
      </p>
      <Editor
        value={form.body}
        onChange={(body) => set({ body })}
        onSubmit={save}
        onCancel={() => navigate(isNew ? '/wiki' : `/wiki/${page.slug}`)}
        submitLabel={isNew ? 'Опубликовать' : 'Сохранить'}
        placeholder="Текст статьи…"
        busy={busy}
        disabled={form.title.trim().length < 2 || form.section.trim().length < 2}
        error={error}
        maxLength={BODY_MAX}
        wiki
      />

      {!isNew && (
        <button onClick={() => setConfirmDelete(true)} className="mt-6 text-sm text-red-400/80 hover:text-red-400">
          Удалить статью
        </button>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Удалить статью?"
          text={`«${page.title}» пропадёт из вики. История правок удалится вместе с ней.`}
          confirmLabel="Удалить"
          busy={busy}
          onConfirm={remove}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

function History({ slug, onRestore }) {
  const { data, loading, error } = useApiData(`/pages/${slug}/revisions`, { fetcher: wikiApi })
  if (loading && !data) return <ListSkeleton rows={2} />
  if (error) return <FormError error={error.message} />
  if (!data?.revisions.length) return <p className="text-sm text-text-light/50 mb-4">Прежних версий пока нет.</p>
  return (
    <div className="card mb-4 divide-y divide-white/5 p-0 sm:p-0 overflow-hidden">
      {data.revisions.map((rev) => (
        <div key={rev.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
          <span className="text-text-light">{formatDateTime(rev.createdAt)}</span>
          <span className="text-text-light/50">{rev.editedByName ?? 'исходная версия'}</span>
          <span className="text-text-light/40 truncate flex-1 min-w-0">{rev.title}</span>
          <button onClick={() => onRestore(rev)} className="text-accent text-xs hover:underline flex-shrink-0">
            Вернуть в редактор
          </button>
        </div>
      ))}
    </div>
  )
}
