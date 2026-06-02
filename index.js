const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// ==================== تنظیمات ====================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_FILE = path.join(__dirname, 'data.json');

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.log('❌ لطفاً توکن ربات رو در BOT_TOKEN وارد کن');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== عکس‌های بازی (از کانال دائمی) ====================
const IMG = {
  // حیوانات خونگی
  cat: 'AgACAgQAAxkBAAFLSgNqHmVEoburdpVCP8ScdIj12R4RwAACEQ5rG9cu8VC367-lQMBL8QEAAwIAA3kAAzsE',
  falcon: 'AgACAgQAAxkBAAFLSgJqHmVE75vYI61tA6E3m7moNEWuywACEA5rG9cu8VB3IGysH4uMaQEAAwIAA3kAAzsE',
  dog: 'AgACAgQAAxkBAAFLSgFqHmVEU5XC-_iGP-k-s0sMzR21pwACDw5rG9cu8VBg84DECuwZAgEAAwIAA3gAAzsE',
  rooster: 'AgACAgQAAxkBAAFLSgABah5lRAgSyJvOjIFAph7dPzfexDYAAg4OaxvXLvFQH7UjsIaEWwABAQADAgADeQADOwQ',
  foal: 'AgACAgQAAxkBAAFLSfBqHmQT6yGTSZ4_0sLtoQqIsIWMKAACZRBrG_TM8VBLXhH2rfax_wEAAwIAA3gAAzsE',
  camel: 'AgACAgQAAxkBAAFLSe5qHmPJKHl-z6SsJzk8C4g3a8jQzQACZBBrG_TM8VAOznRCTxdjtAEAAwIAA3gAAzsE',
  horse: 'AgACAgQAAxkBAAFLSeZqHmNRP-DSRJCAN4lvwlFg3GImQwACDA5rG9cu8VBb2hE56qlTGQEAAwIAA3kAAzsE',

  // موجودات افسانه‌ای
  div_sefid_1: 'AgACAgQAAxkBAAFLSxJqHnew0Bkx-AjWF7I6CvAHMVAmcgACEg5rG9cu8VCAQFZgFU3ADAEAAwIAA3kAAzsE',
  div_sefid_2: 'AgACAgQAAxkBAAFLSvVqHndF5gNV8yp9Ql-FZGtw81rInQACEw5rG9cu8VCXWuOuyFcEuQEAAwIAA3kAAzsE',
  div_siah: 'AgACAgQAAxkBAAFLSvhqHndK4oeLefAMsjmfGeP1eeIXxgACFA5rG9cu8VDgfdaElW1QsgEAAwIAA3kAAzsE',
  div_darya: 'AgACAgQAAxkBAAFLSvtqHndO-WE4N0CRieGlRWqqTuVQUAACFQ5rG9cu8VCVfceyU9ObjQEAAwIAA3kAAzsE',
  enemy_11: 'AgACAgQAAxkBAAFLSxpqHnfBYBoDTsASSrT9GgNpd6M5zAACFg5rG9cu8VB0Y3s7fQj1uQEAAwIAA3kAAzsE',
  enemy_12: 'AgACAgQAAxkBAAFLSxxqHnfFIRXWaQABeaAR07U8uD7we-QAAhcOaxvXLvFQnJNIe1jxcUUBAAMCAAN5AAM7BA',
  enemy_13: 'AgACAgQAAxkBAAFLSx5qHnfJ4yTfrcBuxlIjO1_ZxgqBVQACGA5rG9cu8VAsLaKt9UB1swEAAwIAA3kAAzsE',
  enemy_14: 'AgACAgQAAxkBAAFLSyBqHnfM6RzkhLGujrfb3Z1HRfV2pAACGQ5rG9cu8VCs4mwoST3KDgEAAwIAA3kAAzsE',
  enemy_15: 'AgACAgQAAxkBAAFLSyJqHnfR4NYMc7k1b2-4mXGtvtXGvwACHA5rG9cu8VADzXOayJiFywEAAwIAA3kAAzsE',
  enemy_16: 'AgACAgQAAxkBAAFLSlJqHmrhJfY1Wj-C6EWwLtUji89L-gACHw5rG9cu8VDW58I6lJQeUAEAAwIAA3kAAzsE',
  enemy_17: 'AgACAgQAAxkBAAFLSyZqHnfYItP50qKItse3xZoQcZ4KsQACIA5rG9cu8VDjCYVQlYx3rAEAAwIAA3kAAzsE',
  enemy_18: 'AgACAgQAAxkBAAFLSyhqHnfbTDLU7fkx7pkL1rluvaomGgACIQ5rG9cu8VChzapOshW9iAEAAwIAA3gAAzsE',
  enemy_19: 'AgACAgQAAxkBAAFLSypqHnffUNm8mP5LZKXtwKXqGQABDeUAAiMOaxvXLvFQbfX5VCVMzBsBAAMCAAN5AAM7BA',

  // سلاح‌ها
  weapon_20: 'AgACAgQAAxkBAAFLSyxqHnfiScCa6n7SSr-TUE_yw9lIkQACJA5rG9cu8VDbOWJfDQIE4gEAAwIAA3kAAzsE',
  weapon_21: 'AgACAgQAAxkBAAFLSzBqHnflu7-Lp2SPalHlTdHDK3eFhQACJQ5rG9cu8VAbTihb2W-hPAEAAwIAA3kAAzsE',
  weapon_22: 'AgACAgQAAxkBAAFLSzJqHnfpJBGe2FRTaEi8_iqPpeA7IgACJg5rG9cu8VBn3zzmqnHxPQEAAwIAA3kAAzsE',
  weapon_23: 'AgACAgQAAxkBAAFLSzRqHnft1ujW57MqiHB_hx7A_CiMFgACJw5rG9cu8VCmfJSh1EBa2AEAAwIAA3kAAzsE',
  weapon_24: 'AgACAgQAAxkBAAFLSzZqHnf22GCx_DP7IXCpsdSi2dsnMAACKA5rG9cu8VBvSOa-_UcOYAEAAwIAA3gAAzsE',
  weapon_25: 'AgACAgQAAxkBAAFLSzhqHnf7WGDdt2N7GOqkoHQnyljPCQACKQ5rG9cu8VAhub2aydz7QgEAAwIAA3kAAzsE',
  weapon_26: 'AgACAgQAAxkBAAFLSzpqHnf_cnSJZ7G486XfIDOlaziiCQACKg5rG9cu8VADqaTs9Uo2kAEAAwIAA3kAAzsE',
  weapon_27: 'AgACAgQAAxkBAAFLSzxqHngClWspD9VFYdbDywQN_N-v1QACKw5rG9cu8VAzCHaFjgKtYwEAAwIAA3kAAzsE',

  // زره‌ها
  armor_28: 'AgACAgQAAxkBAAFLSz5qHngGwFDl5ux1g-_R7baXDXFz3AACLA5rG9cu8VBXsWyzJxgNGgEAAwIAA3kAAzsE',
  armor_29: 'AgACAgQAAxkBAAFLS0BqHngL_Mv7-zBPnJwEATmmReZWgQACLQ5rG9cu8VAUu0xsyvBqGAEAAwIAA3kAAzsE',
  armor_30: 'AgACAgQAAxkBAAFLS0JqHngQL_T8kEt7AWT7986XmBycBwACLg5rG9cu8VBwjXL0AAGTRaABAAMCAAN4AAM7BA',
  armor_31: 'AgACAgQAAxkBAAFLS0RqHngTR8X1wErIcl2WyGv8dFtmxgACLw5rG9cu8VADWREpUhvdqQEAAwIAA3gAAzsE',
  armor_32: 'AgACAgQAAxkBAAFLS0ZqHngWQ4CBq7DUTQe4Jgq5uzjdewACMA5rG9cu8VD1gKfx4hi3DQEAAwIAA3kAAzsE',
  armor_33: 'AgACAgQAAxkBAAFLS0hqHngajanzWBiBDdiKmSN3w5UU_AACMQ5rG9cu8VBbFV4el1twtAEAAwIAA3gAAzsE',

  // غذاها
  food_34: 'AgACAgQAAxkBAAFLS0pqHnggWKIn7jjdblEhWzvO0AOEogACMg5rG9cu8VClWhrIy_MWUQEAAwIAA3kAAzsE',
  food_35: 'AgACAgQAAxkBAAFLS0xqHngjusu3h0HVCuwa5Qx0Rxz7YAACMw5rG9cu8VDFVQ9VeH8q8AEAAwIAA3gAAzsE',
  food_36: 'AgACAgQAAxkBAAFLS05qHngnl0e1aWohqvIofwclPuxALwACNA5rG9cu8VCgAgZEvP789QEAAwIAA3kAAzsE',
  food_37: 'AgACAgQAAxkBAAFLS1BqHngstB2j7AsgAAHHbglafyXsM8wAAjUOaxvXLvFQ7ZVtOvkGxAEBAAMCAAN4AAM7BA',
  food_38: 'AgACAgQAAxkBAAFLS1JqHngvEzhh0yneR44XOy6xep8dTgACNg5rG9cu8VCpCd1UYHzy1AEAAwIAA3gAAzsE',
  food_39: 'AgACAgQAAxkBAAFLS1RqHngzXG081SzYgTU8TCcVegLK0AACNw5rG9cu8VDfCJLaVW3VnAEAAwIAA3gAAzsE',
  food_40: 'AgACAgQAAxkBAAFLS1ZqHng3EKj4Q4tOTn6eF8frLflDwgACOA5rG9cu8VDrwMEKj-DCsAEAAwIAA3kAAzsE',
  food_41: 'AgACAgQAAxkBAAFLS1hqHng8jHj7slRLhyrXPKAyRN9QsQACOQ5rG9cu8VDY_zS7EmWqkgEAAwIAA3kAAzsE',
  food_42: 'AgACAgQAAxkBAAFLS1pqHnhBCc7n1FhpxgABG3gkjS7bhE4AAjoOaxvXLvFQwVftUMlzhg8BAAMCAAN4AAM7BA',
  food_43: 'AgACAgQAAxkBAAFLS1xqHnhG5lIfarK8tO_lZ-11QPHKbgACOw5rG9cu8VD08GWQvyuanAEAAwIAA3kAAzsE',

  // نوشیدنی‌ها
  drink_44: 'AgACAgQAAxkBAAFLS15qHnhJ_-v3YhU7MhqQ_yd0zrtMxQACPA5rG9cu8VBIH5YOSz5PHwEAAwIAA3gAAzsE',
  drink_45: 'AgACAgQAAxkBAAFLS2FqHniK822La6My-wr7OD9zHJbwxAACPQ5rG9cu8VBJW0bAmLDfrgEAAwIAA3gAAzsE',
  drink_46: 'AgACAgQAAxkBAAFLS2NqHniPHBtXqGE1diPtRcpJGEHiwwACQA5rG9cu8VDWjtwJKCIbVQEAAwIAA3gAAzsE',
  drink_47: 'AgACAgQAAxkBAAFLS2VqHniclSmMxaarh__dadqYKZ_S-QACQw5rG9cu8VAlZFDTwh6LoAEAAwIAA3kAAzsE',
  drink_48: 'AgACAgQAAxkBAAFLS2dqHnijd_uqW424_x_INrMEPfi2BgACSw5rG9cu8VADiwQ9QNsRRAEAAwIAA3gAAzsE',
  drink_49: 'AgACAgQAAxkBAAFLS2hqHnijRNXwutyBobQoN1mSSLcAAbkAAlUOaxvXLvFQPXZMb2ncjSMBAAMCAAN5AAM7BA',

  // بناها
  build_50: 'AgACAgQAAxkBAAFLS2lqHnijdvK2x9KbPBaeGX120T5BkgACVg5rG9cu8VAW1H_gJMdFgQEAAwIAA3kAAzsE',
  build_51: 'AgACAgQAAxkBAAFLS2pqHnijtbziqnYhjB7BYlxoDPKu1gACVw5rG9cu8VAJgE-ZdGcKcwEAAwIAA3gAAzsE',
  build_52: 'AgACAgQAAxkBAAFLS2tqHnik02Y66qKevXxaRi_Ei3Qf9gACWA5rG9cu8VC3XiZsJpQeVgEAAwIAA3gAAzsE',
  build_53: 'AgACAgQAAxkBAAFLS3FqHnilp_FrUlhr0dfH63AYk-TvzAACWQ5rG9cu8VA6w1aSYxW88wEAAwIAA3gAAzsE',
  build_54: 'AgACAgQAAxkBAAFLS3NqHnipxP3pgGv8_pmGeVjqOJYIRAACWg5rG9cu8VAbhsmD-3pnfwEAAwIAA3gAAzsE',

  // درمانگاه‌ها
  clinic_55: 'AgACAgQAAxkBAAFLS3VqHnit8UruN93dIukl9BnguMXouAACWw5rG9cu8VDBMxmJzGASBQEAAwIAA3kAAzsE',
  clinic_56: 'AgACAgQAAxkBAAFLS3dqHniwhbSlGCX1RzIj4WAQxDZuYQACXA5rG9cu8VAOR4QbrrVTfwEAAwIAA3kAAzsE',
  clinic_57: 'AgACAgQAAxkBAAFLS3lqHni0Hk9r4_tBmw2RK6wYB4GqxgACXQ5rG9cu8VA7Kn4hYMGoiQEAAwIAA3kAAzsE',

  // مکان‌ها
  place_58: 'AgACAgQAAxkBAAFLS3tqHni6LxUbmOFe_2Diymn2zZ8TBgACXg5rG9cu8VDliUFh-bywOQEAAwIAA3gAAzsE',
  place_59: 'AgACAgQAAxkBAAFLS3tqHni6LxUbmOFe_2Diymn2zZ8TBgACXg5rG9cu8VDliUFh-bywOQEAAwIAA3gAAzsE',
  place_60: 'AgACAgQAAxkBAAFLS39qHnjCBEj-gqs9k8HEMU39EI7JLQACYQ5rG9cu8VDPeVcMLHOmowEAAwIAA3gAAzsE',
};

