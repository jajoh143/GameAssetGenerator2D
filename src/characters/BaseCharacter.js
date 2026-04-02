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
// drawHeadSouth  –  front-facing head, fixed at x=24, y=8  (16×14)
// ---------------------------------------------------------------------------

function drawHeadSouth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 24, HY = 8, HW = 16, HH = 14;
  const outline = '#111111';

  // ── Oval face shape ──────────────────────────────────────────────────────
  // Build an oval by varying row widths (hair covers top 6 rows, so face
  // visible from HY+6 downward).  Row widths widen toward cheeks then taper
  // to chin:  narrow(12) → full(14) → narrow-chin(12) → chin-tip(10)
  //
  //  HY+6  : 12px  x+2 … x+13
  //  HY+7-8: 14px  x+1 … x+14
  //  HY+9-11: 14px  x+1 … x+14  (widest – cheeks)
  //  HY+12 : 12px  x+2 … x+13
  //  HY+13 : 10px  x+3 … x+12  (chin)

  hLine(ctx, skinColors.base, HX + 2, HY + 6,  HW - 4);   // 12px top of face
  fillRect(ctx, skinColors.base, HX + 1, HY + 7,  HW - 2, 5); // 14px cheeks
  hLine(ctx, skinColors.base, HX + 2, HY + 12, HW - 4);   // 12px pre-chin
  hLine(ctx, skinColors.base, HX + 3, HY + 13, HW - 6);   // 10px chin

  // ── 4-level shading ──────────────────────────────────────────────────────
  // Forehead/left-cheek highlight (top-left area of face)
  fillRect(ctx, skinColors.highlight, HX + 2, HY + 7, 4, 3);
  hLine(ctx, skinColors.highlight,   HX + 3, HY + 6, 3);

  // Right-cheek mid-shadow
  vLine(ctx, skinColors.shadow, HX + HW - 3, HY + 7,  5);
  vLine(ctx, skinColors.shadow, HX + HW - 2, HY + 7,  4);

  // Chin / lower-face shadow
  hLine(ctx, skinColors.shadow, HX + 3, HY + 12, HW - 6);
  hLine(ctx, skinColors.shadow, HX + 4, HY + 13, HW - 8);

  // ── Oval outline ─────────────────────────────────────────────────────────
  // Top of face (hair-to-face boundary) — drawn over by hair, kept for clarity
  hLine(ctx, outline, HX + 2, HY + 6, HW - 4);
  // Left side
  px(ctx, outline, HX + 1, HY + 6);
  vLine(ctx, outline, HX + 1, HY + 7,  5);  // HY+7 to HY+11
  px(ctx, outline, HX + 2, HY + 12);
  px(ctx, outline, HX + 3, HY + 13);
  // Right side (mirror)
  px(ctx, outline, HX + HW - 2, HY + 6);
  vLine(ctx, outline, HX + HW - 2, HY + 7,  5);
  px(ctx, outline, HX + HW - 3, HY + 12);
  px(ctx, outline, HX + HW - 4, HY + 13);
  // Chin bottom
  hLine(ctx, outline, HX + 4, HY + 13, HW - 8);

  // ── Eyebrows (just above eyes) ───────────────────────────────────────────
  const browY = HY + 7;
  hLine(ctx, hairColors.base,   HX + 3, browY, 3);   // left brow
  px(ctx,   hairColors.shadow,  HX + 3, browY);       // left inner dark
  hLine(ctx, hairColors.base,   HX + 10, browY, 3);  // right brow
  px(ctx,   hairColors.shadow,  HX + 12, browY);      // right inner dark

  // ── Eyes  (2×2 each) ─────────────────────────────────────────────────────
  const eyeY = HY + 8;
  // whites
  fillRect(ctx, '#FFFFFF', HX + 3,  eyeY, 3, 2);
  fillRect(ctx, '#FFFFFF', HX + 10, eyeY, 3, 2);
  // iris / pupil
  px(ctx, '#5A3010', HX + 3,  eyeY + 1);
  px(ctx, '#1A0800', HX + 4,  eyeY + 1);
  px(ctx, '#5A3010', HX + 10, eyeY + 1);
  px(ctx, '#1A0800', HX + 11, eyeY + 1);
  // eye outlines
  outlineRect(ctx, outline, HX + 3,  eyeY, 3, 2);
  outlineRect(ctx, outline, HX + 10, eyeY, 3, 2);
  // eyelid shadow above eyes
  hLine(ctx, skinColors.shadow, HX + 3,  eyeY - 1, 3);
  hLine(ctx, skinColors.shadow, HX + 10, eyeY - 1, 3);

  // ── Nose ─────────────────────────────────────────────────────────────────
  const noseY = HY + 10;
  px(ctx, skinColors.shadow, HX + 6,  noseY + 1);  // left nostril
  px(ctx, skinColors.shadow, HX + 7,  noseY);
  px(ctx, skinColors.shadow, HX + 8,  noseY);
  px(ctx, skinColors.shadow, HX + 9,  noseY + 1);  // right nostril

  // ── Mouth ─────────────────────────────────────────────────────────────────
  const mouthY = HY + 12;
  px(ctx, skinColors.shadow, HX + 4,  mouthY);       // left corner
  hLine(ctx, '#C05050',      HX + 5,  mouthY, 2);    // left lip
  px(ctx, skinColors.shadow, HX + 7,  mouthY);       // center dip
  hLine(ctx, '#C05050',      HX + 8,  mouthY, 2);    // right lip
  px(ctx, skinColors.shadow, HX + 10, mouthY);       // right corner

  // ── Hair ─────────────────────────────────────────────────────────────────
  drawHairSouth(ctx, hairColors, hairStyle, HX, HY, HW);
}

