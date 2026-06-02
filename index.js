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

let db = { users: {}, clans: {} };
if (fs.existsSync(DB_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { db = { users: {}, clans: {} }; }
}

function saveDB() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (e) {}
}

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
  const f = Math.floor(Math.max(0, Math.min(c || 0, max || 1)) / (max || 1) * len);
  return '🟩'.repeat(Math.max(0, f)) + '⬜'.repeat(Math.max(0, len - f));
}

const CD = { gather: 120000, fight: 180000, boss: 600000, pray: 21600000, pvp: 300000, daily: 86400000, shahnameh: 3600000, npc: 3600000 };

function checkCD(u, action, ms) {
  if (!u.cooldowns) u.cooldowns = {};
  const last = u.cooldowns[action] || 0;
  return (Date.now() - last >= ms) ? { can: true, rem: 0 } : { can: false, rem: ms - (Date.now() - last) };
}

function setCD(u, action) {
  if (!u.cooldowns) u.cooldowns = {};
  u.cooldowns[action] = Date.now();
}

const TAUNTS = [
  '👑 شاهنشاه می‌فرماید: حریف بیچاره حتی سپرش هم ترکید!',
  '⚔️ رستم می‌گه: اینم از انتقام! حالا برو زانوی غم بغل بگیر!',
  '🦅 سیمرغ شاهد بود: زره‌ات مثل کاغذ پاره شد!',
  '🔥 آتشکده روشن شد: سلاح‌ات رو بفروش، به درد نمی‌خوره!',
  '👹 حتی دیو سپید هم به حال تو گریه کرد!',
];

const SHAHNAMEH = [
  { verse: 'توانا بود هر که دانا بود', reward: 15 },
  { verse: 'به نام خداوند جان و خرد', reward: 10 },
  { verse: 'هنر نزد ایرانیان است و بس', reward: 25 },
  { verse: 'چو ایران نباشد تن من مباد', reward: 30 },
];

const RES = { wood: '🪵', stone: '🪨', metal: '🔩', iron: '⛓️', gold: '🥇', toman: '💵' };

const WEAPONS = {
  none: { n: '❌ بدون سلاح', p: 0, price: 0, lvl: 0 },
  stick: { n: '🪵 چوب دستی', p: 2, price: 20, lvl: 1 },
  knife: { n: '🔪 خنجر سهراب', p: 5, price: 80, lvl: 2 },
  bow_zal: { n: '🏹 کمان زال', p: 10, price: 220, lvl: 3 },
  axe: { n: '🪓 تبر فریدون', p: 14, price: 350, lvl: 4 },
  spear: { n: '🔱 نیزه گیو', p: 18, price: 500, lvl: 5 },
  mace: { n: '🔥 گرز گاوسر', p: 28, price: 1200, lvl: 6 },
  bow_arash: { n: '🏹 کمان آرش', p: 22, price: 800, lvl: 7 },
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
  bread: { n: '🍞 نان روغنی', h: 30 }, meat: { n: '🍖 کباب', h: 50 },
  fish: { n: '🐟 ماهی', h: 25 }, chicken: { n: '🍗 ماکیان', h: 45 },
  steak: { n: '🥩 گوشت بره', h: 70 }, stew: { n: '🥘 آبگوشت', h: 55 },
  noodle: { n: '🍜 آش رشته', h: 35 }, cake: { n: '🍰 باقلوا', h: 25, heal: 20 },
  honey: { n: '🍯 انگبین', h: 20, heal: 30 },
};

const DRINKS = {
  water: { n: '💧 آب چشمه', t: 40 }, juice: { n: '🧃 شربت آلبالو', t: 50 },
  soda: { n: '🍺 دوغ', t: 25 }, tea: { n: '🍵 چای', t: 35 },
  coffee: { n: '☕ قهوه', t: 30, xp: 10 }, milk: { n: '🥛 شیر میش', t: 45 },
};

const ENEMIES = {
  animals: [
    { n: '🐺 گرگ تورانی', t: 'animal', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8 },
    { n: '🐗 گراز', t: 'animal', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10 },
    { n: '🦊 شغال', t: 'animal', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12 },
    { n: '🐻 خرس', t: 'animal', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15 },
  ],
  demons: [
    { n: '👹 دیو سفید', t: 'demon', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18 },
    { n: '👺 دیو سیاه', t: 'demon', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22 },
    { n: '👾 اکوان دیو', t: 'demon', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28 },
  ],
  bosses: [
    { n: '🐉 ضحاک', t: 'boss', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, ml: 8 },
    { n: '🦅 سیمرغ', t: 'boss', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, ml: 10 },
  ],
};

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

const PETS = {
  horse: { n: '🐎 رخش', price: 500, bonus: 'سرعت جستجو +۳۰٪' },
  falcon: { n: '🦅 باز', price: 400, bonus: 'شانس شکار +۲۰٪' },
  dog: { n: '🐕 سگ', price: 300, bonus: 'دفاع +۵' },
  cat: { n: '🐈 گربه', price: 200, bonus: 'شانس آیتم +۱۵٪' },
};

const NPCS = {
  zal: { n: '👴 زال', desc: 'آموزش مهارت', price: 50, effect: (u) => { u.sp = (u.sp||0) + 1; return '⭐ +۱ گوهر هنر'; } },
  simurgh: { n: '🦅 سیمرغ', desc: 'شفابخش', price: 100, effect: (u) => { u.hp = u.maxHp; return '❤️ درمان کامل'; } },
  rostam: { n: '⚔️ رستم', desc: 'آموزش مبارزه', price: 80, effect: (u) => { addXP(u, 50); return '✨ +۵۰ XP'; } },
  ferdosi: { n: '📜 فردوسی', desc: 'شعر و زر', price: 30, effect: (u) => { addRes(u, 'gold', 50); u.shahnamehCount = (u.shahnamehCount||0) + 1; return '🥇 +۵۰ زر'; } },
};

const QUESTS = [
  { n: 'شکار روز', desc: '۳ جستجو', target: 'gather', goal: 3, rew: { gold: 100, xp: 20 } },
  { n: 'نبردآور', desc: '۲ مبارزه', target: 'fight', goal: 2, rew: { gold: 150, xp: 30 } },
  { n: 'پهلوان', desc: '۱ برد PvP', target: 'pvp_win', goal: 1, rew: { gold: 200, xp: 40 } },
  { n: 'نیایشگر', desc: '۱ آتشکده', target: 'pray', goal: 1, rew: { gold: 80, xp: 15 } },
  { n: 'شاعر', desc: '۱ شاهنامه', target: 'shahnameh', goal: 1, rew: { gold: 60, xp: 10 } },
];

const ACHIEVEMENTS = [
  { id: 'first_blood', n: '🩸 اولین خون', desc: '۱ برد', check: (u) => (u.stats.fw||0)+(u.stats.dw||0) >= 1 },
  { id: 'warrior', n: '⚔️ جنگجو', desc: '۱۰ برد', check: (u) => (u.stats.fw||0)+(u.stats.dw||0) >= 10 },
  { id: 'rich', n: '💰 خزانه‌دار', desc: '۱۰۰۰۰ طلا', check: (u) => (u.res.gold||0) >= 10000 },
  { id: 'builder', n: '🏠 معمار', desc: 'خانه لول ۵', check: (u) => u.homeLvl >= 5 },
  { id: 'shahnameh_reader', n: '📚 شاعر', desc: '۲۰ شعر', check: (u) => (u.shahnamehCount||0) >= 20 },
];

