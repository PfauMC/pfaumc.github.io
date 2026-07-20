// Russian plural forms: 1 игрок, 2 игрока, 5 игроков, 21 игрок...
export function pluralizeRu(n, [one, few, many]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function formatOnlineCount(n) {
  return `${n} ${pluralizeRu(n, ['игрок', 'игрока', 'игроков'])}`
}

export function formatPlaytime(totalMinutes) {
  const min = Math.max(0, Math.round(totalMinutes || 0))
  if (min < 60) return `${min} мин`

  const hours = min / 60
  if (hours < 24) {
    const rounded = Math.round(hours * 10) / 10
    const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
    return `${str} ч`
  }

  const days = Math.floor(min / 1440)
  const remHours = Math.round((min % 1440) / 60)
  return remHours > 0 ? `${days} д. ${remHours} ч` : `${days} д.`
}

export function formatRelativeTime(isoDate) {
  const then = new Date(isoDate).getTime()
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000))

  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} ${pluralizeRu(diffMin, ['минуту', 'минуты', 'минут'])} назад`

  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ${pluralizeRu(diffHours, ['час', 'часа', 'часов'])} назад`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} ${pluralizeRu(diffDays, ['день', 'дня', 'дней'])} назад`
}

export function formatExactDateTime(isoDate) {
  return new Date(isoDate).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function avatarUrl(uuid, size = 100) {
  return `https://mc-heads.net/avatar/${uuid}/${size}`
}
