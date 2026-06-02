const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ==================== 🔑 تنظیمات ====================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_PATH = './data.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('❌ توکن ربات را وارد کن');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== 📂 دیتابیس ====================
let db = { users: {}, clans: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {}, clans: {} }; }
}
function saveDB() { try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8'); } catch (e) {} }

// ==================== 🔢 توابع کمکی ====================
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function isAdmin(id) { return Number(id) === ADMIN_ID; }

function formatTime(ms) {
    if (ms <= 0) return 'آماده';
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h > 0) return `${h}ساعت ${m % 60}دقیقه`;
    if (m > 0) return `${m}دقیقه ${s % 60}ثانیه`;
    return `${s}ثانیه`;
}

// ==================== ⏱️ کول‌داون‌ها ====================
const CD = {
    gather: 120000,
    fight: 180000,
    pray: 21600000,
    pvp: 300000,
    daily: 86400000,
    shahnameh: 3600000,
    npc: 3600000,
    box: 14400000,
    library: 3600000,
};

function checkCD(u, action, ms) {
    if (!u.cooldowns) u.cooldowns = {};
    const last = u.cooldowns[action] || 0;
    return (Date.now() - last >= ms) ? { can: true, rem: 0 } : { can: false, rem: ms - (Date.now() - last) };
}
function setCD(u, action) {
    if (!u.cooldowns) u.cooldowns = {};
    u.cooldowns[action] = Date.now();
}

// ==================== 📦 منابع ====================
const RES = { wood: '🪵', stone: '🪨', metal: '🔩', iron: '⛓️', gold: '🥇' };

// ==================== 🗡️ ۱۰ سلاح ====================
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

// ==================== 🛡️ ۱۰ زره ====================
const ARMORS = {
    none: { n: '❌ بدون زره', d: 0, price: 0, lvl: 0 },
    wood_shield: { n: '🪵 سپر چوبی', d: 3, price: 50, lvl: 1 },
    leather: { n: '🐄 چرم سکایی', d: 7, price: 150, lvl: 3 },
    hakhamaneshi: { n: '⛓️ زره هخامنشی', d: 12, price: 400, lvl: 5 },
    sasani: { n: '🥇 زره ساسانی', d: 18, price: 800, lvl: 8 },
    babr_bayan: { n: '🐉 ببر بیان', d: 25, price: 2000, lvl: 12 },
    immortals: { n: '👑 سپاه جاویدان', d: 30, price: 3500, lvl: 15 },
    keykhosro: { n: '🏆 زره کیخسرو', d: 35, price: 5000, lvl: 18 },
    rostam: { n: '⚡ ببر بیان رستم', d: 40, price: 8000, lvl: 20 },
    ahura: { n: '✨ زره اهورایی', d: 50, price: 15000, lvl: 25 },
};

// ==================== 🍽️ ۱۰ غذا ====================
const FOODS = {
    bread: { n: '🍞 نان روغنی', h: 30 }, meat: { n: '🍖 کباب شکار', h: 50 },
    fish: { n: '🐟 ماهی سفید', h: 25 }, chicken: { n: '🍗 ماکیان بریان', h: 45 },
    steak: { n: '🥩 گوشت بره', h: 70 }, stew: { n: '🥘 آبگوشت', h: 55 },
    noodle: { n: '🍜 آش رشته', h: 35 }, cake: { n: '🍰 باقلوا', h: 25, heal: 20 },
    honey: { n: '🍯 انگبین', h: 20, heal: 30 }, rice: { n: '🍚 چلوکباب', h: 80 },
};

// ==================== 🧃 ۱۰ نوشیدنی ====================
const DRINKS = {
    water: { n: '💧 آب چشمه', t: 40 }, juice: { n: '🧃 شربت آلبالو', t: 50 },
    soda: { n: '🍺 دوغ', t: 25 }, tea: { n: '🍵 چای بهارنارنج', t: 35 },
    coffee: { n: '☕ قهوه ترک', t: 30, xp: 10 }, milk: { n: '🥛 شیر میش', t: 45 },
    sherbet: { n: '🍹 سکنجبین', t: 55 }, pomegranate: { n: '🍎 آب انار', t: 60 },
    rosewater: { n: '🌹 گلاب', t: 40, xp: 5 }, yogurt: { n: '🥤 ماست', t: 35, heal: 10 },
};

// ==================== 👹 ۲۰ موجود ====================
const ALL_ENEMIES = [
    // ددان (حیوانات)
    { n: '🐺 گرگ تورانی', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8, type: 'animal' },
    { n: '🐗 گراز مازندران', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10, type: 'animal' },
    { n: '🦊 شغال دشتی', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12, type: 'animal' },
    { n: '🐻 خرس البرز', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15, type: 'animal' },
    { n: '🐆 پلنگ پارسی', p: 18, loss: [15,30], rew: { gold: 25, meat: 2 }, xp: 18, type: 'animal' },
    // دیوان
    { n: '👹 دیو سفید', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18, type: 'demon' },
    { n: '👺 دیو سیاه', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22, type: 'demon' },
    { n: '👾 اکوان دیو', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28, type: 'demon' },
    { n: '👿 ارجنگ دیو', p: 32, loss: [30,55], rew: { gold: 70, iron: 5, gem: 3 }, xp: 35, type: 'demon' },
    { n: '💀 دیو سپید', p: 38, loss: [35,65], rew: { gold: 100, iron: 8, gem: 5 }, xp: 50, type: 'demon' },
    // موجودات پلید (باس)
    { n: '🐉 ضحاک ماردوش', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, type: 'boss', ml: 8 },
    { n: '🦅 سیمرغ خشمگین', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, type: 'boss', ml: 10 },
    { n: '👹 دیو بزرگ مازندران', p: 60, loss: [50,100], rew: { gold: 1500, dragon_scale: 3, gem: 15 }, xp: 250, type: 'boss', ml: 15 },
    { n: '🐲 اژدهای هفت‌سر', p: 75, loss: [60,120], rew: { gold: 3000, dragon_scale: 5, gem: 25 }, xp: 500, type: 'boss', ml: 20 },
    { n: '👑 اهریمن بزرگ', p: 100, loss: [80,150], rew: { gold: 10000, dragon_scale: 10, gem: 50 }, xp: 1000, type: 'boss', ml: 30 },
    // شکار (ضعیف)
    { n: '🐑 میش کوهی', p: 3, loss: [2,5], rew: { gold: 5, meat: 1 }, xp: 3, type: 'prey' },
    { n: '🦌 آهوی دشت', p: 4, loss: [3,7], rew: { gold: 8, meat: 2 }, xp: 5, type: 'prey' },
    { n: '🐇 خرگوش صحرایی', p: 1, loss: [0,3], rew: { gold: 3, meat: 1 }, xp: 2, type: 'prey' },
    { n: '🦃 بوقلمون', p: 2, loss: [1,4], rew: { gold: 4, meat: 1 }, xp: 3, type: 'prey' },
    { n: '🐟 ماهی بزرگ', p: 1, loss: [0,2], rew: { gold: 6, fish: 2 }, xp: 4, type: 'prey' },
];

// ==================== 📚 ۱۰ کتاب ====================
const LIBRARY = {
    shahnameh: { name: '📜 شاهنامه', poet: 'حکیم فردوسی', verses: [{ text: 'توانا بود هر که دانا بود\nز دانش دل پیر برنا بود', rew: { gold: 15 } }, { text: 'به نام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد', rew: { gold: 10 } }, { text: 'هنر نزد ایرانیان است و بس\nندارند شیر ژیان را به کس', rew: { gold: 25 } }, { text: 'چو ایران نباشد تن من مباد\nبدین بوم و بر زنده یک تن مباد', rew: { gold: 30 } }] },
    masnavi: { name: '🕊️ مثنوی معنوی', poet: 'مولانا جلال‌الدین', verses: [{ text: 'بشنو از نی چون حکایت می‌کند\nاز جدایی‌ها شکایت می‌کند', rew: { xp: 25 } }, { text: 'هر کسی کو دور ماند از اصل خویش\nباز جوید روزگار وصل خویش', rew: { xp: 20 } }] },
    golestan: { name: '🌹 گلستان', poet: 'سعدی شیرازی', verses: [{ text: 'بنی‌آدم اعضای یکدیگرند\nکه در آفرینش ز یک گوهرند', rew: { gold: 10, xp: 10 } }] },
    hafez: { name: '💫 دیوان حافظ', poet: 'خواجه حافظ شیرازی', verses: [{ text: 'یوسف گمگشته باز آید به کنعان غم مخور\nکلبه احزان شود روزی گلستان غم مخور', rew: { gold: 20 } }] },
    khayyam: { name: '🌙 رباعیات', poet: 'حکیم عمر خیام', verses: [{ text: 'هر ذره که در خاک زمینی بودست\nپیش از من و تو تاج و نگینی بودست', rew: { gold: 10, xp: 15 } }] },
    nezami: { name: '💖 لیلی و مجنون', poet: 'نظامی گنجوی', verses: [{ text: 'هر شب من و یاد روی تو\nهر روز من و آرزوی تو', rew: { gold: 12, xp: 12 } }] },
    attar: { name: '🕊️ منطق‌الطیر', poet: 'عطار نیشابوری', verses: [{ text: 'سی مرغ را جستند و سیمرغ شدند\nچون یافتند آنچه می‌جستند', rew: { xp: 30 } }] },
    sanaei: { name: '📿 حدیقه', poet: 'سنایی غزنوی', verses: [{ text: 'هر که را خوابگه آخر مشتی خاک است\nگو چه حاجت که به افلاک کشی ایوان را', rew: { gold: 8, xp: 18 } }],
    },
    iraqi: { name: '💫 لمعات', poet: 'فخرالدین عراقی', verses: [{ text: 'عشق آمدنی بود نه آموختنی\nعشق را در دل نشانند نه در زبان', rew: { xp: 20 } }] },
    baba_taher: { name: '🎵 دوبیتی‌ها', poet: 'باباطاهر همدانی', verses: [{ text: 'خوشا آنان که از پا اندرآیند\nز هستی وارهند و در سر آیند', rew: { gold: 10 } }] },
};

// ==================== 🎁 صندوقچه ====================
const BOX_LOOT = [
    { n: '🥇 ۵۰ زر', f: (u) => { u.gold += 50; } },
    { n: '🥇 ۱۰۰ زر', f: (u) => { u.gold += 100; } },
    { n: '🥇 ۲۰۰ زر', f: (u) => { u.gold += 200; } },
    { n: '💎 ۱ گوهر', f: (u) => { if (!u.items) u.items = {}; u.items.gem = (u.items.gem || 0) + 1; } },
    { n: '💎 ۳ گوهر', f: (u) => { if (!u.items) u.items = {}; u.items.gem = (u.items.gem || 0) + 3; } },
    { n: '✨ ۳۰ XP', f: (u) => { u.xp = (u.xp || 0) + 30; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } } },
    { n: '✨ ۶۰ XP', f: (u) => { u.xp = (u.xp || 0) + 60; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } } },
    { n: '❤️ درمان کامل', f: (u) => { u.hp = u.maxHp; } },
    { n: '⛓️ ۵ آهن', f: (u) => { u.iron = (u.iron || 0) + 5; } },
    { n: '🍞 ۵ نان', f: (u) => { u.bread = (u.bread || 0) + 5; } },
];

// ==================== 🏠 کاشانه ۱۰ پایه ====================
const HOME_UP = {
    2: { wood: 25, stone: 20, gold: 40, needLvl: 3 },
    3: { wood: 45, stone: 35, gold: 90, needLvl: 5 },
    4: { wood: 70, stone: 55, gold: 180, needLvl: 8 },
    5: { wood: 100, stone: 80, gold: 350, needLvl: 12 },
    6: { wood: 150, stone: 120, gold: 500, needLvl: 15 },
    7: { wood: 200, stone: 160, gold: 700, needLvl: 18 },
    8: { wood: 280, stone: 220, gold: 1000, needLvl: 22 },
    9: { wood: 380, stone: 300, gold: 1500, needLvl: 26 },
    10: { wood: 500, stone: 400, gold: 2500, needLvl: 30 },
};

// ==================== 🏆 لیگ میدان ====================
const ARENA_RANKS = [
    { n: '🥉 نوآموز', min: 0 },
    { n: '🥈 شوالیه', min: 70 },
    { n: '🥇 استاد', min: 200 },
    { n: '👑 لرد', min: 500 },
    { n: '💎 اسطوره', min: 700 },
    { n: '🏆 جاودان', min: 1000 },
    { n: '🌟 حماسه', min: 2000 },
    { n: '🔥 افسانه', min: 5000 },
    { n: '⚡ خداوندگار', min: 10000 },
    { n: '👑 شاهنشاه', min: 25000 },
];

