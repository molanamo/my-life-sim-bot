const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ==================== 🔑 توکن ربات ====================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_PATH = './data.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('❌ ای شهریار! توکن ربات را در BOT_TOKEN بگذار');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== 📂 دیتابیس ====================
let db = { users: {}, clans: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {}, clans: {} }; }
}

function saveDB() {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8'); } catch (e) {}
}

// ==================== 🔢 توابع کمکی ====================
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function isAdmin(id) { return Number(id) === ADMIN_ID; }

function formatTime(ms) {
    if (ms <= 0) return 'آماده';
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h > 0) return `${h} ساعت و ${m % 60} دقیقه`;
    if (m > 0) return `${m} دقیقه و ${s % 60} ثانیه`;
    return `${s} ثانیه`;
}

function progressBar(c, max, len = 8) {
    const f = Math.floor(Math.max(0, Math.min(c || 0, max || 1)) / (max || 1) * len);
    return '🟩'.repeat(Math.max(0, f)) + '⬜'.repeat(Math.max(0, len - f));
}

// ==================== ⏱️ کول‌داون‌ها ====================
const CD = {
    gather: 120000,      // ۲ دقیقه
    fight: 180000,       // ۳ دقیقه
    boss: 600000,        // ۱۰ دقیقه
    pray: 21600000,      // ۶ ساعت
    pvp: 300000,         // ۵ دقیقه
    daily: 86400000,     // ۲۴ ساعت
    shahnameh: 3600000,  // ۱ ساعت
    npc: 3600000,        // ۱ ساعت
    box: 14400000,       // ۴ ساعت
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

// ==================== 📜 اشعار شاهنامه ====================
const SHAHNAMEH_VERSES = [
    { verse: 'توانا بود هر که دانا بود', reward: 15 },
    { verse: 'به نام خداوند جان و خرد', reward: 10 },
    { verse: 'هنر نزد ایرانیان است و بس', reward: 25 },
    { verse: 'چو ایران نباشد تن من مباد', reward: 30 },
    { verse: 'میازار موری که دانه‌کش است', reward: 20 },
    { verse: 'که جان و خرد را فزاید همی', reward: 12 },
    { verse: 'ز دانش دل پیر برنا بود', reward: 18 },
];

// ==================== 💀 توهین‌های سلطنتی ====================
const TAUNTS = [
    '👑 شاهنشاه می‌فرماید: حریف بیچاره حتی سپرش هم ترکید!',
    '⚔️ رستم می‌گه: اینم از انتقام! حالا برو زانوی غم بغل بگیر!',
    '🦅 سیمرغ شاهد بود: زره‌ات مثل کاغذ پاره شد!',
    '🔥 آتشکده روشن شد: سلاح‌ات رو بفروش، به درد نمی‌خوره!',
    '👹 حتی دیو سپید هم به حال تو گریه کرد!',
    '🐉 ضحاک می‌گه: اینقدر ضعیفی که مارهای شونه‌م خندیدن!',
    '🏛️ در بارگاه جمشید اعلام شد: تو لایق شمشیر نیستی!',
    '📜 کتیبه‌ها نوشتن: برو چوپانی کن، جنگاوری پیشکشت!',
];

// ==================== 🗡️ سلاح‌ها ====================
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

// ==================== 🛡️ زره‌ها ====================
const ARMORS = {
    none: { n: '❌ بدون زره', d: 0, price: 0, lvl: 0 },
    wood_shield: { n: '🪵 سپر چوبی', d: 3, price: 50, lvl: 1 },
    leather: { n: '🐄 چرم سکایی', d: 7, price: 150, lvl: 3 },
    hakhamaneshi: { n: '⛓️ زره هخامنشی', d: 12, price: 400, lvl: 5 },
    sasani: { n: '🥇 زره ساسانی', d: 18, price: 800, lvl: 8 },
    babr_bayan: { n: '🐉 ببر بیان', d: 25, price: 2000, lvl: 12 },
};

// ==================== 🍽️ غذاها ====================
const FOODS = {
    bread: { n: '🍞 نان روغنی', h: 30 }, meat: { n: '🍖 کباب شکار', h: 50 },
    fish: { n: '🐟 ماهی', h: 25 }, chicken: { n: '🍗 ماکیان بریان', h: 45 },
    steak: { n: '🥩 گوشت بره', h: 70 }, stew: { n: '🥘 آبگوشت', h: 55 },
    noodle: { n: '🍜 آش رشته', h: 35 }, cake: { n: '🍰 باقلوا', h: 25, heal: 20 },
    honey: { n: '🍯 انگبین', h: 20, heal: 30 },
};

// ==================== 🧃 نوشیدنی‌ها ====================
const DRINKS = {
    water: { n: '💧 آب چشمه', t: 40 }, juice: { n: '🧃 شربت آلبالو', t: 50 },
    soda: { n: '🍺 دوغ', t: 25 }, tea: { n: '🍵 چای بهارنارنج', t: 35 },
    coffee: { n: '☕ قهوه ترک', t: 30, xp: 10 }, milk: { n: '🥛 شیر میش', t: 45 },
};

// ==================== 👹 موجودات ====================
const ALL_ENEMIES = [
    // ددان (حیوانات)
    { n: '🐺 گرگ تورانی', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8, type: 'animal' },
    { n: '🐗 گراز مازندران', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10, type: 'animal' },
    { n: '🦊 شغال دشتی', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12, type: 'animal' },
    { n: '🐻 خرس البرز', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15, type: 'animal' },
    // دیوان
    { n: '👹 دیو سفید', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18, type: 'demon' },
    { n: '👺 دیو سیاه', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22, type: 'demon' },
    { n: '👾 اکوان دیو', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28, type: 'demon' },
    // موجودات پلید (باس‌ها)
    { n: '🐉 ضحاک ماردوش', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, type: 'boss', ml: 8 },
    { n: '🦅 سیمرغ خشمگین', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, type: 'boss', ml: 10 },
    { n: '👿 ارجنگ دیو', p: 35, loss: [30,60], rew: { gold: 300, iron: 5, gem: 3 }, xp: 60, type: 'boss', ml: 6 },
    { n: '💀 دیو سپید بزرگ', p: 65, loss: [50,100], rew: { gold: 1500, dragon_scale: 3, gem: 15 }, xp: 250, type: 'boss', ml: 15 },
];

// ==================== 🎁 صندوقچه راز ====================
const BOX_LOOT = [
    { n: '🪵 ده چوب', effect: (u) => { if (!u.res) u.res = {}; u.res.wood = (u.res.wood || 0) + 10; } },
    { n: '🪨 ده سنگ', effect: (u) => { if (!u.res) u.res = {}; u.res.stone = (u.res.stone || 0) + 10; } },
    { n: '🥇 پنجاه زر', effect: (u) => { u.gold += 50; } },
    { n: '🥇 صد زر', effect: (u) => { u.gold += 100; } },
    { n: '🥇 دویست زر', effect: (u) => { u.gold += 200; } },
    { n: '💎 یک گوهر', effect: (u) => { if (!u.items) u.items = {}; u.items.gem = (u.items.gem || 0) + 1; } },
    { n: '🍞 سه نان', effect: (u) => { if (!u.items) u.items = {}; u.items.bread = (u.items.bread || 0) + 3; } },
    { n: '💧 سه آب', effect: (u) => { if (!u.items) u.items = {}; u.items.water = (u.items.water || 0) + 3; } },
    { n: '✨ سی نام‌آوری', effect: (u) => { u.xp = (u.xp || 0) + 30; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } } },
    { n: '❤️ درمان کامل', effect: (u) => { u.hp = u.maxHp; } },
];

// ==================== 🏠 ارتقای خانه ====================
const HOME_UP = {
    2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, nl: 3 },
    3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, nl: 5 },
    4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, nl: 8 },
    5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, nl: 12 },
};

// ==================== 🏆 لیگ‌های PvP ====================
const PVP_LEAGUES = {
    bronze: { n: '🥉 برنز', min: 0 },
    silver: { n: '🥈 نقره', min: 100 },
    gold: { n: '🥇 طلا', min: 300 },
    diamond: { n: '💎 الماس', min: 600 },
    legendary: { n: '👑 افسانه‌ای', min: 1000 },
};

// ==================== 🐎 حیوانات خونگی ====================
const PETS = {
    horse: { n: '🐎 رخش', price: 500, bonus: 'سرعت جستجو +۳۰٪' },
    falcon: { n: '🦅 باز شکاری', price: 400, bonus: 'شانس شکار +۲۰٪' },
    dog: { n: '🐕 سگ گله', price: 300, bonus: 'دفاع +۵' },
    cat: { n: '🐈 گربه ایرانی', price: 200, bonus: 'شانس آیتم +۱۵٪' },
};

// ==================== 👤 بزرگان (NPC) ====================
const NPCS = {
    zal: { n: '👴 زال زر', desc: 'آموزش مهارت', price: 50, effect: (u) => { u.sp = (u.sp || 0) + 1; return '⭐ +۱ گوهر هنر'; } },
    simurgh: { n: '🦅 سیمرغ', desc: 'شفابخش افسانه‌ای', price: 100, effect: (u) => { u.hp = u.maxHp; return '❤️ درمان کامل'; } },
    rostam: { n: '⚔️ رستم دستان', desc: 'آموزش مبارزه', price: 80, effect: (u) => { addXP(u, 50); return '✨ +۵۰ نام‌آوری'; } },
    ferdosi: { n: '📜 فردوسی', desc: 'شعر و زر', price: 30, effect: (u) => { u.gold += 50; u.shahnamehCount = (u.shahnamehCount || 0) + 1; return '🥇 +۵۰ زر | 📚 +۱ شعر'; } },
};

// ==================== 📋 مأموریت‌های روزانه ====================
const QUESTS = [
    { n: 'شکار روز', desc: '۳ جستجو', target: 'gather', goal: 3, rew: { gold: 100, xp: 20 } },
    { n: 'نبردآور', desc: '۲ مبارزه', target: 'fight', goal: 2, rew: { gold: 150, xp: 30 } },
    { n: 'پهلوان', desc: '۱ برد PvP', target: 'pvp_win', goal: 1, rew: { gold: 200, xp: 40 } },
    { n: 'نیایشگر', desc: '۱ آتشکده', target: 'pray', goal: 1, rew: { gold: 80, xp: 15 } },
    { n: 'شاعر', desc: '۱ شاهنامه', target: 'shahnameh', goal: 1, rew: { gold: 60, xp: 10 } },
];

// ==================== 🏆 دستاوردها ====================
const ACHIEVEMENTS = [
    { id: 'first_blood', n: '🩸 اولین خون', desc: '۱ برد در نبرد', check: (u) => (u.stats?.fw || 0) + (u.stats?.dw || 0) >= 1 },
    { id: 'warrior', n: '⚔️ جنگجو', desc: '۱۰ برد', check: (u) => (u.stats?.fw || 0) + (u.stats?.dw || 0) >= 10 },
    { id: 'hero', n: '🏆 پهلوان', desc: '۵۰ برد', check: (u) => (u.stats?.fw || 0) + (u.stats?.dw || 0) >= 50 },
    { id: 'pvp_king', n: '👑 سلطان PvP', desc: '۱۰۰ برد PvP', check: (u) => (u.pvpWins || 0) >= 100 },
    { id: 'rich', n: '💰 خزانه‌دار', desc: '۱۰۰۰۰ طلا', check: (u) => (u.gold || 0) >= 10000 },
    { id: 'builder', n: '🏠 معمار', desc: 'خانه لول ۵', check: (u) => (u.homeLvl || 1) >= 5 },
    { id: 'collector', n: '⛏️ گردآور', desc: '۱۰۰ جستجو', check: (u) => (u.gatherCount || 0) >= 100 },
    { id: 'shahnameh_reader', n: '📚 شاعر', desc: '۲۰ شعر', check: (u) => (u.shahnamehCount || 0) >= 20 },
    { id: 'loyal', n: '⭐ وفادار', desc: '۵۰۰ وفاداری', check: (u) => (u.loyalty || 0) >= 500 },
    { id: 'boss_slayer', n: '🐉 اژدهاکش', desc: '۱۰ باس', check: (u) => (u.stats?.bw || 0) >= 10 },
];

