import { getPlayerByName, getPlayerByUuid } from './_lib/store.js'
import { getRole } from './_lib/roles.js'
import { getLiveStatus } from './_lib/mcsrvstat.js'
import { sanitizeNickname, isValidUuid } from './_lib/validate.js'
import { computeStats, buildActivity } from './_lib/stats.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const params = event.queryStringParameters ?? {}
  const rawUuid = params.uuid
  const nickname = sanitizeNickname(params.nickname)

  if (!nickname && !isValidUuid(rawUuid)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Некорректный запрос' }),
    }
  }

  try {
    const record = isValidUuid(rawUuid)
      ? await getPlayerByUuid(rawUuid)
      : await getPlayerByName(nickname)

    if (!record) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Игрок не найден' }),
      }
    }

    const live = await getLiveStatus().catch(() => null)
    const online = Boolean(
      live?.namesAvailable && live.players.some((p) => p.name.toLowerCase() === record.nameLower)
    )

    const daily = record.daily ?? {}

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' },
      body: JSON.stringify({
        uuid: record.uuid,
        name: record.name,
        role: getRole(record.nameLower),
        online,
        lastSeen: record.lastSeen,
        playtime: computeStats(daily, record.allTimeMin),
        activity: buildActivity(daily),
        integrations: null,
      }),
    }
  } catch (e) {
    console.error('players-profile error:', e)
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Не удалось загрузить профиль' }),
    }
  }
}
