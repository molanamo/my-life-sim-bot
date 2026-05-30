const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "secret";
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN not found");
  process.exit(1);
}

async function tg(method, data) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function sendMessage(chatId, text) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: text
  });
}

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = (message.text || "").trim();

    if (text === "/start") {
      await sendMessage(chatId, "سلام ✅\nربات فعاله");
    } else if (text === "/ping") {
      await sendMessage(chatId, "pong ✅");
    } else {
      await sendMessage(chatId, "دستور نامعتبره");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.sendStatus(200);
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
