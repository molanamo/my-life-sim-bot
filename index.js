const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

// لینک عکسی که اوکی شده بود
const PHOTO_URL = "https://i.ibb.co/wNrCttFV/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

let lastUpdate = null;

app.get('/', (req, res) => {
    res.send('Bot is ALIVE!');
});

app.get('/setwebhook', async (req, res) => {
    try {
        const baseUrl = `https://${req.get('host')}`;
        const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;
        const { data } = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, { url: webhookUrl });
        res.json({ status: 'Webhook Set!', webhookUrl, data });
    } catch (e) {
        res.status(500).json({ error: e.response?.data || e.message });
    }
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    res.sendStatus(200);
    const update = req.body;
    lastUpdate = update;

    const message = update.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
        try {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                chat_id: chatId,
                photo: PHOTO_URL,
                caption: "✨ *به شبیه‌ساز زندگی خوش اومدی*\n\nبرای شروع ماجراجویی، یکی از گزینه‌های زیر رو انتخاب کن:",
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "▶️ شروع بازی", callback_data: "start_game" },
                            { text: "▦ منو", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } catch (err) {
            console.error('sendPhoto error:', err.response?.data || err.message);
            // Fallback در صورت خطا
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: 'سلام! به شبیه‌ساز زندگی خوش اومدی. (پنل لود نشد، ولی ربات وصله!)'
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
