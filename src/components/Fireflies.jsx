import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function Fireflies({ count = 28 }) {
  const canvasRef = useRef(null)
  const { isDark } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let W, H

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const fireflies = Array.from({ length: count }, () => ({
      x: Math.random() * (W || 1200),
      y: Math.random() * (H || 800),
      r: Math.random() * 1.8 + 1.2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.2,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      alphaSpeed: Math.random() * 0.008 + 0.004,
      pulsePhase: Math.random() * Math.PI * 2,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      const hue = isDark ? 175 : 45
      const lightness = isDark ? 70 : 55
      const maxAlpha = isDark ? 0.85 : 0.55
      const glowSize = isDark ? 7 : 5

      fireflies.forEach(f => {
        f.wanderAngle += f.wanderSpeed
        f.vx = Math.cos(f.wanderAngle) * 0.35 + (Math.random() - 0.5) * 0.05
        f.vy = Math.sin(f.wanderAngle) * 0.35 + (Math.random() - 0.5) * 0.05

        f.x += f.vx
        f.y += f.vy
        if (f.x < 0) f.x = W
        if (f.x > W) f.x = 0
        if (f.y < 0) f.y = H
        if (f.y > H) f.y = 0

        f.alpha += f.alphaDir * f.alphaSpeed
        if (f.alpha >= maxAlpha) { f.alpha = maxAlpha; f.alphaDir = -1 }
        if (f.alpha <= 0.1) { f.alpha = 0.1; f.alphaDir = 1 }

        const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * glowSize)
        glow.addColorStop(0, `hsla(${hue}, 100%, ${lightness}%, ${f.alpha})`)
        glow.addColorStop(0.4, `hsla(${hue}, 100%, ${lightness}%, ${f.alpha * 0.3})`)
        glow.addColorStop(1, `hsla(${hue}, 100%, ${lightness}%, 0)`)
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * glowSize, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${Math.min(f.alpha * 1.4, 1)})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [count, isDark])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, mixBlendMode: isDark ? 'screen' : 'multiply', opacity: isDark ? 0.8 : 0.4 }}
    />
  )
}
