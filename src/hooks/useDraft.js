import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/forumApi'

const AUTOSAVE_DELAY_MS = 2500

/**
 * Черновик на бэкенде — ответ в теме (`kind: 'topic'`) или первое сообщение новой
 * темы (`kind: 'category'`, с заголовком). Хранится на сервере, а не в
 * localStorage: черновик должен пережить смену устройства и очистку браузера.
 *
 * `enabled=false` (гость, нет цели) — хук ничего не запрашивает и не пишет.
 */
export function useDraft(kind, targetId, { enabled = true } = {}) {
  const path = targetId
    ? kind === 'topic'
      ? `/forum/topics/${targetId}/draft`
      : `/forum/categories/${targetId}/draft`
    : null
  const active = enabled && Boolean(path)

  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const [stored, setStored] = useState(null)
  const timerRef = useRef(null)
  const pendingRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setStored(null)
      return undefined
    }
    let cancelled = false
    api(path)
      .then((data) => { if (!cancelled) setStored(data.draft) })
      .catch(() => { /* нет черновика — тоже нормальный ответ, баннер просто не покажется */ })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, path])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const flush = useCallback(async () => {
    if (!active || !pendingRef.current) return
    const payload = pendingRef.current
    setStatus('saving')
    try {
      await api(path, { method: 'PUT', body: payload })
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [active, path])

  /** Планирует автосохранение — вызывать при каждом изменении текста. */
  const schedule = useCallback(
    (payload) => {
      pendingRef.current = payload
      clearTimeout(timerRef.current)
      if (!active) return
      timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS)
    },
    [active, flush]
  )

  /** Сохранить сразу — например, перед уходом со страницы. */
  const saveNow = useCallback(() => {
    clearTimeout(timerRef.current)
    return flush()
  }, [flush])

  /** Явный отказ от черновика («Удалить» в баннере восстановления). */
  const discard = useCallback(async () => {
    clearTimeout(timerRef.current)
    pendingRef.current = null
    setStored(null)
    setStatus('idle')
    if (!active) return
    try {
      await api(path, { method: 'DELETE' })
    } catch {
      /* лучшее из возможного — раз пользователь явно отказался, оставлять как есть некуда */
    }
  }, [active, path])

  /** После успешной публикации: сервер уже удалил черновик, локально просто забываем о нём. */
  const forget = useCallback(() => {
    clearTimeout(timerRef.current)
    pendingRef.current = null
    setStored(null)
    setStatus('idle')
  }, [])

  return { status, stored, schedule, saveNow, discard, forget }
}
