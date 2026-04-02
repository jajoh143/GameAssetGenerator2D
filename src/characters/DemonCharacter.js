'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const { DEMON_SKIN, DEMON_PARTS, HAIR_COLORS, CLOTHING, PANTS, SHOES, BELT } = require('../core/Colors');
const { drawGroundShadow, drawShoe, drawLeg, drawBelt, drawTorso, drawArm, drawNeck } = require('./BaseCharacter');
const { drawSouth: humanSouth, drawNorth: humanNorth, drawWest: humanWest, drawEast: humanEast, resolveColors: humanColors } = require('./HumanCharacter');
const { resolveConfig } = require('./CharacterConfig');

const FRAME_W = 64;
const FRAME_H = 64;

function resolveColors(config) {
  const base = humanColors(config);
  base.skin = DEMON_SKIN[config.demonSkin] || DEMON_SKIN.crimson;
  base.horn = DEMON_PARTS.horn;
  base.tail = DEMON_PARTS.tail;
  base.claw = DEMON_PARTS.claw;
  return base;
}

// Draw curved horns above the head (south view)
function drawHornsSouth(ctx, colors, hornStyle, headY) {
  const hy = headY - 4; // just above head

  if (hornStyle === 'curved') {
    // Left curved horn
    fillRect(ctx, colors.horn.base,      24, hy,     4, 5);
    fillRect(ctx, colors.horn.highlight, 24, hy,     2, 3);
    pixel(ctx, colors.horn.shadow,       26, hy + 4);
    // Curve tip
    fillRect(ctx, colors.horn.base,      22, hy - 3, 3, 3);
    fillRect(ctx, colors.horn.shadow,    22, hy - 4, 2, 2);
    outlineRect(ctx, colors.horn.outline, 22, hy - 4, 5, 9);

    // Right curved horn (mirror)
    fillRect(ctx, colors.horn.base,      36, hy,     4, 5);
    fillRect(ctx, colors.horn.highlight, 38, hy,     2, 3);
    pixel(ctx, colors.horn.shadow,       37, hy + 4);
    fillRect(ctx, colors.horn.base,      39, hy - 3, 3, 3);
    fillRect(ctx, colors.horn.shadow,    40, hy - 4, 2, 2);
    outlineRect(ctx, colors.horn.outline, 36, hy - 4, 5, 9);

  } else if (hornStyle === 'straight') {
    // Left straight horn pointing up
    fillRect(ctx, colors.horn.base,      25, hy - 5, 3, 7);
    fillRect(ctx, colors.horn.highlight, 25, hy - 5, 1, 5);
    pixel(ctx, colors.horn.shadow,       27, hy + 1);
    outlineRect(ctx, colors.horn.outline, 25, hy - 6, 3, 8);

    // Right straight horn
    fillRect(ctx, colors.horn.base,      36, hy - 5, 3, 7);
    fillRect(ctx, colors.horn.highlight, 38, hy - 5, 1, 5);
    pixel(ctx, colors.horn.shadow,       36, hy + 1);
    outlineRect(ctx, colors.horn.outline, 36, hy - 6, 3, 8);

  } else {
    // Ram horns (sweeping outward)
    fillRect(ctx, colors.horn.base,      20, hy - 1, 6, 4);
    fillRect(ctx, colors.horn.base,      17, hy + 2, 4, 3);
    fillRect(ctx, colors.horn.highlight, 20, hy - 1, 2, 2);
    outlineRect(ctx, colors.horn.outline, 17, hy - 1, 9, 6);

    fillRect(ctx, colors.horn.base,      38, hy - 1, 6, 4);
    fillRect(ctx, colors.horn.base,      43, hy + 2, 4, 3);
    fillRect(ctx, colors.horn.highlight, 42, hy - 1, 2, 2);
    outlineRect(ctx, colors.horn.outline, 38, hy - 1, 9, 6);
  }
}

// Draw tail at bottom of character (south view)
function drawTailSouth(ctx, colors, tailStyle, beltY) {
  const tx = 46; // tail emerges from right hip area
  const ty = beltY;

  if (tailStyle === 'long') {
    // Long swooping tail
    vLine(ctx, colors.tail.base, tx, ty, 8);
    fillRect(ctx, colors.tail.base, tx + 1, ty + 5, 4, 5);
    fillRect(ctx, colors.tail.base, tx + 4, ty + 8, 3, 6);
    // Arrowhead tip
    fillRect(ctx, colors.tail.base,      tx + 5, ty + 12, 5, 3);
    fillRect(ctx, colors.tail.highlight, tx + 6, ty + 12, 3, 2);
    // Outline
    fillRect(ctx, colors.tail.outline, tx - 1, ty, 1, 8);
    fillRect(ctx, colors.tail.outline, tx + 5, ty + 12, 1, 4);
    fillRect(ctx, colors.tail.outline, tx + 9, ty + 13, 1, 2);

  } else if (tailStyle === 'medium') {
    vLine(ctx, colors.tail.base, tx, ty, 6);
    fillRect(ctx, colors.tail.base, tx + 1, ty + 4, 3, 5);
    fillRect(ctx, colors.tail.base, tx + 3, ty + 7, 4, 3);
    fillRect(ctx, colors.tail.base, tx + 4, ty + 8, 3, 2); // tip
    fillRect(ctx, colors.tail.outline, tx - 1, ty, 1, 7);

  } else {
    // Short tail
    vLine(ctx, colors.tail.base, tx, ty, 4);
    fillRect(ctx, colors.tail.base, tx + 1, ty + 3, 3, 3);
    fillRect(ctx, colors.tail.outline, tx - 1, ty, 1, 5);
  }
}

