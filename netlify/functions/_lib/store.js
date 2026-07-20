import { getStore } from '@netlify/blobs'
import { pruneDaily } from './stats.js'

// Netlify Blobs — zero-setup key/value storage bundled with the site's
// Netlify deploy, no external database account needed.
//
// Schema:
//   player:{uuid}  -> player record (see upsertPlayerSeen)
//   name-index     -> { [nameLowercase]: uuid }  — small lookup blob so search
//                      doesn't have to list every player record on each request
//
// ponytail: name-index is a single JSON blob loaded fully into the function's
// memory on search. Fine up to a few thousand known players; if the roster
// ever gets much bigger, swap for a real search index.

function playersStore() {
  return getStore('players')
}

function utcTodayKey(d) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function getPlayerByUuid(uuid) {
  const store = playersStore()
  const record = await store.get(`player:${uuid}`, { type: 'json' })
  return record ?? null
}

export async function getNameIndex() {
  const store = playersStore()
  return (await store.get('name-index', { type: 'json' })) ?? {}
}

export async function getPlayerByName(name) {
  const index = await getNameIndex()
  const uuid = index[name.toLowerCase()]
  if (!uuid) return null
  return getPlayerByUuid(uuid)
}

// Records that `uuid`/`name` was observed online just now. There is no
// join/leave event log (see netlify/functions/_lib/mcsrvstat.js), so playtime
// is approximated by crediting the gap since this player's last recorded
// "seen" tick — capped so a long absence (or the very first sighting) never
// gets counted as played time, and short polling gaps don't overcount.
const MAX_CREDIT_MIN = 3
const MAX_GAP_MIN = 5

export async function upsertPlayerSeen(uuid, name) {
  const store = playersStore()
  const now = new Date()
  const nowIso = now.toISOString()
  const todayKey = utcTodayKey(now)

  const existing = await getPlayerByUuid(uuid)

  const gapMin = existing ? (now - new Date(existing.lastSeen)) / 60000 : Infinity
  const sampleMinutes = gapMin <= MAX_GAP_MIN ? Math.min(gapMin, MAX_CREDIT_MIN) : 0

  const daily = pruneDaily(existing?.daily ?? {}, now)
  daily[todayKey] = (daily[todayKey] ?? 0) + sampleMinutes
  const allTimeMin = (existing?.allTimeMin ?? 0) + sampleMinutes

  const nameChanged = existing && existing.name !== name
  const nameHistory = existing?.nameHistory ?? []
  if (nameChanged) {
    nameHistory.push({ name: existing.name, seenAt: existing.lastSeen })
  }

  const record = {
    uuid,
    name,
    nameLower: name.toLowerCase(),
    firstSeen: existing?.firstSeen ?? nowIso,
    lastSeen: nowIso,
    nameHistory: nameHistory.slice(-10),
    allTimeMin,
    daily,
  }

  await store.setJSON(`player:${uuid}`, record)

  if (!existing || nameChanged) {
    const index = await getNameIndex()
    if (nameChanged) delete index[existing.nameLower]
    index[record.nameLower] = uuid
    await store.setJSON('name-index', index)
  }

  return record
}

// Pure — exact match first, then prefix match, then substring match.
// `query` must already be lowercased; `names` is a list of lowercased names.
export function rankNames(names, query, limit) {
  const exact = []
  const startsWith = []
  const contains = []
  for (const nameLower of names) {
    if (nameLower === query) exact.push(nameLower)
    else if (nameLower.startsWith(query)) startsWith.push(nameLower)
    else if (nameLower.includes(query)) contains.push(nameLower)
  }
  return [...exact, ...startsWith, ...contains].slice(0, limit)
}

export async function searchPlayers(query, limit) {
  const q = query.toLowerCase()
  const index = await getNameIndex()
  const names = Object.keys(index)
  const ranked = rankNames(names, q, limit)
  const records = await Promise.all(ranked.map((n) => getPlayerByUuid(index[n])))
  return records.filter(Boolean)
}
