'use strict';

const path = require('path');
const { ROWS, buildSpritesheet, saveSpritesheet } = require('../core/Spritesheet');
const { ANIMATION_ROWS, getFrames, getDirection } = require('../animations/Animator');
const { generateFrame: generateHumanFrame } = require('../characters/HumanCharacter');
const { generateFrame: generateDemonFrame } = require('../characters/DemonCharacter');
const { generateFrame: generateFairyFrame } = require('../characters/FairyCharacter');
const { resolveConfig } = require('../characters/CharacterConfig');
const { buildMeta, saveMeta } = require('../core/MetaExport');

/**
 * Generate a complete spritesheet for a character.
 *
 * @param {object} rawConfig   - Character config
 * @param {string} outputPath  - Where to save the PNG
 * @param {number} [frameSize=64] - Output frame size in pixels (64 | 96 | 128)
 * @returns {string}           - Resolved output path
 */
function generateSpritesheet(rawConfig, outputPath) {
  const config = resolveConfig(rawConfig);
  const generateFrame =
    config.type === 'demon' ? generateDemonFrame :
    config.type === 'fairy' ? generateFairyFrame :
    generateHumanFrame;

  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  const sheet = buildSpritesheet(rowFrames);
  saveSpritesheet(sheet, outputPath);

  // Detect frame size from first frame for meta export
  const firstFrame = rowFrames.find(f => f.length > 0)?.[0];
  const metaW = firstFrame ? firstFrame.width : 64;
  const meta = buildMeta(metaW, ANIMATION_ROWS, getFrames, getDirection);
  saveMeta(meta, outputPath);

  return outputPath;
}

/**
 * Generate a spritesheet canvas without saving.
 *
 * @param {object} rawConfig
 * @param {number} [frameSize=64]
 */
function generateSpritesheetCanvas(rawConfig) {
  const config = resolveConfig(rawConfig);
  const generateFrame =
    config.type === 'demon' ? generateDemonFrame :
    config.type === 'fairy' ? generateFairyFrame :
    generateHumanFrame;

  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  return buildSpritesheet(rowFrames);
}

module.exports = { generateSpritesheet, generateSpritesheetCanvas };
