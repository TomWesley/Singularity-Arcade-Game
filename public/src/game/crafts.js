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
//   hull           the craft's extent in design px. Walls clear by this, and
//                  asteroids strike within half of it -- these silhouettes are
//                  open frames, not solid discs, so a full-extent hitbox would
//                  punish near-misses through gaps you can see straight through.
//                  Measured from the art with tools/craft-bounds.mjs, not picked.
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
//   artScale       in-flight display scale. The hulls are deliberately
//                  different sizes on the board -- that size is a balance axis,
//                  see hull -- so this is not evened out.
//   cardScale      selection-card scale, independent of artScale: a card wants
//                  all four filling the same box so the silhouettes can be
//                  compared, while the board wants their true relative sizes.

export const CRAFTS = [
  {
    id: 'superbug',
    name: 'Superbug',
    tagline: 'Even on all three. Nothing to learn around.',
    mass: 1.0,
    thrust: 2950,
    maxSpeed: 578,
    drag: 0.95,
    responsiveness: 7.0,
    arrivalRadius: 90,
    hull: 12.8,
    artScale: 1.34,
    cardScale: 1.96
  },
  {
    id: 'psych-bike',
    name: 'Psych Bike',
    tagline: 'Smallest target on the board. Weakest engine on it too.',
    mass: 0.62,
    thrust: 1200,
    maxSpeed: 585,
    drag: 0.55,
    responsiveness: 7.2,
    arrivalRadius: 70,
    hull: 11.4,
    artScale: 0.92,
    cardScale: 1.62
  },
  {
    id: 'compiler',
    name: 'The Compiler',
    tagline: 'Climbs out of anything. Gives the debris a wide target.',
    mass: 1.75,
    thrust: 7100,
    maxSpeed: 578,
    drag: 1.0,
    responsiveness: 7.0,
    arrivalRadius: 120,
    hull: 15.4,
    artScale: 0.65,
    cardScale: 0.7
  },
  {
    id: 'voidwalker',
    name: 'Voidwalker',
    tagline: 'Heavy and precise. Goes exactly where aimed.',
    mass: 1.3,
    thrust: 4900,
    maxSpeed: 550,
    drag: 1.3,
    responsiveness: 7.1,
    arrivalRadius: 85,
    hull: 14.0,
    artScale: 0.8,
    cardScale: 1.0
  }
]

export function craftById (id) {
  return CRAFTS.find(c => c.id === id) ?? CRAFTS[0]
}

// thrust/mass -- the number that actually decides how a craft handles.
export function thrustAccel (craft) {
  return craft.thrust / craft.mass
}
