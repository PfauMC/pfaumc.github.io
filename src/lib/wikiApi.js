import { GAME_API_BASE } from './gameApi'
import { apiRequest } from './forumApi'
import seed from '../data/wikiSeed.json'

export function wikiApi(path, opts) {
  return apiRequest(`${GAME_API_BASE}/api/v1/wiki${path}`, opts)
}

const summary = ({ body, ...rest }) => rest

/**
 * GET вики со встроенной копией на случай, когда бэкенд вики ещё не выкачен или
 * недоступен: вики не должна пропадать с сайта. «Статья не найдена» от настоящего
 * бэкенда (code: not_found) -- честный 404, копию тогда не подставляем.
 * `fallback: true` в ответе -- показываем копию, редактировать её нельзя.
 */
export async function wikiFetcher(path, opts) {
  try {
    return await wikiApi(path, opts)
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'not_found') throw error
    if (path === '/pages') return { pages: seed.map(summary), fallback: true }
    const slug = decodeURIComponent(path.replace(/^\/pages\//, ''))
    const page = seed.find((p) => p.slug === slug)
    if (page) return { page, fallback: true }
    throw error
  }
}

/** Разделы меню в порядке первой статьи раздела. */
export function groupBySection(pages) {
  const groups = []
  for (const page of [...pages].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'ru'))) {
    let group = groups.find((g) => g.section === page.section)
    if (!group) groups.push((group = { section: page.section, pages: [] }))
    group.pages.push(page)
  }
  return groups
}

/** Заголовки `## ` статьи -- оглавление в меню. Блоки [warning]/[quote] не считаются. */
export function outline(body) {
  return (body ?? '')
    .replace(/\[(quote|warning)[^\]]*\][\s\S]*?\[\/\1\]/gi, '')
    .split('\n')
    .map((line) => line.match(/^##\s+(.+)$/)?.[1])
    .filter(Boolean)
}

/** Вопросы FAQ: каждый `## Вопрос` и абзацы под ним до следующего заголовка. */
export function faqItems(body) {
  const items = []
  for (const block of (body ?? '').split(/^##\s+/m).slice(1)) {
    const [q, ...rest] = block.split('\n')
    const a = rest.join('\n').split(/^#{1,4}\s/m)[0].trim()
    if (q.trim() && a) items.push({ q: q.trim(), a })
  }
  return items
}
