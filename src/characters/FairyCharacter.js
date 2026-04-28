'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, fillEllipse, mirrorCanvasH, clear } = require('../core/Canvas');
const Colors = require('../core/Colors');
const { resolveConfig } = require('./CharacterConfig');
const { drawGroundShadow } = require('./BaseCharacter');
const {
  drawSouth: humanSouth,
  drawNorth: humanNorth,
  drawWest:  humanWest,
  resolveColors: humanColors,
  getYAnchors,
} = require('./HumanCharacter');

const FRAME_W = 96;
const FRAME_H = 96;

// ─── Length / size tables ───────────────────────────────────────────────────
// Wing scales bumped up across the board so even the smallest wings feel
// substantial against a tiny pixie body — D&D fairies/pixies have wings
// that visibly span well past their shoulders.
const WING_SCALES  = { small: 1.0, medium: 1.4, large: 1.85 };
const GLOW_RADII   = { subtle: 18, medium: 28, bright: 40 };

// ─── Color resolver ────────────────────────────────────────────────────────
function resolveColors(config) {
  const base = humanColors(config);
  base.fairySkin = Colors.FAIRY_SKIN[config.fairySkin] || Colors.FAIRY_SKIN.peach;
  base.wing      = Colors.FAIRY_WING[config.wingColor] || Colors.FAIRY_WING.crystal;
  base.dress     = Colors.FAIRY_DRESS[config.fairyDress] || Colors.FAIRY_DRESS.petal_pink;
  base.glow      = Colors.FAIRY_GLOW[config.glowColor] || Colors.FAIRY_GLOW.golden;
  return base;
}

// ─── Glow halo behind the fairy ─────────────────────────────────────────────
// Soft ellipse drawn before the body so it reads as a magical aura. We use
// alpha-suffixed hex colours so the halo blends with whatever's behind.
function drawGlowHalo(ctx, glowColors, cx, cy, radius) {
  const { bright, mid, soft } = glowColors;
  // Outer faint ring (very translucent)
  fillEllipse(ctx, soft + '38', cx, cy, radius, Math.round(radius * 0.7));
  // Inner brighter glow
  fillEllipse(ctx, mid + '40',  cx, cy, Math.round(radius * 0.6), Math.round(radius * 0.45));
  // Tight central pop
  fillEllipse(ctx, bright + '40', cx, cy, Math.round(radius * 0.3), Math.round(radius * 0.22));
}

// ─── Sparkles (small star shapes around the fairy) ──────────────────────────
function drawSparkles(ctx, glowColors, bodyY, frame, count) {
  const { bright, mid } = glowColors;
  const positions = [
    [22, 18], [74, 14], [16, 50], [80, 46],
    [28, 78], [68, 74], [12, 30], [82, 26],
  ];
  const frameInt = Math.floor(Math.abs(frame));
  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const [sx, sy] = positions[(i + frameInt) % positions.length];
    const phase = (frameInt + i) % 3;
    const yy = sy + bodyY;
    if (phase === 0) {
      // 4-point star
      pixel(ctx, bright, sx,     yy);
      pixel(ctx, mid,    sx - 1, yy);
      pixel(ctx, mid,    sx + 1, yy);
      pixel(ctx, mid,    sx,     yy - 1);
      pixel(ctx, mid,    sx,     yy + 1);
    } else if (phase === 1) {
      // Twin glint
      pixel(ctx, mid,    sx, yy);
      pixel(ctx, bright, sx, yy - 1);
    }
    // phase 2 = invisible (sparkle off)
  }
}

