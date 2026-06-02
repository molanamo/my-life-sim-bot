const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ==================== 🔑 تنظیمات ====================
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;
const DB_PATH = './life_game.json';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('❌ توکن ربات را وارد کن');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ==================== 📂 دیتابیس ====================
let db = { users: {}, marriages: [], market: [], chatHistory: [] };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {}, marriages: [], market: [], chatHistory: [] }; }
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

// ==================== 👤 مدیریت کاربر ====================
function createNewUser(id, name) {
    return {
        id: id,
        name: name,
        age: 0,
        gender: rand(0, 1) === 0 ? 'مرد' : 'زن',
        health: rand(60, 100),
        intelligence: rand(40, 80),
        happiness: 70,
        money: 0,
        education: 'بی‌سواد',
        job: 'بیکار',
        house: 'کلبه',
        car: 'ندارد',
        spouse: null,
        children: [],
        friends: [],
        popularity: 0,
        isAlive: true,
        birthFamily: rand(0, 2) === 0 ? 'فقیر' : (rand(0, 1) === 0 ? 'متوسط' : 'ثروتمند'),
        lastAction: Date.now(),
        cooldowns: {}
    };
}

function getUser(id, name) {
    const uid = String(id);
    if (!db.users[uid]) {
        db.users[uid] = createNewUser(uid, name);
        saveDB();
        return db.users[uid];
    }
    const u = db.users[uid];
    if (name) u.name = name;
    if (!u.friends) u.friends = [];
    if (!u.children) u.children = [];
    if (!u.cooldowns) u.cooldowns = {};
    if (u.isAlive === undefined) u.isAlive = true;
    return u;
}

// ==================== ⏱️ کول‌داون ====================
const CD = {
    work: 3600000,     // 1 ساعت
    study: 7200000,    // 2 ساعت
    social: 1800000,   // 30 دقیقه
    daily: 86400000    // 24 ساعت
};

function checkCD(u, action, ms) {
    const last = u.cooldowns[action] || 0;
    return (Date.now() - last >= ms) ? { can: true, rem: 0 } : { can: false, rem: ms - (Date.now() - last) };
}
function setCD(u, action) {
    u.cooldowns[action] = Date.now();
}

// ==================== 🎮 منوی اصلی بازی ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 وضعیت من', 'status'), Markup.button.callback('🎓 درس خواندن', 'study')],
        [Markup.button.callback('💼 کار کردن', 'work'), Markup.button.callback('👥 دوستان', 'friends')],
        [Markup.button.callback('💍 ازدواج', 'marriage'), Markup.button.callback('🛒 بازار', 'market_menu')],
        [Markup.button.callback('💬 چت عمومی', 'global_chat'), Markup.button.callback('🏆 رتبه‌بندی', 'rankings')],
        [Markup.button.callback('🎁 پاداش روزانه', 'daily'), Markup.button.callback('📖 راهنما', 'guide')]
    ]);
}

