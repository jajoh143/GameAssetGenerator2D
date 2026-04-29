'use strict';

/**
 * VectorRig — converts a per-frame animation offset table (the same offsets
 * the pixel renderer uses, see animations/AnimationData.js) into joint
 * positions for the vector body parts.
 *
 * The rig is a lightweight skeleton:
 *
 *           head ──── neck
 *                       │
 *           shoulderL ─ chest ─ shoulderR
 *                │       │       │
 *           elbowL    pelvis    elbowR
 *                │     │  │      │
 *           handL     hipL  hipR  handR
 *                       │     │
 *                     kneeL  kneeR
 *                       │     │
 *                     footL  footR
 *
 * Coordinates are in the vector frame's logical space (FRAME_W × FRAME_H).
 * All offsets are scaled by `s = FRAME_W / 64` so the same animation tables
 * (designed for 64×96) port cleanly to whatever vector frame size we pick.
 */

const FRAME_W = 128;
const FRAME_H = 192;

// Body proportions, expressed as ratios of FRAME_H so the rig scales
// gracefully to taller / shorter heroes. Tuned so the character fills the
// frame nicely while leaving ~5 px of headroom for hair to extend past
// the head circle without clipping the top of the frame.
const HEIGHT_DIMS = {
  tiny:   { totalH: 0.55, headR: 0.14, neckLen: 0.020, torsoH: 0.16, legH: 0.10 },
  short:  { totalH: 0.74, headR: 0.14, neckLen: 0.025, torsoH: 0.23, legH: 0.20 },
  medium: { totalH: 0.86, headR: 0.14, neckLen: 0.028, torsoH: 0.28, legH: 0.28 },
  tall:   { totalH: 0.93, headR: 0.14, neckLen: 0.030, torsoH: 0.30, legH: 0.32 },
};

const BUILDS = {
  slim:     { shoulderW: 0.50, hipW: 0.40, limbR: 0.052, torsoTaper: 0.78 },
  average:  { shoulderW: 0.58, hipW: 0.44, limbR: 0.060, torsoTaper: 0.82 },
  muscular: { shoulderW: 0.68, hipW: 0.46, limbR: 0.070, torsoTaper: 0.78 },
  heavy:    { shoulderW: 0.66, hipW: 0.54, limbR: 0.070, torsoTaper: 0.92 },
};

function dims(config) {
  return HEIGHT_DIMS[(config && config.height) || 'medium'] || HEIGHT_DIMS.medium;
}

function build(config) {
  return BUILDS[(config && config.build) || 'average'] || BUILDS.average;
}

/**
 * Compute a rig (joint positions) for a frame in screen coords.
 *
 *   direction: 'south' | 'north' | 'west' | 'east'
 *   offsets:   { bodyY, leftLegFwd, rightLegFwd, leftArmFwd, rightArmFwd,
 *                leftArmOut, rightArmOut, headBob, leftLegLift, rightLegLift }
 *   config:    character config (height/build/etc.)
 *
 *   Returns:   {
 *     direction, frameW, frameH,
 *     center { x, y },              // body vertical center
 *     head   { x, y, r },           // head circle
 *     neck   { x, y },              // neck base
 *     chest  { x, y, w },           // top of torso
 *     pelvis { x, y, w },           // bottom of torso
 *     shoulderL, shoulderR,         // arm roots
 *     elbowL,    elbowR,
 *     handL,     handR,
 *     hipL,      hipR,              // leg roots
 *     kneeL,     kneeR,
 *     footL,     footR,
 *     limbR,                        // arm/leg radius
 *     groundY,                      // y-coord of feet ground
 *   }
 */
