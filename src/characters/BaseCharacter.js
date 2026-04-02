'use strict';

const { fillRect, pixel, hLine, vLine, fillEllipse, outlineRect } = require('../core/Canvas');
const Colors = require('../core/Colors');

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function px(ctx, color, x, y) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function erasePixel(ctx, x, y) {
  ctx.clearRect(x, y, 1, 1);
}

// ---------------------------------------------------------------------------
// drawGroundShadow
// ---------------------------------------------------------------------------

function drawGroundShadow(ctx, cx, y) {
  fillEllipse(ctx, Colors.GROUND_SHADOW, cx, y, 14, 3);
}

// ---------------------------------------------------------------------------
// drawHeadSouth  –  front-facing head, fixed at x=22, y=5  (20×18)
// ---------------------------------------------------------------------------

function drawHeadSouth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 22, HY = 5, HW = 20, HH = 18;
  const outline = '#111111';

  // ── Oval face shape ──────────────────────────────────────────────────────
  // Hair covers top 7 rows (y=5-11), face visible from HY+7 downward.
  // Row widths widen at cheeks then taper to a pointed chin:
  //  y=12 (HY+7):  14px  x=25-38
  //  y=13 (HY+8):  16px  x=24-39
  //  y=14-16:      18px  x=23-40  (cheeks — widest)
  //  y=17-18:      16px  x=24-39
  //  y=19-20:      14px  x=25-38
  //  y=21:         12px  x=26-37  (pre-chin)
  //  y=22 (HY+17): 10px  x=27-36  (chin)

  hLine(ctx, skinColors.base, 25, HY + 7, 14);   // y=12: 14px
  hLine(ctx, skinColors.base, 24, HY + 8, 16);   // y=13: 16px
  fillRect(ctx, skinColors.base, 23, HY + 9, 18, 3);  // y=14-16: 18px cheeks
  fillRect(ctx, skinColors.base, 24, HY + 12, 16, 2); // y=17-18: 16px
  fillRect(ctx, skinColors.base, 25, HY + 14, 14, 2); // y=19-20: 14px
  hLine(ctx, skinColors.base, 26, HY + 16, 12);  // y=21: 12px pre-chin
  hLine(ctx, skinColors.base, 27, HY + 17, 10);  // y=22: 10px chin

  // ── 4-level shading ──────────────────────────────────────────────────────
  // Highlight (top-left face): rows 12-16 on left quarter (x=24-27)
  fillRect(ctx, skinColors.highlight, 24, HY + 8, 4, 5);
  hLine(ctx, skinColors.highlight, 25, HY + 7, 3);

  // Shadow (right side): rows 13-19 on right quarter (x=38-40)
  vLine(ctx, skinColors.shadow, 38, HY + 8, 7);
  vLine(ctx, skinColors.shadow, 39, HY + 8, 5);
  px(ctx, skinColors.shadow, 40, HY + 9);
  px(ctx, skinColors.shadow, 40, HY + 10);
  px(ctx, skinColors.shadow, 40, HY + 11);

  // Dark shadow (chin): rows 20-22
  hLine(ctx, skinColors.shadow, 25, HY + 14, 14);
  hLine(ctx, skinColors.shadow, 26, HY + 16, 12);
  hLine(ctx, skinColors.shadow, 27, HY + 17, 10);

  // ── Oval outline ─────────────────────────────────────────────────────────
  // Left side
  px(ctx, outline, 25, HY + 7);
  px(ctx, outline, 24, HY + 8);
  vLine(ctx, outline, 23, HY + 9, 3);   // y=14-16 cheeks
  px(ctx, outline, 24, HY + 12);
  px(ctx, outline, 24, HY + 13);
  px(ctx, outline, 25, HY + 14);
  px(ctx, outline, 25, HY + 15);
  px(ctx, outline, 26, HY + 16);
  px(ctx, outline, 27, HY + 17);
  // Right side (mirror)
  px(ctx, outline, 38, HY + 7);
  px(ctx, outline, 39, HY + 8);
  vLine(ctx, outline, 40, HY + 9, 3);   // y=14-16 cheeks
  px(ctx, outline, 39, HY + 12);
  px(ctx, outline, 39, HY + 13);
  px(ctx, outline, 38, HY + 14);
  px(ctx, outline, 38, HY + 15);
  px(ctx, outline, 37, HY + 16);
  px(ctx, outline, 36, HY + 17);
  // Chin bottom
  hLine(ctx, outline, 28, HY + 17, 8);

  // ── Eyebrows ─────────────────────────────────────────────────────────────
  const browY = HY + 8;   // y=13
  hLine(ctx, hairColors.base,   26, browY, 4);   // left brow
  px(ctx,   hairColors.shadow,  26, browY);
  hLine(ctx, hairColors.base,   33, browY, 4);   // right brow
  px(ctx,   hairColors.shadow,  36, browY);

  // ── Eyes  (3×2 each) ─────────────────────────────────────────────────────
  const eyeY = HY + 9;   // y=14
  // whites
  fillRect(ctx, '#FFFFFF', 26, eyeY, 4, 2);
  fillRect(ctx, '#FFFFFF', 33, eyeY, 4, 2);
  // iris / pupil
  px(ctx, '#5A3010', 26, eyeY + 1);
  px(ctx, '#1A0800', 27, eyeY + 1);
  px(ctx, '#5A3010', 33, eyeY + 1);
  px(ctx, '#1A0800', 34, eyeY + 1);
  // eye outlines
  outlineRect(ctx, outline, 26, eyeY, 4, 2);
  outlineRect(ctx, outline, 33, eyeY, 4, 2);
  // eyelid shadow above eyes
  hLine(ctx, skinColors.shadow, 26, eyeY - 1, 4);
  hLine(ctx, skinColors.shadow, 33, eyeY - 1, 4);

  // ── Nose ─────────────────────────────────────────────────────────────────
  const noseY = HY + 12;   // y=17
  px(ctx, skinColors.shadow, 30, noseY + 1);  // left nostril
  px(ctx, skinColors.shadow, 31, noseY);
  px(ctx, skinColors.shadow, 32, noseY);
  px(ctx, skinColors.shadow, 33, noseY + 1);  // right nostril

  // ── Mouth ─────────────────────────────────────────────────────────────────
  const mouthY = HY + 15;   // y=20
  px(ctx, skinColors.shadow, 27, mouthY);       // left corner
  hLine(ctx, '#C05050',      28, mouthY, 3);    // left lip
  px(ctx, skinColors.shadow, 31, mouthY);       // center dip
  hLine(ctx, '#C05050',      32, mouthY, 3);    // right lip
  px(ctx, skinColors.shadow, 35, mouthY);       // right corner

  // ── Hair ─────────────────────────────────────────────────────────────────
  drawHairSouth(ctx, hairColors, hairStyle, HX, HY, HW);
}

