const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";
const WELCOME_PHOTO = process.env.WELCOME_PHOTO_URL;
const WELCOME_TEXT = process.env.WELCOME_TEXT || "سلام! شروع کنیم؟";

async function tg(method, payload) {
  try {
    return await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, payload);
  } catch (e) { console.log("TG_ERROR:", e.message); }
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const u = req.body;

  if (u.message?.text === "/start") {
    const payload = {
      chat_id: u.message.chat.id,
      reply_markup: { inline_keyboard: [[{ text: "🧬شروع🧬", callback_data: "menu_start" }]] }
    };

    if (WELCOME_PHOTO) {
      payload.photo = WELCOME_PHOTO;
      payload.caption = WELCOME_TEXT;
      await tg("sendPhoto", payload);
    } else {
      payload.text = WELCOME_TEXT;
      await tg("sendMessage", payload);
    }
  }

  if (u.callback_query?.data === "menu_start") {
    await tg("answerCallbackQuery", { callback_query_id: u.callback_query.id });
    await tg("sendMessage", { chat_id: u.callback_query.message.chat.id, text: "وارد منوی اصلی شدی!" });
  }
});

app.listen(process.env.PORT || 3000);
