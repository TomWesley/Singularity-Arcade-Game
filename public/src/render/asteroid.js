// Asteroids.
//
// Debris moving fast enough to matter, drawn as a shard with a comet tail. The
// tail is the point: it is the only cue telling you how fast a rock is closing,
// and after a slingshot the same rock can be travelling five times what it
// spawned at. An earlier version scaled it at speed * 0.05 capped at 34px, which
// gave a typical 192px/s rock a nine-pixel stub -- invisible, and useless as an
// instrument.
//
// Measured speeds in play (tools/asteroid-speeds.mjs): median 192, p75 255,
// p90 309, p99 536, with rare four-figure spikes right at a horizon. The mapping
// below spans that range and saturates past it.

import { palette, rgbaToCss, withAlpha } from './theme.js'

const TAIL_MIN = 10
const TAIL_MAX = 180
const SPEED_FLOOR = 50
const SPEED_SPAN = 570
const FLUNG = 400

// Colour strings are resolved once; the hot path never rebuilds one.
let C = null
function ensureColors () {
  if (C) return
  const cool = palette.tertiary.core
  const hot = palette.danger.core
  C = {
    coolEdge: rgbaToCss(withAlpha(cool, 0.95)),
    coolFill: rgbaToCss(withAlpha(cool, 0.16)),
    hotEdge: rgbaToCss(withAlpha(hot, 0.98)),
    hotFill: rgbaToCss(withAlpha(hot, 0.20)),
    coolRGB: cool,
    hotRGB: hot
  }
}

export function drawAsteroid (ctx, a) {
  ensureColors()

  const speed = Math.hypot(a.vx, a.vy)
  const flung = speed > FLUNG
  const rgb = flung ? C.hotRGB : C.coolRGB

  // Direction of travel. A rock barely moving has no meaningful heading, so it
  // keeps its own spin instead.
  const moving = speed > 1e-3
  const ux = moving ? a.vx / speed : Math.cos(a.spin)
  const uy = moving ? a.vy / speed : Math.sin(a.spin)

  const t = Math.min(1, Math.max(0, (speed - SPEED_FLOOR) / SPEED_SPAN))
  const len = TAIL_MIN + (TAIL_MAX - TAIL_MIN) * Math.pow(t, 0.85)

  // ── Tail ──
  // A wedge as wide as the rock at its base, tapering to a point, with a
  // brighter core streak down the middle. Two shapes rather than one because a
  // single flat stroke reads as a line; a taper reads as speed.
  const px = -uy
  const py = ux
  const w = a.radius * 0.92
  const tipX = a.x - ux * len
  const tipY = a.y - uy * len

  const g = ctx.createLinearGradient(a.x, a.y, tipX, tipY)
  g.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.42 + t * 0.34})`)
  g.addColorStop(0.32, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.16 + t * 0.16})`)
  g.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)

  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(a.x + px * w, a.y + py * w)
  ctx.lineTo(a.x - px * w, a.y - py * w)
  ctx.lineTo(tipX, tipY)
  ctx.closePath()
  ctx.fill()

  // Core streak: runs two thirds of the tail, near-white at the base.
  const cg = ctx.createLinearGradient(a.x, a.y, a.x - ux * len * 0.66, a.y - uy * len * 0.66)
  cg.addColorStop(0, `rgba(255, 255, 255, ${0.34 + t * 0.44})`)
  cg.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)
  ctx.strokeStyle = cg
  ctx.lineWidth = Math.max(1, a.radius * 0.34)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(a.x - ux * len * 0.66, a.y - uy * len * 0.66)
  ctx.stroke()

  // ── The rock ──
  // Aligned to its heading and stretched along it, so fast debris reads as a
  // dart rather than a pebble that happens to be moving.
  const stretch = 1 + t * 0.85

  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(Math.atan2(uy, ux))
  ctx.scale(stretch, 1)
  ctx.rotate(a.spin * 0.35)

  ctx.beginPath()
  const v = a.verts
  for (let i = 0; i < v.length; i++) {
    const vx = Math.cos(v[i].a) * v[i].r
    const vy = Math.sin(v[i].a) * v[i].r
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy)
  }
  ctx.closePath()

  ctx.fillStyle = flung ? C.hotFill : C.coolFill
  ctx.fill()
  ctx.strokeStyle = flung ? C.hotEdge : C.coolEdge
  ctx.lineWidth = 1.1
  ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`
  ctx.shadowBlur = 6 + t * 10
  ctx.stroke()
  ctx.restore()
}