function ensureUser(id, name) {
  const uid = String(id);
  if (!db.users[uid]) {
    db.users[uid] = {
      id: uid, name: name || 'ناشناس', lvl: 1, xp: 0,
      hp: 100, maxHp: 300, hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100,
      homeLvl: 1, clinicLvl: 1, weapon: 'none', armor: 'none', clan: null,
      skills: { g: 0, h: 0, c: 0, s: 0 }, sp: 0,
      res: { wood: 20, stone: 20, metal: 20, iron: 20, gold: 30, toman: 20 },
      items: { bandage: 1, bread: 2, water: 2 },
      wOwned: { none: true }, aOwned: { none: true },
      cooldowns: {}, daily: {}, stats: { pw: 0, pl: 0, fw: 0, dw: 0, bw: 0, gath: 0 }, logins: 1,
      pvpRating: 0, pvpLeague: 'bronze', pvpHistory: [], pvpStreak: 0, honorPoints: 0,
      loyaltyPoints: 0, shahnamehCount: 0, pet: null, bankGold: 0, bankInterest: 0,
      weaponEnchant: null, achievements: [], quests: [], questProgress: {}, lastQuestDate: '',
      pvpQuickCount: 0, pvpQuickReset: 0, jailUntil: 0,
    };
    rollQuests(db.users[uid]);
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
  u.honorPoints = u.honorPoints || 0; u.loyaltyPoints = u.loyaltyPoints || 0;
  u.shahnamehCount = u.shahnamehCount || 0; u.pet = u.pet || null;
  u.bankGold = u.bankGold || 0; u.bankInterest = u.bankInterest || 0;
  u.weaponEnchant = u.weaponEnchant || null;
  u.achievements = u.achievements || []; u.quests = u.quests || [];
  u.questProgress = u.questProgress || {}; u.clan = u.clan || null;
  u.pvpQuickCount = u.pvpQuickCount || 0; u.pvpQuickReset = u.pvpQuickReset || 0;
  u.jailUntil = u.jailUntil || 0;
  u.wOwned.none = true; u.aOwned.none = true;
  
  const today = new Date().toDateString();
  if (u.lastLoginDate !== today) { u.loyaltyPoints = (u.loyaltyPoints || 0) + 5; u.lastLoginDate = today; }
  if (u.lastQuestDate !== today) { rollQuests(u); u.lastQuestDate = today; }
  if (u.lastBankDate !== today && u.bankGold > 0) {
    const interest = Math.floor(u.bankGold * 0.02);
    u.bankGold += interest; u.bankInterest = (u.bankInterest || 0) + interest; u.lastBankDate = today;
  }
  saveDB();
  return u;
}

function rollQuests(u) {
  u.quests = [...QUESTS].sort(() => Math.random() - 0.5).slice(0, 3);
  u.questProgress = {};
  u.quests.forEach(q => { u.questProgress[q.target] = 0; });
}

function checkAchievements(u) {
  const newAch = [];
  for (const ach of ACHIEVEMENTS) {
    if (!u.achievements.includes(ach.id) && ach.check(u)) { u.achievements.push(ach.id); newAch.push(ach); }
  }
  return newAch;
}

function addXP(u, amt) {
  u.xp += amt; let ups = 0;
  while (u.xp >= 30) { u.xp -= 30; u.lvl += 1; u.maxHp += 10; u.maxHunger += 5; u.maxThirst += 5; u.hp = u.maxHp; u.hunger = u.maxHunger; u.thirst = u.maxThirst; u.sp = (u.sp || 0) + 1; ups++; }
  return ups;
}

function addRes(u, k, v) { if (!u.res) u.res = {}; if (!u.res[k]) u.res[k] = 0; u.res[k] += v; if (u.res[k] < 0) u.res[k] = 0; }
function addItem(u, k, v) { if (!u.items) u.items = {}; if (!u.items[k]) u.items[k] = 0; u.items[k] += v; if (u.items[k] < 0) u.items[k] = 0; }

function hasRes(u, cost) { if (!u.res) return false; for (const [k, v] of Object.entries(cost)) { if (k === 'nl') continue; if ((u.res[k] || 0) < v) return false; } return true; }
function takeRes(u, cost) { for (const [k, v] of Object.entries(cost)) { if (k === 'nl') continue; addRes(u, k, -v); } }

function giveReward(u, rew) { if (!rew) return; for (const [k, v] of Object.entries(rew)) { if (RES[k]) addRes(u, k, v); else addItem(u, k, v); } }

function rwText(rew) {
  if (!rew) return 'ندارد';
  return Object.entries(rew).map(([k, v]) => { if (RES[k]) return `${RES[k]} ${v}`; if (FOODS[k]) return `${v}x ${FOODS[k].n}`; return `${v}x ${k}`; }).join(' | ') || 'ندارد';
}

function updateLeague(u) {
  const rating = u.pvpRating || 0;
  for (const [key, league] of Object.entries(PVP_LEAGUES).reverse()) { if (rating >= league.min) { u.pvpLeague = key; break; } }
}

function progressQuest(u, target) { if (!u.questProgress) u.questProgress = {}; u.questProgress[target] = (u.questProgress[target] || 0) + 1; }

// ==================== منوها ====================
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 وضعیت', 'm_status'), Markup.button.callback('🌲 جستجو', 'm_gather')],
    [Markup.button.callback('⚔️ مبارزه', 'm_fight'), Markup.button.callback('👹 باس', 'm_boss')],
    [Markup.button.callback('🏟️ PvP', 'm_pvp'), Markup.button.callback('🏠 خانه', 'm_home')],
    [Markup.button.callback('🏥 درمانگاه', 'm_clinic'), Markup.button.callback('🛒 بازار', 'm_shop')],
    [Markup.button.callback('🛠️ اسلحه‌خانه', 'm_armory'), Markup.button.callback('🛡️ زره‌خانه', 'm_armor_shop')],
    [Markup.button.callback('🕯️ آتشکده', 'm_pray'), Markup.button.callback('🍽️ غذا', 'm_eat')],
    [Markup.button.callback('👤 بزرگان', 'm_npc'), Markup.button.callback('📋 مأموریت‌ها', 'm_quest')],
    [Markup.button.callback('🐎 حیوانات', 'm_pet'), Markup.button.callback('🏦 بانک', 'm_bank')],
    [Markup.button.callback('🏆 دستاوردها', 'm_achieve'), Markup.button.callback('🏰 قبیله', 'm_clan')],
    [Markup.button.callback('📖 راهنما', 'm_guide'), Markup.button.callback('⭐ مهارت', 'm_skills')],
    [Markup.button.callback('⏱️ زمان‌ها', 'm_cd'), Markup.button.callback('🎁 جایزه', 'm_daily')],
  ]);
}

function backBtn(menu) {
  const target = menu || 'main';
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 بازگشت', `goback_${target}`)],
    [Markup.button.callback('🏛️ بارگاه', 'm_main')],
  ]);

bot.action(/goback_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const menu = ctx.match[1];
  try { await ctx.deleteMessage().catch(() => {}); } catch (e) {}
  if (menu === 'main') return ctx.reply('🏛️ بارگاه', mainMenu());
  if (menu === 'status') return bot.action('m_status')(ctx);
  if (menu === 'gather') return bot.action('m_gather')(ctx);
  if (menu === 'fight') return bot.action('m_fight')(ctx);
  if (menu === 'boss') return bot.action('m_boss')(ctx);
  if (menu === 'pvp') return bot.action('m_pvp')(ctx);
  if (menu === 'home') return bot.action('m_home')(ctx);
  if (menu === 'clinic') return bot.action('m_clinic')(ctx);
  if (menu === 'shop') return bot.action('m_shop')(ctx);
  if (menu === 'armory') return bot.action('m_armory')(ctx);
  if (menu === 'armor') return bot.action('m_armor_shop')(ctx);
  if (menu === 'pray') return bot.action('m_pray')(ctx);
  if (menu === 'eat') return bot.action('m_eat')(ctx);
  if (menu === 'skills') return bot.action('m_skills')(ctx);
  if (menu === 'guide') return bot.action('m_guide')(ctx);
  if (menu === 'cd') return bot.action('m_cd')(ctx);
  return ctx.reply('🏛️ بارگاه', mainMenu());
});

