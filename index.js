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
let db = { users: {}, marriages: [], market: [], chatHistory: [], pendingRequests: {}, mutedUsers: {}, bannedUsers: {}, warnings: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {}, marriages: [], market: [], chatHistory: [], pendingRequests: {}, mutedUsers: {}, bannedUsers: {}, warnings: {} }; }
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

function hpBar(value, length = 10) {
    const filled = Math.round((value / 100) * length);
    return '❤️'.repeat(filled) + '🖤'.repeat(length - filled);
}

// ==================== 🚫 کلمات فحش (لیست سیاه) ====================
const BAD_WORDS = ['فحش1', 'فحش2', 'کیری', 'کسکش', 'جاکش', 'کونی', 'مادرجنده', 'پدرسگ', 'لاشی', 'حرومزاده', 'ننت', 'بات' , 'فحش' , 'کونی', 'جاکش', 'کیر', 'کوس', 'کص', 'گوز', 'گوه', 'کیرخر', 'ممه', 'جنده', 'تنفروش', 'حیوان', 'خوک', 'الاغ', 'خر', 'سگ', 'کلب', 'مادرکونی', 'پدرکونی', 'خواهرکونی', 'برادرکونی', 'گائیده', 'کیری', 'کصخل', 'کصکش'];

function containsBadWord(text) {
    const lowerText = text.toLowerCase();
    for (const word of BAD_WORDS) {
        if (lowerText.includes(word)) {
            return word;
        }
    }
    return null;
}

// ==================== 🚫 مدیریت اخطار و بن ====================
async function handleBadWord(ctx, userId, userName) {
    if (!db.warnings[userId]) db.warnings[userId] = { count: 0, lastWarning: 0 };
    
    db.warnings[userId].count++;
    db.warnings[userId].lastWarning = Date.now();
    
    if (db.warnings[userId].count === 1) {
        await ctx.reply(`⚠️ اخطار ۱/۳: ${userName}، لطفاً از کلمات نامناسب استفاده نکنید.`);
    } else if (db.warnings[userId].count === 2) {
        await ctx.reply(`⚠️ اخطار ۲/۳: ${userName}،第二次 اخطار، دفعه بعد جریمه می‌شوی!`);
    } else if (db.warnings[userId].count === 3) {
        // محدودیت ۲۴ ساعته
        db.mutedUsers[userId] = Date.now() + 86400000;
        await ctx.reply(`🔇 ${userName} به مدت ۲۴ ساعت از چت عمومی محروم شد! (۳ اخطار)`);
    } else if (db.warnings[userId].count >= 4) {
        // بن دائمی
        db.bannedUsers[userId] = true;
        await ctx.reply(`🚫 ${userName} به دلیل تکرار فحاشی به طور دائمی از ربات بن شد!`);
        // گزارش به ادمین
        await bot.telegram.sendMessage(ADMIN_ID, `🚫 کاربر ${userName} (🆔 ${userId}) به دلیل فحاشی مکرر بن شد!`);
    }
    saveDB();
}

function isMuted(userId) {
    if (db.mutedUsers[userId]) {
        if (Date.now() > db.mutedUsers[userId]) {
            delete db.mutedUsers[userId];
            saveDB();
            return false;
        }
        return true;
    }
    return false;
}

function isBanned(userId) {
    return db.bannedUsers[userId] === true;
}

// ==================== 👤 مدیریت کاربر ====================
function createNewUser(id, name) {
    return {
        id: id, name: name, age: 0, gender: rand(0, 1) === 0 ? 'مرد' : 'زن',
        health: rand(60, 100), intelligence: rand(40, 80), happiness: 70,
        money: 0, education: 'بی‌سواد', job: 'بیکار', house: 'کلبه', car: 'ندارد',
        spouse: null, children: [], friends: [], popularity: 0,
        isAlive: true, birthFamily: rand(0, 2) === 0 ? 'فقیر' : (rand(0, 1) === 0 ? 'متوسط' : 'ثروتمند'),
        lastAction: Date.now(), cooldowns: {}, lastAgeCheck: null,
        answeredQuestions: [], currentQuestion: null, jobOffers: []
    };
}

