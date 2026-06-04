// دشمنان و باس‌ها - بقای فرمانروا
const { photos, gifs } = require("../assets");

const enemies = {
  // ========== دشمنان معمولی (هر روز) ==========
  wolf: {
    id: "wolf",
    name: "🐺 گرگ وحششی",
    desc: "گرگ گرسنه کوهستان",
    power: 5,
    reward: { gold: [10, 30], food: [1, 3], exp: 5 },
    lootTable: [
      { item: "food", chance: 60, amount: [1, 2] },
      { item: "gold", chance: 40, amount: [10, 20] },
    ],
  },
  bandit: {
    id: "bandit",
    name: "🗡️ راهزن صحرا",
    desc: "دزدان مسلح کاروان‌ها",
    power: 12,
    reward: { gold: [20, 60], iron: [1, 3], exp: 10 },
    lootTable: [
      { item: "gold", chance: 70, amount: [20, 50] },
      { item: "iron", chance: 30, amount: [1, 3] },
      { item: "wooden_shield", chance: 5, amount: 1 },
    ],
  },
  dark_soldier: {
    id: "dark_soldier",
    name: "⚔️ سرباز تاریکی",
    desc: "سپاه مرموز شب‌گرد",
    power: 20,
    reward: { gold: [50, 100], exp: 20 },
    lootTable: [
      { item: "gold", chance: 80, amount: [50, 100] },
      { item: "iron", chance: 40, amount: [2, 5] },
      { item: "dagger", chance: 8, amount: 1 },
    ],
  },
  assassin: {
    id: "assassin",
    name: "🥷 قاتل سایه",
    desc: "آدمکش حرفه‌ای شب",
    power: 30,
    reward: { gold: [80, 150], exp: 35 },
    lootTable: [
      { item: "gold", chance: 90, amount: [80, 150] },
      { item: "dagger2", chance: 3, amount: 1 },
      { item: "leather_armor", chance: 5, amount: 1 },
    ],
  },
  war_machine: {
    id: "war_machine",
    name: "🤖 ماشین جنگی",
    desc: "دستگاه مرگبار دشمن",
    power: 45,
    reward: { gold: [150, 300], iron: [5, 10], exp: 50 },
    lootTable: [
      { item: "gold", chance: 100, amount: [150, 300] },
      { item: "iron", chance: 60, amount: [5, 10] },
      { item: "axe", chance: 10, amount: 1 },
      { item: "iron_armor", chance: 5, amount: 1 },
    ],
  },

  // ========== باس‌ها (هر ۶ روز) ==========
  bosses: [
    {
      day: 6,
      id: "devil",
      name: "👹 شیطان",
      desc: "موجود اهریمنی اعماق زمین",
      photo: photos.devil,
      gif: gifs.gladiator_fight,
      power: 40,
      health: 3,
      reward: { gold: 200, exp: 100 },
      dropItem: { item: "sword", name: "شمشیر" },
      specialAttack: "نفرین تاریکی - کاهش ۱۰ قدرت",
      unlockMissile: null,
    },
    {
      day: 12,
      id: "snake_king",
      name: "🐍 مارشاه",
      desc: "شاه مارهای سمی باستانی",
      photo: photos.snake_king,
      gif: gifs.gladiator_fight,
      power: 70,
      health: 4,
      reward: { gold: 400, exp: 200 },
      dropItem: { item: "iron_armor", name: "زره آهنی" },
      specialAttack: "زهر مرگبار - ۲۰٪ آسیب اضافه",
      unlockMissile: null,
    },
    {
      day: 18,
      id: "um_al_jinni",
      name: "🧞 ام‌الجنی",
      desc: "مادر اجنه، باستانی و قدرتمند",
      photo: photos.um_al_jinni,
      gif: gifs.gladiator_win,
      power: 100,
      health: 5,
      reward: { gold: 600, exp: 350 },
      dropItem: { item: "axe_upgraded", name: "تبر جنگی" },
      specialAttack: "طلسم جن - فلج ۱ نوبت",
      unlockMissile: "fattah",
    },
    {
      day: 24,
      id: "mountain_dragon",
      name: "🐉 اژدهای کوهستان",
      desc: "اژدهای آتشین قله دماوند",
      photo: photos.mountain_dragon,
      gif: gifs.nuclear_gif,
      power: 150,
      health: 6,
      reward: { gold: 1000, exp: 500 },
      dropItem: { item: "dragon_armor", name: "زره اژدها" },
      specialAttack: "آتش کوهستان - نابودی ۳۰٪ منابع",
      unlockMissile: "khorramshahr",
    },
    {
      day: 30,
      id: "phoenix",
      name: "🔥 ققنوس",
      desc: "پرنده آتشین جاودان",
      photo: photos.phoenix,
      gif: gifs.nuclear_gif,
      power: 200,
      health: 8,
      reward: { gold: 2000, exp: 1000 },
      dropItem: { item: "missile_emad", name: "موشک عماد" },
      specialAttack: "تولد دوباره - ۱ جان اضافه",
      unlockMissile: "emad",
      isFinal: true,
    },
  ],
};

/**
 * گرفتن باس بر اساس روز
 */
function getBossByDay(day) {
  return enemies.bosses.find(b => b.day === day) || null;
}

/**
 * انتخاب دشمن تصادفی بر اساس قدرت بازیکن
 */
function getRandomEnemy(playerPower) {
  const available = Object.values(enemies).filter(e => 
    e.id !== "bosses" && e.power <= playerPower * 1.5
  );
  if (available.length === 0) return enemies.wolf;
  return available[Math.floor(Math.random() * available.length)];
}

module.exports = { enemies, getBossByDay, getRandomEnemy };