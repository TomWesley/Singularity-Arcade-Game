// The four original surfers, re-expressed for the new flight model.
//
// The 2019 build gave each craft a `speed` and a `mass`, where mass scaled the
// gravitational force on it -- heavier literally meant "falls harder", which is
// not how gravity works and made the heavy craft strictly worse. Here mass is
// inertia only: it divides thrust, so a heavy craft takes longer to change its
// mind but is otherwise as free as any other. Every craft has a genuine reason
// to be picked.
//
//   mass           kg-ish; divides thrust to give available acceleration
//   thrust         engine force; thrust/mass is what you actually feel
//   maxSpeed       design-units/second the pilot can ask for
//   drag           velocity decay per second; low drag = long, loose drifts
//   responsiveness how hard it corrects toward the requested velocity
//   arrivalRadius  distance at which it starts easing onto the cursor
//   hull           the craft's hitbox in design px. Walls clear by this, and
//                  asteroids strike within half of it.
//
//                  Every hull now draws at the same overall size, so the hitbox
//                  difference comes entirely from how much of that size each
//                  silhouette actually fills. Measured by rasterising the art
//                  and counting lit pixels, then taking the radius of a circle
//                  of equal area: the Voidwalker's plate cluster fills 72% of
//                  its box, the Compiler's thin swept wings only 45%. Two craft
//                  the same size on screen, one a third easier to hit.
//
// Three axes, and each hull is strong on some and pays for it on the others:
//
//   hull      how big a target the debris field sees
//   thrust/mass   authority against a gravity well
//   maxSpeed  how fast it crosses open board
//
// The ladder runs against itself on purpose. The smallest target has the
// weakest engine and drifts; the strongest engine sits in the biggest target and
// turns slowly; the most precise hull is the slowest. Craft mass is not a
// penalty in gravity -- acceleration does not depend on the mass being
// accelerated -- but it divides thrust, so a light hull converts its engine more
// efficiently while a heavy one needs a bigger engine to match.
//   artScale       in-flight display scale, set so every hull draws at the same
//                  overall size. Shape is what varies, and shape is what the
//                  hitbox follows.
//   cardScale      selection-card scale, independent of artScale: a card wants
//                  all four filling the same box so the silhouettes can be
//                  compared, while the board wants their true relative sizes.

export const CRAFTS = [
  {
    id: 'superbug',
    name: 'Superbug',
    tagline: 'Even on all four. Nothing to learn around.',
    mass: 1.0,
    thrust: 4000,
    maxSpeed: 716,
    drag: 1.15,
    responsiveness: 7.0,
    arrivalRadius: 90,
    hull: 11.8,
    artScale: 1.149,
    cardScale: 2.002
  },
  {
    id: 'psych-bike',
    name: 'Psych Bike',
    tagline: 'Highest ceiling, slowest to reach it. Open frame, hard to hit.',
    mass: 0.62,
    thrust: 1546,
    maxSpeed: 748,
    drag: 1.15,
    responsiveness: 7.2,
    arrivalRadius: 70,
    hull: 9.8,
    artScale: 1.392,
    cardScale: 2.425
  },
  {
    id: 'compiler',
    name: 'The Compiler',
    tagline: 'Thin swept wings, small target. Heaviest flying: the pull sticks.',
    mass: 1.75,
    thrust: 7400,
    maxSpeed: 668,
    drag: 1.15,
    responsiveness: 7.0,
    arrivalRadius: 120,
    hull: 9.8,
    artScale: 0.757,
    cardScale: 1.319
  },
  {
    id: 'voidwalker',
    name: 'Voidwalker',
    tagline: 'Biggest engine, biggest target. Tops out early.',
    mass: 1.3,
    thrust: 6600,
    maxSpeed: 658,
    drag: 1.15,
    responsiveness: 7.1,
    arrivalRadius: 85,
    hull: 12.3,
    artScale: 1.158,
    cardScale: 2.018
  }
]

// thrust/mass -- the number that actually decides how a craft handles.
export function thrustAccel (craft) {
  return craft.thrust / craft.mass
}
