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
  const HX = 17, HY = 26, HW = 30;
  const cx = HX + Math.floor(HW / 2); // center x = 32
  const outline = '#111111';

  // ── HEAD SHAPE — chibi: taller rounder skull (24 rows, 28px wide at max) ──
  const HEAD = [
    [8, 14],  //  0: crown tip       (y=26)
    [5, 18],  //  1: upper crown     (y=27)
    [3, 22],  //  2: crown           (y=28)
    [2, 24],  //  3: dome top        (y=29)
    [5, 20],  //  4: crown body
    [3, 24],  //  5: upper dome
    [2, 26],  //  6: dome
    [1, 28],  //  7: max width
    [1, 28],  //  8: max width
    [1, 28],  //  9: max width
    [1, 28],  // 10: temple
    [1, 28],  // 11: hairline — faceStartRow
    [2, 26],  // 12: forehead
    [2, 26],  // 13: brow level
    [2, 26],  // 14: eye zone
    [2, 26],  // 15: eye zone
    [2, 26],  // 16: nose zone
    [2, 26],  // 17: mouth zone
    [2, 26],  // 18: jaw wide
    [2, 26],  // 19: jaw wide
    [3, 24],  // 20: lower jaw taper
    [4, 22],  // 21: chin
    [5, 20],  // 22: chin bottom
    [7, 16],  // 23: chin base
  ];

  // Fill entire head shape with hair base color
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, hairColors.base, HX + off, HY + r, w);
  }

  // ── Hair dome highlights and texture (rows 0-10) ─────────────────────────
  hLine(ctx, hairColors.highlight, HX + 9, HY,     5);   // crown tip
  hLine(ctx, hairColors.highlight, HX + 6, HY + 1, 10);
  hLine(ctx, hairColors.highlight, HX + 4, HY + 2, 14);
  hLine(ctx, hairColors.highlight, HX + 3, HY + 3, 18);
  hLine(ctx, hairColors.highlight, HX + 5, HY + 4, 10);
  hLine(ctx, hairColors.highlight, HX + 3, HY + 5, 16);
  hLine(ctx, hairColors.highlight, HX + 2, HY + 6, 20);
  // Strand texture rows 7-10
  for (let r = 7; r <= 10; r++) {
    const [off, w] = HEAD[r];
    for (let dx = 3; dx < w - 3; dx += 5) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
  }
  // Hairline shadow transition (faceStartRow=11)
  hLine(ctx, hairColors.shadow, HX + 1, HY + 11, 28);

  // ── FACE WINDOW — skin cutout within the head shape ──────────────────────
  // Face centered at cx=48. Sideburns: ~2px each side.
  const FACE = [
    [23, 20],  // 11: hairline (sideburns narrow it)
    [21, 22],  // 12: forehead
    [21, 22],  // 13: brow level
    [21, 22],  // 14: eye zone
    [21, 22],  // 15: eye zone
    [21, 22],  // 16: nose zone
    [21, 22],  // 17: mouth zone
    [21, 22],  // 18: jaw wide
    [21, 22],  // 19: jaw wide
    [22, 20],  // 20: lower jaw taper
    [23, 18],  // 21: chin
    [24, 16],  // 22: chin bottom
    [25, 14],  // 23: chin base
  ];
  const faceStartRow = 11;
  for (let i = 0; i < FACE.length; i++) {
    hLine(ctx, skinColors.base, FACE[i][0], HY + faceStartRow + i, FACE[i][1]);
  }

  // ── Face shading / volume ─────────────────────────────────────────────────
  // Forehead highlight band — lit from upper-left
  hLine(ctx, skinColors.highlight, 22, HY + 12, 6);
  px(ctx,    skinColors.highlight, 22, HY + 13);

  // Right-side shadow (face rounds away from light)
  for (let i = 2; i < FACE.length - 4; i++) {
    const [fx, fw] = FACE[i];
    px(ctx, skinColors.shadow, fx + fw - 2, HY + faceStartRow + i);
  }

  // Left cheekbone highlight
  px(ctx, skinColors.highlight, 22, HY + 16);
  // Right cheekbone shadow
  px(ctx, skinColors.shadow, 41, HY + 16);
  // Under-eye orbital depth shadows
  px(ctx, skinColors.shadow, 25, HY + 15);
  px(ctx, skinColors.shadow, 39, HY + 15);
  // Nose bridge highlight (between brows)
  px(ctx, skinColors.highlight, 32, HY + 13);
  // Lower jaw shadow band (strong chin/jaw definition)
  hLine(ctx, skinColors.shadow, 24, HY + 19, 10);
  hLine(ctx, skinColors.shadow, 25, HY + 20, 9);
  // Chin-area shadow
  hLine(ctx, skinColors.shadow, 26, HY + 21, 9);
  // Chin center highlight (volume)
  px(ctx, skinColors.highlight, 32, HY + 21);

  // ── Face outline (traces skin boundary) ──────────────────────────────────
  for (let i = 0; i < FACE.length; i++) {
    const [fx, fw] = FACE[i];
    const y = HY + faceStartRow + i;
    px(ctx, outline, fx, y);
    px(ctx, outline, fx + fw - 1, y);
  }

  // ── Eyebrows ─────────────────────────────────────────────────────────────
  hLine(ctx, hairColors.shadow, 24, HY + 13, 5);   // left brow
  hLine(ctx, hairColors.shadow, 37, HY + 13, 5);   // right brow

  // ── Eyes — sclera + colored iris + pupil + lash lines ───────────────────
  // Left center=25, right center=39 (symmetric around cx=32 in 64px frame)
  const eyeY = HY + 14;
  // Left eye
  px(ctx, eyeColors.lash,  25, eyeY - 1);   // upper lash
  px(ctx, '#FFFFFF',        24, eyeY);        // sclera / catch-light
  px(ctx, eyeColors.iris,   25, eyeY);        // iris
  px(ctx, eyeColors.pupil,  26, eyeY);        // pupil (darkest)
  px(ctx, eyeColors.lash,   25, eyeY + 1);   // lower lid shadow
  // Right eye (mirrored — sclera on outer side)
  px(ctx, eyeColors.lash,  39, eyeY - 1);   // upper lash
  px(ctx, eyeColors.pupil,  38, eyeY);        // pupil
  px(ctx, eyeColors.iris,   39, eyeY);        // iris
  px(ctx, '#FFFFFF',        40, eyeY);        // sclera / catch-light
  px(ctx, eyeColors.lash,   39, eyeY + 1);   // lower lid shadow

  // ── Nose — nostril shaping (centered at cx=32) ────────────────────────────
  px(ctx, skinColors.shadow, 31, HY + 17);   // left nostril shadow
  px(ctx, skinColors.shadow, 32, HY + 17);   // nose tip
  px(ctx, skinColors.shadow, 33, HY + 17);   // right nostril shadow

  // Mouth removed — face form is expressed through shadow shaping alone

  // ── Head silhouette outline ──────────────────────────────────────────────
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    px(ctx, hairColors.shadow, HX + off, HY + r);
    px(ctx, hairColors.shadow, HX + off + w - 1, HY + r);
  }
  // Crown outline (matches HEAD[0] = [8,14])
  hLine(ctx, outline, HX + 8, HY, 14);
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
    for (let r = 18; r <= 21; r++) {
      const [off, w] = HEAD[r];
      px(ctx, hairColors.base, HX + off - 1, HY + r);
      px(ctx, hairColors.base, HX + off + w, HY + r);
    }
  } else if (hairStyle === 'curly') {
    for (let r = 11; r <= 20; r++) {
      const [off, w] = HEAD[r];
      const tone = (r % 2 === 0) ? hairColors.highlight : hairColors.shadow;
      px(ctx, tone, HX + off - 1, HY + r);
      px(ctx, tone, HX + off + w, HY + r);
    }
  } else if (hairStyle === 'undercut') {
    for (let r = 13; r <= 17; r++) {
      const [fx, fw] = FACE[r - faceStartRow] || [HX, HW];
      for (let x = HX; x < fx; x++) {
        erasePixel(ctx, x, HY + r);
      }
      for (let x = fx + fw; x < HX + HW; x++) {
        erasePixel(ctx, x, HY + r);
      }
    }
    hLine(ctx, hairColors.highlight, HX + 2, HY + 8, HW - 4);
    hLine(ctx, hairColors.highlight, HX + 2, HY + 9, HW - 5);
  } else {
    // 'short' (default) — spike tips above crown for styled look
    px(ctx, hairColors.shadow,    HX + 6,  HY - 1);
    px(ctx, hairColors.base,      HX + 9,  HY - 1);
    px(ctx, hairColors.highlight, HX + 13, HY - 1);
    px(ctx, hairColors.base,      HX + 17, HY - 1);
    px(ctx, hairColors.shadow,    HX + 19, HY - 1);
    px(ctx, hairColors.highlight, HX + 13, HY - 2);  // tallest center spike
  }
}

