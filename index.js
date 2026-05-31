const express = require('express');
const app = express();

// این خط برای خواندن پیام‌های تلگرام ضروری است
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;

// آدرس وبهوک شما می‌شود: /webhook/SECRET_PATH
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    const update = req.body;
    
    // ۱. سریع به تلگرام پاسخ 200 بده که پیام رسید
    res.sendStatus(200);

    // ۲. اگر پیام متنی بود، جواب بده
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        
        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: '✅ ربات آنلاین است! پیام شما دریافت شد.'
                })
            });
        } catch (err) {
            console.error('خطا در ارسال پاسخ:', err);
        }
    }
});

// برای اینکه بفهمیم سرور کلاً بالاست
app.get('/', (req, res) => res.send('Bot is running!'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Webhook expected at: /webhook/${SECRET_PATH}`);
});
