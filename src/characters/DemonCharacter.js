'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const { DEMON_SKIN, DEMON_PARTS, HAIR_COLORS, CLOTHING, PANTS, SHOES, BELT } = require('../core/Colors');
const { drawGroundShadow, drawShoe, drawLeg, drawBelt, drawTorso, drawArm, drawNeck } = require('./BaseCharacter');
const { drawSouth: humanSouth, drawNorth: humanNorth, drawWest: humanWest, drawEast: humanEast, resolveColors: humanColors } = require('./HumanCharacter');
const { resolveConfig } = require('./CharacterConfig');

// Draw a dark aura around the character — 1-pixel deep_shadow halo at key silhouette points
function drawDarkAura(ctx, by) {
  const auraColor = 'rgba(40,0,60,0.55)';
  // Silhouette outer ring: encircles head + body + extremity tips
  // Head halo (rows 3-26, x=20-43)
  hLine(ctx, auraColor, 21, 3 + by, 22);           // top of head
  for (let y = 4; y <= 26; y++) {
    pixel(ctx, auraColor, 20, y + by);
    pixel(ctx, auraColor, 43, y + by);
  }
  // Horn gaps: skip horn rows to avoid covering detail
  // Body sides (rows 27-52)
  for (let y = 27; y <= 52; y++) {
    pixel(ctx, auraColor, 19, y + by);
    pixel(ctx, auraColor, 44, y + by);
  }
  // Foot halo
  hLine(ctx, auraColor, 20, 63 + by, 12);
  hLine(ctx, auraColor, 32, 63 + by, 12);
}

// Draw claw tips at the end of each arm hand area
function drawClaws(ctx, skinColors, armLY, armRY) {
  const claw = DEMON_PARTS.claw;
  // Left hand claws — three small downward-pointing spikes (each 1×2)
  const lhx = 20, lhy = armLY;
  pixel(ctx, claw.base,    lhx,     lhy + 3);
  pixel(ctx, claw.shadow,  lhx,     lhy + 4);
  pixel(ctx, claw.base,    lhx + 2, lhy + 3);
  pixel(ctx, claw.shadow,  lhx + 2, lhy + 4);
  pixel(ctx, claw.base,    lhx + 4, lhy + 3);
  pixel(ctx, claw.shadow,  lhx + 4, lhy + 4);
  pixel(ctx, claw.highlight, lhx + 1, lhy + 3);

  // Right hand claws — mirror about x=32
  const rhx = 39, rhy = armRY;
  pixel(ctx, claw.base,    rhx,     rhy + 3);
  pixel(ctx, claw.shadow,  rhx,     rhy + 4);
  pixel(ctx, claw.base,    rhx + 2, rhy + 3);
  pixel(ctx, claw.shadow,  rhx + 2, rhy + 4);
  pixel(ctx, claw.base,    rhx + 4, rhy + 3);
  pixel(ctx, claw.shadow,  rhx + 4, rhy + 4);
  pixel(ctx, claw.highlight, rhx + 3, rhy + 3);
}

const FRAME_W = 64;
const FRAME_H = 64;

function resolveColors(config) {
  const base = humanColors(config);
  base.skin = DEMON_SKIN[config.demonSkin] || DEMON_SKIN.crimson;
  base.horn = DEMON_PARTS.horn;
  base.tail = DEMON_PARTS.tail;
  base.claw = DEMON_PARTS.claw;
  return base;
}

