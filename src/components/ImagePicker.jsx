import { useRef, useState } from 'react'
import { imageUrl, uploadImage } from '../lib/guideApi'

/**
 * Выбор картинок с загрузкой сразу при выборе: наружу отдаёт только id загруженных.
 * PNG/JPEG/WebP до 2 МБ — то же, что проверяет бэкенд.
 */
export default function ImagePicker({ ids, onChange, max, label = 'Добавить картинку' }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pick = async (event) => {
    const files = [...event.target.files].slice(0, max - ids.length)
    event.target.value = ''
    if (!files.length) return
    setBusy(true); setError(null)
    try {
      const uploaded = []
      for (const file of files) uploaded.push(await uploadImage(file))
      onChange([...ids, ...uploaded])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => (
          <div key={id} className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10">
            <img src={imageUrl(id)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(ids.filter((x) => x !== id))}
              className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white text-xs leading-none"
              aria-label="Убрать картинку"
            >×</button>
          </div>
        ))}
        {ids.length < max && (
          <button
            type="button"
            onClick={() => input.current.click()}
            disabled={busy}
            className="w-24 h-16 rounded-lg border border-dashed border-accent/40 text-accent text-[11px] px-2 disabled:opacity-50"
          >
            {busy ? 'Загружаем…' : `＋ ${label}`}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple={max > 1} hidden onChange={pick} />
      <p className="text-[11px] text-text-light/40 mt-1.5">PNG, JPEG или WebP до 2 МБ{max > 1 && `, не больше ${max}`}</p>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
