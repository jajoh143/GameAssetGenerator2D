'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, fillEllipse } = require('../core/Canvas');
const Colors = require('../core/Colors');
const { resolveConfig } = require('./CharacterConfig');
const { mirrorCanvasH } = require('../core/Canvas');

const FRAME_W = 96;
const FRAME_H = 96;

// ─── Color resolver ───────────────────────────────────────────────────────────

function resolveColors(config) {
  return {
    skin:  Colors.FAIRY_SKIN[config.fairySkin]  || Colors.FAIRY_SKIN.peach,
    wing:  Colors.FAIRY_WING[config.wingColor]  || Colors.FAIRY_WING.crystal,
    dress: Colors.FAIRY_DRESS[config.fairyDress] || Colors.FAIRY_DRESS.petal_pink,
    glow:  Colors.FAIRY_GLOW[config.glowColor]  || Colors.FAIRY_GLOW.golden,
    hair:  Colors.HAIR_COLORS[config.hair]       || Colors.HAIR_COLORS.blonde,
  };
}

// ─── Helper: tiny pixel drawer ───────────────────────────────────────────────

function px(ctx, color, x, y) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// ─── Wing drawing ────────────────────────────────────────────────────────────

/**
 * Draw butterfly-style wings (south / front view). 96px frame.
 * Wing roots at x=33 (left) and x=63 (right), scaled ×1.5 from 64px.
 */
function drawWingsButterflySouth(ctx, wingColors, bodyY, flapPhase) {
  const { outer, inner, vein, shimmer, outline } = wingColors;
  const wy = 21 + bodyY; // wing root Y (shoulder level, scaled ×1.5)

  // ── Left upper wing ─────────────────────────────────────────────────────
  const spreadL = flapPhase === 0 ? 21 : flapPhase === 1 ? 14 : 6;

  // Fill using scanline rows from wing root to peak
  for (let dy = 0; dy <= 24; dy++) {
    const t = dy / 24;
    const xLeft  = Math.round(33 - spreadL * (1 - t * 0.7));
    const xRight = 33;
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy - 12 + dy, xRight - xLeft + 1);
  }
  // Outer edge (top arc)
  for (let dx = 0; dx <= spreadL; dx++) {
    const t  = dx / spreadL;
    const ty = wy - Math.round(13 * Math.sin(t * Math.PI));
    px(ctx, outer, 33 - dx, ty);
    if (dx > 0) px(ctx, outer, 33 - dx, ty + 1);
  }
  // Vein lines (3 diagonal veins)
  for (let i = 1; i <= 3; i++) {
    const vx = Math.round(33 - spreadL * i / 4);
    const vy = wy - Math.round(10 * i / 4);
    hLine(ctx, vein, vx, vy, 4);
  }
  // Shimmer spot
  px(ctx, shimmer, 33 - Math.round(spreadL * 0.6), wy - 7);
  px(ctx, outline, 33, wy - 12);
  px(ctx, outline, 33, wy + 12);

  // ── Right upper wing (mirror) ───────────────────────────────────────────
  const spreadR = spreadL;
  for (let dy = 0; dy <= 24; dy++) {
    const t = dy / 24;
    const xLeft  = 63;
    const xRight = Math.round(63 + spreadR * (1 - t * 0.7));
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy - 12 + dy, xRight - xLeft + 1);
  }
  for (let dx = 0; dx <= spreadR; dx++) {
    const t  = dx / spreadR;
    const ty = wy - Math.round(13 * Math.sin(t * Math.PI));
    px(ctx, outer, 63 + dx, ty);
    if (dx > 0) px(ctx, outer, 63 + dx, ty + 1);
  }
  for (let i = 1; i <= 3; i++) {
    const vx = Math.round(63 + spreadR * i / 4);
    const vy = wy - Math.round(10 * i / 4);
    hLine(ctx, vein, vx, vy, 4);
  }
  px(ctx, shimmer, 63 + Math.round(spreadR * 0.6), wy - 7);
  px(ctx, outline, 63, wy - 12);
  px(ctx, outline, 63, wy + 12);

  // ── Lower wings (smaller, droop down) ───────────────────────────────────
  const lowerSpread = Math.round(spreadL * 0.55);
  // Left lower
  for (let dy = 0; dy <= 15; dy++) {
    const t = dy / 15;
    const xLeft  = Math.round(33 - lowerSpread * (1 - t));
    const xRight = 33;
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy + 12 + dy, xRight - xLeft + 1);
  }
  // Right lower
  for (let dy = 0; dy <= 15; dy++) {
    const t = dy / 15;
    const xLeft  = 63;
    const xRight = Math.round(63 + lowerSpread * (1 - t));
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy + 12 + dy, xRight - xLeft + 1);
  }

  // Shimmer glints on lower wings
  px(ctx, shimmer, 33 - Math.round(lowerSpread * 0.5), wy + 18);
  px(ctx, shimmer, 63 + Math.round(lowerSpread * 0.5), wy + 18);
}

