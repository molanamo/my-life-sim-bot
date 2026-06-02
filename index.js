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

function progressBar(c, max, len = 8) {
    const f = Math.floor(Math.max(0, Math.min(c || 0, max || 1)) / (max || 1) * len);
    return '🟩'.repeat(Math.max(0, f)) + '⬜'.repeat(Math.max(0, len - f));
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

// ==================== 🍽️ غذا و نوشیدنی ====================
const FOODS = {
    bread: { n: '🍞 نان', h: 30 }, meat: { n: '🍖 کباب', h: 50 },
    fish: { n: '🐟 ماهی', h: 25 }, chicken: { n: '🍗 ماکیان', h: 45 },
    steak: { n: '🥩 گوشت', h: 70 }, stew: { n: '🥘 آبگوشت', h: 55 },
    noodle: { n: '🍜 آش', h: 35 }, cake: { n: '🍰 باقلوا', h: 25, heal: 20 },
    honey: { n: '🍯 انگبین', h: 20, heal: 30 },
};
const DRINKS = {
    water: { n: '💧 آب', t: 40 }, juice: { n: '🧃 شربت', t: 50 },
    soda: { n: '🍺 دوغ', t: 25 }, tea: { n: '🍵 چای', t: 35 },
    coffee: { n: '☕ قهوه', t: 30, xp: 10 }, milk: { n: '🥛 شیر', t: 45 },
};

// ==================== 👹 موجودات ====================
const ALL_ENEMIES = [
    { n: '🐺 گرگ تورانی', p: 8, loss: [8,16], rew: { gold: 10, meat: 1 }, xp: 8, type: 'animal' },
    { n: '🐗 گراز', p: 10, loss: [9,18], rew: { gold: 12, meat: 2 }, xp: 10, type: 'animal' },
    { n: '🦊 شغال', p: 12, loss: [10,20], rew: { gold: 15, meat: 1 }, xp: 12, type: 'animal' },
    { n: '🐻 خرس', p: 16, loss: [14,28], rew: { gold: 20, meat: 3 }, xp: 15, type: 'animal' },
    { n: '👹 دیو سفید', p: 16, loss: [18,35], rew: { gold: 28, iron: 2, gem: 1 }, xp: 18, type: 'demon' },
    { n: '👺 دیو سیاه', p: 22, loss: [22,40], rew: { gold: 40, iron: 3, gem: 1 }, xp: 22, type: 'demon' },
    { n: '👾 اکوان دیو', p: 28, loss: [25,48], rew: { gold: 55, iron: 4, gem: 2 }, xp: 28, type: 'demon' },
    { n: '🐉 ضحاک', p: 40, loss: [35,70], rew: { gold: 500, dragon_scale: 2, gem: 5 }, xp: 100, type: 'boss', ml: 8 },
    { n: '🦅 سیمرغ', p: 50, loss: [40,80], rew: { gold: 800, phoenix_feather: 2, gem: 8 }, xp: 150, type: 'boss', ml: 10 },
];

// ==================== 📚 کتابخانه ====================
const LIBRARY = {
    shahnameh: {
        name: '📜 شاهنامه', poet: 'حکیم فردوسی',
        verses: [
            { text: 'توانا بود هر که دانا بود\nز دانش دل پیر برنا بود', rew: { gold: 15 } },
            { text: 'به نام خداوند جان و خرد\nکزین برتر اندیشه برنگذرد', rew: { gold: 10 } },
            { text: 'هنر نزد ایرانیان است و بس\nندارند شیر ژیان را به کس', rew: { gold: 25 } },
            { text: 'چو ایران نباشد تن من مباد\nبدین بوم و بر زنده یک تن مباد', rew: { gold: 30 } },
        ],
    },
    masnavi: {
        name: '🕊️ مثنوی', poet: 'مولانا',
        verses: [
            { text: 'بشنو از نی چون حکایت می‌کند\nاز جدایی‌ها شکایت می‌کند', rew: { xp: 25 } },
            { text: 'هر کسی کو دور ماند از اصل خویش\nباز جوید روزگار وصل خویش', rew: { xp: 20 } },
        ],
    },
    golestan: {
        name: '🌹 گلستان', poet: 'سعدی',
        verses: [
            { text: 'بنی‌آدم اعضای یکدیگرند\nکه در آفرینش ز یک گوهرند', rew: { gold: 10, xp: 10 } },
        ],
    },
    hafez: {
        name: '💫 دیوان حافظ', poet: 'خواجه حافظ شیرازی',
        verses: [
            { text: 'یوسف گمگشته باز آید به کنعان غم مخور\nکلبه احزان شود روزی گلستان غم مخور', rew: { gold: 20 } },
        ],
    },
    khayyam: {
        name: '🌙 رباعیات', poet: 'حکیم عمر خیام',
        verses: [
            { text: 'هر ذره که در خاک زمینی بودست\nپیش از من و تو تاج و نگینی بودست', rew: { gold: 10, xp: 15 } },
        ],
    },
};

// ==================== 🎁 صندوقچه ====================
const BOX_LOOT = [
    { n: '🥇 ۵۰ زر', f: (u) => { u.gold += 50; } },
    { n: '🥇 ۱۰۰ زر', f: (u) => { u.gold += 100; } },
    { n: '💎 ۱ گوهر', f: (u) => { if (!u.items) u.items = {}; u.items.gem = (u.items.gem || 0) + 1; } },
    { n: '✨ ۳۰ XP', f: (u) => { u.xp = (u.xp || 0) + 30; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } } },
    { n: '❤️ درمان', f: (u) => { u.hp = u.maxHp; } },
];

// ==================== 🏠 ارتقای خانه ====================
const HOME_UP = {
    2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, nl: 3 },
    3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, nl: 5 },
    4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, nl: 8 },
    5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, nl: 12 },
};

// ==================== 🏆 لیگ PvP ====================
const PVP_LEAGUES = {
    bronze: { n: '🥉 برنز', min: 0 },
    silver: { n: '🥈 نقره', min: 100 },
    gold: { n: '🥇 طلا', min: 300 },
    diamond: { n: '💎 الماس', min: 600 },
    legendary: { n: '👑 افسانه‌ای', min: 1000 },
};

// ==================== 🐎 حیوانات ====================
const PETS = {
    horse: { n: '🐎 رخش', price: 500 },
    falcon: { n: '🦅 باز', price: 400 },
    dog: { n: '🐕 سگ', price: 300 },
    cat: { n: '🐈 گربه', price: 200 },
};

// ==================== 👤 NPC ====================
const NPCS = {
    zal: { n: '👴 زال', price: 50, f: (u) => { u.sp = (u.sp || 0) + 1; return '⭐ +۱ گوهر'; } },
    simurgh: { n: '🦅 سیمرغ', price: 100, f: (u) => { u.hp = u.maxHp; return '❤️ درمان'; } },
    rostam: { n: '⚔️ رستم', price: 80, f: (u) => { u.xp = (u.xp || 0) + 50; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } return '✨ +۵۰ XP'; } },
    ferdosi: { n: '📜 فردوسی', price: 30, f: (u) => { u.gold += 50; return '🥇 +۵۰ زر'; } },
};

// ==================== 🌍 رویدادها ====================
const EVENTS = [
    { n: '🌪️ طوفان سهمگین', desc: 'طوفان به کاشانه‌ات آسیب زد!', f: (u) => { if (!u.res) u.res = {}; u.res.wood = Math.floor((u.res.wood || 0) * 0.7); u.res.stone = Math.floor((u.res.stone || 0) * 0.7); return '🪵 و 🪨 کاهش یافت'; } },
    { n: '💰 گنج پنهان', desc: 'گنج کهنه پیدا کردی!', f: (u) => { const g = rand(100, 500); u.gold += g; return `🥇 +${g} زر`; } },
    { n: '🎁 هدیه آسمانی', desc: 'بسته از آسمان افتاد!', f: (u) => { if (!u.items) u.items = {}; u.items.bread = (u.items.bread || 0) + 3; u.items.water = (u.items.water || 0) + 2; return '🍞 +۳ | 💧 +۲'; } },
    { n: '🤒 بیماری', desc: 'بیمار شدی...', f: (u) => { u.hp = Math.floor(u.hp * 0.5); return '❤️ نصف شد'; } },
];

// ==================== 💀 توهین‌ها ====================
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

