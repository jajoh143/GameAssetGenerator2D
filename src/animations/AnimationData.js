'use strict';

/**
 * Animation frame offset tables.
 * Each frame defines offsets for body parts relative to rest position.
 *
 * bodyY:       vertical offset of entire body (breathing bob, step bob)
 * leftLegFwd:  forward/back rotation of left leg in pixels
 * rightLegFwd: forward/back rotation of right leg in pixels
 * leftArmFwd:  forward/back swing of left arm in pixels
 * rightArmFwd: forward/back swing of right arm in pixels
 * leftArmOut:  lateral extension of left arm (for attack)
 * rightArmOut: lateral extension of right arm (for attack)
 * tilt:        torso tilt offset
 * headBob:     head vertical offset relative to body
 */

// IDLE: 4 frames - subtle breathing
const IDLE_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 },
  { bodyY: 0,  leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
];

// WALK SOUTH: 8 frames - walking toward camera
// Body bob: CONTACT pose (foot plants) = bodyY 0 (rest height, weight bearing).
//           PASSING pose (legs cross under) = bodyY -1 (body rises 1px).
// Leg values: only 1px lateral spread at peak — south-facing walk shows depth via
// per-foot Y offset in drawSouth, not lateral sliding.
// Arms: opposite to legs (left arm back when left leg forward).
const WALK_SOUTH_FRAMES = [
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // idle
  { bodyY:  0, leftLegFwd:  4, rightLegFwd: -4, leftArmFwd: -3, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // contact L
  { bodyY: -2, leftLegFwd:  6, rightLegFwd: -6, leftArmFwd: -4, rightArmFwd:  4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 }, // passing (body UP)
  { bodyY:  0, leftLegFwd:  4, rightLegFwd: -4, leftArmFwd: -3, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // contact return
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // idle
  { bodyY:  0, leftLegFwd: -4, rightLegFwd:  4, leftArmFwd:  3, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // contact R
  { bodyY: -2, leftLegFwd: -6, rightLegFwd:  6, leftArmFwd:  4, rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 }, // passing (body UP)
  { bodyY:  0, leftLegFwd: -4, rightLegFwd:  4, leftArmFwd:  3, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // contact return
];

// WALK WEST: 8 frames - walking left (profile view — most legible direction)
// Body bob: CONTACT (max stride, legs spread) = bodyY 0 (low, weight-bearing).
//           PASSING (legs close, crossing under) = bodyY -1 (body UP 1px).
// This is the CORRECT walk cycle: body rises as leg pushes up, drops as it plants.
const WALK_WEST_FRAMES = [
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0, leftLegLift: 0, rightLegLift: 0 }, // idle
  { bodyY:  0, leftLegFwd:  6, rightLegFwd: -6, leftArmFwd: -5, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0, leftLegLift: 0, rightLegLift: 0 }, // contact (both planted)
  { bodyY: -2, leftLegFwd:  3, rightLegFwd: -3, leftArmFwd: -2, rightArmFwd:  2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1, leftLegLift: 0, rightLegLift: 4 }, // passing — right foot lifts 4px
  { bodyY:  0, leftLegFwd:  6, rightLegFwd: -6, leftArmFwd: -5, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0, leftLegLift: 0, rightLegLift: 0 }, // contact return
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0, leftLegLift: 0, rightLegLift: 0 }, // idle
  { bodyY:  0, leftLegFwd: -6, rightLegFwd:  6, leftArmFwd:  5, rightArmFwd: -5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0, leftLegLift: 0, rightLegLift: 0 }, // contact other side
  { bodyY: -2, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd:  2, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1, leftLegLift: 4, rightLegLift: 0 }, // passing — left foot lifts 4px
  { bodyY:  0, leftLegFwd: -6, rightLegFwd:  6, leftArmFwd:  5, rightArmFwd: -5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0, leftLegLift: 0, rightLegLift: 0 }, // contact return
];

// WALK NORTH: 8 frames - walking away from camera
const WALK_NORTH_FRAMES = WALK_SOUTH_FRAMES; // same offsets, different drawing

// WALK EAST: 8 frames - walking right (mirrored west)
const WALK_EAST_FRAMES = WALK_WEST_FRAMES; // same offsets, mirrored at render time

// ATTACK SOUTH: 6 frames - wind-up, strike, recovery
const ATTACK_SOUTH_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0,   tilt: 0,  headBob: 0 },
  { bodyY: -1, leftLegFwd: 0,  rightLegFwd: 2,  leftArmFwd: -2, rightArmFwd: -8, leftArmOut: 0, rightArmOut: -4,  tilt: -2, headBob: 0 },
  { bodyY: -2, leftLegFwd: 0,  rightLegFwd: 3,  leftArmFwd: -3, rightArmFwd: -12,leftArmOut: 0, rightArmOut: -6,  tilt: -3, headBob: -1 },
  { bodyY: -2, leftLegFwd: -2, rightLegFwd: 4,  leftArmFwd: -4, rightArmFwd: 10, leftArmOut: 0, rightArmOut: 8,   tilt: 2,  headBob: -1 },
  { bodyY: -1, leftLegFwd: -1, rightLegFwd: 2,  leftArmFwd: -2, rightArmFwd: 5,  leftArmOut: 0, rightArmOut: 4,   tilt: 1,  headBob: 0 },
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0,   tilt: 0,  headBob: 0 },
];

// ATTACK WEST: 6 frames - side profile attack
const ATTACK_WEST_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0,  tilt: 0,  headBob: 0 },
  { bodyY: -1, leftLegFwd: -2, rightLegFwd: 2,  leftArmFwd: -5, rightArmFwd: 5,  leftArmOut: 0, rightArmOut: 0,  tilt: -2, headBob: 0 },
  { bodyY: -2, leftLegFwd: -3, rightLegFwd: 3,  leftArmFwd: -10,rightArmFwd: 10, leftArmOut: 0, rightArmOut: 0,  tilt: -3, headBob: -1 },
  { bodyY: -2, leftLegFwd: 2,  rightLegFwd: -2, leftArmFwd: 8,  rightArmFwd: -8, leftArmOut: 0, rightArmOut: 0,  tilt: 3,  headBob: -1 },
  { bodyY: -1, leftLegFwd: 1,  rightLegFwd: -1, leftArmFwd: 4,  rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0,  tilt: 1,  headBob: 0 },
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0,  tilt: 0,  headBob: 0 },
];

// ATTACK NORTH: 6 frames - attacking while facing away
const ATTACK_NORTH_FRAMES = ATTACK_SOUTH_FRAMES;

// ATTACK EAST: 6 frames - mirrored west
const ATTACK_EAST_FRAMES = ATTACK_WEST_FRAMES;

module.exports = {
  IDLE_FRAMES,
  WALK_SOUTH_FRAMES,
  WALK_WEST_FRAMES,
  WALK_NORTH_FRAMES,
  WALK_EAST_FRAMES,
  ATTACK_SOUTH_FRAMES,
  ATTACK_WEST_FRAMES,
  ATTACK_NORTH_FRAMES,
  ATTACK_EAST_FRAMES,
};
