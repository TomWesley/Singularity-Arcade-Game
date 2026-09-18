// Game state, simulation and rules. Knows nothing about drawing.

import { gravityAt, steer, integrate, escapeLimit, SYSTEM_SPEED_LIMIT } from './physics.js'
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

// The craft's wake is drawn from recorded positions, the same way the asteroid
// tails are. Sampling on a fixed interval means the wake's length is
// proportional to speed for free -- distance covered per sample is speed -- and
// it follows the flight path, so a slingshot leaves a curved wake rather than a
// straight one bolted to the tail.
const WAKE_INTERVAL = 1 / 60
const WAKE_POINTS = 16
const RESPAWN_SECONDS = 1.6
const COMPLETE_SECONDS = 2.2
// How long the craft keeps flying after it crosses the threshold, before the
// completion card appears. Reaching the gate used to switch state in the same
// frame the craft touched it, so the hull stopped being drawn mid-flight and
// simply vanished. It flies out now.
const TRANSIT_SECONDS = 1.15

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
    this.wake = []          // newest first
    this.wakeClock = 0

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
    this.beginRound()
  }

  /**
   * Starts a life on a clear board.
   *
   * Every rock is re-entered from off-screen at the same moment, so the run
   * opens on an empty field and the first wave arrives together rather than the
   * player inheriting whatever the last life left mid-flight. Because nothing
   * spawns on-screen, the wave takes a second or so to fly in -- that pause is
   * the point, not a side effect: it is the beat where a pilot picks a line
   * before anything is shooting at them.
   */
  beginRound () {
    if (this.level) {
      for (const a of this.level.asteroids) {
        a.reset(this.level.holes)
        a.active = true
      }
    }
    this.state = STATE.PLAYING
  }

  /** Empties the field. The board should be bare while a wreck is on screen. */
  clearField () {
    if (!this.level) return
    for (const a of this.level.asteroids) {
      a.active = false
      a.trail.length = 0
    }
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
    // A fresh craft must not inherit the last one's wake.
    this.wake.length = 0
    this.wakeClock = 0
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
    for (const a of this.level.asteroids) {
      if (a.active) a.update(dt, this.level.holes, this._accel)
    }

    switch (this.state) {
      case STATE.PLAYING:
        this.updateFlight(dt, target)
        break
      case STATE.LOST:
        this.phaseTime += dt
        if (this.phaseTime >= RESPAWN_SECONDS) {
          if (this.lives > 0) {
            this.respawn()
            this.beginRound()
          } else {
            this.state = STATE.GAME_OVER
          }
        }
        break
      case STATE.COMPLETE:
        this.phaseTime += dt
        this.updateTransit(dt)
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

    // The craft is held to the same limit as everything else. It rarely binds --
    // top speeds are 0.72c to 0.93c -- but a deep gravity well can accelerate a
    // hull past its own engine, and nothing on this board should outrun light.
    integrate(
      this.body,
      this.gravity.x + this.thrust.x,
      this.gravity.y + this.thrust.y,
      dt,
      this.craft.drag / this.craft.mass,   // drag is a force; heavier coasts further
      SYSTEM_SPEED_LIMIT
    )

    // Walls are solid and bleed off the perpendicular velocity rather than
    // clamping position silently -- being pinned to an edge should feel like
    // hitting something.
    const r = this.craft.hull
    if (this.body.x < r) { this.body.x = r; this.body.vx = Math.abs(this.body.vx) * 0.25 }
    if (this.body.x > DESIGN_WIDTH - r) { this.body.x = DESIGN_WIDTH - r; this.body.vx = -Math.abs(this.body.vx) * 0.25 }
    if (this.body.y < r) { this.body.y = r; this.body.vy = Math.abs(this.body.vy) * 0.25 }
    if (this.body.y > DESIGN_HEIGHT - r) { this.body.y = DESIGN_HEIGHT - r; this.body.vy = -Math.abs(this.body.vy) * 0.25 }

    this.wakeClock += dt
    if (this.wakeClock >= WAKE_INTERVAL) {
      this.wakeClock -= WAKE_INTERVAL
      this.wake.unshift({ x: this.body.x, y: this.body.y })
      if (this.wake.length > WAKE_POINTS) this.wake.pop()
    }

    this.speed = Math.hypot(this.body.vx, this.body.vy)
    this.gForce = Math.hypot(this.gravity.x, this.gravity.y)
    this.nearestHoleDanger = this.dangerLevel()

    if (this.checkHazards()) return

    if (this.level.gate.contains(this.body.x, this.body.y)) {
      this.state = STATE.COMPLETE
      this.phaseTime = 0
      this.transitFrom = this.body.x
    }
  }

  /**
   * The craft flying out through the gate.
   *
   * It keeps its momentum and the field keeps acting on it -- crossing a
   * threshold does not suspend gravity -- with the engine held wide open
   * straight ahead, which is what a pilot who has just made it would do. No
   * steering: the run is over and the cursor should stop mattering the instant
   * the gate is crossed.
   */
  updateTransit (dt) {
    if (this.phaseTime > TRANSIT_SECONDS) return

    this.prev.x = this.body.x
    this.prev.y = this.body.y

    gravityAt(this.body.x, this.body.y, this.level.holes, this.gravity)
    const maxAccel = this.craft.thrust / this.craft.mass
    integrate(
      this.body,
      this.gravity.x + maxAccel,
      this.gravity.y,
      dt,
      this.craft.drag / this.craft.mass,
      SYSTEM_SPEED_LIMIT
    )

    this.wakeClock += dt
    if (this.wakeClock >= WAKE_INTERVAL) {
      this.wakeClock -= WAKE_INTERVAL
      this.wake.unshift({ x: this.body.x, y: this.body.y })
      if (this.wake.length > WAKE_POINTS) this.wake.pop()
    }
    this.speed = Math.hypot(this.body.vx, this.body.vy)
  }

  /** 0..1 as the craft crosses the threshold, for the gate's flare. */
  get transitFlare () {
    if (this.state !== STATE.COMPLETE) return 0
    return Math.max(0, 1 - this.phaseTime / 0.55)
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
        this.loseCraft('CONSUMED', h)
        return true
      }
    }
    for (const a of this.level.asteroids) {
      if (!a.active) continue
      if (Math.hypot(this.body.x - a.x, this.body.y - a.y) < a.radius + this.craft.hull * 0.5) {
        this.loseCraft('IMPACT', null)
        return true
      }
    }
    return false
  }

  // The loss point and the velocity carried into it are recorded so the wreck
  // can be thrown from where the craft actually was, along the line it was
  // actually travelling.
  loseCraft (cause, hole) {
    // The field goes with the craft: the wreck should play out against nothing.
    this.clearField()
    this.lives -= 1
    this.lossCause = cause
    this.lossHole = hole
    this.lossPoint = { x: this.body.x, y: this.body.y }
    this.lossVel = { x: this.body.vx, y: this.body.vy }
    this.state = STATE.LOST
    this.phaseTime = 0
  }
}
