'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const { DEMON_SKIN, DEMON_PARTS, HAIR_COLORS, CLOTHING, PANTS, SHOES, BELT } = require('../core/Colors');
const { drawSouth: humanSouth, drawNorth: humanNorth, drawWest: humanWest, drawEast: humanEast, resolveColors: humanColors, getYAnchors } = require('./HumanCharacter');
const { resolveConfig } = require('./CharacterConfig');

const FRAME_W = 96;
const FRAME_H = 96;

function resolveColors(config) {
  const base = humanColors(config);
  base.skin = DEMON_SKIN[config.demonSkin] || DEMON_SKIN.crimson;
  base.horn = DEMON_PARTS.horn;
  base.tail = DEMON_PARTS.tail;
  // Tiefling eyes: solid iris colour with no sclera (no whites of the eye).
  // Mark the eye palette so drawHeadSouth/drawHeadWest know to fill the
  // sclera with the iris colour for that "glowing solid" tiefling look.
  base.eyes = Object.assign({}, base.eyes, { solid: true });
  return base;
}

// ─── Length tables ──────────────────────────────────────────────────────────
// Heights/extents (in pixels) for each "length" option. Tieflings range from
// stubby horns/short tails to dramatic long-curved horns and whip-like tails.
const HORN_HEIGHTS = { short: 4, medium: 6, long: 9 };
const TAIL_LENGTHS = { short: 6, medium: 10, long: 16 };

// ─── Horn drawing (south view) ──────────────────────────────────────────────
// Anchored at (anchorX, anchorY) — the temple side of the head where the horn
// emerges from the scalp. `dir` is +1 for the right horn, -1 for the left.
function drawStraightHornAt(ctx, c, anchorX, anchorY, len, dir) {
  // Triangular cone tapering from 3px base to 1px tip.
  for (let row = 0; row < len; row++) {
    const w = Math.max(1, Math.round(3 * (len - row) / len));
    const x0 = anchorX - Math.floor(w / 2);
    const yy = anchorY - row;
    hLine(ctx, c.base, x0, yy, w);
    // Lit edge (left side for both horns since light comes from upper-left)
    px(ctx, c.highlight, x0, yy);
    if (w >= 3) px(ctx, c.shadow, x0 + w - 1, yy);
  }
  // Outline silhouette — left, right, tip
  for (let row = 0; row < len; row++) {
    const w = Math.max(1, Math.round(3 * (len - row) / len));
    const x0 = anchorX - Math.floor(w / 2);
    const yy = anchorY - row;
    px(ctx, c.outline, x0 - 1, yy);
    px(ctx, c.outline, x0 + w, yy);
  }
  px(ctx, c.outline, anchorX, anchorY - len);   // tip cap
}

function drawCurvedHornAt(ctx, c, anchorX, anchorY, len, dir) {
  // Devil-style horn that curves outward then up. The lower half goes
  // straight up; the upper half drifts outward by 1-3px depending on length.
  const half = Math.ceil(len / 2);
  for (let row = 0; row < len; row++) {
    // Outward drift on the upper half
    const drift = row < half ? 0 : Math.min(3, row - half + 1);
    const cx = anchorX + dir * drift;
    const w = Math.max(1, Math.round(3 * (len - row) / len));
    const x0 = cx - Math.floor(w / 2);
    const yy = anchorY - row;
    hLine(ctx, c.base, x0, yy, w);
    // Lit on the inner side (toward the head centre)
    const litX = dir > 0 ? x0 : x0 + w - 1;
    const shadX = dir > 0 ? x0 + w - 1 : x0;
    px(ctx, c.highlight, litX, yy);
    if (w >= 3) px(ctx, c.shadow, shadX, yy);
  }
  // Outline
  for (let row = 0; row < len; row++) {
    const drift = row < half ? 0 : Math.min(3, row - half + 1);
    const cx = anchorX + dir * drift;
    const w = Math.max(1, Math.round(3 * (len - row) / len));
    const x0 = cx - Math.floor(w / 2);
    const yy = anchorY - row;
    px(ctx, c.outline, x0 - 1, yy);
    px(ctx, c.outline, x0 + w, yy);
  }
  // Tip cap
  const tipDrift = Math.min(3, half + 1);
  px(ctx, c.outline, anchorX + dir * tipDrift, anchorY - len);
}

function drawRamHornAt(ctx, c, anchorX, anchorY, len, dir) {
  // Ram horn arcs OUTWARD across the side of the head. As `len` grows it
  // also curls back. We draw the arc as a sequence of 2px segments.
  // Arc spans from anchor outward by `len` pixels horizontally.
  const arcW = len;       // horizontal extent of the arc
  const arcH = Math.max(2, Math.floor(len * 0.6));  // vertical rise
  for (let i = 0; i < arcW; i++) {
    // Parametric arc: ax = anchor + dir * i; ay = anchor - arc rise
    const t = i / Math.max(arcW - 1, 1);     // 0..1
    const ax = anchorX + dir * (i + 1);
    const ay = anchorY - Math.round(Math.sin(t * Math.PI) * arcH);
    // 2px-thick horn body
    px(ctx, c.base, ax, ay);
    px(ctx, c.base, ax, ay + 1);
    // Highlight on top edge, shadow on bottom edge
    px(ctx, c.highlight, ax, ay);
    px(ctx, c.shadow,    ax, ay + 1);
    // Outline
    px(ctx, c.outline, ax, ay - 1);
    px(ctx, c.outline, ax, ay + 2);
  }
  // Tip cap
  const tipX = anchorX + dir * arcW;
  px(ctx, c.outline, tipX, anchorY);
  px(ctx, c.outline, tipX, anchorY + 1);
}

