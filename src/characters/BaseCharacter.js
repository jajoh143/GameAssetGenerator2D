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
  eyeColors = eyeColors || { iris: '#7B4820', pupil: '#160800', lash: '#2A1800' };
  const HX = 33, HY = 26, HW = 26;
  const cx = HX + Math.floor(HW / 2); // center x = 46
  const outline = '#111111';

  // ── HEAD SHAPE — wider, chunkier skull with prominent jaw ─────────────────
  const HEAD = [
    [5, 16],  //  0: crown top
    [3, 20],  //  1: upper dome
    [2, 22],  //  2: dome
    [1, 24],  //  3: max width
    [1, 24],  //  4: max width
    [1, 24],  //  5: max width
    [1, 24],  //  6: temple
    [1, 24],  //  7: hairline — faceStartRow
    [2, 22],  //  8: forehead
    [2, 22],  //  9: brow level
    [2, 22],  // 10: eye zone
    [2, 22],  // 11: eye zone
    [2, 22],  // 12: nose zone
    [2, 22],  // 13: mouth zone
    [2, 22],  // 14: jaw — stays wide
    [2, 22],  // 15: jaw — stays wide
    [3, 20],  // 16: lower jaw — gentle taper starts
    [4, 18],  // 17: chin
    [5, 16],  // 18: chin bottom
    [7, 12],  // 19: chin base
  ];

  // Fill entire head shape with hair base color
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, hairColors.base, HX + off, HY + r, w);
  }

  // ── Hair dome highlights and texture (rows 0-6) ─────────────────────────
  hLine(ctx, hairColors.highlight, HX + 5, HY, 8);
  hLine(ctx, hairColors.highlight, HX + 3, HY + 1, 12);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 2, 14);
  // Strand texture
  for (let r = 3; r <= 6; r++) {
    const [off, w] = HEAD[r];
    for (let dx = 3; dx < w - 3; dx += 5) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
  }
  // Hairline shadow transition (row 7)
  hLine(ctx, hairColors.shadow, HX + 1, HY + 7, 24);

  // ── FACE WINDOW — skin cutout within the head shape ──────────────────────
  // Face centered at x=46. Sideburns: 2px each side within 22px face zone.
  const FACE = [
    [39, 16],  //  7: hairline (sideburns narrow it)
    [37, 18],  //  8: forehead
    [37, 18],  //  9: brow level
    [37, 18],  // 10: eye zone
    [37, 18],  // 11: eye zone
    [37, 18],  // 12: nose zone
    [37, 18],  // 13: mouth zone
    [37, 18],  // 14: jaw — stays full width
    [37, 18],  // 15: jaw — stays full width
    [38, 16],  // 16: lower jaw — taper
    [39, 14],  // 17: chin
    [40, 12],  // 18: chin bottom
    [41, 10],  // 19: chin base
  ];
  const faceStartRow = 7;
  for (let i = 0; i < FACE.length; i++) {
    hLine(ctx, skinColors.base, FACE[i][0], HY + faceStartRow + i, FACE[i][1]);
  }

  // ── Face shading / volume ─────────────────────────────────────────────────
  // Forehead highlight band — lit from upper-left
  hLine(ctx, skinColors.highlight, 38, HY + 8, 6);
  px(ctx,    skinColors.highlight, 38, HY + 9);

  // Right-side shadow (face rounds away from light)
  for (let i = 2; i < FACE.length - 4; i++) {
    const [fx, fw] = FACE[i];
    px(ctx, skinColors.shadow, fx + fw - 2, HY + faceStartRow + i);
  }

  // Left cheekbone highlight
  px(ctx, skinColors.highlight, 38, HY + 12);
  // Right cheekbone shadow
  px(ctx, skinColors.shadow, 53, HY + 12);
  // Under-eye orbital depth shadows
  px(ctx, skinColors.shadow, 41, HY + 11);
  px(ctx, skinColors.shadow, 51, HY + 11);
  // Nose bridge highlight (between brows)
  px(ctx, skinColors.highlight, 46, HY + 9);
  // Lower jaw shadow band (strong chin/jaw definition)
  hLine(ctx, skinColors.shadow, 40, HY + 15, 8);
  hLine(ctx, skinColors.shadow, 41, HY + 16, 7);
  // Chin-area shadow
  hLine(ctx, skinColors.shadow, 42, HY + 17, 7);
  // Chin center highlight (volume)
  px(ctx, skinColors.highlight, 46, HY + 17);

  // ── Face outline (traces skin boundary) ──────────────────────────────────
  for (let i = 0; i < FACE.length; i++) {
    const [fx, fw] = FACE[i];
    const y = HY + faceStartRow + i;
    px(ctx, outline, fx, y);
    px(ctx, outline, fx + fw - 1, y);
  }

  // ── Eyebrows ─────────────────────────────────────────────────────────────
  hLine(ctx, hairColors.shadow, 40, HY + 9, 4);   // left brow
  hLine(ctx, hairColors.shadow, 49, HY + 9, 4);   // right brow

  // ── Eyes — dark pupils with catch-light, spaced wider on larger head ──────
  const eyeY = HY + 10;
  // Left eye: catch light + 2px pupil + lower shadow
  px(ctx, '#FFFFFF', 40, eyeY);          // catch light
  px(ctx, '#1A1008', 41, eyeY);          // dark pupil
  px(ctx, '#1A1008', 42, eyeY);          // dark pupil
  px(ctx, '#1A1008', 41, eyeY + 1);      // lower eye shadow
  // Right eye (catch light at upper-right)
  px(ctx, '#1A1008', 50, eyeY);          // dark pupil
  px(ctx, '#1A1008', 51, eyeY);          // dark pupil
  px(ctx, '#FFFFFF', 52, eyeY);          // catch light
  px(ctx, '#1A1008', 51, eyeY + 1);      // lower eye shadow

  // ── Nose — nostril shaping (centered at x=46) ────────────────────────────
  px(ctx, skinColors.shadow, 45, HY + 13);   // left nostril shadow
  px(ctx, skinColors.shadow, 46, HY + 13);   // nose tip
  px(ctx, skinColors.shadow, 47, HY + 13);   // right nostril shadow

  // Mouth removed — face form is expressed through shadow shaping alone

  // ── Head silhouette outline ──────────────────────────────────────────────
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    px(ctx, hairColors.shadow, HX + off, HY + r);
    px(ctx, hairColors.shadow, HX + off + w - 1, HY + r);
  }
  // Crown outline
  hLine(ctx, outline, HX + 5, HY, 16);
  // Chin bottom outline
  const last = HEAD[HEAD.length - 1];
  hLine(ctx, outline, HX + last[0], HY + HEAD.length, last[1]);

  // ── Hair style extensions ────────────────────────────────────────────────
  if (hairStyle === 'long') {
    for (let r = 0; r < 5; r++) {
      const hw = Math.max(3, 10 - r * 2);
      hLine(ctx, hairColors.base, HX, HY + HEAD.length + r, hw);
      hLine(ctx, hairColors.base, HX + HW - hw, HY + HEAD.length + r, hw);
    }
  } else if (hairStyle === 'medium') {
    for (let r = 14; r <= 17; r++) {
      const [off, w] = HEAD[r];
      px(ctx, hairColors.base, HX + off - 1, HY + r);
      px(ctx, hairColors.base, HX + off + w, HY + r);
    }
  } else if (hairStyle === 'curly') {
    for (let r = 7; r <= 16; r++) {
      const [off, w] = HEAD[r];
      const tone = (r % 2 === 0) ? hairColors.highlight : hairColors.shadow;
      px(ctx, tone, HX + off - 1, HY + r);
      px(ctx, tone, HX + off + w, HY + r);
    }
  } else if (hairStyle === 'undercut') {
    for (let r = 9; r <= 13; r++) {
      const [fx, fw] = FACE[r - faceStartRow] || [HX, HW];
      for (let x = HX; x < fx; x++) {
        erasePixel(ctx, x, HY + r);
      }
      for (let x = fx + fw; x < HX + HW; x++) {
        erasePixel(ctx, x, HY + r);
      }
    }
    hLine(ctx, hairColors.highlight, HX + 2, HY + 4, HW - 4);
    hLine(ctx, hairColors.highlight, HX + 2, HY + 5, HW - 5);
  } else {
    // 'short' (default) — spike tips above crown for styled look
    px(ctx, hairColors.shadow,    HX + 6,  HY - 1);
    px(ctx, hairColors.base,      HX + 9,  HY - 1);
    px(ctx, hairColors.highlight, HX + 11, HY - 1);
    px(ctx, hairColors.base,      HX + 14, HY - 1);
    px(ctx, hairColors.shadow,    HX + 15, HY - 1);
    px(ctx, hairColors.highlight, HX + 11, HY - 2);  // tallest center spike
  }
}

