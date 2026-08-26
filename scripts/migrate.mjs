// Миграции форума: прогоняет netlify/functions/_lib/schema.sql через Neon.
// Схема идемпотентна (CREATE ... IF NOT EXISTS), так что скрипт можно
// запускать сколько угодно раз.
//
//   netlify dev:exec node scripts/migrate.mjs      # env подставит Netlify CLI
//   NETLIFY_DATABASE_URL=postgres://... node scripts/migrate.mjs
//
// ponytail: полноценный migration-runner с версиями не нужен, пока схема одна.
// Появится второй несовместимый шаг — заводите numbered-файлы и таблицу
// schema_migrations.
import { readFile } from 'node:fs/promises'
import { neon } from '@netlify/neon'

const sql = neon()
const text = await readFile(new URL('../netlify/functions/_lib/schema.sql', import.meta.url), 'utf8')

const statements = text
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((line) => line.trim().startsWith('--')))

let done = 0
for (const statement of statements) {
  try {
    await sql.query(statement)
    done++
  } catch (e) {
    console.error(`\n✗ Ошибка в выражении:\n${statement}\n`)
    throw e
  }
}

console.log(`✓ Схема форума применена (${done} выражений)`)
