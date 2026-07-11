// Тянет дневную статистику онлайна PfauMC со страницы minecraftrating.ru
// (данные зашиты в HTML как JS-объект `datasets.month`) и пишет их в
// public/data/online-history.json в формате [{t, p}], который уже
// понимает src/hooks/useOnlineHistory.js.
//
// Неофициальный источник: страница может однажды поменять вёрстку,
// тогда регулярка ниже перестанет находить `month:` датасет и скрипт
// упадёт с понятной ошибкой — чинить придётся регулярку под новую вёрстку.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const RATING_URL = 'https://minecraftrating.ru/server/pfaumc/'
const OUT_PATH = fileURLToPath(new URL('../public/data/online-history.json', import.meta.url))

const MONTHS = {
  янв: 0, фев: 1, мар: 2, апр: 3, май: 4, июн: 5,
  июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11,
}

const res = await fetch(RATING_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
const html = await res.text()

const match = html.match(/month:\s*\{[^}]*labels:\s*(\[[^\]]*\])[^}]*data:\s*(\[[^\]]*\])/)
if (!match) throw new Error('month dataset not found on minecraftrating.ru — вёрстка страницы изменилась')

const labels = JSON.parse(match[1])
const values = JSON.parse(match[2])

const now = new Date()
const records = labels.map((label, i) => {
  const [day, monStr] = label.split(', ')[1].split(' ')
  const month = MONTHS[monStr]
  let year = now.getUTCFullYear()
  if (month > now.getUTCMonth()) year -= 1
  const t = new Date(Date.UTC(year, month, Number(day), 12, 0, 0))
  return { t: t.toISOString(), p: values[i] }
})

await writeFile(OUT_PATH, JSON.stringify(records, null, 2) + '\n')
console.log(`Записано ${records.length} дневных точек`)
