import { useState } from 'react'
import { api } from '../../lib/forumApi'
import { renderMarkup, buildQuote } from '../../lib/markup'
import { formatSmartTime, formatDateTime, REACTIONS, REPORT_REASON_LABELS } from '../../lib/forumFormat'
import { useForumAuth } from '../../context/ForumAuthContext'
import Editor from './Editor'
import { UserHead, RoleBadge, Modal, ConfirmDialog, FormError } from './ui'

export default function PostCard({ post, topic, onQuote, onReply, onChanged, highlighted }) {
  const { user, isModerator } = useForumAuth()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.body)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [reporting, setReporting] = useState(false)
  const [reactions, setReactions] = useState(post.reactions ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)

  const isOwn = user && post.author && String(user.id) === String(post.author.id)
  const canEdit = Boolean(user && (isOwn ? !topic?.isLocked : isModerator))
  const canDelete = Boolean(user && (isModerator || (isOwn && post.postNumber !== 1 && !topic?.isLocked)))

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      setConfirm(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = () =>
    run(async () => {
      await api(`/forum/posts/${post.id}`, { method: 'PATCH', body: { body: draft } })
      setEditing(false)
      onChanged?.()
    })

  const toggleReaction = async (emoji) => {
    if (!user) return
    setPickerOpen(false)
    try {
      const data = await api(`/forum/posts/${post.id}/reactions`, { method: 'PUT', body: { emoji } })
      setReactions(data.reactions)
    } catch (e) {
      setError(e.message)
    }
  }

  if (post.isDeleted && !isModerator) {
    return (
      <article id={`post-${post.postNumber}`} className="card py-4 opacity-60">
        <p className="text-text-light/50 text-sm italic">Сообщение удалено модератором.</p>
      </article>
    )
  }

  return (
    <article
      id={`post-${post.postNumber}`}
      className={`card p-0 overflow-hidden scroll-mt-28 transition-colors ${
        highlighted ? 'border-accent/50 shadow-[0_0_24px_rgba(29,165,232,0.15)]' : ''
      } ${post.isDeleted ? 'opacity-70 border-red-500/30' : ''}`}
    >
      {/* Шапка */}
      <header className="flex items-start gap-3 px-4 pt-4 sm:px-5">
        <UserHead user={post.author} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm font-semibold text-heading truncate">{post.author?.name ?? '—'}</span>
            <RoleBadge role={post.author?.role} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-light/50 mt-0.5">
            <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)}>
              {formatSmartTime(post.createdAt)}
            </time>
            {post.editedAt && (
              <span title={formatDateTime(post.editedAt)}>
                · изменено{post.editedByModerator ? ' модератором' : ''}
              </span>
            )}
          </div>
        </div>
        <a
          href={`#post-${post.postNumber}`}
          className="flex-shrink-0 text-xs text-text-light/40 hover:text-accent transition-colors tabular-nums"
          aria-label={`Сообщение №${post.postNumber}`}
        >
          #{post.postNumber}
        </a>
      </header>

      {/* Тело */}
      <div className="px-4 sm:px-5 py-3">
        {post.isDeleted && (
          <p className="mb-2 text-xs text-red-400/90">Сообщение удалено — видно только модераторам.</p>
        )}
        {post.replyTo && (
          <a
            href={`#post-${post.replyTo.postNumber}`}
            className="inline-flex items-center gap-1.5 mb-2 text-xs text-text-light/50 hover:text-accent transition-colors"
          >
            ↩ ответ на #{post.replyTo.postNumber} · {post.replyTo.authorName}
          </a>
        )}

        {editing ? (
          <Editor
            value={draft}
            onChange={setDraft}
            onSubmit={saveEdit}
            onCancel={() => { setEditing(false); setDraft(post.body); setError(null) }}
            submitLabel="Сохранить"
            busy={busy}
            error={error}
            compact
            autoFocus
          />
        ) : (
          <div className="text-text-light text-[0.95rem] leading-relaxed">
            {renderMarkup(post.body, `p${post.id}`)}
          </div>
        )}
      </div>

      {/* Реакции */}
      {!editing && (
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap items-center gap-1.5">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => toggleReaction(r.emoji)}
              disabled={!user}
              title={user ? 'Поставить реакцию' : 'Нужна авторизация'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors disabled:cursor-not-allowed ${
                r.mine
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-white/10 text-text-light/70 hover:border-accent/30 hover:text-accent'
              }`}
            >
              <span aria-hidden="true">{r.emoji}</span>
              <span className="tabular-nums">{r.count}</span>
            </button>
          ))}

          {user && !post.isDeleted && (
            <div className="relative">
              <button
                onClick={() => setPickerOpen((o) => !o)}
                aria-label="Добавить реакцию"
                aria-expanded={pickerOpen}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-dashed border-white/15 text-text-light/50 hover:text-accent hover:border-accent/40 transition-colors"
              >
                +
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} aria-hidden="true" />
                  <div className="absolute bottom-full left-0 mb-2 z-20 flex gap-0.5 p-1 rounded-xl bg-bg-card border border-white/10 shadow-xl">
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(emoji)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Действия */}
      {!editing && (
        <footer className="flex flex-wrap items-center gap-x-1 gap-y-1 px-3 sm:px-4 py-2 border-t border-white/5 bg-black/5">
          {user && !topic?.isLocked && !post.isDeleted && (
            <>
              <ActionButton onClick={() => onReply?.(post)}>Ответить</ActionButton>
              <ActionButton onClick={() => onQuote?.(buildQuote(post.author?.name ?? '', post.body))}>
                Цитировать
              </ActionButton>
            </>
          )}
          {canEdit && !post.isDeleted && <ActionButton onClick={() => setEditing(true)}>Изменить</ActionButton>}
          {canDelete && !post.isDeleted && (
            <ActionButton
              danger
              onClick={() =>
                setConfirm({
                  title: 'Удалить сообщение?',
                  text: 'Сообщение будет скрыто. Модератор сможет его восстановить.',
                  confirmLabel: 'Удалить',
                  action: async () => {
                    await api(`/forum/posts/${post.id}`, { method: 'DELETE' })
                    onChanged?.()
                  },
                })
              }
            >
              Удалить
            </ActionButton>
          )}
          {isModerator && post.isDeleted && (
            <ActionButton
              onClick={() =>
                run(async () => {
                  await api(`/forum/posts/${post.id}/restore`, { method: 'POST' })
                  onChanged?.()
                })
              }
            >
              Восстановить
            </ActionButton>
          )}
          {user && !isOwn && !post.isDeleted && (
            <ActionButton className="ml-auto" onClick={() => setReporting(true)}>
              Пожаловаться
            </ActionButton>
          )}
        </footer>
      )}

      {!editing && error && (
        <div className="px-4 pb-3">
          <FormError error={error} />
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          text={confirm.text}
          confirmLabel={confirm.confirmLabel}
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => run(confirm.action)}
        />
      )}

      {reporting && <ReportDialog postId={post.id} onClose={() => setReporting(false)} />}
    </article>
  )
}

function ActionButton({ children, onClick, danger, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        danger ? 'text-text-light/60 hover:text-red-400 hover:bg-red-500/10' : 'text-text-light/60 hover:text-accent hover:bg-white/5'
      } ${className}`}
    >
      {children}
    </button>
  )
}