bot.action('m_main', async (ctx) => {
  try { await ctx.deleteMessage().catch(() => {}); } catch (e) {}
  await ctx.reply('🏛️ بارگاه جمشید', mainMenu());
});

// ==================== استارت ====================
bot.start(async (ctx) => {
  try {
    const u = ensureUser(ctx.from.id, ctx.from.first_name);
    const isNew = u.logins === 1;
    const text = isNew
      ? `🏛️ به سرزمین پارس خوش آمدی ${u.name}!\n\n🎁 هدیه: 🪵۲۰ 🪨۲۰ 🥇۳۰ 🩹۱ 🍞۲ 💧۲\n\n⚔️ سرنوشتت را خود رقم بزن!`
      : `🏛️ ${u.name}، خوش برگشتی!\n🎚️ لول: ${u.lvl} | ❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.res.gold} طلا | ⭐ ${u.loyaltyPoints||0} وفاداری`;
    await ctx.reply(text, mainMenu());
  } catch (e) { await ctx.reply('❌ خطا. /start رو دوباره بزن'); }
});

// ==================== وضعیت ====================
bot.action('m_status', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  const newAch = checkAchievements(u); saveDB();
  const text = `📊 ${u.name} | 🎚️ ${u.lvl}\n❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}\n🍞 ${Math.floor(u.hunger)} | 💧 ${Math.floor(u.thirst)}\n⚔️ ${w.n}${u.weaponEnchant?' '+u.weaponEnchant:''} | 🛡️ ${a.n}\n🐎 ${u.pet?PETS[u.pet]?.n:'ندارد'} | 🏰 ${u.clan||'ندارد'}\n🏠 ${u.homeLvl} | 🏥 ${u.clinicLvl}\n⭐ ${u.sp||0} | ${league.n} ⭐${u.pvpRating||0}\n🏟️ 🏆${u.stats.pw||0} 💀${u.stats.pl||0}\n🎖️ ${u.loyaltyPoints||0} | 📚 ${u.shahnamehCount||0}\n🏦 ${u.bankGold||0} زر | 🥇 ${u.res.gold} زر${newAch.length>0?'\n\n🏆 دستاورد: '+newAch.map(a=>a.n).join(', '):''}`;
  await ctx.reply(text, backBtn('status'));
});

// ==================== جستجو ====================
bot.action('m_gather', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'gather', CD.gather);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u, 'gather');
  const table = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { metal: 1, stone: 2 }, { wood: 4 }, { gold: 10 }];
  const roll = table[rnd(0, table.length - 1)]; giveReward(u, roll);
  let extra = '';
  if (Math.random() < (u.pet==='cat'?0.45:0.3)) { const f = ['bread','fish','water','meat'][rnd(0,3)]; addItem(u, f, 1); extra = `\n🍽️ ${FOODS[f]?.n||f} هم یافت شد!`; }
  u.loyaltyPoints = (u.loyaltyPoints||0) + 1; u.stats.gath = (u.stats.gath||0) + 1; progressQuest(u, 'gather'); saveDB();
  await ctx.reply(`🌲 جستجو...\n🎁 ${rwText(roll)}${extra}${u.pet==='horse'?'\n🐎 رخش سرعت بخشید!':''}\n⏳ ${formatTime(CD.gather)} دیگر`, backBtn('gather'));
});

// ==================== مبارزه ====================
bot.action('m_fight', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'fight', CD.fight);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await ctx.reply('⚔️ حریف انتخاب کن:', Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات', 'f_animal'), Markup.button.callback('👹 دیوان', 'f_demon')],
    [Markup.button.callback('🎲 رندوم', 'f_random'), Markup.button.callback('🔙 بازگشت', 'back_fight')],
  ]));
});