function getUser(id, name) {
    const uid = String(id);
    if (isBanned(uid)) return null;
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
    if (!u.answeredQuestions) u.answeredQuestions = [];
    if (!u.jobOffers) u.jobOffers = [];
    if (u.isAlive === undefined) u.isAlive = true;
    return u;
}

// ==================== ⏱️ کول‌داون ====================
const CD = { work: 3600000, study: 7200000, social: 1800000, daily: 86400000, life: 3600000 };
function checkCD(u, action, ms) { const last = u.cooldowns[action] || 0; return (Date.now() - last >= ms) ? { can: true, rem: 0 } : { can: false, rem: ms - (Date.now() - last) }; }
function setCD(u, action) { u.cooldowns[action] = Date.now(); }

// ==================== 📚 سوالات ====================
const AGE_QUESTIONS = {
    childhood: [
        { text: '📚 تکالیف مدرسه را انجام می‌دهی؟', options: ['🟢 بله، منظم', '🟡 گاهی', '🔴 نه، تنبلی'], effects: [{ int: 5, hap: 5 }, { int: 0 }, { int: -5, hap: -5 }] },
        { text: '🏃‍♂️ در زنگ ورزش چه می‌کنی؟', options: ['⚽ فوتبال', '📚 کتاب می‌خوانم', '📱 گوشی'], effects: [{ health: 5, hap: 5 }, { int: 5 }, { health: -3, hap: -3 }] }
    ],
    teen: [
        { text: '📖 برای امتحانات چقدر درس می‌خوانی؟', options: ['🔥 ساعتها', '⏳ یک ساعت', '😴 هیچی'], effects: [{ int: 8 }, { int: 3 }, { int: -8, hap: -5 }] }
    ],
    young: [
        { text: '💼 دنبال کار می‌گردی؟', options: ['🔥 جدی', '😐 گاهی', '🛌 نه'], effects: [{ money: 200 }, { money: 50 }, { money: -100 }] }
    ],
    adult: [
        { text: '🏥 چکاپ سلامتی می‌روی؟', options: ['✅ هر سال', '🩺 گاهی', '❌ نه'], effects: [{ health: 10 }, { health: 3 }, { health: -10 }] }
    ],
    senior: [
        { text: '🧘‍♂️ مراقب سلامتیت هستی؟', options: ['✅ بله', '🩺 فقط دکتر', '😞 نه'], effects: [{ health: 10 }, { health: 3 }, { health: -15 }] }
    ]
};

function getQuestionsForAge(age) {
    if (age <= 12) return AGE_QUESTIONS.childhood;
    if (age <= 18) return AGE_QUESTIONS.teen;
    if (age <= 35) return AGE_QUESTIONS.young;
    if (age <= 60) return AGE_QUESTIONS.adult;
    return AGE_QUESTIONS.senior;
}

const STUDY_QUESTIONS = {
    دیپلم: [{ text: '۲ + ۲ چند می‌شود؟', options: ['۳', '۴', '۵'], correct: 1, reward: { int: 3, money: 50 } }],
    کاردانی: [{ text: '۱۲ × ۱۲ چند است؟', options: ['۱۲۴', '۱۴۴', '۱۲۰'], correct: 1, reward: { int: 5, money: 100 } }],
    کارشناسی: [{ text: 'مقدار پی (π) چند است؟', options: ['۳.۱۴', '۲.۷۱', '۱.۶۱'], correct: 0, reward: { int: 8, money: 200 } }],
    دکتری: [{ text: 'نظریه نسبیت اثر کیست؟', options: ['نیوتن', 'انیشتین', 'گالیله'], correct: 1, reward: { int: 12, money: 400 } }]
};

const JOBS = {
    بیکار: { salary: 0, needEdu: 'بی‌سواد', needInt: 0 },
    کارمند: { salary: 100, needEdu: 'دیپلم', needInt: 40 },
    مهندس: { salary: 250, needEdu: 'کارشناسی', needInt: 70 },
    مهندس_ارشد: { salary: 400, needEdu: 'دکتری', needInt: 85 }
};

// ==================== تایمرهای چت ====================
let userTimers = {};

