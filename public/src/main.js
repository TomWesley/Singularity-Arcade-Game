// Entry point: wires the canvas, the fixed-timestep loop and the renderers to
// the simulation. Draw order is deliberate -- field, then hazards, then the
// craft, then instruments on top.

import { Viewport, DESIGN_WIDTH, DESIGN_HEIGHT } from './core/viewport.js'
import { startLoop } from './core/loop.js'
import { Input } from './core/input.js'
import { PauseController } from './core/pause.js'
import { Game, STATE } from './game/game.js'
import { loadLevel, loadManifest } from './game/level.js'
import { CRAFTS } from './game/crafts.js'

import { initTheme, ensureFonts } from './render/theme.js'
import { Backdrop } from './render/backdrop.js'
import { drawBlackHole } from './render/blackhole.js'
import { drawStar } from './render/star.js'
import { drawAsteroid } from './render/asteroid.js'
import { drawCraft, drawCraftWake } from './render/craft.js'
import { Impact } from './render/impact.js'
import { drawHud } from './render/hud.js'
import {
  drawTitle, drawCraftSelect, drawCraftLost, drawComplete, drawGameOver,
  drawGate, craftAtPoint, drawPauseOverlay, drawVictory
} from './render/screens.js'

const canvas = document.getElementById('stage')
const ctx = canvas.getContext('2d', { alpha: false })

initTheme()

const viewport = new Viewport(canvas)
viewport.resize()
window.addEventListener('resize', () => viewport.resize())

const input = new Input(canvas, viewport)
const game = new Game()
const backdrop = new Backdrop()
const impact = new Impact()
const pause = new PauseController()
let lastState = game.state
// Advances even while paused, so the overlay can animate against a frozen board.
let uiTime = 0

let hoverCraft = -1

// Guards the async level load so a double-click cannot advance twice.
let advancing = false

async function advance () {
  if (advancing) return
  advancing = true
  try {
    const next = game.levelIndex + 1
    const level = await loadLevel(game.campaign.order[next])
    game.setLevel(level, next)
    game.beginRound()
  } catch (err) {
    console.error(err)
    game.state = STATE.VICTORY      // fail to the end card rather than a dead board
  } finally {
    advancing = false
  }
}

input.onClick((x, y) => {
  // A tap that lifts a pause must not also count as a game click, or the player
  // resumes and selects a craft with the same touch.
  if (pause.press()) return

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
      // Lives and craft carry forward; only the board changes.
      if (game.isFinalLevel) game.state = STATE.VICTORY
      else advance()
      break
    case STATE.VICTORY:
    case STATE.GAME_OVER:
      game.restart()
      break
    default:
      break
  }
})

window.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    pause.toggleManual()
  }
})

function update (dt) {
  uiTime += dt
  pause.sync()
  if (pause.paused) return

  // The cursor is read in view coordinates and the craft flies in world ones,
  // so on a level wider than the screen the two only agree while the camera is
  // at the left end. Everywhere else the offset is the whole difference between
  // aiming where you are pointing and aiming a screen's width behind it.
  const target = game.state === STATE.PLAYING && input.hasPointer
    ? { x: input.x + game.camera, y: input.y }
    : null
  game.update(dt, target)

  // Fire the wreck effect on the transition into LOST, not while in it.
  if (game.state === STATE.LOST && lastState !== STATE.LOST) {
    impact.spawn({
      x: game.lossPoint.x,
      y: game.lossPoint.y,
      vx: game.lossVel.x,
      vy: game.lossVel.y,
      cause: game.lossCause,
      hole: game.lossHole,
      craftId: game.craft.id
    })
  }
  lastState = game.state
  if (game.level) impact.update(dt, game.level.holes)

  if (game.state === STATE.SELECT) hoverCraft = craftAtPoint(input.x, input.y)
}

function render (alpha) {
  const time = game.elapsed

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  viewport.apply(ctx)

  // The board is black, and everything that reads on it reads because it is the
  // only lit thing on it. The backdrop owns that fill -- and the optional sky
  // image that may one day sit behind it.
  backdrop.draw(ctx, game.level?.backdrop ?? null)

  if (game.level) {
    // Everything from here to restore() is drawn in world coordinates. The
    // backdrop deliberately sits outside it: it is a sky, and a sky does not
    // slide past when you travel. The HUD and the menus sit outside it too,
    // because they belong to the screen rather than to the world.
    ctx.save()
    ctx.translate(-Math.round(game.camera), 0)

    drawGate(ctx, game.level.gate, time, game.transitFlare, game.level.world.width)

    for (const a of game.level.asteroids) if (a.active) drawAsteroid(ctx, a)

    // Stars first: they are light sources and should sit behind the holes, which
    // are the only things on the board allowed to occlude anything.
    for (const s of game.level.stars) drawStar(ctx, s, time)
    for (const h of game.level.blackHoles) drawBlackHole(ctx, h)

    // Drawn through the transit too: the craft flies out of the gate rather than
    // being switched off the moment it touches it.
    const showCraft = game.state === STATE.PLAYING ||
      (game.state === STATE.COMPLETE && game.body.x < game.level.world.width + 120)
    if (showCraft) {
      // Interpolate between fixed steps so motion is smooth regardless of the
      // gap between the last physics step and this frame.
      const x = game.prev.x + (game.body.x - game.prev.x) * alpha
      const y = game.prev.y + (game.body.y - game.prev.y) * alpha
      const heading = Math.atan2(game.body.vy, game.body.vx)
      const thrustMag = Math.min(1,
        Math.hypot(game.thrust.x, game.thrust.y) / (game.craft.thrust / game.craft.mass))
      // Wake first, so the hull sits on top of its own exhaust.
      drawCraftWake(ctx, game.wake, x, y, game.craft.id,
        game.speed, game.craft.maxSpeed, game.craft.artScale)
      drawCraft(ctx, game.craft.id, x, y, heading, thrustMag, time, game.craft.artScale)
    }

    impact.draw(ctx)

    ctx.restore()
  }

  switch (game.state) {
    case STATE.TITLE: drawTitle(ctx, time); break
    case STATE.SELECT: drawCraftSelect(ctx, time, hoverCraft); break
    case STATE.PLAYING: drawHud(ctx, game); break
    case STATE.LOST: drawHud(ctx, game); drawCraftLost(ctx, game); break
    case STATE.COMPLETE: drawHud(ctx, game); drawComplete(ctx, game); break
    case STATE.VICTORY: drawVictory(ctx, game); break
    case STATE.GAME_OVER: drawGameOver(ctx, game); break
  }

  if (pause.paused) {
    drawPauseOverlay(ctx, pause.reason, viewport.cssWidth, viewport.cssHeight,
      viewport.dpr, uiTime)
  }
}

loadManifest()
  .then(campaign => {
    game.campaign = campaign
    return Promise.all([loadLevel(campaign.order[0]), ensureFonts()])
  })
  .then(([level]) => {
    game.setLevel(level, 0)
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
