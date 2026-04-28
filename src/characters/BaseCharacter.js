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
// torsoSilhouette  –  shared chest/waist/hip outline used by every clothing
// draw function. Per pixel-art research (Saint11/MortMort/AdamCYounis), a
// chibi torso ~24px wide should taper at most 2px per side at the waist
// (the "1-2-1 rule": chest:waist:hip = 24:20:24). Going deeper produces
// the "wedge mistake" — characters look like traffic cones.
//
// Anchor rows (assuming a ~20-row torso):
//   0-2   shoulder bump  (rl = x-1)        — chunky chibi shoulder
//   3-4   chest           (rl = x)
//   5-8   upper waist     (rl = x+1)       — gentle 1px inset
//   9-12  narrow waist    (rl = x+2)       — apex at row ~11 = 55-60% down
//   13-14 hip transition  (rl = x+1)       — single-step return
//   15+   full hip        (rl = x)         — flares back to chest width
//
// Returns { rl, rr } where rl(row), rr(row) are the inclusive left/right
// edge x-positions of the torso at each row.
function torsoSilhouette(x, w) {
  const rl = (row) => {
    if (row < 3)   return x - 1;
    if (row < 5)   return x;
    if (row < 9)   return x + 1;
    if (row < 13)  return x + 2;
    if (row < 15)  return x + 1;
    return x;
  };
  const rr = (row) => {
    if (row < 3)   return x + w;
    if (row < 5)   return x + w - 1;
    if (row < 9)   return x + w - 2;
    if (row < 13)  return x + w - 3;
    if (row < 15)  return x + w - 2;
    return x + w - 1;
  };
  return { rl, rr };
}

// ---------------------------------------------------------------------------
// drawGroundShadow
// ---------------------------------------------------------------------------

function drawGroundShadow(ctx, cx, y, w=14, h=3) {
  fillEllipse(ctx, Colors.GROUND_SHADOW, cx, y, w, h);
}

// ---------------------------------------------------------------------------
// drawHeadSouth  –  front-facing head: HX=16,HY=24,HW=32 (26 rows, chin at y=49)
// ---------------------------------------------------------------------------

function drawBeardSouth(ctx, hairColors, beardStyle) {
  if (!beardStyle || beardStyle === 'none') return;
  const base = hairColors.base, hi = hairColors.highlight, sh = hairColors.shadow;
  // Light from upper-left: top rows near mouth = hi, outer edges + bottom = sh

  if (beardStyle === 'stubble') {
    // Scattered dots from upper jaw all the way down to chin tip
    for (let x = 24; x <= 39; x += 4) px(ctx, base, x, 44); // y=44: sparse, base color
    for (let x = 22; x <= 41; x += 3) px(ctx, sh, x, 45);   // y=45
    for (let x = 23; x <= 40; x += 3) px(ctx, sh, x, 46);   // y=46
    for (let x = 25; x <= 38; x += 3) px(ctx, sh, x, 47);   // y=47
    for (let x = 25; x <= 38; x += 3) px(ctx, sh, x, 48);   // y=48 chin (new)
    for (let x = 26; x <= 37; x += 3) px(ctx, sh, x, 49);   // y=49 lower chin (new)
    for (let x = 27; x <= 36; x += 4) px(ctx, sh, x, 50);   // y=50 chin tip (new)
  }

  if (beardStyle === 'handlebar' || beardStyle === 'full') {
    // Curled tips at y=42 (ends turn upward)
    px(ctx, sh,   26, 42); px(ctx, base, 27, 42);   // left tip
    px(ctx, base, 36, 42); px(ctx, sh,   37, 42);   // right tip
    // Main bar y=43 (12px wide: x=26..37)
    hLine(ctx, base, 26, 43, 12);
    hLine(ctx, hi,   29, 43,  5);   // center lit from above
    px(ctx, hi, 35, 43);
    px(ctx, sh, 26, 43); px(ctx, sh, 37, 43);  // outer corners in shadow
    // Underside shadow on upper lip
    hLine(ctx, sh, 29, 44,  6);
  }

  if (beardStyle === 'goatee') {
    hLine(ctx, base, 29, 43, 6);
    hLine(ctx, base, 29, 44, 6);
    hLine(ctx, base, 30, 45, 4);
    hLine(ctx, base, 30, 46, 4);
    hLine(ctx, base, 31, 47, 2);
    px(ctx,    base, 32, 48);
    // Highlights: top center rows (near mouth, lit by face above)
    hLine(ctx, hi, 30, 43, 3);
    px(ctx, hi, 30, 44);
    // Shadows: outer edges and lower rows
    px(ctx, sh, 29, 43); px(ctx, sh, 34, 43);
    px(ctx, sh, 29, 44); px(ctx, sh, 34, 44);
    px(ctx, sh, 30, 46); px(ctx, sh, 33, 46);
    hLine(ctx, sh, 31, 47, 2);
    px(ctx, sh, 32, 48);
  }

  if (beardStyle === 'full') {
    // Base fill
    hLine(ctx, base, 21, 44, 22);
    hLine(ctx, base, 20, 45, 24);
    hLine(ctx, base, 20, 46, 24);
    hLine(ctx, base, 21, 47, 22);
    hLine(ctx, base, 22, 48, 20);
    hLine(ctx, base, 24, 49, 16);
    // Shadows: right half + outer edges + bottom rows
    hLine(ctx, sh, 33, 44, 10);
    hLine(ctx, sh, 33, 45, 11);
    hLine(ctx, sh, 34, 46, 10);
    hLine(ctx, sh, 34, 47,  9);
    hLine(ctx, sh, 22, 48, 20);    // bottom row fully shadowed
    hLine(ctx, sh, 24, 49, 16);    // chin row fully shadowed
    // Highlights: top rows left-center (face reflection + upper-left light)
    hLine(ctx, hi, 21, 44, 11);
    hLine(ctx, hi, 22, 45,  6);
    px(ctx, hi, 30, 46);
  }
}

