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
let db = { users: {}, marriages: [], market: [], chatHistory: [], pendingRequests: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {}, marriages: [], market: [], chatHistory: [], pendingRequests: {} }; }
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

// ==================== 📚 سوالات سالانه (بر اساس سن) ====================
const AGE_QUESTIONS = {
    childhood: [
        { text: '📚 تکالیف مدرسه را انجام می‌دهی؟', options: ['🟢 بله، منظم', '🟡 گاهی', '🔴 نه، تنبلی'], effects: [{ int: 5, hap: 5 }, { int: 0 }, { int: -5, hap: -5 }] },
        { text: '🏃‍♂️ در زنگ ورزش چه می‌کنی؟', options: ['⚽ فوتبال بازی می‌کنم', '📚 کتاب می‌خوانم', '📱 با گوشی وقت می‌گذرانم'], effects: [{ health: 5, hap: 5 }, { int: 5 }, { health: -3, hap: -3 }] },
        { text: '🤝 با دوستانت چطور رفتار می‌کنی؟', options: ['💖 مهربان و کمک‌کننده', '😐 معمولی', '😠 زورگو'], effects: [{ hap: 5, pop: 5 }, {}, { hap: -10, pop: -5 }] }
    ],
    teen: [
        { text: '📖 برای امتحانات چقدر درس می‌خوانی؟', options: ['🔥 ساعتها', '⏳ یک ساعت', '😴 هیچی'], effects: [{ int: 8 }, { int: 3 }, { int: -8, hap: -5 }] },
        { text: '💑 به دوست‌پسر/دختر فکر می‌کنی؟', options: ['💕 بله، عاشق شدم', '🤷 نه الان وقتش نیست', '💔 تجربه بد داشتم'], effects: [{ hap: 10, money: -50 }, {}, { hap: -5 }] },
        { text: '🎮 وقت آزادت را چطور می‌گذرانی؟', options: ['📚 مطالعه', '🎮 بازی', '🏋️ ورزش'], effects: [{ int: 5 }, { hap: 5 }, { health: 5 }] }
    ],
    young: [
        { text: '💼 دنبال کار می‌گردی؟', options: ['🔥 جدی و فعال', '😐 گاهی', '🛌 نه'], effects: [{ money: 200, hap: 5 }, { money: 50 }, { money: -100, hap: -10 }] },
        { text: '💰 پولت را چطور خرج می‌کنی؟', options: ['💎 سرمایه‌گذاری', '🛍️ تفریح', '🏦 پس‌انداز'], effects: [{ money: 500 }, { hap: 10, money: -200 }, { money: 200 }] },
        { text: '🏠 مستقل شدن یا با خانواده؟', options: ['🏡 مستقل میشم', '👨‍👩‍👧 با خانواده', '🏢 خوابگاه'], effects: [{ money: -300, hap: 15 }, { money: 100, hap: 5 }, { int: 5, money: -150 }] }
    ],
    adult: [
        { text: '👨‍👩‍👧 برای آینده بچه برنامه داری؟', options: ['👶 بله، دوست دارم', '🤔 شاید بعداً', '🚫 نه'], effects: [{ hap: 10, money: -200 }, {}, {}] },
        { text: '🏥 چکاپ سلامتی می‌روی؟', options: ['✅ هر سال', '🩺 گاهی', '❌ نه'], effects: [{ health: 10 }, { health: 3 }, { health: -10 }] },
        { text: '📈 شغلت را ارتقا می‌دهی؟', options: ['🔥 بله، تلاش می‌کنم', '😐 راضیم', '👎 نه'], effects: [{ money: 500, int: 3 }, { money: 100 }, { money: -200, hap: -10 }] }
    ],
    senior: [
        { text: '🧘‍♂️ مراقب سلامتیت هستی؟', options: ['✅ بله، ورزش می‌کنم', '🩺 فقط دکتر', '😞 نه'], effects: [{ health: 10 }, { health: 3 }, { health: -15 }] },
        { text: '👴 بازنشسته شدی؟ چکار می‌کنی؟', options: ['📚 مطالعه و سفر', '👨‍👩‍👧 وقت با خانواده', '😴 استراحت'], effects: [{ hap: 10, int: 3 }, { hap: 15 }, { health: -5 }] },
        { text: '💰 وصیت‌نامه داری؟', options: ['📜 بله تنظیم کردم', '🤔 فکرش را کردم', '❌ نه'], effects: [{ money: 0 }, {}, { money: -500 }] }
    ]
};

function getQuestionsForAge(age) {
    if (age <= 12) return AGE_QUESTIONS.childhood;
    if (age <= 18) return AGE_QUESTIONS.teen;
    if (age <= 35) return AGE_QUESTIONS.young;
    if (age <= 60) return AGE_QUESTIONS.adult;
    return AGE_QUESTIONS.senior;
}

