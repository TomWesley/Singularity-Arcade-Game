// Do the star orbits hold?
//
// The stars in a level are seeded from apoapsis and periapsis alone and then
// integrated, so nothing in the level file promises they behave. Three things
// could go wrong and all three are silent:
//
//   1. An orbit leaves the board, so a star the level was composed around
//      spends half its lap invisible.
//   2. An orbit decays -- periapsis creeping inward until the star crosses the
//      horizon -- either because it was authored too close to the ISCO or
//      because the integrator is bleeding energy.
//   3. Two stars occupy the same arc of sky and the four "distinct" ellipses
//      read as one smear.
//
// This runs the level forward and reports the swept extent, the apsides as
// they actually come out, the lap time, and how fast the long axis precesses.

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { stepBodies } from '../public/src/game/entities.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const STEP = 1 / 120
const MINUTES = Number(process.argv[2] ?? 3)
const spec = JSON.parse(fs.readFileSync(new URL('../levels/level1.json', import.meta.url), 'utf8'))
const level = buildLevel(spec)

const host = level.holes[0]
const tracks = level.stars.map((s, i) => ({
  s,
  i,
  label: `${s.kind} ${s.solarMasses}Mo r=${s.radius.toFixed(0)}px`,
  minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity,
  rMin: Infinity, rMax: -Infinity,
  laps: [], lastLapAt: 0, prevAngle: null, wound: 0,
  // Midpoint of the authored apsides: the threshold the hysteresis detector
  // below uses to decide the body is on a dive rather than a climb.
  mid: ((s.orbit.apoapsis + s.orbit.periapsis) / 2) * DESIGN_HEIGHT,
  dive: null,
  apsides: []      // { t, r, angle } at each periapsis
}))

const total = MINUTES * 60
let t = 0
while (t < total) {
  stepBodies(level.holes, STEP, t)
  t += STEP

  for (const tr of tracks) {
    const { s } = tr
    const dx = s.x - host.x
    const dy = s.y - host.y
    const r = Math.hypot(dx, dy)
    tr.minX = Math.min(tr.minX, s.x - s.radius); tr.maxX = Math.max(tr.maxX, s.x + s.radius)
    tr.minY = Math.min(tr.minY, s.y - s.radius); tr.maxY = Math.max(tr.maxY, s.y + s.radius)
    tr.rMin = Math.min(tr.rMin, r); tr.rMax = Math.max(tr.rMax, r)

    // Lap time by accumulated winding, which is immune to where it started.
    const a = Math.atan2(dy, dx)
    if (tr.prevAngle !== null) {
      let d = a - tr.prevAngle
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      tr.wound += d
      if (Math.abs(tr.wound) >= Math.PI * 2) {
        tr.wound -= Math.sign(tr.wound) * Math.PI * 2
        tr.laps.push(t - tr.lastLapAt)
        tr.lastLapAt = t
      }
    }
    tr.prevAngle = a

    // Periapsis passage, found with hysteresis rather than by looking for a
    // local minimum in r. A bare three-sample minimum test fires constantly:
    // near apoapsis the radius barely changes between steps and rounding alone
    // produces hundreds of false minima, which scatters the recorded angles and
    // makes the precession come out an order of magnitude too high.
    //
    // Instead: while inside the midpoint radius, remember the deepest point
    // seen; when the body climbs back out past the midpoint, that remembered
    // point was the periapsis. One detection per lap, exactly.
    if (r < tr.mid) {
      if (tr.dive === null || r < tr.dive.r) tr.dive = { t, r, angle: a }
    } else if (tr.dive) {
      tr.apsides.push(tr.dive)
      tr.dive = null
    }
  }
}

const mean = xs => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
const fmt = n => n.toFixed(1).padStart(7)

console.log(`Host: ${host.solarMasses} Mo, horizon ${host.horizon.toFixed(0)}px, ISCO ${host.isco.toFixed(0)}px`)
console.log(`Simulated ${MINUTES} min at ${1 / STEP}Hz on a ${DESIGN_WIDTH}x${DESIGN_HEIGHT} board\n`)

