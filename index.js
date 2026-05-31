const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

const MENU_IMAGES = {
  file: "https://i.ibb.co/L1N3t7x/image1.jpg", 
  market: "https://i.ibb.co/L1N3t7x/image2.jpg", 
  survival: "https://i.ibb.co/L1N3t7x/image3.jpg", 
  arms: "https://ibb.co/Kck5rLqj",
  map: "https://ibb.co/yFw2LSS1",
  network: "https://ibb.co/zVwDvfLM",
  safehouse: "https://ibb.co/PvK0nHjd"
};

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📂 پرونده", callback_data: "menu:file" }, { text: "🏴‍☠️ بازار سیاه", callback_data: "menu:market" }],
      [{ text: "⚔️ زرادخانه", callback_data: "menu:arms" }, { text: "🔥 تلاش برای بقا", callback_data: "menu:survival" }],
      [{ text: "🗺 نقشه شهر", callback_data: "menu:map" }, { text: "🕸 شبکه نفوذ", callback_data: "menu:network" }],
      [{ text: "🏠 پناهگاه", callback_data: "menu:safehouse" }]
    ]
  };
}

async function tg(method, payload) {
  return axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, payload);
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  if (update.message?.text === "/start" || update.message?.text === "/menu") {
    await tg("sendMessage", {
      chat_id: update.message.chat.id,
      text: "🎮 **به دنیای شبیه‌ساز خوش آمدی!**\nیک بخش را انتخاب کن:",
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard()
    });
  }

  if (update.callback_query) {
    const q = update.callback_query;
    const data = q.data;

    if (data.startsWith("menu:")) {
      const menuType = data.split(":")[1];
      const imageUrl = MENU_IMAGES[menuType];

      await tg("deleteMessage", { chat_id: q.message.chat.id, message_id: q.message.message_id });
      
      await tg("sendPhoto", {
        chat_id: q.message.chat.id,
        photo: imageUrl,
        caption: `وارد بخش ${menuType} شدی...`,
        reply_markup: mainMenuKeyboard()
      });
    }
  }
});

app.listen(PORT, () => console.log(`ربات فعال شد.`));
