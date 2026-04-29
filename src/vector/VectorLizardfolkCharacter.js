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
  const r = head.r;
  // Bigger, more elongated snout than before. Anchored higher on the
  // face so the brow ridges sit right above the eyes. Slightly heavier
  // taper toward the tip (dragon-style).
  const cx = head.x;
  const cy = head.y + r * 0.30;
  const w  = r * 0.78;
  const h  = r * 0.62;

  ctx.save();
  ctx.fillStyle = skin.base;
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.22);

  // ── Snout silhouette ─────────────────────────────────────────────
  // Two-jaw shape: top muzzle (broad → narrow tip) + bottom jaw that
  // protrudes slightly past the upper lip. Drawn as a single closed
  // path with a clear lip line baked in.
  ctx.beginPath();
  // Top of muzzle (left → right) — angular ridge
  ctx.moveTo(cx - w * 0.85, cy - h * 0.05);
  ctx.lineTo(cx - w * 0.55, cy - h * 0.40);     // brow ridge corner
  ctx.lineTo(cx - w * 0.20, cy - h * 0.50);
  ctx.lineTo(cx + w * 0.20, cy - h * 0.50);
  ctx.lineTo(cx + w * 0.55, cy - h * 0.40);
  ctx.lineTo(cx + w * 0.85, cy - h * 0.05);
  // Right cheek + mandible
  ctx.lineTo(cx + w * 0.78, cy + h * 0.30);
  ctx.lineTo(cx + w * 0.50, cy + h * 0.78);
  ctx.lineTo(cx + w * 0.20, cy + h * 0.95);
  ctx.lineTo(cx,             cy + h * 1.00);
  ctx.lineTo(cx - w * 0.20, cy + h * 0.95);
  ctx.lineTo(cx - w * 0.50, cy + h * 0.78);
  ctx.lineTo(cx - w * 0.78, cy + h * 0.30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ── Cel shadow on the right half of the snout ────────────────────
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = skin.shadow || skin.outline;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.05, cy - h * 0.50);
  ctx.lineTo(cx + w * 0.85, cy - h * 0.05);
  ctx.lineTo(cx + w * 0.78, cy + h * 0.30);
  ctx.lineTo(cx + w * 0.50, cy + h * 0.78);
  ctx.lineTo(cx + w * 0.20, cy + h * 0.95);
  ctx.lineTo(cx + w * 0.10, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Brow ridges ─────────────────────────────────────────────────
  // Heavy bony ridges above each eye — the most "dragon" cue we can
  // add at this scale. Each is a wedge in skin.shadow with an outline.
  ctx.fillStyle = skin.shadow || '#1a3010';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.18);
  for (const sign of [-1, 1]) {
    const bx = cx + sign * w * 0.45;
    const by = cy - h * 0.55;
    ctx.beginPath();
    ctx.moveTo(bx - sign * w * 0.30, by + h * 0.10);
    ctx.lineTo(bx + sign * w * 0.05, by - h * 0.20);
    ctx.lineTo(bx + sign * w * 0.30, by + h * 0.05);
    ctx.lineTo(bx + sign * w * 0.20, by + h * 0.20);
    ctx.lineTo(bx - sign * w * 0.10, by + h * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── Scale plates on the muzzle ──────────────────────────────────
  // Two small diamond scales arranged down the bridge of the snout
  // (matching reference dragon-head tutorials' scale pattern).
  ctx.fillStyle = skin.shadow || '#1a3010';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.12);
  for (const sy of [-0.20, 0.05, 0.30]) {
    ctx.beginPath();
    ctx.moveTo(cx,            cy + h * (sy - 0.10));
    ctx.lineTo(cx + w * 0.10, cy + h * sy);
    ctx.lineTo(cx,            cy + h * (sy + 0.10));
    ctx.lineTo(cx - w * 0.10, cy + h * sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── Nostrils ────────────────────────────────────────────────────
  ctx.fillStyle = skin.outline || '#0c2010';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.20, cy + h * 0.55,
    h * 0.10, h * 0.07, -0.2, 0, Math.PI * 2);
  ctx.ellipse(cx + w * 0.20, cy + h * 0.55,
    h * 0.10, h * 0.07,  0.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Lip line + teeth ────────────────────────────────────────────
  // Mouth slit running ear-to-ear across the lower face.
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.16);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.78, cy + h * 0.72);
  ctx.quadraticCurveTo(cx, cy + h * 0.82, cx + w * 0.78, cy + h * 0.72);
  ctx.stroke();

  // Top jaw fangs — point DOWN past the lip line. Bigger center fangs
  // + smaller filler teeth on the sides for a clearer dragon look.
  ctx.fillStyle = '#fffbe0';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.08);
  const upperTeeth = [
    { x: -0.55, sz: 0.55 },
    { x: -0.30, sz: 0.95 },        // larger fang
    { x: -0.10, sz: 0.65 },
    { x:  0.10, sz: 0.65 },
    { x:  0.30, sz: 0.95 },        // larger fang
    { x:  0.55, sz: 0.55 },
  ];
  for (const t of upperTeeth) {
    const tx = cx + w * t.x;
    const ty = cy + h * 0.72;
    const tw = w * 0.07 * t.sz;
    const th = h * 0.16 * t.sz;
    ctx.beginPath();
    ctx.moveTo(tx - tw, ty);
    ctx.lineTo(tx,        ty + th);
    ctx.lineTo(tx + tw, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Bottom jaw — two prominent fangs poking UP past the lip line at
  // the corners. Sells the "underbite" reptilian look.
  for (const sign of [-1, 1]) {
    const tx = cx + sign * w * 0.42;
    const ty = cy + h * 0.92;
    const tw = w * 0.07;
    const th = h * 0.20;
    ctx.beginPath();
    ctx.moveTo(tx - tw, ty);
    ctx.lineTo(tx,        ty - th);
    ctx.lineTo(tx + tw, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnoutWest(ctx, rig, skin) {
  const { head } = rig;
  const r = head.r;
  // Side-view dragon snout — significantly longer + more angular than
  // before. Upper and lower jaws drawn as separate paths so a clear
  // mouth gap with teeth is visible between them.
  const cx = head.x - r * 0.95;        // pushed further forward (west = facing left)
  const cy = head.y + r * 0.18;
  const w  = r * 0.85;                 // longer snout
  const h  = r * 0.50;

  ctx.save();
  ctx.fillStyle = skin.base;
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.22);

  // ── Upper muzzle (top half + brow ridge) ─────────────────────────
  ctx.beginPath();
  // Back of muzzle (anchors into head)
  ctx.moveTo(cx + w * 0.55, cy - h * 0.70);
  // Brow ridge — angular bump above where the eye sits
  ctx.lineTo(cx + w * 0.30, cy - h * 0.95);
  ctx.lineTo(cx + w * 0.05, cy - h * 0.85);
  // Top of snout sloping down to the tip
  ctx.lineTo(cx - w * 0.40, cy - h * 0.55);
  ctx.lineTo(cx - w * 0.85, cy - h * 0.20);
  // Tip + flare for nostril area
  ctx.lineTo(cx - w * 0.95, cy + h * 0.10);
  // Bottom of upper lip — runs back along the mouth gap to the cheek
  ctx.lineTo(cx - w * 0.65, cy + h * 0.25);
  ctx.lineTo(cx - w * 0.20, cy + h * 0.30);
  ctx.lineTo(cx + w * 0.30, cy + h * 0.20);
  ctx.lineTo(cx + w * 0.55, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel shadow on the bottom-back of the upper muzzle
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = skin.shadow || skin.outline;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.55, cy - h * 0.30);
  ctx.lineTo(cx,             cy - h * 0.10);
  ctx.lineTo(cx - w * 0.65, cy + h * 0.25);
  ctx.lineTo(cx + w * 0.30, cy + h * 0.20);
  ctx.lineTo(cx + w * 0.55, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Lower jaw (separate piece — protrudes slightly past upper lip) ─
  ctx.fillStyle = skin.shadow || skin.base;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.55, cy + h * 0.20);
  ctx.lineTo(cx + w * 0.20, cy + h * 0.45);
  ctx.lineTo(cx - w * 0.30, cy + h * 0.65);
  ctx.lineTo(cx - w * 0.75, cy + h * 0.50);
  ctx.lineTo(cx - w * 0.85, cy + h * 0.30);
  ctx.lineTo(cx - w * 0.55, cy + h * 0.32);
  ctx.lineTo(cx - w * 0.10, cy + h * 0.40);
  ctx.lineTo(cx + w * 0.30, cy + h * 0.30);
  ctx.lineTo(cx + w * 0.55, cy + h * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ── Scale plates running down the top of the snout ──────────────
  ctx.fillStyle = skin.shadow || '#1a3010';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.10);
  // 4 scale diamonds along the muzzle top
  const scalePositions = [
    { x:  0.30, y: -0.85 },
    { x: -0.05, y: -0.78 },
    { x: -0.40, y: -0.55 },
    { x: -0.70, y: -0.30 },
  ];
  for (const s of scalePositions) {
    const sx = cx + w * s.x;
    const sy = cy + h * s.y;
    ctx.beginPath();
    ctx.moveTo(sx,             sy - h * 0.06);
    ctx.lineTo(sx + w * 0.05, sy);
    ctx.lineTo(sx,             sy + h * 0.06);
    ctx.lineTo(sx - w * 0.05, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── Nostril at the tip ──────────────────────────────────────────
  ctx.fillStyle = skin.outline || '#0c2010';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.78, cy - h * 0.05,
    h * 0.10, h * 0.07, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // ── Teeth — top jaw points DOWN, bottom jaw points UP, visible
  // along the mouth gap. ─────────────────────────────────────────
  ctx.fillStyle = '#fffbe0';
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.06);
  // Upper teeth (point down from upper jaw)
  const upper = [-0.70, -0.45, -0.20, 0.10, 0.35];
  for (let i = 0; i < upper.length; i++) {
    const tx = cx + w * upper[i];
    const ty = cy + h * 0.25;
    const big = i === 1;       // larger fang near the front
    const th = h * (big ? 0.22 : 0.13);
    ctx.beginPath();
    ctx.moveTo(tx - w * 0.05, ty);
    ctx.lineTo(tx,             ty + th);
    ctx.lineTo(tx + w * 0.05, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Lower fangs (point up from lower jaw, fewer + larger)
  for (const tx0 of [-0.50, -0.20, 0.15]) {
    const tx = cx + w * tx0;
    const ty = cy + h * 0.42;
    ctx.beginPath();
    ctx.moveTo(tx - w * 0.05, ty);
    ctx.lineTo(tx,             ty - h * 0.18);
    ctx.lineTo(tx + w * 0.05, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── Reptilian eye on the snout side ─────────────────────────────
  ctx.fillStyle = '#f6efe1';
  ctx.beginPath();
  ctx.arc(cx + w * 0.30, cy - h * 0.45, h * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = skin.outline || '#0c2010';
  ctx.lineWidth = Body.outlineW(rig, 0.08);
  ctx.stroke();
  // Vertical slit pupil
  ctx.fillStyle = '#0c0a04';
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.30, cy - h * 0.45,
    h * 0.04, h * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tiny catch-light
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx + w * 0.27, cy - h * 0.50, h * 0.03, 0, Math.PI * 2);
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
