const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);
const usersDB = new Map();

function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

// ==================== عکس‌های پادشاهان ====================
const kings = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3kAAzsE", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA", era: "ancient" },
  shahabbas: { name: "شاه عباس", desc: "صفوی بزرگ", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA", era: "islamic" },
  nader: { name: "نادرشاه", desc: "فاتح هند", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE", era: "islamic" },
  karim: { name: "کریم‌خان", desc: "وکیل‌الرعایا", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA", era: "islamic" },
  rezashah: { name: "رضاشاه", desc: "بنیادگزار ارتش نوین", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE", era: "modern" },
  mohammadreza: { name: "محمدرضا", desc: "پیشاهنگ سپید", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE", era: "modern" },
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب", image: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE", era: "khomeini" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر فرزانه", image: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ", era: "khamenei" }
};

// ==================== حرمسراها ====================
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

// ==================== عکس منوی اصلی ====================
const mainMenuImage = "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE";

// ==================== سلاح‌ها ====================
const weaponsByEra = {
  ancient: [{ id: "sword", name: "⚔️ شمشیر مفرغین", price: 100, power: 5 }],
  islamic: [{ id: "damascus", name: "🗡️ شمشیر دمشقی", price: 250, power: 15 }],
  modern: [{ id: "bruno", name: "🔫 تفنگ برنو", price: 400, power: 20 }],
  khomeini: [{ id: "rpg", name: "💥 آرپی‌جی ۷", price: 500, power: 30 }],
  khamenei: [{ id: "shahab1", name: "🚀 موشک شهاب ۱", price: 2000, power: 80 }]
};

const enemies = ["سپاه دشمن", "شورشیان", "مهاجمان", "ارتش متجاوز"];

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
    .text("📊 دفترچه", "status")
    .row()
    .text("🔙 منوی اصلی", "back_main");
}

function getBackToGameMenu() {
  return new InlineKeyboard().text("🔙 بازگشت به بازی", "back_to_game");
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
  const userId = ctx.from.id;
  await ctx.answerCallbackQuery();

  if (data === "cat_ancient") {
    const keyboard = new InlineKeyboard()
      .text("کوروش بزرگ", "select_cyrus")
      .text("داریوش بزرگ", "select_darius")
      .row()
      .text("انوشیروان", "select_anushirvan")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText("🏛️ **شاهان هخامنشی و ساسانی**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  else if (data === "cat_islamic") {
    const keyboard = new InlineKeyboard()
      .text("شاه عباس", "select_shahabbas")
      .text("نادرشاه", "select_nader")
      .row()
      .text("کریم‌خان", "select_karim")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText("⚔️ **شاهان صفوی و افشار**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  else if (data === "cat_modern") {
    const keyboard = new InlineKeyboard()
      .text("رضاشاه", "select_rezashah")
      .text("محمدرضا", "select_mohammadreza")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText("🏭 **شاهان پهلوی**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  else if (data === "cat_republic") {
    const keyboard = new InlineKeyboard()
      .text("امام خمینی", "select_khomeini")
      .text("آیت‌الله خامنه‌ای", "select_khamenei")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText("🕌 **رهبران جمهوری اسلامی**\n\nیکی از رهبران را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }

  else if (data.startsWith("select_")) {
    const kingId = data.replace("select_", "");
    const king = kings[kingId];
    usersDB.set(userId, {
      king: kingId, kingName: king.name, era: king.era, realName: ctx.from.first_name,
      gold: 500, military: 50, weapon: null
    });
    await ctx.replyWithPhoto(king.image, {
      caption: `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 تومان: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      parse_mode: "Markdown", reply_markup: getGameMenu()
    });
  }

  else if (data === "haram") {
    const user = usersDB.get(userId);
    if (!user) return;
    const haram = harams[user.king];
    if (!haram || haram.queens.length === 0) {
      await ctx.reply(`👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram?.specialItem || "ندارد"}\n\nهیچ ملکه‌ای یافت نشد.`, { parse_mode: "Markdown", reply_markup: getBackToGameMenu() });
      return;
    }
    const keyboard = new InlineKeyboard();
    haram.queens.forEach((q, idx) => { keyboard.text(q.name, `queen_${user.king}_${idx}`); });
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    await ctx.reply(`👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram.specialItem}\n\n👩 ملکه‌ها:\n${haram.queens.map(q => `• ${q.name}: ${q.desc}`).join("\n")}`, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  else if (data.startsWith("queen_")) {
    const parts = data.split("_");
    const kingId = parts[1];
    const queenIdx = parseInt(parts[2]);
    const queen = harams[kingId].queens[queenIdx];
    await ctx.replyWithPhoto(queen.image, {
      caption: `👸 **${queen.name}**\n\n📖 ${queen.desc}\n\n💝 وفادار به ${kings[kingId].name}\n\n🎁 آیتم ویژه: ${harams[kingId].specialItem}`,
      parse_mode: "Markdown", reply_markup: getBackToGameMenu()
    });
  }

  else if (data === "shop") {
    const user = usersDB.get(userId);
    if (!user) return;
    const weapons = weaponsByEra[user.era];
    const keyboard = new InlineKeyboard();
    weapons.forEach(w => keyboard.text(`${w.name} - ${w.price}💰`, `buy_${w.id}`));
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    await ctx.reply(`🪞 **بازارچه شیشه‌ای**\n\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}\n\n${weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})`).join("\n")}`, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  else if (data.startsWith("buy_")) {
    const user = usersDB.get(userId);
    const weaponId = data.replace("buy_", "");
    const weapon = weaponsByEra[user.era].find(w => w.id === weaponId);
    if (user.gold >= weapon.price) {
      user.gold -= weapon.price;
      if (user.weapon) user.military -= user.weapon.power;
      user.weapon = weapon;
      user.military += weapon.power;
      usersDB.set(userId, user);
      await ctx.reply(`✅ ${weapon.name} خریداری شد!\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}`, { reply_markup: getBackToGameMenu() });
    } else {
      await ctx.reply(`❌ تومان کافی نیست!`, { reply_markup: getBackToGameMenu() });
    }
  }

  else if (data === "battle") {
    const user = usersDB.get(userId);
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const playerPower = user.military + (user.weapon?.power || 0);
    const isWin = playerPower + (Math.random() * 30 - 10) > 50;
    const reward = isWin ? 200 : 20;
    user.gold += reward;
    usersDB.set(userId, user);
    await ctx.reply(`${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${reward} تومان\n💰 تومان: ${user.gold}`, { reply_markup: new InlineKeyboard().text("⚔️ جنگ دوباره", "battle").text("🔙 بازگشت به بازی", "back_to_game") });
  }

  else if (data === "status") {
    const user = usersDB.get(userId);
    const level = Math.floor(user.exp / 100) + 1;
    await ctx.replyWithPhoto(kings[user.king].image, {
      caption: `${getGlassBorder()}\n📊 **دفترچه ${user.kingName}**\n${getGlassBorder()}\n\n💰 تومان: ${user.gold}\n⭐ سطح: ${level || 1}\n⚔️ توان: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}`,
      parse_mode: "Markdown", reply_markup: getBackToGameMenu()
    });
  }

  else if (data === "back_to_game") {
    const user = usersDB.get(userId);
    if (!user) {
      await ctx.reply("❌ خطا! /start رو بزن.", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
      return;
    }
    await ctx.replyWithPhoto(kings[user.king].image, {
      caption: `${getGlassBorder()}\n✅ **${user.kingName}**\n${getGlassBorder()}\n\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}`,
      parse_mode: "Markdown", reply_markup: getGameMenu()
    });
  }

  else if (data === "back_main") {
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
      parse_mode: "Markdown", reply_markup: getMainMenu()
    });
  }
});

if (process.env.RAILWAY_ENV === "true") {
  bot.start({ allowed_updates: ["message", "callback_query"] });
} else {
  bot.start();
}

console.log("🚀 گام 6 - نسخه با عکس پادشاهان، حرمسرا و ملکه‌ها روشن شد...");