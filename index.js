const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "secret";
const PORT = process.env.PORT || 3000;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const userStates = new Map();
const userData = new Map();

const WELCOME_IMAGE = https://i.ibb.co/wNrCttFV/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

const MENU_IMAGES = {
  file: "https://ibb.co/Kck5rLqj",
  market: "https://ibb.co/yFw2LSS1",
  survival: "https://ibb.co/zVwDvfLM",
  arms: "https://ibb.co/PvK0nHjd",
};

const provinces = {
  "آذربایجان شرقی": ["تبریز","مراغه","مرند","اهر","میانه"],
  "آذربایجان غربی": ["ارومیه","خوی","مهاباد","بوکان","میاندوآب"],
  "اردبیل": ["اردبیل","مشگین‌شهر","خلخال","پارس‌آباد","گرمی"],
  "اصفهان": ["اصفهان","کاشان","نجف‌آباد","خمینی‌شهر","شاهین‌شهر"],
  "البرز": ["کرج","نظرآباد","هشتگرد","طالقان","اشتهارد"],
  "ایلام": ["ایلام","دهلران","مهران","آبدانان","ایوان"],
  "بوشهر": ["بوشهر","برازجان","گناوه","دیر","جم"],
  "تهران": ["تهران","ری","اسلامشهر","شهریار","دماوند"],
  "چهارمحال و بختیاری": ["شهرکرد","بروجن","فارسان","لردگان","سامان"],
  "خراسان جنوبی": ["بیرجند","قائن","فردوس","طبس","نهبندان"],
  "خراسان رضوی": ["مشهد","نیشابور","سبزوار","تربت‌حیدریه","کاشمر"],
  "خراسان شمالی": ["بجنورد","شیروان","اسفراین","جاجرم","فاروج"],
  "خوزستان": ["اهواز","آبادان","خرمشهر","دزفول","ماهشهر"],
  "زنجان": ["زنجان","ابهر","خدابنده","طارم","خرمدره"],
  "سمنان": ["سمنان","شاهرود","دامغان","گرمسار","مهدیشهر"],
  "سیستان و بلوچستان": ["زاهدان","چابهار","ایرانشهر","زابل","خاش"],
  "فارس": ["شیراز","مرودشت","جهرم","کازرون","فسا"],
  "قزوین": ["قزوین","الوند","تاکستان","آبیک","بوئین‌زهرا"],
  "قم": ["قم","جعفریه","کهک","دستجرد","قنوات"],
  "کردستان": ["سنندج","سقز","مریوان","بانه","قروه"],
  "کرمان": ["کرمان","رفسنجان","جیرفت","سیرجان","بم"],
  "کرمانشاه": ["کرمانشاه","اسلام‌آباد غرب","سنقر","قصر شیرین","هرسین"],
  "کهگیلویه و بویراحمد": ["یاسوج","دوگنبدان","دهدشت","لیکک","سی‌سخت"],
  "گلستان": ["گرگان","گنبدکاووس","علی‌آباد","آزادشهر","مینودشت"],
  "گیلان": ["رشت","انزلی","لاهیجان","لنگرود","آستارا"],
  "لرستان": ["خرم‌آباد","بروجرد","دورود","کوهدشت","الیگودرز"],
  "مازندران": ["ساری","بابل","آمل","قائم‌شهر","نوشهر"],
  "مرکزی": ["اراک","ساوه","خمین","محلات","دلیجان"],
  "هرمزگان": ["بندرعباس","قشم","کیش","میناب","بندرلنگه"],
  "همدان": ["همدان","ملایر","نهاوند","تویسرکان","اسدآباد"],
  "یزد": ["یزد","میبد","اردکان","بافق","تفت"]
};

async function tg(method, payload) {
  try {
    const res = await axios.post(`${API}/${method}`, payload);
    return res.data;
  } catch (err) {
    console.log("TG ERROR:", err.response?.data || err.message);
    return null;
  }
}

function mainMenuKeyboard() {
  return {
    keyboard: [
      ["📂 پرونده", "🏴‍☠️ خلاف بازار"],
      ["⚔️ اسلحه خانه", "🔥 زنده ماندن"],
      ["🗺 نقشه شهر", "🕸 شبکه نفوذ"],
      ["🏠 پناهگاه"]
    ],
    resize_keyboard: true
  };
}

function genderKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "👨 مرد", callback_data: "gender_male" }],
      [{ text: "👩 زن", callback_data: "gender_female" }]
    ]
  };
}

function provinceKeyboard(page = 0) {
  const keys = Object.keys(provinces);
  const perPage = 9;
  const slice = keys.slice(page * perPage, page * perPage + perPage);
  const rows = [];

  for (let i = 0; i < slice.length; i += 3) {
    rows.push(
      slice.slice(i, i + 3).map(p => ({
        text: p,
        callback_data: `province_${p}`
      }))
    );
  }

  const nav = [];
  if (page > 0) nav.push({ text: "⬅️ قبلی", callback_data: `provincepage_${page - 1}` });
  if ((page + 1) * perPage < keys.length) nav.push({ text: "➡️ بعدی", callback_data: `provincepage_${page + 1}` });
  if (nav.length) rows.push(nav);

  return { inline_keyboard: rows };
}

