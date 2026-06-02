const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ==================== تنظیمات ====================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_FILE = 'data.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.log('❌ لطفاً توکن ربات رو در BOT_TOKEN وارد کن');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== عکس‌ها (File ID از کانال دائمی) ====================
const IMG = {
  // حیوانات خونگی
  cat: 'AgACAgQAAxkBAAFLSgNqHmVEoburdpVCP8ScdIj12R4RwAACEQ5rG9cu8VC367-lQMBL8QEAAwIAA3kAAzsE',
  falcon: 'AgACAgQAAxkBAAFLSgJqHmVE75vYI61tA6E3m7moNEWuywACEA5rG9cu8VB3IGysH4uMaQEAAwIAA3kAAzsE',
  dog: 'AgACAgQAAxkBAAFLSgFqHmVEU5XC-_iGP-k-s0sMzR21pwACDw5rG9cu8VBg84DECuwZAgEAAwIAA3gAAzsE',
  rooster: 'AgACAgQAAxkBAAFLSgABah5lRAgSyJvOjIFAph7dPzfexDYAAg4OaxvXLvFQH7UjsIaEWwABAQADAgADeQADOwQ',
  horse: 'AgACAgQAAxkBAAFLSeZqHmNRP-DSRJCAN4lvwlFg3GImQwACDA5rG9cu8VBb2hE56qlTGQEAAwIAA3kAAzsE',
  camel: 'AgACAgQAAxkBAAFLSe5qHmPJKHl-z6SsJzk8C4g3a8jQzQACZBBrG_TM8VAOznRCTxdjtAEAAwIAA3gAAzsE',

  // موجودات
  div_sefid: 'AgACAgQAAxkBAAFLSxJqHnew0Bkx-AjWF7I6CvAHMVAmcgACEg5rG9cu8VCAQFZgFU3ADAEAAwIAA3kAAzsE',
  div_siah: 'AgACAgQAAxkBAAFLSvhqHndK4oeLefAMsjmfGeP1eeIXxgACFA5rG9cu8VDgfdaElW1QsgEAAwIAA3kAAzsE',
  div_darya: 'AgACAgQAAxkBAAFLSvtqHndO-WE4N0CRieGlRWqqTuVQUAACFQ5rG9cu8VCVfceyU9ObjQEAAwIAA3kAAzsE',
  enemy_forest: 'AgACAgQAAxkBAAFLSxpqHnfBYBoDTsASSrT9GgNpd6M5zAACFg5rG9cu8VB0Y3s7fQj1uQEAAwIAA3kAAzsE',
  boss_dragon: 'AgACAgQAAxkBAAFLSlJqHmrhJfY1Wj-C6EWwLtUji89L-gACHw5rG9cu8VDW58I6lJQeUAEAAwIAA3kAAzsE',

  // سلاح‌ها
  weapon_shop: 'AgACAgQAAxkBAAFLSzBqHnflu7-Lp2SPalHlTdHDK3eFhQACJQ5rG9cu8VAbTihb2W-hPAEAAwIAA3kAAzsE',
  
  // زره‌ها
  armor_shop: 'AgACAgQAAxkBAAFLS0BqHngL_Mv7-zBPnJwEATmmReZWgQACLQ5rG9cu8VAUu0xsyvBqGAEAAwIAA3kAAzsE',

  // بناها
  home_1: 'AgACAgQAAxkBAAFLS2lqHnijdvK2x9KbPBaeGX120T5BkgACVg5rG9cu8VAW1H_gJMdFgQEAAwIAA3kAAzsE',
  home_3: 'AgACAgQAAxkBAAFLS3FqHnilp_FrUlhr0dfH63AYk-TvzAACWQ5rG9cu8VA6w1aSYxW88wEAAwIAA3gAAzsE',
  home_5: 'AgACAgQAAxkBAAFLS3NqHnipxP3pgGv8_pmGeVjqOJYIRAACWg5rG9cu8VAbhsmD-3pnfwEAAwIAA3gAAzsE',

  // درمانگاه
  clinic_1: 'AgACAgQAAxkBAAFLS3VqHnit8UruN93dIukl9BnguMXouAACWw5rG9cu8VDBMxmJzGASBQEAAwIAA3kAAzsE',

  // مکان‌ها
  main_bg: 'AgACAgQAAxkBAAFLS3tqHni6LxUbmOFe_2Diymn2zZ8TBgACXg5rG9cu8VDliUFh-bywOQEAAwIAA3gAAzsE',
  forest: 'AgACAgQAAxkBAAFLS39qHnjCBEj-gqs9k8HEMU39EI7JLQACYQ5rG9cu8VDPeVcMLHOmowEAAwIAA3gAAzsE',
  bazaar: 'AgACAgQAAxkBAAFLS2NqHniPHBtXqGE1diPtRcpJGEHiwwACQA5rG9cu8VDWjtwJKCIbVQEAAwIAA3gAAzsE',
  fire_temple: 'AgACAgQAAxkBAAFLS39qHnjCBEj-gqs9k8HEMU39EI7JLQACYQ5rG9cu8VDPeVcMLHOmowEAAwIAA3gAAzsE',
  
  // غذاها
  food_bread: 'AgACAgQAAxkBAAFLS0pqHnggWKIn7jjdblEhWzvO0AOEogACMg5rG9cu8VClWhrIy_MWUQEAAwIAA3kAAzsE',
  food_meat: 'AgACAgQAAxkBAAFLS0xqHngjusu3h0HVCuwa5Qx0Rxz7YAACMw5rG9cu8VDFVQ9VeH8q8AEAAwIAA3gAAzsE',
  food_chicken: 'AgACAgQAAxkBAAFLS05qHngnl0e1aWohqvIofwclPuxALwACNA5rG9cu8VCgAgZEvP789QEAAwIAA3kAAzsE',
  food_steak: 'AgACAgQAAxkBAAFLS1BqHngstB2j7AsgAAHHbglafyXsM8wAAjUOaxvXLvFQ7ZVtOvkGxAEBAAMCAAN4AAM7BA',
  food_stew: 'AgACAgQAAxkBAAFLS1JqHngvEzhh0yneR44XOy6xep8dTgACNg5rG9cu8VCpCd1UYHzy1AEAAwIAA3gAAzsE',
  food_noodle: 'AgACAgQAAxkBAAFLS1RqHngzXG081SzYgTU8TCcVegLK0AACNw5rG9cu8VDfCJLaVW3VnAEAAwIAA3gAAzsE',
  food_cake: 'AgACAgQAAxkBAAFLS1ZqHng3EKj4Q4tOTn6eF8frLflDwgACOA5rG9cu8VDrwMEKj-DCsAEAAwIAA3kAAzsE',
  food_honey: 'AgACAgQAAxkBAAFLS1xqHnhG5lIfarK8tO_lZ-11QPHKbgACOw5rG9cu8VD08GWQvyuanAEAAwIAA3kAAzsE',
  
  // نوشیدنی‌ها
  drink_water: 'AgACAgQAAxkBAAFLS15qHnhJ_-v3YhU7MhqQ_yd0zrtMxQACPA5rG9cu8VBIH5YOSz5PHwEAAwIAA3gAAzsE',
  drink_juice: 'AgACAgQAAxkBAAFLS2FqHniK822La6My-wr7OD9zHJbwxAACPQ5rG9cu8VBJW0bAmLDfrgEAAwIAA3gAAzsE',
  drink_soda: 'AgACAgQAAxkBAAFLS2dqHnijd_uqW424_x_INrMEPfi2BgACSw5rG9cu8VADiwQ9QNsRRAEAAwIAA3gAAzsE',
  drink_tea: 'AgACAgQAAxkBAAFLS2hqHnijRNXwutyBobQoN1mSSLcAAbkAAlUOaxvXLvFQPXZMb2ncjSMBAAMCAAN5AAM7BA',
  drink_coffee: 'AgACAgQAAxkBAAFLS2VqHniclSmMxaarh__dadqYKZ_S-QACQw5rG9cu8VAlZFDTwh6LoAEAAwIAA3kAAzsE',
};

