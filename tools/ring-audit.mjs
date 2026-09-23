// Does a level's mutually-orbiting system hold together?
//
// Four black holes cannot simply be placed on a board. A flat four-body system
// tears itself apart in about a second however carefully it is seeded, and that
// is not a bug in the integrator -- it is the reason real quadruple stars are
// nearly always "2+2": two tight binaries in a wide mutual orbit. A two-body
// orbit is exact and exactly stable; a hierarchy of them inherits that.
//
// So this checks the two things a hierarchy has to satisfy:
//
//   * the inner binary keeps its separation
//   * the outer bodies stay on the board and stay bounded, which for a
//     circumbinary orbit means sitting outside the critical radius -- about
//     2.3x the binary separation. Inside it the orbit is chaotic and leaves.
//
//   node tools/ring-audit.mjs [level] [minutes]

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { stepBodies } from '../public/src/game/entities.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const name = process.argv[2] ?? 'level2'
const MINUTES = Number(process.argv[3] ?? 10)
const STEP = 1 / 120
const spec = JSON.parse(fs.readFileSync(new URL(`../levels/${name}.json`, import.meta.url), 'utf8'))
const level = buildLevel(spec)

const ringed = level.holes.filter(h => h.ring)
if (!ringed.length) { console.log(`${level.name}: no mutually orbiting system here`); process.exit(0) }

// Group the same way buildLevel does: by centre and radius, inner first.
const groups = new Map()
for (const b of ringed) {
  const key = `${b.ring.x},${b.ring.y}|${b.ring.radius}`
  if (!groups.has(key)) groups.set(key, { radius: b.ring.radius, members: [] })
  groups.get(key).members.push(b)
}
const tiers = [...groups.values()].sort((a, b) => a.radius - b.radius)
const centre = { x: (ringed[0].ring.x ?? 0.5) * DESIGN_WIDTH, y: (ringed[0].ring.y ?? 0.5) * DESIGN_HEIGHT }

const track = tiers.map(t => ({
  t, rMin: Infinity, rMax: 0, sepMin: Infinity, sepMax: 0,
  wound: 0, prev: Math.atan2(t.members[0].y - centre.y, t.members[0].x - centre.x), laps: 0, lapAt: 0, lapTimes: []
}))

let time = 0
while (time < MINUTES * 60) {
  stepBodies(level.holes, STEP, time)
  time += STEP
  for (const k of track) {
    for (const b of k.t.members) {
      const r = Math.hypot(b.x - centre.x, b.y - centre.y)
      k.rMin = Math.min(k.rMin, r); k.rMax = Math.max(k.rMax, r)
    }
    if (k.t.members.length === 2) {
      const [a, b] = k.t.members
      const s = Math.hypot(a.x - b.x, a.y - b.y)
      k.sepMin = Math.min(k.sepMin, s); k.sepMax = Math.max(k.sepMax, s)
    }
    const a = Math.atan2(k.t.members[0].y - centre.y, k.t.members[0].x - centre.x)
    let d = a - k.prev
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    k.wound += d; k.prev = a
    if (Math.abs(k.wound) >= Math.PI * 2) {
      k.wound -= Math.sign(k.wound) * Math.PI * 2
      k.laps++; k.lapTimes.push(time - k.lapAt); k.lapAt = time
    }
  }
}

const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
console.log(`${level.name} -- ${ringed.length} holes, ${MINUTES} min at ${1 / STEP}Hz\n`)
let fail = 0
const innerSep = mean([track[0].sepMin, track[0].sepMax])
track.forEach((k, i) => {
  const label = i === 0 ? 'inner pair' : `tier ${i + 1}`
  const reach = k.rMax + k.t.members[0].shadow
  const onBoard = reach <= Math.min(centre.x, DESIGN_WIDTH - centre.x, centre.y, DESIGN_HEIGHT - centre.y)
  const wobble = ((k.rMax - k.rMin) / mean([k.rMin, k.rMax])) * 100
  console.log(`${label}: ${k.t.members.length} x ${k.t.members[0].solarMasses} Mo`)
  console.log(`   radius ${k.rMin.toFixed(0)} .. ${k.rMax.toFixed(0)}px  (wobble ${wobble.toFixed(1)}%)   reach ${reach.toFixed(0)}px`)
  if (k.t.members.length === 2) {
    console.log(`   separation ${k.sepMin.toFixed(1)} .. ${k.sepMax.toFixed(1)}px  ` +
                `(${(((k.sepMax - k.sepMin) / innerSep) * 100).toFixed(2)}% breathing)`)
  }
  console.log(`   lap ${mean(k.lapTimes).toFixed(2)}s over ${k.laps} laps`)
  if (i > 0) {
    const ratio = mean([k.rMin, k.rMax]) / innerSep
    console.log(`   sits at ${ratio.toFixed(1)}x the inner separation  (needs > 2.3 to be bound)`)
    if (ratio < 2.3) fail++
  }
  console.log(`   ${onBoard ? 'stays on the board' : 'LEAVES THE BOARD'}`)
  if (!onBoard) fail++
  console.log()
})
console.log(fail === 0 ? 'PASS: the hierarchy holds.' : `FAIL: ${fail} problem(s)`)
process.exit(fail === 0 ? 0 : 1)
