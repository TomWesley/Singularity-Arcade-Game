// What is left of the HUD: ships remaining, and the warning that fires once the
// field has beaten the engine.
//
// The velocity and gravity gauges are gone. They were the last numeric readout
// of a thing the player is meant to feel -- how hard the pull is right now --
// and a bar climbing in the corner answers that question so you do not have to
// learn it. What remains is indirect: the aura, the craft going soft on the
// cursor, and the banner once it is already too late.

import {
  theme, palette, drawPanel, drawIcon,
  canvasFont, rgbaToCss, withAlpha
} from './theme.js'
import { DESIGN_WIDTH } from '../core/viewport.js'

export function drawHud (ctx, game) {
  // ── Right: ships remaining ──
  drawPanel(ctx, theme, {
    x: DESIGN_WIDTH - 246, y: 14, width: 230, height: 78,
    title: 'SHIPS REMAINING', cornerSize: 10, bgOpacity: 0.05
  })

  // A diamond reads as a token rather than a picture of the thing it counts --
  // the panel title already says what is being counted, and repeating it in the
  // icon just competes with the actual ship on the board.
  for (let i = 0; i < 3; i++) {
    const filled = i < game.lives
    drawIcon(
      ctx, 'diamond',
      DESIGN_WIDTH - 186 + i * 46, 62, 26,
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
