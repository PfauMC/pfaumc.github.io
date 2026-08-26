import { getLiveStatus } from './_lib/mcsrvstat.js'
import { getNameIndex, upsertPlayerSeen } from './_lib/store.js'
import { resolveUuid } from './_lib/mojang.js'
import { getRole } from './_lib/roles.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const status = await getLiveStatus()

    let players = []
    if (status.namesAvailable && status.players.length > 0) {
      const index = await getNameIndex()

      players = await Promise.all(
        status.players.map(async (p) => {
          let uuid = p.uuid ?? index[p.name.toLowerCase()] ?? null
          if (!uuid) {
            const resolved = await resolveUuid(p.name)
            uuid = resolved?.uuid ?? null
          }
          if (uuid) {
            await upsertPlayerSeen(uuid, p.name)
          }
          return uuid ? { uuid, name: p.name, role: getRole(p.name.toLowerCase()) } : null
        })
      )
      players = players.filter(Boolean)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' },
      body: JSON.stringify({
        online: status.online,
        count: status.count,
        max: status.max,
        namesAvailable: status.namesAvailable,
        players,
      }),
    }
  } catch {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Не удалось получить список игроков онлайн' }),
    }
  }
}
