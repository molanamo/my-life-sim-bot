const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// لینک‌های مستقیم که درست کردم
const PHOTO_LINKS = {
  "/start": "https://i.ibb.co/Kck5rLqj/image.jpg",
  "/file": "https://i.ibb.co/Kck5rLqj/image.jpg",
  "/market": "https://i.ibb.co/yFw2LSS1/image.jpg",
  "/survival": "https://i.ibb.co/zVwDvfLM/image.jpg",
  "/arms": "https://i.ibb.co/6RJbQQ7z/image.jpg"
};

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const msg = req.body.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  // اگر دستور جزو لیست عکس‌ها بود
  if (PHOTO_LINKS[text]) {
    await axios.post(`${URL}/sendPhoto`, {
      chat_id: chatId,
      photo: PHOTO_LINKS[text],
      caption: `نمایش بخش: ${text}`
    });
  } else {
    await axios.post(`${URL}/sendMessage`, {
      chat_id: chatId,
      text: "دستورات: /start, /file, /market, /survival, /arms"
    });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("ربات با لینک‌های جدید بالا اومد!"));
