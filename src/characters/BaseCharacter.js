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
  const cx = Math.floor(x + w / 2);

  // ── Row-by-row organic silhouette ─────────────────────────────────────────
  // 1px-per-row taper so silhouette edge is a true diagonal (no staircase bands).
  // With x=23, w=18: shoulder lx=22 rx=41 (20px), waist 12px, hip back to 20px.
  const shapeRows = [
    [0, 0],              // row  0: 20px  shoulder
    [0, 0],              // row  1: 20px  (hold 1 row so shoulder reads as a ledge)
    [1,-1],              // row  2: 18px
    [2,-2],              // row  3: 16px
    [3,-3],              // row  4: 14px
    [4,-4],              // row  5: 12px  waist
    [4,-4],              // row  6: 12px
    [4,-4],              // row  7: 12px
    [3,-3],              // row  8: 14px
    [2,-2],              // row  9: 16px
    [1,-1],              // row 10: 18px
    [0, 0],              // row 11: 20px  hip
    [0, 0],              // row 12: 20px
    [0, 0],              // row 13: 20px
    [0, 0],              // row 14: 20px
    [0, 0],              // row 15: 20px
    [0, 0],              // row 16: 20px
    [0, 0],              // row 17: 20px
    [0, 0],              // row 18: 20px
  ];
  const numRows = Math.min(h, shapeRows.length);

  // Fill
  for (let row = 0; row < numRows; row++) {
    const [dl, dr] = shapeRows[row];
    const lx = (x - 1) + dl, rx = (x + w) + dr;
    hLine(ctx, colors.base, lx, y + row, rx - lx + 1);
  }

  // Shading: highlight left 1-2 cols + center chest strip, shadow right 2 cols
  for (let row = 0; row < numRows; row++) {
    const [dl, dr] = shapeRows[row];
    const lx = (x - 1) + dl, rx = (x + w) + dr;
    const midX = Math.floor((lx + rx) / 2);
    px(ctx, colors.highlight, lx + 1, y + row);
    if (row < 6) px(ctx, colors.highlight, lx + 2, y + row);  // upper chest wider
    px(ctx, colors.highlight, midX, y + row);                   // center column
    px(ctx, colors.shadow, rx - 1, y + row);
    px(ctx, colors.shadow, rx - 2, y + row);
  }
  // Bottom-edge shadow band
  const [dlB, drB] = shapeRows[numRows - 1];
  hLine(ctx, colors.shadow, (x-1)+dlB+1, y+numRows-2, (x+w)+drB-1 - ((x-1)+dlB+1) + 1);

  // ── Armpit crease only — no rectangular meld platform ────────────────────
  // A single shadow pixel at each armpit hints at the concave junction.
  px(ctx, colors.shadow, x - 1, y - 1);    // armpit left
  px(ctx, colors.shadow, x + w, y - 1);    // armpit right

  // ── V-Collar / Lapels ─────────────────────────────────────────────────────
  const shirtCol = colors.collar || colors.highlight;
  fillRect(ctx, shirtCol, cx - 3, y, 6, 8);
  for (let dy = 0; dy < 8; dy++) {
    const lapelW = Math.round(dy * 0.45);
    fillRect(ctx, colors.base, cx - 3,          y + dy, lapelW + 1, 1);
    fillRect(ctx, colors.base, cx + 2 - lapelW, y + dy, lapelW + 1, 1);
  }
  for (let dy = 1; dy < 7; dy++) {
    px(ctx, colors.shadow, cx - 3 + Math.round(dy * 0.45), y + dy);
    px(ctx, colors.shadow, cx + 2 - Math.round(dy * 0.45), y + dy);
  }

  // ── Outline: selout on sides (shadow), black only top + bottom ────────────
  hLine(ctx, colors.outline, x - 1, y, w + 2);     // top edge (shoulder width) — black
  for (let row = 1; row < numRows - 1; row++) {
    const [dl, dr] = shapeRows[row];
    px(ctx, colors.shadow, (x - 1) + dl, y + row); // left edge — selout (shadow, not black)
    px(ctx, colors.shadow, (x + w) + dr, y + row); // right edge — selout
  }
  // Bottom edge — black
  const botL = (x - 1) + dlB, botR = (x + w) + drB;
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
}

