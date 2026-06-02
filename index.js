const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN || 'TOKEN_Robot_Vared_Kon';
if (!BOT_TOKEN || BOT_TOKEN.includes('Vared')) {
    console.log('❌ TOKEN ro vared kon!');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const DB_PATH = './data.json';

let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH)); } catch (e) {}
}

function saveDB() {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } catch (e) {}
}

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function getUser(id, name) {
    if (!db.users[id]) {
        db.users[id] = { id, name, level: 1, xp: 0, gold: 100, hp: 100, maxHp: 100, power: 5 };
        saveDB();
    }
    if (name) db.users[id].name = name;
    return db.users[id];
}

function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 وضعیت', 'status')],
        [Markup.button.callback('⚔️ نبرد سریع', 'quick_fight')],
        [Markup.button.callback('🏥 درمانگاه', 'heal_menu')],
    ]);
}

// تابع کمکی برای برگشت
async function goTo(ctx, page) {
    try { await ctx.answerCbQuery(); } catch (e) {}
    try { await ctx.deleteMessage().catch(() => {}); } catch (e) {}
    
    const u = getUser(ctx.from.id);
    
    if (page === 'main') {
        return ctx.reply(`🏛️ منوی اصلی\n🎚️ لول: ${u.level} | 🥇 ${u.gold}`, mainMenu());
    }
    if (page === 'status') {
        return ctx.reply(`📊 ${u.name}\n🎚️ لول: ${u.level}\n❤️ HP: ${u.hp}/${u.maxHp}\n🥇 ${u.gold}\n⚡ قدرت: ${u.power}`, goBackBtn('main'));
    }
    if (page === 'fight') {
        return ctx.reply('⚔️ آماده نبرد!', Markup.inlineKeyboard([
            [Markup.button.callback('⚔️ شروع نبرد', 'do_fight')],
            [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'main')],
        ]));
    }
    if (page === 'heal') {
        return ctx.reply(`🏥 درمانگاه\n❤️ ${u.hp}/${u.maxHp}\n💰 درمان: ۱۰ طلا\n🥇 موجودی: ${u.gold}`, Markup.inlineKeyboard([
            [Markup.button.callback('💊 درمان (۱۰ طلا)', 'do_heal')],
            [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'main')],
        ]));
    }
}

function goBackBtn(target) {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🔙 بازگشت', target)],
        [Markup.button.callback('🏛️ منوی اصلی', 'main')],
    ]);
}

// همه دکمه‌ها با callback_data ساده
bot.action('main', async (ctx) => goTo(ctx, 'main'));
bot.action('status', async (ctx) => goTo(ctx, 'status'));
bot.action('quick_fight', async (ctx) => goTo(ctx, 'fight'));
bot.action('heal_menu', async (ctx) => goTo(ctx, 'heal'));

// نبرد
bot.action('do_fight', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp <= 0) {
        return ctx.reply('❌ HP صفر! برو درمانگاه', goBackBtn('heal'));
    }

    const enemyPower = rand(3, 10);
    const win = rand(0, 100) < 60;

    if (win) {
        const goldEarned = rand(10, 50);
        u.gold += goldEarned;
        u.xp = (u.xp || 0) + 15;
        while (u.xp >= 30) { u.xp -= 30; u.level++; u.maxHp += 10; u.hp = u.maxHp; u.power += 2; }
        saveDB();
        ctx.reply(`⚔️ پیروزی!\n🥇 +${goldEarned}\n❤️ ${u.hp}/${u.maxHp}`, goBackBtn('fight'));
    } else {
        const dmg = rand(10, 25);
        u.hp = Math.max(0, u.hp - dmg);
        saveDB();
        ctx.reply(`💀 شکست!\n❤️ -${dmg}\n❤️ ${u.hp}/${u.maxHp}`, goBackBtn('fight'));
    }
});

// درمان
bot.action('do_heal', async (ctx) => {
    await ctx.answerCbQuery();
    const u = getUser(ctx.from.id);
    
    if (u.hp >= u.maxHp) return ctx.answerCbQuery('❤️ HP کامل!');
    if (u.gold < 10) return ctx.answerCbQuery('❌ طلا کافی نیست');
    
    u.gold -= 10;
    u.hp = u.maxHp;
    saveDB();
    
    ctx.reply(`✅ درمان شدی!\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}`, goBackBtn('heal'));
});

// استارت
bot.start((ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    ctx.reply(`🏛️ ${u.name}!\n🎚️ لول: ${u.level}\n❤️ ${u.hp}/${u.maxHp}\n🥇 ${u.gold}`, mainMenu());
});

// خطا
bot.catch((err) => console.error('❌', err.message));

// اجرا
bot.launch(() => console.log('✅ اجرا شد!'));