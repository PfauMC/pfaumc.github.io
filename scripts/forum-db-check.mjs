// Проверка SQL форума на настоящем Postgres (PGlite, в памяти): прогоняет
// schema.sql и все боевые запросы. Зависимость ставится только на время проверки:
//
//   npm i -D @electric-sql/pglite && node scripts/forum-db-check.mjs && npm un @electric-sql/pglite
//
// ponytail: держать pglite в devDependencies постоянно — 50 МБ ради запуска
// раз в несколько правок схемы. Ставим по требованию.
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'


const db = await new PGlite()

const text = await readFile(new URL('../netlify/functions/_lib/schema.sql', import.meta.url), 'utf8')
const statements = text
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((l) => l.trim().startsWith('--')))

for (const s of statements) {
  try {
    await db.exec(s)
  } catch (e) {
    console.error('SCHEMA FAIL:\n', s, '\n->', e.message)
    process.exit(1)
  }
}
console.log(`✓ schema: ${statements.length} statements`)

// --- seed ---
await db.query(`INSERT INTO forum_users (mc_uuid, name, name_lower, role_key) VALUES
  ('069a79f4-44e9-4726-a5be-fca90e38aaf5','Steve','steve','moderator'),
  ('11111111-1111-1111-1111-111111111111','Alex','alex','player')`)
await db.query(`INSERT INTO forum_categories (slug,title,description,icon,position) VALUES ('obschee','Общее','Обо всём','💬',0)`)
await db.query(`INSERT INTO forum_topics (category_id, author_id, title, last_post_user_id) VALUES (1,1,'Первая тема',1)`)
await db.query(`INSERT INTO forum_posts (topic_id, author_id, post_number, body) VALUES (1,1,1,'Привет форуму, тестовое сообщение')`)

const q = async (label, sql, params = []) => {
  try {
    const r = await db.query(sql, params)
    console.log(`✓ ${label} (${r.rows.length} rows)`)
    return r.rows
  } catch (e) {
    console.error(`✗ ${label}: ${e.message}\n${sql}\n`)
    process.exitCode = 1
    return null
  }
}

const authorFields = (t, p, r) =>
  `${t}.id AS ${p}_id, ${t}.mc_uuid AS ${p}_uuid, ${t}.name AS ${p}_name, ${t}.role_key AS ${p}_role_key,
   ${r}.title AS ${p}_role_title, ${r}.color AS ${p}_role_color, ${r}.can_moderate AS ${p}_can_moderate`

/* --- categories.js: CATEGORY_SELECT --- */
const CATEGORY_SELECT = `
  SELECT c.id, c.slug, c.title, c.description, c.icon, c.position, c.is_visible, c.is_active,
         COALESCE(agg.topic_count, 0)::int  AS topic_count,
         COALESCE(agg.post_count, 0)::int   AS post_count,
         lp.id AS last_post_id, lp.post_number AS last_post_number, lp.created_at AS last_post_at,
         lt.id AS last_topic_id, lt.title AS last_topic_title,
         ${authorFields('lpu', 'lp', 'lpr')},
         COALESCE(unread.has_unread, false) AS has_unread
    FROM forum_categories c
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS topic_count, COALESCE(sum(t.post_count), 0)::int AS post_count
        FROM forum_topics t WHERE t.category_id = c.id AND t.deleted_at IS NULL
    ) agg ON true
    LEFT JOIN LATERAL (
      SELECT p.id, p.post_number, p.created_at, p.author_id, p.topic_id
        FROM forum_posts p JOIN forum_topics t ON t.id = p.topic_id
       WHERE t.category_id = c.id AND t.deleted_at IS NULL AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC LIMIT 1
    ) lp ON true
    LEFT JOIN forum_topics lt ON lt.id = lp.topic_id
    LEFT JOIN forum_users lpu ON lpu.id = lp.author_id
    LEFT JOIN forum_roles lpr ON lpr.key = lpu.role_key
    LEFT JOIN LATERAL (
      SELECT EXISTS (
        SELECT 1 FROM forum_topics t2
          LEFT JOIN forum_topic_read_state rs ON rs.topic_id = t2.id AND rs.user_id = $1
         WHERE $1::bigint IS NOT NULL AND t2.category_id = c.id AND t2.deleted_at IS NULL
           AND t2.last_post_at > COALESCE(rs.read_at, $2::timestamptz)
      ) AS has_unread
    ) unread ON true
   WHERE c.deleted_at IS NULL AND ($3 OR c.is_visible)
`
await q('categories.list (guest)', `${CATEGORY_SELECT} ORDER BY c.position, c.id`, [null, null, false])
await q('categories.list (user)', `${CATEGORY_SELECT} ORDER BY c.position, c.id`, [1, new Date().toISOString(), true])
await q('categories.getBySlug', `${CATEGORY_SELECT} AND c.slug = $4 LIMIT 1`, [null, null, false, 'obschee'])

