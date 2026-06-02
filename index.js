const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ==================== 🔑 تنظیمات ====================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;  // 🆕 ایدی عددی ادمین - اگر فرق دارد تغییر دهید
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

// ==================== 🆕 ارتقاهای جدید - متغیرها ====================
// آب و هوا
let weather = { type: '☀️ آفتابی', effect: 'بدون تغییر', until: Date.now() + 3600000 };
// فروشگاه چرخان
let rotatingShop = {
    items: [
        { name: '🔮 کتاب اسرار', desc: '+۲۰ XP', price: 150, type: 'xp', value: 20 },
        { name: '⚡ حرز قدرت', desc: '+۵ قدرت برای ۱ نبرد', price: 100, type: 'power', value: 5 },
        { name: '❤️ جعبه شفا', desc: '+۵۰ HP', price: 200, type: 'heal', value: 50 }
    ],
    lastUpdate: Date.now()
};
// باس فصلی
let seasonalBoss = {
    active: false,
    name: '👹 دیو سپید نوروزی',
    hp: 500,
    maxHp: 500,
    reward: { gold: 1000, xp: 200, gem: 5 },
    defeated: false,
    lastSpawn: 0
};
// پیام‌های تسلیت
const CONSOLATION_MSGS = [
    '💀 ای پهلوان! ناامید مشو، رستم هم روزهای باخت داشت...',
    '⚔️ شکست پلکان پیروزی است، فردا باز می‌آیی!',
    '🍃 ز خون دل باید شست این نام، که فردا دوباره رزم آید به کام',
    '🌙 امشب استراحت کن، فردا قوی‌تر باز می‌گردی',
    '📜 پیروزی از آنِ پایداران است، نه یک نبرد تمام راه نیست'
];

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

// 🆕 نوار قلب و تجربه
function hpBar(current, max, length = 10) {
    const filled = Math.round((current / max) * length);
    return '❤️'.repeat(filled) + '🤍'.repeat(length - filled);
}
function xpBar(current, needed, length = 10) {
    const filled = Math.round((current / needed) * length);
    return '✨'.repeat(filled) + '🤍'.repeat(length - filled);
}

// 🆕 لگاریتم XP (هر سطح نیاز متفاوت)
function xpNeeded(level) {
    if (level <= 10) return 30;
    if (level <= 20) return 60;
    return 100;
}

// 🆕 تخفیف جمعه
function isFriday() { return new Date().getDay() === 5; }
function getDiscountedPrice(price) { return isFriday() ? Math.floor(price * 0.75) : price; }

// 🆕 به‌روزرسانی آب و هوا
function updateWeather() {
    if (Date.now() > weather.until) {
        const types = [
            { type: '☀️ آفتابی', effect: 'بدون تغییر', until: Date.now() + 3600000 },
            { type: '🌧️ بارانی', effect: '🪵 +۲ چوب', until: Date.now() + 3600000 },
            { type: '🌪️ طوفان', effect: '💎 +۱ گوهر (نادر)', until: Date.now() + 3600000 },
            { type: '☁️ ابری', effect: '🪨 +۱ سنگ', until: Date.now() + 3600000 }
        ];
        weather = types[Math.floor(Math.random() * types.length)];
    }
}

// 🆕 به‌روزرسانی فروشگاه چرخان
function updateRotatingShop() {
    if (Date.now() - rotatingShop.lastUpdate > 43200000) {
        rotatingShop.items = [
            { name: '🔮 کتاب اسرار', desc: '+۲۰ XP', price: 150, type: 'xp', value: 20 },
            { name: '⚡ حرز قدرت', desc: '+۵ قدرت برای ۱ نبرد', price: 100, type: 'power', value: 5 },
            { name: '❤️ جعبه شفا', desc: '+۵۰ HP', price: 200, type: 'heal', value: 50 }
        ];
        rotatingShop.lastUpdate = Date.now();
    }
}

// 🆕 بررسی باس فصلی (آخر هفته)
function checkSeasonalBoss() {
    const now = new Date();
    const isWeekend = now.getDay() === 5 || now.getDay() === 6;
    if (isWeekend && !seasonalBoss.active && !seasonalBoss.defeated && (now - seasonalBoss.lastSpawn > 604800000)) {
        seasonalBoss.active = true;
        seasonalBoss.hp = seasonalBoss.maxHp;
        seasonalBoss.defeated = false;
        seasonalBoss.lastSpawn = Date.now();
        bot.telegram.sendMessage(ADMIN_ID, `🌟 باس فصلی ${seasonalBoss.name} ظاهر شد!`);
    }
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
    heal: 300000,  // 🆕 کول‌داون شفاخانه: ۵ دقیقه
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
    { n: '🐺 گرگ تورانی', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8, type: 'animal' },
    { n: '🐗 گراز مازندران', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10, type: 'animal' },
    { n: '🦊 شغال دشتی', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12, type: 'animal' },
    { n: '🐻 خرس البرز', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15, type: 'animal' },
    { n: '🐆 پلنگ پارسی', p: 18, loss: [15,30], rew: { gold: 25, meat: 2 }, xp: 18, type: 'animal' },
    { n: '👹 دیو سفید', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18, type: 'demon' },
    { n: '👺 دیو سیاه', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22, type: 'demon' },
    { n: '👾 اکوان دیو', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28, type: 'demon' },
    { n: '👿 ارجنگ دیو', p: 32, loss: [30,55], rew: { gold: 70, iron: 5, gem: 3 }, xp: 35, type: 'demon' },
    { n: '💀 دیو سپید', p: 38, loss: [35,65], rew: { gold: 100, iron: 8, gem: 5 }, xp: 50, type: 'demon' },
    { n: '🐉 ضحاک ماردوش', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, type: 'boss', ml: 8 },
    { n: '🦅 سیمرغ خشمگین', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, type: 'boss', ml: 10 },
    { n: '👹 دیو بزرگ مازندران', p: 60, loss: [50,100], rew: { gold: 1500, dragon_scale: 3, gem: 15 }, xp: 250, type: 'boss', ml: 15 },
    { n: '🐲 اژدهای هفت‌سر', p: 75, loss: [60,120], rew: { gold: 3000, dragon_scale: 5, gem: 25 }, xp: 500, type: 'boss', ml: 20 },
    { n: '👑 اهریمن بزرگ', p: 100, loss: [80,150], rew: { gold: 10000, dragon_scale: 10, gem: 50 }, xp: 1000, type: 'boss', ml: 30 },
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
    sanaei: { name: '📿 حدیقه', poet: 'سنایی غزنوی', verses: [{ text: 'هر که را خوابگه آخر مشتی خاک است\nگو چه حاجت که به افلاک کشی ایوان را', rew: { gold: 8, xp: 18 } }] },
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
    { n: '✨ ۳۰ XP', f: (u) => { u.xp = (u.xp || 0) + 30; while (u.xp >= xpNeeded(u.level)) { u.xp -= xpNeeded(u.level); u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1; } } },
    { n: '✨ ۶۰ XP', f: (u) => { u.xp = (u.xp || 0) + 60; while (u.xp >= xpNeeded(u.level)) { u.xp -= xpNeeded(u.level); u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1; } } },
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
    rostam: { n: '⚔️ رستم دستان', price: 80, f: (u) => { addXP(u, 50); return '✨ +۵۰ XP'; } },
    ferdosi: { n: '📜 فردوسی', price: 30, f: (u) => { u.gold += 50; u.shahnamehCount = (u.shahnamehCount || 0) + 1; return '🥇 +۵۰ زر'; } },
    kaveh: { n: '🔨 کاوه آهنگر', price: 200, f: (u) => { u.iron = (u.iron || 0) + 5; return '⛓️ +۵ آهن'; } },
    jamshid: { n: '👑 جمشید', price: 500, f: (u) => { u.gold += 200; u.gem = (u.gem || 0) + 2; return '🥇 +۲۰۰ زر | 💎 +۲ گوهر'; } },
    anahita: { n: '💧 آناهیتا', price: 150, f: (u) => { u.bread = (u.bread || 0) + 5; u.water = (u.water || 0) + 3; return '🍞 +۵ | 💧 +۳'; } },
    mitra: { n: '☀️ میترا', price: 300, f: (u) => { addXP(u, 100); return '✨ +۱۰۰ XP'; } },
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
    { n: '🎪 جشن مهرگان', desc: 'جشن بزرگ برپاست', f: (u) => { u.gold += 100; addXP(u, 50); return '🥇 +۱۰۰ | ✨ +۵۰ XP'; } },
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
            skills: { g: 0, h: 0, c: 0, s: 0, a: 0, d: 0, t: 0, m: 0, l: 0, w: 0 }, sp: 0,
            wOwned: { none: true }, aOwned: { none: true },
            arenaWins: 0, arenaLosses: 0, arenaPoints: 0,
            arenaRank: '🥉 نوآموز',
            bankGold: 0, bankInterest: 0,
            loyalty: 0, shahnamehCount: 0, pet: null,
            achievements: [], quests: [], questProgress: {},
            clan: null, lastAttacker: null, lastAttackTime: 0,
            weaponEnchant: null, cooldowns: {}, daily: {},
            stats: { fw: 0, dw: 0, bw: 0, gatherCount: 0, highestDamage: 0 },  // 🆕 رکورد آسیب
            pendingFight: null, pendingPvP: null,
            libraryCD: {}, logins: 1,
            lastBox: 0, lastPray: 0, lastLoginDate: '', lastQuestDate: '', lastBankDate: '',
            dailyStreak: 0, lastDaily: 0,  // 🆕 برای گلچین روزانه
            charms: { power: 0, heal: 0, luck: 0 }  // 🆕 حرزهای یکبار مصرف
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
    u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0, a: 0, d: 0, t: 0, m: 0, l: 0, w: 0 }; u.sp = u.sp || 0;
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
    u.stats = u.stats || { fw: 0, dw: 0, bw: 0, gatherCount: 0, highestDamage: 0 };
    u.pendingFight = null; u.pendingPvP = null;
    u.libraryCD = u.libraryCD || {};
    u.lastBox = u.lastBox || 0; u.lastPray = u.lastPray || 0;
    u.wOwned.none = true; u.aOwned.none = true;
    u.dailyStreak = u.dailyStreak || 0;
    u.lastDaily = u.lastDaily || 0;
    u.charms = u.charms || { power: 0, heal: 0, luck: 0 };
    
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

