'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH } = require('../core/Canvas');
const { getYAnchors } = require('../characters/HumanCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

const px = pixel;

// Torso silhouette in 64-px-wide frame is roughly x=20..43 (24 wide).
// Side profile torso sits at x=20..27 (8 wide).
const S_TORSO_LEFT  = 20;
const S_TORSO_RIGHT = 43;
const S_TORSO_W     = S_TORSO_RIGHT - S_TORSO_LEFT + 1; // 24
const W_TORSO_LEFT  = 20;
const W_TORSO_W     = 10;

// ── Variant draws (south view) ─────────────────────────────────────────────

function drawTunicSouth(ctx, colors, torsoY, torsoH) {
  // Soft cloth tunic — covers torso + first 2 px below belt for skirt drape.
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  // Vertical highlight stripe (left side, like sun catch)
  vLine(ctx, colors.primary.highlight, x + 2, torsoY + 1, torsoH - 2);
  // Vertical shadow stripe (right side)
  vLine(ctx, colors.primary.shadow, x + w - 3, torsoY + 1, torsoH - 2);
  // Lower hem shadow
  hLine(ctx, colors.primary.shadow, x, torsoY + torsoH - 1, w);
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Trim band at neckline
  hLine(ctx, colors.accent.base, x + 2, torsoY, w - 4);
  hLine(ctx, colors.accent.outline, x + 2, torsoY - 1, w - 4);
  // V-neck cutout
  px(ctx, 'rgba(0,0,0,0)', x + Math.floor(w / 2), torsoY + 1);
}

function drawChainmailSouth(ctx, colors, torsoY, torsoH) {
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  // Stippled mail texture: alternating highlight/shadow pixels every 2px
  for (let r = torsoY + 1; r < torsoY + torsoH - 1; r++) {
    const phase = (r % 2);
    for (let cx = x + 1 + phase; cx < x + w - 1; cx += 2) {
      px(ctx, colors.primary.highlight, cx, r);
    }
    for (let cx = x + 2 - phase; cx < x + w - 1; cx += 2) {
      px(ctx, colors.primary.shadow, cx, r);
    }
  }
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Metal collar
  hLine(ctx, colors.metal.base,    x + 4, torsoY, w - 8);
  hLine(ctx, colors.metal.outline, x + 4, torsoY - 1, w - 8);
}

function drawPlateSouth(ctx, colors, torsoY, torsoH) {
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  // Main plate
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  // Pectoral highlights — two rounded plates
  fillRect(ctx, colors.primary.highlight, x + 2, torsoY + 1, 8, 4);
  fillRect(ctx, colors.primary.highlight, x + w - 10, torsoY + 1, 8, 4);
  // Center divot (sternum line)
  vLine(ctx, colors.primary.shadow, x + Math.floor(w / 2), torsoY + 1, torsoH - 2);
  // Belt-line shadow
  hLine(ctx, colors.primary.shadow, x, torsoY + torsoH - 2, w);
  // Outline
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Pauldron-like shoulder caps
  fillRect(ctx, colors.metal.base,    x - 1, torsoY, 4, 3);
  fillRect(ctx, colors.metal.base,    x + w - 3, torsoY, 4, 3);
  outlineRect(ctx, colors.metal.outline, x - 1, torsoY, 4, 3);
  outlineRect(ctx, colors.metal.outline, x + w - 3, torsoY, 4, 3);
}

// ── West variant draws ─────────────────────────────────────────────────────

function drawTunicWest(ctx, colors, torsoY, torsoH) {
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  vLine(ctx, colors.primary.highlight, x + 1, torsoY + 1, torsoH - 2);
  vLine(ctx, colors.primary.shadow, x + w - 2, torsoY + 1, torsoH - 2);
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
}

function drawChainmailWest(ctx, colors, torsoY, torsoH) {
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  for (let r = torsoY + 1; r < torsoY + torsoH - 1; r++) {
    const phase = (r % 2);
    for (let cx = x + 1 + phase; cx < x + w - 1; cx += 2) {
      px(ctx, colors.primary.highlight, cx, r);
    }
  }
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
}

function drawPlateWest(ctx, colors, torsoY, torsoH) {
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  vLine(ctx, colors.primary.highlight, x + 1, torsoY + 1, torsoH - 2);
  vLine(ctx, colors.primary.shadow, x + w - 2, torsoY + 1, torsoH - 2);
  hLine(ctx, colors.primary.shadow, x, torsoY + torsoH - 2, w);
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  fillRect(ctx, colors.metal.base, x, torsoY, 3, 3);
  outlineRect(ctx, colors.metal.outline, x, torsoY, 3, 3);
}

const CHEST_VARIANTS = {
  tunic:     { drawSouth: drawTunicSouth,     drawWest: drawTunicWest,     label: 'Tunic'      },
  chainmail: { drawSouth: drawChainmailSouth, drawWest: drawChainmailWest, label: 'Chainmail'  },
  plate:     { drawSouth: drawPlateSouth,     drawWest: drawPlateWest,     label: 'Plate Mail' },
};

// ── Frame generator ────────────────────────────────────────────────────────

function generateChestFrame(variantInfo, colors, config, animName, frameOffset, direction) {
  const yA      = getYAnchors(config);
  const bodyY   = frameOffset.bodyY || 0;
  const torsoY  = yA.torsoY + bodyY;
  const torsoH  = yA.beltY - yA.torsoY;

  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  if (direction === 'south' || direction === 'north') {
    variantInfo.drawSouth(ctx, colors, torsoY, torsoH);
    return canvas;
  }
  if (direction === 'west') {
    variantInfo.drawWest(ctx, colors, torsoY, torsoH);
    return canvas;
  }
  // east mirrors west
  const { canvas: tmp, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  variantInfo.drawWest(tmpCtx, colors, torsoY, torsoH);
  ctx.drawImage(mirrorCanvasH(tmp), 0, 0);
  return canvas;
}

module.exports = { generateChestFrame, CHEST_VARIANTS };