bot.action('m_boss', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'boss', CD.boss);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  const btns = ENEMIES.bosses.map((b, i) => [Markup.button.callback(`${b.n} (لول ${b.ml}+)`, `f_boss_${i}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_boss')]);
  await ctx.reply('👹 باس‌ها:', Markup.inlineKeyboard(btns));
});

bot.action('f_animal', async (ctx) => startFight(ctx, 'animals'));
bot.action('f_demon', async (ctx) => startFight(ctx, 'demons'));
bot.action('f_random', async (ctx) => startFight(ctx, Math.random() < 0.5 ? 'animals' : 'demons'));

bot.action(/f_boss_(\d+)/, async (ctx) => {
  const idx = parseInt(ctx.match[1]); const boss = ENEMIES.bosses[idx];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!boss) return ctx.answerCbQuery('❌');
  if (u.lvl < boss.ml) return ctx.answerCbQuery(`❌ لول ${boss.ml} لازمه`);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  u.pendingFight = { enemy: boss, type: 'boss' }; setCD(u, 'boss'); saveDB();
  const ch = clamp(50 + (u.lvl * 4 + (WEAPONS[u.weapon]||WEAPONS.none).p - boss.p) * 4, 10, 90);
  await ctx.reply(`👹 ${boss.n}\n💪 ${boss.p}\n🎁 ${rwText(boss.rew)}\n🛡️ ${ch}%\n⚠️ خطرناک!`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'f_confirm')], [Markup.button.callback('🏃 فرار', 'back_boss')],
  ]));
});

async function startFight(ctx, type) {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  const enemy = ENEMIES[type][rnd(0, ENEMIES[type].length - 1)];
  u.pendingFight = { enemy, type }; setCD(u, 'fight'); saveDB();
  const ch = clamp(50 + (u.lvl * 4 + (WEAPONS[u.weapon]||WEAPONS.none).p - enemy.p) * 4, 10, 90);
  await ctx.reply(`⚔️ ${enemy.n}\n💪 ${enemy.p}\n🎁 ${rwText(enemy.rew)}\n🛡️ ${ch}%`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'f_confirm')], [Markup.button.callback('🏃 فرار', 'back_fight')],
  ]));
}

bot.action('f_confirm', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pendingFight) return ctx.answerCbQuery('❌');
  const { enemy, type } = u.pendingFight; u.pendingFight = null;
  const w = WEAPONS[u.weapon] || WEAPONS.none; const a = ARMORS[u.armor] || ARMORS.none;
  const pp = u.lvl * 4 + w.p + rnd(0, 8) + (u.pet==='dog'?5:0) + (u.weaponEnchant==='🔥 آتشین'?5:0);
  const ep = enemy.p + rnd(0, 10); const raw = rnd(enemy.loss[0], enemy.loss[1]);
  const dmg = Math.max(1, raw - a.d); const ch = clamp(50 + (pp - ep) * 4, 10, 90);
  const win = Math.random() * 100 < ch; u.hp = clamp(u.hp - dmg, 0, u.maxHp);
  let txt;
  if (win) {
    giveReward(u, enemy.rew); addXP(u, enemy.xp);
    if (type === 'animals') u.stats.fw = (u.stats.fw||0) + 1;
    else if (type === 'demons') u.stats.dw = (u.stats.dw||0) + 1;
    else if (type === 'boss') u.stats.bw = (u.stats.bw||0) + 1;
    progressQuest(u, 'fight'); u.loyaltyPoints = (u.loyaltyPoints||0) + 2;
    txt = `✅ پیروزی!\n✨ +${enemy.xp} XP\n❤️ -${dmg}\n🎁 ${rwText(enemy.rew)}`;
  } else { txt = `❌ شکست!\n❤️ -${dmg}`; }
  saveDB();
  await ctx.reply(`⚔️ ${enemy.n}\n${txt}`, backBtn('fight'));
});

// ==================== PvP ====================
bot.action('m_pvp', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.jailUntil && Date.now() < u.jailUntil) return ctx.answerCbQuery(`⛓️ ${formatTime(u.jailUntil - Date.now())}`);
  const now = Date.now();
  if (u.pvpQuickReset && now > u.pvpQuickReset) { u.pvpQuickCount = 0; u.pvpQuickReset = now + 3600000; }
  if (!u.pvpQuickReset) u.pvpQuickReset = now + 3600000;
  const remaining = 10 - (u.pvpQuickCount || 0);
  const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
  await ctx.reply(`🏟️ PvP\n🏆 ${league.n} | ⭐${u.pvpRating||0}\n✅ ${u.stats.pw||0} | ❌ ${u.stats.pl||0}\n⚡ نبرد سریع: ${remaining}/۱۰\n/pvp [id] | /pvp_bet`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ نبرد سریع', 'pvp_quick')],
    [Markup.button.callback('🏆 لیگ', 'pvp_league'), Markup.button.callback('📜 تاریخچه', 'pvp_history')],
    [Markup.button.callback('🔙 بازگشت', 'back_pvp')],
  ]));
});

bot.action('pvp_quick', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  const now = Date.now();
  if (u.pvpQuickReset && now > u.pvpQuickReset) { u.pvpQuickCount = 0; u.pvpQuickReset = now + 3600000; }
  if (!u.pvpQuickReset) u.pvpQuickReset = now + 3600000;
  if ((u.pvpQuickCount || 0) >= 10) { u.jailUntil = now + 10800000; u.pvpQuickCount = 0; saveDB(); return ctx.answerCbQuery('❌ ۳ ساعت ممنوع'); }
  const enemies = Object.values(db.users).filter(e => e.id !== u.id && e.hp > 0 && (e.pvpQuickCount||0) < 10);
  if (!enemies.length) return ctx.answerCbQuery('❌ حریف نیست');
  const enemy = enemies[rnd(0, enemies.length - 1)];
  const myW = Object.entries(u.wOwned).filter(([k,v]) => v && k!=='none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a,b) => b.p-a.p);
  if (!myW.length) return ctx.answerCbQuery('❌ سلاح نداری');
  u.pendingPvP = { eid: enemy.id, ename: enemy.name, sw: Object.keys(WEAPONS).find(k => WEAPONS[k] === myW[0]) };
  u.pvpQuickCount = (u.pvpQuickCount||0) + 1; enemy.pvpQuickCount = (enemy.pvpQuickCount||0) + 1; saveDB();
  const ch = clamp(50 + (u.lvl*4+myW[0].p - enemy.lvl*4-(WEAPONS[enemy.weapon]||WEAPONS.none).p)*3, 10, 90);
  await ctx.reply(`⚔️ ${enemy.name}\n👤 لول ${enemy.lvl}\n🗡️ ${myW[0].n}\n🎲 ${ch}%\n⚡ ${u.pvpQuickCount}/۱۰`, Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'pvp_go')], [Markup.button.callback('🏃 فرار', 'back_pvp')],
  ]));
});

bot.action('pvp_go', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pendingPvP) return ctx.answerCbQuery('❌');
  const { eid, sw } = u.pendingPvP; u.pendingPvP = null;
  const enemy = db.users[eid]; if (!enemy) return ctx.reply('❌', backBtn('pvp'));
  const w = WEAPONS[sw]; const a = ARMORS[u.armor]||ARMORS.none;
  const ew = WEAPONS[enemy.weapon]||WEAPONS.none; const ea = ARMORS[enemy.armor]||ARMORS.none;
  const mp = u.lvl*4+w.p+rnd(0,10); const ep = enemy.lvl*4+ew.p+rnd(0,10);
  const ch = clamp(50+(mp-ep)*3,10,90); const win = Math.random()*100<ch;
  const raw = rnd(15,40); const md = Math.max(5,raw-a.d); const ed = Math.max(5,raw-ea.d);
  let at, dt;
  if (win) {
    u.hp = Math.max(0,u.hp-Math.floor(ed*0.3)); enemy.hp = Math.max(0,enemy.hp-ed);
    const gr = rnd(30,80); addRes(u,'gold',gr); addXP(u,rnd(15,35));
    u.stats.pw=(u.stats.pw||0)+1; enemy.stats.pl=(enemy.stats.pl||0)+1;
    u.pvpRating=(u.pvpRating||0)+rnd(20,30); enemy.pvpRating=Math.max(0,(enemy.pvpRating||0)-rnd(10,20));
    u.pvpStreak=(u.pvpStreak||0)+1; enemy.pvpStreak=0; u.honorPoints=(u.honorPoints||0)+rnd(5,15);
    progressQuest(u,'pvp_win'); updateLeague(u); updateLeague(enemy);
    at = `👑 بر ${enemy.name} چیره شدی!\n${TAUNTS[rnd(0,TAUNTS.length-1)]}\n❤️ -${Math.floor(ed*0.3)}\n🥇 +${gr}\n⭐ +${rnd(20,30)}\n❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${u.name} به تو حمله کرد!\n❌ شکست!\n❤️ -${ed}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  } else {
    u.hp=Math.max(0,u.hp-md); enemy.hp=Math.max(0,enemy.hp-Math.floor(ed*0.3));
    u.stats.pl=(u.stats.pl||0)+1; enemy.stats.pw=(enemy.stats.pw||0)+1;
    u.pvpRating=Math.max(0,(u.pvpRating||0)-rnd(10,20)); enemy.pvpRating=(enemy.pvpRating||0)+rnd(15,25);
    u.pvpStreak=Math.min(0,(u.pvpStreak||0)-1); enemy.pvpStreak=(enemy.pvpStreak||0)+1;
    updateLeague(u); updateLeague(enemy);
    at = `💀 از ${enemy.name} شکست خوردی!\n❤️ -${md}\n❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${u.name} به تو حمله کرد!\n✅ دفاع کردی!\n❤️ -${Math.floor(ed*0.3)}\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  }
  saveDB();
  try { await bot.telegram.sendMessage(eid, dt, Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙', 'm_main')]])); } catch (e) {}
  await ctx.reply(at, backBtn('pvp'));
});

bot.action(/pvp_rev_(.+)/, async (ctx) => {
  const tid = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌');
  const enemy = db.users[tid]; if (!enemy) return ctx.answerCbQuery('❌');
  const myW = Object.entries(u.wOwned).filter(([k,v])=>v&&k!=='none').map(([k])=>WEAPONS[k]).filter(w=>w).sort((a,b)=>b.p-a.p).slice(0,2);
  if (!myW.length) return ctx.answerCbQuery('❌');
  u.pendingPvP = { eid: tid, ename: enemy.name, myW }; saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n}`, `pvp_sw_${Object.keys(WEAPONS).find(k=>WEAPONS[k]===w)}`)]);
  await ctx.reply(`⚔️ انتقام از ${enemy.name}!\n🗡️:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙', 'back_pvp')]]));
});

bot.action(/pvp_sw_(.+)/, async (ctx) => {
  const wk = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pendingPvP) return ctx.answerCbQuery('❌');
  u.pendingPvP.sw = wk; saveDB(); await ctx.answerCbQuery('✅');
  await bot.action('pvp_go')(ctx);
});

bot.action('pvp_league', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const list = Object.entries(PVP_LEAGUES).map(([k,l]) => `${l.n}${u.pvpLeague===k?' ✅':''}: ${l.min}+`).join('\n');
  await ctx.reply(`🏆 لیگ‌ها\n\n${list}\n\nتو: ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}\n⭐ ${u.pvpRating||0}`, backBtn('pvp'));
});

bot.action('pvp_history', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const h = u.pvpHistory || [];
  if (!h.length) return ctx.answerCbQuery('📜 خالی');
  const text = ['📜 تاریخچه:\n', ...h.slice(-10).reverse().map((b,i) => `${i+1}. ${b.win?'✅':'❌'} vs ${b.enemy}`)];
  await ctx.reply(text.join('\n'), backBtn('pvp'));
});

bot.command('pvp', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/); const tid = args[1];
  if (!tid) return ctx.reply('/pvp [id]');
  if (tid === u.id) return ctx.reply('❌');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌');
  const myW = Object.entries(u.wOwned).filter(([k,v])=>v&&k!=='none').map(([k])=>WEAPONS[k]).filter(w=>w).sort((a,b)=>b.p-a.p).slice(0,2);
  if (!myW.length) return ctx.reply('❌');
  u.pendingPvP = { eid: tid, ename: enemy.name, myW }; saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n}`, `pvp_sw_${Object.keys(WEAPONS).find(k=>WEAPONS[k]===w)}`)]);
  await ctx.reply(`⚔️ ${enemy.name}\n🗡️:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙', 'back_pvp')]]));
});

bot.command('pvp_bet', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = ctx.message.text.trim().split(/\s+/); const tid = args[1]; const bet = Number(args[2]||0);
  if (!tid || !bet) return ctx.reply('/pvp_bet [id] [مبلغ]');
  if (bet < 50) return ctx.reply('❌ حداقل ۵۰');
  if (bet > u.res.gold) return ctx.reply('❌ زر کافی نیست');
  const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌');
  const myW = Object.entries(u.wOwned).filter(([k,v])=>v&&k!=='none').map(([k])=>WEAPONS[k]).filter(w=>w).sort((a,b)=>b.p-a.p).slice(0,2);
  if (!myW.length) return ctx.reply('❌');
  u.pendingPvP = { eid: tid, ename: enemy.name, myW, bet }; saveDB();
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n}`, `pvp_sw_${Object.keys(WEAPONS).find(k=>WEAPONS[k]===w)}`)]);
  await ctx.reply(`🎯 شرط: ${bet} زر\n🗡️:`, Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙', 'back_pvp')]]));
});

