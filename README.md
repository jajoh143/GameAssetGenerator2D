# GameAssetGenerator2D

A Node.js tool that procedurally generates 2D pixel art RPG character spritesheets using the `canvas` npm package. No pre-made assets — every pixel is drawn with code.

## Features

- **Procedural pixel art** — all characters drawn with `fillRect` and pixel operations
- **3-shade coloring** — highlight / base / shadow on every body part
- **1px outlines** — crisp dark borders around each body part
- **Two character types**: Human and Demon (extends Human with horns, tail, claws, glowing eyes)
- **Five presets**: human_casual, human_mechanic, human_hoodie, demon_warrior, demon_cook
- **All 4 directions**: south (front), west (left profile), north (back), east (right profile — auto-mirrored)
- **Three animation sets**: Idle (4 frames), Walk (8 frames × 4 directions), Attack (6 frames × 4 directions)
- **Single PNG output** — 512×576 spritesheet per character (64×64 frames, 9 rows)

## Spritesheet Layout

| Row | Animation     | Frames |
|-----|---------------|--------|
| 0   | idle          | 4      |
| 1   | walk_south    | 8      |
| 2   | walk_west     | 8      |
| 3   | walk_north    | 8      |
| 4   | walk_east     | 8      |
| 5   | attack_south  | 6      |
| 6   | attack_west   | 6      |
| 7   | attack_north  | 6      |
| 8   | attack_east   | 6      |

## Requirements

- Node.js ≥ 14
- System libraries for node-canvas (Cairo / Pango):
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev
  ```

## Setup & Run

```bash
npm install
node src/index.js
```

Generated PNGs are saved to `output/`. A `preview/manifest.json` is also written.

## Preview

After generating, open `preview/index.html` in a browser (requires a local HTTP server due to `fetch` for `manifest.json`):

```bash
npx serve .
# then open http://localhost:3000/preview/index.html
```

The preview page shows:
- Live animated previews for idle, walk south/west, attack south
- Full sprite strip for every animation row
- Controls for scale (1–6×), FPS, background colour, pause/resume

## File Structure

```
src/
  core/
    Colors.js         # All colour palettes (skin tones, hair, clothing, demon extras)
    Canvas.js         # Canvas helpers (fillRect, pixel, outlineRect, fillEllipse, mirror…)
    Spritesheet.js    # Composites frames into a 512×576 PNG
  characters/
    CharacterConfig.js  # Config types, defaults, PRESETS map
    BaseCharacter.js    # Shared drawing primitives (head, torso, legs, shoes…)
    HumanCharacter.js   # Human drawing for all 4 directions + frame generator
    DemonCharacter.js   # Extends human with horns, tail, claws, glowing eyes
  animations/
    AnimationData.js    # Frame offset tables for all 9 animations
    Animator.js         # Maps animation name → frame offsets + direction
  generators/
    CharacterGenerator.js  # Main API: config → spritesheet PNG
  index.js              # Demo: generates all preset characters
output/                 # Generated PNGs (git-ignored)
preview/
  index.html            # Browser viewer
  manifest.json         # Auto-generated metadata (git-ignored output)
```

## Adding Custom Characters

```js
const { generateSpritesheet } = require('./src/generators/CharacterGenerator');

generateSpritesheet({
  type:       'human',
  skin:       'tan',
  hair:       'auburn',
  hairStyle:  'long',
  clothing:   'hoodie_grey',
  pants:      'pants_black',
  shoes:      'shoe_brown',
}, './output/my_character_spritesheet.png');
```

For a demon, set `type: 'demon'` and add `demonSkin`, `hornStyle`, `tailStyle`.
