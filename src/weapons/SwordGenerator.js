'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect } = require('../core/Canvas');

// Weapon sprites: 32×32 canvas, pointing RIGHT, grip anchor at (gripX, 16)
const FRAME = 32;
const CY    = 16;  // vertical center

// ── shared helpers ──────────────────────────────────────────────────────────
const px = pixel;

function blade3(ctx, colors, x, len) {
  // 3px-wide blade base section at CY-1..CY+1
  fillRect(ctx, colors.base, x, CY - 1, len, 3);
  hLine(ctx, colors.highlight, x, CY - 1, len);
  hLine(ctx, colors.shadow,    x, CY + 1, len);
  // Outline
  hLine(ctx, colors.outline, x, CY - 2, len);
  hLine(ctx, colors.outline, x, CY + 2, len);
}

function bladeTaper(ctx, colors, x) {
  // 2px wide → 1px tip over 5px
  fillRect(ctx, colors.base, x,     CY - 1, 3, 2);
  hLine(ctx, colors.highlight, x,   CY - 1, 3);
  hLine(ctx, colors.outline,   x,   CY - 2, 3);
  px(ctx, colors.base,      x + 3, CY);
  px(ctx, colors.outline,   x + 3, CY - 1);
  px(ctx, colors.outline,   x + 3, CY + 1);
  // Close the tip
  hLine(ctx, colors.outline, x, CY + 1, 3);
}

function handle(ctx, hColors, x, len) {
  // 3px-tall wrapped grip
  fillRect(ctx, hColors.base, x, CY - 1, len, 3);
  hLine(ctx, hColors.highlight, x, CY - 1, len);
  hLine(ctx, hColors.shadow,    x, CY + 1, len);
  // Wrap lines every 2px
  for (let wx = x + 1; wx < x + len - 1; wx += 2) {
    px(ctx, hColors.outline, wx, CY - 1);
    px(ctx, hColors.shadow,  wx, CY);
    px(ctx, hColors.outline, wx, CY + 1);
  }
  outlineRect(ctx, hColors.outline, x, CY - 1, len, 3);
}

function pommel(ctx, pColors, x, w, h) {
  const py = CY - Math.floor(h / 2);
  fillRect(ctx, pColors.base, x, py, w, h);
  vLine(ctx, pColors.highlight, x + 1, py + 1, h - 2);
  vLine(ctx, pColors.shadow,    x + w - 2, py + 1, h - 2);
  outlineRect(ctx, pColors.outline, x, py, w, h);
}

function guard(ctx, gColors, x, top, bot) {
  const h = bot - top + 1;
  fillRect(ctx, gColors.base, x, top, 2, h);
  vLine(ctx, gColors.highlight, x,     top + 1, h - 2);
  vLine(ctx, gColors.shadow,    x + 1, top + 1, h - 2);
  px(ctx, gColors.outline, x,     top);     px(ctx, gColors.outline, x + 1, top);
  px(ctx, gColors.outline, x,     top + 1); px(ctx, gColors.outline, x + 1, top + 1);
  px(ctx, gColors.outline, x,     bot);     px(ctx, gColors.outline, x + 1, bot);
  px(ctx, gColors.outline, x,     bot - 1); px(ctx, gColors.outline, x + 1, bot - 1);
}

// ── Weapon draw functions ───────────────────────────────────────────────────

/**
 * Short sword — gripX=7, balanced everyday blade
 */
function drawShortSword(ctx, colors) {
  pommel(ctx, colors.pommel, 1, 3, 6);
  handle(ctx, colors.handle, 4, 5);
  guard(ctx, colors.guard, 9, CY - 5, CY + 5);
  blade3(ctx, colors.blade, 11, 10);
  bladeTaper(ctx, colors.blade, 21);
}

/**
 * Long sword — gripX=7, noble two-hand blade with wide guard
 */
function drawLongSword(ctx, colors) {
  pommel(ctx, colors.pommel, 1, 3, 6);
  handle(ctx, colors.handle, 4, 5);
  guard(ctx, colors.guard, 9, CY - 7, CY + 7);
  // extra guard wings
  px(ctx, colors.guard.base, 10, CY - 7);  px(ctx, colors.guard.base, 10, CY + 7);
  blade3(ctx, colors.blade, 11, 14);
  bladeTaper(ctx, colors.blade, 25);
}

/**
 * Dagger — gripX=5, short blade, no crossguard
 */
