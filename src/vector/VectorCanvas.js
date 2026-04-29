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
  mirrorCanvasH,
  blit,
  scaleCanvas,
};
