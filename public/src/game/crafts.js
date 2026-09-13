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
//   artScale       display-only multiplier; the 2019 silhouettes have very
//                  different natural widths and this evens them out without
//                  altering a single coordinate of the artwork

export const CRAFTS = [
  {
    id: 'superbug',
    name: 'Superbug',
    tagline: 'Balanced hull. Forgiving.',
    mass: 1.0,
    thrust: 2600,
    maxSpeed: 520,
    drag: 0.9,
    responsiveness: 6.0,
    arrivalRadius: 90,
    hull: 12,
    artScale: 0.83
  },
  {
    id: 'psych-bike',
    name: 'Psych Bike',
    tagline: 'Feather-light. Twitchy, quick to turn.',
    mass: 0.62,
    thrust: 1900,
    maxSpeed: 610,
    drag: 0.62,
    responsiveness: 7.5,
    arrivalRadius: 70,
    hull: 10,
    artScale: 0.68
  },
  {
    id: 'compiler',
    name: 'The Compiler',
    tagline: 'Heavy frame, huge engine. Commits to a line.',
    mass: 1.7,
    thrust: 4200,
    maxSpeed: 560,
    drag: 1.05,
    responsiveness: 4.6,
    arrivalRadius: 120,
    hull: 14,
    artScale: 0.43
  },
  {
    id: 'voidwalker',
    name: 'Voidwalker',
    tagline: 'Heavily damped. Goes exactly where aimed.',
    mass: 1.25,
    thrust: 2900,
    maxSpeed: 470,
    drag: 1.55,
    responsiveness: 6.4,
    arrivalRadius: 85,
    hull: 13,
    artScale: 0.58
  }
]

export function craftById (id) {
  return CRAFTS.find(c => c.id === id) ?? CRAFTS[0]
}

// thrust/mass -- the number that actually decides how a craft handles.
export function thrustAccel (craft) {
  return craft.thrust / craft.mass
}
