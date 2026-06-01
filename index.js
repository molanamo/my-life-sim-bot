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
      return { users: {} };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.log('خطای لود دیتابیس:', e);
    return { users: {} };
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
  none: { name: 'بدون سلاح', power: 0, price: 0, sell: 0 },
  stick: { name: '🪵 چوب', power: 2, price: 20, sell: 10 },
  knife: { name: '🔪 چاقو', power: 5, price: 80, sell: 40 },
  pistol: { name: '🔫 تپانچه', power: 10, price: 220, sell: 110 },
  rifle: { name: '🔫 تفنگ', power: 18, price: 500, sell: 250 },
  axe: { name: '🪓 تیر غیب', power: 14, price: 350, sell: 175 }
};

const HEAL_ITEMS = {
  bandage: { name: '🩹 باند', heal: 15, price: 25, sell: 12 },
  medkit: { name: '💊 جعبه کمک', heal: 40, price: 80, sell: 40 },
  soup: { name: '🍲 سوپ گرم', heal: 10, price: 18, sell: 9 },
  herb: { name: '🌿 گیاه درمانی', heal: 20, price: 35, sell: 17 }
};

const SPECIAL_ITEMS = {
  gem: { name: '💎 سنگ قیمتی', price: 120, sell: 60 },
  map: { name: '🗺️ نقشه کهنه', price: 90, sell: 45 },
  fuel: { name: '⛽ سوخت', price: 75, sell: 35 }
};

const SHOP_BUY = {
  wood: { type: 'resource', key: 'wood', name: 'چوب', price: 8 },
  stone: { type: 'resource', key: 'stone', name: 'سنگ', price: 10 },
  metal: { type: 'resource', key: 'metal', name: 'فلز', price: 18 },
  iron: { type: 'resource', key: 'iron', name: 'آهن', price: 25 },
  bandage: { type: 'item', key: 'bandage', name: 'باند', price: 25 },
  medkit: { type: 'item', key: 'medkit', name: 'جعبه کمک', price: 80 },
  soup: { type: 'item', key: 'soup', name: 'سوپ گرم', price: 18 },
  herb: { type: 'item', key: 'herb', name: 'گیاه درمانی', price: 35 },
  stick: { type: 'weapon', key: 'stick', name: 'چوب', price: 20 },
  knife: { type: 'weapon', key: 'knife', name: 'چاقو', price: 80 },
  pistol: { type: 'weapon', key: 'pistol', name: 'تپانچه', price: 220 },
  rifle: { type: 'weapon', key: 'rifle', name: 'تفنگ', price: 500 },
  axe: { type: 'weapon', key: 'axe', name: 'تیر غیب', price: 350 },
  gem: { type: 'special', key: 'gem', name: 'سنگ قیمتی', price: 120 },
  map: { type: 'special', key: 'map', name: 'نقشه کهنه', price: 90 },
  fuel: { type: 'special', key: 'fuel', name: 'سوخت', price: 75 }
};

const HOME_UPGRADES = {
  2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, needPlayerLevel: 3 },
  3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, needPlayerLevel: 5 },
  4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, needPlayerLevel: 8 }
};

const ARMORY_RECIPES = {
  pistol: { wood: 2, metal: 8, iron: 4, gold: 60 },
  rifle: { wood: 4, metal: 14, iron: 10, gold: 130 },
  axe: { wood: 5, metal: 10, iron: 6, gold: 80 },
  knife: { metal: 4, iron: 2, gold: 20 }
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
  { id: 20, title: 'روز سخت', desc: '2 دیو را شکست بده', targetType: 'action', targetKey: 'demon_win', targetAmount: 2, rewards: { xp: 25, gold: 55, iron: 5, toman: 3, gem: 1 } }
];

// ==================== دشمنان ====================
const ANIMALS = [
  { name: '🐺 گرگ', power: 8, hpLoss: [8, 16], rewards: { gold: 10, wood: 1 } },
  { name: '🐗 گراز', power: 10, hpLoss: [9, 18], rewards: { gold: 12, stone: 1 } },
  { name: '🦊 کفتار', power: 12, hpLoss: [10, 20], rewards: { gold: 15, metal: 1 } },
  { name: '🐻 خرس', power: 16, hpLoss: [14, 28], rewards: { gold: 20, iron: 1 } }
];