// ---------------------------------------------------------------------------
// drawHairSouth
// ---------------------------------------------------------------------------

function drawHairSouth(ctx, hairColors, hairStyle, headX, headY, headW) {
  const outline = '#111111';

  // Top hair band (7px tall, rows y=HY to HY+6)
  fillRect(ctx, hairColors.base, headX, headY, headW, 7);
  // Highlight stripe
  hLine(ctx, hairColors.highlight, headX + 3, headY + 1, headW - 8);
  hLine(ctx, hairColors.highlight, headX + 2, headY + 2, headW - 6);
  // Lower hair-line shadow
  hLine(ctx, hairColors.shadow, headX, headY + 5, headW);
  hLine(ctx, hairColors.shadow, headX, headY + 6, headW);

  // Side sideburn strips: x=22-23 (left) and x=40-41 (right)
  // Short hair: down to y=18 (headY+13)
  // Medium:     down to y=23 (headY+18)
  // Long:       down to y=28 (headY+23)
  const sideburnShortEnd = headY + 13;
  const sideburnMedEnd   = headY + 18;
  const sideburnLongEnd  = headY + 23;

  // Always draw base sideburns (short length)
  vLine(ctx, hairColors.base, headX,     headY, sideburnShortEnd - headY);
  vLine(ctx, hairColors.base, headX + 1, headY, sideburnShortEnd - headY);
  vLine(ctx, hairColors.base, headX + headW - 2, headY, sideburnShortEnd - headY);
  vLine(ctx, hairColors.base, headX + headW - 1, headY, sideburnShortEnd - headY);

  if (hairStyle === 'medium') {
    vLine(ctx, hairColors.base, headX,             sideburnShortEnd, sideburnMedEnd - sideburnShortEnd);
    vLine(ctx, hairColors.base, headX + 1,         sideburnShortEnd, sideburnMedEnd - sideburnShortEnd);
    vLine(ctx, hairColors.base, headX + headW - 2, sideburnShortEnd, sideburnMedEnd - sideburnShortEnd);
    vLine(ctx, hairColors.base, headX + headW - 1, sideburnShortEnd, sideburnMedEnd - sideburnShortEnd);
  } else if (hairStyle === 'long') {
    vLine(ctx, hairColors.base, headX,             sideburnShortEnd, sideburnLongEnd - sideburnShortEnd);
    vLine(ctx, hairColors.base, headX + 1,         sideburnShortEnd, sideburnLongEnd - sideburnShortEnd);
    vLine(ctx, hairColors.base, headX + headW - 2, sideburnShortEnd, sideburnLongEnd - sideburnShortEnd);
    vLine(ctx, hairColors.base, headX + headW - 1, sideburnShortEnd, sideburnLongEnd - sideburnShortEnd);
  }

  // Re-draw top outline over hair
  hLine(ctx, outline, headX, headY, headW);
  vLine(ctx, outline, headX,             headY, 7);
  vLine(ctx, outline, headX + headW - 1, headY, 7);
}