// ==================== دیتابیس ====================
let db = { users: {} };
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

const CD = { gather: 120000, fight: 180000, boss: 600000, pray: 21600000, pvp: 300000 };

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

// ==================== توهین‌های سلطنتی (شاهنامه‌ای) ====================
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
  '🏆 فریدون می‌گه: تو حتی لیاقت چوب دستی هم نداری!',
  '🦅 سیمرغ پرید و گفت: این باخت رو قاب کن بزن به دیوار!',
];

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
  bread: { n: '🍞 نان روغنی', h: 30, img: 'food_bread' },
  meat: { n: '🍖 کباب شکار', h: 50, img: 'food_meat' },
  fish: { n: '🐟 ماهی', h: 25 },
  chicken: { n: '🍗 ماکیان بریان', h: 45, img: 'food_chicken' },
  steak: { n: '🥩 گوشت بره', h: 70, img: 'food_steak' },
  stew: { n: '🥘 آبگوشت', h: 55, img: 'food_stew' },
  noodle: { n: '🍜 آش رشته', h: 35, img: 'food_noodle' },
  cake: { n: '🍰 باقلوا', h: 25, heal: 20, img: 'food_cake' },
  honey: { n: '🍯 انگبین', h: 20, heal: 30, img: 'food_honey' },
};

const DRINKS = {
  water: { n: '💧 آب چشمه', t: 40, img: 'drink_water' },
  juice: { n: '🧃 شربت آلبالو', t: 50, img: 'drink_juice' },
  soda: { n: '🍺 دوغ', t: 25, img: 'drink_soda' },
  tea: { n: '🍵 چای بهارنارنج', t: 35, img: 'drink_tea' },
  coffee: { n: '☕ قهوه ترک', t: 30, xp: 10, img: 'drink_coffee' },
  milk: { n: '🥛 شیر میش', t: 45 },
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
  bronze: { n: '🥉 برنز', min: 0 },
  silver: { n: '🥈 نقره', min: 100 },
  gold: { n: '🥇 طلا', min: 300 },
  diamond: { n: '💎 الماس', min: 600 },
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
      cooldowns: {}, daily: {}, stats: { pw: 0, pl: 0 }, logins: 1,
      pvpRating: 0, pvpLeague: 'bronze', pvpHistory: [], pvpStreak: 0,
      honorPoints: 0, jailUntil: 0, pet: null,
    };
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
  u.stats = u.stats || { pw: 0, pl: 0 };
  u.pvpRating = u.pvpRating || 0; u.pvpLeague = u.pvpLeague || 'bronze';
  u.pvpHistory = u.pvpHistory || []; u.pvpStreak = u.pvpStreak || 0;
  u.honorPoints = u.honorPoints || 0; u.jailUntil = u.jailUntil || 0;
  for (const k of Object.keys(RES)) { if (typeof u.res[k] !== 'number') u.res[k] = 0; }
  u.wOwned.none = true; u.aOwned.none = true;
  saveDB();
  return u;
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

// ==================== منوها ====================
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🪓 جستجو', 'gather')],
    [Markup.button.callback('⚔️ مبارزه', 'fight_menu'), Markup.button.callback('👹 باس', 'boss_menu')],
    [Markup.button.callback('⚔️ PvP', 'pvp_menu'), Markup.button.callback('🏠 خانه', 'home')],
    [Markup.button.callback('🏥 درمانگاه', 'clinic'), Markup.button.callback('🛒 بازار', 'shop')],
    [Markup.button.callback('🛠️ اسلحه‌خانه', 'armory'), Markup.button.callback('🛡️ زره‌خانه', 'armor_shop')],
    [Markup.button.callback('🕯️ آتشکده', 'aramgah'), Markup.button.callback('🍽️ غذا', 'eat_menu')],
    [Markup.button.callback('📖 راهنما', 'guide'), Markup.button.callback('⭐ مهارت', 'skills')],
    [Markup.button.callback('⏱️ زمان‌ها', 'cooldowns')],
  ]);
}

function backBtn() {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت به منوی اصلی', 'back_main')]]);
}

// ==================== استارت ====================
bot.start(async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const isNew = u.logins === 1;
  const text = isNew
    ? `🏕️ ${u.name}، به سرزمین پارس خوش اومدی!\n\n🎁 هدیه شروع:\n🪵۲۰ 🪨۲۰ 🥇۳۰ 🩹۱ 🍞۲ 💧۲\n\n🏛️ برای بقا بجنگ، قوی شو، افسانه شو!`
    : `🏕️ ${u.name}، خوش برگشتی به ایران!\n🎚️ لول: ${u.lvl} | ❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.res.gold} طلا | ⚔️ لیگ: ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}`;
  await sendPhoto(ctx, IMG.main_bg, text, mainMenu());
});

// ==================== وضعیت ====================
bot.action('status', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const text = [
    `👤 ${u.name} | 🎚️ لول ${u.lvl}`,
    `❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}`,
    `🍞 ${Math.floor(u.hunger)} | 💧 ${Math.floor(u.thirst)}`,
    `⚔️ ${w.n} | 🛡️ ${a.n}`,
    `🏠 ${u.homeLvl} | 🏥 ${u.clinicLvl}`,
    `⭐ ${u.sp || 0} | ${league.n} ⭐${u.pvpRating||0}`,
    `⚔️PvP: 🏆${u.stats.pw||0} 💀${u.stats.pl||0}`,
    `🥇 ${u.res.gold} طلا`,
  ].join('\n');
  await sendPhoto(ctx, IMG.main_bg, text, backBtn());
});

