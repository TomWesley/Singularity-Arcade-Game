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
import { gravityAt, escapeLimit } from '../public/src/game/physics.js'
import { cameraFrozen } from '../public/src/core/camera.js'
import { stepBodies } from '../public/src/game/entities.js'
import { Game, STATE } from '../public/src/game/game.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const STEP = 1 / 120
const MAX_SECONDS = 90   // a level four screens wide is a long sail

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
// ── The pilot ────────────────────────────────────────────────────────────────
//
// It has to actually dodge, and it did not used to have to.
//
// When a route was two seconds of crossing a single board, aiming at a couple
// of waypoints was a fair enough stand-in for a person. Under a camera that
// travels, a route is thirty seconds long and the craft is held inside the
// view, so a waypoint far down the world is not somewhere it can go -- it just
// leans on the right-hand edge and holds one height until something hits it.
// Measured that way every level looks impossible: level 1 scored 1%, which
// says nothing about the level and everything about the pilot.
//
// So: hold a lane, keep station in the view, run from a well whose pull is a
// serious fraction of what the engine can answer, and slide aside for anything
// closing in. Still a crude pilot -- the number to read is the *share* of lanes
// that survive, not the absolute figure -- but it is a pilot rather than a
// stationary target.
const _g = { x: 0, y: 0 }
const clampY = y => Math.max(40, Math.min(DESIGN_HEIGHT - 40, y))

function pilot (game, laneY) {
  const { body, level, craft } = game
  const maxAccel = craft.thrust / craft.mass

  // A well that is winning is the only thing worth doing anything about.
  gravityAt(body.x, body.y, level.holes, _g)
  const load = Math.hypot(_g.x, _g.y)
  if (load > maxAccel * 0.35) {
    const ux = -_g.x / load
    const uy = -_g.y / load
    return { x: body.x + ux * 500, y: clampY(body.y + uy * 500) }
  }

  // Otherwise hold the lane, sitting far enough forward in the view to see
  // what is coming, and slide away from whatever is closing.
  let dodge = 0
  for (const h of level.holes) {
    const dx = body.x - h.x
    const dy = body.y - h.y
    const reach = escapeLimit(h, craft) * 1.9
    const d = Math.hypot(dx, dy)
    if (d < reach && dx < reach) dodge += Math.sign(dy || 1) * ((reach - d) / reach)
  }
  for (const a of level.asteroids) {
    if (!a.active) continue
    const ahead = a.x - body.x
    if (ahead < -50 || ahead > 320) continue
    const dy = body.y - a.y
    const near = 95
    if (Math.abs(dy) < near) dodge += Math.sign(dy || 1) * ((near - Math.abs(dy)) / near) * 0.55
  }

  // Hold back while a well sits squarely on the line ahead. Sliding aside is
  // only half of flying past something -- the other half is not arriving before
  // you have finished sliding, and a pilot that only ever moved up and down
  // walked into the middle of level 2's binary every time.
  let blocked = false
  for (const h of level.holes) {
    const ahead = h.x - body.x
    const off = Math.abs(h.y - body.y)
    const reach = escapeLimit(h, craft) * 1.9
    if (ahead > 0 && ahead < reach * 2.6 && off < reach) blocked = true
  }

  // While the camera is still travelling there is nowhere to hurry to, so sit
  // forward in the view where the next hazard is visible. Once it has stopped,
  // the gate is the only thing left and the run is on. A level with no travel
  // at all -- a single-screen board -- is frozen from the first frame, which is
  // exactly the old behaviour.
  const tx = blocked
    ? body.x - 60
    : cameraFrozen(game.camera, level.world.width)
      ? level.gate.x + 120
      : game.camera + DESIGN_WIDTH * 0.58
  return { x: tx, y: clampY(laneY + dodge * 165) }
}

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

  // Two lanes: one for the first half of the world, one for the second, so a
  // route is still a decision about where to fly and not just a starting height.
  const [laneA, laneB] = waypoints
  const half = level.world.width / 2
  for (let t = 0; t < MAX_SECONDS / STEP; t++) {
    const laneY = game.body.x < half ? laneA[1] : laneB[1]
    game.update(STEP, pilot(game, laneY))
    if (game.state === STATE.COMPLETE) return { time: game.runTime, cause: null }
    if (game.state !== STATE.PLAYING) return { time: null, cause: game.lossCause }
  }
  return { time: null, cause: 'TIMEOUT' }
}

const levelName = process.argv[2] ?? 'level1'
const spec = JSON.parse(fs.readFileSync(new URL(`../levels/${levelName}.json`, import.meta.url), 'utf8'))

const YS = [0.08, 0.2, 0.32, 0.44, 0.5, 0.56, 0.68, 0.8, 0.92].map(v => v * DESIGN_HEIGHT)
const WORLD = (spec.width ?? 1) * DESIGN_WIDTH
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
  // A route is now a pair of lane heights -- one for each half of the world --
  // and a start time. There used to be a third dimension of waypoint *x*, but
  // the pilot flies the view rather than a path through the world, so it was
  // multiplying the run time by three and changing nothing.
  for (const ph of PHASES) for (const y1 of YS) for (const y2 of YS) {
    tried++
    const r = fly(spec, craft, [[0, y1], [0, y2]], ph)
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
