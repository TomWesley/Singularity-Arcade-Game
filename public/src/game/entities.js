// Simulation entities. Rendering lives in src/render -- these carry state and
// the rules that move it, nothing about how any of it looks.

import { blackHoleGeometry, gravityAt, integrate } from './physics.js'
import { makeRng, randRange } from '../core/rng.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

export class BlackHole {
  /**
   * @param {object} spec level JSON entry, coordinates normalised 0..1
   */
  constructor (spec) {
    this.homeX = spec.x * DESIGN_WIDTH
    this.homeY = spec.y * DESIGN_HEIGHT

    // A level authors a hole by its mass alone. Horizon, photon sphere and
    // ISCO all fall out of that mass and the real constants -- there is no
    // hand-placed radius to disagree with the physics.
    this.solarMasses = spec.solarMasses
    const geo = blackHoleGeometry(spec.solarMasses)
    this.mu = geo.mu
    this.horizon = geo.horizon
    this.photonSphere = geo.photonSphere
    this.isco = geo.isco
    this.marginallyBound = geo.marginallyBound
    // Kept as `radius` too, since that is what collision and layout code reads.
    this.radius = geo.horizon

    this.orbit = spec.orbit
      ? {
          radius: spec.orbit.radius * DESIGN_HEIGHT,
          period: spec.orbit.period,
          phase: spec.orbit.phase ?? 0
        }
      : null

    this.x = this.homeX
    this.y = this.homeY
    this.spin = 0
    this.diskPhase = randRange(makeRng(Math.round(this.homeX * 31 + this.homeY)), 0, Math.PI * 2)
  }

  update (dt, elapsed) {
    if (this.orbit) {
      const a = this.orbit.phase + (elapsed / this.orbit.period) * Math.PI * 2
      this.x = this.homeX + Math.cos(a) * this.orbit.radius
      this.y = this.homeY + Math.sin(a) * this.orbit.radius
    }
    // Accretion disks rotate faster on smaller holes, as they should.
    this.spin += dt * (0.9 + 40 / this.horizon)
  }

  contains (x, y) {
    return Math.hypot(x - this.x, y - this.y) < this.horizon
  }
}

export class Asteroid {
  constructor (rng, holes) {
    this.rng = rng
    this.verts = []
    this.spin = 0
    this.spinRate = 0
    this.radius = 0
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.reset(holes, true)
  }

  // Spawns off the right edge heading left, avoiding a birth inside a hole.
  reset (holes, initial = false) {
    const rng = this.rng
    this.radius = randRange(rng, 5, 11)
    this.spin = randRange(rng, 0, Math.PI * 2)
    this.spinRate = randRange(rng, -1.4, 1.4)

    // Angular silhouette -- a few radii perturbed around a circle.
    const n = 7 + Math.floor(rng() * 3)
    this.verts = []
    for (let i = 0; i < n; i++) {
      this.verts.push({
        a: (i / n) * Math.PI * 2,
        r: this.radius * randRange(rng, 0.72, 1.28)
      })
    }

    for (let attempt = 0; attempt < 12; attempt++) {
      this.x = initial && attempt === 0
        ? randRange(rng, DESIGN_WIDTH * 0.35, DESIGN_WIDTH)
        : DESIGN_WIDTH + randRange(rng, 20, 220)
      this.y = randRange(rng, -40, DESIGN_HEIGHT + 40)
      if (!holes.some(h => Math.hypot(this.x - h.x, this.y - h.y) < h.isco)) break
    }

    this.vx = randRange(rng, -190, -70)
    this.vy = randRange(rng, -45, 45)
  }

  update (dt, holes, accel) {
    // Asteroids obey exactly the same gravity field as the player -- that is
    // what makes them curve into slingshots around the holes rather than
    // travelling in dull straight lines.
    gravityAt(this.x, this.y, holes, accel)
    integrate(this, accel.x, accel.y, dt, 0)
    this.spin += this.spinRate * dt

    const eaten = holes.some(h => Math.hypot(this.x - h.x, this.y - h.y) < h.horizon)
    if (eaten || this.x < -140 || this.y < -160 || this.y > DESIGN_HEIGHT + 160) {
      this.reset(holes)
    }
  }
}

export class Gate {
  constructor (spec) {
    this.x = spec.x * DESIGN_WIDTH
    this.y = spec.y * DESIGN_HEIGHT
    this.width = spec.width * DESIGN_WIDTH
    this.height = spec.height * DESIGN_HEIGHT
  }

  contains (x, y) {
    return Math.abs(x - this.x) < this.width / 2 &&
           Math.abs(y - this.y) < this.height / 2
  }
}
