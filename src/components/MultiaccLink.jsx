// Строка «обнаружено N мультиаккаунтов» на карточке игрока и окно с графом по клику.
//
// Граф тянется отдельно от профиля и только тем, у кого есть право: страница успевает
// отрисоваться, а строка появляется, когда придёт ответ. Числа и сам граф — из одного
// запроса, поэтому клик уже ничего не ждёт.
import { useEffect, useState } from 'react'
import { useForumAuth } from '../context/ForumAuthContext'
import { gameApi } from '../lib/gameApi'
import { pluralizeRu } from '../utils/playerFormat'
import { Modal } from './forum/ui'
import MultiaccGraph from './MultiaccGraph'

export default function MultiaccLink({ nick }) {
  const { canViewMultiacc } = useForumAuth()
  const [graph, setGraph] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setGraph(null)
    setOpen(false)
    if (!canViewMultiacc || !nick) return undefined

    const controller = new AbortController()
    let cancelled = false
    // Обход связей — самый дорогой запрос на странице, а строка по нему появляется
    // сбоку и не задерживает ничего. Ждём простоя, чтобы он не толкался с тем, что
    // на экране.
    const whenIdle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 500))
    whenIdle(() => {
      if (cancelled) return
      gameApi(`/multiacc?nicks=${encodeURIComponent(nick)}`, { withSession: true, signal: controller.signal })
        .then((doc) => { if (!cancelled) setGraph(doc) })
        // Право могли отозвать после входа, игрока — спрятать иммунитетом. И то, и другое
        // выглядит одинаково: строки просто нет.
        .catch(() => {})
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [canViewMultiacc, nick])

  const found = (graph?.nodes?.length ?? 0) - 1
  if (found < 1) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-amber-400/90 hover:text-amber-300 underline decoration-dotted underline-offset-4 transition-colors"
      >
        Обнаружено {found} {pluralizeRu(found, ['мультиаккаунт', 'мультиаккаунта', 'мультиаккаунтов'])}
      </button>

      {open && (
        <Modal title={`Связи аккаунта ${nick}`} onClose={() => setOpen(false)} wide="graph">
          <MultiaccGraph data={graph} />
        </Modal>
      )}
    </>
  )
}
