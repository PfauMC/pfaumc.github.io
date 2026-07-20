import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import LoadingScreen from './components/LoadingScreen'
import Fireflies from './components/Fireflies'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Modes from './components/Modes'
import Footer from './components/Footer'
import ModePage from './pages/ModePage'
import StatsPage from './pages/StatsPage'
import PlayersPage from './pages/PlayersPage'
import PlayerProfilePage from './pages/PlayerProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import WikiLayout from './pages/wiki/WikiLayout'
import WikiIndex from './pages/wiki/WikiIndex'
import WikiGuide from './pages/wiki/WikiGuide'
import WikiRules from './pages/wiki/WikiRules'
import WikiMechanics from './pages/wiki/WikiMechanics'
import { useScrollToHash } from './hooks/useScrollToHash'

function HomePage() {
  useScrollToHash()
  return (
    <main>
      <Hero />
      <Features />
      <Modes />
    </main>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fadeDuration = reduceMotion ? 0 : 500

    const handleLoad = () => {
      setFadeOut(true)
      setTimeout(() => setLoading(false), fadeDuration)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  return (
    <ThemeProvider>
      {loading && <LoadingScreen fadeOut={fadeOut} />}
      <div className={fadeOut || !loading ? 'visible' : 'invisible'}>
        <Fireflies count={22} />
        <Navbar />
        <div>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/u/:nickname" element={<PlayerProfilePage />} />
            <Route path="/wiki" element={<WikiLayout />}>
              <Route index element={<WikiIndex />} />
              <Route path="guide" element={<WikiGuide />} />
              <Route path="rules" element={<WikiRules />} />
              <Route path="rules/:tab" element={<WikiRules />} />
              <Route path="mechanics" element={<WikiMechanics />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="/:modeId" element={<ModePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  )
}
