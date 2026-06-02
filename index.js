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

// ==================== عکس‌های جدید ====================
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

const CD = { gather: 120000, fight: 180000, boss: 600000, pray: 21600000, pvp: 300000, daily: 86400000, shahnameh: 3600000 };

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

// ==================== اشعار شاهنامه ====================
const SHAHNAMEH_VERSES = [
  { verse: 'توانا بود هر که دانا بود', reward: 15 },
  { verse: 'به نام خداوند جان و خرد', reward: 10 },
  { verse: 'میازار موری که دانه‌کش است', reward: 20 },
  { verse: 'که جان و خرد را فزاید همی', reward: 12 },
  { verse: 'ز دانش دل پیر برنا بود', reward: 18 },
  { verse: 'هنر نزد ایرانیان است و بس', reward: 25 },
  { verse: 'ندارند شیر ژیان را به کس', reward: 20 },
  { verse: 'چو ایران نباشد تن من مباد', reward: 30 },
  { verse: 'بکوشید و از تن مپیچید روی', reward: 15 },
  { verse: 'که این دشت و هامون و این بوم و بر', reward: 10 },
];

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
  bread: { n: '🍞 نان روغنی', h: 30 },
  meat: { n: '🍖 کباب شکار', h: 50 },
  fish: { n: '🐟 ماهی', h: 25 },
  chicken: { n: '🍗 ماکیان بریان', h: 45 },
  steak: { n: '🥩 گوشت بره', h: 70 },
  stew: { n: '🥘 آبگوشت', h: 55 },
  noodle: { n: '🍜 آش رشته', h: 35 },
  cake: { n: '🍰 باقلوا', h: 25, heal: 20 },
  honey: { n: '🍯 انگبین', h: 20, heal: 30 },
};

const DRINKS = {
  water: { n: '💧 آب چشمه', t: 40 },
  juice: { n: '🧃 شربت آلبالو', t: 50 },
  soda: { n: '🍺 دوغ', t: 25 },
  tea: { n: '🍵 چای بهارنارنج', t: 35 },
  coffee: { n: '☕ قهوه ترک', t: 30, xp: 10 },
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
      loyaltyPoints: 0, lastDaily: 0, shahnamehCount: 0,
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
  u.loyaltyPoints = u.loyaltyPoints || 0;
  u.lastDaily = u.lastDaily || 0;
  u.shahnamehCount = u.shahnamehCount || 0;
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
    [Markup.button.callback('📊 دیوان آمار', 'status'), Markup.button.callback('🌲 بیشه نارون', 'gather')],
    [Markup.button.callback('⚔️ میدان رزم', 'fight_menu'), Markup.button.callback('👹 اژدها', 'boss_menu')],
    [Markup.button.callback('🏟️ میدان پهلوانی', 'pvp_menu'), Markup.button.callback('🏠 کاشانه', 'home')],
    [Markup.button.callback('🏥 دارالشفا', 'clinic'), Markup.button.callback('🛒 بازار بزرگ', 'shop')],
    [Markup.button.callback('🛠️ آهنگری', 'armory'), Markup.button.callback('🛡️ زرادخانه', 'armor_shop')],
    [Markup.button.callback('🕯️ آتشکده', 'aramgah'), Markup.button.callback('🍽️ سفره', 'eat_menu')],
    [Markup.button.callback('📖 اوستا', 'guide'), Markup.button.callback('⭐ هنرستان', 'skills')],
    [Markup.button.callback('⏱️ چرخ زمان', 'cooldowns'), Markup.button.callback('🎁 جایزه روزانه', 'daily_reward')],
  ]);
}

function backBtn() {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت به بارگاه', 'back_main')]]);
}

// ==================== استارت ====================
bot.start(async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const isNew = u.logins === 1;
  
  // امتیاز وفاداری روزانه
  const today = new Date().toDateString();
  if (u.lastLoginDate !== today) {
    u.loyaltyPoints = (u.loyaltyPoints || 0) + 5;
    u.lastLoginDate = today;
    saveDB();
  }
  
  if (isNew) {
    const text = [
      `🏛️ «به نام خداوند جان و خرد»`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `ای دلاور! به سرزمین پارس خوش آمدی!`,
      ``,
      `📜 از زبان رستم دستان بشنو:`,
      `«که این دشت و هامون و این بوم و بر`,
      `همه جای جنگ است و جای هنر»`,
      ``,
      `🎁 هدیه شاهنشاه برای آغاز رزم:`,
      `🪵 بیست چوب | 🪨 بیست سنگ`,
      `🥇 سی طلا | 🩹 یک باند`,
      `🍞 دو نان | 💧 دو آب`,
      ``,
      `━◦○◦━◦○◦━◦○◦━◦○◦━`,
      `⚔️ سرنوشتت را خود رقم بزن!`,
      `🏛️ جاودان باشی در ایران زمین`,
    ].join('\n');
    await sendPhoto(ctx, IMG.main, text, mainMenu());
  } else {
    const text = [
      `🏛️ «در بارگاه جمشید باز شد»`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `ای پهلوان! به کاشانه بازگشتی`,
      ``,
      `🎚️ پایه: ${u.lvl}`,
      `❤️ تندرستی: ${u.hp}/${u.maxHp}`,
      `🥇 زر: ${u.res.gold}`,
      `⭐ امتیاز وفاداری: ${u.loyaltyPoints || 0}`,
      `📅 دفعات ورود: ${u.logins}`,
      ``,
      `━◦○◦━◦○◦━◦○◦━◦○◦━`,
      `🔥 «هنوز آتش کینه در سینه‌هاست»`,
    ].join('\n');
    await sendPhoto(ctx, IMG.main, text, mainMenu());
  }
});

