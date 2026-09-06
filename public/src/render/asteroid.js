// Asteroids.
//
// Silhouette, not texture: a hard-edged shard with a single stroke and a flat
// translucent fill. No per-rock gradient, no shadow blur, no trail unless the
// rock has actually been flung -- and then the trail is one line, because a
// streak reads faster than a plume.

import { palette, rgbaToCss, withAlpha } from './theme.js'

// Pre-resolved so the hot path never rebuilds a colour string.
let COOL = null
let HOT = null
let FILL = null

function ensureColors () {
  if (COOL) return
  COOL = rgbaToCss(withAlpha(palette.tertiary.core, 0.85))
  HOT = rgbaToCss(withAlpha(palette.danger.core, 0.9))
  FILL = rgbaToCss(withAlpha(palette.tertiary.core, 0.13))
}

export function drawAsteroid (ctx, a) {
  ensureColors()
  const speed = Math.hypot(a.vx, a.vy)
  const flung = speed > 300

  if (speed > 120) {
    const ux = a.vx / speed
    const uy = a.vy / speed
    const len = Math.min(34, speed * 0.05)
    ctx.strokeStyle = rgbaToCss(withAlpha(
      flung ? palette.danger.core : palette.tertiary.core, 0.22))
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(a.x - ux * len, a.y - uy * len)
    ctx.stroke()
  }

  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(a.spin)
  ctx.beginPath()
  const v = a.verts
  for (let i = 0; i < v.length; i++) {
    const px = Math.cos(v[i].a) * v[i].r
    const py = Math.sin(v[i].a) * v[i].r
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = FILL
  ctx.fill()
  ctx.strokeStyle = flung ? HOT : COOL
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}
