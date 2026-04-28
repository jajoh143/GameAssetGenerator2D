'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH } = require('../core/Canvas');
const { getYAnchors } = require('../characters/HumanCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

// In source coordinates (before headDeltaY translation), the head occupies:
//   south/north: HX=16, HY=21, HW=32, chin at y=50
//   west:        head profile centered on torso x ≈ 25, same vertical range
// We draw helmets in these source coordinates, then translate per-frame.
const HX = 16;
const HY = 21;
const HW = 32;

// ── Drawing helpers ────────────────────────────────────────────────────────

function shadeBand(ctx, colors, x, y, w) {
  hLine(ctx, colors.primary.highlight, x,         y, w);
  hLine(ctx, colors.primary.base,      x,         y + 1, w);
  hLine(ctx, colors.primary.shadow,    x,         y + 2, w);
  px(ctx, colors.primary.outline, x - 1, y + 1);
  px(ctx, colors.primary.outline, x + w, y + 1);
}

const px = pixel;

// ── South / North helmet draws (front-facing head) ─────────────────────────

function drawCapSouth(ctx, colors) {
  // Skull cap that hugs the top of the head — 18px wide, 6px tall.
  // Domed top, single trim band at brow level.
  const top = HY;        // y=21
  const cx  = HX + HW / 2; // 32

  // Dome shape (rows top..top+5)
  const ROWS = [
    { y: top,     x0: cx - 6, x1: cx + 5 },
    { y: top + 1, x0: cx - 8, x1: cx + 7 },
    { y: top + 2, x0: cx - 9, x1: cx + 8 },
    { y: top + 3, x0: cx - 9, x1: cx + 8 },
    { y: top + 4, x0: cx - 9, x1: cx + 8 },
  ];
  ROWS.forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.base, x0, y, x1 - x0 + 1);
  });
  // Top highlight
  hLine(ctx, colors.primary.highlight, cx - 4, top + 1, 6);
  hLine(ctx, colors.primary.highlight, cx - 6, top + 2, 4);
  // Bottom shadow within dome
  hLine(ctx, colors.primary.shadow, cx - 8, top + 4, 16);
  // Outline
  ROWS.forEach(({ y, x0, x1 }) => {
    px(ctx, colors.primary.outline, x0 - 1, y);
    px(ctx, colors.primary.outline, x1 + 1, y);
  });
  hLine(ctx, colors.primary.outline, cx - 5, top - 1, 10);

  // Trim band at brow (3px tall metal band)
  shadeBand(ctx, { primary: colors.metal }, cx - 9, top + 5, 18);
}

function drawFullHelmSouth(ctx, colors) {
  // Knight's helm — full coverage from above-the-crown down to the chin,
  // with an eye slit at brow level. The character head spans HY=21 to chin
  // at y=50 (29 px tall in source coords); a real full-helm covers the
  // whole head plus a small neck guard at the bottom.
  const top    = HY - 1;            // 20
  const cx     = HX + HW / 2;       // 32
  const bottom = HY + 30;           // 51 — chin level + 1 row neck guard
  const h      = bottom - top;      // 31

  // Main helm body — 20 px wide capsule.
  fillRect(ctx, colors.primary.base, cx - 10, top, 20, h);
  // Top dome (taper outer corners by 1 row).
  hLine(ctx, colors.primary.base, cx - 8, top - 1, 16);
  // Side highlights / shadows.
  vLine(ctx, colors.primary.highlight, cx - 9, top + 1, h - 2);
  hLine(ctx, colors.primary.highlight, cx - 7, top, 6);
  vLine(ctx, colors.primary.shadow, cx + 8, top + 1, h - 2);
  hLine(ctx, colors.primary.shadow, cx + 2, top, 6);
  hLine(ctx, colors.primary.shadow, cx - 9, bottom - 1, 19);
  // Outline (perimeter).
  outlineRect(ctx, colors.primary.outline, cx - 10, top, 20, h);
  hLine(ctx, colors.primary.outline, cx - 7, top - 2, 14);
  px(ctx, colors.primary.outline, cx - 8, top - 1);
  px(ctx, colors.primary.outline, cx + 7, top - 1);

  // Eye slit at brow level (~1/3 down the head).
  fillRect(ctx, colors.primary.outline, cx - 7, HY + 9, 14, 2);
  px(ctx, colors.metal.highlight, cx - 5, HY + 9);
  px(ctx, colors.metal.highlight, cx + 4, HY + 9);

  // Vertical seam down the face — gives the helm a "two-half" look.
  vLine(ctx, colors.primary.shadow,  cx,     HY + 12, 12);
  vLine(ctx, colors.primary.outline, cx - 1, HY + 14, 8);

  // Breathing slits across the lower jaw.
  for (let r = HY + 22; r <= HY + 26; r += 2) {
    hLine(ctx, colors.primary.outline, cx - 4, r, 9);
  }

  // Neck guard flare — extends 2 px wider at the bottom.
  hLine(ctx, colors.primary.base,    cx - 11, bottom - 1, 22);
  hLine(ctx, colors.primary.shadow,  cx - 11, bottom - 1, 22);
  hLine(ctx, colors.primary.outline, cx - 11, bottom,     22);

  // Crest / ridge along the top.
  vLine(ctx, colors.metal.base,    cx,     top - 1, 4);
  vLine(ctx, colors.metal.outline, cx - 1, top - 1, 4);
  vLine(ctx, colors.metal.outline, cx + 1, top - 1, 4);
}