// ==================== دیتابیس ====================
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { users: {}, clans: {} };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) { return { users: {}, clans: {} }; }
}

function saveDB(data) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
}

let db = loadDB();

// ==================== توابع کمکی ====================
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function parseArgs(t) { return t.trim().split(/\s+/); }
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
  gather: 120000, fight: 180000, boss: 600000, pray: 21600000, pvp: 300000
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

// ==================== داده‌های بازی ====================
const RES = {
  wood: { n: 'چوب', e: '🪵' }, stone: { n: 'سنگ', e: '🪨' }, metal: { n: 'فلز', e: '🔩' },
  iron: { n: 'آهن', e: '⛓️' }, gold: { n: 'طلا', e: '🥇' }, toman: { n: 'تومن', e: '💵' }
};

const WEAPONS = {
  none: { n: '❌ بدون سلاح', p: 0, price: 0, lvl: 0 },
  stick: { n: '🪵 چوب دستی', p: 2, price: 20, lvl: 1 },
  knife: { n: '🔪 خنجر سهراب', p: 5, price: 80, lvl: 2 },
  pistol: { n: '🏹 تیر و کمان زال', p: 10, price: 220, lvl: 3 },
  axe: { n: '🪓 تبر فریدون', p: 14, price: 350, lvl: 4 },
  rifle: { n: '🔱 نیزه گیو', p: 18, price: 500, lvl: 5 },
  machinegun: { n: '🏹 کمان آرش', p: 22, price: 800, lvl: 7 },
  grenade: { n: '🔥 گرز گاوسر', p: 28, price: 1200, lvl: 6 },
  sniper: { n: '⚔️ شمشیر رستم', p: 35, price: 2000, lvl: 9 },
  sword: { n: '🗡️ ذوالفقار', p: 50, price: 3000, lvl: 10 },
};

