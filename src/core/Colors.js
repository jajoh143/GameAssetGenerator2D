'use strict';

// Skin tone palettes: highlight, base, shadow, outline
const SKIN_TONES = {
  pale: {
    highlight: '#FFE8D6',
    base:      '#FCCFAF',
    shadow:    '#D9A88A',
    outline:   '#4A2E1A',
  },
  light: {
    highlight: '#FFCFA0',
    base:      '#F0A870',
    shadow:    '#C07840',
    outline:   '#3E1E08',
  },
  medium: {
    highlight: '#D4935A',
    base:      '#B87040',
    shadow:    '#8C4820',
    outline:   '#3A1800',
  },
  tan: {
    highlight: '#C4834A',
    base:      '#A06030',
    shadow:    '#783818',
    outline:   '#2E1000',
  },
  dark: {
    highlight: '#8C5030',
    base:      '#6A3418',
    shadow:    '#4A1E08',
    outline:   '#1A0800',
  },
  very_dark: {
    highlight: '#5A2E10',
    base:      '#401C08',
    shadow:    '#280E02',
    outline:   '#0E0400',
  },
};

// Hair color palettes
const HAIR_COLORS = {
  black: {
    highlight: '#484848',
    base:      '#1C1C1C',
    shadow:    '#080808',
  },
  dark_brown: {
    highlight: '#6B3D1E',
    base:      '#3E2010',
    shadow:    '#1E0E06',
  },
  brown: {
    highlight: '#9A6030',
    base:      '#6A3C18',
    shadow:    '#3A1C08',
  },
  auburn: {
    highlight: '#B04818',
    base:      '#7A2808',
    shadow:    '#481002',
  },
  blonde: {
    highlight: '#F8E070',
    base:      '#D4B030',
    shadow:    '#A07818',
  },
  red: {
    highlight: '#E04820',
    base:      '#A82808',
    shadow:    '#680C00',
  },
  grey: {
    highlight: '#B0B0B0',
    base:      '#787878',
    shadow:    '#484848',
  },
  white: {
    highlight: '#FFFFFF',
    base:      '#D8D8D8',
    shadow:    '#A8A8A8',
  },
};

// Clothing color presets
const CLOTHING = {
  // SDV/SNES art guide: shadows shift cooler (toward blue/teal),
  // highlights shift warmer (toward yellow/orange).
  jacket_grey: {
    highlight: '#D0C8B8',  // warm ivory-tan — noticeably brighter than base
    base:      '#787878',
    shadow:    '#303448',  // cooler blue-grey, darker for more contrast
    outline:   '#141420',
    collar:    '#909098',  // lighter collar for front opening visibility
  },
  jacket_blue: {
    highlight: '#7098D4',  // warmer, more cyan-sky blue
    base:      '#3858A0',
    shadow:    '#101848',  // cooler, deeper blue-violet
    outline:   '#080E30',
    collar:    '#2040A0',
  },
  jacket_brown: {
    highlight: '#B08840',  // warmer, golden-orange highlight
    base:      '#705028',
    shadow:    '#302818',  // cooler shadow (slight blue-brown)
    outline:   '#180A00',
    collar:    '#583818',
  },
  hoodie_black: {
    highlight: '#463C30',  // warm: slight amber/brown tint
    base:      '#202020',
    shadow:    '#060810',  // cool: very slight blue in deep shadow
    outline:   '#000008',
    collar:    '#2E2820',
  },
  hoodie_grey: {
    highlight: '#C8C0A8',  // warm: slight warm ivory tint
    base:      '#888888',
    shadow:    '#484858',  // cool: slight blue-grey
    outline:   '#242430',
    collar:    '#686870',
  },
  apron_white: {
    highlight: '#FFFFFF',
    base:      '#E8E8E8',
    shadow:    '#C0C0C0',
    outline:   '#808080',
    collar:    '#D0D0D0',
    // base under clothing
    base_highlight: '#A8A8B8',
    base_base:      '#7878A0',
    base_shadow:    '#484870',
  },
  shirt_white: {
    highlight: '#FFFFFF',
    base:      '#E8E8F0',
    shadow:    '#9898B8',
    outline:   '#303050',
    collar:    '#D0D0E8',
  },
  shirt_red: {
    highlight: '#F07868',
    base:      '#C82020',
    shadow:    '#700808',
    outline:   '#280200',
    collar:    '#A81818',
  },
  shirt_blue: {
    highlight: '#70A8E8',
    base:      '#2868C0',
    shadow:    '#0C3070',
    outline:   '#040E28',
    collar:    '#1C58A8',
  },
  vest_leather: {
    highlight: '#C09858',
    base:      '#805830',
    shadow:    '#402010',
    outline:   '#180800',
    collar:    '#987040',
    // shirt visible at sides/collar
    shirt:     '#D0C8A0',
    shirt_shadow: '#A09868',
  },
  tunic_green: {
    highlight: '#80C060',
    base:      '#4A8030',
    shadow:    '#224810',
    outline:   '#0A1C02',
    collar:    '#5A9840',
  },
  robe_purple: {
    highlight: '#A070D0',
    base:      '#60309A',
    shadow:    '#2C0E50',
    outline:   '#0E0020',
    collar:    '#4A2078',
  },
};

