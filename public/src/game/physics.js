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
  const gm = G * massKg
  const mu = (gm * SECONDS_PER_GAME_SECOND * SECONDS_PER_GAME_SECOND) /
             (METERS_PER_PIXEL * METERS_PER_PIXEL * METERS_PER_PIXEL)

  return {
    solarMasses,
    massKg,
    mu,
    /** Event horizon. Cross it and you are gone. */
    horizon: rs,
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

    // Paczynski-Wiita denominator. Inside the horizon the potential is
    // undefined; the craft is already lost there, so we pin the gap to a small
    // positive value purely so the number stays finite for the frame in which
    // the collision is detected.
    const gap = Math.max(r - h.horizon, h.horizon * 0.02)
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

  let desiredVX = 0
  let desiredVY = 0
  if (dist > 1e-4) {
    const speed = dist < craft.arrivalRadius
      ? craft.maxSpeed * (dist / craft.arrivalRadius)
      : craft.maxSpeed
    desiredVX = (dx / dist) * speed
    desiredVY = (dy / dist) * speed
  }

  const maxAccel = craft.thrust / craft.mass
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
 * The board's own speed limit.
 *
 * Worth being straight about what this is and is not. The real speed of light,
 * carried through this game's length and time scales, works out at 379 px per
 * game-second -- and the craft already fly at 470 to 610, so the game is
 * comfortably superluminal in its own units and has been all along. That falls
 * out of wanting black holes big enough to read on a 1280px board *and*
 * accelerations slow enough to fly; the two constraints pin the scale, and c
 * lands where it lands.
 *
 * So this is a house rule, not physics: a ceiling that keeps a slingshot
 * spectacular without letting a rock cross the board in three frames. It is
 * enforced the way relativity would, though -- see below.
 */
export const SYSTEM_SPEED_LIMIT = 1500

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

/** Orbital speed for a circular orbit of radius r under Paczynski-Wiita. */
export function circularOrbitSpeed (hole, r) {
  const gap = r - hole.horizon
  if (gap <= 0) return Infinity
  return Math.sqrt((hole.mu * r) / (gap * gap))
}