// 🆕 تابع جدید addXP با اعلان سطح‌آپ
function addXP(u, a) {
    const oldLevel = u.level;
    u.xp = (u.xp || 0) + a;
    let levelUpMsg = '';
    while (u.xp >= xpNeeded(u.level)) {
        u.xp -= xpNeeded(u.level);
        u.level++;
        u.maxHp += 10;
        u.hp = u.maxHp;
        u.power += 2;
        u.sp = (u.sp || 0) + 1;
        levelUpMsg = `\n\n🎉 «تبریک! به سطح ${u.level} رسیدی» 🎉\n❤️ حداکثر جان +۱۰\n⚡ قدرت +۲\n⭐ یک گوهر هنر دریافت کردی`;
    }
    return levelUpMsg;
}

function addRes(u, k, v) { if (!u.res) u.res = {}; if (!u.res[k]) u.res[k] = 0; u.res[k] += v; if (u.res[k] < 0) u.res[k] = 0; }
function addItem(u, k, v) { if (!u.items) u.items = {}; if (!u.items[k]) u.items[k] = 0; u.items[k] += v; if (u.items[k] < 0) u.items[k] = 0; }
function hasRes(u, c) { for (const [k, v] of Object.entries(c)) { if (k === 'nl' || k === 'needLvl') continue; if ((u[k] || 0) < v) return false; } return true; }
function takeRes(u, c) { for (const [k, v] of Object.entries(c)) { if (k === 'nl' || k === 'needLvl') continue; if (k === 'wood') u.wood -= v; if (k === 'stone') u.stone -= v; if (k === 'gold') u.gold -= v; if (k === 'iron') u.iron -= v; } }
function giveReward(u, r) { if (!r) return; for (const [k, v] of Object.entries(r)) { if (k === 'gold') u.gold += v; else if (k === 'xp') addXP(u, v); else if (k === 'meat') u.meat = (u.meat || 0) + v; else if (k === 'iron') u.iron = (u.iron || 0) + v; else if (k === 'gem') u.gem = (u.gem || 0) + v; else if (k === 'fish') u.fish = (u.fish || 0) + v; else if (k === 'dragon_scale') u.dragon_scale = (u.dragon_scale || 0) + v; else if (k === 'phoenix_feather') u.phoenix_feather = (u.phoenix_feather || 0) + v; } }
function rwText(r) { if (!r) return 'ندارد'; return Object.entries(r).map(([k, v]) => { if (k === 'gold') return `🥇 ${v}`; if (k === 'xp') return `✨ ${v}`; if (k === 'meat') return `🍖 ${v}`; if (k === 'iron') return `⛓️ ${v}`; if (k === 'gem') return `💎 ${v}`; return `${v}x ${k}`; }).join(' | '); }

function updateArenaRank(u) {
    const pts = u.arenaPoints || 0;
    const ranks = [...ARENA_RANKS].reverse();
    for (const r of ranks) { if (pts >= r.min) { u.arenaRank = r.n; break; } }
}

function progressQuest(u, t) { if (!u.questProgress) u.questProgress = {}; u.questProgress[t] = (u.questProgress[t] || 0) + 1; }

// 🆕 گلچین روزانه
async function dailyReward(ctx) {
    const u = getUser(ctx.from.id);
    const now = Date.now();
    if (now - (u.lastDaily || 0) < CD.daily) {
        const rem = CD.daily - (now - u.lastDaily);
        return ctx.reply(`⏳ پاداش روزانه ${formatTime(rem)} دیگر`);
    }
    
    u.dailyStreak = (u.dailyStreak || 0) + 1;
    if (now - (u.lastDaily || 0) > CD.daily * 2) u.dailyStreak = 1;
    
    let reward = 50;
    if (u.dailyStreak === 2) reward = 70;
    else if (u.dailyStreak === 3) reward = 100;
    else if (u.dailyStreak >= 7) reward = 500;
    else if (u.dailyStreak >= 5) reward = 200;
    else if (u.dailyStreak >= 4) reward = 150;
    
    u.gold += reward;
    u.lastDaily = now;
    
    let extra = '';
    if (u.dailyStreak === 7) {
        u.gem = (u.gem || 0) + 5;
        addXP(u, 50);
        extra = '\n💎 +۵ گوهر\n✨ +۵۰ XP';
        u.dailyStreak = 0;
    } else if (u.dailyStreak === 3) {
        u.bread = (u.bread || 0) + 3;
        extra = '\n🍞 +۳ نان';
    }
    
    saveDB();
    await ctx.reply(`🎁 «پاداش روزانه»\n━━━━━━━━━━━━\nروز ${u.dailyStreak}ام\n🥇 +${reward} زر${extra}\n🔥 استرک متوالی: ${u.dailyStreak}`);
}

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
        main: () => { const u = getUser(ctx.from.id); const text = `🏛️ «بارگاه جمشید»\n━━━━━━━━━━━━\n«که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\n🎚️ پایه: ${u.level} | ❤️ ${hpBar(u.hp, u.maxHp)} | 🥇 ${u.gold}`; try { ctx.editMessageText(text, mainMenu()); } catch (e) { ctx.reply(text, mainMenu()); } },
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
    
    const text = `🏛️ «در بارگاه جمشید»\n━━━━━━━━━━━━━━━━\n«که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\nدرود بر تو ای پهلوان ${u.name}!\n🎚️ پایه: ${u.level} | ❤️ ${hpBar(u.hp, u.maxHp)} | 🥇 زر: ${u.gold}${eventText}`;
    await ctx.reply(text, mainMenu());
});

bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🏛️ بارگاه جمشید\n🎚️ پایه: ${u.level} | ❤️ ${hpBar(u.hp, u.maxHp)} | 🥇 ${u.gold}`;
    try { await ctx.editMessageText(text, mainMenu()); } catch (e) { await ctx.reply(text, mainMenu()); }
});

// ==================== 📊 دیوان ====================
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const text = `📊 «دیوان آمار»\n━━━━━━━━━━━━\n👤 ${u.name}\n🎚️ پایه: ${u.level} | ✨ ${xpBar(u.xp, xpNeeded(u.level))}\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}\n⚡ زور بازو: ${u.power}\n🗡️ سلاح: ${w.n}\n🛡️ زره: ${a.n}\n🐎 حیوان: ${u.pet ? PETS[u.pet]?.n : 'ندارد'}\n🏠 کاشانه: ${u.homeLvl}\n🏥 شفاخانه: ${u.clinicLvl}\n⭐ گوهر هنر: ${u.sp || 0}\n🏟️ ${u.arenaRank} | ⭐${u.arenaPoints}\n⚔️ برد: ${u.arenaWins} | 💀 باخت: ${u.arenaLosses}\n🎖️ وفاداری: ${u.loyalty}\n📚 شعر: ${u.shahnamehCount}\n🏦 خزانه: ${u.bankGold}\n🥇 زر: ${u.gold}\n🪵 ${u.wood} | 🪨 ${u.stone} | 🍞 ${u.bread} | ⛓️ ${u.iron} | 💎 ${u.gem}\n💥 رکورد آسیب: ${u.stats?.highestDamage || 0}`;
    try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
});

// ==================== 🌲 شکارگاه ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'gather', CD.gather);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    setCD(u, 'gather');
    
    updateWeather();
    const weatherBonus = weather.type === '🌧️ بارانی' ? { wood: 2 } : (weather.type === '🌪️ طوفان' ? { gem: 1 } : (weather.type === '☁️ ابری' ? { stone: 1 } : {}));
    
    const roll = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { iron: 1, stone: 2 }, { wood: 4 }, { gold: 10 }][rand(0, 4)];
    if (weatherBonus.wood) roll.wood = (roll.wood || 0) + weatherBonus.wood;
    if (weatherBonus.stone) roll.stone = (roll.stone || 0) + weatherBonus.stone;
    if (weatherBonus.gem) roll.gem = (roll.gem || 0) + 1;
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
    const text = `🌲 «شکارگاه» ${weather.type}\n━━━━━━━━━━━━\n${weather.effect}\n🪵 +${roll.wood || 0} چوب\n🪨 +${roll.stone || 0} سنگ${extra}${hasHorse ? '\n🐎 رخش سرعت بخشید!' : ''}\n⏳ ${formatTime(CD.gather)} دیگر`;
    try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
});

// ==================== ⚔️ رزم ====================
bot.action('m_fight_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '⚔️ «میدان رزم»\n━━━━━━━━━━━━\nحریف خود را برگزین:';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🐺 ددان', 'f_animals'), Markup.button.callback('👹 دیوان', 'f_demons')],
        [Markup.button.callback('👿 پلید', 'f_bosses'), Markup.button.callback('🦌 شکار', 'f_prey')],
        [Markup.button.callback('🎲 رندوم', 'f_random'), Markup.button.callback('👾 باس فصلی', 'f_seasonal')],
        [Markup.button.callback('🔙 بازگشت', 'back_fight_menu')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('f_animals', async (ctx) => startFight(ctx, 'animal'));
bot.action('f_demons', async (ctx) => startFight(ctx, 'demon'));
bot.action('f_bosses', async (ctx) => startFight(ctx, 'boss'));
bot.action('f_prey', async (ctx) => startFight(ctx, 'prey'));
bot.action('f_random', async (ctx) => startFight(ctx, 'random'));

// 🆕 باس فصلی
bot.action('f_seasonal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
    if (!seasonalBoss.active) return ctx.answerCbQuery('❌ باس فصلی ظاهر نشده! آخر هفته بیا');
    if (seasonalBoss.hp <= 0) return ctx.answerCbQuery('❌ باس فصلی شکست خورد! هفته بعد');
    
    u.pendingFight = { ...seasonalBoss, type: 'seasonal', loss: [30, 60], p: 60 };
    setCD(u, 'fight');
    saveDB();
    
    const text = `⚔️ ${seasonalBoss.name}\n💪 زور: ۶۰\n❤️ آسیب: ۳۰-۶۰\n🎁 تاراج: ${rwText(seasonalBoss.reward)}\n❤️ جان باس: ${seasonalBoss.hp}/${seasonalBoss.maxHp}`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', 'fg_seasonal')],
        [Markup.button.callback('🏃 گریختن', 'back_fight_menu')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

async function startFight(ctx, type) {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
    
    const pool = type === 'random' ? ALL_ENEMIES : ALL_ENEMIES.filter(e => e.type === type);
    const enemy = pool[rand(0, pool.length - 1)];
    
    // 🆕 لگاریتم سختی موجودات
    let levelPenalty = 1;
    if (u.level - (enemy.ml || enemy.p / 5) > 15) levelPenalty = 0.5;
    if (u.level - (enemy.ml || enemy.p / 5) > 25) levelPenalty = 0;
    
    if (levelPenalty === 0) return ctx.answerCbQuery('❌ این موجود不值得 جنگیدن (خیلی ضعیف)');
    if (enemy.ml && u.level < enemy.ml) return ctx.answerCbQuery(`❌ پایه ${enemy.ml} لازم است`);
    
    u.pendingFight = { ...enemy, levelPenalty };
    setCD(u, 'fight');
    saveDB();
    
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const ch = clamp(50 + (u.power + w.p - enemy.p) * 5, 5, 95);
    
    const text = `⚔️ ${enemy.n}\n💪 زور: ${enemy.p}\n❤️ آسیب: ${enemy.loss[0]}-${enemy.loss[1]}\n🎁 تاراج: ${rwText(enemy.rew)}\n✨ نام‌آوری: ${Math.floor(enemy.xp * levelPenalty)}\n🛡️ شانس: ${ch}%`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', `fg_${ALL_ENEMIES.indexOf(enemy)}`)],
        [Markup.button.callback('🏃 فرار (۵۰٪)', `fg_flee_${ALL_ENEMIES.indexOf(enemy)}`)],
        [Markup.button.callback('🔙 بازگشت', 'back_fight_menu')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
}

// 🆕 ضربه بحرانی
function criticalHit() { return Math.random() < 0.15; }

bot.action(/fg_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const enemyData = ALL_ENEMIES[parseInt(ctx.match[1])];
    const enemy = { ...enemyData, levelPenalty: u.pendingFight?.levelPenalty || 1 };
    if (!enemy || u.hp <= 0) return;
    
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const dogBonus = u.pet === 'dog' ? 5 : 0;
    const enchantBonus = u.weaponEnchant === '🔥 آتشین' ? 5 : 0;
    const powerCharm = u.charms?.power || 0;
    if (powerCharm > 0) { u.charms.power--; saveDB(); }
    
    const pp = u.power + w.p + rand(0, 8) + dogBonus + enchantBonus + powerCharm;
    const ep = enemy.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(50 + (pp - ep) * 5, 5, 95);
    
    let rawDmg = rand(enemy.loss[0], enemy.loss[1]);
    const isCritical = criticalHit();
    if (isCritical) rawDmg = Math.floor(rawDmg * 2);
    const dmg = Math.max(1, rawDmg - a.d);
    u.hp = clamp(u.hp - dmg, 0, u.maxHp);
    
    // بروزرسانی رکورد آسیب
    if (dmg > (u.stats?.highestDamage || 0)) u.stats.highestDamage = dmg;
    
    let text;
    if (win) {
        const rewardMult = enemy.levelPenalty;
        const finalReward = {};
        for (const [k, v] of Object.entries(enemy.rew)) {
            finalReward[k] = Math.floor(v * rewardMult);
        }
        giveReward(u, finalReward);
        const xpGain = Math.floor(enemy.xp * rewardMult);
        const levelUpMsg = addXP(u, xpGain);
        if (enemy.type === 'animal') u.stats.fw = (u.stats.fw || 0) + 1;
        else if (enemy.type === 'demon') u.stats.dw = (u.stats.dw || 0) + 1;
        else if (enemy.type === 'boss') u.stats.bw = (u.stats.bw || 0) + 1;
        progressQuest(u, 'fight');
        u.loyalty = (u.loyalty || 0) + 2;
        text = `⚔️ «پیروزی از آن دلیران بود»\n━━━━━━━━━━━━\nبر ${enemy.n} چیره شدی!\n✨ +${xpGain} نام‌آوری\n❤️ زخم: -${dmg}${isCritical ? ' 🔥 ضربه بحرانی!' : ''}\n🎁 تاراج: ${rwText(finalReward)}\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}${levelUpMsg}`;
    } else {
        const consolation = CONSOLATION_MSGS[rand(0, CONSOLATION_MSGS.length - 1)];
        text = `💀 «ز نیرو بود مرد را راستی»\n━━━━━━━━━━━━\nاز ${enemy.n} شکست خوردی...\n❤️ زخم: -${dmg}\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}\n💊 رهسپار شفاخانه شو!\n\n${consolation}`;
    }
    
    u.pendingFight = null;
    saveDB();
    try { await ctx.editMessageText(text, backBtn('fight_menu')); } catch (e) { await ctx.reply(text, backBtn('fight_menu')); }
});

// 🆕 دکمه فرار
bot.action(/fg_flee_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const enemyIndex = parseInt(ctx.match[1]);
    const enemy = ALL_ENEMIES[enemyIndex];
    if (!enemy || u.hp <= 0) return;
    
    const fleeChance = 0.5;
    const success = Math.random() < fleeChance;
    
    if (success) {
        const text = `🏃 «گریز از میدان»\n━━━━━━━━━━━━\nاز ${enemy.n} گریختی!\nهیچ آسیبی ندیدی.\n\n🍃 «فرار بر دلیری مقدم است»`;
        u.pendingFight = null;
        saveDB();
        try { await ctx.editMessageText(text, backBtn('fight_menu')); } catch (e) { await ctx.reply(text, backBtn('fight_menu')); }
    } else {
        const a = ARMORS[u.armor] || ARMORS.none;
        const dmg = rand(enemy.loss[0], enemy.loss[1]);
        const finalDmg = Math.max(1, dmg - a.d);
        u.hp = clamp(u.hp - finalDmg, 0, u.maxHp);
        const text = `💀 «گریز ناموفق»\n━━━━━━━━━━━━\nنتوانستی از ${enemy.n} بگریزی!\n❤️ زخم: -${finalDmg}\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}`;
        u.pendingFight = null;
        saveDB();
        try { await ctx.editMessageText(text, backBtn('fight_menu')); } catch (e) { await ctx.reply(text, backBtn('fight_menu')); }
    }
});

// 🆕 نبرد با باس فصلی
bot.action('fg_seasonal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!seasonalBoss.active || seasonalBoss.hp <= 0) return ctx.answerCbQuery('❌ باس فصلی در دسترس نیست');
    if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
    
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const dogBonus = u.pet === 'dog' ? 5 : 0;
    const enchantBonus = u.weaponEnchant === '🔥 آتشین' ? 5 : 0;
    
    const damage = rand(20, 50) + u.power + w.p + dogBonus + enchantBonus;
    const takenDmg = rand(20, 40) - a.d;
    u.hp = clamp(u.hp - takenDmg, 0, u.maxHp);
    seasonalBoss.hp -= damage;
    
    let text;
    if (seasonalBoss.hp <= 0) {
        seasonalBoss.active = false;
        seasonalBoss.defeated = true;
        giveReward(u, seasonalBoss.reward);
        text = `⚔️ «باس فصلی شکست خورد!»\n━━━━━━━━━━━━\nتو ضربه نهایی را زدی!\n🎁 تاراج: ${rwText(seasonalBoss.reward)}\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}\n\n🏆 نام تو در تاریخ ماند!`;
        bot.telegram.sendMessage(ADMIN_ID, `🎉 باس فصلی توسط ${u.name} شکست خورد!`);
    } else {
        text = `⚔️ «نبرد با ${seasonalBoss.name}»\n━━━━━━━━━━━━\n💥 آسیب تو: ${damage}\n❤️ آسیب از باس: ${takenDmg}\n❤️ جان باس: ${seasonalBoss.hp}/${seasonalBoss.maxHp}\n❤️ تندرستی تو: ${hpBar(u.hp, u.maxHp)}`;
    }
    
    saveDB();
    try { await ctx.editMessageText(text, backBtn('fight_menu')); } catch (e) { await ctx.reply(text, backBtn('fight_menu')); }
});

// ==================== 🏥 شفاخانه ====================
bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cost = getDiscountedPrice(10 + (u.clinicLvl - 1) * 5);
    const healAmt = 30 + (u.clinicLvl - 1) * 20;
    const cd = checkCD(u, 'heal', CD.heal);
    
    let cdText = '';
    if (!cd.can) cdText = `\n⏳ درمان بعدی: ${formatTime(cd.rem)}`;
    
    const text = `🏥 «شفاخانه» پایه ${u.clinicLvl}\n━━━━━━━━━━━━\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}\n💰 هزینه درمان: ${cost} زر\n💊 میزان درمان: +${healAmt} HP${cdText}\n\n📝 /درمان - درمان سریع`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback(`💊 درمان (${cost} زر)`, 'do_heal')],
        [Markup.button.callback('🔙 بازگشت', 'back_heal')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('do_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cost = getDiscountedPrice(10 + (u.clinicLvl - 1) * 5);
    const healAmt = 30 + (u.clinicLvl - 1) * 20;
    const cd = checkCD(u, 'heal', CD.heal);
    
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    if (u.hp >= u.maxHp) return ctx.answerCbQuery('❤️ تندرستی کامل است');
    if (u.gold < cost) return ctx.answerCbQuery(`❌ ${cost} زر لازم داری`);
    
    u.gold -= cost;
    u.hp = Math.min(u.maxHp, u.hp + healAmt);
    setCD(u, 'heal');
    saveDB();
    
    const text = `✅ درمان شدی!\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}\n💰 هزینه: ${cost} زر\n🥇 زر: ${u.gold}`;
    try { await ctx.editMessageText(text, backBtn('heal')); } catch (e) { await ctx.reply(text, backBtn('heal')); }
});

// درمان با کامند
bot.command('درمان', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cost = getDiscountedPrice(10 + (u.clinicLvl - 1) * 5);
    const healAmt = 30 + (u.clinicLvl - 1) * 20;
    const cd = checkCD(u, 'heal', CD.heal);
    
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
    if (u.hp >= u.maxHp) return ctx.reply('❤️ تندرستی کامل است');
    if (u.gold < cost) return ctx.reply(`❌ ${cost} زر لازم داری`);
    
    u.gold -= cost;
    u.hp = Math.min(u.maxHp, u.hp + healAmt);
    setCD(u, 'heal');
    saveDB();
    await ctx.reply(`✅ درمان شدی!\n❤️ ${hpBar(u.hp, u.maxHp)}\n💰 ${u.gold} زر`);
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

// ==================== 🏪 تجهیزات ====================
bot.action('m_equip', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🏪 «تجهیزات»\n━━━━━━━━━━━━';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🛠️ اسلحه‌خانه', 'm_armory'), Markup.button.callback('🛡️ زره‌خانه', 'm_armor_shop')],
        [Markup.button.callback('⭐ هنرستان', 'm_skills')],
        [Markup.button.callback('🛒 حرزها', 'm_charms')],
        [Markup.button.callback('🔙 بازگشت', 'back_equip')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

// 🆕 حرزها
bot.action('m_charms', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🛒 «حرزهای یکبار مصرف»\n━━━━━━━━━━━━\n🔥 حرز قدرت: +۵ قدرت برای ۱ نبرد (۱۰۰ زر)\n💚 حرز شفا: +۵۰ HP فوری (۸۰ زر)\n🍀 حرز شانس: شانس آیتم نادر دوبرابر (۱۵۰ زر)\n\n📦 موجودی:\n🔥 ${u.charms?.power || 0} عدد\n💚 ${u.charms?.heal || 0} عدد\n🍀 ${u.charms?.luck || 0} عدد\n\n📝 /خرید_حرز [نوع] [تعداد]\nانواع: قدرت, شفا, شانس`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🔥 خرید حرز قدرت (۱۰۰)', 'buy_charm_power')],
        [Markup.button.callback('💚 خرید حرز شفا (۸۰)', 'buy_charm_heal')],
        [Markup.button.callback('🍀 خرید حرز شانس (۱۵۰)', 'buy_charm_luck')],
        [Markup.button.callback('🔙 بازگشت', 'back_equip')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('buy_charm_power', async (ctx) => {
    const u = getUser(ctx.from.id);
    const price = getDiscountedPrice(100);
    if (u.gold < price) return ctx.answerCbQuery(`❌ ${price} زر لازم داری`);
    u.gold -= price;
    if (!u.charms) u.charms = { power: 0, heal: 0, luck: 0 };
    u.charms.power = (u.charms.power || 0) + 1;
    saveDB();
    await ctx.answerCbQuery(`✅ حرز قدرت خریداری شد! (${price} زر)`);
});

bot.action('buy_charm_heal', async (ctx) => {
    const u = getUser(ctx.from.id);
    const price = getDiscountedPrice(80);
    if (u.gold < price) return ctx.answerCbQuery(`❌ ${price} زر لازم داری`);
    u.gold -= price;
    if (!u.charms) u.charms = { power: 0, heal: 0, luck: 0 };
    u.charms.heal = (u.charms.heal || 0) + 1;
    saveDB();
    await ctx.answerCbQuery(`✅ حرز شفا خریداری شد! (${price} زر)`);
});

bot.action('buy_charm_luck', async (ctx) => {
    const u = getUser(ctx.from.id);
    const price = getDiscountedPrice(150);
    if (u.gold < price) return ctx.answerCbQuery(`❌ ${price} زر لازم داری`);
    u.gold -= price;
    if (!u.charms) u.charms = { power: 0, heal: 0, luck: 0 };
    u.charms.luck = (u.charms.luck || 0) + 1;
    saveDB();
    await ctx.answerCbQuery(`✅ حرز شانس خریداری شد! (${price} زر)`);
});

// استفاده از حرز شفا
bot.command('شفا', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u.charms?.heal || u.charms.heal <= 0) return ctx.reply('❌ حرز شفا نداری');
    if (u.hp >= u.maxHp) return ctx.reply('❤️ تندرستی کامل است');
    u.charms.heal--;
    u.hp = Math.min(u.maxHp, u.hp + 50);
    saveDB();
    await ctx.reply(`💚 حرز شفا استفاده شد!\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}`);
});

