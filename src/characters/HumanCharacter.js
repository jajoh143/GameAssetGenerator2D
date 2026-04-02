'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, fillEllipse, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const Colors = require('../core/Colors');
const {
  drawGroundShadow,
  drawShoe,
  drawLeg,
  drawBelt,
  drawTorso,
  drawArm,
  drawNeck,
  drawHeadSouth,
  drawHeadNorth,
  drawHeadSide,
} = require('./BaseCharacter');

const FRAME_W = 64;
const FRAME_H = 64;

/**
 * Resolve color palettes from config.
 */
function resolveColors(config) {
  const skinColors = config.type === 'demon'
    ? Colors.DEMON_SKIN[config.demonSkin] || Colors.DEMON_SKIN.crimson
    : Colors.SKIN_TONES[config.skin] || Colors.SKIN_TONES.medium;

  return {
    skin:     skinColors,
    hair:     Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black,
    clothing: Colors.CLOTHING[config.clothing] || Colors.CLOTHING.jacket_grey,
    pants:    Colors.PANTS[config.pants] || Colors.PANTS.jeans_blue,
    shoes:    Colors.SHOES[config.shoes] || Colors.SHOES.shoe_black,
    belt:     Colors.BELT.standard,
  };
}

/**
 * Draw a single idle/walk/attack frame for SOUTH direction.
 * offsets = frame offset object from AnimationData
 */
function drawSouth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const { bodyY, leftLegFwd, rightLegFwd, leftArmFwd, rightArmFwd, tilt, headBob } = offsets;

  // base Y for anchoring (bottom at y=63)
  const base = 64 + bodyY;

  // Ground shadow
  drawGroundShadow(ctx, 32, 62);

  // --- SHOES ---
  // Left shoe: x=21-31, y=60-63 (4px tall)
  const lShoeY = base - 4;
  const rShoeY = base - 4;
  drawShoe(ctx, colors.shoes, 21, lShoeY, 11, 4);
  drawShoe(ctx, colors.shoes, 32, rShoeY, 12, 4);

  // --- LEGS ---
  // Left leg: x=23-30, y=45-59 (offset by leftLegFwd as x-shift for leg splay)
  const legH = 15;
  const lLegX = 23 + Math.round(leftLegFwd * 0.3);
  const rLegX = 33 + Math.round(rightLegFwd * 0.3);
  const lLegY = base - 4 - legH;
  const rLegY = base - 4 - legH;
  drawLeg(ctx, colors.pants, lLegX, lLegY, 8, legH);
  drawLeg(ctx, colors.pants, rLegX, rLegY, 8, legH);

  // --- BELT ---
  drawBelt(ctx, colors.belt, 22, base - 4 - legH - 3, 20, 3);

  // --- TORSO ---
  const torsoY = base - 4 - legH - 3 - 17;
  drawTorso(ctx, config.clothing, colors.clothing, 21, torsoY, 22, 17);

  // --- ARMS ---
  // Left arm: x=12-20, offset by leftArmFwd as Y shift for swing
  const lArmY = torsoY + 1 + Math.round(leftArmFwd * 0.5);
  const rArmY = torsoY + 1 + Math.round(rightArmFwd * 0.5);
  const lArmX = 12 + Math.round(leftArmFwd * 0.2);
  const rArmX = 43 + Math.round(rightArmFwd * 0.2);
  drawArm(ctx, colors.clothing, colors.skin, lArmX, lArmY, 9, 17);
  drawArm(ctx, colors.clothing, colors.skin, rArmX, rArmY, 9, 17);

  // --- NECK ---
  const neckY = torsoY - 3;
  drawNeck(ctx, colors.skin, 28, neckY, 8, 3);

  // --- HEAD ---
  const headOffsetY = headBob || 0;
  // Translate context for head to apply headBob
  ctx.save();
  ctx.translate(0, headOffsetY);
  drawHeadSouth(ctx, colors.skin, colors.hair, config.hairStyle || 'short');
  ctx.restore();
}

/**
 * Draw a single frame for NORTH direction (back view).
 */
function drawNorth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const { bodyY, leftLegFwd, rightLegFwd, leftArmFwd, rightArmFwd, headBob } = offsets;
  const base = 64 + bodyY;

  drawGroundShadow(ctx, 32, 62);

  // Shoes (same as south)
  drawShoe(ctx, colors.shoes, 21, base - 4, 11, 4);
  drawShoe(ctx, colors.shoes, 32, base - 4, 12, 4);

  // Legs
  const legH = 15;
  const lLegX = 23 + Math.round(leftLegFwd * 0.3);
  const rLegX = 33 + Math.round(rightLegFwd * 0.3);
  const lLegY = base - 4 - legH;
  drawLeg(ctx, colors.pants, lLegX, lLegY, 8, legH);
  drawLeg(ctx, colors.pants, rLegX, lLegY, 8, legH);

  // Belt
  drawBelt(ctx, colors.belt, 22, base - 4 - legH - 3, 20, 3);

  // Torso (back - no collar, just flat back)
  const torsoY = base - 4 - legH - 3 - 17;
  fillRect(ctx, colors.clothing.base, 21, torsoY, 22, 17);
  fillRect(ctx, colors.clothing.highlight, 22, torsoY + 1, 4, 15);
  fillRect(ctx, colors.clothing.shadow, 37, torsoY + 1, 4, 15);
  outlineRect(ctx, colors.clothing.outline, 21, torsoY, 22, 17);

  // Arms (back view - arms slightly behind body visually)
  const lArmY = torsoY + 1 + Math.round(leftArmFwd * 0.5);
  const rArmY = torsoY + 1 + Math.round(rightArmFwd * 0.5);
  drawArm(ctx, colors.clothing, colors.skin, 12, lArmY, 9, 17);
  drawArm(ctx, colors.clothing, colors.skin, 43, rArmY, 9, 17);

  // Neck
  drawNeck(ctx, colors.skin, 28, torsoY - 3, 8, 3);

  // Head (north = back of head)
  const headOffsetY = headBob || 0;
  ctx.save();
  ctx.translate(0, headOffsetY);
  drawHeadNorth(ctx, colors.skin, colors.hair, config.hairStyle || 'short');
  ctx.restore();
}

