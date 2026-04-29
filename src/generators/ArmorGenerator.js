'use strict';

const fs   = require('fs');
const path = require('path');

const { ROWS, buildSpritesheet, saveSpritesheet, FRAME_W, FRAME_H } = require('../core/Spritesheet');
const { ANIMATION_ROWS, getFrames, getDirection } = require('../animations/Animator');
const { resolveConfig } = require('../characters/CharacterConfig');
const { ARMOR_MATERIALS } = require('../armor/ArmorColors');
const { generateHelmetFrame, HELMET_VARIANTS } = require('../armor/HelmetGenerator');
const { generateChestFrame,  CHEST_VARIANTS  } = require('../armor/ChestGenerator');
const { generateBootsFrame,  BOOTS_VARIANTS  } = require('../armor/BootsGenerator');
const { generateGlovesFrame, GLOVES_VARIANTS } = require('../armor/GlovesGenerator');
const { generateShieldCanvas, SHIELD_VARIANTS } = require('../armor/ShieldGenerator');
const { buildPhaserSpritesheetConfig, savePhaserConfig } = require('../core/PhaserExport');

// Default character config used to sample anchor positions for body-conforming
// armor sheets. Keeps armor proportions consistent across character builds —
// the game runs all armor at "medium" build, which fits all height presets
// adequately at their head/neck/torso anchors.
const ARMOR_REF_CONFIG = resolveConfig({ height: 'medium', build: 'average' });

const HELMET_PRESETS = [
  { variant: 'cap',       material: 'leather' },
  { variant: 'cap',       material: 'iron'    },
  { variant: 'full_helm', material: 'iron'    },
  { variant: 'full_helm', material: 'steel'   },
  { variant: 'full_helm', material: 'gold'    },
  { variant: 'full_helm', material: 'dark'    },
  { variant: 'hood',      material: 'cloth'   },
  { variant: 'hood',      material: 'dark'    },
  { variant: 'horned',    material: 'iron'    },
  { variant: 'horned',    material: 'dark'    },
  { variant: 'horned',    material: 'steel'   },
  { variant: 'crowned',   material: 'gold'    },
  { variant: 'crowned',   material: 'iron'    },
];

const CHEST_PRESETS = [
  { variant: 'tunic',     material: 'cloth'   },
  { variant: 'tunic',     material: 'leather' },
  { variant: 'chainmail', material: 'iron'    },
  { variant: 'chainmail', material: 'steel'   },
  { variant: 'plate',     material: 'steel'   },
  { variant: 'plate',     material: 'gold'    },
  { variant: 'plate',     material: 'dark'    },
  { variant: 'tabard',    material: 'cloth'   },
  { variant: 'tabard',    material: 'gold'    },
  { variant: 'robe',      material: 'cloth'   },
  { variant: 'robe',      material: 'dark'    },
];

const BOOTS_PRESETS = [
  { variant: 'leather', material: 'leather' },
  { variant: 'leather', material: 'dark'    },
  { variant: 'plate',   material: 'iron'    },
  { variant: 'plate',   material: 'steel'   },
];

const GLOVES_PRESETS = [
  { variant: 'leather',  material: 'leather' },
  { variant: 'leather',  material: 'dark'    },
  { variant: 'gauntlet', material: 'iron'    },
  { variant: 'gauntlet', material: 'steel'   },
];

const SHIELD_PRESETS = [
  { variant: 'round',   material: 'iron'    },
  { variant: 'round',   material: 'steel'   },
  { variant: 'round',   material: 'leather' },
  { variant: 'kite',    material: 'steel'   },
  { variant: 'kite',    material: 'gold'    },
  { variant: 'heater',  material: 'steel'   },
  { variant: 'heater',  material: 'dark'    },
  { variant: 'buckler', material: 'iron'    },
  { variant: 'buckler', material: 'leather' },
];

// Body-conforming armor pipelines, registered in z-order from bottom to top.
// layerOrder is metadata for the runtime — lower numbers draw earlier.
const BODY_ARMOR = [
  { slot: 'chest',  presets: CHEST_PRESETS,  frameFn: generateChestFrame,  VARIANTS: CHEST_VARIANTS,  layerOrder: 30 },
  { slot: 'boots',  presets: BOOTS_PRESETS,  frameFn: generateBootsFrame,  VARIANTS: BOOTS_VARIANTS,  layerOrder: 20 },
  { slot: 'gloves', presets: GLOVES_PRESETS, frameFn: generateGlovesFrame, VARIANTS: GLOVES_VARIANTS, layerOrder: 40 },
];

const COLUMNS = ROWS.reduce((m, r) => Math.max(m, r.frameCount), 0);

// ── Body-conforming armor pipeline ─────────────────────────────────────────