console.log('✅ بخش ۱ از ۳ - داده‌ها و تنظیمات بارگذاری شد');

// ==================== 👤 مدیریت کاربر ====================
function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = {
            id: uid, name: name || 'ناشناس',
            level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5,
            homeLvl: 1, clinicLvl: 1, weapon: 'none', armor: 'none',
            skills: { g: 0, h: 0, c: 0, s: 0 }, sp: 0,
            res: { wood: 20, stone: 20, metal: 10, iron: 5 },
            items: { bandage: 1, bread: 2, water: 2 },
            wOwned: { none: true }, aOwned: { none: true },
            cooldowns: {}, daily: {},
            stats: { fw: 0, dw: 0, bw: 0 },
            pvpWins: 0, pvpLosses: 0, pvpRating: 0, pvpLeague: 'bronze',
            pvpStreak: 0, pvpHistory: [], honorPoints: 0,
            loyalty: 0, shahnamehCount: 0, pet: null,
            bankGold: 0, bankInterest: 0, weaponEnchant: null,
            achievements: [], quests: [], questProgress: {}, clan: null,
            logins: 1, lastBox: 0, lastPray: 0,
            pendingFight: null, pendingPvP: null,
            libraryCD: {},
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
    u.homeLvl = u.homeLvl || 1; u.clinicLvl = u.clinicLvl || 1;
    u.weapon = u.weapon || 'none'; u.armor = u.armor || 'none';
    u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0 }; u.sp = u.sp || 0;
    u.res = u.res || {}; u.items = u.items || {};
    u.wOwned = u.wOwned || { none: true }; u.aOwned = u.aOwned || { none: true };
    u.cooldowns = u.cooldowns || {}; u.daily = u.daily || {};
    u.stats = u.stats || { fw: 0, dw: 0, bw: 0 };
    u.pvpWins = u.pvpWins || 0; u.pvpLosses = u.pvpLosses || 0;
    u.pvpRating = u.pvpRating || 0; u.pvpLeague = u.pvpLeague || 'bronze';
    u.pvpStreak = u.pvpStreak || 0; u.pvpHistory = u.pvpHistory || [];
    u.honorPoints = u.honorPoints || 0; u.loyalty = u.loyalty || 0;
    u.shahnamehCount = u.shahnamehCount || 0; u.pet = u.pet || null;
    u.bankGold = u.bankGold || 0; u.bankInterest = u.bankInterest || 0;
    u.weaponEnchant = u.weaponEnchant || null;
    u.achievements = u.achievements || []; u.quests = u.quests || [];
    u.questProgress = u.questProgress || {}; u.clan = u.clan || null;
    u.lastBox = u.lastBox || 0; u.lastPray = u.lastPray || 0;
    u.libraryCD = u.libraryCD || {};
    u.wOwned.none = true; u.aOwned.none = true;
    
    const today = new Date().toDateString();
    if (u.lastLoginDate !== today) { u.loyalty = (u.loyalty || 0) + 5; u.lastLoginDate = today; }
    if (u.lastQuestDate !== today) { rollQuests(u); u.lastQuestDate = today; }
    if (u.lastBankDate !== today && u.bankGold > 0) { u.bankGold += Math.floor(u.bankGold * 0.02); u.lastBankDate = today; }
    saveDB();
    return u;
}

function rollQuests(u) {
    u.quests = [
        { n: 'شکار', t: 'gather', g: 3, rew: { gold: 100, xp: 20 } },
        { n: 'نبرد', t: 'fight', g: 2, rew: { gold: 150, xp: 30 } },
        { n: 'پهلوان', t: 'pvp_win', g: 1, rew: { gold: 200, xp: 40 } },
    ];
    u.questProgress = {};
    u.quests.forEach(q => u.questProgress[q.t] = 0);
}

function addXP(u, a) { u.xp = (u.xp || 0) + a; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1; } }
function addRes(u, k, v) { if (!u.res) u.res = {}; if (!u.res[k]) u.res[k] = 0; u.res[k] += v; if (u.res[k] < 0) u.res[k] = 0; }
function addItem(u, k, v) { if (!u.items) u.items = {}; if (!u.items[k]) u.items[k] = 0; u.items[k] += v; if (u.items[k] < 0) u.items[k] = 0; }
function hasRes(u, c) { if (!u.res) return false; for (const [k, v] of Object.entries(c)) { if (k === 'nl') continue; if ((u.res[k] || 0) < v) return false; } return true; }
function takeRes(u, c) { for (const [k, v] of Object.entries(c)) { if (k === 'nl') continue; addRes(u, k, -v); } }
function giveReward(u, r) { if (!r) return; for (const [k, v] of Object.entries(r)) { if (RES[k]) addRes(u, k, v); else addItem(u, k, v); } }
function rwText(r) { if (!r) return 'ندارد'; return Object.entries(r).map(([k, v]) => RES[k] ? `${RES[k]} ${v}` : `${v}x ${k}`).join(' | '); }
function updateLeague(u) { const rt = u.pvpRating || 0; for (const [k, l] of Object.entries(PVP_LEAGUES).reverse()) { if (rt >= l.min) { u.pvpLeague = k; break; } } }
function progressQuest(u, t) { if (!u.questProgress) u.questProgress = {}; u.questProgress[t] = (u.questProgress[t] || 0) + 1; }

// ==================== 📊 منوها ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 آمار', 'm_status'), Markup.button.callback('🌲 جستجو', 'm_gather'), Markup.button.callback('⚔️ نبرد', 'm_fight_menu'), Markup.button.callback('🏟️ PvP', 'm_pvp')],
        [Markup.button.callback('🏠 پایگاه', 'm_base'), Markup.button.callback('🛒 بازار', 'm_shop'), Markup.button.callback('🏪 تجهیزات', 'm_equip'), Markup.button.callback('🎭 امکانات', 'm_facilities')],
        [Markup.button.callback('📚 کتابخانه', 'm_library'), Markup.button.callback('🎁 سایر', 'm_other')],
    ]);
}

// ==================== 🔙 دکمه برگشت هوشمند ====================
function backBtn(target) {
    return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', `back_${target}`)]]);
}

bot.action(/back_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const t = ctx.match[1];
    
    const actions = {
        main: () => { 
            const u = getUser(ctx.from.id); 
            const text = `🏛️ «در بارگاه جمشید»\n━━━━━━━━━━━━\n«که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`;
            try { await ctx.editMessageText(text, mainMenu()); } catch (e) { await ctx.reply(text, mainMenu()); }
        },
        status: () => bot.action('m_status')(ctx),
        gather: () => bot.action('m_gather')(ctx),
        fight_menu: () => bot.action('m_fight_menu')(ctx),
        pvp: () => bot.action('m_pvp')(ctx),
        base: () => bot.action('m_base')(ctx),
        home: () => bot.action('m_home')(ctx),
        heal: () => bot.action('m_heal')(ctx),
        bank: () => bot.action('m_bank')(ctx),
        clan: () => bot.action('m_clan')(ctx),
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
    const text = `🏛️ «در بارگاه جمشید»\n━━━━━━━━━━━━━━━━\n«که این دشت و هامون و این بوم و بر\nهمه جای جنگ است و جای هنر»\n\nدرود بر تو ای پهلوان ${u.name}!\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold} زر${eventText}`;
    await ctx.reply(text, mainMenu());
});

// ==================== 📊 آمار ====================
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const l = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    const text = `📊 «دیوان آمار»\n━━━━━━━━━━━━\n👤 ${u.name}\n🎚️ لول: ${u.level} | ✨ ${u.xp}/30\n❤️ ${u.hp}/${u.maxHp}\n⚡ ${u.power}\n🗡️ ${w.n}\n🛡️ ${a.n}\n🐎 ${u.pet?PETS[u.pet]?.n:'ندارد'}\n🏆 ${l.n} ⭐${u.pvpRating}\n🎖️ ${u.loyalty} | 📚 ${u.shahnamehCount}\n🏦 ${u.bankGold} | 🥇 ${u.gold}`;
    try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
});

