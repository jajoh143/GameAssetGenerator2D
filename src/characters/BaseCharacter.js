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

function drawHeadSouth(ctx, skinColors, hairColors, hairStyle, eyeColors) {
  // Default eye colors if not provided (backwards-compat)
  eyeColors = eyeColors || { iris: '#7B4820', pupil: '#160800', lash: '#2A1800' };
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

  // Highlight zone (upper-left): tight 3×3 cluster on forehead/cheek.
  // Shadow > highlight in area (SNES rule: highlights are small bright accents).
  fillRect(ctx, skinColors.highlight, 24, HY + 8, 3, 3);  // left cheek (3×3, not 4×5)
  hLine(ctx, skinColors.highlight, 25, HY + 7, 2);         // forehead left (2px, not 3px)

  // Mid-face ambient shadow — suggests sphere curving away from light.
  // Two strip widths: 1px at right-center, 2px at right edge.
  vLine(ctx, skinColors.shadow, 36, HY + 9, 5);    // right-center tone band
  vLine(ctx, skinColors.shadow, 37, HY + 9, 3);    // extra mid-shadow strip (wider falloff)

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

  // ── Eyebrows (slight arch — inner end 1px lower for natural shape) ───────
  // Research: tilting inner corner down by 1px reads as natural/neutral brow.
  // Left brow: outer 2px at browY, inner end drops to browY+1.
  const browY = HY + 8;   // y=13
  px(ctx,  hairColors.base,   27, browY + 1);    // left brow inner (lower)
  px(ctx,  hairColors.base,   28, browY);        // left brow middle
  px(ctx,  hairColors.shadow, 29, browY);        // left brow outer (slightly darker)
  // Right brow: mirror (inner end = rightmost pixel)
  px(ctx,  hairColors.shadow, 33, browY);        // right brow outer
  px(ctx,  hairColors.base,   34, browY);        // right brow middle
  px(ctx,  hairColors.base,   35, browY + 1);    // right brow inner (lower)

  // ── Eyes (3×3 with lash row + iris/pupil + lower lid) ───────────────────
  // Research: highlight in upper-LEFT of eye for left-side light source.
  // Left eye at x=27-29, right eye at x=33-35.
  // Lashes use eyeColors.lash; iris uses eyeColors.iris; pupil uses eyeColors.pupil.
  // Shine dot: upper-left corner (x=27 for left eye, x=35 for right eye — both
  //   on the outer-lit side, matching upper-left scene light source).
  const eyeY = HY + 9;   // y=14

  // Left eye
  px(ctx, '#FFFFFF',       27, eyeY);        // shine (upper-left = lit corner)
  px(ctx, eyeColors.lash,  28, eyeY);        // lid/lash center
  px(ctx, eyeColors.lash,  29, eyeY);        // lid/lash inner
  px(ctx, eyeColors.iris,  27, eyeY + 1);    // iris outer
  px(ctx, eyeColors.pupil, 28, eyeY + 1);    // pupil
  px(ctx, eyeColors.iris,  29, eyeY + 1);    // iris inner
  px(ctx, eyeColors.lash,  28, eyeY + 2);    // lower eyelid crease (center)
  px(ctx, skinColors.shadow, 29, eyeY + 2);  // lower lid sel-out (inner edge)

  // Right eye (mirror — shine at upper-right = outer-lit corner)
  px(ctx, eyeColors.lash,  33, eyeY);        // lid/lash inner
  px(ctx, eyeColors.lash,  34, eyeY);        // lid/lash center
  px(ctx, '#FFFFFF',       35, eyeY);        // shine (upper-right = lit corner)
  px(ctx, eyeColors.iris,  33, eyeY + 1);    // iris inner
  px(ctx, eyeColors.pupil, 34, eyeY + 1);    // pupil
  px(ctx, eyeColors.iris,  35, eyeY + 1);    // iris outer
  px(ctx, skinColors.shadow, 33, eyeY + 2);  // lower lid sel-out (inner edge)
  px(ctx, eyeColors.lash,  34, eyeY + 2);    // lower eyelid crease (center)

  // ── Cheek blush (subtle — below outer eye corners) ───────────────────────
  // Research: 1-3px per cheek below/outside eyes, adds warmth + chibi personality.
  // Use skin highlight (warmest tone) so blush reads naturally across all tones.
  px(ctx, skinColors.highlight, 25, eyeY + 3);  // left cheek
  px(ctx, skinColors.highlight, 26, eyeY + 3);
  px(ctx, skinColors.highlight, 37, eyeY + 3);  // right cheek
  px(ctx, skinColors.highlight, 38, eyeY + 3);

  // ── Nose (simplified — 2 nostril dots; bridge handled by face shading) ───
  // Research: SNES small sprites often omit nose or use 1-2 shadow pixels only.
  const noseY = HY + 12;   // y=17
  px(ctx, skinColors.shadow, 30, noseY);  // left nostril dot
  px(ctx, skinColors.shadow, 33, noseY);  // right nostril dot

  // ── Mouth (4px lip line + lower lip highlight) ────────────────────────────
  // Research: top lip = dark line, bottom lip catches light = highlight row.
  // 4px mouth centered at x=32; shadow corners just outside.
  const mouthY = HY + 15;   // y=20
  // Research: mouth uses darker skin tone NOT saturated red (red reads as wound at small scale).
  // 4px lip line centered; shadow corners just outside; lower lip highlight for volume.
  px(ctx, skinColors.shadow,    29, mouthY);       // left corner shadow
  hLine(ctx, skinColors.shadow, 30, mouthY, 4);    // upper lip line (4px, darker skin tone)
  px(ctx, skinColors.shadow,    34, mouthY);       // right corner shadow
  // Lower lip: 2px highlight in center — catches light from above, adds volume
  px(ctx, skinColors.highlight, 31, mouthY + 1);
  px(ctx, skinColors.highlight, 32, mouthY + 1);

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
  // Rounded head cap: row 0 is 18px (clips 1px each side), rows 1-6 are 20px.
  // This makes the head silhouette read as a dome, not a rectangle.
  fillRect(ctx, hairColors.base, headX, headY, headW, 7);
  // Round top corners: erase outer pixels of row 0, replace with shadow
  erasePixel(ctx, headX,             headY);
  erasePixel(ctx, headX + headW - 1, headY);
  px(ctx, hairColors.shadow, headX,             headY);   // left corner shadow
  px(ctx, hairColors.shadow, headX + headW - 1, headY);   // right corner shadow

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

  // Hair-to-skin bleed: where sideburns meet the face, add 1px shadow pixels
  // at the inner sideburn edge on the skin side — softens the color jump
  // (FF6 technique: color contrast rather than hard black outline at hair/face seam).
  // Applied to cheek rows (HY+9 to HY+11) where sideburn is widest vs face.
  // Also at the hairline row HY+7 where face first appears below the hair.
  // headX+2 = x=24 (one pixel inward from sideburn into the face skin zone)

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

  // Hair-skin shadow bleed: soft 1px transition at sideburn inner edge.
  // Replaces the hard skin↔hair color jump with a shadow pixel,
  // using sel-out (shadow color not black) on the skin side of the seam.
  // Rows HY+9 to HY+11: cheek rows where face is widest (x=24 meets sideburn x=23)
  px(ctx, hairColors.shadow, headX + 2, headY + 9);   // left cheek top
  px(ctx, hairColors.shadow, headX + 2, headY + 10);  // left cheek mid
  px(ctx, hairColors.shadow, headX + 2, headY + 11);  // left cheek bot
  px(ctx, hairColors.shadow, headX + headW - 3, headY + 9);   // right cheek top
  px(ctx, hairColors.shadow, headX + headW - 3, headY + 10);  // right cheek mid
  px(ctx, hairColors.shadow, headX + headW - 3, headY + 11);  // right cheek bot
  // Hairline row HY+7: face first appears (x=25), sideburn at x=22-23.
  // x=24 is a gap — fill with hair shadow to close it.
  px(ctx, hairColors.shadow, headX + 2, headY + 7);   // left hairline fill
  px(ctx, hairColors.shadow, headX + headW - 3, headY + 7);   // right hairline fill

  // Replace black sideburn outer outline with hair shadow (sel-out on side silhouette)
  vLine(ctx, hairColors.shadow, headX,             headY, 7);
  vLine(ctx, hairColors.shadow, headX + headW - 1, headY, 7);

  // Top outline: skip corner pixels (those are shadow for rounding), draw inner span
  hLine(ctx, outline, headX + 1, headY, headW - 2);
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
  // Anti-banding: highlight width varies with body area to follow the form.
  // Shoulder (rows 0-2): 2px highlight (broad shoulder face catches most light)
  // Chest (rows 3-6):    1px highlight
  // Waist (rows 7-11):   1px highlight (taper means less surface area facing light)
  // Hip (rows 12+):      1px highlight + extra pixel on row 12 (hip flare re-facing)
  for (let row = 0; row < numRows; row++) {
    const isShoulderRow = row < SHOULDER;
    px(ctx, colors.highlight, rl(row) + 1, y + row);
    if (isShoulderRow) px(ctx, colors.highlight, rl(row) + 2, y + row); // wider shoulder lit face
    // Right panel: 2px shadow strip
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

  // ── 10. Shoulder cap + rounded corners + hip flare + cylinder body ────────
  // Left shoulder cap: highlight row 1 (rounded cap catching upper-left light)
  px(ctx, colors.highlight, x - 1, y + 1);

  // Rounded shoulder corners (finalbossblues: "emphasize simple round shapes"):
  // Erase the outer top corners of the shoulder cap so the outline curves.
  // Replace with shadow pixel to suggest the corner curves away from viewer.
  erasePixel(ctx, x - 1, y);                             // left outer corner
  px(ctx, colors.shadow, x - 1, y);                      // shadow in its place
  erasePixel(ctx, x + w, y);                             // right outer corner
  px(ctx, colors.shadow, x + w, y);                      // shadow in its place

  // Hip flare highlight: at the waist→hip transition row (WAIST_E+1 = row 12),
  // the silhouette widens back out. The newly-exposed outer pixels catch light.
  px(ctx, colors.highlight, rl(WAIST_E + 1) + 1, y + WAIST_E + 1);  // left hip edge lit

  // Jacket body cylinder shading: treat the jacket as a cylinder.
  // The surface curves away from light toward the right-center.
  // Add 1 mid-shadow pixel between shirt edge (x=35) and shadow strip (x=38-39)
  // on the chest rows — suggests the jacket fabric wrapping around the body.
  for (let row = 3; row <= 6; row++) {
    px(ctx, colors.shadow, 37, y + row);  // right-center cylinder fall-off
  }

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
  // Side profile torso — 5-zone SNES shading for jacket.
  // Silhouette taper: shoulder full width, chest slight taper at back, waist narrower.
  // Front edge (x) stays constant — stable silhouette facing the viewer.
  // For jacket: front 2px opening shows shirt/collar suggestion.
  const h = 16;
  const SHOULDER = 3, WAIST_S = 7, WAIST_E = 11;

  const rowW = (row) => {
    if (row < SHOULDER)                       return 13;  // full shoulder
    if (row >= WAIST_S && row <= WAIST_E)    return 11;  // narrow waist
    return 12;                                             // chest/hip
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
  hLine(ctx, clothingColors.shadow, x + 2, y + 6, rowW(6) - 5);

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
  // Belt curvature: center dips 1px (gravity sag) — sides terminate at y+1, center drops to y+2
  const cx = x + Math.floor(w / 2);
  px(ctx, beltColors.outline, cx - 1, y + 2);
  px(ctx, beltColors.outline, cx,     y + 2);
  px(ctx, beltColors.outline, cx + 1, y + 2);
  px(ctx, beltColors.shadow,  cx,     y + 2);  // center darkest point
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

function drawLegsSouth(ctx, pantColors, lLegDX, rLegDX, baseY, lLegDY=0, rLegDY=0, forwardLeg='none') {
  // Legs redesigned from research (Slynyrd, Tsugumo, Kandi Runner):
  //   Row widths taper naturally from thigh to ankle.
  //   Knee: no outward silhouette bump — shadow BELOW knee cap instead.
  //   Inner gap: 2px, filled dark throughout (not transparent background).
  //   Forward leg brighter (base tone), back leg darker (shadow tone) —
  //   this is the SNES standard for south-facing walk depth differentiation.
  //
  // Split DY: thigh rows (0-5) fixed at baseY, knee-to-ankle (6-12) shift.
  const legH = 13;
  const KNEE_ROW = 6;
  // Right leg origin moved to rx=33 (was 34) — closes inner gap to 2px
  const lx = 25 + Math.round(lLegDX);
  const rx = 33 + Math.round(rLegDX);
  const y  = baseY;

  // Row widths: [leftOffset, width]. No outward knee bump (research: shadow over silhouette).
  // Taper: thigh 6px → knee/shin 5px → ankle 4px.
  const rows = [
    [0, 6], [0, 6], [0, 6], [0, 6], [0, 6],  // 0-4: thigh  6px
    [0, 5], [0, 5], [0, 5],                   // 5-7: knee   5px (1px narrower on inner side)
    [0, 5], [0, 5], [0, 5],                   // 8-10: shin  5px
    [0, 4], [0, 4],                           // 11-12: ankle 4px
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
    // Knee shadow below cap (row 7) — organic knee protrusion read without bump
    if (row === 7) hLine(ctx, pantColors.shadow, llx + 1, lRowY, lw - 2);
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
    if (row === 7) hLine(ctx, pantColors.shadow, rx + 1, rRowY, rrw - 2);
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

  // Inner thigh gap: filled dark throughout (not transparent background).
  // Research: gap should be character's darkest shade — it's in deep shadow.
  const gapX = lx + rows[0][1];       // x=31 (left leg right edge + 1)
  const gapW = rx - gapX;             // 33-31=2px gap
  if (gapW > 0) {
    fillRect(ctx, pantColors.shadow,  gapX, y,     gapW, legH);   // fill gap dark all the way down
    hLine(ctx, pantColors.outline, gapX, y,     gapW);            // darker top edge (crotch shadow)
    hLine(ctx, pantColors.outline, gapX, y + 1, gapW);
  }
}

// ---------------------------------------------------------------------------
// drawLegsWest  –  side profile legs with stride
// ---------------------------------------------------------------------------

function drawLegsWest(ctx, pantColors, frontLegX, backLegX, legTopY, frontLift=0, backLift=0) {
  // SNES-style profile legs: taper thigh→knee→shin→ankle.
  // Knee bump: kneecap protrudes 1px toward front (lower X in west view).
  // Row heights: thigh 0-4, knee 5-7, shin 8-11, ankle 12.
  const legH = 13;

  // Per-row layout [xOffset from legX, width] for front leg (west = facing left, kneecap at front = lower X)
  // thigh: 5px at legX-2; knee: 6px at legX-3 (1px forward bump); shin: 5px at legX-2; ankle: 4px at legX-1
  const frontRows = [
    [-2, 5], [-2, 5], [-2, 5], [-2, 5], [-2, 5],  // 0-4: thigh 5px
    [-3, 6], [-3, 6], [-3, 6],                      // 5-7: knee 6px (1px kneecap bump forward)
    [-2, 5], [-2, 5], [-2, 5],                      // 8-10: shin 5px
    [-1, 4], [-1, 4],                               // 11-12: ankle 4px
  ];
  // Back leg: slightly simpler (less detail = depth), no kneecap bump outward
  const backRows = [
    [-2, 5], [-2, 5], [-2, 5], [-2, 5], [-2, 5],
    [-2, 5], [-2, 5], [-2, 5],
    [-2, 5], [-2, 5], [-2, 5],
    [-1, 4], [-1, 4],
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
    // Knee highlight at bump row
    if (row === 5 || row === 6) {
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
  // Left shoe: x=23-32 (10px wide, 4px tall)
  // Right shoe: x=34-43 (10px wide)
  // lShoeDY / rShoeDY: per-foot vertical offset so the forward foot drops
  // slightly lower on screen (south-view depth illusion from top-down perspective).
  const lx = 23 + Math.round(lShoeDX);
  const rx = 34 + Math.round(rShoeDX);
  const ly = baseY + Math.round(lShoeDY);   // left foot Y (forward = slightly lower)
  const ry = baseY + Math.round(rShoeDY);   // right foot Y

  // ── Left shoe ─────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, lx, ly, 10, 4);
  hLine(ctx, shoeColors.highlight, lx + 2, ly, 7);
  hLine(ctx, shoeColors.highlight, lx + 3, ly + 1, 4);
  hLine(ctx, shoeColors.shadow, lx, ly + 2, 10);
  hLine(ctx, shoeColors.shadow, lx, ly + 3, 10);
  erasePixel(ctx, lx, ly);
  px(ctx, shoeColors.shadow, lx + 1, ly);
  px(ctx, shoeColors.highlight, lx + 9, ly);
  outlineRect(ctx, shoeColors.outline, lx, ly, 10, 4);
  px(ctx, shoeColors.shadow, lx + 2, ly + 1);

  // ── Right shoe ────────────────────────────────────────────────────────────
  fillRect(ctx, shoeColors.base, rx, ry, 10, 4);
  hLine(ctx, shoeColors.highlight, rx + 1, ry, 7);
  hLine(ctx, shoeColors.highlight, rx + 3, ry + 1, 4);
  hLine(ctx, shoeColors.shadow, rx, ry + 2, 10);
  hLine(ctx, shoeColors.shadow, rx, ry + 3, 10);
  erasePixel(ctx, rx + 9, ry);
  px(ctx, shoeColors.shadow, rx + 8, ry);
  px(ctx, shoeColors.highlight, rx, ry);
  outlineRect(ctx, shoeColors.outline, rx, ry, 10, 4);
  px(ctx, shoeColors.shadow, rx + 7, ry + 1);
}

// ---------------------------------------------------------------------------
// drawShoesWest  –  side profile shoes
// ---------------------------------------------------------------------------

function drawShoesWest(ctx, shoeColors, frontX, backX, shoeY, frontLift=0, backLift=0) {
  // Positive lift = foot goes higher on screen = smaller Y value
  const frontY = shoeY - Math.round(frontLift);
  const backY  = shoeY - Math.round(backLift);

  // Back shoe (dimmer, drawn first) — 8px wide, centered better on backX
  fillRect(ctx, shoeColors.shadow, backX - 3, backY, 8, 4);
  hLine(ctx, shoeColors.shadow, backX - 3, backY + 3, 8);
  outlineRect(ctx, shoeColors.outline, backX - 3, backY, 8, 4);

  // Front shoe: pointing left (toe at lower-x = facing direction)
  fillRect(ctx, shoeColors.base, frontX - 6, frontY, 13, 4);
  hLine(ctx, shoeColors.highlight, frontX - 5, frontY, 11);
  hLine(ctx, shoeColors.shadow,    frontX - 6, frontY + 3, 13);
  // Toe and heel corners (rounded look)
  px(ctx, shoeColors.shadow, frontX - 6, frontY);
  px(ctx, shoeColors.shadow, frontX + 6, frontY);
  outlineRect(ctx, shoeColors.outline, frontX - 6, frontY, 13, 4);
}

// ---------------------------------------------------------------------------
// drawArmsSouth
// ---------------------------------------------------------------------------

function drawArmsSouth(ctx, clothingColors, skinColors, lArmDY, rArmDY, lArmOut=0, rArmOut=0) {
  // Organic arm cylinder — SNES / Pedro Medeiros anti-banding model:
  //   Row 0:    shoulder attachment (5px — narrower than dome peak, starts the cap)
  //   Rows 1-2: shoulder dome peak (6px — widest row; two rows create roundness)
  //   Rows 3-5: bicep body         (5px)
  //   Rows 6-7: elbow pull-in      (4px — slight narrow for joint read)
  //   Rows 8-9: forearm            (5px)
  //   Row 10:   wrist taper        (4px)
  //
  // Anti-banding (Pix3M rule): shadow strip width varies — NEVER the same for
  // more than 2 consecutive rows. Widens at mid-bicep, elbow, and upper forearm.
  // Shadow always on the inner (body-side) edge; highlight on outer (away) edge.
  const lx = 18, rx = 41 + Math.round(rArmOut);
  const baseY = 28;
  const baseAW = 5, sleeveH = 11, handH = 4;

  // bulge[row]: amount added to baseAW; lx shifts left by same amount.
  // Row 0 changed from 1→0: shoulder TOP is narrower than rows 1-2 (dome shape).
  const bulge = [0, 1, 1, 0, 0, 0, -1, -1, 0, 0, -1];

  // Shadow width by row: 1px baseline, 2px at anti-banding break points.
  // Mid-bicep (5): 2px. Elbow joint (6-7): 2px. Upper forearm (9): 2px.
  const shadowW = [1, 1, 1, 1, 1, 2, 2, 2, 1, 2, 1];

  const lArmY = baseY + Math.round(lArmDY);
  const rArmY = baseY + Math.round(rArmDY);

  // ── Left arm (lit side — outer edge faces away from body, catches light) ──
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row];
    const rowLx = lx - b;          // outer edge (left side, extends outward at bicep)
    const rowW  = baseAW + b;
    hLine(ctx, clothingColors.base, rowLx, lArmY + row, rowW);

    // Outer lit edge (selout: highlight not black)
    px(ctx, clothingColors.highlight, rowLx, lArmY + row);
    // Double highlight at dome peak (rows 1-2 only — row 0 is narrower cap)
    if (row === 1 || row === 2) px(ctx, clothingColors.highlight, rowLx + 1, lArmY + row);
    // Forearm long highlight strip (rows 8-9): follows the form contour
    if (row === 8 || row === 9) px(ctx, clothingColors.highlight, rowLx + 1, lArmY + row);

    // Inner shadow: width varies for anti-banding (shadow side = body side)
    const sw = shadowW[row];
    for (let i = 0; i < sw; i++) {
      px(ctx, clothingColors.shadow, rowLx + rowW - 1 - i, lArmY + row);
    }
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

  // ── Right arm (shadow side — inner edge faces body/light source) ──────────
  // Right arm is on the shadow side of the body; both edges are darker.
  // Outer edge (right): mid-shadow. Inner edge (left, torso side): deep shadow.
  // Anti-banding: same shadow width table applied to inner edge.
  for (let row = 0; row < sleeveH; row++) {
    const b = bulge[row];
    const rowW = baseAW + b;
    hLine(ctx, clothingColors.base,  rx, rArmY + row, rowW);

    // Inner edge (body side, left edge of right arm): shadow selout
    px(ctx, clothingColors.shadow, rx, rArmY + row);
    // Outer edge (right side): base or slight shadow — not black; dome peak softer
    if (row === 1 || row === 2) {
      px(ctx, clothingColors.base, rx + rowW - 1, rArmY + row);    // dome peak: base, not shadow
    } else {
      px(ctx, clothingColors.shadow, rx + rowW - 1, rArmY + row);  // shadow on outer
    }
    // Variable shadow width on outer edge for anti-banding
    const sw = shadowW[row];
    if (sw > 1) px(ctx, clothingColors.shadow, rx + rowW - 2, rArmY + row);
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

function drawArmsWest(ctx, clothingColors, skinColors, frontArmDX, backArmDX, torsoX, torsoY) {
  // 4px arms for west view
  // Torso front edge at torsoX (x=20), back edge at torsoX+12 (x=32) for shoulder row.
  // Front arm shoulder at front edge: base frontAX = torsoX - 3 (arm right edge overlaps torso front by 1px).
  // Back arm shoulder at back edge:  base backAX  = torsoX + 9 (arm right edge at torso back x=32).
  // frontArmDX / backArmDX: horizontal swing — negative = moves left (forward in west view).
  const sleeveH = 11, handH = 5, aw = 4;

  const frontY = torsoY + 1;
  const backY  = torsoY + 1;

  // Back arm (shadow tone, behind torso)
  const backAX = torsoX + 9 + Math.round(backArmDX);
  fillRect(ctx, clothingColors.shadow, backAX, backY, aw, sleeveH);
  fillRect(ctx, skinColors.shadow,     backAX, backY + sleeveH, aw, handH);
  outlineRect(ctx, clothingColors.outline, backAX, backY, aw, sleeveH + handH);

  // Front arm (full detail, drawn after torso so it appears on top)
  const frontAX = torsoX - 3 + Math.round(frontArmDX);
  fillRect(ctx, clothingColors.base, frontAX, frontY, aw, sleeveH);
  vLine(ctx, clothingColors.highlight, frontAX,         frontY, sleeveH);
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
