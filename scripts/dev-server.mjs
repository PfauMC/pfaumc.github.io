// Локальный API-сервер форума: поднимает netlify/functions/{forum,auth}.js
// поверх PGlite. Ни Netlify-аккаунта, ни Docker, ни внешней БД не нужно.
//
//   node scripts/dev-server.mjs            # API на :8787
//   npm run dev                            # рядом, Vite на :5173 (проксирует /api)
//
// Флаги: --name Ник  --reset  (--reset пересоздаёт демо-данные с нуля)
//
// ponytail: это dev-инструмент, а не второй бэкенд. Функции импортируются
// как есть — локально исполняется ровно тот же код, что и в проде.
import { createServer } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { register } from 'node:module'

const PORT = Number.parseInt(process.env.FORUM_DEV_PORT ?? '8787', 10)
const SITE = process.env.FORUM_DEV_SITE ?? 'http://localhost:5173'
const args = process.argv.slice(2)
const nickname = args[args.indexOf('--name') + 1]?.replace(/[^A-Za-z0-9_]/g, '') || 'Moderator'

if (args.includes('--reset')) {
  await rm('./.dev-db', { recursive: true, force: true })
  console.log('• демо-база очищена')
}

process.env.FORUM_PLUGIN_SECRET ??= 'dev-secret'
process.env.FORUM_SITE_URL ??= SITE

// Подменяем @netlify/neon на PGlite ДО импорта функций.
register('./dev-loader.mjs', import.meta.url)

const { rawDb } = await import('./dev-neon-shim.mjs')
const forumFn = (await import('../netlify/functions/forum.js')).default
const authFn = (await import('../netlify/functions/auth.js')).default
const serverStatsFn = (await import('../netlify/functions/server-stats.js')).default
const { sha256, randomToken } = await import('../netlify/functions/_lib/forum/auth.js')

/* ---------- схема ---------- */
const schema = await readFile(new URL('../netlify/functions/_lib/schema.sql', import.meta.url), 'utf8')
for (const statement of schema
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((l) => l.trim().startsWith('--')))) {
  await rawDb.exec(statement)
}
console.log('• схема применена')

/* ---------- демо-данные ---------- */
const MOD_UUID = '11111111-2222-3333-4444-555555555555'
const PLAYER_UUID = '99999999-8888-7777-6666-555555555555'

const { rows: existing } = await rawDb.query('SELECT count(*)::int AS n FROM forum_categories')
const fresh = existing[0].n === 0

await rawDb.query(
  `INSERT INTO forum_users (mc_uuid, name, name_lower, role_key, last_login_at)
   VALUES ($1, $2, lower($2), 'moderator', now())
   ON CONFLICT (mc_uuid) DO UPDATE SET name = EXCLUDED.name, name_lower = EXCLUDED.name_lower, role_key = 'moderator'`,
  [MOD_UUID, nickname]
)
await rawDb.query(
  `INSERT INTO forum_users (mc_uuid, name, name_lower, role_key)
   VALUES ($1, 'Kirill_MC', 'kirill_mc', 'player') ON CONFLICT (mc_uuid) DO NOTHING`,
  [PLAYER_UUID]
)

