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
import { Game, STATE } from '../public/src/game/game.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const STEP = 1 / 120
const MAX_SECONDS = 25

function fly (spec, craft, waypoints) {
  const game = new Game()
  game.setLevel(buildLevel(spec))
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
    if (game.state === STATE.COMPLETE) return game.runTime
    if (game.state !== STATE.PLAYING) return null
  }
  return null
}

const levelName = process.argv[2] ?? 'level1'
const spec = JSON.parse(fs.readFileSync(new URL(`../levels/${levelName}.json`, import.meta.url), 'utf8'))

const YS = [0.08, 0.2, 0.32, 0.44, 0.5, 0.56, 0.68, 0.8, 0.92].map(v => v * DESIGN_HEIGHT)
const XS = [0.34, 0.5, 0.66].map(v => v * DESIGN_WIDTH)

console.log(`Level: ${spec.name} (${levelName})`)
console.log(`Holes: ${spec.blackHoles.map(h => `${h.solarMasses}M`).join(', ')}   Asteroids: ${spec.asteroids?.count ?? 0}\n`)
console.log('craft            best    median   survived')

let overall = 0, overallTried = 0
for (const craft of CRAFTS) {
  const times = []
  let tried = 0
  for (const x1 of XS) for (const y1 of YS) for (const y2 of YS) {
    tried++
    const t = fly(spec, craft, [[x1, y1], [DESIGN_WIDTH * 0.86, y2]])
    if (t !== null) times.push(t)
  }
  times.sort((a, b) => a - b)
  overall += times.length; overallTried += tried
  const pct = ((times.length / tried) * 100).toFixed(0)
  const best = times.length ? times[0].toFixed(2) + 's' : '—'
  const med = times.length ? times[Math.floor(times.length / 2)].toFixed(2) + 's' : '—'
  console.log(`${craft.name.padEnd(16)}${best.padEnd(8)}${med.padEnd(9)}${times.length}/${tried} (${pct}%)`)
}
const pct = (overall / overallTried) * 100
console.log(`\noverall ${overall}/${overallTried} (${pct.toFixed(0)}%)`)
console.log(pct < 8 ? '  -> too punishing for a first level'
  : pct > 75 ? '  -> too soft; nothing is threatening the pilot'
  : '  -> reasonable difficulty band')
