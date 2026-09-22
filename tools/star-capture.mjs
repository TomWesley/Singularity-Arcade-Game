// Do asteroids actually orbit the stars?
//
// "In real life stars have asteroids orbit them all the time" -- so the field
// should show it, and the only honest way to know is to measure rather than
// assume it follows from the stars having mass.
//
// Two things have to be true at once for a rock to count as orbiting a star:
//
//   1. It is gravitationally bound to that star: specific orbital energy in the
//      star's rest frame, v_rel^2/2 - mu/r, is negative.
//   2. It is inside the star's Hill sphere, r_H ~ d (m/3M)^(1/3), where the
//      star's pull beats the black hole's tidal reach. Outside it the binding
//      is nominal -- the hole owns the rock and will take it within a swing.
//
// Note what this cannot be faked into. Nothing seeds these: the spawn rules
// forbid a rock appearing on screen, so every rock enters from off the board,
// and a two-body encounter cannot capture -- energy is conserved, so arriving
// unbound means leaving unbound. What makes it possible at all is that the
// stars *move*: rock, star and hole is a three-body problem, and three-body
// capture is real. It is how Jupiter picks up comets for a few orbits before
// losing them again, and a temporary satellite is exactly what should be seen.

import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'
import { DESIGN_HEIGHT } from '../public/src/game/constants.js'

const STEP = 1 / 120
const MINUTES = Number(process.argv[2] ?? 4)
const LEVEL = process.argv[3] ?? 'level1'
const spec = JSON.parse(fs.readFileSync(new URL(`../levels/${LEVEL}.json`, import.meta.url), 'utf8'))
const level = buildLevel(spec)
const host = level.blackHoles[0]
const accel = { x: 0, y: 0 }

const stats = level.stars.map(s => ({
  s,
  label: `${s.kind} ${s.solarMasses}Mo r=${s.radius.toFixed(0)}px`,
  episodes: [], hill: 0
}))
// One record per rock per star, tracking an ongoing capture.
const live = new Map()

let t = 0
const total = MINUTES * 60
while (t < total) {
  for (const h of level.holes) h.update(STEP, t)
  for (const a of level.asteroids) if (a.active) a.update(STEP, level.holes, accel)
  t += STEP

  for (const st of stats) {
    const s = st.s
    const d = Math.hypot(s.x - host.x, s.y - host.y)
    // Hill radius, recomputed as the star moves -- it breathes with distance.
    const hill = d * Math.cbrt(s.solarMasses / (3 * host.solarMasses))
    st.hill = hill

    for (const a of level.asteroids) {
      const key = `${st.label}|${level.asteroids.indexOf(a)}`
      const rec = live.get(key)
      if (!a.active) { if (rec) { live.delete(key) } continue }

      const rx = a.x - s.x, ry = a.y - s.y
      const r = Math.hypot(rx, ry)
      const vx = a.vx - (s.vx ?? 0), vy = a.vy - (s.vy ?? 0)
      const energy = (vx * vx + vy * vy) / 2 - s.mu / Math.max(r, s.soften)
      const bound = energy < 0 && r < hill && r > s.radius

      const ang = Math.atan2(ry, rx)
      if (bound) {
        if (!rec) {
          live.set(key, { t0: t, swept: 0, prev: ang, rMin: r })
        } else {
          let dAng = ang - rec.prev
          while (dAng > Math.PI) dAng -= Math.PI * 2
          while (dAng < -Math.PI) dAng += Math.PI * 2
          rec.swept += dAng
          rec.prev = ang
          rec.rMin = Math.min(rec.rMin, r)
        }
      } else if (rec) {
        st.episodes.push({ dur: t - rec.t0, swept: Math.abs(rec.swept) * 180 / Math.PI, rMin: rec.rMin })
        live.delete(key)
      }
    }
  }
}
for (const [key, rec] of live) {
  const st = stats.find(x => key.startsWith(x.label))
  st.episodes.push({ dur: t - rec.t0, swept: Math.abs(rec.swept) * 180 / Math.PI, rMin: rec.rMin })
}

console.log(`${level.name}: ${host.solarMasses} Mo hole, ${level.asteroids.length} rocks, ${MINUTES} min\n`)
let orbited = 0
for (const st of stats) {
  // An episode only counts as an orbit if the rock got most of the way round.
  const real = st.episodes.filter(e => e.swept > 120)
  const half = st.episodes.filter(e => e.swept > 180)
  const full = st.episodes.filter(e => e.swept > 360)
  orbited += real.length
  const longest = st.episodes.reduce((m, e) => Math.max(m, e.swept), 0)
  console.log(`${st.label}`)
  console.log(`   Hill radius ~${st.hill.toFixed(0)}px   captures ${st.episodes.length}`)
  console.log(`   swept >120deg: ${real.length}   >180deg: ${half.length}   full revolution: ${full.length}   best ${longest.toFixed(0)}deg`)
  if (real.length) {
    const mean = real.reduce((a, e) => a + e.dur, 0) / real.length
    console.log(`   mean time held: ${mean.toFixed(1)}s`)
  }
  console.log()
}
console.log(orbited > 0
  ? `Rocks genuinely orbit the stars: ${orbited} episodes past 120deg.`
  : 'No rock got a third of the way round any star -- the stars are scenery.')
