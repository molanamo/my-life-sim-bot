const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const userStates = new Map();
const userData = new Map();

const WELCOME_IMAGE = "https://i.ibb.co/your-welcome-image.jpg";

const MENU_IMAGES = {
  file: "https://ibb.co/Kck5rLqj",
  market: "https://ibb.co/yFw2LSS1",
  survival: "https://ibb.co/zVwDvfLM",
  arms: "https://ibb.co/PvK0nHjd",
  map: "https://i.ibb.co/your-map-image.jpg",
  network: "https://i.ibb.co/your-network-image.jpg",
  safehouse: "https://i.ibb.co/your-safehouse-image.jpg"
};

const provinces = {
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "اهر", "میانه"],
  "آذربایجان غربی": ["ارومیه", "خوی", "مهاباد", "بوکان", "میاندوآب"],
  "اردبیل": ["اردبیل", "مشگین‌شهر", "خلخال", "پارس‌آباد", "گرمی"],
  "اصفهان": ["اصفهان", "کاشان", "نجف‌آباد", "خمینی‌شهر", "شاهین‌شهر"],
  "البرز": ["کرج", "نظرآباد", "هشتگرد", "طالقان", "اشتهارد"],
  "ایلام": ["ایلام", "دهلران", "مهران", "آبدانان", "ایوان"],
  "بوشهر": ["بوشهر", "برازجان", "گناوه", "دشتستان", "دیر"],
  "تهران": ["تهران", "ری", "اسلامشهر", "شهریار", "دماوند"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فارسان", "لردگان", "سامان"],
  "خراسان جنوبی": ["بیرجند", "قائن", "فردوس", "طبس", "نهبندان"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت‌حیدریه", "کاشمر"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین", "جاجرم", "فاروج"],
  "خوزستان": ["اهواز", "آبادان", "خرمشهر", "دزفول", "ماهشهر"],
  "زنجان": ["زنجان", "ابهر", "خدابنده", "طارم", "خرمدره"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدیشهر"],
  "سیستان و بلوچستان": ["زاهدان", "چابهار", "ایرانشهر", "زابل", "خاش"],
  "فارس": ["شیراز", "مرودشت", "جهرم", "کازرون", "فسا"],
  "قزوین": ["قزوین", "الوند", "تاکستان", "آبیک", "بوئین‌زهرا"],
  "قم": ["قم", "جعفریه", "کهک", "دستجرد", "قنوات"],
  "کردستان": ["سنندج", "سقز", "مریوان", "بانه", "قروه"],
  "کرمان": ["کرمان", "رفسنجان", "جیرفت", "سیرجان", "بم"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "سنقر", "قصر شیرین", "هرسین"],
  "کهگیلویه و بویراحمد": ["یاسوج", "دوگنبدان", "دهدشت", "لیکک", "سی‌سخت"],
  "گلستان": ["گرگان", "گنبدکاووس", "علی‌آباد", "آزادشهر", "مینودشت"],
  "گیلان": ["رشت", "انزلی", "لاهیجان", "لنگرود", "آستارا"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "نوشهر"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان"],
  "هرمزگان": ["بندرعباس", "قشم", "کیش", "میناب", "بندرلنگه"],
  "همدان": ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "تفت"]
};

async function tg(method, payload) {
  try {
    return await axios.post(`${API}/${method}`, payload);
  } catch (e) {
    console.log("Telegram error:", e.response?.data || e.message);
  }
}

function mainMenuKeyboard() {
  return {
    keyboard: [
      ["📂 پرونده", "🏴‍☠️ بازار سیاه"],
      ["⚔️ زرادخانه", "🔥 تلاش برای بقا"],
      ["🗺 نقشه شهر", "🕸 شبکه نفوذ"],
      ["🏠 پناهگاه"]
    ],
    resize_keyboard: true
  };
}

function genderKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "مرد", callback_data: "gender:male" }],
      [{ text: "زن", callback_data: "gender:female" }]
    ]
  };
}

function provincesKeyboard(page = 0) {
  const provinceNames = Object.keys(provinces);
  const perPage = 9;
  const start = page * perPage;
  const current = provinceNames.slice(start, start + perPage);

  const rows = [];
  for (let i = 0; i < current.length; i += 3) {
    rows.push(
      current.slice(i, i + 3).map(name => ({
        text: name,
        callback_data: `province:${name}:${page}`
      }))
    );
  }

  const nav = [];
  if (page > 0) nav.push({ text: "⬅️ قبلی", callback_data: `province_page:${page - 1}` });
  if (start + perPage < provinceNames.length) nav.push({ text: "➡️ بعدی", callback_data: `province_page:${page + 1}` });
  if (nav.length) rows.push(nav);

  return { inline_keyboard: rows };
}

function citiesKeyboard(provinceName) {
  const cities = provinces[provinceName] || [];
  const rows = [];
  for (let i = 0; i < cities.length; i += 2) {
    rows.push(
      cities.slice(i, i + 2).map(city => ({
        text: city,
        callback_data: `city:${provinceName}:${city}`
      }))
    );
  }
  rows.push([{ text: "🔙 بازگشت به استان‌ها", callback_data: "province_page:0" }]);
  return { inline_keyboard: rows };
}

