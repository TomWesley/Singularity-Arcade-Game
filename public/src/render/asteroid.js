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

import { SYSTEM_SPEED_LIMIT } from '../game/physics.js'

const MAX_TAIL = 62      // px; a long slingshot streak is capped here

// Ice, not embers.
//
// One colour ramp driven by speed and nothing else, so the eye reads the board
// as a single continuous scale rather than a set of categories -- but the scale
// is now brightness rather than heat. Dim blue-grey ice at rest, climbing to
// brilliant white at the board's speed limit.
//
// It is the better physical story as well as the better picture. These are not
// glowing rocks: they are dirty ice on hard gravitational trajectories, and a
// body of ice whipping through a gravity well is exactly the thing that brightens
// -- it heats, it sublimates, and it throws off a coma. A comet is dark and
// almost invisible out in the cold and spectacular near its periapsis, which is
// the same relationship between speed and brightness this ramp already had,
// only now it is the one that actually happens.
const ICE_COLD = [150, 170, 196]
const ICE_WARM = [206, 226, 246]
const ICE_HOT = [255, 255, 255]
const SPECULAR = 'rgba(255, 255, 255, 0.95)'

// The coma: one cached white radial sprite, scaled and faded per rock.
//
// Cached because there are dozens of these on the board every frame and a
// per-rock radial gradient is the kind of thing that turned this game into a
// slideshow once already. One sprite, drawn additively, costs a blit.
let comaSprite = null
function coma () {
  if (comaSprite) return comaSprite
  const size = 128
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const c = cv.getContext('2d')
  const h = size / 2
  const g = c.createRadialGradient(h, h, 0, h, h, h)
  // A tight white core falling off into a cold blue halo -- ice scatters short
  // wavelengths, so the outer coma goes blue rather than simply dimmer.
  g.addColorStop(0, 'rgba(255, 255, 255, 0.90)')
  g.addColorStop(0.18, 'rgba(236, 246, 255, 0.46)')
  g.addColorStop(0.45, 'rgba(198, 224, 255, 0.14)')
  g.addColorStop(1, 'rgba(170, 206, 255, 0)')
  c.fillStyle = g
  c.fillRect(0, 0, size, size)
  comaSprite = cv
  return cv
}

function ramp (a, b, k) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k)
  ]
}

/** Ice colour for a given speed, 0 at rest through 1 at the board's limit. */
function iceAt (k) {
  return k < 0.5 ? ramp(ICE_COLD, ICE_WARM, k / 0.5)
    : ramp(ICE_WARM, ICE_HOT, (k - 0.5) / 0.5)
}

export function drawAsteroid (ctx, a) {
  const speed = Math.hypot(a.vx, a.vy)
  // Normalised against the board's speed limit so the whole range of the ramp
  // is actually reachable.
  const heat = Math.min(1, Math.pow(speed / SYSTEM_SPEED_LIMIT, 0.42))
  const rgb = iceAt(heat)
  const moving = speed > 1e-3
  const ux = moving ? a.vx / speed : Math.cos(a.spin)
  const uy = moving ? a.vy / speed : Math.sin(a.spin)

  // Coma first, under everything, drawn additively so it reads as light thrown
  // off rather than paint laid over. It grows and brightens with speed for the
  // same reason the body does.
  const cr = a.radius * (3.1 + heat * 2.6)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 0.30 + heat * 0.52
  ctx.drawImage(coma(), a.x - cr, a.y - cr, cr * 2, cr * 2)
  ctx.restore()

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
  const inner = a.inner
  const n = v.length

  const ox = new Array(n)
  const oy = new Array(n)
  const ix = new Array(n)
  const iy = new Array(n)
  for (let i = 0; i < n; i++) {
    ox[i] = Math.cos(v[i].a) * v[i].r
    oy[i] = Math.sin(v[i].a) * v[i].r
    ix[i] = Math.cos(inner[i].a) * inner[i].r
    iy[i] = Math.sin(inner[i].a) * inner[i].r
  }

  const shade = s => `rgb(${Math.round(rgb[0] * s)}, ${Math.round(rgb[1] * s)}, ${Math.round(rgb[2] * s)})`

  // Rim band: a quad per hull edge, running from the outline in to the shoulder.
  // These carry the strongest light-to-dark range, so they are what gives the
  // body its volume.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    ctx.fillStyle = shade(a.rimShade[i])
    ctx.beginPath()
    ctx.moveTo(ox[i], oy[i])
    ctx.lineTo(ox[j], oy[j])
    ctx.lineTo(ix[j], iy[j])
    ctx.lineTo(ix[i], iy[i])
    ctx.closePath()
    ctx.fill()
  }

  // Cap: a fan across the raised middle, flatter to the light and so brighter
  // and less varied than the rim.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    ctx.fillStyle = shade(a.capShade[i])
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(ix[i], iy[i])
    ctx.lineTo(ix[j], iy[j])
    ctx.closePath()
    ctx.fill()
  }

  // Shoulder crease: the boundary between cap and rim, drawn faintly so the
  // two bands separate even where their shading happens to match.
  ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.34)`
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(ix[0], iy[0])
  for (let i = 1; i < n; i++) ctx.lineTo(ix[i], iy[i])
  ctx.closePath()
  ctx.stroke()

  // Hull outline.
  ctx.strokeStyle = `rgba(${Math.min(255, rgb[0] + 46)}, ${Math.min(255, rgb[1] + 38)}, ${Math.min(255, rgb[2] + 34)}, 0.95)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ox[0], oy[0])
  for (let i = 1; i < n; i++) ctx.lineTo(ox[i], oy[i])
  ctx.closePath()
  ctx.stroke()

  // Specular edge: a short bright arc over the few hull vertices facing into
  // the light. At these sizes it does more for the sense of a hard mineral
  // surface than any amount of extra geometry.
  const li = a.litIndex
  ctx.strokeStyle = SPECULAR
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(ox[(li - 1 + n) % n], oy[(li - 1 + n) % n])
  ctx.lineTo(ox[li], oy[li])
  ctx.lineTo(ox[(li + 1) % n], oy[(li + 1) % n])
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
