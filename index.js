// index.js
// Telegram Life Simulation Bot (Railway webhook)
// Env required: BOT_TOKEN , SECRET_PATH , (optional) PORT

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "1mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) throw new Error("Missing env: BOT_TOKEN");
if (!SECRET_PATH) throw new Error("Missing env: SECRET_PATH");

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// تصویر خوش‌آمدگویی (Direct Link)
const WELCOME_PHOTO_URL =
  "https://i.postimg.cc/3JSpZxnJ/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

// متن خوش‌آمدگویی (دستی)
const WELCOME_TEXT =
  "سلام! به شبیه‌ساز زندگی خوش اومدی.\n\nبرای شروع روی «شروع» بزن.";

async function tg(method, payload) {
  const { data } = await axios.post(`${API}/${method}`, payload);
  return data;
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [[{ text: "شروع", callback_data: "start_game" }]],
  };
}

function backKeyboard() {
  return {
    inline_keyboard: [[{ text: "برگشت", callback_data: "back_home" }]],
  };
}

// Health check
app.get("/", (req, res) => res.send("OK - Bot is running"));

// Set webhook (forces https)
app.get("/setwebhook", async (req, res) => {
  try {
    const baseUrl = `https://${req.get("host")}`;
    const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;

    const set = await tg("setWebhook", { url: webhookUrl });
    const info = await tg("getWebhookInfo", {});

    res.json({ webhookUrl, set, info });
  } catch (e) {
    res.status(500).json({ error: String(e?.response?.data || e.message || e) });
  }
});

// Optional: delete webhook + drop pending updates (for stuck updates)
app.get("/delwebhook", async (req, res) => {
  try {
    const r = await tg("deleteWebhook", { drop_pending_updates: true });
    const info = await tg("getWebhookInfo", {});
    res.json({ result: r, info });
  } catch (e) {
    res.status(500).json({ error: String(e?.response?.data || e.message || e) });
  }
});

// Webhook receiver
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  // سریع 200 بده تا تلگرام تکراری نفرسته
  res.sendStatus(200);

  const update = req.body;

  try {
    // /start
    if (update.message && typeof update.message.text === "string") {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text === "/start") {
        // اول تلاش برای ارسال عکس + کپشن
        const photoRes = await tg("sendPhoto", {
          chat_id: chatId,
          photo: WELCOME_PHOTO_URL,
          caption: WELCOME_TEXT,
          reply_markup: mainMenuKeyboard(),
        });

        // اگر عکس به هر دلیل ok نبود، متن بفرست (Fallback)
        if (!photoRes.ok) {
          await tg("sendMessage", {
            chat_id: chatId,
            text: WELCOME_TEXT,
            reply_markup: mainMenuKeyboard(),
          });
        }
        return;
      }
    }

    // Callback buttons
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const data = cq.data;

      // جلوگیری از لودینگ دکمه‌ها
      await tg("answerCallbackQuery", {
        callback_query_id: cq.id,
      });

      if (!chatId || !messageId) return;

      if (data === "start_game") {
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text:
            "شروع شد.\n\n(اینجا مرحله/سناریوی بازی رو بعداً اضافه می‌کنیم.)",
          reply_markup: backKeyboard(),
        });
        return;
      }

      if (data === "back_home") {
        // برگرد به صفحه اصلی (باز هم با متن؛ برای عکس معمولاً editPhoto لازم میشه)
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: WELCOME_TEXT,
          reply_markup: mainMenuKeyboard(),
        });
        return;
      }
    }
  } catch (e) {
    console.error("Webhook handler error:", e?.response?.data || e);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
