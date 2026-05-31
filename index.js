const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

// این لینک مستقیمِ عکسِ خودت هست:
const PHOTO_URL = "https://i.postimg.cc/3JSpZxnJ/cac6a722-c71d-40b6-81fd-f9a4721ec845.png";

let lastUpdate = null;

// Endpoint برای چک کردن آنلاین بودن ربات
app.get('/', (req, res) => {
  res.send('Bot is ALIVE!');
});

// Endpoint برای تست وب‌هوک (ping)
app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'pong' });
});

// Endpoint برای دیدن آخرین پیام دریافتی (برای دیباگ)
app.get('/last', (req, res) => {
  res.json(lastUpdate || { message: 'no update yet' });
});

// Endpoint برای تنظیم وب‌هوک
app.get('/setwebhook', async (req, res) => {
  try {
    // ساختن URL وب‌هوک با استفاده از هاست فعلی و سکرت پث
    const baseUrl = `https://${req.get('host')}`;
    const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;

    // ارسال دستور ست کردن وب‌هوک به API تلگرام
    const { data } = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      { url: webhookUrl }
    );

    res.json({
      status: 'Webhook Set!',
      webhookUrl,
      data
    });
  } catch (e) {
    // در صورت بروز خطا، پیام خطا را برگردان
    console.error("Error setting webhook:", e.response?.data || e.message);
    res.status(500).json({
      error: e.response?.data || e.message
    });
  }
});

// پردازشگر پیام‌های دریافتی از تلگرام
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  // پاسخ سریع به تلگرام برای جلوگیری از timeout
  res.sendStatus(200);

  const update = req.body;
  lastUpdate = update; // ذخیره آخرین آپدیت برای دیباگ

  const message = update.message;
  // اگر پیام یا متنی وجود نداشت، پردازش را متوقف کن
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text;

  // اگر پیام دستور /start بود
  if (text === '/start') {
    try {
      // تلاش برای ارسال عکس با لینک مستقیم
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        chat_id: chatId,
        photo: PHOTO_URL, // استفاده از لینک مستقیم عکس
        caption: 'سلام! به شبیه‌ساز زندگی خوش اومدی 🌱'
      });
    } catch (err) {
      // اگر ارسال عکس با خطا مواجه شد (مثلاً به دلیل محدودیت‌های postimg)
      console.error('sendPhoto error:', err.response?.data || err.message);

      // ارسال پیام متنی به عنوان جایگزین
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: 'سلام! به شبیه‌ساز زندگی خوش اومدی. (عکس لود نشد، ولی ربات وصله!)'
      });
    }
  }
});

// اجرای سرور روی پورت مشخص شده
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
