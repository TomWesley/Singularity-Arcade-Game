// Enforces the spawn rules, because all of them are invisible until they are
// violated in front of a player:
//
//   1. Nothing may appear inside the board. Debris blinking into existence in
//      front of the player is not a hazard, it is a cheat.
//   2. Nothing may come out of the gate. That is the one direction a player who
//      has committed to the run is flying into and cannot dodge away from, so
//      its mouth keeps an exclusion band.
//   3. Everything enters from the right and crosses the board. That reverses an
//      earlier rule which kept debris away from the gate by sending it in from
//      above and below instead -- but on a level with a hole in the middle the
//      survivable lanes *are* the top and the bottom, so the old rule put every
//      entry exactly where the player flies, a hull's length away with no
//      approach to read. From the right, a rock is visible for its whole run.
//
//   node tools/spawn-audit.mjs [levelName]

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const name = process.argv[2] ?? 'level1'
const spec = JSON.parse(fs.readFileSync(new URL(`../levels/${name}.json`, import.meta.url), 'utf8'))
const level = buildLevel(spec)
const gate = level.gate

// The band a rock must not enter through, matching GATE_CLEARANCE in entities.
const CLEARANCE = 70
const bandTop = gate.y - gate.height / 2 - CLEARANCE
const bandBottom = gate.y + gate.height / 2 + CLEARANCE

let onScreen = 0, notRight = 0, outOfGate = 0, total = 0
let inward = 0, above = 0, below = 0
const angles = []

for (const a of level.asteroids) {
  for (let k = 0; k < 400; k++) {
    a.reset(level.holes)
    total++
    if (a.x > 0 && a.x < DESIGN_WIDTH && a.y > 0 && a.y < DESIGN_HEIGHT) onScreen++
    if (a.x <= DESIGN_WIDTH) notRight++
    if (a.y > bandTop && a.y < bandBottom) outOfGate++
    if (a.y < gate.y) above++; else below++
    if (a.vx < 0) inward++
    angles.push(Math.atan2(a.vy, a.vx) * 180 / Math.PI)
  }
}

// Spread of entry angles, measured off due-left (180deg).
const spread = angles.map(d => {
  let x = d - 180
  while (x > 180) x -= 360
  while (x < -180) x += 360
  return x
}).sort((a, b) => a - b)
const q = p => spread[Math.floor(spread.length * p)]

console.log(`spawns sampled: ${total}`)
console.log(`  inside the board:      ${onScreen}   (must be 0)`)
console.log(`  not off the right edge:${notRight}   (must be 0)`)
console.log(`  within the gate band:  ${outOfGate}   (must be 0 -- nothing comes out of the gate)`)
console.log(`  entering above / below the gate: ${above} / ${below}`)
console.log(`  travelling leftward:   ${inward} (${((inward / total) * 100).toFixed(0)}%; orbiters enter tangentially so this is not 100%)`)
console.log(`  entry angle off due-left: p10 ${q(0.1).toFixed(0)}deg  median ${q(0.5).toFixed(0)}deg  p90 ${q(0.9).toFixed(0)}deg`)

const fail = onScreen > 0 || notRight > 0 || outOfGate > 0
console.log(fail ? '\nFAILED' : '\nEvery spawn rule holds.')
process.exit(fail ? 1 : 0)
