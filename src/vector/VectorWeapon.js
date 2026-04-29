'use strict';

/**
 * VectorWeapon — renders a weapon (sword for swing animations, gun for
 * shoot animations) in the action hand for attack frames. Drawn in the
 * vector style: solid fill with a thin outline and a highlight stripe.
 *
 * The weapon's grip sits at the fist position and the rest extends along
 * the elbow→hand vector for natural alignment with whatever pose the
 * arm is in.
 */

const VC = require('./VectorCanvas');

/**
 * Pick the weapon type for an animation. Species can override the default
 * gun → wand for fey casters.
 */
function weaponFor(animationName, species) {
  if (!animationName) return null;
  if (animationName.startsWith('attack_swing_')) return 'sword';
  if (animationName.startsWith('attack_shoot_')) {
    return species === 'fairy' ? 'wand' : 'gun';
  }
  return null;
}

/**
 * Draw a sword extending from the action hand along the forearm direction.
 *
 *   handPos:   { x, y } — the fist's center
 *   forward:   unit vector { dx, dy } pointing from elbow to hand
 *   limbR:     forearm radius (used to size the weapon)
 */
function drawSword(ctx, handPos, forward, limbR) {
  const len = limbR * 5.0;
  const tx = handPos.x + forward.dx * len;
  const ty = handPos.y + forward.dy * len;

  // Perpendicular for the guard
  const px = -forward.dy, py = forward.dx;

  // 1. Cross-guard — a short bar across the wrist
  const guardW = limbR * 1.85;
  const guardH = limbR * 0.45;
  const gx1 = handPos.x + px * guardW * 0.5;
  const gy1 = handPos.y + py * guardW * 0.5;
  const gx2 = handPos.x - px * guardW * 0.5;
  const gy2 = handPos.y - py * guardW * 0.5;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3a2b14';
  ctx.lineWidth = guardH;
  ctx.beginPath();
  ctx.moveTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.stroke();
  ctx.strokeStyle = '#b59445';
  ctx.lineWidth = guardH * 0.55;
  ctx.beginPath();
  ctx.moveTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.stroke();
  ctx.restore();

  // 2. Blade — tapered quad from guard to tip
  const baseW = limbR * 0.55;
  const tipW  = limbR * 0.06;
  const baseX = handPos.x + forward.dx * limbR * 0.25;
  const baseY = handPos.y + forward.dy * limbR * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(baseX + px * baseW * 0.5, baseY + py * baseW * 0.5);
  ctx.lineTo(tx + px * tipW * 0.5,     ty + py * tipW * 0.5);
  ctx.lineTo(tx - px * tipW * 0.5,     ty - py * tipW * 0.5);
  ctx.lineTo(baseX - px * baseW * 0.5, baseY - py * baseW * 0.5);
  ctx.closePath();
  // Steel gradient along the blade (light → mid → light → tip glint)
  const grad = ctx.createLinearGradient(baseX, baseY, tx, ty);
  grad.addColorStop(0,   '#cfd6e0');
  grad.addColorStop(0.5, '#9ea7b3');
  grad.addColorStop(1,   '#e8edf4');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#2a2e36';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. Fuller (center-channel highlight)
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(tx, ty);
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1.0, baseW * 0.18);
  ctx.stroke();
  ctx.restore();

  // 4. Pommel — small ball at the bottom of the grip
  ctx.save();
  const pommelX = handPos.x - forward.dx * limbR * 0.85;
  const pommelY = handPos.y - forward.dy * limbR * 0.85;
  ctx.fillStyle = '#b59445';
  ctx.strokeStyle = '#3a2b14';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(pommelX, pommelY, limbR * 0.30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a small handgun in the action hand. Barrel extends along the
 * forearm direction.
 */
function drawGun(ctx, handPos, forward, limbR, opts = {}) {
  const len = limbR * 2.6;
  const w = limbR * 0.55;
  const px = -forward.dy, py = forward.dx;

  const baseX = handPos.x + forward.dx * limbR * 0.10;
  const baseY = handPos.y + forward.dy * limbR * 0.10;
  const tipX  = handPos.x + forward.dx * len;
  const tipY  = handPos.y + forward.dy * len;

  // Body of gun
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(baseX + px * w * 0.55, baseY + py * w * 0.55);
  ctx.lineTo(tipX  + px * w * 0.40, tipY  + py * w * 0.40);
  ctx.lineTo(tipX  - px * w * 0.40, tipY  - py * w * 0.40);
  ctx.lineTo(baseX - px * w * 0.55, baseY - py * w * 0.55);
  ctx.closePath();
  const grad = ctx.createLinearGradient(
    baseX - px * w, baseY - py * w,
    baseX + px * w, baseY + py * w,
  );
  grad.addColorStop(0,   '#5a5e6a');
  grad.addColorStop(0.5, '#2c2e36');
  grad.addColorStop(1,   '#15171b');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#0a0b10';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Trigger guard — small loop perpendicular below
  ctx.beginPath();
  const tgX = handPos.x - px * w * 0.55;
  const tgY = handPos.y - py * w * 0.55;
  ctx.fillStyle = '#1a1d24';
  ctx.arc(tgX, tgY, w * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Highlight stripe along the top
  ctx.strokeStyle = '#a0a4ae';
  ctx.globalAlpha = 0.50;
  ctx.lineWidth = Math.max(1.0, w * 0.15);
  ctx.beginPath();
  ctx.moveTo(baseX + px * w * 0.30, baseY + py * w * 0.30);
  ctx.lineTo(tipX  + px * w * 0.20, tipY  + py * w * 0.20);
  ctx.stroke();
  ctx.restore();

  // Muzzle flash on the FIRE frame (passed in via opts.flash)
  if (opts.flash) {
    ctx.save();
    const fx = tipX + forward.dx * w * 1.2;
    const fy = tipY + forward.dy * w * 1.2;
    const fr = w * 1.6;
    const grad2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
    grad2.addColorStop(0,   '#fff5b8');
    grad2.addColorStop(0.4, VC.hexAlpha('#ffaa20', 0.85));
    grad2.addColorStop(1,   VC.hexAlpha('#ff5500', 0));
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Wand — a thin wooden stick with a glowing crystal/orb at the tip. On
 * the FIRE frame, a magical bolt streams ahead of the orb in the
 * casting direction.
 *
 *   opts.glow:  inner color of the orb (default warm gold)
 *   opts.flash: true on the FIRE frame → adds magic bolt
 */
function drawWand(ctx, handPos, forward, limbR, opts = {}) {
  const orbColor = opts.glow || '#fff5b8';
  // Soft bloom on the hand + adjacent skin BEFORE the wand draws — this
  // way it tints the hand color rather than overpainting the wand body.
  // Drawn with screen blending so it brightens whatever's underneath.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.45;
  const handTip = {
    x: handPos.x + forward.dx * limbR * 4.0,
    y: handPos.y + forward.dy * limbR * 4.0,
  };
  const bloomGrad = ctx.createRadialGradient(
    handTip.x, handTip.y, 0,
    handTip.x, handTip.y, limbR * 3.5,
  );
  bloomGrad.addColorStop(0,   orbColor);
  bloomGrad.addColorStop(0.4, VC.hexAlpha(orbColor, 0.45));
  bloomGrad.addColorStop(1,   VC.hexAlpha(orbColor, 0));
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(handTip.x, handTip.y, limbR * 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const len = limbR * 4.0;
  const px = -forward.dy, py = forward.dx;

  const baseX = handPos.x + forward.dx * limbR * 0.10;
  const baseY = handPos.y + forward.dy * limbR * 0.10;
  const tipX  = handPos.x + forward.dx * len;
  const tipY  = handPos.y + forward.dy * len;
  void px; void py;

  // Wooden shaft — tapered slightly
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3a2008';
  ctx.lineWidth = limbR * 0.32;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  // Highlight stripe (lit side of the shaft)
  ctx.strokeStyle = '#8a5818';
  ctx.lineWidth = limbR * 0.14;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.restore();

  // Crystal orb at the tip — radial gradient from inner glow to outer color
  const orbR = limbR * 0.55;
  ctx.save();
  const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, orbR * 1.4);
  grad.addColorStop(0,   orbColor);
  grad.addColorStop(0.6, VC.hexAlpha(orbColor, 0.6));
  grad.addColorStop(1,   VC.hexAlpha(orbColor, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(tipX, tipY, orbR * 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Solid core
  ctx.fillStyle = orbColor;
  ctx.beginPath();
  ctx.arc(tipX, tipY, orbR * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Sparkle highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(tipX - orbR * 0.2, tipY - orbR * 0.25, orbR * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Magic bolt on the FIRE frame — a tapered streak shooting forward
  if (opts.flash) {
    const boltLen = limbR * 3.5;
    const bx = tipX + forward.dx * boltLen;
    const by = tipY + forward.dy * boltLen;
    ctx.save();
    const bgrad = ctx.createLinearGradient(tipX, tipY, bx, by);
    bgrad.addColorStop(0,   orbColor);
    bgrad.addColorStop(0.5, VC.hexAlpha(orbColor, 0.85));
    bgrad.addColorStop(1,   VC.hexAlpha(orbColor, 0));
    ctx.strokeStyle = bgrad;
    ctx.lineCap = 'round';
    ctx.lineWidth = limbR * 0.55;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // Sparkle dots along the bolt
    ctx.fillStyle = '#ffffff';
    for (const t of [0.2, 0.55, 0.85]) {
      const sx = tipX + (bx - tipX) * t;
      const sy = tipY + (by - tipY) * t;
      ctx.beginPath();
      ctx.arc(sx, sy, limbR * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Top-level dispatcher used from the human renderer's afterHead-equivalent
 * point. Draws the weapon for the given action arm + animation if any.
 *
 *   meta.weapon      : 'sword' | 'gun' | 'wand' (resolved by weaponFor)
 *   meta.handPos     : { x, y } of the fist
 *   meta.forward     : { dx, dy } unit forearm vector
 *   meta.limbR       : forearm radius
 *   meta.flash       : true on the strike/fire frame to add muzzle flash
 *   meta.glow        : optional hex (used for wand orb color)
 */
function drawWeapon(ctx, meta) {
  if (!meta || !meta.weapon) return;
  if (meta.weapon === 'sword') drawSword(ctx, meta.handPos, meta.forward, meta.limbR);
  else if (meta.weapon === 'gun')  drawGun (ctx, meta.handPos, meta.forward, meta.limbR, { flash: meta.flash });
  else if (meta.weapon === 'wand') drawWand(ctx, meta.handPos, meta.forward, meta.limbR, { flash: meta.flash, glow: meta.glow });
}

module.exports = {
  weaponFor,
  drawWeapon,
  drawSword,
  drawGun,
  drawWand,
};
