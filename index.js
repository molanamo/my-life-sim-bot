const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_FILE = 'data.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.log('❌ توکن ربات را وارد کن');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== عکس‌ها ====================
const IMG = {
  main: 'AgACAgQAAxkBAAFLUE5qHr-E5VSEFNHkPMFSe6mdmmNEwAACyg5rG9cu8VCRkj-WomYlbgEAAwIAA3gAAzsE',
  status: 'AgACAgQAAxkBAAFLUGFqHr_OXv4R3IARd6b0s2LxVizYWQACyw5rG9cu8VB6zHlmw7-u5wEAAwIAA3kAAzsE',
  gather: 'AgACAgQAAxkBAAFLUHNqHsBerulTzURI53EzFk5Hqx7d1QACzA5rG9cu8VDOjETImXG3BQEAAwIAA3kAAzsE',
  fight: 'AgACAgQAAxkBAAFLUHVqHsCRtxIpSoT30gYu698icIpMMgACzQ5rG9cu8VDcgj68dTQ31QEAAwIAA3kAAzsE',
  boss: 'AgACAgQAAxkBAAFLUHdqHsC4sohfXTpJbuu1iYYemmrKOwAC3A5rG_TM-VDdyHSyeHbPYgEAAwIAA3gAAzsE',
  pvp: 'AgACAgQAAxkBAAFLUIZqHsGE2Q_aOjLe_pvJjD1QsaEFkQAC3Q5rG_TM-VD4uaabjrx5cwEAAwIAA3kAAzsE',
  home: 'AgACAgQAAxkBAAFLUKhqHsPq-9Zuhc4k_qopaGEfYo3YVAAC0w5rG9cu8VDYp_UwBVr5SQEAAwIAA3gAAzsE',
  clinic: 'AgACAgQAAxkBAAFLULNqHsROohO1PLNmzXgeEKVJ7tUXOwAC1A5rG9cu8VDnrFqotsfjFAEAAwIAA3gAAzsE',
  shop: 'AgACAgQAAxkBAAFLULdqHsSPqAfjL5dXLVNlawuO8FGBWAAC1Q5rG9cu8VCEXpHvHIAoYwEAAwIAA3kAAzsE',
  armory: 'AgACAgQAAxkBAAFLQ1xqHeE57-7UwtrxoAue33Tj8qZ2ygACgQ5rG1tF6FDwf9RF0-_aBgEAAwIAA3kAAzsE',
  armor_shop: 'AgACAgQAAxkBAAFLUMZqHsUb_16x6rZ08T6R0rv5a7Ym6gAC2A5rG9cu8VCGGND3g-hZMgEAAwIAA3kAAzsE',
  aramgah: 'AgACAgQAAxkBAAFLS3lqHni0Hk9r4_tBmw2RK6wYB4GqxgACXQ5rG9cu8VA7Kn4hYMGoiQEAAwIAA3kAAzsE',
  eat: 'AgACAgQAAxkBAAFLUNFqHsWy9bhpHj3vEXgr6bhuoXy7JwAC2w5rG9cu8VDiqq2VG00OnwEAAwIAA3gAAzsE',
  skills: 'AgACAgQAAxkBAAFLUOJqHsaB9p7B-7Llfc6zC-_t2-ukBgAC5g5rG9cu8VD-dQWAh2ZtmAEAAwIAA3kAAzsE',
  guide: 'AgACAgQAAxkBAAFLUOhqHsbAX1vBcNc_fLYUYPq4xidkKAAC5w5rG9cu8VAyoCMv6OD7ewEAAwIAA3kAAzsE',
  cooldowns: 'AgACAgQAAxkBAAFLUOxqHscEeap_dyHXnNyoqkidN-BFQgAC7A5rG9cu8VA_cJrdzP6LbgEAAwIAA3kAAzsE',
};

// ==================== دیتابیس ====================
let db = { users: {}, clans: {} };
if (fs.existsSync(DB_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) {}
}

function saveDB() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (e) {}
}

// ==================== توابع کمکی ====================
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function isAdmin(id) { return Number(id) === ADMIN_ID; }