bot.command('pvp_stats', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const total = (u.stats.pw||0)+(u.stats.pl||0);
  await ctx.reply(`📊 ${u.name}\n🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}\n⭐${u.pvpRating||0}\n✅${u.stats.pw||0} ❌${u.stats.pl||0}\n📈${total>0?Math.floor((u.stats.pw||0)/total*100):0}%`);
});

bot.command('pvp_rating', async (ctx) => {
  const users = Object.values(db.users).filter(u=>(u.pvpRating||0)>0).sort((a,b)=>(b.pvpRating||0)-(a.pvpRating||0)).slice(0,20);
  if (!users.length) return ctx.reply('❌');
  const text = ['🏆:\n', ...users.map((u,i) => `${i+1}. ${u.name||'?'} | ${PVP_LEAGUES[u.pvpLeague||'bronze'].n} | ⭐${u.pvpRating||0}`)];
  await ctx.reply(text.join('\n'));
});

bot.command('pvp_top', async (ctx) => {
  const users = Object.values(db.users).filter(u=>(u.stats.pw||0)>0).sort((a,b)=>(b.stats.pw||0)-(a.stats.pw||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌');
  let txt = '🏆:\n\n';
  users.forEach((u,i) => txt += `${i+1}. ${u.name||'?'} | 🏆${u.stats.pw||0} | 💀${u.stats.pl||0} | ${u.lvl}\n`);
  await ctx.reply(txt);
});

// ==================== خانه ====================
bot.action('m_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  let upInfo = '🏆 به اوج رسیده';
  if (next) upInfo = `⬆️ ارتقا به ${u.homeLvl+1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nلول: ${next.nl}`;
  await ctx.reply(`🏠 خانه لول ${u.homeLvl}\n\n${upInfo}\n\n/upgrade_home`, Markup.inlineKeyboard([
    [Markup.button.callback('⬆️ ارتقا', 'up_home')], [Markup.button.callback('🔙 بازگشت', 'back_home')],
  ]));
});

bot.action('up_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.answerCbQuery('🏆'); if (u.lvl < next.nl) return ctx.answerCbQuery(`❌ لول ${next.nl}`);
  if (!hasRes(u, next)) return ctx.answerCbQuery('❌ منابع'); takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3; saveDB();
  await ctx.answerCbQuery(`✅ ${u.homeLvl}!`); await ctx.reply(`🏠 خانه لول ${u.homeLvl}!`, backBtn('home'));
});

bot.command('upgrade_home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  if (!next) return ctx.reply('🏆'); if (u.lvl < next.nl) return ctx.reply(`❌ لول ${next.nl}`);
  if (!hasRes(u, next)) return ctx.reply('❌'); takeRes(u, next); u.homeLvl++;
  if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3; saveDB(); await ctx.reply(`✅ ${u.homeLvl}!`);
});

// ==================== درمانگاه ====================
bot.action('m_clinic', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clinicLvl) u.clinicLvl = 1; const amt = 20 + u.clinicLvl * 10;
  await ctx.reply(`🏥 درمانگاه لول ${u.clinicLvl}\n❤️ ${u.hp}/${u.maxHp}\n💊 رایگان: ${u.daily.fh?'❌':'✅'} (+${amt})\n💰 کامل: ۲۰ زر\n/heal free | /heal gold`, Markup.inlineKeyboard([
    [Markup.button.callback('🆓 رایگان', 'hl_free'), Markup.button.callback('💰 کامل', 'hl_gold')], [Markup.button.callback('🔙 بازگشت', 'back_clinic')],
  ]));
});

bot.action('hl_free', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.daily.fh) return ctx.answerCbQuery('❌'); const amt = 20 + (u.clinicLvl||1)*10;
  u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp+amt); saveDB();
  await ctx.answerCbQuery(`✅ +${amt}`); await ctx.reply(`✅ +${amt}\n❤️ ${u.hp}/${u.maxHp}`, backBtn('clinic'));
});

bot.action('hl_gold', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.res.gold < 20) return ctx.answerCbQuery('❌ ۲۰ زر'); addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB();
  await ctx.answerCbQuery('✅'); await ctx.reply(`✅ درمان\n❤️ ${u.hp}/${u.maxHp}`, backBtn('clinic'));
});

bot.command('heal', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/);
  if (args[1] === 'free') { if (u.daily.fh) return ctx.reply('❌'); const amt = 20+(u.clinicLvl||1)*10; u.daily.fh=true; u.hp=Math.min(u.maxHp,u.hp+amt); saveDB(); return ctx.reply(`✅ +${amt}`); }
  if (args[1] === 'gold') { if (u.res.gold<20) return ctx.reply('❌'); addRes(u,'gold',-20); u.hp=u.maxHp; saveDB(); return ctx.reply('✅'); }
  await ctx.reply('/heal free | /heal gold');
});

// ==================== بازار ====================
bot.action('m_shop', async (ctx) => {
  await ctx.reply('🛒 بازار', Markup.inlineKeyboard([
    [Markup.button.callback('📦 منابع', 'sh_res'), Markup.button.callback('🍽️ غذا', 'sh_food')],
    [Markup.button.callback('⚔️ سلاح', 'sh_wep'), Markup.button.callback('🛡️ زره', 'sh_arm')],
    [Markup.button.callback('💰 فروش', 'sh_sell')], [Markup.button.callback('🔙 بازگشت', 'back_shop')],
  ]));
});