const ARMORS = {
  none: { n: '❌ بدون زره', d: 0, price: 0, lvl: 0 },
  armor_wood: { n: '🪵 سپر چوبی', d: 3, price: 50, lvl: 1 },
  armor_leather: { n: '🐄 چرم سکایی', d: 7, price: 150, lvl: 3 },
  armor_iron: { n: '⛓️ زره هخامنشی', d: 12, price: 400, lvl: 5 },
  armor_gold: { n: '🥇 زره ساسانی', d: 18, price: 800, lvl: 8 },
  armor_dragon: { n: '🐉 ببر بیان (رستم)', d: 25, price: 2000, lvl: 12 },
};

const FOODS = {
  bread: { n: '🍞 نان روغنی', h: 30, price: 10 },
  meat: { n: '🍖 کباب شکار', h: 50, price: 25 },
  fish: { n: '🐟 ماهی', h: 25, price: 15 },
  chicken: { n: '🍗 ماکیان بریان', h: 45, price: 30 },
  steak: { n: '🥩 گوشت بره', h: 70, price: 50 },
  pizza: { n: '🍕 نون پنیر سبزی', h: 80, price: 65 },
  burger: { n: '🍔 کباب ترکی', h: 60, price: 40 },
  stew: { n: '🥘 آبگوشت', h: 55, price: 35 },
  noodle: { n: '🍜 آش رشته', h: 35, price: 20 },
  cake: { n: '🍰 باقلوا', h: 25, heal: 20, price: 45 },
  honey: { n: '🍯 انگبین', h: 20, heal: 30, price: 55 },
};

