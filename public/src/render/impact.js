// What losing a craft looks like.
//
// Two deaths, and they should not look alike, because they are not alike.
//
// An asteroid strike is an explosion: the hull bursts, debris is thrown along
// the line the craft was already travelling plus a radial kick, and a shockwave
// ring runs outward.
//
// Crossing a horizon is the opposite of an explosion. Nothing escapes, so the
// wreck is not thrown anywhere -- it is drawn in. Debris from a horizon death is
// integrated through the same gravityAt() field the craft flew through, so it
// genuinely spirals in rather than miming it, and each fragment stretches along
// its velocity as it accelerates. That stretching is real: the tidal gradient
// across a falling body is what spaghettification is.

import { gravityAt, integrate, circularOrbitSpeed } from '../game/physics.js'
import { CRAFT_COLORS } from './craft.js'

const IMPACT_LIFE = 1.35
const CONSUMED_LIFE = 1.5

// Guard rails for the inspiral. Very close to a horizon the field is enormous,
// and a fixed timestep will happily turn that into a fragment leaving the board
// at implausible speed; these keep the animation on screen without changing the
// shape of the trajectory anywhere it matters.
const MAX_ACCEL = 26000
const MAX_SPEED = 1100
const INSPIRAL_DRAG = 0.6

export class Impact {
  constructor () {
    this.active = false
    this.t = 0
    this.life = 0
    this.cause = null
    this.hole = null
    this.parts = []
    this.origin = { x: 0, y: 0 }
    this._a = { x: 0, y: 0 }
  }