function drawHornsSouth(ctx, colors, hornStyle, hornLength, headY) {
  const len = HORN_HEIGHTS[hornLength] || HORN_HEIGHTS.medium;
  const c = colors.horn;
  // Anchor on the human head temples — head spans HX=16..HX+HW-1=47, crown is
  // at HY=21 with widest row at HY+7..HY+15 (32px wide). Horns plant at the
  // top of the crown, just inside the silhouette.
  const lAnchor = { x: 25, y: headY + 1 };   // left horn base
  const rAnchor = { x: 38, y: headY + 1 };   // right horn base

  if (hornStyle === 'straight') {
    drawStraightHornAt(ctx, c, lAnchor.x, lAnchor.y, len, -1);
    drawStraightHornAt(ctx, c, rAnchor.x, rAnchor.y, len, +1);
  } else if (hornStyle === 'ram') {
    drawRamHornAt(ctx, c, lAnchor.x, lAnchor.y, len, -1);
    drawRamHornAt(ctx, c, rAnchor.x, rAnchor.y, len, +1);
  } else {
    // Default: curved (slight outward then up)
    drawCurvedHornAt(ctx, c, lAnchor.x, lAnchor.y, len, -1);
    drawCurvedHornAt(ctx, c, rAnchor.x, rAnchor.y, len, +1);
  }
}

// ─── Horn drawing (west / side view) ────────────────────────────────────────
function drawHornsWest(ctx, colors, hornStyle, hornLength, HX, HY) {
  const len = HORN_HEIGHTS[hornLength] || HORN_HEIGHTS.medium;
  const c = colors.horn;
  // Single visible horn (the front-facing one) anchored at the visible temple
  const ax = HX + 7, ay = HY;

  if (hornStyle === 'straight') {
    drawStraightHornAt(ctx, c, ax, ay, len, -1);   // points slightly forward (left)
  } else if (hornStyle === 'ram') {
    // Ram in profile: curls forward and back. Use dir=-1 (forward)
    drawRamHornAt(ctx, c, ax, ay, len, -1);
  } else {
    drawCurvedHornAt(ctx, c, ax, ay, len, -1);     // curves forward
  }
}

// ─── Tail drawing (south view) ──────────────────────────────────────────────
// Whip-like tail emerging from the right hip area. Width tapers from 3px at
// the root to a 1px point that may end in a small arrowhead spade.
function drawTailSouth(ctx, colors, tailLength, beltY) {
  const len = TAIL_LENGTHS[tailLength] || TAIL_LENGTHS.medium;
  const c = colors.tail;
  const tx = 46;            // root x (right hip)
  const ty = beltY;         // root y

  // Draw a curving whip — root goes down, drifts right as it falls.
  // The curve uses a simple sine for organic sway.
  for (let i = 0; i < len; i++) {
    const t = i / Math.max(len - 1, 1);            // 0..1
    const drift = Math.round(Math.sin(t * Math.PI * 0.7) * (len * 0.35));
    const w = Math.max(1, Math.round(3 * (1 - t) + 1));   // tapers 3 → 1
    const cx = tx + drift;
    const yy = ty + i;
    const x0 = cx;
    hLine(ctx, c.base, x0, yy, w);
    // Light on top edge of the curve
    px(ctx, c.highlight, x0, yy);
    if (w >= 3) px(ctx, c.shadow, x0 + w - 1, yy);
    // Outline
    px(ctx, c.outline, x0 - 1, yy);
    px(ctx, c.outline, x0 + w, yy);
  }

  // Small spade arrowhead at the tip (only on medium+ length)
  if (len >= TAIL_LENGTHS.medium) {
    const tipT = 1;
    const tipDrift = Math.round(Math.sin(tipT * Math.PI * 0.7) * (len * 0.35));
    const tcx = tx + tipDrift;
    const ty2 = ty + len;
    // Spade: 5-3-1 wide triangle pointing down
    hLine(ctx, c.base,    tcx - 2, ty2,     5);
    hLine(ctx, c.base,    tcx - 1, ty2 + 1, 3);
    px(ctx, c.base,       tcx,     ty2 + 2);
    // Shading
    px(ctx, c.highlight,  tcx - 2, ty2);
    px(ctx, c.highlight,  tcx - 1, ty2);
    px(ctx, c.shadow,     tcx + 2, ty2);
    px(ctx, c.shadow,     tcx + 1, ty2 + 1);
    // Outline
    px(ctx, c.outline,    tcx - 3, ty2);
    px(ctx, c.outline,    tcx + 3, ty2);
    px(ctx, c.outline,    tcx - 2, ty2 + 1);
    px(ctx, c.outline,    tcx + 2, ty2 + 1);
    px(ctx, c.outline,    tcx - 1, ty2 + 2);
    px(ctx, c.outline,    tcx + 1, ty2 + 2);
    px(ctx, c.outline,    tcx,     ty2 + 3);
  } else {
    // Short tail: just round the tip
    const t = (len - 1) / Math.max(len - 1, 1);
    const drift = Math.round(Math.sin(t * Math.PI * 0.7) * (len * 0.35));
    px(ctx, c.outline, tx + drift, ty + len);
  }
}

