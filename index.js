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

// ==================== عکس‌های بازی ====================
const IMAGES = {
  main: 'AgACAgQAAxkBAAFLQ1hqHeE5_2DNtv-c7vXNvlvDzcU2fQACfQ5rG1tF6FB44iYU1s4wDAEAAwIAA3kAAzsE',
  gather: 'AgACAgQAAxkBAAFLQ1lqHeE5nuotPpVTda4Zp_HcAAEvxiAAAn4OaxtbRehQbyq4FMe8AVcBAAMCAAN5AAM7BA',
  fight: 'AgACAgQAAxkBAAFLQ1pqHeE5INNW8pvgTy_zL6hot6hnDgACfw5rG1tF6FDAnH2qKREROgEAAwIAA3kAAzsE',
  demon: 'AgACAgQAAxkBAAFLQ1tqHeE5UWQ36gJJA3rlpAJ_a-9GUQACgA5rG1tF6FADpSgH2lpXxAEAAwIAA3kAAzsE',
  shop: 'AgACAgQAAxkBAAFLQ1xqHeE57-7UwtrxoAue33Tj8qZ2ygACgQ5rG1tF6FDwf9RF0-_aBgEAAwIAA3kAAzsE',
  aramgah: 'AgACAgQAAxkBAAFLQ11qHeE5xKtpYfLlC9iJcm7Xe6DGyAACgg5rG1tF6FDbzuLJ2BC_fQEAAwIAA3kAAzsE',
  dragon: 'AgACAgQAAxkBAAFLQ15qHeE5AaLgMilG1B5C6Amw1JiCYwACgw5rG1tF6FD2QF30YLZcLgEAAwIAA3gAAzsE'
};

// ==================== کول‌داون‌ها (به میلی‌ثانیه) ====================
const COOLDOWNS = {
  gather: 2 * 60 * 1000,      // ۲ دقیقه
  fight: 3 * 60 * 1000,       // ۳ دقیقه
  boss: 10 * 60 * 1000,       // ۱۰ دقیقه
  pray: 6 * 60 * 60 * 1000,   // ۶ ساعت
  daily: 24 * 60 * 60 * 1000, // ۲۴ ساعت
};

// ==================== دیتابیس ====================
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { users: {}, clans: {} };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: {}, clans: {} };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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

// تابع بررسی کول‌داون
function checkCooldown(u, action, cooldownMs) {
  const now = Date.now();
  if (!u.cooldowns) u.cooldowns = {};
  if (!u.cooldowns[action]) return { canDo: true, remaining: 0 };
  
  const elapsed = now - u.cooldowns[action];
  if (elapsed >= cooldownMs) return { canDo: true, remaining: 0 };
  
  return { canDo: false, remaining: cooldownMs - elapsed };
}

