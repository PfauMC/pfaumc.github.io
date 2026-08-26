// Отпечаток устройства — только наблюдение: он попадает в журнал устройств,
// чтобы оператор мог посмотреть, с каких устройств заходили на аккаунт. Ни
// доступ, ни права по нему не выдаются и не отзываются — потому он и может
// быть неточным (браузер вправе подменить или скрыть любой сигнал).
//
// Отсюда уходят сами значения, а не их хеш: складывает и хеширует их сервер.
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

/** Имена и формат значений обязаны совпадать со второй реализацией — см. selfcheck. */
export function deviceSignals() {
  return {
    user_agent: read(() => navigator.userAgent),
    languages: read(() => navigator.languages?.join(',') || navigator.language),
    timezone: read(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    screen: read(() => `${screen.width}x${screen.height}x${screen.colorDepth}`),
    pixel_ratio: read(() => window.devicePixelRatio),
    cores: read(() => navigator.hardwareConcurrency),
    memory: read(() => navigator.deviceMemory),
    platform: read(() => navigator.userAgentData?.platform || navigator.platform),
    touch: read(() => `${navigator.maxTouchPoints || 0}:${'ontouchstart' in window}`),
    canvas: canvasSignal(),
  }
}

export async function reportDevice() {
  try {
    await api('/auth/device', { method: 'POST', body: { signals: deviceSignals() } })
  } catch {
    // Телеметрия не имеет права мешать ни входу, ни чтению форума.
  }
}