// ==================== 🌲 جستجو ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'gather', CD.gather);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    setCD(u, 'gather');
    const roll = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { metal: 1, stone: 2 }, { wood: 4 }, { gold: 10 }][rand(0, 4)];
    giveReward(u, roll);
    let ex = '';
    if (Math.random() < 0.3) { const f = ['bread', 'fish', 'water', 'meat'][rand(0, 3)]; addItem(u, f, 1); ex = `\n🍽️ ${FOODS[f]?.n || f} نیز یافت شد!`; }
    u.loyalty = (u.loyalty || 0) + 1; progressQuest(u, 'gather'); saveDB();
    const text = `🌲 «به بیشه نارون»\n━━━━━━━━━━━━\n🎁 ${rwText(roll)}${ex}\n⏳ ${formatTime(CD.gather)}`;
    try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
});

// ==================== ⚔️ نبرد ====================
bot.action('m_fight_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '⚔️ «میدان رزم»\n━━━━━━━━━━━━';
    try { await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('🐺 ددان', 'f_animals'), Markup.button.callback('👹 دیوان', 'f_demons')],
        [Markup.button.callback('👿 پلید', 'f_bosses'), Markup.button.callback('🎲 رندوم', 'f_random')],
        [Markup.button.callback('🔙 بازگشت', 'back_fight_menu')],
    ])); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard([
        [Markup.button.callback('🐺 ددان', 'f_animals'), Markup.button.callback('👹 دیوان', 'f_demons')],
        [Markup.button.callback('👿 پلید', 'f_bosses'), Markup.button.callback('🎲 رندوم', 'f_random')],
        [Markup.button.callback('🔙 بازگشت', 'back_fight_menu')],
    ])); }
});

bot.action('f_animals', async (ctx) => startFight(ctx, 'animal'));
bot.action('f_demons', async (ctx) => startFight(ctx, 'demon'));
bot.action('f_bosses', async (ctx) => startFight(ctx, 'boss'));
bot.action('f_random', async (ctx) => startFight(ctx, 'random'));

async function startFight(ctx, type) {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.answerCbQuery('❌');
    const pool = type === 'random' ? ALL_ENEMIES : ALL_ENEMIES.filter(e => e.type === type);
    const enemy = pool[rand(0, pool.length - 1)];
    if (enemy.ml && u.level < enemy.ml) return ctx.answerCbQuery(`❌ لول ${enemy.ml}`);
    u.pendingFight = enemy; setCD(u, 'fight'); saveDB();
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const ch = clamp(50 + (u.power + w.p - enemy.p) * 5, 5, 95);
    const text = `⚔️ ${enemy.n}\n💪 ${enemy.p}\n🎁 ${rwText(enemy.rew)}\n🛡️ ${ch}%`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ حمله!', `fg_${ALL_ENEMIES.indexOf(enemy)}`)],
        [Markup.button.callback('🔙 بازگشت', 'back_fight_menu')],
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
    const pp = u.power + w.p + rand(0, 8);
    const ep = enemy.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(50 + (pp - ep) * 5, 5, 95);
    const dmg = Math.max(1, rand(enemy.loss[0], enemy.loss[1]) - a.d);
    u.hp = clamp(u.hp - dmg, 0, u.maxHp);
    let txt;
    if (win) {
        giveReward(u, enemy.rew); addXP(u, enemy.xp);
        if (enemy.type === 'animal') u.stats.fw = (u.stats.fw || 0) + 1;
        else if (enemy.type === 'demon') u.stats.dw = (u.stats.dw || 0) + 1;
        else u.stats.bw = (u.stats.bw || 0) + 1;
        progressQuest(u, 'fight'); u.loyalty = (u.loyalty || 0) + 2;
        txt = `✅ پیروزی!\n✨ +${enemy.xp} XP\n❤️ -${dmg}\n🎁 ${rwText(enemy.rew)}`;
    } else { txt = `❌ شکست!\n❤️ -${dmg}`; }
    u.pendingFight = null; saveDB();
    const text = `⚔️ ${enemy.n}\n${txt}`;
    try { await ctx.editMessageText(text, backBtn('fight_menu')); } catch (e) { await ctx.reply(text, backBtn('fight_menu')); }
});

// ==================== 🏟️ PvP فوق پیشرفته ====================
bot.action('m_pvp', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.jailUntil && Date.now() < u.jailUntil) {
        const text = `⛓️ «در سیاه‌چال»\n${formatTime(u.jailUntil - Date.now())} دیگر`;
        try { await ctx.editMessageText(text, backBtn('main')); } catch (e) { await ctx.reply(text, backBtn('main')); }
        return;
    }
    const l = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    const total = (u.pvpWins || 0) + (u.pvpLosses || 0);
    const text = `🏟️ «میدان پهلوانی»\n━━━━━━━━━━━━\n🏆 ${l.n} | ⭐${u.pvpRating}\n📊 ${total} نبرد\n✅ ${u.pvpWins} | ❌ ${u.pvpLosses}\n🔥 پیاپی: ${u.pvpStreak || 0}\n\n🎯 /pvp [آیدی]\n💰 /pvp_bet [آیدی] [مبلغ]`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ نبرد سریع', 'pvp_quick')],
        [Markup.button.callback('🏆 لیگ‌ها', 'pvp_league')],
        [Markup.button.callback('📜 تاریخچه', 'pvp_history')],
        [Markup.button.callback('🏅 برترین‌ها', 'pvp_leaderboard')],
        [Markup.button.callback('🔙 بازگشت', 'back_pvp')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('pvp_quick', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return;
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    const enemies = Object.values(db.users).filter(e => e.id !== u.id && (e.hp || 100) > 0);
    if (!enemies.length) return ctx.answerCbQuery('❌ حریفی نیست');
    const enemy = enemies[rand(0, enemies.length - 1)];
    const myWeapons = Object.entries(u.wOwned || {}).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 3);
    if (!myWeapons.length) return ctx.answerCbQuery('❌ سلاحی نداری');
    u.pendingPvP = { eid: enemy.id, ename: enemy.name, myWeapons };
    setCD(u, 'pvp'); saveDB();
    const wbtns = myWeapons.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sel_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
    wbtns.push([Markup.button.callback('🔙 بازگشت', 'back_pvp')]);
    const text = `⚔️ نبرد با ${enemy.name}\n👤 لول ${enemy.level || 1}\n\n🗡️ سلاح برگزین:`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(wbtns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(wbtns)); }
});

