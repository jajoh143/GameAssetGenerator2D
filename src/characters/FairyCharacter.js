'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, fillEllipse } = require('../core/Canvas');
const Colors = require('../core/Colors');
const { resolveConfig } = require('./CharacterConfig');
const { mirrorCanvasH } = require('../core/Canvas');

const FRAME_W = 64;
const FRAME_H = 64;

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
 * Draw butterfly-style wings (south / front view).
 * Upper wings: large, sweeping outward and upward.
 * Lower wings: smaller, curving down.
 * flapPhase: 0 = resting, 1 = half-flap, 2 = full-flap (folded)
 */
function drawWingsButterflySouth(ctx, wingColors, bodyY, flapPhase) {
  const { outer, inner, vein, shimmer, outline } = wingColors;
  const wy = 14 + bodyY; // wing root Y (shoulder level)

  // ── Left upper wing ─────────────────────────────────────────────────────
  // At rest (phase 0): sweeps left, peak at (8, wy-8)
  // Phase 1: slightly folded — less horizontal extent
  // Phase 2: folded — nearly vertical
  const spreadL = flapPhase === 0 ? 14 : flapPhase === 1 ? 9 : 4;
  const peakLX  = 22 - spreadL;
  const peakLY  = wy - 9;

  // Fill using scanline rows from wing root to peak
  for (let dy = 0; dy <= 16; dy++) {
    const t = dy / 16;
    const xLeft  = Math.round(22 - spreadL * (1 - t * 0.7));
    const xRight = 22;
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy - 8 + dy, xRight - xLeft + 1);
  }
  // Outer edge (top arc)
  for (let dx = 0; dx <= spreadL; dx++) {
    const t  = dx / spreadL;
    const ty = wy - Math.round(9 * Math.sin(t * Math.PI));
    px(ctx, outer, 22 - dx, ty);
    if (dx > 0) px(ctx, outer, 22 - dx, ty + 1);
  }
  // Vein lines (3 diagonal veins)
  for (let i = 1; i <= 3; i++) {
    const vx = Math.round(22 - spreadL * i / 4);
    const vy = wy - Math.round(7 * i / 4);
    hLine(ctx, vein, vx, vy, 3);
  }
  // Shimmer spot on wing face
  px(ctx, shimmer, 22 - Math.round(spreadL * 0.6), wy - 5);
  // Outline root
  px(ctx, outline, 22, wy - 8);
  px(ctx, outline, 22, wy + 8);

  // ── Right upper wing (mirror) ───────────────────────────────────────────
  const spreadR = spreadL;
  for (let dy = 0; dy <= 16; dy++) {
    const t = dy / 16;
    const xLeft  = 42;
    const xRight = Math.round(42 + spreadR * (1 - t * 0.7));
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy - 8 + dy, xRight - xLeft + 1);
  }
  for (let dx = 0; dx <= spreadR; dx++) {
    const t  = dx / spreadR;
    const ty = wy - Math.round(9 * Math.sin(t * Math.PI));
    px(ctx, outer, 42 + dx, ty);
    if (dx > 0) px(ctx, outer, 42 + dx, ty + 1);
  }
  for (let i = 1; i <= 3; i++) {
    const vx = Math.round(42 + spreadR * i / 4);
    const vy = wy - Math.round(7 * i / 4);
    hLine(ctx, vein, vx, vy, 3);
  }
  px(ctx, shimmer, 42 + Math.round(spreadR * 0.6), wy - 5);
  px(ctx, outline, 42, wy - 8);
  px(ctx, outline, 42, wy + 8);

  // ── Lower wings (smaller, droop down) ───────────────────────────────────
  const lowerSpread = Math.round(spreadL * 0.55);
  // Left lower
  for (let dy = 0; dy <= 10; dy++) {
    const t = dy / 10;
    const xLeft  = Math.round(22 - lowerSpread * (1 - t));
    const xRight = 22;
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy + 8 + dy, xRight - xLeft + 1);
  }
  // Right lower
  for (let dy = 0; dy <= 10; dy++) {
    const t = dy / 10;
    const xLeft  = 42;
    const xRight = Math.round(42 + lowerSpread * (1 - t));
    if (xLeft < xRight) hLine(ctx, inner, xLeft, wy + 8 + dy, xRight - xLeft + 1);
  }

  // Shimmer glints on lower wings
  px(ctx, shimmer, 22 - Math.round(lowerSpread * 0.5), wy + 12);
  px(ctx, shimmer, 42 + Math.round(lowerSpread * 0.5), wy + 12);
}

