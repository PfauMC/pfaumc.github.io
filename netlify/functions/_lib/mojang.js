// Resolves a Minecraft username to its Mojang account UUID. This is the only
// public, keyless source of a real (non-guessed) UUID for a given nickname.
export function formatUuid(rawId) {
  const id = String(rawId).replace(/-/g, '').toLowerCase()
  if (id.length !== 32) return null
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}

export async function resolveUuid(username) {
  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`)
    if (res.status !== 200) return null
    const data = await res.json()
    const uuid = formatUuid(data.id)
    if (!uuid) return null
    return { uuid, name: data.name }
  } catch {
    return null
  }
}
