'use strict';

/**
 * Default character configuration.
 * All fields are optional - missing ones will use these defaults.
 */
const DEFAULT_CONFIG = {
  type:       'human',      // 'human' | 'demon'
  skin:       'medium',     // skin tone key from Colors.SKIN_TONES
  hair:       'black',      // hair color key from Colors.HAIR_COLORS
  hairStyle:  'short',      // 'short' | 'medium' | 'long'
  eyes:       'brown',      // eye color key from Colors.EYE_COLORS
  clothing:   'jacket_grey',
  pants:      'jeans_blue',
  shoes:      'shoe_black',

  // Demon-only
  demonSkin:  'crimson',    // key from Colors.DEMON_SKIN (overrides skin for demon)
  hornStyle:  'curved',     // 'curved' | 'straight' | 'ram'
  tailStyle:  'long',       // 'long' | 'medium' | 'short'
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
};

module.exports = {
  DEFAULT_CONFIG,
  PRESETS,
  resolveConfig,
};
