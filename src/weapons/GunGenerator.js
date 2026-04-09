'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect } = require('../core/Canvas');

// Weapon sprites: 32×32 canvas, barrel pointing RIGHT, grip at (gripX, gripY)
const FRAME = 32;
const CY    = 16;

const px = pixel;

// ── Shared helpers ──────────────────────────────────────────────────────────

function barrel(ctx, bColors, x, len, cy, thick = 3) {
  const ht = Math.floor(thick / 2);
  fillRect(ctx, bColors.base, x, cy - ht, len, thick);
  hLine(ctx, bColors.highlight, x, cy - ht, len);
  hLine(ctx, bColors.shadow,    x, cy + ht, len);
  hLine(ctx, bColors.outline,   x, cy - ht - 1, len);
  hLine(ctx, bColors.outline,   x, cy + ht + 1, len);
  px(ctx, bColors.outline, x - 1, cy - ht);
  px(ctx, bColors.outline, x - 1, cy + ht);
}

function slide(ctx, sColors, x, y, w, h) {
  fillRect(ctx, sColors.base, x, y, w, h);
  hLine(ctx, sColors.highlight, x, y, w);
  hLine(ctx, sColors.shadow,    x, y + h - 1, w);
  vLine(ctx, sColors.highlight, x, y + 1, h - 2);
  vLine(ctx, sColors.shadow,    x + w - 1, y + 1, h - 2);
  outlineRect(ctx, sColors.outline, x, y, w, h);
  // Ejection port cutout (visual detail)
  px(ctx, sColors.shadow, x + w - 3, y + 1);
  px(ctx, sColors.shadow, x + w - 4, y + 1);
}

function pistolGrip(ctx, gColors, x, y, w, h) {
  // Slightly angled grip (wider at top, narrower at bottom)
  for (let row = 0; row < h; row++) {
    const xOff = Math.floor(row * 0.4);
    fillRect(ctx, gColors.base, x + xOff, y + row, w - xOff, 1);
  }
  hLine(ctx, gColors.highlight, x, y, w);
  vLine(ctx, gColors.highlight, x, y, h);
  // Grip texture
  for (let row = 1; row < h - 1; row += 2) {
    const xOff = Math.floor(row * 0.4);
    px(ctx, gColors.shadow, x + xOff + 1, y + row);
    px(ctx, gColors.shadow, x + xOff + 3, y + row);
  }
  // Outline
  for (let row = 0; row < h; row++) {
    const xOff = Math.floor(row * 0.4);
    px(ctx, gColors.outline, x + xOff - 1, y + row);
    px(ctx, gColors.outline, x + xOff + w - 1, y + row);
  }
  hLine(ctx, gColors.outline, x, y - 1, w);
  hLine(ctx, gColors.outline, x + Math.floor((h - 1) * 0.4), y + h, 3);
}

function triggerGuard(ctx, colors, x, y) {
  // Simple D-shaped trigger guard
  px(ctx, colors.outline, x,     y);
  px(ctx, colors.base,    x + 1, y);
  px(ctx, colors.base,    x + 2, y);
  px(ctx, colors.outline, x + 3, y);
  px(ctx, colors.outline, x,     y + 1);
  px(ctx, colors.outline, x + 3, y + 1);
  px(ctx, colors.outline, x,     y + 2);
  px(ctx, colors.base,    x + 1, y + 2);
  px(ctx, colors.base,    x + 2, y + 2);
  px(ctx, colors.outline, x + 3, y + 2);
}

function muzzle(ctx, bColors, x, cy) {
  // Muzzle compensator (3px square cap)
  fillRect(ctx, bColors.shadow, x, cy - 2, 3, 5);
  px(ctx, bColors.highlight, x,     cy - 1);
  px(ctx, bColors.highlight, x,     cy);
  outlineRect(ctx, bColors.outline, x, cy - 2, 3, 5);
}

// ── Weapon draw functions ───────────────────────────────────────────────────

/**
 * Pistol — gripX=10, gripY=21 (hand around pistol grip)
 */
function drawPistol(ctx, colors) {
  // Slide/frame (upper body)
  slide(ctx, colors.body, 5, CY - 4, 12, 7);
  // Barrel (extends past slide)
  barrel(ctx, colors.barrel, 5, 14, CY - 1, 3);
  // Muzzle cap
  muzzle(ctx, colors.barrel, 18, CY - 1);
  // Pistol grip (hangs down from frame)
  pistolGrip(ctx, colors.grip, 6, CY + 3, 6, 7);
  // Trigger guard
  triggerGuard(ctx, colors.detail, 11, CY + 3);
  // Sights
  px(ctx, colors.detail.base,    10, CY - 5);
  px(ctx, colors.detail.outline, 9,  CY - 5);
  px(ctx, colors.detail.outline, 11, CY - 5);
  px(ctx, colors.detail.base,    17, CY - 5);
  px(ctx, colors.detail.outline, 16, CY - 5);
}

