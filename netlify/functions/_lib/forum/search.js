import { q, one } from './db.js'
import { json, intParam } from './http.js'
import * as shape from './shape.js'
import { LIMITS, cleanText } from './validate.js'
import { excerpt } from './markup.js'

const PAGE_SIZE = 20

// Полнотекстовый поиск Postgres по русскому словарю: индексы GIN на
// forum_posts.body_tsv и forum_topics.title_tsv (см. schema.sql).
export async function search(req, ctx) {
  const url = new URL(req.url)
  const raw = cleanText(url.searchParams.get('q') ?? '').slice(0, LIMITS.search.max)
  if (raw.length < 2) {
    return json({ results: [], total: 0, page: 1, pageSize: PAGE_SIZE, query: raw })
  }

  const page = intParam(url.searchParams.get('page'), { fallback: 1, max: 500 })
  const titlesOnly = url.searchParams.get('titlesOnly') === '1'
  const sort = url.searchParams.get('sort') === 'date' ? 'date' : 'relevance'
  const categoryId = url.searchParams.get('categoryId')
  const authorName = (url.searchParams.get('author') ?? '').trim().toLowerCase().slice(0, 16) || null
  const from = url.searchParams.get('from') || null
  const to = url.searchParams.get('to') || null
  const isMod = Boolean(ctx?.user.role.canModerate)

  // Порядок важен: фильтры идут первыми, LIMIT/OFFSET последними, чтобы
  // запрос-счётчик мог переиспользовать params.slice(0, 7).
  const params = [
    raw,
    categoryId ? Number.parseInt(categoryId, 10) || null : null,
    authorName,
    from,
    to,
    titlesOnly,
    isMod,
    PAGE_SIZE,
    (page - 1) * PAGE_SIZE,
  ]

  const where = `
    WHERE p.deleted_at IS NULL AND t.deleted_at IS NULL AND c.deleted_at IS NULL
      AND ($7 OR c.is_visible)
      AND ($2::bigint IS NULL OR t.category_id = $2)
      AND ($3::text  IS NULL OR pu.name_lower = $3)
      AND ($4::text  IS NULL OR p.created_at >= $4::timestamptz)
      AND ($5::text  IS NULL OR p.created_at < ($5::timestamptz + interval '1 day'))
      AND (
        CASE WHEN $6 THEN t.title_tsv @@ websearch_to_tsquery('russian', $1) AND p.post_number = 1
             ELSE (p.body_tsv @@ websearch_to_tsquery('russian', $1)
                   OR t.title_tsv @@ websearch_to_tsquery('russian', $1))
        END
      )
  `

  const from_ = `
    FROM forum_posts p
    JOIN forum_topics t ON t.id = p.topic_id
    JOIN forum_categories c ON c.id = t.category_id
    JOIN forum_users pu ON pu.id = p.author_id
    JOIN forum_roles pr ON pr.key = pu.role_key
  `

  const orderBy =
    sort === 'date'
      ? 'p.created_at DESC'
      : `(ts_rank(t.title_tsv, websearch_to_tsquery('russian', $1)) * 2
          + ts_rank(p.body_tsv, websearch_to_tsquery('russian', $1))) DESC, p.created_at DESC`

  const rows = await q(
    `SELECT p.id, p.topic_id, p.post_number, p.body, p.created_at,
            t.title AS topic_title, c.slug AS category_slug, c.title AS category_title,
            ${shape.authorFields('pu', 'a', 'pr')}
     ${from_} ${where}
     ORDER BY ${orderBy}
     LIMIT $8 OFFSET $9`,
    params
  )

  const total = await one(`SELECT count(*)::int AS n ${from_} ${where}`, params.slice(0, 7))

  return json({
    query: raw,
    page,
    pageSize: PAGE_SIZE,
    total: total.n,
    results: rows.map((r) => ({
      postId: String(r.id),
      topicId: String(r.topic_id),
      postNumber: r.post_number,
      topicTitle: r.topic_title,
      categorySlug: r.category_slug,
      categoryTitle: r.category_title,
      createdAt: r.created_at,
      excerpt: excerpt(r.body, 220),
      author: shape.author(r, 'a'),
    })),
  })
}
