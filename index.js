const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const DB_PATH = './data.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('❌ TOKEN ro vared kon!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// 📂 دیتابیس
let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH)); } catch (e) {}
}

function saveDB() {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } catch (e) {}
}

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// 👤 کاربر
function getUser(id, name) {
    if (!db.users[id]) {
        db.users[id] = { id, name, level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5 };
        saveDB();
    }
    if (name) db.users[id].name = name;
    return db.users[id];
}

// 📊 منو اصلی
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 وضعیت', 'm_status')],
        [Markup.button.callback('⚔️ نبرد سریع', 'm_fight')],
        [Markup.button.callback('🏥 درمانگاه', 'm_heal')],
    ]);
}

// 🔙 دکمه برگشت ساده
function backBtn() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'm_main')]
    ]);
}

// ⚡ استارت
bot.start((ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    ctx.reply(`🏛️ ${u.name}!\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}`, mainMenu());
});

// 🏛️ منوی اصلی
bot.action('m_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`🏛️ منوی اصلی\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}`, mainMenu());
});

// 📊 وضعیت
bot.action('m_status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`📊 ${u.name}\n🎚️ لول: ${u.level}\n❤️ HP: ${u.hp}/${u.maxHp}\n🥇 طلا: ${u.gold}\n⚡ قدرت: ${u.power}`, backBtn());
});

// ⚔️ نبرد
bot.action('m_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) {
        return ctx.reply('❌ HP صفر! برو درمانگاه', backBtn());
    }
    ctx.reply('⚔️ آماده نبرد!', Markup.inlineKeyboard([
        [Markup.button.callback('⚔️ شروع نبرد', 'do_fight')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('do_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) {
        return ctx.reply('❌ HP صفر!', backBtn());
    }

    const win = rand(0, 100) < 60;
    if (win) {
        const gold = rand(10, 50);
        u.gold += gold;
        u.xp = (u.xp || 0) + 15;
        while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
        saveDB();
        ctx.reply(`⚔️ پیروزی!\n🥇 +${gold}\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
    } else {
        const dmg = rand(10, 25);
        u.hp = Math.max(0, u.hp - dmg);
        saveDB();
        ctx.reply(`💀 شکست!\n❤️ -${dmg}\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
    }
});

// 🏥 درمانگاه
bot.action('m_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`🏥 درمانگاه\n❤️ ${u.hp}/${u.maxHp}\n💰 درمان: ۱۰ طلا`, Markup.inlineKeyboard([
        [Markup.button.callback('💊 درمان', 'do_heal')],
        [Markup.button.callback('🔙 بازگشت', 'm_main')],
    ]));
});

bot.action('do_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp >= u.maxHp) return ctx.answerCbQuery('❤️ کامل');
    if (u.gold < 10) return ctx.answerCbQuery('❌ طلا کمه');
    u.gold -= 10;
    u.hp = u.maxHp;
    saveDB();
    ctx.reply(`✅ درمان شدی!\n❤️ ${u.hp}/${u.maxHp}`, backBtn());
});

// ❌ خطا
bot.catch((err) => console.error('❌', err.message));

// 🚀 اجرا
bot.launch(() => console.log('✅ ربات اجرا شد!'));