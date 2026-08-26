// Расширение указано явно, чтобы файл импортировался и из Node (selfcheck).
import { pluralizeRu, formatRelativeTime } from '../utils/playerFormat.js'

export { pluralizeRu, formatRelativeTime }

const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(iso) {
  if (!iso) return ''
  return dateTimeFmt.format(new Date(iso))
}

/** «5 минут назад» для свежего, полная дата для старого. */
export function formatSmartTime(iso) {
  if (!iso) return ''
  const age = Date.now() - new Date(iso).getTime()
  return age < 7 * 86400_000 ? formatRelativeTime(iso) : formatDateTime(iso)
}

export function formatCount(n, forms) {
  return `${n} ${pluralizeRu(n, forms)}`
}

export const COUNT_TOPICS = ['тема', 'темы', 'тем']
export const COUNT_MESSAGES = ['сообщение', 'сообщения', 'сообщений']
export const COUNT_REPLIES = ['ответ', 'ответа', 'ответов']
export const COUNT_VIEWS = ['просмотр', 'просмотра', 'просмотров']

/** Должен совпадать с белым списком на сервере (pfaumc-backend/src/web/forum.rs). */
export const REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '😢']

export const REPORT_REASON_LABELS = {
  spam: 'Спам или реклама',
  insult: 'Оскорбление',
  offtopic: 'Не по теме',
  rules: 'Нарушение правил',
  other: 'Другое',
}

export const MOD_ACTION_LABELS = {
  'group.create': 'создал раздел',
  'group.update': 'изменил раздел',
  'group.delete': 'удалил раздел',
  'group.reorder': 'изменил порядок разделов',
  'category.create': 'создал категорию',
  'category.update': 'изменил категорию',
  'category.delete': 'удалил категорию',
  'category.restore': 'восстановил категорию',
  'category.reorder': 'изменил порядок категорий',
  'topic.create': 'создал тему',
  'topic.update': 'изменил тему',
  'topic.delete': 'удалил тему',
  'topic.restore': 'восстановил тему',
  'post.edit': 'отредактировал сообщение',
  'post.delete': 'удалил сообщение',
  'post.restore': 'восстановил сообщение',
  'report.resolved': 'закрыл жалобу',
  'report.rejected': 'отклонил жалобу',
  'report.open': 'переоткрыл жалобу',
  'player.mute': 'выдал мут',
  'player.unmute': 'снял мут',
  'category.archive': 'перенёс категорию в архив',
  'category.unarchive': 'вернул категорию из архива',
  'topic.archive': 'перенёс тему в архив',
  'topic.unarchive': 'вернул тему из архива',
}
