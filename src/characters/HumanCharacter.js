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
} = require('./BaseCharacter');

const FRAME_W = 64;
const FRAME_H = 64;

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
    bodyY = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftArmOut  = 0, rightArmOut  = 0,
    headBob = 0,
  } = offsets;

  const base = 64 + bodyY; // bottom anchor

  // --- Ground shadow ---
  drawGroundShadow(ctx, 32, 62 + bodyY);

  // Layout constants (measured from bottom)
  const shoeH  = 4;
  const legH   = 13;
  const beltH  = 2;
  const torsoH = 17;  // reduced 2px; head grew 3px, neck shrunk 1px → net +0 total
  const neckH  = 2;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - neckH;

  // South-facing walk: depth is shown via split DY on knee-to-ankle rows.
  // Thigh rows stay fixed (belt junction stays clean).
  // Forward leg: knee-to-ankle drops 2px. Back leg: rises 2px.
  // Near-zero DX: feet stay under the body, no sideways shuffle.
  // Lateral foot spread: each foot steps slightly outward when striding
  const lLegDX = Math.round(leftLegFwd  *  0.12);
  const rLegDX = Math.round(rightLegFwd * -0.12);
  // Increased DY: forward foot drops more visibly (closer to camera = lower on screen)
  const lLegDY = Math.max(-3, Math.min(3, Math.round(leftLegFwd  * 0.5)));
  const rLegDY = Math.max(-3, Math.min(3, Math.round(rightLegFwd * 0.5)));

  // Arm Y offsets
  const lArmDY = Math.round(leftArmFwd  * 0.4);
  const rArmDY = Math.round(rightArmFwd * 0.4);

  // --- Draw order: back-to-front ---
  // Forward leg: brighter (base tone). Back leg: darker (shadow tone) — SNES depth technique.
  const forwardLeg = leftLegFwd > 0 ? 'left' : leftLegFwd < 0 ? 'right' : 'none';
  // Shoes use same DY as leg lower portion so they stay connected
  drawShoesSouth(ctx, colors.shoes, lLegDX, rLegDX, shoeY, lLegDY, rLegDY);
  // Legs (split DY: thigh fixed, knee-below shifts; color-differentiated for depth)
  drawLegsSouth(ctx, colors.pants, lLegDX, rLegDX, legY, lLegDY, rLegDY, forwardLeg);
  // Belt
  drawBeltSouth(ctx, colors.belt, 24, beltY);
  // Torso (18px wide, x=23-40) — narrower body matches reference proportions
  drawTorsoSouth(ctx, config.clothing, colors.clothing, 23, torsoY, 18, torsoH);
  // Arms (drawn over torso edges)
  drawArmsSouth(ctx, colors.clothing, colors.skin, lArmDY, rArmDY, leftArmOut, rightArmOut);
  // Neck
  drawNeckSouth(ctx, colors.skin, neckY);
  // Head
  ctx.save();
  ctx.translate(0, headBob || 0);
  drawHeadSouth(ctx, colors.skin, colors.hair, config.hairStyle || 'short', colors.eyes);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawNorth  –  back view
// ---------------------------------------------------------------------------

