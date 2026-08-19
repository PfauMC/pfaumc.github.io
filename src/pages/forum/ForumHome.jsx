import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatSmartTime } from '../../lib/forumFormat'
import {
  UserHead, ListSkeleton, ErrorState, EmptyState, ConfirmDialog, Modal, FormError, Field, Toggle, inputClass,
} from '../../components/forum/ui'
import ForumSearchBar from '../../components/forum/ForumSearchBar'
import TopicForm from '../../components/forum/TopicForm'

export default function ForumHome() {
  useSEO('Форум — PfauMC', 'Форум сервера PfauMC: обсуждения, вопросы, новости и общение игроков.')

  const { isModerator } = useForumAuth()
  const { data, loading, error, reload } = useApiData('/forum/categories')

  const [creatingTopic, setCreatingTopic] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [collapsed, setCollapsed] = useState(() => new Set())

  const groups = data?.groups ?? []
  const categories = data?.categories ?? []

  /** Разделы с вложенными категориями + «Прочее» для категорий без раздела. */
  const sections = useMemo(() => {
    const byGroup = groups.map((group) => ({
      group,
      categories: categories.filter((c) => c.groupId === group.id),
    }))
    const ungrouped = categories.filter((c) => !c.groupId || !groups.some((g) => g.id === c.groupId))
    if (ungrouped.length) byGroup.push({ group: null, categories: ungrouped })
    return byGroup
  }, [groups, categories])

  const run = async (fn) => {
    setBusy(true)
    setActionError(null)
    try {
      await fn()
      setConfirm(null)
      reload()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  /** Позиции категорий глобальные, поэтому пересобираем весь порядок целиком. */
  const moveCategory = (sectionIndex, index, direction) => {
    const next = sections.map((s) => [...s.categories])
    const list = next[sectionIndex]
    const target = index + direction
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    return run(() =>
      api('/forum/categories/reorder', { method: 'POST', body: { ids: next.flat().map((c) => c.id) } })
    )
  }

  const moveGroup = (index, direction) => {
    const next = [...groups]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    return run(() => api('/forum/groups/reorder', { method: 'POST', body: { ids: next.map((g) => g.id) } }))
  }

  const toggleCollapse = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

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
            <button
              onClick={() => setCreatingTopic(true)}
              disabled={categories.length === 0}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-40 disabled:pointer-events-none"
            >
              + Тема
            </button>
            <button onClick={() => setEditingGroup({})} className="btn-ghost text-sm py-2 px-4">+ Раздел</button>
            <button onClick={() => setEditingCategory({})} className="btn-ghost text-sm py-2 px-4">+ Категория</button>
            <Link to="/forum/reports" className="btn-ghost text-sm py-2 px-4">Жалобы</Link>
            <Link to="/cities/applications" className="btn-ghost text-sm py-2 px-4">Заявки на города</Link>
            <Link to="/forum/trash" className="btn-ghost text-sm py-2 px-4">Корзина</Link>
            <Link to="/forum/log" className="btn-ghost text-sm py-2 px-4">Журнал</Link>
          </div>
        )}

        <FormError error={actionError} />

        {loading && !data ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState message="Не удалось загрузить форум" onRetry={reload} />
        ) : categories.length === 0 && groups.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Форум пока пуст"
            text={
              isModerator
                ? 'Создайте раздел, а внутри него — категории. Они сразу появятся на этой странице.'
                : 'Модераторы ещё не создали ни одного раздела. Загляните позже.'
            }
            action={
              isModerator ? (
                <button onClick={() => setEditingGroup({})} className="btn-primary text-sm py-2 px-4">
                  Создать раздел
                </button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-5">
            {sections.map((section, sectionIndex) => {
              const key = section.group?.id ?? 'ungrouped'
              const isCollapsed = collapsed.has(key)
              return (
                <section
                  key={key}
                  className="rounded-2xl border border-white/5 bg-bg-card overflow-hidden"
                >
                  {(section.group || sections.length > 1) && (
                    <SectionHeader
                      group={section.group}
                      collapsed={isCollapsed}
                      onToggle={() => toggleCollapse(key)}
                      isModerator={isModerator}
                      onEdit={section.group ? () => setEditingGroup(section.group) : null}
                      onAddCategory={() => setEditingCategory({ groupId: section.group?.id ?? '' })}
                      onDelete={
                        section.group
                          ? () =>
                              setConfirm({
                                title: 'Удалить раздел?',
                                text: `«${section.group.title}» исчезнет с главной. Категории внутри сохранятся и переедут в «Прочее».`,
                                action: () => api(`/forum/groups/${section.group.id}`, { method: 'DELETE' }),
                              })
                          : null
                      }
                      onMoveUp={section.group && sectionIndex > 0 ? () => moveGroup(sectionIndex, -1) : null}
                      onMoveDown={
                        section.group && sectionIndex < groups.length - 1 ? () => moveGroup(sectionIndex, 1) : null
                      }
                    />
                  )}

                  {!isCollapsed && (
                    <div className="divide-y divide-white/5">
                      {section.categories.length === 0 ? (
                        <p className="px-4 sm:px-5 py-6 text-sm text-text-light/40">
                          В разделе пока нет категорий.
                        </p>
                      ) : (
                        section.categories.map((category, i) => (
                          <CategoryRow
                            key={category.id}
                            category={category}
                            isModerator={isModerator}
                            onEdit={() => setEditingCategory(category)}
                            onDelete={() =>
                              setConfirm({
                                title: 'Удалить категорию?',
                                text: `«${category.title}» вместе с темами скроется с форума. Восстановить можно в «Корзине».`,
                                action: () => api(`/forum/categories/${category.id}`, { method: 'DELETE' }),
                              })
                            }
                            onMoveUp={i > 0 ? () => moveCategory(sectionIndex, i, -1) : null}
                            onMoveDown={
                              i < section.categories.length - 1 ? () => moveCategory(sectionIndex, i, 1) : null
                            }
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      {creatingTopic && (
        <TopicForm
          categories={categories}
          onClose={() => setCreatingTopic(false)}
          onCreated={() => setCreatingTopic(false)}
        />
      )}

      {editingCategory && (
        <CategoryForm
          category={editingCategory.id ? editingCategory : null}
          defaultGroupId={editingCategory.groupId ?? ''}
          groups={groups}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); reload() }}
        />
      )}

      {editingGroup && (
        <GroupForm
          group={editingGroup.id ? editingGroup : null}
          onClose={() => setEditingGroup(null)}
          onSaved={() => { setEditingGroup(null); reload() }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          text={confirm.text}
          confirmLabel="Удалить"
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => run(confirm.action)}
        />
      )}
    </div>
  )
}

function SectionHeader({ group, collapsed, onToggle, isModerator, onEdit, onDelete, onAddCategory, onMoveUp, onMoveDown }) {
  return (
    <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-bg-section border-b border-white/5">
      <h2 className="font-mono font-bold text-heading text-sm sm:text-base truncate">
        {group?.title ?? 'Прочее'}
      </h2>
      {group && !group.isVisible && (
        <span className="inline-flex items-center rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-text-light/60 leading-none flex-shrink-0">
          скрыт
        </span>
      )}

      {isModerator && (
        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
          <IconAction onClick={onMoveUp} label="Раздел выше">↑</IconAction>
          <IconAction onClick={onMoveDown} label="Раздел ниже">↓</IconAction>
          <IconAction onClick={onAddCategory} label="Добавить категорию">+</IconAction>
          {onEdit && <IconAction onClick={onEdit} label="Изменить раздел">✎</IconAction>}
          {onDelete && <IconAction onClick={onDelete} label="Удалить раздел" danger>✕</IconAction>}
        </div>
      )}

      <button
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Развернуть раздел' : 'Свернуть раздел'}
        className={`w-7 h-7 flex items-center justify-center rounded-lg text-text-light/50 hover:text-accent hover:bg-white/5 transition-colors flex-shrink-0 ${
          isModerator ? '' : 'ml-auto'
        }`}
      >
        <span className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}>⌄</span>
      </button>
    </div>
  )
}

function CategoryRow({ category, isModerator, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className={`group ${!category.isVisible ? 'opacity-60' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center">
        <Link
          to={`/forum/c/${category.slug}`}
          className="flex-1 min-w-0 flex items-start gap-3.5 px-4 sm:px-5 py-4 hover:bg-accent/[0.03] transition-colors"
        >
          <span
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${
              category.hasUnread ? 'bg-accent/15' : 'bg-white/5'
            }`}
            aria-hidden="true"
          >
            {category.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-heading group-hover:text-accent transition-colors">
                {category.title}
              </h3>
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
              <p className="text-text-light/60 text-sm mt-0.5 leading-relaxed">{category.description}</p>
            )}
            <p className="text-text-light/40 text-xs mt-1.5 sm:hidden tabular-nums">
              Темы: {category.topicCount} · Сообщения: {category.postCount}
            </p>
          </div>
        </Link>

        {/* Счётчики */}
        <div className="hidden sm:flex items-center gap-6 px-4 flex-shrink-0">
          <Stat label="Темы" value={category.topicCount} />
          <Stat label="Сообщения" value={category.postCount} />
        </div>

        {/* Последнее сообщение */}
        <div className="sm:w-52 flex-shrink-0 px-4 sm:px-5 pb-4 sm:py-4 sm:border-l border-white/5">
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
                  {formatSmartTime(category.lastPost.createdAt)} · {category.lastPost.author?.name}
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-xs text-text-light/40">Сообщений пока нет</p>
          )}
        </div>
      </div>

      {isModerator && (
        <div className="flex items-center gap-1 px-3 sm:px-4 pb-2">
          <IconAction onClick={onMoveUp} label="Выше">↑</IconAction>
          <IconAction onClick={onMoveDown} label="Ниже">↓</IconAction>
          <button
            onClick={onEdit}
            className="ml-auto px-2.5 py-1 rounded-lg text-xs text-text-light/50 hover:text-accent hover:bg-white/5 transition-colors"
          >
            Изменить
          </button>
          <button
            onClick={onDelete}
            className="px-2.5 py-1 rounded-lg text-xs text-text-light/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center min-w-[4.5rem]">
      <div className="text-[11px] text-text-light/40 uppercase tracking-wide">{label}</div>
      <div className="text-heading font-semibold tabular-nums">{value}</div>
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

function IconAction({ children, onClick, label, danger }) {
  return (
    <button
      onClick={onClick ?? undefined}
      disabled={!onClick}
      aria-label={label}
      title={label}
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-text-light/50 hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-colors ${
        danger ? 'hover:text-red-400' : 'hover:text-accent'
      }`}
    >
      {children}
    </button>
  )
}

/* ===== Формы ===== */

export function GroupForm({ group, onClose, onSaved }) {
  const [title, setTitle] = useState(group?.title ?? '')
  const [isVisible, setIsVisible] = useState(group?.isVisible ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const body = { title, isVisible }
      if (group) await api(`/forum/groups/${group.id}`, { method: 'PATCH', body })
      else await api('/forum/groups', { method: 'POST', body })
      onSaved()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={group ? 'Изменить раздел' : 'Новый раздел'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>Отмена</button>
          <button onClick={submit} className="btn-primary text-sm py-2 px-4" disabled={busy || title.trim().length < 3}>
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Название раздела">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 140))}
            placeholder="Например, «Общий раздел»"
            autoFocus
            className={inputClass}
          />
        </Field>
        <Toggle checked={isVisible} onChange={setIsVisible} label="Виден игрокам" />
        <p className="text-xs text-text-light/50">
          Раздел — это заголовок на главной форума. Категории внутри него настраиваются отдельно.
        </p>
        <FormError error={error} />
      </div>
    </Modal>
  )
}

export function CategoryForm({ category, groups = [], defaultGroupId = '', onClose, onSaved }) {
  const [form, setForm] = useState({
    title: category?.title ?? '',
    description: category?.description ?? '',
    icon: category?.icon ?? '💬',
    groupId: category?.groupId ?? defaultGroupId ?? '',
    isVisible: category?.isVisible ?? true,
    isActive: category?.isActive ?? true,
    isOpen: category?.isOpen ?? false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const body = { ...form, groupId: form.groupId || null }
      if (category) await api(`/forum/categories/${category.id}`, { method: 'PATCH', body })
      else await api('/forum/categories', { method: 'POST', body })
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

        <Field label="Раздел">
          <select value={form.groupId} onChange={(e) => set({ groupId: e.target.value })} className={inputClass}>
            <option value="">Без раздела («Прочее»)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
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
        {/* Только при создании: бэкенд не даёт поменять это потом (update_category
            поле не трогает), поэтому в форме редактирования тогл не показываем —
            он бы выглядел рабочим, но ничего бы не сохранял. */}
        {!category && (
          <Toggle checked={form.isOpen} onChange={(v) => set({ isOpen: v })} label="Темы может создавать любой игрок, не только модератор" />
        )}

        <FormError error={error} />
      </div>
    </Modal>
  )
}
