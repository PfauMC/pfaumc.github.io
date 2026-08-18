import { useEffect, useState } from 'react'
import { usePlayerMeta } from '../hooks/usePlayerMeta'
import { avatarUrl } from '../utils/playerFormat'

/**
 * Голова из полного скина: лицо лежит в (8,8), шляпа — в (40,8), обе 8×8.
 * Масштаб восьмикратный, чтобы 8 пикселей лица заняли ровно size; шляпа идёт
 * первым слоем фона и потому рисуется поверх лица.
 *
 * Высота фона — auto, а не 8×size: у старых скинов холст 64×32, и жёсткая
 * высота растянула бы их вдвое. Ширина у обоих форматов 64, поэтому масштаб,
 * заданный только по ширине, верен для любого из них.
 *
 * Без скина откатываемся на mc-heads: хранилище скинов наполняется по мере
 * входов игроков, и пока оно неполное, буква-заглушка выглядела бы поломкой.
 *
 * Если скин не передали, но известен игрок — добираем его профилем: в списках
 * игроков скина уже нет. `hydrate={false}` отключает добор там, где профиль уже
 * прочитан целиком: пустой скин там означает «скина нет», а не «мы его не спросили».
 */
export default function PlayerHead({ skin, uuid, name, size = 40, hydrate = true, className = '' }) {
  const hydrated = usePlayerMeta(hydrate && !skin ? uuid : null)
  const url = skin?.url ?? hydrated?.skin?.url
  const hat = useHatLayer(url)
  const box = { width: size, height: size, imageRendering: 'pixelated' }

  if (!url) {
    return (
      <img
        src={avatarUrl(uuid, size * 2)}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        className={`bg-bg-section ${className}`}
        style={box}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`bg-bg-section ${className}`}
      style={{
        ...box,
        backgroundImage: hat ? `url(${url}), url(${url})` : `url(${url})`,
        backgroundSize: `${size * 8}px auto`,
        backgroundPosition: hat ? `${size * -5}px ${-size}px, ${-size}px ${-size}px` : `${-size}px ${-size}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}

/**
 * У скинов 64×32 второй слой залит непрозрачным чёрным — игра считала его
 * прозрачным по соглашению, а браузер закрасит им всё лицо. Поэтому шляпу
 * накладываем, только убедившись, что холст новый, 64×64.
 *
 * Картинку к этому моменту уже тянет фон, так что проба берётся из кеша.
 */
function useHatLayer(url) {
  const [hat, setHat] = useState(false)

  useEffect(() => {
    if (!url) return
    setHat(false)
    const probe = new Image()
    probe.onload = () => setHat(probe.naturalHeight >= probe.naturalWidth)
    probe.src = url
    return () => { probe.onload = null }
  }, [url])

  return hat
}
