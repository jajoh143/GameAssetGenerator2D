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
  // SNES RPG body structure:
  //   Rows 0-2 (shoulder): 20px  lx=22  rx=41
  //   Rows 3-18 (body):    18px  lx=23  rx=40
  //
  // DIRECTIONAL form shading (light from upper-left, not pillow shading):
  //   Left panel: highlight on 2nd pixel → suggests cylinder lit from left
  //   Right panel: shadow on 2nd+3rd pixel → shadow side away from light
  //   Shirt: highlight on left column, shadow on right column

  const cx = Math.floor(x + w / 2);   // = 32
  const numRows = Math.min(h, 19);
  const SHOULDER = 3;

  const rl = (row) => row < SHOULDER ? x - 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : x + w - 1;

  // ── 1. Fill jacket base ──────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional form shading (left-lit, SNES convention) ──────────────
  for (let row = 0; row < numRows; row++) {
    // Left panel: 2nd pixel = highlight (facing the light source)
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    // Right panel: 2nd + 3rd pixels = shadow (away from light)
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }

  // ── 3. Dither highlight on upper-left jacket panel (fabric texture) ───────
  // Alternating highlight pixels in upper chest area simulate SNES cloth texture
  for (let row = 1; row < Math.min(7, numRows); row++) {
    if (row % 2 === 1) {
      px(ctx, colors.highlight, rl(row) + 2, y + row);
    }
  }

  // ── 4. Horizontal fold shadow lines (fabric crease at mid-torso) ──────────
  // A single shadow row at mid-torso and near belt suggests draped fabric.
  const foldRow1 = Math.floor(numRows * 0.45);  // ~row 8: mid-jacket fold
  const foldRow2 = numRows - 3;                   // ~row 15: near-belt fold
  for (const fr of [foldRow1, foldRow2]) {
    const rowLx = rl(fr) + 2, rowRx = rr(fr) - 2;  // avoid outer shadow columns
    hLine(ctx, colors.shadow, rowLx, y + fr, rowRx - rowLx + 1);
  }

  // ── 5. Inner shirt panel (visible through open jacket front) ─────────────
  const shirtW = 8, shirtLx = cx - 4;   // shirt x=28-35
  const shirtCol = colors.collar || colors.highlight;
  fillRect(ctx, shirtCol, shirtLx, y, shirtW, numRows);
  // Shirt form shading: left highlight, right shadow, seam shadows at edges
  vLine(ctx, colors.shadow,    shirtLx,              y, numRows);  // left seam
  vLine(ctx, colors.shadow,    shirtLx + shirtW - 1, y, numRows);  // right seam
  vLine(ctx, colors.highlight, shirtLx + 1,          y, numRows);  // shirt left highlight
  vLine(ctx, colors.shadow,    shirtLx + shirtW - 2, y, numRows);  // shirt right shadow

  // ── 6. Lapels: V opens from closed (row 0) to fully open (row 7) ─────────
  // Research (SNES form shading): "the lapel face gets a highlight if the light
  // source hits it." Left lapel faces upper-left light → full highlight fill.
  // Right lapel faces away from light → stays base tone.
  const lapelH = Math.min(8, numRows);
  for (let row = 0; row < lapelH; row++) {
    const lw = Math.round(3 * (lapelH - 1 - row) / (lapelH - 1));
    if (lw > 0) {
      // Left lapel: highlight across the folded face, shadow on inner edge
      hLine(ctx, colors.highlight, shirtLx,          y + row, lw);
      px(ctx,   colors.shadow,     shirtLx + lw - 1, y + row);   // lapel fold shadow
      // Right lapel: base tone (shadow side, facing away from light)
      hLine(ctx, colors.base,  shirtLx + shirtW - lw, y + row, lw);
      px(ctx,   colors.shadow, shirtLx + shirtW - lw, y + row);  // lapel fold shadow
    }
  }

  // ── 7. AA pixel at shoulder-to-body step (row 3 corner) ─────────────────
  // Smooth the 1px silhouette step with a shadow at the corner pixel
  px(ctx, colors.shadow, x - 1, y + SHOULDER);      // left corner AA
  px(ctx, colors.shadow, x + w, y + SHOULDER);      // right corner AA

  // ── 8. Armpit crease ─────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);

  // ── 9. Selective outlining (research: "lightest colors where light hits") ──
  // Shoulder top corners use shadow (not black) — softer, rounder shoulder read.
  // Inner shoulder top stays black for strong silhouette definition.
  px(ctx, colors.shadow,  x - 1, y);          // left shoulder corner — selout
  hLine(ctx, colors.outline, x, y, w);         // inner shoulder top — hard black
  px(ctx, colors.shadow,  x + w, y);           // right shoulder corner — selout
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);

  // ── 10. Shoulder cap volume + underpectoral fold ──────────────────────────
  // Left shoulder outer tip row 1 = highlight (rounded cap catching upper-left light).
  px(ctx, colors.highlight, x - 1, y + 1);
  // Underpectoral fold on shirt at row 7 (lapels fully open here).
  hLine(ctx, colors.shadow, shirtLx + 1, y + 7, shirtW - 2);
}