// فرمت زمان باقی‌مونده
function formatTime(ms) {
  if (ms <= 0) return '0 ثانیه';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours} ساعت و ${minutes % 60} دقیقه`;
  if (minutes > 0) return `${minutes} دقیقه و ${seconds % 60} ثانیه`;
  return `${seconds} ثانیه`;
}

// نوار پیشرفت
function progressBar(current, max, length = 10) {
  const filled = Math.floor((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function setCooldown(u, action) {
  if (!u.cooldowns) u.cooldowns = {};
  u.cooldowns[action] = Date.now();
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
  bandage: { name: '🩹 باند', heal: 15, price: 25, sell: 12 },
  medkit: { name: '💊 جعبه کمک', heal: 40, price: 80, sell: 40 },
  soup: { name: '🍲 سوپ', heal: 10, price: 18, sell: 9, hunger: 20 },
  herb: { name: '🌿 گیاه', heal: 20, price: 35, sell: 17 },
  elixir: { name: '🧪 اکسیر', heal: 100, price: 200, sell: 100 }
};

const FOOD_ITEMS = {
  bread: { name: '🍞 نان', hunger: 30, price: 10, sell: 5 },
  meat: { name: '🍖 گوشت', hunger: 50, price: 25, sell: 12 },
  fish: { name: '🐟 ماهی', hunger: 25, price: 15, sell: 7 },
  water: { name: '💧 آب', thirst: 40, price: 8, sell: 4 },
  juice: { name: '🧃 آبمیوه', thirst: 50, price: 20, sell: 10 }
};

const SPECIAL_ITEMS = {
  gem: { name: '💎 سنگ قیمتی', price: 120, sell: 60 },
  map: { name: '🗺️ نقشه', price: 90, sell: 45 },
  fuel: { name: '⛽ سوخت', price: 75, sell: 35 },
  dragon_scale: { name: '🐉 فلس اژدها', price: 500, sell: 250 },
  phoenix_feather: { name: '🦅 پر ققنوس', price: 800, sell: 400 }
};

// ==================== موجودات ====================
const ANIMALS = [
  { name: '🐺 گرگ', type: 'animal', power: 8, hpLoss: [8, 16], rewards: { gold: 10, meat: 1 }, xpReward: 8 },
  { name: '🐗 گراز', type: 'animal', power: 10, hpLoss: [9, 18], rewards: { gold: 12, meat: 2 }, xpReward: 10 },
  { name: '🦊 کفتار', type: 'animal', power: 12, hpLoss: [10, 20], rewards: { gold: 15, meat: 1 }, xpReward: 12 },
  { name: '🐻 خرس', type: 'animal', power: 16, hpLoss: [14, 28], rewards: { gold: 20, meat: 3 }, xpReward: 15 }
];

const DEMONS = [
  { name: '👹 دیو سرخ', type: 'demon', power: 16, hpLoss: [18, 35], rewards: { gold: 28, iron: 2, gem: 1 }, xpReward: 18 },
  { name: '👺 دیو سنگی', type: 'demon', power: 22, hpLoss: [22, 40], rewards: { gold: 40, iron: 3, gem: 1 }, xpReward: 22 },
  { name: '👾 دیو تاریکی', type: 'demon', power: 28, hpLoss: [25, 48], rewards: { gold: 55, iron: 4, gem: 2 }, xpReward: 28 }
];

const BOSSES = [
  { name: '🐉 اژدهای آتشین', type: 'boss', power: 40, hpLoss: [35, 70], rewards: { gold: 500, dragon_scale: 2, gem: 5 }, xpReward: 100, minLevel: 8 },
  { name: '🦅 ققنوس', type: 'boss', power: 50, hpLoss: [40, 80], rewards: { gold: 800, phoenix_feather: 2, gem: 8 }, xpReward: 150, minLevel: 10 },
  { name: '👹 شیطان بزرگ', type: 'boss', power: 65, hpLoss: [50, 100], rewards: { gold: 1500, dragon_scale: 3, phoenix_feather: 3, gem: 15 }, xpReward: 250, minLevel: 15 }
];

// ==================== مدیریت کاربر ====================
function ensureUser(id, name = '') {
  const uid = String(id);
  if (!db.users[uid]) {
    db.users[uid] = {
      id: uid, name,
      playerLevel: 1, playerXP: 0,
      hp: 100, maxHp: 300,
      hunger: 100, maxHunger: 100,
      thirst: 100, maxThirst: 100,
      homeLevel: 1, weapon: 'none', clan: null,
      skills: { gathering: 0, hunting: 0, crafting: 0, survival: 0 },
      skillPoints: 0,
      resources: { wood: 20, stone: 20, metal: 20, iron: 20, gold: 30, toman: 20 },
      items: { bandage: 1, medkit: 0, soup: 0, herb: 0, elixir: 0, bread: 2, meat: 0, fish: 0, water: 2, juice: 0, gem: 0, map: 0, fuel: 0, dragon_scale: 0, phoenix_feather: 0 },
      weaponsOwned: { none: true },
      cooldowns: {},
      stats: { gather: 0, fight_win: 0, demon_win: 0, boss_win: 0 },
      pendingFight: null
    };
    saveDB(db);
  } else {
    if (name && !db.users[uid].name) db.users[uid].name = name;
    normalizeUser(db.users[uid]);
  }
  return db.users[uid];
}

function normalizeUser(u) {
  u.playerLevel ??= 1; u.playerXP ??= 0;
  u.hp ??= 100; u.maxHp ??= 300;
  u.hunger ??= 100; u.maxHunger ??= 100;
  u.thirst ??= 100; u.maxThirst ??= 100;
  u.homeLevel ??= 1; u.weapon ??= 'none'; u.clan ??= null;
  u.skills ??= { gathering: 0, hunting: 0, crafting: 0, survival: 0 };
  u.skillPoints ??= 0;
  u.resources ??= {}; u.items ??= {}; u.weaponsOwned ??= { none: true };
  u.cooldowns ??= {};
  u.stats ??= {}; u.pendingFight ??= null;
  
  for (const k of RES_KEYS) if (typeof u.resources[k] !== 'number') u.resources[k] = 0;
  for (const k of [...Object.keys(HEAL_ITEMS), ...Object.keys(FOOD_ITEMS), ...Object.keys(SPECIAL_ITEMS)]) {
    if (typeof u.items[k] !== 'number') u.items[k] = 0;
  }
  u.weaponsOwned.none = true;
}

function addXP(u, amount) {
  u.playerXP += amount;
  let ups = 0;
  while (u.playerXP >= 30) {
    u.playerXP -= 30; u.playerLevel += 1;
    u.maxHp += 10; u.maxHunger += 5; u.maxThirst += 5;
    u.hp = u.maxHp; u.hunger = u.maxHunger; u.thirst = u.maxThirst;
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

function bumpAction(u, actionKey, amount = 1) {
  u.stats[actionKey] = (u.stats[actionKey] || 0) + amount;
}

function rewardText(rew) {
  const out = [];
  for (const [k, v] of Object.entries(rew)) {
    if (RES_LABELS[k]) out.push(`${RES_EMOJI[k]} ${v}`);
    else if (HEAL_ITEMS[k]) out.push(`${v} ${HEAL_ITEMS[k].name}`);
    else if (FOOD_ITEMS[k]) out.push(`${v} ${FOOD_ITEMS[k].name}`);
    else if (SPECIAL_ITEMS[k]) out.push(`${v} ${SPECIAL_ITEMS[k].name}`);
  }
  return out.join(' | ');
}

// ==================== منوها ====================
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🪓 جستجو', 'gather')],
    [Markup.button.callback('⚔️ مبارزه', 'fight_menu'), Markup.button.callback('👹 باس', 'boss_menu')],
    [Markup.button.callback('🏠 خانه', 'home'), Markup.button.callback('🏥 درمانگاه', 'clinic')],
    [Markup.button.callback('🛒 فروشگاه', 'shop'), Markup.button.callback('🛠️ اسلحه‌خانه', 'armory')],
    [Markup.button.callback('🕯️ آرامگاه', 'aramgah'), Markup.button.callback('🏛️ کلن', 'clan')],
    [Markup.button.callback('📖 راهنما', 'guide'), Markup.button.callback('⭐ مهارت', 'skills_menu')],
    [Markup.button.callback('🍽️ غذا', 'eat_menu'), Markup.button.callback('⏱️ زمان‌ها', 'cooldowns')]
  ]);
}

function backMenu() {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]);
}

// ==================== گیم‌پلی ====================
function performGather(u) {
  const table = [
    { wood: 3, stone: 1 }, { wood: 2, stone: 2, gold: 3 },
    { metal: 1, stone: 2 }, { wood: 1, iron: 1 },
    { gold: 6, wood: 2 }, { stone: 3, metal: 1 },
    { wood: 4 }, { gold: 10, metal: 1, stone: 1 }
  ];
  const roll = table[rnd(0, table.length - 1)];
  for (const [k, v] of Object.entries(roll)) addResource(u, k, v);
  if (Math.random() < 0.3) {
    const food = ['bread', 'fish', 'water'][rnd(0, 2)];
    addItem(u, food, 1);
    roll.food = FOOD_ITEMS[food]?.name || food;
  }
  bumpAction(u, 'gather', 1);
  return roll;
}

function executeCombat(u, enemy) {
  if (u.hp <= 0) return { blocked: true, text: '❌ HP صفر است' };
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const playerPower = u.playerLevel * 4 + weapon.power + rnd(0, 8);
  const enemyPower = enemy.power + rnd(0, 10);
  const loss = rnd(enemy.hpLoss[0], enemy.hpLoss[1]);
  let winChance = clamp(50 + (playerPower - enemyPower) * 4, 10, 90);
  const win = Math.random() * 100 < winChance;
  u.hp = clamp(u.hp - loss, 0, u.maxHp);

  if (win) {
    for (const [k, v] of Object.entries(enemy.rewards)) {
      if (RES_LABELS[k]) addResource(u, k, v);
      else addItem(u, k, v);
    }
    if (enemy.type === 'animal') bumpAction(u, 'fight_win', 1);
    else if (enemy.type === 'demon') bumpAction(u, 'demon_win', 1);
    else if (enemy.type === 'boss') bumpAction(u, 'boss_win', 1);
    const xp = enemy.xpReward || 10;
    addXP(u, xp);
    return { blocked: false, win: true, loss, xp, text: `⚔️ ${enemy.name}\n✅ پیروزی!\n✨ +${xp} XP\n❤️ -${loss} HP\n🎁 ${rewardText(enemy.rewards)}` };
  }
  return { blocked: false, win: false, loss, text: `⚔️ ${enemy.name}\n❌ شکست!\n❤️ -${loss} HP` };
}

// ==================== نمایش کول‌داون‌ها ====================
function getCooldownsText(u) {
  const now = Date.now();
  const lines = ['⏱️ وضعیت زمان‌ها:', ''];
  
  const actions = [
    { key: 'gather', name: '🪓 جستجو', cooldown: COOLDOWNS.gather },
    { key: 'fight', name: '⚔️ مبارزه', cooldown: COOLDOWNS.fight },
    { key: 'boss', name: '👹 باس فایت', cooldown: COOLDOWNS.boss },
    { key: 'pray', name: '🕯️ آرامگاه', cooldown: COOLDOWNS.pray },
  ];
  
  for (const action of actions) {
    const cd = checkCooldown(u, action.key, action.cooldown);
    if (cd.canDo) {
      lines.push(`${action.name}: ✅ آماده`);
    } else {
      const remaining = formatTime(cd.remaining);
      const bar = progressBar(action.cooldown - cd.remaining, action.cooldown, 8);
      lines.push(`${action.name}: ⏳ ${remaining}`);
      lines.push(`[${bar}]`);
    }
  }
  
  return lines.join('\n');
}

// ==================== استارت ====================
bot.start((ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  ctx.replyWithPhoto(IMAGES.main, {
    caption: `🏕️ ${u.name || 'قهرمان'}، به دنیای بقا خوش اومدی!\n\n🎯 هدف: زنده بمون، قوی شو، دنیا رو فتح کن!\n\nاز دکمه‌های زیر استفاده کن 👇`,
    ...mainMenu()
  });
});

// ==================== اکشن‌ها ====================
// وضعیت
bot.action('status', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const text = [
    `🏕️ ${u.name || 'بازیکن'}`,
    `🎚️ لول ${u.playerLevel} | ✨ XP: ${u.playerXP}/30 ${progressBar(u.playerXP, 30, 6)}`,
    `❤️ HP: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp, 8)}`,
    `🍞 گرسنگی: ${Math.floor(u.hunger)}/${u.maxHunger}`,
    `💧 تشنگی: ${Math.floor(u.thirst)}/${u.maxThirst}`,
    `⚔️ سلاح: ${weapon.name}`,
    `🏠 خانه: لول ${u.homeLevel}`,
    `⭐ مهارت: ${u.skillPoints || 0} امتیاز`,
    ``,
    `📦 منابع:`,
    `🪵${u.resources.wood} 🪨${u.resources.stone} 🔩${u.resources.metal}`,
    `⛓️${u.resources.iron} 🥇${u.resources.gold} 💵${u.resources.toman}`,
    ``,
    `🎒 آیتم‌های مهم:`,
    `🩹${u.items.bandage} 💊${u.items.medkit} 🍞${u.items.bread} 💧${u.items.water} 🍖${u.items.meat}`
  ].join('\n');
  
  ctx.replyWithPhoto(IMAGES.main, { caption: text, ...backMenu() });
});

// جستجو
bot.action('gather', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  const cd = checkCooldown(u, 'gather', COOLDOWNS.gather);
  if (!cd.canDo) {
    return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه صبر کن`);
  }
  
  setCooldown(u, 'gather');
  const found = performGather(u);
  saveDB(db);
  
  let text = `🪓 جستجو در جنگل...\n\n🎁 ${rewardText(found)}`;
  if (found.food) text += `\n🍽️ ${found.food} هم پیدا شد!`;
  text += `\n\n⏱️ جستجوی بعدی: ${formatTime(COOLDOWNS.gather)} دیگه`;
  
  ctx.replyWithPhoto(IMAGES.gather, { caption: text, ...backMenu() });
});