// ==================== 🌍 رویدادهای تصادفی ====================
const EVENTS = [
    { n: '🌪️ طوفان سهمگین', desc: 'طوفان به کاشانه‌ات آسیب زد!', effect: (u) => { if (!u.res) u.res = {}; u.res.wood = Math.floor((u.res.wood || 0) * 0.7); u.res.stone = Math.floor((u.res.stone || 0) * 0.7); return '🪵 و 🪨 کاهش یافت'; } },
    { n: '💰 گنج پنهان', desc: 'گنج کهنه پیدا کردی!', effect: (u) => { const g = rand(100, 500); u.gold += g; return `🥇 +${g} زر`; } },
    { n: '🎁 هدیه آسمانی', desc: 'بسته از آسمان افتاد!', effect: (u) => { if (!u.items) u.items = {}; u.items.bread = (u.items.bread || 0) + 3; u.items.water = (u.items.water || 0) + 2; return '🍞 +۳ | 💧 +۲'; } },
    { n: '🤒 بیماری', desc: 'بیمار شدی...', effect: (u) => { u.hp = Math.floor(u.hp * 0.5); return '❤️ نصف شد'; } },
];

// ==================== 📦 منابع ====================
const RES = { wood: '🪵', stone: '🪨', metal: '🔩', iron: '⛓️', gold: '🥇', toman: '💵' };

console.log('✅ بخش اول - داده‌ها و تنظیمات بارگذاری شد');

// ==================== 👤 مدیریت کاربر ====================
function getUser(id, name) {
    const uid = String(id);
    
    // کاربر جدید
    if (!db.users[uid]) {
        db.users[uid] = {
            id: uid,
            name: name || 'ناشناس',
            level: 1,
            xp: 0,
            gold: 100,
            hp: 100,
            maxHp: 100,
            power: 5,
            homeLvl: 1,
            clinicLvl: 1,
            weapon: 'none',
            armor: 'none',
            skills: { g: 0, h: 0, c: 0, s: 0 },
            sp: 0,
            res: { wood: 20, stone: 20, metal: 10, iron: 5, gold: 100, toman: 0 },
            items: { bandage: 1, bread: 2, water: 2 },
            wOwned: { none: true },
            aOwned: { none: true },
            cooldowns: {},
            daily: {},
            stats: { fw: 0, dw: 0, bw: 0, gath: 0 },
            pvpWins: 0,
            pvpLosses: 0,
            pvpRating: 0,
            pvpLeague: 'bronze',
            pvpStreak: 0,
            pvpHistory: [],
            honorPoints: 0,
            loyalty: 0,
            shahnamehCount: 0,
            prayCount: 0,
            pet: null,
            bankGold: 0,
            bankInterest: 0,
            weaponEnchant: null,
            achievements: [],
            quests: [],
            questProgress: {},
            lastQuestDate: '',
            clan: null,
            logins: 1,
            gatherCount: 0,
            lastBox: 0,
            lastPray: 0,
            lastDaily: 0,
            lastLoginDate: '',
            pendingFight: null,
            pendingPvP: null,
        };
        rollQuests(db.users[uid]);
        saveDB();
        return db.users[uid];
    }
    
    // کاربر قدیمی
    const u = db.users[uid];
    if (name) u.name = name;
    
    // نرمالایز کردن
    u.level = u.level || 1;
    u.xp = u.xp || 0;
    u.gold = u.gold || 100;
    u.hp = u.hp ?? 100;
    u.maxHp = u.maxHp || 100;
    u.power = u.power || 5;
    u.homeLvl = u.homeLvl || 1;
    u.clinicLvl = u.clinicLvl || 1;
    u.weapon = u.weapon || 'none';
    u.armor = u.armor || 'none';
    u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0 };
    u.sp = u.sp || 0;
    u.res = u.res || { wood: 20, stone: 20, metal: 10, iron: 5, gold: 100 };
    u.items = u.items || { bandage: 1, bread: 2, water: 2 };
    u.wOwned = u.wOwned || { none: true };
    u.aOwned = u.aOwned || { none: true };
    u.cooldowns = u.cooldowns || {};
    u.daily = u.daily || {};
    u.stats = u.stats || { fw: 0, dw: 0, bw: 0, gath: 0 };
    u.pvpWins = u.pvpWins || 0;
    u.pvpLosses = u.pvpLosses || 0;
    u.pvpRating = u.pvpRating || 0;
    u.pvpLeague = u.pvpLeague || 'bronze';
    u.pvpStreak = u.pvpStreak || 0;
    u.pvpHistory = u.pvpHistory || [];
    u.honorPoints = u.honorPoints || 0;
    u.loyalty = u.loyalty || 0;
    u.shahnamehCount = u.shahnamehCount || 0;
    u.prayCount = u.prayCount || 0;
    u.pet = u.pet || null;
    u.bankGold = u.bankGold || 0;
    u.bankInterest = u.bankInterest || 0;
    u.weaponEnchant = u.weaponEnchant || null;
    u.achievements = u.achievements || [];
    u.quests = u.quests || [];
    u.questProgress = u.questProgress || {};
    u.clan = u.clan || null;
    u.logins = (u.logins || 0) + 1;
    u.gatherCount = u.gatherCount || 0;
    u.lastBox = u.lastBox || 0;
    u.lastPray = u.lastPray || 0;
    u.lastDaily = u.lastDaily || 0;
    u.pendingFight = u.pendingFight || null;
    u.pendingPvP = u.pendingPvP || null;
    
    u.wOwned.none = true;
    u.aOwned.none = true;
    
    // به‌روزرسانی روزانه
    const today = new Date().toDateString();
    if (u.lastLoginDate !== today) {
        u.loyalty = (u.loyalty || 0) + 5;
        u.lastLoginDate = today;
    }
    if (u.lastQuestDate !== today) {
        rollQuests(u);
        u.lastQuestDate = today;
    }
    // سود بانک
    if (u.lastBankDate !== today && u.bankGold > 0) {
        const interest = Math.floor(u.bankGold * 0.02);
        u.bankGold += interest;
        u.bankInterest = (u.bankInterest || 0) + interest;
        u.lastBankDate = today;
    }
    
    saveDB();
    return u;
}

// ==================== ⭐ توابع بازی ====================
function addXP(u, amt) {
    u.xp = (u.xp || 0) + amt;
    let ups = 0;
    while (u.xp >= 30) {
        u.xp -= 30;
        u.level++;
        u.maxHp += 10;
        u.hp = u.maxHp;
        u.power += 2;
        u.sp = (u.sp || 0) + 1;
        ups++;
    }
    return ups;
}

function addRes(u, k, v) {
    if (!u.res) u.res = {};
    if (!u.res[k]) u.res[k] = 0;
    u.res[k] += v;
    if (u.res[k] < 0) u.res[k] = 0;
}

function addItem(u, k, v) {
    if (!u.items) u.items = {};
    if (!u.items[k]) u.items[k] = 0;
    u.items[k] += v;
    if (u.items[k] < 0) u.items[k] = 0;
}

function hasRes(u, cost) {
    if (!u.res) return false;
    for (const [k, v] of Object.entries(cost)) {
        if (k === 'nl') continue;
        if ((u.res[k] || 0) < v) return false;
    }
    return true;
}

function takeRes(u, cost) {
    for (const [k, v] of Object.entries(cost)) {
        if (k === 'nl') continue;
        addRes(u, k, -v);
    }
}

function giveReward(u, rew) {
    if (!rew) return;
    for (const [k, v] of Object.entries(rew)) {
        if (RES[k]) addRes(u, k, v);
        else addItem(u, k, v);
    }
}

function rwText(rew) {
    if (!rew) return 'ندارد';
    return Object.entries(rew).map(([k, v]) => {
        if (RES[k]) return `${RES[k]} ${v}`;
        if (FOODS[k]) return `${v}x ${FOODS[k].n}`;
        if (k === 'dragon_scale') return `🐉 ${v} فلس`;
        if (k === 'phoenix_feather') return `🦅 ${v} پر`;
        return `${v}x ${k}`;
    }).join(' | ') || 'ندارد';
}

function updateLeague(u) {
    const rating = u.pvpRating || 0;
    const leagues = Object.entries(PVP_LEAGUES).reverse();
    for (const [key, league] of leagues) {
        if (rating >= league.min) { u.pvpLeague = key; break; }
    }
}

function progressQuest(u, target) {
    if (!u.questProgress) u.questProgress = {};
    u.questProgress[target] = (u.questProgress[target] || 0) + 1;
}

function rollQuests(u) {
    u.quests = [...QUESTS].sort(() => Math.random() - 0.5).slice(0, 3);
    u.questProgress = {};
    u.quests.forEach(q => { u.questProgress[q.target] = 0; });
}

function checkAchievements(u) {
    const newAch = [];
    for (const ach of ACHIEVEMENTS) {
        if (!u.achievements.includes(ach.id) && ach.check(u)) {
            u.achievements.push(ach.id);
            newAch.push(ach);
        }
    }
    return newAch;
}

// ==================== 📊 منوها ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 دیوان آمار', 'm_status')],
        [Markup.button.callback('🌲 بیشه نارون', 'm_gather')],
        [Markup.button.callback('⚔️ میدان رزم', 'm_fight_menu')],
        [Markup.button.callback('🏟️ میدان پهلوانی', 'm_pvp')],
        [Markup.button.callback('🏠 کاشانه', 'm_home')],
        [Markup.button.callback('🏥 دارالشفا', 'm_heal')],
        [Markup.button.callback('🛒 بازار بزرگ', 'm_shop')],
        [Markup.button.callback('🛠️ آهنگری', 'm_armory')],
        [Markup.button.callback('🛡️ زرادخانه', 'm_armor_shop')],
        [Markup.button.callback('🕯️ آتشکده آذر', 'm_pray')],
        [Markup.button.callback('🍽️ سفره', 'm_eat')],
        [Markup.button.callback('👤 بزرگان', 'm_npc')],
        [Markup.button.callback('📋 مأموریت‌ها', 'm_quest')],
        [Markup.button.callback('🐎 حیوانات', 'm_pet')],
        [Markup.button.callback('🏦 خزانه', 'm_bank')],
        [Markup.button.callback('🏆 دستاوردها', 'm_achieve')],
        [Markup.button.callback('🏰 قبیله', 'm_clan')],
        [Markup.button.callback('🎁 صندوقچه راز', 'm_box')],
        [Markup.button.callback('📖 اوستا', 'm_guide')],
        [Markup.button.callback('⭐ هنرستان', 'm_skills')],
        [Markup.button.callback('⏱️ چرخ زمان', 'm_cd')],
    ]);
}

function backBtn() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🔙 بازگشت به بارگاه', 'm_main')]
    ]);
}

// ==================== ⚡ استارت ====================
bot.start(async (ctx) => {
    try {
        const u = getUser(ctx.from.id, ctx.from.first_name);
        const isNew = u.logins === 1;
        
        // رویداد تصادفی
        let eventText = '';
        if (!u.daily.eventTriggered && Math.random() < 0.15) {
            u.daily.eventTriggered = true;
            const event = EVENTS[rand(0, EVENTS.length - 1)];
            const result = event.effect(u);
            eventText = `\n\n🌍 «${event.n}»\n${event.desc}\n${result}`;
        }
        
        saveDB();
        
        const text = isNew
            ? `🏛️ «به نام خداوند جان و خرد»\n━━━━━━━━━━━━━━━━\nدرود بر تو ای پهلوان ${u.name}!\nبه سرزمین پارس خوش آمدی.\n\n🎁 هدیه شاهنشاه:\n🪵 ۲۰ چوب | 🪨 ۲۰ سنگ\n🥇 ۱۰۰ زر | 🩹 ۱ باند\n🍞 ۲ نان | 💧 ۲ آب\n\n⚔️ سرنوشتت را خود رقم بزن!${eventText}`
            : `🏛️ «در بارگاه جمشید باز شد»\n━━━━━━━━━━━━━━━━\nدرود بر تو ای پهلوان ${u.name}!\nبه کاشانه بازگشتی.\n\n🎚️ پایه: ${u.level}\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n🥇 زر: ${u.gold}\n⭐ وفاداری: ${u.loyalty || 0}${eventText}\n\n🔥 «هنوز آتش کینه در سینه‌هاست»`;
        
        await ctx.reply(text, mainMenu());
    } catch (e) {
        await ctx.reply('❌ خطایی رخ داد. /start را دوباره بزن');
    }
});

// ==================== 🏛️ منوی اصلی ====================
bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    try {
        const u = getUser(ctx.from.id);
        await ctx.reply(
            `🏛️ بارگاه جمشید\n━━━━━━━━━━━━━━━━\nفرمان چیست ای پهلوان؟\n\n🎚️ پایه: ${u.level}\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n🥇 زر: ${u.gold}`,
            mainMenu()
        );
    } catch (e) {
        await ctx.reply('🏛️ بارگاه جمشید', mainMenu());
    }
});

