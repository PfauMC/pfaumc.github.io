import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/forumApi'
import { useDraft } from '../../hooks/useDraft'
import Editor from './Editor'
import { Field, Modal, FormError, inputClass, DraftBanner } from './ui'

/**
 * Создание темы. Доступно только модераторам — сервер проверяет это сам,
 * кнопка в интерфейсе лишь прячется от остальных.
 *
 * Либо фиксированная категория (`categoryId` + `categorySlug`, со страницы
 * категории), либо выбор из списка (`categories`, с главной форума) — черновик
 * хранится по слагу категории, поэтому он нужен в обоих случаях.
 */
export default function TopicForm({ categoryId, categorySlug, categories, onClose, onCreated }) {
  const selectable = Array.isArray(categories) && categories.length > 0
  const openCategories = selectable ? categories.filter((c) => c.isActive) : []

  const [target, setTarget] = useState(categoryId ?? openCategories[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [draftBannerHandled, setDraftBannerHandled] = useState(false)
  const navigate = useNavigate()

  const targetSlug = categorySlug ?? categories?.find((c) => String(c.id) === String(target))?.slug ?? null

  const savedDraft = useDraft('category', targetSlug, { enabled: true })
  const showDraftBanner =
    Boolean(savedDraft.stored) && !draftBannerHandled && !title.trim() && !body.trim()

  const handleTitleChange = useCallback(
    (next) => {
      setTitle(next)
      savedDraft.schedule({ title: next, body })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedDraft.schedule, body]
  )
  const handleBodyChange = useCallback(
    (next) => {
      setBody(next)
      savedDraft.schedule({ title, body: next })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedDraft.schedule, title]
  )

  const restoreDraft = () => {
    setDraftBannerHandled(true)
    if (savedDraft.stored) {
      setTitle(savedDraft.stored.title)
      setBody(savedDraft.stored.body)
    }
  }
  const discardDraft = () => {
    setDraftBannerHandled(true)
    savedDraft.discard()
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await api('/forum/topics', { method: 'POST', body: { categoryId: target, title, body } })
      savedDraft.forget()
      onCreated?.()
      navigate(`/forum/t/${data.topicId}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const titleTooShort = title.trim().length > 0 && title.trim().length < 3

  return (
    <Modal title="Новая тема" onClose={onClose} wide>
      <div className="space-y-4">
        {showDraftBanner && <DraftBanner onRestore={restoreDraft} onDiscard={discardDraft} />}

        {selectable && (
          <Field label="Категория">
            {openCategories.length === 0 ? (
              <p className="text-sm text-text-light/60">
                Нет категорий, открытых для новых сообщений. Создайте категорию или откройте существующую.
              </p>
            ) : (
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
                {openCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <Field label="Заголовок темы">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value.slice(0, 140))}
            maxLength={140}
            autoFocus
            className={inputClass}
          />
        </Field>

        <div>
          <span className="block text-sm text-text-light/70 mb-1.5">Первое сообщение</span>
          <Editor
            value={body}
            onChange={handleBodyChange}
            onSubmit={submit}
            onCancel={onClose}
            submitLabel="Создать тему"
            busy={busy}
            disabled={!target || title.trim().length < 3}
            error={null}
            placeholder="О чём тема?"
            draftStatus={savedDraft.status}
            onSaveDraft={() => savedDraft.saveNow()}
          />
        </div>

        <FormError error={error} />
        {titleTooShort && <FormError error="Заголовок: минимум 3 символа" />}
      </div>
    </Modal>
  )
}
