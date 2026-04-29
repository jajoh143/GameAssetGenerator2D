'use strict';

/**
 * VectorHumanCharacter — vector frame renderer for human characters.
 *
 * Mirrors the architecture of the pixel renderer (HumanCharacter.js):
 *   • generateFrame(config, animationName, frameOffset) → canvas
 *   • dispatches to drawSouth / drawNorth / drawWest / drawEast
 *   • east is a horizontal mirror of west
 */

const Colors = require('../core/Colors');
const VC     = require('./VectorCanvas');
const Body   = require('./VectorBaseCharacter');
const { buildRig, FRAME_W, FRAME_H } = require('./VectorRig');

// ---------------------------------------------------------------------------
// Color resolver — maps a config to fully-shaded palettes
// ---------------------------------------------------------------------------

function resolveColors(config) {
  let skin;
  if (config.type === 'demon') {
    skin = Colors.DEMON_SKIN[config.demonSkin] || Colors.DEMON_SKIN.crimson;
  } else if (config.type === 'fairy') {
    const fs = Colors.FAIRY_SKIN[config.fairySkin] || Colors.FAIRY_SKIN.peach;
    skin = Object.assign({ deep_shadow: fs.outline }, fs);
  } else if (config.type === 'goblin') {
    skin = Colors.GOBLIN_SKIN[config.goblinSkin] || Colors.GOBLIN_SKIN.moss_green;
  } else if (config.type === 'lizardfolk') {
    skin = Colors.LIZARD_SKIN[config.lizardScale] || Colors.LIZARD_SKIN.emerald;
  } else {
    skin = Colors.SKIN_TONES[config.skin] || Colors.SKIN_TONES.medium;
  }

  // Clothing
  let clothing;
  if (config.type === 'fairy') {
    const dressKey = config.fairyDress || 'petal_pink';
    const dp = Colors.FAIRY_DRESS[dressKey] || Colors.FAIRY_DRESS.petal_pink;
    clothing = {
      highlight:   dp.highlight,
      base:        dp.base,
      shadow:      dp.shadow,
      deep_shadow: dp.outline,
      outline:     dp.outline,
      collar:      dp.shadow,
    };
  } else {
    clothing = Colors.resolveClothing(
      config.clothingStyle || 'jacket',
      config.clothingColor || 'grey',
    );
  }

  const baseEyes = Colors.EYE_COLORS[config.eyes] || Colors.EYE_COLORS.brown;
  const eyes = (config.type === 'demon' || config.type === 'fairy')
    ? Object.assign({}, baseEyes, { solid: true })
    : baseEyes;

  return {
    skin,
    hair:     Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black,
    eyes,
    clothing,
    pants:    Colors.PANTS[config.pants] || Colors.PANTS.jeans_blue,
    shoes:    Colors.SHOES[config.shoes] || Colors.SHOES.shoe_black,
    belt:     Colors.BELT[config.beltColor] || Colors.BELT.standard,
  };
}

// ---------------------------------------------------------------------------
// Direction renderers
// ---------------------------------------------------------------------------

