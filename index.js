const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// 🔑 توکن
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
        [Markup.button.callback('📊 وضعیت', 'status')],
        [Markup.button.callback('⚔️ نبرد سریع', 'quick_fight')],
        [Markup.button.callback('🏥 درمانگاه', 'heal_menu')],
    ]);
}

// 🔙 دکمه برگشت
function backBtn(target) {
    return Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', `back_${target}`)]]);
}

// 🔙 هندلر برگشت
bot.action(/back_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const target = ctx.match[1];
    if (target === 'heal') return bot.action('heal_menu')(ctx);
    if (target === 'fight') return bot.action('quick_fight')(ctx);
    if (target === 'status') return bot.action('status')(ctx);
    if (target === 'main') {
        const u = getUser(ctx.from.id);
        return ctx.reply('🏛️ منوی اصلی', mainMenu());
    }
    // پیش‌فرض: برگشت به منوی اصلی
    return ctx.reply('🏛️ منوی اصلی', mainMenu());
});

// ⚡ استارت
bot.start((ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    ctx.reply(`🏛️ سلام ${u.name}!\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold} طلا`, mainMenu());
});

// 📊 وضعیت
bot.action('status', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(
        `📊 ${u.name}\n━━━━━━━━━━━━\n🎚️ لول: ${u.level}\n✨ XP: ${u.xp || 0}/30\n❤️ HP: ${u.hp}/${u.maxHp}\n⚡ قدرت: ${u.power}\n🥇 طلا: ${u.gold}`,
        backBtn('main')
    );
});

// ⚔️ نبرد سریع
bot.action('quick_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) {
        return ctx.reply('❌ HP صفر! برو درمانگاه', backBtn('fight'));
    }

    const enemyPower = rand(3, 10);
    const winChance = 50 + (u.power - enemyPower) * 5;
    const win = rand(0, 100) < Math.max(10, Math.min(90, winChance));

    if (win) {
        const goldEarned = rand(10, 50);
        const xpEarned = 15;
        u.gold += goldEarned;
        u.xp = (u.xp || 0) + xpEarned;
        
        // لول آپ
        while (u.xp >= 30) {
            u.xp -= 30;
            u.level++;
            u.maxHp += 10;
            u.hp = u.maxHp;
            u.power += 2;
        }
        
        saveDB();
        ctx.reply(
            `⚔️ پیروز شدی!\n━━━━━━━━━━━━\n✨ +${xpEarned} XP\n🥇 +${goldEarned} طلا\n❤️ HP: ${u.hp}/${u.maxHp}`,
            backBtn('fight')
        );
    } else {
        const dmg = rand(10, 25);
        u.hp = Math.max(0, u.hp - dmg);
        saveDB();
        ctx.reply(
            `💀 شکست خوردی!\n━━━━━━━━━━━━\n❤️ -${dmg} HP\n❤️ HP: ${u.hp}/${u.maxHp}\n💊 برو درمانگاه!`,
            backBtn('fight')
        );
    }
});

// 🏥 درمانگاه
bot.action('heal_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(
        `🏥 درمانگاه\n━━━━━━━━━━━━\n❤️ HP: ${u.hp}/${u.maxHp}\n💰 هزینه درمان: ۱۰ طلا\n🥇 موجودی: ${u.gold} طلا`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💊 درمان (۱۰ طلا)', 'do_heal')],
            [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'back_main')],
        ])
    );
});

// 💊 انجام درمان
bot.action('do_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp >= u.maxHp) {
        return ctx.answerCbQuery('❤️ HP کامل است!');
    }
    
    if (u.gold < 10) {
        return ctx.answerCbQuery('❌ ۱۰ طلا نداری!');
    }
    
    u.gold -= 10;
    u.hp = u.maxHp;
    saveDB();
    
    ctx.reply(
        `✅ درمان شدی!\n━━━━━━━━━━━━\n❤️ HP: ${u.hp}/${u.maxHp}\n🥇 طلا: ${u.gold}`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔙 بازگشت به درمانگاه', 'back_heal')],
            [Markup.button.callback('🏛️ منوی اصلی', 'back_main')],
        ])
    );
});

// 🔙 برگشت به منوی اصلی
bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    ctx.reply(`🏛️ منوی اصلی\n🎚️ لول: ${u.level} | 🥇 ${u.gold}`, mainMenu());
});

// ❌ مدیریت خطا
bot.catch((err, ctx) => {
    console.error('❌ خطا:', err.message);
    try {
        ctx.reply('❌ خطایی رخ داد. /start رو بزن').catch(() => {});
    } catch (e) {}
});

// 🚀 اجرا
bot.launch(() => console.log('✅ ربات با موفقیت اجرا شد!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));