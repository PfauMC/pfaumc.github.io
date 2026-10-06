import assert from 'node:assert/strict'
import { createServer } from 'vite'

globalThis.window = {}
let body = 'Прощать игроку бан после полного выполнения общественных работ.'
globalThis.fetch = async () => new Response(JSON.stringify({ page: { body } }), { status: 200 })

const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { wikiFetcher } = await vite.ssrLoadModule('/src/lib/wikiApi.js')
  const corrected = await wikiFetcher('/pages/rules-roles')
  assert.match(corrected.page.body, /## 🏛️ Как выбирают министра/)
  assert.doesNotMatch(corrected.page.body, /Прощать игроку бан/)

  body = 'Новая версия с сервера'
  assert.equal((await wikiFetcher('/pages/rules-roles')).page.body, body)
  console.log('ok: старая статья заменена, новую версию API не перекрываем')
} finally {
  await vite.close()
}