// ==================== جستجو ====================
bot.action('gather', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'gather', CD.gather);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} صبر کن`);
  setCD(u, 'gather');
  const table = [
    { wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { metal: 1, stone: 2 },
    { wood: 4 }, { gold: 10, metal: 1, stone: 1 },
  ];
  const roll = table[rnd(0, table.length - 1)];
  giveReward(u, roll);
  let extra = '';
  if (Math.random() < 0.3) {
    const f = ['bread', 'fish', 'water', 'meat'][rnd(0, 3)];
    addItem(u, f, 1);
    extra = `\n🍽️ ${FOODS[f]?.n || f} هم پیدا شد!`;
  }
  saveDB();
  await sendPhoto(ctx, IMG.forest, `🪓 جستجو در بیشه نارون...\n🎁 ${rwText(roll)}${extra}`, backBtn());
});

// ==================== مبارزه ====================
bot.action('fight_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'fight', CD.fight);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} صبر کن`);
  await sendPhoto(ctx, IMG.enemy_forest, '⚔️ میدون نبرد\nحریف انتخاب کن:', Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات', 'f_animal'), Markup.button.callback('👹 دیوان', 'f_demon')],
    [Markup.button.callback('🎲 رندوم', 'f_random')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('boss_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'boss', CD.boss);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} صبر کن`);
  const btns = BOSSES.map((b, i) => [Markup.button.callback(`${b.n} (لول ${b.ml}+)`, `f_boss_${i}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await sendPhoto(ctx, IMG.boss_dragon, '👹 باس‌های افسانه‌ای', Markup.inlineKeyboard(btns));
});

bot.action('f_animal', async (ctx) => fightStart(ctx, ANIMALS));
bot.action('f_demon', async (ctx) => fightStart(ctx, DEMONS));
bot.action('f_random', async (ctx) => fightStart(ctx, Math.random() < 0.5 ? ANIMALS : DEMONS));

bot.action(/f_boss_(\d+)/, async (ctx) => {
  const idx = parseInt(ctx.match[1]);
  const boss = BOSSES[idx];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!boss) return ctx.answerCbQuery('❌');
  if (u.lvl < boss.ml) return ctx.answerCbQuery(`❌ لول ${boss.ml} لازمه`);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  u.pending = boss; setCD(u, 'boss'); saveDB();
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - boss.p) * 4, 10, 90);
  await sendPhoto(ctx, IMG.boss_dragon, `👹 ${boss.n}\n💪 ${boss.p}\n❤️ ${boss.loss[0]}-${boss.loss[1]}\n🎁 ${rwText(boss.rew)}\n✨ ${boss.xp} XP\n🛡️ شانس: ${ch}%\n⚠️ خطرناک!`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'f_confirm')],
    [Markup.button.callback('🏃 فرار', 'back_main')],
  ]));
});

async function fightStart(ctx, pool) {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  const enemy = pool[rnd(0, pool.length - 1)];
  u.pending = enemy; setCD(u, 'fight'); saveDB();
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.p) * 4, 10, 90);
  const img = enemy.n.includes('دیو') ? IMG.div_sefid : IMG.enemy_forest;
  await sendPhoto(ctx, img, `⚔️ ${enemy.n}\n💪 ${enemy.p}\n❤️ ${enemy.loss[0]}-${enemy.loss[1]}\n🎁 ${rwText(enemy.rew)}\n✨ ${enemy.xp} XP\n🛡️ شانس: ${ch}%`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'f_confirm')],
    [Markup.button.callback('🏃 فرار', 'back_main')],
  ]));
}

bot.action('f_confirm', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending) return ctx.answerCbQuery('❌');
  const enemy = u.pending; u.pending = null;
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const pp = u.lvl * 4 + w.p + rnd(0, 8);
  const ep = enemy.p + rnd(0, 10);
  const raw = rnd(enemy.loss[0], enemy.loss[1]);
  const dmg = Math.max(1, raw - a.d);
  const ch = clamp(50 + (pp - ep) * 4, 10, 90);
  const win = Math.random() * 100 < ch;
  u.hp = clamp(u.hp - dmg, 0, u.maxHp);
  let txt;
  if (win) {
    giveReward(u, enemy.rew); addXP(u, enemy.xp);
    txt = `⚔️ ${enemy.n}\n✅ پیروزی!\n✨ +${enemy.xp} XP\n❤️ -${dmg} HP\n🎁 ${rwText(enemy.rew)}`;
  } else {
    txt = `⚔️ ${enemy.n}\n❌ شکست!\n❤️ -${dmg} HP`;
  }
  saveDB();
  await sendPhoto(ctx, IMG.enemy_forest, txt, backBtn());
});

// ==================== PvP کامل با توهین‌های سلطنتی ====================
bot.action('pvp_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.jailUntil && Date.now() < u.jailUntil) {
    const remaining = formatTime(u.jailUntil - Date.now());
    return ctx.answerCbQuery(`⛓️ تو زندانی! ${remaining} دیگه آزاد میشی`);
  }
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const nextLeague = Object.values(PVP_LEAGUES).find(l => l.min > (u.pvpRating || 0));
  
  const text = [
    `⚔️ میدان پهلوانی`,
    `🏆 لیگ: ${league.n}`,
    `⭐ امتیاز: ${u.pvpRating || 0}`,
    `🏅 افتخار: ${u.honorPoints || 0}`,
    `📊 برد: ${u.stats.pw || 0} | باخت: ${u.stats.pl || 0}`,
    nextLeague ? `\n⬆️ لیگ بعدی: ${nextLeague.n} (${nextLeague.min - (u.pvpRating || 0)} امتیاز دیگه)` : '',
  ].join('\n');
  
  await sendPhoto(ctx, IMG.enemy_forest, text, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله سریع', 'pvp_quick')],
    [Markup.button.callback('🎯 شرط‌بندی', 'pvp_bet_menu')],
    [Markup.button.callback('🏆 لیگ من', 'pvp_league_info')],
    [Markup.button.callback('📜 تاریخچه', 'pvp_history')],
    [Markup.button.callback('🏅 برترین‌ها', 'pvp_leaderboard')],
    [Markup.button.callback('🏟️ تورنمنت', 'pvp_tournament')],
    [Markup.button.callback('📖 راهنمای PvP', 'pvp_guide')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('pvp_quick', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر! برو درمانگاه');
  if (u.jailUntil && Date.now() < u.jailUntil) return ctx.answerCbQuery(`⛓️ ${formatTime(u.jailUntil - Date.now())} دیگه`);
  const cd = checkCD(u, 'pvp', CD.pvp);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  
  const myRating = u.pvpRating || 0;
  const eligibleEnemies = Object.values(db.users).filter(enemy => 
    enemy.id !== u.id && enemy.hp > 0 &&
    Math.abs((enemy.pvpRating || 0) - myRating) < 200
  );
  
  if (eligibleEnemies.length === 0) return ctx.answerCbQuery('❌ حریف هم‌سطح پیدا نشد!');
  
  const enemy = eligibleEnemies[rnd(0, eligibleEnemies.length - 1)];
  const myWeapons = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p);
  if (!myWeapons.length) return ctx.answerCbQuery('❌ سلاح نداری');
  
  u.pending = { type: 'pvp', eid: enemy.id, ename: enemy.name, sw: Object.keys(WEAPONS).find(k => WEAPONS[k] === myWeapons[0]), betAmount: 0, isQuick: true };
  setCD(u, 'pvp'); saveDB();
  
  const w = myWeapons[0]; const a = ARMORS[u.armor] || ARMORS.none;
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none; const ea = ARMORS[enemy.armor] || ARMORS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.lvl * 4 - ew.p) * 3, 10, 90);
  
  await ctx.reply(`⚔️ حمله سریع به ${enemy.name}!\n👤 لول ${enemy.lvl} | ${PVP_LEAGUES[enemy.pvpLeague||'bronze'].n}\n⚔️ ${ew.n} | 🛡️ ${ea.n}\n🗡️ سلاح تو: ${w.n}\n🎲 شانس: ${ch}%`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'pvp_atk')],
    [Markup.button.callback('🏃 فرار', 'back_main')],
  ]));
});

bot.action('pvp_bet_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر!');
  if (u.jailUntil && Date.now() < u.jailUntil) return ctx.answerCbQuery(`⛓️ زندانی!`);
  await ctx.reply(`🎯 شرط‌بندی PvP\n💰 موجودی: ${u.res.gold} طلا\n\n/pvp_bet [آیدی] [مبلغ]\nمثال: /pvp_bet 123456789 500`, backBtn());
});

bot.command('pvp_bet', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const tid = args[1]; const betAmount = Number(args[2] || 0);
  if (u.hp <= 0) return ctx.reply('❌ HP صفر!');
  if (!tid || !betAmount) return ctx.reply('/pvp_bet [آیدی] [مبلغ]');
  if (betAmount < 50) return ctx.reply('❌ حداقل شرط: ۵۰ طلا');
  if (betAmount > u.res.gold) return ctx.reply('❌ پول کافی نداری');
  if (tid === u.id) return ctx.reply('❌ با خودت که نمیشه!');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌ حریف پیدا نشد');
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.reply('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW, betAmount, isBet: true };
  setCD(u, 'pvp'); saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`🎯 شرط: ${betAmount} طلا!\n👤 حریف: ${enemy.name}\n🗡️ سلاح:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'back_main')]]));
});