async function updateChatMessage(ctx, isAuto = false) {
    if (!db.chatHistory) db.chatHistory = [];
    const recentChats = db.chatHistory.slice(-15).map(msg => 
        `👤 ${msg.isAnonymous ? '🔒 ناشناس' : msg.name} (🆔 ${msg.isAnonymous ? '🔒' : (msg.userId || 'نامشخص')}): ${msg.text}`
    ).join('\n');
    const text = `💬 «چت عمومی» ${isAuto ? '(خودکار)' : ''}
━━━━━━━━━━━━━━━━
🆔 آیدی شما: ${ctx.from.id}
${db.chatHistory.length ? '' : '━━━━━━━━━━━━━━━━\n'}
${recentChats || 'هنوز پیامی فرس\u062aاده نشده'}

📝 ارسال پیام:
• معمولی: متن را بنویسید
• ناشناس: /anonymous [متن شما]

🔔 هر ۱۰ ثانیه خودکار بروز می‌شود`;
    try {
        await ctx.editMessageText(text, Markup.inlineKeyboard([
            [Markup.button.callback('🔄 بروزرسانی', 'refresh_chat'), Markup.button.callback('⏹️ توقف خودکار', 'stop_auto')],
            [Markup.button.callback('🔙 بازگشت', 'back_main')]
        ]));
    } catch(e) {}
}

function startAutoRefresh(ctx) {
    const userId = ctx.from.id;
    if (userTimers[userId]) clearInterval(userTimers[userId]);
    userTimers[userId] = setInterval(async () => {
        try {
            if (!db.chatHistory) db.chatHistory = [];
            const recentChats = db.chatHistory.slice(-15).map(msg => 
                `👤 ${msg.isAnonymous ? '🔒 ناشناس' : msg.name} (🆔 ${msg.isAnonymous ? '🔒' : (msg.userId || 'نامشخص')}): ${msg.text}`
            ).join('\n');
            const text = `💬 «چت عمومی» (خودکار - هر ۱۰ ثانیه)
━━━━━━━━━━━━━━━━
🆔 آیدی شما: ${userId}
━━━━━━━━━━━━━━━━
${recentChats || 'هنوز پیامی فرستاده نشده'}

📝 /anonymous [متن] - پیام ناشناس`;
            await ctx.telegram.editMessageText(userId, ctx.message?.message_id || ctx.update.callback_query?.message?.message_id, null, text, {
                reply_markup: { inline_keyboard: [[{ text: '🔄 بروزرسانی', callback_data: 'refresh_chat' }, { text: '⏹️ توقف خودکار', callback_data: 'stop_auto' }], [{ text: '🔙 بازگشت', callback_data: 'back_main' }]] }
            });
        } catch(e) {}
    }, 10000);
}

// ==================== 🎮 منوی اصلی ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 وضعیت', 'status'), Markup.button.callback('🎓 درس خواندن', 'study')],
        [Markup.button.callback('💼 کار', 'work'), Markup.button.callback('👥 دوستان', 'friends')],
        [Markup.button.callback('💍 ازدواج', 'marriage'), Markup.button.callback('🛒 بازار', 'market_menu')],
        [Markup.button.callback('💬 چت عمومی', 'global_chat'), Markup.button.callback('🏆 رتبه‌بندی', 'rankings')],
        [Markup.button.callback('🎁 حیات', 'life_action'), Markup.button.callback('🎁 پاداش', 'daily')],
        [Markup.button.callback('📖 راهنما', 'guide')]
    ]);
}

// ==================== دکمه برگشت ====================
bot.action('back_main', async (ctx) => {
    const userId = ctx.from.id;
    if (userTimers[userId]) { clearInterval(userTimers[userId]); delete userTimers[userId]; }
    if (ctx.session) { ctx.session.inChat = false; ctx.session.inFriendMode = false; }
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u) return ctx.reply('🚫 شما از ربات بن شده‌اید!');
    if (!u.isAlive) {
        await ctx.editMessageText('⚰️ شما درگذشته‌اید. با /start دوباره شروع کن.', mainMenu());
        return;
    }
    await ctx.editMessageText(`🎮 «زندگی‌نامه»
━━━━━━━━━━━━━━━━
👤 ${u.name} | 🎂 ${u.age} سال
❤️ ${hpBar(u.health)} | 🧠 ${u.intelligence} | 😊 ${u.happiness}
💰 ${u.money.toLocaleString()} سکه`, mainMenu());
});

