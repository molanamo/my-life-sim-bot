const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || 'TOKEN_BOT';
const ADMIN_ID = 5576592239;

const bot = new Telegraf(BOT_TOKEN);

const players = {};

const RESOURCE_LIST = [
  'چوب',
  'سنگ',
  'آهن',
  'فولاد',
  'طلا',
  'مس',
  'پارچه',
  'دارو',
  'قطعات الکترونیک',
  'باروت',
  'گوشت',
  'پوست'
];

const WEAPONS = {
  none: { name: 'دست خالی', power: 0, price: 0 },
  knife: { name: 'چاقو', power: 2, price: 50 },
  pistol: { name: 'کلت', power: 5, price: 150 },
  rifle: { name: 'کلاش', power: 10, price: 400 },
  sniper: { name: 'اسنایپر', power: 18, price: 900 }
};

const ARMORS = {
  none: { name: 'بدون زره', defense: 0, price: 0 },
  cloth: { name: 'جلیقه پارچه‌ای', defense: 2, price: 60 },
  light: { name: 'جلیقه سبک', defense: 5, price: 180 },
  military: { name: 'زره نظامی', defense: 10, price: 500 },
  heavy: { name: 'زره سنگین', defense: 18, price: 1100 }
};

const HOUSES = {
  1: { name: 'کپر', hpBonus: 0, cost: { چوب: 10, سنگ: 5 } },
  2: { name: 'اتاقک', hpBonus: 10, cost: { چوب: 20, سنگ: 15, آهن: 5 } },
  3: { name: 'خانه مقاوم', hpBonus: 20, cost: { چوب: 35, سنگ: 25, آهن: 15, فولاد: 5 } },
  4: { name: 'پناهگاه', hpBonus: 35, cost: { سنگ: 40, آهن: 20, فولاد: 12, طلا: 3 } },
  5: { name: 'قلعه بقا', hpBonus: 50, cost: { سنگ: 60, آهن: 35, فولاد: 20, طلا: 8, قطعات_الکترونیک: 5 } }
};

const TITLES = [
  { count: 3, title: 'بچه هیئتی' },
  { count: 6, title: 'بچه طلبه' },
  { count: 12, title: 'طلبه' },
  { count: 20, title: 'حاج آقا' }
];

const MISSIONS = [
  { id: 1, name: 'شکار خرگوش', minLevel: 1, type: 'hunt', hpLoss: [4, 8], xp: [8, 14], gold: [10, 20], loot: { گوشت: [1, 3], پوست: [1, 2] } },
  { id: 2, name: 'جمع‌آوری چوب', minLevel: 1, type: 'gather', hpLoss: [2, 6], xp: [6, 10], gold: [5, 12], loot: { چوب: [3, 8], سنگ: [1, 3] } },
  { id: 3, name: 'شکار گرگ', minLevel: 2, type: 'hunt', hpLoss: [8, 15], xp: [15, 24], gold: [18, 35], loot: { گوشت: [2, 4], پوست: [2, 4], باروت: [0, 1] } },
  { id: 4, name: 'حفاری معدن', minLevel: 2, type: 'gather', hpLoss: [6, 12], xp: [14, 22], gold: [20, 35], loot: { سنگ: [4, 9], آهن: [1, 4], مس: [1, 3] } },
  { id: 5, name: 'درگیری با راهزن‌ها', minLevel: 3, type: 'battle', hpLoss: [10, 18], xp: [20, 35], gold: [35, 60], loot: { طلا: [0, 2], باروت: [1, 3], پارچه: [1, 3] } },
  { id: 6, name: 'یورش به انبار متروکه', minLevel: 4, type: 'battle', hpLoss: [14, 22], xp: [28, 45], gold: [50, 80], loot: { دارو: [1, 2], قطعات_الکترونیک: [1, 2], آهن: [2, 5] } },
  { id: 7, name: 'شکار خرس', minLevel: 5, type: 'hunt', hpLoss: [18, 28], xp: [35, 55], gold: [60, 95], loot: { گوشت: [3, 6], پوست: [3, 5], دارو: [0, 1] } },
  { id: 8, name: 'نبرد مرزی', minLevel: 6, type: 'battle', hpLoss: [20, 32], xp: [45, 70], gold: [80, 130], loot: { باروت: [2, 5], فولاد: [1, 3], طلا: [1, 3] } }
];

