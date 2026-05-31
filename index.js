const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

if (!BOT_TOKEN) console.log("BOT_TOKEN is missing!");

async function tg(method, data) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const r = await axios.post(url, data);
    return r.data;
  } catch (e) {
    console.log("TG ERROR", method, e.response ? e.response.data : e.message);
    return null;
  }
}

function mainKeyboard() {
  return {
    inline_keyboard: [[
      { text: "شروع", callback_data: "start_action" },
      { text: "برگشت", callback_data: "back_action" }
    ]]
  };
}

app.get("/", (req, res) => res.send("ok"));

app.get("/setwebhook", async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const hook = `${baseUrl}/webhook/${SECRET_PATH}`;
  const result = await tg("setWebhook", { url: hook });
  res.json({ hook, result });
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  // /start
  if (update.message && (update.message.text || "").trim() === "/start") {
    await tg("sendMessage", {
      chat_id: update.message.chat.id,
      text: "زندگی خودته",
      reply_markup: mainKeyboard()
    });
    return;
  }

  // کلیک دکمه‌ها
  if (update.callback_query) {
    const q = update.callback_query;
    await tg("answerCallbackQuery", { callback_query_id: q.id });

    if (q.data === "start_action") {
      await tg("sendMessage", { chat_id: q.message.chat.id, text: "شروع شد." });
      return;
    }

    if (q.data === "back_action") {
      await tg("sendMessage", { chat_id: q.message.chat.id, text: "برگشت." });
      return;
    }
  }
});

app.listen(PORT, () => console.log("running on", PORT));