/**
 * Draw dragonfly-style wings (south / front view). 96px frame.
 */
function drawWingsDragonflyS(ctx, wingColors, bodyY, flapPhase) {
  const { outer, inner, vein, shimmer } = wingColors;
  const wy = 25 + bodyY;
  const spreadH = flapPhase === 0 ? 25 : flapPhase === 1 ? 18 : 9;
  const spreadV = 7;

  // Upper pair
  for (let dy = -spreadV; dy <= spreadV; dy++) {
    const t  = 1 - Math.abs(dy) / spreadV;
    const wx = Math.round(spreadH * t);
    if (wx > 0) {
      hLine(ctx, inner, 33 - wx, wy + dy, wx);
      hLine(ctx, inner, 63,      wy + dy, wx);
    }
  }
  hLine(ctx, vein, 33 - spreadH, wy, spreadH);
  hLine(ctx, vein, 63, wy, spreadH);
  for (let dy = -spreadV; dy <= spreadV; dy++) {
    const t  = 1 - Math.abs(dy) / spreadV;
    const wx = Math.round(spreadH * t);
    px(ctx, outer, 33 - wx, wy + dy);
    px(ctx, outer, 63 + wx - 1, wy + dy);
  }
  px(ctx, shimmer, 33 - spreadH, wy - 1);
  px(ctx, shimmer, 33 - spreadH, wy);
  px(ctx, shimmer, 63 + spreadH - 1, wy - 1);
  px(ctx, shimmer, 63 + spreadH - 1, wy);

  // Lower pair
  const spreadH2 = Math.round(spreadH * 0.75);
  const spreadV2 = 6;
  for (let dy = -spreadV2; dy <= spreadV2; dy++) {
    const t  = 1 - Math.abs(dy) / spreadV2;
    const wx = Math.round(spreadH2 * t);
    if (wx > 0) {
      hLine(ctx, inner, 33 - wx, wy + 15 + dy, wx);
      hLine(ctx, inner, 63,      wy + 15 + dy, wx);
    }
  }
  hLine(ctx, vein, 33 - spreadH2, wy + 15, spreadH2);
  hLine(ctx, vein, 63, wy + 15, spreadH2);
}

// ─── Fairy glow / sparkles ───────────────────────────────────────────────────

function drawGlowHalo(ctx, glowColors, cx, cy, radius) {
  const { bright, mid, soft } = glowColors;
  fillEllipse(ctx, soft + '40', cx, cy, radius, Math.round(radius * 0.7));
  fillEllipse(ctx, bright + '30', cx, cy, Math.round(radius * 0.4), Math.round(radius * 0.3));
}

