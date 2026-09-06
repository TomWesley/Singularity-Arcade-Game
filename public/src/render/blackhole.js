// Black hole rendering.
//
// The reference is the Jupiter alignment in 2001: near-total blackness, a few
// monumental shapes, hard edges, no fuss. A black hole should be the simplest
// object on screen and the most arresting -- one absolute void, one bright ring,
// one disk seen edge-on. Detail is what a lesser image uses instead of
// composition.
//
// Every radius drawn is a real one the physics computed: the horizon at r_s,
// the photon sphere at 1.5 r_s where light itself orbits, and the innermost
// stable circular orbit at 3 r_s. Nothing here is invented for looks.
//
// Performance: the horizon, photon ring and ISCO circle never change for a given
// mass, so they are rendered once into an offscreen canvas and blitted. Only the
// accretion disk -- a single stroked ellipse -- is drawn live each frame. An
// earlier version drew the disk as 9 bands x 46 shadowed arc segments per hole,
// which cost 1,656 blurred strokes a frame and ran at 5fps.

import { palette, rgbaToCss, withAlpha } from './theme.js'
import { escapeLimit } from '../game/physics.js'

const TAU = Math.PI * 2

// Cached sprites keyed by horizon radius. Rendered at 2x so they stay crisp
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

  // ISCO — a single unbroken hairline. No ticks, no dashes, no label: it marks
  // where stable orbits end, and that is enough for it to say.
  c.strokeStyle = rgbaToCss(withAlpha(palette.primary.core, 0.20))
  c.lineWidth = 1
  c.beginPath()
  c.arc(0, 0, hole.isco, 0, TAU)
  c.stroke()

  // Photon sphere — the hero line, and the only glow on the object.
  c.strokeStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.95))
  c.lineWidth = 1.6
  c.shadowColor = rgbaToCss(palette.secondary.glow)
  c.shadowBlur = 16
  c.beginPath()
  c.arc(0, 0, hole.photonSphere, 0, TAU)
  c.stroke()
  c.shadowBlur = 0

  // The horizon: an absolute void with a hard edge. Not a gradient, not a
  // smudge -- an absence with a rim.
  c.fillStyle = '#000000'
  c.beginPath()
  c.arc(0, 0, hole.horizon, 0, TAU)
  c.fill()
  c.strokeStyle = rgbaToCss(withAlpha(palette.primary.core, 0.55))
  c.lineWidth = 1
  c.beginPath()
  c.arc(0, 0, hole.horizon, 0, TAU)
  c.stroke()

  const sprite = { canvas: cv, reach }
  spriteCache.set(key, sprite)
  return sprite
}

const DISK_MIN_HORIZON = 30

function drawDisk (ctx, hole) {
  const rx = hole.horizon * 2.1
  const ry = rx * 0.26

  ctx.save()
  ctx.translate(hole.x, hole.y)
  ctx.rotate(hole.spin * 0.06)

  const g = ctx.createLinearGradient(-rx, 0, rx, 0)
  g.addColorStop(0, rgbaToCss(withAlpha(palette.primary.core, 0.10)))
  g.addColorStop(0.5, rgbaToCss(withAlpha(palette.secondary.core, 0.30)))
  g.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0.85)))
  ctx.strokeStyle = g
  ctx.lineWidth = Math.max(2, hole.horizon * 0.07)
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU)
  ctx.stroke()
  ctx.restore()
}

export function drawBlackHole (ctx, hole, craft, craftPos, time) {
  const sprite = staticSprite(hole)

  // Accretion disk: one ellipse, seen near edge-on, rotating. The gradient runs
  // across it so one limb is bright and the other falls away -- relativistic
  // beaming, the approaching side genuinely is brighter.
  //
  // Only the massive holes carry one. On a small hole the ellipse is a few
  // pixels across and reads as a smudge hanging off the ring rather than a
  // disk, and a stark unadorned point is the better image anyway -- the small
  // ones should look like punctures, not planets.
  if (hole.horizon >= DISK_MIN_HORIZON) drawDisk(ctx, hole)

  // Static geometry, one blit.
  ctx.drawImage(
    sprite.canvas,
    hole.x - sprite.reach, hole.y - sprite.reach,
    sprite.reach * 2, sprite.reach * 2
  )

  // The one piece of live instrumentation kept: where this hull's thrust stops
  // being able to answer the pull. It only appears once you are inside it.
  if (craft && craftPos) {
    const r = escapeLimit(hole, craft)
    const d = Math.hypot(craftPos.x - hole.x, craftPos.y - hole.y)
    if (Number.isFinite(d) && d < r * 1.35) {
      ctx.save()
      ctx.strokeStyle = rgbaToCss(withAlpha(palette.danger.core,
        0.28 + Math.sin(time * 4) * 0.14))
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(hole.x, hole.y, r, 0, TAU)
      ctx.stroke()
      ctx.restore()
    }
  }
}
