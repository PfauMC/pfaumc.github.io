import { useEffect, useState } from 'react'

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

export function useOnlineHistory() {
  const [series, setSeries] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/online-history.json')
      .then((r) => r.json())
      .then((records) => {
        const sorted = [...records].sort((a, b) => new Date(a.t) - new Date(b.t))
        setSeries(
          sorted.map((r) => {
            const d = new Date(r.t)
            return { value: r.p, label: `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}` }
          })
        )
      })
      .catch(() => setSeries([]))
      .finally(() => setLoading(false))
  }, [])

  return { series, loading }
}
