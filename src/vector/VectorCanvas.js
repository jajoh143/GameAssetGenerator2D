'use strict';

/**
 * VectorCanvas — drawing primitives for the vector character renderer.
 *
 * Unlike the pixel pipeline (Core/Canvas.js) which leans on fillRect and
 * single-pixel ops, vector drawing uses Path2D primitives, smooth strokes,
 * linear/radial gradients, and antialiasing.
 *
 * Notes from the research pass:
 *   - keep anchor counts low: simple capsules / ovals + a few cubic curves
 *     read as cleaner art and animate faster than a dense path mesh.
 *   - 3-stop linear gradients (highlight → base → shadow) on each body part
 *     gives a "screen-printed cartoon" look without per-pixel shading.
 *   - a thin dark stroke acts as the vector equivalent of the 1px outline
 *     around every pixel-art body part — it preserves silhouette readability.
 */

const { createCanvas } = require('@napi-rs/canvas');

function makeCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';
  return { canvas, ctx };
}

function clear(ctx, w, h) { ctx.clearRect(0, 0, w, h); }

// ---------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------

/**
 * Build a 3-stop vertical gradient on the given rect.
 * stops: { highlight, base, shadow }
 */
function vGradient(ctx, x, y, w, h, palette) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0,    palette.highlight);
  g.addColorStop(0.45, palette.base);
  g.addColorStop(1,    palette.shadow || palette.base);
  return g;
}

/**
 * Side-light gradient (used on torso & faces — light comes from top-left).
 */
function diagGradient(ctx, x, y, w, h, palette) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0,    palette.highlight);
  g.addColorStop(0.5,  palette.base);
  g.addColorStop(1,    palette.shadow || palette.base);
  return g;
}

/**
 * Soft radial highlight (used for cheeks, glow, wing iridescence).
 */
function radial(ctx, cx, cy, r, inner, outer) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  return g;
}

// ---------------------------------------------------------------------------
// Shape primitives — all return after stroking + filling.
// ---------------------------------------------------------------------------

/** Filled + stroked oval. */
function oval(ctx, cx, cy, rx, ry, fill, stroke, lineWidth = 1.2) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/** Pill / capsule shape (rounded rectangle with semi-circular ends). */
function capsule(ctx, x, y, w, h, fill, stroke, lineWidth = 1.2) {
  const r = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

/** Rounded rectangle. */
function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1.2) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

/**
 * Tapered limb segment from (x1,y1) → (x2,y2). r1/r2 are the radii at each end.
 * Drawn as a quadrilateral capped with arcs — used for arms, legs, tails.
 */
