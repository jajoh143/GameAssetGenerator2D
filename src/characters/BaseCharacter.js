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
// drawHeadSouth  –  front-facing head, fixed at x=22, y=5  (20×21)
// ---------------------------------------------------------------------------

function drawHeadSouth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 22, HY = 5, HW = 20, HH = 21;
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
  hLine(ctx, skinColors.base, 27, HY + 17, 10);  // y=22: 10px upper-chin
  hLine(ctx, skinColors.base, 28, HY + 18,  8);  // y=23:  8px mid-chin
  hLine(ctx, skinColors.base, 29, HY + 19,  6);  // y=24:  6px lower-chin
  hLine(ctx, skinColors.base, 30, HY + 20,  4);  // y=25:  4px chin tip

  // ── Face sphere shading (4 tones: highlight → base → mid-shadow → shadow) ──
  // Light from upper-left. Sphere: bright forehead/left cheek → base center
  //   → soft mid-shadow right-center → hard shadow right edge.
  // This mirrors the SNES technique of using color to model shape, not lines.

  // Highlight zone (upper-left): forehead / left cheek
  fillRect(ctx, skinColors.highlight, 24, HY + 8, 4, 5);  // left cheek
  hLine(ctx, skinColors.highlight, 25, HY + 7, 3);         // forehead left

  // Mid-face right ambient shadow (1px strip between base and edge shadow)
  // Suggests the face surface curving away from light at right-center.
  vLine(ctx, skinColors.shadow, 36, HY + 9, 5);    // right-center tone band

  // Edge shadow (right): full dark strip at silhouette
  vLine(ctx, skinColors.shadow, 38, HY + 8, 7);
  vLine(ctx, skinColors.shadow, 39, HY + 8, 5);
  px(ctx, skinColors.shadow, 40, HY + 9);
  px(ctx, skinColors.shadow, 40, HY + 10);
  px(ctx, skinColors.shadow, 40, HY + 11);

  // Brow-cast shadow: the brow ridge casts a slight shadow on the upper eye socket
  hLine(ctx, skinColors.shadow, 27, HY + 7, 5);    // center forehead one row darker

  // Chin + extended chin (all shadow — under-lit)
  hLine(ctx, skinColors.shadow, 25, HY + 14, 14);
  hLine(ctx, skinColors.shadow, 26, HY + 16, 12);
  hLine(ctx, skinColors.shadow, 27, HY + 17, 10);
  hLine(ctx, skinColors.shadow, 28, HY + 18,  8);
  hLine(ctx, skinColors.shadow, 29, HY + 19,  6);
  hLine(ctx, skinColors.shadow, 30, HY + 20,  4);

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
  px(ctx, outline, 28, HY + 18);
  px(ctx, outline, 29, HY + 19);
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
  px(ctx, outline, 35, HY + 18);
  px(ctx, outline, 34, HY + 19);
  // Chin tip bottom (4px at HY+20)
  hLine(ctx, outline, 30, HY + 20, 4);

  // ── Eyebrows (flat 3px strokes — SNES/SDV overworld style) ──────────────
  // Flat brows read clearly at small scale; arches add clutter on tiny faces.
  const browY = HY + 8;   // y=13
  hLine(ctx, hairColors.base,  27, browY, 3);   // left brow: x=27-29
  px(ctx,  hairColors.shadow,  27, browY);       // outer end slightly darker
  hLine(ctx, hairColors.base,  33, browY, 3);   // right brow: x=33-35
  px(ctx,  hairColors.shadow,  35, browY);       // outer end slightly darker

  // ── Eyes (4×2 each, organic pixel art) ──────────────────────────────────
  // Order: outline first → override interior with sclera/iris/shine → soften top corners
  // Top corners → skinColors.shadow (eyelid feel, matches eyelid shadow above)
  // Iris centered in bottom row; white shine top-right creates "living" eye look
  const eyeY = HY + 9;   // y=14

  // Left eye: x=26-29
  outlineRect(ctx, outline, 26, eyeY, 4, 2);
  px(ctx, '#FFFFFF',         27, eyeY);            // sclera left
  px(ctx, '#FFFFFF',         28, eyeY);            // sclera right
  px(ctx, '#6B3A10',         27, eyeY + 1);        // iris (warm brown)
  px(ctx, '#160800',         28, eyeY + 1);        // pupil (dark center)
  px(ctx, '#FFFFFF',         28, eyeY);            // shine: white highlight on iris top-right
  px(ctx, skinColors.shadow, 26, eyeY);            // rounded top-left corner
  px(ctx, skinColors.shadow, 29, eyeY);            // rounded top-right corner

  // Right eye: x=33-36
  outlineRect(ctx, outline, 33, eyeY, 4, 2);
  px(ctx, '#FFFFFF',         34, eyeY);
  px(ctx, '#FFFFFF',         35, eyeY);
  px(ctx, '#6B3A10',         34, eyeY + 1);
  px(ctx, '#160800',         35, eyeY + 1);
  px(ctx, '#FFFFFF',         35, eyeY);            // shine
  px(ctx, skinColors.shadow, 33, eyeY);
  px(ctx, skinColors.shadow, 36, eyeY);

  // (Eyelid shadow removed — flat brows at browY serve the same visual role
  //  and the heavy upper-lid of each eye outline provides enough lid read)

  // ── Nose ─────────────────────────────────────────────────────────────────
  const noseY = HY + 12;   // y=17
  px(ctx, skinColors.highlight, 31, noseY - 1);  // nose bridge highlight (catches light)
  px(ctx, skinColors.shadow,    30, noseY + 1);  // left nostril
  px(ctx, skinColors.shadow,    31, noseY);
  px(ctx, skinColors.shadow,    32, noseY);
  px(ctx, skinColors.shadow,    33, noseY + 1);  // right nostril

  // ── Mouth (natural neutral expression) ───────────────────────────────────
  // Head center = x=32. Lip bar x=30-33 (4px, centered).
  // 4px matches SNES/SDV scale: 2px at native → 4px at 2× display.
  // Shadow corners just outside bar; 2-pixel lower arc for closed-mouth read.
  const mouthY = HY + 15;   // y=20
  px(ctx, skinColors.shadow, 29, mouthY);       // left corner
  hLine(ctx, '#C05050',      30, mouthY, 4);    // 4px lip bar (centered on x=32)
  px(ctx, skinColors.shadow, 34, mouthY);       // right corner
  px(ctx, skinColors.shadow, 31, mouthY + 1);   // lower-left arc
  px(ctx, skinColors.shadow, 32, mouthY + 1);   // lower-right arc

  // ── Hair ─────────────────────────────────────────────────────────────────
  drawHairSouth(ctx, hairColors, hairStyle, HX, HY, HW);
}

