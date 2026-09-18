// Loads every simulation module and drives the real Game through a full
// lifecycle with a fake canvas context, so wiring errors surface here rather
// than in the browser. Render modules are exercised against a recording stub
// that fails loudly on NaN coordinates -- the classic way a physics bug shows
// up as an invisible screen.

import fs from 'node:fs'
import { Game, STATE } from '../public/src/game/game.js'
import { buildLevel } from '../public/src/game/level.js'
import { CRAFTS } from '../public/src/game/crafts.js'
import { blackHoleGeometry } from '../public/src/game/physics.js'

let calls = 0
const bad = []

function stubGradient () {
  return { addColorStop () {} }
}

const ctx = new Proxy({}, {
  get (_, prop) {
    if (prop === 'canvas') return { width: 1280, height: 720 }
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return stubGradient
    if (prop === 'measureText') return () => ({ width: 40 })
    if (typeof prop === 'symbol') return undefined
    return (...args) => {
      calls++
      for (const a of args) {
        if (typeof a === 'number' && !Number.isFinite(a)) {
          bad.push(`${String(prop)}(${args.join(', ')})`)
        }
      }
    }
  },
  set () { return true }
})

// blackhole.js caches its static rings into an offscreen canvas, so headless
// runs need a document.createElement('canvas') that returns something usable.
globalThis.document = {
  createElement () {
    return { width: 0, height: 0, getContext: () => ctx }
  }
}

const spec = JSON.parse(fs.readFileSync(new URL('../levels/level1.json', import.meta.url), 'utf8'))
const level = buildLevel(spec)

console.log('Level built:')
for (const h of level.blackHoles) {
  console.log(`  ${String(h.solarMasses).padStart(4)} M_sun  horizon ${h.horizon.toFixed(1)}px  ISCO ${h.isco.toFixed(1)}px`)
}
for (const s of level.stars) {
  console.log(`  ${String(s.solarMasses).padStart(4)} M_sun  ${s.kind.padEnd(14)} radius ${s.radius.toFixed(1)}px`)
}
console.log(`  ${level.asteroids.length} asteroids, gate at (${level.gate.x.toFixed(0)}, ${level.gate.y.toFixed(0)})`)

// Renderers, against the stub.
const { drawBlackHole } = await import('../public/src/render/blackhole.js')
const { drawStar } = await import('../public/src/render/star.js')
const { drawAsteroid } = await import('../public/src/render/asteroid.js')
const { drawCraft } = await import('../public/src/render/craft.js')

const STEP = 1 / 120
let completed = 0
let lost = 0

for (const craft of CRAFTS) {
  const game = new Game()
  game.setLevel(buildLevel(spec))
  game.selectCraft(craft)

  for (let i = 0; i < 1200; i++) {
    game.update(STEP, { x: level.gate.x, y: level.gate.y })
    if (!Number.isFinite(game.body.x) || !Number.isFinite(game.body.y)) {
      throw new Error(`${craft.name}: non-finite position at step ${i}`)
    }
    if (!Number.isFinite(game.speed) || !Number.isFinite(game.gForce)) {
      throw new Error(`${craft.name}: non-finite telemetry at step ${i}`)
    }
    if (game.state === STATE.COMPLETE) { completed++; break }
    if (game.state === STATE.GAME_OVER) { lost++; break }
  }

  // Draw one frame of everything with this craft active.
  // level.holes carries stars as well now; each renderer gets only its own kind.
  for (const h of game.level.blackHoles) drawBlackHole(ctx, h)
  for (const s of game.level.stars) drawStar(ctx, s, 1.0)
  for (const a of game.level.asteroids) drawAsteroid(ctx, a)
  drawCraft(ctx, craft.id, 400, 300, 0.4, 0.7, 1.0)
}

