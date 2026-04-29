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
  const w  = head.r * 0.55;
  const h  = head.r * 0.45;
  ctx.save();
  ctx.fillStyle = skin.shadow || skin.base;
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.16);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.6, cy - h * 0.1);
  ctx.quadraticCurveTo(cx - w * 0.5, cy + h * 0.6, cx, cy + h * 0.7);
  ctx.quadraticCurveTo(cx + w * 0.5, cy + h * 0.6, cx + w * 0.6, cy - h * 0.1);
  ctx.quadraticCurveTo(cx, cy - h * 0.25, cx - w * 0.6, cy - h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = skin.outline || '#0c2010';
  ctx.beginPath();
  ctx.arc(cx - w * 0.2, cy + h * 0.1, h * 0.06, 0, Math.PI * 2);
  ctx.arc(cx + w * 0.2, cy + h * 0.1, h * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnoutWest(ctx, rig, skin) {
  const { head } = rig;
  const cx = head.x - head.r * 0.85;     // protrudes to the left (west view)
  const cy = head.y + head.r * 0.20;
  const w  = head.r * 0.55;
  const h  = head.r * 0.40;
  ctx.save();
  ctx.fillStyle = skin.shadow || skin.base;
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.16);
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.4, cy - h * 0.5);
  ctx.quadraticCurveTo(cx - w * 0.4, cy - h * 0.4, cx - w * 0.7, cy + h * 0.1);
  ctx.quadraticCurveTo(cx - w * 0.4, cy + h * 0.6, cx + w * 0.4, cy + h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Single nostril
  ctx.fillStyle = skin.outline || '#0c2010';
  ctx.beginPath();
  ctx.arc(cx - w * 0.45, cy, h * 0.07, 0, Math.PI * 2);
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
  switch (direction) {
    case 'south': Human.drawSouth(ctx, config, frameOffset, hooks); break;
    case 'north': Human.drawNorth(ctx, config, frameOffset, hooks); break;
    case 'west':  Human.drawWest (ctx, config, frameOffset, hooks); break;
    case 'east': {
      const { canvas: tmp, ctx: tmpCtx } = VC.makeCanvas(FRAME_W, FRAME_H);
      Human.drawWest(tmpCtx, config, frameOffset, hooks);
      ctx.drawImage(VC.mirrorCanvasH(tmp), 0, 0);
      break;
    }
    default: Human.drawSouth(ctx, config, frameOffset, hooks); break;
  }
  return canvas;
}

module.exports = { generateFrame };