/**
 * Draw dragonfly-style wings (south / front view).
 * Two pairs of long, narrow wings extending horizontally.
 */
function drawWingsDragonflyS(ctx, wingColors, bodyY, flapPhase) {
  const { outer, inner, vein, shimmer, outline } = wingColors;
  const wy = 17 + bodyY;
  const spreadH = flapPhase === 0 ? 17 : flapPhase === 1 ? 12 : 6;
  const spreadV = 5;

  // Upper pair: thinner, more horizontal
  for (let dy = -spreadV; dy <= spreadV; dy++) {
    const t  = 1 - Math.abs(dy) / spreadV;
    const wx = Math.round(spreadH * t);
    if (wx > 0) {
      hLine(ctx, inner, 22 - wx, wy + dy, wx);         // left
      hLine(ctx, inner, 42,      wy + dy, wx);         // right
    }
  }
  // Vein: single horizontal center line
  hLine(ctx, vein, 22 - spreadH, wy, spreadH);
  hLine(ctx, vein, 42, wy, spreadH);
  // Outer edge pixels
  for (let dy = -spreadV; dy <= spreadV; dy++) {
    const t  = 1 - Math.abs(dy) / spreadV;
    const wx = Math.round(spreadH * t);
    px(ctx, outer, 22 - wx, wy + dy);
    px(ctx, outer, 42 + wx - 1, wy + dy);
  }
  // Shimmer tips
  px(ctx, shimmer, 22 - spreadH, wy - 1);
  px(ctx, shimmer, 22 - spreadH, wy);
  px(ctx, shimmer, 42 + spreadH - 1, wy - 1);
  px(ctx, shimmer, 42 + spreadH - 1, wy);

  // Lower pair: slightly smaller, shifted down
  const spreadH2 = Math.round(spreadH * 0.75);
  const spreadV2 = 4;
  for (let dy = -spreadV2; dy <= spreadV2; dy++) {
    const t  = 1 - Math.abs(dy) / spreadV2;
    const wx = Math.round(spreadH2 * t);
    if (wx > 0) {
      hLine(ctx, inner, 22 - wx, wy + 10 + dy, wx);
      hLine(ctx, inner, 42,      wy + 10 + dy, wx);
    }
  }
  hLine(ctx, vein, 22 - spreadH2, wy + 10, spreadH2);
  hLine(ctx, vein, 42, wy + 10, spreadH2);
}

// ─── Fairy glow / sparkles ───────────────────────────────────────────────────

function drawGlowHalo(ctx, glowColors, cx, cy, radius) {
  // Soft radial glow: concentric rings of decreasing opacity
  const { bright, mid, soft } = glowColors;
  // Innermost ring (1px around sprite center area)
  fillEllipse(ctx, soft + '40', cx, cy, radius, Math.round(radius * 0.7));
  // Small bright core at center
  fillEllipse(ctx, bright + '30', cx, cy, Math.round(radius * 0.4), Math.round(radius * 0.3));
}

function drawSparkles(ctx, glowColors, bodyY, frame, count) {
  // Deterministic sparkle positions based on frame number — twinkling effect
  const { bright, mid } = glowColors;
  const positions = [
    [16, 10], [48, 8], [12, 30], [52, 28],
    [20, 48], [44, 46], [10, 18], [54, 16],
  ];
  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const [sx, sy] = positions[(i + frame) % positions.length];
    const phase = (frame + i) % 3;
    if (phase === 0) {
      // Full sparkle: cross shape
      px(ctx, bright, sx,     sy + bodyY);
      px(ctx, mid,    sx - 1, sy + bodyY);
      px(ctx, mid,    sx + 1, sy + bodyY);
      px(ctx, mid,    sx,     sy - 1 + bodyY);
      px(ctx, mid,    sx,     sy + 1 + bodyY);
    } else if (phase === 1) {
      // Dimmed sparkle: just the center + top
      px(ctx, mid,    sx, sy + bodyY);
      px(ctx, bright, sx, sy - 1 + bodyY);
    }
    // phase 2: invisible (off cycle)
  }
}