bot.action(/pvp_sel_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const wk = ctx.match[1];
    const u = getUser(ctx.from.id);
    if (!u.pendingPvP) return ctx.answerCbQuery('❌');
    u.pendingPvP.sw = wk; saveDB();
    const w = WEAPONS[wk];
    const enemy = db.users[u.pendingPvP.eid];
    if (!enemy) return ctx.answerCbQuery('❌');
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const ea = ARMORS[enemy.armor] || ARMORS.none;
    const mp = u.power + w.p; const ep = (enemy.power || 5) + ew.p;
    const ch = clamp(50 + (mp - ep) * 3, 10, 90);
    const text = `⚔️ تاختن به ${enemy.name}\n━━━━━━━━━━━━\n🗡️ تو: ${w.n} (⚡${w.p})\n🛡️ تو: ${a.n}\n⚡ قدرت: ${mp}\n\n👤 حریف: ${enemy.name}\n🗡️ حریف: ${ew.n}\n🛡️ حریف: ${ea.n}\n⚡ قدرت: ${ep}\n\n🎲 شانس: ${ch}%\n🏠 تخریب: ${Math.floor(ch*0.3)}%\n📦 تاراج: ${Math.floor(ch*0.4)}%`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ تاختن!', 'pvp_go')],
        [Markup.button.callback('🏃 گریختن', 'back_pvp')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('pvp_go', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.pendingPvP || !u.pendingPvP.sw) return;
    const { eid, sw } = u.pendingPvP; u.pendingPvP = null;
    const enemy = db.users[eid]; if (!enemy) return;
    const w = WEAPONS[sw] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const ea = ARMORS[enemy.armor] || ARMORS.none;
    const dogB = u.pet === 'dog' ? 5 : 0;
    const enchB = u.weaponEnchant === '🔥 آتشین' ? 5 : 0;
    const mp = u.power + w.p + rand(0, 10) + enchB;
    const ep = (enemy.power || 5) + ew.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(50 + (mp - ep) * 3, 10, 90);
    const raw = rand(15, 40);
    const md = Math.max(5, raw - a.d - dogB);
    const ed = Math.max(5, raw - ea.d);
    let at, dt;
    if (win) {
        const gr = rand(30, 80); u.gold += gr; addXP(u, 20);
        u.pvpWins = (u.pvpWins || 0) + 1; enemy.pvpLosses = (enemy.pvpLosses || 0) + 1;
        u.pvpRating = (u.pvpRating || 0) + rand(20, 30); enemy.pvpRating = Math.max(0, (enemy.pvpRating || 0) - rand(10, 20));
        u.pvpStreak = (u.pvpStreak || 0) + 1; enemy.pvpStreak = 0;
        u.honorPoints = (u.honorPoints || 0) + rand(5, 15);
        updateLeague(u); updateLeague(enemy); progressQuest(u, 'pvp_win');
        u.hp = Math.max(0, u.hp - Math.floor(ed * 0.3)); enemy.hp = Math.max(0, (enemy.hp || 100) - ed);
        if (!u.pvpHistory) u.pvpHistory = []; u.pvpHistory.push({ enemy: enemy.name, win: true, time: Date.now() });
        const taunt = TAUNTS[rand(0, TAUNTS.length - 1)];
        at = `👑 پیروزی!\n${taunt}\n━━━━━━━━━━━━\n🗡️ ${w.n}\n❤️ -${Math.floor(ed*0.3)}\n🥇 +${gr}\n⭐ +${rand(20,30)}\n🔥 ${u.pvpStreak}\n❤️ ${u.hp}/${u.maxHp}\n🏆 ${PVP_LEAGUES[u.pvpLeague||'bronze'].n}`;
        dt = `⚔️ ${u.name} به تو تاخت!\n❌ شکست!\n❤️ -${ed}\n❤️ ${enemy.hp}/${enemy.maxHp||100}`;
    } else {
        u.pvpLosses = (u.pvpLosses || 0) + 1; enemy.pvpWins = (enemy.pvpWins || 0) + 1;
        u.pvpRating = Math.max(0, (u.pvpRating || 0) - rand(10, 20)); enemy.pvpRating = (enemy.pvpRating || 0) + rand(15, 25);
        u.pvpStreak = Math.min(0, (u.pvpStreak || 0) - 1); enemy.pvpStreak = (enemy.pvpStreak || 0) + 1;
        updateLeague(u); updateLeague(enemy);
        u.hp = Math.max(0, u.hp - md); enemy.hp = Math.max(0, (enemy.hp || 100) - Math.floor(ed * 0.3));
        if (!u.pvpHistory) u.pvpHistory = []; u.pvpHistory.push({ enemy: enemy.name, win: false, time: Date.now() });
        at = `💀 شکست!\n━━━━━━━━━━━━\n❤️ -${md}\n⭐ -${rand(10,20)}\n❤️ ${u.hp}/${u.maxHp}`;
        dt = `⚔️ ${u.name} به تو تاخت!\n✅ دفاع!\n❤️ -${Math.floor(ed*0.3)}\n❤️ ${enemy.hp}/${enemy.maxHp||100}`;
    }
    u.loyalty = (u.loyalty || 0) + 1; saveDB();
    try { await bot.telegram.sendMessage(eid, dt, Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙', 'm_main')]])); } catch (e) {}
    try { await ctx.editMessageText(at, backBtn('pvp')); } catch (e) { await ctx.reply(at, backBtn('pvp')); }
});

bot.action(/pvp_rev_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const tid = ctx.match[1]; const u = getUser(ctx.from.id);
    if (u.hp <= 0) return;
    const enemy = db.users[tid]; if (!enemy) return;
    const myWeapons = Object.entries(u.wOwned || {}).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 3);
    if (!myWeapons.length) return;
    u.pendingPvP = { eid: tid, ename: enemy.name, myWeapons }; setCD(u, 'pvp'); saveDB();
    const wbtns = myWeapons.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sel_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
    wbtns.push([Markup.button.callback('🔙', 'back_pvp')]);
    await ctx.reply(`⚔️ انتقام از ${enemy.name}!\n\n🗡️ سلاح:`, Markup.inlineKeyboard(wbtns));
});

bot.action('pvp_league', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const list = Object.entries(PVP_LEAGUES).map(([k, l]) => `${l.n}${u.pvpLeague === k ? ' ✅' : ''}: ${l.min}+`).join('\n');
    const text = `🏆 لیگ‌ها\n\n${list}`;
    try { await ctx.editMessageText(text, backBtn('pvp')); } catch (e) { await ctx.reply(text, backBtn('pvp')); }
});

bot.action('pvp_history', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const h = u.pvpHistory || [];
    if (!h.length) return ctx.answerCbQuery('📜 خالی');
    const text = ['📜 تاریخچه:\n', ...h.slice(-10).reverse().map((b, i) => `${i + 1}. ${b.win ? '✅' : '❌'} vs ${b.enemy}`)].join('\n');
    try { await ctx.editMessageText(text, backBtn('pvp')); } catch (e) { await ctx.reply(text, backBtn('pvp')); }
});

bot.action('pvp_leaderboard', async (ctx) => {
    await ctx.answerCbQuery();
    const us = Object.values(db.users).filter(u => (u.pvpRating || 0) > 0).sort((a, b) => (b.pvpRating || 0) - (a.pvpRating || 0)).slice(0, 10);
    if (!us.length) return ctx.answerCbQuery('❌');
    const text = ['🏅 برترین‌ها:\n', ...us.map((u, i) => `${i + 1}. ${u.name || '?'} | ${PVP_LEAGUES[u.pvpLeague || 'bronze'].n} | ⭐${u.pvpRating}`)].join('\n');
    try { await ctx.editMessageText(text, backBtn('pvp')); } catch (e) { await ctx.reply(text, backBtn('pvp')); }
});

bot.command('pvp', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.trim().split(/\s+/);
    const tid = args[1];
    if (!tid) return ctx.reply('🎯 /pvp [آیدی]');
    if (tid === u.id) return ctx.reply('❌');
    const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌');
    const myWeapons = Object.entries(u.wOwned || {}).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 3);
    if (!myWeapons.length) return ctx.reply('❌');
    u.pendingPvP = { eid: tid, ename: enemy.name, myWeapons }; setCD(u, 'pvp'); saveDB();
    const wbtns = myWeapons.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sel_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
    wbtns.push([Markup.button.callback('🔙', 'back_pvp')]);
    await ctx.reply(`⚔️ ${enemy.name}\n\n🗡️ سلاح:`, Markup.inlineKeyboard(wbtns));
});

bot.command('pvp_bet', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.trim().split(/\s+/);
    const tid = args[1]; const bet = Number(args[2] || 0);
    if (!tid || !bet) return ctx.reply('💰 /pvp_bet [آیدی] [مبلغ]');
    if (bet < 50) return ctx.reply('❌ حداقل ۵۰ زر');
    if (bet > u.gold) return ctx.reply('❌');
    const enemy = db.users[tid]; if (!enemy) return ctx.reply('❌');
    const myWeapons = Object.entries(u.wOwned || {}).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p).slice(0, 3);
    if (!myWeapons.length) return ctx.reply('❌');
    u.pendingPvP = { eid: tid, ename: enemy.name, myWeapons, betAmount: bet, isBet: true }; setCD(u, 'pvp'); saveDB();
    const wbtns = myWeapons.map(w => [Markup.button.callback(`${w.n} (⚡${w.p})`, `pvp_sel_${Object.keys(WEAPONS).find(k => WEAPONS[k] === w)}`)]);
    wbtns.push([Markup.button.callback('🔙', 'back_pvp')]);
    await ctx.reply(`🎯 شرط: ${bet} زر\n👤 ${enemy.name}\n\n🗡️ سلاح:`, Markup.inlineKeyboard(wbtns));
});

bot.command('pvp_stats', async (ctx) => {
    const u = getUser(ctx.from.id);
    const total = (u.pvpWins || 0) + (u.pvpLosses || 0);
    await ctx.reply(`📊 ${u.name}\n🏆 ${PVP_LEAGUES[u.pvpLeague || 'bronze'].n}\n⭐${u.pvpRating}\n🏅${u.honorPoints}\n📊${total} | ✅${u.pvpWins} ❌${u.pvpLosses}\n🔥${u.pvpStreak || 0}`);
});