// ==================== 📝 سوالات درس خواندن (هر سطح متفاوت) ====================
const STUDY_QUESTIONS = {
    دیپلم: [
        { text: '۲ + ۲ چند می‌شود؟', options: ['۳', '۴', '۵'], correct: 1, reward: { int: 3, money: 50 } },
        { text: 'پایتخت ایران کجاست؟', options: ['شیراز', 'اصفهان', 'تهران'], correct: 2, reward: { int: 3, money: 50 } },
        { text: 'کدام یکی رنگ نیست؟', options: ['قرمز', 'سریع', 'آبی'], correct: 1, reward: { int: 3, money: 50 } }
    ],
    کاردانی: [
        { text: 'حاصل ۱۲ × ۱۲ چند است؟', options: ['۱۲۴', '۱۴۴', '۱۲۰'], correct: 1, reward: { int: 5, money: 100 } },
        { text: 'کدام گاز برای تنفس لازم است؟', options: ['اکسیژن', 'دی‌اکسید کربن', 'نیتروژن'], correct: 0, reward: { int: 5, money: 100 } },
        { text: 'نویسنده شاهنامه کیست؟', options: ['حافظ', 'سعدی', 'فردوسی'], correct: 2, reward: { int: 5, money: 100 } }
    ],
    کارشناسی: [
        { text: 'مقدار پی (π) تقریباً چند است؟', options: ['۳.۱۴', '۲.۷۱', '۱.۶۱'], correct: 0, reward: { int: 8, money: 200 } },
        { text: 'کدام کشور برنده جام جهانی ۲۰۱۸ شد؟', options: ['فرانسه', 'آرژانتین', 'کرواسی'], correct: 0, reward: { int: 8, money: 200 } },
        { text: 'کدام عنصر شیمیایی با Au نشان داده می‌شود؟', options: ['نقره', 'طلا', 'مس'], correct: 1, reward: { int: 8, money: 200 } }
    ],
    دکتری: [
        { text: 'نظریه نسبیت اثر کیست؟', options: ['نیوتن', 'انیشتین', 'گالیله'], correct: 1, reward: { int: 12, money: 400 } },
        { text: 'کدام یکی زبان برنامه‌نویسی نیست؟', options: ['پایتون', 'جاوا', 'HTML'], correct: 2, reward: { int: 12, money: 400 } },
        { text: 'عامل بیماری سل چیست؟', options: ['ویروس', 'باکتری', 'قارچ'], correct: 1, reward: { int: 12, money: 400 } }
    ]
};

// ==================== 💼 مشاغل موجود ====================
const JOBS = {
    بیکار: { salary: 0, needEdu: 'بی‌سواد', needInt: 0 },
    کارگر_ساده: { salary: 50, needEdu: 'بی‌سواد', needInt: 20 },
    کارمند: { salary: 100, needEdu: 'دیپلم', needInt: 40 },
    تکنسین: { salary: 150, needEdu: 'کاردانی', needInt: 55 },
    مهندس: { salary: 250, needEdu: 'کارشناسی', needInt: 70 },
    مهندس_ارشد: { salary: 400, needEdu: 'دکتری', needInt: 85 },
    پزشک: { salary: 500, needEdu: 'دکتری', needInt: 90, special: true },
    معلم: { salary: 120, needEdu: 'کارشناسی', needInt: 60 },
    برنامه‌نویس: { salary: 350, needEdu: 'کارشناسی', needInt: 75 },
    کشاورز: { salary: 80, needEdu: 'دیپلم', needInt: 30, healthBonus: 5 }
};

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
const CD = {
    work: 3600000, study: 7200000, social: 1800000, daily: 86400000, life: 3600000
};

function checkCD(u, action, ms) {
    const last = u.cooldowns[action] || 0;
    return (Date.now() - last >= ms) ? { can: true, rem: 0 } : { can: false, rem: ms - (Date.now() - last) };
}
function setCD(u, action) {
    u.cooldowns[action] = Date.now();
}

// ==================== 🎂 افزایش سن و سوال سالانه ====================
async function increaseAge(userId) {
    const u = getUser(userId);
    if (!u.isAlive) return null;
    
    u.age++;
    u.lastAgeCheck = new Date().toDateString();
    
    // کاهش طبیعی سلامت با افزایش سن
    if (u.age > 50) u.health = Math.max(0, u.health - rand(1, 3));
    if (u.age > 70) u.health = Math.max(0, u.health - rand(2, 5));
    
    // بررسی مرگ
    if (u.age >= 100 || u.health <= 0) {
        u.isAlive = false;
        saveDB();
        return { dead: true, age: u.age };
    }
    
    // دریافت سوال سالانه (هر 5 سال یکبار)
    if (u.age % 5 === 0 && u.age <= 80) {
        const questions = getQuestionsForAge(u.age);
        const randomQuestion = { ...questions[rand(0, questions.length - 1)], age: u.age };
        u.currentQuestion = randomQuestion;
        saveDB();
        return { question: randomQuestion, age: u.age };
    }
    
    saveDB();
    return { age: u.age, health: u.health };
}

// ==================== 🎮 منوی اصلی ====================
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 وضعیت من', 'status'), Markup.button.callback('🎓 درس خواندن', 'study')],
        [Markup.button.callback('💼 کار کردن', 'work'), Markup.button.callback('💼 انتخاب شغل', 'job_menu')],
        [Markup.button.callback('👥 دوستان', 'friends'), Markup.button.callback('💍 ازدواج', 'marriage')],
        [Markup.button.callback('🛒 بازار', 'market_menu'), Markup.button.callback('💬 چت عمومی', 'global_chat')],
        [Markup.button.callback('🏆 رتبه‌بندی', 'rankings'), Markup.button.callback('🎁 حیات', 'life_action')],
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
💍 همسر: ${u.spouse ? (db.users[u.spouse]?.name || 'نامشخص') : 'ندارد'}
👶 فرزندان: ${u.children.length}
👥 دوستان: ${u.friends.length}
🌟 محبوبیت: ${u.popularity}
🏷️ وضعیت: ${u.isAlive ? 'زنده' : 'درگذشته'}`;
    
    await ctx.editMessageText(statusText, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 🎓 درس خواندن با سوال ====================
bot.action('study', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'study', CD.study);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    let eduLevel = u.education;
    if (eduLevel === 'بی‌سواد') eduLevel = 'دیپلم';
    else if (eduLevel === 'دیپلم') eduLevel = 'کاردانی';
    else if (eduLevel === 'کاردانی') eduLevel = 'کارشناسی';
    else if (eduLevel === 'کارشناسی') eduLevel = 'دکتری';
    else return ctx.answerCbQuery('🎓 شما به بالاترین سطح تحصیلی رسیده‌اید!');
    
    const questions = STUDY_QUESTIONS[eduLevel];
    if (!questions) return ctx.answerCbQuery('❌ خطا در سوالات');
    
    const randomQ = questions[rand(0, questions.length - 1)];
    u.currentStudy = { level: eduLevel, question: randomQ };
    saveDB();
    
    const text = `📚 «آزمون ${eduLevel}»
