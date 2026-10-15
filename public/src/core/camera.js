// Camera.
//
// The view stays 1280x720 -- that is the window onto the world, and everything
// drawn in screen space (menus, the HUD, the backdrop) still works in it. A
// level's *world* can be wider, and the camera travels along it.
//
// It travels on its own. Not following the craft: moving at its own steady pace
// from the moment the round begins, and the craft is held inside the view it
// leaves behind. Linger and the left edge carries you along; run ahead and the
// right edge holds you back.
//
// Following the craft was tried first and was worse to fly. Centring the craft
// means the world slides whenever you do, so every judgement about a gap is
// made against scenery that is itself moving at your speed, and a level four
// screens wide becomes four screens of the same sensation. A camera with its
// own pace gives the board a fixed frame to be read against, and it turns the
// long middle of a level into something with rhythm -- the hazard arrives when
// it arrives, and you deal with it in the time you are given.
//
// It also decouples how long a level lasts from how fast a hull flies. Under a
// following camera the sail took eight seconds for everyone, because everyone
// flies at roughly the speed of light here; a level now takes exactly as long
// as its author says it does.
//
// The far end is the whole design of the ending. The camera runs out of world,
// stops, and the last screenful stands still -- so the gate arrives and the
// clock on reaching it comes off in the same instant, and the hardest part of
// the level is never the part you are being rushed through.

import { DESIGN_WIDTH } from '../game/constants.js'

/** How far the camera can travel before the world's right edge is on screen. */
export function cameraTravel (worldWidth) {
  return Math.max(0, worldWidth - DESIGN_WIDTH)
}

/**
 * Pixels per second that walks the camera the length of the world in `sail`
 * seconds. A level authors the duration, not the speed: "this is a thirty
 * second sail" survives a change of width, where a speed in px/s does not.
 */
export function scrollSpeed (worldWidth, sailSeconds) {
  if (!(sailSeconds > 0)) return 0
  return cameraTravel(worldWidth) / sailSeconds
}

/** True once the camera has run out of world and stopped. */
export function cameraFrozen (camX, worldWidth) {
  return camX >= cameraTravel(worldWidth) - 0.5
}
