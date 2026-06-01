const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const ADMIN_ID = 5576592239;
const DB_FILE = path.join(__dirname, 'data.json');

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN') {
  console.log('توکن ربات را در BOT_TOKEN بگذار');
}

const bot = new Telegraf(BOT_TOKEN);

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: {} };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: {} };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

const db = loadDB();

const RES_KEYS = ['wood', 'stone', 'metal', 'iron', 'gold', 'toman'];

const RES_LABELS = {
  wood: 'چوب',
  stone: 'سنگ',
  metal: 'فلز',
  iron: 'آهن',
  gold: 'طلا',
  toman: 'تومن'
};

const WEAPONS = {
  none: { name: 'بدون سلاح', power: 0, price: 0, sell: 0 },
  stick: { name: 'چوب', power: 2, price: 20, sell: 10 },
  knife: { name: 'چاقو', power: 5, price: 80, sell: 40 },
  pistol: { name: 'تپانچه', power: 10, price: 220, sell: 110 },
  rifle: { name: 'تفنگ', power: 18, price: 500, sell: 250 },
  axe: { name: 'تبر جنگی', power: 14, price: 350, sell: 175 }
};

const HEAL_ITEMS = {
  bandage: { name: 'باند', heal: 15, price: 25, sell: 12 },
  medkit: { name: 'جعبه کمک', heal: 40, price: 80, sell: 40 },
  soup: { name: 'سوپ گرم', heal: 10, price: 18, sell: 9 },
  herb: { name: 'گیاه درمانی', heal: 20, price: 35, sell: 17 }
};

const SPECIAL_ITEMS = {
  gem: { name: 'سنگ قیمتی', price: 120, sell: 60 },
  map: { name: 'نقشه کهنه', price: 90, sell: 45 },
  fuel: { name: 'سوخت', price: 75, sell: 35 }
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
  axe: { type: 'weapon', key: 'axe', name: 'تبر جنگی', price: 350 },

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

const DAILY_MS = 24 * 60 * 60 * 1000;

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

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function ensureUser(id, name = '') {
  const uid = String(id);
  if (!db.users[uid]) {
    db.users[uid] = {
      id: uid,
      name,
      playerLevel: 1,
      playerXP: 0,
      hp: 100,
      maxHp: 100,
      homeLevel: 1,
      clinicBuilt: false,
      shopBuilt: false,
      armoryBuilt: false,
      weapon: 'none',
      resources: {
        wood: 0,
        stone: 0,
        metal: 0,
        iron: 0,
        gold: 30,
        toman: 0
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
        freeHealUsed: false
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
      }
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
  u.maxHp ??= 100;
  u.homeLevel ??= 1;
  u.clinicBuilt ??= false;
  u.shopBuilt ??= false;
  u.armoryBuilt ??= false;
  u.weapon ??= 'none';
  u.resources ??= {};
  u.items ??= {};
  u.weaponsOwned ??= { none: true };
  u.daily ??= { key: todayKey(), missions: [], progress: {}, freeHealUsed: false };
  u.stats ??= {};
  for (const k of RES_KEYS) if (typeof u.resources[k] !== 'number') u.resources[k] = 0;
  for (const k of Object.keys(HEAL_ITEMS)) if (typeof u.items[k] !== 'number') u.items[k] = 0;
  for (const k of Object.keys(SPECIAL_ITEMS)) if (typeof u.items[k] !== 'number') u.items[k] = 0;
  u.weaponsOwned.none = true;
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
      freeHealUsed: false
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
    .map(([k, v]) => `${v} ${RES_LABELS[k] || k}`)
    .join(' | ');
}

function getFacilities(u) {
  return [
    `درمانگاه: ${u.homeLevel >= 2 ? 'فعال' : 'قفل'}`,
    `فروشگاه: ${u.homeLevel >= 2 ? 'فعال' : 'قفل'}`,
    `اسلحه‌خانه: ${u.homeLevel >= 2 ? 'فعال' : 'قفل'}`
  ].join('\n');
}

function statusText(u) {
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  return [
    `🏕️ وضعیت بازیکن`,
    `👤 نام: ${u.name || '-'}`,
    `🎚 لول: ${u.playerLevel}`,
    `✨ XP: ${u.playerXP}/30`,
    `❤️ HP: ${u.hp}/${u.maxHp}`,
    `🏠 لول خانه: ${u.homeLevel}`,
    `⚔️ سلاح فعلی: ${weapon.name}`,
    ``,
    `📦 منابع:`,
    `🪵 چوب: ${u.resources.wood}`,
    `🪨 سنگ: ${u.resources.stone}`,
    `🔩 فلز: ${u.resources.metal}`,
    `⛓ آهن: ${u.resources.iron}`,
    `🥇 طلا: ${u.resources.gold}`,
    `💵 تومن: ${u.resources.toman}`,
    ``,
    `🧰 آیتم‌ها:`,
    `باند: ${u.items.bandage}`,
    `جعبه کمک: ${u.items.medkit}`,
    `سوپ: ${u.items.soup}`,
    `گیاه درمانی: ${u.items.herb}`,
    `سنگ قیمتی: ${u.items.gem}`,
    `نقشه کهنه: ${u.items.map}`,
    `سوخت: ${u.items.fuel}`,
    ``,
    `🏗 امکانات:`,
    getFacilities(u)
  ].join('\n');
}

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🪓 جستجو', 'gather')],
    [Markup.button.callback('📜 ماموریت‌ها', 'missions'), Markup.button.callback('🎯 ماموریت فعال', 'active_missions')],
    [Markup.button.callback('✅ تحویل ماموریت', 'claim_missions'), Markup.button.callback('⚔️ مبارزه', 'fight_animal')],
    [Markup.button.callback('👹 نبرد با دیو', 'fight_demon'), Markup.button.callback('🏠 خانه', 'home')],
    [Markup.button.callback('🏥 درمانگاه', 'clinic'), Markup.button.callback('🛒 فروشگاه', 'shop')],
    [Markup.button.callback('🛠 اسلحه‌خانه', 'armory')]
  ]);
}

function backMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]);
}

function missionsText(u) {
  refreshDaily(u);
  const lines = ['📜 ماموریت‌های روزانه:'];
  for (const d of u.daily.missions) {
    const m = missionById(d.id);
    const prog = u.daily.progress[m.id] || 0;
    const done = isMissionDone(u, m);
    lines.push(
      ``,
      `#${m.id} ${m.title}`,
      `📝 ${m.desc}`,
      `📈 پیشرفت: ${Math.min(prog, m.targetAmount)}/${m.targetAmount}`,
      `🎁 جایزه: ${rewardText(m.rewards)}`,
      `وضعیت: ${d.claimed ? 'تحویل شده' : done ? 'آماده تحویل' : 'در حال انجام'}`
    );
  }
  return lines.join('\n');
}

function rewardText(rew) {
  const out = [];
  for (const [k, v] of Object.entries(rew)) {
    if (k === 'xp') out.push(`${v} XP`);
    else if (RES_LABELS[k]) out.push(`${v} ${RES_LABELS[k]}`);
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
    if (m.targetType === 'action' && m.targetKey === actionKey && !d.claimed) {
      u.daily.progress[m.id] = (u.daily.progress[m.id] || 0) + amount;
    }
  }
}

function shopText() {
  const lines = ['🛒 فروشگاه', '', 'خرید با دستور:', '/buy <key> <amount>', 'فروش با دستور:', '/sell <key> <amount>', '', 'لیست کالاها:'];
  for (const [k, v] of Object.entries(SHOP_BUY)) {
    lines.push(`${k} => ${v.name} - ${v.price} طلا`);
  }
  return lines.join('\n');
}

function homeText(u) {
  const next = HOME_UPGRADES[u.homeLevel + 1];
  let nextText = 'بیشترین سطح فعلی رسیده';
  if (next) {
    nextText = `ارتقا به لول ${u.homeLevel + 1}\nنیاز: ${formatCost(next)}\nلول بازیکن لازم: ${next.needPlayerLevel}`;
  }
  return [
    `🏠 خانه`,
    `سطح فعلی: ${u.homeLevel}`,
    '',
    nextText,
    '',
    `برای ارتقا: /upgrade_home`,
    `امکانات فعلی:`,
    getFacilities(u)
  ].join('\n');
}

