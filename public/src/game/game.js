// Game state, simulation and rules. Knows nothing about drawing.

import { gravityAt, steer, integrate, escapeLimit } from './physics.js'
import { CRAFTS } from './crafts.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

export const STATE = {
  TITLE: 'TITLE',
  SELECT: 'SELECT',
  PLAYING: 'PLAYING',
  LOST: 'LOST',
  COMPLETE: 'COMPLETE',
  GAME_OVER: 'GAME_OVER'
}

const START_LIVES = 3
const RESPAWN_SECONDS = 1.6
const COMPLETE_SECONDS = 2.2

export class Game {
  constructor () {
    this.state = STATE.TITLE
    this.level = null
    this.craft = CRAFTS[0]
    this.lives = START_LIVES
    this.elapsed = 0        // wall clock for animation
    this.runTime = 0        // scored time for the current level attempt
    this.phaseTime = 0      // time inside LOST / COMPLETE
    this.target = { x: DESIGN_WIDTH / 2, y: DESIGN_HEIGHT / 2 }

    // Craft body. prev* are kept so the renderer can interpolate between
    // fixed steps instead of snapping.
    this.body = { x: 0, y: 0, vx: 0, vy: 0 }
    this.prev = { x: 0, y: 0 }

    // Diagnostics the HUD reads.
    this.gravity = { x: 0, y: 0 }
    this.thrust = { x: 0, y: 0 }
    this.speed = 0
    this.gForce = 0
    this.nearestHoleDanger = 0   // 0..1, how deep into a capture zone we are

    this._accel = { x: 0, y: 0 }
  }

  setLevel (level) {
    this.level = level
    this.respawn()
  }

  selectCraft (craft) {
    this.craft = craft
    this.lives = START_LIVES
    this.runTime = 0
    this.respawn()
    this.state = STATE.PLAYING
  }

  respawn () {
    if (!this.level) return
    this.body.x = this.level.spawn.x
    this.body.y = this.level.spawn.y
    this.body.vx = 0
    this.body.vy = 0
    this.prev.x = this.body.x
    this.prev.y = this.body.y
    this.target.x = this.level.spawn.x + 60
    this.target.y = this.level.spawn.y
    this.phaseTime = 0
  }

  restart () {
    this.lives = START_LIVES
    this.runTime = 0
    this.state = STATE.TITLE
    this.respawn()
  }

  update (dt, target) {
    this.elapsed += dt
    if (!this.level) return

    // Holes and asteroids keep moving on every screen -- the menus are played
    // over a live simulation, which is most of why the title screen feels alive.
    for (const h of this.level.holes) h.update(dt, this.elapsed)
    for (const a of this.level.asteroids) a.update(dt, this.level.holes, this._accel)

    switch (this.state) {
      case STATE.PLAYING:
        this.updateFlight(dt, target)
        break
      case STATE.LOST:
        this.phaseTime += dt
        if (this.phaseTime >= RESPAWN_SECONDS) {
          if (this.lives > 0) {
            this.respawn()
            this.state = STATE.PLAYING
          } else {
            this.state = STATE.GAME_OVER
          }
        }
        break
      case STATE.COMPLETE:
        this.phaseTime += dt
        break
      default:
        break
    }
  }

  updateFlight (dt, target) {
    this.runTime += dt
    if (target) {
      this.target.x = target.x
      this.target.y = target.y
    }

    this.prev.x = this.body.x
    this.prev.y = this.body.y

    gravityAt(this.body.x, this.body.y, this.level.holes, this.gravity)
    steer(
      this.craft,
      this.body.x, this.body.y,
      this.body.vx, this.body.vy,
      this.target.x, this.target.y,
      this.thrust
    )

    integrate(
      this.body,
      this.gravity.x + this.thrust.x,
      this.gravity.y + this.thrust.y,
      dt,
      this.craft.drag
    )

    // Walls are solid and bleed off the perpendicular velocity rather than
    // clamping position silently -- being pinned to an edge should feel like
    // hitting something.
    const r = this.craft.hull
    if (this.body.x < r) { this.body.x = r; this.body.vx = Math.abs(this.body.vx) * 0.25 }
    if (this.body.x > DESIGN_WIDTH - r) { this.body.x = DESIGN_WIDTH - r; this.body.vx = -Math.abs(this.body.vx) * 0.25 }
    if (this.body.y < r) { this.body.y = r; this.body.vy = Math.abs(this.body.vy) * 0.25 }
    if (this.body.y > DESIGN_HEIGHT - r) { this.body.y = DESIGN_HEIGHT - r; this.body.vy = -Math.abs(this.body.vy) * 0.25 }

    this.speed = Math.hypot(this.body.vx, this.body.vy)
    this.gForce = Math.hypot(this.gravity.x, this.gravity.y)
    this.nearestHoleDanger = this.dangerLevel()

    if (this.checkHazards()) return

    if (this.level.gate.contains(this.body.x, this.body.y)) {
      this.state = STATE.COMPLETE
      this.phaseTime = 0
    }
  }

  // How far inside the point of no return we are, 0..1, for HUD warnings.
  dangerLevel () {
    let worst = 0
    for (const h of this.level.holes) {
      const d = Math.hypot(this.body.x - h.x, this.body.y - h.y)
      const cr = escapeLimit(h, this.craft)
      if (d < cr) worst = Math.max(worst, 1 - (d - h.horizon) / Math.max(1, cr - h.horizon))
    }
    return Math.max(0, Math.min(1, worst))
  }

  checkHazards () {
    for (const h of this.level.holes) {
      if (Math.hypot(this.body.x - h.x, this.body.y - h.y) < h.horizon) {
        this.loseCraft('CONSUMED')
        return true
      }
    }
    for (const a of this.level.asteroids) {
      if (Math.hypot(this.body.x - a.x, this.body.y - a.y) < a.radius + this.craft.hull * 0.5) {
        this.loseCraft('IMPACT')
        return true
      }
    }
    return false
  }

  loseCraft (cause) {
    this.lives -= 1
    this.lossCause = cause
    this.state = STATE.LOST
    this.phaseTime = 0
  }
}