// ==================== 🐎 ۱۰ حیوان ====================
const PETS = {
    horse: { n: '🐎 رخش', price: 500, bonus: 'سرعت شکار +۳۰٪' },
    falcon: { n: '🦅 باز شکاری', price: 400, bonus: 'شانس شکار +۲۰٪' },
    dog: { n: '🐕 سگ گله', price: 300, bonus: 'دفاع +۵' },
    cat: { n: '🐈 گربه ایرانی', price: 200, bonus: 'شانس آیتم +۱۵٪' },
    lion: { n: '🦁 شیر پارسی', price: 1500, bonus: 'قدرت +۱۰' },
    camel: { n: '🐫 شتر', price: 600, bonus: 'حمل بار +۵۰٪' },
    elephant: { n: '🐘 فیل جنگی', price: 3000, bonus: 'دفاع +۱۵' },
    eagle: { n: '🦅 عقاب', price: 2000, bonus: 'XP +۲۵٪' },
    wolf: { n: '🐺 گرگ خاکستری', price: 800, bonus: 'شانس برد +۱۰٪' },
    pegasus: { n: '🪽 اسب بالدار', price: 5000, bonus: 'همه +۱۵٪' },
};

// ==================== 👤 ۱۰ بزرگ ====================
const NPCS = {
    zal: { n: '👴 زال زر', price: 50, f: (u) => { u.sp = (u.sp || 0) + 1; return '⭐ +۱ گوهر هنر'; } },
    simurgh: { n: '🦅 سیمرغ', price: 100, f: (u) => { u.hp = u.maxHp; return '❤️ درمان کامل'; } },
    rostam: { n: '⚔️ رستم دستان', price: 80, f: (u) => { u.xp = (u.xp || 0) + 50; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } return '✨ +۵۰ XP'; } },
    ferdosi: { n: '📜 فردوسی', price: 30, f: (u) => { u.gold += 50; u.shahnamehCount = (u.shahnamehCount || 0) + 1; return '🥇 +۵۰ زر'; } },
    kaveh: { n: '🔨 کاوه آهنگر', price: 200, f: (u) => { u.iron = (u.iron || 0) + 5; return '⛓️ +۵ آهن'; } },
    jamshid: { n: '👑 جمشید', price: 500, f: (u) => { u.gold += 200; u.gem = (u.gem || 0) + 2; return '🥇 +۲۰۰ زر | 💎 +۲ گوهر'; } },
    anahita: { n: '💧 آناهیتا', price: 150, f: (u) => { u.bread = (u.bread || 0) + 5; u.water = (u.water || 0) + 3; return '🍞 +۵ | 💧 +۳'; } },
    mitra: { n: '☀️ میترا', price: 300, f: (u) => { u.xp = (u.xp || 0) + 100; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } return '✨ +۱۰۰ XP'; } },
    zoroaster: { n: '🔥 زرتشت', price: 400, f: (u) => { u.sp = (u.sp || 0) + 3; return '⭐ +۳ گوهر هنر'; } },
    cyrus: { n: '👑 کوروش بزرگ', price: 1000, f: (u) => { u.gold += 500; u.arenaPoints = (u.arenaPoints || 0) + 100; return '🥇 +۵۰۰ زر | ⭐ +۱۰۰ امتیاز'; } },
};

// ==================== 🌍 ۱۰ رویداد ====================
const EVENTS = [
    { n: '🌪️ طوفان سهمگین', desc: 'طوفان به کاشانه آسیب زد', f: (u) => { u.wood = Math.floor((u.wood || 0) * 0.7); u.stone = Math.floor((u.stone || 0) * 0.7); return '🪵 و 🪨 کاهش یافت'; } },
    { n: '💰 گنج پنهان', desc: 'گنج کهنه پیدا کردی', f: (u) => { const g = rand(100, 500); u.gold += g; return `🥇 +${g} زر`; } },
    { n: '🎁 هدیه آسمانی', desc: 'بسته از آسمان افتاد', f: (u) => { u.bread = (u.bread || 0) + 3; u.water = (u.water || 0) + 2; return '🍞 +۳ | 💧 +۲'; } },
    { n: '🤒 بیماری', desc: 'بیمار شدی', f: (u) => { u.hp = Math.floor(u.hp * 0.5); return '❤️ نصف شد'; } },
    { n: '🔥 آتش‌سوزی', desc: 'آتش به انبار افتاد', f: (u) => { u.wood = Math.floor((u.wood || 0) * 0.5); u.bread = Math.floor((u.bread || 0) * 0.5); return '🪵 و 🍞 نصف شد'; } },
    { n: '🌧️ باران رحمت', desc: 'باران محصولات را پرورش داد', f: (u) => { u.wood = (u.wood || 0) + 10; u.bread = (u.bread || 0) + 5; return '🪵 +۱۰ | 🍞 +۵'; } },
    { n: '⚡ صاعقه', desc: 'صاعقه به معدن خورد', f: (u) => { u.iron = (u.iron || 0) + 5; u.gem = (u.gem || 0) + 1; return '⛓️ +۵ | 💎 +۱'; } },
    { n: '🐺 حمله گرگان', desc: 'گرگان به گله حمله کردند', f: (u) => { u.hp = Math.max(10, u.hp - 30); u.arenaPoints = (u.arenaPoints || 0) + 20; return '❤️ -۳۰ | ⭐ +۲۰'; } },
    { n: '🎪 جشن مهرگان', desc: 'جشن بزرگ برپاست', f: (u) => { u.gold += 100; u.xp = (u.xp || 0) + 50; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } return '🥇 +۱۰۰ | ✨ +۵۰ XP'; } },
    { n: '👑 لطف شاهنشاه', desc: 'شاهنشاه بر تو بخشید', f: (u) => { u.gold += 1000; u.gem = (u.gem || 0) + 5; return '🥇 +۱۰۰۰ | 💎 +۵'; } },
];

// ==================== 💀 ۱۰ توهین ====================
const TAUNTS = [
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

// ==================== 🏟️ ۳۰ جنگجوی میدان ====================
const FAKE_NPCS = [
    { n: '🗡️ کاوه آهنگر', lvl: 5, p: 15, title: '🥉 نوآموز', loss: [5, 12], rew: { gold: 20 }, xp: 10 },
    { n: '🏹 آرتمیس پارسی', lvl: 8, p: 22, title: '🥉 نوآموز', loss: [8, 18], rew: { gold: 35 }, xp: 18 },
    { n: '⚔️ سروش جنگجو', lvl: 6, p: 18, title: '🥉 نوآموز', loss: [6, 14], rew: { gold: 25 }, xp: 12 },
    { n: '🛡️ بابک دلیر', lvl: 7, p: 20, title: '🥉 نوآموز', loss: [7, 16], rew: { gold: 30 }, xp: 15 },
    { n: '🏹 آرش کمانگیر', lvl: 9, p: 24, title: '🥉 نوآموز', loss: [9, 20], rew: { gold: 40 }, xp: 20 },
    { n: '⚔️ بهرام چوبینه', lvl: 12, p: 30, title: '🥈 شوالیه', loss: [12, 25], rew: { gold: 50 }, xp: 25 },
    { n: '🛡️ شیردل پارس', lvl: 15, p: 38, title: '🥈 شوالیه', loss: [15, 32], rew: { gold: 70 }, xp: 35 },
    { n: '🗡️ فرهاد پولاد', lvl: 13, p: 33, title: '🥈 شوالیه', loss: [13, 28], rew: { gold: 60 }, xp: 30 },
    { n: '🏹 گودرز کشواد', lvl: 14, p: 35, title: '🥈 شوالیه', loss: [14, 30], rew: { gold: 65 }, xp: 32 },
    { n: '⚔️ توس نوذر', lvl: 11, p: 28, title: '🥈 شوالیه', loss: [11, 22], rew: { gold: 45 }, xp: 22 },
    { n: '🔥 آذربرزین', lvl: 18, p: 45, title: '🥇 استاد', loss: [20, 40], rew: { gold: 100 }, xp: 50 },
    { n: '💀 اژدهاکش', lvl: 22, p: 55, title: '🥇 استاد', loss: [25, 50], rew: { gold: 150 }, xp: 70 },
    { n: '⚡ سام نریمان', lvl: 20, p: 50, title: '🥇 استاد', loss: [22, 45], rew: { gold: 120 }, xp: 60 },
    { n: '🛡️ نریمان گرد', lvl: 19, p: 48, title: '🥇 استاد', loss: [21, 42], rew: { gold: 110 }, xp: 55 },
    { n: '🗡️ گرشاسب', lvl: 21, p: 52, title: '🥇 استاد', loss: [24, 48], rew: { gold: 140 }, xp: 65 },
    { n: '👑 خسرو پرویز', lvl: 25, p: 65, title: '👑 لرد', loss: [30, 60], rew: { gold: 200 }, xp: 100 },
    { n: '🦅 شاهین توس', lvl: 30, p: 75, title: '👑 لرد', loss: [35, 70], rew: { gold: 300 }, xp: 150 },
    { n: '⚔️ بهمن اسفندیار', lvl: 27, p: 70, title: '👑 لرد', loss: [32, 65], rew: { gold: 250 }, xp: 120 },
    { n: '🛡️ اسفندیار', lvl: 28, p: 72, title: '👑 لرد', loss: [33, 68], rew: { gold: 280 }, xp: 140 },
    { n: '👑 کیخسرو', lvl: 26, p: 68, title: '👑 لرد', loss: [31, 62], rew: { gold: 220 }, xp: 110 },
    { n: '⚡ رعد پارس', lvl: 35, p: 90, title: '💎 اسطوره', loss: [40, 85], rew: { gold: 500 }, xp: 200 },
    { n: '🔥 سیاوش', lvl: 33, p: 85, title: '💎 اسطوره', loss: [38, 80], rew: { gold: 450 }, xp: 180 },
    { n: '👑 فریدون', lvl: 36, p: 95, title: '💎 اسطوره', loss: [42, 88], rew: { gold: 550 }, xp: 220 },
    { n: '⚔️ جمشید', lvl: 34, p: 88, title: '💎 اسطوره', loss: [39, 82], rew: { gold: 480 }, xp: 190 },
    { n: '🛡️ کاووس', lvl: 37, p: 98, title: '💎 اسطوره', loss: [44, 90], rew: { gold: 600 }, xp: 240 },
    { n: '🏆 رستم دستان', lvl: 40, p: 120, title: '🏆 جاودان', loss: [50, 100], rew: { gold: 1000 }, xp: 350 },
    { n: '🦅 زال سپیدمو', lvl: 42, p: 125, title: '🏆 جاودان', loss: [52, 105], rew: { gold: 1100 }, xp: 380 },
    { n: '⚔️ سهراب', lvl: 38, p: 115, title: '🏆 جاودان', loss: [48, 95], rew: { gold: 950 }, xp: 330 },
    { n: '👑 گشتاسب', lvl: 41, p: 122, title: '🏆 جاودان', loss: [51, 102], rew: { gold: 1050 }, xp: 360 },
    { n: '🔥 هوشنگ', lvl: 39, p: 118, title: '🏆 جاودان', loss: [49, 98], rew: { gold: 980 }, xp: 340 },
];

// ==================== 👤 مدیریت کاربر ====================
function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = {
            id: uid, name: name || 'ناشناس',
            level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5,
            wood: 20, stone: 20, bread: 2, iron: 5, gem: 0, water: 2,
            homeLvl: 1, clinicLvl: 1,
            weapon: 'none', armor: 'none',
            skills: { g: 0, h: 0, c: 0, s: 0 }, sp: 0,
            wOwned: { none: true }, aOwned: { none: true },
            arenaWins: 0, arenaLosses: 0, arenaPoints: 0,
            arenaRank: '🥉 نوآموز',
            bankGold: 0, bankInterest: 0,
            loyalty: 0, shahnamehCount: 0, pet: null,
            achievements: [], quests: [], questProgress: {},
            clan: null, lastAttacker: null, lastAttackTime: 0,
            weaponEnchant: null, cooldowns: {}, daily: {},
            stats: { fw: 0, dw: 0, bw: 0, gatherCount: 0 },
            pendingFight: null, pendingPvP: null,
            libraryCD: {}, logins: 1,
            lastBox: 0, lastPray: 0, lastLoginDate: '', lastQuestDate: '', lastBankDate: '',
        };
        rollQuests(db.users[uid]);
        saveDB();
        return db.users[uid];
    }
    const u = db.users[uid];
    if (name) u.name = name;
    u.logins = (u.logins || 0) + 1;
    u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 100;
    u.level = u.level || 1; u.xp = u.xp || 0; u.gold = u.gold || 100; u.power = u.power || 5;
    u.wood = u.wood || 0; u.stone = u.stone || 0; u.bread = u.bread || 0;
    u.iron = u.iron || 0; u.gem = u.gem || 0; u.water = u.water || 0;
    u.homeLvl = u.homeLvl || 1; u.clinicLvl = u.clinicLvl || 1;
    u.weapon = u.weapon || 'none'; u.armor = u.armor || 'none';
    u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0 }; u.sp = u.sp || 0;
    u.wOwned = u.wOwned || { none: true }; u.aOwned = u.aOwned || { none: true };
    u.arenaWins = u.arenaWins || 0; u.arenaLosses = u.arenaLosses || 0;
    u.arenaPoints = u.arenaPoints || 0; u.arenaRank = u.arenaRank || '🥉 نوآموز';
    u.bankGold = u.bankGold || 0; u.bankInterest = u.bankInterest || 0;
    u.loyalty = u.loyalty || 0; u.shahnamehCount = u.shahnamehCount || 0;
    u.pet = u.pet || null; u.achievements = u.achievements || [];
    u.quests = u.quests || []; u.questProgress = u.questProgress || {};
    u.clan = u.clan || null;
    u.lastAttacker = u.lastAttacker || null; u.lastAttackTime = u.lastAttackTime || 0;
    u.weaponEnchant = u.weaponEnchant || null;
    u.cooldowns = u.cooldowns || {}; u.daily = u.daily || {};
    u.stats = u.stats || { fw: 0, dw: 0, bw: 0, gatherCount: 0 };
    u.pendingFight = null; u.pendingPvP = null;
    u.libraryCD = u.libraryCD || {};
    u.lastBox = u.lastBox || 0; u.lastPray = u.lastPray || 0;
    u.wOwned.none = true; u.aOwned.none = true;
    
    const today = new Date().toDateString();
    if (u.lastLoginDate !== today) { u.loyalty = (u.loyalty || 0) + 5; u.lastLoginDate = today; }
    if (u.lastQuestDate !== today) { rollQuests(u); u.lastQuestDate = today; }
    if (u.lastBankDate !== today && u.bankGold > 0) {
        const interest = Math.floor(u.bankGold * 0.02);
        u.bankGold += interest;
        u.bankInterest = (u.bankInterest || 0) + interest;
        u.lastBankDate = today;
    }
    saveDB();
    return u;
}