/**
 * Draw a single frame for WEST direction (side profile, facing left).
 */
function drawWest(ctx, config, offsets) {
  const colors = resolveColors(config);
  const { bodyY, leftLegFwd, rightLegFwd, leftArmFwd, rightArmFwd, headBob } = offsets;
  const base = 64 + bodyY;

  drawGroundShadow(ctx, 32, 62);

  // Side profile - character centered, ~20px wide
  const cX = 28; // center x of character in frame

  // Shoes (side view - just one shoe visible, slightly offset)
  const frontLegOff = Math.round(leftLegFwd * 0.4);
  const backLegOff  = Math.round(rightLegFwd * 0.4);

  // Back shoe (lighter, behind)
  drawShoe(ctx, colors.shoes, cX - 4 + backLegOff,  base - 4, 10, 4);
  // Front shoe (full)
  drawShoe(ctx, colors.shoes, cX - 4 + frontLegOff, base - 4, 11, 4);

  // Back leg
  fillRect(ctx, colors.pants.shadow, cX - 3 + backLegOff, base - 4 - 15, 6, 15);
  outlineRect(ctx, colors.pants.outline, cX - 3 + backLegOff, base - 4 - 15, 6, 15);

  // Front leg
  drawLeg(ctx, colors.pants, cX - 3 + frontLegOff, base - 4 - 15, 7, 15);

  // Belt
  drawBelt(ctx, colors.belt, cX - 7, base - 4 - 15 - 3, 14, 3);

  // Torso (side profile - narrower)
  const torsoY = base - 4 - 15 - 3 - 17;
  fillRect(ctx, colors.clothing.base, cX - 8, torsoY, 16, 17);
  fillRect(ctx, colors.clothing.highlight, cX - 7, torsoY + 1, 3, 15);
  fillRect(ctx, colors.clothing.shadow, cX + 5, torsoY + 1, 3, 15);
  // slight belly contour for realism
  pixel(ctx, colors.clothing.shadow, cX + 7, torsoY + 8);
  outlineRect(ctx, colors.clothing.outline, cX - 8, torsoY, 16, 17);

  // Back arm (behind body - dimmed with shadow color)
  const backArmY  = torsoY + 1 + Math.round(rightArmFwd * 0.4);
  fillRect(ctx, colors.clothing.shadow, cX + 4, backArmY, 7, 13);
  fillRect(ctx, colors.skin.shadow, cX + 4, backArmY + 13, 7, 4);
  outlineRect(ctx, colors.clothing.outline, cX + 4, backArmY, 7, 17);

  // Front arm (in front of body)
  const frontArmY = torsoY + 1 + Math.round(leftArmFwd * 0.4);
  fillRect(ctx, colors.clothing.base, cX - 11, frontArmY, 7, 13);
  fillRect(ctx, colors.clothing.highlight, cX - 10, frontArmY + 1, 2, 11);
  fillRect(ctx, colors.skin.base, cX - 11, frontArmY + 13, 7, 4);
  fillRect(ctx, colors.skin.highlight, cX - 10, frontArmY + 14, 2, 2);
  outlineRect(ctx, colors.clothing.outline, cX - 11, frontArmY, 7, 17);

  // Neck (side view)
  fillRect(ctx, colors.skin.base, cX - 3, torsoY - 3, 6, 3);
  outlineRect(ctx, colors.skin.outline, cX - 3, torsoY - 3, 6, 3);

  // Head (side profile)
  const headOffsetY = headBob || 0;
  ctx.save();
  ctx.translate(0, headOffsetY);
  drawHeadSide(ctx, colors.skin, colors.hair, config.hairStyle || 'short', false);
  ctx.restore();
}

/**
 * Draw EAST direction (mirror of west).
 */
function drawEast(ctx, config, offsets) {
  // Create a temp canvas, draw west, mirror it
  const { canvas: tmpCanvas, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  drawWest(tmpCtx, config, offsets);
  const mirrored = mirrorCanvasH(tmpCanvas);
  ctx.drawImage(mirrored, 0, 0);
}

/**
 * Generate a single frame canvas for the given animation + frame index.
 */
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
