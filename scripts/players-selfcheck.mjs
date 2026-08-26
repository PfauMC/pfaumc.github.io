// ponytail: smallest runnable check for the players-feature logic that
// doesn't need live Netlify Blobs credentials (search ranking, input
// sanitization, display formatting). Run: node scripts/players-selfcheck.mjs
import assert from 'node:assert/strict'
import { rankNames } from '../netlify/functions/_lib/store.js'
import { sanitizeQuery, sanitizeNickname, isValidUuid, clampLimit } from '../netlify/functions/_lib/validate.js'
import {
  formatPlaytime,
  formatRelativeTime,
  formatOnlineCount,
  pluralizeRu,
  defaultSkinName,
} from '../src/utils/playerFormat.js'
import { computeStats, buildActivity, pruneDaily, ACTIVITY_RETENTION_DAYS } from '../netlify/functions/_lib/stats.js'

// --- search ranking: exact > startsWith > contains ---
assert.deepEqual(
  rankNames(['steve_alt', 'steve', 'notsteve', 'steven'], 'steve', 10),
  ['steve', 'steve_alt', 'steven', 'notsteve']
)
assert.deepEqual(rankNames(['alice', 'bob'], 'z', 10), [])
assert.equal(rankNames(['a', 'ab', 'abc', 'abcd'], 'a', 2).length, 2)

// --- validate: sanitization doesn't crash on odd input, strips disallowed chars ---
assert.equal(sanitizeQuery('  Andrey_Pfau123  '), 'Andrey_Pfau123')
assert.equal(sanitizeQuery('robert"); DROP TABLE players;--'), 'robertDROPTABLEplayers--'.replace(/[^a-zA-Z0-9_]/g, ''))
assert.equal(sanitizeQuery(''), '')
assert.equal(sanitizeQuery('a'.repeat(200)).length, 40)
assert.equal(sanitizeNickname('Steve'.padEnd(30, 'x')).length, 16)
assert.equal(isValidUuid('069a79f4-44e9-4726-a5be-fca90e38aaf5'), true)
assert.equal(isValidUuid('not-a-uuid'), false)
assert.equal(clampLimit('999', { max: 25, fallback: 20 }), 25)
assert.equal(clampLimit('abc', { max: 25, fallback: 20 }), 20)

// --- formatting ---
assert.equal(formatPlaytime(32), '32 мин')
assert.equal(formatPlaytime(270), '4,5 ч')
assert.equal(formatPlaytime(300), '5 ч')
assert.equal(formatPlaytime(2820), '1 д. 23 ч')
assert.equal(formatOnlineCount(1), '1 игрок')
assert.equal(formatOnlineCount(2), '2 игрока')
assert.equal(formatOnlineCount(5), '5 игроков')
assert.equal(formatOnlineCount(21), '21 игрок')
assert.equal(pluralizeRu(11, ['день', 'дня', 'дней']), 'дней')

const fifteenMinAgo = new Date(Date.now() - 15 * 60000).toISOString()
assert.equal(formatRelativeTime(fifteenMinAgo), '15 минут назад')

// --- stats/activity (pure, no Blobs needed) ---
const now = new Date('2026-07-20T12:00:00.000Z') // a Monday
const daily = {
  '2026-07-20': 30, // today
  '2026-07-19': 45, // yesterday (previous week, Sunday)
  '2026-07-01': 60, // earlier this month
  '2025-01-01': 120, // outside the day but within all-time
}
const stats = computeStats(daily, 500, now)
assert.equal(stats.todayMin, 30)
assert.equal(stats.weekMin, 30) // Monday-start week: only today's entry falls in it
assert.equal(stats.monthMin, 135) // 2026-07-20 + 2026-07-19 + 2026-07-01
assert.equal(stats.allTimeMin, 500)

const activity = buildActivity(daily, 5, now)
assert.equal(activity.length, 5)
assert.equal(activity.at(-1).date, '2026-07-20')
assert.equal(activity.at(-1).minutes, 30)
assert.equal(activity[0].date, '2026-07-16')
assert.equal(activity[0].minutes, 0)

const prunedResult = pruneDaily({ '2020-01-01': 10, [now.toISOString().slice(0, 10)]: 20 }, now)
assert.deepEqual(prunedResult, { '2026-07-20': 20 })
assert.equal(ACTIVITY_RETENTION_DAYS, 371)

// --- скин по умолчанию: ответы сверены с настоящей java.util.UUID и
// DefaultPlayerSkin#get, а не выведены из этой же формулы ---
for (const [uuid, expected] of [
  ['00000000-0000-0000-0000-000000000000', 'slim/alex'],
  ['ffffffff-ffff-ffff-ffff-ffffffffffff', 'slim/alex'],
  ['80000000-0000-0000-0000-000000000000', 'wide/sunny'],
  ['00000000-0000-0000-8000-000000000000', 'wide/sunny'],
  ['7fffffff-ffff-ffff-7fff-ffffffffffff', 'slim/alex'],
  ['3ffa34b9-7468-4e69-a893-290f56665617', 'slim/efe'],
  ['a6dd35d9-ff4f-46dc-b5de-808003e10e36', 'wide/alex'],
  ['7222facb-6a2f-48d3-9fd1-4a71988e086e', 'wide/steve'],
  ['03ef24cc-24f4-36c2-96fe-7c26f0b60c91', 'wide/zuri'],
  ['04ea4e03-22f4-3804-971c-a51d5f985fc8', 'wide/kai'],
  ['149c6004-bc0f-4d75-8c98-3d86cce1fdc0', 'slim/sunny'],
  ['1c798ddb-1181-36a7-8099-67e3dfb22fcf', 'wide/ari'],
]) {
  assert.equal(defaultSkinName(uuid), expected, uuid)
}
// Мусор на входе не должен ронять отрисовку головы.
assert.equal(defaultSkinName('не-uuid'), 'slim/steve')
assert.equal(defaultSkinName(undefined), 'slim/steve')

console.log('players-selfcheck: all assertions passed')
