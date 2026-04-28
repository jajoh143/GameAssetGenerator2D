'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, mirrorCanvasH, clear } = require('../core/Canvas');
const Colors = require('../core/Colors');
const { resolveConfig } = require('./CharacterConfig');
const {
  drawSouth: humanSouth,
  drawNorth: humanNorth,
  drawWest:  humanWest,
  resolveColors: humanColors,
  getYAnchors,
} = require('./HumanCharacter');

const FRAME_W = 96;
const FRAME_H = 96;

function resolveColors(config) {
  const base = humanColors(config);
  base.scale = Colors.LIZARD_SKIN[config.lizardScale] || Colors.LIZARD_SKIN.emerald;
  base.lizardHorn = Colors.LIZARD_HORN;
  return base;
}

// ─── Reptilian head (south/front view) ──────────────────────────────────────
// Replaces the human face with a draconic/lizard one. Layout:
//   • Same overall silhouette as the human head so the neck attaches cleanly.
//   • Scaled hide texture: subtle highlight dots on the lit upper-left.
//   • A SNOUT protrudes 5 px below the lower jaw (front view foreshortened),
//     with two nostril dots and a row of small fangs.
//   • SLIT-PUPIL eyes — solid iris colour with a thin vertical pupil line.
//   • Cheek FRILLS poking 2 px out from each side of the jaw.
//   • Crest of small horn-spikes running across the top of the skull.
//   • Lighter "belly" scales fill the lower jaw / under-snout area.
function drawLizardHeadSouth(ctx, scaleColors, hornColors, eyeColors, headBobY) {
  const HX = 16, HY = 21;
  const cx = 32;
  const yShift = headBobY;
  const ol  = scaleColors.outline;
  const sh  = scaleColors.shadow;
  const ds  = scaleColors.deep_shadow || scaleColors.outline;
  const hi  = scaleColors.highlight;
  const ba  = scaleColors.base;
  const bel = scaleColors.belly || hi;

  // Same chibi head silhouette as the human head function.
  const HEAD = [
    [12,  8],[10, 12],[ 8, 16],[ 6, 20],[ 4, 24],[ 3, 26],[ 2, 28],
    [ 1, 30],[ 1, 30],[ 1, 30],[ 1, 30],[ 1, 30],[ 1, 30],[ 1, 30],
    [ 1, 30],[ 1, 30],[ 1, 30],[ 2, 28],[ 2, 28],[ 2, 28],[ 2, 28],
    [ 2, 28],[ 2, 28],[ 2, 28],[ 2, 28],[ 3, 26],[ 4, 24],[ 5, 22],
    [ 7, 18],[ 9, 14],
  ];

  // ── 1. Fill the head silhouette with scale base colour ─────────────────
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, ba, HX + off, HY + r + yShift, w);
  }

  // ── 2. Cheek frills — 2 px protrusions on each side at jaw level ────────
  // Jaw is at HEAD rows 25-26 (y=46..47). Frill juts outward.
  const jawY = HY + 25 + yShift;
  // Left frill
  pixel(ctx, ba, HX + 2, jawY);
  pixel(ctx, ba, HX + 1, jawY);
  pixel(ctx, ba, HX + 2, jawY + 1);
  pixel(ctx, sh, HX + 2, jawY + 1);
  pixel(ctx, ol, HX + 0, jawY);
  pixel(ctx, ol, HX + 1, jawY - 1);
  pixel(ctx, ol, HX + 1, jawY + 1);
  // Right frill
  pixel(ctx, ba, HX + 28, jawY);
  pixel(ctx, ba, HX + 29, jawY);
  pixel(ctx, ba, HX + 28, jawY + 1);
  pixel(ctx, sh, HX + 28, jawY + 1);
  pixel(ctx, ol, HX + 30, jawY);
  pixel(ctx, ol, HX + 29, jawY - 1);
  pixel(ctx, ol, HX + 29, jawY + 1);

  // ── 3. Top-of-skull crest — 4 small spikes across the crown ─────────────
  const crestY = HY + 0 + yShift;
  const crestSpikes = [16, 20, 24, 28];   // x positions of 4 small spikes
  for (const sx of crestSpikes) {
    // 1 px tall horn-spike rising 1 px above the head silhouette
    pixel(ctx, hornColors.base,      sx, crestY - 1);
    pixel(ctx, hornColors.highlight, sx, crestY - 1);
    pixel(ctx, hornColors.outline,   sx, crestY - 2);
  }
  // Centre crest scales: small ridge of darker pixels along the top
  hLine(ctx, sh, HX + 13, HY + 1 + yShift, 6);

  // ── 4. Scale highlights / shadows on the dome ───────────────────────────
  // Lit upper-left band
  hLine(ctx, hi, HX + 12, HY + 0 + yShift, 6);
  hLine(ctx, hi, HX + 10, HY + 1 + yShift, 4);
  hLine(ctx, hi, HX + 8,  HY + 2 + yShift, 4);
  hLine(ctx, hi, HX + 5,  HY + 3 + yShift, 4);
  // Scale "scatter" — small dots simulating overlapping scales
  for (let r = 4; r < 12; r += 2) {
    pixel(ctx, hi, HX + 5,  HY + r + yShift);
    pixel(ctx, hi, HX + 9,  HY + r + yShift);
    pixel(ctx, sh, HX + 22, HY + r + yShift);
    pixel(ctx, sh, HX + 26, HY + r + yShift);
  }
  // Right-side shadow band
  for (let r = 1; r < 12; r++) {
    const [off, w] = HEAD[r];
    pixel(ctx, sh, HX + off + w - 2, HY + r + yShift);
  }

  // ── 5. Brow ridge — heavier than human ──────────────────────────────────
  hLine(ctx, ds, HX + 5,  HY + 14 + yShift, 7);
  hLine(ctx, ds, HX + 20, HY + 14 + yShift, 7);

  // ── 6. Slit-pupil eyes ──────────────────────────────────────────────────
  // Eye position similar to human (HY+19 = y=40). Solid iris colour with a
  // thin black vertical pupil slit through the centre.
  const eye = (eyeColors && eyeColors.iris) ? eyeColors.iris : '#E8C040';
  const eyeY = HY + 19 + yShift;
  // Left eye — 4 wide, 2 tall (x=22..25)
  hLine(ctx, eye, 22, eyeY,     4);
  hLine(ctx, eye, 22, eyeY + 1, 4);
  // Slit pupil — thin vertical line at x=23 (slightly inset)
  pixel(ctx, '#000000', 23, eyeY);
  pixel(ctx, '#000000', 23, eyeY + 1);
  // Highlight in eye (catchlight)
  pixel(ctx, '#FFFFFF', 22, eyeY);
  // Eye outline
  pixel(ctx, ol, 21, eyeY);
  pixel(ctx, ol, 21, eyeY + 1);
  pixel(ctx, ol, 26, eyeY);
  pixel(ctx, ol, 26, eyeY + 1);
  pixel(ctx, ol, 22, eyeY - 1);
  pixel(ctx, ol, 23, eyeY - 1);
  pixel(ctx, ol, 24, eyeY - 1);
  pixel(ctx, ol, 25, eyeY - 1);
  pixel(ctx, ol, 22, eyeY + 2);
  pixel(ctx, ol, 23, eyeY + 2);
  pixel(ctx, ol, 24, eyeY + 2);
  pixel(ctx, ol, 25, eyeY + 2);

  // Right eye — 4 wide, 2 tall (x=38..41)
  hLine(ctx, eye, 38, eyeY,     4);
  hLine(ctx, eye, 38, eyeY + 1, 4);
  pixel(ctx, '#000000', 40, eyeY);
  pixel(ctx, '#000000', 40, eyeY + 1);
  pixel(ctx, '#FFFFFF', 38, eyeY);
  pixel(ctx, ol, 37, eyeY);
  pixel(ctx, ol, 37, eyeY + 1);
  pixel(ctx, ol, 42, eyeY);
  pixel(ctx, ol, 42, eyeY + 1);
  pixel(ctx, ol, 38, eyeY - 1);
  pixel(ctx, ol, 39, eyeY - 1);
  pixel(ctx, ol, 40, eyeY - 1);
  pixel(ctx, ol, 41, eyeY - 1);
  pixel(ctx, ol, 38, eyeY + 2);
  pixel(ctx, ol, 39, eyeY + 2);
  pixel(ctx, ol, 40, eyeY + 2);
  pixel(ctx, ol, 41, eyeY + 2);

  // ── 7. Snout — protrudes 5 rows below the lower jaw ─────────────────────
  // Snout occupies x=27..36 (10 wide), 5 rows below the face area.
  const sx0 = 27, sw = 10, snoutY = HY + 26 + yShift;
  // Top of snout — wider, then taper
  fillRect(ctx, ba, sx0, snoutY,     sw, 1);
  fillRect(ctx, ba, sx0, snoutY + 1, sw, 1);
  fillRect(ctx, ba, sx0 + 1, snoutY + 2, sw - 2, 1);
  fillRect(ctx, ba, sx0 + 1, snoutY + 3, sw - 2, 1);
  fillRect(ctx, ba, sx0 + 2, snoutY + 4, sw - 4, 1);
  // Belly/underjaw lighter on bottom row
  hLine(ctx, bel, sx0 + 2, snoutY + 4, sw - 4);
  // Lit upper edge of snout
  hLine(ctx, hi, sx0 + 1, snoutY,     sw - 4);
  // Right-side shadow on snout
  pixel(ctx, sh, sx0 + sw - 1, snoutY);
  pixel(ctx, sh, sx0 + sw - 1, snoutY + 1);
  pixel(ctx, sh, sx0 + sw - 2, snoutY + 2);
  pixel(ctx, sh, sx0 + sw - 2, snoutY + 3);
  // Nostrils — two dark dots at the top of the snout
  pixel(ctx, ol, sx0 + 2, snoutY);
  pixel(ctx, ol, sx0 + 6, snoutY);
  // Snout outline (silhouette)
  pixel(ctx, ol, sx0 - 1, snoutY);
  pixel(ctx, ol, sx0 - 1, snoutY + 1);
  pixel(ctx, ol, sx0,     snoutY + 2);
  pixel(ctx, ol, sx0 + 1, snoutY + 3);
  pixel(ctx, ol, sx0 + 2, snoutY + 4);
  hLine(ctx, ol, sx0 + 2, snoutY + 5, sw - 4);
  pixel(ctx, ol, sx0 + sw - 2, snoutY + 4);
  pixel(ctx, ol, sx0 + sw - 1, snoutY + 3);
  pixel(ctx, ol, sx0 + sw,     snoutY + 2);
  pixel(ctx, ol, sx0 + sw,     snoutY + 1);
  pixel(ctx, ol, sx0 + sw,     snoutY);

  // ── 8. Mouth line + visible fangs across the snout ──────────────────────
  const mouthY = snoutY + 2;
  hLine(ctx, ol, sx0 + 1, mouthY, sw - 2);
  // Upper fangs — 2 small ivory fangs hanging from the upper lip
  pixel(ctx, '#FFFFCC', sx0 + 2, mouthY + 1);
  pixel(ctx, '#FFFFCC', sx0 + sw - 3, mouthY + 1);
  pixel(ctx, '#E8D89C', sx0 + 2, mouthY + 2);
  pixel(ctx, '#E8D89C', sx0 + sw - 3, mouthY + 2);

  // ── 9. Head silhouette outline ─────────────────────────────────────────
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    pixel(ctx, ol, HX + off,         HY + r + yShift);
    pixel(ctx, ol, HX + off + w - 1, HY + r + yShift);
  }
  hLine(ctx, ol, HX + 12, HY + 0 + yShift, 8);   // crown top
}

