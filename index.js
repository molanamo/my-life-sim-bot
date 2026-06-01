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
  // منوها
  main: 'AgACAgQAAxkBAAFLQ1hqHeE5_2DNtv-c7vXNvlvDzcU2fQACfQ5rG1tF6FB44iYU1s4wDAEAAwIAA3kAAzsE',
  gather: 'AgACAgQAAxkBAAFLQ1lqHeE5nuotPpVTda4Zp_HcAAEvxiAAAn4OaxtbRehQbyq4FMe8AVcBAAMCAAN5AAM7BA',
  fight: 'AgACAgQAAxkBAAFLQ1pqHeE5INNW8pvgTy_zL6hot6hnDgACfw5rG1tF6FDAnH2qKREROgEAAwIAA3kAAzsE',
  demon: 'AgACAgQAAxkBAAFLQ1tqHeE5UWQ36gJJA3rlpAJ_a-9GUQACgA5rG1tF6FADpSgH2lpXxAEAAwIAA3kAAzsE',
  shop: 'AgACAgQAAxkBAAFLQ1xqHeE57-7UwtrxoAue33Tj8qZ2ygACgQ5rG1tF6FDwf9RF0-_aBgEAAwIAA3kAAzsE',
  aramgah: 'AgACAgQAAxkBAAFLQ11qHeE5xKtpYfLlC9iJcm7Xe6DGyAACgg5rG1tF6FDbzuLJ2BC_fQEAAwIAA3kAAzsE',
  dragon: 'AgACAgQAAxkBAAFLQ15qHeE5AaLgMilG1B5C6Amw1JiCYwACgw5rG1tF6FD2QF30YLZcLgEAAwIAA3gAAzsE',
  
  // خونه‌ها
  home1: 'AgACAgQAAxkBAAFLRBlqHepqaxA7774kH5kpgnd9MXGOgwACCBBrG_TM8VBGCtZ4DCEaqQEAAwIAA3gAAzsE',
  home2: 'AgACAgQAAxkBAAFLRCBqHeqZJOftg1hF47Pl_Bz6qUGPmgACCRBrG_TM8VCDe8_1u2ZcsQEAAwIAA3kAAzsE',
  home3: 'AgACAgQAAxkBAAFLRCRqHerMfPlTZDd0By5sEnVSIHwMAgACCxBrG_TM8VAoXbBFiAABb20BAAMCAAN5AAM7BA',
  home4: 'AgACAgQAAxkBAAFLRCpqHer4ca-LuPq121ccDF7f971m5gACDBBrG_TM8VDA4LWWaw7GHAEAAwIAA3kAAzsE',
  home5: 'AgACAgQAAxkBAAFLRCxqHesV-20QaQ-YdW44RtwsogpRjAACDRBrG_TM8VBcA1RS6dU6cwEAAwIAA3kAAzsE',
  
  // درمانگاه‌ها
  clinic1: 'AgACAgQAAxkBAAFLRDRqHes1jzW9ek8zKcepIexXOytTYQACDhBrG_TM8VCMXdTqxtRh1AEAAwIAA3gAAzsE',
  clinic2: 'AgACAgQAAxkBAAFLRDlqHetNmNKl872Hj3XXAAF3Lnck93gAAg8Qaxv0zPFQqR7p5FJTXIIBAAMCAAN5AAM7BA',
  clinic3: 'AgACAgQAAxkBAAFLRD1qHetj2uTCfi2snjLcjw69s0UI8QACEBBrG_TM8VDD8Ib2cGF7twEAAwIAA3gAAzsE',
  
  // اسلحه‌های جدید
  machinegun: 'AgACAgQAAxkBAAFLRD9qHeuEMnvWAiQtE3S9jlK1ypg-6wACERBrG_TM8VCmSk2j7foU-wEAAwIAA3gAAzsE',
  grenade: 'AgACAgQAAxkBAAFLRENqHeumWFysJPqccbO_hqS9YULEmAACEhBrG_TM8VAQUMeQvTFrlAEAAwIAA3kAAzsE',
  sniper: 'AgACAgQAAxkBAAFLRElqHevNnQ_dvkpJE-ifAQt29p9XyQACExBrG_TM8VAzBkI9XUZHFgEAAwIAA3gAAzsE',
  
  // زره‌ها
  armor_wood: 'AgACAgQAAxkBAAFLREtqHev6EAUh9-w1__VDDEzipe2UEgACFBBrG_TM8VACM-SfTM1wvgEAAwIAA3kAAzsE',
  armor_leather: 'AgACAgQAAxkBAAFLRFNqHewl9GHqN596fBI_keFy7vZ-0wACFRBrG_TM8VCQje-7kQABpcgBAAMCAAN5AAM7BA',
  armor_iron: 'AgACAgQAAxkBAAFLRFVqHexJ7Ezk5gF8biUXhZmqC3k3CQACFhBrG_TM8VD4GTipBAABnb4BAAMCAAN5AAM7BA',
  armor_gold: 'AgACAgQAAxkBAAFLRFpqHextRo0xTElC0OpcIF0dxJQMZgACFxBrG_TM8VDsUdEPVS4EtAEAAwIAA3kAAzsE',
  armor_dragon: 'AgACAgQAAxkBAAFLRF5qHeyMZ-FzLnyjLgfGrER-y9NQbAACGBBrG_TM8VDa3YRYik_xlwEAAwIAA3kAAzsE',
  
  // غذاها و نوشیدنی‌ها
  food_soda: 'AgACAgQAAxkBAAFLRG1qHe7qzypgIQkL2EExAfDv4antQgACGhBrG_TM8VCZY4knQ7935AEAAwIAA3gAAzsE',
  food_tea: 'AgACAgQAAxkBAAFLRHJqHe8DRa8AAbzpmdBCSytbVAAB-V3TAAIbEGsb9MzxUGqg2XWKQGoXAQADAgADeAADOwQ',
  food_coffee: 'AgACAgQAAxkBAAFLRHZqHe8XI6WuAAH62s9m0fGWJ74cGoUAAhwQaxv0zPFQNQ5mngki32QBAAMCAAN4AAM7BA',
  food_milk: 'AgACAgQAAxkBAAFLRHpqHe8s-dJKzQIpysaUYbc_q4iTzQACHRBrG_TM8VBBGpqp5iUniAEAAwIAA20AAzsE',
  food_honey: 'AgACAgQAAxkBAAFLRH5qHe89DNLWMNW67slzTw6iBRhULgACHhBrG_TM8VDeto__KVdl5AEAAwIAA3gAAzsE',
  food_cake: 'AgACAgQAAxkBAAFLRIBqHe9QyKYiIt8o_eNMZmOzQx5mDgACHxBrG_TM8VBvgeMm-kroFwEAAwIAA3gAAzsE',
  food_noodle: 'AgACAgQAAxkBAAFLRIJqHe9jKANQj9wjj3w8XgtXHpQMwwACIBBrG_TM8VBaFN-3dq4KrgEAAwIAA20AAzsE',
  food_stew: 'AgACAgQAAxkBAAFLRIRqHe97CJwXqJ0KEbmgcKoDIwnfTQACIRBrG_TM8VAvRPPizAdTsgEAAwIAA3gAAzsE',
  food_pizza: 'AgACAgQAAxkBAAFLRIhqHe-XSgkv912EqWBuOVBXnWzPMQACIhBrG_TM8VCuZsp50gKuFwEAAwIAA3gAAzsE',
  food_steak: 'AgACAgQAAxkBAAFLRJhqHe-2b5Q8M60Tqj1e8gLT865BzgACIxBrG_TM8VACU74DUoH2YQEAAwIAA3gAAzsE',
  food_chicken: 'AgACAgQAAxkBAAFLRJxqHe_GZ0m7oFIri0sInIUeHBoPBwACJBBrG_TM8VBF6Xd629OSpQEAAwIAA3gAAzsE',
  food_burger: 'AgACAgQAAxkBAAFLRJ5qHfADnBKqRGTCL_D1OCx_aIWIUQACJhBrG_TM8VCLqneqT9De1AEAAwIAA3gAAzsE'
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
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function parseArgs(text) { return text.trim().split(/\s+/); }
function isAdmin(id) { return Number(id) === ADMIN_ID; }

