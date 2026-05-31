const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

// عکس خوش‌آمدگویی (همون لینک مستقیم i.ibb.co که قبلاً اوکی بود)
const PHOTO_URL =
  process.env.PHOTO_URL ||
  "https://i.ibb.co/wNrCttFV/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

if (!BOT_TOKEN) throw new Error("Missing env BOT_TOKEN");
if (!SECRET_PATH) throw new Error("Missing env SECRET_PATH");

// ---------- 31 استان + 5 شهرستان ----------
const IRAN_MAP = {
  "آذربایجان شرقی": ["تبریز", "مراغه", "مرند", "میانه", "اهر"],
  "آذربایجان غربی": ["ارومیه", "خوی", "میاندوآب", "بوکان", "مهاباد"],
  "اردبیل": ["اردبیل", "مشگین‌شهر", "پارس‌آباد", "خلخال", "گرمی"],
  "اصفهان": ["اصفهان", "کاشان", "نجف‌آباد", "خمینی‌شهر", "شاهین‌شهر"],
  "البرز": ["کرج", "فردیس", "ساوجبلاغ", "نظرآباد", "طالقان"],
  "ایلام": ["ایلام", "دهلران", "آبدانان", "ایوان", "مهران"],
  "بوشهر": ["بوشهر", "برازجان", "گناوه", "کنگان", "دیر"],
  "تهران": ["تهران", "شهریار", "ورامین", "دماوند", "پاکدشت"],
  "چهارمحال و بختیاری": ["شهرکرد", "بروجن", "فارسان", "لردگان", "کیار"],
  "خراسان جنوبی": ["بیرجند", "قائن", "طبس", "فردوس", "نهبندان"],
  "خراسان رضوی": ["مشهد", "نیشابور", "سبزوار", "تربت‌حیدریه", "قوچان"],
  "خراسان شمالی": ["بجنورد", "شیروان", "اسفراین", "جاجرم", "فاروج"],
  "خوزستان": ["اهواز", "آبادان", "خرمشهر", "دزفول", "ماهشهر"],
  "زنجان": ["زنجان", "ابهر", "خرمدره", "قیدار", "ماه‌نشان"],
  "سمنان": ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"],
  "سیستان و بلوچستان": ["زاهدان", "ایرانشهر", "چابهار", "زابل", "خاش"],
  "فارس": ["شیراز", "مرودشت", "کازرون", "جهرم", "لار"],
  "قزوین": ["قزوین", "البرز", "آبیک", "بوئین‌زهرا", "تاکستان"],
  "قم": ["قم", "جعفریه", "کهک", "سلفچگان", "دستجرد"],
  "کردستان": ["سنندج", "سقز", "مریوان", "بانه", "قروه"],
  "کرمان": ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم"],
  "کرمانشاه": ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "سرپل‌ذهاب", "کنگاور"],
  "کهگیلویه و بویراحمد": ["یاسوج", "دوگنبدان", "دهدشت", "لیکک", "چرام"],
  "گلستان": ["گرگان", "گنبدکاووس", "علی‌آباد کتول", "آق‌قلا", "بندرترکمن"],
  "گیلان": ["رشت", "انزلی", "لاهیجان", "لنگرود", "رودسر"],
  "لرستان": ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز", "کوهدشت"],
  "مازندران": ["ساری", "بابل", "آمل", "قائم‌شهر", "نوشهر"],
  "مرکزی": ["اراک", "ساوه", "خمین", "محلات", "دلیجان"],
  "هرمزگان": ["بندرعباس", "قشم", "کیش", "میناب", "بندرلنگه"],
  "همدان": ["همدان", "ملایر", "نهاوند", "تویسرکان", "کبودرآهنگ"],
  "یزد": ["یزد", "میبد", "اردکان", "بافق", "تفت"],
};

const PROVINCES = Object.keys(IRAN_MAP);

// ---------- session ----------
const STATES = {
  ASK_NAME: "ASK_NAME",
  ASK_GENDER: "ASK_GENDER",
  ASK_PROVINCE: "ASK_PROVINCE",
  ASK_CITY: "ASK_CITY",
  FINISHED: "FINISHED",
};

const userStates = new Map(); // chatId -> state
const userData = new Map();   // chatId -> profile

// ---------- helpers ----------
async function tg(method, payload) {
  return axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, payload);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function provinceKeyboard() {
  const rows = chunk(PROVINCES, 3).map((row) =>
    row.map((p) => ({ text: p, callback_data: `prov:${p}` }))
  );
  rows.push([{ text: "❌ لغو ثبت‌نام", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

function cityKeyboard(province) {
  const cities = IRAN_MAP[province] || [];
  const rows = chunk(cities, 2).map((row) =>
    row.map((c) => ({ text: c, callback_data: `city:${c}` }))
  );
  rows.push([
    { text: "⬅️ تغییر استان", callback_data: "back:province" },
    { text: "❌ لغو", callback_data: "cancel" },
  ]);
  return { inline_keyboard: rows };
}

function genderKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "👨 مرد", callback_data: "gender:مرد" },
        { text: "👩 زن", callback_data: "gender:زن" },
      ],
      [{ text: "❌ لغو ثبت‌نام", callback_data: "cancel" }],
    ],
  };
}

// ---------- routes ----------
app.get("/", (req, res) => res.send("Bot is ALIVE!"));

