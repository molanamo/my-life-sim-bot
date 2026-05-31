// Import the Telegram Bot API library
const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Listen for the '/start' command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'به ربات بازی خوش آمدید! برای شروع، /start را بزنید.');
});

console.log('Bot started...');
