'use strict';

const fs   = require('fs');
const path = require('path');
const { generateSwordCanvas, SWORD_VARIANTS } = require('../weapons/SwordGenerator');
const { generateGunCanvas,   GUN_VARIANTS   } = require('../weapons/GunGenerator');
const { BLADE_MATERIALS, GUN_MATERIALS }       = require('../weapons/WeaponColors');
const { saveSpritesheet }                      = require('../core/Spritesheet');

// Presets: which variants × materials to generate
const SWORD_PRESETS = [
  { variant: 'short_sword', material: 'iron'  },
  { variant: 'short_sword', material: 'steel' },
  { variant: 'short_sword', material: 'gold'  },
  { variant: 'long_sword',  material: 'steel' },
  { variant: 'long_sword',  material: 'dark'  },
  { variant: 'dagger',      material: 'iron'  },
  { variant: 'dagger',      material: 'gold'  },
  { variant: 'axe',         material: 'iron'  },
  { variant: 'axe',         material: 'dark'  },
];

const GUN_PRESETS = [
  { variant: 'pistol',  material: 'black'  },
  { variant: 'pistol',  material: 'chrome' },
  { variant: 'rifle',   material: 'black'  },
  { variant: 'rifle',   material: 'wood'   },
  { variant: 'shotgun', material: 'black'  },
  { variant: 'shotgun', material: 'wood'   },
];

/**
 * Build the meta JSON for a single weapon.
 */
function buildWeaponMeta(type, variant, material, info, frameSize) {
  const scale = frameSize / 32;
  return {
    type,
    variant,
    material,
    label:    info.label,
    frameSize,
    gripX:    Math.round(info.gripX * scale),
    gripY:    Math.round((info.gripY !== undefined ? info.gripY : 16) * scale),
    neutralAngleDeg: 0,  // sprite points RIGHT = 0° in atan2 convention
  };
}

/**
 * Save a weapon canvas as PNG + meta JSON.
 */
function saveWeapon(canvas, meta, outputDir, name) {
  const pngPath  = path.join(outputDir, `${name}.png`);
  const jsonPath = path.join(outputDir, `${name}_meta.json`);
  saveSpritesheet(canvas, pngPath);
  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2));
  return { pngPath, jsonPath };
}

/**
 * Generate all weapon sprites and meta files.
 *
 * @param {string} outputDir   - Directory to write files (e.g. output/weapons/)
 * @param {number} [frameSize=32] - Output size (32 | 64 | 128)
 * @returns {Array<{name, file, meta}>} manifest entries
 */
function generateAllWeapons(outputDir, frameSize = 32) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const entries = [];

  for (const { variant, material } of SWORD_PRESETS) {
    const info   = SWORD_VARIANTS[variant];
    const colors = BLADE_MATERIALS[material];
    const name   = `${variant}_${material}`;
    try {
      const canvas = generateSwordCanvas(variant, colors);
      const meta   = buildWeaponMeta('melee', variant, material, info, frameSize);
      saveWeapon(canvas, meta, outputDir, name);
      entries.push({ name, file: `../output/weapons/${name}.png`, meta });
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  for (const { variant, material } of GUN_PRESETS) {
    const info   = GUN_VARIANTS[variant];
    const colors = GUN_MATERIALS[material];
    const name   = `${variant}_${material}`;
    try {
      const canvas = generateGunCanvas(variant, colors);
      const meta   = buildWeaponMeta('ranged', variant, material, info, frameSize);
      saveWeapon(canvas, meta, outputDir, name);
      entries.push({ name, file: `../output/weapons/${name}.png`, meta });
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  return entries;
}

module.exports = { generateAllWeapons, SWORD_PRESETS, GUN_PRESETS };
