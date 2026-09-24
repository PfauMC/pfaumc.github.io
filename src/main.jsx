import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { prefetchApiData } from './hooks/useApiData'
import { citiesApi } from './lib/citiesApi'

// Хостинг отдаёт всё с `max-age=600` и заголовкам не поддаётся, поэтому сроком жизни
// ассетов распоряжается воркер (см. public/sw.js). Регистрация после `load`: странице
// он не нужен, а его установка иначе тянет сеть на себя в самый неудачный момент.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Страницы грузятся лениво, и без этого их первый запрос уходил бы только после чанка.
// Пути те же, что страницы просят сами, -- иначе запрос просто уйдёт дважды.
function prefetchRouteData({ pathname, search }) {
  const params = new URLSearchParams(search)
  if (pathname === '/forum') return prefetchApiData('/forum/categories')
  if (pathname === '/cities') return prefetchApiData('', citiesApi)

  const topic = pathname.match(/^\/forum\/t\/([^/]+)$/)
  if (topic) {
    prefetchApiData(`/forum/topics/${topic[1]}`)
    if (!params.has('post')) prefetchApiData(`/forum/topics/${topic[1]}/posts?page=${Number.parseInt(params.get('page') ?? '', 10) || 1}`)
    return
  }

  const city = pathname.match(/^\/cities\/([^/]+)$/)
  if (city && city[1] !== 'applications') prefetchApiData(`/${city[1]}`, citiesApi)
}

prefetchRouteData(window.location)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