// ==================== 📊 وضعیت ====================
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    const pet = u.pet ? PETS[u.pet]?.n : 'ندارد';
    
    // چک دستاوردها
    const newAch = checkAchievements(u);
    let achText = '';
    if (newAch.length > 0) {
        achText = '\n\n🏆 دستاورد نو:\n' + newAch.map(a => `${a.n} - ${a.desc}`).join('\n');
    }
    
    saveDB();
    
    const text = [
        `📊 «دیوان آمار پهلوان»`,
        `━━━━━━━━━━━━━━━━`,
        `👤 نام: ${u.name}`,
        `🎚️ پایه: ${u.level} | ✨ نام‌آوری: ${u.xp || 0}/30`,
        `❤️ تندرستی: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}`,
        `⚡ زور بازو: ${u.power}`,
        `🗡️ سلاح: ${w.n}${u.weaponEnchant ? ' ' + u.weaponEnchant : ''}`,
        `🛡️ زره: ${a.n}`,
        `🐎 حیوان: ${pet}`,
        `🏠 کاشانه: ${u.homeLvl} | 🏥 دارالشفا: ${u.clinicLvl}`,
        `⭐ گوهر هنر: ${u.sp || 0}`,
        `🏆 لیگ: ${league.n} | ⭐ ${u.pvpRating || 0}`,
        `⚔️ پیروزی: ${u.pvpWins || 0} | 💀 شکست: ${u.pvpLosses || 0}`,
        `🎖️ وفاداری: ${u.loyalty || 0}`,
        `📚 شعر: ${u.shahnamehCount || 0}`,
        `🏦 خزانه: ${u.bankGold || 0} زر`,
        `🥇 زر همراه: ${u.gold}`,
        achText,
    ].filter(l => l).join('\n');
    
    await ctx.reply(text, backBtn());
});

// ==================== 🌲 جستجو ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const cd = checkCD(u, 'gather', CD.gather);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'gather');
    
    // تأثیر حیوان
    const hasHorse = u.pet === 'horse';
    const hasCat = u.pet === 'cat';
    
    const table = [
        { wood: 3, stone: 1 },
        { wood: 2, gold: 5 },
        { metal: 1, stone: 2 },
        { wood: 4 },
        { gold: 10, metal: 1, stone: 1 },
    ];
    
    const roll = table[rand(0, table.length - 1)];
    giveReward(u, roll);
    
    let extra = '';
    const itemChance = hasCat ? 0.45 : 0.3;
    if (Math.random() < itemChance) {
        const f = ['bread', 'fish', 'water', 'meat'][rand(0, 3)];
        addItem(u, f, 1);
        extra = `\n🍽️ ${FOODS[f]?.n || f} نیز یافت شد!`;
    }
    
    u.loyalty = (u.loyalty || 0) + 1;
    u.gatherCount = (u.gatherCount || 0) + 1;
    progressQuest(u, 'gather');
    saveDB();
    
    const text = [
        `🌲 «به بیشه نارون زدن رستم شیردل»`,
        `━━━━━━━━━━━━━━━━`,
        `به جستجو پرداختی...`,
        ``,
        `🎁 ره‌آورد: ${rwText(roll)}${extra}`,
        hasHorse ? `\n🐎 رخش سرعت بخشید!` : '',
        ``,
        `⏳ ${formatTime(CD.gather)} دیگر`,
    ].filter(l => l).join('\n');
    
    await ctx.reply(text, backBtn());
});

console.log('✅ بخش دوم - مدیریت کاربر و منوها بارگذاری شد');

// ==================== ⚔️ مبارزه با موجودات ====================

