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
// Full contact→recoil→passing→high-point cycle for each leg.
// Frame naming: C=contact (heel strikes, body lowest), R=recoil (weight over foot, body rising),
//               P=passing (lifted foot crosses, body highest), H=high point (foot swings forward, body descending).
// Body bob: +1 raw at contact (renders +2px dip), -1 raw at passing (renders -2px rise) = 4px total arc.
// Arm swing opposes leg (natural balance). leftLegLift lifts front(L) leg, rightLegLift lifts back(R).
// Depth fix in HumanCharacter.js: front/back assignment uses actual screen X, not leg identity.
const WALK_WEST_FRAMES = [
  // Frame 0 — Contact L: L heel strikes, body at lowest point
  { bodyY:  1, leftLegFwd:  7, rightLegFwd: -5, leftArmFwd: -5, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 0 },
  // Frame 1 — Recoil L: body rising over planted foot, back foot begins to lift
  { bodyY:  0, leftLegFwd:  4, rightLegFwd: -3, leftArmFwd: -3, rightArmFwd:  3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 3 },
  // Frame 2 — Passing: body at highest, R foot lifted and crossing, legs nearly together
  { bodyY: -1, leftLegFwd:  1, rightLegFwd:  0, leftArmFwd: -1, rightArmFwd:  1, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 7 },
  // Frame 3 — High point R: R foot swings to front, body descending
  { bodyY:  0, leftLegFwd: -2, rightLegFwd:  5, leftArmFwd:  2, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 2 },
  // Frame 4 — Contact R: R heel strikes, body at lowest point
  { bodyY:  1, leftLegFwd: -5, rightLegFwd:  7, leftArmFwd:  5, rightArmFwd: -5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 0, rightLegLift: 0 },
  // Frame 5 — Recoil R: body rising over planted foot, back foot begins to lift
  { bodyY:  0, leftLegFwd: -3, rightLegFwd:  4, leftArmFwd:  3, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 3, rightLegLift: 0 },
  // Frame 6 — Passing: body at highest, L foot lifted and crossing, legs nearly together
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd:  1, rightArmFwd: -1, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 7, rightLegLift: 0 },
  // Frame 7 — High point L: L foot swings to front, body descending
  { bodyY:  0, leftLegFwd:  5, rightLegFwd: -2, leftArmFwd: -2, rightArmFwd:  2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: 0, leftLegLift: 2, rightLegLift: 0 },
];

// WALK NORTH: 8 frames - walking away from camera
const WALK_NORTH_FRAMES = WALK_SOUTH_FRAMES; // same offsets, different drawing

// WALK EAST: 8 frames - walking right (mirrored west)
const WALK_EAST_FRAMES = WALK_WEST_FRAMES; // same offsets, mirrored at render time

// ATTACK SWING SOUTH: 8 frames - melee sword/weapon swing facing camera
// Structure: anticipation(squat) → wind-up(slow) → apex(hold) → smear → STRIKE(fastest Δ) → overshoot+squash → recovery
// rArmDY = round(rightArmFwd * 0.9); at strike rFwd=12 → rArmDY≈11px down from torso.
// ATTACK SWING SOUTH: 8 frames - melee sword/weapon swing facing camera
// rArmOut positive = hand moves RIGHT (toward sword side).
// Wind-up raises arm UP-RIGHT above the shoulder; strike slashes DOWN-LEFT
// across the body.  This gives a proper right-hand diagonal slash arc
// instead of the old backhand motion.
const ATTACK_SWING_SOUTH_FRAMES = [
  { bodyY: +1, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  0, rightArmFwd:  -4, leftArmOut: 0, rightArmOut:   1, tilt: 0, headBob:  0 }, // F0 anticipation
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd: -1, rightArmFwd: -12, leftArmOut: 0, rightArmOut:   5, tilt: 0, headBob:  0 }, // F1 wind-up: arm rises right
  { bodyY: -2, leftLegFwd:  0, rightLegFwd:  2, leftArmFwd: -2, rightArmFwd: -20, leftArmOut: 0, rightArmOut:   8, tilt: 0, headBob:  0 }, // F2 wind-up high: arm upper-right
  { bodyY: -2, leftLegFwd:  0, rightLegFwd:  2, leftArmFwd: -2, rightArmFwd: -22, leftArmOut: 0, rightArmOut:   9, tilt: 0, headBob: -1 }, // F3 apex: arm overhead-right
  { bodyY: -1, leftLegFwd: -1, rightLegFwd:  2, leftArmFwd: -3, rightArmFwd:  -6, leftArmOut: 0, rightArmOut:   1, tilt: 0, headBob:  0 }, // F4 smear: arm whips through
  { bodyY:  0, leftLegFwd: -2, rightLegFwd:  3, leftArmFwd: -4, rightArmFwd:  12, leftArmOut: 0, rightArmOut: -10, tilt: 0, headBob:  0 }, // F5 STRIKE: slashes down-left
  { bodyY: +1, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd: -4, rightArmFwd:  14, leftArmOut: 0, rightArmOut: -12, tilt: 0, headBob:  0 }, // F6 overshoot
  { bodyY:  0, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd: -1, rightArmFwd:   5, leftArmOut: 0, rightArmOut:  -3, tilt: 0, headBob:  0 }, // F7 recovery
];