function checkCooldown(u, action, cooldownMs) {
  const now = Date.now();
  if (!u.cooldowns) u.cooldowns = {};
  if (!u.cooldowns[action]) return { canDo: true, remaining: 0 };
  const elapsed = now - u.cooldowns[action];
  if (elapsed >= cooldownMs) return { canDo: true, remaining: 0 };
  return { canDo: false, remaining: cooldownMs - elapsed };
}

function formatTime(ms) {
  if (ms <= 0) return '0 ثانیه';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours} ساعت و ${minutes % 60} دقیقه`;
  if (minutes > 0) return `${minutes} دقیقه و ${seconds % 60} ثانیه`;
  return `${seconds} ثانیه`;
}

function progressBar(current, max, length = 10) {
  const filled = Math.floor((current / max) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function setCooldown(u, action) {
  if (!u.cooldowns) u.cooldowns = {};
  u.cooldowns[action] = Date.now();
}

// ==================== کول‌داون‌ها ====================
const COOLDOWNS = {
  gather: 2 * 60 * 1000,
  fight: 3 * 60 * 1000,
  boss: 10 * 60 * 1000,
  pray: 6 * 60 * 60 * 1000,
};

// ==================== ثابت‌ها ====================
const RES_KEYS = ['wood', 'stone', 'metal', 'iron', 'gold', 'toman'];
const RES_LABELS = { wood: '🪵 چوب', stone: '🪨 سنگ', metal: '🔩 فلز', iron: '⛓️ آهن', gold: '🥇 طلا', toman: '💵 تومن' };
const RES_EMOJI = { wood: '🪵', stone: '🪨', metal: '🔩', iron: '⛓️', gold: '🥇', toman: '💵' };

const WEAPONS = {
  none: { name: '❌ بدون سلاح', power: 0, price: 0, sell: 0, level: 0 },
  stick: { name: '🪵 چوب دستی', power: 2, price: 20, sell: 10, level: 1 },
  knife: { name: '🔪 چاقو', power: 5, price: 80, sell: 40, level: 2 },
  pistol: { name: '🔫 تپانچه', power: 10, price: 220, sell: 110, level: 3 },
  axe: { name: '🪓 تبر جنگی', power: 14, price: 350, sell: 175, level: 4 },
  rifle: { name: '🔫 تفنگ شکاری', power: 18, price: 500, sell: 250, level: 5 },
  machinegun: { name: '🔫 مسلسل', power: 22, price: 800, sell: 400, level: 7 },
  grenade: { name: '💣 نارنجک پلاسما', power: 28, price: 1200, sell: 600, level: 6 },
  sniper: { name: '🎯 اسنایپر', power: 35, price: 2000, sell: 1000, level: 9 },
  sword: { name: '⚔️ شمشیر آتشین', power: 25, price: 1000, sell: 500, level: 8 },
  bow: { name: '🏹 کمان افسانه‌ای', power: 30, price: 2000, sell: 1000, level: 10 }
};

const ARMORS = {
  none: { name: '❌ بدون زره', defense: 0, price: 0, sell: 0, level: 0 },
  armor_wood: { name: '🪵 زره چوبی', defense: 3, price: 50, sell: 25, level: 1 },
  armor_leather: { name: '🐄 زره چرمی', defense: 7, price: 150, sell: 75, level: 3 },
  armor_iron: { name: '⛓️ زره آهنی', defense: 12, price: 400, sell: 200, level: 5 },
  armor_gold: { name: '🥇 زره طلایی', defense: 18, price: 800, sell: 400, level: 8 },
  armor_dragon: { name: '🐉 زره اژدها', defense: 25, price: 2000, sell: 1000, level: 12 }
};

const HEAL_ITEMS = {
  bandage: { name: '🩹 باند', heal: 15, price: 25, sell: 12 },
  medkit: { name: '💊 جعبه کمک', heal: 40, price: 80, sell: 40 },
  soup: { name: '🍲 سوپ', heal: 10, hunger: 20, price: 18, sell: 9 },
  herb: { name: '🌿 گیاه', heal: 20, price: 35, sell: 17 },
  elixir: { name: '🧪 اکسیر', heal: 100, price: 200, sell: 100 }
};

const FOOD_ITEMS = {
  bread: { name: '🍞 نان', hunger: 30, price: 10, sell: 5, image: 'main' },
  meat: { name: '🍖 گوشت', hunger: 50, price: 25, sell: 12, image: 'main' },
  fish: { name: '🐟 ماهی', hunger: 25, price: 15, sell: 7, image: 'main' },
  water: { name: '💧 آب', thirst: 40, price: 8, sell: 4, image: 'main' },
  juice: { name: '🧃 آبمیوه', thirst: 50, price: 20, sell: 10, image: 'main' },
  soda: { name: '🍺 نوشابه', thirst: 25, price: 10, sell: 5, image: 'food_soda' },
  tea: { name: '🍵 چای', thirst: 35, price: 12, sell: 6, image: 'food_tea' },
  coffee: { name: '☕ قهوه', thirst: 30, xp: 10, price: 35, sell: 17, image: 'food_coffee' },
  milk: { name: '🥛 شیر', thirst: 45, price: 15, sell: 7, image: 'food_milk' },
  honey: { name: '🍯 عسل', hunger: 20, heal: 30, price: 55, sell: 27, image: 'food_honey' },
  cake: { name: '🍰 کیک', hunger: 25, heal: 20, price: 45, sell: 22, image: 'food_cake' },
  noodle: { name: '🍜 نودل', hunger: 35, price: 20, sell: 10, image: 'food_noodle' },
  stew: { name: '🥘 خورشت', hunger: 55, price: 35, sell: 17, image: 'food_stew' },
  pizza: { name: '🍕 پیتزا', hunger: 80, price: 65, sell: 32, image: 'food_pizza' },
  steak: { name: '🥩 استیک', hunger: 70, price: 50, sell: 25, image: 'food_steak' },
  chicken: { name: '🍗 مرغ کبابی', hunger: 45, price: 30, sell: 15, image: 'food_chicken' },
  burger: { name: '🍔 همبرگر', hunger: 60, price: 40, sell: 20, image: 'food_burger' }
};

const SPECIAL_ITEMS = {
  gem: { name: '💎 سنگ قیمتی', price: 120, sell: 60 },
  map: { name: '🗺️ نقشه', price: 90, sell: 45 },
  fuel: { name: '⛽ سوخت', price: 75, sell: 35 },
  dragon_scale: { name: '🐉 فلس اژدها', price: 500, sell: 250 },
  phoenix_feather: { name: '🦅 پر ققنوس', price: 800, sell: 400 }
};

const SHOP_BUY = {
  wood: { type: 'resource', key: 'wood', name: '🪵 چوب', price: 8 },
  stone: { type: 'resource', key: 'stone', name: '🪨 سنگ', price: 10 },
  metal: { type: 'resource', key: 'metal', name: '🔩 فلز', price: 18 },
  iron: { type: 'resource', key: 'iron', name: '⛓️ آهن', price: 25 },
  bandage: { type: 'item', key: 'bandage', name: '🩹 باند', price: 25 },
  medkit: { type: 'item', key: 'medkit', name: '💊 جعبه کمک', price: 80 },
  soup: { type: 'item', key: 'soup', name: '🍲 سوپ', price: 18 },
  herb: { type: 'item', key: 'herb', name: '🌿 گیاه', price: 35 },
  elixir: { type: 'item', key: 'elixir', name: '🧪 اکسیر', price: 200 },
  bread: { type: 'food', key: 'bread', name: '🍞 نان', price: 10 },
  meat: { type: 'food', key: 'meat', name: '🍖 گوشت', price: 25 },
  fish: { type: 'food', key: 'fish', name: '🐟 ماهی', price: 15 },
  water: { type: 'food', key: 'water', name: '💧 آب', price: 8 },
  juice: { type: 'food', key: 'juice', name: '🧃 آبمیوه', price: 20 },
  soda: { type: 'food', key: 'soda', name: '🍺 نوشابه', price: 10 },
  tea: { type: 'food', key: 'tea', name: '🍵 چای', price: 12 },
  coffee: { type: 'food', key: 'coffee', name: '☕ قهوه', price: 35 },
  milk: { type: 'food', key: 'milk', name: '🥛 شیر', price: 15 },
  honey: { type: 'food', key: 'honey', name: '🍯 عسل', price: 55 },
  cake: { type: 'food', key: 'cake', name: '🍰 کیک', price: 45 },
  noodle: { type: 'food', key: 'noodle', name: '🍜 نودل', price: 20 },
  stew: { type: 'food', key: 'stew', name: '🥘 خورشت', price: 35 },
  pizza: { type: 'food', key: 'pizza', name: '🍕 پیتزا', price: 65 },
  steak: { type: 'food', key: 'steak', name: '🥩 استیک', price: 50 },
  chicken: { type: 'food', key: 'chicken', name: '🍗 مرغ', price: 30 },
  burger: { type: 'food', key: 'burger', name: '🍔 همبرگر', price: 40 },
  stick: { type: 'weapon', key: 'stick', name: '🪵 چوب دستی', price: 20 },
  knife: { type: 'weapon', key: 'knife', name: '🔪 چاقو', price: 80 },
  pistol: { type: 'weapon', key: 'pistol', name: '🔫 تپانچه', price: 220 },
  rifle: { type: 'weapon', key: 'rifle', name: '🔫 تفنگ', price: 500 },
  axe: { type: 'weapon', key: 'axe', name: '🪓 تبر', price: 350 },
  machinegun: { type: 'weapon', key: 'machinegun', name: '🔫 مسلسل', price: 800 },
  grenade: { type: 'weapon', key: 'grenade', name: '💣 نارنجک', price: 1200 },
  sniper: { type: 'weapon', key: 'sniper', name: '🎯 اسنایپر', price: 2000 },
  sword: { type: 'weapon', key: 'sword', name: '⚔️ شمشیر آتشین', price: 1000 },
  bow: { type: 'weapon', key: 'bow', name: '🏹 کمان افسانه‌ای', price: 2000 },
  armor_wood: { type: 'armor', key: 'armor_wood', name: '🪵 زره چوبی', price: 50 },
  armor_leather: { type: 'armor', key: 'armor_leather', name: '🐄 زره چرمی', price: 150 },
  armor_iron: { type: 'armor', key: 'armor_iron', name: '⛓️ زره آهنی', price: 400 },
  armor_gold: { type: 'armor', key: 'armor_gold', name: '🥇 زره طلایی', price: 800 },
  armor_dragon: { type: 'armor', key: 'armor_dragon', name: '🐉 زره اژدها', price: 2000 },
  gem: { type: 'special', key: 'gem', name: '💎 سنگ قیمتی', price: 120 },
  map: { type: 'special', key: 'map', name: '🗺️ نقشه', price: 90 },
  fuel: { type: 'special', key: 'fuel', name: '⛽ سوخت', price: 75 }
};

const HOME_UPGRADES = {
  2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, needLevel: 3 },
  3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, needLevel: 5 },
  4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, needLevel: 8 },
  5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, needLevel: 12 }
};

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
      homeLevel: 1, clinicLevel: 0,
      weapon: 'none', armor: 'none', clan: null,
      skills: { gathering: 0, hunting: 0, crafting: 0, survival: 0 },
      skillPoints: 0,
      resources: { wood: 20, stone: 20, metal: 20, iron: 20, gold: 30, toman: 20 },
      items: { bandage: 1, medkit: 0, soup: 0, herb: 0, elixir: 0, bread: 2, meat: 0, fish: 0, water: 2, juice: 0, soda: 0, tea: 0, coffee: 0, milk: 0, honey: 0, cake: 0, noodle: 0, stew: 0, pizza: 0, steak: 0, chicken: 0, burger: 0, gem: 0, map: 0, fuel: 0, dragon_scale: 0, phoenix_feather: 0 },
      weaponsOwned: { none: true },
      armorsOwned: { none: true },
      cooldowns: {},
      stats: { gather: 0, fight_win: 0, demon_win: 0, boss_win: 0 },
      pendingFight: null,
      joinedAt: new Date().toISOString(),
      totalLogins: 1
    };
    saveDB(db);
    return db.users[uid];
  } else {
    if (name && name !== db.users[uid].name) db.users[uid].name = name;
    const u = db.users[uid];
    u.totalLogins = (u.totalLogins || 0) + 1;
    u.lastLogin = new Date().toISOString();
    normalizeUser(u);
    saveDB(db);
    return u;
  }
}

function normalizeUser(u) {
  u.playerLevel ??= 1; u.playerXP ??= 0;
  u.hp ??= 100; u.maxHp ??= 300;
  u.hunger ??= 100; u.maxHunger ??= 100;
  u.thirst ??= 100; u.maxThirst ??= 100;
  u.homeLevel ??= 1; u.clinicLevel ??= 0;
  u.weapon ??= 'none'; u.armor ??= 'none'; u.clan ??= null;
  u.skills ??= { gathering: 0, hunting: 0, crafting: 0, survival: 0 };
  u.skillPoints ??= 0;
  u.resources ??= {}; u.items ??= {}; 
  u.weaponsOwned ??= { none: true };
  u.armorsOwned ??= { none: true };
  u.cooldowns ??= {};
  u.stats ??= {}; u.pendingFight ??= null;
  
  for (const k of RES_KEYS) if (typeof u.resources[k] !== 'number') u.resources[k] = 0;
  for (const k of [...Object.keys(HEAL_ITEMS), ...Object.keys(FOOD_ITEMS), ...Object.keys(SPECIAL_ITEMS)]) {
    if (typeof u.items[k] !== 'number') u.items[k] = 0;
  }
  u.weaponsOwned.none = true;
  u.armorsOwned.none = true;
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

function hasResources(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'needLevel') continue;
    if ((u.resources[k] || 0) < v) return false;
  }
  return true;
}

function takeResources(u, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'needLevel') continue;
    addResource(u, k, -v);
  }
}

// ==================== منوها ====================
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🪓 جستجو', 'gather')],
    [Markup.button.callback('⚔️ مبارزه', 'fight_menu'), Markup.button.callback('👹 باس', 'boss_menu')],
    [Markup.button.callback('🏠 خانه', 'home'), Markup.button.callback('🏥 درمانگاه', 'clinic')],
    [Markup.button.callback('🛒 فروشگاه', 'shop'), Markup.button.callback('🛠️ اسلحه‌خانه', 'armory_menu')],
    [Markup.button.callback('🛡️ زره‌خانه', 'armory_armor'), Markup.button.callback('🕯️ آرامگاه', 'aramgah')],
    [Markup.button.callback('🍽️ غذا', 'eat_menu'), Markup.button.callback('🏛️ کلن', 'clan')],
    [Markup.button.callback('📖 راهنما', 'guide'), Markup.button.callback('⭐ مهارت', 'skills_menu')],
    [Markup.button.callback('⏱️ زمان‌ها', 'cooldowns')]
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
    const food = ['bread', 'fish', 'water', 'meat'][rnd(0, 3)];
    addItem(u, food, 1);
    roll.food = FOOD_ITEMS[food]?.name || food;
  }
  bumpAction(u, 'gather', 1);
  return roll;
}

function executeCombat(u, enemy) {
  if (u.hp <= 0) return { blocked: true, text: '❌ HP صفر است' };
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const armor = ARMORS[u.armor] || ARMORS.none;
  const playerPower = u.playerLevel * 4 + weapon.power + rnd(0, 8);
  const enemyPower = enemy.power + rnd(0, 10);
  const rawLoss = rnd(enemy.hpLoss[0], enemy.hpLoss[1]);
  const loss = Math.max(1, rawLoss - armor.defense);
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
    return { blocked: false, win: true, loss, xp, text: `⚔️ ${enemy.name}\n✅ پیروزی!\n✨ +${xp} XP\n❤️ -${loss} HP (زره: -${armor.defense})\n🎁 ${rewardText(enemy.rewards)}` };
  }
  return { blocked: false, win: false, loss, text: `⚔️ ${enemy.name}\n❌ شکست!\n❤️ -${loss} HP` };
}

function getHomeImage(level) {
  const key = 'home' + level;
  return IMAGES[key] || IMAGES.main;
}

function getClinicImage(level) {
  const key = 'clinic' + level;
  return IMAGES[key] || IMAGES.clinic1;
}

// ==================== استارت ====================
bot.start((ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const isNew = u.totalLogins === 1;
  
  const text = isNew
    ? `🎉 ${u.name} عزیز، به دنیای بقا خوش اومدی!\n\n🏕️ اینجا باید زنده بمونی، قوی بشی و دنیا رو فتح کنی!\n\n🎁 بسته شروع:\n🪵۲۰ 🪨۲۰ 🥇۳۰ 🩹۱ 🍞۲ 💧۲`
    : `🏕️ ${u.name}، خوش برگشتی!\n\n🎚️ لول: ${u.playerLevel}\n❤️ HP: ${u.hp}/${u.maxHp}\n🥇 طلا: ${u.resources.gold}\n📅 ورود: ${u.totalLogins}بار`;
  
  ctx.replyWithPhoto(IMAGES.main, { caption: text, ...mainMenu() });
});

// ==================== اکشن‌های اصلی ====================
bot.action('status', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const weapon = WEAPONS[u.weapon] || WEAPONS.none;
  const armor = ARMORS[u.armor] || ARMORS.none;
  
  const text = [
    `🏕️ ${u.name}`,
    `🎚️ لول ${u.playerLevel} | XP: ${u.playerXP}/30 ${progressBar(u.playerXP, 30, 6)}`,
    `❤️ HP: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp, 8)}`,
    `🍞 ${Math.floor(u.hunger)}/${u.maxHunger} | 💧 ${Math.floor(u.thirst)}/${u.maxThirst}`,
    `⚔️ ${weapon.name} | 🛡️ ${armor.name}`,
    `🏠 خونه ${u.homeLevel} | 🏥 درمانگاه ${u.clinicLevel || 1}`,
    `⭐ مهارت: ${u.skillPoints || 0} امتیاز`,
    ``,
    `📦 🪵${u.resources.wood} 🪨${u.resources.stone} 🔩${u.resources.metal} ⛓️${u.resources.iron} 🥇${u.resources.gold}`
  ].join('\n');
  
  ctx.replyWithPhoto(IMAGES.main, { caption: text, ...backMenu() });
});

bot.action('gather', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const cd = checkCooldown(u, 'gather', COOLDOWNS.gather);
  if (!cd.canDo) return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه`);
  
  setCooldown(u, 'gather');
  const found = performGather(u);
  saveDB(db);
  
  let text = `🪓 جستجو...\n🎁 ${rewardText(found)}`;
  if (found.food) text += `\n🍽️ ${found.food} هم پیدا شد!`;
  
  ctx.replyWithPhoto(IMAGES.gather, { caption: text, ...backMenu() });
});

