'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, mirrorCanvasH, clear } = require('../core/Canvas');
const Colors = require('../core/Colors');
const { resolveConfig } = require('./CharacterConfig');
const {
  drawSouth: humanSouth,
  drawNorth: humanNorth,
  drawWest:  humanWest,
  resolveColors: humanColors,
  getYAnchors,
} = require('./HumanCharacter');
const {
  drawHornsSouth: drawDemonHornsSouth,
  drawHornsWest:  drawDemonHornsWest,
} = require('./DemonCharacter');

const FRAME_W = 96;
const FRAME_H = 96;

function resolveColors(config) {
  const base = humanColors(config);
  base.horn = Colors.GOBLIN_HORN;            // bone/ivory horns for goblins
  return base;
}

// ─── Long pointed goblin ears (south view) ────────────────────────────────
// Goblins have noticeably larger, wider, more horizontal ears than fairies —
// they project outward from the temple, taper to a sharp tip, and dip
// slightly below the temple anchor. 5 rows tall, 4 px protrusion each side.
function drawGoblinEarsSouth(ctx, skinColors, headBobY) {
  const sh = skinColors.shadow;
  const hi = skinColors.highlight;
  const ba = skinColors.base;
  const ol = skinColors.outline;
  // Ear anchor at the temple — head silhouette runs x≈21..42 in mid-face.
  // ly is the y of the ear's MIDDLE row.
  const ly = 41 + headBobY;

  // ── Left ear ────────────────────────────────────────────────────────────
  // Triangle tapering from base at (21, ly-1..ly+1) outward to tip (16, ly).
  // Row offsets: -2..+2 around ly.
  // Tip is at the leftmost point.
  // Fill
  pixel(ctx, ba, 19, ly - 2);
  pixel(ctx, ba, 20, ly - 2);
  pixel(ctx, ba, 18, ly - 1);
  pixel(ctx, ba, 19, ly - 1);
  pixel(ctx, ba, 20, ly - 1);
  pixel(ctx, ba, 17, ly);
  pixel(ctx, ba, 18, ly);
  pixel(ctx, ba, 19, ly);
  pixel(ctx, ba, 20, ly);
  pixel(ctx, ba, 18, ly + 1);
  pixel(ctx, ba, 19, ly + 1);
  pixel(ctx, ba, 20, ly + 1);
  pixel(ctx, ba, 19, ly + 2);
  pixel(ctx, ba, 20, ly + 2);
  // Inner shadow strip (where ear meets head — implies recess)
  pixel(ctx, sh, 20, ly - 1);
  pixel(ctx, sh, 20, ly);
  pixel(ctx, sh, 20, ly + 1);
  // Lit upper-front edge
  pixel(ctx, hi, 19, ly - 2);
  pixel(ctx, hi, 18, ly - 1);
  // Outline (silhouette)
  pixel(ctx, ol, 18, ly - 2);
  pixel(ctx, ol, 19, ly - 3);
  pixel(ctx, ol, 17, ly - 1);
  pixel(ctx, ol, 16, ly);          // sharp tip
  pixel(ctx, ol, 17, ly + 1);
  pixel(ctx, ol, 18, ly + 2);
  pixel(ctx, ol, 19, ly + 3);

  // ── Right ear (mirror around x=31.5) ────────────────────────────────────
  pixel(ctx, ba, 43, ly - 2);
  pixel(ctx, ba, 44, ly - 2);
  pixel(ctx, ba, 43, ly - 1);
  pixel(ctx, ba, 44, ly - 1);
  pixel(ctx, ba, 45, ly - 1);
  pixel(ctx, ba, 43, ly);
  pixel(ctx, ba, 44, ly);
  pixel(ctx, ba, 45, ly);
  pixel(ctx, ba, 46, ly);
  pixel(ctx, ba, 43, ly + 1);
  pixel(ctx, ba, 44, ly + 1);
  pixel(ctx, ba, 45, ly + 1);
  pixel(ctx, ba, 43, ly + 2);
  pixel(ctx, ba, 44, ly + 2);
  // Inner shadow
  pixel(ctx, sh, 43, ly - 1);
  pixel(ctx, sh, 43, ly);
  pixel(ctx, sh, 43, ly + 1);
  // Lit edge — front-facing (right ear's front is the LEFT side toward the head)
  pixel(ctx, hi, 44, ly - 2);
  // Outline
  pixel(ctx, ol, 45, ly - 2);
  pixel(ctx, ol, 44, ly - 3);
  pixel(ctx, ol, 46, ly - 1);
  pixel(ctx, ol, 47, ly);          // sharp tip
  pixel(ctx, ol, 46, ly + 1);
  pixel(ctx, ol, 45, ly + 2);
  pixel(ctx, ol, 44, ly + 3);
}

