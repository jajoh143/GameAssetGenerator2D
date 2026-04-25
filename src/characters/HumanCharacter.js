'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const Colors = require('../core/Colors');
const {
  drawGroundShadow,
  drawHeadSouth,
  drawHeadNorth,
  drawHeadWest,
  drawNeckSouth,
  drawTorsoSouth,
  drawTorsoWest,
  drawBeltSouth,
  drawBeltWest,
  drawLegsSouth,
  drawLegsWest,
  drawShoesSouth,
  drawShoesWest,
  drawArmsSouth,
  drawArmsWest,
  drawBackArmWest,
  drawFrontArmWest,
} = require('./BaseCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

// ---------------------------------------------------------------------------
// Color resolver
// ---------------------------------------------------------------------------

function resolveColors(config) {
  const skinColors = config.type === 'demon'
    ? Colors.DEMON_SKIN[config.demonSkin] || Colors.DEMON_SKIN.crimson
    : Colors.SKIN_TONES[config.skin] || Colors.SKIN_TONES.medium;

  return {
    skin:     skinColors,
    hair:     Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black,
    eyes:     Colors.EYE_COLORS[config.eyes] || Colors.EYE_COLORS.brown,
    clothing: Colors.CLOTHING[config.clothing] || Colors.CLOTHING.jacket_grey,
    pants:    Colors.PANTS[config.pants] || Colors.PANTS.jeans_blue,
    shoes:    Colors.SHOES[config.shoes] || Colors.SHOES.shoe_black,
    belt:     Colors.BELT.standard,
  };
}

// ---------------------------------------------------------------------------
// drawSouth  –  full front view
// ---------------------------------------------------------------------------

function drawSouth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY: rawBodyY = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftArmOut  = 0, rightArmOut  = 0,
    headBob: rawHeadBob = 0,
  } = offsets;

  // Scale pixel offsets from 64px animation data to 96px frame
  const bodyY  = Math.round(rawBodyY   * 1.5);
  const headBob = Math.round(rawHeadBob * 1.5);

  const base = 96 + bodyY; // bottom anchor (96px frame)

  // --- Ground shadow ---
  drawGroundShadow(ctx, 32, 94 + bodyY, 18, 4);

  // Proportional body stack — chibi proportions: shorter legs make head relatively larger.
  const shoeH  = 5;
  const legH   = 14;
  const beltH  = 3;
  const torsoH = 20;  // +2 vs neck shrink: torsoY moves up so neckY stays at 50 (adjacent to chin)
  const neckH  = 4;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - neckH;

  // Leg spread/depth multipliers scaled for proportions.
  const lLegDX = -Math.round(Math.abs(leftLegFwd)  * 0.4);
  const rLegDX =  Math.round(Math.abs(rightLegFwd) * 0.4);
  const lLegDY = Math.max(-4, Math.min(4, Math.round(leftLegFwd  * 0.6)));
  const rLegDY = Math.max(-4, Math.min(4, Math.round(rightLegFwd * 0.6)));

  // Arm Y offsets — increased multiplier for more fluid walking swing
  const lArmDY = Math.round(leftArmFwd  * 0.9);
  const rArmDY = Math.round(rightArmFwd * 0.9);

  // --- Draw order: back-to-front ---
  const forwardLeg = leftLegFwd > 0 ? 'left' : leftLegFwd < 0 ? 'right' : 'none';
  drawShoesSouth(ctx, colors.shoes, lLegDX, rLegDX, shoeY, lLegDY, rLegDY);
  drawLegsSouth(ctx, colors.pants, lLegDX, rLegDX, legY, lLegDY, rLegDY, forwardLeg);
  drawBeltSouth(ctx, colors.belt, 20, beltY);
  drawTorsoSouth(ctx, config.clothing, colors.clothing, 20, torsoY, 24, torsoH);
  // Arms
  drawArmsSouth(ctx, colors.clothing, colors.skin, lArmDY, rArmDY, leftArmOut, rightArmOut, torsoY);
  // Neck
  drawNeckSouth(ctx, colors.skin, neckY);
  // Head
  ctx.save();
  ctx.translate(0, headBob);
  drawHeadSouth(ctx, colors.skin, colors.hair, config.hairStyle || 'short', colors.eyes, config.beardStyle || 'none');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawNorth  –  back view
