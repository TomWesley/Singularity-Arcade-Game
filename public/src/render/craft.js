// The four surfers.
//
// These are the 2019 silhouettes, kept faithful in proportion and colour, but
// rebuilt as closed bodies rather than traced outlines.
//
// The originals were drawn as overlapping filled primitives, so even where parts
// did not literally touch -- the Compiler's wings float 28px off its dome, the
// Voidwalker's outboard bars sit 20px clear of its hull -- the eye read one
// solid mass. Converting those to open strokes broke that: the arcs became
// detached lines with holes between them. So every craft here is built from
// closed paths that overlap or are joined by real structure, and the gaps the
// originals got away with are now spanned by pylons and spars.
//
// Curves come from p5's curve(), a Catmull-Rom spline with no canvas
// equivalent. Each is converted to its exact cubic Bezier (control points
// P1 + (P2-P0)/6 and P2 - (P3-P1)/6) and then given thickness by pairing it
// with a second, deeper curve so the result is a closed crescent instead of a
// hairline -- the sleek version of the same shape.
//
// Base units are the originals': len = 4, wid = len * 6 = 24.

const LEN = 4
const WID = LEN * 6

// Every hull is two-tone: one colour carries the mass, the other picks out the
// structure. That contrast is most of what made the originals readable at 24px.
//
// Superbug and Voidwalker were already two-tone in 2019. The Psych Bike was
// pink alone and the Compiler declared a second colour it never drew
// (`colorOne = color(0, 255)`), so those two get a partner here. The Psych
// Bike's blue is not invented -- it is (135, 175, 255), the colour the 2019
// build used for its asteroids, so it comes from the game's own palette.
const SUPERBUG_YELLOW = [255, 240, 0]
const SUPERBUG_ORANGE = [255, 120, 0]
const PSYCH_PINK = [255, 174, 204]
const PSYCH_BLUE = [135, 175, 255]
const COMPILER_GREEN = [80, 230, 130]
const COMPILER_SLATE = [34, 78, 68]
const VOIDWALKER_PURPLE = [100, 14, 237]
const VOIDWALKER_SILVER = [226, 232, 255]
const WHITE = [255, 255, 255]

