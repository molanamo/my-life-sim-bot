import express from "express";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "secret";
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN env var");
  process.exit(1);
}

async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

async function sendMessage(chatId, text) {
  return tg("sendMessage", { chat_id: chatId, text });
}

app.get("/", (req, res) => res.send("OK"));

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  try {
    const msg = req.body?.message;
    if (!msg) return res.sendStatus(200);

    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/start") {
      await sendMessage(chatId, "سلام! ربات فعاله ✅\nدستورها:\n/ping");
    } else if (text === "/ping") {
      await sendMessage(chatId, "pong ✅");
    } else {
      await sendMessage(chatId, "دستور نامعتبر. /ping رو بزن.");
    }

    return res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e);
    return res.sendStatus(200);
  }
});

app.listen(PORT, () => {
  console.log("Listening on", PORT);
  console.log("Webhook path:", `/webhook/${SECRET_PATH}`);
});
