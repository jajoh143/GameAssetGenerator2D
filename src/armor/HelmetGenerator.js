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
  // Deepen bottom-half outline to pure black for volumetric weight
  px(ctx, '#000000', cx - 10, top + 3);
  px(ctx, '#000000', cx - 10, top + 4);
  px(ctx, '#000000', cx + 9,  top + 3);
  px(ctx, '#000000', cx + 9,  top + 4);

  // Specular highlight (top-left corner) — single ultra-bright pixel
  px(ctx, '#ffffff', cx - 5, top + 1);

  // Trim band at brow (3px tall metal band)
  shadeBand(ctx, { primary: colors.metal }, cx - 9, top + 5, 18);
  // 2 rivets on the brow trim band
  px(ctx, colors.metal.outline, cx - 7, top + 6);
  px(ctx, colors.metal.outline, cx + 6, top + 6);
}

function drawFullHelmSouth(ctx, colors) {
  // Knight's helm — full coverage from above-the-crown down to the chin,
  // sized to match the actual head silhouette. The peak head width is ≈30 px
  // (x=17..46 in source coords), so the helm is a 30-wide capsule with a
  // 3-row dome taper at top, plus a narrower neck guard so it doesn't crash
  // into the shoulders.
  const top    = HY - 1;            // 20
  const cx     = HX + HW / 2;       // 32
  const bottom = HY + 30;           // 51
  const h      = bottom - top;      // 31

  // Top dome — 3-row taper widening from 20 → 26 → 28
  hLine(ctx, colors.primary.base, cx - 10, top,     20);   // y=20
  hLine(ctx, colors.primary.base, cx - 12, top + 1, 24);   // y=21
  hLine(ctx, colors.primary.base, cx - 13, top + 2, 26);   // y=22
  // Main capsule — 30 wide, from y=23 down to bottom-1 (y=50)
  fillRect(ctx, colors.primary.base, cx - 14, top + 3, 28, h - 3);

  // Side highlights (light from upper-left)
  vLine(ctx, colors.primary.highlight, cx - 13, top + 4, h - 6);
  hLine(ctx, colors.primary.highlight, cx - 9,  top,     6);
  // Side shadows (right + bottom)
  vLine(ctx, colors.primary.shadow, cx + 12, top + 4, h - 6);
  hLine(ctx, colors.primary.shadow, cx + 4,  top,     6);
  hLine(ctx, colors.primary.shadow, cx - 13, bottom - 2, 27);

  // Outline (perimeter — follows the 3-row dome taper into vertical sides)
  px(ctx, colors.primary.outline, cx - 11, top);
  px(ctx, colors.primary.outline, cx + 10, top);
  px(ctx, colors.primary.outline, cx - 13, top + 1);
  px(ctx, colors.primary.outline, cx + 12, top + 1);
  px(ctx, colors.primary.outline, cx - 14, top + 2);
  px(ctx, colors.primary.outline, cx + 13, top + 2);
  vLine(ctx, colors.primary.outline, cx - 15, top + 3, h - 4);
  vLine(ctx, colors.primary.outline, cx + 14, top + 3, h - 4);
  hLine(ctx, colors.primary.outline, cx - 9,  top - 1, 18);

  // Eye slit at brow level — wider to span the new helm width.
  fillRect(ctx, colors.primary.outline, cx - 10, HY + 9, 20, 2);
  px(ctx, colors.metal.highlight, cx - 8, HY + 9);
  px(ctx, colors.metal.highlight, cx + 7, HY + 9);

  // Vertical seam down the face.
  vLine(ctx, colors.primary.shadow,  cx,     HY + 12, 12);
  vLine(ctx, colors.primary.outline, cx - 1, HY + 14, 8);

  // Breathing slits across the lower jaw.
  for (let r = HY + 22; r <= HY + 26; r += 2) {
    hLine(ctx, colors.primary.outline, cx - 7, r, 15);
  }

  // Neck guard — narrower than helm body so it doesn't bleed into shoulders.
  hLine(ctx, colors.primary.base,    cx - 12, bottom,     24);
  px(ctx, colors.primary.outline, cx - 13, bottom);
  px(ctx, colors.primary.outline, cx + 12, bottom);
  hLine(ctx, colors.primary.outline, cx - 12, bottom + 1, 24);

  // Crest / ridge along the very top of the dome.
  vLine(ctx, colors.metal.base,    cx,     top - 2, 4);
  vLine(ctx, colors.metal.outline, cx - 1, top - 2, 4);
  vLine(ctx, colors.metal.outline, cx + 1, top - 2, 4);

  // Deepen bottom-half outline (left + right sides) for volumetric weight
  vLine(ctx, '#000000', cx - 15, top + 14, h - 14);
  vLine(ctx, '#000000', cx + 14, top + 14, h - 14);

  // Specular highlight on the top-left curve (single ultra-bright pixel)
  px(ctx, '#ffffff', cx - 9, top);
  // Specular dot on the helm crown
  px(ctx, colors.metal.highlight, cx,     top - 1);

  // 2 rivets on each helm rim (along bottom).
  px(ctx, colors.metal.outline, cx - 11, bottom - 1);
  px(ctx, colors.metal.outline, cx + 10, bottom - 1);
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
  // Crescent shadow band INSIDE the hood opening (above eye line) — 2-px-deep
  // crescent painted with darker shadow tone to depict face shading.
  hLine(ctx, colors.primary.shadow, cx - 6, top + 8, 12);
  hLine(ctx, colors.primary.outline, cx - 5, top + 9,  10);
  // Highlight along outer-left edge
  ROWS.filter(r => r.x0 === cx - 12 || r.x0 === cx - 14).forEach(({ y, x0 }) => {
    px(ctx, colors.primary.highlight, x0 + 1, y);
  });
  // Shadow along outer-right edge
  ROWS.filter(r => r.x1 === cx + 11 || r.x1 === cx + 13).forEach(({ y, x1 }) => {
    px(ctx, colors.primary.shadow, x1 - 1, y);
  });
}

