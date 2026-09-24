import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Хостинг отдаёт всё с `max-age=600` и заголовкам не поддаётся, поэтому сроком жизни
// ассетов распоряжается воркер (см. public/sw.js). Регистрация после `load`: странице
// он не нужен, а его установка иначе тянет сеть на себя в самый неудачный момент.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