function cityKeyboard(provinceName) {
  const cities = provinces[provinceName] || [];
  const rows = [];

  for (let i = 0; i < cities.length; i += 2) {
    rows.push(
      cities.slice(i, i + 2).map(c => ({
        text: c,
        callback_data: `city_${provinceName}_${c}`
      }))
    );
  }

  rows.push([{ text: "🔙 بازگشت", callback_data: "provincepage_0" }]);
  return { inline_keyboard: rows };
}

async function sendWelcome(chatId, firstName) {
  await tg("sendPhoto", {
    chat_id: chatId,
    photo: WELCOME_IMAGE,
    caption: `خوش اومدی ${firstName || ""}\nبرای شروع روی دکمه زیر بزن`,
    reply_markup: {
      inline_keyboard: [[{ text: "🚀 شروع", callback_data: "start_register" }]]
    }
  });
}

async function sendMainMenu(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "منوی اصلی",
    reply_markup: mainMenuKeyboard()
  });
}

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  const update = req.body;
  console.log("UPDATE:", JSON.stringify(update));

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (text === "/start") {
      if (!userData.has(userId)) {
        userStates.set(userId, "awaiting_start");
        await sendWelcome(chatId, msg.from.first_name);
      } else {
        await sendMainMenu(chatId);
      }
      return;
    }

    const state = userStates.get(userId);

    if (state === "awaiting_name") {
      userData.set(userId, {
        name: text,
        gender: "",
        province: "",
        city: ""
      });

      userStates.set(userId, "awaiting_gender");

      await tg("sendMessage", {
        chat_id: chatId,
        text: "جنسیت را انتخاب کن",
        reply_markup: genderKeyboard()
      });
      return;
    }

    if (!userData.has(userId)) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "اول /start بزن"
      });
      return;
    }

    if (text === "📂 پرونده") {
      const u = userData.get(userId);
      await tg("sendPhoto", {
        chat_id: chatId,
        photo: MENU_IMAGES.file,
        caption: `📂 پرونده\n\nاسم: ${u.name}\nجنسیت: ${u.gender}\nاستان: ${u.province}\nشهرستان: ${u.city}`
      });
      return;
    }

    if (text === "🏴‍☠️ بازار سیاه") {
      await tg("sendPhoto", { chat_id: chatId, photo: MENU_IMAGES.market, caption: "🏴‍☠️ بازار سیاه" });
      return;
    }

    if (text === "⚔️ زرادخانه") {
      await tg("sendPhoto", { chat_id: chatId, photo: MENU_IMAGES.arms, caption: "⚔️ زرادخانه" });
      return;
    }

    if (text === "🔥 تلاش برای بقا") {
      await tg("sendPhoto", { chat_id: chatId, photo: MENU_IMAGES.survival, caption: "🔥 تلاش برای بقا" });
      return;
    }

    if (text === "🗺 نقشه شهر") {
      await tg("sendPhoto", { chat_id: chatId, photo: MENU_IMAGES.map, caption: "🗺 نقشه شهر" });
      return;
    }

    if (text === "🕸 شبکه نفوذ") {
      await tg("sendPhoto", { chat_id: chatId, photo: MENU_IMAGES.network, caption: "🕸 شبکه نفوذ" });
      return;
    }

    if (text === "🏠 پناهگاه") {
      await tg("sendPhoto", { chat_id: chatId, photo: MENU_IMAGES.safehouse, caption: "🏠 پناهگاه" });
      return;
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
      userStates.set(userId, "awaiting_name");
      await tg("sendMessage", {
        chat_id: chatId,
        text: "اسمت رو بفرست"
      });
      return;
    }

    if (data === "gender_male" || data === "gender_female") {
      const u = userData.get(userId) || {};
      u.gender = data === "gender_male" ? "مرد" : "زن";
      userData.set(userId, u);
      userStates.set(userId, "awaiting_province");

      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "استانت رو انتخاب کن",
        reply_markup: provinceKeyboard(0)
      });
      return;
    }

    if (data.startsWith("provincepage_")) {
      const page = Number(data.split("_")[1]);
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "استانت رو انتخاب کن",
        reply_markup: provinceKeyboard(page)
      });
      return;
    }

    if (data.startsWith("province_")) {
      const provinceName = data.replace("province_", "");
      const u = userData.get(userId) || {};
      u.province = provinceName;
      userData.set(userId, u);
      userStates.set(userId, "awaiting_city");

      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `شهرستان ${provinceName} را انتخاب کن`,
        reply_markup: cityKeyboard(provinceName)
      });
      return;
    }

    if (data.startsWith("city_")) {
      const parts = data.split("_");
      const provinceName = parts[1];
      const cityName = parts.slice(2).join("_");

      const u = userData.get(userId) || {};
      u.province = provinceName;
      u.city = cityName;
      userData.set(userId, u);
      userStates.set(userId, "registered");

      await tg("sendMessage", {
        chat_id: chatId,
        text: `ثبت‌نام کامل شد\n\nاسم: ${u.name}\nجنسیت: ${u.gender}\nاستان: ${u.province}\nشهرستان: ${u.city}`,
        reply_markup: mainMenuKeyboard()
      });
      return;
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