function armoryText(u) {
  const lines = ['🛠 اسلحه‌خانه', 'برای ساخت: /craft <weaponKey>', 'برای تجهیز: /equip <weaponKey>', ''];
  for (const [k, c] of Object.entries(ARMORY_RECIPES)) {
    lines.push(`${k} => ${WEAPONS[k].name} | نیاز: ${formatCost(c)}`);
  }
  lines.push('', 'سلاح‌های موجود شما:');
  for (const k of Object.keys(u.weaponsOwned)) {
    if (u.weaponsOwned[k]) lines.push(`- ${WEAPONS[k]?.name || k}${u.weapon === k ? ' (در دست)' : ''}`);
  }
  return lines.join('\n');
}

function clinicText(u) {
  return [
    `🏥 درمانگاه`,
    `HP فعلی: ${u.hp}/${u.maxHp}`,
    `درمان رایگان روزانه: ${u.daily.freeHealUsed ? 'استفاده شده' : 'آماده'}`,
    '',
    `دستورها:`,
    `/heal free`,
    `/heal gold`,
    `/use <bandage|medkit|soup|herb>`
  ].join('\n');
}

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

function rollCombat(u, type = 'animal') {
  const playerPower = u.playerLevel * 4 + (WEAPONS[u.weapon]?.power || 0) + Math.floor(Math.random() * 8);
  const enemyList = type === 'demon'
    ? [
        { name: 'دیو سرخ', power: 16, hpLoss: [18, 35], rewards: { gold: 28, iron: 2, metal: 2 } },
        { name: 'دیو سنگی', power: 22, hpLoss: [22, 40], rewards: { gold: 40, iron: 3, toman: 1 } },
        { name: 'دیو بزرگ', power: 28, hpLoss: [25, 48], rewards: { gold: 55, iron: 4, toman: 1, gem: 1 } }
      ]
    : [
        { name: 'گرگ', power: 8, hpLoss: [8, 16], rewards: { gold: 10, wood: 1 } },
        { name: 'گراز', power: 10, hpLoss: [9, 18], rewards: { gold: 12, stone: 1 } },
        { name: 'کفتار', power: 12, hpLoss: [10, 20], rewards: { gold: 15, metal: 1 } },
        { name: 'خرس', power: 16, hpLoss: [14, 28], rewards: { gold: 20, iron: 1 } }
      ];

  const enemy = enemyList[Math.floor(Math.random() * enemyList.length)];
  const enemyPower = enemy.power + Math.floor(Math.random() * 10);
  const loss = rand(enemy.hpLoss[0], enemy.hpLoss[1]);

  if (u.hp <= 0) return { blocked: true, text: 'HP شما صفر است. اول درمان کن.' };

  let winChance = 50 + (playerPower - enemyPower) * 4;
  if (winChance < 15) winChance = 15;
  if (winChance > 85) winChance = 85;
  const win = Math.random() * 100 < winChance;

  u.hp -= loss;
  if (u.hp < 0) u.hp = 0;

  if (win) {
    for (const [k, v] of Object.entries(enemy.rewards)) {
      if (RES_LABELS[k]) addResource(u, k, v);
      else addItem(u, k, v);
    }
    bumpAction(u, 'fight_win', 1);
    if (type === 'demon') bumpAction(u, 'demon_win', 1);
    return {
      blocked: false,
      win: true,
      enemy,
      loss,
      rewards: enemy.rewards,
      text: `✅ شما ${enemy.name} را شکست دادی\n❤️ HP از دست رفته: ${loss}\n🎁 غنیمت: ${rewardText(enemy.rewards)}`
    };
  } else {
    return {
      blocked: false,
      win: false,
      enemy,
      loss,
      text: `❌ شما از ${enemy.name} شکست خوردی\n❤️ HP از دست رفته: ${loss}\nسعی کن قوی‌تر برگردی`
    };
  }
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function parseArgs(text) {
  return text.trim().split(/\s+/);
}

function isAdmin(id) {
  return Number(id) === ADMIN_ID;
}

bot.start((ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  return ctx.reply(
    `سلام ${u.name || ''} به بازی بقا خوش اومدی`,
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

bot.command('ماموریت_فعال', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(missionsText(u), backMenu());
});

bot.command('تحویل_ماموریت', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const claimed = claimAvailableMissions(u);
  saveDB(db);
  ctx.reply(claimed || 'هیچ ماموریت آماده تحویلی نداری', backMenu());
});

function claimAvailableMissions(u) {
  refreshDaily(u);
  const msgs = [];
  for (const d of u.daily.missions) {
    const m = missionById(d.id);
    if (!d.claimed && isMissionDone(u, m)) {
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

bot.command('خانه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(homeText(u), backMenu());
});

bot.command('upgrade_home', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const nextLevel = u.homeLevel + 1;
  const cost = HOME_UPGRADES[nextLevel];
  if (!cost) return ctx.reply('دیگه ارتقای بیشتری تعریف نشده', backMenu());
  if (u.playerLevel < cost.needPlayerLevel) {
    return ctx.reply(`برای ارتقا به لول ${nextLevel} باید لول بازیکن ${cost.needPlayerLevel} باشی`, backMenu());
  }
  if (!hasResources(u, cost)) {
    return ctx.reply(`منابع کافی نیست\nنیاز: ${formatCost(cost)}`, backMenu());
  }
  takeResources(u, cost);
  u.homeLevel = nextLevel;
  bumpAction(u, 'home_upgrade', 1);
  saveDB(db);
  ctx.reply(`🏠 خانه به لول ${u.homeLevel} ارتقا یافت`, backMenu());
});

bot.command('فروشگاه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('فروشگاه بعد از خانه لول 2 باز می‌شود', backMenu());
  ctx.reply(shopText(), backMenu());
});

bot.command('buy', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('فروشگاه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const amount = Math.max(1, Number(args[2] || 1));
  const item = SHOP_BUY[key];
  if (!item) return ctx.reply('کالای نامعتبر', backMenu());
  const total = item.price * amount;
  if (u.resources.gold < total) return ctx.reply('طلای کافی نداری', backMenu());
  addResource(u, 'gold', -total);

  if (item.type === 'resource') addResource(u, item.key, amount);
  if (item.type === 'item' || item.type === 'special') addItem(u, item.key, amount);
  if (item.type === 'weapon') {
    u.weaponsOwned[item.key] = true;
    bumpAction(u, 'get_weapon', 1);
  }
  bumpAction(u, 'buy', 1);
  saveDB(db);
  ctx.reply(`✅ خرید انجام شد: ${item.name} × ${amount}`, backMenu());
});

bot.command('sell', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('فروشگاه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const amount = Math.max(1, Number(args[2] || 1));

  if (RES_LABELS[key] && key !== 'gold') {
    if ((u.resources[key] || 0) < amount) return ctx.reply('به این مقدار نداری', backMenu());
    const price = Math.max(1, Math.floor((SHOP_BUY[key]?.price || 5) / 2));
    addResource(u, key, -amount);
    addResource(u, 'gold', price * amount);
    bumpAction(u, 'sell', 1);
    saveDB(db);
    return ctx.reply(`✅ فروخته شد\n${amount} ${RES_LABELS[key]} => ${price * amount} طلا`, backMenu());
  }

  if (u.items[key] >= amount) {
    const base =
      HEAL_ITEMS[key]?.sell ||
      SPECIAL_ITEMS[key]?.sell ||
      Math.max(1, Math.floor((SHOP_BUY[key]?.price || 10) / 2));
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

  ctx.reply('چیزی برای فروش پیدا نشد', backMenu());
});

bot.command('درمانگاه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('درمانگاه بعد از خانه لول 2 باز می‌شود', backMenu());
  ctx.reply(clinicText(u), backMenu());
});

bot.command('heal', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 0) return ctx.reply('درمانگاه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const mode = args[1];

  if (mode === 'free') {
    if (u.daily.freeHealUsed) return ctx.reply('درمان رایگان امروز را استفاده کردی', backMenu());
    u.daily.freeHealUsed = true;
    u.hp = Math.min(u.maxHp, u.hp + 30);
    bumpAction(u, 'heal', 1);
    saveDB(db);
    return ctx.reply(`✅ 30 HP درمان شد\nHP: ${u.hp}/${u.maxHp}`, backMenu());
  }

  if (mode === 'gold') {
    if (u.resources.gold < 20) return ctx.reply('20 طلا لازم داری', backMenu());
    addResource(u, 'gold', -20);
    u.hp = u.maxHp;
    bumpAction(u, 'heal', 1);
    saveDB(db);
    return ctx.reply(`✅ HP کامل شد\nHP: ${u.hp}/${u.maxHp}`, backMenu());
  }

  ctx.reply('استفاده: /heal free یا /heal gold', backMenu());
});

bot.command('use', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const item = HEAL_ITEMS[key];
  if (!item) return ctx.reply('آیتم درمانی نامعتبر', backMenu());
  if ((u.items[key] || 0) < 1) return ctx.reply('این آیتم را نداری', backMenu());
  addItem(u, key, -1);
  u.hp = Math.min(u.maxHp, u.hp + item.heal);
  bumpAction(u, 'heal', 1);
  saveDB(db);
  ctx.reply(`✅ از ${item.name} استفاده شد\n+${item.heal} HP\nHP: ${u.hp}/${u.maxHp}`, backMenu());
});