function buildRig(config, direction, offsets) {
  const off = offsets || {};
  const d = dims(config);
  const b = build(config);

  // Animation offsets are authored for a 64-px-wide frame; scale to ours.
  const sx = FRAME_W / 64;
  const sy = FRAME_H / 96;

  const bodyY     = (off.bodyY      || 0) * sy;
  const headBob   = (off.headBob    || 0) * sy;
  const lLegFwd   = (off.leftLegFwd  || 0) * sx;
  const rLegFwd   = (off.rightLegFwd || 0) * sx;
  const lArmFwd   = (off.leftArmFwd  || 0) * sx;
  const rArmFwd   = (off.rightArmFwd || 0) * sx;
  const lArmOut   = (off.leftArmOut  || 0) * sx;
  const rArmOut   = (off.rightArmOut || 0) * sx;
  const lLegLift  = (off.leftLegLift  || 0) * sy;
  const rLegLift  = (off.rightLegLift || 0) * sy;

  // Vertical layout (in frame units).  Anchor: feet sit on ground line.
  // Pushed slightly down so the character fills the frame with a small
  // strip of empty floor below.
  const groundY = FRAME_H * 0.95;

  const headR    = FRAME_H * d.headR;
  const torsoH   = FRAME_H * d.torsoH;
  const legH     = FRAME_H * d.legH;
  const neckLen  = FRAME_H * d.neckLen;

  const footY    = groundY;
  const hipY     = footY - legH;
  const chestY   = hipY  - torsoH;
  const neckY    = chestY - neckLen;
  const headCY   = neckY - headR * 0.85;

  // Horizontal layout
  const cx = FRAME_W / 2;
  const shoulderW = FRAME_W * b.shoulderW;
  const hipW      = FRAME_W * b.hipW;
  const limbR     = FRAME_H * b.limbR;

  // Body bob shifts the whole upper body — feet remain anchored.
  const upperShift = bodyY;

  // ── HEAD / NECK / TORSO ──
  const head   = { x: cx, y: headCY + upperShift + headBob, r: headR };
  const neck   = { x: cx, y: neckY + upperShift };
  const chest  = { x: cx, y: chestY + upperShift, w: shoulderW };
  const pelvis = { x: cx, y: hipY  + upperShift, w: hipW };

  // ── SHOULDERS / ARMS ──
  const shoulderL = { x: cx - shoulderW / 2, y: chest.y + headR * 0.15 };
  const shoulderR = { x: cx + shoulderW / 2, y: chest.y + headR * 0.15 };

  // ── HIPS / LEGS ──
  const hipL = { x: cx - hipW / 2 + limbR * 0.5, y: pelvis.y };
  const hipR = { x: cx + hipW / 2 - limbR * 0.5, y: pelvis.y };

  // South / North: arms swing forward/back along Y, legs swing forward/back along Y.
  // West / East:   arms swing forward/back along X, legs swing along X with lift in Y.
  let elbowL, elbowR, handL, handR, kneeL, kneeR, footL, footR;

  const armLen = torsoH * 0.55;
  const legLen = legH;

  if (direction === 'south' || direction === 'north') {
    // ── Arms ──
    // The elbow gets a slight inward bend (cartoon proportion) plus a
    // bigger arc when the arm swings forward — gives the arm a more
    // organic curve than a straight ribbon.
    const armBendIn = limbR * 0.6;   // small inward bow at elbow
    elbowL = {
      x: shoulderL.x + armBendIn * 0.5 + lArmOut * 0.4,  // bow slightly toward body
      y: shoulderL.y + armLen * 0.48 + lArmFwd * 0.45,
    };
    handL  = {
      x: shoulderL.x - 2 + lArmOut * 1.0,
      y: shoulderL.y + armLen + lArmFwd * 1.0,
    };
    elbowR = {
      x: shoulderR.x - armBendIn * 0.5 + rArmOut * 0.4,
      y: shoulderR.y + armLen * 0.48 + rArmFwd * 0.45,
    };
    handR  = {
      x: shoulderR.x + 2 + rArmOut * 1.0,
      y: shoulderR.y + armLen + rArmFwd * 1.0,
    };

    // ── Legs ──
    // The knee LEADS the foot in the direction of stride. When the leg
    // swings forward (lLegFwd > 0), the knee shifts forward more than
    // halfway, then the foot continues past it — creates a forward-bent
    // knee silhouette typical of a chibi walk cycle.
    const lLegSign = lLegFwd >= 0 ? 1 : -1;
    const rLegSign = rLegFwd >= 0 ? 1 : -1;
    const baseBend = limbR * 0.20;
    kneeL = {
      x: hipL.x - Math.abs(lLegFwd) * 0.55 + baseBend * 0.6,
      y: hipL.y + legLen * 0.45 + Math.abs(lLegFwd) * 0.30 * lLegSign,
    };
    footL = {
      x: hipL.x - Math.abs(lLegFwd) * 0.85,
      y: footY + lLegFwd * 0.40 * lLegSign,
    };
    kneeR = {
      x: hipR.x + Math.abs(rLegFwd) * 0.55 - baseBend * 0.6,
      y: hipR.y + legLen * 0.45 + Math.abs(rLegFwd) * 0.30 * rLegSign,
    };
    footR = {
      x: hipR.x + Math.abs(rLegFwd) * 0.85,
      y: footY + rLegFwd * 0.40 * rLegSign,
    };
  } else {
    // SIDE VIEW (west).  Both shoulders collapse onto a single x. Arms swing
    // forward (negative X) / back (positive X). The "left" arm is the front
    // arm in west view by convention.
    const sideSpread = shoulderW * 0.04;
    shoulderL.x = cx - sideSpread;
    shoulderR.x = cx + sideSpread;

    // ── Arms (side view) ──
    // The elbow bends slightly forward of the swing direction so the arm
    // reads as articulated, not as a straight stick.
    elbowL = {
      x: shoulderL.x - lArmFwd * 0.45 - limbR * 0.30,
      y: shoulderL.y + armLen * 0.48,
    };
    handL  = {
      x: shoulderL.x - lArmFwd * 1.0,
      y: shoulderL.y + armLen * 0.95,
    };
    elbowR = {
      x: shoulderR.x - rArmFwd * 0.45 + limbR * 0.30,
      y: shoulderR.y + armLen * 0.48,
    };
    handR  = {
      x: shoulderR.x - rArmFwd * 1.0,
      y: shoulderR.y + armLen * 0.95,
    };

    const sideHipSpread = hipW * 0.06;
    hipL.x = cx - sideHipSpread;
    hipR.x = cx + sideHipSpread;

    // Knee leads the foot in the swing direction AND lifts when the foot
    // lifts (raised foot → bent knee). When the leg is planted (no lift)
    // the knee sits straight ahead. When the leg lifts, the knee bends
    // dramatically forward and up.
    const lLiftFrac = lLegLift > 0 ? Math.min(1, lLegLift / (legLen * 0.4)) : 0;
    const rLiftFrac = rLegLift > 0 ? Math.min(1, rLegLift / (legLen * 0.4)) : 0;
    kneeL = {
      x: hipL.x - lLegFwd * 0.55 - lLiftFrac * legLen * 0.18,
      y: hipL.y + legLen * 0.50 - lLegLift * 0.85,
    };
    footL = {
      x: hipL.x - lLegFwd * 1.0,
      y: footY - lLegLift,
    };
    kneeR = {
      x: hipR.x - rLegFwd * 0.55 - rLiftFrac * legLen * 0.18,
      y: hipR.y + legLen * 0.50 - rLegLift * 0.85,
    };
    footR = {
      x: hipR.x - rLegFwd * 1.0,
      y: footY - rLegLift,
    };
  }

  // Species that draw their own ear shape (goblin: long pointed ears,
  // lizardfolk: snout + crest, no separate ears) skip the default human
  // ear bumps so they don't double-draw.
  const species = (config && config.type) || 'human';
  const skipEars = species === 'goblin' || species === 'lizardfolk';

  return {
    direction,
    frameW: FRAME_W,
    frameH: FRAME_H,
    head, neck, chest, pelvis,
    shoulderL, shoulderR,
    elbowL,    elbowR,
    handL,     handR,
    hipL,      hipR,
    kneeL,     kneeR,
    footL,     footR,
    limbR,
    groundY,
    species,
    skipEars,
  };
}

module.exports = {
  FRAME_W,
  FRAME_H,
  HEIGHT_DIMS,
  BUILDS,
  buildRig,
};
