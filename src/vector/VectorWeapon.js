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
 * Pick the weapon type for an animation, or null if the animation isn't
 * an attack.
 */
function weaponFor(animationName) {
  if (!animationName) return null;
  if (animationName.startsWith('attack_swing_')) return 'sword';
  if (animationName.startsWith('attack_shoot_')) return 'gun';
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
 * Top-level dispatcher used from the human renderer's afterHead-equivalent
 * point. Draws the weapon for the given action arm + animation if any.
 *
 *   meta.weapon      : 'sword' | 'gun' (resolved by weaponFor)
 *   meta.handPos     : { x, y } of the fist
 *   meta.forward     : { dx, dy } unit forearm vector
 *   meta.limbR       : forearm radius
 *   meta.flash       : true on the strike/fire frame to add muzzle flash
 */
function drawWeapon(ctx, meta) {
  if (!meta || !meta.weapon) return;
  if (meta.weapon === 'sword') drawSword(ctx, meta.handPos, meta.forward, meta.limbR);
  else if (meta.weapon === 'gun') drawGun(ctx, meta.handPos, meta.forward, meta.limbR, { flash: meta.flash });
}

module.exports = {
  weaponFor,
  drawWeapon,
  drawSword,
  drawGun,
};
