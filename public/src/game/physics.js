// Gravity and flight model.
//
// The 2019 build normalised the offset to a black hole by |dx| + |dy| and added
// the result straight onto the craft's position. That points the pull in the
// wrong direction anywhere off the diagonals, and moving position rather than
// velocity left the craft with no momentum -- you could stop dead inside a
// gravity well. A game about surfing gravitational waves needs both a correct
// field and real inertia.
//
// ── The equation ─────────────────────────────────────────────────────────────
//
// These are black holes, not point masses, so Newton alone is the wrong model
// near the horizon. We use the Paczynski-Wiita potential, the standard
// pseudo-Newtonian approximation used in accretion astrophysics:
//
//     Phi(r) = -GM / (r - r_s)          a(r) = GM / (r - r_s)^2
//
// where r_s = 2GM/c^2 is the Schwarzschild radius. It costs one subtraction over
// Newton and buys the three features that make a black hole a black hole:
//
//   * the potential diverges at r = r_s, so the horizon is a true point of no
//     return rather than somewhere you can power out of with a big enough engine
//   * it reproduces the innermost stable circular orbit at exactly r = 3 r_s --
//     inside that radius no circular orbit is stable and you spiral in, which is
//     a real prediction of general relativity and not a game rule we invented
//   * the marginally bound orbit lands at r = 4 r_s, as in the exact solution
//
// Far from the hole r_s becomes negligible and it relaxes smoothly into
// Newtonian 1/r^2, so the open board behaves exactly as you would expect.
//
// Reference: Paczynski, B. & Wiita, P. J. (1980), "Thick accretion disks and
// supercritical luminosities", Astronomy & Astrophysics 88, 23.

import { G, C, SOLAR_MASS, METERS_PER_PIXEL, SECONDS_PER_GAME_SECOND } from './constants.js'

/** Schwarzschild radius r_s = 2GM/c^2, in metres, for a mass in kg. */
export function schwarzschildRadiusMeters (massKg) {
  return (2 * G * massKg) / (C * C)
}

/**
 * Standard gravitational parameter mu = GM, pre-scaled so that
 *
 *     a_pixels_per_gamesecond^2 = mu / gap^2
 *
 * which folds the metres-per-pixel and seconds-per-game-second conversions into
 * one multiply on the hot path. Shared by every attractor -- a star and a black
 * hole of equal mass pull identically at equal distance, which is exactly right.
 */
function gravitationalParameter (solarMasses) {
  const gm = G * solarMasses * SOLAR_MASS
  return (gm * SECONDS_PER_GAME_SECOND * SECONDS_PER_GAME_SECOND) /
         (METERS_PER_PIXEL * METERS_PER_PIXEL * METERS_PER_PIXEL)
}

/**
 * A star: mass you cannot get close to.
 *
 * Same Newtonian law and the same mu as a black hole of equal mass -- gravity
 * does not care what the mass is made of. What differs is that a star has a
 * surface. Its pull is gentler *in play* purely because you can never get within
 * its radius, and 1/r^2 has not had room to climb by the time you are stopped.
 * A 20-solar-mass hole lets you to within 80px of its centre; a 20-solar-mass
 * star stops you at its photosphere, where the field is a fraction of that.
 *
 * There is no horizon term. Paczynski-Wiita corrects Newton near an event
 * horizon; a star has none, so the plain inverse square is the right law and the
 * correction would be wrong.
 *
 * One honest compromise: stellar radii are not to scale, and cannot be. The
 * length scale here is pinned by black hole horizons at 4px per solar mass,
 * which puts the Sun's photosphere about 940,000px across. A board cannot show a
 * 30km horizon and a 700,000km surface at once, so a star's radius is authored.
 * Its mass, and therefore its pull, stays real.
 */
export function starGeometry (solarMasses, radiusPx) {
  return {
    solarMasses,
    mu: gravitationalParameter(solarMasses),
    radius: radiusPx,
    horizon: 0,                    // no event horizon; pure inverse square
    soften: radiusPx * 0.4         // only ever reached inside the surface
  }
}

