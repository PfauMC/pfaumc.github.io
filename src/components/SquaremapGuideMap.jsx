import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MAP_URL = (import.meta.env.VITE_SQUAREMAP_URL || '').replace(/\/+$/, '')

const ICONS = {
  city: '⚓', shop: '💎', landmark: '✦', build: '🏛', base: '⌂', other: '●',
}

export default function SquaremapGuideMap({ places, selected, onSelect, showRegions = false }) {
  const element = useRef(null)
  const map = useRef(null)
  const markers = useRef(null)
  const projection = useRef(null)
  const fitted = useRef(false)
  const worldRef = useRef(null)
  const [offline, setOffline] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      let world = null
      let worldSettings = null
      if (MAP_URL) {
        try {
          const getJson = async (url) => {
            const res = await fetch(url)
            if (!res.ok) throw new Error(url)
            return res.json()
          }
          world = (await getJson(`${MAP_URL}/tiles/settings.json`)).worlds[0]
          worldSettings = await getJson(`${MAP_URL}/tiles/${world.name}/settings.json`)
        } catch {
          worldSettings = null
        }
      }
      if (cancelled) return

      // Без squaremap всё равно рисуем карту: пустая сетка в тех же координатах, что
      // и мир, -- точки стоят на своих местах, и путеводитель работает до подключения тайлов.
      const zoom = worldSettings?.zoom ?? { max: 3, extra: 2, def: 0 }
      const spawn = worldSettings?.spawn ?? { x: 0, z: 0 }
      const scale = 1 / (2 ** zoom.max)
      projection.current = (x, z) => L.latLng(-z * scale, x * scale)
      const instance = L.map(element.current, {
        crs: L.CRS.Simple,
        attributionControl: false,
        zoomControl: true,
        minZoom: worldSettings ? 0 : -3,
        maxZoom: zoom.max + zoom.extra,
      })
      if (worldSettings) {
        L.tileLayer(`${MAP_URL}/tiles/${world.name}/{z}/{x}_{y}.png`, {
          tileSize: 512,
          minNativeZoom: 0,
          maxNativeZoom: zoom.max,
          errorTileUrl: `${MAP_URL}/images/clear.png`,
        }).addTo(instance)
      }
      instance.setView(projection.current(spawn.x, spawn.z), zoom.def)
      markers.current = L.layerGroup().addTo(instance)
      map.current = instance
      worldRef.current = worldSettings ? world : null
      setOffline(!worldSettings)
      setReady(true)
    }
    load()
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !markers.current || !projection.current) return
    markers.current.clearLayers()
    places.forEach((place) => {
      const marker = L.marker(projection.current(place.x, place.z), {
        icon: L.divIcon({
          className: '',
          html: `<button class="guide-marker${selected?.id === place.id ? ' active' : ''}" aria-label="${escapeHtml(place.name)}"><span>${ICONS[place.category] ?? ICONS.other}</span></button>`,
          iconSize: [42, 48],
          iconAnchor: [21, 42],
        }),
      })
      marker.on('click', () => onSelect(place))
      marker.addTo(markers.current)
    })
    // Без тайлов смотреть с точки спавна бессмысленно -- один раз показываем все места.
    if (offline && !fitted.current && places.length) {
      fitted.current = true
      map.current.fitBounds(L.latLngBounds(places.map((p) => projection.current(p.x, p.z))), { padding: [80, 80], maxZoom: 0 })
    }
  }, [places, selected?.id, onSelect, ready, offline])

  // Слои регионов из squaremap (pfaumc_region*) -- только для админов. Сами данные
  // squaremap всё равно публичны, это скрытие с нашего сайта, а не защита.
  useEffect(() => {
    if (!showRegions || !ready || !worldRef.current) return
    let cancelled = false
    let control = null
    const layers = []
    fetch(`${MAP_URL}/tiles/${worldRef.current.name}/markers.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((groups) => {
        if (cancelled || !map.current) return
        const overlays = {}
        groups.filter((g) => g.id.startsWith('pfaumc_region')).forEach((g) => {
          const layer = L.layerGroup(g.markers.filter((m) => m.type === 'polygon').map((m) => {
            const { type, points, popup, tooltip, ...style } = m
            const polygon = L.polygon(points.map((poly) => poly.map((ring) => ring.map((p) => projection.current(p.x, p.z)))), style)
            if (popup) polygon.bindPopup(popup)
            return polygon
          }))
          if (!g.hide) layer.addTo(map.current)
          overlays[g.name] = layer
          layers.push(layer)
        })
        if (layers.length) control = L.control.layers(null, overlays, { collapsed: true, position: 'bottomright' }).addTo(map.current)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      layers.forEach((layer) => layer.remove())
      control?.remove()
    }
  }, [showRegions, ready])

  useEffect(() => {
    if (selected && map.current && projection.current) {
      map.current.flyTo(projection.current(selected.x, selected.z), Math.max(map.current.getZoom(), 3), { duration: 0.7 })
    }
  }, [selected])

  return (
    <>
      <div ref={element} className={`guide-leaflet${offline ? ' is-offline' : ''}`} />
      {offline && <div className="guide-map-note">Карта мира скоро появится — пока точки стоят по координатам</div>}
    </>
  )
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
}
