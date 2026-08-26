// Значения для отпечатка устройства собирают две независимые реализации. Хеш из них
// считает сервер, поэтому договариваться о склейке и хешировании больше не нужно, а вот о
// самих значениях -- нужно: пришли одна сторона экран как "1920x1080x24", а другая как
// "1920x1080", и один браузер снова даст два разных отпечатка. Молча -- ничего не упадёт и
// в логи не попадёт.
//
// Отсюда общий образец: придуманный браузер ниже и ожидаемый набор совпадают со второй
// реализацией и с серверным тестом, который закрепляет получаемый из них хеш.
//
// Запуск: node scripts/fingerprint-selfcheck.mjs
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import assert from 'node:assert/strict'

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

const EXPECTED = {
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) pfaumc-test',
  languages: 'ru-RU,ru',
  timezone: 'Europe/Moscow',
  screen: '1920x1080x24',
  pixel_ratio: '1.5',
  cores: '8',
  memory: '8',
  platform: 'Windows',
  touch: '0:false',
  canvas: 'data:image/png;base64,pfaumc-test-canvas',
}

const win = { devicePixelRatio: B.devicePixelRatio }
const sandbox = {
  window: win,
  globalThis: win,
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

// Модуль тянет forumApi ради отправки; здесь собираются только значения, поэтому импорт
// срезается.
const src = readFileSync(new URL('../src/lib/deviceFingerprint.js', import.meta.url), 'utf8')
  .replace(/^import .*$/m, '')
  .replace(/export /g, '')

// Через JSON, а не объектом: собранный внутри vm объект тянет за собой прототип чужого
// realm, и сравнение спотыкается на нём вместо самих значений.
const actual = JSON.parse(
  await new Promise((resolve, reject) => {
    sandbox.done = resolve
    sandbox.fail = reject
    sandbox.JSON = JSON
    runInContext(
      `${src}\ntry { done(JSON.stringify(deviceSignals())) } catch (e) { fail(e) }`,
      createContext(sandbox),
    )
  }),
)

assert.deepEqual(actual, EXPECTED, 'набор значений разошёлся с образцом')
console.log('ok  значения сайта совпали с образцом')
