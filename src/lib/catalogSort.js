const byName = (a, b) => a.name.localeCompare(b.name, 'ru')

export function sortCities(cities) {
  return [...cities].sort((a, b) => (b.residentCount ?? 0) - (a.residentCount ?? 0) || byName(a, b))
}

export function sortPlaces(places, order = 'rating') {
  return [...places].sort((a, b) => {
    const imageOrder = Boolean(b.imageIds?.length) - Boolean(a.imageIds?.length)
    if (imageOrder) return imageOrder
    if (order === 'newest') return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0) || byName(a, b)
    if (order === 'reviews') return (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || (b.rating ?? -1) - (a.rating ?? -1) || byName(a, b)
    return (b.rating ?? -1) - (a.rating ?? -1) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || byName(a, b)
  })
}
