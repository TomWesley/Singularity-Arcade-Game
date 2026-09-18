// Title, craft select, and the between-run overlays. All drawn on the same
// canvas over the live simulation, so the board keeps moving behind the menus.

import {
  theme, palette, drawPanel, drawCornerFlourish,
  canvasFont, typeCase, rgbaToCss, withAlpha
} from './theme.js'
import { drawCraft, CRAFT_COLORS } from './craft.js'
import { CRAFTS } from '../game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

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

export function craftCardRect (i) {
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
  centred(ctx, 'Gravity pulls every hull the same · Only thrust differs', 'data', 12, 178,
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
    const cy = r.y + 68
    drawCraft(ctx, craft.id, r.x + r.width / 2, cy,
      -Math.PI / 2 + Math.sin(time * 1.1 + i) * 0.16,
      hot ? 0.5 : 0, time, craft.cardScale * (hot ? 1.06 : 1))

    ctx.save()
    ctx.textAlign = 'center'
    const cxx = r.x + r.width / 2

    ctx.font = canvasFont('heading', 16)
    ctx.fillStyle = rgbaToCss(withAlpha(
      hot ? palette.secondary.core : palette.primary.core, 0.95))
    ctx.fillText(typeCase('heading', craft.name), cxx, r.y + 136)

    ctx.font = canvasFont('data', 9.5)
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.5))
    wrap(ctx, typeCase('data', craft.tagline), cxx, r.y + 154, r.width - 26, 12)

    drawStatDials(ctx, craft, cxx, r.y + 226, hot)
    ctx.restore()
  })
}

// Three instrument dials, in the craft's own colours.
//
// TOP and ACCEL are genuinely different traits and the roster is built on the
// difference: the Psych Bike has the highest top speed and the weakest engine,
// so it takes 0.32s to reach it; the Compiler gets to its lower ceiling in
// 0.12s. One wins an open sprint, the other wins anywhere that demands changing
// direction in a hurry. A single "speed" number would have hidden that
// entirely.
//
// EVASION is the hitbox inverted, so a fuller dial is always better and the
// three read the same way round.
const STAT_DIALS = [
  { key: 'evasion', label: 'EVADE' },
  { key: 'accel', label: 'ACCEL' },
  { key: 'top', label: 'TOP' }
]

function statValues (craft) {
  return {
    evasion: 1 / craft.hull,
    accel: craft.thrust / craft.mass,
    top: craft.maxSpeed
  }
}

// Normalised across the roster, with a floor so the weakest dial still shows a
// reading rather than sitting empty.
function normalisedStats (craft) {
  const all = CRAFTS.map(statValues)
  const mine = statValues(craft)
  const out = {}
  for (const { key } of STAT_DIALS) {
    const lo = Math.min(...all.map(v => v[key]))
    const hi = Math.max(...all.map(v => v[key]))
    out[key] = hi - lo < 1e-9 ? 0.6 : 0.2 + 0.8 * ((mine[key] - lo) / (hi - lo))
  }
  return out
}

const DIAL_START = -0.17 * Math.PI     // sweeps clockwise through the bottom
const DIAL_SWEEP = 1.34 * Math.PI
const DIAL_SEGMENTS = 18