console.log(`\nSimulated 4 craft: ${completed} reached the gate, ${lost} ran out of craft`)
console.log(`Render stub received ${calls} canvas calls`)
if (bad.length) {
  console.log(`\nNON-FINITE DRAW ARGS (${bad.length}):`)
  bad.slice(0, 8).forEach(b => console.log('  ' + b))
  process.exit(1)
}
console.log('No non-finite draw coordinates.')

// Sanity-check the physics against textbook values.
const g = blackHoleGeometry(10)
const errors = []
if (Math.abs(g.isco / g.horizon - 3) > 1e-9) errors.push('ISCO is not 3 r_s')
if (Math.abs(g.photonSphere / g.horizon - 1.5) > 1e-9) errors.push('photon sphere is not 1.5 r_s')
if (Math.abs(g.horizon - 40) > 0.02) errors.push(`10 M_sun horizon should be 40px, got ${g.horizon}`)
console.log(errors.length ? 'PHYSICS CHECK FAILED: ' + errors.join('; ') : 'Physics ratios check out (ISCO = 3 r_s, photon sphere = 1.5 r_s).')
if (errors.length) process.exit(1)

// ── Wreck effect ─────────────────────────────────────────────────────────────
// The two deaths must not behave alike: an asteroid strike throws debris away
// from the impact, a horizon crossing pulls it in. Both are asserted here
// because the animation is short and easy to break without noticing.
{
  const { Impact } = await import('../public/src/render/impact.js')
  const lvl = buildLevel(spec)
  const hole = lvl.holes[2]
  let s = 7
  const rng = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)

  const meanDist = (parts, cx, cy) => {
    const live = parts.filter(p => !p.dead)
    if (!live.length) return 0
    return live.reduce((t, p) => t + Math.hypot(p.x - cx, p.y - cy), 0) / live.length
  }

  // Impact: debris disperses.
  const burst = new Impact()
  burst.spawn({ x: 640, y: 360, vx: 200, vy: 0, cause: 'IMPACT', hole: null, craftId: 'superbug', rng })
  const d0 = meanDist(burst.parts, 640, 360)
  for (let i = 0; i < 60; i++) burst.update(1 / 120, lvl.holes)
  const d1 = meanDist(burst.parts, 640, 360)
  burst.draw(ctx)

  // Consumed: debris converges on the hole and is eaten.
  const fall = new Impact()
  fall.spawn({
    x: hole.x + hole.horizon * 1.5, y: hole.y, vx: 0, vy: 0,
    cause: 'CONSUMED', hole, craftId: 'voidwalker', rng
  })
  const c0 = meanDist(fall.parts, hole.x, hole.y)
  for (let i = 0; i < 150; i++) fall.update(1 / 120, lvl.holes)
  const c1 = meanDist(fall.parts, hole.x, hole.y)
  const eaten = fall.parts.filter(p => p.dead).length
  fall.draw(ctx)

  const finite = [...burst.parts, ...fall.parts].every(p => Number.isFinite(p.x) && Number.isFinite(p.y))

  console.log('\nWreck effect:')
  console.log(`  IMPACT   mean radius ${d0.toFixed(1)} -> ${d1.toFixed(1)} px  (debris must disperse)`)
  // Mean radius of the *survivors* is a bad measure here: the fragments still
  // alive late are precisely the ones on the widest orbits, so survivor bias
  // pushes it back up even while the cloud is draining. What matters is that
  // fragments are actually being eaten.
  console.log(`  CONSUMED mean radius ${c0.toFixed(1)} -> ${c1.toFixed(1)} px, ${eaten}/${fall.parts.length} crossed the horizon`)

  const problems = []
  if (d1 <= d0) problems.push('IMPACT debris did not disperse')
  if (eaten < fall.parts.length * 0.5) problems.push(`only ${eaten}/${fall.parts.length} CONSUMED fragments fell in`)
  if (c1 > c0 * 3) problems.push('CONSUMED debris is being ejected, not drawn in')
  if (!finite) problems.push('non-finite particle position')
  if (burst.active === false && fall.active === false) problems.push('both effects expired too early')
  console.log(problems.length ? '  FAILED: ' + problems.join('; ') : '  Both deaths behave as intended.')
  if (problems.length) process.exit(1)
}

