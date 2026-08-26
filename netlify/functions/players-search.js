import { searchPlayers } from './_lib/store.js'
import { getRole } from './_lib/roles.js'
import { getLiveStatus } from './_lib/mcsrvstat.js'
import { sanitizeQuery, clampLimit } from './_lib/validate.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const params = event.queryStringParameters ?? {}
  const query = sanitizeQuery(params.q)
  const limit = clampLimit(params.limit, { max: 25, fallback: 20 })

  if (!query) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '', results: [] }),
    }
  }

  try {
    const [records, live] = await Promise.all([
      searchPlayers(query, limit),
      getLiveStatus().catch(() => null),
    ])

    const onlineNames = new Set(
      live?.namesAvailable ? live.players.map((p) => p.name.toLowerCase()) : []
    )

    const results = records.map((r) => ({
      uuid: r.uuid,
      name: r.name,
      role: getRole(r.nameLower),
      online: onlineNames.has(r.nameLower),
      lastSeen: r.lastSeen,
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, results }),
    }
  } catch (e) {
    console.error('players-search error:', e)
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Не удалось выполнить поиск игроков' }),
    }
  }
}
