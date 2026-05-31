const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// این‌ها دقیقاً مطابق نام‌هایی هستند که در پنل Railway دیدم
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN; 
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

app.use(bodyParser.json());

async function tg(method, data) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    await axios.post(url, data);
  } catch (error) {
    console.error(`Error with ${method}:`, error.message);
  }
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  if (update.message && update.message.text === "/start") {
    await tg("sendMessage", {
      chat_id: update.message.chat.id,
      text: "سلام! ربات فعال شد. این یک تست ساده است.",
      reply_markup: {
        keyboard: [[{ text: "☰ منو" }]],
        resize_keyboard: true
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