// ==================== جایزه روزانه ====================
bot.action('daily_reward', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'daily', CD.daily);
  
  if (!cd.can) {
    return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر صبر کن`);
  }
  
  setCD(u, 'daily');
  
  const rewards = [
    { gold: rnd(50, 150), xp: rnd(10, 30) },
    { gold: rnd(30, 100), bread: 2, water: 2 },
    { gold: rnd(80, 200), gem: 1 },
    { gold: rnd(20, 80), meat: 2, bandage: 1 },
  ];
  
  const reward = rewards[rnd(0, rewards.length - 1)];
  giveReward(u, reward);
  u.loyaltyPoints = (u.loyaltyPoints || 0) + 10;
  addXP(u, reward.xp || 0);
  saveDB();
  
  const text = [
    `🎁 «خورشید برآمد، روز نو شد»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `جایزه امروزت از خزانه شاهنشاه:`,
    ``,
    `${rwText(reward)}`,
    reward.xp ? `✨ نام‌آوری: +${reward.xp}` : '',
    `⭐ امتیاز وفاداری: +۱۰`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `📜 «فردا باز آی تا برکت یابی»`,
  ].filter(l => l).join('\n');
  
  await ctx.answerCbQuery('🎁 جایزه گرفتی!');
  await ctx.reply(text, backBtn());
});

bot.command('daily', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'daily', CD.daily);
  if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
  
  setCD(u, 'daily');
  const reward = { gold: rnd(50, 150), xp: rnd(10, 30) };
  giveReward(u, reward);
  u.loyaltyPoints = (u.loyaltyPoints || 0) + 10;
  addXP(u, reward.xp || 0);
  saveDB();
  
  await ctx.reply(`🎁 جایزه روزانه:\n${rwText(reward)}\n✨ +${reward.xp} XP\n⭐ +۱۰ وفاداری\n\n📜 «فردا باز آی تا برکت یابی»`, backBtn());
});

// ==================== شاهنامه‌خوانی ====================
bot.command('shahnameh', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'shahnameh', CD.shahnameh);
  
  if (!cd.can) {
    return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر می‌توانی شاهنامه بخوانی`);
  }
  
  setCD(u, 'shahnameh');
  const verse = SHAHNAMEH_VERSES[rnd(0, SHAHNAMEH_VERSES.length - 1)];
  u.shahnamehCount = (u.shahnamehCount || 0) + 1;
  u.loyaltyPoints = (u.loyaltyPoints || 0) + verse.reward;
  addRes(u, 'gold', verse.reward);
  saveDB();
  
  const text = [
    `📜 «از گنجینه شاهنامه فردوسی»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `«${verse.verse}»`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🎁 پاداش شعرخوانی:`,
    `🥇 ${verse.reward} زر`,
    `⭐ ${verse.reward} امتیاز وفاداری`,
    `📚 تعداد شعرهای خوانده شده: ${u.shahnamehCount}`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `🕯️ «جاودان باد نام و یاد فردوسی»`,
  ].join('\n');
  
  await ctx.reply(text, backBtn());
});

bot.command('top_loyalty', async (ctx) => {
  const users = Object.values(db.users)
    .filter(u => (u.loyaltyPoints || 0) > 0)
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
    .slice(0, 10);
  
  if (!users.length) return ctx.reply('❌ هنوز کسی امتیاز وفاداری ندارد');
  
  const text = ['🏆 وفادارترین پهلوانان:\n'];
  users.forEach((u, i) => {
    text.push(`${i + 1}. ${u.name || '?'} | ⭐${u.loyaltyPoints || 0} | 📚${u.shahnamehCount || 0} شعر`);
  });
  
  await ctx.reply(text.join('\n'), backBtn());
});

// ==================== وضعیت ====================
bot.action('status', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  
  const text = [
    `📊 «دیوان آمار پهلوان»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 ${u.name} | 🎚️ پایه ${u.lvl}`,
    `❤️ تندرستی: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}`,
    `🍞 گرسنگی: ${Math.floor(u.hunger)} | 💧 تشنگی: ${Math.floor(u.thirst)}`,
    `⚔️ سلاح: ${w.n}`,
    `🛡️ زره: ${a.n}`,
    `🏠 کاشانه: ${u.homeLvl} | 🏥 دارالشفا: ${u.clinicLvl}`,
    `⭐ هنر: ${u.sp || 0} | ${league.n} ⭐${u.pvpRating||0}`,
    `⚔️ رزم: 🏆${u.stats.pw||0} 💀${u.stats.pl||0}`,
    `🎖️ وفاداری: ${u.loyaltyPoints || 0}`,
    `📚 شاهنامه: ${u.shahnamehCount || 0} شعر`,
    `🥇 زر: ${u.res.gold}`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `📜 «توانا بود هر که دانا بود»`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.status, text, backBtn());
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
    extra = `\n🍽️ ${FOODS[f]?.n || f} هم یافت شد!`;
  }
  
  u.loyaltyPoints = (u.loyaltyPoints || 0) + 1;
  saveDB();
  
  const text = [
    `🌲 «به بیشه نارون زدن رستم شیردل»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `به جستجو پرداختی...`,
    ``,
    `🎁 ره‌آورد: ${rwText(roll)}${extra}`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `⏳ «باز هم شکار توانی کرد»`,
    `${formatTime(CD.gather)} دیگر`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.gather, text, backBtn());
});