bot.command('pvp_rating', async (ctx) => {
    const us = Object.values(db.users).filter(u => (u.pvpRating || 0) > 0).sort((a, b) => (b.pvpRating || 0) - (a.pvpRating || 0)).slice(0, 20);
    if (!us.length) return ctx.reply('❌');
    await ctx.reply(us.map((u, i) => `${i + 1}. ${u.name || '?'} | ${PVP_LEAGUES[u.pvpLeague || 'bronze'].n} | ⭐${u.pvpRating}`).join('\n'));
});

bot.command('pvp_top', async (ctx) => {
    const us = Object.values(db.users).filter(u => (u.pvpWins || 0) > 0).sort((a, b) => (b.pvpWins || 0) - (a.pvpWins || 0)).slice(0, 10);
    if (!us.length) return ctx.reply('❌');
    let t = '🏆:\n\n'; us.forEach((u, i) => t += `${i + 1}. ${u.name || '?'} | 🏆${u.pvpWins} | 💀${u.pvpLosses}\n`);
    await ctx.reply(t);
});

console.log('✅ بخش ۲ از ۳ - مبارزه و PvP بارگذاری شد');

// ==================== 🏠 پایگاه ====================
bot.action('m_base', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🏠 «پایگاه»\n━━━━━━━━━━━━';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🏠 خانه', 'm_home'), Markup.button.callback('🏥 درمانگاه', 'm_heal')],
        [Markup.button.callback('🏦 بانک', 'm_bank'), Markup.button.callback('🏰 قبیله', 'm_clan')],
        [Markup.button.callback('🔙 بازگشت', 'back_base')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('m_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    let up = '🏆 به اوج';
    if (next) up = `⬆️ ${u.homeLvl + 1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nلول: ${next.nl}`;
    const text = `🏠 خانه لول ${u.homeLvl}\n${up}\n/upgrade_home`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⬆️ ارتقا', 'up_home')],
        [Markup.button.callback('🔙 بازگشت', 'back_home')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('up_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    if (!next) return ctx.answerCbQuery('🏆');
    if (u.level < next.nl) return ctx.answerCbQuery(`❌ لول ${next.nl}`);
    if (!hasRes(u, next)) return ctx.answerCbQuery('❌');
    takeRes(u, next); u.homeLvl++;
    if (u.homeLvl >= 3) u.clinicLvl = 2;
    if (u.homeLvl >= 5) u.clinicLvl = 3;
    saveDB();
    const text = `✅ خانه لول ${u.homeLvl}!`;
    try { await ctx.editMessageText(text, backBtn('home')); } catch (e) { await ctx.reply(text, backBtn('home')); }
});

bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.clinicLvl) u.clinicLvl = 1;
    const amt = 20 + u.clinicLvl * 10;
    const text = `🏥 درمانگاه\n❤️ ${u.hp}/${u.maxHp}\n💊 رایگان: ${u.daily.fh ? '❌' : '✅'} (+${amt})\n💰 کامل: ۲۰ زر`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🆓 رایگان', 'hl_free'), Markup.button.callback('💰 کامل', 'hl_gold')],
        [Markup.button.callback('🔙 بازگشت', 'back_heal')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('hl_free', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.daily.fh) return ctx.answerCbQuery('❌');
    const amt = 20 + (u.clinicLvl || 1) * 10;
    u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB();
    const text = `✅ +${amt}\n❤️ ${u.hp}/${u.maxHp}`;
    try { await ctx.editMessageText(text, backBtn('heal')); } catch (e) { await ctx.reply(text, backBtn('heal')); }
});

bot.action('hl_gold', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.gold < 20) return ctx.answerCbQuery('❌ ۲۰ زر');
    u.gold -= 20; u.hp = u.maxHp; saveDB();
    const text = `✅ درمان\n❤️ ${u.hp}/${u.maxHp}`;
    try { await ctx.editMessageText(text, backBtn('heal')); } catch (e) { await ctx.reply(text, backBtn('heal')); }
});

bot.action('m_bank', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🏦 بانک\n💰 ${u.bankGold} زر\n📝 /deposit [مبلغ]\n📝 /withdraw [مبلغ]`;
    try { await ctx.editMessageText(text, backBtn('bank')); } catch (e) { await ctx.reply(text, backBtn('bank')); }
});

bot.action('m_clan', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.clan) {
        const text = '🏰 قبیله\n📝 /create_clan [اسم]\n📝 /join_clan [اسم]\n📝 /clans';
        try { await ctx.editMessageText(text, backBtn('clan')); } catch (e) { await ctx.reply(text, backBtn('clan')); }
        return;
    }
    const cl = db.clans[u.clan];
    if (!cl) { u.clan = null; saveDB(); return; }
    const m = cl.members.map(mid => db.users[mid]?.name || mid).join('، ');
    const text = `🏰 ${cl.name}\n👑 ${db.users[cl.owner]?.name}\n👥 ${m}\n💰 ${cl.treasury || 0}\n📝 /donate gold [مقدار]\n📝 /leave_clan`;
    try { await ctx.editMessageText(text, backBtn('clan')); } catch (e) { await ctx.reply(text, backBtn('clan')); }
});

// ==================== 🛒 بازار ====================
bot.action('m_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🛒 بازار';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('📦 خرید', 'sh_res'), Markup.button.callback('💰 فروش', 'sh_sell')],
        [Markup.button.callback('🔙 بازگشت', 'back_shop')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('sh_res', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '📦 🪵۸ 🪨۱۰ 🔩۱۸ ⛓️۲۵\n🍞۱۰ 🍖۲۵ 💧۸\n📝 /buy [کالا] [تعداد]';
    try { await ctx.editMessageText(text, backBtn('shop')); } catch (e) { await ctx.reply(text, backBtn('shop')); }
});

bot.action('sh_sell', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    let t = '💰 فروش:\n';
    for (const [k, v] of Object.entries(u.res || {})) { if (v > 0 && k !== 'gold') t += `${RES[k]} ${k}: ${v}\n`; }
    t += '📝 /sell [کالا] [تعداد]';
    try { await ctx.editMessageText(t, backBtn('shop')); } catch (e) { await ctx.reply(t, backBtn('shop')); }
});

// ==================== 🏪 تجهیزات ====================
bot.action('m_equip', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🏪 «تجهیزات»';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🛠️ اسلحه', 'm_armory'), Markup.button.callback('🛡️ زره', 'm_armor_shop')],
        [Markup.button.callback('⭐ مهارت', 'm_skills')],
        [Markup.button.callback('🔙 بازگشت', 'back_equip')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('m_armory', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const btns = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => [Markup.button.callback(`${u.wOwned[k] ? '✅' : '🔨'} ${w.n}${u.weapon === k ? '⚔️' : ''}`, u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`)]);
    btns.push([Markup.button.callback('🔥 ارتقا', 'enchant_w')], [Markup.button.callback('🔙 بازگشت', 'back_armory')]);
    const text = `🛠️ اسلحه‌خانه\nفعلی: ${WEAPONS[u.weapon]?.n || 'ندارد'}`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/cr_w_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); const w = WEAPONS[k]; if (!w) return; if (u.level < w.lvl) return ctx.answerCbQuery(`❌ لول ${w.lvl}`); if (u.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} زر`); u.gold -= w.price; u.wOwned[k] = true; saveDB(); await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`); });
bot.action(/eq_w_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); if (!u.wOwned[k]) return; u.weapon = k; saveDB(); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n}`); });
bot.action('enchant_w', async (ctx) => { await ctx.answerCbQuery(); const text = '🔥 ارتقا (۵۰۰ زر)\n🔥 آتشین: +۵\n❄️ یخی: کندی\n💀 زهر: تدریجی\n📝 /enchant [fire|ice|poison]'; try { await ctx.editMessageText(text, backBtn('armory')); } catch (e) { await ctx.reply(text, backBtn('armory')); } });

bot.action('m_armor_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const btns = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => [Markup.button.callback(`${u.aOwned[k] ? '✅' : '🔨'} ${a.n}${u.armor === k ? '🛡️' : ''}`, u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`)]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_armor_shop')]);
    const text = `🛡️ زره‌خانه\nفعلی: ${ARMORS[u.armor]?.n || 'ندارد'}`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/cr_a_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); const a = ARMORS[k]; if (!a) return; if (u.level < a.lvl) return ctx.answerCbQuery(`❌ لول ${a.lvl}`); if (u.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} زر`); u.gold -= a.price; u.aOwned[k] = true; saveDB(); await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`); });
