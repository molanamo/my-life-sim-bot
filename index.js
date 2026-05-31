"use strict";

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

if (!BOT_TOKEN) console.log("ERROR: BOT_TOKEN is missing.");

async function tg(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const res = await axios.post(url, payload, { timeout: 15000 });
    return res.data;
  } catch (e) {
    console.log("TG_ERROR", method, e?.response?.data || e.message);
    return null;
  }
}

const WELCOME_TEXT =
  "🥃 این زندگی ارزشِ تجربه‌کردن رو داره…\n" +
  "🤍 روی «🧬شروع🧬» بزن تا باهم شروعش کنیم 💙";

const mainMenu = () => ({
  inline_keyboard: [[{ text: "🧬شروع🧬", callback_data: "menu_start" }]],
});

app.get("/", (req, res) => res.status(200).send("ok"));

app.get("/setwebhook", async (req, res) => {
  const webhookUrl = `${req.protocol}://${req.get("host")}/webhook/${SECRET_PATH}`;
  const result = await tg("setWebhook", { url: webhookUrl });
  res.json({ ok: true, webhookUrl, result });
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const u = req.body;

  // /start -> ولکام + منوی شروع
  if ((u?.message?.text || "").trim() === "/start") {
    await tg("sendMessage", {
      chat_id: u.message.chat.id,
      text: WELCOME_TEXT,
      reply_markup: mainMenu(),
    });
    return;
  }

  // کلیک روی دکمه شروع
  if (u?.callback_query) {
    const q = u.callback_query;
    const chatId = q.message.chat.id;
    const msgId = q.message.message_id;

    await tg("answerCallbackQuery", { callback_query_id: q.id });

    if (q.data === "menu_start") {
      // فعلاً فقط همون پیام رو عوض می‌کنیم که بفهمیم وارد شد
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: msgId,
        text: "شروع شد. بگو توی منوی شروع چه گزینه‌هایی بذارم؟",
        reply_markup: { inline_keyboard: [] },
      });
      return;
    }
  }
});

app.listen(PORT, () => console.log("listening on", PORT));
