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
const TRAIL_POINTS = 14

export class Asteroid {
  constructor (rng, holes) {
    this.rng = rng
    this.verts = []
    this.inner = []
    this.rimShade = []
    this.capShade = []
    this.litIndex = 0
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
    this.radius = randRange(rng, 4.9, 9.8)
    this.spin = randRange(rng, 0, Math.PI * 2)
    this.spinRate = randRange(rng, -1.4, 1.4)
    // A recycled rock must not drag its old trail across the board.
    this.trail.length = 0
    this.trailClock = 0

    // Silhouette and surface.
    //
    // The body is built as two rings rather than one outline: an outer hull and
    // an inner ring pulled in toward the middle. Triangulating between them
    // gives a rim band of faces around a raised cap, which is what produces a
    // visible shoulder -- the thing that makes a rock look like a solid with
    // volume instead of a flat plate with a gradient on it.
    //
    // The outer ring uses three scales of variation: a low-frequency lobe term
    // for broad irregular mass, per-vertex noise for the chipped edge, and
    // occasional notches where a chunk is missing.
    const n = 14 + Math.floor(rng() * 4)
    const lobes = 2 + Math.floor(rng() * 3)
    const lobePhase = randRange(rng, 0, Math.PI * 2)
    const lobeDepth = randRange(rng, 0.09, 0.19)

    this.verts = []
    this.inner = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + randRange(rng, -0.13, 0.13)
      const lobe = 1 + Math.sin(a * lobes + lobePhase) * lobeDepth
      const notch = rng() < 0.12 ? randRange(rng, 0.66, 0.80) : 1
      const r = this.radius * lobe * notch * randRange(rng, 0.84, 1.12)
      this.verts.push({ a, r })
      // The inner ring gets its own angular jitter so the shoulder is not a
      // scaled copy of the hull; a concentric copy reads as a target.
      this.inner.push({
        a: a + randRange(rng, -0.16, 0.16),
        r: r * randRange(rng, 0.44, 0.66)
      })
    }

    // Lighting. Fixed at spawn so a rock's faces stay consistent as it tumbles.
    // The rim faces take the strongest contrast because they are the ones
    // turning away from the light; the cap sits flatter and varies less.
    const LX = -0.55
    const LY = -0.83
    const shadeFor = (v0, v1, contrast, base) => {
      const mx = (Math.cos(v0.a) * v0.r + Math.cos(v1.a) * v1.r) / 2
      const my = (Math.sin(v0.a) * v0.r + Math.sin(v1.a) * v1.r) / 2
      const ml = Math.hypot(mx, my) || 1
      const lit = (mx / ml) * LX + (my / ml) * LY
      // Floor the dark side well above black: on a black field a face that
      // goes to zero stops being a shadowed facet and becomes a hole in the
      // rock, and the silhouette breaks up.
      return Math.max(0.26, Math.min(1, base + lit * contrast + randRange(rng, -0.07, 0.07)))
    }

    this.rimShade = []
    this.capShade = []
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      this.rimShade.push(shadeFor(this.verts[i], this.verts[j], 0.42, 0.54))
      this.capShade.push(shadeFor(this.inner[i], this.inner[j], 0.26, 0.78))
    }

    // Which hull vertex faces most directly into the light, for the specular
    // edge the renderer draws along the lit shoulder.
    let bestDot = -2
    this.litIndex = 0
    for (let i = 0; i < n; i++) {
      const v = this.verts[i]
      const d = Math.cos(v.a) * LX + Math.sin(v.a) * LY
      if (d > bestDot) { bestDot = d; this.litIndex = i }
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
