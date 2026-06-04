const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

const usersDB = new Map();

function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

// پادشاهان
const kings = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", era: "ancient" }
};

// حرمسراها (ملکه‌های هر پادشاه)
const harams = {
  cyrus: {
    queens: [
      { name: "آتوسا", desc: "دختر کوروش، ملکه بزرگ" },
      { name: "کاساندان", desc: "همسر محبوب کوروش" }
    ],
    specialItem: "💎 تاج مروارید"
  },
  darius: {
    queens: [
      { name: "آتوسا", desc: "دختر کوروش، همسر داریوش" },
      { name: "پارمیس", desc: "دختر بردیا" }
    ],
    specialItem: "🏺 جام زرین"
  },
  anushirvan: {
    queens: [
      { name: "شیرین", desc: "همسر محبوب انوشیروان" }
    ],
    specialItem: "📜 فرمان عدالت"
  }
};

function getMainMenu() {
  return new InlineKeyboard()
    .text("🏛️ هخامنشیان", "cat_ancient")
    .text("⚔️ صفویان", "cat_islamic")
    .row()
    .text("🏭 پهلویان", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");
}

function getGameMenu(kingName) {
  return new InlineKeyboard()
    .text("🪞 بازارچه", "shop")
    .text("⚔️ میدان رزم", "battle")
    .row()
    .text("👸 حرمسرا", "haram")
    .text("🔙 منوی اصلی", "back_main");
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  // ========== دسته هخامنشیان ==========
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
  // صفویان (فعلاً خالی)
  else if (data === "cat_islamic") {
    await ctx.editMessageText(`⚔️ **شاهان صفوی**\n\nدر حال ساخت...`, { reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_main") });
  }
  // پهلویان (فعلاً خالی)
  else if (data === "cat_modern") {
    await ctx.editMessageText(`🏭 **شاهان پهلوی**\n\nدر حال ساخت...`, { reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_main") });
  }
  // جمهوری اسلامی (فعلاً خالی)
  else if (data === "cat_republic") {
    await ctx.editMessageText(`🕌 **رهبران جمهوری اسلامی**\n\nدر حال ساخت...`, { reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_main") });
  }

  // ========== انتخاب پادشاه ==========
  else if (data === "select_cyrus") {
    const king = kings.cyrus;
    usersDB.set(ctx.from.id, { king: "cyrus", kingName: king.name, gold: 500, military: 50 });
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰\n\n👸 برای ورود به حرمسرا از منوی زیر استفاده کن:`,
      { parse_mode: "Markdown", reply_markup: getGameMenu(king.name) }
    );
  }
  else if (data === "select_darius") {
    const king = kings.darius;
    usersDB.set(ctx.from.id, { king: "darius", kingName: king.name, gold: 500, military: 50 });
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰\n\n👸 برای ورود به حرمسرا از منوی زیر استفاده کن:`,
      { parse_mode: "Markdown", reply_markup: getGameMenu(king.name) }
    );
  }
  else if (data === "select_anushirvan") {
    const king = kings.anushirvan;
    usersDB.set(ctx.from.id, { king: "anushirvan", kingName: king.name, gold: 500, military: 50 });
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰\n\n👸 برای ورود به حرمسرا از منوی زیر استفاده کن:`,
      { parse_mode: "Markdown", reply_markup: getGameMenu(king.name) }
    );
  }

  // ========== حرمسرا ==========
  else if (data === "haram") {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!");
      return;
    }
    
    const haram = harams[user.king];
    if (!haram) {
      await ctx.reply("❌ حرمسرایی برای این پادشاه یافت نشد.");
      return;
    }
    
    const keyboard = new InlineKeyboard();
    haram.queens.forEach((q, index) => {
      keyboard.text(`${q.name}`, `queen_${user.king}_${index}`);
    });
    keyboard.row().text("🔙 بازگشت", "back_to_game");
    
    await ctx.editMessageText(
      `👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram.specialItem}\n\n👩 ملکه‌ها:\n${haram.queens.map(q => `• ${q.name}: ${q.desc}`).join("\n")}`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  
  // ========== انتخاب ملکه ==========
  else if (data.startsWith("queen_")) {
    const parts = data.split("_");
    const kingId = parts[1];
    const queenIndex = parseInt(parts[2]);
    const haram = harams[kingId];
    const queen = haram.queens[queenIndex];
    
    await ctx.editMessageText(
      `👸 **${queen.name}**\n\n📖 ${queen.desc}\n\n💝 وفادار به ${kingId === "cyrus" ? "کوروش بزرگ" : kingId === "darius" ? "داریوش بزرگ" : "انوشیروان"}\n\n🔧 آیتم ویژه حرمسرا: ${haram.specialItem}`,
      { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت به حرمسرا", "haram") }
    );
  }

  // ========== بازارچه (ساده) ==========
  else if (data === "shop") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    await ctx.editMessageText(
      `🪞 **بازارچه شیشه‌ای**\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n\n• شمشیر مفرغین - ۱۰۰💰 (قدرت +۵)`,
      { reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") }
    );
  }

  // ========== جنگ (ساده) ==========
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    const enemies = ["سپاه دشمن", "شورشیان", "مهاجمان"];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const isWin = Math.random() > 0.5;
    const reward = isWin ? 200 : 20;
    
    user.gold += reward;
    usersDB.set(ctx.from.id, user);
    
    await ctx.editMessageText(
      `${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${reward} دینار\n💰 دینار: ${user.gold}`,
      { reply_markup: new InlineKeyboard().text("⚔️ جنگ دوباره", "battle").text("🪞 بازارچه", "shop").row().text("🔙 بازگشت", "back_to_game") }
    );
  }

  // ========== بازگشت به بازی ==========
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${user.kingName}**\n${getGlassBorder()}\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}`,
      { parse_mode: "Markdown", reply_markup: getGameMenu(user.kingName) }
    );
  }

  // ========== بازگشت به منوی اصلی ==========
  else if (data === "back_main") {
    await ctx.editMessageText(
      `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: getMainMenu() }
    );
  }
});

// استارت ربات
if (process.env.RAILWAY_ENV === "true") {
  bot.start({ allowed_updates: ["message", "callback_query"] });
} else {
  bot.start();
}

console.log("🎮 نسخه تستی - حرمسرا و ملکه‌ها روشن شد...");