app.get("/setwebhook", async (req, res) => {
  try {
    const baseUrl = `https://${req.get("host")}`;
    const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;
    const r = await tg("setWebhook", { url: webhookUrl });
    res.json({ ok: true, webhookUrl, telegram: r.data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.response?.data || e.message });
  }
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  try {
    // ----- callback buttons -----
    if (update.callback_query) {
      const q = update.callback_query;
      const chatId = q.message.chat.id;
      const data = q.data || "";

      await tg("answerCallbackQuery", { callback_query_id: q.id });

      if (!userData.has(chatId))
        userData.set(chatId, { name: "", gender: "", province: "", city: "" });
      if (!userStates.has(chatId)) userStates.set(chatId, STATES.ASK_NAME);

      const state = userStates.get(chatId);
      const profile = userData.get(chatId);

      if (data === "cancel") {
        userStates.delete(chatId);
        userData.delete(chatId);
        await tg("sendMessage", {
          chat_id: chatId,
          text: "ثبت‌نام لغو شد. برای شروع دوباره /start را ارسال کنید.",
        });
        return;
      }

      if (data === "back:province") {
        userStates.set(chatId, STATES.ASK_PROVINCE);
        profile.province = "";
        profile.city = "";
        await tg("sendMessage", {
          chat_id: chatId,
          text: "📍 استان محل سکونت خود را انتخاب کنید:",
          reply_markup: provinceKeyboard(),
        });
        return;
      }

      if (data.startsWith("gender:") && state === STATES.ASK_GENDER) {
        profile.gender = data.replace("gender:", "");
        userStates.set(chatId, STATES.ASK_PROVINCE);

        await tg("sendMessage", {
          chat_id: chatId,
          text: "📍 استان محل سکونت خود را انتخاب کنید:",
          reply_markup: provinceKeyboard(),
        });
        return;
      }

      if (data.startsWith("prov:") && state === STATES.ASK_PROVINCE) {
        const province = data.replace("prov:", "");
        profile.province = province;
        profile.city = "";
        userStates.set(chatId, STATES.ASK_CITY);

        await tg("sendMessage", {
          chat_id: chatId,
          text: `🏙 یکی از شهرستان‌های استان «${province}» را انتخاب کنید:`,
          reply_markup: cityKeyboard(province),
        });
        return;
      }

      if (data.startsWith("city:") && state === STATES.ASK_CITY) {
        const city = data.replace("city:", "");
        profile.city = city;
        userStates.set(chatId, STATES.FINISHED);

        await tg("sendMessage", {
          chat_id: chatId,
          text:
            "✅ ثبت مشخصات تکمیل شد:\n\n" +
            `👤 نام: ${profile.name}\n` +
            `⚧ جنسیت: ${profile.gender}\n` +
            `📍 محل سکونت: ${profile.province} - ${profile.city}\n\n` +
            "برای ادامه: /menu",
        });
        return;
      }

      await tg("sendMessage", {
        chat_id: chatId,
        text: "این گزینه در مرحله فعلی معتبر نیست. /start",
      });
      return;
    }

    // ----- text messages -----
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text === "/start") {
        userStates.set(chatId, STATES.ASK_NAME);
        userData.set(chatId, { name: "", gender: "", province: "", city: "" });

        // اینجا عکس + دکمه شیشه‌ای میاد
        try {
          await tg("sendPhoto", {
            chat_id: chatId,
            photo: PHOTO_URL,
            caption:
              "✨ *به شبیه‌ساز زندگی خوش آمدید*\n\n" +
              "لطفاً «نام نمایشی» خود را ارسال کنید:",
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [[{ text: "❌ لغو ثبت‌نام", callback_data: "cancel" }]],
            },
          });
        } catch (err) {
          // اگر عکس به هر دلیل Fail شد
          await tg("sendMessage", {
            chat_id: chatId,
            text:
              "✨ به شبیه‌ساز زندگی خوش آمدید.\n\n" +
              "لطفاً «نام نمایشی» خود را ارسال کنید:",
            reply_markup: {
              inline_keyboard: [[{ text: "❌ لغو ثبت‌نام", callback_data: "cancel" }]],
            },
          });
        }
        return;
      }

      if (text === "/menu") {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "منو هنوز کامل نشده. (بعدش منطق بازی رو می‌چسبونیم)\nبرای ثبت‌نام: /start",
        });
        return;
      }

      const state = userStates.get(chatId);

      if (state === STATES.ASK_NAME) {
        const name = text.slice(0, 32);
        const profile = userData.get(chatId) || { name: "", gender: "", province: "", city: "" };
        profile.name = name;
        userData.set(chatId, profile);

        userStates.set(chatId, STATES.ASK_GENDER);
        await tg("sendMessage", {
          chat_id: chatId,
          text: "⚧ جنسیت را انتخاب کنید:",
          reply_markup: genderKeyboard(),
        });
        return;
      }

      if (state === STATES.ASK_GENDER || state === STATES.ASK_PROVINCE || state === STATES.ASK_CITY) {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "لطفاً از دکمه‌های شیشه‌ای استفاده کنید. /start",
        });
        return;
      }

      await tg("sendMessage", {
        chat_id: chatId,
        text: "برای شروع: /start",
      });
    }
  } catch (err) {
    console.error("Bot error:", err.response?.data || err.message);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