bot.hears('درمان', (ctx) => {
  try {
    const u = ensureUser(ctx.from.id);

    if (u.hp == null) u.hp = 100;
    if (u.maxHp == null) u.maxHp = 100;
    if (u.money == null) u.money = 0;

    if (u.hp >= u.maxHp) {
      return ctx.reply(`❤️ سلامتی‌ات کامل است: ${u.hp}/${u.maxHp}`);
    }

    const cost = Math.max(20, (u.maxHp - u.hp) * 2);

    if (u.money < cost) {
      return ctx.reply(`🏥 درمانگاه\n❤️ HP: ${u.hp}/${u.maxHp}\n💰 هزینه درمان: ${cost} سکه\nسکه کافی نداری.`);
    }

    u.money -= cost;
    u.hp = u.maxHp;

    if (typeof saveDB === 'function') saveDB();

    return ctx.reply(`🏥 درمان شدی!\n❤️ HP: ${u.hp}/${u.maxHp}\n💰 هزینه: ${cost} سکه`);
  } catch (e) {
    console.log('heal error:', e);
    return ctx.reply('❌ خطا در بخش درمان');
  }
});

bot.hears('درمانگاه', (ctx) => {
  try {
    const u = ensureUser(ctx.from.id);

    if (u.hp == null) u.hp = 100;
    if (u.maxHp == null) u.maxHp = 100;
    if (u.money == null) u.money = 0;

    const cost = Math.max(20, (u.maxHp - u.hp) * 2);

    return ctx.reply(`🏥 درمانگاه باز است\n❤️ HP: ${u.hp}/${u.maxHp}\n💰 هزینه درمان کامل: ${cost} سکه`);
  } catch (e) {
    console.log('hospital error:', e);
    return ctx.reply('❌ خطا در بخش درمانگاه');
  }
});


