import { GAME_API_BASE } from './gameApi'
import { ApiError, apiRequest, readCsrfCookie } from './forumApi'

export function guideApi(path, opts) {
  return apiRequest(`${GAME_API_BASE}/api/v1/guide${path}`, opts)
}

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export const imageUrl = (id) => `${GAME_API_BASE}/api/v1/uploads/${id}`

/** Загрузка картинки (путеводитель, обложка города). Тело — сам файл, ответ — его id. */
export async function uploadImage(file) {
  if (file.size > MAX_IMAGE_BYTES) throw new ApiError(`«${file.name}» больше 2 МБ`, 413)
  const res = await fetch(`${GAME_API_BASE}/api/v1/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-CSRF-Token': readCsrfCookie() },
    credentials: 'include',
    body: file,
  }).catch(() => { throw new ApiError('Нет соединения с сервером', 0, 'network') })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error ?? 'Не удалось загрузить картинку', res.status, data.code)
  return data.id
}