// منوی مبارزه
bot.action('fight_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  const cd = checkCooldown(u, 'fight', COOLDOWNS.fight);
  if (!cd.canDo) {
    return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه صبر کن`);
  }
  
  ctx.replyWithPhoto(IMAGES.fight, {
    caption: `⚔️ میدون مبارزه!\n🎯 یه حریف انتخاب کن:`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🐺 حیوانات وحشی', 'fight_type_animal')],
      [Markup.button.callback('👹 دیوها', 'fight_type_demon')],
      [Markup.button.callback('🎲 رندوم', 'fight_type_random')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

// منوی باس
bot.action('boss_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  const cd = checkCooldown(u, 'boss', COOLDOWNS.boss);
  if (!cd.canDo) {
    return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه صبر کن`);
  }
  
  ctx.replyWithPhoto(IMAGES.dragon, {
    caption: `👹 باس‌های افسانه‌ای\n⚠️ بسیار خطرناک!`,
    ...Markup.inlineKeyboard([
      ...BOSSES.map((b, i) => [Markup.button.callback(`${b.name} (لول ${b.minLevel}+)`, `fight_boss_${i}`)]),
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

// انتخاب نوع مبارزه
bot.action(/fight_type_(.+)/, (ctx) => {
  const type = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر است. برو درمانگاه');
  
  let pool = type === 'animal' ? ANIMALS : type === 'demon' ? DEMONS : [...ANIMALS, ...DEMONS];
  const enemy = pool[rnd(0, pool.length - 1)];
  u.pendingFight = enemy;
  saveDB(db);
  
  const img = type === 'demon' ? IMAGES.demon : IMAGES.fight;
  ctx.replyWithPhoto(img, {
    caption: `⚔️ ${enemy.name} پیدا شد!\n\n💪 قدرت: ${enemy.power}\n❤️ آسیب: ${enemy.hpLoss[0]}-${enemy.hpLoss[1]}\n🎁 غنیمت: ${rewardText(enemy.rewards)}\n\nآماده‌ای مبارزه کنی؟`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
      [Markup.button.callback('🏃 فرار', 'back_main')]
    ])
  });
});

// انتخاب باس
bot.action(/fight_boss_(.+)/, (ctx) => {
  const index = parseInt(ctx.match[1]);
  const boss = BOSSES[index];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!boss) return ctx.answerCbQuery('❌ باس یافت نشد');
  if (u.playerLevel < boss.minLevel) return ctx.answerCbQuery(`❌ لول ${boss.minLevel} لازمه`);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر است');
  
  u.pendingFight = boss;
  saveDB(db);
  
  ctx.replyWithPhoto(IMAGES.dragon, {
    caption: `👹 ${boss.name}\n\n💪 قدرت: ${boss.power}\n❤️ آسیب: ${boss.hpLoss[0]}-${boss.hpLoss[1]}\n🎁 غنیمت: ${rewardText(boss.rewards)}\n\n⚠️ این نبرد بسیار خطرناکه!\nآماده‌ای؟`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
      [Markup.button.callback('🏃 فرار', 'back_main')]
    ])
  });
});

