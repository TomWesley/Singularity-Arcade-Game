// Craft balance across level archetypes, not against one level.
//
// Tuning the roster against level 1 alone overfits it: there, holes outkill
// debris roughly three to one, so hitbox barely registers and whichever hull
// dodges best simply wins. A level with sixty fast rocks and two holes inverts
// that, and a three-body system rewards raw thrust over everything.
//
// So the target is not "every craft survives equally on level 1". It is that no
// hull leads the average, and every hull leads *somewhere* -- a roster where the
// right answer depends on the level is a roster worth choosing from.
//
//   node tools/balance-matrix.mjs

import { buildLevel } from '../public/src/game/level.js'
import { Game, STATE } from '../public/src/game/game.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'
import { gravityAt } from '../public/src/game/physics.js'

const STEP = 1 / 120
const gate = { x: 1.0, y: 0.5, width: 0.055, height: 0.3 }

const ARCHETYPES = [
  {
    name: 'gauntlet',
    note: 'two massive holes flanking a channel, moderate debris',
    spec: {
      id: 'a', name: 'Gauntlet', seed: 1337, spawn: { x: 0.075, y: 0.5 },
      blackHoles: [
        { x: 0.34, y: 0.0, solarMasses: 22 }, { x: 0.34, y: 1.0, solarMasses: 22 },
        { x: 0.62, y: 0.34, solarMasses: 3.5 },
        { x: 0.74, y: 0.62, solarMasses: 3, orbit: { radius: 0.1, period: 8.5, phase: 0.6 } }
      ],
      asteroids: { count: 34, orbiters: 6 }, gate
    }
  },
  {
    name: 'debris storm',
    note: 'few holes, sixty fast rocks -- hitbox is everything',
    spec: {
      id: 'b', name: 'Storm', seed: 4242, spawn: { x: 0.075, y: 0.5 },
      blackHoles: [{ x: 0.45, y: 0.22, solarMasses: 5 }, { x: 0.6, y: 0.8, solarMasses: 5 }],
      asteroids: { count: 60, orbiters: 0, speed: 1.6 }, gate
    }
  },
  {
    name: 'three-body',
    note: 'three equal masses in a triangle; chaotic field, thrust is king',
    spec: {
      id: 'c', name: 'Three Body', seed: 909, spawn: { x: 0.06, y: 0.5 },
      blackHoles: [
        { x: 0.4, y: 0.24, solarMasses: 7, orbit: { radius: 0.05, period: 13, phase: 0 } },
        { x: 0.4, y: 0.76, solarMasses: 7, orbit: { radius: 0.05, period: 13, phase: 2.09 } },
        { x: 0.7, y: 0.5, solarMasses: 7, orbit: { radius: 0.05, period: 13, phase: 4.19 } }
      ],
      asteroids: { count: 14, orbiters: 3 }, gate
    }
  },
  {
    name: 'open run',
    note: 'one hole, slow sparse debris -- a race, speed decides it',
    spec: {
      id: 'd', name: 'Open', seed: 77, spawn: { x: 0.05, y: 0.5 },
      blackHoles: [{ x: 0.5, y: 0.5, solarMasses: 11 }],
      asteroids: { count: 14, orbiters: 2, speed: 0.55 }, gate
    }
  },
  {
    name: 'warren',
    note: 'seven small holes -- fierce narrow wells, precision work',
    spec: {
      id: 'e', name: 'Warren', seed: 555, spawn: { x: 0.05, y: 0.5 },
      blackHoles: [
        { x: 0.26, y: 0.32, solarMasses: 2.2 }, { x: 0.3, y: 0.7, solarMasses: 2.5 },
        { x: 0.47, y: 0.2, solarMasses: 2.0 }, { x: 0.5, y: 0.55, solarMasses: 2.8 },
        { x: 0.63, y: 0.82, solarMasses: 2.2 }, { x: 0.72, y: 0.36, solarMasses: 2.5 },
        { x: 0.85, y: 0.62, solarMasses: 2.0 }
      ],
      asteroids: { count: 22, orbiters: 4 }, gate
    }
  }
]

