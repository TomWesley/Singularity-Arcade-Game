// Installs the Arcade Graphics Engine into SINGULARITY.
//
// The engine is vendored as a self-contained ESM bundle (public/vendor/...) and
// imported with native browser modules -- no bundler, and it survives the
// /singularity/ subpath deploy unchanged. Re-vendor with `npm run vendor:engine`.
//
// Palette: gold primary, because that is the colour this game has always been
// -- the 2019 title and HUD were pure yellow on black, and the board should read
// the same way. Amber secondary, a cool pale blue for stars and debris, red for
// capture warnings. The field itself is pure black; the black holes are drawn in
// white and take no palette colour at all.

import {
  ThemeProvider,
  drawPanel, drawBarGauge, drawIcon,
  drawScanLines, drawCornerFlourish,
  applyType, canvasFont, typeCase,
  rgbaToCss, withAlpha, approach,
  setupHiDPICanvas
} from '../../vendor/arcade-graphics-engine/index.js'

export const provider = ThemeProvider.custom('SINGULARITY', 48, 36, 205, 352)
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

// Canvas text does not trigger webfont loading the way DOM text does: setting
// ctx.font to a face the browser has not already fetched silently falls back,
// with no error and no reflow to correct it later. injectCSS() adds the
// stylesheet, but nothing on this page is DOM text, so only the weights that
// happen to be requested elsewhere would ever arrive. Every weight the game
// draws with has to be asked for explicitly, and awaited before the first frame.
const REQUIRED_FACES = [
  '900 56px Orbitron',
  '700 26px Orbitron',
  '600 13px Orbitron',
  '600 14px Rajdhani',
  '400 15px Rajdhani',
  '400 13px "Share Tech Mono"'
]

export async function ensureFonts () {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all(REQUIRED_FACES.map(f => document.fonts.load(f).catch(() => {})))
  try { await document.fonts.ready } catch { /* not fatal */ }
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