const PANTS = {
  jeans_blue: {
    highlight: '#5878B8',
    base:      '#2848A0',
    shadow:    '#0C2870',
    outline:   '#040E38',
  },
  jeans_dark: {
    highlight: '#303060',
    base:      '#181840',
    shadow:    '#080820',
    outline:   '#020210',
  },
  pants_grey: {
    highlight: '#A0A0A0',
    base:      '#686868',
    shadow:    '#383838',
    outline:   '#181818',
  },
  pants_black: {
    highlight: '#383838',
    base:      '#181818',
    shadow:    '#060606',
    outline:   '#000000',
  },
  pants_brown: {
    highlight: '#9A7248',
    base:      '#6A4020',
    shadow:    '#361C08',
    outline:   '#140800',
  },
  pants_green: {
    highlight: '#609848',
    base:      '#386828',
    shadow:    '#1A3410',
    outline:   '#081202',
  },
  pants_red: {
    highlight: '#C85050',
    base:      '#881818',
    shadow:    '#440808',
    outline:   '#1A0000',
  },
};

const SHOES = {
  shoe_black: {
    highlight: '#484848',
    base:      '#181818',
    shadow:    '#060606',
    outline:   '#000000',
  },
  shoe_brown: {
    highlight: '#9A6838',
    base:      '#6A3C18',
    shadow:    '#3A1C08',
    outline:   '#180800',
  },
  shoe_white: {
    highlight: '#FFFFFF',
    base:      '#D8D8D8',
    shadow:    '#A0A0A0',
    outline:   '#606060',
  },
  shoe_red: {
    highlight: '#C84040',
    base:      '#881010',
    shadow:    '#440808',
    outline:   '#1A0000',
  },
  shoe_grey: {
    highlight: '#A0A0A0',
    base:      '#686868',
    shadow:    '#383838',
    outline:   '#141414',
  },
  shoe_tan: {
    highlight: '#C8A070',
    base:      '#906040',
    shadow:    '#503018',
    outline:   '#200C00',
  },
};

// Demon-specific skin tones
const DEMON_SKIN = {
  crimson: {
    highlight: '#E84040',
    base:      '#A01818',
    shadow:    '#600808',
    outline:   '#280000',
  },
  dark_red: {
    highlight: '#A02828',
    base:      '#681010',
    shadow:    '#380404',
    outline:   '#180000',
  },
  purple: {
    highlight: '#9848B8',
    base:      '#602880',
    shadow:    '#300848',
    outline:   '#100018',
  },
};

const DEMON_PARTS = {
  horn: {
    highlight: '#D0C080',
    base:      '#A09040',
    shadow:    '#706010',
    outline:   '#302800',
  },
  tail: {
    highlight: '#B83030',
    base:      '#801818',
    shadow:    '#480808',
    outline:   '#200000',
  },
  claw: {
    highlight: '#D0C8A8',
    base:      '#988870',
    shadow:    '#604838',
    outline:   '#281808',
  },
};

// Belt color
const BELT = {
  standard: {
    base:    '#3A2010',
    buckle:  '#C8A820',
    outline: '#1A0800',
  },
};

// Eye color palettes: iris, pupil, lash (lash used for lid/lash outline)
const EYE_COLORS = {
  brown: {
    iris:  '#7B4820',
    pupil: '#160800',
    lash:  '#2A1800',
  },
  blue: {
    iris:  '#2060B8',
    pupil: '#0A1E40',
    lash:  '#111822',
  },
  green: {
    iris:  '#2A8040',
    pupil: '#0A2010',
    lash:  '#0E1A12',
  },
  hazel: {
    iris:  '#7A5A20',
    pupil: '#201808',
    lash:  '#221400',
  },
  grey: {
    iris:  '#6080A0',
    pupil: '#1C2C38',
    lash:  '#1A2028',
  },
  amber: {
    iris:  '#C08018',
    pupil: '#402800',
    lash:  '#281400',
  },
  violet: {
    iris:  '#7040A0',
    pupil: '#1E1030',
    lash:  '#1A0C28',
  },
};

// Shadow ellipse under character
const GROUND_SHADOW = 'rgba(0,0,0,0.25)';

module.exports = {
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING,
  PANTS,
  SHOES,
  DEMON_SKIN,
  DEMON_PARTS,
  BELT,
  GROUND_SHADOW,
};
