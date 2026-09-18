// Title, craft select, and the between-run overlays. All drawn on the same
// canvas over the live simulation, so the board keeps moving behind the menus.

import {
  theme, palette, drawPanel, drawCornerFlourish,
  canvasFont, typeCase, rgbaToCss, withAlpha
} from './theme.js'
import { drawCraft, CRAFT_COLORS } from './craft.js'
import { CRAFTS, thrustAccel } from '../game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'
import { PAUSE } from '../core/pause.js'

const CX = DESIGN_WIDTH / 2

function scrim (ctx, alpha) {
  ctx.fillStyle = `rgba(2, 2, 6, ${alpha})`
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
}

function centred (ctx, text, role, size, y, color, blur = 16) {
  ctx.save()
  ctx.font = canvasFont(role, size)
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.fillText(typeCase(role, text), CX, y)
  ctx.restore()
}

export function drawTitle (ctx, time) {
  scrim(ctx, 0.42)

  // Title in gold, the one colour the original is remembered for.
  const bob = Math.sin(time * 0.9) * 3
  centred(ctx, 'SINGULARITY', 'display', 88, 292 + bob,
    rgbaToCss(withAlpha(palette.secondary.core, 0.97)), 34)

  centred(ctx, 'Surf the gravity wells · Reach the gate', 'data', 15, 344,
    rgbaToCss(withAlpha(palette.primary.core, 0.72)), 8)

  const pulse = 0.55 + Math.sin(time * 2.4) * 0.35
  centred(ctx, 'Click to begin', 'label', 17, 470,
    rgbaToCss(withAlpha(palette.primary.core, pulse)), 10)

  ctx.save()
  ctx.font = canvasFont('micro', 10)
  ctx.textAlign = 'center'
  ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.45))
  ctx.fillText('PACZYNSKI-WIITA GRAVITY  ·  REAL SCHWARZSCHILD GEOMETRY', CX, 566)
  ctx.restore()

  // Draws all four corners itself from the canvas dimensions.
  drawCornerFlourish(ctx, DESIGN_WIDTH, DESIGN_HEIGHT, palette.primary.core,
    { margin: 26, size: 34, style: 'bracket' })
}

// ── Craft select ──

const CARD_W = 244
const CARD_H = 290
const CARD_GAP = 24
const CARD_Y = 226

function craftCardRect (i) {
  const total = CRAFTS.length * CARD_W + (CRAFTS.length - 1) * CARD_GAP
  const x0 = CX - total / 2
  return { x: x0 + i * (CARD_W + CARD_GAP), y: CARD_Y, width: CARD_W, height: CARD_H }
}

export function craftAtPoint (mx, my) {
  for (let i = 0; i < CRAFTS.length; i++) {
    const r = craftCardRect(i)
    if (mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height) return i
  }
  return -1
}

export function drawCraftSelect (ctx, time, hoverIndex) {
  scrim(ctx, 0.55)
  centred(ctx, 'Select a surfer', 'title', 38, 140,
    rgbaToCss(withAlpha(palette.secondary.core, 0.95)), 18)
  centred(ctx, 'Gravity pulls every hull the same · Everything else is a trade', 'data', 12, 178,
    rgbaToCss(withAlpha(palette.primary.core, 0.58)), 6)

  CRAFTS.forEach((craft, i) => {
    const r = craftCardRect(i)
    const hot = i === hoverIndex

    drawPanel(ctx, theme, {
      x: r.x, y: r.y, width: r.width, height: r.height,
      cornerSize: 14,
      bgOpacity: hot ? 0.10 : 0.035,
      color: hot ? palette.secondary.core : palette.primary.core
    })

    // Live craft art, gently drifting so each card reads as a real ship.
    const cy = r.y + 58
    drawCraft(ctx, craft.id, r.x + r.width / 2, cy,
      -Math.PI / 2 + Math.sin(time * 1.1 + i) * 0.16,
      hot ? 0.5 : 0, time, craft.cardScale * (hot ? 1.06 : 1))

    ctx.save()
    ctx.textAlign = 'center'
    const cxx = r.x + r.width / 2

    ctx.font = canvasFont('heading', 16)
    ctx.fillStyle = rgbaToCss(withAlpha(
      hot ? palette.secondary.core : palette.primary.core, 0.95))
    ctx.fillText(typeCase('heading', craft.name), cxx, r.y + 118)

    ctx.font = canvasFont('data', 9.5)
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.5))
    wrap(ctx, typeCase('data', craft.tagline), cxx, r.y + 136, r.width - 26, 12)

    drawStatGauges(ctx, craft, cxx, r.y + 172, hot)
    ctx.restore()
  })
}