// ─── Reptilian head (west / side view) ──────────────────────────────────────
// Side profile shows the snout extending forward (left, since the character
// faces west). Built parametrically over the standard human head outline so
// the neck attachment is unchanged.
function drawLizardHeadWest(ctx, scaleColors, hornColors, eyeColors) {
  const HX = 13, HY = 24;
  const ol  = scaleColors.outline;
  const sh  = scaleColors.shadow;
  const hi  = scaleColors.highlight;
  const ba  = scaleColors.base;
  const bel = scaleColors.belly || hi;

  // Profile silhouette base — head + protruding snout going LEFT.
  // We fill an approximate skull outline:
  for (let r = 0; r < 26; r++) {
    let x0 = HX + 4 - Math.max(0, 4 - Math.abs(r - 8));
    let w = 14;
    if (r < 4) { x0 = HX + 4 + (4 - r); w = 14 - 2 * (4 - r); }
    if (r >= 22) { x0 = HX + 5; w = 12 - (r - 22) * 2; }
    if (w > 0) hLine(ctx, ba, x0, HY + r, w);
  }

  // Snout — protrudes LEFT from the face at jaw level
  const snoutY = HY + 14;
  for (let i = 0; i < 7; i++) {
    const w = 4 - Math.floor(i / 2);
    if (w > 0) hLine(ctx, ba, HX - 5 + i, snoutY + Math.floor(i / 2), w);
  }
  // Underjaw lighter
  hLine(ctx, bel, HX - 4, snoutY + 4, 5);
  // Fang at the front of the snout
  pixel(ctx, '#FFFFCC', HX - 4, snoutY + 4);
  pixel(ctx, '#E8D89C', HX - 4, snoutY + 5);

  // Top-of-skull highlights
  hLine(ctx, hi, HX + 4, HY,     6);
  hLine(ctx, hi, HX + 4, HY + 1, 8);
  // Right-side (back of skull) shadow
  for (let r = 4; r < 18; r++) {
    pixel(ctx, sh, HX + 14, HY + r);
  }

  // Crest spikes along the top
  for (let i = 0; i < 4; i++) {
    const sx = HX + 5 + i * 2;
    pixel(ctx, hornColors.base,    sx, HY - 1);
    pixel(ctx, hornColors.outline, sx, HY - 2);
  }

  // Slit-pupil eye (single, profile)
  const eye = (eyeColors && eyeColors.iris) ? eyeColors.iris : '#E8C040';
  pixel(ctx, eye, HX + 2, HY + 9);
  pixel(ctx, eye, HX + 3, HY + 9);
  pixel(ctx, '#000000', HX + 2, HY + 9);
  pixel(ctx, ol, HX + 1, HY + 9);
  pixel(ctx, ol, HX + 4, HY + 9);
  pixel(ctx, ol, HX + 2, HY + 8);
  pixel(ctx, ol, HX + 3, HY + 8);
  pixel(ctx, ol, HX + 2, HY + 10);
  pixel(ctx, ol, HX + 3, HY + 10);

  // Mouth line on the snout
  hLine(ctx, ol, HX - 5, snoutY + 2, 6);

  // Outline the head silhouette (rough)
  // top
  hLine(ctx, ol, HX + 5, HY,      8);
  vLine(ctx, ol, HX + 4, HY + 1,  3);
  vLine(ctx, ol, HX + 3, HY + 4,  2);
  vLine(ctx, ol, HX + 2, HY + 6,  3);
  vLine(ctx, ol, HX + 1, HY + 9,  2);
  // back-of-head right edge
  vLine(ctx, ol, HX + 14, HY + 1, 21);
  // jaw bottom
  hLine(ctx, ol, HX + 5, HY + 22, 9);
  // snout edges
  hLine(ctx, ol, HX - 5, snoutY,     7);
  hLine(ctx, ol, HX - 4, snoutY + 5, 6);
}

