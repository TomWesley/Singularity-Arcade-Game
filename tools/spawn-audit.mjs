// Enforces the spawn rules, because all of them are invisible until they are
// violated in front of a player:
//
//   1. Nothing may appear inside the board. Debris blinking into existence in
//      front of the player is not a hazard, it is a cheat.
//   2. Nothing may appear behind the craft. The rule was long written as "from
//      the right", but what it is really about is that a rock must be visible
//      for the length of its approach -- so you are flying into it rather than
//      being caught by it. Entering ahead of the craft satisfies that from any
//      edge, which is what lets debris come down from above and up from below
//      again without reintroducing the ambush.
//   3. Nothing may come out of the gate's mouth. That is the one direction a
//      player committed to the run cannot dodge away from. It is a fact about
//      the mouth, not about the whole right-hand side -- applied everywhere, as
//      it used to be, it excluded 49% of the height at every spawn point and
//      pinned the entire field into the top and bottom quarters.
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

// Mid-level, with the craft somewhere in the middle of its own view -- the
// case where "ahead of the craft" and "off the right edge" are different rules.
level.world.viewX = Math.min(600, Math.max(0, level.world.width - DESIGN_WIDTH))
level.world.craftX = level.world.viewX + DESIGN_WIDTH * 0.35

let onScreen = 0, behind = 0, outOfGate = 0, total = 0
let fromRight = 0, above = 0, below = 0
const speeds = []

for (const a of level.asteroids) {
  for (let k = 0; k < 400; k++) {
    a.reset(level.holes)
    total++
    const left = level.world.viewX
    const right = left + DESIGN_WIDTH
    if (a.x > left && a.x < right && a.y > 0 && a.y < DESIGN_HEIGHT) onScreen++
    if (a.x < level.world.craftX) behind++
    if (Math.abs(a.x - gate.x) < gate.width / 2 + CLEARANCE &&
        Math.abs(a.y - gate.y) < gate.height / 2 + CLEARANCE) outOfGate++
    if (a.x > right) fromRight++
    else if (a.y < 0) above++
    else below++
    speeds.push(Math.hypot(a.vx, a.vy))
  }
}

const sorted = speeds.sort((a, b) => a - b)
const q = p => sorted[Math.floor(sorted.length * p)]

console.log(`spawns sampled: ${total}`)
console.log(`  inside the board:      ${onScreen}   (must be 0)`)
console.log(`  behind the craft:      ${behind}   (must be 0)`)
console.log(`  in the gate's mouth:   ${outOfGate}   (must be 0)`)
console.log(`  entering from the leading edge / above / below: ` +
  `${(fromRight / total * 100).toFixed(0)}% / ${(above / total * 100).toFixed(0)}% / ${(below / total * 100).toFixed(0)}%`)
console.log(`  speed: p10 ${q(0.1).toFixed(0)}  median ${q(0.5).toFixed(0)}  p90 ${q(0.9).toFixed(0)} px/s ` +
  `(${(q(0.9) / q(0.1)).toFixed(1)}x spread -- a narrow band makes the field move as one object)`)

const fail = onScreen > 0 || behind > 0 || outOfGate > 0
console.log(fail ? '\nFAILED' : '\nEvery spawn rule holds.')
process.exit(fail ? 1 : 0)