/**
 * Everything a black hole's geometry needs, derived from one number: its mass.
 * Radii come back in design pixels; `mu` is pre-scaled so that
 *
 *     a_pixels_per_gamesecond^2 = mu / (r_pixels - r_s_pixels)^2
 *
 * which folds the metres-per-pixel and seconds-per-game-second conversions into
 * a single multiply on the hot path.
 */
export function blackHoleGeometry (solarMasses) {
  const massKg = solarMasses * SOLAR_MASS
  const rsMeters = schwarzschildRadiusMeters(massKg)
  const rs = rsMeters / METERS_PER_PIXEL

  // GM in SI, then converted: metres/s^2 -> pixels/gamesecond^2 is
  // (1/METERS_PER_PIXEL) * SECONDS_PER_GAME_SECOND^2, and the r^2 in the
  // denominator contributes another METERS_PER_PIXEL^2.
  const mu = gravitationalParameter(solarMasses)

  return {
    solarMasses,
    massKg,
    mu,
    soften: rs * 0.02,
    /** Event horizon. Cross it and you are gone. */
    horizon: rs,
    /**
     * The shadow: how big the hole actually *looks*, and it is not the horizon.
     *
     * Light passing within the photon capture radius b = 3*sqrt(3)*GM/c^2 spirals
     * in and never comes back out, so the dark disc an observer sees is that
     * radius, not r_s. In units of r_s = 2GM/c^2 it works out at 3*sqrt(3)/2 =
     * 2.598 -- the hole looks about two and a half times larger than its own
     * horizon, because it bends the light around itself and presents a magnified
     * image. This is the number in the Event Horizon Telescope pictures: M87's
     * shadow is 2.6 r_s across, not 1.
     *
     * Drawing the bare horizon, as this did, is the more familiar picture and
     * the wrong one. Using the shadow makes every hole two and a half times
     * bigger on screen without touching its mass or its pull by one part.
     *
     * It is also where the board kills you, which is defensible rather than
     * convenient: escapeLimit() puts the radius at which a craft's thrust loses
     * to the pull *outside* the shadow for every hull in the roster, so anything
     * that reaches the black disc had already lost.
     */
    shadow: (3 * Math.sqrt(3) / 2) * rs,
    /** Photon sphere, 1.5 r_s -- where light itself orbits. */
    photonSphere: 1.5 * rs,
    /** Innermost stable circular orbit, 3 r_s. No stable orbit exists inside. */
    isco: 3 * rs,
    /** Marginally bound orbit, 4 r_s. */
    marginallyBound: 4 * rs
  }
}

/**
 * Gravitational acceleration at a point, summed over every hole, in
 * design-pixels per game-second squared. Writes into `out` to keep the hot path
 * allocation-free.
 *
 * Note what is absent: the mass of the craft. Gravitational acceleration is
 * independent of the mass being accelerated -- Galileo's observation, and later
 * the equivalence principle -- so a heavy craft and a light one fall at exactly
 * the same rate. Craft mass matters enormously in this game, but through thrust
 * authority, never through weight. See steer().
 */
export function gravityAt (x, y, holes, out = { x: 0, y: 0 }) {
  let ax = 0
  let ay = 0

  for (const h of holes) {
    const dx = h.x - x
    const dy = h.y - y
    const r = Math.hypot(dx, dy)

    // Paczynski-Wiita denominator for a black hole; for a star horizon is zero
    // and this reduces to the plain Newtonian r. Either way the gap is floored
    // at the body's own softening length so the number stays finite in the frame
    // where a collision is detected.
    const gap = Math.max(r - h.horizon, h.soften)
    const pull = h.mu / (gap * gap)

    // Unit vector toward the hole. Guard r = 0 exactly.
    if (r > 1e-6) {
      ax += (dx / r) * pull
      ay += (dy / r) * pull
    }
  }

  out.x = ax
  out.y = ay
  return out
}

/**
 * Cursor dead zone, in hull radii, and the distance over which the throttle
 * climbs from nothing to full once outside it. Together they make the last
 * ~70px of cursor travel a throttle rather than a destination.
 */
const DEAD_ZONE_HULLS = 2.2
const THROTTLE_RAMP = 55

