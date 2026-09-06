// Flight instruments. Built from the engine's panel and gauge components so the
// readouts match the rest of Wesley Arcade, and fed from the live simulation so
// they are telemetry rather than decoration.

import {
  theme, palette, drawPanel, drawBarGauge, drawIcon,
  canvasFont, rgbaToCss, withAlpha
} from './theme.js'
import { DESIGN_WIDTH } from '../core/viewport.js'

const GRAVITY_FULL_SCALE = 2600   // px/s^2 — roughly one craft's thrust budget

export function drawHud (ctx, game) {
  const craft = game.craft

  // ── Left: flight telemetry ──
  drawPanel(ctx, theme, {
    x: 16, y: 14, width: 232, height: 96,
    title: craft.name, cornerSize: 10, bgOpacity: 0.05
  })

  drawBarGauge(ctx, theme, {
    x: 28, y: 52, width: 152, height: 13,
    value: Math.min(1, game.speed / craft.maxSpeed),
    label: 'VEL', showValue: false
  })

  // Gravity load. Turns red as the field starts to win.
  const gLoad = Math.min(1, game.gForce / GRAVITY_FULL_SCALE)
  drawBarGauge(ctx, theme, {
    x: 28, y: 78, width: 152, height: 13,
    value: gLoad,
    label: 'GRAV', showValue: false,
    color: gLoad > 0.66 ? palette.danger.core : palette.primary.core
  })

  ctx.save()
  ctx.font = canvasFont('data', 11)
  ctx.textAlign = 'right'
  ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.9))
  ctx.fillText(`${game.speed.toFixed(0)}`, 236, 63)
  ctx.fillStyle = rgbaToCss(withAlpha(
    gLoad > 0.66 ? palette.danger.core : palette.primary.core, 0.9))
  ctx.fillText(`${game.gForce.toFixed(0)}`, 236, 89)
  ctx.restore()

  // ── Right: craft remaining ──
  drawPanel(ctx, theme, {
    x: DESIGN_WIDTH - 200, y: 14, width: 184, height: 78,
    title: 'CRAFT', cornerSize: 10, bgOpacity: 0.05
  })

  for (let i = 0; i < 3; i++) {
    const filled = i < game.lives
    drawIcon(
      ctx, 'craft',
      DESIGN_WIDTH - 152 + i * 44, 62, 30,
      withAlpha(filled ? palette.secondary.core : palette.primary.dim, filled ? 0.95 : 0.22)
    )
  }

  if (game.nearestHoleDanger > 0.02) drawCaptureWarning(ctx, game)
}

// Fires when the craft crosses inside the radius where its own thrust can no
// longer beat the pull. At that point it is not a difficulty spike, it is a
// statement of fact, so the warning says so.
function drawCaptureWarning (ctx, game) {
  const d = game.nearestHoleDanger
  const pulse = 0.45 + Math.sin(game.elapsed * 9) * 0.3

  ctx.save()
  ctx.globalAlpha = Math.min(1, d * 1.6)
  ctx.font = canvasFont('heading', 15)
  ctx.textAlign = 'center'
  ctx.fillStyle = rgbaToCss(withAlpha(palette.danger.core, pulse))
  ctx.shadowColor = rgbaToCss(palette.danger.glow)
  ctx.shadowBlur = 14
  ctx.fillText('GRAVITY EXCEEDS THRUST', DESIGN_WIDTH / 2, 44)

  // Vignette that closes in as capture becomes certain.
  ctx.globalAlpha = 1
  const g = ctx.createRadialGradient(
    DESIGN_WIDTH / 2, 360, 200 * (1 - d * 0.55),
    DESIGN_WIDTH / 2, 360, 760
  )
  g.addColorStop(0, rgbaToCss(withAlpha(palette.danger.core, 0)))
  g.addColorStop(1, rgbaToCss(withAlpha(palette.danger.core, 0.20 * d)))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, DESIGN_WIDTH, 720)
  ctx.restore()
}

/** Retained for tooling and the balance simulator; the HUD shows no clock. */
export function formatTime (seconds) {
  const s = Math.floor(seconds)
  const cs = Math.floor((seconds - s) * 100)
  return `${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
