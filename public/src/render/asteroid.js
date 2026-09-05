// Asteroids as angular debris rather than the original's soft blobs: a faceted
// silhouette with a thin glowing edge, a cold gradient core, and a velocity
// trail that lengthens as a slingshot accelerates it. The trail is the tell for
// which rocks have been flung by a hole and are now genuinely dangerous.

import { palette, rgbaToCss, withAlpha } from './theme.js'

export function drawAsteroid (ctx, a) {
  const speed = Math.hypot(a.vx, a.vy)
  const hot = Math.min(1, speed / 520)

  ctx.save()

  // Motion trail, drawn behind and opposite the velocity vector.
  if (speed > 40) {
    const ux = a.vx / speed
    const uy = a.vy / speed
    const len = Math.min(46, speed * 0.075)
    const g = ctx.createLinearGradient(a.x, a.y, a.x - ux * len, a.y - uy * len)
    g.addColorStop(0, rgbaToCss(withAlpha(palette.tertiary.core, 0.30 + hot * 0.3)))
    g.addColorStop(1, rgbaToCss(withAlpha(palette.tertiary.core, 0)))
    ctx.strokeStyle = g
    ctx.lineWidth = a.radius * 0.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(a.x - ux * len, a.y - uy * len)
    ctx.stroke()
  }

  ctx.translate(a.x, a.y)
  ctx.rotate(a.spin)

  ctx.beginPath()
  a.verts.forEach((v, i) => {
    const px = Math.cos(v.a) * v.r
    const py = Math.sin(v.a) * v.r
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  })
  ctx.closePath()

  const fill = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, 0, 0, 0, a.radius)
  fill.addColorStop(0, rgbaToCss(withAlpha(palette.tertiary.core, 0.30)))
  fill.addColorStop(1, rgbaToCss(withAlpha(palette.tertiary.dim, 0.10)))
  ctx.fillStyle = fill
  ctx.fill()

  // Rocks flung fast by a slingshot glow hotter, which is the warning.
  ctx.strokeStyle = rgbaToCss(withAlpha(
    hot > 0.6 ? palette.danger.core : palette.tertiary.core,
    0.55 + hot * 0.4
  ))
  ctx.lineWidth = 1.1
  ctx.shadowColor = rgbaToCss(withAlpha(palette.tertiary.glow, 0.6 + hot * 0.4))
  ctx.shadowBlur = 5 + hot * 8
  ctx.stroke()

  ctx.restore()
}