// ---------------------------------------------------------------------------
// drawHeadNorth  –  back of head, fixed at x=22, y=5  (20×18)
// ---------------------------------------------------------------------------

function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 22, HY = 5, HW = 20, HH = 18;
  const outline = '#111111';

  // Skin (neck area at bottom)
  fillRect(ctx, skinColors.base, HX + 2, HY + 12, HW - 4, 6);

  // Hair covers most of back
  fillRect(ctx, hairColors.base, HX, HY, HW, HH - 5);
  // Highlight stripe
  hLine(ctx, hairColors.highlight, HX + 3, HY + 1, HW - 8);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 2, HW - 6);
  // Shadow at hair bottom edge
  hLine(ctx, hairColors.shadow, HX, HY + HH - 7, HW);
  hLine(ctx, hairColors.shadow, HX, HY + HH - 6, HW);

  if (hairStyle === 'long') {
    fillRect(ctx, hairColors.base, HX + 1, HY + HH - 5, HW - 2, 5);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HH - 1, HW - 2);
  }

  outlineRect(ctx, outline, HX, HY, HW, HH);
}

// ---------------------------------------------------------------------------
// drawHeadWest  –  side profile facing LEFT, nose extends past HX
// ---------------------------------------------------------------------------

function drawHeadWest(ctx, skinColors, hairColors, hairStyle) {
  // Profile: 14px wide, 18px tall (proportionally wider to match new south head)
  // Head occupies x=19-32, y=5-22  (facing left, face at low-x end)
  const HX = 19, HY = 5, HW = 14, HH = 18;
  const outline = '#111111';

  // --- Skin fill ---
  fillRect(ctx, skinColors.base, HX, HY, HW, HH);
  // highlight on forehead/face side (left = facing side)
  fillRect(ctx, skinColors.highlight, HX, HY + 1, 4, 6);
  // shadow on back of head
  vLine(ctx, skinColors.shadow, HX + HW - 1, HY + 2, HH - 4);
  // chin underside
  hLine(ctx, skinColors.shadow, HX + 1, HY + HH - 2, HW - 3);

  // Forehead bump (pixel at top-left)
  px(ctx, skinColors.base, HX, HY);

  // Chin pixel (rounded)
  px(ctx, skinColors.base, HX, HY + HH - 1);
  erasePixel(ctx, HX + HW - 1, HY);            // clip top-right corner
  erasePixel(ctx, HX + HW - 1, HY + HH - 1);  // clip bottom-right corner

  // --- Nose  extends past HX to x=HX-1 ---
  px(ctx, skinColors.shadow, HX - 1, HY + 7);
  px(ctx, skinColors.base,   HX - 1, HY + 6);

  // --- Eye  x=HX to HX+2 ---
  const eyeY = HY + 5;
  fillRect(ctx, '#FFFFFF', HX, eyeY, 3, 2);
  px(ctx, '#1A0800', HX + 1, eyeY + 1);
  outlineRect(ctx, outline, HX, eyeY, 3, 2);

  // --- Eyebrow ---
  hLine(ctx, hairColors.base, HX, eyeY - 1, 4);

  // --- Mouth ---
  hLine(ctx, skinColors.shadow, HX, eyeY + 8, 3);
  px(ctx, '#D06060', HX + 1, eyeY + 9);

  // --- Hard outline ---
  outlineRect(ctx, outline, HX, HY, HW, HH);
  // nose protrusion outline
  px(ctx, outline, HX - 1, HY + 5);
  px(ctx, outline, HX - 1, HY + 8);

  // --- Hair ---
  // Top hair band (7px tall)
  fillRect(ctx, hairColors.base, HX, HY, HW, 7);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 1, HW - 4);
  hLine(ctx, hairColors.shadow,    HX,     HY + 5, HW);
  hLine(ctx, hairColors.shadow,    HX,     HY + 6, HW);
  // Back of hair strip (right side = back of head)
  vLine(ctx, hairColors.base, HX + HW - 2, HY, HH);
  vLine(ctx, hairColors.base, HX + HW - 1, HY, HH);

  if (hairStyle === 'long') {
    vLine(ctx, hairColors.base, HX + HW - 2, HY + HH, 5);
    vLine(ctx, hairColors.base, HX + HW - 1, HY + HH, 5);
  }

  // Re-draw top/back outline over hair
  hLine(ctx, outline, HX, HY, HW);
  vLine(ctx, outline, HX + HW - 1, HY, HH);
}

