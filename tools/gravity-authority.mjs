// How far from a hole does gravity actually own you?
//
// Two questions, and the interesting one is the first:
//
//   HANDS OFF -- park the cursor on the hull, so the engine is idle, and drop
//   the craft at rest at a given distance. Does it fall in? This is the radius
//   inside which doing nothing is fatal, and it is what decides whether the
//   board feels gravitationally alive or inert. Arrival steering used to make
//   it almost exactly escapeLimit(), because a parked cursor commanded a hover
//   at full power rather than cutting the engine.
//
//   PULLING AWAY -- hold the cursor far off, directly away from the hole, so
//   the engine is wide open. From how close can a craft still climb out? This
//   is the fairness bound: the gap between the two radii is the region where
//   the player is in trouble but not yet lost, and a game with no such band is
//   either inert or unfair.
//
//   node tools/gravity-authority.mjs [solarMasses]

import { blackHoleGeometry, gravityAt, steer, integrate, escapeLimit, SYSTEM_SPEED_LIMIT } from '../public/src/game/physics.js'
import { CRAFTS } from '../public/src/game/crafts.js'

const STEP = 1 / 120
const M = Number(process.argv[2] ?? 6)
const hole = blackHoleGeometry(M)
hole.x = 640
hole.y = 360

/**
 * @param hold  'hold'  parks the cursor on the hull, so the engine is idle.
 *              'flee'  holds it far out, away from the hole: full throttle.
 *              'nudge' parks it just outside the dead zone, away from the hole
 *                      -- the cheapest input that buys any thrust at all, and
 *                      the one a bare dead zone with no throttle ramp would
 *                      have let a player hover on forever.
 * @returns seconds until swallowed, or null if it got clear
 */
function drop (craft, r, hold, seconds = 12) {
  const body = { x: hole.x + r, y: hole.y, vx: 0, vy: 0 }
  const g = { x: 0, y: 0 }
  const t = { x: 0, y: 0 }
  for (let s = 0; s < seconds; s += STEP) {
    const tx = hold === 'flee' ? hole.x + r + 400
      : hold === 'nudge' ? body.x + craft.hull * 2.2 + 5
      : body.x
    const ty = hole.y
    gravityAt(body.x, body.y, [hole], g)
    steer(craft, body.x, body.y, body.vx, body.vy, tx, ty, t)
    integrate(body, g.x + t.x, g.y + t.y, dtOf(), dragOf(craft), SYSTEM_SPEED_LIMIT)
    const d = Math.hypot(body.x - hole.x, body.y - hole.y)
    if (d < hole.horizon) return s
    if (d > r * 3 + 400) return null       // comfortably away
  }
  return null
}
const dtOf = () => STEP
const dragOf = c => c.drag / c.mass

function boundary (craft, hold) {
  // Largest radius from which the craft is still lost.
  let lost = 0
  for (let r = Math.round(hole.horizon) + 4; r < 900; r += 4) {
    if (drop(craft, r, hold) !== null) lost = r
  }
  return lost
}

console.log(`Black hole ${M} Mo -- horizon ${hole.horizon.toFixed(0)}px, shadow ${hole.shadow.toFixed(0)}px\n`)
console.log('craft           thrust/mass   hands off   small nudge   pulling away   escapeLimit')
for (const craft of CRAFTS) {
  const idle = boundary(craft, 'hold')
  const nudge = boundary(craft, 'nudge')
  const flee = boundary(craft, 'flee')
  const el = escapeLimit(hole, craft)
  console.log(
    `${craft.name.padEnd(16)}${(craft.thrust / craft.mass).toFixed(0).padStart(6)}   ` +
    `${(idle + 'px').padStart(9)}   ${(nudge + 'px').padStart(11)}   ` +
    `${(flee + 'px').padStart(12)}   ${(el.toFixed(0) + 'px').padStart(11)}`)
}
console.log('\nEach column is the radius inside which that input still loses the craft.')
console.log('  hands off    cursor on the hull, engine idle -- doing nothing is fatal inside this')
console.log('  small nudge  cursor just outside the dead zone: the cheapest thrust available')
console.log('  pulling away cursor held far out, full throttle -- the fairness bound')
console.log('\nThe gap between the first two is what stops a dead zone alone being gamed: a')
console.log('player who only twitches the cursor is still taken. The gap between the last two')
console.log('is the room to realise the mistake and fly out of it.')