function drawHeadSouth(ctx, skinColors, hairColors, hairStyle, eyeColors, beardStyle) {
  eyeColors = eyeColors || { iris: '#7B4820', pupil: '#160800', lash: '#2A1800' };
  const HX = 16, HY = 21, HW = 32;
  const cx = HX + Math.floor(HW / 2); // center x = 32
  const outline = '#111111';
  // 'bald' fills the dome with skin instead of hair, skipping the dome
  // shading entirely so no locks/shine band are painted.
  const isBald   = hairStyle === 'bald';
  // 'buzzed' uses the hair shadow tone for the dome (close-cropped stubble),
  // skipping the bright highlights of the standard dome.
  const isBuzzed = hairStyle === 'buzzed';

  // ── HEAD SHAPE — chibi: 29 rows tall, 30px wide at max ──────────────────
  const HEAD = [
    [12,  8],  //  0: crown tip       (y=21)
    [10, 12],  //  1: upper crown     (y=22)
    [ 8, 16],  //  2: crown peak      (y=23)
    [ 6, 20],  //  3: upper dome      (y=24)
    [ 4, 24],  //  4: dome            (y=25)
    [ 3, 26],  //  5: dome top        (y=26)
    [ 2, 28],  //  6: near max        (y=27)
    [ 1, 30],  //  7: max width       (y=28)
    [ 1, 30],  //  8: max width       (y=29)
    [ 1, 30],  //  9: max width       (y=30)
    [ 1, 30],  // 10: max width       (y=31)
    [ 1, 30],  // 11: max width       (y=32)
    [ 1, 30],  // 12: max width       (y=33)
    [ 1, 30],  // 13: max width       (y=34)
    [ 1, 30],  // 14: max width       (y=35)
    [ 1, 30],  // 15: temple          (y=36)
    [ 1, 30],  // 16: hairline        (y=37) ← faceStartRow
    [ 2, 28],  // 17: forehead        (y=38)
    [ 2, 28],  // 18: brow level      (y=39)
    [ 2, 28],  // 19: eye zone        (y=40)
    [ 2, 28],  // 20: eye zone        (y=41)
    [ 2, 28],  // 21: eye zone        (y=42)
    [ 2, 28],  // 22: cheek/nose      (y=43)
    [ 2, 28],  // 23: nose zone       (y=44)
    [ 2, 28],  // 24: mouth zone      (y=45)
    [ 3, 26],  // 25: jaw wide        (y=46)
    [ 4, 24],  // 26: lower jaw       (y=47)
    [ 5, 22],  // 27: chin            (y=48)
    [ 7, 18],  // 28: chin base       (y=49)
    [ 9, 14],  // 29: chin tip        (y=50)
  ];

  // Fill the head silhouette. Bald characters fill it with skin tone so
  // there's no hair to be visible above the face window.
  // Buzzed characters fill with the darker hair shadow tone (close crop).
  const domeFill = isBald ? skinColors.base
                  : isBuzzed ? hairColors.shadow
                  : hairColors.base;
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, domeFill, HX + off, HY + r, w);
  }

  // Skip the entire dome-shading block for bald and buzzed. Both use a
  // uniform fill — locks/shine would look wrong on a shaved head.
  if (!isBald && !isBuzzed) {

  // ── Hair dome — locks + shine band (per pixel-art convention from
  //    Saint11 "clumps not strands", MortMort "anti-helmet rule",
  //    Stardew/Octopath shine-band reference).
  //
  // The cap is highlighted, then split into ~5 readable LOCKS by
  // CONTINUOUS vertical shadow stripes (not isolated dots). A shine
  // band runs ~1/3 down the head as 3 disconnected highlight clumps.
  // ASYMMETRIC details break the mirrored-dome read.

  // Crown highlights — full-width lit cap, narrows toward the sides.
  hLine(ctx, hairColors.highlight, HX + 12, HY,      8);
  hLine(ctx, hairColors.highlight, HX + 10, HY +  1, 10);
  hLine(ctx, hairColors.highlight, HX +  9, HY +  2, 10);
  hLine(ctx, hairColors.highlight, HX +  7, HY +  3, 12);
  hLine(ctx, hairColors.highlight, HX +  5, HY +  4, 12);
  hLine(ctx, hairColors.highlight, HX +  4, HY +  5, 11);
  hLine(ctx, hairColors.highlight, HX +  3, HY +  6, 13);
  hLine(ctx, hairColors.highlight, HX +  2, HY +  7, 22);
  hLine(ctx, hairColors.highlight, HX +  2, HY +  8, 22);
  hLine(ctx, hairColors.highlight, HX +  2, HY +  9, 22);
  hLine(ctx, hairColors.highlight, HX +  2, HY + 10, 22);
  hLine(ctx, hairColors.highlight, HX +  2, HY + 11, 22);

  // Lock columns — CONTINUOUS vertical shadow stripes 1px wide that
  // travel down through the highlighted dome, breaking it into 4 locks.
  // Asymmetric x offsets (the right side is shifted by 1 vs a perfect
  // mirror) so the head doesn't read as symmetric.
  const LOCK_COLS = [HX + 8, HX + 14, HX + 20, HX + 25];
  for (const lx of LOCK_COLS) {
    vLine(ctx, hairColors.shadow, lx, HY + 6, 6);   // 6px-tall vertical stripe
  }
  // Extra short asymmetric stripe — only one side, ~breaks the mirror.
  vLine(ctx, hairColors.shadow, HX + 17, HY + 9, 3);

  // Shine band — three disconnected pure-highlight clumps in row 7-8.
  // Sits on top of the existing highlight, but the surrounding shadow
  // stripes from LOCK_COLS make these 3 segments read as discrete
  // clumps of light catching the locks.
  hLine(ctx, hairColors.highlight, HX +  3, HY +  7, 4);   // left clump
  hLine(ctx, hairColors.highlight, HX + 11, HY +  7, 2);   // mid clump
  hLine(ctx, hairColors.highlight, HX + 21, HY +  7, 3);   // right clump
  // Repaint the lock stripes after the band so they're never overwritten.
  for (const lx of LOCK_COLS) {
    px(ctx, hairColors.shadow, lx, HY + 7);
  }

  // Asymmetric stray strand on the right edge — single pixel floating
  // off the smooth dome silhouette.
  px(ctx, hairColors.shadow, HX + 27, HY +  4);

  // Side band (rows 12-15): keep the original alternating shadow strands
  // for textured hair below the locks zone.
  for (let r = 12; r <= 15; r++) {
    const [off, w] = HEAD[r];
    const step = (r % 2 === 0) ? 4 : 5;
    for (let dx = 2; dx < w - 2; dx += step) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
    px(ctx, hairColors.highlight, HX + off + 1,     HY + r);
    px(ctx, hairColors.highlight, HX + off + w - 2, HY + r);
  }
  // Hairline shadow (skin shadow under hair edge)
  hLine(ctx, hairColors.shadow, HX + 1, HY + 16, 30);

  } // end of !isBald && !isBuzzed dome shading

  // Buzzed: speckle the dome with sparse base-color stubble dots so the
  // shadow fill doesn't read as a flat helmet.
  if (isBuzzed) {
    for (let r = 2; r < 16; r += 2) {
      const [off, w] = HEAD[r];
      for (let dx = (r % 4 === 0) ? 2 : 4; dx < w - 2; dx += 4) {
        px(ctx, hairColors.base, HX + off + dx, HY + r);
      }
    }
    // Soft hairline at the forehead so it doesn't blend into the face skin.
    hLine(ctx, hairColors.shadow, HX + 1, HY + 16, 30);
  }

  // ── FACE WINDOW — skin cutout ─────────────────────────────────────────────
  const FACE = [
    [22, 22],  //  0: hairline   (y=37)
    [20, 24],  //  1: forehead   (y=38)
    [20, 24],  //  2: brow       (y=39)
    [20, 24],  //  3: eye zone   (y=40)
    [20, 24],  //  4: eye zone   (y=41)
    [20, 24],  //  5: cheek      (y=42)
    [20, 24],  //  6: nose       (y=43)
    [20, 24],  //  7: mouth      (y=44)
    [20, 24],  //  8: jaw wide   (y=45)
    [21, 22],  //  9: lower jaw  (y=46)
    [22, 20],  // 10: chin       (y=47)
    [23, 18],  // 11: chin btm   (y=48)
    [24, 16],  // 12: chin base  (y=49)
    [25, 14],  // 13: chin tip   (y=50)
  ];
  const faceStartRow = 16;
  for (let i = 0; i < FACE.length; i++) {
    hLine(ctx, skinColors.base, FACE[i][0], HY + faceStartRow + i, FACE[i][1]);
  }

  // ── Face shading / volume ─────────────────────────────────────────────────
  hLine(ctx, skinColors.highlight, 21, HY + 17, 8);  // forehead highlight band
  px(ctx,    skinColors.highlight, 21, HY + 18);

  for (let i = 2; i < FACE.length - 4; i++) {       // right-side form shadow
    const [fx, fw] = FACE[i];
    px(ctx, skinColors.shadow, fx + fw - 2, HY + faceStartRow + i);
  }

  hLine(ctx, skinColors.highlight, 21, HY + 21, 2);  // left cheekbone 2×2 hi
  hLine(ctx, skinColors.highlight, 21, HY + 22, 2);
  px(ctx,    skinColors.highlight, 23, HY + 22);     // left cheek apple warmth
  hLine(ctx, skinColors.shadow,    41, HY + 21, 2);  // right cheekbone 2×2 sh
  hLine(ctx, skinColors.shadow,    41, HY + 22, 2);
  px(ctx,    skinColors.highlight, 40, HY + 22);     // right cheek apple warmth

  px(ctx, skinColors.highlight, cx, HY + 18);        // nose bridge / glabella

  hLine(ctx, skinColors.shadow, 23, HY + 24, 12);    // lower jaw shadow band
  hLine(ctx, skinColors.shadow, 24, HY + 25, 10);
  hLine(ctx, skinColors.shadow, 25, HY + 26, 11);    // chin-area shadow
  px(ctx,    skinColors.highlight, cx, HY + 26);     // chin center highlight

  // ── Face outline ─────────────────────────────────────────────────────────
  for (let i = 0; i < FACE.length; i++) {
    const [fx, fw] = FACE[i];
    const y = HY + faceStartRow + i;
    px(ctx, outline, fx, y);
    px(ctx, outline, fx + fw - 1, y);
  }

  // ── Eyebrows ─────────────────────────────────────────────────────────────
  hLine(ctx, hairColors.shadow, 22, HY + 17, 7);   // left brow (7px, 1px skin gap above eye)
  hLine(ctx, hairColors.shadow, 35, HY + 17, 7);   // right brow (7px)

  // ── Eyes — arched top, iris full vertical height, sclera both sides ─────────
  // eyeY-1: curved arch (skin corners, lash 1px in, iris center) — brow-curve shape
  // eyeY/+1: main rows — 2px outer sclera, 2px iris, 1px inner sclera
  // eyeY+2: open white bottom arc
  const eyeY = HY + 19;

  // Left eye — x=22..28; outer=left, inner=right (toward nose)
  // Arch row: corners=skin, lash at x=23 & x=27, iris fills x=24..26
  px(ctx, eyeColors.lash,  23, eyeY - 1);
  px(ctx, eyeColors.iris,  24, eyeY - 1);
  px(ctx, eyeColors.iris,  25, eyeY - 1);
  px(ctx, eyeColors.iris,  26, eyeY - 1);
  px(ctx, eyeColors.lash,  27, eyeY - 1);
  // Main rows: W W iris iris W
  px(ctx, eyeColors.lash,  22, eyeY);
  px(ctx, '#FFFFFF',       23, eyeY);
  px(ctx, '#FFFFFF',       24, eyeY);
  px(ctx, eyeColors.iris,  25, eyeY);
  px(ctx, eyeColors.iris,  26, eyeY);
  px(ctx, '#FFFFFF',       27, eyeY);
  px(ctx, eyeColors.lash,  28, eyeY);
  px(ctx, eyeColors.lash,  22, eyeY + 1);
  px(ctx, '#FFFFFF',       23, eyeY + 1);
  px(ctx, '#FFFFFF',       24, eyeY + 1);
  px(ctx, eyeColors.iris,  25, eyeY + 1);
  px(ctx, eyeColors.iris,  26, eyeY + 1);
  px(ctx, '#FFFFFF',       27, eyeY + 1);
  px(ctx, eyeColors.lash,  28, eyeY + 1);
  // Open bottom arc
  px(ctx, '#FFFFFF',       23, eyeY + 2);
  px(ctx, '#FFFFFF',       24, eyeY + 2);
  px(ctx, '#FFFFFF',       25, eyeY + 2);
  px(ctx, '#FFFFFF',       26, eyeY + 2);
  px(ctx, '#FFFFFF',       27, eyeY + 2);

  // Right eye — x=35..41; inner=left (toward nose), outer=right
  // Arch row: corners=skin, lash at x=36 & x=40, iris fills x=37..39
  px(ctx, eyeColors.lash,  36, eyeY - 1);
  px(ctx, eyeColors.iris,  37, eyeY - 1);
  px(ctx, eyeColors.iris,  38, eyeY - 1);
  px(ctx, eyeColors.iris,  39, eyeY - 1);
  px(ctx, eyeColors.lash,  40, eyeY - 1);
  // Main rows: W iris iris W W
  px(ctx, eyeColors.lash,  35, eyeY);
  px(ctx, '#FFFFFF',       36, eyeY);
  px(ctx, eyeColors.iris,  37, eyeY);
  px(ctx, eyeColors.iris,  38, eyeY);
  px(ctx, '#FFFFFF',       39, eyeY);
  px(ctx, '#FFFFFF',       40, eyeY);
  px(ctx, eyeColors.lash,  41, eyeY);
  px(ctx, eyeColors.lash,  35, eyeY + 1);
  px(ctx, '#FFFFFF',       36, eyeY + 1);
  px(ctx, eyeColors.iris,  37, eyeY + 1);
  px(ctx, eyeColors.iris,  38, eyeY + 1);
  px(ctx, '#FFFFFF',       39, eyeY + 1);
  px(ctx, '#FFFFFF',       40, eyeY + 1);
  px(ctx, eyeColors.lash,  41, eyeY + 1);
  // Open bottom arc
  px(ctx, '#FFFFFF',       36, eyeY + 2);
  px(ctx, '#FFFFFF',       37, eyeY + 2);
  px(ctx, '#FFFFFF',       38, eyeY + 2);
  px(ctx, '#FFFFFF',       39, eyeY + 2);
  px(ctx, '#FFFFFF',       40, eyeY + 2);

  // ── Nose — vertical bridge + nostril depth ────────────────────────────────
  px(ctx, skinColors.highlight, cx,     eyeY + 1);   // bridge highlight
  px(ctx, skinColors.highlight, cx,     eyeY + 2);
  px(ctx, skinColors.shadow,    cx + 1, eyeY + 2);   // right bridge shadow
  px(ctx, skinColors.shadow,    cx - 1, eyeY + 3);   // left nostril
  px(ctx, skinColors.highlight, cx,     eyeY + 3);   // nose tip lit
  px(ctx, skinColors.deep_shadow || skinColors.shadow, cx + 1, eyeY + 3);
  hLine(ctx, skinColors.shadow, cx - 1, eyeY + 4, 3); // under-nose shadow

  // ── Mouth hint (clean-shaven only) ───────────────────────────────────────
  if (!beardStyle || beardStyle === 'none') {
    hLine(ctx, skinColors.shadow,    27, HY + 23, 8);   // mouth shadow line
    px(ctx,    skinColors.highlight, cx - 1, HY + 23);  // lower lip center hi
    px(ctx,    skinColors.highlight, cx,     HY + 23);
  }

  // ── Beard ─────────────────────────────────────────────────────────────────
  drawBeardSouth(ctx, hairColors, beardStyle);

  // ── Head silhouette outline ───────────────────────────────────────────────
  // Use the skin outline for bald characters so the dome reads as bare scalp,
  // not as a hair-coloured edge.
  const silhouetteEdge = isBald ? skinColors.outline : hairColors.shadow;
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    px(ctx, silhouetteEdge, HX + off, HY + r);
    px(ctx, silhouetteEdge, HX + off + w - 1, HY + r);
  }
  // Crown top outline — use skin outline for bald so the silhouette reads
  // as bare scalp, not a hair-coloured cap.
  const crownEdge = isBald ? skinColors.outline : outline;
  hLine(ctx, crownEdge, HX + 12, HY, 8);  // crown top outline (HEAD[0]=[12,8])
  const last = HEAD[HEAD.length - 1];
  hLine(ctx, outline, HX + last[0], HY + HEAD.length, last[1]);  // chin outline

  // For bald characters, add a subtle scalp highlight at the very top of
  // the dome to give the head some volume / lit-from-above read.
  if (isBald) {
    hLine(ctx, skinColors.highlight, HX + 13, HY + 1, 6);
    hLine(ctx, skinColors.highlight, HX + 11, HY + 2, 8);
    hLine(ctx, skinColors.highlight, HX +  9, HY + 3, 8);
    // Subtle shadow on the right side (away from light)
    px(ctx, skinColors.shadow, HX + 24, HY + 4);
    px(ctx, skinColors.shadow, HX + 25, HY + 5);
    px(ctx, skinColors.shadow, HX + 26, HY + 6);
    // The face window normally erases the dome between rows 16-29; for
    // bald, leave the silhouette intact (no hairline shadow).
  }

  // ── Hair style extensions — drawn after face so bangs overlap forehead ────
  if (hairStyle === 'long') {
    // Left bang: hangs over left forehead
    hLine(ctx, hairColors.base,      20, HY + 17, 8);
    hLine(ctx, hairColors.base,      20, HY + 18, 6);
    px(ctx,    hairColors.highlight, 21, HY + 17);
    px(ctx,    hairColors.highlight, 22, HY + 17);
    px(ctx,    hairColors.shadow,    20, HY + 17);
    px(ctx,    hairColors.shadow,    27, HY + 17);
    px(ctx,    hairColors.shadow,    25, HY + 18);
    // Right bang: mirrors left
    hLine(ctx, hairColors.base,      36, HY + 17, 8);
    hLine(ctx, hairColors.base,      38, HY + 18, 6);
    px(ctx,    hairColors.highlight, 42, HY + 17);
    px(ctx,    hairColors.highlight, 41, HY + 17);
    px(ctx,    hairColors.shadow,    43, HY + 17);
    px(ctx,    hairColors.shadow,    36, HY + 17);
    px(ctx,    hairColors.shadow,    38, HY + 18);
    // Side strands flowing below chin
    for (let r = 0; r < 5; r++) {
      const hw = Math.max(2, 8 - r * 2);
      hLine(ctx, hairColors.base,   HX,           HY + HEAD.length + r, hw);
      hLine(ctx, hairColors.base,   HX + HW - hw, HY + HEAD.length + r, hw);
      px(ctx,    hairColors.shadow, HX + hw - 1,  HY + HEAD.length + r);
      px(ctx,    hairColors.shadow, HX + HW - hw, HY + HEAD.length + r);
    }
  } else if (hairStyle === 'medium') {
    // Left-sweep bang covers left forehead, tapers inward
    hLine(ctx, hairColors.base,      20, HY + 17, 10);
    hLine(ctx, hairColors.base,      20, HY + 18,  7);
    px(ctx,    hairColors.highlight, 21, HY + 17);
    px(ctx,    hairColors.highlight, 22, HY + 17);
    px(ctx,    hairColors.shadow,    20, HY + 17);
    px(ctx,    hairColors.shadow,    29, HY + 17);
    px(ctx,    hairColors.shadow,    26, HY + 18);
    // Slight side extension at jaw level
    for (let r = 23; r <= 26; r++) {
      const [off, w] = HEAD[r];
      px(ctx, hairColors.base,   HX + off - 1, HY + r);
      px(ctx, hairColors.base,   HX + off + w, HY + r);
      px(ctx, hairColors.shadow, HX + off - 1, HY + r + 1);
    }
  } else if (hairStyle === 'curly') {
    // Alternating bump-out pixels around the sides, poof at crown
    for (let r = 2; r <= 5; r++) {
      const [off, w] = HEAD[r];
      px(ctx, hairColors.base, HX + off - 1, HY + r);
      px(ctx, hairColors.base, HX + off + w, HY + r);
    }
    for (let r = 6; r <= 25; r++) {
      const [off, w] = HEAD[r];
      const tone = (r % 2 === 0) ? hairColors.highlight : hairColors.shadow;
      px(ctx, tone, HX + off - 1, HY + r);
      px(ctx, tone, HX + off + w, HY + r);
    }
  } else if (hairStyle === 'undercut') {
    for (let r = 18; r <= 22; r++) {
      const [fx, fw] = FACE[r - faceStartRow] || [HX, HW];
      for (let x = HX; x < fx; x++) erasePixel(ctx, x, HY + r);
      for (let x = fx + fw; x < HX + HW; x++) erasePixel(ctx, x, HY + r);
    }
    hLine(ctx, hairColors.highlight, HX + 2, HY + 11, HW - 4);
    hLine(ctx, hairColors.highlight, HX + 2, HY + 12, HW - 5);
  } else if (hairStyle === 'spiky') {
    // Anime spiky hair: connected triangular tufts rising from the crown.
    // Each tuft is a 3-4px-wide triangle that tapers to a 1px tip; their
    // bases overlap at HY so the cluster reads as a single hair mass, not
    // a row of antennae. Inspired by FF6/shonen-anime sprites where hair
    // is drawn as clumps with strong directional light.
    //
    // Layout: 6 asymmetric tufts; bases overlap by 1px to connect.
    const TUFTS = [
      { cx: HX +  5, h: 3, bw: 4 },   // far-left, short
      { cx: HX +  9, h: 5, bw: 4 },   // left-mid, medium-tall
      { cx: HX + 13, h: 6, bw: 4 },   // center, tallest
      { cx: HX + 17, h: 4, bw: 4 },   // mid-right, medium
      { cx: HX + 21, h: 6, bw: 4 },   // right-mid, tall (asymmetric)
      { cx: HX + 25, h: 3, bw: 4 },   // far-right, short
    ];

    // First pass: fill triangular tufts (base color)
    const tipPts = [];
    for (const t of TUFTS) {
      for (let row = 0; row < t.h; row++) {
        // Width tapers from 1px at top to bw at bottom, integer pixel-art steps
        const w = Math.max(1, 1 + Math.floor(row * (t.bw - 1) / Math.max(t.h - 1, 1)));
        const x0 = t.cx - Math.floor((w - 1) / 2);
        const yy = HY - t.h + row;
        hLine(ctx, hairColors.base, x0, yy, w);
        // Lit left edge
        px(ctx, hairColors.highlight, x0, yy);
        // Shadow right edge (only when tuft has thickness)
        if (w >= 3) px(ctx, hairColors.shadow, x0 + w - 1, yy);
      }
      tipPts.push({ x: t.cx, y: HY - t.h });
    }

    // Second pass: outline the silhouette (selout — use hair shadow, not pure black)
    // Trace the upper edge by walking left-to-right across each tuft row by row.
    // Only outline the OUTER hull (top of each tuft); skip interior gap pixels
    // so the cluster reads as one mass.
    for (const t of TUFTS) {
      // Tip outline (1px above tip)
      px(ctx, hairColors.shadow, t.cx, HY - t.h - 1);
      // Side outlines along the diagonal of each tuft (selout, not pure black)
      for (let row = 0; row < t.h; row++) {
        const w = Math.max(1, 1 + Math.floor(row * (t.bw - 1) / Math.max(t.h - 1, 1)));
        const x0 = t.cx - Math.floor((w - 1) / 2);
        const yy = HY - t.h + row;
        // Outline 1px to the left of left edge (only if it's not covered by previous tuft)
        px(ctx, hairColors.shadow, x0 - 1, yy);
        // Outline 1px to the right of right edge
        px(ctx, hairColors.shadow, x0 + w, yy);
      }
    }

    // Repaint tuft bases over any stray outline pixels at HY-1 so adjacent
    // tufts' bases visibly merge into one continuous hairline.
    for (const t of TUFTS) {
      const w = t.bw;
      const x0 = t.cx - Math.floor((w - 1) / 2);
      hLine(ctx, hairColors.base, x0, HY - 1, w);
    }

    // Tight sideburn fade (same as 'short')
    px(ctx, hairColors.shadow, HX + 1, HY + 14);
    px(ctx, hairColors.shadow, HX + 1, HY + 15);
    px(ctx, hairColors.shadow, HX + HW - 2, HY + 14);
    px(ctx, hairColors.shadow, HX + HW - 2, HY + 15);
  } else if (hairStyle === 'mohawk') {
    // Mohawk: shaved sides + central spike strip proportional to the head.
    // Strip is 7px wide centered on the head (HX+13..HX+19), spikes max 5px.
    const stripL = HX + 13;   // left edge of strip (center = HX+16 = head center)
    const STRIP_W = 7;
    const SHAVE_L = HX + 13;  // shave everything left of strip
    const SHAVE_R = HX + 20;  // shave everything right of strip

    // 1. Shave the sides — fill with scalp skin colour
    for (let r = 0; r < 16; r++) {
      const [off, hw] = HEAD[r];
      for (let sx = HX + off; sx < SHAVE_L && sx < HX + off + hw; sx++) {
        px(ctx, skinColors.base, sx, HY + r);
      }
      for (let sx = Math.max(SHAVE_R, HX + off); sx < HX + off + hw; sx++) {
        px(ctx, skinColors.base, sx, HY + r);
      }
    }

    // 2. Soft scalp shading along the strip border and outer scalp
    for (let r = 3; r < 15; r++) {
      const [off, hw] = HEAD[r];
      if (SHAVE_L - 1 >= HX + off)               px(ctx, skinColors.shadow,    SHAVE_L - 1, HY + r);
      if (SHAVE_R < HX + off + hw)                px(ctx, skinColors.shadow,    SHAVE_R,     HY + r);
      if (HX + off + 2 < SHAVE_L)                 px(ctx, skinColors.highlight, HX + off + 2, HY + r);
      if (HX + off + hw - 3 >= SHAVE_R)           px(ctx, skinColors.shadow,    HX + off + hw - 3, HY + r);
    }

    // 3. Central strip — clipped to head silhouette
    for (let r = 0; r < 16; r++) {
      const [off, hw] = HEAD[r];
      const sx = Math.max(stripL, HX + off);
      const ex = Math.min(stripL + STRIP_W - 1, HX + off + hw - 1);
      if (sx <= ex) hLine(ctx, hairColors.base, sx, HY + r, ex - sx + 1);
    }
    // Strip shading: 1px highlight on left, 1px shadow on right
    vLine(ctx, hairColors.highlight, stripL + 1, HY, 16);
    vLine(ctx, hairColors.shadow,    stripL + STRIP_W - 2, HY, 16);

    // 4. Three proportional spike tips (heights 3-5-4, asymmetric)
    const SPIKES = [
      { x: stripL + 1, h: 3 },
      { x: stripL + 3, h: 5 },  // center-left: tallest
      { x: stripL + 5, h: 4 },
    ];
    for (const s of SPIKES) {
      vLine(ctx, hairColors.base, s.x,     HY - s.h, s.h);
      vLine(ctx, hairColors.base, s.x + 1, HY - s.h, s.h);
      vLine(ctx, hairColors.highlight, s.x, HY - s.h + 1, s.h - 1);
      px(ctx,  hairColors.highlight, s.x, HY - s.h);
      px(ctx,  hairColors.shadow, s.x + 1, HY - 1);
      px(ctx, outline, s.x,     HY - s.h - 1);
      px(ctx, outline, s.x + 1, HY - s.h - 1);
    }
    // Strip side outlines
    vLine(ctx, outline, stripL - 1,       HY, 16);
    vLine(ctx, outline, stripL + STRIP_W, HY, 16);
  } else if (hairStyle === 'topknot') {
    // Topknot: pulled-back hair leaves a smooth crown, with a small
    // round bun protruding above the head.
    // 1. Smooth out the crown — overdraw rows 0-7 with the base + small
    //    central highlight (hair pulled tight).
    for (let r = 0; r < 8; r++) {
      const [off, w] = HEAD[r];
      hLine(ctx, hairColors.base, HX + off, HY + r, w);
    }
    hLine(ctx, hairColors.highlight, HX + 12, HY + 1, 8);
    hLine(ctx, hairColors.highlight, HX + 11, HY + 2, 6);
    // 2. The bun — 6×4 rounded rectangle above the crown
    const bx = HX + 12, by = HY - 5;
    fillRect(ctx, hairColors.base,      bx,     by,     6, 4);
    px(ctx,       hairColors.base,      bx + 1, by - 1);
    px(ctx,       hairColors.base,      bx + 2, by - 1);
    px(ctx,       hairColors.base,      bx + 3, by - 1);
    px(ctx,       hairColors.base,      bx + 4, by - 1);
    // Bun shading
    hLine(ctx, hairColors.highlight, bx + 1, by,     2);
    hLine(ctx, hairColors.highlight, bx + 1, by + 1, 2);
    px(ctx,    hairColors.shadow,    bx + 4, by + 2);
    px(ctx,    hairColors.shadow,    bx + 5, by + 2);
    px(ctx,    hairColors.shadow,    bx + 4, by + 3);
    // Outline the bun
    hLine(ctx, outline, bx + 1, by - 2, 4);
    px(ctx, outline, bx,     by - 1);
    px(ctx, outline, bx + 5, by - 1);
    vLine(ctx, outline, bx - 1, by,     4);
    vLine(ctx, outline, bx + 6, by,     4);
    hLine(ctx, outline, bx,     by + 4, 6);
  } else {
    // 'short' — small asymmetric tufts at crown, tightest cut
    hLine(ctx, hairColors.base,      HX + 11, HY - 1, 3); // center-left tuft
    hLine(ctx, hairColors.base,      HX + 16, HY - 1, 2); // right tuft
    px(ctx,    hairColors.highlight, HX + 12, HY - 2);    // tuft tip highlight
    px(ctx,    hairColors.highlight, HX + 13, HY - 1);    // center lit
    px(ctx,    hairColors.shadow,    HX + 11, HY - 1);    // left shadow
    px(ctx,    hairColors.shadow,    HX + 17, HY - 1);    // right shadow
    // Tight sideburn fade
    px(ctx, hairColors.shadow, HX + 1, HY + 14);
    px(ctx, hairColors.shadow, HX + 1, HY + 15);
    px(ctx, hairColors.shadow, HX + HW - 2, HY + 14);
    px(ctx, hairColors.shadow, HX + HW - 2, HY + 15);
  }
}

