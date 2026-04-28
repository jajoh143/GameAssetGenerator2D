'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect } = require('../core/Canvas');

// Shield sprites: 32×32 canvas, facing FORWARD (player's view).
// Grip anchor (gripX, gripY) is where the off-hand holds the shield —
// game positions shield so this point coincides with offHand anchor.
const FRAME = 32;
const CX    = 16;
const CY    = 16;

const px = pixel;

/**
 * Round shield — gripX=16, gripY=16 (center)
 * 14-row tall, ~14px wide circle with central boss.
 */
function drawRoundShield(ctx, colors) {
  const ROWS = [
    { y: CY - 7, x0: CX - 3, x1: CX + 3 },
    { y: CY - 6, x0: CX - 5, x1: CX + 5 },
    { y: CY - 5, x0: CX - 6, x1: CX + 6 },
    { y: CY - 4, x0: CX - 7, x1: CX + 7 },
    { y: CY - 3, x0: CX - 7, x1: CX + 7 },
    { y: CY - 2, x0: CX - 8, x1: CX + 8 },
    { y: CY - 1, x0: CX - 8, x1: CX + 8 },
    { y: CY,     x0: CX - 8, x1: CX + 8 },
    { y: CY + 1, x0: CX - 8, x1: CX + 8 },
    { y: CY + 2, x0: CX - 8, x1: CX + 8 },
    { y: CY + 3, x0: CX - 7, x1: CX + 7 },
    { y: CY + 4, x0: CX - 7, x1: CX + 7 },
    { y: CY + 5, x0: CX - 6, x1: CX + 6 },
    { y: CY + 6, x0: CX - 5, x1: CX + 5 },
    { y: CY + 7, x0: CX - 3, x1: CX + 3 },
  ];

  ROWS.forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.base, x0, y, x1 - x0 + 1);
  });
  // Highlight: top arc
  ROWS.slice(0, 5).forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.highlight, x0 + 1, y, Math.max(1, x1 - x0 - 1));
  });
  // Shadow: bottom arc
  ROWS.slice(-5).forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.shadow, x0 + 1, y, Math.max(1, x1 - x0 - 1));
  });
  // Outline ring
  ROWS.forEach(({ y, x0, x1 }) => {
    px(ctx, colors.primary.outline, x0, y);
    px(ctx, colors.primary.outline, x1, y);
  });
  px(ctx, colors.primary.outline, CX, CY - 8);
  px(ctx, colors.primary.outline, CX, CY + 8);

  // Central metal boss
  fillRect(ctx, colors.metal.base, CX - 2, CY - 2, 4, 4);
  px(ctx, colors.metal.highlight, CX - 1, CY - 1);
  px(ctx, colors.metal.shadow,    CX + 1, CY + 1);
  outlineRect(ctx, colors.metal.outline, CX - 2, CY - 2, 4, 4);
}

/**
 * Kite shield — gripX=16, gripY=12 (upper-center).
 * Tall teardrop shape, narrows to point at bottom.
 */
function drawKiteShield(ctx, colors) {
  const ROWS = [
    { y: CY - 11, x0: CX - 5, x1: CX + 5 },
    { y: CY - 10, x0: CX - 6, x1: CX + 6 },
    { y: CY - 9,  x0: CX - 6, x1: CX + 6 },
    { y: CY - 8,  x0: CX - 6, x1: CX + 6 },
    { y: CY - 7,  x0: CX - 6, x1: CX + 6 },
    { y: CY - 6,  x0: CX - 5, x1: CX + 5 },
    { y: CY - 5,  x0: CX - 5, x1: CX + 5 },
    { y: CY - 4,  x0: CX - 5, x1: CX + 5 },
    { y: CY - 3,  x0: CX - 4, x1: CX + 4 },
    { y: CY - 2,  x0: CX - 4, x1: CX + 4 },
    { y: CY - 1,  x0: CX - 3, x1: CX + 3 },
    { y: CY,      x0: CX - 3, x1: CX + 3 },
    { y: CY + 1,  x0: CX - 2, x1: CX + 2 },
    { y: CY + 2,  x0: CX - 2, x1: CX + 2 },
    { y: CY + 3,  x0: CX - 1, x1: CX + 1 },
    { y: CY + 4,  x0: CX,     x1: CX     },
  ];

  ROWS.forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.base, x0, y, x1 - x0 + 1);
  });
  // Vertical highlight stripe (left edge)
  ROWS.forEach(({ y, x0 }) => {
    px(ctx, colors.primary.highlight, x0 + 1, y);
  });
  // Vertical shadow stripe (right edge)
  ROWS.forEach(({ y, x1 }) => {
    if (x1 - 1 > CX - 4) px(ctx, colors.primary.shadow, x1 - 1, y);
  });
  // Outline
  ROWS.forEach(({ y, x0, x1 }) => {
    px(ctx, colors.primary.outline, x0 - 1, y);
    px(ctx, colors.primary.outline, x1 + 1, y);
  });
  px(ctx, colors.primary.outline, CX, CY - 12);
  px(ctx, colors.primary.outline, CX, CY + 5);

  // Metal trim band across upper third
  hLine(ctx, colors.metal.base,    CX - 4, CY - 6, 9);
  hLine(ctx, colors.metal.outline, CX - 4, CY - 7, 9);
  hLine(ctx, colors.metal.outline, CX - 4, CY - 5, 9);
  px(ctx, colors.metal.highlight, CX - 3, CY - 6);
  px(ctx, colors.metal.shadow,    CX + 3, CY - 6);
}

const SHIELD_VARIANTS = {
  round: { draw: drawRoundShield, gripX: 16, gripY: 16, label: 'Round Shield' },
  kite:  { draw: drawKiteShield,  gripX: 16, gripY: 12, label: 'Kite Shield'  },
};

/**
 * Generate a single shield canvas.
 */
function generateShieldCanvas(variant, colors) {
  const info = SHIELD_VARIANTS[variant];
  if (!info) throw new Error(`Unknown shield variant: ${variant}`);
  const { canvas, ctx } = makeCanvas(FRAME, FRAME);
  info.draw(ctx, colors);
  return canvas;
}

module.exports = { generateShieldCanvas, SHIELD_VARIANTS, FRAME };