// Draw curved horns above the head (south view)
function drawHornsSouth(ctx, colors, hornStyle, headY) {
  const hy = headY - 4; // just above head
  const { base: hb, highlight: hh, shadow: hs, outline: ho } = colors.horn;

  if (hornStyle === 'curved') {
    // Left curved horn: body at x=24-27, tip curves up+left to x=22-24
    fillRect(ctx, hb, 24, hy,     4, 5); // body
    fillRect(ctx, hb, 22, hy - 3, 3, 4); // curved tip
    // Shading: highlight on upper-left, shadow on lower-right
    fillRect(ctx, hh, 24, hy,     2, 3); // body highlight
    pixel(ctx, hh,   22, hy - 3);        // tip highlight
    pixel(ctx, hs,   27, hy + 3);        // body shadow
    pixel(ctx, hs,   27, hy + 4);
    pixel(ctx, hs,   24, hy - 1);        // inner curve shadow
    // Outline following the L-shaped silhouette (no outlineRect)
    // Tip top:
    pixel(ctx, ho, 21, hy - 4); pixel(ctx, ho, 22, hy - 4); pixel(ctx, ho, 23, hy - 4); pixel(ctx, ho, 24, hy - 4);
    // Tip left side:
    pixel(ctx, ho, 21, hy - 3); pixel(ctx, ho, 21, hy - 2); pixel(ctx, ho, 21, hy - 1); pixel(ctx, ho, 21, hy);
    // Tip-to-body step (inner notch):
    pixel(ctx, ho, 22, hy); pixel(ctx, ho, 23, hy);
    // Body left side:
    pixel(ctx, ho, 23, hy + 1); pixel(ctx, ho, 23, hy + 2); pixel(ctx, ho, 23, hy + 3); pixel(ctx, ho, 23, hy + 4);
    // Body bottom:
    pixel(ctx, ho, 24, hy + 5); pixel(ctx, ho, 25, hy + 5); pixel(ctx, ho, 26, hy + 5); pixel(ctx, ho, 27, hy + 5);
    // Body right side:
    pixel(ctx, ho, 28, hy + 4); pixel(ctx, ho, 28, hy + 3); pixel(ctx, ho, 28, hy + 2); pixel(ctx, ho, 28, hy + 1); pixel(ctx, ho, 28, hy);
    // Outer corner body-to-tip:
    pixel(ctx, ho, 27, hy - 1); pixel(ctx, ho, 26, hy - 1); pixel(ctx, ho, 25, hy - 1);
    // Tip right side:
    pixel(ctx, ho, 25, hy - 2); pixel(ctx, ho, 25, hy - 3);

    // Right curved horn (mirror about x=32):
    fillRect(ctx, hb, 36, hy,     4, 5);
    fillRect(ctx, hb, 39, hy - 3, 3, 4);
    fillRect(ctx, hh, 38, hy,     2, 3);
    pixel(ctx, hh,   42, hy - 3);
    pixel(ctx, hs,   36, hy + 3); pixel(ctx, hs, 36, hy + 4);
    pixel(ctx, hs,   39, hy - 1);
    // Outline:
    pixel(ctx, ho, 39, hy - 4); pixel(ctx, ho, 40, hy - 4); pixel(ctx, ho, 41, hy - 4); pixel(ctx, ho, 42, hy - 4);
    pixel(ctx, ho, 43, hy - 3); pixel(ctx, ho, 43, hy - 2); pixel(ctx, ho, 43, hy - 1); pixel(ctx, ho, 43, hy);
    pixel(ctx, ho, 41, hy); pixel(ctx, ho, 40, hy);
    pixel(ctx, ho, 40, hy + 1); pixel(ctx, ho, 40, hy + 2); pixel(ctx, ho, 40, hy + 3); pixel(ctx, ho, 40, hy + 4);
    pixel(ctx, ho, 39, hy + 5); pixel(ctx, ho, 38, hy + 5); pixel(ctx, ho, 37, hy + 5); pixel(ctx, ho, 36, hy + 5);
    pixel(ctx, ho, 35, hy + 4); pixel(ctx, ho, 35, hy + 3); pixel(ctx, ho, 35, hy + 2); pixel(ctx, ho, 35, hy + 1); pixel(ctx, ho, 35, hy);
    pixel(ctx, ho, 36, hy - 1); pixel(ctx, ho, 37, hy - 1); pixel(ctx, ho, 38, hy - 1);
    pixel(ctx, ho, 38, hy - 2); pixel(ctx, ho, 38, hy - 3);

  } else if (hornStyle === 'straight') {
    // Left straight horn — tapers to a point at top
    hLine(ctx, hb, 25, hy,     3, 5); // base (3px)
    hLine(ctx, hb, 25, hy - 2, 2, 3); // mid (2px)  — use hLine for fill
    fillRect(ctx, hb, 25, hy,     3, 5);
    fillRect(ctx, hb, 25, hy - 2, 2, 3);
    pixel(ctx, hb, 25, hy - 5); pixel(ctx, hb, 26, hy - 5); // tip
    fillRect(ctx, hh, 25, hy - 5, 1, 8); // left highlight strip
    pixel(ctx, hs, 27, hy + 3); pixel(ctx, hs, 27, hy + 4); // shadow right
    // Per-pixel outline:
    pixel(ctx, ho, 25, hy - 6); pixel(ctx, ho, 26, hy - 6); // tip top
    pixel(ctx, ho, 24, hy - 5); pixel(ctx, ho, 24, hy - 4); pixel(ctx, ho, 24, hy - 3); // left side
    pixel(ctx, ho, 24, hy - 2); pixel(ctx, ho, 24, hy - 1); pixel(ctx, ho, 24, hy);
    pixel(ctx, ho, 24, hy + 1); pixel(ctx, ho, 24, hy + 2); pixel(ctx, ho, 24, hy + 3); pixel(ctx, ho, 24, hy + 4);
    pixel(ctx, ho, 25, hy + 5); pixel(ctx, ho, 26, hy + 5); pixel(ctx, ho, 27, hy + 5); // bottom
    pixel(ctx, ho, 28, hy + 4); pixel(ctx, ho, 28, hy + 3); pixel(ctx, ho, 28, hy + 2);
    pixel(ctx, ho, 28, hy + 1); pixel(ctx, ho, 28, hy); pixel(ctx, ho, 28, hy - 1);
    pixel(ctx, ho, 27, hy - 2); pixel(ctx, ho, 27, hy - 3); pixel(ctx, ho, 27, hy - 4);
    pixel(ctx, ho, 27, hy - 5); pixel(ctx, ho, 26, hy - 6); // right to tip

    // Right straight horn (mirror about x=32):
    fillRect(ctx, hb, 36, hy,     3, 5);
    fillRect(ctx, hb, 37, hy - 2, 2, 3);
    pixel(ctx, hb, 37, hy - 5); pixel(ctx, hb, 38, hy - 5);
    fillRect(ctx, hh, 37, hy - 5, 1, 8);
    pixel(ctx, hs, 36, hy + 3); pixel(ctx, hs, 36, hy + 4);
    pixel(ctx, ho, 37, hy - 6); pixel(ctx, ho, 38, hy - 6);
    pixel(ctx, ho, 36, hy - 5); pixel(ctx, ho, 36, hy - 4); pixel(ctx, ho, 36, hy - 3);
    pixel(ctx, ho, 36, hy - 2); pixel(ctx, ho, 36, hy - 1); pixel(ctx, ho, 36, hy);
    pixel(ctx, ho, 35, hy + 1); pixel(ctx, ho, 35, hy + 2); pixel(ctx, ho, 35, hy + 3); pixel(ctx, ho, 35, hy + 4);
    pixel(ctx, ho, 36, hy + 5); pixel(ctx, ho, 37, hy + 5); pixel(ctx, ho, 38, hy + 5);
    pixel(ctx, ho, 39, hy + 4); pixel(ctx, ho, 39, hy + 3); pixel(ctx, ho, 39, hy + 2);
    pixel(ctx, ho, 39, hy + 1); pixel(ctx, ho, 39, hy); pixel(ctx, ho, 39, hy - 1);
    pixel(ctx, ho, 39, hy - 2); pixel(ctx, ho, 39, hy - 3); pixel(ctx, ho, 39, hy - 4);
    pixel(ctx, ho, 38, hy - 5); pixel(ctx, ho, 38, hy - 6);

  } else {
    // Ram horns: sweep outward, each is wide L-shape
    // Left ram horn
    fillRect(ctx, hb, 19, hy - 1, 7, 4); // top sweep
    fillRect(ctx, hb, 16, hy + 2, 5, 4); // downward curl
    fillRect(ctx, hh, 19, hy - 1, 3, 2); // highlight
    pixel(ctx, hs, 15, hy + 4); pixel(ctx, hs, 16, hy + 5); // shadow curl tip
    // Outline:
    pixel(ctx, ho, 18, hy - 2); pixel(ctx, ho, 19, hy - 2); pixel(ctx, ho, 20, hy - 2);
    pixel(ctx, ho, 21, hy - 2); pixel(ctx, ho, 22, hy - 2); pixel(ctx, ho, 23, hy - 2); pixel(ctx, ho, 24, hy - 2);
    pixel(ctx, ho, 25, hy - 1); pixel(ctx, ho, 26, hy); pixel(ctx, ho, 26, hy + 1); pixel(ctx, ho, 26, hy + 2);
    pixel(ctx, ho, 25, hy + 3); pixel(ctx, ho, 24, hy + 3); pixel(ctx, ho, 23, hy + 3); pixel(ctx, ho, 22, hy + 3);
    pixel(ctx, ho, 21, hy + 4); pixel(ctx, ho, 20, hy + 5); pixel(ctx, ho, 19, hy + 6);
    pixel(ctx, ho, 18, hy + 6); pixel(ctx, ho, 17, hy + 6); pixel(ctx, ho, 16, hy + 6); pixel(ctx, ho, 15, hy + 5);
    pixel(ctx, ho, 15, hy + 4); pixel(ctx, ho, 15, hy + 3); pixel(ctx, ho, 15, hy + 2);
    pixel(ctx, ho, 16, hy + 1); pixel(ctx, ho, 17, hy); pixel(ctx, ho, 17, hy - 1); pixel(ctx, ho, 18, hy - 2);

    // Right ram horn (mirror about x=32)
    fillRect(ctx, hb, 38, hy - 1, 7, 4);
    fillRect(ctx, hb, 43, hy + 2, 5, 4);
    fillRect(ctx, hh, 41, hy - 1, 3, 2);
    pixel(ctx, hs, 48, hy + 4); pixel(ctx, hs, 47, hy + 5);
    pixel(ctx, ho, 39, hy - 2); pixel(ctx, ho, 40, hy - 2); pixel(ctx, ho, 41, hy - 2);
    pixel(ctx, ho, 42, hy - 2); pixel(ctx, ho, 43, hy - 2); pixel(ctx, ho, 44, hy - 2); pixel(ctx, ho, 45, hy - 2);
    pixel(ctx, ho, 37, hy - 1); pixel(ctx, ho, 36, hy); pixel(ctx, ho, 36, hy + 1); pixel(ctx, ho, 36, hy + 2);
    pixel(ctx, ho, 37, hy + 3); pixel(ctx, ho, 38, hy + 3); pixel(ctx, ho, 39, hy + 3); pixel(ctx, ho, 40, hy + 3);
    pixel(ctx, ho, 41, hy + 4); pixel(ctx, ho, 42, hy + 5); pixel(ctx, ho, 43, hy + 6);
    pixel(ctx, ho, 44, hy + 6); pixel(ctx, ho, 45, hy + 6); pixel(ctx, ho, 46, hy + 6); pixel(ctx, ho, 47, hy + 5);
    pixel(ctx, ho, 47, hy + 4); pixel(ctx, ho, 47, hy + 3); pixel(ctx, ho, 47, hy + 2);
    pixel(ctx, ho, 46, hy + 1); pixel(ctx, ho, 45, hy); pixel(ctx, ho, 45, hy - 1); pixel(ctx, ho, 45, hy - 2);
  }
}