const DEMONS = [
  { name: '👹 دیو سرخ', power: 16, hpLoss: [18, 35], rewards: { gold: 28, iron: 2, metal: 2 } },
  { name: '👺 دیو سنگی', power: 22, hpLoss: [22, 40], rewards: { gold: 40, iron: 3, toman: 1 } },
  { name: '👾 دیو بزرگ', power: 28, hpLoss: [25, 48], rewards: { gold: 55, iron: 4, toman: 1, gem: 1 } }
];

const PREYS = [
  { name: '🦌 آهو', power: 3, hpLoss: [2, 5], rewards: { gold: 5, wood: 1 } },
  { name: '🐑 گوسفند وحشی', power: 4, hpLoss: [3, 7], rewards: { gold: 6, stone: 1 } },
  { name: '🦃 بوقلمون', power: 2, hpLoss: [1, 3], rewards: { gold: 4, wood: 1 } },
  { name: '🐇 خرگوش', power: 1, hpLoss: [0, 2], rewards: { gold: 3, wood: 1 } }
];

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
      homeLevel: 1,
      clinicBuilt: false,
      shopBuilt: false,
      armoryBuilt: false,
      weapon: 'none',
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
        gem: 0,
        map: 0,
        fuel: 0
      },
      weaponsOwned: {
        none: true
      },
      daily: {
        key: todayKey(),
        missions: [],
        progress: {},
        freeHealUsed: false,
        prayUsed: false
      },
      stats: {
        gather: 0,
        fight_win: 0,
        demon_win: 0,
        home_upgrade: 0,
        buy: 0,
        sell: 0,
        heal: 0,
        get_weapon: 0
      },
      pendingFight: null
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
  u.homeLevel ??= 1;
  u.clinicBuilt ??= false;
  u.shopBuilt ??= false;
  u.armoryBuilt ??= false;
  u.weapon ??= 'none';
  u.resources ??= {};
  u.items ??= {};
  u.weaponsOwned ??= { none: true };
  u.daily ??= { key: todayKey(), missions: [], progress: {}, freeHealUsed: false, prayUsed: false };
  u.stats ??= {};
  u.pendingFight ??= null;
  
  for (const k of RES_KEYS) if (typeof u.resources[k] !== 'number') u.resources[k] = 0;
  for (const k of Object.keys(HEAL_ITEMS)) if (typeof u.items[k] !== 'number') u.items[k] = 0;
  for (const k of Object.keys(SPECIAL_ITEMS)) if (typeof u.items[k] !== 'number') u.items[k] = 0;
  
  u.weaponsOwned.none = true;
  if (typeof u.daily.prayUsed !== 'boolean') u.daily.prayUsed = false;
  
  const statKeys = ['gather', 'fight_win', 'demon_win', 'home_upgrade', 'buy', 'sell', 'heal', 'get_weapon'];
  for (const k of statKeys) if (typeof u.stats[k] !== 'number') u.stats[k] = 0;
  
  refreshDaily(u);
}

function refreshDaily(u) {
  if (u.daily.key !== todayKey()) {
    u.daily = {
      key: todayKey(),
      missions: [],
      progress: {},
      freeHealUsed: false,
      prayUsed: false
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
    u.hp = u.maxHp;
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
    if (k === 'needPlayerLevel') continue;
    if ((u.resources[k] || 0) < v) return false;
  }
  return true;
}

function takeResources(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'needPlayerLevel') continue;
    addResource(u, k, -v);
  }
}

function formatCost(cost) {
  return Object.entries(cost)
    .filter(([k]) => k !== 'needPlayerLevel')
    .map(([k, v]) => `${RES_EMOJI[k] || ''} ${v} ${RES_LABELS[k] || k}`)
    .join(' | ');
}

