const CONFIG = {
  MAX_DAYS: 30,
  ACTIONS_PER_DAY: 3,
  DIFFICULTY: "normal",

  START_RESOURCES: {
    easy:   { gold: 1000, food: 20, wood: 40, stone: 30, iron: 15, soldiers: 10, health: 120 },
    normal: { gold: 500,  food: 10, wood: 20, stone: 15, iron: 5,  soldiers: 5,  health: 100 },
    hard:   { gold: 200,  food: 5,  wood: 10, stone: 5,  iron: 0,  soldiers: 2,  health: 80 },
    legend: { gold: 50,   food: 2,  wood: 5,  stone: 2,  iron: 0,  soldiers: 0,  health: 60 },
  },

  SHELTER: {
    1: { name: "🏕️ کمپ ساده",   emoji: "🏕️", wood: 0,   stone: 0,   iron: 0,  gold: 0,   defense: 0,   capacity: 5,  healRate: 1 },
    2: { name: "🏠 کلبه چوبی",  emoji: "🏠", wood: 30,  stone: 10,  iron: 0,  gold: 0,   defense: 10,  capacity: 10, healRate: 2 },
    3: { name: "🏰 قلعه سنگی",  emoji: "🏰", wood: 60,  stone: 40,  iron: 15, gold: 0,   defense: 30,  capacity: 20, healRate: 3 },
    4: { name: "🏯 کاخ باشکوه", emoji: "🏯", wood: 100, stone: 80,  iron: 40, gold: 200, defense: 60,  capacity: 40, healRate: 5 },
    5: { name: "🏗️ پایگاه مدرن", emoji: "🏗️", wood: 200, stone: 150, iron: 100, gold: 500, defense: 100, capacity: 100, healRate: 10 },
  },

  LOCATIONS: {
    forest:   { name: "🌲 جنگل",     resources: { wood: [5, 15], food: [1, 3],  stone: [0, 2],  iron: [0, 0] }, danger: 10 },
    mountain: { name: "🏔️ کوهستان", resources: { wood: [0, 3],  food: [0, 2],  stone: [5, 15], iron: [1, 5] }, danger: 20 },
    mine:     { name: "⛏️ معدنگاه", resources: { wood: [0, 2],  food: [0, 1],  stone: [2, 8],  iron: [5, 15] }, danger: 30 },
    desert:   { name: "🏜️ کویر",    resources: { wood: [0, 1],  food: [0, 1],  stone: [1, 5],  iron: [0, 3] }, danger: 15 },
    bazaar:   { name: "🏪 بازار",    resources: { gold: [10, 50] }, danger: 0 },
  },
};

module.exports = CONFIG;