function drawDial (ctx, cx, cy, radius, value, mass, accent, hot) {
  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
  const lit = Math.round(DIAL_SEGMENTS * value)

  ctx.lineCap = 'butt'
  for (let i = 0; i < DIAL_SEGMENTS; i++) {
    const a0 = DIAL_START + (i / DIAL_SEGMENTS) * DIAL_SWEEP
    const a1 = DIAL_START + ((i + 0.72) / DIAL_SEGMENTS) * DIAL_SWEEP
    const on = i < lit
    ctx.strokeStyle = on ? rgba(accent, hot ? 0.98 : 0.85) : rgba(mass, 0.15)
    ctx.lineWidth = on ? 4.2 : 3
    ctx.shadowColor = on ? rgba(mass, 0.9) : 'transparent'
    ctx.shadowBlur = on ? (hot ? 9 : 5) : 0
    ctx.beginPath()
    ctx.arc(cx, cy, radius, a0, a1)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  // Needle at the reading, so the eye lands on the value rather than counting.
  const na = DIAL_START + value * DIAL_SWEEP
  ctx.strokeStyle = rgba([255, 255, 255], hot ? 0.95 : 0.75)
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(na) * (radius - 6.5), cy + Math.sin(na) * (radius - 6.5))
  ctx.lineTo(cx + Math.cos(na) * (radius + 5), cy + Math.sin(na) * (radius + 5))
  ctx.stroke()

  // Hub.
  ctx.fillStyle = rgba(mass, hot ? 0.5 : 0.32)
  ctx.beginPath()
  ctx.arc(cx, cy, 2.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawStatDials (ctx, craft, cx, cy, hot) {
  const [mass, accent] = CRAFT_COLORS[craft.id] ?? CRAFT_COLORS.superbug
  const norm = normalisedStats(craft)
  const spacing = 52
  const radius = 20

  ctx.save()
  STAT_DIALS.forEach(({ key, label }, i) => {
    const dx = cx + (i - 1) * spacing
    drawDial(ctx, dx, cy, radius, norm[key], mass, accent, hot)
    ctx.font = canvasFont('micro', 8)
    ctx.textAlign = 'center'
    ctx.fillStyle = `rgba(${mass[0]}, ${mass[1]}, ${mass[2]}, ${hot ? 0.92 : 0.66})`
    ctx.fillText(label, dx, cy + radius + 15)
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
// It sits hard against the right edge with half its width past the boundary, so
// reaching it reads as sailing off the board rather than arriving at a box
// drawn on it. When the far post falls outside the board it is not drawn --
// instead the light ramps up toward the edge, and a bright threshold line marks
// the boundary itself. The way out is off the screen.
export function drawGate (ctx, gate, time) {
  const { x, y, width: w, height: h } = gate
  const left = x - w / 2
  const right = x + w / 2
  const top = y - h / 2
  const bottom = y + h / 2
  const openEnded = right >= DESIGN_WIDTH - 1
  const visibleRight = Math.min(right, DESIGN_WIDTH)

  ctx.save()

  // Light spilling from beyond the boundary.
  const phase = 0.30 + Math.sin(time * 2.2) * 0.16
  const shimmer = ctx.createLinearGradient(left, top, visibleRight, top)
  if (openEnded) {
    shimmer.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0)))
    shimmer.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, phase)))
  } else {
    shimmer.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0)))
    shimmer.addColorStop(0.5, rgbaToCss(withAlpha(palette.secondary.core, phase)))
    shimmer.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0)))
  }
  ctx.fillStyle = shimmer
  ctx.fillRect(left, top, visibleRight - left, h)

  ctx.strokeStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.9))
  ctx.lineWidth = 2
  ctx.shadowColor = rgbaToCss(palette.secondary.glow)
  ctx.shadowBlur = 14

  // Near post, always drawn.
  const arm = 16
  ctx.beginPath()
  ctx.moveTo(left + arm, top); ctx.lineTo(left, top)
  ctx.lineTo(left, bottom); ctx.lineTo(left + arm, bottom)
  ctx.stroke()

  if (openEnded) {
    // The boundary itself: a bright threshold, brightest at the middle of the
    // opening and fading out at the lintels.
    const edge = ctx.createLinearGradient(0, top, 0, bottom)
    edge.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0.1)))
    edge.addColorStop(0.5, rgbaToCss(withAlpha(palette.secondary.core, 0.95)))
    edge.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0.1)))
    ctx.strokeStyle = edge
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(DESIGN_WIDTH - 1.5, top)
    ctx.lineTo(DESIGN_WIDTH - 1.5, bottom)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(right - arm, top); ctx.lineTo(right, top)
    ctx.lineTo(right, bottom); ctx.lineTo(right - arm, bottom)
    ctx.stroke()
  }

  ctx.font = canvasFont('micro', 10)
  ctx.textAlign = openEnded ? 'right' : 'center'
  ctx.fillStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.7))
  ctx.shadowBlur = 6
  ctx.fillText('GATE', openEnded ? DESIGN_WIDTH - 10 : x, top - 12)
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

  if (reason === 'rotate') {
    drawPhoneGlyph(ctx, cx, cy - unit * 3.4, unit * 2.2, time)
    ctx.font = canvasFont('title', unit * 1.5)
    ctx.fillStyle = gold
    ctx.fillText(typeCase('title', 'Rotate your device'), cx, cy + unit * 1.6)
    ctx.shadowBlur = 6
    ctx.font = canvasFont('data', unit * 0.72)
    ctx.fillStyle = dim
    ctx.fillText(typeCase('data', 'Singularity needs a landscape screen'), cx, cy + unit * 3.2)
  } else if (reason === 'ready') {
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
