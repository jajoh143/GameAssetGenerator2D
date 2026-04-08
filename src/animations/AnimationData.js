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
// No body bob — leg motion only. The DY mechanism in drawSouth shifts the lower leg
// (knee-to-ankle rows) independently: forward foot drops (+3px = extends toward camera),
// back foot rises (-3px = contracts/lifts). Body stays at fixed Y throughout.
// Arms: opposite to legs (left arm back when left leg forward).
const WALK_SOUTH_FRAMES = [
  { bodyY: 0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // idle
  { bodyY: 0, leftLegFwd:  4, rightLegFwd: -4, leftArmFwd: -3, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // contact L — fwd foot extends down 2px
  { bodyY: 0, leftLegFwd:  6, rightLegFwd: -6, leftArmFwd: -4, rightArmFwd:  4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // full stride — fwd foot extends down 3px, back lifts 3px
  { bodyY: 0, leftLegFwd:  4, rightLegFwd: -4, leftArmFwd: -3, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // contact return
  { bodyY: 0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // idle
  { bodyY: 0, leftLegFwd: -4, rightLegFwd:  4, leftArmFwd:  3, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // contact R — fwd foot extends down 2px
  { bodyY: 0, leftLegFwd: -6, rightLegFwd:  6, leftArmFwd:  4, rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // full stride — fwd foot extends down 3px, back lifts 3px
  { bodyY: 0, leftLegFwd: -4, rightLegFwd:  4, leftArmFwd:  3, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0 }, // contact return
];

// WALK WEST: 8 frames - walking left (profile view)
// Full contact→recoil→passing→high-point cycle for each leg. No idle frames.
// Frame naming: C=contact (foot plants), R=recoil (weight over foot, other lifts),
//               P=passing (lifted foot crosses through), H=high point (foot swings to front).
// Arm swing opposes leg (natural balance). leftLegLift lifts front(L) leg, rightLegLift lifts back(R).
// Depth fix in HumanCharacter.js: front/back assignment uses actual screen X, not leg identity.
const WALK_WEST_FRAMES = [
  // Frame 0 — Contact L: L foot plants far forward, R foot pushed back
  { bodyY: 0, leftLegFwd:  8, rightLegFwd: -6, leftArmFwd: -6, rightArmFwd:  6, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 0 },
  // Frame 1 — Recoil L: body passing over L foot, R foot starts to lift
  { bodyY: 0, leftLegFwd:  5, rightLegFwd: -4, leftArmFwd: -4, rightArmFwd:  4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 3 },
  // Frame 2 — Passing: R foot fully lifted, crossing under body
  { bodyY: 0, leftLegFwd:  2, rightLegFwd: -1, leftArmFwd: -2, rightArmFwd:  2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 7 },
  // Frame 3 — High point R: R foot swings to front, L foot pushes off
  { bodyY: 0, leftLegFwd: -1, rightLegFwd:  5, leftArmFwd:  2, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 2 },
  // Frame 4 — Contact R: R foot plants far forward, L foot pushed back
  { bodyY: 0, leftLegFwd: -6, rightLegFwd:  8, leftArmFwd:  6, rightArmFwd: -6, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 0 },
  // Frame 5 — Recoil R: body passing over R foot, L foot starts to lift
  { bodyY: 0, leftLegFwd: -4, rightLegFwd:  5, leftArmFwd:  4, rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 3, rightLegLift: 0 },
  // Frame 6 — Passing: L foot fully lifted, crossing under body
  { bodyY: 0, leftLegFwd: -1, rightLegFwd:  2, leftArmFwd:  2, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 7, rightLegLift: 0 },
  // Frame 7 — High point L: L foot swings to front, R foot pushes off
  { bodyY: 0, leftLegFwd:  5, rightLegFwd: -1, leftArmFwd: -2, rightArmFwd:  2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 2, rightLegLift: 0 },
];

// WALK NORTH: 8 frames - walking away from camera
const WALK_NORTH_FRAMES = WALK_SOUTH_FRAMES; // same offsets, different drawing

// WALK EAST: 8 frames - walking right (mirrored west)
const WALK_EAST_FRAMES = WALK_WEST_FRAMES; // same offsets, mirrored at render time

// ATTACK SWING SOUTH: 6 frames - melee sword/weapon swing facing camera
// Right arm does the swing arc (wind-up back/up → strike forward+out → follow-through).
// rightArmFwd negative = arm lifts; positive = arm swings forward/down.
// rightArmOut positive = arm extends to the right.
// With the shoulder-pivot arm model, rightArmFwd controls WRIST displacement only —
// the shoulder cap stays glued to the torso. Larger values are now safe to use.
// rArmDY = round(rightArmFwd * 0.4); wrist Y = baseY(28) + rArmDY + 10.
const ATTACK_SWING_SOUTH_FRAMES = [
  { bodyY: 0,  leftLegFwd:  0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:   0,  leftArmOut: 0, rightArmOut:  0, tilt: 0,  headBob:  0 }, // ready
  { bodyY: -1, leftLegFwd:  0, rightLegFwd: 1, leftArmFwd: -2, rightArmFwd: -10,  leftArmOut: 0, rightArmOut: -4, tilt: -1, headBob:  0 }, // wind-up: wrist lifts
  { bodyY: -2, leftLegFwd:  0, rightLegFwd: 2, leftArmFwd: -3, rightArmFwd: -18,  leftArmOut: 0, rightArmOut: -6, tilt: -2, headBob: -1 }, // apex: wrist high, arm foreshortened
  { bodyY: -1, leftLegFwd: -2, rightLegFwd: 3, leftArmFwd: -4, rightArmFwd:  18,  leftArmOut: 0, rightArmOut:  8, tilt:  3, headBob:  0 }, // STRIKE: wrist swings down+out
  { bodyY:  0, leftLegFwd: -1, rightLegFwd: 2, leftArmFwd: -2, rightArmFwd:  12,  leftArmOut: 0, rightArmOut:  5, tilt:  2, headBob:  0 }, // follow-through
  { bodyY:  0, leftLegFwd:  0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:   0,  leftArmOut: 0, rightArmOut:  0, tilt:  0, headBob:  0 }, // recovery
];

// ATTACK SWING WEST: 6 frames - melee swing in side profile (facing left)
// Front arm (left) swings: positive leftArmFwd → arm moves left (forward = strike direction).
// frontArmDX = -round(leftArmFwd * 0.6); wrist X = shoulderX(17) + frontArmDX.
// Negative leftArmFwd → positive DX → wrist pulls back (rightward).
// Positive leftArmFwd → negative DX → wrist reaches forward (leftward).
const ATTACK_SWING_WEST_FRAMES = [
  { bodyY: 0,  leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob:  0 }, // ready
  { bodyY: -1, leftLegFwd: -2, rightLegFwd:  2, leftArmFwd:-10, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: -1, headBob:  0 }, // wind-up: wrist pulls back
  { bodyY: -2, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd:-17, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: -2, headBob: -1 }, // apex: wrist fully back, arm angled
  { bodyY: -1, leftLegFwd:  2, rightLegFwd: -2, leftArmFwd: 20, rightArmFwd: -5, leftArmOut: 0, rightArmOut: 0, tilt:  3, headBob:  0 }, // STRIKE: wrist slashes far forward
  { bodyY:  0, leftLegFwd:  1, rightLegFwd: -1, leftArmFwd: 13, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt:  2, headBob:  0 }, // follow-through
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt:  0, headBob:  0 }, // recovery
];

// ATTACK SHOOT SOUTH: 6 frames - ranged weapon (gun/bow) facing camera
// Arm raises and extends outward toward target; recoil kicks arm back on fire.
const ATTACK_SHOOT_SOUTH_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd: 0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // ready
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: 2, leftArmOut: 0, rightArmOut: 4, tilt: 0, headBob:  0 }, // raise arm to aim
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -3, rightArmFwd: 3, leftArmOut: 0, rightArmOut: 6, tilt: 1, headBob:  0 }, // arm fully extended, steady aim
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -3, rightArmFwd: 3, leftArmOut: 0, rightArmOut: 6, tilt: 1, headBob: -1 }, // FIRE (held frame — impact weight)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: 1, leftArmOut: 0, rightArmOut: 2, tilt: 0, headBob:  0 }, // recoil: arm kicks back
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd: 0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // lower/return
];

// ATTACK SHOOT WEST: 6 frames - ranged weapon in side profile (facing left)
// Front arm (left) extends forward (to the left). Recoil snaps arm back briefly.
const ATTACK_SHOOT_WEST_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // ready
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  5, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // raise and extend forward
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  8, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 1, headBob:  0 }, // arm fully extended, steady aim
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  8, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 1, headBob: -1 }, // FIRE (held frame)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  4, rightArmFwd: -1, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // recoil: arm pulls back
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // lower/return
];

// North/East mirrors
const ATTACK_SWING_NORTH_FRAMES = ATTACK_SWING_SOUTH_FRAMES;
const ATTACK_SWING_EAST_FRAMES  = ATTACK_SWING_WEST_FRAMES;
const ATTACK_SHOOT_NORTH_FRAMES = ATTACK_SHOOT_SOUTH_FRAMES;
const ATTACK_SHOOT_EAST_FRAMES  = ATTACK_SHOOT_WEST_FRAMES;

module.exports = {
  IDLE_FRAMES,
  WALK_SOUTH_FRAMES,
  WALK_WEST_FRAMES,
  WALK_NORTH_FRAMES,
  WALK_EAST_FRAMES,
  ATTACK_SWING_SOUTH_FRAMES,
  ATTACK_SWING_WEST_FRAMES,
  ATTACK_SWING_NORTH_FRAMES,
  ATTACK_SWING_EAST_FRAMES,
  ATTACK_SHOOT_SOUTH_FRAMES,
  ATTACK_SHOOT_WEST_FRAMES,
  ATTACK_SHOOT_NORTH_FRAMES,
  ATTACK_SHOOT_EAST_FRAMES,
};
