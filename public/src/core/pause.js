// Pause, and the portrait gate.
//
// Two separate reasons to stop the clock, handled together because they must
// not fight each other:
//
//   'manual'  the player pressed Enter
//   'rotate'  the window is taller than it is wide
//   'ready'   it was portrait, it no longer is, and the player has not yet
//             said they are ready to resume
//
// The board is authored at 1280x720 and letterboxed. In portrait that leaves a
// strip a couple of hundred pixels tall, which is not a harder version of the
// game, it is an unplayable one -- so the game stops rather than pretending.
//
// Coming back from portrait deliberately does not resume on its own. A device
// that has just been turned is usually still moving, and dropping a player
// straight back into a live board mid-rotation loses them a craft to something
// they never saw.

export const PAUSE = {
  MANUAL: 'manual',
  ROTATE: 'rotate',
  READY: 'ready'
}

export class PauseController {
  constructor () {
    this.reason = null
    this.wasPortrait = false
  }

  get paused () { return this.reason !== null }

  static isPortrait () {
    return window.innerHeight > window.innerWidth
  }

  /** Called every frame; drives the orientation side of the state machine. */
  sync () {
    const portrait = PauseController.isPortrait()

    if (portrait) {
      // Portrait always wins: it overrides a manual pause rather than queueing
      // behind it, so the rotate prompt is what the player sees.
      this.reason = PAUSE.ROTATE
      this.wasPortrait = true
      return
    }

    if (this.reason === PAUSE.ROTATE) {
      // Back in landscape -- wait for an explicit tap before running again.
      this.reason = PAUSE.READY
    }
    this.wasPortrait = false
  }

  /** Enter: pauses a running game, or lifts a pause the player owns. */
  toggleManual () {
    if (this.reason === PAUSE.MANUAL || this.reason === PAUSE.READY) {
      this.reason = null
    } else if (this.reason === null) {
      this.reason = PAUSE.MANUAL
    }
    // A ROTATE pause is not the player's to lift.
  }

  /**
   * A tap or click. Only lifts the two pauses the player is meant to clear;
   * returns true if it consumed the input, so the caller does not also treat it
   * as a game click.
   */
  press () {
    if (this.reason === PAUSE.READY || this.reason === PAUSE.MANUAL) {
      this.reason = null
      return true
    }
    return this.reason !== null   // swallow taps while still in portrait
  }
}
