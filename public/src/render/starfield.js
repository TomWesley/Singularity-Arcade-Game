// Starfield.
//
// 2001's stars are hard white points on absolute black, not soft glowing discs.
// So these are single-pixel-ish rects, no arcs, no per-star gradients, no
// twinkle: three parallax layers that drift and otherwise hold perfectly still.
// Stillness is most of what makes the black feel deep.

import { makeRng, randRange } from '../core/rng.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'
import { palette, rgbaToCss, withAlpha } from './theme.js'

const LAYERS = [
  { count: 70, speed: 1.6, size: 1, alpha: 0.34 },
  { count: 40, speed: 4.5, size: 1.6, alpha: 0.55 },
  { count: 16, speed: 10, size: 2.2, alpha: 0.85 }
]

export class Starfield {
  constructor (seed = 7) {
    const rng = makeRng(seed)
    this.layers = LAYERS.map(spec => ({
      spec,
      warm: [],
      cool: []
    }))
    this.layers.forEach((layer, li) => {
      for (let i = 0; i < LAYERS[li].count; i++) {
        const star = {
          x: randRange(rng, 0, DESIGN_WIDTH),
          y: randRange(rng, 0, DESIGN_HEIGHT)
        }
        // A handful take the warm hue; the rest are plain white-cool. Splitting
        // them up front means two fillStyle changes per layer instead of one
        // per star.
        ;(rng() > 0.86 ? layer.warm : layer.cool).push(star)
      }
    })
    this.rng = rng
  }

  update (dt) {
    for (const layer of this.layers) {
      for (const list of [layer.cool, layer.warm]) {
        for (const s of list) {
          s.x -= layer.spec.speed * dt
          if (s.x < -3) {
            s.x = DESIGN_WIDTH + 3
            s.y = this.rng() * DESIGN_HEIGHT
          }
        }
      }
    }
  }

  draw (ctx) {
    for (const layer of this.layers) {
      const { size, alpha } = layer.spec
      ctx.fillStyle = rgbaToCss(withAlpha(palette.tertiary.core, alpha))
      for (const s of layer.cool) ctx.fillRect(s.x, s.y, size, size)
      ctx.fillStyle = rgbaToCss(withAlpha(palette.secondary.core, alpha))
      for (const s of layer.warm) ctx.fillRect(s.x, s.y, size, size)
    }
  }
}
