import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

export default function NotFoundPage() {
  useSEO('404 — Страница не найдена | PfauMC')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="font-mono text-6xl font-bold text-white">404</p>
      <p className="text-text-light text-lg">Страница не найдена</p>
      <Link to="/" className="btn-primary mt-2">← На главную</Link>
    </div>
  )
}