bot.action(/eq_a_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); if (!u.aOwned[k]) return; u.armor = k; saveDB(); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n}`); });

bot.action('m_skills', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `⭐ مهارت | ${u.sp} امتیاز\n⛏️ ${u.skills.g}/10 | 🏹 ${u.skills.h}/10\n🔨 ${u.skills.c}/10 | 🏕️ ${u.skills.s}/10\n📝 /skill <g|h|c|s>`;
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('⛏️', 'sk_g'), Markup.button.callback('🏹', 'sk_h')],
        [Markup.button.callback('🔨', 'sk_c'), Markup.button.callback('🏕️', 'sk_s')],
        [Markup.button.callback('🔙', 'back_skills')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action(/sk_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); if (!u.sp) return; if ((u.skills[k] || 0) >= 10) return; u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB(); await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`); });

// ==================== 🎭 امکانات ====================
bot.action('m_facilities', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🎭 «امکانات»';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🕯️ آتشکده', 'm_pray'), Markup.button.callback('🍽️ غذا', 'm_eat')],
        [Markup.button.callback('👤 بزرگان', 'm_npc'), Markup.button.callback('🐎 حیوان', 'm_pet')],
        [Markup.button.callback('📋 مأموریت', 'm_quest'), Markup.button.callback('🏆 دستاورد', 'm_achieve')],
        [Markup.button.callback('🔙 بازگشت', 'back_facilities')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action('m_pray', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🕯️ آتشکده';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
        [Markup.button.callback('📖 روضه', 'p_rozeh')],
        [Markup.button.callback('🔙 بازگشت', 'back_pray')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action(['p_dua', 'p_namaz', 'p_rozeh'], async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'pray', CD.pray);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    setCD(u, 'pray'); const xp = u.level <= 3 ? 60 : 30; addXP(u, xp);
    if (ctx.match[0] === 'p_namaz') u.gold += 30;
    if (ctx.match[0] === 'p_rozeh') { u.loyalty = (u.loyalty || 0) + 8; u.shahnamehCount = (u.shahnamehCount || 0) + 1; }
    u.loyalty = (u.loyalty || 0) + 3; progressQuest(u, 'pray'); saveDB();
    const names = { p_dua: 'دعا', p_namaz: 'نماز', p_rozeh: 'روضه' };
    const text = `✅ ${names[ctx.match[0]]} قبول!\n✨ +${xp}`;
    try { await ctx.editMessageText(text, backBtn('pray')); } catch (e) { await ctx.reply(text, backBtn('pray')); }
});

bot.action('m_eat', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🍽️ سفره';
    const btns = Markup.inlineKeyboard([
        [Markup.button.callback('🍞', 'e_bread'), Markup.button.callback('🍖', 'e_meat'), Markup.button.callback('🐟', 'e_fish')],
        [Markup.button.callback('🍗', 'e_chicken'), Markup.button.callback('🥩', 'e_steak'), Markup.button.callback('🥘', 'e_stew')],
        [Markup.button.callback('🍜', 'e_noodle'), Markup.button.callback('🍰', 'e_cake'), Markup.button.callback('🍯', 'e_honey')],
        [Markup.button.callback('💧', 'd_water'), Markup.button.callback('🧃', 'd_juice'), Markup.button.callback('🍺', 'd_soda')],
        [Markup.button.callback('🍵', 'd_tea'), Markup.button.callback('☕', 'd_coffee'), Markup.button.callback('🥛', 'd_milk')],
        [Markup.button.callback('🔙', 'back_eat')],
    ]);
    try { await ctx.editMessageText(text, btns); } catch (e) { await ctx.reply(text, btns); }
});

bot.action(/e_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); if ((u.items[k] || 0) < 1) return; const f = FOODS[k]; if (!f) return; addItem(u, k, -1); if (f.h) u.hunger = Math.min(u.maxHp, (u.hunger || 100) + f.h); if (f.heal) u.hp = Math.min(u.maxHp, u.hp + f.heal); saveDB(); await ctx.answerCbQuery(`✅ ${f.n}`); });
bot.action(/d_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const u = getUser(ctx.from.id); if ((u.items[k] || 0) < 1) return; const d = DRINKS[k]; if (!d) return; addItem(u, k, -1); if (d.t) u.thirst = Math.min(u.maxHp, (u.thirst || 100) + d.t); if (d.xp) addXP(u, d.xp); saveDB(); await ctx.answerCbQuery(`✅ ${d.n}`); });

bot.action('m_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'npc', CD.npc);
    const btns = Object.entries(NPCS).map(([k, n]) => [Markup.button.callback(`${n.n}: ${n.price} زر`, `npc_${k}`)]);
    btns.push([Markup.button.callback('🔙', 'back_npc')]);
    const text = `👤 بزرگان\n${cd.can ? '✅' : '⏳ ' + formatTime(cd.rem)}`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/npc_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const npc = NPCS[k]; const u = getUser(ctx.from.id); if (!npc) return; if (!checkCD(u, 'npc', CD.npc).can) return ctx.answerCbQuery(`⏳`); if (u.gold < npc.price) return ctx.answerCbQuery(`❌ ${npc.price} زر`); u.gold -= npc.price; const r = npc.f(u); setCD(u, 'npc'); saveDB(); const text = `👤 ${npc.n}\n${r}`; try { await ctx.editMessageText(text, backBtn('npc')); } catch (e) { await ctx.reply(text, backBtn('npc')); } });

bot.action('m_pet', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cur = u.pet ? PETS[u.pet]?.n : 'نداری';
    const btns = Object.entries(PETS).map(([k, p]) => [Markup.button.callback(`${p.n}: ${p.price} زر`, `buy_pet_${k}`)]);
    btns.push([Markup.button.callback('🔙', 'back_pet')]);
    const text = `🐎 حیوانات\nفعلی: ${cur}`;
    try { await ctx.editMessageText(text, Markup.inlineKeyboard(btns)); } catch (e) { await ctx.reply(text, Markup.inlineKeyboard(btns)); }
});

bot.action(/buy_pet_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const k = ctx.match[1]; const pet = PETS[k]; const u = getUser(ctx.from.id); if (!pet) return; if (u.pet) return ctx.answerCbQuery('❌'); if (u.gold < pet.price) return ctx.answerCbQuery(`❌ ${pet.price} زر`); u.gold -= pet.price; u.pet = k; saveDB(); const text = `🐎 ${pet.n} همراه شد!`; try { await ctx.editMessageText(text, backBtn('pet')); } catch (e) { await ctx.reply(text, backBtn('pet')); } });

bot.action('m_quest', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.quests.length) rollQuests(u);
    const t = ['📋 مأموریت‌ها:\n'];
    u.quests.forEach(q => { const p = u.questProgress[q.t] || 0; t.push(`${p >= q.g ? '✅' : '⏳'} ${q.n}: ${p}/${q.g}`); });
    t.push('\n📝 /claim_quests');
    const text = t.join('\n');
    try { await ctx.editMessageText(text, backBtn('quest')); } catch (e) { await ctx.reply(text, backBtn('quest')); }
});

bot.action('m_achieve', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    let t = '🏆 دستاوردها:\n'; let c = 0;
    [{ id: 'fb', n: '🩸 اولین خون', d: '۱ برد', ch: u => (u.stats.fw || 0) + (u.stats.dw || 0) >= 1 }, { id: 'wr', n: '⚔️ جنگجو', d: '۱۰ برد', ch: u => (u.stats.fw || 0) + (u.stats.dw || 0) >= 10 }, { id: 'rc', n: '💰 خزانه‌دار', d: '۱۰۰۰۰ طلا', ch: u => u.gold >= 10000 }, { id: 'bl', n: '🏠 معمار', d: 'خانه لول ۵', ch: u => u.homeLvl >= 5 }, { id: 'sr', n: '📚 شاعر', d: '۲۰ شعر', ch: u => (u.shahnamehCount || 0) >= 20 }].forEach(a => { const e = u.achievements.includes(a.id); if (e) c++; t += `${e ? '✅' : '🔒'} ${a.n}: ${a.d}\n`; if (!e && a.ch(u)) { u.achievements.push(a.id); t += '🎉 نو!\n'; } });
    t += `\n📊 ${c}/۵`; saveDB();
    const text = t;
    try { await ctx.editMessageText(text, backBtn('achieve')); } catch (e) { await ctx.reply(text, backBtn('achieve')); }
});