// ─── Fairy head (chibi — large head, simple face) ────────────────────────────

function drawFairyHeadSouth(ctx, skinColors, hairColors, eyeKey) {
  // Chibi head: 18px wide × 18px tall (slightly smaller than human 20×21)
  // Centered at x=23-40, y=8-25
  const HX = 23, HY = 8, HW = 18, HH = 18;
  const outline = skinColors.outline;

  // ── Oval face shape ───────────────────────────────────────────────────────
  hLine(ctx, skinColors.base, HX + 3, HY,     HW - 6);   // top
  hLine(ctx, skinColors.base, HX + 1, HY + 1, HW - 2);
  fillRect(ctx, skinColors.base, HX,     HY + 2, HW,  HH - 5); // main face
  hLine(ctx, skinColors.base, HX + 1, HY + HH - 3, HW - 2);
  hLine(ctx, skinColors.base, HX + 3, HY + HH - 2, HW - 6);
  hLine(ctx, skinColors.base, HX + 4, HY + HH - 1, HW - 8);  // chin

  // ── Shading ───────────────────────────────────────────────────────────────
  // Highlight (upper-left)
  hLine(ctx, skinColors.highlight, HX + 2, HY + 2, 5);
  hLine(ctx, skinColors.highlight, HX + 2, HY + 3, 4);
  // Shadow (right side)
  vLine(ctx, skinColors.shadow, HX + HW - 3, HY + 3, 8);
  vLine(ctx, skinColors.shadow, HX + HW - 2, HY + 2, 10);
  // Chin underside
  hLine(ctx, skinColors.shadow, HX + 3, HY + HH - 3, HW - 6);
  hLine(ctx, skinColors.shadow, HX + 4, HY + HH - 1, HW - 8);

  // ── Outline ───────────────────────────────────────────────────────────────
  // Top arc
  px(ctx, outline, HX + 2, HY);
  px(ctx, outline, HX + 3, HY - 1); px(ctx, outline, HX + HW - 4, HY - 1);
  px(ctx, outline, HX + HW - 3, HY);
  // Sides
  vLine(ctx, outline, HX - 1, HY + 2, HH - 4);
  vLine(ctx, outline, HX + HW, HY + 2, HH - 4);
  // Bottom / chin
  px(ctx, outline, HX + 2, HY + HH - 2);
  px(ctx, outline, HX + 4, HY + HH);
  px(ctx, outline, HX + HW - 5, HY + HH);
  px(ctx, outline, HX + HW - 3, HY + HH - 2);

  // ── Eyes: large chibi eyes ────────────────────────────────────────────────
  // Chibi eyes are bigger relative to face. Left eye: x=25-28, right: x=35-38, y=14-16.
  const eyeColors = Colors.EYE_COLORS[eyeKey] || Colors.EYE_COLORS.blue;
  const eyeY = HY + 7;

  // Left eye (3×3)
  fillRect(ctx, eyeColors.lash,  HX + 3, eyeY,     3, 1);  // upper lash
  fillRect(ctx, eyeColors.iris,  HX + 3, eyeY + 1, 3, 2);  // iris fill
  px(ctx, eyeColors.pupil, HX + 4, eyeY + 1);               // pupil
  px(ctx, '#FFFFFF',       HX + 3, eyeY + 1);               // shine (upper-left)
  px(ctx, eyeColors.lash,  HX + 4, eyeY + 3);               // lower lash center

  // Right eye (3×3)
  fillRect(ctx, eyeColors.lash,  HX + HW - 6, eyeY,     3, 1);
  fillRect(ctx, eyeColors.iris,  HX + HW - 6, eyeY + 1, 3, 2);
  px(ctx, eyeColors.pupil, HX + HW - 5, eyeY + 1);
  px(ctx, '#FFFFFF',       HX + HW - 4, eyeY + 1);         // shine (upper-right for right eye)
  px(ctx, eyeColors.lash,  HX + HW - 5, eyeY + 3);

  // ── Cheek blush ───────────────────────────────────────────────────────────
  px(ctx, skinColors.highlight, HX + 2, eyeY + 4);
  px(ctx, skinColors.highlight, HX + 3, eyeY + 4);
  px(ctx, skinColors.highlight, HX + HW - 4, eyeY + 4);
  px(ctx, skinColors.highlight, HX + HW - 3, eyeY + 4);

  // ── Tiny nose and smile ───────────────────────────────────────────────────
  px(ctx, skinColors.shadow, HX + 8,  eyeY + 5);
  px(ctx, skinColors.shadow, HX + 9,  eyeY + 5);
  // Smile: short curved line
  px(ctx, skinColors.shadow, HX + 6,  eyeY + 7);
  hLine(ctx, skinColors.shadow, HX + 7, eyeY + 8, 4);
  px(ctx, skinColors.shadow, HX + 11, eyeY + 7);

  // ── Hair: simple cap with highlight ──────────────────────────────────────
  fillRect(ctx, hairColors.base, HX, HY - 2, HW, 5);  // hair cap
  // Round the corners
  px(ctx, hairColors.shadow, HX,       HY - 2);
  px(ctx, hairColors.shadow, HX + HW - 1, HY - 2);
  // Highlight arc (top of cap)
  hLine(ctx, hairColors.highlight, HX + 3, HY - 2, HW - 8);
  hLine(ctx, hairColors.highlight, HX + 2, HY - 1, HW - 7);
  // Single bright crown accent
  px(ctx, hairColors.highlight, HX + HW / 2 - 1, HY - 2);
  // Shadow at hairline
  hLine(ctx, hairColors.shadow, HX, HY + 2, HW);
  // Side locks (tiny ear tufts)
  pixel(ctx, hairColors.base, HX - 1, HY + 2);
  pixel(ctx, hairColors.base, HX - 1, HY + 3);
  pixel(ctx, hairColors.base, HX + HW, HY + 2);
  pixel(ctx, hairColors.base, HX + HW, HY + 3);
  // Outline top of hair
  hLine(ctx, outline, HX + 1, HY - 3, HW - 2);
}