bot.action('sh_res', async (ctx) => { await ctx.reply('📦 🪵۸ 🪨۱۰ 🔩۱۸ ⛓️۲۵\n/buy [کالا] [تعداد]', backBtn('shop')); });
bot.action('sh_food', async (ctx) => { await ctx.reply('🍽️ 🍞۱۰ 🍖۲۵ 💧۸\n/buy [کالا] [تعداد]', backBtn('shop')); });
bot.action('sh_wep', async (ctx) => { const list = Object.entries(WEAPONS).filter(([k])=>k!=='none').map(([k,w])=>`${w.n}: ${w.price} زر`).join('\n'); await ctx.reply(`⚔️\n${list}\n/craft [کلید]`, backBtn('shop')); });
bot.action('sh_arm', async (ctx) => { const list = Object.entries(ARMORS).filter(([k])=>k!=='none').map(([k,a])=>`${a.n}: ${a.price} زر`).join('\n'); await ctx.reply(`🛡️\n${list}\n/craft_armor [کلید]`, backBtn('shop')); });
bot.action('sh_sell', async (ctx) => { const u = ensureUser(ctx.from.id, ctx.from.first_name); let txt = '💰 فروش:\n'; for (const [k,v] of Object.entries(u.res||{})) { if (v>0&&k!=='gold') txt += `${RES[k]} ${k}: ${v}\n`; } txt += '/sell [کالا] [تعداد]'; await ctx.reply(txt, backBtn('shop')); });

bot.command('buy', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const amt = Number(args[2]||1); const prices = { wood:8, stone:10, metal:18, iron:25, bread:10, meat:25, water:8 };
  if (!prices[k]) return ctx.reply('❌'); const total = prices[k]*amt;
  if (u.res.gold < total) return ctx.reply(`❌ ${total} زر`); addRes(u,'gold',-total);
  if (['wood','stone','metal','iron'].includes(k)) addRes(u,k,amt); else addItem(u,k,amt); saveDB();
  await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.res.gold}`);
});

bot.command('sell', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/);
  const k = args[1]; const amt = Number(args[2]||1); const prices = { wood:4, stone:5, metal:9, iron:12, bread:5, meat:12, water:4 };
  if (!prices[k]) return ctx.reply('❌'); if ((u.res[k]||0)<amt && (u.items[k]||0)<amt) return ctx.reply('❌');
  if (u.res[k]>=amt) { addRes(u,k,-amt); addRes(u,'gold',prices[k]*amt); } else { addItem(u,k,-amt); addRes(u,'gold',prices[k]*amt); }
  saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.res.gold}`);
});

// ==================== اسلحه‌خانه ====================
bot.action('m_armory', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(WEAPONS).filter(([k])=>k!=='none').map(([k,w]) => [Markup.button.callback(`${u.wOwned[k]?'✅':'🔨'} ${w.n} ${u.weapon===k?'⚔️':''}`, u.wOwned[k]?`eq_w_${k}`:`cr_w_${k}`)]);
  btns.push([Markup.button.callback('🔥 ارتقا', 'enchant_w')], [Markup.button.callback('🔙 بازگشت', 'back_armory')]);
  await ctx.reply(`🛠️ اسلحه‌خانه\nفعلی: ${WEAPONS[u.weapon]?.n||'ندارد'}${u.weaponEnchant?' '+u.weaponEnchant:''}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name); const w = WEAPONS[k];
  if (!w) return ctx.answerCbQuery('❌'); if (u.lvl < w.lvl) return ctx.answerCbQuery(`❌ لول ${w.lvl}`);
  if (u.res.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} زر`); addRes(u,'gold',-w.price); u.wOwned[k]=true; saveDB();
  await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.wOwned[k]) return ctx.answerCbQuery('❌'); u.weapon = k; saveDB(); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n}`);
});

bot.action('enchant_w', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.weapon === 'none') return ctx.answerCbQuery('❌'); if (u.weaponEnchant) return ctx.answerCbQuery('❌');
  await ctx.reply('🔥 ارتقا (۵۰۰ زر)\n🔥 آتشین: +۵\n❄️ یخی: کندی\n💀 زهر: تدریجی\n/enchant [fire|ice|poison]', backBtn('armory'));
});

bot.command('enchant', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const type = args[1];
  if (!['fire','ice','poison'].includes(type)) return ctx.reply('❌'); if (u.weapon === 'none') return ctx.reply('❌');
  if (u.weaponEnchant) return ctx.reply('❌'); if (u.res.gold < 500) return ctx.reply('❌ ۵۰۰ زر');
  addRes(u,'gold',-500); const enchants = { fire: '🔥 آتشین', ice: '❄️ یخی', poison: '💀 زهرآگین' }; u.weaponEnchant = enchants[type]; saveDB();
  await ctx.reply(`✅ ${enchants[type]}!`);
});

bot.command('craft', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const w = WEAPONS[k];
  if (!w||k==='none') return ctx.reply('❌'); if (u.lvl<w.lvl) return ctx.reply(`❌ لول ${w.lvl}`);
  if (u.res.gold<w.price) return ctx.reply(`❌ ${w.price} زر`); addRes(u,'gold',-w.price); u.wOwned[k]=true; saveDB(); await ctx.reply(`✅ ${w.n}`);
});

bot.command('equip', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const k = args[1];
  if (!u.wOwned[k]) return ctx.reply('❌'); u.weapon=k; saveDB(); await ctx.reply(`⚔️ ${WEAPONS[k].n}`);
});

// ==================== زره‌خانه ====================
bot.action('m_armor_shop', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(ARMORS).filter(([k])=>k!=='none').map(([k,a]) => [Markup.button.callback(`${u.aOwned[k]?'✅':'🔨'} ${a.n} ${u.armor===k?'🛡️':''}`, u.aOwned[k]?`eq_a_${k}`:`cr_a_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_armor')]);
  await ctx.reply(`🛡️ زره‌خانه\nفعلی: ${ARMORS[u.armor]?.n||'ندارد'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name); const a = ARMORS[k];
  if (!a) return ctx.answerCbQuery('❌'); if (u.lvl < a.lvl) return ctx.answerCbQuery(`❌ لول ${a.lvl}`);
  if (u.res.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} زر`); addRes(u,'gold',-a.price); u.aOwned[k]=true; saveDB();
  await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.aOwned[k]) return ctx.answerCbQuery('❌'); u.armor = k; saveDB(); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n}`);
});

bot.command('craft_armor', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const a = ARMORS[k];
  if (!a||k==='none') return ctx.reply('❌'); if (u.lvl<a.lvl) return ctx.reply(`❌ لول ${a.lvl}`);
  if (u.res.gold<a.price) return ctx.reply(`❌ ${a.price} زر`); addRes(u,'gold',-a.price); u.aOwned[k]=true; saveDB(); await ctx.reply(`✅ ${a.n}`);
});

// ==================== آتشکده ====================
bot.action('m_pray', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await ctx.reply('🕯️ آتشکده', Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
    [Markup.button.callback('📖 روضه', 'p_rozeh')], [Markup.button.callback('🔙 بازگشت', 'back_pray')],
  ]));
});

bot.action(['p_dua','p_namaz','p_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'pray'); const xpG = u.lvl<=3?60:30; addXP(u, xpG);
  u.loyaltyPoints = (u.loyaltyPoints||0)+3; progressQuest(u, 'pray'); saveDB();
  const names = { p_dua:'دعا', p_namaz:'نماز', p_rozeh:'روضه' };
  await ctx.answerCbQuery(`✨ +${xpG}`); await ctx.reply(`✅ ${names[ctx.match[0]]} قبول!\n✨ +${xpG}\n🎚️ ${u.lvl}`, backBtn('pray'));
});

// ==================== غذا ====================
bot.action('m_eat', async (ctx) => {
  await ctx.reply('🍽️ سفره', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat')],
    [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
    [Markup.button.callback('🥩 گوشت', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
    [Markup.button.callback('🍜 آش', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake')],
    [Markup.button.callback('🍯 انگبین', 'e_honey')],
    [Markup.button.callback('💧 آب', 'd_water'), Markup.button.callback('🧃 شربت', 'd_juice')],
    [Markup.button.callback('🍺 دوغ', 'd_soda'), Markup.button.callback('🍵 چای', 'd_tea')],
    [Markup.button.callback('☕ قهوه', 'd_coffee'), Markup.button.callback('🥛 شیر', 'd_milk')],
    [Markup.button.callback('🔙 بازگشت', 'back_eat')],
  ]));
});

bot.action(/e_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k]||0)<1) return ctx.answerCbQuery('❌'); const food = FOODS[k]; if (!food) return ctx.answerCbQuery('❌');
  addItem(u,k,-1); if (food.h) u.hunger = Math.min(u.maxHunger, u.hunger+food.h); if (food.heal) u.hp = Math.min(u.maxHp, u.hp+food.heal);
  saveDB(); await ctx.answerCbQuery(`✅ ${food.n}`);
});

bot.action(/d_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k]||0)<1) return ctx.answerCbQuery('❌'); const drink = DRINKS[k]; if (!drink) return ctx.answerCbQuery('❌');
  addItem(u,k,-1); if (drink.t) u.thirst = Math.min(u.maxThirst, u.thirst+drink.t); if (drink.xp) addXP(u, drink.xp);
  saveDB(); await ctx.answerCbQuery(`✅ ${drink.n}`);
});

// ==================== NPC ====================
bot.action('m_npc', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'npc', CD.npc);
  const btns = Object.entries(NPCS).map(([k, npc]) => [Markup.button.callback(`${npc.n}: ${npc.desc} (${npc.price} زر)`, `npc_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await ctx.reply(`👤 بزرگان\n${cd.can?'✅':'⏳ '+formatTime(cd.rem)}`, Markup.inlineKeyboard(btns));
});