// ATTACK SWING WEST: 8 frames - melee swing in side profile (facing left)
// frontArmDX = -round(leftArmFwd * 1.4). Structure mirrors SWING_SOUTH: squat→wind-up→apex→smear→STRIKE→overshoot→recovery.
const ATTACK_SWING_WEST_FRAMES = [
  { bodyY: +1, leftLegFwd:  0, rightLegFwd:  0, leftArmFwd:  -3, rightArmFwd:  1, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F0 anticipation: squat, arm barely raised
  { bodyY: -1, leftLegFwd: -1, rightLegFwd:  1, leftArmFwd: -10, rightArmFwd:  2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F1 wind-up: body rises, arm pulls back (Δ=7)
  { bodyY: -2, leftLegFwd: -2, rightLegFwd:  2, leftArmFwd: -18, rightArmFwd:  4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F2 wind-up high: arm mostly back (Δ=8)
  { bodyY: -2, leftLegFwd: -3, rightLegFwd:  3, leftArmFwd: -20, rightArmFwd:  5, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 }, // F3 apex: pause at top (Δ=2)
  { bodyY: -1, leftLegFwd:  0, rightLegFwd:  1, leftArmFwd:  -4, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F4 smear: arm whips through arc (Δ=16)
  { bodyY:  0, leftLegFwd:  1, rightLegFwd: -1, leftArmFwd:  14, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F5 STRIKE: biggest Δ=18, arm at full extension
  { bodyY: +1, leftLegFwd:  2, rightLegFwd: -2, leftArmFwd:  17, rightArmFwd: -4, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F6 overshoot+squash: arm 3 past, body drops (Δ=3)
  { bodyY:  0, leftLegFwd:  1, rightLegFwd: -1, leftArmFwd:   8, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F7 recovery (Δ=9)
];

// ATTACK SHOOT SOUTH: 6 frames - gun/wand facing camera
// Arm starts in slight ready-stance (rFwd=-3) for cleaner raise arc. Recoil Δ=5 vs apex.
const ATTACK_SHOOT_SOUTH_FRAMES = [
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  -3, leftArmOut: 0, rightArmOut:  2, tilt: 0, headBob:  0 }, // F0 ready stance: arm slightly raised
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -1, rightArmFwd: -12, leftArmOut: 0, rightArmOut:  8, tilt: 0, headBob:  0 }, // F1 raise: quick lift (Δ=9)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: -16, leftArmOut: 0, rightArmOut: 10, tilt: 0, headBob:  0 }, // F2 aim: wrist at eye level (Δ=4)
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -2, rightArmFwd: -16, leftArmOut: 0, rightArmOut: 10, tilt: 0, headBob: -1 }, // F3 FIRE: body + head commit (hold arm)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: -1, rightArmFwd:  -9, leftArmOut: 0, rightArmOut:  5, tilt: 0, headBob:  0 }, // F4 recoil: kick back (Δ=7)
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  0, rightArmFwd:  -3, leftArmOut: 0, rightArmOut:  1, tilt: 0, headBob:  0 }, // F5 lower: returns to ready (Δ=6)
];

// ATTACK SHOOT WEST: 6 frames - gun/wand in side profile (facing left)
// Arm starts slightly extended (lFwd=2) for natural ready stance. Recoil Δ=6 feels snappy without jarring.
const ATTACK_SHOOT_WEST_FRAMES = [
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  2, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F0 ready stance: arm slightly extended
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  9, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F1 raise and extend (Δ=7)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 16, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F2 aim: arm fully extended (Δ=7)
  { bodyY: -2, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 16, rightArmFwd: -3, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob: -1 }, // F3 FIRE: body + head commit (hold arm)
  { bodyY: -1, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd: 10, rightArmFwd: -2, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F4 recoil: snappy pullback (Δ=6)
  { bodyY:  0, leftLegFwd: 0, rightLegFwd: 0, leftArmFwd:  3, rightArmFwd:  0, leftArmOut: 0, rightArmOut: 0, tilt: 0, headBob:  0 }, // F5 lower: gradual return (Δ=7)
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