// ---------------------------------------------------------------------------
// drawNeckSouth
// ---------------------------------------------------------------------------

function drawNeckSouth(ctx, skinColors, baseY) {
  // neck: 10px wide x 3px, centered at x=27-36 (wider to match larger head)
  const NX = 27, NW = 10, NH = 3;
  fillRect(ctx, skinColors.base, NX, baseY, NW, NH);
  vLine(ctx, skinColors.highlight, NX + 1, baseY, NH);
  vLine(ctx, skinColors.shadow,    NX + NW - 2, baseY, NH);
  outlineRect(ctx, skinColors.outline, NX, baseY, NW, NH);
}

// ---------------------------------------------------------------------------
// Jacket / Hoodie / Apron  (South)
// ---------------------------------------------------------------------------

function drawJacketSouth(ctx, colors, x, y, w, h) {
  const cx = x + Math.floor(w / 2);

  // ── Single body fill ──────────────────────────────────────────────────────
  fillRect(ctx, colors.base, x, y, w, h);

  // ── Shoulder arch (connects to arm peaks) ─────────────────────────────────
  px(ctx, colors.base,    x - 1, y);          // left shoulder cap
  px(ctx, colors.base,    x - 2, y - 1);      // left shoulder PEAK
  px(ctx, colors.shadow,  x - 2, y);
  px(ctx, colors.outline, x - 3, y - 1);
  px(ctx, colors.outline, x - 2, y - 2);

  px(ctx, colors.base,    x + w,     y);      // right shoulder cap
  px(ctx, colors.base,    x + w + 1, y - 1);  // right shoulder PEAK
  px(ctx, colors.shadow,  x + w + 1, y);
  px(ctx, colors.outline, x + w + 2, y - 1);
  px(ctx, colors.outline, x + w + 1, y - 2);

  // ── 3-zone shading for cylindrical depth ─────────────────────────────────
  // Highlight zone: left 2 columns
  vLine(ctx, colors.highlight, x + 1, y + 1, h - 2);
  vLine(ctx, colors.highlight, x + 2, y + 1, h / 2);  // fade out at mid

  // Shadow zone: right 2 columns
  vLine(ctx, colors.shadow, x + w - 2, y + 1, h - 2);
  vLine(ctx, colors.shadow, x + w - 3, y + 1, h - 2);

  // Bottom edge darker
  hLine(ctx, colors.shadow, x + 1, y + h - 2, w - 2);

  // ── V-Collar / Lapels ────────────────────────────────────────────────────
  const shirtCol = colors.collar || colors.highlight;
  fillRect(ctx, shirtCol, cx - 3, y, 6, 8);

  for (let dy = 0; dy < 8; dy++) {
    const lapelW = Math.round(dy * 0.45);
    fillRect(ctx, colors.base, cx - 3,          y + dy, lapelW + 1, 1);
    fillRect(ctx, colors.base, cx + 2 - lapelW, y + dy, lapelW + 1, 1);
  }
  for (let dy = 1; dy < 7; dy++) {
    px(ctx, colors.shadow, cx - 3 + Math.round(dy * 0.45), y + dy);
  }
  for (let dy = 1; dy < 7; dy++) {
    px(ctx, colors.shadow, cx + 2 - Math.round(dy * 0.45), y + dy);
  }

  // ── Smooth outline with rounded corners ──────────────────────────────────
  outlineRect(ctx, colors.outline, x, y, w, h);
  // Clip corners to round them
  erasePixel(ctx, x,         y);
  erasePixel(ctx, x + w - 1, y);
  erasePixel(ctx, x,         y + h - 1);
  erasePixel(ctx, x + w - 1, y + h - 1);
  // Restore rounded outline pixels
  px(ctx, colors.outline, x + 1,     y);
  px(ctx, colors.outline, x + w - 2, y);
  px(ctx, colors.outline, x + 1,     y + h - 1);
  px(ctx, colors.outline, x + w - 2, y + h - 1);
  px(ctx, colors.outline, x,         y + 1);
  px(ctx, colors.outline, x + w - 1, y + 1);
  px(ctx, colors.outline, x,         y + h - 2);
  px(ctx, colors.outline, x + w - 1, y + h - 2);
}

