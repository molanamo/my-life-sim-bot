const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

// این لینک مستقیمِ عکس هست که تلگرام ۱۰۰٪ قبولش می‌کنه
const PHOTO_URL = "https://raw.githubusercontent.com/gapgpt/assets/main/bot-welcome.png";

// تست سلامت سرور
app.get('/', (req, res) => {
    res.send('Bot is ALIVE!');
});

// ست کردن وب‌هوک
app.get('/setwebhook', async (req, res) => {
    try {
        const baseUrl = `https://${req.get('host')}`;
        const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;
        
        const { data } = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, { url: webhookUrl });
        res.json({ status: 'Webhook Set!', data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// پردازش پیام‌ها
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    res.sendStatus(200); // اول به تلگرام می‌گیم "اوکی، دریافت شد"

    const { message } = req.body;
    if (!message || message.text !== '/start') return;

    try {
        // ارسال عکس با کپشن
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            chat_id: message.chat.id,
            photo: PHOTO_URL,
            caption: "سلام! به شبیه‌ساز زندگی خوش اومدی 🌱"
        });
    } catch (err) {
        // اگه عکس ارور داد، فقط یه متن ساده بفرست که رباتت از کار نیفته
        console.error("Error sending photo:", err.response?.data || err.message);
        
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: message.chat.id,
            text: "سلام! به شبیه‌ساز زندگی خوش اومدی. (عکس لود نشد، ولی ربات وصله!)"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
