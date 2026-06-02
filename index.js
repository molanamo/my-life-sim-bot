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

// ==================== کاربر ====================
function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = { id: uid, name: name || 'ناشناس', level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5, arenaWins: 0, arenaLosses: 0, arenaRank: '🥉 نوآموز', arenaPoints: 0, logins: 1 };
        saveDB();
    }
    const u = db.users[uid];
    if (name) u.name = name;
    u.logins = (u.logins || 0) + 1;
    u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 100;
    u.level = u.level || 1; u.xp = u.xp || 0; u.gold = u.gold || 100; u.power = u.power || 5;
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
        [Markup.button.callback('🏥 درمانگاه', 'm_heal')],
    ]);
}

function backBtn() {
    return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]);
}

// ==================== استارت ====================
bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    await ctx.reply(`🏛️ درود ${u.name}!\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}\n🏟️ رتبه: ${u.arenaRank}`, mainMenu());
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
    const text = `📊 ${u.name}\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n⚡ ${u.power}\n🥇 ${u.gold} زر\n🏟️ میدان: ${u.arenaRank}\n⭐ ${u.arenaPoints} امتیاز\n✅ ${u.arenaWins} برد | ❌ ${u.arenaLosses} باخت`;
    await ctx.editMessageText(text, backBtn());
});

// ==================== جستجو ====================
bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const gold = rand(5, 25);
    u.gold += gold;
    u.xp = (u.xp || 0) + rand(5, 15);
    if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
    saveDB();
    await ctx.editMessageText(`🌲 جستجو...\n🥇 +${gold} زر`, backBtn());
});

// ==================== نبرد ====================
bot.action('m_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر! برو درمانگاه', backBtn());
    const enemy = { n: '🐺 گرگ', p: 8, loss: [5, 15], gold: 10, xp: 8 };
    const win = rand(0, 100) < 60;
    const dmg = rand(enemy.loss[0], enemy.loss[1]);
    u.hp = Math.max(0, u.hp - dmg);
    let text;
    if (win) {
        u.gold += enemy.gold;
        u.xp = (u.xp || 0) + enemy.xp;
        if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
        text = `⚔️ ${enemy.n}\n✅ پیروزی!\n🥇 +${enemy.gold}\n✨ +${enemy.xp} XP\n❤️ -${dmg}`;
    } else {
        text = `⚔️ ${enemy.n}\n❌ شکست!\n❤️ -${dmg}`;
    }
    saveDB();
    await ctx.editMessageText(text, backBtn());
});

// ==================== 🏟️ میدان (Arena) ====================
bot.action('m_arena', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر! برو درمانگاه', backBtn());
    
    const text = `🏟️ «میدان پهلوانی»\n━━━━━━━━━━━━\n👤 ${u.name}\n🏆 رتبه: ${u.arenaRank}\n⭐ امتیاز: ${u.arenaPoints}\n✅ ${u.arenaWins} برد | ❌ ${u.arenaLosses} باخت`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ نبرد سریع (NPC)', 'arena_npc')],
        [Markup.button.callback('👤 نبرد با کاربران', 'arena_pvp')],
        [Markup.button.callback('🏆 رده‌بندی', 'arena_ranks')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

// نبرد با NPC فیک
bot.action('arena_npc', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', backBtn());
    
    // انتخاب NPC متناسب با لول کاربر
    const suitableNPCs = FAKE_NPCS.filter(n => Math.abs(n.lvl - u.level) <= 5);
    const npc = suitableNPCs.length > 0 ? suitableNPCs[rand(0, suitableNPCs.length - 1)] : FAKE_NPCS[0];
    
    const win = rand(0, 100) < 55;
    const dmg = rand(npc.loss[0], npc.loss[1]);
    u.hp = Math.max(0, u.hp - dmg);
    let text;
    
    if (win) {
        u.gold += npc.rew.gold;
        u.xp = (u.xp || 0) + npc.xp;
        if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
        u.arenaWins = (u.arenaWins || 0) + 1;
        u.arenaPoints = (u.arenaPoints || 0) + rand(10, 30);
        updateArenaRank(u);
        text = `🏟️ نبرد با ${npc.n}\n${npc.title}\n━━━━━━━━━━━━\n✅ پیروزی!\n🥇 +${npc.rew.gold} زر\n✨ +${npc.xp} XP\n⭐ +${rand(10, 30)} امتیاز\n❤️ -${dmg}\n\n🏆 رتبه: ${u.arenaRank}`;
    } else {
        u.arenaLosses = (u.arenaLosses || 0) + 1;
        text = `🏟️ نبرد با ${npc.n}\n${npc.title}\n━━━━━━━━━━━━\n❌ شکست!\n❤️ -${dmg}\n\n💪 قوی‌تر برگرد!`;
    }
    saveDB();
    await ctx.editMessageText(text, backBtn());
});

// نبرد با کاربران واقعی
bot.action('arena_pvp', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', backBtn());
    
    const enemies = Object.values(db.users).filter(e => e.id !== u.id && (e.hp || 100) > 0);
    if (!enemies.length) return ctx.editMessageText('❌ هیچ مبارزی در میدان نیست!', backBtn());
    
    const enemy = enemies[rand(0, enemies.length - 1)];
    const win = rand(0, 100) < 50;
    const dmg = rand(10, 30);
    u.hp = Math.max(0, u.hp - dmg);
    enemy.hp = Math.max(0, (enemy.hp || 100) - dmg);
    let text;
    
    if (win) {
        const gr = rand(20, 50);
        u.gold += gr;
        u.arenaWins = (u.arenaWins || 0) + 1;
        u.arenaPoints = (u.arenaPoints || 0) + rand(15, 40);
        updateArenaRank(u);
        text = `🏟️ نبرد با ${enemy.name || 'ناشناس'}\n━━━━━━━━━━━━\n✅ پیروزی!\n🥇 +${gr} زر\n⭐ +${rand(15, 40)} امتیاز\n❤️ -${dmg}\n\n🏆 رتبه: ${u.arenaRank}`;
    } else {
        u.arenaLosses = (u.arenaLosses || 0) + 1;
        text = `🏟️ نبرد با ${enemy.name || 'ناشناس'}\n━━━━━━━━━━━━\n❌ شکست!\n❤️ -${dmg}`;
    }
    saveDB();
    await ctx.editMessageText(text, backBtn());
});

// رده‌بندی
bot.action('arena_ranks', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const text = `🏆 رده‌بندی میدان:\n━━━━━━━━━━━━\n🏆 جاودان: ۱۰۰۰+\n💎 اسطوره: ۷۰۰+\n👑 افسانه: ۵۰۰+\n👑 لرد: ۳۵۰+\n🥇 گرندمستر: ۲۰۰+\n🥇 استاد: ۱۲۰+\n🥈 قهرمان: ۷۰+\n🥈 شوالیه: ۴۰+\n🥉 جنگجو: ۲۰+\n🥉 نوآموز: ۰+\n\n👤 رتبه تو: ${u.arenaRank}\n⭐ ${u.arenaPoints} امتیاز`;
    await ctx.editMessageText(text, backBtn());
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