// منوی انتخاب نوع حریف
bot.action('m_fight_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const cd = checkCD(u, 'fight', CD.fight);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    await ctx.reply(
        `⚔️ «میدان رزم - آوردگاه پهلوانان»\n━━━━━━━━━━━━━━━━\nحریف خود را برگزین:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🐺 ددان (حیوانات)', 'f_animals')],
            [Markup.button.callback('👹 دیوان', 'f_demons')],
            [Markup.button.callback('👿 موجودات پلید', 'f_bosses')],
            [Markup.button.callback('🎲 رندوم', 'f_random')],
            [Markup.button.callback('🔙 بازگشت', 'm_main')],
        ])
    );
});

// فیلتر موجودات بر اساس نوع
function getEnemiesByType(type) {
    if (type === 'animals') return ALL_ENEMIES.filter(e => e.type === 'animal');
    if (type === 'demons') return ALL_ENEMIES.filter(e => e.type === 'demon');
    if (type === 'bosses') return ALL_ENEMIES.filter(e => e.type === 'boss');
    return ALL_ENEMIES;
}

// دکمه‌های انتخاب نوع
bot.action('f_animals', async (ctx) => startFight(ctx, 'animals'));
bot.action('f_demons', async (ctx) => startFight(ctx, 'demons'));
bot.action('f_bosses', async (ctx) => startFight(ctx, 'bosses'));
bot.action('f_random', async (ctx) => startFight(ctx, 'random'));

// شروع مبارزه
async function startFight(ctx, type) {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) {
        return ctx.reply('❌ تندرستی تو صفر است! به دارالشفا برو.', backBtn());
    }
    
    const pool = getEnemiesByType(type);
    const enemy = pool[rand(0, pool.length - 1)];
    
    // بررسی لول برای موجودات پلید
    if (enemy.ml && u.level < enemy.ml) {
        return ctx.answerCbQuery(`❌ پایه ${enemy.ml} لازم است!`);
    }
    
    // ذخیره حریف
    u.pendingFight = { enemy, type };
    setCD(u, 'fight');
    saveDB();
    
    const weapon = WEAPONS[u.weapon] || WEAPONS.none;
    const playerPower = u.power + weapon.p;
    const winChance = clamp(50 + (playerPower - enemy.p) * 5, 5, 95);
    
    const text = [
        `⚔️ ${enemy.n} پدیدار شد!`,
        `━━━━━━━━━━━━━━━━`,
        `💪 زور دشمن: ${enemy.p}`,
        `❤️ آسیب: ${enemy.loss[0]}-${enemy.loss[1]}`,
        `🎁 تاراج: ${rwText(enemy.rew)}`,
        `✨ نام‌آوری: ${enemy.xp}`,
        `🛡️ شانس پیروزی: ${winChance}%`,
        ``,
        `آماده‌ای تاختن؟`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', `fight_go_${ALL_ENEMIES.indexOf(enemy)}`)],
        [Markup.button.callback('🏃 گریختن', 'm_fight_menu')],
    ]));
}

// انجام نبرد
bot.action(/fight_go_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const idx = parseInt(ctx.match[1]);
    const enemy = ALL_ENEMIES[idx];
    
    if (!enemy) return ctx.reply('❌ حریف یافت نشد', backBtn());
    if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر!', backBtn());
    
    const weapon = WEAPONS[u.weapon] || WEAPONS.none;
    const armor = ARMORS[u.armor] || ARMORS.none;
    const dogBonus = u.pet === 'dog' ? 5 : 0;
    const enchantBonus = u.weaponEnchant === '🔥 آتشین' ? 5 : 0;
    
    const playerPower = u.power + weapon.p + rand(0, 8) + enchantBonus;
    const enemyPower = enemy.p + rand(0, 10);
    const winChance = clamp(50 + (playerPower - enemyPower) * 5, 5, 95);
    const win = Math.random() * 100 < winChance;
    
    const rawDmg = rand(enemy.loss[0], enemy.loss[1]);
    const dmg = Math.max(1, rawDmg - armor.d - dogBonus);
    u.hp = clamp(u.hp - dmg, 0, u.maxHp);
    
    let text;
    
    if (win) {
        // پاداش
        const goldEarned = enemy.rew.gold || rand(10, 30);
        u.gold += goldEarned;
        u.xp = (u.xp || 0) + enemy.xp;
        
        // لول آپ
        const ups = addXP(u, 0); // فقط xp رو اضافه کردیم
        while (u.xp >= 30) {
            u.xp -= 30;
            u.level++;
            u.maxHp += 10;
            u.hp = u.maxHp;
            u.power += 2;
            u.sp = (u.sp || 0) + 1;
        }
        
        // غنایم
        if (enemy.rew.meat) { u.items = u.items || {}; u.items.meat = (u.items.meat || 0) + enemy.rew.meat; }
        if (enemy.rew.iron) { u.res = u.res || {}; u.res.iron = (u.res.iron || 0) + enemy.rew.iron; }
        if (enemy.rew.gem) { u.items = u.items || {}; u.items.gem = (u.items.gem || 0) + enemy.rew.gem; }
        if (enemy.rew.dragon_scale) { u.items = u.items || {}; u.items.dragon_scale = (u.items.dragon_scale || 0) + enemy.rew.dragon_scale; }
        if (enemy.rew.phoenix_feather) { u.items = u.items || {}; u.items.phoenix_feather = (u.items.phoenix_feather || 0) + enemy.rew.phoenix_feather; }
        
        // آمار
        if (enemy.type === 'animal') u.stats.fw = (u.stats.fw || 0) + 1;
        else if (enemy.type === 'demon') u.stats.dw = (u.stats.dw || 0) + 1;
        else u.stats.bw = (u.stats.bw || 0) + 1;
        
        u.loyalty = (u.loyalty || 0) + 2;
        progressQuest(u, 'fight');
        
        text = [
            `⚔️ «پیروزی از آن دلیران بود»`,
            `━━━━━━━━━━━━━━━━`,
            `بر ${enemy.n} چیره شدی!`,
            ``,
            `✨ +${enemy.xp} نام‌آوری`,
            `🥇 +${goldEarned} زر`,
            `❤️ زخم: -${dmg}`,
            `🎁 تاراج: ${rwText(enemy.rew)}`,
            ``,
            `❤️ تندرستی: ${u.hp}/${u.maxHp}`,
            `━◦○◦━◦○◦━◦○◦━◦○◦━`,
            `🏆 «نامت جاودان باد ای پهلوان!»`,
        ].join('\n');
    } else {
        text = [
            `💀 «ز نیرو بود مرد را راستی»`,
            `━━━━━━━━━━━━━━━━`,
            `از ${enemy.n} شکست خوردی...`,
            ``,
            `❤️ زخم: -${dmg}`,
            `❤️ تندرستی: ${u.hp}/${u.maxHp}`,
            ``,
            `━◦○◦━◦○◦━◦○◦━◦○◦━`,
            `💊 «رهسپار دارالشفا شو!»`,
        ].join('\n');
    }
    
    u.pendingFight = null;
    saveDB();
    
    await ctx.reply(text, backBtn());
});

// ==================== 🏟️ PvP پیشرفته ====================

// منوی PvP
bot.action('m_pvp', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) return ctx.reply('❌ تندرستی تو صفر است! به دارالشفا برو.', backBtn());
    
    const cd = checkCD(u, 'pvp', CD.pvp);
    const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    
    const text = [
        `🏟️ «میدان پهلوانی - گود زورخانه»`,
        `━━━━━━━━━━━━━━━━`,
        `🏆 لیگ: ${league.n}`,
        `⭐ امتیاز: ${u.pvpRating || 0}`,
        `🏅 افتخار: ${u.honorPoints || 0}`,
        `✅ پیروزی: ${u.pvpWins || 0} | 💀 شکست: ${u.pvpLosses || 0}`,
        `🔥 پیاپی: ${u.pvpStreak || 0}`,
        ``,
        `⏱️ ${cd.can ? '✅ آماده نبرد' : '⏳ ' + formatTime(cd.rem)}`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `⚔️ «حریف می‌طلبی؟ پا پیش نِه!»`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ نبرد سریع', 'pvp_quick')],
        [Markup.button.callback('🎯 شرط‌بندی', 'pvp_bet_menu')],
        [Markup.button.callback('🏆 لیگ‌ها', 'pvp_league')],
        [Markup.button.callback('📜 تاریخچه', 'pvp_history')],
        [Markup.button.callback('🏅 برترین‌ها', 'pvp_leaderboard')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

// نبرد سریع PvP
bot.action('pvp_quick', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر!', backBtn());
    
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    // پیدا کردن حریف تصادفی از همه کاربران (حتی نابرابر)
    const allUsers = Object.values(db.users).filter(e => e.id !== u.id && (e.hp || 100) > 0);
    if (allUsers.length === 0) return ctx.reply('❌ هیچ پهلوانی در میدان نیست!', backBtn());
    
    const enemy = allUsers[rand(0, allUsers.length - 1)];
    
    // انتخاب قوی‌ترین سلاح
    const myWeapons = Object.entries(u.wOwned || {})
        .filter(([k, v]) => v && k !== 'none')
        .map(([k]) => WEAPONS[k])
        .filter(w => w)
        .sort((a, b) => b.p - a.p);
    
    const bestWeapon = myWeapons.length > 0 ? myWeapons[0] : WEAPONS.none;
    
    u.pendingPvP = {
        eid: enemy.id,
        ename: enemy.name || 'ناشناس',
        sw: Object.keys(WEAPONS).find(k => WEAPONS[k] === bestWeapon) || 'none',
        betAmount: 0,
        isQuick: true,
    };
    setCD(u, 'pvp');
    saveDB();
    
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const myPower = u.power + bestWeapon.p;
    const enemyPower = (enemy.power || 5) + ew.p;
    const winChance = clamp(50 + (myPower - enemyPower) * 3, 10, 90);
    
    const text = [
        `⚔️ نبرد با ${enemy.name || 'ناشناس'}!`,
        `━━━━━━━━━━━━━━━━`,
        `👤 حریف: پایه ${enemy.level || 1}`,
        `🗡️ سلاح حریف: ${ew.n}`,
        `⚡ قدرت حریف: ${enemyPower}`,
        ``,
        `🗡️ سلاح تو: ${bestWeapon.n} (⚡${bestWeapon.p})`,
        `⚡ قدرت تو: ${myPower}`,
        `🎲 شانس پیروزی: ${winChance}%`,
        ``,
        `آماده‌ای تاختن؟`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', 'pvp_go')],
        [Markup.button.callback('🏃 گریختن', 'm_pvp')],
    ]));
});

// شرط‌بندی
bot.action('pvp_bet_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر!', backBtn());
    
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    await ctx.reply(
        `🎯 شرط‌بندی در میدان\n━━━━━━━━━━━━━━━━\n💰 زر موجود: ${u.gold}\n\n📝 دستور:\n/pvp_bet [آیدی] [مبلغ]\n\n📌 مثال:\n/pvp_bet 123456789 500\n\n💰 حداقل شرط: ۵۰ زر`,
        backBtn()
    );
});

bot.command('pvp_bet', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const tid = args[1];
    const betAmount = Number(args[2] || 0);
    
    if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر!');
    if (!tid || !betAmount) return ctx.reply('❌ /pvp_bet [آیدی] [مبلغ]');
    if (betAmount < 50) return ctx.reply('❌ کمینه شرط: ۵۰ زر');
    if (betAmount > u.gold) return ctx.reply('❌ زر کافی نداری');
    if (tid === u.id) return ctx.reply('❌ با خودت نمی‌توانی!');
    
    const enemy = db.users[tid];
    if (!enemy) return ctx.reply('❌ حریف یافت نشد');
    if ((enemy.hp || 100) <= 0) return ctx.reply('❌ حریف تندرستی ندارد');
    
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    // انتخاب دو سلاح برتر
    const myW = Object.entries(u.wOwned || {})
        .filter(([k, v]) => v && k !== 'none')
        .map(([k]) => WEAPONS[k])
        .filter(w => w)
        .sort((a, b) => b.p - a.p)
        .slice(0, 2);
    
    if (!myW.length) return ctx.reply('❌ سلاح نداری!');
    
    u.pendingPvP = {
        eid: tid,
        ename: enemy.name || 'ناشناس',
        myW,
        betAmount,
        isBet: true,
    };
    setCD(u, 'pvp');
    saveDB();
    
    const wbtns = myW.map(w => [
        Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sw_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)
    ]);
    
    await ctx.reply(
        `🎯 شرط: ${betAmount} زر\n👤 حریف: ${enemy.name}\n\n🗡️ سلاح برگزین:`,
        Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'm_pvp')]])
    );
});

// انتخاب سلاح برای PvP
bot.action(/pvp_sw_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const wk = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    if (!u.pendingPvP) return ctx.answerCbQuery('❌ درخواست منقضی شده');
    
    u.pendingPvP.sw = wk;
    saveDB();
    
    const w = WEAPONS[wk];
    const enemy = db.users[u.pendingPvP.eid];
    if (!enemy) return ctx.reply('❌ حریف نیست', backBtn());
    
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const ea = ARMORS[enemy.armor] || ARMORS.none;
    
    const myPower = u.power + w.p;
    const enemyPower = (enemy.power || 5) + ew.p;
    const winChance = clamp(50 + (myPower - enemyPower) * 3, 10, 90);
    
    await ctx.answerCbQuery(`${w.n} برگزیده شد`);
    
    const text = [
        `⚔️ تاختن به ${enemy.name}`,
        `━━━━━━━━━━━━━━━━`,
        `🗡️ سلاح: ${w.n} (⚡${w.p})`,
        `🛡️ زره: ${a.n} (دفاع ${a.d})`,
        `⚡ قدرت: ${myPower}`,
        ``,
        `👤 حریف: ${enemy.name}`,
        `🗡️ سلاح: ${ew.n}`,
        `🛡️ زره: ${ea.n}`,
        `⚡ قدرت: ${enemyPower}`,
        ``,
        `🎲 شانس: ${winChance}%`,
        `🏠 تخریب: ${Math.floor(winChance * 0.3)}%`,
        `📦 تاراج: ${Math.floor(winChance * 0.4)}%`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', 'pvp_go')],
        [Markup.button.callback('🏃 گریختن', 'm_pvp')],
    ]));
});

// اجرای نبرد PvP
bot.action('pvp_go', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (!u.pendingPvP || !u.pendingPvP.sw) return ctx.reply('❌ درخواست منقضی شده', backBtn());
    
    const { eid, sw, betAmount, ename } = u.pendingPvP;
    u.pendingPvP = null;
    
    const enemy = db.users[eid];
    if (!enemy) return ctx.reply('❌ حریف نیست', backBtn());
    
    const w = WEAPONS[sw] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const ea = ARMORS[enemy.armor] || ARMORS.none;
    
    const dogBonus = u.pet === 'dog' ? 5 : 0;
    const enchantBonus = u.weaponEnchant === '🔥 آتشین' ? 5 : 0;
    
    const myPower = u.power + w.p + rand(0, 10) + enchantBonus;
    const enemyPower = (enemy.power || 5) + ew.p + rand(0, 10);
    const winChance = clamp(50 + (myPower - enemyPower) * 3, 10, 90);
    const win = Math.random() * 100 < winChance;
    
    const rawDmg = rand(15, 40);
    const myDmg = Math.max(5, rawDmg - a.d - dogBonus);
    const enemyDmg = Math.max(5, rawDmg - ea.d);
    
    let attackerText, defenderText;
    let ratingChange = 0, goldReward = 0;
    const streakBonus = (u.pvpStreak || 0) >= 3 ? 1.5 : 1;
    
    if (win) {
        // مهاجم برنده
        u.hp = Math.max(0, u.hp - Math.floor(enemyDmg * 0.3));
        enemy.hp = Math.max(0, (enemy.hp || 100) - enemyDmg);
        
        goldReward = rand(30, 80) + betAmount;
        ratingChange = Math.floor(rand(20, 30) * streakBonus);
        
        u.gold += goldReward;
        u.pvpRating = (u.pvpRating || 0) + ratingChange;
        u.pvpWins = (u.pvpWins || 0) + 1;
        u.pvpStreak = (u.pvpStreak || 0) + 1;
        u.honorPoints = (u.honorPoints || 0) + rand(5, 15);
        u.xp = (u.xp || 0) + rand(15, 35);
        
        enemy.pvpLosses = (enemy.pvpLosses || 0) + 1;
        enemy.pvpRating = Math.max(0, (enemy.pvpRating || 0) - rand(10, 20));
        enemy.pvpStreak = 0;
        
        updateLeague(u);
        updateLeague(enemy);
        
        // تاریخچه
        if (!u.pvpHistory) u.pvpHistory = [];
        u.pvpHistory.push({ enemy: enemy.name, win: true, time: Date.now() });
        if (!enemy.pvpHistory) enemy.pvpHistory = [];
        enemy.pvpHistory.push({ enemy: u.name, win: false, time: Date.now() });
        
        progressQuest(u, 'pvp_win');
        
        // توهین سلطنتی
        const taunt = TAUNTS[rand(0, TAUNTS.length - 1)];
        
        attackerText = [
            `👑 «شاهنشاه فرمودند...»`,
            `━━━━━━━━━━━━━━━━`,
            `بر ${enemy.name} چیره شدی!`,
            ``,
            `${taunt}`,
            ``,
            `❤️ زخم: -${Math.floor(enemyDmg * 0.3)}`,
            `🥇 زر: +${goldReward}${betAmount > 0 ? ` (شرط: ${betAmount})` : ''}`,
            `⭐ امتیاز: +${ratingChange}`,
            `🔥 پیاپی: ${u.pvpStreak}`,
            ``,
            `❤️ تندرستی: ${u.hp}/${u.maxHp}`,
            `🏆 لیگ: ${PVP_LEAGUES[u.pvpLeague || 'bronze'].n}`,
        ].join('\n');
        
        defenderText = [
            `⚔️ ${u.name} به تو تاخت!`,
            `━━━━━━━━━━━━━━━━`,
            `❌ شکست خوردی!`,
            ``,
            `❤️ زخم: -${enemyDmg}`,
            betAmount > 0 ? `💸 ${betAmount} زر باختی!` : '',
            ``,
            `❤️ تندرستی: ${enemy.hp}/${enemy.maxHp || 100}`,
        ].filter(l => l).join('\n');
    } else {
        // مهاجم بازنده
        u.hp = Math.max(0, u.hp - myDmg);
        enemy.hp = Math.max(0, (enemy.hp || 100) - Math.floor(enemyDmg * 0.3));
        
        ratingChange = rand(10, 20);
        
        u.pvpRating = Math.max(0, (u.pvpRating || 0) - ratingChange);
        u.pvpLosses = (u.pvpLosses || 0) + 1;
        u.pvpStreak = Math.min(0, (u.pvpStreak || 0) - 1);
        
        enemy.pvpWins = (enemy.pvpWins || 0) + 1;
        enemy.pvpRating = (enemy.pvpRating || 0) + Math.floor(ratingChange * 0.7);
        enemy.pvpStreak = (enemy.pvpStreak || 0) + 1;
        
        if (betAmount > 0) {
            u.gold -= betAmount;
            enemy.gold = (enemy.gold || 0) + betAmount;
        }
        
        updateLeague(u);
        updateLeague(enemy);
        
        if (!u.pvpHistory) u.pvpHistory = [];
        u.pvpHistory.push({ enemy: enemy.name, win: false, time: Date.now() });
        if (!enemy.pvpHistory) enemy.pvpHistory = [];
        enemy.pvpHistory.push({ enemy: u.name, win: true, time: Date.now() });
        
        attackerText = [
            `💀 «چرخ گردون نخواهد که بمانی»`,
            `━━━━━━━━━━━━━━━━`,
            `از ${enemy.name} شکست خوردی...`,
            ``,
            `❤️ زخم: -${myDmg}`,
            betAmount > 0 ? `💸 ${betAmount} زر باختی!` : '',
            `⭐ امتیاز: -${ratingChange}`,
            ``,
            `❤️ تندرستی: ${u.hp}/${u.maxHp}`,
        ].filter(l => l).join('\n');
        
        defenderText = [
            `⚔️ ${u.name} به تو تاخت!`,
            `━━━━━━━━━━━━━━━━`,
            `✅ دفاع کردی!`,
            ``,
            `❤️ زخم: -${Math.floor(enemyDmg * 0.3)}`,
            betAmount > 0 ? `💰 ${betAmount} زر بردی!` : '',
            ``,
            `❤️ تندرستی: ${enemy.hp}/${enemy.maxHp || 100}`,
        ].filter(l => l).join('\n');
    }
    
    u.loyalty = (u.loyalty || 0) + 1;
    saveDB();
    
    // ارسال پیام به مدافع
    try {
        await bot.telegram.sendMessage(eid, defenderText,
            Markup.inlineKeyboard([
                [Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)],
                [Markup.button.callback('🔙 بستن', 'm_main')],
            ])
        );
    } catch (e) {}
    
    await ctx.reply(attackerText, backBtn());
});

// انتقام
bot.action(/pvp_rev_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const tid = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) return ctx.answerCbQuery('❌ تندرستی صفر!');
    
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    const enemy = db.users[tid];
    if (!enemy) return ctx.answerCbQuery('❌ حریف نیست');
    
    const myW = Object.entries(u.wOwned || {})
        .filter(([k, v]) => v && k !== 'none')
        .map(([k]) => WEAPONS[k])
        .filter(w => w)
        .sort((a, b) => b.p - a.p)
        .slice(0, 2);
    
    if (!myW.length) return ctx.answerCbQuery('❌ سلاح نداری');
    
    u.pendingPvP = { eid: tid, ename: enemy.name, myW };
    setCD(u, 'pvp');
    saveDB();
    
    const wbtns = myW.map(w => [
        Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sw_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)
    ]);
    
    await ctx.reply(
        `⚔️ انتقام از ${enemy.name}!\n\n🗡️ سلاح برگزین:`,
        Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🔙 بی‌خیال', 'm_pvp')]])
    );
});

// نمایش لیگ‌ها
bot.action('pvp_league', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const current = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    
    const list = Object.entries(PVP_LEAGUES).map(([k, l]) =>
        `${l.n}${u.pvpLeague === k ? ' ✅' : ''}: ${l.min}+ امتیاز`
    ).join('\n');
    
    await ctx.reply(
        `🏆 لیگ‌های پهلوانی\n━━━━━━━━━━━━━━━━\n${list}\n\nلیگ تو: ${current.n}\n⭐ امتیاز: ${u.pvpRating || 0}`,
        backBtn()
    );
});

// تاریخچه PvP
bot.action('pvp_history', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const history = u.pvpHistory || [];
    
    if (!history.length) return ctx.answerCbQuery('📜 تاریخچه خالی است');
    
    const recent = history.slice(-10).reverse();
    const text = ['📜 تاریخچه ۱۰ نبرد آخر:\n'];
    recent.forEach((b, i) => {
        text.push(`${i + 1}. ${b.win ? '✅ پیروزی' : '❌ شکست'} در برابر ${b.enemy}`);
    });
    
    await ctx.reply(text.join('\n'), backBtn());
});

// برترین‌ها
bot.action('pvp_leaderboard', async (ctx) => {
    await ctx.answerCbQuery();
    
    const allUsers = Object.values(db.users)
        .filter(u => (u.pvpRating || 0) > 0)
        .sort((a, b) => (b.pvpRating || 0) - (a.pvpRating || 0))
        .slice(0, 10);
    
    if (!allUsers.length) return ctx.answerCbQuery('❌ هنوز کسی در میدان نیست');
    
    const text = ['🏅 برترین پهلوانان:\n'];
    allUsers.forEach((u, i) => {
        const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        text.push(`${medal} ${u.name || '?'} | ${league.n} | ⭐${u.pvpRating || 0} | 🏆${u.pvpWins || 0}W`);
    });
    
    await ctx.reply(text.join('\n'), backBtn());
});

// کامندهای PvP
bot.command('pvp', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (u.hp <= 0) return ctx.reply('❌ تندرستی صفر!');
    
    const args = ctx.message.text.trim().split(/\s+/);
    const tid = args[1];
    if (!tid) return ctx.reply('❌ /pvp [آیدی]\n📌 مثال: /pvp 123456789');
    if (tid === u.id) return ctx.reply('❌ با خودت نمی‌توانی!');
    
    const enemy = db.users[tid];
    if (!enemy) return ctx.reply('❌ حریف یافت نشد');
    
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    const myW = Object.entries(u.wOwned || {})
        .filter(([k, v]) => v && k !== 'none')
        .map(([k]) => WEAPONS[k])
        .filter(w => w)
        .sort((a, b) => b.p - a.p)
        .slice(0, 2);
    
    if (!myW.length) return ctx.reply('❌ سلاح نداری');
    
    u.pendingPvP = { eid: tid, ename: enemy.name, myW };
    setCD(u, 'pvp');
    saveDB();
    
    const wbtns = myW.map(w => [
        Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sw_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)
    ]);
    
    await ctx.reply(
        `⚔️ تاختن به ${enemy.name}\n\n🗡️ سلاح برگزین:`,
        Markup.inlineKeyboard([...wbtns, [Markup.button.callback('🏃 انصراف', 'm_pvp')]])
    );
});

bot.command('pvp_stats', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const league = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    const total = (u.pvpWins || 0) + (u.pvpLosses || 0);
    
    const text = [
        `📊 آمار پهلوانی ${u.name}`,
        `━━━━━━━━━━━━━━━━`,
        `🏆 لیگ: ${league.n}`,
        `⭐ امتیاز: ${u.pvpRating || 0}`,
        `🏅 افتخار: ${u.honorPoints || 0}`,
        `📊 کل نبردها: ${total}`,
        `✅ پیروزی: ${u.pvpWins || 0}`,
        `❌ شکست: ${u.pvpLosses || 0}`,
        `📈 برد٪: ${total > 0 ? Math.floor((u.pvpWins || 0) / total * 100) : 0}%`,
        `🔥 پیاپی: ${u.pvpStreak || 0}`,
    ].join('\n');
    
    await ctx.reply(text, backBtn());
});

bot.command('pvp_rating', async (ctx) => {
    const allUsers = Object.values(db.users)
        .filter(u => (u.pvpRating || 0) > 0)
        .sort((a, b) => (b.pvpRating || 0) - (a.pvpRating || 0))
        .slice(0, 20);
    
    if (!allUsers.length) return ctx.reply('❌ هنوز کسی در میدان نیست');
    
    const text = ['🏆 رتبه‌بندی:\n'];
    allUsers.forEach((u, i) => {
        text.push(`${i + 1}. ${u.name || '?'} | ${PVP_LEAGUES[u.pvpLeague || 'bronze'].n} | ⭐${u.pvpRating || 0}`);
    });
    
    await ctx.reply(text.join('\n'));
});

bot.command('pvp_top', async (ctx) => {
    const users = Object.values(db.users)
        .filter(u => (u.pvpWins || 0) > 0)
        .sort((a, b) => (b.pvpWins || 0) - (a.pvpWins || 0))
        .slice(0, 10);
    
    if (!users.length) return ctx.reply('❌ هنوز پهلوانی در میدان نیست');
    
    let txt = '🏆 برترین پهلوانان:\n\n';
    users.forEach((u, i) => {
        txt += `${i + 1}. ${u.name || '?'} | 🏆${u.pvpWins || 0} پیروزی | 💀${u.pvpLosses || 0} شکست | پایه ${u.level || 1}\n`;
    });
    
    await ctx.reply(txt, backBtn());
});

console.log('✅ بخش سوم - مبارزه و PvP بارگذاری شد');

// ==================== 🏠 کاشانه (خانه) ====================

bot.action('m_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const next = HOME_UP[u.homeLvl + 1];
    let upInfo = '🏆 به اوج رسیده';
    if (next) {
        upInfo = [
            `⬆️ ارتقا به پایه ${u.homeLvl + 1}`,
            `🪵 ${next.wood} | 🪨 ${next.stone} | 🔩 ${next.metal}`,
            `⛓️ ${next.iron} | 🥇 ${next.gold}`,
            `🎚️ پایه لازم: ${next.nl}`,
        ].join('\n');
    }
    
    const text = [
        `🏠 «کاشانه - آشیانه امن»`,
        `━━━━━━━━━━━━━━━━`,
        `پایه: ${u.homeLvl}`,
        ``,
        upInfo,
        ``,
        `📝 /upgrade_home برای ارتقا`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `🔨 «کاشانه‌ات را برفراز تا ایمن باشی!»`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('⬆️ برفراشتن', 'up_home')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('up_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    
    if (!next) return ctx.answerCbQuery('🏆 به اوج رسیده');
    if (u.level < next.nl) return ctx.answerCbQuery(`❌ پایه ${next.nl} لازم است`);
    if (!hasRes(u, next)) return ctx.answerCbQuery('❌ منابع کافی نیست');
    
    takeRes(u, next);
    u.homeLvl++;
    if (u.homeLvl >= 3) u.clinicLvl = 2;
    if (u.homeLvl >= 5) u.clinicLvl = 3;
    saveDB();
    
    await ctx.answerCbQuery(`✅ پایه ${u.homeLvl}!`);
    await ctx.reply(
        `🏠 «کاشانه برافراشته شد!»\n━━━━━━━━━━━━━━━━\nپایه نو: ${u.homeLvl}\n🏥 دارالشفا نیز پایه ${u.clinicLvl} شد.`,
        backBtn()
    );
});

bot.command('upgrade_home', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const next = HOME_UP[u.homeLvl + 1];
    
    if (!next) return ctx.reply('🏆 به اوج رسیده');
    if (u.level < next.nl) return ctx.reply(`❌ پایه ${next.nl} لازم است`);
    if (!hasRes(u, next)) return ctx.reply('❌ منابع کافی نیست');
    
    takeRes(u, next);
    u.homeLvl++;
    if (u.homeLvl >= 3) u.clinicLvl = 2;
    if (u.homeLvl >= 5) u.clinicLvl = 3;
    saveDB();
    
    await ctx.reply(`✅ کاشانه پایه ${u.homeLvl}!`, backBtn());
});

// ==================== 🏥 دارالشفا (درمانگاه) ====================

bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (!u.clinicLvl || u.clinicLvl < 1) u.clinicLvl = 1;
    const healAmt = 20 + u.clinicLvl * 10;
    const freeUsed = u.daily.freeHeal ? '❌ به کار رفته' : '✅ آماده';
    
    const text = [
        `🏥 «دارالشفای بوعلی - حکیم‌خانه»`,
        `━━━━━━━━━━━━━━━━`,
        `پایه: ${u.clinicLvl}`,
        `❤️ تندرستی: ${u.hp}/${u.maxHp} ${progressBar(u.hp, u.maxHp)}`,
        `💊 درمان ایزدی: ${freeUsed} (+${healAmt})`,
        `💰 درمان کامل: ۲۰ زر`,
        ``,
        `📝 /heal free | /heal gold`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('🆓 درمان ایزدی', 'hl_free'), Markup.button.callback('💰 درمان کامل', 'hl_gold')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('hl_free', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.daily.freeHeal) return ctx.answerCbQuery('❌ امروز به کار رفته');
    
    const amt = 20 + (u.clinicLvl || 1) * 10;
    u.daily.freeHeal = true;
    u.hp = Math.min(u.maxHp, u.hp + amt);
    saveDB();
    
    await ctx.answerCbQuery(`✅ +${amt} تندرستی`);
    await ctx.reply(
        `✅ ${amt} تندرستی بازیافتی\n❤️ تندرستی: ${u.hp}/${u.maxHp}`,
        backBtn()
    );
});

bot.action('hl_gold', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.gold < 20) return ctx.answerCbQuery('❌ ۲۰ زر نداری');
    
    u.gold -= 20;
    u.hp = u.maxHp;
    saveDB();
    
    await ctx.answerCbQuery('✅ درمان کامل');
    await ctx.reply(
        `✅ درمان کامل شدی!\n❤️ تندرستی: ${u.hp}/${u.maxHp}\n🥇 زر: ${u.gold}`,
        backBtn()
    );
});

bot.command('heal', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    
    if (args[1] === 'free') {
        if (u.daily.freeHeal) return ctx.reply('❌ امروز به کار رفته');
        const amt = 20 + (u.clinicLvl || 1) * 10;
        u.daily.freeHeal = true;
        u.hp = Math.min(u.maxHp, u.hp + amt);
        saveDB();
        return ctx.reply(`✅ +${amt} تندرستی\n❤️ ${u.hp}/${u.maxHp}`);
    }
    
    if (args[1] === 'gold') {
        if (u.gold < 20) return ctx.reply('❌ ۲۰ زر نداری');
        u.gold -= 20;
        u.hp = u.maxHp;
        saveDB();
        return ctx.reply(`✅ درمان کامل\n❤️ ${u.hp}/${u.maxHp}`);
    }
    
    await ctx.reply('📝 /heal free | /heal gold');
});

// ==================== 🛒 بازار بزرگ ====================

bot.action('m_shop', async (ctx) => {
    await ctx.answerCbQuery();
    
    const text = [
        `🛒 «بازار بزرگ ری - راسته زرگرها»`,
        `━━━━━━━━━━━━━━━━`,
        `چه می‌خواهی ای مسافر؟`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('📦 کالاها', 'sh_res'), Markup.button.callback('🍽️ خوراک', 'sh_food')],
        [Markup.button.callback('⚔️ جنگ‌افزار', 'sh_wep'), Markup.button.callback('🛡️ زره', 'sh_arm')],
        [Markup.button.callback('💰 فروختن', 'sh_sell')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('sh_res', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
        `📦 کالاها\n━━━━━━━━━━━━━━━━\n🪵 چوب: ۸ زر\n🪨 سنگ: ۱۰ زر\n🔩 فلز: ۱۸ زر\n⛓️ آهن: ۲۵ زر\n\n📝 /buy [کالا] [تعداد]\n📌 /buy wood 5`,
        backBtn()
    );
});

bot.action('sh_food', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
        `🍽️ خوراک\n━━━━━━━━━━━━━━━━\n🍞 نان: ۱۰ زر\n🍖 گوشت: ۲۵ زر\n💧 آب: ۸ زر\n\n📝 /buy [کالا] [تعداد]\n📌 /buy bread 3`,
        backBtn()
    );
});

bot.action('sh_wep', async (ctx) => {
    await ctx.answerCbQuery();
    const list = Object.entries(WEAPONS)
        .filter(([k]) => k !== 'none')
        .map(([k, w]) => `${w.n}: ${w.price} زر`)
        .join('\n');
    await ctx.reply(
        `⚔️ جنگ‌افزارها\n━━━━━━━━━━━━━━━━\n${list}\n\n📝 /craft [کلید]\n📌 /craft knife`,
        backBtn()
    );
});

bot.action('sh_arm', async (ctx) => {
    await ctx.answerCbQuery();
    const list = Object.entries(ARMORS)
        .filter(([k]) => k !== 'none')
        .map(([k, a]) => `${a.n}: ${a.price} زر`)
        .join('\n');
    await ctx.reply(
        `🛡️ زره‌ها\n━━━━━━━━━━━━━━━━\n${list}\n\n📝 /craft_armor [کلید]\n📌 /craft_armor leather`,
        backBtn()
    );
});

bot.action('sh_sell', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    let txt = '💰 فروختن\n━━━━━━━━━━━━━━━━\n';
    const prices = { wood: 4, stone: 5, metal: 9, iron: 12, bread: 5, meat: 12, water: 4 };
    
    for (const [k, v] of Object.entries(u.res || {})) {
        if (v > 0 && k !== 'gold' && k !== 'toman') {
            txt += `${RES[k] || k} ${k}: ${v} عدد (${prices[k] || 5} زر)\n`;
        }
    }
    for (const [k, v] of Object.entries(u.items || {})) {
        if (v > 0 && prices[k]) {
            txt += `${k}: ${v} عدد (${prices[k]} زر)\n`;
        }
    }
    txt += '\n📝 /sell [کالا] [تعداد]\n📌 /sell wood 5';
    await ctx.reply(txt, backBtn());
});

bot.command('buy', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const key = args[1];
    const amt = Number(args[2] || 1);
    
    const prices = { wood: 8, stone: 10, metal: 18, iron: 25, bread: 10, meat: 25, water: 8 };
    
    if (!prices[key]) return ctx.reply('❌ کالا نامعتبر');
    if (amt <= 0) return ctx.reply('❌ تعداد نامعتبر');
    
    const total = prices[key] * amt;
    if (u.gold < total) return ctx.reply(`❌ ${total} زر لازم داری`);
    
    u.gold -= total;
    if (['wood', 'stone', 'metal', 'iron'].includes(key)) {
        addRes(u, key, amt);
    } else {
        addItem(u, key, amt);
    }
    saveDB();
    
    await ctx.reply(`✅ ${amt} ${key} خریداری شد\n💰 زر: ${u.gold}`, backBtn());
});

bot.command('sell', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const key = args[1];
    const amt = Number(args[2] || 1);
    
    const prices = { wood: 4, stone: 5, metal: 9, iron: 12, bread: 5, meat: 12, water: 4 };
    
    if (!prices[key]) return ctx.reply('❌ کالا نامعتبر');
    if (amt <= 0) return ctx.reply('❌ تعداد نامعتبر');
    
    const inRes = u.res && u.res[key] ? u.res[key] : 0;
    const inItems = u.items && u.items[key] ? u.items[key] : 0;
    
    if (inRes < amt && inItems < amt) return ctx.reply('❌ به این مقدار نداری');
    
    if (inRes >= amt) {
        addRes(u, key, -amt);
    } else {
        addItem(u, key, -amt);
    }
    
    const earned = prices[key] * amt;
    u.gold += earned;
    saveDB();
    
    await ctx.reply(`✅ ${amt} ${key} فروخته شد\n💰 +${earned} زر | 🥇 ${u.gold}`, backBtn());
});

// ==================== 🛠️ آهنگری (اسلحه‌خانه) ====================

bot.action('m_armory', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(WEAPONS)
        .filter(([k]) => k !== 'none')
        .map(([k, w]) => [
            Markup.button.callback(
                `${u.wOwned && u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''}`,
                u.wOwned && u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`
            )
        ]);
    
    btns.push([Markup.button.callback('🔥 ارتقای سلاح', 'enchant_w')]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'm_main')]);
    
    const text = [
        `🛠️ «آهنگری کاوه - آتشگاه»`,
        `━━━━━━━━━━━━━━━━`,
        `🗡️ در دست: ${WEAPONS[u.weapon]?.n || 'نداری'}`,
        u.weaponEnchant ? `🔥 ارتقا: ${u.weaponEnchant}` : '',
    ].filter(l => l).join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard(btns));
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
    await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n} تجهیز شد`);
});

bot.action('enchant_w', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.weapon === 'none') return ctx.answerCbQuery('❌ سلاحی نداری');
    if (u.weaponEnchant) return ctx.answerCbQuery('❌ قبلاً ارتقا یافته');
    
    await ctx.reply(
        `🔥 ارتقای سلاح (۵۰۰ زر)\n━━━━━━━━━━━━━━━━\n🔥 آتشین: آسیب +۵\n❄️ یخی: کندی دشمن\n💀 زهرآگین: آسیب تدریجی\n\n📝 /enchant [fire|ice|poison]`,
        backBtn()
    );
});

bot.command('enchant', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const type = args[1];
    
    if (!['fire', 'ice', 'poison'].includes(type)) return ctx.reply('❌ fire, ice, poison');
    if (u.weapon === 'none') return ctx.reply('❌ سلاحی نداری');
    if (u.weaponEnchant) return ctx.reply('❌ قبلاً ارتقا یافته');
    if (u.gold < 500) return ctx.reply('❌ ۵۰۰ زر لازم داری');
    
    u.gold -= 500;
    const enchants = { fire: '🔥 آتشین', ice: '❄️ یخی', poison: '💀 زهرآگین' };
    u.weaponEnchant = enchants[type];
    saveDB();
    
    await ctx.reply(`✅ سلاح ${enchants[type]} شد!\n⚔️ ${WEAPONS[u.weapon]?.n} ${enchants[type]}`);
});

bot.command('craft', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const k = args[1];
    const w = WEAPONS[k];
    
    if (!w || k === 'none') return ctx.reply('❌ سلاح نامعتبر');
    if (u.level < w.lvl) return ctx.reply(`❌ پایه ${w.lvl} لازم است`);
    if (u.gold < w.price) return ctx.reply(`❌ ${w.price} زر لازم داری`);
    
    u.gold -= w.price;
    if (!u.wOwned) u.wOwned = { none: true };
    u.wOwned[k] = true;
    saveDB();
    
    await ctx.reply(`✅ ${w.n} ساخته شد!`, backBtn());
});

bot.command('equip', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const k = args[1];
    
    if (!u.wOwned || !u.wOwned[k]) return ctx.reply('❌ این سلاح را نداری');
    
    u.weapon = k;
    saveDB();
    await ctx.reply(`⚔️ ${WEAPONS[k].n} تجهیز شد`, backBtn());
});

// ==================== 🛡️ زرادخانه (زره‌خانه) ====================

bot.action('m_armor_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const btns = Object.entries(ARMORS)
        .filter(([k]) => k !== 'none')
        .map(([k, a]) => [
            Markup.button.callback(
                `${u.aOwned && u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''}`,
                u.aOwned && u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`
            )
        ]);
    
    btns.push([Markup.button.callback('🔙 بازگشت', 'm_main')]);
    
    const text = [
        `🛡️ «زرادخانه - گنجینه سپاه»`,
        `━━━━━━━━━━━━━━━━`,
        `🛡️ بر تن: ${ARMORS[u.armor]?.n || 'نداری'}`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard(btns));
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