/**
 * Build a 13-row spritesheet for a body-conforming armor piece, matching the
 * character spritesheet grid frame-for-frame.
 *
 * @param {Function} frameFn  - (variantInfo, colors, config, animName, frameOffset, direction) => Canvas
 * @param {object}   variantInfo
 * @param {object}   colors
 * @returns {Canvas} The packed spritesheet canvas (transparent except armor).
 */
function buildBodyArmorSheet(frameFn, variantInfo, colors) {
  const rowFrames = ANIMATION_ROWS.map((animName) => {
    const direction = getDirection(animName);
    const offsets   = getFrames(animName);
    return offsets.map((f) => frameFn(variantInfo, colors, ARMOR_REF_CONFIG, animName, f, direction));
  });
  return buildSpritesheet(rowFrames);
}

function saveBodyArmor({ slot, variant, material, label, layerOrder, canvas, outputDir }) {
  const name = `${slot}_${variant}_${material}`;
  const pngPath = path.join(outputDir, `${name}.png`);
  saveSpritesheet(canvas, pngPath);

  const phaserCfg = buildPhaserSpritesheetConfig({
    image:       `${name}.png`,
    frameWidth:  FRAME_W,
    frameHeight: FRAME_H,
    columns:     COLUMNS,
    rows:        ROWS,
    getDirection,
  });
  savePhaserConfig(phaserCfg, pngPath);

  const meta = { slot, variant, material, label, layerOrder, frameWidth: FRAME_W, frameHeight: FRAME_H };
  const metaPath = pngPath.replace(/\.png$/i, '_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  return { name, file: `../output/armor/${name}.png`, meta };
}

// ── Shield pipeline (single sprite + grip anchor) ──────────────────────────

function saveShield({ variant, material, info, colors, outputDir }) {
  const name = `shield_${variant}_${material}`;
  const canvas = generateShieldCanvas(variant, colors);
  const pngPath = path.join(outputDir, `${name}.png`);
  saveSpritesheet(canvas, pngPath);

  const meta = {
    slot:    'shield',
    variant,
    material,
    label:   info.label,
    frameSize: 32,
    gripX:   info.gripX,
    gripY:   info.gripY,
    neutralAngleDeg: 0,
  };
  const metaPath = pngPath.replace(/\.png$/i, '_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  return { name, file: `../output/armor/${name}.png`, meta };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate every armor piece (helmets, chest plates, boots, gloves, shields)
 * across the configured variant × material grid.
 *
 * Body-conforming pieces are emitted as 64×96 spritesheets that share the
 * character grid layout; shields are 32×32 single sprites with grip anchors.
 *
 * @param {string} outputDir
 * @returns {Array} manifest entries
 */
function generateAllArmor(outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const entries = [];

  // Helmets
  for (const { variant, material } of HELMET_PRESETS) {
    const info   = HELMET_VARIANTS[variant];
    const colors = ARMOR_MATERIALS[material];
    if (!info || !colors) continue;
    try {
      const canvas = buildBodyArmorSheet(generateHelmetFrame, info, colors);
      entries.push(saveBodyArmor({
        slot: 'helmet', variant, material,
        label: `${material[0].toUpperCase() + material.slice(1)} ${info.label}`,
        layerOrder: 50, canvas, outputDir,
      }));
    } catch (err) {
      console.error(`  ✗ helmet_${variant}_${material}: ${err.message}`);
      if (process.env.DEBUG) console.error(err.stack);
    }
  }

  // Chest, boots, gloves
  for (const reg of BODY_ARMOR) {
    for (const { variant, material } of reg.presets) {
      const info   = reg.VARIANTS[variant];
      const colors = ARMOR_MATERIALS[material];
      if (!info || !colors) continue;
      try {
        const canvas = buildBodyArmorSheet(reg.frameFn, info, colors);
        entries.push(saveBodyArmor({
          slot: reg.slot, variant, material,
          label: `${material[0].toUpperCase() + material.slice(1)} ${info.label}`,
          layerOrder: reg.layerOrder, canvas, outputDir,
        }));
      } catch (err) {
        console.error(`  ✗ ${reg.slot}_${variant}_${material}: ${err.message}`);
        if (process.env.DEBUG) console.error(err.stack);
      }
    }
  }

  // Shields
  for (const { variant, material } of SHIELD_PRESETS) {
    const info   = SHIELD_VARIANTS[variant];
    const colors = ARMOR_MATERIALS[material];
    if (!info || !colors) continue;
    try {
      entries.push(saveShield({ variant, material, info, colors, outputDir }));
    } catch (err) {
      console.error(`  ✗ shield_${variant}_${material}: ${err.message}`);
      if (process.env.DEBUG) console.error(err.stack);
    }
  }

  return entries;
}

module.exports = {
  generateAllArmor,
  HELMET_PRESETS,
  CHEST_PRESETS,
  BOOTS_PRESETS,
  GLOVES_PRESETS,
  SHIELD_PRESETS,
};
