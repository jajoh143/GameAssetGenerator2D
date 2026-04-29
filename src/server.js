'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');

const { generateSpritesheet }  = require('./generators/CharacterGenerator');
const { generateSpritesheet: generateVectorSpritesheet,
        ROWS:    VECTOR_ROWS,
        FRAME_W: VECTOR_FRAME_W,
        FRAME_H: VECTOR_FRAME_H } = require('./generators/VectorCharacterGenerator');
const { generateAllWeapons }   = require('./generators/WeaponGenerator');
const { generateAllArmor }     = require('./generators/ArmorGenerator');
const { PRESETS, DEFAULT_CONFIG } = require('./characters/CharacterConfig');
const { ROWS, FRAME_W, FRAME_H } = require('./core/Spritesheet');
const {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTHING, CLOTHING_COLORS, CLOTHING_STYLES,
  PANTS, SHOES, BELT, DEMON_SKIN, GOBLIN_SKIN, LIZARD_SKIN,
  FAIRY_SKIN, FAIRY_WING, FAIRY_DRESS, FAIRY_GLOW,
} = require('./core/Colors');

const PORT        = 3000;
const OUTPUT_DIR  = path.join(__dirname, '..', 'output');
const WEAPONS_DIR = path.join(OUTPUT_DIR, 'weapons');
const ARMOR_DIR   = path.join(OUTPUT_DIR, 'armor');
const VECTOR_DIR  = path.join(OUTPUT_DIR, 'vector');
const PREVIEW_DIR = path.join(__dirname, '..', 'preview');

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.json': 'application/json',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };
    // Prevent browser from caching HTML/JSON so users always see the latest page
    if (mime === 'text/html' || mime === 'application/json') {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

// Build a palette-preview map: key → hex base color
function paletteMap(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.base]));
}

// ─── API handlers ────────────────────────────────────────────────────────────

function handleOptions(res) {
  json(res, 200, {
    skinTones:       paletteMap(SKIN_TONES),
    hairColors:      paletteMap(HAIR_COLORS),
    hairStyles:      ['short', 'medium', 'long', 'curly', 'undercut',
                      'spiky', 'mohawk', 'topknot', 'buzzed', 'bald'],
    eyeColors:       Object.fromEntries(Object.entries(EYE_COLORS).map(([k, v]) => [k, v.iris])),
    beardStyles:     ['none', 'stubble', 'handlebar', 'goatee', 'full'],
    heights:         ['tiny', 'short', 'medium', 'tall'],
    builds:          ['slim', 'average', 'muscular', 'heavy'],
    // Clothing is split into independent style and colour pickers.
    clothingStyles:  CLOTHING_STYLES,
    clothingColors:  paletteMap(CLOTHING_COLORS),
    // Legacy combined list kept for any older client code that still needs it.
    clothing:        Object.keys(CLOTHING),
    pants:           Object.keys(PANTS),
    shoes:           Object.keys(SHOES),
    beltColors:      paletteMap(BELT),
    demonSkins:  paletteMap(DEMON_SKIN),
    goblinSkins: paletteMap(GOBLIN_SKIN),
    goblinHornStyles:  ['none', 'curved', 'straight', 'ram'],
    goblinHornLengths: ['short', 'medium', 'long'],
    lizardScales: paletteMap(LIZARD_SKIN),
    hornStyles:  ['curved', 'straight', 'ram'],
    tailStyles:  ['long', 'medium', 'short'],
    hornLengths: ['short', 'medium', 'long'],
    tailLengths: ['short', 'medium', 'long'],
    // Fairy options
    fairySkins:  paletteMap(FAIRY_SKIN),
    wingStyles:  ['butterfly', 'dragonfly'],
    wingSizes:   ['small', 'medium', 'large'],
    wingColors:  Object.fromEntries(Object.entries(FAIRY_WING).map(([k, v]) => [k, v.outer])),
    fairyDresses: Object.fromEntries(Object.entries(FAIRY_DRESS).map(([k, v]) => [k, v.base])),
    glowColors:  Object.fromEntries(Object.entries(FAIRY_GLOW).map(([k, v]) => [k, v.bright])),
    glowIntensities: ['subtle', 'medium', 'bright'],
    presets:     PRESETS,
    defaults:    DEFAULT_CONFIG,
    frameSizes:  [128, 192, 256],
  });
}

async function handleGenerate(req, res) {
  let body;
  try { body = await parseBody(req); }
  catch { json(res, 400, { error: 'Invalid JSON body' }); return; }

  const { config = {}, name = 'character', frameSize = 128 } = body;

  // Sanitise filename
  const safeName = (name || 'character')
    .replace(/[^a-zA-Z0-9_\- ]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 64) || 'character';

  const fileName   = `${safeName}_spritesheet.png`;
  const outputPath = path.join(OUTPUT_DIR, fileName);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  try {
    generateSpritesheet(config, outputPath, Number(frameSize) || 128);
    json(res, 200, { success: true, file: `/output/${fileName}`, name: safeName });
  } catch (err) {
    console.error('[generate]', err.message);
    json(res, 500, { error: err.message });
  }
}