bot.command('craft_armor', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const k = args[1];
    const a = ARMORS[k];
    
    if (!a || k === 'none') return ctx.reply('❌ زره نامعتبر');
    if (u.level < a.lvl) return ctx.reply(`❌ پایه ${a.lvl} لازم است`);
    if (u.gold < a.price) return ctx.reply(`❌ ${a.price} زر لازم داری`);
    
    u.gold -= a.price;
    if (!u.aOwned) u.aOwned = { none: true };
    u.aOwned[k] = true;
    saveDB();
    
    await ctx.reply(`✅ ${a.n} ساخته شد!`, backBtn());
});

console.log('✅ بخش چهارم - خانه، درمانگاه، بازار، اسلحه‌خانه، زره‌خانه بارگذاری شد');

// ==================== 🕯️ آتشکده آذر ====================

bot.action('m_pray', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const cd = checkCD(u, 'pray', CD.pray);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    const text = [
        `🕯️ «آتشکده آذر - نیایشگاه»`,
        `━━━━━━━━━━━━━━━━`,
        `🔥 «پرستیدن دادگر دین ماست`,
        `همین راه و رسم و آیین ماست»`,
        ``,
        `سه گونه نیایش:`,
        `🤲 دعا: نام‌آوری بیشتر`,
        `🧎 نماز: زر + نام‌آوری`,
        `📖 روضه: وفاداری + شعر`,
        ``,
        `⏱️ هر ۶ ساعت یکبار`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('🤲 دعا', 'pray_dua')],
        [Markup.button.callback('🧎 نماز', 'pray_namaz')],
        [Markup.button.callback('📖 روضه', 'pray_rozeh')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action(['pray_dua', 'pray_namaz', 'pray_rozeh'], async (ctx) => {
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
        u.xp = (u.xp || 0) + xpGain;
        while (u.xp >= 30) {
            u.xp -= 30;
            u.level++;
            u.maxHp += 10;
            u.hp = u.maxHp;
            u.power += 2;
            u.sp = (u.sp || 0) + 1;
        }
        reward = `✨ +${xpGain} نام‌آوری`;
    } else if (prayType === 'pray_namaz') {
        u.gold += 30;
        const xpGain = 20;
        u.xp = (u.xp || 0) + xpGain;
        while (u.xp >= 30) {
            u.xp -= 30;
            u.level++;
            u.maxHp += 10;
            u.hp = u.maxHp;
            u.power += 2;
            u.sp = (u.sp || 0) + 1;
        }
        reward = `🥇 +۳۰ زر | ✨ +${xpGain} نام‌آوری`;
    } else if (prayType === 'pray_rozeh') {
        u.loyalty = (u.loyalty || 0) + 5;
        u.shahnamehCount = (u.shahnamehCount || 0) + 1;
        reward = `⭐ +۸ وفاداری | 📚 +۱ شعر`;
    }
    
    progressQuest(u, 'pray');
    saveDB();
    
    const names = { pray_dua: 'دعا', pray_namaz: 'نماز', pray_rozeh: 'روضه' };
    
    const text = [
        `🕯️ «اهورامزدا شنید»`,
        `━━━━━━━━━━━━━━━━`,
        `${names[prayType]} پذیرفته شد!`,
        `${reward}`,
        `🎚️ پایه: ${u.level}`,
        `🕯️ نیایش‌ها: ${u.prayCount}`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `🔥 «آتش مقدس خاموش مباد!»`,
    ].join('\n');
    
    await ctx.reply(text, backBtn());
});

// ==================== 🍽️ سفره ایرانی ====================

bot.action('m_eat', async (ctx) => {
    await ctx.answerCbQuery();
    
    const text = [
        `🍽️ «سفره ایرانی - خوان شاهانه»`,
        `━━━━━━━━━━━━━━━━`,
        `«بفرمود تا سفره گستردند»`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('🍞 نان روغنی', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat')],
        [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
        [Markup.button.callback('🥩 گوشت بره', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
        [Markup.button.callback('🍜 آش رشته', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake')],
        [Markup.button.callback('🍯 انگبین', 'e_honey')],
        [Markup.button.callback('💧 آب', 'd_water'), Markup.button.callback('🧃 شربت', 'd_juice')],
        [Markup.button.callback('🍺 دوغ', 'd_soda'), Markup.button.callback('🍵 چای', 'd_tea')],
        [Markup.button.callback('☕ قهوه', 'd_coffee'), Markup.button.callback('🥛 شیر', 'd_milk')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

// خوردن غذا
bot.action(/e_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    if ((u.items && u.items[k] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
    
    const food = FOODS[k];
    if (!food) return ctx.answerCbQuery('❌');
    
    addItem(u, k, -1);
    if (food.h) u.hunger = Math.min(u.maxHp, (u.hunger || 100) + food.h);
    if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal);
    saveDB();
    
    await ctx.answerCbQuery(`✅ ${food.n} نوش جان`);
});

// نوشیدن
bot.action(/d_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);
    
    if ((u.items && u.items[k] || 0) < 1) return ctx.answerCbQuery('❌ نداری');
    
    const drink = DRINKS[k];
    if (!drink) return ctx.answerCbQuery('❌');
    
    addItem(u, k, -1);
    if (drink.t) u.thirst = Math.min(u.maxHp, (u.thirst || 100) + drink.t);
    if (drink.xp) {
        u.xp = (u.xp || 0) + drink.xp;
        while (u.xp >= 30) {
            u.xp -= 30;
            u.level++;
            u.maxHp += 10;
            u.hp = u.maxHp;
            u.power += 2;
            u.sp = (u.sp || 0) + 1;
        }
    }
    saveDB();
    
    await ctx.answerCbQuery(`✅ ${drink.n} نوش جان`);
});

// ==================== 👤 بزرگان (NPC) ====================

bot.action('m_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const cd = checkCD(u, 'npc', CD.npc);
    
    const btns = Object.entries(NPCS).map(([k, npc]) => [
        Markup.button.callback(`${npc.n}: ${npc.desc} (${npc.price} زر)`, `npc_${k}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'm_main')]);
    
    const text = [
        `👤 «بزرگان پارس»`,
        `━━━━━━━━━━━━━━━━`,
        `${cd.can ? '✅ آماده دیدار' : '⏳ ' + formatTime(cd.rem)}`,
        ``,
        `با یکی از بزرگان مشورت کن:`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard(btns));
});

bot.action(/npc_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const npc = NPCS[k];
    const u = getUser(ctx.from.id);
    
    if (!npc) return ctx.answerCbQuery('❌');
    
    const cd = checkCD(u, 'npc', CD.npc);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    if (u.gold < npc.price) return ctx.answerCbQuery(`❌ ${npc.price} زر لازم داری`);
    
    u.gold -= npc.price;
    const result = npc.effect(u);
    setCD(u, 'npc');
    saveDB();
    
    await ctx.answerCbQuery('✅');
    await ctx.reply(
        `👤 ${npc.n}\n━━━━━━━━━━━━━━━━\n${result}\n\n━◦○◦━◦○◦━◦○◦━◦○◦━\n📜 «${npc.desc}»`,
        backBtn()
    );
});

// ==================== 📋 مأموریت‌های روزانه ====================

bot.action('m_quest', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (!u.quests || u.quests.length === 0) {
        rollQuests(u);
        saveDB();
    }
    
    const text = ['📋 «مأموریت‌های روزانه»\n━━━━━━━━━━━━━━━━\n'];
    let allDone = true;
    
    for (const q of u.quests) {
        const progress = u.questProgress[q.target] || 0;
        const done = progress >= q.goal;
        if (!done) allDone = false;
        
        text.push(`${done ? '✅' : '⏳'} ${q.n}: ${progress}/${q.goal}`);
        text.push(`   ${q.desc}`);
        text.push(`   🎁 ${rwText(q.rew)}`);
        text.push('');
    }
    
    if (allDone) {
        text.push('🎉 همه مأموریت‌ها انجام شد!');
        text.push('📝 /claim_quests برای دریافت جایزه');
    }
    
    await ctx.reply(text.join('\n'), backBtn());
});

bot.command('claim_quests', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    if (!u.quests || u.quests.length === 0) return ctx.reply('❌ مأموریتی نداری');
    
    let claimed = false;
    for (const q of u.quests) {
        const progress = u.questProgress[q.target] || 0;
        if (progress >= q.goal && !q.claimed) {
            giveReward(u, q.rew);
            if (q.rew.xp) {
                u.xp = (u.xp || 0) + q.rew.xp;
                while (u.xp >= 30) {
                    u.xp -= 30;
                    u.level++;
                    u.maxHp += 10;
                    u.hp = u.maxHp;
                    u.power += 2;
                    u.sp = (u.sp || 0) + 1;
                }
            }
            q.claimed = true;
            claimed = true;
        }
    }
    
    if (!claimed) return ctx.reply('❌ هیچ مأموریتی کامل نشده');
    saveDB();
    await ctx.reply('✅ جایزه مأموریت‌ها دریافت شد!', backBtn());
});

// ==================== 🐎 حیوانات خونگی ====================

bot.action('m_pet', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const current = u.pet ? PETS[u.pet]?.n : 'نداری';
    
    const btns = Object.entries(PETS).map(([k, pet]) => [
        Markup.button.callback(`${pet.n}: ${pet.bonus} (${pet.price} زر)`, `buy_pet_${k}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'm_main')]);
    
    const text = [
        `🐎 «حیوانات خونگی»`,
        `━━━━━━━━━━━━━━━━`,
        `حیوان کنونی: ${current}`,
        ``,
        `یک همراه برگزین:`,
    ].join('\n');
    
    await ctx.reply(text, Markup.inlineKeyboard(btns));
});

bot.action(/buy_pet_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const pet = PETS[k];
    const u = getUser(ctx.from.id);
    
    if (!pet) return ctx.answerCbQuery('❌');
    if (u.pet) return ctx.answerCbQuery('❌ قبلاً حیوان داری');
    if (u.gold < pet.price) return ctx.answerCbQuery(`❌ ${pet.price} زر لازم داری`);
    
    u.gold -= pet.price;
    u.pet = k;
    saveDB();
    
    await ctx.answerCbQuery(`✅ ${pet.n} خریداری شد!`);
    await ctx.reply(
        `🐎 ${pet.n} همراه تو شد!\n✨ ${pet.bonus}`,
        backBtn()
    );
});

// ==================== 🏦 خزانه (بانک) ====================

bot.action('m_bank', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const text = [
        `🏦 «خزانه شاهی»`,
        `━━━━━━━━━━━━━━━━`,
        `💰 سپرده: ${u.bankGold || 0} زر`,
        `📈 سود کل: ${u.bankInterest || 0} زر`,
        `💎 سود روزانه: ۲٪`,
        ``,
        `📝 /deposit [مبلغ]`,
        `📝 /withdraw [مبلغ]`,
    ].join('\n');
    
    await ctx.reply(text, backBtn());
});

bot.command('deposit', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const amount = Number(args[1] || 0);
    
    if (!amount || amount <= 0) return ctx.reply('❌ /deposit [مبلغ]');
    if (u.gold < amount) return ctx.reply('❌ زر کافی نداری');
    
    u.gold -= amount;
    u.bankGold = (u.bankGold || 0) + amount;
    saveDB();
    
    await ctx.reply(`✅ ${amount} زر به خزانه سپرده شد\n🏦 موجودی: ${u.bankGold} زر`);
});

bot.command('withdraw', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const amount = Number(args[1] || 0);
    
    if (!amount || amount <= 0) return ctx.reply('❌ /withdraw [مبلغ]');
    if ((u.bankGold || 0) < amount) return ctx.reply('❌ موجودی کافی نیست');
    
    u.bankGold -= amount;
    u.gold += amount;
    saveDB();
    
    await ctx.reply(`✅ ${amount} زر برداشت شد\n🥇 زر همراه: ${u.gold}`);
});

// ==================== 🏆 دستاوردها ====================

bot.action('m_achieve', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    const newAch = checkAchievements(u);
    saveDB();
    
    const text = ['🏆 «دستاوردهای پهلوانی»\n━━━━━━━━━━━━━━━━\n'];
    let count = 0;
    
    for (const ach of ACHIEVEMENTS) {
        const earned = u.achievements.includes(ach.id);
        if (earned) count++;
        text.push(`${earned ? '✅' : '🔒'} ${ach.n}: ${ach.desc}`);
    }
    
    text.push(`\n📊 ${count}/${ACHIEVEMENTS.length} دستاورد`);
    if (newAch.length > 0) {
        text.push(`\n🎉 دستاورد نو:\n${newAch.map(a => a.n).join(', ')}`);
    }
    
    await ctx.reply(text.join('\n'), backBtn());
});

// ==================== 🏰 قبیله (کلن) ====================

bot.action('m_clan', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (!u.clan) {
        const text = [
            `🏰 «قبیله»`,
            `━━━━━━━━━━━━━━━━`,
            `تو عضو هیچ قبیله‌ای نیستی!`,
            ``,
            `📝 /create_clan [اسم] - ساخت (۱۰۰۰ زر)`,
            `📝 /join_clan [اسم] - عضویت`,
            `📝 /clans - لیست قبایل`,
        ].join('\n');
        return ctx.reply(text, backBtn());
    }
    
    const clan = db.clans[u.clan];
    if (!clan) {
        u.clan = null;
        saveDB();
        return ctx.reply('❌ قبیله حذف شده', backBtn());
    }
    
    const members = clan.members.map(mid => db.users[mid]?.name || mid).join('، ');
    
    const text = [
        `🏰 ${clan.name}`,
        `━━━━━━━━━━━━━━━━`,
        `👑 مهتر: ${db.users[clan.owner]?.name || '?'}`,
        `👥 اعضا: ${members}`,
        `💰 خزانه: ${clan.treasury || 0} زر`,
        ``,
        `📝 /donate gold [مقدار]`,
        `📝 /leave_clan - خروج`,
    ].join('\n');
    
    await ctx.reply(text, backBtn());
});

bot.command('create_clan', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    if (u.clan) return ctx.reply('❌ تو عضو قبیله‌ای هستی');
    if (u.gold < 1000) return ctx.reply('❌ ۱۰۰۰ زر لازم داری');
    
    const args = ctx.message.text.trim().split(/\s+/);
    const name = args.slice(1).join(' ');
    
    if (!name) return ctx.reply('📝 /create_clan [اسم]');
    if (Object.values(db.clans).some(c => c.name === name)) return ctx.reply('❌ این نام هست');
    
    const clanId = 'c' + Date.now();
    db.clans[clanId] = {
        id: clanId,
        name,
        owner: u.id,
        members: [u.id],
        treasury: 0,
    };
    u.clan = clanId;
    u.gold -= 1000;
    saveDB();
    
    await ctx.reply(`✅ قبیله «${name}» ساخته شد!\n👑 تو مهتر هستی.`);
});

bot.command('join_clan', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    if (u.clan) return ctx.reply('❌ تو عضو قبیله‌ای هستی');
    
    const args = ctx.message.text.trim().split(/\s+/);
    const name = args.slice(1).join(' ');
    
    if (!name) return ctx.reply('📝 /join_clan [اسم]');
    
    const clan = Object.values(db.clans).find(c => c.name === name);
    if (!clan) return ctx.reply('❌ یافت نشد');
    if (clan.members.length >= 10) return ctx.reply('❌ پر شده (۱۰ نفر)');
    
    clan.members.push(u.id);
    u.clan = clan.id;
    saveDB();
    
    await ctx.reply(`✅ به قبیله «${name}» پیوستی!`);
});

