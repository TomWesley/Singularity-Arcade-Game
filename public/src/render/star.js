// Stars.
//
// The visual opposite of a black hole: a black hole is drawn as an absence with
// a rim, a star is the only object on the board that is genuinely a light
// source. So it gets everything the holes deliberately refuse -- a lit surface,
// limb darkening, a corona, a bloom that spills onto the field around it.
//
// Three kinds, and the difference is real astrophysics rather than palette
// choice. A red giant is enormous, cool and diffuse; a white dwarf packs a
// comparable mass into a body a fraction of the size and is correspondingly
// fierce at its surface. The player should be able to read danger off the colour
// and size the same way an astronomer does.

const TAU = Math.PI * 2

const KINDS = {
  'main-sequence': {
    core: [255, 244, 214],
    mid: [255, 186, 74],
    edge: [226, 108, 26],
    corona: [255, 168, 60],
    granule: 0.07
  },
  'red-giant': {
    core: [255, 206, 158],
    mid: [242, 116, 52],
    edge: [166, 44, 26],
    corona: [232, 86, 40],
    granule: 0.1
  },
  'white-dwarf': {
    core: [255, 255, 255],
    mid: [206, 232, 255],
    edge: [116, 170, 232],
    corona: [160, 206, 255],
    granule: 0.04
  }
}

const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`

// The disc itself never changes for a given star, so it is rendered once and
// blitted; only the corona breathes.
const SS = 2
const cache = new Map()

function sprite (star) {
  const key = `${star.kind}:${star.radius.toFixed(2)}`
  const hit = cache.get(key)
  if (hit) return hit

  const k = KINDS[star.kind] ?? KINDS['main-sequence']
  const reach = star.radius * 2.6
  const size = Math.ceil(reach * 2 * SS)
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size
  const c = cv.getContext('2d')
  c.scale(SS, SS)
  c.translate(reach, reach)

  // Corona: the light that spills past the limb.
  const halo = c.createRadialGradient(0, 0, star.radius * 0.92, 0, 0, reach)
  halo.addColorStop(0, rgba(k.corona, 0.5))
  halo.addColorStop(0.22, rgba(k.corona, 0.2))
  halo.addColorStop(0.6, rgba(k.corona, 0.05))
  halo.addColorStop(1, rgba(k.corona, 0))
  c.fillStyle = halo
  c.beginPath()
  c.arc(0, 0, reach, 0, TAU)
  c.fill()

  // Photosphere, lit from the upper left, darkening toward the limb -- which is
  // what a real stellar disc does, and what stops it reading as a flat token.
  const disc = c.createRadialGradient(
    -star.radius * 0.3, -star.radius * 0.3, star.radius * 0.05,
    0, 0, star.radius)
  disc.addColorStop(0, rgba(k.core, 1))
  disc.addColorStop(0.45, rgba(k.mid, 1))
  disc.addColorStop(0.86, rgba(k.edge, 1))
  disc.addColorStop(1, rgba(k.edge, 0.86))
  c.fillStyle = disc
  c.beginPath()
  c.arc(0, 0, star.radius, 0, TAU)
  c.fill()

  // Granulation: faint convection cells, deterministic so the surface does not
  // crawl. Enough to give the disc texture, not enough to read as noise.
  let seed = Math.round(star.radius * 97) + star.kind.length
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  c.globalCompositeOperation = 'overlay'
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU
    const rr = Math.sqrt(rnd()) * star.radius * 0.82
    const gr = star.radius * (0.1 + rnd() * 0.16)
    c.fillStyle = rgba(k.core, k.granule * (0.4 + rnd() * 0.6))
    c.beginPath()
    c.arc(Math.cos(a) * rr, Math.sin(a) * rr, gr, 0, TAU)
    c.fill()
  }
  c.globalCompositeOperation = 'source-over'

  // Limb: a bright hairline so the edge is definite.
  c.strokeStyle = rgba(k.core, 0.55)
  c.lineWidth = 1
  c.beginPath()
  c.arc(0, 0, star.radius, 0, TAU)
  c.stroke()

  const out = { canvas: cv, reach }
  cache.set(key, out)
  return out
}

export function drawStar (ctx, star, time) {
  const k = KINDS[star.kind] ?? KINDS['main-sequence']
  const s = sprite(star)

  // A slow breath on the corona. Stars are not static, and a completely still
  // light source on a moving board reads as a sticker.
  const pulse = 1 + Math.sin(time * 0.7 + star.homeX * 0.01) * 0.035
  const bloom = ctx.createRadialGradient(
    star.x, star.y, star.radius * 0.9,
    star.x, star.y, star.radius * 3.1 * pulse)
  bloom.addColorStop(0, rgba(k.corona, 0.22))
  bloom.addColorStop(0.45, rgba(k.corona, 0.06))
  bloom.addColorStop(1, rgba(k.corona, 0))
  ctx.fillStyle = bloom
  ctx.beginPath()
  ctx.arc(star.x, star.y, star.radius * 3.1 * pulse, 0, TAU)
  ctx.fill()

  ctx.drawImage(
    s.canvas,
    star.x - s.reach, star.y - s.reach,
    s.reach * 2, s.reach * 2
  )
}