function drawSparkles(ctx, glowColors, bodyY, frame, count) {
  const { bright, mid } = glowColors;
  // Positions scaled ×1.5 from 64px layout (center shift 32→48)
  const positions = [
    [24, 15], [72, 12], [18, 45], [78, 42],
    [30, 72], [66, 69], [15, 27], [81, 24],
  ];
  const frameInt = Math.floor(Math.abs(frame));
  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const [sx, sy] = positions[(i + frameInt) % positions.length];
    const phase = (frameInt + i) % 3;
    if (phase === 0) {
      px(ctx, bright, sx,     sy + bodyY);
      px(ctx, mid,    sx - 1, sy + bodyY);
      px(ctx, mid,    sx + 1, sy + bodyY);
      px(ctx, mid,    sx,     sy - 1 + bodyY);
      px(ctx, mid,    sx,     sy + 1 + bodyY);
    } else if (phase === 1) {
      px(ctx, mid,    sx, sy + bodyY);
      px(ctx, bright, sx, sy - 1 + bodyY);
    }
  }
}

// ─── Fairy head (chibi — large head, simple face) ────────────────────────────

function drawFairyHeadSouth(ctx, skinColors, hairColors, eyeKey) {
  // Chibi head scaled ×1.5: 27px wide × 27px tall
  // HX=35, HY=12, HW=27, HH=27
  const HX = 35, HY = 12, HW = 27, HH = 27;
  const outline = skinColors.outline;

  // ── Oval face shape ───────────────────────────────────────────────────────
  hLine(ctx, skinColors.base, HX + 4, HY,     HW - 8);   // top
  hLine(ctx, skinColors.base, HX + 2, HY + 1, HW - 4);
  fillRect(ctx, skinColors.base, HX,     HY + 2, HW,  HH - 7); // main face
  hLine(ctx, skinColors.base, HX + 2, HY + HH - 5, HW - 4);
  hLine(ctx, skinColors.base, HX + 4, HY + HH - 3, HW - 8);
  hLine(ctx, skinColors.base, HX + 6, HY + HH - 2, HW - 12);  // chin

  // ── Shading ───────────────────────────────────────────────────────────────
  hLine(ctx, skinColors.highlight, HX + 3, HY + 2, 7);
  hLine(ctx, skinColors.highlight, HX + 3, HY + 3, 5);
  vLine(ctx, skinColors.shadow, HX + HW - 4, HY + 4, 12);
  vLine(ctx, skinColors.shadow, HX + HW - 3, HY + 3, 14);
  hLine(ctx, skinColors.shadow, HX + 4, HY + HH - 4, HW - 8);
  hLine(ctx, skinColors.shadow, HX + 6, HY + HH - 2, HW - 12);

  // ── Outline ───────────────────────────────────────────────────────────────
  px(ctx, outline, HX + 3, HY);
  px(ctx, outline, HX + 4, HY - 1); px(ctx, outline, HX + HW - 5, HY - 1);
  px(ctx, outline, HX + HW - 4, HY);
  vLine(ctx, outline, HX - 1, HY + 2, HH - 6);
  vLine(ctx, outline, HX + HW, HY + 2, HH - 6);
  px(ctx, outline, HX + 3, HY + HH - 3);
  px(ctx, outline, HX + 6, HY + HH - 1);
  px(ctx, outline, HX + HW - 7, HY + HH - 1);
  px(ctx, outline, HX + HW - 4, HY + HH - 3);

  // ── Eyes: minimal dots (2×2) ──────────────────────────────────────────────
  const eyeColors = Colors.EYE_COLORS[eyeKey] || Colors.EYE_COLORS.blue;
  const eyeY = HY + 11;

  // Left eye (2x2 at HX+5..HX+6)
  fillRect(ctx, eyeColors.iris, HX + 5, eyeY, 2, 2);
  px(ctx, '#FFFFFF', HX + 5, eyeY);                         // shine

  // Right eye (2x2 at HX+HW-7..HX+HW-6)
  fillRect(ctx, eyeColors.iris, HX + HW - 7, eyeY, 2, 2);
  px(ctx, '#FFFFFF', HX + HW - 6, eyeY);                    // shine

  // ── Nose: single pixel ───────────────────────────────────────────────────
  px(ctx, skinColors.shadow, HX + 13, eyeY + 7);

  // ── Mouth: subtle 3px line ───────────────────────────────────────────────
  hLine(ctx, skinColors.shadow, HX + 11, eyeY + 10, 3);

  // ── Hair: simple cap with highlight ──────────────────────────────────────
  fillRect(ctx, hairColors.base, HX, HY - 3, HW, 7);  // hair cap
  px(ctx, hairColors.shadow, HX,           HY - 3);
  px(ctx, hairColors.shadow, HX + HW - 1,  HY - 3);
  hLine(ctx, hairColors.highlight, HX + 4, HY - 3, HW - 10);
  hLine(ctx, hairColors.highlight, HX + 3, HY - 2, HW - 8);
  px(ctx, hairColors.highlight, HX + HW / 2 - 1, HY - 3);
  hLine(ctx, hairColors.shadow, HX, HY + 3, HW);
  // Side locks
  pixel(ctx, hairColors.base, HX - 1, HY + 3);
  pixel(ctx, hairColors.base, HX - 1, HY + 4);
  pixel(ctx, hairColors.base, HX + HW, HY + 3);
  pixel(ctx, hairColors.base, HX + HW, HY + 4);
  // Outline top of hair
  hLine(ctx, outline, HX + 2, HY - 4, HW - 4);
}