function normalizeKey(key) {
  return String(key).replace(/ /g, '_');
}

function ensurePlayer(user) {
  const id = user.id;
  if (!players[id]) {
    const resources = {};
    for (const r of RESOURCE_LIST) {
      resources[normalizeKey(r)] = 0;
    }
    players[id] = {
      id,
      name: user.first_name || 'بازیکن',
      username: user.username || '',
      hp: 100,
      maxHp: 100,
      level: 1,
      xp: 0,
      gold: 100,
      power: 5,
      spirituality: 0,
      title: 'تازه‌وارد',
      resources,
      weapon: 'none',
      armor: 'none',
      houseLevel: 1,
      hospital: false,
      hospitalUntil: 0
    };
  }
  return players[id];
}

function getLevelNeed(level) {
  return level * 100;
}

function updateTitle(player) {
  let title = 'تازه‌وارد';
  for (const t of TITLES) {
    if (player.spirituality >= t.count) title = t.title;
  }
  player.title = title;
}

function totalAttack(player) {
  const weaponPower = WEAPONS[player.weapon]?.power || 0;
  return player.power + weaponPower;
}

function totalDefense(player) {
  return ARMORS[player.armor]?.defense || 0;
}

function formatResources(obj) {
  const items = Object.entries(obj).filter(([_, v]) => v > 0);
  if (!items.length) return 'هیچی';
  return items.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n');
}

function addLoot(player, lootDef) {
  const looted = {};
  for (const key of Object.keys(lootDef)) {
    const [min, max] = lootDef[key];
    const amount = rand(min, max);
    const normalized = normalizeKey(key);
    player.resources[normalized] = (player.resources[normalized] || 0) + amount;
    looted[normalized] = amount;
  }
  return looted;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function levelUp(player) {
  let leveled = false;
  while (player.xp >= getLevelNeed(player.level)) {
    player.xp -= getLevelNeed(player.level);
    player.level += 1;
    player.power += 2;
    player.maxHp += 10;
    player.hp = player.maxHp;
    leveled = true;
  }
  return leveled;
}

function checkHospital(player) {
  if (player.hospital && Date.now() >= player.hospitalUntil) {
    player.hospital = false;
    player.hp = player.maxHp;
  }
}

function hasCost(player, cost) {
  for (const key of Object.keys(cost)) {
    const n = normalizeKey(key);
    if ((player.resources[n] || 0) < cost[key]) return false;
  }
  return true;
}

function payCost(player, cost) {
  for (const key of Object.keys(cost)) {
    const n = normalizeKey(key);
    player.resources[n] -= cost[key];
  }
}

bot.start((ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);
  ctx.reply(
    `🪖 ${p.name} وارد جهنم بقا شدی.\n` +
    `هدف: زنده بمونی، غارت کنی، خونه و سلاح و زره بسازی.\n\n` +
    `دستورات:\n` +
    `/help\n/status\n/missions\n/mission 1\n/pray\n/rezve\n/namaz\n/hospital\n/inventory\n/shop\n/buy_weapon knife\n/buy_armor cloth\n/house\n/upgrade_house`
  );
});

bot.command('help', (ctx) => {
  ctx.reply(
    `📌 دستورات:\n` +
    `/status\n` +
    `/missions\n` +
    `/mission عدد\n` +
    `/attack آیدی_عددی_طرف\n` +
    `/pray\n` +
    `/rezve\n` +
    `/namaz\n` +
    `/hospital\n` +
    `/inventory\n` +
    `/shop\n` +
    `/buy_weapon مدل\n` +
    `/buy_armor مدل\n` +
    `/house\n` +
    `/upgrade_house\n` +
    `/myid\n` +
    `/admin`
  );
});

bot.command('myid', (ctx) => {
  ctx.reply(`آیدی عددی تو: ${ctx.from.id}`);
});

