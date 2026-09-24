// Simulation entities. Rendering lives in src/render -- these carry state and
// the rules that move it, nothing about how any of it looks.

import { blackHoleGeometry, starGeometry, gravityAt, integrate, apoapsisSpeed, circularOrbitSpeed, SYSTEM_SPEED_LIMIT } from './physics.js'
import { makeRng, randRange } from '../core/rng.js'
import { STEP } from '../core/loop.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

export class BlackHole {
  /**
   * @param {object} spec level JSON entry, coordinates normalised 0..1
   */
  constructor (spec, worldWidth = DESIGN_WIDTH) {
    // A body in orbit has no authored position -- bindOrbit() places it from
    // the orbit's own geometry -- so x and y are optional and only the centre
    // of the board is used until then.
    this.homeX = (spec.x ?? 0.5) * worldWidth
    this.homeY = (spec.y ?? 0.5) * DESIGN_HEIGHT

    // A level authors a hole by its mass alone. Horizon, photon sphere and
    // ISCO all fall out of that mass and the real constants -- there is no
    // hand-placed radius to disagree with the physics.
    this.solarMasses = spec.solarMasses
    const geo = blackHoleGeometry(spec.solarMasses)
    this.mu = geo.mu
    this.horizon = geo.horizon
    this.soften = geo.soften
    this.photonSphere = geo.photonSphere
    // How big it looks, and where it kills: 2.598 r_s, not r_s. See physics.js.
    this.shadow = geo.shadow
    this.isco = geo.isco
    this.marginallyBound = geo.marginallyBound
    // Kept as `radius` too, since that is what collision and layout code reads.
    this.radius = geo.horizon

    // Resolved into a velocity once the other bodies exist: bindOrbit() for an
    // ellipse about one host, the ring pair for a rotating central configuration.
    this.orbit = spec.orbit ?? null
    this.ring = spec.ring ?? null
    this.orbitField = null
    // Per body, not shared: stepBodies() reads every field before anything moves.
    this.acc = { x: 0, y: 0 }

    this.x = this.homeX
    this.y = this.homeY
    this.vx = 0
    this.vy = 0
    this.spin = 0
    this.diskPhase = randRange(makeRng(Math.round(this.homeX * 31 + this.homeY)), 0, Math.PI * 2)
  }

  bindOrbit (host) {
    return bindOrbit(this, host)
  }

