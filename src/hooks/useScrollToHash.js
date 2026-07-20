import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to the element matching the current #hash once it actually exists
// in the DOM, instead of guessing a fixed delay after navigation.
export function useScrollToHash() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return

    const id = decodeURIComponent(hash.slice(1))
    let raf
    let attempts = 0

    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
        return
      }
      if (attempts++ < 30) raf = requestAnimationFrame(tryScroll)
    }

    tryScroll()
    return () => cancelAnimationFrame(raf)
  }, [hash])
}