// drawHairSouth is now integrated into drawHeadSouth (hair-first unified head)
function drawHairSouth() {}

// ---------------------------------------------------------------------------
// drawHeadNorth  –  back of head, fixed at x=22, y=5  (20×18)
// ---------------------------------------------------------------------------

function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  const HX = 16, HY = 24, HW = 28;  // 26 rows, chin at y=49, neck at y=50
  const outline = '#111111';

  const HEAD = [
    [ 9,  8],  //  0: crown peak   (y=24)
    [ 8, 10],  //  1: upper crown  (y=25)
    [ 7, 12],  //  2: crown        (y=26)
    [ 6, 14],  //  3: upper dome   (y=27)
    [ 4, 18],  //  4: dome         (y=28)
    [ 3, 20],  //  5: dome top     (y=29)
    [ 2, 22],  //  6: near max     (y=30)
    [ 3, 22],  //  7: upper dome   (y=31)
    [ 2, 24],  //  8: dome         (y=32)
    [ 1, 26],  //  9: max width    (y=33)
    [ 1, 26],  // 10: max width    (y=34)
    [ 1, 26],  // 11: max width    (y=35)
    [ 1, 26],  // 12: temple       (y=36)
    [ 1, 26],  // 13: upper mid    (y=37)
    [ 2, 24],  // 14: mid          (y=38)
    [ 2, 24],  // 15: mid          (y=39)
    [ 2, 24],  // 16: mid          (y=40)
    [ 2, 24],  // 17: lower mid    (y=41)
    [ 2, 24],  // 18: lower        (y=42)
    [ 2, 24],  // 19: lower        (y=43)
    [ 2, 24],  // 20: lower        (y=44)
    [ 2, 24],  // 21: jaw wide     (y=45)
    [ 3, 22],  // 22: lower jaw    (y=46)
    [ 4, 20],  // 23: chin         (y=47)
    [ 5, 18],  // 24: chin bottom  (y=48)
    [ 7, 14],  // 25: chin base    (y=49)
  ];

  fillRect(ctx, skinColors.base, HX + 5, HY + 22, HW - 10, 4);  // neck-back skin

  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, hairColors.base, HX + off, HY + r, w);
  }

  // Crown highlights — match smooth silhouette
  hLine(ctx, hairColors.highlight, HX + 9,  HY,      6);  // row 0: [9,8]
  hLine(ctx, hairColors.highlight, HX + 8,  HY +  1, 8);  // row 1: [8,10]
  hLine(ctx, hairColors.highlight, HX + 7,  HY +  2, 8);  // row 2: [7,12]
  hLine(ctx, hairColors.highlight, HX + 6,  HY +  3, 10); // row 3: [6,14]
  hLine(ctx, hairColors.highlight, HX + 5,  HY +  4, 14); // row 4: [4,18]
  hLine(ctx, hairColors.highlight, HX + 4,  HY +  5, 16); // row 5: [3,20]
  hLine(ctx, hairColors.highlight, HX + 3,  HY +  6, 14); // row 6: [2,22]
  hLine(ctx, hairColors.highlight, HX + 2,  HY +  7, 18); // row 7: [2,24]
  hLine(ctx, hairColors.highlight, HX + 1,  HY +  8, 22); // row 8: [1,26]
  for (let r = 9; r <= 12; r++) {
    const [off, w] = HEAD[r];
    for (let dx = 3; dx < w - 3; dx += 5) {
      px(ctx, hairColors.shadow, HX + off + dx, HY + r);
    }
  }
  hLine(ctx, hairColors.shadow, HX + 7, HY + 24, 8);
  hLine(ctx, hairColors.shadow, HX + 8, HY + 25, 6);

  if (hairStyle === 'long') {
    for (let r = 0; r < 5; r++) {
      hLine(ctx, hairColors.base, HX + 1, HY + HEAD.length + r, HW - 2);
    }
    hLine(ctx, hairColors.shadow, HX + 1, HY + HEAD.length + 3, HW - 2);
    hLine(ctx, hairColors.shadow, HX + 1, HY + HEAD.length + 4, HW - 2);
  }

  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    px(ctx, outline, HX + off, HY + r);
    px(ctx, outline, HX + off + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + 9, HY, 8);
  const last = HEAD[HEAD.length - 1];
  hLine(ctx, outline, HX + last[0], HY + HEAD.length, last[1]);
}

// ---------------------------------------------------------------------------
// drawHeadWest  –  side profile facing LEFT, nose extends past HX
// ---------------------------------------------------------------------------

function drawBeardWest(ctx, hairColors, beardStyle) {
  if (!beardStyle || beardStyle === 'none') return;
  // Must match HX in drawHeadWest
  const HX = 13, HY = 24;
  const base = hairColors.base, sh = hairColors.shadow;

  if (beardStyle === 'stubble') {
    // Two dots per row, staying within narrowing skin area, down to chin tip
    px(ctx, sh, HX + 2, HY + 20); px(ctx, sh, HX + 5, HY + 20); // y=44 skin x=15-25
    px(ctx, sh, HX + 3, HY + 21); px(ctx, sh, HX + 6, HY + 21); // y=45 skin x=16-24
    px(ctx, sh, HX + 4, HY + 22); px(ctx, sh, HX + 6, HY + 22); // y=46 skin x=17-23
    px(ctx, sh, HX + 5, HY + 23); px(ctx, sh, HX + 7, HY + 23); // y=47 skin x=18-22
    px(ctx, sh, HX + 6, HY + 24); px(ctx, sh, HX + 7, HY + 24); // y=48 skin x=19-21
    px(ctx, sh, HX + 7, HY + 25);                                 // y=49 skin x=20 only
  }

  if (beardStyle === 'handlebar' || beardStyle === 'full') {
    // Mustache at HX+1 (not HX) so outline doesn't overwrite it
    px(ctx, base, HX + 1, HY + 18);
    px(ctx, base, HX + 2, HY + 18);
    px(ctx, sh,   HX + 1, HY + 19);
  }

  if (beardStyle === 'goatee') {
    hLine(ctx, base, HX + 4, HY + 22, 2);
    hLine(ctx, base, HX + 5, HY + 23, 2);
    px(ctx,    sh,   HX + 6, HY + 24);
  }

  if (beardStyle === 'full') {
    // Jaw-to-chin coverage; positions follow the jaw narrowing in S rows 20-24
    hLine(ctx, base, HX + 2, HY + 20, 3);
    hLine(ctx, sh,   HX + 3, HY + 21, 3);
    hLine(ctx, sh,   HX + 4, HY + 22, 3);
    hLine(ctx, sh,   HX + 5, HY + 23, 2);
    px(ctx,    sh,   HX + 6, HY + 24);
  }
}