/* --- reorder --- */
await q('categories.reorder', `UPDATE forum_categories c SET position = ordered.position, updated_at = now()
   FROM (SELECT id, ordinality - 1 AS position FROM unnest($1::bigint[]) WITH ORDINALITY AS t(id, ordinality)) ordered
  WHERE c.id = ordered.id`, [[1]])

/* --- topics.js: TOPIC_SELECT --- */
const TOPIC_SELECT = `
  SELECT t.id, t.category_id, t.title, t.is_pinned, t.is_locked, t.views, t.post_count,
         t.created_at, t.last_post_at, t.deleted_at,
         c.slug AS category_slug, c.title AS category_title, c.is_active AS category_active,
         ${authorFields('au', 'a', 'ar')},
         ${authorFields('lu', 'lp', 'lr')},
         ($1::bigint IS NOT NULL AND t.last_post_at > COALESCE(rs.read_at, $2::timestamptz)) AS has_unread,
         (sub.user_id IS NOT NULL) AS is_subscribed
    FROM forum_topics t
    JOIN forum_categories c ON c.id = t.category_id
    JOIN forum_users au ON au.id = t.author_id
    JOIN forum_roles ar ON ar.key = au.role_key
    LEFT JOIN forum_users lu ON lu.id = t.last_post_user_id
    LEFT JOIN forum_roles lr ON lr.key = lu.role_key
    LEFT JOIN forum_topic_read_state rs ON rs.topic_id = t.id AND rs.user_id = $1
    LEFT JOIN forum_topic_subscriptions sub ON sub.topic_id = t.id AND sub.user_id = $1
`
await q('topics.listByCategory', `${TOPIC_SELECT}
  WHERE t.category_id = $3 AND ($4 OR t.deleted_at IS NULL)
  ORDER BY t.is_pinned DESC, t.last_post_at DESC LIMIT $5 OFFSET $6`, [1, new Date().toISOString(), 1, false, 20, 0])

await q('topics.get', `${TOPIC_SELECT}
  WHERE t.id = $3 AND ($4 OR (t.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_visible))`,
  [null, null, 1, false])

await q('topics.listSubscriptions', `${TOPIC_SELECT}
  JOIN forum_topic_subscriptions mysub ON mysub.topic_id = t.id AND mysub.user_id = $1
  WHERE t.deleted_at IS NULL ORDER BY t.last_post_at DESC LIMIT 100`, [1, new Date().toISOString()])

/* --- topics.create CTE --- */
await q('topics.create', `WITH t AS (
     INSERT INTO forum_topics (category_id, author_id, title, last_post_at, last_post_user_id)
     VALUES ($1, $2, $3, now(), $2) RETURNING id
   ), p AS (
     INSERT INTO forum_posts (topic_id, author_id, post_number, body) SELECT t.id, $2, 1, $4 FROM t
     RETURNING id, topic_id
   ), s AS (
     INSERT INTO forum_topic_subscriptions (user_id, topic_id) SELECT $2, t.id FROM t RETURNING topic_id
   )
   SELECT p.topic_id AS topic_id, p.id AS post_id FROM p`, [1, 1, 'Вторая тема', 'Текст второй темы про строительство'])

/* --- posts.insertPost CTE --- */
const inserted = await q('posts.insertPost', `WITH nextnum AS (
     SELECT COALESCE(max(post_number), 0) + 1 AS n FROM forum_posts WHERE topic_id = $1
   ), ins AS (
     INSERT INTO forum_posts (topic_id, author_id, post_number, body, reply_to_id)
     SELECT $1, $2, nextnum.n, $3, $4 FROM nextnum RETURNING id, post_number
   ), bump AS (
     UPDATE forum_topics SET post_count = post_count + 1, last_post_at = now(), last_post_user_id = $2, updated_at = now()
      WHERE id = $1
   )
   SELECT id, post_number FROM ins`, [1, 2, 'Ответ от @Steve с упоминанием', null])
console.log('   inserted:', inserted?.[0])

