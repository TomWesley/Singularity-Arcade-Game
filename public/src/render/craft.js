// The four surfers, reprised.
//
// The 2019 silhouettes are the brief: Superbug's stacked lobes and tail fin,
// Psych Bike's twin outboard curves around a core, the Compiler's swept
// parenthesis wings under a dome, Voidwalker's blocky column with the long
// extended wings. Each is rebuilt in the engine's language -- thin strokes,
// selective glow, gradient fills, no flat monotone -- and each now banks into
// its heading instead of always facing up, because with real inertia the craft
// genuinely has one.

import { palette, rgbaToCss, withAlpha } from './theme.js'

const TAU = Math.PI * 2

/**
 * @param heading radians; the direction the craft is actually travelling
 * @param thrustMag 0..1 how hard the engine is firing, drives the exhaust
 * @param scale 1 is the in-flight size; the select cards draw much larger
 */
export function drawCraft (ctx, craftId, x, y, heading, thrustMag, time, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(heading + Math.PI / 2)   // art is drawn nose-up
  ctx.scale(scale, scale)

  drawExhaust(ctx, craftId, thrustMag, time)

  switch (craftId) {
    case 'psych-bike': drawPsychBike(ctx, time); break
    case 'compiler': drawCompiler(ctx, time); break
    case 'voidwalker': drawVoidwalker(ctx, time); break
    default: drawSuperbug(ctx, time)
  }

  ctx.restore()
}

function drawExhaust (ctx, craftId, mag, time) {
  if (mag < 0.04) return
  const len = 10 + mag * 26
  const flick = 0.85 + Math.sin(time * 34) * 0.15
  const g = ctx.createLinearGradient(0, 8, 0, 8 + len * flick)
  g.addColorStop(0, rgbaToCss(withAlpha(palette.secondary.core, 0.75 * mag)))
  g.addColorStop(0.45, rgbaToCss(withAlpha(palette.danger.core, 0.35 * mag)))
  g.addColorStop(1, rgbaToCss(withAlpha(palette.danger.core, 0)))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(-4.5, 8)
  ctx.lineTo(4.5, 8)
  ctx.lineTo(0, 8 + len * flick)
  ctx.closePath()
  ctx.fill()
}

function stroked (ctx, color, width, blur, path, fillStyle) {
  ctx.beginPath()
  path()
  if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill() }
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.stroke()
}

// Superbug — the stacked twin lobes and tail fin of the original, tightened
// into a hex-cell fuselage.
function drawSuperbug (ctx) {
  const gold = palette.secondary.core
  const body = ctx.createLinearGradient(0, -14, 0, 12)
  body.addColorStop(0, rgbaToCss(withAlpha(gold, 0.34)))
  body.addColorStop(1, rgbaToCss(withAlpha(palette.danger.core, 0.14)))

  stroked(ctx, rgbaToCss(withAlpha(gold, 0.95)), 1.3, 10, () => {
    ctx.moveTo(0, -14)
    ctx.lineTo(6.5, -4)
    ctx.lineTo(5, 8)
    ctx.lineTo(-5, 8)
    ctx.lineTo(-6.5, -4)
    ctx.closePath()
  }, body)

  // Upper and lower cells — the two lobes, now instrument cells.
  stroked(ctx, rgbaToCss(withAlpha(gold, 0.75)), 1, 6, () => {
    ctx.moveTo(0, -8); ctx.arc(0, -8, 3.1, 0, TAU)
  })
  stroked(ctx, rgbaToCss(withAlpha(palette.danger.core, 0.7)), 1, 6, () => {
    ctx.moveTo(0, 2.5); ctx.arc(0, 2.5, 2.2, 0, TAU)
  })

  // Tail fin.
  stroked(ctx, rgbaToCss(withAlpha(gold, 0.6)), 1, 5, () => {
    ctx.moveTo(-3.4, 8); ctx.lineTo(0, 13.5); ctx.lineTo(3.4, 8)
  })
}

