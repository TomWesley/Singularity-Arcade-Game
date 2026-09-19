// What is left of the HUD: ships remaining, and the warning that fires once the
// field has beaten the engine.
//
// Lives are a row of the actual ship you are flying, bottom left, the way an
// arcade cabinet has always done it. A panel with a title and a row of abstract
// tokens was three pieces of furniture doing what three small silhouettes do on
// their own, and the silhouettes carry information the tokens never did -- you
// can see at a glance which hull you picked.
//
// The velocity and gravity gauges are gone. They were the last numeric readout
// of a thing the player is meant to feel -- how hard the pull is right now --
// and a bar climbing in the corner answers that question so you do not have to
// learn it. What remains is indirect: the aura, the craft going soft on the
// cursor, and the banner once it is already too late.

import { palette, canvasFont, rgbaToCss, withAlpha } from './theme.js'
import { drawCraft } from './craft.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

// Icon size relative to the selection-card art, and how far apart they sit.
const SHIP_SCALE = 0.4
const SHIP_GAP = 42

export function drawHud (ctx, game) {
  drawShipsRemaining(ctx, game)

  if (game.nearestHoleDanger > 0.02) drawCaptureWarning(ctx, game)
}

function drawShipsRemaining (ctx, game) {
  const craft = game.craft
  const scale = craft.cardScale * SHIP_SCALE
  const y = DESIGN_HEIGHT - 38

  for (let i = 0; i < game.lives; i++) {
    // Nose-up and engines cold: these are ships on the shelf, not in flight.
    drawCraft(ctx, craft.id, 34 + i * SHIP_GAP, y, -Math.PI / 2, 0, 0, scale)
  }
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