/**
 * The thrust the pilot is asking for, as an acceleration.
 *
 * Arrival steering: the craft wants to travel at `maxSpeed` toward the cursor,
 * except within `arrivalRadius` where the desired speed ramps down linearly so
 * it settles onto the target instead of buzzing around it. The engine can only
 * change velocity so fast, so the correction is clamped to the thrust budget.
 *
 * Craft mass enters here and nowhere else: a = F/m. A heavy craft shares the
 * same gravitational fate as a light one but has less authority to argue with
 * it, which is what makes it feel heavy rather than simply worse.
 */
export function steer (craft, x, y, vx, vy, targetX, targetY, out = { x: 0, y: 0 }) {
  const dx = targetX - x
  const dy = targetY - y
  const dist = Math.hypot(dx, dy)

  // Throttle. The cursor is a control stick, not only a destination: how far it
  // sits from the hull decides how much engine is available, and inside a dead
  // zone the engine is simply off.
  //
  // Without this the craft could hover anywhere. Arrival steering asks for a
  // desired *velocity*, and with the cursor on the hull that desire is zero --
  // so the correction term becomes (0 - v) * responsiveness, which is full
  // braking at maximum power, and it cancels gravity exactly as happily as it
  // cancels anything else. Parking the mouse did not cut the engine, it
  // commanded a hover, and the field only won inside escapeLimit(): a ring
  // about ten pixels wider than the hole itself. The rest of the board was
  // gravitationally inert, which is a strange property for this game to have.
  //
  // Scaling the authority rather than only zeroing it inside the dead zone
  // matters, because a bare dead zone is trivially gamed -- park the cursor one
  // pixel outside it and the full braking term comes back. Ramping means a
  // small nudge buys a small burn, and holding station next to a well requires
  // pulling the cursor away from it and balancing thrust against pull, which is
  // the thing flying near a black hole ought to feel like.
  const dead = craft.hull * DEAD_ZONE_HULLS
  const throttle = Math.max(0, Math.min(1, (dist - dead) / THROTTLE_RAMP))
  if (throttle <= 0) {
    out.x = 0
    out.y = 0
    return out
  }

  let desiredVX = 0
  let desiredVY = 0
  if (dist > 1e-4) {
    const speed = dist < craft.arrivalRadius
      ? craft.maxSpeed * (dist / craft.arrivalRadius)
      : craft.maxSpeed
    desiredVX = (dx / dist) * speed
    desiredVY = (dy / dist) * speed
  }

  const maxAccel = (craft.thrust / craft.mass) * throttle
  let ax = (desiredVX - vx) * craft.responsiveness
  let ay = (desiredVY - vy) * craft.responsiveness
  const mag = Math.hypot(ax, ay)
  if (mag > maxAccel) {
    ax = (ax / mag) * maxAccel
    ay = (ay / mag) * maxAccel
  }

  out.x = ax
  out.y = ay
  return out
}

/**
 * The board's speed limit, and it is now genuinely the speed of light.
 *
 * This used to be a house rule. Carried through the game's length and time
 * scales, c worked out at 379 px per game-second while the craft flew at 470 to
 * 610, so the game was superluminal in its own units and the cap had to be an
 * invented number instead.
 *
 * Lengthening the game-second to strengthen the field moved c with it -- it
 * scales as T where gravity scales as T^2 -- and at the current scale c lands at
 * 656 px/s, above every craft's top speed. So the limit is no longer a number
 * picked to feel right; it is the real constant, converted.
 */
export const SYSTEM_SPEED_LIMIT = (C * SECONDS_PER_GAME_SECOND) / METERS_PER_PIXEL

/**
 * Advance one body by dt using semi-implicit (symplectic) Euler: velocity is
 * updated first, then position uses the *new* velocity. Explicit Euler pumps
 * energy into an orbit and makes it spiral outward artificially; the
 * semi-implicit form conserves it well enough to hold a clean arc around a
 * hole, which is the entire feel the game is built on.
 *
 * With a speedLimit set, acceleration along the direction of travel is damped
 * by (1 - v^2/c^2)^(3/2) while acceleration across it is left alone. That
 * asymmetry is how relativity actually does it -- longitudinal inertia grows as
 * gamma^3, transverse only as gamma -- and it means a body approaches the limit
 * asymptotically instead of slamming into a clamp. A hole can still whip a rock
 * through a hairpin at full speed; it just cannot keep adding speed.
 */
