const { Telegraf } = require('telegraf');
const path = require('path');

// Token ربات تلگرام شما
const bot = new Telegraf('YOUR_BOT_TOKEN');

bot.start((ctx) => {
  // مسیر فایل آیکون
  const iconPath = path.join(__dirname, 'assets', 'menu_icon.jpg');

  ctx.replyWithPhoto({ source: iconPath }, {
    caption: 'سلام! این آیکون منو ربات شماست.'
  });
});

bot.launch();

console.log('ربات با موفقیت اجرا شد!');