bot.command('status', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);

  ctx.reply(
    `🧍 وضعیت ${p.name}\n` +
    `HP: ${p.hp}/${p.maxHp}\n` +
    `لول: ${p.level}\n` +
    `XP: ${p.xp}/${getLevelNeed(p.level)}\n` +
    `طلا: ${p.gold}\n` +
    `قدرت پایه: ${p.power}\n` +
    `قدرت ضربه: ${totalAttack(p)}\n` +
    `دفاع: ${totalDefense(p)}\n` +
    `سلاح: ${WEAPONS[p.weapon].name}\n` +
    `زره: ${ARMORS[p.armor].name}\n` +
    `خانه: ${HOUSES[p.houseLevel].name}\n` +
    `معنویت: ${p.spirituality}\n` +
    `لقب: ${p.title}\n` +
    `بیمارستان: ${p.hospital ? 'بستری' : 'آزاد'}`
  );
});

bot.command('inventory', (ctx) => {
  const p = ensurePlayer(ctx.from);
  ctx.reply(
    `🎒 موجودی ${p.name}\n` +
    `طلا: ${p.gold}\n` +
    `${formatResources(p.resources)}`
  );
});

bot.command('missions', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);

  const available = MISSIONS.filter(m => p.level >= m.minLevel);
  if (!available.length) {
    return ctx.reply('فعلاً هیچ عملیات در دسترست نیست.');
  }

  let text = `🎯 مأموریت‌های باز:\n`;
  for (const m of available) {
    text += `\n#${m.id} | ${m.name}\n`;
    text += `سطح لازم: ${m.minLevel}\n`;
    text += `ریسک HP: ${m.hpLoss[0]} تا ${m.hpLoss[1]}\n`;
    text += `XP: ${m.xp[0]} تا ${m.xp[1]}\n`;
    text += `طلا: ${m.gold[0]} تا ${m.gold[1]}\n`;
  }
  ctx.reply(text);
});

bot.command('mission', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);

  if (p.hospital) {
    return ctx.reply('🏥 مجروحی. اول از بیمارستان دربیا.');
  }

  const parts = ctx.message.text.trim().split(' ');
  const id = Number(parts[1]);
  if (!id) return ctx.reply('مثال: /mission 1');

  const mission = MISSIONS.find(m => m.id === id);
  if (!mission) return ctx.reply('چنین مأموریتی وجود ندارد.');
  if (p.level < mission.minLevel) return ctx.reply('سطحت برای این عملیات کمه.');

  const hpLoss = rand(mission.hpLoss[0], mission.hpLoss[1]);
  const xpGain = rand(mission.xp[0], mission.xp[1]);
  const goldGain = rand(mission.gold[0], mission.gold[1]);
  const loot = addLoot(p, mission.loot);

  p.hp -= hpLoss;
  p.xp += xpGain;
  p.gold += goldGain;

  let text =
    `⚔️ عملیات: ${mission.name}\n` +
    `آسیب: ${hpLoss} HP\n` +
    `XP: +${xpGain}\n` +
    `طلا: +${goldGain}\n` +
    `غنیمت:\n${formatResources(loot)}\n`;

  if (p.hp <= 0) {
    p.hp = 10;
    p.hospital = true;
    p.hospitalUntil = Date.now() + 60 * 60 * 1000;
    text += `\n💀 له شدی ولی نمردی.\n🏥 فرستاده شدی بیمارستان برای 1 ساعت.`;
    return ctx.reply(text);
  }

  if (p.hp <= Math.floor(p.maxHp * 0.2)) {
    p.hospital = true;
    p.hospitalUntil = Date.now() + 30 * 60 * 1000;
    text += `\n🏥 اوضاعت داغونه. اجباری رفتی بیمارستان برای 30 دقیقه.`;
  }

  if (levelUp(p)) {
    text += `\n🔥 ارتقا گرفتی. لول جدید: ${p.level}`;
  }

  ctx.reply(text);
});

bot.command('pray', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);
  p.spirituality += 1;
  updateTitle(p);
  p.hp = Math.min(p.maxHp, p.hp + 8);
  ctx.reply(`🤲 دعا انجام شد.\nHP +8\nمعنویت: ${p.spirituality}\nلقب: ${p.title}`);
});

bot.command('rezve', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);
  p.spirituality += 1;
  updateTitle(p);
  p.hp = Math.min(p.maxHp, p.hp + 10);
  ctx.reply(`📿 رضوه انجام شد.\nHP +10\nمعنویت: ${p.spirituality}\nلقب: ${p.title}`);
});