// ==================== مبارزه ====================
bot.action('fight_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'fight', CD.fight);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} صبر کن`);
  
  const text = [
    `⚔️ «میدان رزم - آوردگاه پهلوانان»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `حریف خود را برگزین:`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.fight, text, Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات', 'f_animal'), Markup.button.callback('👹 دیوان', 'f_demon')],
    [Markup.button.callback('🎲 رندوم', 'f_random')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('boss_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'boss', CD.boss);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} صبر کن`);
  
  const btns = BOSSES.map((b, i) => [Markup.button.callback(`${b.n} (پایه ${b.ml}+)`, `f_boss_${i}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  
  await sendPhoto(ctx, IMG.boss, '👹 «اژدهای دماوند - ضحاک ماردوش»', Markup.inlineKeyboard(btns));
});

bot.action('f_animal', async (ctx) => fightStart(ctx, ANIMALS));
bot.action('f_demon', async (ctx) => fightStart(ctx, DEMONS));
bot.action('f_random', async (ctx) => fightStart(ctx, Math.random() < 0.5 ? ANIMALS : DEMONS));

bot.action(/f_boss_(\d+)/, async (ctx) => {
  const idx = parseInt(ctx.match[1]);
  const boss = BOSSES[idx];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!boss) return ctx.answerCbQuery('❌');
  if (u.lvl < boss.ml) return ctx.answerCbQuery(`❌ پایه ${boss.ml} لازم است`);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر');
  u.pending = boss; setCD(u, 'boss'); saveDB();
  
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - boss.p) * 4, 10, 90);
  
  const text = [
    `👹 «${boss.n} نمایان شد!»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💪 زور دشمن: ${boss.p}`,
    `❤️ آسیب: ${boss.loss[0]}-${boss.loss[1]}`,
    `🎁 تاراج: ${rwText(boss.rew)}`,
    `✨ نام‌آوری: ${boss.xp}`,
    `🛡️ شانس پیروزی: ${ch}%`,
    ``,
    `⚠️ «دلیرانه بتاز و مگریز!»`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.boss, text, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'f_confirm')],
    [Markup.button.callback('🏃 گریختن', 'back_main')],
  ]));
});

async function fightStart(ctx, pool) {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر');
  const enemy = pool[rnd(0, pool.length - 1)];
  u.pending = enemy; setCD(u, 'fight'); saveDB();
  
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.p) * 4, 10, 90);
  
  const text = [
    `⚔️ «${enemy.n} پدیدار گشت!»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💪 زور: ${enemy.p}`,
    `❤️ آسیب: ${enemy.loss[0]}-${enemy.loss[1]}`,
    `🎁 تاراج: ${rwText(enemy.rew)}`,
    `✨ نام‌آوری: ${enemy.xp}`,
    `🛡️ شانس: ${ch}%`,
    ``,
    `🗡️ «دلیرانه بتاز!»`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.fight, text, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'f_confirm')],
    [Markup.button.callback('🏃 گریختن', 'back_main')],
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
    u.loyaltyPoints = (u.loyaltyPoints || 0) + 2;
    txt = [
      `⚔️ «پیروزی از آن دلیران بود»`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `بر ${enemy.n} چیره شدی!`,
      ``,
      `✨ نام‌آوری: +${enemy.xp}`,
      `❤️ زخم: -${dmg}`,
      `🎁 تاراج: ${rwText(enemy.rew)}`,
      ``,
      `━◦○◦━◦○◦━◦○◦━◦○◦━`,
      `🏆 «نامت جاودان باد، ای پهلوان!»`,
    ].join('\n');
  } else {
    txt = [
      `💀 «ز نیرو بود مرد را راستی»`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `از ${enemy.n} شکست خوردی...`,
      ``,
      `❤️ زخم: -${dmg}`,
      ``,
      `━◦○◦━◦○◦━◦○◦━◦○◦━`,
      `🗡️ «بیاز و بکوش و دگر باره تاز!»`,
    ].join('\n');
  }
  saveDB();
  await sendPhoto(ctx, IMG.fight, txt, backBtn());
});

// ==================== PvP ====================
bot.action('pvp_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.jailUntil && Date.now() < u.jailUntil) {
    return ctx.answerCbQuery(`⛓️ در سیاه‌چال هستی! ${formatTime(u.jailUntil - Date.now())} دیگر`);
  }
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  
  const text = [
    `🏟️ «میدان پهلوانی - گود زورخانه»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🏆 رده: ${league.n}`,
    `⭐ نام‌آوری: ${u.pvpRating || 0}`,
    `🏅 بلندآوازگی: ${u.honorPoints || 0}`,
    `✅ پیروزی: ${u.stats.pw || 0} | ❌ شکست: ${u.stats.pl || 0}`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `⚔️ «حریف می‌طلبی؟ پا پیش نِه!»`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.pvp, text, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ نبرد سریع', 'pvp_quick')],
    [Markup.button.callback('🎯 شرط‌بندی', 'pvp_bet_menu')],
    [Markup.button.callback('🏆 رده‌ها', 'pvp_league_info')],
    [Markup.button.callback('📜 تاریخچه', 'pvp_history')],
    [Markup.button.callback('🏅 برترین‌ها', 'pvp_leaderboard')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('pvp_quick', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
  if (u.jailUntil && Date.now() < u.jailUntil) return ctx.answerCbQuery(`⛓️ ${formatTime(u.jailUntil - Date.now())}`);
  const cd = checkCD(u, 'pvp', CD.pvp);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  
  const myRating = u.pvpRating || 0;
  const eligibleEnemies = Object.values(db.users).filter(enemy => 
    enemy.id !== u.id && enemy.hp > 0 &&
    Math.abs((enemy.pvpRating || 0) - myRating) < 200
  );
  
  if (eligibleEnemies.length === 0) return ctx.answerCbQuery('❌ حریف هم‌پایه نیست!');
  
  const enemy = eligibleEnemies[rnd(0, eligibleEnemies.length - 1)];
  const myWeapons = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p);
  if (!myWeapons.length) return ctx.answerCbQuery('❌ سلاح نداری');
  
  u.pending = { type: 'pvp', eid: enemy.id, ename: enemy.name, sw: Object.keys(WEAPONS).find(k => WEAPONS[k] === myWeapons[0]), betAmount: 0, isQuick: true };
  setCD(u, 'pvp'); saveDB();
  
  const w = myWeapons[0]; const a = ARMORS[u.armor] || ARMORS.none;
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none; const ea = ARMORS[enemy.armor] || ARMORS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.lvl * 4 - ew.p) * 3, 10, 90);
  
  await ctx.reply(`⚔️ نبرد با ${enemy.name}!\n👤 پایه ${enemy.lvl}\n⚔️ ${ew.n} | 🛡️ ${ea.n}\n🗡️ سلاح تو: ${w.n}\n🎲 شانس: ${ch}%`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'pvp_atk')],
    [Markup.button.callback('🏃 گریختن', 'back_main')],
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
  
  let at, dt, ratingChange = 0, goldReward = 0;
  const streakBonus = (u.pvpStreak || 0) >= 3 ? 1.5 : 1;
  
  if (win) {
    u.hp = Math.max(0, u.hp - Math.floor(ed * 0.3)); enemy.hp = Math.max(0, enemy.hp - ed);
    goldReward = rnd(30, 80) + betAmount; ratingChange = Math.floor(rnd(20, 30) * streakBonus);
    addRes(u, 'gold', goldReward); addXP(u, rnd(15, 35));
    u.stats.pw = (u.stats.pw || 0) + 1; enemy.stats.pl = (enemy.stats.pl || 0) + 1;
    u.pvpRating = (u.pvpRating || 0) + ratingChange; enemy.pvpRating = Math.max(0, (enemy.pvpRating || 0) - rnd(10, 20));
    u.pvpStreak = (u.pvpStreak || 0) + 1; enemy.pvpStreak = 0;
    u.honorPoints = (u.honorPoints || 0) + rnd(5, 15);
    updateLeague(u); updateLeague(enemy);
    addToHistory(u, enemy.name, true); addToHistory(enemy, u.name, false);
    
    const taunt = ROYAL_TAUNTS[rnd(0, ROYAL_TAUNTS.length - 1)];
    at = `👑 «شاهنشاه فرمودند...»\n━━━━━━━━━━━━━━━━━━━━\nبر ${enemy.name} چیره شدی!\n\n${taunt}\n\n❤️ زخم: -${Math.floor(ed*0.3)}\n🥇 زر: +${goldReward}\n⭐ نام‌آوری: +${ratingChange}\n🔥 پیاپی: ${u.pvpStreak||0}\n\n❤️ ${u.hp}/${u.maxHp} | 🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}`;
    dt = `⚔️ ${aname} به تو تاخت!\n❌ شکست خوردی!\n❤️ زخم: -${ed}\n${betAmount>0?`💸 ${betAmount} زر باختی!\n`:''}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  } else {
    u.hp = Math.max(0, u.hp - md); enemy.hp = Math.max(0, enemy.hp - Math.floor(ed*0.3));
    ratingChange = rnd(10, 20);
    u.stats.pl = (u.stats.pl || 0) + 1; enemy.stats.pw = (enemy.stats.pw || 0) + 1;
    u.pvpRating = Math.max(0, (u.pvpRating || 0) - ratingChange); enemy.pvpRating = (enemy.pvpRating || 0) + Math.floor(ratingChange*0.7);
    u.pvpStreak = Math.min(0, (u.pvpStreak || 0) - 1); enemy.pvpStreak = (enemy.pvpStreak || 0) + 1;
    updateLeague(u); updateLeague(enemy);
    addToHistory(u, enemy.name, false); addToHistory(enemy, u.name, true);
    if (betAmount > 0) { addRes(enemy, 'gold', betAmount); addRes(u, 'gold', -betAmount); }
    at = `💀 «چرخ گردون نخواهد که بمانی»\n━━━━━━━━━━━━━━━━━━━━\nاز ${enemy.name} شکست خوردی...\n\n❤️ زخم: -${md}\n${betAmount>0?`💸 ${betAmount} زر باختی!\n`:''}⭐ نام‌آوری: -${ratingChange}\n\n❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${aname} به تو تاخت!\n✅ دفاع کردی!\n❤️ زخم: -${Math.floor(ed*0.3)}\n${betAmount>0?`💰 ${betAmount} زر بردی!\n`:''}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  }
  saveDB();
  try { await bot.telegram.sendMessage(eid, dt, Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙 بستن', 'back_main')]])); } catch (e) {}
  await sendPhoto(ctx, IMG.pvp, at, backBtn());
});

bot.action(/pvp_rev_(.+)/, async (ctx) => {
  const tid = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر');
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  const enemy = db.users[tid]; if (!enemy) return ctx.answerCbQuery('❌');
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.answerCbQuery('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW }; setCD(u, 'pvp'); saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`⚔️ انتقام از ${enemy.name}!\n🗡️ سلاح:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙 بی‌خیال', 'back_main')]]));
});

bot.action(/pvp_w_(.+)/, async (ctx) => {
  const wk = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending || u.pending.type !== 'pvp') return ctx.answerCbQuery('❌ منقضی');
  u.pending.sw = wk; saveDB();
  const w = WEAPONS[wk]; const enemy = db.users[u.pending.eid];
  if (!enemy) return ctx.answerCbQuery('❌');
  const a = ARMORS[u.armor] || ARMORS.none; const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
  const ch = clamp(50 + (u.lvl * 4 + w.p - enemy.lvl * 4 - ew.p) * 3, 10, 90);
  await ctx.answerCbQuery(`${w.n} برگزیده شد`);
  await ctx.reply(`⚔️ تاختن به ${enemy.name}\n🗡️ ${w.n} (⚡${w.p})\n🛡️ ${a.n}\n🎲 شانس: ${ch}%\n🏠 ویرانی: ${Math.floor(ch*0.3)}%\n📦 تاراج: ${Math.floor(ch*0.4)}%`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ تاختن!', 'pvp_atk')],
    [Markup.button.callback('🏃 گریختن', 'back_main')],
  ]));
});