// ─── Fairy body (chibi proportions) ──────────────────────────────────────────

function drawFairyBodySouth(ctx, skinColors, dressColors, bodyY) {
  // Torso: x=26-37 (12px wide), y=27+bodyY to 37+bodyY (11px tall)
  const tx = 26, ty = 27 + bodyY, tw = 12, th = 11;

  // Dress/tunic covers torso — rounded skirt flares out below
  fillRect(ctx, dressColors.base, tx, ty, tw, th);
  // Highlight (left side)
  vLine(ctx, dressColors.highlight, tx + 1, ty + 1, th - 2);
  px(ctx, dressColors.highlight, tx + 2, ty);
  // Shadow (right side)
  vLine(ctx, dressColors.shadow, tx + tw - 2, ty + 1, th - 2);
  vLine(ctx, dressColors.shadow, tx + tw - 1, ty + 2, th - 4);
  // Center chest highlight
  vLine(ctx, dressColors.highlight, tx + 5, ty + 1, 3);

  // Skirt flare (wider at bottom, rows 38-47)
  for (let row = 0; row < 10; row++) {
    const t   = row / 9;
    const sx  = Math.round(tx - t * 4);
    const sw  = Math.round(tw + t * 8);
    hLine(ctx, dressColors.base, sx, ty + th + row, sw);
    // Shading on skirt
    px(ctx, dressColors.highlight, sx + 2, ty + th + row);
    px(ctx, dressColors.shadow,    sx + sw - 3, ty + th + row);
    px(ctx, dressColors.shadow,    sx + sw - 2, ty + th + row);
    // Skirt outline sides
    px(ctx, dressColors.outline || skinColors.outline, sx - 1, ty + th + row);
    px(ctx, dressColors.outline || skinColors.outline, sx + sw, ty + th + row);
  }
  // Skirt hem bottom line
  hLine(ctx, dressColors.shadow, tx - 5, ty + th + 10, tw + 10);

  // Tiny visible feet below skirt
  const footY = ty + th + 12;
  px(ctx, skinColors.base,    29, footY);
  px(ctx, skinColors.shadow,  29, footY + 1);
  px(ctx, skinColors.base,    35, footY);
  px(ctx, skinColors.shadow,  35, footY + 1);

  // Outline torso top
  hLine(ctx, dressColors.outline || skinColors.outline, tx, ty, tw);
}

