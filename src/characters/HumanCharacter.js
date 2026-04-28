'use strict';

const { makeCanvas, fillRect, pixel, hLine, vLine, outlineRect, mirrorCanvasH, clear } = require('../core/Canvas');
const Colors = require('../core/Colors');
const {
  setBuild,
  drawGroundShadow,
  drawHeadSouth,
  drawHeadNorth,
  drawHeadWest,
  drawNeckSouth,
  drawTorsoSouth,
  drawTorsoWest,
  drawTankStrapsOverlaySouth,
  drawBeltSouth,
  drawBeltWest,
  drawLegsSouth,
  drawLegsWest,
  drawShoesSouth,
  drawShoesWest,
  drawArmsSouth,
  drawArmsWest,
  drawBackArmWest,
  drawFrontArmWest,
} = require('./BaseCharacter');

const FRAME_W = 64;
const FRAME_H = 96;

// Height presets: tweak leg + torso length. Head, neck, belt and shoe
// dimensions stay constant so chibi proportions are preserved (head looks
// relatively bigger on shorter characters, smaller on taller ones).
const HEIGHT_DIMS = {
  tiny:   { legH:  3, torsoH: 11 },   // pixie-tiny: very short legs (~24 px shorter)
  short:  { legH:  8, torsoH: 16 },   // ~10 px shorter than medium
  medium: { legH: 14, torsoH: 20 },   // baseline
  tall:   { legH: 18, torsoH: 22 },   // ~6 px taller than medium
};
function heightDims(config) {
  return HEIGHT_DIMS[config && config.height] || HEIGHT_DIMS.medium;
}

// ---------------------------------------------------------------------------
// Color resolver
// ---------------------------------------------------------------------------

function resolveColors(config) {
  // Skin: demon → DEMON_SKIN, fairy → FAIRY_SKIN, else regular skin tones.
  let skinColors;
  if (config.type === 'demon') {
    skinColors = Colors.DEMON_SKIN[config.demonSkin] || Colors.DEMON_SKIN.crimson;
  } else if (config.type === 'fairy') {
    const fs = Colors.FAIRY_SKIN[config.fairySkin] || Colors.FAIRY_SKIN.peach;
    // FAIRY_SKIN is missing deep_shadow — synthesize one from outline.
    skinColors = Object.assign({ deep_shadow: fs.outline }, fs);
  } else {
    skinColors = Colors.SKIN_TONES[config.skin] || Colors.SKIN_TONES.medium;
  }

  // Fairies default to a long 'robe' style with the chosen fairyDress colour;
  // demons + humans use the regular clothing style/colour pickers.
  let clothing, clothingStyle;
  if (config.type === 'fairy') {
    clothingStyle = config.clothingStyle || 'robe';
    const dressKey = config.fairyDress || 'petal_pink';
    const dressPal = Colors.FAIRY_DRESS[dressKey] || Colors.FAIRY_DRESS.petal_pink;
    // Map the fairy dress palette into the shape the human clothing draws expect.
    clothing = {
      highlight:   dressPal.highlight,
      base:        dressPal.base,
      shadow:      dressPal.shadow,
      deep_shadow: dressPal.outline,
      outline:     dressPal.outline,
      collar:      dressPal.shadow,
    };
  } else {
    clothingStyle = config.clothingStyle || 'jacket';
    const clothingColor = config.clothingColor || 'grey';
    clothing = Colors.resolveClothing(clothingStyle, clothingColor);
  }

  // For sleeveless styles, the arm draw functions take a skin-derived
  // palette so deltoid, bicep and forearm render as bare skin.
  const isSleeveless = clothingStyle === 'tank';
  const armClothing  = isSleeveless ? skinAsClothing(skinColors) : clothing;

  // Tieflings/demons get solid (no-sclera) eyes — the entire eye reads as
  // the iris colour for the glowing demonic look.
  const baseEyes = Colors.EYE_COLORS[config.eyes] || Colors.EYE_COLORS.brown;
  const eyeColors = config.type === 'demon'
    ? Object.assign({}, baseEyes, { solid: true })
    : baseEyes;

  return {
    skin:          skinColors,
    hair:          Colors.HAIR_COLORS[config.hair] || Colors.HAIR_COLORS.black,
    eyes:          eyeColors,
    clothing:      clothing,
    armClothing:   armClothing,
    clothingStyle: clothingStyle,
    pants:         Colors.PANTS[config.pants] || Colors.PANTS.jeans_blue,
    shoes:         Colors.SHOES[config.shoes] || Colors.SHOES.shoe_black,
    belt:          Colors.BELT[config.beltColor] || Colors.BELT.standard,
  };
}