const DRINKS = {
  water: { n: '💧 آب چشمه', t: 40, price: 8 },
  juice: { n: '🧃 شربت آلبالو', t: 50, price: 20 },
  soda: { n: '🍺 دوغ', t: 25, price: 10 },
  tea: { n: '🍵 چای بهارنارنج', t: 35, price: 12 },
  coffee: { n: '☕ قهوه ترک', t: 30, xp: 10, price: 35 },
  milk: { n: '🥛 شیر میش', t: 45, price: 15 },
};

const HOME_UP = {
  2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, nl: 3 },
  3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, nl: 5 },
  4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, nl: 8 },
  5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, nl: 12 },
};

const ANIMALS = [
  { n: '🐺 گرگ تورانی', t: 'animal', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8 },
  { n: '🐗 گراز مازندران', t: 'animal', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10 },
  { n: '🦊 شغال دشتی', t: 'animal', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12 },
  { n: '🐻 خرس البرز', t: 'animal', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15 },
];

const DEMONS = [
  { n: '👹 دیو سفید', t: 'demon', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18 },
  { n: '👺 دیو سیاه', t: 'demon', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22 },
  { n: '👾 اکوان دیو', t: 'demon', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28 },
];

const BOSSES = [
  { n: '🐉 ضحاک (اژدهای دماوند)', t: 'boss', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, ml: 8 },
  { n: '🦅 سیمرغ', t: 'boss', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, ml: 10 },
  { n: '👹 دیو سپید (بزرگ)', t: 'boss', p: 65, loss: [50,100], rew: { gold: 1500, dragon_scale: 3, phoenix_feather: 3, gem: 15 }, xp: 250, ml: 15 },
];

// ==================== مدیریت کاربر ====================
function newUser(id, name) {
  return {
    id: String(id), name: name || 'ناشناس', lvl: 1, xp: 0,
    hp: 100, maxHp: 300, hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100,
    homeLvl: 1, clinicLvl: 1, weapon: 'none', armor: 'none', clan: null,
    skills: { g: 0, h: 0, c: 0, s: 0 }, sp: 0,
    res: { wood: 20, stone: 20, metal: 20, iron: 20, gold: 30, toman: 20 },
    items: { bandage: 1, medkit: 0, soup: 0, herb: 0, elixir: 0, bread: 2, meat: 0, fish: 0, water: 2, juice: 0, soda: 0, tea: 0, coffee: 0, milk: 0, honey: 0, cake: 0, noodle: 0, stew: 0, pizza: 0, steak: 0, chicken: 0, burger: 0, gem: 0, map: 0, fuel: 0, dragon_scale: 0, phoenix_feather: 0 },
    wOwned: { none: true }, aOwned: { none: true },
    cooldowns: {}, daily: {}, stats: { gath: 0, fw: 0, dw: 0, bw: 0, pw: 0, pl: 0 },
    pending: null, joined: new Date().toISOString(), logins: 1,
  };
}

function ensureUser(id, name) {
  const uid = String(id);
  if (!db.users[uid]) { db.users[uid] = newUser(uid, name); saveDB(db); return db.users[uid]; }
  const u = db.users[uid];
  if (name && name !== u.name) u.name = name;
  u.logins = (u.logins || 0) + 1;
  u.lastLogin = new Date().toISOString();
  norm(u); saveDB(db); return u;
}

function norm(u) {
  u.lvl = u.lvl || 1; u.xp = u.xp || 0;
  u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 300;
  u.hunger = u.hunger ?? 100; u.maxHunger = u.maxHunger || 100;
  u.thirst = u.thirst ?? 100; u.maxThirst = u.maxThirst || 100;
  u.homeLvl = u.homeLvl || 1; u.clinicLvl = u.clinicLvl || 1;
  u.weapon = u.weapon || 'none'; u.armor = u.armor || 'none';
  u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0 }; u.sp = u.sp || 0;
  u.res = u.res || {}; u.items = u.items || {};
  u.wOwned = u.wOwned || { none: true }; u.aOwned = u.aOwned || { none: true };
  u.cooldowns = u.cooldowns || {}; u.daily = u.daily || {};
  u.stats = u.stats || {}; u.pending = u.pending || null; u.clan = u.clan || null;
  for (const k of Object.keys(RES)) { if (typeof u.res[k] !== 'number') u.res[k] = 0; }
  const allItems = [...Object.keys(FOODS), ...Object.keys(DRINKS), 'bandage', 'medkit', 'soup', 'herb', 'elixir', 'gem', 'map', 'fuel', 'dragon_scale', 'phoenix_feather'];
  for (const k of allItems) { if (typeof u.items[k] !== 'number') u.items[k] = 0; }
  u.wOwned.none = true; u.aOwned.none = true;
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
  const p = [];
  for (const [k, v] of Object.entries(rew)) {
    if (RES[k]) p.push(`${RES[k].e} ${v}`);
    else if (FOODS[k]) p.push(`${v}x ${FOODS[k].n}`);
    else if (HEAL_ITEMS[k]) p.push(`${v}x ${HEAL_ITEMS[k].n}`);
    else p.push(`${v}x ${k}`);
  }
  return p.join(' | ') || 'ندارد';
}

const HEAL_ITEMS = {
  bandage: { n: '🩹 باند', heal: 15, price: 25 },
  medkit: { n: '💊 جعبه کمک', heal: 40, price: 80 },
  soup: { n: '🍲 سوپ', heal: 10, hunger: 20, price: 18 },
  herb: { n: '🌿 گیاه', heal: 20, price: 35 },
  elixir: { n: '🧪 اکسیر', heal: 100, price: 200 },
};

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
  return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]);
}

