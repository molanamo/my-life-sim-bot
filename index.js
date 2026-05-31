const express = require('express');
const app = express();

app.use(express.json()); // برای خواندن داده‌های ارسالی از تلگرام

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL; // دامین ریل‌وی
const SECRET_PATH = process.env.SECRET_PATH; // همان مسیر مخفی

// تابع ست کردن وب‌هوک
async function setWebhook() {
    if (!BOT_TOKEN || !PUBLIC_URL || !SECRET_PATH) {
        console.error("❌ متغیرهای محیطی کامل نیستند!");
        return;
    }

    const webhookUrl = `${PUBLIC_URL}/webhook/${SECRET_PATH}`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("✅ نتیجه ست کردن وب‌هوک:", data);
    } catch (error) {
        console.error("❌ خطا در ست کردن وب‌هوک:", error);
    }
}

// روت اصلی برای دریافت پیام‌های ربات
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    // بلافاصله به تلگرام جواب 200 می‌دهیم که سرور زنده است
    res.sendStatus(200);

    const update = req.body;
    
    // اینجا منطق ربات شما قرار می‌گیرد
    if (update.message && update.message.text) {
        console.log("📩 پیام دریافتی:", update.message.text);
        // مثال: ارسال پاسخ ساده
        const chatId = update.message.chat.id;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: "ربات شما آنلاین است! 🚀" })
        });
    }
});

// سرور بالا می‌آید و وبهوک را ست می‌کند
app.listen(PORT, async () => {
    console.log(`🚀 ربات روی پورت ${PORT} در حال اجراست...`);
    await setWebhook();
});
