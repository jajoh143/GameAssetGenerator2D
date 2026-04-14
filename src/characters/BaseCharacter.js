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

function drawGroundShadow(ctx, cx, y, w=14, h=3) {
  fillEllipse(ctx, Colors.GROUND_SHADOW, cx, y, w, h);
}

// ---------------------------------------------------------------------------
// drawHeadSouth  –  front-facing head, fixed at x=22, y=5  (20×21)
// ---------------------------------------------------------------------------

function drawHeadSouth(ctx, skinColors, hairColors, hairStyle, eyeColors) {
  // Default eye colors if not provided (backwards-compat)
  eyeColors = eyeColors || { iris: '#7B4820', pupil: '#160800', lash: '#2A1800' };
  // 96px head: HX=34, HY=5, HW=28. Center x=48. Pushed down to meet neck at y=32.
  const HX = 34, HY = 5, HW = 28;
  const outline = '#111111';

  // ── Oval face shape (max 25px wide, gradual taper to rounded chin) ────────
  const FACE = [
    [39, 18],  // HY+10: forehead top
    [38, 20],  // HY+11: forehead
    [37, 22],  // HY+12: temples
    [36, 24],  // HY+13: upper cheeks
    [36, 25],  // HY+14: widest
    [36, 25],  // HY+15: widest
    [36, 25],  // HY+16: widest
    [36, 24],  // HY+17: taper begins
    [37, 23],  // HY+18: jaw
    [37, 22],  // HY+19: jaw
    [38, 20],  // HY+20: lower jaw
    [39, 18],  // HY+21: lower jaw
    [40, 17],  // HY+22: pre-chin
    [40, 16],  // HY+23: pre-chin
    [41, 15],  // HY+24: chin (matches neck width)
    [41, 14],  // HY+25: chin taper
    [42, 13],  // HY+26: chin bottom
  ];
  for (let i = 0; i < FACE.length; i++) {
    hLine(ctx, skinColors.base, FACE[i][0], HY + 10 + i, FACE[i][1]);
  }

  // ── Face sphere shading (light from upper-left) ───────────────────────────
  fillRect(ctx, skinColors.highlight, 37, HY + 11, 4, 3);
  hLine(ctx, skinColors.highlight, 38, HY + 10, 3);
  // Edge shadow (right outer edge)
  vLine(ctx, skinColors.shadow, 58, HY + 13, 7);
  vLine(ctx, skinColors.shadow, 59, HY + 13, 5);
  px(ctx, skinColors.shadow, 60, HY + 14);
  px(ctx, skinColors.shadow, 60, HY + 15);

  // ── Oval outline (generated from silhouette) ─────────────────────────────
  for (let i = 0; i < FACE.length; i++) {
    const [fx, fw] = FACE[i];
    const y = HY + 10 + i;
    px(ctx, outline, fx, y);            // left edge
    px(ctx, outline, fx + fw - 1, y);   // right edge
  }
  // Chin bottom
  hLine(ctx, outline, FACE[FACE.length - 1][0], HY + 10 + FACE.length, FACE[FACE.length - 1][1]);

  // ── Eyebrows (subtle 3px lines) ───────────────────────────────────────────
  const browY = HY + 13;
  hLine(ctx, hairColors.shadow, 42, browY, 3);   // left brow
  hLine(ctx, hairColors.shadow, 50, browY, 3);   // right brow

  // ── Eyes: minimal dot style (3×2 dark blocks) ───────────────────────────
  const eyeY = HY + 15;

  // Left eye (x=42-44, 2 rows)
  fillRect(ctx, eyeColors.iris, 42, eyeY, 3, 2);
  px(ctx, '#FFFFFF',            42, eyeY);        // shine upper-left

  // Right eye (x=50-52, 2 rows)
  fillRect(ctx, eyeColors.iris, 50, eyeY, 3, 2);
  px(ctx, '#FFFFFF',            52, eyeY);        // shine upper-right

  // ── Nose: single subtle shadow pixel ─────────────────────────────────────
  px(ctx, skinColors.shadow, 48, HY + 22);

  // ── Mouth: subtle shadow line ────────────────────────────────────────────
  hLine(ctx, skinColors.shadow, 46, HY + 25, 4);

  // ── Hair ─────────────────────────────────────────────────────────────────
  drawHairSouth(ctx, hairColors, hairStyle, HX, HY, HW);
}

// ---------------------------------------------------------------------------
// drawHairSouth
// ---------------------------------------------------------------------------

function drawHairSouth(ctx, hairColors, hairStyle, headX, headY, headW) {
  const outline = '#111111';

  // ── Hair dome — rounded shape with volume extending beyond head ──────────
  // [offset from headX, width] — dome extends 2px past head on each side
  const hw = headW;
  const DOME = [
    [4,  hw - 8],    // row 0: crown top (narrow)
    [2,  hw - 4],    // row 1: widening
    [0,  hw],        // row 2: matches head width
    [-1, hw + 2],    // row 3: 1px overhang each side
    [-2, hw + 4],    // row 4: max volume
    [-2, hw + 4],    // row 5: max volume
    [-2, hw + 4],    // row 6: max volume
    [-1, hw + 2],    // row 7: transition
    [0,  hw],        // row 8: hairline approaches face
    [0,  hw],        // row 9: hairline meets face
  ];

  for (let r = 0; r < DOME.length; r++) {
    const [off, w] = DOME[r];
    hLine(ctx, hairColors.base, headX + off, headY + r, w);
  }

  // Round crown corners
  erasePixel(ctx, headX + 4, headY);
  erasePixel(ctx, headX + 4 + DOME[0][1] - 1, headY);
  px(ctx, hairColors.shadow, headX + 4, headY);
  px(ctx, hairColors.shadow, headX + 4 + DOME[0][1] - 1, headY);

  // Crown highlight arc (follows dome curve)
  hLine(ctx, hairColors.highlight, headX + 4, headY + 1, DOME[1][1] - 6);
  px(ctx, hairColors.highlight, headX + Math.floor(hw / 2), headY);
  hLine(ctx, hairColors.highlight, headX + 2, headY + 2, DOME[2][1] - 6);

  // Directional strand texture (flowing, not grid)
  for (let r = 3; r <= 6; r++) {
    const [off, w] = DOME[r];
    const shift = (r - 3) * 2;
    for (let dx = 3 + shift; dx < w - 3; dx += 6) {
      px(ctx, hairColors.shadow, headX + off + dx, headY + r);
    }
  }

  // Hairline transition (gradual shadow)
  hLine(ctx, hairColors.shadow, headX - 1, headY + 7, hw + 2);
  hLine(ctx, hairColors.shadow, headX, headY + 8, hw);
  hLine(ctx, hairColors.shadow, headX, headY + 9, hw);

  // ── Sideburns — tapered shapes that flow naturally ───────────────────────
  // Helper: draw a sideburn pair for one row
  function drawSideburnRow(y, w, col) {
    // Left sideburn
    for (let i = 0; i < w; i++) {
      px(ctx, i === w - 1 ? hairColors.shadow : col, headX + i, y);
    }
    // Right sideburn
    for (let i = 0; i < w; i++) {
      px(ctx, i === 0 ? hairColors.shadow : col, headX + headW - 1 - i, y);
    }
  }

  // Base sideburns (all styles get these — from dome to ear level)
  const sbStart = headY;
  // Sideburn widths taper: 3 at top, 2 mid-face, 1 at bottom
  const shortRows = [3,3,3,3,3,3,3,3,3,3,  // rows 0-9 (dome area)
                     3,3,2,2,2,2,2,2,2,1,1,1,1,1]; // rows 10-23 (face area, taper)
  const shortEnd = sbStart + shortRows.length;

  for (let i = 0; i < shortRows.length; i++) {
    drawSideburnRow(sbStart + i, shortRows[i], hairColors.base);
  }
  // Fade last 3 rows to shadow
  for (let i = Math.max(0, shortRows.length - 3); i < shortRows.length; i++) {
    drawSideburnRow(sbStart + i, shortRows[i], hairColors.shadow);
  }

  if (hairStyle === 'medium') {
    // Extend sideburns with tapering
    const extRows = [2,2,2,2,1,1,1,1];
    for (let i = 0; i < extRows.length; i++) {
      const col = i >= extRows.length - 3 ? hairColors.shadow : hairColors.base;
      drawSideburnRow(shortEnd + i, extRows[i], col);
    }
  } else if (hairStyle === 'long') {
    // Longer extension with gradual taper
    const extRows = [2,2,2,2,2,2,2,2,2,1,1,1,1,1,1];
    for (let i = 0; i < extRows.length; i++) {
      const col = i >= extRows.length - 4 ? hairColors.shadow : hairColors.base;
      drawSideburnRow(shortEnd + i, extRows[i], col);
    }
  } else if (hairStyle === 'curly') {
    // Medium-length with puffed outer edge
    const extRows = [2,2,2,2,2,1,1,1];
    for (let i = 0; i < extRows.length; i++) {
      const col = i >= extRows.length - 3 ? hairColors.shadow : hairColors.base;
      drawSideburnRow(shortEnd + i, extRows[i], col);
    }
    // Puff pixels outside sideburns (alternating tones)
    for (let cy = headY + 10; cy < shortEnd + extRows.length; cy++) {
      const tone = (cy % 2 === 0) ? hairColors.highlight : hairColors.shadow;
      px(ctx, tone, headX - 1, cy);
      px(ctx, tone, headX + headW, cy);
    }
    // Blend puff into dome
    px(ctx, hairColors.base, headX - 1, headY + 9);
    px(ctx, hairColors.base, headX + headW, headY + 9);
  } else if (hairStyle === 'undercut') {
    // Very short sideburns — erase below row 12
    const ucEnd = headY + 12;
    for (let tipY = ucEnd; tipY < shortEnd; tipY++) {
      for (let dx = 0; dx < 3; dx++) {
        erasePixel(ctx, headX + dx, tipY);
        erasePixel(ctx, headX + headW - 1 - dx, tipY);
      }
    }
    hLine(ctx, hairColors.shadow, headX, ucEnd, 2);
    hLine(ctx, hairColors.shadow, headX + headW - 2, ucEnd, 2);
    // Flat-top highlights
    hLine(ctx, hairColors.highlight, headX + 2, headY + 4, headW - 4);
    hLine(ctx, hairColors.highlight, headX + 2, headY + 5, headW - 5);
  }

  // ── Dome outline ─────────────────────────────────────────────────────────
  // Sel-out: soften dome edges with hair shadow
  for (let r = 0; r < DOME.length; r++) {
    const [off, w] = DOME[r];
    px(ctx, hairColors.shadow, headX + off, headY + r);
    px(ctx, hairColors.shadow, headX + off + w - 1, headY + r);
  }
  // Top outline
  hLine(ctx, outline, headX + 5, headY, DOME[0][1] - 2);
}

