// index.js  (Railway + Express + Telegram Webhook)  — CommonJS, پایدار

const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ====== ENV ======
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;          // تو Railway ست کن
const SECRET_PATH = process.env.SECRET_PATH;      // یه رشته رندوم مثل: s3cr3t_9xA...
const PUBLIC_URL = process.env.PUBLIC_URL;        // مثل: https://your-app.up.railway.app

if (!BOT_TOKEN) {
  console.error("FATAL: BOT_TOKEN is missing (Railway Variables).");
  process.exit(1);
}
if (!SECRET_PATH) {
  console.error("FATAL: SECRET_PATH is missing (Railway Variables).");
  process.exit(1);
}

// ====== Telegram API helper (بدون نیاز به هیچ پکیج اضافی) ======
async function tg(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(`Telegram API error: ${method} -> ${JSON.stringify(data)}`);
  }
  return data;
}

// ====== Healthcheck ======
app.get("/", (_req, res) => res.status(200).send("OK"));
app.get("/ping", (_req, res) => res.status(200).json({ ok: true, ts: Date.now() }));

// ====== Optional: setWebhook from browser ======
// GET https://YOUR_DOMAIN/webhook/setup?key=SECRET_PATH
app.get("/webhook/setup", async (req, res) => {
  try {
    if (!PUBLIC_URL) return res.status(400).send("PUBLIC_URL is not set.");
    if (req.query.key !== SECRET_PATH) return res.status(403).send("Forbidden.");

    const hookUrl = `${PUBLIC_URL.replace(/\/$/, "")}/webhook/${SECRET_PATH}`;
    const r = await tg("setWebhook", {
      url: hookUrl,
      secret_token: SECRET_PATH, // تلگرام اینو در header می‌فرسته (امن‌تر)
      drop_pending_updates: true,
    });

    res.status(200).json({ ok: true, webhook: hookUrl, telegram: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// ====== Telegram Webhook receiver ======
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  // تلگرام اگر secret_token ست شده باشه، این هدر رو می‌فرسته
  const secretHeader = req.get("x-telegram-bot-api-secret-token");
  if (secretHeader && secretHeader !== SECRET_PATH) {
    return res.sendStatus(403);
  }

  // سریع 200 بده تا تلگرام گیر نکنه
  res.sendStatus(200);

  try {
    const update = req.body || {};

    // پیام متنی
    if (update.message && update.message.chat) {
      const chatId = update.message.chat.id;
      const text = (update.message.text || "").trim();

      if (text === "/start") {
        await tg("sendMessage", {
          chat_id: chatId,
          text:
            "سلام! ربات بالاست.\n\nدستورات:\n/start\n/ping\n/help\n/work\n/rest\n/status",
        });
        return;
      }

      if (text === "/help") {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "فعلاً نسخه پایدار وبهوک. بعداً گیم‌پلی رو اضافه می‌کنیم.",
        });
        return;
      }

      if (text === "/ping") {
        await tg("sendMessage", { chat_id: chatId, text: "pong" });
        return;
      }

      // --- اسکلت ساده گیم‌پلی (فعلاً بدون دیتابیس) ---
      if (text === "/work") {
        await tg("sendMessage", { chat_id: chatId, text: "رفتی سر کار. +10 سکه (فعلاً نمایشی)" });
        return;
      }

      if (text === "/rest") {
        await tg("sendMessage", { chat_id: chatId, text: "استراحت کردی. انرژی فول (فعلاً نمایشی)" });
        return;
      }

      if (text === "/status") {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "وضعیت: آنلاین ✅\n(دیتا هنوز ذخیره نمی‌شه؛ مرحله بعد DB)",
        });
        return;
      }

      // fallback
      await tg("sendMessage", {
        chat_id: chatId,
        text: "دستور نامعتبره. /help رو بزن.",
      });
      return;
    }

    // Callback Query (برای دکمه‌ها) — فعلاً فقط ack
    if (update.callback_query) {
      await tg("answerCallbackQuery", { callback_query_id: update.callback_query.id });
      return;
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
  }
});

// ====== Start server ======
app.listen(PORT, () => {
  console.log("Server started.");
  console.log("PORT:", PORT);
  console.log("Webhook path:", `/webhook/${SECRET_PATH}`);
});
