// Asteroids.
//
// Debris drawn as a solid rock with a curved comet tail.
//
// The tail follows the path the rock actually travelled, taken from the position
// history the entity records at a fixed interval, rather than being extrapolated
// backwards along the current velocity vector. That matters here more than in
// most games: these rocks are on genuine gravitational trajectories, so a
// straight tail is not a stylisation, it is wrong. Whipping past a hole, the
// trail bends exactly as the path did.
//
// Recording at a fixed time step also makes the tail's length proportional to
// speed for free -- distance covered per sample is speed -- so it stays a
// truthful read-out of how fast a rock is closing.

import { palette, rgbaToCss, withAlpha } from './theme.js'

const MAX_TAIL = 105     // px; a long slingshot streak is capped here
const FLUNG = 400        // px/s; past this a rock is a genuine problem

let C = null
function ensureColors () {
  if (C) return
  const cool = palette.tertiary.core
  const hot = palette.danger.core
  C = {
    cool,
    hot,
    coolBody: rgbaToCss(withAlpha(cool, 0.92)),
    hotBody: rgbaToCss(withAlpha(hot, 0.92)),
    coolEdge: 'rgba(226, 244, 255, 0.95)',
    hotEdge: 'rgba(255, 226, 232, 0.95)'
  }
}

export function drawAsteroid (ctx, a) {
  ensureColors()

  const speed = Math.hypot(a.vx, a.vy)
  const flung = speed > FLUNG
  const rgb = flung ? C.hot : C.cool
  const moving = speed > 1e-3
  const ux = moving ? a.vx / speed : Math.cos(a.spin)
  const uy = moving ? a.vy / speed : Math.sin(a.spin)

  drawTail(ctx, a, rgb)

  // ── The rock ──
  // Aligned to its heading and stretched along it, so fast debris reads as a
  // dart rather than a pebble that happens to be moving.
  const stretch = 1 + Math.min(1, speed / 620) * 0.5

  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(Math.atan2(uy, ux))
  ctx.scale(stretch, 1)
  ctx.rotate(a.spin * 0.35)

  const v = a.verts
  const n = v.length
  const fx = a.facetOrigin.x
  const fy = a.facetOrigin.y

  // Faces, fanned from the interior origin to each hull edge. Each is filled
  // flat at its own fixed brightness, which is what makes the rock read as a
  // broken mineral body instead of a filled outline with scratches on it.
  for (let i = 0; i < n; i++) {
    const v0 = v[i]
    const v1 = v[(i + 1) % n]
    const s = a.faceShade[i]
    ctx.fillStyle = `rgb(${Math.round(rgb[0] * s)}, ${Math.round(rgb[1] * s)}, ${Math.round(rgb[2] * s)})`
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(Math.cos(v0.a) * v0.r, Math.sin(v0.a) * v0.r)
    ctx.lineTo(Math.cos(v1.a) * v1.r, Math.sin(v1.a) * v1.r)
    ctx.closePath()
    ctx.fill()
    // Hairline on the shared edge tightens the facet break.
    ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.22)`
    ctx.lineWidth = 0.6
    ctx.stroke()
  }

  // Hull outline last, so no facet edge bleeds over it.
  ctx.strokeStyle = flung ? C.hotEdge : C.coolEdge
  ctx.lineWidth = 1.1
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const vx = Math.cos(v[i].a) * v[i].r
    const vy = Math.sin(v[i].a) * v[i].r
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

// Builds a tapered ribbon along the recorded path. Walks the history from newest
// to oldest, accumulating arc length, and stops at MAX_TAIL. Each sample gets a
// perpendicular whose half-width shrinks to nothing at the tip, so the ribbon is
// a taper rather than a constant-width stroke -- a taper reads as speed.
function drawTail (ctx, a, rgb) {
  const trail = a.trail
  if (trail.length < 2) return

  const left = []
  const right = []
  let travelled = 0
  let prevX = a.x
  let prevY = a.y
  let count = 0

  for (let i = 0; i < trail.length; i++) {
    const p = trail[i]
    const dx = p.x - prevX
    const dy = p.y - prevY
    const seg = Math.hypot(dx, dy)

    // A recycled rock can teleport across the board; never span that gap.
    if (seg > 240) break

    travelled += seg
    if (travelled > MAX_TAIL) break

    // Tangent from the neighbouring samples, so the ribbon follows the curve.
    const nx = i + 1 < trail.length ? trail[i + 1].x : p.x
    const ny = i + 1 < trail.length ? trail[i + 1].y : p.y
    let tx = nx - prevX
    let ty = ny - prevY
    const tl = Math.hypot(tx, ty)
    if (tl < 1e-5) { prevX = p.x; prevY = p.y; continue }
    tx /= tl; ty /= tl

    const k = 1 - travelled / MAX_TAIL
    const w = a.radius * 0.85 * k * k
    left.push([p.x - ty * w, p.y + tx * w])
    right.push([p.x + ty * w, p.y - tx * w])

    prevX = p.x
    prevY = p.y
    count++
  }

  if (count < 2) return

  const tip = trail[Math.min(count, trail.length - 1)]
  const g = ctx.createLinearGradient(a.x, a.y, tip.x, tip.y)
  const head = Math.min(0.85, 0.35 + (travelled / MAX_TAIL) * 0.55)
  g.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${head})`)
  g.addColorStop(0.4, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${head * 0.35})`)
  g.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)

  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  for (const [x, y] of left) ctx.lineTo(x, y)
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1])
  ctx.closePath()
  ctx.fillStyle = g
  ctx.fill()

  // Hot core along the first stretch of the path.
  const cg = ctx.createLinearGradient(a.x, a.y, tip.x, tip.y)
  cg.addColorStop(0, `rgba(255, 255, 255, ${head * 0.85})`)
  cg.addColorStop(0.45, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${head * 0.30})`)
  cg.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)
  ctx.strokeStyle = cg
  ctx.lineWidth = Math.max(1, a.radius * 0.3)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  for (let i = 0; i < count; i++) ctx.lineTo(trail[i].x, trail[i].y)
  ctx.stroke()
}
