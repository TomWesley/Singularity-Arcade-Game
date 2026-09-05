// Gravitational field overlay.
//
// A sparse lattice of probes, each drawn as a short segment pointing along the
// local acceleration vector with length and opacity scaled by its magnitude.
// This is the same gravityAt() the craft flies through, sampled on a grid --
// so the picture is not an impression of the field, it is the field.
//
// It also does real work for the player: the lattice leans toward danger long
// before the danger is close enough to see.

import { gravityAt } from '../game/physics.js'
import { palette, rgbaToCss, withAlpha } from './theme.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

const SPACING = 64
const MAX_LEN = 15
// Accelerations span several orders of magnitude across the board, so the
// visual length is scaled by a root rather than linearly -- otherwise every
// probe is either invisible or clipped.
const REFERENCE_ACCEL = 900

let probes = null

function buildProbes () {
  const out = []
  for (let x = SPACING / 2; x < DESIGN_WIDTH; x += SPACING) {
    for (let y = SPACING / 2; y < DESIGN_HEIGHT; y += SPACING) {
      out.push({ x, y })
    }
  }
  return out
}

const accel = { x: 0, y: 0 }

export function drawGravityField (ctx, holes, time) {
  if (!probes) probes = buildProbes()

  ctx.save()
  ctx.lineCap = 'round'

  for (const p of probes) {
    gravityAt(p.x, p.y, holes, accel)
    const mag = Math.hypot(accel.x, accel.y)
    if (mag < 4) continue

    const norm = Math.min(1, Math.sqrt(mag / REFERENCE_ACCEL))
    const len = 3 + norm * MAX_LEN
    const ux = accel.x / mag
    const uy = accel.y / mag

    // Colour shifts from primary toward danger as the field gets fierce.
    const color = norm > 0.72 ? palette.danger.core : palette.primary.core
    const alpha = 0.06 + norm * 0.34

    ctx.strokeStyle = rgbaToCss(withAlpha(color, alpha))
    ctx.lineWidth = 0.6 + norm * 1.1
    ctx.beginPath()
    ctx.moveTo(p.x - ux * len * 0.5, p.y - uy * len * 0.5)
    ctx.lineTo(p.x + ux * len * 0.5, p.y + uy * len * 0.5)
    ctx.stroke()

    // A dot at the leading end so direction is unambiguous.
    if (norm > 0.28) {
      ctx.fillStyle = rgbaToCss(withAlpha(color, alpha * 1.5))
      ctx.beginPath()
      ctx.arc(p.x + ux * len * 0.5, p.y + uy * len * 0.5, 0.9 + norm, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}