function drawSouth(ctx, config, offsets, hooks = {}) {
  const colors = resolveColors(config);
  const rig = buildRig(config, 'south', offsets);

  // Ground shadow
  if (!offsets.skipGroundShadow) {
    VC.groundShadow(ctx, rig.frameW / 2, rig.groundY + rig.limbR * 0.6,
      rig.frameW * 0.22, rig.limbR * 0.6, 0.35);
  }

  if (hooks.before) hooks.before(ctx, rig, colors);

  // Decide front/back leg ordering by which one is farther forward (y bigger).
  // The deeper leg should be drawn first, the shallower (in front) on top.
  const lFwd = offsets.leftLegFwd  || 0;
  const rFwd = offsets.rightLegFwd || 0;
  const drawL = () => {
    Body.drawLimb(ctx, rig.hipL, rig.kneeL, rig.footL, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawShoe(ctx, rig.footL, colors.shoes, rig, 'south');
  };
  const drawR = () => {
    Body.drawLimb(ctx, rig.hipR, rig.kneeR, rig.footR, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawShoe(ctx, rig.footR, colors.shoes, rig, 'south');
  };
  if (lFwd >= rFwd) { drawR(); drawL(); }
  else              { drawL(); drawR(); }

  // Body
  Body.drawTorso(ctx, rig, colors.clothing);
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);

  // Arms — back arm first (smaller forward offset), then front
  const lArmFwd = offsets.leftArmFwd  || 0;
  const rArmFwd = offsets.rightArmFwd || 0;
  const drawArmL = () => {
    Body.drawLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    Body.drawHand(ctx, rig.handL, colors.skin, rig);
  };
  const drawArmR = () => {
    Body.drawLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    Body.drawHand(ctx, rig.handR, colors.skin, rig);
  };
  if (lArmFwd >= rArmFwd) { drawArmR(); drawArmL(); }
  else                    { drawArmL(); drawArmR(); }

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  // Head and friends
  Body.drawNeck(ctx, rig, colors.skin);

  // Hair sits behind head, beard in front, eyes on top.
  Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  Body.drawEyesSouth(ctx, rig, colors.eyes);
  Body.drawBeard(ctx, rig, colors.hair, config.beardStyle || 'none');

  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

function drawNorth(ctx, config, offsets, hooks = {}) {
  const colors = resolveColors(config);
  const rig = buildRig(config, 'north', offsets);

  if (!offsets.skipGroundShadow) {
    VC.groundShadow(ctx, rig.frameW / 2, rig.groundY + rig.limbR * 0.6,
      rig.frameW * 0.22, rig.limbR * 0.6, 0.35);
  }

  if (hooks.before) hooks.before(ctx, rig, colors);

  const lFwd = offsets.leftLegFwd  || 0;
  const rFwd = offsets.rightLegFwd || 0;
  const drawL = () => {
    Body.drawLimb(ctx, rig.hipL, rig.kneeL, rig.footL, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawShoe(ctx, rig.footL, colors.shoes, rig, 'north');
  };
  const drawR = () => {
    Body.drawLimb(ctx, rig.hipR, rig.kneeR, rig.footR, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawShoe(ctx, rig.footR, colors.shoes, rig, 'north');
  };
  if (lFwd >= rFwd) { drawR(); drawL(); }
  else              { drawL(); drawR(); }

  Body.drawTorso(ctx, rig, colors.clothing, { chestCrease: false });
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);

  const drawArmL = () => {
    Body.drawLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    Body.drawHand(ctx, rig.handL, colors.skin, rig);
  };
  const drawArmR = () => {
    Body.drawLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    Body.drawHand(ctx, rig.handR, colors.skin, rig);
  };
  drawArmL(); drawArmR();

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  Body.drawNeck(ctx, rig, colors.skin);
  Body.drawHead(ctx, rig, colors.skin);
  Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  // No eyes / beard from behind.
  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

function drawWest(ctx, config, offsets, hooks = {}) {
  const colors = resolveColors(config);
  const rig = buildRig(config, 'west', offsets);

  if (!offsets.skipGroundShadow) {
    VC.groundShadow(ctx, rig.frameW / 2, rig.groundY + rig.limbR * 0.6,
      rig.frameW * 0.20, rig.limbR * 0.55, 0.35);
  }

  if (hooks.before) hooks.before(ctx, rig, colors);

  // Decide which leg/arm is "front" by smaller X (west = facing left, so
  // smaller X is closer to the camera-face).
  const lLegX = rig.footL.x;
  const rLegX = rig.footR.x;
  const frontLeg = lLegX <= rLegX ? 'L' : 'R';
  const backLeg  = frontLeg === 'L' ? 'R' : 'L';
  const drawLeg = (side) => {
    const hip  = side === 'L' ? rig.hipL  : rig.hipR;
    const knee = side === 'L' ? rig.kneeL : rig.kneeR;
    const foot = side === 'L' ? rig.footL : rig.footR;
    Body.drawLimb(ctx, hip, knee, foot, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawShoe(ctx, foot, colors.shoes, rig, 'west');
  };
  drawLeg(backLeg);

  // Back arm
  const lArmX = rig.handL.x;
  const rArmX = rig.handR.x;
  const frontArm = lArmX <= rArmX ? 'L' : 'R';
  const backArm  = frontArm === 'L' ? 'R' : 'L';
  const drawArm = (side) => {
    const sh = side === 'L' ? rig.shoulderL : rig.shoulderR;
    const el = side === 'L' ? rig.elbowL    : rig.elbowR;
    const hd = side === 'L' ? rig.handL     : rig.handR;
    Body.drawLimb(ctx, sh, el, hd, colors.clothing,
      { rootR: rig.limbR * 0.85, midR: rig.limbR * 0.78, tipR: rig.limbR * 0.7 });
    Body.drawHand(ctx, hd, colors.skin, rig);
  };
  drawArm(backArm);

  // Torso
  Body.drawTorso(ctx, rig, colors.clothing);

  // Front leg / front arm
  drawLeg(frontLeg);
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);
  drawArm(frontArm);

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  Body.drawNeck(ctx, rig, colors.skin);
  Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  Body.drawEyeWest(ctx, rig, colors.eyes);
  Body.drawBeard(ctx, rig, colors.hair, config.beardStyle || 'none');

  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

function drawEast(ctx, config, offsets, hooks = {}) {
  // Render west into a temp canvas, mirror, blit.
  const { canvas, ctx: tmp } = VC.makeCanvas(FRAME_W, FRAME_H);
  drawWest(tmp, config, offsets, hooks);
  const mirrored = VC.mirrorCanvasH(canvas);
  ctx.drawImage(mirrored, 0, 0);
}

// ---------------------------------------------------------------------------
// Frame entry
// ---------------------------------------------------------------------------

function directionOf(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

function generateFrame(config, animationName, frameOffset, hooks) {
  const { canvas, ctx } = VC.makeCanvas(FRAME_W, FRAME_H);
  VC.clear(ctx, FRAME_W, FRAME_H);
  const direction = directionOf(animationName);
  switch (direction) {
    case 'south': drawSouth(ctx, config, frameOffset, hooks); break;
    case 'north': drawNorth(ctx, config, frameOffset, hooks); break;
    case 'west':  drawWest (ctx, config, frameOffset, hooks); break;
    case 'east':  drawEast (ctx, config, frameOffset, hooks); break;
    default:      drawSouth(ctx, config, frameOffset, hooks); break;
  }
  return canvas;
}

module.exports = {
  generateFrame,
  drawSouth,
  drawNorth,
  drawWest,
  drawEast,
  resolveColors,
  directionOf,
};
