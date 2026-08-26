import { neon } from '@netlify/neon'

// Neon serverless-драйвер по HTTP: одно соединение на вызов функции,
// пул не нужен. Все запросы параметризованные — конкатенации SQL нет нигде.
let client = null

export function db() {
  if (!client) client = neon()
  return client
}

/** Выполняет параметризованный запрос, возвращает массив строк. */
export function q(text, params = []) {
  return db().query(text, params)
}

/** Первая строка или null. */
export async function one(text, params = []) {
  const rows = await q(text, params)
  return rows[0] ?? null
}

/**
 * Транзакция для связанных операций. Neon HTTP умеет только неинтерактивные
 * транзакции — массив запросов уходит одним BEGIN/COMMIT.
 * Там, где нужен результат предыдущего шага, используем один SQL-запрос
 * с data-modifying CTE (он и так атомарен).
 */
export function tx(queries) {
  return db().transaction(queries)
}

/** Запись действия модератора в журнал. */
export function logModeration(moderatorId, action, targetType, targetId, details = {}) {
  return q(
    `INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [moderatorId, action, targetType, targetId, JSON.stringify(details)]
  )
}

/**
 * Антиспам: не чаще одного сообщения раз в COOLDOWN сек и не больше
 * BURST сообщений за BURST_WINDOW.
 * ponytail: считаем по самой таблице сообщений — отдельное хранилище счётчиков
 * не нужно, пока нагрузка форума измеряется десятками постов в минуту.
 */
const POST_COOLDOWN_SEC = Number.parseInt(process.env.FORUM_POST_COOLDOWN_SEC ?? '15', 10) || 15
const POST_BURST = 10
const POST_BURST_WINDOW_SEC = 300

export async function checkPostRateLimit(userId) {
  const row = await one(
    `SELECT
       (SELECT max(created_at) FROM forum_posts WHERE author_id = $1) AS last_at,
       (SELECT count(*)::int FROM forum_posts
         WHERE author_id = $1 AND created_at > now() - ($2 || ' seconds')::interval) AS burst`,
    [userId, String(POST_BURST_WINDOW_SEC)]
  )
  if (row?.last_at && Date.now() - new Date(row.last_at).getTime() < POST_COOLDOWN_SEC * 1000) {
    return `Подождите ${POST_COOLDOWN_SEC} секунд между сообщениями`
  }
  if ((row?.burst ?? 0) >= POST_BURST) {
    return 'Слишком много сообщений подряд. Сделайте паузу'
  }
  return null
}

function formatDuration(sec) {
  if (sec % 60 === 0 && sec >= 60) return `${sec / 60} мин`
  return `${sec} сек`
}

/** Слоумод модератора для конкретной темы, поверх глобального checkPostRateLimit. */
export async function checkTopicReplyCooldown(userId, topicId, cooldownSec) {
  if (!cooldownSec) return null
  const row = await one(
    'SELECT max(created_at) AS last_at FROM forum_posts WHERE author_id = $1 AND topic_id = $2',
    [userId, topicId]
  )
  if (row?.last_at && Date.now() - new Date(row.last_at).getTime() < cooldownSec * 1000) {
    return `В этой теме можно отвечать раз в ${formatDuration(cooldownSec)}`
  }
  return null
}