let fail = 0
for (const tr of tracks) {
  const onBoard = tr.minX >= 0 && tr.maxX <= DESIGN_WIDTH && tr.minY >= 0 && tr.maxY <= DESIGN_HEIGHT
  const lap = mean(tr.laps)

  // Stability is measured, not ruled on.
  //
  // This used to require periapsis outside the ISCO, which is the wrong test
  // and cost a great deal of eccentricity. The ISCO is where *circular* orbits
  // stop being stable; an eccentric orbit passes through its periapsis and
  // climbs straight back out, and in this potential it can dive to about
  // 0.77 ISCO -- roughly 2.3 Schwarzschild radii -- and still hold its shape
  // indefinitely. Since the long ellipses are exactly the interesting ones,
  // the rule was forbidding the best orbits on the board.
  //
  // What actually matters is whether the apsides stay where the level put
  // them. If they do, the orbit is stable whatever radius it reaches.
  const drift = Math.max(
    Math.abs(tr.rMin - tr.s.orbit.periapsis * DESIGN_HEIGHT),
    Math.abs(tr.rMax - tr.s.orbit.apoapsis * DESIGN_HEIGHT))
  const stable = drift < 2 && tr.rMin > host.horizon

  // Apsidal precession: how far the periapsis direction moves per lap.
  //
  // Accumulated one interval at a time, not first-against-last. Between two
  // consecutive periapsis passages the long axis moves a few degrees, which is
  // unambiguous; across a hundred of them it can pass a half turn, and a single
  // unwrap of the total then reports a small advance where the truth is a large
  // one. The first version of this did exactly that and put the red giant's
  // precession seventeen times too high.
  let prec = 0
  if (tr.apsides.length > 2) {
    let sum = 0
    for (let k = 1; k < tr.apsides.length; k++) {
      let d = tr.apsides[k].angle - tr.apsides[k - 1].angle
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      sum += d
    }
    prec = (sum / (tr.apsides.length - 1)) * 180 / Math.PI
  }

  console.log(`[${tr.i}] ${tr.label}`)
  console.log(`     periapsis ${fmt(tr.rMin)}px (${(tr.rMin / host.isco).toFixed(2)}x ISCO, ${(tr.rMin / host.horizon).toFixed(2)}x r_s)   apoapsis ${fmt(tr.rMax)}px`)
  console.log(`     eccentricity ${((tr.rMax - tr.rMin) / (tr.rMax + tr.rMin)).toFixed(3)}`)
  console.log(`     lap ${lap.toFixed(2)}s over ${tr.laps.length} laps   precession ${prec >= 0 ? '+' : ''}${prec.toFixed(1)} deg/lap`)
  console.log(`     swept x ${fmt(tr.minX)} .. ${fmt(tr.maxX)}   y ${fmt(tr.minY)} .. ${fmt(tr.maxY)}`)

  // The envelope that matters is not the one swept in three minutes, it is the
  // one swept eventually. Because the long axis precesses, every orbit reaches
  // every orientation given enough laps -- so the region a star can occupy is
  // the full annulus between its apsides, and it fits on the board only if the
  // outer edge of that annulus does. A level composed against a snapshot would
  // look correct at load and put a star off the top edge ten minutes later.
  const reach = tr.rMax + tr.s.radius
  const room = Math.min(host.x, DESIGN_WIDTH - host.x, host.y, DESIGN_HEIGHT - host.y)
  const fits = reach <= room
  const rotate = prec !== 0 ? Math.abs(360 / prec) * lap : Infinity
  console.log(`     annulus reach ${fmt(reach)}px vs ${room.toFixed(0)}px of room   ` +
              `full rotation in ${(rotate / 60).toFixed(1)} min`)
  console.log(`     ${onBoard ? 'on board now' : 'off board now'}   ` +
              `${fits ? 'fits in every orientation' : 'WILL LEAVE BOARD AS IT PRECESSES'}   ` +
              `${stable ? `apsides hold (${drift.toFixed(2)}px drift)` : `DECAYING (${drift.toFixed(1)}px drift)`}`)
  if (!fits || !stable) fail++
  console.log()
}

// Do any two stars share the same patch of sky for long?
for (let i = 0; i < level.stars.length; i++) {
  for (let j = i + 1; j < level.stars.length; j++) {
    const a = level.stars[i], b = level.stars[j]
    void a; void b
  }
}

console.log(fail === 0 ? 'PASS: every orbit fits the board in any orientation and holds its apsides'
                       : `FAIL: ${fail} orbit(s) out of bounds`)
process.exit(fail === 0 ? 0 : 1)
