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

// ATTACK SWING SOUTH: 8 frames - melee sword/weapon swing facing camera
// 8 frames keeps sheet width at 768 (= 8×96, same as walk rows).
// Reduced peak values so the fist stays below the chin and arc jumps
// are ≤15 rFwd units per frame (was up to 30).
//
// rArmDY = round(rightArmFwd * 0.6); hand Y = torsoY + rArmDY + sleeveH
// At apex (bodyY=-2→-3, torsoY≈32): rArmDY=round(-22×0.6)=-13 → hand y≈35 (chin-safe).
const ATTACK_SWING_SOUTH_FRAMES = [
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  -3, leftArmOut: 0, rightArmOut:  -1, tilt: 0, headBob:  0 }, // F0 anticipation
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd: -1, rightArmFwd: -10, leftArmOut: 0, rightArmOut:  -4, tilt: 0, headBob:  0 }, // F1 wind-up start
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd: -2, rightArmFwd: -17, leftArmOut: 0, rightArmOut:  -6, tilt: 0, headBob:  0 }, // F2 wind-up high
  { bodyY: -2, leftLegFwd:  0, rightLegFwd:  2, leftArmFwd: -2, rightArmFwd: -22, leftArmOut: 0, rightArmOut:  -8, tilt: 0, headBob: -1 }, // F3 apex — arm overhead
  { bodyY: -1, leftLegFwd: -1, rightLegFwd:  2, leftArmFwd: -3, rightArmFwd:  -8, leftArmOut: 0, rightArmOut:  -2, tilt: 0, headBob:  0 }, // F4 smear: fast mid-swing (Δ=14)
  { bodyY:  0, leftLegFwd: -2, rightLegFwd:  2, leftArmFwd: -3, rightArmFwd:   5, leftArmOut: 0, rightArmOut:   5, tilt: 0, headBob:  0 }, // F5 pre-strike (Δ=13)
  { bodyY:  0, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd: -4, rightArmFwd:  12, leftArmOut: 0, rightArmOut:   8, tilt: 0, headBob:  0 }, // F6 STRIKE (Δ=7)
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd: -1, rightArmFwd:   6, leftArmOut: 0, rightArmOut:   3, tilt: 0, headBob:  0 }, // F7 recovery
];

// ATTACK SWING WEST: 8 frames - melee swing in side profile (facing left)
// frontArmDX = -round(leftArmFwd * 0.9). Max jump ≤13 units (was 18-20).
const ATTACK_SWING_WEST_FRAMES = [
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  -2, rightArmFwd:  1, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F0 anticipation
  { bodyY: -1, leftLegFwd: -1, rightLegFwd:  1, leftArmFwd:  -7, rightArmFwd:  2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F1 pulling back
  { bodyY: -2, leftLegFwd: -2, rightLegFwd:  2, leftArmFwd: -14, rightArmFwd:  4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F2 arm mostly back
  { bodyY: -2, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd: -20, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 }, // F3 apex: arm fully back
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd:  -6, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F4 smear: fast swing (Δ=13)
  { bodyY:  0, leftLegFwd:  1, rightLegFwd: -1, leftArmFwd:   8, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F5 arm forward (Δ=13)
  { bodyY:  0, leftLegFwd:  2, rightLegFwd: -2, leftArmFwd:  20, rightArmFwd: -5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F6 STRIKE: arm extended (Δ=11)
  { bodyY:  0, leftLegFwd:  1, rightLegFwd: -1, leftArmFwd:  11, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F7 recovery
];

// ATTACK SHOOT SOUTH: 6 frames - gun/wand facing camera
// F5 lowered to rFwd=-4/rOut=2 so the recovery snap is ≤7 units (was 15).
const ATTACK_SHOOT_SOUTH_FRAMES = [
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:   0, leftArmOut: 0, rightArmOut:  0, tilt: 0, headBob:  0 }, // F0 ready
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -1, rightArmFwd:  -8, leftArmOut: 0, rightArmOut:  6, tilt: 0, headBob:  0 }, // F1 raise: larger initial lift
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: -14, leftArmOut: 0, rightArmOut:  9, tilt: 0, headBob:  0 }, // F2 aim: wrist near eye level
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: -14, leftArmOut: 0, rightArmOut:  9, tilt: 0, headBob: -1 }, // F3 FIRE: body + head commit
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -1, rightArmFwd: -10, leftArmOut: 0, rightArmOut:  5, tilt: 0, headBob:  0 }, // F4 recoil: smaller kick (Δ=4 vs apex)
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  -4, leftArmOut: 0, rightArmOut:  2, tilt: 0, headBob:  0 }, // F5 lower: gradual return (Δ=6, not snap)
];

// ATTACK SHOOT WEST: 6 frames - gun/wand in side profile (facing left)
// F5 set to lFwd=4 so recovery is gradual (Δ=7, not snap from 10→0).
const ATTACK_SHOOT_WEST_FRAMES = [
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F0 ready
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  7, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F1 raise and extend
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 14, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F2 aim: arm fully extended
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 14, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 }, // F3 FIRE: body + head commit
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 11, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F4 recoil: small pullback (Δ=3)
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  4, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F5 lower: gradual return (Δ=7)
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
