// Title, craft select, and the between-run overlays. All drawn on the same
// canvas over the live simulation, so the board keeps moving behind the menus.

import {
  theme, palette, drawPanel, drawCornerFlourish,
  canvasFont, typeCase, rgbaToCss, withAlpha
} from './theme.js'
import { drawCraft } from './craft.js'
import { CRAFTS, thrustAccel } from '../game/crafts.js'
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
    const cy = r.y + 82
    drawCraft(ctx, craft.id, r.x + r.width / 2, cy,
      -Math.PI / 2 + Math.sin(time * 1.1 + i) * 0.16,
      hot ? 0.5 : 0, time, (hot ? 2.7 : 2.5) * craft.artScale)

    ctx.save()
    ctx.textAlign = 'center'
    const cxx = r.x + r.width / 2

    ctx.font = canvasFont('heading', 17)
    ctx.fillStyle = rgbaToCss(withAlpha(
      hot ? palette.secondary.core : palette.primary.core, 0.95))
    ctx.fillText(typeCase('heading', craft.name), cxx, r.y + 152)

    ctx.font = canvasFont('data', 10.5)
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.52))
    wrap(ctx, typeCase('data', craft.tagline), cxx, r.y + 176, r.width - 30, 15)

    // The three numbers that actually decide how it flies.
    const stats = [
      ['THRUST/MASS', `${thrustAccel(craft).toFixed(0)}`],
      ['MAX VEL', `${craft.maxSpeed}`],
      ['DAMPING', craft.drag.toFixed(2)]
    ]
    ctx.font = canvasFont('data', 11)
    stats.forEach(([label, value], si) => {
      const sy = r.y + 224 + si * 19
      ctx.textAlign = 'left'
      ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.45))
      ctx.fillText(label, r.x + 20, sy)
      ctx.textAlign = 'right'
      ctx.fillStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.85))
      ctx.fillText(value, r.x + r.width - 20, sy)
    })
    ctx.restore()
  })
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

// The finish gate: a pair of bracketed posts with a shimmering threshold.
export function drawGate (ctx, gate, time) {
  const { x, y, width: w, height: h } = gate
  const left = x - w / 2
  const right = x + w / 2
  const top = y - h / 2
  const bottom = y + h / 2

  ctx.save()
  const shimmer = ctx.createLinearGradient(left, top, right, top)
  const phase = 0.35 + Math.sin(time * 2.2) * 0.2
  shimmer.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0)))
  shimmer.addColorStop(0.5, rgbaToCss(withAlpha(palette.secondary.core, phase)))
  shimmer.addColorStop(1, rgbaToCss(withAlpha(palette.secondary.core, 0)))
  ctx.fillStyle = shimmer
  ctx.fillRect(left, top, w, h)

  ctx.strokeStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.9))
  ctx.lineWidth = 2
  ctx.shadowColor = rgbaToCss(palette.secondary.glow)
  ctx.shadowBlur = 14
  const arm = 16
  for (const px of [left, right]) {
    const dir = px === left ? 1 : -1
    ctx.beginPath()
    ctx.moveTo(px + dir * arm, top); ctx.lineTo(px, top)
    ctx.lineTo(px, bottom); ctx.lineTo(px + dir * arm, bottom)
    ctx.stroke()
  }

  ctx.font = canvasFont('micro', 10)
  ctx.textAlign = 'center'
  ctx.fillStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.7))
  ctx.shadowBlur = 6
  ctx.fillText('GATE', x, top - 12)
  ctx.restore()
}