async function sendWelcome(chatId, firstName = "") {
  await tg("sendPhoto", {
    chat_id: chatId,
    photo: WELCOME_IMAGE,
    caption:
      `خوش اومدی ${firstName}\n\n` +
      `به شبیه‌ساز زندگی خوش اومدی.\n` +
      `برای شروع باید ثبت‌نام کنی.`,
    reply_markup: {
      inline_keyboard: [[{ text: "🚀 شروع ثبت‌نام", callback_data: "start_register" }]]
    }
  });
}

async function sendMainMenu(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "منوی اصلی:",
    reply_markup: mainMenuKeyboard()
  });
}

async function sendMenuImage(chatId, key, title) {
  const img = MENU_IMAGES[key];
  await tg("sendPhoto", {
    chat_id: chatId,
    photo: img,
    caption: title,
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 بازگشت به منوی اصلی", callback_data: "back_main" }]]
    }
  });
}

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (text === "/start") {
      if (!userData.has(userId)) {
        userStates.set(userId, { step: "idle" });
        await sendWelcome(chatId, msg.from.first_name || "");
      } else {
        await sendMainMenu(chatId);
      }
      return;
    }

    const state = userStates.get(userId);

    if (state?.step === "awaiting_name") {
      userData.set(userId, {
        id: userId,
        telegramName: msg.from.first_name || "",
        name: text
      });

      userStates.set(userId, { step: "awaiting_gender" });

      await tg("sendMessage", {
        chat_id: chatId,
        text: "جنسیتت رو انتخاب کن:",
        reply_markup: genderKeyboard()
      });
      return;
    }

    if (userData.has(userId)) {
      if (text === "📂 پرونده") {
        const data = userData.get(userId);
        await sendMenuImage(
          chatId,
          "file",
          `📂 پرونده\n\nاسم: ${data.name}\nجنسیت: ${data.gender}\nاستان: ${data.province}\nشهرستان: ${data.city}`
        );
        return;
      }

      if (text === "🏴‍☠️ بازار سیاه") {
        await sendMenuImage(chatId, "market", "🏴‍☠️ بازار سیاه");
        return;
      }

      if (text === "⚔️ زرادخانه") {
        await sendMenuImage(chatId, "arms", "⚔️ زرادخانه");
        return;
      }

      if (text === "🔥 تلاش برای بقا") {
        await sendMenuImage(chatId, "survival", "🔥 تلاش برای بقا");
        return;
      }

      if (text === "🗺 نقشه شهر") {
        await sendMenuImage(chatId, "map", "🗺 نقشه شهر");
        return;
      }

      if (text === "🕸 شبکه نفوذ") {
        await sendMenuImage(chatId, "network", "🕸 شبکه نفوذ");
        return;
      }

      if (text === "🏠 پناهگاه") {
        await sendMenuImage(chatId, "safehouse", "🏠 پناهگاه");
        return;
      }
    }
  }

  if (update.callback_query) {
    const q = update.callback_query;
    const data = q.data;
    const chatId = q.message.chat.id;
    const userId = q.from.id;
    const messageId = q.message.message_id;

    await tg("answerCallbackQuery", {
      callback_query_id: q.id
    });

    if (data === "start_register") {
      userStates.set(userId, { step: "awaiting_name" });
      await tg("sendMessage", {
        chat_id: chatId,
        text: "اسمت رو بفرست:"
      });
      return;
    }

    if (data.startsWith("gender:")) {
      const gender = data.split(":")[1];
      const current = userData.get(userId) || {};
      current.gender = gender === "male" ? "مرد" : "زن";
      userData.set(userId, current);

      userStates.set(userId, { step: "awaiting_province" });

      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "استانت رو انتخاب کن:",
        reply_markup: provincesKeyboard(0)
      });
      return;
    }

    if (data.startsWith("province_page:")) {
      const page = Number(data.split(":")[1]);
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "استانت رو انتخاب کن:",
        reply_markup: provincesKeyboard(page)
      });
      return;
    }

    if (data.startsWith("province:")) {
      const parts = data.split(":");
      const provinceName = parts[1];

      const current = userData.get(userId) || {};
      current.province = provinceName;
      userData.set(userId, current);

      userStates.set(userId, { step: "awaiting_city" });

      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `شهرستانت در ${provinceName} رو انتخاب کن:`,
        reply_markup: citiesKeyboard(provinceName)
      });
      return;
    }

    if (data.startsWith("city:")) {
      const parts = data.split(":");
      const provinceName = parts[1];
      const cityName = parts[2];

      const current = userData.get(userId) || {};
      current.province = provinceName;
      current.city = cityName;
      userData.set(userId, current);

      userStates.set(userId, { step: "registered" });

      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text:
          `✅ ثبت‌نام کامل شد\n\n` +
          `اسم: ${current.name}\n` +
          `جنسیت: ${current.gender}\n` +
          `استان: ${current.province}\n` +
          `شهرستان: ${current.city}`
      });

      await sendMainMenu(chatId);
      return;
    }

    if (data === "back_main") {
      await sendMainMenu(chatId);
      return;
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