// drawHairSouth is now integrated into drawHeadSouth (hair-first unified head)
function drawHairSouth() {}

// ---------------------------------------------------------------------------
// drawHeadNorth  –  back of head, fixed at x=22, y=5  (20×18)
// ---------------------------------------------------------------------------

function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 33, HY = 26, HW = 26;
  const outline = '#111111';

  // Same rounded HEAD shape as south view — all hair, no face window
  const HEAD = [
    [5, 16], [3, 20], [2, 22], [1, 24],
    [1, 24], [1, 24], [1, 24], [1, 24],
    [2, 22], [2, 22], [2, 22], [2, 22],
    [2, 22], [2, 22], [2, 22], [2, 22],
    [3, 20], [4, 18], [5, 16], [7, 12],
  ];

  // Skin at neck/lower-back area (visible below hairline at back)
  fillRect(ctx, skinColors.base, HX + 5, HY + 16, HW - 10, 4);

  // Fill entire head with hair
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, hairColors.base, HX + off, HY + r, w);
  }

  // Highlights and texture
  hLine(ctx, hairColors.highlight, HX + 5, HY, 8);
  hLine(ctx, hairColors.highlight, HX + 3, HY + 1, 12);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 2, 14);
  for (let r = 3; r <= 6; r++) {
    const [off, w] = HEAD[r];
    for (let dx = 3; dx < w - 3; dx += 5) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
  }
  // Bottom shadow
  hLine(ctx, hairColors.shadow, HX + 8, HY + 18, 4);
  hLine(ctx, hairColors.shadow, HX + 9, HY + 19, 2);

  if (hairStyle === 'long') {
    for (let r = 0; r < 5; r++) {
      hLine(ctx, hairColors.base, HX + 1, HY + HEAD.length + r, HW - 2);
    }
    hLine(ctx, hairColors.shadow, HX + 1, HY + HEAD.length + 3, HW - 2);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HEAD.length + 4, HW - 2);
  }

  // Outline
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    px(ctx, outline, HX + off, HY + r);
    px(ctx, outline, HX + off + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + 5, HY, 16);
  const last = HEAD[HEAD.length - 1];
  hLine(ctx, outline, HX + last[0], HY + HEAD.length, last[1]);
}

// ---------------------------------------------------------------------------
// drawHeadWest  –  side profile facing LEFT, nose extends past HX
// ---------------------------------------------------------------------------