function rewardText(rew) {
  const out = [];
  for (const [k, v] of Object.entries(rew)) {
    if (k === 'xp') out.push(`✨ ${v} XP`);
    else if (RES_LABELS[k]) out.push(`${RES_EMOJI[k]} ${v} ${RES_LABELS[k]}`);
    else if (HEAL_ITEMS[k]) out.push(`${v} ${HEAL_ITEMS[k].name}`);
    else if (SPECIAL_ITEMS[k]) out.push(`${v} ${SPECIAL_ITEMS[k].name}`);
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

// ==================== توابع نمایش ====================
function getFacilities(u) {
  return [
    `🏥 درمانگاه: ${u.homeLevel >= 2 ? '✅ فعال' : '🔒 قفل'}`,
    `🛒 فروشگاه: ${u.homeLevel >= 2 ? '✅ فعال' : '🔒 قفل'}`,
    `🛠️ اسلحه‌خانه: ${u.homeLevel >= 2 ? '✅ فعال' : '🔒 قفل'}`
  ].join('\n');
}

function statusText(u) {
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  return [
    `🏕️ وضعیت بازیکن`,
    `👤 نام: ${u.name || '-'}`,
    `🎚️ لول: ${u.playerLevel}`,
    `✨ XP: ${u.playerXP}/30`,
    `❤️ HP: ${u.hp}/${u.maxHp}`,
    `🏠 لول خانه: ${u.homeLevel}`,
    `⚔️ سلاح فعلی: ${weapon.name}`,
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
    `🩹 باند: ${u.items.bandage}`,
    `💊 جعبه کمک: ${u.items.medkit}`,
    `🍲 سوپ: ${u.items.soup}`,
    `🌿 گیاه درمانی: ${u.items.herb}`,
    `💎 سنگ قیمتی: ${u.items.gem}`,
    `🗺️ نقشه کهنه: ${u.items.map}`,
    `⛽ سوخت: ${u.items.fuel}`,
    ``,
    `🏗️ امکانات:`,
    getFacilities(u)
  ].join('\n');
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

function shopText() {
  const lines = ['🛒 فروشگاه بقا', '', '📦 منابع:'];
  for (const [k, v] of Object.entries(SHOP_BUY)) {
    if (v.type === 'resource') lines.push(`${RES_EMOJI[k]} /buy_${k} - ${v.name} | 💰 ${v.price} طلا`);
  }
  lines.push('', '🧰 آیتم‌ها:');
  for (const [k, v] of Object.entries(SHOP_BUY)) {
    if (v.type === 'item' || v.type === 'special') lines.push(`📦 /buy_${k} - ${v.name} | 💰 ${v.price} طلا`);
  }
  lines.push('', '⚔️ سلاح‌ها:');
  for (const [k, v] of Object.entries(SHOP_BUY)) {
    if (v.type === 'weapon') lines.push(`🗡️ /buy_${k} - ${v.name} | 💰 ${v.price} طلا`);
  }
  lines.push('', '📝 دستور خرید:', '/buy <کالا> <تعداد>', 'مثال: /buy wood 5');
  lines.push('', '📝 دستور فروش:', '/sell <کالا> <تعداد>', 'مثال: /sell wood 2');
  return lines.join('\n');
}

function armoryText(u) {
  const lines = ['🛠️ اسلحه‌خانه', '', '🔨 ساخت سلاح:', '/craft <weaponKey>', '⚔️ تجهیز سلاح:', '/equip <weaponKey>', ''];
  for (const [k, c] of Object.entries(ARMORY_RECIPES)) {
    lines.push(`🔸 ${k} => ${WEAPONS[k].name} | 📋 ${formatCost(c)}`);
  }
  lines.push('', '🎒 سلاح‌های موجود شما:');
  let hasWeapon = false;
  for (const k of Object.keys(u.weaponsOwned)) {
    if (u.weaponsOwned[k]) {
      lines.push(`- ${WEAPONS[k]?.name || k}${u.weapon === k ? ' ⚔️ (در دست)' : ''}`);
      hasWeapon = true;
    }
  }
  if (!hasWeapon) lines.push('- هیچ سلاحی نداری');
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
    `/use <bandage|medkit|soup|herb> - استفاده از آیتم`
  ].join('\n');
}

// ==================== منوها ====================
function mainMenu(isAdmin = false) {
  const buttons = [
    [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🪓 جستجو', 'gather')],
    [Markup.button.callback('📦 ماموریت‌ها', 'missions'), Markup.button.callback('✅ تحویل ماموریت', 'claim_missions')],
    [Markup.button.callback('⚔️ مبارزه', 'fight_menu'), Markup.button.callback('🏠 خانه', 'home')],
    [Markup.button.callback('🏥 درمانگاه', 'clinic'), Markup.button.callback('🛒 فروشگاه', 'shop')],
    [Markup.button.callback('🛠️ اسلحه خانه', 'armory'), Markup.button.callback('🕯️ آرامگاه', 'aramgah')]
  ];
  return Markup.inlineKeyboard(buttons);
}

function backMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'back_main')]
  ]);
}

