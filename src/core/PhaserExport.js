'use strict';

const fs   = require('fs');
const path = require('path');

const FRAME_RATES = {
  idle:               6,
  walk:              12,
  attack_swing:      16,
  attack_shoot:      14,
};

function frameRateFor(animName) {
  if (animName === 'idle')                       return FRAME_RATES.idle;
  if (animName.startsWith('walk_'))              return FRAME_RATES.walk;
  if (animName.startsWith('attack_swing_'))      return FRAME_RATES.attack_swing;
  if (animName.startsWith('attack_shoot_'))      return FRAME_RATES.attack_shoot;
  return 8;
}

function repeatFor(animName) {
  return animName.startsWith('attack_') ? 0 : -1;
}

/**
 * Build a Phaser-native spritesheet config from row metadata.
 *
 * Frame indices are row-major: total frames per row = `columns`,
 * so animation row R starts at index R * columns.
 *
 * @param {object} opts
 * @param {string} opts.image          - PNG filename (relative to JSON)
 * @param {number} opts.frameWidth
 * @param {number} opts.frameHeight
 * @param {number} opts.columns        - frames per row (sheet width / frameWidth)
 * @param {Array<{name, frameCount}>} opts.rows
 * @param {Function} [opts.getDirection] - (animName) => 'south'|'north'|'west'|'east'
 * @returns {object}
 */
function buildPhaserSpritesheetConfig({ image, frameWidth, frameHeight, columns, rows, getDirection }) {
  const animations = {};
  rows.forEach((row, rowIdx) => {
    const start = rowIdx * columns;
    animations[row.name] = {
      row:        rowIdx,
      frameCount: row.frameCount,
      start,
      end:        start + row.frameCount - 1,
      frameRate:  frameRateFor(row.name),
      repeat:     repeatFor(row.name),
      direction:  getDirection ? getDirection(row.name) : null,
    };
  });

  return {
    image,
    frameWidth,
    frameHeight,
    columns,
    rows:         rows.length,
    totalFrames:  rows.length * columns,
    animations,
  };
}

/**
 * Write a Phaser config JSON next to the spritesheet PNG.
 * The output path replaces `.png` with `.json` (no `_meta` suffix —
 * that suffix is reserved for the custom anchor JSON in MetaExport.js).
 */
function savePhaserConfig(config, pngPath) {
  const jsonPath = pngPath.replace(/\.png$/i, '.json');
  const dir = path.dirname(jsonPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2));
  return jsonPath;
}

module.exports = { buildPhaserSpritesheetConfig, savePhaserConfig };