// Psych Bike — twin outboard curves bracketing a core, exactly the original
// composition, drawn as two open arcs so it reads as a frame, not a hull.
function drawPsychBike (ctx, time) {
  const pink = palette.danger.core
  const gold = palette.secondary.core

  for (const dir of [-1, 1]) {
    stroked(ctx, rgbaToCss(withAlpha(pink, 0.85)), 1.5, 11, () => {
      ctx.moveTo(dir * 3.5, -13)
      ctx.quadraticCurveTo(dir * 13, -2, dir * 4.5, 11)
    })
  }

  // Cross-spar.
  stroked(ctx, rgbaToCss(withAlpha(pink, 0.5)), 1, 5, () => {
    ctx.moveTo(-7.5, 0); ctx.lineTo(7.5, 0)
  })

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 5.5)
  core.addColorStop(0, rgbaToCss(withAlpha(gold, 0.85)))
  core.addColorStop(1, rgbaToCss(withAlpha(pink, 0.12)))
  stroked(ctx, rgbaToCss(withAlpha(gold, 0.9)), 1.1, 12, () => {
    ctx.arc(0, 0, 5, 0, TAU)
  }, core)

  // Rotor tick, so the twitchiest craft looks nervous even at rest.
  ctx.save()
  ctx.rotate(time * 2.6)
  stroked(ctx, rgbaToCss(withAlpha(gold, 0.55)), 0.9, 4, () => {
    ctx.moveTo(0, -7.6); ctx.lineTo(0, -5.6)
  })
  ctx.restore()
}

// The Compiler — swept parenthesis wings under a dome. The heaviest craft, so
// it gets the most structure: a bracketed frame with visible ribs.
function drawCompiler (ctx) {
  const green = palette.tertiary.core
  const gold = palette.secondary.core

  for (const dir of [-1, 1]) {
    stroked(ctx, rgbaToCss(withAlpha(green, 0.8)), 1.6, 10, () => {
      ctx.moveTo(dir * 2.5, -11)
      ctx.bezierCurveTo(dir * 16, -6, dir * 16, 5, dir * 5, 12)
    })
    // Wing ribs.
    stroked(ctx, rgbaToCss(withAlpha(green, 0.34)), 0.8, 3, () => {
      ctx.moveTo(dir * 3, -3); ctx.lineTo(dir * 11.5, -1.5)
      ctx.moveTo(dir * 3.5, 3); ctx.lineTo(dir * 10, 4.5)
    })
  }

  const dome = ctx.createLinearGradient(0, -12, 0, 6)
  dome.addColorStop(0, rgbaToCss(withAlpha(gold, 0.4)))
  dome.addColorStop(1, rgbaToCss(withAlpha(green, 0.16)))
  stroked(ctx, rgbaToCss(withAlpha(gold, 0.9)), 1.3, 11, () => {
    ctx.moveTo(-4.5, 6)
    ctx.lineTo(-4.5, -5)
    ctx.quadraticCurveTo(0, -13.5, 4.5, -5)
    ctx.lineTo(4.5, 6)
    ctx.closePath()
  }, dome)
}

// Voidwalker — the blocky column and long extended wings, kept deliberately
// rectilinear. It is the most damped craft and it should look like it.
function drawVoidwalker (ctx) {
  const violet = palette.primary.core
  const gold = palette.secondary.core
  const u = 2.5

  const col = ctx.createLinearGradient(0, -13, 0, 11)
  col.addColorStop(0, rgbaToCss(withAlpha(violet, 0.45)))
  col.addColorStop(1, rgbaToCss(withAlpha(violet, 0.12)))
  stroked(ctx, rgbaToCss(withAlpha(violet, 0.95)), 1.2, 10, () => {
    ctx.rect(-u, -13, u * 2, 24)
  }, col)

  // Inboard wings.
  stroked(ctx, rgbaToCss(withAlpha(violet, 0.72)), 1.1, 7, () => {
    ctx.rect(-u * 2.6, -9, u * 1.2, 17)
    ctx.rect(u * 1.4, -9, u * 1.2, 17)
  })

  // The long outboard wings of the original.
  stroked(ctx, rgbaToCss(withAlpha(violet, 0.5)), 1, 6, () => {
    ctx.rect(-u * 6.4, -6.5, u * 1.1, 13)
    ctx.rect(u * 5.3, -6.5, u * 1.1, 13)
    ctx.moveTo(-u * 5.3, 0); ctx.lineTo(-u * 2.6, 0)
    ctx.moveTo(u * 2.6, 0); ctx.lineTo(u * 5.3, 0)
  })

  // Gold sensor blocks, the white detail squares of the original.
  ctx.shadowBlur = 8
  ctx.shadowColor = rgbaToCss(palette.secondary.glow)
  ctx.fillStyle = rgbaToCss(withAlpha(gold, 0.95))
  ctx.fillRect(-u * 0.5, -8, u, u)
  ctx.fillRect(-u * 0.5, 5, u, u)
}
