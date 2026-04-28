'use strict';

const fs = require('fs');
const path = require('path');
const { makeCanvas, blit } = require('./Canvas');

// Spritesheet layout constants
const FRAME_W = 64;
const FRAME_H = 96;

// Row definitions: [name, frameCount]
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

const SHEET_COLS = 8; // max frames in a row
const SHEET_ROWS = ROWS.length; // 13
const SHEET_W = SHEET_COLS * FRAME_W; // 512
const SHEET_H = SHEET_ROWS * FRAME_H; // 832

/**
 * Build a spritesheet from an array of row frame arrays.
 * Frame dimensions are auto-detected from the first frame canvas — no scaling.
 *
 * @param {Array<Canvas[]>} rowFrames
 * @returns {Canvas} The composited spritesheet canvas.
 */
function buildSpritesheet(rowFrames) {
  // Detect actual frame dimensions from the first available canvas.
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
  ctx.imageSmoothingEnabled = false;

  for (let row = 0; row < ROWS.length; row++) {
    const frames = rowFrames[row] || [];
    for (let col = 0; col < frames.length; col++) {
      const frameCanvas = frames[col];
      if (frameCanvas) {
        blit(ctx, frameCanvas, col * frameW, row * frameH);
      }
    }
  }

  return canvas;
}

/**
 * Save spritesheet canvas to PNG file.
 *
 * @param {Canvas} sheetCanvas
 * @param {string} outputPath - absolute or relative path to .png file
 */
function saveSpritesheet(sheetCanvas, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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
};