async function handleGenerateVector(req, res) {
  let body;
  try { body = await parseBody(req); }
  catch { json(res, 400, { error: 'Invalid JSON body' }); return; }

  const { config = {}, name = 'character', frameSize = VECTOR_FRAME_W } = body;

  const safeName = (name || 'character')
    .replace(/[^a-zA-Z0-9_\- ]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 64) || 'character';

  const fileName   = `${safeName}_vector_spritesheet.png`;
  const outputPath = path.join(VECTOR_DIR, fileName);

  if (!fs.existsSync(VECTOR_DIR)) fs.mkdirSync(VECTOR_DIR, { recursive: true });

  try {
    generateVectorSpritesheet(config, outputPath, Number(frameSize) || VECTOR_FRAME_W);
    json(res, 200, {
      success: true,
      file:    `/output/vector/${fileName}`,
      name:    safeName,
      style:   'vector',
    });
  } catch (err) {
    console.error('[generate-vector]', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    json(res, 500, { error: err.message });
  }
}

// ─── router ──────────────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (pathname === '/api/options' && req.method === 'GET') { handleOptions(res); return; }
  if (pathname === '/api/generate' && req.method === 'POST') { await handleGenerate(req, res); return; }
  if (pathname === '/api/generate-vector' && req.method === 'POST') { await handleGenerateVector(req, res); return; }

  // Static: root → preview/index.html
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, path.join(PREVIEW_DIR, 'index.html')); return;
  }
  // Static: /output/ files (characters + weapons)
  if (pathname.startsWith('/output/')) {
    serveFile(res, path.join(OUTPUT_DIR, pathname.slice(8))); return;
  }
  // Static: anything else in preview/
  serveFile(res, path.join(PREVIEW_DIR, pathname));
}

// ─── startup asset generation ─────────────────────────────────────────────────

function regenerateAll() {
  if (!fs.existsSync(OUTPUT_DIR))  fs.mkdirSync(OUTPUT_DIR,  { recursive: true });
  if (!fs.existsSync(WEAPONS_DIR)) fs.mkdirSync(WEAPONS_DIR, { recursive: true });
  if (!fs.existsSync(ARMOR_DIR))   fs.mkdirSync(ARMOR_DIR,   { recursive: true });
  if (!fs.existsSync(VECTOR_DIR))  fs.mkdirSync(VECTOR_DIR,  { recursive: true });

  const { resolveConfig } = require('./characters/CharacterConfig');

  const manifest = {
    frameWidth:  FRAME_W,
    frameHeight: FRAME_H,
    animations:  ROWS.map((r, i) => ({ name: r.name, row: i, frameCount: r.frameCount })),
    characters:  [],
    weapons:     [],
    armor:       [],
    // Vector pipeline metadata + character list (rendered separately so the
    // pixel preview tab can stay untouched).
    vector: {
      frameWidth:  VECTOR_FRAME_W,
      frameHeight: VECTOR_FRAME_H,
      animations:  VECTOR_ROWS.map((r, i) => ({ name: r.name, row: i, frameCount: r.frameCount })),
      characters:  [],
    },
  };

  // Characters (pixel pipeline)
  let charDone = 0;
  for (const [name, config] of Object.entries(PRESETS)) {
    try {
      const cfg = resolveConfig(config);
      const out = path.join(OUTPUT_DIR, `${name}_spritesheet.png`);
      generateSpritesheet(cfg, out, 96);
      manifest.characters.push({ name, file: `../output/${name}_spritesheet.png`, config });
      charDone++;
    } catch (e) {
      console.error(`  [presets] failed ${name}:`, e.message);
    }
  }

  // Characters (vector pipeline) — same presets, rendered with smooth paths.
  let vectorDone = 0;
  for (const [name, config] of Object.entries(PRESETS)) {
    try {
      const cfg = resolveConfig(config);
      const out = path.join(VECTOR_DIR, `${name}_vector_spritesheet.png`);
      generateVectorSpritesheet(cfg, out, VECTOR_FRAME_W);
      manifest.vector.characters.push({
        name,
        file: `../output/vector/${name}_vector_spritesheet.png`,
        config,
      });
      vectorDone++;
    } catch (e) {
      console.error(`  [vector presets] failed ${name}:`, e.message);
      if (process.env.DEBUG) console.error(e.stack);
    }
  }

  // Weapons
  let weaponEntries = [];
  try {
    weaponEntries = generateAllWeapons(WEAPONS_DIR, 32);
    manifest.weapons = weaponEntries;
  } catch (e) {
    console.error('  [weapons] generation failed:', e.message);
  }

  // Armor
  let armorEntries = [];
  try {
    armorEntries = generateAllArmor(ARMOR_DIR);
    manifest.armor = armorEntries;
  } catch (e) {
    console.error('  [armor] generation failed:', e.message);
  }

  // Write manifest so preview page has up-to-date data
  const manifestPath = path.join(PREVIEW_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`  Characters: ${charDone}/${Object.keys(PRESETS).length}  Vector: ${vectorDone}/${Object.keys(PRESETS).length}  Weapons: ${weaponEntries.length}  Armor: ${armorEntries.length}`);
}

// ─── start ───────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[server]', err);
    if (!res.headersSent) { res.writeHead(500); res.end('Internal error'); }
  });
});

server.listen(PORT, () => {
  console.log('\n  GameAssetGenerator2D');
  console.log(`  http://localhost:${PORT}\n`);
  console.log('  Generating assets...');
  regenerateAll();
  console.log('  Ready.\n');
});