function formatTime(ms) {
  if (ms <= 0) return 'آماده';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}ساعت ${m % 60}دقیقه`;
  if (m > 0) return `${m}دقیقه ${s % 60}ثانیه`;
  return `${s}ثانیه`;
}

function progressBar(c, max, len = 8) {
  const f = Math.floor(Math.max(0, Math.min(c, max)) / max * len);
  return '🟩'.repeat(f) + '⬜'.repeat(len - f);
}

const CD = { 
  gather: 120000, fight: 180000, boss: 600000, pray: 21600000, 
  pvp: 300000, daily: 86400000, shahnameh: 3600000, quest: 7200000,
  npc: 3600000, bank: 86400000
};

function checkCD(u, action, ms) {
  if (!u.cooldowns) u.cooldowns = {};
  const last = u.cooldowns[action] || 0;
  const elapsed = Date.now() - last;
  return elapsed >= ms ? { can: true, rem: 0 } : { can: false, rem: ms - elapsed };
}

function setCD(u, action) {
  if (!u.cooldowns) u.cooldowns = {};
  u.cooldowns[action] = Date.now();
}

// ==================== توهین‌های سلطنتی ====================
const ROYAL_TAUNTS = [
  '👑 شاهنشاه می‌فرماید: حریف بیچاره حتی سپرش هم ترکید!',
  '⚔️ رستم می‌گه: اینم از انتقام! حالا برو زانوی غم بغل بگیر!',
  '🦅 سیمرغ شاهد بود: زره‌ات مثل کاغذ پاره شد!',
  '🔥 آتشکده روشن شد: سلاح‌ات رو بفروش، به درد نمی‌خوره!',
  '👹 حتی دیو سپید هم به حال تو گریه کرد!',
  '🐉 ضحاک می‌گه: اینقدر ضعیفی که مارهای شونه‌م خندیدن!',
  '🏛️ در بارگاه جمشید اعلام شد: تو لایق شمشیر نیستی!',
  '📜 کتیبه‌ها نوشتن: برو چوپانی کن، جنگاوری پیشکشت!',
  '🗡️ ذوالفقار هم از دست تو ناراحت شد!',
  '🐎 رخش هم نگاهت نکرد و رفت!',
];

const SHAHNAMEH_VERSES = [
  { verse: 'توانا بود هر که دانا بود', reward: 15 },
  { verse: 'به نام خداوند جان و خرد', reward: 10 },
  { verse: 'میازار موری که دانه‌کش است', reward: 20 },
  { verse: 'هنر نزد ایرانیان است و بس', reward: 25 },
  { verse: 'چو ایران نباشد تن من مباد', reward: 30 },
];

// ==================== NPC ها ====================
const NPCS = {
  zal: { n: '👴 زال زر', desc: 'راهنمای دانا - آموزش مهارت‌ها', price: 50, effect: (u) => { u.sp = (u.sp||0) + 1; return '⭐ +۱ گوهر هنر'; } },
  simurgh: { n: '🦅 سیمرغ', desc: 'شفابخش افسانه‌ای - درمان کامل', price: 100, effect: (u) => { u.hp = u.maxHp; return '❤️ درمان کامل'; } },
  rostam: { n: '⚔️ رستم', desc: 'پهلوان - آموزش مبارزه', price: 80, effect: (u) => { addXP(u, 50); return '✨ +۵۰ نام‌آوری'; } },
  ferdosi: { n: '📜 فردوسی', desc: 'شاعر - شعر شاهنامه', price: 30, effect: (u) => { addRes(u, 'gold', 50); u.shahnamehCount = (u.shahnamehCount||0) + 1; return '🥇 +۵۰ زر | 📚 +۱ شعر'; } },
};

// ==================== مأموریت‌های روزانه ====================
const DAILY_QUESTS = [
  { n: 'شکار روز', desc: '۳ بار جستجو کن', target: 'gather', goal: 3, rew: { gold: 100, xp: 20 } },
  { n: 'نبردآور', desc: '۲ بار مبارزه کن', target: 'fight', goal: 2, rew: { gold: 150, xp: 30 } },
  { n: 'پهلوان', desc: '۱ برد PvP', target: 'pvp_win', goal: 1, rew: { gold: 200, xp: 40 } },
  { n: 'نیایشگر', desc: '۱ بار آتشکده', target: 'pray', goal: 1, rew: { gold: 80, xp: 15 } },
  { n: 'شاعر', desc: '۱ شعر شاهنامه', target: 'shahnameh', goal: 1, rew: { gold: 60, xp: 10 } },
];

// ==================== دستاوردها ====================
const ACHIEVEMENTS = [
  { id: 'first_blood', n: '🩸 اولین خون', desc: 'اولین برد در نبرد', check: (u) => (u.stats.fw||0) + (u.stats.dw||0) >= 1 },
  { id: 'warrior', n: '⚔️ جنگجو', desc: '۱۰ برد در نبرد', check: (u) => (u.stats.fw||0) + (u.stats.dw||0) >= 10 },
  { id: 'hero', n: '🏆 پهلوان', desc: '۵۰ برد در نبرد', check: (u) => (u.stats.fw||0) + (u.stats.dw||0) >= 50 },
  { id: 'pvp_king', n: '👑 سلطان PvP', desc: '۱۰۰ برد PvP', check: (u) => (u.stats.pw||0) >= 100 },
  { id: 'rich', n: '💰 خزانه‌دار', desc: '۱۰۰۰۰ طلا', check: (u) => (u.res.gold||0) >= 10000 },
  { id: 'builder', n: '🏠 معمار', desc: 'خانه لول ۵', check: (u) => u.homeLvl >= 5 },
  { id: 'collector', n: '⛏️ گردآور', desc: '۱۰۰ بار جستجو', check: (u) => (u.stats.gath||0) >= 100 },
  { id: 'shahnameh_reader', n: '📚 شاعر', desc: '۲۰ شعر شاهنامه', check: (u) => (u.shahnamehCount||0) >= 20 },
  { id: 'loyal', n: '⭐ وفادار', desc: '۵۰۰ امتیاز وفاداری', check: (u) => (u.loyaltyPoints||0) >= 500 },
  { id: 'boss_slayer', n: '🐉 اژدهاکش', desc: '۱۰ باس', check: (u) => (u.stats.bw||0) >= 10 },
];

// ==================== رویدادهای تصادفی ====================
const RANDOM_EVENTS = [
  { n: '🌪️ طوفان', desc: 'طوفان به کاشانه‌ات آسیب زد!', effect: (u) => { u.res.wood = Math.floor((u.res.wood||0)*0.7); u.res.stone = Math.floor((u.res.stone||0)*0.7); return '🪵 و 🪨 کاهش یافت'; } },
  { n: '💰 گنج', desc: 'گنج کهنه پیدا کردی!', effect: (u) => { addRes(u,'gold',rnd(100,500)); return `🥇 طلا اضافه شد`; } },
  { n: '🤒 بیماری', desc: 'بیمار شدی...', effect: (u) => { u.hp = Math.floor(u.hp*0.5); return '❤️ نصف شد'; } },
  { n: '🎁 هدیه', desc: 'هدیه از آسمان!', effect: (u) => { addItem(u,'bread',3); addItem(u,'water',2); return '🍞 و 💧 گرفتی'; } },
];

// ==================== حیوانات خونگی ====================
const PETS = {
  horse: { n: '🐎 رخش', price: 500, bonus: 'سرعت جستجو +۳۰٪', effect: 'gather_speed' },
  falcon: { n: '🦅 باز', price: 400, bonus: 'شانس شکار +۲۰٪', effect: 'hunt_chance' },
  dog: { n: '🐕 سگ', price: 300, bonus: 'دفاع +۵', effect: 'defense' },
  cat: { n: '🐈 گربه', price: 200, bonus: 'شانس آیتم +۱۵٪', effect: 'item_chance' },
};

// ==================== داده‌های بازی ====================
const RES = { wood: '🪵', stone: '🪨', metal: '🔩', iron: '⛓️', gold: '🥇', toman: '💵' };

const WEAPONS = {
  none: { n: '❌ بدون سلاح', p: 0, price: 0, lvl: 0 },
  stick: { n: '🪵 چوب دستی', p: 2, price: 20, lvl: 1 },
  knife: { n: '🔪 خنجر سهراب', p: 5, price: 80, lvl: 2 },
  bow_zal: { n: '🏹 تیر و کمان زال', p: 10, price: 220, lvl: 3 },
  axe: { n: '🪓 تبر فریدون', p: 14, price: 350, lvl: 4 },
  spear: { n: '🔱 نیزه گیو', p: 18, price: 500, lvl: 5 },
  bow_arash: { n: '🏹 کمان آرش', p: 22, price: 800, lvl: 7 },
  mace: { n: '🔥 گرز گاوسر', p: 28, price: 1200, lvl: 6 },
  sword_rostam: { n: '⚔️ شمشیر رستم', p: 35, price: 2000, lvl: 9 },
  zolfaghar: { n: '🗡️ ذوالفقار', p: 50, price: 3000, lvl: 10 },
};

const ARMORS = {
  none: { n: '❌ بدون زره', d: 0, price: 0, lvl: 0 },
  wood_shield: { n: '🪵 سپر چوبی', d: 3, price: 50, lvl: 1 },
  leather: { n: '🐄 چرم سکایی', d: 7, price: 150, lvl: 3 },
  hakhamaneshi: { n: '⛓️ زره هخامنشی', d: 12, price: 400, lvl: 5 },
  sasani: { n: '🥇 زره ساسانی', d: 18, price: 800, lvl: 8 },
  babr_bayan: { n: '🐉 ببر بیان', d: 25, price: 2000, lvl: 12 },
};

const FOODS = {
  bread: { n: '🍞 نان روغنی', h: 30 }, meat: { n: '🍖 کباب شکار', h: 50 },
  fish: { n: '🐟 ماهی', h: 25 }, chicken: { n: '🍗 ماکیان بریان', h: 45 },
  steak: { n: '🥩 گوشت بره', h: 70 }, stew: { n: '🥘 آبگوشت', h: 55 },
  noodle: { n: '🍜 آش رشته', h: 35 }, cake: { n: '🍰 باقلوا', h: 25, heal: 20 },
  honey: { n: '🍯 انگبین', h: 20, heal: 30 },
};

const DRINKS = {
  water: { n: '💧 آب چشمه', t: 40 }, juice: { n: '🧃 شربت آلبالو', t: 50 },
  soda: { n: '🍺 دوغ', t: 25 }, tea: { n: '🍵 چای بهارنارنج', t: 35 },
  coffee: { n: '☕ قهوه ترک', t: 30, xp: 10 }, milk: { n: '🥛 شیر میش', t: 45 },
};

const ANIMALS = [
  { n: '🐺 گرگ تورانی', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8 },
  { n: '🐗 گراز مازندران', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10 },
  { n: '🦊 شغال دشتی', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12 },
  { n: '🐻 خرس البرز', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15 },
];

const DEMONS = [
  { n: '👹 دیو سفید', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18 },
  { n: '👺 دیو سیاه', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22 },
  { n: '👾 اکوان دیو', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28 },
];

const BOSSES = [
  { n: '🐉 ضحاک', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, ml: 8 },
  { n: '🦅 سیمرغ', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, ml: 10 },
];

const HOME_UP = {
  2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, nl: 3 },
  3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, nl: 5 },
  4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, nl: 8 },
  5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, nl: 12 },
};

const PVP_LEAGUES = {
  bronze: { n: '🥉 برنز', min: 0 }, silver: { n: '🥈 نقره', min: 100 },
  gold: { n: '🥇 طلا', min: 300 }, diamond: { n: '💎 الماس', min: 600 },
  legendary: { n: '👑 افسانه‌ای', min: 1000 },
};

// ==================== مدیریت کاربر ====================
function ensureUser(id, name) {
  const uid = String(id);
  if (!db.users[uid]) {
    db.users[uid] = {
      id: uid, name: name || 'ناشناس', lvl: 1, xp: 0,
      hp: 100, maxHp: 300, hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100,
      homeLvl: 1, clinicLvl: 1, weapon: 'none', armor: 'none',
      skills: { g: 0, h: 0, c: 0, s: 0 }, sp: 0,
      res: { wood: 20, stone: 20, metal: 20, iron: 20, gold: 30, toman: 20 },
      items: { bandage: 1, bread: 2, water: 2 },
      wOwned: { none: true }, aOwned: { none: true },
      cooldowns: {}, daily: {}, stats: { pw: 0, pl: 0, fw: 0, dw: 0, bw: 0, gath: 0 }, logins: 1,
      pvpRating: 0, pvpLeague: 'bronze', pvpHistory: [], pvpStreak: 0,
      honorPoints: 0, jailUntil: 0, pet: null,
      loyaltyPoints: 0, lastDaily: 0, shahnamehCount: 0,
      pvpQuickCount: 0, pvpQuickReset: 0, lastMenu: 'main',
      quests: [], questProgress: {}, achievements: [], bankGold: 0, bankInterest: 0,
      weaponEnchant: null, armorEnchant: null,
    };
    rollDailyQuests(db.users[uid]);
    saveDB();
    return db.users[uid];
  }
  const u = db.users[uid];
  if (name) u.name = name;
  u.logins = (u.logins || 0) + 1;
  u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 300;
  u.hunger = u.hunger ?? 100; u.maxHunger = u.maxHunger || 100;
  u.thirst = u.thirst ?? 100; u.maxThirst = u.maxThirst || 100;
  u.homeLvl = u.homeLvl || 1; u.clinicLvl = u.clinicLvl || 1;
  u.weapon = u.weapon || 'none'; u.armor = u.armor || 'none';
  u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0 }; u.sp = u.sp || 0;
  u.res = u.res || {}; u.items = u.items || {};
  u.wOwned = u.wOwned || { none: true }; u.aOwned = u.aOwned || { none: true };
  u.cooldowns = u.cooldowns || {}; u.daily = u.daily || {};
  u.stats = u.stats || { pw: 0, pl: 0, fw: 0, dw: 0, bw: 0, gath: 0 };
  u.pvpRating = u.pvpRating || 0; u.pvpLeague = u.pvpLeague || 'bronze';
  u.pvpHistory = u.pvpHistory || []; u.pvpStreak = u.pvpStreak || 0;
  u.honorPoints = u.honorPoints || 0; u.jailUntil = u.jailUntil || 0;
  u.loyaltyPoints = u.loyaltyPoints || 0;
  u.lastDaily = u.lastDaily || 0; u.shahnamehCount = u.shahnamehCount || 0;
  u.pvpQuickCount = u.pvpQuickCount || 0; u.pvpQuickReset = u.pvpQuickReset || 0;
  u.lastMenu = u.lastMenu || 'main';
  u.quests = u.quests || []; u.questProgress = u.questProgress || {};
  u.achievements = u.achievements || [];
  u.bankGold = u.bankGold || 0; u.bankInterest = u.bankInterest || 0;
  u.weaponEnchant = u.weaponEnchant || null; u.armorEnchant = u.armorEnchant || null;
  u.pet = u.pet || null;
  for (const k of Object.keys(RES)) { if (typeof u.res[k] !== 'number') u.res[k] = 0; }
  u.wOwned.none = true; u.aOwned.none = true;
  
  // ریست مأموریت‌ها روزانه
  const today = new Date().toDateString();
  if (u.lastQuestDate !== today) {
    rollDailyQuests(u);
    u.lastQuestDate = today;
  }
  
  // سود بانک روزانه
  if (u.lastBankDate !== today && u.bankGold > 0) {
    const interest = Math.floor(u.bankGold * 0.02); // ۲٪ سود روزانه
    u.bankGold += interest;
    u.bankInterest = (u.bankInterest || 0) + interest;
    u.lastBankDate = today;
  }
  
  // رویداد تصادفی
  if (!u.daily.eventTriggered && Math.random() < 0.15) {
    u.daily.eventTriggered = true;
    u.pendingEvent = RANDOM_EVENTS[rnd(0, RANDOM_EVENTS.length - 1)];
  }
  
  saveDB();
  return u;
}

function rollDailyQuests(u) {
  u.quests = [...DAILY_QUESTS].sort(() => Math.random() - 0.5).slice(0, 3);
  u.questProgress = {};
  u.quests.forEach(q => { u.questProgress[q.target] = 0; });
}

function checkAchievements(u) {
  const newAchievements = [];
  for (const ach of ACHIEVEMENTS) {
    if (!u.achievements.includes(ach.id) && ach.check(u)) {
      u.achievements.push(ach.id);
      newAchievements.push(ach);
    }
  }
  return newAchievements;
}

function addXP(u, amt) {
  u.xp += amt; let ups = 0;
  while (u.xp >= 30) {
    u.xp -= 30; u.lvl += 1; u.maxHp += 10; u.maxHunger += 5; u.maxThirst += 5;
    u.hp = u.maxHp; u.hunger = u.maxHunger; u.thirst = u.maxThirst;
    u.sp = (u.sp || 0) + 1; ups++;
  }
  return ups;
}

function addRes(u, k, v) { if (!u.res[k]) u.res[k] = 0; u.res[k] += v; if (u.res[k] < 0) u.res[k] = 0; }
function addItem(u, k, v) { if (!u.items[k]) u.items[k] = 0; u.items[k] += v; if (u.items[k] < 0) u.items[k] = 0; }
function hasRes(u, cost) { for (const [k, v] of Object.entries(cost)) { if (k === 'nl') continue; if ((u.res[k] || 0) < v) return false; } return true; }
function takeRes(u, cost) { for (const [k, v] of Object.entries(cost)) { if (k === 'nl') continue; addRes(u, k, -v); } }

function giveReward(u, rew) {
  for (const [k, v] of Object.entries(rew)) {
    if (RES[k]) addRes(u, k, v); else addItem(u, k, v);
  }
}

function rwText(rew) {
  return Object.entries(rew).map(([k, v]) => {
    if (RES[k]) return `${RES[k]} ${v}`;
    if (FOODS[k]) return `${v}x ${FOODS[k].n}`;
    return `${v}x ${k}`;
  }).join(' | ') || 'ندارد';
}

async function sendPhoto(ctx, fileId, caption, markup) {
  try {
    if (fileId && fileId.startsWith('AgAC')) {
      return await ctx.replyWithPhoto(fileId, { caption, ...(markup || {}) });
    }
  } catch (e) {}
  return await ctx.reply(caption, markup || {});
}

function updateLeague(u) {
  const rating = u.pvpRating || 0;
  const leagues = Object.entries(PVP_LEAGUES).reverse();
  for (const [key, league] of leagues) {
    if (rating >= league.min) { u.pvpLeague = key; break; }
  }
}

function addToHistory(u, enemyName, win) {
  if (!u.pvpHistory) u.pvpHistory = [];
  u.pvpHistory.push({ enemy: enemyName, win, time: Date.now() });
  if (u.pvpHistory.length > 20) u.pvpHistory = u.pvpHistory.slice(-20);
}

function progressQuest(u, target) {
  if (!u.questProgress) u.questProgress = {};
  u.questProgress[target] = (u.questProgress[target] || 0) + 1;
}

function smartBackBtn(currentMenu) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 بازگشت', `back_to_${currentMenu}`)],
    [Markup.button.callback('🏛️ بارگاه', 'back_main')],
  ]);
}

// ==================== منوها ====================
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 دیوان آمار', 'status'), Markup.button.callback('🌲 بیشه نارون', 'gather')],
    [Markup.button.callback('⚔️ میدان رزم', 'fight_menu'), Markup.button.callback('👹 اژدها', 'boss_menu')],
    [Markup.button.callback('🏟️ میدان پهلوانی', 'pvp_menu'), Markup.button.callback('🏠 کاشانه', 'home')],
    [Markup.button.callback('🏥 دارالشفا', 'clinic'), Markup.button.callback('🛒 بازار بزرگ', 'shop')],
    [Markup.button.callback('🛠️ آهنگری', 'armory'), Markup.button.callback('🛡️ زرادخانه', 'armor_shop')],
    [Markup.button.callback('🕯️ آتشکده', 'aramgah'), Markup.button.callback('🍽️ سفره', 'eat_menu')],
    [Markup.button.callback('👤 بزرگان', 'npc_menu'), Markup.button.callback('📋 مأموریت‌ها', 'quest_menu')],
    [Markup.button.callback('🐎 حیوانات', 'pet_menu'), Markup.button.callback('🏦 بانک', 'bank_menu')],
    [Markup.button.callback('🏆 دستاوردها', 'achieve_menu'), Markup.button.callback('📖 اوستا', 'guide')],
    [Markup.button.callback('⭐ هنرستان', 'skills'), Markup.button.callback('⏱️ چرخ زمان', 'cooldowns')],
    [Markup.button.callback('🎁 جایزه', 'daily_reward')],
  ]);
}

// ==================== استارت ====================
bot.start(async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const isNew = u.logins === 1;
  u.lastMenu = 'main';
  
  // رویداد تصادفی
  let eventText = '';
  if (u.pendingEvent) {
    const event = u.pendingEvent;
    u.pendingEvent = null;
    const result = event.effect(u);
    eventText = `\n\n🌍 رویداد: ${event.n}!\n${event.desc}\n${result}`;
  }
  
  // امتیاز وفاداری
  const today = new Date().toDateString();
  if (u.lastLoginDate !== today) {
    u.loyaltyPoints = (u.loyaltyPoints || 0) + 5;
    u.lastLoginDate = today;
  }
  
  saveDB();
  
  if (isNew) {
    const text = `🏛️ «به نام خداوند جان و خرد»\n━━━━━━━━━━━━━━━━━━━━\nای دلاور! به سرزمین پارس خوش آمدی!\n\n📜 «که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\n🎁 هدیه شاهنشاه:\n🪵۲۰ 🪨۲۰ 🥇۳۰ 🩹۱ 🍞۲ 💧۲${eventText}\n\n━◦○◦━◦○◦━◦○◦━◦○◦━\n⚔️ سرنوشتت را خود رقم بزن!`;
    await sendPhoto(ctx, IMG.main, text, mainMenu());
  } else {
    const text = `🏛️ «در بارگاه جمشید باز شد»\n━━━━━━━━━━━━━━━━━━━━\nای پهلوان! به کاشانه بازگشتی\n\n🎚️ پایه: ${u.lvl}\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n🥇 زر: ${u.res.gold}\n⭐ وفاداری: ${u.loyaltyPoints || 0}${eventText}\n\n━◦○◦━◦○◦━◦○◦━◦○◦━\n🔥 «هنوز آتش کینه در سینه‌هاست»`;
    await sendPhoto(ctx, IMG.main, text, mainMenu());
  }
});

// ==================== برگشت هوشمند ====================
bot.action(/back_to_(.+)/, async (ctx) => {
  const menu = ctx.match[1];
  try { await ctx.deleteMessage(); } catch (e) {}
  switch(menu) {
    case 'main': await sendPhoto(ctx, IMG.main, '🏛️ بارگاه جمشید', mainMenu()); break;
    case 'gather': await bot.action('gather')(ctx); break;
    case 'fight': await bot.action('fight_menu')(ctx); break;
    case 'boss': await bot.action('boss_menu')(ctx); break;
    case 'pvp': await bot.action('pvp_menu')(ctx); break;
    case 'home': await bot.action('home')(ctx); break;
    case 'clinic': await bot.action('clinic')(ctx); break;
    case 'shop': await bot.action('shop')(ctx); break;
    case 'armory': await bot.action('armory')(ctx); break;
    case 'armor_shop': await bot.action('armor_shop')(ctx); break;
    case 'aramgah': await bot.action('aramgah')(ctx); break;
    case 'eat': await bot.action('eat_menu')(ctx); break;
    case 'skills': await bot.action('skills')(ctx); break;
    case 'guide': await bot.action('guide')(ctx); break;
    case 'cooldowns': await bot.action('cooldowns')(ctx); break;
    default: await sendPhoto(ctx, IMG.main, '🏛️ بارگاه جمشید', mainMenu());
  }
});

bot.action('back_main', async (ctx) => {
  try { await ctx.deleteMessage(); } catch (e) {}
  await sendPhoto(ctx, IMG.main, '🏛️ بارگاه جمشید - فرمان چیست ای پهلوان؟', mainMenu());
});

// ==================== وضعیت ====================
bot.action('status', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const pet = u.pet ? PETS[u.pet]?.n || 'ندارد' : 'ندارد';
  
  // چک دستاوردها
  const newAch = checkAchievements(u);
  let achText = '';
  if (newAch.length > 0) {
    achText = '\n\n🏆 دستاورد جدید:\n' + newAch.map(a => `${a.n} - ${a.desc}`).join('\n');
  }
  
  const text = `📊 «دیوان آمار پهلوان»\n━━━━━━━━━━━━━━━━━━━━\n👤 ${u.name} | 🎚️ پایه ${u.lvl}\n❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}\n🍞 ${Math.floor(u.hunger)} | 💧 ${Math.floor(u.thirst)}\n⚔️ ${w.n}${u.weaponEnchant?` ${u.weaponEnchant}`:''} | 🛡️ ${a.n}\n🐎 حیوان: ${pet}\n🏠 ${u.homeLvl} | 🏥 ${u.clinicLvl}\n⭐ ${u.sp||0} | ${league.n} ⭐${u.pvpRating||0}\n⚔️رزم: 🏆${u.stats.pw||0} 💀${u.stats.pl||0}\n🎖️ ${u.loyaltyPoints||0} | 📚 ${u.shahnamehCount||0}\n🏦 بانک: ${u.bankGold||0} زر\n🥇 ${u.res.gold} زر${achText}`;
  saveDB();
  await sendPhoto(ctx, IMG.status, text, smartBackBtn('main'));
});

// ==================== جستجو ====================
bot.action('gather', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'gather', CD.gather);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u, 'gather');
  
  // تأثیر حیوان خونگی
  const hasHorse = u.pet === 'horse';
  const gatherTime = hasHorse ? CD.gather * 0.7 : CD.gather;
  
  const table = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { metal: 1, stone: 2 }, { wood: 4 }, { gold: 10, metal: 1, stone: 1 }];
  const roll = table[rnd(0, table.length - 1)];
  giveReward(u, roll);
  
  let extra = '';
  const itemChance = u.pet === 'cat' ? 0.45 : 0.3;
  if (Math.random() < itemChance) { 
    const f = ['bread','fish','water','meat'][rnd(0,3)]; 
    addItem(u, f, 1); 
    extra = `\n🍽️ ${FOODS[f]?.n||f} هم یافت شد!`; 
  }
  
  u.loyaltyPoints = (u.loyaltyPoints || 0) + 1;
  u.stats.gath = (u.stats.gath || 0) + 1;
  progressQuest(u, 'gather');
  saveDB();
  
  const text = `🌲 «به بیشه نارون زدن رستم شیردل»\n━━━━━━━━━━━━━━━━━━━━\n🎁 ره‌آورد: ${rwText(roll)}${extra}${hasHorse?'\n🐎 رخش سرعت بخشید!':''}\n\n━◦○◦━◦○◦━◦○◦━◦○◦━\n⏳ ${formatTime(gatherTime)} دیگر`;
  await sendPhoto(ctx, IMG.gather, text, smartBackBtn('gather'));
});

// ==================== مبارزه ====================
bot.action('fight_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'fight', CD.fight);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await sendPhoto(ctx, IMG.fight, '⚔️ «میدان رزم - آوردگاه پهلوانان»\n━━━━━━━━━━━━━━━━━━━━\nحریف خود را برگزین:', Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات', 'f_animal'), Markup.button.callback('👹 دیوان', 'f_demon')],
    [Markup.button.callback('🎲 رندوم', 'f_random')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_fight')],
  ]));
});

bot.action('boss_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'boss', CD.boss);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  const btns = BOSSES.map((b, i) => [Markup.button.callback(`${b.n} (پایه ${b.ml}+)`, `f_boss_${i}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_to_boss')]);
  await sendPhoto(ctx, IMG.boss, '👹 «اژدهای دماوند»', Markup.inlineKeyboard(btns));
});

