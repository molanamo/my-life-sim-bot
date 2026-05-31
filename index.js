const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PHOTO_URL = "https://i.postimg.cc/3JSpZxnJ/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";
const WELCOME_TEXT = "سلام! به شبیه‌ساز زندگی خوش اومدی. برای شروع آماده‌ای؟";

app.get('/setwebhook', async (req, res) => {
    const webhookUrl = `https://${req.get('host')}/webhook/${SECRET_PATH}`;
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, { url: webhookUrl });
    res.send("Webhook Set!");
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    res.sendStatus(200);
    const { message } = req.body;
    if (message?.text === '/start') {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            chat_id: message.chat.id,
            photo: PHOTO_URL,
            caption: WELCOME_TEXT
        });
    }
});

app.listen(process.env.PORT || 3000);
