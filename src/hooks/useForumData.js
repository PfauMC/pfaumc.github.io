import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/forumApi'

/**
 * Загрузка GET-эндпоинта форума с состояниями loading/error и повтором.
 * path === null — запрос не выполняется (например, пока не готов параметр).
 */
export function useForumData(path, { skip = false } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!skip && Boolean(path))
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!path || skip) {
      setLoading(false)
      return undefined
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    api(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((e) => {
        if (e.name !== 'AbortError' && !controller.signal.aborted) setError(e)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [path, skip, nonce])

  useEffect(() => () => abortRef.current?.abort(), [])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, loading, error, reload, setData }
}
