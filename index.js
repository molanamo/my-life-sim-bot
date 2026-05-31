// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // To interact with Telegram API

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port

// Ensure you have your Telegram Bot Token and your secret path
// It's highly recommended to use environment variables for sensitive information
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "webhook"; // Example secret path

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Helper function to send messages to Telegram
async function tg(method, data) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`Error sending to Telegram API (${method}):`, error.response ? error.response.data : error.message);
    throw error; // Re-throw the error to handle it upstream
  }
}

// Function to set the webhook (call this once on startup or when needed)
async function setWebhook() {
  try {
    const webhookUrl = `https://my-life-sim-bot-production.up.railway.app/webhook/${SECRET_PATH}`; // Replace with your actual Railway URL
    await tg('setWebhook', { url: webhookUrl });
    console.log(`Webhook set successfully to: ${webhookUrl}`);
  } catch (error) {
    console.error('Failed to set webhook:', error);
  }
}

// Handle incoming Telegram updates
app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200); // Respond to Telegram immediately

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
          [{ text: "⚫ شروع بازی" }, { text: "☰ منو" }]
        ],
        resize_keyboard: true
      }
    });
    return;
  }

  // Handle "⚫ شروع بازی" button press
  if (update.message && update.message.text === "⚫ شروع بازی") {
    const chatId = update.message.chat.id;
    // Placeholder for game start logic
    await tg("sendMessage", {
      chat_id: chatId,
      text: "بازی شروع شد! به زودی مراحل بعدی را خواهید دید.",
      // You can add inline keyboards here if needed for the game itself
    });
    return;
  }

  // Handle "☰ منو" button press to open the inline menu
  if (update.message && update.message.text === "☰ منو") {
    const chatId = update.message.chat.id;
    await tg("sendMessage", {
      chat_id: chatId,
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
    return;
  }

  // Handle inline keyboard button presses (callback queries)
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackData = update.callback_query.data;

    // Acknowledge the callback query
    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    // Process menu options
    if (callbackData === "profile") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا اطلاعات پروفایل شما نمایش داده می‌شود.",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "settings") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا تنظیمات ربات است.",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "help") {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا بخش راهنمای ربات است.",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]]
        }
      });
    } else if (callbackData === "back_to_game") {
      // Edit the message to show the initial welcome message and game start button
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "⚫ شروع", callback_data: "start_game" }]]
        }
      });
    } else if (callbackData === "back_to_menu") {
      // Edit the message to show the main menu again
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
      // Handle the "start_game" callback (e.g., from the initial welcome message)
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "بازی شروع شد! به زودی مراحل بعدی را خواهید دید.",
      });
    }
  }
});


// Route to set the webhook when the server starts (or when you navigate to a specific URL)
// For Railway, it's better to call setWebhook on startup or have a dedicated deploy script
app.get('/setwebhook', async (req, res) => {
  await setWebhook();
  res.send('Webhook setting initiated. Check logs for status.');
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Call setWebhook when the server starts
  // In a Railway deployment, this might need to be handled differently,
  // possibly by running a setup script or ensuring it's called correctly
  // after the service is ready.
  // For local testing, you can manually visit /setwebhook or call it here.
  await setWebhook(); // Attempt to set webhook on server start
});
