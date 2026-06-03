const { Bot } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.replyWithPhoto(
    "AgACAgQAAxkBAAEqCaRqH9FGE29Hqin99gjVu6QswkfyZgACYQ9rG4AP-VDGAAHphuNl148BAAMCAANzAAM7BA",
    {
      caption: "🏛️ به بازی بقای باستانی خوش آمدی!\n\nدر این بازی تو یکی از پادشاهان یا رهبران تاریخ ایران رو انتخاب می‌کنی و مسیر سرنوشت ایران رو رقم می‌زنی.\n\n🔄 برای شروع، /start رو بزن."
    }
  );
});

bot.start();
console.log("🤖 ربات روشن شد...");