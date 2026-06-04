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

// ==================== عکس‌های رهبران ====================
const leaders = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE", era: "ancient" },
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

// ==================== سلاح‌های هر دوره ====================
const weaponsByEra = {
  ancient: [
    { id: "sword", name: "⚔️ شمشیر مفرغین", price: 100, power: 5 },
    { id: "bow", name: "🏹 کمان پهلوی", price: 150, power: 8 },
    { id: "spear", name: "🔱 نیزه بلند", price: 200, power: 12 }
  ],
  islamic: [
    { id: "damascus", name: "🗡️ شمشیر دمشقی", price: 250, power: 15 },
    { id: "armor", name: "🛡️ زره زنجیرین", price: 350, power: 12 },
    { id: "musket", name: "🔫 تفنگ فتیله‌ای", price: 500, power: 25 }
  ],
  modern: [
    { id: "bruno", name: "🔫 تفنگ برنو", price: 400, power: 20 },
    { id: "maxim", name: "💣 مسلسل ماکسیم", price: 700, power: 35 },
    { id: "fighter", name: "✈️ جنگنده آسمانی", price: 2500, power: 90 }
  ],
  republic: [
    { id: "rpg", name: "💥 آرپی‌جی ۷", price: 500, power: 30 },
    { id: "t72", name: "🚜 تانک T-72", price: 3000, power: 100 },
    { id: "missile", name: "🚀 موشک شهاب", price: 2000, power: 80 }
  ]
};

// ==================== انیمیشن‌ها ====================
const animations = {
  victory: "CgACAgQAAxkBAAEqEw1qIJDV8z7vf7hG_oP0l4aaTPm7ZQACgCMAAvQVAVEjsoZnsyyDgTsE",
  defeat: "CgACAgQAAxkBAAEqEu1qII15onal3AqvYITzkqdm5MI00gACeyMAAvQVAVF1fh97_aRKYDsE"
};

// ==================== دشمنان ====================
const enemies = ["سپاه دشمن", "شورشیان", "مهاجمان", "ارتش متجاوز", "دشمن کهن"];

