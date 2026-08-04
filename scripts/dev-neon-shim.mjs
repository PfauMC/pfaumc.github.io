// Локальная замена @netlify/neon: тот же интерфейс (`sql.query`, `sql.transaction`),
// но поверх PGlite — Postgres, работающий прямо в процессе, без аккаунтов и Docker.
// Подставляется загрузчиком scripts/dev-loader.mjs только в dev-сервере;
// боевой код об этом не знает и не меняется.
import { PGlite } from '@electric-sql/pglite'

const dir = process.env.FORUM_DEV_DB_DIR ?? './.dev-db'
const db = await new PGlite(dir)

async function run(text, params) {
  const result = await db.query(text, params ?? [])
  return result.rows
}

/** Ленивый thenable — как NeonQueryPromise: запрос уходит только при await. */
function lazyQuery(text, params) {
  return {
    text,
    params,
    then: (resolve, reject) => run(text, params).then(resolve, reject),
    catch: (reject) => run(text, params).catch(reject),
    finally: (fn) => run(text, params).finally(fn),
  }
}

export function neon() {
  const sql = () => {
    throw new Error('dev-neon-shim: tagged-template вызов не используется в проекте')
  }
  sql.query = lazyQuery
  sql.transaction = async (queries) => {
    await db.exec('BEGIN')
    try {
      const out = []
      for (const item of queries) out.push(await run(item.text, item.params))
      await db.exec('COMMIT')
      return out
    } catch (e) {
      await db.exec('ROLLBACK')
      throw e
    }
  }
  return sql
}

export const rawDb = db
export default { neon }
