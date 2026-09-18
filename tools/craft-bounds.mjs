// Measures what each hull actually occupies on screen, by drawing it into a
// context that records coordinates instead of pixels. Hitboxes and art scales
// should follow the art rather than be guessed at.
//
//   node tools/craft-bounds.mjs

import { CRAFTS } from '../public/src/game/crafts.js'

globalThis.document = { createElement: () => ({ getContext: () => stub }) }

let minX, maxX, minY, maxY
const track = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  if (x < minX) minX = x; if (x > maxX) maxX = x
  if (y < minY) minY = y; if (y > maxY) maxY = y
}

// Only the path-building calls describe geometry; gradients and styles do not.
const POINTS = { moveTo: 1, lineTo: 1, rect: 2, arc: 3, ellipse: 4, quadraticCurveTo: 2, bezierCurveTo: 3 }

const stub = new Proxy({}, {
  get (_, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
      return () => ({ addColorStop () {} })
    }
    if (prop === 'measureText') return () => ({ width: 0 })
    if (typeof prop === 'symbol') return undefined
    return (...a) => {
      const kind = POINTS[prop]
      if (kind === 1) track(a[0], a[1])
      else if (kind === 2) { track(a[0], a[1]); track(a[0] + a[2], a[1] + a[3]) }
      else if (kind === 3) { track(a[0] - a[2], a[1] - a[2]); track(a[0] + a[2], a[1] + a[2]) }
      else if (kind === 4) { track(a[0] - a[2], a[1] - a[3]); track(a[0] + a[2], a[1] + a[3]) }
      else if (kind === 2 && prop === 'quadraticCurveTo') { track(a[0], a[1]); track(a[2], a[3]) }
      else if (prop === 'bezierCurveTo') { track(a[0], a[1]); track(a[2], a[3]); track(a[4], a[5]) }
      else if (prop === 'quadraticCurveTo') { track(a[0], a[1]); track(a[2], a[3]) }
      return undefined
    }
  },
  set () { return true }
})

const { drawCraft } = await import('../public/src/render/craft.js')

console.log('hull            natural  on-screen   half-w  half-h   artScale  hull(set)')
for (const c of CRAFTS) {
  minX = minY = Infinity; maxX = maxY = -Infinity
  drawCraft(stub, c.id, 0, 0, -Math.PI / 2, 0, 0, 1)   // unrotated, unscaled, engines cold
  const hw = Math.max(Math.abs(minX), Math.abs(maxX))
  const hh = Math.max(Math.abs(minY), Math.abs(maxY))
  const natural = Math.sqrt(hw * hh)
  const onScreen = natural * c.artScale
  console.log(
    `${c.name.padEnd(16)}${natural.toFixed(1).padEnd(9)}${onScreen.toFixed(1).padEnd(12)}` +
    `${(hw * c.artScale).toFixed(1).padEnd(8)}${(hh * c.artScale).toFixed(1).padEnd(9)}` +
    `${String(c.artScale).padEnd(10)}${c.hull}`)
}
