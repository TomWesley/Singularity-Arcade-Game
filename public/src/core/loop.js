// Fixed-timestep game loop.
//
// The original game advanced physics once per animation frame, which tied the
// craft's speed to the display: the same input played roughly 2.4x faster on a
// 144Hz monitor than on 60Hz. Here the simulation always advances in fixed
// STEP-second slices no matter how often we render, and the renderer is handed
// an interpolation alpha so motion stays smooth when the frame boundary falls
// between two steps.

export const STEP = 1 / 120

// Below this we would burn frames catching up after a tab-switch or a long GC
// pause; past it we deliberately drop simulation time instead of spiralling.
const MAX_FRAME_TIME = 0.25

export function startLoop ({ update, render }) {
  let last = performance.now()
  let accumulator = 0
  let running = true

  function frame (now) {
    if (!running) return
    window.requestAnimationFrame(frame)

    let elapsed = (now - last) / 1000
    last = now
    if (elapsed > MAX_FRAME_TIME) elapsed = MAX_FRAME_TIME
    accumulator += elapsed

    while (accumulator >= STEP) {
      update(STEP)
      accumulator -= STEP
    }

    render(accumulator / STEP, elapsed)
  }

  window.requestAnimationFrame(frame)
  return () => { running = false }
}
