const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const DB_PATH = './data.json';
const bot = new Telegraf(BOT_TOKEN);

let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {} }; }
}
function saveDB() { try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8'); } catch (e) {} }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// ==================== NPCهای فیک ====================
const FAKE_NPCS = [
    { n: '🗡️ کاوه آهنگر', lvl: 5, p: 15, title: '🥉 نوآموز', loss: [5, 12], rew: { gold: 20 }, xp: 10 },
    { n: '🏹 آرتemis پارسی', lvl: 8, p: 22, title: '🥉 جنگجو', loss: [8, 18], rew: { gold: 35 }, xp: 18 },
    { n: '⚔️ بهرام چوبینه', lvl: 12, p: 30, title: '🥈 شوالیه', loss: [12, 25], rew: { gold: 50 }, xp: 25 },
    { n: '🛡️ شیردل پارس', lvl: 15, p: 38, title: '🥈 قهرمان', loss: [15, 32], rew: { gold: 70 }, xp: 35 },
    { n: '🔥 آذربرزین', lvl: 18, p: 45, title: '🥇 استاد', loss: [20, 40], rew: { gold: 100 }, xp: 50 },
    { n: '💀 اژدهاکش', lvl: 22, p: 55, title: '🥇 گرندمستر', loss: [25, 50], rew: { gold: 150 }, xp: 70 },
    { n: '👑 خسرو پرویز', lvl: 25, p: 65, title: '👑 لرد', loss: [30, 60], rew: { gold: 200 }, xp: 100 },
    { n: '🦅 شاهین توس', lvl: 30, p: 75, title: '👑 افسانه', loss: [35, 70], rew: { gold: 300 }, xp: 150 },
    { n: '⚡ رعد پارس', lvl: 35, p: 90, title: '💎 اسطوره', loss: [40, 85], rew: { gold: 500 }, xp: 200 },
    { n: '🏆 رستم دستان', lvl: 40, p: 120, title: '🏆 جاودان', loss: [50, 100], rew: { gold: 1000 }, xp: 350 },
];

// ==================== خانه ====================
const HOME_UP = {
    2: { wood: 25, stone: 20, gold: 40, needLvl: 3 },
    3: { wood: 45, stone: 35, gold: 90, needLvl: 5 },
    4: { wood: 70, stone: 55, gold: 180, needLvl: 8 },
    5: { wood: 100, stone: 80, gold: 350, needLvl: 12 },
};

// ==================== کاربر ====================
function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = {
            id: uid, name: name || 'ناشناس',
            level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5,
            wood: 20, stone: 20, bread: 2,
            homeLvl: 1,
            arenaWins: 0, arenaLosses: 0, arenaRank: '🥉 نوآموز', arenaPoints: 0,
            logins: 1
        };
        saveDB();
    }
    const u = db.users[uid];
    if (name) u.name = name;
    u.logins = (u.logins || 0) + 1;
    u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 100;
    u.level = u.level || 1; u.xp = u.xp || 0; u.gold = u.gold || 100; u.power = u.power || 5;
    u.wood = u.wood || 0; u.stone = u.stone || 0; u.bread = u.bread || 0;
    u.homeLvl = u.homeLvl || 1;
    u.arenaWins = u.arenaWins || 0; u.arenaLosses = u.arenaLosses || 0;
    u.arenaPoints = u.arenaPoints || 0; u.arenaRank = u.arenaRank || '🥉 نوآموز';
    saveDB();
    return u;
}

function updateArenaRank(u) {
    const pts = u.arenaPoints || 0;
    if (pts >= 1000) u.arenaRank = '🏆 جاودان';
    else if (pts >= 700) u.arenaRank = '💎 اسطوره';
    else if (pts >= 500) u.arenaRank = '👑 افسانه';
    else if (pts >= 350) u.arenaRank = '👑 لرد';
    else if (pts >= 200) u.arenaRank = '🥇 گرندمستر';
    else if (pts >= 120) u.arenaRank = '🥇 استاد';
    else if (pts >= 70) u.arenaRank = '🥈 قهرمان';
    else if (pts >= 40) u.arenaRank = '🥈 شوالیه';
    else if (pts >= 20) u.arenaRank = '🥉 جنگجو';
    else u.arenaRank = '🥉 نوآموز';
}

// ==================== منو ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 آمار', 'm_status'), Markup.button.callback('🌲 جستجو', 'm_gather')],
        [Markup.button.callback('⚔️ نبرد', 'm_fight'), Markup.button.callback('🏟️ میدان', 'm_arena')],
        [Markup.button.callback('🏠 خانه', 'm_home'), Markup.button.callback('🛒 بازار', 'm_shop')],
        [Markup.button.callback('🏥 درمانگاه', 'm_heal')],
    ]);
}