bot.action('pvp_bet_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
  await ctx.reply(`🎯 شرط‌بندی\n💰 زر موجود: ${u.res.gold}\n\n/pvp_bet [آیدی] [مبلغ]\nمثال: /pvp_bet 123456789 500`, backBtn());
});

bot.command('pvp_bet', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const tid = args[1]; const betAmount = Number(args[2] || 0);
  if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر!');
  if (!tid || !betAmount) return ctx.reply('/pvp_bet [آیدی] [مبلغ]');
  if (betAmount < 50) return ctx.reply('❌ کمینه شرط: ۵۰ زر');
  if (betAmount > u.res.gold) return ctx.reply('❌ زر کافی نداری');
  if (tid === u.id) return ctx.reply('❌ با خودت که نمی‌شود!');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌ حریف نیست');
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.reply('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW, betAmount, isBet: true };
  setCD(u, 'pvp'); saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`🎯 شرط: ${betAmount} زر!\n👤 حریف: ${enemy.name}\n🗡️ سلاح:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'back_main')]]));
});

bot.action('pvp_league_info', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const current = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const list = Object.entries(PVP_LEAGUES).map(([k, l]) => `${l.n}${u.pvpLeague===k?' ✅':''}: ${l.min}+ امتیاز`).join('\n');
  await ctx.reply(`🏆 رده‌های پهلوانی\n\n${list}\n\nرده کنونی: ${current.n}\nامتیاز: ${u.pvpRating||0}`, backBtn());
});

bot.action('pvp_history', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const history = u.pvpHistory || [];
  if (!history.length) return ctx.answerCbQuery('📜 تاریخچه خالیست!');
  const recent = history.slice(-10).reverse();
  const text = ['📜 تاریخچه ۱۰ نبرد:\n'];
  recent.forEach((b, i) => text.push(`${i+1}. ${b.win?'✅ پیروزی':'❌ شکست'} در برابر ${b.enemy}`));
  await ctx.reply(text.join('\n'), backBtn());
});

bot.action('pvp_leaderboard', async (ctx) => {
  const allUsers = Object.values(db.users).filter(u => (u.pvpRating||0) > 0).sort((a,b) => (b.pvpRating||0) - (a.pvpRating||0)).slice(0,10);
  if (!allUsers.length) return ctx.answerCbQuery('❌ هنوز کسی در میدان نیست');
  const text = ['🏆 برترین پهلوانان:\n'];
  allUsers.forEach((u, i) => text.push(`${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`));
  await ctx.reply(text.join('\n'), backBtn());
});

bot.command('pvp', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر');
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  const args = ctx.message.text.trim().split(/\s+/); const tid = args[1];
  if (!tid) return ctx.reply('/pvp [آیدی]\nمثال: /pvp 123456789');
  if (tid === u.id) return ctx.reply('❌ با خودت نمی‌شود');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌ پیدا نشد');
  if (enemy.hp <= 0) return ctx.reply('❌ حریف تندرستی صفر');
  const myW = Object.entries(u.wOwned).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 2);
  if (!myW.length) return ctx.reply('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW }; setCD(u, 'pvp'); saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.reply(`⚔️ تاختن به ${enemy.name}\n🗡️ سلاح:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'back_main')]]));
});

