// What speeds do asteroids actually reach? The velocity tail is only a useful
// read-out if its length maps onto the range that occurs in play, and the
// slingshots make that range much wider than the spawn values suggest.
import fs from 'node:fs'
import { buildLevel } from '../public/src/game/level.js'

const spec = JSON.parse(fs.readFileSync(new URL('../levels/level1.json', import.meta.url), 'utf8'))
const level = buildLevel(spec)
const accel = { x: 0, y: 0 }
const STEP = 1 / 120
const speeds = []

for (let i = 0; i < 120 * 40; i++) {
  for (const h of level.holes) h.update(STEP, i * STEP)
  for (const a of level.asteroids) {
    a.update(STEP, level.holes, accel)
    if (i % 10 === 0) speeds.push(Math.hypot(a.vx, a.vy))
  }
}

speeds.sort((a, b) => a - b)
const q = p => speeds[Math.floor(speeds.length * p)].toFixed(0)
console.log(`asteroid speeds over 40s (${speeds.length} samples), px/s:`)
console.log(`  min ${q(0)}   p25 ${q(0.25)}   median ${q(0.5)}   p75 ${q(0.75)}   p90 ${q(0.90)}   p99 ${q(0.99)}   max ${speeds.at(-1).toFixed(0)}`)
