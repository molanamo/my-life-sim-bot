const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

// --- پیکربندی ---
const TOKEN = "6901021308:AAHWvE9yI_3-K35zEaI1c9nB6hM2n6q_YhA"; // !!! مهم: این توکن را با توکن جدید خودتان جایگزین کنید !!!
const SECRET_PATH = "6901021308:AAHWvE9yI_3-K35zEaI1c9nB6hM2n6q_YhA"; // !!! این را هم با توکن جدید جایگزین کنید !!!
const WEBHOOK_URL = `https://my-life-sim-bot-production.up.railway.app/webhook/${SECRET_PATH}`; // آدرس Webhook شما در Railway

const bot = new TelegramBot(TOKEN, { polling: false }); // polling را غیرفعال می‌کنیم چون از Webhook استفاده می‌کنیم
const app = express();

// استفاده از body-parser برای خواندن درخواست‌های POST
app.use(bodyParser.json());

// تابعی برای ارسال پیام از طریق API تلگرام
async function tg(method, params) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error(`Error sending Telegram API request (${method}):`, error);
    return { ok: false, error_message: error.message };
  }
}

// تنظیم Webhook هنگام استقرار یا ری‌استارت ربات
async function setWebhook() {
  console.log("Setting webhook...");
  const result = await tg("setWebhook", { url: WEBHOOK_URL });
  if (result.ok) {
    console.log("Webhook set successfully:", result.description);
  } else {
    console.error("Failed to set webhook:", result.description);
  }
}

// --- پردازش درخواست‌های Webhook ---
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200); // پاسخ سریع برای تلگرام

  const update = req.body;
  console.log("Received update:", JSON.stringify(update, null, 2)); // لاگ کردن آپدیت دریافتی

  // --- پردازش دستور /start ---
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    // پیام خوش‌آمدگویی مرموز با دکمه شروع و منو
    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [ // کیبورد معمولی (نه inline)
          [
            { text: "⚫ شروع بازی" }, // دکمه اصلی شروع بازی (به عنوان پیام متنی ارسال می‌شود)
            { text: "☰ منو" }       // دکمه جدید برای باز کردن منو (به عنوان پیام متنی ارسال می‌شود)
          ]
        ],
        resize_keyboard: true // اندازه کیبورد تنظیم شود
      }
    });
    return;
  }

  // --- پردازش پیام "⚫ شروع بازی" ---
  if (update.message && update.message.text === "⚫ شروع بازی") {
    const chatId = update.message.chat.id;

    // فعلاً فقط یک پیام تایید ارسال می‌کنیم. بعداً منطق بازی را اینجا اضافه می‌کنیم.
    await tg("sendMessage", {
      chat_id: chatId,
      text: "بازی شروع شد! به زودی مراحل بعدی را خواهید دید.",
      // اگر بخواهیم دکمه‌های inline را هم در این مرحله نمایش دهیم:
      // reply_markup: {
      //   inline_keyboard: [
      //     [{ text: "👤 پروفایل من", callback_data: "profile" }],
      //     [{ text: "ℹ️ اطلاعات بیشتر", callback_data: "info" }]
      //   ]
      // }
    });
    return;
  }

  // --- پردازش پیام "☰ منو" ---
  if (update.message && update.message.text === "☰ منو") {
    const chatId = update.message.chat.id;

    // نمایش منوی بازشونده (Inline Keyboard)
    await tg("sendMessage", {
      chat_id: chatId,
      text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
      reply_markup: {
        inline_keyboard: [
          // گزینه‌های منو را اینجا اضافه می‌کنیم
          [{ text: "👤 پروفایل من", callback_data: "profile" }],
          [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
          [{ text: "ℹ️ راهنما", callback_data: "help" }],
          [{ text: "🔙 بازگشت به بازی", callback_data: "back_to_game" }] // مثالی برای بازگشت به پیام /start
        ]
      }
    });
    return;
  }

  // --- پردازش کلیک روی دکمه‌های Inline (callback_query) ---
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackData = update.callback_query.data;

    // پاسخ به callbackQuery برای اینکه تلگرام متوجه شود پردازش شده است
    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    // پردازش گزینه‌های منو
    if (callbackData === "profile") {
      // نمایش جزئیات پروفایل کاربر
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "👤 **پروفایل شما:**\n\n" +
              "اینجا اطلاعات پروفایل شما نمایش داده می‌شود.\n" +
              "(در آینده جزئیات بیشتری اضافه خواهد شد)",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }] // دکمه بازگشت به منوی قبلی
          ]
        }
      });
    } else if (callbackData === "settings") {
      // نمایش تنظیمات
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "⚙️ **تنظیمات:**\n\n" +
              "اینجا می‌توانید تنظیمات ربات را تغییر دهید.\n" +
              "(در حال حاضر تنظیمات خاصی موجود نیست)",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]
          ]
        }
      });
    } else if (callbackData === "help") {
      // نمایش راهنما
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "ℹ️ **راهنما:**\n\n" +
              "به ربات زندگی خوش آمدید!\n" +
              "برای شروع بازی، دکمه 'شروع بازی' را بزنید.\n" +
              "برای دسترسی به منو، دکمه 'منو' را انتخاب کنید.\n\n" +
              "اگر سوال دیگری دارید، بپرسید.",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]
          ]
        }
      });
    } else if (callbackData === "back_to_game") {
      // بازگشت به پیام اصلی /start
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⚫ شروع", callback_data: "start_game" }] // دکمه شروع بازی (inline)
          ]
        }
      });
    } else if (callbackData === "back_to_menu") {
      // بازگشت به منوی اصلی پس از دیدن جزئیات (پروفایل، تنظیمات و...)
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 پروفایل من", callback_data: "profile" }],
            [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
            [{ text: "ℹ️ راهنما", callback_data: "help" }],
            [{ text: "🔙 بازگشت به بازی", callback_data: "back_to_game" }]
          ]
        }
      });
    }
    // برای اضافه کردن منطق دکمه "شروع بازی" در پیام inline:
    else if (callbackData === "start_game") {
         await tg("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: "بازی شروع شد! به زودی مراحل بعدی را خواهید دید.",
            reply_markup: {
              inline_keyboard: [
                [{ text: "👤 پروفایل من", callback_data: "profile" }], // یا هر دکمه دیگری که لازم است
              ]
            }
         });
    }
  }
});

// --- اجرای اولیه و راه‌اندازی سرور ---

// تنظیم Webhook هنگام استقرار اولیه یا ری‌استارت سرور
setWebhook();

// مسیر برای دریافت به‌روزرسانی‌ها از تلگرام
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
