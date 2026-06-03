const { Bot, InlineKeyboard, session } = require("grammy");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// لیست رهبران
const leaders = {
  cyrus: "کوروش بزرگ",
  darius: "داریوش بزرگ",
  abbas: "شاه عباس صفوی",
  nader: "نادرشاه افشار",
  karim: "کریم‌خان زند",
  rezashah: "رضاشاه پهلوی",
  khomeini: "امام خمینی",
  khamenei: "رهبر خامنه‌ای"
};

// ذخیره انتخاب کاربر (برای تست ساده)
const userChoices = new Map();

// مدیریت session
bot.use(session({ initial: () => ({}) }));

// استارت بازی
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("👑 کوروش بزرگ", "leader_cyrus")
    .text("👑 داریوش بزرگ", "leader_darius")
    .row()
    .text("👑 شاه عباس", "leader_abbas")
    .text("⚔️ نادرشاه", "leader_nader")
    .row()
    .text("🤝 کریم‌خان زند", "leader_karim")
    .text("🏭 رضاشاه", "leader_rezashah")
    .row()
    .text("🕋 امام خمینی", "leader_khomeini")
    .text("🕌 رهبر خامنه‌ای", "leader_khamenei");

  await ctx.reply(
    "🏛️ به بازی «بقای باستانی» خوش آمدی!\n\n" +
    "تو باید یکی از پادشاهان یا رهبران تاریخ ایران رو انتخاب کنی.\n" +
    "هر کدوم رو انتخاب کنی، مسیر مخصوص به خودش رو داری.\n\n" +
    "👇 یکی رو انتخاب کن:",
    { reply_markup: keyboard }
  );
});

// مدیریت کلیک روی دکمه‌ها
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  if (data.startsWith("leader_")) {
    const leaderKey = data.replace("leader_", "");
    const leaderName = leaders[leaderKey];
    
    // ذخیره انتخاب کاربر
    userChoices.set(ctx.from.id, leaderKey);
    
    // حذف کیبورد از پیام قبلی
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    
    // پاسخ با تایید انتخاب
    await ctx.reply(
      `✅ تو **${leaderName}** رو به عنوان رهبر خود انتخاب کردی.\n\n` +
      `🔧 الان نوبت مرحله اول بازی است.\n` +
      `(فعلاً سناریوها اضافه نشده، اما به زودی کامل میشه)\n\n` +
      `🔄 برای شروع مجدد، /start رو بزن.`,
      { parse_mode: "Markdown" }
    );
    
    // برای دیباگ در ترمینال
    console.log(`👤 کاربر ${ctx.from.id} (${ctx.from.first_name}) => ${leaderName}`);
  }
  
  // بستن notification تلگرام
  await ctx.answerCallbackQuery();
});

// دستور کمک
bot.command("help", async (ctx) => {
  await ctx.reply(
    "🎮 **راهنمای بازی بقای باستانی**\n\n" +
    "/start - شروع بازی و انتخاب رهبر\n" +
    "/myleader - ببین کدوم رهبر رو انتخاب کردی\n" +
    "/help - همین راهنما\n\n" +
    "💡 در آینده نزدیک: سناریوهای اختصاصی برای هر رهبر اضافه میشه.",
    { parse_mode: "Markdown" }
  );
});

// ببین کدوم رهبر رو انتخاب کرده
bot.command("myleader", async (ctx) => {
  const selected = userChoices.get(ctx.from.id);
  if (selected && leaders[selected]) {
    await ctx.reply(`👑 تو قبلاً **${leaders[selected]}** رو انتخاب کردی.`, { parse_mode: "Markdown" });
  } else {
    await ctx.reply(`❌ هنوز هیچ رهبری انتخاب نکردی. با /start شروع کن.`);
  }
});

// استارت ربات
bot.start();
console.log("🚀 ربات بقای باستانی روشن شد...");