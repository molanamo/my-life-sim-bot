const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

app.use(bodyParser.json());

// تابع ارسال درخواست به تلگرام
async function tg(method, data) {
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
        await axios.post(url, data);
    } catch (error) {
        console.error(`Error in ${method}:`, error.response ? error.response.data : error.message);
    }
}

// هندل کردن وب‌هوک
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    res.sendStatus(200);
    const update = req.body;

    // ۱. هندل کردن فرمان استارت
    if (update.message && update.message.text === "/start") {
        await tg("sendPhoto", {
            chat_id: update.message.chat.id,
            photo: process.env.WELCOME_PHOTO_URL || "https://cdn.imgurl.ir/uploads/y805027_cac6a722-c71d-40b6-81fd-f9a4721ec845.png",
            caption: process.env.WELCOME_TEXT || "زندگی خودته",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "شروع", callback_data: "start_action" },
                        { text: "برگشت", callback_data: "back_action" }
                    ]
                ]
            }
        });
    }

    // ۲. هندل کردن کلیک روی دکمه‌های شیشه‌ای
    if (update.callback_query) {
        const query = update.callback_query;
        await tg("answerCallbackQuery", { callback_query_id: query.id });

        let responseText = "";
        if (query.data === "start_action") responseText = "🚀 شروع کردیم!";
        if (query.data === "back_action") responseText = "🔙 برگشتیم به عقب.";

        await tg("sendMessage", {
            chat_id: query.message.chat.id,
            text: responseText
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