bot.action('f_animal', async (ctx) => fightStart(ctx, ANIMALS));
bot.action('f_demon', async (ctx) => fightStart(ctx, DEMONS));
bot.action('f_random', async (ctx) => fightStart(ctx, Math.random() < 0.5 ? ANIMALS : DEMONS));

bot.action(/f_boss_(\d+)/, async (ctx) => {
  const idx = parseInt(ctx.match[1]); const boss = BOSSES[idx];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!boss) return ctx.answerCbQuery('❌');
  if (u.lvl < boss.ml) return ctx.answerCbQuery(`❌ پایه ${boss.ml} لازم است`);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر');
  u.pending = boss; setCD(u, 'boss'); saveDB();
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - boss.p) * 4, 10, 90);
  await sendPhoto(ctx, IMG.boss, `👹 ${boss.n}\n💪 ${boss.p}\n❤️ ${boss.loss[0]}-${boss.loss[1]}\n🎁 ${rwText(boss.rew)}\n✨ ${boss.xp}\n🛡️ ${ch}%\n⚠️ خطرناک!`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'f_confirm')], [Markup.button.callback('🏃 گریختن', 'back_to_boss')],
  ]));
});

async function fightStart(ctx, pool) {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر');
  const enemy = pool[rnd(0, pool.length - 1)];
  u.pending = enemy; setCD(u, 'fight'); saveDB();
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const huntBonus = u.pet === 'falcon' ? 0.2 : 0;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.p) * 4 * (1 + huntBonus), 10, 90);
  await sendPhoto(ctx, IMG.fight, `⚔️ ${enemy.n}\n💪 ${enemy.p}\n❤️ ${enemy.loss[0]}-${enemy.loss[1]}\n🎁 ${rwText(enemy.rew)}\n✨ ${enemy.xp}\n🛡️ ${Math.floor(ch)}%${huntBonus>0?' 🦅':''}`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'f_confirm')], [Markup.button.callback('🏃 گریختن', 'back_to_fight')],
  ]));
}

