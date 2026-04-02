'use strict';

const { createCanvas } = require('@napi-rs/canvas');

/**
 * Creates a canvas of given dimensions.
 * Returns { canvas, ctx }.
 */
function makeCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

/**
 * Fill a rectangle on ctx with a CSS color string.
 * Wrapper that sets fillStyle then calls fillRect.
 */
function fillRect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/**
 * Draw a single pixel.
 */
function pixel(ctx, color, x, y) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/**
 * Draw a horizontal line of pixels.
 */
function hLine(ctx, color, x, y, length) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, length, 1);
}

/**
 * Draw a vertical line of pixels.
 */
function vLine(ctx, color, x, y, length) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, length);
}

/**
 * Draw a 1px border around a rectangle (outline only, no fill).
 */
function outlineRect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  // top
  ctx.fillRect(x, y, w, 1);
  // bottom
  ctx.fillRect(x, y + h - 1, w, 1);
  // left
  ctx.fillRect(x, y + 1, 1, h - 2);
  // right
  ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
}

/**
 * Draw a filled rounded rectangle approximation using fillRect blocks.
 * radius = number of corner pixels to skip.
 */
function roundRect(ctx, color, x, y, w, h, r) {
  r = Math.min(r, Math.floor(w / 2), Math.floor(h / 2));
  ctx.fillStyle = color;
  // main body
  ctx.fillRect(x + r, y, w - r * 2, h);
  ctx.fillRect(x, y + r, r, h - r * 2);
  ctx.fillRect(x + w - r, y + r, r, h - r * 2);
}

/**
 * Draw a filled ellipse using scanline approach.
 */
function fillEllipse(ctx, color, cx, cy, rx, ry) {
  ctx.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry)));
    ctx.fillRect(cx - dx, cy + dy, dx * 2, 1);
  }
}

/**
 * Mirror the contents of srcCanvas horizontally into a new canvas.
 */
function mirrorCanvasH(srcCanvas) {
  const { canvas: dst, ctx: dstCtx } = makeCanvas(srcCanvas.width, srcCanvas.height);
  dstCtx.save();
  dstCtx.translate(srcCanvas.width, 0);
  dstCtx.scale(-1, 1);
  dstCtx.drawImage(srcCanvas, 0, 0);
  dstCtx.restore();
  return dst;
}

/**
 * Copy srcCanvas onto dstCtx at (dx, dy).
 */
function blit(dstCtx, srcCanvas, dx, dy) {
  dstCtx.drawImage(srcCanvas, dx, dy);
}

/**
 * Clear a canvas to transparent.
 */
function clear(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

module.exports = {
  makeCanvas,
  fillRect,
  pixel,
  hLine,
  vLine,
  outlineRect,
  roundRect,
  fillEllipse,
  mirrorCanvasH,
  blit,
  clear,
};
