const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

const mainMenuImage = "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE";

function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

function getMainMenu() {
  return new InlineKeyboard()
    .text("🏛️ هخامنشیان", "cat_ancient")
    .text("⚔️ صفویان", "cat_islamic")
    .row()
    .text("🏭 پهلویان", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");
}

bot.command("start", async (ctx) => {
  await ctx.replyWithPhoto(mainMenuImage, {
    caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    parse_mode: "Markdown",
    reply_markup: getMainMenu()
  });
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  if (data === "cat_ancient") {
    await ctx.reply("🏛️ شما دسته هخامنشیان را انتخاب کردید. (در حال ساخت)");
  } else if (data === "cat_islamic") {
    await ctx.reply("⚔️ شما دسته صفویان را انتخاب کردید. (در حال ساخت)");
  } else if (data === "cat_modern") {
    await ctx.reply("🏭 شما دسته پهلویان را انتخاب کردید. (در حال ساخت)");
  } else if (data === "cat_republic") {
    await ctx.reply("🕌 شما دسته جمهوری اسلامی را انتخاب کردید. (در حال ساخت)");
  }
});

bot.start();
console.log("✅ ربات با منوی اصلی روشن شد...");