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
  // هخامنشیان
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", era: "ancient" },
  // صفویان
  shahabbas: { name: "شاه عباس", desc: "صفوی بزرگ", era: "islamic" },
  nader: { name: "نادرشاه", desc: "فاتح هند", era: "islamic" },
  karim: { name: "کریم‌خان", desc: "وکیل‌الرعایا", era: "islamic" },
  // پهلویان
  rezashah: { name: "رضاشاه", desc: "بنیادگزار ارتش نوین", era: "modern" },
  mohammadreza: { name: "محمدرضا", desc: "پیشاهنگ سپید", era: "modern" },
  // جمهوری اسلامی
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب", era: "republic" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر فرزانه", era: "republic" }
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

  // ==================== دسته هخامنشیان ====================
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
  // ==================== دسته صفویان ====================
  else if (data === "cat_islamic") {
    const keyboard = new InlineKeyboard()
      .text("شاه عباس", "select_shahabbas")
      .text("نادرشاه", "select_nader")
      .row()
      .text("کریم‌خان", "select_karim")
      .row()
      .text("🔙 بازگشت", "back_main");
    
    await ctx.editMessageText(
      `⚔️ **شاهان صفوی و افشار**\n\nیکی از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  // ==================== دسته پهلویان ====================
  else if (data === "cat_modern") {
    const keyboard = new InlineKeyboard()
      .text("رضاشاه", "select_rezashah")
      .text("محمدرضا", "select_mohammadreza")
      .row()
      .text("🔙 بازگشت", "back_main");
    
    await ctx.editMessageText(
      `🏭 **شاهان پهلوی**\n\nیکی از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  // ==================== دسته جمهوری اسلامی ====================
  else if (data === "cat_republic") {
    const keyboard = new InlineKeyboard()
      .text("امام خمینی", "select_khomeini")
      .text("آیت‌الله خامنه‌ای", "select_khamenei")
      .row()
      .text("🔙 بازگشت", "back_main");
    
    await ctx.editMessageText(
      `🕌 **رهبران جمهوری اسلامی**\n\nیکی از رهبران را برگزین:`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  // ==================== انتخاب رهبران ====================
  else if (data === "select_cyrus") {
    usersDB.set(ctx.from.id, { leader: "cyrus", leaderName: "کوروش بزرگ", era: "ancient", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
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
    usersDB.set(ctx.from.id, { leader: "darius", leaderName: "داریوش بزرگ", era: "ancient", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
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
    usersDB.set(ctx.from.id, { leader: "anushirvan", leaderName: "انوشیروان", era: "ancient", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
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
  else if (data === "select_shahabbas") {
    usersDB.set(ctx.from.id, { leader: "shahabbas", leaderName: "شاه عباس", era: "islamic", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **شاه عباس** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_nader") {
    usersDB.set(ctx.from.id, { leader: "nader", leaderName: "نادرشاه", era: "islamic", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **نادرشاه** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_karim") {
    usersDB.set(ctx.from.id, { leader: "karim", leaderName: "کریم‌خان", era: "islamic", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **کریم‌خان** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_rezashah") {
    usersDB.set(ctx.from.id, { leader: "rezashah", leaderName: "رضاشاه", era: "modern", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **رضاشاه** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_mohammadreza") {
    usersDB.set(ctx.from.id, { leader: "mohammadreza", leaderName: "محمدرضا", era: "modern", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **محمدرضا** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_khomeini") {
    usersDB.set(ctx.from.id, { leader: "khomeini", leaderName: "امام خمینی", era: "republic", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **امام خمینی** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  else if (data === "select_khamenei") {
    usersDB.set(ctx.from.id, { leader: "khamenei", leaderName: "آیت‌الله خامنه‌ای", era: "republic", gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0 });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **آیت‌الله خامنه‌ای** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  // ==================== بازارچه و جنگ ====================
  else if (data === "shop") {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.editMessageText("❌ ابتدا یک رهبر انتخاب کن!", { reply_markup: getBackMenu() });
      return;
    }
    await ctx.editMessageText(
      `🪞 **بازارچه شیشه‌ای**\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n\n• شمشیر مفرغین - ۱۰۰💰 (قدرت +۵)`,
      { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") }
    );
  }
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.editMessageText("❌ ابتدا یک رهبر انتخاب کن!", { reply_markup: getBackMenu() });
      return;
    }
    const enemies = ["سپاه دشمن", "شورشیان", "مهاجمان", "ارتش متجاوز"];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const playerPower = user.military;
    const isWin = playerPower + (Math.random() * 30 - 10) > 50;
    const reward = isWin ? 200 : 20;
    user.gold += reward;
    usersDB.set(ctx.from.id, user);
    
    await ctx.editMessageText(
      `${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${reward} دینار\n💰 دینار فعلی: ${user.gold}`,
      { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") }
    );
  }
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.editMessageText("❌ خطا! /start رو بزن.", { reply_markup: getMainMenu() });
      return;
    }
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
console.log("🎮 نسخه کامل با ۱۰ رهبر و همه دسته‌ها روشن شد...");