bot.command('اسلحه_خانه', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('اسلحه‌خانه بعد از خانه لول 2 باز می‌شود', backMenu());
  ctx.reply(armoryText(u), backMenu());
});

bot.command('craft', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.reply('اسلحه‌خانه هنوز قفل است', backMenu());
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const recipe = ARMORY_RECIPES[key];
  if (!recipe || !WEAPONS[key]) return ctx.reply('سلاح نامعتبر', backMenu());
  if (u.weaponsOwned[key]) return ctx.reply('این سلاح را داری', backMenu());
  if (!hasResources(u, recipe)) return ctx.reply(`منابع کافی نیست\n${formatCost(recipe)}`, backMenu());
  takeResources(u, recipe);
  u.weaponsOwned[key] = true;
  bumpAction(u, 'get_weapon', 1);
  saveDB(db);
  ctx.reply(`✅ ${WEAPONS[key].name} ساخته شد`, backMenu());
});

bot.command('equip', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  if (!u.weaponsOwned[key]) return ctx.reply('این سلاح را نداری', backMenu());
  u.weapon = key;
  saveDB(db);
  ctx.reply(`⚔️ ${WEAPONS[key].name} تجهیز شد`, backMenu());
});

bot.command('fight', (ctx) => {
  const u = ensureUser(ctx.from.id);
  tickNeeds(u);

  if (u.hp <= 0) return ctx.reply('تو بیهوشی! برو بیمارستان: /hospital');

  // --- قدرت کاربر ---
  const gear = u.inventory.knife ? 5 : 0; // اگر چاقو داره
  const basePower = u.level * 3 + gear + rnd(0, 6);

  // --- تنظیمات برای تازه کارها (لول 1 تا 3) ---
  let power = basePower;
  let winChanceBonus = 0;
  let damageMultiplier = 1;

  if (u.level <= 3) {
    winChanceBonus = 30; // 30 درصد شانس برد بیشتر
    damageMultiplier = 0.5; // نصف شدن دمیجی که می‌خوری
  }

  // --- دشمن ---
  const enemy = {
    hp: 20 + u.level * 4 + rnd(0, 10),
    power: 4 + u.level * 1.5 + rnd(0, 3),
    name: ['گرگ','دزد','زامبی','خرس','سگ وحشی'][rnd(0,4)]
  };

  // --- محاسبه شانس برد ---
  let winChance = 50 + (u.level * 4) + gear + winChanceBonus;
  if (winChance > 90) winChance = 90;

  // 3 پیروزی اول تضمینی است
  const wins = u._fightWins || 0;
  const win = (wins < 3) || (rnd(1, 100) <= winChance);

  // محاسبه دمیج دریافتی
  let damage = Math.floor((enemy.power + rnd(0, 4)) * damageMultiplier);
  if (damage < 1) damage = 1;

  // --- اعمال نتیجه ---
  if (win) {
    u._fightWins = (u._fightWins || 0) + 1;
    const money = rnd(40, 90) + u.level * 5;
    u.money += money;
    addRes(u, 'wood', rnd(0, 2));
    addRes(u, 'iron', rnd(0, 1));
    giveXP(u, 35);
    
    // کسر سلامتی
    u.hp = clamp(u.hp - damage, 1, u.maxHp);
    saveDB();

    return ctx.reply(
      `⚔️ [نسخه جدید] دشمن: ${enemy.name}\n✅ بردی!\n💰 سکه: +${money}\n❤️ HP دریافتی: -${damage}\nوضعیت فعلی: ${u.hp}/${u.maxHp}`,
      mainMenu(ctx.from.id === ADMIN_ID)
    );
  } else {
    // در صورت باخت، کمتر آسیب می‌بینه
    u.hp = clamp(u.hp - (damage / 2), 1, u.maxHp);
    saveDB();

    return ctx.reply(
      `⚔️ [نسخه جدید] دشمن: ${enemy.name}\n❌ باختی!\n🤕 آسیب دیدی (کمتر از قبل)\nHP فعلی: ${u.hp}/${u.maxHp}\nبرو /hospital`,
      mainMenu(ctx.from.id === ADMIN_ID)
    );
  }
});

