'use strict';

/**
 * 4-tone color palettes for weapon materials.
 * Each palette: { highlight, base, shadow, outline }
 */

const BLADE_MATERIALS = {
  iron: {
    blade:  { highlight: '#b8b8c0', base: '#888890', shadow: '#505058', outline: '#282830' },
    guard:  { highlight: '#9090a0', base: '#606070', shadow: '#383840', outline: '#202028' },
    handle: { highlight: '#a06840', base: '#7a4e28', shadow: '#4e3018', outline: '#281808' },
    pommel: { highlight: '#808090', base: '#585868', shadow: '#303038', outline: '#181820' },
  },
  steel: {
    blade:  { highlight: '#e8eef8', base: '#b0bcd0', shadow: '#6878a0', outline: '#303850' },
    guard:  { highlight: '#c0d0e0', base: '#8898b0', shadow: '#485878', outline: '#283050' },
    handle: { highlight: '#c8c8d0', base: '#909098', shadow: '#505058', outline: '#282830' },
    pommel: { highlight: '#c0d0e0', base: '#8898b0', shadow: '#485878', outline: '#283050' },
  },
  gold: {
    blade:  { highlight: '#fff080', base: '#d4a800', shadow: '#906400', outline: '#4c3200' },
    guard:  { highlight: '#ffe060', base: '#c09000', shadow: '#785800', outline: '#402800' },
    handle: { highlight: '#a06840', base: '#7a4e28', shadow: '#4e3018', outline: '#281808' },
    pommel: { highlight: '#fff080', base: '#d4a800', shadow: '#906400', outline: '#4c3200' },
  },
  dark: {
    blade:  { highlight: '#585868', base: '#303038', shadow: '#181820', outline: '#080810' },
    guard:  { highlight: '#484858', base: '#282830', shadow: '#101018', outline: '#080808' },
    handle: { highlight: '#483828', base: '#301808', shadow: '#180800', outline: '#080400' },
    pommel: { highlight: '#484858', base: '#282830', shadow: '#101018', outline: '#080808' },
  },
};

const GUN_MATERIALS = {
  black: {
    body:   { highlight: '#585868', base: '#303038', shadow: '#181818', outline: '#080808' },
    barrel: { highlight: '#606068', base: '#383840', shadow: '#1c1c20', outline: '#080808' },
    grip:   { highlight: '#483828', base: '#301808', shadow: '#180800', outline: '#080400' },
    detail: { highlight: '#808090', base: '#585868', shadow: '#303038', outline: '#181820' },
  },
  chrome: {
    body:   { highlight: '#f0f4f8', base: '#a8b8c8', shadow: '#607080', outline: '#303848' },
    barrel: { highlight: '#e8f0f8', base: '#98a8b8', shadow: '#505f6f', outline: '#283040' },
    grip:   { highlight: '#808890', base: '#585c64', shadow: '#2c2e33', outline: '#141618' },
    detail: { highlight: '#d0e0f0', base: '#8898a8', shadow: '#485868', outline: '#283040' },
  },
  wood: {
    body:   { highlight: '#585868', base: '#303038', shadow: '#181818', outline: '#080808' },
    barrel: { highlight: '#606068', base: '#383840', shadow: '#1c1c20', outline: '#080808' },
    grip:   { highlight: '#c08060', base: '#8b5e3c', shadow: '#4a2e1a', outline: '#20100a' },
    detail: { highlight: '#808090', base: '#585868', shadow: '#303038', outline: '#181820' },
  },
};

module.exports = { BLADE_MATERIALS, GUN_MATERIALS };