function ReportDialog({ postId, onClose }) {
  const [reason, setReason] = useState('spam')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await api(`/forum/posts/${postId}/report`, { method: 'POST', body: { reason, comment } })
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Пожаловаться на сообщение"
      onClose={onClose}
      footer={
        done ? (
          <button onClick={onClose} className="btn-primary text-sm py-2 px-4">Закрыть</button>
        ) : (
          <>
            <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>Отмена</button>
            <button onClick={submit} className="btn-primary text-sm py-2 px-4" disabled={busy}>
              {busy ? 'Отправка…' : 'Отправить'}
            </button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-text-light text-sm">Жалоба отправлена — модераторы её рассмотрят.</p>
      ) : (
        <div className="space-y-3">
          <fieldset className="space-y-1.5">
            <legend className="text-sm text-text-light/70 mb-1.5">Причина</legend>
            {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/10 hover:border-accent/30 cursor-pointer transition-colors has-[:checked]:border-accent/50 has-[:checked]:bg-accent/5"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={key}
                  checked={reason === key}
                  onChange={() => setReason(key)}
                  className="accent-[rgb(var(--c-accent))]"
                />
                <span className="text-sm text-text-light">{label}</span>
              </label>
            ))}
          </fieldset>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Комментарий (необязательно)"
            className="w-full bg-bg-section border border-white/10 rounded-xl px-3 py-2 text-sm text-heading placeholder-text-light/30 focus:outline-none focus:border-accent/50 resize-y"
          />
          <FormError error={error} />
        </div>
      )}
    </Modal>
  )
}
