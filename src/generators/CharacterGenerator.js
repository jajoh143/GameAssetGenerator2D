'use strict';

const path = require('path');
const { ROWS, buildSpritesheet, saveSpritesheet } = require('../core/Spritesheet');
const { ANIMATION_ROWS, getFrames, getDirection } = require('../animations/Animator');
const { generateFrame: generateHumanFrame } = require('../characters/HumanCharacter');
const { generateFrame: generateDemonFrame } = require('../characters/DemonCharacter');
const { resolveConfig } = require('../characters/CharacterConfig');

/**
 * Generate a complete spritesheet for a character.
 *
 * @param {object} rawConfig  - Character config
 * @param {string} outputPath - Where to save the PNG
 * @returns {string}          - Resolved output path
 */
function generateSpritesheet(rawConfig, outputPath) {
  const config = resolveConfig(rawConfig);
  const generateFrame = config.type === 'demon' ? generateDemonFrame : generateHumanFrame;

  // Build all 9 animation rows
  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  const sheet = buildSpritesheet(rowFrames);
  saveSpritesheet(sheet, outputPath);
  return outputPath;
}

/**
 * Generate a spritesheet and return the canvas without saving.
 */
function generateSpritesheetCanvas(rawConfig) {
  const config = resolveConfig(rawConfig);
  const generateFrame = config.type === 'demon' ? generateDemonFrame : generateHumanFrame;

  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  return buildSpritesheet(rowFrames);
}

module.exports = { generateSpritesheet, generateSpritesheetCanvas };