// ---------------------------------------------------------------------------
// drawHeadNorth  –  back of head, fixed at x=22, y=5  (20×18)
// ---------------------------------------------------------------------------

function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  // 96px head: HX=34, HY=5, HW=28, HH=28
  const HX = 34, HY = 5, HW = 28, HH = 28;
  const outline = '#111111';

  // Skin at neck/lower-back area
  fillRect(ctx, skinColors.base, HX + 3, HY + 18, HW - 6, 10);

  // ── Hair dome (back view — same dome shape as south) ─────────────────────
  const DOME = [
    [4,  HW - 8],    // row 0: crown top
    [2,  HW - 4],    // row 1
    [0,  HW],        // row 2: matches head width
    [-1, HW + 2],    // row 3: 1px overhang
    [-2, HW + 4],    // row 4: max volume
    [-2, HW + 4],    // row 5
    [-2, HW + 4],    // row 6
    [-1, HW + 2],    // row 7
    [0,  HW],        // row 8
    [0,  HW],        // row 9
  ];

  // Draw dome
  for (let r = 0; r < DOME.length; r++) {
    const [off, w] = DOME[r];
    hLine(ctx, hairColors.base, HX + off, HY + r, w);
  }

  // Hair below dome (rows 10-20)
  fillRect(ctx, hairColors.base, HX, HY + 10, HW, HH - 17);

  // Highlight arcs
  hLine(ctx, hairColors.highlight, HX + 4, HY + 1, HW - 10);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 2, HW - 8);
  px(ctx, hairColors.highlight, HX + Math.floor(HW / 2), HY);

  // Strand texture
  for (let r = 3; r <= 6; r++) {
    const [off, w] = DOME[r];
    const shift = (r - 3) * 2;
    for (let dx = 3 + shift; dx < w - 3; dx += 6) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
  }

  // Shadow at bottom of hair area
  hLine(ctx, hairColors.shadow, HX, HY + HH - 8, HW);
  hLine(ctx, hairColors.shadow, HX, HY + HH - 7, HW);

  if (hairStyle === 'long') {
    fillRect(ctx, hairColors.base, HX + 1, HY + HH - 6, HW - 2, 6);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HH - 3, HW - 2);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HH - 2, HW - 2);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HH - 1, HW - 2);
  }

  // Dome outline
  for (let r = 0; r < DOME.length; r++) {
    const [off, w] = DOME[r];
    px(ctx, outline, HX + off, HY + r);
    px(ctx, outline, HX + off + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + 5, HY, DOME[0][1] - 2);
  // Below dome: standard rect outline for sides and bottom
  vLine(ctx, outline, HX, HY + 10, HH - 10);
  vLine(ctx, outline, HX + HW - 1, HY + 10, HH - 10);
  hLine(ctx, outline, HX, HY + HH - 1, HW);
}

// ---------------------------------------------------------------------------
// drawHeadWest  –  side profile facing LEFT, nose extends past HX
// ---------------------------------------------------------------------------

function drawHeadWest(ctx, skinColors, hairColors, hairStyle) {
  // 96px profile head: HX=31, HY=5. 29 rows. Width up to 17px.
  const HX = 31, HY = 5;
  const outline = '#111111';

  const S = [
    [3, 11],  //  0  dome top
    [2, 13],  //  1  upper dome
    [1, 15],  //  2  dome edge
    [0, 17],  //  3  forehead
    [0, 17],  //  4
    [0, 17],  //  5
    [0, 17],  //  6
    [0, 17],  //  7
    [0, 17],  //  8
    [0, 17],  //  9
    [0, 17],  // 10  eyebrow row
    [0, 17],  // 11
    [0, 17],  // 12  eye row
    [0, 17],  // 13
    [0, 17],  // 14
    [0, 17],  // 15  nose / ear
    [0, 17],  // 16
    [0, 17],  // 17
    [0, 17],  // 18
    [0, 17],  // 19  jaw widest
    [0, 16],  // 20  jaw taper
    [1, 14],  // 21
    [2, 12],  // 22
    [3, 10],  // 23
    [4,  8],  // 24
    [5,  7],  // 25
    [6,  6],  // 26
    [7,  5],  // 27
    [8,  4],  // 28  chin bottom
  ];
  const HH = S.length;  // 29

  // ── Skin fill ─────────────────────────────────────────────────────────────
  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    hLine(ctx, skinColors.base, HX + xo, HY + r, w);
  }

  // ── Form shading ──────────────────────────────────────────────────────────
  for (let r = 3; r <= 19; r++) {
    const [xo] = S[r];
    px(ctx, skinColors.highlight, HX + xo + 1, HY + r);
    if (r <= 9) px(ctx, skinColors.highlight, HX + xo + 2, HY + r);
  }
  for (let r = 3; r <= 20; r++) {
    const [xo, w] = S[r];
    px(ctx, skinColors.shadow, HX + xo + w - 2, HY + r);
    px(ctx, skinColors.shadow, HX + xo + w - 3, HY + r);
  }
  for (let r = 24; r < HH; r++) {
    const [xo, w] = S[r];
    hLine(ctx, skinColors.shadow, HX + xo + 1, HY + r, Math.max(1, w - 2));
  }

  // ── Face features ─────────────────────────────────────────────────────────
  hLine(ctx, hairColors.shadow, HX, HY + 10, 3);
  px(ctx, '#FFFFFF', HX,     HY + 12);
  px(ctx, '#1A0800', HX + 1, HY + 12);
  px(ctx, skinColors.shadow, HX - 1, HY + 15);
  px(ctx, skinColors.shadow, HX, HY + 20);
  // Ear at rows 15-18
  px(ctx, skinColors.shadow,    HX + 12, HY + 15);
  px(ctx, skinColors.highlight, HX + 11, HY + 16);
  px(ctx, skinColors.highlight, HX + 10, HY + 17);
  px(ctx, skinColors.shadow,    HX + 12, HY + 18);

  // ── Hair — top dome rows 0-9 ──────────────────────────────────────────────
  for (let r = 0; r <= 9; r++) {
    const [xo, w] = S[r];
    hLine(ctx, hairColors.base, HX + xo, HY + r, w);
  }
  hLine(ctx, hairColors.highlight, HX + S[1][0] + 3, HY + 1, Math.max(1, S[1][1] - 7));
  hLine(ctx, hairColors.highlight, HX + 3, HY + 2, 7);
  hLine(ctx, hairColors.shadow, HX + S[8][0], HY + 8, S[8][1]);
  hLine(ctx, hairColors.shadow, HX + S[9][0], HY + 9, S[9][1]);

  // Back-of-head hair strip (2px wide)
  const backHairEnd = hairStyle === 'short' ? 19 : hairStyle === 'medium' ? 24 : HH;
  for (let r = 0; r < backHairEnd; r++) {
    const [xo, w] = S[r];
    if (w >= 3) px(ctx, hairColors.shadow, HX + xo + w - 3, HY + r);
    px(ctx, hairColors.base, HX + xo + w - 2, HY + r);
    px(ctx, hairColors.base, HX + xo + w - 1, HY + r);
  }
  {
    const [xo, w] = S[1];
    px(ctx, hairColors.highlight, HX + xo + w - 2, HY + 1);
  }
  if (hairStyle === 'long') {
    const [lxo, lw] = S[HH - 1];
    const bx = HX + lxo + lw - 1;
    vLine(ctx, hairColors.base,  bx,     HY + HH, 6);
    vLine(ctx, hairColors.base,  bx - 1, HY + HH, 4);
    px(ctx, hairColors.shadow,   bx - 1, HY + HH + 4);
    px(ctx, hairColors.shadow,   bx,     HY + HH + 5);
  }

  // ── Outline ───────────────────────────────────────────────────────────────
  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    px(ctx, outline, HX + xo,         HY + r);
    px(ctx, outline, HX + xo + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + S[0][0], HY, S[0][1]);
  hLine(ctx, outline, HX + S[HH-1][0], HY + HH - 1, S[HH-1][1]);
  px(ctx, outline, HX - 1, HY + 14);
  px(ctx, outline, HX - 1, HY + 16);
  // Re-draw hair dome outline
  for (let r = 0; r <= 9; r++) {
    const [xo, w] = S[r];
    px(ctx, outline, HX + xo,         HY + r);
    px(ctx, outline, HX + xo + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + S[0][0], HY, S[0][1]);
}

// ---------------------------------------------------------------------------
// drawNeckSouth
// ---------------------------------------------------------------------------

