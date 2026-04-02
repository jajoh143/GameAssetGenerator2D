'use strict';

const { fillRect, pixel, hLine, vLine, fillEllipse, outlineRect } = require('../core/Canvas');
const Colors = require('../core/Colors');

/**
 * BaseCharacter provides shared drawing primitives used by all character types.
 * All drawing functions take a ctx (canvas context) and explicit color parameters.
 */

/**
 * Draw ground shadow ellipse under character.
 */
function drawGroundShadow(ctx, cx, y) {
  fillEllipse(ctx, Colors.GROUND_SHADOW, cx, y, 12, 3);
}

/**
 * Draw a shoe (south view).
 * x, y = top-left corner of shoe bounding box
 * w, h = dimensions
 */
function drawShoe(ctx, shoeColors, x, y, w, h) {
  // main shoe body
  fillRect(ctx, shoeColors.base, x, y, w, h);
  // highlight on top
  fillRect(ctx, shoeColors.highlight, x + 1, y, w - 3, 1);
  // sole line at bottom
  fillRect(ctx, shoeColors.sole || shoeColors.shadow, x, y + h - 1, w, 1);
  // outline
  outlineRect(ctx, shoeColors.outline, x, y, w, h);
}

/**
 * Draw a leg segment (south view).
 * x, y = top-left; w, h = size; pant colors
 */
function drawLeg(ctx, pantColors, x, y, w, h) {
  // main fill
  fillRect(ctx, pantColors.base, x, y, w, h);
  // highlight strip on left side
  vLine(ctx, pantColors.highlight, x + 1, y, h);
  // shadow on right side
  vLine(ctx, pantColors.shadow, x + w - 2, y, h);
  // outline
  outlineRect(ctx, pantColors.outline, x, y, w, h);
}

/**
 * Draw belt (south view).
 */
function drawBelt(ctx, beltColors, x, y, w, h) {
  fillRect(ctx, beltColors.base, x, y, w, h);
  // buckle in center
  const bx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, beltColors.buckle, bx, y, 3, h);
  // outline
  outlineRect(ctx, beltColors.outline, x, y, w, h);
}

/**
 * Draw the torso for jacket style.
 */
function drawTorsoJacket(ctx, clothingColors, x, y, w, h) {
  // main jacket body
  fillRect(ctx, clothingColors.base, x, y, w, h);

  // highlight on left side
  fillRect(ctx, clothingColors.highlight, x + 1, y + 1, 3, h - 2);

  // shadow on right side
  fillRect(ctx, clothingColors.shadow, x + w - 4, y + 1, 3, h - 2);

  // collar strip down center (visible shirt/inner collar)
  const cx = x + Math.floor(w / 2) - 1;
  fillRect(ctx, clothingColors.collar, cx, y, 3, Math.floor(h * 0.4));

  // lapels
  pixel(ctx, clothingColors.shadow, cx - 1, y + 2);
  pixel(ctx, clothingColors.shadow, cx + 3, y + 2);

  // outline
  outlineRect(ctx, clothingColors.outline, x, y, w, h);
}

/**
 * Draw the torso for hoodie style.
 */
function drawTorsoHoodie(ctx, clothingColors, x, y, w, h) {
  fillRect(ctx, clothingColors.base, x, y, w, h);

  // highlight
  fillRect(ctx, clothingColors.highlight, x + 1, y + 1, 3, h - 2);
  // shadow
  fillRect(ctx, clothingColors.shadow, x + w - 4, y + 1, 3, h - 2);

  // center kangaroo pocket at bottom
  const px = x + Math.floor(w / 2) - 4;
  const py = y + Math.floor(h * 0.6);
  fillRect(ctx, clothingColors.shadow, px, py, 8, Math.floor(h * 0.35));
  outlineRect(ctx, clothingColors.outline, px, py, 8, Math.floor(h * 0.35));

  // hood visible at top center
  const hx = x + Math.floor(w / 2) - 2;
  fillRect(ctx, clothingColors.collar, hx, y, 5, 3);

  outlineRect(ctx, clothingColors.outline, x, y, w, h);
}

/**
 * Draw the torso for apron style.
 * Draws a base shirt then white apron overlay.
 */