// Four segmented cells, in the craft's own colours.
//
// Every cell is in the hull's own colours. MASS is the one reading where fuller
// is worse, and the label says so rather than the colour: a red column in a bank
// of four reads as a fault light, which is not what a heavy craft is.
//
// Why mass earns a cell of its own rather than being implied by ACCEL: gravity
// accelerates every hull identically, so a heavy craft does not fall faster.
// What it does is shed velocity more slowly once the well has given it some,
// because drag is a force and a force moves a heavy body less. The pull sticks
// to it. That is a genuinely separate trait from engine authority -- the
// Compiler is heavy AND powerful, the Psych Bike light AND weak -- so knowing
// one tells you nothing about the other.
const STAT_CELLS = [
  { key: 'evasion', label: 'EVADE', cost: false },
  { key: 'accel', label: 'ACCEL', cost: false },
  { key: 'top', label: 'TOP', cost: false },
  { key: 'mass', label: 'MASS', cost: true }
]

function statValues (craft) {
  return {
    evasion: 1 / craft.hull,
    accel: thrustAccel(craft),
    top: craft.maxSpeed,
    mass: craft.mass
  }
}

// Normalised across the roster, with a floor so the lowest reading still shows
// a couple of lit cells rather than reading as broken.
function normalisedStats (craft) {
  const all = CRAFTS.map(statValues)
  const mine = statValues(craft)
  const out = {}
  for (const { key } of STAT_CELLS) {
    const lo = Math.min(...all.map(v => v[key]))
    const hi = Math.max(...all.map(v => v[key]))
    out[key] = hi - lo < 1e-9 ? 0.6 : 0.18 + 0.82 * ((mine[key] - lo) / (hi - lo))
  }
  return out
}

const CELL_W = 17
const CELL_GAP = 13
const CELL_H = 84
const CELL_ROWS = 14

function drawCell (ctx, x, top, value, base, lit, hot) {
  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
  const rowH = CELL_H / CELL_ROWS
  const seg = rowH - 1.7
  const on = Math.round(CELL_ROWS * value)

  // Housing, clipped at the top corners.
  const c = 3.5
  ctx.beginPath()
  ctx.moveTo(x + c, top - 4)
  ctx.lineTo(x + CELL_W - c, top - 4)
  ctx.lineTo(x + CELL_W, top - 4 + c)
  ctx.lineTo(x + CELL_W, top + CELL_H + 4)
  ctx.lineTo(x, top + CELL_H + 4)
  ctx.lineTo(x, top - 4 + c)
  ctx.closePath()
  ctx.fillStyle = rgba(base, 0.05)
  ctx.fill()
  ctx.strokeStyle = rgba(base, hot ? 0.4 : 0.26)
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Cells fill from the bottom.
  for (let i = 0; i < CELL_ROWS; i++) {
    const y = top + CELL_H - (i + 1) * rowH
    if (i < on) {
      // Brighter toward the top of the lit stack, so the column has a gradient
      // rather than reading as a flat block.
      const k = 0.62 + 0.38 * (i / Math.max(1, on - 1))
      ctx.fillStyle = rgba(lit, (hot ? 0.95 : 0.8) * k)
      ctx.shadowColor = rgba(lit, 0.9)
      ctx.shadowBlur = hot ? 7 : 4
    } else {
      ctx.fillStyle = rgba(base, 0.12)
      ctx.shadowBlur = 0
    }
    ctx.fillRect(x + 2, y + 0.85, CELL_W - 4, seg)
  }
  ctx.shadowBlur = 0

  // Cap across the reading.
  const capY = top + CELL_H - on * rowH
  ctx.strokeStyle = rgba([255, 255, 255], hot ? 0.9 : 0.66)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - 1.5, capY)
  ctx.lineTo(x + CELL_W + 1.5, capY)
  ctx.stroke()
}

function drawStatGauges (ctx, craft, cx, top, hot) {
  const [mass, accent] = CRAFT_COLORS[craft.id] ?? CRAFT_COLORS.superbug
  const norm = normalisedStats(craft)
  const total = STAT_CELLS.length * CELL_W + (STAT_CELLS.length - 1) * CELL_GAP
  const x0 = cx - total / 2

  ctx.save()
  STAT_CELLS.forEach(({ key, label, cost }, i) => {
    const x = x0 + i * (CELL_W + CELL_GAP)
    drawCell(ctx, x, top, norm[key], mass, accent, hot)
    ctx.font = canvasFont('micro', 7.5)
    ctx.textAlign = 'center'
    // The cost reading is called out in the label's weight, not its hue.
    ctx.fillStyle = `rgba(${mass[0]}, ${mass[1]}, ${mass[2]}, ${hot ? 0.95 : 0.66})`
    ctx.fillText(label, x + CELL_W / 2, top + CELL_H + 17)
    if (cost) {
      // Drawn rather than typed: the down-arrow glyph is near-illegible at 7.5px
      // in a mono face and reads as a comma.
      const w = ctx.measureText(label).width
      const ax = x + CELL_W / 2 + w / 2 + 4
      const ay = top + CELL_H + 13.5
      ctx.beginPath()
      ctx.moveTo(ax - 2.6, ay)
      ctx.lineTo(ax + 2.6, ay)
      ctx.lineTo(ax, ay + 4.2)
      ctx.closePath()
      ctx.fill()
    }
  })
  ctx.restore()
}