function drawHoodSouth(ctx, colors) {
  // Soft hood/cowl that drapes down to shoulders.
  const top = HY - 1;
  const cx  = HX + HW / 2;
  const bottom = HY + 24;

  const ROWS = [
    { y: top,      x0: cx - 5,  x1: cx + 4 },
    { y: top + 1,  x0: cx - 8,  x1: cx + 7 },
    { y: top + 2,  x0: cx - 10, x1: cx + 9 },
    { y: top + 3,  x0: cx - 11, x1: cx + 10 },
    { y: top + 4,  x0: cx - 12, x1: cx + 11 },
    { y: top + 5,  x0: cx - 12, x1: cx + 11 },
    { y: top + 6,  x0: cx - 12, x1: cx + 11 },
    { y: top + 7,  x0: cx - 12, x1: cx + 11 },
    // Hood opening — only sides visible, center transparent (face shows)
    { y: top + 8,  x0: cx - 12, x1: cx - 7 },
    { y: top + 8,  x0: cx + 6,  x1: cx + 11 },
    { y: top + 9,  x0: cx - 12, x1: cx - 8 },
    { y: top + 9,  x0: cx + 7,  x1: cx + 11 },
    { y: top + 10, x0: cx - 12, x1: cx - 8 },
    { y: top + 10, x0: cx + 7,  x1: cx + 11 },
    // Cowl shoulders
    { y: top + 11, x0: cx - 13, x1: cx - 7 },
    { y: top + 11, x0: cx + 6,  x1: cx + 12 },
    { y: top + 12, x0: cx - 14, x1: cx - 6 },
    { y: top + 12, x0: cx + 5,  x1: cx + 13 },
    { y: top + 13, x0: cx - 14, x1: cx - 6 },
    { y: top + 13, x0: cx + 5,  x1: cx + 13 },
    { y: top + 14, x0: cx - 14, x1: cx + 13 },
    { y: top + 15, x0: cx - 14, x1: cx + 13 },
    { y: top + 16, x0: cx - 13, x1: cx + 12 },
  ];
  ROWS.forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.base, x0, y, x1 - x0 + 1);
  });
  // Inner shadow along hood opening
  vLine(ctx, colors.primary.shadow, cx - 7, top + 8, 4);
  vLine(ctx, colors.primary.shadow, cx + 6, top + 8, 4);
  // Highlight along outer-left edge
  ROWS.filter(r => r.x0 === cx - 12 || r.x0 === cx - 14).forEach(({ y, x0 }) => {
    px(ctx, colors.primary.highlight, x0 + 1, y);
  });
  // Shadow along outer-right edge
  ROWS.filter(r => r.x1 === cx + 11 || r.x1 === cx + 13).forEach(({ y, x1 }) => {
    px(ctx, colors.primary.shadow, x1 - 1, y);
  });
}

// ── West helmet draws (side profile) ───────────────────────────────────────

function drawCapWest(ctx, colors) {
  // Side profile of a skull cap.
  const top = HY;
  const left = 18, right = 32;
  fillRect(ctx, colors.primary.base, left, top, right - left, 5);
  hLine(ctx, colors.primary.highlight, left + 1, top + 1, right - left - 2);
  hLine(ctx, colors.primary.shadow,    left + 1, top + 3, right - left - 2);
  outlineRect(ctx, colors.primary.outline, left, top, right - left, 5);
  // Trim band
  hLine(ctx, colors.metal.base,    left, top + 5, right - left);
  hLine(ctx, colors.metal.outline, left, top + 6, right - left);
}

