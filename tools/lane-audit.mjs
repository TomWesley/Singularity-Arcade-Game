// Can the terrain shut you out, and for how long?
//
// The first version of this asked whether a band of height existed that the
// holes and stars could *never* close, and treated anything less as unfair.
// That was too strict, and the reason is the thing a forced scroll does not
// actually take away: you still move freely inside the view.
//
// The camera sets the pace but not your position in it. Hang back at the left
// edge and you reach a given longitude much later than if you ride the right
// edge -- on level 1 that is a view 1259px wide against a 128px/s scroll, which
// is 9.8 seconds of latitude over when you arrive. The star configuration
// cycles roughly every two seconds, so a player choosing when to commit has
// about five different arrangements to pick from. That is a lot of control.
//
// So the real question is not "is a lane always open" but "how long can every
// lane be shut at once". A seal of half a second is a thing you wait out by
// easing back. A seal of fifteen seconds is a wall you cannot be early or late
// enough to avoid, and that is the unfair case -- the one where arriving at the
// wrong moment kills a player who did nothing wrong.
//
// Terrain only. Debris still crosses the open lanes and should: dodging rocks
// is the game. The point is that a rock is something you dodge *into somewhere*.
//
// "Blocked" is escapeLimit() -- the radius at which full thrust stops beating
// the pull -- not the visible disc. A hole does not have to touch you to have you.
//
//   node tools/lane-audit.mjs [level] [minutes]

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { stepBodies } from '../public/src/game/entities.js'
import { escapeLimit } from '../public/src/game/physics.js'
import { scrollSpeed } from '../public/src/core/camera.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const name = process.argv[2] ?? 'level1'
const MINUTES = Number(process.argv[3] ?? 5)
const STEP = 1 / 120
const level = buildLevel(JSON.parse(
  fs.readFileSync(new URL(`../levels/${name}.json`, import.meta.url), 'utf8')))

// The widest hull is the one that has to fit, and it needs its own width plus
// somewhere to move -- under about forty pixels is a gap you thread, not a lane.
const craft = CRAFTS.reduce((a, b) => (b.hull > a.hull ? b : a))
const MIN_LANE = 40
const lethalOf = h => (h.horizon > 0 ? escapeLimit(h, craft) : h.radius + craft.hull)

const columns = [...new Set(level.holes.map(h => Math.round(h.homeX ?? h.x)))]
  .sort((a, b) => a - b)

const scroll = scrollSpeed(level.world.width, level.world.sail)
const latitude = scroll > 0 ? (DESIGN_WIDTH - 2 * craft.hull) / scroll : Infinity

const state = new Map(columns.map(c => [c, { sealed: 0, longest: 0, open: 0, samples: 0, widest: 0 }]))
const blocked = new Uint8Array(DESIGN_HEIGHT + 1)

let t = 0
while (t < MINUTES * 60) {
  stepBodies(level.holes, STEP, t)
  t += STEP
  for (const c of columns) {
    blocked.fill(0)
    for (const h of level.holes) {
      const lethal = lethalOf(h)
      const dx = Math.abs(h.x - c)
      if (dx >= lethal) continue
      const half = Math.sqrt(lethal * lethal - dx * dx)
      const lo = Math.max(0, Math.floor(h.y - half))
      const hi = Math.min(DESIGN_HEIGHT, Math.ceil(h.y + half))
      for (let y = lo; y <= hi; y++) blocked[y] = 1
    }
    let run = 0, widest = 0
    for (let y = 0; y <= DESIGN_HEIGHT; y++) {
      if (!blocked[y]) { run++; if (run > widest) widest = run } else run = 0
    }
    const s = state.get(c)
    s.samples++
    s.widest = Math.max(s.widest, widest)
    if (widest < MIN_LANE) {
      s.sealed += STEP
      s.open = 0
      s.current = (s.current ?? 0) + STEP
      s.longest = Math.max(s.longest, s.current)
    } else {
      s.current = 0
    }
  }
}

console.log(`${level.name} -- ${MINUTES} min, widest hull (${craft.name}, ${craft.hull}px)\n`)
console.log(`  scroll ${scroll.toFixed(0)} px/s across a ${DESIGN_WIDTH}px view`)
console.log(`  timing latitude: ${latitude === Infinity ? 'unlimited (no scroll)' : latitude.toFixed(1) + 's'}` +
            `  -- how much later you reach a longitude by hanging back\n`)

let worstSeal = 0
for (const c of columns) {
  const s = state.get(c)
  const pct = (s.sealed / (s.samples * STEP)) * 100
  worstSeal = Math.max(worstSeal, s.longest)
  console.log(`  column x=${String(c).padStart(4)}   widest lane seen ${String(Math.round(s.widest)).padStart(3)}px   ` +
    `shut ${pct.toFixed(1)}% of the time   longest shut ${s.longest.toFixed(2)}s`)
}

// A seal is waitable if it is comfortably shorter than the latitude. The margin
// is generous because the latitude is spent, not free: easing back pins you
// against the edge that is pushing you, and you still have to cross the board
// vertically once the lane opens.
const budget = latitude / 4
console.log(`\n  longest shut-out: ${worstSeal.toFixed(2)}s against ${latitude === Infinity ? 'no limit' : latitude.toFixed(1) + 's'} of latitude`)
console.log(worstSeal <= budget
  ? `  PASS: any shut-out is short enough to ease back and wait out (budget ${budget.toFixed(1)}s).`
  : `  FAIL: the terrain shuts for ${worstSeal.toFixed(1)}s, longer than a player can be early or late enough to avoid.`)
process.exit(worstSeal <= budget ? 0 : 1)