// ─── Tail drawing (west / side view) ────────────────────────────────────────
function drawTailWest(ctx, colors, tailLength, beltY) {
  const len = TAIL_LENGTHS[tailLength] || TAIL_LENGTHS.medium;
  const c = colors.tail;
  // Side view: tail emerges from back-hip area (around x=31), drops behind.
  const tx = 31;
  for (let i = 0; i < len; i++) {
    const t = i / Math.max(len - 1, 1);
    const drift = Math.round(Math.sin(t * Math.PI * 0.6) * (len * 0.25));
    const w = Math.max(1, Math.round(3 * (1 - t) + 1));
    const yy = beltY + i;
    const x0 = tx + drift;
    hLine(ctx, c.base, x0, yy, w);
    px(ctx, c.highlight, x0, yy);
    if (w >= 3) px(ctx, c.shadow, x0 + w - 1, yy);
    px(ctx, c.outline, x0 - 1, yy);
    px(ctx, c.outline, x0 + w, yy);
  }
  if (len >= TAIL_LENGTHS.medium) {
    const t = 1;
    const drift = Math.round(Math.sin(t * Math.PI * 0.6) * (len * 0.25));
    const tcx = tx + drift;
    const ty2 = beltY + len;
    hLine(ctx, c.base, tcx - 1, ty2,     3);
    px(ctx, c.base,    tcx,     ty2 + 1);
    px(ctx, c.outline, tcx - 2, ty2);
    px(ctx, c.outline, tcx + 2, ty2);
    px(ctx, c.outline, tcx - 1, ty2 + 1);
    px(ctx, c.outline, tcx + 1, ty2 + 1);
    px(ctx, c.outline, tcx,     ty2 + 2);
  }
}

// Helper alias
function px(ctx, color, x, y) { pixel(ctx, color, x, y); }

/**
 * Generate a single frame for a tiefling-style demon: human body and head
 * with demon skin tone, plus horns and a tail overlay.
 */
function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  const direction = getDirectionFromAnim(animationName);
  const off = frameOffset;
  const by  = Math.round((off.bodyY || 0) * 1.5);
  const headBobScaled = Math.round((off.headBob || 0) * 1.5);
  const hornStyle  = config.hornStyle  || 'curved';
  const hornLength = config.hornLength || 'medium';
  const tailLength = config.tailLength || config.tailStyle || 'long';

  // Anchor points adjusted for the chosen body height — horns sit at the
  // top of the (possibly translated) head; the tail emerges just above the
  // belt regardless of leg/torso length.
  const yA      = getYAnchors(config);
  const hornY   = yA.headTopY;          // top of head crown
  const tailY   = yA.beltY - 8;         // ~8 px above belt (lower torso/hip)
  const hornYN  = yA.headTopY + 3;      // back-of-head crown sits 3 px lower

  switch (direction) {
    case 'south': {
      humanSouth(ctx, config, off);
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      drawHornsSouth(ctx, colors, hornStyle, hornLength, hornY);
      ctx.restore();
      drawTailSouth(ctx, colors, tailLength, tailY + by);
      break;
    }
    case 'north': {
      humanNorth(ctx, config, off);
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      drawHornsSouth(ctx, colors, hornStyle, hornLength, hornYN);
      ctx.restore();
      drawTailSouth(ctx, colors, tailLength, tailY + by);
      break;
    }
    case 'west': {
      humanWest(ctx, config, off);
      ctx.save();
      ctx.translate(0, by + headBobScaled);
      drawHornsWest(ctx, colors, hornStyle, hornLength, 13, hornY + 3);
      ctx.restore();
      drawTailWest(ctx, colors, tailLength, yA.beltY + by);
      break;
    }
    case 'east': {
      const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
      clear(tmpCtx, FRAME_W, FRAME_H);
      humanWest(tmpCtx, config, off);
      tmpCtx.save();
      tmpCtx.translate(0, by + headBobScaled);
      drawHornsWest(tmpCtx, colors, hornStyle, hornLength, 13, hornY + 3);
      tmpCtx.restore();
      drawTailWest(tmpCtx, colors, tailLength, yA.beltY + by);
      const mirrored = mirrorCanvasH(tmpC);
      ctx.drawImage(mirrored, 0, 0);
      break;
    }
    default:
      humanSouth(ctx, config, off);
  }

  return canvas;
}

function getDirectionFromAnim(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

module.exports = {
  generateFrame,
  // Exported for reuse by other character types (e.g. goblin horns):
  drawHornsSouth,
  drawHornsWest,
  HORN_HEIGHTS,
};