// ==================== استارت ====================
bot.start(async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const isNew = u.logins === 1;
  const text = isNew
    ? `🏕️ ${u.name}، به دنیای بقا خوش اومدی!\n\n🎁 هدیه شروع:\n🪵۲۰ 🪨۲۰ 🥇۳۰ 🩹۱ 🍞۲ 💧۲`
    : `🏕️ ${u.name}، خوش برگشتی!\n🎚️ لول: ${u.lvl} | ❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.res.gold} طلا`;
  await ctx.replyWithPhoto(IMG.place_58, { caption: text, ...mainMenu() });
});

// ==================== وضعیت ====================
bot.action('status', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const a = ARMORS[u.armor] || ARMORS.none;
  const text = `👤 ${u.name} | 🎚️ لول ${u.lvl}\n❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}\n🍞 ${Math.floor(u.hunger)} | 💧 ${Math.floor(u.thirst)}\n⚔️ ${w.n} | 🛡️ ${a.n}\n🏠 ${u.homeLvl} | 🏥 ${u.clinicLvl}\n⭐ ${u.sp || 0} امتیاز | ⚔️PvP: 🏆${u.stats.pw||0} 💀${u.stats.pl||0}\n🥇 ${u.res.gold} طلا`;
  await ctx.replyWithPhoto(IMG.place_58, { caption: text, ...backBtn() });
});

// ==================== جستجو ====================
bot.action('gather', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'gather', CD.gather);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u, 'gather');
  const found = { wood: rnd(2,5), stone: rnd(1,3), gold: rnd(2,8) }[rnd(0,2)] ? { wood: rnd(2,5), stone: rnd(1,3) } : { gold: rnd(5,12) };
  const roll = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { metal: 1, stone: 2 }, { wood: 4 }, { gold: 10 }][rnd(0,4)];
  giveReward(u, roll);
  u.stats.gath = (u.stats.gath || 0) + 1;
  let extra = '';
  if (Math.random() < 0.3) { const f = ['bread','fish','water','meat'][rnd(0,3)]; addItem(u, f, 1); extra = `\n🍽️ ${FOODS[f]?.n || f} هم پیدا شد!`; }
  saveDB(db);
  await ctx.replyWithPhoto(IMG.place_59, { caption: `🪓 جستجو...\n🎁 ${rwText(roll)}${extra}`, ...backBtn() });
});

// ==================== مبارزه ====================
bot.action('fight_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'fight', CD.fight);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: '⚔️ میدون نبرد\nحریف انتخاب کن:', ...Markup.inlineKeyboard([
    [Markup.button.callback('🐺 حیوانات', 'f_animal'), Markup.button.callback('👹 دیوان', 'f_demon')],
    [Markup.button.callback('🎲 رندوم', 'f_random'), Markup.button.callback('🔙 بازگشت', 'back_main')],
  ])});
});

bot.action('boss_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'boss', CD.boss);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  const btns = BOSSES.map((b, i) => [Markup.button.callback(`${b.n} (لول ${b.ml}+)`, `f_boss_${i}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await ctx.replyWithPhoto(IMG.enemy_16, { caption: '👹 باس‌های افسانه‌ای', ...Markup.inlineKeyboard(btns) });
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
  u.pending = boss; setCD(u, 'boss'); saveDB(db);
  await ctx.replyWithPhoto(IMG.enemy_16, { caption: `👹 ${boss.n}\n💪 ${boss.p}\n❤️ ${boss.loss[0]}-${boss.loss[1]}\n🎁 ${rwText(boss.rew)}\n⚠️ خطرناک!`, ...Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'f_confirm')], [Markup.button.callback('🏃 فرار', 'back_main')],
  ])});
});

async function fightStart(ctx, pool) {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  const enemy = pool[rnd(0, pool.length - 1)];
  u.pending = enemy; setCD(u, 'fight'); saveDB(db);
  const w = WEAPONS[u.weapon] || WEAPONS.none;
  const pp = u.lvl * 4 + w.p;
  const ch = clamp(50 + (pp - enemy.p) * 4, 10, 90);
  const img = enemy.t === 'demon' ? IMG.div_sefid_1 : IMG.enemy_11;
  await ctx.replyWithPhoto(img, { caption: `⚔️ ${enemy.n}\n💪 ${enemy.p}\n❤️ ${enemy.loss[0]}-${enemy.loss[1]}\n🎁 ${rwText(enemy.rew)}\n✨ ${enemy.xp} XP\n🛡️ شانس: ${ch}%`, ...Markup.inlineKeyboard([
    [Markup.button.callback('⚔️ حمله!', 'f_confirm')], [Markup.button.callback('🏃 فرار', 'back_main')],
  ])});
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
    if (enemy.t === 'animal') u.stats.fw = (u.stats.fw || 0) + 1;
    else if (enemy.t === 'demon') u.stats.dw = (u.stats.dw || 0) + 1;
    else if (enemy.t === 'boss') u.stats.bw = (u.stats.bw || 0) + 1;
    txt = `⚔️ ${enemy.n}\n✅ پیروزی!\n✨ +${enemy.xp} XP\n❤️ -${dmg} HP\n🎁 ${rwText(enemy.rew)}`;
  } else {
    txt = `⚔️ ${enemy.n}\n❌ شکست!\n❤️ -${dmg} HP`;
  }
  saveDB(db);
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: txt, ...backBtn() });
});

// ==================== PvP ====================
bot.action('pvp_menu', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: `⚔️ PvP\n🏆${u.stats.pw||0} برد | 💀${u.stats.pl||0} باخت\n/pvp [آیدی]\n⏱️ ${formatTime(CD.pvp)}`, ...backBtn() });
});

