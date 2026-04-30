'use strict';

const path = require('path');
const fs   = require('fs');
const { generateSpritesheet, ROWS, FRAME_W, FRAME_H } = require('./generators/VectorCharacterGenerator');
const { generateAllWeapons }   = require('./generators/WeaponGenerator');
const { generateAllArmor }     = require('./generators/ArmorGenerator');
const { PRESETS }              = require('./characters/CharacterConfig');

const OUTPUT_DIR   = path.join(__dirname, '..', 'output');
const WEAPONS_DIR  = path.join(OUTPUT_DIR, 'weapons');
const ARMOR_DIR    = path.join(OUTPUT_DIR, 'armor');
const PREVIEW_DIR  = path.join(__dirname, '..', 'preview');

if (!fs.existsSync(OUTPUT_DIR))  fs.mkdirSync(OUTPUT_DIR,  { recursive: true });
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

const manifest = {
  frameWidth:  FRAME_W,
  frameHeight: FRAME_H,
  animations: ROWS.map((r, i) => ({ name: r.name, row: i, frameCount: r.frameCount })),
  characters: [],
  weapons: [],
  armor:    [],
};

console.log('Generating character spritesheets...\n');

for (const [name, config] of Object.entries(PRESETS)) {
  const outFile = path.join(OUTPUT_DIR, `${name}_spritesheet.png`);
  try {
    generateSpritesheet(config, outFile);
    console.log(`  ✓ ${name} → ${path.relative(process.cwd(), outFile)}`);
    manifest.characters.push({ name, file: `../output/${name}_spritesheet.png`, config });
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    if (process.env.DEBUG) console.error(err.stack);
  }
}

console.log('\nGenerating weapon sprites...\n');

try {
  const weaponEntries = generateAllWeapons(WEAPONS_DIR, 32);
  manifest.weapons = weaponEntries;
  weaponEntries.forEach(w => console.log(`  ✓ ${w.name}`));
} catch (err) {
  console.error(`  ✗ weapon generation failed: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
}

console.log('\nGenerating armor sprites...\n');

try {
  const armorEntries = generateAllArmor(ARMOR_DIR);
  manifest.armor = armorEntries;
  armorEntries.forEach(a => console.log(`  ✓ ${a.name}`));
} catch (err) {
  console.error(`  ✗ armor generation failed: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
}

const manifestPath = path.join(PREVIEW_DIR, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to ${path.relative(process.cwd(), manifestPath)}`);
console.log('\nDone! Open preview/index.html in your browser to view the sprites.');
