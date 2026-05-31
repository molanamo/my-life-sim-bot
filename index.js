const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL;
const SECRET_PATH = process.env.SECRET_PATH;

async function tg(method, body) {
  // این تابع برای ارتباط با API تلگرام است
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function setWebhook() {
  // تنظیم وب‌هوک برای دریافت پیام‌ها از تلگرام
  const webhookUrl = `${PUBLIC_URL}/webhook/${SECRET_PATH}`;
  const data = await tg("setWebhook", {
    url: webhookUrl,
    drop_pending_updates: true, // پیام‌های قدیمی را حذف می‌کند
  });
  console.log("setWebhook:", data);
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200); // پاسخ اولیه به تلگرام که پیام دریافت شد

  const update = req.body; // اطلاعات پیام دریافتی

  // اگر پیام دستور /start بود
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    // ارسال پیام خوش‌آمدگویی با دکمه شروع
    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          // یک ردیف دکمه شامل دکمه "شروع"
          [{ text: "⚫ شروع", callback_data: "start_game" }]
        ]
      }
    });
    return;
  }

  // اگر کاربر روی یکی از دکمه‌های inline کلیک کرد
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackData = update.callback_query.data; // اطلاعات دکمه کلیک شده

    // تایید دریافت callback query از تلگرام
    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    // اگر کاربر روی دکمه "شروع" کلیک کرده بود (callbackData === "start_game")
    if (callbackData === "start_game") {
      // ارسال یک پیام بسیار ساده به عنوان پاسخ
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "شما وارد بازی شدید! به زودی امکانات بیشتری اضافه خواهد شد.",
        reply_markup: {
          inline_keyboard: [] // حذف دکمه‌ها یا جایگزینی با دکمه‌های جدید
        }
      });
    }
    // در آینده می‌توانید اینجا برای callbackData های دیگر (مثل profile, info) کد اضافه کنید
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running"); // برای تست اولیه که سرور بالا است
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await setWebhook(); // تنظیم وب‌هوک هنگام راه‌اندازی سرور
  } catch (error) {
    console.error("Failed to set webhook:", error);
  }
});