function drawNorth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftArmOut  = 0, rightArmOut  = 0,
    headBob = 0,
  } = offsets;

  const base = 64 + bodyY;

  const shoeH  = 4;
  const legH   = 13;
  const beltH  = 2;
  const torsoH = 17;
  const neckH  = 2;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - neckH;

  // Same split-DY logic as south view
  const lLegDX = Math.round(leftLegFwd  *  0.12);
  const rLegDX = Math.round(rightLegFwd * -0.12);
  const lLegDY = Math.max(-3, Math.min(3, Math.round(leftLegFwd  * 0.5)));
  const rLegDY = Math.max(-3, Math.min(3, Math.round(rightLegFwd * 0.5)));
  const lArmDY = Math.round(leftArmFwd  * 0.4);
  const rArmDY = Math.round(rightArmFwd * 0.4);

  drawGroundShadow(ctx, 32, 62 + bodyY);

  const forwardLegN = leftLegFwd > 0 ? 'left' : leftLegFwd < 0 ? 'right' : 'none';
  drawShoesSouth(ctx, colors.shoes, lLegDX, rLegDX, shoeY, lLegDY, rLegDY);
  drawLegsSouth(ctx, colors.pants,  lLegDX, rLegDX, legY, lLegDY, rLegDY, forwardLegN);
  drawBeltSouth(ctx, colors.belt,   24, beltY);

  // Back of torso — hourglass silhouette matching front jacket
  {
    const bx = 23, bw = 18, by = torsoY, bN = Math.min(torsoH, 19);
    const bSHOULDER = 3, bWS = 7, bWE = 11;
    const brl = (r) => {
      if (r < bSHOULDER)            return bx - 1;
      if (r >= bWS && r <= bWE)    return bx + 1;  // waist taper
      return bx;
    };
    const brr = (r) => {
      if (r < bSHOULDER)            return bx + bw;
      if (r >= bWS && r <= bWE)    return bx + bw - 2;  // waist taper
      return bx + bw - 1;
    };

    for (let r = 0; r < bN; r++) {
      hLine(ctx, colors.clothing.base, brl(r), by + r, brr(r) - brl(r) + 1);
    }
    // Side panel shadows + center back highlight (back-lit rim light simulation)
    for (let r = 0; r < bN; r++) {
      pixel(ctx, colors.clothing.shadow,    brl(r) + 1, by + r);
      pixel(ctx, colors.clothing.shadow,    brr(r) - 1, by + r);
      pixel(ctx, colors.clothing.highlight, Math.floor((brl(r) + brr(r)) / 2), by + r);
    }
    // Waist bridge pixels (same as front)
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

  drawArmsSouth(ctx, colors.clothing, colors.skin, lArmDY, rArmDY, leftArmOut, rightArmOut);
  drawNeckSouth(ctx, colors.skin, neckY);

  ctx.save();
  ctx.translate(0, headBob || 0);
  drawHeadNorth(ctx, colors.skin, colors.hair, config.hairStyle || 'short');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawWest  –  side profile facing LEFT
// ---------------------------------------------------------------------------

function drawWest(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftLegLift = 0, rightLegLift = 0,
    headBob = 0,
  } = offsets;

  const base = 64 + bodyY;

  const shoeH  = 4;
  const legH   = 13;
  const beltH  = 2;
  const torsoH = 16;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - 2;

  // Side profile centering: torso at x=20-32
  const torsoX = 20;

  // Stride: front leg moves LEFT (lower x), back leg moves RIGHT (higher x)
  // frontLeg = leftLegFwd, backLeg = rightLegFwd
  const frontLegCenter = 26 - Math.round(leftLegFwd  * 0.9);
  const backLegCenter  = 26 - Math.round(rightLegFwd * 0.9);

  // Arms swing horizontally in side profile (not vertically)
  // Positive armFwd → arm swings forward = moves left (lower X in west view)
  const frontArmDX = -Math.round(leftArmFwd  * 0.5);
  const backArmDX  = -Math.round(rightArmFwd * 0.5);

  drawGroundShadow(ctx, 26, 62 + bodyY);

  // --- Draw order: back-to-front ---
  // Back shoe
  drawShoesWest(ctx, colors.shoes, frontLegCenter, backLegCenter, shoeY, leftLegLift, rightLegLift);
  // Back leg
  drawLegsWest(ctx, colors.pants, frontLegCenter, backLegCenter, legY, leftLegLift, rightLegLift);
  // Back arm (drawn before torso so torso covers overlap)
  drawArmsWest(ctx, colors.clothing, colors.skin, frontArmDX, backArmDX, torsoX, torsoY);
  // Belt
  drawBeltWest(ctx, colors.belt, torsoX, beltY);
  // Torso
  drawTorsoWest(ctx, config.clothing, colors.clothing, torsoX, torsoY);
  // Neck (side)
  fillRect(ctx, colors.skin.base, torsoX + 3, neckY, 6, 2);
  outlineRect(ctx, colors.skin.outline, torsoX + 3, neckY, 6, 2);
  // Head
  ctx.save();
  ctx.translate(0, headBob || 0);
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
