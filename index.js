const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const ADMIN_ID = 5576592239;
const DB_FILE = path.join(__dirname, 'data.json');

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN') {
  console.log('❌ توکن ربات را در BOT_TOKEN بگذار');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== دیتابیس ====================
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: {}, clans: {} };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.log('خطای لود دیتابیس:', e);
    return { users: {}, clans: {} };
  }
}

function saveDB(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_FILE, jsonString, 'utf8');
  } catch (e) {
    console.log('خطای ذخیره:', e);
  }
}

const db = loadDB();

// ==================== توابع کمکی ====================
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function parseArgs(text) {
  return text.trim().split(/\s+/);
}

function isAdmin(id) {
  return Number(id) === ADMIN_ID;
}

// ==================== ثابت‌ها ====================
const RES_KEYS = ['wood', 'stone', 'metal', 'iron', 'gold', 'toman'];

const RES_LABELS = {
  wood: '🪵 چوب',
  stone: '🪨 سنگ',
  metal: '🔩 فلز',
  iron: '⛓️ آهن',
  gold: '🥇 طلا',
  toman: '💵 تومن'
};

const RES_EMOJI = {
  wood: '🪵',
  stone: '🪨',
  metal: '🔩',
  iron: '⛓️',
  gold: '🥇',
  toman: '💵'
};

const WEAPONS = {
  none: { name: '❌ بدون سلاح', power: 0, price: 0, sell: 0, level: 0 },
  stick: { name: '🪵 چوب دستی', power: 2, price: 20, sell: 10, level: 1 },
  knife: { name: '🔪 چاقو', power: 5, price: 80, sell: 40, level: 2 },
  pistol: { name: '🔫 تپانچه', power: 10, price: 220, sell: 110, level: 3 },
  axe: { name: '🪓 تبر جنگی', power: 14, price: 350, sell: 175, level: 4 },
  rifle: { name: '🔫 تفنگ شکاری', power: 18, price: 500, sell: 250, level: 5 },
  sword: { name: '⚔️ شمشیر آتشین', power: 25, price: 1000, sell: 500, level: 8 },
  bow: { name: '🏹 کمان افسانه‌ای', power: 30, price: 2000, sell: 1000, level: 10 }
};

const HEAL_ITEMS = {
  bandage: { name: '🩹 باند زخم', heal: 15, price: 25, sell: 12 },
  medkit: { name: '💊 جعبه کمک‌های اولیه', heal: 40, price: 80, sell: 40 },
  soup: { name: '🍲 سوپ گرم', heal: 10, price: 18, sell: 9, hunger: 20 },
  herb: { name: '🌿 گیاه دارویی', heal: 20, price: 35, sell: 17 },
  elixir: { name: '🧪 اکسیر شفابخش', heal: 100, price: 200, sell: 100 }
};

const FOOD_ITEMS = {
  bread: { name: '🍞 نان', hunger: 30, thirst: -5, price: 10, sell: 5 },
  meat: { name: '🍖 گوشت شکار', hunger: 50, thirst: -10, price: 25, sell: 12 },
  fish: { name: '🐟 ماهی', hunger: 25, thirst: -15, price: 15, sell: 7 },
  water: { name: '💧 آب آشامیدنی', hunger: 0, thirst: 40, price: 8, sell: 4 },
  juice: { name: '🧃 آبمیوه', hunger: 10, thirst: 50, price: 20, sell: 10 }
};

const SPECIAL_ITEMS = {
  gem: { name: '💎 سنگ قیمتی', price: 120, sell: 60 },
  map: { name: '🗺️ نقشه کهنه', price: 90, sell: 45 },
  fuel: { name: '⛽ سوخت', price: 75, sell: 35 },
  dragon_scale: { name: '🐉 فلس اژدها', price: 500, sell: 250 },
  phoenix_feather: { name: '🦅 پر ققنوس', price: 800, sell: 400 }
};

const SHOP_BUY = {
  wood: { type: 'resource', key: 'wood', name: 'چوب', price: 8 },
  stone: { type: 'resource', key: 'stone', name: 'سنگ', price: 10 },
  metal: { type: 'resource', key: 'metal', name: 'فلز', price: 18 },
  iron: { type: 'resource', key: 'iron', name: 'آهن', price: 25 },
  bandage: { type: 'item', key: 'bandage', name: 'باند', price: 25 },
  medkit: { type: 'item', key: 'medkit', name: 'جعبه کمک', price: 80 },
  soup: { type: 'item', key: 'soup', name: 'سوپ', price: 18 },
  herb: { type: 'item', key: 'herb', name: 'گیاه درمانی', price: 35 },
  elixir: { type: 'item', key: 'elixir', name: 'اکسیر', price: 200 },
  bread: { type: 'food', key: 'bread', name: 'نان', price: 10 },
  meat: { type: 'food', key: 'meat', name: 'گوشت', price: 25 },
  fish: { type: 'food', key: 'fish', name: 'ماهی', price: 15 },
  water: { type: 'food', key: 'water', name: 'آب', price: 8 },
  juice: { type: 'food', key: 'juice', name: 'آبمیوه', price: 20 },
  stick: { type: 'weapon', key: 'stick', name: 'چوب دستی', price: 20 },
  knife: { type: 'weapon', key: 'knife', name: 'چاقو', price: 80 },
  pistol: { type: 'weapon', key: 'pistol', name: 'تپانچه', price: 220 },
  rifle: { type: 'weapon', key: 'rifle', name: 'تفنگ', price: 500 },
  axe: { type: 'weapon', key: 'axe', name: 'تبر جنگی', price: 350 },
  sword: { type: 'weapon', key: 'sword', name: 'شمشیر آتشین', price: 1000 },
  bow: { type: 'weapon', key: 'bow', name: 'کمان افسانه‌ای', price: 2000 },
  gem: { type: 'special', key: 'gem', name: 'سنگ قیمتی', price: 120 },
  map: { type: 'special', key: 'map', name: 'نقشه کهنه', price: 90 },
  fuel: { type: 'special', key: 'fuel', name: 'سوخت', price: 75 }
};

const HOME_UPGRADES = {
  2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, needPlayerLevel: 3 },
  3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, needPlayerLevel: 5 },
  4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, needPlayerLevel: 8 },
  5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, needPlayerLevel: 12 }
};

const ARMORY_RECIPES = {
  pistol: { wood: 2, metal: 8, iron: 4, gold: 60, minLevel: 3 },
  rifle: { wood: 4, metal: 14, iron: 10, gold: 130, minLevel: 5 },
  axe: { wood: 5, metal: 10, iron: 6, gold: 80, minLevel: 4 },
  knife: { metal: 4, iron: 2, gold: 20, minLevel: 2 },
  sword: { wood: 10, metal: 20, iron: 15, gold: 300, dragon_scale: 1, minLevel: 8 },
  bow: { wood: 15, metal: 10, iron: 5, gold: 500, phoenix_feather: 1, minLevel: 10 }
};

const MISSIONS = [
  { id: 1, title: 'جمع آوری هیزم', desc: '10 چوب جمع کن', targetType: 'resource', targetKey: 'wood', targetAmount: 10, rewards: { xp: 8, wood: 5, gold: 10, toman: 1 } },
  { id: 2, title: 'سنگ برای دیوار', desc: '8 سنگ جمع کن', targetType: 'resource', targetKey: 'stone', targetAmount: 8, rewards: { xp: 8, stone: 4, gold: 10, toman: 1 } },
  { id: 3, title: 'فلزهای پراکنده', desc: '5 فلز جمع کن', targetType: 'resource', targetKey: 'metal', targetAmount: 5, rewards: { xp: 10, metal: 2, gold: 15, toman: 1 } },
  { id: 4, title: 'آهن برای استحکام', desc: '3 آهن جمع کن', targetType: 'resource', targetKey: 'iron', targetAmount: 3, rewards: { xp: 12, iron: 1, gold: 20, toman: 1 } },
  { id: 5, title: 'گشت اطراف پایگاه', desc: '1 بار جستجو انجام بده', targetType: 'action', targetKey: 'gather', targetAmount: 1, rewards: { xp: 6, wood: 3, stone: 3, gold: 8, toman: 1 } },
  { id: 6, title: 'شکار حیوان', desc: '1 بار مبارزه را ببر', targetType: 'action', targetKey: 'fight_win', targetAmount: 1, rewards: { xp: 10, gold: 18, metal: 2, toman: 1 } },
  { id: 7, title: 'نبردجوی تازه کار', desc: '2 برد در مبارزه', targetType: 'action', targetKey: 'fight_win', targetAmount: 2, rewards: { xp: 15, gold: 25, iron: 2, toman: 1 } },
  { id: 8, title: 'جمع کننده منظم', desc: '3 بار جستجو انجام بده', targetType: 'action', targetKey: 'gather', targetAmount: 3, rewards: { xp: 12, wood: 8, stone: 8, gold: 12, toman: 1 } },
  { id: 9, title: 'درآمد روزانه', desc: '50 طلا داشته باش', targetType: 'resource', targetKey: 'gold', targetAmount: 50, rewards: { xp: 10, gold: 20, toman: 1 } },
  { id: 10, title: 'بقای بهتر', desc: 'HP را به بالای 80 برسان', targetType: 'stat', targetKey: 'hp80', targetAmount: 1, rewards: { xp: 8, herb: 1, gold: 10, toman: 1 } },
  { id: 11, title: 'ارتقای خانه', desc: 'خانه را یک سطح ارتقا بده', targetType: 'action', targetKey: 'home_upgrade', targetAmount: 1, rewards: { xp: 20, gold: 30, toman: 2, map: 1 } },
  { id: 12, title: 'خریدار پایگاه', desc: '1 خرید از فروشگاه انجام بده', targetType: 'action', targetKey: 'buy', targetAmount: 1, rewards: { xp: 7, gold: 8, toman: 1 } },
  { id: 13, title: 'مسلح شو', desc: 'یک سلاح تهیه کن', targetType: 'action', targetKey: 'get_weapon', targetAmount: 1, rewards: { xp: 12, gold: 20, toman: 1 } },
  { id: 14, title: 'بیمارستان صحرایی', desc: '1 بار درمان انجام بده', targetType: 'action', targetKey: 'heal', targetAmount: 1, rewards: { xp: 7, herb: 1, toman: 1 } },
  { id: 15, title: 'فروشنده زرنگ', desc: '1 بار فروش انجام بده', targetType: 'action', targetKey: 'sell', targetAmount: 1, rewards: { xp: 7, gold: 12, toman: 1 } },
  { id: 16, title: 'دیو ضعیف', desc: '1 دیو را شکست بده', targetType: 'action', targetKey: 'demon_win', targetAmount: 1, rewards: { xp: 18, gold: 40, iron: 3, toman: 2, gem: 1 } },
  { id: 17, title: 'جمع آوری ثروت', desc: '100 طلا داشته باش', targetType: 'resource', targetKey: 'gold', targetAmount: 100, rewards: { xp: 15, gold: 30, toman: 2 } },
  { id: 18, title: 'استاد بقا', desc: '5 بار جستجو انجام بده', targetType: 'action', targetKey: 'gather', targetAmount: 5, rewards: { xp: 18, wood: 10, stone: 10, metal: 5, toman: 2 } },
  { id: 19, title: 'جنگجوی حرفه‌ای', desc: '3 برد در مبارزه', targetType: 'action', targetKey: 'fight_win', targetAmount: 3, rewards: { xp: 20, gold: 35, iron: 4, toman: 2 } },
  { id: 20, title: 'روز سخت', desc: '2 دیو را شکست بده', targetType: 'action', targetKey: 'demon_win', targetAmount: 2, rewards: { xp: 25, gold: 55, iron: 5, toman: 3, gem: 1 } },
  { id: 21, title: 'شکارچی اژدها', desc: '1 اژدها را شکست بده', targetType: 'action', targetKey: 'dragon_win', targetAmount: 1, rewards: { xp: 50, gold: 200, dragon_scale: 1, toman: 5 } },
  { id: 22, title: 'بقای واقعی', desc: 'گرسنگی را بالای 50 نگه دار', targetType: 'stat', targetKey: 'hunger50', targetAmount: 1, rewards: { xp: 15, bread: 2, water: 2, gold: 15 } },
  { id: 23, title: 'کلن قدرتمند', desc: 'عضو یک کلن شو', targetType: 'stat', targetKey: 'in_clan', targetAmount: 1, rewards: { xp: 30, gold: 100, toman: 3 } }
];