// drawHairSouth is now integrated into drawHeadSouth (hair-first unified head)
function drawHairSouth() {}

// ---------------------------------------------------------------------------
// drawHeadNorth  –  back of head, fixed at x=22, y=5  (20×18)
// ---------------------------------------------------------------------------

function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 17, HY = 26, HW = 26;  // HX shifted -16 for 64px frame; 24 rows, chin at y=49
  const outline = '#111111';

  // Back of head: 24 rows — crown at y=26, chin at y=49, neck at y=50
  const HEAD = [
    [9,  8],  //  0: crown tip   (y=26)
    [7, 12],  //  1: upper crown (y=27)
    [5, 16],  //  2: crown       (y=28)
    [4, 18],  //  3: dome top    (y=29)
    [5, 16],  //  4: crown body
    [3, 20],  //  5: upper dome
    [2, 22],  //  6: dome
    [1, 24],  //  7: max width
    [1, 24],  //  8: max width
    [1, 24],  //  9: max width
    [1, 24],  // 10: temple
    [1, 24],  // 11: upper mid
    [2, 22],  // 12: mid
    [2, 22],  // 13: mid
    [2, 22],  // 14: mid
    [2, 22],  // 15: lower mid
    [2, 22],  // 16: lower
    [2, 22],  // 17: lower
    [2, 22],  // 18: lower
    [2, 22],  // 19: jaw wide
    [3, 20],  // 20: lower jaw taper
    [4, 18],  // 21: chin
    [5, 16],  // 22: chin bottom
    [7, 12],  // 23: chin base
  ];

  // Skin at neck/lower-back area (visible below hairline at back)
  fillRect(ctx, skinColors.base, HX + 5, HY + 20, HW - 10, 4);

  // Fill entire head with hair
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, hairColors.base, HX + off, HY + r, w);
  }

  // Crown highlights (rows 0-6) and dome texture (rows 7-10)
  hLine(ctx, hairColors.highlight, HX + 10, HY,     6);  // row 0 crown tip
  hLine(ctx, hairColors.highlight, HX + 8,  HY + 1, 8);  // row 1
  hLine(ctx, hairColors.highlight, HX + 6,  HY + 2, 12); // row 2
  hLine(ctx, hairColors.highlight, HX + 5,  HY + 3, 14); // row 3
  hLine(ctx, hairColors.highlight, HX + 5,  HY + 4, 8);  // row 4
  hLine(ctx, hairColors.highlight, HX + 3,  HY + 5, 12); // row 5
  hLine(ctx, hairColors.highlight, HX + 2,  HY + 6, 14); // row 6
  for (let r = 7; r <= 10; r++) {
    const [off, w] = HEAD[r];
    for (let dx = 3; dx < w - 3; dx += 5) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
  }
  // Bottom shadow
  hLine(ctx, hairColors.shadow, HX + 8, HY + 22, 4);
  hLine(ctx, hairColors.shadow, HX + 9, HY + 23, 2);

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
  hLine(ctx, outline, HX + 9, HY, 8);  // crown top (matches HEAD[0]=[9,8])
  const last = HEAD[HEAD.length - 1];
  hLine(ctx, outline, HX + last[0], HY + HEAD.length, last[1]);
}

