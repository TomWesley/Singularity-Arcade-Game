// The four surfers.
//
// Geometry and colour are the 2019 originals, reproduced exactly -- the shapes
// people liked are the shapes, and this file's job is not to redesign them. Only
// the rendering changes: flat p5 fills become gradients, and every silhouette
// picks up the thin bright rim and selective bloom the engine's house style
// calls for.
//
// The originals were drawn with p5's curve(), a Catmull-Rom spline through two
// interior points with two outer control points. Canvas has no such primitive,
// so catmull() below converts each one to the equivalent cubic Bezier. The
// curves are therefore identical, not approximations by eye.
//
// Original units: len = 4, wid = len * 6 = 24.

const LEN = 4
const WID = LEN * 6

// Original palette, unchanged.
const SUPERBUG_ORANGE = [255, 120, 0]
const SUPERBUG_YELLOW = [255, 240, 0]
const PSYCH_PINK = [255, 174, 204]
const COMPILER_GREEN = [80, 230, 130]
const VOIDWALKER_PURPLE = [100, 14, 237]
const WHITE = [255, 255, 255]

const rgba = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`

/** Each hull's signature colours, for effects that should match the ship. */
export const CRAFT_COLORS = {
  superbug: [SUPERBUG_YELLOW, SUPERBUG_ORANGE],
  'psych-bike': [PSYCH_PINK, [255, 255, 255]],
  compiler: [COMPILER_GREEN, [200, 255, 220]],
  voidwalker: [VOIDWALKER_PURPLE, WHITE]
}

/** Lighten toward white, for the hot side of a gradient. */
function lift (c, t) {
  return [
    Math.round(c[0] + (255 - c[0]) * t),
    Math.round(c[1] + (255 - c[1]) * t),
    Math.round(c[2] + (255 - c[2]) * t)
  ]
}

/**
 * p5's curve() as a cubic Bezier. For a Catmull-Rom segment P1->P2 with
 * neighbours P0 and P3, the equivalent control points are
 * P1 + (P2-P0)/6 and P2 - (P3-P1)/6.
 */
function catmull (ctx, x0, y0, x1, y1, x2, y2, x3, y3) {
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(
    x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6,
    x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6,
    x2, y2
  )
}

/** Fill a path with a vertical gradient, then rim it with a glowing hairline. */
function body (ctx, color, y0, y1, path, { rim = 0.95, blur = 12, width = 1.2 } = {}) {
  ctx.beginPath()
  path()
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  g.addColorStop(0, rgba(lift(color, 0.45), 0.95))
  g.addColorStop(0.55, rgba(color, 0.85))
  g.addColorStop(1, rgba(color, 0.35))
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = rgba(lift(color, 0.5), rim)
  ctx.lineWidth = width
  ctx.shadowColor = rgba(color, 0.9)
  ctx.shadowBlur = blur
  ctx.stroke()
  ctx.shadowBlur = 0
}

/** Stroke-only shape with glow, for the craft built from open curves. */
function line (ctx, color, path, { width = 3, blur = 14, alpha = 0.95 } = {}) {
  ctx.beginPath()
  path()
  ctx.strokeStyle = rgba(lift(color, 0.25), alpha)
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.shadowColor = rgba(color, 0.95)
  ctx.shadowBlur = blur
  ctx.stroke()
  ctx.shadowBlur = 0
}

/**
 * @param heading radians; the direction the craft is actually travelling
 * @param thrustMag 0..1 how hard the engine is firing, drives the exhaust
 * @param scale 1 is the in-flight size; the select cards draw much larger
 */
export function drawCraft (ctx, craftId, x, y, heading, thrustMag, time, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(heading + Math.PI / 2)   // the originals were drawn nose-up
  ctx.scale(scale, scale)

  switch (craftId) {
    case 'psych-bike': drawPsychBike(ctx, thrustMag, time); break
    case 'compiler': drawCompiler(ctx, thrustMag, time); break
    case 'voidwalker': drawVoidwalker(ctx, thrustMag, time); break
    default: drawSuperbug(ctx, thrustMag, time)
  }

  ctx.restore()
}

// Exhaust in the craft's own accent colour, so each engine reads as its ship's.
function exhaust (ctx, color, mag, time, fromY) {
  if (mag < 0.05) return
  const len = (9 + mag * 24) * (0.86 + Math.sin(time * 30) * 0.14)
  const g = ctx.createLinearGradient(0, fromY, 0, fromY + len)
  // Bright at the nozzle regardless of throttle, so it reads as flame rather
  // than as a flat translucent wedge welded to the hull. Only a light lift
  // toward white -- pink lifted hard desaturates to grey, while yellow survives
  // it, which is why the Psych Bike's plume read as a dirty wedge at first.
  g.addColorStop(0, rgba(lift(color, 0.3), 0.30 + 0.55 * mag))
  g.addColorStop(0.35, rgba(color, 0.28 * mag + 0.06))
  g.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(-WID * 0.16, fromY)
  ctx.lineTo(WID * 0.16, fromY)
  ctx.lineTo(0, fromY + len)
  ctx.closePath()
  ctx.fill()
}

// Superbug — two yellow lobes, an orange fuselage over them, a yellow tail fin.
function drawSuperbug (ctx, thrustMag, time) {
  exhaust(ctx, SUPERBUG_YELLOW, thrustMag, time, WID)

  body(ctx, SUPERBUG_YELLOW, -WID * 0.65, WID * 0.8, () => {
    ctx.ellipse(0, -WID * 0.25, WID * 0.4, WID * 0.4, 0, 0, Math.PI * 2)
  }, { blur: 10 })

  body(ctx, SUPERBUG_YELLOW, -WID * 0.1, WID * 0.8, () => {
    ctx.ellipse(0, WID * 0.35, WID * 0.45, WID * 0.45, 0, 0, Math.PI * 2)
  }, { blur: 10 })

  body(ctx, SUPERBUG_ORANGE, -WID * 0.5, WID * 0.5, () => {
    ctx.ellipse(0, 0, WID * 0.4, WID * 0.5, 0, 0, Math.PI * 2)
  }, { blur: 14 })

  body(ctx, SUPERBUG_YELLOW, WID * 0.7, WID, () => {
    ctx.moveTo(WID * 0.225, WID * 0.7)
    ctx.lineTo(-WID * 0.225, WID * 0.7)
    ctx.lineTo(0, WID)
    ctx.closePath()
  }, { blur: 10 })
}

// Psych Bike — twin curves pinching toward a bright core, with a cross-spar.
function drawPsychBike (ctx, thrustMag, time) {
  exhaust(ctx, PSYCH_PINK, thrustMag, time, WID * 0.75)

  line(ctx, PSYCH_PINK, () => {
    catmull(ctx,
      -WID * 4, -WID, -WID, -WID * 0.6,
      -WID, WID * 0.6, -WID * 4, WID)
    catmull(ctx,
      WID * 4, -WID, WID, -WID * 0.6,
      WID, WID * 0.6, WID * 4, WID)
  })

  line(ctx, PSYCH_PINK, () => {
    ctx.moveTo(WID * 0.6, 0)
    ctx.lineTo(-WID * 0.6, 0)
  }, { width: 2, blur: 8, alpha: 0.75 })

  body(ctx, PSYCH_PINK, -WID * 0.29, WID * 0.29, () => {
    ctx.ellipse(0, 0, WID * 0.29, WID * 0.29, 0, 0, Math.PI * 2)
  }, { blur: 16 })
}

// The Compiler — swept parenthesis wings bowing outward, under a green dome.
function drawCompiler (ctx, thrustMag, time) {
  exhaust(ctx, COMPILER_GREEN, thrustMag, time, WID * 0.55)

  line(ctx, COMPILER_GREEN, () => {
    catmull(ctx,
      WID * 4, 0, -WID * 1.5, -WID * 0.8,
      -WID * 1.5, WID * 0.8, WID * 4, 0)
    catmull(ctx,
      -WID * 4, 0, WID * 1.5, -WID * 0.8,
      WID * 1.5, WID * 0.8, -WID * 4, 0)
  })

  body(ctx, COMPILER_GREEN, -WID * 0.55, WID * 0.15, () => {
    ctx.ellipse(0, -WID * 0.2, WID * 0.35, WID * 0.35, 0, 0, Math.PI * 2)
  }, { blur: 16 })
}

// Voidwalker — the blocky purple column, its inboard wings, the long outboard
// bars, and the two white sensor blocks. Cell for cell as the original.
function drawVoidwalker (ctx, thrustMag, time) {
  exhaust(ctx, VOIDWALKER_PURPLE, thrustMag, time, LEN * 6.5)

  const column = (cx, from, to) => () => {
    for (let i = from; i <= to; i++) ctx.rect(cx, i * LEN - LEN / 2, LEN, LEN)
  }

  body(ctx, VOIDWALKER_PURPLE, -LEN * 6, LEN * 7, column(-LEN / 2, -5, 6), { blur: 12 })
  body(ctx, VOIDWALKER_PURPLE, -LEN * 5, LEN * 6, column(-LEN * 1.5, -4, 5), { blur: 8, rim: 0.7 })
  body(ctx, VOIDWALKER_PURPLE, -LEN * 5, LEN * 6, column(LEN * 0.5, -4, 5), { blur: 8, rim: 0.7 })
  body(ctx, VOIDWALKER_PURPLE, -LEN * 8, LEN * 8, column(-LEN * 7.5, -7, 7), { blur: 8, rim: 0.55 })
  body(ctx, VOIDWALKER_PURPLE, -LEN * 8, LEN * 8, column(LEN * 6.5, -7, 7), { blur: 8, rim: 0.55 })

  ctx.fillStyle = rgba(WHITE, 0.96)
  ctx.shadowColor = rgba(WHITE, 0.85)
  ctx.shadowBlur = 10
  ctx.fillRect(-LEN / 2, -LEN * 1.5, LEN, LEN)
  ctx.fillRect(-LEN / 2, LEN * 2.5, LEN, LEN)
  ctx.shadowBlur = 0
}
