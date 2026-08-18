// Сроком жизни ассетов распоряжаемся здесь, потому что хостинг этого не умеет: он
// отдаёт всё с `max-age=600`, и вернувшийся через десять минут посетитель заново
// качает весь JS, CSS и шрифт.
//
// Берём только то, чьё имя содержит хеш содержимого (`index-DqSnk5R1.js`): для таких
// «взять из кеша и не спрашивать» безопасно по построению -- другая сборка даёт другое
// имя, то есть промах кеша и свежую загрузку. Протухнуть тут нечему.
//
// В той же папке лежат файлы с постоянными именами (логотип, шрифт, favicon) -- они
// приезжают из `public/` как есть. Их кешировать так нельзя: подменённый логотип не
// дошёл бы до тех, у кого он уже осел. Они и HTML идут в сеть по обычным правилам.

const CACHE = 'pfaumc-assets-v1'

// Хвост `-<хеш>` перед расширением, как их именует сборщик. Восьми символов достаточно,
// чтобы не спутать с рукописным именем вроде `mascot-v2.png`.
const HASHED = /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/

// Записи старых сборок не вытесняются: имена уникальны, и перезаписывать нечего.
// Поэтому при накоплении сбрасываем кеш целиком -- это дешевле учёта поколений, а
// восстанавливается он одним заходом на страницу.
const MAX_ENTRIES = 150

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      const cache = await caches.open(CACHE)
      if ((await cache.keys()).length > MAX_ENTRIES) await caches.delete(CACHE)
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !HASHED.test(url.pathname)) return

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          // Кладём только полный успешный ответ: `opaque` и частичный положить нельзя,
          // а закешированная ошибка держалась бы до следующей сборки.
          if (response.ok && response.status === 200) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
    )
  )
})
