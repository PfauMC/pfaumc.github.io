import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Modes from './components/Modes'
import Rules from './components/Rules'
import Footer from './components/Footer'
import ModePage from './pages/ModePage'

function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <Modes />
      <Rules />
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

  // Copy & download protection
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
    <>
      {loading && <LoadingScreen fadeOut={fadeOut} />}
      <div className={fadeOut || !loading ? 'visible' : 'invisible'}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:modeId" element={<ModePage />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}