// ==================== 📚 کتابخانه پیشرفته ====================
bot.action('m_library', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = '📚 «گنجینه پارس»\n━━━━━━━━━━━━\nکتابی برگزین تا از حکمتش بهره ببری:';
    const btns = [
        ...Object.entries(LIBRARY).map(([k, v]) => [Markup.button.callback(`${v.name} - ${v.poet}`, `lib_${k}`)]),
        [Markup.button.callback('🔙 بازگشت', 'back_library')],
    ];
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
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
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

// ==================== 🎁 سایر ====================
bot.action('m_other', async (ctx) => {
    await ctx.answerCbQuery();
    const text = '🎁 «سایر»';
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
    if (u.lastBox && now - u.lastBox < CD.box) return ctx.answerCbQuery(`⏳ ${formatTime(CD.box - (now - u.lastBox))}`);
    u.lastBox = now;
    const loot = BOX_LOOT[rand(0, BOX_LOOT.length - 1)];
    loot.f(u); saveDB();
    const text = `🎁 صندوقچه!\n${loot.n}`;
    try { await ctx.editMessageText(text, backBtn('box')); } catch (e) { await ctx.reply(text, backBtn('box')); }
});

bot.action('m_guide', async (ctx) => {
    await ctx.answerCbQuery();
    const text = `📖 راهنما\n🌲 ${formatTime(CD.gather)}\n⚔️ ${formatTime(CD.fight)}\n🏟️ ${formatTime(CD.pvp)}\n🕯️ ${formatTime(CD.pray)}\n🎁 ${formatTime(CD.box)}\n📚 ${formatTime(CD.library)}\n👤 ${formatTime(CD.npc)}`;
    try { await ctx.editMessageText(text, backBtn('guide')); } catch (e) { await ctx.reply(text, backBtn('guide')); }
});

bot.action('m_cd', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const acts = [['gather','🌲',CD.gather],['fight','⚔️',CD.fight],['pvp','🏟️',CD.pvp],['pray','🕯️',CD.pray],['box','🎁',CD.box],['daily','🎁',CD.daily],['library','📚',CD.library],['npc','👤',CD.npc]];
    const lines = ['⏱️:\n'];
    for (const [k, n, cd] of acts) { const c = checkCD(u, k, cd); lines.push(`${n}: ${c.can ? '✅' : '⏳ ' + formatTime(c.rem)}`); }
    const text = lines.join('\n');
    try { await ctx.editMessageText(text, backBtn('cd')); } catch (e) { await ctx.reply(text, backBtn('cd')); }
});

// ==================== 📝 کامندهای متنی ====================
bot.command('daily', async (ctx) => { const u = getUser(ctx.from.id); const cd = checkCD(u, 'daily', CD.daily); if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`); setCD(u, 'daily'); const r = { gold: rand(50, 150), xp: rand(10, 30) }; giveReward(u, r); u.loyalty = (u.loyalty || 0) + 10; addXP(u, r.xp || 0); saveDB(); await ctx.reply(`🎁 ${rwText(r)}\n⭐ +۱۰`); });
bot.command('buy', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const amt = Number(args[2] || 1); const prices = { wood: 8, stone: 10, metal: 18, iron: 25, bread: 10, meat: 25, water: 8 }; if (!prices[k]) return ctx.reply('❌'); const total = prices[k] * amt; if (u.gold < total) return ctx.reply(`❌ ${total} زر`); u.gold -= total; if (['wood', 'stone', 'metal', 'iron'].includes(k)) addRes(u, k, amt); else addItem(u, k, amt); saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.gold}`); });
bot.command('sell', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const amt = Number(args[2] || 1); const prices = { wood: 4, stone: 5, metal: 9, iron: 12, bread: 5, meat: 12, water: 4 }; if (!prices[k]) return ctx.reply('❌'); if ((u.res[k] || 0) < amt && (u.items[k] || 0) < amt) return ctx.reply('❌'); if (u.res[k] >= amt) { addRes(u, k, -amt); u.gold += prices[k] * amt; } else { addItem(u, k, -amt); u.gold += prices[k] * amt; } saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.gold}`); });
bot.command('craft', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const w = WEAPONS[k]; if (!w || k === 'none') return ctx.reply('❌'); if (u.level < w.lvl) return ctx.reply(`❌ لول ${w.lvl}`); if (u.gold < w.price) return ctx.reply(`❌ ${w.price} زر`); u.gold -= w.price; u.wOwned[k] = true; saveDB(); await ctx.reply(`✅ ${w.n}`); });
bot.command('craft_armor', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const a = ARMORS[k]; if (!a || k === 'none') return ctx.reply('❌'); if (u.level < a.lvl) return ctx.reply(`❌ لول ${a.lvl}`); if (u.gold < a.price) return ctx.reply(`❌ ${a.price} زر`); u.gold -= a.price; u.aOwned[k] = true; saveDB(); await ctx.reply(`✅ ${a.n}`); });
bot.command('equip', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; if (!u.wOwned[k]) return ctx.reply('❌'); u.weapon = k; saveDB(); await ctx.reply(`⚔️ ${WEAPONS[k].n}`); });
bot.command('enchant', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const t = args[1]; if (!['fire', 'ice', 'poison'].includes(t)) return ctx.reply('❌'); if (u.weapon === 'none') return ctx.reply('❌'); if (u.weaponEnchant) return ctx.reply('❌'); if (u.gold < 500) return ctx.reply('❌ ۵۰۰ زر'); u.gold -= 500; u.weaponEnchant = { fire: '🔥 آتشین', ice: '❄️ یخی', poison: '💀 زهر' }[t]; saveDB(); await ctx.reply(`✅ ${u.weaponEnchant}!`); });
bot.command('heal', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); if (args[1] === 'free') { if (u.daily.fh) return ctx.reply('❌'); const amt = 20 + (u.clinicLvl || 1) * 10; u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB(); return ctx.reply(`✅ +${amt}`); } if (args[1] === 'gold') { if (u.gold < 20) return ctx.reply('❌'); u.gold -= 20; u.hp = u.maxHp; saveDB(); return ctx.reply('✅'); } });
bot.command('skill', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; if (!['g', 'h', 'c', 's'].includes(k)) return ctx.reply('❌'); if (!u.sp) return ctx.reply('❌'); if ((u.skills[k] || 0) >= 10) return ctx.reply('❌'); u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB(); await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`); });
bot.command('upgrade_home', async (ctx) => { const u = getUser(ctx.from.id); const next = HOME_UP[u.homeLvl + 1]; if (!next) return ctx.reply('🏆'); if (u.level < next.nl) return ctx.reply(`❌ لول ${next.nl}`); if (!hasRes(u, next)) return ctx.reply('❌'); takeRes(u, next); u.homeLvl++; if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3; saveDB(); await ctx.reply(`✅ ${u.homeLvl}!`); });
bot.command('deposit', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const a = Number(args[1] || 0); if (!a || a <= 0) return ctx.reply('❌'); if (u.gold < a) return ctx.reply('❌'); u.gold -= a; u.bankGold = (u.bankGold || 0) + a; saveDB(); await ctx.reply(`✅ ${a} زر\n🏦 ${u.bankGold}`); });
bot.command('withdraw', async (ctx) => { const u = getUser(ctx.from.id); const args = ctx.message.text.trim().split(/\s+/); const a = Number(args[1] || 0); if (!a || a <= 0) return ctx.reply('❌'); if ((u.bankGold || 0) < a) return ctx.reply('❌'); u.bankGold -= a; u.gold += a; saveDB(); await ctx.reply(`✅ ${a} زر\n💰 ${u.gold}`); });
bot.command('create_clan', async (ctx) => { const u = getUser(ctx.from.id); if (u.clan) return ctx.reply('❌'); if (u.gold < 1000) return ctx.reply('❌ ۱۰۰۰ زر'); const args = ctx.message.text.trim().split(/\s+/); const n = args.slice(1).join(' '); if (!n) return ctx.reply('/create_clan [اسم]'); if (Object.values(db.clans).some(c => c.name === n)) return ctx.reply('❌'); const id = 'c' + Date.now(); db.clans[id] = { id, name: n, owner: u.id, members: [u.id], treasury: 0 }; u.clan = id; u.gold -= 1000; saveDB(); await ctx.reply(`✅ ${n} ساخته شد!`); });
bot.command('join_clan', async (ctx) => { const u = getUser(ctx.from.id); if (u.clan) return ctx.reply('❌'); const args = ctx.message.text.trim().split(/\s+/); const n = args.slice(1).join(' '); if (!n) return ctx.reply('/join_clan [اسم]'); const cl = Object.values(db.clans).find(c => c.name === n); if (!cl) return ctx.reply('❌'); cl.members.push(u.id); u.clan = cl.id; saveDB(); await ctx.reply(`✅ به ${n} پیوستی!`); });
bot.command('leave_clan', async (ctx) => { const u = getUser(ctx.from.id); if (!u.clan) return ctx.reply('❌'); const cl = db.clans[u.clan]; if (cl) { cl.members = cl.members.filter(m => m !== u.id); if (cl.members.length === 0) delete db.clans[u.clan]; else if (cl.owner === u.id) cl.owner = cl.members[0]; } u.clan = null; saveDB(); await ctx.reply('✅'); });
bot.command('donate', async (ctx) => { const u = getUser(ctx.from.id); if (!u.clan) return ctx.reply('❌'); const args = ctx.message.text.trim().split(/\s+/); if (args[1] === 'gold' && Number(args[2]) > 0 && u.gold >= Number(args[2])) { const a = Number(args[2]); u.gold -= a; db.clans[u.clan].treasury = (db.clans[u.clan].treasury || 0) + a; saveDB(); await ctx.reply(`✅ ${a} زر`); } else await ctx.reply('❌ /donate gold [مقدار]'); });
bot.command('clans', async (ctx) => { const cls = Object.values(db.clans); if (!cls.length) return ctx.reply('❌'); await ctx.reply(cls.map(c => `${c.name}: ${c.members.length} عضو | ${c.treasury || 0} زر`).join('\n')); });
bot.command('claim_quests', async (ctx) => { const u = getUser(ctx.from.id); let c = false; for (const q of u.quests) { if ((u.questProgress[q.t] || 0) >= q.g && !q.claimed) { giveReward(u, q.rew); if (q.rew.xp) addXP(u, q.rew.xp); q.claimed = true; c = true; } } if (!c) return ctx.reply('❌'); saveDB(); await ctx.reply('✅'); });
bot.command('top_loyalty', async (ctx) => { const us = Object.values(db.users).filter(u => (u.loyalty || 0) > 0).sort((a, b) => (b.loyalty || 0) - (a.loyalty || 0)).slice(0, 10); if (!us.length) return ctx.reply('❌'); await ctx.reply(us.map((u, i) => `${i + 1}. ${u.name || '?'} | ⭐${u.loyalty}`).join('\n')); });

