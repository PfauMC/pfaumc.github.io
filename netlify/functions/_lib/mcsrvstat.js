const SERVER_HOST = 'play.pfaumc.online'

// Thin wrapper around the public mcsrvstat.us status API — the only live
// "who's online" source this project has today. mcsrvstat only returns
// per-player names/UUIDs when the server's query protocol is enabled
// (server.properties: enable-query=true); until then `namesAvailable` is
// false and callers must not pretend the server is empty.
export async function getLiveStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER_HOST}`)
  if (!res.ok) throw new Error('mcsrvstat request failed')
  const data = await res.json()
  const list = data.players?.list ?? null

  return {
    online: data.online ?? false,
    count: data.players?.online ?? 0,
    max: data.players?.max ?? 0,
    namesAvailable: Array.isArray(list),
    players: Array.isArray(list)
      ? list.map((p) => (typeof p === 'string' ? { name: p, uuid: null } : { name: p.name, uuid: p.uuid ?? null }))
      : [],
  }
}
