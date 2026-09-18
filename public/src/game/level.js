import { BlackHole, Star, Asteroid, Gate } from './entities.js'
import { makeRng } from '../core/rng.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

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
  const rng = makeRng(spec.seed ?? 1)
  const asteroids = []
  const total = spec.asteroids?.count ?? 0
  const orbiters = Math.min(total, spec.asteroids?.orbiters ?? 0)
  const speedScale = spec.asteroids?.speed ?? 1
  for (let i = 0; i < total; i++) {
    asteroids.push(new Asteroid(rng, holes, i < orbiters, speedScale))
  }

  return {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle ?? '',
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
