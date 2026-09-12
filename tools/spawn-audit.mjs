// Enforces the two spawn rules, because both are invisible until they are
// violated in front of a player:
//   1. Nothing may appear inside the board.
//   2. Nothing may approach from the right, where the gate is.
//
//   node tools/spawn-audit.mjs

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const spec = JSON.parse(fs.readFileSync(new URL('../levels/level1.json', import.meta.url), 'utf8'))
const level = buildLevel(spec)

let onScreen = 0, above = 0, below = 0, sideways = 0, total = 0
let inwardOK = 0

for (const a of level.asteroids) {
  for (let k = 0; k < 400; k++) {
    a.reset(level.holes)
    total++
    if (a.x > 0 && a.x < DESIGN_WIDTH && a.y > 0 && a.y < DESIGN_HEIGHT) onScreen++
    if (a.y < 0) above++
    else if (a.y > DESIGN_HEIGHT) below++
    else sideways++
    // Heading generally into the board, not away from it.
    if ((a.y < 0 && a.vy > 0) || (a.y > DESIGN_HEIGHT && a.vy < 0)) inwardOK++
  }
}

console.log(`spawns sampled: ${total}`)
console.log(`  inside the board:   ${onScreen}   (must be 0)`)
console.log(`  from above:         ${above}`)
console.log(`  from below:         ${below}`)
console.log(`  level with the board: ${sideways}   (must be 0 -- that includes the right edge)`)
console.log(`  heading inward:     ${inwardOK} (${((inwardOK / total) * 100).toFixed(0)}%; orbiters enter tangentially so this is not 100%)`)

const fail = onScreen > 0 || sideways > 0
console.log(fail ? '\nFAILED' : '\nBoth spawn rules hold.')
process.exit(fail ? 1 : 0)