/**
 * Rifle — gripX=9, gripY=18, long precision barrel
 */
function drawRifle(ctx, colors) {
  // Long barrel
  barrel(ctx, colors.barrel, 5, 23, CY - 1, 3);
  // Muzzle brake
  muzzle(ctx, colors.barrel, 27, CY - 1);
  // Receiver/body
  slide(ctx, colors.body, 5, CY - 4, 12, 8);
  // Stock (butt of rifle, left side)
  fillRect(ctx, colors.grip.base, 1, CY - 3, 6, 8);
  hLine(ctx, colors.grip.highlight, 1, CY - 3, 6);
  vLine(ctx, colors.grip.highlight, 1, CY - 2, 5);
  // Stock toe taper
  px(ctx, colors.grip.shadow, 1, CY + 4);
  px(ctx, colors.grip.shadow, 2, CY + 4);
  outlineRect(ctx, colors.grip.outline, 1, CY - 3, 6, 8);
  // Pistol grip (below receiver)
  pistolGrip(ctx, colors.grip, 8, CY + 4, 5, 6);
  // Trigger guard
  triggerGuard(ctx, colors.detail, 11, CY + 4);
  // Scope rail / detail
  hLine(ctx, colors.detail.base,    8,  CY - 5, 8);
  hLine(ctx, colors.detail.outline, 8,  CY - 6, 8);
  hLine(ctx, colors.detail.outline, 8,  CY - 4, 8);
  // Front sight post
  px(ctx, colors.detail.base,    25, CY - 5);
  px(ctx, colors.detail.outline, 24, CY - 5);
  px(ctx, colors.detail.outline, 26, CY - 5);
}

/**
 * Shotgun — gripX=8, gripY=19, wide barrel, pump action
 */
function drawShotgun(ctx, colors) {
  // Wide barrel (4px)
  barrel(ctx, colors.barrel, 4, 20, CY - 1, 4);
  // Barrel end (wide muzzle)
  fillRect(ctx, colors.barrel.shadow, 23, CY - 3, 3, 7);
  hLine(ctx, colors.barrel.highlight, 23, CY - 3, 3);
  outlineRect(ctx, colors.barrel.outline, 23, CY - 3, 3, 7);
  // Receiver
  slide(ctx, colors.body, 4, CY - 5, 12, 9);
  // Pump foregrip (under barrel)
  fillRect(ctx, colors.grip.base, 10, CY + 2, 7, 3);
  hLine(ctx, colors.grip.highlight, 10, CY + 2, 7);
  outlineRect(ctx, colors.grip.outline, 10, CY + 2, 7, 3);
  // Stock
  fillRect(ctx, colors.grip.base, 1, CY - 4, 6, 9);
  hLine(ctx, colors.grip.highlight, 1, CY - 4, 6);
  vLine(ctx, colors.grip.highlight, 1, CY - 3, 6);
  outlineRect(ctx, colors.grip.outline, 1, CY - 4, 6, 9);
  // Pistol grip
  pistolGrip(ctx, colors.grip, 7, CY + 4, 5, 6);
  // Trigger guard
  triggerGuard(ctx, colors.detail, 10, CY + 4);
}

// ── Public API ──────────────────────────────────────────────────────────────

const GUN_VARIANTS = {
  pistol:   { draw: drawPistol,   gripX: 10, gripY: 21, label: 'Pistol'   },
  rifle:    { draw: drawRifle,    gripX:  9, gripY: 18, label: 'Rifle'    },
  shotgun:  { draw: drawShotgun,  gripX:  8, gripY: 19, label: 'Shotgun'  },
};

/**
 * Generate a single gun/ranged weapon canvas.
 */
function generateGunCanvas(variant, colors) {
  const info = GUN_VARIANTS[variant];
  if (!info) throw new Error(`Unknown gun variant: ${variant}`);
  const { canvas, ctx } = makeCanvas(FRAME, FRAME);
  info.draw(ctx, colors);
  return canvas;
}

module.exports = { generateGunCanvas, GUN_VARIANTS, FRAME };
