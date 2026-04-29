'use strict';

const path = require('path');
const { ROWS, FRAME_W, buildSpritesheet, saveSpritesheet } = require('../core/Spritesheet');
const { ANIMATION_ROWS, getFrames, getDirection } = require('../animations/Animator');
const { generateFrame: generateHumanFrame } = require('../characters/HumanCharacter');
const { generateFrame: generateDemonFrame } = require('../characters/DemonCharacter');
const { generateFrame: generateFairyFrame } = require('../characters/FairyCharacter');
const { generateFrame: generateGoblinFrame } = require('../characters/GoblinCharacter');
const { generateFrame: generateLizardfolkFrame } = require('../characters/LizardfolkCharacter');
const { resolveConfig } = require('../characters/CharacterConfig');
const { buildMeta, saveMeta } = require('../core/MetaExport');
const { scaleCanvas } = require('../core/Canvas');
const { buildPhaserSpritesheetConfig, savePhaserConfig } = require('../core/PhaserExport');

/**
 * Generate a complete spritesheet for a character.
 *
 * @param {object} rawConfig   - Character config
 * @param {string} outputPath  - Where to save the PNG
 * @param {number} [frameSize=128] - Output frame size in pixels (128 | 192 | 256)
 * @returns {string}           - Resolved output path
 */
function generateSpritesheet(rawConfig, outputPath, frameSize = 128) {
  const config = resolveConfig(rawConfig);
  const generateFrame =
    config.type === 'demon'      ? generateDemonFrame      :
    config.type === 'fairy'      ? generateFairyFrame      :
    config.type === 'goblin'     ? generateGoblinFrame     :
    config.type === 'lizardfolk' ? generateLizardfolkFrame :
    generateHumanFrame;

  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  const nativeSheet = buildSpritesheet(rowFrames);
  const scale = frameSize / FRAME_W;
  const sheet = scale !== 1 ? scaleCanvas(nativeSheet, scale) : nativeSheet;
  saveSpritesheet(sheet, outputPath);

  const metaW = frameSize;
  const metaH = Math.round(96 * scale);
  const meta = buildMeta(metaW, ANIMATION_ROWS, getFrames, getDirection, config);
  saveMeta(meta, outputPath);

  const phaserCfg = buildPhaserSpritesheetConfig({
    image:       path.basename(outputPath),
    frameWidth:  metaW,
    frameHeight: metaH,
    columns:     ROWS.reduce((m, r) => Math.max(m, r.frameCount), 0),
    rows:        ROWS,
    getDirection,
  });
  savePhaserConfig(phaserCfg, outputPath);

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
    config.type === 'demon'      ? generateDemonFrame      :
    config.type === 'fairy'      ? generateFairyFrame      :
    config.type === 'goblin'     ? generateGoblinFrame     :
    config.type === 'lizardfolk' ? generateLizardfolkFrame :
    generateHumanFrame;

  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const offsets = getFrames(animName);
    return offsets.map((frameOffset) => generateFrame(config, animName, frameOffset));
  });

  return buildSpritesheet(rowFrames);
}

module.exports = { generateSpritesheet, generateSpritesheetCanvas };
