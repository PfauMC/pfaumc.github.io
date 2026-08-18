import { useEffect, useState } from 'react'
import { gameApi } from '../lib/gameApi'

/**
 * Столько же, сколько бэкенд ставит профилю в Cache-Control. Держать дольше
 * бессмысленно: по истечении этого срока повторный запрос всё равно обслужит
 * кэш браузера, зато сменённый скин появится, а не застрянет до перезагрузки.
 */
const TTL_MS = 60_000

/**
 * Сбой помним заметно короче удачи, но всё же помним: при 429 немедленный повтор
 * только углубляет отказ, а каждый рендер карточки запускал бы его заново.
 */
const FAIL_TTL_MS = 15_000

const cache = new Map()

/**
 * Добирает скин и роли профилем там, где их неоткуда взять: списки игроков теперь
 * везут их с собой, а вот аватарка в шапке знает про вошедшего только uuid.
 *
 * Обещания держим в общей карте, поэтому десяток мест, показывающих одного и того же
 * человека, стоят одного запроса.
 */
export function loadPlayerMeta(key) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < hit.ttl) return hit.promise

  const entry = { at: Date.now(), ttl: TTL_MS }
  entry.promise = gameApi(`/players/${encodeURIComponent(key)}`)
    .then((json) => json.pfaumc ?? null)
    // Разовый сбой не должен навсегда оставить игрока без скина, поэтому запись не
    // вечная -- но и не выбрасывается сразу, иначе следующий же рендер повторит запрос.
    .catch(() => {
      entry.ttl = FAIL_TTL_MS
      return null
    })
  cache.set(key, entry)
  return entry.promise
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