// Adapt a skin-tone palette into the keys the arm draw functions expect
// (highlight / base / shadow / deep_shadow / outline / collar).
function skinAsClothing(skin) {
  return {
    highlight:   skin.highlight,
    base:        skin.base,
    shadow:      skin.shadow,
    deep_shadow: skin.outline,
    outline:     skin.outline,
    collar:      skin.shadow,
  };
}

// ---------------------------------------------------------------------------
// drawSouth  –  full front view
// ---------------------------------------------------------------------------

function drawSouth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY: rawBodyY = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftArmOut  = 0, rightArmOut  = 0,
    headBob: rawHeadBob = 0,
  } = offsets;

  // Scale pixel offsets from 64px animation data to 96px frame
  const bodyY  = Math.round(rawBodyY   * 1.5);
  const headBob = Math.round(rawHeadBob * 1.5);

  const base = 88 + bodyY; // bottom anchor (96px frame)

  // --- Ground shadow ---
  if (!offsets.skipGroundShadow) drawGroundShadow(ctx, 32, 86 + bodyY, 18, 4);

  // Activate the configured body build (slim/average/muscular/heavy) so
  // every clothing draw (which calls torsoSilhouette internally) picks it up.
  setBuild(config.build);

  // Proportional body stack — chibi proportions: shorter legs make head relatively larger.
  const dims = heightDims(config);
  const shoeH  = 5;
  const legH   = dims.legH;
  const beltH  = 3;
  const torsoH = dims.torsoH;
  const neckH  = 4;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - neckH;

  // Leg spread/depth multipliers scaled for proportions.
  const lLegDX = -Math.round(Math.abs(leftLegFwd)  * 0.4);
  const rLegDX =  Math.round(Math.abs(rightLegFwd) * 0.4);
  const lLegDY = Math.max(-4, Math.min(4, Math.round(leftLegFwd  * 0.6)));
  const rLegDY = Math.max(-4, Math.min(4, Math.round(rightLegFwd * 0.6)));

  // Arm Y offsets — increased multiplier for more fluid walking swing
  const lArmDY = Math.round(leftArmFwd  * 0.9);
  const rArmDY = Math.round(rightArmFwd * 0.9);

  // --- Draw order: back-to-front ---
  // Legs FIRST, shoes ON TOP — shoes are footwear and must overlay the
  // ankles, otherwise the leg's narrow bottom rows draw through the shoe.
  const forwardLeg = leftLegFwd > 0 ? 'left' : leftLegFwd < 0 ? 'right' : 'none';
  drawLegsSouth(ctx, colors.pants, lLegDX, rLegDX, legY, lLegDY, rLegDY, forwardLeg, legH);
  drawShoesSouth(ctx, colors.shoes, lLegDX, rLegDX, shoeY, lLegDY, rLegDY);
  if (config.belt !== false) drawBeltSouth(ctx, colors.belt, 20, beltY);
  drawTorsoSouth(ctx, colors.clothingStyle, colors.clothing, 20, torsoY, 24, torsoH, colors.skin);
  // Arms — sleeveless styles draw bare skin via an adapted palette.
  drawArmsSouth(ctx, colors.armClothing, colors.skin, lArmDY, rArmDY, leftArmOut, rightArmOut, torsoY);
  // Tank top: paint the shoulder straps on top of the deltoid so they cross
  // OVER the shoulder rather than sitting beside it on the chest.
  if (colors.clothingStyle === 'tank') {
    drawTankStrapsOverlaySouth(ctx, colors.clothing, 20, torsoY, 24);
  }
  // Neck
  drawNeckSouth(ctx, colors.skin, neckY);
  // Head — translate so its chin (at y=50 in drawHeadSouth) meets the
  // current neckY. For non-medium heights neckY shifts, so the head must
  // shift with it (otherwise a gap or overlap appears between head and neck).
  const headDeltaY = neckY - 50;
  ctx.save();
  ctx.translate(0, headBob + headDeltaY);
  drawHeadSouth(ctx, colors.skin, colors.hair, config.hairStyle || 'short', colors.eyes, config.beardStyle || 'none');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawNorth  –  back view
// ---------------------------------------------------------------------------