━━━━━━━━━━━━━━━━
❓ ${randomQ.text}

گزینه مورد نظر را انتخاب کن:`;
    
    const btns = randomQ.options.map((opt, idx) => 
        [Markup.button.callback(opt, `study_answer_${idx}`)]
    );
    btns.push([Markup.button.callback('🔙 انصراف', 'back_main')]);
    
    await ctx.editMessageText(text, Markup.inlineKeyboard(btns));
});

bot.action(/study_answer_(\d+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const answerIdx = parseInt(ctx.match[1]);
    
    if (!u.currentStudy) return ctx.answerCbQuery('❌ خطا، دوباره شروع کن');
    
    const { level, question } = u.currentStudy;
    const isCorrect = answerIdx === question.correct;
    
    if (isCorrect) {
        u.intelligence = Math.min(100, u.intelligence + question.reward.int);
        u.money += question.reward.money;
        u.education = level;
        const result = `✅ پاسخ صحیح!
🧠 هوش +${question.reward.int} | 🥇 +${question.reward.money} سکه
🎓 تحصیلات شما به ${level} ارتقا یافت!`;
        await ctx.editMessageText(result, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    } else {
        const result = `❌ پاسخ اشتباه! پاسخ صحیح: ${question.options[question.correct]}
دوباره تلاش کن.`;
        await ctx.editMessageText(result, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    }
    
    setCD(u, 'study');
    u.currentStudy = null;
    saveDB();
});

// ==================== 💼 انتخاب شغل ====================
bot.action('job_menu', async (ctx) => {
    const u = getUser(ctx.from.id);
    
    if (u.education === 'بی‌سواد') {
        return ctx.editMessageText('❌ برای انتخاب شغل باید حداقل دیپلم داشته باشی!\n🎓 اول درس بخوان.', 
            Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    }
    
    const availableJobs = Object.entries(JOBS).filter(([name, job]) => 
        name !== 'بیکار' && 
        job.needEdu !== 'بی‌سواد' &&
        u.intelligence >= job.needInt
    );
    
    const jobText = availableJobs.map(([name, job]) => 
        `💼 ${name === 'کارگر_ساده' ? 'کارگر ساده' : name}: حقوق ${job.salary} سکه در ساعت\n   نیاز: تحصیلات ${job.needEdu} | هوش ${job.needInt}+`
    ).join('\n\n');
    
    const btns = availableJobs.map(([name, job]) => [
        Markup.button.callback(`💼 ${name === 'کارگر_ساده' ? 'کارگر ساده' : name}`, `select_job_${name}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
    
    await ctx.editMessageText(`💼 «انتخاب شغل»
━━━━━━━━━━━━━━━━
${jobText}

شغل مورد نظر را انتخاب کن:`, Markup.inlineKeyboard(btns));
});

