const CONFIG = {
  MAX_DAYS: 30,
  ACTIONS_PER_DAY: 3,
  DIFFICULTY: "normal",
  START_RESOURCES: {
    normal: { gold: 500, food: 10, wood: 20, stone: 15, iron: 5, soldiers: 5, health: 100 },
  },
  SHELTER: {
    1: { name: "کمپ", defense: 0, healRate: 1 },
    2: { name: "کلبه", defense: 10, healRate: 2 },
    3: { name: "قلعه", defense: 30, healRate: 3 },
    4: { name: "کاخ", defense: 60, healRate: 5 },
    5: { name: "پایگاه", defense: 100, healRate: 10 },
  },
};
module.exports = CONFIG;