// ─── Frame generator ────────────────────────────────────────────────────────
function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  // Tell the human renderer to skip the head — we draw a reptilian head
  // ourselves after humanSouth runs.
  const off = Object.assign({}, frameOffset, { skipHead: true });
  const by  = Math.round((off.bodyY || 0) * 1.5);
  const headBob = Math.round((off.headBob || 0) * 1.5);

  let direction = 'south';
  if (animationName.includes('north')) direction = 'north';
  else if (animationName.includes('west')) direction = 'west';
  else if (animationName.includes('east')) direction = 'east';

  if (direction === 'east') {
    const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
    clear(tmpCtx, FRAME_W, FRAME_H);
    renderDirection(tmpCtx, config, colors, off, 'west', by, headBob);
    const mirrored = mirrorCanvasH(tmpC);
    ctx.drawImage(mirrored, 0, 0);
    return canvas;
  }

  renderDirection(ctx, config, colors, off, direction, by, headBob);
  return canvas;
}

function renderDirection(ctx, config, colors, off, direction, by, headBob) {
  // 1. Human body without its head (skipHead flag set on offsets)
  if (direction === 'south')      humanSouth(ctx, config, off);
  else if (direction === 'north') humanNorth(ctx, config, off);
  else                            humanWest(ctx, config, off);

  // 2. Reptilian head — translated to align with the (height-shifted) neck.
  const yA         = getYAnchors(config);
  const headDeltaY = yA.neckY - 50;
  const ovBy       = by + headBob + headDeltaY;

  if (direction === 'south' || direction === 'north') {
    drawLizardHeadSouth(ctx, colors.scale, colors.lizardHorn, colors.eyes, ovBy);
  } else if (direction === 'west') {
    ctx.save();
    ctx.translate(0, ovBy);
    drawLizardHeadWest(ctx, colors.scale, colors.lizardHorn, colors.eyes);
    ctx.restore();
  }
}

module.exports = { generateFrame };