// ==================== 🏠 کاشانه ====================
bot.action('m_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    let upText = '🏆 والاترین پایه';
    if (next) upText = `⬆️ برکشیدن به پایه ${u.homeLvl + 1}\n🪵 ${next.wood} | 🪨 ${next.stone} | 🥇 ${getDiscountedPrice(next.gold)}\n🎚️ پایه لازم: ${next.needLvl}`;
    
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
    
    const cost = { ...next, gold: getDiscountedPrice(next.gold) };
    if (!hasRes(u, cost)) return ctx.answerCbQuery('❌ کالا کم است');
    
    takeRes(u, cost);
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
    
    updateRotatingShop();
    const fridayTag = isFriday() ? ' 🔥 تخفیف جمعه ۲۵٪' : '';
    
    const text = `🛒 «بازار بزرگ ری»${fridayTag}\n━━━━━━━━━━━━\n🪵 چوب: خرید ${getDiscountedPrice(8)} | فروش ۴\n🪨 سنگ: خرید ${getDiscountedPrice(10)} | فروش ۵\n🍞 نان: خرید ${getDiscountedPrice(10)} | فروش ۵\n⛓️ آهن: خرید ${getDiscountedPrice(25)} | فروش ۱۲\n💎 گوهر: خرید ${getDiscountedPrice(120)} | فروش ۶۰\n━━━━━━━━━━━━\n🔄 فروشگاه چرخان:\n${rotatingShop.items.map(i => `${i.name}: ${i.desc} - ${getDiscountedPrice(i.price)} زر`).join('\n')}\n\n📝 بدون / بنویس:\nخرید ۱۰ چوب\nفروش ۵ سنگ\n\n📝 /خرید_حرز [نوع]`;
    try { await ctx.editMessageText(text, backBtn('shop')); } catch (e) { await ctx.reply(text, backBtn('shop')); }
});