function drawHoodieSouth(ctx, colors, x, y, w, h) {
  // Organic silhouette — baggier than jacket (waist not as narrow)
  const shapeRows = [
    [0, 0],   // row  0: 20px shoulder
    [0, 0],   // row  1: 20px
    [1,-1],   // row  2: 18px
    [2,-2],   // row  3: 16px
    [3,-3],   // row  4: 14px waist
    [3,-3],   // row  5: 14px
    [3,-3],   // row  6: 14px
    [2,-2],   // row  7: 16px
    [1,-1],   // row  8: 18px
    [0, 0],   // row  9: 20px hip
    [0, 0],   // row 10: 20px
    [0, 0],   // row 11: 20px
    [0, 0],   // row 12: 20px
    [0, 0],   // row 13: 20px
    [0, 0],   // row 14: 20px
    [0, 0],   // row 15: 20px
    [0, 0],   // row 16: 20px
    [0, 0],   // row 17: 20px
    [0, 0],   // row 18: 20px
  ];
  const numRows = Math.min(h, shapeRows.length);

  // Fill
  for (let row = 0; row < numRows; row++) {
    const [dl, dr] = shapeRows[row];
    const lx = (x - 1) + dl, rx = (x + w) + dr;
    hLine(ctx, colors.base, lx, y + row, rx - lx + 1);
  }

  // Shading: highlight left 2 cols + center, shadow right 2 cols
  for (let row = 0; row < numRows; row++) {
    const [dl, dr] = shapeRows[row];
    const lx = (x - 1) + dl, rx = (x + w) + dr;
    const midX = Math.floor((lx + rx) / 2);
    px(ctx, colors.highlight, lx + 1, y + row);
    if (row < numRows >> 1) px(ctx, colors.highlight, lx + 2, y + row);
    px(ctx, colors.highlight, midX, y + row);      // center highlight
    px(ctx, colors.shadow, rx - 1, y + row);
    px(ctx, colors.shadow, rx - 2, y + row);
  }

  // Hood visible at top center
  const hoodX = x + Math.floor(w / 2) - 3;
  fillRect(ctx, colors.collar, hoodX, y, 6, 4);
  outlineRect(ctx, colors.outline, hoodX, y, 6, 4);

  // Kangaroo pocket at bottom center
  const pkx = x + Math.floor(w / 2) - 4;
  const pky = y + Math.floor(h * 0.58);
  const pkw = 8, pkh = Math.floor(h * 0.35);
  fillRect(ctx, colors.shadow, pkx, pky, pkw, pkh);
  outlineRect(ctx, colors.outline, pkx, pky, pkw, pkh);

  // Selout on sides, black on top+bottom
  hLine(ctx, colors.outline, x - 1, y, w + 2);    // top
  for (let row = 1; row < numRows - 1; row++) {
    const [dl, dr] = shapeRows[row];
    px(ctx, colors.shadow, (x - 1) + dl, y + row);
    px(ctx, colors.shadow, (x + w) + dr, y + row);
  }
  const [hDlB, hDrB] = shapeRows[numRows - 1];
  const hBotL = (x - 1) + hDlB, hBotR = (x + w) + hDrB;
  hLine(ctx, colors.outline, hBotL, y + numRows - 1, hBotR - hBotL + 1);  // bottom
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
  // Belt / hip band: now 16px wide at x=24 to match narrowed torso waist (x=25-38)
  const w = 16, h = 2;
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
  // Each leg: row-by-row shaping
  //   Rows 0-4 (thigh):   6px wide
  //   Rows 5-7 (knee):    7px wide on outer side (slight knee prominence)
  //   Rows 8-10 (shin):   6px wide
  //   Rows 11-12 (ankle): 5px wide (tapers to shoe)
  // Outer edges use selout (shadow) not black to soften the silhouette.
  const legH = 13;
  const lx = 25 + Math.round(lLegDX);
  const rx = 34 + Math.round(rLegDX);
  const y  = baseY;

  // Per-row widths: [leftOff, width] for left leg (offset from lx); right leg mirrors.
  // Left leg outer edge goes LEFT for knee prominence; right leg outer edge goes RIGHT.
  const rows = [
    [0, 6], [0, 6], [0, 6], [0, 6], [0, 6],  // rows 0-4: thigh 6px
    [-1, 7], [-1, 7], [-1, 7],                 // rows 5-7: knee  7px (outer extends 1px)
    [0, 6], [0, 6], [0, 6],                    // rows 8-10: shin 6px
    [0, 5], [0, 5],                             // rows 11-12: ankle 5px (inner edge steps in)
  ];

  for (let row = 0; row < legH; row++) {
    const [lo, lw] = rows[row];

    // ── Left leg ──────────────────────────────────────────────────────────────
    const llx = lx + lo;   // outer edge (extends left for knee)
    hLine(ctx, pantColors.base,      llx,      y + row, lw);
    px(ctx,   pantColors.highlight,  llx + 1,  y + row);            // front-face lit
    px(ctx,   pantColors.shadow,     llx + lw - 2, y + row);        // inner-thigh shadow
    // knee face brightness
    if (row >= 5 && row <= 7) px(ctx, pantColors.highlight, llx + 2, y + row);
    // selout outer edge (left side of left leg)
    px(ctx, pantColors.shadow, llx, y + row);
    // black inner edge (toward crotch gap)
    if (row > 0) px(ctx, pantColors.outline, llx + lw - 1, y + row);

    // ── Right leg ─────────────────────────────────────────────────────────────
    // Right leg outer edge extends RIGHT for knee
    const rrx = rx;
    const rrw = lw;
    const rrOuter = rrx + rrw - 1 + (lo < 0 ? -lo : 0);   // outer pixel
    const rrStart = rrOuter - rrw + 1;
    hLine(ctx, pantColors.base,      rrStart,  y + row, rrw);
    px(ctx,   pantColors.highlight,  rrStart + 1, y + row);
    px(ctx,   pantColors.shadow,     rrStart + rrw - 2, y + row);
    if (row >= 5 && row <= 7) px(ctx, pantColors.highlight, rrStart + 2, y + row);
    // selout outer edge (right side of right leg)
    px(ctx, pantColors.shadow, rrOuter, y + row);
    // black inner edge (toward crotch gap)
    if (row > 0) px(ctx, pantColors.outline, rrStart, y + row);
  }

  // Top outlines (selout top of each leg — 1 dark row at belt junction)
  hLine(ctx, pantColors.outline, lx, y, 6);
  hLine(ctx, pantColors.outline, rx, y, 6);
  // Bottom outlines
  hLine(ctx, pantColors.outline, lx, y + legH - 1, 5);
  hLine(ctx, pantColors.outline, rx, y + legH - 1, 5);

  // Crotch shadow: top 2px of gap between legs suggests depth/overlap
  const gapX = lx + 6;
  const gapW = rx - gapX;
  if (gapW > 0) {
    hLine(ctx, pantColors.shadow,  gapX, y,     gapW);
    hLine(ctx, pantColors.outline, gapX, y + 1, gapW);
  }
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
  // Row-by-row organic arm with shoulder-to-wrist taper:
  //   Rows 0-2:  5px — shoulder (widest, outer edge extends 1px outward)
  //   Rows 3-7:  4px — mid-arm
  //   Rows 8-10: 3px — wrist (narrowest, outer edge steps inward)
  // All edges use selout (shadow color) instead of black outline.
  // Center highlight per-row creates the cylinder/rounded illusion.
  // 3px front arms (research: front arms 3px, rear 2px at small sprite scale).
  // lx=20: inner edge of left arm at x=22 (= torso left outer edge), fills x=20-22.
  // rx=41: inner edge of right arm, fills x=41-43.
  const lx = 20, rx = 41;
  const baseY = 26;
  const baseAW = 3, sleeveH = 11, handH = 4;

  // Per-row shape: 0=normal width, -1=steps in (wrist taper)
  // No outward shoulder bulge — the shoulder aligns flush with the torso edge.
  // Arm tapers from 4px (shoulder/mid) to 3px (wrist) for a natural limb look.
  const bulge = [0, 0, 0, 0, 0, 0, 0, 0, -1, -1, -1];

  const lArmY = baseY + Math.round(lArmDY);
  const rArmY = baseY + Math.round(rArmDY);

  // ── Left arm ──────────────────────────────────────────────────────────────
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row] || 0;
    const rowLx = lx - b;         // outer edge: shoulder extends left, wrist steps right
    const rowW  = baseAW + b;     // 5px shoulder, 4px mid, 3px wrist
    hLine(ctx, clothingColors.base,      rowLx,             lArmY + row, rowW);
    px(ctx,   clothingColors.highlight,  rowLx + 1,         lArmY + row);        // inner-edge highlight
    if (rowW >= 4) px(ctx, clothingColors.highlight, rowLx + Math.floor(rowW / 2), lArmY + row); // center highlight
    px(ctx,   clothingColors.shadow,     rowLx + rowW - 1,  lArmY + row);        // inner shadow (selout blend)
    px(ctx,   clothingColors.shadow,     rowLx,             lArmY + row);        // outer edge — selout (not black)
  }
  hLine(ctx, clothingColors.shadow, lx - (bulge[sleeveH-1]||0), lArmY + sleeveH - 1, baseAW + (bulge[sleeveH-1]||0) - 1);

  // Left fist — slightly wider than sleeve (knuckle), rounded bottom corners
  const lhw = baseAW + 1;  // 5px
  const lhx = lx - 1;
  fillRect(ctx, skinColors.base, lhx, lArmY + sleeveH, lhw, handH);
  vLine(ctx, skinColors.highlight, lhx + 1, lArmY + sleeveH, handH);
  vLine(ctx, skinColors.shadow,    lhx + lhw - 2, lArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, lhx, lArmY + sleeveH, lhw, handH);
  // Round fist bottom corners
  erasePixel(ctx, lhx,         lArmY + sleeveH + handH - 1);
  erasePixel(ctx, lhx + lhw - 1, lArmY + sleeveH + handH - 1);
  px(ctx, skinColors.shadow, lhx,           lArmY + sleeveH + handH - 2);  // rounded side
  px(ctx, skinColors.shadow, lhx + lhw - 1, lArmY + sleeveH + handH - 2);

  // ── Right arm ─────────────────────────────────────────────────────────────
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row] || 0;
    const rowW = baseAW + b;
    hLine(ctx, clothingColors.base,      rx,                rArmY + row, rowW);
    px(ctx,   clothingColors.highlight,  rx + rowW - 2,     rArmY + row);        // inner-edge highlight
    if (rowW >= 4) px(ctx, clothingColors.highlight, rx + Math.floor(rowW / 2), rArmY + row); // center highlight
    px(ctx,   clothingColors.shadow,     rx,                rArmY + row);        // inner edge — selout
    px(ctx,   clothingColors.shadow,     rx + rowW - 1,     rArmY + row);        // outer edge — selout (not black)
  }
  hLine(ctx, clothingColors.shadow, rx + 1, rArmY + sleeveH - 1, baseAW + (bulge[sleeveH-1]||0) - 1);

  // Right fist
  const rhw = baseAW + 1;
  const rhx = rx;
  fillRect(ctx, skinColors.base, rhx, rArmY + sleeveH, rhw, handH);
  vLine(ctx, skinColors.highlight, rhx + rhw - 2, rArmY + sleeveH, handH);
  vLine(ctx, skinColors.shadow,    rhx + 1,        rArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, rhx, rArmY + sleeveH, rhw, handH);
  erasePixel(ctx, rhx,         rArmY + sleeveH + handH - 1);
  erasePixel(ctx, rhx + rhw - 1, rArmY + sleeveH + handH - 1);
  px(ctx, skinColors.shadow, rhx,           rArmY + sleeveH + handH - 2);
  px(ctx, skinColors.shadow, rhx + rhw - 1, rArmY + sleeveH + handH - 2);
}

// ---------------------------------------------------------------------------
// drawArmsWest
// ---------------------------------------------------------------------------

function drawArmsWest(ctx, clothingColors, skinColors, frontArmDY, backArmDY, torsoX, torsoY) {
  // 4px arms for west view — matching narrowed south-view arm width
  const sleeveH = 11, handH = 5, aw = 4;

  const frontY = torsoY + 1 + Math.round(frontArmDY);
  const backY  = torsoY + 1 + Math.round(backArmDY);

  // Back arm (shadow, drawn before torso is on top)
  const backAX = torsoX + 4;
  fillRect(ctx, clothingColors.shadow, backAX, backY, aw, sleeveH);
  fillRect(ctx, skinColors.shadow,     backAX, backY + sleeveH, aw, handH);
  outlineRect(ctx, clothingColors.outline, backAX, backY, aw, sleeveH + handH);

  // Front arm (full detail)
  const frontAX = torsoX - 6;
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
