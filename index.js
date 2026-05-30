import express from 'express';

const app = express();
app.use(express.json());

// =====================
// ENV
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || 'my-secret-life-bot';
const ADMIN_ID = '5576592239';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN تنظیم نشده');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// =====================
// STORAGE
// =====================
const users = new Map();
const states = new Map();

// =====================
// DATA
// =====================
const provinces = [
  'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'آذربایجان غربی',
  'خوزستان', 'مازندران', 'گیلان', 'البرز', 'کرمان', 'یزد', 'قم', 'سمنان',
  'هرمزگان', 'بوشهر', 'کردستان', 'کرمانشاه', 'لرستان', 'همدان'
];

const genders = ['👨 مرد', '👩 زن', '⚧️ سایر'];

const difficulties = [
  { label: '🟢 آسان', money: 300, energy: 100, health: 100, happiness: 90, luck: 18 },
  { label: '🟡 معمولی', money: 220, energy: 90, health: 95, happiness: 80, luck: 12 },
  { label: '🟠 سخت', money: 160, energy: 80, health: 90, happiness: 70, luck: 8 },
  { label: '🔴 بی‌رحم', money: 100, energy: 70, health: 85, happiness: 60, luck: 4 },
];

const backgrounds = [
  { label: '🏠 خانواده متوسط', money: 150, energy: 5, health: 0, happiness: 5, luck: 0 },
  { label: '💸 فقیر', money: 50, energy: 0, health: -5, happiness: -5, luck: -2 },
  { label: '💼 مرفه', money: 400, energy: 10, health: 5, happiness: 10, luck: 3 },
  { label: '🎓 دانش‌آموز', money: 100, energy: 10, health: 0, happiness: 5, luck: 1 },
  { label: '🧑‍💻 کارمند تازه‌کار', money: 200, energy: 5, health: 0, happiness: 0, luck: 1 },
];

const skinColors = [
  'روشن', 'گندمی روشن', 'گندمی', 'سبزه', 'تیره'
];

const jobs = [
  { name: "🍽️ گارسونی", minMoney: 120, maxMoney: 260, minEnergy: 14, maxEnergy: 24, happiness: -2 },
  { name: "🧹 نظافت", minMoney: 100, maxMoney: 220, minEnergy: 12, maxEnergy: 22, happiness: -1 },
  { name: "🚚 پیک موتوری", minMoney: 150, maxMoney: 320, minEnergy: 18, maxEnergy: 30, happiness: -2 },
  { name: "🏗️ کارگری ساختمان", minMoney: 180, maxMoney: 380, minEnergy: 22, maxEnergy: 35, happiness: -3 },
  { name: "🛍️ فروشندگی", minMoney: 110, maxMoney: 240, minEnergy: 10, maxEnergy: 18, happiness: 0 },
  { name: "💻 فریلنسری", minMoney: 130, maxMoney: 300, minEnergy: 8, maxEnergy: 16, happiness: 1 },
  { name: "🧺 کار در خشکشویی", minMoney: 100, maxMoney: 210, minEnergy: 11, maxEnergy: 20, happiness: -1 },
  { name: "☕ کار در کافه", minMoney: 120, maxMoney: 250, minEnergy: 12, maxEnergy: 20, happiness: 1 },
  { name: "🍔 کار در فست‌فود", minMoney: 140, maxMoney: 260, minEnergy: 14, maxEnergy: 24, happiness: -1 },
  { name: "🧑‍🌾 کار مزرعه", minMoney: 160, maxMoney: 330, minEnergy: 20, maxEnergy: 32, happiness: -2 },
  { name: "🧰 تعمیرات", minMoney: 150, maxMoney: 310, minEnergy: 15, maxEnergy: 26, happiness: 0 },
  { name: "📦 انبارداری", minMoney: 140, maxMoney: 280, minEnergy: 16, maxEnergy: 28, happiness: -1 },
  { name: "🚕 رانندگی", minMoney: 170, maxMoney: 340, minEnergy: 15, maxEnergy: 27, happiness: 0 },
  { name: "🪑 نجاری", minMoney: 150, maxMoney: 300, minEnergy: 16, maxEnergy: 26, happiness: 1 },
  { name: "🧱 بنایی", minMoney: 180, maxMoney: 360, minEnergy: 22, maxEnergy: 34, happiness: -2 },
  { name: "🧼 کارواش", minMoney: 120, maxMoney: 240, minEnergy: 13, maxEnergy: 22, happiness: -1 },
  { name: "🐟 ماهی‌فروشی", minMoney: 110, maxMoney: 250, minEnergy: 12, maxEnergy: 23, happiness: -1 },
  { name: "🥖 نانوایی", minMoney: 130, maxMoney: 270, minEnergy: 14, maxEnergy: 24, happiness: 0 },
  { name: "📱 تولید محتوا", minMoney: 100, maxMoney: 350, minEnergy: 8, maxEnergy: 18, happiness: 2 },
  { name: "🎤 اجرای خیابانی", minMoney: 90, maxMoney: 400, minEnergy: 10, maxEnergy: 20, happiness: 3 },
];