// ==================== موجودات ====================
const ANIMALS = [
  { name: '🐺 گرگ خاکستری', type: 'animal', power: 8, hpLoss: [8, 16], rewards: { gold: 10, wood: 1, meat: 1 }, xpReward: 8 },
  { name: '🐗 گراز وحشی', type: 'animal', power: 10, hpLoss: [9, 18], rewards: { gold: 12, stone: 1, meat: 2 }, xpReward: 10 },
  { name: '🦊 کفتار گرسنه', type: 'animal', power: 12, hpLoss: [10, 20], rewards: { gold: 15, metal: 1, meat: 1 }, xpReward: 12 },
  { name: '🐻 خرس قهوه‌ای', type: 'animal', power: 16, hpLoss: [14, 28], rewards: { gold: 20, iron: 1, meat: 3 }, xpReward: 15 }
];

const DEMONS = [
  { name: '👹 دیو سرخ', type: 'demon', power: 16, hpLoss: [18, 35], rewards: { gold: 28, iron: 2, metal: 2, gem: 1 }, xpReward: 18 },
  { name: '👺 دیو سنگی', type: 'demon', power: 22, hpLoss: [22, 40], rewards: { gold: 40, iron: 3, toman: 1, gem: 1 }, xpReward: 22 },
  { name: '👾 دیو بزرگ تاریکی', type: 'demon', power: 28, hpLoss: [25, 48], rewards: { gold: 55, iron: 4, toman: 1, gem: 2 }, xpReward: 28 }
];

const PREYS = [
  { name: '🦌 آهوی زیبا', type: 'prey', power: 3, hpLoss: [2, 5], rewards: { gold: 5, wood: 1, meat: 1 }, xpReward: 5 },
  { name: '🐑 گوسفند وحشی', type: 'prey', power: 4, hpLoss: [3, 7], rewards: { gold: 6, stone: 1, meat: 2 }, xpReward: 6 },
  { name: '🦃 بوقلمون چاق', type: 'prey', power: 2, hpLoss: [1, 3], rewards: { gold: 4, wood: 1, meat: 1 }, xpReward: 4 },
  { name: '🐇 خرگوش سریع', type: 'prey', power: 1, hpLoss: [0, 2], rewards: { gold: 3, wood: 1 }, xpReward: 3 }
];

const BOSSES = [
  { name: '🐉 اژدهای آتشین', type: 'boss', power: 40, hpLoss: [35, 70], rewards: { gold: 500, dragon_scale: 2, gem: 5, toman: 10 }, xpReward: 100, minLevel: 8 },
  { name: '🦅 ققنوس افسانه‌ای', type: 'boss', power: 50, hpLoss: [40, 80], rewards: { gold: 800, phoenix_feather: 2, gem: 8, toman: 15 }, xpReward: 150, minLevel: 10 },
  { name: '👹 شیطان بزرگ', type: 'boss', power: 65, hpLoss: [50, 100], rewards: { gold: 1500, dragon_scale: 3, phoenix_feather: 3, gem: 15, toman: 25 }, xpReward: 250, minLevel: 15 }
];

// ==================== رویدادهای تصادفی ====================
const RANDOM_EVENTS = [
  { name: '🌪️ طوفان سهمگین', desc: 'طوفان به پایگاهت آسیب زد!', effect: (u) => { u.resources.wood = Math.floor(u.resources.wood * 0.7); u.resources.stone = Math.floor(u.resources.stone * 0.7); return 'چوب و سنگ کم شد...'; } },
  { name: '💧 باران شدید', desc: 'باران شدید محصولاتت رو سیراب کرد!', effect: (u) => { u.resources.wood += 10; u.hunger += 10; return 'چوب اضافه شد و گرسنگی کم شد!'; } },
  { name: '💰 گنج پنهان', desc: 'یه گنج مخفی پیدا کردی!', effect: (u) => { u.resources.gold += rnd(50, 200); u.items.gem = (u.items.gem || 0) + rnd(1, 3); return 'طلا و سنگ قیمتی پیدا شد!'; } },
  { name: '🤒 بیماری', desc: 'مریض شدی...', effect: (u) => { u.hp = Math.floor(u.hp * 0.6); return 'سلامتی‌ات کم شد!'; } },
  { name: '🎁 هدیه آسمانی', desc: 'یه بسته از آسمون افتاد!', effect: (u) => { const items = ['bandage', 'medkit', 'bread', 'water']; const item = items[rnd(0, items.length - 1)]; u.items[item] = (u.items[item] || 0) + rnd(1, 3); return `هدیه گرفتی!`; } }
];

// ==================== سیستم مهارت‌ها ====================
const SKILLS = {
  gathering: { name: '⛏️ جمع‌آوری', desc: 'شانس پیدا کردن منابع بیشتر', maxLevel: 10, effect: 0.05 },
  hunting: { name: '🏹 شکار', desc: 'قدرت بیشتر در مبارزات', maxLevel: 10, effect: 0.5 },
  crafting: { name: '🔨 صنعتگری', desc: 'کاهش هزینه ساخت', maxLevel: 10, effect: 0.03 },
  survival: { name: '🏕️ بقا', desc: 'کاهش گرسنگی و تشنگی', maxLevel: 10, effect: 0.5 }
};

// ==================== مدیریت کاربر ====================
function ensureUser(id, name = '') {
  const uid = String(id);
  if (!db.users[uid]) {
    db.users[uid] = {
      id: uid,
      name,
      playerLevel: 1,
      playerXP: 0,
      hp: 100,
      maxHp: 300,
      hunger: 100,
      maxHunger: 100,
      thirst: 100,
      maxThirst: 100,
      homeLevel: 1,
      weapon: 'none',
      clan: null,
      skills: {
        gathering: 0,
        hunting: 0,
        crafting: 0,
        survival: 0
      },
      skillPoints: 0,
      resources: {
        wood: 20,
        stone: 20,
        metal: 20,
        iron: 20,
        gold: 30,
        toman: 20
      },
      items: {
        bandage: 1,
        medkit: 0,
        soup: 0,
        herb: 0,
        elixir: 0,
        bread: 2,
        meat: 0,
        fish: 0,
        water: 2,
        juice: 0,
        gem: 0,
        map: 0,
        fuel: 0,
        dragon_scale: 0,
        phoenix_feather: 0
      },
      weaponsOwned: {
        none: true
      },
      daily: {
        key: todayKey(),
        missions: [],
        progress: {},
        freeHealUsed: false,
        prayUsed: false,
        eventsTriggered: false
      },
      stats: {
        gather: 0,
        fight_win: 0,
        demon_win: 0,
        dragon_win: 0,
        boss_win: 0,
        home_upgrade: 0,
        buy: 0,
        sell: 0,
        heal: 0,
        get_weapon: 0
      },
      pendingFight: null,
      lastHungerUpdate: Date.now()
    };
    rollDailyMissions(db.users[uid]);
    saveDB(db);
  } else {
    if (name && !db.users[uid].name) db.users[uid].name = name;
    normalizeUser(db.users[uid]);
  }
  return db.users[uid];
}

function normalizeUser(u) {
  u.playerLevel ??= 1;
  u.playerXP ??= 0;
  u.hp ??= 100;
  u.maxHp ??= 300;
  u.hunger ??= 100;
  u.maxHunger ??= 100;
  u.thirst ??= 100;
  u.maxThirst ??= 100;
  u.homeLevel ??= 1;
  u.weapon ??= 'none';
  u.clan ??= null;
  u.skills ??= { gathering: 0, hunting: 0, crafting: 0, survival: 0 };
  u.skillPoints ??= 0;
  u.resources ??= {};
  u.items ??= {};
  u.weaponsOwned ??= { none: true };
  u.daily ??= { key: todayKey(), missions: [], progress: {}, freeHealUsed: false, prayUsed: false, eventsTriggered: false };
  u.stats ??= {};
  u.pendingFight ??= null;
  u.lastHungerUpdate ??= Date.now();
  
  for (const k of RES_KEYS) if (typeof u.resources[k] !== 'number') u.resources[k] = 0;
  for (const k of [...Object.keys(HEAL_ITEMS), ...Object.keys(FOOD_ITEMS), ...Object.keys(SPECIAL_ITEMS)]) {
    if (typeof u.items[k] !== 'number') u.items[k] = 0;
  }
  
  u.weaponsOwned.none = true;
  if (typeof u.daily.prayUsed !== 'boolean') u.daily.prayUsed = false;
  if (typeof u.daily.eventsTriggered !== 'boolean') u.daily.eventsTriggered = false;
  
  const statKeys = ['gather', 'fight_win', 'demon_win', 'dragon_win', 'boss_win', 'home_upgrade', 'buy', 'sell', 'heal', 'get_weapon'];
  for (const k of statKeys) if (typeof u.stats[k] !== 'number') u.stats[k] = 0;
  
  refreshDaily(u);
  updateHunger(u);
}

