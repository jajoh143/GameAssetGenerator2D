'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH } = require('../core/Canvas');
const { getYAnchors } = require('../characters/HumanCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

const px = pixel;

// Torso silhouette in 64-px-wide frame is roughly x=20..43 (24 wide).
// Side profile torso sits at x=20..27 (8 wide).
const S_TORSO_LEFT  = 20;
const S_TORSO_RIGHT = 43;
const S_TORSO_W     = S_TORSO_RIGHT - S_TORSO_LEFT + 1; // 24
const W_TORSO_LEFT  = 20;
const W_TORSO_W     = 10;

// ── Variant draws (south view) ─────────────────────────────────────────────

function drawTunicSouth(ctx, colors, torsoY, torsoH) {
  // Soft cloth tunic — covers torso + first 2 px below belt for skirt drape.
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  // Vertical highlight stripe (left side, like sun catch)
  vLine(ctx, colors.primary.highlight, x + 2, torsoY + 1, torsoH - 2);
  // Vertical shadow stripe (right side)
  vLine(ctx, colors.primary.shadow, x + w - 3, torsoY + 1, torsoH - 2);
  // Lower hem shadow
  hLine(ctx, colors.primary.shadow, x, torsoY + torsoH - 1, w);
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Trim band at neckline
  hLine(ctx, colors.accent.base, x + 2, torsoY, w - 4);
  hLine(ctx, colors.accent.outline, x + 2, torsoY - 1, w - 4);
  // V-neck cutout
  px(ctx, 'rgba(0,0,0,0)', x + Math.floor(w / 2), torsoY + 1);
}

function drawChainmailSouth(ctx, colors, torsoY, torsoH) {
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  // Stippled mail texture: alternating highlight/shadow pixels every 2px
  for (let r = torsoY + 1; r < torsoY + torsoH - 1; r++) {
    const phase = (r % 2);
    for (let cx = x + 1 + phase; cx < x + w - 1; cx += 2) {
      px(ctx, colors.primary.highlight, cx, r);
    }
    for (let cx = x + 2 - phase; cx < x + w - 1; cx += 2) {
      px(ctx, colors.primary.shadow, cx, r);
    }
  }
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Deepen bottom-half outline for weight
  hLine(ctx, '#000000', x, torsoY + torsoH - 1, w);
  // Metal collar
  hLine(ctx, colors.metal.base,    x + 4, torsoY, w - 8);
  hLine(ctx, colors.metal.outline, x + 4, torsoY - 1, w - 8);
  // Specular pop on collar (leading edge)
  px(ctx, '#ffffff', x + 5, torsoY);
}

function drawPlateSouth(ctx, colors, torsoY, torsoH) {
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  // Main plate
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  // Pectoral highlights — two rounded plates
  fillRect(ctx, colors.primary.highlight, x + 2, torsoY + 1, 8, 4);
  fillRect(ctx, colors.primary.highlight, x + w - 10, torsoY + 1, 8, 4);
  // Center divot (sternum line)
  vLine(ctx, colors.primary.shadow, x + Math.floor(w / 2), torsoY + 1, torsoH - 2);
  // Belt-line shadow
  hLine(ctx, colors.primary.shadow, x, torsoY + torsoH - 2, w);
  // Outline
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Deepen bottom-half outline (pure black) for volumetric weight
  hLine(ctx, '#000000', x, torsoY + torsoH - 1, w);
  vLine(ctx, '#000000', x,         torsoY + Math.floor(torsoH / 2), Math.ceil(torsoH / 2));
  vLine(ctx, '#000000', x + w - 1, torsoY + Math.floor(torsoH / 2), Math.ceil(torsoH / 2));
  // Pauldron-like shoulder caps
  fillRect(ctx, colors.metal.base,    x - 1, torsoY, 4, 3);
  fillRect(ctx, colors.metal.base,    x + w - 3, torsoY, 4, 3);
  outlineRect(ctx, colors.metal.outline, x - 1, torsoY, 4, 3);
  outlineRect(ctx, colors.metal.outline, x + w - 3, torsoY, 4, 3);
  // Specular pop on each pauldron (top of metal cap)
  px(ctx, '#ffffff', x,         torsoY);
  px(ctx, '#ffffff', x + w - 2, torsoY);
  // Specular pop on the leading edge of the plate (left pectoral upper)
  px(ctx, '#ffffff', x + 3, torsoY + 1);
  // 4 rivets on the chest plate corners (just inside the outline)
  px(ctx, colors.metal.outline, x + 1,         torsoY + 1);
  px(ctx, colors.metal.outline, x + w - 2,     torsoY + 1);
  px(ctx, colors.metal.outline, x + 1,         torsoY + torsoH - 3);
  px(ctx, colors.metal.outline, x + w - 2,     torsoY + torsoH - 3);
}

function drawTabardSouth(ctx, colors, torsoY, torsoH) {
  // Base tunic underneath
  drawTunicSouth(ctx, colors, torsoY, torsoH);
  // Tabard panel: ~10 px wide, hangs from neck to belt + 1 px below
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  const tx = x + Math.floor(w / 2) - 4;  // centered, 8 wide
  const tw = 8;
  const ty = torsoY;
  const th = torsoH + 1;
  fillRect(ctx, colors.accent.base, tx, ty, tw, th);
  // Vertical highlight on left edge
  vLine(ctx, colors.accent.highlight, tx + 1, ty + 1, th - 2);
  // Vertical shadow on right edge
  vLine(ctx, colors.accent.shadow,    tx + tw - 2, ty + 1, th - 2);
  // Bottom hem
  hLine(ctx, colors.accent.shadow, tx, ty + th - 1, tw);
  outlineRect(ctx, colors.accent.outline, tx, ty, tw, th);
  // Heraldic motif: simple cross in primary color, in the panel's center
  const cmx = tx + Math.floor(tw / 2);
  const cmy = ty + Math.floor(th / 2);
  vLine(ctx, colors.primary.base, cmx,     cmy - 2, 5);
  hLine(ctx, colors.primary.base, cmx - 2, cmy,     5);
  // Cross outline
  px(ctx, colors.primary.outline, cmx, cmy - 3);
  px(ctx, colors.primary.outline, cmx, cmy + 3);
  px(ctx, colors.primary.outline, cmx - 3, cmy);
  px(ctx, colors.primary.outline, cmx + 3, cmy);
  // Cross highlight
  px(ctx, colors.primary.highlight, cmx, cmy - 1);
}

function drawRobeSouth(ctx, colors, torsoY, torsoH) {
  // Long flowing robe extending from shoulders down past the belt.
  const x = S_TORSO_LEFT;
  const w = S_TORSO_W;
  // The torso is `torsoH` tall; robe extends `extra` more px below for skirt.
  const extra = 16;
  const robeY = torsoY;
  const robeH = torsoH + extra;
  // Slightly wider at bottom (flare).
  fillRect(ctx, colors.primary.base, x, robeY, w, robeH);
  // Lower flare row (1 px wider on each side at bottom)
  hLine(ctx, colors.primary.base, x - 1, robeY + robeH - 2, w + 2);
  hLine(ctx, colors.primary.base, x - 1, robeY + robeH - 1, w + 2);
  // Vertical highlight stripe (left)
  vLine(ctx, colors.primary.highlight, x + 2, robeY + 1, robeH - 2);
  // Vertical shadow stripe (right)
  vLine(ctx, colors.primary.shadow, x + w - 3, robeY + 1, robeH - 2);
  // Center seam down the front
  vLine(ctx, colors.primary.shadow, x + Math.floor(w / 2), robeY + 1, robeH - 2);
  // Bottom hem shadow
  hLine(ctx, colors.primary.shadow, x - 1, robeY + robeH - 1, w + 2);
  // Outline
  outlineRect(ctx, colors.primary.outline, x, robeY, w, robeH);
  px(ctx, colors.primary.outline, x - 2, robeY + robeH - 2);
  px(ctx, colors.primary.outline, x + w + 1, robeY + robeH - 2);
  hLine(ctx, '#000000', x - 1, robeY + robeH, w + 2);
  // Trim band at neckline / collar
  hLine(ctx, colors.accent.base,    x + 2, robeY, w - 4);
  hLine(ctx, colors.accent.outline, x + 2, robeY - 1, w - 4);
}

// ── West variant draws ─────────────────────────────────────────────────────

function drawTunicWest(ctx, colors, torsoY, torsoH) {
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  vLine(ctx, colors.primary.highlight, x + 1, torsoY + 1, torsoH - 2);
  vLine(ctx, colors.primary.shadow, x + w - 2, torsoY + 1, torsoH - 2);
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
}

function drawChainmailWest(ctx, colors, torsoY, torsoH) {
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  for (let r = torsoY + 1; r < torsoY + torsoH - 1; r++) {
    const phase = (r % 2);
    for (let cx = x + 1 + phase; cx < x + w - 1; cx += 2) {
      px(ctx, colors.primary.highlight, cx, r);
    }
  }
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
}

function drawPlateWest(ctx, colors, torsoY, torsoH) {
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  fillRect(ctx, colors.primary.base, x, torsoY, w, torsoH);
  vLine(ctx, colors.primary.highlight, x + 1, torsoY + 1, torsoH - 2);
  vLine(ctx, colors.primary.shadow, x + w - 2, torsoY + 1, torsoH - 2);
  hLine(ctx, colors.primary.shadow, x, torsoY + torsoH - 2, w);
  outlineRect(ctx, colors.primary.outline, x, torsoY, w, torsoH);
  // Deepen bottom-half outline
  hLine(ctx, '#000000', x, torsoY + torsoH - 1, w);
  fillRect(ctx, colors.metal.base, x, torsoY, 3, 3);
  outlineRect(ctx, colors.metal.outline, x, torsoY, 3, 3);
  // Specular pop on top of pauldron
  px(ctx, '#ffffff', x + 1, torsoY);
  // Leading-edge specular on chest
  px(ctx, '#ffffff', x + 1, torsoY + 2);
  // 2 rivets on the plate corners
  px(ctx, colors.metal.outline, x + 1,     torsoY + torsoH - 3);
  px(ctx, colors.metal.outline, x + w - 2, torsoY + torsoH - 3);
}

function drawTabardWest(ctx, colors, torsoY, torsoH) {
  // Base tunic side profile
  drawTunicWest(ctx, colors, torsoY, torsoH);
  // Vertical tabard panel covering the front of the torso
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  // Front portion of torso (left half on west view)
  const tx = x + 2;
  const tw = w - 4;
  const ty = torsoY;
  const th = torsoH + 1;
  fillRect(ctx, colors.accent.base, tx, ty, tw, th);
  vLine(ctx, colors.accent.highlight, tx + 1, ty + 1, th - 2);
  vLine(ctx, colors.accent.shadow,    tx + tw - 2, ty + 1, th - 2);
  hLine(ctx, colors.accent.shadow, tx, ty + th - 1, tw);
  outlineRect(ctx, colors.accent.outline, tx, ty, tw, th);
  // Simple heraldic mark (single accent dot in center)
  const cmx = tx + Math.floor(tw / 2);
  const cmy = ty + Math.floor(th / 2);
  vLine(ctx, colors.primary.base, cmx, cmy - 1, 3);
  px(ctx, colors.primary.outline, cmx, cmy - 2);
  px(ctx, colors.primary.outline, cmx, cmy + 2);
}

function drawRobeWest(ctx, colors, torsoY, torsoH) {
  // Side profile: robe drapes long with a sleeve drape on the front.
  const x = W_TORSO_LEFT;
  const w = W_TORSO_W;
  const extra = 16;
  const robeY = torsoY;
  const robeH = torsoH + extra;
  fillRect(ctx, colors.primary.base, x, robeY, w, robeH);
  // Flare 1 px at bottom
  hLine(ctx, colors.primary.base, x - 1, robeY + robeH - 2, w + 2);
  hLine(ctx, colors.primary.base, x - 1, robeY + robeH - 1, w + 2);
  // Highlight (front edge / left side)
  vLine(ctx, colors.primary.highlight, x + 1, robeY + 1, robeH - 2);
  // Shadow (back / right)
  vLine(ctx, colors.primary.shadow,    x + w - 2, robeY + 1, robeH - 2);
  // Center seam (slightly to back for depth)
  vLine(ctx, colors.primary.shadow,    x + Math.floor(w / 2), robeY + 2, robeH - 4);
  // Bottom hem
  hLine(ctx, colors.primary.shadow, x - 1, robeY + robeH - 1, w + 2);
  outlineRect(ctx, colors.primary.outline, x, robeY, w, robeH);
  px(ctx, colors.primary.outline, x - 2, robeY + robeH - 2);
  px(ctx, colors.primary.outline, x + w + 1, robeY + robeH - 2);
  hLine(ctx, '#000000', x - 1, robeY + robeH, w + 2);
  // Sleeve drape on front: a small wedge of cloth jutting forward at shoulder
  vLine(ctx, colors.primary.base,    x - 1, robeY + 1, 5);
  vLine(ctx, colors.primary.outline, x - 2, robeY + 1, 5);
  px(ctx, colors.primary.shadow, x - 1, robeY + 5);
}

const CHEST_VARIANTS = {
  tunic:     { drawSouth: drawTunicSouth,     drawWest: drawTunicWest,     label: 'Tunic'      },
  chainmail: { drawSouth: drawChainmailSouth, drawWest: drawChainmailWest, label: 'Chainmail'  },
  plate:     { drawSouth: drawPlateSouth,     drawWest: drawPlateWest,     label: 'Plate Mail' },
  tabard:    { drawSouth: drawTabardSouth,    drawWest: drawTabardWest,    label: 'Tabard'     },
  robe:      { drawSouth: drawRobeSouth,      drawWest: drawRobeWest,      label: 'Robe'       },
};

// ── Frame generator ────────────────────────────────────────────────────────

function generateChestFrame(variantInfo, colors, config, animName, frameOffset, direction) {
  const yA      = getYAnchors(config);
  const bodyY   = frameOffset.bodyY || 0;
  const torsoY  = yA.torsoY + bodyY;
  const torsoH  = yA.beltY - yA.torsoY;

  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  if (direction === 'south' || direction === 'north') {
    variantInfo.drawSouth(ctx, colors, torsoY, torsoH);
    return canvas;
  }
  if (direction === 'west') {
    variantInfo.drawWest(ctx, colors, torsoY, torsoH);
    return canvas;
  }
  // east mirrors west
  const { canvas: tmp, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  variantInfo.drawWest(tmpCtx, colors, torsoY, torsoH);
  ctx.drawImage(mirrorCanvasH(tmp), 0, 0);
  return canvas;
}

module.exports = { generateChestFrame, CHEST_VARIANTS };