if (fresh) {
  await rawDb.exec(`
    INSERT INTO forum_groups (title, position) VALUES
      ('Общий раздел', 0),
      ('Помощь и заявки', 1);

    INSERT INTO forum_categories (group_id, slug, title, description, icon, position) VALUES
      (1,'novosti','Новости сервера','Анонсы обновлений, ивентов и технических работ','📢',0),
      (1,'obsuzhdenie','Обсуждение','Общие разговоры об игре и сервере','💬',1),
      (2,'voprosy','Вопросы и помощь','Не работает механика? Спросите здесь','❓',2),
      (2,'zayavki','Заявки и жалобы','Заявки на разбан, жалобы на игроков','📋',3);

    INSERT INTO forum_topics (category_id, author_id, title, is_pinned, views, post_count, last_post_user_id) VALUES
      (1, 1, 'Обновление до 26.2: что нового', true, 184, 3, 2),
      (1, 1, 'Технические работы в субботу', false, 42, 1, 1),
      (2, 1, 'Покажите свои постройки', false, 97, 2, 2),
      (3, 1, 'Как работает система приватов', false, 63, 1, 1);

    INSERT INTO forum_posts (topic_id, author_id, post_number, body) VALUES
      (1, 1, 1, 'Сервер переехал на **26.2**. Главное:\n\n- новые биомы и мобы\n- переработана генерация деревень\n- починили лаги при загрузке чанков\n\nПолный список — в [вики](https://pfaumc.io/wiki/mechanics).\n\nЕсли что-то сломалось — пишите сюда, разберёмся.'),
      (2, 1, 1, 'В субботу с 10:00 до 12:00 по МСК сервер будет недоступен: обновляем железо.\n\n> Прогресс не потеряется, бэкап делаем перед стартом работ.'),
      (3, 1, 1, 'Тема для скриншотов. Формат простой:\n\n1. скриншот\n2. пара слов, что это и где\n\nЛучшие работы попадут в шапку.'),
      (4, 1, 1, 'Приват ставится золотой лопатой по двум углам области. Подробности — команда \`/help privat\` в игре.');

    INSERT INTO forum_posts (topic_id, author_id, post_number, body, reply_to_id) VALUES
      (1, 2, 2, 'Наконец-то починили чанки, спасибо! А новые деревни будут генерироваться на уже прогруженной карте?', 1),
      (1, 1, 3, '[quote=Kirill_MC]А новые деревни будут генерироваться на уже прогруженной карте?[/quote]\n\nТолько в новых чанках, @Kirill_MC. Старую территорию не трогаем, чтобы не сносить постройки.', 5),
      (3, 2, 2, 'Скинул свой замок в дискорд, тут картинки не прикрепляются. Может, добавите загрузку изображений?', NULL);

    UPDATE forum_topics SET last_post_at = now() - (id || ' hours')::interval;
    UPDATE forum_posts SET created_at = now() - (id * 3 || ' hours')::interval;

    INSERT INTO forum_post_reactions (post_id, user_id, emoji) VALUES
      (1, 2, '🔥'), (1, 1, '👍'), (6, 2, '👍'), (3, 2, '❤️');

    INSERT INTO forum_topic_subscriptions (user_id, topic_id) VALUES (1, 1), (1, 3), (2, 1);

    INSERT INTO forum_notifications (user_id, type, actor_id, topic_id, post_id, payload) VALUES
      (1, 'reply', 2, 1, 5, '{"topicTitle":"Обновление до 26.2: что нового","excerpt":"Наконец-то починили чанки"}'),
      (1, 'topic_reply', 2, 3, 7, '{"topicTitle":"Покажите свои постройки","excerpt":"Скинул свой замок в дискорд"}');

    INSERT INTO forum_post_reports (post_id, reporter_id, reason, comment) VALUES
      (7, 1, 'offtopic', 'Просьба про картинки — не по теме ветки');
  `)
  console.log('• демо-данные созданы (4 категории, 4 темы, 7 сообщений, жалоба)')
}

/* ---------- одноразовая ссылка входа ---------- */
const token = randomToken()
await rawDb.query(
  `INSERT INTO forum_login_tokens (token_hash, mc_uuid, mc_name, expires_at)
   VALUES ($1, $2, $3, now() + interval '24 hours')`,
  [sha256(token), MOD_UUID, nickname]
)

/* ---------- HTTP ---------- */
async function toWebRequest(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  return new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  })
}

createServer(async (req, res) => {
  const path = req.url ?? '/'
  const fn = path.startsWith('/api/forum')
    ? forumFn
    : path.startsWith('/api/auth')
      ? authFn
      : path.startsWith('/api/server/stats')
        ? serverStatsFn
        : null

  if (!fn) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Не маршрут форума' }))
    return
  }

  try {
    const response = await fn(await toWebRequest(req), {})
    const headers = {}
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') headers[key] = value
    })
    const cookies = response.headers.getSetCookie?.() ?? []
    if (cookies.length) headers['Set-Cookie'] = cookies

    res.writeHead(response.status, headers)
    res.end(Buffer.from(await response.arrayBuffer()))
    console.log(`${res.statusCode} ${req.method} ${path}`)
  } catch (e) {
    console.error(`500 ${req.method} ${path}`, e)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'dev-server: ' + e.message }))
  }
}).listen(PORT, () => {
  console.log(`\n  API форума:  http://localhost:${PORT}`)
  console.log(`  Модератор:   ${nickname}`)
  console.log(`\n  Войти (ссылка живёт 24 часа):\n  ${SITE}/auth/game?token=${token}\n`)
})