function drawHeadWest(ctx, skinColors, hairColors, hairStyle) {
  // Profile head: HX=31, HY=26. 20 rows — chin at y=45 meets neck at y=46.
  const HX = 31, HY = 26;
  const outline = '#111111';

  // Compact profile silhouette — max 15px wide
  const S = [
    [3,  9],  //  0  crown top
    [2, 11],  //  1  upper dome
    [1, 13],  //  2  dome
    [0, 15],  //  3  max width
    [0, 15],  //  4
    [0, 15],  //  5
    [0, 15],  //  6  hairline / face start
    [0, 15],  //  7  brow
    [0, 15],  //  8  eye zone
    [0, 15],  //  9  eye zone
    [0, 15],  // 10  nose (tip protrudes at HX-1)
    [0, 14],  // 11  nose lower
    [0, 14],  // 12  mouth
    [0, 14],  // 13  mouth
    [1, 12],  // 14  jaw
    [2, 10],  // 15  jaw
    [3,  9],  // 16  lower jaw
    [4,  8],  // 17  chin
    [5,  6],  // 18  chin
    [6,  5],  // 19  chin tip
  ];
  const HH = S.length; // 20

  // Fill with hair first (unified shape)
  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    hLine(ctx, hairColors.base, HX + xo, HY + r, w);
  }

  // Skin fill for face area (rows 6-17, narrower than full width)
  for (let r = 6; r <= 17; r++) {
    const [xo, w] = S[r];
    const faceW = Math.min(w - 3, 11); // leave 3px of hair at back
    hLine(ctx, skinColors.base, HX + xo, HY + r, faceW);
  }

  // Face shading
  for (let r = 6; r <= 11; r++) {
    px(ctx, skinColors.highlight, HX + 1, HY + r);
  }
  for (let r = 15; r <= 17; r++) {
    const [xo, w] = S[r];
    hLine(ctx, skinColors.shadow, HX + xo + 1, HY + r, Math.max(1, Math.min(w - 4, 5)));
  }

  // Dome highlights
  hLine(ctx, hairColors.highlight, HX + S[1][0] + 3, HY + 1, Math.max(1, S[1][1] - 7));
  hLine(ctx, hairColors.highlight, HX + 3, HY + 2, 6);
  hLine(ctx, hairColors.shadow, HX, HY + 6, S[6][1]);

  // Face features
  // ── Forehead highlight (upper face volume, lit from upper-left) ────────────
  px(ctx, skinColors.highlight, HX + 2, HY + 6);   // forehead top lit
  px(ctx, skinColors.highlight, HX + 3, HY + 7);   // forehead mid lit

  // ── Brow ridge ───────────────────────────────────────────────────────────
  hLine(ctx, hairColors.shadow, HX, HY + 7, 3);    // brow (left-edge to mid)

  // ── Eye — dark with catch-light ────────────────────────────────────────────
  px(ctx, '#FFFFFF', HX,     HY + 8);               // catch light (front corner)
  px(ctx, '#1A0800', HX + 1, HY + 8);              // eye dark
  px(ctx, skinColors.shadow, HX + 1, HY + 9);      // lower eyelid shadow (depth)

  // ── Cheekbone highlight (under-eye volume) ────────────────────────────────
  px(ctx, skinColors.highlight, HX + 3, HY + 10);  // cheekbone lit

  // ── Nose — tip + under-nose shadow ────────────────────────────────────────
  px(ctx, skinColors.shadow, HX - 1, HY + 10);     // nose tip (protrudes past face)
  px(ctx, skinColors.shadow, HX + 1, HY + 11);     // under-nose indentation

  // Mouth removed — face form expressed through shading alone

  // ── Ear ─────────────────────────────────────────────────────────────────────
  px(ctx, skinColors.shadow,    HX + 9, HY + 9);
  px(ctx, skinColors.highlight, HX + 8, HY + 10);
  px(ctx, skinColors.shadow,    HX + 9, HY + 11);

  // Back-of-head hair strip
  const backEnd = hairStyle === 'short' ? 13 : hairStyle === 'medium' ? 16 : HH;
  for (let r = 0; r < backEnd; r++) {
    const [xo, w] = S[r];
    px(ctx, hairColors.shadow, HX + xo + w - 3, HY + r);
    px(ctx, hairColors.base,   HX + xo + w - 2, HY + r);
    px(ctx, hairColors.base,   HX + xo + w - 1, HY + r);
  }
  if (hairStyle === 'long') {
    const [lxo, lw] = S[HH - 1];
    const bx = HX + lxo + lw - 1;
    vLine(ctx, hairColors.base, bx, HY + HH, 5);
    vLine(ctx, hairColors.base, bx - 1, HY + HH, 3);
    px(ctx, hairColors.shadow, bx, HY + HH + 4);
  }

  // Outline
  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    px(ctx, outline, HX + xo, HY + r);
    px(ctx, outline, HX + xo + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + S[0][0], HY, S[0][1]);
  hLine(ctx, outline, HX + S[HH-1][0], HY + HH - 1, S[HH-1][1]);
  px(ctx, outline, HX - 1, HY + 9);  // nose outline
  px(ctx, outline, HX - 1, HY + 11);
}

// ---------------------------------------------------------------------------
// drawNeckSouth
// ---------------------------------------------------------------------------

function drawNeckSouth(ctx, skinColors, baseY) {
  // Proportional neck: 11px wide × 2px
  const NX = 43, NW = 11, NH = 2;
  fillRect(ctx, skinColors.base, NX, baseY, NW, NH);
  vLine(ctx, skinColors.highlight, NX + 1, baseY, NH);
  vLine(ctx, skinColors.shadow,    NX + NW - 2, baseY, NH);
  outlineRect(ctx, skinColors.outline, NX, baseY, NW, NH);
}

// ---------------------------------------------------------------------------
// Jacket / Hoodie / Apron  (South)
// ---------------------------------------------------------------------------

