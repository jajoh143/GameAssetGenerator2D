'use strict';

const { makeCanvas, fillRect, pixel, hLine, outlineRect, mirrorCanvasH } = require('../core/Canvas');
const { getYAnchors } = require('../characters/HumanCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

// These constants must match BaseCharacter.drawArmsSouth / drawFront/BackArmWest.
// The shoulder Y depends on the character's torsoY (height-driven), so it's
// computed from getYAnchors() per-frame rather than hardcoded.
const SLEEVE_H       = 13;
const S_SHOULDER_RX  = 43;
const S_SHOULDER_LX  = 18;
const S_ARM_DY_SCALE = 0.9;
const W_TORSO_X      = 16;
const W_FRONT_DX_REL = -1;
const W_BACK_DX_REL  =  11;
const W_ARM_DX_SCALE = 1.4;

const px = pixel;

function drawGlovePatch(ctx, colors, x, y, variantInfo) {
  fillRect(ctx, colors.primary.base, x, y, 4, 3);
  px(ctx, colors.primary.highlight, x, y);
  px(ctx, colors.primary.shadow,    x + 3, y + 2);
  outlineRect(ctx, colors.primary.outline, x, y, 4, 3);
  // Deepen bottom outline
  hLine(ctx, '#000000', x, y + 2, 4);
  if (variantInfo.knuckles) {
    px(ctx, colors.metal.base, x + 1, y);
    px(ctx, colors.metal.base, x + 2, y);
    px(ctx, colors.metal.outline, x + 1, y - 1);
    px(ctx, colors.metal.outline, x + 2, y - 1);
    // Specular pop on knuckles (top-left)
    px(ctx, '#ffffff', x + 1, y);
  }
  if (variantInfo.cuff) {
    fillRect(ctx, colors.accent.base, x, y - 1, 4, 1);
    // 2 rivets on glove cuff (front + back)
    px(ctx, colors.accent.outline, x,     y - 1);
    px(ctx, colors.accent.outline, x + 3, y - 1);
  }
}

const GLOVES_VARIANTS = {
  leather:  { knuckles: false, cuff: true,  label: 'Leather Gloves' },
  gauntlet: { knuckles: true,  cuff: false, label: 'Plate Gauntlets' },
};

function generateGlovesFrame(variantInfo, colors, config, animName, frameOffset, direction) {
  const f = frameOffset;
  const yA = getYAnchors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  if (direction === 'south' || direction === 'north') {
    const baseY  = yA.torsoY - 1;
    const rArmDY = Math.round((f.rightArmFwd || 0) * S_ARM_DY_SCALE);
    const lArmDY = Math.round((f.leftArmFwd  || 0) * S_ARM_DY_SCALE);
    const rhx    = S_SHOULDER_RX + Math.round(f.rightArmOut || 0);
    const lhx    = S_SHOULDER_LX + Math.round(f.leftArmOut  || 0);
    drawGlovePatch(ctx, colors, rhx, baseY + rArmDY + SLEEVE_H, variantInfo);
    drawGlovePatch(ctx, colors, lhx, baseY + lArmDY + SLEEVE_H, variantInfo);
    return canvas;
  }

  if (direction === 'west') {
    const torsoY = yA.torsoY + (f.bodyY || 0);
    const baseY  = torsoY - 1;
    const fhX    = (W_TORSO_X + W_FRONT_DX_REL) - Math.round((f.leftArmFwd  || 0) * W_ARM_DX_SCALE);
    const bhX    = (W_TORSO_X + W_BACK_DX_REL ) - Math.round((f.rightArmFwd || 0) * W_ARM_DX_SCALE);
    drawGlovePatch(ctx, colors, fhX, baseY + SLEEVE_H, variantInfo);
    drawGlovePatch(ctx, colors, bhX, baseY + SLEEVE_H, variantInfo);
    return canvas;
  }

  // east mirrors west
  const { canvas: tmp, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  const torsoY = yA.torsoY + (f.bodyY || 0);
  const baseY  = torsoY - 1;
  const fhX    = (W_TORSO_X + W_FRONT_DX_REL) - Math.round((f.leftArmFwd  || 0) * W_ARM_DX_SCALE);
  const bhX    = (W_TORSO_X + W_BACK_DX_REL ) - Math.round((f.rightArmFwd || 0) * W_ARM_DX_SCALE);
  drawGlovePatch(tmpCtx, colors, fhX, baseY + SLEEVE_H, variantInfo);
  drawGlovePatch(tmpCtx, colors, bhX, baseY + SLEEVE_H, variantInfo);
  ctx.drawImage(mirrorCanvasH(tmp), 0, 0);
  return canvas;
}

module.exports = { generateGlovesFrame, GLOVES_VARIANTS };
