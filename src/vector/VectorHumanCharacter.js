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
const Weapon = require('./VectorWeapon');
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
  // Eyebrows pick up the hair's shadow tone so brunettes get dark brows
  // and blondes get light. Bald/buzzed/bald-by-default species (goblin)
  // still need a sensible brow color — use a dark fallback.
  const hairPal = Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black;
  const brow = hairPal.shadow || hairPal.base || '#1a1010';
  const eyes = (config.type === 'demon' || config.type === 'fairy')
    ? Object.assign({}, baseEyes, { solid: true, brow })
    : Object.assign({}, baseEyes, { brow });

  // Style-driven clothing detail flags (lapels, pockets, sleeve cuff bands).
  const cs = config.clothingStyle || 'jacket';
  const detailFlags = {
    lapels:      ['jacket', 'bomber', 'coat'].includes(cs),
    pockets:     ['jacket', 'bomber', 'coat', 'apron', 'vest'].includes(cs),
    cuffBand:    ['jacket', 'bomber', 'coat', 'hoodie'].includes(cs),
    chestPocket: ['jacket', 'bomber', 'coat', 'shirt'].includes(cs),
  };

  return {
    skin,
    hair:     Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black,
    eyes,
    clothing,
    pants:    Colors.PANTS[config.pants] || Colors.PANTS.jeans_blue,
    shoes:    Colors.SHOES[config.shoes] || Colors.SHOES.shoe_black,
    belt:     Colors.BELT[config.beltColor] || Colors.BELT.standard,
    detailFlags,
  };
}

// ---------------------------------------------------------------------------
// Direction renderers
// ---------------------------------------------------------------------------

/**
 * `meta` describes the per-frame extras that aren't part of the offset
 * table itself — currently just whether this is an attack frame so the
 * action hand should be drawn as a fist, and which side is the action
 * arm. Resolved up-front from the animation name.
 */
function frameMeta(animationName, offsets, config) {
  const isAttack = !!animationName && animationName.startsWith('attack_');
  // South + North attacks swing the right arm; west attacks swing the left
  // (matches the direction-of-travel + animation tables in AnimationData).
  let actionSide = null;
  if (isAttack) {
    if (animationName.includes('west') || animationName.includes('east')) actionSide = 'L';
    else                                                                  actionSide = 'R';
  }
  // Weapon type per attack family — fairies get a wand instead of a gun.
  const species = config && config.type;
  const weapon = Weapon.weaponFor(animationName, species);
  // Find the "peak" frame for the visual flourish (sword strike or gun
  // fire). We tag based on the offset sign & magnitude — frames where the
  // action-side arm is fully extended.
  const fwd = actionSide === 'L' ? (offsets.leftArmFwd || 0) : (offsets.rightArmFwd || 0);
  const flash = animationName && animationName.startsWith('attack_shoot_') &&
                Math.abs(fwd) >= 12;
  // Glow color for fairy wand orb — pulled from the configured glow.
  let glow = null;
  if (species === 'fairy' && config) {
    const glowKey = config.glowColor || 'golden';
    const palette = Colors.FAIRY_GLOW && Colors.FAIRY_GLOW[glowKey];
    if (palette) glow = palette.bright || palette.base;
  }
  // Blink: idle's frame 2 carries `headBob: -1` (the breath beat). Use
  // that as the cheap "this is the up-tick of a breath, blink the eyes
  // here" tag — gives the idle animation a tiny bit of life. Skipped on
  // the attack frames so the action stays focused.
  const blink = animationName === 'idle' && offsets.headBob === -1;
  // Open mouth tag for attack frames at the peak — used by drawEyesSouth /
  // drawEyeWest to render a "battle cry" mouth instead of the soft smile.
  const openMouth = isAttack && Math.abs(fwd) >= 10;
  return { isAttack, actionSide, weapon, flash, blink, openMouth, glow };
}