function drawDagger(ctx, colors) {
  pommel(ctx, colors.pommel, 1, 2, 4);
  handle(ctx, colors.handle, 3, 4);
  // Tiny guard (1px each side)
  px(ctx, colors.guard.base, 7, CY - 2);
  px(ctx, colors.guard.base, 7, CY + 2);
  px(ctx, colors.guard.outline, 7, CY - 3);
  px(ctx, colors.guard.outline, 7, CY + 3);
  // Short narrow blade
  fillRect(ctx, colors.blade.base, 8, CY - 1, 6, 3);
  hLine(ctx, colors.blade.highlight, 8, CY - 1, 6);
  hLine(ctx, colors.blade.shadow,    8, CY + 1, 5);
  hLine(ctx, colors.blade.outline,   8, CY - 2, 6);
  hLine(ctx, colors.blade.outline,   8, CY + 2, 5);
  // Quick taper to tip
  px(ctx, colors.blade.base,    14, CY - 1);
  px(ctx, colors.blade.base,    14, CY);
  px(ctx, colors.blade.base,    15, CY);
  px(ctx, colors.blade.outline, 14, CY - 2);
  px(ctx, colors.blade.outline, 15, CY - 1);
  px(ctx, colors.blade.outline, 15, CY + 1);
}

/**
 * Axe — gripX=5, fantasy crescent axe head at right
 */
function drawAxe(ctx, colors) {
  // Handle (horizontal shaft)
  fillRect(ctx, colors.handle.base, 1, CY - 1, 10, 3);
  hLine(ctx, colors.handle.highlight, 1, CY - 1, 10);
  hLine(ctx, colors.handle.shadow,    1, CY + 1, 10);
  // Grain lines
  for (let gx = 3; gx < 10; gx += 3) {
    px(ctx, colors.handle.shadow, gx, CY);
  }
  outlineRect(ctx, colors.handle.outline, 1, CY - 1, 10, 3);

  // Axe head — crescent profile per row
  const HEAD_ROWS = [
    { y: CY - 6, x0: 14, x1: 15 },
    { y: CY - 5, x0: 11, x1: 17 },
    { y: CY - 4, x0: 10, x1: 19 },
    { y: CY - 3, x0: 10, x1: 20 },
    { y: CY - 2, x0: 10, x1: 21 },
    { y: CY - 1, x0: 10, x1: 21 },
    { y: CY,     x0: 10, x1: 22 },
    { y: CY + 1, x0: 10, x1: 21 },
    { y: CY + 2, x0: 10, x1: 21 },
    { y: CY + 3, x0: 10, x1: 20 },
    { y: CY + 4, x0: 10, x1: 19 },
    { y: CY + 5, x0: 11, x1: 17 },
    { y: CY + 6, x0: 14, x1: 15 },
  ];
  HEAD_ROWS.forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.blade.base, x0, y, x1 - x0 + 1);
  });
  // Blade edge highlight (right/curved edge)
  HEAD_ROWS.forEach(({ y, x1 }) => {
    px(ctx, colors.blade.highlight, x1, y);
  });
  // Back of head shading
  HEAD_ROWS.forEach(({ y, x0 }) => {
    px(ctx, colors.blade.shadow, x0, y);
    if (y !== CY - 6 && y !== CY + 6) {
      px(ctx, colors.blade.shadow, x0 + 1, y);
    }
  });
  // Outline
  HEAD_ROWS.forEach(({ y, x0, x1 }) => {
    px(ctx, colors.blade.outline, x0 - 1, y);
    px(ctx, colors.blade.outline, x1 + 1, y);
  });
  px(ctx, colors.blade.outline, 14, CY - 7);
  px(ctx, colors.blade.outline, 15, CY - 7);
  px(ctx, colors.blade.outline, 14, CY + 7);
  px(ctx, colors.blade.outline, 15, CY + 7);
}

// ── Public API ──────────────────────────────────────────────────────────────

const SWORD_VARIANTS = {
  short_sword: { draw: drawShortSword, gripX: 7,  bladeLength: 14, label: 'Short Sword' },
  long_sword:  { draw: drawLongSword,  gripX: 7,  bladeLength: 18, label: 'Long Sword'  },
  dagger:      { draw: drawDagger,     gripX: 5,  bladeLength: 8,  label: 'Dagger'      },
  axe:         { draw: drawAxe,        gripX: 5,  bladeLength: 12, label: 'Axe'         },
};

/**
 * Generate a single sword/melee weapon canvas.
 * @param {string} variant  - key from SWORD_VARIANTS
 * @param {object} colors   - from BLADE_MATERIALS[material]
 * @returns {Canvas}
 */
function generateSwordCanvas(variant, colors) {
  const info = SWORD_VARIANTS[variant];
  if (!info) throw new Error(`Unknown sword variant: ${variant}`);
  const { canvas, ctx } = makeCanvas(FRAME, FRAME);
  info.draw(ctx, colors);
  return canvas;
}

module.exports = { generateSwordCanvas, SWORD_VARIANTS, FRAME };