bot.command('namaz', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);
  p.spirituality += 1;
  updateTitle(p);
  p.hp = Math.min(p.maxHp, p.hp + 12);
  ctx.reply(`🕌 نماز انجام شد.\nHP +12\nمعنویت: ${p.spirituality}\nلقب: ${p.title}`);
});

bot.command('hospital', (ctx) => {
  const p = ensurePlayer(ctx.from);
  checkHospital(p);

  if (!p.hospital) {
    if (p.hp >= p.maxHp) return ctx.reply('بدنت سالمه. بیمارستان لازم نداری.');
    p.gold -= p.gold >= 20 ? 20 : 0;
    p.hp = Math.min(p.maxHp, p.hp + 25);
    return ctx.reply(`🏥 پانسمان شدی.\nHP فعلی: ${p.hp}/${p.maxHp}`);
  }

  const remain = Math.max(0, p.hospitalUntil - Date.now());
  const min = Math.ceil(remain / 60000);
  ctx.reply(`🏥 هنوز بستری هستی.\nزمان باقی‌مانده: ${min} دقیقه`);
});

bot.command('shop', (ctx) => {
  let text = `🛒 فروشگاه سلاح:\n`;
  for (const key of Object.keys(WEAPONS)) {
    const w = WEAPONS[key];
    text += `${key} => ${w.name} | قدرت +${w.power} | ${w.price} طلا\n`;
  }
  text += `\n🛡 فروشگاه زره:\n`;
  for (const key of Object.keys(ARMORS)) {
    const a = ARMORS[key];
    text += `${key} => ${a.name} | دفاع +${a.defense} | ${a.price} طلا\n`;
  }
  text += `\nخرید:\n/buy_weapon knife\n/buy_armor cloth`;
  ctx.reply(text);
});

bot.command('buy_weapon', (ctx) => {
  const p = ensurePlayer(ctx.from);
  const parts = ctx.message.text.trim().split(' ');
  const key = parts[1];
  if (!key || !WEAPONS[key]) return ctx.reply('سلاح نامعتبره.');

  const item = WEAPONS[key];
  if (p.gold < item.price) return ctx.reply('طلا کم داری.');
  p.gold -= item.price;
  p.weapon = key;
  ctx.reply(`🔫 خریدی: ${item.name}\nقدرت ضربه فعلی: ${totalAttack(p)}`);
});

bot.command('buy_armor', (ctx) => {
  const p = ensurePlayer(ctx.from);
  const parts = ctx.message.text.trim().split(' ');
  const key = parts[1];
  if (!key || !ARMORS[key]) return ctx.reply('زره نامعتبره.');

  const item = ARMORS[key];
  if (p.gold < item.price) return ctx.reply('طلا کم داری.');
  p.gold -= item.price;
  p.armor = key;
  ctx.reply(`🛡 خریدی: ${item.name}\nدفاع فعلی: ${totalDefense(p)}`);
});

bot.command('house', (ctx) => {
  const p = ensurePlayer(ctx.from);
  const next = HOUSES[p.houseLevel + 1];

  let text =
    `🏠 خانه فعلی: ${HOUSES[p.houseLevel].name}\n` +
    `سطح خانه: ${p.houseLevel}\n`;

  if (next) {
    text += `\nارتقای بعدی: ${next.name}\n`;
    text += `افزایش HP: +${next.hpBonus}\n`;
    text += `هزینه:\n${formatResources(
      Object.fromEntries(
        Object.entries(next.cost).map(([k, v]) => [normalizeKey(k), v])
      )
    )}`;
  } else {
    text += `\nبه آخر خط رسیدی.`;
  }

  ctx.reply(text);
});

bot.command('upgrade_house', (ctx) => {
  const p = ensurePlayer(ctx.from);
  const nextLevel = p.houseLevel + 1;
  const next = HOUSES[nextLevel];

  if (!next) return ctx.reply('خانه‌ت تا ته ارتقا گرفته.');

  if (!hasCost(p, next.cost)) {
    return ctx.reply('منابع لازم برای ارتقای خانه رو نداری.');
  }

  payCost(p, next.cost);
  p.houseLevel = nextLevel;
  p.maxHp += next.hpBonus;
  p.hp = p.maxHp;

  ctx.reply(`🏠 خانه ارتقا یافت به: ${next.name}\nHP کل: ${p.maxHp}`);
});