  spawn ({ x, y, vx, vy, cause, hole, craftId, rng = Math.random }) {
    this.active = true
    this.t = 0
    this.cause = cause
    this.hole = hole
    this.origin.x = x
    this.origin.y = y
    this.colors = CRAFT_COLORS[craftId] ?? CRAFT_COLORS.superbug

    const consumed = cause === 'CONSUMED'
    this.life = consumed ? CONSUMED_LIFE : IMPACT_LIFE
    const count = consumed ? 34 : 26
    this.parts.length = 0

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rng() * 0.5
      if (consumed && hole) {
        // Debris is placed on a ring outside the horizon and given very nearly
        // the circular orbit speed for where it sits, then bled inward by drag.
        // That is an accretion inspiral, and it matters that it is set up this
        // way: spawning fragments at the horizon itself puts them where the
        // Paczynski-Wiita denominator has collapsed and the field is millions of
        // px/s^2, so a single timestep slingshots them off the board instead of
        // drawing them in.
        // Sized in absolute pixels as well as horizon multiples: a 3-solar-mass
        // hole has a 12px horizon, and a cloud scaled only to that is over
        // before it can be seen. This gives every hole a debris field big
        // enough to watch wind in.
        const inner = Math.max(hole.horizon * 1.8, 44)
        const spread = Math.max(hole.horizon * 1.7, 58)
        const r = inner + rng() * spread
        const px0 = hole.x + Math.cos(a) * r
        const py0 = hole.y + Math.sin(a) * r
        const orbital = circularOrbitSpeed(hole, r) * (0.72 + rng() * 0.38)
        this.parts.push({
          x: px0, y: py0,
          vx: Math.cos(a + Math.PI / 2) * orbital + vx * 0.08,
          vy: Math.sin(a + Math.PI / 2) * orbital + vy * 0.08,
          size: 1 + rng() * 2.4,
          hot: rng() > 0.55,
          dead: false
        })
      } else {
        const speed = 110 + rng() * 420
        this.parts.push({
          x, y,
          vx: vx * 0.4 + Math.cos(a) * speed,
          vy: vy * 0.4 + Math.sin(a) * speed,
          size: 1 + rng() * 2.6,
          hot: rng() > 0.5,
          dead: false
        })
      }
    }
  }

  update (dt, holes) {
    if (!this.active) return
    this.t += dt
    if (this.t >= this.life) { this.active = false; return }

    const consumed = this.cause === 'CONSUMED'
    for (const p of this.parts) {
      if (p.dead) continue
      if (consumed && this.hole) {
        // The real field, so the spiral is the trajectory rather than a curve
        // drawn to look like one. Drag stands in for the debris shedding energy
        // as it is torn apart, which is what turns an orbit into an inspiral.
        gravityAt(p.x, p.y, holes, this._a)
        const am = Math.hypot(this._a.x, this._a.y)
        if (am > MAX_ACCEL) {
          this._a.x = (this._a.x / am) * MAX_ACCEL
          this._a.y = (this._a.y / am) * MAX_ACCEL
        }
        integrate(p, this._a.x, this._a.y, dt, INSPIRAL_DRAG)
        const sp = Math.hypot(p.vx, p.vy)
        if (sp > MAX_SPEED) { p.vx = (p.vx / sp) * MAX_SPEED; p.vy = (p.vy / sp) * MAX_SPEED }
        if (Math.hypot(p.x - this.hole.x, p.y - this.hole.y) < this.hole.horizon) {
          p.dead = true
        }
      } else {
        integrate(p, 0, 0, dt, 1.7)
      }
    }
  }

  draw (ctx) {
    if (!this.active) return
    const k = this.t / this.life
    const [warm, bright] = this.colors

    if (this.cause === 'CONSUMED') this.drawCollapse(ctx, k)
    else this.drawBurst(ctx, k)

    // Fragments. Each is a streak along its own velocity, so the direction of
    // travel is legible and fast debris stretches.
    for (const p of this.parts) {
      if (p.dead) continue
      const sp = Math.hypot(p.vx, p.vy)
      const c = p.hot ? bright : warm
      const alpha = (1 - k) * (p.hot ? 0.95 : 0.75)
      if (alpha <= 0.02) continue

      if (sp > 12) {
        const ux = p.vx / sp
        const uy = p.vy / sp
        // Stretch grows with speed: near a horizon the fragments are being
        // pulled apart, and they should look it.
        const len = Math.min(46, sp * 0.055) * (1 + k * 1.4)
        const g = ctx.createLinearGradient(p.x, p.y, p.x - ux * len, p.y - uy * len)
        g.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`)
        g.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`)
        ctx.strokeStyle = g
        ctx.lineWidth = p.size
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - ux * len, p.y - uy * len)
        ctx.stroke()
      } else {
        ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
    }
  }

  // Asteroid strike: a flash and an expanding shockwave.
  drawBurst (ctx, k) {
    const [warm, bright] = this.colors
    const { x, y } = this.origin

    if (k < 0.22) {
      const f = 1 - k / 0.22
      const r = 16 + 54 * (1 - f)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(255, 255, 255, ${0.85 * f})`)
      g.addColorStop(0.4, `rgba(${bright[0]}, ${bright[1]}, ${bright[2]}, ${0.5 * f})`)
      g.addColorStop(1, `rgba(${warm[0]}, ${warm[1]}, ${warm[2]}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const ease = 1 - Math.pow(1 - k, 3)
    const radius = 12 + 190 * ease
    const alpha = (1 - k) * 0.55
    if (alpha > 0.02) {
      ctx.strokeStyle = `rgba(${warm[0]}, ${warm[1]}, ${warm[2]}, ${alpha})`
      ctx.lineWidth = 2.4 * (1 - k) + 0.5
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // Horizon death: a ring that collapses inward onto the hole instead of
  // running away from it, and a brief brightening of the horizon as the mass
  // goes in.
  drawCollapse (ctx, k) {
    const [warm, bright] = this.colors
    const h = this.hole
    if (!h) return

    const ease = 1 - Math.pow(1 - k, 2)
    const from = Math.max(h.isco * 0.8, h.horizon + 90)
    const radius = from + (h.horizon - from) * ease
    const alpha = (1 - k) * 0.7
    if (alpha > 0.02) {
      ctx.strokeStyle = `rgba(${bright[0]}, ${bright[1]}, ${bright[2]}, ${alpha})`
      ctx.lineWidth = 1 + 2.5 * (1 - k)
      ctx.beginPath()
      ctx.arc(h.x, h.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // The horizon flares as the wreck crosses it, then settles.
    const flare = Math.max(0, 1 - Math.abs(k - 0.62) / 0.3)
    if (flare > 0.01) {
      const g = ctx.createRadialGradient(h.x, h.y, h.horizon * 0.9, h.x, h.y, h.horizon * 2.1)
      g.addColorStop(0, `rgba(${warm[0]}, ${warm[1]}, ${warm[2]}, ${0.42 * flare})`)
      g.addColorStop(1, `rgba(${warm[0]}, ${warm[1]}, ${warm[2]}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(h.x, h.y, h.horizon * 2.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
