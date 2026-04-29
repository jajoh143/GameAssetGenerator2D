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
// consistent across height/build presets).
function outlineW(rig, factor = 0.18) {
  return Math.max(1.2, rig.limbR * factor);
}

// ---------------------------------------------------------------------------
// Limbs
// ---------------------------------------------------------------------------

/**
 * Draw a 2-segment limb (shoulder → elbow → hand, or hip → knee → foot)
 * with tapered radii for a hand-drawn feel.
 *
 * Shading layers (back-to-front):
 *   1. base gradient along limb axis (highlight → base → shadow)
 *   2. cross-axis form-shadow gradient (lit on top-left, shadowed on
 *      bottom-right) — gives the limb a cylindrical feel
 *   3. rim highlight on the top-left edge
 *   4. small AO blob at the joint (elbow/knee crease)
 */
function drawLimb(ctx, root, mid, tip, palette, opts = {}) {
  const r0 = opts.rootR || 1.0;
  const r1 = opts.midR  || 0.92;
  const r2 = opts.tipR  || 0.75;
  const lineWidth = opts.lineWidth || 1.4;

  // 1. Base axial gradient (lighter toward root, darker toward tip — useful
  // when limbs hang down so the foot is darker than the hip).
  const grad = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  grad.addColorStop(0,   palette.highlight);
  grad.addColorStop(0.55, palette.base);
  grad.addColorStop(1,   palette.shadow || palette.base);

  const outline = palette.outline || '#000';
  VC.limb(ctx, root.x, root.y, r0, mid.x, mid.y, r1, grad, outline, lineWidth);
  VC.limb(ctx, mid.x,  mid.y,  r1, tip.x, tip.y, r2, grad, outline, lineWidth);

  // 2. Cylindrical form shadow — overlay a cross-axis dark band on the
  // bottom-right side so the limb reads as a tube, not a flat ribbon.
  if (palette.shadow) {
    const seg = (a, b, ra, rb) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;       // perpendicular unit (right side)
      const offX = nx * ra * 0.55, offY = ny * ra * 0.55;
      const formGrad = ctx.createLinearGradient(
        a.x - nx * ra, a.y - ny * ra,
        a.x + nx * ra, a.y + ny * ra,
      );
      formGrad.addColorStop(0,   VC.hexAlpha(palette.shadow, 0));
      formGrad.addColorStop(0.45, VC.hexAlpha(palette.shadow, 0));
      formGrad.addColorStop(1,   VC.hexAlpha(palette.shadow, 0.55));
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      VC.limb(ctx, a.x, a.y, ra, b.x, b.y, rb, formGrad, null, 0);
      ctx.restore();
      // Rim highlight on the lit edge
      const rimGrad = ctx.createLinearGradient(
        a.x - nx * ra, a.y - ny * ra,
        a.x + nx * ra, a.y + ny * ra,
      );
      rimGrad.addColorStop(0,   VC.hexAlpha(palette.highlight, 0.55));
      rimGrad.addColorStop(0.35, VC.hexAlpha(palette.highlight, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      VC.limb(ctx, a.x, a.y, ra, b.x, b.y, rb, rimGrad, null, 0);
      ctx.restore();
      void offX; void offY;
    };
    seg(root, mid, r0, r1);
    seg(mid,  tip, r1, r2);
  }

  // 3. Joint AO + cap — a small dark oval that smooths the bend AND
  // hints at how the limb folds at the joint.
  VC.oval(ctx, mid.x, mid.y, r1 * 0.95, r1 * 0.92, palette.shadow || palette.base, null);
  VC.castShadow(ctx, mid.x + r1 * 0.20, mid.y + r1 * 0.30,
    r1 * 0.65, r1 * 0.45, 0.35, palette.outline);
}

/**
 * Hand — skin-coloured oval at the end of an arm.
 *
 *   opts.fist:    draw a slightly larger, stronger-shaded fist instead of an
 *                 open hand (used during attack animations / weapon grip).
 *   opts.toward:  optional unit vector { dx, dy } pointing away from the
 *                 wrist toward where a weapon would extend — when supplied,
 *                 the fist's knuckle ridge orients along it.
 */
function drawHand(ctx, hand, skin, rig, opts = {}) {
  const r = rig.limbR * (opts.fist ? 1.15 : 1.05);
  VC.oval(ctx, hand.x, hand.y, r, r * (opts.fist ? 0.92 : 0.95),
    VC.radial(ctx, hand.x - r * 0.3, hand.y - r * 0.3, r * 1.1, skin.highlight, skin.base),
    skin.outline, outlineW(rig));

  // For a fist, add knuckle ridges + a darker palm shadow so it reads as
  // closed instead of open.
  if (opts.fist) {
    const tx = (opts.toward && opts.toward.dx) || 0;
    const ty = (opts.toward && opts.toward.dy) || 1;
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len, uy = ty / len;
    // Perpendicular for the knuckle row
    const px = -uy, py = ux;
    // Knuckle row: 3 short dark dashes across the wrist-forward face
    ctx.save();
    ctx.strokeStyle = skin.outline || '#1a0a06';
    ctx.lineWidth = Math.max(1.0, r * 0.18);
    ctx.lineCap = 'round';
    for (const k of [-0.55, -0.10, 0.35]) {
      const cx = hand.x + ux * r * 0.25 + px * r * k;
      const cy = hand.y + uy * r * 0.25 + py * r * k;
      ctx.beginPath();
      ctx.moveTo(cx - ux * r * 0.18, cy - uy * r * 0.18);
      ctx.lineTo(cx + ux * r * 0.18, cy + uy * r * 0.18);
      ctx.stroke();
    }
    ctx.restore();
    // Palm shadow on the opposite side
    ctx.save();
    ctx.globalAlpha = 0.35;
    VC.oval(ctx,
      hand.x - ux * r * 0.30, hand.y - uy * r * 0.30,
      r * 0.60, r * 0.45,
      skin.shadow || skin.outline, null);
    ctx.restore();
  }
}

/**
 * Pant fold / seam — a single soft vertical line down the side of a leg
 * in profile view. Suggests the outer-leg seam of jeans / trousers and
 * adds form to the otherwise-flat side-view leg.
 */
function drawPantFold(ctx, hip, knee, foot, rig, pants) {
  // Use the seam direction along the hip→foot vector. Bias the line
  // slightly toward the outside (perpendicular to the leg axis).
  const dx1 = knee.x - hip.x, dy1 = knee.y - hip.y;
  const dx2 = foot.x - knee.x, dy2 = foot.y - knee.y;
  // Outside perpendicular: rotate +90° from the hip→knee vector.
  const len1 = Math.hypot(dx1, dy1) || 1;
  const ox = -dy1 / len1, oy = dx1 / len1;
  const off = rig.limbR * 0.18;
  ctx.save();
  ctx.strokeStyle = pants.deep_shadow || pants.shadow || pants.outline || '#222';
  ctx.lineWidth = Math.max(0.8, rig.limbR * 0.10);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(hip.x + ox * off, hip.y + oy * off);
  ctx.lineTo(knee.x + ox * off, knee.y + oy * off);
  ctx.lineTo(foot.x + ox * off * 0.6, foot.y + oy * off * 0.6);
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
 */
function drawShoe(ctx, foot, shoes, rig, direction) {
  const r = rig.limbR;
  const sx = direction === 'west' || direction === 'east' ? r * 2.2 : r * 1.4;
  const sy = r * 0.95;
  // Upper
  VC.oval(ctx, foot.x, foot.y, sx, sy,
    VC.diagGradient(ctx, foot.x - sx, foot.y - sy, sx * 2, sy * 2, shoes),
    shoes.outline, outlineW(rig));
  // Sole
  VC.oval(ctx, foot.x, foot.y + sy * 0.55, sx * 0.95, sy * 0.4,
    shoes.shadow || shoes.outline, shoes.outline, outlineW(rig, 0.15));
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

  // Shoulder width pads slightly past the chest.w to read like rounded shoulders.
  const sw = chest.w / 2;
  const hw = pelvis.w / 2;
  const wy = (chest.y + pelvis.y) / 2;            // waist height
  const wWaist = (sw + hw) / 2 * 0.78;             // pinch at waist

  let pts;
  if (direction === 'south' || direction === 'north') {
    pts = [
      [chest.x - sw,        chest.y + 1],
      [chest.x - sw * 0.94, wy - 1],
      [chest.x - wWaist,    wy + (pelvis.y - wy) * 0.2],
      [pelvis.x - hw,       pelvis.y - 1],
      [pelvis.x - hw * 0.7, pelvis.y + rig.limbR * 0.4],
      [pelvis.x + hw * 0.7, pelvis.y + rig.limbR * 0.4],
      [pelvis.x + hw,       pelvis.y - 1],
      [chest.x + wWaist,    wy + (pelvis.y - wy) * 0.2],
      [chest.x + sw * 0.94, wy - 1],
      [chest.x + sw,        chest.y + 1],
      [chest.x,             chest.y - rig.limbR * 0.3],   // top center (collar dip)
    ];
  } else {
    // Side view — much narrower silhouette (depth-of-body, not width).
    const sd = sw * 0.55;     // chest depth
    const hd = hw * 0.62;     // hip depth
    pts = [
      [chest.x - sd,        chest.y + 2],
      [chest.x - sd * 0.95, wy],
      [chest.x - sd * 0.7,  pelvis.y - 1],
      [chest.x - sd * 0.4,  pelvis.y + rig.limbR * 0.3],
      [chest.x + sd * 0.4,  pelvis.y + rig.limbR * 0.3],
      [chest.x + sd * 0.85, pelvis.y - 1],
      [chest.x + sd * 0.95, wy],
      [chest.x + sd * 0.95, chest.y + 2],
      [chest.x,             chest.y - rig.limbR * 0.4],   // shoulder-top dip
    ];
  }

  const grad = VC.diagGradient(
    ctx,
    chest.x - sw, chest.y,
    sw * 2,       pelvis.y - chest.y,
    clothing,
  );
  // Lay down the blob path so subsequent shading layers can re-issue it.
  blobPath(ctx, pts, 0.55);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = clothing.outline || '#000';
  ctx.lineWidth = outlineW(rig, 0.22);
  ctx.stroke();

  // 2. Form shadow on the right side — overlay a vertical dark band so
  // the torso reads as a 3D barrel / cylinder.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.55;
  const formGrad = ctx.createLinearGradient(
    chest.x - sw, 0,
    chest.x + sw, 0,
  );
  formGrad.addColorStop(0,   VC.hexAlpha(clothing.shadow || '#000', 0));
  formGrad.addColorStop(0.55, VC.hexAlpha(clothing.shadow || '#000', 0));
  formGrad.addColorStop(1,   VC.hexAlpha(clothing.deep_shadow || clothing.shadow || '#000', 0.85));
  ctx.fillStyle = formGrad;
  blobPath(ctx, pts, 0.55);
  ctx.fill();
  ctx.restore();

  // 3. Rim highlight along the upper-left chest edge.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.40;
  const rimGrad = ctx.createLinearGradient(
    chest.x - sw,        chest.y,
    chest.x + sw * 0.20, chest.y + (pelvis.y - chest.y) * 0.4,
  );
  rimGrad.addColorStop(0,   VC.hexAlpha(clothing.highlight || '#fff', 0.85));
  rimGrad.addColorStop(0.5, VC.hexAlpha(clothing.highlight || '#fff', 0));
  ctx.fillStyle = rimGrad;
  blobPath(ctx, pts, 0.55);
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

  // 6. Centerline crease (south view) — the seam where shirt buttons / zip
  // would run. Subtle but adds depth.
  if (direction === 'south' && opts.chestCrease !== false) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(chest.x, chest.y + rig.limbR * 0.4);
    ctx.lineTo(chest.x, pelvis.y - rig.limbR * 0.2);
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.strokeStyle = clothing.deep_shadow || clothing.outline;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.restore();
  }

  // 7. Jacket lapels — V-shape from collar to chest, drawn for jacket-
  // family clothing (jacket / bomber / coat). Skipped for shirts/tanks.
  if (direction === 'south' && opts.lapels) {
    const lapelTop = chest.y + rig.limbR * 0.10;
    const lapelBot = chest.y + (pelvis.y - chest.y) * 0.55;
    const lapelW   = sw * 0.42;
    ctx.save();
    ctx.fillStyle = clothing.deep_shadow || clothing.shadow || '#222';
    ctx.beginPath();
    ctx.moveTo(chest.x - rig.limbR * 0.65, lapelTop);
    ctx.lineTo(chest.x - lapelW * 0.50,    lapelBot);
    ctx.lineTo(chest.x,                    lapelBot - rig.limbR * 0.5);
    ctx.lineTo(chest.x,                    lapelTop);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(chest.x + rig.limbR * 0.65, lapelTop);
    ctx.lineTo(chest.x + lapelW * 0.50,    lapelBot);
    ctx.lineTo(chest.x,                    lapelBot - rig.limbR * 0.5);
    ctx.lineTo(chest.x,                    lapelTop);
    ctx.closePath();
    ctx.fill();
    // Subtle stitch line along the lapel edge
    ctx.strokeStyle = VC.hexAlpha(clothing.highlight || '#fff', 0.35);
    ctx.lineWidth = outlineW(rig, 0.06);
    ctx.beginPath();
    ctx.moveTo(chest.x - rig.limbR * 0.65, lapelTop);
    ctx.lineTo(chest.x - lapelW * 0.50,    lapelBot);
    ctx.moveTo(chest.x + rig.limbR * 0.65, lapelTop);
    ctx.lineTo(chest.x + lapelW * 0.50,    lapelBot);
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
}

// ---------------------------------------------------------------------------
// Belt
// ---------------------------------------------------------------------------

function drawBelt(ctx, rig, belt) {
  if (!belt) return;
  const { pelvis } = rig;
  const direction = rig.direction;
  const w = pelvis.w * 0.95;
  const h = rig.limbR * 0.7;
  const x = pelvis.x - w / 2;
  const y = pelvis.y - h * 0.4;

  if (direction === 'west' || direction === 'east') {
    const sd = pelvis.w * 0.32;
    VC.roundRect(ctx, pelvis.x - sd, y, sd * 2, h,
      h * 0.45, belt.base, belt.outline || '#000', outlineW(rig, 0.15));
  } else {
    VC.roundRect(ctx, x, y, w, h, h * 0.45,
      belt.base, belt.outline || '#000', outlineW(rig, 0.15));
    // Buckle
    VC.roundRect(ctx, pelvis.x - h * 0.7, y + h * 0.1, h * 1.4, h * 0.8, h * 0.2,
      belt.highlight || belt.base, belt.outline || '#000', outlineW(rig, 0.12));
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

  // 2. Base fill — diagonal radial gradient (light from top-left).
  const grad = ctx.createRadialGradient(
    head.x - head.r * 0.30, head.y - head.r * 0.40, 0,
    head.x - head.r * 0.30, head.y - head.r * 0.40, head.r * 1.7,
  );
  grad.addColorStop(0, skin.highlight);
  grad.addColorStop(0.55, skin.base);
  grad.addColorStop(1, skin.shadow || skin.base);

  blobPath(ctx, blob, 0.55);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = outlineW(rig, 0.22);
  ctx.stroke();

  // 3. Core shadow — a darker crescent on the bottom-right cheek that
  // defines the terminator. Painted via source-atop so it's clipped to
  // the new tapered silhouette.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.55;
  const coreGrad = ctx.createRadialGradient(
    head.x + head.r * 0.55, head.y + head.r * 0.40, 0,
    head.x + head.r * 0.55, head.y + head.r * 0.40, head.r * 1.10,
  );
  coreGrad.addColorStop(0,   skin.shadow);
  coreGrad.addColorStop(0.5, skin.shadow);
  coreGrad.addColorStop(1,   VC.hexAlpha(skin.shadow, 0));
  ctx.fillStyle = coreGrad;
  blobPath(ctx, blob, 0.55);
  ctx.fill();
  ctx.restore();

  // 4. Reflected light — a faint warm bloom on the bottom-left jaw.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.22;
  const bounce = ctx.createRadialGradient(
    head.x - head.r * 0.55, head.y + head.r * 0.55, 0,
    head.x - head.r * 0.55, head.y + head.r * 0.55, head.r * 0.95,
  );
  bounce.addColorStop(0, skin.highlight);
  bounce.addColorStop(1, VC.hexAlpha(skin.highlight, 0));
  ctx.fillStyle = bounce;
  blobPath(ctx, blob, 0.55);
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

  const eyeRX = head.r * 0.18;       // wider almond
  const eyeRY = head.r * 0.13;
  const irisRX = head.r * 0.10;
  const irisRY = head.r * 0.13;       // taller-than-wide iris reads as "anime"

  const irisColor   = eyes.iris   || eyes.base || '#3a2510';
  const irisShadow  = eyes.shadow || mixColor(irisColor, '#000', 0.45);
  const sclera      = eyes.solid ? irisColor : (eyes.sclera || '#f6efe1');
  const lashColor   = eyes.outline || '#1a1010';

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

    // 3. Upper-lid (lash) — a thicker dark stroke that hugs the top of the
    // eye, with a small flick at the outer corner.
    ctx.save();
    ctx.strokeStyle = lashColor;
    ctx.lineWidth   = Math.max(1.4, eyeRY * 0.35);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - eyeRX * 0.95, ey - eyeRY * 0.20);
    ctx.quadraticCurveTo(ex, ey - eyeRY * 1.05, ex + eyeRX * 0.95, ey - eyeRY * 0.10);
    // Outer-corner flick
    ctx.quadraticCurveTo(ex + eyeRX * 1.05, ey - eyeRY * 0.05,
                         ex + eyeRX * 1.10 * sign, ey - eyeRY * 0.30 * (sign > 0 ? 1 : 1));
    ctx.stroke();
    ctx.restore();

    // 4. Lower lid — thin soft line (subtler than the lash).
    ctx.save();
    ctx.strokeStyle = lashColor;
    ctx.lineWidth   = Math.max(0.8, eyeRY * 0.18);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(ex - eyeRX * 0.85, ey + eyeRY * 0.20);
    ctx.quadraticCurveTo(ex, ey + eyeRY * 0.95, ex + eyeRX * 0.85, ey + eyeRY * 0.30);
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

  // Spiky teeth — alternating sharp triangles along the upper jaw.
  ctx.fillStyle = '#fffbe0';
  ctx.strokeStyle = '#1a0a04';
  ctx.lineWidth = Math.max(0.6, head.r * 0.025);
  const teethCount = 7;
  const toothSpan = (w * 2) / (teethCount + 1);
  for (let i = 1; i <= teethCount; i++) {
    const tx = cx - w + i * toothSpan;
    // Alternate up/down sized teeth for a snaggle look
    const big = i % 2 === 1;
    const th  = head.r * (big ? 0.10 : 0.06);
    ctx.beginPath();
    ctx.moveTo(tx - toothSpan * 0.40, cy - h * 0.10);
    ctx.lineTo(tx,                    cy - h * 0.10 + th);
    ctx.lineTo(tx + toothSpan * 0.40, cy - h * 0.10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Two big fangs — protruding tusks at the corners
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.85, cy - h * 0.10);
  ctx.lineTo(cx - w * 0.70, cy + h * 0.55 + head.r * 0.04);
  ctx.lineTo(cx - w * 0.55, cy - h * 0.10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + w * 0.55, cy - h * 0.10);
  ctx.lineTo(cx + w * 0.70, cy + h * 0.55 + head.r * 0.04);
  ctx.lineTo(cx + w * 0.85, cy - h * 0.10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Eye (side view) — single eye on the visible side, plus mouth + nose tip.
 */
function drawEyeWest(ctx, rig, eyes, opts = {}) {
  const { head } = rig;
  const ex = head.x - head.r * 0.42;
  const ey = head.y + head.r * 0.10;
  const eyeRX = head.r * 0.16;
  const eyeRY = head.r * 0.13;
  const irisRX = head.r * 0.08;
  const irisRY = head.r * 0.12;

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

  // 1. Base hair fill — diagonal gradient (highlight on top-left, shadow
  // bottom-right) so the hair mass reads as 3D, not flat.
  const grad = ctx.createLinearGradient(
    head.x - head.r * 1.1, head.y - head.r * 1.3,
    head.x + head.r * 1.1, head.y + head.r * 0.6,
  );
  grad.addColorStop(0,   hair.highlight || hair.base);
  grad.addColorStop(0.5, hair.base);
  grad.addColorStop(1,   hair.shadow || hair.base);
  VC.smoothBlob(ctx, pts, grad, hair.shadow || '#000', outlineW(rig, 0.20), 0.55);

  // 2. Form shadow blob on the bottom-right of the hair mass — a soft
  // crescent that matches the head's core shadow direction.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.50;
  const formShadow = ctx.createRadialGradient(
    head.x + head.r * 0.55, head.y - head.r * 0.20, 0,
    head.x + head.r * 0.55, head.y - head.r * 0.20, head.r * 1.4,
  );
  formShadow.addColorStop(0,   VC.hexAlpha(hair.shadow || '#000', 0.0));
  formShadow.addColorStop(0.45, VC.hexAlpha(hair.shadow || '#000', 0.6));
  formShadow.addColorStop(1,   VC.hexAlpha(hair.shadow || '#000', 0.0));
  ctx.fillStyle = formShadow;
  blobPath(ctx, pts, 0.55);
  ctx.fill();
  ctx.restore();

  // 3. Rim highlight along the top-left silhouette — gives the hair a
  // glossy "anime"-style sheen.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.55;
  const rim = ctx.createLinearGradient(
    head.x - head.r * 1.1, head.y - head.r * 1.3,
    head.x + head.r * 0.0, head.y - head.r * 0.4,
  );
  rim.addColorStop(0,   VC.hexAlpha(hair.highlight || '#fff', 0.85));
  rim.addColorStop(0.6, VC.hexAlpha(hair.highlight || '#fff', 0.0));
  ctx.fillStyle = rim;
  blobPath(ctx, pts, 0.55);
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

module.exports = {
  drawLimb,
  drawHand,
  drawShoe,
  drawCuff,
  drawPantCuff,
  drawPantFold,
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
  outlineW,
};