function refreshDaily(u) {
  if (u.daily.key !== todayKey()) {
    u.daily = {
      key: todayKey(),
      missions: [],
      progress: {},
      freeHealUsed: false,
      prayUsed: false,
      eventsTriggered: false
    };
    rollDailyMissions(u);
    saveDB(db);
  }
}

function rollDailyMissions(u) {
  const pool = [...MISSIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  u.daily.missions = pool.map(m => ({
    id: m.id,
    claimed: false
  }));
  u.daily.progress = {};
  for (const m of pool) u.daily.progress[m.id] = 0;
}

function updateHunger(u) {
  const now = Date.now();
  const elapsed = Math.floor((now - (u.lastHungerUpdate || now)) / (60 * 1000)); // هر دقیقه
  
  if (elapsed > 0) {
    const survivalBonus = (u.skills.survival || 0) * SKILLS.survival.effect;
    u.hunger = Math.max(0, u.hunger - elapsed * (1 - survivalBonus));
    u.thirst = Math.max(0, u.thirst - elapsed * 1.5 * (1 - survivalBonus));
    
    if (u.hunger <= 0) {
      u.hp = Math.max(0, u.hp - elapsed * 5);
    }
    if (u.thirst <= 0) {
      u.hp = Math.max(0, u.hp - elapsed * 3);
    }
    
    u.lastHungerUpdate = now;
  }
}

function missionById(id) {
  return MISSIONS.find(m => m.id === id);
}

function addXP(u, amount) {
  u.playerXP += amount;
  let ups = 0;
  while (u.playerXP >= 30) {
    u.playerXP -= 30;
    u.playerLevel += 1;
    u.maxHp += 10;
    u.maxHunger += 5;
    u.maxThirst += 5;
    u.hp = u.maxHp;
    u.hunger = u.maxHunger;
    u.thirst = u.maxThirst;
    u.skillPoints = (u.skillPoints || 0) + 1;
    ups++;
  }
  return ups;
}

function addResource(u, key, amount) {
  if (typeof u.resources[key] !== 'number') u.resources[key] = 0;
  u.resources[key] += amount;
  if (u.resources[key] < 0) u.resources[key] = 0;
}

function addItem(u, key, amount) {
  if (typeof u.items[key] !== 'number') u.items[key] = 0;
  u.items[key] += amount;
  if (u.items[key] < 0) u.items[key] = 0;
}

function hasResources(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'needPlayerLevel' || k === 'minLevel') continue;
    if (k === 'dragon_scale' || k === 'phoenix_feather') {
      if ((u.items[k] || 0) < v) return false;
    } else if ((u.resources[k] || 0) < v) return false;
  }
  return true;
}

function takeResources(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'needPlayerLevel' || k === 'minLevel') continue;
    if (k === 'dragon_scale' || k === 'phoenix_feather') {
      addItem(u, k, -v);
    } else {
      addResource(u, k, -v);
    }
  }
}

function formatCost(cost) {
  return Object.entries(cost)
    .filter(([k]) => k !== 'needPlayerLevel' && k !== 'minLevel')
    .map(([k, v]) => {
      if (k === 'dragon_scale') return `🐉 ${v} فلس اژدها`;
      if (k === 'phoenix_feather') return `🦅 ${v} پر ققنوس`;
      return `${RES_EMOJI[k] || ''} ${v} ${RES_LABELS[k] || k}`;
    })
    .join(' | ');
}

function rewardText(rew) {
  const out = [];
  for (const [k, v] of Object.entries(rew)) {
    if (k === 'xp') out.push(`✨ ${v} XP`);
    else if (k === 'xpReward') continue;
    else if (RES_LABELS[k]) out.push(`${RES_EMOJI[k]} ${v} ${RES_LABELS[k]}`);
    else if (HEAL_ITEMS[k]) out.push(`${v} ${HEAL_ITEMS[k].name}`);
    else if (FOOD_ITEMS[k]) out.push(`${v} ${FOOD_ITEMS[k].name}`);
    else if (SPECIAL_ITEMS[k]) out.push(`${v} ${SPECIAL_ITEMS[k].name}`);
    else out.push(`${v} ${k}`);
  }
  return out.join(' | ');
}

function isMissionDone(u, m) {
  const p = getMissionProgress(u, m);
  return p >= m.targetAmount;
}

function getMissionProgress(u, m) {
  if (m.targetType === 'resource') {
    return u.resources[m.targetKey] || 0;
  }
  if (m.targetType === 'stat') {
    if (m.targetKey === 'hp80') return u.hp >= 80 ? 1 : 0;
    if (m.targetKey === 'hunger50') return u.hunger >= 50 ? 1 : 0;
    if (m.targetKey === 'in_clan') return u.clan ? 1 : 0;
  }
  return u.daily.progress[m.id] || 0;
}

function bumpAction(u, actionKey, amount = 1) {
  u.stats[actionKey] = (u.stats[actionKey] || 0) + amount;
  refreshDaily(u);
  for (const d of u.daily.missions) {
    const m = missionById(d.id);
    if (m && m.targetType === 'action' && m.targetKey === actionKey && !d.claimed) {
      u.daily.progress[m.id] = (u.daily.progress[m.id] || 0) + amount;
    }
  }
}

function claimAvailableMissions(u) {
  refreshDaily(u);
  const msgs = [];
  for (const d of u.daily.missions) {
    const m = missionById(d.id);
    if (m && !d.claimed && isMissionDone(u, m)) {
      d.claimed = true;
      for (const [k, v] of Object.entries(m.rewards)) {
        if (k === 'xp') continue;
        if (RES_LABELS[k]) addResource(u, k, v);
        else addItem(u, k, v);
      }
      const ups = addXP(u, m.rewards.xp || 0);
      msgs.push(`✅ ${m.title}\n🎁 ${rewardText(m.rewards)}${ups ? `\n⬆️ ${ups} لول افزایش پیدا کرد` : ''}`);
    }
  }
  return msgs.join('\n\n');
}

function triggerRandomEvent(u) {
  if (u.daily.eventsTriggered) return null;
  if (Math.random() < 0.3) { // 30% شانس
    const event = RANDOM_EVENTS[rnd(0, RANDOM_EVENTS.length - 1)];
    const msg = event.effect(u);
    u.daily.eventsTriggered = true;
    return { event, msg };
  }
  return null;
}

// ==================== توابع نمایش ====================
function getFacilities(u) {
  return [
    `🏥 درمانگاه: ${u.homeLevel >= 2 ? '✅ فعال' : '🔒 قفل (نیاز به خانه لول 2)'}`,
    `🛒 فروشگاه: ${u.homeLevel >= 2 ? '✅ فعال' : '🔒 قفل (نیاز به خانه لول 2)'}`,
    `🛠️ اسلحه‌خانه: ${u.homeLevel >= 2 ? '✅ فعال' : '🔒 قفل (نیاز به خانه لول 2)'}`,
    `🏛️ کلن: ${u.homeLevel >= 3 ? '✅ فعال' : '🔒 قفل (نیاز به خانه لول 3)'}`
  ].join('\n');
}

function statusText(u) {
  updateHunger(u);
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const hungerStatus = u.hunger > 70 ? '✅' : u.hunger > 30 ? '⚠️' : '❌';
  const thirstStatus = u.thirst > 70 ? '✅' : u.thirst > 30 ? '⚠️' : '❌';
  const clanName = u.clan ? (db.clans[u.clan]?.name || u.clan) : 'ندارد';
  
  return [
    `🏕️ وضعیت بازیکن`,
    `👤 نام: ${u.name || '-'}`,
    `🎚️ لول: ${u.playerLevel}`,
    `✨ XP: ${u.playerXP}/30`,
    `⭐ امتیاز مهارت: ${u.skillPoints || 0}`,
    `❤️ HP: ${u.hp}/${u.maxHp}`,
    `🍞 گرسنگی: ${hungerStatus} ${Math.floor(u.hunger)}/${u.maxHunger}`,
    `💧 تشنگی: ${thirstStatus} ${Math.floor(u.thirst)}/${u.maxThirst}`,
    `🏠 لول خانه: ${u.homeLevel}`,
    `⚔️ سلاح فعلی: ${weapon.name}`,
    `🏛️ کلن: ${clanName}`,
    ``,
    `📊 مهارت‌ها:`,
    `⛏️ جمع‌آوری: ${u.skills.gathering || 0}/10`,
    `🏹 شکار: ${u.skills.hunting || 0}/10`,
    `🔨 صنعتگری: ${u.skills.crafting || 0}/10`,
    `🏕️ بقا: ${u.skills.survival || 0}/10`,
    ``,
    `📦 منابع:`,
    `🪵 چوب: ${u.resources.wood}`,
    `🪨 سنگ: ${u.resources.stone}`,
    `🔩 فلز: ${u.resources.metal}`,
    `⛓️ آهن: ${u.resources.iron}`,
    `🥇 طلا: ${u.resources.gold}`,
    `💵 تومن: ${u.resources.toman}`,
    ``,
    `🧰 آیتم‌ها:`,
    `🩹 باند: ${u.items.bandage} | 💊 جعبه کمک: ${u.items.medkit}`,
    `🍲 سوپ: ${u.items.soup} | 🌿 گیاه: ${u.items.herb}`,
    `🧪 اکسیر: ${u.items.elixir || 0}`,
    `🍞 نان: ${u.items.bread || 0} | 🍖 گوشت: ${u.items.meat || 0}`,
    `🐟 ماهی: ${u.items.fish || 0} | 💧 آب: ${u.items.water || 0}`,
    `🧃 آبمیوه: ${u.items.juice || 0}`,
    `💎 سنگ قیمتی: ${u.items.gem || 0} | 🗺️ نقشه: ${u.items.map || 0}`,
    `⛽ سوخت: ${u.items.fuel || 0}`,
    `🐉 فلس اژدها: ${u.items.dragon_scale || 0} | 🦅 پر ققنوس: ${u.items.phoenix_feather || 0}`,
    ``,
    `🏗️ امکانات:`,
    getFacilities(u)
  ].join('\n');
}

