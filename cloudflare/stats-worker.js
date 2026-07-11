// Cloudflare Worker: собирает онлайн play.pfaumc.online каждые 5 минут
// и коммитит в public/data/online-history.json через GitHub Contents API.
//
// Настройка (Cloudflare Dashboard):
// 1. Workers & Pages -> Create -> Worker -> вставить этот код (Deploy -> Edit code)
// 2. Settings -> Triggers -> Cron Triggers -> Add -> "*/5 * * * *"
// 3. Settings -> Variables -> Add secret: GITHUB_TOKEN
//    (fine-grained PAT для репозитория PfauMC/pfaumc.github.io,
//    права: Contents -> Read and write)

const REPO = 'PfauMC/pfaumc.github.io'
const FILE_PATH = 'public/data/online-history.json'
const SERVER = 'play.pfaumc.online'
const MAX_RECORDS = 4032 // ~2 недели при интервале 5 минут

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(collectStats(env))
  },
  async fetch() {
    return new Response('ok')
  },
}

async function collectStats(env) {
  const statusRes = await fetch(`https://api.mcsrvstat.us/3/${SERVER}`)
  const status = await statusRes.json()
  if (!status.online) return

  const ghHeaders = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'User-Agent': 'pfaumc-stats-worker',
    Accept: 'application/vnd.github+json',
  }

  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: ghHeaders,
  })
  if (!getRes.ok) throw new Error(`GitHub GET failed: ${getRes.status}`)
  const file = await getRes.json()
  const history = JSON.parse(atob(file.content))

  history.push({ t: new Date().toISOString(), p: status.players?.online ?? 0 })
  const trimmed = history.slice(-MAX_RECORDS)

  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: 'chore: online stats snapshot',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(trimmed, null, 2) + '\n'))),
      sha: file.sha,
    }),
  })
  if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status}`)
}