// ---------------------------------------------------------------------------
// drawHeadWest  –  side profile facing LEFT, nose extends past HX
// ---------------------------------------------------------------------------

function drawHeadWest(ctx, skinColors, hairColors, hairStyle) {
  // Profile head: HX=15 (64px frame), HY=26. 24 rows — chin at y=49 meets neck at y=50.
  const HX = 15, HY = 26;
  const outline = '#111111';

  // Profile silhouette — max 15px wide, 24 rows tall (round chibi)
  const S = [
    [5,  5],  //  0: crown tip   (y=26)
    [4,  7],  //  1: upper crown (y=27)
    [3,  9],  //  2: crown       (y=28)
    [2, 11],  //  3: dome top    (y=29)
    [3,  9],  //  4: crown body
    [2, 11],  //  5: upper dome
    [1, 13],  //  6: dome
    [0, 15],  //  7: max width
    [0, 15],  //  8: max width
    [0, 15],  //  9: max width
    [0, 15],  // 10: hairline / face start
    [0, 15],  // 11: brow
    [0, 15],  // 12: eye zone
    [0, 15],  // 13: eye zone
    [0, 15],  // 14: nose (tip protrudes at HX-1)
    [0, 14],  // 15: nose lower
    [0, 14],  // 16: mouth
    [0, 14],  // 17: mouth
    [1, 12],  // 18: jaw
    [2, 10],  // 19: jaw
    [3,  9],  // 20: lower jaw
    [4,  8],  // 21: chin
    [5,  6],  // 22: chin
    [6,  5],  // 23: chin tip
  ];
  const HH = S.length; // 24

  // Fill with hair first (unified shape)
  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    hLine(ctx, hairColors.base, HX + xo, HY + r, w);
  }

  // Skin fill for face area (rows 10-21, narrower than full width)
  for (let r = 10; r <= 21; r++) {
    const [xo, w] = S[r];
    const faceW = Math.min(w - 3, 11); // leave 3px of hair at back
    hLine(ctx, skinColors.base, HX + xo, HY + r, faceW);
  }

  // Face shading
  for (let r = 10; r <= 15; r++) {
    px(ctx, skinColors.highlight, HX + 1, HY + r);
  }
  for (let r = 19; r <= 21; r++) {
    const [xo, w] = S[r];
    hLine(ctx, skinColors.shadow, HX + xo + 1, HY + r, Math.max(1, Math.min(w - 4, 5)));
  }

  // Dome highlights
  hLine(ctx, hairColors.highlight, HX + S[5][0] + 3, HY + 5, Math.max(1, S[5][1] - 7));
  hLine(ctx, hairColors.highlight, HX + 3, HY + 6, 6);
  hLine(ctx, hairColors.shadow, HX, HY + 10, S[10][1]);

  // Face features
  // ── Forehead highlight ────────────────────────────────────────────────────
  px(ctx, skinColors.highlight, HX + 2, HY + 10);
  px(ctx, skinColors.highlight, HX + 3, HY + 11);

  // ── Brow ridge ───────────────────────────────────────────────────────────
  hLine(ctx, hairColors.shadow, HX, HY + 11, 3);

  // ── Eye — dark with catch-light ───────────────────────────────────────────
  px(ctx, '#FFFFFF', HX,     HY + 12);
  px(ctx, '#1A0800', HX + 1, HY + 12);
  px(ctx, skinColors.shadow, HX + 1, HY + 13);

  // ── Cheekbone highlight ───────────────────────────────────────────────────
  px(ctx, skinColors.highlight, HX + 3, HY + 14);

  // ── Nose — tip + under-nose shadow ───────────────────────────────────────
  px(ctx, skinColors.shadow, HX - 1, HY + 14);
  px(ctx, skinColors.shadow, HX + 1, HY + 15);

  // ── Ear ──────────────────────────────────────────────────────────────────
  px(ctx, skinColors.shadow,    HX + 9, HY + 13);
  px(ctx, skinColors.highlight, HX + 8, HY + 14);
  px(ctx, skinColors.shadow,    HX + 9, HY + 15);

  // Back-of-head hair strip
  const backEnd = hairStyle === 'short' ? 17 : hairStyle === 'medium' ? 20 : HH;
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
  px(ctx, outline, HX - 1, HY + 13);  // nose outline
  px(ctx, outline, HX - 1, HY + 15);
}