function guideText() {
  return [
    `📖 راهنمای بازی بقا`,
    ``,
    `🎯 هدف بازی:`,
    `زنده بمون، قوی شو و دنیا رو کشف کن!`,
    ``,
    `🪓 جستجو:`,
    `با جستجو منابع جمع کن. مهارت جمع‌آوری شانس تو رو بیشتر می‌کنه.`,
    ``,
    `⚔️ مبارزه:`,
    `با حیوانات و دیوها بجنگ. با شکست دادنشون طلا و XP می‌گیری.`,
    `هر چی لول بالاتر، قدرتت بیشتر!`,
    ``,
    `🍞 گرسنگی و تشنگی:`,
    `باید غذا و آب بخوری وگرنه گرسنه و تشنه می‌مونی و HP کم می‌کنی!`,
    `از فروشگاه غذا و آب بخر.`,
    ``,
    `⭐ مهارت‌ها:`,
    `با لول آپ 1 امتیاز مهارت می‌گیری. 4 تا مهارت داری:`,
    `⛏️ جمع‌آوری: منابع بیشتر`,
    `🏹 شکار: قدرت بیشتر در نبرد`,
    `🔨 صنعتگری: هزینه ساخت کمتر`,
    `🏕️ بقا: گرسنگی و تشنگی کمتر`,
    `برای ارتقا: /skill <نام مهارت>`,
    ``,
    `🏠 خانه:`,
    `با ارتقای خانه، امکانات جدید باز می‌شه.`,
    `لول 2: درمانگاه، فروشگاه، اسلحه‌خانه`,
    `لول 3: کلن (قبیله)`,
    ``,
    `🏛️ کلن:`,
    `با کلن می‌تونی با بقیه بازیکنا متحد بشی و منابع رو به اشتراک بذاری.`,
    `ساخت کلن: /create_clan <اسم>`,
    `عضویت: /join_clan <اسم کلن>`,
    ``,
    `🐉 باس‌ها:`,
    `موجودات افسانه‌ای مثل اژدها و ققنوس رو شکست بده تا آیتم‌های خاص بگیری!`,
    ``,
    `💡 نکات:`,
    `- هر روز ماموریت‌های روزانه رو انجام بده`,
    `- از آرامگاه برای XP اضافی استفاده کن`,
    `- غذا و آب همیشه همراهت باشه`,
    `- با لول بالاتر، سلاح‌های قوی‌تر بساز`
  ].join('\n');
}

function clanText(u) {
  if (!u.clan) {
    return `🏛️ کلن\n\nتو عضو هیچ کلنی نیستی.\n\nساخت کلن: /create_clan <اسم>\nعضویت: /join_clan <اسم کلن>\nلیست کلن‌ها: /clans`;
  }
  
  const clan = db.clans[u.clan];
  if (!clan) {
    u.clan = null;
    saveDB(db);
    return `❌ کلن قبلی حذف شده.`;
  }
  
  const members = clan.members.map(mid => {
    const member = db.users[mid];
    return `- ${member?.name || mid} ${member ? `(لول ${member.playerLevel})` : ''} ${mid === clan.owner ? '👑' : ''}`;
  }).join('\n');
  
  return [
    `🏛️ کلن: ${clan.name}`,
    `👑 رهبر: ${db.users[clan.owner]?.name || clan.owner}`,
    `👥 اعضا: ${clan.members.length}`,
    `📦 منابع مشترک:`,
    `🪵 چوب: ${clan.resources.wood || 0}`,
    `🪨 سنگ: ${clan.resources.stone || 0}`,
    `🥇 طلا: ${clan.resources.gold || 0}`,
    ``,
    `👥 لیست اعضا:`,
    members,
    ``,
    `افزودن منابع: /donate <نوع> <مقدار>`,
    `خروج: /leave_clan`
  ].join('\n');
}

// ==================== منوها ====================
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🪓 جستجو', 'gather')],
    [Markup.button.callback('📦 ماموریت‌ها', 'missions'), Markup.button.callback('✅ تحویل ماموریت', 'claim_missions')],
    [Markup.button.callback('⚔️ مبارزه', 'fight_menu'), Markup.button.callback('👹 باس فایت', 'boss_menu')],
    [Markup.button.callback('🏠 خانه', 'home'), Markup.button.callback('🏥 درمانگاه', 'clinic')],
    [Markup.button.callback('🛒 فروشگاه', 'shop'), Markup.button.callback('🛠️ اسلحه خانه', 'armory')],
    [Markup.button.callback('🕯️ آرامگاه', 'aramgah'), Markup.button.callback('🏛️ کلن', 'clan')],
    [Markup.button.callback('📖 راهنما', 'guide'), Markup.button.callback('⭐ مهارت‌ها', 'skills')]
  ]);
}

function backMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'back_main')]
  ]);
}

function foodMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان', 'eat_bread'), Markup.button.callback('🍖 گوشت', 'eat_meat')],
    [Markup.button.callback('🐟 ماهی', 'eat_fish'), Markup.button.callback('🍲 سوپ', 'eat_soup')],
    [Markup.button.callback('💧 آب', 'drink_water'), Markup.button.callback('🧃 آبمیوه', 'drink_juice')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
}

