// تنظیمات اصلی بازی بقای فرمانروا - نسخه پیشرفته
const CONFIG = {
  // ========== تنظیمات کلی ==========
  MAX_DAYS: 30,
  ACTIONS_PER_DAY: 3,
  DIFFICULTY: "normal", // easy | normal | hard | legend
  
  // ========== منابع شروع بر اساس سختی ==========
  START_RESOURCES: {
    easy:   { gold: 1000, food: 20, wood: 40, stone: 30, iron: 15, soldiers: 10, health: 120 },
    normal: { gold: 500,  food: 10, wood: 20, stone: 15, iron: 5,  soldiers: 5,  health: 100 },
    hard:   { gold: 200,  food: 5,  wood: 10, stone: 5,  iron: 0,  soldiers: 2,  health: 80 },
    legend: { gold: 50,   food: 2,  wood: 5,  stone: 2,  iron: 0,  soldiers: 0,  health: 60 },
  },
  
  // ========== پناهگاه - ۵ سطح ==========
  SHELTER: {
    1: { name: "🏕️ کمپ ساده",   emoji: "🏕️", wood: 0,   stone: 0,   iron: 0,  gold: 0,   defense: 0,   capacity: 5,  healRate: 1 },
    2: { name: "🏠 کلبه چوبی",  emoji: "🏠", wood: 30,  stone: 10,  iron: 0,  gold: 0,   defense: 10,  capacity: 10, healRate: 2 },
    3: { name: "🏰 قلعه سنگی",  emoji: "🏰", wood: 60,  stone: 40,  iron: 15, gold: 0,   defense: 30,  capacity: 20, healRate: 3 },
    4: { name: "🏯 کاخ باشکوه", emoji: "🏯", wood: 100, stone: 80,  iron: 40, gold: 200, defense: 60,  capacity: 40, healRate: 5 },
    5: { name: "🏗️ پایگاه مدرن", emoji: "🏗️", wood: 200, stone: 150, iron: 100, gold: 500, defense: 100, capacity: 100, healRate: 10 },
  },
  
  // ========== لوکیشن‌ها و منابع قابل برداشت ==========
  LOCATIONS: {
    forest:   { name: "🌲 جنگل",     emoji: "🌲", resources: { wood: [5, 15], food: [1, 3],  stone: [0, 2],  iron: [0, 0] }, danger: 10 },
    mountain: { name: "🏔️ کوهستان", emoji: "🏔️", resources: { wood: [0, 3],  food: [0, 2],  stone: [5, 15], iron: [1, 5] }, danger: 20 },
    mine:     { name: "⛏️ معدنگاه", emoji: "⛏️", resources: { wood: [0, 2],  food: [0, 1],  stone: [2, 8],  iron: [5, 15] }, danger: 30 },
    desert:   { name: "🏜️ کویر",    emoji: "🏜️", resources: { wood: [0, 1],  food: [0, 1],  stone: [1, 5],  iron: [0, 3] }, danger: 15 },
    bazaar:   { name: "🏪 بازار",    emoji: "🏪", resources: { gold: [10, 50] }, danger: 0 },
  },
  
  // ========== غذاها - ارزش سیری و قیمت ==========
  FOODS: {
    bread:          { name: "🍞 نان",        emoji: "🍞", hunger: 2,  price: 5,   cookTime: 0, cookCost: { wood: 1 } },
    kebab:          { name: "🍖 کباب",       emoji: "🍖", hunger: 5,  price: 15,  cookTime: 0, cookCost: { wood: 2, food: 1 } },
    chicken_kebab:  { name: "🍗 جوجه کباب",  emoji: "🍗", hunger: 8,  price: 25,  cookTime: 0, cookCost: { wood: 2, food: 2 } },
    gheymeh:        { name: "🍲 قیمه",       emoji: "🍲", hunger: 12, price: 40,  cookTime: 1, cookCost: { wood: 3, food: 3, stone: 1 } },
    aash:           { name: "🥣 آش",         emoji: "🥣", hunger: 15, price: 60,  cookTime: 2, cookCost: { wood: 4, food: 4, stone: 2 } },
  },
  
  // ========== دشمنان معمولی ==========
  ENEMIES: {
    wolf:       { name: "🐺 گرگ وحشی",     emoji: "🐺", power: 5,   reward: { gold: 10, food: 2, exp: 5 } },
    bandit:     { name: "🗡️ راهزن صحرا",   emoji: "🗡️", power: 10,  reward: { gold: 25, iron: 2, exp: 10 } },
    dark_army:  { name: "⚔️ سپاه تاریکی",  emoji: "⚔️", power: 20,  reward: { gold: 50, soldiers: 1, exp: 20 } },
  },
  
  // ========== Boss ها (هر ۶ روز) ==========
  BOSSES: [
    { day: 6,  name: "👹 شیطان",         emoji: "👹", power: 30, reward: { gold: 100, weapon: "sword", exp: 50 },  gif: "gladiator_fight" },
    { day: 12, name: "🐍 مارشاه",        emoji: "🐍", power: 50, reward: { gold: 200, armor: "iron_armor", exp: 100 }, gif: "gladiator_fight" },
    { day: 18, name: "🧞 ام‌الجنی",      emoji: "🧞", power: 80, reward: { gold: 400, weapon: "axe_upgraded", exp: 200 }, gif: "gladiator_win" },
    { day: 24, name: "🐉 اژدهای کوهستان", emoji: "🐉", power: 120, reward: { gold: 700, armor: "dragon_armor", exp: 400 }, gif: "nuclear_gif" },
    { day: 30, name: "🔥 ققنوس",         emoji: "🔥", power: 200, reward: { gold: 1500, missile: "emad", exp: 1000 }, gif: "nuclear_gif" },
  ],
  
  // ========== رویدادهای تصادفی شبانه ==========
  EVENTS: [
    { name: "🌾 قحطی",       desc: "غذا کم شد!",     effect: { food: -5 } },
    { name: "💎 کشف گنج",    desc: "گنج پیدا کردی!",  effect: { gold: 100 } },
    { name: "🤝 اتحاد",      desc: "سرباز جدید آمد!", effect: { soldiers: 3 } },
    { name: "🌪️ طوفان",     desc: "چوب از بین رفت!", effect: { wood: -10 } },
    { name: "⚡ حمله شبانه", desc: "دشمن حمله کرد!",  effect: { health: -15, soldiers: -2 } },
    { name: "🎉 جشن بزرگ",   desc: "مردم شادند!",     effect: { gold: 50, food: 3 } },
    { name: "🦠 بیماری",     desc: "مریض شدی!",       effect: { health: -20 } },
    { name: "⛏️ رگه طلا",    desc: "معدن طلا کشف شد!", effect: { gold: 200, iron: 5 } },
    { name: "🐎 اسب وحشی",   desc: "اسب اهلی کردی!",  effect: { food: 5, soldiers: 1 } },
    { name: "📦 محموله",     desc: "کاروان رسید!",    effect: { gold: 80, wood: 10, stone: 10 } },
    { name: "🔥 آتش‌سوزی",   desc: "انبار سوخت!",     effect: { wood: -15, food: -3 } },
    { name: "☄️ شهاب‌سنگ",   desc: "سنگ آسمانی!",     effect: { iron: 20, stone: 10 } },
    { name: "🕊️ صلح موقت",  desc: "امروز خطری نیست!", effect: {} },
    { name: "💧 سیل",        desc: "همه چی خراب شد!", effect: { wood: -5, stone: -5, food: -3 } },
    { name: "👨‍🌾 کشاورز",    desc: "کشاورز ماهر آمد!", effect: { food: 8 } },
  ],
};

module.exports = CONFIG;