// ==================== 👑 ادمین فوق پیشرفته ====================
bot.command('users', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const total = Object.keys(db.users).length;
    const active = Object.values(db.users).filter(u => (u.logins || 0) > 1).length;
    const top = Object.values(db.users).sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, 10);
    let t = `👥 آمار کلی:\n📊 کل کاربران: ${total}\n🟢 فعال: ${active}\n\n🏆 ۱۰ کاربر برتر:\n`;
    top.forEach((u, i) => {
        const l = PVP_LEAGUES[u.pvpLeague || 'bronze'];
        t += `${i + 1}. ${u.name || '?'} | 🎚️${u.level || 1} | ${l.n} | 🥇${u.gold || 0}\n`;
    });
    t += `\n📝 /userinfo [آیدی] - اطلاعات کامل\n📝 /admin_give - اهدا\n📝 /admin_full - مکس کردن\n📝 /admin_reset - ریست کول‌داون\n📝 /admin_broadcast - پیام همگانی`;
    await ctx.reply(t);
});

bot.command('userinfo', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.trim().split(/\s+/);
    const uid = args[1];
    if (!uid) return ctx.reply('📝 /userinfo [آیدی]');
    const u = db.users[uid];
    if (!u) return ctx.reply('❌ کاربر یافت نشد');
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const l = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    const text = `👤 اطلاعات کامل:\n🆔 ${u.id}\n👤 ${u.name}\n🎚️ لول: ${u.level}\n✨ XP: ${u.xp}/30\n❤️ HP: ${u.hp}/${u.maxHp}\n⚡ قدرت: ${u.power}\n🗡️ سلاح: ${w.n}\n🛡️ زره: ${a.n}\n🐎 حیوان: ${u.pet ? PETS[u.pet]?.n : 'ندارد'}\n🏠 خانه: ${u.homeLvl}\n🏥 درمانگاه: ${u.clinicLvl}\n⭐ مهارت: ${u.sp} امتیاز\n🏆 PvP: ${l.n} | ⭐${u.pvpRating}\n✅ برد: ${u.pvpWins} | ❌ باخت: ${u.pvpLosses}\n🎖️ وفاداری: ${u.loyalty}\n📚 شعر: ${u.shahnamehCount}\n🏦 بانک: ${u.bankGold}\n🥇 طلا: ${u.gold}\n🏰 قبیله: ${u.clan || 'ندارد'}\n📅 ورود: ${u.logins} بار`;
    await ctx.reply(text);
});

bot.command('admin_give', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.trim().split(/\s+/);
    if (!args[1] || !args[2] || !args[3]) return ctx.reply('📝 /admin_give [آیدی] [نوع] [کلید] [مقدار]\n📋 انواع: resource | item | weapon | armor | xp | gold\n📋 مثال: /admin_give 123456 resource wood 100');
    const u = getUser(args[1], '');
    if (args[2] === 'resource') addRes(u, args[3], Number(args[4] || 0));
    else if (args[2] === 'item') addItem(u, args[3], Number(args[4] || 0));
    else if (args[2] === 'weapon') u.wOwned[args[3]] = true;
    else if (args[2] === 'armor') u.aOwned[args[3]] = true;
    else if (args[2] === 'xp') addXP(u, Number(args[3] || 0));
    else if (args[2] === 'gold') u.gold += Number(args[3] || 0);
    else return ctx.reply('❌ نوع نامعتبر');
    saveDB();
    await ctx.reply('✅ انجام شد');
});

bot.command('admin_full', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.trim().split(/\s+/);
    if (!args[1]) return ctx.reply('📝 /admin_full [آیدی]');
    const u = getUser(args[1], '');
    for (const k of Object.keys(RES)) u.res[k] = 9999;
    for (const k of Object.keys(WEAPONS)) u.wOwned[k] = true;
    for (const k of Object.keys(ARMORS)) u.aOwned[k] = true;
    u.weapon = 'zolfaghar'; u.armor = 'babr_bayan';
    u.level = 20; u.hp = u.maxHp = 500; u.power = 50; u.sp = 40;
    u.homeLvl = 5; u.clinicLvl = 3;
    u.pvpRating = 1500; u.pvpLeague = 'legendary'; u.honorPoints = 500;
    u.loyalty = 1000; u.shahnamehCount = 50;
    u.gold = 99999; u.bankGold = 50000;
    saveDB();
    await ctx.reply('✅ کاربر به شاهنشاه ارتقا یافت!');
});

bot.command('admin_reset', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.trim().split(/\s+/);
    if (!args[1]) return ctx.reply('📝 /admin_reset [آیدی]');
    const u = getUser(args[1], '');
    u.cooldowns = {}; u.daily = {};
    saveDB();
    await ctx.reply('✅ کول‌داون‌ها ریست شد');
});

bot.command('admin_broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const msg = ctx.message.text.split(' ').slice(1).join(' ');
    if (!msg) return ctx.reply('📝 /admin_broadcast [پیام]');
    let sent = 0;
    for (const uid of Object.keys(db.users)) {
        try { await bot.telegram.sendMessage(uid, `📢 پیام شاهنشاه:\n\n${msg}`); sent++; } catch (e) {}
    }
    await ctx.reply(`✅ پیام به ${sent} نفر ارسال شد`);
});

// ==================== 🚀 اجرا ====================
bot.catch((err) => console.error('❌', err.message));
bot.launch({ dropPendingUpdates: true }).then(() => console.log('✅ بقای باستانی - پرو مکس نهایی اجرا شد!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ بخش ۳ از ۳ - همه امکانات بارگذاری شد');
console.log('🏛️ بقای باستانی - آماده اجراست!');