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
  // Muscular silhouette is drawn for explicit muscular / heavy builds OR
  // for species that default to one (demon → muscular, lizardfolk → heavy).
  const buildKey = config.build ||
    (config.type === 'demon' ? 'muscular' :
     config.type === 'lizardfolk' ? 'heavy' : 'average');
  const detailFlags = {
    lapels:      ['jacket', 'bomber', 'coat'].includes(cs),
    pockets:     ['jacket', 'bomber', 'coat', 'apron', 'vest'].includes(cs),
    cuffBand:    ['jacket', 'bomber', 'coat', 'hoodie'].includes(cs),
    chestPocket: ['jacket', 'bomber', 'coat', 'shirt'].includes(cs),
    // Pec V is drawn on bare-chest / sleeveless styles where it makes
    // anatomical sense — tank, vest, tshirt — for the muscular builds.
    muscular:    (buildKey === 'muscular' || buildKey === 'heavy') &&
                 ['tank', 'vest', 'tshirt'].includes(cs),
  };

  // Optional accessory palettes (hood, cape, shoulder pads). Each falls
  // back to the main clothing palette if its specific key isn't set.
  const hoodPalette = config.hoodColor
    ? (Colors.CLOTHING_COLORS && Colors.CLOTHING_COLORS[config.hoodColor]) || clothing
    : clothing;
  const capePalette = config.capeColor
    ? (Colors.CLOTHING_COLORS && Colors.CLOTHING_COLORS[config.capeColor]) || clothing
    : clothing;
  const shoulderPalette = config.shoulderColor
    ? (Colors.CLOTHING_COLORS && Colors.CLOTHING_COLORS[config.shoulderColor]) || clothing
    : clothing;
  const glovePalette = config.gloveColor
    ? (Colors.CLOTHING_COLORS && Colors.CLOTHING_COLORS[config.gloveColor]) || clothing
    : clothing;
  const wrapPalette = config.wrapColor
    ? (Colors.CLOTHING_COLORS && Colors.CLOTHING_COLORS[config.wrapColor]) || clothing
    : clothing;

  return {
    skin,
    hair:     Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black,
    eyes,
    clothing,
    hood:     hoodPalette,
    cape:     capePalette,
    shoulder: shoulderPalette,
    glove:    glovePalette,
    wrap:     wrapPalette,
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

  drawGroundShadow(ctx, rig, config, offsets);

  if (hooks.before) hooks.before(ctx, rig, colors);

  // Cape — drawn BEFORE the body so the body silhouette occludes the
  // front, leaving the cape visible as a fan around the legs and behind.
  if (config.cape) Body.drawCape(ctx, rig, colors.cape);

  // Decide front/back leg ordering by which one is farther forward (y bigger).
  // The deeper leg should be drawn first, the shallower (in front) on top.
  const lFwd = offsets.leftLegFwd  || 0;
  const rFwd = offsets.rightLegFwd || 0;
  const drawL = () => {
    Body.drawLimb(ctx, rig.hipL, rig.kneeL, rig.footL, colors.pants,
      { rootR: rig.limbR * 1.10, midR: rig.limbR * 0.82, tipR: rig.limbR * 0.62 });
    Body.drawPantFold(ctx, rig.hipL, rig.kneeL, rig.footL, rig, colors.pants);
    Body.drawKneeRidge(ctx, rig.kneeL, jointDir(rig.kneeL, rig.footL), rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footL, rig.kneeL, rig, colors.pants);
    Body.drawShoe(ctx, rig.footL, colors.shoes, rig, 'south');
  };
  const drawR = () => {
    Body.drawLimb(ctx, rig.hipR, rig.kneeR, rig.footR, colors.pants,
      { rootR: rig.limbR * 1.10, midR: rig.limbR * 0.82, tipR: rig.limbR * 0.62 });
    Body.drawPantFold(ctx, rig.hipR, rig.kneeR, rig.footR, rig, colors.pants);
    Body.drawKneeRidge(ctx, rig.kneeR, jointDir(rig.kneeR, rig.footR), rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footR, rig.kneeR, rig, colors.pants);
    Body.drawShoe(ctx, rig.footR, colors.shoes, rig, 'south');
  };
  if (lFwd >= rFwd) { drawR(); drawL(); }
  else              { drawL(); drawR(); }

  // Body — pelvis bridge first so the legs visibly attach to the
  // hip line, then the torso draws over the upper portion.
  Body.drawPelvisBridge(ctx, rig, colors.pants);
  Body.drawTorso(ctx, rig, colors.clothing, colors.detailFlags);
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);

  // Arms — back arm first (smaller forward offset), then front
  const lArmFwd = offsets.leftArmFwd  || 0;
  const rArmFwd = offsets.rightArmFwd || 0;
  const drawArmL = () => {
    Body.drawLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, colors.clothing,
      { rootR: rig.limbR * 0.95, midR: rig.limbR * 0.78, tipR: rig.limbR * 0.58 });
    if (config.forearmWraps) {
      Body.drawForearmWraps(ctx, rig.handL, rig.elbowL, rig, colors.wrap);
    }
    if (colors.detailFlags.cuffBand) {
      Body.drawCuff(ctx, rig.handL, rig.elbowL, rig, colors.clothing);
    }
    const fist = meta.isAttack && meta.actionSide === 'L';
    const toward = handToward(rig.elbowL, rig.handL);
    Body.drawHand(ctx, rig.handL, colors.skin, rig, { fist, toward });
    if (config.gloves) Body.drawGlove(ctx, rig.handL, colors.glove, rig,
      { fist, toward, elbow: rig.elbowL });
  };
  const drawArmR = () => {
    Body.drawLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, colors.clothing,
      { rootR: rig.limbR * 0.95, midR: rig.limbR * 0.78, tipR: rig.limbR * 0.58 });
    if (config.forearmWraps) {
      Body.drawForearmWraps(ctx, rig.handR, rig.elbowR, rig, colors.wrap);
    }
    if (colors.detailFlags.cuffBand) {
      Body.drawCuff(ctx, rig.handR, rig.elbowR, rig, colors.clothing);
    }
    const fist = meta.isAttack && meta.actionSide === 'R';
    const toward = handToward(rig.elbowR, rig.handR);
    Body.drawHand(ctx, rig.handR, colors.skin, rig, { fist, toward });
    if (config.gloves) Body.drawGlove(ctx, rig.handR, colors.glove, rig,
      { fist, toward, elbow: rig.elbowR });
  };
  if (lArmFwd >= rArmFwd) { drawArmR(); drawArmL(); }
  else                    { drawArmL(); drawArmR(); }

  // Shoulder pads — drawn AFTER arms so they cap the shoulder seam.
  if (config.shoulderPads) Body.drawShoulderPads(ctx, rig, colors.shoulder);

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
  // When the character is hooded, the hair is mostly hidden under the
  // hood — skip drawHair so it doesn't clip through the cowl.
  if (!config.hood) {
    Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  }
  Body.drawEyesSouth(ctx, rig, colors.eyes, { blink: meta.blink, open: meta.openMouth });
  Body.drawBeard(ctx, rig, colors.hair, config.beardStyle || 'none');

  // Hood — drawn LAST among the head pieces so it overlays hair + face
  // and casts its own shadow on the upper half of the face.
  if (config.hood) Body.drawHood(ctx, rig, colors.hood);

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

  drawGroundShadow(ctx, rig, config, offsets);

  if (hooks.before) hooks.before(ctx, rig, colors);

  // Cape — viewed from behind shows the most cape; drawn before the body
  // so the body/legs cut through it.
  if (config.cape) Body.drawCape(ctx, rig, colors.cape);

  const lFwd = offsets.leftLegFwd  || 0;
  const rFwd = offsets.rightLegFwd || 0;
  const drawL = () => {
    Body.drawLimb(ctx, rig.hipL, rig.kneeL, rig.footL, colors.pants,
      { rootR: rig.limbR * 1.10, midR: rig.limbR * 0.82, tipR: rig.limbR * 0.62 });
    Body.drawPantFold(ctx, rig.hipL, rig.kneeL, rig.footL, rig, colors.pants);
    Body.drawKneeRidge(ctx, rig.kneeL, jointDir(rig.kneeL, rig.footL), rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footL, rig.kneeL, rig, colors.pants);
    Body.drawShoe(ctx, rig.footL, colors.shoes, rig, 'north');
  };
  const drawR = () => {
    Body.drawLimb(ctx, rig.hipR, rig.kneeR, rig.footR, colors.pants,
      { rootR: rig.limbR * 1.10, midR: rig.limbR * 0.82, tipR: rig.limbR * 0.62 });
    Body.drawPantFold(ctx, rig.hipR, rig.kneeR, rig.footR, rig, colors.pants);
    Body.drawKneeRidge(ctx, rig.kneeR, jointDir(rig.kneeR, rig.footR), rig, colors.pants);
    Body.drawPantCuff(ctx, rig.footR, rig.kneeR, rig, colors.pants);
    Body.drawShoe(ctx, rig.footR, colors.shoes, rig, 'north');
  };
  if (lFwd >= rFwd) { drawR(); drawL(); }
  else              { drawL(); drawR(); }

  Body.drawPelvisBridge(ctx, rig, colors.pants);
  Body.drawTorso(ctx, rig, colors.clothing, Object.assign({ chestCrease: false }, colors.detailFlags));
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);

  const drawArmL = () => {
    Body.drawLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, colors.clothing,
      { rootR: rig.limbR * 0.95, midR: rig.limbR * 0.78, tipR: rig.limbR * 0.58 });
    if (config.forearmWraps) Body.drawForearmWraps(ctx, rig.handL, rig.elbowL, rig, colors.wrap);
    if (colors.detailFlags.cuffBand) Body.drawCuff(ctx, rig.handL, rig.elbowL, rig, colors.clothing);
    const fist = meta.isAttack && meta.actionSide === 'L';
    Body.drawHand(ctx, rig.handL, colors.skin, rig, { fist, toward: handToward(rig.elbowL, rig.handL) });
    if (config.gloves) Body.drawGlove(ctx, rig.handL, colors.glove, rig,
      { fist, toward: handToward(rig.elbowL, rig.handL), elbow: rig.elbowL });
  };
  const drawArmR = () => {
    Body.drawLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, colors.clothing,
      { rootR: rig.limbR * 0.95, midR: rig.limbR * 0.78, tipR: rig.limbR * 0.58 });
    if (config.forearmWraps) Body.drawForearmWraps(ctx, rig.handR, rig.elbowR, rig, colors.wrap);
    if (colors.detailFlags.cuffBand) Body.drawCuff(ctx, rig.handR, rig.elbowR, rig, colors.clothing);
    const fist = meta.isAttack && meta.actionSide === 'R';
    Body.drawHand(ctx, rig.handR, colors.skin, rig, { fist, toward: handToward(rig.elbowR, rig.handR) });
    if (config.gloves) Body.drawGlove(ctx, rig.handR, colors.glove, rig,
      { fist, toward: handToward(rig.elbowR, rig.handR), elbow: rig.elbowR });
  };
  drawArmL(); drawArmR();

  // Shoulder pads cap the back-shoulder seam.
  if (config.shoulderPads) Body.drawShoulderPads(ctx, rig, colors.shoulder);

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  Body.drawNeck(ctx, rig, colors.skin);
  Body.drawHairHalo(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  // North view shows the BACK of the head — most of the hair should be
  // visible. Drawing the full wig on top covers the bare skull.
  if (!config.hood) {
    Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  }
  // Hood overlays from behind too.
  if (config.hood) Body.drawHood(ctx, rig, colors.hood);
  // Weapon — drawn after head/hair so it sits on top.
  drawWeaponForFrame(ctx, rig, meta);
  // No eyes / beard from behind.
  if (hooks.afterHead) hooks.afterHead(ctx, rig, colors);
  return rig;
}