bot.action(/pvp_w_(.+)/, async (ctx) => {
  const wk = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending || u.pending.type !== 'pvp') return ctx.answerCbQuery('❌ منقضی');
  u.pending.sw = wk; saveDB();
  const w = WEAPONS[wk]; const enemy = db.users[u.pending.eid];
  if (!enemy) return ctx.answerCbQuery('❌');
  const a = ARMORS[u.armor] || ARMORS.none; const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.lvl * 4 - ew.p) * 3, 10, 90);
  await ctx.answerCbQuery(`${w.n} انتخاب شد`);
  await ctx.reply(`⚔️ حمله به ${enemy.name}\n🗡️ ${w.n} (⚡${w.p})\n🛡️ ${a.n}\n🎲 ${ch}%\n🏠 تخریب: ${Math.floor(ch*0.3)}%\n📦 غارت: ${Math.floor(ch*0.4)}%`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'pvp_atk')],
    [Markup.button.callback('🏃 انصراف', 'back_main')],
  ]));
});

bot.action('pvp_atk', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending || !u.pending.sw) return ctx.answerCbQuery('❌');
  const eid = u.pending.eid; const wk = u.pending.sw;
  const betAmount = u.pending.betAmount || 0;
  const enemy = db.users[eid]; const aname = u.name;
  u.pending = null;
  if (!enemy) return ctx.reply('❌ حریف نیست', backBtn());
  
  const w = WEAPONS[wk]; const a = ARMORS[u.armor] || ARMORS.none;
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none; const ea = ARMORS[enemy.armor] || ARMORS.none;
  const mp = u.lvl * 4 + w.p + rnd(0, 10); const ep = enemy.lvl * 4 + ew.p + rnd(0, 10);
  const ch = clamp(50 + (mp - ep) * 3, 10, 90);
  const win = Math.random() * 100 < ch;
  const raw = rnd(15, 40); const md = Math.max(5, raw - a.d); const ed = Math.max(5, raw - ea.d);
  
  let at, dt, ratingChange = 0, goldReward = 0, destroyed = false, armorBroke = false, petStolen = false;
  const streakBonus = (u.pvpStreak || 0) >= 3 ? 1.5 : 1;
  
  if (win) {
    u.hp = Math.max(0, u.hp - Math.floor(ed * 0.3)); enemy.hp = Math.max(0, enemy.hp - ed);
    goldReward = rnd(30, 80) + betAmount; ratingChange = Math.floor(rnd(20, 30) * streakBonus);
    addRes(u, 'gold', goldReward); addXP(u, rnd(15, 35));
    u.stats.pw = (u.stats.pw || 0) + 1; enemy.stats.pl = (enemy.stats.pl || 0) + 1;
    u.pvpRating = (u.pvpRating || 0) + ratingChange; enemy.pvpRating = Math.max(0, (enemy.pvpRating || 0) - rnd(10, 20));
    u.pvpStreak = (u.pvpStreak || 0) + 1; enemy.pvpStreak = 0;
    u.honorPoints = (u.honorPoints || 0) + rnd(5, 15);
    if (Math.random() < 0.1 && enemy.homeLvl > 1) { enemy.homeLvl--; destroyed = true; }
    if (Math.random() < 0.05 && enemy.armor !== 'none') { enemy.aOwned[enemy.armor] = false; enemy.armor = 'none'; armorBroke = true; }
    if (Math.random() < 0.03 && enemy.pet && !u.pet) { u.pet = enemy.pet; enemy.pet = null; petStolen = true; }
    updateLeague(u); updateLeague(enemy);
    addToHistory(u, enemy.name, true); addToHistory(enemy, u.name, false);
    if ((enemy.pvpStreak || 0) <= -5) enemy.jailUntil = Date.now() + 3600000;
    
    const taunt = ROYAL_TAUNTS[rnd(0, ROYAL_TAUNTS.length - 1)];
    at = `⚔️ حمله به ${enemy.name}\n✅ پیروزی! ${taunt}\n\n❤️ -${Math.floor(ed*0.3)} HP\n🥇 +${goldReward}\n⭐ +${ratingChange}\n🔥 برد متوالی: ${u.pvpStreak||0}\n${destroyed?'🏠 خونه حریف تخریب شد!\n':''}${armorBroke?'💥 زره حریف شکست!\n':''}${petStolen?'🐎 حیوان حریف رو دزدیدی!\n':''}\n❤️ ${u.hp}/${u.maxHp} | 🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}`;
    dt = `⚔️ ${aname} به شما حمله کرد!\n❌ باختی!\n❤️ -${ed} HP\n${betAmount>0?`💸 ${betAmount} طلا باختی!\n`:''}${destroyed?'🏠 خونه‌ات تخریب شد!\n':''}${armorBroke?'💥 زره‌ات شکست!\n':''}${petStolen?'🐎 حیوانت رو دزدیدن!\n':''}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  } else {
    u.hp = Math.max(0, u.hp - md); enemy.hp = Math.max(0, enemy.hp - Math.floor(ed*0.3));
    ratingChange = rnd(10, 20);
    u.stats.pl = (u.stats.pl || 0) + 1; enemy.stats.pw = (enemy.stats.pw || 0) + 1;
    u.pvpRating = Math.max(0, (u.pvpRating || 0) - ratingChange); enemy.pvpRating = (enemy.pvpRating || 0) + Math.floor(ratingChange*0.7);
    u.pvpStreak = Math.min(0, (u.pvpStreak || 0) - 1); enemy.pvpStreak = (enemy.pvpStreak || 0) + 1;
    updateLeague(u); updateLeague(enemy);
    addToHistory(u, enemy.name, false); addToHistory(enemy, u.name, true);
    if (betAmount > 0) { addRes(enemy, 'gold', betAmount); addRes(u, 'gold', -betAmount); }
    if ((u.pvpStreak || 0) <= -5) u.jailUntil = Date.now() + 3600000;
    at = `⚔️ حمله به ${enemy.name}\n❌ باختی!\n❤️ -${md} HP\n${betAmount>0?`💸 ${betAmount} طلا از دست دادی!\n`:''}⭐ -${ratingChange}\n💀 باخت متوالی: ${Math.abs(u.pvpStreak||0)}\n❤️ ${u.hp}/${u.maxHp}\n${(u.pvpStreak||0)<=-5?'⛓️ ۱ ساعت زندان!':''}`;
    dt = `⚔️ ${aname} به شما حمله کرد!\n✅ دفاع موفق!\n❤️ -${Math.floor(ed*0.3)} HP\n${betAmount>0?`💰 ${betAmount} طلا بردی!\n`:''}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  }
  saveDB();
  try { await bot.telegram.sendMessage(eid, dt, Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙 بستن', 'back_main')]])); } catch (e) {}
  await sendPhoto(ctx, IMG.enemy_forest, at, backBtn());
});

