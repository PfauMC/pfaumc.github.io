import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/forumApi'

/**
 * Последний ответ по каждому пути, отдельно для каждого fetcher'а: один и тот же путь у
 * форума и у городов -- разные эндпоинты. Живёт только в памяти вкладки.
 */
let responses = new WeakMap()

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

    fetcher(path, { signal: controller.signal })
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