function drawHoodieSouth(ctx, colors, x, y, w, h) {
  fillRect(ctx, colors.base, x, y, w, h);

  // highlight / shadow sides
  vLine(ctx, colors.highlight, x + 1, y + 1, h - 2);
  vLine(ctx, colors.highlight, x + 2, y + 1, h - 2);
  vLine(ctx, colors.shadow,    x + w - 2, y + 1, h - 2);
  vLine(ctx, colors.shadow,    x + w - 3, y + 1, h - 2);

  // Hood visible at top center
  const hx = x + Math.floor(w / 2) - 3;
  fillRect(ctx, colors.collar, hx, y, 6, 4);
  outlineRect(ctx, colors.outline, hx, y, 6, 4);

  // Kangaroo pocket at bottom center
  const px2 = x + Math.floor(w / 2) - 4;
  const py2 = y + Math.floor(h * 0.58);
  const pw = 8, ph = Math.floor(h * 0.35);
  fillRect(ctx, colors.shadow, px2, py2, pw, ph);
  outlineRect(ctx, colors.outline, px2, py2, pw, ph);

  outlineRect(ctx, colors.outline, x, y, w, h);
}

function drawApronSouth(ctx, colors, x, y, w, h) {
  // Base shirt underneath
  const shirtBase  = colors.base_base      || '#7878A0';
  const shirtHi    = colors.base_highlight || '#A8A8B8';
  const shirtSh    = colors.base_shadow    || '#484870';
  fillRect(ctx, shirtBase, x, y, w, h);
  vLine(ctx, shirtHi, x + 1, y + 1, h - 2);
  vLine(ctx, shirtHi, x + 2, y + 1, h - 2);
  vLine(ctx, shirtSh, x + w - 3, y + 1, h - 2);
  vLine(ctx, shirtSh, x + w - 2, y + 1, h - 2);

  // Apron overlay (narrower, centered)
  const ax = x + 3, aw = w - 6;
  fillRect(ctx, colors.base, ax, y + 2, aw, h - 2);
  vLine(ctx, colors.highlight, ax + 1, y + 3, h - 4);
  vLine(ctx, colors.shadow,    ax + aw - 2, y + 3, h - 4);

  // Tie strings at top
  fillRect(ctx, colors.collar, x + 1, y, 2, 3);
  fillRect(ctx, colors.collar, x + w - 3, y, 2, 3);

  outlineRect(ctx, colors.outline, ax, y + 2, aw, h - 2);
  outlineRect(ctx, '#404060',      x,  y,     w,  h);
}

function drawTorsoSouth(ctx, clothingKey, clothingColors, x, y, w, h) {
  if (clothingKey.startsWith('jacket')) {
    drawJacketSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('hoodie')) {
    drawHoodieSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('apron')) {
    drawApronSouth(ctx, clothingColors, x, y, w, h);
  } else {
    fillRect(ctx, clothingColors.base, x, y, w, h);
    outlineRect(ctx, clothingColors.outline, x, y, w, h);
  }
}

// ---------------------------------------------------------------------------
// drawTorsoWest  –  side view torso x=20-32, y=26-43
// ---------------------------------------------------------------------------

function drawTorsoWest(ctx, clothingKey, clothingColors, x, y) {
  const w = 13, h = 18;

  fillRect(ctx, clothingColors.base, x, y, w, h);

  // Front side highlight (left edge)
  vLine(ctx, clothingColors.highlight, x,     y + 1, h - 2);
  vLine(ctx, clothingColors.highlight, x + 1, y + 1, h - 2);

  // Back/right side shadow
  vLine(ctx, clothingColors.shadow, x + w - 2, y + 1, h - 2);
  vLine(ctx, clothingColors.shadow, x + w - 3, y + 1, h - 2);

  // Slight belly contour at mid-height
  px(ctx, clothingColors.shadow, x + w, y + Math.floor(h / 2));

  // Bottom edge darker
  hLine(ctx, clothingColors.shadow, x + 1, y + h - 2, w - 2);

  outlineRect(ctx, clothingColors.outline, x, y, w, h);
}

// ---------------------------------------------------------------------------
// drawBeltSouth / drawBeltWest
// ---------------------------------------------------------------------------