// ---------------------------------------------------------------------------
// drawNeckSouth
// ---------------------------------------------------------------------------

function drawNeckSouth(ctx, skinColors, baseY) {
  // Slightly thinner neck: 9px wide × 4px tall; centre x=32.
  const NX = 28, NW = 9, NH = 4;
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

  // 5-step V taper with smooth hip flare
  const rl = (row) => {
    if (row < SHOULDER)     return x - 1;
    if (row < MID_S)        return x;
    if (row < WAIST_S)      return x + 1;
    if (row < NARROW_S)     return x + 2;
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    return x + w - 1;
  };

  // ── 1. Fill jacket base ──────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional shading: 2px lit left, 3px shadow right ───────────────
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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

  // 5-step V taper with smooth hip flare
  const rl = (row) => {
    if (row < SHOULDER)     return x - 1;
    if (row < MID_S)        return x;
    if (row < WAIST_S)      return x + 1;
    if (row < NARROW_S)     return x + 2;
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    return x + w - 1;
  };

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading: 2px lit left, 3px shadow right
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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
  const rl = (row) => {
    if (row < SHOULDER)     return x - 1;
    if (row < MID_S)        return x;
    if (row < WAIST_S)      return x + 1;
    if (row < NARROW_S)     return x + 2;
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    return x + w - 1;
  };

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading: 2px lit left, 3px shadow right
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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
  const rl = (row) => {
    if (row < SHOULDER)     return x - 1;
    if (row < MID_S)        return x;
    if (row < WAIST_S)      return x + 1;
    if (row < NARROW_S)     return x + 2;
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    return x + w - 1;
  };

  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading: 2px lit left, 3px shadow right
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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
  const rl = (row) => {
    if (row < SHOULDER)     return x - 1;
    if (row < MID_S)        return x;
    if (row < WAIST_S)      return x + 1;
    if (row < NARROW_S)     return x + 2;
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    return x + w - 1;
  };

  // Fill base
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading: 2px lit left, 3px shadow right
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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
  const rl = (row) => {
    if (row < SHOULDER)     return x - 1;
    if (row < MID_S)        return x;
    if (row < WAIST_S)      return x + 1;
    if (row < NARROW_S)     return x + 2;
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    return x + w - 1;
  };

  // Fill base
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Directional shading: 2px lit left, 3px shadow right
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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
    if (row <= WAIST_E)     return x + 3;
    if (row <= WAIST_E + 1) return x + 2;
    if (row <= WAIST_E + 2) return x + 1;
    if (row < h)            return x;
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);
    return x - flare;
  };
  const rr = (row) => {
    if (row < SHOULDER)     return x + w;
    if (row < MID_S)        return x + w - 1;
    if (row < WAIST_S)      return x + w - 2;
    if (row < NARROW_S)     return x + w - 3;
    if (row <= WAIST_E)     return x + w - 4;
    if (row <= WAIST_E + 1) return x + w - 3;
    if (row <= WAIST_E + 2) return x + w - 2;
    if (row < h)            return x + w - 1;
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);
    return x + w - 1 + flare;
  };

  // ── 1. Base fill ─────────────────────────────────────────────────────────
  for (let row = 0; row < totalH; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional shading: 2px lit left, 3px shadow right ───────────────
  for (let row = 0; row < totalH; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
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
  // Wider shoulder pads — extend rows 0-1 outward 2px each side for chunky chibi build.
  // Row 0-1: outer 2px cap extensions (base fill); row 2: 1px transition cap.
  fillRect(ctx, clothingColors.base, x - 2, y,     2, 2);        // left shoulder pad
  fillRect(ctx, clothingColors.base, x + w, y,     2, 2);         // right shoulder pad
  px(ctx, clothingColors.base,       x - 1, y + 2);                // left transition row
  px(ctx, clothingColors.base,       x + w, y + 2);                // right transition row
  // Shoulder pad outline (selout dark edges)
  px(ctx, clothingColors.shadow,     x - 2, y);
  px(ctx, clothingColors.shadow,     x - 2, y + 1);
  px(ctx, clothingColors.shadow,     x + w + 1, y);
  px(ctx, clothingColors.shadow,     x + w + 1, y + 1);
  // Step AA at shoulder-pad→chest transition
  px(ctx, clothingColors.shadow,     x - 1, y + 2);
  px(ctx, clothingColors.shadow,     x + w, y + 2);

  // M-shaped neckline: dips only at shoulder-to-neck transitions, not across neck column
  const neckL = 28, neckR = 36;        // NX=28, NX+NW-1=36
  const armInL = 23, armInR = 43;      // arm inner edges (fixed geometry)
  const leftDipW  = neckL - armInL;    // 28 - 23 = 5  → x=23..27
  const rightDipX = neckR + 1;         // 37
  const rightDipW = armInR - rightDipX; // 43 - 37 = 6  → x=37..42
  if (leftDipW  > 0) hLine(ctx, clothingColors.deep_shadow || clothingColors.shadow, armInL,      y,     leftDipW);
  if (rightDipW > 0) hLine(ctx, clothingColors.deep_shadow || clothingColors.shadow, rightDipX,   y,     rightDipW);
  if (leftDipW  > 1) hLine(ctx, clothingColors.shadow,                               armInL,      y + 1, leftDipW - 1);
  if (rightDipW > 1) hLine(ctx, clothingColors.shadow,                               rightDipX,   y + 1, rightDipW - 1);

  // Shoulder cap: 2 highlight rows, lit from upper-left (now spanning wider shoulder)
  hLine(ctx, clothingColors.highlight, x + 1, y,     Math.floor(w * 0.45));
  hLine(ctx, clothingColors.highlight, x + 1, y + 1, Math.floor(w * 0.30));

  // Left pectoral highlight band — wider, deeper tapered triangle
  hLine(ctx, clothingColors.highlight, x + 1, y + 2, 10);
  hLine(ctx, clothingColors.highlight, x + 1, y + 3,  8);
  hLine(ctx, clothingColors.highlight, x + 1, y + 4,  6);
  hLine(ctx, clothingColors.highlight, x + 1, y + 5,  5);
  hLine(ctx, clothingColors.highlight, x + 1, y + 6,  3);
  hLine(ctx, clothingColors.highlight, x + 1, y + 7,  2);

  // Mid-torso horizontal fold shadow — 2-row taper (fabric compression below chest)
  hLine(ctx, clothingColors.shadow, x + 2, y + 8, w - 4);
  hLine(ctx, clothingColors.shadow, x + 3, y + 9, w - 6);

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

  // Right-side pec shadow strip — 2px wide, 7 rows (torso cylinder curves away from light)
  vLine(ctx, clothingColors.deep_shadow || clothingColors.shadow, x + w - 2, y + 2, 7);
  vLine(ctx, clothingColors.shadow,                               x + w - 3, y + 2, 7);
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
    if (row < SHOULDER)                       return 18;  // wide chibi shoulder
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
  // Belt / hip band: 22px wide, anchors torso-to-leg transition.
  const w = 22, h = 3;
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
  const lx = 24 + Math.round(lLegDX);
  const rx = 33 + Math.round(rLegDX);
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
  const lx = 22 + Math.round(lShoeDX);
  const rx = 32 + Math.round(rShoeDX);
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
  // Organic arm shape: 7px deltoid cap → 6px bicep → 5px elbow pinch → 6px forearm → 4px wrist
  // Inner edge stays fixed to preserve arm-to-waist gap; outer edge varies for the curve.
  const lx = 18;                // left arm body outer-edge
  const shoulderRX = 43;        // right arm inner (torso-side) edge
  const baseY = torsoY - 1;     // deltoid cap protrudes 1px above torso top
  const sleeveH = 13, handH = 4;
  const maxRow = sleeveH - 1;
  const deepShadow = clothingColors.deep_shadow || clothingColors.shadow;

  // Row zones:  0-1 cap (7px), 2-4 bicep (6px), 5-6 elbow (5px), 7-9 forearm (6px), 10-12 wrist (4px)
  const armW = (row) => {
    if (row < 2)  return 7;   // deltoid cap
    if (row < 5)  return 6;   // bicep
    if (row < 7)  return 5;   // elbow pinch
    if (row < 10) return 6;   // forearm
    return 4;                 // wrist
  };
  // Left arm outer-edge shift per row zone (negative values push OUT from body)
  const lShift = (row) => {
    if (row < 2)  return -2;  // cap extends 2px further left
    if (row < 5)  return -1;  // bicep 1px further left
    if (row < 7)  return  0;  // elbow back to base
    if (row < 10) return -1;  // forearm 1px further left
    return 0;                 // wrist back to base
  };

  // Left arm X position (lRowX) uses the row-dependent shift
  const lRowX = (row) => lx + lShift(row) + Math.round(lArmOut * row / maxRow);
  const lRowY = (row) => baseY + Math.round(lArmDY * row / maxRow) + row;
  const lArmX = lx    + lShift(maxRow) + Math.round(lArmOut);
  const lArmY = baseY + Math.round(lArmDY);

  // Right arm stays anchored at shoulderRX (inner edge toward torso);
  // width expands rightward through armW.
  const rRowX = (row) => shoulderRX + Math.round(rArmOut * row / maxRow);
  const rRowY = (row) => baseY      + Math.round(rArmDY  * row / maxRow) + row;
  const rArmX = shoulderRX + Math.round(rArmOut);
  const rArmY = baseY      + Math.round(rArmDY);

  // ── Left arm (lit side — deltoid cap + cylinder + forearm flare) ─────────
  for (let row = 0; row < sleeveH; row++) {
    const rX = lRowX(row);
    const ry = lRowY(row);
    const aw = armW(row);
    hLine(ctx, clothingColors.base,   rX,     ry, aw);
    px(ctx, clothingColors.shadow,    rX,     ry);        // outer selout
    px(ctx, clothingColors.highlight, rX + 1, ry);        // highlight column
    if (row < 8) px(ctx, clothingColors.highlight, rX + 2, ry);  // 2px lit on cap+bicep
    if (row === 0) hLine(ctx, clothingColors.highlight, rX + 1, ry, aw - 2);  // deltoid crown highlight
    if (row >= 2 && row < 10) px(ctx, clothingColors.shadow, rX + aw - 2, ry);  // secondary cylinder shadow
    px(ctx, clothingColors.shadow,    rX + aw - 1, ry);   // inner shadow (toward torso)
  }
  hLine(ctx, clothingColors.shadow, lRowX(maxRow), lRowY(maxRow), armW(maxRow));

  // Armhole socket shadow — darker pixels at the top of the arm where it meets the torso.
  // Creates the "arm plugs into shoulder" depth crease.
  px(ctx, deepShadow, lRowX(0) + armW(0) - 1, baseY);       // top-inner corner
  px(ctx, deepShadow, lRowX(1) + armW(1) - 1, baseY + 1);   // 2nd row socket
  // Left cap→bicep step AA (7→6 px)
  px(ctx, clothingColors.shadow, lRowX(0), baseY + 2);
  // Bicep→elbow step AA (6→5 px)
  px(ctx, clothingColors.shadow, lRowX(2), baseY + 5);
  // Elbow→forearm step AA (5→6 px, outer flare)
  px(ctx, clothingColors.shadow, lRowX(7), baseY + 6);
  // Forearm→wrist step AA (6→4 px)
  px(ctx, clothingColors.shadow, lRowX(9), baseY + 10);

  // Left hand / fist (4px wide with knuckle highlights)
  const lhw = 4;
  const lhx = lArmX;
  fillRect(ctx, skinColors.base,    lhx,     lArmY + sleeveH, lhw, handH);
  px(ctx,    skinColors.highlight,  lhx + 1, lArmY + sleeveH);
  px(ctx,    skinColors.highlight,  lhx + 2, lArmY + sleeveH);
  hLine(ctx, skinColors.shadow,     lhx,     lArmY + sleeveH + handH - 1, lhw);
  outlineRect(ctx, skinColors.outline, lhx,  lArmY + sleeveH, lhw, handH);

  // ── Right arm (shadow side — deltoid cap + muted cylinder + forearm flare) ──
  for (let row = 0; row < sleeveH; row++) {
    const rx = rRowX(row);
    const ry = rRowY(row);
    const aw = armW(row);
    hLine(ctx, clothingColors.base,  rx,         ry, aw);
    px(ctx, clothingColors.shadow,   rx,         ry);     // inner shadow (toward torso)
    px(ctx, clothingColors.shadow,   rx + 1,     ry);     // secondary inner shadow
    if (row === 0) hLine(ctx, clothingColors.shadow, rx + 1, ry, aw - 2);  // dark deltoid crown
    if (row >= 2 && row < 10) px(ctx, clothingColors.shadow, rx + aw - 2, ry);  // cylinder shadow
    px(ctx, clothingColors.shadow,   rx + aw - 1, ry);    // outer selout
  }
  hLine(ctx, clothingColors.shadow, rRowX(maxRow), rRowY(maxRow), armW(maxRow));

  // Armhole socket shadow (right)
  px(ctx, deepShadow, rRowX(0), baseY);        // top-inner corner
  px(ctx, deepShadow, rRowX(1), baseY + 1);    // 2nd row socket
  // Step AA on right (outer edge shifts)
  px(ctx, clothingColors.shadow, rRowX(0) + 6, baseY + 2);  // cap→bicep step
  px(ctx, clothingColors.shadow, rRowX(2) + 5, baseY + 5);  // bicep→elbow step
  px(ctx, clothingColors.shadow, rRowX(7) + 4, baseY + 6);  // elbow→forearm step
  px(ctx, clothingColors.shadow, rRowX(9) + 5, baseY + 10); // forearm→wrist step

  // Right hand / fist (4px wide)
  const rhw = 4;
  const rhx = rArmX;
  fillRect(ctx, skinColors.base,    rhx, rArmY + sleeveH, rhw, handH);
  hLine(ctx, skinColors.shadow,     rhx, rArmY + sleeveH + handH - 1, rhw);
  outlineRect(ctx, skinColors.outline, rhx, rArmY + sleeveH, rhw, handH);

  // Shoulder bridge: fill the gap between arm shoulder cap and neck at baseY.
  // Neck spans x=28-36 (NX=28, NW=9); left arm inner edge at x=23, right arm inner at x=43.
  const neckL = 28, neckR = 36;
  const lBridgeX = lRowX(0) + armW(0);         // = 23 (just inside left arm)
  const lBridgeW = neckL - lBridgeX;           // = 5 (fills x=23-27)
  const rBridgeX = neckR + 1;                   // = 37
  const rBridgeW = rRowX(0) - rBridgeX;        // = 6 (fills x=37-42)
  if (lBridgeW > 0) hLine(ctx, clothingColors.base, lBridgeX, baseY, lBridgeW);
  if (rBridgeW > 0) hLine(ctx, clothingColors.base, rBridgeX, baseY, rBridgeW);

  // Trapezius muscle humps: taper two rows above bridge for visible shoulder mass
  if (lBridgeW > 1) {
    hLine(ctx, clothingColors.base,      lBridgeX, baseY - 1, lBridgeW);     // left trap row 1 (5px)
    px(ctx,    clothingColors.highlight, lBridgeX, baseY - 1);                // lit outer edge
    hLine(ctx, clothingColors.base,      lBridgeX, baseY - 2, lBridgeW - 1); // left trap row 2 (4px, tapered)
    px(ctx,    clothingColors.highlight, lBridgeX, baseY - 2);
  }
  if (rBridgeW > 1) {
    hLine(ctx, clothingColors.shadow, rBridgeX, baseY - 1, rBridgeW - 1);    // right trap row 1 (5px, shadow)
    hLine(ctx, clothingColors.shadow, rBridgeX, baseY - 2, rBridgeW - 2);    // right trap row 2 (4px, tapered)
  }

  // Shadow at bridge edges for depth
  px(ctx, clothingColors.shadow, lBridgeX,                     baseY);  // bridge outer-left edge
  px(ctx, clothingColors.shadow, neckL - 1,                    baseY);  // bridge→neck transition left
  px(ctx, clothingColors.shadow, rBridgeX,                     baseY);  // bridge→neck transition right
  px(ctx, clothingColors.shadow, rBridgeX + rBridgeW - 1,      baseY);  // bridge outer-right edge
}

// ---------------------------------------------------------------------------
// drawBackArmWest / drawFrontArmWest
// Split into two functions so the front arm can be drawn AFTER the torso,
// making it visually "in front" of the body. The back arm is called first.
// Front arm = face-side arm (x ≈ torsoX-3, always lower X = always visible).
// Back arm  = body-back-side arm (x ≈ torsoX+9, always higher X = behind torso).
// ---------------------------------------------------------------------------

function drawBackArmWest(ctx, clothingColors, skinColors, backArmDX, torsoX, torsoY) {
  const sleeveH = 13, handH = 4;
  const backY     = torsoY - 1;  // deltoid cap 1px above torso top
  const shoulderX = torsoX + 11;
  const maxRow    = sleeveH - 1;
  const armW = (row) => {
    if (row < 2) return 7;   // deltoid cap
    if (row < 5) return 6;   // bicep
    if (row < 8) return 5;   // elbow
    return 4;                // forearm/wrist
  };
  const rowX = (row) => shoulderX + Math.round(backArmDX * row / maxRow);
  const wristX = rowX(maxRow);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    const aw = armW(row);
    hLine(ctx, clothingColors.shadow, rx, backY + row, aw);  // muted (behind body)
    px(ctx, clothingColors.base, rx + 1, backY + row);        // centre lit strip
    if (aw > 4) px(ctx, clothingColors.base, rx + 2, backY + row);
    px(ctx, clothingColors.outline, rx,          backY + row);
    px(ctx, clothingColors.outline, rx + aw - 1, backY + row);
  }
  hLine(ctx, clothingColors.outline, rowX(0),      backY,          armW(0));
  hLine(ctx, clothingColors.outline, rowX(maxRow), backY + maxRow, armW(maxRow));
  fillRect(ctx, skinColors.shadow, wristX, backY + sleeveH, 3, handH);
  outlineRect(ctx, skinColors.outline, wristX, backY + sleeveH, 3, handH);
}

function drawFrontArmWest(ctx, clothingColors, skinColors, frontArmDX, torsoX, torsoY) {
  const sleeveH = 13, handH = 4;
  const frontY    = torsoY - 1;  // deltoid cap 1px above torso top
  const shoulderX = torsoX - 1;
  const maxRow    = sleeveH - 1;
  const armW = (row) => {
    if (row < 2) return 7;   // deltoid cap
    if (row < 5) return 6;   // bicep
    if (row < 8) return 5;   // elbow
    return 4;                // forearm/wrist
  };
  const rowX = (row) => shoulderX + Math.round(frontArmDX * row / maxRow);
  const wristX = rowX(maxRow);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    const aw = armW(row);
    hLine(ctx, clothingColors.base,   rx, frontY + row, aw);
    px(ctx, clothingColors.highlight, rx + 1,      frontY + row);
    px(ctx, clothingColors.shadow,    rx + aw - 2, frontY + row);
    px(ctx, clothingColors.shadow,    rx + aw - 1, frontY + row);
  }
  hLine(ctx, clothingColors.outline, rowX(0),      frontY,          armW(0));
  hLine(ctx, clothingColors.outline, rowX(maxRow), frontY + maxRow, armW(maxRow));

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
