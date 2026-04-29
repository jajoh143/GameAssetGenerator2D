'use strict';

/**
 * VectorBaseCharacter — body-part renderers for the vector pipeline.
 *
 * Each function takes (ctx, rig, palette, opts?) and draws one body region
 * by reading joint positions from the rig. The pixel pipeline puts each
 * piece in its own module; here they're grouped together because vector
 * shapes are tiny (a few path commands) and benefit from shared helpers.
 *
 * Conventions:
 *   • A "thin" outline (rim) is drawn around every body part — the vector
 *     equivalent of the 1-px outline used in the pixel pipeline.
 *   • Three-stop gradients (highlight → base → shadow) shade each part.
 *   • Clothing colours are pulled from the existing core/Colors palettes
 *     so the two pipelines share a colour vocabulary.
 */

const VC = require('./VectorCanvas');

// Default outline width relative to limb radius (keeps the rim visually
// consistent across height/build presets). Tuned thicker than CSS default
// because at chibi proportions a thin line gets lost in the shading —
// a stronger silhouette reads cleaner at any zoom.
function outlineW(rig, factor = 0.32) {
  return Math.max(2.0, rig.limbR * factor);
}

// ---------------------------------------------------------------------------
// Limbs
// ---------------------------------------------------------------------------

/**
 * Draw a 2-segment limb (shoulder → elbow → hand, or hip → knee → foot)
 * with tapered radii for a hand-drawn feel.
 *
 * Cel-shading approach (replaces the earlier 3-stop gradient + cross-axis
 * form-shadow + rim-light combo, which made limbs read as inflated tubes):
 *
 *   1. Solid base color across the whole limb — sharp, readable silhouette
 *   2. Single hard-edged shadow shape on the bottom-right (shadow side),
 *      filled with `palette.shadow`. The shadow path is the limb itself
 *      offset to one side and clipped to the limb body via source-atop.
 *   3. Strong outline stroke around the silhouette.
 *   4. Joint cap oval at the elbow / knee for a clean bend.
 */
function drawLimb(ctx, root, mid, tip, palette, opts = {}) {
  const r0 = opts.rootR || 1.0;
  const r1 = opts.midR  || 0.92;
  const r2 = opts.tipR  || 0.75;
  const lineWidth = opts.lineWidth || outlineW({ limbR: r0 }, 0.30);

  const base    = palette.base;
  const shadow  = palette.shadow || palette.base;
  const outline = palette.outline || '#000';

  // 1. Flat-fill the limb silhouette
  VC.limb(ctx, root.x, root.y, r0, mid.x, mid.y, r1, base, outline, lineWidth);
  VC.limb(ctx, mid.x,  mid.y,  r1, tip.x, tip.y, r2, base, outline, lineWidth);

  // 2. Hard-edged shadow band on the bottom-right side. The shadow shape
  // is the limb itself, but offset perpendicular toward the shadow side,
  // and clipped to the limb body so it reads as the right-half being
  // in shadow.
  const seg = (a, b, ra, rb) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;     // perpendicular (right side of arm)
    // Offset both ends ~40% of the radius toward the shadow side.
    const offA = { x: a.x + nx * ra * 0.45, y: a.y + ny * ra * 0.45 };
    const offB = { x: b.x + nx * rb * 0.45, y: b.y + ny * rb * 0.45 };
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    VC.limb(ctx, offA.x, offA.y, ra, offB.x, offB.y, rb, shadow, null, 0);
    ctx.restore();
  };
  seg(root, mid, r0, r1);
  seg(mid,  tip, r1, r2);

  // 3. Joint cap — a small filled oval that smooths the bend.
  VC.oval(ctx, mid.x, mid.y, r1 * 0.95, r1 * 0.92, shadow, null);
}

/**
 * Hand — drawn as a chibi mitten: a rounded silhouette with a thumb
 * notch on one side and a single palm-crease line. Reads as a hand
 * rather than a "skin pebble".
 *
 *   opts.fist:    draw closed fist (knuckle ridges instead of palm crease)
 *   opts.toward:  unit vector { dx, dy } from elbow → hand. Used to
 *                 orient the thumb (which always sits on the elbow side
 *                 of the hand) and the knuckle ridges.
 */
