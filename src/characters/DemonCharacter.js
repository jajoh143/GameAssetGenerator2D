'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const { DEMON_SKIN, DEMON_PARTS, HAIR_COLORS, CLOTHING, PANTS, SHOES, BELT } = require('../core/Colors');
const { drawGroundShadow, drawShoe, drawLeg, drawBelt, drawTorso, drawArm, drawNeck } = require('./BaseCharacter');
const { drawSouth: humanSouth, drawNorth: humanNorth, drawWest: humanWest, drawEast: humanEast, resolveColors: humanColors } = require('./HumanCharacter');
const { resolveConfig } = require('./CharacterConfig');

// Draw a dark aura around the character — 1-pixel deep_shadow halo at key silhouette points
function drawDarkAura(ctx, by) {
  const auraColor = 'rgba(40,0,60,0.55)';
  // Scaled ×1.5 from 64px. Center x=48 (was 32).
  // Head halo (rows 4-39, x=31-65)
  hLine(ctx, auraColor, 32, 4 + by, 32);           // top of head
  for (let y = 5; y <= 39; y++) {
    pixel(ctx, auraColor, 31, y + by);
    pixel(ctx, auraColor, 64, y + by);
  }
  // Body sides (rows 40-78)
  for (let y = 40; y <= 78; y++) {
    pixel(ctx, auraColor, 29, y + by);
    pixel(ctx, auraColor, 66, y + by);
  }
  // Foot halo
  hLine(ctx, auraColor, 30, 94 + by, 18);
  hLine(ctx, auraColor, 48, 94 + by, 18);
}

// Draw claw tips at the end of each arm hand area
function drawClaws(ctx, skinColors, armLY, armRY) {
  const claw = DEMON_PARTS.claw;
  // Left hand claws — three small downward-pointing spikes. Scaled ×1.5.
  // lhx=27 matches left arm shoulder anchor at 96px
  const lhx = 27, lhy = armLY;
  pixel(ctx, claw.base,    lhx,     lhy + 4);
  pixel(ctx, claw.shadow,  lhx,     lhy + 5);
  pixel(ctx, claw.base,    lhx + 3, lhy + 4);
  pixel(ctx, claw.shadow,  lhx + 3, lhy + 5);
  pixel(ctx, claw.base,    lhx + 6, lhy + 4);
  pixel(ctx, claw.shadow,  lhx + 6, lhy + 5);
  pixel(ctx, claw.highlight, lhx + 1, lhy + 4);

  // Right hand claws — scaled to 96px. rhx=62 matches right arm shoulder at 96px.
  const rhx = 62, rhy = armRY;
  pixel(ctx, claw.base,    rhx,     rhy + 4);
  pixel(ctx, claw.shadow,  rhx,     rhy + 5);
  pixel(ctx, claw.base,    rhx + 3, rhy + 4);
  pixel(ctx, claw.shadow,  rhx + 3, rhy + 5);
  pixel(ctx, claw.base,    rhx + 6, rhy + 4);
  pixel(ctx, claw.shadow,  rhx + 6, rhy + 5);
  pixel(ctx, claw.highlight, rhx + 4, rhy + 4);
}

const FRAME_W = 96;
const FRAME_H = 96;

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