const YS = [0.1, 0.24, 0.38, 0.5, 0.62, 0.76, 0.9].map(v => v * DESIGN_HEIGHT)
const XS = [0.34, 0.52, 0.7].map(v => v * DESIGN_WIDTH)

// The autopilot has to try to escape, or thrust cannot pay for itself and the
// matrix simply ranks hitboxes. A pilot who notices the field winning and turns
// radially outward is the minimum for a high-thrust hull to be worth anything --
// it is also what a human does, so without it the measurement is not of the game
// people will play.
const _a = { x: 0, y: 0 }
function pilotTarget (g, waypoint) {
  const maxAccel = g.craft.thrust / g.craft.mass
  gravityAt(g.body.x, g.body.y, g.level.holes, _a)
  const load = Math.hypot(_a.x, _a.y)

  if (load > maxAccel * 0.5) {
    // Run directly away from the pull, with a little of the intended heading
    // mixed back in so the escape still makes progress toward the gate.
    const ux = -_a.x / load
    const uy = -_a.y / load
    const tx = waypoint.x - g.body.x
    const ty = waypoint.y - g.body.y
    const tl = Math.hypot(tx, ty) || 1
    const bx = ux * 0.8 + (tx / tl) * 0.2
    const by = uy * 0.8 + (ty / tl) * 0.2
    const bl = Math.hypot(bx, by) || 1
    return { x: g.body.x + (bx / bl) * 400, y: g.body.y + (by / bl) * 400 }
  }
  return waypoint
}

function survival (spec, craft) {
  let wins = 0, runs = 0
  for (const x1 of XS) for (const y1 of YS) for (const y2 of YS) {
    runs++
    const g = new Game()
    g.setLevel(buildLevel(spec))
    g.craft = craft
    g.lives = 1
    g.state = STATE.PLAYING
    g.respawn()
    g.beginRound()
    const wps = [[x1, y1], [DESIGN_WIDTH * 0.86, y2]]
    let wi = 0
    for (let t = 0; t < 26 / STEP; t++) {
      const { x, y } = g.body
      while (wi < wps.length && Math.hypot(wps[wi][0] - x, wps[wi][1] - y) < 55) wi++
      const waypoint = wi < wps.length
        ? { x: wps[wi][0], y: wps[wi][1] }
        : { x: g.level.gate.x, y: g.level.gate.y }
      g.update(STEP, pilotTarget(g, waypoint))
      if (g.state === STATE.COMPLETE) { wins++; break }
      if (g.state !== STATE.PLAYING) break
    }
  }
  return (wins / runs) * 100
}

const table = {}
for (const a of ARCHETYPES) {
  table[a.name] = {}
  for (const c of CRAFTS) table[a.name][c.id] = survival(a.spec, c)
}

const w = 16
console.log('Survival % by archetype\n')
console.log('archetype'.padEnd(w) + CRAFTS.map(c => c.name.padEnd(14)).join(''))
for (const a of ARCHETYPES) {
  const row = CRAFTS.map(c => table[a.name][c.id])
  const best = Math.max(...row)
  console.log(a.name.padEnd(w) + row.map(v =>
    (v.toFixed(0) + '%' + (v === best ? ' *' : '  ')).padEnd(14)).join(''))
}

console.log('\n' + 'average'.padEnd(w) + CRAFTS.map(c => {
  const avg = ARCHETYPES.reduce((s, a) => s + table[a.name][c.id], 0) / ARCHETYPES.length
  return (avg.toFixed(1) + '%').padEnd(14)
}).join(''))

const avgs = CRAFTS.map(c => ARCHETYPES.reduce((s, a) => s + table[a.name][c.id], 0) / ARCHETYPES.length)
const spread = Math.max(...avgs) - Math.min(...avgs)
const leads = CRAFTS.filter(c =>
  ARCHETYPES.some(a => table[a.name][c.id] === Math.max(...CRAFTS.map(k => table[a.name][k.id]))))
console.log(`\nspread of averages: ${spread.toFixed(1)} points`)
console.log(`hulls that lead at least one archetype: ${leads.length}/${CRAFTS.length}` +
  (leads.length < CRAFTS.length
    ? ` -- ${CRAFTS.filter(c => !leads.includes(c)).map(c => c.name).join(', ')} never wins`
    : ''))
