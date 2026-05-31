'use strict';

const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('BOT_TOKEN missing');

const ADMIN_ID = Number(process.env.ADMIN_ID || '5576592239');

const bot = new Telegraf(BOT_TOKEN);
const DB_FILE = path.join(__dirname, 'data.json');

/* =========================
   DB + Helpers
========================= */
let DB = { users: {} };

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) DB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    DB = { users: {} };
  }
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2), 'utf8');
}
function now() { return Date.now(); }

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function ensureUser(id) {
  id = String(id);
  if (!DB.users[id]) {
    DB.users[id] = {
      id,
      money: 200,
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,

      // survival stats
      hunger: 100,  // 0..100
      thirst: 100,  // 0..100

      // progression
      homeLevel: 1,
      spirit: 0, // سیستم معنوی: امتیاز
      missionsDone: {}, // {missionId: true}

      inventory: {}, // {itemKey: qty}
      resources: { wood: 0, stone: 0, iron: 0, food: 0, water: 0, herb: 0 },

      // hospital
      healFreeReadyAt: 0,     // timestamp
      healInProgressUntil: 0, // timestamp

      // misc
      createdAt: now(),
      lastSeenAt: now(),
    };
    saveDB();
  }
  DB.users[id].lastSeenAt = now();
  return DB.users[id];
}

function addItem(u, key, qty=1) {
  u.inventory[key] = (u.inventory[key] || 0) + qty;
  if (u.inventory[key] <= 0) delete u.inventory[key];
}
function addRes(u, key, qty=1) {
  u.resources[key] = (u.resources[key] || 0) + qty;
  if (u.resources[key] < 0) u.resources[key] = 0;
}
function hasRes(u, key, qty) { return (u.resources[key] || 0) >= qty; }
function hasMoney(u, amt) { return u.money >= amt; }

function giveXP(u, amt) {
  u.xp += amt;
  while (u.xp >= xpNeed(u.level)) {
    u.xp -= xpNeed(u.level);
    u.level += 1;
    u.maxHp += 5;
    u.hp = u.maxHp;
  }
}
function xpNeed(level) { return 80 + level * 25; }

/* =========================
   Missions (100)
   - طراحی: هر ماموریت شرط + پاداش + نوع
========================= */
function buildMissions() {
  const ms = [];
  // 1..40 جمع‌آوری منابع
  for (let i=1;i<=40;i++) {
    const qty = 5 + i;
    const resKey = i%3===0 ? 'iron' : (i%2===0 ? 'stone' : 'wood');
    ms.push({
      id: i,
      title: `جمع‌آوری ${resKey} (${qty})`,
      desc: `با /gather یا نبرد، ${qty} واحد ${resKey} جمع کن.`,
      type: 'collect_res',
      req: { resKey, qty },
      reward: { money: 30 + i*8, xp: 20 + i*2, spirit: i%5===0 ? 2 : 0 }
    });
  }
  // 41..70 نبرد
  for (let i=41;i<=70;i++) {
    const wins = 1 + Math.floor((i-41)/3);
    ms.push({
      id: i,
      title: `پیروزی در نبرد (${wins})`,
      desc: `با /fight حداقل ${wins} برد ثبت کن.`,
      type: 'win_fights',
      req: { wins },
      reward: { money: 80 + i*5, xp: 50 + i, spirit: 1 }
    });
  }
  // 71..85 ارتقای خانه
  for (let i=71;i<=85;i++) {
    const needHome = 1 + (i-71) + 1; // 2..16
    ms.push({
      id: i,
      title: `ارتقای خانه به سطح ${needHome}`,
      desc: `خانه‌ات را با /home تا سطح ${needHome} ارتقا بده.`,
      type: 'home_level',
      req: { level: needHome },
      reward: { money: 300 + i*10, xp: 150, spirit: 3 }
    });
  }
  // 86..100 معنوی/بیمارستان/بقا
  for (let i=86;i<=100;i++) {
    const spiritNeed = (i-85)*3; // 3..45
    ms.push({
      id: i,
      title: `رشد معنوی (${spiritNeed})`,
      desc: `امتیاز معنوی را به ${spiritNeed} برسان. (ماموریت‌ها/کمک‌ها/بقا)`,
      type: 'spirit',
      req: { spirit: spiritNeed },
      reward: { money: 500 + i*20, xp: 300, spirit: 5 }
    });
  }
  return ms;
}
const MISSIONS = buildMissions();
function getNextMission(u) {
  for (const m of MISSIONS) {
    if (!u.missionsDone[String(m.id)]) return m;
  }
  return null;
}
function missionProgressText(u, m) {
  if (!m) return '✅ همه ماموریت‌ها تمام شد.';
  if (m.type === 'collect_res') {
    const have = u.resources[m.req.resKey] || 0;
    return `${have}/${m.req.qty} ${m.req.resKey}`;
  }
  if (m.type === 'win_fights') {
    const wins = u._fightWins || 0;
    return `${wins}/${m.req.wins} برد`;
  }
  if (m.type === 'home_level') return `${u.homeLevel}/${m.req.level}`;
  if (m.type === 'spirit') return `${u.spirit}/${m.req.spirit}`;
  return '—';
}
function canClaimMission(u, m) {
  if (!m) return false;
  if (m.type === 'collect_res') return (u.resources[m.req.resKey] || 0) >= m.req.qty;
  if (m.type === 'win_fights') return (u._fightWins || 0) >= m.req.wins;
  if (m.type === 'home_level') return u.homeLevel >= m.req.level;
  if (m.type === 'spirit') return u.spirit >= m.req.spirit;
  return false;
}
function claimMission(u, m) {
  // کسر شرط برای جمع‌آوری
  if (m.type === 'collect_res') addRes(u, m.req.resKey, -m.req.qty);

  // بردهای نبرد: فقط ریست نمی‌کنیم، چون ممکنه ماموریت‌های بعدی هم بخواد.
  // اما برای سخت‌تر شدن می‌تونی کم کنی.
  u.money += m.reward.money || 0;
  giveXP(u, m.reward.xp || 0);
  u.spirit += m.reward.spirit || 0;

  u.missionsDone[String(m.id)] = true;
}