function drawNorth(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY: rawBodyY2 = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftArmOut  = 0, rightArmOut  = 0,
    headBob: rawHeadBob2 = 0,
  } = offsets;

  const bodyY  = Math.round(rawBodyY2   * 1.5);
  const headBob = Math.round(rawHeadBob2 * 1.5);

  const base = 88 + bodyY;

  setBuild(config.build);
  const dims = heightDims(config);
  const shoeH  = 5;
  const legH   = dims.legH;
  const beltH  = 3;
  const torsoH = dims.torsoH;
  const neckH  = 4;

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - neckH;

  const lLegDX = -Math.round(Math.abs(leftLegFwd)  * 0.4);
  const rLegDX =  Math.round(Math.abs(rightLegFwd) * 0.4);
  const lLegDY = Math.max(-4, Math.min(4, Math.round(leftLegFwd  * 0.6)));
  const rLegDY = Math.max(-4, Math.min(4, Math.round(rightLegFwd * 0.6)));
  const lArmDY = Math.round(leftArmFwd  * 0.9);
  const rArmDY = Math.round(rightArmFwd * 0.9);

  if (!offsets.skipGroundShadow) drawGroundShadow(ctx, 32, 86 + bodyY, 18, 4);

  const forwardLegN = leftLegFwd > 0 ? 'left' : leftLegFwd < 0 ? 'right' : 'none';
  drawLegsSouth(ctx, colors.pants,  lLegDX, rLegDX, legY, lLegDY, rLegDY, forwardLegN, legH);
  drawShoesSouth(ctx, colors.shoes, lLegDX, rLegDX, shoeY, lLegDY, rLegDY);
  if (config.belt !== false) drawBeltSouth(ctx, colors.belt, 20, beltY);

  // Back of torso — hourglass silhouette
  {
    const bx = 20, bw = 24, by = torsoY, bN = Math.min(torsoH, 20);
    const bSHOULDER = 3, bWS = 7, bWE = 13;
    const brl = (r) => {
      if (r < bSHOULDER)          return bx - 1;
      if (r >= bWS && r <= bWE)  return bx + 2;  // waist taper
      if (r > bWE)                return bx + 1;  // hip
      return bx;
    };
    const brr = (r) => {
      if (r < bSHOULDER)          return bx + bw;
      if (r >= bWS && r <= bWE)  return bx + bw - 3;  // waist taper
      if (r > bWE)                return bx + bw - 2;  // hip
      return bx + bw - 1;
    };

    for (let r = 0; r < bN; r++) {
      hLine(ctx, colors.clothing.base, brl(r), by + r, brr(r) - brl(r) + 1);
    }
    // Side panel shadows + center back highlight (back-lit rim light)
    for (let r = 0; r < bN; r++) {
      pixel(ctx, colors.clothing.shadow,    brl(r) + 1, by + r);
      pixel(ctx, colors.clothing.shadow,    brr(r) - 1, by + r);
      pixel(ctx, colors.clothing.highlight, Math.floor((brl(r) + brr(r)) / 2), by + r);
    }
    // Waist bridge pixels
    for (let r = bWS; r <= bWE; r++) {
      pixel(ctx, colors.clothing.shadow, bx, by + r);
      pixel(ctx, colors.clothing.shadow, bx + bw - 1, by + r);
    }
    // Armpit creases
    pixel(ctx, colors.clothing.shadow, bx - 1, by - 1);
    pixel(ctx, colors.clothing.shadow, bx + bw, by - 1);
    // Outlines
    hLine(ctx, colors.clothing.outline, bx - 1, by, bw + 2);
    for (let r = 1; r < bN - 1; r++) {
      pixel(ctx, colors.clothing.shadow, brl(r), by + r);
      pixel(ctx, colors.clothing.shadow, brr(r), by + r);
    }
    const bBotL = brl(bN - 1), bBotR = brr(bN - 1);
    hLine(ctx, colors.clothing.outline, bBotL, by + bN - 1, bBotR - bBotL + 1);
  }

  drawArmsSouth(ctx, colors.armClothing, colors.skin, lArmDY, rArmDY, leftArmOut, rightArmOut, torsoY);
  drawNeckSouth(ctx, colors.skin, neckY);

  // Head — translate so back-of-head chin (~y=50) meets neckY for non-medium heights.
  const headDeltaY = neckY - 50;
  ctx.save();
  ctx.translate(0, headBob + headDeltaY);
  drawHeadNorth(ctx, colors.skin, colors.hair, config.hairStyle || 'short');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawWest  –  side profile facing LEFT
// ---------------------------------------------------------------------------

