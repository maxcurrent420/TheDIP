// Game constants
export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;
export const MAX_HEALTH = 100;
export const MAX_AMMO = 100;
export const AMMO_REGEN_RATE = 5;
export const HEALTH_REGEN_RATE = 0.08;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_RADIUS = 0.5;
export const MOVEMENT_SPEED = 0.2;
export const SPRINT_MULTIPLIER = 1.8;
export const JUMP_FORCE = 0.15;
export const GRAVITY = 0.01;
export const ATTACK_COOLDOWN = 100;
export const DIMENSION_SHIFT_COOLDOWN = 10000;
export const POWERSTONE_COOLDOWN = 1000;
export const MESSAGE_DURATION = 3000;
export const LEVEL_INDICATOR_DURATION = 2000;
export const INITIAL_DIP_TOKENS = 500;
export const POWER_FUSION_COST = 250;

// Player settings
export const PLAYER_SPEED = 8.0;
export const ABSORB_RANGE = 5;
export const TELEPORT_DISTANCE = 10;

// Enemy settings
export const ENEMY_SPAWN_DISTANCE = 20;
export const ENEMY_AGGRO_RANGE = 25;
export const ENEMY_ATTACK_RANGE = 2;
export const ENEMY_ATTACK_COOLDOWN = 1000;
export const ENEMY_DAMAGE_AMOUNT = 10;
export const ENEMY_UPDATE_RADIUS = 40;
export const HEALTH_PICKUP_VALUE = 25;
export const RESPAWN_DELAY = 5000;

// Level settings
export const LEVEL_SIZE = 40;
export const WALL_HEIGHT = 5;
export const PILLAR_PROBABILITY = 0.05;
export const DIMENSIONS = ['prime', 'void', 'nexus', 'quantum'];

// UI settings
export const HUD_UPDATE_INTERVAL = 100;

// Power settings
export const POWER_COST = {
  bullet: 5,
  fireball: 15,
  ice: 10,
  sonic: 8,
  shield: 20,
  teleport: 25
};

// DIP Token settings
export const DIP_TOKEN_REWARD_PER_LEVEL = 50;
export const DIP_TOKEN_REWARD_PER_ENEMY = 5;
export const POWER_NFT_CONVERSION_COST = 100;
export const KIOSK_INTERACTION_DISTANCE = 3;

// Game state
export const INITIAL_GAME_STATE = {
  started: false,
  paused: true,
  health: MAX_HEALTH,
  ammo: MAX_AMMO,
  level: 1,
  dimension: 'prime',
  powers: [null, null, null],
  activePowerIndex: 0,
  powerStone: null,
  equippedPowerStone: null,
  currentPower: 0,
  enemies: [],
  projectiles: [],
  levelObjects: [],
  enemiesDefeated: 0,
  totalEnemiesDefeated: 0,
  levelEnemyCount: 10,
  lastAttackTime: 0,
  lastDimensionShift: 0,
  lastPowerStoneUse: 0,
  wardenMessageTimeout: null,
  killNames: ['Guardians', 'Anomalies', 'Devourers', 'Entities', 'Fragments'],
  currentKillName: 'Anomalies',
  dipTokens: INITIAL_DIP_TOKENS,
  absorbedPowers: [],
  powerStoneInventory: []
};
