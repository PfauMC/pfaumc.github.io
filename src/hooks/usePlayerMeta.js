import { useEffect, useState } from 'react'
import { gameApi } from '../lib/gameApi'

/**
 * Столько же, сколько бэкенд ставит профилю в Cache-Control. Держать дольше
 * бессмысленно: по истечении этого срока повторный запрос всё равно обслужит
 * кэш браузера, зато сменённый скин появится, а не застрянет до перезагрузки.
 */
const TTL_MS = 60_000

const cache = new Map()

/**
 * Скин и роль лежат в профиле, а список игроков их не отдаёт — добираем на
 * каждого отдельно. Обещания держим в общей карте, поэтому десяток карточек
 * одного игрока и обновление списка раз в полминуты стоят одного запроса.
 */
export function loadPlayerMeta(key) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise

  const promise = gameApi(`/players/${encodeURIComponent(key)}`)
    .then((json) => json.pfaumc ?? null)
    .catch(() => {
      // Разовый сбой не должен навсегда оставить игрока без скина.
      cache.delete(key)
      return null
    })
  cache.set(key, { at: Date.now(), promise })
  return promise
}

export function usePlayerMeta(key) {
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    setMeta(null)
    if (!key) return

    let cancelled = false
    // Сам запрос не отменяем: он общий для всех, кто ждёт этого игрока.
    loadPlayerMeta(key).then((value) => {
      if (!cancelled) setMeta(value)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return meta
}
