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
import NotFoundPage from './pages/NotFoundPage'
import WikiLayout from './pages/wiki/WikiLayout'
import WikiIndex from './pages/wiki/WikiIndex'
import WikiGuide from './pages/wiki/WikiGuide'
import WikiFAQ from './pages/wiki/WikiFAQ'
import WikiRules from './pages/wiki/WikiRules'
import WikiMechanics from './pages/wiki/WikiMechanics'

function HomePage() {
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
    const minDisplayTime = 1800
    const start = Date.now()

    const handleLoad = () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, minDisplayTime - elapsed)
      setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setLoading(false), 500)
      }, remaining)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    const blockContextMenu = (e) => e.preventDefault()
    const blockDrag = (e) => {
      if (e.target.tagName === 'IMG') e.preventDefault()
    }
    const blockShortcuts = (e) => {
      const key = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(key)) {
        e.preventDefault()
      }
      if (e.key === 'F12') e.preventDefault()
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('dragstart', blockDrag)
    document.addEventListener('keydown', blockShortcuts)

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('dragstart', blockDrag)
      document.removeEventListener('keydown', blockShortcuts)
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
            <Route path="/wiki" element={<WikiLayout />}>
              <Route index element={<WikiIndex />} />
              <Route path="guide" element={<WikiGuide />} />
              <Route path="faq" element={<WikiFAQ />} />
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