bot.action(/select_job_(.+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const jobKey = ctx.match[1];
    const job = JOBS[jobKey];
    
    if (!job) return ctx.answerCbQuery('❌ شغل نامعتبر');
    if (u.intelligence < job.needInt) return ctx.answerCbQuery(`❌ هوش ${job.needInt} لازم است`);
    
    u.job = jobKey === 'کارگر_ساده' ? 'کارگر ساده' : jobKey;
    saveDB();
    
    await ctx.editMessageText(`✅ شغل ${u.job} برای شما ثبت شد!
💰 حقوق پایه: ${job.salary} سکه در ساعت
🎓 تحصیلات: ${job.needEdu} | 🧠 هوش نیاز: ${job.needInt}`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 💼 کار کردن ====================
bot.action('work', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const cd = checkCD(u, 'work', CD.work);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    setCD(u, 'work');
    
    let jobData = JOBS[u.job === 'کارگر ساده' ? 'کارگر_ساده' : u.job] || JOBS.بیکار;
    let earned = jobData.salary + rand(10, 50) + Math.floor(u.intelligence / 20);
    
    if (jobData.healthBonus) u.health = Math.min(100, u.health + jobData.healthBonus);
    u.money += earned;
    
    const result = `💼 کار کردی! 🥇 ${earned} سکه دریافت کردی
💰 موجودی: ${u.money.toLocaleString()} سکه
💼 شغل: ${u.job}`;
    
    await ctx.editMessageText(result, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 🎁 حیات (افزایش سن با سوال) ====================
bot.action('life_action', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cd = checkCD(u, 'life', CD.life);
    if (!cd.can) return ctx.answerCbQuery(`⏳ ${formatTime(cd.rem)} دیگر`);
    
    const result = await increaseAge(ctx.from.id);
    
    if (result.dead) {
        await ctx.editMessageText(`⚰️ متأسفانه ${u.name} در سن ${result.age} سالگی درگذشت.
📜 میراث شما: ${u.money.toLocaleString()} سکه

با /start دوباره شروع کن.`, mainMenu());
        return;
    }
    
    if (result.question) {
        const q = result.question;
        const btns = q.options.map((opt, idx) => [
            Markup.button.callback(opt, `age_question_${idx}_${q.age}`)
        ]);
        
        await ctx.editMessageText(`🎂 «${q.age} سالگی» - تصمیم مهم
━━━━━━━━━━━━━━━━
❓ ${q.text}

انتخاب تو روی زندگی‌ات تأثیر می‌گذارد:`, Markup.inlineKeyboard(btns));
        return;
    }
    
    setCD(u, 'life');
    await ctx.editMessageText(`🎂 سن شما به ${result.age} سال رسید!
❤️ سلامت: ${result.health}/100
⏳ هر ۱ ساعت یک بار می‌توانی سنت را بالا ببری.`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

bot.action(/age_question_(\d+)_(\d+)/, async (ctx) => {
    const u = getUser(ctx.from.id);
    const answerIdx = parseInt(ctx.match[1]);
    const questionAge = parseInt(ctx.match[2]);
    
    if (!u.currentQuestion || u.currentQuestion.age !== questionAge) {
        return ctx.answerCbQuery('❌ زمان سوال گذشته، دوباره اقدام کن');
    }
    
    const effect = u.currentQuestion.effects[answerIdx];
    if (effect) {
        if (effect.int) u.intelligence = Math.min(100, Math.max(0, u.intelligence + effect.int));
        if (effect.health) u.health = Math.min(100, Math.max(0, u.health + effect.health));
        if (effect.hap) u.happiness = Math.min(100, Math.max(0, u.happiness + effect.hap));
        if (effect.pop) u.popularity = Math.max(0, u.popularity + effect.pop);
        if (effect.money) u.money = Math.max(0, u.money + effect.money);
    }
    
    setCD(u, 'life');
    u.currentQuestion = null;
    saveDB();
    
    let effectText = '';
    if (effect.int) effectText += `🧠 هوش ${effect.int > 0 ? '+' : ''}${effect.int}\n`;
    if (effect.health) effectText += `❤️ سلامت ${effect.health > 0 ? '+' : ''}${effect.health}\n`;
    if (effect.hap) effectText += `😊 شادی ${effect.hap > 0 ? '+' : ''}${effect.hap}\n`;
    if (effect.pop) effectText += `🌟 محبوبیت ${effect.pop > 0 ? '+' : ''}${effect.pop}\n`;
    if (effect.money) effectText += `💰 پول ${effect.money > 0 ? '+' : ''}${effect.money}\n`;
    
    await ctx.editMessageText(`✅ تصمیم تو در ${questionAge} سالگی ثبت شد!
━━━━━━━━━━━━━━━━
${effectText || 'هیچ تغییری نکرد'}

${u.currentQuestion ? '' : 'به زندگی ادامه بده.'}`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت به منو', 'back_main')]]));
});

// ==================== 👥 دوستان ====================
bot.action('friends', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    
    const friendList = u.friends.map(fid => {
        const friend = db.users[fid];
        return friend ? `👤 ${friend.name} (${friend.age} سال) - 🆔 ${fid}` : '';
    }).filter(f => f);
    
    let friendsText = friendList.length ? friendList.join('\n') : '❌ هنوز دوستی نداری';
    
    const text = `👥 «دوستان شما» (${u.friends.length} نفر)
━━━━━━━━━━━━━━━━
${friendsText}

━━━━━━━━━━━━━━━━
📝 برای درخواست دوستی جدید:
مستقیماً آیدی عددی یا @یوزرنیم را بنویس.`;
    
    ctx.session = { ...ctx.session, inFriendMode: true };
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 بروزرسانی', 'refresh_friends')],
        [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
});

bot.action('refresh_friends', async (ctx) => {
    const u = getUser(ctx.from.id);
    
    const friendList = u.friends.map(fid => {
        const friend = db.users[fid];
        return friend ? `👤 ${friend.name} (${friend.age} سال) - 🆔 ${fid}` : '';
    }).filter(f => f);
    
    let friendsText = friendList.length ? friendList.join('\n') : '❌ هنوز دوستی نداری';
    
    const text = `👥 «دوستان شما» (${u.friends.length} نفر)
━━━━━━━━━━━━━━━━
${friendsText}

━━━━━━━━━━━━━━━━
📝 برای درخواست دوستی جدید:
مستقیماً آیدی عددی یا @یوزرنیم را بنویس.`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 بروزرسانی', 'refresh_friends')],
        [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
});

// دریافت درخواست دوستی
bot.on('text', async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const messageText = ctx.message.text.trim();
    
    if (!ctx.session || !ctx.session.inFriendMode) return;
    
    let targetId = null;
    let cleanText = messageText.replace(/^🆔\s*/, '');
    
    if (cleanText.startsWith('@')) {
        const username = cleanText.substring(1).toLowerCase();
        try {
            const chat = await bot.telegram.getChat(username);
            targetId = String(chat.id);
        } catch (e) {
            await ctx.reply(`❌ کاربر با یوزرنیم @${username} یافت نشد.`);
            return;
        }
    } else if (/^\d+$/.test(cleanText)) {
        targetId = cleanText;
    } else {
        return;
    }
    
    if (targetId === String(ctx.from.id)) {
        await ctx.reply('❌ نمی‌توانی به خودت درخواست بدهی');
        return;
    }
    if (u.friends.includes(targetId)) {
        await ctx.reply('❌ قبلاً دوست هستید');
        return;
    }
    
    const target = db.users[targetId];
    if (!target || !target.isAlive) {
        await ctx.reply('❌ کاربر یافت نشد');
        return;
    }
    
    try {
        await bot.telegram.sendMessage(targetId, 
            `👋 درخواست دوستی از ${u.name}
━━━━━━━━━━━━━━━━
🆔 ${ctx.from.id}
🎂 ${u.age} سال | 🧠 ${u.intelligence} هوش

روی دکمه زیر کلیک کن:`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ قبول', `accept_friend_${ctx.from.id}`)],
                [Markup.button.callback('❌ رد', `reject_friend_${ctx.from.id}`)]
            ])
        );
        await ctx.reply(`✅ درخواست برای ${target.name} ارسال شد!`);
        ctx.session.inFriendMode = false;
    } catch(e) {
        await ctx.reply('❌ کاربر در دسترس نیست');
    }
});

bot.action(/accept_friend_(.+)/, async (ctx) => {
    const requesterId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const requester = getUser(requesterId);
    
    if (u.friends.includes(requesterId)) return ctx.answerCbQuery('❌ قبلاً دوست هستید');
    
    u.friends.push(requesterId);
    requester.friends.push(ctx.from.id);
    u.happiness = Math.min(100, u.happiness + 15);
    requester.happiness = Math.min(100, requester.happiness + 15);
    u.popularity += 10;
    requester.popularity += 10;
    saveDB();
    
    await ctx.answerCbQuery(`✅ شما و ${requester.name} دوست شدید`);
    await ctx.editMessageText(`🎉 شما با ${requester.name} دوست شدید!\n😊 شادی +۱۵ | 🌟 محبوبیت +۱۰`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت به دوستان', 'friends')]]));
    
    try { await bot.telegram.sendMessage(requesterId, `🎉 ${u.name} درخواست شما را قبول کرد!`); } catch(e) {}
});

bot.action(/reject_friend_(.+)/, async (ctx) => {
    const requesterId = ctx.match[1];
    const requester = getUser(requesterId);
    await ctx.answerCbQuery(`❌ درخواست ${requester.name} رد شد`);
    await ctx.editMessageText(`❌ درخواست ${requester.name} را رد کردی.`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'friends')]]));
});

// ==================== 💍 ازدواج ====================
bot.action('marriage', async (ctx) => {
    const u = getUser(ctx.from.id);
    
    if (u.spouse) {
        const spouse = db.users[u.spouse];
        return ctx.editMessageText(`💍 شما با ${spouse?.name || 'همسرتان'} ازدواج کرده‌اید.
        
📝 /divorce - طلاق (۱۰۰۰ سکه)`,
            Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    }
    
    const singles = Object.values(db.users).filter(user => 
        user.id !== u.id && user.isAlive && !user.spouse && user.age >= 18 && u.age >= 18);
    
    if (!singles.length) return ctx.editMessageText('❌ کاربر مجردی یافت نشد',
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    
    const btns = singles.slice(0, 10).map(user => [
        Markup.button.callback(`💍 ${user.name} (${user.age} سال)`, `propose_${user.id}`)
    ]);
    btns.push([Markup.button.callback('🔙 بازگشت', 'back_main')]);
    
    await ctx.editMessageText('💍 کاربران مجرد:', Markup.inlineKeyboard(btns));
});

bot.action(/propose_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const target = getUser(targetId);
    
    if (u.money < 500) return ctx.answerCbQuery('❌ ۵۰۰ سکه برای خواستگاری نیاز داری');
    if (u.spouse || target.spouse) return ctx.answerCbQuery('❌ یکی از شما متأهل است');
    
    u.money -= 500;
    saveDB();
    
    try {
        await bot.telegram.sendMessage(targetId,
            `💍 درخواست ازدواج از ${u.name}
━━━━━━━━━━━━━━━━
💰 مهریه: ۵۰۰ سکه
🎁 پاداش ازدواج: +۲۰ شادی برای هر دو

روی دکمه زیر کلیک کن:`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ قبول ازدواج', `accept_marry_${ctx.from.id}`)],
                [Markup.button.callback('❌ رد', `reject_marry_${ctx.from.id}`)]
            ])
        );
        await ctx.answerCbQuery('✅ درخواست ازدواج ارسال شد!');
    } catch(e) {
        u.money += 500;
        saveDB();
        await ctx.answerCbQuery('❌ کاربر در دسترس نیست');
    }
});

bot.action(/accept_marry_(.+)/, async (ctx) => {
    const proposerId = ctx.match[1];
    const u = getUser(ctx.from.id);
    const proposer = getUser(proposerId);
    
    if (u.spouse || proposer.spouse) return ctx.answerCbQuery('❌ یکی از شما متأهل شده');
    
    u.spouse = proposerId;
    proposer.spouse = ctx.from.id;
    u.happiness = Math.min(100, u.happiness + 20);
    proposer.happiness = Math.min(100, proposer.happiness + 20);
    saveDB();
    
    await ctx.answerCbQuery(`🎉 شما با ${proposer.name} ازدواج کردید!`);
    await ctx.editMessageText(`🎊 تبریک! شما با ${proposer.name} ازدواج کردید!\n😊 شادی +۲۰`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
    
    try { await bot.telegram.sendMessage(proposerId, `🎊 ${u.name} درخواست شما را قبول کرد!`); } catch(e) {}
});

// ==================== 🛒 بازار ====================
bot.action('market_menu', async (ctx) => {
    const u = getUser(ctx.from.id);
    
    const marketItems = db.market.filter(item => item.seller !== u.id);
    let marketText = '🛒 «بازار آزاد»\n━━━━━━━━━━━━━━\n';
    
    if (marketItems.length === 0) marketText += 'هیچ کالایی برای فروش نیست.\n\n';
    else {
        marketItems.slice(0, 10).forEach((item, idx) => {
            const seller = db.users[item.seller];
            marketText += `${idx+1}. ${item.item} - ${item.price} سکه (فروشنده: ${seller?.name})\n`;
        });
        marketText += '\n';
    }
    
    marketText += `💰 موجودی: ${u.money.toLocaleString()} سکه
🏠 خانه: ${u.house} | 🚗 ماشین: ${u.car}

📝 /sell [کالا] [قیمت]
📝 /buy [شماره]
📝 /upgrade_house - ارتقای خانه (۲۰۰۰ سکه)
📝 /upgrade_car - خرید ماشین (۱۰۰۰ سکه)`;
    
    await ctx.editMessageText(marketText, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 💬 چت عمومی ====================
bot.action('global_chat', async (ctx) => {
    if (!db.chatHistory) db.chatHistory = [];
    
    const recentChats = db.chatHistory.slice(-15).map(msg => 
        `👤 ${msg.name}: ${msg.text}`
    ).join('\n');
    
    const text = `💬 «چت عمومی»
━━━━━━━━━━━━━━━━
${recentChats || 'هنوز پیامی فرستاده نشده'}

📝 پیام خود را بنویسید و بفرستید:`;
    
    ctx.session = { ...ctx.session, inChat: true };
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 بروزرسانی', 'refresh_chat')],
        [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
});

bot.action('refresh_chat', async (ctx) => {
    if (!db.chatHistory) db.chatHistory = [];
    
    const recentChats = db.chatHistory.slice(-15).map(msg => 
        `👤 ${msg.name}: ${msg.text}`
    ).join('\n');
    
    const text = `💬 «چت عمومی» (بروز شده)
━━━━━━━━━━━━━━━━
${recentChats || 'هنوز پیامی فرستاده نشده'}

📝 پیام خود را بنویسید و بفرستید:`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 بروزرسانی', 'refresh_chat')],
        [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
});

// دریافت پیام چت
bot.on('text', async (ctx) => {
    if (!ctx.session || !ctx.session.inChat) return;
    if (ctx.message.text.startsWith('/')) return;
    
    const u = getUser(ctx.from.id, ctx.from.first_name);
    const messageText = ctx.message.text.substring(0, 200);
    
    if (!db.chatHistory) db.chatHistory = [];
    db.chatHistory.push({ name: u.name, text: messageText, time: Date.now(), userId: ctx.from.id });
    if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
    saveDB();
    
    const recentChats = db.chatHistory.slice(-15).map(msg => 
        `👤 ${msg.name}: ${msg.text}`
    ).join('\n');
    
    const text = `💬 «چت عمومی» (پیام شما ارسال شد)
━━━━━━━━━━━━━━━━
${recentChats || 'هنوز پیامی فرستاده نشده'}

📝 پیام خود را بنویسید و بفرستید:`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 بروزرسانی', 'refresh_chat')],
        [Markup.button.callback('🔙 بازگشت', 'back_main')]
    ]));
    
    await ctx.answerCbQuery('✅ پیام ارسال شد!');
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
    saveDB();
    
    await ctx.editMessageText(`🎁 پاداش روزانه!
💰 +${reward} سکه (موجودی: ${u.money.toLocaleString()})
😊 +۵ شادی (${u.happiness}/100)`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 📖 راهنما ====================
bot.action('guide', async (ctx) => {
    const text = `📖 «راهنمای زندگی‌نامه»
━━━━━━━━━━━━━━━━
🎓 درس خواندن: پاسخ به سوالات، افزایش هوش و تحصیلات
💼 کار کردن: کسب درآمد بر اساس شغل و هوش
💼 انتخاب شغل: پس از دیپلم، شغل مناسب خود را انتخاب کن
👥 دوستان: با آیدی یا یوزرنیم دوست شو
💍 ازدواج: خواستگاری و زندگی مشترک
🛒 بازار: خرید و فروش کالا با دیگران
💬 چت عمومی: گفتگو با همه کاربران
🎁 حیات: هر ساعت یک بار سنت را بالا ببر و به سوالات زندگی پاسخ بده
🏆 رتبه‌بندی: مقایسه با دیگران
🎁 پاداش روزانه: پول و شادی بگیر

📝 کامندها:
/start - شروع بازی
/addfriend [آیدی/@یوزرنیم] - درخواست دوستی
/accept [آیدی] - قبول دوستی
/marry [آیدی] - ازدواج
/divorce - طلاق
/sell [کالا] [قیمت] - فروش در بازار
/buy [شماره] - خرید از بازار
/upgrade_house - ارتقای خانه
/upgrade_car - خرید ماشین
/chat [متن] - پیام در چت عمومی`;
    
    await ctx.editMessageText(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 بازگشت', 'back_main')]]));
});

// ==================== 🔙 بازگشت ====================
bot.action('back_main', async (ctx) => {
    if (ctx.session) { ctx.session.inFriendMode = false; ctx.session.inChat = false; }
    
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u.isAlive) {
        await ctx.editMessageText('⚰️ شما درگذشته‌اید. برای شروع مجدد /start را بزنید.', mainMenu());
        return;
    }
    const text = `🎮 «زندگی‌نامه»
━━━━━━━━━━━━━━━━
👤 ${u.name} | 🎂 ${u.age} سال
❤️ ${hpBar(u.health)} | 🧠 ${u.intelligence} | 😊 ${u.happiness}
💰 ${u.money.toLocaleString()} سکه

یک گزینه را انتخاب کن:`;
    await ctx.editMessageText(text, mainMenu());
});

function hpBar(value, length = 10) {
    const filled = Math.round((value / 100) * length);
    return '❤️'.repeat(filled) + '🖤'.repeat(length - filled);
}

// ==================== 👑 منوی ادمین (مخفی) ====================
bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    
    const totalUsers = Object.keys(db.users).length;
    const totalMoney = Object.values(db.users).reduce((sum, u) => sum + (u.money || 0), 0);
    const aliveUsers = Object.values(db.users).filter(u => u.isAlive).length;
    
    const text = `👑 «پنل ادمین» (مخفی)
━━━━━━━━━━━━━━━━
📊 آمار کلی:
👥 کل کاربران: ${totalUsers}
💚 کاربران زنده: ${aliveUsers}
💰 کل پول در گردش: ${totalMoney.toLocaleString()} سکه
💍 تعداد ازدواج‌ها: ${db.marriages?.length || 0}

🔧 امکانات:
• /give [آیدی] [مقدار] - اهدای سکه
• /heal [آیدی] - درمان کامل
• /set_int [آیدی] [مقدار] - تنظیم هوش
• /set_age [آیدی] [سن] - تنظیم سن
• /reset_user [آیدی] - ریست کاربر
• /broadcast [متن] - پیام همگانی
• /add_question [سن] [سوال]|گزینه1|گزینه2|گزینه3 - افزودن سوال جدید`;
    
    await ctx.reply(text);
});

bot.command('give', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    const amount = parseInt(args[2]);
    if (!targetId || isNaN(amount)) return ctx.reply('❌ /give [آیدی] [مقدار]');
    
    const target = db.users[targetId];
    if (!target) return ctx.reply('❌ کاربر یافت نشد');
    target.money += amount;
    saveDB();
    await ctx.reply(`✅ ${amount} سکه به ${target.name} اهدا شد.`);
    try { await bot.telegram.sendMessage(targetId, `🎁 ادمین ${amount} سکه به شما هدیه داد!`); } catch(e) {}
});

bot.command('heal', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    if (!targetId) return ctx.reply('❌ /heal [آیدی]');
    
    const target = db.users[targetId];
    if (!target) return ctx.reply('❌ کاربر یافت نشد');
    target.health = 100;
    saveDB();
    await ctx.reply(`✅ ${target.name} درمان کامل شد.`);
    try { await bot.telegram.sendMessage(targetId, `🩺 ادمین شما را درمان کامل کرد!`); } catch(e) {}
});

bot.command('set_int', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    const value = parseInt(args[2]);
    if (!targetId || isNaN(value)) return ctx.reply('❌ /set_int [آیدی] [مقدار 0-100]');
    
    const target = db.users[targetId];
    if (!target) return ctx.reply('❌ کاربر یافت نشد');
    target.intelligence = Math.min(100, Math.max(0, value));
    saveDB();
    await ctx.reply(`✅ هوش ${target.name} به ${target.intelligence} تغییر کرد.`);
});

bot.command('set_age', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    const age = parseInt(args[2]);
    if (!targetId || isNaN(age)) return ctx.reply('❌ /set_age [آیدی] [سن]');
    
    const target = db.users[targetId];
    if (!target) return ctx.reply('❌ کاربر یافت نشد');
    target.age = age;
    saveDB();
    await ctx.reply(`✅ سن ${target.name} به ${age} تغییر کرد.`);
});

bot.command('reset_user', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    if (!targetId) return ctx.reply('❌ /reset_user [آیدی]');
    
    if (db.users[targetId]) {
        const name = db.users[targetId].name;
        db.users[targetId] = createNewUser(targetId, name);
        saveDB();
        await ctx.reply(`✅ کاربر ${name} ریست شد.`);
        try { await bot.telegram.sendMessage(targetId, `🔄 ادمین حساب شما را ریست کرد. با /start دوباره شروع کن.`); } catch(e) {}
    } else {
        await ctx.reply('❌ کاربر یافت نشد');
    }
});

bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const msg = ctx.message.text.split(' ').slice(1).join(' ');
    if (!msg) return ctx.reply('❌ /broadcast [متن]');
    
    let sent = 0;
    for (const uid in db.users) {
        try { await bot.telegram.sendMessage(uid, `📢 «پیام ادمین»\n━━━━━━━━━━━━━━━━\n${msg}`); sent++; } catch(e) {}
    }
    await ctx.reply(`✅ پیام به ${sent} کاربر ارسال شد.`);
});

