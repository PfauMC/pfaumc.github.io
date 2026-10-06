import { GAME_API_BASE } from './gameApi'
import { apiRequest } from './forumApi'

export const PLANS = [
  { key: 'fun', name: 'Фанат', price: 99, benefits: ['Префикс подписки', 'Сообщение о входе', 'Донат-чат'] },
  { key: 'maecenas', name: 'Меценат', price: 249, benefits: ['Всё из Фаната', 'Частицы', 'Шляпа из блока', 'Кастомный суффикс', 'Выделенные объявления', 'Выделение профиля на форуме', 'Кастомное оформление 1 своего места в Путеводителе'] },
  { key: 'sponsor', name: 'Спонсор', price: 499, benefits: ['Всё из Мецената', 'Улучшенные лимиты суффикса и объявлений', 'Кастомное сообщение о входе', 'Звук входа', 'Звук смерти', 'Расширенное выделение профиля', 'Баннер профиля', 'Кастомное оформление до 3 своих мест в Путеводителе', 'Выделение своего города'] },
]

export const planRank = (plan) => ({ fun: 1, maecenas: 2, sponsor: 3 })[plan] ?? 0
export const planName = (plan) => PLANS.find((p) => p.key === plan)?.name ?? plan
export const subscriptionApi = (path, opts) => apiRequest(`${GAME_API_BASE}/api/v1/subscriptions${path}`, opts)
