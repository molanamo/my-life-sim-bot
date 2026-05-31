'use strict';

const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');

/* =========================
   CONFIG
========================= */
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('ERROR: BOT_TOKEN is not set. Set env BOT_TOKEN or paste token in index.js');
}

const bot = new Telegraf(BOT_TOKEN);

const DATA_FILE = path.join(__dirname, 'data.json');
const SAVE_DEBOUNCE_MS = 800;

/* =========================
   DATA LAYER (JSON FILE)
========================= */
let DB = { users: {} };
let saveTimer = null;

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (!DB.users) DB.users = {};
    }
  } catch (e) {
    console.error('DB load error:', e);
    DB = { users: {} };
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf8');
    } catch (e) {
      console.error('DB save error:', e);
    }
  }, SAVE_DEBOUNCE_MS);
}

loadDB();

/* =========================
   GAME CONSTANTS
========================= */
// 12 resources
const RES = [
  'wood', 'stone', 'food', 'water',
  'iron', 'gold', 'cloth', 'leather',
  'herbs', 'coal', 'energy', 'faith'
];

const RES_FA = {
  wood: 'چوب', stone: 'سنگ', food: 'غذا', water: 'آب',
  iron: 'آهن', gold: 'طلا', cloth: 'پارچه', leather: 'چرم',
  herbs: 'گیاه دارویی', coal: 'زغال', energy: 'انرژی', faith: 'ایمان'
};

const HOUSE_MAX_LEVEL = 5;
const HOUSE_COST = {
  1: null, // base
  2: { wood: 30, stone: 20, food: 10, water: 10 },
  3: { wood: 60, stone: 45, iron: 15, cloth: 10, food: 20, water: 20 },
  4: { wood: 120, stone: 90, iron: 35, coal: 20, leather: 20, food: 35, water: 35 },
  5: { wood: 220, stone: 160, iron: 70, gold: 25, cloth: 30, leather: 30, food: 50, water: 50 }
};

const HOUSE_BONUS = {
  1: { maxHp: 100, stash: 200 },
  2: { maxHp: 120, stash: 300 },
  3: { maxHp: 140, stash: 450 },
  4: { maxHp: 165, stash: 650 },
  5: { maxHp: 190, stash: 900 }
};

// Items
const WEAPONS = {
  none: { name: 'بدون سلاح', atk: 0, price: null },
  knife: { name: 'چاقو', atk: 4, price: { iron: 6, leather: 2 } },
  spear: { name: 'نیزه', atk: 7, price: { wood: 10, iron: 8 } },
  sword: { name: 'شمشیر', atk: 12, price: { iron: 20, coal: 8, leather: 6 } },
  rifle: { name: 'تفنگ', atk: 20, price: { iron: 35, coal: 15, gold: 10 } }
};

const ARMORS = {
  none: { name: 'بدون زره', def: 0, price: null },
  cloth: { name: 'زره پارچه‌ای', def: 3, price: { cloth: 10, leather: 2 } },
  leather: { name: 'زره چرمی', def: 6, price: { leather: 14, cloth: 6 } },
  iron: { name: 'زره آهنی', def: 11, price: { iron: 28, coal: 10, leather: 8 } }
};