bot.action('f_confirm', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending) return ctx.answerCbQuery('❌');
  const enemy = u.pending; u.pending = null;
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const dogBonus = u.pet === 'dog' ? 5 : 0;
  const pp = u.lvl * 4 + w.p + rnd(0, 8); const ep = enemy.p + rnd(0, 10);
  const raw = rnd(enemy.loss[0], enemy.loss[1]); const dmg = Math.max(1, raw - a.d - dogBonus);
  const ch = clamp(50 + (pp - ep) * 4, 10, 90); const win = Math.random() * 100 < ch;
  u.hp = clamp(u.hp - dmg, 0, u.maxHp);
  let txt;
  if (win) {
    giveReward(u, enemy.rew); addXP(u, enemy.xp);
    u.loyaltyPoints = (u.loyaltyPoints || 0) + 2;
    if (enemy.type === 'animal') u.stats.fw = (u.stats.fw||0)+1;
    else if (enemy.type === 'demon') u.stats.dw = (u.stats.dw||0)+1;
    else if (enemy.type === 'boss') u.stats.bw = (u.stats.bw||0)+1;
    progressQuest(u, 'fight');
    txt = `⚔️ «پیروزی از آن دلیران بود»\n━━━━━━━━━━━━━━━━━━━━\nبر ${enemy.n} چیره شدی!\n✨ +${enemy.xp}\n❤️ -${dmg}\n🎁 ${rwText(enemy.rew)}\n━◦○◦━◦○◦━◦○◦━◦○◦━\n🏆 «نامت جاودان باد!»`;
  } else {
    txt = `💀 «ز نیرو بود مرد را راستی»\n━━━━━━━━━━━━━━━━━━━━\nاز ${enemy.n} شکست خوردی...\n❤️ -${dmg}\n━◦○◦━◦○◦━◦○◦━◦○◦━\n🗡️ «بیاز و بکوش و دگر باره تاز!»`;
  }
  saveDB();
  await sendPhoto(ctx, IMG.fight, txt, smartBackBtn('fight'));
});

// ==================== PvP ====================
bot.action('pvp_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.jailUntil && Date.now() < u.jailUntil) return ctx.answerCbQuery(`⛓️ ${formatTime(u.jailUntil - Date.now())} دیگر`);
  const now = Date.now();
  if (u.pvpQuickReset && now > u.pvpQuickReset) { u.pvpQuickCount = 0; u.pvpQuickReset = now + 3600000; }
  if (!u.pvpQuickReset) u.pvpQuickReset = now + 3600000;
  const remaining = 10 - (u.pvpQuickCount || 0);
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const text = `🏟️ «میدان پهلوانی»\n━━━━━━━━━━━━━━━━━━━━\n🏆 ${league.n} | ⭐${u.pvpRating||0}\n🏅 ${u.honorPoints||0}\n✅ ${u.stats.pw||0} | ❌ ${u.stats.pl||0}\n⚡ نبرد سریع: ${remaining}/۱۰\n⏳ ${remaining <= 0 ? '۳ ساعت ممنوع' : formatTime(u.pvpQuickReset - now)} تا ریست`;
  await sendPhoto(ctx, IMG.pvp, text, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ نبرد سریع', 'pvp_quick')],
    [Markup.button.callback('🎯 شرط‌بندی', 'pvp_bet_menu')],
    [Markup.button.callback('🏆 رده‌ها', 'pvp_league_info')],
    [Markup.button.callback('📜 تاریخچه', 'pvp_history')],
    [Markup.button.callback('🏅 برترین‌ها', 'pvp_leaderboard')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_pvp')],
  ]));
});

bot.action('pvp_quick', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر');
  const now = Date.now();
  if (u.pvpQuickReset && now > u.pvpQuickReset) { u.pvpQuickCount = 0; u.pvpQuickReset = now + 3600000; }
  if (!u.pvpQuickReset) u.pvpQuickReset = now + 3600000;
  if ((u.pvpQuickCount || 0) >= 10) { u.jailUntil = now + 10800000; u.pvpQuickCount = 0; saveDB(); return ctx.answerCbQuery('❌ ۱۰ بار! ۳ ساعت ممنوع'); }
  
  const eligibleEnemies = Object.values(db.users).filter(enemy => enemy.id !== u.id && enemy.hp > 0 && (enemy.pvpQuickCount || 0) < 10);
  if (eligibleEnemies.length === 0) return ctx.answerCbQuery('❌ حریف آماده نیست');
  
  const enemy = eligibleEnemies[rnd(0, eligibleEnemies.length - 1)];
  const myWeapons = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p);
  if (!myWeapons.length) return ctx.answerCbQuery('❌ سلاح نداری');
  
  u.pending = { type: 'pvp', eid: enemy.id, ename: enemy.name, sw: Object.keys(WEAPONS).find(k => WEAPONS[k] === myWeapons[0]), betAmount: 0, isQuick: true };
  u.pvpQuickCount = (u.pvpQuickCount || 0) + 1;
  enemy.pvpQuickCount = (enemy.pvpQuickCount || 0) + 1;
  saveDB();
  
  const w = myWeapons[0]; const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.lvl * 4 - ew.p) * 3, 10, 90);
  await ctx.reply(`⚔️ نبرد با ${enemy.name}!\n👤 ${enemy.lvl}\n⚔️ ${ew.n}\n🗡️ تو: ${w.n}\n🎲 ${ch}%\n⚡ ${u.pvpQuickCount}/۱۰`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'pvp_atk')],
    [Markup.button.callback('🏃 گریختن', 'back_to_pvp')],
  ]));
});

