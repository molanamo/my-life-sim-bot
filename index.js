const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "2mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PHOTO_URL = "https://i.postimg.cc/3JSpZxnJ/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

if (!BOT_TOKEN) throw new Error("Missing env BOT_TOKEN");
if (!SECRET_PATH) throw new Error("Missing env SECRET_PATH");

let lastUpdate = null;

async function tg(method, payload) {
  const { data } = await axios.post(`${API}/${method}`, payload);
  return data;
}

app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/ping", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get("/last", (req, res) => res.json({ lastUpdate }));

app.get("/webhookinfo", async (req, res) => {
  try {
    const info = await tg("getWebhookInfo", {});
    res.json(info);
  } catch (e) {
    res.status(500).json(e.response?.data || { error: e.message });
  }
});

app.get("/setwebhook", async (req, res) => {
  try {
    const baseUrl = `https://${req.get("host")}`;
    const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;
    const set = await tg("setWebhook", { url: webhookUrl });
    const info = await tg("getWebhookInfo", {});
    res.json({ webhookUrl, set, info });
  } catch (e) {
    res.status(500).json(e.response?.data || { error: e.message });
  }
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  // خیلی مهم: سریع 200
  res.sendStatus(200);

  lastUpdate = req.body;
  console.log("UPDATE:", JSON.stringify(req.body));

  try {
    const msg = req.body.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/start") {
      // اول متن برای اطمینان
      const r1 = await tg("sendMessage", {
        chat_id: chatId,
        text: "وصل شد. الان عکس رو می‌فرستم..."
      });
      console.log("sendMessage:", r1);

      // بعد عکس
      const r2 = await tg("sendPhoto", {
        chat_id: chatId,
        photo: PHOTO_URL,
        caption: "سلام! به شبیه‌ساز زندگی خوش اومدی."
      });
      console.log("sendPhoto:", r2);

      return;
    }
  } catch (e) {
    console.error("HANDLER ERROR:", e.response?.data || e.message || e);
  }
});

app.listen(PORT, () => console.log("Listening on", PORT));