function drawNeckSouth(ctx, skinColors, baseY) {
  // neck scaled ×1.5: 15px wide × 3px, centered at x=41-55 (center=48)
  const NX = 41, NW = 15, NH = 3;
  fillRect(ctx, skinColors.base, NX, baseY, NW, NH);
  vLine(ctx, skinColors.highlight, NX + 1, baseY, NH);
  vLine(ctx, skinColors.shadow,    NX + NW - 2, baseY, NH);
  outlineRect(ctx, skinColors.outline, NX, baseY, NW, NH);
}

// ---------------------------------------------------------------------------
// Jacket / Hoodie / Apron  (South)
// ---------------------------------------------------------------------------

function drawJacketSouth(ctx, colors, x, y, w, h) {
  // SNES RPG body structure — organic hourglass silhouette:
  //   Rows 0-2  (shoulder): 20px  lx=22  rx=41  (shoulder cap)
  //   Rows 3-6  (chest):    18px  lx=23  rx=40
  //   Rows 7-11 (waist):    16px  lx=24  rx=39  ← taper -1px each side
  //   Rows 12+  (hips):     18px  lx=23  rx=40  ← flare back out
  //
  // DIRECTIONAL form shading (light from upper-left):
  //   Left panel: highlight on 2nd pixel → lit face of cylinder
  //   Right panel: 2px shadow strip → shadow face
  //   Waist: shadow on inset pixels to sell the pull-in
  //   Shirt: center column highlight for shirt-front volume

  const cx = Math.floor(x + w / 2);   // = 48 at 96px
  const numRows = Math.min(h, 28);
  const SHOULDER = 4;
  const WAIST_S = 10, WAIST_E = 16;   // waist taper row range (scaled ×1.5)

  const rl = (row) => {
    if (row < SHOULDER)                       return x - 1;
    if (row >= WAIST_S && row <= WAIST_E)    return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)                       return x + w;
    if (row >= WAIST_S && row <= WAIST_E)    return x + w - 2;
    return x + w - 1;
  };

  // ── 1. Fill jacket base ──────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional form shading ──────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    const isShoulderRow = row < SHOULDER;
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (isShoulderRow) px(ctx, colors.highlight, rl(row) + 2, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }

  // ── 3. Fold shadow notches ───────────────────────────────────────────────
  const shirtW = 12, shirtLx = cx - 6;   // shirt x=42-53 at 96px
  const foldRow1 = Math.floor(numRows * 0.45);
  const foldRow2 = numRows - 4;
  for (const fr of [foldRow1, foldRow2]) {
    const frl = rl(fr) + 2;
    const frr = rr(fr) - 2;
    if (shirtLx - frl > 0) hLine(ctx, colors.shadow, frl, y + fr, shirtLx - frl);
    if (frr - (shirtLx + shirtW) > 0) hLine(ctx, colors.shadow, shirtLx + shirtW, y + fr, frr - shirtLx - shirtW);
  }

  // ── 4. Deep fold shadow (enhanced clothing shadows) ──────────────────────
  const deepFold = colors.deep_shadow || colors.shadow;
  const foldCenter = Math.floor(numRows * 0.55);
  hLine(ctx, deepFold, shirtLx + 1, y + foldCenter, shirtW - 2);

  // ── 5. Inner shirt panel ─────────────────────────────────────────────────
  const shirtCol = colors.collar || colors.highlight;
  fillRect(ctx, shirtCol, shirtLx, y, shirtW, numRows);
  vLine(ctx, colors.shadow,    shirtLx,              y, numRows);
  vLine(ctx, colors.shadow,    shirtLx + shirtW - 1, y, numRows);
  vLine(ctx, colors.highlight, shirtLx + 1,          y, numRows);
  vLine(ctx, colors.shadow,    shirtLx + shirtW - 2, y, numRows);
  vLine(ctx, colors.highlight, cx, y + 1, numRows - 2);

  // Shirt buttons at scaled rows 14, 19, 24
  for (const btnRow of [14, 19, 24]) {
    if (btnRow < numRows) px(ctx, colors.shadow, cx, y + btnRow);
  }

  // ── 6. Lapels ─────────────────────────────────────────────────────────────
  const lapelH = Math.min(12, numRows);
  for (let row = 0; row < lapelH; row++) {
    const lw = Math.round(4 * (lapelH - 1 - row) / (lapelH - 1));
    if (lw > 0) {
      hLine(ctx, colors.highlight, shirtLx,          y + row, lw);
      px(ctx,   colors.shadow,     shirtLx + lw - 1, y + row);
      hLine(ctx, colors.base,  shirtLx + shirtW - lw, y + row, lw);
      px(ctx,   colors.shadow, shirtLx + shirtW - lw, y + row);
    }
  }

  // ── 7. AA at silhouette steps + waist bridge ─────────────────────────────
  px(ctx, colors.shadow, x - 1, y + SHOULDER);
  px(ctx, colors.shadow, x + w, y + SHOULDER);
  px(ctx, colors.shadow, x, y + WAIST_S);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_S);
  px(ctx, colors.shadow, x, y + WAIST_E + 1);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_E + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,         y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }

  // ── 8. Armpit crease ─────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);

  // ── 9. Selective outlining ────────────────────────────────────────────────
  px(ctx, colors.shadow,  x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow,  x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);

  // ── 10. Shoulder cap + rounded corners + hip flare + cylinder ────────────
  px(ctx, colors.highlight, x - 1, y + 1);
  erasePixel(ctx, x - 1, y);
  px(ctx, colors.shadow, x - 1, y);
  erasePixel(ctx, x + w, y);
  px(ctx, colors.shadow, x + w, y);
  px(ctx, colors.highlight, rl(WAIST_E + 1) + 1, y + WAIST_E + 1);
  // Cylinder mid-shadow at right-center
  for (let row = 4; row <= 9; row++) {
    px(ctx, colors.shadow, cx + 5, y + row);
  }
  // Underpectoral fold
  hLine(ctx, colors.shadow,    shirtLx + 1, y + 10, shirtW - 2);
  hLine(ctx, deepFold,         shirtLx + 2, y + 10, shirtW - 4);
}

function drawHoodieSouth(ctx, colors, x, y, w, h) {
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4;
  const WAIST_S = 10, WAIST_E = 16;

  const rl = (row) => {
    if (row < SHOULDER)                     return x - 1;
    if (row >= WAIST_S && row <= WAIST_E)  return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)                     return x + w;
    if (row >= WAIST_S && row <= WAIST_E)  return x + w - 2;
    return x + w - 1;
  };

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  for (let row = 0; row < numRows; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    px(ctx, colors.shadow,    rr(row) - 1, y + row);
    px(ctx, colors.shadow,    rr(row) - 2, y + row);
  }
  for (let row = 1; row < Math.min(10, numRows); row++) {
    if (row % 2 === 1) px(ctx, colors.highlight, rl(row) + 2, y + row);
  }

  const hFold1 = Math.floor(numRows * 0.35);
  const hFold2 = Math.floor(numRows * 0.65);
  const hFold3 = numRows - 4;
  const deepFold = colors.deep_shadow || colors.shadow;
  for (const fr of [hFold1, hFold2, hFold3]) {
    hLine(ctx, colors.shadow, rl(fr) + 2, y + fr, rr(fr) - rl(fr) - 3);
    hLine(ctx, deepFold, rl(fr) + 3, y + fr + 1, rr(fr) - rl(fr) - 5);
  }

  // Hood collar
  const hoodX = cx - 5;
  fillRect(ctx, colors.collar, hoodX, y, 10, 4);
  vLine(ctx, colors.highlight, hoodX + 1, y, 4);
  vLine(ctx, colors.shadow,    hoodX + 8, y, 4);
  outlineRect(ctx, colors.outline, hoodX, y, 10, 4);

  // Center zipper
  vLine(ctx, colors.shadow, cx, y + 4, numRows - 4);

  // Kangaroo pocket
  const pkx = cx - 6;
  const pky = y + Math.floor(numRows * 0.58);
  const pkw = 12, pkh = Math.max(4, Math.floor(numRows * 0.32));
  fillRect(ctx, colors.shadow, pkx, pky, pkw, pkh);
  vLine(ctx, colors.highlight, pkx + 1,       pky, pkh);
  vLine(ctx, colors.shadow,    pkx + pkw - 2,  pky, pkh);
  outlineRect(ctx, colors.outline, pkx, pky, pkw, pkh);

  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x, y + WAIST_S);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_S);
  px(ctx, colors.shadow, x, y + WAIST_E + 1);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_E + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,         y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }

  px(ctx, colors.shadow,  x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow,  x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
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
  const ax = x + 4, aw = w - 8;
  fillRect(ctx, colors.base, ax, y + 2, aw, h - 2);
  vLine(ctx, colors.highlight, ax + 1, y + 3, h - 4);
  vLine(ctx, colors.shadow,    ax + aw - 2, y + 3, h - 4);

  // Tie strings at top
  fillRect(ctx, colors.collar, x + 1, y, 3, 4);
  fillRect(ctx, colors.collar, x + w - 4, y, 3, 4);

  outlineRect(ctx, colors.outline, ax, y + 2, aw, h - 2);
  outlineRect(ctx, '#404060',      x,  y,     w,  h);
}

