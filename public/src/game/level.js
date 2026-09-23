import { BlackHole, Star, Asteroid, Gate, placeInRing, bindRingVelocity } from './entities.js'
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
  // A ring is placed before anything is bound, because each vertex's speed
  // depends on where all the other vertices ended up. Members are grouped by
  // the host they turn about.
  // Rings are grouped by the point they turn about, and every body sharing a
  // centre pulls on every other one -- so an inner pair and an outer pair
  // written about the same point form one hierarchy rather than two unrelated
  // figures. A ring may name a `host` body to orbit, or give its own centre.
  const rings = new Map()
  for (const b of holes) {
    if (!b.ring) continue
    const r = b.ring
    const host = r.host === undefined ? null : holes[r.host]
    if (r.host !== undefined && (!host || host === b)) {
      throw new Error(`Level ${spec.id}: ring host ${r.host} does not exist`)
    }
    const cx = host ? host.x : (r.x ?? 0.5) * DESIGN_WIDTH
    const cy = host ? host.y : (r.y ?? 0.5) * DESIGN_HEIGHT
    const key = `${cx.toFixed(3)},${cy.toFixed(3)}|${r.radius}`
    placeInRing(b, { x: cx, y: cy }, r)
    if (!rings.has(key)) {
      rings.set(key, { centre: { x: cx, y: cy }, host, radius: r.radius, members: [] })
    }
    rings.get(key).members.push(b)
  }

  // A ring feels its own members, whatever it is orbiting, and every ring
  // *inside* it about the same centre -- and deliberately nothing outside.
  //
  // That is the hierarchy, and it is the only arrangement of four bodies that
  // survives. Lump them all into one field and they are a flat four-body
  // system, which tears itself apart in about a second however carefully it is
  // seeded. Real quadruple stars are nearly always two tight binaries in a wide
  // mutual orbit for exactly this reason: each pair is a two-body problem,
  // which is exact, and the far-away pair is a small perturbation rather than
  // an equal partner. Dropping that perturbation is the same restriction the
  // rest of the game's orbits already run under.
  const groups = [...rings.values()].sort((a, b) => a.radius - b.radius)
  for (let i = 0; i < groups.length; i++) {
    const { centre, host, members } = groups[i]
    const inner = groups.slice(0, i).flatMap(g => g.members)
    // `independent` members share an orbit but not a field: each one feels only
    // what it is orbiting. That is the right model for two bodies on the same
    // wide circumbinary orbit -- at 600px apart their pull on each other is 6%
    // of what holds them on it, while including it couples them into a
    // four-body problem that comes apart in seconds. Naming it in the level
    // file keeps the approximation visible instead of implied.
    const solo = groups[i].members[0].ring.independent === true
    for (const b of members) {
      const field = solo ? [...inner] : [...members.filter(m => m !== b), ...inner]
      if (host) field.push(host)
      if (!bindRingVelocity(b, centre, field)) {
        throw new Error(`Level ${spec.id}: a ring body has nothing holding it on a circle`)
      }
    }
  }

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

  // The gate is built before the debris, because the debris needs to know where
  // its mouth is in order to stay clear of it.
  const gate = new Gate(spec.gate)

  const rng = makeRng(spec.seed ?? 1)
  const asteroids = []
  const total = spec.asteroids?.count ?? 0
  const orbiters = Math.min(total, spec.asteroids?.orbiters ?? 0)
  const speedScale = spec.asteroids?.speed ?? 1
  // Entry angle away from the horizontal midline, in degrees. See Asteroid.
  const deflection = spec.asteroids?.deflection ?? 0
  // Dissipation, per second. Small: it is there to make captures stick, not to
  // slow rocks down. See Asteroid.update.
  const drag = spec.asteroids?.drag ?? 0
  for (let i = 0; i < total; i++) {
    asteroids.push(new Asteroid(rng, holes, gate, i < orbiters, speedScale, deflection, drag))
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
    gate,
    spawn: {
      x: spec.spawn.x * DESIGN_WIDTH,
      y: spec.spawn.y * DESIGN_HEIGHT
    }
  }
}
