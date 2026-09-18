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
//
// Rebuilt from the pre-refactor sprite in sketch.js, which is a good deal richer
// than the 2025 version I had been working from: two yellow lobes and an orange
// fuselage, but also a pair of orange quads swept up and outward with yellow
// struts running over them. Those struts are the antennae -- they reach from the
// shoulder at (+-9.6, -9.6) out to (+-19.2, -19.2), and they are most of why the
// craft reads as an insect rather than a pod.
//
// All original coordinates, at wid = 24.
function drawSuperbug (ctx, thrustMag, time) {
  exhaust(ctx, SUPERBUG_YELLOW, thrustMag, time, WID * 0.98, WID * 0.16)

  // Yellow lobes, drawn first so the orange fuselage sits over their middles
  // exactly as the original layered them.
  for (const [cy, r] of [[-WID * 0.25, WID * 0.4], [WID * 0.35, WID * 0.45]]) {
    ctx.beginPath()
    ctx.ellipse(0, cy, r, r, 0, 0, Math.PI * 2)
    shell(ctx, SUPERBUG_YELLOW, cy - r, cy + r, { blur: 9, width: 1 })
  }

  // The swept quads. Original corners, mirrored.
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(dir * WID * 0.7, -WID * 0.1)
    ctx.lineTo(dir * WID * 0.4, WID * 0.2)
    ctx.lineTo(dir * WID * 0.4, -WID * 0.4)
    ctx.lineTo(dir * WID * 0.8, -WID * 0.8)
    ctx.closePath()
    shell(ctx, SUPERBUG_ORANGE, -WID * 0.8, WID * 0.2, { blur: 8, width: 0.9, deep: 0.45 })
  }

  // Orange fuselage.
  ctx.beginPath()
  ctx.ellipse(0, 0, WID * 0.4, WID * 0.5, 0, 0, Math.PI * 2)
  shell(ctx, SUPERBUG_ORANGE, -WID * 0.5, WID * 0.5, { blur: 11, width: 1.1 })

  // Yellow struts. The two long diagonals out to (+-0.8, -0.8) are the antennae.
  ctx.strokeStyle = rgba(lift(SUPERBUG_YELLOW, 0.3), 0.95)
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.shadowColor = rgba(SUPERBUG_YELLOW, 0.9)
  ctx.shadowBlur = 8
  ctx.beginPath()
  for (const dir of [-1, 1]) {
    ctx.moveTo(dir * WID * 0.4, WID * 0.3); ctx.lineTo(dir * WID * 0.4, -WID * 0.4)
    ctx.moveTo(dir * WID * 0.4, -WID * 0.4); ctx.lineTo(dir * WID * 0.8, -WID * 0.8)
    ctx.moveTo(dir * WID * 0.4, -WID * 0.1); ctx.lineTo(dir * WID * 0.75, -WID * 0.45)
    ctx.moveTo(dir * WID * 0.4, WID * 0.2); ctx.lineTo(dir * WID * 0.7, -WID * 0.1)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  // Antenna tips, so the diagonals end in something rather than stopping.
  ctx.fillStyle = rgba(lift(SUPERBUG_YELLOW, 0.5), 0.98)
  ctx.shadowColor = rgba(SUPERBUG_YELLOW, 0.95)
  ctx.shadowBlur = 9
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(dir * WID * 0.8, -WID * 0.8, 1.7, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Tail fin.
  ctx.beginPath()
  ctx.moveTo(WID * 0.225, WID * 0.7)
  ctx.lineTo(-WID * 0.225, WID * 0.7)
  ctx.lineTo(0, WID)
  ctx.closePath()
  shell(ctx, SUPERBUG_YELLOW, WID * 0.7, WID, { blur: 8, width: 0.9 })
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
//
// Imperial wedge. The pre-refactor sprite already had the bones of one -- a wide
// horizontal fuselage bar spanning +-1.16 wid with green rails above and below
// it, bracket wings whose roots sit at +-0.5 wid and bow out to +-1.4, and a
// pair of swept nose fins -- but its nose was a dome. Given a Star Destroyer to
// aim at, the dome becomes a long triangular prow and the rest of the original
// structure carries straight over.
//
// Dark hull, bright green edges: the two-tone the original declared in
// `colorOne = color(0, 255)` and then never drew.
function drawCompiler (ctx, thrustMag, time) {
  exhaust(ctx, COMPILER_GREEN, thrustMag, time, WID * 0.74, WID * 0.2)

  const hullGradient = (y0, y1) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1)
    g.addColorStop(0, rgba([74, 132, 114], 0.99))
    g.addColorStop(0.5, rgba(COMPILER_SLATE, 0.99))
    g.addColorStop(1, rgba([16, 40, 34], 0.99))
    return g
  }
  const edge = (w = 1.05, blur = 9) => {
    ctx.strokeStyle = rgba(lift(COMPILER_GREEN, 0.35), 0.95)
    ctx.lineWidth = w
    ctx.shadowColor = rgba(COMPILER_GREEN, 0.8)
    ctx.shadowBlur = blur
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // Bracket wings, from the original: roots at +-0.5 wid, bowing out to +-1.4.
  for (const dir of [-1, 1]) {
    crescent(ctx, dir * WID * 0.5, -WID * 0.8, WID * 0.8, dir * WID * 1.4, WID * 0.67, dir * WID * 0.16)
    shell(ctx, COMPILER_GREEN, -WID * 0.8, WID * 0.8, { blur: 10, width: 1 })
  }

  // The wide fuselage bar that ties the wings to the hull.
  ctx.beginPath()
  ctx.moveTo(-WID * 1.16, -WID * 0.19)
  ctx.lineTo(WID * 1.16, -WID * 0.19)
  ctx.lineTo(WID * 1.16, WID * 0.19)
  ctx.lineTo(-WID * 1.16, WID * 0.19)
  ctx.closePath()
  ctx.fillStyle = hullGradient(-WID * 0.19, WID * 0.19)
  ctx.fill()
  edge(0.9, 7)

  // Green rails along the bar, as in the original.
  ctx.strokeStyle = rgba(lift(COMPILER_GREEN, 0.25), 0.9)
  ctx.lineWidth = 1
  ctx.shadowColor = rgba(COMPILER_GREEN, 0.75)
  ctx.shadowBlur = 6
  ctx.beginPath()
  for (const sy of [-0.17, 0.17]) {
    ctx.moveTo(-WID * 1.13, WID * sy)
    ctx.lineTo(WID * 1.13, WID * sy)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  // The prow: a long wedge, widest at the stern, coming to a point at the bow.
  ctx.beginPath()
  ctx.moveTo(0, -WID * 1.5)
  ctx.lineTo(WID * 0.42, WID * 0.5)
  ctx.lineTo(WID * 0.3, WID * 0.74)
  ctx.lineTo(-WID * 0.3, WID * 0.74)
  ctx.lineTo(-WID * 0.42, WID * 0.5)
  ctx.closePath()
  ctx.fillStyle = hullGradient(-WID * 1.5, WID * 0.74)
  ctx.fill()
  edge(1.15, 11)

  // Panel lines running the length of the wedge -- the surface detail that
  // makes an Imperial hull read as plated rather than as a triangle.
  ctx.strokeStyle = rgba(COMPILER_GREEN, 0.3)
  ctx.lineWidth = 0.7
  ctx.beginPath()
  for (const k of [0.45, 0.72]) {
    ctx.moveTo(0, -WID * 1.5)
    ctx.lineTo(WID * 0.42 * k, WID * 0.5)
    ctx.moveTo(0, -WID * 1.5)
    ctx.lineTo(-WID * 0.42 * k, WID * 0.5)
  }
  ctx.moveTo(-WID * 0.26, -WID * 0.28); ctx.lineTo(WID * 0.26, -WID * 0.28)
  ctx.stroke()

  // Swept nose fins, from the original.
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(dir * WID * 0.05, -WID * 0.62)
    ctx.lineTo(dir * WID * 0.05, -WID * 0.86)
    ctx.lineTo(dir * WID * 0.5, -WID * 1.02)
    ctx.closePath()
    ctx.fillStyle = rgba([16, 40, 34], 0.98)
    ctx.fill()
    edge(0.8, 6)
  }

  // Bridge tower at the stern, the one silhouette cue that says Star Destroyer
  // more than the wedge does.
  ctx.beginPath()
  ctx.moveTo(-WID * 0.17, WID * 0.5)
  ctx.lineTo(WID * 0.17, WID * 0.5)
  ctx.lineTo(WID * 0.13, WID * 0.26)
  ctx.lineTo(-WID * 0.13, WID * 0.26)
  ctx.closePath()
  ctx.fillStyle = hullGradient(WID * 0.26, WID * 0.5)
  ctx.fill()
  edge(0.9, 8)

  ctx.fillStyle = rgba(lift(COMPILER_GREEN, 0.55), 0.98)
  ctx.shadowColor = rgba(COMPILER_GREEN, 0.95)
  ctx.shadowBlur = 9
  ctx.fillRect(-WID * 0.08, WID * 0.33, WID * 0.16, WID * 0.09)
  ctx.shadowBlur = 0
}

// ── Voidwalker ──────────────────────────────────────────────────────────────
//
// The pre-refactor sprite is a 15x12 pixel grid, not the three plain columns the
// 2025 rewrite reduced it to -- a central spine with stepped wings sweeping back
// and outboard slabs, picked out with white accent cells running diagonally
// through it. That structure is the craft, so it is reproduced cell for cell.
//
// The sleekness comes from treatment rather than from redrawing it: each cell is
// a chamfered plate rather than a hard square, they overlap slightly so clusters
// read as continuous hull, and the whole thing is lit top-down with a glowing
// rim. Blocky in layout, smooth in surface.
const VW_CELL = 3.1        // design px per grid cell
const VW_CHAMFER = 0.8

const VOIDWALKER_HULL = [
  [-7,-4], [-7,-3], [-7,-2], [-7,-1], [-7,0], [-7,1], [-7,2], [-6,-3], [-6,-2],
  [-6,-1], [-6,0], [-6,1], [-5,-2], [-4,-1], [-3,-1], [-1,-4], [-1,-3], [-1,0],
  [-1,1], [-1,4], [-1,5], [0,-5], [0,-4], [0,-3], [0,-2], [0,-1], [0,0],
  [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [1,-4], [1,-3], [1,0],
  [1,1], [1,4], [1,5], [3,-1], [4,-1], [5,-2], [6,-3], [6,-2], [6,-1],
  [6,0], [6,1], [7,-4], [7,-3], [7,-2], [7,-1], [7,0], [7,1], [7,2]
]

const VOIDWALKER_ACCENT = [
  [-3,-3], [-3,-2], [-3,1], [-3,2], [-3,5], [-3,6], [-2,-4], [-2,0], [-2,4],
  [-1,-5], [-1,-1], [-1,3], [1,-5], [1,-1], [1,3], [2,-4], [2,0], [2,4],
  [3,-3], [3,-2], [3,1], [3,2], [3,5], [3,6]
]

function voidwalkerPlates (ctx, cells) {
  const s = VW_CELL
  const r = VW_CHAMFER
  // Overlap by a shade so neighbouring cells fuse instead of showing seams.
  const o = 0.35
  ctx.beginPath()
  for (const [gx, gy] of cells) {
    const x = gx * s - s / 2 - o
    const y = gy * s - s / 2 - o
    const w = s + o * 2
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + w - r)
    ctx.quadraticCurveTo(x + w, y + w, x + w - r, y + w)
    ctx.lineTo(x + r, y + w)
    ctx.quadraticCurveTo(x, y + w, x, y + w - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

function drawVoidwalker (ctx, thrustMag, time) {
  exhaust(ctx, VOIDWALKER_PURPLE, thrustMag, time, VW_CELL * 7, VW_CELL * 1.5)

  voidwalkerPlates(ctx, VOIDWALKER_HULL)
  shell(ctx, VOIDWALKER_PURPLE, -VW_CELL * 6, VW_CELL * 7, { blur: 10, width: 0.9, deep: 0.34 })

  // Accents are deliberately held back. In the original the white cells are a
  // scatter of highlights through a purple hull; rendered at full brightness
  // with a lifted gradient they take the craft over and it reads as a white
  // ship with purple trim.
  voidwalkerPlates(ctx, VOIDWALKER_ACCENT)
  const a = ctx.createLinearGradient(0, -VW_CELL * 6, 0, VW_CELL * 7)
  a.addColorStop(0, rgba([196, 204, 238], 0.88))
  a.addColorStop(0.55, rgba([150, 158, 205], 0.82))
  a.addColorStop(1, rgba([104, 110, 158], 0.7))
  ctx.fillStyle = a
  ctx.fill()
  ctx.strokeStyle = rgba([214, 222, 255], 0.55)
  ctx.lineWidth = 0.6
  ctx.shadowColor = rgba(VOIDWALKER_SILVER, 0.4)
  ctx.shadowBlur = 5
  ctx.stroke()
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
