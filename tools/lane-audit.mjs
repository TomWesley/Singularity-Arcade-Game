// Is there always a way through?
//
// This only became a question when the camera stopped waiting. With a camera
// that followed the craft, a player could hang back west of a hazard for as
// long as they liked and cross when a gap opened -- so a level could close
// every route at once and it only meant "not yet". Under a forced scroll there
// is no "not yet": the camera delivers you to the hazard on a fixed schedule,
// and whatever the geometry happens to be doing when you arrive is what you get.
//
// So a level needs a band of height that the *terrain* -- the holes and the
// stars, the things that are always there -- can never close. Without one,
// arriving at the wrong moment kills a player who did nothing wrong, and that
// is not difficulty, it is a toss decided before they acted.
//
// What this measures is terrain only. Debris still flies through the clear
// bands, and it should: dodging rocks is the game. The point is that the rocks
// are something you can dodge *into somewhere*, which is only true if somewhere
// exists.
//
// "Blocked" is escapeLimit() -- the radius at which a craft's full thrust no
// longer beats the pull -- rather than the visible disc. A hole does not have
// to touch you to have you.
//
//   node tools/lane-audit.mjs [level]

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { stepBodies } from '../public/src/game/entities.js'
import { escapeLimit } from '../public/src/game/physics.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { DESIGN_HEIGHT } from '../public/src/game/constants.js'

const name = process.argv[2] ?? 'level1'
const MINUTES = Number(process.argv[3] ?? 5)
const STEP = 1 / 120
const level = buildLevel(JSON.parse(
  fs.readFileSync(new URL(`../levels/${name}.json`, import.meta.url), 'utf8')))

// The widest hull is the one that has to fit, so the lane is measured for it.
const craft = CRAFTS.reduce((a, b) => (b.hull > a.hull ? b : a))
const lethalOf = h => (h.horizon > 0 ? escapeLimit(h, craft) : h.radius + craft.hull)

// Every column a run has to cross: one per attractor, since those are where the
// height is actually contested.
const columns = [...new Set(level.holes.map(h => Math.round(h.homeX ?? h.x)))]
const marks = new Map(columns.map(c => [c, new Uint8Array(DESIGN_HEIGHT + 1)]))

let t = 0
while (t < MINUTES * 60) {
  stepBodies(level.holes, STEP, t)
  t += STEP
  for (const h of level.holes) {
    const lethal = lethalOf(h)
    for (const c of columns) {
      const dx = Math.abs(h.x - c)
      if (dx >= lethal) continue
      const half = Math.sqrt(lethal * lethal - dx * dx)
      const blocked = marks.get(c)
      const lo = Math.max(0, Math.floor(h.y - half))
      const hi = Math.min(DESIGN_HEIGHT, Math.ceil(h.y + half))
      for (let y = lo; y <= hi; y++) blocked[y] = 1
    }
  }
}

function bandsOf (blocked) {
  const out = []
  let run = 0
  for (let y = 0; y <= DESIGN_HEIGHT; y++) {
    if (!blocked[y]) run++
    else { if (run) out.push([y - run, y - 1]); run = 0 }
  }
  if (run) out.push([DESIGN_HEIGHT - run + 1, DESIGN_HEIGHT])
  return out
}

console.log(`${level.name} -- ${MINUTES} min, widest hull (${craft.name}, ${craft.hull}px)\n`)
for (const h of level.holes) {
  console.log(`  ${(h.kind ?? 'black hole').padEnd(14)} ${String(h.solarMasses).padStart(4)} Mo   ` +
    `lethal within ${lethalOf(h).toFixed(0)}px`)
}

let worst = Infinity
console.log('')
for (const c of columns.sort((a, b) => a - b)) {
  const bands = bandsOf(marks.get(c)).filter(([a, b]) => b - a >= 20)
  const widest = bands.reduce((m, [a, b]) => Math.max(m, b - a + 1), 0)
  worst = Math.min(worst, widest)
  const where = bands.map(([a, b]) => `${a}-${b}`).join('  ')
  console.log(`  column x=${String(c).padStart(4)}   clear: ${where || 'NOTHING'}   widest ${widest}px`)
}

// A hull needs its own width plus somewhere to move; anything under about
// forty pixels is a gap you thread rather than a lane you fly.
const MIN_LANE = 40
console.log(`\n  narrowest permanently clear lane across the level: ${worst}px`)
console.log(worst >= MIN_LANE
  ? `  PASS: a route is always open (needs ${MIN_LANE}px for a ${craft.hull}px hull).`
  : `  FAIL: the terrain can seal shut. Arriving at the wrong moment is unsurvivable.`)
process.exit(worst >= MIN_LANE ? 0 : 1)
