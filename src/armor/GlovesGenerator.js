'use strict';

const { makeCanvas, fillRect, pixel, outlineRect, mirrorCanvasH } = require('../core/Canvas');

const FRAME_W = 64;
const FRAME_H = 96;

// Drawing constants must match those in MetaExport.js (single source of
// truth lives there; mirrored here intentionally to keep this module
// self-contained for a small, hot draw path).
const S_SHOULDER_RX = 41;
const S_SHOULDER_LX = 18;
const S_BASE_Y      = 28;
const S_SLEEVE_H    = 11;
const W_TORSO_X     = 20;
const W_TORSO_Y0    = 29;
const W_SLEEVE_H    = 11;
const W_F_SCALE     = 0.6;
const W_B_SCALE     = 0.6;

const px = pixel;

function drawGlovePatch(ctx, colors, x, y, variantInfo) {
  // 4×3 patch covering the hand area.
  fillRect(ctx, colors.primary.base, x, y, 4, 3);
  px(ctx, colors.primary.highlight, x, y);
  px(ctx, colors.primary.shadow,    x + 3, y + 2);
  outlineRect(ctx, colors.primary.outline, x, y, 4, 3);
  if (variantInfo.knuckles) {
    // Tiny metal studs across knuckles
    px(ctx, colors.metal.base, x + 1, y);
    px(ctx, colors.metal.base, x + 2, y);
    px(ctx, colors.metal.outline, x + 1, y - 1);
    px(ctx, colors.metal.outline, x + 2, y - 1);
  }
  if (variantInfo.cuff) {
    // Cuff strip 1px above the hand
    fillRect(ctx, colors.accent.base, x, y - 1, 4, 1);
  }
}

const GLOVES_VARIANTS = {
  leather:  { knuckles: false, cuff: true,  label: 'Leather Gloves' },
  gauntlet: { knuckles: true,  cuff: false, label: 'Plate Gauntlets' },
};

function generateGlovesFrame(variantInfo, colors, _config, animName, frameOffset, direction) {
  const f = frameOffset;
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  if (direction === 'south' || direction === 'north') {
    // Right hand
    const rArmDY = Math.round((f.rightArmFwd || 0) * 0.4);
    const rArmOut = f.rightArmOut || 0;
    const rhx = S_SHOULDER_RX + Math.round(rArmOut);
    const rhy = S_BASE_Y + rArmDY + S_SLEEVE_H;
    drawGlovePatch(ctx, colors, rhx, rhy, variantInfo);
    // Left hand
    const lArmDY = Math.round((f.leftArmFwd || 0) * 0.4);
    const lhy = S_BASE_Y + lArmDY + S_SLEEVE_H;
    drawGlovePatch(ctx, colors, S_SHOULDER_LX, lhy, variantInfo);
    return canvas;
  }

  if (direction === 'west') {
    const bodyY = f.bodyY || 0;
    const torsoY = W_TORSO_Y0 + bodyY;
    const frontY = torsoY + 1;
    const backY  = torsoY + 1;
    // Front hand
    const fhx = (W_TORSO_X - 3) - Math.round((f.leftArmFwd || 0) * W_F_SCALE);
    const fhy = frontY + W_SLEEVE_H;
    drawGlovePatch(ctx, colors, fhx, fhy, variantInfo);
    // Back hand
    const bhx = (W_TORSO_X + 9) - Math.round((f.rightArmFwd || 0) * W_B_SCALE);
    const bhy = backY + W_SLEEVE_H;
    drawGlovePatch(ctx, colors, bhx, bhy, variantInfo);
    return canvas;
  }

  // east mirrors west
  const { canvas: tmp, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  const bodyY = f.bodyY || 0;
  const torsoY = W_TORSO_Y0 + bodyY;
  const fhx = (W_TORSO_X - 3) - Math.round((f.leftArmFwd || 0) * W_F_SCALE);
  const fhy = (torsoY + 1) + W_SLEEVE_H;
  drawGlovePatch(tmpCtx, colors, fhx, fhy, variantInfo);
  const bhx = (W_TORSO_X + 9) - Math.round((f.rightArmFwd || 0) * W_B_SCALE);
  const bhy = (torsoY + 1) + W_SLEEVE_H;
  drawGlovePatch(tmpCtx, colors, bhx, bhy, variantInfo);
  ctx.drawImage(mirrorCanvasH(tmp), 0, 0);
  return canvas;
}

module.exports = { generateGlovesFrame, GLOVES_VARIANTS };
