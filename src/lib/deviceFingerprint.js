// Отпечаток устройства — только наблюдение: он попадает в журнал устройств,
// чтобы оператор мог посмотреть, с каких устройств заходили на аккаунт. Ни
// доступ, ни права по нему не выдаются и не отзываются — потому он и может
// быть неточным (браузер вправе подменить или скрыть любой сигнал).
import { api } from './forumApi'

const read = (fn) => {
  try {
    const value = fn()
    return value == null ? '' : String(value)
  } catch {
    return ''
  }
}

// Часть браузеров подмешивает в canvas шум или вовсе отказывает в контексте.
function canvasSignal() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 220
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.textBaseline = 'top'
    ctx.font = '14px "Arial"'
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 120, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('pfaumc ✨ 0123', 2, 15)
    return canvas.toDataURL()
  } catch {
    return ''
  }
}

async function compute() {
  // crypto.subtle есть только в secure context; на http локальной разработки
  // его нет, и это не повод падать — просто ничего не сообщаем.
  if (!globalThis.crypto?.subtle) return null

  const parts = [
    read(() => navigator.userAgent),
    read(() => navigator.languages?.join(',') || navigator.language),
    read(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    read(() => `${screen.width}x${screen.height}x${screen.colorDepth}`),
    read(() => window.devicePixelRatio),
    read(() => navigator.hardwareConcurrency),
    read(() => navigator.deviceMemory),
    read(() => navigator.userAgentData?.platform || navigator.platform),
    read(() => `${navigator.maxTouchPoints || 0}:${'ontouchstart' in window}`),
    canvasSignal(),
  ]

  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('|')))
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

let pending

/** Хеш считается один раз на загрузку страницы; вернёт null, если посчитать нечем. */
export function deviceFingerprint() {
  if (!pending) pending = compute()
  return pending
}

export async function reportDevice() {
  try {
    const fingerprint = await deviceFingerprint()
    if (!fingerprint) return
    await api('/auth/device', { method: 'POST', body: { fingerprint } })
  } catch {
    // Телеметрия не имеет права мешать ни входу, ни чтению форума.
  }
}
