'use strict';

const fs   = require('fs');
const path = require('path');
const { getYAnchors } = require('../characters/HumanCharacter');

// ── Drawing constants (must match BaseCharacter.js) ────────────────────────
// Hand anchor math is derived from the actual draw functions:
//   drawArmsSouth        — sleeveH=13, baseY = torsoY - 1, shoulderRX = 43, lx = 18
//   drawFrontArmWest     — sleeveH=13, frontY = torsoY - 1, shoulderX = torsoX - 1
//   drawBackArmWest      — sleeveH=13, backY  = torsoY - 1, shoulderX = torsoX + 11
//   HumanCharacter.drawSouth scales arm offsets by 0.9 before passing to drawArmsSouth
//   HumanCharacter.drawWest  scales arm offsets by 1.4 before passing to draw*ArmWest
const SLEEVE_H        = 13;
const HAND_W          = 4;
const S_SHOULDER_RX   = 43;
const S_SHOULDER_LX   = 18;
const S_ARM_DY_SCALE  = 0.9;
const W_TORSO_X       = 16;
const W_FRONT_DX_REL  = -1;   // shoulderX = torsoX + this
const W_BACK_DX_REL   =  11;
const W_ARM_DX_SCALE  = 1.4;

const FRAME_W = 64;
const FRAME_CENTER_X = 32;
const HEAD_HALF_H = 7;       // drawHeadSouth chin at y=50, head 14 tall → mid is 7 above chin

// ── Anchor helpers ─────────────────────────────────────────────────────────

function toDeg(rad) {
  return Math.round(rad * (180 / Math.PI) * 10) / 10;
}

function anchor(hx, hy, sx, sy) {
  const cx = hx + Math.floor(HAND_W / 2);
  const cy = hy + 2;
  return {
    x:         cx,
    y:         cy,
    shoulderX: sx,
    shoulderY: sy,
    angleDeg:  toDeg(Math.atan2(cy - sy, cx - sx)),
  };
}

// In south view drawArmsSouth: rRowX(maxRow=12) = shoulderRX + Math.round(rArmOut*12/12)
// hand position = (shoulderRX + rArmOut, baseY + rArmDY + sleeveH) where baseY = torsoY - 1.
function southRightHand(f, yAnchors) {
  const torsoY  = yAnchors ? yAnchors.torsoY : 43;
  const baseY   = torsoY - 1;
  const rArmDY  = Math.round((f.rightArmFwd || 0) * S_ARM_DY_SCALE);
  const rArmOut = f.rightArmOut || 0;
  const hx = S_SHOULDER_RX + Math.round(rArmOut);
  const hy = baseY + rArmDY + SLEEVE_H;
  return anchor(hx, hy, S_SHOULDER_RX, baseY);
}

// Left arm: at maxRow lShift is 0, lArmX = lx + 0 + Math.round(lArmOut).
function southLeftHand(f, yAnchors) {
  const torsoY = yAnchors ? yAnchors.torsoY : 43;
  const baseY  = torsoY - 1;
  const lArmDY = Math.round((f.leftArmFwd || 0) * S_ARM_DY_SCALE);
  const lArmOut = f.leftArmOut || 0;
  const hx = S_SHOULDER_LX + Math.round(lArmOut);
  const hy = baseY + lArmDY + SLEEVE_H;
  return anchor(hx, hy, S_SHOULDER_LX, baseY);
}

// West view: front arm is the body-side arm (left arm anatomically).
// drawFrontArmWest: shoulderX = torsoX - 1, frontY = torsoY - 1.
// rowX(maxRow) = shoulderX + frontArmDX where frontArmDX = -round(leftArmFwd*1.4).
function westFrontHand(f, yAnchors) {
  const torsoY    = yAnchors ? yAnchors.torsoY + (f.bodyY || 0) : (43 + (f.bodyY || 0));
  const frontY    = torsoY - 1;
  const shoulderX = W_TORSO_X + W_FRONT_DX_REL;             // 15
  const dx        = -Math.round((f.leftArmFwd || 0) * W_ARM_DX_SCALE);
  const hx        = shoulderX + dx;
  const hy        = frontY + SLEEVE_H;
  return anchor(hx, hy, shoulderX, frontY);
}

function westBackHand(f, yAnchors) {
  const torsoY    = yAnchors ? yAnchors.torsoY + (f.bodyY || 0) : (43 + (f.bodyY || 0));
  const backY     = torsoY - 1;
  const shoulderX = W_TORSO_X + W_BACK_DX_REL;              // 27
  const dx        = -Math.round((f.rightArmFwd || 0) * W_ARM_DX_SCALE);
  const hx        = shoulderX + dx;
  const hy        = backY + SLEEVE_H;
  return anchor(hx, hy, shoulderX, backY);
}

function mirrorAnchor(a) {
  const mx = (x) => FRAME_W - 1 - x;
  return {
    x:         mx(a.x),
    y:         a.y,
    shoulderX: mx(a.shoulderX),
    shoulderY: a.shoulderY,
    // Mirror flips sign of the X component: angle = atan2(dy, -dx)
    angleDeg:  toDeg(Math.atan2(a.y - a.shoulderY, mx(a.x) - mx(a.shoulderX))),
  };
}

function bodyPoint(x, y) {
  return { x, y };
}