function drawBeltSouth(ctx, beltColors, x, y) {
  // Belt / hip band: tapers from torso waist (20px) down toward legs
  // Row 1 (beltY):   20px wide x=22-41 — matches torso waist
  // Row 2 (beltY+1): 18px wide x=23-40 — taper step
  const w = 20, h = 2;
  fillRect(ctx, beltColors.base, x, y, w, h);
  // Second row slightly narrower (hip taper)
  fillRect(ctx, beltColors.base, x + 1, y + 1, w - 2, 1);
  // Buckle center
  const bx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, beltColors.buckle, bx, y, 3, h);
  // Hip taper dark corners at outer edges of row 2
  px(ctx, beltColors.outline, x, y + 1);
  px(ctx, beltColors.outline, x + w - 1, y + 1);
  outlineRect(ctx, beltColors.outline, x, y, w, 1);
  // Outline bottom row separately
  hLine(ctx, beltColors.outline, x + 1, y + 1, w - 2);
  px(ctx, beltColors.outline, x + 1, y + 2);
  px(ctx, beltColors.outline, x + w - 2, y + 2);
}

function drawBeltWest(ctx, beltColors, x, y) {
  const w = 13, h = 2;
  fillRect(ctx, beltColors.base, x, y, w, h);
  const bx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, beltColors.buckle, bx, y, 3, h);
  outlineRect(ctx, beltColors.outline, x, y, w, h);
}

// ---------------------------------------------------------------------------
// drawLegsSouth
// ---------------------------------------------------------------------------

function drawLegsSouth(ctx, pantColors, lLegDX, rLegDX, baseY) {
  // Each leg: 6px wide, 13px tall
  // Left leg x=25-30, Right leg x=34-39, gap x=31-33 (3px)
  const legH = 13;
  const lx = 25 + Math.round(lLegDX);
  const rx = 34 + Math.round(rLegDX);
  const y  = baseY;

  // Left leg
  fillRect(ctx, pantColors.base, lx, y, 6, legH);
  vLine(ctx, pantColors.highlight, lx + 1, y, legH);
  vLine(ctx, pantColors.shadow,    lx + 4, y, legH);
  // Knee highlight (y+6)
  hLine(ctx, pantColors.highlight, lx + 1, y + 6, 2);
  outlineRect(ctx, pantColors.outline, lx, y, 6, legH);

  // Right leg
  fillRect(ctx, pantColors.base, rx, y, 6, legH);
  vLine(ctx, pantColors.highlight, rx + 1, y, legH);
  vLine(ctx, pantColors.shadow,    rx + 4, y, legH);
  hLine(ctx, pantColors.highlight, rx + 1, y + 6, 2);
  outlineRect(ctx, pantColors.outline, rx, y, 6, legH);
}

// ---------------------------------------------------------------------------
// drawLegsWest  –  side profile legs with stride
// ---------------------------------------------------------------------------

function drawLegsWest(ctx, pantColors, frontLegX, backLegX, baseY) {
  const legH = 13, legW = 7;

  // Back leg (dimmer)
  fillRect(ctx, pantColors.shadow, backLegX - 3, baseY, legW, legH);
  outlineRect(ctx, pantColors.outline, backLegX - 3, baseY, legW, legH);

  // Front leg (full detail)
  fillRect(ctx, pantColors.base, frontLegX - 3, baseY, legW, legH);
  vLine(ctx, pantColors.highlight, frontLegX - 2, baseY, legH);
  vLine(ctx, pantColors.shadow,    frontLegX + 2, baseY, legH);
  hLine(ctx, pantColors.highlight, frontLegX - 2, baseY + 6, 2);
  outlineRect(ctx, pantColors.outline, frontLegX - 3, baseY, legW, legH);
}

// ---------------------------------------------------------------------------
// drawShoesSouth
// ---------------------------------------------------------------------------

function drawShoesSouth(ctx, shoeColors, lShoeDX, rShoeDX, baseY) {
  // Left shoe: x=23-32 (10px wide, 4px tall) — centered under 6px leg
  const lx = 23 + Math.round(lShoeDX);
  const rx = 34 + Math.round(rShoeDX);
  const y  = baseY;

  // Left shoe
  fillRect(ctx, shoeColors.base, lx, y, 10, 4);
  hLine(ctx, shoeColors.highlight, lx + 1, y,         8);
  hLine(ctx, shoeColors.shadow,    lx,     y + 3,     10);
  // Toe rounding (left side)
  px(ctx, shoeColors.shadow, lx, y);
  outlineRect(ctx, shoeColors.outline, lx, y, 10, 4);

  // Right shoe
  fillRect(ctx, shoeColors.base, rx, y, 10, 4);
  hLine(ctx, shoeColors.highlight, rx + 1, y,     8);
  hLine(ctx, shoeColors.shadow,    rx,     y + 3, 10);
  // Toe rounding (right side)
  px(ctx, shoeColors.shadow, rx + 9, y);
  outlineRect(ctx, shoeColors.outline, rx, y, 10, 4);
}

