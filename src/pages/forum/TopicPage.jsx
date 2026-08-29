import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { useDraft } from '../../hooks/useDraft'
import { api } from '../../lib/forumApi'
import { formatCount, formatSmartTime, COUNT_REPLIES, COUNT_VIEWS } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, Pagination, LoginNotice, Modal, ConfirmDialog, FormError, RoleBadge, UserHead, Field, inputClass, DraftBanner,
} from '../../components/forum/ui'
import Editor from '../../components/forum/Editor'
import PostCard from '../../components/forum/PostCard'

const PAGE_SIZE = 20

export default function TopicPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { user, isModerator } = useForumAuth()
  const navigate = useNavigate()

  const targetPost = Number.parseInt(params.get('post') ?? '', 10)
  const page =
    Number.parseInt(params.get('page') ?? '', 10) ||
    (Number.isFinite(targetPost) ? Math.max(1, Math.ceil(targetPost / PAGE_SIZE)) : 1)

  const topic = useApiData(`/forum/topics/${id}`)
  const posts = useApiData(`/forum/topics/${id}/posts?page=${page}`)

  const [replyText, setReplyText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [modAction, setModAction] = useState(null)
  const [draftBannerHandled, setDraftBannerHandled] = useState(false)
  const editorRef = useRef(null)
  const scrolledRef = useRef(false)

  // Персистентный черновик ответа — хранится на бэкенде, не в localStorage
  // (см. useDraft). Гостю и до загрузки темы он не нужен.
  const savedDraft = useDraft('topic', id, { enabled: Boolean(user) })
  const showDraftBanner = Boolean(savedDraft.stored) && !draftBannerHandled && !replyText.trim()

  const handleReplyChange = useCallback(
    (text) => {
      setReplyText(text)
      savedDraft.schedule({ body: text })
    },
    // savedDraft.schedule — новая функция на каждый рендер из useCallback внутри
    // хука, но она стабильна по сути (замыкает только path/active); включать её
    // в deps означало бы пересоздавать обработчик на каждый чих без надобности.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedDraft.schedule]
  )

  const restoreDraft = () => {
    setDraftBannerHandled(true)
    if (savedDraft.stored) setReplyText(savedDraft.stored.body)
    focusEditor()
  }

  const discardDraft = () => {
    setDraftBannerHandled(true)
    savedDraft.discard()
  }

  const info = topic.data?.topic
  useSEO(info ? `${info.title} — Форум PfauMC` : 'Форум PfauMC')

  // Отметка «прочитано» до последнего сообщения на странице.
  useEffect(() => {
    if (!user || !posts.data?.posts.length) return
    const maxNumber = Math.max(...posts.data.posts.map((p) => p.postNumber))
    api(`/forum/topics/${id}/read`, { method: 'POST', body: { postNumber: maxNumber } }).catch(() => {})
  }, [user, posts.data, id])

  // Переход к конкретному сообщению из ссылки/уведомления.
  useEffect(() => {
    if (scrolledRef.current || !posts.data || !Number.isFinite(targetPost)) return
    const el = document.getElementById(`post-${targetPost}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      scrolledRef.current = true
    }
  }, [posts.data, targetPost])

  const setPage = (next) => {
    const p = new URLSearchParams(params)
    p.set('page', String(next))
    p.delete('post')
    setParams(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const focusEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const quote = (text) => {
    const next = replyText ? `${replyText}\n\n${text}` : text
    handleReplyChange(next)
    focusEditor()
  }

  const startReply = (post) => {
    setReplyTo({ id: post.id, postNumber: post.postNumber, name: post.author?.name })
    focusEditor()
  }

  const submitReply = async () => {
    setSending(true)
    setSendError(null)
    try {
      const data = await api('/forum/posts', {
        method: 'POST',
        body: { topicId: id, body: replyText, replyToPostId: replyTo?.id ?? null },
      })
      setReplyText('')
      savedDraft.forget()
      setReplyTo(null)
      const lastPage = Math.max(1, Math.ceil(data.postNumber / PAGE_SIZE))
      if (lastPage !== page) {
        scrolledRef.current = false
        const p = new URLSearchParams(params)
        p.set('page', String(lastPage))
        p.set('post', String(data.postNumber))
        setParams(p)
      } else {
        posts.reload()
        topic.reload()
      }
    } catch (e) {
      setSendError(e.message)
    } finally {
      setSending(false)
    }
  }

  const runModAction = async (fn) => {
    await fn()
    topic.reload()
    posts.reload()
  }

  if (topic.error) {
    return (
      <PageShell>
        <ErrorState
          message={topic.error.status === 404 ? 'Тема не найдена или удалена' : 'Не удалось загрузить тему'}
          onRetry={topic.error.status === 404 ? null : topic.reload}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      {/* Шапка темы — баннер */}
      {/* Без overflow-hidden: он обрезал бы выпадашку модерации. Скругление держат
          сами декоративные слои — фон клипается их собственным border-radius. */}
      <header className="relative rounded-2xl border border-white/5 bg-bg-card mb-4">
        <div className="absolute inset-0 rounded-2xl grid-bg opacity-70 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 rounded-2xl bg-card-glow pointer-events-none" aria-hidden="true" />

        <div className="relative px-5 py-6 sm:px-7 sm:py-7 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2 empty:hidden">
              {info?.isPinned && <Badge>📌 Закреплена</Badge>}
              {info?.isLocked && <Badge>🔒 Закрыта</Badge>}
              {info?.replyCooldownSec > 0 && <Badge>⏱ {formatDuration(info.replyCooldownSec)} между сообщениями</Badge>}
              {info?.isDeleted && <Badge danger>🗑️ Удалена</Badge>}
              {info?.isArchived && <Badge>📦 В архиве</Badge>}
            </div>
            <h1 className="font-mono text-xl sm:text-3xl font-bold text-heading break-words leading-tight">
              {info?.title ?? 'Загрузка…'}
            </h1>
            {info && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3 text-sm text-text-light/60">
                <UserHead user={info.author} size={24} />
                <Link
                  to={`/u/${encodeURIComponent(info.author?.name ?? '')}`}
                  className="font-mono font-semibold hover:underline"
                  style={{ color: info.author?.role?.color }}
                >
                  {info.author?.name}
                </Link>
                <RoleBadge role={info.author?.role} />
                <span className="text-text-light/40">· {formatSmartTime(info.createdAt)}</span>
                <span className="tabular-nums text-text-light/40">
                  · {formatCount(info.replyCount, COUNT_REPLIES)} · {formatCount(info.views, COUNT_VIEWS)}
                </span>
              </div>
            )}
          </div>

          {info && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && <SubscribeButton topicId={id} initial={info.isSubscribed} />}
              {isModerator && <ModeratorMenu topic={info} onAction={setModAction} />}
              {!isModerator && info.canPin && <PinButton topic={info} onDone={() => topic.reload()} />}
              {!isModerator && user && String(user.id) === String(info.author?.id) && (
                <AuthorDeleteButton topicId={id} onDeleted={() => navigate(`/forum/c/${info.categorySlug}`)} />
              )}
            </div>
          )}
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: 'Форум', to: '/forum' },
          { label: info?.categoryTitle ?? '…', to: info ? `/forum/c/${info.categorySlug}` : undefined },
          { label: info?.title ?? 'Тема' },
        ]}
      />

      {posts.data && (
        <Pagination
          page={posts.data.page}
          total={posts.data.total}
          pageSize={posts.data.pageSize}
          onChange={setPage}
          className="mb-4 justify-start"
        />
      )}

      {/* Сообщения */}
      {posts.loading && !posts.data ? (
        <ListSkeleton rows={4} />
      ) : posts.error ? (
        <ErrorState message="Не удалось загрузить сообщения" onRetry={posts.reload} />
      ) : (
        <>
          <div className="space-y-3">
            {posts.data.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                topic={info}
                highlighted={post.postNumber === targetPost}
                onQuote={quote}
                onReply={startReply}
                onChanged={() => { posts.reload(); topic.reload() }}
              />
            ))}
          </div>
          <Pagination page={posts.data.page} total={posts.data.total} pageSize={posts.data.pageSize} onChange={setPage} />
        </>
      )}

      {/* Форма ответа */}
      <div ref={editorRef} className="mt-6 scroll-mt-28">
        {!user ? (
          <LoginNotice />
        ) : info?.isLocked ? (
          <div className="card text-center py-6 text-text-light/60 text-sm">🔒 Тема закрыта для новых ответов.</div>
        ) : info?.isDeleted ? (
          <div className="card text-center py-6 text-text-light/60 text-sm">Тема удалена.</div>
        ) : info?.isArchived ? (
          <div className="card text-center py-6 text-text-light/60 text-sm">Тема в архиве, отвечать нельзя.</div>
        ) : (
          <>
            {showDraftBanner && <DraftBanner onRestore={restoreDraft} onDiscard={discardDraft} />}
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-xs text-text-light/60">
                <span>Ответ на #{replyTo.postNumber} · {replyTo.name}</span>
                <button onClick={() => setReplyTo(null)} className="text-accent hover:underline">отменить</button>
              </div>
            )}
            <Editor
              value={replyText}
              onChange={handleReplyChange}
              draftStatus={user ? savedDraft.status : null}
              onSaveDraft={user ? () => savedDraft.saveNow() : null}
              onSubmit={submitReply}
              submitLabel="Ответить"
              busy={sending}
              error={sendError}
            />
          </>
        )}
      </div>

      {modAction && (
        <ModeratorDialog
          action={modAction}
          topic={info}
          onClose={() => setModAction(null)}
          onDone={async (fn) => {
            await runModAction(fn)
            setModAction(null)
          }}
          onDeleted={() => navigate(`/forum/c/${info.categorySlug}`)}
        />
      )}
    </PageShell>
  )
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">{children}</div>
    </div>
  )
}

function formatDuration(sec) {
  if (sec % 60 === 0 && sec >= 60) return `${sec / 60} мин`
  return `${sec} сек`
}

function Badge({ children, danger }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-none ${
        danger ? 'bg-red-500/15 text-red-400' : 'bg-accent/10 text-accent'
      }`}
    >
      {children}
    </span>
  )
}

function SubscribeButton({ topicId, initial }) {
  const [subscribed, setSubscribed] = useState(initial)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    setBusy(true)
    try {
      const data = await api(`/forum/topics/${topicId}/subscription`, {
        method: 'PUT',
        body: { subscribed: !subscribed },
      })
      setSubscribed(data.isSubscribed)
    } catch {
      /* оставляем прежнее состояние */
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={subscribed}
      className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
        subscribed
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-white/10 text-text-light/70 hover:border-accent/40 hover:text-accent'
      }`}
    >
      {subscribed ? '🔔 Подписан' : '🔕 Подписаться'}
    </button>
  )
}

/**
 * Владелец категории (глава города — своего города; модератору то же самое доступно
 * через «Модерация ▾», см. ModeratorMenu) закрепляет и открепляет тему, не имея прав
 * ни на что остальное в теме. Право проверяет бэкенд (см. set_topic_pinned) — эта
 * кнопка лишь отражает already-checked `canPin`, а не подменяет проверку.
 */
function PinButton({ topic, onDone }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const toggle = async () => {
    setBusy(true)
    setError(null)
    try {
      await api(`/forum/topics/${topic.id}/${topic.isPinned ? 'unpin' : 'pin'}`, { method: 'POST' })
      setConfirm(false)
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="text-xs py-2 px-3 rounded-lg border border-white/10 text-text-light/70 hover:border-accent/40 hover:text-accent transition-colors"
      >
        {topic.isPinned ? 'Открепить' : '📌 Закрепить'}
      </button>
      {confirm && (
        <ConfirmDialog
          title={topic.isPinned ? 'Открепить тему?' : 'Закрепить тему?'}
          text={topic.isPinned ? 'Тема вернётся в общий список.' : 'Тема будет показана вверху списка категории.'}
          confirmLabel={topic.isPinned ? 'Открепить' : 'Закрепить'}
          danger={false}
          busy={busy}
          onClose={() => setConfirm(false)}
          onConfirm={toggle}
        />
      )}
      <FormError error={error} />
    </>
  )
}

/** Автор темы (не модератор — тому доступно то же через «Модерация ▾») удаляет свою тему. */
function AuthorDeleteButton({ topicId, onDeleted }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await api(`/forum/topics/${topicId}`, { method: 'DELETE' })
      onDeleted()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="text-xs py-2 px-3 rounded-lg border border-white/10 text-text-light/70 hover:border-red-400/40 hover:text-red-400 transition-colors"
      >
        Удалить тему
      </button>
      {confirm && (
        <ConfirmDialog
          title="Удалить тему?"
          text="Тема со всеми сообщениями скроется с форума."
          confirmLabel="Удалить"
          busy={busy}
          onClose={() => setConfirm(false)}
          onConfirm={remove}
        />
      )}
      <FormError error={error} />
    </>
  )
}

function ModeratorMenu({ topic, onAction }) {
  const [open, setOpen] = useState(false)

  const item = (label, action) => (
    <button
      key={label}
      onClick={() => { setOpen(false); onAction(action) }}
      className="w-full text-left px-3 py-2 text-sm text-text-light hover:text-accent hover:bg-white/5 transition-colors"
    >
      {label}
    </button>
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="text-xs py-2 px-3 rounded-lg border border-white/10 text-text-light/70 hover:border-accent/40 hover:text-accent transition-colors"
      >
        Модерация ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 top-full mt-2 z-40 w-52 py-1 rounded-xl glass overflow-hidden">
            {!topic.isDeleted && (
              <>
                {item('Изменить заголовок', 'rename')}
                {item(topic.isPinned ? 'Открепить' : 'Закрепить', 'pin')}
                {item(topic.isLocked ? 'Открыть тему' : 'Закрыть тему', 'lock')}
                {item('Задержка ответов', 'cooldown')}
                {item('Переместить', 'move')}
                {topic.isArchived ? item('Вернуть из архива', 'unarchive') : item('В архив', 'archive')}
              </>
            )}
            {topic.isDeleted ? item('Восстановить', 'restore') : item('Удалить тему', 'delete')}
          </div>
        </>
      )}
    </div>
  )
}

function ModeratorDialog({ action, topic, onClose, onDone, onDeleted }) {
  const [title, setTitle] = useState(topic.title)
  const [categoryId, setCategoryId] = useState(topic.categoryId)
  const [cooldownSec, setCooldownSec] = useState(topic.replyCooldownSec ?? 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const categories = useApiData(action === 'move' ? '/forum/categories' : null)

  const call = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await onDone(fn)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (action === 'pin') {
    return (
      <ConfirmDialog
        title={topic.isPinned ? 'Открепить тему?' : 'Закрепить тему?'}
        text={topic.isPinned ? 'Тема вернётся в общий список.' : 'Тема будет показана вверху списка категории.'}
        confirmLabel={topic.isPinned ? 'Открепить' : 'Закрепить'}
        danger={false}
        busy={busy}
        onClose={onClose}
        onConfirm={() => call(() => api(`/forum/topics/${topic.id}/${topic.isPinned ? 'unpin' : 'pin'}`, { method: 'POST' }))}
      />
    )
  }

  if (action === 'lock') {
    return (
      <ConfirmDialog
        title={topic.isLocked ? 'Открыть тему?' : 'Закрыть тему?'}
        text={topic.isLocked ? 'Игроки снова смогут отвечать.' : 'Новые ответы будут запрещены.'}
        confirmLabel={topic.isLocked ? 'Открыть' : 'Закрыть'}
        danger={false}
        busy={busy}
        onClose={onClose}
        onConfirm={() => call(() => api(`/forum/topics/${topic.id}`, { method: 'PATCH', body: { isLocked: !topic.isLocked } }))}
      />
    )
  }

  if (action === 'delete') {
    return (
      <ConfirmDialog
        title="Удалить тему?"
        text="Тема со всеми сообщениями скроется с форума. Восстановить можно в «Корзине»."
        confirmLabel="Удалить"
        busy={busy}
        onClose={onClose}
        onConfirm={() =>
          call(async () => {
            await api(`/forum/topics/${topic.id}`, { method: 'DELETE' })
            onDeleted()
          })
        }
      />
    )
  }

  if (action === 'restore') {
    return (
      <ConfirmDialog
        title="Восстановить тему?"
        text="Тема снова станет видна игрокам."
        confirmLabel="Восстановить"
        danger={false}
        busy={busy}
        onClose={onClose}
        onConfirm={() => call(() => api(`/forum/topics/${topic.id}/restore`, { method: 'POST' }))}
      />
    )
  }

  if (action === 'archive') {
    return (
      <ConfirmDialog
        title="Перенести тему в архив?"
        text="Тема пропадёт из списка категории и закроется для новых ответов. Видна только хелперу+, в /forum/archive."
        confirmLabel="В архив"
        danger={false}
        busy={busy}
        onClose={onClose}
        onConfirm={() => call(() => api(`/forum/topics/${topic.id}/archive`, { method: 'POST' }))}
      />
    )
  }

  if (action === 'unarchive') {
    return (
      <ConfirmDialog
        title="Вернуть тему из архива?"
        text="Тема снова появится в списке категории и откроется для ответов."
        confirmLabel="Вернуть"
        danger={false}
        busy={busy}
        onClose={onClose}
        onConfirm={() => call(() => api(`/forum/topics/${topic.id}/unarchive`, { method: 'POST' }))}
      />
    )
  }

  const titles = { rename: 'Изменить заголовок', cooldown: 'Задержка между сообщениями', move: 'Переместить тему' }
  const bodies = { rename: () => ({ title }), cooldown: () => ({ replyCooldownSec: cooldownSec }), move: () => ({ categoryId }) }

  return (
    <Modal
      title={titles[action]}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost text-sm py-2 px-4" disabled={busy}>Отмена</button>
          <button
            onClick={() => call(() => api(`/forum/topics/${topic.id}`, { method: 'PATCH', body: bodies[action]() }))}
            className="btn-primary text-sm py-2 px-4"
            disabled={busy || (action === 'rename' && title.trim().length < 3)}
          >
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </>
      }
    >
      {action === 'rename' ? (
        <Field label="Заголовок">
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 140))} autoFocus className={inputClass} />
        </Field>
      ) : action === 'cooldown' ? (
        <Field label="Задержка между сообщениями одного игрока, секунд (0 — выключена)">
          <input
            type="number"
            min={0}
            max={86400}
            value={cooldownSec}
            onChange={(e) => setCooldownSec(Math.max(0, Math.min(86400, Number.parseInt(e.target.value, 10) || 0)))}
            autoFocus
            className={inputClass}
          />
        </Field>
      ) : (
        <Field label="Категория">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
            disabled={categories.loading}
          >
            {(categories.data?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
            ))}
          </select>
        </Field>
      )}
      <FormError error={error} />
    </Modal>
  )
}
