// Balance harness. Flies the real Game class -- same physics, same integrator,
// same collision rules -- under an autopilot, so a level can be checked without
// a browser and without a human.
//
//   node tools/simulate.mjs [levelName]
//
// The autopilot sweeps two-waypoint routes. It is not a great pilot, so the
// score to read is the *share* of routes that survive: too low and the level is
// unfair, too high and it is boring. It also reports per-craft results, which is
// what catches a level only one craft can finish.

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { stepBodies } from '../public/src/game/entities.js'
import { Game, STATE } from '../public/src/game/game.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const STEP = 1 / 120
const MAX_SECONDS = 25

/**
 * @param phase seconds to run the level's orbits forward before the craft
 *   launches.
 *
 * This matters on any level whose hazards move. Every run built the level fresh
 * and flew from t=0, so all 972 routes met the four stars in exactly the same
 * places -- and the harness confidently reported which lanes were safe when
 * what it had actually measured was one frozen arrangement. In play the stars
 * are wherever the orbits have carried them: the level runs under the title
 * screen and keeps running through a death, so no two attempts start alike.
 * Sweeping the phase is what makes the survival number mean something.
 */
function fly (spec, craft, waypoints, phase = 0) {
  const game = new Game()
  const level = buildLevel(spec)
  for (let t = 0; t < phase; t += STEP) {
    stepBodies(level.holes, STEP, t)
  }
  game.setLevel(level)
  game.craft = craft
  game.lives = 1
  game.state = STATE.PLAYING
  game.respawn()

  let wi = 0
  for (let t = 0; t < MAX_SECONDS / STEP; t++) {
    const { x, y } = game.body
    while (wi < waypoints.length && Math.hypot(waypoints[wi][0] - x, waypoints[wi][1] - y) < 55) wi++
    const target = wi < waypoints.length
      ? { x: waypoints[wi][0], y: waypoints[wi][1] }
      : { x: game.level.gate.x, y: game.level.gate.y }

    game.update(STEP, target)
    if (game.state === STATE.COMPLETE) return { time: game.runTime, cause: null }
    if (game.state !== STATE.PLAYING) return { time: null, cause: game.lossCause }
  }
  return { time: null, cause: 'TIMEOUT' }
}

const levelName = process.argv[2] ?? 'level1'
const spec = JSON.parse(fs.readFileSync(new URL(`../levels/${levelName}.json`, import.meta.url), 'utf8'))

const YS = [0.08, 0.2, 0.32, 0.44, 0.5, 0.56, 0.68, 0.8, 0.92].map(v => v * DESIGN_HEIGHT)
const XS = [0.34, 0.5, 0.66].map(v => v * DESIGN_WIDTH)
// Start offsets, in seconds. Deliberately not commensurate with any orbital
// period on the board, so the four stars are caught in genuinely different
// arrangements rather than the same one four times.
const PHASES = [0, 1.9, 4.3, 7.1, 10.7]

console.log(`Level: ${spec.name} (${levelName})`)
console.log(`Holes: ${spec.blackHoles.map(h => `${h.solarMasses}M`).join(', ')}   Asteroids: ${spec.asteroids?.count ?? 0}\n`)
console.log('craft            best    median   survived')

// What kills a route matters more than how many die. A level where every loss
// is CONSUMED is a level whose hole is placed across the only line through; one
// where every loss is IMPACT is a debris-density problem; a pile of TIMEOUTs
// means the route exists but nothing can fly it in the time allowed. The share
// alone cannot tell those apart, and they want opposite fixes.
const causes = {}
// Routes are also scored by lane, because the honest question for a level is
// not whether the average route survives -- it is whether a survivable lane
// exists and whether a player can find it. A hole dead centre is supposed to
// kill everything aimed through the middle.
const byLane = new Map()

let overall = 0, overallTried = 0
for (const craft of CRAFTS) {
  const times = []
  let tried = 0
  for (const ph of PHASES) for (const x1 of XS) for (const y1 of YS) for (const y2 of YS) {
    tried++
    const r = fly(spec, craft, [[x1, y1], [DESIGN_WIDTH * 0.86, y2]], ph)
    const t = r.time
    if (t !== null) times.push(t)
    else causes[r.cause ?? 'UNKNOWN'] = (causes[r.cause ?? 'UNKNOWN'] ?? 0) + 1
    const lane = (y1 / DESIGN_HEIGHT).toFixed(2)
    const rec = byLane.get(lane) ?? { ok: 0, n: 0 }
    rec.n++; if (t !== null) rec.ok++
    byLane.set(lane, rec)
  }
  times.sort((a, b) => a - b)
  overall += times.length; overallTried += tried
  const pct = ((times.length / tried) * 100).toFixed(0)
  const best = times.length ? times[0].toFixed(2) + 's' : '—'
  const med = times.length ? times[Math.floor(times.length / 2)].toFixed(2) + 's' : '—'
  console.log(`${craft.name.padEnd(16)}${best.padEnd(8)}${med.padEnd(9)}${times.length}/${tried} (${pct}%)`)
}
console.log('\nhow the losses happened:')
for (const [c, n] of Object.entries(causes).sort((a, b) => b[1] - a[1])) {
  const label = c === 'CONSUMED' ? 'crossed a horizon'
    : c === 'BURN' ? 'flew into a photosphere'
    : c === 'IMPACT' ? 'hit an asteroid'
    : c === 'TIMEOUT' ? 'never reached the gate'
    : c
  console.log(`  ${label.padEnd(26)}${String(n).padStart(4)}`)
}

console.log('\nsurvival by first-waypoint lane (height across the board):')
for (const [lane, r] of [...byLane].sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const pc = (r.ok / r.n) * 100
  const bar = '#'.repeat(Math.round(pc / 4))
  console.log(`  y=${lane}  ${String(Math.round(pc)).padStart(3)}%  ${bar}`)
}
console.log()

const pct = (overall / overallTried) * 100
console.log(`\noverall ${overall}/${overallTried} (${pct.toFixed(0)}%)`)
console.log(pct < 8 ? '  -> too punishing for a first level'
  : pct > 75 ? '  -> too soft; nothing is threatening the pilot'
  : '  -> reasonable difficulty band')