bot.action('pvp_atk', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending || !u.pending.sw) return ctx.answerCbQuery('❌');
  const eid = u.pending.eid; const wk = u.pending.sw;
  const betAmount = u.pending.betAmount || 0;
  const enemy = db.users[eid]; const aname = u.name;
  u.pending = null;
  if (!enemy) return ctx.reply('❌ حریف نیست', smartBackBtn('pvp'));
  
  const w = WEAPONS[wk]; const a = ARMORS[u.armor] || ARMORS.none;
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none; const ea = ARMORS[enemy.armor] || ARMORS.none;
  const mp = u.lvl * 4 + w.p + rnd(0, 10); const ep = enemy.lvl * 4 + ew.p + rnd(0, 10);
  const ch = clamp(50 + (mp - ep) * 3, 10, 90); const win = Math.random() * 100 < ch;
  const raw = rnd(15, 40); const md = Math.max(5, raw - a.d); const ed = Math.max(5, raw - ea.d);
  
  let at, dt, ratingChange = 0, goldReward = 0;
  if (win) {
    u.hp = Math.max(0, u.hp - Math.floor(ed * 0.3)); enemy.hp = Math.max(0, enemy.hp - ed);
    goldReward = rnd(30, 80) + betAmount; ratingChange = Math.floor(rnd(20, 30));
    addRes(u, 'gold', goldReward); addXP(u, rnd(15, 35));
    u.stats.pw = (u.stats.pw || 0) + 1; enemy.stats.pl = (enemy.stats.pl || 0) + 1;
    u.pvpRating = (u.pvpRating || 0) + ratingChange; enemy.pvpRating = Math.max(0, (enemy.pvpRating || 0) - rnd(10, 20));
    u.pvpStreak = (u.pvpStreak || 0) + 1; enemy.pvpStreak = 0;
    u.honorPoints = (u.honorPoints || 0) + rnd(5, 15);
    updateLeague(u); updateLeague(enemy);
    addToHistory(u, enemy.name, true); addToHistory(enemy, u.name, false);
    progressQuest(u, 'pvp_win');
    const taunt = ROYAL_TAUNTS[rnd(0, ROYAL_TAUNTS.length - 1)];
    at = `👑 «شاهنشاه فرمودند...»\n━━━━━━━━━━━━━━━━━━━━\nبر ${enemy.name} چیره شدی!\n\n${taunt}\n\n❤️ -${Math.floor(ed*0.3)}\n🥇 +${goldReward}\n⭐ +${ratingChange}\n❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${aname} به تو تاخت!\n❌ شکست!\n❤️ -${ed}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  } else {
    u.hp = Math.max(0, u.hp - md); enemy.hp = Math.max(0, enemy.hp - Math.floor(ed*0.3));
    ratingChange = rnd(10, 20);
    u.stats.pl = (u.stats.pl || 0) + 1; enemy.stats.pw = (enemy.stats.pw || 0) + 1;
    u.pvpRating = Math.max(0, (u.pvpRating || 0) - ratingChange);
    enemy.pvpRating = (enemy.pvpRating || 0) + Math.floor(ratingChange*0.7);
    u.pvpStreak = Math.min(0, (u.pvpStreak || 0) - 1); enemy.pvpStreak = (enemy.pvpStreak || 0) + 1;
    updateLeague(u); updateLeague(enemy);
    addToHistory(u, enemy.name, false); addToHistory(enemy, u.name, true);
    if (betAmount > 0) { addRes(enemy, 'gold', betAmount); addRes(u, 'gold', -betAmount); }
    at = `💀 «چرخ گردون...»\n━━━━━━━━━━━━━━━━━━━━\nاز ${enemy.name} شکست!\n❤️ -${md}\n⭐ -${ratingChange}\n❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${aname} به تو تاخت!\n✅ دفاع کردی!\n❤️ -${Math.floor(ed*0.3)}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  }
  saveDB();
  try { await bot.telegram.sendMessage(eid, dt, Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙 بستن', 'back_to_pvp')]])); } catch (e) {}
  await sendPhoto(ctx, IMG.pvp, at, smartBackBtn('pvp'));
});

bot.action(/pvp_rev_(.+)/, async (ctx) => {
  const tid = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌');
  const enemy = db.users[tid]; if (!enemy) return ctx.answerCbQuery('❌');
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.answerCbQuery('❌');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW };
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`⚔️ انتقام از ${enemy.name}!\n🗡️:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙', 'back_to_pvp')]]));
});

bot.action(/pvp_w_(.+)/, async (ctx) => {
  const wk = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending) return ctx.answerCbQuery('❌');
  u.pending.sw = wk; saveDB();
  const w = WEAPONS[wk]; const enemy = db.users[u.pending.eid];
  if (!enemy) return ctx.answerCbQuery('❌');
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.lvl * 4 - (WEAPONS[enemy.weapon]||WEAPONS.none).p) * 3, 10, 90);
  await ctx.answerCbQuery(`${w.n} برگزیده شد`);
  await ctx.reply(`⚔️ ${enemy.name}\n🗡️ ${w.n}\n🎲 ${ch}%`, Markup.inlineKeyboard([[Markup.button.callback('⚔️ تاختن!', 'pvp_atk')], [Markup.button.callback('🏃', 'back_to_pvp')]]));
});

bot.action('pvp_bet_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await ctx.reply(`🎯 شرط‌بندی\n💰 ${u.res.gold}\n/pvp_bet [آیدی] [مبلغ]`, smartBackBtn('pvp'));
});

bot.command('pvp_bet', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const tid = args[1]; const betAmount = Number(args[2] || 0);
  if (!tid || !betAmount) return ctx.reply('/pvp_bet [آیدی] [مبلغ]');
  if (betAmount < 50) return ctx.reply('❌ ۵۰ زر');
  if (betAmount > u.res.gold) return ctx.reply('❌ زر کافی');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌');
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.reply('❌ سلاح');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW, betAmount, isBet: true };
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`🎯 ${betAmount} زر\n👤 ${enemy.name}\n🗡️:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃', 'back_to_pvp')]]));
});

bot.action('pvp_league_info', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const list = Object.entries(PVP_LEAGUES).map(([k, l]) => `${l.n}${u.pvpLeague===k?' ✅':''}: ${l.min}+`).join('\n');
  await ctx.reply(`🏆 رده‌ها\n\n${list}\n\n${PVP_LEAGUES[u.pvpLeague||'bronze'].n}\n⭐ ${u.pvpRating||0}`, smartBackBtn('pvp'));
});

bot.action('pvp_history', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const history = u.pvpHistory || [];
  if (!history.length) return ctx.answerCbQuery('📜 خالی');
  const recent = history.slice(-10).reverse();
  const text = ['📜:\n'];
  recent.forEach((b, i) => text.push(`${i+1}. ${b.win?'✅':'❌'} vs ${b.enemy}`));
  await ctx.reply(text.join('\n'), smartBackBtn('pvp'));
});

bot.action('pvp_leaderboard', async (ctx) => {
  const allUsers = Object.values(db.users).filter(u => (u.pvpRating||0) > 0).sort((a,b) => (b.pvpRating||0)-(a.pvpRating||0)).slice(0,10);
  if (!allUsers.length) return ctx.answerCbQuery('❌');
  const text = ['🏆:\n'];
  allUsers.forEach((u, i) => text.push(`${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`));
  await ctx.reply(text.join('\n'), smartBackBtn('pvp'));
});

// ==================== خانه ====================
bot.action('home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  let upInfo = '🏆 به اوج رسیده';
  if (next) upInfo = `⬆️ ارتقا به ${u.homeLvl+1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nپایه: ${next.nl}`;
  await sendPhoto(ctx, IMG.home, `🏠 «کاشانه»\n━━━━━━━━━━━━━━━━━━━━\nپایه: ${u.homeLvl}\n${upInfo}\n/upgrade_home`, Markup.inlineKeyboard([
    [Markup.button.callback('⬆️ برفراشتن', 'up_home')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_home')],
  ]));
});

bot.action('up_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.answerCbQuery('🏆');
  if (u.lvl < next.nl) return ctx.answerCbQuery(`❌ پایه ${next.nl}`);
  if (!hasRes(u, next)) return ctx.answerCbQuery('❌ منابع');
  takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3;
  saveDB();
  await ctx.answerCbQuery(`✅ ${u.homeLvl}!`);
  await sendPhoto(ctx, IMG.home, `🏠 کاشانه ${u.homeLvl}!`, smartBackBtn('home'));
});

bot.command('upgrade_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.reply('🏆');
  if (u.lvl < next.nl) return ctx.reply(`❌ پایه ${next.nl}`);
  if (!hasRes(u, next)) return ctx.reply('❌');
  takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3;
  saveDB(); await ctx.reply(`✅ ${u.homeLvl}!`);
});