bot.action('fight_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const cd = checkCooldown(u, 'fight', COOLDOWNS.fight);
  if (!cd.canDo) return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه`);
  
  ctx.replyWithPhoto(IMAGES.fight, {
    caption: '⚔️ میدون مبارزه\nحریف انتخاب کن:',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🐺 حیوانات', 'fight_type_animal')],
      [Markup.button.callback('👹 دیوها', 'fight_type_demon')],
      [Markup.button.callback('🎲 رندوم', 'fight_type_random')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

bot.action('boss_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const cd = checkCooldown(u, 'boss', COOLDOWNS.boss);
  if (!cd.canDo) return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)} دیگه`);
  
  ctx.replyWithPhoto(IMAGES.dragon, {
    caption: '👹 باس‌های افسانه‌ای',
    ...Markup.inlineKeyboard([
      ...BOSSES.map((b, i) => [Markup.button.callback(`${b.name} (لول ${b.minLevel}+)`, `fight_boss_${i}`)]),
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

bot.action(/fight_type_(.+)/, (ctx) => {
  const type = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
  
  let pool = type === 'animal' ? ANIMALS : type === 'demon' ? DEMONS : [...ANIMALS, ...DEMONS];
  const enemy = pool[rnd(0, pool.length - 1)];
  u.pendingFight = enemy;
  saveDB(db);
  
  ctx.replyWithPhoto(type === 'demon' ? IMAGES.demon : IMAGES.fight, {
    caption: `⚔️ ${enemy.name}\n💪 قدرت: ${enemy.power}\n❤️ آسیب: ${enemy.hpLoss[0]}-${enemy.hpLoss[1]}\n🎁 ${rewardText(enemy.rewards)}\n\nآماده‌ای؟`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
      [Markup.button.callback('🏃 فرار', 'back_main')]
    ])
  });
});

bot.action(/fight_boss_(.+)/, (ctx) => {
  const index = parseInt(ctx.match[1]);
  const boss = BOSSES[index];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!boss) return ctx.answerCbQuery('❌');
  if (u.playerLevel < boss.minLevel) return ctx.answerCbQuery(`❌ لول ${boss.minLevel} لازمه`);
  
  u.pendingFight = boss;
  saveDB(db);
  
  ctx.replyWithPhoto(IMAGES.dragon, {
    caption: `👹 ${boss.name}\n💪 ${boss.power}\n❤️ ${boss.hpLoss[0]}-${boss.hpLoss[1]}\n🎁 ${rewardText(boss.rewards)}\n⚠️ خطرناک!`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⚔️ حمله!', 'fight_confirm')],
      [Markup.button.callback('🏃 فرار', 'back_main')]
    ])
  });
});