// ==================== فروشگاه با دکمه‌های شیشه‌ای ====================
function shopCategoryKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📦 منابع', 'shop_cat_resource'), Markup.button.callback('🧰 آیتم‌ها', 'shop_cat_item')],
    [Markup.button.callback('⚔️ سلاح‌ها', 'shop_cat_weapon'), Markup.button.callback('💎 ویژه', 'shop_cat_special')],
    [Markup.button.callback('💰 فروش', 'shop_sell_menu'), Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
}

function shopItemsKeyboard(category, page = 0) {
  const items = Object.entries(SHOP_BUY).filter(([k, v]) => {
    if (category === 'resource') return v.type === 'resource';
    if (category === 'item') return v.type === 'item';
    if (category === 'weapon') return v.type === 'weapon';
    if (category === 'special') return v.type === 'special';
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

  // منابع قابل فروش
  for (const k of RES_KEYS) {
    if (k === 'gold') continue;
    if (u.resources[k] > 0) {
      buttons.push([Markup.button.callback(
        `${RES_EMOJI[k]} ${RES_LABELS[k]}: ${u.resources[k]} عدد`, 
        `shop_sell_select_${k}`
      )]);
    }
  }

  // آیتم‌های قابل فروش
  for (const [k, v] of Object.entries({...HEAL_ITEMS, ...SPECIAL_ITEMS})) {
    if (u.items[k] > 0) {
      buttons.push([Markup.button.callback(
        `${v.name}: ${u.items[k]} عدد`, 
        `shop_sell_select_${k}`
      )]);
    }
  }

  // سلاح‌های قابل فروش
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

// ==================== گیم‌پلی ====================
function performGather(u) {
  const table = [
    { wood: 3, stone: 1 },
    { wood: 2, stone: 2, gold: 3 },
    { metal: 1, stone: 2 },
    { wood: 1, iron: 1 },
    { gold: 6, wood: 2 },
    { stone: 3, metal: 1 },
    { wood: 4 },
    { gold: 10, metal: 1, stone: 1 }
  ];
  const roll = table[Math.floor(Math.random() * table.length)];
  for (const [k, v] of Object.entries(roll)) addResource(u, k, v);
  bumpAction(u, 'gather', 1);
  return roll;
}

function selectEnemy(type = 'animal') {
  let pool;
  if (type === 'animal') pool = ANIMALS;
  else if (type === 'demon') pool = DEMONS;
  else if (type === 'prey') pool = PREYS;
  else pool = [...ANIMALS, ...DEMONS, ...PREYS];
  
  return pool[rnd(0, pool.length - 1)];
}

function executeCombat(u, enemy) {
  if (u.hp <= 0) return { blocked: true, text: '❌ HP شما صفر است. اول درمان کن.' };

  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const playerPower = u.playerLevel * 4 + weapon.power + rnd(0, 8);
  const enemyPower = enemy.power + rnd(0, 10);
  const loss = rnd(enemy.hpLoss[0], enemy.hpLoss[1]);

  let winChance = 50 + (playerPower - enemyPower) * 4;
  if (u.playerLevel <= 3) winChance += 15;
  winChance = clamp(winChance, 15, 85);
  
  const win = Math.random() * 100 < winChance;
  u.hp = clamp(u.hp - loss, 0, u.maxHp);

  let isDemon = DEMONS.includes(enemy);

  if (win) {
    for (const [k, v] of Object.entries(enemy.rewards)) {
      if (RES_LABELS[k]) addResource(u, k, v);
      else addItem(u, k, v);
    }
    bumpAction(u, 'fight_win', 1);
    if (isDemon) bumpAction(u, 'demon_win', 1);
    return {
      blocked: false,
      win: true,
      enemy,
      loss,
      text: `⚔️ ${enemy.name}\n✅ پیروز شدی!\n❤️ آسیب: -${loss}\n🎁 غنیمت: ${rewardText(enemy.rewards)}`
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
  return ctx.reply(
    `🏕️ سلام ${u.name || 'قهرمان'}! به بازی بقا خوش اومدی!\n\nاز دکمه‌های زیر استفاده کن:`,
    mainMenu()
  );
});

bot.command('وضعیت', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  saveDB(db);
  ctx.reply(statusText(u), backMenu());
});

bot.command('ماموریت‌ها', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(missionsText(u), backMenu());
});

bot.command('تحویل_ماموریت', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const claimed = claimAvailableMissions(u);
  saveDB(db);
  ctx.reply(claimed || '❌ هیچ ماموریت آماده تحویلی نداری', backMenu());
});

bot.command('خانه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(homeText(u), backMenu());
});

