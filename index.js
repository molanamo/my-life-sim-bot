"use strict";

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

const WELCOME_TEXT = process.env.WELCOME_TEXT || "";
const WELCOME_PHOTO_URL = process.env.WELCOME_PHOTO_URL || "";

if (!BOT_TOKEN) console.log("FATAL: BOT_TOKEN missing");

async function tg(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const res = await axios.post(url, payload, { timeout: 20000 });
    return res.data;
  } catch (e) {
    const info = e?.response?.data || e.message;
    console.log("TG_ERROR", method, JSON.stringify(info));
    return null;
  }
}

const mainMenu = () => ({
  inline_keyboard: [[{ text: "🧬شروع🧬", callback_data: "menu_start" }]],
});

app.get("/", (req, res) => res.status(200).send("ok"));

app.get("/setwebhook", async (req, res) => {
  const webhookUrl = `${req.protocol}://${req.get("host")}/webhook/${SECRET_PATH}`;
  const set = await tg("setWebhook", { url: webhookUrl });
  const info = await tg("getWebhookInfo", {});
  res.json({ webhookUrl, set, info });
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const u = req.body;

  // /start
  if ((u?.message?.text || "").trim() === "/start") {
    const chatId = u.message.chat.id;

    // اول تلاش کن عکس بفرستی؛ اگر شکست خورد، متن بفرست
    if (WELCOME_PHOTO_URL) {
      const r = await tg("sendPhoto", {
        chat_id: chatId,
        photo: WELCOME_PHOTO_URL,
        caption: WELCOME_TEXT || undefined,
        reply_markup: mainMenu(),
      });

      if (r && r.ok) return; // موفق شد
      console.log("sendPhoto failed -> fallback to sendMessage");
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: WELCOME_TEXT || "سلام",
      reply_markup: mainMenu(),
    });
    return;
  }

  // دکمه شروع
  if (u?.callback_query) {
    const q = u.callback_query;
    await tg("answerCallbackQuery", { callback_query_id: q.id });

    const chatId = q.message?.chat?.id;
    const msgId = q.message?.message_id;
    if (!chatId || !msgId) return;

    if (q.data === "menu_start") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: msgId,
        text: "شروع شد.",
        reply_markup: { inline_keyboard: [] },
      });
    }
  }
});

app.listen(PORT, () => console.log("listening on", PORT));
