/**
 * index.js (Telegram Bot - Life Simulation)
 * - Webhook over HTTPS
 * - Step-by-step registration: Name -> Gender -> Province (31) -> County/City (5)
 * - Inline "glass" panels (InlineKeyboard) for gender/province/city
 *
 * ENV:
 *   BOT_TOKEN=xxxx
 *   SECRET_PATH=mojaz0762   (example)
 *   PORT=3000               (Railway sets automatically)
 */

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) throw new Error("Missing env BOT_TOKEN");
if (!SECRET_PATH) throw new Error("Missing env SECRET_PATH");

// -------------------------
// 1) DATA: 31 provinces + 5 counties/cities each
// توجه: این 5 مورد برای هر استان «نمونه و قابل تغییر» هستند تا دقیقاً منطق دو مرحله‌ای شما کار کند.
// اگر خواستی بعداً لیست‌ها را کامل و دقیق‌تر کنیم، همین ساختار را نگه می‌داریم.
// -------------------------
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

// -------------------------
// 2) In-memory session (برای شروع خوبه؛ بعداً اگر خواستی دیتابیس می‌زنیم)
// -------------------------
const userStates = new Map(); // chatId -> state
const userData = new Map();   // chatId -> { name, gender, province, city }

const STATES = {
  ASK_NAME: "ASK_NAME",
  ASK_GENDER: "ASK_GENDER",
  ASK_PROVINCE: "ASK_PROVINCE",
  ASK_CITY: "ASK_CITY",
  FINISHED: "FINISHED",
};

// -------------------------
// 3) Helpers
// -------------------------
async function tg(method, payload) {
  return axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, payload);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// کیبورد استان‌ها: 3 ستونه + دکمه بستن/لغو
function provinceKeyboard() {
  const rows = chunk(PROVINCES, 3).map(row =>
    row.map(p => ({
      text: p,
      callback_data: `prov:${p}`,
    }))
  );

  rows.push([{ text: "❌ لغو ثبت‌نام", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

// کیبورد شهرها: 2 ستونه برای مرتب بودن
function cityKeyboard(province) {
  const cities = IRAN_MAP[province] || [];
  const rows = chunk(cities, 2).map(row =>
    row.map(c => ({
      text: c,
      callback_data: `city:${c}`,
    }))
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

// -------------------------
// 4) Routes
// -------------------------
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
    // -------------------------
    // A) Handle button presses (callback_query)
    // -------------------------
    if (update.callback_query) {
      const q = update.callback_query;
      const chatId = q.message.chat.id;
      const data = q.data || "";

      // stop loading spinner
      await tg("answerCallbackQuery", { callback_query_id: q.id });

      // Ensure session objects
      if (!userData.has(chatId)) userData.set(chatId, { name: "", gender: "", province: "", city: "" });
      if (!userStates.has(chatId)) userStates.set(chatId, STATES.ASK_NAME);

      const state = userStates.get(chatId);
      const profile = userData.get(chatId);

      if (data === "cancel") {
        userStates.delete(chatId);
        userData.delete(chatId);
        await tg("sendMessage", {
          chat_id: chatId,
          text: "ثبت‌نام لغو شد. برای شروع دوباره دستور /start را ارسال کنید.",
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

      // Gender selection
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

      // Province selection
      if (data.startsWith("prov:") && state === STATES.ASK_PROVINCE) {
        const province = data.replace("prov:", "");
        profile.province = province;
        profile.city = "";
        userStates.set(chatId, STATES.ASK_CITY);

        await tg("sendMessage", {
          chat_id: chatId,
          text: `🏙 اکنون یکی از شهرستان‌های استان «${province}» را انتخاب کنید:`,
          reply_markup: cityKeyboard(province),
        });
        return;
      }

      // City selection
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
            "برای ادامه بازی، دستور /menu را ارسال کنید.",
        });
        return;
      }

      // اگر کاربر خارج از مرحله درست کلیک کرد
      await tg("sendMessage", {
        chat_id: chatId,
        text: "این گزینه در مرحله فعلی قابل انتخاب نیست. لطفاً /start را ارسال کنید.",
      });
      return;
    }

    // -------------------------
    // B) Handle text messages
    // -------------------------
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text === "/start") {
        userStates.set(chatId, STATES.ASK_NAME);
        userData.set(chatId, { name: "", gender: "", province: "", city: "" });

        await tg("sendMessage", {
          chat_id: chatId,
          text: "✨ به شبیه‌ساز زندگی خوش آمدید.\n\nلطفاً «نام نمایشی» خود را ارسال کنید:",
        });
        return;
      }

      if (text === "/menu") {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "منوی بازی هنوز کامل نشده. (مرحله بعدی: اتصال منطق بازی)\nبرای ثبت‌نام مجدد: /start",
        });
        return;
      }

      const state = userStates.get(chatId);

      // Name step
      if (state === STATES.ASK_NAME) {
        const name = text.slice(0, 32); // محدودیت منطقی
        const profile = { name, gender: "", province: "", city: "" };
        userData.set(chatId, profile);
        userStates.set(chatId, STATES.ASK_GENDER);

        await tg("sendMessage", {
          chat_id: chatId,
          text: "⚧ جنسیت را انتخاب کنید:",
          reply_markup: genderKeyboard(),
        });
        return;
      }

      // اگر وسط مراحل پیام تایپی بده
      if (state === STATES.ASK_GENDER || state === STATES.ASK_PROVINCE || state === STATES.ASK_CITY) {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "لطفاً از دکمه‌های زیر استفاده کنید. (برای شروع دوباره: /start)",
        });
        return;
      }

      // Default
      await tg("sendMessage", {
        chat_id: chatId,
        text: "برای شروع ثبت مشخصات دستور /start را ارسال کنید.",
      });
    }
  } catch (err) {
    console.error("Bot error:", err.response?.data || err.message);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