function rollQuests(u) {
    u.quests = [
        { n: 'شکار روز', t: 'gather', g: 3, rew: { gold: 100, xp: 20 } },
        { n: 'نبردآور', t: 'fight', g: 2, rew: { gold: 150, xp: 30 } },
        { n: 'پهلوان', t: 'pvp_win', g: 1, rew: { gold: 200, xp: 40 } },
    ];
    u.questProgress = {};
    u.quests.forEach(q => u.questProgress[q.t] = 0);
}

function addXP(u, a) {
    u.xp = (u.xp || 0) + a;
    while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1; }
}

function addRes(u, k, v) { if (!u.res) u.res = {}; if (!u.res[k]) u.res[k] = 0; u.res[k] += v; if (u.res[k] < 0) u.res[k] = 0; }
function addItem(u, k, v) { if (!u.items) u.items = {}; if (!u.items[k]) u.items[k] = 0; u.items[k] += v; if (u.items[k] < 0) u.items[k] = 0; }
function hasRes(u, c) { for (const [k, v] of Object.entries(c)) { if (k === 'nl' || k === 'needLvl') continue; if ((u[k] || 0) < v) return false; } return true; }
function takeRes(u, c) { for (const [k, v] of Object.entries(c)) { if (k === 'nl' || k === 'needLvl') continue; if (k === 'wood') u.wood -= v; if (k === 'stone') u.stone -= v; if (k === 'gold') u.gold -= v; if (k === 'iron') u.iron -= v; } }
function giveReward(u, r) { if (!r) return; for (const [k, v] of Object.entries(r)) { if (k === 'gold') u.gold += v; else if (k === 'xp') addXP(u, v); else if (k === 'meat') u.meat = (u.meat || 0) + v; else if (k === 'iron') u.iron = (u.iron || 0) + v; else if (k === 'gem') u.gem = (u.gem || 0) + v; else if (k === 'fish') u.fish = (u.fish || 0) + v; else if (k === 'dragon_scale') u.dragon_scale = (u.dragon_scale || 0) + v; else if (k === 'phoenix_feather') u.phoenix_feather = (u.phoenix_feather || 0) + v; } }
function rwText(r) { if (!r) return 'ندارد'; return Object.entries(r).map(([k, v]) => { if (k === 'gold') return `🥇 ${v}`; if (k === 'xp') return `✨ ${v}`; if (k === 'meat') return `🍖 ${v}`; if (k === 'iron') return `⛓️ ${v}`; if (k === 'gem') return `💎 ${v}`; return `${v}x ${k}`; }).join(' | '); }

function updateArenaRank(u) {
    const pts = u.arenaPoints || 0;
    for (const r of ARENA_RANKS.reverse()) { if (pts >= r.min) { u.arenaRank = r.n; break; } }
}

function progressQuest(u, t) { if (!u.questProgress) u.questProgress = {}; u.questProgress[t] = (u.questProgress[t] || 0) + 1; }

// ==================== 📊 منو اصلی ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 دیوان', 'm_status'), Markup.button.callback('🌲 شکارگاه', 'm_gather')],
        [Markup.button.callback('⚔️ رزم', 'm_fight_menu'), Markup.button.callback('🏟️ میدان', 'm_arena')],
        [Markup.button.callback('🏠 کاشانه', 'm_home'), Markup.button.callback('🛒 بازار', 'm_shop')],
        [Markup.button.callback('🏪 تجهیزات', 'm_equip'), Markup.button.callback('🎭 امکانات', 'm_facilities')],
        [Markup.button.callback('📚 کتابخانه', 'm_library'), Markup.button.callback('🎁 سایر', 'm_other')],
    ]);
}

// ==================== 🔙 برگشت هوشمند ====================
function backBtn(target) {
    return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', `back_${target}`)]]);
}

bot.action(/back_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const t = ctx.match[1];
    
    const actions = {
        main: () => { const u = getUser(ctx.from.id); const text = `🏛️ «بارگاه جمشید»\n━━━━━━━━━━━━\n«که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\n🎚️ پایه: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`; try { ctx.editMessageText(text, mainMenu()); } catch (e) { ctx.reply(text, mainMenu()); } },
        status: () => bot.action('m_status')(ctx),
        gather: () => bot.action('m_gather')(ctx),
        fight_menu: () => bot.action('m_fight_menu')(ctx),
        arena: () => bot.action('m_arena')(ctx),
        home: () => bot.action('m_home')(ctx),
        shop: () => bot.action('m_shop')(ctx),
        equip: () => bot.action('m_equip')(ctx),
        armory: () => bot.action('m_armory')(ctx),
        armor_shop: () => bot.action('m_armor_shop')(ctx),
        skills: () => bot.action('m_skills')(ctx),
        facilities: () => bot.action('m_facilities')(ctx),
        pray: () => bot.action('m_pray')(ctx),
        eat: () => bot.action('m_eat')(ctx),
        npc: () => bot.action('m_npc')(ctx),
        pet: () => bot.action('m_pet')(ctx),
        quest: () => bot.action('m_quest')(ctx),
        achieve: () => bot.action('m_achieve')(ctx),
        library: () => bot.action('m_library')(ctx),
        other: () => bot.action('m_other')(ctx),
        box: () => bot.action('m_box')(ctx),
        guide: () => bot.action('m_guide')(ctx),
        cd: () => bot.action('m_cd')(ctx),
        heal: () => bot.action('m_heal')(ctx),
        bank: () => bot.action('m_bank')(ctx),
        clan: () => bot.action('m_clan')(ctx),
    };
    (actions[t] || actions.main)();
});

// ==================== 🏛️ استارت ====================
bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    let eventText = '';
    if (Math.random() < 0.15) {
        const event = EVENTS[rand(0, EVENTS.length - 1)];
        const result = event.f(u);
        eventText = `\n\n🌍 «${event.n}»\n${event.desc}\n${result}`;
    }
    saveDB();
    
    const text = `🏛️ «در بارگاه جمشید»\n━━━━━━━━━━━━━━━━\n«که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\nدرود بر تو ای پهلوان ${u.name}!\n🎚️ پایه: ${u.level} | ❤️ تندرستی: ${u.hp}/${u.maxHp} | 🥇 زر: ${u.gold}${eventText}`;
    await ctx.reply(text, mainMenu());
});

bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🏛️ بارگاه جمشید\n🎚️ پایه: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`;
    try { await ctx.editMessageText(text, mainMenu()); } catch (e) { await ctx.reply(text, mainMenu()); }
});

// ==================== 📊 دیوان ====================
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const text = `📊 «دیوان آمار»\n━━━━━━━━━━━━\n👤 ${u.name}\n🎚️ پایه: ${u.level} | ✨ ${u.xp || 0}/30\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n⚡ زور بازو: ${u.power}\n🗡️ سلاح: ${w.n}\n🛡️ زره: ${a.n}\n🐎 حیوان: ${u.pet ? PETS[u.pet]?.n : 'ندارد'}\n🏠 کاشانه: ${u.homeLvl}\n🏥 شفاخانه: ${u.clinicLvl}\n⭐ گوهر هنر: ${u.sp || 0}\n🏟️ ${u.arenaRank} | ⭐${u.arenaPoints}\n⚔️ برد: ${u.arenaWins} | 💀 باخت: ${u.arenaLosses}\n🎖️ وفاداری: ${u.loyalty}\n📚 شعر: ${u.shahnamehCount}\n🏦 خزانه: ${u.bankGold}\n🥇 زر: ${u.gold}\n🪵 ${u.wood} | 🪨 ${u.stone} | 🍞 ${u.bread} | ⛓️ ${u.iron} | 💎 ${u.gem}`;
    try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
});

// ==================== 🌲 شکارگاه ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'gather', CD.gather);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    setCD(u, 'gather');
    
    const roll = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { iron: 1, stone: 2 }, { wood: 4 }, { gold: 10 }][rand(0, 4)];
    giveReward(u, roll);
    
    let extra = '';
    if (Math.random() < 0.3) {
        const f = ['bread', 'fish', 'water', 'meat'][rand(0, 3)];
        if (f === 'bread') u.bread = (u.bread || 0) + 1;
        if (f === 'water') u.water = (u.water || 0) + 1;
        if (f === 'meat') u.meat = (u.meat || 0) + 1;
        if (f === 'fish') u.fish = (u.fish || 0) + 1;
        extra = `\n🍽️ ${f} نیز یافت شد!`;
    }
    
    u.loyalty = (u.loyalty || 0) + 1;
    u.stats.gatherCount = (u.stats.gatherCount || 0) + 1;
    progressQuest(u, 'gather');
    saveDB();
    
    const hasHorse = u.pet === 'horse';
    const text = `🌲 «شکارگاه»\n━━━━━━━━━━━━\n🪵 +چوب\n🪨 +سنگ${extra}${hasHorse ? '\n🐎 رخش سرعت بخشید!' : ''}\n⏳ ${formatTime(CD.gather)} دیگر`;
    try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
});

// ==================== ⚔️ رزم ====================
bot.action('m_fight_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '⚔️ «میدان رزم»\n━━━━━━━━━━━━\nحریف خود را برگزین:';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🐺 ددان', 'f_animals'), Markup.button.callback('👹 دیوان', 'f_demons')],
        [Markup.button.callback('👿 پلید', 'f_bosses'), Markup.button.callback('🦌 شکار', 'f_prey')],
        [Markup.button.callback('🎲 رندوم', 'f_random')],
        [Markup.button.callback('🔙 بازگشت', 'back_fight_menu')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('f_animals', async (ctx) => startFight(ctx, 'animal'));
bot.action('f_demons', async (ctx) => startFight(ctx, 'demon'));
bot.action('f_bosses', async (ctx) => startFight(ctx, 'boss'));
bot.action('f_prey', async (ctx) => startFight(ctx, 'prey'));
bot.action('f_random', async (ctx) => startFight(ctx, 'random'));

async function startFight(ctx, type) {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
    
    const pool = type === 'random' ? ALL_ENEMIES : ALL_ENEMIES.filter(e => e.type === type);
    const enemy = pool[rand(0, pool.length - 1)];
    
    if (enemy.ml && u.level < enemy.ml) return ctx.answerCbQuery(`❌ پایه ${enemy.ml} لازم است`);
    
    u.pendingFight = enemy;
    setCD(u, 'fight');
    saveDB();
    
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const ch = clamp(50 + (u.power + w.p - enemy.p) * 5, 5, 95);
    
    const text = `⚔️ ${enemy.n}\n💪 زور: ${enemy.p}\n❤️ آسیب: ${enemy.loss[0]}-${enemy.loss[1]}\n🎁 تاراج: ${rwText(enemy.rew)}\n✨ نام‌آوری: ${enemy.xp}\n🛡️ شانس: ${ch}%`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', `fg_${ALL_ENEMIES.indexOf(enemy)}`)],
        [Markup.button.callback('🏃 گریختن', 'back_fight_menu')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
}

bot.action(/fg_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const enemy = ALL_ENEMIES[parseInt(ctx.match[1])];
    if (!enemy || u.hp <= 0) return;
    
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const dogBonus = u.pet === 'dog' ? 5 : 0;
    const enchantBonus = u.weaponEnchant === '🔥 آتشین' ? 5 : 0;
    
    const pp = u.power + w.p + rand(0, 8) + dogBonus + enchantBonus;
    const ep = enemy.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(50 + (pp - ep) * 5, 5, 95);
    
    const rawDmg = rand(enemy.loss[0], enemy.loss[1]);
    const dmg = Math.max(1, rawDmg - a.d);
    u.hp = clamp(u.hp - dmg, 0, u.maxHp);
    
    let text;
    if (win) {
        giveReward(u, enemy.rew);
        addXP(u, enemy.xp);
        if (enemy.type === 'animal') u.stats.fw = (u.stats.fw || 0) + 1;
        else if (enemy.type === 'demon') u.stats.dw = (u.stats.dw || 0) + 1;
        else if (enemy.type === 'boss') u.stats.bw = (u.stats.bw || 0) + 1;
        progressQuest(u, 'fight');
        u.loyalty = (u.loyalty || 0) + 2;
        text = `⚔️ «پیروزی از آن دلیران بود»\n━━━━━━━━━━━━\nبر ${enemy.n} چیره شدی!\n✨ +${enemy.xp} نام‌آوری\n❤️ زخم: -${dmg}\n🎁 تاراج: ${rwText(enemy.rew)}\n❤️ تندرستی: ${u.hp}/${u.maxHp}`;
    } else {
        text = `💀 «ز نیرو بود مرد را راستی»\n━━━━━━━━━━━━\nاز ${enemy.n} شکست خوردی...\n❤️ زخم: -${dmg}\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n💊 رهسپار شفاخانه شو!`;
    }
    
    u.pendingFight = null;
    saveDB();
    try { await ctx.editMessageText(text, backBtn('fight_menu')); } catch (e) { await ctx.reply(text, backBtn('fight_menu')); }
});

// ==================== 🏟️ میدان پهلوانی ====================
bot.action('m_arena', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.homeLvl < 2) {
        const text = '🔒 میدان نیاز به کاشانه پایه ۲ دارد';
        try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
        return;
    }
    if (u.hp <= 0) {
        const text = '❌ تندرستی صفر! به شفاخانه برو';
        try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
        return;
    }
    
    let revengeBtn = [];
    if (u.lastAttacker && Date.now() - u.lastAttackTime < 86400000) {
        revengeBtn = [[Markup.button.callback(`⚔️ انتقام از ${u.lastAttacker}`, 'arena_revenge')]];
    }
    
    const text = `🏟️ «میدان پهلوانی»\n━━━━━━━━━━━━\n👤 ${u.name}\n🏆 ${u.arenaRank}\n⭐ امتیاز: ${u.arenaPoints}\n✅ پیروزی: ${u.arenaWins}\n❌ شکست: ${u.arenaLosses}`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ نبرد با جنگجویان', 'arena_npc')],
        [Markup.button.callback('👤 نبرد با پهلوانان', 'arena_pvp')],
        [Markup.button.callback('🏆 رده‌بندی', 'arena_ranks')],
        ...revengeBtn,
        [Markup.button.callback('🔙 بازگشت', 'back_arena')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('arena_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ تندرستی صفر!', backBtn('arena'));
    
    const suitableNPCs = FAKE_NPCS.filter(n => Math.abs(n.lvl - u.level) <= 10);
    const npc = suitableNPCs.length > 0 ? suitableNPCs[rand(0, suitableNPCs.length - 1)] : FAKE_NPCS[0];
    
    const win = rand(0, 100) < 55;
    const dmg = rand(npc.loss[0], npc.loss[1]);
    u.hp = Math.max(0, u.hp - dmg);
    
    let text;
    if (win) {
        u.gold += npc.rew.gold;
        addXP(u, npc.xp);
        u.arenaWins = (u.arenaWins || 0) + 1;
        const pts = rand(10, 30);
        u.arenaPoints = (u.arenaPoints || 0) + pts;
        updateArenaRank(u);
        text = `🏟️ ${npc.n}\n${npc.title}\n━━━━━━━━━━━━\n✅ پیروزی!\n🥇 +${npc.rew.gold} زر\n✨ +${npc.xp} نام‌آوری\n⭐ +${pts} امتیاز\n❤️ زخم: -${dmg}\n🏆 ${u.arenaRank}`;
    } else {
        u.arenaLosses = (u.arenaLosses || 0) + 1;
        text = `🏟️ ${npc.n}\n${npc.title}\n━━━━━━━━━━━━\n❌ شکست!\n❤️ زخم: -${dmg}\n💪 قوی‌تر برگرد!`;
    }
    saveDB();
    try { await ctx.editMessageText(text, backBtn('arena')); } catch (e) { await ctx.reply(text, backBtn('arena')); }
});

bot.action('arena_pvp', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ تندرستی صفر!', backBtn('arena'));
    
    const enemies = Object.values(db.users).filter(e => e.id !== u.id && (e.hp || 100) > 0);
    if (!enemies.length) {
        return ctx.editMessageText('❌ پهلوانی در میدان نیست', backBtn('arena'));
    }
    
    const enemy = enemies[rand(0, enemies.length - 1)];
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const ea = ARMORS[enemy.armor] || ARMORS.none;
    
    const mp = u.power + w.p + rand(0, 10);
    const ep = (enemy.power || 5) + ew.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(50 + (mp - ep) * 3, 10, 90);
    
    const dmg = rand(15, 40);
    u.hp = Math.max(0, u.hp - Math.max(5, dmg - a.d));
    enemy.hp = Math.max(0, (enemy.hp || 100) - Math.max(5, dmg - ea.d));
    
    enemy.lastAttacker = u.name;
    enemy.lastAttackTime = Date.now();
    
    let text;
    if (win) {
        const gr = rand(30, 80);
        u.gold += gr;
        addXP(u, 20);
        u.arenaWins = (u.arenaWins || 0) + 1;
        enemy.arenaLosses = (enemy.arenaLosses || 0) + 1;
        const pts = rand(20, 50);
        u.arenaPoints = (u.arenaPoints || 0) + pts;
        updateArenaRank(u);
        
        const taunt = TAUNTS[rand(0, TAUNTS.length - 1)];
        text = `👑 «شاهنشاه فرمودند...»\n━━━━━━━━━━━━\nبر ${enemy.name || 'ناشناس'} چیره شدی!\n${taunt}\n🥇 +${gr} زر\n⭐ +${pts} امتیاز\n❤️ زخم: -${Math.max(5, dmg - a.d)}\n🏆 ${u.arenaRank}`;
        
        try {
            await bot.telegram.sendMessage(enemy.id,
                `⚔️ ${u.name} به تو تاخت!\n━━━━━━━━━━━━\n❌ شکست خوردی!\n❤️ زخم: -${Math.max(5, dmg - ea.d)}\n\n⚔️ می‌توانی انتقام بگیری!`,
                Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', 'm_arena')]])
            );
        } catch (e) {}
    } else {
        u.arenaLosses = (u.arenaLosses || 0) + 1;
        enemy.arenaWins = (enemy.arenaWins || 0) + 1;
        text = `💀 «چرخ گردون نخواهد که بمانی»\n━━━━━━━━━━━━\nاز ${enemy.name || 'ناشناس'} شکست خوردی...\n❤️ زخم: -${Math.max(5, dmg - a.d)}\n💪 قوی‌تر برگرد!`;
    }
    saveDB();
    try { await ctx.editMessageText(text, backBtn('arena')); } catch (e) { await ctx.reply(text, backBtn('arena')); }
});

bot.action('arena_revenge', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (!u.lastAttacker || Date.now() - u.lastAttackTime > 86400000) {
        return ctx.editMessageText('⏳ زمان انتقام گذشته (۲۴ ساعت)', backBtn('arena'));
    }
    
    const enemy = Object.values(db.users).find(e => e.name === u.lastAttacker);
    if (!enemy) return ctx.editMessageText('❌ مهاجم یافت نشد', backBtn('arena'));
    if (u.hp <= 0) return ctx.editMessageText('❌ تندرستی صفر!', backBtn('arena'));
    
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const ea = ARMORS[enemy.armor] || ARMORS.none;
    
    const mp = u.power + w.p + rand(0, 15);
    const ep = (enemy.power || 5) + ew.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(55 + (mp - ep) * 3, 15, 95);
    
    const dmg = rand(20, 50);
    u.hp = Math.max(0, u.hp - Math.max(5, dmg - a.d));
    enemy.hp = Math.max(0, (enemy.hp || 100) - Math.max(5, dmg - ea.d));
    
    let text;
    if (win) {
        const gr = rand(50, 150);
        u.gold += gr;
        addXP(u, 30);
        u.arenaWins = (u.arenaWins || 0) + 1;
        enemy.arenaLosses = (enemy.arenaLosses || 0) + 1;
        const pts = rand(30, 80);
        u.arenaPoints = (u.arenaPoints || 0) + pts;
        updateArenaRank(u);
        
        text = `⚔️ «انتقام از ${enemy.name}»\n━━━━━━━━━━━━\n✅ انتقام گرفتی!\n🥇 +${gr} زر\n✨ +۳۰ نام‌آوری\n⭐ +${pts} امتیاز\n❤️ زخم: -${Math.max(5, dmg - a.d)}\n🏆 ${u.arenaRank}`;
        
        try {
            await bot.telegram.sendMessage(enemy.id,
                `⚔️ ${u.name} از تو انتقام گرفت!\n━━━━━━━━━━━━\n❌ شکست خوردی!\n❤️ زخم: -${Math.max(5, dmg - ea.d)}`
            );
        } catch (e) {}
    } else {
        u.arenaLosses = (u.arenaLosses || 0) + 1;
        enemy.arenaWins = (enemy.arenaWins || 0) + 1;
        text = `⚔️ «انتقام از ${enemy.name}»\n━━━━━━━━━━━━\n❌ باز هم شکست خوردی...\n❤️ زخم: -${Math.max(5, dmg - a.d)}\n💪 این بار دیگر نتوانستی!`;
    }
    
    u.lastAttacker = null;
    u.lastAttackTime = 0;
    saveDB();
    try { await ctx.editMessageText(text, backBtn('arena')); } catch (e) { await ctx.reply(text, backBtn('arena')); }
});

bot.action('arena_ranks', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🏆 «رده‌بندی میدان»\n━━━━━━━━━━━━\n${ARENA_RANKS.map(r => `${r.n}: ${r.min}+`).join('\n')}\n\n👤 تو: ${u.arenaRank}\n⭐ امتیاز: ${u.arenaPoints}`;
    try { await ctx.editMessageText(text, backBtn('arena')); } catch (e) { await ctx.reply(text, backBtn('arena')); }
});

// ==================== 🏠 کاشانه ====================
bot.action('m_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    let upText = '🏆 والاترین پایه';
    if (next) upText = `⬆️ برکشیدن به پایه ${u.homeLvl + 1}\n🪵 ${next.wood} | 🪨 ${next.stone} | 🥇 ${next.gold}\n🎚️ پایه لازم: ${next.needLvl}`;
    
    const btns = [];
    if (next) btns.push([Markup.button.callback('⬆️ برکشیدن', 'up_home')]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_home')]);
    
    const text = `🏠 «کاشانه» پایه ${u.homeLvl}\n🏥 شفاخانه پایه ${u.clinicLvl}\n\n${upText}`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action('up_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    if (!next) return ctx.answerCbQuery('🏆 والاترین پایه');
    if (u.level < next.needLvl) return ctx.answerCbQuery(`❌ پایه ${next.needLvl} لازم است`);
    if (!hasRes(u, next)) return ctx.answerCbQuery('❌ کالا کم است');
    
    takeRes(u, next);
    u.homeLvl++;
    if (u.homeLvl >= 9) u.clinicLvl = 7;
    else if (u.homeLvl >= 7) u.clinicLvl = 5;
    else if (u.homeLvl >= 5) u.clinicLvl = 3;
    else if (u.homeLvl >= 3) u.clinicLvl = 2;
    saveDB();
    
    const text = `🏠 کاشانه پایه ${u.homeLvl}\n🏥 شفاخانه پایه ${u.clinicLvl}\n✅ برکشیده شد!`;
    try { await ctx.editMessageText(text, backBtn('home')); } catch (e) { await ctx.reply(text, backBtn('home')); }
});

// ==================== 🛒 بازار ====================
bot.action('m_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.homeLvl < 2) {
        const text = '🔒 بازار نیاز به کاشانه پایه ۲ دارد';
        try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
        return;
    }
    
    const text = `🛒 «بازار بزرگ ری»\n━━━━━━━━━━━━\n🪵 چوب: خرید ۸ | فروش ۴\n🪨 سنگ: خرید ۱۰ | فروش ۵\n🍞 نان: خرید ۱۰ | فروش ۵\n⛓️ آهن: خرید ۲۵ | فروش ۱۲\n💎 گوهر: خرید ۱۲۰ | فروش ۶۰\n\n📝 بدون / بنویس:\nخرید ۱۰ چوب\nفروش ۵ سنگ`;
    try { await ctx.editMessageText(text, backBtn('shop')); } catch (e) { await ctx.reply(text, backBtn('shop')); }
});

