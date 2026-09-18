// Black hole rendering.
//
// A black hole is the one object on this board that emits nothing, so it is
// drawn as an absence: a disc of pure black, with a white aura hugging the rim
// that exists only to say where the edge is. No accretion disk, no coloured
// rings, no instrument furniture. Against a black field the aura is the whole
// image, and that is the point -- the reference is the Jupiter sequence in 2001,
// where the drama is a bright edge on a dark shape and nothing else.
//
// The radii are still the real ones the physics computed: the horizon at r_s and
// the photon sphere at 1.5 r_s, where the aura peaks. Nothing is invented for
// looks. The ISCO at 3 r_s used to be drawn as a faint ring, but on a black
// field a large hairline circle reads as a grey rim around the object rather
// than as information, and the aura alone says where the edge is.
//
// Nothing marks where the pull becomes unwinnable. There was a ring at the
// craft-specific escape radius, drawn in red as you neared it, and it was the
// wrong kind of help: it turned a thing you are supposed to develop a feel for
// into a boundary you could read off the screen. The aura falls off with the
// field, the GRAV gauge climbs, and the craft starts refusing the cursor --
// between them that is enough to learn from, and learning it is the game.
//
// Performance: all of that is static for a given mass, so it renders once into
// an offscreen canvas and is blitted each frame.

const TAU = Math.PI * 2

// Sprites are cached by horizon radius and rendered at 2x so they stay crisp
// when the board is letterboxed up on a large or high-DPI display.
const SS = 2
const spriteCache = new Map()

function staticSprite (hole) {
  const key = hole.horizon.toFixed(2)
  const hit = spriteCache.get(key)
  if (hit) return hit

  const auraOuter = Math.max(hole.photonSphere * 1.9, hole.horizon + 26)
  const reach = auraOuter + 4
  const size = Math.ceil(reach * 2 * SS)
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const c = cv.getContext('2d')
  c.scale(SS, SS)
  c.translate(reach, reach)

  // The aura. Brightest just outside the horizon, peaking at the photon sphere,
  // gone by roughly twice the horizon radius.
  const g = c.createRadialGradient(0, 0, hole.horizon * 0.94, 0, 0, auraOuter)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
  g.addColorStop(0.16, 'rgba(255, 255, 255, 0.30)')
  g.addColorStop(0.45, 'rgba(255, 255, 255, 0.09)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  c.fillStyle = g
  c.beginPath()
  c.arc(0, 0, auraOuter, 0, TAU)
  c.fill()

  // The horizon itself: absolute black, punched back out of the aura, with one
  // clean white hairline defining the edge.
  c.globalCompositeOperation = 'destination-out'
  c.beginPath()
  c.arc(0, 0, hole.horizon, 0, TAU)
  c.fill()
  c.globalCompositeOperation = 'source-over'

  c.strokeStyle = 'rgba(255, 255, 255, 0.92)'
  c.lineWidth = 1.3
  c.shadowColor = 'rgba(255, 255, 255, 0.8)'
  c.shadowBlur = 10
  c.beginPath()
  c.arc(0, 0, hole.horizon, 0, TAU)
  c.stroke()

  const sprite = { canvas: cv, reach }
  spriteCache.set(key, sprite)
  return sprite
}

export function drawBlackHole (ctx, hole) {
  const sprite = staticSprite(hole)

  // The horizon has to be genuinely black, not the aura's black over whatever
  // is behind it, so the disc is filled before the sprite lands on top.
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(hole.x, hole.y, hole.horizon, 0, TAU)
  ctx.fill()

  ctx.drawImage(
    sprite.canvas,
    hole.x - sprite.reach, hole.y - sprite.reach,
    sprite.reach * 2, sprite.reach * 2
  )
}
