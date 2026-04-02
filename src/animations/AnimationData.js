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
const WALK_SOUTH_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -1, leftLegFwd: 3,  rightLegFwd: -3, leftArmFwd: -3, rightArmFwd: 3,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -2, leftLegFwd: 5,  rightLegFwd: -5, leftArmFwd: -4, rightArmFwd: 4,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 },
  { bodyY: -1, leftLegFwd: 3,  rightLegFwd: -3, leftArmFwd: -3, rightArmFwd: 3,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -1, leftLegFwd: -3, rightLegFwd: 3,  leftArmFwd: 3,  rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -2, leftLegFwd: -5, rightLegFwd: 5,  leftArmFwd: 4,  rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 },
  { bodyY: -1, leftLegFwd: -3, rightLegFwd: 3,  leftArmFwd: 3,  rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
];

// WALK WEST: 8 frames - walking left (profile view)
const WALK_WEST_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -1, leftLegFwd: 5,  rightLegFwd: -5, leftArmFwd: -4, rightArmFwd: 4,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -2, leftLegFwd: 9,  rightLegFwd: -9, leftArmFwd: -6, rightArmFwd: 6,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 },
  { bodyY: -1, leftLegFwd: 5,  rightLegFwd: -5, leftArmFwd: -4, rightArmFwd: 4,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: 0,  leftLegFwd: 0,  rightLegFwd: 0,  leftArmFwd: 0,  rightArmFwd: 0,  leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -1, leftLegFwd: -5, rightLegFwd: 5,  leftArmFwd: 4,  rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
  { bodyY: -2, leftLegFwd: -9, rightLegFwd: 9,  leftArmFwd: 6,  rightArmFwd: -6, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 },
  { bodyY: -1, leftLegFwd: -5, rightLegFwd: 5,  leftArmFwd: 4,  rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 },
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