// تأیید مبارزه
bot.action('fight_confirm', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!u.pendingFight) return ctx.answerCbQuery('❌ حریفی نیست');
  
  const isBoss = u.pendingFight.type === 'boss';
  if (isBoss) setCooldown(u, 'boss');
  else setCooldown(u, 'fight');
  
  const result = executeCombat(u, u.pendingFight);
  u.pendingFight = null;
  saveDB(db);
  
  const img = isBoss ? IMAGES.dragon : IMAGES.fight;
  let text = result.text;
  text += `\n\n⏱️ مبارزه بعدی: ${formatTime(isBoss ? COOLDOWNS.boss : COOLDOWNS.fight)} دیگه`;
  
  ctx.replyWithPhoto(img, { caption: text, ...backMenu() });
});

// خانه
bot.action('home', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.replyWithPhoto(IMAGES.main, {
    caption: `🏠 خانه - لول ${u.homeLevel}\n\n${u.homeLevel < 5 ? `📋 ارتقا به لول ${u.homeLevel + 1}: نیاز به منابع` : '🏆 حداکثر سطح!'}`,
    ...backMenu()
  });
});

// درمانگاه
bot.action('clinic', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.replyWithPhoto(IMAGES.main, {
    caption: `🏥 درمانگاه\n\n❤️ HP: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp, 8)}\n💊 درمان رایگان: ${u.daily?.freeHealUsed ? '❌' : '✅'}\n\n/heal free - درمان رایگان (+30HP)\n/heal gold - درمان کامل (20 طلا)`,
    ...backMenu()
  });
});