// Enemies
const ENEMIES = [
  { id: 'wolf', name: 'گرگ', hp: 35, atk: 7, def: 2, loot: { food: [4, 8], leather: [1, 3] } },
  { id: 'bandit', name: 'راهزن', hp: 55, atk: 10, def: 4, loot: { gold: [2, 6], iron: [1, 4], food: [2, 6] } },
  { id: 'bear', name: 'خرس', hp: 80, atk: 14, def: 6, loot: { food: [8, 14], leather: [3, 6], herbs: [0, 2] } }
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function now() {
  return Date.now();
}

/* =========================
   USER MODEL
========================= */
function defaultResources() {
  const r = {};
  for (const k of RES) r[k] = 0;
  // Starter pack
  r.wood = 25; r.stone = 20; r.food = 20; r.water = 20;
  r.iron = 6; r.cloth = 6; r.leather = 3; r.herbs = 2;
  r.energy = 30; r.faith = 0; r.gold = 0; r.coal = 0;
  return r;
}

function getUser(uid) {
  if (!DB.users[uid]) {
    DB.users[uid] = {
      id: uid,
      createdAt: now(),
      resources: defaultResources(),
      houseLevel: 1,
      hp: 100,
      injuredUntil: 0,
      spiritual: {
        prayers: 0,
        salat: 0,
        rezveh: 0
      },
      gear: {
        weapon: 'none',
        armor: 'none'
      },
      inventory: {
        weapons: { none: true },
        armors: { none: true }
      },
      cooldowns: {
        hunt: 0,
        gather: 0,
        expedition: 0,
        fight: 0,
        pray: 0,
        salat: 0,
        rezveh: 0
      },
      lastEnemy: null
    };
    scheduleSave();
  }
  return DB.users[uid];
}

function maxHp(u) {
  return HOUSE_BONUS[u.houseLevel]?.maxHp ?? 100;
}

function calcAtk(u) {
  const base = 8 + Math.floor(u.houseLevel * 1.5);
  const w = WEAPONS[u.gear.weapon]?.atk ?? 0;
  const faithBonus = Math.min(8, Math.floor(u.resources.faith / 10)); // soft bonus
  return base + w + faithBonus;
}

function calcDef(u) {
  const base = 3 + Math.floor(u.houseLevel * 1.2);
  const a = ARMORS[u.gear.armor]?.def ?? 0;
  const faithBonus = Math.min(6, Math.floor(u.resources.faith / 15));
  return base + a + faithBonus;
}

function isInHospital(u) {
  return u.injuredUntil && u.injuredUntil > now();
}

function canDo(u, key) {
  return (u.cooldowns[key] || 0) <= now();
}

function setCd(u, key, ms) {
  u.cooldowns[key] = now() + ms;
}

function fmtTimeLeft(ts) {
  const ms = Math.max(0, ts - now());
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}ث`;
  return `${m}د ${r}ث`;
}

function fmtResLine(resources) {
  const parts = [];
  for (const k of RES) {
    const v = resources[k] ?? 0;
    if (v !== 0) parts.push(`${RES_FA[k]}: ${v}`);
  }
  return parts.length ? parts.join(' | ') : 'هیچی';
}

function hasEnough(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if ((u.resources[k] ?? 0) < v) return false;
  }
  return true;
}

function payCost(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    u.resources[k] -= v;
  }
}

function addLoot(u, lootObj) {
  for (const [k, range] of Object.entries(lootObj)) {
    const [a, b] = range;
    const got = randInt(a, b);
    if (!u.resources[k]) u.resources[k] = 0;
    u.resources[k] += got;
  }
}

function spiritualTitle(u) {
  const score = u.spiritual.prayers * 1 + u.spiritual.salat * 2 + u.spiritual.rezveh * 3;
  if (score >= 120) return 'عارفِ بقا';
  if (score >= 70) return 'سالکِ شب';
  if (score >= 35) return 'دل‌آرام';
  if (score >= 15) return 'ره‌جو';
  return 'نوآموز';
}

/* =========================
   UI (INLINE MENUS)
========================= */
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🏹 شکار', 'm:hunt'), Markup.button.callback('⛏️ جمع‌آوری', 'm:gather')],
    [Markup.button.callback('🧭 اکسپدیشن', 'm:exp'), Markup.button.callback('⚔️ مبارزه', 'm:fight')],
    [Markup.button.callback('🏠 خانه', 'm:house'), Markup.button.callback('🎒 تجهیزات', 'm:gear')],
    [Markup.button.callback('✨ معنویت', 'm:spirit'), Markup.button.callback('🏥 بیمارستان', 'm:hospital')],
    [Markup.button.callback('📊 وضعیت', 'm:status')]
  ]);
}

function backMain() {
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 منوی اصلی', 'm:main')]]);
}

function gearMenu(u) {
  const wName = WEAPONS[u.gear.weapon]?.name || 'نامشخص';
  const aName = ARMORS[u.gear.armor]?.name || 'نامشخص';
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🔪 سلاح: ${wName}`, 'm:weapons')],
    [Markup.button.callback(`🛡️ زره: ${aName}`, 'm:armors')],
    [Markup.button.callback('🛠️ ساخت/خرید تجهیزات', 'm:craft')],
    [Markup.button.callback('🔙 منوی اصلی', 'm:main')]
  ]);
}

/* =========================
   SAFE EDIT/REPLY HELPERS
========================= */
async function safeEditOrReply(ctx, text, extra) {
  try {
    if (ctx.updateType === 'callback_query') {
      return await ctx.editMessageText(text, { parse_mode: 'HTML', ...extra });
    }
  } catch (e) { /* ignore */ }
  return ctx.reply(text, { parse_mode: 'HTML', ...extra });
}