function skillsKeyboard(u) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⛏️ جمع‌آوری ${u.skills.gathering}/10`, 'skill_gathering')],
    [Markup.button.callback(`🏹 شکار ${u.skills.hunting}/10`, 'skill_hunting')],
    [Markup.button.callback(`🔨 صنعتگری ${u.skills.crafting}/10`, 'skill_crafting')],
    [Markup.button.callback(`🏕️ بقا ${u.skills.survival}/10`, 'skill_survival')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
}

// ==================== گیم‌پلی ====================
function performGather(u) {
  const gatheringBonus = (u.skills.gathering || 0) * 0.1;
  const table = [
    { wood: 3 + Math.floor(gatheringBonus * 3), stone: 1 },
    { wood: 2, stone: 2, gold: 3 + Math.floor(gatheringBonus * 3) },
    { metal: 1, stone: 2 },
    { wood: 1, iron: 1 + Math.floor(gatheringBonus) },
    { gold: 6 + Math.floor(gatheringBonus * 6), wood: 2 },
    { stone: 3, metal: 1 + Math.floor(gatheringBonus) },
    { wood: 4 + Math.floor(gatheringBonus * 4) },
    { gold: 10 + Math.floor(gatheringBonus * 10), metal: 1, stone: 1 }
  ];
  const roll = table[Math.floor(Math.random() * table.length)];
  for (const [k, v] of Object.entries(roll)) addResource(u, k, v);
  
  // شانس پیدا کردن غذا
  if (Math.random() < 0.3) {
    const food = rnd(0, 2) === 0 ? 'bread' : rnd(0, 1) === 0 ? 'fish' : 'water';
    addItem(u, food, 1);
    roll.food = FOOD_ITEMS[food]?.name || food;
  }
  
  bumpAction(u, 'gather', 1);
  return roll;
}

function executeCombat(u, enemy) {
  updateHunger(u);
  if (u.hp <= 0) return { blocked: true, text: '❌ HP شما صفر است. اول درمان کن.' };
  if (u.hunger <= 10) return { blocked: true, text: '❌ خیلی گرسنه‌ای! اول غذا بخور.' };

  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const huntingBonus = (u.skills.hunting || 0) * SKILLS.hunting.effect;
  const playerPower = u.playerLevel * 4 + weapon.power + huntingBonus + rnd(0, 8);
  const enemyPower = enemy.power + rnd(0, 10);
  const loss = rnd(enemy.hpLoss[0], enemy.hpLoss[1]);

  let winChance = 50 + (playerPower - enemyPower) * 4;
  if (u.playerLevel <= 3) winChance += 15;
  winChance = clamp(winChance, 10, 90);
  
  const win = Math.random() * 100 < winChance;
  u.hp = clamp(u.hp - loss, 0, u.maxHp);

  if (win) {
    for (const [k, v] of Object.entries(enemy.rewards)) {
      if (k === 'xp' || k === 'xpReward') continue;
      if (RES_LABELS[k]) addResource(u, k, v);
      else addItem(u, k, v);
    }
    
    if (enemy.type === 'animal') bumpAction(u, 'fight_win', 1);
    else if (enemy.type === 'demon') bumpAction(u, 'demon_win', 1);
    else if (enemy.type === 'boss') {
      bumpAction(u, 'boss_win', 1);
      if (enemy.name.includes('اژدها')) bumpAction(u, 'dragon_win', 1);
    }
    
    const xpGain = enemy.xpReward || 10;
    addXP(u, xpGain);
    
    return {
      blocked: false,
      win: true,
      enemy,
      loss,
      xpGain,
      text: `⚔️ ${enemy.name}\n✅ پیروز شدی!\n✨ +${xpGain} XP\n❤️ آسیب: -${loss}\n🎁 غنیمت: ${rewardText(enemy.rewards)}`
    };
  } else {
    return {
      blocked: false,
      win: false,
      enemy,
      loss,
      text: `⚔️ ${enemy.name}\n❌ شکست خوردی!\n❤️ آسیب: -${loss}\n💪 قوی‌تر برگرد`
    };
  }
}

// ==================== کامندها ====================
bot.start((ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const event = triggerRandomEvent(u);
  let eventMsg = '';
  if (event) {
    eventMsg = `\n\n🌍 رویداد: ${event.event.name}!\n${event.event.desc}\n${event.msg}`;
    saveDB(db);
  }
  return ctx.reply(
    `🏕️ سلام ${u.name || 'قهرمان'}! به بازی بقا خوش اومدی!\n\nاز دکمه‌های زیر استفاده کن:${eventMsg}`,
    mainMenu()
  );
});

bot.command('skills', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(
    `⭐ مهارت‌های شما:\n\n` +
    `⛏️ جمع‌آوری: ${u.skills.gathering}/10 - شانس منابع بیشتر\n` +
    `🏹 شکار: ${u.skills.hunting}/10 - قدرت بیشتر در نبرد\n` +
    `🔨 صنعتگری: ${u.skills.crafting}/10 - کاهش هزینه ساخت\n` +
    `🏕️ بقا: ${u.skills.survival}/10 - کاهش گرسنگی و تشنگی\n\n` +
    `📊 امتیاز مهارت: ${u.skillPoints || 0}\n` +
    `برای ارتقا: /skill <نام>\n` +
    `مثال: /skill hunting`,
    skillsKeyboard(u)
  );
});

bot.command('skill', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const skillName = args[1];
  
  if (!skillName || !SKILLS[skillName]) {
    return ctx.reply('❌ مهارت نامعتبر.\nمهارت‌ها: gathering, hunting, crafting, survival', backMenu());
  }
  
  if ((u.skillPoints || 0) <= 0) {
    return ctx.reply('❌ امتیاز مهارت نداری. با لول آپ 1 امتیاز می‌گیری.', backMenu());
  }
  
  if ((u.skills[skillName] || 0) >= SKILLS[skillName].maxLevel) {
    return ctx.reply('❌ این مهارت به حداکثر رسیده.', backMenu());
  }
  
  u.skills[skillName] = (u.skills[skillName] || 0) + 1;
  u.skillPoints -= 1;
  saveDB(db);
  
  ctx.reply(`✅ مهارت ${SKILLS[skillName].name} ارتقا یافت!\nسطح فعلی: ${u.skills[skillName]}/${SKILLS[skillName].maxLevel}`, backMenu());
});

bot.command('eat', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply('🍽️ چی می‌خوای بخوری یا بنوشی؟', foodMenuKeyboard());
});

bot.command('clans', (ctx) => {
  const clans = Object.entries(db.clans);
  if (clans.length === 0) return ctx.reply('❌ هیچ کلنی وجود نداره.\nبا /create_clan <اسم> یکی بساز!');
  
  const list = clans.map(([id, clan]) => 
    `🏛️ ${clan.name} | 👥 ${clan.members.length} عضو | 👑 ${db.users[clan.owner]?.name || clan.owner}`
  ).join('\n');
  
  ctx.reply(`🏛️ لیست کلن‌ها:\n\n${list}\n\nعضویت: /join_clan <اسم کلن>`, backMenu());
});

bot.command('create_clan', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 3) return ctx.reply('❌ برای ساخت کلن باید خانه لول 3 داشته باشی.', backMenu());
  if (u.clan) return ctx.reply('❌ تو قبلاً عضو یه کلنی. اول از کلن قبلی خارج شو: /leave_clan', backMenu());
  
  const args = parseArgs(ctx.message.text);
  const clanName = args.slice(1).join(' ');
  
  if (!clanName) return ctx.reply('❌ اسم کلن رو بنویس.\nمثال: /create_clan قبیله گرگ', backMenu());
  if (clanName.length > 20) return ctx.reply('❌ اسم کلن حداکثر 20 حرف باشه.', backMenu());
  
  // Check if clan name exists
  const exists = Object.values(db.clans).some(c => c.name === clanName);
  if (exists) return ctx.reply('❌ این اسم قبلاً استفاده شده.', backMenu());
  
  const clanId = 'clan_' + Date.now();
  db.clans[clanId] = {
    id: clanId,
    name: clanName,
    owner: u.id,
    members: [u.id],
    resources: { wood: 0, stone: 0, gold: 0 },
    createdAt: new Date().toISOString()
  };
  u.clan = clanId;
  saveDB(db);
  
  ctx.reply(`✅ کلن "${clanName}" ساخته شد!\n👥 اعضا: 1\nدعوت بازیکنا: /invite <آیدی>\nافزودن منابع: /donate <نوع> <مقدار>`, backMenu());
});

bot.command('join_clan', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 3) return ctx.reply('❌ برای عضویت در کلن باید خانه لول 3 داشته باشی.', backMenu());
  if (u.clan) return ctx.reply('❌ تو قبلاً عضو یه کلنی. اول از کلن قبلی خارج شو: /leave_clan', backMenu());
  
  const args = parseArgs(ctx.message.text);
  const clanName = args.slice(1).join(' ');
  
  if (!clanName) return ctx.reply('❌ اسم کلن رو بنویس.\nمثال: /join_clan قبیله گرگ', backMenu());
  
  const clan = Object.values(db.clans).find(c => c.name === clanName);
  if (!clan) return ctx.reply('❌ کلنی با این اسم پیدا نشد.', backMenu());
  if (clan.members.length >= 10) return ctx.reply('❌ این کلن پر شده (حداکثر 10 نفر).', backMenu());
  
  clan.members.push(u.id);
  u.clan = clan.id;
  saveDB(db);
  
  ctx.reply(`✅ به کلن "${clan.name}" پیوستی!\n👥 اعضا: ${clan.members.length}`, backMenu());
});

bot.command('leave_clan', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!u.clan) return ctx.reply('❌ تو عضو هیچ کلنی نیستی.', backMenu());
  
  const clan = db.clans[u.clan];
  if (clan) {
    clan.members = clan.members.filter(mid => mid !== u.id);
    if (clan.members.length === 0) {
      delete db.clans[u.clan];
    } else if (clan.owner === u.id) {
      clan.owner = clan.members[0];
    }
  }
  u.clan = null;
  saveDB(db);
  
  ctx.reply('✅ از کلن خارج شدی.', backMenu());
});

bot.command('donate', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!u.clan) return ctx.reply('❌ عضو هیچ کلنی نیستی.', backMenu());
  
  const args = parseArgs(ctx.message.text);
  const type = args[1];
  const amount = Number(args[2] || 0);
  
  if (!type || !amount || amount <= 0) {
    return ctx.reply('❌ روش استفاده: /donate <نوع> <مقدار>\nمثال: /donate wood 50\nانواع: wood, stone, gold', backMenu());
  }
  
  if (!['wood', 'stone', 'gold'].includes(type)) {
    return ctx.reply('❌ فقط می‌تونی wood, stone, gold اهدا کنی.', backMenu());
  }
  
  if ((u.resources[type] || 0) < amount) {
    return ctx.reply('❌ به این مقدار منبع نداری.', backMenu());
  }
  
  const clan = db.clans[u.clan];
  addResource(u, type, -amount);
  clan.resources[type] = (clan.resources[type] || 0) + amount;
  saveDB(db);
  
  ctx.reply(`✅ ${amount} ${RES_LABELS[type]} به کلن اهدا شد!`, backMenu());
});

// ==================== اکشن‌ها ====================
bot.action('status', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  updateHunger(u);
  saveDB(db);
  ctx.editMessageText(statusText(u), backMenu());
});

bot.action('gather', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  updateHunger(u);
  const found = performGather(u);
  
  let text = `🪓 جستجو انجام شد\n🎁 ${rewardText(found)}`;
  if (found.food) text += `\n🍽️ ${found.food} هم پیدا شد!`;
  
  const event = triggerRandomEvent(u);
  if (event) text += `\n\n🌍 رویداد: ${event.event.name}!\n${event.msg}`;
  
  saveDB(db);
  ctx.editMessageText(text, backMenu());
});

bot.action('missions', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.editMessageText(missionsText(u), backMenu());
});

bot.action('claim_missions', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const claimed = claimAvailableMissions(u);
  saveDB(db);
  ctx.editMessageText(claimed || '❌ هیچ ماموریت آماده تحویلی نداری', backMenu());
});

bot.action('fight_menu', (ctx) => {
  ctx.editMessageText('⚔️ بخش مبارزه - نوع حریف رو انتخاب کن:', Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات وحشی', 'fight_type_animal')],
    [Markup.button.callback('👹 دیوها', 'fight_type_demon')],
    [Markup.button.callback('🦌 شکار', 'fight_type_prey')],
    [Markup.button.callback('🎲 رندوم', 'fight_type_random')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action('boss_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const buttons = BOSSES.map(boss => [
    Markup.button.callback(
      `${boss.name} (حداقل لول ${boss.minLevel})`, 
      `fight_boss_${BOSSES.indexOf(boss)}`
    )
  ]);
  buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  
  ctx.editMessageText('👹 باس‌های افسانه‌ای:\n\nاین موجودات قدرتمند آیتم‌های خاصی دارن!', Markup.inlineKeyboard(buttons));
});

bot.action(/fight_type_(.+)/, (ctx) => {
  const type = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  updateHunger(u);

  if (u.hp <= 0) {
    return ctx.editMessageText('❌ HP شما صفر است. اول درمان کن.', backMenu());
  }
  if (u.hunger <= 10) {
    return ctx.editMessageText('❌ خیلی گرسنه‌ای! اول غذا بخور.', backMenu());
  }

  let pool;
  if (type === 'animal') pool = ANIMALS;
  else if (type === 'demon') pool = DEMONS;
  else if (type === 'prey') pool = PREYS;
  else pool = [...ANIMALS, ...DEMONS, ...PREYS];

  const enemy = pool[rnd(0, pool.length - 1)];
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const playerPower = u.playerLevel * 4 + weapon.power;

  u.pendingFight = enemy;
  saveDB(db);

  const enemyInfo = [
    `⚔️ حریف پیدا شد: ${enemy.name}`,
    `💪 قدرت تقریبی دشمن: ${enemy.power}`,
    `❤️ آسیب احتمالی: ${enemy.hpLoss[0]}-${enemy.hpLoss[1]}`,
    `🎁 غنیمت: ${rewardText(enemy.rewards)}`,
    '',
    `⚔️ قدرت شما: ${playerPower}`,
    `🛡️ شانس برد تقریبی: ${clamp(50 + (playerPower - enemy.power) * 4, 10, 90)}%`,
    '',
    `آماده‌ای مبارزه کنی؟`
  ].join('\n');

  ctx.editMessageText(enemyInfo, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
    [Markup.button.callback('🏃 فرار', 'fight_menu')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action(/fight_boss_(.+)/, (ctx) => {
  const index = parseInt(ctx.match[1]);
  const boss = BOSSES[index];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  updateHunger(u);

  if (!boss) return ctx.answerCbQuery('❌ باس یافت نشد');
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر است');
  if (u.playerLevel < boss.minLevel) return ctx.answerCbQuery(`❌ حداقل لول لازم: ${boss.minLevel}`);

  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const playerPower = u.playerLevel * 4 + weapon.power;

  u.pendingFight = boss;
  saveDB(db);

  const bossInfo = [
    `👹 ${boss.name}`,
    `💪 قدرت: ${boss.power}`,
    `❤️ آسیب: ${boss.hpLoss[0]}-${boss.hpLoss[1]}`,
    `🎁 غنیمت: ${rewardText(boss.rewards)}`,
    '',
    `⚔️ قدرت شما: ${playerPower}`,
    `🛡️ شانس برد تقریبی: ${clamp(50 + (playerPower - boss.power) * 4, 5, 80)}%`,
    '',
    `⚠️ این نبرد خطرناکه! آماده‌ای؟`
  ].join('\n');

  ctx.editMessageText(bossInfo, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
    [Markup.button.callback('🏃 فرار', 'boss_menu')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action('fight_confirm', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  updateHunger(u);

  if (!u.pendingFight) {
    return ctx.editMessageText('❌ حریفی برای مبارزه نیست. دوباره تلاش کن.', backMenu());
  }

  const enemy = u.pendingFight;
  u.pendingFight = null;
  
  const result = executeCombat(u, enemy);
  saveDB(db);
  ctx.editMessageText(result.text, backMenu());
});

bot.action('home', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.editMessageText(homeText(u), Markup.inlineKeyboard([
    [Markup.button.callback('⬆️ ارتقای خانه', 'upgrade_home_btn')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action('upgrade_home_btn', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const nextLevel = u.homeLevel + 1;
  const cost = HOME_UPGRADES[nextLevel];
  if (!cost) return ctx.answerCbQuery('🏠 به حداکثر سطح رسیدی');
  if (u.playerLevel < cost.needPlayerLevel) return ctx.answerCbQuery(`❌ لول لازم: ${cost.needPlayerLevel}`);
  if (!hasResources(u, cost)) return ctx.answerCbQuery('❌ منابع کافی نیست');
  takeResources(u, cost);
  u.homeLevel = nextLevel;
  bumpAction(u, 'home_upgrade', 1);
  saveDB(db);
  ctx.editMessageText(`🏠 خانه به لول ${u.homeLevel} ارتقا یافت`, backMenu());
});

bot.action('clinic', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 درمانگاه قفل است');
  ctx.editMessageText(clinicText(u), backMenu());
});

bot.action('shop', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 فروشگاه بعد از خانه لول 2 باز می‌شود');
  ctx.editMessageText('🛒 فروشگاه بقا - انتخاب دسته:', shopCategoryKeyboard());
});

bot.action('shop_categories', (ctx) => {
  ctx.editMessageText('🛒 فروشگاه بقا - انتخاب دسته:', shopCategoryKeyboard());
});

bot.action(/shop_cat_(.+)/, (ctx) => {
  const category = ctx.match[1];
  ctx.editMessageText(`🛒 فروشگاه - بخش ${category}:`, shopItemsKeyboard(category, 0));
});

bot.action(/shop_page_(.+)_(.+)/, (ctx) => {
  const category = ctx.match[1];
  const page = parseInt(ctx.match[2]);
  ctx.editMessageText(`🛒 فروشگاه - بخش ${category}:`, shopItemsKeyboard(category, page));
});

bot.action(/shop_buy_(.+)_(.+)/, (ctx) => {
  const itemKey = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const item = SHOP_BUY[itemKey];
  if (!item) return ctx.answerCbQuery('❌ کالا یافت نشد');

  ctx.editMessageText(
    `🛒 ${item.name} - قیمت هر واحد: ${item.price} طلا\nتعداد مورد نظر رو انتخاب کن:`,
    shopBuyAmountKeyboard(itemKey, amount)
  );
});

bot.action(/shop_set_amount_(.+)_(.+)/, (ctx) => {
  const itemKey = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const item = SHOP_BUY[itemKey];
  if (!item) return ctx.answerCbQuery('❌ کالا یافت نشد');

  ctx.editMessageText(
    `🛒 ${item.name} - قیمت هر واحد: ${item.price} طلا\nتعداد مورد نظر رو انتخاب کن:`,
    shopBuyAmountKeyboard(itemKey, amount)
  );
});

bot.action(/shop_confirm_buy_(.+)_(.+)/, (ctx) => {
  const itemKey = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const item = SHOP_BUY[itemKey];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');

  if (!item) return ctx.answerCbQuery('❌ کالا یافت نشد');
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 فروشگاه قفل است');

  const total = item.price * amount;
  if (u.resources.gold < total) return ctx.answerCbQuery(`❌ طلای کافی نداری! نیاز: ${total} طلا`);

  addResource(u, 'gold', -total);
  if (item.type === 'resource') addResource(u, item.key, amount);
  if (item.type === 'item' || item.type === 'food' || item.type === 'special') addItem(u, item.key, amount);
  if (item.type === 'weapon') {
    u.weaponsOwned[item.key] = true;
    bumpAction(u, 'get_weapon', 1);
  }
  bumpAction(u, 'buy', 1);
  saveDB(db);

  ctx.answerCbQuery(`✅ ${amount} عدد ${item.name} خریدی!`);
  ctx.editMessageText(
    `✅ خرید موفق!\n📦 ${amount} عدد ${item.name} اضافه شد.\n💰 طلا: ${u.resources.gold}`,
    backMenu()
  );
});

bot.action('shop_sell_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 فروشگاه قفل است');
  ctx.editMessageText('💰 فروشگاه - انتخاب برای فروش:', shopSellKeyboard(u));
});

bot.action(/shop_sell_select_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');

  if (RES_LABELS[key]) {
    const amount = u.resources[key] || 0;
    if (amount <= 0) return ctx.answerCbQuery('❌ چیزی برای فروش نداری');
    const price = Math.max(1, Math.floor((SHOP_BUY[key]?.price || 5) / 2));
    
    ctx.editMessageText(
      `💰 فروش ${RES_LABELS[key]}\n📦 موجودی: ${amount}\n💵 قیمت هر واحد: ${price} طلا\nتعداد رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [1, 5, 10, 25].map(a => Markup.button.callback(`${a} عدد`, `shop_sell_confirm_${key}_${Math.min(a, amount)}`) ),
        [Markup.button.callback('فروش همه', `shop_sell_confirm_${key}_${amount}`)],
        [Markup.button.callback('🔙 بازگشت', 'shop_sell_menu')]
      ])
    );
  } else {
    const amount = u.items[key] || 0;
    if (amount <= 0) return ctx.answerCbQuery('❌ چیزی برای فروش نداری');
    const base = HEAL_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || FOOD_ITEMS[key]?.sell || 10;
    
    ctx.editMessageText(
      `💰 فروش ${HEAL_ITEMS[key]?.name || SPECIAL_ITEMS[key]?.name || FOOD_ITEMS[key]?.name || key}\n📦 موجودی: ${amount}\n💵 قیمت هر واحد: ${base} طلا\nتعداد رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [1, 5, 10, 25].map(a => Markup.button.callback(`${a} عدد`, `shop_sell_confirm_${key}_${Math.min(a, amount)}`) ),
        [Markup.button.callback('فروش همه', `shop_sell_confirm_${key}_${amount}`)],
        [Markup.button.callback('🔙 بازگشت', 'shop_sell_menu')]
      ])
    );
  }
});

bot.action(/shop_sell_confirm_(.+)_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');

  if (amount <= 0) return ctx.answerCbQuery('❌ تعداد نامعتبر');

  if (RES_LABELS[key] && key !== 'gold') {
    if ((u.resources[key] || 0) < amount) return ctx.answerCbQuery('❌ به این مقدار نداری');
    const price = Math.max(1, Math.floor((SHOP_BUY[key]?.price || 5) / 2));
    addResource(u, key, -amount);
    addResource(u, 'gold', price * amount);
    bumpAction(u, 'sell', 1);
    saveDB(db);
    return ctx.editMessageText(`✅ فروخته شد\n${amount} ${RES_LABELS[key]} => ${price * amount} طلا`, backMenu());
  }

  if (u.items[key] >= amount) {
    const base = HEAL_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || FOOD_ITEMS[key]?.sell || Math.max(1, Math.floor((SHOP_BUY[key]?.price || 10) / 2));
    addItem(u, key, -amount);
    addResource(u, 'gold', base * amount);
    bumpAction(u, 'sell', 1);
    saveDB(db);
    return ctx.editMessageText(`✅ فروخته شد\n${amount} عدد => ${base * amount} طلا`, backMenu());
  }

  ctx.answerCbQuery('❌ خطا در فروش');
});

bot.action(/shop_sell_weapon_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!u.weaponsOwned[key] || key === 'none') return ctx.answerCbQuery('❌ این سلاح رو نداری');
  
  const base = WEAPONS[key]?.sell || 10;
  delete u.weaponsOwned[key];
  if (u.weapon === key) u.weapon = 'none';
  addResource(u, 'gold', base);
  bumpAction(u, 'sell', 1);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${WEAPONS[key].name} فروخته شد`);
  ctx.editMessageText(`✅ ${WEAPONS[key].name} فروخته شد => ${base} طلا`, backMenu());
});