// ─── Fairy body (chibi proportions, 96px) ────────────────────────────────────

function drawFairyBodySouth(ctx, skinColors, dressColors, bodyY) {
  // Torso: x=39-56 (18px wide), y=40+by to 56+by (17px tall)
  const tx = 39, ty = 40 + bodyY, tw = 18, th = 17;

  // Dress/tunic covers torso
  fillRect(ctx, dressColors.base, tx, ty, tw, th);
  vLine(ctx, dressColors.highlight, tx + 1, ty + 1, th - 2);
  px(ctx, dressColors.highlight, tx + 2, ty);
  vLine(ctx, dressColors.shadow, tx + tw - 2, ty + 1, th - 2);
  vLine(ctx, dressColors.shadow, tx + tw - 1, ty + 3, th - 5);
  vLine(ctx, dressColors.highlight, tx + 7, ty + 1, 4);

  // Skirt flare (15 rows)
  for (let row = 0; row < 15; row++) {
    const t   = row / 14;
    const sx  = Math.round(tx - t * 6);
    const sw  = Math.round(tw + t * 12);
    hLine(ctx, dressColors.base, sx, ty + th + row, sw);
    px(ctx, dressColors.highlight, sx + 3, ty + th + row);
    px(ctx, dressColors.shadow,    sx + sw - 4, ty + th + row);
    px(ctx, dressColors.shadow,    sx + sw - 3, ty + th + row);
    px(ctx, dressColors.outline || skinColors.outline, sx - 1, ty + th + row);
    px(ctx, dressColors.outline || skinColors.outline, sx + sw, ty + th + row);
  }
  // Skirt hem
  hLine(ctx, dressColors.shadow, tx - 8, ty + th + 15, tw + 16);

  // Tiny visible feet below skirt
  const footY = ty + th + 18;
  px(ctx, skinColors.base,    44, footY);
  px(ctx, skinColors.shadow,  44, footY + 1);
  px(ctx, skinColors.base,    53, footY);
  px(ctx, skinColors.shadow,  53, footY + 1);

  // Outline torso top
  hLine(ctx, dressColors.outline || skinColors.outline, tx, ty, tw);
}

