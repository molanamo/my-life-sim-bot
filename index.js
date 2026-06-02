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

function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = { id: uid, name: name || 'ناشناس', level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5, logins: 1 };
        saveDB();
    }
    const u = db.users[uid];
    if (name) u.name = name;
    u.logins = (u.logins || 0) + 1;
    u.hp = u.hp ?? 100; u.maxHp = u.maxHp || 100;
    u.level = u.level || 1; u.xp = u.xp || 0; u.gold = u.gold || 100;
    saveDB();
    return u;
}

function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 آمار', 'm_status'), Markup.button.callback('🌲 جستجو', 'm_gather')],
        [Markup.button.callback('⚔️ نبرد', 'm_fight'), Markup.button.callback('🏥 درمانگاه', 'm_heal')],
    ]);
}

bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    await ctx.reply(`🏛️ درود ${u.name}!\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`, mainMenu());
});

bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    await ctx.editMessageText(`📊 ${u.name}\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n⚡ ${u.power}\n🥇 ${u.gold}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]));
});

bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    await ctx.editMessageText(`🏛️ بارگاه\n🎚️ لول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`, mainMenu());
});

bot.action('m_gather', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    const gold = rand(5, 25);
    u.gold += gold;
    u.xp = (u.xp || 0) + rand(5, 15);
    if (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
    saveDB();
    await ctx.editMessageText(`🌲 جستجو...\n🥇 +${gold} زر`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]));
});

bot.action('m_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.editMessageText('❌ HP صفر!', Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]));
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
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]));
});

bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.gold < 10) return ctx.editMessageText('❌ ۱۰ زر نداری', Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]));
    u.gold -= 10; u.hp = u.maxHp; saveDB();
    await ctx.editMessageText(`🏥 درمان شدی!\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'm_main')]]));
});

bot.launch({ dropPendingUpdates: true }).then(() => console.log('✅ اجرا شد!')).catch((err) => console.error('❌', err.message));