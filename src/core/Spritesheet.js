'use strict';

const fs = require('fs');
const path = require('path');
const { makeCanvas, blit } = require('./Canvas');

// Spritesheet layout constants
const FRAME_W = 64;
const FRAME_H = 64;

// Row definitions: [name, frameCount]
const ROWS = [
  { name: 'idle',         frameCount: 4  },
  { name: 'walk_south',   frameCount: 8  },
  { name: 'walk_west',    frameCount: 8  },
  { name: 'walk_north',   frameCount: 8  },
  { name: 'walk_east',    frameCount: 8  },
  { name: 'attack_south', frameCount: 6  },
  { name: 'attack_west',  frameCount: 6  },
  { name: 'attack_north', frameCount: 6  },
  { name: 'attack_east',  frameCount: 6  },
];

const SHEET_COLS = 8; // max frames in a row
const SHEET_ROWS = ROWS.length; // 9
const SHEET_W = SHEET_COLS * FRAME_W; // 512
const SHEET_H = SHEET_ROWS * FRAME_H; // 576

/**
 * Build a spritesheet from an array of row frame arrays.
 *
 * @param {Array<Canvas[]>} rowFrames - Array of 9 entries, each is an array of frame canvases.
 * @returns {Canvas} The composited spritesheet canvas.
 */
function buildSpritesheet(rowFrames) {
  const { canvas, ctx } = makeCanvas(SHEET_W, SHEET_H);

  // Fill with transparent background
  ctx.clearRect(0, 0, SHEET_W, SHEET_H);

  for (let row = 0; row < ROWS.length; row++) {
    const frames = rowFrames[row] || [];
    for (let col = 0; col < frames.length; col++) {
      const frameCanvas = frames[col];
      if (frameCanvas) {
        blit(ctx, frameCanvas, col * FRAME_W, row * FRAME_H);
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
