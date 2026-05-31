const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ۱. تنظیم وب‌هوک (این همون چیزیه که درستش کردیم)
app.get('/setwebhook', async (req, res) => {
    const baseUrl = `https://${req.get('host')}`;
    const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;
    
    try {
        const { data } = await axios.post(`${TELEGRAM_API}/setWebhook`, { url: webhookUrl });
        const info = await axios.get(`${TELEGRAM_API}/getWebhookInfo`);
        res.json({ status: 'Webhook Set!', result: data, info: info.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ۲. پردازش پیام‌های تلگرام
app.post(`/webhook/${SECRET_PATH}`, (req, res) => {
    // اول سریع به تلگرام جواب 200 می‌دیم که پیام‌ها پشت سر هم نیان
    res.sendStatus(200);

    // اینجا می‌تونی منطق اصلی رباتت رو بنویسی (مثلاً جواب دادن به /start)
    const update = req.body;
    console.log('Update received:', update);
    
    // کدهای اصلی رباتت (مثل ارسال عکس یا متن) باید اینجا اضافه بشه
});

// ۳. روت تست سلامت
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