// ==================== درمانگاه ====================
bot.action('clinic', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clinicLvl || u.clinicLvl < 1) u.clinicLvl = 1;
  const healAmt = 20 + u.clinicLvl * 10;
  await sendPhoto(ctx, IMG.clinic, `🏥 «دارالشفا»\n━━━━━━━━━━━━━━━━━━━━\nپایه: ${u.clinicLvl}\n❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}\n💊 ایزدی: ${u.daily.fh?'❌':'✅'} (+${healAmt})\n💰 کامل: ۲۰ زر\n/heal free | /heal gold`, Markup.inlineKeyboard([
    [Markup.button.callback('🆓 ایزدی', 'hl_free'), Markup.button.callback('💰 کامل', 'hl_gold')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_clinic')],
  ]));
});

bot.action('hl_free', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.daily.fh) return ctx.answerCbQuery('❌');
  const amt = 20 + (u.clinicLvl||1)*10;
  u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp+amt); saveDB();
  await ctx.answerCbQuery(`✅ +${amt}`);
  await ctx.reply(`✅ +${amt}\n❤️ ${u.hp}/${u.maxHp}`, smartBackBtn('clinic'));
});

bot.action('hl_gold', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.res.gold < 20) return ctx.answerCbQuery('❌ ۲۰ زر');
  addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB();
  await ctx.answerCbQuery('✅');
  await ctx.reply(`✅ درمان\n❤️ ${u.hp}/${u.maxHp}`, smartBackBtn('clinic'));
});

bot.command('heal', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  if (args[1] === 'free') {
    if (u.daily.fh) return ctx.reply('❌');
    const amt = 20+(u.clinicLvl||1)*10;
    u.daily.fh=true; u.hp=Math.min(u.maxHp,u.hp+amt); saveDB();
    return ctx.reply(`✅ +${amt}\n❤️ ${u.hp}/${u.maxHp}`);
  }
  if (args[1] === 'gold') {
    if (u.res.gold<20) return ctx.reply('❌ ۲۰ زر');
    addRes(u,'gold',-20); u.hp=u.maxHp; saveDB();
    return ctx.reply(`✅\n❤️ ${u.hp}/${u.maxHp}`);
  }
  await ctx.reply('/heal free | /heal gold');
});

// ==================== بازار ====================
bot.action('shop', async (ctx) => {
  await sendPhoto(ctx, IMG.shop, '🛒 «بازار بزرگ ری»\n━━━━━━━━━━━━━━━━━━━━\nچه می‌خواهی؟', Markup.inlineKeyboard([
    [Markup.button.callback('📦 کالا', 'sh_res'), Markup.button.callback('🍽️ خوراک', 'sh_food')],
    [Markup.button.callback('⚔️ جنگ‌افزار', 'sh_wep'), Markup.button.callback('🛡️ زره', 'sh_arm')],
    [Markup.button.callback('💰 فروختن', 'sh_sell')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_shop')],
  ]));
});

bot.action('sh_res', async (ctx) => { await ctx.reply('📦 🪵۸ 🪨۱۰ 🔩۱۸ ⛓️۲۵\n/buy [کالا] [تعداد]', smartBackBtn('shop')); });
bot.action('sh_food', async (ctx) => { await ctx.reply('🍽️ 🍞۱۰ 🍖۲۵ 💧۸\n/buy [کالا] [تعداد]', smartBackBtn('shop')); });
bot.action('sh_wep', async (ctx) => {
  const list = Object.entries(WEAPONS).filter(([k])=>k!=='none').map(([k,w])=>`${w.n}: ${w.price} زر`).join('\n');
  await sendPhoto(ctx, IMG.armory, `⚔️\n${list}\n/craft [کلید]`, smartBackBtn('shop'));
});
bot.action('sh_arm', async (ctx) => {
  const list = Object.entries(ARMORS).filter(([k])=>k!=='none').map(([k,a])=>`${a.n}: ${a.price} زر`).join('\n');
  await sendPhoto(ctx, IMG.armor_shop, `🛡️\n${list}\n/craft_armor [کلید]`, smartBackBtn('shop'));
});
bot.action('sh_sell', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  let txt = '💰 فروختن:\n';
  for (const [k,v] of Object.entries(u.res)) { if (v>0&&k!=='gold') txt += `${RES[k]} ${k}: ${v}\n`; }
  txt += '/sell [کالا] [تعداد]';
  await ctx.reply(txt, smartBackBtn('shop'));
});

bot.command('buy', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const amt = Number(args[2]||1);
  const prices = { wood:8, stone:10, metal:18, iron:25, bread:10, meat:25, water:8 };
  if (!prices[k]) return ctx.reply('❌');
  const total = prices[k]*amt;
  if (u.res.gold < total) return ctx.reply(`❌ ${total} زر`);
  addRes(u,'gold',-total);
  if (['wood','stone','metal','iron'].includes(k)) addRes(u,k,amt); else addItem(u,k,amt);
  saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.res.gold}`);
});

bot.command('sell', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const amt = Number(args[2]||1);
  const prices = { wood:4, stone:5, metal:9, iron:12, bread:5, meat:12, water:4 };
  if (!prices[k]) return ctx.reply('❌');
  if ((u.res[k]||0)<amt && (u.items[k]||0)<amt) return ctx.reply('❌');
  if (u.res[k]>=amt) { addRes(u,k,-amt); addRes(u,'gold',prices[k]*amt); }
  else { addItem(u,k,-amt); addRes(u,'gold',prices[k]*amt); }
  saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.res.gold}`);
});

// ==================== اسلحه‌خانه و زره‌خانه ====================
bot.action('armory', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(WEAPONS).filter(([k])=>k!=='none').map(([k,w]) => [Markup.button.callback(`${u.wOwned[k]?'✅':'🔨'} ${w.n} ${u.weapon===k?'⚔️':''}`, u.wOwned[k]?`eq_w_${k}`:`cr_w_${k}`)]);
  btns.push([Markup.button.callback('🔥 ارتقا', 'enchant_weapon')]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_to_armory')]);
  await sendPhoto(ctx, IMG.armory, `🛠️ «آهنگری کاوه»\n━━━━━━━━━━━━━━━━━━━━\nدر دست: ${WEAPONS[u.weapon]?.n||'نداری'}${u.weaponEnchant?` ${u.weaponEnchant}`:''}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[k]; if (!w) return ctx.answerCbQuery('❌');
  if (u.lvl < w.lvl) return ctx.answerCbQuery(`❌ پایه ${w.lvl}`);
  if (u.res.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} زر`);
  addRes(u,'gold',-w.price); u.wOwned[k]=true; saveDB();
  await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.wOwned[k]) return ctx.answerCbQuery('❌');
  u.weapon = k; saveDB(); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n}`);
});

bot.action('enchant_weapon', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.weapon === 'none') return ctx.answerCbQuery('❌ سلاح نداری');
  if (u.weaponEnchant) return ctx.answerCbQuery('❌ قبلاً ارتقا دادی');
  await ctx.reply('🔥 ارتقای سلاح (۵۰۰ زر)\n\n🔥 آتشین: آسیب +۵\n❄️ یخی: کاهش سرعت\n💀 زهر: آسیب تدریجی\n\n/enchant [fire|ice|poison]', smartBackBtn('armory'));
});

bot.command('enchant', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const type = args[1];
  if (!['fire','ice','poison'].includes(type)) return ctx.reply('❌ fire, ice, poison');
  if (u.weapon === 'none') return ctx.reply('❌ سلاح نداری');
  if (u.weaponEnchant) return ctx.reply('❌ قبلاً ارتقا دادی');
  if (u.res.gold < 500) return ctx.reply('❌ ۵۰۰ زر');
  addRes(u,'gold',-500);
  const enchants = { fire: '🔥 آتشین', ice: '❄️ یخی', poison: '💀 زهرآگین' };
  u.weaponEnchant = enchants[type];
  saveDB();
  await ctx.reply(`✅ سلاح ${enchants[type]} شد!\n⚔️ ${WEAPONS[u.weapon]?.n} ${enchants[type]}`);
});

bot.command('craft', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const w = WEAPONS[k];
  if (!w||k==='none') return ctx.reply('❌');
  if (u.lvl<w.lvl) return ctx.reply(`❌ پایه ${w.lvl}`);
  if (u.res.gold<w.price) return ctx.reply(`❌ ${w.price} زر`);
  addRes(u,'gold',-w.price); u.wOwned[k]=true; saveDB();
  await ctx.reply(`✅ ${w.n} ساخته شد!`);
});

bot.command('equip', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/); const k = args[1];
  if (!u.wOwned[k]) return ctx.reply('❌');
  u.weapon=k; saveDB(); await ctx.reply(`⚔️ ${WEAPONS[k].n}`);
});

bot.action('armor_shop', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(ARMORS).filter(([k])=>k!=='none').map(([k,a]) => [Markup.button.callback(`${u.aOwned[k]?'✅':'🔨'} ${a.n} ${u.armor===k?'🛡️':''}`, u.aOwned[k]?`eq_a_${k}`:`cr_a_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_to_armor_shop')]);
  await sendPhoto(ctx, IMG.armor_shop, `🛡️ «زرادخانه»\n━━━━━━━━━━━━━━━━━━━━\nبر تن: ${ARMORS[u.armor]?.n||'نداری'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const a = ARMORS[k]; if (!a) return ctx.answerCbQuery('❌');
  if (u.lvl < a.lvl) return ctx.answerCbQuery(`❌ پایه ${a.lvl}`);
  if (u.res.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} زر`);
  addRes(u,'gold',-a.price); u.aOwned[k]=true; saveDB();
  await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.aOwned[k]) return ctx.answerCbQuery('❌');
  u.armor = k; saveDB(); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n}`);
});

bot.command('craft_armor', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const a = ARMORS[k];
  if (!a||k==='none') return ctx.reply('❌');
  if (u.lvl<a.lvl) return ctx.reply(`❌ پایه ${a.lvl}`);
  if (u.res.gold<a.price) return ctx.reply(`❌ ${a.price} زر`);
  addRes(u,'gold',-a.price); u.aOwned[k]=true; saveDB();
  await ctx.reply(`✅ ${a.n} ساخته شد!`);
});

// ==================== NPC ====================
bot.action('npc_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'npc', CD.npc);
  const btns = Object.entries(NPCS).map(([k, npc]) => [Markup.button.callback(`${npc.n}: ${npc.desc} (${npc.price} زر)`, `npc_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_to_main')]);
  await ctx.reply(`👤 «بزرگان پارس»\n━━━━━━━━━━━━━━━━━━━━\n${cd.can?'✅ آماده':'⏳ '+formatTime(cd.rem)}\n\nبا یکی از بزرگان مشورت کن:`, Markup.inlineKeyboard(btns));
});

