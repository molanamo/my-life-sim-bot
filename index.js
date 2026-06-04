const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);
const usersDB = new Map();

function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

// ==================== پادشاهان ====================
const kings = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", era: "ancient" },
  shahabbas: { name: "شاه عباس", desc: "صفوی بزرگ", era: "islamic" },
  nader: { name: "نادرشاه", desc: "فاتح هند", era: "islamic" },
  karim: { name: "کریم‌خان", desc: "وکیل‌الرعایا", era: "islamic" },
  rezashah: { name: "رضاشاه", desc: "بنیادگزار ارتش نوین", era: "modern" },
  mohammadreza: { name: "محمدرضا", desc: "پیشاهنگ سپید", era: "modern" },
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب", era: "khomeini" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر فرزانه", era: "khamenei" }
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
    .text("📊 دفترچه", "status")
    .text("🔙 منوی اصلی", "back_main");
}

function getBackToGameMenu() {
  return new InlineKeyboard().text("🔙 بازگشت به بازی", "back_to_game");
}

// ==================== سلاح‌ها ====================
const weaponsByEra = {
  ancient: [{ name: "⚔️ شمشیر مفرغین", price: 100, power: 5 }],
  islamic: [{ name: "🗡️ شمشیر دمشقی", price: 250, power: 15 }],
  modern: [{ name: "🔫 تفنگ برنو", price: 400, power: 20 }],
  khomeini: [{ name: "💥 آرپی‌جی ۷", price: 500, power: 30 }],
  khamenei: [{ name: "🚀 موشک شهاب ۱", price: 2000, power: 80 }]
};

// ==================== دشمنان ====================
const enemies = ["سپاه دشمن", "شورشیان", "مهاجمان", "ارتش متجاوز"];

// ==================== استارت ====================
bot.command("start", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// ==================== مدیریت کلیک‌ها ====================
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  await ctx.answerCallbackQuery();

  // دسته هخامنشیان
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
  // دسته صفویان
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
  // دسته پهلویان
  else if (data === "cat_modern") {
    const keyboard = new InlineKeyboard()
      .text("رضاشاه", "select_rezashah")
      .text("محمدرضا", "select_mohammadreza")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText("🏭 **شاهان پهلوی**\n\nیکی از شاهان را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }
  // دسته جمهوری اسلامی
  else if (data === "cat_republic") {
    const keyboard = new InlineKeyboard()
      .text("امام خمینی", "select_khomeini")
      .text("آیت‌الله خامنه‌ای", "select_khamenei")
      .row()
      .text("🔙 منوی اصلی", "back_main");
    await ctx.editMessageText("🕌 **رهبران جمهوری اسلامی**\n\nیکی از رهبران را برگزین:", { parse_mode: "Markdown", reply_markup: keyboard });
  }

  // انتخاب پادشاه
  else if (data.startsWith("select_")) {
    const kingId = data.replace("select_", "");
    const king = kings[kingId];
    usersDB.set(userId, {
      king: kingId, kingName: king.name, era: king.era, realName: ctx.from.first_name,
      gold: 500, military: 50, weapon: null
    });
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 تومان: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      { parse_mode: "Markdown", reply_markup: getGameMenu() }
    );
  }

  // بازارچه
  else if (data === "shop") {
    const user = usersDB.get(userId);
    if (!user) { await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") }); return; }
    const weapons = weaponsByEra[user.era];
    const keyboard = new InlineKeyboard();
    weapons.forEach(w => keyboard.text(`${w.name} - ${w.price}💰`, `buy_${w.name}`));
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    await ctx.reply(`🪞 **بازارچه شیشه‌ای**\n\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}\n\n${weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})`).join("\n")}`, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  // خرید
  else if (data.startsWith("buy_")) {
    const user = usersDB.get(userId);
    const weaponName = data.replace("buy_", "");
    const weapon = weaponsByEra[user.era].find(w => w.name === weaponName);
    if (user.gold >= weapon.price) {
      user.gold -= weapon.price;
      if (user.weapon) user.military -= user.weapon.power;
      user.weapon = weapon;
      user.military += weapon.power;
      usersDB.set(userId, user);
      await ctx.reply(`✅ ${weapon.name} خریداری شد!\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}`, { reply_markup: getBackToGameMenu() });
    } else {
      await ctx.reply(`❌ تومان کافی نیست! نیاز به ${weapon.price - user.gold} تومان بیشتر.`, { reply_markup: getBackToGameMenu() });
    }
  }

  // جنگ
  else if (data === "battle") {
    const user = usersDB.get(userId);
    if (!user) return;
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const playerPower = user.military + (user.weapon?.power || 0);
    const isWin = playerPower + (Math.random() * 30 - 10) > 50;
    const reward = isWin ? 200 : 20;
    user.gold += reward;
    usersDB.set(userId, user);
    await ctx.reply(`${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${reward} تومان\n💰 تومان: ${user.gold}`, { reply_markup: new InlineKeyboard().text("⚔️ جنگ دوباره", "battle").text("🔙 بازگشت به بازی", "back_to_game") });
  }

  // وضعیت
  else if (data === "status") {
    const user = usersDB.get(userId);
    if (!user) return;
    await ctx.reply(`📊 **دفترچه ${user.kingName}**\n\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}`, { parse_mode: "Markdown", reply_markup: getBackToGameMenu() });
  }

  // بازگشت به بازی
  else if (data === "back_to_game") {
    const user = usersDB.get(userId);
    if (!user) {
      await ctx.reply("❌ خطا! /start رو بزن.", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
      return;
    }
    await ctx.editMessageText(
      `${getGlassBorder()}\n✅ **${user.kingName}**\n${getGlassBorder()}\n\n💰 تومان: ${user.gold}\n⚔️ توان: ${user.military}`,
      { parse_mode: "Markdown", reply_markup: getGameMenu() }
    );
  }

  // بازگشت به منوی اصلی
  else if (data === "back_main") {
    await ctx.editMessageText(
      `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: getMainMenu() }
    );
  }
});

// ==================== استارت ربات ====================
if (process.env.RAILWAY_ENV === "true") {
  bot.start({ allowed_updates: ["message", "callback_query"] });
} else {
  bot.start();
}

console.log("🚀 گام 5 - نسخه کامل با 10 پادشاه، بازارچه و جنگ روشن شد...");