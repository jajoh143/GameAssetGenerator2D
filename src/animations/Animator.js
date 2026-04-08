'use strict';

const {
  IDLE_FRAMES,
  WALK_SOUTH_FRAMES,
  WALK_WEST_FRAMES,
  WALK_NORTH_FRAMES,
  WALK_EAST_FRAMES,
  ATTACK_SWING_SOUTH_FRAMES,
  ATTACK_SWING_WEST_FRAMES,
  ATTACK_SWING_NORTH_FRAMES,
  ATTACK_SWING_EAST_FRAMES,
  ATTACK_SHOOT_SOUTH_FRAMES,
  ATTACK_SHOOT_WEST_FRAMES,
  ATTACK_SHOOT_NORTH_FRAMES,
  ATTACK_SHOOT_EAST_FRAMES,
} = require('./AnimationData');

/**
 * Map of animation name to frame offset data.
 */
const ANIMATION_MAP = {
  idle:                { frames: IDLE_FRAMES,               direction: 'south' },
  walk_south:          { frames: WALK_SOUTH_FRAMES,         direction: 'south' },
  walk_west:           { frames: WALK_WEST_FRAMES,          direction: 'west'  },
  walk_north:          { frames: WALK_NORTH_FRAMES,         direction: 'north' },
  walk_east:           { frames: WALK_EAST_FRAMES,          direction: 'east'  },
  attack_swing_south:  { frames: ATTACK_SWING_SOUTH_FRAMES, direction: 'south' },
  attack_swing_west:   { frames: ATTACK_SWING_WEST_FRAMES,  direction: 'west'  },
  attack_swing_north:  { frames: ATTACK_SWING_NORTH_FRAMES, direction: 'north' },
  attack_swing_east:   { frames: ATTACK_SWING_EAST_FRAMES,  direction: 'east'  },
  attack_shoot_south:  { frames: ATTACK_SHOOT_SOUTH_FRAMES, direction: 'south' },
  attack_shoot_west:   { frames: ATTACK_SHOOT_WEST_FRAMES,  direction: 'west'  },
  attack_shoot_north:  { frames: ATTACK_SHOOT_NORTH_FRAMES, direction: 'north' },
  attack_shoot_east:   { frames: ATTACK_SHOOT_EAST_FRAMES,  direction: 'east'  },
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
  'attack_swing_south',
  'attack_swing_west',
  'attack_swing_north',
  'attack_swing_east',
  'attack_shoot_south',
  'attack_shoot_west',
  'attack_shoot_north',
  'attack_shoot_east',
];

module.exports = {
  ANIMATION_MAP,
  ANIMATION_ROWS,
  getFrames,
  getDirection,
};