function drawHornedSouth(ctx, colors) {
  // Full helm base + two curved horns sweeping out and back from the temples.
  drawFullHelmSouth(ctx, colors);

  const cx = HX + HW / 2;
  // Anchor: temples ~ HY+4, just outside the helm body (cx ± 16, since the
  // helm body is now 30 wide).
  // Left horn: 4 rows tall, curves up-and-out.
  const Lx = cx - 16;
  const Ly = HY + 4;
  // Curve outward then up (in source coords)
  px(ctx, colors.metal.base, Lx,     Ly);
  px(ctx, colors.metal.base, Lx - 1, Ly - 1);
  px(ctx, colors.metal.base, Lx - 2, Ly - 2);
  px(ctx, colors.metal.base, Lx - 2, Ly - 3);
  px(ctx, colors.metal.base, Lx - 1, Ly - 4);
  // Highlight + outline on left horn
  px(ctx, colors.metal.highlight, Lx - 2, Ly - 2);
  px(ctx, colors.metal.outline,   Lx - 3, Ly - 2);
  px(ctx, colors.metal.outline,   Lx - 3, Ly - 3);
  px(ctx, colors.metal.outline,   Lx - 2, Ly - 5);

  // Right horn: mirror.
  const Rx = cx + 15;
  const Ry = HY + 4;
  px(ctx, colors.metal.base, Rx,     Ry);
  px(ctx, colors.metal.base, Rx + 1, Ry - 1);
  px(ctx, colors.metal.base, Rx + 2, Ry - 2);
  px(ctx, colors.metal.base, Rx + 2, Ry - 3);
  px(ctx, colors.metal.base, Rx + 1, Ry - 4);
  px(ctx, colors.metal.shadow,  Rx + 2, Ry - 2);
  px(ctx, colors.metal.outline, Rx + 3, Ry - 2);
  px(ctx, colors.metal.outline, Rx + 3, Ry - 3);
  px(ctx, colors.metal.outline, Rx + 2, Ry - 5);
}

function drawHornedWest(ctx, colors) {
  // Full helm side profile + a backward-sweeping horn from the temple.
  drawFullHelmWest(ctx, colors);
  // Anchor: behind the temple (right side of helm in west view ~ x=30, y=HY+4)
  const Hx = 30;
  const Hy = HY + 4;
  px(ctx, colors.metal.base, Hx,     Hy);
  px(ctx, colors.metal.base, Hx + 1, Hy - 1);
  px(ctx, colors.metal.base, Hx + 2, Hy - 1);
  px(ctx, colors.metal.base, Hx + 3, Hy - 2);
  px(ctx, colors.metal.base, Hx + 4, Hy - 3);
  px(ctx, colors.metal.highlight, Hx + 1, Hy - 1);
  px(ctx, colors.metal.outline,   Hx + 4, Hy - 4);
  px(ctx, colors.metal.outline,   Hx + 5, Hy - 3);
  // A second smaller horn forward (other side of head, slightly behind/visible)
  px(ctx, colors.metal.base,    18, Hy);
  px(ctx, colors.metal.base,    17, Hy - 1);
  px(ctx, colors.metal.base,    16, Hy - 2);
  px(ctx, colors.metal.outline, 15, Hy - 2);
  px(ctx, colors.metal.outline, 16, Hy - 3);
}