// ==================== 🚀 اجرا ====================
bot.start(async (ctx) => {
    const u = getUser(ctx.from.id, ctx.from.first_name);
    if (!u.isAlive) {
        db.users[String(ctx.from.id)] = createNewUser(String(ctx.from.id), ctx.from.first_name);
        saveDB();
    }
    const text = `🎮 به بازی «زندگی‌نامه» خوش آمدی!
━━━━━━━━━━━━━━━━
👤 ${u.name} | 🎂 ${u.age} سال
❤️ ${hpBar(u.health)} | 🧠 ${u.intelligence} | 😊 ${u.happiness}
💰 ${u.money} سکه

هر ساعت یک بار با دکمه «🎁 حیات» سنت را بالا ببر و به سوالات زندگی پاسخ بده.

یک گزینه را انتخاب کن:`;
    await ctx.reply(text, mainMenu());
});

// کامندهای اضافی
bot.command('addfriend', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const identifier = args[1];
    if (!identifier) return ctx.reply('📝 /addfriend [آیدی یا @یوزرنیم]');
    
    let targetId = null;
    if (identifier.startsWith('@')) {
        try {
            const chat = await bot.telegram.getChat(identifier);
            targetId = String(chat.id);
        } catch(e) { return ctx.reply('❌ کاربر یافت نشد'); }
    } else if (/^\d+$/.test(identifier)) {
        targetId = identifier;
    } else {
        return ctx.reply('❌ فرمت نامعتبر');
    }
    
    const u = getUser(ctx.from.id);
    if (targetId === String(ctx.from.id)) return ctx.reply('❌ نمی‌توانی به خودت درخواست بدهی');
    if (u.friends.includes(targetId)) return ctx.reply('❌ قبلاً دوست هستید');
    
    const target = db.users[targetId];
    if (!target) return ctx.reply('❌ کاربر یافت نشد');
    
    try {
        await bot.telegram.sendMessage(targetId, 
            `👋 درخواست دوستی از ${u.name}\n🆔 ${ctx.from.id}`,
            Markup.inlineKeyboard([[Markup.button.callback('✅ قبول', `accept_friend_${ctx.from.id}`)]]));
        await ctx.reply(`✅ درخواست برای ${target.name} ارسال شد!`);
    } catch(e) { ctx.reply('❌ کاربر در دسترس نیست'); }
});