bot.command('demon', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const result = rollCombat(u, 'demon');
  saveDB(db);
  ctx.reply(result.text, backMenu());
});

bot.command('gather', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const found = performGather(u);
  saveDB(db);
  ctx.reply(`🪓 جستجو انجام شد\n🎁 ${rewardText(found)}`, backMenu());
});


bot.command('admin_give', (ctx) => {
  const me = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!isAdmin(me.id)) return ctx.reply('فقط ادمین');
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  const type = args[2];
  const key = args[3];
  const amount = Number(args[4] || 0);

  if (!targetId || !type || !key || !amount) {
    return ctx.reply('استفاده:\n/admin_give userId resource wood 10\n/admin_give userId item bandage 2\n/admin_give userId weapon rifle 1');
  }
bot.command('aramgah', async (ctx) => {
    try {
        await ctx.reply('🕌 به آرامگاه خوش آمدید. برای آرامش روح خود یکی را انتخاب کنید:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'دعا', callback_data: 'pray_dua' },
                        { text: 'نماز', callback_data: 'pray_namaz' },
                        { text: 'روضه', callback_data: 'pray_rozeh' }
                    ]
                ]
            }
        });
    } catch (err) {
        console.error('Error showing buttons:', err);
    }
});

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
    return ctx.reply('type نامعتبر');
  }
  saveDB(db);
  ctx.reply('✅ انجام شد');
});

