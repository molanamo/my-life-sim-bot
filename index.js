const { Telegraf } = require('telegraf');

const BOT_TOKEN = 'YOUR_BOT_TOKEN'; // توکن رباتت رو بذار

const bot = new Telegraf(BOT_TOKEN);

bot.on('photo', async (ctx) => {
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  await ctx.reply(fileId);
});

bot.launch().then(() => {
  console.log('✅ ربات آماده‌ست! عکس بفرست');
});