// ---------------------------------------------------------------------------
// drawShoesWest  –  side profile shoes
// ---------------------------------------------------------------------------

function drawShoesWest(ctx, shoeColors, frontX, backX, baseY) {
  const y = baseY;

  // Back shoe (dimmer)
  fillRect(ctx, shoeColors.shadow, backX - 3,  y, 11, 4);
  hLine(ctx,  shoeColors.outline,  backX - 3,  y + 3, 11);
  outlineRect(ctx, shoeColors.outline, backX - 3, y, 11, 4);

  // Front shoe: pointing left (toe at lower-x)
  fillRect(ctx, shoeColors.base, frontX - 6, y, 13, 4);
  hLine(ctx, shoeColors.highlight, frontX - 5, y, 11);
  hLine(ctx, shoeColors.shadow,    frontX - 6, y + 3, 13);
  // Toe detail (round left)
  px(ctx, shoeColors.shadow, frontX - 6, y);
  // Heel
  px(ctx, shoeColors.shadow, frontX + 6, y);
  outlineRect(ctx, shoeColors.outline, frontX - 6, y, 13, 4);
}

// ---------------------------------------------------------------------------
// drawArmsSouth
// ---------------------------------------------------------------------------

function drawArmsSouth(ctx, clothingColors, skinColors, lArmDY, rArmDY) {
  // Arms are 5px wide — matches reference art proportions.
  // Highlight on the outer edge (away from body), shadow on inner edge (toward body).
  // Inner outline edge omitted so no seam appears at the shoulder joint.
  const lx = 16, rx = 43;
  const baseY = 26;
  const sleeveH = 11, handH = 5, aw = 5;

  const lArmY = baseY + Math.round(lArmDY);
  const rArmY = baseY + Math.round(rArmDY);

  // ── Left arm ──────────────────────────────────────────────────────────────
  fillRect(ctx, clothingColors.base, lx, lArmY, aw, sleeveH);
  vLine(ctx, clothingColors.highlight, lx,     lArmY, sleeveH);  // outer edge highlight
  vLine(ctx, clothingColors.shadow,    lx + 3, lArmY, sleeveH);  // inner shadow
  // Outline: top, outer left, bottom — omit inner right edge (no seam)
  hLine(ctx, clothingColors.outline, lx, lArmY,              aw);
  vLine(ctx, clothingColors.outline, lx, lArmY,              sleeveH);
  hLine(ctx, clothingColors.outline, lx, lArmY + sleeveH - 1, aw - 1);
  // Left hand (4px wide, slightly tapered)
  fillRect(ctx, skinColors.base, lx, lArmY + sleeveH, aw - 1, handH);
  vLine(ctx, skinColors.highlight, lx, lArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, lx, lArmY + sleeveH, aw - 1, handH);

  // ── Right arm ─────────────────────────────────────────────────────────────
  fillRect(ctx, clothingColors.base, rx, rArmY, aw, sleeveH);
  vLine(ctx, clothingColors.highlight, rx + aw - 1, rArmY, sleeveH);  // outer edge highlight
  vLine(ctx, clothingColors.shadow,    rx + 1,      rArmY, sleeveH);  // inner shadow
  // Outline: top, outer right, bottom — omit inner left edge
  hLine(ctx, clothingColors.outline, rx,          rArmY,              aw);
  vLine(ctx, clothingColors.outline, rx + aw - 1, rArmY,              sleeveH);
  hLine(ctx, clothingColors.outline, rx + 1,      rArmY + sleeveH - 1, aw - 1);
  // Right hand (4px wide)
  fillRect(ctx, skinColors.base, rx + 1, rArmY + sleeveH, aw - 1, handH);
  vLine(ctx, skinColors.highlight, rx + aw - 1, rArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, rx + 1, rArmY + sleeveH, aw - 1, handH);
}

// ---------------------------------------------------------------------------
// drawArmsWest
// ---------------------------------------------------------------------------

