// Отпечаток устройства считают две независимые реализации: эта, сайтовая, и такая же на
// странице входа auth.pfaumc.io (репозиторий бэкенда, src/assets/main.js). Расходятся они
// молча: один и тот же браузер начинает давать два разных хеша, и вход в игру перестаёт
// связываться со входом на сайт. Обе стороны прогоняют один и тот же придуманный браузер и
// обязаны получить константу ниже -- там лежит такая же проверка с тем же числом.
//
// Запуск: node scripts/fingerprint-selfcheck.mjs
import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import { createContext, runInContext } from 'node:vm'
import assert from 'node:assert/strict'

const VECTOR = '67e55d514b709217922710f019b9c09db0687a660855fbbe953a9bdf5f252cf1'

const B = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) pfaumc-test',
  languages: ['ru-RU', 'ru'],
  language: 'ru-RU',
  timeZone: 'Europe/Moscow',
  screen: { width: 1920, height: 1080, colorDepth: 24 },
  devicePixelRatio: 1.5,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  platform: 'Windows',
  maxTouchPoints: 0,
  canvasDataUrl: 'data:image/png;base64,pfaumc-test-canvas',
}

const win = { devicePixelRatio: B.devicePixelRatio, crypto: webcrypto, TextEncoder }
const sandbox = {
  window: win,
  globalThis: win,
  crypto: webcrypto,
  TextEncoder,
  navigator: {
    userAgent: B.userAgent,
    languages: B.languages,
    language: B.language,
    hardwareConcurrency: B.hardwareConcurrency,
    deviceMemory: B.deviceMemory,
    platform: B.platform,
    maxTouchPoints: B.maxTouchPoints,
  },
  screen: B.screen,
  Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: B.timeZone }) }) },
  document: {
    createElement: () => ({
      getContext: () => ({
        fillRect() {}, fillText() {},
        set textBaseline(_) {}, set font(_) {}, set fillStyle(_) {},
      }),
      toDataURL: () => B.canvasDataUrl,
    }),
  },
}
Object.assign(win, sandbox)

// Модуль тянет forumApi ради отправки; здесь считается только хеш, поэтому импорт срезается.
const src = readFileSync(new URL('../src/lib/deviceFingerprint.js', import.meta.url), 'utf8')
  .replace(/^import .*$/m, '')
  .replace(/export /g, '')

const actual = await new Promise((resolve, reject) => {
  sandbox.done = resolve
  sandbox.fail = reject
  runInContext(`${src}\ndeviceFingerprint().then(done, fail)`, createContext(sandbox))
})

assert.equal(
  actual,
  VECTOR,
  `отпечаток разошёлся с эталоном:\n  получен ${actual}\n  ожидался ${VECTOR}\n` +
    'Сигналы и порядок склейки обязаны совпадать со страницей входа auth.pfaumc.io.',
)
console.log('ok  сайтовый отпечаток совпал с эталоном')
