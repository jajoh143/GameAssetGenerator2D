'use strict';

const fs   = require('fs');
const path = require('path');
const { getYAnchors } = require('../characters/HumanCharacter');

// ── Drawing constants (must match BaseCharacter.js) ────────────────────────
// South / North view  — drawArmsSouth
const S_SHOULDER_RX = 41;   // right-arm shoulder left-edge anchor
const S_SHOULDER_LX = 18;   // left-arm  shoulder left-edge anchor
const S_BASE_Y      = 28;   // shoulder row Y
const S_SLEEVE_H    = 11;   // rows 0-10
const S_HAND_W      = 4;    // rhw = baseAW - 1
const S_R_SCALE     = 0.4;  // rArmDY = round(rightArmFwd * 0.4)
const S_L_SCALE     = 0.4;

// West view  — drawFrontArmWest / drawBackArmWest
const W_TORSO_X     = 20;   // torsoX (constant)
const W_TORSO_Y0    = 29;   // torsoY when bodyY=0   (64-4-13-2-16=29)
const W_SLEEVE_H    = 11;
const W_HAND_W      = 4;
const W_F_SCALE     = 0.6;  // frontArmDX = -round(leftArmFwd  * 0.6)
const W_B_SCALE     = 0.6;  // backArmDX  = -round(rightArmFwd * 0.6)

// East is a horizontal mirror of west (spriteSize - 1 - x)
const FRAME_W = 64;
const FRAME_CENTER_X = 32;
const HEAD_HALF_H = 7;       // drawHeadSouth chin at y=50, head 14 tall → mid is 7 above chin

// ── Anchor helpers ─────────────────────────────────────────────────────────

function toDeg(rad) {
  return Math.round(rad * (180 / Math.PI) * 10) / 10;
}

function anchor(hx, hy, sx, sy) {
  const cx = hx + Math.floor(S_HAND_W / 2);
  const cy = hy + 2;
  return {
    x:         cx,
    y:         cy,
    shoulderX: sx,
    shoulderY: sy,
    angleDeg:  toDeg(Math.atan2(cy - sy, cx - sx)),
  };
}

function southRightHand(f) {
  const rArmDY = Math.round((f.rightArmFwd || 0) * S_R_SCALE);
  const rArmOut = f.rightArmOut || 0;
  const hx = S_SHOULDER_RX + Math.round(rArmOut);
  const hy = S_BASE_Y + rArmDY + S_SLEEVE_H;
  return anchor(hx, hy, S_SHOULDER_RX, S_BASE_Y);
}

function southLeftHand(f) {
  const lArmDY = Math.round((f.leftArmFwd || 0) * S_L_SCALE);
  const hy = S_BASE_Y + lArmDY + S_SLEEVE_H;
  return anchor(S_SHOULDER_LX, hy, S_SHOULDER_LX, S_BASE_Y);
}

function westFrontHand(f) {
  const bodyY     = f.bodyY || 0;
  const torsoY    = W_TORSO_Y0 + bodyY;
  const frontY    = torsoY + 1;
  const shoulderX = W_TORSO_X - 3;                                   // 17
  const dx        = -Math.round((f.leftArmFwd || 0) * W_F_SCALE);
  const hx        = shoulderX + dx;
  const hy        = frontY + W_SLEEVE_H;
  return anchor(hx, hy, shoulderX, frontY);
}

function westBackHand(f) {
  const bodyY     = f.bodyY || 0;
  const torsoY    = W_TORSO_Y0 + bodyY;
  const backY     = torsoY + 1;
  const shoulderX = W_TORSO_X + 9;                                   // 29
  const dx        = -Math.round((f.rightArmFwd || 0) * W_B_SCALE);
  const hx        = shoulderX + dx;
  const hy        = backY + W_SLEEVE_H;
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
    const torsoCx = W_TORSO_X + 5;            // ~midpoint of west torso silhouette
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
    const torsoCx = mxX(W_TORSO_X + 5);
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
        weaponHand: southRightHand(f),
        offHand:    southLeftHand(f),
        ...bodySlots,
      };
    case 'west': {
      const front = westFrontHand(f);
      const back  = westBackHand(f);
      return { weaponHand: front, offHand: back, ...bodySlots };
    }
    case 'east': {
      // East = horizontal mirror of west
      const front = mirrorAnchor(westFrontHand(f));
      const back  = mirrorAnchor(westBackHand(f));
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
