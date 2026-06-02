const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_PATH = './data.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('❌ توکن ربات را وارد کن');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

let db = { users: {}, clans: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {}, clans: {} }; }
}

function saveDB() { try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8'); } catch (e) {} }

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

const CD = { gather: 120000, fight: 180000, boss: 600000, pray: 21600000, pvp: 300000, daily: 86400000, shahnameh: 3600000, npc: 3600000, box: 14400000 };

function checkCD(u, action, ms) {
    if (!u.cooldowns) u.cooldowns = {};
    const last = u.cooldowns[action] || 0;
    return (Date.now() - last >= ms) ? { can: true, rem: 0 } : { can: false, rem: ms - (Date.now() - last) };
}
function setCD(u, action) { if (!u.cooldowns) u.cooldowns = {}; u.cooldowns[action] = Date.now(); }

const RES = { wood: '🪵', stone: '🪨', metal: '🔩', iron: '⛓️', gold: '🥇' };

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

const ARMORS = {
    none: { n: '❌ بدون زره', d: 0, price: 0, lvl: 0 },
    wood_shield: { n: '🪵 سپر چوبی', d: 3, price: 50, lvl: 1 },
    leather: { n: '🐄 چرم سکایی', d: 7, price: 150, lvl: 3 },
    hakhamaneshi: { n: '⛓️ زره هخامنشی', d: 12, price: 400, lvl: 5 },
    sasani: { n: '🥇 زره ساسانی', d: 18, price: 800, lvl: 8 },
    babr_bayan: { n: '🐉 ببر بیان', d: 25, price: 2000, lvl: 12 },
};

const FOODS = { bread: { n: '🍞 نان', h: 30 }, meat: { n: '🍖 کباب', h: 50 }, fish: { n: '🐟 ماهی', h: 25 }, chicken: { n: '🍗 ماکیان', h: 45 }, steak: { n: '🥩 گوشت', h: 70 }, stew: { n: '🥘 آبگوشت', h: 55 }, noodle: { n: '🍜 آش', h: 35 }, cake: { n: '🍰 باقلوا', h: 25, heal: 20 }, honey: { n: '🍯 انگبین', h: 20, heal: 30 } };
const DRINKS = { water: { n: '💧 آب', t: 40 }, juice: { n: '🧃 شربت', t: 50 }, soda: { n: '🍺 دوغ', t: 25 }, tea: { n: '🍵 چای', t: 35 }, coffee: { n: '☕ قهوه', t: 30, xp: 10 }, milk: { n: '🥛 شیر', t: 45 } };

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
    { n: '👿 ارجنگ دیو', p: 35, loss: [30,60], rew: { gold: 300, iron: 5, gem: 3 }, xp: 60, type: 'boss', ml: 6 },
    { n: '💀 دیو سپید', p: 65, loss: [50,100], rew: { gold: 1500, dragon_scale: 3, gem: 15 }, xp: 250, type: 'boss', ml: 15 },
];

const BOX_LOOT = [
    { n: '🪵 ۱۰ چوب', f: (u) => { if (!u.res) u.res = {}; u.res.wood = (u.res.wood || 0) + 10; } },
    { n: '🪨 ۱۰ سنگ', f: (u) => { if (!u.res) u.res = {}; u.res.stone = (u.res.stone || 0) + 10; } },
    { n: '🥇 ۵۰ زر', f: (u) => { u.gold += 50; } },
    { n: '🥇 ۱۰۰ زر', f: (u) => { u.gold += 100; } },
    { n: '🥇 ۲۰۰ زر', f: (u) => { u.gold += 200; } },
    { n: '💎 ۱ گوهر', f: (u) => { if (!u.items) u.items = {}; u.items.gem = (u.items.gem || 0) + 1; } },
    { n: '🍞 ۳ نان', f: (u) => { if (!u.items) u.items = {}; u.items.bread = (u.items.bread || 0) + 3; } },
    { n: '✨ ۳۰ XP', f: (u) => { u.xp = (u.xp || 0) + 30; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } } },
    { n: '❤️ درمان', f: (u) => { u.hp = u.maxHp; } },
];

const HOME_UP = { 2: { wood: 25, stone: 20, metal: 8, iron: 3, gold: 40, nl: 3 }, 3: { wood: 45, stone: 35, metal: 18, iron: 8, gold: 90, nl: 5 }, 4: { wood: 70, stone: 55, metal: 30, iron: 16, gold: 180, nl: 8 }, 5: { wood: 100, stone: 80, metal: 50, iron: 30, gold: 350, nl: 12 } };
const PVP_LEAGUES = { bronze: { n: '🥉 برنز', min: 0 }, silver: { n: '🥈 نقره', min: 100 }, gold: { n: '🥇 طلا', min: 300 }, diamond: { n: '💎 الماس', min: 600 }, legendary: { n: '👑 افسانه‌ای', min: 1000 } };
const PETS = { horse: { n: '🐎 رخش', price: 500, bonus: 'سرعت +۳۰٪' }, falcon: { n: '🦅 باز', price: 400, bonus: 'شکار +۲۰٪' }, dog: { n: '🐕 سگ', price: 300, bonus: 'دفاع +۵' }, cat: { n: '🐈 گربه', price: 200, bonus: 'آیتم +۱۵٪' } };
const NPCS = { zal: { n: '👴 زال', price: 50, f: (u) => { u.sp = (u.sp || 0) + 1; return '⭐ +۱ گوهر'; } }, simurgh: { n: '🦅 سیمرغ', price: 100, f: (u) => { u.hp = u.maxHp; return '❤️ درمان'; } }, rostam: { n: '⚔️ رستم', price: 80, f: (u) => { u.xp = (u.xp || 0) + 50; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } return '✨ +۵۰ XP'; } }, ferdosi: { n: '📜 فردوسی', price: 30, f: (u) => { u.gold += 50; u.shahnamehCount = (u.shahnamehCount || 0) + 1; return '🥇 +۵۰ زر'; } } };
const SHAHNAMEH = [{ v: 'توانا بود هر که دانا بود', r: 15 }, { v: 'به نام خداوند جان و خرد', r: 10 }, { v: 'هنر نزد ایرانیان است و بس', r: 25 }, { v: 'چو ایران نباشد تن من مباد', r: 30 }];
const TAUNTS = ['👑 شاهنشاه می‌فرماید: حریف بیچاره حتی سپرش هم ترکید!', '⚔️ رستم می‌گه: اینم از انتقام!', '🦅 سیمرغ شاهد بود: زره‌ات مثل کاغذ پاره شد!', '🔥 آتشکده روشن شد: سلاح‌ات رو بفروش!'];