function drawShirtSouth(ctx, colors, x, y, w, h) {
  // Plain collared shirt — hourglass silhouette, shirt collar at top.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4, WAIST_S = 10, WAIST_E = 16;
  const rl = (row) => row < SHOULDER ? x - 1 : row >= WAIST_S && row <= WAIST_E ? x + 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row >= WAIST_S && row <= WAIST_E ? x + w - 2 : x + w - 1;

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Side panel shading
  for (let row = 0; row < numRows; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    px(ctx, colors.shadow,    rr(row) - 1, y + row);
    px(ctx, colors.shadow,    rr(row) - 2, y + row);
  }
  // Button placket: center column
  vLine(ctx, colors.shadow, cx, y + 3, numRows - 3);
  vLine(ctx, colors.highlight, cx - 1, y + 3, numRows - 3);
  // Collar: V-neck at top center
  const collarH = 6;
  for (let row = 0; row < collarH; row++) {
    const cw = Math.round(9 * (collarH - row) / collarH);
    if (cw > 0) {
      hLine(ctx, colors.collar, cx - Math.floor(cw / 2), y + row, cw);
    }
  }
  // Waist bridge + outlines
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x, y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
}

function drawVestSouth(ctx, colors, x, y, w, h) {
  // Leather vest over shirt: shirt visible at sides, vest in center.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4, WAIST_S = 10, WAIST_E = 16;
  const rl = (row) => row < SHOULDER ? x - 1 : row >= WAIST_S && row <= WAIST_E ? x + 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row >= WAIST_S && row <= WAIST_E ? x + w - 2 : x + w - 1;

  // Shirt base (full width, lighter)
  const shirtCol = colors.shirt || colors.highlight;
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, shirtCol, rl(row), y + row, rr(row) - rl(row) + 1);
    px(ctx, colors.shirt_shadow || colors.shadow, rl(row) + 1, y + row);
    px(ctx, colors.shirt_shadow || colors.shadow, rr(row) - 1, y + row);
  }
  // Vest body: narrower (leaves 4px shirt visible each side)
  const vl = (row) => rl(row) + 4;
  const vr = (row) => rr(row) - 4;
  for (let row = 0; row < numRows; row++) {
    if (vr(row) > vl(row)) {
      hLine(ctx, colors.base, vl(row), y + row, vr(row) - vl(row) + 1);
      px(ctx, colors.highlight, vl(row) + 1, y + row);
      px(ctx, colors.shadow,    vr(row) - 1, y + row);
      px(ctx, colors.shadow,    vr(row),     y + row);
    }
  }
  // Vest outline (inner seam)
  for (let row = 0; row < numRows; row++) {
    if (vr(row) > vl(row)) {
      px(ctx, colors.outline, vl(row), y + row);
      px(ctx, colors.outline, vr(row) + 1, y + row);
    }
  }
  // Collar area: shirt collar visible at top
  const shirtCollarW = 9;
  fillRect(ctx, shirtCol, cx - 4, y, shirtCollarW, 4);
  outlineRect(ctx, colors.outline, cx - 4, y, shirtCollarW, 4);
  // Outer silhouette
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x, y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }
  px(ctx, colors.highlight, x - 1, y + 1);
}

function drawTunicSouth(ctx, colors, x, y, w, h) {
  // RPG tunic: wider cut than jacket, rounded collar, minimal seam.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4, WAIST_S = 10, WAIST_E = 16;
  const rl = (row) => row < SHOULDER ? x - 1 : row >= WAIST_S && row <= WAIST_E ? x + 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row >= WAIST_S && row <= WAIST_E ? x + w - 2 : x + w - 1;

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading
  for (let row = 0; row < numRows; row++) {
    const isShoulderRow = row < SHOULDER;
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (isShoulderRow) px(ctx, colors.highlight, rl(row) + 2, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }
  // Center seam / lacing: tunic has a lace-up opening at top center
  const laceH = Math.min(10, numRows);
  for (let row = 2; row < laceH; row += 2) {
    px(ctx, colors.shadow,    cx - 1, y + row);
    px(ctx, colors.shadow,    cx + 1, y + row);
    px(ctx, colors.highlight, cx,     y + row);
  }
  // Round collar (wider than jacket)
  const collarW = 12;
  fillRect(ctx, colors.collar, cx - 6, y, collarW, 4);
  hLine(ctx, colors.highlight, cx - 5, y,     collarW - 2);
  hLine(ctx, colors.shadow,    cx - 5, y + 3, collarW - 2);
  outlineRect(ctx, colors.outline, cx - 6, y, collarW, 4);
  // Waist + outlines
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x, y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
}

function drawRobeSouth(ctx, colors, x, y, w, h) {
  // Mage robe: wide at bottom, ornate collar, deep shadow folds.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4;
  // Robes don't taper at waist — they flare wider at bottom
  const rl = (row) => row < SHOULDER ? x - 1 : row > 16 ? x - 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row > 16 ? x + w : x + w - 1;

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading
  for (let row = 0; row < numRows; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (row < SHOULDER) px(ctx, colors.highlight, rl(row) + 2, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }
  // Deep fold shadows: robe has fabric bunching
  const fold1 = Math.floor(numRows * 0.4);
  const fold2 = Math.floor(numRows * 0.7);
  for (const fr of [fold1, fold2]) {
    hLine(ctx, colors.shadow, rl(fr) + 2, y + fr, (rr(fr) - rl(fr)) - 3);
    if (colors.deep_shadow) px(ctx, colors.deep_shadow, cx, y + fr);
  }
  // Center ornament stripe (robe has a decorative front panel)
  const panelW = 6;
  for (let row = 4; row < numRows; row++) {
    hLine(ctx, colors.collar, cx - 3, y + row, panelW);
    px(ctx, colors.highlight, cx - 2, y + row);
    px(ctx, colors.shadow,    cx + 2, y + row);
  }
  // Wide collar / hood base
  const collarW = 15;
  fillRect(ctx, colors.collar, cx - 7, y, collarW, 6);
  hLine(ctx, colors.highlight, cx - 6, y,     collarW - 2);
  hLine(ctx, colors.shadow,    cx - 6, y + 5, collarW - 2);
  outlineRect(ctx, colors.outline, cx - 7, y, collarW, 6);
  // Outlines
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
}

function drawTshirtSouth(ctx, colors, x, y, w, h) {
  // Crew-neck T-shirt: clean silhouette, round neckline, no buttons/placket.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4, WAIST_S = 10, WAIST_E = 16;
  const rl = (row) => row < SHOULDER ? x - 1 : row >= WAIST_S && row <= WAIST_E ? x + 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row >= WAIST_S && row <= WAIST_E ? x + w - 2 : x + w - 1;

  // Fill base
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Form shading: left lit, right shadow
  for (let row = 0; row < numRows; row++) {
    const isShoulderRow = row < SHOULDER;
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (isShoulderRow) px(ctx, colors.highlight, rl(row) + 2, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }
  // Crew neck: 12px wide × 4px tall, rounded corners
  const neckW = 12, neckX = cx - 6;
  fillRect(ctx, colors.collar, neckX, y, neckW, 4);
  hLine(ctx, colors.highlight, neckX + 1, y,     neckW - 2);
  hLine(ctx, colors.shadow,    neckX + 1, y + 3, neckW - 2);
  px(ctx, colors.shadow, neckX,             y);  // round left corner
  px(ctx, colors.shadow, neckX + neckW - 1, y);  // round right corner
  outlineRect(ctx, colors.outline, neckX, y, neckW, 4);
  // Under-chest fold shadow (suggests body volume)
  hLine(ctx, colors.shadow, rl(9) + 2, y + 9, rr(9) - rl(9) - 4);
  // Selout outline
  px(ctx, colors.shadow, x - 1, y - 1); px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,         y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }
}

function drawBomberSouth(ctx, colors, x, y, w, h) {
  // Bomber jacket: boxy silhouette, ribbed collar+hem, center zipper.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 4;
  // Boxy cut: very shallow waist taper (1px each side, rows 12-16)
  const WAIST_S = 12, WAIST_E = 16;
  const rl = (row) => row < SHOULDER ? x - 1 : row >= WAIST_S && row <= WAIST_E ? x + 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row >= WAIST_S && row <= WAIST_E ? x + w - 2 : x + w - 1;

  // Fill base
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading
  for (let row = 0; row < numRows; row++) {
    const isShoulderRow = row < SHOULDER;
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (isShoulderRow) px(ctx, colors.highlight, rl(row) + 2, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }
  // Ribbed collar (4 rows): alternating rib stripes
  const COLLAR_H = 4, colW = 15, colX = cx - 7;
  for (let row = 0; row < COLLAR_H; row++) {
    const ribCol = (row % 2 === 0) ? colors.collar : colors.shadow;
    hLine(ctx, ribCol, colX, y + row, colW);
    px(ctx, colors.highlight, colX + 1, y + row);
    px(ctx, colors.shadow,    colX + colW - 2, y + row);
  }
  outlineRect(ctx, colors.outline, colX, y, colW, COLLAR_H);
  // Center zipper (below collar to hem)
  for (let row = COLLAR_H; row < numRows; row++) {
    px(ctx, colors.shadow,    cx,     y + row);
    px(ctx, colors.highlight, cx - 1, y + row);
  }
  // Horizontal fold lines
  for (const fr of [7, 13]) {
    if (fr < numRows) {
      hLine(ctx, colors.shadow, rl(fr) + 2, y + fr, rr(fr) - rl(fr) - 4);
      if (colors.deep_shadow) px(ctx, colors.deep_shadow, cx, y + fr);
    }
  }
  // Ribbed hem (last 2 rows)
  for (let row = numRows - 2; row < numRows; row++) {
    const ribCol = (row % 2 === 0) ? colors.collar : colors.shadow;
    hLine(ctx, ribCol, rl(row) + 1, y + row, rr(row) - rl(row) - 1);
    px(ctx, colors.highlight, rl(row) + 2, y + row);
  }
  // Armpit crease + selout
  px(ctx, colors.shadow, x - 1, y - 1); px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,         y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }
}

// ---------------------------------------------------------------------------
// drawCoatSouth  –  long coat / trench coat extending past the belt
// ---------------------------------------------------------------------------

function drawCoatSouth(ctx, colors, x, y, w, h) {
  // A long coat (duster/trench) that extends 13 rows below normal torso bottom,
  // visually overlaying the belt and upper legs (those are drawn first).
  //
  // Silhouette:
  //   Rows 0-2  (shoulder cap): x=22-41 (20px)
  //   Rows 3-6  (chest):        x=23-40 (18px)
  //   Rows 7-11 (waist):        x=24-39 (16px)  ← coat belt tie at row 9
  //   Rows 12+  (hip/skirt):    x=23-40 (18px) → flares to x=21-42 at bottom

  const cx     = Math.floor(x + w / 2);  // = 48
  const SHOULDER = 4, WAIST_S = 10, WAIST_E = 16;
  const tailH  = 19;                     // coat extension below normal hem
  const totalH = h + tailH;

  const rl = (row) => {
    if (row < SHOULDER)                     return x - 1;                                    // shoulder: x=22
    if (row >= WAIST_S && row <= WAIST_E)  return x + 1;                                    // waist taper: x=24
    if (row < h)                             return x;                                       // hip: x=23
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);                               // tail flare
    return x - flare;                                                                         // x=22 → x=21
  };
  const rr = (row) => {
    if (row < SHOULDER)                     return x + w;                                    // shoulder: x=41
    if (row >= WAIST_S && row <= WAIST_E)  return x + w - 2;                                // waist: x=39
    if (row < h)                             return x + w - 1;                               // hip: x=40
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);
    return x + w - 1 + flare;                                                                // x=40 → x=42
  };

  // ── 1. Base fill ─────────────────────────────────────────────────────────
  for (let row = 0; row < totalH; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional shading (left-lit) ────────────────────────────────────
  for (let row = 0; row < totalH; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (row < SHOULDER) px(ctx, colors.highlight, rl(row) + 2, y + row);  // wider shoulder lit
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }

  // ── 3. Lapels at top ─────────────────────────────────────────────────────
  const lapelH = Math.min(12, h);
  const shirtLx = cx - 6;
  const shirtW  = 12;
  for (let row = 0; row < lapelH; row++) {
    const lw = Math.round(4 * (lapelH - 1 - row) / (lapelH - 1));
    if (lw > 0) {
      hLine(ctx, colors.highlight, shirtLx, y + row, lw);
      px(ctx, colors.shadow, shirtLx + lw - 1, y + row);
      hLine(ctx, colors.base, shirtLx + shirtW - lw, y + row, lw);
      px(ctx, colors.shadow, shirtLx + shirtW - lw, y + row);
    }
  }

  // ── 4. Center button seam (below lapels) ─────────────────────────────────
  vLine(ctx, colors.shadow,    cx,     y + 12, totalH - 12);
  vLine(ctx, colors.highlight, cx - 1, y + 12, totalH - 12);
  // Buttons: single pixel dots down the placket
  for (const btnRow of [15, 21, 27, 33]) {
    if (btnRow < totalH) px(ctx, colors.outline, cx, y + btnRow);
  }

  // ── 5. Coat belt / sash tie at waist ────────────────────────────────────
  fillRect(ctx, colors.collar || colors.shadow, cx - 4, y + 13, 9, 3);
  hLine(ctx, colors.highlight, cx - 3, y + 13, 7);
  px(ctx, colors.shadow, cx - 4, y + 15);
  px(ctx, colors.shadow, cx + 4, y + 15);

  // ── 6. Fold shadow lines across fabric ───────────────────────────────────
  for (const fr of [Math.floor(h * 0.5), h + 2, h + 7, totalH - 3]) {
    if (fr > 0 && fr < totalH) {
      hLine(ctx, colors.shadow, rl(fr) + 2, y + fr, rr(fr) - rl(fr) - 4);
    }
  }

  // ── 7. Step AA and waist bridge ─────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y + SHOULDER);
  px(ctx, colors.shadow, x + w, y + SHOULDER);
  px(ctx, colors.shadow, x,     y + WAIST_S);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_S);
  px(ctx, colors.shadow, x,     y + WAIST_E + 1);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_E + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,         y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }

  // ── 8. Armpit crease ────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);

  // ── 9. Selective outlining ───────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < totalH - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(totalH - 1), botR = rr(totalH - 1);
  hLine(ctx, colors.outline, botL, y + totalH - 1, botR - botL + 1);

  // ── 10. Shoulder cap rounding ────────────────────────────────────────────
  px(ctx, colors.highlight, x - 1, y + 1);
  erasePixel(ctx, x - 1, y);
  px(ctx, colors.shadow, x - 1, y);
  erasePixel(ctx, x + w, y);
  px(ctx, colors.shadow, x + w, y);
}