const rgba = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`

function lift (c, t) {
  return [
    Math.round(c[0] + (255 - c[0]) * t),
    Math.round(c[1] + (255 - c[1]) * t),
    Math.round(c[2] + (255 - c[2]) * t)
  ]
}

/** [mass tone, accent tone] per hull -- drives the wreck debris and the wake. */
export const CRAFT_COLORS = {
  superbug: [SUPERBUG_YELLOW, SUPERBUG_ORANGE],
  'psych-bike': [PSYCH_PINK, PSYCH_BLUE],
  compiler: [COMPILER_GREEN, [170, 255, 205]],
  voidwalker: [VOIDWALKER_PURPLE, VOIDWALKER_SILVER]
}

/**
 * Fill the current path with a vertical gradient and rim it with a glowing
 * hairline. Every visible part of every craft goes through this, which is what
 * keeps them looking like one family.
 */
function shell (ctx, color, y0, y1, { rim = 0.92, blur = 9, width = 1.1, deep = 0.30 } = {}) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  g.addColorStop(0, rgba(lift(color, 0.5), 0.97))
  g.addColorStop(0.5, rgba(color, 0.9))
  g.addColorStop(1, rgba(color, deep))
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = rgba(lift(color, 0.55), rim)
  ctx.lineWidth = width
  ctx.shadowColor = rgba(color, 0.85)
  ctx.shadowBlur = blur
  ctx.stroke()
  ctx.shadowBlur = 0
}

/**
 * A closed crescent: the spline the original stroked, paired with a deeper
 * return curve so the shape has body. `bow` is the original's control offset,
 * `swell` how much further the outer edge bulges.
 */
function crescent (ctx, tipX, tipTopY, tipBotY, bow, ctrlY, swell) {
  ctx.beginPath()
  ctx.moveTo(tipX, tipTopY)
  ctx.bezierCurveTo(bow, -ctrlY, bow, ctrlY, tipX, tipBotY)
  ctx.bezierCurveTo(bow + swell, ctrlY, bow + swell, -ctrlY, tipX, tipTopY)
  ctx.closePath()
}

/**
 * @param heading radians; the direction the craft is actually travelling
 * @param thrustMag 0..1 how hard the engine is firing
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

function exhaust (ctx, color, mag, time, fromY, halfWidth) {
  if (mag < 0.05) return
  const len = (9 + mag * 22) * (0.86 + Math.sin(time * 30) * 0.14)
  const g = ctx.createLinearGradient(0, fromY, 0, fromY + len)
  g.addColorStop(0, rgba(lift(color, 0.3), 0.30 + 0.55 * mag))
  g.addColorStop(0.35, rgba(color, 0.28 * mag + 0.06))
  g.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(-halfWidth, fromY)
  ctx.lineTo(halfWidth, fromY)
  ctx.lineTo(0, fromY + len)
  ctx.closePath()
  ctx.fill()
}

// ── Superbug ────────────────────────────────────────────────────────────────
// Two stacked yellow lobes under an orange fuselage, finished with a tail fin.
// Drawn as one teardrop hull so the lobes read as swellings of the body rather
// than circles sitting on it: round head, widest at the lower lobe, tapering to
// the fin. The orange fuselage is an inset panel, exactly as the original's
// orange ellipse covered the middle of the yellow ones.
function drawSuperbug (ctx, thrustMag, time) {
  exhaust(ctx, SUPERBUG_YELLOW, thrustMag, time, WID * 0.98, WID * 0.16)

  ctx.beginPath()
  ctx.moveTo(0, -15.6)
  ctx.bezierCurveTo(5.3, -15.6, 9.6, -11.3, 9.6, -6.0)     // head, r 9.6
  ctx.bezierCurveTo(10.4, -1.0, 10.9, 3.4, 10.8, 8.4)      // swell to the thorax
  ctx.bezierCurveTo(10.6, 13.2, 8.6, 15.9, 6.0, 17.6)      // lower lobe, r 10.8
  ctx.lineTo(0, 24)                                         // tail fin
  ctx.lineTo(-6.0, 17.6)
  ctx.bezierCurveTo(-8.6, 15.9, -10.6, 13.2, -10.8, 8.4)
  ctx.bezierCurveTo(-10.9, 3.4, -10.4, -1.0, -9.6, -6.0)
  ctx.bezierCurveTo(-9.6, -11.3, -5.3, -15.6, 0, -15.6)
  ctx.closePath()
  shell(ctx, SUPERBUG_YELLOW, -15.6, 24, { blur: 11 })

  // Orange fuselage panel.
  ctx.beginPath()
  ctx.ellipse(0, 0.6, 6.7, 10.6, 0, 0, Math.PI * 2)
  ctx.closePath()
  shell(ctx, SUPERBUG_ORANGE, -10, 11.2, { blur: 8, width: 0.9, deep: 0.42 })

  // Canopy: the upper lobe, now a highlight on the hull.
  ctx.beginPath()
  ctx.ellipse(0, -7.4, 3.8, 4.4, 0, 0, Math.PI * 2)
  ctx.fillStyle = rgba(lift(SUPERBUG_YELLOW, 0.55), 0.92)
  ctx.shadowColor = rgba(SUPERBUG_YELLOW, 0.9)
  ctx.shadowBlur = 7
  ctx.fill()
  ctx.shadowBlur = 0
}

// ── Psych Bike ──────────────────────────────────────────────────────────────
// Twin outboard curves pinching toward a bright core, joined by a cross-spar.
// The original stroked the curves open at weight 3; here each is a closed
// crescent, and the spar is a solid tapered bar that runs under the core and
// meets both frames, so the three parts are one structure.
function drawPsychBike (ctx, thrustMag, time) {
  exhaust(ctx, PSYCH_PINK, thrustMag, time, WID * 0.62, WID * 0.13)

  // Cross-spar first, so the frames and core sit over its ends.
  ctx.beginPath()
  ctx.moveTo(-15.4, -1.0)
  ctx.bezierCurveTo(-6, -3.2, 6, -3.2, 15.4, -1.0)
  ctx.lineTo(15.4, 1.0)
  ctx.bezierCurveTo(6, 3.2, -6, 3.2, -15.4, 1.0)
  ctx.closePath()
  shell(ctx, PSYCH_BLUE, -3.2, 3.2, { blur: 7, width: 0.8, deep: 0.5 })

  // Frames: endpoints at x = +-24, bowing in to +-12 at the waist, exactly the
  // original spline; the outer edge swells away from centre to give it body.
  for (const dir of [-1, 1]) {
    crescent(ctx, dir * 24, -14.4, 14.4, dir * 12, 8.0, dir * 3.6)
    shell(ctx, PSYCH_PINK, -14.4, 14.4, { blur: 10, width: 1 })
  }

  // Core.
  ctx.beginPath()
  ctx.arc(0, 0, 6.4, 0, Math.PI * 2)
  const core = ctx.createRadialGradient(-1.6, -1.6, 0.5, 0, 0, 6.4)
  core.addColorStop(0, rgba([255, 255, 255], 0.98))
  core.addColorStop(0.5, rgba(lift(PSYCH_BLUE, 0.3), 0.96))
  core.addColorStop(1, rgba(PSYCH_BLUE, 0.72))
  ctx.fillStyle = core
  ctx.fill()
  ctx.strokeStyle = rgba(lift(PSYCH_BLUE, 0.45), 0.98)
  ctx.lineWidth = 1
  ctx.shadowColor = rgba(PSYCH_BLUE, 0.95)
  ctx.shadowBlur = 13
  ctx.stroke()
  ctx.shadowBlur = 0
}

// ── The Compiler ────────────────────────────────────────────────────────────
// Swept parenthesis wings under a green dome. In the original the wings were
// unattached -- their roots sit at x = +-36 while the dome is only 8.4 across --
// so the gap is bridged here with a fuselage and two pylons. Without them this
// craft is a dome with two arcs floating beside it, which is exactly what it
// looked like.
function drawCompiler (ctx, thrustMag, time) {
  exhaust(ctx, COMPILER_GREEN, thrustMag, time, 14.5, WID * 0.15)

  // Pylons out to each wing root.
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(dir * 4.5, -6.5)
    ctx.bezierCurveTo(dir * 18, -6.2, dir * 28, -4.6, dir * 37, -3.0)
    ctx.lineTo(dir * 37, 3.0)
    ctx.bezierCurveTo(dir * 28, 4.6, dir * 18, 6.2, dir * 4.5, 6.5)
    ctx.closePath()
    shell(ctx, COMPILER_GREEN, -6.5, 6.5, { blur: 6, width: 0.8, deep: 0.42 })
  }

  // Wings: the original spline, endpoints at x = +-36 bowing out to +-58.
  for (const dir of [-1, 1]) {
    crescent(ctx, dir * 36, -19.2, 19.2, dir * 54, 16, dir * 9)
    shell(ctx, COMPILER_GREEN, -19.2, 19.2, { blur: 10, width: 1 })
  }

  // Fuselage, running the length of the craft so the dome has something to sit
  // on and the pylons have something to leave from.
  ctx.beginPath()
  ctx.moveTo(0, -16.4)
  ctx.bezierCurveTo(3.6, -14.8, 5.2, -9.6, 5.4, -2.0)
  ctx.bezierCurveTo(5.5, 5.4, 3.8, 11.8, 0, 16.6)
  ctx.bezierCurveTo(-3.8, 11.8, -5.5, 5.4, -5.4, -2.0)
  ctx.bezierCurveTo(-5.2, -9.6, -3.6, -14.8, 0, -16.4)
  ctx.closePath()
  // The dark half of the pair -- filled slate, rimmed in the bright green so
  // the silhouette still reads against a black field.
  const hull = ctx.createLinearGradient(0, -16.4, 0, 16.6)
  hull.addColorStop(0, rgba([70, 128, 110], 0.98))
  hull.addColorStop(0.55, rgba(COMPILER_SLATE, 0.98))
  hull.addColorStop(1, rgba([18, 44, 38], 0.98))
  ctx.fillStyle = hull
  ctx.fill()
  ctx.strokeStyle = rgba(lift(COMPILER_GREEN, 0.35), 0.95)
  ctx.lineWidth = 1.1
  ctx.shadowColor = rgba(COMPILER_GREEN, 0.8)
  ctx.shadowBlur = 9
  ctx.stroke()
  ctx.shadowBlur = 0

  // Dome.
  ctx.beginPath()
  ctx.arc(0, -4.8, 5.2, 0, Math.PI * 2)
  const dome = ctx.createRadialGradient(-1.4, -6.4, 0.4, 0, -4.8, 5.2)
  dome.addColorStop(0, rgba([230, 255, 240], 0.99))
  dome.addColorStop(0.6, rgba(lift(COMPILER_GREEN, 0.2), 0.95))
  dome.addColorStop(1, rgba(COMPILER_GREEN, 0.6))
  ctx.fillStyle = dome
  ctx.fill()
  ctx.strokeStyle = rgba(lift(COMPILER_GREEN, 0.45), 0.95)
  ctx.lineWidth = 1
  ctx.shadowColor = rgba(COMPILER_GREEN, 0.95)
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.shadowBlur = 0
}

// ── Voidwalker ──────────────────────────────────────────────────────────────
// A 12-wide hull 48 tall, with two long outboard bars. The originals floated
// 20px clear of the hull; here they are carried on spars. Everything is
// rectilinear on purpose -- it is the most damped craft and should look like a
// structure rather than a shape.
function drawVoidwalker (ctx, thrustMag, time) {
  exhaust(ctx, VOIDWALKER_PURPLE, thrustMag, time, 26, LEN * 1.6)

  // Spars out to the outboard bars.
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(dir * 6, -2.6)
    ctx.lineTo(dir * 27, -1.7)
    ctx.lineTo(dir * 27, 1.7)
    ctx.lineTo(dir * 6, 2.6)
    ctx.closePath()
    shell(ctx, VOIDWALKER_PURPLE, -2.6, 2.6, { blur: 5, width: 0.7, deep: 0.5 })
  }

  // Outboard bars, 60 tall as in the original, with the corners eased off.
  for (const dir of [-1, 1]) {
    const x0 = dir > 0 ? 26 : -30.5
    ctx.beginPath()
    ctx.moveTo(x0 + 1.4, -30)
    ctx.lineTo(x0 + 3.1, -30)
    ctx.quadraticCurveTo(x0 + 4.5, -29, x0 + 4.5, -26)
    ctx.lineTo(x0 + 4.5, 26)
    ctx.quadraticCurveTo(x0 + 4.5, 29, x0 + 3.1, 30)
    ctx.lineTo(x0 + 1.4, 30)
    ctx.quadraticCurveTo(x0, 29, x0, 26)
    ctx.lineTo(x0, -26)
    ctx.quadraticCurveTo(x0, -29, x0 + 1.4, -30)
    ctx.closePath()
    shell(ctx, VOIDWALKER_PURPLE, -30, 30, { blur: 7, width: 0.9 })
  }

  // Hull: the 12-wide column, tapered to a nose and a tail.
  ctx.beginPath()
  ctx.moveTo(0, -23.5)
  ctx.bezierCurveTo(4.2, -22.4, 6, -19.2, 6, -14)
  ctx.lineTo(6, 17)
  ctx.bezierCurveTo(6, 22, 4.2, 25, 2.4, 26.5)
  ctx.lineTo(-2.4, 26.5)
  ctx.bezierCurveTo(-4.2, 25, -6, 22, -6, 17)
  ctx.lineTo(-6, -14)
  ctx.bezierCurveTo(-6, -19.2, -4.2, -22.4, 0, -23.5)
  ctx.closePath()
  shell(ctx, VOIDWALKER_PURPLE, -23.5, 26.5, { blur: 10, width: 1.1 })

  // Inner spine, standing in for the original's narrower centre column.
  ctx.beginPath()
  ctx.moveTo(0, -19)
  ctx.bezierCurveTo(2, -18.2, 2.6, -16, 2.6, -12)
  ctx.lineTo(2.6, 18)
  ctx.lineTo(-2.6, 18)
  ctx.lineTo(-2.6, -12)
  ctx.bezierCurveTo(-2.6, -16, -2, -18.2, 0, -19)
  ctx.closePath()
  shell(ctx, VOIDWALKER_SILVER, -19, 18, { blur: 7, width: 0.7, deep: 0.55 })

  // The two white sensor blocks.
  ctx.fillStyle = rgba(WHITE, 0.97)
  ctx.shadowColor = rgba(WHITE, 0.85)
  ctx.shadowBlur = 9
  ctx.fillRect(-1.9, -7.4, 3.8, 3.8)
  ctx.fillRect(-1.9, 8.6, 3.8, 3.8)
  ctx.shadowBlur = 0
}

// ── Engine wake ─────────────────────────────────────────────────────────────
//
// A tapered ribbon along the craft's recorded path, in its two tones: the mass
// colour on the outside, the accent burning through the middle. Because the
// positions are sampled on a fixed interval, the ribbon is automatically longer
// the faster the craft is travelling, and it curves through a slingshot exactly
// as the flight path does.
//
// Deliberately not huge. The wake is there to make speed legible and to leave a
// trace of the line you flew; the moment it is wide enough to obscure a black
// hole it has stopped helping.

const WAKE_MAX = 118         // px, the longest the ribbon is allowed to run
// Half-width at the nozzle, in design pixels rather than craft units. Scaling
// this by artScale (0.36-0.69) made every wake a hairline -- the ribbon wants a
// size of its own, only loosely tied to how big the hull is.
const WAKE_FLARE = 5.4

export function drawCraftWake (ctx, wake, headX, headY, craftId, speed, maxSpeed, scale = 1) {
  if (!wake || wake.length < 2) return

  const [mass, accent] = CRAFT_COLORS[craftId] ?? CRAFT_COLORS.superbug
  const heat = Math.min(1, speed / Math.max(1, maxSpeed))

  const left = []
  const right = []
  let travelled = 0
  let prevX = headX
  let prevY = headY
  let count = 0

  for (let i = 0; i < wake.length; i++) {
    const p = wake[i]
    const seg = Math.hypot(p.x - prevX, p.y - prevY)
    if (seg > 220) break                    // respawn teleport; never span it
    travelled += seg
    if (travelled > WAKE_MAX) break

    const nx = i + 1 < wake.length ? wake[i + 1].x : p.x
    const ny = i + 1 < wake.length ? wake[i + 1].y : p.y
    let tx = nx - prevX
    let ty = ny - prevY
    const tl = Math.hypot(tx, ty)
    if (tl < 1e-5) { prevX = p.x; prevY = p.y; continue }
    tx /= tl; ty /= tl

    // Quadratic taper: broad at the nozzle, needle-thin at the tip.
    const k = 1 - travelled / WAKE_MAX
    const w = WAKE_FLARE * (0.62 + 0.38 * scale) * k * k * (0.45 + heat * 0.85)
    left.push([p.x - ty * w, p.y + tx * w])
    right.push([p.x + ty * w, p.y - tx * w])

    prevX = p.x
    prevY = p.y
    count++
  }
  if (count < 2) return

  const tip = wake[Math.min(count, wake.length - 1)]
  const alpha = 0.26 + heat * 0.54

  // Outer ribbon in the hull's mass colour.
  const g = ctx.createLinearGradient(headX, headY, tip.x, tip.y)
  g.addColorStop(0, rgba(lift(mass, 0.25), alpha))
  g.addColorStop(0.3, rgba(mass, alpha * 0.62))
  g.addColorStop(0.7, rgba(mass, alpha * 0.22))
  g.addColorStop(1, rgba(mass, 0))
  ctx.beginPath()
  ctx.moveTo(headX, headY)
  for (const [x, y] of left) ctx.lineTo(x, y)
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1])
  ctx.closePath()
  ctx.fillStyle = g
  ctx.fill()

  // Accent core burning down the middle of it.
  const cg = ctx.createLinearGradient(headX, headY, tip.x, tip.y)
  cg.addColorStop(0, rgba(lift(accent, 0.6), 0.5 + heat * 0.48))
  cg.addColorStop(0.35, rgba(accent, 0.3 + heat * 0.45))
  cg.addColorStop(1, rgba(accent, 0))
  ctx.strokeStyle = cg
  ctx.lineWidth = Math.max(1.2, WAKE_FLARE * 0.5 * (0.6 + heat * 0.7))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = rgba(accent, 0.5 + heat * 0.4)
  ctx.shadowBlur = 9 + heat * 14
  ctx.beginPath()
  ctx.moveTo(headX, headY)
  for (let i = 0; i < count; i++) ctx.lineTo(wake[i].x, wake[i].y)
  ctx.stroke()
  ctx.shadowBlur = 0
}
