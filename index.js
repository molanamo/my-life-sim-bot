const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL;      // مثل https://...railway.app
const SECRET_PATH = process.env.SECRET_PATH;    // رشته‌ی مخفی

function must(name, val) {
  if (!val) throw new Error(`Missing env var: ${name}`);
}

async function setWebhook() {
  must("BOT_TOKEN", BOT_TOKEN);
  must("PUBLIC_URL", PUBLIC_URL);
  must("SECRET_PATH", SECRET_PATH);

  const webhookUrl = `${PUBLIC_URL}/webhook/${SECRET_PATH}`;

  const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      drop_pending_updates: true,
    }),
  });

  const data = await resp.json();
  console.log("setWebhook =>", data);
  if (!data.ok) throw new Error(`setWebhook failed: ${data.description || "unknown error"}`);
  console.log("Webhook URL:", webhookUrl);
}

// روت وبهوک
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  const msg = req.body?.message?.text;
  const chatId = req.body?.message?.chat?.id;

  if (msg && chatId) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ وصل شد (تستی)" }),
    });
  }
});

app.get("/", (req, res) => res.send("OK"));

app.listen(PORT, async () => {
  console.log("Listening on", PORT);
  try {
    await setWebhook();
  } catch (e) {
    console.error(e);
  }
});
