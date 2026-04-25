'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const { DEMON_SKIN, DEMON_PARTS, HAIR_COLORS, CLOTHING, PANTS, SHOES, BELT } = require('../core/Colors');
const { drawGroundShadow, drawShoe, drawLeg, drawBelt, drawTorso, drawArm, drawNeck } = require('./BaseCharacter');
const { drawSouth: humanSouth, drawNorth: humanNorth, drawWest: humanWest, drawEast: humanEast, resolveColors: humanColors } = require('./HumanCharacter');
const { resolveConfig } = require('./CharacterConfig');

// Draw a dark aura around the character — 1-pixel deep_shadow halo at key silhouette points
function drawDarkAura(/* ctx, by */) {
  // Disabled — translucent aura pixels create visible box artifacts on
  // transparent backgrounds. Demon identity comes from horns/skin/tail.
}

// Draw claw tips at the end of each arm hand area
function drawClaws(ctx, skinColors, armLY, armRY) {
  const claw = DEMON_PARTS.claw;
  // Left hand claws — two small downward spikes under 3px arm (lx=34)
  const lhx = 34, lhy = armLY;
  pixel(ctx, claw.base,    lhx,     lhy + 4);
  pixel(ctx, claw.shadow,  lhx,     lhy + 5);
  pixel(ctx, claw.base,    lhx + 2, lhy + 4);
  pixel(ctx, claw.shadow,  lhx + 2, lhy + 5);
  pixel(ctx, claw.highlight, lhx + 1, lhy + 4);

  // Right hand claws — under 3px arm (shoulderRX=59)
  const rhx = 59, rhy = armRY;
  pixel(ctx, claw.base,    rhx,     rhy + 4);
  pixel(ctx, claw.shadow,  rhx,     rhy + 5);
  pixel(ctx, claw.base,    rhx + 2, rhy + 4);
  pixel(ctx, claw.shadow,  rhx + 2, rhy + 5);
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
  const HX = 35, HY = 26, HW = 22;

  // ── CIRCULAR HEAD — 24 rows (y=26-49) so chin meets neck at y=50 ─────────
  const HEAD = [
    [5, 12], [3, 16], [2, 18], [1, 20],
    [1, 20], [1, 20], [1, 20], [1, 20],
    [2, 18], [2, 18], [2, 18], [2, 18],
    [2, 18], [2, 18], [2, 18], [2, 18],
    [3, 16], [3, 16], [4, 14], [4, 14],
    [5, 12], [5, 12], [6, 10], [7,  8],
  ];

  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    hLine(ctx, hair.base, HX + off, HY + r, w);
  }

  hLine(ctx, hair.highlight, HX + 5, HY, 8);
  hLine(ctx, hair.highlight, HX + 3, HY + 1, 12);
  hLine(ctx, hair.highlight, HX + 2, HY + 2, 14);
  for (let r = 3; r <= 6; r++) {
    const [off, w] = HEAD[r];
    for (let dx = 3; dx < w - 3; dx += 5) {
      pixel(ctx, hair.shadow, HX + off + dx, HY + r);
    }
  }
  hLine(ctx, hair.shadow, HX + 1, HY + 7, 20);

  // ── FACE WINDOW (demon skin) ──────────────────────────────────────────────
  const FACE = [
    [41, 14], [40, 16], [40, 16], [40, 16],
    [40, 16], [40, 16], [40, 16], [40, 16],
    [40, 16], [41, 14], [42, 12], [43, 10],
    [44,  8],
  ];
  const faceStart = 7;
  for (let i = 0; i < FACE.length; i++) {
    hLine(ctx, sk.base, FACE[i][0], HY + faceStart + i, FACE[i][1]);
  }

  // Face shading — left cheekbone 2×2 highlight, right shadow
  fillRect(ctx, sk.highlight, 41, HY + 8, 2, 2);
  fillRect(ctx, sk.highlight, 41, HY + 9, 2, 2);
  fillRect(ctx, sk.shadow,    53, HY + 8, 2, 2);
  for (let i = 2; i < FACE.length - 4; i++) {
    pixel(ctx, sk.shadow, FACE[i][0] + FACE[i][1] - 2, HY + faceStart + i);
  }

  for (let i = 0; i < FACE.length; i++) {
    pixel(ctx, outline, FACE[i][0], HY + faceStart + i);
    pixel(ctx, outline, FACE[i][0] + FACE[i][1] - 1, HY + faceStart + i);
  }

  // ── Glowing demon eyes — 4px wide ────────────────────────────────────────
  const eyeY = HY + 10;
  const glowHalo = 'rgba(255,100,0,0.3)';
  hLine(ctx, glowHalo, 41, eyeY - 1, 7);
  fillRect(ctx, '#FF6600', 41, eyeY, 4, 2);
  pixel(ctx, '#FFDD00', 42, eyeY);
  pixel(ctx, '#FFFFFF', 41, eyeY);
  pixel(ctx, '#280000', 44, eyeY);   // inner canthus dark
  hLine(ctx, glowHalo, 49, eyeY - 1, 7);
  fillRect(ctx, '#FF6600', 50, eyeY, 4, 2);
  pixel(ctx, '#FFDD00', 52, eyeY);
  pixel(ctx, '#FFFFFF', 53, eyeY);
  pixel(ctx, '#280000', 50, eyeY);   // inner canthus dark

  // Brow ridge (wider for 4px eyes)
  const deepShadow = sk.deep_shadow || sk.shadow;
  hLine(ctx, deepShadow, 41, eyeY - 2, 6);
  hLine(ctx, outline,    41, eyeY - 3, 6);
  hLine(ctx, deepShadow, 49, eyeY - 2, 6);
  hLine(ctx, outline,    49, eyeY - 3, 6);

  // Nose bridge + nostril + snarl mouth
  pixel(ctx, sk.highlight, 47, HY + 11);   // bridge highlight
  pixel(ctx, sk.highlight, 47, HY + 12);
  pixel(ctx, sk.shadow,    47, HY + 13);   // nose tip
  pixel(ctx, deepShadow,   48, HY + 13);
  hLine(ctx, outline, 44, HY + 14, 6);
  pixel(ctx, '#FF4444', 45, HY + 15); pixel(ctx, '#FF4444', 49, HY + 15);

  // Head silhouette outline
  for (let r = 0; r < HEAD.length; r++) {
    const [off, w] = HEAD[r];
    pixel(ctx, hair.shadow, HX + off, HY + r);
    pixel(ctx, hair.shadow, HX + off + w - 1, HY + r);
  }
  hLine(ctx, '#111111', HX + 5, HY, 10);
  const last = HEAD[HEAD.length - 1];
  hLine(ctx, '#111111', HX + last[0], HY + HEAD.length, last[1]);

  // ── Horns drawn on top of hair ────────────────────────────────────────────
  drawHornsSouth(ctx, colors, config.hornStyle || 'curved', HY);
  // Skull-horn integration: shadow where horns emerge from crown
  pixel(ctx, hair.shadow, HX + 1, HY);
  pixel(ctx, hair.shadow, HX + 2, HY);
  pixel(ctx, hair.shadow, HX + HW - 3, HY);
  pixel(ctx, hair.shadow, HX + HW - 2, HY);
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
      // torsoY = 42+by, arm sleeveH=13, handH=4, so wrist = torsoY + 17
      const lArmDY = Math.round((off.leftArmFwd  || 0) * 0.5);
      const rArmDY = Math.round((off.rightArmFwd || 0) * 0.5);
      const armBaseY = 48 + by;
      drawClaws(ctx, colors.skin, armBaseY + lArmDY + 17, armBaseY + rArmDY + 17);
      // Re-draw head with demon features — clear above neck (neckY=46)
      ctx.clearRect(0, 0, FRAME_W, 46 + Math.min(by, 0));
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      drawDemonHeadSouth(ctx, colors, config);
      ctx.restore();
      // Draw tail on top of belt area (beltY = 66+by)
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 66 + by);
      break;
    }
    case 'north': {
      drawDarkAura(ctx, by);
      humanNorth(ctx, config, off);
      // Tail still visible from behind (beltY = 66+by)
      drawTailSouth(ctx, colors, config.tailStyle || 'long', 66 + by);
      break;
    }
    case 'west': {
      drawDarkAura(ctx, by);
      humanWest(ctx, config, off);
      // Side horn (one visible) — scaled ×1.5 for 96px frame
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      // Single horn in profile — above head at HY=26
      const hornY = 22;
      fillRect(ctx, colors.horn.base, 41, hornY, 4, 7);
      fillRect(ctx, colors.horn.base, 39, hornY - 3, 3, 5);
      outlineRect(ctx, colors.horn.outline, 39, hornY - 3, 6, 11);
      ctx.restore();
      // Side tail (beltY_west ≈ 66+by)
      vLine(ctx, colors.tail.base, 52, 67 + by, 8);
      fillRect(ctx, colors.tail.base, 53, 75 + by, 5, 5);
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
  const hornY = 22;
  fillRect(ctx, colors.horn.base, 41, hornY, 4, 7);
  fillRect(ctx, colors.horn.base, 39, hornY - 3, 3, 5);
  outlineRect(ctx, colors.horn.outline, 39, hornY - 3, 6, 11);
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
