import { useEffect } from 'react'

export function useSEO(title, description) {
  useEffect(() => {
    if (title) document.title = title

    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', description)
    }
  }, [title, description])
}