/* =========================
   Shop
========================= */
const SHOP = [
  { key:'bandage', name:'بانداژ', price:60, desc:'HP +25', use:'heal', value:25 },
  { key:'medkit',  name:'کیت کمک‌های اولیه', price:160, desc:'HP +60', use:'heal', value:60 },
  { key:'water_bottle', name:'بطری آب', price:40, desc:'تشنگی +30', use:'thirst', value:30 },
  { key:'ration', name:'جیره غذایی', price:50, desc:'گرسنگی +30', use:'hunger', value:30 },
  { key:'knife', name:'چاقو', price:220, desc:'قدرت نبرد +', use:'gear', value:1 },
  { key:'amulet', name:'تعویذ', price:300, desc:'معنویت +5', use:'spirit', value:5 },
];

function shopText() {
  return '🛒 فروشگاه:\n' + SHOP.map(s => `- ${s.name} (${s.key}) — ${s.price} سکه\n  ${s.desc}`).join('\n');
}

/* =========================
   UI
========================= */
function mainMenu(isAdmin=false) {
  const rows = [
    [Markup.button.callback('📊 وضعیت', 'me'), Markup.button.callback('💰 پول', 'wallet')],
    [Markup.button.callback('🧰 اینونتوری', 'inv'), Markup.button.callback('🛒 فروشگاه', 'shop')],
    [Markup.button.callback('📜 ماموریت', 'mission'), Markup.button.callback('🏠 خانه', 'home')],
    [Markup.button.callback('🏥 بیمارستان', 'hospital'), Markup.button.callback('⚔️ نبرد', 'fight')],
  ];
  if (isAdmin) rows.push([Markup.button.callback('👑 پنل ادمین', 'admin')]);
  return Markup.inlineKeyboard(rows);
}

function userStatus(u) {
  return [
    `🧍‍♂️ سطح: ${u.level}  | XP: ${u.xp}/${xpNeed(u.level)}`,
    `❤️ HP: ${u.hp}/${u.maxHp}`,
    `🍗 گرسنگی: ${u.hunger}/100   💧 تشنگی: ${u.thirst}/100`,
    `💰 پول: ${u.money}`,
    `🏠 خانه: سطح ${u.homeLevel}`,
    `✨ معنویت: ${u.spirit}`,
    `🪵 چوب: ${u.resources.wood}  🪨 سنگ: ${u.resources.stone}  ⛓️ آهن: ${u.resources.iron}`,
    `🍖 غذا: ${u.resources.food}  💧 آب: ${u.resources.water}  🌿 گیاه: ${u.resources.herb}`,
  ].join('\n');
}

