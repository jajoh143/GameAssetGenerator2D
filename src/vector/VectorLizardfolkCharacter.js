'use strict';

/**
 * VectorLizardfolkCharacter — reptilian humanoid with a snout, scales,
 * tail, and small head crests. Uses the human body underneath (with
 * type === 'lizardfolk' so resolveColors picks LIZARD_SKIN).
 */

const VC     = require('./VectorCanvas');
const Body   = require('./VectorBaseCharacter');
const Human  = require('./VectorHumanCharacter');
const { FRAME_W, FRAME_H } = require('./VectorRig');

function drawSnoutSouth(ctx, rig, skin) {
  const { head } = rig;
  const cx = head.x;
  const cy = head.y + head.r * 0.32;
  const w  = head.r * 0.62;
  const h  = head.r * 0.50;
  ctx.save();
  // Snout silhouette (dragon-like — broader at the base, narrower at
  // the tip with a slight nasal bridge ridge).
  const grad = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
  grad.addColorStop(0,   skin.highlight || skin.base);
  grad.addColorStop(0.5, skin.base);
  grad.addColorStop(1,   skin.shadow || skin.base);
  ctx.fillStyle = grad;
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.18);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.65, cy - h * 0.1);
  ctx.quadraticCurveTo(cx - w * 0.55, cy + h * 0.65, cx - w * 0.10, cy + h * 0.78);
  ctx.lineTo(cx + w * 0.10, cy + h * 0.78);
  ctx.quadraticCurveTo(cx + w * 0.55, cy + h * 0.65, cx + w * 0.65, cy - h * 0.1);
  ctx.quadraticCurveTo(cx, cy - h * 0.30, cx - w * 0.65, cy - h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nasal bridge — a short central ridge line for definition.
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.10);
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.20);
  ctx.lineTo(cx, cy + h * 0.15);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Nostrils
  ctx.fillStyle = skin.outline || '#0c2010';
  ctx.beginPath();
  ctx.arc(cx - w * 0.22, cy + h * 0.10, h * 0.07, 0, Math.PI * 2);
  ctx.arc(cx + w * 0.22, cy + h * 0.10, h * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Mouth slit — a horizontal dark line dividing upper and lower jaw.
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.12);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.55, cy + h * 0.55);
  ctx.quadraticCurveTo(cx, cy + h * 0.62, cx + w * 0.55, cy + h * 0.55);
  ctx.stroke();

  // Sharp teeth — small triangular fangs peeking past the upper jaw line.
  ctx.fillStyle = '#fffbe0';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.06);
  for (const k of [-0.40, -0.18, 0.18, 0.40]) {
    const tx = cx + w * k;
    const ty = cy + h * 0.55;
    ctx.beginPath();
    ctx.moveTo(tx - w * 0.05, ty);
    ctx.lineTo(tx,             ty + h * 0.16);
    ctx.lineTo(tx + w * 0.05, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnoutWest(ctx, rig, skin) {
  const { head } = rig;
  const cx = head.x - head.r * 0.85;     // protrudes to the left (west view)
  const cy = head.y + head.r * 0.20;
  const w  = head.r * 0.60;
  const h  = head.r * 0.42;
  ctx.save();
  const grad = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
  grad.addColorStop(0,   skin.highlight || skin.base);
  grad.addColorStop(0.5, skin.base);
  grad.addColorStop(1,   skin.shadow || skin.base);
  ctx.fillStyle = grad;
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.18);
  // Snout outline — protrudes to the left, opens at the right where it
  // joins the head, with an upper-jaw and lower-jaw curve.
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.4, cy - h * 0.55);
  ctx.quadraticCurveTo(cx - w * 0.4, cy - h * 0.5,
                       cx - w * 0.78, cy + h * 0.05);
  ctx.quadraticCurveTo(cx - w * 0.40, cy + h * 0.65,
                       cx + w * 0.4, cy + h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mouth slit dividing upper and lower jaw
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.12);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.72, cy + h * 0.10);
  ctx.quadraticCurveTo(cx - w * 0.20, cy + h * 0.30,
                       cx + w * 0.40, cy + h * 0.20);
  ctx.stroke();

  // Visible teeth on the side — two sharp fangs poking past the lower jaw
  ctx.fillStyle = '#fffbe0';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.06);
  for (const k of [-0.55, -0.20, 0.15]) {
    const tx = cx + w * k;
    const ty = cy + h * (0.10 + Math.abs(k) * 0.18);
    ctx.beginPath();
    ctx.moveTo(tx - w * 0.05, ty);
    ctx.lineTo(tx,             ty + h * 0.18);
    ctx.lineTo(tx + w * 0.05, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Single nostril
  ctx.fillStyle = skin.outline || '#0c2010';
  ctx.beginPath();
  ctx.arc(cx - w * 0.50, cy - h * 0.05, h * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Eye on the snout (small reptilian eye)
  ctx.fillStyle = '#f6efe1';
  ctx.beginPath();
  ctx.arc(cx + w * 0.30, cy - h * 0.20, h * 0.10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0c0a04';
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.30, cy - h * 0.20, h * 0.04, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrest(ctx, rig, skin, direction) {
  const { head } = rig;
  // A row of small triangular spines along the top of the skull.
  const count = direction === 'south' || direction === 'north' ? 3 : 5;
  const startX = direction === 'west' ? head.x + head.r * 0.55 : head.x - head.r * 0.30;
  const dx = direction === 'west' ? -head.r * 0.20 : head.r * 0.30 * 1;
  const baseY = head.y - head.r * 0.85;
  ctx.save();
  ctx.fillStyle = skin.shadow || '#1a3010';
  ctx.strokeStyle = skin.outline || '#0c1808';
  ctx.lineWidth = Body.outlineW(rig, 0.12);
  for (let i = 0; i < count; i++) {
    const x = startX + i * (direction === 'west' ? dx : (head.r * 0.20));
    ctx.beginPath();
    ctx.moveTo(x - head.r * 0.07, baseY);
    ctx.lineTo(x,                 baseY - head.r * 0.30);
    ctx.lineTo(x + head.r * 0.07, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawTail(ctx, rig, skin, direction, frameIdx) {
  const len = rig.frameH * 0.30;
  const wave = Math.sin(frameIdx * 0.7) * len * 0.08;
  let rootX, rootY, midX, midY, tipX, tipY;
  if (direction === 'south' || direction === 'north') {
    rootX = rig.pelvis.x + rig.pelvis.w * 0.30;
    rootY = rig.pelvis.y + rig.limbR * 0.3;
    midX = rootX + len * 0.55 + wave; midY = rootY + len * 0.35;
    tipX = rootX + len * 1.0 + wave;  tipY = rootY + len * 0.10;
  } else {
    rootX = rig.pelvis.x + rig.pelvis.w * 0.18;
    rootY = rig.pelvis.y + rig.limbR * 0.3;
    midX = rootX + len * 0.55 + wave; midY = rootY + len * 0.30;
    tipX = rootX + len * 0.95 + wave; tipY = rootY + len * 0.05;
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = skin.shadow || '#1a3010';
  ctx.lineWidth = rig.limbR * 1.2;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();
  // Highlight stripe
  ctx.strokeStyle = skin.base;
  ctx.lineWidth = rig.limbR * 0.5;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();
  ctx.restore();
}

function generateFrame(config, animationName, frameOffset) {
  const direction = Human.directionOf(animationName);

  const hooks = {
    before(ctx, rig, colors) {
      drawTail(ctx, rig, colors.skin, direction, frameOffset.bodyY || 0);
    },
    afterHead(ctx, rig, colors) {
      // Snout overlay covers the (already-drawn) human eyes/mouth area.
      if (direction === 'south' || direction === 'north') {
        drawSnoutSouth(ctx, rig, colors.skin);
      } else {
        drawSnoutWest(ctx, rig, colors.skin);
      }
      drawCrest(ctx, rig, colors.skin, direction);
    },
  };

  const { canvas, ctx } = VC.makeCanvas(FRAME_W, FRAME_H);
  VC.clear(ctx, FRAME_W, FRAME_H);
  const meta = Human.frameMeta(animationName, frameOffset, config);
  switch (direction) {
    case 'south': Human.drawSouth(ctx, config, frameOffset, hooks, meta); break;
    case 'north': Human.drawNorth(ctx, config, frameOffset, hooks, meta); break;
    case 'west':  Human.drawWest (ctx, config, frameOffset, hooks, meta); break;
    case 'east': {
      const { canvas: tmp, ctx: tmpCtx } = VC.makeCanvas(FRAME_W, FRAME_H);
      Human.drawWest(tmpCtx, config, frameOffset, hooks, meta);
      ctx.drawImage(VC.mirrorCanvasH(tmp), 0, 0);
      break;
    }
    default: Human.drawSouth(ctx, config, frameOffset, hooks, meta); break;
  }
  return canvas;
}

module.exports = { generateFrame };