bot.action(/pvp_rev_(.+)/, async (ctx) => {
  const tid = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  const enemy = db.users[tid]; if (!enemy) return ctx.answerCbQuery('❌');
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.answerCbQuery('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW }; setCD(u, 'pvp'); saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`⚔️ انتقام از ${enemy.name}!\n🗡️ سلاح:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙 بی‌خیال', 'back_main')]]));
});

bot.action('pvp_league_info', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const current = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const list = Object.entries(PVP_LEAGUES).map(([k, l]) => `${l.n}${u.pvpLeague===k?' ✅':''}: ${l.min}+ امتیاز`).join('\n');
  await ctx.reply(`🏆 لیگ‌های PvP\n\n${list}\n\nلیگ فعلی: ${current.n}\nامتیاز: ${u.pvpRating||0}\n\nهر برد: +۲۰~۳۰\nهر باخت: -۱۰~۲۰\nبرد متوالی: ×۱.۵`, backBtn());
});

bot.action('pvp_history', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const history = u.pvpHistory || [];
  if (!history.length) return ctx.answerCbQuery('📜 تاریخچه خالیه!');
  const recent = history.slice(-10).reverse();
  const text = ['📜 تاریخچه ۱۰ نبرد آخر:\n'];
  recent.forEach((b, i) => text.push(`${i+1}. ${b.win?'✅ برد':'❌ باخت'} vs ${b.enemy} | ${new Date(b.time).toLocaleDateString('fa-IR')}`));
  await ctx.reply(text.join('\n'), backBtn());
});

bot.action('pvp_leaderboard', async (ctx) => {
  const allUsers = Object.values(db.users).filter(u => (u.pvpRating||0) > 0).sort((a,b) => (b.pvpRating||0) - (a.pvpRating||0)).slice(0,10);
  if (!allUsers.length) return ctx.answerCbQuery('❌ هنوز کسی PvP نکرده');
  const text = ['🏆 برترین مبارزان:\n'];
  allUsers.forEach((u, i) => text.push(`${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`));
  await ctx.reply(text.join('\n'), backBtn());
});

bot.action('pvp_tournament', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await ctx.reply(`🏟️ تورنمنت هفتگی\n📅 شنبه تا جمعه\n🎁 جوایز:\n🥇 ۱۰۰۰ طلا + زره طلایی\n🥈 ۵۰۰ طلا + شمشیر رستم\n🥉 ۲۰۰ طلا\n📊 امتیاز: ${u.pvpRating||0}`, backBtn());
});

bot.action('pvp_guide', async (ctx) => {
  await ctx.reply(`📖 راهنمای PvP\n⚔️ حمله سریع: حریف هم‌سطح\n🎯 شرط‌بندی: طلا بذار\n🏆 لیگ: با برد برو بالا\n🔥 برد متوالی: ×۱.۵\n⛓️ ۵ باخت: ۱ ساعت زندان\n💥 شانس شکستن زره\n🐎 شانس دزدیدن حیوان`, backBtn());
});