function drawFairyArmsSouth(ctx, skinColors, dressColors, lArmDY, rArmDY, bodyY) {
  // Small arms hanging at sides of torso (96px)
  const ty = 40 + bodyY;
  // Left arm (x=33, 3px left of torso)
  const lax = 33, lay = ty + 3 + lArmDY;
  vLine(ctx, skinColors.base, lax, lay, 10);
  px(ctx, skinColors.highlight, lax, lay);
  px(ctx, skinColors.shadow, lax, lay + 9);
  // Tiny hand
  fillRect(ctx, skinColors.base, lax - 1, lay + 9, 4, 4);
  px(ctx, skinColors.shadow, lax - 1, lay + 12);
  px(ctx, skinColors.shadow, lax + 2, lay + 12);

  // Right arm (x=63, 3px right of torso)
  const rax = 63, ray = ty + 3 + rArmDY;
  vLine(ctx, skinColors.base, rax, ray, 10);
  px(ctx, skinColors.highlight, rax, ray);
  px(ctx, skinColors.shadow, rax, ray + 9);
  // Tiny hand
  fillRect(ctx, skinColors.base, rax - 2, ray + 9, 4, 4);
  px(ctx, skinColors.shadow, rax - 2, ray + 12);
  px(ctx, skinColors.shadow, rax + 1, ray + 12);

  // Sleeve puffs at shoulder attachment
  fillRect(ctx, dressColors.base, lax - 1, ty, 5, 6);
  px(ctx, dressColors.highlight, lax - 1, ty);
  fillRect(ctx, dressColors.base, rax - 3, ty, 5, 6);
  px(ctx, dressColors.highlight, rax + 1, ty);
}

// ─── West (side) view ────────────────────────────────────────────────────────

function drawFairySideView(ctx, colors, offsets, facing) {
  const { bodyY: rawBy = 0, leftLegFwd = 0, rightLegFwd = 0,
          leftArmFwd = 0, rightArmFwd = 0, headBob: rawHb = 0 } = offsets;
  const by = Math.round(rawBy * 1.5);
  const headBob = Math.round(rawHb * 1.5);

  const flapPhase = (Math.abs(leftLegFwd) > 3) ? 1 : 0;

  // Background glow
  drawGlowHalo(ctx, colors.glow, 45, 48 + by, 27);

  // Single visible wing (profile)
  const wc = colors.wing;
  const wy = 24 + by;
  const spreadH = flapPhase === 0 ? 21 : 14;
  for (let dy = -7; dy <= 7; dy++) {
    const t  = 1 - Math.abs(dy) / 7;
    const wx = Math.round(spreadH * t);
    if (wx > 0) hLine(ctx, wc.inner, 27 - wx, wy + dy, wx);
  }
  hLine(ctx, wc.vein, 27 - spreadH, wy, spreadH);
  for (let dy = -7; dy <= 7; dy++) {
    const t = 1 - Math.abs(dy) / 7;
    px(ctx, wc.outer, 27 - Math.round(spreadH * t), wy + dy);
  }
  px(ctx, wc.shimmer, 27 - spreadH + 1, wy - 1);
  // Lower wing
  for (let dy = 0; dy <= 12; dy++) {
    const t = 1 - dy / 12;
    const wx = Math.round(spreadH * 0.6 * t);
    if (wx > 0) hLine(ctx, wc.inner, 27 - wx, wy + 9 + dy, wx);
  }

  // Profile body
  const tx = 33, ty = 40 + by;
  const skinC = colors.skin;

  // Head (side) — simple oval, scaled ×1.5
  fillRect(ctx, skinC.base, 30, 12 + by, 18, 24);
  hLine(ctx, skinC.highlight, 32, 14 + by, 6);
  vLine(ctx, skinC.shadow, 45, 15 + by, 15);
  // Hair
  fillRect(ctx, colors.hair.base, 30, 9 + by, 18, 10);
  hLine(ctx, colors.hair.highlight, 33, 9 + by, 10);
  px(ctx, skinC.shadow, 29, 18 + by); // ear
  // Profile eye (single pixel)
  px(ctx, Colors.EYE_COLORS.blue.iris, 30, 21 + by + headBob);

  // Torso
  fillRect(ctx, colors.dress.base, tx, ty, 15, 15);
  vLine(ctx, colors.dress.highlight, tx + 1, ty + 1, 13);
  vLine(ctx, colors.dress.shadow,    tx + 12, ty + 1, 13);

  // Arm (front)
  const fArmDX = facing === 'west' ? -Math.round(leftArmFwd * 0.9) : Math.round(rightArmFwd * 0.9);
  vLine(ctx, skinC.base, tx + fArmDX + 1, ty + 4, 12);

  // Skirt
  for (let row = 0; row < 15; row++) {
    hLine(ctx, colors.dress.base, tx - Math.round(row / 2), ty + 15 + row, 15 + Math.round(row / 2));
  }
}

