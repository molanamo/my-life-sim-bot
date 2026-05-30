const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN is missing');

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'ربات روشنه. /profile رو بزن');
});

bot.onText(/\/profile/, (msg) => {
  bot.sendMessage(msg.chat.id, 'پروفایل فعلاً تستی است.');
});

bot.on('polling_error', (err) => console.log('polling_error:', err.message));

console.log('Bot is running (polling)...');
