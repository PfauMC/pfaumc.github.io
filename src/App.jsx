import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ForumAuthProvider } from './context/ForumAuthContext'
import LoadingScreen from './components/LoadingScreen'
import Fireflies from './components/Fireflies'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import ServerStats from './components/ServerStats'
import Footer from './components/Footer'
import { useScrollToHash } from './hooks/useScrollToHash'

// Страницы грузятся по требованию. Иначе форумный редактор, вики и граф связей едут
// одним куском с любой открытой страницей, а хостинг отдаёт ассеты со сроком жизни в
// десять минут -- то есть лишний вес оплачивается не однажды, а при каждом заходе.
const named = (loader, key) => lazy(() => loader().then((m) => ({ default: m[key] })))

const PlayersPage = lazy(() => import('./pages/PlayersPage'))
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'))
const BanListPage = lazy(() => import('./pages/BanListPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const WikiLayout = lazy(() => import('./pages/wiki/WikiLayout'))
const WikiIndex = lazy(() => import('./pages/wiki/WikiIndex'))
const WikiArticle = lazy(() => import('./pages/wiki/WikiArticle'))
const WikiEditor = lazy(() => import('./pages/wiki/WikiEditor'))
const ForumHome = lazy(() => import('./pages/forum/ForumHome'))
const CategoryPage = lazy(() => import('./pages/forum/CategoryPage'))
const TopicPage = lazy(() => import('./pages/forum/TopicPage'))
const SearchPage = lazy(() => import('./pages/forum/SearchPage'))
const AuthGamePage = lazy(() => import('./pages/forum/AuthGamePage'))
const AuthFailedPage = lazy(() => import('./pages/forum/AuthFailedPage'))
const MyPostsPage = named(() => import('./pages/forum/UserPages'), 'MyPostsPage')
const SubscriptionsPage = named(() => import('./pages/forum/UserPages'), 'SubscriptionsPage')
const ForumSettingsPage = named(() => import('./pages/forum/UserPages'), 'ForumSettingsPage')
const ReportsPage = named(() => import('./pages/forum/ModPages'), 'ReportsPage')
const ModLogPage = named(() => import('./pages/forum/ModPages'), 'ModLogPage')
const TrashPage = named(() => import('./pages/forum/ModPages'), 'TrashPage')
const ArchivePage = named(() => import('./pages/forum/ModPages'), 'ArchivePage')
const CitiesPage = lazy(() => import('./pages/cities/CitiesPage'))
const CityPage = lazy(() => import('./pages/cities/CityPage'))
const CityApplicationsPage = lazy(() => import('./pages/cities/CityApplicationsPage'))
const GuideApplicationsPage = lazy(() => import('./pages/moderation/GuideApplicationsPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))

function HomePage() {
  useScrollToHash()
  return (
    <main>
      <Hero />
      <Features />
      <ServerStats />
    </main>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  // Заставка уходит, как только отрисовался React, а не по событию `load`: `load`
  // ждёт последнюю картинку и шрифт, из-за чего готовая страница ещё полсекунды
  // пряталась за заставкой.
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setFadeOut(true)
    const timer = setTimeout(() => setLoading(false), reduceMotion ? 0 : 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider>
      <ForumAuthProvider>
      {loading && <LoadingScreen fadeOut={fadeOut} />}
      <div className={fadeOut || !loading ? 'visible' : 'invisible'}>
        <Fireflies count={22} />
        <Navbar />
        <div>
          {/* Пока грузится чанк страницы, футер иначе стоит на первом экране и потом уезжает вниз. */}
          <div className="min-h-screen">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/stats" element={<Navigate to={{ pathname: '/', hash: '#stats' }} replace />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/u/:nickname" element={<PlayerProfilePage />} />
              <Route path="/moderation" element={<Navigate to="/moderation/bans" replace />} />
              <Route path="/moderation/bans" element={<BanListPage />} />
              <Route path="/moderation/reports" element={<ReportsPage />} />
              <Route path="/moderation/cities" element={<CityApplicationsPage />} />
              <Route path="/moderation/guide" element={<GuideApplicationsPage />} />
              <Route path="/moderation/log" element={<ModLogPage />} />
              {/* Старые адреса -- в «Модерацию» */}
              <Route path="/bans" element={<Navigate to="/moderation/bans" replace />} />
              <Route path="/forum/reports" element={<Navigate to="/moderation/reports" replace />} />
              <Route path="/forum/log" element={<Navigate to="/moderation/log" replace />} />
              <Route path="/cities/applications" element={<Navigate to="/moderation/cities" replace />} />
              <Route path="/wiki" element={<WikiLayout />}>
                <Route index element={<WikiIndex />} />
                <Route path="new" element={<WikiEditor />} />
                {/* Старые вкладки правил -- теперь отдельные статьи */}
                <Route path="rules/vanilla" element={<Navigate to="/wiki/rules-vanilla" replace />} />
                <Route path="rules/roles" element={<Navigate to="/wiki/rules-roles" replace />} />
                <Route path=":slug" element={<WikiArticle />} />
                <Route path=":slug/edit" element={<WikiEditor />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="/forum" element={<ForumHome />} />
              <Route path="/forum/c/:slug" element={<CategoryPage />} />
              <Route path="/forum/t/:id" element={<TopicPage />} />
              <Route path="/forum/search" element={<SearchPage />} />
              <Route path="/forum/my-posts" element={<MyPostsPage />} />
              <Route path="/forum/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/forum/settings" element={<ForumSettingsPage />} />
              <Route path="/forum/trash" element={<TrashPage />} />
              <Route path="/forum/archive" element={<ArchivePage />} />
              <Route path="/cities" element={<CitiesPage />} />
              <Route path="/cities/:slug" element={<CityPage />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/auth/game" element={<AuthGamePage />} />
              <Route path="/auth/failed" element={<AuthFailedPage />} />
              {/* Страницы режима больше нет -- старая ссылка ведёт на главную. */}
              <Route path="/vanilla" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </div>
          <Footer />
        </div>
      </div>
      </ForumAuthProvider>
    </ThemeProvider>
  )
}