function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = { id: uid, name: name || 'ناشناس', level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5, homeLvl: 1, clinicLvl: 1, weapon: 'none', armor: 'none', skills: { g: 0, h: 0, c: 0, s: 0 }, sp: 0, res: { wood: 20, stone: 20, metal: 10, iron: 5 }, items: { bandage: 1, bread: 2, water: 2 }, wOwned: { none: true }, aOwned: { none: true }, cooldowns: {}, daily: {}, stats: { fw: 0, dw: 0, bw: 0 }, pvpWins: 0, pvpLosses: 0, pvpRating: 0, pvpLeague: 'bronze', pvpStreak: 0, pvpHistory: [], honorPoints: 0, loyalty: 0, shahnamehCount: 0, pet: null, bankGold: 0, bankInterest: 0, weaponEnchant: null, achievements: [], quests: [], questProgress: {}, clan: null, logins: 1, lastBox: 0, lastPray: 0, pendingFight: null, pendingPvP: null };
        rollQuests(db.users[uid]); saveDB(); return db.users[uid];
    }
    const u = db.users[uid]; if (name) u.name = name;
    u.logins = (u.logins || 0) + 1; u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 100;
    u.level = u.level || 1; u.xp = u.xp || 0; u.gold = u.gold || 100; u.power = u.power || 5;
    u.homeLvl = u.homeLvl || 1; u.clinicLvl = u.clinicLvl || 1; u.weapon = u.weapon || 'none'; u.armor = u.armor || 'none';
    u.skills = u.skills || { g: 0, h: 0, c: 0, s: 0 }; u.sp = u.sp || 0; u.res = u.res || {}; u.items = u.items || {};
    u.wOwned = u.wOwned || { none: true }; u.aOwned = u.aOwned || { none: true }; u.cooldowns = u.cooldowns || {}; u.daily = u.daily || {};
    u.stats = u.stats || { fw: 0, dw: 0, bw: 0 }; u.pvpWins = u.pvpWins || 0; u.pvpLosses = u.pvpLosses || 0;
    u.pvpRating = u.pvpRating || 0; u.pvpLeague = u.pvpLeague || 'bronze'; u.pvpStreak = u.pvpStreak || 0;
    u.pvpHistory = u.pvpHistory || []; u.honorPoints = u.honorPoints || 0; u.loyalty = u.loyalty || 0;
    u.shahnamehCount = u.shahnamehCount || 0; u.pet = u.pet || null; u.bankGold = u.bankGold || 0;
    u.bankInterest = u.bankInterest || 0; u.weaponEnchant = u.weaponEnchant || null;
    u.achievements = u.achievements || []; u.quests = u.quests || []; u.questProgress = u.questProgress || {};
    u.clan = u.clan || null; u.lastBox = u.lastBox || 0; u.lastPray = u.lastPray || 0;
    u.wOwned.none = true; u.aOwned.none = true;
    const today = new Date().toDateString();
    if (u.lastLoginDate !== today) { u.loyalty = (u.loyalty || 0) + 5; u.lastLoginDate = today; }
    if (u.lastQuestDate !== today) { rollQuests(u); u.lastQuestDate = today; }
    if (u.lastBankDate !== today && u.bankGold > 0) { u.bankGold += Math.floor(u.bankGold * 0.02); u.bankInterest = (u.bankInterest || 0) + Math.floor(u.bankGold * 0.02); u.lastBankDate = today; }
    saveDB(); return u;
}

function rollQuests(u) { u.quests = [{ n: 'شکار', t: 'gather', g: 3, rew: { gold: 100, xp: 20 } }, { n: 'نبرد', t: 'fight', g: 2, rew: { gold: 150, xp: 30 } }, { n: 'پهلوان', t: 'pvp_win', g: 1, rew: { gold: 200, xp: 40 } }]; u.questProgress = {}; u.quests.forEach(q => u.questProgress[q.t] = 0); }
function addXP(u, a) { u.xp += a; while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; u.sp = (u.sp || 0) + 1; } }
function addRes(u, k, v) { if (!u.res) u.res = {}; if (!u.res[k]) u.res[k] = 0; u.res[k] += v; if (u.res[k] < 0) u.res[k] = 0; }
function addItem(u, k, v) { if (!u.items) u.items = {}; if (!u.items[k]) u.items[k] = 0; u.items[k] += v; if (u.items[k] < 0) u.items[k] = 0; }
function hasRes(u, c) { if (!u.res) return false; for (const [k, v] of Object.entries(c)) { if (k === 'nl') continue; if ((u.res[k] || 0) < v) return false; } return true; }
function takeRes(u, c) { for (const [k, v] of Object.entries(c)) { if (k === 'nl') continue; addRes(u, k, -v); } }
function giveReward(u, r) { if (!r) return; for (const [k, v] of Object.entries(r)) { if (RES[k]) addRes(u, k, v); else addItem(u, k, v); } }
function rwText(r) { if (!r) return 'ندارد'; return Object.entries(r).map(([k, v]) => RES[k] ? `${RES[k]} ${v}` : `${v}x ${k}`).join(' | '); }
function updateLeague(u) { const rt = u.pvpRating || 0; for (const [k, l] of Object.entries(PVP_LEAGUES).reverse()) { if (rt >= l.min) { u.pvpLeague = k; break; } } }
function progressQuest(u, t) { if (!u.questProgress) u.questProgress = {}; u.questProgress[t] = (u.questProgress[t] || 0) + 1; }

function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 آمار', 'm_status'), Markup.button.callback('🌲 جستجو', 'm_gather'), Markup.button.callback('⚔️ نبرد', 'm_fight_menu'), Markup.button.callback('🏟️ PvP', 'm_pvp'), Markup.button.callback('🏠 خانه', 'm_home')],
        [Markup.button.callback('🏥 درمانگاه', 'm_heal'), Markup.button.callback('🛒 بازار', 'm_shop'), Markup.button.callback('🛠️ اسلحه', 'm_armory'), Markup.button.callback('🛡️ زره', 'm_armor_shop'), Markup.button.callback('🕯️ آتشکده', 'm_pray')],
        [Markup.button.callback('🍽️ غذا', 'm_eat'), Markup.button.callback('👤 بزرگان', 'm_npc'), Markup.button.callback('📋 مأموریت', 'm_quest'), Markup.button.callback('🐎 حیوان', 'm_pet'), Markup.button.callback('🏦 بانک', 'm_bank')],
        [Markup.button.callback('🏆 دستاورد', 'm_achieve'), Markup.button.callback('🏰 قبیله', 'm_clan'), Markup.button.callback('🎁 جعبه', 'm_box'), Markup.button.callback('📖 راهنما', 'm_guide'), Markup.button.callback('⭐ مهارت', 'm_skills')],
        [Markup.button.callback('⏱️ زمان‌ها', 'm_cd')],
    ]);
}

