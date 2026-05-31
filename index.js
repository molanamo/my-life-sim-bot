// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path'); // اضافه شده برای مدیریت مسیر فایل ها

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
    // Make sure the SECRET_PATH in the URL matches the SECRET_PATH environment variable
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

    // Check if welcome message and photo path are defined in environment variables or a config file
    const welcomeText = process.env.WELCOME_TEXT || `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`;
    const welcomePhotoPath = process.env.WELCOME_PHOTO_PATH; // Expecting a path like '/path/to/your/assets/menu_icon.jpg'

    if (welcomePhotoPath) {
      try {
        // Check if the file exists before sending
        // Note: In Railway, files might need to be accessible in a specific way.
        // If running locally, ensure the path is correct. For Railway, consider if the file is part of the deployment.
        await tg("sendPhoto", {
          chat_id: chatId,
          photo: welcomePhotoPath, // Use the path from env variable
          caption: welcomeText,
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [[{ text: "☰ منو" }]],
            resize_keyboard: true
          }
        });
      } catch (error) {
        console.error("Error sending photo:", error);
        // Fallback to text message if photo sending fails
        await tg("sendMessage", {
          chat_id: chatId,
          text: welcomeText,
          parse_mode: "Markdown",
          reply_markup: {
            keyboard: [[{ text: "☰ منو" }]],
            resize_keyboard: true
          }
        });
      }
    } else {
      // Send only text if no photo path is provided
      await tg("sendMessage", {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [[{ text: "☰ منو" }]],
          resize_keyboard: true
        }
      });
    }
    return;
  }

  // Handle the press of the "☰ منو" button (as a text message)
  if (update.message && update.message.text === "☰ منو") {
    const chatId = update.message.chat.id;

    await tg("sendMessage", {
      chat_id: chatId,
      text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 پروفایل من", callback_data: "profile" }],
          [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
          [{ text: "ℹ️ راهنما", callback_data: "help" }]
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

    if (callbackData === "profile") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "نمایش اطلاعات پروفایل...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "settings") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "تنظیمات ربات...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "help") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "راهنمای ربات...",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منو", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "back_to_menu") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 پروفایل من", callback_data: "profile" }],
            [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
            [{ text: "ℹ️ راهنما", callback_data: "help" }]
          ]
        }
      });
    }
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
