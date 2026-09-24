import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/forumApi'

/**
 * Последний ответ по каждому пути, отдельно для каждого fetcher'а: один и тот же путь у
 * форума и у городов -- разные эндпоинты. Живёт только в памяти вкладки.
 */
let responses = new WeakMap()
let prefetched = new WeakMap()

function mapOf(store, fetcher) {
  let map = store.get(fetcher)
  if (!map) {
    map = new Map()
    store.set(fetcher, map)
  }
  return map
}

const cacheOf = (fetcher) => mapOf(responses, fetcher)

/** Ответы зависят от того, кто смотрит, поэтому при смене аккаунта чужое не показываем. */
export function clearApiDataCache() {
  responses = new WeakMap()
  prefetched = new WeakMap()
}

/**
 * Запускает запрос до того, как страница смонтируется: её чанк ещё качается, а данные
 * уже в пути. Первый useApiData с тем же путём подхватит этот запрос вместо своего.
 */
export function prefetchApiData(path, fetcher = api) {
  const pending = mapOf(prefetched, fetcher)
  if (pending.has(path)) return
  const request = fetcher(path)
  request.catch(() => {})
  pending.set(path, { request, at: Date.now() })
}

/** Невостребованный вовремя запрос не отдаём: позже его ответ -- уже устаревшие данные. */
const PREFETCH_TTL_MS = 10_000

function takePrefetched(fetcher, path) {
  const pending = mapOf(prefetched, fetcher)
  const entry = pending.get(path)
  pending.delete(path)
  return entry && Date.now() - entry.at < PREFETCH_TTL_MS ? entry.request : undefined
}

/**
 * Загрузка любого GET-эндпоинта /api/* с состояниями loading/error и повтором.
 * path === null — запрос не выполняется (например, пока не готов параметр).
 *
 * Повторный заход на уже виденный путь сразу рисует прошлый ответ, а свежий
 * запрашивается фоном и молча его подменяет -- без скелетона на каждый возврат.
 */
export function useApiData(path, { skip = false, fetcher = api } = {}) {
  const active = path !== null && !skip
  const [data, setData] = useState(() => (active ? cacheOf(fetcher).get(path) ?? null : null))
  const [loading, setLoading] = useState(() => active && !cacheOf(fetcher).has(path))
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setLoading(false)
      return undefined
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const cache = cacheOf(fetcher)
    if (cache.has(path)) {
      setData(cache.get(path))
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(null)

    const request = takePrefetched(fetcher, path) ?? fetcher(path, { signal: controller.signal })
    request
      .then((result) => {
        cache.set(path, result)
        if (!controller.signal.aborted) setData(result)
      })
      .catch((e) => {
        if (e.name !== 'AbortError' && !controller.signal.aborted) setError(e)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [active, path, nonce, fetcher])

  useEffect(() => () => abortRef.current?.abort(), [])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, loading, error, reload, setData }
}
