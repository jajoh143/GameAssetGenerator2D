'use strict';

/**
 * Default character configuration.
 * All fields are optional - missing ones will use these defaults.
 */
const DEFAULT_CONFIG = {
  type:       'human',      // 'human' | 'demon' | 'fairy'
  skin:       'medium',     // skin tone key from Colors.SKIN_TONES
  hair:       'black',      // hair color key from Colors.HAIR_COLORS
  hairStyle:  'short',      // 'short' | 'medium' | 'long' | 'curly' | 'undercut'
  beardStyle: 'none',       // 'none' | 'stubble' | 'mustache' | 'goatee' | 'full'
  eyes:       'brown',      // eye color key from Colors.EYE_COLORS
  clothing:   'jacket_grey',
  pants:      'jeans_blue',
  shoes:      'shoe_black',

  // Demon-only
  demonSkin:  'crimson',    // key from Colors.DEMON_SKIN (overrides skin for demon)
  hornStyle:  'curved',     // 'curved' | 'straight' | 'ram'
  tailStyle:  'long',       // 'long' | 'medium' | 'short'

  // Fairy-only
  fairySkin:  'peach',      // key from Colors.FAIRY_SKIN
  wingStyle:  'butterfly',  // 'butterfly' | 'dragonfly'
  wingColor:  'crystal',    // key from Colors.FAIRY_WING
  fairyDress: 'petal_pink', // key from Colors.FAIRY_DRESS
  glowColor:  'golden',     // key from Colors.FAIRY_GLOW
};

/**
 * Merge provided config with defaults.
 */
function resolveConfig(config) {
  return Object.assign({}, DEFAULT_CONFIG, config);
}

/**
 * Preset character configurations.
 */
const PRESETS = {
  human_casual: {
    type:       'human',
    skin:       'medium',
    hair:       'black',
    hairStyle:  'short',
    eyes:       'brown',
    clothing:   'jacket_grey',
    pants:      'jeans_blue',
    shoes:      'shoe_black',
  },
  human_mechanic: {
    type:       'human',
    skin:       'light',
    hair:       'brown',
    hairStyle:  'medium',
    eyes:       'blue',
    clothing:   'apron_white',
    pants:      'jeans_dark',
    shoes:      'shoe_brown',
  },
  human_hoodie: {
    type:       'human',
    skin:       'dark',
    hair:       'black',
    hairStyle:  'short',
    eyes:       'hazel',
    clothing:   'hoodie_black',
    pants:      'pants_grey',
    shoes:      'shoe_white',
  },
  demon_warrior: {
    type:       'demon',
    demonSkin:  'crimson',
    hair:       'black',
    hairStyle:  'short',
    eyes:       'amber',
    hornStyle:  'curved',
    tailStyle:  'long',
    clothing:   'jacket_grey',
    pants:      'jeans_dark',
    shoes:      'shoe_black',
  },
  demon_cook: {
    type:       'demon',
    demonSkin:  'dark_red',
    hair:       'dark_brown',
    hairStyle:  'medium',
    eyes:       'green',
    hornStyle:  'straight',
    tailStyle:  'medium',
    clothing:   'apron_white',
    pants:      'pants_black',
    shoes:      'shoe_black',
  },
  human_streetwear: {
    type:       'human',
    skin:       'tan',
    hair:       'brown',
    hairStyle:  'short',
    eyes:       'hazel',
    clothing:   'tshirt_grey',
    pants:      'jeans_blue',
    shoes:      'shoe_white',
  },
  human_bomber: {
    type:       'human',
    skin:       'light',
    hair:       'blonde',
    hairStyle:  'short',
    eyes:       'blue',
    clothing:   'bomber_olive',
    pants:      'pants_black',
    shoes:      'shoe_black',
  },
  human_detective: {
    type:       'human',
    skin:       'light',
    hair:       'dark_brown',
    hairStyle:  'undercut',
    beardStyle: 'goatee',
    eyes:       'brown',
    clothing:   'coat_tan',
    pants:      'pants_black',
    shoes:      'shoe_brown',
  },
  human_noir: {
    type:       'human',
    skin:       'medium',
    hair:       'black',
    hairStyle:  'short',
    eyes:       'grey',
    clothing:   'coat_grey',
    pants:      'jeans_dark',
    shoes:      'shoe_black',
  },
  human_ranger: {
    type:       'human',
    skin:       'tan',
    hair:       'brown',
    hairStyle:  'medium',
    eyes:       'hazel',
    clothing:   'coat_brown',
    pants:      'jeans_dark',
    shoes:      'shoe_brown',
  },
  human_sailor: {
    type:       'human',
    skin:       'light',
    hair:       'black',
    hairStyle:  'short',
    beardStyle: 'full',
    eyes:       'blue',
    clothing:   'coat_navy',
    pants:      'pants_black',
    shoes:      'shoe_black',
  },
  fairy_crystal: {
    type:       'fairy',
    fairySkin:  'peach',
    hair:       'blonde',
    eyes:       'blue',
    wingStyle:  'butterfly',
    wingColor:  'crystal',
    fairyDress: 'petal_pink',
    glowColor:  'golden',
  },
  fairy_forest: {
    type:       'fairy',
    fairySkin:  'mint',
    hair:       'dark_brown',
    eyes:       'green',
    wingStyle:  'dragonfly',
    wingColor:  'emerald',
    fairyDress: 'forest_green',
    glowColor:  'emerald',
  },
  pixie_twilight: {
    type:       'fairy',
    fairySkin:  'lavender',
    hair:       'white',
    eyes:       'violet',
    wingStyle:  'butterfly',
    wingColor:  'twilight',
    fairyDress: 'violet',
    glowColor:  'violet',
  },
};

module.exports = {
  DEFAULT_CONFIG,
  PRESETS,
  resolveConfig,
};