function drawWest(ctx, config, offsets, hooks = {}, meta = {}) {
  const colors = resolveColors(config);
  const rig = buildRig(config, 'west', offsets);

  drawGroundShadow(ctx, rig, config, offsets);

  if (hooks.before) hooks.before(ctx, rig, colors);

  // Cape draws first so the body silhouette occludes the front of it.
  if (config.cape) Body.drawCape(ctx, rig, colors.cape);

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
      { rootR: rig.limbR * 1.10, midR: rig.limbR * 0.82, tipR: rig.limbR * 0.62 });
    // Outside-leg fold/seam line — only really reads in profile view.
    Body.drawPantFold(ctx, hip, knee, foot, rig, colors.pants);
    Body.drawKneeRidge(ctx, knee, jointDir(knee, foot), rig, colors.pants);
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
      { rootR: rig.limbR * 0.88, midR: rig.limbR * 0.72, tipR: rig.limbR * 0.55 });
    if (config.forearmWraps) Body.drawForearmWraps(ctx, hd, el, rig, colors.wrap);
    if (colors.detailFlags.cuffBand) Body.drawCuff(ctx, hd, el, rig, colors.clothing);
    const fist = meta.isAttack && meta.actionSide === side;
    Body.drawHand(ctx, hd, colors.skin, rig, { fist, toward: handToward(el, hd) });
    if (config.gloves) Body.drawGlove(ctx, hd, colors.glove, rig,
      { fist, toward: handToward(el, hd), elbow: el });
  };
  drawArm(backArm);

  // Torso — pelvis bridge first so the legs visibly attach to the hip
  // line in profile.
  Body.drawPelvisBridge(ctx, rig, colors.pants);
  Body.drawTorso(ctx, rig, colors.clothing, colors.detailFlags);

  // Front leg / front arm
  drawLeg(frontLeg);
  if (config.belt !== false) Body.drawBelt(ctx, rig, colors.belt);
  drawArm(frontArm);

  // Shoulder pads cap both shoulders in profile.
  if (config.shoulderPads) Body.drawShoulderPads(ctx, rig, colors.shoulder);

  if (hooks.afterBody) hooks.afterBody(ctx, rig, colors);

  Body.drawNeck(ctx, rig, colors.skin);
  Body.drawHairHalo(ctx, rig, colors.hair, config.hairStyle || 'short');
  Body.drawHead(ctx, rig, colors.skin);
  if (!config.hood) {
    Body.drawHair(ctx, rig, colors.hair, config.hairStyle || 'short');
  }
  Body.drawEyeWest(ctx, rig, colors.eyes, { open: meta.openMouth });
  Body.drawBeard(ctx, rig, colors.hair, config.beardStyle || 'none');
  if (config.hood) Body.drawHood(ctx, rig, colors.hood);
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

