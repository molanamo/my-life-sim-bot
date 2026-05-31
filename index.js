// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
// Use environment variables for port and other sensitive info
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "webhook"; // Make sure this matches your Railway config

// Middleware
app.use(bodyParser.json());

// Helper function to interact with Telegram API
async function tg(method, data) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`Error calling Telegram API (${method}):`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Function to set the webhook URL
async function setWebhook() {
  try {
    // IMPORTANT: Replace with your actual Railway URL for the webhook
    const webhookUrl = `https://my-life-sim-bot-production.up.railway.app/webhook/${SECRET_PATH}`;
    await tg('setWebhook', { url: webhookUrl });
    console.log(`Webhook set to: ${webhookUrl}`);
  } catch (error) {
    console.error('Failed to set webhook:', error);
  }
}

// Webhook endpoint to receive updates from Telegram
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  // Respond to Telegram server immediately
  res.sendStatus(200);

  const update = req.body;

  // Handle /start command
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          // This is the main keyboard with two buttons
          [{ text: "⚫ شروع بازی" }, { text: "☰ منو" }]
        ],
        resize_keyboard: true // Makes the keyboard fit the screen nicely
      }
    });
    return;
  }

  // Handle the press of the "☰ منو" button (as a text message)
  if (update.message && update.message.text === "☰ منو") {
    const chatId = update.message.chat.id;

    await tg("sendMessage", {
      chat_id: chatId,
      text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
      reply_markup: {
        // This is the inline keyboard that appears above the message text
        inline_keyboard: [
          // Example menu items
          [{ text: "👤 پروفایل من", callback_data: "profile" }],
          [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
          [{ text: "ℹ️ راهنما", callback_data: "help" }],
          [{ text: "🔙 بازگشت به بازی", callback_data: "back_to_game" }]
        ]
      }
    });
    return;
  }

  // Handle interactions with inline keyboard buttons (callback queries)
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackData = update.callback_query.data;

    // Acknowledge the callback to Telegram to stop the loading animation
    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    // Here you would process each callback_data to show different messages or actions
    // For now, we'll just provide basic responses and a way to go back to the menu
    if (callbackData === "profile") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "نمایش اطلاعات پروفایل...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "settings") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "تنظیمات ربات...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "help") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "راهنمای ربات...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "back_to_game") {
      // Go back to the initial welcome message
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "⚫ شروع", callback_data: "start_game" }]] // Example back button
        }
      });
    } else if (callbackData === "back_to_menu") {
      // Go back to the main menu
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 پروفایل من", callback_data: "profile" }],
            [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
            [{ text: "ℹ️ راهنما", callback_data: "help" }],
            [{ text: "🔙 بازگشت به بازی", callback_data: "back_to_game" }]
          ]
        }
      });
    } else if (callbackData === "start_game") {
      // If the user clicks the start button from the welcome message
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "بازی شروع شد! منتظر مراحل بعدی باشید.",
      });
    }
  }
});

// A route to manually set the webhook (useful for testing or initial setup)
// In Railway, it's better to have this run on server start or as part of deployment
app.get('/setwebhook', async (req, res) => {
  await setWebhook();
  res.send('Webhook setting initiated. Check server logs for confirmation.');
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Attempt to set the webhook when the server starts
  // Make sure your Railway service is configured to handle this or
  // that the TELEGRAM_BOT_TOKEN and SECRET_PATH are correctly set as environment variables.
  await setWebhook();
});