function backBtn() { return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت به بارگاه', 'm_main')]]); }

// ==================== استارت ====================
bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const isNew = u.logins === 1;
    const text = isNew ? `🏛️ به سرزمین پارس خوش آمدی ${u.name}!\n🎁 🪵۲۰ 🪨۲۰ 🥇۱۰۰ 🩹۱ 🍞۲ 💧۲\n⚔️ سرنوشتت را خود رقم بزن!` : `🏛️ ${u.name}، خوش برگشتی!\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold} زر`;
    await ctx.reply(text, mainMenu());
});

bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    try { await ctx.deleteMessage(); } catch (e) {}
    await ctx.reply(`🏛️ بارگاه جمشید\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`, mainMenu());
});

// ==================== وضعیت ====================
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const l = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    const text = `📊 ${u.name}\n🎚️ ${u.level} | ✨ ${u.xp}/30\n❤️ ${u.hp}/${u.maxHp}\n⚡ ${u.power}\n🗡️ ${w.n}${u.weaponEnchant?' '+u.weaponEnchant:''}\n🛡️ ${a.n}\n🐎 ${u.pet?PETS[u.pet]?.n:'ندارد'}\n🏠 ${u.homeLvl} | 🏥 ${u.clinicLvl}\n⭐ ${u.sp} | ${l.n} ⭐${u.pvpRating}\n⚔️ 🏆${u.pvpWins} 💀${u.pvpLosses}\n🎖️ ${u.loyalty} | 📚 ${u.shahnamehCount}\n🏦 ${u.bankGold} | 🥇 ${u.gold}`;
    await ctx.reply(text, backBtn());
});

// ==================== جستجو ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'gather', CD.gather);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    setCD(u, 'gather');
    const roll = [{ wood: 3, stone: 1 }, { wood: 2, gold: 5 }, { metal: 1, stone: 2 }, { wood: 4 }, { gold: 10 }][rand(0, 4)];
    giveReward(u, roll);
    let extra = '';
    if (Math.random() < (u.pet === 'cat' ? 0.45 : 0.3)) { const f = ['bread', 'fish', 'water', 'meat'][rand(0, 3)]; addItem(u, f, 1); extra = `\n🍽️ ${FOODS[f]?.n || f} هم یافت شد!`; }
    u.loyalty = (u.loyalty || 0) + 1; progressQuest(u, 'gather'); saveDB();
    await ctx.reply(`🌲 جستجو...\n🎁 ${rwText(roll)}${extra}${u.pet === 'horse' ? '\n🐎 رخش سرعت بخشید!' : ''}\n⏳ ${formatTime(CD.gather)}`, backBtn());
});

// ==================== مبارزه ====================
bot.action('m_fight_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const cd = checkCD(getUser(ctx.from.id), 'fight', CD.fight);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    await ctx.reply('⚔️ حریف:', Markup.inlineKeyboard([
        [Markup.button.callback('🐺 ددان', 'f_animals'), Markup.button.callback('👹 دیوان', 'f_demons')],
        [Markup.button.callback('👿 پلید', 'f_bosses'), Markup.button.callback('🎲 رندوم', 'f_random')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('f_animals', async (ctx) => startFight(ctx, 'animal'));
bot.action('f_demons', async (ctx) => startFight(ctx, 'demon'));
bot.action('f_bosses', async (ctx) => startFight(ctx, 'boss'));
bot.action('f_random', async (ctx) => startFight(ctx, 'random'));

async function startFight(ctx, type) {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.reply('❌ HP صفر!', backBtn());
    const pool = type === 'random' ? ALL_ENEMIES : ALL_ENEMIES.filter(e => e.type === type);
    const enemy = pool[rand(0, pool.length - 1)];
    if (enemy.ml && u.level < enemy.ml) return ctx.answerCbQuery(`❌ لول ${enemy.ml} لازمه`);
    u.pendingFight = enemy; setCD(u, 'fight'); saveDB();
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const ch = clamp(50 + (u.power + w.p - enemy.p) * 5, 5, 95);
    await ctx.reply(`⚔️ ${enemy.n}\n💪 ${enemy.p}\n🎁 ${rwText(enemy.rew)}\n🛡️ ${ch}%`, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ حمله!', `fg_${ALL_ENEMIES.indexOf(enemy)}`)], [Markup.button.callback('🏃 فرار', 'm_fight_menu')],
    ]));
}

bot.action(/fg_(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const enemy = ALL_ENEMIES[parseInt(ctx.match[1])];
    if (!enemy || u.hp <= 0) return;
    const w = WEAPONS[u.weapon] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const pp = u.power + w.p + rand(0, 8) + (u.pet === 'dog' ? 5 : 0) + (u.weaponEnchant === '🔥 آتشین' ? 5 : 0);
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
    await ctx.reply(`⚔️ ${enemy.n}\n${txt}`, backBtn());
});

// ==================== PvP ====================
bot.action('m_pvp', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.answerCbQuery('❌ HP صفر');
    const cd = checkCD(u, 'pvp', CD.pvp);
    const l = PVP_LEAGUES[u.pvpLeague || 'bronze'];
    await ctx.reply(`🏟️ PvP\n🏆 ${l.n} | ⭐${u.pvpRating}\n✅ ${u.pvpWins} | ❌ ${u.pvpLosses}\n⏱️ ${cd.can ? '✅' : formatTime(cd.rem)}`, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ نبرد سریع', 'pvp_quick')], [Markup.button.callback('🏆 لیگ', 'pvp_league')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('pvp_quick', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return;
    const cd = checkCD(u, 'pvp', CD.pvp);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    const enemies = Object.values(db.users).filter(e => e.id !== u.id && (e.hp || 100) > 0);
    if (!enemies.length) return ctx.answerCbQuery('❌ حریف نیست');
    const enemy = enemies[rand(0, enemies.length - 1)];
    const mw = Object.entries(u.wOwned || {}).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p);
    u.pendingPvP = { eid: enemy.id, ename: enemy.name, sw: mw.length ? Object.keys(WEAPONS).find(k => WEAPONS[k] === mw[0]) : 'none' };
    setCD(u, 'pvp'); saveDB();
    const ch = clamp(50 + (u.power + (mw[0]?.p || 0) - (enemy.power || 5) - (WEAPONS[enemy.weapon] || WEAPONS.none).p) * 3, 10, 90);
    await ctx.reply(`⚔️ ${enemy.name}\n👤 لول ${enemy.level || 1}\n🎲 ${ch}%`, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ حمله!', 'pvp_go')], [Markup.button.callback('🏃 فرار', 'm_main')],
    ]));
});

