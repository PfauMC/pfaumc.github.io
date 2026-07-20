import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const copy = useCallback(async (text) => {
    let ok = true
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      try {
        const el = document.createElement('textarea')
        el.value = text
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      } catch {
        ok = false
      }
    }

    clearTimeout(timerRef.current)
    setCopied(ok)
    setError(!ok)
    timerRef.current = setTimeout(() => { setCopied(false); setError(false) }, resetMs)
    return ok
  }, [resetMs])

  return { copied, error, copy }
}