function drawTorsoSouth(ctx, clothingKey, clothingColors, x, y, w, h) {
  if (clothingKey.startsWith('coat')) {
    drawCoatSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('jacket')) {
    drawJacketSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('hoodie')) {
    drawHoodieSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('apron')) {
    drawApronSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('shirt')) {
    drawShirtSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('vest')) {
    drawVestSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('tunic')) {
    drawTunicSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('robe')) {
    drawRobeSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('tshirt')) {
    drawTshirtSouth(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('bomber')) {
    drawBomberSouth(ctx, clothingColors, x, y, w, h);
  } else {
    fillRect(ctx, clothingColors.base, x, y, w, h);
    outlineRect(ctx, clothingColors.outline, x, y, w, h);
  }
}

// ---------------------------------------------------------------------------
// drawTorsoWest  –  side view torso x=20-32, y=26-43
// ---------------------------------------------------------------------------

function drawTorsoWest(ctx, clothingKey, clothingColors, x, y) {
  // Side profile torso — 5-zone SNES shading for jacket.
  // Silhouette taper: shoulder full width, chest slight taper at back, waist narrower.
  // Front edge (x) stays constant — stable silhouette facing the viewer.
  // For jacket: front 2px opening shows shirt/collar suggestion.
  // For coats: h extended by 13 rows to cover upper legs in side view.
  const isCoat = clothingKey && clothingKey.startsWith('coat');
  const h = isCoat ? 43 : 24;
  const SHOULDER = 4, WAIST_S = 10, WAIST_E = 16;

  const rowW = (row) => {
    if (row < SHOULDER)                       return 19;  // full shoulder
    if (row >= WAIST_S && row <= WAIST_E)    return 16;  // narrow waist
    return 18;                                             // chest/hip
  };

  // Fill row by row
  for (let row = 0; row < h; row++) {
    hLine(ctx, clothingColors.base, x, y + row, rowW(row));
  }

  // ── Zone 1: Front lit face (2px highlight strip — fabric faces viewer) ────
  vLine(ctx, clothingColors.highlight, x + 1, y + 1, h - 2);

  // ── Zone 2: Secondary lit zone (fabric curves away slightly) ──────────────
  for (let row = 1; row < h - 1; row++) {
    px(ctx, clothingColors.highlight, x + 2, y + row);
  }

  // ── Zone 3: Mid-body base zone (already filled above) ─────────────────────
  // columns x+3 to ~55% of rowW are base color (no change needed)

  // ── Zone 4: Mid-shadow transition (surface curves away from light) ────────
  for (let row = 1; row < h - 1; row++) {
    const rw = rowW(row);
    // Shadow starts at ~60% from front edge
    const midX = Math.round(rw * 0.60);
    px(ctx, clothingColors.shadow, x + midX, y + row);
    // Widen shadow at chest (rows 3-6) for more pronounced form read
    if (row >= 3 && row <= 6) {
      px(ctx, clothingColors.shadow, x + midX - 1, y + row);
    }
  }

  // ── Zone 5: Back shadow strip (away from light source — 2px) ─────────────
  for (let row = 0; row < h; row++) {
    const rw = rowW(row);
    px(ctx, clothingColors.shadow, x + rw - 2, y + row);
    px(ctx, clothingColors.shadow, x + rw - 3, y + row);
  }

  // Chest prominence shadow (below pectoral)
  hLine(ctx, clothingColors.shadow, x + 2, y + 9, rowW(9) - 5);

  // Bottom edge darker
  hLine(ctx, clothingColors.shadow, x + 1, y + h - 2, rowW(h - 1) - 3);

  // ── Jacket front details (lapel/collar suggestion at top 4 rows) ──────────
  if (clothingKey && clothingKey.startsWith('jacket')) {
    // Front opening strip: 2px wide from top, shows shirt/collar
    const shirtCol = clothingColors.collar || clothingColors.highlight;
    for (let row = 0; row < 5; row++) {
      // Opening widens slightly: closed at top, open at row 4
      const openW = Math.min(row + 1, 3);
      hLine(ctx, shirtCol, x, y + row, openW);
      px(ctx, clothingColors.shadow, x + openW, y + row);  // lapel shadow edge
    }
    // Shirt visible below lapel (faint suggestion)
    for (let row = 5; row < 8; row++) {
      px(ctx, clothingColors.highlight, x, y + row);
      px(ctx, clothingColors.highlight, x + 1, y + row);
    }
  } else if (clothingKey && clothingKey.startsWith('bomber')) {
    // Ribbed collar at front top: 3 alternating rib stripes
    for (let row = 0; row < 3; row++) {
      const ribCol = (row % 2 === 0) ? clothingColors.collar : clothingColors.shadow;
      hLine(ctx, ribCol, x, y + row, 3);
      px(ctx, clothingColors.highlight, x + 1, y + row);
    }
    // Ribbed hem at bottom 2 rows
    for (let row = h - 2; row < h; row++) {
      const rw = rowW(row);
      const ribCol = (row % 2 === 0) ? clothingColors.collar : clothingColors.shadow;
      hLine(ctx, ribCol, x + 1, y + row, rw - 3);
      px(ctx, clothingColors.highlight, x + 2, y + row);
    }
    // Center zipper hint (front edge)
    for (let row = 3; row < h - 2; row++) {
      px(ctx, clothingColors.shadow, x, y + row);
    }
  } else if (clothingKey && (clothingKey.startsWith('shirt') || clothingKey.startsWith('tshirt') || clothingKey.startsWith('tunic') || clothingKey.startsWith('vest') || clothingKey.startsWith('robe'))) {
    // Collar visible at front top (2px wide strip)
    const shirtCol = clothingColors.collar || clothingColors.highlight;
    for (let row = 0; row < 4; row++) {
      px(ctx, shirtCol, x, y + row);
      px(ctx, shirtCol, x + 1, y + row);
    }
  }

  // ── Outline ────────────────────────────────────────────────────────────────
  hLine(ctx, clothingColors.outline, x, y, rowW(0));         // top
  hLine(ctx, clothingColors.highlight, x + 2, y, rowW(0) - 5); // shoulder highlight
  hLine(ctx, clothingColors.outline, x, y + h - 1, rowW(h - 1));  // bottom
  vLine(ctx, clothingColors.outline, x, y, h);                // front edge
  for (let row = 0; row < h; row++) {
    px(ctx, clothingColors.shadow, x + rowW(row) - 1, y + row);  // back selout
  }
  // AA at waist step transitions
  px(ctx, clothingColors.shadow, x + rowW(SHOULDER) - 1,   y + SHOULDER);
  px(ctx, clothingColors.shadow, x + rowW(WAIST_S) - 1,    y + WAIST_S);
  px(ctx, clothingColors.shadow, x + rowW(WAIST_E + 1) - 1, y + WAIST_E + 1);
}

// ---------------------------------------------------------------------------
// drawBeltSouth / drawBeltWest
// ---------------------------------------------------------------------------

function drawBeltSouth(ctx, beltColors, x, y) {
  // Belt / hip band: 24px wide, anchors torso-to-leg transition.
  const w = 24, h = 3;
  fillRect(ctx, beltColors.base, x, y, w, h);
  // Highlight on belt top row (belt leather catches light from above)
  hLine(ctx, beltColors.highlight, x + 1, y, w - 2);
  // Shadow on belt bottom rows (underside of belt in shadow)
  hLine(ctx, beltColors.shadow, x + 1, y + 2, w - 2);
  // Middle row slightly narrower (hip taper)
  fillRect(ctx, beltColors.base, x + 1, y + 1, w - 2, 1);
  // Buckle center
  const bx = x + Math.floor(w / 2) - 2;
  fillRect(ctx, beltColors.buckle, bx, y, 5, h);
  hLine(ctx, beltColors.highlight, bx + 1, y, 3);  // buckle top shine
  // Hip taper dark corners at outer edges of bottom row
  px(ctx, beltColors.outline, x, y + 2);
  px(ctx, beltColors.outline, x + w - 1, y + 2);
  outlineRect(ctx, beltColors.outline, x, y, w, 1);
  // Outline bottom row separately
  hLine(ctx, beltColors.outline, x + 1, y + 2, w - 2);
  // Belt curvature: center dips 1px (gravity sag)
  const cx = x + Math.floor(w / 2);
  px(ctx, beltColors.outline, cx - 1, y + 3);
  px(ctx, beltColors.outline, cx,     y + 3);
  px(ctx, beltColors.outline, cx + 1, y + 3);
  px(ctx, beltColors.shadow,  cx,     y + 3);  // center darkest point
}

function drawBeltWest(ctx, beltColors, x, y) {
  const w = 19, h = 3;
  fillRect(ctx, beltColors.base, x, y, w, h);
  hLine(ctx, beltColors.highlight, x + 1, y, w - 2);
  hLine(ctx, beltColors.shadow,    x + 1, y + 2, w - 2);
  const bx = x + Math.floor(w / 2) - 2;
  fillRect(ctx, beltColors.buckle, bx, y, 5, h);
  outlineRect(ctx, beltColors.outline, x, y, w, h);
}

// ---------------------------------------------------------------------------
// drawLegsSouth
// ---------------------------------------------------------------------------

function drawLegsSouth(ctx, pantColors, lLegDX, rLegDX, baseY, lLegDY=0, rLegDY=0, forwardLeg='none') {
  // Legs redesigned from research (Slynyrd, Tsugumo, Kandi Runner):
  //   Row widths taper naturally from thigh to ankle.
  //   Knee: no outward silhouette bump — shadow BELOW knee cap instead.
  //   Inner gap: 2px, filled dark throughout (not transparent background).
  //   Forward leg brighter (base tone), back leg darker (shadow tone) —
  //   this is the SNES standard for south-facing walk depth differentiation.
  //
  // Split DY: thigh rows (0-5) fixed at baseY, knee-to-ankle (6+) shift.
  const legH = 26;
  const KNEE_ROW = 9;
  // At 96px: lx=38, rx=50 gives 3px inner gap with 9px thigh width
  const lx = 38 + Math.round(lLegDX);
  const rx = 50 + Math.round(rLegDX);
  const y  = baseY;

  // Row widths: [leftOffset, width]. No outward knee bump (shadow over silhouette).
  // Taper: thigh 9px → knee 8px → shin 7px → ankle 6px.
  // 26 rows scaled from 17-row 64px layout.
  const rows = [
    [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9],  // 0-8: thigh 9px
    [0, 8], [0, 8], [0, 8], [0, 8], [0, 8],                                    // 9-13: knee 8px
    [0, 7], [0, 7], [0, 7], [0, 7], [0, 7], [0, 7], [0, 7], [0, 7],           // 14-21: shin 7px
    [0, 6], [0, 6], [0, 6], [0, 6],                                             // 22-25: ankle 6px
  ];

  // Forward-leg color differentiation (SNES technique: brighter = forward, darker = behind)
  const lBaseColor = (forwardLeg === 'right') ? pantColors.shadow : pantColors.base;
  const rBaseColor = (forwardLeg === 'left')  ? pantColors.shadow : pantColors.base;
  const lHiColor   = (forwardLeg === 'right') ? pantColors.base   : pantColors.highlight;
  const rHiColor   = (forwardLeg === 'left')  ? pantColors.base   : pantColors.highlight;

  for (let row = 0; row < legH; row++) {
    const [lo, lw] = rows[row];

    const ldy   = row >= KNEE_ROW ? Math.round(lLegDY) : 0;
    const rdy   = row >= KNEE_ROW ? Math.round(rLegDY) : 0;
    const lRowY = y + row + ldy;
    const rRowY = y + row + rdy;

    // ── Left leg ──────────────────────────────────────────────────────────────
    const llx = lx + lo;
    hLine(ctx, lBaseColor,  llx,          lRowY, lw);
    px(ctx, lHiColor,       llx + 1,      lRowY);          // outer lit face
    px(ctx, pantColors.shadow, llx + lw - 2, lRowY);       // inner shadow
    // Knee shadow below cap (row 13 with 26-row layout) — organic knee protrusion
    if (row === 13) hLine(ctx, pantColors.shadow, llx + 1, lRowY, lw - 2);
    // Upper thigh highlight (rows 1, 3) for cylinder form
    if (row === 1 || row === 3) px(ctx, lHiColor, llx + 2, lRowY);
    px(ctx, pantColors.shadow, llx, lRowY);                  // selout outer edge
    px(ctx, pantColors.shadow, llx + lw - 1, lRowY);         // shadow inner edge (softer than outline)

    // ── Right leg ─────────────────────────────────────────────────────────────
    const rrw    = lw;
    const rrEnd  = rx + rrw - 1;   // outer pixel of right leg
    hLine(ctx, rBaseColor,  rx,        rRowY, rrw);
    px(ctx, rHiColor,       rrEnd - 1, rRowY);               // outer lit face
    px(ctx, pantColors.shadow, rx + 1, rRowY);               // inner shadow
    if (row === 13) hLine(ctx, pantColors.shadow, rx + 1, rRowY, rrw - 2);
    if (row === 1 || row === 3) px(ctx, rHiColor, rrEnd - 2, rRowY);
    px(ctx, pantColors.shadow, rrEnd, rRowY);                 // selout outer edge
    px(ctx, pantColors.shadow, rx,    rRowY);                 // shadow inner edge
  }

  // Top outlines (fixed — thigh junction, belt covers this area)
  hLine(ctx, pantColors.outline, lx, y, rows[0][1]);
  hLine(ctx, pantColors.outline, rx, y, rows[0][1]);
  // Bottom outlines at shifted ankle positions
  const lBotY = y + legH - 1 + Math.round(lLegDY);
  const rBotY = y + legH - 1 + Math.round(rLegDY);
  hLine(ctx, pantColors.outline, lx, lBotY, rows[legH - 1][1]);
  hLine(ctx, pantColors.outline, rx, rBotY, rows[legH - 1][1]);

  // Inner thigh gap: transparent (shows background through).
  // The inner shadow pixels already drawn on each leg's edge (selout) suggest depth.
  // Only the top 2 rows get a crotch-shadow hint where legs meet at the belt.
  const gapX = lx + rows[0][1];
  const gapW = rx - gapX;
  if (gapW > 0) {
    ctx.clearRect(gapX, y, gapW, legH);   // ensure gap is transparent
    // Tiny crotch shadow hint at top (legs converge here under belt)
    hLine(ctx, pantColors.shadow,  gapX, y,     gapW);
    hLine(ctx, pantColors.outline, gapX, y + 1, gapW);
  }
}

// ---------------------------------------------------------------------------
// drawLegsWest  –  side profile legs with stride
// ---------------------------------------------------------------------------

function drawLegsWest(ctx, pantColors, frontLegX, backLegX, legTopY, frontLift=0, backLift=0) {
  // SNES-style profile legs: taper thigh→knee→shin→ankle.
  // Knee bump: kneecap protrudes 1px toward front (lower X in west view).
  // 26 rows scaled from 17-row 64px layout.
  const legH = 26;

  // Per-row layout [xOffset from legX, width] for front leg (west = facing left, kneecap at front = lower X)
  // thigh: 7px at legX-3; knee: 9px at legX-4 (1px forward bump); shin: 7px at legX-3; ankle: 6px at legX-2
  const frontRows = [
    [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7],  // 0-8: thigh 7px
    [-4, 9], [-4, 9], [-4, 9], [-4, 9], [-4, 9],                                        // 9-13: knee 9px (kneecap bump)
    [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7],            // 14-21: shin 7px
    [-2, 6], [-2, 6], [-2, 6], [-2, 6],                                                  // 22-25: ankle 6px
  ];
  // Back leg: slightly simpler (less detail = depth), no kneecap bump outward
  const backRows = [
    [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7],
    [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7],
    [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7], [-3, 7],
    [-2, 6], [-2, 6], [-2, 6], [-2, 6],
  ];

  // ── Back leg (shadow tone, drawn first so front leg is on top) ────────────
  const backH = Math.max(2, legH - Math.round(backLift));
  for (let row = 0; row < backH; row++) {
    const [xOff, w] = backRows[row];
    const rx = backLegX + xOff;
    hLine(ctx, pantColors.shadow, rx, legTopY + row, w);
    px(ctx, pantColors.base, rx + 1, legTopY + row);  // lighter inner strip
    // Knee hint for back leg
    if (row === 6) px(ctx, pantColors.base, rx + 2, legTopY + row);
    // Outline left edge
    px(ctx, pantColors.outline, rx, legTopY + row);
    px(ctx, pantColors.outline, rx + w - 1, legTopY + row);
  }
  // Top and bottom outline for back leg
  const [bx0, bw0] = backRows[0];
  hLine(ctx, pantColors.outline, backLegX + bx0, legTopY, bw0);
  const [bxE, bwE] = backRows[backH - 1];
  hLine(ctx, pantColors.outline, backLegX + bxE, legTopY + backH - 1, bwE);

  // ── Front leg (full detail, drawn on top) ────────────────────────────────
  const frontH = Math.max(2, legH - Math.round(frontLift));
  for (let row = 0; row < frontH; row++) {
    const [xOff, w] = frontRows[row];
    const fx = frontLegX + xOff;
    hLine(ctx, pantColors.base, fx, legTopY + row, w);
    // Front lit edge (kneecap = front = left side)
    px(ctx, pantColors.highlight, fx + 1, legTopY + row);
    // Back shadow strip
    px(ctx, pantColors.shadow, fx + w - 2, legTopY + row);
    // Knee highlight at bump rows
    if (row === 9 || row === 10) {
      px(ctx, pantColors.highlight, fx, legTopY + row);       // kneecap tip highlight
      px(ctx, pantColors.shadow,    fx + w - 1, legTopY + row);  // back shadow
    }
    // Thigh top highlight (rows 1-2 for cylinder feel)
    if (row === 1 || row === 2) px(ctx, pantColors.highlight, fx + 2, legTopY + row);
    // Outline left/right
    px(ctx, pantColors.outline, fx, legTopY + row);
    px(ctx, pantColors.outline, fx + w - 1, legTopY + row);
  }
  // Top and bottom outline for front leg
  const [fx0, fw0] = frontRows[0];
  hLine(ctx, pantColors.outline, frontLegX + fx0, legTopY, fw0);
  const [fxE, fwE] = frontRows[frontH - 1];
  hLine(ctx, pantColors.outline, frontLegX + fxE, legTopY + frontH - 1, fwE);
}

// ---------------------------------------------------------------------------
// drawShoesSouth
// ---------------------------------------------------------------------------

function drawShoesSouth(ctx, shoeColors, lShoeDX, rShoeDX, baseY, lShoeDY=0, rShoeDY=0) {
  // Left shoe: x=35, 15px wide, 6px tall (scaled ×1.5 from 64px)
  // Right shoe: x=51, 15px wide
  const lx = 35 + Math.round(lShoeDX);
  const rx = 51 + Math.round(rShoeDX);
  const ly = baseY + Math.round(lShoeDY);   // left foot Y (forward = slightly lower)
  const ry = baseY + Math.round(rShoeDY);   // right foot Y

  // ── Left shoe ─────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, lx, ly, 15, 6);
  hLine(ctx, shoeColors.highlight, lx + 3, ly, 10);
  hLine(ctx, shoeColors.highlight, lx + 4, ly + 1, 6);
  // Midsole line: highlight stripe separating upper from sole
  hLine(ctx, shoeColors.highlight, lx + 2, ly + 3, 11);
  hLine(ctx, shoeColors.shadow, lx, ly + 4, 15);
  hLine(ctx, shoeColors.shadow, lx, ly + 5, 15);
  erasePixel(ctx, lx, ly);
  px(ctx, shoeColors.shadow, lx + 1, ly);
  px(ctx, shoeColors.highlight, lx + 14, ly);
  outlineRect(ctx, shoeColors.outline, lx, ly, 15, 6);
  px(ctx, shoeColors.shadow, lx + 3, ly + 1);

  // ── Right shoe ────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, rx, ry, 15, 6);
  hLine(ctx, shoeColors.highlight, rx + 2, ry, 10);
  hLine(ctx, shoeColors.highlight, rx + 4, ry + 1, 6);
  // Midsole line
  hLine(ctx, shoeColors.highlight, rx + 2, ry + 3, 11);
  hLine(ctx, shoeColors.shadow, rx, ry + 4, 15);
  hLine(ctx, shoeColors.shadow, rx, ry + 5, 15);
  erasePixel(ctx, rx + 14, ry);
  px(ctx, shoeColors.shadow, rx + 13, ry);
  px(ctx, shoeColors.highlight, rx, ry);
  outlineRect(ctx, shoeColors.outline, rx, ry, 15, 6);
  px(ctx, shoeColors.shadow, rx + 11, ry + 1);
}

// ---------------------------------------------------------------------------
// drawShoesWest  –  side profile shoes
// ---------------------------------------------------------------------------

function drawShoesWest(ctx, shoeColors, frontX, backX, shoeY, frontLift=0, backLift=0) {
  // Positive lift = foot goes higher on screen = smaller Y value
  const frontY = shoeY - Math.round(frontLift);
  const backY  = shoeY - Math.round(backLift);

  // Back shoe (dimmer, drawn first) — 12px wide, centered on backX
  fillRect(ctx, shoeColors.shadow, backX - 4, backY, 12, 6);
  hLine(ctx, shoeColors.shadow, backX - 4, backY + 5, 12);
  outlineRect(ctx, shoeColors.outline, backX - 4, backY, 12, 6);

  // Front shoe: pointing left (toe at lower-x = facing direction)
  fillRect(ctx, shoeColors.base, frontX - 9, frontY, 19, 6);
  hLine(ctx, shoeColors.highlight, frontX - 8, frontY, 16);
  hLine(ctx, shoeColors.shadow,    frontX - 9, frontY + 4, 19);
  hLine(ctx, shoeColors.shadow,    frontX - 9, frontY + 5, 19);
  // Toe and heel corners (rounded look)
  px(ctx, shoeColors.shadow, frontX - 9, frontY);
  px(ctx, shoeColors.shadow, frontX + 9, frontY);
  outlineRect(ctx, shoeColors.outline, frontX - 9, frontY, 19, 6);
}

// ---------------------------------------------------------------------------
// drawArmsSouth
// ---------------------------------------------------------------------------

function drawArmsSouth(ctx, clothingColors, skinColors, lArmDY, rArmDY, lArmOut=0, rArmOut=0, torsoY=28) {
  // Organic arm cylinder — SNES / Pedro Medeiros anti-banding model:
  //   Row 0:    shoulder attachment (5px)
  //   Rows 1-2: shoulder dome peak (6px)
  //   Rows 3-5: bicep body         (5px)
  //   Rows 6-7: elbow pull-in      (4px)
  //   Rows 8-9: forearm            (5px)
  //   Row 10:   wrist taper        (4px)
  //
  // Full 2D shoulder-pivot: shoulder (row 0) is pinned to its anchor (never moves).
  // Wrist (row 10) carries the full (DX, DY) offset. Each intermediate row
  // interpolates linearly — the arm appears as a diagonal angled shape, not just
  // a shifted or foreshortened vertical band. This is equivalent to arm rotation
  // around a fixed shoulder pivot point.
  //
  //   effectiveX(row) = shoulderX + round(rArmOut * row / 10)
  //   effectiveY(row) = baseY    + round(rArmDY  * row / 10) + row
  //
  // Anti-banding: shadow strip width varies. Widens at mid-bicep, elbow, forearm.
  // torsoY: top of torso, used as the shoulder anchor Y (default 28 for legacy compat).
  const lx = 27;                // left arm shoulder outer-edge anchor (fixed, 96px)
  const shoulderRX = 62;        // right arm shoulder left-edge anchor (fixed, 96px)
  const baseY = torsoY;
  const baseAW = 7, sleeveH = 16, handH = 6;
  const maxRow = sleeveH - 1;  // 15

  const bulge   = [0, 1, 1, 1, 0, 0, 0, 0, -1, -1, 0, 0, 0, -1, -1, -1];
  const shadowW = [1, 1, 1, 1, 1, 1, 2,  2,  2,  2, 1,  1,  2,  2,  1,  1];

  // Left arm: Y-pivot only (lArmOut=0 in current frames, no lateral swing)
  const lRowY = (row) => baseY + Math.round(lArmDY * row / maxRow) + row;
  const lArmY = baseY + Math.round(lArmDY);  // wrist-level Y for hand

  // Right arm: full 2D pivot — shoulder at (shoulderRX, baseY), wrist at (shoulderRX+rArmOut, baseY+rArmDY+10)
  const rRowX = (row) => shoulderRX + Math.round(rArmOut * row / maxRow);
  const rRowY = (row) => baseY      + Math.round(rArmDY  * row / maxRow) + row;
  const rArmX = shoulderRX + Math.round(rArmOut);  // wrist X for hand
  const rArmY = baseY      + Math.round(rArmDY);   // wrist Y for hand

  // ── Left arm (lit side) ────────────────────────────────────────────────────
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row];
    const rowLx = lx - b;
    const rowW  = baseAW + b;
    const ry = lRowY(row);
    hLine(ctx, clothingColors.base, rowLx, ry, rowW);
    px(ctx, clothingColors.highlight, rowLx, ry);
    if (row === 1 || row === 2 || row === 3) px(ctx, clothingColors.highlight, rowLx + 1, ry);
    if (row === 11 || row === 12) px(ctx, clothingColors.highlight, rowLx + 1, ry);
    const sw = shadowW[row];
    for (let i = 0; i < sw; i++) {
      px(ctx, clothingColors.shadow, rowLx + rowW - 1 - i, ry);
    }
  }
  for (let row = 0; row < sleeveH; row++) {
    px(ctx, clothingColors.shadow, 35, lRowY(row));
  }
  hLine(ctx, clothingColors.shadow, lx - bulge[maxRow], lRowY(maxRow), baseAW + bulge[maxRow] - 1);

  // Left fist
  const lhw = baseAW - 1;
  const lhx = lx;
  fillRect(ctx, skinColors.base, lhx, lArmY + sleeveH, lhw, handH);
  vLine(ctx, skinColors.highlight, lhx + 1,       lArmY + sleeveH, handH);
  vLine(ctx, skinColors.shadow,    lhx + lhw - 2, lArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, lhx, lArmY + sleeveH, lhw, handH);
  erasePixel(ctx, lhx,           lArmY + sleeveH + handH - 1);
  erasePixel(ctx, lhx + lhw - 1, lArmY + sleeveH + handH - 1);
  px(ctx, skinColors.shadow, lhx,           lArmY + sleeveH + handH - 2);
  px(ctx, skinColors.shadow, lhx + lhw - 1, lArmY + sleeveH + handH - 2);

  // ── Right arm (shadow side) — 2D pivot creates diagonal shape ─────────────
  for (let row = 0; row < sleeveH; row++) {
    const b   = bulge[row];
    const rowW = baseAW + b;
    const rx = rRowX(row);   // per-row X: shoulder fixed, wrist slides to rArmOut
    const ry = rRowY(row);   // per-row Y: shoulder fixed, wrist slides to rArmDY offset
    hLine(ctx, clothingColors.base, rx, ry, rowW);
    px(ctx, clothingColors.shadow, rx, ry);
    if (row === 1 || row === 2) {
      px(ctx, clothingColors.base, rx + rowW - 1, ry);
    } else {
      px(ctx, clothingColors.shadow, rx + rowW - 1, ry);
    }
    const sw = shadowW[row];
    if (sw > 1) px(ctx, clothingColors.shadow, rx + rowW - 2, ry);
  }
  // Shadow seam anchored at shoulder X — shows junction to torso regardless of arm angle
  for (let row = 0; row < sleeveH; row++) {
    px(ctx, clothingColors.shadow, shoulderRX, rRowY(row));
  }
  hLine(ctx, clothingColors.shadow, rRowX(maxRow) + 1, rRowY(maxRow), baseAW + bulge[maxRow] - 1);

  // Right fist — follows wrist position
  const rhw = baseAW - 1;
  const rhx = rArmX;
  fillRect(ctx, skinColors.base, rhx, rArmY + sleeveH, rhw, handH);
  vLine(ctx, skinColors.highlight, rhx + rhw - 2, rArmY + sleeveH, handH);
  vLine(ctx, skinColors.shadow,    rhx + 1,       rArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, rhx, rArmY + sleeveH, rhw, handH);
  erasePixel(ctx, rhx,           rArmY + sleeveH + handH - 1);
  erasePixel(ctx, rhx + rhw - 1, rArmY + sleeveH + handH - 1);
  px(ctx, skinColors.shadow, rhx,           rArmY + sleeveH + handH - 2);
  px(ctx, skinColors.shadow, rhx + rhw - 1, rArmY + sleeveH + handH - 2);
}

