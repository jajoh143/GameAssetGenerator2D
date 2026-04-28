'use strict';

/**
 * Default character configuration.
 * All fields are optional - missing ones will use these defaults.
 */
const DEFAULT_CONFIG = {
  type:          'human',      // 'human' | 'demon' | 'fairy'
  skin:          'medium',     // skin tone key from Colors.SKIN_TONES
  hair:          'black',      // hair color key from Colors.HAIR_COLORS
  hairStyle:     'short',      // 'short' | 'medium' | 'long' | 'curly' | 'undercut' | 'spiky' | 'mohawk' | 'topknot' | 'buzzed' | 'bald'
  beardStyle:    'none',       // 'none' | 'stubble' | 'handlebar' | 'goatee' | 'full'
  eyes:          'brown',      // eye color key from Colors.EYE_COLORS

  // Clothing is now picked as STYLE + COLOR (independent dropdowns)
  clothingStyle: 'jacket',     // any key from Colors.CLOTHING_STYLES
  clothingColor: 'grey',       // any key from Colors.CLOTHING_COLORS
  pants:         'jeans_blue',
  shoes:         'shoe_black',

  // Belt is optional + colorable.
  belt:          true,         // false hides the belt entirely
  beltColor:     'standard',   // any key from Colors.BELT

  // Demon-only (tiefling-style — humanoid with horns and tail)
  demonSkin:     'crimson',
  hornStyle:     'curved',
  hornLength:    'medium',
  tailStyle:     'long',
  tailLength:    'medium',

  // Fairy-only
  fairySkin:     'peach',
  wingStyle:     'butterfly',
  wingColor:     'crystal',
  fairyDress:    'petal_pink',
  glowColor:     'golden',
};

// Known clothing style prefixes — longest first so "tshirt_vneck" wins over "tshirt".
const STYLE_PREFIXES = [
  'tshirt_vneck',
  'tshirt',
  'jacket',
  'hoodie',
  'apron',
  'shirt',
  'vest',
  'tunic',
  'robe',
  'bomber',
  'coat',
  'tank',
];

/**
 * Split a legacy "<style>_<color>" clothing key (e.g. `jacket_grey`,
 * `tshirt_vneck_grey`) into its style and color components.
 *
 * Returns `null` for the colour if the key has no underscore (defaults
 * are filled in by the caller).
 */
function splitLegacyClothing(key) {
  if (!key || typeof key !== 'string') return { style: null, color: null };
  // Special: vest_leather, apron_white — vest+leather isn't a real "leather" colour.
  // Map a couple of historical keys to their closest modern equivalents.
  const ALIAS = {
    vest_leather: { style: 'vest',  color: 'brown' },
    apron_white:  { style: 'apron', color: 'white' },
    coat_olive:   { style: 'coat',  color: 'olive' },
    coat_navy:    { style: 'coat',  color: 'navy'  },
    bomber_olive: { style: 'bomber', color: 'olive' },
    bomber_navy:  { style: 'bomber', color: 'navy'  },
    bomber_black: { style: 'bomber', color: 'black' },
    jeans_blue:   { style: null,    color: null    }, // not a top
  };
  if (ALIAS[key]) return ALIAS[key];

  for (const prefix of STYLE_PREFIXES) {
    if (key === prefix) return { style: prefix, color: null };
    if (key.startsWith(prefix + '_')) {
      return { style: prefix, color: key.slice(prefix.length + 1) };
    }
  }
  return { style: null, color: null };
}

/**
 * Merge provided config with defaults, normalising legacy `clothing` keys
 * into the new `clothingStyle` + `clothingColor` pair when needed.
 */
function resolveConfig(config) {
  const merged = Object.assign({}, DEFAULT_CONFIG, config || {});

  // Back-compat: if caller passed `clothing: 'jacket_grey'`, split it.
  // The explicit style/color fields always win.
  if (config && config.clothing && (!config.clothingStyle || !config.clothingColor)) {
    const { style, color } = splitLegacyClothing(config.clothing);
    if (style && !config.clothingStyle) merged.clothingStyle = style;
    if (color && !config.clothingColor) merged.clothingColor = color;
  }

  return merged;
}

/**
 * Preset character configurations.
 *
 * Each preset uses the new clothingStyle / clothingColor pair so the
 * UI can show the same character with any colour swapped in.
 */