// خرید بدون کامند
bot.hears(/^خرید (\d+) (چوب|سنگ|نان|آهن|گوهر)$/, async (ctx) => {
    const u = getUser(ctx.from.id);
    if (u.homeLvl < 2) return ctx.reply('🔒 بازار نیاز به کاشانه پایه ۲ دارد');
    
    const amt = parseInt(ctx.match[1]);
    const item = ctx.match[2];
    const prices = { چوب: 8, سنگ: 10, نان: 10, آهن: 25, گوهر: 120 };
    const total = prices[item] * amt;
    
    if (u.gold < total) return ctx.reply(`❌ ${total} زر لازم داری\n💰 موجودی: ${u.gold} زر`);
    
    u.gold -= total;
    if (item === 'چوب') u.wood = (u.wood || 0) + amt;
    if (item === 'سنگ') u.stone = (u.stone || 0) + amt;
    if (item === 'نان') u.bread = (u.bread || 0) + amt;
    if (item === 'آهن') u.iron = (u.iron || 0) + amt;
    if (item === 'گوهر') u.gem = (u.gem || 0) + amt;
    saveDB();
    await ctx.reply(`✅ ${amt} ${item} خریداری شد\n💰 ${u.gold} زر`);
});

// فروش بدون کامند
bot.hears(/^فروش (\d+) (چوب|سنگ|نان|آهن|گوهر)$/, async (ctx) => {
    const u = getUser(ctx.from.id);
    if (u.homeLvl < 2) return ctx.reply('🔒 بازار نیاز به کاشانه پایه ۲ دارد');
    
    const amt = parseInt(ctx.match[1]);
    const item = ctx.match[2];
    const prices = { چوب: 4, سنگ: 5, نان: 5, آهن: 12, گوهر: 60 };
    const has = { چوب: u.wood || 0, سنگ: u.stone || 0, نان: u.bread || 0, آهن: u.iron || 0, گوهر: u.gem || 0 };
    
    if (has[item] < amt) return ctx.reply(`❌ به اندازه کافی ${item} نداری\n📦 موجودی: ${has[item]}`);
    
    if (item === 'چوب') u.wood -= amt;
    if (item === 'سنگ') u.stone -= amt;
    if (item === 'نان') u.bread -= amt;
    if (item === 'آهن') u.iron -= amt;
    if (item === 'گوهر') u.gem -= amt;
    u.gold += prices[item] * amt;
    saveDB();
    await ctx.reply(`✅ ${amt} ${item} فروخته شد\n💰 ${u.gold} زر`);
});

// خرید با کامند
bot.command('خرید', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (u.homeLvl < 2) return ctx.reply('🔒 بازار نیاز به کاشانه پایه ۲ دارد');
    
    const args = ctx.message.text.split(' ').slice(1);
    const amt = parseInt(args[0]) || 1;
    const item = args[1];
    const prices = { چوب: 8, سنگ: 10, نان: 10, آهن: 25, گوهر: 120 };
    
    if (!prices[item]) return ctx.reply('❌ کالا نامعتبر\n📝 /خرید [تعداد] [کالا]\n📋 چوب | سنگ | نان | آهن | گوهر');
    
    const total = prices[item] * amt;
    if (u.gold < total) return ctx.reply(`❌ ${total} زر لازم داری`);
    
    u.gold -= total;
    if (item === 'چوب') u.wood = (u.wood || 0) + amt;
    if (item === 'سنگ') u.stone = (u.stone || 0) + amt;
    if (item === 'نان') u.bread = (u.bread || 0) + amt;
    if (item === 'آهن') u.iron = (u.iron || 0) + amt;
    if (item === 'گوهر') u.gem = (u.gem || 0) + amt;
    saveDB();
    await ctx.reply(`✅ ${amt} ${item} خریداری شد\n💰 ${u.gold} زر`);
});

// فروش با کامند
bot.command('فروش', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (u.homeLvl < 2) return ctx.reply('🔒 بازار نیاز به کاشانه پایه ۲ دارد');
    
    const args = ctx.message.text.split(' ').slice(1);
    const amt = parseInt(args[0]) || 1;
    const item = args[1];
    const prices = { چوب: 4, سنگ: 5, نان: 5, آهن: 12, گوهر: 60 };
    
    if (!prices[item]) return ctx.reply('❌ کالا نامعتبر\n📝 /فروش [تعداد] [کالا]\n📋 چوب | سنگ | نان | آهن | گوهر');
    
    const has = { چوب: u.wood || 0, سنگ: u.stone || 0, نان: u.bread || 0, آهن: u.iron || 0, گوهر: u.gem || 0 };
    if (has[item] < amt) return ctx.reply(`❌ به اندازه کافی ${item} نداری`);
    
    if (item === 'چوب') u.wood -= amt;
    if (item === 'سنگ') u.stone -= amt;
    if (item === 'نان') u.bread -= amt;
    if (item === 'آهن') u.iron -= amt;
    if (item === 'گوهر') u.gem -= amt;
    u.gold += prices[item] * amt;
    saveDB();
    await ctx.reply(`✅ ${amt} ${item} فروخته شد\n💰 ${u.gold} زر`);
});

// ==================== 🏦 خزانه ====================
bot.action('m_bank', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🏦 «خزانه شاهی»\n━━━━━━━━━━━━\n💰 اندوخته: ${u.bankGold} زر\n📈 سود کل: ${u.bankInterest || 0} زر\n💎 سود روزانه: ۲٪\n\n📝 سپرده ۱۰۰ زر\n📝 برداشت ۵۰ زر\n\n📝 /سپرده [مقدار]\n📝 /برداشت [مقدار]`;
    try { await ctx.editMessageText(text, backBtn('bank')); } catch (e) { await ctx.reply(text, backBtn('bank')); }
});

// سپرده بدون کامند
bot.hears(/^سپرده (\d+) زر$/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const amt = parseInt(ctx.match[1]);
    if (amt <= 0) return ctx.reply('❌ شمار نادرست');
    if (u.gold < amt) return ctx.reply(`❌ زر کافی نداری\n💰 موجودی: ${u.gold} زر`);
    u.gold -= amt;
    u.bankGold = (u.bankGold || 0) + amt;
    saveDB();
    await ctx.reply(`✅ ${amt} زر به خزانه سپرده شد\n🏦 اندوخته: ${u.bankGold}\n💰 همراه: ${u.gold}`);
});

// برداشت بدون کامند
bot.hears(/^برداشت (\d+) زر$/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const amt = parseInt(ctx.match[1]);
    if (amt <= 0) return ctx.reply('❌ شمار نادرست');
    if ((u.bankGold || 0) < amt) return ctx.reply(`❌ اندوخته کافی نیست\n🏦 موجودی: ${u.bankGold} زر`);
    u.bankGold -= amt;
    u.gold += amt;
    saveDB();
    await ctx.reply(`✅ ${amt} زر از خزانه برداشت شد\n💰 همراه: ${u.gold}\n🏦 اندوخته: ${u.bankGold}`);
});

// سپرده با کامند
bot.command('سپرده', async (ctx) => {
    const u = getUser(ctx.from.id);
    const amt = parseInt(ctx.message.text.split(' ')[1]) || 0;
    if (amt <= 0) return ctx.reply('❌ شمار نادرست\n📝 /سپرده [مقدار]');
    if (u.gold < amt) return ctx.reply(`❌ زر کافی نداری`);
    u.gold -= amt;
    u.bankGold = (u.bankGold || 0) + amt;
    saveDB();
    await ctx.reply(`✅ ${amt} زر به خزانه سپرده شد\n🏦 ${u.bankGold}`);
});

// برداشت با کامند
bot.command('برداشت', async (ctx) => {
    const u = getUser(ctx.from.id);
    const amt = parseInt(ctx.message.text.split(' ')[1]) || 0;
    if (amt <= 0) return ctx.reply('❌ شمار نادرست\n📝 /برداشت [مقدار]');
    if ((u.bankGold || 0) < amt) return ctx.reply(`❌ اندوخته کافی نیست`);
    u.bankGold -= amt;
    u.gold += amt;
    saveDB();
    await ctx.reply(`✅ ${amt} زر برداشت شد\n💰 ${u.gold}`);
});

// ==================== 🏥 شفاخانه ====================
bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cost = 10 + (u.clinicLvl - 1) * 5;
    const healAmt = 30 + (u.clinicLvl - 1) * 20;
    
    const text = `🏥 «شفاخانه» پایه ${u.clinicLvl}\n━━━━━━━━━━━━\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n💰 هزینه درمان: ${cost} زر\n💊 میزان درمان: +${healAmt} HP\n\n📝 /درمان - درمان سریع`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback(`💊 درمان (${cost} زر)`, 'do_heal')],
        [Markup.button.callback('🔙 بازگشت', 'back_heal')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('do_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cost = 10 + (u.clinicLvl - 1) * 5;
    const healAmt = 30 + (u.clinicLvl - 1) * 20;
    
    if (u.hp >= u.maxHp) return ctx.answerCbQuery('❤️ تندرستی کامل است');
    if (u.gold < cost) return ctx.answerCbQuery(`❌ ${cost} زر لازم داری`);
    
    u.gold -= cost;
    u.hp = Math.min(u.maxHp, u.hp + healAmt);
    saveDB();
    
    const text = `✅ درمان شدی!\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n💰 هزینه: ${cost} زر\n🥇 زر: ${u.gold}`;
    try { await ctx.editMessageText(text, backBtn('heal')); } catch (e) { await ctx.reply(text, backBtn('heal')); }
});

// درمان با کامند
bot.command('درمان', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cost = 10 + (u.clinicLvl - 1) * 5;
    const healAmt = 30 + (u.clinicLvl - 1) * 20;
    
    if (u.hp >= u.maxHp) return ctx.reply('❤️ تندرستی کامل است');
    if (u.gold < cost) return ctx.reply(`❌ ${cost} زر لازم داری`);
    
    u.gold -= cost;
    u.hp = Math.min(u.maxHp, u.hp + healAmt);
    saveDB();
    await ctx.reply(`✅ درمان شدی!\n❤️ ${u.hp}/${u.maxHp}\n💰 ${u.gold} زر`);
});

// ==================== 🏪 تجهیزات ====================
bot.action('m_equip', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🏪 «تجهیزات»\n━━━━━━━━━━━━';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🛠️ اسلحه‌خانه', 'm_armory'), Markup.button.callback('🛡️ زره‌خانه', 'm_armor_shop')],
        [Markup.button.callback('⭐ هنرستان', 'm_skills')],
        [Markup.button.callback('🔙 بازگشت', 'back_equip')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

// ==================== 🛠️ اسلحه‌خانه ====================
bot.action('m_armory', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(WEAPONS)
        .filter(([k]) => k !== 'none')
        .map(([k, w]) => [Markup.button.callback(
            `${u.wOwned && u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''} (⚡${w.p})`,
            u.wOwned && u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`
        )]);
    
    btns.push([Markup.button.callback('🔥 ارتقای سلاح', 'enchant_w')]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_armory')]);
    
    const text = `🛠️ «آهنگری کاوه»\n━━━━━━━━━━━━\n🗡️ در دست: ${WEAPONS[u.weapon]?.n || 'نداری'}${u.weaponEnchant ? ' ' + u.weaponEnchant : ''}\n\nبرای ساخت یا تجهیز برگزین:`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/cr_w_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    const w = WEAPONS[k];
    if (!w) return ctx.answerCbQuery('❌ سلاح نامعتبر');
    if (u.level < w.lvl) return ctx.answerCbQuery(`❌ پایه ${w.lvl} لازم است`);
    if (u.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} زر لازم داری`);
    
    u.gold -= w.price;
    if (!u.wOwned) u.wOwned = { none: true };
    u.wOwned[k] = true;
    saveDB();
    await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    if (!u.wOwned || !u.wOwned[k]) return ctx.answerCbQuery('❌ این سلاح را نداری');
    u.weapon = k;
    saveDB();
    await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n} برگرفته شد`);
});

bot.action('enchant_w', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.weapon === 'none') return ctx.answerCbQuery('❌ سلاحی نداری');
    if (u.weaponEnchant) return ctx.answerCbQuery('❌ پیشتر ارتقا یافته');
    
    const text = `🔥 «ارتقای سلاح» (۵۰۰ زر)\n━━━━━━━━━━━━\n🔥 آتشین: زور +۵\n❄️ یخی: کندی دشمن\n💀 زهرآگین: زخم تدریجی\n⚡ الکتریکی: شانس ضربه مضاعف\n🌿 مقدس: درمان هنگام نبرد\n\n📝 /ارتقا [آتش|یخ|زهر|برق|مقدس]`;
    try { await ctx.editMessageText(text, backBtn('armory')); } catch (e) { await ctx.reply(text, backBtn('armory')); }
});

