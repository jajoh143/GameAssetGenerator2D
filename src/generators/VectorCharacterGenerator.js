'use strict';

/**
 * VectorCharacterGenerator — orchestration for the vector pipeline.
 * Mirrors generators/CharacterGenerator.js so the two pipelines share an
 * API surface (same config shape, same animation rows, same preview).
 */

const path = require('path');
const { ROWS, FRAME_W, FRAME_H, buildSpritesheet, saveSpritesheet, scaleCanvas } =
  require('../vector/VectorSpritesheet');
const { ANIMATION_ROWS, getFrames, getDirection } = require('../animations/Animator');
const { resolveConfig } = require('../characters/CharacterConfig');
const { generateFrame: generateHumanFrame      } = require('../vector/VectorHumanCharacter');
const { generateFrame: generateDemonFrame      } = require('../vector/VectorDemonCharacter');
const { generateFrame: generateFairyFrame      } = require('../vector/VectorFairyCharacter');
const { generateFrame: generateGoblinFrame     } = require('../vector/VectorGoblinCharacter');
const { generateFrame: generateLizardfolkFrame } = require('../vector/VectorLizardfolkCharacter');

function pickGenerator(type) {
  switch (type) {
    case 'demon':      return generateDemonFrame;
    case 'fairy':      return generateFairyFrame;
    case 'goblin':     return generateGoblinFrame;
    case 'lizardfolk': return generateLizardfolkFrame;
    default:           return generateHumanFrame;
  }
}

/**
 * Generate a vector spritesheet PNG.
 *
 * @param {object} rawConfig     Character config (same shape as pixel pipeline)
 * @param {string} outputPath    Destination .png path
 * @param {number} [frameSize=128]  Output frame width — vector sheets render
 *                              at FRAME_W (128) natively, then scale smoothly
 *                              if a different size is requested.
 */
function generateSpritesheet(rawConfig, outputPath, frameSize = FRAME_W) {
  const config = resolveConfig(rawConfig);
  const generateFrame = pickGenerator(config.type);

  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  const nativeSheet = buildSpritesheet(rowFrames);
  const scale = frameSize / FRAME_W;
  const sheet = scale !== 1 ? scaleCanvas(nativeSheet, scale) : nativeSheet;
  saveSpritesheet(sheet, outputPath);
  return outputPath;
}

function generateSpritesheetCanvas(rawConfig) {
  const config = resolveConfig(rawConfig);
  const generateFrame = pickGenerator(config.type);
  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });
  return buildSpritesheet(rowFrames);
}

module.exports = {
  generateSpritesheet,
  generateSpritesheetCanvas,
  ROWS,
  FRAME_W,
  FRAME_H,
};