const rests = [
  { name: "😴 خواب کوتاه", minEnergy: 10, maxEnergy: 18, health: 0, happiness: 1 },
  { name: "🛌 خواب عمیق", minEnergy: 20, maxEnergy: 35, health: 3, happiness: 2 },
  { name: "🚿 دوش گرفتن", minEnergy: 6, maxEnergy: 12, health: 2, happiness: 2 },
  { name: "☕ نوشیدنی گرم", minEnergy: 5, maxEnergy: 10, health: 0, happiness: 2 },
  { name: "🎵 گوش دادن به موسیقی", minEnergy: 4, maxEnergy: 9, health: 0, happiness: 4 },
  { name: "📺 دیدن فیلم", minEnergy: 6, maxEnergy: 12, health: 0, happiness: 3 },
  { name: "🌳 قدم زدن", minEnergy: 5, maxEnergy: 11, health: 1, happiness: 3 },
  { name: "🧘 مدیتیشن", minEnergy: 7, maxEnergy: 14, health: 2, happiness: 4 },
  { name: "🍲 غذای خوب", minEnergy: 8, maxEnergy: 16, health: 4, happiness: 3 },
  { name: "🛋️ استراحت کامل", minEnergy: 15, maxEnergy: 28, health: 2, happiness: 2 },
];

const exploreEvents = [
  { type: "money", name: "💰 مقداری پول پیدا کردی", min: 50, max: 220 },
  { type: "item", name: "🎁 یک آیتم پیدا کردی", item: "جعبه مرموز" },
  { type: "nothing", name: "😐 چیزی پیدا نکردی" },
  { type: "damage", name: "🤕 توی دردسر افتادی", min: 5, max: 18 },
  { type: "luck", name: "🍀 امروز شانس باهات یار بود", luck: 2, happiness: 2 },
  { type: "trouble", name: "👮 به دردسر خوردی و جریمه شدی", min: 20, max: 100 },
  { type: "food", name: "🧃 خوراکی پیدا کردی", item: "نوشیدنی انرژی‌زا" },
  { type: "treasure", name: "🪙 یک سکه قدیمی پیدا کردی", min: 80, max: 260 },
  { type: "lost", name: "🕳️ راه را اشتباه رفتی و خسته شدی", min: 6, max: 15 },
  { type: "bag", name: "🎒 یک کیف رهاشده پیدا کردی", item: "کیف کهنه" },
];

// =====================
// HELPERS
// =====================
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function tg(method, payload) {
  return fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(res => res.json());
}

function sendMessage(chatId, text, keyboard = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (keyboard) payload.reply_markup = keyboard;
  return tg('sendMessage', payload);
}