function drawJacketSouth(ctx, colors, x, y, w, h) {
  // Clean jacket: subtle 3-tone shading, small collar hint, no prominent shirt panel
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const SHOULDER = 3, MID_S = 5, WAIST_S = 7, NARROW_S = 10, WAIST_E = 13;

  // 5-step V taper: shoulder → chest → mid → upper-waist → narrow-waist → hip
  const rl = (row) => {
    if (row < SHOULDER)   return x - 1;
    if (row < MID_S)      return x;
    if (row < WAIST_S)    return x + 1;
    if (row < NARROW_S)   return x + 2;
    if (row <= WAIST_E)   return x + 3;
    return x + 1;
  };
  const rr = (row) => {
    if (row < SHOULDER)   return x + w;
    if (row < MID_S)      return x + w - 1;
    if (row < WAIST_S)    return x + w - 2;
    if (row < NARROW_S)   return x + w - 3;
    if (row <= WAIST_E)   return x + w - 4;
    return x + w - 2;
  };

  // ── 1. Fill jacket base ──────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Subtle directional shading (left lit, right shadow) ───────────────
  for (let row = 0; row < numRows; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
  }

  // ── 3. Gentle waist shadow (not full-width fold lines) ───────────────────
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, rl(row) + 1, y + row);  // left waist crease
    px(ctx, colors.shadow, rr(row) - 1, y + row);  // right waist crease
  }

  // ── 4. Lapels + V-neck opening showing undershirt ─────────────────────────
  // V-neck widens row-by-row (2px → 6px over 7 rows) revealing shirt beneath lapels
  const shirtCol = colors.collar || colors.highlight;
  for (let r = 0; r < Math.min(7, numRows); r++) {
    const vHalf = Math.min(3, 1 + Math.floor(r * 0.45));
    const vX = cx - vHalf;
    const vW = vHalf * 2;
    hLine(ctx, shirtCol, vX, y + r, vW);           // shirt visible in V
    if (vX > rl(r) + 1) px(ctx, colors.shadow, vX - 1,    y + r);  // left lapel fold
    if (vX + vW <= rr(r)) px(ctx, colors.shadow, vX + vW, y + r);  // right lapel fold
  }
  // Center seam below lapels
  vLine(ctx, colors.shadow, cx, y + 7, numRows - 7);
  // Horizontal fold shadow (fabric compression under chest)
  hLine(ctx, colors.shadow, rl(9) + 2, y + 9, rr(9) - rl(9) - 4);
  // Button dots on placket
  if (numRows > 10) px(ctx, colors.outline, cx, y + 11);
  if (numRows > 14) px(ctx, colors.outline, cx, y + 15);

  // ── 5. Selout outline ────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  hLine(ctx, colors.outline, x - 1, y, w + 2);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
}

function drawHoodieSouth(ctx, colors, x, y, w, h) {
  // Clean hoodie: subtle shading, small hood collar, center zip, small pocket
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const SHOULDER = 3, MID_S = 5, WAIST_S = 7, NARROW_S = 10, WAIST_E = 13;

  // 5-step V taper
  const rl = (row) => {
    if (row < SHOULDER)   return x - 1;
    if (row < MID_S)      return x;
    if (row < WAIST_S)    return x + 1;
    if (row < NARROW_S)   return x + 2;
    if (row <= WAIST_E)   return x + 3;
    return x + 1;
  };
  const rr = (row) => {
    if (row < SHOULDER)   return x + w;
    if (row < MID_S)      return x + w - 1;
    if (row < WAIST_S)    return x + w - 2;
    if (row < NARROW_S)   return x + w - 3;
    if (row <= WAIST_E)   return x + w - 4;
    return x + w - 2;
  };

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Subtle directional shading
  for (let row = 0; row < numRows; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    px(ctx, colors.shadow,    rr(row) - 1, y + row);
  }

  // Hood collar: 10px × 4 rows with highlight/shadow
  const hoodX = cx - 5;
  fillRect(ctx, colors.collar, hoodX, y, 10, 4);
  hLine(ctx, colors.highlight, hoodX + 1, y,     8);   // top highlight
  hLine(ctx, colors.shadow,    hoodX + 1, y + 3, 8);   // bottom shadow
  outlineRect(ctx, colors.outline, hoodX, y, 10, 4);

  // Center zipper (below 4-row collar)
  vLine(ctx, colors.shadow, cx, y + 4, numRows - 4);

  // Horizontal fold shadow at chest level
  hLine(ctx, colors.shadow, rl(8) + 2, y + 8, rr(8) - rl(8) - 4);

  // Kangaroo pocket: 10px × 5px, base-filled with stitching + center divider
  const pkw = 10, pkh = 5;
  const pkx = cx - Math.floor(pkw / 2);
  const pky = y + Math.floor(numRows * 0.55);
  fillRect(ctx, colors.base, pkx, pky, pkw, pkh);
  hLine(ctx, colors.shadow, pkx + 1, pky,           pkw - 2);  // top stitch line
  hLine(ctx, colors.shadow, pkx + 1, pky + pkh - 1, pkw - 2);  // bottom stitch line
  px(ctx, colors.shadow, cx, pky + 1);  // center divider
  px(ctx, colors.shadow, cx, pky + 2);
  px(ctx, colors.shadow, cx, pky + 3);
  outlineRect(ctx, colors.outline, pkx, pky, pkw, pkh);

  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);

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

  // Apron bib: wider (x+3, w-6), full-height from row 0
  const ax = x + 3, aw = w - 6;
  fillRect(ctx, colors.base, ax, y, aw, h);
  vLine(ctx, colors.highlight, ax + 1, y, h);
  vLine(ctx, colors.shadow,    ax + aw - 2, y, h);
  // Horizontal bib trim line at row 3
  hLine(ctx, colors.shadow, ax + 1, y + 3, aw - 2);
  // Neck strap hint at top center
  hLine(ctx, colors.collar, ax + 2, y, 4);

  // Tie strings at top corners
  fillRect(ctx, colors.collar, x + 1, y, 3, 4);
  fillRect(ctx, colors.collar, x + w - 4, y, 3, 4);

  outlineRect(ctx, colors.outline, ax, y, aw, h);
  outlineRect(ctx, '#404060',      x,  y,     w,  h);
}