function backBtn() {
    return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]);
}

// ==================== استارت ====================
bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    await ctx.reply(`🏛️ درود ${u.name}!\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold} زر\n🪵 ${u.wood} | 🪨 ${u.stone}\n🏟️ ${u.arenaRank}`, mainMenu());
});

bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    await ctx.editMessageText(`🏛️ بارگاه\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`, mainMenu());
});

// ==================== آمار ====================
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `📊 ${u.name}\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n⚡ ${u.power}\n🥇 ${u.gold} زر\n🪵 ${u.wood} چوب | 🪨 ${u.stone} سنگ\n🍞 ${u.bread} نان\n🏠 خانه لول ${u.homeLvl}\n🏟️ ${u.arenaRank} | ⭐${u.arenaPoints}`;
    await ctx.editMessageText(text, backBtn());
});

// ==================== جستجو ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const w = rand(1, 5);
    const s = rand(1, 3);
    u.wood += w;
    u.stone += s;
    u.xp = (u.xp || 0) + rand(5, 15);
    if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
    saveDB();
    await ctx.editMessageText(`🌲 جستجو...\n🪵 +${w} چوب\n🪨 +${s} سنگ`, backBtn());
});

// ==================== نبرد ====================
bot.action('m_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', backBtn());
    const enemy = { n: '🐺 گرگ', p: 8, loss: [5, 15], gold: 10, xp: 8 };
    const win = rand(0, 100) < 60;
    const dmg = rand(enemy.loss[0], enemy.loss[1]);
    u.hp = Math.max(0, u.hp - dmg);
    let text;
    if (win) { u.gold += enemy.gold; u.xp = (u.xp || 0) + enemy.xp; if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; } text = `⚔️ ${enemy.n}\n✅ پیروزی!\n🥇 +${enemy.gold}\n❤️ -${dmg}`; }
    else { text = `⚔️ ${enemy.n}\n❌ شکست!\n❤️ -${dmg}`; }
    saveDB();
    await ctx.editMessageText(text, backBtn());
});

// ==================== 🏟️ میدان ====================
bot.action('m_arena', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', backBtn());
    const text = `🏟️ «میدان پهلوانی»\n👤 ${u.name}\n🏆 ${u.arenaRank} | ⭐${u.arenaPoints}\n✅ ${u.arenaWins} | ❌ ${u.arenaLosses}`;
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ نبرد سریع (NPC)', 'arena_npc')],
        [Markup.button.callback('👤 نبرد با کاربران', 'arena_pvp')],
        [Markup.button.callback('🏆 رده‌بندی', 'arena_ranks')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('arena_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', backBtn());
    const suitableNPCs = FAKE_NPCS.filter(n => Math.abs(n.lvl - u.level) <= 5);
    const npc = suitableNPCs.length > 0 ? suitableNPCs[rand(0, suitableNPCs.length - 1)] : FAKE_NPCS[0];
    const win = rand(0, 100) < 55;
    const dmg = rand(npc.loss[0], npc.loss[1]);
    u.hp = Math.max(0, u.hp - dmg);
    let text;
    if (win) {
        u.gold += npc.rew.gold; u.xp = (u.xp || 0) + npc.xp;
        if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
        u.arenaWins++; u.arenaPoints += rand(10, 30); updateArenaRank(u);
        text = `🏟️ ${npc.n} (${npc.title})\n✅ پیروزی!\n🥇 +${npc.rew.gold}\n⭐ +${rand(10, 30)} امتیاز\n❤️ -${dmg}\n🏆 ${u.arenaRank}`;
    } else { u.arenaLosses++; text = `🏟️ ${npc.n}\n❌ شکست!\n❤️ -${dmg}`; }
    saveDB();
    await ctx.editMessageText(text, backBtn());
});

bot.action('arena_pvp', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', backBtn());
    const enemies = Object.values(db.users).filter(e => e.id !== u.id && (e.hp || 100) > 0);
    if (!enemies.length) return ctx.editMessageText('❌ حریفی نیست!', backBtn());
    const enemy = enemies[rand(0, enemies.length - 1)];
    const win = rand(0, 100) < 50;
    const dmg = rand(10, 30);
    u.hp = Math.max(0, u.hp - dmg);
    enemy.hp = Math.max(0, (enemy.hp || 100) - dmg);
    let text;
    if (win) {
        const gr = rand(20, 50); u.gold += gr; u.arenaWins++; u.arenaPoints += rand(15, 40); updateArenaRank(u);
        text = `🏟️ ${enemy.name}\n✅ پیروزی!\n🥇 +${gr}\n⭐ +${rand(15, 40)}\n❤️ -${dmg}\n🏆 ${u.arenaRank}`;
    } else { u.arenaLosses++; text = `🏟️ ${enemy.name}\n❌ شکست!\n❤️ -${dmg}`; }
    saveDB();
    await ctx.editMessageText(text, backBtn());
});