// ==================== سایر بخش‌ها (خلاصه) ====================
bot.action('status', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u) return ctx.reply('🚫 شما بن شده‌اید');
    await ctx.editMessageText(`📖 وضعیت ${u.name}\n━━━━━━━━━━━━━━━━\n🎂 سن: ${u.age}\n❤️ سلامت: ${u.health}\n🧠 هوش: ${u.intelligence}\n😊 شادی: ${u.happiness}\n💰 پول: ${u.money}\n🎓 تحصیلات: ${u.education}\n💼 شغل: ${u.job}\n👥 دوستان: ${u.friends.length}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('study', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return ctx.reply('🚫 شما بن شده‌اید');
    let eduLevel = u.education;
    if (eduLevel === 'بی‌سواد') eduLevel = 'دیپلم';
    else if (eduLevel === 'دیپلم') eduLevel = 'کاردانی';
    else if (eduLevel === 'کاردانی') eduLevel = 'کارشناسی';
    else if (eduLevel === 'کارشناسی') eduLevel = 'دکتری';
    else return ctx.answerCbQuery('به بالاترین سطح رسیدی');
    const q = STUDY_QUESTIONS[eduLevel][0];
    u.currentStudy = { level: eduLevel, question: q };
    saveDB();
    await ctx.editMessageText(`📚 آزمون ${eduLevel}\n❓ ${q.text}`, Markup.inlineKeyboard(q.options.map((opt, i) => [Markup.button.callback(opt, `study_ans_${i}`)]).concat([[Markup.button.callback('🔙 بازگشت', 'back_main')]])));
});

bot.action(/study_ans_(\d+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u || !u.currentStudy) return;
    const isCorrect = parseInt(ctx.match[1]) === u.currentStudy.question.correct;
    if (isCorrect) {
        u.intelligence = Math.min(100, u.intelligence + u.currentStudy.question.reward.int);
        u.money += u.currentStudy.question.reward.money;
        u.education = u.currentStudy.level;
        await ctx.editMessageText(`✅ پاسخ صحیح! هوش +${u.currentStudy.question.reward.int}، ${u.currentStudy.question.reward.money} سکه\n🎓 تحصیلات: ${u.education}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    } else {
        await ctx.editMessageText(`❌ پاسخ اشتباه! پاسخ صحیح: ${u.currentStudy.question.options[u.currentStudy.question.correct]}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    }
    u.currentStudy = null;
    saveDB();
});

bot.action('work', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    const job = JOBS[u.job === 'مهندس ارشد' ? 'مهندس_ارشد' : (u.job === 'مهندس' ? 'مهندس' : (u.job === 'کارمند' ? 'کارمند' : 'بیکار'))];
    const earned = job.salary + rand(10, 50);
    u.money += earned;
    saveDB();
    await ctx.editMessageText(`💼 کار کردی! +${earned} سکه\n💰 موجودی: ${u.money}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('friends', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    const friendList = u.friends.map(fid => { const f = db.users[fid]; return f ? `👤 ${f.name} (🆔 ${fid})` : ''; }).filter(f => f).join('\n') || '❌ دوستی نداری';
    ctx.session = { ...ctx.session, inFriendMode: true };
    await ctx.editMessageText(`👥 دوستان (${u.friends.length})\n━━━━━━━━━━━━━━━━\n${friendList}\n\n📝 آیدی یا @یوزرنیم را بنویس`, Markup.inlineKeyboard([[Markup.button.callback('🔄 بروزرسانی', 'friends'), Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('marriage', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    if (u.spouse) {
        const spouse = db.users[u.spouse];
        await ctx.editMessageText(`💍 همسر: ${spouse?.name}\n📝 /divorce (۱۰۰۰ سکه)`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
        return;
    }
    const singles = Object.values(db.users).filter(user => user && user.id !== u.id && user.isAlive && !user.spouse && user.age >= 18);
    if (!singles.length) return ctx.editMessageText('❌ کاربر مجردی نیست', Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    const btns = singles.slice(0, 10).map(user => [Markup.button.callback(`💍 ${user.name}`, `propose_${user.id}`)]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
    await ctx.editMessageText('💍 کاربران مجرد:', Markup.inlineKeyboard(btns));
});

bot.action(/propose_(.+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const targetId = ctx.match[1];
    const target = getUser(targetId);
    if (!u || !target) return;
    if (u.money < 500) return ctx.answerCbQuery('❌ ۵۰۰ سکه نیاز داری');
    u.money -= 500;
    saveDB();
    try {
        await bot.telegram.sendMessage(targetId, `💍 درخواست ازدواج از ${u.name}`, Markup.inlineKeyboard([[Markup.button.callback('✅ قبول', `accept_marry_${ctx.from.id}`), Markup.button.callback('❌ رد', `reject_marry_${ctx.from.id}`)]]));
        await ctx.answerCbQuery('✅ درخواست ارسال شد');
    } catch(e) { u.money += 500; saveDB(); ctx.answerCbQuery('❌ کاربر در دسترس نیست'); }
});

bot.action(/accept_marry_(.+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const proposer = getUser(ctx.match[1]);
    if (!u || !proposer) return;
    u.spouse = proposer.id;
    proposer.spouse = u.id;
    u.happiness = Math.min(100, u.happiness + 20);
    proposer.happiness = Math.min(100, proposer.happiness + 20);
    saveDB();
    await ctx.answerCbQuery(`🎉 شما با ${proposer.name} ازدواج کردید!`);
    await ctx.editMessageText(`🎊 تبریک!`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('market_menu', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    const items = db.market.filter(i => i.seller !== u.id).slice(0, 10);
    let text = '🛒 بازار\n━━━━━━━━━━━━━━━━\n';
    items.forEach((it, i) => { const seller = db.users[it.seller]; text += `${i+1}. ${it.item} - ${it.price} سکه (${seller?.name})\n`; });
    text += `\n💰 پول: ${u.money}\n🏠 ${u.house} | 🚗 ${u.car}\n\n📝 /sell [کالا] [قیمت]\n📝 /buy [شماره]`;
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('rankings', async (ctx) => {
    const users = Object.values(db.users).filter(u => u && u.isAlive);
    const richest = [...users].sort((a, b) => b.money - a.money).slice(0, 5);
    let text = '🏆 رتبه‌بندی\n━━━━━━━━━━━━━━━━\n💰 ثروتمندترین:\n';
    richest.forEach((u, i) => text += `${i+1}. ${u.name}: ${u.money}\n`);
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('daily', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    const reward = rand(100, 300);
    u.money += reward;
    u.happiness = Math.min(100, u.happiness + 5);
    saveDB();
    await ctx.editMessageText(`🎁 پاداش روزانه: +${reward} سکه\n😊 شادی +۵`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('guide', async (ctx) => {
    await ctx.editMessageText(`📖 راهنما\n━━━━━━━━━━━━━━━━\n🎓 درس خواندن: پاسخ به سوالات\n💼 کار: کسب درآمد\n👥 دوستان: با آیدی دوست شو\n💍 ازدواج: خواستگاری\n🛒 بازار: خرید/فروش\n🎁 حیات: افزایش سن و سوالات زندگی\n💬 چت: پیام ناشناس با /anonymous\n🚫 فحاشی ممنوع! ۳ اخطار = محدودیت ۲۴ ساعت`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('life_action', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    u.age++;
    if (u.age > 60) u.health = Math.max(0, u.health - rand(1, 3));
    if (u.age >= 100 || u.health <= 0) {
        u.isAlive = false;
        saveDB();
        await ctx.editMessageText(`⚰️ شما در ${u.age} سالگی درگذشتید.`, Markup.inlineKeyboard([[Markup.button.callback('🔄 شروع مجدد', 'restart_game')]]));
        return;
    }
    if (u.age % 5 === 0 && u.age <= 80) {
        const questions = getQuestionsForAge(u.age);
        const q = questions[0];
        u.currentQuestion = q;
        saveDB();
        await ctx.editMessageText(`🎂 ${u.age} سالگی\n❓ ${q.text}`, Markup.inlineKeyboard(q.options.map((opt, i) => [Markup.button.callback(opt, `age_q_${i}`)])));
        return;
    }
    saveDB();
    await ctx.editMessageText(`🎂 سن: ${u.age} | ❤️ سلامت: ${u.health}`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action(/age_q_(\d+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u || !u.currentQuestion) return;
    const idx = parseInt(ctx.match[1]);
    const effect = u.currentQuestion.effects[idx];
    if (effect) {
        if (effect.int) u.intelligence = Math.min(100, Math.max(0, u.intelligence + effect.int));
        if (effect.health) u.health = Math.min(100, Math.max(0, u.health + effect.health));
        if (effect.hap) u.happiness = Math.min(100, Math.max(0, u.happiness + effect.hap));
        if (effect.money) u.money = Math.max(0, u.money + effect.money);
    }
    u.currentQuestion = null;
    saveDB();
    await ctx.editMessageText('✅ تصمیمت ثبت شد!', Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action('restart_game', async (ctx) => {
    db.users[String(ctx.from.id)] = createNewUser(String(ctx.from.id), ctx.from.first_name);
    saveDB();
    await ctx.editMessageText('🔄 بازی ریست شد!', mainMenu());
});

// ==================== 💬 چت عمومی با بروزرسانی خودکار ====================
bot.action('global_chat', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u) return ctx.reply('🚫 شما بن شده‌اید');
    if (isMuted(ctx.from.id)) return ctx.answerCbQuery(`🔇 شما به مدت ${formatTime(db.mutedUsers[ctx.from.id] - Date.now())} از چت محرومید`);
    if (!db.chatHistory) db.chatHistory = [];
    const recentChats = db.chatHistory.slice(-15).map(msg => `👤 ${msg.isAnonymous ? '🔒 ناشناس' : msg.name} (🆔 ${msg.isAnonymous ? '🔒' : (msg.userId || 'نامشخص')}): ${msg.text}`).join('\n');
    ctx.session = { ...ctx.session, inChat: true };
    await ctx.editMessageText(`💬 چت عمومی\n━━━━━━━━━━━━━━━━\n${recentChats || 'هنوز پیامی فرستاده نشده'}\n\n📝 /anonymous [متن] - پیام ناشناس\n🔄 خودکار هر ۱۰ ثانیه`, Markup.inlineKeyboard([[Markup.button.callback('🔄 بروزرسانی', 'refresh_chat'), Markup.button.callback('⏹️ توقف خودکار', 'stop_auto')], [Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    startAutoRefresh(ctx);
});

bot.action('refresh_chat', async (ctx) => {
    if (!db.chatHistory) db.chatHistory = [];
    const recentChats = db.chatHistory.slice(-15).map(msg => `👤 ${msg.isAnonymous ? '🔒 ناشناس' : msg.name} (🆔 ${msg.isAnonymous ? '🔒' : (msg.userId || 'نامشخص')}): ${msg.text}`).join('\n');
    await ctx.editMessageText(`💬 چت عمومی (بروز شده)\n━━━━━━━━━━━━━━━━\n${recentChats || 'هنوز پیامی فرستاده نشده'}\n\n📝 /anonymous [متن] - پیام ناشناس`, Markup.inlineKeyboard([[Markup.button.callback('🔄 بروزرسانی', 'refresh_chat'), Markup.button.callback('⏹️ توقف خودکار', 'stop_auto')], [Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    await ctx.answerCbQuery('✅ بروز شد');
});

bot.action('stop_auto', async (ctx) => {
    const userId = ctx.from.id;
    if (userTimers[userId]) { clearInterval(userTimers[userId]); delete userTimers[userId]; }
    await ctx.answerCbQuery('⏹️ بروزرسانی خودکار متوقف شد');
    await ctx.editMessageText('💬 چت عمومی (بروزرسانی متوقف شد)\n📝 /anonymous [متن]', Markup.inlineKeyboard([[Markup.button.callback('🔄 بروزرسانی دستی', 'refresh_chat'), Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== دریافت پیام در چت ====================
bot.on('text', async (ctx) => {
    if (!ctx.session || !ctx.session.inChat) return;
    if (ctx.message.text.startsWith('/')) return;
    const userId = ctx.from.id;
    if (isMuted(userId)) { await ctx.reply(`🔇 شما به مدت ${formatTime(db.mutedUsers[userId] - Date.now())} از چت محرومید`); return; }
    const badWord = containsBadWord(ctx.message.text);
    if (badWord) {
        const u = getUser(userId, ctx.from.first_name);
        if (u) await handleBadWord(ctx, userId, u.name);
        return;
    }
    const u = getUser(userId, ctx.from.first_name);
    if (!u) return;
    if (!db.chatHistory) db.chatHistory = [];
    db.chatHistory.push({ name: u.name, text: ctx.message.text.substring(0, 200), time: Date.now(), userId: userId, isAnonymous: false });
    if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
    saveDB();
    await ctx.answerCbQuery('✅ پیام ارسال شد');
    const recentChats = db.chatHistory.slice(-15).map(msg => `👤 ${msg.isAnonymous ? '🔒 ناشناس' : msg.name} (🆔 ${msg.isAnonymous ? '🔒' : (msg.userId || 'نامشخص')}): ${msg.text}`).join('\n');
    await ctx.editMessageText(`💬 چت عمومی (پیام شما ارسال شد)\n━━━━━━━━━━━━━━━━\n${recentChats || 'هنوز پیامی فرستاده نشده'}\n\n📝 /anonymous [متن]`, Markup.inlineKeyboard([[Markup.button.callback('🔄 بروزرسانی', 'refresh_chat'), Markup.button.callback('⏹️ توقف خودکار', 'stop_auto')], [Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== پیام ناشناس ====================
bot.command('anonymous', async (ctx) => {
    const messageText = ctx.message.text.split(' ').slice(1).join(' ');
    if (!messageText) return ctx.reply('📝 /anonymous [متن]');
    const userId = ctx.from.id;
    if (isMuted(userId)) return ctx.reply(`🔇 شما از چت محرومید`);
    const badWord = containsBadWord(messageText);
    if (badWord) {
        const u = getUser(userId, ctx.from.first_name);
        if (u) await handleBadWord(ctx, userId, u.name);
        return;
    }
    if (!db.chatHistory) db.chatHistory = [];
    db.chatHistory.push({ name: 'ناشناس', text: messageText.substring(0, 200), time: Date.now(), userId: userId, isAnonymous: true });
    if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
    saveDB();
    await ctx.reply('✅ پیام ناشناس شما ارسال شد!');
    // اعلان به ادمین
    await bot.telegram.sendMessage(ADMIN_ID, `🔒 پیام ناشناس از 🆔 ${userId}: ${messageText}`);
});

// ==================== کامندهای دیگر ====================
bot.command('addfriend', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    if (!targetId) return ctx.reply('📝 /addfriend [آیدی]');
    const u = getUser(ctx.from.id);
    if (!u) return;
    const target = getUser(targetId);
    if (!target) return ctx.reply('❌ کاربر یافت نشد');
    try {
        await bot.telegram.sendMessage(targetId, `👋 درخواست دوستی از ${u.name}`, Markup.inlineKeyboard([[Markup.button.callback('✅ قبول', `accept_friend_${ctx.from.id}`)]]));
        await ctx.reply('✅ درخواست ارسال شد');
    } catch(e) { ctx.reply('❌ خطا'); }
});

bot.action(/accept_friend_(.+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const requester = getUser(ctx.match[1]);
    if (!u || !requester) return;
    u.friends.push(requester.id);
    requester.friends.push(u.id);
    saveDB();
    await ctx.answerCbQuery(`✅ شما با ${requester.name} دوست شدید`);
    await ctx.editMessageText(`🎉 دوست شدید!`, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'friends')]]));
});

bot.command('sell', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    const args = ctx.message.text.split(' ');
    const item = args[1];
    const price = parseInt(args[2]);
    if (!item || isNaN(price)) return ctx.reply('📝 /sell [ماشین/خانه] [قیمت]');
    if (item === 'ماشین' && u.car === 'ندارد') return ctx.reply('❌ ماشین نداری');
    if (item === 'خانه' && u.house === 'کلبه') return ctx.reply('❌ خانه نداری');
    db.market.push({ seller: u.id, item, price, date: Date.now() });
    saveDB();
    await ctx.reply(`✅ ${item} با قیمت ${price} در بازار قرار گرفت`);
});

bot.command('buy', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u) return;
    const index = parseInt(ctx.message.text.split(' ')[1]) - 1;
    const items = db.market.filter(i => i.seller !== u.id);
    if (!items[index]) return ctx.reply('❌ کالا یافت نشد');
    const item = items[index];
    if (u.money < item.price) return ctx.reply(`❌ ${item.price} سکه نیاز داری`);
    const seller = getUser(item.seller);
    u.money -= item.price;
    seller.money += item.price;
    if (item.item === 'ماشین') { u.car = 'دنا'; seller.car = 'ندارد'; }
    if (item.item === 'خانه') { u.house = 'آپارتمان'; seller.house = 'کلبه'; }
    db.market = db.market.filter(i => i !== item);
    saveDB();
    await ctx.reply(`✅ ${item.item} خریداری شد`);
});

bot.command('divorce', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u || !u.spouse) return ctx.reply('❌ متأهل نیستی');
    if (u.money < 1000) return ctx.reply('❌ ۱۰۰۰ سکه نیاز داری');
    const spouse = getUser(u.spouse);
    u.money -= 1000;
    u.spouse = null;
    if (spouse) spouse.spouse = null;
    saveDB();
    await ctx.reply(`💔 از ${spouse?.name} طلاق گرفتی`);
});

bot.command('start', async (ctx) => {
    if (isBanned(ctx.from.id)) return ctx.reply('🚫 شما از ربات بن شده‌اید!');
    let u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u) { db.users[String(ctx.from.id)] = createNewUser(String(ctx.from.id), ctx.from.first_name); u = db.users[String(ctx.from.id)]; saveDB(); }
    if (!u.isAlive) { db.users[String(ctx.from.id)] = createNewUser(String(ctx.from.id), ctx.from.first_name); u = db.users[String(ctx.from.id)]; saveDB(); }
    await ctx.reply(`🎮 به زندگی‌نامه خوش آمدی!\n👤 ${u.name}\n❤️ ${hpBar(u.health)}\n💰 ${u.money} سکه`, mainMenu());
});

bot.command('help', async (ctx) => {
    await ctx.reply(`📖 کامندها:
/start - شروع
/addfriend [آیدی] - درخواست دوستی
/accept [آیدی] - قبول دوستی
/marry [آیدی] - ازدواج
/divorce - طلاق
/sell [کالا] [قیمت] - فروش
/buy [شماره] - خرید
/chat [متن] - پیام معمولی
/anonymous [متن] - پیام ناشناس
/help - راهنما`);
});

// ==================== پنل ادمین ====================
bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const total = Object.keys(db.users).length;
    await ctx.reply(`👑 پنل ادمین\n📊 کاربران: ${total}\n💰 پول کل: ${Object.values(db.users).reduce((s, u) => s + (u.money || 0), 0)}\n\n🚫 کاربران بن شده: ${Object.keys(db.bannedUsers).length}\n🔇 میوت شده: ${Object.keys(db.mutedUsers).length}\n\n📝 /unban [آیدی] - رفع بن\n📝 /unmute [آیدی] - رفع میوت\n📝 /give [آیدی] [مقدار] - اهدا\n📝 /broadcast [متن] - پیام همگانی`);
});

bot.command('unban', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const uid = args[1];
    if (db.bannedUsers[uid]) delete db.bannedUsers[uid];
    if (db.warnings[uid]) delete db.warnings[uid];
    saveDB();
    await ctx.reply(`✅ کاربر ${uid} از بن خارج شد`);
});

bot.command('unmute', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const uid = ctx.message.text.split(' ')[1];
    if (db.mutedUsers[uid]) delete db.mutedUsers[uid];
    saveDB();
    await ctx.reply(`✅ کاربر ${uid} از میوت خارج شد`);
});

bot.command('give', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const [_, uid, amount] = ctx.message.text.split(' ');
    const user = getUser(uid);
    if (user) { user.money += parseInt(amount); saveDB(); await ctx.reply(`✅ ${amount} سکه به ${user.name} داده شد`); }
});

bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const msg = ctx.message.text.split(' ').slice(1).join(' ');
    for (const uid in db.users) { try { await bot.telegram.sendMessage(uid, `📢 پیام ادمین:\n${msg}`); } catch(e) {} }
    await ctx.reply('✅ ارسال شد');
});

// ==================== راه‌اندازی ====================
bot.launch().then(() => console.log('✅ ربات روشن شد!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));