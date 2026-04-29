'use strict';

/**
 * VectorFairyCharacter — pixie/fey humanoid: tiny body, large iridescent
 * wings, soft glow halo, glowing eyes.
 */

const Colors = require('../core/Colors');
const VC     = require('./VectorCanvas');
const Body   = require('./VectorBaseCharacter');
const Human  = require('./VectorHumanCharacter');
const { FRAME_W, FRAME_H } = require('./VectorRig');

const WING_SCALE   = { small: 0.85, medium: 1.05, large: 1.30 };
const GLOW_ALPHA   = { subtle: 0.30, medium: 0.55, bright: 0.85 };

function drawGlow(ctx, rig, glowColor, intensity) {
  const cx = rig.frameW / 2;
  const cy = (rig.head.y + rig.pelvis.y) / 2;
  const r  = rig.frameW * 0.42;
  const alpha = GLOW_ALPHA[intensity] || 0.55;
  const inner = (glowColor && glowColor.bright) || '#fff5b8';
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0,   inner);
  grad.addColorStop(0.4, hexToRGBA(inner, 0.25));
  grad.addColorStop(1,   hexToRGBA(inner, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, rig.frameW, rig.frameH);
  ctx.restore();
}

function hexToRGBA(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
  if (!m) return `rgba(255,245,184,${alpha})`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawWings(ctx, rig, wingColors, style, size, direction, frameIdx) {
  const scale = WING_SCALE[size] || 1.05;
  const beat  = Math.sin(frameIdx * 1.4) * 0.12 + 1.0;   // simple flap

  if (direction === 'south' || direction === 'north') {
    drawWingPair(ctx, rig, wingColors, style, scale * beat, /* mirror */ true);
  } else {
    // Side view: wings overlap to one side.
    drawWingPair(ctx, rig, wingColors, style, scale * beat, false);
  }
}

function drawWingPair(ctx, rig, wingColors, style, scale, mirrored) {
  // Wings root from the upper back / shoulder-blade region rather than
  // the chest center. In a south-facing pose this reads as the wings
  // emerging from behind the shoulders. The Y offset of -0.18*limbR
  // pulls the root slightly above chest top, near the shoulder line.
  const cx = rig.chest.x;
  const cy = rig.chest.y - rig.limbR * 0.18;
  const wingLen = rig.frameH * 0.32 * scale;     // toned down from 0.40
  const wingW   = rig.frameW * 0.26 * scale;     // toned down from 0.32

  const outer = (wingColors && wingColors.outer) || '#aee0ff';
  const inner = (wingColors && wingColors.inner) || '#dceeff';
  const veinC = (wingColors && wingColors.vein)  || '#5078a8';

  for (const sign of mirrored ? [-1, 1] : [-1]) {
    ctx.save();
    ctx.globalAlpha = 0.82;

    // ── Upper (large) wing — sweeps up-and-out from the shoulder ──
    let upper;
    if (style === 'dragonfly') {
      upper = [
        [cx + sign * wingW * 0.05, cy - wingLen * 0.05],
        [cx + sign * wingW * 0.30, cy - wingLen * 0.65],
        [cx + sign * wingW * 0.95, cy - wingLen * 0.75],
        [cx + sign * wingW * 1.20, cy - wingLen * 0.30],
        [cx + sign * wingW * 0.85, cy + wingLen * 0.05],
        [cx + sign * wingW * 0.30, cy - wingLen * 0.10],
      ];
    } else { // butterfly upper
      upper = [
        [cx + sign * wingW * 0.05, cy - wingLen * 0.10],
        [cx + sign * wingW * 0.45, cy - wingLen * 0.85],
        [cx + sign * wingW * 1.00, cy - wingLen * 0.65],
        [cx + sign * wingW * 1.15, cy - wingLen * 0.25],
        [cx + sign * wingW * 0.95, cy + wingLen * 0.05],
        [cx + sign * wingW * 0.50, cy - wingLen * 0.10],
      ];
    }
    const grad = ctx.createRadialGradient(
      cx + sign * wingW * 0.6, cy - wingLen * 0.4,  wingW * 0.2,
      cx + sign * wingW * 0.6, cy - wingLen * 0.4,  wingW * 1.1,
    );
    grad.addColorStop(0,   hexToRGBA(inner, 0.92));
    grad.addColorStop(0.7, hexToRGBA(outer, 0.65));
    grad.addColorStop(1,   hexToRGBA(outer, 0.30));
    VC.smoothBlob(ctx, upper, grad, hexToRGBA(veinC, 0.8), 1.4, 0.55);

    // ── Lower (smaller) wing — only butterfly style ──
    if (style !== 'dragonfly') {
      const lower = [
        [cx + sign * wingW * 0.10, cy + wingLen * 0.10],
        [cx + sign * wingW * 0.55, cy + wingLen * 0.20],
        [cx + sign * wingW * 0.85, cy + wingLen * 0.55],
        [cx + sign * wingW * 0.65, cy + wingLen * 0.80],
        [cx + sign * wingW * 0.20, cy + wingLen * 0.55],
      ];
      const lgrad = ctx.createRadialGradient(
        cx + sign * wingW * 0.5, cy + wingLen * 0.4,  wingW * 0.15,
        cx + sign * wingW * 0.5, cy + wingLen * 0.4,  wingW * 0.8,
      );
      lgrad.addColorStop(0,   hexToRGBA(inner, 0.85));
      lgrad.addColorStop(1,   hexToRGBA(outer, 0.30));
      VC.smoothBlob(ctx, lower, lgrad, hexToRGBA(veinC, 0.7), 1.2, 0.55);
    }

    // ── Vein detail ──
    ctx.strokeStyle = hexToRGBA(veinC, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + sign * wingW * 0.6, cy - wingLen * 0.45,
      cx + sign * wingW * 0.95, cy - wingLen * 0.20,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + sign * wingW * 0.55, cy - wingLen * 0.20,
      cx + sign * wingW * 1.00, cy - wingLen * 0.05,
    );
    ctx.stroke();

    // Iridescent shimmer dot near the wing tip
    ctx.save();
    ctx.globalAlpha = 0.45;
    VC.oval(ctx,
      cx + sign * wingW * 0.85, cy - wingLen * 0.45,
      wingW * 0.10, wingW * 0.06, '#ffffff', null);
    ctx.restore();

    ctx.restore();
  }
}

function generateFrame(config, animationName, frameOffset) {
  const direction = Human.directionOf(animationName);
  const wingStyle = config.wingStyle || 'butterfly';
  const wingSize  = config.wingSize  || 'medium';
  const wingPal   = Colors.FAIRY_WING[config.wingColor] || Colors.FAIRY_WING.crystal;
  const glowPal   = Colors.FAIRY_GLOW[config.glowColor] || Colors.FAIRY_GLOW.golden;
  const glowInten = config.glowIntensity || 'medium';
  // Frame counter for wing flap (use bodyY's parity as simple drive)
  const fIdx = Math.abs(frameOffset.bodyY || 0) + Math.abs(frameOffset.headBob || 0);

  const hooks = {
    before(ctx, rig) {
      // Glow halo BEHIND the body
      drawGlow(ctx, rig, glowPal, glowInten);
      // Wings ALWAYS render behind the body when facing (south) or facing
      // away (north) — both wings are anatomically behind the shoulders.
      // For side views the back wing draws here; the near-wing tip will
      // also be drawn on top via afterHead so it can overlap the body.
      drawWings(ctx, rig, wingPal, wingStyle, wingSize, direction, fIdx);
    },
    afterHead(ctx, rig) {
      // Side views only: a faint front overlay so the near-wing tip
      // appears to wrap slightly past the shoulder. South / North views
      // skip this — both wings sit fully behind the body and adding a
      // forward layer there breaks the silhouette.
      if (direction !== 'west' && direction !== 'east') return;
      ctx.save();
      ctx.globalAlpha = 0.35;
      drawWings(ctx, rig, wingPal, wingStyle, wingSize, direction, fIdx + 1);
      ctx.restore();
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