function drawFairyArmsSouth(ctx, skinColors, dressColors, lArmDY, rArmDY, bodyY) {
  // Small arms hanging at sides of torso
  const ty = 27 + bodyY;
  // Left arm
  const lax = 22, lay = ty + 2 + lArmDY;
  vLine(ctx, skinColors.base, lax, lay, 7);
  px(ctx, skinColors.highlight, lax, lay);
  px(ctx, skinColors.shadow, lax, lay + 6);
  // Tiny hand
  fillRect(ctx, skinColors.base, lax - 1, lay + 6, 3, 3);
  px(ctx, skinColors.shadow, lax - 1, lay + 8);
  px(ctx, skinColors.shadow, lax + 1, lay + 8);

  // Right arm
  const rax = 42, ray = ty + 2 + rArmDY;
  vLine(ctx, skinColors.base, rax, ray, 7);
  px(ctx, skinColors.highlight, rax, ray);
  px(ctx, skinColors.shadow, rax, ray + 6);
  // Tiny hand
  fillRect(ctx, skinColors.base, rax - 1, ray + 6, 3, 3);
  px(ctx, skinColors.shadow, rax - 1, ray + 8);
  px(ctx, skinColors.shadow, rax + 1, ray + 8);

  // Sleeve puffs at shoulder attachment
  fillRect(ctx, dressColors.base, lax - 1, ty, 4, 4);
  px(ctx, dressColors.highlight, lax - 1, ty);
  fillRect(ctx, dressColors.base, rax - 2, ty, 4, 4);
  px(ctx, dressColors.highlight, rax + 1, ty);
}

// ─── West (side) view ────────────────────────────────────────────────────────

function drawFairySideView(ctx, colors, offsets, facing) {
  const { bodyY = 0, leftLegFwd = 0, rightLegFwd = 0,
          leftArmFwd = 0, rightArmFwd = 0, headBob = 0 } = offsets;
  const by = bodyY;

  // Determine wing spread from leg forward values (reuse as flap signal)
  const flapPhase = (Math.abs(leftLegFwd) > 3) ? 1 : 0;

  // Background glow
  drawGlowHalo(ctx, colors.glow, 30, 32 + by, 18);

  // Single visible wing (profile: only one side shows)
  const wc = colors.wing;
  const wy = 16 + by;
  const spreadH = flapPhase === 0 ? 14 : 9;
  for (let dy = -5; dy <= 5; dy++) {
    const t  = 1 - Math.abs(dy) / 5;
    const wx = Math.round(spreadH * t);
    if (wx > 0) hLine(ctx, wc.inner, 18 - wx, wy + dy, wx);
  }
  hLine(ctx, wc.vein, 18 - spreadH, wy, spreadH);
  for (let dy = -5; dy <= 5; dy++) {
    const t = 1 - Math.abs(dy) / 5;
    px(ctx, wc.outer, 18 - Math.round(spreadH * t), wy + dy);
  }
  px(ctx, wc.shimmer, 18 - spreadH + 1, wy - 1);
  // Lower wing
  for (let dy = 0; dy <= 8; dy++) {
    const t = 1 - dy / 8;
    const wx = Math.round(spreadH * 0.6 * t);
    if (wx > 0) hLine(ctx, wc.inner, 18 - wx, wy + 6 + dy, wx);
  }

  // Profile body
  const tx = 22, ty = 27 + by;
  // Head (side) — simple oval
  const skinC = colors.skin;
  fillRect(ctx, skinC.base, 20, 8 + by, 12, 16);
  hLine(ctx, skinC.highlight, 21, 9 + by, 4);
  vLine(ctx, skinC.shadow, 30, 10 + by, 10);
  // Hair
  fillRect(ctx, colors.hair.base, 20, 6 + by, 12, 7);
  hLine(ctx, colors.hair.highlight, 22, 6 + by, 7);
  px(ctx, skinC.shadow, 19, 12 + by); // ear
  // Profile eye
  px(ctx, Colors.EYE_COLORS.blue.iris,  20, 14 + by);
  px(ctx, Colors.EYE_COLORS.blue.pupil, 20, 15 + by);
  // Torso
  fillRect(ctx, colors.dress.base, tx, ty, 10, 10);
  vLine(ctx, colors.dress.highlight, tx + 1, ty + 1, 8);
  vLine(ctx, colors.dress.shadow,    tx + 8, ty + 1, 8);
  // Arm (front)
  const fArmDX = facing === 'west' ? -Math.round(leftArmFwd * 0.6) : Math.round(rightArmFwd * 0.6);
  vLine(ctx, skinC.base, tx + fArmDX + 1, ty + 3, 8);
  // Skirt
  for (let row = 0; row < 10; row++) {
    hLine(ctx, colors.dress.base, tx - row / 3, ty + 10 + row, 10 + row / 2);
  }
}