bot.command('upgrade_home', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const nextLevel = u.homeLevel + 1;
  const cost = HOME_UPGRADES[nextLevel];
  if (!cost) return ctx.reply('🏠 به حداکثر سطح رسیدی', backMenu());
  if (u.playerLevel < cost.needPlayerLevel) {
    return ctx.reply(`❌ برای ارتقا به لول ${nextLevel} باید لول بازیکن ${cost.needPlayerLevel} باشی`, backMenu());
  }
  if (!hasResources(u, cost)) {
    return ctx.reply(`❌ منابع کافی نیست\n📋 نیاز: ${formatCost(cost)}`, backMenu());
  }
  takeResources(u, cost);
  u.homeLevel = nextLevel;
  bumpAction(u, 'home_upgrade', 1);
  saveDB(db);
  ctx.reply(`🏠 خانه به لول ${u.homeLevel} ارتقا یافت!`, backMenu());
});

bot.command('فروشگاه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 فروشگاه بعد از خانه لول 2 باز می‌شود', backMenu());
  ctx.reply('🛒 فروشگاه بقا - انتخاب دسته:', shopCategoryKeyboard());
});

bot.command('buy', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 فروشگاه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const amount = Math.max(1, Number(args[2] || 1));
  const item = SHOP_BUY[key];
  if (!item) return ctx.reply('❌ کالای نامعتبر', backMenu());
  const total = item.price * amount;
  if (u.resources.gold < total) return ctx.reply('❌ طلای کافی نداری', backMenu());
  
  addResource(u, 'gold', -total);
  if (item.type === 'resource') addResource(u, item.key, amount);
  if (item.type === 'item' || item.type === 'special') addItem(u, item.key, amount);
  if (item.type === 'weapon') {
    u.weaponsOwned[item.key] = true;
    bumpAction(u, 'get_weapon', 1);
  }
  bumpAction(u, 'buy', 1);
  saveDB(db);
  ctx.reply(`✅ خرید انجام شد: ${item.name} × ${amount}\n💰 طلای باقی‌مانده: ${u.resources.gold}`, backMenu());
});