function drawFullHelmWest(ctx, colors) {
  // Side-profile knight's helm — full coverage with eye slit and neck guard.
  const top    = HY - 1;
  const bottom = HY + 30;
  const left   = 16;
  const right  = 32;
  const h      = bottom - top;
  fillRect(ctx, colors.primary.base, left, top, right - left, h);
  hLine(ctx, colors.primary.highlight, left + 1, top + 1, right - left - 2);
  vLine(ctx, colors.primary.highlight, left + 1, top + 1, h - 2);
  vLine(ctx, colors.primary.shadow,    right - 2, top + 1, h - 2);
  hLine(ctx, colors.primary.shadow,    left + 1, bottom - 2, right - left - 2);
  outlineRect(ctx, colors.primary.outline, left, top, right - left, h);
  // Eye slit at brow.
  fillRect(ctx, colors.primary.outline, left + 2, HY + 9, right - left - 4, 2);
  // Breathing slits along the jaw line.
  for (let r = HY + 22; r <= HY + 26; r += 2) {
    hLine(ctx, colors.primary.outline, left + 3, r, right - left - 6);
  }
  // Neck guard flare.
  hLine(ctx, colors.primary.shadow,  left - 1, bottom - 1, right - left + 2);
  hLine(ctx, colors.primary.outline, left - 1, bottom,     right - left + 2);
  // Crest along the top.
  vLine(ctx, colors.metal.base,    left + 8, top - 2, 3);
  vLine(ctx, colors.metal.outline, left + 7, top - 2, 3);
  vLine(ctx, colors.metal.outline, left + 9, top - 2, 3);
}

function drawHoodWest(ctx, colors) {
  const top = HY - 1;
  const ROWS = [
    { y: top,      x0: 22, x1: 30 },
    { y: top + 1,  x0: 19, x1: 31 },
    { y: top + 2,  x0: 18, x1: 32 },
    { y: top + 3,  x0: 17, x1: 32 },
    { y: top + 4,  x0: 16, x1: 32 },
    { y: top + 5,  x0: 16, x1: 32 },
    { y: top + 6,  x0: 16, x1: 32 },
    { y: top + 7,  x0: 16, x1: 22 },   // hood opening starts
    { y: top + 8,  x0: 16, x1: 21 },
    { y: top + 9,  x0: 16, x1: 21 },
    { y: top + 10, x0: 16, x1: 21 },
    { y: top + 11, x0: 15, x1: 22 },
    { y: top + 12, x0: 15, x1: 23 },
    { y: top + 13, x0: 15, x1: 24 },
    { y: top + 14, x0: 15, x1: 25 },
    { y: top + 15, x0: 16, x1: 26 },
  ];
  ROWS.forEach(({ y, x0, x1 }) => {
    hLine(ctx, colors.primary.base, x0, y, x1 - x0 + 1);
  });
  ROWS.forEach(({ y, x0 }) => px(ctx, colors.primary.highlight, x0 + 1, y));
  ROWS.forEach(({ y, x1 }) => px(ctx, colors.primary.shadow, x1 - 1, y));
}

// ── Variant table ──────────────────────────────────────────────────────────

const HELMET_VARIANTS = {
  cap:       { drawSouth: drawCapSouth,      drawWest: drawCapWest,      label: 'Cap'      },
  full_helm: { drawSouth: drawFullHelmSouth, drawWest: drawFullHelmWest, label: 'Full Helm' },
  hood:      { drawSouth: drawHoodSouth,     drawWest: drawHoodWest,     label: 'Hood'     },
};

// ── Frame generator ────────────────────────────────────────────────────────

/**
 * Generate one helmet frame canvas, sized + positioned to overlay a
 * matching character frame.
 *
 * @param {object} variantInfo   - entry from HELMET_VARIANTS
 * @param {object} colors        - entry from ARMOR_MATERIALS
 * @param {object} config        - character config (height-aware)
 * @param {string} animName
 * @param {object} frameOffset   - frame offset object (bodyY, headBob, ...)
 * @param {string} direction
 * @returns {Canvas}
 */
function generateHelmetFrame(variantInfo, colors, config, animName, frameOffset, direction) {
  const yA       = getYAnchors(config);
  const bodyY    = frameOffset.bodyY   || 0;
  const headBob  = frameOffset.headBob || 0;
  const headDeltaY = yA.neckY - 50;
  const totalY   = bodyY + headBob + headDeltaY;

  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  if (direction === 'south' || direction === 'north') {
    ctx.save();
    ctx.translate(0, totalY);
    variantInfo.drawSouth(ctx, colors);
    ctx.restore();
    return canvas;
  }

  if (direction === 'west') {
    ctx.save();
    ctx.translate(0, totalY);
    variantInfo.drawWest(ctx, colors);
    ctx.restore();
    return canvas;
  }

  // east = horizontal mirror of west
  const { canvas: tmp, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  tmpCtx.save();
  tmpCtx.translate(0, totalY);
  variantInfo.drawWest(tmpCtx, colors);
  tmpCtx.restore();
  const mirrored = mirrorCanvasH(tmp);
  ctx.drawImage(mirrored, 0, 0);
  return canvas;
}

module.exports = { generateHelmetFrame, HELMET_VARIANTS };