bot.command('pvp_stats', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const total = (u.stats.pw||0) + (u.stats.pl||0);
  const text = `📊 آمار ${u.name}\n🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}\n🏅 ${u.honorPoints||0} | 📊 ${total} نبرد\n✅ ${u.stats.pw||0} | ❌ ${u.stats.pl||0}`;
  await ctx.reply(text, backBtn());
});

bot.command('pvp_rating', async (ctx) => {
  const allUsers = Object.values(db.users).filter(u => (u.pvpRating||0) > 0).sort((a,b) => (b.pvpRating||0)-(a.pvpRating||0)).slice(0,20);
  if (!allUsers.length) return ctx.reply('❌ هنوز کسی در میدان نیست');
  const text = ['🏆 رتبه‌بندی:\n'];
  allUsers.forEach((u, i) => text.push(`${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`));
  await ctx.reply(text.join('\n'), backBtn());
});

bot.command('pvp_top', async (ctx) => {
  const users = Object.values(db.users).filter(u => (u.stats.pw||0) > 0).sort((a,b) => (b.stats.pw||0)-(a.stats.pw||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌ هنوز پهلوانی در میدان نیست');
  let txt = '🏆 برترین پهلوانان:\n\n';
  users.forEach((u, i) => txt += `${i+1}. ${u.name||'?'} | 🏆${u.stats.pw||0} پیروزی | 💀${u.stats.pl||0} شکست | پایه ${u.lvl}\n`);
  await ctx.reply(txt, backBtn());
});

// ==================== خانه ====================
bot.action('home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  let upInfo = '🏆 به اوج رسیده';
  if (next) upInfo = `⬆️ ارتقا به پایه ${u.homeLvl+1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nپایه لازم: ${next.nl}`;
  
  const text = [
    `🏠 «کاشانه - آشیانه امن»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `پایه کاشانه: ${u.homeLvl}`,
    ``,
    `${upInfo}`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `🔨 «کاشانه‌ات را برفراز تا ایمن باشی!»`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.home, text, Markup.inlineKeyboard([
    [Markup.button.callback('⬆️ برفراشتن', 'up_home')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('up_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.answerCbQuery('🏆 به اوج رسیده');
  if (u.lvl < next.nl) return ctx.answerCbQuery(`❌ پایه ${next.nl} لازم است`);
  if (!hasRes(u, next)) return ctx.answerCbQuery('❌ منابع کافی نیست');
  takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2;
  if (u.homeLvl >= 5) u.clinicLvl = 3;
  saveDB();
  await ctx.answerCbQuery(`✅ پایه ${u.homeLvl}!`);
  await sendPhoto(ctx, IMG.home, `🏠 کاشانه به پایه ${u.homeLvl} برفراشته شد!`, backBtn());
});

bot.command('upgrade_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.reply('🏆 به اوج رسیده');
  if (u.lvl < next.nl) return ctx.reply(`❌ پایه ${next.nl} لازم است`);
  if (!hasRes(u, next)) return ctx.reply('❌ منابع کافی نیست');
  takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2;
  if (u.homeLvl >= 5) u.clinicLvl = 3;
  saveDB();
  await ctx.reply(`✅ کاشانه پایه ${u.homeLvl}!`, backBtn());
});

// ==================== درمانگاه ====================
bot.action('clinic', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clinicLvl || u.clinicLvl < 1) u.clinicLvl = 1;
  const healAmt = 20 + u.clinicLvl * 10;
  
  const text = [
    `🏥 «دارالشفای بوعلی - حکیم‌خانه»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `پایه: ${u.clinicLvl}`,
    `❤️ تندرستی: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}`,
    `💊 درمان ایزدی: ${u.daily.fh ? '❌' : '✅'} (+${healAmt})`,
    `💰 درمان کامل: بیست زر`,
    ``,
    `/heal free | /heal gold`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.clinic, text, Markup.inlineKeyboard([
    [Markup.button.callback('🆓 درمان ایزدی', 'hl_free'), Markup.button.callback('💰 درمان کامل', 'hl_gold')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('hl_free', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.daily.fh) return ctx.answerCbQuery('❌ به کار رفته');
  const amt = 20 + (u.clinicLvl || 1) * 10;
  u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB();
  await ctx.answerCbQuery(`✅ +${amt} تندرستی`);
  await ctx.reply(`✅ ${amt} تندرستی بازیافتی\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.action('hl_gold', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.res.gold < 20) return ctx.answerCbQuery('❌ بیست زر نداری');
  addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB();
  await ctx.answerCbQuery('✅ درمان کامل');
  await ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.command('heal', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  if (args[1] === 'free') {
    if (u.daily.fh) return ctx.reply('❌ به کار رفته');
    const amt = 20 + (u.clinicLvl || 1) * 10;
    u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB();
    return ctx.reply(`✅ +${amt} تندرستی\n❤️ ${u.hp}/${u.maxHp}`);
  }
  if (args[1] === 'gold') {
    if (u.res.gold < 20) return ctx.reply('❌ بیست زر نداری');
    addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB();
    return ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`);
  }
  await ctx.reply('/heal free | /heal gold');
});

// ==================== بازار ====================
bot.action('shop', async (ctx) => {
  await sendPhoto(ctx, IMG.shop, '🛒 «بازار بزرگ ری - راسته زرگرها»\n━━━━━━━━━━━━━━━━━━━━\nچه می‌خواهی ای مسافر؟', Markup.inlineKeyboard([
    [Markup.button.callback('📦 کالاها', 'sh_res'), Markup.button.callback('🍽️ خوراک', 'sh_food')],
    [Markup.button.callback('⚔️ جنگ‌افزار', 'sh_wep'), Markup.button.callback('🛡️ زره', 'sh_arm')],
    [Markup.button.callback('💰 فروختن', 'sh_sell')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action('sh_res', async (ctx) => {
  await ctx.reply('📦 کالاها:\n🪵 چوب: ۸ زر\n🪨 سنگ: ۱۰ زر\n🔩 فلز: ۱۸ زر\n⛓️ آهن: ۲۵ زر\n\n/buy [کالا] [تعداد]\nمثال: /buy wood 5', backBtn());
});

bot.action('sh_food', async (ctx) => {
  await ctx.reply('🍽️ خوراک:\n🍞 نان: ۱۰ زر\n🍖 گوشت: ۲۵ زر\n💧 آب: ۸ زر\n\n/buy [کالا] [تعداد]', backBtn());
});

bot.action('sh_wep', async (ctx) => {
  const list = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => `${w.n}: ${w.price} زر`).join('\n');
  await sendPhoto(ctx, IMG.armory, `⚔️ جنگ‌افزارها:\n\n${list}\n\n/craft [کلید]\nمثال: /craft knife`, backBtn());
});

bot.action('sh_arm', async (ctx) => {
  const list = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => `${a.n}: ${a.price} زر`).join('\n');
  await sendPhoto(ctx, IMG.armor_shop, `🛡️ زره‌ها:\n\n${list}\n\n/craft_armor [کلید]\nمثال: /craft_armor leather`, backBtn());
});

bot.action('sh_sell', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  let txt = '💰 فروختن:\n\n';
  for (const [k, v] of Object.entries(u.res)) {
    if (v > 0 && k !== 'gold') txt += `${RES[k]} ${k}: ${v} (قیمت: ${Math.floor(({wood:4,stone:5,metal:9,iron:12}[k]||5))} زر)\n`;
  }
  txt += '\n/sell [کالا] [تعداد]';
  await ctx.reply(txt, backBtn());
});

bot.command('buy', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const key = args[1]; const amt = Number(args[2] || 1);
  const prices = { wood: 8, stone: 10, metal: 18, iron: 25, bread: 10, meat: 25, water: 8 };
  if (!prices[key]) return ctx.reply('❌ کالا نامعتبر');
  const total = prices[key] * amt;
  if (u.res.gold < total) return ctx.reply(`❌ ${total} زر لازم داری`);
  addRes(u, 'gold', -total);
  if (['wood','stone','metal','iron'].includes(key)) addRes(u, key, amt);
  else addItem(u, key, amt);
  saveDB();
  await ctx.reply(`✅ ${amt} ${key} خریداری شد\n💰 ${u.res.gold} زر`, backBtn());
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
  await ctx.reply(`✅ ${amt} ${key} فروخته شد\n💰 ${u.res.gold} زر`, backBtn());
});

// ==================== اسلحه‌خانه و زره‌خانه ====================
bot.action('armory', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => [Markup.button.callback(`${u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''}`, u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await sendPhoto(ctx, IMG.armory, `🛠️ «آهنگری کاوه»\n━━━━━━━━━━━━━━━━━━━━\nسلاح در دست: ${WEAPONS[u.weapon]?.n || 'نداری'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[k]; if (!w) return ctx.answerCbQuery('❌');
  if (u.lvl < w.lvl) return ctx.answerCbQuery(`❌ پایه ${w.lvl} لازم است`);
  if (u.res.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} زر`);
  addRes(u, 'gold', -w.price); u.wOwned[k] = true; saveDB();
  await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.wOwned[k]) return ctx.answerCbQuery('❌ نداری');
  u.weapon = k; saveDB(); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n} برگرفته شد`);
});

bot.command('craft', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const w = WEAPONS[k];
  if (!w || k === 'none') return ctx.reply('❌ نامعتبر');
  if (u.lvl < w.lvl) return ctx.reply(`❌ پایه ${w.lvl} لازم است`);
  if (u.res.gold < w.price) return ctx.reply(`❌ ${w.price} زر`);
  addRes(u, 'gold', -w.price); u.wOwned[k] = true; saveDB();
  await ctx.reply(`✅ ${w.n} ساخته شد!`, backBtn());
});

bot.command('equip', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1];
  if (!u.wOwned[k]) return ctx.reply('❌ نداری');
  u.weapon = k; saveDB();
  await ctx.reply(`⚔️ ${WEAPONS[k].n} برگرفته شد`, backBtn());
});

bot.action('armor_shop', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => [Markup.button.callback(`${u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''}`, u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await sendPhoto(ctx, IMG.armor_shop, `🛡️ «زرادخانه»\n━━━━━━━━━━━━━━━━━━━━\nزره بر تن: ${ARMORS[u.armor]?.n || 'نداری'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const a = ARMORS[k]; if (!a) return ctx.answerCbQuery('❌');
  if (u.lvl < a.lvl) return ctx.answerCbQuery(`❌ پایه ${a.lvl} لازم است`);
  if (u.res.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} زر`);
  addRes(u, 'gold', -a.price); u.aOwned[k] = true; saveDB();
  await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.aOwned[k]) return ctx.answerCbQuery('❌ نداری');
  u.armor = k; saveDB(); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n} پوشیده شد`);
});

bot.command('craft_armor', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const a = ARMORS[k];
  if (!a || k === 'none') return ctx.reply('❌ نامعتبر');
  if (u.lvl < a.lvl) return ctx.reply(`❌ پایه ${a.lvl} لازم است`);
  if (u.res.gold < a.price) return ctx.reply(`❌ ${a.price} زر`);
  addRes(u, 'gold', -a.price); u.aOwned[k] = true; saveDB();
  await ctx.reply(`✅ ${a.n} ساخته شد!`, backBtn());
});

// ==================== آتشکده ====================
bot.action('aramgah', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  
  const text = [
    `🕯️ «آتشکده آذر - نیایشگاه»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `«پرستیدن دادگر دین ماست`,
    `همین راه و رسم و آیین ماست»`,
    ``,
    `نور اهورایی اینجاست...`,
  ].join('\n');
  
  await sendPhoto(ctx, IMG.aramgah, text, Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
    [Markup.button.callback('📖 روضه', 'p_rozeh')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ]));
});

bot.action(['p_dua', 'p_namaz', 'p_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u, 'pray'); const xpG = u.lvl <= 3 ? 60 : 30; addXP(u, xpG);
  u.loyaltyPoints = (u.loyaltyPoints || 0) + 3;
  saveDB();
  const names = { p_dua: 'دعا', p_namaz: 'نماز', p_rozeh: 'روضه' };
  await ctx.answerCbQuery(`✨ +${xpG} نام‌آوری`);
  await ctx.reply(`🕯️ «اهورامزدا شنید»\n━━━━━━━━━━━━━━━━━━━━\n${names[ctx.match[0]]} پذیرفته شد!\n✨ +${xpG} نام‌آوری\n🎚️ پایه: ${u.lvl}\n\n━◦○◦━◦○◦━◦○◦━◦○◦━\n🔥 «آتش مقدس خاموش مباد!»`, backBtn());
});

// ==================== غذا ====================
bot.action('eat_menu', async (ctx) => {
  await sendPhoto(ctx, IMG.eat, '🍽️ «سفره ایرانی - خوان شاهانه»\n━━━━━━━━━━━━━━━━━━━━\n«بفرمود تا سفره گستردند»', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat')],
    [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
    [Markup.button.callback('🥩 گوشت', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
    [Markup.button.callback('🍜 آش', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake')],
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
  await ctx.answerCbQuery(`✅ ${food.n} نوش جان`);
});

bot.action(/d_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
  const drink = DRINKS[k]; if (!drink) return ctx.answerCbQuery('❌');
  addItem(u, k, -1);
  if (drink.t) u.thirst = Math.min(u.maxThirst, u.thirst + drink.t);
  if (drink.xp) addXP(u, drink.xp);
  saveDB();
  await ctx.answerCbQuery(`✅ ${drink.n} نوش جان`);
});

// ==================== مهارت‌ها ====================
bot.action('skills', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await sendPhoto(ctx, IMG.skills, `⭐ «هنرستان - آموزشگاه رستم»\n━━━━━━━━━━━━━━━━━━━━\n«هنر نزد ایرانیان است و بس»\n\nگوهر هنر: ${u.sp||0}\n\n⛏️ دروگری: ${u.skills.g}/10\n🏹 کمانداری: ${u.skills.h}/10\n🔨 آهنگری: ${u.skills.c}/10\n🏕️ کوهنوردی: ${u.skills.s}/10\n\n/skill <g|h|c|s>`, Markup.inlineKeyboard([
    [Markup.button.callback('⛏️', 'sk_g'), Markup.button.callback('🏹', 'sk_h')],
    [Markup.button.callback('🔨', 'sk_c'), Markup.button.callback('🏕️', 'sk_s')],
    [Markup.button.callback('🔙', 'back_main')],
  ]));
});

bot.action(/sk_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.sp || u.sp <= 0) return ctx.answerCbQuery('❌ گوهر هنر نداری');
  if ((u.skills[k] || 0) >= 10) return ctx.answerCbQuery('❌ به اوج رسیده');
  u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB();
  await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1];
  if (!['g','h','c','s'].includes(k)) return ctx.reply('❌ g, h, c, s');
  if (!u.sp || u.sp <= 0) return ctx.reply('❌ گوهر هنر نداری');
  if ((u.skills[k] || 0) >= 10) return ctx.reply('❌ به اوج رسیده');
  u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB();
  await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`, backBtn());
});

// ==================== راهنما ====================
bot.action('guide', async (ctx) => {
  const text = [
    `📖 «اوستا - کتاب آسمانی»`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🌲 بیشه: ${formatTime(CD.gather)}`,
    `⚔️ رزم: ${formatTime(CD.fight)}`,
    `👹 اژدها: ${formatTime(CD.boss)}`,
    `🏟️ پهلوانی: ${formatTime(CD.pvp)}`,
    `🕯️ آتشکده: ${formatTime(CD.pray)}`,
    `🎁 جایزه: ${formatTime(CD.daily)}`,
    `📜 شاهنامه: ${formatTime(CD.shahnameh)}`,
    ``,
    `━◦○◦━◦○◦━◦○◦━◦○◦━`,
    `📜 «به کوشش باش تا پیروز گردی»`,
  ].join('\n');
  await sendPhoto(ctx, IMG.guide, text, backBtn());
});

// ==================== زمان‌ها ====================
bot.action('cooldowns', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const acts = [
    ['gather', '🌲 بیشه', CD.gather], ['fight', '⚔️ رزم', CD.fight],
    ['boss', '👹 اژدها', CD.boss], ['pvp', '🏟️ پهلوانی', CD.pvp],
    ['pray', '🕯️ آتشکده', CD.pray], ['daily', '🎁 جایزه', CD.daily],
    ['shahnameh', '📜 شاهنامه', CD.shahnameh],
  ];
  const lines = ['⏱️ «چرخ زمان می‌گردد»\n━━━━━━━━━━━━━━━━━━━━\n'];
  for (const [k, n, cd] of acts) {
    const c = checkCD(u, k, cd);
    lines.push(`${n}: ${c.can ? '✅ آماده' : `⏳ ${formatTime(c.rem)}`}`);
  }
  await sendPhoto(ctx, IMG.cooldowns, lines.join('\n'), backBtn());
});

// ==================== برگشت ====================
bot.action('back_main', async (ctx) => {
  try { await ctx.deleteMessage(); } catch (e) {}
  await sendPhoto(ctx, IMG.main, '🏛️ «بارگاه جمشید»\n━━━━━━━━━━━━━━━━━━━━\nفرمان چیست ای پهلوان؟', mainMenu());
});

// ==================== ادمین ====================
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const users = Object.values(db.users).sort((a, b) => b.lvl - a.lvl).slice(0, 10);
  let txt = `👥 ${Object.keys(db.users).length} پهلوان\n🏆 نامداران:\n`;
  users.forEach((u, i) => txt += `${i+1}. ${u.name||'?'} | پایه ${u.lvl} | 🥇${u.res.gold}\n`);
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
  saveDB(); await ctx.reply('✅ انجام شد');
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
  u.loyaltyPoints = 1000; u.shahnamehCount = 50;
  saveDB(); await ctx.reply('✅ شاهنشاه شد!');
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true })
  .then(() => console.log('✅ بقای باستانی - نسخه نهایی با موفقیت اجرا شد!'))
  .catch(err => console.error('❌ خطا:', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));