bot.command('ارتقا', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const type = args[1];
    
    const enchants = {
        'آتش': '🔥 آتشین',
        'یخ': '❄️ یخی',
        'زهر': '💀 زهرآگین',
        'برق': '⚡ الکتریکی',
        'مقدس': '🌿 مقدس',
    };
    
    if (!enchants[type]) return ctx.reply('❌ نوع ارتقا نامعتبر\n📝 /ارتقا [آتش|یخ|زهر|برق|مقدس]');
    if (u.weapon === 'none') return ctx.reply('❌ سلاحی نداری');
    if (u.weaponEnchant) return ctx.reply('❌ پیشتر ارتقا یافته');
    if (u.gold < 500) return ctx.reply('❌ ۵۰۰ زر لازم داری');
    
    u.gold -= 500;
    u.weaponEnchant = enchants[type];
    saveDB();
    await ctx.reply(`✅ سلاح ${enchants[type]} شد!\n⚔️ ${WEAPONS[u.weapon]?.n} ${enchants[type]}`);
});

bot.command('ساخت', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const k = args[1];
    const w = WEAPONS[k];
    if (!w || k === 'none') return ctx.reply('❌ سلاح نامعتبر');
    if (u.level < w.lvl) return ctx.reply(`❌ پایه ${w.lvl} لازم است`);
    if (u.gold < w.price) return ctx.reply(`❌ ${w.price} زر لازم داری`);
    u.gold -= w.price;
    if (!u.wOwned) u.wOwned = { none: true };
    u.wOwned[k] = true;
    saveDB();
    await ctx.reply(`✅ ${w.n} ساخته شد!`);
});

bot.command('برگرفتن', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const k = args[1];
    if (!u.wOwned || !u.wOwned[k]) return ctx.reply('❌ این سلاح را نداری');
    u.weapon = k;
    saveDB();
    await ctx.reply(`⚔️ ${WEAPONS[k].n} برگرفته شد`);
});

// ==================== 🛡️ زره‌خانه ====================
bot.action('m_armor_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(ARMORS)
        .filter(([k]) => k !== 'none')
        .map(([k, a]) => [Markup.button.callback(
            `${u.aOwned && u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''} (🛡️${a.d})`,
            u.aOwned && u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`
        )]);
    
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_armor_shop')]);
    
    const text = `🛡️ «زرادخانه»\n━━━━━━━━━━━━\n🛡️ بر تن: ${ARMORS[u.armor]?.n || 'نداری'}\n\nبرای ساخت یا پوشیدن برگزین:`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/cr_a_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    const a = ARMORS[k];
    if (!a) return ctx.answerCbQuery('❌ زره نامعتبر');
    if (u.level < a.lvl) return ctx.answerCbQuery(`❌ پایه ${a.lvl} لازم است`);
    if (u.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} زر لازم داری`);
    
    u.gold -= a.price;
    if (!u.aOwned) u.aOwned = { none: true };
    u.aOwned[k] = true;
    saveDB();
    await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    if (!u.aOwned || !u.aOwned[k]) return ctx.answerCbQuery('❌ این زره را نداری');
    u.armor = k;
    saveDB();
    await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n} پوشیده شد`);
});

bot.command('ساخت_زره', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const k = args[1];
    const a = ARMORS[k];
    if (!a || k === 'none') return ctx.reply('❌ زره نامعتبر');
    if (u.level < a.lvl) return ctx.reply(`❌ پایه ${a.lvl} لازم است`);
    if (u.gold < a.price) return ctx.reply(`❌ ${a.price} زر لازم داری`);
    u.gold -= a.price;
    if (!u.aOwned) u.aOwned = { none: true };
    u.aOwned[k] = true;
    saveDB();
    await ctx.reply(`✅ ${a.n} ساخته شد!`);
});

// ==================== ⭐ ۱۰ مهارت ====================
const SKILLS = {
    g: { n: '⛏️ دروگری', desc: 'شانس یافتن منابع بیشتر', max: 10 },
    h: { n: '🏹 کمانداری', desc: 'زور بیشتر در نبرد با کمان', max: 10 },
    c: { n: '🔨 آهنگری', desc: 'کاهش هزینه ساخت سلاح', max: 10 },
    s: { n: '🏕️ کوهنوردی', desc: 'کاهش گرسنگی و تشنگی', max: 10 },
    a: { n: '⚔️ شمشیرزنی', desc: 'زور بیشتر با شمشیر', max: 10 },
    d: { n: '🛡️ دفاع', desc: 'دفاع بیشتر در نبرد', max: 10 },
    t: { n: '🏹 تیراندازی', desc: 'دقت بیشتر در شکار', max: 10 },
    m: { n: '💊 پزشکی', desc: 'درمان بهتر در شفاخانه', max: 10 },
    l: { n: '📜 ادبیات', desc: 'پاداش بیشتر از کتابخانه', max: 10 },
    w: { n: '💧 آب‌یابی', desc: 'یافتن آب در شکارگاه', max: 10 },
};

bot.action('m_skills', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (!u.skills) u.skills = { g: 0, h: 0, c: 0, s: 0, a: 0, d: 0, t: 0, m: 0, l: 0, w: 0 };
    
    const skillList = Object.entries(SKILLS)
        .map(([k, v]) => `${v.n}: ${u.skills[k] || 0}/${v.max}`)
        .join('\n');
    
    const text = `⭐ «هنرستان رستم»\n━━━━━━━━━━━━\n«هنر نزد ایرانیان است و بس»\n\nگوهر هنر: ${u.sp || 0}\n\n${skillList}\n\n📝 /هنر [کلید] - ارتقای مهارت`;
    
    const btns = [
        [Markup.button.callback('⛏️ دروگری', 'sk_g'), Markup.button.callback('🏹 کمانداری', 'sk_h')],
        [Markup.button.callback('🔨 آهنگری', 'sk_c'), Markup.button.callback('🏕️ کوهنوردی', 'sk_s')],
        [Markup.button.callback('⚔️ شمشیرزنی', 'sk_a'), Markup.button.callback('🛡️ دفاع', 'sk_d')],
        [Markup.button.callback('🏹 تیراندازی', 'sk_t'), Markup.button.callback('💊 پزشکی', 'sk_m')],
        [Markup.button.callback('📜 ادبیات', 'sk_l'), Markup.button.callback('💧 آب‌یابی', 'sk_w')],
        [Markup.button.callback('🔙 بازگشت', 'back_skills')],
    ];
    
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/sk_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    if (!u.sp || u.sp <= 0) return ctx.answerCbQuery('❌ گوهر هنر نداری');
    if (!u.skills) u.skills = {};
    if ((u.skills[k] || 0) >= 10) return ctx.answerCbQuery('❌ به اوج رسیده');
    
    u.skills[k] = (u.skills[k] || 0) + 1;
    u.sp--;
    saveDB();
    await ctx.answerCbQuery(`✅ ${SKILLS[k].n}: ${u.skills[k]}/10`);
});

bot.command('هنر', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const k = args[1];
    
    if (!SKILLS[k]) return ctx.reply('❌ مهارت نامعتبر\n📝 /هنر [g|h|c|s|a|d|t|m|l|w]');
    if (!u.sp || u.sp <= 0) return ctx.reply('❌ گوهر هنر نداری');
    if (!u.skills) u.skills = {};
    if ((u.skills[k] || 0) >= 10) return ctx.reply('❌ به اوج رسیده');
    
    u.skills[k] = (u.skills[k] || 0) + 1;
    u.sp--;
    saveDB();
    await ctx.reply(`✅ ${SKILLS[k].n}: ${u.skills[k]}/10`);
});

// ==================== 🎭 امکانات ====================
bot.action('m_facilities', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🎭 «امکانات»\n━━━━━━━━━━━━';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🕯️ آتشکده', 'm_pray'), Markup.button.callback('🍽️ سفره', 'm_eat')],
        [Markup.button.callback('👤 بزرگان', 'm_npc'), Markup.button.callback('🐎 حیوانات', 'm_pet')],
        [Markup.button.callback('📋 مأموریت', 'm_quest'), Markup.button.callback('🏆 دستاورد', 'm_achieve')],
        [Markup.button.callback('🔙 بازگشت', 'back_facilities')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

// ==================== 🕯️ آتشکده (۴ گزینه) ====================
bot.action('m_pray', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'pray', CD.pray);
    
    const text = `🕯️ «آتشکده آذر»\n━━━━━━━━━━━━\n🔥 «پرستیدن دادگر دین ماست\nهمین راه و رسم و آیین ماست»\n\nچهار گونه نیایش:\n🤲 دعا: نام‌آوری (XP)\n🧎 نماز: زر + نام‌آوری\n📖 روضه: وفاداری + شعر\n🙏 مناجات: تندرستی + وفاداری\n\n⏱️ ${cd.can ? '✅ آماده نیایش' : '⏳ ' + formatTime(cd.rem)}`;
    
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🤲 دعا', 'pray_dua'), Markup.button.callback('🧎 نماز', 'pray_namaz')],
        [Markup.button.callback('📖 روضه', 'pray_rozeh'), Markup.button.callback('🙏 مناجات', 'pray_monajat')],
        [Markup.button.callback('🔙 بازگشت', 'back_pray')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action(['pray_dua', 'pray_namaz', 'pray_rozeh', 'pray_monajat'], async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'pray', CD.pray);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'pray');
    u.prayCount = (u.prayCount || 0) + 1;
    u.loyalty = (u.loyalty || 0) + 3;
    
    const prayType = ctx.match[0];
    let reward = '';
    
    if (prayType === 'pray_dua') {
        const xpGain = u.level <= 3 ? 60 : 30;
        addXP(u, xpGain);
        reward = `✨ +${xpGain} نام‌آوری`;
    } else if (prayType === 'pray_namaz') {
        u.gold += 30;
        addXP(u, 20);
        reward = `🥇 +۳۰ زر | ✨ +۲۰ نام‌آوری`;
    } else if (prayType === 'pray_rozeh') {
        u.loyalty = (u.loyalty || 0) + 8;
        u.shahnamehCount = (u.shahnamehCount || 0) + 1;
        reward = `⭐ +۸ وفاداری | 📚 +۱ شعر`;
    } else if (prayType === 'pray_monajat') {
        u.hp = Math.min(u.maxHp, u.hp + 50);
        u.loyalty = (u.loyalty || 0) + 5;
        reward = `❤️ +۵۰ تندرستی | ⭐ +۵ وفاداری`;
    }
    
    progressQuest(u, 'pray');
    saveDB();
    
    const names = { pray_dua: 'دعا', pray_namaz: 'نماز', pray_rozeh: 'روضه', pray_monajat: 'مناجات' };
    const text = `🕯️ «اهورامزدا شنید»\n━━━━━━━━━━━━\n${names[prayType]}ت پذیرفته شد!\n${reward}\n🎚️ پایه: ${u.level}\n🕯️ نیایش‌ها: ${u.prayCount}\n\n🔥 «آتش مقدس خاموش مباد!»`;
    try { await ctx.editMessageText(text, backBtn('pray')); } catch (e) { await ctx.reply(text, backBtn('pray')); }
});

// ==================== 🍽️ سفره (۱۰ غذا + ۱۰ نوشیدنی) ====================
bot.action('m_eat', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🍽️ «سفره ایرانی»\n━━━━━━━━━━━━\n«بفرمود تا سفره گستردند»';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🍞 نان', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat'), Markup.button.callback('🐟 ماهی', 'e_fish')],
        [Markup.button.callback('🍗 ماکیان', 'e_chicken'), Markup.button.callback('🥩 گوشت', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
        [Markup.button.callback('🍜 آش', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake'), Markup.button.callback('🍯 انگبین', 'e_honey')],
        [Markup.button.callback('🍚 چلوکباب', 'e_rice')],
        [Markup.button.callback('💧 آب', 'd_water'), Markup.button.callback('🧃 شربت', 'd_juice'), Markup.button.callback('🍺 دوغ', 'd_soda')],
        [Markup.button.callback('🍵 چای', 'd_tea'), Markup.button.callback('☕ قهوه', 'd_coffee'), Markup.button.callback('🥛 شیر', 'd_milk')],
        [Markup.button.callback('🍹 سکنجبین', 'd_sherbet'), Markup.button.callback('🍎 آب انار', 'd_pomegranate')],
        [Markup.button.callback('🌹 گلاب', 'd_rosewater'), Markup.button.callback('🥤 ماست', 'd_yogurt')],
        [Markup.button.callback('🔙 بازگشت', 'back_eat')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action(/e_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    const has = {
        bread: u.bread || 0, meat: u.meat || 0, fish: u.fish || 0,
        chicken: u.chicken || 0, steak: u.steak || 0, stew: u.stew || 0,
        noodle: u.noodle || 0, cake: u.cake || 0, honey: u.honey || 0, rice: u.rice || 0,
    };
    
    if ((has[k] || 0) < 1) return ctx.answerCbQuery(`❌ ${FOODS[k]?.n || k} نداری`);
    
    const food = FOODS[k];
    if (!food) return ctx.answerCbQuery('❌');
    
    if (k === 'bread') u.bread--; if (k === 'meat') u.meat--;
    if (k === 'fish') u.fish--; if (k === 'chicken') u.chicken--;
    if (k === 'steak') u.steak--; if (k === 'stew') u.stew--;
    if (k === 'noodle') u.noodle--; if (k === 'cake') u.cake--;
    if (k === 'honey') u.honey--; if (k === 'rice') u.rice--;
    
    if (food.h) u.hunger = Math.min(u.maxHp, (u.hunger || 100) + food.h);
    if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal);
    saveDB();
    await ctx.answerCbQuery(`✅ ${food.n} نوش جان`);
});

bot.action(/d_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    const has = {
        water: u.water || 0, juice: u.juice || 0, soda: u.soda || 0,
        tea: u.tea || 0, coffee: u.coffee || 0, milk: u.milk || 0,
        sherbet: u.sherbet || 0, pomegranate: u.pomegranate || 0,
        rosewater: u.rosewater || 0, yogurt: u.yogurt || 0,
    };
    
    if ((has[k] || 0) < 1) return ctx.answerCbQuery(`❌ ${DRINKS[k]?.n || k} نداری`);
    
    const drink = DRINKS[k];
    if (!drink) return ctx.answerCbQuery('❌');
    
    if (k === 'water') u.water--; if (k === 'juice') u.juice--;
    if (k === 'soda') u.soda--; if (k === 'tea') u.tea--;
    if (k === 'coffee') u.coffee--; if (k === 'milk') u.milk--;
    if (k === 'sherbet') u.sherbet--; if (k === 'pomegranate') u.pomegranate--;
    if (k === 'rosewater') u.rosewater--; if (k === 'yogurt') u.yogurt--;
    
    if (drink.t) u.thirst = Math.min(u.maxHp, (u.thirst || 100) + drink.t);
    if (drink.xp) addXP(u, drink.xp);
    if (drink.heal) u.hp = Math.min(u.maxHp, u.hp + drink.heal);
    saveDB();
    await ctx.answerCbQuery(`✅ ${drink.n} نوش جان`);
});

// ==================== 👤 بزرگان (۱۰ NPC) ====================
bot.action('m_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'npc', CD.npc);
    
    const btns = Object.entries(NPCS).map(([k, n]) => [
        Markup.button.callback(`${n.n}: ${n.price} زر`, `npc_${k}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_npc')]);
    
    const text = `👤 «بزرگان پارس»\n━━━━━━━━━━━━\n${cd.can ? '✅ آماده دیدار' : '⏳ ' + formatTime(cd.rem)}\n\nبا یکی از بزرگان مشورت کن:`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/npc_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const npc = NPCS[k];
    const u = getUser(ctx.from.id);
    if (!npc) return;
    
    const cd = checkCD(u, 'npc', CD.npc);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    if (u.gold < npc.price) return ctx.answerCbQuery(`❌ ${npc.price} زر لازم داری`);
    
    u.gold -= npc.price;
    const result = npc.f(u);
    setCD(u, 'npc');
    saveDB();
    
    const text = `👤 ${npc.n}\n━━━━━━━━━━━━\n${result}\n\n📜 حکمت آموخته شد`;
    try { await ctx.editMessageText(text, backBtn('npc')); } catch (e) { await ctx.reply(text, backBtn('npc')); }
});

