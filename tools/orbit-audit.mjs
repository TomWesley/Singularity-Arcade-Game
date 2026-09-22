// Why do asteroids never settle into orbit?
//
// Two candidate explanations, and they need different fixes:
//   1. Physics: a two-body gravitational encounter cannot capture. Specific
//      orbital energy E = v^2/2 - mu/(r - r_s) is conserved, so anything
//      arriving with E > 0 leaves with E > 0. If every rock spawns unbound,
//      no orbit is possible and the maths is behaving correctly.
//   2. Bookkeeping: rocks are bound, but the recycler culls them the moment
//      they leave the board -- so an orbit that swings wide is destroyed before
//      it can come back round.
//
// This measures which it is.

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { absorbRadius } from '../public/src/game/entities.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const spec = JSON.parse(fs.readFileSync(new URL('../levels/level1.json', import.meta.url), 'utf8'))
const level = buildLevel(spec)
const STEP = 1 / 120
const accel = { x: 0, y: 0 }

function energyVsNearest (a, holes) {
  let best = null
  for (const h of holes) {
    const r = Math.hypot(a.x - h.x, a.y - h.y)
    const gap = Math.max(r - h.horizon, h.horizon * 0.02)
    const E = (a.vx * a.vx + a.vy * a.vy) / 2 - h.mu / gap
    if (!best || E < best.E) best = { E, h, r }
  }
  return best
}

// Energy at the moment of spawn, for a large sample of fresh rocks.
let bound = 0
let unbound = 0
const sample = []
for (const a of level.asteroids) {
  for (let k = 0; k < 40; k++) {
    a.reset(level.holes)
    const e = energyVsNearest(a, level.holes)
    if (e.E < 0) bound++; else unbound++
    if (sample.length < 6) sample.push(e.E)
  }
}
console.log('At spawn, relative to the nearest hole:')
console.log(`  bound (E<0):   ${bound}`)
console.log(`  unbound (E>0): ${unbound}`)
console.log(`  -> ${((bound / (bound + unbound)) * 100).toFixed(0)}% of rocks spawn gravitationally bound\n`)

// Now run the level and record why each rock dies, and how far round a hole it
// got first.
const fresh = buildLevel(spec)
const reasons = { eaten: 0, leftEdge: 0, topBottom: 0 }
const sweeps = []
const track = fresh.asteroids.map(a => ({ sweep: 0, lastAngle: null, life: 0 }))

for (let i = 0; i < 120 * 240; i++) {
  for (const h of fresh.holes) h.update(STEP, i * STEP)
  fresh.asteroids.forEach((a, idx) => {
    const before = { x: a.x, y: a.y }
    const t = track[idx]

    // Accumulate swept angle around whichever hole is nearest.
    const near = energyVsNearest(a, fresh.holes)
    const ang = Math.atan2(a.y - near.h.y, a.x - near.h.x)
    if (t.lastAngle !== null) {
      let d = ang - t.lastAngle
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      if (near.r < near.h.isco * 4) t.sweep += d
    }
    t.lastAngle = ang
    t.life += STEP

    a.update(STEP, fresh.holes, accel)

    // Detect a recycle: position jumped.
    if (Math.hypot(a.x - before.x, a.y - before.y) > 300) {
      // absorbRadius, not a locally invented multiple of the horizon. This read
      // h.horizon * 1.2, which for a star is zero and for a hole is now far
      // inside the shadow a rock is actually swallowed at -- so every rock the
      // hole ate was being filed as having drifted off the top of the board,
      // and the report showed nothing ever falling in.
      const eaten = fresh.holes.some(h =>
        Math.hypot(before.x - h.x, before.y - h.y) < absorbRadius(h) * 1.2)
      if (eaten) reasons.eaten++
      else if (before.x < 0) reasons.leftEdge++
      else reasons.topBottom++
      sweeps.push(Math.abs(t.sweep) * 180 / Math.PI)
      t.sweep = 0; t.lastAngle = null; t.life = 0
    }
  })
}

const total = reasons.eaten + reasons.leftEdge + reasons.topBottom
console.log('Over 240s of play, rocks were recycled because they:')
console.log(`  were swallowed         ${reasons.eaten}`)
console.log(`  left the LEFT edge     ${reasons.leftEdge}`)
console.log(`  left top/bottom        ${reasons.topBottom}`)
console.log(`  total                  ${total}`)

sweeps.sort((a, b) => b - a)
console.log(`\nAngle swept around the nearest hole before being recycled:`)
console.log(`  best ${sweeps[0]?.toFixed(0)}deg, 10th ${sweeps[9]?.toFixed(0)}deg, median ${sweeps[Math.floor(sweeps.length / 2)]?.toFixed(0)}deg`)
console.log(`  rocks completing a full revolution (>360deg): ${sweeps.filter(s => s > 360).length}`)
console.log(`  rocks completing a half revolution (>180deg): ${sweeps.filter(s => s > 180).length}`)