// Draw demon head south (uses skin + horns)
function drawDemonHeadSouth(ctx, colors, config) {
  const { fillRect: fr, pixel: px, hLine: hl, outlineRect: or } = require('../core/Canvas');
  const headX = 23, headY = 4, headW = 18, headH = 18;

  // Demon head fill (same shape as human but with demon skin)
  fillRect(ctx, colors.skin.base, headX, headY, headW, headH);
  fillRect(ctx, colors.skin.highlight, headX + 2, headY + 2, 6, 5);
  fillRect(ctx, colors.skin.shadow, headX + headW - 5, headY + 4, 4, headH - 8);
  fillRect(ctx, colors.skin.shadow, headX + 3, headY + headH - 5, headW - 6, 4);
  outlineRect(ctx, colors.skin.outline || '#280000', headX, headY, headW, headH);

  // Glowing eyes (brighter for demon)
  const eyeY = headY + 9;
  fillRect(ctx, '#FF6600', 26, eyeY, 3, 2);
  fillRect(ctx, '#FF6600', 35, eyeY, 3, 2);
  fillRect(ctx, '#FFDD00', 27, eyeY, 1, 1);
  fillRect(ctx, '#FFDD00', 36, eyeY, 1, 1);
  // Brow ridges (heavier than human)
  hLine(ctx, colors.skin.shadow, 25, eyeY - 2, 5);
  hLine(ctx, colors.skin.shadow, 34, eyeY - 2, 5);

  // Nose
  pixel(ctx, colors.skin.shadow, 31, headY + 13);
  pixel(ctx, colors.skin.shadow, 31, headY + 14);

  // Mouth (slight snarl)
  hLine(ctx, colors.skin.outline || '#280000', 29, headY + 15, 6);
  pixel(ctx, '#FF4444', 30, headY + 16);
  pixel(ctx, '#FF4444', 33, headY + 16);

  // Hair / head covering
  const hair = colors.hair;
  fillRect(ctx, hair.base, headX, headY, headW, 6);
  fillRect(ctx, hair.highlight, headX + 2, headY, headW - 5, 3);
  fillRect(ctx, hair.shadow, headX, headY + 4, headW, 2);
  fillRect(ctx, hair.base, headX, headY, 2, 11);
  fillRect(ctx, hair.base, headX + headW - 2, headY, 2, 11);
  outlineRect(ctx, '#111111', headX, headY, headW, 6);

  // Horns drawn on top of hair
  drawHornsSouth(ctx, colors, config.hornStyle || 'curved', headY);
}

/**
 * Generate a single frame canvas for a demon character.
 */
function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  const direction = getDirectionFromAnim(animationName);
  const off = frameOffset;
  const by  = off.bodyY || 0;

  switch (direction) {
    case 'south': {
      // Draw human body with demon skin and head
      humanSouth(ctx, config, off);
      // Re-draw head with demon features
      ctx.clearRect(0, 0, FRAME_W, by < 0 ? -by + 24 : 24); // clear head area
      ctx.save();
      ctx.translate(0, by + (off.headBob || 0));
      drawDemonHeadSouth(ctx, colors, config);
      ctx.restore();
      // Draw tail on top of belt area
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 42 + by);
      break;
    }
    case 'north': {
      humanNorth(ctx, config, off);
      // Tail still visible from behind
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 42 + by);
      break;
    }
    case 'west': {
      humanWest(ctx, config, off);
      // Side horn (one visible)
      ctx.save();
      ctx.translate(0, by + (off.headBob || 0));
      // Single horn in profile at top-left of head
      const hornY = 4 - 5;
      fillRect(ctx, colors.horn.base, 27, hornY, 3, 6);
      fillRect(ctx, colors.horn.base, 25, hornY - 3, 3, 4);
      outlineRect(ctx, colors.horn.outline, 25, hornY - 3, 5, 9);
      ctx.restore();
      // Side tail
      vLine(ctx, colors.tail.base, 40, 42 + by, 6);
      fillRect(ctx, colors.tail.base, 41, 46 + by, 4, 4);
      break;
    }
    case 'east': {
      // Mirror of west demon frame
      const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
      const fakeWestConfig = Object.assign({}, config);
      generateFrameDirect(tmpCtx, fakeWestConfig, colors, off, 'west');
      const mirrored = mirrorCanvasH(tmpC);
      ctx.drawImage(mirrored, 0, 0);
      break;
    }
    default:
      humanSouth(ctx, config, off);
  }

  return canvas;
}

function generateFrameDirect(ctx, config, colors, off, direction) {
  const by = off.bodyY || 0;
  clear(ctx, FRAME_W, FRAME_H);
  humanWest(ctx, config, off);
  ctx.save();
  ctx.translate(0, by + (off.headBob || 0));
  const hornY = 4 - 5;
  fillRect(ctx, colors.horn.base, 27, hornY, 3, 6);
  fillRect(ctx, colors.horn.base, 25, hornY - 3, 3, 4);
  outlineRect(ctx, colors.horn.outline, 25, hornY - 3, 5, 9);
  ctx.restore();
  vLine(ctx, colors.tail.base, 40, 42 + by, 6);
  fillRect(ctx, colors.tail.base, 41, 46 + by, 4, 4);
}

function getDirectionFromAnim(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

module.exports = { generateFrame };