bot.command('sell', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 فروشگاه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const amount = Math.max(1, Number(args[2] || 1));

  if (RES_LABELS[key] && key !== 'gold') {
    if ((u.resources[key] || 0) < amount) return ctx.reply('❌ به این مقدار نداری', backMenu());
    const price = Math.max(1, Math.floor((SHOP_BUY[key]?.price || 5) / 2));
    addResource(u, key, -amount);
    addResource(u, 'gold', price * amount);
    bumpAction(u, 'sell', 1);
    saveDB(db);
    return ctx.reply(`✅ فروخته شد\n${amount} ${RES_LABELS[key]} => ${price * amount} طلا`, backMenu());
  }

  if (u.items[key] >= amount) {
    const base = HEAL_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || Math.max(1, Math.floor((SHOP_BUY[key]?.price || 10) / 2));
    addItem(u, key, -amount);
    addResource(u, 'gold', base * amount);
    bumpAction(u, 'sell', 1);
    saveDB(db);
    return ctx.reply(`✅ فروخته شد\n${amount} عدد => ${base * amount} طلا`, backMenu());
  }

  if (u.weaponsOwned[key] && key !== 'none') {
    const base = WEAPONS[key]?.sell || 10;
    delete u.weaponsOwned[key];
    if (u.weapon === key) u.weapon = 'none';
    addResource(u, 'gold', base);
    bumpAction(u, 'sell', 1);
    saveDB(db);
    return ctx.reply(`✅ ${WEAPONS[key].name} فروخته شد => ${base} طلا`, backMenu());
  }

  ctx.reply('❌ چیزی برای فروش پیدا نشد', backMenu());
});

bot.command('درمانگاه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 درمانگاه بعد از خانه لول 2 باز می‌شود', backMenu());
  ctx.reply(clinicText(u), backMenu());
});

bot.command('heal', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 درمانگاه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const mode = args[1];

  if (mode === 'free') {
    if (u.daily.freeHealUsed) return ctx.reply('❌ درمان رایگان امروز را استفاده کردی', backMenu());
    u.daily.freeHealUsed = true;
    u.hp = Math.min(u.maxHp, u.hp + 30);
    bumpAction(u, 'heal', 1);
    saveDB(db);
    return ctx.reply(`✅ 30 HP درمان شد\n❤️ HP: ${u.hp}/${u.maxHp}`, backMenu());
  }

  if (mode === 'gold') {
    if (u.resources.gold < 20) return ctx.reply('❌ 20 طلا لازم داری', backMenu());
    addResource(u, 'gold', -20);
    u.hp = u.maxHp;
    bumpAction(u, 'heal', 1);
    saveDB(db);
    return ctx.reply(`✅ HP کامل شد\n❤️ HP: ${u.hp}/${u.maxHp}`, backMenu());
  }

  ctx.reply('❌ استفاده: /heal free یا /heal gold', backMenu());
});

bot.command('use', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const item = HEAL_ITEMS[key];
  if (!item) return ctx.reply('❌ آیتم درمانی نامعتبر', backMenu());
  if ((u.items[key] || 0) < 1) return ctx.reply('❌ این آیتم را نداری', backMenu());
  addItem(u, key, -1);
  u.hp = Math.min(u.maxHp, u.hp + item.heal);
  bumpAction(u, 'heal', 1);
  saveDB(db);
  ctx.reply(`✅ از ${item.name} استفاده شد\n+${item.heal} HP\n❤️ HP: ${u.hp}/${u.maxHp}`, backMenu());
});

bot.command('اسلحه_خانه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 اسلحه‌خانه بعد از خانه لول 2 باز می‌شود', backMenu());
  ctx.reply(armoryText(u), backMenu());
});

bot.command('craft', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('🔒 اسلحه‌خانه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const recipe = ARMORY_RECIPES[key];
  if (!recipe || !WEAPONS[key]) return ctx.reply('❌ سلاح نامعتبر', backMenu());
  if (u.weaponsOwned[key]) return ctx.reply('❌ این سلاح را داری', backMenu());
  if (!hasResources(u, recipe)) return ctx.reply(`❌ منابع کافی نیست\n${formatCost(recipe)}`, backMenu());
  takeResources(u, recipe);
  u.weaponsOwned[key] = true;
  bumpAction(u, 'get_weapon', 1);
  saveDB(db);
  ctx.reply(`✅ ${WEAPONS[key].name} ساخته شد!`, backMenu());
});

bot.command('equip', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  if (!u.weaponsOwned[key]) return ctx.reply('❌ این سلاح را نداری', backMenu());
  u.weapon = key;
  saveDB(db);
  ctx.reply(`⚔️ ${WEAPONS[key].name} تجهیز شد`, backMenu());
});