// Per-build shadow size multiplier. Heavier characters cast a bigger
// shadow; slim/fairy characters cast a smaller one. Multiplier applied
// on top of the lift / animation shrink.
const BUILD_SHADOW_SCALE = {
  slim:     0.85,
  average:  1.00,
  muscular: 1.10,
  heavy:    1.25,
};
const SPECIES_SHADOW_SCALE = {
  fairy:      0.55,    // tiny pixie body → small shadow
  goblin:     0.85,
  lizardfolk: 1.20,
};

/**
 * Ground shadow renderer used by all four direction renderers.
 *
 *   - Tracks the average foot X so the shadow slides with the stride.
 *   - Shrinks + dims by lift (negative bodyY) so attack peak / passing
 *     frames clearly read as airborne.
 *   - Scales with build (slim → small, heavy → big) and species
 *     (fairy small, lizardfolk big).
 *   - Skipped when offsets.skipGroundShadow is set (used by hooks that
 *     want to render their own shadow, e.g. a fairy ground rune).
 */
function drawGroundShadow(ctx, rig, config, offsets) {
  if (offsets && offsets.skipGroundShadow) return;
  const buildKey = (config && config.build) ||
    (config && config.type === 'demon' ? 'muscular' :
     config && config.type === 'lizardfolk' ? 'heavy' :
     config && config.type === 'goblin' ? 'slim' : 'average');
  const buildMult   = BUILD_SHADOW_SCALE[buildKey] || 1.0;
  const speciesMult = (config && SPECIES_SHADOW_SCALE[config.type]) || 1.0;
  const sizeMult    = buildMult * speciesMult;

  const sx = rig.frameW * 0.22 * sizeMult;
  const sy = rig.limbR * 0.6 * sizeMult;
  const lift = Math.max(0, -((offsets && offsets.bodyY || 0) * (rig.frameH / 96)));
  const sScale = Math.max(0.55, 1 - lift * 0.04);
  const sAlpha = Math.max(0.15, 0.35 - lift * 0.025);
  const shadowX = (rig.footL.x + rig.footR.x) / 2;
  VC.groundShadow(ctx, shadowX, rig.groundY + rig.limbR * 0.6,
    sx * sScale, sy * sScale, sAlpha);
}

// Unit vector from one joint to another. Used for orienting features
// that follow a limb (fist knuckles, knee ridge, vambrace, etc.).
function jointDir(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

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