function drawShirtSouth(ctx, colors, x, y, w, h) {
  // Plain collared shirt — 5-step V silhouette, shirt collar at top.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 3, MID_S = 5, WAIST_S = 8, NARROW_S = 11, WAIST_E = 15;
  const rl = (row) => row < SHOULDER ? x - 1 : row < MID_S ? x : row < WAIST_S ? x + 1 : row < NARROW_S ? x + 2 : row <= WAIST_E ? x + 3 : x + 1;
  const rr = (row) => row < SHOULDER ? x + w : row < MID_S ? x + w - 1 : row < WAIST_S ? x + w - 2 : row < NARROW_S ? x + w - 3 : row <= WAIST_E ? x + w - 4 : x + w - 2;

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

function drawVestSouth(ctx, colors, x, y, w, h) {
  // Leather vest over shirt: shirt visible at sides, vest in center.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 3, MID_S = 5, WAIST_S = 8, NARROW_S = 11, WAIST_E = 15;
  const rl = (row) => row < SHOULDER ? x - 1 : row < MID_S ? x : row < WAIST_S ? x + 1 : row < NARROW_S ? x + 2 : row <= WAIST_E ? x + 3 : x + 1;
  const rr = (row) => row < SHOULDER ? x + w : row < MID_S ? x + w - 1 : row < WAIST_S ? x + w - 2 : row < NARROW_S ? x + w - 3 : row <= WAIST_E ? x + w - 4 : x + w - 2;

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
  px(ctx, colors.highlight, x - 1, y + 1);
}

function drawTunicSouth(ctx, colors, x, y, w, h) {
  // RPG tunic: wider cut than jacket, rounded collar, minimal seam.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 3, MID_S = 5, WAIST_S = 8, NARROW_S = 11, WAIST_E = 15;
  const rl = (row) => row < SHOULDER ? x - 1 : row < MID_S ? x : row < WAIST_S ? x + 1 : row < NARROW_S ? x + 2 : row <= WAIST_E ? x + 3 : x + 1;
  const rr = (row) => row < SHOULDER ? x + w : row < MID_S ? x + w - 1 : row < WAIST_S ? x + w - 2 : row < NARROW_S ? x + w - 3 : row <= WAIST_E ? x + w - 4 : x + w - 2;

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

function drawRobeSouth(ctx, colors, x, y, w, h) {
  // Mage robe: wide at bottom, ornate collar, deep shadow folds.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 24);
  const SHOULDER = 3;
  // Robes have minimal taper — flare wider at bottom
  const rl = (row) => row < SHOULDER ? x - 1 : row > 14 ? x - 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : row > 14 ? x + w : x + w - 1;

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
  // Crew-neck T-shirt: 5-step V silhouette, round neckline, no buttons/placket.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const SHOULDER = 3, MID_S = 5, WAIST_S = 8, NARROW_S = 11, WAIST_E = 15;
  const rl = (row) => row < SHOULDER ? x - 1 : row < MID_S ? x : row < WAIST_S ? x + 1 : row < NARROW_S ? x + 2 : row <= WAIST_E ? x + 3 : x + 1;
  const rr = (row) => row < SHOULDER ? x + w : row < MID_S ? x + w - 1 : row < WAIST_S ? x + w - 2 : row < NARROW_S ? x + w - 3 : row <= WAIST_E ? x + w - 4 : x + w - 2;

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
}

function drawBomberSouth(ctx, colors, x, y, w, h) {
  // Bomber jacket: boxy V-shape silhouette, ribbed collar+hem, center zipper.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 24);
  const SHOULDER = 3, MID_S = 7;
  // Boxy cut: shallow waist taper
  const WAIST_S = 10, NARROW_S = 12, WAIST_E = 15;
  const rl = (row) => row < SHOULDER ? x - 1 : row < MID_S ? x : row < WAIST_S ? x + 1 : row < NARROW_S ? x + 2 : row <= WAIST_E ? x + 3 : x + 1;
  const rr = (row) => row < SHOULDER ? x + w : row < MID_S ? x + w - 1 : row < WAIST_S ? x + w - 2 : row < NARROW_S ? x + w - 3 : row <= WAIST_E ? x + w - 4 : x + w - 2;

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
  const SHOULDER = 3, MID_S = 5, WAIST_S = 8, NARROW_S = 11, WAIST_E = 15;
  const tailH  = 8;                      // coat extension — shows most of the legs
  const totalH = h + tailH;

  // 5-step V taper: shoulder widest, organic narrow at waist, lower coat flares
  const rl = (row) => {
    if (row < SHOULDER)   return x - 1;
    if (row < MID_S)      return x;
    if (row < WAIST_S)    return x + 1;
    if (row < NARROW_S)   return x + 2;
    if (row <= WAIST_E)   return x + 3;
    if (row < h)          return x + 1;
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);
    return x - flare;
  };
  const rr = (row) => {
    if (row < SHOULDER)   return x + w;
    if (row < MID_S)      return x + w - 1;
    if (row < WAIST_S)    return x + w - 2;
    if (row < NARROW_S)   return x + w - 3;
    if (row <= WAIST_E)   return x + w - 4;
    if (row < h)          return x + w - 2;
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);
    return x + w - 1 + flare;
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

// ---------------------------------------------------------------------------
// drawTorsoAccentsSouth  –  common shoulder cap + chest highlight band
// Applied after every torso type to add volume/form reads consistent with
// the reference sprites: left-lit pectoral highlight, bright shoulder cap.
// ---------------------------------------------------------------------------

function drawTorsoAccentsSouth(ctx, clothingColors, x, y, w) {
  // Shoulder cap: 2 highlight rows, lit from upper-left
  hLine(ctx, clothingColors.highlight, x + 1, y,     Math.floor(w * 0.45));
  hLine(ctx, clothingColors.highlight, x + 1, y + 1, Math.floor(w * 0.30));

  // Left pectoral highlight band — tapered triangle
  hLine(ctx, clothingColors.highlight, x + 1, y + 2, 7);
  hLine(ctx, clothingColors.highlight, x + 1, y + 3, 5);
  hLine(ctx, clothingColors.highlight, x + 1, y + 4, 3);
  hLine(ctx, clothingColors.highlight, x + 1, y + 5, 2);

  // Mid-torso horizontal fold shadow (fabric compression below chest)
  hLine(ctx, clothingColors.shadow, x + 2, y + 8, w - 4);

  // Step-corner AA at every silhouette transition — blends the stepped
  // V-taper into an organic curved armhole/waist sweep
  px(ctx, clothingColors.shadow, x - 1, y + 3);   // shoulder→chest
  px(ctx, clothingColors.shadow, x + w, y + 3);
  px(ctx, clothingColors.shadow, x,     y + 5);   // chest→mid
  px(ctx, clothingColors.shadow, x + w - 1, y + 5);
  px(ctx, clothingColors.shadow, x + 1, y + 7);   // mid→upper-waist
  px(ctx, clothingColors.shadow, x + w - 2, y + 7);
  px(ctx, clothingColors.shadow, x + 2, y + 10);  // upper→narrow-waist
  px(ctx, clothingColors.shadow, x + w - 3, y + 10);

  // Right-side pec shadow strip (torso cylinder: surface curves away from light)
  vLine(ctx, clothingColors.shadow, x + w - 3, y + 2, 5);
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
  // Common chest / shoulder accent highlights for all clothing types
  drawTorsoAccentsSouth(ctx, clothingColors, x, y, w);
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
  const h = isCoat ? 22 : 16;
  const SHOULDER = 3, WAIST_S = 8, WAIST_E = 13;

  const rowW = (row) => {
    if (row < SHOULDER)                       return 16;  // full shoulder
    if (row >= WAIST_S && row <= WAIST_E)    return 13;  // narrow waist
    return 15;                                             // chest/hip
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
  // Belt / hip band: 20px wide, anchors torso-to-leg transition.
  const w = 20, h = 3;
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
  const w = 16, h = 3;
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
  const legH = 22;
  const KNEE_ROW = 6;
  // Narrower legs: lx=40, rx=49, 7px thigh with 2px inner gap
  const lx = 40 + Math.round(lLegDX);
  const rx = 49 + Math.round(rLegDX);
  const y  = baseY;

  // Organic leg shape: thigh → knee → calf swell → shin → ankle
  const rows = [
    [0, 7], [0, 7], [0, 7], [0, 7], [0, 7],  // 0-4: thigh 7px
    [0, 6], [0, 6], [0, 6],                   // 5-7: knee taper 6px
    [0, 5], [0, 5], [0, 5],                   // 8-10: knee 5px
    [0, 6], [0, 6], [0, 6], [0, 6],           // 11-14: calf swell 6px
    [0, 5], [0, 5], [0, 5], [0, 5],           // 15-18: lower shin 5px
    [0, 4], [0, 4], [0, 4],                   // 19-21: ankle 4px
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
    // Thigh cylinder highlight (rows 1, 3) + kneecap highlight extension (rows 7-9)
    if (row === 1 || row === 3 || (row >= 7 && row <= 9)) px(ctx, lHiColor, llx + 2, lRowY);
    // Knee crease shadow (rows 11-12) — organic knee protrusion
    if (row === 11 || row === 12) hLine(ctx, pantColors.shadow, llx + 1, lRowY, lw - 2);
    px(ctx, pantColors.shadow, llx, lRowY);                  // selout outer edge
    // Inner edge: darker outline at thigh (rows 0-5), shadow below
    px(ctx, row <= 5 ? pantColors.outline : pantColors.shadow, llx + lw - 1, lRowY);

    // ── Right leg ─────────────────────────────────────────────────────────────
    const rrw    = lw;
    const rrEnd  = rx + rrw - 1;   // outer pixel of right leg
    hLine(ctx, rBaseColor,  rx,        rRowY, rrw);
    px(ctx, rHiColor,       rrEnd - 1, rRowY);               // outer lit face
    px(ctx, pantColors.shadow, rx + 1, rRowY);               // inner shadow
    // Thigh cylinder highlight (rows 1, 3) + kneecap highlight extension (rows 7-9)
    if (row === 1 || row === 3 || (row >= 7 && row <= 9)) px(ctx, rHiColor, rrEnd - 2, rRowY);
    // Knee crease shadow (rows 11-12)
    if (row === 11 || row === 12) hLine(ctx, pantColors.shadow, rx + 1, rRowY, rrw - 2);
    px(ctx, pantColors.shadow, rrEnd, rRowY);                 // selout outer edge
    // Inner edge: darker outline at thigh (rows 0-5), shadow below
    px(ctx, row <= 5 ? pantColors.outline : pantColors.shadow, rx, rRowY);
  }

  // Top outlines (fixed — thigh junction, belt covers this area)
  hLine(ctx, pantColors.outline, lx, y, rows[0][1]);
  hLine(ctx, pantColors.outline, rx, y, rows[0][1]);
  // Bottom outlines at shifted ankle positions
  const lBotY = y + legH - 1 + Math.round(lLegDY);
  const rBotY = y + legH - 1 + Math.round(rLegDY);
  hLine(ctx, pantColors.outline, lx, lBotY, rows[legH - 1][1]);
  hLine(ctx, pantColors.outline, rx, rBotY, rows[legH - 1][1]);

  // Organic crotch seam — legs meet in a soft V-apex, crease darkens
  // downward through the zipper line, then opens into a transparent gap.
  const gapX = lx + rows[0][1];
  const gapW = rx - gapX;
  if (gapW > 0) {
    ctx.clearRect(gapX, y, gapW, legH);
    // Row 0: shadow fill — legs "touch" here (V apex closed)
    hLine(ctx, pantColors.shadow,  gapX, y,     gapW);
    // Row 1: deepest crease (darkest point, one row below apex)
    hLine(ctx, pantColors.outline, gapX, y + 1, gapW);
    // Row 2: shadow softens as crease opens
    hLine(ctx, pantColors.shadow,  gapX, y + 2, gapW);
    // Row 3+: transparent (inner thigh gap)
  }
  // AA pixel at the very top of each leg's inner edge to round the
  // junction where the thighs meet — reads as an organic curve
  if (gapW > 0) {
    px(ctx, pantColors.outline, gapX - 1, y);         // left leg inner top corner
    px(ctx, pantColors.outline, gapX + gapW, y);      // right leg inner top corner
  }
}

// ---------------------------------------------------------------------------
// drawLegsWest  –  side profile legs with stride
// ---------------------------------------------------------------------------

function drawLegsWest(ctx, pantColors, frontLegX, backLegX, legTopY, frontLift=0, backLift=0) {
  // SNES-style profile legs: taper thigh→knee→shin→ankle.
  // Knee bump: kneecap protrudes 1px toward front (lower X in west view).
  // 26 rows scaled from 17-row 64px layout.
  const legH = 22;

  // Narrower profile legs: thigh 6px, knee bump 7px, shin 5px, ankle 4px
  const frontRows = [
    [-2, 6], [-2, 6], [-2, 6], [-2, 6], [-2, 6],  // 0-4: thigh
    [-3, 7], [-3, 7], [-3, 7], [-3, 7],            // 5-8: knee bump
    [-2, 6], [-2, 6], [-2, 6], [-2, 6],            // 9-12: calf
    [-2, 5], [-2, 5], [-2, 5], [-2, 5], [-2, 5],   // 13-17: shin
    [-1, 4], [-1, 4], [-1, 4], [-1, 4],            // 18-21: ankle
  ];
  const backRows = [
    [-2, 6], [-2, 6], [-2, 6], [-2, 6], [-2, 6],
    [-2, 6], [-2, 6], [-2, 6], [-2, 6],
    [-2, 6], [-2, 6], [-2, 6], [-2, 6],
    [-2, 5], [-2, 5], [-2, 5], [-2, 5], [-2, 5],
    [-1, 4], [-1, 4], [-1, 4], [-1, 4],
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
  const sw = 11, sh = 5;
  const lx = 38 + Math.round(lShoeDX);
  const rx = 48 + Math.round(rShoeDX);
  const ly = baseY + Math.round(lShoeDY);
  const ry = baseY + Math.round(rShoeDY);

  // ── Left shoe ─────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, lx, ly, sw, sh);
  // Vamp highlight (mid-top of shoe)
  hLine(ctx, shoeColors.highlight, lx + 4, ly,     sw - 5);
  hLine(ctx, shoeColors.highlight, lx + 5, ly + 1, sw - 7);
  // Toe cap (outer/left 3px — brighter than vamp)
  hLine(ctx, shoeColors.highlight, lx,     ly,     3);
  px(ctx,    shoeColors.highlight, lx,     ly + 1);
  // Toe cap divider shadow
  px(ctx, shoeColors.shadow, lx + 3, ly + 1);
  px(ctx, shoeColors.shadow, lx + 3, ly + 2);
  // Sole (shadow row + outline row)
  hLine(ctx, shoeColors.shadow,  lx, ly + sh - 2, sw);
  hLine(ctx, shoeColors.outline, lx, ly + sh - 1, sw);
  outlineRect(ctx, shoeColors.outline, lx, ly, sw, sh);

  // ── Right shoe ────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, rx, ry, sw, sh);
  // Vamp highlight
  hLine(ctx, shoeColors.highlight, rx + 1, ry,     sw - 5);
  hLine(ctx, shoeColors.highlight, rx + 2, ry + 1, sw - 7);
  // Toe cap (outer/right 3px — brighter)
  hLine(ctx, shoeColors.highlight, rx + sw - 3, ry,     3);
  px(ctx,    shoeColors.highlight, rx + sw - 3, ry + 1);
  // Toe cap divider shadow
  px(ctx, shoeColors.shadow, rx + sw - 4, ry + 1);
  px(ctx, shoeColors.shadow, rx + sw - 4, ry + 2);
  // Sole
  hLine(ctx, shoeColors.shadow,  rx, ry + sh - 2, sw);
  hLine(ctx, shoeColors.outline, rx, ry + sh - 1, sw);
  outlineRect(ctx, shoeColors.outline, rx, ry, sw, sh);
}

// ---------------------------------------------------------------------------
// drawShoesWest  –  side profile shoes
// ---------------------------------------------------------------------------

function drawShoesWest(ctx, shoeColors, frontX, backX, shoeY, frontLift=0, backLift=0) {
  // Positive lift = foot goes higher on screen = smaller Y value
  const frontY = shoeY - Math.round(frontLift);
  const backY  = shoeY - Math.round(backLift);

  // Back shoe (dimmer, drawn first)
  fillRect(ctx, shoeColors.shadow, backX - 3, backY, 10, 5);
  hLine(ctx, shoeColors.shadow, backX - 3, backY + 4, 10);
  outlineRect(ctx, shoeColors.outline, backX - 3, backY, 10, 5);

  // Front shoe: pointing left (toe at lower-x = facing direction)
  fillRect(ctx, shoeColors.base, frontX - 7, frontY, 15, 5);
  hLine(ctx, shoeColors.highlight, frontX - 6, frontY, 12);
  hLine(ctx, shoeColors.shadow,    frontX - 7, frontY + 3, 15);
  hLine(ctx, shoeColors.shadow,    frontX - 7, frontY + 4, 15);
  outlineRect(ctx, shoeColors.outline, frontX - 7, frontY, 15, 5);
}

// ---------------------------------------------------------------------------
// drawArmsSouth
// ---------------------------------------------------------------------------

function drawArmsSouth(ctx, clothingColors, skinColors, lArmDY, rArmDY, lArmOut=0, rArmOut=0, torsoY=28) {
  // Arms with shoulder pivot. 5px wide shoulder → 4px wrist taper.
  const lx = 34;                // left arm outer-edge (tight to shoulder)
  const shoulderRX = 59;        // right arm left-edge (tight to shoulder)
  const baseY = torsoY;
  const baseAW = 5, sleeveH = 13, handH = 4;
  const maxRow = sleeveH - 1;
  // Elbow: arm tapers from 5px to 4px halfway down (row 8+ gets 4px wide)
  const elbowRow = 8;
  const wristAW = 4;
  const armW = (row) => row < elbowRow ? baseAW : wristAW;

  // Left arm: full 2D pivot (mirrors right arm)
  const lRowX = (row) => lx        + Math.round(lArmOut * row / maxRow);
  const lRowY = (row) => baseY     + Math.round(lArmDY  * row / maxRow) + row;
  const lArmX = lx    + Math.round(lArmOut);
  const lArmY = baseY + Math.round(lArmDY);

  // Right arm: full 2D pivot
  const rRowX = (row) => shoulderRX + Math.round(rArmOut * row / maxRow);
  const rRowY = (row) => baseY      + Math.round(rArmDY  * row / maxRow) + row;
  const rArmX = shoulderRX + Math.round(rArmOut);
  const rArmY = baseY      + Math.round(rArmDY);

  // ── Left arm (lit side — cylindrical shading with taper) ─────────────────
  for (let row = 0; row < sleeveH; row++) {
    const rX = lRowX(row);
    const ry = lRowY(row);
    const aw = armW(row);
    hLine(ctx, clothingColors.base,   rX,     ry, aw);
    px(ctx, clothingColors.shadow,    rX,     ry);        // outer selout
    px(ctx, clothingColors.highlight, rX + 1, ry);        // highlight peak
    px(ctx, clothingColors.shadow,    rX + aw - 1, ry);   // inner shadow (toward torso)
  }
  hLine(ctx, clothingColors.shadow, lRowX(maxRow), lRowY(maxRow), armW(maxRow));

  // Left hand / fist (4px wide with knuckle highlights)
  const lhw = 4;
  const lhx = lArmX;
  fillRect(ctx, skinColors.base,    lhx,     lArmY + sleeveH, lhw, handH);
  px(ctx,    skinColors.highlight,  lhx + 1, lArmY + sleeveH);
  px(ctx,    skinColors.highlight,  lhx + 2, lArmY + sleeveH);
  hLine(ctx, skinColors.shadow,     lhx,     lArmY + sleeveH + handH - 1, lhw);
  outlineRect(ctx, skinColors.outline, lhx,  lArmY + sleeveH, lhw, handH);

  // ── Right arm (shadow side — muted, with taper) ───────────────────────────
  for (let row = 0; row < sleeveH; row++) {
    const rx = rRowX(row);
    const ry = rRowY(row);
    const aw = armW(row);
    hLine(ctx, clothingColors.base,  rx,         ry, aw);
    px(ctx, clothingColors.shadow,   rx,         ry);     // inner shadow (toward torso)
    if (aw >= 5) px(ctx, clothingColors.shadow, rx + 1, ry);  // secondary shadow (wide sleeve only)
    px(ctx, clothingColors.shadow,   rx + aw - 1, ry);    // outer selout
  }
  hLine(ctx, clothingColors.shadow, rRowX(maxRow), rRowY(maxRow), armW(maxRow));

  // Right hand / fist (4px wide)
  const rhw = 4;
  const rhx = rArmX;
  fillRect(ctx, skinColors.base,    rhx, rArmY + sleeveH, rhw, handH);
  hLine(ctx, skinColors.shadow,     rhx, rArmY + sleeveH + handH - 1, rhw);
  outlineRect(ctx, skinColors.outline, rhx, rArmY + sleeveH, rhw, handH);
}

// ---------------------------------------------------------------------------
// drawBackArmWest / drawFrontArmWest
// Split into two functions so the front arm can be drawn AFTER the torso,
// making it visually "in front" of the body. The back arm is called first.
// Front arm = face-side arm (x ≈ torsoX-3, always lower X = always visible).
// Back arm  = body-back-side arm (x ≈ torsoX+9, always higher X = behind torso).
// ---------------------------------------------------------------------------

function drawBackArmWest(ctx, clothingColors, skinColors, backArmDX, torsoX, torsoY) {
  const sleeveH = 13, handH = 4, aw = 5;
  const backY      = torsoY + 1;
  const shoulderX  = torsoX + 11;
  const maxRow     = sleeveH - 1;
  const rowX = (row) => shoulderX + Math.round(backArmDX * row / maxRow);
  const wristX = shoulderX + Math.round(backArmDX);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    hLine(ctx, clothingColors.shadow, rx, backY + row, aw);
    px(ctx, clothingColors.base,    rx + 1, backY + row);  // inner lighter strip
    px(ctx, clothingColors.base,    rx + 2, backY + row);  // second lighter strip
    px(ctx, clothingColors.outline, rx,          backY + row);
    px(ctx, clothingColors.outline, rx + aw - 1, backY + row);
  }
  hLine(ctx, clothingColors.outline, rowX(0),      backY,          aw);
  hLine(ctx, clothingColors.outline, rowX(maxRow), backY + maxRow, aw);
  fillRect(ctx, skinColors.shadow, wristX, backY + sleeveH, 4, handH);
  outlineRect(ctx, skinColors.outline, wristX, backY + sleeveH, 4, handH);
}

function drawFrontArmWest(ctx, clothingColors, skinColors, frontArmDX, torsoX, torsoY) {
  const sleeveH = 13, handH = 4, aw = 5;
  const frontY     = torsoY + 1;
  const shoulderX  = torsoX - 1;
  const maxRow     = sleeveH - 1;
  const rowX = (row) => shoulderX + Math.round(frontArmDX * row / maxRow);
  const wristX = shoulderX + Math.round(frontArmDX);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    hLine(ctx, clothingColors.base,    rx, frontY + row, aw);
    px(ctx, clothingColors.highlight,  rx + 1,      frontY + row);  // highlight peak
    // rx+2 = base (mid cylinder)
    px(ctx, clothingColors.shadow,     rx + aw - 2, frontY + row);  // shadow start (rx+3)
    px(ctx, clothingColors.shadow,     rx + aw - 1, frontY + row);  // shadow back edge (rx+4)
  }
  hLine(ctx, clothingColors.outline, rowX(0),      frontY,          aw);
  hLine(ctx, clothingColors.outline, rowX(maxRow), frontY + maxRow, aw);

  fillRect(ctx, skinColors.base,    wristX,     frontY + sleeveH, 4, handH);
  px(ctx,    skinColors.highlight,  wristX + 1, frontY + sleeveH);
  px(ctx,    skinColors.highlight,  wristX + 2, frontY + sleeveH);
  hLine(ctx, skinColors.shadow,     wristX,     frontY + sleeveH + handH - 1, 4);
  outlineRect(ctx, skinColors.outline, wristX,  frontY + sleeveH, 4, handH);
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
