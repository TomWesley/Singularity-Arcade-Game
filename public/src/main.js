// Entry point: wires the canvas, the fixed-timestep loop and the renderers to
// the simulation. Draw order is deliberate -- field, then hazards, then the
// craft, then instruments on top.

import { Viewport, DESIGN_WIDTH, DESIGN_HEIGHT } from './core/viewport.js'
import { startLoop } from './core/loop.js'
import { Input } from './core/input.js'
import { Game, STATE } from './game/game.js'
import { loadLevel } from './game/level.js'
import { CRAFTS } from './game/crafts.js'

import { initTheme } from './render/theme.js'
import { Starfield } from './render/starfield.js'
import { drawBlackHole } from './render/blackhole.js'
import { drawAsteroid } from './render/asteroid.js'
import { drawCraft } from './render/craft.js'
import { drawHud } from './render/hud.js'
import {
  drawTitle, drawCraftSelect, drawCraftLost, drawComplete, drawGameOver,
  drawGate, craftAtPoint
} from './render/screens.js'

const canvas = document.getElementById('stage')
const ctx = canvas.getContext('2d', { alpha: false })

initTheme()

const viewport = new Viewport(canvas)
viewport.resize()
window.addEventListener('resize', () => viewport.resize())

const input = new Input(canvas, viewport)
const game = new Game()
const starfield = new Starfield()

let hoverCraft = -1

input.onClick((x, y) => {
  switch (game.state) {
    case STATE.TITLE:
      game.state = STATE.SELECT
      break
    case STATE.SELECT: {
      const i = craftAtPoint(x, y)
      if (i >= 0) game.selectCraft(CRAFTS[i])
      break
    }
    case STATE.COMPLETE:
    case STATE.GAME_OVER:
      game.restart()
      break
    default:
      break
  }
})

function update (dt) {
  starfield.update(dt)
  const target = game.state === STATE.PLAYING && input.hasPointer
    ? { x: input.x, y: input.y }
    : null
  game.update(dt, target)
  if (game.state === STATE.SELECT) hoverCraft = craftAtPoint(input.x, input.y)
}

function render (alpha) {
  const time = game.elapsed

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  viewport.apply(ctx)

  // The field is black. Not near-black with an undertone -- black. Everything
  // that reads on this board reads because it is the only lit thing on it.
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)

  starfield.draw(ctx)

  if (game.level) {
    drawGate(ctx, game.level.gate, time)

    for (const a of game.level.asteroids) drawAsteroid(ctx, a)

    const flying = game.state === STATE.PLAYING || game.state === STATE.LOST
    const activeCraft = flying ? game.craft : null
    const craftPos = flying ? game.body : null
    for (const h of game.level.holes) drawBlackHole(ctx, h, activeCraft, craftPos, time)

    if (game.state === STATE.PLAYING) {
      // Interpolate between fixed steps so motion is smooth regardless of the
      // gap between the last physics step and this frame.
      const x = game.prev.x + (game.body.x - game.prev.x) * alpha
      const y = game.prev.y + (game.body.y - game.prev.y) * alpha
      const heading = Math.atan2(game.body.vy, game.body.vx)
      const thrustMag = Math.min(1,
        Math.hypot(game.thrust.x, game.thrust.y) / (game.craft.thrust / game.craft.mass))
      drawCraft(ctx, game.craft.id, x, y, heading, thrustMag, time, 1.5 * game.craft.artScale)
    }
  }

  switch (game.state) {
    case STATE.TITLE: drawTitle(ctx, time); break
    case STATE.SELECT: drawCraftSelect(ctx, time, hoverCraft); break
    case STATE.PLAYING: drawHud(ctx, game); break
    case STATE.LOST: drawHud(ctx, game); drawCraftLost(ctx, game); break
    case STATE.COMPLETE: drawHud(ctx, game); drawComplete(ctx, game); break
    case STATE.GAME_OVER: drawGameOver(ctx, game); break
  }
}

loadLevel('level1')
  .then(level => {
    game.setLevel(level)
    startLoop({ update, render })
  })
  .catch(err => {
    console.error(err)
    const el = document.getElementById('boot-error')
    if (el) {
      el.textContent = `Failed to load level: ${err.message}`
      el.hidden = false
    }
  })