// ─── Main generateFrame ───────────────────────────────────────────────────────

function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  const off = frameOffset;

  // Wing flap phase: use abs(leftLegFwd) as wing activity signal
  const legAbs  = Math.max(Math.abs(off.leftLegFwd || 0), Math.abs(off.rightLegFwd || 0));
  const flapPhase = legAbs >= 4 ? 0 : legAbs >= 2 ? 1 : 2;

  const isAttack  = animationName.startsWith('attack');
  const frameIdx  = Math.abs(off.leftArmFwd || 0);

  const wingStyle = config.wingStyle || 'butterfly';

  let direction = 'south';
  if (animationName.includes('north')) direction = 'north';
  else if (animationName.includes('west')) direction = 'west';
  else if (animationName.includes('east')) direction = 'east';

  if (direction === 'east') {
    const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
    generateFrameDirect(tmpCtx, config, colors, off, 'west', wingStyle, flapPhase, isAttack, frameIdx);
    const mirrored = mirrorCanvasH(tmpC);
    ctx.drawImage(mirrored, 0, 0);
    return canvas;
  }

  generateFrameDirect(ctx, config, colors, off, direction, wingStyle, flapPhase, isAttack, frameIdx);
  return canvas;
}

function generateFrameDirect(ctx, config, colors, off, direction, wingStyle, flapPhase, isAttack, frameIdx) {
  // Scale raw bodyY/headBob by 1.5 to match 96px frame
  const by = Math.round((off.bodyY || 0) * 1.5);
  const headBob = Math.round((off.headBob || 0) * 1.5);

  if (direction === 'west' || direction === 'north') {
    drawFairySideView(ctx, colors, off, direction);
    if (isAttack) drawSparkles(ctx, colors.glow, by, frameIdx, 5);
    return;
  }

  // ── South (and idle) ─────────────────────────────────────────────────────

  // 1. Background ambient glow (drawn first, behind everything)
  drawGlowHalo(ctx, colors.glow, 48, 49 + by, 33);

  // 2. Wings (behind body)
  if (wingStyle === 'dragonfly') {
    drawWingsDragonflyS(ctx, colors.wing, by, flapPhase);
  } else {
    drawWingsButterflySouth(ctx, colors.wing, by, flapPhase);
  }

  // 3. Arms
  const lArmDY = Math.round((off.leftArmFwd  || 0) * 0.6);
  const rArmDY = Math.round((off.rightArmFwd || 0) * 0.6);
  drawFairyArmsSouth(ctx, colors.skin, colors.dress, lArmDY, rArmDY, by);

  // 4. Body
  drawFairyBodySouth(ctx, colors.skin, colors.dress, by);

  // 5. Head (on top of body)
  ctx.save();
  ctx.translate(0, headBob);
  drawFairyHeadSouth(ctx, colors.skin, colors.hair, config.eyes || 'blue');
  ctx.restore();

  // 6. Sparkles (attack frames get more, idle gets a few)
  const sparkleCount = isAttack ? 6 : 2;
  drawSparkles(ctx, colors.glow, by, frameIdx, sparkleCount);
}

module.exports = { generateFrame };