function h(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/* =========================
   GAME ACTIONS
========================= */
async function ensureNotHospital(ctx, u) {
  if (isInHospital(u)) {
    await ctx.answerCbQuery(`مجروحی! ${fmtTimeLeft(u.injuredUntil)} تا ترخیص.`, { show_alert: true });
    return false;
  }
  return true;
}

async function doHunt(ctx, u) {
  if (!(await ensureNotHospital(ctx, u))) return;
  if (!canDo(u, 'hunt')) {
    return ctx.answerCbQuery(`کول‌داون شکار: ${fmtTimeLeft(u.cooldowns.hunt)}`, { show_alert: true });
  }
  if (u.resources.energy < 5) {
    return ctx.answerCbQuery('انرژی کافی نداری (حداقل 5).', { show_alert: true });
  }

  u.resources.energy -= 5;

  // Loot
  const gotFood = randInt(3, 10);
  const gotLeather = randInt(0, 3);
  const gotHerbs = randInt(0, 2);
  u.resources.food += gotFood;
  u.resources.leather += gotLeather;
  u.resources.herbs += gotHerbs;

  // small risk
  const risk = randInt(1, 100);
  let note = '';
  if (risk <= 12) {
    const dmg = randInt(6, 15);
    u.hp = Math.max(0, u.hp - dmg);
    note = `\n⚠️ حین شکار آسیب دیدی: -${dmg} HP`;
    if (u.hp <= 0) {
      u.hp = 1;
      u.injuredUntil = now() + 6 * 60 * 1000; // 6 min
      note += '\n🏥 بیهوش شدی و بستری شدی (6 دقیقه).';
    }
  }

  setCd(u, 'hunt', 45 * 1000);
  scheduleSave();

  await ctx.answerCbQuery('شکار انجام شد!');
  return safeEditOrReply(
    ctx,
    `🏹 <b>نتیجه شکار</b>\n+${gotFood} غذا | +${gotLeather} چرم | +${gotHerbs} گیاه\n-5 انرژی${note}\n\n(ATK:${calcAtk(u)} DEF:${calcDef(u)})`,
    { reply_markup: mainMenu().reply_markup }
  );
}

async function doGather(ctx, u) {
  if (!(await ensureNotHospital(ctx, u))) return;
  if (!canDo(u, 'gather')) {
    return ctx.answerCbQuery(`کول‌داون جمع‌آوری: ${fmtTimeLeft(u.cooldowns.gather)}`, { show_alert: true });
  }
  if (u.resources.energy < 4) {
    return ctx.answerCbQuery('انرژی کافی نداری (حداقل 4).', { show_alert: true });
  }

  u.resources.energy -= 4;

  const gotWood = randInt(4, 14);
  const gotStone = randInt(3, 12);
  const gotCoal = randInt(0, 4);

  u.resources.wood += gotWood;
  u.resources.stone += gotStone;
  u.resources.coal += gotCoal;

  setCd(u, 'gather', 40 * 1000);
  scheduleSave();

  await ctx.answerCbQuery('جمع‌آوری انجام شد!');
  return safeEditOrReply(
    ctx,
    `⛏️ <b>نتیجه جمع‌آوری</b>\n+${gotWood} چوب | +${gotStone} سنگ | +${gotCoal} زغال\n-4 انرژی`,
    { reply_markup: mainMenu().reply_markup }
  );
}

async function doExpedition(ctx, u) {
  if (!(await ensureNotHospital(ctx, u))) return;
  if (!canDo(u, 'expedition')) {
    return ctx.answerCbQuery(`کول‌داون اکسپدیشن: ${fmtTimeLeft(u.cooldowns.expedition)}`, { show_alert: true });
  }
  if (u.resources.energy < 10) {
    return ctx.answerCbQuery('انرژی کافی نداری (حداقل 10).', { show_alert: true });
  }

  u.resources.energy -= 10;

  // Big loot + chance of encounter
  const loot = {
    iron: [1, 6],
    gold: [0, 4],
    herbs: [0, 3],
    cloth: [0, 3],
    food: [2, 10],
    water: [2, 10]
  };
  addLoot(u, loot);

  const encounter = randInt(1, 100) <= 35;
  let note = '';
  if (encounter) {
    const dmg = randInt(8, 22);
    u.hp = Math.max(0, u.hp - dmg);
    note = `\n⚠️ در راه با تهدید مواجه شدی: -${dmg} HP`;
    if (u.hp <= 0) {
      u.hp = 1;
      u.injuredUntil = now() + 8 * 60 * 1000; // 8 min
      note += '\n🏥 افتادی و بستری شدی (8 دقیقه).';
    }
  }

  setCd(u, 'expedition', 90 * 1000);
  scheduleSave();

  await ctx.answerCbQuery('اکسپدیشن انجام شد!');
  return safeEditOrReply(
    ctx,
    `🧭 <b>اکسپدیشن</b>\nغنیمت گرفتی.\n${note}\n\n📦 منابع فعلی:\n${h(fmtResLine(u.resources))}`,
    { reply_markup: mainMenu().reply_markup }
  );
}

async function doFight(ctx, u) {
  if (!(await ensureNotHospital(ctx, u))) return;
  if (!canDo(u, 'fight')) {
    return ctx.answerCbQuery(`کول‌داون نبرد: ${fmtTimeLeft(u.cooldowns.fight)}`, { show_alert: true });
  }
  if (u.resources.energy < 8) {
    return ctx.answerCbQuery('انرژی کافی نداری (حداقل 8).', { show_alert: true });
  }

  u.resources.energy -= 8;

  const enemy = ENEMIES[randInt(0, ENEMIES.length - 1)];
  u.lastEnemy = enemy.id;

  // one-round combat simulation (fast)
  const atk = calcAtk(u);
  const def = calcDef(u);

  const myHit = Math.max(1, atk - enemy.def + randInt(-2, 3));
  const enHit = Math.max(1, enemy.atk - def + randInt(-2, 3));

  // decide outcome with weighted hp
  let myHp = u.hp;
  let enHp = enemy.hp;

  // simulate 3-6 turns
  const turns = randInt(3, 6);
  for (let i = 0; i < turns; i++) {
    enHp -= myHit;
    if (enHp <= 0) break;
    myHp -= enHit;
    if (myHp <= 0) break;
  }

  let result = '';
  if (enHp <= 0 && myHp > 0) {
    // win
    u.hp = myHp;
    addLoot(u, enemy.loot);

    // small faith gain
    u.resources.faith += randInt(0, 2);

    result = `✅ <b>پیروزی!</b>\nدشمن: ${h(enemy.name)}\nتو ضربه: ${myHit} | ضربه دشمن: ${enHit}\nHP باقی‌مانده: ${u.hp}\n\n🎁 غنیمت گرفتی.\n📦 منابع:\n${h(fmtResLine(u.resources))}`;
  } else {
    // lose => hospital
    u.hp = 1;
    const hospMin = randInt(6, 12);
    u.injuredUntil = now() + hospMin * 60 * 1000;

    // lose some resources
    const lostFood = Math.min(u.resources.food, randInt(2, 7));
    const lostGold = Math.min(u.resources.gold, randInt(0, 3));
    u.resources.food -= lostFood;
    u.resources.gold -= lostGold;

    result = `❌ <b>شکست خوردی!</b>\nدشمن: ${h(enemy.name)}\n🏥 بستری شدی: ${hospMin} دقیقه\nاز دست دادی: -${lostFood} غذا | -${lostGold} طلا`;
  }

  setCd(u, 'fight', 70 * 1000);
  scheduleSave();

  await ctx.answerCbQuery('نبرد انجام شد!');
  return safeEditOrReply(ctx, `⚔️ <b>گزارش نبرد</b>\n${result}`, { reply_markup: mainMenu().reply_markup });
}

/* =========================
   CRAFT / BUY
========================= */
function listCraftText(u) {
  const wLines = Object.entries(WEAPONS)
    .filter(([id]) => id !== 'none')
    .map(([id, it]) => {
      const owned = u.inventory.weapons[id] ? '✅' : '❌';
      const cost = it.price ? Object.entries(it.price).map(([k, v]) => `${RES_FA[k]}:${v}`).join(' ') : '-';
      return `${owned} <b>${h(it.name)}</b> (ATK +${it.atk}) — هزینه: ${h(cost)} — /buy_weapon ${id}`;
    });

  const aLines = Object.entries(ARMORS)
    .filter(([id]) => id !== 'none')
    .map(([id, it]) => {
      const owned = u.inventory.armors[id] ? '✅' : '❌';
      const cost = it.price ? Object.entries(it.price).map(([k, v]) => `${RES_FA[k]}:${v}`).join(' ') : '-';
      return `${owned} <b>${h(it.name)}</b> (DEF +${it.def}) — هزینه: ${h(cost)} — /buy_armor ${id}`;
    });

  return `🛠️ <b>ساخت/خرید تجهیزات</b>\n\n<b>سلاح‌ها:</b>\n${wLines.join('\n')}\n\n<b>زره‌ها:</b>\n${aLines.join('\n')}\n\nبرای تجهیز:\n/equip_weapon ID\n/equip_armor ID`;
}

/* =========================
   COMMANDS
========================= */
bot.start(async (ctx) => {
  const u = getUser(ctx.from.id);
  // heal to max on first start if above max
  u.hp = Math.min(u.hp, maxHp(u));
  scheduleSave();
  return safeEditOrReply(ctx, `سلام ${h(ctx.from.first_name)}!\nبه <b>بازی بقا</b> خوش آمدی.\n\nبا دکمه‌ها بازی کن:`, {
    reply_markup: mainMenu().reply_markup
  });
});

bot.command('menu', async (ctx) => {
  const u = getUser(ctx.from.id);
  return ctx.reply(`منوی اصلی:`, { reply_markup: mainMenu().reply_markup });
});

bot.command('status', async (ctx) => {
  const u = getUser(ctx.from.id);
  const title = spiritualTitle(u);
  const hosp = isInHospital(u) ? `🏥 بستری تا: ${fmtTimeLeft(u.injuredUntil)}` : '✅ سالم';
  return ctx.reply(
    `📊 <b>وضعیت</b>\n` +
    `HP: ${u.hp}/${maxHp(u)} | ${hosp}\n` +
    `خانه: سطح ${u.houseLevel}/${HOUSE_MAX_LEVEL}\n` +
    `ATK: ${calcAtk(u)} | DEF: ${calcDef(u)}\n` +
    `سلاح: ${h(WEAPONS[u.gear.weapon]?.name)} | زره: ${h(ARMORS[u.gear.armor]?.name)}\n` +
    `لقب معنوی: <b>${h(title)}</b>\n\n` +
    `📦 منابع:\n${h(fmtResLine(u.resources))}`,
    { parse_mode: 'HTML', reply_markup: mainMenu().reply_markup }
  );
});

bot.command('buy_weapon', async (ctx) => {
  const u = getUser(ctx.from.id);
  const id = (ctx.message.text.split(' ')[1] || '').trim();
  const it = WEAPONS[id];
  if (!it || id === 'none') return ctx.reply('ID سلاح نامعتبره.');
  if (u.inventory.weapons[id]) return ctx.reply('این سلاح رو داری.');
  if (!it.price) return ctx.reply('این آیتم قابل خرید نیست.');

  if (!hasEnough(u, it.price)) return ctx.reply('منابع کافی نداری.');
  payCost(u, it.price);
  u.inventory.weapons[id] = true;
  scheduleSave();
  return ctx.reply(`خرید انجام شد: ${it.name}`);
});

bot.command('buy_armor', async (ctx) => {
  const u = getUser(ctx.from.id);
  const id = (ctx.message.text.split(' ')[1] || '').trim();
  const it = ARMORS[id];
  if (!it || id === 'none') return ctx.reply('ID زره نامعتبره.');
  if (u.inventory.armors[id]) return ctx.reply('این زره رو داری.');
  if (!it.price) return ctx.reply('این آیتم قابل خرید نیست.');

  if (!hasEnough(u, it.price)) return ctx.reply('منابع کافی نداری.');
  payCost(u, it.price);
  u.inventory.armors[id] = true;
  scheduleSave();
  return ctx.reply(`خرید انجام شد: ${it.name}`);
});

bot.command('equip_weapon', async (ctx) => {
  const u = getUser(ctx.from.id);
  const id = (ctx.message.text.split(' ')[1] || '').trim();
  if (!WEAPONS[id]) return ctx.reply('ID سلاح نامعتبره.');
  if (!u.inventory.weapons[id]) return ctx.reply('اول باید این سلاح رو بخری.');
  u.gear.weapon = id;
  scheduleSave();
  return ctx.reply(`سلاح مجهز شد: ${WEAPONS[id].name}`);
});

bot.command('equip_armor', async (ctx) => {
  const u = getUser(ctx.from.id);
  const id = (ctx.message.text.split(' ')[1] || '').trim();
  if (!ARMORS[id]) return ctx.reply('ID زره نامعتبره.');
  if (!u.inventory.armors[id]) return ctx.reply('اول باید این زره رو بخری.');
  u.gear.armor = id;
  scheduleSave();
  return ctx.reply(`زره مجهز شد: ${ARMORS[id].name}`);
});

/* =========================
   ADMIN COMMANDS
   /give_res userId key amount
   /give_hp userId amount
   /give_item userId weapon|armor itemId
========================= */
bot.command('give_res', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const [, userIdRaw, key, amountRaw] = ctx.message.text.split(' ');
  const userId = Number(userIdRaw);
  const amount = Number(amountRaw);
  if (!userId || !key || !Number.isFinite(amount)) {
    return ctx.reply('فرمت: /give_res userId key amount');
  }
  if (!RES.includes(key)) return ctx.reply('کلید منبع نامعتبره.');
  const u = getUser(userId);
  u.resources[key] = (u.resources[key] || 0) + amount;
  scheduleSave();
  return ctx.reply(`OK. به ${userId} مقدار ${amount} از ${key} داده شد.`);
});