function wrap (ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let ly = y
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, ly)
      line = w
      ly += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, cx, ly)
}

// ── Overlays ──

export function drawCraftLost (ctx, game) {
  const t = Math.min(1, game.phaseTime / 0.45)
  scrim(ctx, 0.30 * t)
  const label = game.lossCause === 'IMPACT' ? 'Hull breach' : 'Crossed the horizon'
  centred(ctx, label, 'title', 44, 350,
    rgbaToCss(withAlpha(palette.danger.core, 0.95 * t)), 22)
  centred(ctx, `${game.lives} craft remaining`, 'label', 16, 396,
    rgbaToCss(withAlpha(palette.primary.core, 0.7 * t)), 8)
}

export function drawComplete (ctx, game) {
  scrim(ctx, 0.55)
  centred(ctx, 'Gate reached', 'title', 46, 316,
    rgbaToCss(withAlpha(palette.secondary.core, 0.97)), 24)
  const kept = game.lives === 3 ? 'No craft lost' : `${game.lives} of 3 craft brought home`
  centred(ctx, kept, 'data', 15, 372,
    rgbaToCss(withAlpha(palette.primary.core, 0.8)), 10)
  const pulse = 0.5 + Math.sin(game.elapsed * 2.4) * 0.35
  centred(ctx, 'Click to fly again', 'label', 16, 462,
    rgbaToCss(withAlpha(palette.primary.core, pulse)), 8)
}

export function drawGameOver (ctx, game) {
  scrim(ctx, 0.66)
  centred(ctx, 'All craft lost', 'title', 46, 320,
    rgbaToCss(withAlpha(palette.danger.core, 0.95)), 24)
  const pulse = 0.5 + Math.sin(game.elapsed * 2.4) * 0.35
  centred(ctx, 'Click to restart', 'label', 16, 420,
    rgbaToCss(withAlpha(palette.primary.core, pulse)), 8)
}

// The finish gate.
//
// It was a bracketed rectangle, which is the problem: a box drawn on the board
// looks like a box drawn on the board. What the gate actually is, is an opening
// -- the edge of the field, with something on the other side. So it is drawn as
// light rather than as an object: a column spilling in from beyond the boundary,
// feathered to nothing top and bottom so it has no hard edges of its own, marked
// only by two hairlines saying where the opening starts and stops.
//
// The collision area is unchanged. This is purely how it looks.
// The light spills further inboard than the trigger box. The collision area is
// only ~35px of visible board at this edge -- the right size to fly through and
// far too small to look like anything -- so the glow is drawn wide and soft
// while the gate itself stays exactly where it was.
const GATE_GLOW_REACH = 1.05      // multiple of the opening height

export function drawGate (ctx, gate, time) {
  const { x, y, width: w, height: h } = gate
  const top = y - h / 2
  const right = Math.min(x + w / 2, DESIGN_WIDTH)

  ctx.save()

  // One radial falloff centred on the threshold rather than a stack of
  // horizontal bands. The banded version stepped visibly -- thirty strips of
  // uniform alpha over 216px is a 7px staircase -- and a single gradient is both
  // smooth and cheaper.
  const breathe = 1 + Math.sin(time * 0.9) * 0.05
  const reach = h * GATE_GLOW_REACH * breathe
  const glow = ctx.createRadialGradient(right, y, 0, right, y, reach)
  glow.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0.5)))
  glow.addColorStop(0.18, rgbaToCss(withAlpha(palette.secondary.core, 0.22)))
  glow.addColorStop(0.5, rgbaToCss(withAlpha(palette.secondary.core, 0.06)))
  glow.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0)))
  ctx.fillStyle = glow
  ctx.fillRect(right - reach, y - reach, reach, reach * 2)

  // The threshold: a bright line on the boundary, feathered to nothing at the
  // lintels. This is the part the eye actually lands on.
  const edge = ctx.createLinearGradient(0, top, 0, top + h)
  edge.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0)))
  edge.addColorStop(0.5, rgbaToCss(withAlpha(palette.secondary.core, 0.98)))
  edge.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0)))
  ctx.strokeStyle = edge
  ctx.lineWidth = 2.6
  ctx.shadowColor = rgbaToCss(palette.secondary.glow)
  ctx.shadowBlur = 16
  ctx.beginPath()
  ctx.moveTo(right - 1.3, top)
  ctx.lineTo(right - 1.3, top + h)
  ctx.stroke()

  // Two hairlines saying where the opening starts and stops, fading as they run
  // inboard so they mark the threshold without framing it.
  const runIn = h * 0.42
  for (const ly of [top, top + h]) {
    const rule = ctx.createLinearGradient(right - runIn, ly, right, ly)
    rule.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0)))
    rule.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0.92)))
    ctx.strokeStyle = rule
    ctx.lineWidth = 1.3
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(right - runIn, ly)
    ctx.lineTo(right, ly)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  ctx.font = canvasFont('micro', 9)
  ctx.textAlign = 'right'
  ctx.fillStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.7))
  ctx.fillText('GATE', right - 6, top - 10)
  ctx.restore()
}