// ─── Pointed elven/fairy ears overlay ───────────────────────────────────────
// Drawn AFTER the human head so the pointed tip extends past the silhouette.
// Head silhouette has cheek/jaw outline at x=21 (left) and x=42 (right) at y=42.
function drawPointedEarsSouth(ctx, skinColors, headBobY) {
  const sh = skinColors.shadow;
  const hi = skinColors.highlight;
  const ba = skinColors.base;
  const ol = skinColors.outline;
  // Left ear: a 3-row triangle protruding outward at the temple
  // Anchor at (21, 41) — protrudes to (18, 38)
  const ly = 41 + headBobY;
  pixel(ctx, ba, 19, ly - 2);
  pixel(ctx, ba, 20, ly - 2);
  pixel(ctx, ba, 19, ly - 1);
  pixel(ctx, ba, 20, ly - 1);
  pixel(ctx, ba, 18, ly);
  pixel(ctx, ba, 19, ly);
  pixel(ctx, ba, 20, ly);
  // Inner shadow (where ear meets head)
  pixel(ctx, sh, 20, ly - 1);
  pixel(ctx, sh, 20, ly);
  // Lit upper edge
  pixel(ctx, hi, 19, ly - 2);
  // Outline tip
  pixel(ctx, ol, 18, ly - 2);
  pixel(ctx, ol, 18, ly - 1);
  pixel(ctx, ol, 17, ly);
  pixel(ctx, ol, 18, ly + 1);
  pixel(ctx, ol, 19, ly + 1);

  // Right ear: mirror at x=43-46
  pixel(ctx, ba, 43, ly - 2);
  pixel(ctx, ba, 44, ly - 2);
  pixel(ctx, ba, 43, ly - 1);
  pixel(ctx, ba, 44, ly - 1);
  pixel(ctx, ba, 43, ly);
  pixel(ctx, ba, 44, ly);
  pixel(ctx, ba, 45, ly);
  // Inner shadow
  pixel(ctx, sh, 43, ly - 1);
  pixel(ctx, sh, 43, ly);
  // Lit upper edge — slight highlight on the front face
  pixel(ctx, hi, 44, ly - 2);
  // Outline tip
  pixel(ctx, ol, 45, ly - 2);
  pixel(ctx, ol, 45, ly - 1);
  pixel(ctx, ol, 46, ly);
  pixel(ctx, ol, 45, ly + 1);
  pixel(ctx, ol, 44, ly + 1);
}

// ─── Wings (south view, behind body) ─────────────────────────────────────────
// Two-pair butterfly wings: an upper wing curving up from each shoulder,
// and a smaller lower wing trailing down. Wing scale controls overall span.
function drawWingsButterflySouth(ctx, wingColors, bodyY, flapPhase, scale) {
  const { outer, inner, vein, shimmer, outline } = wingColors;
  const wy = 49 + bodyY;          // wing root y (mid-back, behind torso)
  const baseSpread = 18 * scale;  // horizontal extent
  const vertExt    = 18 * scale;  // vertical extent
  // Flap phase shrinks horizontal spread for animation
  const spread = flapPhase === 0 ? baseSpread : flapPhase === 1 ? baseSpread * 0.75 : baseSpread * 0.55;

  // Wing roots — sit behind the upper torso (cx=32, but wings emerge wider).
  const lRootX = 30, rRootX = 34;

  // Upper wings — fill via scanline (top-down ellipse half)
  for (let dy = -vertExt; dy <= vertExt * 0.6; dy++) {
    // Width fades quadratically from middle outward
    const norm = Math.abs(dy) / vertExt;
    const w = Math.max(0, Math.round(spread * (1 - norm * norm)));
    if (w <= 0) continue;
    const yy = wy + dy;
    // Left upper wing: from lRootX to lRootX - w
    hLine(ctx, inner, lRootX - w, yy, w);
    // Right upper wing: from rRootX to rRootX + w
    hLine(ctx, inner, rRootX,     yy, w);
  }

  // Outer rim (top arc) of upper wings
  for (let dx = 1; dx <= spread; dx++) {
    const t  = dx / spread;
    // Top arc: peaks at half-spread
    const ty = wy - Math.round(vertExt * Math.sin(t * Math.PI * 0.95));
    pixel(ctx, outer, lRootX - dx, ty);
    pixel(ctx, outer, rRootX + dx, ty);
  }

  // Vein lines — three diagonals radiating from each wing root
  for (let i = 1; i <= 3; i++) {
    const vx = Math.round(spread * i / 4);
    const vy = Math.round(vertExt * 0.7 * i / 4);
    hLine(ctx, vein, lRootX - vx - 2, wy - vy, 4);
    hLine(ctx, vein, rRootX + vx - 1, wy - vy, 4);
  }
  // Shimmer glints
  pixel(ctx, shimmer, Math.round(lRootX - spread * 0.55), wy - Math.round(vertExt * 0.4));
  pixel(ctx, shimmer, Math.round(rRootX + spread * 0.55), wy - Math.round(vertExt * 0.4));

  // Outline — top tip and bottom tip of each wing
  pixel(ctx, outline, lRootX, wy - Math.round(vertExt));
  pixel(ctx, outline, rRootX, wy - Math.round(vertExt));

  // Lower wings — smaller teardrop trailing below
  const lowerSpread = Math.round(spread * 0.55);
  const lowerExt    = Math.round(vertExt * 0.55);
  for (let dy = 0; dy <= lowerExt; dy++) {
    const norm = dy / lowerExt;
    const w = Math.round(lowerSpread * (1 - norm * 0.6));
    if (w <= 0) continue;
    const yy = wy + Math.round(vertExt * 0.4) + dy;
    hLine(ctx, inner, lRootX - w, yy, w);
    hLine(ctx, inner, rRootX,     yy, w);
  }
  // Shimmers on lower wings
  pixel(ctx, shimmer, lRootX - Math.round(lowerSpread * 0.5), wy + Math.round(vertExt * 0.7));
  pixel(ctx, shimmer, rRootX + Math.round(lowerSpread * 0.5), wy + Math.round(vertExt * 0.7));
}