// ─── Long pointed goblin ear (west / side view) ───────────────────────────
function drawGoblinEarWest(ctx, skinColors) {
  const ba = skinColors.base;
  const sh = skinColors.shadow;
  const hi = skinColors.highlight;
  const ol = skinColors.outline;
  // Anchor at temple (~x=29, y=35). Ear tip points up-and-back.
  // 4 rows tall, ~4 px protrusion.
  pixel(ctx, ba, 28, 32);
  pixel(ctx, ba, 28, 33);
  pixel(ctx, ba, 27, 33);
  pixel(ctx, ba, 28, 34);
  pixel(ctx, ba, 27, 34);
  pixel(ctx, ba, 26, 34);
  pixel(ctx, sh, 28, 33);
  pixel(ctx, hi, 27, 33);
  // Outline
  pixel(ctx, ol, 28, 31);          // tip top
  pixel(ctx, ol, 27, 32);
  pixel(ctx, ol, 26, 33);
  pixel(ctx, ol, 25, 34);          // sharp back tip
  pixel(ctx, ol, 27, 35);
}

// ─── Goblin face touches: small sharp fang peeking from the mouth ─────────
// Drawn on the human head AFTER it's rendered. Position: just below the
// mouth shadow line, slightly off-centre.
function drawGoblinFangSouth(ctx, headBobY) {
  // Mouth is around y=44 in drawHeadSouth. A single ivory fang dangles
  // from the upper lip at the right corner — reads as "snaggle tooth".
  pixel(ctx, '#FFFFE0', 33, 44 + headBobY);
  pixel(ctx, '#E8D8A0', 33, 45 + headBobY);
}

// ─── Frame generator ──────────────────────────────────────────────────────
function generateFrame(rawConfig, animationName, frameOffset) {
  const config = resolveConfig(rawConfig);
  const colors = resolveColors(config);
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  const off = frameOffset;
  const by  = Math.round((off.bodyY || 0) * 1.5);
  const headBob = Math.round((off.headBob || 0) * 1.5);

  let direction = 'south';
  if (animationName.includes('north')) direction = 'north';
  else if (animationName.includes('west')) direction = 'west';
  else if (animationName.includes('east')) direction = 'east';

  if (direction === 'east') {
    const { canvas: tmpC, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
    clear(tmpCtx, FRAME_W, FRAME_H);
    renderDirection(tmpCtx, config, colors, off, 'west', by, headBob);
    const mirrored = mirrorCanvasH(tmpC);
    ctx.drawImage(mirrored, 0, 0);
    return canvas;
  }

  renderDirection(ctx, config, colors, off, direction, by, headBob);
  return canvas;
}

function renderDirection(ctx, config, colors, off, direction, by, headBob) {
  // Height-aware Y shift — keeps overlays aligned with the (possibly
  // shifted) head when goblins use 'short' height.
  const yA         = getYAnchors(config);
  const headDeltaY = yA.neckY - 50;
  const ovBy       = by + headDeltaY;

  // 1. Human body with goblin skin tones (resolveColors handles type=goblin)
  if (direction === 'south')      humanSouth(ctx, config, off);
  else if (direction === 'north') humanNorth(ctx, config, off);
  else                            humanWest(ctx, config, off);

  // 2. Long pointed goblin ears
  if (direction === 'south' || direction === 'north') {
    drawGoblinEarsSouth(ctx, colors.skin, headBob + ovBy);
  } else if (direction === 'west') {
    ctx.save();
    ctx.translate(0, ovBy + headBob);
    drawGoblinEarWest(ctx, colors.skin);
    ctx.restore();
  }

  // 3. Snaggle fang on the south-facing face (goblin trademark)
  if (direction === 'south') {
    drawGoblinFangSouth(ctx, headBob + ovBy);
  }

  // 4. Optional ivory horns — goblins can have small horns/tusks crowning
  //    their heads. Reuse the demon horn-drawing routines but with the
  //    GOBLIN_HORN palette so they read as bone, not gilded brass.
  const hornStyle = config.goblinHorns || 'none';
  if (hornStyle !== 'none') {
    const hornLength = config.goblinHornLength || 'short';
    const hornY = yA.headTopY;
    if (direction === 'south' || direction === 'north') {
      ctx.save();
      ctx.translate(0, by + headBob);
      drawDemonHornsSouth(ctx, colors, hornStyle, hornLength, hornY);
      ctx.restore();
    } else if (direction === 'west') {
      ctx.save();
      ctx.translate(0, by + headBob);
      drawDemonHornsWest(ctx, colors, hornStyle, hornLength, 13, hornY + 3);
      ctx.restore();
    }
  }
}

module.exports = { generateFrame };