bot.action('shop_nothing', (ctx) => {
  ctx.answerCbQuery('❌ چیزی برای فروش نداری');
});

// ==================== اسلحه‌خانه ====================
bot.action('armory', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 اسلحه‌خانه بعد از خانه لول 2 باز می‌شود');
  ctx.editMessageText('🛠️ اسلحه‌خانه - ساخت و تجهیز سلاح:', armoryMainKeyboard(u));
});

bot.action(/armory_craft_(.+)/, (ctx) => {
  const weaponKey = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 اسلحه‌خانه قفل است');
  
  const recipe = ARMORY_RECIPES[weaponKey];
  if (!recipe || !WEAPONS[weaponKey]) return ctx.answerCbQuery('❌ سلاح نامعتبر');
  if (u.weaponsOwned[weaponKey]) return ctx.answerCbQuery('✅ این سلاح رو داری');
  if (u.playerLevel < (recipe.minLevel || 0)) return ctx.answerCbQuery(`❌ حداقل لول لازم: ${recipe.minLevel}`);
  
  // Apply crafting skill discount
  const craftingBonus = (u.skills.crafting || 0) * SKILLS.crafting.effect;
  const discountedCost = {};
  for (const [k, v] of Object.entries(recipe)) {
    if (k === 'minLevel') continue;
    discountedCost[k] = Math.floor(v * (1 - craftingBonus));
  }
  
  if (!hasResources(u, discountedCost)) return ctx.answerCbQuery(`❌ منابع کافی نیست\n${formatCost(discountedCost)}`);
  
  takeResources(u, discountedCost);
  u.weaponsOwned[weaponKey] = true;
  bumpAction(u, 'get_weapon', 1);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${WEAPONS[weaponKey].name} ساخته شد!`);
  ctx.editMessageText(
    `✅ ${WEAPONS[weaponKey].name} با موفقیت ساخته شد!\n${craftingBonus > 0 ? `🔨 تخفیف صنعتگری: ${Math.floor(craftingBonus * 100)}%` : ''}`,
    armoryMainKeyboard(u)
  );
});

bot.action(/armory_equip_(.+)/, (ctx) => {
  const weaponKey = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!u.weaponsOwned[weaponKey]) return ctx.answerCbQuery('❌ این سلاح رو نداری');
  if (u.playerLevel < (WEAPONS[weaponKey]?.level || 0)) return ctx.answerCbQuery(`❌ حداقل لول لازم: ${WEAPONS[weaponKey]?.level}`);
  
  u.weapon = weaponKey;
  saveDB(db);
  
  ctx.answerCbQuery(`⚔️ ${WEAPONS[weaponKey].name} تجهیز شد`);
  ctx.editMessageText(
    `⚔️ ${WEAPONS[weaponKey].name} با موفقیت تجهیز شد!`,
    armoryMainKeyboard(u)
  );
});

bot.action('armory_nothing', (ctx) => {
  ctx.answerCbQuery('⚔️ یکی از سلاح‌ها رو برای تجهیز انتخاب کن');
});

// ==================== خوردن و آشامیدن ====================
bot.action(/eat_(.+)/, (ctx) => {
  const foodKey = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (foodKey === 'soup') {
    const item = HEAL_ITEMS.soup;
    if ((u.items.soup || 0) < 1) return ctx.answerCbQuery('❌ سوپ نداری');
    addItem(u, 'soup', -1);
    u.hunger = Math.min(u.maxHunger, u.hunger + (item.hunger || 20));
    u.hp = Math.min(u.maxHp, u.hp + item.heal);
    saveDB(db);
    return ctx.answerCbQuery('✅ سوپ خورده شد');
  }
  
  const food = FOOD_ITEMS[foodKey];
  if (!food) return ctx.answerCbQuery('❌ غذا یافت نشد');
  if ((u.items[foodKey] || 0) < 1) return ctx.answerCbQuery(`❌ ${food.name} نداری`);
  
  addItem(u, foodKey, -1);
  u.hunger = Math.min(u.maxHunger, u.hunger + food.hunger);
  if (food.thirst) u.thirst = Math.max(0, u.thirst + food.thirst);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${food.name} خورده شد`);
});