function answerCallbackQuery(callbackQueryId, text = '') {
  return tg('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  });
}

function getUser(chatId) {
  if (!users.has(chatId)) {
    users.set(chatId, {
      name: '',
      gender: '',
      age: 0,
      province: '',
      city: '',
      skinColor: '',
      difficulty: '',
      background: '',
      healthStatus: '',

      stats: {
        money: 0,
        energy: 100,
        health: 100,
        happiness: 70,
        luck: 10,
      },

      inventory: [],
    });
  }
  return users.get(chatId);
}

function mainMenu() {
  return {
    keyboard: [
      [{ text: "👤 پروفایل" }, { text: "💼 کار" }],
      [{ text: "🛌 استراحت" }, { text: "🧭 اکتشاف" }],
      [{ text: "🎒 کوله‌پشتی" }, { text: "🛒 فروشگاه" }],
      [{ text: "❓ راهنما" }]
    ],
    resize_keyboard: true
  };
}

function clampStats(user) {
  user.stats.money = Math.max(0, user.stats.money);
  user.stats.energy = clamp(user.stats.energy, 0, 100);
  user.stats.health = clamp(user.stats.health, 0, 100);
  user.stats.happiness = clamp(user.stats.happiness, 0, 100);
  user.stats.luck = clamp(user.stats.luck, 0, 100);
  return user;
}

function profileText(user) {
  return (
    `👤 <b>پروفایل بازیکن</b>\n\n` +
    `🏷️ نام: ${user.name || '-'}\n` +
    `🚻 جنسیت: ${user.gender || '-'}\n` +
    `🎂 سن: ${user.age || '-'}\n` +
    `📍 استان: ${user.province || '-'}\n` +
    `🏙️ شهرستان: ${user.city || '-'}\n` +
    `🎨 رنگ پوست: ${user.skinColor || '-'}\n` +
    `🎚️ سختی: ${user.difficulty || '-'}\n` +
    `📖 پیش‌زمینه: ${user.background || '-'}\n` +
    `❤️ سلامت اولیه: ${user.healthStatus || '-'}\n\n` +
    `💰 پول: ${user.stats.money}\n` +
    `⚡ انرژی: ${user.stats.energy}\n` +
    `❤️ سلامتی: ${user.stats.health}\n` +
    `😊 شادی: ${user.stats.happiness}\n` +
    `🍀 شانس: ${user.stats.luck}`
  );
}

function wizardKeyboard(step, page = 0) {
  if (step === 'gender') {
    return {
      inline_keyboard: [
        [{ text: "👨 مرد", callback_data: "wiz_gender_👨 مرد" }],
        [{ text: "👩 زن", callback_data: "wiz_gender_👩 زن" }],
        [{ text: "⚧️ سایر", callback_data: "wiz_gender_⚧️ سایر" }],
      ]
    };
  }

  if (step === 'difficulty') {
    return {
      inline_keyboard: difficulties.map(d => ([{
        text: d.label,
        callback_data: `wiz_difficulty_${d.label}`
      }]))
    };
  }

  if (step === 'background') {
    return {
      inline_keyboard: backgrounds.map(b => ([{
        text: b.label,
        callback_data: `wiz_background_${b.label}`
      }]))
    };
  }

  if (step === 'province') {
    const start = page * 8;
    const items = provinces.slice(start, start + 8).map(p => ([{
      text: p,
      callback_data: `wiz_province_${p}`
    }]));
    const nav = [];
    if (page > 0) nav.push({ text: '⬅️ قبلی', callback_data: `wiz_province_page_${page - 1}` });
    if (start + 8 < provinces.length) nav.push({ text: 'بعدی ➡️', callback_data: `wiz_province_page_${page + 1}` });
    if (nav.length) items.push(nav);
    return { inline_keyboard: items };
  }

  if (step === 'skin') {
    return {
      inline_keyboard: skinColors.map(s => ([{
        text: `🎨 ${s}`,
        callback_data: `wiz_skin_${s}`
      }]))
    };
  }

  return { inline_keyboard: [] };
}

function levelUp(user) {
  while (user.stats.xp >= user.level * 100) {
    user.stats.xp -= user.level * 100;
    user.level += 1;
    user.stats.money += 150;
    user.stats.energy = clamp(user.stats.energy + 10, 0, 100);
    user.stats.health = clamp(user.stats.health + 5, 0, 100);
  }
}

function reward(user, money, xp, health = 0) {
  user.stats.money += money;
  user.stats.xp += xp;
  user.stats.health = clamp(user.stats.health + health, 0, 100);
  levelUp(user);
  return user;
}

function punishment(user, money, health = 0) {
  user.stats.money = Math.max(0, user.stats.money - money);
  user.stats.health = clamp(user.stats.health - health, 0, 100);
  return user;
}

// =====================
// ROUTES
// =====================
app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  try {
    const { message, callback_query } = req.body || {};
    const chatId = message?.chat?.id || callback_query?.message?.chat?.id;
    const fromId = message?.from?.id || callback_query?.from?.id;
    const text = message?.text || '';
    const data = callback_query?.data || '';

    if (callback_query?.id) await answerCallbackQuery(callback_query.id).catch(() => {});

    if (!chatId) return res.sendStatus(200);

    const user = getUser(chatId);

    // =====================
    // WIZARD STATES
    // =====================
    const state = states.get(chatId);

    if (message && state) {
      if (state === 'await_name') {
        user.name = text.trim();
        states.set(chatId, 'await_age');
        await sendMessage(chatId, '🎂 سن شخصیت را وارد کن:', mainMenu());
        return res.sendStatus(200);
      }

      if (state === 'await_age') {
        const age = parseInt(text, 10);
        if (!age || age < 10 || age > 80) {
          await sendMessage(chatId, '❌ سن معتبر نیست. یک عدد بین 10 تا 80 بفرست.', mainMenu());
          return res.sendStatus(200);
        }
        user.age = age;
        states.set(chatId, 'await_city');
        await sendMessage(chatId, '🏙️ نام شهرستان را وارد کن:', mainMenu());
        return res.sendStatus(200);
      }

      if (state === 'await_city') {
        user.city = text.trim();
        states.set(chatId, 'done');
        users.set(chatId, user);
        states.delete(chatId);
        await sendMessage(chatId, '✅ شخصیت ساخته شد!\n\n' + profileText(user), mainMenu());
        return res.sendStatus(200);
      }
    }

    // =====================
    // START
    // =====================
    if (text === '/start') {
      users.set(chatId, user);
      if (!user.name) {
        states.set(chatId, 'await_name');
        await sendMessage(
          chatId,
          'سلام! 👋\n\nبیایم شخصیتت رو بسازیم.\n\n✍️ اول نام شخصیت را بفرست:',
          {
            keyboard: [],
            remove_keyboard: true
          }
        );
        return res.sendStatus(200);
      }

      await sendMessage(chatId, '👋 خوش برگشتی!\n\n' + profileText(user), mainMenu());
      return res.sendStatus(200);
    }

    // =====================
    // MAIN TEXT BUTTONS
    // =====================
    if (text === '👤 پروفایل') {
      await sendMessage(chatId, profileText(user), mainMenu());
      return res.sendStatus(200);
    }

    if (text === '💼 کار') {
      if (user.stats.energy < 15) {
        await sendMessage(chatId, '😮‍💨 انرژی‌ات برای کار کافی نیست. اول یکم استراحت کن.', mainMenu());
        return res.sendStatus(200);
      }

      const job = jobs[rand(0, jobs.length - 1)];
      const earned = rand(job.minMoney, job.maxMoney);
      const usedEnergy = rand(job.minEnergy, job.maxEnergy);

      user.stats.money += earned;
      user.stats.energy = clamp(user.stats.energy - usedEnergy, 0, 100);
      user.stats.happiness = clamp(user.stats.happiness + job.happiness, 0, 100);
      user.stats.xp += rand(8, 18);
      levelUp(user);

      users.set(chatId, clampStats(user));

      await sendMessage(
        chatId,
        `💼 <b>کار انجام شد</b>\n\n` +
        `🏷️ شغل: ${job.name}\n` +
        `💵 درآمد: ${earned}\n` +
        `⚡ انرژی مصرفی: ${usedEnergy}\n` +
        `😊 تغییر شادی: ${job.happiness >= 0 ? '+' : ''}${job.happiness}\n` +
        `⭐ XP: +${user.stats.xp}\n\n` +
        `📊 وضعیت فعلی:\n` +
        `💰 پول: ${user.stats.money}\n` +
        `⚡ انرژی: ${user.stats.energy}\n` +
        `❤️ سلامتی: ${user.stats.health}\n` +
        `😊 شادی: ${user.stats.happiness}`,
        mainMenu()
      );
      return res.sendStatus(200);
    }

    if (text === '🛌 استراحت') {
      if (user.stats.energy >= 100) {
        await sendMessage(chatId, '✨ انرژی‌ات کامله و فعلاً نیازی به استراحت نداری.', mainMenu());
        return res.sendStatus(200);
      }

      const rest = rests[rand(0, rests.length - 1)];
      const gainedEnergy = rand(rest.minEnergy, rest.maxEnergy);

      user.stats.energy = clamp(user.stats.energy + gainedEnergy, 0, 100);
      user.stats.health = clamp(user.stats.health + rest.health, 0, 100);
      user.stats.happiness = clamp(user.stats.happiness + rest.happiness, 0, 100);
      user.stats.xp += rand(3, 8);
      levelUp(user);

      users.set(chatId, clampStats(user));

      await sendMessage(
        chatId,
        `🛌 <b>استراحت انجام شد</b>\n\n` +
        `🏷️ نوع استراحت: ${rest.name}\n` +
        `⚡ انرژی دریافتی: ${gainedEnergy}\n` +
        `❤️ سلامتی: ${rest.health >= 0 ? '+' : ''}${rest.health}\n` +
        `😊 شادی: ${rest.happiness >= 0 ? '+' : ''}${rest.happiness}\n\n` +
        `📊 انرژی فعلی: ${user.stats.energy}`,
        mainMenu()
      );
      return res.sendStatus(200);
    }

    if (text === '🧭 اکتشاف') {
      if (user.stats.energy < 10) {
        await sendMessage(chatId, '😵 برای اکتشاف انرژی کافی نداری. اول استراحت کن.', mainMenu());
        return res.sendStatus(200);
      }

      const event = exploreEvents[rand(0, exploreEvents.length - 1)];
      user.stats.energy = clamp(user.stats.energy - rand(6, 14), 0, 100);

      let messageText = `🧭 <b>نتیجه اکتشاف</b>\n\n${event.name}\n\n`;

      if (event.type === "money" || event.type === "treasure") {
        const amount = rand(event.min, event.max);
        user.stats.money += amount;
        user.stats.xp += rand(5, 12);
        messageText += `💵 پول به‌دست‌آمده: ${amount}\n`;
      } else if (event.type === "item" || event.type === "food" || event.type === "bag") {
        user.inventory.push(event.item);
        user.stats.xp += rand(4, 10);
        messageText += `🎒 آیتم جدید: ${event.item}\n`;
      } else if (event.type === "damage") {
        const dmg = rand(event.min, event.max);
        user.stats.health = clamp(user.stats.health - dmg, 0, 100);
        messageText += `🤕 آسیب: ${dmg}\n`;
      } else if (event.type === "trouble") {
        const fine = rand(event.min, event.max);
        user.stats.money = Math.max(0, user.stats.money - fine);
        messageText += `💸 جریمه: ${fine}\n`;
      } else if (event.type === "luck") {
        user.stats.luck = clamp(user.stats.luck + event.luck, 0, 100);
        user.stats.happiness = clamp(user.stats.happiness + event.happiness, 0, 100);
        messageText += `🍀 شانس: +${event.luck}\n😊 شادی: +${event.happiness}\n`;
      } else if (event.type === "lost") {
        const lostEnergy = rand(event.min, event.max);
        user.stats.energy = clamp(user.stats.energy - lostEnergy, 0, 100);
        messageText += `⚡ انرژی اضافه از دست رفت: ${lostEnergy}\n`;
      }

      levelUp(user);
      users.set(chatId, clampStats(user));

      messageText += `\n📊 وضعیت فعلی:\n` +
        `💰 پول: ${user.stats.money}\n` +
        `⚡ انرژی: ${user.stats.energy}\n` +
        `❤️ سلامتی: ${user.stats.health}\n` +
        `😊 شادی: ${user.stats.happiness}\n` +
        `🍀 شانس: ${user.stats.luck}`;

      await sendMessage(chatId, messageText, mainMenu());
      return res.sendStatus(200);
    }

    if (text === '🎒 کوله‌پشتی') {
      const items = user.inventory.length
        ? user.inventory.map((item, i) => `${i + 1}. ${item}`).join('\n')
        : 'خالیه.';

      await sendMessage(chatId, `🎒 <b>کوله‌پشتی</b>\n\n${items}`, mainMenu());
      return res.sendStatus(200);
    }

    if (text === '🛒 فروشگاه') {
      await sendMessage(
        chatId,
        `🛒 <b>فروشگاه</b>\n\n` +
        `1. 🧃 نوشیدنی انرژی‌زا — 120\n` +
        `2. 🍞 غذا — 180\n` +
        `3. 💊 دارو — 250\n\n` +
        `نسخه بعدی: خرید واقعی و استفاده از آیتم‌ها`,
        mainMenu()
      );
      return res.sendStatus(200);
    }

    if (text === '❓ راهنما') {
      await sendMessage(
        chatId,
        `❓ <b>راهنمای بازی</b>\n\n` +
        `👤 پروفایل: نمایش اطلاعات شخصیت\n` +
        `💼 کار: کسب پول با مصرف انرژی\n` +
        `🛌 استراحت: بازیابی انرژی و کمی سلامتی\n` +
        `🧭 اکتشاف: رویدادهای تصادفی و آیتم\n` +
        `🎒 کوله‌پشتی: نمایش آیتم‌ها\n` +
        `🛒 فروشگاه: آیتم‌های قابل خرید (فعلاً نمایشی)\n\n` +
        `هدف: کار کن، استراحت کن، اکتشاف کن و پیشرفت کن.`,
        mainMenu()
      );
      return res.sendStatus(200);
    }

    // =====================
    // CALLBACK QUERY / WIZARD INLINE BUTTONS
    // =====================
    if (callback_query) {
      if (data === 'wiz_start') {
        states.set(chatId, 'await_name');
        await sendMessage(chatId, '✍️ نام شخصیت را بفرست:', {
          keyboard: [],
          remove_keyboard: true
        });
      }

      if (data.startsWith('wiz_gender_')) {
        user.gender = data.replace('wiz_gender_', '');
        users.set(chatId, user);
        states.set(chatId, 'await_age');
        await sendMessage(chatId, `✅ جنسیت انتخاب شد: ${user.gender}\n\n🎂 حالا سن را وارد کن:`, mainMenu());
      }

      if (data.startsWith('wiz_difficulty_')) {
        user.difficulty = data.replace('wiz_difficulty_', '');
        const diff = difficulties.find(d => d.label === user.difficulty);
        if (diff) {
          user.stats.money = diff.money;
          user.stats.energy = diff.energy;
          user.stats.health = diff.health;
          user.stats.happiness = diff.happiness;
          user.stats.luck = diff.luck;
        }
        users.set(chatId, user);
        await sendMessage(chatId, `✅ سختی انتخاب شد: ${user.difficulty}`, mainMenu());
      }

      if (data.startsWith('wiz_background_')) {
        user.background = data.replace('wiz_background_', '');
        const bg = backgrounds.find(b => b.label === user.background);
        if (bg) {
          user.stats.money += bg.money;
          user.stats.energy = clamp(user.stats.energy + bg.energy, 0, 100);
          user.stats.health = clamp(user.stats.health + bg.health, 0, 100);
          user.stats.happiness = clamp(user.stats.happiness + bg.happiness, 0, 100);
          user.stats.luck = clamp(user.stats.luck + bg.luck, 0, 100);
        }
        users.set(chatId, user);
        await sendMessage(chatId, `✅ پیش‌زمینه انتخاب شد: ${user.background}`, mainMenu());
      }

      if (data.startsWith('wiz_province_page_')) {
        const page = parseInt(data.replace('wiz_province_page_', ''), 10) || 0;
        await sendMessage(chatId, '📍 استان را انتخاب کن:', wizardKeyboard('province', page));
      }

      if (data.startsWith('wiz_province_')) {
        user.province = data.replace('wiz_province_', '');
        users.set(chatId, user);
        await sendMessage(chatId, `✅ استان انتخاب شد: ${user.province}\n\n🎨 رنگ پوست را انتخاب کن:`, wizardKeyboard('skin'));
      }

      if (data.startsWith('wiz_skin_')) {
        user.skinColor = data.replace('wiz_skin_', '');
        users.set(chatId, user);
        await sendMessage(chatId, `✅ رنگ پوست انتخاب شد: ${user.skinColor}\n\nحالا اگر می‌خواهی ادامه بده و سن/شهر را تکمیل کن.`, mainMenu());
      }

      return res.sendStatus(200);
    }

    // =====================
    // DEFAULT
    // =====================
    await sendMessage(chatId, 'از منوی زیر استفاده کن 👇', mainMenu());
    return res.sendStatus(200);

  } catch (err) {
    console.error('Webhook error:', err);
    return res.sendStatus(200);
  }
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`✅ Bot running on port ${PORT}`);
  console.log(`🔗 Webhook path: /webhook/${SECRET_PATH}`);
});