bot.command('pvp', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.reply('❌ HP صفر');
  if (u.jailUntil && Date.now() < u.jailUntil) return ctx.reply(`⛓️ ${formatTime(u.jailUntil - Date.now())}`);
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  const args = ctx.message.text.trim().split(/\s+/); const tid = args[1];
  if (!tid) return ctx.reply('/pvp [آیدی]');
  if (tid === u.id) return ctx.reply('❌ با خودت نه');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌ پیدا نشد');
  if (enemy.hp <= 0) return ctx.reply('❌ حریف HP صفر');
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.reply('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW }; setCD(u, 'pvp'); saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`⚔️ حمله به ${enemy.name}\n🗡️ سلاح:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'back_main')]]));
});

bot.command('pvp_stats', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const total = (u.stats.pw||0) + (u.stats.pl||0);
  const text = `📊 آمار ${u.name}\n🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}\n🏅 ${u.honorPoints||0} | 📊 ${total} نبرد\n✅ ${u.stats.pw||0} | ❌ ${u.stats.pl||0}\n📈 ${total>0?Math.floor((u.stats.pw||0)/total*100):0}%\n🔥 ${u.pvpStreak||0} | ⛓️ ${u.jailUntil&&Date.now()<u.jailUntil?formatTime(u.jailUntil-Date.now()):'آزاد'}`;
  await ctx.reply(text, backBtn());
});

bot.command('pvp_rating', async (ctx) => {
  const allUsers = Object.values(db.users).filter(u => (u.pvpRating||0) > 0).sort((a,b) => (b.pvpRating||0)-(a.pvpRating||0)).slice(0,20);
  if (!allUsers.length) return ctx.reply('❌ هنوز کسی PvP نکرده');
  const text = ['🏆 رتبه‌بندی:\n'];
  allUsers.forEach((u, i) => text.push(`${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`));
  await ctx.reply(text.join('\n'), backBtn());
});