// ==================== 📊 وضعیت کاربر ====================
bot.action('status', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    const statusText = `📖 «زندگی‌نامه» - وضعیت ${u.name}
━━━━━━━━━━━━━━━━
🎂 سن: ${u.age} سال
❤️ سلامت: ${u.health} | 🧠 هوش: ${u.intelligence} | 😊 شادی: ${u.happiness}
💰 پول: ${u.money.toLocaleString()} سکه
🎓 تحصیلات: ${u.education}
💼 شغل: ${u.job}
🏠 خانه: ${u.house} | 🚗 ماشین: ${u.car}
💍 همسر: ${u.spouse || 'ندارد'}
👶 فرزندان: ${u.children.length}
👥 دوستان: ${u.friends.length}
🌟 محبوبیت: ${u.popularity}
🏷️ وضعیت: ${u.isAlive ? 'زنده' : 'درگذشته'}`;
    
    await ctx.editMessageText(statusText, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 🎓 درس خواندن ====================
bot.action('study', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'study', CD.study);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'study');
    
    const intelligenceGain = rand(1, 5);
    u.intelligence = Math.min(100, u.intelligence + intelligenceGain);
    
    // ارتقای تحصیلات خودکار
    if (u.intelligence >= 85 && u.education === 'کارشناسی') u.education = 'دکتری';
    else if (u.intelligence >= 70 && u.education === 'کاردانی') u.education = 'کارشناسی';
    else if (u.intelligence >= 50 && u.education === 'دیپلم') u.education = 'کاردانی';
    else if (u.intelligence >= 30 && u.education === 'بی‌سواد') u.education = 'دیپلم';
    
    const result = `📚 درس خواندی! 🧠 هوش +${intelligenceGain} (${u.intelligence}/100)
🎓 تحصیلات: ${u.education}`;
    
    await ctx.editMessageText(result, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 💼 کار کردن ====================
bot.action('work', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'work', CD.work);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'work');
    
    // محاسبه حقوق بر اساس تحصیلات و شغل
    let baseSalary = 0;
    if (u.education === 'دیپلم') baseSalary = 50;
    else if (u.education === 'کاردانی') baseSalary = 100;
    else if (u.education === 'کارشناسی') baseSalary = 200;
    else if (u.education === 'دکتری') baseSalary = 400;
    else baseSalary = 20;
    
    const intelligenceBonus = Math.floor(u.intelligence / 10);
    const earned = baseSalary + intelligenceBonus + rand(10, 50);
    
    u.money += earned;
    
    // تعیین عنوان شغل
    if (u.education === 'دکتری') u.job = 'مهندس ارشد';
    else if (u.education === 'کارشناسی') u.job = 'مهندس';
    else if (u.education === 'کاردانی') u.job = 'تکنسین';
    else if (u.education === 'دیپلم') u.job = 'کارمند';
    else u.job = 'کارگر ساده';
    
    const result = `💼 کار کردی! 🥇 ${earned} سکه دریافت کردی
💰 موجودی: ${u.money.toLocaleString()} سکه
💼 شغل: ${u.job}`;
    
    await ctx.editMessageText(result, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 👥 دوستان ====================
bot.action('friends', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    const onlineUsers = Object.values(db.users).filter(user => user.id !== u.id && user.isAlive);
    const friendList = u.friends.map(fid => {
        const friend = db.users[fid];
        return friend ? `👤 ${friend.name} (${friend.age} سال)` : '';
    }).filter(f => f);
    
    let friendsText = friendList.length ? friendList.join('\n') : 'هنوز دوستی نداری';
    
    const text = `👥 «دوستان» (${u.friends.length} نفر)
━━━━━━━━━━━━━━━━
${friendsText}

📝 /addfriend [آیدی] - درخواست دوستی
📝 /accept [آیدی] - قبول درخواست`;

    const btns = [];
    if (onlineUsers.length) {
        btns.push([Markup.button.callback('➕ درخواست دوستی', 'friend_request_menu')]);
    }
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
    
    await ctx.editMessageText(text, Markup.inlineKeyboard(btns));
});

bot.action('friend_request_menu', async (ctx) => {
    const u = getUser(ctx.from.id);
    const onlineUsers = Object.values(db.users).filter(user => user.id !== u.id && user.isAlive && !u.friends.includes(user.id));
    
    if (!onlineUsers.length) {
        return ctx.answerCbQuery('❌ کاربر آنلاین دیگری یافت نشد');
    }
    
    const buttons = onlineUsers.slice(0, 10).map(user => [
        Markup.button.callback(`➕ ${user.name} (${user.age} سال)`, `send_req_${user.id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 بازگشت', 'friends')]);
    
    await ctx.editMessageText('👥 کاربران آنلاین:', Markup.inlineKeyboard(buttons));
});

bot.action(/send_req_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const target = getUser(targetId);
    
    if (u.friends.includes(targetId)) return ctx.answerCbQuery('❌ قبلاً دوست هستید');
    
    // ذخیره درخواست در یک جای موقت (برای سادگی، پیام مستقیم می‌فرستیم)
    try {
        await bot.telegram.sendMessage(targetId, 
            `👋 ${u.name} به شما درخواست دوستی داد!
            
📝 /accept ${ctx.from.id} - قبول درخواست
📝 /reject ${ctx.from.id} - رد درخواست`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ قبول', `accept_friend_${ctx.from.id}`)],
                [Markup.button.callback('❌ رد', `reject_friend_${ctx.from.id}`)]
            ])
        );
        await ctx.answerCbQuery('✅ درخواست ارسال شد!');
    } catch(e) {
        await ctx.answerCbQuery('❌ کاربر در دسترس نیست');
    }
});

bot.action(/accept_friend_(.+)/, async (ctx) => {
    const requesterId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const requester = getUser(requesterId);
    
    if (u.friends.includes(requesterId)) return ctx.answerCbQuery('❌ قبلاً دوست هستید');
    
    u.friends.push(requesterId);
    requester.friends.push(ctx.from.id);
    
    // افزایش شادی و محبوبیت
    u.happiness = Math.min(100, u.happiness + 10);
    requester.happiness = Math.min(100, requester.happiness + 10);
    u.popularity += 5;
    requester.popularity += 5;
    
    saveDB();
    
    await ctx.answerCbQuery(`✅ شما و ${requester.name} الآن دوست هستید!`);
    await ctx.editMessageText(`🎉 شما درخواست دوستی ${requester.name} را قبول کردید!\n😊 شادی +۱۰ | 🌟 محبوبیت +۵`, 
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'friends')]]));
    
    try {
        await bot.telegram.sendMessage(requesterId, `🎉 ${u.name} درخواست دوستی شما را قبول کرد!`);
    } catch(e) {}
});

bot.action(/reject_friend_(.+)/, async (ctx) => {
    const requesterId = ctx.match[1];
    const requester = getUser(requesterId);
    await ctx.answerCbQuery(`❌ درخواست ${requester.name} رد شد`);
    await ctx.editMessageText(`❌ درخواست دوستی رد شد.`, 
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'friends')]]));
});

// ==================== 💍 ازدواج ====================
bot.action('marriage', async (ctx) => {
    const u = getUser(ctx.from.id);
    
    if (u.spouse) {
        const spouse = getUser(u.spouse);
        return ctx.editMessageText(`💍 شما با ${spouse?.name || 'همسرتان'} ازدواج کرده‌اید.
        
📝 /divorce - طلاق (هزینه: ۱۰۰۰ سکه)`,
            Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    }
    
    const singleUsers = Object.values(db.users).filter(user => 
        user.id !== u.id && 
        user.isAlive && 
        !user.spouse && 
        user.age >= 18 && 
        u.age >= 18
    );
    
    if (!singleUsers.length) {
        return ctx.editMessageText('❌ کاربر مجرد دیگری یافت نشد', 
            Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    }
    
    const buttons = singleUsers.slice(0, 10).map(user => [
        Markup.button.callback(`💍 ${user.name} (${user.age} سال)`, `propose_${user.id}`)
    ]);
    buttons.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
    
    await ctx.editMessageText('💍 کاربران مجرد:', Markup.inlineKeyboard(buttons));
});

bot.action(/propose_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const target = getUser(targetId);
    
    if (u.money < 500) return ctx.answerCbQuery('❌ برای خواستگاری ۵۰۰ سکه نیاز داری');
    if (u.spouse) return ctx.answerCbQuery('❌ شما متأهل هستید');
    if (target.spouse) return ctx.answerCbQuery('❌ این کاربر متأهل است');
    
    u.money -= 500;
    saveDB();
    
    try {
        await bot.telegram.sendMessage(targetId,
            `💍 ${u.name} از شما خواستگاری کرده است!
            
💰 مهریه: ۵۰۰ سکه
🎁 هدیه ازدواج: هر دو +۲۰ شادی

📝 /marry ${ctx.from.id} - قبول ازدواج
📝 /reject_marriage ${ctx.from.id} - رد`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ قبول ازدواج', `accept_marry_${ctx.from.id}`)],
                [Markup.button.callback('❌ رد', `reject_marry_${ctx.from.id}`)]
            ])
        );
        await ctx.answerCbQuery('✅ درخواست ازدواج ارسال شد!');
    } catch(e) {
        await ctx.answerCbQuery('❌ کاربر در دسترس نیست');
        u.money += 500;
        saveDB();
    }
});

bot.action(/accept_marry_(.+)/, async (ctx) => {
    const proposerId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const proposer = getUser(proposerId);
    
    if (u.spouse) return ctx.answerCbQuery('❌ شما متأهل هستید');
    if (proposer.spouse) return ctx.answerCbQuery('❌ طرف مقابل متأهل شده');
    
    u.spouse = proposerId;
    proposer.spouse = ctx.from.id;
    u.happiness = Math.min(100, u.happiness + 20);
    proposer.happiness = Math.min(100, proposer.happiness + 20);
    u.popularity += 30;
    proposer.popularity += 30;
    
    // اضافه شدن به لیست ازدواج‌ها
    db.marriages.push({
        couple: [ctx.from.id, proposerId],
        date: Date.now()
    });
    
    saveDB();
    
    await ctx.answerCbQuery(`🎉 شما با ${proposer.name} ازدواج کردید!`);
    await ctx.editMessageText(`🎊 تبریک! شما با ${proposer.name} ازدواج کردید!
    
😊 شادی +۲۰ | 🌟 محبوبیت +۳۰
💍 همسر: ${proposer.name}`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    
    try {
        await bot.telegram.sendMessage(proposerId, `🎊 ${u.name} درخواست ازدواج شما را قبول کرد!`);
    } catch(e) {}
});

// ==================== 🛒 بازار ====================
bot.action('market_menu', async (ctx) => {
    const u = getUser(ctx.from.id);
    
    const marketItems = db.market.filter(item => item.seller !== u.id);
    let marketText = '🛒 «بازار آزاد»\n━━━━━━━━━━━━━━\n';
    
    if (marketItems.length === 0) {
        marketText += 'هیچ کالایی برای فروش نیست.\n\n';
    } else {
        marketItems.slice(0, 10).forEach((item, idx) => {
            const seller = db.users[item.seller];
            marketText += `${idx+1}. ${item.item} - ${item.price} سکه (فروشنده: ${seller?.name})\n`;
        });
        marketText += '\n';
    }
    
    marketText += `💰 موجودی شما: ${u.money.toLocaleString()} سکه
🏠 خانه شما: ${u.house} | 🚗 ماشین: ${u.car}

📝 /sell [کالا] [قیمت] - فروش کالا
📝 /buy [شماره] - خرید کالا
📝 /upgrade_house - ارتقای خانه (۲۰۰۰ سکه)
📝 /upgrade_car - خرید ماشین (۱۰۰۰ سکه)`;
    
    await ctx.editMessageText(marketText, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.command('sell', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const item = args[1];
    const price = parseInt(args[2]);
    
    if (!item || !price) return ctx.reply('📝 /sell [کالا] [قیمت]\nمثال: /sell ماشین ۵۰۰');
    
    const validItems = ['ماشین', 'خانه', 'کتاب', 'جواهر'];
    if (!validItems.includes(item)) return ctx.reply('❌ کالا نامعتبر است');
    
    if (item === 'ماشین' && u.car === 'ندارد') return ctx.reply('❌ ماشینی نداری');
    if (item === 'خانه' && u.house === 'کلبه') return ctx.reply('❌ خانه‌ای برای فروش نداری');
    
    db.market.push({
        seller: u.id,
        item: item,
        price: price,
        date: Date.now()
    });
    saveDB();
    
    await ctx.reply(`✅ ${item} با قیمت ${price} سکه در بازار قرار گرفت`);
});

bot.command('buy', async (ctx) => {
    const u = getUser(ctx.from.id);
    const index = parseInt(ctx.message.text.split(' ')[1]) - 1;
    
    if (isNaN(index)) return ctx.reply('📝 /buy [شماره]\nمثال: /buy 1');
    
    const marketItems = db.market.filter(item => item.seller !== u.id);
    if (!marketItems[index]) return ctx.reply('❌ کالا یافت نشد');
    
    const item = marketItems[index];
    if (u.money < item.price) return ctx.reply(`❌ ${item.price} سکه نیاز داری`);
    
    const seller = getUser(item.seller);
    u.money -= item.price;
    seller.money += item.price;
    
    // انتقال کالا
    if (item.item === 'ماشین') {
        if (u.car !== 'ندارد') return ctx.reply('❌ شما قبلاً ماشین داری');
        u.car = 'دنا';
        seller.car = 'ندارد';
    } else if (item.item === 'خانه') {
        if (u.house !== 'کلبه') return ctx.reply('❌ شما قبلاً خانه داری');
        u.house = 'آپارتمان';
        seller.house = 'کلبه';
    }
    
    // حذف از بازار
    db.market = db.market.filter((_, idx) => idx !== db.market.indexOf(item));
    saveDB();
    
    await ctx.reply(`✅ ${item.item} را با ${item.price} سکه خریداری کردی!
💰 موجودی: ${u.money.toLocaleString()} سکه`);
});

bot.command('upgrade_house', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cost = 2000;
    
    if (u.money < cost) return ctx.reply(`❌ ${cost} سکه نیاز داری`);
    if (u.house === 'ویلایی') return ctx.reply('❌ خانه شما در بالاترین سطح است');
    
    u.money -= cost;
    if (u.house === 'کلبه') u.house = 'آپارتمان';
    else if (u.house === 'آپارتمان') u.house = 'ویلایی';
    
    saveDB();
    await ctx.reply(`✅ خانه شما به ${u.house} ارتقا یافت!
💰 موجودی: ${u.money.toLocaleString()} سکه`);
});

bot.command('upgrade_car', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cost = 1000;
    
    if (u.money < cost) return ctx.reply(`❌ ${cost} سکه نیاز داری`);
    if (u.car === 'تارا') return ctx.reply('❌ ماشین شما در بالاترین سطح است');
    
    u.money -= cost;
    if (u.car === 'ندارد') u.car = 'سمند';
    else if (u.car === 'سمند') u.car = 'دنا';
    else if (u.car === 'دنا') u.car = 'تارا';
    
    saveDB();
    await ctx.reply(`✅ ماشین شما به ${u.car} ارتقا یافت!
💰 موجودی: ${u.money.toLocaleString()} سکه`);
});

// ==================== 💬 چت عمومی ====================
bot.action('global_chat', async (ctx) => {
    const recentChats = db.chatHistory.slice(-20).map(msg => 
        `👤 ${msg.name}: ${msg.text}`
    ).join('\n');
    
    const text = `💬 «چت عمومی»
━━━━━━━━━━━━━━━━
${recentChats || 'هنوز پیامی فرستاده نشده'}

📝 برای ارسال پیام:
/chat [متن شما]`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.command('chat', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!message) return ctx.reply('📝 /chat [متن شما]');
    
    db.chatHistory.push({
        name: u.name,
        text: message,
        time: Date.now()
    });
    
    // نگهداری فقط ۱۰۰ پیام آخر
    if (db.chatHistory.length > 100) db.chatHistory = db.chatHistory.slice(-100);
    saveDB();
    
    await ctx.reply('✅ پیام شما در چت عمومی ارسال شد');
});

// ==================== 🏆 رتبه‌بندی ====================
bot.action('rankings', async (ctx) => {
    const users = Object.values(db.users).filter(u => u.isAlive);
    
    const richest = [...users].sort((a, b) => b.money - a.money).slice(0, 5);
    const smartest = [...users].sort((a, b) => b.intelligence - a.intelligence).slice(0, 5);
    const happiest = [...users].sort((a, b) => b.happiness - a.happiness).slice(0, 5);
    
    let text = '🏆 «رتبه‌بندی»\n━━━━━━━━━━━━━━\n\n💰 ثروتمندترین:\n';
    richest.forEach((u, i) => text += `${i+1}. ${u.name}: ${u.money.toLocaleString()} سکه\n`);
    
    text += '\n🧠 باهوش‌ترین:\n';
    smartest.forEach((u, i) => text += `${i+1}. ${u.name}: ${u.intelligence} هوش\n`);
    
    text += '\n😊 شادترین:\n';
    happiest.forEach((u, i) => text += `${i+1}. ${u.name}: ${u.happiness} شادی\n`);
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 🎁 پاداش روزانه ====================
bot.action('daily', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'daily', CD.daily);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'daily');
    
    const reward = rand(100, 500);
    u.money += reward;
    u.happiness = Math.min(100, u.happiness + 5);
    
    // افزایش سن هر روز (پیر شدن تدریجی)
    u.age++;
    
    // بررسی مرگ بر اساس سن و سلامت
    if (u.age >= 70 || u.health < 20) {
        u.isAlive = false;
        saveDB();
        await ctx.editMessageText(`🎁 پاداش روزانه: ${reward} سکه +۵ شادی
━━━━━━━━━━━━━━━━
⚰️ متأسفانه ${u.name} در سن ${u.age} سالگی درگذشت.
📜 میراث شما: ${u.money.toLocaleString()} سکه

با یک ربات جدید شروع کنید!`,
            Markup.inlineKeyboard([[Markup.button.callback('🔄 شروع مجدد', 'restart_game')]]));
        return;
    }
    
    saveDB();
    
    await ctx.editMessageText(`🎁 پاداش روزانه!
💰 +${reward} سکه (موجودی: ${u.money.toLocaleString()})
😊 +۵ شادی (${u.happiness}/100)
🎂 سن شما: ${u.age} سال`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('restart_game', async (ctx) => {
    const uid = String(ctx.from.id);
    db.users[uid] = createNewUser(uid, ctx.from.first_name);
    saveDB();
    await ctx.editMessageText('🔄 بازی ریست شد! از /start شروع کن.', mainMenu());
});

// ==================== 📖 راهنما ====================
bot.action('guide', async (ctx) => {
    const text = `📖 «راهنمای زندگی‌نامه»
━━━━━━━━━━━━━━━━
🎓 درس خواندن: افزایش هوش و تحصیلات
💼 کار کردن: کسب درآمد بر اساس تحصیلات
👥 دوستان: دوست شدن با دیگر کاربران
💍 ازدواج: پیوند با کاربر دیگر
🛒 بازار: خرید و فروش کالا
💬 چت عمومی: گفتگو با همه
🏆 رتبه‌بندی: مقایسه با دیگران
🎁 پاداش روزانه: پول + شادی + افزایش سن

📝 نکات مهم:
- هر روز سنتان یک سال بیشتر می‌شود
- در سن ۷۰ سالگی یا سلامت پایین، می‌میرید
- با دوستان و همسر، شادی بیشتری دارید
- با پول بیشتر، خانه و ماشین بهتر بخرید`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 🔙 بازگشت به منو ====================
bot.action('back_main', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u.isAlive) {
        await ctx.editMessageText('⚰️ شما درگذشته‌اید. برای شروع مجدد /start را بزنید.', mainMenu());
        return;
    }
    const text = `🎮 «زندگی‌نامه»
━━━━━━━━━━━━━━━━
👤 ${u.name} | 🎂 ${u.age} سال
❤️ ${u.health} | 🧠 ${u.intelligence} | 😊 ${u.happiness}
💰 ${u.money.toLocaleString()} سکه

یک گزینه را انتخاب کن:`;
    await ctx.editMessageText(text, mainMenu());
});

// ==================== 🏛️ استارت ====================
bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u.isAlive) {
        db.users[String(ctx.from.id)] = createNewUser(String(ctx.from.id), ctx.from.first_name);
        saveDB();
    }
    const text = `🎮 به بازی «زندگی‌نامه» خوش آمدی!
━━━━━━━━━━━━━━━━
👤 ${u.name} | 🎂 ${u.age} سال
❤️ سلامت: ${u.health} | 🧠 هوش: ${u.intelligence}
😊 شادی: ${u.happiness} | 💰 ${u.money} سکه

در این بازی می‌توانی درس بخوانی، کار کنی، دوست پیدا کنی، ازدواج کنی و با دیگران تعامل داشته باشی.

هر روز که وارد می‌شوی، یک سال پیرتر می‌شوی. مراقب سلامتت باش!

یک گزینه را انتخاب کن:`;
    await ctx.reply(text, mainMenu());
});

// ==================== کامندهای اضافی ====================
bot.command('accept', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const requesterId = args[1];
    if (!requesterId) return ctx.reply('📝 /accept [آیدی کاربر]');
    
    const u = getUser(ctx.from.id);
    const requester = getUser(requesterId);
    
    if (u.friends.includes(requesterId)) return ctx.reply('❌ قبلاً دوست هستید');
    
    u.friends.push(requesterId);
    requester.friends.push(ctx.from.id);
    u.happiness = Math.min(100, u.happiness + 10);
    requester.happiness = Math.min(100, requester.happiness + 10);
    saveDB();
    
    await ctx.reply(`✅ شما و ${requester.name} الآن دوست هستید!`);
    try {
        await bot.telegram.sendMessage(requesterId, `✅ ${u.name} درخواست دوستی شما را قبول کرد!`);
    } catch(e) {}
});

bot.command('reject', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const requesterId = args[1];
    if (!requesterId) return ctx.reply('📝 /reject [آیدی کاربر]');
    
    const requester = getUser(requesterId);
    await ctx.reply(`❌ درخواست دوستی ${requester.name} رد شد`);
});

bot.command('divorce', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u.spouse) return ctx.reply('❌ شما متأهل نیستید');
    if (u.money < 1000) return ctx.reply('❌ برای طلاق ۱۰۰۰ سکه نیاز داری');
    
    const spouse = getUser(u.spouse);
    u.money -= 1000;
    u.spouse = null;
    spouse.spouse = null;
    u.happiness = Math.max(0, u.happiness - 30);
    spouse.happiness = Math.max(0, spouse.happiness - 30);
    saveDB();
    
    await ctx.reply(`💔 شما از ${spouse.name} طلاق گرفتی! 😊 شادی -۳۰`);
    try {
        await bot.telegram.sendMessage(spouse.id, `💔 ${u.name} از شما طلاق گرفت! 😊 شادی -۳۰`);
    } catch(e) {}
});

bot.command('addfriend', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    if (!targetId) return ctx.reply('📝 /addfriend [آیدی عددی کاربر]');
    
    const u = getUser(ctx.from.id);
    const target = getUser(targetId);
    
    if (u.friends.includes(targetId)) return ctx.reply('❌ قبلاً دوست هستید');
    
    try {
        await bot.telegram.sendMessage(targetId,
            `👋 ${u.name} به شما درخواست دوستی داد!
            
📝 /accept ${ctx.from.id} - قبول درخواست
📝 /reject ${ctx.from.id} - رد درخواست`);
        await ctx.reply('✅ درخواست دوستی ارسال شد!');
    } catch(e) {
        await ctx.reply('❌ کاربر در دسترس نیست یا آیدی اشتباه است');
    }
});

bot.command('marry', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const proposerId = args[1];
    if (!proposerId) return ctx.reply('📝 /marry [آیدی کاربر]');
    
    const u = getUser(ctx.from.id);
    const proposer = getUser(proposerId);
    
    if (u.spouse) return ctx.reply('❌ شما متأهل هستید');
    if (proposer.spouse) return ctx.reply('❌ طرف مقابل متأهل شده');
    if (u.money < 500) return ctx.reply('❌ ۵۰۰ سکه برای مهریه نیاز داری');
    
    u.money -= 500;
    u.spouse = proposerId;
    proposer.spouse = ctx.from.id;
    u.happiness = Math.min(100, u.happiness + 20);
    proposer.happiness = Math.min(100, proposer.happiness + 20);
    saveDB();
    
    await ctx.reply(`🎊 تبریک! شما با ${proposer.name} ازدواج کردید!`);
    try {
        await bot.telegram.sendMessage(proposerId, `🎊 ${u.name} درخواست ازدواج شما را قبول کرد!`);
    } catch(e) {}
});

bot.command('help', async (ctx) => {
    const helpText = `📖 «راهنمای کامندها»
━━━━━━━━━━━━━━━━
/start - شروع بازی
/status - وضعیت من
/addfriend [آیدی] - درخواست دوستی
/accept [آیدی] - قبول دوستی
/reject [آیدی] - رد دوستی
/marry [آیدی] - ازدواج
/divorce - طلاق
/sell [کالا] [قیمت] - فروش در بازار
/buy [شماره] - خرید از بازار
/upgrade_house - ارتقای خانه
/upgrade_car - خرید ماشین
/chat [متن] - پیام در چت عمومی
/help - راهنما`;
    
    await ctx.reply(helpText);
});

// ==================== 🚀 اجرا ====================
bot.launch().then(() => console.log('✅ بازی «زندگی‌نامه» روشن شد!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));