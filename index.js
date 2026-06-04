const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

function getMainMenu() {
  return new InlineKeyboard()
    .text("🏛️ هخامنشیان", "test_ancient")
    .text("⚔️ صفویان", "test_islamic")
    .row()
    .text("🏭 پهلویان", "test_modern")
    .text("🕌 جمهوری اسلامی", "test_republic")
    .row()
    .text("📊 وضعیت", "test_status")
    .text("🏆 لیدربورد", "test_leaderboard");
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n` +
    `🪞 ⭐ فروغ جاودان ⭐ 🪞\n` +
    `${getGlassBorder()}\n\n` +
    `✅ **ربات با موفقیت روشن شد!**\n\n` +
    `📜 یک دسته از شاهان را برای تست برگزین:\n\n` +
    `🛠️ این نسخه تستی برای اطمینان از کارکرد دکمه‌هاست.`,
    {
      parse_mode: "Markdown",
      reply_markup: getMainMenu()
    }
  );
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();
  
  if (data === "test_ancient") {
    await ctx.reply("✅ دکمه **هخامنشیان** کار می‌کند!", { parse_mode: "Markdown" });
  } else if (data === "test_islamic") {
    await ctx.reply("✅ دکمه **صفویان** کار می‌کند!", { parse_mode: "Markdown" });
  } else if (data === "test_modern") {
    await ctx.reply("✅ دکمه **پهلویان** کار می‌کند!", { parse_mode: "Markdown" });
  } else if (data === "test_republic") {
    await ctx.reply("✅ دکمه **جمهوری اسلامی** کار می‌کند!", { parse_mode: "Markdown" });
  } else if (data === "test_status") {
    await ctx.reply(`📊 **وضعیت تست**\n\n👤 نام: ${ctx.from.first_name}\n🆔 ایدی: ${ctx.from.id}\n✅ ربات آنلاین است`, { parse_mode: "Markdown" });
  } else if (data === "test_leaderboard") {
    await ctx.reply("🏆 **لیدربورد تست**\n\n1. شما (تست)\n✅ همه چیز کار می‌کند.", { parse_mode: "Markdown" });
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply("🆗 ربات تست آنلاین است - همه دکمه‌ها کار می‌کنند.");
});

bot.start();
console.log("🚀 ربات تست پیشرفته روشن شد...");