// ─── Wings (south view, dragonfly variant) ──────────────────────────────────
// Four narrow elongated wings, two upper and two lower, with iridescent
// translucent fill and clear vein lines.
function drawWingsDragonflyS(ctx, wingColors, bodyY, flapPhase, scale) {
  const { outer, inner, vein, shimmer } = wingColors;
  const wy = 49 + bodyY;
  const baseLen = 22 * scale;
  const len = flapPhase === 0 ? baseLen : flapPhase === 1 ? baseLen * 0.85 : baseLen * 0.7;
  const wingH = Math.max(2, Math.round(4 * scale));

  // Upper pair — narrow ellipse pointing outward and slightly up
  for (let i = 0; i < len; i++) {
    const t = i / Math.max(len - 1, 1);
    // Vertical taper: wider in middle
    const w = Math.max(1, Math.round(wingH * (1 - Math.pow(2 * t - 1, 2))));
    const ly = wy - Math.round(t * 4) - Math.floor(w / 2);
    // Left upper
    fillRect(ctx, inner, 30 - i - 1, ly, 1, w);
    // Right upper
    fillRect(ctx, inner, 34 + i, ly, 1, w);
  }
  // Lower pair — slightly shorter and below
  const lowerLen = len * 0.85;
  for (let i = 0; i < lowerLen; i++) {
    const t = i / Math.max(lowerLen - 1, 1);
    const w = Math.max(1, Math.round(wingH * (1 - Math.pow(2 * t - 1, 2))));
    const ly = wy + 6 - Math.round(t * 1) - Math.floor(w / 2);
    fillRect(ctx, inner, 30 - i - 1, ly, 1, w);
    fillRect(ctx, inner, 34 + i, ly, 1, w);
  }
  // Vein lines along centre of each wing
  for (let i = 0; i < len; i++) {
    const ly = wy - Math.round((i / Math.max(len - 1, 1)) * 4);
    pixel(ctx, vein, 30 - i - 1, ly);
    pixel(ctx, vein, 34 + i,     ly);
  }
  for (let i = 0; i < lowerLen; i++) {
    const ly = wy + 6 - Math.round((i / Math.max(lowerLen - 1, 1)) * 1);
    pixel(ctx, vein, 30 - i - 1, ly);
    pixel(ctx, vein, 34 + i,     ly);
  }
  // Outer tip caps
  pixel(ctx, outer, 30 - Math.round(len),     wy - 4);
  pixel(ctx, outer, 34 + Math.round(len),     wy - 4);
  pixel(ctx, outer, 30 - Math.round(lowerLen), wy + 5);
  pixel(ctx, outer, 34 + Math.round(lowerLen), wy + 5);
  // Shimmer at base
  pixel(ctx, shimmer, 29, wy - 1);
  pixel(ctx, shimmer, 35, wy - 1);
}