bot.command('leave_clan', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    if (!u.clan) return ctx.reply('❌ عضو قبیله‌ای نیستی');
    
    const clan = db.clans[u.clan];
    if (clan) {
        clan.members = clan.members.filter(m => m !== u.id);
        if (clan.members.length === 0) {
            delete db.clans[u.clan];
        } else if (clan.owner === u.id) {
            clan.owner = clan.members[0];
        }
    }
    u.clan = null;
    saveDB();
    
    await ctx.reply('✅ از قبیله خارج شدی');
});

bot.command('donate', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    if (!u.clan) return ctx.reply('❌ عضو قبیله‌ای نیستی');
    
    const args = ctx.message.text.trim().split(/\s+/);
    const key = args[1];
    const amt = Number(args[2] || 0);
    
    if (key === 'gold' && u.gold >= amt && amt > 0) {
        u.gold -= amt;
        db.clans[u.clan].treasury = (db.clans[u.clan].treasury || 0) + amt;
        saveDB();
        await ctx.reply(`✅ ${amt} زر به خزانه اهدا شد`);
    } else {
        await ctx.reply('❌ /donate gold [مقدار]');
    }
});

bot.command('clans', async (ctx) => {
    const clans = Object.values(db.clans);
    
    if (!clans.length) return ctx.reply('❌ هیچ قبیله‌ای نیست');
    
    const text = ['🏰 قبایل:\n'];
    clans.forEach(c => {
        text.push(`${c.name}: ${c.members.length} عضو | ${c.treasury || 0} زر`);
    });
    
    await ctx.reply(text.join('\n'));
});