bot.action(/drink_(.+)/, (ctx) => {
  const drinkKey = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  const drink = FOOD_ITEMS[drinkKey];
  if (!drink) return ctx.answerCbQuery('❌ نوشیدنی یافت نشد');
  if ((u.items[drinkKey] || 0) < 1) return ctx.answerCbQuery(`❌ ${drink.name} نداری`);
  
  addItem(u, drinkKey, -1);
  u.thirst = Math.min(u.maxThirst, u.thirst + drink.thirst);
  if (drink.hunger) u.hunger = Math.min(u.maxHunger, u.hunger + drink.hunger);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${drink.name} نوشیده شد`);
});

// ==================== آرامگاه ====================
bot.action('aramgah', async (ctx) => {
  await ctx.answerCbQuery();
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'pray_dua')],
    [Markup.button.callback('🧎 نماز', 'pray_namaz')],
    [Markup.button.callback('📖 روضه', 'pray_rozeh')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
  return ctx.reply('🕯️ به آرامگاه خوش آمدید:', keyboard);
});

bot.action(['pray_dua', 'pray_namaz', 'pray_rozeh'], async (ctx) => {
  try {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    
    if (u.daily.prayUsed) {
      return ctx.answerCbQuery('❌ امروز از آرامگاه استفاده کردی');
    }

    const xpGain = (u.playerLevel <= 3) ? 60 : 30;
    const ups = addXP(u, xpGain);
    u.daily.prayUsed = true;
    saveDB(db);

    const prayNames = { pray_dua: 'دعا', pray_namaz: 'نماز', pray_rozeh: 'روضه' };
    const prayName = prayNames[ctx.match[0]] || 'عبادت';

    await ctx.answerCbQuery(`+${xpGain} XP`);
    return ctx.reply(`✅ ${prayName} قبول باشه!\n✨ ${xpGain} XP گرفتی.\n🎚️ لول: ${u.playerLevel} | XP: ${u.playerXP}/30${ups ? `\n🎉 ${ups} لول افزایش یافت!` : ''}`, backMenu());
  } catch (e) {
    console.error('Pray error:', e);
    return ctx.answerCbQuery('❌ خطا پیش اومد');
  }
});

// ==================== کلن ====================
bot.action('clan', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 3) return ctx.answerCbQuery('🔒 کلن بعد از خانه لول 3 باز می‌شود');
  
  ctx.editMessageText(
    clanText(u),
    Markup.inlineKeyboard([
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  );
});

// ==================== راهنما ====================
bot.action('guide', (ctx) => {
  ctx.editMessageText(guideText(), backMenu());
});

// ==================== مهارت‌ها ====================
bot.action('skills', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.editMessageText(
    `⭐ مهارت‌های شما:\n\n` +
    `⛏️ جمع‌آوری: ${u.skills.gathering}/10 - شانس منابع بیشتر\n` +
    `🏹 شکار: ${u.skills.hunting}/10 - قدرت بیشتر در نبرد\n` +
    `🔨 صنعتگری: ${u.skills.crafting}/10 - کاهش هزینه ساخت\n` +
    `🏕️ بقا: ${u.skills.survival}/10 - کاهش گرسنگی و تشنگی\n\n` +
    `📊 امتیاز مهارت: ${u.skillPoints || 0}\n` +
    `برای ارتقا دکمه زیر رو بزن:`,
    skillsKeyboard(u)
  );
});

bot.action(/skill_(.+)/, (ctx) => {
  const skillName = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!SKILLS[skillName]) return ctx.answerCbQuery('❌ مهارت نامعتبر');
  if ((u.skillPoints || 0) <= 0) return ctx.answerCbQuery('❌ امتیاز مهارت نداری');
  if ((u.skills[skillName] || 0) >= SKILLS[skillName].maxLevel) return ctx.answerCbQuery('❌ به حداکثر رسیده');
  
  u.skills[skillName] = (u.skills[skillName] || 0) + 1;
  u.skillPoints -= 1;
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${SKILLS[skillName].name} ارتقا یافت!`);
  ctx.editMessageText(
    `⭐ مهارت‌های شما:\n\n` +
    `⛏️ جمع‌آوری: ${u.skills.gathering}/10\n` +
    `🏹 شکار: ${u.skills.hunting}/10\n` +
    `🔨 صنعتگری: ${u.skills.crafting}/10\n` +
    `🏕️ بقا: ${u.skills.survival}/10\n\n` +
    `📊 امتیاز مهارت: ${u.skillPoints || 0}`,
    skillsKeyboard(u)
  );
});

bot.action('back_main', (ctx) => {
  ctx.editMessageText('🏕️ منوی اصلی:', mainMenu());
});

// ==================== دستورات ادمین ====================
bot.command('admin_give', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Admin only');
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  const type = args[2];
  const key = args[3];
  const amount = Number(args[4] || 0);

  if (!targetId || !type || !key || !amount) {
    return ctx.reply('Usage: /admin_give userId type key amount\nTypes: resource, item, weapon, xp, hp, hunger, thirst');
  }

  const u = ensureUser(targetId, '');
  if (type === 'resource') addResource(u, key, amount);
  else if (type === 'item') addItem(u, key, amount);
  else if (type === 'weapon') u.weaponsOwned[key] = true;
  else if (type === 'xp') addXP(u, amount);
  else if (type === 'hp') u.hp = Math.min(u.maxHp, u.hp + amount);
  else if (type === 'hunger') u.hunger = Math.min(u.maxHunger, u.hunger + amount);
  else if (type === 'thirst') u.thirst = Math.min(u.maxThirst, u.thirst + amount);
  else return ctx.reply('Invalid type');

  saveDB(db);
  ctx.reply('✅ Done');
});

bot.command('admin_full', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Admin only');
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('Usage: /admin_full userId');

  const u = ensureUser(targetId, '');
  for (const k of RES_KEYS) addResource(u, k, 9999);
  for (const k of [...Object.keys(HEAL_ITEMS), ...Object.keys(FOOD_ITEMS), ...Object.keys(SPECIAL_ITEMS)]) addItem(u, k, 99);
  for (const k of Object.keys(WEAPONS)) u.weaponsOwned[k] = true;
  u.weapon = 'bow';
  u.playerLevel = 20;
  u.playerXP = 0;
  u.maxHp = 500;
  u.hp = 500;
  u.maxHunger = 200;
  u.hunger = 200;
  u.maxThirst = 200;
  u.thirst = 200;
  u.homeLevel = 5;
  u.skillPoints = 40;
  for (const k of Object.keys(SKILLS)) u.skills[k] = 10;

  saveDB(db);
  ctx.reply('✅ User maxed out');
});

bot.command('admin_help', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ Admin only');
  ctx.reply(
    '👑 Admin Commands:\n\n' +
    '/admin_give [id] [type] [key] [amount]\n' +
    'Types: resource, item, weapon, xp, hp, hunger, thirst\n\n' +
    '/admin_full [id] - Max out user\n\n' +
    'Resource keys: wood, stone, metal, iron, gold, toman\n' +
    'Item keys: bandage, medkit, soup, herb, elixir, bread, meat, fish, water, juice, gem, map, fuel, dragon_scale, phoenix_feather\n' +
    'Weapon keys: stick, knife, pistol, axe, rifle, sword, bow'
  );
});

