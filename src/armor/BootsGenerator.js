'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH } = require('../core/Canvas');
const { getYAnchors } = require('../characters/HumanCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

// Leg silhouette (south view): legs occupy two 4-px-wide bands centered
// around x=28 (left) and x=35 (right). Walk animations shift these by
// ±leftLegFwd / ±rightLegFwd in pixels.
const S_LEFT_LEG_X  = 26;   // 4 wide → 26..29
const S_RIGHT_LEG_X = 34;   // 4 wide → 34..37

const px = pixel;

function drawBootSouth(ctx, colors, x, top, h, variantInfo) {
  // Boot occupies the full leg height + 1 below for the sole.
  fillRect(ctx, colors.primary.base, x, top, 4, h);
  vLine(ctx, colors.primary.highlight, x, top + 1, h - 2);
  vLine(ctx, colors.primary.shadow,    x + 3, top + 1, h - 2);
  outlineRect(ctx, colors.primary.outline, x, top, 4, h);
  if (variantInfo.cuff) {
    // Cuff at the top
    hLine(ctx, colors.accent.base, x, top, 4);
    hLine(ctx, colors.accent.outline, x, top - 1, 4);
  }
  if (variantInfo.greave) {
    // Metal greave plate down the front
    vLine(ctx, colors.metal.base,    x + 1, top + 2, h - 4);
    vLine(ctx, colors.metal.highlight, x + 1, top + 2, 1);
    vLine(ctx, colors.metal.outline, x,     top + 2, h - 4);
    vLine(ctx, colors.metal.outline, x + 2, top + 2, h - 4);
  }
}

function drawBootWest(ctx, colors, x, top, h, variantInfo) {
  fillRect(ctx, colors.primary.base, x, top, 5, h);
  hLine(ctx, colors.primary.highlight, x + 1, top + 1, 3);
  hLine(ctx, colors.primary.shadow,    x + 1, top + h - 2, 3);
  outlineRect(ctx, colors.primary.outline, x, top, 5, h);
  if (variantInfo.cuff) {
    hLine(ctx, colors.accent.base, x, top, 5);
    hLine(ctx, colors.accent.outline, x, top - 1, 5);
  }
  if (variantInfo.greave) {
    fillRect(ctx, colors.metal.base, x + 1, top + 2, 2, h - 4);
    outlineRect(ctx, colors.metal.outline, x + 1, top + 2, 2, h - 4);
  }
}

const BOOTS_VARIANTS = {
  leather: { drawSouth: drawBootSouth, drawWest: drawBootWest, cuff: true,  greave: false, label: 'Leather Boots' },
  plate:   { drawSouth: drawBootSouth, drawWest: drawBootWest, cuff: false, greave: true,  label: 'Plate Greaves' },
};

function generateBootsFrame(variantInfo, colors, config, animName, frameOffset, direction) {
  const yA     = getYAnchors(config);
  const bodyY  = frameOffset.bodyY || 0;
  // shoeY is the GROUND line (one row below the shoe sole). Boots cover the
  // full leg from legY down to shoeY-1 — past that is the ground shadow.
  const legH   = yA.shoeY - yA.legY;
  const top    = yA.legY + bodyY;

  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  if (direction === 'south' || direction === 'north') {
    const lFwd = Math.round((frameOffset.leftLegFwd  || 0) * 0.3);
    const rFwd = Math.round((frameOffset.rightLegFwd || 0) * 0.3);
    drawBootSouth(ctx, colors, S_LEFT_LEG_X  + lFwd, top, legH, variantInfo);
    drawBootSouth(ctx, colors, S_RIGHT_LEG_X + rFwd, top, legH, variantInfo);
    return canvas;
  }

  if (direction === 'west') {
    const lLift = frameOffset.leftLegLift  || 0;
    const rLift = frameOffset.rightLegLift || 0;
    // Two overlapping side-profile boots, one slightly behind/below the other.
    drawBootWest(ctx, colors, 24, top - rLift, legH, variantInfo);
    drawBootWest(ctx, colors, 22, top - lLift, legH, variantInfo);
    return canvas;
  }

  // east mirrors west
  const { canvas: tmp, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  const lLift = frameOffset.leftLegLift  || 0;
  const rLift = frameOffset.rightLegLift || 0;
  drawBootWest(tmpCtx, colors, 24, top - rLift, legH, variantInfo);
  drawBootWest(tmpCtx, colors, 22, top - lLift, legH, variantInfo);
  ctx.drawImage(mirrorCanvasH(tmp), 0, 0);
  return canvas;
}

module.exports = { generateBootsFrame, BOOTS_VARIANTS };