bot.command('pvp', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.reply('❌ HP صفر');
  const cd = checkCD(u, 'pvp', CD.pvp);
  if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
  const args = parseArgs(ctx.message.text);
  const tid = args[1];
  if (!tid) return ctx.reply('/pvp [آیدی]');
  if (tid === u.id) return ctx.reply('❌ با خودت نه');
  const enemy = db.users[tid];
  if (!enemy) return ctx.reply('❌ پیدا نشد');
  if (enemy.hp <= 0) return ctx.reply('❌ حریف HP صفر');
  const myW = Object.entries(u.wOwned).filter(([k,v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a,b) => b.p - a.p).slice(0,2);
  if (!myW.length) return ctx.reply('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW }; setCD(u, 'pvp'); saveDB(db);
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
  const mp = u.lvl * 4 + Math.max(...myW.map(w => w.p));
  const ep = enemy.lvl * 4 + ew.p;
  const ch = clamp(50 + (mp - ep) * 3, 10, 90);
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: `⚔️ حمله به ${enemy.name}\n👤 حریف: لول ${enemy.lvl}\n⚔️ ${ew.n}\n⚡ ${ep}\n🎲 شانس: ${ch}%\n🗡️ سلاح:`, ...Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'back_main')]]) });
});

bot.action(/pvp_w_(.+)/, async (ctx) => {
  const wk = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending || u.pending.type !== 'pvp') return ctx.answerCbQuery('❌ منقضی');
  u.pending.sw = wk; saveDB(db);
  const w = WEAPONS[wk]; const enemy = db.users[u.pending.eid];
  if (!enemy) return ctx.answerCbQuery('❌');
  const a = ARMORS[u.armor] || ARMORS.none;
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
  const mp = u.lvl * 4 + w.p; const ep = enemy.lvl * 4 + ew.p;
  const ch = clamp(50 + (mp - ep) * 3, 10, 90);
  await ctx.answerCbQuery(`${w.n} انتخاب شد`);
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: `⚔️ حمله به ${enemy.name}\n🗡️ ${w.n} (⚡${w.p})\n🛡️ ${a.n}\n⚡ ${mp}\n👤 حریف: لول ${enemy.lvl}\n⚔️ ${ew.n}\n⚡ ${ep}\n🎲 ${ch}%\n🏠 تخریب: ${Math.floor(ch*0.3)}%\n📦 غارت: ${Math.floor(ch*0.4)}%`, ...Markup.inlineKeyboard([[Markup.button.callback('⚔️ حمله!', 'pvp_atk')], [Markup.button.callback('🏃 انصراف', 'back_main')]]) });
});

bot.action('pvp_atk', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.pending || !u.pending.sw) return ctx.answerCbQuery('❌');
  const eid = u.pending.eid; const wk = u.pending.sw;
  const enemy = db.users[eid]; const aname = u.name;
  u.pending = null;
  if (!enemy) return ctx.reply('❌ حریف نیست', backBtn());
  const w = WEAPONS[wk]; const a = ARMORS[u.armor] || ARMORS.none;
  const ew = WEAPONS[enemy.weapon] || WEAPONS.none; const ea = ARMORS[enemy.armor] || ARMORS.none;
  const mp = u.lvl * 4 + w.p + rnd(0,10); const ep = enemy.lvl * 4 + ew.p + rnd(0,10);
  const ch = clamp(50 + (mp - ep) * 3, 10, 90);
  const win = Math.random() * 100 < ch;
  const raw = rnd(15,40); const md = Math.max(5, raw - a.d); const ed = Math.max(5, raw - ea.d);
  let at, dt, destroyed = false, stolen = 0;
  if (win) {
    u.hp = Math.max(0, u.hp - Math.floor(ed * 0.3)); enemy.hp = Math.max(0, enemy.hp - ed);
    const gr = rnd(30,80); addRes(u, 'gold', gr); addXP(u, rnd(15,35));
    u.stats.pw = (u.stats.pw || 0) + 1; enemy.stats.pl = (enemy.stats.pl || 0) + 1;
    if (Math.random() < 0.1 && enemy.homeLvl > 1) { enemy.homeLvl--; destroyed = true; }
    if (Math.random() < 0.2) { stolen = Math.floor(enemy.res.gold * 0.15); if (stolen > 10) { enemy.res.gold -= stolen; addRes(u, 'gold', stolen); } }
    at = `⚔️ حمله به ${enemy.name}\n✅ بردی!\n❤️ -${Math.floor(ed*0.3)} HP\n🥇 +${gr}\n${destroyed?'🏠 خونه حریف تخریب شد!\n':''}${stolen>0?`📦 +${stolen} طلا غارت!\n`:''}❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${aname} حمله کرد!\n❌ باختی!\n❤️ -${ed} HP\n${destroyed?'🏠 خونه‌ات تخریب شد!\n':''}${stolen>0?`📦 -${stolen} طلا\n`:''}❤️ ${enemy.hp}/${enemy.maxHp}`;
  } else {
    u.hp = Math.max(0, u.hp - md); enemy.hp = Math.max(0, enemy.hp - Math.floor(ed*0.3));
    u.stats.pl = (u.stats.pl || 0) + 1; enemy.stats.pw = (enemy.stats.pw || 0) + 1;
    at = `⚔️ حمله به ${enemy.name}\n❌ باختی!\n❤️ -${md} HP\n❤️ ${u.hp}/${u.maxHp}`;
    dt = `⚔️ ${aname} حمله کرد!\n✅ بردی!\n❤️ -${Math.floor(ed*0.3)} HP\n❤️ ${enemy.hp}/${enemy.maxHp}`;
  }
  saveDB(db);
  try { await bot.telegram.sendPhoto(eid, IMG.enemy_11, { caption: dt, ...Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙 بستن', 'back_main')]]) }); } catch (e) {}
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: at, ...backBtn() });
});