function drawHand(ctx, hand, skin, rig, opts = {}) {
  const r = rig.limbR * (opts.fist ? 1.20 : 1.10);
  const tx = (opts.toward && opts.toward.dx) || 0;
  const ty = (opts.toward && opts.toward.dy) || 1;
  const len = Math.hypot(tx, ty) || 1;
  const ux = tx / len, uy = ty / len;
  const px = -uy, py = ux;       // perpendicular (the "thumb side")

  // Mitten silhouette: rounded body + thumb bump on one side.
  // The thumb sits on +perpendicular for symmetry with how the rig
  // orients itself in screen coordinates.
  ctx.save();
  ctx.fillStyle = skin.base;
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = outlineW(rig, 0.30);
  ctx.beginPath();
  // Start at the wrist and trace around the mitten. Use the forearm
  // axis (ux, uy) and the perpendicular (px, py) as a local frame.
  const wx = hand.x - ux * r * 0.40;   // wrist center
  const wy = hand.y - uy * r * 0.40;
  // Wrist edge (thumb side)
  ctx.moveTo(wx + px * r * 0.55, wy + py * r * 0.55);
  // Thumb bump
  ctx.quadraticCurveTo(
    wx + ux * r * 0.20 + px * r * 1.05, wy + uy * r * 0.20 + py * r * 1.05,
    wx + ux * r * 0.55 + px * r * 0.85, wy + uy * r * 0.55 + py * r * 0.85,
  );
  // Notch between thumb and fingers
  ctx.quadraticCurveTo(
    hand.x + ux * r * 0.30 + px * r * 0.55, hand.y + uy * r * 0.30 + py * r * 0.55,
    hand.x + ux * r * 0.95 + px * r * 0.45, hand.y + uy * r * 0.95 + py * r * 0.45,
  );
  // Fingertip arc (forward edge of the mitten)
  ctx.quadraticCurveTo(
    hand.x + ux * r * 1.20,                  hand.y + uy * r * 1.20,
    hand.x + ux * r * 0.95 - px * r * 0.55,  hand.y + uy * r * 0.95 - py * r * 0.55,
  );
  // Pinky-side wrist
  ctx.quadraticCurveTo(
    wx + ux * r * 0.30 - px * r * 0.65, wy + uy * r * 0.30 - py * r * 0.65,
    wx - px * r * 0.50,                  wy - py * r * 0.50,
  );
  // Wrist-bottom (closing)
  ctx.quadraticCurveTo(
    wx, wy,
    wx + px * r * 0.55, wy + py * r * 0.55,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel shadow on the pinky side (opposite the thumb, which is the
  // shadow side because top-left light hits the thumb).
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = skin.shadow || skin.outline;
  ctx.beginPath();
  ctx.moveTo(wx - px * r * 0.50, wy - py * r * 0.50);
  ctx.quadraticCurveTo(
    hand.x + ux * r * 0.55 - px * r * 0.85, hand.y + uy * r * 0.55 - py * r * 0.85,
    hand.x + ux * r * 1.05 - px * r * 0.20, hand.y + uy * r * 1.05 - py * r * 0.20,
  );
  ctx.lineTo(hand.x + ux * r * 0.40, hand.y + uy * r * 0.40);
  ctx.lineTo(wx - px * r * 0.20, wy - py * r * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Palm crease (open hand) or knuckle ridges (fist).
  ctx.save();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = Math.max(1.0, r * 0.14);
  ctx.lineCap = 'round';
  if (opts.fist) {
    // Three short knuckle dashes across the front of the hand.
    for (const k of [-0.45, 0.0, 0.45]) {
      const cx = hand.x + ux * r * 0.55 + px * r * k * 0.6;
      const cy = hand.y + uy * r * 0.55 + py * r * k * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - ux * r * 0.18, cy - uy * r * 0.18);
      ctx.lineTo(cx + ux * r * 0.18, cy + uy * r * 0.18);
      ctx.stroke();
    }
  } else {
    // Single curved palm crease running from thumb-base to pinky.
    ctx.beginPath();
    ctx.moveTo(
      hand.x + ux * r * 0.10 + px * r * 0.55,
      hand.y + uy * r * 0.10 + py * r * 0.55,
    );
    ctx.quadraticCurveTo(
      hand.x + ux * r * 0.40, hand.y + uy * r * 0.40,
      hand.x + ux * r * 0.30 - px * r * 0.45,
      hand.y + uy * r * 0.30 - py * r * 0.45,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Glove — paints a glove silhouette over the hand in glove color, with
 * a darker cel shadow on the right and an optional vambrace cuff that
 * extends up the forearm. Pairs with the existing sleeve drawCuff to
 * produce a full vambrace look on jackets / hoodies / coats.
 *
 *   palette:    glove color (any clothing palette)
 *   opts.fist:  closed-fist variant (knuckle ridges)
 *   opts.toward:unit elbow→hand vector for orientation
 *   opts.elbow: optional elbow joint — when present, adds the vambrace
 *               cuff extending up the forearm.
 */
function drawGlove(ctx, hand, palette, rig, opts = {}) {
  const r = rig.limbR * (opts.fist ? 1.20 : 1.10);
  const tx = (opts.toward && opts.toward.dx) || 0;
  const ty = (opts.toward && opts.toward.dy) || 1;
  const len = Math.hypot(tx, ty) || 1;
  const ux = tx / len, uy = ty / len;
  const px = -uy, py = ux;

  // Vambrace first — drawn BEFORE the glove silhouette so the glove
  // overpaints its lower edge, hiding any seam at the wrist.
  if (opts.elbow) {
    const wx = hand.x - ux * r * 0.40;
    const wy = hand.y - uy * r * 0.40;
    const forearmLen = Math.hypot(opts.elbow.x - hand.x, opts.elbow.y - hand.y);
    const cuffLen = Math.min(forearmLen * 0.55, rig.limbR * 2.4);
    const cuffEnd = {
      x: wx + (opts.elbow.x - hand.x) / forearmLen * cuffLen,
      y: wy + (opts.elbow.y - hand.y) / forearmLen * cuffLen,
    };
    VC.limb(ctx, wx, wy, r * 0.78, cuffEnd.x, cuffEnd.y, r * 0.62,
      palette.base, palette.outline || '#000', outlineW(rig, 0.28));
    // Cel shadow band on the right side
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const dxe = cuffEnd.x - wx, dye = cuffEnd.y - wy;
    const lene = Math.hypot(dxe, dye) || 1;
    const nxe = -dye / lene, nye = dxe / lene;
    VC.limb(ctx,
      wx + nxe * r * 0.30, wy + nye * r * 0.30, r * 0.78,
      cuffEnd.x + nxe * r * 0.20, cuffEnd.y + nye * r * 0.20, r * 0.55,
      palette.shadow || palette.base, null, 0);
    ctx.restore();
  }

  // Mitten silhouette in glove color — same shape as drawHand so the
  // glove tracks the same articulation cues as the bare hand.
  ctx.save();
  ctx.fillStyle = palette.base;
  ctx.strokeStyle = palette.outline || '#000';
  ctx.lineWidth = outlineW(rig, 0.30);
  ctx.beginPath();
  const wx = hand.x - ux * r * 0.40;
  const wy = hand.y - uy * r * 0.40;
  ctx.moveTo(wx + px * r * 0.55, wy + py * r * 0.55);
  ctx.quadraticCurveTo(
    wx + ux * r * 0.20 + px * r * 1.05, wy + uy * r * 0.20 + py * r * 1.05,
    wx + ux * r * 0.55 + px * r * 0.85, wy + uy * r * 0.55 + py * r * 0.85,
  );
  ctx.quadraticCurveTo(
    hand.x + ux * r * 0.30 + px * r * 0.55, hand.y + uy * r * 0.30 + py * r * 0.55,
    hand.x + ux * r * 0.95 + px * r * 0.45, hand.y + uy * r * 0.95 + py * r * 0.45,
  );
  ctx.quadraticCurveTo(
    hand.x + ux * r * 1.20,                  hand.y + uy * r * 1.20,
    hand.x + ux * r * 0.95 - px * r * 0.55,  hand.y + uy * r * 0.95 - py * r * 0.55,
  );
  ctx.quadraticCurveTo(
    wx + ux * r * 0.30 - px * r * 0.65, wy + uy * r * 0.30 - py * r * 0.65,
    wx - px * r * 0.50,                  wy - py * r * 0.50,
  );
  ctx.quadraticCurveTo(
    wx, wy,
    wx + px * r * 0.55, wy + py * r * 0.55,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel shadow on the pinky side
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = palette.shadow || palette.base;
  ctx.beginPath();
  ctx.moveTo(wx - px * r * 0.50, wy - py * r * 0.50);
  ctx.quadraticCurveTo(
    hand.x + ux * r * 0.55 - px * r * 0.85, hand.y + uy * r * 0.55 - py * r * 0.85,
    hand.x + ux * r * 1.05 - px * r * 0.20, hand.y + uy * r * 1.05 - py * r * 0.20,
  );
  ctx.lineTo(hand.x + ux * r * 0.40, hand.y + uy * r * 0.40);
  ctx.lineTo(wx - px * r * 0.20, wy - py * r * 0.20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Knuckle / cuff trim
  ctx.save();
  ctx.strokeStyle = palette.outline || '#000';
  ctx.lineWidth = Math.max(1.0, r * 0.16);
  ctx.lineCap = 'round';
  if (opts.fist) {
    for (const k of [-0.45, 0.0, 0.45]) {
      const cx = hand.x + ux * r * 0.55 + px * r * k * 0.6;
      const cy = hand.y + uy * r * 0.55 + py * r * k * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - ux * r * 0.18, cy - uy * r * 0.18);
      ctx.lineTo(cx + ux * r * 0.18, cy + uy * r * 0.18);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(wx + px * r * 0.55, wy + py * r * 0.55);
    ctx.quadraticCurveTo(wx, wy + r * 0.10, wx - px * r * 0.55, wy - py * r * 0.55);
    ctx.stroke();
  }
  ctx.restore();
  void px; void py;
}

/**
 * Pant fold / seam — a soft vertical line down the side of a leg.
 * Two passes:
 *   1. A heavier stitch line on the OUTSIDE of the leg (always visible).
 *   2. A lighter inseam shadow on the inside (only meaningful in profile).
 * Together they break up an otherwise flat leg silhouette.
 */
/**
 * Pelvis bridge — a small filled pelvis shape in pants color that spans
 * the hip line, drawn AFTER the legs but BEFORE the torso. The torso
 * silhouette will overpaint the upper portion, leaving a visible lower-
 * body wedge that connects the legs to the waist. Without this, narrow
 * leg roots look detached from the torso and the character reads as
 * "two tubes hanging under a shirt" — the user-flagged "legs spring out
 * of nothing" problem.
 *
 * Drawn in `pants.base` so the visible lower-body section reads as a
 * single pants-color zone from the belt down to the shoes.
 */
function drawPelvisBridge(ctx, rig, pants) {
  const { pelvis, chest } = rig;
  const direction = rig.direction;
  if (direction === 'west' || direction === 'east') {
    // Side-view bridge: a small bowl from front-of-pelvis to glute.
    const sd = pelvis.w * 0.55;
    const top = pelvis.y - rig.limbR * 1.20;
    const bot = pelvis.y + rig.limbR * 0.50;
    ctx.save();
    ctx.fillStyle = pants.base;
    ctx.strokeStyle = pants.outline || '#000';
    ctx.lineWidth = outlineW(rig, 0.30);
    ctx.beginPath();
    ctx.moveTo(pelvis.x - sd * 0.85, top);
    ctx.quadraticCurveTo(pelvis.x - sd * 1.05, pelvis.y, pelvis.x - sd * 0.55, bot);
    ctx.lineTo(pelvis.x + sd * 0.55, bot);
    ctx.quadraticCurveTo(pelvis.x + sd * 1.05, pelvis.y, pelvis.x + sd * 0.85, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  // South / north: a wedge that bulges from the waist line down to the
  // groin notch. IMPORTANT: the bridge must stay INSIDE the torso
  // silhouette at every Y level — if it pokes past the torso outline,
  // the pants color leaks behind the torso and reads as "the legs are
  // attached to the back" (user-flagged bug). The torso hip points are
  // at hw * 1.00 → hw * 0.85 → hw * 0.40 (top → outer thigh → groin),
  // so the bridge is sized strictly smaller than each.
  const hw = pelvis.w / 2;
  const top = pelvis.y - rig.limbR * 0.95;       // sits a touch above the hip line
  const bot = pelvis.y + rig.limbR * 0.55;       // dips into the groin
  ctx.save();
  ctx.fillStyle = pants.base;
  ctx.strokeStyle = pants.outline || '#000';
  ctx.lineWidth = outlineW(rig, 0.30);
  ctx.beginPath();
  ctx.moveTo(pelvis.x - hw * 0.55, top);
  ctx.quadraticCurveTo(pelvis.x - hw * 0.92, pelvis.y - rig.limbR * 0.20,
                       pelvis.x - hw * 0.78, bot);
  ctx.quadraticCurveTo(pelvis.x, bot - rig.limbR * 0.10,
                       pelvis.x + hw * 0.78, bot);
  ctx.quadraticCurveTo(pelvis.x + hw * 0.92, pelvis.y - rig.limbR * 0.20,
                       pelvis.x + hw * 0.55, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel shadow on the right side of the pelvis to match body lighting.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = pants.shadow || pants.base;
  ctx.beginPath();
  ctx.moveTo(pelvis.x + hw * 0.10, top);
  ctx.quadraticCurveTo(pelvis.x + hw * 0.92, pelvis.y - rig.limbR * 0.10,
                       pelvis.x + hw * 0.40, bot);
  ctx.lineTo(pelvis.x + hw * 0.10, bot);
  ctx.lineTo(pelvis.x + hw * 0.10, top);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
  void chest;
}

/**
 * Pelvis bridge — drawn between the legs and the torso to anchor the
 * legs onto the body silhouette.
 */
function drawPantFold(ctx, hip, knee, foot, rig, pants) {
  // Use the seam direction along the hip→foot vector. Bias the line
  // slightly toward the outside (perpendicular to the leg axis).
  const dx1 = knee.x - hip.x, dy1 = knee.y - hip.y;
  const dx2 = foot.x - knee.x, dy2 = foot.y - knee.y;
  const len1 = Math.hypot(dx1, dy1) || 1;
  // Outside perpendicular: rotate +90° from the hip→knee vector.
  const ox = -dy1 / len1, oy = dx1 / len1;
  const off = rig.limbR * 0.30;       // bigger offset so seam reads
  ctx.save();
  ctx.strokeStyle = pants.deep_shadow || pants.shadow || pants.outline || '#222';
  ctx.lineWidth = Math.max(1.2, rig.limbR * 0.16);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.65;
  // Outside seam
  ctx.beginPath();
  ctx.moveTo(hip.x + ox * off, hip.y + oy * off);
  ctx.lineTo(knee.x + ox * off, knee.y + oy * off);
  ctx.lineTo(foot.x + ox * off * 0.6, foot.y + oy * off * 0.6);
  ctx.stroke();
  // Inseam — opposite side, thinner + softer. Adds a second line of
  // form so the leg reads as a tube rather than a flat ribbon.
  ctx.lineWidth = Math.max(0.8, rig.limbR * 0.10);
  ctx.globalAlpha = 0.40;
  ctx.beginPath();
  ctx.moveTo(hip.x - ox * off * 0.6, hip.y - oy * off * 0.6);
  ctx.lineTo(knee.x - ox * off * 0.6, knee.y - oy * off * 0.6);
  ctx.lineTo(foot.x - ox * off * 0.4, foot.y - oy * off * 0.4);
  ctx.stroke();
  ctx.restore();
  void dx2; void dy2;
}

/**
 * Pant cuff — a slightly darker band at the ankle to suggest a hem,
 * similar in spirit to drawCuff but for legs. Direction comes from the
 * unit vector along the lower leg so the band orients perpendicular.
 */
function drawPantCuff(ctx, foot, knee, rig, pants) {
  const dx = foot.x - knee.x, dy = foot.y - knee.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const cx = foot.x - ux * rig.limbR * 0.55;
  const cy = foot.y - uy * rig.limbR * 0.55;
  const w = rig.limbR * 1.10;     // slightly wider than the leg radius
  const h = rig.limbR * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(uy, ux));
  VC.roundRect(ctx, -h * 0.5, -w * 0.5, h, w, h * 0.4,
    pants.deep_shadow || pants.shadow || '#222',
    pants.outline || '#000',
    Math.max(0.8, h * 0.18));
  ctx.restore();
}

/**
 * Sleeve cuff — a thin contrasting band drawn at the wrist end of a sleeve.
 * Used for jacket/bomber/hoodie styles to suggest a separately-stitched
 * cuff. Direction comes from the unit vector along the forearm so the band
 * orients perpendicular to the arm.
 */
function drawCuff(ctx, hand, elbow, rig, clothing) {
  const dx = hand.x - elbow.x, dy = hand.y - elbow.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // Position the cuff slightly back from the hand (toward the elbow)
  const cx = hand.x - ux * rig.limbR * 0.55;
  const cy = hand.y - uy * rig.limbR * 0.55;
  const px = -uy, py = ux;
  const w = rig.limbR * 0.95;
  const h = rig.limbR * 0.45;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(uy, ux));
  ctx.fillStyle = clothing.deep_shadow || clothing.shadow || '#222';
  VC.roundRect(ctx, -h * 0.5, -w * 0.5, h, w, h * 0.4,
    clothing.deep_shadow || clothing.shadow || '#222',
    clothing.outline || '#000',
    Math.max(0.8, h * 0.18));
  // Stitch line (highlight)
  ctx.strokeStyle = VC.hexAlpha(clothing.highlight || '#fff', 0.4);
  ctx.lineWidth = Math.max(0.6, h * 0.10);
  ctx.beginPath();
  ctx.moveTo(-h * 0.30, -w * 0.40);
  ctx.lineTo(-h * 0.30,  w * 0.40);
  ctx.stroke();
  ctx.restore();
  void px; void py;
}

/**
 * Shoe — flat oval with a darker sole, anchored at the foot joint.
 *
 * `opts.tilt` (radians) rotates the shoe around the foot joint. Used on
 * walk frames so the planted foot stays flat while the lifting/swinging
 * foot tilts toes-down for a "stepping forward" look.
 */
function drawShoe(ctx, foot, shoes, rig, direction, opts = {}) {
  const r = rig.limbR;
  const sx = direction === 'west' || direction === 'east' ? r * 2.2 : r * 1.4;
  const sy = r * 0.95;
  const tilt = opts.tilt || 0;
  ctx.save();
  ctx.translate(foot.x, foot.y);
  if (tilt) ctx.rotate(tilt);
  // Upper
  VC.oval(ctx, 0, 0, sx, sy,
    VC.diagGradient(ctx, -sx, -sy, sx * 2, sy * 2, shoes),
    shoes.outline, outlineW(rig));
  // Sole
  VC.oval(ctx, 0, sy * 0.55, sx * 0.95, sy * 0.4,
    shoes.shadow || shoes.outline, shoes.outline, outlineW(rig, 0.15));
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Torso
// ---------------------------------------------------------------------------

/**
 * Torso silhouette as a smooth blob (shoulders → waist → hips).
 * `direction` adjusts the silhouette: front/back is symmetric; side is narrower.
 */
function drawTorso(ctx, rig, clothing, opts = {}) {
  const { chest, pelvis, neck } = rig;
  const direction = rig.direction;

  const sw = chest.w / 2;
  const hw = pelvis.w / 2;
  const tH = pelvis.y - chest.y;                      // torso height
  const wy = chest.y + tH * 0.62;                     // waist height — sits lower so the chest/ribs section above reads tall enough; the belt still anchors at the hip line below
  const wWaist = Math.min(sw, hw) * 0.78;             // pinch at waist
  const limbR = rig.limbR;

  let pts;
  if (direction === 'south' || direction === 'north') {
    // Anatomical front silhouette: rounded shoulder caps, gentle ribs
    // taper, narrow waist, curved hips, groin pinch. The path goes:
    // top-center → right shoulder ridge → shoulder cap → armpit → ribs
    // → waist → hip → groin → bottom-center → mirror up the left.
    pts = [
      // top center: collarbone hollow (slight rise)
      [chest.x,                       chest.y - limbR * 0.20],
      // right shoulder ridge
      [chest.x + sw * 0.45,           chest.y - limbR * 0.05],
      // right shoulder cap (rounded out)
      [chest.x + sw * 1.00,           chest.y + limbR * 0.45],
      // right armpit (curves back in below shoulder)
      [chest.x + sw * 0.85,           chest.y + limbR * 1.20],
      // right ribs (gentle curve down + in)
      [chest.x + sw * 0.78,           chest.y + tH * 0.40],
      // right waist (narrowest)
      [chest.x + wWaist,              wy],
      // right hip (curves out)
      [pelvis.x + hw * 1.00,          pelvis.y - limbR * 0.20],
      // right outer-thigh seam
      [pelvis.x + hw * 0.85,          pelvis.y + limbR * 0.30],
      // right groin (pinches in toward the leg root)
      [pelvis.x + hw * 0.40,          pelvis.y + limbR * 0.50],
      // bottom center: groin / inner-thigh notch
      [pelvis.x,                       pelvis.y + limbR * 0.30],
      // left groin
      [pelvis.x - hw * 0.40,          pelvis.y + limbR * 0.50],
      // left outer-thigh seam
      [pelvis.x - hw * 0.85,          pelvis.y + limbR * 0.30],
      // left hip
      [pelvis.x - hw * 1.00,          pelvis.y - limbR * 0.20],
      // left waist
      [chest.x - wWaist,              wy],
      // left ribs
      [chest.x - sw * 0.78,           chest.y + tH * 0.40],
      // left armpit
      [chest.x - sw * 0.85,           chest.y + limbR * 1.20],
      // left shoulder cap
      [chest.x - sw * 1.00,           chest.y + limbR * 0.45],
      // left shoulder ridge
      [chest.x - sw * 0.45,           chest.y - limbR * 0.05],
    ];
  } else {
    // Side view — depth profile (front-to-back), not width.
    const sd = sw * 0.55;
    const hd = hw * 0.65;
    pts = [
      // top: shoulder-top dip
      [chest.x,                       chest.y - limbR * 0.30],
      // chest forward bulge (front of body, smaller X = forward in west)
      [chest.x - sd * 0.95,           chest.y + limbR * 0.30],
      // mid-back / pec
      [chest.x - sd * 0.85,           chest.y + tH * 0.30],
      // waist front (gentle in-curve, abdominal)
      [chest.x - sd * 0.55,           wy],
      // belly forward bulge (very subtle)
      [chest.x - sd * 0.65,           chest.y + tH * 0.75],
      // pelvis front bottom
      [chest.x - hd * 0.55,           pelvis.y],
      // crotch-front
      [chest.x - hd * 0.20,           pelvis.y + limbR * 0.50],
      // crotch-back
      [chest.x + hd * 0.30,           pelvis.y + limbR * 0.40],
      // glute bulge
      [chest.x + hd * 0.85,           pelvis.y - limbR * 0.10],
      // lumbar inward curve
      [chest.x + sd * 0.80,           wy + tH * 0.10],
      // upper-back broad
      [chest.x + sd * 0.95,           chest.y + tH * 0.30],
      // shoulder-blade
      [chest.x + sd * 0.85,           chest.y + limbR * 0.30],
      // back of neck
      [chest.x + sd * 0.10,           chest.y - limbR * 0.30],
    ];
  }

  // 1. Flat-fill the torso silhouette with a strong outline.
  blobPath(ctx, pts, 0.55);
  ctx.fillStyle = clothing.base;
  ctx.fill();
  ctx.strokeStyle = clothing.outline || '#000';
  ctx.lineWidth = outlineW(rig, 0.32);
  ctx.stroke();

  // 2. Cel shadow — a soft curved shadow on the right side (shadow side)
  // of the torso. Drawn via source-atop so it clips to the torso shape.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = clothing.shadow || clothing.base;
  ctx.beginPath();
  if (direction === 'south' || direction === 'north') {
    const tH = pelvis.y - chest.y;
    ctx.moveTo(chest.x + sw * 0.20, chest.y - rig.limbR * 0.6);
    ctx.quadraticCurveTo(
      chest.x + sw * 1.30, chest.y + tH * 0.40,
      chest.x + hw * 0.30, pelvis.y + rig.limbR * 0.6,
    );
    ctx.lineTo(chest.x + sw * 0.10, pelvis.y);
    ctx.quadraticCurveTo(
      chest.x + sw * 0.40, chest.y + tH * 0.50,
      chest.x + sw * 0.20, chest.y - rig.limbR * 0.6,
    );
  } else {
    // Side view: shadow wraps the back side of the torso depth.
    const sd = sw * 0.55;
    const tH = pelvis.y - chest.y;
    ctx.moveTo(chest.x + sd * 0.10, chest.y);
    ctx.quadraticCurveTo(
      chest.x + sd * 1.30, chest.y + tH * 0.4,
      chest.x + sd * 0.10, pelvis.y,
    );
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Cast shadow under the neck/collar onto the upper chest.
  if (direction !== 'north') {
    VC.castShadow(ctx,
      neck.x, chest.y + rig.limbR * 0.55,
      sw * 0.55, rig.limbR * 0.40,
      0.40, clothing.outline);
  }

  // 5. Waist AO crease — a faint horizontal band at the narrowest point
  // suggesting the body bends.
  if (direction === 'south' || direction === 'north') {
    VC.castShadow(ctx,
      chest.x, wy + (pelvis.y - wy) * 0.35,
      wWaist * 0.95, rig.limbR * 0.18,
      0.30, clothing.deep_shadow || clothing.outline);
  }

  // Collar / neck-line accent (drawn after shading so it stays visible)
  if (clothing.collar && (direction === 'south' || direction === 'west' || direction === 'east')) {
    ctx.beginPath();
    ctx.moveTo(neck.x - rig.limbR * 1.2, chest.y + 1);
    ctx.quadraticCurveTo(neck.x, chest.y + rig.limbR * 0.7, neck.x + rig.limbR * 1.2, chest.y + 1);
    ctx.lineWidth = outlineW(rig, 0.20);
    ctx.strokeStyle = clothing.collar;
    ctx.stroke();
  }

  // 5a. Pectoral V — a thin dark line splitting the chest plane down the
  // sternum. Only on muscular / heavy builds (so most NPCs stay smooth-
  // chested). Sells the broad-shouldered warrior silhouette.
  if (direction === 'south' && opts.muscular) {
    ctx.save();
    ctx.strokeStyle = clothing.deep_shadow || clothing.outline;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = outlineW(rig, 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const vTop = chest.y + limbR * 0.45;
    const vBot = chest.y + limbR * 1.55;
    ctx.moveTo(chest.x, vTop);
    ctx.lineTo(chest.x, vBot);
    // Small wings at the bottom suggesting the pec division curve out.
    ctx.moveTo(chest.x, vBot);
    ctx.quadraticCurveTo(chest.x - sw * 0.18, vBot + limbR * 0.15,
                         chest.x - sw * 0.32, vBot + limbR * 0.05);
    ctx.moveTo(chest.x, vBot);
    ctx.quadraticCurveTo(chest.x + sw * 0.18, vBot + limbR * 0.15,
                         chest.x + sw * 0.32, vBot + limbR * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  // 5b. Chest plane — a soft horizontal shadow under the shoulder line
  // suggesting pectoral / upper-chest separation from the torso below.
  // South view only (the shadow direction makes sense from the front).
  if (direction === 'south') {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = clothing.shadow || clothing.base;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    // Curved horizontal band that hugs the chest line, dipping at the
    // sternum to suggest the divide between pectorals.
    const chestBandY = chest.y + rig.limbR * 1.10;
    ctx.moveTo(chest.x - sw * 0.85, chestBandY);
    ctx.quadraticCurveTo(
      chest.x, chestBandY + rig.limbR * 0.55,
      chest.x + sw * 0.85, chestBandY,
    );
    ctx.lineTo(chest.x + sw * 0.85, chestBandY + rig.limbR * 0.30);
    ctx.quadraticCurveTo(
      chest.x, chestBandY + rig.limbR * 0.95,
      chest.x - sw * 0.85, chestBandY + rig.limbR * 0.30,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 5c. Waist crease — a faint horizontal line at the narrowest point.
  // Sells the body bend and breaks up the torso vertically.
  if (direction === 'south' || direction === 'north') {
    ctx.save();
    ctx.strokeStyle = clothing.deep_shadow || clothing.outline;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(chest.x - wWaist * 0.85, wy);
    ctx.quadraticCurveTo(chest.x, wy + rig.limbR * 0.20,
                         chest.x + wWaist * 0.85, wy);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Centerline / zipper (south view).
  //   - Jacket-family styles (lapels / zipper / coat) get a visible
  //     two-line zipper with small horizontal teeth marks at intervals.
  //   - Other styles get the older subtle centerline crease.
  if (direction === 'south' && opts.chestCrease !== false) {
    const zipTop = chest.y + limbR * 0.45;
    const zipBot = pelvis.y - limbR * 0.10;
    if (opts.lapels) {
      ctx.save();
      // Two parallel zipper rails
      ctx.strokeStyle = clothing.outline || '#000';
      ctx.lineWidth = outlineW(rig, 0.14);
      ctx.lineCap = 'round';
      const zipDx = limbR * 0.10;
      ctx.beginPath();
      ctx.moveTo(chest.x - zipDx, zipTop);
      ctx.lineTo(chest.x - zipDx, zipBot);
      ctx.moveTo(chest.x + zipDx, zipTop);
      ctx.lineTo(chest.x + zipDx, zipBot);
      ctx.stroke();
      // Teeth — small horizontal dashes between the rails
      ctx.lineWidth = outlineW(rig, 0.10);
      const teeth = 6;
      for (let i = 0; i < teeth; i++) {
        const t = i / (teeth - 1);
        const y = zipTop + (zipBot - zipTop) * t;
        ctx.beginPath();
        ctx.moveTo(chest.x - zipDx, y);
        ctx.lineTo(chest.x + zipDx, y);
        ctx.stroke();
      }
      // Small zipper pull at the bottom
      ctx.fillStyle = clothing.highlight || '#aaa';
      ctx.strokeStyle = clothing.outline || '#000';
      ctx.lineWidth = Math.max(0.8, limbR * 0.08);
      ctx.beginPath();
      ctx.rect(chest.x - limbR * 0.20, zipBot - limbR * 0.05,
               limbR * 0.40, limbR * 0.30);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(chest.x, zipTop);
      ctx.lineTo(chest.x, zipBot);
      ctx.lineWidth = outlineW(rig, 0.10);
      ctx.strokeStyle = clothing.deep_shadow || clothing.outline;
      ctx.globalAlpha = 0.45;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 7. Jacket lapels — V-shape from collar to chest. Drawn at FULL opacity
  // in the contrasting collar color so they read clearly against the
  // jacket body. Skipped for shirts/tanks.
  if (direction === 'south' && opts.lapels) {
    const lapelTop = chest.y + rig.limbR * 0.10;
    const lapelBot = chest.y + (pelvis.y - chest.y) * 0.55;
    const lapelW   = sw * 0.42;
    const lapelColor = clothing.deep_shadow || clothing.shadow || '#0a0a10';
    ctx.save();
    ctx.fillStyle = lapelColor;
    ctx.strokeStyle = clothing.outline || '#000';
    ctx.lineWidth = outlineW(rig, 0.18);
    // Left lapel triangle
    ctx.beginPath();
    ctx.moveTo(chest.x - rig.limbR * 0.65, lapelTop);
    ctx.lineTo(chest.x - lapelW * 0.50,    lapelBot);
    ctx.lineTo(chest.x,                    lapelBot - rig.limbR * 0.4);
    ctx.lineTo(chest.x,                    lapelTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right lapel triangle
    ctx.beginPath();
    ctx.moveTo(chest.x + rig.limbR * 0.65, lapelTop);
    ctx.lineTo(chest.x + lapelW * 0.50,    lapelBot);
    ctx.lineTo(chest.x,                    lapelBot - rig.limbR * 0.4);
    ctx.lineTo(chest.x,                    lapelTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Highlight stitch line along the lapel edge — full opacity now
    ctx.strokeStyle = clothing.highlight || '#fff';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.beginPath();
    ctx.moveTo(chest.x - rig.limbR * 0.65 + 1, lapelTop + 1);
    ctx.lineTo(chest.x - lapelW * 0.50 + 1,    lapelBot - 1);
    ctx.moveTo(chest.x + rig.limbR * 0.65 - 1, lapelTop + 1);
    ctx.lineTo(chest.x + lapelW * 0.50 - 1,    lapelBot - 1);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Pocket lines — two short horizontal segments at hip-line (south)
  if (direction === 'south' && opts.pockets) {
    ctx.save();
    ctx.strokeStyle = clothing.deep_shadow || clothing.outline;
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.globalAlpha = 0.50;
    const py = pelvis.y - rig.limbR * 0.05;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(chest.x + sign * hw * 0.30, py);
      ctx.quadraticCurveTo(
        chest.x + sign * hw * 0.55, py + rig.limbR * 0.30,
        chest.x + sign * hw * 0.75, py + rig.limbR * 0.05,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // 9. Chest pocket — small inset rectangle on the upper-left chest, only
  // for jacket-family clothing (visible on south view). A darker rectangle
  // with a flap line on top reads as a sewn-on patch pocket.
  if (direction === 'south' && opts.chestPocket) {
    const pw = sw * 0.32;
    const ph = rig.limbR * 0.95;
    const px = chest.x - sw * 0.55;
    const py = chest.y + rig.limbR * 0.95;
    ctx.save();
    // Pocket body
    ctx.fillStyle = clothing.deep_shadow || clothing.shadow || '#222';
    ctx.strokeStyle = clothing.outline || '#000';
    ctx.lineWidth = outlineW(rig, 0.16);
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.fill();
    ctx.stroke();
    // Flap line near the top
    ctx.beginPath();
    ctx.moveTo(px, py + ph * 0.35);
    ctx.lineTo(px + pw, py + ph * 0.35);
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.strokeStyle = VC.hexAlpha(clothing.highlight || '#fff', 0.5);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Belt
// ---------------------------------------------------------------------------

function drawBelt(ctx, rig, belt) {
  if (!belt) return;
  const { pelvis } = rig;
  const direction = rig.direction;
  const w = pelvis.w * 1.00;     // wider — runs the full hip line
  const h = rig.limbR * 0.85;    // taller — beefier strap
  const x = pelvis.x - w / 2;
  const y = pelvis.y - h * 0.4;
  const beltOutline = belt.outline || '#000';

  if (direction === 'west' || direction === 'east') {
    const sd = pelvis.w * 0.40;
    VC.roundRect(ctx, pelvis.x - sd, y, sd * 2, h,
      h * 0.30, belt.base, beltOutline, outlineW(rig, 0.22));
    // Side-view buckle stub
    VC.roundRect(ctx, pelvis.x - h * 0.45, y + h * 0.15, h * 0.9, h * 0.7,
      h * 0.20, belt.highlight || '#d4a800', beltOutline, outlineW(rig, 0.18));
  } else {
    // Belt strap
    VC.roundRect(ctx, x, y, w, h, h * 0.30,
      belt.base, beltOutline, outlineW(rig, 0.22));
    // Buckle — bigger gold rectangle with an inner notch for definition.
    const buckleW = h * 1.8;
    const buckleH = h * 0.95;
    VC.roundRect(ctx, pelvis.x - buckleW / 2, y + h * 0.025, buckleW, buckleH, h * 0.15,
      belt.highlight || '#d4a800', beltOutline, outlineW(rig, 0.18));
    // Inner buckle notch (a darker rectangle inside)
    ctx.save();
    ctx.fillStyle = belt.shadow || '#8a6000';
    ctx.fillRect(
      pelvis.x - buckleW * 0.35, y + h * 0.30,
      buckleW * 0.70, buckleH * 0.45,
    );
    // Center pin
    ctx.fillStyle = beltOutline;
    ctx.fillRect(pelvis.x - 1, y + h * 0.30, 2, buckleH * 0.45);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Neck / Head
// ---------------------------------------------------------------------------

function drawNeck(ctx, rig, skin) {
  const { neck, chest } = rig;
  const w = rig.limbR * 1.7;
  const h = (chest.y - neck.y) + rig.limbR * 0.3;
  const x = neck.x - w / 2;
  const y = neck.y - rig.limbR * 0.2;
  VC.roundRect(ctx, x, y, w, h, w * 0.3,
    VC.vGradient(ctx, x, y, 0, h, skin),
    skin.outline, outlineW(rig, 0.18));

  // Neck-shoulder junction — a soft curved accent line where the neck
  // meets the upper torso. Sells the depth of the throat hollow vs.
  // the collarbone shelf and gives the silhouette a subtle break that
  // reads even at thumbnail size.
  ctx.save();
  ctx.strokeStyle = skin.shadow || skin.outline;
  ctx.lineWidth = Math.max(1.0, rig.limbR * 0.16);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  // Shallow U from one shoulder side to the other across the throat hollow
  ctx.moveTo(neck.x - w * 0.55, chest.y - rig.limbR * 0.15);
  ctx.quadraticCurveTo(
    neck.x, chest.y + rig.limbR * 0.10,
    neck.x + w * 0.55, chest.y - rig.limbR * 0.15,
  );
  ctx.stroke();
  ctx.restore();
}

function drawHead(ctx, rig, skin) {
  const { head } = rig;
  const direction = rig.direction;

  // 1. Build the head silhouette as a tapered blob (wider at the
  // temples / cheekbones, narrower at the chin). This is the single
  // biggest readability boost over a plain oval — chibi heads should
  // taper to a soft chin point.
  let pts;
  if (direction === 'south' || direction === 'north') {
    pts = [
      [-0.50, -1.00],   // top-left of skull
      [-0.92, -0.55],   // upper temple
      [-0.95, -0.05],   // cheekbone (widest point)
      [-0.78,  0.55],   // jaw
      [-0.32,  0.92],   // chin-left
      [ 0.00,  1.00],   // chin
      [ 0.32,  0.92],
      [ 0.78,  0.55],
      [ 0.95, -0.05],
      [ 0.92, -0.55],
      [ 0.50, -1.00],
      [ 0.00, -1.05],   // skull-top
    ];
  } else {
    // Side view: narrower in profile depth, slight forehead/chin curve.
    // Negative-X faces forward (west); the back of the skull is +X.
    pts = [
      [-0.55, -0.95],
      [-0.85, -0.55],
      [-0.92,  0.00],   // brow / forehead
      [-0.85,  0.40],   // upper lip
      [-0.62,  0.78],   // chin
      [-0.20,  0.92],
      [ 0.45,  0.85],
      [ 0.85,  0.40],
      [ 0.95,  0.00],
      [ 0.85, -0.55],
      [ 0.40, -1.00],
    ];
  }
  const blob = pts.map(([nx, ny]) => [
    head.x + nx * head.r * 0.92,
    head.y + ny * head.r,
  ]);

  // 2. Flat-fill the head — solid base skin tone with a strong outline.
  blobPath(ctx, blob, 0.55);
  ctx.fillStyle = skin.base;
  ctx.fill();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = outlineW(rig, 0.32);
  ctx.stroke();

  // 3. Cel shadow — a soft cheek/jaw shadow on the bottom-right (shadow
  // side). Drawn as a curved blob via source-atop so the terminator reads
  // as a smooth crescent rather than a hard wedge.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = skin.shadow;
  ctx.beginPath();
  ctx.moveTo(head.x + head.r * 0.18, head.y - head.r * 0.95);
  ctx.quadraticCurveTo(
    head.x + head.r * 1.15, head.y - head.r * 0.10,
    head.x + head.r * 0.30, head.y + head.r * 1.00,
  );
  ctx.lineTo(head.x + head.r * 0.05, head.y + head.r * 0.95);
  ctx.quadraticCurveTo(
    head.x + head.r * 0.30, head.y - head.r * 0.05,
    head.x + head.r * 0.18, head.y - head.r * 0.95,
  );
  ctx.closePath();
  ctx.fill();

  // 3b. Brow-ridge shadow — a soft horizontal band across the upper face
  // just above the eye line. Sells the eye-socket recess and lets the
  // hair fringe "cast" onto the face even though the hair itself is
  // drawn opaquely on top of the forehead.
  ctx.beginPath();
  ctx.moveTo(head.x - head.r * 0.85, head.y - head.r * 0.10);
  ctx.quadraticCurveTo(
    head.x, head.y - head.r * 0.30,
    head.x + head.r * 0.85, head.y - head.r * 0.10,
  );
  ctx.quadraticCurveTo(
    head.x, head.y + head.r * 0.05,
    head.x - head.r * 0.85, head.y - head.r * 0.10,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 5. Cheek blush — south view only.
  if (direction === 'south') {
    ctx.save();
    ctx.globalAlpha = 0.20;
    VC.oval(ctx, head.x + head.r * 0.46, head.y + head.r * 0.22,
      head.r * 0.20, head.r * 0.12, '#c84848', null);
    VC.oval(ctx, head.x - head.r * 0.46, head.y + head.r * 0.22,
      head.r * 0.20, head.r * 0.12, '#c84848', null);
    ctx.restore();
  }

  // 6. Ears — small bumps on the side of the head. South view shows
  // both, side view shows only the visible side. Skipped for snouted
  // / horned variants that draw their own ears (goblin, lizardfolk).
  if (!rig.skipEars) drawEars(ctx, rig, skin);

  // 7. Cast shadow under the chin onto the neck.
  VC.castShadow(ctx,
    head.x, head.y + head.r * 0.98,
    head.r * 0.50, head.r * 0.20,
    0.45, skin.outline);
}

function drawEars(ctx, rig, skin) {
  const { head } = rig;
  const direction = rig.direction;
  const earR = head.r * 0.18;
  const lineW = outlineW(rig, 0.18);
  const drawOne = (sign) => {
    const ex = head.x + sign * head.r * 0.92;
    const ey = head.y + head.r * 0.10;
    ctx.save();
    ctx.fillStyle = skin.base;
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = lineW;
    ctx.beginPath();
    // Slightly egg-shaped ear leaning back-and-up
    ctx.ellipse(ex + sign * earR * 0.20, ey,
      earR * 0.55, earR * 0.85, sign * -0.20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Inner-ear shadow
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = skin.shadow || skin.outline;
    ctx.beginPath();
    ctx.ellipse(ex + sign * earR * 0.30, ey + earR * 0.05,
      earR * 0.25, earR * 0.55, sign * -0.20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  if (direction === 'south' || direction === 'north') {
    drawOne(-1);
    drawOne( 1);
  } else if (direction === 'west') {
    // Only the back-of-camera ear shows in profile (we look LEFT, so the
    // visible ear is on the right side of the head silhouette).
    drawOne(1);
  } else if (direction === 'east') {
    drawOne(-1);
  }
}

/**
 * Eyes (front view) — anime-style almond ovals with a vertical iris,
 * a bright catch-light at top-left, and a soft warm shadow under the
 * upper lid (tarsal shadow) for depth.
 *
 * When opts.blink is true, draws closed eyes (a curved arc with eyelashes)
 * instead — used for one frame of idle so the character feels alive.
 */
function drawEyesSouth(ctx, rig, eyes, opts = {}) {
  const { head } = rig;
  const dx = head.r * 0.32;
  const dy = head.r * 0.10;          // eyes sit slightly below head center

  // Closed-eye blink — short downward-curving arc with an underline.
  if (opts.blink) {
    const lashColorB = eyes.outline || '#1a1010';
    ctx.save();
    ctx.strokeStyle = lashColorB;
    ctx.lineWidth = Math.max(1.5, head.r * 0.06);
    ctx.lineCap = 'round';
    for (const sign of [-1, 1]) {
      const ex = head.x + dx * sign;
      const ey = head.y + dy;
      ctx.beginPath();
      ctx.moveTo(ex - head.r * 0.16, ey);
      ctx.quadraticCurveTo(ex, ey + head.r * 0.10, ex + head.r * 0.16, ey);
      ctx.stroke();
    }
    ctx.restore();
    // Mouth still drawn so the rest of the face is consistent
    ctx.save();
    ctx.strokeStyle = '#3a1808';
    ctx.lineWidth = Math.max(1.0, head.r * 0.04);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(head.x - head.r * 0.10, head.y + head.r * 0.55);
    ctx.quadraticCurveTo(head.x, head.y + head.r * 0.62,
                         head.x + head.r * 0.10, head.y + head.r * 0.55);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const eyeRX = head.r * 0.24;       // bigger almond — readable at thumb size
  const eyeRY = head.r * 0.18;
  const irisRX = head.r * 0.13;
  const irisRY = head.r * 0.17;       // taller-than-wide iris reads as "anime"

  const irisColor   = eyes.iris   || eyes.base || '#3a2510';
  const irisShadow  = eyes.shadow || mixColor(irisColor, '#000', 0.45);
  const sclera      = eyes.solid ? irisColor : (eyes.sclera || '#f6efe1');
  const lashColor   = eyes.outline || '#1a1010';

  // Eyebrows — drawn first so the eye shape sits below them. Match the
  // hair color (passed via eyes.brow); fall back to a near-black if
  // missing. Adds the single biggest "personality" cue to the face.
  drawEyebrowsSouth(ctx, rig, eyes);

  // Nose-bridge crease — a short, soft vertical line between the brow
  // ridge and where the nose tip would be. Skipped for snouted/lizard
  // species and for fairies (their faces are stylized smoother).
  if (rig.species !== 'lizardfolk' && rig.species !== 'fairy') {
    const { head } = rig;
    ctx.save();
    ctx.strokeStyle = eyes.outline || '#1a1010';
    ctx.lineWidth = Math.max(0.8, head.r * 0.04);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.30;
    ctx.beginPath();
    // Slight rightward lean to match the top-left light source — the
    // shadow side of a nose ridge falls on the right.
    ctx.moveTo(head.x + head.r * 0.04, head.y - head.r * 0.05);
    ctx.quadraticCurveTo(
      head.x + head.r * 0.08, head.y + head.r * 0.18,
      head.x + head.r * 0.05, head.y + head.r * 0.32,
    );
    ctx.stroke();
    ctx.restore();
  }

  for (const sign of [-1, 1]) {
    const ex = head.x + dx * sign;
    const ey = head.y + dy;

    // 1. Sclera — wider almond with a soft inner gradient.
    if (!eyes.solid) {
      const grad = ctx.createLinearGradient(ex, ey - eyeRY, ex, ey + eyeRY);
      grad.addColorStop(0,   '#e9dfc9');
      grad.addColorStop(0.4, sclera);
      grad.addColorStop(1,   '#e0d4ba');
      VC.oval(ctx, ex, ey, eyeRX, eyeRY, grad, null);
    } else {
      VC.oval(ctx, ex, ey, eyeRX, eyeRY, irisColor, null);
    }

    // 2. Iris — vertical oval, two-tone for a glassy look.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeRX, eyeRY, 0, 0, Math.PI * 2);
    ctx.clip();

    const irisGrad = ctx.createRadialGradient(
      ex - irisRX * 0.25, ey - irisRY * 0.30, irisRY * 0.10,
      ex,                 ey + irisRY * 0.20, irisRY * 1.10,
    );
    irisGrad.addColorStop(0,   lighten(irisColor, 0.25));
    irisGrad.addColorStop(0.55, irisColor);
    irisGrad.addColorStop(1,   irisShadow);
    VC.oval(ctx, ex, ey + eyeRY * 0.05, irisRX, irisRY, irisGrad, null);

    // Pupil
    VC.oval(ctx, ex, ey + eyeRY * 0.05, irisRX * 0.42, irisRY * 0.42, '#080605', null);

    // Vertical catch-light (anime reflection)
    ctx.save();
    ctx.globalAlpha = 0.92;
    VC.oval(ctx, ex - irisRX * 0.30, ey - irisRY * 0.35,
      irisRX * 0.30, irisRY * 0.18, '#ffffff', null);
    VC.oval(ctx, ex + irisRX * 0.30, ey + irisRY * 0.40,
      irisRX * 0.16, irisRY * 0.10, '#ffffff', null);
    ctx.restore();

    // Lower-iris reflected light
    ctx.save();
    ctx.globalAlpha = 0.40;
    VC.oval(ctx, ex, ey + irisRY * 0.55,
      irisRX * 0.65, irisRY * 0.18,
      lighten(irisColor, 0.45), null);
    ctx.restore();

    ctx.restore(); // clip

    // 3. Upper-lid (lash) — a thicker dark stroke that hugs the top of
    // the eye, with a small flick at the OUTER corner. Each eye's outer
    // corner is on its own outer side: left eye's outer is to the left,
    // right eye's outer is to the right. The lash arc therefore needs
    // to mirror per side so both eyes flick away from the nose, not
    // both flicking the same direction (which produced the asymmetric
    // "one heavy lid, one light lid" look).
    ctx.save();
    ctx.strokeStyle = lashColor;
    ctx.lineWidth   = Math.max(1.4, eyeRY * 0.35);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    // Inner corner (toward the nose, opposite the sign) → outer corner
    // (away from the nose, in the sign direction).
    const innerX = ex - eyeRX * 0.95 * sign;       // toward nose
    const outerX = ex + eyeRX * 0.95 * sign;       // outer
    ctx.moveTo(innerX, ey - eyeRY * 0.10);
    ctx.quadraticCurveTo(ex, ey - eyeRY * 1.05, outerX, ey - eyeRY * 0.20);
    // Outer-corner flick — extends the lash slightly past the outer
    // corner with a small upward kick.
    ctx.quadraticCurveTo(
      ex + eyeRX * 1.05 * sign, ey - eyeRY * 0.05,
      ex + eyeRX * 1.15 * sign, ey - eyeRY * 0.35,
    );
    ctx.stroke();
    ctx.restore();

    // 4. Lower lid — thin soft line (subtler than the lash). Mirrored
    // per side to match the upper lash.
    ctx.save();
    ctx.strokeStyle = lashColor;
    ctx.lineWidth   = Math.max(0.8, eyeRY * 0.18);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(ex - eyeRX * 0.85 * sign, ey + eyeRY * 0.30);
    ctx.quadraticCurveTo(ex, ey + eyeRY * 0.95, ex + eyeRX * 0.85 * sign, ey + eyeRY * 0.20);
    ctx.stroke();
    ctx.restore();

    // 5. Tarsal shadow under the upper lid — a soft brown band that
    // sells the eye socket depth.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeRX, eyeRY, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.30;
    const lidShadow = ctx.createLinearGradient(ex, ey - eyeRY, ex, ey + eyeRY * 0.4);
    lidShadow.addColorStop(0,   VC.hexAlpha(lashColor, 0.85));
    lidShadow.addColorStop(0.6, VC.hexAlpha(lashColor, 0));
    ctx.fillStyle = lidShadow;
    ctx.fillRect(ex - eyeRX, ey - eyeRY, eyeRX * 2, eyeRY * 2);
    ctx.restore();
  }

  // Mouth is drawn separately (skipped for species that draw their own —
  // goblin gets fanged grin, lizardfolk's snout covers the mouth area).
  drawMouthSouth(ctx, rig, opts);
}

/**
 * Eyebrows (south view) — short, slightly arched bars above each eye.
 * Color comes from eyes.brow (set by resolveColors to the hair shadow
 * tone) so light-haired characters get light brows and vice versa.
 */
function drawEyebrowsSouth(ctx, rig, eyes) {
  const { head } = rig;
  const dx = head.r * 0.32;
  const dy = -head.r * 0.18;        // slightly above eye line
  const browW = head.r * 0.28;
  const browH = head.r * 0.07;
  const browColor = eyes.brow || '#1a1010';
  ctx.save();
  ctx.fillStyle = browColor;
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 1.0;
  for (const sign of [-1, 1]) {
    const cx = head.x + dx * sign;
    const cy = head.y + dy;
    // Slight arch — outer end up, inner end down. Mirror per side so the
    // outer edge always tilts upward.
    ctx.beginPath();
    ctx.moveTo(cx - browW * 0.5, cy + browH * 0.40 * sign);
    ctx.quadraticCurveTo(
      cx, cy - browH * 0.35,
      cx + browW * 0.5, cy + browH * 0.10 * -sign,
    );
    ctx.lineTo(cx + browW * 0.45, cy + browH * 0.45 * -sign);
    ctx.quadraticCurveTo(
      cx, cy + browH * 0.05,
      cx - browW * 0.45, cy + browH * 0.85 * sign,
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Eyebrow (side view) — single brow on the visible side.
 */
function drawEyebrowWest(ctx, rig, eyes) {
  const { head } = rig;
  const cx = head.x - head.r * 0.42;
  const cy = head.y - head.r * 0.10;
  const browW = head.r * 0.26;
  const browH = head.r * 0.07;
  const browColor = eyes.brow || '#1a1010';
  ctx.save();
  ctx.fillStyle = browColor;
  ctx.beginPath();
  ctx.moveTo(cx - browW * 0.5, cy + browH * 0.20);
  ctx.quadraticCurveTo(cx, cy - browH * 0.40, cx + browW * 0.5, cy);
  ctx.lineTo(cx + browW * 0.45, cy + browH * 0.45);
  ctx.quadraticCurveTo(cx, cy + browH * 0.10, cx - browW * 0.45, cy + browH * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Mouth (south view). Style depends on rig.species + opts.open.
 *   • human/demon/fairy + closed: soft smile curve.
 *   • human/demon/fairy + open  : small filled oval (battle cry).
 *   • goblin                    : wide thin mouth with spiky teeth.
 *   • lizardfolk                : skipped — handled by drawSnout overlay.
 */
function drawMouthSouth(ctx, rig, opts = {}) {
  const { head } = rig;
  if (rig.species === 'lizardfolk') return;

  if (rig.species === 'goblin') {
    drawGoblinMouthSouth(ctx, rig, opts);
    return;
  }

  if (opts.open) {
    // Open battle-cry mouth — a small dark oval with a tongue/inner shadow.
    ctx.save();
    ctx.fillStyle = '#1a0808';
    ctx.strokeStyle = '#3a1808';
    ctx.lineWidth = Math.max(1.0, head.r * 0.05);
    ctx.beginPath();
    ctx.ellipse(head.x, head.y + head.r * 0.62, head.r * 0.16, head.r * 0.13,
      0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tongue
    ctx.fillStyle = '#a83a40';
    ctx.beginPath();
    ctx.ellipse(head.x, head.y + head.r * 0.66, head.r * 0.10, head.r * 0.06,
      0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Soft smile
  ctx.save();
  ctx.strokeStyle = '#3a1808';
  ctx.lineWidth = Math.max(1.0, head.r * 0.04);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(head.x - head.r * 0.10, head.y + head.r * 0.55);
  ctx.quadraticCurveTo(head.x, head.y + head.r * 0.62,
                       head.x + head.r * 0.10, head.y + head.r * 0.55);
  ctx.stroke();
  ctx.restore();
}

/**
 * Goblin's wide thin mouth with spiky teeth (south view).
 */
function drawGoblinMouthSouth(ctx, rig, opts = {}) {
  const { head } = rig;
  const cx = head.x;
  const cy = head.y + head.r * 0.55;
  const w  = head.r * 0.55;        // wide mouth
  const h  = head.r * (opts.open ? 0.14 : 0.05);  // open during attack

  // Mouth opening (dark interior)
  ctx.save();
  ctx.fillStyle = '#1a0a04';
  ctx.strokeStyle = '#1a0a04';
  ctx.lineWidth = Math.max(1.0, head.r * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.quadraticCurveTo(cx, cy + h, cx + w, cy);
  ctx.quadraticCurveTo(cx, cy - h * 0.3, cx - w, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spiky teeth — alternating sharp triangles along the upper jaw, with
  // a bright cel highlight near the tip and a darker shadow near the
  // gum line so each fang reads as a 3D shape rather than a flat shard.
  ctx.strokeStyle = '#1a0a04';
  ctx.lineWidth = Math.max(0.6, head.r * 0.025);
  const teethCount = 7;
  const toothSpan = (w * 2) / (teethCount + 1);
  for (let i = 1; i <= teethCount; i++) {
    const tx = cx - w + i * toothSpan;
    // Alternate up/down sized teeth for a snaggle look
    const big = i % 2 === 1;
    const th  = head.r * (big ? 0.10 : 0.06);
    const baseY = cy - h * 0.10;
    // Fang triangle
    ctx.fillStyle = '#fffbe0';
    ctx.beginPath();
    ctx.moveTo(tx - toothSpan * 0.40, baseY);
    ctx.lineTo(tx,                    baseY + th);
    ctx.lineTo(tx + toothSpan * 0.40, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bright vertical highlight stripe on each fang's lit side.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tx - toothSpan * 0.18, baseY + th * 0.10);
    ctx.lineTo(tx - toothSpan * 0.05, baseY + th * 0.85);
    ctx.lineTo(tx - toothSpan * 0.04, baseY + th * 0.85);
    ctx.lineTo(tx - toothSpan * 0.10, baseY + th * 0.10);
    ctx.closePath();
    ctx.fill();
    // Dim toward the gum line for a touch of depth.
    ctx.fillStyle = '#dac8a0';
    ctx.beginPath();
    ctx.moveTo(tx + toothSpan * 0.05, baseY);
    ctx.lineTo(tx + toothSpan * 0.40, baseY);
    ctx.lineTo(tx + toothSpan * 0.20, baseY + th * 0.30);
    ctx.lineTo(tx + toothSpan * 0.00, baseY + th * 0.10);
    ctx.closePath();
    ctx.fill();
  }

  // Two big fangs — protruding tusks at the corners with their own
  // bright highlight stripes.
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.85, cy - h * 0.10);
  ctx.lineTo(cx - w * 0.70, cy + h * 0.55 + head.r * 0.04);
  ctx.lineTo(cx - w * 0.55, cy - h * 0.10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.78, cy - h * 0.05);
  ctx.lineTo(cx - w * 0.72, cy + h * 0.40);
  ctx.lineTo(cx - w * 0.71, cy + h * 0.40);
  ctx.lineTo(cx - w * 0.74, cy - h * 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.55, cy - h * 0.10);
  ctx.lineTo(cx + w * 0.70, cy + h * 0.55 + head.r * 0.04);
  ctx.lineTo(cx + w * 0.85, cy - h * 0.10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.62, cy - h * 0.05);
  ctx.lineTo(cx + w * 0.68, cy + h * 0.40);
  ctx.lineTo(cx + w * 0.69, cy + h * 0.40);
  ctx.lineTo(cx + w * 0.66, cy - h * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Eye (side view) — single eye on the visible side, plus mouth + nose tip.
 */
function drawEyeWest(ctx, rig, eyes, opts = {}) {
  // Eyebrow first so the eye sits below it.
  drawEyebrowWest(ctx, rig, eyes);

  const { head } = rig;
  const ex = head.x - head.r * 0.42;
  const ey = head.y + head.r * 0.10;
  const eyeRX = head.r * 0.20;       // bigger than before
  const eyeRY = head.r * 0.17;
  const irisRX = head.r * 0.11;
  const irisRY = head.r * 0.16;

  const irisColor  = eyes.iris || eyes.base || '#3a2510';
  const irisShadow = eyes.shadow || mixColor(irisColor, '#000', 0.4);
  const sclera     = eyes.solid ? irisColor : (eyes.sclera || '#f6efe1');
  const lashColor  = eyes.outline || '#1a1010';

  // Sclera
  if (!eyes.solid) {
    const grad = ctx.createLinearGradient(ex, ey - eyeRY, ex, ey + eyeRY);
    grad.addColorStop(0, '#e9dfc9');
    grad.addColorStop(1, '#e0d4ba');
    VC.oval(ctx, ex, ey, eyeRX * 0.95, eyeRY, grad, null);
  } else {
    VC.oval(ctx, ex, ey, eyeRX * 0.95, eyeRY, irisColor, null);
  }

  // Iris
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ex, ey, eyeRX * 0.95, eyeRY, 0, 0, Math.PI * 2);
  ctx.clip();
  const irisGrad = ctx.createRadialGradient(
    ex - irisRX * 0.4, ey - irisRY * 0.3, irisRY * 0.10,
    ex,                ey,                irisRY * 1.10,
  );
  irisGrad.addColorStop(0,   lighten(irisColor, 0.25));
  irisGrad.addColorStop(0.55, irisColor);
  irisGrad.addColorStop(1,   irisShadow);
  VC.oval(ctx, ex - eyeRX * 0.10, ey + eyeRY * 0.05, irisRX, irisRY, irisGrad, null);
  VC.oval(ctx, ex - eyeRX * 0.10, ey + eyeRY * 0.05, irisRX * 0.45, irisRY * 0.45, '#080605', null);
  ctx.save();
  ctx.globalAlpha = 0.92;
  VC.oval(ctx, ex - eyeRX * 0.30, ey - eyeRY * 0.35, irisRX * 0.30, irisRY * 0.18, '#ffffff', null);
  ctx.restore();
  ctx.restore();

  // Lash
  ctx.save();
  ctx.strokeStyle = lashColor;
  ctx.lineWidth = Math.max(1.4, eyeRY * 0.35);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex - eyeRX * 0.95, ey - eyeRY * 0.10);
  ctx.quadraticCurveTo(ex, ey - eyeRY * 1.0, ex + eyeRX * 0.95, ey - eyeRY * 0.20);
  ctx.stroke();
  ctx.restore();

  // Lower lid
  ctx.save();
  ctx.strokeStyle = lashColor;
  ctx.lineWidth = Math.max(0.8, eyeRY * 0.18);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(ex - eyeRX * 0.85, ey + eyeRY * 0.20);
  ctx.quadraticCurveTo(ex, ey + eyeRY * 0.85, ex + eyeRX * 0.85, ey + eyeRY * 0.30);
  ctx.stroke();
  ctx.restore();

  // Nose tip + bridge shadow
  ctx.save();
  ctx.globalAlpha = 0.5;
  VC.oval(ctx, head.x - head.r * 0.88, head.y + head.r * 0.18,
    head.r * 0.06, head.r * 0.10, '#1a0e08', null);
  ctx.restore();

  drawMouthWest(ctx, rig, opts);
}

/**
 * Mouth (side view). Same dispatch logic as drawMouthSouth.
 */
function drawMouthWest(ctx, rig, opts = {}) {
  const { head } = rig;
  if (rig.species === 'lizardfolk') return;

  if (rig.species === 'goblin') {
    // Side-view goblin mouth — visible from the side as a wide open
    // crack with a tooth row.
    const cx = head.x - head.r * 0.50;
    const cy = head.y + head.r * 0.55;
    const w = head.r * 0.45;
    const h = head.r * (opts.open ? 0.13 : 0.05);
    ctx.save();
    ctx.fillStyle = '#1a0a04';
    ctx.strokeStyle = '#1a0a04';
    ctx.lineWidth = Math.max(1.0, head.r * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx, cy + h, cx + w, cy);
    ctx.quadraticCurveTo(cx, cy - h * 0.3, cx - w, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Teeth
    ctx.fillStyle = '#fffbe0';
    ctx.strokeStyle = '#1a0a04';
    ctx.lineWidth = Math.max(0.6, head.r * 0.025);
    for (let i = 0; i < 4; i++) {
      const tx = cx - w + (i + 0.5) * (w * 2 / 4);
      const big = i % 2 === 0;
      const th = head.r * (big ? 0.10 : 0.06);
      ctx.beginPath();
      ctx.moveTo(tx - head.r * 0.06, cy - h * 0.10);
      ctx.lineTo(tx,                 cy - h * 0.10 + th);
      ctx.lineTo(tx + head.r * 0.06, cy - h * 0.10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Protruding fang at the visible corner
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.95, cy - h * 0.10);
    ctx.lineTo(cx - w * 0.80, cy + h * 0.55 + head.r * 0.04);
    ctx.lineTo(cx - w * 0.65, cy - h * 0.10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (opts.open) {
    // Open battle-cry mouth, side view
    ctx.save();
    ctx.fillStyle = '#1a0808';
    ctx.strokeStyle = '#3a1808';
    ctx.lineWidth = Math.max(1.0, head.r * 0.05);
    ctx.beginPath();
    ctx.ellipse(head.x - head.r * 0.50, head.y + head.r * 0.62,
      head.r * 0.12, head.r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.strokeStyle = '#3a1808';
  ctx.lineWidth = Math.max(1.0, head.r * 0.04);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(head.x - head.r * 0.65, head.y + head.r * 0.55);
  ctx.quadraticCurveTo(head.x - head.r * 0.55, head.y + head.r * 0.62,
                       head.x - head.r * 0.40, head.y + head.r * 0.55);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Color utilities — used by the eye renderer.
// ---------------------------------------------------------------------------

function lighten(hex, amount) {
  return mixColor(hex, '#ffffff', amount);
}

function mixColor(a, b, t) {
  const pa = parseHex(a), pb = parseHex(b);
  const r = Math.round(pa[0] * (1 - t) + pb[0] * t);
  const g = Math.round(pa[1] * (1 - t) + pb[1] * t);
  const bl = Math.round(pa[2] * (1 - t) + pb[2] * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex) {
  if (!hex) return [0, 0, 0];
  if (hex.startsWith('rgb')) {
    const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(hex);
    return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
  }
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

// ---------------------------------------------------------------------------
// Hair
// ---------------------------------------------------------------------------

const HAIR_BLOBS = {
  // Each style provides a closed Catmull-Rom blob in head-relative units
  // (relative to head center; multiplied by head.r).  The blob sits BEHIND
  // the head and pokes out around the forehead/temples.
  short: [
    [-0.92, -0.10], [-0.95, -0.55], [-0.55, -1.05], [0.0, -1.18],
    [0.55, -1.05], [0.92, -0.55], [0.92,  0.05], [0.55, -0.30],
    [0.10, -0.55], [-0.40, -0.30],
  ],
  medium: [
    [-1.00, -0.10], [-1.05, -0.55], [-0.65, -1.10], [0.0, -1.22],
    [0.65, -1.10], [1.05, -0.55], [1.00,  0.40], [0.65,  0.30],
    [-0.65,  0.30], [-1.00,  0.40],
  ],
  long: [
    [-1.05,  0.10], [-1.10, -0.60], [-0.65, -1.15], [0.0, -1.25],
    [0.65, -1.15], [1.10, -0.60], [1.10,  0.95], [0.85,  1.10],
    [-0.85,  1.10], [-1.10,  0.95],
  ],
  curly: [
    [-1.05, -0.30], [-1.15, -0.85], [-0.85, -1.20], [-0.40, -1.35],
    [0.05, -1.30], [0.50, -1.40], [0.95, -1.25], [1.20, -0.85],
    [1.10, -0.30], [1.05,  0.30], [0.55,  0.10], [0.10,  0.30],
    [-0.40,  0.05], [-0.95,  0.30],
  ],
  spiky: [
    [-0.95, -0.10], [-1.10, -0.85], [-0.65, -0.55], [-0.55, -1.30],
    [-0.20, -0.65], [0.0, -1.40], [0.20, -0.65], [0.55, -1.30],
    [0.65, -0.55], [1.10, -0.85], [0.95, -0.10], [0.55, -0.20],
    [-0.55, -0.20],
  ],
  mohawk: [
    [-0.20, -0.05], [-0.30, -0.65], [-0.10, -1.40], [0.10, -1.40],
    [0.30, -0.65], [0.20, -0.05],
  ],
  topknot: [
    [-0.85, -0.10], [-0.90, -0.65], [-0.30, -0.95], [-0.20, -1.45],
    [0.20, -1.45], [0.30, -0.95], [0.90, -0.65], [0.85, -0.10],
  ],
  undercut: [
    [-0.55, -0.05], [-0.85, -0.55], [-0.55, -1.05], [0.0, -1.18],
    [0.55, -1.05], [0.85, -0.55], [0.55, -0.05], [0.40, -0.30],
    [-0.40, -0.30],
  ],
  buzzed: [
    [-0.85, -0.30], [-0.85, -0.85], [-0.45, -1.05], [0.0, -1.10],
    [0.45, -1.05], [0.85, -0.85], [0.85, -0.30],
  ],
  bald: null,
  // Hair pulled back into a ponytail — short on top, with a separate
  // tail rendered as a tail-bezier in drawHair.
  ponytail: [
    [-0.78, -0.15], [-0.85, -0.55], [-0.50, -1.00], [0.0, -1.10],
    [0.50, -1.00], [0.85, -0.55], [0.78, -0.05], [0.40, -0.30],
    [-0.40, -0.30],
  ],
  // Long hair swept asymmetrically to the right side — bigger on one
  // side than the other.
  side_swept: [
    [-1.05, -0.10], [-1.05, -0.55], [-0.55, -1.10], [0.10, -1.20],
    [0.65, -1.05], [1.10, -0.45], [1.20,  0.30], [1.05,  0.95],
    [0.55,  1.00], [-0.20,  0.45], [-0.95,  0.40],
  ],
};

/**
 * Back-hair halo — paints just the silhouette of the hair blob, scaled
 * up slightly so it pokes past the head outline in every direction.
 * Drawn BEFORE the head so the head silhouette covers the inner part,
 * leaving a clean rim of hair around the back/top of the head. Use this
 * in conjunction with drawHair (which now draws the bulk of the wig on
 * top of the head).
 */
function drawHairHalo(ctx, rig, hair, style) {
  if (!style || style === 'bald') return;
  const blob = HAIR_BLOBS[style] || HAIR_BLOBS.short;
  if (!blob) return;
  const { head } = rig;
  const direction = rig.direction;
  // Stretch the halo across the full head profile in side view.
  const scaleX = (direction === 'west' || direction === 'east') ? 1.05 : 1.05;
  const shiftX = (direction === 'west') ? head.r * 0.10
              : (direction === 'east') ? -head.r * 0.10
              : 0;
  const pts = blob.map(([nx, ny]) => [
    head.x + nx * head.r * scaleX + shiftX,
    head.y + ny * head.r * 1.02,    // slight Y stretch so it pokes above the skull-top
  ]);
  blobPath(ctx, pts, 0.55);
  ctx.fillStyle = hair.shadow || hair.base;
  ctx.fill();
  ctx.strokeStyle = hair.shadow || '#000';
  ctx.lineWidth = outlineW(rig, 0.18);
  ctx.stroke();
}

function drawHair(ctx, rig, hair, style) {
  if (!style || style === 'bald') return;
  const blob = HAIR_BLOBS[style] || HAIR_BLOBS.short;
  if (!blob) return;
  const { head } = rig;
  const direction = rig.direction;

  // Side view: hair stretches to cover the full head profile (forehead
  // → crown → back of skull). Earlier versions squashed the X by 0.62
  // which hid most of the hair behind the cheek silhouette; the new head
  // profile is asymmetric (face on the front side, taller skull at the
  // back) so we use a full-width scale and bias slightly toward the back.
  const scaleX = (direction === 'west' || direction === 'east') ? 1.05 : 1.0;
  const shiftX = (direction === 'west') ? head.r * 0.10
              : (direction === 'east') ? -head.r * 0.10
              : 0;

  const pts = blob.map(([nx, ny]) => [
    head.x + nx * head.r * scaleX + shiftX,
    head.y + ny * head.r,
  ]);

  // 1. Flat-fill the hair mass — solid base color with strong outline.
  blobPath(ctx, pts, 0.55);
  ctx.fillStyle = hair.base;
  ctx.fill();
  ctx.strokeStyle = hair.shadow || '#000';
  ctx.lineWidth = outlineW(rig, 0.32);
  ctx.stroke();

  // 2. Cel shadow band — a darker shape on the bottom-right of the hair
  // mass that matches the head's terminator. Drawn via source-atop so it
  // clips to the hair silhouette.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = hair.shadow || '#000';
  ctx.beginPath();
  ctx.moveTo(head.x + head.r * 0.20, head.y - head.r * 1.20);
  ctx.quadraticCurveTo(
    head.x + head.r * 1.30, head.y - head.r * 0.30,
    head.x + head.r * 0.40, head.y + head.r * 0.30,
  );
  ctx.lineTo(head.x + head.r * 0.10, head.y + head.r * 0.20);
  ctx.quadraticCurveTo(
    head.x + head.r * 0.40, head.y - head.r * 0.40,
    head.x + head.r * 0.20, head.y - head.r * 1.20,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Cel highlight stripe — a brighter band along the lit side of the
  // hair (top-left). Reads as a glossy specular highlight characteristic
  // of anime-style hair.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = hair.highlight || '#fff';
  ctx.beginPath();
  ctx.moveTo(head.x - head.r * 0.65, head.y - head.r * 1.25);
  ctx.quadraticCurveTo(
    head.x - head.r * 1.20, head.y - head.r * 0.85,
    head.x - head.r * 0.95, head.y - head.r * 0.30,
  );
  ctx.lineTo(head.x - head.r * 0.75, head.y - head.r * 0.40);
  ctx.quadraticCurveTo(
    head.x - head.r * 0.95, head.y - head.r * 0.85,
    head.x - head.r * 0.50, head.y - head.r * 1.10,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Strand streaks — a couple of subtle dark lines in the mid-tone
  // that suggest individual hair strands. Skipped for very-short / buzzed.
  if (['medium', 'long', 'curly', 'topknot'].includes(style)) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.30;
    ctx.strokeStyle = hair.shadow || '#000';
    ctx.lineWidth = head.r * 0.06;
    ctx.lineCap = 'round';
    for (const offsets of [
      [-0.45, -0.95, -0.10, -0.50],
      [ 0.25, -0.85,  0.55, -0.30],
      [-0.05, -1.05,  0.10, -0.55],
    ]) {
      ctx.beginPath();
      ctx.moveTo(head.x + offsets[0] * head.r * scaleX + shiftX,
                 head.y + offsets[1] * head.r);
      ctx.quadraticCurveTo(
        head.x + ((offsets[0] + offsets[2]) / 2) * head.r * scaleX + shiftX,
        head.y + ((offsets[1] + offsets[3]) / 2 - 0.15) * head.r,
        head.x + offsets[2] * head.r * scaleX + shiftX,
        head.y + offsets[3] * head.r);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. Cast shadow on the FOREHEAD has been removed from drawHair
  // because the hair now renders ON TOP of the head (called after
  // drawHead in the direction renderers). The fringe/forelock is the
  // hair fringe itself sitting on the forehead — no separate shadow
  // pass is needed.

  // 6. Fringe / forelock — a separate small mass that hangs in FRONT of
  // the forehead. Skipped for buzzed/undercut/mohawk (those styles don't
  // have bangs). Drawn after the cast shadow so the bangs sit on top of
  // the shadow they're supposedly casting.
  if (!['buzzed', 'mohawk', 'topknot'].includes(style)) {
    drawForelock(ctx, rig, hair, style);
  }

  // 7. Ponytail tail — a separate strand hanging behind the head when
  // the style is "ponytail". Tail position depends on facing direction:
  // south/north: a small loop behind the head; west/east: visible tail
  // sweeping back-and-down.
  if (style === 'ponytail') {
    drawPonytail(ctx, rig, hair, direction);
  }
}

function drawPonytail(ctx, rig, hair, direction) {
  const { head } = rig;
  const tailLen = head.r * 1.45;
  let rootX, rootY, midX, midY, tipX, tipY;
  if (direction === 'west') {
    rootX = head.x + head.r * 0.55;
    rootY = head.y - head.r * 0.10;
    midX  = rootX + tailLen * 0.55;
    midY  = rootY + tailLen * 0.30;
    tipX  = rootX + tailLen * 0.90;
    tipY  = rootY + tailLen * 0.65;
  } else if (direction === 'east') {
    rootX = head.x - head.r * 0.55;
    rootY = head.y - head.r * 0.10;
    midX  = rootX - tailLen * 0.55;
    midY  = rootY + tailLen * 0.30;
    tipX  = rootX - tailLen * 0.90;
    tipY  = rootY + tailLen * 0.65;
  } else {
    // South/North — tail visible past the silhouette on the right side.
    rootX = head.x + head.r * 0.20;
    rootY = head.y - head.r * 0.30;
    midX  = rootX + tailLen * 0.40;
    midY  = rootY + tailLen * 0.20;
    tipX  = rootX + tailLen * 0.60;
    tipY  = rootY + tailLen * 0.55;
  }
  ctx.save();
  // Dark base
  ctx.lineCap = 'round';
  ctx.lineWidth = head.r * 0.40;
  ctx.strokeStyle = hair.shadow || hair.base;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(midX, midY, tipX, tipY);
  ctx.stroke();
  // Highlight stripe along the lit side
  ctx.lineWidth = head.r * 0.18;
  ctx.strokeStyle = hair.highlight || hair.base;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.quadraticCurveTo(midX - head.r * 0.05, midY - head.r * 0.05, tipX, tipY);
  ctx.stroke();
  // Hair-tie at the root
  ctx.fillStyle = hair.shadow || '#000';
  VC.oval(ctx, rootX, rootY, head.r * 0.18, head.r * 0.13, hair.shadow || '#000', null);
  ctx.restore();
}

/**
 * Forelock / bangs — a small blob covering the upper forehead, with its
 * own miniature gradient. Different styles get slightly different
 * silhouettes (curly = chunkier, long = side-swept, etc.).
 */
function drawForelock(ctx, rig, hair, style) {
  const { head } = rig;
  const direction = rig.direction;

  // Base shape (front view)
  let pts;
  const yTop = -0.95, yBot = -0.30;
  if (style === 'curly') {
    pts = [
      [-0.85, -0.45], [-0.95, -0.85], [-0.50, -1.00], [-0.20, -0.85],
      [ 0.10, -1.00], [ 0.45, -0.85], [ 0.85, -0.95], [ 0.95, -0.55],
      [ 0.55, -0.30], [ 0.05, -0.50], [-0.55, -0.30],
    ];
  } else if (style === 'long' || style === 'medium') {
    pts = [
      [-0.95, -0.40], [-1.00, -0.80], [-0.55, -1.00], [-0.10, -0.95],
      [ 0.40, -1.05], [ 0.80, -0.85], [ 0.95, -0.45], [ 0.65, -0.20],
      [ 0.10, -0.40], [-0.45, -0.25], [-0.85, -0.30],
    ];
  } else if (style === 'spiky') {
    pts = [
      [-0.85, -0.40], [-0.85, -0.95], [-0.50, -0.55], [-0.30, -1.10],
      [-0.10, -0.55], [ 0.10, -1.15], [ 0.30, -0.60], [ 0.55, -1.00],
      [ 0.85, -0.55], [ 0.80, -0.30], [-0.55, -0.30],
    ];
  } else if (style === 'undercut') {
    pts = [
      [-0.45, -0.40], [-0.65, -0.85], [-0.20, -1.00],
      [ 0.30, -1.05], [ 0.75, -0.85], [ 0.85, -0.45],
      [ 0.50, -0.25], [-0.20, -0.30],
    ];
  } else { // short (default)
    pts = [
      [-0.80, -0.40], [-0.85, -0.85], [-0.40, -1.00], [ 0.0, -0.95],
      [ 0.45, -1.00], [ 0.80, -0.85], [ 0.85, -0.40], [ 0.45, -0.20],
      [-0.05, -0.35], [-0.50, -0.20],
    ];
  }
  void yTop; void yBot;

  // Side view: forelock stretches across the full head profile, biased
  // toward the front since bangs sit on the forehead.
  const scaleX = (direction === 'west' || direction === 'east') ? 1.00 : 1.0;
  const shiftX = (direction === 'west') ? -head.r * 0.05
              : (direction === 'east') ?  head.r * 0.05
              : 0;

  const scaled = pts.map(([nx, ny]) => [
    head.x + nx * head.r * scaleX + shiftX,
    head.y + ny * head.r,
  ]);

  // Slightly darker than the main hair mass so it reads as a separate plane.
  const darker = mixColor(hair.base || '#222', '#000', 0.20);
  const grad = ctx.createLinearGradient(
    head.x - head.r * 0.8, head.y - head.r * 0.95,
    head.x + head.r * 0.8, head.y - head.r * 0.30,
  );
  grad.addColorStop(0,   hair.highlight || hair.base || '#444');
  grad.addColorStop(0.4, hair.base || '#222');
  grad.addColorStop(1,   darker);

  blobPath(ctx, scaled, 0.55);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = hair.shadow || '#000';
  ctx.lineWidth = outlineW(rig, 0.18);
  ctx.stroke();

  // Thin shine streak for that anime "specular" highlight
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.55;
  const shine = ctx.createLinearGradient(
    head.x - head.r * 0.8, head.y - head.r * 0.85,
    head.x + head.r * 0.4, head.y - head.r * 0.55,
  );
  shine.addColorStop(0,   VC.hexAlpha(hair.highlight || '#fff', 0.85));
  shine.addColorStop(0.5, VC.hexAlpha(hair.highlight || '#fff', 0));
  ctx.fillStyle = shine;
  blobPath(ctx, scaled, 0.55);
  ctx.fill();
  ctx.restore();
}

// Issue Catmull-Rom bezier commands for a closed blob into the current
// drawing context. The active path is left on the ctx — caller decides
// whether to fill / stroke / clip / etc.
//
// (We can't use Path2D — @napi-rs/canvas does not expose it.)
function blobPath(ctx, points, tension = 0.5) {
  if (points.length < 3) return;
  const n = points.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    if (i === 0) ctx.moveTo(p1[0], p1[1]);
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Beard / Facial hair
// ---------------------------------------------------------------------------

function drawBeard(ctx, rig, hair, style) {
  if (!style || style === 'none') return;
  const { head } = rig;
  const direction = rig.direction;

  // Mustache + chin variants
  if (style === 'stubble') {
    ctx.save();
    ctx.globalAlpha = 0.35;
    VC.oval(ctx, head.x, head.y + head.r * 0.55, head.r * 0.55, head.r * 0.22,
      hair.shadow, null);
    ctx.restore();
    return;
  }
  if (style === 'handlebar') {
    ctx.save();
    ctx.fillStyle = hair.base;
    ctx.beginPath();
    ctx.moveTo(head.x - head.r * 0.45, head.y + head.r * 0.35);
    ctx.quadraticCurveTo(head.x, head.y + head.r * 0.55,
                         head.x + head.r * 0.45, head.y + head.r * 0.35);
    ctx.quadraticCurveTo(head.x + head.r * 0.55, head.y + head.r * 0.20,
                         head.x + head.r * 0.40, head.y + head.r * 0.30);
    ctx.quadraticCurveTo(head.x, head.y + head.r * 0.45,
                         head.x - head.r * 0.40, head.y + head.r * 0.30);
    ctx.quadraticCurveTo(head.x - head.r * 0.55, head.y + head.r * 0.20,
                         head.x - head.r * 0.45, head.y + head.r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.strokeStyle = hair.shadow;
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (style === 'goatee') {
    const pts = [
      [head.x - head.r * 0.30, head.y + head.r * 0.55],
      [head.x,                 head.y + head.r * 0.95],
      [head.x + head.r * 0.30, head.y + head.r * 0.55],
      [head.x,                 head.y + head.r * 0.45],
    ];
    VC.smoothBlob(ctx, pts, hair.base, hair.shadow, outlineW(rig, 0.10), 0.5);
    return;
  }
  if (style === 'full') {
    // Full beard wraps the jaw — a wide blob from ear to ear via chin.
    const pts = direction === 'west' || direction === 'east'
      ? [
          [head.x - head.r * 0.65, head.y + head.r * 0.20],
          [head.x - head.r * 0.55, head.y + head.r * 0.85],
          [head.x + head.r * 0.45, head.y + head.r * 0.95],
          [head.x + head.r * 0.65, head.y + head.r * 0.55],
          [head.x + head.r * 0.55, head.y + head.r * 0.35],
        ]
      : [
          [head.x - head.r * 0.85, head.y + head.r * 0.20],
          [head.x - head.r * 0.65, head.y + head.r * 0.95],
          [head.x,                 head.y + head.r * 1.10],
          [head.x + head.r * 0.65, head.y + head.r * 0.95],
          [head.x + head.r * 0.85, head.y + head.r * 0.20],
          [head.x + head.r * 0.50, head.y + head.r * 0.30],
          [head.x - head.r * 0.50, head.y + head.r * 0.30],
        ];
    const grad = VC.vGradient(
      ctx,
      head.x - head.r, head.y + head.r * 0.10, 0, head.r * 1.05,
      hair,
    );
    VC.smoothBlob(ctx, pts, grad, hair.shadow, outlineW(rig, 0.12), 0.5);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Hood — a hooded cowl that drapes over the head. Drawn as a smooth blob
 * that wraps the upper head + neck + shoulders. Works in conjunction
 * with a face-cast shadow so the hood reads as casting onto the face.
 *
 *   palette: any clothing palette (uses base + shadow + highlight).
 *   opts.lift = optional outline color override.
 */
function drawHood(ctx, rig, palette) {
  const { head, neck, chest } = rig;
  const direction = rig.direction;
  // Hood silhouette anchors on the shoulder line, wraps up over the head.
  let pts;
  if (direction === 'south' || direction === 'north') {
    pts = [
      [head.x - head.r * 1.20, neck.y + rig.limbR * 0.50],
      [head.x - head.r * 1.30, head.y - head.r * 0.20],
      [head.x - head.r * 0.90, head.y - head.r * 1.20],
      [head.x,                 head.y - head.r * 1.35],
      [head.x + head.r * 0.90, head.y - head.r * 1.20],
      [head.x + head.r * 1.30, head.y - head.r * 0.20],
      [head.x + head.r * 1.20, neck.y + rig.limbR * 0.50],
      // bottom shoulder line — clips by the chest line
      [chest.x + chest.w * 0.4, chest.y + rig.limbR * 0.10],
      [chest.x - chest.w * 0.4, chest.y + rig.limbR * 0.10],
    ];
  } else {
    // Side view: a directional cowl that protrudes more on one side.
    const ds = direction === 'west' ? -1 : 1;
    pts = [
      [head.x - ds * head.r * 1.10, neck.y + rig.limbR * 0.40],
      [head.x - ds * head.r * 1.30, head.y - head.r * 0.40],
      [head.x - ds * head.r * 1.00, head.y - head.r * 1.30],
      [head.x,                       head.y - head.r * 1.35],
      [head.x + ds * head.r * 0.85, head.y - head.r * 1.20],
      [head.x + ds * head.r * 1.05, head.y - head.r * 0.10],
      [head.x + ds * head.r * 0.95, neck.y + rig.limbR * 0.50],
      [chest.x + ds * chest.w * 0.30, chest.y + rig.limbR * 0.05],
    ];
  }
  // 1. Flat fill + outline.
  blobPath(ctx, pts, 0.55);
  ctx.fillStyle = palette.base;
  ctx.fill();
  ctx.strokeStyle = palette.outline || '#000';
  ctx.lineWidth = outlineW(rig, 0.32);
  ctx.stroke();

  // 2. Cel shadow on the right (under the hood lip + bottom-right).
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = palette.shadow || palette.base;
  ctx.beginPath();
  ctx.moveTo(head.x + head.r * 0.10, head.y - head.r * 1.30);
  ctx.quadraticCurveTo(
    head.x + head.r * 1.50, head.y - head.r * 0.30,
    head.x + head.r * 0.40, head.y + head.r * 1.10,
  );
  ctx.lineTo(head.x + head.r * 0.10, head.y + head.r * 1.10);
  ctx.quadraticCurveTo(
    head.x + head.r * 0.30, head.y - head.r * 0.40,
    head.x + head.r * 0.10, head.y - head.r * 1.30,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Hood lip — a small darker arc at the front of the hood opening,
  // suggesting the inside of the hood is darker than the outside.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = palette.deep_shadow || palette.outline || '#000';
  ctx.beginPath();
  if (direction === 'south' || direction === 'north') {
    ctx.moveTo(head.x - head.r * 0.95, head.y - head.r * 0.35);
    ctx.quadraticCurveTo(head.x, head.y - head.r * 0.15,
                         head.x + head.r * 0.95, head.y - head.r * 0.35);
    ctx.lineTo(head.x + head.r * 0.95, head.y - head.r * 0.55);
    ctx.quadraticCurveTo(head.x, head.y - head.r * 0.40,
                         head.x - head.r * 0.95, head.y - head.r * 0.55);
  } else {
    const ds = direction === 'west' ? -1 : 1;
    ctx.moveTo(head.x - ds * head.r * 0.95, head.y - head.r * 0.35);
    ctx.quadraticCurveTo(head.x, head.y - head.r * 0.20,
                         head.x + ds * head.r * 0.10, head.y - head.r * 0.30);
    ctx.lineTo(head.x + ds * head.r * 0.10, head.y - head.r * 0.55);
    ctx.quadraticCurveTo(head.x, head.y - head.r * 0.40,
                         head.x - ds * head.r * 0.95, head.y - head.r * 0.55);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Cast shadow onto the face — the hood always shadows the upper
  // half of the face for a "hooded" look. Drawn on top of the head fill
  // since the head is rendered before the hood.
  if (direction !== 'north') {
    VC.castShadow(ctx,
      head.x, head.y - head.r * 0.10,
      head.r * 0.85, head.r * 0.40,
      0.55, palette.outline || '#000');
  }
}

/**
 * Cape — a flowing rectangle of cloth that drapes from the shoulders to
 * mid-leg. Drawn BEFORE the body so the body silhouette occludes the
 * front, leaving the cape visible only on the sides + bottom.
 */
function drawCape(ctx, rig, palette, opts = {}) {
  const { chest, pelvis } = rig;
  const direction = rig.direction;
  const sway = opts.sway || 0;            // lateral offset for animation drift
  const len = (pelvis.y - chest.y) * 1.85; // extends below the hips
  const wTop = chest.w * 0.95;
  const wBot = chest.w * 1.30;
  let pts;
  if (direction === 'south' || direction === 'north') {
    pts = [
      [chest.x - wTop / 2,            chest.y + rig.limbR * 0.15],
      [chest.x - wBot / 2 + sway,     chest.y + len * 0.55],
      [chest.x - wBot / 2 + sway * 1.4, chest.y + len],
      [chest.x + wBot / 2 + sway * 1.4, chest.y + len],
      [chest.x + wBot / 2 + sway,     chest.y + len * 0.55],
      [chest.x + wTop / 2,            chest.y + rig.limbR * 0.15],
    ];
  } else {
    const ds = direction === 'west' ? -1 : 1;
    pts = [
      [chest.x + ds * wTop * 0.10,                   chest.y + rig.limbR * 0.10],
      [chest.x + ds * wTop * 0.30 + sway,            chest.y + len * 0.4],
      [chest.x + ds * wTop * 0.55 + sway * 1.4,      chest.y + len],
      [chest.x - ds * wTop * 0.10,                   chest.y + len],
      [chest.x - ds * wTop * 0.05,                   chest.y + len * 0.4],
      [chest.x - ds * wTop * 0.10,                   chest.y + rig.limbR * 0.10],
    ];
  }
  blobPath(ctx, pts, 0.50);
  ctx.fillStyle = palette.base;
  ctx.fill();
  ctx.strokeStyle = palette.outline || '#000';
  ctx.lineWidth = outlineW(rig, 0.30);
  ctx.stroke();

  // Vertical fold creases — three soft dark lines for cloth volume.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.strokeStyle = palette.shadow || palette.outline;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1.0, rig.limbR * 0.18);
  ctx.lineCap = 'round';
  for (const k of [-0.30, 0, 0.30]) {
    ctx.beginPath();
    ctx.moveTo(chest.x + wTop * k * 0.5, chest.y + rig.limbR * 0.4);
    ctx.lineTo(chest.x + wBot * k * 0.55 + sway * 1.2, chest.y + len * 0.95);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Shoulder pads — domed armor caps on each shoulder. Drawn after the
 * torso + arm so they overlay the shoulder seam.
 */
function drawShoulderPads(ctx, rig, palette) {
  const { shoulderL, shoulderR } = rig;
  const direction = rig.direction;
  const r = rig.limbR * 1.50;
  const drawOne = (sh, sign) => {
    ctx.save();
    ctx.translate(sh.x, sh.y - rig.limbR * 0.10);
    // A half-dome capped over the shoulder. Use a quadratic curve so the
    // dome reads as armor plate rather than a flat circle.
    ctx.fillStyle = palette.base;
    ctx.strokeStyle = palette.outline || '#000';
    ctx.lineWidth = outlineW(rig, 0.30);
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, r * 0.30);
    ctx.quadraticCurveTo(-r * 1.05, -r * 0.85, 0, -r * 0.95);
    ctx.quadraticCurveTo( r * 1.05, -r * 0.85,  r * 0.95, r * 0.30);
    ctx.quadraticCurveTo( 0,         r * 0.55, -r * 0.95, r * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Cel shadow on the bottom-right side
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = palette.shadow || palette.base;
    ctx.beginPath();
    ctx.moveTo(0,         -r * 0.95);
    ctx.quadraticCurveTo(r * 1.20, -r * 0.30, r * 0.95, r * 0.30);
    ctx.quadraticCurveTo(0, r * 0.55, 0, r * 0.30);
    ctx.lineTo(0, -r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Highlight rim
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = palette.highlight || '#fff';
    ctx.lineWidth = Math.max(1.2, r * 0.10);
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, r * 0.10);
    ctx.quadraticCurveTo(-r * 0.95, -r * 0.70, -r * 0.10, -r * 0.85);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    void sign;
  };
  if (direction === 'south' || direction === 'north') {
    drawOne(shoulderL, -1);
    drawOne(shoulderR,  1);
  } else if (direction === 'west') {
    drawOne(shoulderR, 1);   // back shoulder visible
    drawOne(shoulderL, -1);  // front shoulder
  } else {
    drawOne(shoulderL, -1);
    drawOne(shoulderR,  1);
  }
}

module.exports = {
  drawLimb,
  drawHand,
  drawGlove,
  drawShoe,
  drawCuff,
  drawPantCuff,
  drawPantFold,
  drawPelvisBridge,
  drawTorso,
  drawBelt,
  drawNeck,
  drawHead,
  drawEyesSouth,
  drawEyeWest,
  drawMouthSouth,
  drawMouthWest,
  drawHair,
  drawHairHalo,
  drawBeard,
  drawHood,
  drawCape,
  drawShoulderPads,
  outlineW,
};
