// The game is authored in a fixed 1280x720 design space and letterboxed into
// whatever the window actually is. Every entity, level coordinate and draw call
// works in design units; only this module knows about pixels.

// The board size is a physical constant of the game world, so it lives with
// the rest of them and is re-exported here for convenience.
export { DESIGN_WIDTH, DESIGN_HEIGHT } from '../game/constants.js'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../game/constants.js'

export class Viewport {
  constructor (canvas) {
    this.canvas = canvas
    this.scale = 1
    this.offsetX = 0
    this.offsetY = 0
    this.dpr = 1
    this.cssWidth = 0
    this.cssHeight = 0
  }

  // Sizes the backing store for the device pixel ratio and works out the
  // letterbox transform. Called on load and on every resize.
  resize () {
    const cssWidth = window.innerWidth
    const cssHeight = window.innerHeight
    const dpr = window.devicePixelRatio || 1

    this.canvas.width = Math.round(cssWidth * dpr)
    this.canvas.height = Math.round(cssHeight * dpr)
    this.canvas.style.width = `${cssWidth}px`
    this.canvas.style.height = `${cssHeight}px`

    this.dpr = dpr
    this.cssWidth = cssWidth
    this.cssHeight = cssHeight
    this.scale = Math.min(cssWidth / DESIGN_WIDTH, cssHeight / DESIGN_HEIGHT)
    this.offsetX = (cssWidth - DESIGN_WIDTH * this.scale) / 2
    this.offsetY = (cssHeight - DESIGN_HEIGHT * this.scale) / 2
  }

  // Applies the letterbox transform. Everything drawn after this is in design
  // units; the caller restores.
  apply (ctx) {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.translate(this.offsetX, this.offsetY)
    ctx.scale(this.scale, this.scale)
  }

  // Screen (CSS px) -> design space.
  toDesign (clientX, clientY) {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale
    }
  }
}
