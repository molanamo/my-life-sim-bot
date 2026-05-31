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

  // Handle /start command - This will show the welcome message and the "☰ Menu" button
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          // Only the "☰ Menu" button is relevant for now. "⚫ Start Game" is omitted.
          [{ text: "☰ منو" }]
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
          // Only showing the menu items as requested, no "start game" or "back to game" here for now.
          [{ text: "👤 پروفایل من", callback_data: "profile" }],
          [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
          [{ text: "ℹ️ راهنما", callback_data: "help" }],
          // The "back_to_game" button is removed as per the request to simplify.
          // If you need a way back to the main menu after interacting with a sub-menu,
          // you can add a "back_to_menu" button within those sub-menu responses.
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

    // Basic responses for menu items, with a "back to menu" option.
    if (callbackData === "profile") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "نمایش اطلاعات پروفایل...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]] // Added back button
        }
      });
    } else if (callbackData === "settings") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "تنظیمات ربات...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]] // Added back button
        }
      });
    } else if (callbackData === "help") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "راهنمای ربات...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]] // Added back button
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
            [{ text: "ℹ️ راهنما", callback_data: "help" }]
            // No "back_to_game" button here in this simplified version
          ]
        }
      });
    }
    // No other callback data will be processed, effectively disabling other interactions.
  }
});

// A route to manually set the webhook (useful for testing or initial setup)
app.get('/setwebhook', async (req, res) => {
  await setWebhook();
  res.send('Webhook setting initiated. Check server logs for confirmation.');
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Attempt to set the webhook when the server starts
  await setWebhook();
});
