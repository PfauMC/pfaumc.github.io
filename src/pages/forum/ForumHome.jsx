import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useForumData } from '../../hooks/useForumData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatCount, formatSmartTime, COUNT_TOPICS, COUNT_MESSAGES } from '../../lib/forumFormat'
import { UserHead, ListSkeleton, ErrorState, EmptyState, ConfirmDialog, Modal, FormError } from '../../components/forum/ui'
import ForumSearchBar from '../../components/forum/ForumSearchBar'

export default function ForumHome() {
  useSEO('Форум — PfauMC', 'Форум сервера PfauMC: обсуждения, вопросы, новости и общение игроков.')

  const { isModerator } = useForumAuth()
  const { data, loading, error, reload } = useForumData('/forum/categories')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const categories = data?.categories ?? []

  const move = async (index, direction) => {
    const next = [...categories]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setActionError(null)
    try {
      await api('/forum/categories/reorder', { method: 'POST', body: { ids: next.map((c) => c.id) } })
      reload()
    } catch (e) {
      setActionError(e.message)
    }
  }

  const removeCategory = async (category) => {
    setBusy(true)
    try {
      await api(`/forum/categories/${category.id}`, { method: 'DELETE' })
      setConfirm(null)
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <header className="mb-6">
          <h1 className="font-mono text-3xl sm:text-4xl font-bold text-heading mb-2">Форум PfauMC</h1>
          <p className="text-text-light text-base">
            Обсуждения, вопросы и новости сервера. Отвечать могут авторизованные игроки.
          </p>
        </header>

        <ForumSearchBar className="mb-6" />

        {isModerator && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setEditing({})} className="btn-primary text-sm py-2 px-4">
              + Категория
            </button>
            <Link to="/forum/reports" className="btn-ghost text-sm py-2 px-4">Жалобы</Link>
            <Link to="/forum/trash" className="btn-ghost text-sm py-2 px-4">Корзина</Link>
            <Link to="/forum/log" className="btn-ghost text-sm py-2 px-4">Журнал</Link>
          </div>
        )}

        <FormError error={actionError} />

        {loading && !data ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState message="Не удалось загрузить категории форума" onRetry={reload} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Категорий пока нет"
            text={
              isModerator
                ? 'Создайте первую категорию — она сразу появится на этой странице.'
                : 'Модераторы ещё не создали ни одной категории. Загляните позже.'
            }
            action={isModerator ? <button onClick={() => setEditing({})} className="btn-primary text-sm py-2 px-4">Создать категорию</button> : null}
          />
        ) : (
          <div className="space-y-3">
            {categories.map((category, i) => (
              <CategoryRow
                key={category.id}
                category={category}
                isModerator={isModerator}
                onEdit={() => setEditing(category)}
                onDelete={() =>
                  setConfirm({
                    title: 'Удалить категорию?',
                    text: `«${category.title}» вместе с темами скроется с форума. Восстановить можно в «Корзине».`,
                    action: () => removeCategory(category),
                  })
                }
                onMoveUp={i > 0 ? () => move(i, -1) : null}
                onMoveDown={i < categories.length - 1 ? () => move(i, 1) : null}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <CategoryForm
          category={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          text={confirm.text}
          confirmLabel="Удалить"
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={confirm.action}
        />
      )}
    </div>
  )
}

function CategoryRow({ category, isModerator, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div
      className={`card p-0 overflow-hidden group hover:border-accent/25 ${
        !category.isVisible ? 'opacity-60 border-dashed' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          to={`/forum/c/${category.slug}`}
          className="flex-1 min-w-0 flex items-start gap-3.5 p-4 sm:p-5 hover:bg-accent/[0.03] transition-colors"
        >
          <span
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-xl"
            aria-hidden="true"
          >
            {category.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono font-semibold text-heading group-hover:text-accent transition-colors">
                {category.title}
              </h2>
              {category.hasUnread && (
                <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  новое
                </span>
              )}
              {!category.isVisible && <Tag>скрыта</Tag>}
              {!category.isActive && <Tag>только чтение</Tag>}
            </div>
            {category.description && (
              <p className="text-text-light/70 text-sm mt-1 leading-relaxed">{category.description}</p>
            )}
            <p className="text-text-light/40 text-xs mt-2 sm:hidden">
              {formatCount(category.topicCount, COUNT_TOPICS)} · {formatCount(category.postCount, COUNT_MESSAGES)}
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-0.5 text-xs text-text-light/50 flex-shrink-0 tabular-nums">
            <span>{formatCount(category.topicCount, COUNT_TOPICS)}</span>
            <span>{formatCount(category.postCount, COUNT_MESSAGES)}</span>
          </div>
        </Link>

        {/* Последнее сообщение */}
        <div className="sm:w-56 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-white/5 p-4 sm:p-5">
          {category.lastPost ? (
            <Link
              to={`/forum/t/${category.lastPost.topicId}?post=${category.lastPost.postNumber}`}
              className="flex items-center gap-2.5 group/last"
            >
              <UserHead user={category.lastPost.author} size={32} link={false} />
              <div className="min-w-0">
                <p className="text-xs text-heading truncate group-hover/last:text-accent transition-colors">
                  {category.lastPost.topicTitle}
                </p>
                <p className="text-[11px] text-text-light/50 truncate">
                  {category.lastPost.author?.name} · {formatSmartTime(category.lastPost.createdAt)}
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-xs text-text-light/40">Сообщений пока нет</p>
          )}
        </div>
      </div>

      {isModerator && (
        <div className="flex items-center gap-1 px-3 py-2 border-t border-white/5 bg-black/5">
          <IconAction onClick={onMoveUp} label="Выше">↑</IconAction>
          <IconAction onClick={onMoveDown} label="Ниже">↓</IconAction>
          <button onClick={onEdit} className="ml-auto px-2.5 py-1.5 rounded-lg text-xs text-text-light/60 hover:text-accent hover:bg-white/5 transition-colors">
            Изменить
          </button>
          <button onClick={onDelete} className="px-2.5 py-1.5 rounded-lg text-xs text-text-light/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            Удалить
          </button>
        </div>
      )}
    </div>
  )
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-text-light/60 leading-none">
      {children}
    </span>
  )
}

function IconAction({ children, onClick, label }) {
  return (
    <button
      onClick={onClick ?? undefined}
      disabled={!onClick}
      aria-label={label}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light/50 hover:text-accent hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  )
}

export function CategoryForm({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: category?.title ?? '',
    description: category?.description ?? '',
    icon: category?.icon ?? '💬',
    isVisible: category?.isVisible ?? true,
    isActive: category?.isActive ?? true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (category) await api(`/forum/categories/${category.id}`, { method: 'PATCH', body: form })
      else await api('/forum/categories', { method: 'POST', body: form })
      onSaved()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={category ? 'Изменить категорию' : 'Новая категория'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>Отмена</button>
          <button onClick={submit} className="btn-primary text-sm py-2 px-4" disabled={busy || form.title.trim().length < 3}>
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Название">
          <input
            value={form.title}
            onChange={(e) => set({ title: e.target.value.slice(0, 140) })}
            maxLength={140}
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field label="Описание">
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value.slice(0, 300) })}
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field label="Иконка (эмодзи)">
          <input
            value={form.icon}
            onChange={(e) => set({ icon: e.target.value.slice(0, 8) })}
            className={`${inputClass} w-24 text-center text-lg`}
          />
        </Field>

        <Toggle checked={form.isVisible} onChange={(v) => set({ isVisible: v })} label="Видна игрокам" />
        <Toggle checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Открыта для новых сообщений" />

        <FormError error={error} />
      </div>
    </Modal>
  )
}

const inputClass =
  'w-full bg-bg-section border border-white/10 rounded-xl px-3 py-2 text-sm text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors'

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-text-light/70 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        className={`relative w-10 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 flex-shrink-0 ${
          checked ? 'bg-accent' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`}
        />
      </span>
      <span className="text-sm text-text-light">{label}</span>
    </label>
  )
}

export { inputClass }
