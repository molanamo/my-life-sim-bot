const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL;
const SECRET_PATH = process.env.SECRET_PATH;

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function setWebhook() {
  const webhookUrl = `${PUBLIC_URL}/webhook/${SECRET_PATH}`;
  const data = await tg("setWebhook", {
    url: webhookUrl,
    drop_pending_updates: true,
  });
  console.log("setWebhook:", data);
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  const update = req.body;

  // دستور /start
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    await tg("sendMessage", {
      chat_id: chatId,
      text: `✨🎮 *به دنیای بازی خوش اومدی* 🎮✨\n\nبرای ورود به بازی روی دکمه زیر بزن 👇`,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          [{ text: "🎮 شروع بازی ✨" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });

    return;
  }

  // وقتی کاربر روی دکمه "شروع بازی" بزند
  if (update.message && update.message.text === "🎮 شروع بازی ✨") {
    const chatId = update.message.chat.id;
    const firstName = update.message.from.first_name || "بازیکن";

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `╔═══ 🌟 ورود به بازی 🌟 ═══╗\n` +
        `👤 نام شما: *${firstName}*\n` +
        `🆔 شناسه شما: \`${update.message.from.id}\`\n` +
        `╚════════════════════╝\n\n` +
        `یکی از گزینه‌های زیر را انتخاب کن:`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👤 پروفایل من", callback_data: "profile" },
            { text: "🎒 موجودی من", callback_data: "inventory" }
          ],
          [
            { text: "🏠 ورود به شهر", callback_data: "city" }
          ]
        ]
      }
    });

    return;
  }

  // کلیک روی دکمه‌های شیشه‌ای
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const data = update.callback_query.data;
    const firstName = update.callback_query.from.first_name || "بازیکن";
    const userId = update.callback_query.from.id;

    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    if (data === "profile") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text:
          `👤 *پروفایل شما*\n\n` +
          `✨ نام: *${firstName}*\n` +
          `🆔 آیدی: \`${userId}\`\n` +
          `💎 وضعیت: تازه‌وارد`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت", callback_data: "back_main" }]
          ]
        }
      });
    }

    if (data === "inventory") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text:
          `🎒 *موجودی شما*\n\n` +
          `💰 پول: 0\n` +
          `🍞 غذا: 0\n` +
          `⚡ انرژی: 100`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت", callback_data: "back_main" }]
          ]
        }
      });
    }

    if (data === "city") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text:
          `🏠 *شهر بازی*\n\n` +
          `به شهر خوش اومدی ${firstName} 🌆\n` +
          `فعلاً این بخش در حال ساخته شدنه...`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت", callback_data: "back_main" }]
          ]
        }
      });
    }

    if (data === "back_main") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text:
          `╔═══ 🌟 ورود به بازی 🌟 ═══╗\n` +
          `👤 نام شما: *${firstName}*\n` +
          `🆔 شناسه شما: \`${userId}\`\n` +
          `╚════════════════════╝\n\n` +
          `یکی از گزینه‌های زیر را انتخاب کن:`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 پروفایل من", callback_data: "profile" },
              { text: "🎒 موجودی من", callback_data: "inventory" }
            ],
            [
              { text: "🏠 ورود به شهر", callback_data: "city" }
            ]
          ]
        }
      });
    }
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await setWebhook();
  } catch (err) {
    console.error(err);
  }
});