// خرید بدون کامند
bot.hears(/^خرید (\d+) (چوب|سنگ|نان|آهن|گوهر)$/, async (ctx) => {
    const u = getUser(ctx.from.id);
    if (u.homeLvl < 2) return ctx.reply('🔒 بازار نیاز به کاشانه پایه ۲ دارد');
    
    const amt = parseInt(ctx.match[1]);
    const item = ctx.match[2];
    const prices = { چوب: 8, سنگ: 10, نان: 10, آهن: 25, گوهر: 120 };
    const total = getDiscountedPrice(prices[item]) * amt;
    
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

// خرید از فروشگاه چرخان
bot.hears(/^خرید (کتاب اسرار|حرز قدرت|جعبه شفا)$/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const itemName = ctx.match[1];
    const item = rotatingShop.items.find(i => i.name.includes(itemName));
    if (!item) return ctx.reply('❌ کالا در فروشگاه چرخان نیست');
    
    const price = getDiscountedPrice(item.price);
    if (u.gold < price) return ctx.reply(`❌ ${price} زر لازم داری`);
    
    u.gold -= price;
    if (item.type === 'xp') addXP(u, item.value);
    else if (item.type === 'power') {
        if (!u.charms) u.charms = { power: 0, heal: 0, luck: 0 };
        u.charms.power = (u.charms.power || 0) + 1;
    } else if (item.type === 'heal') {
        if (!u.charms) u.charms = { power: 0, heal: 0, luck: 0 };
        u.charms.heal = (u.charms.heal || 0) + 1;
    }
    saveDB();
    await ctx.reply(`✅ ${item.name} خریداری شد!\n💰 ${u.gold} زر`);
});

// ==================== 🛠️ اسلحه‌خانه ====================
bot.action('m_armory', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(WEAPONS)
        .filter(([k]) => k !== 'none')
        .map(([k, w]) => [Markup.button.callback(
            `${u.wOwned && u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''} (⚡${w.p}) ${getDiscountedPrice(w.price)} زر`,
            u.wOwned && u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`
        )]);
    
    btns.push([Markup.button.callback('🔥 ارتقای سلاح (۵۰۰ زر)', 'enchant_w')]);
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
    
    const price = getDiscountedPrice(w.price);
    if (u.gold < price) return ctx.answerCbQuery(`❌ ${price} زر لازم داری`);
    
    u.gold -= price;
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

// ==================== 🛡️ زره‌خانه ====================
bot.action('m_armor_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(ARMORS)
        .filter(([k]) => k !== 'none')
        .map(([k, a]) => [Markup.button.callback(
            `${u.aOwned && u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''} (🛡️${a.d}) ${getDiscountedPrice(a.price)} زر`,
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
    
    const price = getDiscountedPrice(a.price);
    if (u.gold < price) return ctx.answerCbQuery(`❌ ${price} زر لازم داری`);
    
    u.gold -= price;
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

// ==================== ⭐ مهارت‌ها ====================
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

// ==================== 🕯️ آتشکده ====================
bot.action('m_pray', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'pray', CD.pray);
    
    // 🆕 دعای مخصوص روز
    const weekday = WEEKDAYS[new Date().getDay()];
    const specialPray = {
        یکشنبه: { name: '🤲 دعای یکشنبه', reward: '+۲۰ XP' },
        دوشنبه: { name: '🧎 نماز دوشنبه', reward: '+۵۰ زر' },
        سه‌شنبه: { name: '📖 روضه سه‌شنبه', reward: '+۲ وفاداری +۱ شعر' },
        چهارشنبه: { name: '🙏 مناجات چهارشنبه', reward: '+۳۰ HP' },
        پنج‌شنبه: { name: '✨ دعای پنج‌شنبه', reward: '+۱۰ XP +۱۰ زر' },
        جمعه: { name: '🔥 نماز جمعه', reward: 'دوبرابر پاداش' },
        شنبه: { name: '💎 دعای شنبه', reward: '+۱ گوهر' },
    };
    
    const text = `🕯️ «آتشکده آذر»\n━━━━━━━━━━━━\n🔥 «پرستیدن دادگر دین ماست\nهمین راه و رسم و آیین ماست»\n\nچهار گونه نیایش:\n🤲 دعا: نام‌آوری (XP)\n🧎 نماز: زر + نام‌آوری\n📖 روضه: وفاداری + شعر\n🙏 مناجات: تندرستی + وفاداری\n━━━━━━━━━━━━\n🌟 دعای مخصوص ${weekday}:\n${specialPray[weekday].name} → ${specialPray[weekday].reward}\n\n⏱️ ${cd.can ? '✅ آماده نیایش' : '⏳ ' + formatTime(cd.rem)}`;
    
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🤲 دعا', 'pray_dua'), Markup.button.callback('🧎 نماز', 'pray_namaz')],
        [Markup.button.callback('📖 روضه', 'pray_rozeh'), Markup.button.callback('🙏 مناجات', 'pray_monajat')],
        [Markup.button.callback('🌟 دعای روز', 'pray_special')],
        [Markup.button.callback('🔙 بازگشت', 'back_pray')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action(['pray_dua', 'pray_namaz', 'pray_rozeh', 'pray_monajat', 'pray_special'], async (ctx) => {
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
        const levelUpMsg = addXP(u, xpGain);
        reward = `✨ +${xpGain} نام‌آوری${levelUpMsg}`;
    } else if (prayType === 'pray_namaz') {
        u.gold += 30;
        const levelUpMsg = addXP(u, 20);
        reward = `🥇 +۳۰ زر | ✨ +۲۰ نام‌آوری${levelUpMsg}`;
    } else if (prayType === 'pray_rozeh') {
        u.loyalty = (u.loyalty || 0) + 8;
        u.shahnamehCount = (u.shahnamehCount || 0) + 1;
        reward = `⭐ +۸ وفاداری | 📚 +۱ شعر`;
    } else if (prayType === 'pray_monajat') {
        u.hp = Math.min(u.maxHp, u.hp + 50);
        u.loyalty = (u.loyalty || 0) + 5;
        reward = `❤️ +۵۰ تندرستی | ⭐ +۵ وفاداری`;
    } else if (prayType === 'pray_special') {
        const weekday = WEEKDAYS[new Date().getDay()];
        if (weekday === 'یکشنبه') { const msg = addXP(u, 20); reward = `✨ +۲۰ XP${msg}`; }
        else if (weekday === 'دوشنبه') { u.gold += 50; reward = `🥇 +۵۰ زر`; }
        else if (weekday === 'سه‌شنبه') { u.loyalty += 2; u.shahnamehCount++; reward = `⭐ +۲ وفاداری | 📚 +۱ شعر`; }
        else if (weekday === 'چهارشنبه') { u.hp = Math.min(u.maxHp, u.hp + 30); reward = `❤️ +۳۰ HP`; }
        else if (weekday === 'پنج‌شنبه') { const msg = addXP(u, 10); u.gold += 10; reward = `✨ +۱۰ XP | 🥇 +۱۰ زر${msg}`; }
        else if (weekday === 'جمعه') { 
            u.gold += 60;
            const msg = addXP(u, 40);
            reward = `🥇 +۶۰ زر | ✨ +۴۰ XP (دو برابر)${msg}`;
        }
        else if (weekday === 'شنبه') { u.gem = (u.gem || 0) + 1; reward = `💎 +۱ گوهر`; }
    }
    
    progressQuest(u, 'pray');
    saveDB();
    
    const names = { pray_dua: 'دعا', pray_namaz: 'نماز', pray_rozeh: 'روضه', pray_monajat: 'مناجات', pray_special: 'دعای مخصوص روز' };
    const text = `🕯️ «اهورامزدا شنید»\n━━━━━━━━━━━━\n${names[prayType]}ت پذیرفته شد!\n${reward}\n🎚️ پایه: ${u.level}\n🕯️ نیایش‌ها: ${u.prayCount}\n\n🔥 «آتش مقدس خاموش مباد!»`;
    try { await ctx.editMessageText(text, backBtn('pray')); } catch (e) { await ctx.reply(text, backBtn('pray')); }
});

// ==================== 🍽️ سفره ====================
bot.action('m_eat', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🍽️ «سفره ایرانی»\n━━━━━━━━━━━━\n«بفرمود تا سفره گستردند»\n\n🍞 نان (۳۰ HP) - ۵ زر\n🍖 کباب (۵۰ HP) - ۱۵ زر\n🐟 ماهی (۲۵ HP) - ۸ زر\n🍗 ماکیان (۴۵ HP) - ۱۲ زر\n🥩 گوشت (۷۰ HP) - ۲۰ زر\n🥘 آبگوشت (۵۵ HP) - ۱۵ زر\n🍜 آش (۳۵ HP) - ۱۰ زر\n🍰 باقلوا (۲۵ HP) - ۸ زر\n🍯 انگبین (۲۰ HP) - ۶ زر\n🍚 چلوکباب (۸۰ HP) - ۲۵ زر\n\n💧 آب (۴۰ تشنگی) - ۳ زر\n🧃 شربت (۵۰ تشنگی) - ۵ زر\n🍺 دوغ (۲۵ تشنگی) - ۳ زر\n🍵 چای (۳۵ تشنگی) - ۴ زر\n☕ قهوه (۳۰ تشنگی +۱۰XP) - ۸ زر\n🥛 شیر (۴۵ تشنگی) - ۶ زر\n🍹 سکنجبین (۵۵ تشنگی) - ۷ زر\n🍎 آب انار (۶۰ تشنگی) - ۹ زر\n🌹 گلاب (۴۰ تشنگی +۵XP) - ۶ زر\n🥤 ماست (۳۵ تشنگی +۱۰HP) - ۵ زر\n\n📝 /بخور [غذا] - مثل /بخور کباب`;
    const btns = Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_eat')]]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

// دستور خوردن غذا
bot.command('بخور', async (ctx) => {
    const u = getUser(ctx.from.id);
    const foodName = ctx.message.text.split(' ')[1];
    
    const foodMap = {
        'نان': { key: 'bread', data: FOODS.bread, price: 5 },
        'کباب': { key: 'meat', data: FOODS.meat, price: 15 },
        'ماهی': { key: 'fish', data: FOODS.fish, price: 8 },
        'ماکیان': { key: 'chicken', data: FOODS.chicken, price: 12 },
        'گوشت': { key: 'steak', data: FOODS.steak, price: 20 },
        'آبگوشت': { key: 'stew', data: FOODS.stew, price: 15 },
        'آش': { key: 'noodle', data: FOODS.noodle, price: 10 },
        'باقلوا': { key: 'cake', data: FOODS.cake, price: 8 },
        'انگبین': { key: 'honey', data: FOODS.honey, price: 6 },
        'چلوکباب': { key: 'rice', data: FOODS.rice, price: 25 },
        'آب': { key: 'water', data: DRINKS.water, price: 3, isDrink: true },
        'شربت': { key: 'juice', data: DRINKS.juice, price: 5, isDrink: true },
        'دوغ': { key: 'soda', data: DRINKS.soda, price: 3, isDrink: true },
        'چای': { key: 'tea', data: DRINKS.tea, price: 4, isDrink: true },
        'قهوه': { key: 'coffee', data: DRINKS.coffee, price: 8, isDrink: true },
        'شیر': { key: 'milk', data: DRINKS.milk, price: 6, isDrink: true },
        'سکنجبین': { key: 'sherbet', data: DRINKS.sherbet, price: 7, isDrink: true },
        'آب انار': { key: 'pomegranate', data: DRINKS.pomegranate, price: 9, isDrink: true },
        'گلاب': { key: 'rosewater', data: DRINKS.rosewater, price: 6, isDrink: true },
        'ماست': { key: 'yogurt', data: DRINKS.yogurt, price: 5, isDrink: true },
    };
    
    const item = foodMap[foodName];
    if (!item) return ctx.reply('❌ غذای نامعتبر\n📝 /بخور [نان|کباب|ماهی|...]');
    
    if (u.gold < item.price) return ctx.reply(`❌ ${item.price} زر لازم داری`);
    
    u.gold -= item.price;
    if (!item.isDrink) {
        u.hp = Math.min(u.maxHp, u.hp + item.data.h);
        if (item.data.heal) u.hp = Math.min(u.maxHp, u.hp + item.data.heal);
    } else {
        // تشنگی - فعلاً فقط HP
        u.hp = Math.min(u.maxHp, u.hp + item.data.t);
        if (item.data.xp) addXP(u, item.data.xp);
        if (item.data.heal) u.hp = Math.min(u.maxHp, u.hp + item.data.heal);
    }
    saveDB();
    await ctx.reply(`🍽️ ${item.data.n} خوردی!\n❤️ تندرستی: ${hpBar(u.hp, u.maxHp)}\n💰 زر: ${u.gold}`);
});

// ==================== 📚 کتابخانه ====================
bot.action('m_library', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '📚 «کتابخانه گندیشاپور»\n━━━━━━━━━━━━\nکتاب مورد نظر را انتخاب کن:';
    const btns = Object.entries(LIBRARY).map(([key, book]) => 
        [Markup.button.callback(book.name, `read_${key}`)]
    );
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_library')]);
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/read_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const bookKey = ctx.match[1];
    const book = LIBRARY[bookKey];
    if (!book) return;
    
    const cd = checkCD(u, `library_${bookKey}`, CD.library);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    setCD(u, `library_${bookKey}`);
    
    const verse = book.verses[rand(0, book.verses.length - 1)];
    giveReward(u, verse.rew);
    saveDB();
    
    const text = `📖 ${book.name}\n🎭 سرودهٔ ${book.poet}\n━━━━━━━━━━━━\n${verse.text}\n━━━━━━━━━━━━\n🎁 پاداش: ${rwText(verse.rew)}`;
    try { await ctx.editMessageText(text, backBtn('library')); } catch (e) { await ctx.reply(text, backBtn('library')); }
});

// ==================== 👤 بزرگان ====================
bot.action('m_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '👤 «دیدار با بزرگان»\n━━━━━━━━━━━━\nهر بار ۱ ساعت کول‌داون دارد:\n\n👴 زال زر (۵۰ زر) → +۱ گوهر هنر\n🦅 سیمرغ (۱۰۰ زر) → درمان کامل\n⚔️ رستم دستان (۸۰ زر) → +۵۰ XP\n📜 فردوسی (۳۰ زر) → +۵۰ زر +۱ شعر\n🔨 کاوه آهنگر (۲۰۰ زر) → +۵ آهن\n👑 جمشید (۵۰۰ زر) → +۲۰۰ زر +۲ گوهر\n💧 آناهیتا (۱۵۰ زر) → +۵ نان +۳ آب\n☀️ میترا (۳۰۰ زر) → +۱۰۰ XP\n🔥 زرتشت (۴۰۰ زر) → +۳ گوهر هنر\n👑 کوروش بزرگ (۱۰۰۰ زر) → +۵۰۰ زر +۱۰۰ امتیاز میدان';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('👴 زال زر', 'npc_zal'), Markup.button.callback('🦅 سیمرغ', 'npc_simurgh')],
        [Markup.button.callback('⚔️ رستم', 'npc_rostam'), Markup.button.callback('📜 فردوسی', 'npc_ferdosi')],
        [Markup.button.callback('🔨 کاوه', 'npc_kaveh'), Markup.button.callback('👑 جمشید', 'npc_jamshid')],
        [Markup.button.callback('💧 آناهیتا', 'npc_anahita'), Markup.button.callback('☀️ میترا', 'npc_mitra')],
        [Markup.button.callback('🔥 زرتشت', 'npc_zoroaster'), Markup.button.callback('👑 کوروش', 'npc_cyrus')],
        [Markup.button.callback('🔙 بازگشت', 'back_npc')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

Object.entries(NPCS).forEach(([key, npc]) => {
    bot.action(`npc_${key}`, async (ctx) => {
        await ctx.answerCbQuery();
        const u = getUser(ctx.from.id);
        const cd = checkCD(u, 'npc', CD.npc);
        if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
        
        const price = getDiscountedPrice(npc.price);
        if (u.gold < price) return ctx.answerCbQuery(`❌ ${price} زر لازم داری`);
        
        u.gold -= price;
        const result = npc.f(u);
        setCD(u, 'npc');
        saveDB();
        
        const text = `👤 «${npc.n}»\n━━━━━━━━━━━━\n${result}\n💰 هزینه: ${price} زر\n🥇 زر: ${u.gold}`;
        try { await ctx.editMessageText(text, backBtn('npc')); } catch (e) { await ctx.reply(text, backBtn('npc')); }
    });
});

// ==================== 🎁 صندوقچه ====================
bot.action('m_box', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'box', CD.box);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    setCD(u, 'box');
    
    const loot = BOX_LOOT[rand(0, BOX_LOOT.length - 1)];
    loot.f(u);
    saveDB();
    
    const text = `🎁 «صندوقچه اسرارآمیز»\n━━━━━━━━━━━━\n${loot.n} به دست آوردی!\n⏳ ${formatTime(CD.box)} دیگر`;
    try { await ctx.editMessageText(text, backBtn('other')); } catch (e) { await ctx.reply(text, backBtn('other')); }
});

// ==================== 🎁 سایر امکانات ====================
bot.action('m_other', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🎁 «سایر امکانات»\n━━━━━━━━━━━━';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🎁 صندوقچه', 'm_box'), Markup.button.callback('🎁 پاداش روزانه', 'daily_reward')],
        [Markup.button.callback('📜 مأموریت‌ها', 'm_quest'), Markup.button.callback('🏆 دستاوردها', 'm_achieve')],
        [Markup.button.callback('🐎 حیوانات', 'm_pet'), Markup.button.callback('📖 راهنما', 'm_guide')],
        [Markup.button.callback('⏱️ کول‌داون‌ها', 'm_cd')],
        [Markup.button.callback('🔙 بازگشت', 'back_other')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('daily_reward', async (ctx) => {
    await ctx.answerCbQuery();
    await dailyReward(ctx);
    try { await ctx.editMessageText('✅ پاداش روزانه دریافت شد!', backBtn('other')); } catch (e) {}
});

bot.action('m_quest', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    let text = '📋 «مأموریت‌های روزانه»\n━━━━━━━━━━━━\n';
    u.quests.forEach(q => {
        const progress = u.questProgress[q.t] || 0;
        text += `${q.n}: ${progress}/${q.g} → ${rwText(q.rew)}\n`;
    });
    text += '\n✅ پس از اتمام خودکار پاداش می‌گیری!';
    try { await ctx.editMessageText(text, backBtn('other')); } catch (e) { await ctx.reply(text, backBtn('other')); }
});

bot.action('m_achieve', async (ctx) => {
    const u = getUser(ctx.from.id);
    const text = `🏆 «دستاوردها»\n━━━━━━━━━━━━\n${u.achievements?.length ? u.achievements.join('\n') : 'هنوز دستاوردی نداری'}`;
    try { await ctx.editMessageText(text, backBtn('other')); } catch (e) { await ctx.reply(text, backBtn('other')); }
});

bot.action('m_pet', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🐎 «اصطبل رخش»\n━━━━━━━━━━━━\nحیوان فعلی: ${u.pet ? PETS[u.pet]?.n : 'ندارد'}\n\nلیست حیوانات:\n${Object.entries(PETS).map(([k, p]) => `${p.n}: ${p.price} زر - ${p.bonus}`).join('\n')}\n\n📝 /خرید_حیوان [نام]`;
    const btns = Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_other')]]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.command('خرید_حیوان', async (ctx) => {
    const u = getUser(ctx.from.id);
    const petName = ctx.message.text.split(' ')[1];
    const pet = Object.entries(PETS).find(([k, p]) => p.n.includes(petName));
    if (!pet) return ctx.reply('❌ حیوان نامعتبر\n📝 /خرید_حیوان [رخش|باز شکاری|...]');
    
    const [key, data] = pet;
    const price = getDiscountedPrice(data.price);
    if (u.gold < price) return ctx.reply(`❌ ${price} زر لازم داری`);
    
    u.gold -= price;
    u.pet = key;
    saveDB();
    await ctx.reply(`✅ ${data.n} خریداری شد!\n🐎 ${data.bonus}`);
});

bot.action('m_guide', async (ctx) => {
    const text = `📖 «راهنمای پهلوانان»\n━━━━━━━━━━━━\n🌲 شکارگاه: هر ۲ دقیقه\n⚔️ رزم: هر ۳ دقیقه\n🕯️ آتشکده: هر ۶ ساعت\n🎁 صندوقچه: هر ۴ ساعت\n📚 کتابخانه: هر ۱ ساعت\n🏥 شفاخانه: هر ۵ دقیقه\n🎁 پاداش روزانه: هر ۲۴ ساعت\n\n💪 قدرت = سطح×۲ + مهارت‌ها\n❤️ جان = ۱۰۰ + (سطح×۱۰)\n🔥 جمعه‌ها تخفیف ۲۵٪`;
    try { await ctx.editMessageText(text, backBtn('other')); } catch (e) { await ctx.reply(text, backBtn('other')); }
});

bot.action('m_cd', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cds = [
        `🌲 شکارگاه: ${checkCD(u, 'gather', CD.gather).can ? '✅' : '⏳ ' + formatTime(checkCD(u, 'gather', CD.gather).rem)}`,
        `⚔️ رزم: ${checkCD(u, 'fight', CD.fight).can ? '✅' : '⏳ ' + formatTime(checkCD(u, 'fight', CD.fight).rem)}`,
        `🕯️ آتشکده: ${checkCD(u, 'pray', CD.pray).can ? '✅' : '⏳ ' + formatTime(checkCD(u, 'pray', CD.pray).rem)}`,
        `🏟️ پی‌وی‌پی: ${checkCD(u, 'pvp', CD.pvp).can ? '✅' : '⏳ ' + formatTime(checkCD(u, 'pvp', CD.pvp).rem)}`,
        `🎁 صندوقچه: ${checkCD(u, 'box', CD.box).can ? '✅' : '⏳ ' + formatTime(checkCD(u, 'box', CD.box).rem)}`,
        `🏥 شفاخانه: ${checkCD(u, 'heal', CD.heal).can ? '✅' : '⏳ ' + formatTime(checkCD(u, 'heal', CD.heal).rem)}`,
    ];
    const text = `⏱️ «کول‌داون‌ها»\n━━━━━━━━━━━━\n${cds.join('\n')}`;
    try { await ctx.editMessageText(text, backBtn('other')); } catch (e) { await ctx.reply(text, backBtn('other')); }
});

// ==================== 👑 بخش ادمین (مخفی) ====================
bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    
    const totalUsers = Object.keys(db.users).length;
    const totalGold = Object.values(db.users).reduce((sum, u) => sum + (u.gold || 0), 0);
    const activeToday = Object.values(db.users).filter(u => u.lastLoginDate === new Date().toDateString()).length;
    
    const text = `👑 «پنل ادمین»\n━━━━━━━━━━━━\n📊 آمار کلی:\n👥 کاربران: ${totalUsers}\n🥇 کل زر: ${totalGold}\n📅 فعال امروز: ${activeToday}\n🗄️ حجم دیتابیس: ${(fs.statSync(DB_PATH).size / 1024).toFixed(2)} KB\n━━━━━━━━━━━━\n📝 دستورات ادمین:\n/sendall [پیام] - ارسال همگانی\n/broadcast - ارسال به همه (دکمه‌دار)\n/addgold [مقدار] [ایدی] - اضافه کردن زر\n/setlevel [سطح] [ایدی] - تنظیم سطح\n/event [شماره 1-10] - فعال‌سازی رویداد\n/resetuser [ایدی] - ریست کاربر\n/backup - گرفتن بکاپ`;
    
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('📊 آمار دقیق', 'admin_stats')],
        [Markup.button.callback('🎁 هدیه به همه', 'admin_gift')],
        [Markup.button.callback('🌟 فعال‌سازی باس فصلی', 'admin_spawn_boss')],
        [Markup.button.callback('💾 بکاپ', 'admin_backup')],
    ]);
    await ctx.reply(text, btns);
});

// آمار دقیق
bot.action('admin_stats', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const users = Object.values(db.users);
    const avgLevel = (users.reduce((sum, u) => sum + (u.level || 1), 0) / users.length).toFixed(1);
    const topGold = users.sort((a, b) => (b.gold || 0) - (a.gold || 0)).slice(0, 5);
    const topLevel = users.sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, 5);
    
    let text = `📊 «آمار پیشرفته»\n━━━━━━━━━━━━\n📈 میانگین سطح: ${avgLevel}\n🏆 زرین‌ترین ها:\n${topGold.map((u, i) => `${i+1}. ${u.name}: ${u.gold} زر`).join('\n')}\n━━━━━━━━━━━━\n🎚️ سطح بالاها:\n${topLevel.map((u, i) => `${i+1}. ${u.name}: سطح ${u.level}`).join('\n')}`;
    await ctx.answerCbQuery();
    try { await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'admin_back')]])); } catch(e) { await ctx.reply(text); }
});

// هدیه به همه
bot.action('admin_gift', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    await ctx.answerCbQuery();
    await ctx.reply('💰 مقدار زر برای هدیه به همه کاربران را وارد کن:');
    ctx.session = { adminAction: 'gift' };
});

bot.action('admin_spawn_boss', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    seasonalBoss.active = true;
    seasonalBoss.hp = seasonalBoss.maxHp;
    seasonalBoss.defeated = false;
    seasonalBoss.lastSpawn = Date.now();
    await ctx.answerCbQuery('✅ باس فصلی فعال شد!');
    try { await ctx.editMessageText('🌟 باس فصلی ظاهر شد!', Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'admin_back')]])); } catch(e) {}
});

bot.action('admin_backup', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const backupPath = `./backup_${Date.now()}.json`;
    fs.copyFileSync(DB_PATH, backupPath);
    await ctx.answerCbQuery('✅ بکاپ گرفته شد');
    await ctx.replyWithDocument({ source: backupPath, filename: `backup_${Date.now()}.json` });
    fs.unlinkSync(backupPath);
});

bot.action('admin_back', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    bot.command('admin')(ctx);
});

// sendall
bot.command('sendall', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const msg = ctx.message.text.split(' ').slice(1).join(' ');
    if (!msg) return ctx.reply('❌ پیام را بنویس: /sendall متن پیام');
    
    let success = 0, fail = 0;
    for (const uid of Object.keys(db.users)) {
        try {
            await bot.telegram.sendMessage(uid, `📢 «پیام همگانی»\n━━━━━━━━━━━━\n${msg}`);
            success++;
        } catch(e) { fail++; }
        await new Promise(r => setTimeout(r, 50));
    }
    await ctx.reply(`✅ ارسال شد!\n✅ موفق: ${success}\n❌ ناموفق: ${fail}`);
});

// broadcast interactive
bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    await ctx.reply('📝 متن پیام همگانی را بفرست:');
    ctx.session = { adminAction: 'broadcast' };
});

// addgold
bot.command('addgold', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const amount = parseInt(args[1]);
    const targetId = args[2];
    if (!amount || !targetId) return ctx.reply('❌ /addgold [مقدار] [ایدی]');
    
    const user = db.users[targetId];
    if (!user) return ctx.reply('❌ کاربر یافت نشد');
    user.gold = (user.gold || 0) + amount;
    saveDB();
    await ctx.reply(`✅ ${amount} زر به ${user.name} اضافه شد`);
    try { await bot.telegram.sendMessage(targetId, `👑 هدیه شاهی!\n🥇 +${amount} زر به تو بخشیده شد`); } catch(e) {}
});

// setlevel
bot.command('setlevel', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const level = parseInt(args[1]);
    const targetId = args[2];
    if (!level || !targetId) return ctx.reply('❌ /setlevel [سطح] [ایدی]');
    
    const user = db.users[targetId];
    if (!user) return ctx.reply('❌ کاربر یافت نشد');
    user.level = level;
    user.maxHp = 100 + (level - 1) * 10;
    user.hp = user.maxHp;
    user.power = 5 + (level - 1) * 2;
    saveDB();
    await ctx.reply(`✅ سطح ${user.name} به ${level} تغییر کرد`);
});

// رویداد دستی
bot.command('event', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const eventNum = parseInt(args[1]);
    if (!eventNum || eventNum < 1 || eventNum > 10) return ctx.reply('❌ /event [1-10]');
    
    for (const uid of Object.keys(db.users)) {
        const u = db.users[uid];
        const event = EVENTS[eventNum - 1];
        const result = event.f(u);
        try {
            await bot.telegram.sendMessage(uid, `🌍 «رویداد: ${event.n}»\n${event.desc}\n${result}`);
        } catch(e) {}
        await new Promise(r => setTimeout(r, 50));
    }
    saveDB();
    await ctx.reply(`✅ رویداد ${event.n} برای همه اجرا شد`);
});

// resetuser
bot.command('resetuser', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const targetId = ctx.message.text.split(' ')[1];
    if (!targetId) return ctx.reply('❌ /resetuser [ایدی]');
    
    if (db.users[targetId]) {
        delete db.users[targetId];
        saveDB();
        await ctx.reply(`✅ کاربر ${targetId} ریست شد`);
    } else {
        ctx.reply('❌ کاربر یافت نشد');
    }
});

// backup
bot.command('backup', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const backupPath = `./backup_${Date.now()}.json`;
    fs.copyFileSync(DB_PATH, backupPath);
    await ctx.replyWithDocument({ source: backupPath, filename: `backup_${Date.now()}.json` });
    fs.unlinkSync(backupPath);
});

// دریافت پیام برای session های ادمین
bot.on('text', async (ctx) => {
    if (ctx.session?.adminAction === 'gift') {
        const amount = parseInt(ctx.message.text);
        if (isNaN(amount)) return ctx.reply('❌ عدد وارد کن');
        let success = 0;
        for (const uid of Object.keys(db.users)) {
            db.users[uid].gold = (db.users[uid].gold || 0) + amount;
            success++;
            try { await bot.telegram.sendMessage(uid, `👑 هدیه شاهی!\n🥇 +${amount} زر به تو بخشیده شد`); } catch(e) {}
            await new Promise(r => setTimeout(r, 50));
        }
        saveDB();
        ctx.session = null;
        await ctx.reply(`✅ ${amount} زر به ${success} کاربر داده شد`);
    } else if (ctx.session?.adminAction === 'broadcast') {
        const msg = ctx.message.text;
        let success = 0, fail = 0;
        for (const uid of Object.keys(db.users)) {
            try {
                await bot.telegram.sendMessage(uid, `📢 «پیام همگانی»\n━━━━━━━━━━━━\n${msg}`);
                success++;
            } catch(e) { fail++; }
            await new Promise(r => setTimeout(r, 50));
        }
        ctx.session = null;
        await ctx.reply(`✅ ارسال شد!\n✅ موفق: ${success}\n❌ ناموفق: ${fail}`);
    }
});

// ==================== 🚀 استارت ربات ====================
bot.launch().then(() => console.log('✅ ربات روشن شد!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));