// Draw tail at bottom of character (south view)
function drawTailSouth(ctx, colors, tailStyle, beltY) {
  const tx = 46; // tail emerges from right hip area
  const ty = beltY;
  const { base: tb, highlight: th, shadow: ts, outline: to } = colors.tail;

  if (tailStyle === 'long') {
    // Long swooping tail: body widens and curves right, ends in arrowhead
    hLine(ctx, tb, tx,     ty,     2);  // root 2px wide
    hLine(ctx, tb, tx,     ty + 1, 3);
    hLine(ctx, tb, tx,     ty + 2, 3);
    hLine(ctx, tb, tx + 1, ty + 3, 3); // start curving right
    hLine(ctx, tb, tx + 1, ty + 4, 4);
    hLine(ctx, tb, tx + 2, ty + 5, 4);
    hLine(ctx, tb, tx + 2, ty + 6, 5);
    hLine(ctx, tb, tx + 2, ty + 7, 5);
    hLine(ctx, tb, tx + 3, ty + 8, 5);
    // Arrowhead
    hLine(ctx, tb, tx + 1, ty + 9,  9); // arrowhead base (wide)
    hLine(ctx, tb, tx + 2, ty + 10, 7);
    hLine(ctx, tb, tx + 3, ty + 11, 5);
    hLine(ctx, tb, tx + 4, ty + 12, 3);
    pixel(ctx, tb, tx + 5, ty + 13);   // arrowhead tip
    // Highlights (upper-left of curve — light from top-left)
    pixel(ctx, th, tx,     ty);
    pixel(ctx, th, tx,     ty + 2);
    pixel(ctx, th, tx + 1, ty + 4);
    pixel(ctx, th, tx + 2, ty + 6);
    // Shadows (lower-right of curve)
    pixel(ctx, ts, tx + 2, ty + 1);
    pixel(ctx, ts, tx + 3, ty + 3);
    pixel(ctx, ts, tx + 5, ty + 5);
    pixel(ctx, ts, tx + 6, ty + 7);
    // Outline — per-pixel, follows silhouette curve
    pixel(ctx, to, tx,     ty - 1); pixel(ctx, to, tx + 1, ty - 1); // top of root
    // Left edge (steps right as tail curves):
    pixel(ctx, to, tx - 1, ty);     pixel(ctx, to, tx - 1, ty + 1); pixel(ctx, to, tx - 1, ty + 2);
    pixel(ctx, to, tx - 1, ty + 3); // still left at row 3 (hLine starts at tx+1)
    pixel(ctx, to, tx,     ty + 4); pixel(ctx, to, tx,     ty + 5);
    pixel(ctx, to, tx + 1, ty + 6); pixel(ctx, to, tx + 1, ty + 7); pixel(ctx, to, tx + 1, ty + 8);
    pixel(ctx, to, tx + 2, ty + 9); // transition to arrowhead
    pixel(ctx, to, tx,     ty + 9); // left arrowhead flange
    pixel(ctx, to, tx + 1, ty + 10); pixel(ctx, to, tx + 2, ty + 11); pixel(ctx, to, tx + 3, ty + 12);
    pixel(ctx, to, tx + 4, ty + 13); pixel(ctx, to, tx + 5, ty + 14); // arrowhead tip bottom
    // Right edge (steps right as tail widens):
    pixel(ctx, to, tx + 2, ty);     pixel(ctx, to, tx + 3, ty + 1);
    pixel(ctx, to, tx + 3, ty + 2); pixel(ctx, to, tx + 4, ty + 3);
    pixel(ctx, to, tx + 5, ty + 4); pixel(ctx, to, tx + 6, ty + 5);
    pixel(ctx, to, tx + 7, ty + 6); pixel(ctx, to, tx + 7, ty + 7); pixel(ctx, to, tx + 8, ty + 8);
    pixel(ctx, to, tx + 10,ty + 9); // right arrowhead flange
    pixel(ctx, to, tx + 9, ty + 10); pixel(ctx, to, tx + 8, ty + 11);
    pixel(ctx, to, tx + 7, ty + 12); pixel(ctx, to, tx + 6, ty + 13);
    pixel(ctx, to, tx + 5, ty + 14); // tip (same pixel as left edge)

  } else if (tailStyle === 'medium') {
    hLine(ctx, tb, tx,     ty,     2);
    hLine(ctx, tb, tx,     ty + 1, 3);
    hLine(ctx, tb, tx + 1, ty + 2, 3);
    hLine(ctx, tb, tx + 1, ty + 3, 4);
    hLine(ctx, tb, tx + 2, ty + 4, 4);
    // Arrowhead
    hLine(ctx, tb, tx + 1, ty + 5, 7);
    hLine(ctx, tb, tx + 2, ty + 6, 5);
    hLine(ctx, tb, tx + 3, ty + 7, 3);
    pixel(ctx, tb, tx + 4, ty + 8);
    pixel(ctx, th, tx, ty);     pixel(ctx, th, tx + 1, ty + 3);
    pixel(ctx, ts, tx + 2, ty + 1); pixel(ctx, ts, tx + 4, ty + 4);
    // Outline
    pixel(ctx, to, tx,     ty - 1); pixel(ctx, to, tx + 1, ty - 1);
    pixel(ctx, to, tx - 1, ty);     pixel(ctx, to, tx - 1, ty + 1); pixel(ctx, to, tx - 1, ty + 2);
    pixel(ctx, to, tx,     ty + 3); pixel(ctx, to, tx,     ty + 4);
    pixel(ctx, to, tx,     ty + 5); // arrowhead left flange
    pixel(ctx, to, tx + 1, ty + 6); pixel(ctx, to, tx + 2, ty + 7);
    pixel(ctx, to, tx + 3, ty + 8); pixel(ctx, to, tx + 4, ty + 9); // tip bottom
    pixel(ctx, to, tx + 2, ty);     pixel(ctx, to, tx + 3, ty + 1);
    pixel(ctx, to, tx + 4, ty + 2); pixel(ctx, to, tx + 5, ty + 3); pixel(ctx, to, tx + 6, ty + 4);
    pixel(ctx, to, tx + 8, ty + 5); // right arrowhead flange
    pixel(ctx, to, tx + 7, ty + 6); pixel(ctx, to, tx + 6, ty + 7);
    pixel(ctx, to, tx + 5, ty + 8); pixel(ctx, to, tx + 4, ty + 9); // tip bottom

  } else {
    // Short stubby tail with arrowhead
    hLine(ctx, tb, tx,     ty,     2);
    hLine(ctx, tb, tx,     ty + 1, 3);
    hLine(ctx, tb, tx + 1, ty + 2, 3);
    hLine(ctx, tb, tx,     ty + 3, 5); // arrowhead base
    hLine(ctx, tb, tx + 1, ty + 4, 3);
    pixel(ctx, tb, tx + 2, ty + 5);
    pixel(ctx, th, tx, ty);
    pixel(ctx, ts, tx + 1, ty + 1);
    // Outline
    pixel(ctx, to, tx,     ty - 1); pixel(ctx, to, tx + 1, ty - 1);
    pixel(ctx, to, tx - 1, ty);     pixel(ctx, to, tx - 1, ty + 1); pixel(ctx, to, tx - 1, ty + 2);
    pixel(ctx, to, tx - 1, ty + 3); // arrowhead left flange
    pixel(ctx, to, tx,     ty + 4); pixel(ctx, to, tx + 1, ty + 5);
    pixel(ctx, to, tx + 2, ty + 6); // tip bottom
    pixel(ctx, to, tx + 2, ty);     pixel(ctx, to, tx + 3, ty + 1);
    pixel(ctx, to, tx + 4, ty + 2);
    pixel(ctx, to, tx + 5, ty + 3); // right arrowhead flange
    pixel(ctx, to, tx + 4, ty + 4); pixel(ctx, to, tx + 3, ty + 5);
    pixel(ctx, to, tx + 2, ty + 6); // tip bottom
  }
}

