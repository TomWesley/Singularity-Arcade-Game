import { BlackHole, Star, Asteroid, Gate } from './entities.js'
import { makeRng } from '../core/rng.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

/**
 * The level order, loaded once at boot.
 *
 * An explicit manifest rather than scanning for level1..levelN: the order is a
 * design decision, and a run of files on disk cannot express "this one comes
 * third" without renaming everything after it. `target` is the intended length
 * of the campaign, so the progression can say how far along you are before all
 * fifteen exist.
 */
export async function loadManifest () {
  const res = await fetch('levels/manifest.json')
  if (!res.ok) throw new Error(`Level manifest failed to load (${res.status})`)
  const m = await res.json()
  if (!Array.isArray(m.order) || m.order.length === 0) {
    throw new Error('Level manifest has no order')
  }
  return { order: m.order, target: m.target ?? m.order.length }
}

export async function loadLevel (name) {
  const res = await fetch(`levels/${name}.json`)
  if (!res.ok) throw new Error(`Level ${name} failed to load (${res.status})`)
  return buildLevel(await res.json())
}

// Split from loadLevel so the balance simulator can build a level from parsed
// JSON without a network stack.
export function buildLevel (spec) {
  // Stars and black holes share one list: every consumer of it -- the gravity
  // sum, collision, the asteroid recycler, the orbit seeder -- cares only that a
  // thing has mu, a horizon and a lethal radius, and both satisfy that. Keeping
  // them separate would mean four places remembering to check two lists.
  const holes = [
    ...(spec.blackHoles ?? []).map(h => new BlackHole(h)),
    ...(spec.stars ?? []).map(s => new Star(s))
  ]
  // Orbits are bound after every attractor exists, because an orbit names its
  // host by index into this list -- black holes first, then stars, which is the
  // order they are written in the level file.
  for (const b of holes) {
    if (!b.orbit) continue
    const host = holes[b.orbit.host ?? 0]
    if (!host || host === b) {
      throw new Error(`Level ${spec.id}: orbit host ${b.orbit.host} does not exist`)
    }
    if (!b.bindOrbit(host)) {
      throw new Error(`Level ${spec.id}: orbit about host ${b.orbit.host} is not bound`)
    }
  }

  const rng = makeRng(spec.seed ?? 1)
  const asteroids = []
  const total = spec.asteroids?.count ?? 0
  const orbiters = Math.min(total, spec.asteroids?.orbiters ?? 0)
  const speedScale = spec.asteroids?.speed ?? 1
  // Net circulation of the debris field, px/s of lateral bias. See Asteroid.
  const swirl = spec.asteroids?.swirl ?? 0
  for (let i = 0; i < total; i++) {
    asteroids.push(new Asteroid(rng, holes, i < orbiters, speedScale, swirl))
  }

  return {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle ?? '',
    // Optional stationary sky image behind the board; null means black.
    backdrop: spec.backdrop ?? null,
    holes,
    stars: holes.filter(h => h instanceof Star),
    blackHoles: holes.filter(h => h instanceof BlackHole),
    asteroids,
    gate: new Gate(spec.gate),
    spawn: {
      x: spec.spawn.x * DESIGN_WIDTH,
      y: spec.spawn.y * DESIGN_HEIGHT
    }
  }
}