bot.action('arena_ranks', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    await ctx.editMessageText(`🏆 رده‌بندی:\n🏆 جاودان: ۱۰۰۰+\n💎 اسطوره: ۷۰۰+\n👑 افسانه: ۵۰۰+\n👑 لرد: ۳۵۰+\n🥇 گرندمستر: ۲۰۰+\n🥇 استاد: ۱۲۰+\n🥈 قهرمان: ۷۰+\n🥈 شوالیه: ۴۰+\n🥉 جنگجو: ۲۰+\n🥉 نوآموز: ۰+\n\n👤 تو: ${u.arenaRank} | ⭐${u.arenaPoints}`, backBtn());
});

// ==================== 🏠 خانه ====================
bot.action('m_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    let upText = '🏆 حداکثر';
    if (next) upText = `⬆️ ارتقا به لول ${u.homeLvl + 1}\n🪵 ${next.wood} | 🪨 ${next.stone} | 🥇 ${next.gold}\n🎚️ لول لازم: ${next.needLvl}`;
    const text = `🏠 خانه لول ${u.homeLvl}\n\n${upText}`;
    const btns = [];
    if (next) btns.push([Markup.button.callback('⬆️ ارتقا', 'up_home')]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'm_main')]);
    await ctx.editMessageText(text, Markup.inlineKeyboard(btns));
});

bot.action('up_home', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const next = HOME_UP[u.homeLvl + 1];
    if (!next) return ctx.answerCbQuery('🏆 حداکثر');
    if (u.level < next.needLvl) return ctx.answerCbQuery(`❌ لول ${next.needLvl} لازمه`);
    if (u.wood < next.wood || u.stone < next.stone || u.gold < next.gold) return ctx.answerCbQuery('❌ منابع کافی نیست');
    u.wood -= next.wood; u.stone -= next.stone; u.gold -= next.gold;
    u.homeLvl++; saveDB();
    await ctx.editMessageText(`🏠 خانه به لول ${u.homeLvl} ارتقا یافت!`, backBtn());
});

// ==================== 🛒 بازار ====================
bot.action('m_shop', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('🛒 بازار\n\n📝 /buy [چیز] [تعداد]\n📝 /sell [چیز] [تعداد]\n\n🪵 چوب: خرید ۸ | فروش ۴\n🪨 سنگ: خرید ۱۰ | فروش ۵\n🍞 نان: خرید ۱۰ | فروش ۵', backBtn());
});

bot.command('buy', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.trim().split(/\s+/);
    const item = args[1]; const amt = Number(args[2] || 1);
    const prices = { wood: 8, stone: 10, bread: 10 };
    if (!prices[item]) return ctx.reply('❌ چیز نامعتبر');
    const total = prices[item] * amt;
    if (u.gold < total) return ctx.reply(`❌ ${total} زر لازم داری`);
    u.gold -= total;
    if (item === 'wood') u.wood += amt;
    if (item === 'stone') u.stone += amt;
    if (item === 'bread') u.bread += amt;
    saveDB();
    await ctx.reply(`✅ ${amt} ${item} خریداری شد\n💰 ${u.gold} زر`);
});

bot.command('sell', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.trim().split(/\s+/);
    const item = args[1]; const amt = Number(args[2] || 1);
    const prices = { wood: 4, stone: 5, bread: 5 };
    if (!prices[item]) return ctx.reply('❌ چیز نامعتبر');
    if ((item === 'wood' && u.wood < amt) || (item === 'stone' && u.stone < amt) || (item === 'bread' && u.bread < amt)) return ctx.reply('❌ نداری');
    if (item === 'wood') u.wood -= amt;
    if (item === 'stone') u.stone -= amt;
    if (item === 'bread') u.bread -= amt;
    u.gold += prices[item] * amt;
    saveDB();
    await ctx.reply(`✅ ${amt} ${item} فروخته شد\n💰 ${u.gold} زر`);
});

// ==================== درمانگاه ====================
bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.gold < 10) return ctx.editMessageText('❌ ۱۰ زر نداری', backBtn());
    u.gold -= 10; u.hp = u.maxHp; saveDB();
    await ctx.editMessageText(`🏥 درمان شدی!\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}`, backBtn());
});

// ==================== اجرا ====================
bot.launch({ dropPendingUpdates: true }).then(() => console.log('✅ اجرا شد!')).catch((err) => console.error('❌', err.message));