// Installs the Arcade Graphics Engine into SINGULARITY.
//
// The engine is vendored as a self-contained ESM bundle (public/vendor/...) and
// imported with native browser modules -- no bundler, and it survives the
// /singularity/ subpath deploy unchanged. Re-vendor with `npm run vendor:engine`.
//
// Palette: violet primary carries the chrome and the void; the original game's
// signature gold survives as the secondary, which is where it always lived
// best -- the title, the gate, and the hot inner edge of an accretion disk.
// Cyan is the starfield, and the danger red is reserved for capture warnings.

import {
  ThemeProvider,
  drawPanel, drawBarGauge, drawIcon,
  drawScanLines, drawCornerFlourish,
  applyType, canvasFont, typeCase,
  rgbaToCss, withAlpha, approach,
  setupHiDPICanvas
} from '../../vendor/arcade-graphics-engine/index.js'

export const provider = ThemeProvider.custom('SINGULARITY', 272, 46, 196, 350)
export const palette = provider.palette
export const theme = provider.theme

// Shorthands for the two colours used on nearly every draw call.
export const pc = (a = 1) => rgbaToCss(withAlpha(palette.primary.core, a))
export const sc = (a = 1) => rgbaToCss(withAlpha(palette.secondary.core, a))
export const tc = (a = 1) => rgbaToCss(withAlpha(palette.tertiary.core, a))
export const dc = (a = 1) => rgbaToCss(withAlpha(palette.danger.core, a))

let injected = false
export function initTheme () {
  if (injected || typeof document === 'undefined') return
  provider.injectCSS()
  document.body.classList.add('arcade-theme')
  injected = true
}

/** Stroke with a glow, the house look for every line in the game. */
export function glowStroke (ctx, color, blur, width, drawPath) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  drawPath()
  ctx.stroke()
  ctx.restore()
}

export {
  drawPanel, drawBarGauge, drawIcon, drawScanLines, drawCornerFlourish,
  applyType, canvasFont, typeCase, rgbaToCss, withAlpha, approach, setupHiDPICanvas
}
