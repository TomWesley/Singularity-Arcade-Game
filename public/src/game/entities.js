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

// How often a position is recorded for the tail, and how many are kept. A fixed
// time step means the trail's length in pixels is automatically proportional to
// speed -- and because it records where the rock has actually been, the tail
// bends around a gravity well exactly as the trajectory does.
export const TRAIL_INTERVAL = 1 / 45
const TRAIL_POINTS = 46

export class Asteroid {
  constructor (rng, holes) {
    this.rng = rng
    this.verts = []
    this.facetOrigin = { x: 0, y: 0 }
    this.faceShade = []
    this.spin = 0
    this.spinRate = 0
    this.radius = 0
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.trail = []        // newest first
    this.trailClock = 0
    this.reset(holes, true)
  }

  // Spawns off the right edge heading left, avoiding a birth inside a hole.
  reset (holes, initial = false) {
    const rng = this.rng
    this.radius = randRange(rng, 7, 14)
    this.spin = randRange(rng, 0, Math.PI * 2)
    this.spinRate = randRange(rng, -1.4, 1.4)
    // A recycled rock must not drag its old trail across the board.
    this.trail.length = 0
    this.trailClock = 0

    // Silhouette. Three scales of variation, because any one alone fails: a
    // low-frequency lobe term for broad irregular mass, per-vertex noise for the
    // chipped edge, and occasional deep notches where a chunk has been knocked
    // out. Gentle noise on many vertices just yields a pebble; few vertices
    // yields a trapezoid.
    const n = 13 + Math.floor(rng() * 4)
    const lobes = 2 + Math.floor(rng() * 3)
    const lobePhase = randRange(rng, 0, Math.PI * 2)
    const lobeDepth = randRange(rng, 0.09, 0.19)
    this.verts = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + randRange(rng, -0.13, 0.13)
      const lobe = 1 + Math.sin(a * lobes + lobePhase) * lobeDepth
      const notch = rng() < 0.12 ? randRange(rng, 0.66, 0.80) : 1
      this.verts.push({
        a,
        r: this.radius * lobe * notch * randRange(rng, 0.84, 1.12)
      })
    }

    // Facet centre: an off-axis interior point. Fanning triangles from it to
    // each hull edge turns the rock into a set of flat faces, which is what
    // makes it read as a broken mineral body rather than a filled outline.
    const fa = randRange(rng, 0, Math.PI * 2)
    const fd = this.radius * randRange(rng, 0.20, 0.42)
    this.facetOrigin = { x: Math.cos(fa) * fd, y: Math.sin(fa) * fd }

    // Per-face shading, fixed at spawn so a rock's faces stay consistent as it
    // tumbles. Lit from up-left, with a little per-face grain on top.
    this.faceShade = []
    for (let i = 0; i < n; i++) {
      const v0 = this.verts[i]
      const v1 = this.verts[(i + 1) % n]
      const mx = (Math.cos(v0.a) * v0.r + Math.cos(v1.a) * v1.r) / 2
      const my = (Math.sin(v0.a) * v0.r + Math.sin(v1.a) * v1.r) / 2
      const ml = Math.hypot(mx, my) || 1
      const lit = (mx / ml) * -0.55 + (my / ml) * -0.83   // light from up-left
      this.faceShade.push(Math.max(0.16, Math.min(1, 0.52 + lit * 0.42 + randRange(rng, -0.09, 0.09))))
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

    this.trailClock += dt
    if (this.trailClock >= TRAIL_INTERVAL) {
      this.trailClock -= TRAIL_INTERVAL
      this.trail.unshift({ x: this.x, y: this.y })
      if (this.trail.length > TRAIL_POINTS) this.trail.pop()
    }

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
