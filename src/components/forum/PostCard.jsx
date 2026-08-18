import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/forumApi'
import { renderMarkup, buildQuote } from '../../lib/markup'
import { formatSmartTime, formatDateTime, REACTIONS, REPORT_REASON_LABELS } from '../../lib/forumFormat'
import { useForumAuth } from '../../context/ForumAuthContext'
import PlayerHead from '../PlayerHead'
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
      className={`rounded-2xl border bg-bg-card overflow-hidden scroll-mt-28 transition-colors ${
        highlighted
          ? 'border-accent/50 shadow-[0_0_24px_rgba(29,165,232,0.15)]'
          : post.isDeleted
            ? 'border-red-500/30 opacity-70'
            : 'border-white/5'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <AuthorPane author={post.author} />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Дата и номер сообщения */}
          <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-white/5">
            <time
              dateTime={post.createdAt}
              title={formatDateTime(post.createdAt)}
              className="text-xs text-text-light/50"
            >
              {formatSmartTime(post.createdAt)}
            </time>
            {post.editedAt && (
              <span className="text-xs text-text-light/40" title={formatDateTime(post.editedAt)}>
                · изменено{post.editedByModerator ? ' модератором' : ''}
              </span>
            )}
            <a
              href={`#post-${post.postNumber}`}
              className="ml-auto text-xs text-text-light/40 hover:text-accent transition-colors tabular-nums"
              aria-label={`Ссылка на сообщение №${post.postNumber}`}
            >
              #{post.postNumber}
            </a>
          </header>

          {/* Тело */}
          <div className="px-4 sm:px-5 py-4 flex-1">
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
          {!editing && (reactions.length > 0 || (user && !post.isDeleted)) && (
            <div className="px-4 sm:px-5 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-black/10 border border-white/5 px-2.5 py-2">
                {reactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() => toggleReaction(r.emoji)}
                    disabled={!user}
                    title={user ? 'Поставить реакцию' : 'Нужна авторизация'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors disabled:cursor-not-allowed ${
                      r.mine
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'border-transparent bg-white/5 text-text-light/70 hover:text-accent hover:border-accent/30'
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
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light/40 hover:text-accent hover:bg-white/5 transition-colors"
                    >
                      ☺+
                    </button>
                    {pickerOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} aria-hidden="true" />
                        <div className="absolute bottom-full left-0 mb-2 z-20 flex gap-0.5 p-1 rounded-xl glass">
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
        </div>
      </div>

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

/**
 * Колонка автора: на десктопе — вертикальная панель слева (как в классических
 * форумах), на телефоне сворачивается в одну строку над сообщением.
 */
function AuthorPane({ author }) {
  if (!author) {
    return (
      <div className="sm:w-44 flex-shrink-0 sm:border-r border-b sm:border-b-0 border-white/5 px-4 py-3 text-sm text-text-light/40">
        Аккаунт удалён
      </div>
    )
  }

  return (
    <div className="sm:w-44 flex-shrink-0 sm:border-r border-b sm:border-b-0 border-white/5 bg-black/10">
      {/* Мобильная строка */}
      <div className="flex sm:hidden items-center gap-2.5 px-4 py-3">
        <UserHead user={author} size={32} />
        <div className="min-w-0">
          <Link
            to={`/u/${encodeURIComponent(author.name)}`}
            className="font-mono text-sm font-semibold truncate hover:underline"
            style={{ color: author.role.color }}
          >
            {author.name}
          </Link>
          <div className="mt-0.5"><RoleBadge role={author.role} /></div>
        </div>
      </div>

      {/* Десктопная панель */}
      <div className="hidden sm:flex flex-col items-center text-center px-3 py-4 gap-2">
        <Link to={`/u/${encodeURIComponent(author.name)}`} className="hover:opacity-80 transition-opacity">
          <PlayerHead
            skin={author.skin}
            uuid={author.uuid}
            name={author.name}
            size={96}
            className="rounded-xl border border-white/10"
          />
        </Link>

        <Link
          to={`/u/${encodeURIComponent(author.name)}`}
          className="font-mono text-sm font-semibold break-all hover:underline leading-tight"
          style={{ color: author.role.color }}
        >
          {author.name}
        </Link>

        <span
          className="w-full rounded-md px-2 py-1 text-[11px] font-medium leading-none"
          style={{ color: author.role.color, background: `${author.role.color}22` }}
        >
          {author.role.title}
        </span>

        <dl className="w-full mt-1 space-y-0.5 text-[11px] text-text-light/40">
          {author.postCount != null && (
            <div className="flex justify-between gap-2">
              <dt>Сообщений</dt>
              <dd className="tabular-nums text-text-light/60">{author.postCount}</dd>
            </div>
          )}
          {author.joinedAt && (
            <div className="flex justify-between gap-2">
              <dt>На форуме</dt>
              <dd className="text-text-light/60" title={formatDateTime(author.joinedAt)}>
                {new Date(author.joinedAt).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
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