function drawSouth(ctx, config, offsets, hooks = {}, meta = {}) {
  const colors = resolveColors(config);
  const rig = buildRig(config, 'south', offsets);

  // Ground shadow — shrinks when the character lifts off (negative bodyY
  // == higher up). Sells the "lift" on attack peak frames + walk passing
  // frames where the character bobs up.
  if (!offsets.skipGroundShadow) {
    const sx = rig.frameW * 0.22;
    const sy = rig.limbR * 0.6;
    const lift = Math.max(0, -((offsets.bodyY || 0) * (rig.frameH / 96)));
    const sScale = Math.max(0.55, 1 - lift * 0.04);
    const sAlpha = Math.max(0.15, 0.35 - lift * 0.025);
    VC.groundShadow(ctx, rig.frameW / 2, rig.groundY + rig.limbR * 0.6,
      sx * sScale, sy * sScale, sAlpha);
  }

  if (hooks.before) hooks.before(ctx, rig, colors);

  // Decide front/back leg ordering by which one is farther forward (y bigger).
  // The deeper leg should be drawn first, the shallower (in front) on top.
  const lFwd = offsets.leftLegFwd  || 0;
  const rFwd = offsets.rightLegFwd || 0;
  const drawL = () => {
    Body.drawLimb(ctx, rig.hipL, rig.kneeL, rig.footL, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawPantFold(ctx, rig.hipL, rig.kneeL, rig.footL, rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footL, rig.kneeL, rig, colors.pants);
    Body.drawShoe(ctx, rig.footL, colors.shoes, rig, 'south');
  };
  const drawR = () => {
    Body.drawLimb(ctx, rig.hipR, rig.kneeR, rig.footR, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawPantFold(ctx, rig.hipR, rig.kneeR, rig.footR, rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footR, rig.kneeR, rig, colors.pants);
    Body.drawShoe(ctx, rig.footR, colors.shoes, rig, 'south');
  };
  if (lFwd >= rFwd) { drawR(); drawL(); }
  else              { drawL(); drawR(); }

  // Body
  Body.drawTorso(ctx, rig, colors.clothing, colors.detailFlags);
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);

  // Arms — back arm first (smaller forward offset), then front
  const lArmFwd = offsets.leftArmFwd  || 0;
  const rArmFwd = offsets.rightArmFwd || 0;
  const drawArmL = () => {
    Body.drawLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    if (colors.detailFlags.cuffBand) {
      Body.drawCuff(ctx, rig.handL, rig.elbowL, rig, colors.clothing);
    }
    const fist = meta.isAttack && meta.actionSide === 'L';
    const toward = handToward(rig.elbowL, rig.handL);
    Body.drawHand(ctx, rig.handL, colors.skin, rig, { fist, toward });
  };
  const drawArmR = () => {
    Body.drawLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    if (colors.detailFlags.cuffBand) {
      Body.drawCuff(ctx, rig.handR, rig.elbowR, rig, colors.clothing);
    }
    const fist = meta.isAttack && meta.actionSide === 'R';
    const toward = handToward(rig.elbowR, rig.handR);
    Body.drawHand(ctx, rig.handR, colors.skin, rig, { fist, toward });
  };
  if (lArmFwd >= rArmFwd) { drawArmR(); drawArmL(); }
  else                    { drawArmL(); drawArmR(); }

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  // Head and friends
  Body.drawNeck(ctx, rig, colors.skin);

  // Layer order: a thin halo of hair pokes out behind the skull, then the
  // head, then the bulk of the wig sits ON TOP of the crown — this way
  // the hair is visible as actual mass rather than being hidden inside
  // the head silhouette. Eyes/beard go last so they aren't covered by
  // long-fringe hair styles.
  Body.drawHairHalo(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawEyesSouth(ctx, rig, colors.eyes, { blink: meta.blink, open: meta.openMouth });
  Body.drawBeard(ctx, rig, colors.hair, config.beardStyle || 'none');

  // Weapon — drawn LAST so it sits on top of everything (the action hand
  // grips it). Skipped when the animation isn't an attack.
  drawWeaponForFrame(ctx, rig, meta);

  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

/**
 * Render the weapon for an attack frame (if any). Pulls the action arm's
 * elbow→hand vector from the rig so the weapon orients correctly with
 * the current pose.
 */
function drawWeaponForFrame(ctx, rig, meta) {
  if (!meta || !meta.weapon || !meta.actionSide) return;
  const elbow = meta.actionSide === 'L' ? rig.elbowL : rig.elbowR;
  const hand  = meta.actionSide === 'L' ? rig.handL  : rig.handR;
  Weapon.drawWeapon(ctx, {
    weapon:  meta.weapon,
    handPos: hand,
    forward: handToward(elbow, hand),
    limbR:   rig.limbR,
    flash:   meta.flash,
  });
}

function drawNorth(ctx, config, offsets, hooks = {}, meta = {}) {
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
    Body.drawPantFold(ctx, rig.hipL, rig.kneeL, rig.footL, rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footL, rig.kneeL, rig, colors.pants);
    Body.drawShoe(ctx, rig.footL, colors.shoes, rig, 'north');
  };
  const drawR = () => {
    Body.drawLimb(ctx, rig.hipR, rig.kneeR, rig.footR, colors.pants,
      { rootR: rig.limbR, midR: rig.limbR * 0.95, tipR: rig.limbR * 0.85 });
    Body.drawPantFold(ctx, rig.hipR, rig.kneeR, rig.footR, rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footR, rig.kneeR, rig, colors.pants);
    Body.drawShoe(ctx, rig.footR, colors.shoes, rig, 'north');
  };
  if (lFwd >= rFwd) { drawR(); drawL(); }
  else              { drawL(); drawR(); }

  Body.drawTorso(ctx, rig, colors.clothing, Object.assign({ chestCrease: false }, colors.detailFlags));
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);

  const drawArmL = () => {
    Body.drawLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    if (colors.detailFlags.cuffBand) Body.drawCuff(ctx, rig.handL, rig.elbowL, rig, colors.clothing);
    const fist = meta.isAttack && meta.actionSide === 'L';
    Body.drawHand(ctx, rig.handL, colors.skin, rig, { fist, toward: handToward(rig.elbowL, rig.handL) });
  };
  const drawArmR = () => {
    Body.drawLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, colors.clothing,
      { rootR: rig.limbR * 0.9, midR: rig.limbR * 0.8, tipR: rig.limbR * 0.7 });
    if (colors.detailFlags.cuffBand) Body.drawCuff(ctx, rig.handR, rig.elbowR, rig, colors.clothing);
    const fist = meta.isAttack && meta.actionSide === 'R';
    Body.drawHand(ctx, rig.handR, colors.skin, rig, { fist, toward: handToward(rig.elbowR, rig.handR) });
  };
  drawArmL(); drawArmR();

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  Body.drawNeck(ctx, rig, colors.skin);
  Body.drawHairHalo(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  // North view shows the BACK of the head — most of the hair should be
  // visible. Drawing the full wig on top covers the bare skull.
  Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  // Weapon — drawn after head/hair so it sits on top.
  drawWeaponForFrame(ctx, rig, meta);
  // No eyes / beard from behind.
  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

function drawWest(ctx, config, offsets, hooks = {}, meta = {}) {
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
    // Outside-leg fold/seam line — only really reads in profile view.
    Body.drawPantFold(ctx, hip, knee, foot, rig, colors.pants);
    Body.drawPantCuff(ctx, foot, knee, rig, colors.pants);
    // Foot tilt: a foot that's lifted off the ground points its toes
    // downward; a planted foot stays flat. The shin direction (knee→foot
    // angle relative to vertical) is the cleanest cue.
    const dx = foot.x - knee.x, dy = foot.y - knee.y;
    const shinAngle = Math.atan2(dx, dy);   // 0 when straight down, +ve when leg leans forward
    const lift = (side === 'L' ? offsets.leftLegLift : offsets.rightLegLift) || 0;
    // Only tilt when the leg is lifted (toes point down for a "stepping"
    // look). Cap at ~25° so it doesn't look uncanny.
    const tilt = lift > 0 ? Math.max(-0.45, Math.min(0.45, -shinAngle * 0.8)) : 0;
    Body.drawShoe(ctx, foot, colors.shoes, rig, 'west', { tilt });
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
    if (colors.detailFlags.cuffBand) Body.drawCuff(ctx, hd, el, rig, colors.clothing);
    const fist = meta.isAttack && meta.actionSide === side;
    Body.drawHand(ctx, hd, colors.skin, rig, { fist, toward: handToward(el, hd) });
  };
  drawArm(backArm);

  // Torso
  Body.drawTorso(ctx, rig, colors.clothing, colors.detailFlags);

  // Front leg / front arm
  drawLeg(frontLeg);
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);
  drawArm(frontArm);

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  Body.drawNeck(ctx, rig, colors.skin);
  Body.drawHairHalo(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawEyeWest(ctx, rig, colors.eyes, { open: meta.openMouth });
  Body.drawBeard(ctx, rig, colors.hair, config.beardStyle || 'none');
  drawWeaponForFrame(ctx, rig, meta);

  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

function drawEast(ctx, config, offsets, hooks = {}, meta = {}) {
  // Render west into a temp canvas, mirror, blit.
  const { canvas, ctx: tmp } = VC.makeCanvas(FRAME_W, FRAME_H);
  drawWest(tmp, config, offsets, hooks, meta);
  const mirrored = VC.mirrorCanvasH(canvas);
  ctx.drawImage(mirrored, 0, 0);
}

// ---------------------------------------------------------------------------
// Frame entry
// ---------------------------------------------------------------------------

// Unit vector from elbow → hand, used to orient the fist's knuckle row
// so it points along the forearm (correct under any animation pose).
function handToward(elbow, hand) {
  const dx = hand.x - elbow.x, dy = hand.y - elbow.y;
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

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
  const meta = frameMeta(animationName, frameOffset, config);
  switch (direction) {
    case 'south': drawSouth(ctx, config, frameOffset, hooks, meta); break;
    case 'north': drawNorth(ctx, config, frameOffset, hooks, meta); break;
    case 'west':  drawWest (ctx, config, frameOffset, hooks, meta); break;
    case 'east':  drawEast (ctx, config, frameOffset, hooks, meta); break;
    default:      drawSouth(ctx, config, frameOffset, hooks, meta); break;
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
  frameMeta,
};
