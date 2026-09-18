// Simulation entities. Rendering lives in src/render -- these carry state and
// the rules that move it, nothing about how any of it looks.

import { blackHoleGeometry, gravityAt, integrate, apoapsisSpeed, SYSTEM_SPEED_LIMIT } from './physics.js'
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

// How far past the board a rock may travel before it counts as gone rather than
// mid-orbit, and how long it may stay out there.
const ORBIT_MARGIN = 900
const OFF_BOARD_GRACE = 22

export class Asteroid {
  /**
   * @param orbiter when true the rock is seeded onto a near-circular orbit
   *   around a hole that sits well inside the board, instead of drifting in
   *   from off-screen.
   *
   *   This is honest about what it is: the rock is placed on an orbit rather
   *   than captured into one. Capture is the part that cannot happen -- a
   *   two-body gravitational encounter conserves specific orbital energy, so
   *   anything arriving unbound leaves unbound, and nothing in a clean field
   *   will ever settle by itself. What follows the seeding is entirely real
   *   though: the orbit is integrated through the same field as everything
   *   else, perturbed by the other holes, and free to precess, decay or be
   *   flung out.
   */
  constructor (rng, holes, orbiter = false, speedScale = 1) {
    this.orbiter = orbiter
    this.speedScale = speedScale
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
    this.age = 0
    this.offBoardFor = 0
    // Inactive rocks are neither simulated nor drawn. The field is emptied
    // between lives so a run always opens on a clear board.
    this.active = true
    this.reset(holes, true)
  }

  // Spawns from above the top edge or below the bottom edge, always off-screen.
  //
  // Two rules drive this. Nothing may appear inside the board -- debris blinking
  // into existence in front of the player is not a hazard, it is a cheat. And
  // nothing arrives from the right, because the gate sits on the right edge and
  // a rock entering there closes on a player who is looking the other way at the
  // exact moment they have committed to the run. Coming down from above or up
  // from below, everything is visible for the length of its approach.
  reset (holes, initial = false) {
    const rng = this.rng
    this.radius = randRange(rng, 3.4, 6.9)
    this.spin = randRange(rng, 0, Math.PI * 2)
    this.spinRate = randRange(rng, -1.4, 1.4)
    this.trail.length = 0
    this.trailClock = 0
    this.age = 0
    this.offBoardFor = 0

    this.buildBody(rng)

    // Entry point: off the top or the bottom, anywhere across a span a little
    // wider than the board so rocks also drift in from the upper corners.
    const fromTop = rng() > 0.5
    this.x = randRange(rng, -DESIGN_WIDTH * 0.08, DESIGN_WIDTH * 1.08)
    this.y = fromTop
      ? -randRange(rng, 60, 240)
      : DESIGN_HEIGHT + randRange(rng, 60, 240)

    if (this.orbiter && this.seedBoundEntry(rng, holes, fromTop)) return

    // Ordinary debris: crosses the board, with enough lateral drift that the
    // field does not read as rain.
    const inward = fromTop ? 1 : -1
    const s = this.speedScale
    this.vy = inward * randRange(rng, 55, 150) * s
    this.vx = randRange(rng, -120, 60) * s
  }

  /**
   * Gives this rock an entry velocity that puts it on a bound ellipse around one
   * of the holes, with periapsis inside the board.
   *
   * A hole cannot capture anything on its own -- specific orbital energy is
   * conserved, so a rock arriving unbound leaves unbound, which is why none of
   * them ever settled no matter how many entry angles were tried. Arriving
   * already bound is a different matter, and costs nothing in realism: the rock
   * still enters from off-screen under its own momentum and every step after
   * that is the same integration as the rest of the field.
   *
   * @returns true if a bound entry was found
   */
  seedBoundEntry (rng, holes, fromTop) {
    // Prefer a hole on the half of the board the rock is entering from, so the
    // ellipse actually reaches the well rather than skimming past it.
    const candidates = holes.filter(h =>
      fromTop ? h.homeY < DESIGN_HEIGHT * 0.62 : h.homeY > DESIGN_HEIGHT * 0.38)
    const pool = candidates.length ? candidates : holes
    const host = pool[Math.floor(rng() * pool.length)]

    const dx = host.x - this.x
    const dy = host.y - this.y
    const rApo = Math.hypot(dx, dy)
    if (rApo < host.isco * 1.6) return false

    // Periapsis outside the ISCO, so the rock swings through rather than
    // spiralling straight in on its first pass.
    const rPeri = Math.min(rApo * 0.42, Math.max(host.isco * 1.2, host.isco * randRange(rng, 1.2, 2.4)))
    if (rPeri >= rApo * 0.92) return false

    const v = apoapsisSpeed(host, rApo, rPeri)
    if (!Number.isFinite(v) || v <= 0) return false

    // Purely tangential at apoapsis, direction chosen at random.
    const ux = dx / rApo
    const uy = dy / rApo
    const dir = rng() > 0.5 ? 1 : -1
    this.vx = -uy * v * dir
    this.vy = ux * v * dir
    return true
  }

  /** Generates this rock's silhouette, inner ring and per-face shading. */
  buildBody (rng) {
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
      // rock, and the silhouette breaks up. Red needs a higher floor than the
      // old blue did -- it has far less luminance to spend before it vanishes.
      return Math.max(0.42, Math.min(1, base + lit * contrast + randRange(rng, -0.07, 0.07)))
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
  }

  update (dt, holes, accel) {
    this.age += dt
    // Asteroids obey exactly the same gravity field as the player -- that is
    // what makes them curve into slingshots around the holes rather than
    // travelling in dull straight lines.
    gravityAt(this.x, this.y, holes, accel)
    integrate(this, accel.x, accel.y, dt, 0, SYSTEM_SPEED_LIMIT)
    this.spin += this.spinRate * dt

    this.trailClock += dt
    if (this.trailClock >= TRAIL_INTERVAL) {
      this.trailClock -= TRAIL_INTERVAL
      this.trail.unshift({ x: this.x, y: this.y })
      if (this.trail.length > TRAIL_POINTS) this.trail.pop()
    }

    const eaten = holes.some(h => Math.hypot(this.x - h.x, this.y - h.y) < h.horizon)

    // Generous bounds so a bound orbit can swing wide and come back. The old
    // box (x > -140, y within 160px of the board) destroyed exactly the rocks
    // that were mid-orbit, which is why none were ever seen completing one.
    const wayOut =
      this.x < -ORBIT_MARGIN || this.x > DESIGN_WIDTH + ORBIT_MARGIN ||
      this.y < -ORBIT_MARGIN || this.y > DESIGN_HEIGHT + ORBIT_MARGIN

    // A rock that has been off the board a long time is not orbiting, it has
    // left; recycle it so the field does not slowly empty.
    const onBoard =
      this.x > -40 && this.x < DESIGN_WIDTH + 40 &&
      this.y > -40 && this.y < DESIGN_HEIGHT + 40
    if (onBoard) this.offBoardFor = 0
    else this.offBoardFor += dt

    if (eaten || wayOut || this.offBoardFor > OFF_BOARD_GRACE) {
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
