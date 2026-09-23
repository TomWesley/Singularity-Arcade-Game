// Draws what the star orbits actually trace, as a PNG.
//
// Numbers in a table cannot answer whether four orbits read as four distinct
// shapes or as one grey smear, and that is the only question that matters when
// composing a level. This rasterises the paths directly -- no browser, no
// canvas dependency, just a hand-rolled PNG -- so the composition can be looked
// at rather than inferred.
//
//   node tools/star-paths.mjs [seconds] [out.png]

import fs from 'node:fs'
import zlib from 'node:zlib'
import { buildLevel } from '../public/src/game/level.js'
import { stepBodies } from '../public/src/game/entities.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../public/src/game/constants.js'

const SECONDS = Number(process.argv[2] ?? 30)
const OUT = process.argv[3] ?? 'star-paths.png'
const LEVEL = process.argv[4] ?? null
const STEP = 1 / 120

const spec = JSON.parse(fs.readFileSync(
  LEVEL ?? new URL('../levels/level1.json', import.meta.url), 'utf8'))
spec.asteroids.count = 0
const level = buildLevel(spec)
const host = level.holes[0]

const W = DESIGN_WIDTH
const H = DESIGN_HEIGHT
const px = new Uint8Array(W * H * 3)

function plot (x, y, r, g, b, a = 1) {
  const ix = Math.round(x)
  const iy = Math.round(y)
  if (ix < 0 || iy < 0 || ix >= W || iy >= H) return
  const o = (iy * W + ix) * 3
  px[o] = Math.min(255, px[o] * (1 - a) + r * a)
  px[o + 1] = Math.min(255, px[o + 1] * (1 - a) + g * a)
  px[o + 2] = Math.min(255, px[o + 2] * (1 - a) + b * a)
}

function disc (cx, cy, rad, r, g, b, a = 1) {
  for (let y = -rad; y <= rad; y++) {
    for (let x = -rad; x <= rad; x++) {
      if (x * x + y * y <= rad * rad) plot(cx + x, cy + y, r, g, b, a)
    }
  }
}

function ring (cx, cy, rad, r, g, b) {
  for (let t = 0; t < 1440; t++) {
    const a = (t / 1440) * Math.PI * 2
    plot(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, r, g, b, 0.55)
  }
}

// One colour per star, chosen to be separable rather than accurate.
const COLORS = [
  [120, 200, 255],   // white dwarf   -- blue
  [255, 215, 120],   // main-sequence -- gold
  [255, 120, 110],   // red giant     -- red
  [150, 255, 170]    // main-sequence -- green
]

// The board, the hole and its ISCO, the gate and the spawn point.
ring(host.x, host.y, host.isco, 60, 60, 70)
disc(Math.round(host.x), Math.round(host.y), Math.round(host.horizon), 255, 255, 255, 0.9)
for (let y = level.gate.y - level.gate.height / 2; y <= level.gate.y + level.gate.height / 2; y++) {
  for (let x = level.gate.x - level.gate.width; x < W; x++) plot(x, y, 40, 90, 60, 0.9)
}
disc(Math.round(level.spawn.x), Math.round(level.spawn.y), 5, 255, 255, 255, 0.9)

let t = 0
const marks = level.stars.map(() => [])
while (t < SECONDS) {
  stepBodies(level.holes, STEP, t)
  t += STEP
  level.stars.forEach((s, i) => {
    const [r, g, b] = COLORS[i]
    plot(s.x, s.y, r, g, b, 0.30)
    // A tick every second, so speed along the path is visible: ticks bunch up
    // where the star is slow and stretch out where it is fast.
    if (Math.floor(t) !== Math.floor(t - STEP)) marks[i].push({ x: s.x, y: s.y })
  })
}

// Final positions, drawn at true size, plus the one-second ticks.
level.stars.forEach((s, i) => {
  const [r, g, b] = COLORS[i]
  for (const m of marks[i]) disc(Math.round(m.x), Math.round(m.y), 2, r, g, b, 0.9)
  disc(Math.round(s.x), Math.round(s.y), Math.round(s.radius), r, g, b, 0.85)
})

// --- minimal PNG writer -----------------------------------------------------
function crc32 (buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk (type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const raw = Buffer.alloc(H * (W * 3 + 1))
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1)
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
fs.writeFileSync(OUT, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0))
]))
console.log(`${OUT}: ${SECONDS}s of orbits, ${W}x${H}`)