/* --- уведомления одним запросом --- */
await q('posts.notifications', `INSERT INTO forum_notifications (user_id, type, actor_id, topic_id, post_id, payload)
   SELECT DISTINCT ON (s.user_id) s.user_id, s.type, $1, $2, $3, $4::jsonb
     FROM (
       SELECT u.id AS user_id, 'mention'::text AS type, 1 AS priority
         FROM forum_users u WHERE u.name_lower = ANY($5::text[]) AND u.notify_mentions AND NOT u.is_banned
       UNION ALL
       SELECT p.author_id, 'reply', 2 FROM forum_posts p JOIN forum_users u ON u.id = p.author_id
        WHERE p.id = $6 AND u.notify_replies AND NOT u.is_banned
       UNION ALL
       SELECT sub.user_id, 'topic_reply', 3 FROM forum_topic_subscriptions sub JOIN forum_users u ON u.id = sub.user_id
        WHERE sub.topic_id = $2 AND u.notify_subscriptions AND NOT u.is_banned
     ) s
    WHERE s.user_id <> $1 ORDER BY s.user_id, s.priority`,
  [2, 1, 1, JSON.stringify({ topicTitle: 'Первая тема', excerpt: 'x' }), ['steve'], 1])

const notif = await db.query('SELECT user_id, type FROM forum_notifications')
console.log('   notifications:', notif.rows)

/* --- posts.listByTopic --- */
const POST_SELECT = `
  SELECT p.id, p.topic_id, p.author_id, p.post_number, p.body, p.created_at, p.edited_at, p.edited_by,
         p.deleted_at, p.reply_to_id, rp.post_number AS reply_to_number, ru.name AS reply_to_author,
         ${authorFields('pu', 'a', 'pr')}, pu.signature AS a_signature
    FROM forum_posts p
    JOIN forum_users pu ON pu.id = p.author_id
    JOIN forum_roles pr ON pr.key = pu.role_key
    LEFT JOIN forum_posts rp ON rp.id = p.reply_to_id
    LEFT JOIN forum_users ru ON ru.id = rp.author_id
`
await q('posts.listByTopic', `${POST_SELECT} WHERE p.topic_id = $1 ORDER BY p.post_number LIMIT $2 OFFSET $3`, [1, 20, 0])

await q('posts.reactionsFor', `SELECT r.post_id, r.emoji, count(*)::int AS count,
         COALESCE(bool_or(r.user_id = $2), false) AS mine,
         array_agg(u.name ORDER BY u.name) AS names
    FROM forum_post_reactions r JOIN forum_users u ON u.id = r.user_id
   WHERE r.post_id = ANY($1::bigint[]) GROUP BY r.post_id, r.emoji
   ORDER BY count DESC, r.emoji`, [[1, 2], null])

await q('posts.recountTopic', `UPDATE forum_topics t
    SET post_count = COALESCE(agg.n, 0), last_post_at = COALESCE(agg.last_at, t.created_at), last_post_user_id = agg.last_author
   FROM (SELECT count(*)::int AS n, max(created_at) AS last_at,
                (SELECT author_id FROM forum_posts WHERE topic_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1) AS last_author
           FROM forum_posts WHERE topic_id = $1 AND deleted_at IS NULL) agg
  WHERE t.id = $1`, [1])

await q('posts.notifyModeration', `INSERT INTO forum_notifications (user_id, type, actor_id, topic_id, post_id, payload)
   SELECT $1::bigint, 'moderation', $2::bigint, $3::bigint, $4::bigint, $5::jsonb WHERE $1::bigint <> $2::bigint`, [2, 1, 1, 1, JSON.stringify({ action: 'post.edit' })])

await q('posts.listMine', `SELECT p.id, p.topic_id, p.post_number, p.body, p.created_at, p.deleted_at,
          t.title AS topic_title, c.slug AS category_slug, c.title AS category_title
     FROM forum_posts p JOIN forum_topics t ON t.id = p.topic_id JOIN forum_categories c ON c.id = t.category_id
    WHERE p.author_id = $1 AND p.deleted_at IS NULL AND t.deleted_at IS NULL
    ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`, [1, 20, 0])

/* --- search --- */
const SEARCH_FROM = `
    FROM forum_posts p
    JOIN forum_topics t ON t.id = p.topic_id
    JOIN forum_categories c ON c.id = t.category_id
    JOIN forum_users pu ON pu.id = p.author_id
    JOIN forum_roles pr ON pr.key = pu.role_key`
