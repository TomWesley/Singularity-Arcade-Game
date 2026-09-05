// Parallax starfield. The original's warp-streak field was the best-looking
// thing in the 2019 build, so it survives -- rebuilt as three deterministic
// parallax layers that drift rather than a single flat scatter.

import { makeRng, randRange } from '../core/rng.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'
import { palette, rgbaToCss, withAlpha } from './theme.js'

const LAYERS = [
  { count: 90, speed: 2.5, size: [0.5, 1.1], alpha: 0.30 },
  { count: 55, speed: 6.5, size: [0.9, 1.7], alpha: 0.45 },
  { count: 26, speed: 14, size: [1.3, 2.4], alpha: 0.65 }
]

export class Starfield {
  constructor (seed = 7) {
    const rng = makeRng(seed)
    this.layers = LAYERS.map(spec => ({
      spec,
      stars: Array.from({ length: spec.count }, () => ({
        x: randRange(rng, 0, DESIGN_WIDTH),
        y: randRange(rng, 0, DESIGN_HEIGHT),
        r: randRange(rng, spec.size[0], spec.size[1]),
        // A few stars take the tertiary hue so the field is not monochrome.
        warm: rng() > 0.82,
        twinkle: randRange(rng, 0, Math.PI * 2)
      }))
    }))
  }

  update (dt) {
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        s.x -= layer.spec.speed * dt
        if (s.x < -4) {
          s.x = DESIGN_WIDTH + 4
          s.y = Math.random() * DESIGN_HEIGHT
        }
      }
    }
  }

  draw (ctx, time) {
    const cool = palette.tertiary.core
    const warm = palette.secondary.core

    for (const layer of this.layers) {
      for (const s of layer.stars) {
        const tw = 0.75 + Math.sin(time * 1.6 + s.twinkle) * 0.25
        const a = layer.spec.alpha * tw
        ctx.fillStyle = rgbaToCss(withAlpha(s.warm ? warm : cool, a))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}
