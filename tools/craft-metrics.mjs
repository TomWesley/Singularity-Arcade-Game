// What each hull actually occupies, measured by rasterising it.
//
// There used to be a Node-side version of this that tracked path coordinates
// through a stub context. It was wrong, and wrong in a way that mattered: a
// Bezier's control points sit well outside the curve they describe, so any hull
// built from curves measured far larger than it draws. The Compiler came out at
// 63px against a true 35.
//
// So this renders each craft to a real canvas and counts lit pixels. That gives
// both the true extent and -- the part the balance depends on -- how much of
// that extent is actually filled. Two craft can be the same size on screen and
// differ by a third in how easy they are to hit.
//
//   npm run metrics        (needs the dev server up: npm start)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from '/Users/tomwesley/LocalGithubFiles/ArcadeGraphicsEngineAndLibrary/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pagePath = path.join(root, 'public', '__metrics.html')

const PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script type="module">
Promise.all([
  import('./src/render/craft.js'),
  import('./src/game/crafts.js'),
  import('./src/render/theme.js')
]).then(([{ drawCraft }, { CRAFTS }, { initTheme }]) => {
  initTheme()
  const S = 520
  function probe (craft, scale) {
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S
    const c = cv.getContext('2d')
    c.save(); c.translate(S / 2, S / 2)
    drawCraft(c, craft.id, 0, 0, -Math.PI / 2, 0, 0, scale)
    c.restore()
    const d = c.getImageData(0, 0, S, S).data
    let filled = 0, minX = S, maxX = 0, minY = S, maxY = 0
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (d[(y * S + x) * 4 + 3] > 40) {
        filled++
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
    const hw = Math.max(S / 2 - minX, maxX - S / 2)
    const hh = Math.max(S / 2 - minY, maxY - S / 2)
    return { filled, hw, hh, mean: Math.sqrt(hw * hh) }
  }
  const out = CRAFTS.map(craft => {
    const nat = probe(craft, 1)
    const live = probe(craft, craft.artScale)
    return {
      name: craft.name, hull: craft.hull,
      natural: +nat.mean.toFixed(2),
      onScreen: +live.mean.toFixed(1),
      hw: +live.hw.toFixed(1), hh: +live.hh.toFixed(1),
      fill: +(live.filled / (Math.PI * live.mean * live.mean)).toFixed(3),
      equivR: +Math.sqrt(live.filled / Math.PI).toFixed(1)
    }
  })
  document.title = JSON.stringify(out)
}).catch(e => { document.title = 'ERR ' + e.message })
</script></body></html>`

fs.writeFileSync(pagePath, PAGE)
try {
  const b = await puppeteer.launch({
    headless: 'new', args: ['--no-sandbox', '--disable-gpu'], protocolTimeout: 240000
  })
  const p = await b.newPage()
  await p.goto('http://localhost:3000/__metrics.html', { waitUntil: 'load', timeout: 30000 })
  await p.waitForFunction(() => document.title !== '', { timeout: 40000 })
  const title = await p.title()
  await b.close()

  if (title.startsWith('ERR')) { console.error(title); process.exit(1) }
  const rows = JSON.parse(title)
  console.log('hull            natural  on-screen  half-w  half-h  fill%   equivR  hitbox')
  for (const r of rows) {
    console.log(
      r.name.padEnd(16) + String(r.natural).padEnd(9) + String(r.onScreen).padEnd(11) +
      String(r.hw).padEnd(8) + String(r.hh).padEnd(8) +
      (r.fill * 100).toFixed(1).padEnd(8) + String(r.equivR).padEnd(8) + r.hull)
  }
  const sizes = rows.map(r => r.onScreen)
  const spread = ((Math.max(...sizes) / Math.min(...sizes) - 1) * 100).toFixed(1)
  console.log(`\non-screen size spread: ${spread}%  (should be small -- shape varies, size should not)`)
} finally {
  fs.rmSync(pagePath, { force: true })
}
