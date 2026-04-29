'use strict';

/**
 * VectorSpritesheet — composites 13 rows of vector frames into a single PNG.
 * Row layout matches the pixel pipeline (core/Spritesheet.js) so previews
 * can reuse the same animation row indices.
 */

const fs   = require('fs');
const path = require('path');
const { makeCanvas, blit, scaleCanvas } = require('./VectorCanvas');
const { FRAME_W, FRAME_H } = require('./VectorRig');

const ROWS = [
  { name: 'idle',               frameCount: 4 },
  { name: 'walk_south',         frameCount: 8 },
  { name: 'walk_west',          frameCount: 8 },
  { name: 'walk_north',         frameCount: 8 },
  { name: 'walk_east',          frameCount: 8 },
  { name: 'attack_swing_south', frameCount: 8 },
  { name: 'attack_swing_west',  frameCount: 8 },
  { name: 'attack_swing_north', frameCount: 8 },
  { name: 'attack_swing_east',  frameCount: 8 },
  { name: 'attack_shoot_south', frameCount: 6 },
  { name: 'attack_shoot_west',  frameCount: 6 },
  { name: 'attack_shoot_north', frameCount: 6 },
  { name: 'attack_shoot_east',  frameCount: 6 },
];

const SHEET_COLS = 8;
const SHEET_ROWS = ROWS.length;
const SHEET_W = SHEET_COLS * FRAME_W;
const SHEET_H = SHEET_ROWS * FRAME_H;

function buildSpritesheet(rowFrames) {
  // Detect actual frame size from the first available canvas (in case a
  // future variant resizes the frame for that single character).
  let frameW = FRAME_W, frameH = FRAME_H;
  outer: for (const frames of rowFrames) {
    for (const fc of frames) {
      if (fc) { frameW = fc.width; frameH = fc.height; break outer; }
    }
  }
  const sheetW = SHEET_COLS * frameW;
  const sheetH = ROWS.length * frameH;
  const { canvas, ctx } = makeCanvas(sheetW, sheetH);
  ctx.clearRect(0, 0, sheetW, sheetH);

  for (let row = 0; row < ROWS.length; row++) {
    const frames = rowFrames[row] || [];
    for (let col = 0; col < frames.length; col++) {
      const frameCanvas = frames[col];
      if (frameCanvas) blit(ctx, frameCanvas, col * frameW, row * frameH);
    }
  }
  return canvas;
}

function saveSpritesheet(sheetCanvas, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buffer = sheetCanvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

module.exports = {
  FRAME_W,
  FRAME_H,
  ROWS,
  SHEET_W,
  SHEET_H,
  buildSpritesheet,
  saveSpritesheet,
  scaleCanvas,
};