// ---------------------------------------------------------------------------
// drawHairSouth
// ---------------------------------------------------------------------------

function drawHairSouth(ctx, hairColors, hairStyle, headX, headY, headW) {
  const outline = '#111111';

  // Top hair band (7px tall, rows y=HY to HY+6)
  // SNES hair technique: flat base, 2-row highlight curve (upper-left lit),
  // strand texture via shadow dither, dark hairline edge.
  fillRect(ctx, hairColors.base, headX, headY, headW, 7);

  // Highlight curve: suggests hair parted upper-left, catching light
  // Row 1: wide highlight arc (12px, centered left of part)
  hLine(ctx, hairColors.highlight, headX + 2, headY + 1, headW - 6);
  // Row 2: narrower (hair curves away from light toward right)
  hLine(ctx, hairColors.highlight, headX + 2, headY + 2, headW - 8);

  // Strand texture: alternating shadow pixels on rows 3-4 (hair depth)
  // Odd columns = shadow dither suggesting individual hair strands
  for (let dx = 1; dx < headW - 1; dx += 3) {
    px(ctx, hairColors.shadow, headX + dx, headY + 3);
  }
  for (let dx = 2; dx < headW - 1; dx += 3) {
    px(ctx, hairColors.shadow, headX + dx, headY + 4);
  }

  // Dark hairline: bottom 2 rows of hair band are shadow — hair meets face
  hLine(ctx, hairColors.shadow, headX, headY + 5, headW);
  hLine(ctx, hairColors.shadow, headX, headY + 6, headW);

  // Side sideburn strips: x=22-23 (left) and x=40-41 (right)
  // Short hair: down to y=18 (headY+13)
  // Medium:     down to y=23 (headY+18)
  // Long:       down to y=28 (headY+23)
  const sideburnShortEnd = headY + 16;  // reaches pre-chin on taller head
  const sideburnMedEnd   = headY + 21;  // reaches below chin into neck
  const sideburnLongEnd  = headY + 26;  // drapes over shoulder

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
  const HX = 22, HY = 5, HW = 20, HH = 21;
  const outline = '#111111';

  // Skin (neck/lower-head area at bottom — 9px to match extended head height)
  fillRect(ctx, skinColors.base, HX + 2, HY + 12, HW - 4, 9);

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
  // Profile: 14px wide, 21px tall (matches south head height)
  // Head occupies x=19-32, y=5-25  (facing left, face at low-x end)
  const HX = 19, HY = 5, HW = 14, HH = 21;
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
  // neck: 10px wide x 2px, centered at x=27-36
  const NX = 27, NW = 10, NH = 2;
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

  const cx = Math.floor(x + w / 2);   // = 32
  const numRows = Math.min(h, 19);
  const SHOULDER = 3;
  const WAIST_S = 7, WAIST_E = 11;   // waist taper row range

  const rl = (row) => {
    if (row < SHOULDER)                       return x - 1;  // shoulder: x=22
    if (row >= WAIST_S && row <= WAIST_E)    return x + 1;  // waist: x=24
    return x;                                                  // body: x=23
  };
  const rr = (row) => {
    if (row < SHOULDER)                       return x + w;      // shoulder: x=41
    if (row >= WAIST_S && row <= WAIST_E)    return x + w - 2;  // waist: x=39
    return x + w - 1;                                             // body: x=40
  };

  // ── 1. Fill jacket base ──────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional form shading (left-lit, SNES convention) ──────────────
  for (let row = 0; row < numRows; row++) {
    // Left panel: 2nd pixel = highlight
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    // Right panel: 2nd + 3rd pixels = shadow
    px(ctx, colors.shadow, rr(row) - 1, y + row);
    px(ctx, colors.shadow, rr(row) - 2, y + row);
  }

  // ── 3. Fold shadow notches: jacket flanks suggest fabric drape ───────────
  const foldRow1 = Math.floor(numRows * 0.45);  // ~row 7-8
  const foldRow2 = numRows - 3;                  // ~row 13-14
  for (const fr of [foldRow1, foldRow2]) {
    const frl = rl(fr) + 2;
    const frr = rr(fr) - 2;
    if (28 - frl > 0) hLine(ctx, colors.shadow, frl, y + fr, 28 - frl);
    if (frr - 35 > 0) hLine(ctx, colors.shadow, 36,  y + fr, frr - 35);
  }

  // ── 5. Inner shirt panel ─────────────────────────────────────────────────
  const shirtW = 8, shirtLx = cx - 4;   // shirt x=28-35
  const shirtCol = colors.collar || colors.highlight;
  fillRect(ctx, shirtCol, shirtLx, y, shirtW, numRows);
  // Shirt form shading
  vLine(ctx, colors.shadow,    shirtLx,              y, numRows);  // left seam
  vLine(ctx, colors.shadow,    shirtLx + shirtW - 1, y, numRows);  // right seam
  vLine(ctx, colors.highlight, shirtLx + 1,          y, numRows);  // lit face
  vLine(ctx, colors.shadow,    shirtLx + shirtW - 2, y, numRows);  // shadow face
  // Center highlight column — shirt front catches light, reads as rounded
  vLine(ctx, colors.highlight, cx, y + 1, numRows - 2);

  // ── 6. Lapels: V opens from closed (row 0) to fully open (row 7) ─────────
  const lapelH = Math.min(8, numRows);
  for (let row = 0; row < lapelH; row++) {
    const lw = Math.round(3 * (lapelH - 1 - row) / (lapelH - 1));
    if (lw > 0) {
      hLine(ctx, colors.highlight, shirtLx,          y + row, lw);
      px(ctx,   colors.shadow,     shirtLx + lw - 1, y + row);
      hLine(ctx, colors.base,  shirtLx + shirtW - lw, y + row, lw);
      px(ctx,   colors.shadow, shirtLx + shirtW - lw, y + row);
    }
  }

  // ── 7. Anti-aliasing at silhouette steps + waist gap bridge ─────────────
  // Shoulder-to-body step (row 3)
  px(ctx, colors.shadow, x - 1, y + SHOULDER);
  px(ctx, colors.shadow, x + w, y + SHOULDER);
  // Chest-to-waist and waist-to-hip corners
  px(ctx, colors.shadow, x, y + WAIST_S);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_S);
  px(ctx, colors.shadow, x, y + WAIST_E + 1);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_E + 1);
  // Bridge pixels at waist: arm seam is at x=22, torso waist starts at x+1=24.
  // x=23 would be transparent — fill with shadow to close the gap.
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,       y + row);  // left bridge  x=23
    px(ctx, colors.shadow, x + w - 1, y + row);  // right bridge x=40
  }

  // ── 8. Armpit crease ─────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);

  // ── 9. Selective outlining (selout: shadow not black at lit edges) ────────
  px(ctx, colors.shadow,  x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow,  x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);

  // ── 10. Shoulder cap volume ───────────────────────────────────────────────
  px(ctx, colors.highlight, x - 1, y + 1);
  // Underpectoral fold
  hLine(ctx, colors.shadow, shirtLx + 1, y + 7, shirtW - 2);
}