bot.action('pvp_go', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.pendingPvP) return;
    const { eid, sw } = u.pendingPvP; u.pendingPvP = null;
    const enemy = db.users[eid]; if (!enemy) return;
    const w = WEAPONS[sw] || WEAPONS.none;
    const a = ARMORS[u.armor] || ARMORS.none;
    const ew = WEAPONS[enemy.weapon] || WEAPONS.none;
    const mp = u.power + w.p + rand(0, 10); const ep = (enemy.power || 5) + ew.p + rand(0, 10);
    const win = Math.random() * 100 < clamp(50 + (mp - ep) * 3, 10, 90);
    const dmg = rand(15, 40);
    let at;
    if (win) {
        const gr = rand(30, 80); u.gold += gr; addXP(u, 20);
        u.pvpWins = (u.pvpWins || 0) + 1; enemy.pvpLosses = (enemy.pvpLosses || 0) + 1;
        u.pvpRating = (u.pvpRating || 0) + rand(20, 30); enemy.pvpRating = Math.max(0, (enemy.pvpRating || 0) - rand(10, 20));
        u.pvpStreak = (u.pvpStreak || 0) + 1; enemy.pvpStreak = 0;
        updateLeague(u); updateLeague(enemy); progressQuest(u, 'pvp_win');
        u.hp = Math.max(0, u.hp - Math.floor(dmg * 0.3)); enemy.hp = Math.max(0, (enemy.hp || 100) - dmg);
        at = `👑 بر ${enemy.name} چیره شدی!\n${TAUNTS[rand(0, TAUNTS.length - 1)]}\n🥇 +${gr}\n❤️ ${u.hp}/${u.maxHp}`;
    } else {
        u.pvpLosses = (u.pvpLosses || 0) + 1; enemy.pvpWins = (enemy.pvpWins || 0) + 1;
        u.pvpRating = Math.max(0, (u.pvpRating || 0) - rand(10, 20)); enemy.pvpRating = (enemy.pvpRating || 0) + rand(15, 25);
        u.pvpStreak = Math.min(0, (u.pvpStreak || 0) - 1); enemy.pvpStreak = (enemy.pvpStreak || 0) + 1;
        updateLeague(u); updateLeague(enemy);
        u.hp = Math.max(0, u.hp - dmg); enemy.hp = Math.max(0, (enemy.hp || 100) - Math.floor(dmg * 0.3));
        at = `💀 از ${enemy.name} شکست خوردی!\n❤️ -${dmg}\n❤️ ${u.hp}/${u.maxHp}`;
    }
    saveDB();
    try { await bot.telegram.sendMessage(eid, `⚔️ ${u.name} به تو حمله کرد!\n${win ? '❌ شکست!' : '✅ دفاع!'}\n❤️ ${enemy.hp}/${enemy.maxHp || 100}`, Markup.inlineKeyboard([[Markup.button.callback('⚔️ انتقام!', `pvp_rev_${u.id}`)], [Markup.button.callback('🔙', 'm_main')]])); } catch (e) {}
    await ctx.reply(at, backBtn());
});

bot.action(/pvp_rev_(.+)/, async (ctx) => { await ctx.answerCbQuery(); const u = getUser(ctx.from.id); const tid = ctx.match[1]; const enemy = db.users[tid]; if (!enemy || u.hp <= 0) return; const mw = Object.entries(u.wOwned || {}).filter(([k, v]) => v && k !== 'none').map(([k]) => WEAPONS[k]).filter(w => w).sort((a, b) => b.p - a.p); if (!mw.length) return; u.pendingPvP = { eid: tid, ename: enemy.name, sw: Object.keys(WEAPONS).find(k => WEAPONS[k] === mw[0]) }; setCD(u, 'pvp'); saveDB(); await ctx.reply(`⚔️ انتقام از ${enemy.name}!`, Markup.inlineKeyboard([[Markup.button.callback('⚔️ حمله!', 'pvp_go')], [Markup.button.callback('🔙', 'm_main')]])); });

bot.action('pvp_league', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const list = Object.entries(PVP_LEAGUES).map(([k, l]) => `${l.n}${u.pvpLeague === k ? ' ✅' : ''}: ${l.min}+`).join('\n');
    await ctx.reply(`🏆 لیگ‌ها\n\n${list}\n\nتو: ${PVP_LEAGUES[u.pvpLeague || 'bronze'].n}\n⭐ ${u.pvpRating}`, backBtn());
});

// ==================== خانه ====================
bot.action('m_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    let up = '🏆 به اوج';
    if (next) up = `⬆️ ${u.homeLvl + 1}\n🪵${next.wood} 🪨${next.stone} 🔩${next.metal} ⛓️${next.iron} 🥇${next.gold}\nلول: ${next.nl}`;
    await ctx.reply(`🏠 خانه لول ${u.homeLvl}\n${up}\n/upgrade_home`, Markup.inlineKeyboard([[Markup.button.callback('⬆️ ارتقا', 'up_home')], [Markup.button.callback('🔙', 'm_main')]]));
});

bot.action('up_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    if (!next) return ctx.answerCbQuery('🏆');
    if (u.level < next.nl) return ctx.answerCbQuery(`❌ لول ${next.nl}`);
    if (!hasRes(u, next)) return ctx.answerCbQuery('❌ منابع');
    takeRes(u, next); u.homeLvl++; if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3; saveDB();
    await ctx.reply(`✅ خانه لول ${u.homeLvl}!`, backBtn());
});

bot.command('upgrade_home', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const next = HOME_UP[u.homeLvl + 1];
    if (!next) return ctx.reply('🏆');
    if (u.level < next.nl) return ctx.reply(`❌ لول ${next.nl}`);
    if (!hasRes(u, next)) return ctx.reply('❌');
    takeRes(u, next); u.homeLvl++; if (u.homeLvl >= 3) u.clinicLvl = 2; if (u.homeLvl >= 5) u.clinicLvl = 3; saveDB();
    await ctx.reply(`✅ ${u.homeLvl}!`);
});

// ==================== درمانگاه ====================
bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.clinicLvl) u.clinicLvl = 1;
    const amt = 20 + u.clinicLvl * 10;
    await ctx.reply(`🏥 درمانگاه لول ${u.clinicLvl}\n❤️ ${u.hp}/${u.maxHp}\n💊 رایگان: ${u.daily.fh ? '❌' : '✅'} (+${amt})\n💰 کامل: ۲۰ زر\n/heal free | /heal gold`, Markup.inlineKeyboard([[Markup.button.callback('🆓 رایگان', 'hl_free'), Markup.button.callback('💰 کامل', 'hl_gold')], [Markup.button.callback('🔙', 'm_main')]]));
});