const SEARCH_WHERE = `
    WHERE p.deleted_at IS NULL AND t.deleted_at IS NULL AND c.deleted_at IS NULL
      AND ($7 OR c.is_visible)
      AND ($2::bigint IS NULL OR t.category_id = $2)
      AND ($3::text  IS NULL OR pu.name_lower = $3)
      AND ($4::text  IS NULL OR p.created_at >= $4::timestamptz)
      AND ($5::text  IS NULL OR p.created_at < ($5::timestamptz + interval '1 day'))
      AND (CASE WHEN $6 THEN t.title_tsv @@ websearch_to_tsquery('russian', $1) AND p.post_number = 1
                ELSE (p.body_tsv @@ websearch_to_tsquery('russian', $1) OR t.title_tsv @@ websearch_to_tsquery('russian', $1)) END)`
const searchParams = ['строительство', null, null, null, null, false, false, 20, 0]
const found = await q('search.results', `SELECT p.id, p.topic_id, p.post_number, p.body, p.created_at,
        t.title AS topic_title, c.slug AS category_slug, c.title AS category_title, ${authorFields('pu', 'a', 'pr')}
   ${SEARCH_FROM} ${SEARCH_WHERE}
   ORDER BY (ts_rank(t.title_tsv, websearch_to_tsquery('russian', $1)) * 2 + ts_rank(p.body_tsv, websearch_to_tsquery('russian', $1))) DESC, p.created_at DESC
   LIMIT $8 OFFSET $9`, searchParams)
console.log('   найдено по «строительство»:', found?.length)
await q('search.count', `SELECT count(*)::int AS n ${SEARCH_FROM} ${SEARCH_WHERE}`, searchParams.slice(0, 7))

/* --- notifications list --- */
await q('notifications.list', `SELECT n.id, n.type, n.read_at, n.created_at, n.topic_id, n.post_id, n.payload,
        t.title AS topic_title, p.post_number, ${authorFields('acu', 'ac', 'acr')}
   FROM forum_notifications n
   LEFT JOIN forum_topics t ON t.id = n.topic_id
   LEFT JOIN forum_posts p ON p.id = n.post_id
   LEFT JOIN forum_users acu ON acu.id = n.actor_id
   LEFT JOIN forum_roles acr ON acr.key = acu.role_key
  WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT $2`, [1, 30])

/* --- read state upsert --- */
await q('topics.markRead', `INSERT INTO forum_topic_read_state (user_id, topic_id, last_read_post_number, read_at)
   VALUES ($1, $2, $3, now())
   ON CONFLICT (user_id, topic_id) DO UPDATE
     SET last_read_post_number = GREATEST(forum_topic_read_state.last_read_post_number, EXCLUDED.last_read_post_number), read_at = now()`,
  [1, 1, 2])

/* --- reports --- */
await db.query(`INSERT INTO forum_post_reports (post_id, reporter_id, reason, comment) VALUES (1,2,'spam','реклама')`)
await q('moderation.listReports', `SELECT rep.id, rep.post_id, rep.reason, rep.comment, rep.status, rep.note,
        rep.created_at, rep.resolved_at, p.post_number, p.body, p.deleted_at AS post_deleted_at,
        t.id AS topic_id, t.title AS topic_title,
        ${authorFields('rpu', 'rp', 'rpr')}, ${authorFields('pau', 'pa', 'par')}
   FROM forum_post_reports rep
   JOIN forum_posts p ON p.id = rep.post_id
   JOIN forum_topics t ON t.id = p.topic_id
   JOIN forum_users rpu ON rpu.id = rep.reporter_id
   JOIN forum_roles rpr ON rpr.key = rpu.role_key
   JOIN forum_users pau ON pau.id = p.author_id
   JOIN forum_roles par ON par.key = pau.role_key
  WHERE rep.status = $1 ORDER BY rep.created_at DESC LIMIT $2 OFFSET $3`, ['open', 25, 0])

await q('moderation.reportCounts', `SELECT count(*) FILTER (WHERE status = 'open')::int AS open,
        count(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        count(*) FILTER (WHERE status = 'rejected')::int AS rejected FROM forum_post_reports`)

await q('moderation.updateReport', `UPDATE forum_post_reports
    SET status = $2, note = $3,
        resolved_at = CASE WHEN $2 = 'open' THEN NULL ELSE now() END,
        resolved_by = CASE WHEN $2 = 'open' THEN NULL ELSE $4::bigint END
  WHERE id = $1 RETURNING post_id`, [1, 'resolved', 'удалено', 1])

