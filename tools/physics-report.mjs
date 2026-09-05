// Prints the geometry every black hole mass produces, so level design decisions
// are made against real numbers instead of guesses.
//   node tools/physics-report.mjs

import { blackHoleGeometry, escapeLimit, circularOrbitSpeed, schwarzschildRadiusMeters } from '../public/src/game/physics.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { SOLAR_MASS } from '../public/src/game/constants.js'

const pad = (v, n) => String(v).padEnd(n)

console.log('Geometry derived from real constants (G, c, M_sun):\n')
console.log('M(sun)  r_s(km)   horizon  photon   ISCO    escape:Superbug')
for (const m of [3, 5, 10, 22, 40]) {
  const g = blackHoleGeometry(m)
  const rsKm = schwarzschildRadiusMeters(m * SOLAR_MASS) / 1000
  console.log(
    pad(m, 8) + pad(rsKm.toFixed(1), 10) + pad(g.horizon.toFixed(1), 9) +
    pad(g.photonSphere.toFixed(1), 9) + pad(g.isco.toFixed(1), 8) +
    escapeLimit(g, CRAFTS[0]).toFixed(1)
  )
}

console.log('\nCraft thrust authority — what each can fight gravity with:')
for (const c of CRAFTS) {
  console.log(`  ${pad(c.name, 14)} thrust/mass = ${String((c.thrust / c.mass).toFixed(0)).padStart(5)} px/s^2   maxSpeed ${c.maxSpeed}`)
}

for (const m of [22, 3.5]) {
  const g = blackHoleGeometry(m)
  console.log(`\n${m}-solar-mass hole  (horizon ${g.horizon.toFixed(0)}px, ISCO ${g.isco.toFixed(0)}px):`)
  for (const r of [g.horizon + 8, g.horizon + 30, g.isco, g.isco * 2, 300, 500]) {
    if (r < g.horizon) continue
    const a = g.mu / ((r - g.horizon) ** 2)
    console.log(`  r=${String(r.toFixed(0)).padStart(4)}px   a=${String(a.toFixed(0)).padStart(7)} px/s^2   v_circ=${circularOrbitSpeed(g, r).toFixed(0)} px/s`)
  }
}
