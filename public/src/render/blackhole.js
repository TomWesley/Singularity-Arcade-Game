// Black hole rendering.
//
// Every ring drawn here is a real radius the physics already computed, not a
// decorative flourish: the horizon at r_s, the photon sphere at 1.5 r_s, the
// innermost stable circular orbit at 3 r_s, and the craft-specific radius where
// thrust can no longer beat the pull. The instrument reads the simulation --
// which is the point, because a pilot who learns to read these rings is
// learning actual orbital mechanics.

import { palette, rgbaToCss, withAlpha, canvasFont } from './theme.js'
import { escapeLimit } from '../game/physics.js'

const TAU = Math.PI * 2

export function drawBlackHole (ctx, hole, craft, time) {
  const { x, y, horizon, photonSphere, isco } = hole

  ctx.save()

  drawLensing(ctx, x, y, horizon, isco)
  drawIscoRing(ctx, x, y, isco, hole, time)
  if (craft) drawEscapeRing(ctx, x, y, hole, craft, time)
  drawAccretionDisk(ctx, x, y, hole, time)
  drawPhotonSphere(ctx, x, y, photonSphere)
  drawHorizon(ctx, x, y, horizon)

  ctx.restore()
}

// Light bending around the hole reads as a faint bloom that darkens toward the
// centre rather than brightening -- the opposite of a normal glow, because this
// object emits nothing.
function drawLensing (ctx, x, y, horizon, isco) {
  const g = ctx.createRadialGradient(x, y, horizon * 0.9, x, y, isco * 1.15)
  g.addColorStop(0, rgbaToCss(withAlpha(palette.primary.core, 0.16)))
  g.addColorStop(0.35, rgbaToCss(withAlpha(palette.primary.core, 0.07)))
  g.addColorStop(1, rgbaToCss(withAlpha(palette.primary.core, 0)))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, isco * 1.15, 0, TAU)
  ctx.fill()
}

// The ISCO drawn as a surveyor's ring: dashed, with bearing ticks and a label.
// Inside it no circular orbit is stable, which is worth knowing before you fly
// in there.
function drawIscoRing (ctx, x, y, isco, hole, time) {
  ctx.save()
  ctx.strokeStyle = rgbaToCss(withAlpha(palette.primary.core, 0.22))
  ctx.lineWidth = 1
  ctx.setLineDash([5, 9])
  ctx.lineDashOffset = -time * 9
  ctx.beginPath()
  ctx.arc(x, y, isco, 0, TAU)
  ctx.stroke()
  ctx.setLineDash([])

  // Bearing ticks every 30 degrees.
  ctx.strokeStyle = rgbaToCss(withAlpha(palette.primary.core, 0.3))
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU
    const long = i % 3 === 0
    const r0 = isco - (long ? 7 : 4)
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0)
    ctx.lineTo(x + Math.cos(a) * isco, y + Math.sin(a) * isco)
    ctx.stroke()
  }

  if (isco > 70) {
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.5))
    ctx.font = canvasFont('micro', 9)
    ctx.textAlign = 'center'
    ctx.fillText('ISCO', x, y - isco - 7)
    ctx.fillStyle = rgbaToCss(withAlpha(palette.primary.core, 0.32))
    ctx.fillText(`${hole.solarMasses.toFixed(1)} M☉`, x, y + isco + 14)
  }
  ctx.restore()
}

// The radius where this craft's thrust exactly cancels the pull. Crossing it
// means the engine has lost the argument, so it pulses in the danger colour.
function drawEscapeRing (ctx, x, y, hole, craft, time) {
  const r = escapeLimit(hole, craft)
  const pulse = 0.30 + Math.sin(time * 3.2) * 0.10
  ctx.save()
  ctx.strokeStyle = rgbaToCss(withAlpha(palette.danger.core, pulse))
  ctx.lineWidth = 1.25
  ctx.shadowColor = rgbaToCss(withAlpha(palette.danger.glow, 0.5))
  ctx.shadowBlur = 8
  ctx.setLineDash([2, 6])
  ctx.lineDashOffset = time * 14
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.stroke()
  ctx.restore()
}

// Accretion disk: hot gold at the inner edge cooling to violet outward, with
// relativistic beaming -- the side rotating toward the viewer really is
// brighter, so the disk is deliberately asymmetric.
function drawAccretionDisk (ctx, x, y, hole, time) {
  const inner = hole.horizon * 1.18
  const outer = hole.isco * 0.92
  if (outer <= inner) return

  const spin = hole.spin
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(spin * 0.12)

  const bands = 9
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const r = inner + (outer - inner) * t
    // Inner bands are hotter (gold) and tighter; outer are cool violet.
    const color = t < 0.5 ? palette.secondary.core : palette.primary.core
    const heat = 1 - t
    const baseAlpha = 0.05 + heat * 0.30

    // Doppler beaming: brighten the approaching limb.
    const segments = 46
    ctx.lineWidth = 1 + heat * 1.8
    for (let s = 0; s < segments; s++) {
      const a0 = (s / segments) * TAU
      const a1 = ((s + 1) / segments) * TAU
      const beam = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a0 + Math.PI / 2))
      const alpha = baseAlpha * beam
      if (alpha < 0.012) continue
      ctx.strokeStyle = rgbaToCss(withAlpha(color, alpha))
      ctx.shadowColor = rgbaToCss(withAlpha(color, alpha * 0.8))
      ctx.shadowBlur = 6 * heat
      ctx.beginPath()
      // Slight ellipse so the disk reads as tilted, not face-on.
      ctx.ellipse(0, 0, r, r * 0.82, 0, a0, a1)
      ctx.stroke()
    }
  }
  ctx.restore()
}

// Where light itself orbits. A single bright hairline -- the brightest thing
// on the object, because in reality it is.
function drawPhotonSphere (ctx, x, y, r) {
  ctx.save()
  ctx.strokeStyle = rgbaToCss(withAlpha(palette.secondary.core, 0.85))
  ctx.lineWidth = 1.4
  ctx.shadowColor = rgbaToCss(palette.secondary.glow)
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.stroke()
  ctx.restore()
}

// The horizon itself: not a dark circle but an absence. Punched out to a black
// that is deeper than the background field, with a hard rim so it reads as an
// edge rather than a smudge.
function drawHorizon (ctx, x, y, r) {
  ctx.save()
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r)
  g.addColorStop(0, '#000000')
  g.addColorStop(0.82, '#000000')
  g.addColorStop(1, rgbaToCss(withAlpha(palette.primary.dim, 0.55)))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()

  ctx.strokeStyle = rgbaToCss(withAlpha(palette.primary.core, 0.5))
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.stroke()
  ctx.restore()
}
