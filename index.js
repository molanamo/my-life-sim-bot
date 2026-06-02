const { Telegraf } = require('telegraf');
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('🏛️ سلام! ربات کار می‌کنه!'));
bot.on('text', (ctx) => ctx.reply('پیامت رو گرفتم: ' + ctx.message.text));

bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('✅ اجرا شد'))
    .catch((err) => console.error('❌', err.message));