// ── Pause and the portrait gate ─────────────────────────────────────────────

/**
 * Drawn in screen space rather than board space: in portrait the letterboxed
 * board is a thin strip, and a message laid out inside it would be unreadable
 * at exactly the moment it most needs reading.
 */
export function drawPauseOverlay (ctx, reason, cssWidth, cssHeight, dpr, time) {
  const cx = cssWidth / 2
  const cy = cssHeight / 2

  ctx.save()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Heavy scrim: the overlay lands over whatever screen was showing, and on the
  // title screen a lighter one leaves the game's own headline colliding with it.
  ctx.fillStyle = 'rgba(2, 2, 6, 0.9)'
  ctx.fillRect(0, 0, cssWidth, cssHeight)

  const gold = rgbaToCss(withAlpha(palette.secondary.core, 0.97))
  const dim = rgbaToCss(withAlpha(palette.primary.core, 0.72))
  const pulse = 0.5 + Math.sin(time * 2.4) * 0.35

  // Scale with the narrow dimension so the type stays proportionate on a phone.
  const unit = Math.max(11, Math.min(cssWidth, cssHeight) / 26)

  ctx.textAlign = 'center'
  ctx.shadowColor = gold
  ctx.shadowBlur = 18

  if (reason === PAUSE.ROTATE) {
    drawPhoneGlyph(ctx, cx, cy - unit * 3.4, unit * 2.2, time)
    ctx.font = canvasFont('title', unit * 1.5)
    ctx.fillStyle = gold
    ctx.fillText(typeCase('title', 'Rotate your device'), cx, cy + unit * 1.6)
    ctx.shadowBlur = 6
    ctx.font = canvasFont('data', unit * 0.72)
    ctx.fillStyle = dim
    ctx.fillText(typeCase('data', 'Singularity needs a landscape screen'), cx, cy + unit * 3.2)
  } else if (reason === PAUSE.READY) {
    ctx.font = canvasFont('title', unit * 1.5)
    ctx.fillStyle = gold
    ctx.fillText(typeCase('title', 'Ready'), cx, cy - unit * 0.4)
    ctx.shadowBlur = 8
    ctx.font = canvasFont('label', unit * 0.85)
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, pulse))
    ctx.fillText(typeCase('label', 'Tap to begin'), cx, cy + unit * 1.9)
  } else {
    ctx.font = canvasFont('title', unit * 1.5)
    ctx.fillStyle = gold
    ctx.fillText(typeCase('title', 'Paused'), cx, cy - unit * 0.4)
    ctx.shadowBlur = 8
    ctx.font = canvasFont('label', unit * 0.85)
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, pulse))
    ctx.fillText(typeCase('label', 'Press enter or tap to resume'), cx, cy + unit * 1.9)
  }

  ctx.restore()
}

// A phone turning from upright to landscape, so the instruction reads without
// depending on the text being legible.
function drawPhoneGlyph (ctx, cx, cy, size, time) {
  const turn = (Math.sin(time * 1.5) * 0.5 + 0.5) * (Math.PI / 2)
  const w = size * 0.58
  const h = size
  const r = size * 0.12

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(turn)
  ctx.strokeStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.95))
  ctx.lineWidth = Math.max(1.5, size * 0.055)
  ctx.shadowColor = rgbaToCss(palette.secondary.glow)
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.moveTo(-w / 2 + r, -h / 2)
  ctx.lineTo(w / 2 - r, -h / 2)
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  ctx.lineTo(w / 2, h / 2 - r)
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  ctx.lineTo(-w / 2 + r, h / 2)
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  ctx.lineTo(-w / 2, -h / 2 + r)
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  ctx.closePath()
  ctx.stroke()

  ctx.strokeStyle = rgbaToCss(withAlpha(palette.primary.core, 0.55))
  ctx.lineWidth = Math.max(1, size * 0.04)
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.moveTo(-w * 0.16, -h * 0.4)
  ctx.lineTo(w * 0.16, -h * 0.4)
  ctx.stroke()
  ctx.restore()
}