bot.action(/pvp_rev_(.+)/, async (ctx) => {
  const tid = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  const cd = checkCD(u, 'pvp', CD.pvp); if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  const enemy = db.users[tid]; if (!enemy) return ctx.answerCbQuery('❌');
  const myW = Object.entries(u.wOwned).filter(([k,v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a,b) => b.p - a.p).slice(0,2);
  if (!myW.length) return ctx.answerCbQuery('❌ سلاح نداری');
  u.pending = { type: 'pvp', eid: tid, ename: enemy.name, myW }; setCD(u, 'pvp'); saveDB(db);
  const wbtns = myW.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_w_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
  await ctx.replyWithPhoto(IMG.enemy_11, { caption: `⚔️ انتقام از ${enemy.name}!\n🗡️ سلاح:`, ...Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙 بی‌خیال', 'back_main')]]) });
});

bot.command('pvp_top', async (ctx) => {
  const users = Object.values(db.users).filter(u => (u.stats.pw || 0) > 0).sort((a,b) => (b.stats.pw||0) - (a.stats.pw||0)).slice(0,10);
  if (!users.length) return ctx.reply('❌ هنوز PvP نشده');
  let txt = '🏆 برترین مبارزان:\n\n';
  users.forEach((u,i) => txt += `${i+1}. ${u.name||'?'} | 🏆${u.stats.pw||0} برد | 💀${u.stats.pl||0} باخت | لول ${u.lvl}\n`);
  await ctx.reply(txt, backBtn());
});

// ==================== خانه ====================
bot.action('home', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const next = HOME_UP[u.homeLvl + 1];
  let upInfo = '🏆 حداکثر';
  if (next) upInfo = `⬆️ ارتقا به ${u.homeLvl+1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nلول: ${next.nl}`;
  const imgs = [IMG.build_50, IMG.build_51, IMG.build_52, IMG.build_53, IMG.build_54];
  await ctx.replyWithPhoto(imgs[Math.min(u.homeLvl-1, 4)] || IMG.build_50, { caption: `🏠 خانه لول ${u.homeLvl}\n${upInfo}`, ...Markup.inlineKeyboard([[Markup.button.callback('⬆️ ارتقا', 'up_home')], [Markup.button.callback('🔙 بازگشت', 'back_main')]]) });
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
  saveDB(db);
  await ctx.answerCbQuery(`✅ لول ${u.homeLvl}!`);
  const imgs = [IMG.build_50, IMG.build_51, IMG.build_52, IMG.build_53, IMG.build_54];
  await ctx.replyWithPhoto(imgs[Math.min(u.homeLvl-1, 4)] || IMG.build_50, { caption: `🏠 خانه لول ${u.homeLvl} ارتقا یافت!`, ...backBtn() });
});

// ==================== درمانگاه ====================
bot.action('clinic', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.clinicLvl || u.clinicLvl < 1) u.clinicLvl = 1;
  const healAmt = 20 + u.clinicLvl * 10;
  const imgs = [IMG.clinic_55, IMG.clinic_56, IMG.clinic_57];
  await ctx.replyWithPhoto(imgs[Math.min(u.clinicLvl-1, 2)] || IMG.clinic_55, { caption: `🏥 درمانگاه لول ${u.clinicLvl}\n❤️ ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}\n💊 رایگان: ${u.daily.fh ? '❌' : '✅'} (+${healAmt}HP)\n💰 کامل: ۲۰ طلا`, ...Markup.inlineKeyboard([[Markup.button.callback('🆓 رایگان', 'hl_free'), Markup.button.callback('💰 کامل', 'hl_gold')], [Markup.button.callback('🔙 بازگشت', 'back_main')]]) });
});

bot.action('hl_free', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.daily.fh) return ctx.answerCbQuery('❌ استفاده شده');
  const amt = 20 + (u.clinicLvl || 1) * 10;
  u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB(db);
  await ctx.answerCbQuery(`✅ +${amt} HP`);
  await ctx.reply(`✅ +${amt} HP\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.action('hl_gold', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (u.res.gold < 20) return ctx.answerCbQuery('❌ ۲۰ طلا');
  addRes(u, 'gold', -20); u.hp = u.maxHp; saveDB(db);
  await ctx.answerCbQuery('✅ درمان کامل');
  await ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

// ==================== بازار ====================
bot.action('shop', async (ctx) => {
  await ctx.replyWithPhoto(IMG.place_60, { caption: '🛒 بازار بزرگ', ...Markup.inlineKeyboard([
    [Markup.button.callback('📦 منابع', 'sh_res'), Markup.button.callback('🍽️ غذا', 'sh_food')],
    [Markup.button.callback('🧰 آیتم', 'sh_item'), Markup.button.callback('⚔️ سلاح', 'sh_wep')],
    [Markup.button.callback('🛡️ زره', 'sh_arm'), Markup.button.callback('💰 فروش', 'sh_sell')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ])});
});

// ==================== غذا ====================
bot.action('eat_menu', async (ctx) => {
  await ctx.reply('🍽️ سفره ایرانی', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان روغنی', 'e_bread'), Markup.button.callback('🍖 کباب شکار', 'e_meat')],
    [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
    [Markup.button.callback('🥩 گوشت بره', 'e_steak'), Markup.button.callback('🍕 نون پنیر', 'e_pizza')],
    [Markup.button.callback('🍔 کباب ترکی', 'e_burger'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
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
  const food = FOODS[k] || HEAL_ITEMS[k]; if (!food) return ctx.answerCbQuery('❌');
  addItem(u, k, -1);
  if (food.h) u.hunger = Math.min(u.maxHunger, u.hunger + food.h);
  if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal);
  saveDB(db); await ctx.answerCbQuery(`✅ ${food.n} خورده شد`);
});

bot.action(/d_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if ((u.items[k] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
  const drink = DRINKS[k]; if (!drink) return ctx.answerCbQuery('❌');
  addItem(u, k, -1);
  if (drink.t) u.thirst = Math.min(u.maxThirst, u.thirst + drink.t);
  if (drink.xp) addXP(u, drink.xp);
  saveDB(db); await ctx.answerCbQuery(`✅ ${drink.n} نوشیده شد`);
});

// ==================== اسلحه‌خانه ====================
bot.action('armory', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => [Markup.button.callback(`${u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''}`, u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await ctx.replyWithPhoto(IMG.weapon_20, { caption: `🛠️ اسلحه‌خانه\nفعلی: ${WEAPONS[u.weapon]?.n || 'ندارد'}`, ...Markup.inlineKeyboard(btns) });
});

bot.action(/cr_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const w = WEAPONS[k]; if (!w) return ctx.answerCbQuery('❌');
  if (u.lvl < w.lvl) return ctx.answerCbQuery(`❌ لول ${w.lvl} لازمه`);
  if (u.res.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} طلا`);
  addRes(u, 'gold', -w.price); u.wOwned[k] = true; saveDB(db);
  await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.wOwned[k]) return ctx.answerCbQuery('❌ نداری');
  u.weapon = k; saveDB(db); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n} تجهیز شد`);
});

// ==================== زره‌خانه ====================
bot.action('armor_shop', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const btns = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => [Markup.button.callback(`${u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''}`, u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`)]);
  btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  await ctx.replyWithPhoto(IMG.armor_28, { caption: `🛡️ زره‌خانه\nفعلی: ${ARMORS[u.armor]?.n || 'ندارد'}`, ...Markup.inlineKeyboard(btns) });
});