const PRESETS = {
  human_casual: {
    type:          'human',
    skin:          'medium',
    hair:          'black',
    hairStyle:     'short',
    eyes:          'brown',
    clothingStyle: 'jacket',
    clothingColor: 'charcoal',
    pants:         'jeans_blue',
    shoes:         'shoe_black',
  },
  human_mechanic: {
    type:          'human',
    skin:          'light',
    hair:          'brown',
    hairStyle:     'medium',
    eyes:          'blue',
    clothingStyle: 'apron',
    clothingColor: 'white',
    pants:         'jeans_dark',
    shoes:         'shoe_brown',
  },
  human_hoodie: {
    type:          'human',
    skin:          'dark',
    hair:          'black',
    hairStyle:     'short',
    eyes:          'hazel',
    clothingStyle: 'hoodie',
    clothingColor: 'black',
    pants:         'pants_grey',
    shoes:         'shoe_white',
  },
  demon_warrior: {
    type:          'demon',
    demonSkin:     'crimson',
    hair:          'black',
    hairStyle:     'short',
    eyes:          'amber',
    hornStyle:     'curved',
    tailStyle:     'long',
    clothingStyle: 'jacket',
    clothingColor: 'charcoal',
    pants:         'jeans_dark',
    shoes:         'shoe_black',
  },
  demon_cook: {
    type:          'demon',
    demonSkin:     'dark_red',
    hair:          'dark_brown',
    hairStyle:     'medium',
    eyes:          'green',
    hornStyle:     'straight',
    tailStyle:     'medium',
    clothingStyle: 'apron',
    clothingColor: 'white',
    pants:         'pants_black',
    shoes:         'shoe_black',
  },
  human_streetwear: {
    type:          'human',
    skin:          'tan',
    hair:          'brown',
    hairStyle:     'short',
    eyes:          'hazel',
    clothingStyle: 'tshirt',
    clothingColor: 'grey',
    pants:         'jeans_blue',
    shoes:         'shoe_white',
  },
  human_vneck: {
    type:          'human',
    skin:          'medium',
    hair:          'dark_brown',
    hairStyle:     'short',
    eyes:          'brown',
    clothingStyle: 'tshirt_vneck',
    clothingColor: 'grey',
    pants:         'jeans_blue',
    shoes:         'shoe_black',
  },
  human_survivor: {
    type:          'human',
    skin:          'light',
    hair:          'blonde',
    hairStyle:     'short',
    eyes:          'blue',
    clothingStyle: 'tank',
    clothingColor: 'white',
    pants:         'pants_black',
    shoes:         'shoe_black',
  },
  human_bomber: {
    type:          'human',
    skin:          'light',
    hair:          'blonde',
    hairStyle:     'short',
    eyes:          'blue',
    clothingStyle: 'bomber',
    clothingColor: 'olive',
    pants:         'pants_black',
    shoes:         'shoe_black',
  },
  human_detective: {
    type:          'human',
    skin:          'light',
    hair:          'dark_brown',
    hairStyle:     'undercut',
    beardStyle:    'handlebar',
    eyes:          'brown',
    clothingStyle: 'coat',
    clothingColor: 'tan',
    pants:         'pants_black',
    shoes:         'shoe_brown',
  },
  human_noir: {
    type:          'human',
    skin:          'medium',
    hair:          'black',
    hairStyle:     'short',
    eyes:          'grey',
    clothingStyle: 'coat',
    clothingColor: 'charcoal',
    pants:         'jeans_dark',
    shoes:         'shoe_black',
  },
  human_ranger: {
    type:          'human',
    skin:          'tan',
    hair:          'brown',
    hairStyle:     'medium',
    eyes:          'hazel',
    clothingStyle: 'coat',
    clothingColor: 'brown',
    pants:         'jeans_dark',
    shoes:         'shoe_brown',
  },
  human_sailor: {
    type:          'human',
    skin:          'light',
    hair:          'black',
    hairStyle:     'short',
    beardStyle:    'full',
    eyes:          'blue',
    clothingStyle: 'coat',
    clothingColor: 'navy',
    pants:         'pants_black',
    shoes:         'shoe_black',
  },
  human_drifter: {
    type:          'human',
    skin:          'tan',
    hair:          'dark_brown',
    hairStyle:     'medium',
    beardStyle:    'full',
    eyes:          'hazel',
    clothingStyle: 'jacket',
    clothingColor: 'brown',
    pants:         'jeans_dark',
    shoes:         'shoe_brown',
  },
  human_punk: {
    type:          'human',
    skin:          'pale',
    hair:          'auburn',
    hairStyle:     'undercut',
    eyes:          'green',
    clothingStyle: 'tshirt',
    clothingColor: 'burgundy',
    pants:         'pants_black',
    shoes:         'shoe_black',
  },
  fairy_crystal: {
    type:          'fairy',
    fairySkin:     'peach',
    hair:          'blonde',
    eyes:          'blue',
    wingStyle:     'butterfly',
    wingColor:     'crystal',
    fairyDress:    'petal_pink',
    glowColor:     'golden',
  },
  fairy_forest: {
    type:          'fairy',
    fairySkin:     'mint',
    hair:          'dark_brown',
    eyes:          'green',
    wingStyle:     'dragonfly',
    wingColor:     'emerald',
    fairyDress:    'forest_green',
    glowColor:     'emerald',
  },
  pixie_twilight: {
    type:          'fairy',
    fairySkin:     'lavender',
    hair:          'white',
    eyes:          'violet',
    wingStyle:     'butterfly',
    wingColor:     'twilight',
    fairyDress:    'violet',
    glowColor:     'violet',
  },
};

module.exports = {
  DEFAULT_CONFIG,
  PRESETS,
  resolveConfig,
  splitLegacyClothing,
};