// ---------------------------------------------------------------------------

function drawNorth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY: rawBodyY2 = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftArmOut  = 0, rightArmOut  = 0,
    headBob: rawHeadBob2 = 0,
  } = offsets;

  const bodyY  = Math.round(rawBodyY2   * 1.5);
  const headBob = Math.round(rawHeadBob2 * 1.5);

  const base = 96 + bodyY;

  const shoeH  = 5;
  const legH   = 14;
  const beltH  = 3;
  const torsoH = 20;
  const neckH  = 4;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - neckH;

  const lLegDX = -Math.round(Math.abs(leftLegFwd)  * 0.4);
  const rLegDX =  Math.round(Math.abs(rightLegFwd) * 0.4);
  const lLegDY = Math.max(-4, Math.min(4, Math.round(leftLegFwd  * 0.6)));
  const rLegDY = Math.max(-4, Math.min(4, Math.round(rightLegFwd * 0.6)));
  const lArmDY = Math.round(leftArmFwd  * 0.9);
  const rArmDY = Math.round(rightArmFwd * 0.9);

  drawGroundShadow(ctx, 32, 94 + bodyY, 18, 4);

  const forwardLegN = leftLegFwd > 0 ? 'left' : leftLegFwd < 0 ? 'right' : 'none';
  drawShoesSouth(ctx, colors.shoes, lLegDX, rLegDX, shoeY, lLegDY, rLegDY);
  drawLegsSouth(ctx, colors.pants,  lLegDX, rLegDX, legY, lLegDY, rLegDY, forwardLegN);
  drawBeltSouth(ctx, colors.belt, 20, beltY);

  // Back of torso — hourglass silhouette
  {
    const bx = 20, bw = 24, by = torsoY, bN = Math.min(torsoH, 20);
    const bSHOULDER = 3, bWS = 7, bWE = 13;
    const brl = (r) => {
      if (r < bSHOULDER)          return bx - 1;
      if (r >= bWS && r <= bWE)  return bx + 2;  // waist taper
      if (r > bWE)                return bx + 1;  // hip
      return bx;
    };
    const brr = (r) => {
      if (r < bSHOULDER)          return bx + bw;
      if (r >= bWS && r <= bWE)  return bx + bw - 3;  // waist taper
      if (r > bWE)                return bx + bw - 2;  // hip
      return bx + bw - 1;
    };

    for (let r = 0; r < bN; r++) {
      hLine(ctx, colors.clothing.base, brl(r), by + r, brr(r) - brl(r) + 1);
    }
    // Side panel shadows + center back highlight (back-lit rim light)
    for (let r = 0; r < bN; r++) {
      pixel(ctx, colors.clothing.shadow,    brl(r) + 1, by + r);
      pixel(ctx, colors.clothing.shadow,    brr(r) - 1, by + r);
      pixel(ctx, colors.clothing.highlight, Math.floor((brl(r) + brr(r)) / 2), by + r);
    }
    // Waist bridge pixels
    for (let r = bWS; r <= bWE; r++) {
      pixel(ctx, colors.clothing.shadow, bx, by + r);
      pixel(ctx, colors.clothing.shadow, bx + bw - 1, by + r);
    }
    // Armpit creases
    pixel(ctx, colors.clothing.shadow, bx - 1, by - 1);
    pixel(ctx, colors.clothing.shadow, bx + bw, by - 1);
    // Outlines
    hLine(ctx, colors.clothing.outline, bx - 1, by, bw + 2);
    for (let r = 1; r < bN - 1; r++) {
      pixel(ctx, colors.clothing.shadow, brl(r), by + r);
      pixel(ctx, colors.clothing.shadow, brr(r), by + r);
    }
    const bBotL = brl(bN - 1), bBotR = brr(bN - 1);
    hLine(ctx, colors.clothing.outline, bBotL, by + bN - 1, bBotR - bBotL + 1);
  }

  drawArmsSouth(ctx, colors.clothing, colors.skin, lArmDY, rArmDY, leftArmOut, rightArmOut, torsoY);
  drawNeckSouth(ctx, colors.skin, neckY);

  ctx.save();
  ctx.translate(0, headBob);
  drawHeadNorth(ctx, colors.skin, colors.hair, config.hairStyle || 'short');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawWest  –  side profile facing LEFT