// ==================== هندلر متن ====================
bot.on('text', (ctx) => {
  const text = ctx.message.text.trim();
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  updateHunger(u);

  if (text === 'وضعیت') return ctx.reply(statusText(u), backMenu());
  if (text === 'ماموریت‌ها') return ctx.reply(missionsText(u), backMenu());
  if (text === 'تحویل ماموریت') {
    const claimed = claimAvailableMissions(u);
    saveDB(db);
    return ctx.reply(claimed || '❌ هیچ ماموریت آماده تحویلی نداری', backMenu());
  }
  if (text === 'خانه') return ctx.reply(homeText(u), backMenu());
  if (text === 'درمانگاه') {
    if (u.homeLevel < 2) return ctx.reply('🔒 درمانگاه قفل است', backMenu());
    return ctx.reply(clinicText(u), backMenu());
  }
  if (text === 'فروشگاه') {
    if (u.homeLevel < 2) return ctx.reply('🔒 فروشگاه قفل است', backMenu());
    return ctx.reply('🛒 فروشگاه بقا - انتخاب دسته:', shopCategoryKeyboard());
  }
  if (text === 'اسلحه خانه' || text === 'اسلحه‌خانه') {
    if (u.homeLevel < 2) return ctx.reply('🔒 اسلحه‌خانه قفل است', backMenu());
    return ctx.reply('🛠️ اسلحه‌خانه - ساخت و تجهیز سلاح:', armoryMainKeyboard(u));
  }
  if (text === 'جستجو') {
    const found = performGather(u);
    saveDB(db);
    return ctx.reply(`🪓 جستجو انجام شد\n🎁 ${rewardText(found)}`, backMenu());
  }
  if (text === 'مبارزه') {
    if (u.hp <= 0) return ctx.reply('❌ HP شما صفر است. اول درمان کن.', backMenu());
    if (u.hunger <= 10) return ctx.reply('❌ خیلی گرسنه‌ای! اول غذا بخور.', backMenu());
    return ctx.reply('⚔️ بخش مبارزه - نوع حریف رو انتخاب کن:', Markup.inlineKeyboard([
      [Markup.button.callback('🐺 حیوانات وحشی', 'fight_type_animal')],
      [Markup.button.callback('👹 دیوها', 'fight_type_demon')],
      [Markup.button.callback('🦌 شکار', 'fight_type_prey')],
      [Markup.button.callback('🎲 رندوم', 'fight_type_random')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
  }
  if (text === 'راهنما') return ctx.reply(guideText(), backMenu());
});

// ==================== مدیریت خطا ====================
bot.catch((err, ctx) => {
  console.error('BOT ERROR:', err);
  try {
    ctx.reply('❌ یه خطا رخ داد. لطفاً دوباره تلاش کن.');
  } catch {}
});

// ==================== اجرای ربات ====================
bot.launch({
  dropPendingUpdates: true,
}).then(() => {
  console.log('✅ ربات بقا با موفقیت اجرا شد!');
  console.log('🎮 سیستم‌های فعال:');
  console.log('  - گرسنگی و تشنگی');
  console.log('  - مهارت‌ها (4 نوع)');
  console.log('  - کلن (قبیله)');
  console.log('  - باس‌های افسانه‌ای');
  console.log('  - رویدادهای تصادفی');
  console.log('  - اسلحه‌خانه با سلاح‌های خاص');
  console.log('  - صنعتگری با تخفیف');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ==================== فانکشن‌های کمکی منو ====================
function shopCategoryKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📦 منابع', 'shop_cat_resource'), Markup.button.callback('🍽️ غذا و نوشیدنی', 'shop_cat_food')],
    [Markup.button.callback('🧰 آیتم‌ها', 'shop_cat_item'), Markup.button.callback('💎 ویژه', 'shop_cat_special')],
    [Markup.button.callback('⚔️ سلاح‌ها', 'shop_cat_weapon'), Markup.button.callback('💰 فروش', 'shop_sell_menu')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
}

function shopItemsKeyboard(category, page = 0) {
  const items = Object.entries(SHOP_BUY).filter(([k, v]) => {
    if (category === 'resource') return v.type === 'resource';
    if (category === 'item') return v.type === 'item';
    if (category === 'weapon') return v.type === 'weapon';
    if (category === 'special') return v.type === 'special';
    if (category === 'food') return v.type === 'food';
    return false;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const start = page * itemsPerPage;
  const pageItems = items.slice(start, start + itemsPerPage);

  const buttons = pageItems.map(([k, v]) => {
    const emoji = v.type === 'resource' ? RES_EMOJI[k] || '' : '';
    return [Markup.button.callback(`${emoji} ${v.name} - ${v.price} طلا`, `shop_buy_${k}_1`)];
  });

  const navButtons = [];
  if (page > 0) navButtons.push(Markup.button.callback('⬅️ قبلی', `shop_page_${category}_${page - 1}`));
  navButtons.push(Markup.button.callback('🔙 دسته‌بندی', 'shop_categories'));
  if (page < totalPages - 1) navButtons.push(Markup.button.callback('بعدی ➡️', `shop_page_${category}_${page + 1}`));

  if (navButtons.length > 0) buttons.push(navButtons);

  return Markup.inlineKeyboard(buttons);
}

function shopBuyAmountKeyboard(itemKey, amount = 1) {
  const item = SHOP_BUY[itemKey];
  if (!item) return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'shop_categories')]]);

  const amounts = [1, 5, 10, 50];
  const totalPrice = item.price * amount;

  return Markup.inlineKeyboard([
    ...amounts.map(a => [Markup.button.callback(
      `${a} عدد - ${item.price * a} طلا ${amount === a ? '✅' : ''}`, 
      `shop_set_amount_${itemKey}_${a}`
    )]),
    [Markup.button.callback(`🛒 خرید ${amount} عدد (${totalPrice} طلا)`, `shop_confirm_buy_${itemKey}_${amount}`)],
    [Markup.button.callback('🔙 بازگشت', 'shop_categories')]
  ]);
}

function shopSellKeyboard(u) {
  const buttons = [];

  for (const k of RES_KEYS) {
    if (k === 'gold') continue;
    if (u.resources[k] > 0) {
      buttons.push([Markup.button.callback(
        `${RES_EMOJI[k]} ${RES_LABELS[k]}: ${u.resources[k]} عدد`, 
        `shop_sell_select_${k}`
      )]);
    }
  }

  for (const [k, v] of Object.entries({...HEAL_ITEMS, ...FOOD_ITEMS, ...SPECIAL_ITEMS})) {
    if (u.items[k] > 0) {
      buttons.push([Markup.button.callback(
        `${v.name}: ${u.items[k]} عدد`, 
        `shop_sell_select_${k}`
      )]);
    }
  }

  for (const k of Object.keys(u.weaponsOwned)) {
    if (k !== 'none' && u.weaponsOwned[k]) {
      const weapon = WEAPONS[k];
      if (weapon) {
        buttons.push([Markup.button.callback(
          `${weapon.name} (فروش: ${weapon.sell} طلا)`, 
          `shop_sell_weapon_${k}`
        )]);
      }
    }
  }

  if (buttons.length === 0) {
    buttons.push([Markup.button.callback('❌ چیزی برای فروش نداری', 'shop_nothing')]);
  }

  buttons.push([Markup.button.callback('🔙 بازگشت', 'shop_categories')]);
  return Markup.inlineKeyboard(buttons);
}

function armoryMainKeyboard(u) {
  const buttons = [];
  
  for (const [k, c] of Object.entries(ARMORY_RECIPES)) {
    const weapon = WEAPONS[k];
    if (!weapon) continue;
    const owned = u.weaponsOwned[k];
    const canCraft = u.playerLevel >= (c.minLevel || 0);
    buttons.push([Markup.button.callback(
      `${owned ? '✅' : canCraft ? '🔨' : '🔒'} ساخت ${weapon.name} ${!canCraft ? `(لول ${c.minLevel})` : ''}`, 
      `armory_craft_${k}`
    )]);
  }

  const equipButtons = [];
  for (const k of Object.keys(u.weaponsOwned)) {
    if (k === 'none') continue;
    if (u.weaponsOwned[k]) {
      const weapon = WEAPONS[k];
      if (weapon) {
        const canEquip = u.playerLevel >= weapon.level;
        equipButtons.push(Markup.button.callback(
          `${u.weapon === k ? '⚔️' : canEquip ? '🔸' : '🔒'} ${weapon.name}${u.weapon === k ? ' (فعال)' : ''}${!canEquip ? ` (لول ${weapon.level})` : ''}`, 
          `armory_equip_${k}`
        ));
      }
    }
  }
  
  if (equipButtons.length > 0) {
    buttons.push([Markup.button.callback('⚔️ تجهیز سلاح:', 'armory_nothing')]);
    for (let i = 0; i < equipButtons.length; i += 2) {
      buttons.push(equipButtons.slice(i, i + 2));
    }
  }

  buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  return Markup.inlineKeyboard(buttons);
}

function homeText(u) {
  const next = HOME_UPGRADES[u.homeLevel + 1];
  let nextText = '🏠 به حداکثر سطح رسیدی';
  if (next) {
    nextText = `⬆️ ارتقا به لول ${u.homeLevel + 1}\n📋 نیاز: ${formatCost(next)}\n🎚️ لول بازیکن لازم: ${next.needPlayerLevel}`;
  }
  return [
    `🏠 خانه`,
    `📊 سطح فعلی: ${u.homeLevel}`,
    '',
    nextText,
    '',
    `برای ارتقا: /upgrade_home`,
    `امکانات فعلی:`,
    getFacilities(u)
  ].join('\n');
}

function missionsText(u) {
  refreshDaily(u);
  const lines = ['📜 ماموریت‌های روزانه:'];
  if (!u.daily.missions.length) {
    lines.push('', '❌ ماموریتی موجود نیست');
  }
  for (const d of u.daily.missions) {
    const m = missionById(d.id);
    if (!m) continue;
    const prog = u.daily.progress[m.id] || 0;
    const done = isMissionDone(u, m);
    lines.push(
      ``,
      `#${m.id} ${m.title}`,
      `📝 ${m.desc}`,
      `📈 پیشرفت: ${Math.min(prog, m.targetAmount)}/${m.targetAmount}`,
      `🎁 جایزه: ${rewardText(m.rewards)}`,
      `📌 وضعیت: ${d.claimed ? '✅ تحویل شده' : done ? '🎯 آماده تحویل' : '⏳ در حال انجام'}`
    );
  }
  return lines.join('\n');
}

function clinicText(u) {
  return [
    `🏥 درمانگاه`,
    `❤️ HP فعلی: ${u.hp}/${u.maxHp}`,
    `💊 درمان رایگان روزانه: ${u.daily.freeHealUsed ? '❌ استفاده شده' : '✅ آماده'}`,
    '',
    `دستورها:`,
    `/heal free - درمان رایگان (30HP)`,
    `/heal gold - درمان کامل (20 طلا)`,
    `/use <bandage|medkit|soup|herb|elixir> - استفاده از آیتم`
  ].join('\n');
}

console.log('📦 کد کامل ربات بقا آماده اجراست!');