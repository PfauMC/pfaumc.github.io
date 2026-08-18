import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useApiData } from '../../hooks/useApiData'
import { useForumAuth } from '../../context/ForumAuthContext'
import { api } from '../../lib/forumApi'
import { formatSmartTime } from '../../lib/forumFormat'
import {
  Breadcrumbs, ListSkeleton, ErrorState, EmptyState, Pagination, LoginNotice, ConfirmDialog, FormError, UserHead, RoleBadge, Toggle,
} from '../../components/forum/ui'
import { PROVIDERS, ProviderIcon } from '../../components/forum/providers'
import SignatureEditor from '../../components/forum/SignatureEditor'
import SignatureBlock from '../../components/forum/SignatureBlock'

function Shell({ title, children, crumb }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: 'Форум', to: '/forum' }, { label: crumb }]} />
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-heading mb-6">{title}</h1>
        {children}
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useForumAuth()
  if (loading) return <ListSkeleton rows={3} />
  if (!user) return <LoginNotice text="Этот раздел доступен авторизованным игрокам." />
  return children
}

/* ===== Мои ответы ===== */
export function MyPostsPage() {
  useSEO('Мои ответы — Форум PfauMC')
  const { user } = useForumAuth()
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useApiData(user ? `/forum/my-posts?page=${page}` : null)

  return (
    <Shell title="Мои ответы" crumb="Мои ответы">
      <RequireAuth>
        {loading && !data ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data?.posts.length ? (
          <EmptyState icon="✍️" title="Вы ещё ничего не писали" text="Найдите интересную тему и ответьте в ней." />
        ) : (
          <>
            <div className="space-y-3">
              {data.posts.map((p) => (
                <Link key={p.id} to={`/forum/t/${p.topicId}?post=${p.postNumber}`} className="card block group hover:border-accent/25">
                  <h2 className="font-medium text-heading group-hover:text-accent transition-colors truncate">{p.topicTitle}</h2>
                  <p className="text-xs text-text-light/50 mt-1">
                    {p.categoryTitle} · #{p.postNumber} · {formatSmartTime(p.createdAt)}
                  </p>
                  <p className="text-sm text-text-light/70 mt-2 leading-relaxed">{p.excerpt}</p>
                </Link>
              ))}
            </div>
            <Pagination page={data.page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
          </>
        )}
      </RequireAuth>
    </Shell>
  )
}

/* ===== Подписки ===== */
export function SubscriptionsPage() {
  useSEO('Подписки — Форум PfauMC')
  const { user } = useForumAuth()
  const { data, loading, error, reload } = useApiData(user ? '/forum/subscriptions' : null)
  const [busyId, setBusyId] = useState(null)

  const unsubscribe = async (topicId) => {
    setBusyId(topicId)
    try {
      await api(`/forum/topics/${topicId}/subscription`, { method: 'PUT', body: { subscribed: false } })
      reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Shell title="Подписки" crumb="Подписки">
      <RequireAuth>
        {loading && !data ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data?.topics.length ? (
          <EmptyState icon="🔔" title="Подписок нет" text="Подпишитесь на тему, чтобы получать уведомления о новых ответах." />
        ) : (
          <div className="space-y-3">
            {data.topics.map((t) => (
              <div key={t.id} className="card flex items-center gap-3">
                <UserHead user={t.lastPostAuthor ?? t.author} size={36} link={false} />
                <div className="min-w-0 flex-1">
                  <Link to={`/forum/t/${t.id}`} className="font-medium text-heading hover:text-accent transition-colors truncate block">
                    {t.title}
                    {t.hasUnread && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-accent align-middle" />}
                  </Link>
                  <p className="text-xs text-text-light/50 mt-0.5">
                    {t.categoryTitle} · {formatSmartTime(t.lastPostAt)}
                  </p>
                </div>
                <button
                  onClick={() => unsubscribe(t.id)}
                  disabled={busyId === t.id}
                  className="flex-shrink-0 text-xs py-1.5 px-3 rounded-lg border border-white/10 text-text-light/60 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-50"
                >
                  Отписаться
                </button>
              </div>
            ))}
          </div>
        )}
      </RequireAuth>
    </Shell>
  )
}

/* ===== Настройки ===== */

const LINK_ERRORS = {
  provider_taken: 'К этому игроку уже привязан другой аккаунт этого сервиса.',
  limit_reached: 'На этот аккаунт сервиса уже привязано максимум игроков.',
  denied: 'Вход в сервис не подтверждён.',
  session: 'Сессия истекла. Войдите заново и повторите.',
  provider_error: 'Сервис не ответил. Попробуйте позже.',
  provider_unavailable: 'Привязка через этот сервис сейчас недоступна.',
  internal: 'Что-то пошло не так. Попробуйте позже.',
}

function ProviderLinks() {
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const linked = params.get('linked')
  const linkError = params.get('link_error')
  const { data, loading } = useApiData('/auth/identities')
  const identities = data?.identities ?? []

  const start = async (key) => {
    setBusy(key)
    setError(null)
    try {
      const { url } = await api(`/auth/link/${key}/start`, { method: 'POST' })
      // Привязка кончается редиректом обратно на эту страницу, значит это переход, а не fetch.
      window.location.href = url
    } catch (e) {
      setError(e.message)
      setBusy(null)
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="font-mono font-semibold text-heading">Внешние аккаунты</h2>
      <p className="text-sm text-text-light/70">
        Привяжите сервис, чтобы входить на форум без{' '}
        <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/auth</code> в игре.
        На каждый сервис по одной привязке; одним аккаунтом сервиса можно владеть несколькими игроками.
      </p>
      {linked && (
        <p className="text-sm text-green-400">
          {PROVIDERS.find((p) => p.key === linked)?.label ?? linked} привязан.
        </p>
      )}
      {linkError && (
        <p className="text-sm text-red-400">{LINK_ERRORS[linkError] ?? 'Не удалось привязать аккаунт.'}</p>
      )}
      {!loading && identities.length > 0 && (
        <ul className="space-y-1.5">
          {identities.map((it, i) => {
            const meta = PROVIDERS.find((p) => p.key === it.provider)
            return (
              <li
                key={`${it.provider}-${i}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-black/20 text-sm"
              >
                <ProviderIcon
                  provider={it.provider}
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: meta?.color }}
                />
                <span className="text-heading">{meta?.label ?? it.provider}</span>
                {it.label && <span className="text-text-light/60 truncate">{it.label}</span>}
                <span className="ml-auto text-xs text-green-400 flex-shrink-0">привязан</span>
              </li>
            )
          })}
        </ul>
      )}
      {/* На каждый сервис по одной привязке, поэтому привязанные из выбора уходят. */}
      {!loading && (
        <div className="grid gap-2 sm:grid-cols-2">
          {PROVIDERS.filter((p) => !identities.some((it) => it.provider === p.key)).map((p) => (
            <button
              key={p.key}
              onClick={() => start(p.key)}
              disabled={busy !== null}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10 bg-bg-section text-sm font-medium text-heading hover:border-accent/40 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <ProviderIcon provider={p.key} className="w-5 h-5 flex-shrink-0" style={{ color: p.color }} />
              {busy === p.key ? 'Открываем…' : `Привязать ${p.label}`}
            </button>
          ))}
        </div>
      )}
      {!loading && identities.length > 0 && (
        <p className="text-xs text-text-light/50">
          На каждый сервис по одной привязке. Чтобы сменить привязанный аккаунт, напишите администрации.
        </p>
      )}
      <FormError error={error} />
    </section>
  )
}

/**
 * Подпись сохраняется отдельной кнопкой, не на каждый ввод как тумблеры —
 * поэтому это свой api()-вызов, а не переиспользование update() из родителя:
 * там успех/ошибка относятся к «Уведомлениям» и появились бы в чужой карточке.
 */
function SignatureSection({ user, setUser }) {
  const [text, setText] = useState(user.signature ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Смена аккаунта (мультиакк) — подтягиваем подпись нового, а не оставляем черновик прежнего.
  useEffect(() => {
    setText(user.signature ?? '')
    setSaved(false)
  }, [user.id])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const data = await api('/auth/settings', {
        method: 'PATCH',
        body: {
          notifyReplies: user.notify.replies,
          notifyMentions: user.notify.mentions,
          notifySubscriptions: user.notify.subscriptions,
          showSignatures: user.showSignatures,
          signature: text,
        },
      })
      setUser(data.user)
      setSaved(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const dirty = text !== (user.signature ?? '')

  return (
    <section className="card space-y-3">
      <h2 className="font-mono font-semibold text-heading">Подпись</h2>
      <p className="text-sm text-text-light/70">
        Показывается под каждым вашим сообщением на форуме. Меняете подпись один раз — она сразу
        обновляется везде, включая старые сообщения.
      </p>
      <SignatureEditor value={text} onChange={setText} />
      {text.trim() && (
        <div>
          <p className="text-xs text-text-light/50 mb-1.5">Предпросмотр:</p>
          <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
            <p className="text-sm text-text-light/70">Так подпись будет выглядеть под сообщением.</p>
            <SignatureBlock text={text} keyPrefix="sig-preview" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="btn-primary text-sm py-2 px-4 disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving ? 'Сохраняем…' : 'Сохранить подпись'}
        </button>
        {saved && !saving && <span className="text-xs text-green-400">Сохранено</span>}
      </div>
      <FormError error={error} />
    </section>
  )
}

export function ForumSettingsPage() {
  useSEO('Настройки — Форум PfauMC')
  const { user, setUser, logoutEverywhere } = useForumAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false)

  const update = async (patch) => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const data = await api('/auth/settings', {
        method: 'PATCH',
        body: {
          notifyReplies: user.notify.replies,
          notifyMentions: user.notify.mentions,
          notifySubscriptions: user.notify.subscriptions,
          showSignatures: user.showSignatures,
          signature: user.signature,
          ...patch,
        },
      })
      setUser(data.user)
      setSaved(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell title="Настройки" crumb="Настройки">
      <RequireAuth>
        {user && (
          <div className="space-y-5">
            <div className="card flex items-center gap-4">
              <UserHead user={user} size={56} link={false} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-heading">{user.name}</span>
                  <RoleBadge role={user.role} />
                </div>
                <p className="text-xs text-text-light/50 mt-1">На форуме {formatSmartTime(user.createdAt)}</p>
              </div>
            </div>

            <section className="card space-y-4">
              <h2 className="font-mono font-semibold text-heading">Уведомления</h2>
              <Toggle
                checked={user.notify.replies}
                onChange={(v) => update({ notifyReplies: v })}
                label="Ответы на мои сообщения"
              />
              <Toggle
                checked={user.notify.mentions}
                onChange={(v) => update({ notifyMentions: v })}
                label="Упоминания через @Ник"
              />
              <Toggle
                checked={user.notify.subscriptions}
                onChange={(v) => update({ notifySubscriptions: v })}
                label="Новые ответы в темах, на которые я подписан"
              />
              <Toggle
                checked={user.showSignatures !== false}
                onChange={(v) => update({ showSignatures: v })}
                label="Показывать подписи других пользователей"
              />
              {saving && <p className="text-xs text-text-light/50">Сохраняем…</p>}
              {saved && !saving && <p className="text-xs text-green-400">Сохранено</p>}
              <FormError error={error} />
            </section>

            <SignatureSection user={user} setUser={setUser} />

            <section className="card space-y-3">
              <h2 className="font-mono font-semibold text-heading">Подписки</h2>
              <p className="text-sm text-text-light/70">Список тем, на которые вы подписаны, — на отдельной странице.</p>
              <Link to="/forum/subscriptions" className="btn-ghost text-sm py-2 px-4 inline-flex">Открыть подписки</Link>
            </section>

            <ProviderLinks />

            <section className="card space-y-3">
              <h2 className="font-mono font-semibold text-heading">Безопасность</h2>
              <p className="text-sm text-text-light/70">
                Завершите все сессии, если входили с чужого устройства. После этого понадобится новый{' '}
                <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-accent">/auth</code>.
              </p>
              <button
                onClick={() => setConfirmLogoutAll(true)}
                className="text-sm py-2 px-4 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-500/10 font-semibold transition-colors"
              >
                Завершить все сессии
              </button>
            </section>
          </div>
        )}

        {confirmLogoutAll && (
          <ConfirmDialog
            title="Завершить все сессии?"
            text="Вы выйдете из форума на всех устройствах, включая текущее."
            confirmLabel="Завершить"
            onClose={() => setConfirmLogoutAll(false)}
            onConfirm={async () => {
              await logoutEverywhere()
              setConfirmLogoutAll(false)
            }}
          />
        )}
      </RequireAuth>
    </Shell>
  )
}