function drawHeadWest(ctx, skinColors, hairColors, hairStyle, eyeColors, beardStyle) {
  // Profile head: HX=13, HY=24. 26 rows — chin at y=49 meets neck at y=50.
  // HX=13 moves face 2px forward of torso (natural protrusion in side view).
  // Max width 18px — larger skull gives the face room to show detail.
  const HX = 13, HY = 24;
  const outline = '#111111';

  // Profile silhouette — max 18px wide, 26 rows tall
  // xo/w derived from absolute positions: left edge = HX+xo, right = HX+xo+w-1
  const S = [
    [6,  5],  //  0: crown peak   (abs 19-23, y=24)
    [5,  7],  //  1: upper crown  (abs 18-24, y=25)
    [4,  9],  //  2: crown        (abs 17-25, y=26)
    [3, 11],  //  3: upper dome   (abs 16-26, y=27)
    [2, 13],  //  4: dome         (abs 15-27, y=28)
    [1, 16],  //  5: dome width   (abs 14-28, y=29)
    [0, 18],  //  6: max width    (abs 13-30, y=30)
    [0, 18],  //  7: max width    (abs 13-30, y=31)
    [0, 18],  //  8: max width    (abs 13-30, y=32)
    [0, 18],  //  9: max width    (abs 13-30, y=33)
    [0, 18],  // 10: max width    (abs 13-30, y=34)
    [0, 18],  // 11: hairline     (abs 13-30, y=35)
    [0, 18],  // 12: face start   (abs 13-30, y=36)
    [0, 18],  // 13: brow         (abs 13-30, y=37)
    [0, 18],  // 14: eye zone     (abs 13-30, y=38)
    [0, 18],  // 15: eye zone     (abs 13-30, y=39)
    [0, 18],  // 16: nose zone    (abs 13-30, y=40)
    [0, 17],  // 17: nose lower   (abs 13-29, y=41)
    [0, 17],  // 18: mouth        (abs 13-29, y=42)
    [0, 17],  // 19: mouth        (abs 13-29, y=43)
    [2, 14],  // 20: jaw          (abs 15-28, y=44)
    [3, 12],  // 21: jaw          (abs 16-27, y=45)
    [4, 10],  // 22: lower jaw    (abs 17-26, y=46)
    [5,  8],  // 23: chin         (abs 18-25, y=47)
    [6,  6],  // 24: chin         (abs 19-24, y=48)
    [7,  4],  // 25: chin tip     (abs 20-23, y=49)
  ];
  const HH = S.length; // 26

  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    hLine(ctx, hairColors.base, HX + xo, HY + r, w);
  }

  // Skin fill — width capped so 3px hair strip remains at back of head
  for (let r = 12; r <= 23; r++) {
    const [xo, w] = S[r];
    const faceW = Math.min(w - 3, 15);
    hLine(ctx, skinColors.base, HX + xo, HY + r, faceW);
  }

  // Face shading — front-lit highlight strip on face-forward column
  for (let r = 12; r <= 18; r++) {
    px(ctx, skinColors.highlight, HX + 1, HY + r);
  }
  for (let r = 21; r <= 23; r++) {
    const [xo, w] = S[r];
    hLine(ctx, skinColors.shadow, HX + xo + 1, HY + r, Math.max(1, Math.min(w - 4, 5)));
  }

  // Dome highlights
  hLine(ctx, hairColors.highlight, HX + S[6][0] + 3, HY + 6, Math.max(1, S[6][1] - 7));
  hLine(ctx, hairColors.highlight, HX + 3, HY + 7, 6);
  hLine(ctx, hairColors.shadow, HX, HY + 12, S[12][1]);

  // ── Forehead highlight ────────────────────────────────────────────────────
  px(ctx, skinColors.highlight, HX + 2, HY + 12);
  px(ctx, skinColors.highlight, HX + 3, HY + 13);

  // ── Brow ridge — starts at HX+1 (not HX) so it's never at the outline column
  hLine(ctx, hairColors.shadow, HX + 1, HY + 13, 3);

  // ── Eye — outline at HX acts as the eyelid; sclera+iris visible behind it ─
  // The white row at HY+13 was removed: it was overwriting the brow above.
  const ec = eyeColors || { iris: '#7B4820', pupil: '#160800', lash: '#2A1800' };
  px(ctx, ec.lash,    HX,     HY + 14);  // front lid (outline will redraw this black = eyelid)
  px(ctx, '#FFFFFF',  HX + 1, HY + 14);  // sclera front
  px(ctx, ec.iris,    HX + 2, HY + 14);  // iris
  px(ctx, '#FFFFFF',  HX + 3, HY + 14);  // sclera back
  px(ctx, '#FFFFFF',  HX + 1, HY + 15);  // lower sclera

  // ── Cheekbone highlight ───────────────────────────────────────────────────
  px(ctx, skinColors.highlight, HX + 3, HY + 16);

  // ── Nose — protrudes 1px past face front edge ────────────────────────────
  // Tip highlight and bridge are drawn at HX-1 (outside the outline column).
  // The old outline pixel at HX-1,HY+15 has been removed — it was overwriting
  // the bridge highlight making the nose invisible.
  px(ctx, skinColors.highlight, HX - 1, HY + 14);   // tip highlight
  px(ctx, skinColors.highlight, HX - 1, HY + 15);   // bridge (now visible)
  px(ctx, skinColors.shadow,    HX - 1, HY + 16);   // under-nose
  px(ctx, skinColors.shadow,    HX + 1, HY + 17);   // philtrum shadow

  // ── Mouth hint ────────────────────────────────────────────────────────────
  px(ctx, skinColors.shadow, HX + 1, HY + 18);

  // ── Ear ──────────────────────────────────────────────────────────────────
  px(ctx, skinColors.shadow,    HX + 9, HY + 15);
  px(ctx, skinColors.highlight, HX + 8, HY + 16);
  px(ctx, skinColors.shadow,    HX + 9, HY + 17);

  // Back-of-head hair strip
  const backEnd = hairStyle === 'short' ? 19 : hairStyle === 'medium' ? 22 : HH;
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

  // Beard (drawn before outline so silhouette border sits on top)
  drawBeardWest(ctx, hairColors, beardStyle);

  // Outline
  for (let r = 0; r < HH; r++) {
    const [xo, w] = S[r];
    px(ctx, outline, HX + xo, HY + r);
    px(ctx, outline, HX + xo + w - 1, HY + r);
  }
  hLine(ctx, outline, HX + S[0][0], HY, S[0][1]);
  hLine(ctx, outline, HX + S[HH-1][0], HY + HH - 1, S[HH-1][1]);
  // nose outline: only bottom edge — the top was overwriting the bridge highlight
  px(ctx, outline, HX - 1, HY + 17);  // under-nose outline
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
  // Open-front jacket over a clearly-visible shirt:
  //   • SHIRT ZONE is 7px wide with a FIXED warm off-white colour so it
  //     contrasts against any jacket palette (using jacket highlight caused
  //     the shirt to blend on light-coloured jackets).
  //   • V-COLLAR: shirt zone widens upward (3px at row 1 → 5px at row 2 →
  //     7px from row 3 onward) so the collar reads as an open V notch.
  //   • 2px LAPEL FOLD each side: outer shadow + inner deep-shadow gives the
  //     lapels readable thickness and makes the jacket flap read as fabric.
  //   • CENTER PLACKET: slightly-darker vertical line down the shirt with a
  //     single button dot, reinforcing the "shirt + open jacket" read.
  //   • Hip-level SLIT POCKETS.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const { rl, rr } = torsoSilhouette(x, w);

  // Fixed bright cream shirt + very dark placket line: chosen to pop
  // against ANY jacket palette (dark, medium grey, tan, light). Tested
  // against grey/charcoal/tan/brown jackets.
  const SHIRT_BASE  = '#F0E8D0';   // bright warm cream (visible vs medium greys)
  const SHIRT_DARK  = '#4A3E2E';   // very dark placket (visible vs cream shirt)

  const SHIRT_TOP    = 1;
  const SHIRT_BOTTOM = numRows - 3;

  // Shirt zone width: V-collar narrows to a 3px slit at the collar tip,
  // then opens to full 7px by row 3 (simulates lapels folding back from neck).
  const shirtL = (row) => {
    if (row < SHIRT_TOP || row > SHIRT_BOTTOM) return null;
    if (row === SHIRT_TOP)     return cx - 1;   // 3px collar slit
    if (row === SHIRT_TOP + 1) return cx - 2;   // 5px transition
    return cx - 3;                               // 7px full shirt zone
  };
  const shirtR = (row) => {
    if (row < SHIRT_TOP || row > SHIRT_BOTTOM) return null;
    if (row === SHIRT_TOP)     return cx + 1;
    if (row === SHIRT_TOP + 1) return cx + 2;
    return cx + 3;
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

  // ── 3. Waist crease ──────────────────────────────────────────────────────
  for (let row = 9; row < 13; row++) {
    px(ctx, colors.shadow, rl(row) + 1, y + row);
    px(ctx, colors.shadow, rr(row) - 1, y + row);
  }

  // ── 4. Shirt zone + 2px lapel folds ──────────────────────────────────────
  const deepCol = colors.deep_shadow || colors.shadow;
  // Soft shirt-shadow is mid-tone (between bright shirt and dark placket).
  const SHIRT_SHADE = '#B8B098';
  for (let row = 0; row < numRows; row++) {
    const sL = shirtL(row), sR = shirtR(row);
    if (sL === null || sR === null) continue;
    // Shirt fabric fill
    hLine(ctx, SHIRT_BASE, sL, y + row, sR - sL + 1);
    // Subtle right-side shirt shading (right lapel casts onto the shirt)
    px(ctx, SHIRT_SHADE, sR, y + row);
    // Left lapel fold: 2px — outer shadow then deep-shadow (the lap fold)
    px(ctx, colors.shadow, sL - 1, y + row);
    px(ctx, deepCol,       sL - 2, y + row);
    // Right lapel fold: 2px
    px(ctx, colors.shadow, sR + 1, y + row);
    if (row >= 2 && row < SHIRT_BOTTOM) {
      px(ctx, deepCol, sR + 2, y + row);
    }
  }

  // ── 5. Center placket + button ───────────────────────────────────────────
  // Dark vertical placket line — main visual cue that there's a shirt with
  // a button strip down the middle. High contrast against the cream shirt.
  for (let row = SHIRT_TOP + 2; row <= SHIRT_BOTTOM; row++) {
    px(ctx, SHIRT_DARK, cx, y + row);
  }
  // Single bright button on the dark placket at row 9 (between pec-line and waist)
  px(ctx, SHIRT_BASE, cx,     y + 9);   // button (cream — pops against placket)
  px(ctx, SHIRT_DARK, cx - 1, y + 9);  // button shadow on left (3D pop)

  // ── 6. Hip-level slit pockets ────────────────────────────────────────────
  const POCKET_Y = numRows - 6;
  if (POCKET_Y > 10) {
    hLine(ctx, colors.shadow, rl(POCKET_Y) + 2, y + POCKET_Y, 2);
    hLine(ctx, colors.shadow, rr(POCKET_Y) - 3, y + POCKET_Y, 2);
  }

  // ── 7. Selout outline ────────────────────────────────────────────────────
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
  const { rl, rr } = torsoSilhouette(x, w);

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

  // ── Hood: a bunched fabric mass behind the neck ─────────────────────────
  // The hood sits BEHIND the head/shoulders and peeks up above and to the
  // sides of the head so it's clearly readable as a hood, not a turtleneck.
  // It's drawn into the head/neck region (negative y offsets — head is at
  // y-30..y rows above the torso). We restrict to the narrow window between
  // the head and shoulders.
  //
  // Shape:                                ┌───┐
  //                                      ─┤   ├─        ← row -3..-1: side flares
  //                                       └─┬─┘
  //                                  ─────  │  ─────    ← row 0..3: collar bunch
  const HOOD_COLOR = colors.collar || colors.shadow;
  // Side flares: the hood pokes up alongside the head outline
  const hoodSideY = y - 4;
  fillRect(ctx, colors.base, cx - 8, hoodSideY,     4, 4);   // left flare
  fillRect(ctx, colors.base, cx + 4, hoodSideY,     4, 4);   // right flare
  // Highlight on top-left of left flare (lit from upper-left)
  hLine(ctx, colors.highlight, cx - 7, hoodSideY,     2);
  px(ctx,    colors.highlight, cx - 7, hoodSideY + 1);
  // Shadow on right flare
  hLine(ctx, colors.shadow,    cx + 5, hoodSideY + 3, 3);
  px(ctx,    colors.shadow,    cx + 7, hoodSideY + 1);
  // Outline around flares
  outlineRect(ctx, colors.outline, cx - 8, hoodSideY,     4, 4);
  outlineRect(ctx, colors.outline, cx + 4, hoodSideY,     4, 4);

  // Hood collar bunch: wide, taller in the middle, thick fabric look
  const hoodW = 14;
  const hoodX = cx - Math.floor(hoodW / 2);
  fillRect(ctx, colors.base, hoodX, y, hoodW, 4);
  // Inner liner / shadow band (the inside of the hood)
  hLine(ctx, HOOD_COLOR, hoodX + 2, y + 1, hoodW - 4);
  hLine(ctx, HOOD_COLOR, hoodX + 2, y + 2, hoodW - 4);
  // Top edge highlight (lit fabric)
  hLine(ctx, colors.highlight, hoodX + 1, y, hoodW - 2);
  // Bottom shadow (where hood meets collar)
  hLine(ctx, colors.shadow,    hoodX + 1, y + 3, hoodW - 2);
  // Deep shadow at the deepest part of the hood interior
  hLine(ctx, colors.deep_shadow || colors.shadow, hoodX + 4, y + 1, hoodW - 8);
  outlineRect(ctx, colors.outline, hoodX, y, hoodW, 4);

  // Center zipper (below the hood collar)
  vLine(ctx, colors.shadow, cx, y + 4, numRows - 4);

  // Drawstrings — two cords hanging from hood collar with metal aglets
  const dsTop = y + 4, dsLen = 5;
  vLine(ctx, colors.shadow,    cx - 2, dsTop, dsLen);
  vLine(ctx, colors.shadow,    cx + 2, dsTop, dsLen);
  px(ctx, colors.highlight,    cx - 2, dsTop);
  px(ctx, colors.highlight,    cx + 2, dsTop);
  px(ctx, colors.deep_shadow || colors.shadow, cx - 2, dsTop + dsLen - 1);
  px(ctx, colors.deep_shadow || colors.shadow, cx + 2, dsTop + dsLen - 1);

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
  // Chef/work apron with proper shoulder straps + waist tie:
  //   • Underlying shirt fills the torso silhouette using the same warm
  //     cream we use for the jacket's shirt zone (always contrasts).
  //   • Apron BIB starts BELOW the collarbone (~row 4) so the shirt collar
  //     and shoulders are visible above it — that's what reads as "apron".
  //   • Two SHOULDER STRAPS run from the bib top up to the neckline.
  //   • Horizontal WAIST TIE at the bottom with little tail strings.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const { rl, rr } = torsoSilhouette(x, w);

  // ── 1. Underlying shirt (warm cream) fills entire torso ─────────────────
  const SHIRT_BASE = '#F0E8D0';
  const SHIRT_DARK = '#A8A090';
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, SHIRT_BASE, rl(row), y + row, rr(row) - rl(row) + 1);
  }
  // Shirt directional shading
  for (let row = 0; row < numRows; row++) {
    px(ctx, SHIRT_DARK, rr(row) - 1, y + row);   // right side shadow
    if (rr(row) - rl(row) >= 8) px(ctx, SHIRT_DARK, rr(row) - 2, y + row);
  }

  // ── 2. Apron bib — narrower than torso, starts below collar ─────────────
  const BIB_TOP = 4;                 // skip rows 0-3 (collar/shoulder area)
  const ax = x + 4, aw = w - 8;      // 16px wide, leaving 4px shirt each side
  for (let row = BIB_TOP; row < numRows; row++) {
    hLine(ctx, colors.base, ax, y + row, aw);
  }
  // Bib directional shading (light from upper-left)
  vLine(ctx, colors.highlight, ax + 1, y + BIB_TOP, numRows - BIB_TOP);
  vLine(ctx, colors.shadow,    ax + aw - 2, y + BIB_TOP, numRows - BIB_TOP);
  // Shadow under the top edge of the bib (lip of fabric folding away)
  hLine(ctx, colors.shadow, ax + 1, y + BIB_TOP, aw - 2);
  // Highlight along the very top edge of the bib
  hLine(ctx, colors.highlight, ax + 1, y + BIB_TOP + 1, aw - 2);

  // ── 3. Shoulder straps — two diagonals from bib corners to neckline ─────
  // Left strap: from ax (bib top-left) up to neck base
  for (let r = 0; r < BIB_TOP; r++) {
    const sx = ax + r;               // diagonal: each row up shifts in by 1
    px(ctx, colors.base,      sx,     y + (BIB_TOP - 1 - r));
    px(ctx, colors.highlight, sx,     y + (BIB_TOP - 1 - r));
    px(ctx, colors.shadow,    sx + 1, y + (BIB_TOP - 1 - r));   // strap depth
  }
  // Right strap: from ax+aw-1 (bib top-right) up to neck base, mirrored
  for (let r = 0; r < BIB_TOP; r++) {
    const sx = ax + aw - 1 - r;
    px(ctx, colors.base,    sx,     y + (BIB_TOP - 1 - r));
    px(ctx, colors.shadow,  sx,     y + (BIB_TOP - 1 - r));
    px(ctx, colors.shadow,  sx - 1, y + (BIB_TOP - 1 - r));
  }

  // ── 4. Waist tie — horizontal ribbon across the bib at hip level ────────
  const TIE_Y = numRows - 4;
  fillRect(ctx, colors.collar || colors.shadow, ax, y + TIE_Y, aw, 2);
  hLine(ctx, colors.highlight, ax + 1, y + TIE_Y,     aw - 2);
  // Tail strings hanging outside the bib (left + right)
  px(ctx, colors.collar || colors.shadow, ax - 1, y + TIE_Y);
  px(ctx, colors.collar || colors.shadow, ax - 1, y + TIE_Y + 1);
  px(ctx, colors.collar || colors.shadow, ax + aw, y + TIE_Y);
  px(ctx, colors.collar || colors.shadow, ax + aw, y + TIE_Y + 1);

  // ── 5. Center seam down the bib (faint, suggests fabric drape) ──────────
  for (let row = BIB_TOP + 2; row < numRows - 1; row += 2) {
    px(ctx, colors.shadow, cx, y + row);
  }

  // ── 6. Outlines ─────────────────────────────────────────────────────────
  // Bib outline
  for (let row = BIB_TOP; row < numRows; row++) {
    px(ctx, colors.outline, ax,     y + row);
    px(ctx, colors.outline, ax + aw - 1, y + row);
  }
  hLine(ctx, colors.outline, ax, y + BIB_TOP, aw);          // top edge
  hLine(ctx, colors.outline, ax, y + numRows - 1, aw);       // bottom hem
  // Strap outlines (1px shadow above the diagonal)
  for (let r = 0; r < BIB_TOP; r++) {
    px(ctx, colors.outline, ax + r,        y + (BIB_TOP - 1 - r) - 1);
    px(ctx, colors.outline, ax + aw - 1 - r, y + (BIB_TOP - 1 - r) - 1);
  }
  // Torso silhouette outline (unchanged from generic clothing)
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
}

