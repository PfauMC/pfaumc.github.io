// Загрузчик модулей для локального dev-сервера: подменяет @netlify/neon
// на PGlite-шим. Благодаря этому netlify/functions/** остаются нетронутыми —
// локально исполняется ровно тот же код, что и в проде.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@netlify/neon') {
    return nextResolve(new URL('./dev-neon-shim.mjs', import.meta.url).href, context)
  }
  return nextResolve(specifier, context)
}