bot.command('gather', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const found = performGather(u);
  saveDB(db);
  ctx.reply(`🪓 جستجو انجام شد\n🎁 ${rewardText(found)}`, backMenu());
});

bot.command('aramgah', async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'pray_dua')],
    [Markup.button.callback('🧎 نماز', 'pray_namaz')],
    [Markup.button.callback('📖 روضه', 'pray_rozeh')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
  return ctx.reply('🕯️ به آرامگاه خوش آمدید. یکی را انتخاب کن:', keyboard);
});

// ==================== ادمین ====================
bot.command('admin_give', (ctx) => {
  const me = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!isAdmin(me.id)) return ctx.reply('⛔ فقط ادمین');
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  const type = args[2];
  const key = args[3];
  const amount = Number(args[4] || 0);

  if (!targetId || !type || !key || !amount) {
    return ctx.reply('❌ استفاده:\n/admin_give userId resource wood 10\n/admin_give userId item bandage 2\n/admin_give userId weapon rifle 1');
  }

  const u = ensureUser(targetId, '');
  if (type === 'resource') {
    addResource(u, key, amount);
  } else if (type === 'item') {
    addItem(u, key, amount);
  } else if (type === 'weapon') {
    u.weaponsOwned[key] = true;
  } else if (type === 'xp') {
    addXP(u, amount);
  } else if (type === 'hp') {
    u.hp = Math.min(u.maxHp, u.hp + amount);
  } else {
    return ctx.reply('❌ type نامعتبر');
  }
  saveDB(db);
  ctx.reply('✅ انجام شد');
});

bot.command('admin_full', (ctx) => {
  const me = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!isAdmin(me.id)) return ctx.reply('⛔ فقط ادمین');
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('❌ استفاده: /admin_full userId');
  const u = ensureUser(targetId, '');

  for (const k of RES_KEYS) addResource(u, k, 9999);
  for (const k of Object.keys(HEAL_ITEMS)) addItem(u, k, 99);
  for (const k of Object.keys(SPECIAL_ITEMS)) addItem(u, k, 99);
  for (const k of Object.keys(WEAPONS)) u.weaponsOwned[k] = true;
  u.weapon = 'rifle';
  u.playerLevel = 20;
  u.playerXP = 0;
  u.maxHp = 300;
  u.hp = 300;
  u.homeLevel = 4;

  saveDB(db);
  ctx.reply('✅ همه چیز داده شد');
});

// ==================== اکشن‌های دکمه‌ای ====================
bot.action('status', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.editMessageText(statusText(u), backMenu());
});