bot.action('hl_free', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.daily.fh) return ctx.answerCbQuery('❌');
    const amt = 20 + (u.clinicLvl || 1) * 10;
    u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB();
    await ctx.reply(`✅ +${amt}\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.action('hl_gold', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.gold < 20) return ctx.answerCbQuery('❌ ۲۰ زر');
    u.gold -= 20; u.hp = u.maxHp; saveDB();
    await ctx.reply(`✅ درمان\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

bot.command('heal', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    if (args[1] === 'free') { if (u.daily.fh) return ctx.reply('❌'); const amt = 20 + (u.clinicLvl || 1) * 10; u.daily.fh = true; u.hp = Math.min(u.maxHp, u.hp + amt); saveDB(); return ctx.reply(`✅ +${amt}`); }
    if (args[1] === 'gold') { if (u.gold < 20) return ctx.reply('❌'); u.gold -= 20; u.hp = u.maxHp; saveDB(); return ctx.reply('✅'); }
});

// ==================== بازار ====================
bot.action('m_shop', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🛒 بازار', Markup.inlineKeyboard([
        [Markup.button.callback('📦 منابع', 'sh_res'), Markup.button.callback('🍽️ غذا', 'sh_food')],
        [Markup.button.callback('⚔️ سلاح', 'sh_wep'), Markup.button.callback('🛡️ زره', 'sh_arm')],
        [Markup.button.callback('💰 فروش', 'sh_sell')], [Markup.button.callback('🔙', 'm_main')],
    ]));
});

bot.action('sh_res', async (ctx) => { await ctx.answerCbQuery(); await ctx.reply('📦 🪵۸ 🪨۱۰ 🔩۱۸ ⛓️۲۵\n/buy [کالا] [تعداد]', backBtn()); });
bot.action('sh_food', async (ctx) => { await ctx.answerCbQuery(); await ctx.reply('🍽️ 🍞۱۰ 🍖۲۵ 💧۸\n/buy [کالا] [تعداد]', backBtn()); });
bot.action('sh_wep', async (ctx) => { await ctx.answerCbQuery(); const list = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => `${w.n}: ${w.price} زر`).join('\n'); await ctx.reply(`⚔️\n${list}\n/craft [کلید]`, backBtn()); });
bot.action('sh_arm', async (ctx) => { await ctx.answerCbQuery(); const list = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => `${a.n}: ${a.price} زر`).join('\n'); await ctx.reply(`🛡️\n${list}\n/craft_armor [کلید]`, backBtn()); });
bot.action('sh_sell', async (ctx) => { await ctx.answerCbQuery(); const u = getUser(ctx.from.id); let txt = '💰 فروش:\n'; for (const [k, v] of Object.entries(u.res || {})) { if (v > 0 && k !== 'gold') txt += `${RES[k]} ${k}: ${v}\n`; } txt += '/sell [کالا] [تعداد]'; await ctx.reply(txt, backBtn()); });

bot.command('buy', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const k = args[1]; const amt = Number(args[2] || 1);
    const prices = { wood: 8, stone: 10, metal: 18, iron: 25, bread: 10, meat: 25, water: 8 };
    if (!prices[k]) return ctx.reply('❌');
    const total = prices[k] * amt;
    if (u.gold < total) return ctx.reply(`❌ ${total} زر`);
    u.gold -= total;
    if (['wood', 'stone', 'metal', 'iron'].includes(k)) addRes(u, k, amt); else addItem(u, k, amt);
    saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.gold}`);
});

bot.command('sell', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/);
    const k = args[1]; const amt = Number(args[2] || 1);
    const prices = { wood: 4, stone: 5, metal: 9, iron: 12, bread: 5, meat: 12, water: 4 };
    if (!prices[k]) return ctx.reply('❌');
    if ((u.res[k] || 0) < amt && (u.items[k] || 0) < amt) return ctx.reply('❌');
    if (u.res[k] >= amt) { addRes(u, k, -amt); u.gold += prices[k] * amt; } else { addItem(u, k, -amt); u.gold += prices[k] * amt; }
    saveDB(); await ctx.reply(`✅ ${amt} ${k}\n💰 ${u.gold}`);
});

// ==================== اسلحه‌خانه ====================
bot.action('m_armory', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const btns = Object.entries(WEAPONS).filter(([k]) => k !== 'none').map(([k, w]) => [Markup.button.callback(`${u.wOwned[k] ? '✅' : '🔨'} ${w.n} ${u.weapon === k ? '⚔️' : ''}`, u.wOwned[k] ? `eq_w_${k}` : `cr_w_${k}`)]);
    btns.push([Markup.button.callback('🔥 ارتقا', 'enchant_w')], [Markup.button.callback('🔙', 'm_main')]);
    await ctx.reply(`🛠️ اسلحه‌خانه\nفعلی: ${WEAPONS[u.weapon]?.n || 'ندارد'}${u.weaponEnchant ? ' ' + u.weaponEnchant : ''}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_w_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id); const w = WEAPONS[k];
    if (!w) return; if (u.level < w.lvl) return ctx.answerCbQuery(`❌ لول ${w.lvl}`);
    if (u.gold < w.price) return ctx.answerCbQuery(`❌ ${w.price} زر`);
    u.gold -= w.price; u.wOwned[k] = true; saveDB(); await ctx.answerCbQuery(`✅ ${w.n} ساخته شد!`);
});

bot.action(/eq_w_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id);
    if (!u.wOwned[k]) return; u.weapon = k; saveDB(); await ctx.answerCbQuery(`⚔️ ${WEAPONS[k].n}`);
});

bot.action('enchant_w', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.weapon === 'none') return; if (u.weaponEnchant) return ctx.answerCbQuery('❌');
    await ctx.reply('🔥 ارتقا (۵۰۰ زر)\n🔥 آتشین: +۵\n❄️ یخی: کندی\n💀 زهر: تدریجی\n/enchant [fire|ice|poison]', backBtn());
});

bot.command('enchant', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const t = args[1];
    if (!['fire', 'ice', 'poison'].includes(t)) return ctx.reply('❌');
    if (u.weapon === 'none') return ctx.reply('❌'); if (u.weaponEnchant) return ctx.reply('❌');
    if (u.gold < 500) return ctx.reply('❌ ۵۰۰ زر');
    u.gold -= 500; u.weaponEnchant = { fire: '🔥 آتشین', ice: '❄️ یخی', poison: '💀 زهر' }[t]; saveDB();
    await ctx.reply(`✅ ${u.weaponEnchant}!`);
});