bot.command('accept', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const requesterId = args[1];
    if (!requesterId) return ctx.reply('📝 /accept [آیدی]');
    
    const u = getUser(ctx.from.id);
    const requester = getUser(requesterId);
    if (u.friends.includes(requesterId)) return ctx.reply('❌ قبلاً دوست هستید');
    
    u.friends.push(requesterId);
    requester.friends.push(ctx.from.id);
    saveDB();
    await ctx.reply(`✅ شما و ${requester.name} دوست شدید!`);
    try { await bot.telegram.sendMessage(requesterId, `✅ ${u.name} درخواست شما را قبول کرد!`); } catch(e) {}
});

bot.command('marry', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    if (!targetId) return ctx.reply('📝 /marry [آیدی]');
    
    const u = getUser(ctx.from.id);
    const target = getUser(targetId);
    if (u.money < 500) return ctx.reply('❌ ۵۰۰ سکه نیاز داری');
    if (u.spouse || target.spouse) return ctx.reply('❌ یکی از شما متأهل است');
    
    u.money -= 500;
    u.spouse = targetId;
    target.spouse = ctx.from.id;
    saveDB();
    await ctx.reply(`🎊 شما با ${target.name} ازدواج کردید!`);
    try { await bot.telegram.sendMessage(targetId, `🎊 ${u.name} با شما ازدواج کرد!`); } catch(e) {}
});