function invText(u) {
  const entries = Object.entries(u.inventory);
  if (!entries.length) return '🧰 اینونتوری خالیه.';
  return '🧰 اینونتوری:\n' + entries.map(([k,v]) => `- ${k}: ${v}`).join('\n');
}

/* =========================
   Survival tick (کاهش نیازها)
========================= */
function tickNeeds(u) {
  // هر تعامل کمی نیازها کم میشه
  u.hunger = clamp(u.hunger - rnd(0,2), 0, 100);
  u.thirst = clamp(u.thirst - rnd(0,3), 0, 100);
  // اگر خیلی پایین بشه HP کم میشه
  if (u.hunger <= 10 || u.thirst <= 10) u.hp = clamp(u.hp - rnd(0,2), 0, u.maxHp);
}

/* =========================
   Commands
========================= */
bot.start((ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u); saveDB();
  ctx.reply('بازی بقا آماده‌ست.', mainMenu(ctx.from.id === ADMIN_ID));
});

bot.command('me', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u); saveDB();
  ctx.reply(userStatus(u), mainMenu(ctx.from.id === ADMIN_ID));
});

bot.command('shop', (ctx) => {
  ensureUser(ctx.from.id);
  ctx.reply(shopText() + '\n\nخرید: /buy <key>\nاستفاده: /use <key>', mainMenu(ctx.from.id === ADMIN_ID));
});

bot.command('buy', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const key = (ctx.message.text.split(' ').slice(1).join(' ') || '').trim();
  const it = SHOP.find(x => x.key === key);
  if (!it) return ctx.reply('کالا پیدا نشد. /shop');

  if (!hasMoney(u, it.price)) return ctx.reply('پول کافی نداری.');
  u.money -= it.price;
  addItem(u, key, 1);
  saveDB();
  ctx.reply(`✅ خرید شد: ${it.name}`);
});

bot.command('use', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const key = (ctx.message.text.split(' ').slice(1).join(' ') || '').trim();
  if (!u.inventory[key]) return ctx.reply('این آیتم رو نداری.');

  const it = SHOP.find(x => x.key === key);
  if (!it) return ctx.reply('این آیتم قابل استفاده نیست.');

  addItem(u, key, -1);

  if (it.use === 'heal') u.hp = clamp(u.hp + it.value, 0, u.maxHp);
  if (it.use === 'hunger') u.hunger = clamp(u.hunger + it.value, 0, 100);
  if (it.use === 'thirst') u.thirst = clamp(u.thirst + it.value, 0, 100);
  if (it.use === 'spirit') u.spirit += it.value;

  saveDB();
  ctx.reply('✅ استفاده شد.\n' + userStatus(u));
});

bot.command('inv', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u); saveDB();
  ctx.reply(invText(u), mainMenu(ctx.from.id === ADMIN_ID));
});

bot.command('gather', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  // جمع‌آوری وابسته به سطح خانه
  const mult = 1 + Math.floor((u.homeLevel-1)/3);
  addRes(u, 'wood', rnd(1,3) * mult);
  addRes(u, 'stone', rnd(0,2) * mult);
  addRes(u, 'iron', rnd(0,1) * mult);
  addRes(u, 'food', rnd(0,2));
  addRes(u, 'water', rnd(0,2));
  addRes(u, 'herb', rnd(0,1));
  giveXP(u, 10);

  saveDB();
  ctx.reply('⛏️ جمع‌آوری انجام شد.\n' + userStatus(u));
});

bot.command('home', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u); saveDB();

  const next = u.homeLevel + 1;
  const cost = {
    wood: 10 * next,
    stone: 8 * next,
    iron: 3 * next,
    money: 50 * next
  };

  ctx.reply(
    `🏠 خانه: سطح ${u.homeLevel}\nارتقای بعدی: سطح ${next}\nهزینه:\n- چوب: ${cost.wood}\n- سنگ: ${cost.stone}\n- آهن: ${cost.iron}\n- پول: ${cost.money}\n\nارتقا: /upgrade_home`,
    mainMenu(ctx.from.id === ADMIN_ID)
  );
});

