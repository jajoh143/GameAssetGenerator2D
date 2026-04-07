'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');

const { generateSpritesheet }  = require('./generators/CharacterGenerator');
const { PRESETS, DEFAULT_CONFIG } = require('./characters/CharacterConfig');
const {
  SKIN_TONES, HAIR_COLORS, CLOTHING, PANTS, SHOES, DEMON_SKIN,
} = require('./core/Colors');

const PORT       = 3000;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
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
    res.writeHead(200, { 'Content-Type': mime });
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
    skinTones:   paletteMap(SKIN_TONES),
    hairColors:  paletteMap(HAIR_COLORS),
    hairStyles:  ['short', 'medium', 'long'],
    clothing:    Object.keys(CLOTHING),
    pants:       Object.keys(PANTS),
    shoes:       Object.keys(SHOES),
    demonSkins:  paletteMap(DEMON_SKIN),
    hornStyles:  ['curved', 'straight', 'ram'],
    tailStyles:  ['long', 'medium', 'short'],
    presets:     PRESETS,
    defaults:    DEFAULT_CONFIG,
    frameSizes:  [64, 96, 128],
  });
}

async function handleGenerate(req, res) {
  let body;
  try { body = await parseBody(req); }
  catch { json(res, 400, { error: 'Invalid JSON body' }); return; }

  const { config = {}, name = 'character', frameSize = 64 } = body;

  // Sanitise filename
  const safeName = (name || 'character')
    .replace(/[^a-zA-Z0-9_\- ]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 64) || 'character';

  const fileName   = `${safeName}_spritesheet.png`;
  const outputPath = path.join(OUTPUT_DIR, fileName);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  try {
    generateSpritesheet(config, outputPath, Number(frameSize) || 64);
    json(res, 200, { success: true, file: `/output/${fileName}`, name: safeName });
  } catch (err) {
    console.error('[generate]', err.message);
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

  // Static: root → preview/index.html
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, path.join(PREVIEW_DIR, 'index.html')); return;
  }
  // Static: /output/ files
  if (pathname.startsWith('/output/')) {
    serveFile(res, path.join(OUTPUT_DIR, pathname.slice(8))); return;
  }
  // Static: anything else in preview/
  serveFile(res, path.join(PREVIEW_DIR, pathname));
}

// ─── start ───────────────────────────────────────────────────────────────────

// ─── Regenerate preset spritesheets on startup ────────────────────────────────
function regeneratePresets() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const { resolveConfig } = require('./characters/CharacterConfig');
  const names = Object.keys(PRESETS);
  let done = 0;
  for (const name of names) {
    try {
      const cfg = resolveConfig(PRESETS[name]);
      const out = path.join(OUTPUT_DIR, `${name}_spritesheet.png`);
      generateSpritesheet(cfg, out, 64);
      done++;
    } catch (e) {
      console.error(`[presets] failed to generate ${name}:`, e.message);
    }
  }
  console.log(`  Regenerated ${done}/${names.length} preset spritesheets.`);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[server]', err);
    if (!res.headersSent) { res.writeHead(500); res.end('Internal error'); }
  });
});

server.listen(PORT, () => {
  console.log('\n  GameAssetGenerator2D');
  console.log(`  http://localhost:${PORT}\n`);
  regeneratePresets();
});
