// Starfield.
//
// A real night sky is not an even scatter of same-sized dots. It is mostly very
// faint stars with a handful of bright ones, it is white rather than tinted, and
// the bright ones have visible structure. The previous field was three layers of
// uniform pale-blue and pale-gold squares at fixed alpha, which read as static
// rather than as sky.
//
// So: brightness follows a power law, so most stars sit near the threshold of
// visibility and a few carry the field. Colour is white with only a whisper of
// warm or cool on a minority -- real stellar colours are far less saturated than
// they are usually drawn. Each star twinkles on its own phase and rate. The
// brightest dozen get a faint diffraction cross, which is what actually makes a
// bright star read as bright rather than just large.
//
// Positions are rounded at draw time. A 1px dot on a half-pixel boundary is
// antialiased across two columns and turns to mush; rounding keeps them crisp.

import { makeRng, randRange } from '../core/rng.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

const LAYERS = [
  { count: 260, speed: 1.4, maxSize: 1 },
  { count: 115, speed: 4.0, maxSize: 1 },
  { count: 40, speed: 9.5, maxSize: 2 }
]

const WHITE = [255, 255, 255]
const WARM = [255, 240, 218]
const COOL = [214, 230, 255]

const SPIKE_THRESHOLD = 0.8

export class Starfield {
  constructor (seed = 7) {
    const rng = makeRng(seed)
    this.stars = []

    for (const spec of LAYERS) {
      for (let i = 0; i < spec.count; i++) {
        // Power law: most stars faint, a few carrying the field. Cubing the
        // draw was too aggressive -- it pushed nearly everything below the
        // threshold of visibility and the sky came out empty. A gentler
        // exponent over a higher floor keeps the distribution while leaving the
        // faint majority actually visible.
        const u = rng()
        const brightness = 0.26 + 0.74 * Math.pow(u, 2.1)
        const c = rng()
        this.stars.push({
          x: randRange(rng, 0, DESIGN_WIDTH),
          y: randRange(rng, 0, DESIGN_HEIGHT),
          speed: spec.speed,
          size: brightness > 0.7 ? spec.maxSize : 1,
          brightness,
          tint: c < 0.14 ? WARM : c < 0.28 ? COOL : WHITE,
          // Individual phase and rate, so nothing pulses in unison.
          phase: randRange(rng, 0, Math.PI * 2),
          rate: randRange(rng, 0.7, 2.6),
          depth: randRange(rng, 0.72, 1)
        })
      }
    }
    this.rng = rng
  }

  update (dt) {
    for (const s of this.stars) {
      s.x -= s.speed * dt
      if (s.x < -3) {
        s.x = DESIGN_WIDTH + 3
        s.y = this.rng() * DESIGN_HEIGHT
      }
    }
  }

  draw (ctx, time) {
    for (const s of this.stars) {
      // Faint stars shimmer proportionally more than bright ones, which is both
      // true of real seeing and stops the bright ones flickering distractingly.
      const swing = 0.34 * (1 - s.brightness * 0.7)
      const a = s.brightness * s.depth * (1 - swing + swing * Math.sin(time * s.rate + s.phase))
      if (a < 0.03) continue

      const x = Math.round(s.x)
      const y = Math.round(s.y)
      const t = s.tint
      ctx.fillStyle = `rgba(${t[0]}, ${t[1]}, ${t[2]}, ${a.toFixed(3)})`
      ctx.fillRect(x, y, s.size, s.size)

      // Diffraction cross on the brightest few. One pixel wide, a few long, at a
      // fraction of the core's brightness -- any more and it reads as a sparkle
      // effect rather than a star.
      if (s.brightness > SPIKE_THRESHOLD) {
        const len = 2 + Math.round(s.brightness * 2)
        ctx.fillStyle = `rgba(${t[0]}, ${t[1]}, ${t[2]}, ${(a * 0.32).toFixed(3)})`
        ctx.fillRect(x - len, y, len * 2 + s.size, 1)
        ctx.fillRect(x, y - len, 1, len * 2 + s.size)
      }
    }
  }
}
