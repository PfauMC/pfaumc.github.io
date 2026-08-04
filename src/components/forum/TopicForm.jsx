import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/forumApi'
import Editor from './Editor'
import { Field, Modal, FormError, inputClass } from './ui'

/**
 * Создание темы. Доступно только модераторам — сервер проверяет это сам,
 * кнопка в интерфейсе лишь прячется от остальных.
 *
 * Либо фиксированная категория (`categoryId`, со страницы категории),
 * либо выбор из списка (`categories`, с главной форума).
 */
export default function TopicForm({ categoryId, categories, onClose, onCreated }) {
  const selectable = Array.isArray(categories) && categories.length > 0
  const openCategories = selectable ? categories.filter((c) => c.isActive) : []

  const [target, setTarget] = useState(categoryId ?? openCategories[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await api('/forum/topics', { method: 'POST', body: { categoryId: target, title, body } })
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
            onChange={(e) => setTitle(e.target.value.slice(0, 140))}
            maxLength={140}
            autoFocus
            className={inputClass}
          />
        </Field>

        <div>
          <span className="block text-sm text-text-light/70 mb-1.5">Первое сообщение</span>
          <Editor
            value={body}
            onChange={setBody}
            onSubmit={submit}
            onCancel={onClose}
            submitLabel="Создать тему"
            busy={busy}
            disabled={!target || title.trim().length < 3}
            error={null}
            placeholder="О чём тема?"
          />
        </div>

        <FormError error={error} />
        {titleTooShort && <FormError error="Заголовок: минимум 3 символа" />}
      </div>
    </Modal>
  )
}