function drawHoodieSouth(ctx, colors, x, y, w, h) {
  // Same rectangular silhouette as jacket: 3-row shoulder cap + constant body.
  // Closed front (no visible shirt): side shadows + center zipper + pocket.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 19);
  const SHOULDER = 3;

  const rl = (row) => row < SHOULDER ? x - 1 : x;
  const rr = (row) => row < SHOULDER ? x + w : x + w - 1;

  // ── 1. Fill hoodie base ───────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional form shading (left-lit, matching jacket convention) ────
  for (let row = 0; row < numRows; row++) {
    px(ctx, colors.highlight, rl(row) + 1, y + row);      // left panel lit face
    px(ctx, colors.shadow,    rr(row) - 1, y + row);      // right panel shadow
    px(ctx, colors.shadow,    rr(row) - 2, y + row);      // 2px shadow strip
  }

  // ── 3. Dither highlight on upper-left (SNES sweatshirt texture) ──────────
  for (let row = 1; row < Math.min(7, numRows); row++) {
    if (row % 2 === 1) px(ctx, colors.highlight, rl(row) + 2, y + row);
  }

  // ── 4. Horizontal fold lines (soft fabric has more folds than a jacket) ───
  const hFold1 = Math.floor(numRows * 0.35);
  const hFold2 = Math.floor(numRows * 0.65);
  const hFold3 = numRows - 3;
  for (const fr of [hFold1, hFold2, hFold3]) {
    hLine(ctx, colors.shadow, rl(fr) + 2, y + fr, rr(fr) - rl(fr) - 3);
  }

  // ── 5. Hood collar at top center ─────────────────────────────────────────
  const hoodX = cx - 3;
  fillRect(ctx, colors.collar, hoodX, y, 6, 3);
  // Directional collar shading
  vLine(ctx, colors.highlight, hoodX + 1, y, 3);
  vLine(ctx, colors.shadow,    hoodX + 4, y, 3);
  outlineRect(ctx, colors.outline, hoodX, y, 6, 3);

  // ── 6. Center zipper line (below collar) ─────────────────────────────────
  vLine(ctx, colors.shadow, cx, y + 3, numRows - 3);

  // ── 7. Kangaroo pocket at lower-center ───────────────────────────────────
  const pkx = cx - 4;
  const pky = y + Math.floor(numRows * 0.58);
  const pkw = 8, pkh = Math.max(3, Math.floor(numRows * 0.32));
  fillRect(ctx, colors.shadow, pkx, pky, pkw, pkh);
  // Pocket form: lighter left edge, darker right
  vLine(ctx, colors.highlight, pkx + 1,       pky, pkh);
  vLine(ctx, colors.shadow,    pkx + pkw - 2,  pky, pkh);
  outlineRect(ctx, colors.outline, pkx, pky, pkw, pkh);

  // ── 8. Armpit crease ─────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);

  // Selective outlining: shoulder corners → shadow not black (rounded feel)
  px(ctx, colors.shadow,  x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow,  x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);

  // Shoulder cap volume highlight (left shoulder lit side)
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
  // Belt / hip band: 16px wide at x=24, anchors torso-to-leg transition.
  // Research: belt color must visually "seat" the torso onto the legs.
  const w = 16, h = 2;
  fillRect(ctx, beltColors.base, x, y, w, h);
  // Highlight on belt top row (belt leather catches light from above)
  hLine(ctx, beltColors.highlight, x + 1, y, w - 2);
  // Shadow on belt bottom row (underside of belt in shadow)
  hLine(ctx, beltColors.shadow, x + 1, y + 1, w - 2);
  // Second row slightly narrower (hip taper)
  fillRect(ctx, beltColors.base, x + 1, y + 1, w - 2, 1);
  // Buckle center
  const bx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, beltColors.buckle, bx, y, 3, h);
  px(ctx, beltColors.highlight, bx + 1, y);   // buckle top shine
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
    hLine(ctx, pantColors.base,      llx,          y + row, lw);
    px(ctx,   pantColors.highlight,  llx + 1,      y + row);        // outer-lit face (left leg = lit side)
    px(ctx,   pantColors.shadow,     llx + lw - 2, y + row);        // inner-thigh shadow
    // knee face brightness
    if (row >= 5 && row <= 7) px(ctx, pantColors.highlight, llx + 2, y + row);
    // Dithered highlight on thigh (rows 1,3 — upper pant texture)
    if (row === 1 || row === 3) px(ctx, pantColors.highlight, llx + 2, y + row);
    // selout outer edge
    px(ctx, pantColors.shadow, llx, y + row);
    // black inner edge (toward crotch gap)
    if (row > 0) px(ctx, pantColors.outline, llx + lw - 1, y + row);

    // ── Right leg ─────────────────────────────────────────────────────────────
    const rrx = rx;
    const rrw = lw;
    const rrOuter = rrx + rrw - 1 + (lo < 0 ? -lo : 0);
    const rrStart = rrOuter - rrw + 1;
    hLine(ctx, pantColors.base,      rrStart,           y + row, rrw);
    px(ctx,   pantColors.highlight,  rrStart + rrw - 2, y + row);   // outer-lit face (right leg outer edge)
    px(ctx,   pantColors.shadow,     rrStart + 1,       y + row);   // inner-thigh shadow
    if (row >= 5 && row <= 7) px(ctx, pantColors.highlight, rrStart + rrw - 3, y + row);
    // Dithered highlight on outer thigh (rows 1,3)
    if (row === 1 || row === 3) px(ctx, pantColors.highlight, rrStart + rrw - 3, y + row);
    // selout outer edge
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
  // Directional shading (left arm = lit side of body, upper-left light source):
  //   outer face (leftmost pixel) = highlight (faces the light)
  //   inner face (rightmost pixel, toward body) = shadow
  //   Dithered highlight on upper sleeve (rows 1,3,5) for SNES fabric texture
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row] || 0;
    const rowLx = lx - b;
    const rowW  = baseAW + b;
    hLine(ctx, clothingColors.base,      rowLx,            lArmY + row, rowW);
    px(ctx,   clothingColors.highlight,  rowLx,            lArmY + row);  // outer face lit (selout-highlight)
    px(ctx,   clothingColors.shadow,     rowLx + rowW - 1, lArmY + row);  // inner shadow toward body
    // Dithered highlight on 2nd pixel, upper sleeve odd rows only
    if (row >= 1 && row <= 5 && row % 2 === 1) px(ctx, clothingColors.highlight, rowLx + 1, lArmY + row);
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
  // Right arm is on the shadow side of the body (light from upper-left).
  //   Both edges stay shadowed; mid pixel keeps base tone for form roundness.
  //   No highlight dithering — this arm stays uniformly dim.
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row] || 0;
    const rowW = baseAW + b;
    hLine(ctx, clothingColors.base,   rx,            rArmY + row, rowW);
    px(ctx,   clothingColors.shadow,  rx,            rArmY + row);  // inner selout
    px(ctx,   clothingColors.shadow,  rx + rowW - 1, rArmY + row);  // outer selout
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
