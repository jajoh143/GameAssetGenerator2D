'use strict';

/**
 * VectorGoblinCharacter — small green-skinned humanoid with long pointed
 * ears and tiny fangs. Uses goblin skin tones (already wired into
 * resolveColors via type === 'goblin') and adds extras through hooks.
 */

const VC     = require('./VectorCanvas');
const Body   = require('./VectorBaseCharacter');
const Human  = require('./VectorHumanCharacter');
const Demon  = require('./VectorDemonCharacter');
const { FRAME_W, FRAME_H } = require('./VectorRig');

function drawEar(ctx, rig, sign, skin) {
  const { head } = rig;
  // Anchor the ear at the upper-temple: the new tapered head has its
  // widest point at the cheekbone (y=-0.05) so the ear root needs to
  // sit slightly higher (y=-0.10) and further out so it clearly attaches
  // OUTSIDE the head silhouette rather than vanishing inside it.
  const baseX = head.x + head.r * 0.92 * sign;
  const baseY = head.y - head.r * 0.10;
  const tipX  = baseX + sign * head.r * 0.95;
  const tipY  = baseY - head.r * 0.65;
  const earColor = skin.shadow || '#3a6a30';

  ctx.save();
  ctx.fillStyle = skin.base;
  ctx.strokeStyle = skin.outline || '#1a2a10';
  ctx.lineWidth = Body.outlineW(rig, 0.18);
  ctx.beginPath();
  // A more clearly pointy ear silhouette: wider at the base, sharp tip,
  // slightly back-swept.
  ctx.moveTo(baseX,                       baseY + head.r * 0.18);
  ctx.quadraticCurveTo(
    baseX + sign * head.r * 0.50, baseY - head.r * 0.65,
    tipX,                         tipY,
  );
  ctx.quadraticCurveTo(
    baseX + sign * head.r * 0.20, baseY - head.r * 0.05,
    baseX - sign * head.r * 0.10, baseY + head.r * 0.20,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Inner-ear shadow — a darker streak along the leading inner edge.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(baseX + sign * head.r * 0.10, baseY);
  ctx.quadraticCurveTo(
    baseX + sign * head.r * 0.40, baseY - head.r * 0.45,
    tipX - sign * head.r * 0.15, tipY + head.r * 0.25,
  );
  ctx.lineWidth = head.r * 0.12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = earColor;
  ctx.stroke();
  ctx.restore();

  // Ear-tip highlight rim (top-left lit edge)
  ctx.save();
  ctx.globalAlpha = 0.50;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY + head.r * 0.10);
  ctx.quadraticCurveTo(
    baseX + sign * head.r * 0.55, baseY - head.r * 0.45,
    tipX, tipY,
  );
  ctx.lineWidth = head.r * 0.05;
  ctx.lineCap = 'round';
  ctx.strokeStyle = skin.highlight || '#88c060';
  ctx.stroke();
  ctx.restore();
}

function drawFangs(ctx, rig) {
  const { head } = rig;
  const fangY = head.y + head.r * 0.50;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(head.x + sign * head.r * 0.10, fangY);
    ctx.lineTo(head.x + sign * head.r * 0.16, fangY + head.r * 0.18);
    ctx.lineTo(head.x + sign * head.r * 0.04, fangY + head.r * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#fffbe0';
    ctx.fill();
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = Body.outlineW(rig, 0.10);
    ctx.stroke();
  }
}

function generateFrame(config, animationName, frameOffset) {
  const direction = Human.directionOf(animationName);
  // Goblins can have horns (curved/straight/ram) — reuse the demon horn logic.
  const hornStyle = config.goblinHorns || 'none';
  const hornLen   = config.goblinHornLength || 'short';

  const hooks = {
    afterHead(ctx, rig, colors) {
      // Long pointed ears in south/west; only one ear visible from west/east.
      if (direction === 'south' || direction === 'north') {
        drawEar(ctx, rig, -1, colors.skin);
        drawEar(ctx, rig,  1, colors.skin);
      } else {
        drawEar(ctx, rig, -1, colors.skin);
      }
      // (Old drawFangs removed — the proper wide spiky-teeth mouth is
      // drawn by drawMouthSouth/drawMouthWest in VectorBaseCharacter,
      // which dispatches on rig.species === 'goblin'.)

      // Optional horns (reuse demon horn renderer with goblin params)
      if (hornStyle && hornStyle !== 'none') {
        const fakeConfig = { hornStyle, hornLength: hornLen };
        // Demon's horn helpers take (ctx, rig, hornStyle, hornLen)
        const demonModule = require('./VectorDemonCharacter');
        // Demon doesn't export horn helpers directly; replicate via internal renderer.
        // Use simplified inline horn draw matching DemonCharacter style.
        drawSmallHorn(ctx, rig, hornStyle, hornLen, direction);
        void demonModule; void fakeConfig;
      }
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

const HORN_LEN = { short: 0.40, medium: 0.65, long: 0.95 };
function drawSmallHorn(ctx, rig, style, lenKey, direction) {
  const { head } = rig;
  const len = head.r * (HORN_LEN[lenKey] || 0.40);
  const baseR = head.r * 0.10;
  const dirs = direction === 'south' || direction === 'north' ? [-1, 1] : [1];

  for (const sign of dirs) {
    const rootX = head.x + head.r * 0.45 * sign;
    const rootY = head.y - head.r * 0.55;
    let tipX, tipY, ctrlX, ctrlY;
    if (style === 'straight') {
      tipX = rootX + sign * len * 0.20; tipY = rootY - len;
      ctrlX = rootX + sign * len * 0.10; ctrlY = rootY - len * 0.55;
    } else if (style === 'ram') {
      tipX = rootX + sign * len * 0.85; tipY = rootY - len * 0.10;
      ctrlX = rootX + sign * len * 0.55; ctrlY = rootY - len * 0.55;
    } else { // curved
      tipX = rootX + sign * len * 0.55; tipY = rootY - len * 0.80;
      ctrlX = rootX + sign * len * 0.10; ctrlY = rootY - len * 0.65;
    }

    ctx.save();
    ctx.fillStyle = '#3a2008';
    ctx.strokeStyle = '#180a02';
    ctx.lineWidth = Body.outlineW(rig, 0.14);
    ctx.beginPath();
    ctx.moveTo(rootX - sign * baseR, rootY);
    ctx.quadraticCurveTo(ctrlX - sign * baseR * 0.4, ctrlY, tipX, tipY);
    ctx.quadraticCurveTo(ctrlX + sign * baseR * 0.4, ctrlY + baseR * 0.4,
                         rootX + sign * baseR, rootY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

module.exports = { generateFrame };