function drawShirtSouth(ctx, colors, x, y, w, h) {
  // Plain collared shirt — organic torso silhouette, shirt collar at top.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const { rl, rr } = torsoSilhouette(x, w);

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
  // Button placket: single shadow seam at center
  vLine(ctx, colors.shadow, cx, y + 3, numRows - 3);
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
  // Leather/work vest over a button-up shirt:
  //   • Underlying SHIRT covers the full torso silhouette (warm cream so
  //     it always contrasts with the vest leather/fabric).
  //   • VEST has a deep V-NECK opening — wider at the top, tapering to a
  //     narrow gap in the middle, then closed (buttoned) at the bottom.
  //     The triangular shirt-V is the strongest visual cue this is a vest.
  //   • Two BUTTONS down the front below the V.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const { rl, rr } = torsoSilhouette(x, w);

  // ── 1. Shirt underneath (warm cream) ────────────────────────────────────
  const SHIRT_BASE = '#F0E8D0';
  const SHIRT_DARK = '#A8A090';
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, SHIRT_BASE, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Vest body fills the torso EXCEPT a V-shaped opening at top ──────
  // V-opening: 7 rows tall, widens from 1px at row 6 to 7px at row 0.
  const V_DEPTH = 7;
  const vOpenL = (row) => {
    if (row >= V_DEPTH) return null;
    const halfW = Math.ceil((V_DEPTH - row) * 0.55);   // narrows downward
    return cx - halfW;
  };
  const vOpenR = (row) => {
    if (row >= V_DEPTH) return null;
    const halfW = Math.ceil((V_DEPTH - row) * 0.55);
    return cx + halfW;
  };

  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row);
    const vL = vOpenL(row), vR = vOpenR(row);
    if (vL === null) {
      // Below the V — vest covers the full row
      hLine(ctx, colors.base, l, y + row, r - l + 1);
    } else {
      // Within the V — split into left panel + V-gap (shirt) + right panel
      if (vL - 1 >= l) hLine(ctx, colors.base, l, y + row, vL - l);
      if (r >= vR + 1) hLine(ctx, colors.base, vR + 1, y + row, r - vR);
    }
    // Directional shading
    px(ctx, colors.highlight, l + 1, y + row);
    px(ctx, colors.shadow,    r - 1, y + row);
    if (r - l >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 2, y + row);
  }

  // ── 3. Inner V-edge: thin shadow lines along the V opening ──────────────
  for (let row = 0; row < V_DEPTH; row++) {
    const vL = vOpenL(row), vR = vOpenR(row);
    if (vL !== null && vL - 1 >= rl(row)) px(ctx, colors.shadow, vL - 1, y + row);
    if (vR !== null && vR + 1 <= rr(row)) px(ctx, colors.shadow, vR + 1, y + row);
  }
  // Shirt collar tips peek into the V at top (shirt collar stays visible)
  px(ctx, SHIRT_DARK, cx - 1, y);
  px(ctx, SHIRT_DARK, cx + 1, y);

  // ── 4. Center button placket below the V (3 dark dots) ──────────────────
  for (const btnRow of [V_DEPTH + 1, V_DEPTH + 5, V_DEPTH + 9]) {
    if (btnRow < numRows - 1) {
      px(ctx, colors.outline, cx, y + btnRow);
      px(ctx, colors.highlight, cx - 1, y + btnRow);
    }
  }
  // Center seam where vest closes (faint)
  vLine(ctx, colors.shadow, cx, y + V_DEPTH, numRows - V_DEPTH);

  // ── 5. Outer silhouette outline ─────────────────────────────────────────
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
  // RPG tunic: rounded collar, minimal seam.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 28);
  const { rl, rr } = torsoSilhouette(x, w);

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
  // Mage robe: long flowing garment that extends from the shoulders down
  // past the knees, flaring outward at the hem. Drawn AFTER legs/belt so
  // the lower portion overlays them — the wearer's pants don't show.
  //
  // Silhouette:
  //   Rows 0-2  : shoulders (chunky chibi 1px outset)
  //   Rows 3-19 : torso (uses standard organic silhouette)
  //   Rows 20+  : skirt/tail flares outward 1-3px each side
  const cx = Math.floor(x + w / 2);
  const tailH = 18;                                // covers belt + most of legs
  const totalH = h + tailH;
  const torso = torsoSilhouette(x, w);
  // Custom silhouette: torso for upper rows, then flare outward in steps.
  const rl = (row) => {
    if (row < h) return torso.rl(row);
    const flareDelta = Math.min(Math.floor((row - h) / 5) + 1, 3);
    return x - flareDelta;
  };
  const rr = (row) => {
    if (row < h) return torso.rr(row);
    const flareDelta = Math.min(Math.floor((row - h) / 5) + 1, 3);
    return x + w - 1 + flareDelta;
  };

  // ── 1. Base fill ────────────────────────────────────────────────────────
  for (let row = 0; row < totalH; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional shading ──────────────────────────────────────────────
  for (let row = 0; row < totalH; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
  }

  // ── 3. Center ornament stripe — decorative front panel from chest to hem
  const panelW = 6;
  for (let row = 6; row < totalH - 1; row++) {
    hLine(ctx, colors.collar || colors.shadow, cx - 3, y + row, panelW);
    px(ctx, colors.highlight, cx - 2, y + row);
    px(ctx, colors.shadow,    cx + 2, y + row);
  }
  // Decorative trim bands at top and bottom of panel
  hLine(ctx, colors.outline, cx - 3, y + 6, panelW);
  hLine(ctx, colors.outline, cx - 3, y + totalH - 2, panelW);

  // ── 4. Vertical fabric folds running down the skirt ─────────────────────
  // Three subtle fold lines: left-of-center, far-left, far-right (mage robe).
  const SKIRT_TOP = h;
  for (const foldX of [rl(SKIRT_TOP) + 4, rr(SKIRT_TOP) - 4, rl(totalH - 1) + 2]) {
    for (let row = SKIRT_TOP; row < totalH - 1; row += 1) {
      px(ctx, colors.shadow, foldX, y + row);
    }
  }

  // ── 5. Hem shadow at very bottom (heavy fabric weight) ──────────────────
  const HEM = totalH - 2;
  hLine(ctx, colors.deep_shadow || colors.shadow,
    rl(HEM) + 1, y + HEM, rr(HEM) - rl(HEM) - 1);

  // ── 6. Wide collar at top ───────────────────────────────────────────────
  const collarW = 15;
  fillRect(ctx, colors.collar || colors.shadow, cx - 7, y, collarW, 5);
  hLine(ctx, colors.highlight, cx - 6, y,     collarW - 2);
  hLine(ctx, colors.shadow,    cx - 6, y + 4, collarW - 2);
  outlineRect(ctx, colors.outline, cx - 7, y, collarW, 5);

  // ── 7. Outlines ─────────────────────────────────────────────────────────
  px(ctx, colors.shadow, x - 1, y - 1);
  px(ctx, colors.shadow, x + w, y - 1);
  px(ctx, colors.shadow, x - 1, y);
  hLine(ctx, colors.outline, x, y, w);
  px(ctx, colors.shadow, x + w, y);
  for (let row = 1; row < totalH - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(totalH - 1), botR = rr(totalH - 1);
  hLine(ctx, colors.outline, botL, y + totalH - 1, botR - botL + 1);
  px(ctx, colors.highlight, x - 1, y + 1);
}

function drawTshirtSouth(ctx, colors, x, y, w, h, isVneck) {
  // T-shirt with a properly-shaped neckline:
  //   • CREW NECK: oval-curved ribbed band — wider at sides than middle,
  //     so the front of the collar dips slightly. Ribbed (alternating
  //     base/shadow) to read as fabric, not a flat sticker.
  //   • V-NECK: triangular cut showing skin/dark interior, with a 1px
  //     ribbed border running along each diagonal V-edge.
  //   • SLEEVE SEAM hint at row 3 on each shoulder edge (1px shadow line).
  //   • Subtle chest fold at row 7 + hem stitch at the bottom row.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const { rl, rr } = torsoSilhouette(x, w);

  // ── 1. Fill base ────────────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional shading ──────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
  }

  // ── 3. Neckline ─────────────────────────────────────────────────────────
  const COL  = colors.collar || colors.shadow;
  const DEEP = colors.deep_shadow || colors.shadow;

  if (isVneck) {
    // V-cut: 5 rows deep, widest at row 0 (5px wide), tapering to 1px point.
    // Inside the V we paint a darker tone (jacket-shadow) so the V reads as
    // a "cut" through the fabric. The diagonal edges get 1px highlight on
    // the lit side and 1px deep-shadow on the underside (selout).
    const V_DEPTH = 5;
    for (let row = 0; row < V_DEPTH; row++) {
      // halfW shrinks as we descend: row 0 = 3, row 4 = 0
      const halfW = Math.max(0, 3 - Math.floor(row * 3 / Math.max(V_DEPTH - 1, 1)));
      if (halfW <= 0) continue;
      const sl = cx - halfW, sr = cx + halfW;
      // Inner V: dark (suggests the inside of the shirt visible below the cut)
      hLine(ctx, COL, sl, y + row, sr - sl + 1);
      // Highlight on the lit (left) edge, deep shadow on the right edge
      px(ctx, colors.highlight, sl,     y + row);
      px(ctx, DEEP,             sr,     y + row);
      // Outline along the V edges (1px outside the V)
      px(ctx, colors.outline,   sl - 1, y + row);
      px(ctx, colors.outline,   sr + 1, y + row);
    }
  } else {
    // Crew neck: ovate ribbed band, dips 1px at the centre front.
    //   Row 0: 8 wide  (cx-4..cx+3)
    //   Row 1: 6 wide  (cx-3..cx+2) — front of collar dips here
    //   Row 2: 4 wide  (cx-2..cx+1) — bottom of collar curve
    const COLLAR_ROWS = [
      { halfL: 4, halfR: 4 },
      { halfL: 3, halfR: 3 },
      { halfL: 2, halfR: 2 },
    ];
    for (let row = 0; row < COLLAR_ROWS.length; row++) {
      const c = COLLAR_ROWS[row];
      const sl = cx - c.halfL, sr = cx + c.halfR - 1;
      // Alternating rib stripes (base ↔ collar tone) for ribbed knit feel
      const ribCol = (row % 2 === 0) ? COL : colors.shadow;
      hLine(ctx, ribCol, sl, y + row, sr - sl + 1);
    }
    // Top edge highlight (light hits the top of the crew band)
    hLine(ctx, colors.highlight, cx - 3, y, 6);
    // Bottom shadow under the collar (where it meets the chest fabric)
    hLine(ctx, DEEP, cx - 1, y + 3, 2);
    // Curved edges (selout — outline the visible curve of the collar)
    px(ctx, colors.outline, cx - 4, y);
    px(ctx, colors.outline, cx + 3, y);
    px(ctx, colors.outline, cx - 4, y + 1);
    px(ctx, colors.outline, cx + 3, y + 1);
    px(ctx, colors.outline, cx - 3, y + 2);
    px(ctx, colors.outline, cx + 2, y + 2);
    hLine(ctx, colors.outline, cx - 2, y + 3, 4);
  }

  // ── 4. Sleeve seam suggestion at the shoulder edge ─────────────────────
  px(ctx, DEEP, rl(3),     y + 3);
  px(ctx, DEEP, rr(3),     y + 3);

  // ── 5. Subtle chest fold at row 7 ──────────────────────────────────────
  hLine(ctx, colors.shadow, rl(7) + 3, y + 7, rr(7) - rl(7) - 5);

  // ── 6. Bottom hem stitch line (1 row above bottom) ─────────────────────
  hLine(ctx, colors.shadow,
    rl(numRows - 2) + 1, y + numRows - 2, rr(numRows - 2) - rl(numRows - 2) - 1);

  // ── 7. Selout outline ──────────────────────────────────────────────────
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

function drawTankSouth(ctx, colors, skinColors, x, y, w, h) {
  // Sleeveless tank top with a CURVED SCOOP NECKLINE.
  // Tank fabric covers the entire torso column (arms are drawn separately
  // in skin tone via armClothing). A scoop-shaped opening at the top reveals
  // the bare chest. The scoop is widest at the collarbone (9px) and tapers
  // to a 3px notch about 6 rows down — classic athletic tank silhouette.
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const { rl, rr } = torsoSilhouette(x, w);
  const skin = skinColors || { highlight: '#D4935A', base: '#B87040', shadow: '#8C4820', outline: '#3A1800' };

  // Scoop shape — half-width at each row. null when row is fully fabric.
  const SCOOP_DEPTH = 6;
  const scoopHalfW = (row) => {
    if (row >= SCOOP_DEPTH) return null;
    if (row === 0) return 4;   //  9px wide at collarbone
    if (row === 1) return 4;
    if (row === 2) return 3;
    if (row === 3) return 3;
    if (row === 4) return 2;
    return 1;                  // narrow point at row 5
  };

  // 1. Fill all rows with TANK FABRIC.
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // 2. Directional shading on entire fabric.
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
  }

  // 3. Carve the scoop neckline — paint bare chest skin inside the opening.
  for (let row = 0; row < SCOOP_DEPTH; row++) {
    const halfW = scoopHalfW(row);
    if (halfW === null) continue;
    const sl = cx - halfW, sr = cx + halfW;
    hLine(ctx, skin.base, sl, y + row, sr - sl + 1);
    px(ctx, skin.highlight, sl, y + row);
    if (halfW >= 2) px(ctx, skin.highlight, sl + 1, y + row);
    px(ctx, skin.shadow, sr, y + row);
  }

  // 4. Pec underline visible inside the scoop.
  const PEC_ROW = SCOOP_DEPTH - 3;
  if (PEC_ROW >= 0) {
    const halfW = scoopHalfW(PEC_ROW);
    if (halfW !== null && halfW >= 2) {
      hLine(ctx, skin.shadow, cx - halfW + 1, y + PEC_ROW + 1, halfW * 2 - 1);
    }
  }

  // 5. Scoop edge — 1px deep-shadow on the fabric side, sells the curve.
  for (let row = 0; row < SCOOP_DEPTH; row++) {
    const halfW = scoopHalfW(row);
    if (halfW === null) continue;
    const sl = cx - halfW, sr = cx + halfW;
    px(ctx, colors.deep_shadow || colors.shadow, sl - 1, y + row);
    px(ctx, colors.deep_shadow || colors.shadow, sr + 1, y + row);
  }
  // Bottom of scoop where fabric closes up.
  hLine(ctx, colors.deep_shadow || colors.shadow, cx - 2, y + SCOOP_DEPTH, 4);

  // 6. Bottom hem stitch line (1 row above the bottom).
  hLine(ctx, colors.shadow,
    rl(numRows - 2) + 1, y + numRows - 2, rr(numRows - 2) - rl(numRows - 2) - 1);

  // 7. Selout outline (fabric portion only).
  for (let row = 0; row < numRows - 1; row++) {
    px(ctx, colors.shadow, rl(row), y + row);
    px(ctx, colors.shadow, rr(row), y + row);
  }
  const botL = rl(numRows - 1), botR = rr(numRows - 1);
  hLine(ctx, colors.outline, botL, y + numRows - 1, botR - botL + 1);
}