export function integrate (body, ax, ay, dt, drag, speedLimit = 0) {
  if (speedLimit > 0) {
    const v = Math.hypot(body.vx, body.vy)
    if (v > 1e-6) {
      const ux = body.vx / v
      const uy = body.vy / v
      let par = ax * ux + ay * uy
      if (par > 0) {
        const beta = Math.min(0.999999, v / speedLimit)
        const damp = Math.pow(1 - beta * beta, 1.5)
        const perpX = ax - par * ux
        const perpY = ay - par * uy
        par *= damp
        ax = perpX + par * ux
        ay = perpY + par * uy
      }
    }
  }

  body.vx += ax * dt
  body.vy += ay * dt

  // Numerical backstop: one very large step near a horizon can still overshoot
  // what the damping would have allowed.
  if (speedLimit > 0) {
    const v = Math.hypot(body.vx, body.vy)
    if (v > speedLimit) {
      body.vx = (body.vx / v) * speedLimit
      body.vy = (body.vy / v) * speedLimit
    }
  }

  if (drag) {
    // `drag` arrives as a deceleration rate, not a force. The caller divides the
    // craft's drag coefficient by its mass before passing it in, because drag is
    // a force and a force applied to a heavier body slows it less. That is the
    // one channel through which mass changes how a craft moves in the field:
    // gravitational acceleration is famously independent of the mass being
    // accelerated, so a heavy hull does not fall faster -- but once the well has
    // given it velocity, it sheds that velocity more slowly than a light one.
    // The pull sticks to it.
    const k = Math.exp(-drag * dt)   // frame-rate-independent decay
    body.vx *= k
    body.vy *= k
  }

  body.x += body.vx * dt
  body.y += body.vy * dt
}

/**
 * The radius at which a craft's maximum thrust exactly cancels the pull -- the
 * practical point of no return, which sits outside the horizon and differs per
 * craft. Solving mu/(r - r_s)^2 = thrust/mass for r.
 *
 * Because r_s scales linearly with mass while the pull at the horizon goes as
 * 1/r_s, small black holes have far fiercer surface gravity than large ones.
 * That is a real property of the Schwarzschild solution, and in play it means a
 * tiny hole is a far nastier trap than a big one -- the big ones are terrain,
 * the small ones are ambushes.
 */
export function escapeLimit (hole, craft) {
  return hole.horizon + Math.sqrt(hole.mu / (craft.thrust / craft.mass))
}

/**
 * Speed at apoapsis for an ellipse with the given apoapsis and periapsis, under
 * the Paczynski-Wiita potential.
 *
 * Derived from the two conserved quantities rather than assumed: specific energy
 * E = v^2/2 - mu/(r - r_s) and angular momentum L = r*v, both evaluated at the
 * two apsides where velocity is purely tangential, then solved for v_a.
 *
 * This is what lets a rock enter the board already on a bound orbit. Nothing can
 * be *captured* into orbit by a single hole -- energy is conserved, so arriving
 * unbound means leaving unbound -- but arriving already bound is perfectly
 * legitimate, and it is how a rock can come in from off-screen and then stay.
 */
export function apoapsisSpeed (hole, rApo, rPeri) {
  const ga = rApo - hole.horizon
  const gp = rPeri - hole.horizon
  if (gp <= 0 || rPeri >= rApo) return NaN
  const num = 2 * hole.mu * (1 / ga - 1 / gp)
  const den = 1 - (rApo * rApo) / (rPeri * rPeri)
  const v2 = num / den
  return v2 > 0 ? Math.sqrt(v2) : NaN
}

/** Orbital speed for a circular orbit of radius r under Paczynski-Wiita. */
export function circularOrbitSpeed (hole, r) {
  const gap = r - hole.horizon
  if (gap <= 0) return Infinity
  return Math.sqrt((hole.mu * r) / (gap * gap))
}