function drawCrownedSouth(ctx, colors) {
  // Open-top circlet — 3-px-tall band wrapping the brow with 5 upward gem
  // points. Widened to 24 px so the band actually spans the brow.
  const top = HY + 3;
  const cx  = HX + HW / 2;
  // Band rows
  hLine(ctx, colors.primary.base,      cx - 12, top,     24);
  hLine(ctx, colors.primary.highlight, cx - 11, top,     22);
  hLine(ctx, colors.primary.base,      cx - 12, top + 1, 24);
  hLine(ctx, colors.primary.shadow,    cx - 12, top + 2, 24);
  // Outline (top + bottom + ends)
  hLine(ctx, '#000000',               cx - 12, top + 3, 24);
  px(ctx, colors.primary.outline, cx - 13, top);
  px(ctx, colors.primary.outline, cx - 13, top + 1);
  px(ctx, colors.primary.outline, cx - 13, top + 2);
  px(ctx, colors.primary.outline, cx + 12, top);
  px(ctx, colors.primary.outline, cx + 12, top + 1);
  px(ctx, colors.primary.outline, cx + 12, top + 2);
  // Specular pop at top-left of the band
  px(ctx, '#ffffff', cx - 11, top);
  // 4 upward gem points (alternating ruby + sapphire) flanking the central spire.
  const points = [
    { x: cx - 10, color: '#ff3355' },
    { x: cx - 5,  color: '#33aaff' },
    { x: cx + 4,  color: '#ff3355' },
    { x: cx + 10, color: '#33aaff' },
  ];
  // Center taller point (like a crown spire)
  px(ctx, colors.primary.base, cx, top - 2);
  px(ctx, colors.primary.outline, cx - 1, top - 2);
  px(ctx, colors.primary.outline, cx + 1, top - 2);
  px(ctx, '#33aaff', cx, top - 1);
  points.forEach(({ x, color }) => {
    px(ctx, colors.primary.base, x, top - 1);
    px(ctx, color,               x, top);
  });
}

function drawCrownedWest(ctx, colors) {
  // Side profile: a 3-px tall band with 2-3 visible gem points.
  const top  = HY + 3;
  const left = 18, right = 32;
  hLine(ctx, colors.primary.highlight, left, top,     right - left);
  hLine(ctx, colors.primary.base,      left, top + 1, right - left);
  hLine(ctx, colors.primary.shadow,    left, top + 2, right - left);
  hLine(ctx, '#000000',                left, top + 3, right - left);
  vLine(ctx, colors.primary.outline, left - 1, top, 3);
  vLine(ctx, colors.primary.outline, right, top, 3);
  // Specular at front of band
  px(ctx, '#ffffff', left + 1, top);
  // Two upward gem points (gem + spire)
  px(ctx, colors.primary.base,    left + 4, top - 1);
  px(ctx, '#ff3355',              left + 4, top);
  px(ctx, colors.primary.base,    left + 9, top - 1);
  px(ctx, '#33aaff',              left + 9, top);
  // Front spire taller
  px(ctx, colors.primary.base,    left + 2, top - 2);
  px(ctx, colors.primary.outline, left + 1, top - 2);
  px(ctx, colors.primary.outline, left + 3, top - 2);
  px(ctx, '#33aaff',              left + 2, top - 1);
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
  // Specular highlight (top-left)
  px(ctx, '#ffffff', left + 2, top + 1);
  // Trim band
  hLine(ctx, colors.metal.base,    left, top + 5, right - left);
  hLine(ctx, colors.metal.outline, left, top + 6, right - left);
  // Rivets on side
  px(ctx, colors.metal.outline, left + 2, top + 5);
  px(ctx, colors.metal.outline, right - 3, top + 5);
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
  // Specular pop on the top-left of the helm
  px(ctx, '#ffffff', left + 2, top + 1);
  // Deepen bottom-half outlines for weight
  vLine(ctx, '#000000', left, top + Math.floor(h / 2), Math.ceil(h / 2));
  vLine(ctx, '#000000', right - 1, top + Math.floor(h / 2), Math.ceil(h / 2));
  // 2 rivets on side (cheek + jaw)
  px(ctx, colors.metal.outline, left + 2, HY + 6);
  px(ctx, colors.metal.outline, left + 2, HY + 18);
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
  // Crescent shadow inside hood opening (above eye line) for depth.
  hLine(ctx, colors.primary.shadow, 22, top + 7, 4);
  hLine(ctx, colors.primary.outline, 22, top + 8, 3);
}

// ── Variant table ──────────────────────────────────────────────────────────

const HELMET_VARIANTS = {
  cap:       { drawSouth: drawCapSouth,      drawWest: drawCapWest,      label: 'Cap'      },
  full_helm: { drawSouth: drawFullHelmSouth, drawWest: drawFullHelmWest, label: 'Full Helm' },
  hood:      { drawSouth: drawHoodSouth,     drawWest: drawHoodWest,     label: 'Hood'     },
  horned:    { drawSouth: drawHornedSouth,   drawWest: drawHornedWest,   label: 'Horned Helm' },
  crowned:   { drawSouth: drawCrownedSouth,  drawWest: drawCrownedWest,  label: 'Circlet'  },
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