// Tank-top shoulder strap overlay — draws the two straps that cross OVER the
// deltoid. Called AFTER drawArmsSouth so the straps visibly sit on top of
// the arm/shoulder rather than getting overwritten by the arm draw.
//
// Geometry:
//   • Left strap occupies x = STRAP_LX .. STRAP_LX+1 (2px wide)
//   • Right strap occupies x = STRAP_RX .. STRAP_RX+1 (2px wide)
//   • Vertical span: from y = baseY-1 (just above the deltoid, on the trap)
//     down to y = torsoY + NECK_OPEN_ROWS (where the body fabric begins)
//
// The strap appears to start on the body fabric (chest), travel UP across
// the bare skin, OVER the deltoid, and disappear over the trapezius — the
// classic tank-top silhouette from front view.
function drawTankStrapsOverlaySouth(ctx, clothingColors, torsoX, torsoY, w) {
  const NECK_OPEN_ROWS = 4;
  const baseY = torsoY - 1;          // top of deltoid
  // Strap x positions chosen to centre on each deltoid (left arm spans
  // x=16..22; right arm spans x=43..49). 2px wide strap reads cleanly at
  // sprite scale. Slightly biased toward the inner side so the strap
  // visually attaches to the body fabric.
  const STRAP_LX = 19;               // covers left deltoid inner half
  const STRAP_RX = 43;               // covers right deltoid inner half
  const STRAP_W  = 2;
  const topY     = baseY - 1;        // 1px above deltoid (on trap)
  const botY     = torsoY + NECK_OPEN_ROWS;  // first row of body fabric

  // Fill straps with base colour
  for (let row = topY; row <= botY; row++) {
    fillRect(ctx, clothingColors.base, STRAP_LX, row, STRAP_W, 1);
    fillRect(ctx, clothingColors.base, STRAP_RX, row, STRAP_W, 1);
  }
  // Lit edge on left strap (light comes from upper-left)
  for (let row = topY; row <= botY; row++) {
    px(ctx, clothingColors.highlight, STRAP_LX,     row);
    px(ctx, clothingColors.shadow,    STRAP_RX + 1, row);
  }
  // Inner shadow column: gives the strap thickness/depth
  for (let row = topY; row <= botY; row++) {
    px(ctx, clothingColors.shadow,    STRAP_LX + STRAP_W - 1, row);
    px(ctx, clothingColors.highlight, STRAP_RX,               row);
  }
  // Outline the strap edges so it reads as fabric on top of skin
  for (let row = topY; row <= botY; row++) {
    px(ctx, clothingColors.outline, STRAP_LX - 1,           row);
    px(ctx, clothingColors.outline, STRAP_LX + STRAP_W,     row);
    px(ctx, clothingColors.outline, STRAP_RX - 1,           row);
    px(ctx, clothingColors.outline, STRAP_RX + STRAP_W,     row);
  }
  // Top cap: the strap "ends" at the trap with a 1px outline so it doesn't
  // appear to float into the head area.
  hLine(ctx, clothingColors.outline, STRAP_LX - 1, topY - 1, STRAP_W + 2);
  hLine(ctx, clothingColors.outline, STRAP_RX - 1, topY - 1, STRAP_W + 2);
}

