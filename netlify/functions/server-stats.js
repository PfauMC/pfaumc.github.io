// Статистика сервера с mcwatch.online: текущее состояние, сводка за неделю и
// почасовой онлайн за эту и прошлую неделю для графика.
//
// Ходим за данными с сервера, а не из браузера: у mcwatch нет CORS-заголовков,
// ответ за две недели весит ~26 КБ, и его можно закэшировать на CDN.
const MCWATCH = 'https://mcwatch.online'
const SLUG = process.env.MCWATCH_SLUG ?? 'pfaumc'

// В Москве нет перехода на летнее время, поэтому смещение постоянное.
const MSK_OFFSET_MS = 3 * 3600_000
const HOUR_MS = 3600_000
const WEEK_HOURS = 168

export const config = { path: '/api/server/stats' }

/** Начало недели (понедельник 00:00 по Москве) для указанного момента, в UTC. */
function weekStart(date) {
  const msk = new Date(date.getTime() + MSK_OFFSET_MS)
  const weekday = (msk.getUTCDay() + 6) % 7 // 0 — понедельник
  const midnight = Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), msk.getUTCDate())
  return new Date(midnight - weekday * 24 * HOUR_MS - MSK_OFFSET_MS)
}

async function mcwatch(path) {
  const res = await fetch(`${MCWATCH}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'pfaumc.io' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`mcwatch ${path} -> ${res.status}`)
  return res.json()
}

/**
 * Раскладывает бакеты mcwatch по часам недели.
 * Ширину бакета выбирает API (для двух недель это уже час), но на случай
 * более мелких бакетов складываем их в часовые слоты.
 */
function toWeekSeries(buckets, startMs) {
  const avg = new Array(WEEK_HOURS).fill(null)
  const max = new Array(WEEK_HOURS).fill(null)
  const sum = new Array(WEEK_HOURS).fill(0)
  const count = new Array(WEEK_HOURS).fill(0)

  for (const b of buckets) {
    const hour = Math.floor((new Date(b.bucket).getTime() - startMs) / HOUR_MS)
    if (hour < 0 || hour >= WEEK_HOURS) continue
    sum[hour] += b.avg_online
    count[hour] += 1
    max[hour] = Math.max(max[hour] ?? 0, b.max_online)
  }

  for (let i = 0; i < WEEK_HOURS; i++) {
    if (count[i]) avg[i] = Math.round((sum[i] / count[i]) * 10) / 10
  }
  return { avg, max }
}

export default async (req) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })

  const now = new Date()
  const currentStart = weekStart(now)
  const previousStart = new Date(currentStart.getTime() - 7 * 24 * HOUR_MS)

  try {
    const [server, summary, history] = await Promise.all([
      mcwatch(`/servers/${SLUG}`),
      mcwatch(
        `/servers/${SLUG}/history/summary?from=${encodeURIComponent(previousStart.toISOString())}` +
          `&to=${encodeURIComponent(now.toISOString())}`
      ),
      mcwatch(
        `/servers/${SLUG}/history/online?from=${encodeURIComponent(previousStart.toISOString())}` +
          `&to=${encodeURIComponent(now.toISOString())}`
      ),
    ])

    const currentMs = currentStart.getTime()
    const buckets = Array.isArray(history) ? history : []
    const currentWeek = buckets.filter((b) => new Date(b.bucket).getTime() >= currentMs)
    const previousWeek = buckets.filter((b) => new Date(b.bucket).getTime() < currentMs)

    const peak = buckets.reduce(
      (best, b) => (b.max_online > (best?.max_online ?? -1) ? b : best),
      null
    )

    const head = server.headline ?? {}

    return Response.json(
      {
        online: head.online ?? 0,
        maxOnline: head.max_online ?? 0,
        isUp: head.ok ?? false,
        motd: (head.motd ?? '').split('\n').map((l) => l.trim()).filter(Boolean),
        version: head.version_name ?? null,
        ip: head.resolved_ip ?? null,
        host: server.targets?.[0]?.host ?? null,
        checkedAt: head.ts ?? null,
        uptimePct: summary.uptime_pct ?? null,
        avgDay: summary.avg_online_day ?? null,
        avgWeek: summary.avg_online_week ?? null,
        firstObservedAt: summary.first_observed_at ?? null,
        peak: peak ? { value: peak.max_online, at: peak.bucket } : null,
        weeks: {
          currentStart: currentStart.toISOString(),
          previousStart: previousStart.toISOString(),
          current: toWeekSeries(currentWeek, currentMs),
          previous: toWeekSeries(previousWeek, previousStart.getTime()),
        },
        source: `${MCWATCH}/servers/${SLUG}`,
      },
      {
        headers: {
          // mcwatch обновляет данные раз в несколько минут — чаще ходить незачем.
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (e) {
    console.error('server-stats error:', e)
    return Response.json(
      { error: 'Не удалось получить статистику сервера' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
