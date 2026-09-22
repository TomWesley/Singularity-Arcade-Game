// Backdrop -- the field behind everything.
//
// It is black. Not near-black with an undertone, not a procedural star scatter:
// black.
//
// The drifting starfield that used to live here was three layers of twinkling
// dots and it never once looked like sky. The reason is worth recording so it
// is not attempted a fourth time. A real night sky has a brightness
// distribution spanning many orders of magnitude, almost all of it below what a
// single 8-bit pixel can represent; quantised onto a screen it collapses into
// either a sparse handful of white specks or a uniform grey dust, and both read
// as noise. Worse, this one drifted, which put slow parallax behind a board
// whose entire subject is things falling -- so the eye kept reading the motion
// of the background as motion of the field.
//
// Black solves all of it at once. Every lit thing on the board is then the only
// lit thing on the board, which is the Kubrick reading the game is after: the
// void is not decorated, it is empty, and a star is remarkable because it is
// surrounded by nothing.
//
// If a real sky image is wanted, that is what `image` is for: one stationary
// photograph or render, drawn cover-fit, no parallax and no animation. A
// captured sky carries the real distribution -- nebulosity, dust lanes, the
// Milky Way's band -- which is precisely the part procedural dots cannot
// reproduce. A level names one with a `backdrop` field; everything else stays
// black.

import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../core/viewport.js'

export class Backdrop {
  constructor () {
    this.url = null
    this.image = null
  }

  /**
   * Points the backdrop at an image URL, or at nothing.
   *
   * Called every frame with whatever the current level asks for, so switching
   * levels switches backdrop with no state to keep in sync at the call site.
   * Loading is fire-and-forget: the field stays black until the image arrives,
   * and stays black forever if it never does. A missing backdrop is a cosmetic
   * absence, never a broken frame.
   */
  setImage (url) {
    if (url === this.url) return
    this.url = url
    this.image = null
    if (!url) return

    const img = new Image()
    img.onload = () => { if (this.url === url) this.image = img }
    img.src = url
  }

  draw (ctx, url = null) {
    this.setImage(url)

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)

    const img = this.image
    if (!img || !img.width || !img.height) return

    // Cover-fit: fill the board and crop the overhang, rather than letterbox.
    // A sky has no composition that must be preserved, but a black bar down the
    // side of one would be read instantly as a bug.
    const scale = Math.max(DESIGN_WIDTH / img.width, DESIGN_HEIGHT / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (DESIGN_WIDTH - w) / 2, (DESIGN_HEIGHT - h) / 2, w, h)
  }
}