// Draw demon head south — 96px face matching scaled human proportions
function drawDemonHeadSouth(ctx, colors, config) {
  const sk = colors.skin;
  const hair = colors.hair;
  const outline = sk.outline || '#280000';
  // HX=34, HY=8 — shifted down slightly from human (HY=1) to leave room for horns
  const HX = 34, HY = 8, HW = 28;

  // ── Oval face (narrower oval — same structure as human) ──────────────────
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
    [41, 15],  // HY+24: chin
    [41, 14],  // HY+25: chin taper
    [42, 13],  // HY+26: chin bottom
  ];
  for (let i = 0; i < FACE.length; i++) {
    hLine(ctx, sk.base, FACE[i][0], HY + 10 + i, FACE[i][1]);
  }

  // ── Form shading ──────────────────────────────────────────────────────────
  fillRect(ctx, sk.highlight, 37, HY + 11, 4, 3);
  hLine(ctx, sk.highlight, 38, HY + 10, 3);
  vLine(ctx, sk.shadow, 58, HY + 13, 7);
  vLine(ctx, sk.shadow, 59, HY + 13, 5);
  pixel(ctx, sk.shadow, 60, HY + 14);
  pixel(ctx, sk.shadow, 60, HY + 15);
  // Chin shadow
  hLine(ctx, sk.shadow, 39, HY + 21, 18);
  hLine(ctx, sk.shadow, 41, HY + 24, 15);
  hLine(ctx, sk.shadow, 42, HY + 26, 13);

  // ── Oval outline (generated from silhouette) ─────────────────────────────
  for (let i = 0; i < FACE.length; i++) {
    const [fx, fw] = FACE[i];
    const y = HY + 10 + i;
    pixel(ctx, outline, fx, y);
    pixel(ctx, outline, fx + fw - 1, y);
  }
  hLine(ctx, outline, FACE[FACE.length - 1][0], HY + 10 + FACE.length, FACE[FACE.length - 1][1]);

  // ── Glowing demon eyes (3px wide × 2px tall slits) ────────────────────────
  const eyeY = HY + 15;
  const glowHalo = 'rgba(255,100,0,0.3)';

  // Left eye glow halo
  hLine(ctx, glowHalo, 41, eyeY - 1, 5);
  pixel(ctx, glowHalo, 41, eyeY + 2);
  pixel(ctx, glowHalo, 45, eyeY + 2);

  // Left eye fill (x=42-44, 2 rows)
  fillRect(ctx, '#FF6600', 42, eyeY, 3, 2);
  pixel(ctx, '#FFDD00', 43, eyeY);               // bright center
  pixel(ctx, '#FFFFFF', 42, eyeY);                // specular glint

  // Right eye glow halo
  hLine(ctx, glowHalo, 49, eyeY - 1, 5);
  pixel(ctx, glowHalo, 49, eyeY + 2);
  pixel(ctx, glowHalo, 53, eyeY + 2);

  // Right eye fill (x=50-52, 2 rows)
  fillRect(ctx, '#FF6600', 50, eyeY, 3, 2);
  pixel(ctx, '#FFDD00', 51, eyeY);
  pixel(ctx, '#FFFFFF', 52, eyeY);

  // Brow ridge (5px wide × 2 rows)
  const deepShadow = sk.deep_shadow || sk.shadow;
  hLine(ctx, deepShadow, 41, eyeY - 2, 5);
  hLine(ctx, outline,    41, eyeY - 3, 5);
  hLine(ctx, deepShadow, 49, eyeY - 2, 5);
  hLine(ctx, outline,    49, eyeY - 3, 5);

  // ── Nose + snarl mouth ────────────────────────────────────────────────────
  pixel(ctx, sk.shadow, 48, HY + 20);
  hLine(ctx, outline,   45, HY + 22, 6);
  pixel(ctx, '#FF4444', 46, HY + 23); pixel(ctx, '#FF4444', 50, HY + 23);

  // ── Hair dome (same shape as human but simplified) ────────────────────────
  const DOME = [
    [4, HW-8], [2, HW-4], [0, HW], [-1, HW+2],
    [-2, HW+4], [-2, HW+4], [-2, HW+4], [-1, HW+2],
    [0, HW], [0, HW],
  ];
  for (let r = 0; r < DOME.length; r++) {
    const [off, w] = DOME[r];
    hLine(ctx, hair.base, HX + off, HY + r, w);
  }
  hLine(ctx, hair.highlight, HX + 4, HY + 1, HW - 10);
  hLine(ctx, hair.highlight, HX + 2, HY + 2, HW - 8);
  hLine(ctx, hair.shadow, HX - 1, HY + 7, HW + 2);
  hLine(ctx, hair.shadow, HX, HY + 8, HW);
  hLine(ctx, hair.shadow, HX, HY + 9, HW);
  // Sideburns (tapered)
  for (let r = 0; r < 17; r++) {
    const w = r < 10 ? 3 : r < 14 ? 2 : 1;
    const col = r >= 14 ? hair.shadow : hair.base;
    for (let i = 0; i < w; i++) {
      pixel(ctx, i === w - 1 ? hair.shadow : col, HX + i, HY + r);
      pixel(ctx, i === 0 ? hair.shadow : col, HX + HW - 1 - i, HY + r);
    }
  }
  // Dome outline
  for (let r = 0; r < DOME.length; r++) {
    const [off, w] = DOME[r];
    pixel(ctx, hair.shadow, HX + off, HY + r);
    pixel(ctx, hair.shadow, HX + off + w - 1, HY + r);
  }
  hLine(ctx, '#111111', HX + 5, HY, DOME[0][1] - 2);

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
  // Scale raw bodyY/headBob by 1.5 to match 96px frame (animation data is in 64px units)
  const by  = Math.round((off.bodyY || 0) * 1.5);
  const headBobScaled = Math.round((off.headBob || 0) * 1.5);

  switch (direction) {
    case 'south': {
      // Dark aura drawn first (behind everything)
      drawDarkAura(ctx, by);
      // Draw human body with demon skin and head
      humanSouth(ctx, config, off);
      // Claws over arm area
      // At 96px: torsoY = 35+by, arm sleeveH=16, handH=6, so wrist = torsoY + 22
      const lArmDY = Math.round((off.leftArmFwd  || 0) * 0.6);
      const rArmDY = Math.round((off.rightArmFwd || 0) * 0.6);
      const armBaseY = 35 + by;
      drawClaws(ctx, colors.skin, armBaseY + lArmDY + 22, armBaseY + rArmDY + 22);
      // Re-draw head with demon features
      // Demon head at HY=8, clear rows 0..39 to remove human head (HY=1, ends ~y=32)
      ctx.clearRect(0, 0, FRAME_W, by < 0 ? -by + 40 : 40);
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      drawDemonHeadSouth(ctx, colors, config);
      ctx.restore();
      // Draw tail on top of belt area (96px: beltY = 61+by)
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 61 + by);
      break;
    }
    case 'north': {
      drawDarkAura(ctx, by);
      humanNorth(ctx, config, off);
      // Tail still visible from behind (96px beltY = 61+by)
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 61 + by);
      break;
    }
    case 'west': {
      drawDarkAura(ctx, by);
      humanWest(ctx, config, off);
      // Side horn (one visible) — scaled ×1.5 for 96px frame
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      // Single horn in profile: x=41 (was 27), scaled from center
      const hornY = 0;
      fillRect(ctx, colors.horn.base, 41, hornY, 4, 9);
      fillRect(ctx, colors.horn.base, 38, hornY - 4, 4, 6);
      outlineRect(ctx, colors.horn.outline, 38, hornY - 4, 8, 14);
      ctx.restore();
      // Side tail (96px: beltY_west ≈ 61+by, tail at right of torso x≈56)
      vLine(ctx, colors.tail.base, 56, 62 + by, 9);
      fillRect(ctx, colors.tail.base, 57, 71 + by, 6, 6);
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
  const by = Math.round((off.bodyY || 0) * 1.5);
  const headBobScaled = Math.round((off.headBob || 0) * 1.5);
  clear(ctx, FRAME_W, FRAME_H);
  humanWest(ctx, config, off);
  ctx.save();
  ctx.translate(0, by + headBobScaled);
  const hornY = 0;
  fillRect(ctx, colors.horn.base, 41, hornY, 4, 9);
  fillRect(ctx, colors.horn.base, 38, hornY - 4, 4, 6);
  outlineRect(ctx, colors.horn.outline, 38, hornY - 4, 8, 14);
  ctx.restore();
  vLine(ctx, colors.tail.base, 56, 62 + by, 9);
  fillRect(ctx, colors.tail.base, 57, 71 + by, 6, 6);
}

function getDirectionFromAnim(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

module.exports = { generateFrame };