  // Motion is handled by stepBodies(); this is the rest of the per-tick state.
  update (dt) {
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
const TRAIL_INTERVAL = 1 / 45
const TRAIL_POINTS = 14

// How far clear of the gate's opening debris must enter. Anything closer reads
// as having come out of the gate itself, and that is the one direction a player
// committed to the run cannot dodge.
const GATE_CLEARANCE = 70

// Spread of entry angles either side of the authored deflection, in degrees.
// Without it the whole field arrives on parallel lines and reads as a sheet.
const FAN_DEGREES = 17

// How far past the board a rock may travel before it counts as gone rather than
// mid-orbit, and how long it may stay out there.
const ORBIT_MARGIN = 900
const OFF_BOARD_GRACE = 22

/**
 * Puts a body onto a real bound orbit about `host`, starting at apoapsis.
 *
 * The level authors the *shape* of the orbit -- how far out it swings, how
 * close it comes back, and which way the long axis points -- and the physics
 * supplies the speed. apoapsisSpeed() solves the two conserved quantities of
 * the Paczynski-Wiita potential, specific energy and specific angular momentum,
 * for the one velocity that closes an ellipse between those two radii. There is
 * no period in the level file and no number chosen to look right: how long a
 * lap takes falls out of Kepler's third law, which is why the inner bodies here
 * are visibly quicker than the outer ones without anything saying so.
 *
 * After seeding, the body is integrated rather than animated. It falls through
 * its host's field using the same symplectic step the asteroids and the craft
 * use, so the ellipse is a consequence of the field rather than a curve traced
 * out by a parameter. One thing follows from that which a traced curve could
 * never give: the orbits precess. Only an exact inverse square closes an orbit,
 * and Paczynski-Wiita is not one -- so the long axis rotates a little on every
 * pass, fastest for the bodies that dive deepest. That is the pseudo-Newtonian
 * stand-in for the relativistic perihelion advance, the effect Mercury is
 * famous for, and here it means the four ellipses never quite repeat.
 *
 * One deliberate restriction: an orbiting body feels its host and nothing else.
 * Four mutually attracting stars around a hole is a five-body problem, and
 * five-body problems are chaotic -- the level would not be the same level
 * twice, and a star would eventually be thrown into the player's lap by
 * arithmetic rather than by design. The host outweighs each companion several
 * times over, so the term being dropped is the small one. Every other body on
 * the board -- craft, rock, wreckage -- feels all of them in full.
 *
 * @returns true if a bound orbit was found
 */
function bindOrbit (body, host) {
  const spec = body.orbit
  const rApo = spec.apoapsis * DESIGN_HEIGHT
  const rPeri = (spec.periapsis ?? spec.apoapsis) * DESIGN_HEIGHT
  // Argument of apoapsis, in turns: which way the long axis points. Turns
  // rather than radians so a level file can say 0.5 for "out to the left".
  const arg = (spec.argument ?? 0) * Math.PI * 2
  const dir = spec.direction ?? 1

  const v = rPeri < rApo
    ? apoapsisSpeed(host, rApo, rPeri)
    : circularOrbitSpeed(host, rApo)
  if (!Number.isFinite(v) || v <= 0) return false

  // Apoapsis lies on the long axis, and velocity there is purely tangential --
  // that is what makes it apoapsis.
  body.x = host.x + Math.cos(arg) * rApo
  body.y = host.y + Math.sin(arg) * rApo
  body.vx = -Math.sin(arg) * v * dir
  body.vy = Math.cos(arg) * v * dir
  body.orbitField = [host]

  // Where on the ellipse the body should already be when the level opens.
  // Rather than solve Kepler's equation for an arbitrary starting anomaly --
  // which would be an approximation anyway, since Paczynski-Wiita orbits are
  // not closed and have no exact anomaly to solve for -- the orbit is simply
  // run forward. Start the clock early and let the physics put the body where
  // it belongs. Deterministic, exact by construction, and it costs a few
  // thousand steps once at load.
  const lead = spec.lead ?? 0
  for (let t = 0; t < lead; t += STEP) {
    gravityAt(body.x, body.y, body.orbitField, body.acc)
    integrate(body, body.acc.x, body.acc.y, STEP, 0)
  }

  return true
}

/**
 * Places a body on a ring of equal masses turning about a shared centre. Every
 * body on every ring sharing that centre pulls on every other one -- these are
 * real mutual orbits, not a figure being animated round a point.
 *
 * Two passes, because a body's speed cannot be known until every other body is
 * placed: placeInRing() puts them down, bindRingVelocity() then measures the
 * field each one actually sits in and hands it exactly the speed that turns
 * that pull into a circle.
 *
 * Measuring rather than deriving matters. The closed forms for these
 * configurations are Newtonian and this board is not -- Paczynski-Wiita runs
 * stronger than an inverse square at these radii, by about 18% for level 2's
 * inner pair. Seeding from the closed form would leave every body slightly
 * under-speed and the whole figure would sag inward. Reading the acceleration
 * out of the same gravityAt() the rest of the game uses is right whatever the
 * law happens to be.
 *
 * ── Why level 2 is two pairs and not a triangle ──────────────────────────────
 *
 * The first attempt was the prettier idea: three equal holes at the corners of
 * an equilateral triangle turning rigidly about a fourth, which is an exact
 * solution -- Lagrange's, from 1772, with a central mass added. It seeds
 * perfectly. Radii 215.00px each, sides 372.4px each, identical speeds.
 *
 * And it tears itself apart, which is also exactly right. Maxwell worked this
 * out for Saturn's rings: a ring of fewer than about seven bodies is linearly
 * unstable no matter how heavy you make the centre. Measured here, the figure
 * held its shape to 5% for 6 seconds at a 1.7:1 mass ratio and still only 205
 * seconds at 120:1, by which point the ring bodies are invisible specks. Exact
 * is not the same as stable.
 *
 * So level 2 uses what nature uses. Real quadruple star systems are almost
 * always "2+2" -- two tight binaries in a wide mutual orbit -- because a flat
 * four-body system does precisely what that triangle did. A two-body orbit is
 * exactly solvable and exactly stable, and a hierarchy of them inherits that.
 */
function placeInRing (body, centre, spec) {
  const R = spec.radius * DESIGN_HEIGHT
  const a = ((spec.index / spec.members) + (spec.phase ?? 0)) * Math.PI * 2
  body.x = centre.x + Math.cos(a) * R
  body.y = centre.y + Math.sin(a) * R
  body.ringRadius = R
  body.ringAngle = a
}

function bindRingVelocity (body, centre, others) {
  const field = others
  const acc = { x: 0, y: 0 }
  gravityAt(body.x, body.y, field, acc)

  // Only the component pointing at the centre can hold a circle. For a true
  // central configuration the tangential part is zero by symmetry; taking the
  // radial component explicitly means a level that is slightly out of symmetry
  // still gets the best circular seed available rather than a silently wrong one.
  const dx = centre.x - body.x
  const dy = centre.y - body.y
  const R = Math.hypot(dx, dy)
  const inward = (acc.x * dx + acc.y * dy) / R
  if (!(inward > 0)) return false

  const v = Math.sqrt(inward * R)
  const dir = body.ring.direction ?? 1
  body.vx = -(dy / R) * v * dir
  body.vy = (dx / R) * v * dir
  body.orbitField = field
  return true
}

/**
 * Steps every attractor on the board for one fixed tick.
 *
 * The two phases are the whole point and are not an optimisation. Every body
 * reads the field it is sitting in *before* any of them has moved, and only
 * then do they all integrate. Step them one at a time instead and the second
 * body of a pair computes its pull from where the first has already got to,
 * which is a half-step of asymmetry injected into every tick -- momentum stops
 * being conserved and a mutual orbit pumps itself apart.
 *
 * It does not show up at all while bodies only orbit something fixed: the
 * source of their field is not moving, so reading it early or late is the same
 * read. It shows up the instant two bodies orbit each other. A two-body
 * circular orbit is exact, and measured over ten minutes it holds its
 * separation to 1% stepped simultaneously and blows up by a factor of 10^4
 * stepped sequentially.
 */
export function stepBodies (bodies, dt, elapsed = 0) {
  for (const b of bodies) {
    if (b.orbitField) gravityAt(b.x, b.y, b.orbitField, b.acc)
  }
  for (const b of bodies) {
    if (b.orbitField) integrate(b, b.acc.x, b.acc.y, dt, 0)
    b.update(dt, elapsed)
  }
}

/**
 * One step of an orbit. Note the absent speed limit, which is not an oversight.
 *
 * These orbits are genuinely relativistic -- a body circling at seven
 * Schwarzschild radii is doing about a third of light speed, and that is the
 * real number, not an artefact of the scale. But Paczynski-Wiita is already the
 * relativistic correction: the whole point of the potential is to reproduce
 * relativistic orbital dynamics inside a Newtonian integration. Layering
 * integrate()'s longitudinal-inertia damping on top counts the same physics
 * twice.
 *
 * And it does real damage when it does, because that damping is one-sided. It
 * only fires when acceleration has a component along velocity, which on an
 * ellipse means the infalling half of every lap and not the climbing half. The
 * body is short-changed on the way down and charged in full on the way up, so
 * it loses energy every orbit and spirals in. Four stars quietly fell into the
 * hole over the first three minutes of the level before this was found.
 *
 * The limit stays on the craft and the asteroids, where it is doing its actual
 * job: capping a body the field is still trying to accelerate.
 */


/**
 * The radius at which an attractor consumes what touches it. A black hole eats
 * at its horizon; a star has no horizon, so it eats at its surface.
 */
export { placeInRing, bindRingVelocity }

export function absorbRadius (h) {
  // The horizon, not the shadow -- even though the shadow is what is drawn.
  //
  // It is tempting to kill at the black disc, because "black means dead" reads
  // instantly. But the shadow is the hole's *image*, not a surface: it is the
  // patch of sky from which no light reaches you, produced by rays bending
  // around the hole. A craft at 2 r_s is between the viewer and the hole, lit,
  // and perfectly alive -- it is drawn in front of the disc, not inside
  // anything. Only the horizon is a place you cannot come back from.
  //
  // Killing at the shadow also fails at mass. The shadow grows as M while the
  // radius at which thrust loses to gravity grows more slowly, so above about
  // 7 solar masses a craft can still power out from inside the black disc, and
  // the rule contradicts itself. Anchoring to the horizon holds at every mass.
  //
  // In practice the visible cost is nothing: escapeLimit() sits outside the
  // shadow for every hull on a hole this size, so by the time a craft so much
  // as touches the black disc it has already lost, and dies a moment later.
  //
  // A star has no horizon and no shadow; it stops you at its surface.
  return h.horizon > 0 ? h.horizon : h.radius
}

/**
 * A star. Same gravity law and the same mu as a black hole of equal mass -- what
 * changes is that it has a surface, so the field never gets the room to climb.
 *
 * `kind` only selects the look: 'main-sequence', 'red-giant' or 'white-dwarf'.
 * A white dwarf packs a lot of mass into a small radius and is genuinely nasty
 * for it; a red giant is enormous and surprisingly gentle at its surface. That
 * contrast is the real astrophysics of stellar density, and it is free here.
 */
export class Star {
  constructor (spec, worldWidth = DESIGN_WIDTH) {
    // A body in orbit has no authored position -- bindOrbit() places it from
    // the orbit's own geometry -- so x and y are optional and only the centre
    // of the board is used until then.
    this.homeX = (spec.x ?? 0.5) * worldWidth
    this.homeY = (spec.y ?? 0.5) * DESIGN_HEIGHT
    this.kind = spec.kind ?? 'main-sequence'
    this.solarMasses = spec.solarMasses

    const geo = starGeometry(spec.solarMasses, spec.radius * DESIGN_HEIGHT)
    this.mu = geo.mu
    this.radius = geo.radius
    this.horizon = geo.horizon     // zero; a star has no event horizon
    this.soften = geo.soften
    // Collision and layout code treats every attractor alike, and for a star the
    // lethal boundary is its surface.
    this.isco = this.radius * 2.2

    // Resolved into a velocity by bindOrbit() once the host exists; see there.
    this.orbit = spec.orbit ?? null
    this.ring = spec.ring ?? null
    this.orbitField = null
    this.acc = { x: 0, y: 0 }

    this.x = this.homeX
    this.y = this.homeY
    this.vx = 0
    this.vy = 0
    this.churn = 0
  }

  bindOrbit (host) {
    return bindOrbit(this, host)
  }

  // Motion is handled by stepBodies(); this is the rest of the per-tick state.
  update (dt) {
    this.churn += dt
  }

  contains (x, y) {
    return Math.hypot(x - this.x, y - this.y) < this.radius
  }
}

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
  constructor (rng, holes, gate, world, orbiter = false, speedScale = 1, deflection = 0, drag = 0) {
    this.gate = gate
    this.world = world
    this.orbiter = orbiter
    this.speedScale = speedScale
    this.deflection = deflection
    this.drag = drag
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

  // Spawns off the right edge, clear of the gate's mouth, always off-screen.
  //
  // Two rules drive this. Nothing may appear inside the board -- debris blinking
  // into existence in front of the player is not a hazard, it is a cheat. And
  // nothing may come out of the gate, because that is the one place a player is
  // committed to flying into and cannot dodge away from.
  //
  // Everything else arriving from the right is the point rather than a problem,
  // and this reverses what was here before. The old rule sent debris in from
  // above and below to keep it away from the gate -- but on a level with a hole
  // in the middle the survivable lanes are the top and the bottom, so that put
  // every rock's entry exactly where the player flies, appearing a hull's
  // length away with no approach to read. Coming from the right, a rock crosses
  // the whole board before it reaches anyone: the player is flying into it,
  // watching it come, for the entire length of its run.
  reset (holes, initial = false) {
    const rng = this.rng
    this.radius = randRange(rng, 1.96, 3.98)
    this.spin = randRange(rng, 0, Math.PI * 2)
    this.spinRate = randRange(rng, -1.4, 1.4)
    this.trail.length = 0
    this.trailClock = 0
    this.age = 0
    this.offBoardFor = 0

    this.buildBody(rng)

    // Entry point: off the right edge, above or below the gate's band. The span
    // runs past the top and bottom edges too, so rocks also come in around the
    // corners rather than all entering on one vertical line.
    const g = this.gate
    const clearTop = g.y - g.height / 2 - GATE_CLEARANCE
    const clearBottom = g.y + g.height / 2 + GATE_CLEARANCE
    const fromAbove = rng() > 0.5
    // Off the right of the *view*, not of the world. On a level four screens
    // wide, spawning at the world's edge would put debris four thousand pixels
    // from anyone and leave the board the player is actually looking at empty.
    // The view is where the game is; the world is only how far it goes.
    this.x = this.world.viewX + DESIGN_WIDTH + randRange(rng, 50, 280)
    this.y = fromAbove
      ? randRange(rng, -DESIGN_HEIGHT * 0.2, clearTop)
      : randRange(rng, clearBottom, DESIGN_HEIGHT * 1.2)

    if (this.orbiter && this.seedBoundEntry(rng, holes, fromAbove)) return

    // Ordinary debris: crosses the board leftward, fanned so the field arrives
    // at a spread of angles rather than as a single sheet.
    //
    // Direction is built as an angle off due-left rather than as separate x and
    // y velocities, because the deflection has to mean the same thing at every
    // speed. Composed from components it does not: the deflection was tuned as a
    // sideways nudge on rocks that were falling vertically, and the moment
    // entry moved to the right edge that same 85px/s became a *vertical* nudge
    // on rocks crossing at 23-63px/s, which swamped them -- the median rock
    // left the edge 51 degrees off course and went straight out of the top or
    // bottom without ever crossing the board.
    const s = this.speedScale
    const speed = randRange(rng, 55, 150) * s
    // `toward` points at the midline: down from above, up from below. The
    // deflection is applied against it, so debris fans outward.
    const toward = fromAbove ? 1 : -1
    const angle = (this.deflection + randRange(rng, -FAN_DEGREES, FAN_DEGREES)) * Math.PI / 180
    this.vx = -Math.cos(angle) * speed
    this.vy = -toward * Math.sin(angle) * speed

    // Angular momentum, and the reason the field stops being a vacuum.
    //
    // Whether a rock orbits a hole or goes straight down it is decided by one
    // number -- its angular momentum about that hole, L = v x r -- and not at
    // all by its mass, which cancels out of the equation of motion entirely.
    // Below a critical L the effective potential L^2/2r^2 - mu/(r - r_s) has no
    // local maximum, which means no periapsis, which means no way past the
    // hole: the rock spirals in whatever its speed or angle. That threshold
    // works out at the angular momentum of a circular orbit at the ISCO, so it
    // scales with the hole's mass.
    //
    // With purely random drift, most rocks entered with a small impact
    // parameter and sat well under it -- 25 of 28 on this level -- so the board
    // really was a vacuum, and correctly so.
    //
    // The fix is not to slow the rocks or lighten them, it is to throw the
    // stream off a dead-centre aim. `deflection` is that angle, in degrees
    // *away* from the horizontal midline, and the sign is the whole of it.
    //
    // Aiming debris inward looks like the natural choice and is exactly wrong.
    // At the right-hand edge the two terms of L = x*vy - y*vx very nearly
    // cancel for a rock angled toward the middle, so it arrives with almost no
    // angular momentum and goes straight down the hole: 20 of 28 doomed before
    // they had moved. Angled outward the terms add instead, and the same rocks
    // pass above and below the hole with enough to swing right round it -- 2 of
    // 28 doomed, and full revolutions better than doubled.
    //
    // The two streams end up counter-rotating, which is not a disc and is not
    // meant to be. It is what a stream of debris does when a massive body
    // splits it: what passes above carries angular momentum of one sign and
    // what passes below the other.
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
  seedBoundEntry (rng, holes, fromAbove) {
    // Prefer a hole on the half of the board the rock is entering from, so the
    // ellipse actually reaches the well rather than skimming past it.
    // Current position, not the authored one: a host that orbits is not where
    // the level file put it, and picking by home would aim rocks at where a
    // star used to be.
    const candidates = holes.filter(h =>
      fromAbove ? h.y < DESIGN_HEIGHT * 0.62 : h.y > DESIGN_HEIGHT * 0.38)
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

    // Purely tangential at apoapsis, direction chosen at random -- and then the
    // host's own velocity added on top.
    //
    // That last part is not a refinement, it is the difference between an orbit
    // and a near miss. apoapsisSpeed() solves for the velocity that closes an
    // ellipse in the *host's* rest frame; if the host is itself moving at two
    // hundred pixels a second, a rock given only that velocity in board
    // coordinates is not bound to it at all and simply watches it leave. The
    // hosts were all stationary when this was written, so the term was zero and
    // its absence cost nothing.
    const ux = dx / rApo
    const uy = dy / rApo
    const dir = rng() > 0.5 ? 1 : -1
    this.vx = -uy * v * dir + (host.vx ?? 0)
    this.vy = ux * v * dir + (host.vy ?? 0)
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
      // rock, and the silhouette breaks up. Ice can afford a lower floor than
      // the old red could -- it starts from far more luminance, so the shadowed
      // faces still read as lit surface at a shade that would have swallowed a
      // crimson one, and the extra range buys back the sense of a solid body
      // rather than a flat white chip.
      return Math.max(0.32, Math.min(1, base + lit * contrast + randRange(rng, -0.07, 0.07)))
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
    // A whisper of drag, and it is not there to slow anything down.
    //
    // Dissipation is what lets a capture stick. A clean two-body encounter
    // conserves energy, so a rock arriving unbound leaves unbound and the
    // three-body captures that produce the swirls are brief and rare. Bleeding
    // a little energy at closest approach is exactly what turns a fly-by into
    // several laps -- it is why debris settles into discs in the first place,
    // and the physical stand-in is the gas and dust a small body actually
    // ploughs through near a massive one.
    //
    // It has to stay small. Measured on level 1, 0.05 takes the swirl episodes
    // from 78 to 127 and full revolutions from 20 to 25; turn it up to 0.45 and
    // the rocks shed so much energy they spiral in before completing a lap, and
    // full revolutions collapse to zero. More drag is emphatically not more
    // swirling.
    gravityAt(this.x, this.y, holes, accel)
    integrate(this, accel.x, accel.y, dt, this.drag, SYSTEM_SPEED_LIMIT)
    this.spin += this.spinRate * dt

    this.trailClock += dt
    if (this.trailClock >= TRAIL_INTERVAL) {
      this.trailClock -= TRAIL_INTERVAL
      this.trail.unshift({ x: this.x, y: this.y })
      if (this.trail.length > TRAIL_POINTS) this.trail.pop()
    }

    // A star sweeping across the board is as solid as a hole is final, so a rock
    // that reaches either one is gone. This used to test the horizon alone,
    // which for a star is zero -- rocks sailed straight through the photosphere.
    // Harmless when the stars were fixed scenery; not once they are in motion.
    const eaten = holes.some(h => Math.hypot(this.x - h.x, this.y - h.y) < absorbRadius(h))

    // Generous bounds so a bound orbit can swing wide and come back. The old
    // box (x > -140, y within 160px of the board) destroyed exactly the rocks
    // that were mid-orbit, which is why none were ever seen completing one.
    // Bounds travel with the view for the same reason. A rock the player has
    // long since left behind is not mid-orbit, it is scenery in an empty room.
    const left = this.world.viewX
    const right = left + DESIGN_WIDTH
    const wayOut =
      this.x < left - ORBIT_MARGIN || this.x > right + ORBIT_MARGIN ||
      this.y < -ORBIT_MARGIN || this.y > DESIGN_HEIGHT + ORBIT_MARGIN

    // A rock that has been off the board a long time is not orbiting, it has
    // left; recycle it so the field does not slowly empty.
    const onBoard =
      this.x > left - 40 && this.x < right + 40 &&
      this.y > -40 && this.y < DESIGN_HEIGHT + 40
    if (onBoard) this.offBoardFor = 0
    else this.offBoardFor += dt

    if (eaten || wayOut || this.offBoardFor > OFF_BOARD_GRACE) {
      this.reset(holes)
    }
  }
}

export class Gate {
  constructor (spec, worldWidth = DESIGN_WIDTH) {
    this.x = spec.x * worldWidth
    this.y = spec.y * DESIGN_HEIGHT
    this.width = spec.width * DESIGN_WIDTH
    this.height = spec.height * DESIGN_HEIGHT
  }

  contains (x, y) {
    return Math.abs(x - this.x) < this.width / 2 &&
           Math.abs(y - this.y) < this.height / 2
  }
}