bot.command('upgrade_home', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const next = u.homeLevel + 1;
  const wood = 10 * next, stone = 8 * next, iron = 3 * next, money = 50 * next;

  if (!hasRes(u,'wood',wood) || !hasRes(u,'stone',stone) || !hasRes(u,'iron',iron) || u.money < money) {
    return ctx.reply('منابع/پول کافی نیست. /home');
  }

  addRes(u,'wood',-wood); addRes(u,'stone',-stone); addRes(u,'iron',-iron);
  u.money -= money;

  u.homeLevel = next;
  u.maxHp += 10;
  u.hp = u.maxHp;
  u.spirit += 1;
  giveXP(u, 40);

  saveDB();
  ctx.reply(`✅ خانه ارتقا یافت به سطح ${u.homeLevel}\nHP بیشتر شد.`, mainMenu(ctx.from.id === ADMIN_ID));
});

bot.command('hospital', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const t = now();
  const freeReady = t >= u.healFreeReadyAt;
  const inProg = t < u.healInProgressUntil;

  const freeText = freeReady ? '✅ آماده' : `⏳ تا ${Math.ceil((u.healFreeReadyAt - t)/60000)} دقیقه دیگر`;
  const progText = inProg ? `⏳ درمان در جریان (${Math.ceil((u.healInProgressUntil - t)/60000)} دقیقه)` : '—';

  saveDB();
  ctx.reply(
    `🏥 بیمارستان\nHP: ${u.hp}/${u.maxHp}\n\nدرمان فوری (پولی): /heal_now\nدرمان رایگان (زمان‌دار): /heal_free\n\nوضعیت رایگان: ${freeText}\nوضعیت درمان: ${progText}`,
    mainMenu(ctx.from.id === ADMIN_ID)
  );
});

bot.command('heal_now', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const price = 120;
  if (u.hp >= u.maxHp) return ctx.reply('HP کامل است.');
  if (u.money < price) return ctx.reply('پول کافی نداری.');

  u.money -= price;
  u.hp = u.maxHp;
  u.spirit += 1;
  saveDB();
  ctx.reply('✅ درمان فوری انجام شد.', mainMenu(ctx.from.id === ADMIN_ID));
});

bot.command('heal_free', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const t = now();
  if (t < u.healFreeReadyAt) return ctx.reply('هنوز نوبت رایگان آماده نیست. /hospital');

  // درمان رایگان: 10 دقیقه بعد کامل میشه
  u.healInProgressUntil = t + 10 * 60 * 1000;
  u.healFreeReadyAt = t + 60 * 60 * 1000; // هر 1 ساعت یکبار
  saveDB();
  ctx.reply('⏳ درمان رایگان شروع شد. 10 دقیقه بعد کامل می‌شود.');
});

bot.command('fight', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  if (u.hp <= 0) return ctx.reply('تو بیهوشی! /hospital');

  // قدرت بر اساس سطح + چاقو
  const gear = u.inventory.knife ? 5 : 0;
  const power = u.level * 3 + gear + rnd(0,6);

  const enemy = {
    hp: 30 + u.level * 5 + rnd(0,20),
    power: 5 + u.level * 2 + rnd(0,5),
    name: ['گرگ','دزد','زامبی','خرس','سگ وحشی'][rnd(0,4)]
  };

  // شبیه‌سازی ساده
  let myHp = u.hp;
  let enHp = enemy.hp;

  while (myHp > 0 && enHp > 0) {
    enHp -= rnd(6, 12) + Math.floor(power/6);
    if (enHp <= 0) break;
    myHp -= rnd(3, 8) + Math.floor(enemy.power/5);
  }

  const win = myHp > 0;
  u.hp = clamp(myHp, 0, u.maxHp);

  if (win) {
    u._fightWins = (u._fightWins || 0) + 1;
    const money = rnd(40, 90) + u.level * 5;
    u.money += money;
    addRes(u,'wood', rnd(0,2));
    addRes(u,'iron', rnd(0,1));
    giveXP(u, 35);
    if (rnd(1,10) === 1) u.spirit += 1; // شانس
    saveDB();
    ctx.reply(`⚔️ دشمن: ${enemy.name}\n✅ بردی! +${money} سکه\nHP الان: ${u.hp}/${u.maxHp}`, mainMenu(ctx.from.id === ADMIN_ID));
  } else {
    saveDB();
    ctx.reply(`⚔️ دشمن: ${enemy.name}\n❌ باختی! HP الان: ${u.hp}/${u.maxHp}\nبرو بیمارستان: /hospital`, mainMenu(ctx.from.id === ADMIN_ID));
  }
});