// Draw demon head south — oval face shape matching human proportions, demon skin + features
function drawDemonHeadSouth(ctx, colors, config) {
  const sk = colors.skin;
  const hair = colors.hair;
  const outline = sk.outline || '#280000';
  const HX = 22, HY = 5;

  // ── Oval face (matches human head row widths) ──────────────────────────────
  hLine(ctx, sk.base, 25, HY + 7,  14);
  hLine(ctx, sk.base, 24, HY + 8,  16);
  fillRect(ctx, sk.base, 23, HY + 9,  18, 3);  // cheeks — widest
  fillRect(ctx, sk.base, 24, HY + 12, 16, 2);
  fillRect(ctx, sk.base, 25, HY + 14, 14, 2);
  hLine(ctx, sk.base, 26, HY + 16, 12);
  hLine(ctx, sk.base, 27, HY + 17, 10);
  hLine(ctx, sk.base, 28, HY + 18,  8);
  hLine(ctx, sk.base, 29, HY + 19,  6);
  hLine(ctx, sk.base, 30, HY + 20,  4);

  // ── Form shading — light from top-left ────────────────────────────────────
  fillRect(ctx, sk.highlight, 24, HY + 8,  3, 3); // left cheek highlight
  hLine(ctx,   sk.highlight,  25, HY + 7,  2);     // forehead left
  vLine(ctx,   sk.shadow,     36, HY + 9,  5);     // right-center falloff
  vLine(ctx,   sk.shadow,     37, HY + 9,  3);
  vLine(ctx,   sk.shadow,     38, HY + 8,  7);     // edge shadow
  vLine(ctx,   sk.shadow,     39, HY + 8,  5);
  pixel(ctx,   sk.shadow,     40, HY + 9);
  pixel(ctx,   sk.shadow,     40, HY + 10);
  pixel(ctx,   sk.shadow,     40, HY + 11);
  // Bottom chin (under-lit)
  hLine(ctx, sk.shadow, 25, HY + 14, 14);
  hLine(ctx, sk.shadow, 26, HY + 16, 12);
  hLine(ctx, sk.shadow, 27, HY + 17, 10);
  hLine(ctx, sk.shadow, 28, HY + 18,  8);
  hLine(ctx, sk.shadow, 29, HY + 19,  6);
  hLine(ctx, sk.shadow, 30, HY + 20,  4);

  // ── Oval outline ──────────────────────────────────────────────────────────
  pixel(ctx, outline, 25, HY + 7); pixel(ctx, outline, 24, HY + 8);
  vLine(ctx, outline, 23, HY + 9, 3);
  pixel(ctx, outline, 24, HY + 12); pixel(ctx, outline, 24, HY + 13);
  pixel(ctx, outline, 25, HY + 14); pixel(ctx, outline, 25, HY + 15);
  pixel(ctx, outline, 26, HY + 16); pixel(ctx, outline, 27, HY + 17);
  pixel(ctx, outline, 28, HY + 18); pixel(ctx, outline, 29, HY + 19);
  pixel(ctx, outline, 38, HY + 7); pixel(ctx, outline, 39, HY + 8);
  vLine(ctx, outline, 40, HY + 9, 3);
  pixel(ctx, outline, 39, HY + 12); pixel(ctx, outline, 39, HY + 13);
  pixel(ctx, outline, 38, HY + 14); pixel(ctx, outline, 38, HY + 15);
  pixel(ctx, outline, 37, HY + 16); pixel(ctx, outline, 36, HY + 17);
  pixel(ctx, outline, 35, HY + 18); pixel(ctx, outline, 34, HY + 19);
  hLine(ctx, outline, 30, HY + 20, 4); // chin tip

  // ── Glowing demon eyes ────────────────────────────────────────────────────
  const eyeY = HY + 9;
  // Outer glow halo: 1 row above + below, 1 col left + right of each eye block
  const glowHalo = 'rgba(255,100,0,0.45)';
  hLine(ctx, glowHalo, 25, eyeY - 1, 5);   // left eye top halo
  hLine(ctx, glowHalo, 25, eyeY + 2, 5);   // left eye bottom halo
  pixel(ctx, glowHalo, 25, eyeY);
  pixel(ctx, glowHalo, 25, eyeY + 1);
  pixel(ctx, glowHalo, 29, eyeY);
  pixel(ctx, glowHalo, 29, eyeY + 1);
  hLine(ctx, glowHalo, 34, eyeY - 1, 5);   // right eye top halo
  hLine(ctx, glowHalo, 34, eyeY + 2, 5);   // right eye bottom halo
  pixel(ctx, glowHalo, 34, eyeY);
  pixel(ctx, glowHalo, 34, eyeY + 1);
  pixel(ctx, glowHalo, 38, eyeY);
  pixel(ctx, glowHalo, 38, eyeY + 1);
  // Eye fill (on top of halo)
  fillRect(ctx, '#FF6600', 26, eyeY, 3, 2);
  fillRect(ctx, '#FF6600', 35, eyeY, 3, 2);
  pixel(ctx, '#FFDD00', 27, eyeY); pixel(ctx, '#FFDD00', 36, eyeY); // bright pupils
  pixel(ctx, '#FFFFFF', 26, eyeY); pixel(ctx, '#FFFFFF', 35, eyeY); // specular glint
  // Heavy brow ridge with shadow beneath
  hLine(ctx, sk.shadow, 25, eyeY - 2, 5);
  hLine(ctx, sk.shadow, 34, eyeY - 2, 5);
  // Deep shadow under brow for extra menace
  const deepShadow = sk.deep_shadow || sk.shadow;
  hLine(ctx, deepShadow, 25, eyeY - 1, 5);
  hLine(ctx, deepShadow, 34, eyeY - 1, 5);
  hLine(ctx, outline,   25, eyeY - 3, 5); // brow outline
  hLine(ctx, outline,   34, eyeY - 3, 5);

  // ── Nose + snarl mouth ────────────────────────────────────────────────────
  pixel(ctx, sk.shadow, 31, HY + 13); pixel(ctx, sk.shadow, 32, HY + 13);
  pixel(ctx, sk.shadow, 30, HY + 14); pixel(ctx, sk.shadow, 33, HY + 14); // nostrils
  hLine(ctx, outline,   29, HY + 15, 6);
  pixel(ctx, '#FF4444', 30, HY + 16); pixel(ctx, '#FF4444', 33, HY + 16); // fangs hint

  // ── Hair covering top of head ─────────────────────────────────────────────
  fillRect(ctx, hair.base,      HX,     HY,     20, 6);
  fillRect(ctx, hair.highlight, HX + 2, HY,     14, 3);
  fillRect(ctx, hair.shadow,    HX,     HY + 4, 20, 2);
  fillRect(ctx, hair.base,      HX,     HY,      2, 11); // left sideburn
  fillRect(ctx, hair.base,      HX + 18,HY,      2, 11); // right sideburn
  hLine(ctx, '#111111', HX + 1, HY,  18); // hair top outline

  // ── Horns drawn on top of hair ────────────────────────────────────────────
  drawHornsSouth(ctx, colors, config.hornStyle || 'curved', HY);
}