// ── Round start ─────────────────────────────────────────────────────────────
// A life must open on a clear board: no rock visible at the instant play
// resumes, the first wave arriving together a moment later. Easy to regress by
// forgetting to clear the field on one of the two paths into PLAYING.
{
  const lvl = buildLevel(spec)
  const game = new Game()
  game.setLevel(lvl)
  game.selectCraft(CRAFTS[0])

  const visible = () => game.level.asteroids.filter(a =>
    a.active && a.x > 0 && a.x < 1280 && a.y > 0 && a.y < 720).length

  const atStart = visible()
  const counts = []
  for (let i = 0; i <= 240; i++) {
    if (i % 60 === 0) counts.push(`${(i / 120).toFixed(1)}s:${visible()}`)
    game.update(1 / 120, { x: 640, y: 360 })
    if (game.state !== STATE.PLAYING) break
  }

  // And again after losing a craft.
  const g2 = new Game()
  g2.setLevel(buildLevel(spec))
  g2.selectCraft(CRAFTS[0])
  for (let i = 0; i < 400; i++) g2.update(1 / 120, { x: 640, y: 360 })
  g2.loseCraft('IMPACT', null)
  const duringWreck = g2.level.asteroids.filter(a => a.active).length

  console.log('\nRound start:')
  console.log(`  visible rocks at the instant play begins: ${atStart}`)
  console.log(`  wave filling in: ${counts.join('  ')}`)
  console.log(`  active rocks while a wreck is on screen: ${duringWreck}`)

  const problems = []
  if (atStart !== 0) problems.push(`${atStart} rocks already on screen at round start`)
  if (duringWreck !== 0) problems.push(`${duringWreck} rocks still active during the wreck`)
  console.log(problems.length ? '  FAILED: ' + problems.join('; ') : '  Board opens clear and fills.')
  if (problems.length) process.exit(1)
}

// ── Gate transit ────────────────────────────────────────────────────────────
// Crossing the gate used to switch state in the same frame the craft touched
// it, so the hull stopped being drawn mid-flight and appeared to vanish. It
// should keep flying out under its own momentum.
{
  const lvl = buildLevel(spec)
  const game = new Game()
  game.setLevel(lvl)
  game.selectCraft(CRAFTS[0])

  // Place it just short of the gate, moving right, and let it cross.
  game.body.x = lvl.gate.x - lvl.gate.width / 2 - 8
  game.body.y = lvl.gate.y
  game.body.vx = 300
  game.body.vy = 0

  let crossedAt = null
  const track = []
  for (let i = 0; i < 260; i++) {
    game.update(1 / 120, { x: lvl.gate.x, y: lvl.gate.y })
    if (game.state === STATE.COMPLETE && crossedAt === null) crossedAt = game.body.x
    if (game.state === STATE.COMPLETE && i % 40 === 0) {
      track.push(`${game.phaseTime.toFixed(2)}s:x=${game.body.x.toFixed(0)}`)
    }
  }

  const travelled = game.body.x - crossedAt
  console.log('\nGate transit:')
  console.log(`  crossed at x=${crossedAt?.toFixed(0)}, ended at x=${game.body.x.toFixed(0)} (travelled ${travelled.toFixed(0)}px)`)
  console.log(`  ${track.join('  ')}`)

  const problems = []
  if (crossedAt === null) problems.push('never reached the gate')
  else if (travelled < 120) problems.push(`craft only travelled ${travelled.toFixed(0)}px after crossing`)
  if (game.state !== STATE.COMPLETE) problems.push('did not end in COMPLETE')
  console.log(problems.length ? '  FAILED: ' + problems.join('; ') : '  Craft flies out through the gate.')
  if (problems.length) process.exit(1)
}