/* --- modlog --- */
await q('db.logModeration', `INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, details)
   VALUES ($1,$2,$3,$4,$5::jsonb)`, [1, 'topic.delete', 'topic', 1, JSON.stringify({ title: 'x' })])
await q('moderation.listLog', `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at,
        ${authorFields('mu', 'm', 'mr')}
   FROM forum_moderation_log l JOIN forum_users mu ON mu.id = l.moderator_id JOIN forum_roles mr ON mr.key = mu.role_key
  ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`, [25, 0])

/* --- auth --- */
await q('auth.rateLimit', `SELECT count(*)::int AS n FROM forum_login_tokens
  WHERE mc_uuid = $1 AND created_at > now() - ($2 || ' seconds')::interval`, ['069a79f4-44e9-4726-a5be-fca90e38aaf5', '60'])
await db.query(`INSERT INTO forum_login_tokens (token_hash, mc_uuid, mc_name, expires_at) VALUES ('hash','069a79f4-44e9-4726-a5be-fca90e38aaf5','Steve', now() + interval '5 min')`)
const claimed = await q('auth.consumeToken', `UPDATE forum_login_tokens SET used_at = now()
  WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING mc_uuid, mc_name`, ['hash'])
const claimedAgain = await q('auth.consumeToken (повтор)', `UPDATE forum_login_tokens SET used_at = now()
  WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING mc_uuid, mc_name`, ['hash'])
console.log('   одноразовость:', claimed?.length === 1 && claimedAgain?.length === 0 ? 'OK' : 'СЛОМАНА')

await q('auth.upsertUser', `INSERT INTO forum_users (mc_uuid, name, name_lower, skin_url, last_login_at)
   VALUES ($1, $2, lower($2), $3, now())
   ON CONFLICT (mc_uuid) DO UPDATE SET name = EXCLUDED.name, name_lower = EXCLUDED.name_lower,
     skin_url = COALESCE(EXCLUDED.skin_url, forum_users.skin_url), last_login_at = now(), updated_at = now()
   RETURNING id`, ['069a79f4-44e9-4726-a5be-fca90e38aaf5', 'SteveNew', null])

await q('auth.createSession', `INSERT INTO forum_sessions (user_id, token_hash, csrf_token, remember, user_agent, ip, expires_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7)`, [1, 'h', 'c', true, 'ua', '1.2.3.4', new Date(Date.now() + 1e9).toISOString()])
await q('auth.getSession', `SELECT s.id, s.user_id, s.csrf_token, s.remember, s.expires_at, s.last_used_at,
        u.id, u.mc_uuid, u.name, u.skin_url, u.role_key, u.is_banned, u.ban_reason,
        u.notify_replies, u.notify_mentions, u.notify_subscriptions, u.signature, u.show_signatures,
        u.created_at, u.last_login_at,
        r.title AS role_title, r.color AS role_color, r.can_moderate
   FROM forum_sessions s JOIN forum_users u ON u.id = s.user_id JOIN forum_roles r ON r.key = u.role_key
  WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`, ['h'])
await q('auth.rotate', `UPDATE forum_sessions SET token_hash = $2, last_used_at = now(),
    expires_at = now() + ($3 || ' milliseconds')::interval WHERE id = $1`, [1, 'h2', '86400000'])
await q('auth.settings', `UPDATE forum_users
    SET notify_replies = $2, notify_mentions = $3, notify_subscriptions = $4,
        signature = $5, show_signatures = $6, updated_at = now()
  WHERE id = $1`, [1, true, true, true, '<b>привет</b>', true])

await q('db.checkPostRateLimit', `SELECT
     (SELECT max(created_at) FROM forum_posts WHERE author_id = $1) AS last_at,
     (SELECT count(*)::int FROM forum_posts WHERE author_id = $1 AND created_at > now() - ($2 || ' seconds')::interval) AS burst`,
  [1, '300'])

await q('db.checkTopicReplyCooldown', `SELECT max(created_at) AS last_at FROM forum_posts WHERE author_id = $1 AND topic_id = $2`,
  [1, 1])

await q('categories.uniqueSlug', `SELECT id FROM forum_categories WHERE slug = $1 AND ($2::bigint IS NULL OR id <> $2)`, ['obschee', null])

console.log(process.exitCode ? '\n✗ есть ошибки' : '\n✓ все запросы выполнились')