function limb(ctx, x1, y1, r1, x2, y2, r2, fill, stroke, lineWidth = 1.2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;     // perpendicular unit vector

  ctx.beginPath();
  // Start cap (half-circle around (x1,y1))
  const startAngle = Math.atan2(ny, nx);
  ctx.arc(x1, y1, r1, startAngle, startAngle + Math.PI);
  // Side line back to (x2,y2) on the negative side
  ctx.lineTo(x2 - nx * r2, y2 - ny * r2);
  // End cap
  const endAngle = Math.atan2(-ny, -nx);
  ctx.arc(x2, y2, r2, endAngle, endAngle + Math.PI);
  // Close
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

/**
 * Smooth closed path through an array of [x,y] points using cubic spline.
 * Tension controls how tight the curves are.
 */
function smoothBlob(ctx, points, fill, stroke, lineWidth = 1.2, tension = 0.5) {
  if (points.length < 3) return;
  const n = points.length;
  ctx.beginPath();
  // Catmull-Rom → cubic Bezier conversion
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    if (i === 0) ctx.moveTo(p1[0], p1[1]);

    const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

/**
 * Soft drop shadow ellipse on the ground (semi-transparent black).
 */
function groundShadow(ctx, cx, cy, rx, ry, alpha = 0.35) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0,   `rgba(0,0,0,${alpha})`);
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Lighting helpers — used by body-part renderers to add depth.
//
// All renderers assume a single key light coming from the top-left at
// ~45°. Form shadows therefore live on the bottom-right of every body part;
// rim light lives along the top-left edge; cast shadows fall down-and-right.
// ---------------------------------------------------------------------------

/**
 * Apply a soft "core shadow" on an oval — a darker crescent on the bottom-
 * right that defines the terminator line between lit and shadowed sides.
 * Drawn additively over an already-painted body part.
 */
function coreShadowOval(ctx, cx, cy, rx, ry, shadowColor, strength = 0.45) {
  ctx.save();
  ctx.globalAlpha = strength;
  // The shadow blob is offset toward the bottom-right, smaller than the
  // oval, with a soft radial falloff.
  const g = ctx.createRadialGradient(
    cx + rx * 0.55, cy + ry * 0.40, 0,
    cx + rx * 0.55, cy + ry * 0.40, Math.max(rx, ry) * 1.05,
  );
  g.addColorStop(0,   shadowColor);
  g.addColorStop(0.5, shadowColor);
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A soft cast-shadow ellipse — used to drop the head's shadow onto the neck,
 * the chin onto the chest, the hair onto the forehead, etc.
 *
 *   cx,cy: shadow center
 *   rx,ry: ellipse radii
 *   alpha: opacity (0..1)
 */
function castShadow(ctx, cx, cy, rx, ry, alpha = 0.35, color = '#000') {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0,   color);
  g.addColorStop(0.55, hexAlpha(color, 0.7));
  g.addColorStop(1,   hexAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Rim highlight — a thin bright crescent along the top-left edge of an
 * oval. Used on hair, torso, head, limbs to suggest a back-light or
 * reflected light bouncing off the back surface.
 */
function rimLight(ctx, cx, cy, rx, ry, color = '#fff', strength = 0.30) {
  ctx.save();
  ctx.globalAlpha = strength;
  const g = ctx.createRadialGradient(
    cx - rx * 0.55, cy - ry * 0.55, Math.max(rx, ry) * 0.65,
    cx - rx * 0.55, cy - ry * 0.55, Math.max(rx, ry) * 1.05,
  );
  g.addColorStop(0,   hexAlpha(color, 0));
  g.addColorStop(0.7, color);
  g.addColorStop(1,   hexAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Ambient-occlusion strip — a short, soft dark line at the seam where two
 * parts meet (under jaw, under arm, in waist crease). Pass two endpoints.
 */
function aoLine(ctx, x1, y1, x2, y2, thickness, alpha = 0.4, color = '#000') {
  ctx.save();
  ctx.globalAlpha = alpha;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1 + nx * thickness * 0.5, y1 + ny * thickness * 0.5);
  ctx.lineTo(x2 + nx * thickness * 0.5, y2 + ny * thickness * 0.5);
  ctx.lineTo(x2 - nx * thickness * 0.5, y2 - ny * thickness * 0.5);
  ctx.lineTo(x1 - nx * thickness * 0.5, y1 - ny * thickness * 0.5);
  ctx.closePath();
  const g = ctx.createLinearGradient(
    x1 + nx * thickness, y1 + ny * thickness,
    x1 - nx * thickness, y1 - ny * thickness,
  );
  g.addColorStop(0,   hexAlpha(color, 0));
  g.addColorStop(0.5, color);
  g.addColorStop(1,   hexAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/**
 * Convert a #rrggbb hex to rgba(...) with the given alpha. Tolerates
 * 'rgba(...)' input by passing through.
 */
function hexAlpha(hex, a) {
  if (!hex) return `rgba(0,0,0,${a})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(0,0,0,${a})`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Mirror canvas horizontally — used for east-facing frames.
 */
function mirrorCanvasH(srcCanvas) {
  const { canvas, ctx } = makeCanvas(srcCanvas.width, srcCanvas.height);
  ctx.save();
  ctx.translate(srcCanvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(srcCanvas, 0, 0);
  ctx.restore();
  return canvas;
}

/** Copy a canvas onto another at (dx, dy). */
function blit(dstCtx, srcCanvas, dx, dy) {
  dstCtx.drawImage(srcCanvas, dx, dy);
}

/**
 * Bilinearly scale a canvas (smooth interpolation, unlike pixel art's
 * nearest-neighbor). Used to upscale vector frames for the spritesheet
 * output without re-rasterizing every path.
 */
function scaleCanvas(srcCanvas, scale) {
  const dstW = Math.round(srcCanvas.width * scale);
  const dstH = Math.round(srcCanvas.height * scale);
  const { canvas, ctx } = makeCanvas(dstW, dstH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, 0, 0, dstW, dstH);
  return canvas;
}

module.exports = {
  makeCanvas,
  clear,
  vGradient,
  diagGradient,
  radial,
  oval,
  capsule,
  roundRect,
  limb,
  smoothBlob,
  groundShadow,
  coreShadowOval,
  castShadow,
  rimLight,
  aoLine,
  hexAlpha,
  mirrorCanvasH,
  blit,
  scaleCanvas,
};
