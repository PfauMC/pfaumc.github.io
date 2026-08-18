// Клиент API городов (auth.pfaumc.io/api/v1/cities/*). Та же сессия, CSRF и формат
// ошибок, что и у форума — используем общее ядро из forumApi, а не копию.
import { GAME_API_BASE } from './gameApi'
import { apiRequest } from './forumApi'

export async function citiesApi(path, opts) {
  return apiRequest(`${GAME_API_BASE}/api/v1/cities${path}`, opts)
}
