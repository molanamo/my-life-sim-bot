const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

const usersDB = new Map();

function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

// ==================== پادشاهان و ملکه‌ها ====================
const kings = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3kAAzsE", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA", era: "ancient" },
  shahabbas: { name: "شاه عباس", desc: "صفوی بزرگ", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA", era: "islamic" },
  nader: { name: "نادرشاه", desc: "فاتح هند", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE", era: "islamic" },
  karim: { name: "کریم‌خان", desc: "وکیل‌الرعایا", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA", era: "islamic" },
  rezashah: { name: "رضاشاه", desc: "بنیادگزار ارتش نوین", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE", era: "modern" },
  mohammadreza: { name: "محمدرضا", desc: "پیشاهنگ سپید", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE", era: "modern" },
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب", image: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE", era: "republic" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر فرزانه", image: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ", era: "republic" }
};

const harams = {
  cyrus: { queens: [{ name: "آتوسا", desc: "دختر کوروش، ملکه بزرگ", image: "AgACAgQAAxkBAAEqF_VqIUiXDNrgihg0fmG12Gs01PrJ8QACxA1rG_JGCVFD_JpmxUMtsgEAAwIAA3kAAzsE" }], specialItem: "💎 تاج مروارید" },
  darius: { queens: [{ name: "آتوسا", desc: "دختر کوروش، همسر داریوش", image: "AgACAgQAAxkBAAEqF_VqIUiXDNrgihg0fmG12Gs01PrJ8QACxA1rG_JGCVFD_JpmxUMtsgEAAwIAA3kAAzsE" }], specialItem: "🏺 جام زرین" },
  anushirvan: { queens: [{ name: "شیرین", desc: "همسر محبوب انوشیروان", image: "AgACAgQAAxkBAAEqF_pqIUiX5hgu2spv5cqpQNhwkzoZWQACyA1rG_JGCVFjP_brzFcJeAEAAwIAA3kAAzsE" }], specialItem: "📜 فرمان عدالت" },
  shahabbas: { queens: [{ name: "ملک جهان", desc: "ملکه صفوی", image: "AgACAgQAAxkBAAEqF_xqIUiXpjy1R-LudoyFGrJD2qEu3QACyg1rG_JGCVGeTGCNTHEaQQEAAwIAA3kAAzsE" }], specialItem: "🕌 محراب زرین" },
  nader: { queens: [], specialItem: "⚔️ شمشیر نادری" },
  karim: { queens: [], specialItem: "🌹 گل سرخ شیراز" },
  rezashah: { queens: [{ name: "تاج الملوک", desc: "ملکه پهلوی", image: "AgACAgQAAxkBAAEqF_5qIUiXE2lOOvP0_IkqR5oCoPpBhAACyw1rG_JGCVHtjb_Kyi9t2AEAAwIAA3kAAzsE" }], specialItem: "👑 تاج پهلوی" },
  mohammadreza: { queens: [{ name: "عصمت دولتشاهی", desc: "همسر محمدرضا", image: "AgACAgQAAxkBAAEqGAABaiFIl4W-9FJFZnQ4C2lkvXQnxmEAAs0NaxvyRglRrLHcR39hxqUBAAMCAAN5AAM7BA" }], specialItem: "💎 الماس نور" },
  khomeini: { queens: [{ name: "خدیجه ثقفی", desc: "همسر امام", image: "AgACAgQAAxkBAAEqGAJqIUiXDDIfX1SQmNRuQnojI3TFzgACzg1rG_JGCVFOZ9bATwodkAEAAwIAA3kAAzsE" }], specialItem: "🕋 سنگ مرمر" },
  khamenei: { queens: [{ name: "منصوره خجسته", desc: "همسر رهبر", image: "AgACAgQAAxkBAAEqGANqIUiXm9OB_AYLRM7ZqoWuB9_ykwAC0g1rG_JGCVF5zXNH_Dm_ewEAAwIAA3gAAzsE" }], specialItem: "📖 قرآن نفیس" }
};

// ==================== منوها ====================
function getMainMenu() {
  return new InlineKeyboard()
    .text("🏛️ هخامنشیان", "cat_ancient")
    .text("⚔️ صفویان", "cat_islamic")
    .row()
    .text("🏭 پهلویان", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");
}

function getGameMenu() {
  return new InlineKeyboard()
    .text("🪞 بازارچه", "shop")
    .text("⚔️ میدان رزم", "battle")
    .row()
    .text("👸 حرمسرا", "haram")
    .text("🔙 منوی اصلی", "back_main");
}

// ==================== دستور استارت ====================
bot.command("start", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// ==================== مدیریت کلیک‌ها ====================
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  // دسته هخامنشیان
  if (data === "cat_ancient") {
    const keyboard = new InlineKeyboard()
      .text("کوروش بزرگ", "select_cyrus")
      .text("داریوش بزرگ", "select_darius")
      .row()
      .text("انوشیروان", "select_anushirvan")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText("🏛️ **شاهان هخامنشی و ساسانی**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  // دسته صفویان
  else if (data === "cat_islamic") {
    const keyboard = new InlineKeyboard()
      .text("شاه عباس", "select_shahabbas")
      .text("نادرشاه", "select_nader")
      .row()
      .text("کریم‌خان", "select_karim")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText("⚔️ **شاهان صفوی و افشار**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  // دسته پهلویان
  else if (data === "cat_modern") {
    const keyboard = new InlineKeyboard()
      .text("رضاشاه", "select_rezashah")
      .text("محمدرضا", "select_mohammadreza")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText("🏭 **شاهان پهلوی**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  // دسته جمهوری اسلامی
  else if (data === "cat_republic") {
    const keyboard = new InlineKeyboard()
      .text("امام خمینی", "select_khomeini")
      .text("آیت‌الله خامنه‌ای", "select_khamenei")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText("🕌 **رهبران جمهوری اسلامی**\n\nیکی از رهبران را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }

  // ========== انتخاب پادشاه ==========
  else if (data.startsWith("select_")) {
    const kingId = data.replace("select_", "");
    const king = kings[kingId];
    usersDB.set(ctx.from.id, { king: kingId, kingName: king.name, era: king.era, gold: 500, military: 50, weapon: null });
    await ctx.replyWithPhoto(king.image, {
      caption: `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      parse_mode: "Markdown", reply_markup: getGameMenu()
    });
  }

  // ========== حرمسرا ==========
  else if (data === "haram") {
    const user = usersDB.get(ctx.from.id);
    if (!user) { await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!"); return; }
    const haram = harams[user.king];
    if (!haram || haram.queens.length === 0) {
      await ctx.reply(`👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram?.specialItem || "ندارد"}\n\nهیچ ملکه‌ای یافت نشد.`, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") });
      return;
    }
    const keyboard = new InlineKeyboard();
    haram.queens.forEach((q, idx) => { keyboard.text(q.name, `queen_${user.king}_${idx}`); });
    keyboard.row().text("🔙 بازگشت", "back_to_game");
    await ctx.reply(`👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram.specialItem}\n\n👩 ملکه‌ها:\n${haram.queens.map(q => `• ${q.name}: ${q.desc}`).join("\n")}`, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  // ========== انتخاب ملکه ==========
  else if (data.startsWith("queen_")) {
    const parts = data.split("_");
    const kingId = parts[1];
    const queenIdx = parseInt(parts[2]);
    const queen = harams[kingId].queens[queenIdx];
    await ctx.replyWithPhoto(queen.image, {
      caption: `👸 **${queen.name}**\n\n📖 ${queen.desc}\n\n💝 وفادار به ${kings[kingId].name}\n\n🎁 آیتم ویژه: ${harams[kingId].specialItem}`,
      parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت به حرمسرا", "haram")
    });
  }

  // ========== بازارچه ==========
  else if (data === "shop") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    await ctx.reply(`🪞 **بازارچه شیشه‌ای**\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n\n• شمشیر مفرغین - ۱۰۰💰 (قدرت +۵)`, { reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") });
  }

  // ========== جنگ ==========
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    const enemies = ["سپاه دشمن", "شورشیان", "مهاجمان"];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const isWin = Math.random() > 0.5;
    const reward = isWin ? 200 : 20;
    user.gold += reward;
    usersDB.set(ctx.from.id, user);
    await ctx.reply(`${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${reward} دینار\n💰 دینار: ${user.gold}`, { reply_markup: new InlineKeyboard().text("⚔️ جنگ دوباره", "battle").text("🪞 بازارچه", "shop").row().text("🔙 بازگشت", "back_to_game") });
  }

  // ========== بازگشت به بازی ==========
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    await ctx.replyWithPhoto(kings[user.king].image, {
      caption: `${getGlassBorder()}\n✅ **${user.kingName}**\n${getGlassBorder()}\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}`,
      parse_mode: "Markdown", reply_markup: getGameMenu()
    });
  }

  // ========== بازگشت به منوی اصلی ==========
  else if (data === "back_main") {
    await ctx.editMessageText(`${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`, { parse_mode: "Markdown", reply_markup: getMainMenu() });
  }
});

// استارت ربات
if (process.env.RAILWAY_ENV === "true") {
  bot.start({ allowed_updates: ["message", "callback_query"] });
} else {
  bot.start();
}

console.log("🎮 نسخه یک تست - بازی بقای باستانی با عکس روشن شد...");