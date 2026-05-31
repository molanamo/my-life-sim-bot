const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "mojaz0762";

app.use(bodyParser.json());

async function tg(method, data) {
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
        await axios.post(url, data);
    } catch (error) {
        console.error(`Error in ${method}:`, error.response ? error.response.data : error.message);
    }
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
    res.sendStatus(200);
    const update = req.body;

    // ۱. هندل کردن دکمه منو (پیام متنی)
    if (update.message && update.message.text === "☰ منو") {
        await tg("sendMessage", {
            chat_id: update.message.chat.id,
            text: "⚙️ منوی اصلی ربات:",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "👤 پروفایل", callback_data: "profile" }, { text: "⚙️ تنظیمات", callback_data: "settings" }]
                ]
            }
        });
        return;
    }

    // ۲. هندل کردن فرمان استارت (عکس + متن + کیبورد اصلی)
    if (update.message && update.message.text === "/start") {
        const photoUrl = process.env.WELCOME_PHOTO_URL || "https://via.placeholder.com/300";
        const welcomeText = process.env.WELCOME_TEXT || "به ربات خوش آمدید!";

        await tg("sendPhoto", {
            chat_id: update.message.chat.id,
            photo: photoUrl,
            caption: welcomeText,
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [[{ text: "☰ منو" }]],
                resize_keyboard: true
            }
        });
        return;
    }

    // ۳. هندل کردن کلیک روی دکمه‌های منو
    if (update.callback_query) {
        const query = update.callback_query;
        await tg("answerCallbackQuery", { callback_query_id: query.id });

        let responseText = "";
        if (query.data === "profile") responseText = "👤 این اطلاعات پروفایل شماست.";
        if (query.data === "settings") responseText = "⚙️ اینجا تنظیمات است.";

        await tg("editMessageText", {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            text: responseText
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
