
export const CONFIG = {

  TYPES: {
    GRASS: 0,
    BUG: 1,
    FROG: 2,
    SNAKE: 3,
    EAGLE: 4
  },

  VISUALS: {
    EMOJIS: ['🌱', '🐛', '🐸', '🐍', '🦅'],
    CLASS_NAMES: ['grass', 'bug', 'frog', 'snake', 'eagle'],
    NAMES: ['풀', '벌레', '개구리', '뱀', '독수리']
  },

  FOOD_CHAIN: {
    [0]: null,
    [1]: [0],
    [2]: [1],
    [3]: [2],
    [4]: [3]
  },

  RPS_CHAIN: {
    [4]: [3],
    [3]: [2],
    [2]: [4]
  },

  ENTITY: {
    SIZE: 40,
    SPEED: 1,
    MAX_ENERGY: 100,
    INITIAL_ENERGY: 50,
    ENERGY_DECAY: 0.05,
    SIGHT_RANGE: 150,
    INVINCIBILITY_TIME: 500,
  },

  TYPE_PROPERTIES: {
    [0]: {
      speed: 0,
      size: 30,
      energyDecay: 0,
      autoGrowRate: 0.015,
      maxEnergy: 50
    },
    [1]: {
      speed: 0.9,
      size: 25,
      energyDecay: 0.012,
      maxEnergy: 70,
      sightRange: 100
    },
    [2]: {
      speed: 1.0,
      size: 35,
      energyDecay: 0.018,
      maxEnergy: 90,
      sightRange: 130
    },
    [3]: {
      speed: 1.1,
      size: 45,
      energyDecay: 0.022,
      maxEnergy: 110,
      sightRange: 160
    },
    [4]: {
      speed: 1.2,
      size: 50,
      energyDecay: 0.028,
      maxEnergy: 130,
      sightRange: 180
    }
  },

  SIMULATION: {
    INITIAL_COUNT_PER_TYPE: 4,
    ADD_COOLDOWN: 100,
    GRASS_GROWTH_RATE: 0.15,
    GRASS_GROWTH_INTERVAL: 5000,
    MAX_GRASS: 40,
    ENERGY_GAIN: 30,
    REPRODUCTION_THRESHOLD: 0.80,
    MAX_ENTITIES_PER_TYPE: 25,
    MAX_TOTAL_ENTITIES: 150
  },

  RPS_MODE: {
    UNIFIED_SPEED: 1.0
  },

  EFFECTS: {
    REMOVE_DELAY: 100,
    REPRODUCTION_EFFECT_TIME: 300,
    EAT_EFFECT_TIME: 200,
    EAT_COOLDOWN: 1000,
    REPRODUCTION_COOLDOWN: 5000
  },

  AUTO_BALANCE: {
    ENABLED: true,
    MIN_COUNTS: [8, 4, 3, 2, 1],
    CHECK_INTERVAL: 45,
    MAX_GRASS_FOR_BALANCE: 30
  }
}