bot.command('mission', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const m = getNextMission(u);
  if (!m) { saveDB(); return ctx.reply('✅ همه ماموریت‌ها رو تموم کردی!', mainMenu(ctx.from.id === ADMIN_ID)); }

  const prog = missionProgressText(u, m);
  const can = canClaimMission(u, m);

  saveDB();
  ctx.reply(
    `📜 ماموریت ${m.id}/100\n${m.title}\n${m.desc}\n\nپیشرفت: ${prog}\nپاداش: 💰${m.reward.money} | XP ${m.reward.xp} | ✨${m.reward.spirit || 0}\n\n${can ? '✅ آماده دریافت پاداش: /claim' : '⏳ هنوز کامل نشده'}`,
    mainMenu(ctx.from.id === ADMIN_ID)
  );
});

bot.command('claim', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  const m = getNextMission(u);
  if (!m) return ctx.reply('ماموریتی باقی نمانده.');
  if (!canClaimMission(u, m)) return ctx.reply('هنوز شرط ماموریت کامل نشده. /mission');

  claimMission(u, m);
  saveDB();
  ctx.reply(`✅ ماموریت ${m.id} تکمیل شد و پاداش گرفتی.`, mainMenu(ctx.from.id === ADMIN_ID));
});

/* =========================
   Admin Panel + Admin Commands
========================= */
function isAdmin(ctx) { return ctx.from && ctx.from.id === ADMIN_ID; }

bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply(
    '👑 پنل ادمین\n\nدستورات:\n/give_money <id> <amt>\n/give_res <id> <key> <amt>\n/give_item <id> <key> <amt>\n/set_hp <id> <amt>\n\nدستورات فارسی:\nپول <id> <amt>\nمنبع <id> <key> <amt>\nآیتم <id> <key> <amt>\n',
    Markup.inlineKeyboard([[Markup.button.callback('📋 کاربران', 'admin_users')]])
  );
});

bot.action('admin', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('No access', { show_alert:true });
  return ctx.reply('پنل ادمین: /admin');
});

bot.action('admin_users', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('No access', { show_alert:true });
  const ids = Object.keys(DB.users);
  const top = ids.slice(0, 15).map(id => {
    const u = DB.users[id];
    return `${id} | lv${u.level} | 💰${u.money}`;
  }).join('\n') || 'هیچ کاربری نیست.';
  ctx.reply('👥 لیست کاربران (15 تا اول):\n' + top);
});

// اسلش
bot.command('give_money', (ctx) => {
  if (!isAdmin(ctx)) return;
  const [_, id, amt] = ctx.message.text.split(' ');
  const u = ensureUser(id);
  u.money += Number(amt || 0);
  saveDB();
  ctx.reply('✅ انجام شد.');
});
bot.command('set_hp', (ctx) => {
  if (!isAdmin(ctx)) return;
  const [_, id, amt] = ctx.message.text.split(' ');
  const u = ensureUser(id);
  u.hp = clamp(Number(amt||0), 0, u.maxHp);
  saveDB();
  ctx.reply('✅ انجام شد.');
});
bot.command('give_res', (ctx) => {
  if (!isAdmin(ctx)) return;
  const [_, id, key, amt] = ctx.message.text.split(' ');
  const u = ensureUser(id);
  addRes(u, key, Number(amt || 0));
  saveDB();
  ctx.reply('✅ انجام شد.');
});
bot.command('give_item', (ctx) => {
  if (!isAdmin(ctx)) return;
  const [_, id, key, amt] = ctx.message.text.split(' ');
  const u = ensureUser(id);
  addItem(u, key, Number(amt || 1));
  saveDB();
  ctx.reply('✅ انجام شد.');
});