// Compute head/torso/feet body-slot anchors for a single frame.
// Returned coordinates are in 64×96 frame space; buildMeta() scales to
// the actual output frameSize.
function computeBodySlots(direction, f, yAnchors) {
  const bodyY      = f.bodyY    || 0;
  const headBob    = f.headBob  || 0;
  const torsoYAdj  = yAnchors.torsoY + bodyY;
  const torsoMid   = torsoYAdj + Math.round((yAnchors.beltY - yAnchors.torsoY) / 2);
  const headMidY   = yAnchors.headTopY + bodyY + headBob + HEAD_HALF_H;
  const shoeY      = yAnchors.shoeY + bodyY;

  if (direction === 'south' || direction === 'north') {
    const lLegFwd = f.leftLegFwd  || 0;
    const rLegFwd = f.rightLegFwd || 0;
    return {
      head:      bodyPoint(FRAME_CENTER_X, headMidY),
      torso:     bodyPoint(FRAME_CENTER_X, torsoMid),
      leftFoot:  bodyPoint(28 + Math.round(lLegFwd * 0.3), shoeY + 2),
      rightFoot: bodyPoint(35 + Math.round(rLegFwd * 0.3), shoeY + 2),
    };
  }
  if (direction === 'west') {
    const torsoCx = W_TORSO_X + 5;            // ~midpoint of west torso silhouette (21)
    const lLift   = f.leftLegLift  || 0;
    const rLift   = f.rightLegLift || 0;
    return {
      head:      bodyPoint(torsoCx,     headMidY),
      torso:     bodyPoint(torsoCx,     torsoMid),
      leftFoot:  bodyPoint(torsoCx - 1, shoeY + 2 - lLift),
      rightFoot: bodyPoint(torsoCx + 1, shoeY + 2 - rLift),
    };
  }
  if (direction === 'east') {
    const mxX = (x) => FRAME_W - 1 - x;
    const torsoCx = mxX(W_TORSO_X + 5);        // mirrored midpoint (43)
    const lLift   = f.leftLegLift  || 0;
    const rLift   = f.rightLegLift || 0;
    return {
      head:      bodyPoint(torsoCx,     headMidY),
      torso:     bodyPoint(torsoCx,     torsoMid),
      leftFoot:  bodyPoint(torsoCx + 1, shoeY + 2 - lLift),
      rightFoot: bodyPoint(torsoCx - 1, shoeY + 2 - rLift),
    };
  }
  return {};
}

function computeFrameAnchors(direction, f, yAnchors) {
  const bodySlots = yAnchors ? computeBodySlots(direction, f, yAnchors) : {};
  switch (direction) {
    case 'south':
    case 'north':
      return {
        weaponHand: southRightHand(f, yAnchors),
        offHand:    southLeftHand(f, yAnchors),
        ...bodySlots,
      };
    case 'west': {
      const front = westFrontHand(f, yAnchors);
      const back  = westBackHand(f, yAnchors);
      return { weaponHand: front, offHand: back, ...bodySlots };
    }
    case 'east': {
      // East = horizontal mirror of west
      const front = mirrorAnchor(westFrontHand(f, yAnchors));
      const back  = mirrorAnchor(westBackHand(f, yAnchors));
      return { weaponHand: front, offHand: back, ...bodySlots };
    }
    default:
      return bodySlots;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Build the full meta object for a spritesheet.
 *
 * @param {number}   frameSize      - Pixel size of each frame
 * @param {string[]} animationRows  - Ordered list of animation names
 * @param {Function} getFrames      - (animName) => frameOffset[]
 * @param {Function} getDirection   - (animName) => 'south'|'north'|'west'|'east'
 * @param {object}   [config]       - Character config — used to derive height-aware
 *                                    body-slot anchors (head, torso, feet) per frame.
 * @returns {object}
 */
function buildMeta(frameSize, animationRows, getFramesFn, getDirectionFn, config) {
  const scale = frameSize / FRAME_W;   // for non-64 output sizes
  const yAnchors = config ? getYAnchors(config) : null;

  const scaleHandAnchor = (a) => a ? {
    x:         Math.round(a.x         * scale),
    y:         Math.round(a.y         * scale),
    shoulderX: Math.round(a.shoulderX * scale),
    shoulderY: Math.round(a.shoulderY * scale),
    angleDeg:  a.angleDeg,
  } : undefined;

  const scalePoint = (p) => p ? {
    x: Math.round(p.x * scale),
    y: Math.round(p.y * scale),
  } : undefined;

  const animations = {};
  animationRows.forEach((animName, rowIdx) => {
    const direction = getDirectionFn(animName);
    const offsets   = getFramesFn(animName);

    const frames = offsets.map((f) => {
      const anchors = computeFrameAnchors(direction, f, yAnchors);
      return {
        weaponHand: scaleHandAnchor(anchors.weaponHand),
        offHand:    scaleHandAnchor(anchors.offHand),
        head:       scalePoint(anchors.head),
        torso:      scalePoint(anchors.torso),
        leftFoot:   scalePoint(anchors.leftFoot),
        rightFoot:  scalePoint(anchors.rightFoot),
      };
    });

    animations[animName] = {
      row:        rowIdx,
      frameCount: offsets.length,
      direction,
      frames,
    };
  });

  return {
    frameSize,
    sheetColumns: 8,
    animations,
  };
}

/**
 * Write meta JSON next to an existing spritesheet PNG.
 *
 * @param {object} meta        - Result of buildMeta()
 * @param {string} pngPath     - Path to the .png file
 */
function saveMeta(meta, pngPath) {
  const jsonPath = pngPath.replace(/\.png$/i, '_meta.json');
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2));
  return jsonPath;
}

module.exports = { buildMeta, saveMeta };