bot.action('gather', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const found = performGather(u);
  saveDB(db);
  ctx.editMessageText(`🪓 جستجو انجام شد\n🎁 ${rewardText(found)}`, backMenu());
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

// ==================== سیستم مبارزه جدید ====================
bot.action('fight_menu', (ctx) => {
  ctx.editMessageText('⚔️ بخش مبارزه - نوع حریف رو انتخاب کن:', Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات وحشی', 'fight_type_animal')],
    [Markup.button.callback('👹 دیوها', 'fight_type_demon')],
    [Markup.button.callback('🦌 شکار', 'fight_type_prey')],
    [Markup.button.callback('🎲 رندوم', 'fight_type_random')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action(/fight_type_(.+)/, (ctx) => {
  const type = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');

  if (u.hp <= 0) {
    return ctx.editMessageText('❌ HP شما صفر است. اول درمان کن.', backMenu());
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
    `🛡️ شانس برد تقریبی: ${clamp(50 + (playerPower - enemy.power) * 4 + (u.playerLevel <= 3 ? 15 : 0), 15, 85)}%`,
    '',
    `آماده‌ای مبارزه کنی؟`
  ].join('\n');

  ctx.editMessageText(enemyInfo, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
    [Markup.button.callback('🏃 فرار', 'fight_menu')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action('fight_confirm', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');

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

// ==================== فروشگاه با دکمه‌های شیشه‌ای ====================
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
  if (item.type === 'item' || item.type === 'special') addItem(u, item.key, amount);
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
    const base = HEAL_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || 10;
    
    ctx.editMessageText(
      `💰 فروش ${HEAL_ITEMS[key]?.name || SPECIAL_ITEMS[key]?.name || key}\n📦 موجودی: ${amount}\n💵 قیمت هر واحد: ${base} طلا\nتعداد رو انتخاب کن:`,
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
    const base = HEAL_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || Math.max(1, Math.floor((SHOP_BUY[key]?.price || 10) / 2));
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

bot.action('armory', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('🔒 اسلحه‌خانه قفل است');
  ctx.editMessageText(armoryText(u), backMenu());
});

bot.action('back_main', (ctx) => {
  ctx.editMessageText('🏕️ منوی اصلی:', mainMenu());
});

// ==================== هندلر متن ====================
bot.on('text', (ctx) => {
  const text = ctx.message.text.trim();

  if (text === 'وضعیت') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    return ctx.reply(statusText(u), backMenu());
  }

  if (text === 'ماموریت‌ها') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    return ctx.reply(missionsText(u), backMenu());
  }

  if (text === 'تحویل ماموریت') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    const claimed = claimAvailableMissions(u);
    saveDB(db);
    return ctx.reply(claimed || '❌ هیچ ماموریت آماده تحویلی نداری', backMenu());
  }

  if (text === 'خانه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    return ctx.reply(homeText(u), backMenu());
  }

  if (text === 'درمانگاه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.homeLevel < 2) return ctx.reply('🔒 درمانگاه قفل است', backMenu());
    return ctx.reply(clinicText(u), backMenu());
  }

  if (text === 'فروشگاه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.homeLevel < 2) return ctx.reply('🔒 فروشگاه قفل است', backMenu());
    return ctx.reply('🛒 فروشگاه بقا - انتخاب دسته:', shopCategoryKeyboard());
  }

  if (text === 'اسلحه خانه' || text === 'اسلحه‌خانه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.homeLevel < 2) return ctx.reply('🔒 اسلحه‌خانه قفل است', backMenu());
    return ctx.reply(armoryText(u), backMenu());
  }

  if (text === 'جستجو') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    const found = performGather(u);
    saveDB(db);
    return ctx.reply(`🪓 جستجو انجام شد\n🎁 ${rewardText(found)}`, backMenu());
  }

  if (text === 'مبارزه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.hp <= 0) return ctx.reply('❌ HP شما صفر است. اول درمان کن.', backMenu());
    return ctx.reply('⚔️ بخش مبارزه - نوع حریف رو انتخاب کن:', Markup.inlineKeyboard([
      [Markup.button.callback('🐺 حیوانات وحشی', 'fight_type_animal')],
      [Markup.button.callback('👹 دیوها', 'fight_type_demon')],
      [Markup.button.callback('🦌 شکار', 'fight_type_prey')],
      [Markup.button.callback('🎲 رندوم', 'fight_type_random')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
  }

  if (text === 'دیو') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.hp <= 0) return ctx.reply('❌ HP شما صفر است. اول درمان کن.', backMenu());
    const enemy = DEMONS[rnd(0, DEMONS.length - 1)];
    u.pendingFight = enemy;
    saveDB(db);
    
    const weapon = WEAPONS[u.weapon] || WEAPONS.none;
    const playerPower = u.playerLevel * 4 + weapon.power;
    
    return ctx.reply(
      `⚔️ دیو پیدا شد: ${enemy.name}\n💪 قدرت: ${enemy.power}\n❤️ آسیب: ${enemy.hpLoss[0]}-${enemy.hpLoss[1]}\n🎁 غنیمت: ${rewardText(enemy.rewards)}\n\n⚔️ قدرت شما: ${playerPower}\n🛡️ شانس برد: ${clamp(50 + (playerPower - enemy.power) * 4 + (u.playerLevel <= 3 ? 15 : 0), 15, 85)}%\n\nآماده‌ای مبارزه کنی؟`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
        [Markup.button.callback('🏃 فرار', 'back_main')]
      ])
    );
  }
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
  console.log('✅ ربات با موفقیت اجرا شد!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