/**
 * Generate a single frame canvas for a demon character.
 */
function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  const direction = getDirectionFromAnim(animationName);
  const off = frameOffset;
  const by  = off.bodyY || 0;

  switch (direction) {
    case 'south': {
      // Dark aura drawn first (behind everything)
      drawDarkAura(ctx, by);
      // Draw human body with demon skin and head
      humanSouth(ctx, config, off);
      // Claws over arm area
      // armBaseY: new torsoY = 24 (legH=17), so anchor = torsoY - 2 = 22
      const lArmDY = Math.round((off.leftArmFwd  || 0) * 0.4);
      const rArmDY = Math.round((off.rightArmFwd || 0) * 0.4);
      const armBaseY = 22 + by;
      drawClaws(ctx, colors.skin, armBaseY + lArmDY + 10, armBaseY + rArmDY + 10);
      // Re-draw head with demon features
      // Human head now at HY=1 (y=1-21), clear y=0-21 to make room for demon head at HY=5
      ctx.clearRect(0, 0, FRAME_W, by < 0 ? -by + 22 : 22);
      ctx.save();
      ctx.translate(0, by + (off.headBob || 0));
      drawDemonHeadSouth(ctx, colors, config);
      ctx.restore();
      // Draw tail on top of belt area (new beltY=41 with legH=17, tail root 3px above = 38)
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 38 + by);
      break;
    }
    case 'north': {
      drawDarkAura(ctx, by);
      humanNorth(ctx, config, off);
      // Tail still visible from behind (new tail Y: 38)
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 38 + by);
      break;
    }
    case 'west': {
      drawDarkAura(ctx, by);
      humanWest(ctx, config, off);
      // Side horn (one visible)
      ctx.save();
      ctx.translate(0, by + (off.headBob || 0));
      // Single horn in profile at top of head (new HY=1, horn at y=0)
      const hornY = 0;
      fillRect(ctx, colors.horn.base, 27, hornY, 3, 6);
      fillRect(ctx, colors.horn.base, 25, hornY - 3, 3, 4);
      outlineRect(ctx, colors.horn.outline, 25, hornY - 3, 5, 9);
      ctx.restore();
      // Side tail
      vLine(ctx, colors.tail.base, 40, 42 + by, 6);
      fillRect(ctx, colors.tail.base, 41, 46 + by, 4, 4);
      break;
    }
    case 'east': {
      // Mirror of west demon frame
      const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
      const fakeWestConfig = Object.assign({}, config);
      generateFrameDirect(tmpCtx, fakeWestConfig, colors, off, 'west');
      const mirrored = mirrorCanvasH(tmpC);
      ctx.drawImage(mirrored, 0, 0);
      break;
    }
    default:
      humanSouth(ctx, config, off);
  }

  return canvas;
}

function generateFrameDirect(ctx, config, colors, off, direction) {
  const by = off.bodyY || 0;
  clear(ctx, FRAME_W, FRAME_H);
  humanWest(ctx, config, off);
  ctx.save();
  ctx.translate(0, by + (off.headBob || 0));
  const hornY = 0;
  fillRect(ctx, colors.horn.base, 27, hornY, 3, 6);
  fillRect(ctx, colors.horn.base, 25, hornY - 3, 3, 4);
  outlineRect(ctx, colors.horn.outline, 25, hornY - 3, 5, 9);
  ctx.restore();
  vLine(ctx, colors.tail.base, 40, 42 + by, 6);
  fillRect(ctx, colors.tail.base, 41, 46 + by, 4, 4);
}

function getDirectionFromAnim(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

module.exports = { generateFrame };
