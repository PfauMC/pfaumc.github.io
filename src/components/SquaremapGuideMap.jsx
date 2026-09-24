import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GAME_API_BASE } from '../lib/gameApi'
import { apiRequest } from '../lib/forumApi'
import { defaultSkinUrl } from '../utils/playerFormat'

const MAP_URL = (import.meta.env.VITE_SQUAREMAP_URL || '').replace(/\/+$/, '')

const ICONS = {
  city: '⚓', shop: '💎', landmark: '✦', build: '🏛', base: '⌂', other: '●',
}

export default function SquaremapGuideMap({ places, selected, onSelect, showRegions = false, canTrack = false }) {
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

  // Живая карта: я и игроки в радиусе 200 блоков (GET /map/nearby, только вошедшему).
  const [tracking, setTracking] = useState(false)
  const [following, setFollowing] = useState(false)
  const live = useLiveNearby(tracking)
  const liveLayer = useRef(null)

  useEffect(() => {
    if (!ready || !map.current) return
    const stopFollow = () => setFollowing(false)
    map.current.on('dragstart', stopFollow)
    return () => map.current?.off('dragstart', stopFollow)
  }, [ready])

  useEffect(() => {
    if (!ready || !map.current) return
    liveLayer.current ??= L.layerGroup().addTo(map.current)
    liveLayer.current.clearLayers()
    const data = live.data
    if (!tracking || !data?.online || data.world !== worldRef.current?.name) return
    data.nearby.forEach((p) => {
      L.marker(projection.current(p.x, p.z), { icon: headIcon(p), zIndexOffset: 500, keyboard: false }).addTo(liveLayer.current)
    })
    L.marker(projection.current(data.me.x, data.me.z), { icon: meIcon(data.me.yaw), zIndexOffset: 1000, keyboard: false }).addTo(liveLayer.current)
    if (following) map.current.panTo(projection.current(data.me.x, data.me.z), { animate: true, duration: 0.8 })
  }, [live.data, tracking, following, ready])

  const toggleTracking = () => {
    if (tracking && following) { setTracking(false); setFollowing(false); return }
    setTracking(true)
    setFollowing(true)
    if (live.data?.online) map.current?.setView(projection.current(live.data.me.x, live.data.me.z), Math.max(map.current.getZoom(), 3))
  }

  useEffect(() => {
    if (selected && map.current && projection.current) {
      map.current.flyTo(projection.current(selected.x, selected.z), Math.max(map.current.getZoom(), 3), { duration: 0.7 })
    }
  }, [selected])

  return (
    <>
      <div ref={element} className={`guide-leaflet${offline ? ' is-offline' : ''}`} />
      {offline && <div className="guide-map-note">Карта мира скоро появится — пока точки стоят по координатам</div>}
      {canTrack && ready && (
        <div className="guide-live">
          <button className={`guide-live-toggle${tracking ? ' active' : ''}`} onClick={toggleTracking}>
            {!tracking ? '📍 Следить за мной' : following ? '✕ Не следить' : '📍 Вернуться ко мне'}
          </button>
          {tracking && <LiveStatus live={live} mapWorld={worldRef.current?.name} />}
        </div>
      )}
    </>
  )
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
}

const WORLD_NAMES = { minecraft_the_nether: 'Незере', minecraft_the_end: 'Энде' }

function LiveStatus({ live, mapWorld }) {
  if (live.error) {
    return <div className="guide-live-card">{live.error.status === 401 ? 'Войдите на сайт, чтобы видеть себя на карте' : 'Живая карта пока недоступна'}</div>
  }
  const data = live.data
  if (!data) return <div className="guide-live-card">Ищем вас на сервере…</div>
  if (!data.online) return <div className="guide-live-card">Зайдите на сервер — и вы появитесь на карте</div>
  const { x, y, z } = data.me
  return (
    <div className="guide-live-card">
      <div className="guide-live-coords"><span>X</span>{x}<span>Y</span>{y}<span>Z</span>{z}</div>
      <small>
        {data.world !== mapWorld
          ? `Вы в ${WORLD_NAMES[data.world] ?? 'другом мире'} — карты этого мира нет`
          : `Рядом (${data.radius} бл.): ${data.nearby.length ? data.nearby.map((p) => p.name).join(', ') : 'никого'}`}
      </small>
    </div>
  )
}

/** Опрос /map/nearby раз в 2 с, пока включено и вкладка видна. */
function useLiveNearby(enabled) {
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    if (!enabled) { setState({ data: null, error: null }); return }
    let stopped = false
    let timer = null
    const tick = async () => {
      if (!document.hidden) {
        try {
          const data = await apiRequest(`${GAME_API_BASE}/api/v1/map/nearby`)
          if (!stopped) setState({ data, error: null })
        } catch (error) {
          if (!stopped) setState((prev) => ({ data: prev.data, error }))
        }
      }
      if (!stopped) timer = setTimeout(tick, 2000)
    }
    tick()
    return () => { stopped = true; clearTimeout(timer) }
  }, [enabled])
  return state
}

// Yaw Minecraft: 0 -- юг (+Z), 90 -- запад. На карте север сверху, поэтому стрелке +180°.
function meIcon(yaw = 0) {
  return L.divIcon({
    className: '',
    html: `<div class="guide-me" style="transform: rotate(${yaw + 180}deg)"><span></span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function headIcon(p) {
  const url = p.skin?.url ?? defaultSkinUrl(p.uuid)
  return L.divIcon({
    className: '',
    html: `<div class="guide-player"><i style="background-image:url('${encodeURI(url)}')"></i><b>${escapeHtml(p.name)}</b></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}
