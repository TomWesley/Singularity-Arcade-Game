// Pointer tracking. The cursor is the craft's target, so the only state the
// game needs is "where is the pointer, in design space, right now".

export class Input {
  constructor (canvas, viewport) {
    this.viewport = viewport
    this.x = 0
    this.y = 0
    this.hasPointer = false
    this.clickHandlers = []

    const move = (clientX, clientY) => {
      const p = viewport.toDesign(clientX, clientY)
      this.x = p.x
      this.y = p.y
      this.hasPointer = true
    }

    canvas.addEventListener('mousemove', e => move(e.clientX, e.clientY))
    canvas.addEventListener('mousedown', e => {
      move(e.clientX, e.clientY)
      this.emitClick()
    })

    // Touch: dragging steers, a tap also counts as a click.
    canvas.addEventListener('touchstart', e => {
      const t = e.touches[0]
      if (!t) return
      move(t.clientX, t.clientY)
      this.emitClick()
      e.preventDefault()
    }, { passive: false })

    canvas.addEventListener('touchmove', e => {
      const t = e.touches[0]
      if (!t) return
      move(t.clientX, t.clientY)
      e.preventDefault()
    }, { passive: false })
  }

  onClick (fn) { this.clickHandlers.push(fn) }

  emitClick () {
    for (const fn of this.clickHandlers) fn(this.x, this.y)
  }
}