bot.action(/npc_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const npc = NPCS[k]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!npc) return ctx.answerCbQuery('❌'); const cd = checkCD(u, 'npc', CD.npc);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  if (u.res.gold < npc.price) return ctx.answerCbQuery(`❌ ${npc.price} زر`);
  addRes(u, 'gold', -npc.price); const result = npc.effect(u); setCD(u, 'npc'); saveDB();
  await ctx.answerCbQuery('✅'); await ctx.reply(`👤 ${npc.n}\n${result}`, backBtn('main'));
});

// ==================== مأموریت‌ها ====================
bot.action('m_quest', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.quests || !u.quests.length) rollQuests(u);
  const text = ['📋 مأموریت‌ها:\n'];
  u.quests.forEach(q => { const prog = u.questProgress[q.target] || 0; text.push(`${prog>=q.goal?'✅':'⏳'} ${q.n}: ${prog}/${q.goal}`); });
  text.push('\n/claim_quests');
  await ctx.reply(text.join('\n'), backBtn('main'));
});

bot.command('claim_quests', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.quests || !u.quests.length) return ctx.reply('❌');
  let claimed = false;
  for (const q of u.quests) { if ((u.questProgress[q.target]||0) >= q.goal && !q.claimed) { giveReward(u, q.rew); if (q.rew.xp) addXP(u, q.rew.xp); q.claimed = true; claimed = true; } }
  if (!claimed) return ctx.reply('❌'); saveDB(); await ctx.reply('✅');
});