bot.action(/cr_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const a = ARMORS[k]; if (!a) return ctx.answerCbQuery('❌');
  if (u.lvl < a.lvl) return ctx.answerCbQuery(`❌ لول ${a.lvl} لازمه`);
  if (u.res.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} طلا`);
  addRes(u, 'gold', -a.price); u.aOwned[k] = true; saveDB(db);
  await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
  const k = ctx.match[1]; const u = ensureUser(ctx.from.id, ctx.from.first_name);
  if (!u.aOwned[k]) return ctx.answerCbQuery('❌ نداری');
  u.armor = k; saveDB(db); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n} تجهیز شد`);
});

// ==================== آتشکده (آرامگاه) ====================
bot.action('aramgah', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  await ctx.replyWithPhoto(IMG.place_60, { caption: '🕯️ آتشکده آذر\nنور الهی...', ...Markup.inlineKeyboard([
    [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
    [Markup.button.callback('📖 روضه', 'p_rozeh')], [Markup.button.callback('🔙 بازگشت', 'back_main')],
  ])});
});

bot.action(['p_dua', 'p_namaz', 'p_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const cd = checkCD(u, 'pray', CD.pray);
  if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
  setCD(u, 'pray'); const xpG = u.lvl <= 3 ? 60 : 30; addXP(u, xpG); saveDB(db);
  const names = { p_dua: 'دعا', p_namaz: 'نماز', p_rozeh: 'روضه' };
  await ctx.answerCbQuery(`✨ +${xpG} XP`);
  await ctx.reply(`✅ ${names[ctx.match[0]]} قبول باشه!\n✨ +${xpG} XP\n🎚️ لول: ${u.lvl}`, backBtn());
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
  u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB(db);
  await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name);
  const args = parseArgs(ctx.message.text); const k = args[1];
  if (!['g','h','c','s'].includes(k)) return ctx.reply('❌ g, h, c, s');
  if (!u.sp || u.sp <= 0) return ctx.reply('❌ امتیاز نداری');
  if ((u.skills[k] || 0) >= 10) return ctx.reply('❌ حداکثر');
  u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB(db);
  await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`, backBtn());
});

// ==================== راهنما ====================
bot.action('guide', async (ctx) => {
  await ctx.reply(`📖 راهنما\n🪓 جستجو: ${formatTime(CD.gather)}\n⚔️ مبارزه: ${formatTime(CD.fight)}\n👹 باس: ${formatTime(CD.boss)}\n⚔️ PvP: ${formatTime(CD.pvp)}\n🕯️ آتشکده: ${formatTime(CD.pray)}`, backBtn());
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
  await ctx.replyWithPhoto(IMG.place_58, { caption: '🏕️ منوی اصلی', ...mainMenu() });
});

// ==================== ادمین ====================
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const users = Object.values(db.users).sort((a,b) => b.lvl - a.lvl).slice(0,10);
  let txt = `👥 ${Object.keys(db.users).length} کاربر\n🏆 برتر:\n`;
  users.forEach((u,i) => txt += `${i+1}. ${u.name||'?'} | لول ${u.lvl} | 🥇${u.res.gold}\n`);
  await ctx.reply(txt);
});

bot.command('admin_give', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = parseArgs(ctx.message.text);
  const u = ensureUser(args[1], '');
  if (args[2] === 'resource') addRes(u, args[3], Number(args[4]||0));
  else if (args[2] === 'item') addItem(u, args[3], Number(args[4]||0));
  else if (args[2] === 'weapon') u.wOwned[args[3]] = true;
  else if (args[2] === 'armor') u.aOwned[args[3]] = true;
  else if (args[2] === 'xp') addXP(u, Number(args[4]||0));
  saveDB(db); await ctx.reply('✅');
});

bot.command('admin_full', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const u = ensureUser(parseArgs(ctx.message.text)[1], '');
  for (const k of Object.keys(RES)) u.res[k] = 9999;
  for (const k of Object.keys(WEAPONS)) u.wOwned[k] = true;
  for (const k of Object.keys(ARMORS)) u.aOwned[k] = true;
  u.weapon = 'sword'; u.armor = 'armor_dragon'; u.lvl = 20; u.hp = u.maxHp = 500;
  u.sp = 40; u.homeLvl = 5; u.clinicLvl = 3; saveDB(db); await ctx.reply('✅');
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true }).then(() => console.log('✅ ربات بقا - نسخه شاهنامه اجرا شد!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));