bot.action(/npc_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const npc = NPCS[k];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!npc) return ctx.answerCbQuery('❌');
  const cd = checkCD(u, 'npc', CD.npc);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  if (u.res.gold < npc.price) return ctx.answerCbQuery(`❌ ${npc.price} زر`);
  addRes(u, 'gold', -npc.price);
  const result = npc.effect(u);
  setCD(u, 'npc');
  saveDB();
  await ctx.answerCbQuery('✅');
  await ctx.reply(`👤 ${npc.n}\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━◦○◦━◦○◦━◦○◦━◦○◦━\n📜 «${npc.desc}»`, smartBackBtn('main'));
});

// ==================== مأموریت‌ها ====================
bot.action('quest_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.quests || u.quests.length === 0) rollDailyQuests(u);
  
  const text = ['📋 «مأموریت‌های روزانه»\n━━━━━━━━━━━━━━━━━━━━\n'];
  let allDone = true;
  
  for (const q of u.quests) {
    const progress = u.questProgress[q.target] || 0;
    const done = progress >= q.goal;
    if (!done) allDone = false;
    text.push(`${done?'✅':'⏳'} ${q.n}: ${progress}/${q.goal}`);
    text.push(`   ${q.desc}`);
    text.push(`   🎁 ${rwText(q.rew)}`);
    text.push('');
  }
  
  if (allDone) {
    text.push('🎉 همه مأموریت‌ها انجام شد!');
    text.push('برای دریافت جایزه: /claim_quests');
  }
  
  await ctx.reply(text.join('\n'), smartBackBtn('main'));
});

bot.command('claim_quests', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.quests || u.quests.length === 0) return ctx.reply('❌ مأموریتی نداری');
  
  let claimed = false;
  for (const q of u.quests) {
    const progress = u.questProgress[q.target] || 0;
    if (progress >= q.goal && !q.claimed) {
      giveReward(u, q.rew);
      if (q.rew.xp) addXP(u, q.rew.xp);
      q.claimed = true;
      claimed = true;
    }
  }
  
  if (!claimed) return ctx.reply('❌ هنوز هیچ مأموریتی کامل نشده');
  saveDB();
  await ctx.reply('✅ جایزه مأموریت‌ها دریافت شد!');
});

// ==================== حیوانات خونگی ====================
bot.action('pet_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const currentPet = u.pet ? PETS[u.pet]?.n : 'نداری';
  
  const btns = Object.entries(PETS).map(([k, pet]) => [Markup.button.callback(`${pet.n}: ${pet.bonus} (${pet.price} زر)`, `buy_pet_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_to_main')]);
  
  await ctx.reply(`🐎 «حیوانات خونگی»\n━━━━━━━━━━━━━━━━━━━━\nحیوان فعلی: ${currentPet}\n\nیک همراه انتخاب کن:`, Markup.inlineKeyboard(btns));
});

bot.action(/buy_pet_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const pet = PETS[k];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!pet) return ctx.answerCbQuery('❌');
  if (u.pet) return ctx.answerCbQuery('❌ قبلاً حیوان داری');
  if (u.res.gold < pet.price) return ctx.answerCbQuery(`❌ ${pet.price} زر`);
  addRes(u, 'gold', -pet.price);
  u.pet = k;
  saveDB();
  await ctx.answerCbQuery(`✅ ${pet.n} خریداری شد!`);
  await ctx.reply(`🐎 ${pet.n} همراه تو شد!\n✨ ${pet.bonus}`, smartBackBtn('main'));
});

// ==================== بانک ====================
bot.action('bank_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const totalInterest = u.bankInterest || 0;
  
  await ctx.reply(`🏦 «خزانه شاهی»\n━━━━━━━━━━━━━━━━━━━━\n💰 موجودی: ${u.bankGold||0} زر\n📈 سود کل: ${totalInterest} زر\n💎 سود روزانه: ۲٪\n\n💳 /deposit [مبلغ]\n💰 /withdraw [مبلغ]`, smartBackBtn('main'));
});

bot.command('deposit', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const amount = Number(args[1] || 0);
  if (!amount || amount <= 0) return ctx.reply('❌ /deposit [مبلغ]');
  if (u.res.gold < amount) return ctx.reply('❌ زر کافی نداری');
  addRes(u, 'gold', -amount);
  u.bankGold = (u.bankGold || 0) + amount;
  saveDB();
  await ctx.reply(`✅ ${amount} زر به خزانه سپرده شد\n🏦 موجودی: ${u.bankGold} زر`);
});

bot.command('withdraw', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const amount = Number(args[1] || 0);
  if (!amount || amount <= 0) return ctx.reply('❌ /withdraw [مبلغ]');
  if ((u.bankGold || 0) < amount) return ctx.reply('❌ موجودی کافی نیست');
  u.bankGold -= amount;
  addRes(u, 'gold', amount);
  saveDB();
  await ctx.reply(`✅ ${amount} زر برداشت شد\n💰 همراه: ${u.res.gold} زر`);
});

// ==================== دستاوردها ====================
bot.action('achieve_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const newAch = checkAchievements(u);
  saveDB();
  
  const text = ['🏆 «دستاوردهای پهلوانی»\n━━━━━━━━━━━━━━━━━━━━\n'];
  
  let earnedCount = 0;
  for (const ach of ACHIEVEMENTS) {
    const earned = u.achievements.includes(ach.id);
    if (earned) earnedCount++;
    text.push(`${earned?'✅':'🔒'} ${ach.n}: ${ach.desc}`);
  }
  
  text.push(`\n📊 ${earnedCount}/${ACHIEVEMENTS.length} دستاورد`);
  if (newAch.length > 0) {
    text.push(`\n🎉 دستاورد جدید:\n${newAch.map(a => a.n).join(', ')}`);
  }
  
  await ctx.reply(text.join('\n'), smartBackBtn('main'));
});

// ==================== آتشکده ====================
bot.action('aramgah', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await sendPhoto(ctx, IMG.aramgah, '🕯️ «آتشکده آذر»\n━━━━━━━━━━━━━━━━━━━━\n«پرستیدن دادگر دین ماست»', Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
    [Markup.button.callback('📖 روضه', 'p_rozeh')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_aramgah')],
  ]));
});

bot.action(['p_dua','p_namaz','p_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'pray'); const xpG = u.lvl<=3?60:30; addXP(u, xpG);
  u.loyaltyPoints = (u.loyaltyPoints||0)+3;
  progressQuest(u, 'pray');
  saveDB();
  const names = { p_dua:'دعا', p_namaz:'نماز', p_rozeh:'روضه' };
  await ctx.answerCbQuery(`✨ +${xpG}`);
  await ctx.reply(`🕯️ «اهورامزدا شنید»\n━━━━━━━━━━━━━━━━━━━━\n${names[ctx.match[0]]} پذیرفته شد!\n✨ +${xpG}\n🎚️ ${u.lvl}\n━◦○◦━◦○◦━◦○◦━◦○◦━\n🔥 «آتش مقدس خاموش مباد!»`, smartBackBtn('aramgah'));
});

// ==================== غذا ====================
bot.action('eat_menu', async (ctx) => {
  await sendPhoto(ctx, IMG.eat, '🍽️ «سفره ایرانی»\n━━━━━━━━━━━━━━━━━━━━\n«بفرمود تا سفره گستردند»', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat')],
    [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
    [Markup.button.callback('🥩 گوشت', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
    [Markup.button.callback('🍜 آش', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake')],
    [Markup.button.callback('🍯 انگبین', 'e_honey')],
    [Markup.button.callback('💧 آب', 'd_water'), Markup.button.callback('🧃 شربت', 'd_juice')],
    [Markup.button.callback('🍺 دوغ', 'd_soda'), Markup.button.callback('🍵 چای', 'd_tea')],
    [Markup.button.callback('☕ قهوه', 'd_coffee'), Markup.button.callback('🥛 شیر', 'd_milk')],
    [Markup.button.callback('🔙 بازگشت', 'back_to_eat')],
  ]));
});

bot.action(/e_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k]||0)<1) return ctx.answerCbQuery('❌');
  const food = FOODS[k]; if (!food) return ctx.answerCbQuery('❌');
  addItem(u,k,-1); if (food.h) u.hunger = Math.min(u.maxHunger, u.hunger+food.h);
  if (food.heal) u.hp = Math.min(u.maxHp, u.hp+food.heal);
  saveDB(); await ctx.answerCbQuery(`✅ ${food.n}`);
});

bot.action(/d_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k]||0)<1) return ctx.answerCbQuery('❌');
  const drink = DRINKS[k]; if (!drink) return ctx.answerCbQuery('❌');
  addItem(u,k,-1); if (drink.t) u.thirst = Math.min(u.maxThirst, u.thirst+drink.t);
  if (drink.xp) addXP(u, drink.xp);
  saveDB(); await ctx.answerCbQuery(`✅ ${drink.n}`);
});

// ==================== مهارت، راهنما، زمان‌ها، جایزه، شاهنامه ====================
bot.action('skills', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await sendPhoto(ctx, IMG.skills, `⭐ «هنرستان»\n━━━━━━━━━━━━━━━━━━━━\n«هنر نزد ایرانیان است و بس»\nگوهر: ${u.sp||0}\n⛏️ ${u.skills.g}/10 | 🏹 ${u.skills.h}/10\n🔨 ${u.skills.c}/10 | 🏕️ ${u.skills.s}/10\n/skill <g|h|c|s>`, Markup.inlineKeyboard([
    [Markup.button.callback('⛏️', 'sk_g'), Markup.button.callback('🏹', 'sk_h')],
    [Markup.button.callback('🔨', 'sk_c'), Markup.button.callback('🏕️', 'sk_s')],
    [Markup.button.callback('🔙', 'back_to_skills')],
  ]));
});

bot.action(/sk_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.sp||u.sp<=0) return ctx.answerCbQuery('❌');
  if ((u.skills[k]||0)>=10) return ctx.answerCbQuery('❌');
  u.skills[k]=(u.skills[k]||0)+1; u.sp--; saveDB();
  await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/); const k = args[1];
  if (!['g','h','c','s'].includes(k)) return ctx.reply('❌');
  if (!u.sp||u.sp<=0) return ctx.reply('❌');
  if ((u.skills[k]||0)>=10) return ctx.reply('❌');
  u.skills[k]=(u.skills[k]||0)+1; u.sp--; saveDB();
  await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`);
});

bot.action('guide', async (ctx) => {
  await sendPhoto(ctx, IMG.guide, `📖 «اوستا»\n━━━━━━━━━━━━━━━━━━━━\n🌲 ${formatTime(CD.gather)}\n⚔️ ${formatTime(CD.fight)}\n👹 ${formatTime(CD.boss)}\n🏟️ ${formatTime(CD.pvp)}\n🕯️ ${formatTime(CD.pray)}\n🎁 ${formatTime(CD.daily)}\n📜 ${formatTime(CD.shahnameh)}\n━◦○◦━◦○◦━◦○◦━◦○◦━\n📜 «به کوشش باش تا پیروز گردی»`, smartBackBtn('guide'));
});

bot.action('cooldowns', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const acts = [['gather','🌲',CD.gather],['fight','⚔️',CD.fight],['boss','👹',CD.boss],['pvp','🏟️',CD.pvp],['pray','🕯️',CD.pray],['daily','🎁',CD.daily],['shahnameh','📜',CD.shahnameh],['npc','👤',CD.npc],['quest','📋',CD.quest]];
  const lines = ['⏱️ «چرخ زمان»\n━━━━━━━━━━━━━━━━━━━━\n'];
  for (const [k,n,cd] of acts) { const c = checkCD(u,k,cd); lines.push(`${n}: ${c.can?'✅':`⏳ ${formatTime(c.rem)}`}`); }
  await sendPhoto(ctx, IMG.cooldowns, lines.join('\n'), smartBackBtn('cooldowns'));
});

