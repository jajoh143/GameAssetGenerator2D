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
 */
function drawLimb(ctx, root, mid, tip, palette, opts = {}) {
  const r0 = opts.rootR || 1.0;
  const r1 = opts.midR  || 0.92;
  const r2 = opts.tipR  || 0.75;
  const lineWidth = opts.lineWidth || 1.4;

  // Body fill (3-stop gradient along the limb axis)
  const grad = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  grad.addColorStop(0,   palette.highlight);
  grad.addColorStop(0.5, palette.base);
  grad.addColorStop(1,   palette.shadow || palette.base);

  VC.limb(ctx, root.x, root.y, r0, mid.x, mid.y, r1, grad, palette.outline || '#000', lineWidth);
  VC.limb(ctx, mid.x,  mid.y,  r1, tip.x, tip.y, r2, grad, palette.outline || '#000', lineWidth);

  // Joint cap (smooths the elbow/knee bend)
  VC.oval(ctx, mid.x, mid.y, r1, r1, palette.shadow || palette.base, null);
}

/**
 * Hand — small skin-coloured oval at the end of an arm.
 */
function drawHand(ctx, hand, skin, rig) {
  const r = rig.limbR * 1.05;
  VC.oval(ctx, hand.x, hand.y, r, r * 0.95,
    VC.radial(ctx, hand.x - r * 0.3, hand.y - r * 0.3, r * 1.1, skin.highlight, skin.base),
    skin.outline, outlineW(rig));
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
  VC.smoothBlob(ctx, pts, grad, clothing.outline || '#000', outlineW(rig, 0.22), 0.55);

  // Collar / neck-line accent
  if (clothing.collar && (direction === 'south' || direction === 'west' || direction === 'east')) {
    ctx.beginPath();
    ctx.moveTo(neck.x - rig.limbR * 1.2, chest.y + 1);
    ctx.quadraticCurveTo(neck.x, chest.y + rig.limbR * 0.7, neck.x + rig.limbR * 1.2, chest.y + 1);
    ctx.lineWidth = outlineW(rig, 0.18);
    ctx.strokeStyle = clothing.collar;
    ctx.stroke();
  }

  // A subtle crease down the chest centerline (only south view)
  if (direction === 'south' && opts.chestCrease !== false) {
    ctx.beginPath();
    ctx.moveTo(chest.x, chest.y + rig.limbR * 0.4);
    ctx.lineTo(chest.x, pelvis.y - rig.limbR * 0.2);
    ctx.lineWidth = outlineW(rig, 0.10);
    ctx.strokeStyle = clothing.shadow || clothing.outline;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;
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
  const grad = VC.radial(
    ctx,
    head.x - head.r * 0.25, head.y - head.r * 0.3,
    head.r * 1.5,
    skin.highlight,
    skin.base,
  );
  VC.oval(ctx, head.x, head.y, head.r * 0.92, head.r,
    grad, skin.outline, outlineW(rig, 0.20));

  // Soft cheek shadow on the bottom-right (south view)
  if (rig.direction === 'south') {
    ctx.save();
    ctx.globalAlpha = 0.35;
    VC.oval(ctx, head.x + head.r * 0.25, head.y + head.r * 0.25,
      head.r * 0.6, head.r * 0.45, skin.shadow, null);
    ctx.restore();
  }
}

/**
 * Eyes (front view) — two small ovals with iris and a tiny highlight.
 */
function drawEyesSouth(ctx, rig, eyes) {
  const { head } = rig;
  const dx = head.r * 0.32;
  const dy = head.r * 0.05;
  const eyeR  = head.r * 0.13;
  const irisR = head.r * 0.08;

  const irisColor = eyes.iris || eyes.base || '#3a2510';
  const sclera    = eyes.solid ? irisColor : (eyes.sclera || '#f0e8d8');

  for (const sign of [-1, 1]) {
    const ex = head.x + dx * sign;
    const ey = head.y + dy;
    // Sclera (or solid demon/fairy eye)
    VC.oval(ctx, ex, ey, eyeR, eyeR * 0.85, sclera, '#1a1010', outlineW(rig, 0.10));
    // Iris
    VC.oval(ctx, ex, ey + eyeR * 0.05, irisR, irisR, irisColor, null);
    // Pupil
    VC.oval(ctx, ex, ey + eyeR * 0.05, irisR * 0.45, irisR * 0.45, '#000', null);
    // Catch-light
    VC.oval(ctx, ex - eyeR * 0.25, ey - eyeR * 0.25, eyeR * 0.18, eyeR * 0.18, '#fff', null);
  }
}

/**
 * Eye (side view) — single eye on the visible side.
 */
function drawEyeWest(ctx, rig, eyes) {
  const { head } = rig;
  const ex = head.x - head.r * 0.42;
  const ey = head.y + head.r * 0.05;
  const eyeR  = head.r * 0.13;
  const irisR = head.r * 0.07;

  const irisColor = eyes.iris || eyes.base || '#3a2510';
  const sclera    = eyes.solid ? irisColor : (eyes.sclera || '#f0e8d8');

  VC.oval(ctx, ex, ey, eyeR * 0.85, eyeR * 0.85, sclera, '#1a1010', outlineW(rig, 0.10));
  VC.oval(ctx, ex - eyeR * 0.1, ey + eyeR * 0.05, irisR, irisR, irisColor, null);
  VC.oval(ctx, ex - eyeR * 0.1, ey + eyeR * 0.05, irisR * 0.5, irisR * 0.5, '#000', null);
  VC.oval(ctx, ex - eyeR * 0.25, ey - eyeR * 0.25, eyeR * 0.15, eyeR * 0.15, '#fff', null);

  // Tiny nose-tip shadow
  ctx.save();
  ctx.globalAlpha = 0.4;
  VC.oval(ctx, head.x - head.r * 0.85, head.y + head.r * 0.18,
    head.r * 0.06, head.r * 0.08, '#1a0e08', null);
  ctx.restore();
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
};

function drawHair(ctx, rig, hair, style) {
  if (!style || style === 'bald') return;
  const blob = HAIR_BLOBS[style] || HAIR_BLOBS.short;
  if (!blob) return;
  const { head } = rig;
  const direction = rig.direction;

  // Side-view: shift blob so it follows the front-facing temple instead of
  // wrapping fully around. Accomplish by squashing X by 0.6 and shifting +x
  // toward the back of the head.
  const scaleX = (direction === 'west' || direction === 'east') ? 0.62 : 1.0;
  const shiftX = (direction === 'west') ? head.r * 0.18
              : (direction === 'east') ? -head.r * 0.18
              : 0;

  const pts = blob.map(([nx, ny]) => [
    head.x + nx * head.r * scaleX + shiftX,
    head.y + ny * head.r,
  ]);
  const grad = VC.vGradient(
    ctx,
    head.x - head.r, head.y - head.r * 1.2,
    0, head.r * 2.2,
    hair,
  );
  VC.smoothBlob(ctx, pts, grad, hair.shadow || '#000', outlineW(rig, 0.18), 0.55);

  // A subtle inner-shadow streak for depth (curly + medium + long)
  if (['curly', 'medium', 'long'].includes(style)) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    VC.oval(ctx, head.x, head.y - head.r * 0.85, head.r * 0.55, head.r * 0.25,
      hair.shadow, null);
    ctx.restore();
  }
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
  drawTorso,
  drawBelt,
  drawNeck,
  drawHead,
  drawEyesSouth,
  drawEyeWest,
  drawHair,
  drawBeard,
  outlineW,
};
