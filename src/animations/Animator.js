'use strict';

const {
  IDLE_FRAMES,
  WALK_SOUTH_FRAMES,
  WALK_WEST_FRAMES,
  WALK_NORTH_FRAMES,
  WALK_EAST_FRAMES,
  ATTACK_SOUTH_FRAMES,
  ATTACK_WEST_FRAMES,
  ATTACK_NORTH_FRAMES,
  ATTACK_EAST_FRAMES,
} = require('./AnimationData');

/**
 * Map of animation name to frame offset data.
 */
const ANIMATION_MAP = {
  idle:         { frames: IDLE_FRAMES,         direction: 'south' },
  walk_south:   { frames: WALK_SOUTH_FRAMES,   direction: 'south' },
  walk_west:    { frames: WALK_WEST_FRAMES,    direction: 'west'  },
  walk_north:   { frames: WALK_NORTH_FRAMES,   direction: 'north' },
  walk_east:    { frames: WALK_EAST_FRAMES,    direction: 'east'  },
  attack_south: { frames: ATTACK_SOUTH_FRAMES, direction: 'south' },
  attack_west:  { frames: ATTACK_WEST_FRAMES,  direction: 'west'  },
  attack_north: { frames: ATTACK_NORTH_FRAMES, direction: 'north' },
  attack_east:  { frames: ATTACK_EAST_FRAMES,  direction: 'east'  },
};

/**
 * Get animation frame data for a given animation name.
 * Returns array of frame offset objects.
 */
function getFrames(animationName) {
  const anim = ANIMATION_MAP[animationName];
  if (!anim) {
    throw new Error(`Unknown animation: ${animationName}`);
  }
  return anim.frames;
}

/**
 * Get direction for a given animation.
 */
function getDirection(animationName) {
  const anim = ANIMATION_MAP[animationName];
  if (!anim) {
    throw new Error(`Unknown animation: ${animationName}`);
  }
  return anim.direction;
}

/**
 * List all animation names in spritesheet row order.
 */
const ANIMATION_ROWS = [
  'idle',
  'walk_south',
  'walk_west',
  'walk_north',
  'walk_east',
  'attack_south',
  'attack_west',
  'attack_north',
  'attack_east',
];

module.exports = {
  ANIMATION_MAP,
  ANIMATION_ROWS,
  getFrames,
  getDirection,
};