function drawBomberSouth(ctx, colors, x, y, w, h) {
  // Flight bomber jacket (MA-1 style):
  //   • Small RIBBED COLLAR (~9px wide × 2 rows) only at the neck — NOT
  //     the full shoulder-width collar of a jumper. Real bombers have a
  //     stand collar that sits just at the throat.
  //   • Prominent RIBBED HEM at the bottom (3 rows, alternating stripes).
  //   • Center zipper with metal teeth dots.
  //   • Chest patch / nameplate on the left.
  //   • Sleeve cuff suggestion (handled via arms, but we leave 1px shadow
  //     at row 4 to suggest the sleeve seam).
  const cx = Math.floor(x + w / 2);
  const numRows = Math.min(h, 20);
  const { rl, rr } = torsoSilhouette(x, w);

  // ── 1. Fill base ────────────────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    hLine(ctx, colors.base, rl(row), y + row, rr(row) - rl(row) + 1);
  }

  // ── 2. Directional shading ──────────────────────────────────────────────
  for (let row = 0; row < numRows; row++) {
    const l = rl(row), r = rr(row), rw = r - l + 1;
    px(ctx, colors.highlight, l + 1, y + row);
    if (rw >= 8) px(ctx, colors.highlight, l + 2, y + row);
    px(ctx, colors.shadow, r - 1, y + row);
    if (rw >= 8) px(ctx, colors.shadow, r - 2, y + row);
    if (rw >= 13) px(ctx, colors.deep_shadow || colors.shadow, r - 3, y + row);
  }

  // ── 3. Small stand-collar at the neck (9 wide × 2 rows, ribbed) ─────────
  const COLLAR_W = 9, COLLAR_X = cx - 4, COLLAR_H = 2;
  for (let row = 0; row < COLLAR_H; row++) {
    const ribCol = (row % 2 === 0) ? (colors.collar || colors.shadow) : colors.shadow;
    hLine(ctx, ribCol, COLLAR_X, y + row, COLLAR_W);
  }
  // Collar top edge highlight + bottom shadow
  hLine(ctx, colors.highlight, COLLAR_X + 1, y, COLLAR_W - 2);
  hLine(ctx, colors.deep_shadow || colors.shadow, COLLAR_X + 1, y + COLLAR_H - 1, COLLAR_W - 2);
  // Outline only the visible front face of the collar
  px(ctx, colors.outline, COLLAR_X,           y);
  px(ctx, colors.outline, COLLAR_X + COLLAR_W - 1, y);
  hLine(ctx, colors.outline, COLLAR_X, y + COLLAR_H, COLLAR_W);

  // ── 4. Center zipper from below collar to start of hem ──────────────────
  const HEM_H = 3;
  const ZIP_TOP = COLLAR_H;
  const ZIP_BOT = numRows - HEM_H;
  // Zipper tape: dark line + lit edge
  for (let row = ZIP_TOP; row < ZIP_BOT; row++) {
    px(ctx, colors.deep_shadow || colors.shadow, cx,     y + row);
    px(ctx, colors.highlight,                    cx - 1, y + row);
  }
  // Zipper teeth — small metal dots every 2 rows
  for (let row = ZIP_TOP + 1; row < ZIP_BOT; row += 2) {
    px(ctx, '#A8A8A8', cx, y + row);
  }
  // Zipper pull at top (square detail)
  fillRect(ctx, '#888888', cx - 1, y + ZIP_TOP, 2, 2);
  px(ctx, '#D8D8D8', cx - 1, y + ZIP_TOP);

  // ── 5. Chest patch / nameplate (left chest, off-white) ─────────────────
  const PATCH_W = 5, PATCH_H = 3;
  const PATCH_X = cx - 8, PATCH_Y = y + 4;
  fillRect(ctx, '#D8D0C0', PATCH_X, PATCH_Y, PATCH_W, PATCH_H);
  // Patch shading + stitching
  hLine(ctx, '#A89878', PATCH_X, PATCH_Y + PATCH_H - 1, PATCH_W);
  outlineRect(ctx, colors.outline, PATCH_X, PATCH_Y, PATCH_W, PATCH_H);

  // ── 6. Soft chest fold across the upper torso ──────────────────────────
  hLine(ctx, colors.shadow, rl(8) + 3, y + 8, rr(8) - rl(8) - 5);

  // ── 7. Prominent ribbed hem (last 3 rows, full width with rib stripes) ──
  for (let row = numRows - HEM_H; row < numRows; row++) {
    const ribCol = (row - (numRows - HEM_H)) % 2 === 0
      ? (colors.collar || colors.shadow)
      : colors.shadow;
    hLine(ctx, ribCol, rl(row), y + row, rr(row) - rl(row) + 1);
    // Light edge on top of each rib stripe
    if ((row - (numRows - HEM_H)) % 2 === 0) {
      px(ctx, colors.highlight, rl(row) + 1, y + row);
      px(ctx, colors.highlight, rl(row) + 2, y + row);
    }
  }
  // Top-of-hem seam line (1px shadow above the ribbed hem)
  hLine(ctx, colors.deep_shadow || colors.shadow,
    rl(numRows - HEM_H) + 1, y + numRows - HEM_H - 1,
    rr(numRows - HEM_H) - rl(numRows - HEM_H) - 1);

  // ── 8. Selout outline ───────────────────────────────────────────────────
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
  const tailH  = 8;                       // coat extension — shows most of the legs
  const totalH = h + tailH;

  // Shared organic torso for rows 0..h-1; tail flare for rows h..totalH-1.
  const torso = torsoSilhouette(x, w);
  const rl = (row) => {
    if (row < h) return torso.rl(row);
    const flare = Math.min(Math.floor((row - h) / 4) + 1, 2);
    return x - flare;
  };
  const rr = (row) => {
    if (row < h) return torso.rr(row);
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

  // ── 7. Step AA at shoulder transition (row 3 = chest start in shared silhouette) ───
  px(ctx, colors.shadow, x - 1, y + 3);
  px(ctx, colors.shadow, x + w, y + 3);

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

  // Shoulder cap: 2 highlight rows, lit from upper-left
  hLine(ctx, clothingColors.highlight, x + 1, y,     Math.floor(w * 0.45));
  hLine(ctx, clothingColors.highlight, x + 1, y + 1, Math.floor(w * 0.30));

  // Upper-chest highlight — 3-row taper suggests chest form without drawing muscles
  hLine(ctx, clothingColors.highlight, x + 1, y + 2, 7);
  hLine(ctx, clothingColors.highlight, x + 1, y + 3, 4);
  hLine(ctx, clothingColors.highlight, x + 1, y + 4, 2);

  // ── Muscle hints (through-clothing rule) ─────────────────────────────────
  // Per pixel-art research (Saint11/MortMort/AdamCYounis): on a ~22-px-wide
  // chibi torso, ONE 6-7px horizontal shadow line at ~1/3 down from the
  // collarbone reads as "underside of pec catching shadow" — never split
  // into two separate pec rectangles, and never use pure black.
  // Position y+6 = upper-third of a 20-row torso = correct pec underline.
  const cx2 = Math.floor(x + w / 2);
  hLine(ctx, clothingColors.shadow, cx2 - 4, y + 6, 8);
  // Subtle highlight on the upper-left of the pec line (lit edge curving away)
  px(ctx, clothingColors.highlight, cx2 - 4, y + 5);
  // Single faint under-chest fold (smaller than before, just suggests the
  // ribcage shadow tucking under the pec — only on the lit side)
  hLine(ctx, clothingColors.shadow, x + 3, y + 9, 5);

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

function drawTorsoSouth(ctx, clothingStyle, clothingColors, x, y, w, h, skinColors) {
  // Back-compat: if a legacy "<style>_<color>" key is passed, take the prefix.
  const style = normalizeClothingStyle(clothingStyle);
  switch (style) {
    case 'coat':         drawCoatSouth(ctx, clothingColors, x, y, w, h); break;
    case 'jacket':       drawJacketSouth(ctx, clothingColors, x, y, w, h); break;
    case 'hoodie':       drawHoodieSouth(ctx, clothingColors, x, y, w, h); break;
    case 'apron':        drawApronSouth(ctx, clothingColors, x, y, w, h); break;
    case 'shirt':        drawShirtSouth(ctx, clothingColors, x, y, w, h); break;
    case 'vest':         drawVestSouth(ctx, clothingColors, x, y, w, h); break;
    case 'tunic':        drawTunicSouth(ctx, clothingColors, x, y, w, h); break;
    case 'robe':         drawRobeSouth(ctx, clothingColors, x, y, w, h); break;
    case 'tshirt':       drawTshirtSouth(ctx, clothingColors, x, y, w, h, false); break;
    case 'tshirt_vneck': drawTshirtSouth(ctx, clothingColors, x, y, w, h, true);  break;
    case 'bomber':       drawBomberSouth(ctx, clothingColors, x, y, w, h); break;
    case 'tank':         drawTankSouth(ctx, clothingColors, skinColors, x, y, w, h); break;
    default:
      fillRect(ctx, clothingColors.base, x, y, w, h);
      outlineRect(ctx, clothingColors.outline, x, y, w, h);
  }
  // Common chest / shoulder accent highlights for all clothing types
  // (skipped for tank — chest is bare skin and accents would draw onto skin)
  if (style !== 'tank') {
    drawTorsoAccentsSouth(ctx, clothingColors, x, y, w);
  }
}

// Accept either the new style key ('jacket') or a legacy compound key
// ('jacket_grey', 'tshirt_vneck_grey'). Returns the canonical style.
function normalizeClothingStyle(key) {
  if (!key || typeof key !== 'string') return 'jacket';
  const PREFIXES = ['tshirt_vneck', 'tshirt', 'jacket', 'hoodie', 'apron', 'shirt',
                    'vest', 'tunic', 'robe', 'bomber', 'coat', 'tank'];
  for (const p of PREFIXES) {
    if (key === p) return p;
    if (key.startsWith(p + '_')) return p;
  }
  return key;
}

// ---------------------------------------------------------------------------
// drawTorsoWest  –  side view torso x=20-32, y=26-43
// ---------------------------------------------------------------------------

function drawTorsoWest(ctx, clothingStyle, clothingColors, x, y, skinColors) {
  // Side profile torso — 5-zone SNES shading for jacket.
  // Silhouette taper: shoulder full width, chest slight taper at back, waist narrower.
  // Front edge (x) stays constant — stable silhouette facing the viewer.
  // For jacket: front 2px opening shows shirt/collar suggestion.
  // For coats: h extended by 13 rows to cover upper legs in side view.
  const style = normalizeClothingStyle(clothingStyle);
  const isCoat = style === 'coat';
  const isTank = style === 'tank';
  const h = isCoat ? 26 : 20;
  const SHOULDER = 3, WAIST_S = 8, WAIST_E = 16;

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

  // ── Tank top: top rows are bare skin (no fabric). Two narrow strap columns. ──
  if (isTank && skinColors) {
    const STRAP_INSET = 4;
    const NECK_OPEN_ROWS = 4;
    for (let row = 0; row < NECK_OPEN_ROWS; row++) {
      const rw = rowW(row);
      // Repaint the upper torso in skin colour.
      hLine(ctx, skinColors.base, x, y + row, rw);
      px(ctx, skinColors.highlight, x + 1, y + row);
      px(ctx, skinColors.highlight, x + 2, y + row);
      px(ctx, skinColors.shadow,    x + rw - 2, y + row);
      px(ctx, skinColors.shadow,    x + rw - 1, y + row);
      // Strap (front + back column visible in side view as a single fabric stripe)
      px(ctx, clothingColors.base,      x + STRAP_INSET, y + row);
      px(ctx, clothingColors.highlight, x + STRAP_INSET, y + row);
      px(ctx, clothingColors.outline,   x + STRAP_INSET - 1, y + row);
    }
    // Soft shadow line where fabric meets skin
    hLine(ctx, clothingColors.shadow, x + 2, y + NECK_OPEN_ROWS, rowW(NECK_OPEN_ROWS) - 4);
  }
  // ── Jacket front details (lapel/collar + shirt strip on front edge) ────────
  else if (style === 'jacket') {
    // Fixed bright cream shirt (same tone as south-view) runs as a 1-2px strip
    // on the front (x) edge of the side-profile torso so it reads clearly.
    const SHIRT_BASE = '#F0E8D0';
    for (let row = 0; row < h; row++) {
      // Shirt 2px wide from top-collar to hem; 1px only at very top & bottom
      const openW = (row === 0 || row >= h - 2) ? 1 : 2;
      hLine(ctx, SHIRT_BASE, x, y + row, openW);
      // Lapel shadow fold just inside the shirt strip
      px(ctx, clothingColors.shadow, x + openW, y + row);
    }
  } else if (style === 'bomber') {
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
  } else if (style === 'shirt' || style === 'tshirt' || style === 'tshirt_vneck' || style === 'tunic' || style === 'vest' || style === 'robe') {
    // Collar visible at front top (2px wide strip)
    const shirtCol = clothingColors.collar || clothingColors.highlight;
    for (let row = 0; row < 4; row++) {
      px(ctx, shirtCol, x, y + row);
      px(ctx, shirtCol, x + 1, y + row);
    }
  }

  // ── Outline ────────────────────────────────────────────────────────────────
  hLine(ctx, clothingColors.outline, x, y, rowW(0));         // top
  if (!isTank) hLine(ctx, clothingColors.highlight, x + 2, y, rowW(0) - 5); // shoulder highlight
  hLine(ctx, clothingColors.outline, x, y + h - 1, rowW(h - 1));  // bottom
  // Tank top: skip the front-edge fabric outline through the bare-skin rows.
  if (isTank) {
    vLine(ctx, clothingColors.outline, x, y + 4, h - 4);
  } else {
    vLine(ctx, clothingColors.outline, x, y, h);                // front edge
  }
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
  const hi = beltColors.highlight || beltColors.base;
  const sh = beltColors.shadow    || beltColors.outline;
  fillRect(ctx, beltColors.base, x, y, w, h);
  hLine(ctx, hi, x + 1, y,     w - 2);
  hLine(ctx, sh, x + 1, y + 2, w - 2);
  // Buckle sits at the front (left = character belly when walking west).
  // East is a mirror of west so the buckle automatically appears on the
  // correct front side when walking right.
  const bx = x + 1;
  fillRect(ctx, beltColors.buckle, bx, y, 4, h);
  // Buckle frame: hollow center (shows belt base), top shine
  px(ctx, beltColors.buckle, bx + 1, y + 1);  // left prong bar
  px(ctx, beltColors.base,   bx + 2, y + 1);  // hollow center
  px(ctx, hi,                bx,     y);       // top-left corner shine
  px(ctx, hi,                bx + 1, y);       // top shine
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

  // Fill knee junction gap: when lower leg shifts down (forward stride), rows between
  // the last thigh row and first shifted knee row are left empty. Fill with tapered thigh pixels.
  if (lLegDY > 0) {
    for (let g = KNEE_ROW; g < KNEE_ROW + Math.round(lLegDY); g++) {
      hLine(ctx, lBaseColor,        lx,     y + g, 6);
      px(ctx,    lHiColor,          lx + 1, y + g);
      px(ctx,    pantColors.shadow, lx + 5, y + g);
      px(ctx,    pantColors.shadow, lx,     y + g);
    }
  }
  if (rLegDY > 0) {
    for (let g = KNEE_ROW; g < KNEE_ROW + Math.round(rLegDY); g++) {
      hLine(ctx, rBaseColor,        rx,         y + g, 6);
      px(ctx,    rHiColor,          rx + 4,     y + g);
      px(ctx,    pantColors.shadow, rx + 1,     y + g);
      px(ctx,    pantColors.shadow, rx + 5,     y + g);
    }
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

  // Back shoe — muted side profile (drawn first so front is on top)
  fillRect(ctx, shoeColors.shadow, backX - 3, backY, 10, 5);
  outlineRect(ctx, shoeColors.outline, backX - 3, backY, 10, 5);

  // Front shoe: 14px wide, toe at sx (pointing left), heel at sx+13
  // Shape: toe box highlight, vamp shine strip, heel counter shadow, midsole shadow
  const sx = frontX - 7;
  fillRect(ctx, shoeColors.base, sx, frontY, 14, 4);
  // Toe box highlight — front 4px, rows 0-1 (lit from front and above)
  hLine(ctx, shoeColors.highlight, sx,     frontY,     4);
  px(ctx,    shoeColors.highlight, sx,     frontY + 1);
  px(ctx,    shoeColors.highlight, sx + 1, frontY + 1);
  // Vamp highlight strip — mid-top row
  hLine(ctx, shoeColors.highlight, sx + 5, frontY, 6);
  // Heel counter shadow — rear 2px dimmer (facing away from light)
  vLine(ctx, shoeColors.shadow, sx + 12, frontY,     3);
  vLine(ctx, shoeColors.shadow, sx + 13, frontY,     3);
  // Midsole shadow row + solid sole outline row
  hLine(ctx, shoeColors.shadow,  sx, frontY + 3, 14);
  hLine(ctx, shoeColors.outline, sx, frontY + 4, 14);
  outlineRect(ctx, shoeColors.outline, sx, frontY, 14, 5);
}

// ---------------------------------------------------------------------------
// drawArmsSouth
// ---------------------------------------------------------------------------

function drawArmsSouth(ctx, clothingColors, skinColors, lArmDY, rArmDY, lArmOut=0, rArmOut=0, torsoY=28) {
  // Organic arm shape: 7px deltoid cap → 7px bicep → 6px elbow pinch → 7px forearm → 5px wrist
  // Inner edge stays fixed to preserve arm-to-waist gap; outer edge varies for the curve.
  //
  // Shoulder smoothing techniques (per pixel-art convention from Saint11 / MortMort
  // / PixelJoint anatomy guides — see commit message for citations):
  //   • Chipped outer-top corner: row 0 cap is 6px (the outer-most pixel is dropped
  //     and replaced with an anti-aliased midtone), so the deltoid reads as rounded
  //     instead of a hard right-angle block.
  //   • Diagonal trapezius ramp: trap rows above the deltoid taper inward toward
  //     the neck rather than running flat — creates a slope from neck-base down to
  //     the inner deltoid.
  //   • Armpit interjection: at row 3 (under the deltoid cap) the arm's inner edge
  //     pushes 1px into the torso silhouette so the arm visually plugs into the
  //     body instead of sitting beside it.
  //   • Selout top-shoulder: the rim pixel at the very top of the cap uses base
  //     instead of shadow — light hits the top of the shoulder so a black outline
  //     there breaks the form.
  const lx = 18;                // left arm body outer-edge
  const shoulderRX = 43;        // right arm inner (torso-side) edge
  const baseY = torsoY - 1;     // deltoid cap protrudes 1px above torso top
  const sleeveH = 13, handH = 4;
  const maxRow = sleeveH - 1;
  const deepShadow = clothingColors.deep_shadow || clothingColors.shadow;

  // ── Shoulder pads ─────────────────────────────────────────────────────────
  // Static fill anchored to the torso, drawn BEFORE the arm. In default poses
  // the deltoid cap covers the pad, but when the arm rotates away (swing
  // apex, shoot extension) the pad stays in place and closes the gap.
  fillRect(ctx, clothingColors.base, 16, baseY,     7, 3);   // left shoulder pad
  fillRect(ctx, clothingColors.base, 43, baseY,     7, 3);   // right shoulder pad
  // Pad shading (matches arm cap shading direction)
  hLine(ctx, clothingColors.highlight, 17, baseY,     5);    // left lit upper edge
  hLine(ctx, clothingColors.shadow,    44, baseY,     5);    // right shadow edge
  px(ctx, clothingColors.shadow, 16, baseY + 2);             // outer corner shadow
  px(ctx, clothingColors.shadow, 49, baseY + 2);

  // Row zones:  0-1 cap (7px), 2-4 bicep (7px), 5-6 elbow (6px), 7-9 forearm (7px), 10-12 wrist (5px)
  const armW = (row) => {
    if (row < 2)  return 7;   // deltoid cap
    if (row < 5)  return 7;   // bicep (+1)
    if (row < 7)  return 6;   // elbow pinch (+1)
    if (row < 10) return 7;   // forearm (+1)
    return 5;                 // wrist (+1)
  };
  // Left arm outer-edge shift — bicep kept at -2 so outer edge stays flush with cap
  const lShift = (row) => {
    if (row < 5)  return -2;  // cap + bicep flush outer edge
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

  // Helper to paint one row of the LEFT arm at a given y, with all the
  // shading rules. Wrapped so we can call it multiple times (gap-filling)
  // without duplicating logic.
  const paintLeftRow = (row, ry) => {
    const rX = lRowX(row);
    const aw = armW(row);
    if (row === 0) {
      // Chipped outer-top corner: skip the outermost pixel, fill the rest.
      hLine(ctx, clothingColors.base, rX + 1, ry, aw - 1);
      px(ctx, clothingColors.highlight, rX + 1, ry);
      hLine(ctx, clothingColors.highlight, rX + 2, ry, aw - 3);
      px(ctx, clothingColors.shadow, rX + aw - 1, ry);
    } else {
      hLine(ctx, clothingColors.base, rX, ry, aw);
      px(ctx, clothingColors.shadow,    rX,     ry);
      px(ctx, clothingColors.highlight, rX + 1, ry);
      if (row < 8) px(ctx, clothingColors.highlight, rX + 2, ry);
      if (row >= 2 && row < 10) px(ctx, clothingColors.shadow, rX + aw - 2, ry);
      px(ctx, clothingColors.shadow, rX + aw - 1, ry);
    }
  };

  // ── Left arm (lit side — deltoid cap + cylinder + forearm flare) ─────────
  // Gap fill: when arm swings, Math.round on adjacent rows can land on
  // non-consecutive y values, leaving a 1px see-through hole. We track
  // the previous y and repaint the current row's content at any skipped
  // y so the arm stays a continuous strip.
  let prevLY = -1;
  for (let row = 0; row < sleeveH; row++) {
    const ry = lRowY(row);
    if (prevLY !== -1) {
      for (let fillY = prevLY + 1; fillY < ry; fillY++) paintLeftRow(row, fillY);
    }
    paintLeftRow(row, ry);
    prevLY = ry;
  }
  hLine(ctx, clothingColors.shadow, lRowX(maxRow), lRowY(maxRow), armW(maxRow));

  // Anti-aliased corner pixel: replaces the chipped outer-top with a softer tone
  // so the rounded deltoid doesn't read as a stair-step.
  px(ctx, clothingColors.shadow, lRowX(0), lRowY(0));         // chipped corner = darker rim
  // Subtle highlight 1px diagonally inward from the chip (catches the light)
  px(ctx, clothingColors.highlight, lRowX(0) + 1, lRowY(1));

  // Armhole socket shadow — darker pixels at the top of the arm where it meets the torso.
  // Creates the "arm plugs into shoulder" depth crease.
  px(ctx, deepShadow, lRowX(0) + armW(0) - 1, baseY);       // top-inner corner
  px(ctx, deepShadow, lRowX(1) + armW(1) - 1, baseY + 1);   // 2nd row socket
  // Armpit interjection — push 1px of arm-shadow INTO the torso silhouette at
  // row 3. Breaks the vertical seam so the arm visually plugs into the body
  // rather than sitting beside it.
  px(ctx, deepShadow, lRowX(3) + armW(3), lRowY(3));
  // Cap=bicep (7→7): no outer step
  // Bicep→elbow step AA (7→6 px)
  px(ctx, clothingColors.shadow, lRowX(2), baseY + 5);
  // Elbow→forearm step AA (6→7 px, outer flare)
  px(ctx, clothingColors.shadow, lRowX(7), baseY + 6);
  // Forearm→wrist step AA (7→5 px)
  px(ctx, clothingColors.shadow, lRowX(9), baseY + 10);

  // Left hand / fist (5px wide with knuckle highlights)
  const lhw = 5;
  const lhx = lArmX;
  fillRect(ctx, skinColors.base,    lhx,     lArmY + sleeveH, lhw, handH);
  px(ctx,    skinColors.highlight,  lhx + 1, lArmY + sleeveH);
  px(ctx,    skinColors.highlight,  lhx + 2, lArmY + sleeveH);
  hLine(ctx, skinColors.shadow,     lhx,     lArmY + sleeveH + handH - 1, lhw);
  outlineRect(ctx, skinColors.outline, lhx,  lArmY + sleeveH, lhw, handH);

  // ── Right arm (shadow side — deltoid cap + muted cylinder + forearm flare) ──
  const paintRightRow = (row, ry) => {
    const rx = rRowX(row);
    const aw = armW(row);
    if (row === 0) {
      // Chipped outer-top corner on the right (rightmost pixel dropped)
      hLine(ctx, clothingColors.base, rx, ry, aw - 1);
      px(ctx, clothingColors.shadow, rx,     ry);
      px(ctx, clothingColors.shadow, rx + 1, ry);
      hLine(ctx, clothingColors.shadow, rx + 1, ry, aw - 3);
    } else {
      hLine(ctx, clothingColors.base, rx, ry, aw);
      px(ctx, clothingColors.shadow,   rx,         ry);
      px(ctx, clothingColors.shadow,   rx + 1,     ry);
      if (row >= 2 && row < 10) px(ctx, clothingColors.shadow, rx + aw - 2, ry);
      px(ctx, clothingColors.shadow,   rx + aw - 1, ry);
    }
  };
  let prevRY = -1;
  for (let row = 0; row < sleeveH; row++) {
    const ry = rRowY(row);
    if (prevRY !== -1) {
      for (let fillY = prevRY + 1; fillY < ry; fillY++) paintRightRow(row, fillY);
    }
    paintRightRow(row, ry);
    prevRY = ry;
  }
  hLine(ctx, clothingColors.shadow, rRowX(maxRow), rRowY(maxRow), armW(maxRow));

  // Anti-aliased outer-top corner pixel (chip)
  px(ctx, clothingColors.shadow, rRowX(0) + armW(0) - 1, rRowY(0));   // dark rim at chipped pos

  // Armhole socket shadow (right)
  px(ctx, deepShadow, rRowX(0), baseY);        // top-inner corner
  px(ctx, deepShadow, rRowX(1), baseY + 1);    // 2nd row socket
  // Armpit interjection (right) — push 1px into torso at row 3
  px(ctx, deepShadow, rRowX(3) - 1, rRowY(3));
  // Step AA on right (cap=bicep no step; outer edge = rRowX + armW-1)
  // Bicep→elbow step (7→6 px, outer shifts in by 1)
  px(ctx, clothingColors.shadow, rRowX(2) + 6, baseY + 5);
  // Elbow→forearm step (6→7 px, outer flare)
  px(ctx, clothingColors.shadow, rRowX(7) + 5, baseY + 6);
  // Forearm→wrist step (7→5 px)
  px(ctx, clothingColors.shadow, rRowX(9) + 6, baseY + 10);

  // Right hand / fist (5px wide)
  const rhw = 5;
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

  // Trapezius diagonal ramp — tapered slope from neck-base down to inner deltoid.
  // Instead of flat rectangles, the ramp narrows as it rises so the shoulder
  // line reads as a curve rather than a horizontal plank.
  // For each pixel above baseY we shrink the ramp width by 1 from the OUTER side
  // (away from the neck), keeping the inner edge anchored at the neck.
  if (lBridgeW > 1) {
    // Row -1 (one above bridge): drop the outermost pixel — trap curves inward
    hLine(ctx, clothingColors.base,      lBridgeX + 1, baseY - 1, lBridgeW - 1);
    px(ctx,    clothingColors.highlight, lBridgeX + 2, baseY - 1);
    px(ctx,    clothingColors.shadow,    lBridgeX + 1, baseY - 1);  // inner-edge shadow toward neck
    // Row -2 (two above bridge): only inner half — narrow trap peak
    hLine(ctx, clothingColors.base,      lBridgeX + 2, baseY - 2, Math.max(1, lBridgeW - 3));
    px(ctx,    clothingColors.shadow,    lBridgeX + 2, baseY - 2);
  }
  if (rBridgeW > 1) {
    // Mirror: outer side is the right (away from neck = larger X)
    hLine(ctx, clothingColors.shadow, rBridgeX, baseY - 1, rBridgeW - 1);
    hLine(ctx, clothingColors.shadow, rBridgeX, baseY - 2, Math.max(1, rBridgeW - 3));
    // Subtle highlight at the outer edge of the trap (rim light catches the curve)
    px(ctx, clothingColors.base, rBridgeX + rBridgeW - 2, baseY - 1);
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
    if (row < 5) return 7;   // bicep (+1)
    if (row < 8) return 6;   // elbow (+1)
    return 5;                // forearm/wrist (+1)
  };
  // Shoulder pad — anchored to torso, fills the gap when arm rotates away.
  // Chipped outer-top corner so the pad reads as a rounded shoulder.
  fillRect(ctx, clothingColors.shadow, shoulderX, backY + 1, 7, 2);
  hLine(ctx, clothingColors.shadow, shoulderX, backY, 6);  // chip outer corner
  const rowX = (row) => shoulderX + Math.round(backArmDX * row / maxRow);
  const wristX = rowX(maxRow);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    const aw = armW(row);
    if (row === 0) {
      // Chipped outer (back-facing) corner — drop the rightmost pixel
      hLine(ctx, clothingColors.shadow, rx, backY + row, aw - 1);
      px(ctx, clothingColors.base, rx + 1, backY + row);
      if (aw > 4) px(ctx, clothingColors.base, rx + 2, backY + row);
      px(ctx, clothingColors.outline, rx, backY + row);
    } else {
      hLine(ctx, clothingColors.shadow, rx, backY + row, aw);  // muted (behind body)
      px(ctx, clothingColors.base, rx + 1, backY + row);        // centre lit strip
      if (aw > 4) px(ctx, clothingColors.base, rx + 2, backY + row);
      px(ctx, clothingColors.outline, rx,          backY + row);
      px(ctx, clothingColors.outline, rx + aw - 1, backY + row);
    }
  }
  // Top outline: skip the chipped corner pixel — broken outline (selout) so
  // the lit top of the shoulder doesn't read as a hard horizontal line.
  hLine(ctx, clothingColors.outline, rowX(0), backY, armW(0) - 1);
  hLine(ctx, clothingColors.outline, rowX(maxRow), backY + maxRow, armW(maxRow));
  fillRect(ctx, skinColors.shadow, wristX, backY + sleeveH, 4, handH);
  outlineRect(ctx, skinColors.outline, wristX, backY + sleeveH, 4, handH);
}

function drawFrontArmWest(ctx, clothingColors, skinColors, frontArmDX, torsoX, torsoY) {
  const sleeveH = 13, handH = 4;
  const frontY    = torsoY - 1;  // deltoid cap 1px above torso top
  const shoulderX = torsoX - 1;
  const maxRow    = sleeveH - 1;
  const armW = (row) => {
    if (row < 2) return 7;   // deltoid cap
    if (row < 5) return 7;   // bicep (+1)
    if (row < 8) return 6;   // elbow (+1)
    return 5;                // forearm/wrist (+1)
  };
  // Shoulder pad — anchored to torso, fills the gap during extreme arm motion.
  // Chipped outer-top corner (forward-facing side) so the deltoid silhouette
  // rounds inward instead of presenting a 90° block.
  fillRect(ctx, clothingColors.base,      shoulderX, frontY + 1, 7, 2);
  hLine(ctx, clothingColors.base,         shoulderX + 1, frontY, 6);   // chip outer corner
  hLine(ctx, clothingColors.highlight,    shoulderX + 1, frontY + 1, 5);
  px(ctx, clothingColors.shadow,          shoulderX,     frontY + 2);
  px(ctx, clothingColors.shadow,          shoulderX + 6, frontY + 2);
  const rowX = (row) => shoulderX + Math.round(frontArmDX * row / maxRow);
  const wristX = rowX(maxRow);

  for (let row = 0; row < sleeveH; row++) {
    const rx = rowX(row);
    const aw = armW(row);
    if (row === 0) {
      // Chipped outer-top corner (forward-facing): drop the leftmost pixel.
      hLine(ctx, clothingColors.base, rx + 1, frontY + row, aw - 1);
      px(ctx, clothingColors.highlight, rx + 1,      frontY + row);
      px(ctx, clothingColors.shadow,    rx + aw - 2, frontY + row);
      px(ctx, clothingColors.shadow,    rx + aw - 1, frontY + row);
    } else {
      hLine(ctx, clothingColors.base,   rx, frontY + row, aw);
      px(ctx, clothingColors.highlight, rx + 1,      frontY + row);
      px(ctx, clothingColors.shadow,    rx + aw - 2, frontY + row);
      px(ctx, clothingColors.shadow,    rx + aw - 1, frontY + row);
    }
  }
  // Soft (selout) top outline — skip the chipped corner pixel.
  hLine(ctx, clothingColors.outline, rowX(0) + 1,  frontY,          armW(0) - 1);
  hLine(ctx, clothingColors.outline, rowX(maxRow), frontY + maxRow, armW(maxRow));

  fillRect(ctx, skinColors.base,    wristX,     frontY + sleeveH, 5, handH);
  px(ctx,    skinColors.highlight,  wristX + 1, frontY + sleeveH);
  px(ctx,    skinColors.highlight,  wristX + 2, frontY + sleeveH);
  hLine(ctx, skinColors.shadow,     wristX,     frontY + sleeveH + handH - 1, 5);
  outlineRect(ctx, skinColors.outline, wristX,  frontY + sleeveH, 5, handH);
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
function drawTorso(ctx, clothingKey, clothingColors, x, y, w, h, skinColors) {
  drawTorsoSouth(ctx, clothingKey, clothingColors, x, y, w, h, skinColors);
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
  drawTankSouth,
  drawTankStrapsOverlaySouth,
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
