const { Bot } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply("✅ سلام! ربات کار می‌کند. استارت با موفقیت اجرا شد.");
});

bot.command("help", async (ctx) => {
  await ctx.reply("🆗 ربات آنلاین است - تست ساده");
});

bot.start();
console.log("🚀 ربات تست روشن شد...");