// ==================== 🐎 حیوانات (۱۰ عدد) ====================
bot.action('m_pet', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cur = u.pet ? PETS[u.pet]?.n : 'نداری';
    
    const btns = Object.entries(PETS).map(([k, p]) => [
        Markup.button.callback(`${p.n}: ${p.bonus} (${p.price} زر)`, `buy_pet_${k}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_pet')]);
    
    const text = `🐎 «حیوانات خونگی»\n━━━━━━━━━━━━\nحیوان کنونی: ${cur}\n\nیک همراه برگزین:`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/buy_pet_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const pet = PETS[k];
    const u = getUser(ctx.from.id);
    if (!pet) return;
    if (u.pet) return ctx.answerCbQuery('❌ پیشتر حیوان داری');
    if (u.gold < pet.price) return ctx.answerCbQuery(`❌ ${pet.price} زر لازم داری`);
    
    u.gold -= pet.price;
    u.pet = k;
    saveDB();
    
    const text = `🐎 ${pet.n} همراه تو شد!\n✨ ${pet.bonus}`;
    try { await ctx.editMessageText(text, backBtn('pet')); } catch (e) { await ctx.reply(text, backBtn('pet')); }
});

// ==================== 📋 مأموریت ====================
bot.action('m_quest', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.quests || !u.quests.length) rollQuests(u);
    
    const text = ['📋 «مأموریت‌های روزانه»\n━━━━━━━━━━━━\n'];
    u.quests.forEach(q => {
        const prog = u.questProgress[q.t] || 0;
        const done = prog >= q.g;
        text.push(`${done ? '✅' : '⏳'} ${q.n}: ${prog}/${q.g}`);
        text.push(`   🎁 ${rwText(q.rew)}`);
    });
    text.push('\n📝 /دریافت_مأموریت');
    
    try { await ctx.editMessageText(text.join('\n'), backBtn('quest')); } catch (e) { await ctx.reply(text.join('\n'), backBtn('quest')); }
});

bot.command('دریافت_مأموریت', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u.quests || !u.quests.length) return ctx.reply('❌ مأموریتی نداری');
    
    let claimed = false;
    for (const q of u.quests) {
        const prog = u.questProgress[q.t] || 0;
        if (prog >= q.g && !q.claimed) {
            giveReward(u, q.rew);
            if (q.rew.xp) addXP(u, q.rew.xp);
            q.claimed = true;
            claimed = true;
        }
    }
    
    if (!claimed) return ctx.reply('❌ هیچ مأموریتی کامل نشده');
    saveDB();
    await ctx.reply('✅ جایزه مأموریت‌ها دریافت شد!');
});

// ==================== 🏆 دستاورد ====================
bot.action('m_achieve', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const achievements = [
        { id: 'first_blood', n: '🩸 اولین خون', desc: '۱ برد در نبرد', check: u => (u.stats?.fw || 0) + (u.stats?.dw || 0) >= 1 },
        { id: 'warrior', n: '⚔️ جنگجو', desc: '۱۰ برد در نبرد', check: u => (u.stats?.fw || 0) + (u.stats?.dw || 0) >= 10 },
        { id: 'hero', n: '🏆 پهلوان', desc: '۵۰ برد', check: u => (u.stats?.fw || 0) + (u.stats?.dw || 0) >= 50 },
        { id: 'pvp_king', n: '👑 سلطان میدان', desc: '۱۰۰ برد میدان', check: u => (u.arenaWins || 0) >= 100 },
        { id: 'rich', n: '💰 خزانه‌دار', desc: '۱۰۰۰۰ طلا', check: u => u.gold >= 10000 },
        { id: 'builder', n: '🏠 معمار', desc: 'کاشانه پایه ۱۰', check: u => u.homeLvl >= 10 },
        { id: 'collector', n: '⛏️ گردآور', desc: '۱۰۰ شکار', check: u => (u.stats?.gatherCount || 0) >= 100 },
        { id: 'shahnameh', n: '📚 شاعر', desc: '۲۰ شعر', check: u => (u.shahnamehCount || 0) >= 20 },
        { id: 'loyal', n: '⭐ وفادار', desc: '۵۰۰ وفاداری', check: u => (u.loyalty || 0) >= 500 },
        { id: 'boss_slayer', n: '🐉 اژدهاکش', desc: '۱۰ موجود پلید', check: u => (u.stats?.bw || 0) >= 10 },
    ];
    
    let text = ['🏆 «دستاوردهای پهلوانی»\n━━━━━━━━━━━━\n'];
    let count = 0;
    
    for (const ach of achievements) {
        const earned = u.achievements?.includes(ach.id);
        if (earned) count++;
        if (!earned && ach.check(u)) {
            if (!u.achievements) u.achievements = [];
            u.achievements.push(ach.id);
            text.push(`🎉 نو: ${ach.n}`);
        }
        text.push(`${earned || u.achievements?.includes(ach.id) ? '✅' : '🔒'} ${ach.n}: ${ach.desc}`);
    }
    
    text.push(`\n📊 ${count}/${achievements.length} دستاورد`);
    saveDB();
    
    try { await ctx.editMessageText(text.join('\n'), backBtn('achieve')); } catch (e) { await ctx.reply(text.join('\n'), backBtn('achieve')); }
});

// ==================== 📚 کتابخانه (۱۰ کتاب) ====================
bot.action('m_library', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(LIBRARY).map(([k, v]) => [
        Markup.button.callback(`${v.name} - ${v.poet}`, `lib_${k}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_library')]);
    
    const text = `📚 «گنجینه پارس»\n━━━━━━━━━━━━\nکتابی برگزین تا از حکمتش بهره ببری:\n\n📝 /خواندن [کلید] - خواندن کتاب`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/lib_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const book = LIBRARY[k];
    const u = getUser(ctx.from.id);
    if (!book) return;
    
    if (!u.libraryCD) u.libraryCD = {};
    const cd = checkCD(u, `lib_${k}`, CD.library);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, `lib_${k}`);
    const verse = book.verses[rand(0, book.verses.length - 1)];
    giveReward(u, verse.rew);
    if (verse.rew.xp) addXP(u, verse.rew.xp);
    u.loyalty = (u.loyalty || 0) + 5;
    u.shahnamehCount = (u.shahnamehCount || 0) + 1;
    saveDB();
    
    const text = `${book.name}\n━━━━━━━━━━━━\n«${verse.text}»\n━━━━━━━━━━━━\n🎁 ${rwText(verse.rew)}\n⭐ +۵ وفاداری\n📚 ${u.shahnamehCount} شعر\n\n📜 ${book.poet}`;
    try { await ctx.editMessageText(text, backBtn('library')); } catch (e) { await ctx.reply(text, backBtn('library')); }
});

bot.command('خواندن', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const k = args[1];
    const book = LIBRARY[k];
    
    if (!book) return ctx.reply('❌ کتاب نامعتبر\n📝 /خواندن [کلید]\n📋 shahnameh | masnavi | golestan | hafez | khayyam | nezami | attar | sanaei | iraqi | baba_taher');
    
    if (!u.libraryCD) u.libraryCD = {};
    const cd = checkCD(u, `lib_${k}`, CD.library);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, `lib_${k}`);
    const verse = book.verses[rand(0, book.verses.length - 1)];
    giveReward(u, verse.rew);
    if (verse.rew.xp) addXP(u, verse.rew.xp);
    u.loyalty = (u.loyalty || 0) + 5;
    u.shahnamehCount = (u.shahnamehCount || 0) + 1;
    saveDB();
    
    await ctx.reply(`${book.name}\n━━━━━━━━━━━━\n«${verse.text}»\n━━━━━━━━━━━━\n🎁 ${rwText(verse.rew)}\n⭐ +۵ وفاداری\n📚 ${u.shahnamehCount} شعر`);
});

// ==================== 🎁 سایر ====================
bot.action('m_other', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🎁 «سایر»\n━━━━━━━━━━━━';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🎁 صندوقچه', 'm_box'), Markup.button.callback('📖 راهنما', 'm_guide')],
        [Markup.button.callback('⏱️ زمان‌ها', 'm_cd')],
        [Markup.button.callback('🔙 بازگشت', 'back_other')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('m_box', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const now = Date.now();
    
    if (u.lastBox && now - u.lastBox < CD.box) {
        const remaining = CD.box - (now - u.lastBox);
        return ctx.answerCbQuery(`⏳ ${formatTime(remaining)} دیگر`);
    }
    
    u.lastBox = now;
    const loot = BOX_LOOT[rand(0, BOX_LOOT.length - 1)];
    loot.f(u);
    saveDB();
    
    const text = `🎁 «صندوقچه راز گشوده شد»\n━━━━━━━━━━━━\n${loot.n} یافتی!\n\n⏳ چهار ساعت دیگر`;
    try { await ctx.editMessageText(text, backBtn('box')); } catch (e) { await ctx.reply(text, backBtn('box')); }
});