// ==================== حیوانات ====================
bot.action('m_pet', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const current = u.pet ? PETS[u.pet]?.n : 'نداری';
  const btns = Object.entries(PETS).map(([k, pet]) => [Markup.button.callback(`${pet.n}: ${pet.bonus} (${pet.price} زر)`, `buy_pet_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await ctx.reply(`🐎 حیوانات\nفعلی: ${current}`, Markup.inlineKeyboard(btns));
});

bot.action(/buy_pet_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const pet = PETS[k]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!pet) return ctx.answerCbQuery('❌'); if (u.pet) return ctx.answerCbQuery('❌');
  if (u.res.gold < pet.price) return ctx.answerCbQuery(`❌ ${pet.price} زر`);
  addRes(u, 'gold', -pet.price); u.pet = k; saveDB();
  await ctx.answerCbQuery(`✅ ${pet.n}!`); await ctx.reply(`🐎 ${pet.n} همراه تو شد!\n✨ ${pet.bonus}`, backBtn('main'));
});

// ==================== بانک ====================
bot.action('m_bank', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await ctx.reply(`🏦 بانک\n💰 ${u.bankGold||0} زر\n📈 سود: ${u.bankInterest||0}\n💎 ۲٪ روزانه\n/deposit [مبلغ]\n/withdraw [مبلغ]`, backBtn('main'));
});

bot.command('deposit', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const amt = Number(args[1]||0);
  if (!amt || amt <= 0) return ctx.reply('❌'); if (u.res.gold < amt) return ctx.reply('❌');
  addRes(u, 'gold', -amt); u.bankGold = (u.bankGold||0) + amt; saveDB(); await ctx.reply(`✅ ${amt} زر\n🏦 ${u.bankGold}`);
});

bot.command('withdraw', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const amt = Number(args[1]||0);
  if (!amt || amt <= 0) return ctx.reply('❌'); if ((u.bankGold||0) < amt) return ctx.reply('❌');
  u.bankGold -= amt; addRes(u, 'gold', amt); saveDB(); await ctx.reply(`✅ ${amt} زر\n💰 ${u.res.gold}`);
});

// ==================== دستاوردها ====================
bot.action('m_achieve', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  checkAchievements(u); saveDB();
  const text = ['🏆 دستاوردها:\n']; let count = 0;
  ACHIEVEMENTS.forEach(ach => { if (u.achievements.includes(ach.id)) { text.push(`✅ ${ach.n}`); count++; } else text.push(`🔒 ${ach.n}: ${ach.desc}`); });
  text.push(`\n📊 ${count}/${ACHIEVEMENTS.length}`);
  await ctx.reply(text.join('\n'), backBtn('main'));
});

// ==================== کلن ====================
bot.action('m_clan', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clan) {
    await ctx.reply(`🏰 قبیله\n\nتو عضو هیچ قبیله‌ای نیستی!\n/create_clan [اسم]\n/join_clan [اسم]\n/clans`, backBtn('main'));
  } else {
    const clan = db.clans[u.clan];
    if (!clan) { u.clan = null; saveDB(); return ctx.reply('❌', backBtn('main')); }
    const members = clan.members.map(mid => db.users[mid]?.name || mid).join(', ');
    await ctx.reply(`🏰 ${clan.name}\n👑 ${db.users[clan.owner]?.name}\n👥 ${members}\n💰 ${clan.treasury||0} زر\n/donate [gold] [مقدار]\n/leave_clan`, backBtn('main'));
  }
});

bot.command('create_clan', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.clan) return ctx.reply('❌'); if (u.res.gold < 1000) return ctx.reply('❌ ۱۰۰۰ زر');
  const args = ctx.message.text.trim().split(/\s+/); const name = args.slice(1).join(' ');
  if (!name) return ctx.reply('/create_clan [اسم]');
  if (Object.values(db.clans).some(c => c.name === name)) return ctx.reply('❌');
  const clanId = 'c' + Date.now(); db.clans[clanId] = { id: clanId, name, owner: u.id, members: [u.id], treasury: 0 };
  u.clan = clanId; addRes(u, 'gold', -1000); saveDB(); await ctx.reply(`✅ ${name} ساخته شد!`);
});

bot.command('join_clan', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.clan) return ctx.reply('❌'); const args = ctx.message.text.trim().split(/\s+/); const name = args.slice(1).join(' ');
  if (!name) return ctx.reply('/join_clan [اسم]'); const clan = Object.values(db.clans).find(c => c.name === name);
  if (!clan) return ctx.reply('❌'); clan.members.push(u.id); u.clan = clan.id; saveDB(); await ctx.reply(`✅ به ${name} پیوستی!`);
});

bot.command('leave_clan', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clan) return ctx.reply('❌'); const clan = db.clans[u.clan];
  if (clan) { clan.members = clan.members.filter(m => m !== u.id); if (clan.members.length === 0) delete db.clans[u.clan]; else if (clan.owner === u.id) clan.owner = clan.members[0]; }
  u.clan = null; saveDB(); await ctx.reply('✅');
});

bot.command('donate', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clan) return ctx.reply('❌'); const args = ctx.message.text.trim().split(/\s+/); const key = args[1]; const amt = Number(args[2]||0);
  if (key === 'gold' && u.res.gold >= amt && amt > 0) { addRes(u, 'gold', -amt); db.clans[u.clan].treasury = (db.clans[u.clan].treasury||0) + amt; saveDB(); await ctx.reply(`✅ ${amt} زر`); }
  else await ctx.reply('❌ /donate gold [مقدار]');
});

bot.command('clans', async (ctx) => {
  const clans = Object.values(db.clans);
  if (!clans.length) return ctx.reply('❌');
  const text = ['🏰:\n', ...clans.map(c => `${c.name}: ${c.members.length} عضو | ${c.treasury||0} زر`)];
  await ctx.reply(text.join('\n'));
});

// ==================== مهارت ====================
bot.action('m_skills', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await ctx.reply(`⭐ مهارت‌ها | ${u.sp||0} امتیاز\n⛏️ ${u.skills.g}/10 | 🏹 ${u.skills.h}/10\n🔨 ${u.skills.c}/10 | 🏕️ ${u.skills.s}/10\n/skill <g|h|c|s>`, Markup.inlineKeyboard([
    [Markup.button.callback('⛏️', 'sk_g'), Markup.button.callback('🏹', 'sk_h')],
    [Markup.button.callback('🔨', 'sk_c'), Markup.button.callback('🏕️', 'sk_s')], [Markup.button.callback('🔙', 'back_skills')],
  ]));
});

bot.action(/sk_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.sp||u.sp<=0) return ctx.answerCbQuery('❌'); if ((u.skills[k]||0)>=10) return ctx.answerCbQuery('❌');
  u.skills[k]=(u.skills[k]||0)+1; u.sp--; saveDB(); await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name); const args = ctx.message.text.trim().split(/\s+/); const k = args[1];
  if (!['g','h','c','s'].includes(k)) return ctx.reply('❌'); if (!u.sp||u.sp<=0) return ctx.reply('❌');
  if ((u.skills[k]||0)>=10) return ctx.reply('❌'); u.skills[k]=(u.skills[k]||0)+1; u.sp--; saveDB(); await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`);
});

// ==================== راهنما ====================
bot.action('m_guide', async (ctx) => {
  await ctx.reply(`📖 راهنما\n🌲 ${formatTime(CD.gather)}\n⚔️ ${formatTime(CD.fight)}\n👹 ${formatTime(CD.boss)}\n🏟️ ${formatTime(CD.pvp)}\n🕯️ ${formatTime(CD.pray)}\n🎁 ${formatTime(CD.daily)}\n📜 ${formatTime(CD.shahnameh)}`, backBtn('guide'));
});

// ==================== زمان‌ها ====================
bot.action('m_cd', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const acts = [['gather','🌲',CD.gather],['fight','⚔️',CD.fight],['boss','👹',CD.boss],['pvp','🏟️',CD.pvp],['pray','🕯️',CD.pray],['daily','🎁',CD.daily],['shahnameh','📜',CD.shahnameh],['npc','👤',CD.npc]];
  const lines = ['⏱️:\n'];
  for (const [k,n,cd] of acts) { const c = checkCD(u,k,cd); lines.push(`${n}: ${c.can?'✅':`⏳ ${formatTime(c.rem)}`}`); }
  await ctx.reply(lines.join('\n'), backBtn('cd'));
});

// ==================== جایزه روزانه ====================
bot.action('m_daily', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'daily', CD.daily);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'daily'); const reward = { gold: rnd(50,150), xp: rnd(10,30) };
  giveReward(u, reward); u.loyaltyPoints=(u.loyaltyPoints||0)+10; addXP(u,reward.xp||0); saveDB();
  await ctx.answerCbQuery('🎁'); await ctx.reply(`🎁 جایزه!\n${rwText(reward)}\n✨ +${reward.xp}\n⭐ +۱۰`, backBtn('main'));
});

bot.command('daily', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'daily', CD.daily);
  if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'daily'); const reward = { gold: rnd(50,150), xp: rnd(10,30) };
  giveReward(u, reward); u.loyaltyPoints=(u.loyaltyPoints||0)+10; addXP(u,reward.xp||0); saveDB();
  await ctx.reply(`🎁 ${rwText(reward)}\n✨ +${reward.xp}`);
});

bot.command('shahnameh', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'shahnameh', CD.shahnameh);
  if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  setCD(u,'shahnameh'); const verse = SHAHNAMEH[rnd(0, SHAHNAMEH.length-1)];
  u.shahnamehCount=(u.shahnamehCount||0)+1; u.loyaltyPoints=(u.loyaltyPoints||0)+verse.reward;
  addRes(u,'gold',verse.reward); progressQuest(u, 'shahnameh'); saveDB();
  await ctx.reply(`📜 «${verse.verse}»\n🎁 ${verse.reward} زر\n📚 ${u.shahnamehCount} شعر`);
});

bot.command('top_loyalty', async (ctx) => {
  const users = Object.values(db.users).filter(u=>(u.loyaltyPoints||0)>0).sort((a,b)=>(b.loyaltyPoints||0)-(a.loyaltyPoints||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌');
  const text = ['🏆:\n', ...users.map((u,i) => `${i+1}. ${u.name||'?'} | ⭐${u.loyaltyPoints||0} | 📚${u.shahnamehCount||0}`)];
  await ctx.reply(text.join('\n'));
});

// ==================== ادمین ====================
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const users = Object.values(db.users).sort((a,b)=>b.lvl-a.lvl).slice(0,10);
  let txt = `👥 ${Object.keys(db.users).length}\n🏆:\n`;
  users.forEach((u,i) => txt += `${i+1}. ${u.name||'?'} | ${u.lvl} | 🥇${u.res.gold}\n`);
  await ctx.reply(txt);
});

bot.command('admin_give', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = ctx.message.text.trim().split(/\s+/); const u = ensureUser(args[1],'');
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
  u.weapon='zolfaghar'; u.armor='babr_bayan'; u.lvl=20; u.hp=u.maxHp=500; u.sp=40;
  u.homeLvl=5; u.clinicLvl=3; u.pvpRating=1500; u.pvpLeague='legendary';
  u.loyaltyPoints=1000; u.shahnamehCount=50; saveDB(); await ctx.reply('✅');
});

// ==================== مدیریت خطا ====================
bot.catch((err, ctx) => {
  console.error('❌', err.message);
  try { ctx.reply('❌ خطا. /start').catch(() => {}); } catch (e) {}
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true })
  .then(() => console.log('✅ بقای باستانی - پرو مکس با برگشت هوشمند اجرا شد!'))
  .catch(err => console.error('❌', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));