bot.action('daily_reward', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u,'daily',CD.daily);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'daily');
  const reward = { gold: rnd(50,150), xp: rnd(10,30) };
  giveReward(u, reward); u.loyaltyPoints=(u.loyaltyPoints||0)+10; addXP(u,reward.xp||0); saveDB();
  await ctx.answerCbQuery('🎁 گرفتی!');
  await ctx.reply(`🎁 «خورشید برآمد»\n━━━━━━━━━━━━━━━━━━━━\n${rwText(reward)}\n✨ +${reward.xp}\n⭐ +۱۰ وفاداری\n━◦○◦━◦○◦━◦○◦━◦○◦━\n📜 «فردا باز آی»`, smartBackBtn('main'));
});

bot.command('daily', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u,'daily',CD.daily);
  if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'daily'); const reward = { gold: rnd(50,150), xp: rnd(10,30) };
  giveReward(u, reward); u.loyaltyPoints=(u.loyaltyPoints||0)+10; addXP(u,reward.xp||0); saveDB();
  await ctx.reply(`🎁 ${rwText(reward)}\n✨ +${reward.xp}\n⭐ +۱۰`);
});

bot.command('shahnameh', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u,'shahnameh',CD.shahnameh);
  if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'shahnameh'); const verse = SHAHNAMEH_VERSES[rnd(0, SHAHNAMEH_VERSES.length-1)];
  u.shahnamehCount=(u.shahnamehCount||0)+1; u.loyaltyPoints=(u.loyaltyPoints||0)+verse.reward;
  addRes(u,'gold',verse.reward); progressQuest(u, 'shahnameh'); saveDB();
  await ctx.reply(`📜 «${verse.verse}»\n━━━━━━━━━━━━━━━━━━━━\n🎁 ${verse.reward} زر\n⭐ ${verse.reward} وفاداری\n📚 ${u.shahnamehCount} شعر`);
});

bot.command('top_loyalty', async (ctx) => {
  const users = Object.values(db.users).filter(u=>(u.loyaltyPoints||0)>0).sort((a,b)=>(b.loyaltyPoints||0)-(a.loyaltyPoints||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌');
  const text = ['🏆 وفادارترین:\n'];
  users.forEach((u,i) => text.push(`${i+1}. ${u.name||'?'} | ⭐${u.loyaltyPoints||0} | 📚${u.shahnamehCount||0}`));
  await ctx.reply(text.join('\n'));
});

// ==================== دستورات PvP ====================
bot.command('pvp', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp<=0) return ctx.reply('❌');
  const args = ctx.message.text.trim().split(/\s+/); const tid = args[1];
  if (!tid) return ctx.reply('/pvp [آیدی]');
  if (tid===u.id) return ctx.reply('❌');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌');
  if (enemy.hp<=0) return ctx.reply('❌');
  const myW = Object.entries(u.wOwned).filter(([k,v])=>v&&k!=='none').map(([k])=>WEAPONS[k]).filter(w=>w).sort((a,b)=>b.p-a.p).slice(0,2);
  if (!myW.length) return ctx.reply('❌ سلاح');
  u.pending = { type:'pvp', eid:tid, ename:enemy.name, myW };
  const wbtns = myW.map(w=>[Markup.button.callback(`${w.n} (⚡${w.p})`,`pvp_w_${Object.keys(WEAPONS).find(k=>WEAPONS[k]===w)}`)]);
  await ctx.reply(`⚔️ ${enemy.name}\n🗡️:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃','back_to_pvp')]]));
});

bot.command('pvp_stats', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const total = (u.stats.pw||0)+(u.stats.pl||0);
  await ctx.reply(`📊 ${u.name}\n🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}\n⭐${u.pvpRating||0}\n🏅${u.honorPoints||0}\n✅${u.stats.pw||0} ❌${u.stats.pl||0}\n📈${total>0?Math.floor((u.stats.pw||0)/total*100):0}%`);
});

bot.command('pvp_rating', async (ctx) => {
  const allUsers = Object.values(db.users).filter(u=>(u.pvpRating||0)>0).sort((a,b)=>(b.pvpRating||0)-(a.pvpRating||0)).slice(0,20);
  if (!allUsers.length) return ctx.reply('❌');
  const text = ['🏆:\n']; allUsers.forEach((u,i)=>text.push(`${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`));
  await ctx.reply(text.join('\n'));
});

bot.command('pvp_top', async (ctx) => {
  const users = Object.values(db.users).filter(u=>(u.stats.pw||0)>0).sort((a,b)=>(b.stats.pw||0)-(a.stats.pw||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌');
  let txt = '🏆:\n\n';
  users.forEach((u,i)=>txt+=`${i+1}. ${u.name||'?'} | 🏆${u.stats.pw||0} | 💀${u.stats.pl||0} | ${u.lvl}\n`);
  await ctx.reply(txt);
});

// ==================== ادمین ====================
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const users = Object.values(db.users).sort((a,b)=>b.lvl-a.lvl).slice(0,10);
  let txt = `👥 ${Object.keys(db.users).length}\n🏆:\n`;
  users.forEach((u,i)=>txt+=`${i+1}. ${u.name||'?'} | ${u.lvl} | 🥇${u.res.gold}\n`);
  await ctx.reply(txt);
});

bot.command('admin_give', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = ctx.message.text.trim().split(/\s+/);
  const u = ensureUser(args[1],'');
  if (args[2]==='resource') addRes(u,args[3],Number(args[4]||0));
  else if (args[2]==='item') addItem(u,args[3],Number(args[4]||0));
  else if (args[2]==='weapon') u.wOwned[args[3]]=true;
  else if (args[2]==='armor') u.aOwned[args[3]]=true;
  else if (args[2]==='xp') addXP(u,Number(args[4]||0));
  saveDB(); await ctx.reply('✅');
});

bot.command('admin_full', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const u = ensureUser(ctx.message.text.trim().split(/\s+/)[1],'');
  for (const k of Object.keys(RES)) u.res[k]=9999;
  for (const k of Object.keys(WEAPONS)) u.wOwned[k]=true;
  for (const k of Object.keys(ARMORS)) u.aOwned[k]=true;
  u.weapon='zolfaghar'; u.armor='babr_bayan';
  u.lvl=20; u.hp=u.maxHp=500; u.sp=40; u.homeLvl=5; u.clinicLvl=3;
  u.pvpRating=1500; u.pvpLeague='legendary'; u.honorPoints=500;
  u.loyaltyPoints=1000; u.shahnamehCount=50;
  saveDB(); await ctx.reply('✅');
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true })
  .then(() => console.log('✅ بقای باستانی - نسخه فوق پیشرفته اجرا شد!'))
  .catch(err => console.error('❌', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));