bot.command('divorce', async (ctx) => {
    const u = getUser(ctx.from.id);
    if (!u.spouse) return ctx.reply('❌ متأهل نیستید');
    if (u.money < 1000) return ctx.reply('❌ ۱۰۰۰ سکه برای طلاق نیاز داری');
    
    const spouse = getUser(u.spouse);
    u.money -= 1000;
    u.spouse = null;
    spouse.spouse = null;
    saveDB();
    await ctx.reply(`💔 شما از ${spouse.name} طلاق گرفتید.`);
    try { await bot.telegram.sendMessage(spouse.id, `💔 ${u.name} از شما طلاق گرفت!`); } catch(e) {}
});

bot.command('sell', async (ctx) => {
    const u = getUser(ctx.from.id);
    const args = ctx.message.text.split(' ');
    const item = args[1];
    const price = parseInt(args[2]);
    if (!item || isNaN(price)) return ctx.reply('📝 /sell [ماشین/خانه/کتاب/جواهر] [قیمت]');
    
    if (item === 'ماشین' && u.car === 'ندارد') return ctx.reply('❌ ماشینی نداری');
    if (item === 'خانه' && u.house === 'کلبه') return ctx.reply('❌ خانه‌ای نداری');
    
    db.market.push({ seller: u.id, item, price, date: Date.now() });
    saveDB();
    await ctx.reply(`✅ ${item} با قیمت ${price} سکه در بازار قرار گرفت.`);
});