bot.command('attack', (ctx) => {
  const attacker = ensurePlayer(ctx.from);
  checkHospital(attacker);

  if (attacker.hospital) return ctx.reply('🏥 بستری هستی. جنگ نداری.');

  const parts = ctx.message.text.trim().split(' ');
  const targetId = Number(parts[1]);
  if (!targetId) return ctx.reply('مثال: /attack 123456789');

  if (targetId === attacker.id) return ctx.reply('خودتو نمی‌زنن فرمانده.');
  const target = players[targetId];
  if (!target) return ctx.reply('اون بازیکن هنوز وارد بازی نشده.');

  checkHospital(target);
  if (target.hospital) return ctx.reply('طرف مجروحه و بیمارستانه.');

  const attackerHit = Math.max(1, totalAttack(attacker) - totalDefense(target) + rand(-2, 4));
  const targetHit = Math.max(1, totalAttack(target) - totalDefense(attacker) + rand(-2, 4));

  target.hp -= attackerHit;
  attacker.hp -= targetHit;

  let text =
    `⚔️ نبرد ${attacker.name} با ${target.name}\n` +
    `ضربه تو: ${attackerHit}\n` +
    `ضربه دشمن: ${targetHit}\n` +
    `HP تو: ${Math.max(attacker.hp, 0)}/${attacker.maxHp}\n` +
    `HP دشمن: ${Math.max(target.hp, 0)}/${target.maxHp}\n`;

  if (target.hp <= 0) {
    const stealGold = Math.min(target.gold, rand(20, 80));
    attacker.gold += stealGold;
    target.gold -= stealGold;
    target.hp = 10;
    target.hospital = true;
    target.hospitalUntil = Date.now() + 60 * 60 * 1000;
    attacker.xp += 40;
    text += `\n🏴 دشمن رو خوابوندی.\nغنیمت طلا: ${stealGold}\nXP +40`;
  }

  if (attacker.hp <= 0) {
    attacker.hp = 10;
    attacker.hospital = true;
    attacker.hospitalUntil = Date.now() + 60 * 60 * 1000;
    text += `\n💥 خودت هم لت و پار شدی. بیمارستان 1 ساعت.`;
  }

  if (levelUp(attacker)) text += `\n🔥 تو لول آپ شدی: ${attacker.level}`;
  if (target && levelUp(target)) {}

  ctx.reply(text);
});

bot.command('admin', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply('دسترسی نداری.');

  ctx.reply(
    `🧠 پنل مدیریت\n` +
    `/gift_all @disabled\n` +
    `/gift id resource amount\n` +
    `مثال:\n/gift 5576592239 چوب 50\n/gift 5576592239 طلا 500`
  );
});

bot.command('gift', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply('دسترسی نداری.');

  const parts = ctx.message.text.trim().split(' ');
  if (parts.length < 4) return ctx.reply('مثال: /gift 5576592239 چوب 50');

  const targetId = Number(parts[1]);
  const resourceName = parts[2];
  const amount = Number(parts[3]);

  if (!targetId || !resourceName || !amount) return ctx.reply('ورودی غلطه.');

  if (!players[targetId]) {
    players[targetId] = ensurePlayer({ id: targetId, first_name: 'بازیکن', username: '' });
  }

  const target = players[targetId];

  if (resourceName === 'طلا') {
    target.gold += amount;
    return ctx.reply(`✅ ${amount} طلا به ${targetId} داده شد.`);
  }

  const key = normalizeKey(resourceName);
  target.resources[key] = (target.resources[key] || 0) + amount;
  ctx.reply(`✅ ${amount} ${resourceName} به ${targetId} داده شد.`);
});

bot.catch((err, ctx) => {
  console.error('BOT ERROR:', err);
  if (ctx && ctx.reply) ctx.reply('خطا خورد. دوباره بزن.');
});

bot.launch();
console.log('Survival bot is running...');
