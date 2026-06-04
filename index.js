const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

const usersDB = new Map();

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

function getBackMenu() {
  return new InlineKeyboard().text("🔙 بازگشت", "back_main");
}

const leaders = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", era: "ancient" }
};

bot.command("start", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  if (data === "cat_ancient") {
    const keyboard = new InlineKeyboard()
      .text("کوروش بزرگ", "select_cyrus")
      .text("داریوش بزرگ", "select_darius")
      .row()
      .text("انوشیروان", "select_anushirvan")
      .row()
      .text("🔙 بازگشت", "back_main");
    
    await ctx.editMessageText(
      `🏛️ **شاهان هخامنشی و ساسانی**\n\nیکی از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_cyrus") {
    usersDB.set(ctx.from.id, { leader: "cyrus", leaderName: "کوروش بزرگ", gold: 500, military: 50 });
    
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **کوروش بزرگ** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_darius") {
    usersDB.set(ctx.from.id, { leader: "darius", leaderName: "داریوش بزرگ", gold: 500, military: 50 });
    
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **داریوش بزرگ** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_anushirvan") {
    usersDB.set(ctx.from.id, { leader: "anushirvan", leaderName: "انوشیروان", gold: 500, military: 50 });
    
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **انوشیروان** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "shop") {
    const user = usersDB.get(ctx.from.id);
    await ctx.editMessageText(
      `🪞 **بازارچه شیشه‌ای**\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n\n• شمشیر مفرغین - ۱۰۰💰 (قدرت +۵)`,
      { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") }
    );
  }
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    const isWin = Math.random() > 0.5;
    const reward = isWin ? 200 : 20;
    user.gold += reward;
    usersDB.set(ctx.from.id, user);
    
    await ctx.editMessageText(
      `${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n💰 +${reward} دینار\n💰 دینار فعلی: ${user.gold}`,
      { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") }
    );
  }
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${user.leaderName}**\n${getGlassBorder()}\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "back_main") {
    await ctx.editMessageText(
      `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: getMainMenu() }
    );
  }
});

bot.start();
console.log("🎮 گام ۲ - انتخاب رهبر و جنگ ساده روشن شد...");