bot.command('pvp_top', async (ctx) => {
  const users = Object.values(db.users).filter(u => (u.stats.pw||0) > 0).sort((a,b) => (b.stats.pw||0)-(a.stats.pw||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌ هنوز PvP نشده');
  let txt = '🏆 برترین مبارزان:\n\n';
  users.forEach((u, i) => txt += `${i+1}. ${u.name||'?'} | 🏆${u.stats.pw||0} برد | 💀${u.stats.pl||0} باخت | لول ${u.lvl}\n`);
  await ctx.reply(txt, backBtn());
});

// ==================== خانه ====================
bot.action('home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  let upInfo = '🏆 حداکثر';
  if (next) upInfo = `⬆️ ارتقا به ${u.homeLvl+1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nلول: ${next.nl}`;
  const homeImg = u.homeLvl >= 5 ? IMG.home_5 : u.homeLvl >= 3 ? IMG.home_3 : IMG.home_1;
  await sendPhoto(ctx, homeImg, `🏠 خانه لول ${u.homeLvl}\n\n${upInfo}\n\n/upgrade_home`, Markup.inlineKeyboard([
    [Markup.button.callback('⬆️ ارتقا', 'up_home')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('up_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.answerCbQuery('🏆 حداکثر');
  if (u.lvl < next.nl) return ctx.answerCbQuery(`❌ لول ${next.nl} لازمه`);
  if (!hasRes(u, next)) return ctx.answerCbQuery('❌ منابع کافی نیست');
  takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2;
  if (u.homeLvl >= 5) u.clinicLvl = 3;
  saveDB();
  await ctx.answerCbQuery(`✅ لول ${u.homeLvl}!`);
  const homeImg = u.homeLvl >= 5 ? IMG.home_5 : u.homeLvl >= 3 ? IMG.home_3 : IMG.home_1;
  await sendPhoto(ctx, homeImg, `🏠 خانه لول ${u.homeLvl} ارتقا یافت!`, backBtn());
});

bot.command('upgrade_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.reply('🏆 حداکثر');
  if (u.lvl < next.nl) return ctx.reply(`❌ لول ${next.nl} لازمه`);
  if (!hasRes(u, next)) return ctx.reply('❌ منابع کافی نیست');
  takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2;
  if (u.homeLvl >= 5) u.clinicLvl = 3;
  saveDB();
  await ctx.reply(`✅ خانه لول ${u.homeLvl}!`, backBtn());
});

// ==================== درمانگاه ====================
bot.action('clinic', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clinicLvl || u.clinicLvl < 1) u.clinicLvl = 1;
  const healAmt = 20 + u.clinicLvl * 10;
  await sendPhoto(ctx, IMG.clinic_1, `🏥 درمانگاه لول ${u.clinicLvl}\n❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}\n💊 رایگان: ${u.daily.fh ? '❌' : '✅'} (+${healAmt}HP)\n💰 کامل: ۲۰ طلا\n\n/heal free | /heal gold`, Markup.inlineKeyboard([
    [Markup.button.callback('🆓 درمان رایگان', 'hl_free'), Markup.button.callback('💰 درمان کامل', 'hl_gold')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('hl_free', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.daily.fh) return ctx.answerCbQuery('❌ استفاده شده');
  const amt = 20 + (u.clinicLvl || 1) * 10;
  u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB();
  await ctx.answerCbQuery(`✅ +${amt} HP`);
  await ctx.reply(`✅ +${amt} HP\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.action('hl_gold', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.res.gold < 20) return ctx.answerCbQuery('❌ ۲۰ طلا');
  addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB();
  await ctx.answerCbQuery('✅ درمان کامل');
  await ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.command('heal', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  if (args[1] === 'free') {
    if (u.daily.fh) return ctx.reply('❌ استفاده شده');
    const amt = 20 + (u.clinicLvl || 1) * 10;
    u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB();
    return ctx.reply(`✅ +${amt} HP\n❤️ ${u.hp}/${u.maxHp}`);
  }
  if (args[1] === 'gold') {
    if (u.res.gold < 20) return ctx.reply('❌ ۲۰ طلا');
    addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB();
    return ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`);
  }
  await ctx.reply('/heal free | /heal gold');
});

// ==================== بازار ====================
bot.action('shop', async (ctx) => {
  await sendPhoto(ctx, IMG.bazaar, '🛒 بازار بزرگ', Markup.inlineKeyboard([
    [Markup.button.callback('📦 منابع', 'sh_res'), Markup.button.callback('🍽️ غذا', 'sh_food')],
    [Markup.button.callback('⚔️ سلاح', 'sh_wep'), Markup.button.callback('🛡️ زره', 'sh_arm')],
    [Markup.button.callback('💰 فروش', 'sh_sell')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('sh_res', async (ctx) => {
  await ctx.reply('📦 منابع:\n\n🪵 چوب: ۸ طلا\n🪨 سنگ: ۱۰ طلا\n🔩 فلز: ۱۸ طلا\n⛓️ آهن: ۲۵ طلا\n\n/buy [نوع] [تعداد]\nمثال: /buy wood 5', backBtn());
});

bot.action('sh_food', async (ctx) => {
  await ctx.reply('🍽️ غذا:\n\n🍞 نان: ۱۰ طلا\n🍖 گوشت: ۲۵ طلا\n💧 آب: ۸ طلا\n\n/buy [نوع] [تعداد]', backBtn());
});

bot.action('sh_wep', async (ctx) => {
  const list = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => `${w.n}: ${w.price} طلا`).join('\n');
  await sendPhoto(ctx, IMG.weapon_shop, `⚔️ سلاح‌ها:\n\n${list}\n\n/craft [کلید]\nمثال: /craft knife`, backBtn());
});

bot.action('sh_arm', async (ctx) => {
  const list = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => `${a.n}: ${a.price} طلا`).join('\n');
  await sendPhoto(ctx, IMG.armor_shop, `🛡️ زره‌ها:\n\n${list}\n\n/craft_armor [کلید]\nمثال: /craft_armor leather`, backBtn());
});

bot.action('sh_sell', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  let txt = '💰 فروش:\n\n';
  for (const [k, v] of Object.entries(u.res)) {
    if (v > 0 && k !== 'gold') txt += `${RES[k]} ${k}: ${v} (قیمت: ${Math.floor(({wood:4,stone:5,metal:9,iron:12}[k]||5))} طلا)\n`;
  }
  txt += '\n/sell [نوع] [تعداد]\nمثال: /sell wood 5';
  await ctx.reply(txt, backBtn());
});

bot.command('buy', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const key = args[1]; const amt = Number(args[2] || 1);
  const prices = { wood: 8, stone: 10, metal: 18, iron: 25, bread: 10, meat: 25, water: 8 };
  if (!prices[key]) return ctx.reply('❌ کالا نامعتبر');
  const total = prices[key] * amt;
  if (u.res.gold < total) return ctx.reply(`❌ ${total} طلا لازم داری`);
  addRes(u, 'gold', -total);
  if (['wood','stone','metal','iron'].includes(key)) addRes(u, key, amt);
  else addItem(u, key, amt);
  saveDB();
  await ctx.reply(`✅ ${amt} ${key} خریداری شد\n💰 ${u.res.gold} طلا`, backBtn());
});

bot.command('sell', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const key = args[1]; const amt = Number(args[2] || 1);
  const prices = { wood: 4, stone: 5, metal: 9, iron: 12, bread: 5, meat: 12, water: 4 };
  if (!prices[key]) return ctx.reply('❌ کالا نامعتبر');
  if ((u.res[key] || 0) < amt && (u.items[key] || 0) < amt) return ctx.reply('❌ نداری');
  if (u.res[key] >= amt) { addRes(u, key, -amt); addRes(u, 'gold', prices[key] * amt); }
  else { addItem(u, key, -amt); addRes(u, 'gold', prices[key] * amt); }
  saveDB();
  await ctx.reply(`✅ ${amt} ${key} فروخته شد\n💰 ${u.res.gold} طلا`, backBtn());
});

// ==================== اسلحه‌خانه ====================
bot.action('armory', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => [Markup.button.callback(`${u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''}`, u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await sendPhoto(ctx, IMG.weapon_shop, `🛠️ اسلحه‌خانه\nفعلی: ${WEAPONS[u.weapon]?.n || 'ندارد'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[k]; if (!w) return ctx.answerCbQuery('❌');
  if (u.lvl < w.lvl) return ctx.answerCbQuery(`❌ لول ${w.lvl} لازمه`);
  if (u.res.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} طلا`);
  addRes(u, 'gold', -w.price); u.wOwned[k] = true; saveDB();
  await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.wOwned[k]) return ctx.answerCbQuery('❌ نداری');
  u.weapon = k; saveDB(); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n} تجهیز شد`);
});

bot.command('craft', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const w = WEAPONS[k];
  if (!w || k === 'none') return ctx.reply('❌ سلاح نامعتبر');
  if (u.lvl < w.lvl) return ctx.reply(`❌ لول ${w.lvl} لازمه`);
  if (u.res.gold < w.price) return ctx.reply(`❌ ${w.price} طلا`);
  addRes(u, 'gold', -w.price); u.wOwned[k] = true; saveDB();
  await ctx.reply(`✅ ${w.n} ساخته شد!`, backBtn());
});

bot.command('equip', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1];
  if (!u.wOwned[k]) return ctx.reply('❌ نداری');
  u.weapon = k; saveDB();
  await ctx.reply(`⚔️ ${WEAPONS[k].n} تجهیز شد`, backBtn());
});

// ==================== زره‌خانه ====================
bot.action('armor_shop', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => [Markup.button.callback(`${u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''}`, u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await sendPhoto(ctx, IMG.armor_shop, `🛡️ زره‌خانه\nفعلی: ${ARMORS[u.armor]?.n || 'ندارد'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const a = ARMORS[k]; if (!a) return ctx.answerCbQuery('❌');
  if (u.lvl < a.lvl) return ctx.answerCbQuery(`❌ لول ${a.lvl} لازمه`);
  if (u.res.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} طلا`);
  addRes(u, 'gold', -a.price); u.aOwned[k] = true; saveDB();
  await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.aOwned[k]) return ctx.answerCbQuery('❌ نداری');
  u.armor = k; saveDB(); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n} تجهیز شد`);
});

bot.command('craft_armor', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const a = ARMORS[k];
  if (!a || k === 'none') return ctx.reply('❌ زره نامعتبر');
  if (u.lvl < a.lvl) return ctx.reply(`❌ لول ${a.lvl} لازمه`);
  if (u.res.gold < a.price) return ctx.reply(`❌ ${a.price} طلا`);
  addRes(u, 'gold', -a.price); u.aOwned[k] = true; saveDB();
  await ctx.reply(`✅ ${a.n} ساخته شد!`, backBtn());
});

// ==================== آتشکده ====================
bot.action('aramgah', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await sendPhoto(ctx, IMG.fire_temple, '🕯️ آتشکده آذر\nنور الهی...', Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
    [Markup.button.callback('📖 روضه', 'p_rozeh')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action(['p_dua', 'p_namaz', 'p_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u, 'pray'); const xpG = u.lvl <= 3 ? 60 : 30; addXP(u, xpG); saveDB();
  const names = { p_dua: 'دعا', p_namaz: 'نماز', p_rozeh: 'روضه' };
  await ctx.answerCbQuery(`✨ +${xpG} XP`);
  await ctx.reply(`✅ ${names[ctx.match[0]]} قبول باشه!\n✨ +${xpG} XP\n🎚️ لول: ${u.lvl}`, backBtn());
});

// ==================== غذا ====================
bot.action('eat_menu', async (ctx) => {
  await ctx.reply('🍽️ سفره ایرانی', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان روغنی', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat')],
    [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
    [Markup.button.callback('🥩 گوشت بره', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
    [Markup.button.callback('🍜 آش رشته', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake')],
    [Markup.button.callback('🍯 انگبین', 'e_honey')],
    [Markup.button.callback('💧 آب', 'd_water'), Markup.button.callback('🧃 شربت', 'd_juice')],
    [Markup.button.callback('🍺 دوغ', 'd_soda'), Markup.button.callback('🍵 چای', 'd_tea')],
    [Markup.button.callback('☕ قهوه', 'd_coffee'), Markup.button.callback('🥛 شیر', 'd_milk')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action(/e_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
  const food = FOODS[k]; if (!food) return ctx.answerCbQuery('❌');
  addItem(u, k, -1);
  if (food.h) u.hunger = Math.min(u.maxHunger, u.hunger + food.h);
  if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal);
  saveDB();
  await ctx.answerCbQuery(`✅ ${food.n} خورده شد`);
});

bot.action(/d_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
  const drink = DRINKS[k]; if (!drink) return ctx.answerCbQuery('❌');
  addItem(u, k, -1);
  if (drink.t) u.thirst = Math.min(u.maxThirst, u.thirst + drink.t);
  if (drink.xp) addXP(u, drink.xp);
  saveDB();
  await ctx.answerCbQuery(`✅ ${drink.n} نوشیده شد`);
});

// ==================== مهارت ====================
bot.action('skills', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await ctx.reply(`⭐ مهارت‌ها | ${u.sp||0} امتیاز\n⛏️ جمع‌آوری: ${u.skills.g}/10\n🏹 شکار: ${u.skills.h}/10\n🔨 صنعتگری: ${u.skills.c}/10\n🏕️ بقا: ${u.skills.s}/10\n/skill <g|h|c|s>`, Markup.inlineKeyboard([
    [Markup.button.callback('⛏️', 'sk_g'), Markup.button.callback('🏹', 'sk_h')],
    [Markup.button.callback('🔨', 'sk_c'), Markup.button.callback('🏕️', 'sk_s')],
    [Markup.button.callback('🔙', 'back_main')],
  ]));
});

bot.action(/sk_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.sp || u.sp <= 0) return ctx.answerCbQuery('❌ امتیاز نداری');
  if ((u.skills[k] || 0) >= 10) return ctx.answerCbQuery('❌ حداکثر');
  u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB();
  await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1];
  if (!['g','h','c','s'].includes(k)) return ctx.reply('❌ g, h, c, s');
  if (!u.sp || u.sp <= 0) return ctx.reply('❌ امتیاز نداری');
  if ((u.skills[k] || 0) >= 10) return ctx.reply('❌ حداکثر');
  u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB();
  await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`, backBtn());
});

// ==================== راهنما ====================
bot.action('guide', async (ctx) => {
  await ctx.reply(`📖 راهنمای بقا\n\n🪓 جستجو: ${formatTime(CD.gather)}\n⚔️ مبارزه: ${formatTime(CD.fight)}\n👹 باس: ${formatTime(CD.boss)}\n⚔️ PvP: ${formatTime(CD.pvp)}\n🕯️ آتشکده: ${formatTime(CD.pray)}\n\n🛡️ زره آسیب رو کم می‌کنه\n🍞 غذا گرسنگی\n💧 نوشیدنی تشنگی\n⭐ مهارت با لول آپ\n👑 لیگ PvP با برد`, backBtn());
});

// ==================== زمان‌ها ====================
bot.action('cooldowns', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const acts = [
    ['gather', '🪓 جستجو', CD.gather], ['fight', '⚔️ مبارزه', CD.fight],
    ['boss', '👹 باس', CD.boss], ['pvp', '⚔️ PvP', CD.pvp], ['pray', '🕯️ آتشکده', CD.pray],
  ];
  const lines = ['⏱️ زمان‌ها:\n'];
  for (const [k, n, cd] of acts) {
    const c = checkCD(u, k, cd);
    lines.push(`${n}: ${c.can ? '✅' : `⏳ ${formatTime(c.rem)}`}`);
  }
  await ctx.reply(lines.join('\n'), backBtn());
});

// ==================== برگشت ====================
bot.action('back_main', async (ctx) => {
  try { await ctx.deleteMessage(); } catch (e) {}
  await sendPhoto(ctx, IMG.main_bg, '🏕️ منوی اصلی', mainMenu());
});

// ==================== ادمین ====================
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const users = Object.values(db.users).sort((a, b) => b.lvl - a.lvl).slice(0, 10);
  let txt = `👥 ${Object.keys(db.users).length} کاربر\n🏆 برتر:\n`;
  users.forEach((u, i) => txt += `${i+1}. ${u.name||'?'} | لول ${u.lvl} | 🥇${u.res.gold}\n`);
  await ctx.reply(txt);
});

bot.command('admin_give', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = ctx.message.text.trim().split(/\s+/);
  const u = ensureUser(args[1], '');
  if (args[2] === 'resource') addRes(u, args[3], Number(args[4]||0));
  else if (args[2] === 'item') addItem(u, args[3], Number(args[4]||0));
  else if (args[2] === 'weapon') u.wOwned[args[3]] = true;
  else if (args[2] === 'armor') u.aOwned[args[3]] = true;
  else if (args[2] === 'xp') addXP(u, Number(args[4]||0));
  saveDB(); await ctx.reply('✅');
});

bot.command('admin_full', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const u = ensureUser(ctx.message.text.trim().split(/\s+/)[1], '');
  for (const k of Object.keys(RES)) u.res[k] = 9999;
  for (const k of Object.keys(WEAPONS)) u.wOwned[k] = true;
  for (const k of Object.keys(ARMORS)) u.aOwned[k] = true;
  u.weapon = 'zolfaghar'; u.armor = 'babr_bayan';
  u.lvl = 20; u.hp = u.maxHp = 500; u.sp = 40; u.homeLvl = 5; u.clinicLvl = 3;
  u.pvpRating = 1500; u.pvpLeague = 'legendary'; u.honorPoints = 500;
  saveDB(); await ctx.reply('✅');
});

// ==================== خطایابی ====================
bot.catch((err, ctx) => {
  console.error('❌ خطا:', err.message);
  try { ctx.reply('❌ خطایی رخ داد. دوباره تلاش کن.'); } catch (e) {}
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true })
  .then(() => console.log('✅ ربات بقا - نسخه شاهنامه با عکس و PvP پیشرفته اجرا شد!'))
  .catch(err => console.error('❌ خطای راه‌اندازی:', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));