bot.action('fight_confirm', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!u.pendingFight) return ctx.answerCbQuery('❌');
  
  const isBoss = u.pendingFight.type === 'boss';
  if (isBoss) setCooldown(u, 'boss');
  else setCooldown(u, 'fight');
  
  const result = executeCombat(u, u.pendingFight);
  u.pendingFight = null;
  saveDB(db);
  
  ctx.replyWithPhoto(IMAGES.fight, { caption: result.text, ...backMenu() });
});

// ==================== خانه ====================
bot.action('home', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const next = HOME_UPGRADES[u.homeLevel + 1];
  let upgradeText = '🏆 حداکثر سطح';
  if (next) {
    upgradeText = `⬆️ ارتقا به ${u.homeLevel + 1}\nنیاز: 🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nلول لازم: ${next.needLevel}`;
  }
  
  ctx.replyWithPhoto(getHomeImage(u.homeLevel), {
    caption: `🏠 خونه لول ${u.homeLevel}\n\n${upgradeText}\n\nبرای ارتقا: /upgrade_home`,
    ...Markup.inlineKeyboard([
      [Markup.button.callback('⬆️ ارتقا', 'upgrade_home_btn')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

bot.action('upgrade_home_btn', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const next = HOME_UPGRADES[u.homeLevel + 1];
  if (!next) return ctx.answerCbQuery('🏆 حداکثر');
  if (u.playerLevel < next.needLevel) return ctx.answerCbQuery(`❌ لول ${next.needLevel} لازمه`);
  if (!hasResources(u, next)) return ctx.answerCbQuery('❌ منابع کافی نیست');
  
  takeResources(u, next);
  u.homeLevel++;
  if (u.homeLevel >= 2 && u.clinicLevel === 0) u.clinicLevel = 1;
  if (u.homeLevel >= 3 && u.clinicLevel === 1) u.clinicLevel = 2;
  if (u.homeLevel >= 5) u.clinicLevel = 3;
  saveDB(db);
  
  ctx.answerCbQuery(`✅ خونه لول ${u.homeLevel}!`);
  ctx.deleteMessage();
  ctx.replyWithPhoto(getHomeImage(u.homeLevel), {
    caption: `🏠 خونه به لول ${u.homeLevel} ارتقا یافت!`,
    ...backMenu()
  });
});

// ==================== درمانگاه ====================
bot.action('clinic', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const clinicImg = getClinicImage(u.clinicLevel || 1);
  
  ctx.replyWithPhoto(clinicImg, {
    caption: `🏥 درمانگاه لول ${u.clinicLevel || 1}\n\n❤️ HP: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp, 8)}\n\n/heal free - درمان رایگان (+30HP)\n/heal gold - درمان کامل (20 طلا)\n/use <آیتم> - استفاده از آیتم`,
    ...backMenu()
  });
});

// ==================== فروشگاه ====================
bot.action('shop', (ctx) => {
  ctx.replyWithPhoto(IMAGES.shop, {
    caption: '🛒 فروشگاه بقا',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📦 منابع', 'shop_cat_resource'), Markup.button.callback('🍽️ غذا', 'shop_cat_food')],
      [Markup.button.callback('🧰 آیتم', 'shop_cat_item'), Markup.button.callback('⚔️ سلاح', 'shop_cat_weapon')],
      [Markup.button.callback('🛡️ زره', 'shop_cat_armor'), Markup.button.callback('💎 ویژه', 'shop_cat_special')],
      [Markup.button.callback('💰 فروش', 'shop_sell_menu'), Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

// ==================== فروشگاه - اکشن‌ها ====================
bot.action('shop_categories', (ctx) => {
  ctx.editMessageCaption('🛒 فروشگاه', Markup.inlineKeyboard([
    [Markup.button.callback('📦 منابع', 'shop_cat_resource'), Markup.button.callback('🍽️ غذا', 'shop_cat_food')],
    [Markup.button.callback('🧰 آیتم', 'shop_cat_item'), Markup.button.callback('⚔️ سلاح', 'shop_cat_weapon')],
    [Markup.button.callback('🛡️ زره', 'shop_cat_armor'), Markup.button.callback('💎 ویژه', 'shop_cat_special')],
    [Markup.button.callback('💰 فروش', 'shop_sell_menu'), Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action(/shop_cat_(.+)/, (ctx) => {
  const category = ctx.match[1];
  const items = Object.entries(SHOP_BUY).filter(([k, v]) => {
    if (category === 'resource') return v.type === 'resource';
    if (category === 'item') return v.type === 'item';
    if (category === 'weapon') return v.type === 'weapon';
    if (category === 'armor') return v.type === 'armor';
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
  
  ctx.editMessageCaption(`${item.name} - ${item.price} طلا\nتعداد:`, Markup.inlineKeyboard([
    [Markup.button.callback('۱', `shop_confirm_buy_${itemKey}_1`), Markup.button.callback('۵', `shop_confirm_buy_${itemKey}_5`)],
    [Markup.button.callback('۱۰', `shop_confirm_buy_${itemKey}_10`), Markup.button.callback('۵۰', `shop_confirm_buy_${itemKey}_50`)],
    [Markup.button.callback('🔙 بازگشت', 'shop_categories')]
  ]));
});

bot.action(/shop_confirm_buy_(.+)_(.+)/, (ctx) => {
  const itemKey = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const item = SHOP_BUY[itemKey];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (!item) return ctx.answerCbQuery('❌');
  const total = item.price * amount;
  if (u.resources.gold < total) return ctx.answerCbQuery(`❌ ${total} طلا لازمه`);
  
  addResource(u, 'gold', -total);
  if (item.type === 'resource') addResource(u, item.key, amount);
  else if (item.type === 'weapon') u.weaponsOwned[item.key] = true;
  else if (item.type === 'armor') u.armorsOwned[item.key] = true;
  else addItem(u, item.key, amount);
  bumpAction(u, 'buy', 1);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${amount} عدد ${item.name} خریدی!`);
  ctx.editMessageCaption(`✅ خرید موفق!\n${amount} عدد ${item.name}\n💰 طلا: ${u.resources.gold}`, backMenu());
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
  ctx.editMessageCaption('💰 فروش:', Markup.inlineKeyboard(buttons));
});

bot.action(/shop_sell_(.+)_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  
  if (RES_LABELS[key] && key !== 'gold') {
    if ((u.resources[key] || 0) < 1) return ctx.answerCbQuery('❌');
    const price = Math.max(1, Math.floor((SHOP_BUY[key]?.price || 5) / 2));
    addResource(u, key, -1);
    addResource(u, 'gold', price);
  } else if (u.items[key] >= 1) {
    const base = HEAL_ITEMS[key]?.sell || FOOD_ITEMS[key]?.sell || SPECIAL_ITEMS[key]?.sell || 10;
    addItem(u, key, -1);
    addResource(u, 'gold', base);
  } else return ctx.answerCbQuery('❌');
  
  bumpAction(u, 'sell', 1);
  saveDB(db);
  ctx.answerCbQuery('✅ فروخته شد');
  ctx.editMessageCaption(`✅ فروخته شد!\n💰 طلا: ${u.resources.gold}`, backMenu());
});

// ==================== اسلحه‌خانه ====================
bot.action('armory_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const buttons = [];
  
  for (const [k, w] of Object.entries(WEAPONS)) {
    if (k === 'none') continue;
    buttons.push([Markup.button.callback(
      `${u.weaponsOwned[k] ? '✅' : '🔨'} ${w.name}${u.weapon === k ? ' ⚔️' : ''}`,
      u.weaponsOwned[k] ? `armory_equip_weapon_${k}` : `armory_craft_weapon_${k}`
    )]);
  }
  
  buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  ctx.replyWithPhoto(IMAGES.main, {
    caption: `🛠️ اسلحه‌خانه\nسلاح فعلی: ${WEAPONS[u.weapon]?.name || 'ندارد'}`,
    ...Markup.inlineKeyboard(buttons)
  });
});

bot.action(/armory_craft_weapon_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const weapon = WEAPONS[key];
  if (!weapon) return ctx.answerCbQuery('❌');
  if (u.playerLevel < weapon.level) return ctx.answerCbQuery(`❌ لول ${weapon.level} لازمه`);
  if (u.resources.gold < weapon.price) return ctx.answerCbQuery(`❌ ${weapon.price} طلا لازمه`);
  
  addResource(u, 'gold', -weapon.price);
  u.weaponsOwned[key] = true;
  saveDB(db);
  ctx.answerCbQuery(`✅ ${weapon.name} ساخته شد!`);
  ctx.deleteMessage();
});

bot.action(/armory_equip_weapon_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!u.weaponsOwned[key]) return ctx.answerCbQuery('❌ نداری');
  u.weapon = key;
  saveDB(db);
  ctx.answerCbQuery(`⚔️ ${WEAPONS[key].name} تجهیز شد`);
});

// ==================== زره‌خانه ====================
bot.action('armory_armor', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const buttons = [];
  
  for (const [k, a] of Object.entries(ARMORS)) {
    if (k === 'none') continue;
    buttons.push([Markup.button.callback(
      `${u.armorsOwned[k] ? '✅' : '🔨'} ${a.name}${u.armor === k ? ' 🛡️' : ''}`,
      u.armorsOwned[k] ? `armory_equip_armor_${k}` : `armory_craft_armor_${k}`
    )]);
  }
  
  buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
  ctx.replyWithPhoto(IMAGES.main, {
    caption: `🛡️ زره‌خانه\nزره فعلی: ${ARMORS[u.armor]?.name || 'ندارد'}`,
    ...Markup.inlineKeyboard(buttons)
  });
});

bot.action(/armory_craft_armor_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const armor = ARMORS[key];
  if (!armor) return ctx.answerCbQuery('❌');
  if (u.playerLevel < armor.level) return ctx.answerCbQuery(`❌ لول ${armor.level} لازمه`);
  if (u.resources.gold < armor.price) return ctx.answerCbQuery(`❌ ${armor.price} طلا لازمه`);
  
  addResource(u, 'gold', -armor.price);
  u.armorsOwned[key] = true;
  saveDB(db);
  ctx.answerCbQuery(`✅ ${armor.name} ساخته شد!`);
  ctx.deleteMessage();
});

bot.action(/armory_equip_armor_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!u.armorsOwned[key]) return ctx.answerCbQuery('❌ نداری');
  u.armor = key;
  saveDB(db);
  ctx.answerCbQuery(`🛡️ ${ARMORS[key].name} تجهیز شد`);
});

// ==================== آرامگاه ====================
bot.action('aramgah', async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const cd = checkCooldown(u, 'pray', COOLDOWNS.pray);
  if (!cd.canDo) { await ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)}`); return; }
  
  await ctx.answerCbQuery();
  ctx.replyWithPhoto(IMAGES.aramgah, {
    caption: '🕯️ آرامگاه\n\nنور الهی...',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🤲 دعا', 'pray_dua')],
      [Markup.button.callback('🧎 نماز', 'pray_namaz')],
      [Markup.button.callback('📖 روضه', 'pray_rozeh')],
      [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ])
  });
});

bot.action(['pray_dua', 'pray_namaz', 'pray_rozeh'], async (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const cd = checkCooldown(u, 'pray', COOLDOWNS.pray);
  if (!cd.canDo) return ctx.answerCbQuery(`⏳ ${formatTime(cd.remaining)}`);
  
  setCooldown(u, 'pray');
  const xpGain = u.playerLevel <= 3 ? 60 : 30;
  addXP(u, xpGain);
  saveDB(db);
  
  const names = { pray_dua: 'دعا', pray_namaz: 'نماز', pray_rozeh: 'روضه' };
  await ctx.answerCbQuery(`✨ +${xpGain} XP`);
  ctx.reply(`✅ ${names[ctx.match[0]]} قبول باشه!\n✨ +${xpGain} XP\n⏱️ ${formatTime(COOLDOWNS.pray)} دیگه`, backMenu());
});

// ==================== غذا ====================
bot.action('eat_menu', (ctx) => {
  ctx.reply('🍽️ غذا و نوشیدنی:', Markup.inlineKeyboard([
    [Markup.button.callback('🍞 نان', 'eat_bread'), Markup.button.callback('🍖 گوشت', 'eat_meat')],
    [Markup.button.callback('🐟 ماهی', 'eat_fish'), Markup.button.callback('🍲 سوپ', 'eat_soup')],
    [Markup.button.callback('🍗 مرغ', 'eat_chicken'), Markup.button.callback('🥩 استیک', 'eat_steak')],
    [Markup.button.callback('🍕 پیتزا', 'eat_pizza'), Markup.button.callback('🍔 همبرگر', 'eat_burger')],
    [Markup.button.callback('🥘 خورشت', 'eat_stew'), Markup.button.callback('🍜 نودل', 'eat_noodle')],
    [Markup.button.callback('🍰 کیک', 'eat_cake'), Markup.button.callback('🍯 عسل', 'eat_honey')],
    [Markup.button.callback('💧 آب', 'drink_water'), Markup.button.callback('🧃 آبمیوه', 'drink_juice')],
    [Markup.button.callback('🍺 نوشابه', 'drink_soda'), Markup.button.callback('🍵 چای', 'drink_tea')],
    [Markup.button.callback('☕ قهوه', 'drink_coffee'), Markup.button.callback('🥛 شیر', 'drink_milk')],
    [Markup.button.callback('🔙 بازگشت', 'back_main')]
  ]));
});

bot.action(/eat_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if ((u.items[key] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
  
  const food = FOOD_ITEMS[key] || HEAL_ITEMS[key];
  if (!food) return ctx.answerCbQuery('❌');
  
  addItem(u, key, -1);
  if (food.hunger) u.hunger = Math.min(u.maxHunger, u.hunger + food.hunger);
  if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal);
  if (food.xp) addXP(u, food.xp);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${food.name} خورده شد`);
});

bot.action(/drink_(.+)/, (ctx) => {
  const key = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if ((u.items[key] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
  
  const drink = FOOD_ITEMS[key];
  if (!drink) return ctx.answerCbQuery('❌');
  
  addItem(u, key, -1);
  if (drink.thirst) u.thirst = Math.min(u.maxThirst, u.thirst + drink.thirst);
  if (drink.hunger) u.hunger = Math.min(u.maxHunger, u.hunger + drink.hunger);
  if (drink.xp) addXP(u, drink.xp);
  saveDB(db);
  
  ctx.answerCbQuery(`✅ ${drink.name} نوشیده شد`);
});

// ==================== سایر ====================
bot.action('clan', (ctx) => {
  ctx.reply('🏛️ کلن\n\nساخت: /create_clan <اسم>\nعضویت: /join_clan <اسم>\nخروج: /leave_clan\nاهدا: /donate <نوع> <مقدار>', backMenu());
});

bot.action('guide', (ctx) => {
  ctx.reply(
    '📖 راهنمای بقا\n\n' +
    `🪓 جستجو: ${formatTime(COOLDOWNS.gather)}\n` +
    `⚔️ مبارزه: ${formatTime(COOLDOWNS.fight)}\n` +
    `👹 باس: ${formatTime(COOLDOWNS.boss)}\n` +
    `🕯️ آرامگاه: ${formatTime(COOLDOWNS.pray)}\n\n` +
    '🛡️ زره: آسیب رو کم می‌کنه\n' +
    '🍞 غذا: گرسنگی رو کم می‌کنه\n' +
    '💧 نوشیدنی: تشنگی رو کم می‌کنه\n' +
    '⭐ مهارت: با لول آپ امتیاز بگیر',
    backMenu()
  );
});

bot.action('skills_menu', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  ctx.reply(
    `⭐ مهارت‌ها | ${u.skillPoints || 0} امتیاز\n\n` +
    `⛏️ جمع‌آوری: ${u.skills.gathering}/10\n🏹 شکار: ${u.skills.hunting}/10\n` +
    `🔨 صنعتگری: ${u.skills.crafting}/10\n🏕️ بقا: ${u.skills.survival}/10\n\n` +
    '/skill gathering|hunting|crafting|survival',
    Markup.inlineKeyboard([
      [Markup.button.callback('⛏️', 'skill_gathering'), Markup.button.callback('🏹', 'skill_hunting')],
      [Markup.button.callback('🔨', 'skill_crafting'), Markup.button.callback('🏕️', 'skill_survival')],
      [Markup.button.callback('🔙', 'back_main')]
    ])
  );
});

bot.action(/skill_(.+)/, (ctx) => {
  const skill = ctx.match[1];
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  if (!u.skillPoints || u.skillPoints <= 0) return ctx.answerCbQuery('❌ امتیاز نداری');
  if ((u.skills[skill] || 0) >= 10) return ctx.answerCbQuery('❌ حداکثر');
  u.skills[skill] = (u.skills[skill] || 0) + 1;
  u.skillPoints--;
  saveDB(db);
  ctx.answerCbQuery(`✅ ${u.skills[skill]}/10`);
});

bot.action('cooldowns', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const actions = [
    { key: 'gather', name: '🪓 جستجو', cd: COOLDOWNS.gather },
    { key: 'fight', name: '⚔️ مبارزه', cd: COOLDOWNS.fight },
    { key: 'boss', name: '👹 باس', cd: COOLDOWNS.boss },
    { key: 'pray', name: '🕯️ آرامگاه', cd: COOLDOWNS.pray }
  ];
  
  const lines = ['⏱️ زمان‌ها:', ''];
  for (const a of actions) {
    const cd = checkCooldown(u, a.key, a.cd);
    lines.push(`${a.name}: ${cd.canDo ? '✅ آماده' : `⏳ ${formatTime(cd.remaining)} ${progressBar(a.cd - cd.remaining, a.cd, 6)}`}`);
  }
  
  ctx.reply(lines.join('\n'), backMenu());
});

bot.action('back_main', (ctx) => {
  ctx.deleteMessage().catch(() => {});
  ctx.replyWithPhoto(IMAGES.main, { caption: '🏕️ منوی اصلی', ...mainMenu() });
});

// ==================== دستورات متنی ====================
bot.command('heal', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  if (args[1] === 'free') {
    if (u.daily?.freeHealUsed) return ctx.reply('❌ استفاده شده');
    u.daily = u.daily || {};
    u.daily.freeHealUsed = true;
    u.hp = Math.min(u.maxHp, u.hp + 30);
    saveDB(db);
    return ctx.reply(`✅ +30 HP\n❤️ ${u.hp}/${u.maxHp}`);
  }
  if (args[1] === 'gold') {
    if (u.resources.gold < 20) return ctx.reply('❌ 20 طلا');
    addResource(u, 'gold', -20);
    u.hp = u.maxHp;
    saveDB(db);
    return ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`);
  }
  ctx.reply('/heal free یا /heal gold');
});

bot.command('use', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const key = args[1];
  const item = HEAL_ITEMS[key];
  if (!item) return ctx.reply('❌ آیتم نامعتبر');
  if ((u.items[key] || 0) < 1) return ctx.reply('❌ نداری');
  addItem(u, key, -1);
  u.hp = Math.min(u.maxHp, u.hp + item.heal);
  if (item.hunger) u.hunger = Math.min(u.maxHunger, u.hunger + item.hunger);
  saveDB(db);
  ctx.reply(`✅ ${item.name} استفاده شد\n❤️ ${u.hp}/${u.maxHp}`);
});

bot.command('upgrade_home', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const next = HOME_UPGRADES[u.homeLevel + 1];
  if (!next) return ctx.reply('🏆 حداکثر');
  if (u.playerLevel < next.needLevel) return ctx.reply(`❌ لول ${next.needLevel} لازمه`);
  if (!hasResources(u, next)) return ctx.reply('❌ منابع کافی نیست');
  takeResources(u, next);
  u.homeLevel++;
  if (u.homeLevel >= 2 && u.clinicLevel === 0) u.clinicLevel = 1;
  if (u.homeLevel >= 3 && u.clinicLevel === 1) u.clinicLevel = 2;
  if (u.homeLevel >= 5) u.clinicLevel = 3;
  saveDB(db);
  ctx.reply(`✅ خونه لول ${u.homeLevel}!`);
});

bot.command('skill', (ctx) => {
  const u = ensureUser(ctx.from.id, ctx.from.first_name || '');
  const args = parseArgs(ctx.message.text);
  const skill = args[1];
  if (!['gathering', 'hunting', 'crafting', 'survival'].includes(skill)) return ctx.reply('❌ gathering, hunting, crafting, survival');
  if (!u.skillPoints || u.skillPoints <= 0) return ctx.reply('❌ امتیاز نداری');
  if ((u.skills[skill] || 0) >= 10) return ctx.reply('❌ حداکثر');
  u.skills[skill] = (u.skills[skill] || 0) + 1;
  u.skillPoints--;
  saveDB(db);
  ctx.reply(`✅ ${skill}: ${u.skills[skill]}/10`);
});

// ==================== ادمین ====================
bot.command('admin_give', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = parseArgs(ctx.message.text);
  const targetId = args[1], type = args[2], key = args[3], amount = Number(args[4] || 0);
  if (!targetId || !type || !key || !amount) return ctx.reply('/admin_give [id] [type] [key] [amount]');
  const u = ensureUser(targetId, '');
  if (type === 'resource') addResource(u, key, amount);
  else if (type === 'item') addItem(u, key, amount);
  else if (type === 'weapon') u.weaponsOwned[key] = true;
  else if (type === 'armor') u.armorsOwned[key] = true;
  else if (type === 'xp') addXP(u, amount);
  else if (type === 'hp') u.hp = Math.min(u.maxHp, u.hp + amount);
  saveDB(db);
  ctx.reply('✅ Done');
});

bot.command('admin_full', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('/admin_full [id]');
  const u = ensureUser(targetId, '');
  for (const k of RES_KEYS) u.resources[k] = 9999;
  for (const k of Object.keys({...HEAL_ITEMS, ...FOOD_ITEMS, ...SPECIAL_ITEMS})) u.items[k] = 99;
  for (const k of Object.keys(WEAPONS)) u.weaponsOwned[k] = true;
  for (const k of Object.keys(ARMORS)) u.armorsOwned[k] = true;
  u.weapon = 'sniper'; u.armor = 'armor_dragon';
  u.playerLevel = 20; u.hp = u.maxHp = 500;
  u.hunger = u.maxHunger = 200; u.thirst = u.maxThirst = 200;
  u.skillPoints = 40; u.homeLevel = 5; u.clinicLevel = 3;
  saveDB(db);
  ctx.reply('✅ Maxed');
});

bot.command('admin_reset_cooldown', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const args = parseArgs(ctx.message.text);
  const targetId = args[1];
  if (!targetId) return ctx.reply('/admin_reset_cooldown [id]');
  const u = ensureUser(targetId, '');
  u.cooldowns = {};
  saveDB(db);
  ctx.reply('✅ ریست شد');
});

bot.command('admin_help', (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  ctx.reply('👑 /admin_give [id] [type] [key] [amount]\n/admin_full [id]\n/admin_reset_cooldown [id]');
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log('✅ ربات بقا کامل اجرا شد!');
  console.log('🎮 امکانات: خونه متغیر | درمانگاه متغیر | زره | اسلحه | ۱۷ غذا | باس | کلن | مهارت | کول‌داون');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));