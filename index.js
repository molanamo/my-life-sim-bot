const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

console.log("Starting server...");

// روت ساده برای تست زنده بودن سرور
app.get('/', (req, res) => {
    res.status(200).send('Bot is ALIVE!');
});

// ست کردن وب‌هوک
app.get('/setwebhook', async (req, res) => {
    try {
        const baseUrl = `https://${req.get('host')}`;
        const webhookUrl = `${baseUrl}/webhook/${SECRET_PATH}`;
        console.log(`Setting webhook to: ${webhookUrl}`);
        
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, { url: webhookUrl });
        res.json(response.data);
    } catch (e) {
        console.error("SetWebhook Error:", e.message);
        res.status(500).send(e.message);
    }
});

// دریافت پیام از تلگرام
app.post(`/webhook/${SECRET_PATH}`, (req, res) => {
    console.log("Webhook received a request!");
    
    // اول سریع جواب میدیم که تلگرام نره رو حالت خطا
    res.status(200).send('OK');

    // پردازش در پس‌زمینه
    try {
        const { message } = req.body;
        if (message && message.text === '/start') {
            console.log("Processing /start command...");
            axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: message.chat.id,
                text: "سلام! ربات زنده‌ست."
            }).catch(err => console.error("Error sending response:", err.message));
        }
    } catch (err) {
        console.error("Processing Error:", err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