// ─── Wings (west / side view) ───────────────────────────────────────────────
// Single visible wing pair from the side — drawn behind the body.
function drawWingsWest(ctx, wingColors, wingStyle, bodyY, flapPhase, scale) {
  const { outer, inner, vein, shimmer } = wingColors;
  const wy = 49 + bodyY;
  // The visible wing extends backward (to the right in west view, since the
  // character faces left) from the back of the torso (~x=33).
  const baseSpread = 14 * scale;
  const spread = flapPhase === 0 ? baseSpread : flapPhase === 1 ? baseSpread * 0.8 : baseSpread * 0.6;
  if (wingStyle === 'dragonfly') {
    const len = Math.round(spread * 1.4);
    for (let i = 0; i < len; i++) {
      const t = i / Math.max(len - 1, 1);
      const w = Math.max(1, Math.round(3 * (1 - Math.pow(2 * t - 1, 2))));
      const ly = wy - 3 - Math.floor(w / 2);
      fillRect(ctx, inner, 33 + i, ly, 1, w);
    }
    // Lower wing
    for (let i = 0; i < len * 0.85; i++) {
      const t = i / Math.max(len - 1, 1);
      const w = Math.max(1, Math.round(3 * (1 - Math.pow(2 * t - 1, 2))));
      const ly = wy + 4 - Math.floor(w / 2);
      fillRect(ctx, inner, 33 + i, ly, 1, w);
    }
  } else {
    // Butterfly: half-ellipse extending backward
    for (let dy = -Math.round(10 * scale); dy <= Math.round(8 * scale); dy++) {
      const norm = Math.abs(dy) / Math.round(10 * scale);
      const w = Math.max(0, Math.round(spread * (1 - norm * norm)));
      if (w > 0) hLine(ctx, inner, 33, wy + dy, w);
    }
    // Outer rim
    for (let dx = 1; dx <= spread; dx++) {
      const t = dx / spread;
      const ty = wy - Math.round(10 * scale * Math.sin(t * Math.PI * 0.9));
      pixel(ctx, outer, 33 + dx, ty);
    }
    // Vein
    for (let i = 1; i <= 3; i++) {
      const vx = 33 + Math.round(spread * i / 4);
      const vy = wy - Math.round(7 * scale * i / 4);
      hLine(ctx, vein, vx - 1, vy, 3);
    }
    pixel(ctx, shimmer, 33 + Math.round(spread * 0.6), wy - Math.round(5 * scale));
  }
}

// ─── Pointed ear (west / side view) ─────────────────────────────────────────
function drawPointedEarWest(ctx, skinColors) {
  const ba = skinColors.base;
  const sh = skinColors.shadow;
  const ol = skinColors.outline;
  // Visible side ear: protrudes upward and slightly back from the temple
  // West-view temple is around (29, 35).
  pixel(ctx, ba, 28, 33);
  pixel(ctx, ba, 28, 34);
  pixel(ctx, ba, 27, 33);
  pixel(ctx, sh, 28, 32);
  pixel(ctx, ol, 27, 32);
  pixel(ctx, ol, 26, 33);
  pixel(ctx, ol, 27, 34);
}

// Levitation: fairies hover slightly off the ground using their wings.
// Raw offset is in 64px-frame units (the human renderer multiplies by 1.5
// when targeting the 96px frame). -2 → ~-3 px lift in the rendered frame —
// just enough to read as "floating" without pulling the body off-centre.
// (Larger values left the tiny pixie body too high in the frame.)
const FAIRY_LEVITATION_RAW = -2;

// Body horizontal centre in the 96px frame (used for centering the halo
// and any other body-relative effects). The torso draws at x=20..43, so
// the visible body centre is x=32 — NOT the canvas centre (x=48).
const BODY_CX = 32;