bot.command('give_hp', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const [, userIdRaw, amountRaw] = ctx.message.text.split(' ');
  const userId = Number(userIdRaw);
  const amount = Number(amountRaw);
  if (!userId || !Number.isFinite(amount)) return ctx.reply('فرمت: /give_hp userId amount');
  const u = getUser(userId);
  u.hp = Math.max(1, Math.min(maxHp(u), u.hp + amount));
  if (u.hp > 1) u.injuredUntil = 0;
  scheduleSave();
  return ctx.reply(`OK. HP کاربر ${userId} الان ${u.hp}/${maxHp(u)} است.`);
});

bot.command('give_item', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const [, userIdRaw, type, itemId] = ctx.message.text.split(' ');
  const userId = Number(userIdRaw);
  if (!userId || !type || !itemId) return ctx.reply('فرمت: /give_item userId weapon|armor itemId');

  const u = getUser(userId);
  if (type === 'weapon') {
    if (!WEAPONS[itemId]) return ctx.reply('weapon نامعتبر');
    u.inventory.weapons[itemId] = true;
  } else if (type === 'armor') {
    if (!ARMORS[itemId]) return ctx.reply('armor نامعتبر');
    u.inventory.armors[itemId] = true;
  } else {
    return ctx.reply('type باید weapon یا armor باشد.');
  }
  scheduleSave();
  return ctx.reply(`OK. آیتم داده شد.`);
});

