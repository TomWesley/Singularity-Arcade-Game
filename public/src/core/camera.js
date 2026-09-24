// Camera.
//
// The view stays 1280x720 -- that is the window onto the world, and everything
// drawn in screen space (menus, the HUD, the backdrop) still works in it. A
// level's *world* can be wider, and the camera slides along it.
//
// The rule is the oldest one in side-scrolling: keep the craft in the middle,
// and stop at the ends. Clamping at the far end is what makes the gate arrive
// rather than being chased -- once the right edge of the world is on screen the
// camera has nowhere left to go, so it holds still and the craft flies the last
// stretch across a stationary view. The gate coming into sight and the camera
// settling are the same event, which is worth more than any announcement of it.
//
// Clamping at the near end does the same thing at the start: the craft sits
// where it launched until it has earned the middle of the screen.
//
// No smoothing. A lag would be kinder to the eye and worse to fly: the whole
// game is judging a gap against a gravity well, and a camera that arrives a
// moment after you do puts the thing you are judging somewhere it is not.

import { DESIGN_WIDTH } from '../game/constants.js'

/**
 * Left edge of the view, in world coordinates.
 *
 * @param focusX  what to centre on, in world coordinates
 * @param worldWidth  total width of the level
 */
export function cameraX (focusX, worldWidth) {
  const furthest = Math.max(0, worldWidth - DESIGN_WIDTH)
  return Math.max(0, Math.min(furthest, focusX - DESIGN_WIDTH / 2))
}

/** True once the camera has run out of world and stopped. */
export function cameraFrozen (camX, worldWidth) {
  return camX >= Math.max(0, worldWidth - DESIGN_WIDTH) - 0.5
}