// ---------------------------------------------------------------------------
// drawHairSouth
// ---------------------------------------------------------------------------

function drawHairSouth(ctx, hairColors, hairStyle, headX, headY, headW) {
  const outline = '#111111';

  // Top hair band (6px tall)
  fillRect(ctx, hairColors.base, headX, headY, headW, 6);
  // Highlight stripe
  hLine(ctx, hairColors.highlight, headX + 3, headY + 1, headW - 8);
  hLine(ctx, hairColors.highlight, headX + 2, headY + 2, headW - 6);
  // Lower hair-line shadow
  hLine(ctx, hairColors.shadow, headX, headY + 4, headW);
  hLine(ctx, hairColors.shadow, headX, headY + 5, headW);
  // Side strips (sideburns)
  vLine(ctx, hairColors.base, headX,           headY,      11);
  vLine(ctx, hairColors.base, headX + 1,       headY,      10);
  vLine(ctx, hairColors.base, headX + headW - 2, headY,    11);
  vLine(ctx, hairColors.base, headX + headW - 1, headY,    10);

  if (hairStyle === 'medium') {
    vLine(ctx, hairColors.base, headX,             headY + 10, 5);
    vLine(ctx, hairColors.base, headX + headW - 1, headY + 10, 5);
  } else if (hairStyle === 'long') {
    vLine(ctx, hairColors.base, headX,             headY + 10, 10);
    vLine(ctx, hairColors.base, headX + headW - 1, headY + 10, 10);
  }

  // Re-draw top outline over hair
  hLine(ctx, outline, headX, headY, headW);
  vLine(ctx, outline, headX,           headY, 6);
  vLine(ctx, outline, headX + headW - 1, headY, 6);
}

// ---------------------------------------------------------------------------
// drawHeadNorth  –  back of head, fixed at x=24, y=8
// ---------------------------------------------------------------------------