console.log('✅ بخش پنجم - آتشکده، غذا، NPC، مأموریت‌ها، حیوانات، بانک، دستاوردها، کلن بارگذاری شد');

// ==================== 🎁 صندوقچه راز ====================

bot.action('m_box', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const now = Date.now();

    // بررسی کول‌داون ۴ ساعت
    if (u.lastBox && now - u.lastBox < CD.box) {
        const remaining = CD.box - (now - u.lastBox);
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        return ctx.answerCbQuery(`⏳ ${h} ساعت و ${m} دقیقه دیگر`);
    }

    u.lastBox = now;
    const loot = BOX_LOOT[rand(0, BOX_LOOT.length - 1)];

    // اعمال اثر جایزه
    if (typeof loot.effect === 'function') {
        loot.effect(u);
    }

    saveDB();

    const text = [
        `🎁 «صندوقچه راز گشوده شد»`,
        `━━━━━━━━━━━━━━━━`,
        `${loot.n} یافتی!`,
        ``,
        `⏳ چهار ساعت دیگر باز خواهی گشود.`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `📜 «بخت با تو یار بود!»`,
    ].join('\n');

    await ctx.reply(text, backBtn());
});

// ==================== 📜 شاهنامه ====================

bot.command('shahnameh', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);

    const cd = checkCD(u, 'shahnameh', CD.shahnameh);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);

    setCD(u, 'shahnameh');
    const verse = SHAHNAMEH_VERSES[rand(0, SHAHNAMEH_VERSES.length - 1)];
    const reward = verse.reward;

    u.gold += reward;
    u.shahnamehCount = (u.shahnamehCount || 0) + 1;
    u.loyalty = (u.loyalty || 0) + 5;
    progressQuest(u, 'shahnameh');
    saveDB();

    const text = [
        `📜 «از گنجینه حکیم فردوسی»`,
        `━━━━━━━━━━━━━━━━`,
        `«${verse.verse}»`,
        `━━━━━━━━━━━━━━━━`,
        `🎁 پاداش: ${reward} زر`,
        `📚 شعرهای خوانده: ${u.shahnamehCount}`,
        `⭐ وفاداری: ${u.loyalty}`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `🕯️ «جاودان باد نام فردوسی»`,
    ].join('\n');

    await ctx.reply(text, backBtn());
});

