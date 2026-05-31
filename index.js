'use strict';

const fs = require('fs');
const { Telegraf, Markup } = require('telegraf');

// تنظیمات ربات
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 5576592239;
const DB_PATH = './data.json';

// لود کردن دیتابیس
let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

const save = () => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// تابع برای ساخت پروفایل کاربر
const getUser = (id) => {
    if (!db.users[id]) {
        db.users[id] = { money: 100, level: 1, inventory: [], missionsDone: 0 };
        save();
    }
    return db.users[id];
};

// --- منوی اصلی ---
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('💰 کیف پول', 'wallet'), Markup.button.callback('🛒 فروشگاه', 'shop')],
    [Markup.button.callback('📜 ماموریت‌ها', 'missions'), Markup.button.callback('🏠 وضعیت خانه', 'home')],
    [Markup.button.callback('👑 پنل ادمین', 'admin')]
]);

bot.start((ctx) => {
    getUser(ctx.from.id);
    ctx.reply('⚔️ به دنیای بقا خوش آمدی!', mainMenu);
});

// --- سیستم ماموریت‌ها (۱۰۰ مرحله) ---
bot.action('missions', (ctx) => {
    const user = getUser(ctx.from.id);
    const missionId = user.missionsDone + 1;
    if (missionId > 100) return ctx.reply('تمام ماموریت‌ها تمام شده!');
    
    ctx.editMessageText(`📜 ماموریت شماره ${missionId}\nهدف: جمع‌آوری منابع برای بقا.\n\nپاداش: ${missionId * 50} سکه`, 
        Markup.inlineKeyboard([Markup.button.callback('✅ تکمیل ماموریت', `do_mission_${missionId}`), Markup.button.callback('🔙 بازگشت', 'back')]));
});

bot.action(/do_mission_(\d+)/, (ctx) => {
    const user = getUser(ctx.from.id);
    user.money += 50;
    user.missionsDone++;
    save();
    ctx.answerCbQuery('ماموریت انجام شد! پول به حسابت واریز شد.');
    ctx.editMessageText('✅ ماموریت با موفقیت انجام شد!', Markup.inlineKeyboard([Markup.button.callback('🔙 بازگشت', 'back')]));
});

// --- سیستم فروشگاه و خرید فارسی ---
bot.hears(/^خرید\s+(.+)$/, (ctx) => {
    const item = ctx.match[1];
    const user = getUser(ctx.from.id);
    if (user.money < 100) return ctx.reply('پول کافی نداری!');
    
    user.money -= 100;
    user.inventory.push(item);
    save();
    ctx.reply(`✅ ${item} خریداری شد!`);
});

// --- پنل ادمین ---
bot.action('admin', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('دسترسی نداری!');
    ctx.editMessageText('👑 پنل مدیریت فعال است.\nدستورات ادمین:\nخرید طلا [آیدی] (مثال: خرید طلا 5576592239)', 
        Markup.inlineKeyboard([Markup.button.callback('🔙 بازگشت', 'back')]));
});

// هندلر بازگشت
bot.action('back', (ctx) => ctx.editMessageText('منوی اصلی:', mainMenu));

bot.launch();
console.log('Bot is running with full PRO features.');