function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 24, HY = 8, HW = 16, HH = 14;
  const outline = '#111111';

  // Skin (neck area at bottom)
  fillRect(ctx, skinColors.base, HX + 2, HY + 10, HW - 4, 4);

  // Hair covers most of back
  fillRect(ctx, hairColors.base, HX, HY, HW, HH - 3);
  // Highlight stripe
  hLine(ctx, hairColors.highlight, HX + 3, HY + 1, HW - 8);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 2, HW - 6);
  // Shadow at hair bottom edge
  hLine(ctx, hairColors.shadow, HX, HY + HH - 5, HW);
  hLine(ctx, hairColors.shadow, HX, HY + HH - 4, HW);

  if (hairStyle === 'long') {
    fillRect(ctx, hairColors.base, HX + 1, HY + HH - 3, HW - 2, 5);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HH + 1, HW - 2);
  }

  outlineRect(ctx, outline, HX, HY, HW, HH);
}

// ---------------------------------------------------------------------------
// drawHeadWest  –  side profile facing LEFT, nose extends past x=19
// ---------------------------------------------------------------------------

function drawHeadWest(ctx, skinColors, hairColors, hairStyle) {
  // Profile: 12px wide, 14px tall
  // Head occupies x=20-31, y=8-21  (facing left, face at low-x end)
  const HX = 20, HY = 8, HW = 12, HH = 14;
  const outline = '#111111';

  // --- Skin fill ---
  fillRect(ctx, skinColors.base, HX, HY, HW, HH);
  // highlight on forehead/face side (left = facing side)
  fillRect(ctx, skinColors.highlight, HX, HY + 1, 4, 5);
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

  // --- Nose  y=13-14, extends past HX to x=19 ---
  px(ctx, skinColors.shadow, HX - 1, HY + 5);
  px(ctx, skinColors.base,   HX - 1, HY + 4);

  // --- Eye  y=12-13, x=20-21 ---
  const eyeY = HY + 4;
  fillRect(ctx, '#FFFFFF', HX, eyeY, 2, 2);
  px(ctx, '#1A0800', HX + 1, eyeY + 1);
  outlineRect(ctx, outline, HX, eyeY, 2, 2);

  // --- Eyebrow y=11, x=20-22 ---
  hLine(ctx, hairColors.base, HX, eyeY - 1, 3);

  // --- Mouth ---
  hLine(ctx, skinColors.shadow, HX, eyeY + 6, 2);
  px(ctx, '#D06060', HX + 1, eyeY + 7);

  // --- Hard outline ---
  outlineRect(ctx, outline, HX, HY, HW, HH);
  // nose protrusion outline
  px(ctx, outline, HX - 1, HY + 3);
  px(ctx, outline, HX - 1, HY + 6);

  // --- Hair ---
  // Top hair
  fillRect(ctx, hairColors.base, HX, HY, HW, 5);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 1, HW - 4);
  hLine(ctx, hairColors.shadow,    HX,     HY + 3, HW);
  hLine(ctx, hairColors.shadow,    HX,     HY + 4, HW);
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
  // neck: 8px wide x 3px, centered at x=28-35
  const NX = 28, NW = 8, NH = 3;
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

  // Main jacket body
  fillRect(ctx, colors.base, x, y, w, h);

  // ── Shoulder caps: 2-pixel extension on each side at top ──────────────────
  // These bridge the 1px gap between the torso edge and the arm rectangle,
  // making the shoulder-to-sleeve connection seamless.
  px(ctx, colors.base,    x - 1, y);         // left shoulder cap row 0
  px(ctx, colors.base,    x - 1, y + 1);     // left shoulder cap row 1
  px(ctx, colors.shadow,  x - 1, y + 2);     // left shoulder shadow
  px(ctx, colors.outline, x - 2, y);         // left shoulder outer outline
  px(ctx, colors.base,    x + w, y);         // right shoulder cap row 0
  px(ctx, colors.base,    x + w, y + 1);     // right shoulder cap row 1
  px(ctx, colors.shadow,  x + w, y + 2);     // right shoulder shadow
  px(ctx, colors.outline, x + w + 1, y);     // right shoulder outer outline

  // Left side highlight strip
  vLine(ctx, colors.highlight, x + 1, y + 1, h - 2);
  vLine(ctx, colors.highlight, x + 2, y + 1, h - 2);

  // Right side shadow strip
  vLine(ctx, colors.shadow, x + w - 2, y + 1, h - 2);
  vLine(ctx, colors.shadow, x + w - 3, y + 1, h - 2);

  // Bottom jacket edge darker line
  hLine(ctx, colors.shadow, x + 1, y + h - 2, w - 2);

  // ---- V-Collar / Lapels ----
  // Draw inner shirt in V area (x=29-34, y=y to y+8)
  const shirtCol = colors.collar || colors.highlight;
  fillRect(ctx, shirtCol, cx - 3, y, 6, 8);

  // Left lapel: overwrite shirt area with jacket color in triangular shape
  // lapel goes from (cx-3, y) diagonally to (cx-6, y+7)
  for (let dy = 0; dy < 8; dy++) {
    const lapelW = Math.round(dy * 0.45);
    // left lapel fill (jacket color over shirt area)
    fillRect(ctx, colors.base, cx - 3,          y + dy, lapelW + 1, 1);
    // right lapel fill
    fillRect(ctx, colors.base, cx + 2 - lapelW, y + dy, lapelW + 1, 1);
  }
  // Lapel shadow edge (left)
  for (let dy = 1; dy < 7; dy++) {
    const lx = cx - 3 + Math.round(dy * 0.45);
    px(ctx, colors.shadow, lx, y + dy);
  }
  // Lapel shadow edge (right)
  for (let dy = 1; dy < 7; dy++) {
    const rx = cx + 2 - Math.round(dy * 0.45);
    px(ctx, colors.shadow, rx, y + dy);
  }

  outlineRect(ctx, colors.outline, x, y, w, h);
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
  const w = 20, h = 2;
  fillRect(ctx, beltColors.base, x, y, w, h);
  // Buckle center
  const bx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, beltColors.buckle, bx, y, 3, h);
  outlineRect(ctx, beltColors.outline, x, y, w, h);
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
  // Each leg: 8px wide, 13px tall
  const legH = 13;
  const lx = 23 + Math.round(lLegDX);
  const rx = 33 + Math.round(rLegDX);
  const y  = baseY;

  // Left leg
  fillRect(ctx, pantColors.base, lx, y, 8, legH);
  vLine(ctx, pantColors.highlight, lx + 1, y, legH);
  vLine(ctx, pantColors.shadow,    lx + 6, y, legH);
  // Knee highlight (y+6)
  hLine(ctx, pantColors.highlight, lx + 2, y + 6, 2);
  outlineRect(ctx, pantColors.outline, lx, y, 8, legH);

  // Right leg
  fillRect(ctx, pantColors.base, rx, y, 8, legH);
  vLine(ctx, pantColors.highlight, rx + 1, y, legH);
  vLine(ctx, pantColors.shadow,    rx + 6, y, legH);
  hLine(ctx, pantColors.highlight, rx + 2, y + 6, 2);
  outlineRect(ctx, pantColors.outline, rx, y, 8, legH);
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
  // Left shoe: x=21-31 (11px wide, 4px tall)
  const lx = 21 + Math.round(lShoeDX);
  const rx = 33 + Math.round(rShoeDX);
  const y  = baseY;

  // Left shoe
  fillRect(ctx, shoeColors.base, lx, y, 11, 4);
  hLine(ctx, shoeColors.highlight, lx + 1, y,         9);
  hLine(ctx, shoeColors.shadow,    lx,     y + 3,     11);
  // Toe rounding (left side)
  px(ctx, shoeColors.shadow, lx, y);
  outlineRect(ctx, shoeColors.outline, lx, y, 11, 4);

  // Right shoe
  fillRect(ctx, shoeColors.base, rx, y, 11, 4);
  hLine(ctx, shoeColors.highlight, rx + 1, y,     9);
  hLine(ctx, shoeColors.shadow,    rx,     y + 3, 11);
  // Toe rounding (right side)
  px(ctx, shoeColors.shadow, rx + 10, y);
  outlineRect(ctx, shoeColors.outline, rx, y, 11, 4);
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
  // Arms are positioned so their inner edges overlap the torso shoulder-cap
  // pixels (x=20 left, x=43 right), eliminating the visible gap.
  // We skip the inner-edge outline on each arm so there's no dark seam line
  // where the arm meets the jacket shoulder.
  const lx = 12, rx = 43;
  const baseY = 27;
  const sleeveH = 12, handH = 6, aw = 9;

  const lArmY = baseY + Math.round(lArmDY);
  const rArmY = baseY + Math.round(rArmDY);

  // ── Left arm ──────────────────────────────────────────────────────────────
  fillRect(ctx, clothingColors.base, lx, lArmY, aw, sleeveH);
  vLine(ctx, clothingColors.highlight, lx + 1, lArmY,  sleeveH);
  vLine(ctx, clothingColors.shadow,    lx + aw - 2, lArmY, sleeveH);
  // Outline: top, left, bottom edges only (omit right/inner edge → no seam)
  hLine(ctx, clothingColors.outline, lx, lArmY, aw);           // top
  vLine(ctx, clothingColors.outline, lx, lArmY, sleeveH);      // left
  hLine(ctx, clothingColors.outline, lx, lArmY + sleeveH - 1, aw - 1); // bottom (not rightmost px)
  // Left hand
  fillRect(ctx, skinColors.base, lx, lArmY + sleeveH, aw, handH);
  vLine(ctx, skinColors.highlight, lx + 1, lArmY + sleeveH, handH);
  hLine(ctx, skinColors.outline, lx, lArmY + sleeveH, aw);                // top
  vLine(ctx, skinColors.outline, lx, lArmY + sleeveH, handH);             // left
  hLine(ctx, skinColors.outline, lx, lArmY + sleeveH + handH - 1, aw);   // bottom
  hLine(ctx, skinColors.outline, lx + aw - 1, lArmY + sleeveH, handH);   // right

  // ── Right arm ─────────────────────────────────────────────────────────────
  fillRect(ctx, clothingColors.base, rx, rArmY, aw, sleeveH);
  vLine(ctx, clothingColors.highlight, rx + 1, rArmY, sleeveH);
  vLine(ctx, clothingColors.shadow,    rx + aw - 2, rArmY, sleeveH);
  // Outline: top, right, bottom edges only (omit left/inner edge → no seam)
  hLine(ctx, clothingColors.outline, rx, rArmY, aw);                     // top
  vLine(ctx, clothingColors.outline, rx + aw - 1, rArmY, sleeveH);       // right
  hLine(ctx, clothingColors.outline, rx + 1, rArmY + sleeveH - 1, aw - 1); // bottom
  // Right hand
  fillRect(ctx, skinColors.base, rx, rArmY + sleeveH, aw, handH);
  vLine(ctx, skinColors.highlight, rx + 1, rArmY + sleeveH, handH);
  hLine(ctx, skinColors.outline, rx, rArmY + sleeveH, aw);                // top
  vLine(ctx, skinColors.outline, rx + aw - 1, rArmY + sleeveH, handH);   // right
  hLine(ctx, skinColors.outline, rx, rArmY + sleeveH + handH - 1, aw);   // bottom
  vLine(ctx, skinColors.outline, rx, rArmY + sleeveH, handH);             // left
}

// ---------------------------------------------------------------------------
// drawArmsWest
// ---------------------------------------------------------------------------

function drawArmsWest(ctx, clothingColors, skinColors, frontArmDY, backArmDY, torsoX, torsoY) {
  // frontArm is to the LEFT of the torso (x=13-20)
  // backArm is to the RIGHT / partially behind torso (x=24-31)
  const sleeveH = 12, handH = 5, aw = 7;

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
