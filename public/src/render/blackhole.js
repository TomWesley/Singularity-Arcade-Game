// Black hole rendering.
//
// A black hole is the one object on this board that emits nothing, so it is
// drawn as an absence: a disc of pure black, with a white aura hugging the rim
// that exists only to say where the edge is. No accretion disk, no coloured
// rings, no instrument furniture. Against a black field the aura is the whole
// image, and that is the point -- the reference is the Jupiter sequence in 2001,
// where the drama is a bright edge on a dark shape and nothing else.
//
// The radii are still the real ones the physics computed: the horizon at r_s,
// the photon sphere at 1.5 r_s where the aura peaks, and the ISCO at 3 r_s as a
// hairline you can only just see. Nothing is invented for looks.
//
// Performance: all of that is static for a given mass, so it renders once into
// an offscreen canvas and is blitted each frame.

import { palette, rgbaToCss, withAlpha } from './theme.js'
import { escapeLimit } from '../game/physics.js'

const TAU = Math.PI * 2

// Sprites are cached by horizon radius and rendered at 2x so they stay crisp
// when the board is letterboxed up on a large or high-DPI display.
const SS = 2
const spriteCache = new Map()

function staticSprite (hole) {
  const key = hole.horizon.toFixed(2)
  const hit = spriteCache.get(key)
  if (hit) return hit

  const reach = hole.isco + 6
  const size = Math.ceil(reach * 2 * SS)
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const c = cv.getContext('2d')
  c.scale(SS, SS)
  c.translate(reach, reach)

  // ISCO: the faintest possible hairline. It marks where stable orbits end, and
  // a pilot who notices it has earned the information.
  c.strokeStyle = 'rgba(255, 255, 255, 0.10)'
  c.lineWidth = 1
  c.beginPath()
  c.arc(0, 0, hole.isco, 0, TAU)
  c.stroke()

  // The aura. Brightest just outside the horizon, peaking at the photon sphere,
  // gone by roughly twice the horizon radius.
  const outer = Math.max(hole.photonSphere * 1.9, hole.horizon + 26)
  const g = c.createRadialGradient(0, 0, hole.horizon * 0.94, 0, 0, outer)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
  g.addColorStop(0.16, 'rgba(255, 255, 255, 0.30)')
  g.addColorStop(0.45, 'rgba(255, 255, 255, 0.09)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  c.fillStyle = g
  c.beginPath()
  c.arc(0, 0, outer, 0, TAU)
  c.fill()

  // The horizon itself: absolute black, punched back out of the aura, with one
  // clean white hairline defining the edge.
  c.globalCompositeOperation = 'destination-out'
  c.beginPath()
  c.arc(0, 0, hole.horizon, 0, TAU)
  c.fill()
  c.globalCompositeOperation = 'source-over'

  c.strokeStyle = 'rgba(255, 255, 255, 0.92)'
  c.lineWidth = 1.3
  c.shadowColor = 'rgba(255, 255, 255, 0.8)'
  c.shadowBlur = 10
  c.beginPath()
  c.arc(0, 0, hole.horizon, 0, TAU)
  c.stroke()

  const sprite = { canvas: cv, reach }
  spriteCache.set(key, sprite)
  return sprite
}

export function drawBlackHole (ctx, hole, craft, craftPos, time) {
  const sprite = staticSprite(hole)

  // The horizon has to be genuinely black, not the aura's black over whatever
  // is behind it, so the disc is filled before the sprite lands on top.
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(hole.x, hole.y, hole.horizon, 0, TAU)
  ctx.fill()

  ctx.drawImage(
    sprite.canvas,
    hole.x - sprite.reach, hole.y - sprite.reach,
    sprite.reach * 2, sprite.reach * 2
  )

  // The one live piece of instrumentation: where this hull's thrust stops being
  // able to answer the pull. It appears only once you are near it.
  if (craft && craftPos) {
    const r = escapeLimit(hole, craft)
    const d = Math.hypot(craftPos.x - hole.x, craftPos.y - hole.y)
    if (Number.isFinite(d) && d < r * 1.35) {
      ctx.save()
      ctx.strokeStyle = rgbaToCss(withAlpha(palette.danger.core,
        0.30 + Math.sin(time * 4) * 0.14))
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(hole.x, hole.y, r, 0, TAU)
      ctx.stroke()
      ctx.restore()
    }
  }
}
