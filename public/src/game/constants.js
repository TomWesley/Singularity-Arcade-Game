// Physical constants and the scale that maps real spacetime onto the board.
//
// The game does not invent a gravity number. A level authors a black hole by
// its mass in solar masses; everything else -- horizon radius, photon sphere,
// innermost stable orbit, the strength of the pull at any distance -- is
// derived from that mass and the real constants below.

/** Newtonian constant of gravitation, m^3 kg^-1 s^-2 (CODATA 2018). */
export const G = 6.67430e-11

/** Speed of light in vacuum, m/s (exact, SI definition). */
export const C = 299792458

/** Solar mass, kg (IAU nominal). */
export const SOLAR_MASS = 1.98892e30

/**
 * World scale. Chosen so one solar mass of black hole draws a Schwarzschild
 * radius of exactly 4 design pixels, which puts a believable stellar-mass hole
 * (10-25 solar masses) at a readable size on a 1280x720 board.
 *
 *   r_s(1 solar mass) = 2GM/c^2 = 2953.25 m, and 2953.25 / 738.31 = 4.000 px
 */
export const METERS_PER_PIXEL = 738.3125

/**
 * Time scale: how many real seconds one game second represents.
 *
 * This is not a fudge factor, it is a consequence. Once the length scale is
 * fixed, the accelerations near a stellar-mass black hole are on the order of
 * 10^11 m/s^2, so real time has to be slowed by roughly a thousand to be
 * flyable. One second at the controls is about 2.3 milliseconds of the
 * universe's time -- which is genuinely how fast things happen down there.
 *
 * This is also the one dial that changes how hard the holes pull without
 * changing how big they look. Horizon radius is r_s/METERS_PER_PIXEL and has no
 * time term at all, while gravitational acceleration carries a T^2 -- so
 * lengthening the second makes the wells reach further while every hole stays
 * exactly the size it was. It was raised by sqrt(3) to strengthen the field
 * threefold, which as a side effect finally puts the game below light speed:
 * see SYSTEM_SPEED_LIMIT.
 */
export const SECONDS_PER_GAME_SECOND = 2.28537e-03

/** Design-space board size, in pixels. */
export const DESIGN_WIDTH = 1280
export const DESIGN_HEIGHT = 720