// ---------------------------------------------------------------------------
// drawBackArmWest / drawFrontArmWest
// Split into two functions so the front arm can be drawn AFTER the torso,
// making it visually "in front" of the body. The back arm is called first.
// Front arm = face-side arm (x ≈ torsoX-3, always lower X = always visible).
// Back arm  = body-back-side arm (x ≈ torsoX+9, always higher X = behind torso).
// ---------------------------------------------------------------------------

function drawBackArmWest(ctx, clothingColors, skinColors, backArmDX, torsoX, torsoY) {
  // Shoulder-pivot: shoulder (row 0) stays at torsoX+13, wrist slides by backArmDX.
  const sleeveH = 16, handH = 7, aw = 6;
  const backY      = torsoY + 1;
  const shoulderX  = torsoX + 13;
  const maxRow     = sleeveH - 1;
  const rowX = (row) => shoulderX + Math.round(backArmDX * row / maxRow);
  const wristX = shoulderX + Math.round(backArmDX);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    hLine(ctx, clothingColors.shadow, rx, backY + row, aw);
    px(ctx, clothingColors.base, rx + 1, backY + row);
    // per-row side outlines
    px(ctx, clothingColors.outline, rx,          backY + row);
    px(ctx, clothingColors.outline, rx + aw - 1, backY + row);
  }
  hLine(ctx, clothingColors.outline, rowX(0),   backY,          aw);  // top edge
  hLine(ctx, clothingColors.outline, rowX(maxRow), backY + maxRow, aw);  // bottom edge
  fillRect(ctx, skinColors.shadow, wristX, backY + sleeveH, aw, handH);
  outlineRect(ctx, skinColors.outline, wristX, backY + sleeveH, aw, handH);
}