// ─── Main generateFrame ───────────────────────────────────────────────────────

function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);

  const off = frameOffset;
  const by  = off.bodyY || 0;

  // Wing flap phase: use abs(leftLegFwd) as wing activity signal
  // (0 = resting, 1-3 = half, 4+ = full flap)
  const legAbs  = Math.max(Math.abs(off.leftLegFwd || 0), Math.abs(off.rightLegFwd || 0));
  const flapPhase = legAbs >= 4 ? 0 : legAbs >= 2 ? 1 : 2;

  // Is this an attack animation? If so, add extra sparkles
  const isAttack  = animationName.startsWith('attack');
  // Frame index within animation for sparkle cycling (use leftArmFwd as proxy)
  const frameIdx  = Math.abs(off.leftArmFwd || 0);

  const wingStyle = config.wingStyle || 'butterfly';

  // Determine direction
  let direction = 'south';
  if (animationName.includes('north')) direction = 'north';
  else if (animationName.includes('west')) direction = 'west';
  else if (animationName.includes('east')) direction = 'east';

  if (direction === 'east') {
    // Draw west, then mirror
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
  const by = off.bodyY || 0;

  if (direction === 'west' || direction === 'north') {
    drawFairySideView(ctx, colors, off, direction);
    if (isAttack) drawSparkles(ctx, colors.glow, by, frameIdx, 5);
    return;
  }

  // ── South (and idle) ─────────────────────────────────────────────────────

  // 1. Background ambient glow (drawn first, behind everything)
  drawGlowHalo(ctx, colors.glow, 32, 33 + by, 22);

  // 2. Wings (behind body)
  if (wingStyle === 'dragonfly') {
    drawWingsDragonflyS(ctx, colors.wing, by, flapPhase);
  } else {
    drawWingsButterflySouth(ctx, colors.wing, by, flapPhase);
  }

  // 3. Arms
  const lArmDY = Math.round((off.leftArmFwd  || 0) * 0.4);
  const rArmDY = Math.round((off.rightArmFwd || 0) * 0.4);
  drawFairyArmsSouth(ctx, colors.skin, colors.dress, lArmDY, rArmDY, by);

  // 4. Body
  drawFairyBodySouth(ctx, colors.skin, colors.dress, by);

  // 5. Head (on top of body)
  ctx.save();
  ctx.translate(0, off.headBob || 0);
  drawFairyHeadSouth(ctx, colors.skin, colors.hair, config.eyes || 'blue');
  ctx.restore();

  // 6. Sparkles (attack frames get more, idle gets a few)
  const sparkleCount = isAttack ? 6 : 2;
  drawSparkles(ctx, colors.glow, by, frameIdx, sparkleCount);
}

module.exports = { generateFrame };