// فروشگاه
bot.action('shop', (ctx) => {
  ctx.replyWithPhoto(IMAGES.shop, {
    caption: '🛒 فروشگاه بقا\n\nدسته‌بندی:',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📦 منابع', 'shop_cat_resource'), Markup.button.callback('🍽️ غذا', 'shop_cat_food')],
      [Markup.button.callback('🧰 آیتم‌ها', 'shop_cat_item'), Markup.button.callback('⚔️ سلاح', 'shop_cat_weapon')],
      [Markup.button.callback('💎 ویژه', 'shop_cat_special'), Markup.button.callback('💰 فروش', 'shop_sell_menu')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

// اسلحه‌خانه
bot.action('armory', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const buttons = [];
  
  for (const [k, w] of Object.entries(WEAPONS)) {
    if (k === 'none') continue;
    const owned = u.weaponsOwned[k];
    const equipped = u.weapon === k;
    buttons.push([Markup.button.callback(
      `${owned ? '✅' : '🔨'} ${w.name} ${equipped ? '⚔️' : ''}`,
      owned ? `armory_equip_${k}` : `armory_craft_${k}`
    )]);
  }
  
  buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  ctx.replyWithPhoto(IMAGES.main, {
    caption: `🛠️ اسلحه‌خانه\n\nسلاح فعلی: ${WEAPONS[u.weapon]?.name || 'ندارد'}\n\nبرای ساخت یا تجهیز انتخاب کن:`,
    ...Markup.inlineKeyboard(buttons)
  });
});

// ساخت سلاح
bot.action(/armory_craft_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const weapon = WEAPONS[key];
  
  if (!weapon) return ctx.answerCbQuery('❌ سلاح نامعتبر');
  if (u.resources.gold < weapon.price) return ctx.answerCbQuery(`❌ ${weapon.price} طلا لازم داری`);
  if (u.playerLevel < weapon.level) return ctx.answerCbQuery(`❌ لول ${weapon.level} لازمه`);
  
  addResource(u, 'gold', -weapon.price);
  u.weaponsOwned[key] = true;
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${weapon.name} ساخته شد!`);
  ctx.deleteMessage();
});

// تجهیز سلاح
bot.action(/armory_equip_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!u.weaponsOwned[key]) return ctx.answerCbQuery('❌ این سلاح رو نداری');
  
  u.weapon = key;
  saveDB(db);
  
  ctx.answerCbQuery(`⚔️ ${WEAPONS[key].name} تجهیز شد`);
});

// آرامگاه
bot.action('aramgah', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  const cd = checkCooldown(u, 'pray', COOLDOWNS.pray);
  if (!cd.canDo) {
    await ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه`);
    return;
  }
  
  await ctx.answerCbQuery();
  ctx.replyWithPhoto(IMAGES.aramgah, {
    caption: '🕯️ آرامگاه\n\nنور الهی اینجا جاریه...\nچی می‌خوای بخونی؟',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🤲 دعا (+60 XP)', 'pray_dua')],
      [Markup.button.callback('🧎 نماز (+60 XP)', 'pray_namaz')],
      [Markup.button.callback('📖 روضه (+60 XP)', 'pray_rozeh')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

// دعا/نماز/روضه
bot.action(['pray_dua', 'pray_namaz', 'pray_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  const cd = checkCooldown(u, 'pray', COOLDOWNS.pray);
  if (!cd.canDo) return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه`);
  
  setCooldown(u, 'pray');
  const xpGain = u.playerLevel <= 3 ? 60 : 30;
  const ups = addXP(u, xpGain);
  saveDB(db);
  
  const names = { pray_dua: 'دعا', pray_namaz: 'نماز', pray_rozeh: 'روضه' };
  const prayName = names[ctx.match[0]] || 'عبادت';
  
  await ctx.answerCbQuery(`✨ +${xpGain} XP`);
  ctx.reply(
    `✅ ${prayName}ت قبول باشه!\n✨ +${xpGain} XP\n🎚️ لول: ${u.playerLevel} | XP: ${u.playerXP}/30` +
    `${ups ? `\n🎉 ${ups} لول افزایش یافت!` : ''}` +
    `\n\n⏱️ آرامگاه بعدی: ${formatTime(COOLDOWNS.pray)} دیگه`,
    backMenu()
  );
});

// غذا
bot.action('eat_menu', (ctx) => {
  ctx.reply('🍽️ غذا و نوشیدنی:', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان', 'eat_bread'), Markup.button.callback('🍖 گوشت', 'eat_meat')],
    [Markup.button.callback('🐟 ماهی', 'eat_fish'), Markup.button.callback('🍲 سوپ', 'eat_soup')],
    [Markup.button.callback('💧 آب', 'drink_water'), Markup.button.callback('🧃 آبمیوه', 'drink_juice')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

// خوردن
bot.action(/eat_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if ((u.items[key] || 0) < 1) return ctx.answerCbQuery(`❌ نداری`);
  
  const food = FOOD_ITEMS[key] || HEAL_ITEMS[key];
  if (!food) return ctx.answerCbQuery('❌');
  
  addItem(u, key, -1);
  if (food.hunger) u.hunger = Math.min(u.maxHunger, u.hunger + food.hunger);
  if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${food.name} خورده شد`);
});

// نوشیدن
bot.action(/drink_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if ((u.items[key] || 0) < 1) return ctx.answerCbQuery(`❌ نداری`);
  
  const drink = FOOD_ITEMS[key];
  if (!drink) return ctx.answerCbQuery('❌');
  
  addItem(u, key, -1);
  if (drink.thirst) u.thirst = Math.min(u.maxThirst, u.thirst + drink.thirst);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${drink.name} نوشیده شد`);
});

// نمایش کول‌داون‌ها
bot.action('cooldowns', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(getCooldownsText(u), backMenu());
});

// راهنما
bot.action('guide', (ctx) => {
  ctx.reply(
    `📖 راهنمای بازی بقا\n\n` +
    `🪓 جستجو: هر ${formatTime(COOLDOWNS.gather)} یکبار\n` +
    `⚔️ مبارزه: هر ${formatTime(COOLDOWNS.fight)} یکبار\n` +
    `👹 باس: هر ${formatTime(COOLDOWNS.boss)} یکبار\n` +
    `🕯️ آرامگاه: هر ${formatTime(COOLDOWNS.pray)} یکبار\n\n` +
    `🍞 گرسنگی: غذا بخور\n` +
    `💧 تشنگی: آب بنوش\n` +
    `⭐ مهارت: با لول آپ امتیاز بگیر\n` +
    `🏠 خانه: ارتقا بده تا امکانات جدید باز بشه`,
    backMenu()
  );
});

// مهارت‌ها
bot.action('skills_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(
    `⭐ مهارت‌ها | امتیاز: ${u.skillPoints || 0}\n\n` +
    `⛏️ جمع‌آوری: ${u.skills.gathering}/10\n` +
    `🏹 شکار: ${u.skills.hunting}/10\n` +
    `🔨 صنعتگری: ${u.skills.crafting}/10\n` +
    `🏕️ بقا: ${u.skills.survival}/10\n\n` +
    `/skill gathering\n` +
    `/skill hunting\n` +
    `/skill crafting\n` +
    `/skill survival`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⛏️ جمع‌آوری', 'skill_gathering'), Markup.button.callback('🏹 شکار', 'skill_hunting')],
      [Markup.button.callback('🔨 صنعتگری', 'skill_crafting'), Markup.button.callback('🏕️ بقا', 'skill_survival')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  );
});

// ارتقای مهارت
bot.action(/skill_(.+)/, (ctx) => {
  const skill = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!u.skillPoints || u.skillPoints <= 0) return ctx.answerCbQuery('❌ امتیاز نداری');
  if ((u.skills[skill] || 0) >= 10) return ctx.answerCbQuery('❌ حداکثر');
  
  u.skills[skill] = (u.skills[skill] || 0) + 1;
  u.skillPoints--;
  saveDB(db);
  
  const names = { gathering: '⛏️ جمع‌آوری', hunting: '🏹 شکار', crafting: '🔨 صنعتگری', survival: '🏕️ بقا' };
  ctx.answerCbQuery(`✅ ${names[skill]} ${u.skills[skill]}/10`);
});

// کلن
bot.action('clan', (ctx) => {
  ctx.reply(
    '🏛️ کلن (قبیله)\n\n' +
    'ساخت کلن: /create_clan <اسم>\n' +
    'عضویت: /join_clan <اسم>\n' +
    'خروج: /leave_clan\n' +
    'اهدا: /donate <نوع> <مقدار>\n' +
    'لیست: /clans',
    backMenu()
  );
});

// برگشت به منوی اصلی
bot.action('back_main', (ctx) => {
  ctx.deleteMessage().catch(() => {});
  ctx.replyWithPhoto(IMAGES.main, {
    caption: '🏕️ منوی اصلی',
    ...mainMenu()
  });
});

// ==================== دستورات متنی ====================
bot.command('heal', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  
  if (args[1] === 'free') {
    if (u.daily?.freeHealUsed) return ctx.reply('❌ درمان رایگان امروز استفاده شده', backMenu());
    u.daily = u.daily || {};
    u.daily.freeHealUsed = true;
    u.hp = Math.min(u.maxHp, u.hp + 30);
    saveDB(db);
    return ctx.reply(`✅ +30 HP\n❤️ ${u.hp}/${u.maxHp}`, backMenu());
  }
  
  if (args[1] === 'gold') {
    if (u.resources.gold < 20) return ctx.reply('❌ 20 طلا نداری', backMenu());
    addResource(u, 'gold', -20);
    u.hp = u.maxHp;
    saveDB(db);
    return ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`, backMenu());
  }
  
  ctx.reply('/heal free یا /heal gold');
});

bot.command('skill', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const skill = args[1];
  
  const validSkills = ['gathering', 'hunting', 'crafting', 'survival'];
  if (!skill || !validSkills.includes(skill)) {
    return ctx.reply('❌ مهارت: gathering, hunting, crafting, survival');
  }
  
  if (!u.skillPoints || u.skillPoints <= 0) return ctx.reply('❌ امتیاز مهارت نداری');
  if ((u.skills[skill] || 0) >= 10) return ctx.reply('❌ حداکثر');
  
  u.skills[skill] = (u.skills[skill] || 0) + 1;
  u.skillPoints--;
  saveDB(db);
  
  ctx.reply(`✅ ${skill} ارتقا یافت! ${u.skills[skill]}/10`, backMenu());
});

// ==================== فروشگاه (ادامه) ====================
bot.action('shop_categories', (ctx) => {
  ctx.editMessageCaption('🛒 فروشگاه - دسته‌بندی:', {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📦 منابع', 'shop_cat_resource'), Markup.button.callback('🍽️ غذا', 'shop_cat_food')],
      [Markup.button.callback('🧰 آیتم‌ها', 'shop_cat_item'), Markup.button.callback('⚔️ سلاح', 'shop_cat_weapon')],
      [Markup.button.callback('💎 ویژه', 'shop_cat_special'), Markup.button.callback('💰 فروش', 'shop_sell_menu')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

const SHOP_BUY = {
  wood: { type: 'resource', key: 'wood', name: '🪵 چوب', price: 8 },
  stone: { type: 'resource', key: 'stone', name: '🪨 سنگ', price: 10 },
  metal: { type: 'resource', key: 'metal', name: '🔩 فلز', price: 18 },
  iron: { type: 'resource', key: 'iron', name: '⛓️ آهن', price: 25 },
  bread: { type: 'food', key: 'bread', name: '🍞 نان', price: 10 },
  meat: { type: 'food', key: 'meat', name: '🍖 گوشت', price: 25 },
  fish: { type: 'food', key: 'fish', name: '🐟 ماهی', price: 15 },
  water: { type: 'food', key: 'water', name: '💧 آب', price: 8 },
  juice: { type: 'food', key: 'juice', name: '🧃 آبمیوه', price: 20 },
  bandage: { type: 'item', key: 'bandage', name: '🩹 باند', price: 25 },
  medkit: { type: 'item', key: 'medkit', name: '💊 جعبه کمک', price: 80 },
  soup: { type: 'item', key: 'soup', name: '🍲 سوپ', price: 18 },
  herb: { type: 'item', key: 'herb', name: '🌿 گیاه', price: 35 },
  elixir: { type: 'item', key: 'elixir', name: '🧪 اکسیر', price: 200 },
  stick: { type: 'weapon', key: 'stick', name: '🪵 چوب دستی', price: 20 },
  knife: { type: 'weapon', key: 'knife', name: '🔪 چاقو', price: 80 },
  pistol: { type: 'weapon', key: 'pistol', name: '🔫 تپانچه', price: 220 },
  rifle: { type: 'weapon', key: 'rifle', name: '🔫 تفنگ', price: 500 },
  axe: { type: 'weapon', key: 'axe', name: '🪓 تبر', price: 350 },
  gem: { type: 'special', key: 'gem', name: '💎 سنگ قیمتی', price: 120 },
  map: { type: 'special', key: 'map', name: '🗺️ نقشه', price: 90 },
  fuel: { type: 'special', key: 'fuel', name: '⛽ سوخت', price: 75 }
};

bot.action(/shop_cat_(.+)/, (ctx) => {
  const category = ctx.match[1];
  const items = Object.entries(SHOP_BUY).filter(([k, v]) => {
    if (category === 'resource') return v.type === 'resource';
    if (category === 'item') return v.type === 'item';
    if (category === 'weapon') return v.type === 'weapon';
    if (category === 'special') return v.type === 'special';
    if (category === 'food') return v.type === 'food';
    return false;
  });
  
  const buttons = items.map(([k, v]) => [Markup.button.callback(`${v.name} - ${v.price} طلا`, `shop_buy_${k}_1`)]);
  buttons.push([Markup.button.callback('🔙 دسته‌بندی', 'shop_categories')]);
  
  ctx.editMessageCaption(`🛒 ${category}:`, Markup.inlineKeyboard(buttons));
});

bot.action(/shop_buy_(.+)_(.+)/, (ctx) => {
  const itemKey = ctx.match[1];
  const item = SHOP_BUY[itemKey];
  if (!item) return ctx.answerCbQuery('❌');
  
  ctx.editMessageCaption(`${item.name} - ${item.price} طلا\nتعداد:`, {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('۱ عدد', `shop_confirm_buy_${itemKey}_1`), Markup.button.callback('۵ عدد', `shop_confirm_buy_${itemKey}_5`)],
      [Markup.button.callback('۱۰ عدد', `shop_confirm_buy_${itemKey}_10`)],
      [Markup.button.callback('🔙 بازگشت', 'shop_categories')]
    ])
  });
});

bot.action(/shop_confirm_buy_(.+)_(.+)/, (ctx) => {
  const itemKey = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const item = SHOP_BUY[itemKey];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!item) return ctx.answerCbQuery('❌');
  const total = item.price * amount;
  if (u.resources.gold < total) return ctx.answerCbQuery(`❌ ${total} طلا لازم داری`);
  
  addResource(u, 'gold', -total);
  if (item.type === 'resource') addResource(u, item.key, amount);
  else addItem(u, item.key, amount);
  if (item.type === 'weapon') u.weaponsOwned[item.key] = true;
  bumpAction(u, 'buy', 1);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${amount} عدد ${item.name} خریدی!`);
  ctx.editMessageCaption(`✅ خرید موفق!\n📦 ${amount} عدد ${item.name}\n💰 طلا: ${u.resources.gold}`, backMenu());
});

bot.action('shop_sell_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const buttons = [];
  
  for (const k of RES_KEYS) {
    if (k !== 'gold' && u.resources[k] > 0) {
      buttons.push([Markup.button.callback(`${RES_EMOJI[k]} ${RES_LABELS[k]}: ${u.resources[k]}`, `shop_sell_${k}_1`)]);
    }
  }
  for (const [k, v] of Object.entries({...HEAL_ITEMS, ...FOOD_ITEMS, ...SPECIAL_ITEMS})) {
    if (u.items[k] > 0) buttons.push([Markup.button.callback(`${v.name}: ${u.items[k]}`, `shop_sell_${k}_1`)]);
  }
  
  buttons.push([Markup.button.callback('🔙 بازگشت', 'shop_categories')]);
  ctx.editMessageCaption('💰 فروش آیتم‌ها:', Markup.inlineKeyboard(buttons));
});

bot.action(/shop_sell_(.+)_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (RES_LABELS[key] && key !== 'gold') {
    if ((u.resources[key] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
    const price = Math.max(1, Math.floor((SHOP_BUY[key]?.price || 5) / 2));
    addResource(u, key, -1);
    addResource(u, 'gold', price);
  } else if (u.items[key] >= 1) {
    const base = HEAL_ITEMS[key]?.sell || FOOD_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || 10;
    addItem(u, key, -1);
    addResource(u, 'gold', base);
  } else {
    return ctx.answerCbQuery('❌ نداری');
  }
  
  bumpAction(u, 'sell', 1);
  saveDB(db);
  ctx.answerCbQuery('✅ فروخته شد');
  ctx.editMessageCaption(`✅ فروخته شد!\n💰 طلا: ${u.resources.gold}`, backMenu());
});

// ==================== ادمین ====================
bot.command('admin_give', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ فقط ادمین');
  
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  const type = args[2];
  const key = args[3];
  const amount = Number(args[4] || 0);
  
  if (!targetId || !type || !key || !amount) {
    return ctx.reply(
      '👑 /admin_give [آیدی] [نوع] [کلید] [مقدار]\n\n' +
      'انواع: resource, item, weapon, xp, hp, hunger, thirst\n' +
      'مثال: /admin_give 123456789 resource wood 100'
    );
  }
  
  const u = ensureUser(targetId, '');
  if (type === 'resource') addResource(u, key, amount);
  else if (type === 'item') addItem(u, key, amount);
  else if (type === 'weapon') u.weaponsOwned[key] = true;
  else if (type === 'xp') addXP(u, amount);
  else if (type === 'hp') u.hp = Math.min(u.maxHp, u.hp + amount);
  else if (type === 'hunger') u.hunger = Math.min(u.maxHunger, u.hunger + amount);
  else if (type === 'thirst') u.thirst = Math.min(u.maxThirst, u.thirst + amount);
  else return ctx.reply('❌ نوع نامعتبر');
  
  saveDB(db);
  ctx.reply('✅ انجام شد');
});

bot.command('admin_full', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ فقط ادمین');
  
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('/admin_full [آیدی]');
  
  const u = ensureUser(targetId, '');
  for (const k of RES_KEYS) u.resources[k] = 9999;
  for (const k of Object.keys({...HEAL_ITEMS, ...FOOD_ITEMS, ...SPECIAL_ITEMS})) u.items[k] = 99;
  for (const k of Object.keys(WEAPONS)) u.weaponsOwned[k] = true;
  u.weapon = 'bow';
  u.playerLevel = 20;
  u.hp = u.maxHp = 500;
  u.hunger = u.maxHunger = 200;
  u.thirst = u.maxThirst = 200;
  u.skillPoints = 40;
  u.homeLevel = 5;
  saveDB(db);
  ctx.reply('✅ کاربر مکس شد');
});

bot.command('admin_reset_cooldown', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ فقط ادمین');
  
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('/admin_reset_cooldown [آیدی]');
  
  const u = ensureUser(targetId, '');
  u.cooldowns = {};
  saveDB(db);
  ctx.reply('✅ کول‌داون‌ها ریست شد');
});

bot.command('admin_help', (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('⛔ فقط ادمین');
  
  ctx.reply(
    '👑 دستورات ادمین:\n\n' +
    '/admin_give [آیدی] [نوع] [کلید] [مقدار]\n' +
    '/admin_full [آیدی] - مکس کردن کاربر\n' +
    '/admin_reset_cooldown [آیدی] - ریست زمان‌ها\n\n' +
    'کلید منابع: wood, stone, metal, iron, gold, toman\n' +
    'کلید آیتم: bandage, medkit, soup, herb, elixir, bread, meat, fish, water, juice, gem, map, fuel, dragon_scale, phoenix_feather\n' +
    'کلید سلاح: stick, knife, pistol, axe, rifle, sword, bow'
  );
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log('✅ ربات بقا با محدودیت زمانی اجرا شد!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));