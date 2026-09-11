import { BlackHole, Asteroid, Gate } from './entities.js'
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
  const holes = spec.blackHoles.map(h => new BlackHole(h))
  const rng = makeRng(spec.seed ?? 1)
  const asteroids = []
  const total = spec.asteroids?.count ?? 0
  const orbiters = Math.min(total, spec.asteroids?.orbiters ?? 0)
  for (let i = 0; i < total; i++) {
    asteroids.push(new Asteroid(rng, holes, i < orbiters))
  }

  return {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle ?? '',
    holes,
    asteroids,
    gate: new Gate(spec.gate),
    spawn: {
      x: spec.spawn.x * DESIGN_WIDTH,
      y: spec.spawn.y * DESIGN_HEIGHT
    }
  }
}