bot.command('craft', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const w = WEAPONS[k];
    if (!w || k === 'none') return ctx.reply('❌');
    if (u.level < w.lvl) return ctx.reply(`❌ لول ${w.lvl}`);
    if (u.gold < w.price) return ctx.reply(`❌ ${w.price} زر`);
    u.gold -= w.price; u.wOwned[k] = true; saveDB(); await ctx.reply(`✅ ${w.n}`);
});

bot.command('equip', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const k = args[1];
    if (!u.wOwned[k]) return ctx.reply('❌'); u.weapon = k; saveDB(); await ctx.reply(`⚔️ ${WEAPONS[k].n}`);
});

// ==================== زره‌خانه ====================
bot.action('m_armor_shop', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const btns = Object.entries(ARMORS).filter(([k]) => k !== 'none').map(([k, a]) => [Markup.button.callback(`${u.aOwned[k] ? '✅' : '🔨'} ${a.n} ${u.armor === k ? '🛡️' : ''}`, u.aOwned[k] ? `eq_a_${k}` : `cr_a_${k}`)]);
    btns.push([Markup.button.callback('🔙', 'm_main')]);
    await ctx.reply(`🛡️ زره‌خانه\nفعلی: ${ARMORS[u.armor]?.n || 'ندارد'}`, Markup.inlineKeyboard(btns));
});

bot.action(/cr_a_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id); const a = ARMORS[k];
    if (!a) return; if (u.level < a.lvl) return ctx.answerCbQuery(`❌ لول ${a.lvl}`);
    if (u.gold < a.price) return ctx.answerCbQuery(`❌ ${a.price} زر`);
    u.gold -= a.price; u.aOwned[k] = true; saveDB(); await ctx.answerCbQuery(`✅ ${a.n} ساخته شد!`);
});

bot.action(/eq_a_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id);
    if (!u.aOwned[k]) return; u.armor = k; saveDB(); await ctx.answerCbQuery(`🛡️ ${ARMORS[k].n}`);
});

bot.command('craft_armor', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const k = args[1]; const a = ARMORS[k];
    if (!a || k === 'none') return ctx.reply('❌');
    if (u.level < a.lvl) return ctx.reply(`❌ لول ${a.lvl}`);
    if (u.gold < a.price) return ctx.reply(`❌ ${a.price} زر`);
    u.gold -= a.price; u.aOwned[k] = true; saveDB(); await ctx.reply(`✅ ${a.n}`);
});