function drawArmsWest(ctx, clothingColors, skinColors, frontArmDY, backArmDY, torsoX, torsoY) {
  // frontArm is to the LEFT of the torso (x=13-18)
  // backArm is partially behind torso
  const sleeveH = 11, handH = 5, aw = 5;

  const frontY = torsoY + 1 + Math.round(frontArmDY);
  const backY  = torsoY + 1 + Math.round(backArmDY);

  // Back arm (shadow, drawn before torso is on top)
  const backAX = torsoX + 4;
  fillRect(ctx, clothingColors.shadow, backAX, backY, aw, sleeveH);
  fillRect(ctx, skinColors.shadow,     backAX, backY + sleeveH, aw, handH);
  outlineRect(ctx, clothingColors.outline, backAX, backY, aw, sleeveH + handH);

  // Front arm (full detail)
  const frontAX = torsoX - 7;
  fillRect(ctx, clothingColors.base, frontAX, frontY, aw, sleeveH);
  vLine(ctx, clothingColors.highlight, frontAX,     frontY, sleeveH);
  vLine(ctx, clothingColors.shadow,    frontAX + aw - 1, frontY, sleeveH);
  outlineRect(ctx, clothingColors.outline, frontAX, frontY, aw, sleeveH);
  fillRect(ctx, skinColors.base, frontAX, frontY + sleeveH, aw, handH);
  vLine(ctx, skinColors.highlight, frontAX, frontY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, frontAX, frontY + sleeveH, aw, handH);
}

// ---------------------------------------------------------------------------
// Legacy aliases (used by DemonCharacter.js which imports older names)
// ---------------------------------------------------------------------------

function drawShoe(ctx, shoeColors, x, y, w, h) {
  fillRect(ctx, shoeColors.base, x, y, w, h);
  hLine(ctx, shoeColors.highlight, x + 1, y, w - 3);
  hLine(ctx, shoeColors.shadow,    x,     y + h - 1, w);
  outlineRect(ctx, shoeColors.outline, x, y, w, h);
}

function drawLeg(ctx, pantColors, x, y, w, h) {
  fillRect(ctx, pantColors.base, x, y, w, h);
  vLine(ctx, pantColors.highlight, x + 1, y, h);
  vLine(ctx, pantColors.shadow,    x + w - 2, y, h);
  outlineRect(ctx, pantColors.outline, x, y, w, h);
}

function drawBelt(ctx, beltColors, x, y, w, h) {
  fillRect(ctx, beltColors.base, x, y, w, h);
  const bx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, beltColors.buckle, bx, y, 3, h);
  outlineRect(ctx, beltColors.outline, x, y, w, h);
}

// drawTorso kept for legacy DemonCharacter usage
function drawTorso(ctx, clothingKey, clothingColors, x, y, w, h) {
  drawTorsoSouth(ctx, clothingKey, clothingColors, x, y, w, h);
}

function drawArm(ctx, clothingColors, skinColors, x, y, w, h) {
  const sleeveH = Math.floor(h * 0.7);
  const handH   = h - sleeveH;
  fillRect(ctx, clothingColors.base, x, y, w, sleeveH);
  vLine(ctx, clothingColors.highlight, x + 1, y, sleeveH);
  vLine(ctx, clothingColors.shadow,    x + w - 2, y, sleeveH);
  outlineRect(ctx, clothingColors.outline, x, y, w, sleeveH);
  fillRect(ctx, skinColors.base, x, y + sleeveH, w, handH);
  vLine(ctx, skinColors.highlight, x + 1, y + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, x, y + sleeveH, w, handH);
}

function drawNeck(ctx, skinColors, x, y, w, h) {
  fillRect(ctx, skinColors.base, x, y, w, h);
  vLine(ctx, skinColors.highlight, x + 1, y, h);
  vLine(ctx, skinColors.shadow,    x + w - 2, y, h);
  outlineRect(ctx, skinColors.outline, x, y, w, h);
}

function drawHeadSide(ctx, skinColors, hairColors, hairStyle, facingRight) {
  // For legacy demon west view compatibility, delegate to drawHeadWest
  // (always faces left in west view; facingRight is handled by mirror)
  drawHeadWest(ctx, skinColors, hairColors, hairStyle);
}

module.exports = {
  drawGroundShadow,
  drawHeadSouth,
  drawHeadNorth,
  drawHeadWest,
  drawHeadSide,
  drawHairSouth,
  drawNeckSouth,
  drawTorsoSouth,
  drawJacketSouth,
  drawHoodieSouth,
  drawApronSouth,
  drawTorsoWest,
  drawBeltSouth,
  drawBeltWest,
  drawLegsSouth,
  drawLegsWest,
  drawShoesSouth,
  drawShoesWest,
  drawArmsSouth,
  drawArmsWest,
  // legacy exports used by DemonCharacter.js
  drawShoe,
  drawLeg,
  drawBelt,
  drawTorso,
  drawArm,
  drawNeck,
};