// ─── Frame generator ───────────────────────────────────────────────────────
function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  // Apply levitation by injecting it into the frame offset's bodyY before
  // we hand it to the human renderer. All other render effects use `by`
  // (the scaled, levitated y) so they move with the body. We also tell the
  // human renderer to skip its ground shadow — we draw our own at the true
  // ground line below the floating fairy.
  const off = Object.assign({}, frameOffset, {
    bodyY: (frameOffset.bodyY || 0) + FAIRY_LEVITATION_RAW,
    skipGroundShadow: true,
  });
  const by  = Math.round(off.bodyY * 1.5);
  const headBob = Math.round((off.headBob || 0) * 1.5);

  // Wing flap phase from leg/arm motion (closes wings during long strides)
  const legAbs   = Math.max(Math.abs(off.leftLegFwd || 0), Math.abs(off.rightLegFwd || 0));
  const flapPhase = legAbs >= 4 ? 0 : legAbs >= 2 ? 1 : 2;

  const isAttack  = animationName.startsWith('attack');
  const frameIdx  = Math.abs(off.leftArmFwd || 0);

  const wingStyle  = config.wingStyle || 'butterfly';
  const wingScale  = WING_SCALES[config.wingSize] || WING_SCALES.medium;
  const glowRadius = GLOW_RADII[config.glowIntensity] || GLOW_RADII.medium;

  let direction = 'south';
  if (animationName.includes('north')) direction = 'north';
  else if (animationName.includes('west')) direction = 'west';
  else if (animationName.includes('east')) direction = 'east';

  if (direction === 'east') {
    const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
    clear(tmpCtx, FRAME_W, FRAME_H);
    renderDirection(tmpCtx, config, colors, off, 'west',
      wingStyle, wingScale, glowRadius, flapPhase, by, headBob, isAttack, frameIdx);
    const mirrored = mirrorCanvasH(tmpC);
    ctx.drawImage(mirrored, 0, 0);
    return canvas;
  }

  renderDirection(ctx, config, colors, off, direction,
    wingStyle, wingScale, glowRadius, flapPhase, by, headBob, isAttack, frameIdx);
  return canvas;
}

function renderDirection(ctx, config, colors, off, direction,
                         wingStyle, wingScale, glowRadius, flapPhase,
                         by, headBob, isAttack, frameIdx) {
  // Height-aware Y shift: the human renderer translates the head/torso/etc
  // when config.height changes. All overlay layers (wings, halo, ears) live
  // in the canvas frame — they need the same shift to stay aligned with
  // the new body position. A SHORT fairy has neckY=60 instead of 50, so
  // headDeltaY = 60 - 50 = 10, and wings/halo/ears shift down by 10 px.
  const yA          = getYAnchors(config);
  const headDeltaY  = yA.neckY - 50;
  const ovBy        = by + headDeltaY;     // y offset for body-relative overlays

  // 1. Ground shadow at the TRUE ground line (y=94) — stays put as the
  //    fairy floats above it.
  const shadowCx = direction === 'west' ? 23 : 32;
  drawGroundShadow(ctx, shadowCx, 94, 14, 3);

  // 2. Glow halo — centered on the BODY (x=32, not canvas centre at x=48)
  //    and anchored around the upper torso/head so it wraps the fairy.
  drawGlowHalo(ctx, colors.glow, BODY_CX, 58 + ovBy, glowRadius);

  // 3. Wings (behind the body — drawn before the human renderer)
  if (direction === 'south') {
    if (wingStyle === 'dragonfly') {
      drawWingsDragonflyS(ctx, colors.wing, ovBy, flapPhase, wingScale);
    } else {
      drawWingsButterflySouth(ctx, colors.wing, ovBy, flapPhase, wingScale);
    }
  } else if (direction === 'west') {
    drawWingsWest(ctx, colors.wing, wingStyle, ovBy, flapPhase, wingScale);
  } else {
    if (wingStyle === 'dragonfly') {
      drawWingsDragonflyS(ctx, colors.wing, ovBy, flapPhase, wingScale * 0.7);
    } else {
      drawWingsButterflySouth(ctx, colors.wing, ovBy, flapPhase, wingScale * 0.7);
    }
  }

  // 4. Human body (with fairy skin + dress mapped via resolveColors)
  if (direction === 'south')      humanSouth(ctx, config, off);
  else if (direction === 'north') humanNorth(ctx, config, off);
  else                            humanWest(ctx, config, off);

  // 5. Pointed ears overlay (on top of head, follows head bob + height shift)
  if (direction === 'south') {
    drawPointedEarsSouth(ctx, colors.fairySkin, headBob + ovBy);
  } else if (direction === 'west') {
    ctx.save();
    ctx.translate(0, ovBy + headBob);
    drawPointedEarWest(ctx, colors.fairySkin);
    ctx.restore();
  }

  // 5. Sparkles (foreground)
  const sparkleCount = isAttack ? 6 : 2;
  drawSparkles(ctx, colors.glow, by, frameIdx, sparkleCount);
}

module.exports = { generateFrame };