bot.action('m_guide', async (ctx) => {
    await ctx.answerCbQuery();
    const text = `📖 «اوستا - کتاب راهنما»\n━━━━━━━━━━━━━━━━\n🌲 شکارگاه: ${formatTime(CD.gather)}\n⚔️ رزم: ${formatTime(CD.fight)}\n🏟️ میدان: ${formatTime(CD.pvp)}\n🕯️ آتشکده: ${formatTime(CD.pray)}\n📚 کتابخانه: ${formatTime(CD.library)}\n👤 بزرگان: ${formatTime(CD.npc)}\n🎁 صندوقچه: ${formatTime(CD.box)}\n\n📝 فرمان‌های بدون /:\nخرید ۱۰ چوب\nفروش ۵ سنگ\nسپرده ۱۰۰ زر\nبرداشت ۵۰ زر\n\n📝 فرمان‌های با /:\n/راهنما | /آمار | /شاهنامه\n/خرید | /فروش | /سپرده | /برداشت\n/ساخت | /برگرفتن | /ساخت_زره | /ارتقا\n/هنر | /خواندن | /درمان\n/دریافت_مأموریت | /وفاداران | /رتبه`;
    try { await ctx.editMessageText(text, backBtn('guide')); } catch (e) { await ctx.reply(text, backBtn('guide')); }
});

bot.action('m_cd', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const acts = [
        ['gather', '🌲 شکارگاه', CD.gather],
        ['fight', '⚔️ رزم', CD.fight],
        ['pvp', '🏟️ میدان', CD.pvp],
        ['pray', '🕯️ آتشکده', CD.pray],
        ['box', '🎁 صندوقچه', CD.box],
        ['daily', '🎁 جایزه روزانه', CD.daily],
        ['library', '📚 کتابخانه', CD.library],
        ['npc', '👤 بزرگان', CD.npc],
    ];
    
    const lines = ['⏱️ «چرخ زمان»\n━━━━━━━━━━━━\n'];
    for (const [k, n, cd] of acts) {
        const c = checkCD(u, k, cd);
        lines.push(`${n}: ${c.can ? '✅' : '⏳ ' + formatTime(c.rem)}`);
    }
    
    try { await ctx.editMessageText(lines.join('\n'), backBtn('cd')); } catch (e) { await ctx.reply(lines.join('\n'), backBtn('cd')); }
});

// ==================== 📝 کامندهای کمکی ====================
bot.command('راهنما', async (ctx) => {
    await ctx.reply(`📖 «اوستا - کتاب راهنما»\n━━━━━━━━━━━━━━━━\n\n🪵 چوب و 🪨 سنگ از شکارگاه بدست آر\n⚔️ در رزم با گرگان بجنگ\n🏟️ در میدان با پهلوانان نبرد کن\n🏠 کاشانه‌ات را برکش تا ایمن باشی\n🛒 در بازار کالا بخر و بفروش\n🏦 در خزانه زر بیندوز\n🏥 در شفاخانه تندرستی باز یاب\n🕯️ در آتشکده نیایش کن\n📚 در کتابخانه شعر بخوان\n\n📝 فرمان‌های بدون /:\nخرید ۱۰ چوب | فروش ۵ سنگ\nسپرده ۱۰۰ زر | برداشت ۵۰ زر\n\n📝 فرمان‌های با /:\n/راهنما | /آمار | /شاهنامه\n/خرید [تعداد] [کالا]\n/فروش [تعداد] [کالا]\n/سپرده [مقدار] | /برداشت [مقدار]\n/ساخت [سلاح] | /برگرفتن [سلاح]\n/ساخت_زره [زره] | /ارتقا [نوع]\n/هنر [کلید] | /خواندن [کتاب]\n/درمان | /دریافت_مأموریت\n/وفاداران | /رتبه`);
});

bot.command('آمار', async (ctx) => {
    const u = getUser(ctx.from.id);
    await ctx.reply(`📊 ${u.name}\n🎚️ پایه: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold} زر\n🏟️ ${u.arenaRank}`);
});

bot.command('شاهنامه', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'shahnameh', CD.shahnameh);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'shahnameh');
    const verses = ['توانا بود هر که دانا بود', 'به نام خداوند جان و خرد', 'هنر نزد ایرانیان است و بس', 'چو ایران نباشد تن من مباد'];
    const v = verses[rand(0, verses.length - 1)];
    u.gold += 15;
    u.shahnamehCount = (u.shahnamehCount || 0) + 1;
    saveDB();
    await ctx.reply(`📜 «${v}»\n🎁 +۱۵ زر\n📚 ${u.shahnamehCount} شعر`);
});

bot.command('وفاداران', async (ctx) => {
    const users = Object.values(db.users).sort((a, b) => (b.loyalty || 0) - (a.loyalty || 0)).slice(0, 10);
    let text = '🏆 وفادارترین پهلوانان:\n\n';
    users.forEach((u, i) => { text += `${i + 1}. ${u.name || '?'} | ⭐${u.loyalty || 0}\n`; });
    await ctx.reply(text);
});

bot.command('رتبه', async (ctx) => {
    const users = Object.values(db.users).sort((a, b) => (b.arenaPoints || 0) - (a.arenaPoints || 0)).slice(0, 10);
    let text = '🏆 رتبه‌بندی میدان:\n\n';
    users.forEach((u, i) => { text += `${i + 1}. ${u.name || '?'} | ${u.arenaRank} | ⭐${u.arenaPoints}\n`; });
    await ctx.reply(text);
});

bot.command('جایزه', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'daily', CD.daily);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'daily');
    const r = { gold: rand(50, 150), xp: rand(10, 30) };
    giveReward(u, r);
    u.loyalty = (u.loyalty || 0) + 10;
    saveDB();
    await ctx.reply(`🎁 جایزه روزانه!\n🥇 +${r.gold || 0} زر\n✨ +${r.xp || 0} نام‌آوری\n⭐ +۱۰ وفاداری`);
});

// ==================== 👑 ادمین (دستورات فارسی) ====================
bot.command('کاربران', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isAdmin(u.id)) return;
    
    const total = Object.keys(db.users).length;
    const top = Object.values(db.users).sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, 10);
    
    let text = `👥 «دیوان کاربران»\n━━━━━━━━━━━━\n📊 شمار کل: ${total} پهلوان\n\n🏆 ۱۰ پهلوان برتر:\n`;
    top.forEach((p, i) => {
        text += `${i + 1}. ${p.name || '?'} | 🎚️${p.level || 1} | 🥇${p.gold || 0}\n`;
    });
    text += `\n📝 /اطلاعات [آیدی] - جزئیات یک پهلوان\n📝 /بخشیدن [آیدی] [نوع] [مقدار] - بخشیدن کالا\n📝 /شاهنشاه [آیدی] - مکس کردن پهلوان\n📝 /ریست [آیدی] - ریست کول‌داون\n📝 /پیام [متن] - پیام همگانی`;
    await ctx.reply(text);
});

bot.command('اطلاعات', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isAdmin(u.id)) return;
    
    const args = ctx.message.text.split(' ');
    const uid = args[1];
    if (!uid) return ctx.reply('📝 /اطلاعات [آیدی]');
    
    const p = db.users[uid];
    if (!p) return ctx.reply('❌ پهلوان یافت نشد');
    
    const w = WEAPONS[p.weapon] || WEAPONS.none;
    const a = ARMORS[p.armor] || ARMORS.none;
    
    const text = `👤 «اطلاعات پهلوان»\n━━━━━━━━━━━━\n🆔 ${p.id}\n👤 ${p.name}\n🎚️ پایه: ${p.level}\n✨ XP: ${p.xp || 0}/30\n❤️ HP: ${p.hp}/${p.maxHp}\n⚡ زور: ${p.power}\n🗡️ سلاح: ${w.n}\n🛡️ زره: ${a.n}\n🐎 حیوان: ${p.pet ? PETS[p.pet]?.n : 'ندارد'}\n🏠 کاشانه: ${p.homeLvl}\n🏥 شفاخانه: ${p.clinicLvl}\n⭐ هنر: ${p.sp || 0}\n🏟️ ${p.arenaRank} | ⭐${p.arenaPoints}\n🥇 زر: ${p.gold}\n🏦 خزانه: ${p.bankGold}\n🎖️ وفاداری: ${p.loyalty}\n📚 شعر: ${p.shahnamehCount}\n📅 ورود: ${p.logins} بار`;
    await ctx.reply(text);
});

bot.command('بخشیدن', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isAdmin(u.id)) return;
    
    const args = ctx.message.text.split(' ');
    const uid = args[1];
    const type = args[2];
    const key = args[3];
    const amt = Number(args[4] || 0);
    
    if (!uid || !type || !key || !amt) {
        return ctx.reply('📝 /بخشیدن [آیدی] [نوع] [کلید] [مقدار]\n\n📋 انواع:\n• کالا: wood, stone, gold, iron, gem, bread, water\n• سلاح: stick, knife, bow_zal, axe, spear, mace, bow_arash, sword_rostam, zolfaghar\n• زره: wood_shield, leather, hakhamaneshi, sasani, babr_bayan, immortals, keykhosro, rostam, ahura\n• دیگر: xp, loyalty');
    }
    
    const p = getUser(uid, '');
    if (type === 'کالا') {
        if (key === 'wood') p.wood = (p.wood || 0) + amt;
        if (key === 'stone') p.stone = (p.stone || 0) + amt;
        if (key === 'gold') p.gold += amt;
        if (key === 'iron') p.iron = (p.iron || 0) + amt;
        if (key === 'gem') p.gem = (p.gem || 0) + amt;
        if (key === 'bread') p.bread = (p.bread || 0) + amt;
        if (key === 'water') p.water = (p.water || 0) + amt;
    } else if (type === 'سلاح') {
        if (!p.wOwned) p.wOwned = { none: true };
        p.wOwned[key] = true;
    } else if (type === 'زره') {
        if (!p.aOwned) p.aOwned = { none: true };
        p.aOwned[key] = true;
    } else if (type === 'xp') {
        addXP(p, amt);
    } else if (type === 'loyalty') {
        p.loyalty = (p.loyalty || 0) + amt;
    } else {
        return ctx.reply('❌ نوع نامعتبر');
    }
    
    saveDB();
    await ctx.reply(`✅ به ${p.name} بخشیده شد`);
});

bot.command('شاهنشاه', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isAdmin(u.id)) return;
    
    const args = ctx.message.text.split(' ');
    const uid = args[1];
    if (!uid) return ctx.reply('📝 /شاهنشاه [آیدی]');
    
    const p = getUser(uid, '');
    
    p.level = 30; p.xp = 0; p.gold = 99999; p.hp = p.maxHp = 1000; p.power = 100;
    p.wood = 9999; p.stone = 9999; p.bread = 999; p.iron = 999; p.gem = 999;
    p.homeLvl = 10; p.clinicLvl = 7;
    p.weapon = 'zolfaghar'; p.armor = 'ahura';
    p.weaponEnchant = '🔥 آتشین';
    p.sp = 100;
    p.arenaPoints = 25000; p.arenaRank = '👑 شاهنشاه';
    p.loyalty = 5000; p.shahnamehCount = 100;
    p.bankGold = 50000;
    p.pet = 'pegasus';
    
    if (!p.wOwned) p.wOwned = { none: true };
    for (const k of Object.keys(WEAPONS)) p.wOwned[k] = true;
    if (!p.aOwned) p.aOwned = { none: true };
    for (const k of Object.keys(ARMORS)) p.aOwned[k] = true;
    if (!p.achievements) p.achievements = [];
    p.achievements = ['first_blood', 'warrior', 'hero', 'pvp_king', 'rich', 'builder', 'collector', 'shahnameh', 'loyal', 'boss_slayer'];
    if (!p.skills) p.skills = {};
    for (const k of Object.keys(SKILLS)) p.skills[k] = 10;
    
    saveDB();
    await ctx.reply(`✅ ${p.name} به شاهنشاه ارتقا یافت!`);
});

bot.command('ریست', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isAdmin(u.id)) return;
    
    const args = ctx.message.text.split(' ');
    const uid = args[1];
    if (!uid) return ctx.reply('📝 /ریست [آیدی]');
    
    const p = getUser(uid, '');
    p.cooldowns = {};
    p.daily = {};
    p.libraryCD = {};
    saveDB();
    await ctx.reply(`✅ کول‌داون‌های ${p.name} ریست شد`);
});

bot.command('پیام', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!isAdmin(u.id)) return;
    
    const msg = ctx.message.text.replace('/پیام', '').trim();
    if (!msg) return ctx.reply('📝 /پیام [متن]');
    
    let sent = 0;
    for (const uid of Object.keys(db.users)) {
        try { await bot.telegram.sendMessage(uid, `📢 «پیام شاهنشاه»\n━━━━━━━━━━━━\n${msg}`); sent++; } catch (e) {}
    }
    await ctx.reply(`✅ پیام به ${sent} پهلوان رسید`);
});

// ==================== 🚀 اجرا ====================
bot.catch((err) => console.error('❌', err.message));

bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('✅ بقای باستانی - نسخه کامل اجرا شد!'))
    .catch((err) => console.error('❌ خطای راه‌اندازی:', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

 