// فارسی (متن)
bot.hears(/^پول\s+(\d+)\s+(-?\d+)/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const u = ensureUser(ctx.match[1]);
  u.money += Number(ctx.match[2]);
  saveDB();
  ctx.reply('✅ پول اعمال شد.');
});
bot.hears(/^منبع\s+(\d+)\s+(\S+)\s+(-?\d+)/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const u = ensureUser(ctx.match[1]);
  addRes(u, ctx.match[2], Number(ctx.match[3]));
  saveDB();
  ctx.reply('✅ منبع اعمال شد.');
});
bot.hears(/^آیتم\s+(\d+)\s+(\S+)\s+(-?\d+)/, (ctx) => {
  if (!isAdmin(ctx)) return;
  const u = ensureUser(ctx.match[1]);
  addItem(u, ctx.match[2], Number(ctx.match[3]));
  saveDB();
  ctx.reply('✅ آیتم اعمال شد.');
});

// خرید فارسی برای خود کاربر: "خرید bandage"
bot.hears(/^خرید\s+(\S+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id);
  const it = SHOP.find(x => x.key === key);
  if (!it) return ctx.reply('کالا پیدا نشد. /shop');
  if (u.money < it.price) return ctx.reply('پول کافی نداری.');
  u.money -= it.price;
  addItem(u, key, 1);
  saveDB();
  ctx.reply(`✅ خرید شد: ${it.name}`);
});

// فرمان کمک
bot.command('help', (ctx) => {
  ctx.reply(
    [
      '📌 دستورات:',
      '/me وضعیت',
      '/gather جمع‌آوری',
      '/fight نبرد',
      '/mission ماموریت بعدی',
      '/claim دریافت پاداش ماموریت',
      '/shop فروشگاه',
      '/buy <key> خرید',
      '/use <key> استفاده',
      '/home وضعیت خانه',
      '/upgrade_home ارتقای خانه',
      '/hospital بیمارستان',
    ].join('\n')
  );
});

/* =========================
   Inline buttons
========================= */
bot.on('callback_query', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);
  const data = ctx.callbackQuery.data;

  if (data === 'me') {
    saveDB();
    return ctx.editMessageText(userStatus(u), mainMenu(ctx.from.id === ADMIN_ID));
  }
  if (data === 'wallet') {
    saveDB();
    return ctx.answerCbQuery(`💰 ${u.money} سکه`, { show_alert: true });
  }
  if (data === 'inv') {
    saveDB();
    return ctx.editMessageText(invText(u), mainMenu(ctx.from.id === ADMIN_ID));
  }
  if (data === 'shop') {
    saveDB();
    return ctx.editMessageText(shopText() + '\n\nخرید: /buy <key>\nیا: خرید <key>', mainMenu(ctx.from.id === ADMIN_ID));
  }
  if (data === 'mission') {
    saveDB();
    return ctx.reply('/mission');
  }
  if (data === 'home') {
    saveDB();
    return ctx.reply('/home');
  }
  if (data === 'hospital') {
    saveDB();
    return ctx.reply('/hospital');
  }
  if (data === 'fight') {
    saveDB();
    return ctx.reply('/fight');
  }
  if (data === 'admin') {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('دسترسی نداری', { show_alert:true });
    return ctx.reply('/admin');
  }

  saveDB();
  ctx.answerCbQuery('اوکی');
});

/* =========================
   Background: finish free heal
========================= */
setInterval(() => {
  try {
    const t = now();
    let changed = false;
    for (const id of Object.keys(DB.users)) {
      const u = DB.users[id];
      if (u.healInProgressUntil && t >= u.healInProgressUntil) {
        u.healInProgressUntil = 0;
        u.hp = u.maxHp;
        changed = true;
      }
    }
    if (changed) saveDB();
  } catch {}
}, 30 * 1000);

loadDB();
// ۱. این همون کیبورد اصلیته که دکمه‌ها توش تعریف میشن
const mainReplyKeyboard = Markup.keyboard([
    ['📊 وضعیت', '🛒 فروشگاه'],
    ['📜 ماموریت', '🏥 بیمارستان']
]).resize();

// ۲. این هم تنظیماتِ دکمه چهارخانه (منو)
bot.telegram.setMyCommands([
    { command: 'start', description: 'شروع بازی' },
    { command: 'menu', description: 'بازگشت به منوی اصلی' }
]);

// ۳. این هم دستوری که وقتی دکمه چهارخانه رو زد، منو رو نشون میده
bot.command('menu', (ctx) => {
    ctx.reply('منوی اصلی:', mainReplyKeyboard);
});

bot.launch();
console.log('Survival Bot PRO is running...');
process.on('SIGINT', () => bot.stop('SIGINT'));
process.on('SIGTERM', () => bot.stop('SIGTERM'));