/* =========================
   CALLBACK (INLINE BUTTONS)
========================= */
bot.on('callback_query', async (ctx) => {
  const u = getUser(ctx.from.id);
  const data = ctx.callbackQuery.data;

  try {
    if (data === 'm:main') {
      await ctx.answerCbQuery();
      return safeEditOrReply(ctx, 'منوی اصلی:', { reply_markup: mainMenu().reply_markup });
    }

    if (data === 'm:status') {
      await ctx.answerCbQuery();
      const title = spiritualTitle(u);
      const hosp = isInHospital(u) ? `🏥 بستری تا: ${fmtTimeLeft(u.injuredUntil)}` : '✅ سالم';
      return safeEditOrReply(
        ctx,
        `📊 <b>وضعیت</b>\n` +
        `HP: ${u.hp}/${maxHp(u)} | ${hosp}\n` +
        `خانه: سطح ${u.houseLevel}/${HOUSE_MAX_LEVEL}\n` +
        `ATK: ${calcAtk(u)} | DEF: ${calcDef(u)}\n` +
        `سلاح: ${h(WEAPONS[u.gear.weapon]?.name)} | زره: ${h(ARMORS[u.gear.armor]?.name)}\n` +
        `لقب معنوی: <b>${h(title)}</b>\n\n` +
        `📦 منابع:\n${h(fmtResLine(u.resources))}`,
        { reply_markup: backMain().reply_markup }
      );
    }

    if (data === 'm:hunt') return doHunt(ctx, u);
    if (data === 'm:gather') return doGather(ctx, u);
    if (data === 'm:exp') return doExpedition(ctx, u);
    if (data === 'm:fight') return doFight(ctx, u);

    if (data === 'm:hospital') {
      await ctx.answerCbQuery();
      if (isInHospital(u)) {
        return safeEditOrReply(ctx, `🏥 <b>بیمارستان</b>\nتو بستری هستی.\nزمان باقی‌مانده: ${fmtTimeLeft(u.injuredUntil)}\n\n(در این مدت نمی‌تونی فعالیت کنی)`, {
          reply_markup: backMain().reply_markup
        });
      }
      // allow heal with herbs
      return safeEditOrReply(ctx,
        `🏥 <b>بیمارستان</b>\nتو سالمی.\n\nدرمان سریع (مصرف گیاه دارویی):\n- 3 گیاه => +30 HP\n- 6 گیاه => فول HP`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🌿 درمان +30 (3 گیاه)', 'h:heal30'), Markup.button.callback('🌿 فول درمان (6 گیاه)', 'h:full')],
            [Markup.button.callback('🔙 منوی اصلی', 'm:main')]
          ]).reply_markup
        }
      );
    }

    if (data === 'h:heal30') {
      if (!canDo(u, 'heal')) {} // no cd needed
      if (u.resources.herbs < 3) return ctx.answerCbQuery('گیاه کافی نداری.', { show_alert: true });
      if (isInHospital(u)) return ctx.answerCbQuery('بستری هستی، صبر کن.', { show_alert: true });
      u.resources.herbs -= 3;
      u.hp = Math.min(maxHp(u), u.hp + 30);
      scheduleSave();
      await ctx.answerCbQuery('درمان شد!');
      return safeEditOrReply(ctx, `✅ درمان انجام شد.\nHP: ${u.hp}/${maxHp(u)}\nگیاه باقی‌مانده: ${u.resources.herbs}`, { reply_markup: backMain().reply_markup });
    }

    if (data === 'h:full') {
      if (u.resources.herbs < 6) return ctx.answerCbQuery('گیاه کافی نداری.', { show_alert: true });
      if (isInHospital(u)) return ctx.answerCbQuery('بستری هستی، صبر کن.', { show_alert: true });
      u.resources.herbs -= 6;
      u.hp = maxHp(u);
      scheduleSave();
      await ctx.answerCbQuery('فول درمان!');
      return safeEditOrReply(ctx, `✅ فول درمان انجام شد.\nHP: ${u.hp}/${maxHp(u)}\nگیاه باقی‌مانده: ${u.resources.herbs}`, { reply_markup: backMain().reply_markup });
    }

    if (data === 'm:house') {
      await ctx.answerCbQuery();
      const next = u.houseLevel + 1;
      if (u.houseLevel >= HOUSE_MAX_LEVEL) {
        return safeEditOrReply(ctx, `🏠 <b>خانه</b>\nسطح فعلی: ${u.houseLevel}\n✅ به حداکثر سطح رسیدی.`, { reply_markup: backMain().reply_markup });
      }
      const cost = HOUSE_COST[next];
      const costStr = Object.entries(cost).map(([k, v]) => `${RES_FA[k]}:${v}`).join(' | ');
      return safeEditOrReply(ctx,
        `🏠 <b>خانه</b>\nسطح فعلی: ${u.houseLevel}\nارتقا به سطح ${next}\nهزینه: ${h(costStr)}\n\nمزیت سطح بعد:\nMaxHP: ${HOUSE_BONUS[next].maxHp} | انبار: ${HOUSE_BONUS[next].stash}`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬆️ ارتقا بده', 'h:upgrade')],
            [Markup.button.callback('🔙 منوی اصلی', 'm:main')]
          ]).reply_markup
        }
      );
    }

    if (data === 'h:upgrade') {
      if (!hasEnough(u, HOUSE_COST[u.houseLevel + 1] || {})) {
        return ctx.answerCbQuery('منابع کافی نیست.', { show_alert: true });
      }
      if (u.houseLevel >= HOUSE_MAX_LEVEL) return ctx.answerCbQuery('حداکثر سطح!', { show_alert: true });

      payCost(u, HOUSE_COST[u.houseLevel + 1]);
      u.houseLevel += 1;
      u.hp = Math.min(u.hp + 10, maxHp(u)); // small heal on upgrade
      scheduleSave();
      await ctx.answerCbQuery('ارتقا انجام شد!');
      return safeEditOrReply(ctx, `✅ خانه ارتقا یافت.\nسطح جدید: ${u.houseLevel}\nHP: ${u.hp}/${maxHp(u)}`, { reply_markup: backMain().reply_markup });
    }

    if (data === 'm:gear') {
      await ctx.answerCbQuery();
      return safeEditOrReply(ctx, `🎒 <b>تجهیزات</b>`, { reply_markup: gearMenu(u).reply_markup });
    }

    if (data === 'm:craft') {
      await ctx.answerCbQuery();
      return safeEditOrReply(ctx, listCraftText(u), { reply_markup: backMain().reply_markup });
    }

    if (data === 'm:weapons') {
      await ctx.answerCbQuery();
      const lines = Object.entries(WEAPONS).map(([id, it]) => {
        const owned = u.inventory.weapons[id] ? '✅' : '❌';
        const eq = (u.gear.weapon === id) ? ' (مجهز)' : '';
        return `${owned} <b>${h(it.name)}</b>${eq} — ID: <code>${h(id)}</code> — ATK +${it.atk}`;
      }).join('\n');
      return safeEditOrReply(ctx, `🔪 <b>سلاح‌ها</b>\n${lines}\n\nبرای تجهیز: /equip_weapon ID`, { reply_markup: backMain().reply_markup });
    }

    if (data === 'm:armors') {
      await ctx.answerCbQuery();
      const lines = Object.entries(ARMORS).map(([id, it]) => {
        const owned = u.inventory.armors[id] ? '✅' : '❌';
        const eq = (u.gear.armor === id) ? ' (مجهز)' : '';
        return `${owned} <b>${h(it.name)}</b>${eq} — ID: <code>${h(id)}</code> — DEF +${it.def}`;
      }).join('\n');
      return safeEditOrReply(ctx, `🛡️ <b>زره‌ها</b>\n${lines}\n\nبرای تجهیز: /equip_armor ID`, { reply_markup: backMain().reply_markup });
    }

    if (data === 'm:spirit') {
      await ctx.answerCbQuery();
      const title = spiritualTitle(u);
      return safeEditOrReply(ctx,
        `✨ <b>بخش معنوی</b>\n` +
        `دعا: ${u.spiritual.prayers} | نماز: ${u.spiritual.salat} | رضوه: ${u.spiritual.rezveh}\n` +
        `ایمان: ${u.resources.faith}\n` +
        `لقب: <b>${h(title)}</b>\n\n` +
        `اثر ایمان: افزایش جزئی ATK/DEF`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🤲 دعا (+ایمان)', 's:pray'), Markup.button.callback('🕌 نماز (+ایمان بیشتر)', 's:salat')],
            [Markup.button.callback('🌙 رضوه (+ایمان زیاد)', 's:rezveh')],
            [Markup.button.callback('🔙 منوی اصلی', 'm:main')]
          ]).reply_markup
        }
      );
    }

    if (data === 's:pray') {
      if (!canDo(u, 'pray')) return ctx.answerCbQuery(`کول‌داون: ${fmtTimeLeft(u.cooldowns.pray)}`, { show_alert: true });
      u.spiritual.prayers += 1;
      u.resources.faith += randInt(1, 2);
      setCd(u, 'pray', 35 * 1000);
      scheduleSave();
      await ctx.answerCbQuery('دعا انجام شد.');
      return;
    }

    if (data === 's:salat') {
      if (!canDo(u, 'salat')) return ctx.answerCbQuery(`کول‌داون: ${fmtTimeLeft(u.cooldowns.salat)}`, { show_alert: true });
      u.spiritual.salat += 1;
      u.resources.faith += randInt(2, 4);
      setCd(u, 'salat', 70 * 1000);
      scheduleSave();
      await ctx.answerCbQuery('نماز انجام شد.');
      return;
    }

    if (data === 's:rezveh') {
      if (!canDo(u, 'rezveh')) return ctx.answerCbQuery(`کول‌داون: ${fmtTimeLeft(u.cooldowns.rezveh)}`, { show_alert: true });
      u.spiritual.rezveh += 1;
      u.resources.faith += randInt(4, 7);
      setCd(u, 'rezveh', 120 * 1000);
      scheduleSave();
      await ctx.answerCbQuery('رضوه انجام شد.');
      return;
    }

    await ctx.answerCbQuery();
  } catch (e) {
    console.error('callback error:', e);
    try { await ctx.answerCbQuery('خطا!', { show_alert: true }); } catch {}
  }
});

/* =========================
   TEXT FALLBACK
========================= */
bot.on('text', async (ctx) => {
  const t = (ctx.message.text || '').trim().toLowerCase();
  if (t === 'منو' || t === 'menu') {
    return ctx.reply('منوی اصلی:', { reply_markup: mainMenu().reply_markup });
  }
  if (t === 'وضعیت' || t === 'status') {
    return ctx.telegram.sendMessage(ctx.chat.id, 'بزن /status');
  }
  return ctx.reply('برای بازی از دکمه‌ها استفاده کن: /menu');
});

/* =========================
   ERROR HANDLING + START
========================= */
bot.catch((err) => console.error('BOT ERROR:', err));

bot.launch().then(() => console.log('Survival Bot started.'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
