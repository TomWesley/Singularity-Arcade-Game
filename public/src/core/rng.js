// Small deterministic PRNG (mulberry32). Used for starfields, asteroid shapes
// and particle jitter so that a given seed always produces the same scene --
// makes visuals reproducible and lets the balance simulator replay a level
// exactly.

export function makeRng (seed) {
  let a = seed >>> 0
  return function rng () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randRange (rng, min, max) {
  return min + rng() * (max - min)
}