function drawTorsoApron(ctx, clothingColors, x, y, w, h) {
  // base shirt (blue/grey under)
  const underColor = clothingColors.base_base || '#7878A0';
  const underHighlight = clothingColors.base_highlight || '#A8A8B8';
  const underShadow = clothingColors.base_shadow || '#484870';
  fillRect(ctx, underColor, x, y, w, h);
  fillRect(ctx, underHighlight, x + 1, y + 1, 2, h - 2);
  fillRect(ctx, underShadow, x + w - 3, y + 1, 2, h - 2);

  // apron white overlay (narrower, centered)
  const ax = x + 3;
  const aw = w - 6;
  fillRect(ctx, clothingColors.base, ax, y + 2, aw, h - 2);
  fillRect(ctx, clothingColors.highlight, ax + 1, y + 3, 2, h - 4);
  fillRect(ctx, clothingColors.shadow, ax + aw - 3, y + 3, 2, h - 4);

  // apron tie strings at top
  fillRect(ctx, clothingColors.collar, x + 1, y, 2, 3);
  fillRect(ctx, clothingColors.collar, x + w - 3, y, 2, 3);

  outlineRect(ctx, clothingColors.outline, ax, y + 2, aw, h - 2);
  // shirt outline
  outlineRect(ctx, '#404060', x, y, w, h);
}

/**
 * Dispatch torso drawing by clothing type.
 */
