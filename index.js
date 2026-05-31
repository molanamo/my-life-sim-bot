"use strict";

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

const WELCOME_TEXT = process.env.WELCOME_TEXT || "زندگی خودته";
const WELCOME_PHOTO_URL = process.env.WELCOME_PHOTO_URL || ""; // optional

if (!BOT_TOKEN) {
  console.log("ERROR: BOT_TOKEN is missing.");
}

async function tg(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const res = await axios.post(url, payload, { timeout: 15000 });
    return res.data;
  } catch (e) {
    const data = e?.response?.data;
    console.log("TG_ERROR:", method, data || e.message);
    return null;
  }
}

const keyboardMain = () => ({
  inline_keyboard: [
    [
      { text: "شروع", callback_data: "start_action" },
      { text: "برگشت", callback_data: "back_action" },
    ],
  ],
});

app.get("/", (req, res) => res.status(200).send("ok"));

app.get("/setwebhook", async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;

  const result = await tg("setWebhook", { url: webhookUrl });

  // برای دیباگ خوبه
  const info = await tg("getWebhookInfo", {});

  res.status(200).json({ webhookUrl, setWebhook: result, webhookInfo: info });
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  // سریع 200 بده تا تلگرام دوباره ارسال نکنه
  res.sendStatus(200);

  const u = req.body;

  // 1) /start
  const text = (u?.message?.text || "").trim();
  if (u?.message && text === "/start") {
    const chatId = u.message.chat.id;

    if (WELCOME_PHOTO_URL) {
      await tg("sendPhoto", {
        chat_id: chatId,
        photo: WELCOME_PHOTO_URL,
        caption: WELCOME_TEXT,
        reply_markup: keyboardMain(),
      });
    } else {
      await tg("sendMessage", {
        chat_id: chatId,
        text: WELCOME_TEXT,
        reply_markup: keyboardMain(),
      });
    }
    return;
  }

  // 2) Inline buttons
  if (u?.callback_query) {
    const q = u.callback_query;

    await tg("answerCallbackQuery", { callback_query_id: q.id });

    const chatId = q.message?.chat?.id;
    const data = q.data;

    if (!chatId) return;

    if (data === "start_action") {
      await tg("sendMessage", { chat_id: chatId, text: "شروع شد." });
      return;
    }

    if (data === "back_action") {
      await tg("sendMessage", { chat_id: chatId, text: "برگشت." });
      return;
    }

    // داده‌ی ناشناس
    await tg("sendMessage", { chat_id: chatId, text: "دستور نامعتبر." });
  }
});

app.listen(PORT, () => console.log("listening on", PORT));
