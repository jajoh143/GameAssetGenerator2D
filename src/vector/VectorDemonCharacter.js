'use strict';

/**
 * VectorDemonCharacter — tiefling. Same human body, plus horns + tail +
 * (optionally) glowing eyes (already handled by resolveColors via
 * `solid: true` in HumanCharacter).
 */

const VC     = require('./VectorCanvas');
const Body   = require('./VectorBaseCharacter');
const Human  = require('./VectorHumanCharacter');
const { FRAME_W, FRAME_H } = require('./VectorRig');

const HORN_LENGTH = { short: 0.55, medium: 0.85, long: 1.20 };
const TAIL_LENGTH = { short: 0.55, medium: 0.85, long: 1.20 };

function drawHornsSouth(ctx, rig, hornStyle, hornLen) {
  const { head } = rig;
  const len = head.r * (HORN_LENGTH[hornLen] || 0.85);
  const baseR = head.r * 0.13;
  const hornColor = '#3a1a14';
  const hornHi    = '#7a3220';

  for (const sign of [-1, 1]) {
    const rootX = head.x + head.r * 0.42 * sign;
    const rootY = head.y - head.r * 0.62;
    let tipX, tipY, ctrl1x, ctrl1y;
    if (hornStyle === 'straight') {
      tipX = rootX + sign * len * 0.25;
      tipY = rootY - len;
      ctrl1x = rootX + sign * len * 0.10;
      ctrl1y = rootY - len * 0.55;
    } else if (hornStyle === 'ram') {
      tipX = rootX + sign * len * 0.95;
      tipY = rootY - len * 0.20;
      ctrl1x = rootX + sign * len * 0.55;
      ctrl1y = rootY - len * 0.80;
    } else { // curved
      tipX = rootX + sign * len * 0.55;
      tipY = rootY - len * 0.85;
      ctrl1x = rootX + sign * len * 0.10;
      ctrl1y = rootY - len * 0.65;
    }

    // Front face
    ctx.save();
    const grad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
    grad.addColorStop(0, hornHi);
    grad.addColorStop(1, hornColor);
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1a0a06';
    ctx.lineWidth = Body.outlineW(rig, 0.16);

    ctx.beginPath();
    ctx.moveTo(rootX - sign * baseR, rootY);
    ctx.quadraticCurveTo(ctrl1x - sign * baseR * 0.4, ctrl1y, tipX, tipY);
    ctx.quadraticCurveTo(ctrl1x + sign * baseR * 0.4, ctrl1y + baseR * 0.4,
                         rootX + sign * baseR, rootY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawHornsNorth(ctx, rig, hornStyle, hornLen) {
  // Horns from behind look like two darker stubs sticking up.
  const { head } = rig;
  const len = head.r * (HORN_LENGTH[hornLen] || 0.85);
  const hornColor = '#2a120e';

  for (const sign of [-1, 1]) {
    const rootX = head.x + head.r * 0.42 * sign;
    const rootY = head.y - head.r * 0.62;
    const tipX = rootX + sign * len * 0.45;
    const tipY = rootY - len * 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(rootX + sign * len * 0.25, rootY - len * 0.5,
                         tipX, tipY);
    ctx.lineWidth = head.r * 0.30;
    ctx.lineCap = 'round';
    ctx.strokeStyle = hornColor;
    ctx.stroke();
    ctx.restore();
  }
}

function drawHornsWest(ctx, rig, hornStyle, hornLen) {
  const { head } = rig;
  const len = head.r * (HORN_LENGTH[hornLen] || 0.85);
  const baseR = head.r * 0.14;
  const rootX = head.x + head.r * 0.10;       // back of skull
  const rootY = head.y - head.r * 0.55;
  let tipX, tipY, ctrlX, ctrlY;
  if (hornStyle === 'straight') {
    tipX = rootX + len * 0.20; tipY = rootY - len;
    ctrlX = rootX + len * 0.10; ctrlY = rootY - len * 0.55;
  } else if (hornStyle === 'ram') {
    tipX = rootX + len * 0.85; tipY = rootY - len * 0.05;
    ctrlX = rootX + len * 0.55; ctrlY = rootY - len * 0.55;
  } else {
    tipX = rootX + len * 0.55; tipY = rootY - len * 0.80;
    ctrlX = rootX + len * 0.10; ctrlY = rootY - len * 0.65;
  }

  const grad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
  grad.addColorStop(0, '#7a3220');
  grad.addColorStop(1, '#3a1a14');
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#1a0a06';
  ctx.lineWidth = Body.outlineW(rig, 0.16);

  ctx.beginPath();
  ctx.moveTo(rootX - baseR, rootY);
  ctx.quadraticCurveTo(ctrlX - baseR * 0.4, ctrlY, tipX, tipY);
  ctx.quadraticCurveTo(ctrlX + baseR * 0.4, ctrlY + baseR * 0.4,
                       rootX + baseR, rootY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTail(ctx, rig, demonSkinPalette, tailLen, direction, frameIdx = 0) {
  const len = rig.frameH * 0.22 * (TAIL_LENGTH[tailLen] || 0.85);
  // Tail roots at lower-back / hip.
  const wave = Math.sin(frameIdx * 0.7) * len * 0.10;
  let rootX, rootY, tipX, tipY, midX, midY;
  if (direction === 'south' || direction === 'north') {
    // Tail loops out behind/beside character — south view shows tip peeking
    // past the right hip; north shows it more clearly.
    rootX = rig.pelvis.x + rig.pelvis.w * 0.3;
    rootY = rig.pelvis.y + rig.limbR * 0.3;
    midX  = rootX + len * 0.55 + wave;
    midY  = rootY + len * 0.10;
    tipX  = rootX + len * 0.85 + wave;
    tipY  = rootY - len * 0.45;
  } else {
    rootX = rig.pelvis.x + rig.pelvis.w * 0.15;
    rootY = rig.pelvis.y + rig.limbR * 0.3;
    midX  = rootX + len * 0.45 + wave;
    midY  = rootY + len * 0.10;
    tipX  = rootX + len * 0.65 + wave;
    tipY  = rootY - len * 0.40;
  }

  const tailColor = (demonSkinPalette && demonSkinPalette.shadow) || '#3a1010';
  const tailHi    = (demonSkinPalette && demonSkinPalette.base)   || '#7a2020';
  const tailRim   = (demonSkinPalette && demonSkinPalette.highlight) || '#a44040';

  ctx.save();
  ctx.lineCap = 'round';
  // Outline pass (slightly wider, dark)
  ctx.strokeStyle = tailColor;
  ctx.lineWidth = rig.limbR * 0.95;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();

  // Mid-tone body
  ctx.strokeStyle = tailHi;
  ctx.lineWidth = rig.limbR * 0.55;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();

  // Cel highlight — a thin lit-side stripe matching the body's top-left
  // light source. Rendered as a parallel curve offset slightly above
  // (less Y) the main tail line.
  ctx.strokeStyle = tailRim;
  ctx.lineWidth = rig.limbR * 0.22;
  ctx.beginPath();
  ctx.moveTo(rootX,                   rootY - rig.limbR * 0.20);
  ctx.quadraticCurveTo(midX, midY - rig.limbR * 0.20, tipX, tipY - rig.limbR * 0.15);
  ctx.stroke();
  ctx.restore();

  // Spade tip
  const ang = Math.atan2(tipY - midY, tipX - midX);
  const spadeR = rig.limbR * 0.7;
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(ang);
  ctx.fillStyle = tailColor;
  ctx.strokeStyle = '#1a0a06';
  ctx.lineWidth = Body.outlineW(rig, 0.16);
  ctx.beginPath();
  ctx.moveTo(-spadeR * 0.4, -spadeR * 0.6);
  ctx.lineTo(spadeR * 0.7,  0);
  ctx.lineTo(-spadeR * 0.4, spadeR * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Ear tufts — small fur / spike clumps protruding from each ear's
 * outer-upper edge. Drawn over the default human ears for a more
 * feral / monster-warrior read on muscular demons.
 */
function drawEarTufts(ctx, rig, hairColor) {
  const { head } = rig;
  const direction = rig.direction;
  const earR = head.r * 0.18;
  const tuftColor = hairColor || '#1a0a06';
  const tuftHi = '#3a1a14';
  const drawOne = (sign) => {
    const ex = head.x + sign * head.r * 0.95;
    const ey = head.y + head.r * 0.05;
    ctx.save();
    ctx.fillStyle = tuftColor;
    ctx.strokeStyle = '#100604';
    ctx.lineWidth = Body.outlineW(rig, 0.15);
    // Three small spikes fanning out from the ear's outer edge
    const spikes = [
      { angle: -0.55, len: 0.95 },
      { angle: -0.25, len: 1.20 },
      { angle:  0.05, len: 0.85 },
    ];
    for (const s of spikes) {
      const a = -Math.PI / 2 + s.angle * sign;
      const tipX = ex + sign * Math.cos(a) * earR * s.len;
      const tipY = ey + Math.sin(a) * earR * s.len;
      const baseW = earR * 0.30;
      const ax = ex + Math.cos(a + Math.PI / 2) * baseW * 0.5;
      const ay = ey + Math.sin(a + Math.PI / 2) * baseW * 0.5;
      const bx = ex - Math.cos(a + Math.PI / 2) * baseW * 0.5;
      const by = ey - Math.sin(a + Math.PI / 2) * baseW * 0.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Highlight on the lit side
      ctx.fillStyle = tuftHi;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo((ax + tipX) * 0.5, (ay + tipY) * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = tuftColor;
    }
    ctx.restore();
  };
  if (direction === 'south' || direction === 'north') {
    drawOne(-1);
    drawOne(1);
  } else if (direction === 'west') {
    drawOne(1);
  } else {
    drawOne(-1);
  }
}

/**
 * Shoulder spikes — small bone-spike triangles cresting each shoulder.
 * Drawn for muscular / heavy demon builds (the warrior archetype) on
 * south + north views. Adds a natural-armor / aggressive accent that
 * separates demons from generic humans even before the horns/tail
 * read.
 */
function drawShoulderSpikes(ctx, rig, demonSkinPalette) {
  const { shoulderL, shoulderR } = rig;
  const direction = rig.direction;
  if (direction === 'west' || direction === 'east') {
    // Side view: spikes only on the visible (nearer) shoulder.
    drawSpikeCluster(ctx, rig, direction === 'west' ? shoulderL : shoulderR,
      direction === 'west' ? -1 : 1, demonSkinPalette);
    return;
  }
  drawSpikeCluster(ctx, rig, shoulderL, -1, demonSkinPalette);
  drawSpikeCluster(ctx, rig, shoulderR,  1, demonSkinPalette);
}

function drawSpikeCluster(ctx, rig, shoulder, sign, palette) {
  const r = rig.limbR;
  const baseColor = '#3a1a14';
  const tipColor  = (palette && palette.shadow) || '#2a0a08';
  const hiColor   = (palette && palette.base)   || '#7a3220';
  // Three spikes per shoulder, fanning out + up + back.
  const spikes = [
    { angle: -0.45, len: 1.30 },     // back-leaning
    { angle: -0.10, len: 1.50 },     // up
    { angle:  0.30, len: 1.10 },     // forward-leaning
  ];
  ctx.save();
  for (const s of spikes) {
    const a = -Math.PI / 2 + s.angle * sign;
    const tipX = shoulder.x + sign * Math.cos(a) * r * s.len;
    const tipY = shoulder.y - 1 + Math.sin(a) * r * s.len;
    const baseW = r * 0.35;
    const ax = shoulder.x + Math.cos(a + Math.PI / 2) * baseW * 0.5;
    const ay = shoulder.y + Math.sin(a + Math.PI / 2) * baseW * 0.5;
    const bx = shoulder.x - Math.cos(a + Math.PI / 2) * baseW * 0.5;
    const by = shoulder.y - Math.sin(a + Math.PI / 2) * baseW * 0.5;
    // Body of the spike
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = '#1a0a06';
    ctx.lineWidth = Body.outlineW(rig, 0.16);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Highlight stripe on the lit side
    ctx.fillStyle = hiColor;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo((ax + tipX) * 0.5, (ay + tipY) * 0.5);
    ctx.closePath();
    ctx.fill();
    // Tip darker dot for sharpness
    ctx.fillStyle = tipColor;
    ctx.beginPath();
    ctx.arc(tipX, tipY, Math.max(0.6, r * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function generateFrame(config, animationName, frameOffset) {
  const direction = Human.directionOf(animationName);
  const hornStyle = config.hornStyle  || 'curved';
  const hornLen   = config.hornLength || 'medium';
  const tailLen   = config.tailLength || config.tailStyle || 'medium';
  // Demon defaults to muscular build — add shoulder spikes when the
  // resolved build is muscular / heavy. Caller can pass spikes:false to
  // disable on a slim/average demon build.
  const buildKey = config.build || 'muscular';
  const showSpikes = (config.spikes !== false) &&
    (buildKey === 'muscular' || buildKey === 'heavy');

  const hooks = {
    before(ctx, rig, colors) {
      // Tail goes BEHIND the body so the rear half occludes naturally.
      drawTail(ctx, rig, colors.skin, tailLen, direction, frameOffset.bodyY || 0);
    },
    afterBody(ctx, rig, colors) {
      // Shoulder spikes drawn after the body so they overlay the
      // shoulder seam (and any shoulder pad below).
      if (showSpikes) drawShoulderSpikes(ctx, rig, colors.skin);
    },
    afterHead(ctx, rig, colors) {
      // Ear tufts before horns so the horns overlay if they happen to
      // overlap the upper ear region.
      if (showSpikes) {
        const hairColor = (colors && colors.hair && colors.hair.shadow) || '#1a0a06';
        drawEarTufts(ctx, rig, hairColor);
      }
      if (direction === 'south') drawHornsSouth(ctx, rig, hornStyle, hornLen);
      else if (direction === 'north') drawHornsNorth(ctx, rig, hornStyle, hornLen);
      else drawHornsWest(ctx, rig, hornStyle, hornLen);
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
      // Render west then mirror.
      const { canvas: tmp, ctx: tmpCtx } = VC.makeCanvas(FRAME_W, FRAME_H);
      Human.drawWest(tmpCtx, config, frameOffset, hooks, meta);
      const mirrored = VC.mirrorCanvasH(tmp);
      ctx.drawImage(mirrored, 0, 0);
      break;
    }
    default: Human.drawSouth(ctx, config, frameOffset, hooks, meta); break;
  }
  return canvas;
}

module.exports = { generateFrame };