// ==================== آتشکده ====================
bot.action('m_pray', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'pray', CD.pray);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)}`);
    await ctx.reply('🕯️ آتشکده', Markup.inlineKeyboard([
        [Markup.button.callback('🤲 دعا', 'p_dua'), Markup.button.callback('🧎 نماز', 'p_namaz')],
        [Markup.button.callback('📖 روضه', 'p_rozeh')], [Markup.button.callback('🔙', 'm_main')],
    ]));
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
    await ctx.reply(`✅ ${names[ctx.match[0]]} قبول!\n✨ +${xp}\n🎚️ ${u.level}`, backBtn());
});

// ==================== غذا ====================
bot.action('m_eat', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🍽️ سفره', Markup.inlineKeyboard([
        [Markup.button.callback('🍞 نان', 'e_bread'), Markup.button.callback('🍖 کباب', 'e_meat')],
        [Markup.button.callback('🐟 ماهی', 'e_fish'), Markup.button.callback('🍗 ماکیان', 'e_chicken')],
        [Markup.button.callback('🥩 گوشت', 'e_steak'), Markup.button.callback('🥘 آبگوشت', 'e_stew')],
        [Markup.button.callback('🍜 آش', 'e_noodle'), Markup.button.callback('🍰 باقلوا', 'e_cake')],
        [Markup.button.callback('🍯 انگبین', 'e_honey')],
        [Markup.button.callback('💧 آب', 'd_water'), Markup.button.callback('🧃 شربت', 'd_juice')],
        [Markup.button.callback('🍺 دوغ', 'd_soda'), Markup.button.callback('🍵 چای', 'd_tea')],
        [Markup.button.callback('☕ قهوه', 'd_coffee'), Markup.button.callback('🥛 شیر', 'd_milk')],
        [Markup.button.callback('🔙', 'm_main')],
    ]));
});

bot.action(/e_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id);
    if ((u.items[k] || 0) < 1) return; const food = FOODS[k]; if (!food) return;
    addItem(u, k, -1); if (food.h) u.hunger = Math.min(u.maxHp, (u.hunger || 100) + food.h);
    if (food.heal) u.hp = Math.min(u.maxHp, u.hp + food.heal); saveDB();
    await ctx.answerCbQuery(`✅ ${food.n}`);
});

bot.action(/d_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id);
    if ((u.items[k] || 0) < 1) return; const drink = DRINKS[k]; if (!drink) return;
    addItem(u, k, -1); if (drink.t) u.thirst = Math.min(u.maxHp, (u.thirst || 100) + drink.t);
    if (drink.xp) addXP(u, drink.xp); saveDB();
    await ctx.answerCbQuery(`✅ ${drink.n}`);
});

// ==================== NPC ====================
bot.action('m_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'npc', CD.npc);
    const btns = Object.entries(NPCS).map(([k, n]) => [Markup.button.callback(`${n.n}: ${n.price} زر`, `npc_${k}`)]);
    btns.push([Markup.button.callback('🔙', 'm_main')]);
    await ctx.reply(`👤 بزرگان\n${cd.can ? '✅' : '⏳ ' + formatTime(cd.rem)}`, Markup.inlineKeyboard(btns));
});

bot.action(/npc_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const npc = NPCS[k]; const u = getUser(ctx.from.id);
    if (!npc) return;
    if (checkCD(u, 'npc', CD.npc).can === false) return ctx.answerCbQuery(`⏳ ${formatTime(checkCD(u, 'npc', CD.npc).rem)}`);
    if (u.gold < npc.price) return ctx.answerCbQuery(`❌ ${npc.price} زر`);
    u.gold -= npc.price;
    const result = npc.f(u);
    setCD(u, 'npc'); saveDB();
    await ctx.reply(`👤 ${npc.n}\n${result}`, backBtn());
});

// ==================== مأموریت ====================
bot.action('m_quest', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.quests.length) rollQuests(u);
    const text = ['📋 مأموریت‌ها:\n'];
    u.quests.forEach(q => { const p = u.questProgress[q.t] || 0; text.push(`${p >= q.g ? '✅' : '⏳'} ${q.n}: ${p}/${q.g}`); });
    text.push('\n/claim_quests');
    await ctx.reply(text.join('\n'), backBtn());
});

bot.command('claim_quests', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    let c = false;
    for (const q of u.quests) { if ((u.questProgress[q.t] || 0) >= q.g && !q.claimed) { giveReward(u, q.rew); if (q.rew.xp) addXP(u, q.rew.xp); q.claimed = true; c = true; } }
    if (!c) return ctx.reply('❌');
    saveDB(); await ctx.reply('✅');
});

// ==================== حیوان ====================
bot.action('m_pet', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const cur = u.pet ? PETS[u.pet]?.n : 'نداری';
    const btns = Object.entries(PETS).map(([k, p]) => [Markup.button.callback(`${p.n}: ${p.bonus} (${p.price} زر)`, `buy_pet_${k}`)]);
    btns.push([Markup.button.callback('🔙', 'm_main')]);
    await ctx.reply(`🐎 حیوانات\nفعلی: ${cur}`, Markup.inlineKeyboard(btns));
});

bot.action(/buy_pet_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const pet = PETS[k]; const u = getUser(ctx.from.id);
    if (!pet) return; if (u.pet) return ctx.answerCbQuery('❌');
    if (u.gold < pet.price) return ctx.answerCbQuery(`❌ ${pet.price} زر`);
    u.gold -= pet.price; u.pet = k; saveDB();
    await ctx.reply(`🐎 ${pet.n} همراه تو شد!\n✨ ${pet.bonus}`, backBtn());
});

// ==================== بانک ====================
bot.action('m_bank', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    await ctx.reply(`🏦 بانک\n💰 ${u.bankGold} زر\n📈 سود: ${u.bankInterest}\n💎 ۲٪ روزانه\n/deposit [مبلغ]\n/withdraw [مبلغ]`, backBtn());
});

bot.command('deposit', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const a = Number(args[1] || 0);
    if (!a || a <= 0) return ctx.reply('❌');
    if (u.gold < a) return ctx.reply('❌');
    u.gold -= a; u.bankGold = (u.bankGold || 0) + a; saveDB(); await ctx.reply(`✅ ${a} زر\n🏦 ${u.bankGold}`);
});

bot.command('withdraw', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const a = Number(args[1] || 0);
    if (!a || a <= 0) return ctx.reply('❌');
    if ((u.bankGold || 0) < a) return ctx.reply('❌');
    u.bankGold -= a; u.gold += a; saveDB(); await ctx.reply(`✅ ${a} زر\n💰 ${u.gold}`);
});

// ==================== دستاورد ====================
bot.action('m_achieve', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    let txt = '🏆 دستاوردها:\n'; let c = 0;
    [{ id: 'fb', n: '🩸 اولین خون', d: '۱ برد', ch: (u) => (u.stats.fw || 0) + (u.stats.dw || 0) >= 1 },
     { id: 'wr', n: '⚔️ جنگجو', d: '۱۰ برد', ch: (u) => (u.stats.fw || 0) + (u.stats.dw || 0) >= 10 },
     { id: 'rc', n: '💰 خزانه‌دار', d: '۱۰۰۰۰ طلا', ch: (u) => u.gold >= 10000 },
     { id: 'bl', n: '🏠 معمار', d: 'خانه لول ۵', ch: (u) => u.homeLvl >= 5 },
     { id: 'sr', n: '📚 شاعر', d: '۲۰ شعر', ch: (u) => (u.shahnamehCount || 0) >= 20 }]
    .forEach(a => { const e = u.achievements.includes(a.id); if (e) c++; txt += `${e ? '✅' : '🔒'} ${a.n}: ${a.d}\n`; if (!e && a.ch(u)) { u.achievements.push(a.id); txt += `🎉 نو!\n`; } });
    txt += `\n📊 ${c}/۵`; saveDB();
    await ctx.reply(txt, backBtn());
});

// ==================== کلن ====================
bot.action('m_clan', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (!u.clan) return ctx.reply('🏰 قبیله\n/create_clan [اسم]\n/join_clan [اسم]\n/clans', backBtn());
    const cl = db.clans[u.clan];
    if (!cl) { u.clan = null; saveDB(); return ctx.reply('❌', backBtn()); }
    const m = cl.members.map(mid => db.users[mid]?.name || mid).join('، ');
    await ctx.reply(`🏰 ${cl.name}\n👑 ${db.users[cl.owner]?.name}\n👥 ${m}\n💰 ${cl.treasury || 0}\n/donate gold [مقدار]\n/leave_clan`, backBtn());
});

bot.command('create_clan', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (u.clan) return ctx.reply('❌'); if (u.gold < 1000) return ctx.reply('❌ ۱۰۰۰ زر');
    const args = ctx.message.text.trim().split(/\s+/); const n = args.slice(1).join(' ');
    if (!n) return ctx.reply('/create_clan [اسم]');
    if (Object.values(db.clans).some(c => c.name === n)) return ctx.reply('❌');
    const id = 'c' + Date.now(); db.clans[id] = { id, name: n, owner: u.id, members: [u.id], treasury: 0 };
    u.clan = id; u.gold -= 1000; saveDB(); await ctx.reply(`✅ ${n} ساخته شد!`);
});

bot.command('join_clan', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (u.clan) return ctx.reply('❌');
    const args = ctx.message.text.trim().split(/\s+/); const n = args.slice(1).join(' ');
    if (!n) return ctx.reply('/join_clan [اسم]');
    const cl = Object.values(db.clans).find(c => c.name === n);
    if (!cl) return ctx.reply('❌'); cl.members.push(u.id); u.clan = cl.id; saveDB(); await ctx.reply(`✅ به ${n} پیوستی!`);
});

bot.command('leave_clan', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u.clan) return ctx.reply('❌');
    const cl = db.clans[u.clan];
    if (cl) { cl.members = cl.members.filter(m => m !== u.id); if (cl.members.length === 0) delete db.clans[u.clan]; else if (cl.owner === u.id) cl.owner = cl.members[0]; }
    u.clan = null; saveDB(); await ctx.reply('✅');
});

bot.command('donate', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u.clan) return ctx.reply('❌');
    const args = ctx.message.text.trim().split(/\s+/);
    if (args[1] === 'gold' && Number(args[2]) > 0 && u.gold >= Number(args[2])) {
        const a = Number(args[2]); u.gold -= a; db.clans[u.clan].treasury = (db.clans[u.clan].treasury || 0) + a; saveDB(); await ctx.reply(`✅ ${a} زر`);
    } else await ctx.reply('❌ /donate gold [مقدار]');
});

bot.command('clans', async (ctx) => {
    const cls = Object.values(db.clans);
    if (!cls.length) return ctx.reply('❌');
    await ctx.reply(cls.map(c => `${c.name}: ${c.members.length} عضو | ${c.treasury || 0} زر`).join('\n'));
});

// ==================== جعبه ====================
bot.action('m_box', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const now = Date.now();
    if (u.lastBox && now - u.lastBox < CD.box) return ctx.answerCbQuery(`⏳ ${formatTime(CD.box - (now - u.lastBox))}`);
    u.lastBox = now;
    const loot = BOX_LOOT[rand(0, BOX_LOOT.length - 1)];
    loot.f(u); saveDB();
    await ctx.reply(`🎁 صندوقچه!\n${loot.n}`, backBtn());
});

// ==================== شاهنامه ====================
bot.command('shahnameh', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'shahnameh', CD.shahnameh);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
    setCD(u, 'shahnameh');
    const v = SHAHNAMEH[rand(0, SHAHNAMEH.length - 1)];
    u.gold += v.r; u.shahnamehCount = (u.shahnamehCount || 0) + 1; u.loyalty = (u.loyalty || 0) + 5;
    progressQuest(u, 'shahnameh'); saveDB();
    await ctx.reply(`📜 «${v.v}»\n🎁 ${v.r} زر\n📚 ${u.shahnamehCount} شعر`);
});

bot.command('top_loyalty', async (ctx) => {
    const us = Object.values(db.users).filter(u => (u.loyalty || 0) > 0).sort((a, b) => (b.loyalty || 0) - (a.loyalty || 0)).slice(0, 10);
    if (!us.length) return ctx.reply('❌');
    await ctx.reply(us.map((u, i) => `${i + 1}. ${u.name || '?'} | ⭐${u.loyalty} | 📚${u.shahnamehCount || 0}`).join('\n'));
});

// ==================== مهارت ====================
bot.action('m_skills', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    await ctx.reply(`⭐ مهارت‌ها | ${u.sp} امتیاز\n⛏️ ${u.skills.g}/10 | 🏹 ${u.skills.h}/10\n🔨 ${u.skills.c}/10 | 🏕️ ${u.skills.s}/10\n/skill <g|h|c|s>`, Markup.inlineKeyboard([
        [Markup.button.callback('⛏️', 'sk_g'), Markup.button.callback('🏹', 'sk_h')],
        [Markup.button.callback('🔨', 'sk_c'), Markup.button.callback('🏕️', 'sk_s')], [Markup.button.callback('🔙', 'm_main')],
    ]));
});

bot.action(/sk_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const k = ctx.match[1]; const u = getUser(ctx.from.id);
    if (!u.sp) return; if ((u.skills[k] || 0) >= 10) return;
    u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB(); await ctx.answerCbQuery(`✅ ${u.skills[k]}/10`);
});

bot.command('skill', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const args = ctx.message.text.trim().split(/\s+/); const k = args[1];
    if (!['g', 'h', 'c', 's'].includes(k)) return ctx.reply('❌');
    if (!u.sp) return ctx.reply('❌'); if ((u.skills[k] || 0) >= 10) return ctx.reply('❌');
    u.skills[k] = (u.skills[k] || 0) + 1; u.sp--; saveDB(); await ctx.reply(`✅ ${k}: ${u.skills[k]}/10`);
});

// ==================== راهنما ====================
bot.action('m_guide', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(`📖 راهنما\n🌲 ${formatTime(CD.gather)}\n⚔️ ${formatTime(CD.fight)}\n🏟️ ${formatTime(CD.pvp)}\n🕯️ ${formatTime(CD.pray)}\n🎁 ${formatTime(CD.box)}\n📜 ${formatTime(CD.shahnameh)}\n👤 ${formatTime(CD.npc)}`, backBtn());
});

// ==================== زمان‌ها ====================
bot.action('m_cd', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const acts = [['gather', '🌲', CD.gather], ['fight', '⚔️', CD.fight], ['pvp', '🏟️', CD.pvp], ['pray', '🕯️', CD.pray], ['box', '🎁', CD.box], ['daily', '🎁', CD.daily], ['shahnameh', '📜', CD.shahnameh], ['npc', '👤', CD.npc]];
    const lines = ['⏱️:\n'];
    for (const [k, n, cd] of acts) { const c = checkCD(u, k, cd); lines.push(`${n}: ${c.can ? '✅' : '⏳ ' + formatTime(c.rem)}`); }
    await ctx.reply(lines.join('\n'), backBtn());
});

// ==================== جایزه روزانه ====================
bot.command('daily', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'daily', CD.daily);
    if (!cd.can) return ctx.reply(`⏳ ${formatTime(cd.rem)}`);
    setCD(u, 'daily');
    const r = { gold: rand(50, 150), xp: rand(10, 30) };
    giveReward(u, r); u.loyalty = (u.loyalty || 0) + 10; addXP(u, r.xp || 0); saveDB();
    await ctx.reply(`🎁 ${rwText(r)}\n⭐ +۱۰`);
});

// ==================== ادمین ====================
bot.command('users', async (ctx) => { if (!isAdmin(ctx.from.id)) return; const us = Object.values(db.users).sort((a, b) => b.level - a.level).slice(0, 10); let t = `👥 ${Object.keys(db.users).length}\n`; us.forEach((u, i) => t += `${i + 1}. ${u.name} | ${u.level} | 🥇${u.gold}\n`); await ctx.reply(t); });
bot.command('admin_give', async (ctx) => { if (!isAdmin(ctx.from.id)) return; const args = ctx.message.text.trim().split(/\s+/); const u = getUser(args[1], ''); if (args[2] === 'resource') addRes(u, args[3], Number(args[4] || 0)); else if (args[2] === 'item') addItem(u, args[3], Number(args[4] || 0)); else if (args[2] === 'weapon') u.wOwned[args[3]] = true; else if (args[2] === 'armor') u.aOwned[args[3]] = true; else if (args[2] === 'xp') addXP(u, Number(args[4] || 0)); else if (args[2] === 'gold') u.gold += Number(args[4] || 0); saveDB(); await ctx.reply('✅'); });
bot.command('admin_full', async (ctx) => { if (!isAdmin(ctx.from.id)) return; const u = getUser(ctx.message.text.trim().split(/\s+/)[1], ''); for (const k of Object.keys(RES)) u.res[k] = 9999; for (const k of Object.keys(WEAPONS)) u.wOwned[k] = true; for (const k of Object.keys(ARMORS)) u.aOwned[k] = true; u.weapon = 'zolfaghar'; u.armor = 'babr_bayan'; u.level = 20; u.hp = u.maxHp = 500; u.power = 50; u.sp = 40; u.homeLvl = 5; u.clinicLvl = 3; u.pvpRating = 1500; u.pvpLeague = 'legendary'; u.loyalty = 1000; u.gold = 99999; u.bankGold = 50000; saveDB(); await ctx.reply('✅'); });

// ==================== خطا ====================
bot.catch((err) => console.error('❌', err.message));

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true }).then(() => console.log('✅ بقای باستانی - پرو مکس اجرا شد!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));