bot.command('admin_full', (ctx) => {
  const me = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!isAdmin(me.id)) return ctx.reply('فقط ادمین');
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('استفاده: /admin_full userId');
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
// مدیریت کلیک دکمه‌های آرامگاه
bot.action(/pray_(.+)/, (ctx) => {
    const u = ensureUser(ctx.from.id);
    const type = ctx.match[1];
    
    // تنظیم XP: اگر لول ۳ یا کمتر است ۵۰، وگرنه ۱۰
    const xpGain = (u.playerLevel <= 3) ? 50 : 10;
    u.playerXP = (u.playerXP || 0) + xpGain;

    // منطق لول‌آپ (بررسی برای لول‌های احتمالی چندگانه)
    let leveledUp = false;
    while (u.playerXP >= 30) {
        u.playerLevel += 1;
        u.playerXP -= 30;
        leveledUp = true;
    }

    if (typeof saveDB === 'function') saveDB();

    ctx.answerCbQuery(`شما ${type} خواندید و ${xpGain} XP گرفتید`);
    ctx.reply(`✅ عمل ${type} انجام شد.\n➕ ${xpGain} XP دریافت کردید.\n📊 وضعیت جدید: لول ${u.playerLevel} | XP ${u.playerXP}${leveledUp ? '\n🎉 تبریک! لول شما افزایش یافت.' : ''}`);
});

bot.action('missions', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.editMessageText(missionsText(u), backMenu());
});

bot.action('active_missions', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.editMessageText(missionsText(u), backMenu());
});

bot.action('claim_missions', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const claimed = claimAvailableMissions(u);
  saveDB(db);
  ctx.editMessageText(claimed || 'هیچ ماموریت آماده تحویلی نداری', backMenu());
});

bot.action('fight_animal', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const result = rollCombat(u, 'animal');
  saveDB(db);
  ctx.editMessageText(result.text, backMenu());
});

bot.action('fight_demon', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const result = rollCombat(u, 'demon');
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
  if (!cost) return ctx.answerCbQuery('ارتقای بیشتری وجود ندارد');
  if (u.playerLevel < cost.needPlayerLevel) return ctx.answerCbQuery(`لول لازم: ${cost.needPlayerLevel}`);
  if (!hasResources(u, cost)) return ctx.answerCbQuery('منابع کافی نیست');
  takeResources(u, cost);
  u.homeLevel = nextLevel;
  bumpAction(u, 'home_upgrade', 1);
  saveDB(db);
  ctx.editMessageText(`🏠 خانه به لول ${u.homeLevel} ارتقا یافت`, backMenu());
});

bot.action('clinic', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('درمانگاه قفل است');
  ctx.editMessageText(clinicText(u), backMenu());
});

bot.action('shop', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('فروشگاه قفل است');
  ctx.editMessageText(shopText(), backMenu());
});

bot.action('armory', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.homeLevel < 2) return ctx.answerCbQuery('اسلحه‌خانه قفل است');
  ctx.editMessageText(armoryText(u), backMenu());
});

bot.action('back_main', (ctx) => {
  ctx.editMessageText('منوی اصلی', mainMenu());
});

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
    return ctx.reply(claimed || 'هیچ ماموریت آماده تحویلی نداری', backMenu());
  }

  if (text === 'خانه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    return ctx.reply(homeText(u), backMenu());
  }

  if (text === 'درمانگاه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.homeLevel < 2) return ctx.reply('درمانگاه قفل است', backMenu());
    return ctx.reply(clinicText(u), backMenu());
  }

  if (text === 'فروشگاه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.homeLevel < 2) return ctx.reply('فروشگاه قفل است', backMenu());
    return ctx.reply(shopText(), backMenu());
  }

  if (text === 'اسلحه خانه' || text === 'اسلحه‌خانه') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    if (u.homeLevel < 2) return ctx.reply('اسلحه‌خانه قفل است', backMenu());
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
    const result = rollCombat(u, 'animal');
    saveDB(db);
    return ctx.reply(result.text, backMenu());
  }

  if (text === 'دیو') {
    const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
    const result = rollCombat(u, 'demon');
    saveDB(db);
    return ctx.reply(result.text, backMenu());
  }
});

bot.catch((err, ctx) => {
  console.error('BOT ERROR:', err);
  try {
    ctx.reply('یه خطا رخ داد');
  } catch {}
});

bot.launch().then(() => {
  console.log('Survival bot started');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
