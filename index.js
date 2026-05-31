const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PUBLIC_URL = process.env.PUBLIC_URL;

if (!BOT_TOKEN) { console.error("FATAL: BOT_TOKEN missing"); process.exit(1); }
if (!SECRET_PATH) { console.error("FATAL: SECRET_PATH missing"); process.exit(1); }

async function tg(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(JSON.stringify(data));
  return data;
}

app.get("/", (_req, res) => res.status(200).send("OK"));
app.get("/ping", (_req, res) => res.status(200).json({ ok: true }));

app.get("/webhook/setup", async (req, res) => {
  try {
    if (!PUBLIC_URL) return res.status(400).send("PUBLIC_URL is not set");
    if (req.query.key !== SECRET_PATH) return res.status(403).send("Forbidden");
    const hookUrl = `${PUBLIC_URL.replace(/\/$/, "")}/webhook/${SECRET_PATH}`;
    const r = await tg("setWebhook", {
      url: hookUrl,
      secret_token: SECRET_PATH,
      drop_pending_updates: true,
    });
    res.json({ ok: true, webhook: hookUrl, telegram: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  const secretHeader = req.get("x-telegram-bot-api-secret-token");
  if (secretHeader && secretHeader !== SECRET_PATH) return res.sendStatus(403);

  res.sendStatus(200);

  try {
    const u = req.body || {};
    if (u.message?.chat?.id) {
      const chatId = u.message.chat.id;
      const text = (u.message.text || "").trim();

      if (text === "/start") {
        await tg("sendMessage", { chat_id: chatId, text: "ربات آنلاین است ✅\n/ping" });
        return;
      }
      if (text === "/ping") {
        await tg("sendMessage", { chat_id: chatId, text: "pong" });
        return;
      }

      await tg("sendMessage", { chat_id: chatId, text: "دستور نامعتبر. /start" });
    }
  } catch (e) {
    console.error("handler error:", e);
  }
});

app.listen(PORT, () => {
  console.log("Started on port", PORT);
  console.log("Webhook path:", `/webhook/${SECRET_PATH}`);
});
