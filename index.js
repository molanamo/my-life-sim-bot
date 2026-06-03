const { Bot, session } = require("grammy");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// ذخیره موقت وضعیت کاربران (برای شروع ساده)
const userStates = new Map();

// session middleware برای نگهداری وضعیت
bot.use(session({
  initial: () => ({ step: "start" })
}));

bot.command("start", async (ctx) => {
  await ctx.reply("🏛️ به بازی بقای باستانی خوش آمدی...");
  await showLeaderMenu(ctx);
});

async function showLeaderMenu(ctx) {
  const keyboard = ... // همان منوی ۸ رهبر
  await ctx.reply("پادشاه یا رهبر تاریخ ایران را انتخاب کن:", {
    reply_markup: keyboard
  });
}

// راه‌اندازی وب‌هوک برای Railway (یا polling)
if (process.env.RAILWAY_ENV) {
  bot.start();
  console.log("✅ ربات روی Railway روشن شد");
} else {
  bot.start();
}