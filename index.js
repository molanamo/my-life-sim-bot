const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// 🔑 توکن ربات
const BOT_TOKEN = process.env.BOT_TOKEN || 'TOKEN_Robot_Vared_Kon';
if (!BOT_TOKEN || BOT_TOKEN.includes('Vared')) {
    console.log('❌ TOKEN ro vared kon!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const DB_PATH = './data.json';

// 📂 دیتابیس
let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH)); } catch (e) {}
}

function saveDB() {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } catch (e) {}
}

// 🔢 توابع
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// 👤 مدیریت کاربر
function getUser(id, name) {
    if (!db.users[id]) {
        db.users[id] = { id, name, level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5 };
        saveDB();
    }
    return db.users[id];
}

// 📊 منو اصلی
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 وضعیت', 'status')],
        [Markup.button.callback('⚔️ نبرد سریع', 'quick_fight')],
        [Markup.button.callback('🏥 درمانگاه', 'heal_menu')],
    ]);
}

// ⚡ استارت
bot.start((ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    ctx.reply(`🏛️ سلام ${u.name}!\nلول: ${u.level} | ❤️ ${u.hp}/${u.maxHp} | 🥇 ${u.gold}`, mainMenu());
});

// 📊 وضعیت
bot.action('status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`📊 ${u.name}\n🎚️ لول: ${u.level}\n❤️ HP: ${u.hp}/${u.maxHp}\n🥇 طلا: ${u.gold}\n⚡ قدرت: ${u.power}`, backBtn());
});

// ⚔️ نبرد سریع
bot.action('quick_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.hp <= 0) return ctx.reply('❌ HP صفر! برو درمانگاه', backBtn());

    const enemyPower = rand(3, 10);
    const win = rand(0, 100) < 60;

    if (win) {
        const goldEarned = rand(10, 50);
        u.gold += goldEarned;
        u.xp += 15;
        if (u.xp >= 30) { u.level++; u.xp = 0; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
        saveDB();
        ctx.reply(`⚔️ پیروز شدی!\n🥇 +${goldEarned} طلا\n❤️ HP: ${u.hp}/${u.maxHp}`, backBtn());
    } else {
        const dmg = rand(10, 25);
        u.hp = Math.max(0, u.hp - dmg);
        saveDB();
        ctx.reply(`💀 شکست خوردی!\n❤️ -${dmg} HP\n❤️ HP: ${u.hp}/${u.maxHp}`, backBtn());
    }
});

// 🏥 درمانگاه
bot.action('heal_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`🏥 درمانگاه\n❤️ ${u.hp}/${u.maxHp}\nهزینه درمان: ۱۰ طلا`, Markup.inlineKeyboard([
        [Markup.button.callback('💊 درمان (۱۰ طلا)', 'do_heal')],
        [Markup.button.callback('🔙 بازگشت', 'back_main')],
    ]));
});

bot.action('do_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    if (u.gold < 10) return ctx.answerCbQuery('❌ طلا کافی نیست');
    u.gold -= 10;
    u.hp = u.maxHp;
    saveDB();
    ctx.reply(`✅ درمان شدی!\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold} طلا`, backBtn());
});

// 🔙 برگشت (فقط منوی اصلی - بدون خطا)
function backBtn() {
    return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]);
}

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`🏛️ منوی اصلی\n🎚️ لول: ${u.level} | 🥇 ${u.gold}`, mainMenu());
});

// ❌ خطاها
bot.catch((err, ctx) => {
    console.error('❌', err);
    ctx.reply('خطایی رخ داد. /start').catch(() => {});
});

// 🚀 اجرا
bot.launch(() => console.log('✅ ربات بدون خطا روشن شد!'));