function drawFrontArmWest(ctx, clothingColors, skinColors, frontArmDX, torsoX, torsoY) {
  // Shoulder-pivot: shoulder (row 0) stays at torsoX-4, wrist slides by frontArmDX.
  // The arm appears angled rather than rigidly translated — shoulder stays on torso.
  const sleeveH = 16, handH = 7, aw = 6;
  const frontY     = torsoY + 1;
  const shoulderX  = torsoX - 4;
  const maxRow     = sleeveH - 1;
  const rowX = (row) => shoulderX + Math.round(frontArmDX * row / maxRow);
  const wristX = shoulderX + Math.round(frontArmDX);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    hLine(ctx, clothingColors.base, rx, frontY + row, aw);
    px(ctx, clothingColors.highlight, rx,          frontY + row);
    px(ctx, clothingColors.shadow,    rx + aw - 1, frontY + row);
    px(ctx, clothingColors.outline,   rx,          frontY + row);
    px(ctx, clothingColors.outline,   rx + aw - 1, frontY + row);
  }
  // Shoulder dome highlight (top 2 rows stay at shoulderX)
  px(ctx, clothingColors.highlight, shoulderX + 1, frontY);
  px(ctx, clothingColors.highlight, shoulderX + 1, frontY + 1);
  // Elbow fold shadow
  px(ctx, clothingColors.shadow, rowX(7) + 1, frontY + 7);
  px(ctx, clothingColors.shadow, rowX(7) + 2, frontY + 7);
  // Top and bottom row outlines
  hLine(ctx, clothingColors.outline, rowX(0),      frontY,          aw);
  hLine(ctx, clothingColors.outline, rowX(maxRow),  frontY + maxRow, aw);

  // Hand / fist at wrist end
  fillRect(ctx, skinColors.base, wristX, frontY + sleeveH, aw, handH);
  vLine(ctx, skinColors.highlight, wristX, frontY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, wristX, frontY + sleeveH, aw, handH);
}

// Legacy combined function kept for compatibility
function drawArmsWest(ctx, clothingColors, skinColors, frontArmDX, backArmDX, torsoX, torsoY) {
  drawBackArmWest(ctx, clothingColors, skinColors, backArmDX, torsoX, torsoY);
  drawFrontArmWest(ctx, clothingColors, skinColors, frontArmDX, torsoX, torsoY);
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
  drawShirtSouth,
  drawVestSouth,
  drawTunicSouth,
  drawRobeSouth,
  drawTshirtSouth,
  drawBomberSouth,
  drawCoatSouth,
  drawTorsoWest,
  drawBeltSouth,
  drawBeltWest,
  drawLegsSouth,
  drawLegsWest,
  drawShoesSouth,
  drawShoesWest,
  drawArmsSouth,
  drawArmsWest,
  drawBackArmWest,
  drawFrontArmWest,
  // legacy exports used by DemonCharacter.js
  drawShoe,
  drawLeg,
  drawBelt,
  drawTorso,
  drawArm,
  drawNeck,
};