bot.command('buy', async (ctx) => {
    const u = getUser(ctx.from.id);
    const index = parseInt(ctx.message.text.split(' ')[1]) - 1;
    if (isNaN(index)) return ctx.reply('📝 /buy [شماره]');
    
    const items = db.market.filter(i => i.seller !== u.id);
    if (!items[index]) return ctx.reply('❌ کالا یافت نشد');
    
    const item = items[index];
    if (u.money < item.price) return ctx.reply(`❌ ${item.price} سکه نیاز داری`);
    
    const seller = getUser(item.seller);
    u.money -= item.price;
    seller.money += item.price;
    
    if (item.item === 'ماشین') { u.car = 'دنا'; seller.car = 'ندارد'; }
    else if (item.item === 'خانه') { u.house = 'آپارتمان'; seller.house = 'کلبه'; }
    
    db.market = db.market.filter(i => i !== item);
    saveDB();
    await ctx.reply(`✅ ${item.item} را با ${item.price} سکه خریداری کردی!`);
});

bot.command('upgrade_house', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cost = 2000;
    if (u.money < cost) return ctx.reply(`❌ ${cost} سکه نیاز داری`);
    if (u.house === 'ویلایی') return ctx.reply('❌ خانه در بالاترین سطح است');
    
    u.money -= cost;
    if (u.house === 'کلبه') u.house = 'آپارتمان';
    else if (u.house === 'آپارتمان') u.house = 'ویلایی';
    saveDB();
    await ctx.reply(`✅ خانه به ${u.house} ارتقا یافت!`);
});

bot.command('upgrade_car', async (ctx) => {
    const u = getUser(ctx.from.id);
    const cost = 1000;
    if (u.money < cost) return ctx.reply(`❌ ${cost} سکه نیاز داری`);
    if (u.car === 'تارا') return ctx.reply('❌ ماشین در بالاترین سطح است');
    
    u.money -= cost;
    if (u.car === 'ندارد') u.car = 'سمند';
    else if (u.car === 'سمند') u.car = 'دنا';
    else if (u.car === 'دنا') u.car = 'تارا';
    saveDB();
    await ctx.reply(`✅ ماشین به ${u.car} ارتقا یافت!`);
});

bot.command('chat', async (ctx) => {
    const u = getUser(ctx.from.id);
    const msg = ctx.message.text.split(' ').slice(1).join(' ');
    if (!msg) return ctx.reply('📝 /chat [متن]');
    
    if (!db.chatHistory) db.chatHistory = [];
    db.chatHistory.push({ name: u.name, text: msg.substring(0, 200), time: Date.now() });
    if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
    saveDB();
    await ctx.reply('✅ پیام در چت عمومی ارسال شد!');
});

bot.command('help', async (ctx) => {
    const helpText = `📖 «راهنمای کامندها»
━━━━━━━━━━━━━━━━
/start - شروع بازی
/addfriend [آیدی/@] - درخواست دوستی
/accept [آیدی] - قبول دوستی
/marry [آیدی] - ازدواج
/divorce - طلاق
/sell [کالا] [قیمت] - فروش
/buy [شماره] - خرید
/upgrade_house - ارتقای خانه
/upgrade_car - خرید ماشین
/chat [متن] - پیام در چت
/help - راهنما`;
    await ctx.reply(helpText);
});

// ==================== راه‌اندازی ====================
bot.launch().then(() => console.log('✅ بازی «زندگی‌نامه» روشن شد!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));