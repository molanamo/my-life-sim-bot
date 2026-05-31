const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

// مسیر پایه برای تست سلامت سرور
app.get('/', (req, res) => {
    res.send('Bot is ALIVE!');
});

// تنظیم وب‌هوک
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

// دریافت پیام‌ها (وب‌هوک)
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    res.sendStatus(200); // به تلگرام می‌گیم پیام رو گرفتیم
    
    const update = req.body;
    if (!update.message || !update.message.text) return;

    const chatId = update.message.chat.id;
    const text = update.message.text;

    // منطق اصلی ربات
    try {
        if (text === '/start') {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: "✨ *به شبیه‌ساز زندگی خوش اومدی*\n\nاز منوی پایین برای مدیریت پایگاه استفاده کن:",
                parse_mode: "Markdown",
                reply_markup: {
                    keyboard: [
                        [{ text: "⛺ کمپ نیابتی" }, { text: "🕌 قرارگاه مرکزی" }, { text: "✈️ فرودگاه" }],
                        [{ text: "🏴‍☠️ زرادخانه سیاه" }, { text: "🛒 فروشگاه" }, { text: "🧰 زرادخانه" }],
                        [{ text: "🏦 تبادل" }, { text: "💎 کیف یاقوت" }, { text: "🏭 جمع‌کننده‌ها" }],
                        [{ text: "🔄 جابجایی" }, { text: "🗑 حذف گروه" }, { text: "📢 چت سراسری" }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            });
        } else {
            // پاسخ به دکمه‌های منو
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: `شما گزینه "${text}" را انتخاب کردید.`
            });
        }
    } catch (err) {
        console.error('Telegram API Error:', err.response?.data || err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