bot.command("start", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  // ==================== نمایش دسته‌ها ====================
  if (data === "cat_ancient") {
    const keyboard = new InlineKeyboard()
      .text("کوروش بزرگ", "select_cyrus")
      .text("داریوش بزرگ", "select_darius")
      .row()
      .text("انوشیروان", "select_anushirvan")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText(`🏛️ **شاهان هخامنشی و ساسانی**\n\nیکی از شاهان را برگزین:`, { parse_mode: "Markdown", reply_markup: keyboard });
  }
  else if (data === "cat_islamic") {
    const keyboard = new InlineKeyboard()
      .text("شاه عباس", "select_shahabbas")
      .text("نادرشاه", "select_nader")
      .row()
      .text("کریم‌خان", "select_karim")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText(`⚔️ **شاهان صفوی و افشار**\n\nیکی از شاهان را برگزین:`, { parse_mode: "Markdown", reply_markup: keyboard });
  }
  else if (data === "cat_modern") {
    const keyboard = new InlineKeyboard()
      .text("رضاشاه", "select_rezashah")
      .text("محمدرضا", "select_mohammadreza")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText(`🏭 **شاهان پهلوی**\n\nیکی از شاهان را برگزین:`, { parse_mode: "Markdown", reply_markup: keyboard });
  }
  else if (data === "cat_republic") {
    const keyboard = new InlineKeyboard()
      .text("امام خمینی", "select_khomeini")
      .text("آیت‌الله خامنه‌ای", "select_khamenei")
      .row()
      .text("🔙 بازگشت", "back_main");
    await ctx.editMessageText(`🕌 **رهبران جمهوری اسلامی**\n\nیکی از رهبران را برگزین:`, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  // ==================== انتخاب رهبر ====================
  else if (data.startsWith("select_")) {
    const leaderKey = data.replace("select_", "");
    const leader = leaders[leaderKey];
    usersDB.set(ctx.from.id, {
      leader: leaderKey, leaderName: leader.name, era: leader.era,
      gold: 500, exp: 0, military: 50, weapon: null, battleCount: 0
    });
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("📊 دفترچه", "status")
      .text("🔙 منوی اصلی", "back_main");
    await ctx.replyWithPhoto(leader.image, {
      caption: `${getGlassBorder()}\n✅ **${leader.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰`,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  }

  // ==================== فروشگاه ====================
  else if (data === "shop") {
    const user = usersDB.get(ctx.from.id);
    if (!user) { await ctx.reply("❌ ابتدا یک رهبر انتخاب کن!"); return; }
    const weapons = weaponsByEra[user.era];
    const keyboard = new InlineKeyboard();
    weapons.forEach(w => keyboard.text(`${w.name} - ${w.price}💰`, `buy_${w.id}`));
    keyboard.row().text("🔙 بازگشت", "back_to_game");
    await ctx.reply(
      `🪞 **بازارچه شیشه‌ای**\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n\n${weapons.map(w => `${w.name} - ${w.price}💰 (قدرت +${w.power})`).join("\n")}`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }

  // ==================== خرید سلاح ====================
  else if (data.startsWith("buy_")) {
    const user = usersDB.get(ctx.from.id);
    const weaponId = data.replace("buy_", "");
    const weapon = weaponsByEra[user.era].find(w => w.id === weaponId);
    if (user.gold >= weapon.price) {
      user.gold -= weapon.price;
      if (user.weapon) user.military -= user.weapon.power;
      user.weapon = weapon;
      user.military += weapon.power;
      usersDB.set(ctx.from.id, user);
      await ctx.reply(`✅ ${weapon.name} خریداری شد!\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}`);
    } else {
      await ctx.reply(`❌ دینار کافی نیست! نیاز به ${weapon.price - user.gold} دینار بیشتر.`);
    }
  }

  // ==================== جنگ ====================
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const playerPower = user.military + (user.weapon?.power || 0);
    const isWin = playerPower + (Math.random() * 30 - 10) > 50;
    const reward = isWin ? { gold: 200, exp: 30 } : { gold: 20, exp: 5 };
    user.gold += reward.gold;
    user.exp += reward.exp;
    usersDB.set(ctx.from.id, user);
    const anim = isWin ? animations.victory : animations.defeat;
    await ctx.replyWithAnimation(anim, {
      caption: `${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${reward.gold} دینار\n⭐ +${reward.exp} تجربه\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}`,
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("⚔️ جنگ دوباره", "battle").text("🪞 بازارچه", "shop").row().text("🔙 بازگشت", "back_to_game")
    });
  }

  // ==================== وضعیت ====================
  else if (data === "status") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    const leader = leaders[user.leader];
    await ctx.replyWithPhoto(leader.image, {
      caption: `${getGlassBorder()}\n📊 **دفترچه وضعیت**\n${getGlassBorder()}\n\n👑 نام: ${user.leaderName}\n💰 دینار: ${user.gold}\n⭐ تجربه: ${user.exp}\n⚔️ توان: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}`,
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game")
    });
  }

  // ==================== بازگشت ====================
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    if (!user) { await ctx.reply("❌ خطا! /start رو بزن."); return; }
    const leader = leaders[user.leader];
    const keyboard = new InlineKeyboard()
      .text("🪞 بازارچه", "shop")
      .text("⚔️ میدان رزم", "battle")
      .row()
      .text("📊 دفترچه", "status")
      .text("🔙 منوی اصلی", "back_main");
    await ctx.replyWithPhoto(leader.image, {
      caption: `${getGlassBorder()}\n✅ **${user.leaderName}**\n${getGlassBorder()}\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}`,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  }
  else if (data === "back_main") {
    await ctx.reply(
      `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
      { parse_mode: "Markdown", reply_markup: getMainMenu() }
    );
  }
});

bot.start();
console.log("🎮 قدم بعدی - عکس رهبران و سیستم خرید سلاح اضافه شد...");