function drawHoodieSouth(ctx, colors, x, y, w, h) {
  // Hourglass silhouette matching jacket: shoulder cap + waist taper + hip flare.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 19);
  const SHOULDER = 3;
  const WAIST_S = 7, WAIST_E = 11;

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

  // AA at waist steps + bridge pixels (same logic as jacket)
  px(ctx, colors.shadow, x, y + WAIST_S);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_S);
  px(ctx, colors.shadow, x, y + WAIST_E + 1);
  px(ctx, colors.shadow, x + w - 1, y + WAIST_E + 1);
  for (let row = WAIST_S; row <= WAIST_E; row++) {
    px(ctx, colors.shadow, x,       y + row);
    px(ctx, colors.shadow, x + w - 1, y + row);
  }

  // Selective outlining: shoulder corners → shadow not black
  px(ctx, colors.shadow,  x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow,  x + w, y);
  for (let row = 1; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);

  // Shoulder cap volume highlight
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
  // Side profile torso — row-by-row for organic side silhouette:
  //   Rows 0-2  (shoulder): full width  (w=13)
  //   Rows 3-6  (chest):    tapered 1px at back (w=12, back edge pulls in)
  //   Rows 7-11 (waist):    tapered 2px at back (w=11, most pull-in)
  //   Rows 12+  (hip):      tapered 1px at back (w=12, slight flare)
  // Front edge stays constant (facing viewer = stable silhouette).
  const h = 16;  // updated torsoH for west
  const SHOULDER = 3, WAIST_S = 7, WAIST_E = 11;

  // Back edge (x+w direction) varies; front edge (x) stays constant
  const rowW = (row) => {
    if (row < SHOULDER)                       return 13;  // full shoulder
    if (row >= WAIST_S && row <= WAIST_E)    return 11;  // narrow waist
    return 12;                                             // chest/hip
  };

  // Fill row by row
  for (let row = 0; row < h; row++) {
    hLine(ctx, clothingColors.base, x, y + row, rowW(row));
  }

  // Front side highlight (left edge — lit side facing viewer)
  vLine(ctx, clothingColors.highlight, x,     y + 1, h - 2);
  vLine(ctx, clothingColors.highlight, x + 1, y + 1, h - 2);

  // Back/right shadow (2px strip — back of torso away from light)
  for (let row = 0; row < h; row++) {
    const rw = rowW(row);
    px(ctx, clothingColors.shadow, x + rw - 2, y + row);
    px(ctx, clothingColors.shadow, x + rw - 3, y + row);
  }

  // Chest prominence at rows 3-5: slight forward bulge shadow below chest
  hLine(ctx, clothingColors.shadow, x + 2, y + 6, rowW(6) - 4);

  // Bottom edge darker
  hLine(ctx, clothingColors.shadow, x + 1, y + h - 2, rowW(h - 1) - 2);

  // Outline: front + top + bottom solid; back edge follows rowW
  hLine(ctx, clothingColors.outline, x, y, rowW(0));         // top
  hLine(ctx, clothingColors.outline, x, y + h - 1, rowW(h - 1));  // bottom
  vLine(ctx, clothingColors.outline, x, y, h);                // front edge
  for (let row = 0; row < h; row++) {
    px(ctx, clothingColors.shadow, x + rowW(row) - 1, y + row);  // back selout
  }
  // AA at waist step transitions
  px(ctx, clothingColors.shadow, x + rowW(SHOULDER) - 1, y + SHOULDER);
  px(ctx, clothingColors.shadow, x + rowW(WAIST_S) - 1,  y + WAIST_S);
  px(ctx, clothingColors.shadow, x + rowW(WAIST_E + 1) - 1, y + WAIST_E + 1);
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
    px(ctx,   pantColors.highlight,  llx + 1,      y + row);  // outer lit face
    px(ctx,   pantColors.shadow,     llx + lw - 2, y + row);  // inner-thigh shadow
    // Knee cap: 2px highlight column on outer face for knee prominence
    if (row >= 5 && row <= 7) {
      px(ctx, pantColors.highlight, llx + 2, y + row);
      // Knee shadow under cap (row 7 = knee bottom edge)
      if (row === 7) hLine(ctx, pantColors.shadow, llx + 1, y + row, lw - 2);
    }
    // Upper thigh texture highlights (rows 1, 3)
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
  // Left shoe: x=23-32 (10px wide, 4px tall)
  // Right shoe: x=34-43 (10px wide)
  // Each shoe: toe extends 2px left of leg, heel extends 2px right.
  // Organic shape: toe top rounded (erase corner), heel raised 1px (step).
  const lx = 23 + Math.round(lShoeDX);
  const rx = 34 + Math.round(rShoeDX);
  const y  = baseY;

  // ── Left shoe ─────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, lx, y, 10, 4);
  // Highlight: top row (shoe catching light from above), skip toe corner
  hLine(ctx, shoeColors.highlight, lx + 2, y, 7);
  // Mid-shine stripe row 1 (boot leather often has a secondary shine)
  hLine(ctx, shoeColors.highlight, lx + 3, y + 1, 4);
  // Sole shadow: bottom 2 rows darker + sole line
  hLine(ctx, shoeColors.shadow, lx,     y + 2, 10);
  hLine(ctx, shoeColors.shadow, lx,     y + 3, 10);
  // Toe rounding: erase top-left corner pixel, shadow at corner
  erasePixel(ctx, lx, y);
  px(ctx, shoeColors.shadow, lx + 1, y);   // soft toe top
  // Heel: top-right corner slightly lighter (catches light at back)
  px(ctx, shoeColors.highlight, lx + 9, y);
  outlineRect(ctx, shoeColors.outline, lx, y, 10, 4);
  // Toe-cap stitch line (vertical shadow 1px from left)
  px(ctx, shoeColors.shadow, lx + 2, y + 1);

  // ── Right shoe ────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, rx, y, 10, 4);
  hLine(ctx, shoeColors.highlight, rx + 1, y, 7);
  hLine(ctx, shoeColors.highlight, rx + 3, y + 1, 4);
  hLine(ctx, shoeColors.shadow, rx, y + 2, 10);
  hLine(ctx, shoeColors.shadow, rx, y + 3, 10);
  // Toe rounding (right shoe toe = right side)
  erasePixel(ctx, rx + 9, y);
  px(ctx, shoeColors.shadow, rx + 8, y);
  px(ctx, shoeColors.highlight, rx, y);
  outlineRect(ctx, shoeColors.outline, rx, y, 10, 4);
  px(ctx, shoeColors.shadow, rx + 7, y + 1);
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
  // Organic arm silhouette — SNES style:
  //   Row 0:    shoulder cap   (+1 = 6px outward)
  //   Rows 1-2: bicep swell    (+1 = 6px, widest part of upper arm)
  //   Rows 3-5: arm body       ( 0 = 5px)
  //   Rows 6-7: elbow narrow   (-1 = 4px, slight elbow pull-in)
  //   Rows 8-9: forearm swell  ( 0 = 5px, forearm slightly wider than elbow)
  //   Row 10:   wrist taper    (-1 = 4px, narrowing toward hand)
  // Left arm = lit side (outer highlight). Right arm = shadow side.
  const lx = 18, rx = 41;
  const baseY = 28;
  const baseAW = 5, sleeveH = 11, handH = 4;

  // bulge[row]: amount added to baseAW, and lx shifted left by same amount
  const bulge = [1, 1, 1, 0, 0, 0, -1, -1, 0, 0, -1];

  const lArmY = baseY + Math.round(lArmDY);
  const rArmY = baseY + Math.round(rArmDY);

  // ── Left arm (lit side) ──────────────────────────────────────────────────
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row];
    const rowLx = lx - b;          // extends outward at bicep/shoulder
    const rowW  = baseAW + b;
    hLine(ctx, clothingColors.base,     rowLx,            lArmY + row, rowW);
    px(ctx,   clothingColors.highlight, rowLx,            lArmY + row);   // outer lit face
    px(ctx,   clothingColors.shadow,    rowLx + rowW - 1, lArmY + row);   // inner shadow
    // Double highlight at shoulder cap and bicep peak rows (0-2) for volume
    if (row <= 2) px(ctx, clothingColors.highlight, rowLx + 1, lArmY + row);
    // Elbow shadow: extra dark pixel on inner face at elbow rows
    if (row === 6 || row === 7) px(ctx, clothingColors.shadow, rowLx + 1, lArmY + row);
  }
  // Soft junction seam (selout)
  for (let row = 0; row < sleeveH; row++) {
    px(ctx, clothingColors.shadow, 22, lArmY + row);
  }
  // Wrist-bottom shadow line
  hLine(ctx, clothingColors.shadow, lx - bulge[sleeveH-1], lArmY + sleeveH - 1, baseAW + bulge[sleeveH-1] - 1);

  // Left fist (aligns to arm wrist width)
  const lhw = baseAW - 1;  // 4px fist, narrower than max arm
  const lhx = lx;
  fillRect(ctx, skinColors.base, lhx, lArmY + sleeveH, lhw, handH);
  vLine(ctx, skinColors.highlight, lhx + 1,       lArmY + sleeveH, handH);
  vLine(ctx, skinColors.shadow,    lhx + lhw - 2, lArmY + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, lhx, lArmY + sleeveH, lhw, handH);
  erasePixel(ctx, lhx,           lArmY + sleeveH + handH - 1);
  erasePixel(ctx, lhx + lhw - 1, lArmY + sleeveH + handH - 1);
  px(ctx, skinColors.shadow, lhx,           lArmY + sleeveH + handH - 2);
  px(ctx, skinColors.shadow, lhx + lhw - 1, lArmY + sleeveH + handH - 2);

  // ── Right arm (shadow side) ───────────────────────────────────────────────
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row];
    const rowW = baseAW + b;
    hLine(ctx, clothingColors.base,  rx,             rArmY + row, rowW);
    px(ctx,   clothingColors.shadow, rx,             rArmY + row);   // inner selout
    px(ctx,   clothingColors.shadow, rx + rowW - 1,  rArmY + row);   // outer selout
    // Soften the outer tip at bicep/shoulder — avoid double-dark blob
    if (row <= 2) px(ctx, clothingColors.base, rx + rowW - 1, rArmY + row);
    // Elbow extra shadow
    if (row === 6 || row === 7) px(ctx, clothingColors.shadow, rx + 1, rArmY + row);
  }
  // Soft junction seam
  for (let row = 0; row < sleeveH; row++) {
    px(ctx, clothingColors.shadow, 41, rArmY + row);
  }
  hLine(ctx, clothingColors.shadow, rx + 1, rArmY + sleeveH - 1, baseAW + bulge[sleeveH-1] - 1);

  // Right fist
  const rhw = baseAW - 1;  // 4px
  const rhx = rx;
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
