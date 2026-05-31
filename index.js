const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "2mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PHOTO_URL =
  "https://i.postimg.cc/3JSpZxnJ/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

if (!BOT_TOKEN) throw new Error("Missing env BOT_TOKEN");
if (!SECRET_PATH) throw new Error("Missing env SECRET_PATH");

let lastUpdate = null;

async function tg(method, payload) {
  const { data } = await axios.post(`${API}/${method}`, payload, {
    timeout: 15000,
  });
  return data;
}

function errToText(e) {
  const d = e?.response?.data;
  if (d) return JSON.stringify(d);
  return String(e?.message || e);
}

app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/last", (req, res) => res.json({ lastUpdate }));

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  lastUpdate = req.body;

  const msg = req.body?.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  if (text !== "/start") return;

  // 1) اول یک پیام ساده بفرستیم که مطمئن شیم sendMessage کار می‌کنه
  try {
    const r = await tg("sendMessage", {
      chat_id: chatId,
      text: "وصل شد. (مرحله ۱: متن OK) حالا عکس…",
    });
    if (!r.ok) throw new Error("sendMessage not ok: " + JSON.stringify(r));
  } catch (e) {
    // اگر حتی متن هم نرفت، یعنی مشکل ارتباط/توکن/فیلتر/…
    console.error("sendMessage ERROR:", errToText(e));
    return;
  }

  // 2) تلاش برای ارسال عکس
  try {
    const r = await tg("sendPhoto", {
      chat_id: chatId,
      photo: PHOTO_URL,
      caption: "سلام! به شبیه‌ساز زندگی خوش اومدی.",
    });
    if (!r.ok) throw new Error("sendPhoto not ok: " + JSON.stringify(r));
  } catch (e) {
    const errText = errToText(e);
    console.error("sendPhoto ERROR:", errText);

    // fallback: به کاربر بگو چرا عکس نرفت
    try {
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          "عکس ارسال نشد. خطا:\n" +
          errText +
          "\n\n(لینک عکس: " +
          PHOTO_URL +
          ")",
      });
    } catch (e2) {
      console.error("fallback sendMessage ERROR:", errToText(e2));
    }
  }
});

app.listen(PORT, () => console.log("Listening on", PORT));