bot.command('top_loyalty', async (ctx) => {
    const users = Object.values(db.users)
        .filter(u => (u.loyalty || 0) > 0)
        .sort((a, b) => (b.loyalty || 0) - (a.loyalty || 0))
        .slice(0, 10);

    if (!users.length) return ctx.reply('❌ هنوز کسی وفاداری ندارد');

    const text = ['🏆 وفادارترین پهلوانان:\n'];
    users.forEach((u, i) => {
        text.push(`${i + 1}. ${u.name || '?'} | ⭐${u.loyalty || 0} | 📚${u.shahnamehCount || 0} شعر`);
    });

    await ctx.reply(text.join('\n'));
});

// ==================== ⭐ هنرستان (مهارت‌ها) ====================

bot.action('m_skills', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);

    const text = [
        `⭐ «هنرستان - آموزشگاه رستم»`,
        `━━━━━━━━━━━━━━━━`,
        `«هنر نزد ایرانیان است و بس»`,
        ``,
        `گوهر هنر: ${u.sp || 0}`,
        ``,
        `⛏️ دروگری: ${u.skills?.g || 0}/10`,
        `🏹 کمانداری: ${u.skills?.h || 0}/10`,
        `🔨 آهنگری: ${u.skills?.c || 0}/10`,
        `🏕️ کوهنوردی: ${u.skills?.s || 0}/10`,
        ``,
        `📝 /skill <g|h|c|s>`,
    ].join('\n');

    await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('⛏️ دروگری', 'sk_g'), Markup.button.callback('🏹 کمانداری', 'sk_h')],
        [Markup.button.callback('🔨 آهنگری', 'sk_c'), Markup.button.callback('🏕️ کوهنوردی', 'sk_s')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action(/sk_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1];
    const u = getUser(ctx.from.id);

    if (!u.sp || u.sp <= 0) return ctx.answerCbQuery('❌ گوهر هنر نداری');
    if ((u.skills && u.skills[k] || 0) >= 10) return ctx.answerCbQuery('❌ به اوج رسیده');

    if (!u.skills) u.skills = { g: 0, h: 0, c: 0, s: 0 };
    u.skills[k] = (u.skills[k] || 0) + 1;
    u.sp--;
    saveDB();

    await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const k = args[1];

    if (!['g', 'h', 'c', 's'].includes(k)) return ctx.reply('❌ g, h, c, s');
    if (!u.sp || u.sp <= 0) return ctx.reply('❌ گوهر هنر نداری');
    if ((u.skills && u.skills[k] || 0) >= 10) return ctx.reply('❌ به اوج رسیده');

    if (!u.skills) u.skills = { g: 0, h: 0, c: 0, s: 0 };
    u.skills[k] = (u.skills[k] || 0) + 1;
    u.sp--;
    saveDB();

    await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`, backBtn());
});

// ==================== 📖 اوستا (راهنما) ====================

bot.action('m_guide', async (ctx) => {
    await ctx.answerCbQuery();

    const text = [
        `📖 «اوستا - کتاب آسمانی»`,
        `━━━━━━━━━━━━━━━━`,
        `🌲 بیشه نارون: ${formatTime(CD.gather)}`,
        `⚔️ میدان رزم: ${formatTime(CD.fight)}`,
        `👿 موجودات پلید: ${formatTime(CD.boss)}`,
        `🏟️ میدان پهلوانی: ${formatTime(CD.pvp)}`,
        `🕯️ آتشکده: ${formatTime(CD.pray)}`,
        `🎁 صندوقچه: ${formatTime(CD.box)}`,
        `🎁 جایزه روزانه: ${formatTime(CD.daily)}`,
        `📜 شاهنامه: ${formatTime(CD.shahnameh)}`,
        `👤 بزرگان: ${formatTime(CD.npc)}`,
        ``,
        `📜 شاهنامه:`,
        `هر یک ساعت شعری از فردوسی بخوان`,
        `و جایزه بگیر! دستور: /shahnameh`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `📜 «به کوشش باش تا پیروز گردی»`,
    ].join('\n');

    await ctx.reply(text, backBtn());
});

// ==================== ⏱️ چرخ زمان ====================

bot.action('m_cd', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);

    const acts = [
        ['gather', '🌲 بیشه', CD.gather],
        ['fight', '⚔️ رزم', CD.fight],
        ['boss', '👿 پلید', CD.boss],
        ['pvp', '🏟️ پهلوانی', CD.pvp],
        ['pray', '🕯️ آتشکده', CD.pray],
        ['box', '🎁 صندوقچه', CD.box],
        ['daily', '🎁 جایزه', CD.daily],
        ['shahnameh', '📜 شاهنامه', CD.shahnameh],
        ['npc', '👤 بزرگان', CD.npc],
    ];

    const lines = ['⏱️ «چرخ زمان می‌گردد»\n━━━━━━━━━━━━━━━━\n'];
    for (const [k, n, cd] of acts) {
        const c = checkCD(u, k, cd);
        lines.push(`${n}: ${c.can ? '✅ آماده' : '⏳ ' + formatTime(c.rem)}`);
    }

    await ctx.reply(lines.join('\n'), backBtn());
});

// ==================== 🎁 جایزه روزانه ====================

bot.action('m_daily', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);

    const cd = checkCD(u, 'daily', CD.daily);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);

    setCD(u, 'daily');
    const reward = { gold: rand(50, 150), xp: rand(10, 30) };
    giveReward(u, reward);
    u.loyalty = (u.loyalty || 0) + 10;

    if (reward.xp) {
        u.xp = (u.xp || 0) + reward.xp;
        while (u.xp >= 30) {
            u.xp -= 30;
            u.level++;
            u.maxHp += 10;
            u.hp = u.maxHp;
            u.power += 2;
            u.sp = (u.sp || 0) + 1;
        }
    }

    saveDB();

    const text = [
        `🎁 «خورشید برآمد، روز نو شد»`,
        `━━━━━━━━━━━━━━━━`,
        `جایزه امروزت از خزانه شاهنشاه:`,
        ``,
        `${rwText(reward)}`,
        `⭐ +۱۰ وفاداری`,
        ``,
        `━◦○◦━◦○◦━◦○◦━◦○◦━`,
        `📜 «فردا باز آی تا برکت یابی»`,
    ].join('\n');

    await ctx.reply(text, backBtn());
});

bot.command('daily', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'daily', CD.daily);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)} دیگر`);

    setCD(u, 'daily');
    const reward = { gold: rand(50, 150), xp: rand(10, 30) };
    giveReward(u, reward);
    u.loyalty = (u.loyalty || 0) + 10;
    if (reward.xp) {
        u.xp = (u.xp || 0) + reward.xp;
        while (u.xp >= 30) {
            u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1;
        }
    }
    saveDB();
    await ctx.reply(`🎁 ${rwText(reward)}\n⭐ +۱۰ وفاداری`);
});

// ==================== 👑 ادمین ====================

bot.command('users', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const users = Object.values(db.users).sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, 10);
    let txt = `👥 ${Object.keys(db.users).length} پهلوان\n🏆 نامداران:\n`;
    users.forEach((u, i) => {
        txt += `${i + 1}. ${u.name || '?'} | پایه ${u.level || 1} | 🥇${u.gold || 0}\n`;
    });
    await ctx.reply(txt);
});

bot.command('admin_give', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.trim().split(/\s+/);
    const u = getUser(args[1], '');
    if (args[2] === 'resource') addRes(u, args[3], Number(args[4] || 0));
    else if (args[2] === 'item') addItem(u, args[3], Number(args[4] || 0));
    else if (args[2] === 'weapon') { if (!u.wOwned) u.wOwned = {}; u.wOwned[args[3]] = true; }
    else if (args[2] === 'armor') { if (!u.aOwned) u.aOwned = {}; u.aOwned[args[3]] = true; }
    else if (args[2] === 'xp') { u.xp = (u.xp || 0) + Number(args[4] || 0); while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1; } }
    else if (args[2] === 'gold') u.gold += Number(args[4] || 0);
    saveDB();
    await ctx.reply('✅ انجام شد');
});

bot.command('admin_full', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const u = getUser(ctx.message.text.trim().split(/\s+/)[1], '');
    for (const k of Object.keys(RES)) { if (!u.res) u.res = {}; u.res[k] = 9999; }
    for (const k of Object.keys(WEAPONS)) { if (!u.wOwned) u.wOwned = {}; u.wOwned[k] = true; }
    for (const k of Object.keys(ARMORS)) { if (!u.aOwned) u.aOwned = {}; u.aOwned[k] = true; }
    u.weapon = 'zolfaghar';
    u.armor = 'babr_bayan';
    u.level = 20; u.xp = 0; u.hp = u.maxHp = 500;
    u.power = 50; u.sp = 40; u.homeLvl = 5; u.clinicLvl = 3;
    u.pvpRating = 1500; u.pvpLeague = 'legendary'; u.honorPoints = 500;
    u.loyalty = 1000; u.shahnamehCount = 50;
    u.gold = 99999; u.bankGold = 50000;
    saveDB();
    await ctx.reply('✅ شاهنشاه شد!');
});

// ==================== ❌ مدیریت خطا ====================
bot.catch((err, ctx) => {
    console.error('❌ خطا:', err.message);
    try {
        ctx.reply('❌ خطایی رخ داد. /start را بزن').catch(() => {});
    } catch (e) {}
});

// ==================== 🚀 اجرای ربات ====================
bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('✅ بقای باستانی - نسخه پرو بیگ مکس با موفقیت اجرا شد!'))
    .catch(err => console.error('❌ خطای راه‌اندازی:', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ بخش ششم - صندوقچه، شاهنامه، مهارت‌ها، راهنما، زمان‌ها، ادمین، اجرا بارگذاری شد');
console.log('🏛️ بقای باستانی - پرو بیگ مکس آماده اجراست!');