function drawTorso(ctx, clothingKey, clothingColors, x, y, w, h) {
  if (clothingKey.startsWith('jacket')) {
    drawTorsoJacket(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('hoodie')) {
    drawTorsoHoodie(ctx, clothingColors, x, y, w, h);
  } else if (clothingKey.startsWith('apron')) {
    drawTorsoApron(ctx, clothingColors, x, y, w, h);
  } else {
    // fallback generic
    fillRect(ctx, clothingColors.base, x, y, w, h);
    outlineRect(ctx, clothingColors.outline, x, y, w, h);
  }
}

/**
 * Draw arm (south view).
 * x, y = top-left; w, h = size
 * clothingColors for sleeve; skinColors for hand
 */
function drawArm(ctx, clothingColors, skinColors, x, y, w, h) {
  const sleeveH = Math.floor(h * 0.7);
  const handH = h - sleeveH;

  // sleeve
  fillRect(ctx, clothingColors.base, x, y, w, sleeveH);
  vLine(ctx, clothingColors.highlight, x + 1, y, sleeveH);
  vLine(ctx, clothingColors.shadow, x + w - 2, y, sleeveH);
  outlineRect(ctx, clothingColors.outline, x, y, w, sleeveH);

  // hand
  fillRect(ctx, skinColors.base, x, y + sleeveH, w, handH);
  vLine(ctx, skinColors.highlight, x + 1, y + sleeveH, handH);
  outlineRect(ctx, skinColors.outline, x, y + sleeveH, w, handH);
}

/**
 * Draw neck.
 */
function drawNeck(ctx, skinColors, x, y, w, h) {
  fillRect(ctx, skinColors.base, x, y, w, h);
  vLine(ctx, skinColors.highlight, x + 1, y, h);
  vLine(ctx, skinColors.shadow, x + w - 2, y, h);
  outlineRect(ctx, skinColors.outline, x, y, w, h);
}

/**
 * Draw head (south view - facing camera).
 * x, y = top-left of head bounding box; w=18, h=18
 */
function drawHeadSouth(ctx, skinColors, hairColors, hairStyle) {
  const x = 23, y = 4, w = 18, h = 18;

  // head fill
  fillRect(ctx, skinColors.base, x, y, w, h);
  // highlight on upper-left
  fillRect(ctx, skinColors.highlight, x + 2, y + 2, 6, 5);
  // shadow on right side and chin
  fillRect(ctx, skinColors.shadow, x + w - 5, y + 4, 4, h - 8);
  fillRect(ctx, skinColors.shadow, x + 3, y + h - 5, w - 6, 4);
  // outline
  outlineRect(ctx, skinColors.outline, x, y, w, h);

  // --- FACE DETAILS ---
  // Eyes: 2x2 each, y≈13 (relative), x=26 left, x=35 right
  const eyeY = y + 9;
  // whites
  fillRect(ctx, '#FFFFFF', 26, eyeY, 2, 2);
  fillRect(ctx, '#FFFFFF', 35, eyeY, 2, 2);
  // pupils (brown)
  pixel(ctx, '#331100', 27, eyeY + 1);
  pixel(ctx, '#331100', 36, eyeY + 1);
  // eyebrow strokes
  hLine(ctx, skinColors.dark || skinColors.shadow, 26, eyeY - 2, 3);
  hLine(ctx, skinColors.dark || skinColors.shadow, 35, eyeY - 2, 3);

  // Nose: center, y≈17
  const noseY = y + 13;
  pixel(ctx, skinColors.shadow, 31, noseY);
  pixel(ctx, skinColors.shadow, 31, noseY + 1);

  // Mouth: 4px wide at y≈19
  const mouthY = y + 15;
  hLine(ctx, skinColors.dark || skinColors.shadow, 30, mouthY, 4);
  // smile corners
  pixel(ctx, skinColors.shadow, 29, mouthY);
  pixel(ctx, skinColors.shadow, 34, mouthY);

  // --- HAIR ---
  drawHairSouth(ctx, hairColors, hairStyle, x, y, w);
}

/**
 * Draw hair for south view.
 */
function drawHairSouth(ctx, hairColors, hairStyle, headX, headY, headW) {
  // Top of hair
  fillRect(ctx, hairColors.base, headX, headY, headW, 7);
  // highlight on top
  fillRect(ctx, hairColors.highlight, headX + 2, headY, headW - 5, 3);
  // shadow at hair line
  fillRect(ctx, hairColors.shadow, headX, headY + 5, headW, 2);
  // side burns / hair on sides
  fillRect(ctx, hairColors.base, headX, headY, 2, 11);
  fillRect(ctx, hairColors.base, headX + headW - 2, headY, 2, 11);

  if (hairStyle === 'medium') {
    // medium hair hangs a bit lower on sides
    fillRect(ctx, hairColors.base, headX, headY + 11, 2, 4);
    fillRect(ctx, hairColors.base, headX + headW - 2, headY + 11, 2, 4);
  } else if (hairStyle === 'long') {
    // long hair hangs past head bottom - drawn on sides
    fillRect(ctx, hairColors.base, headX, headY + 11, 2, 8);
    fillRect(ctx, hairColors.base, headX + headW - 2, headY + 11, 2, 8);
  }

  // re-outline top of head over hair
  outlineRect(ctx, '#111111', headX, headY, headW, 7);
}

/**
 * Draw head for north view (back of head, no face).
 */
function drawHeadNorth(ctx, skinColors, hairColors, hairStyle) {
  const x = 23, y = 4, w = 18, h = 18;

  // head fill (mostly hair from back)
  fillRect(ctx, skinColors.base, x, y, w, h);
  // bottom of head / neck area shows skin
  fillRect(ctx, skinColors.base, x + 2, y + 12, w - 4, 6);

  // hair covers most of head from back
  fillRect(ctx, hairColors.base, x, y, w, h - 5);
  fillRect(ctx, hairColors.highlight, x + 2, y, w - 5, 3);
  fillRect(ctx, hairColors.shadow, x, y + h - 8, w, 3);

  if (hairStyle === 'long') {
    // long hair goes below head
    fillRect(ctx, hairColors.base, x + 2, y + h - 3, w - 4, 6);
    fillRect(ctx, hairColors.shadow, x + 2, y + h, w - 4, 3);
  }

  outlineRect(ctx, '#111111', x, y, w, h);
}

/**
 * Draw head for side (west/east) view - profile.
 */
function drawHeadSide(ctx, skinColors, hairColors, hairStyle, facingRight) {
  // Profile head: narrower, ~12px wide, 16px tall
  // x position depends on direction; for west view centered around x=26-37
  const x = facingRight ? 26 : 26;
  const y = 5;
  const w = 12;
  const h = 16;

  fillRect(ctx, skinColors.base, x, y, w, h);
  fillRect(ctx, skinColors.highlight, x + (facingRight ? 1 : w - 3), y + 1, 3, 6);
  fillRect(ctx, skinColors.shadow, x + (facingRight ? w - 4 : 1), y + 4, 3, h - 8);
  outlineRect(ctx, skinColors.outline, x, y, w, h);

  // Eye (only one visible in profile)
  const eyeX = facingRight ? x + w - 4 : x + 2;
  const eyeY = y + 6;
  fillRect(ctx, '#FFFFFF', eyeX, eyeY, 2, 2);
  pixel(ctx, '#331100', eyeX + (facingRight ? 1 : 0), eyeY + 1);

  // Eyebrow
  hLine(ctx, skinColors.dark || skinColors.shadow, eyeX, eyeY - 2, 3);

  // Nose (tip visible in profile)
  const noseX = facingRight ? x + w - 2 : x + 1;
  pixel(ctx, skinColors.shadow, noseX, eyeY + 4);
  pixel(ctx, skinColors.shadow, noseX + (facingRight ? 1 : -1), eyeY + 5);

  // Mouth
  const mouthX = facingRight ? x + w - 4 : x + 2;
  hLine(ctx, skinColors.dark || skinColors.shadow, mouthX, eyeY + 7, 3);

  // Hair (profile view)
  fillRect(ctx, hairColors.base, x, y, w, 7);
  // back of hair
  const backHairX = facingRight ? x : x + w - 2;
  fillRect(ctx, hairColors.base, backHairX, y, 2, 14);
  fillRect(ctx, hairColors.highlight, x + (facingRight ? 0 : 2), y, w - 4, 3);
  outlineRect(ctx, '#111111', x, y, w, 7);
}

module.exports = {
  drawGroundShadow,
  drawShoe,
  drawLeg,
  drawBelt,
  drawTorso,
  drawArm,
  drawNeck,
  drawHeadSouth,
  drawHeadNorth,
  drawHeadSide,
  drawHairSouth,
};