// ---------------------------------------------------------------------------

function drawWest(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY: rawBodyY3 = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftLegLift = 0, rightLegLift = 0,
    headBob: rawHeadBob3 = 0,
  } = offsets;

  const bodyY  = Math.round(rawBodyY3   * 1.5);
  const headBob = Math.round(rawHeadBob3 * 1.5);

  const base = 96 + bodyY;

  const shoeH  = 5;
  const legH   = 14;
  const beltH  = 3;
  const torsoH = 20;  // match south for consistency

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - 4;  // 4px neck bridges head bottom (y=49) to torso (y=54)

  const torsoX = 16;  // shifted -16 for 64px frame

  const leftLegX  = 23 - Math.round(leftLegFwd  * 1.1);
  const rightLegX = 23 - Math.round(rightLegFwd * 1.1);

  let frontLegCenter, backLegCenter, frontLegLift, backLegLift;
  if (leftLegX <= rightLegX) {
    frontLegCenter = leftLegX;   backLegCenter = rightLegX;
    frontLegLift   = leftLegLift; backLegLift  = rightLegLift;
  } else {
    frontLegCenter = rightLegX;  backLegCenter = leftLegX;
    frontLegLift   = rightLegLift; backLegLift = leftLegLift;
  }

  const frontArmDX = -Math.round(leftArmFwd  * 1.4);
  const backArmDX  = -Math.round(rightArmFwd * 1.4);

  drawGroundShadow(ctx, 23, 94 + bodyY, 18, 4);

  drawShoesWest(ctx, colors.shoes, frontLegCenter, backLegCenter, shoeY, frontLegLift, backLegLift);
  drawLegsWest(ctx, colors.pants, frontLegCenter, backLegCenter, legY, frontLegLift, backLegLift);
  drawBackArmWest(ctx, colors.clothing, colors.skin, backArmDX, torsoX, torsoY);
  drawBeltWest(ctx, colors.belt, torsoX, beltY);
  drawTorsoWest(ctx, config.clothing, colors.clothing, torsoX, torsoY);
  drawFrontArmWest(ctx, colors.clothing, colors.skin, frontArmDX, torsoX, torsoY);
  // Neck (side) — 6px wide × 4px tall
  fillRect(ctx, colors.skin.base, torsoX + 3, neckY, 6, 4);
  outlineRect(ctx, colors.skin.outline, torsoX + 3, neckY, 6, 4);
  // Head
  ctx.save();
  ctx.translate(0, headBob);
  drawHeadWest(ctx, colors.skin, colors.hair, config.hairStyle || 'short');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawEast  –  mirror of west
// ---------------------------------------------------------------------------

function drawEast(ctx, config, offsets) {
  const { canvas: tmpCanvas, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  drawWest(tmpCtx, config, offsets);
  const mirrored = mirrorCanvasH(tmpCanvas);
  ctx.drawImage(mirrored, 0, 0);
}

// ---------------------------------------------------------------------------
// generateFrame
// ---------------------------------------------------------------------------

function generateFrame(config, animationName, frameOffset) {
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  const direction = getDirectionFromAnim(animationName);

  switch (direction) {
    case 'south': drawSouth(ctx, config, frameOffset); break;
    case 'north': drawNorth(ctx, config, frameOffset); break;
    case 'west':  drawWest(ctx, config, frameOffset);  break;
    case 'east':  drawEast(ctx, config, frameOffset);  break;
    default:      drawSouth(ctx, config, frameOffset); break;
  }

  return canvas;
}

function getDirectionFromAnim(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

module.exports = {
  generateFrame,
  drawSouth,
  drawNorth,
  drawWest,
  drawEast,
  resolveColors,
};
