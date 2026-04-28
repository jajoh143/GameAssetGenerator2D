'use strict';

/**
 * 4-tone color palettes for armor materials.
 * Each palette key has { highlight, base, shadow, outline }.
 *
 * Palettes intentionally mirror WeaponColors.js — same materials, same
 * naming — so a "steel" helmet visually matches a "steel" sword.
 */

const ARMOR_MATERIALS = {
  leather: {
    primary: { highlight: '#a06840', base: '#7a4e28', shadow: '#4e3018', outline: '#281808' },
    accent:  { highlight: '#806848', base: '#604830', shadow: '#3c2a18', outline: '#1c1208' },
    metal:   { highlight: '#c0a878', base: '#907858', shadow: '#5a4838', outline: '#2c2418' },
  },
  iron: {
    primary: { highlight: '#b8b8c0', base: '#888890', shadow: '#505058', outline: '#282830' },
    accent:  { highlight: '#a0a0a8', base: '#707078', shadow: '#404048', outline: '#181820' },
    metal:   { highlight: '#c8c8d0', base: '#909098', shadow: '#505058', outline: '#282830' },
  },
  steel: {
    primary: { highlight: '#e8eef8', base: '#b0bcd0', shadow: '#6878a0', outline: '#303850' },
    accent:  { highlight: '#c0d0e0', base: '#8898b0', shadow: '#485878', outline: '#283050' },
    metal:   { highlight: '#e8eef8', base: '#b0bcd0', shadow: '#6878a0', outline: '#303850' },
  },
  gold: {
    primary: { highlight: '#fff080', base: '#d4a800', shadow: '#906400', outline: '#4c3200' },
    accent:  { highlight: '#ffe060', base: '#c09000', shadow: '#785800', outline: '#402800' },
    metal:   { highlight: '#fff8a0', base: '#e0b820', shadow: '#a07800', outline: '#503800' },
  },
  dark: {
    primary: { highlight: '#585868', base: '#303038', shadow: '#181820', outline: '#080810' },
    accent:  { highlight: '#484858', base: '#282830', shadow: '#101018', outline: '#080808' },
    metal:   { highlight: '#606870', base: '#383840', shadow: '#1c1c20', outline: '#080810' },
  },
  cloth: {
    primary: { highlight: '#a04848', base: '#783030', shadow: '#481818', outline: '#240808' },
    accent:  { highlight: '#c0a060', base: '#907040', shadow: '#583c20', outline: '#281808' },
    metal:   { highlight: '#c0a878', base: '#907858', shadow: '#5a4838', outline: '#2c2418' },
  },
};

module.exports = { ARMOR_MATERIALS };