function drawWest(ctx, config, offsets) {
  const colors = resolveColors(config);
  const {
    bodyY: rawBodyY3 = 0,
    leftLegFwd  = 0, rightLegFwd  = 0,
    leftArmFwd  = 0, rightArmFwd  = 0,
    leftLegLift = 0, rightLegLift = 0,
    headBob: rawHeadBob3 = 0,
  } = offsets;

  const bodyY  = Math.round(rawBodyY3   * 1.5);
  const headBob = Math.round(rawHeadBob3 * 1.5);

  const base = 88 + bodyY;

  setBuild(config.build);
  const dims = heightDims(config);
  const shoeH  = 5;
  const legH   = dims.legH;
  const beltH  = 3;
  const torsoH = dims.torsoH;  // match south for consistency

  const shoeY  = base - shoeH;
  const legY   = shoeY - legH;
  const beltY  = legY - beltH;
  const torsoY = beltY - torsoH;
  const neckY  = torsoY - 4;  // 4px neck bridges head bottom (y=49) to torso (y=54)

  const torsoX = 16;  // shifted -16 for 64px frame

  const leftLegX  = 23 - Math.round(leftLegFwd  * 1.1);
  const rightLegX = 23 - Math.round(rightLegFwd * 1.1);

  let frontLegCenter, backLegCenter, frontLegLift, backLegLift;
  if (leftLegX <= rightLegX) {
    frontLegCenter = leftLegX;   backLegCenter = rightLegX;
    frontLegLift   = leftLegLift; backLegLift  = rightLegLift;
  } else {
    frontLegCenter = rightLegX;  backLegCenter = leftLegX;
    frontLegLift   = rightLegLift; backLegLift = leftLegLift;
  }

  const frontArmDX = -Math.round(leftArmFwd  * 1.4);
  const backArmDX  = -Math.round(rightArmFwd * 1.4);

  if (!offsets.skipGroundShadow) drawGroundShadow(ctx, 23, 86 + bodyY, 18, 4);

  drawLegsWest(ctx, colors.pants, frontLegCenter, backLegCenter, legY, frontLegLift, backLegLift, legH);
  drawShoesWest(ctx, colors.shoes, frontLegCenter, backLegCenter, shoeY, frontLegLift, backLegLift);
  drawBackArmWest(ctx, colors.armClothing, colors.skin, backArmDX, torsoX, torsoY);
  if (config.belt !== false) drawBeltWest(ctx, colors.belt, torsoX, beltY);
  drawTorsoWest(ctx, colors.clothingStyle, colors.clothing, torsoX, torsoY, colors.skin);
  drawFrontArmWest(ctx, colors.armClothing, colors.skin, frontArmDX, torsoX, torsoY);
  // Neck (side) — 6px wide × 4px tall
  fillRect(ctx, colors.skin.base, torsoX + 3, neckY, 6, 4);
  outlineRect(ctx, colors.skin.outline, torsoX + 3, neckY, 6, 4);
  // Head — translate so chin (~y=49 in drawHeadWest) meets neckY for non-medium heights.
  // Medium baseline neckY is ~50, so headDeltaY = neckY - 50.
  const headDeltaY = neckY - 50;
  ctx.save();
  ctx.translate(0, bodyY + headBob + headDeltaY);
  drawHeadWest(ctx, colors.skin, colors.hair, config.hairStyle || 'short', colors.eyes, config.beardStyle || 'none');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// drawEast  –  mirror of west
// ---------------------------------------------------------------------------

function drawEast(ctx, config, offsets) {
  const { canvas: tmpCanvas, ctx: tmpCtx } = makeCanvas(FRAME_W, FRAME_H);
  drawWest(tmpCtx, config, offsets);
  const mirrored = mirrorCanvasH(tmpCanvas);
  ctx.drawImage(mirrored, 0, 0);
}

// ---------------------------------------------------------------------------
// generateFrame
// ---------------------------------------------------------------------------

function generateFrame(config, animationName, frameOffset) {
  const { canvas, ctx } = makeCanvas(FRAME_W, FRAME_H);
  clear(ctx, FRAME_W, FRAME_H);

  const direction = getDirectionFromAnim(animationName);

  switch (direction) {
    case 'south': drawSouth(ctx, config, frameOffset); break;
    case 'north': drawNorth(ctx, config, frameOffset); break;
    case 'west':  drawWest(ctx, config, frameOffset);  break;
    case 'east':  drawEast(ctx, config, frameOffset);  break;
    default:      drawSouth(ctx, config, frameOffset); break;
  }

  return canvas;
}

function getDirectionFromAnim(animName) {
  if (animName.includes('south') || animName === 'idle') return 'south';
  if (animName.includes('north')) return 'north';
  if (animName.includes('west'))  return 'west';
  if (animName.includes('east'))  return 'east';
  return 'south';
}

// Compute the y anchor points for a given config — used by demon/fairy
// renderers to position horns, tails, wings etc. relative to the chosen
// height. Returns { base, shoeY, legY, beltY, torsoY, neckY, headTopY }.
function getYAnchors(config) {
  const dims = heightDims(config);
  const base = 96;
  const shoeY  = base - 5;
  const legY   = shoeY - dims.legH;
  const beltY  = legY - 3;
  const torsoY = beltY - dims.torsoH;
  const neckY  = torsoY - 4;
  // The drawHeadSouth function plants chin at y=50 by default; we shift it
  // by neckY - 50 to bridge to the new neck. The head's top is therefore
  // at HY=21 + headDeltaY = 21 + (neckY - 50) = neckY - 29.
  const headTopY = neckY - 29;
  return { base, shoeY, legY, beltY, torsoY, neckY, headTopY };
}

module.exports = {
  generateFrame,
  drawSouth,
  drawNorth,
  drawWest,
  drawEast,
  resolveColors,
  heightDims,
  getYAnchors,
};
