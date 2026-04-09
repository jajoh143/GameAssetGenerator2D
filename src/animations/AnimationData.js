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
// Fluidity principles applied:
//   F0 — Anticipation: arm pulls slightly opposite direction before committing
//   F1 — Wind-up: arm lifts aggressively, body rises
//   F2 — Apex: arm at maximum height overhead
//   F3 — MID-SWING (smear): arm mid-arc, passing straight-down (fastest point)
//          This splits the old single F2→F3 jump (ΔrFwd=58) into two smaller
//          jumps (≈30 each), so the eye perceives speed rather than a teleport.
//   F4 — Strike: arm fully committed down-right, body leans in
//   F5 — Recovery: arm settles back toward rest
//
// rArmDY = round(rightArmFwd * 0.4); wrist Y = 28 + rArmDY + 11
// wrist X = 41 + round(rightArmOut)
const ATTACK_SWING_SOUTH_FRAMES = [
  { bodyY: 0,  leftLegFwd: -1, rightLegFwd:  1, leftArmFwd:  1, rightArmFwd:  -5, leftArmOut: 0, rightArmOut:  -2, tilt:  0, headBob:  0 }, // anticipation
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd: -2, rightArmFwd: -22, leftArmOut: 0, rightArmOut:  -8, tilt:  0, headBob:  0 }, // wind-up: arm lifts to shoulder
  { bodyY: -2, leftLegFwd:  0, rightLegFwd:  2, leftArmFwd: -3, rightArmFwd: -40, leftArmOut: 0, rightArmOut:  -9, tilt:  0, headBob: -1 }, // apex: wrist overhead
  { bodyY: -2, leftLegFwd: -1, rightLegFwd:  2, leftArmFwd: -3, rightArmFwd: -10, leftArmOut: 0, rightArmOut:   0, tilt:  0, headBob:  0 }, // mid-swing smear: arm straight-down (mid-arc, fast)
  { bodyY: -1, leftLegFwd: -2, rightLegFwd:  3, leftArmFwd: -4, rightArmFwd:  20, leftArmOut: 0, rightArmOut:  10, tilt:  0, headBob:  0 }, // STRIKE: wrist extends lower-right
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd: -1, rightArmFwd:   8, leftArmOut: 0, rightArmOut:   4, tilt:  0, headBob:  0 }, // recovery
];

// ATTACK SWING WEST: 6 frames - melee swing in side profile (facing left)
// Same smear-frame approach: F3 is the mid-arc neutral position, splitting
// the old single ΔlFwd=37 jump into two ≈20-unit steps.
// frontArmDX = -round(leftArmFwd * 0.6); wrist X = shoulderX(17) + frontArmDX
const ATTACK_SWING_WEST_FRAMES = [
  { bodyY: 0,  leftLegFwd:  1, rightLegFwd: -1, leftArmFwd:  -3, rightArmFwd:  1, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob:  0 }, // anticipation: slight forward lean, arm barely forward
  { bodyY: -1, leftLegFwd: -2, rightLegFwd:  2, leftArmFwd: -12, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob:  0 }, // wind-up: arm pulls back
  { bodyY: -2, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd: -20, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob: -1 }, // apex: arm fully back
  { bodyY: -2, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd:   0, rightArmFwd: -1, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob:  0 }, // mid-swing smear: arm at neutral (fast)
  { bodyY: -1, leftLegFwd:  2, rightLegFwd: -2, leftArmFwd:  22, rightArmFwd: -5, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob:  0 }, // STRIKE: arm extended fully forward
  { bodyY:  0, leftLegFwd:  1, rightLegFwd: -1, leftArmFwd:  10, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0,  headBob:  0 }, // recovery
];

// ATTACK SHOOT SOUTH: 6 frames - gun/wand facing camera
// Key improvement: arm raised to SHOULDER HEIGHT (wrist reaches y≈29 at apex,
// vs y≈40 before = barely moved). For guns the arm extends diagonally forward-up;
// for wands it reads as the spellcasting pose.
// F3 FIRE: bodyY=-2 + headBob=-2 = body and head commit forward into the shot.
// F4 RECOIL: arm kicks slightly up-back (realistic gun recoil / wand kickback).
const ATTACK_SHOOT_SOUTH_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:   0, leftArmOut: 0, rightArmOut:  0, tilt: 0, headBob:  0 }, // ready
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: -15, leftArmOut: 0, rightArmOut:  5, tilt: 0, headBob:  0 }, // raise: arm lifts and extends (wrist ≈ y=33)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -3, rightArmFwd: -25, leftArmOut: 0, rightArmOut:  8, tilt: 0, headBob:  0 }, // aim: arm at shoulder height (wrist ≈ y=29)
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -3, rightArmFwd: -25, leftArmOut: 0, rightArmOut:  8, tilt: 0, headBob: -2 }, // FIRE: body + head commit forward, arm held
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: -28, leftArmOut: 0, rightArmOut:  5, tilt: 0, headBob:  0 }, // recoil: arm kicks up-back (wrist ≈ y=28)
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:   0, leftArmOut: 0, rightArmOut:  0, tilt: 0, headBob:  0 }, // lower/return
];

// ATTACK SHOOT WEST: 6 frames - gun/wand in side profile (facing left)
// Arm extends forward (leftward) more aggressively; body commits on FIRE.
// F4 recoil: arm snaps back slightly from the shot.
const ATTACK_SHOOT_WEST_FRAMES = [
  { bodyY: 0,  leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // ready
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  8, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // raise and extend forward
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 14, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // aim: arm fully extended forward
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 14, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -2 }, // FIRE: body + head commit into shot
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 10, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // recoil: arm snaps back slightly
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
