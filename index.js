const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);
const usersDB = new Map();
const ADMINS = [5576592239];

function getGlassBorder() { return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨"; }

// ==================== نرخ تورم هر دوره ====================
const inflationRates = {
  ancient: 1,
  islamic: 5,
  modern: 10,
  khomeini: 50,
  khamenei: 5000000
};

const currencyNames = {
  ancient: "شکِل",
  islamic: "تومان",
  modern: "ریال",
  khomeini: "تومان",
  khamenei: "تومان"
};

function formatPrice(price, era) {
  const rate = inflationRates[era];
  const finalPrice = price * rate;
  const currency = currencyNames[era];
  if (era === "khamenei") {
    if (finalPrice >= 1000000000) return `${(finalPrice / 1000000000).toFixed(0)} میلیارد ${currency}`;
    return `${(finalPrice / 1000000).toFixed(0)} میلیون ${currency}`;
  }
  return `${finalPrice.toLocaleString()} ${currency}`;
}

function formatGold(gold, era) {
  const currency = currencyNames[era];
  if (era === "khamenei") {
    if (gold >= 1000000000) return `${(gold / 1000000000).toFixed(0)} میلیارد ${currency}`;
    return `${(gold / 1000000).toFixed(0)} میلیون ${currency}`;
  }
  return `${gold.toLocaleString()} ${currency}`;
}

// ==================== سلاح‌ها ====================
const baseWeapons = {
  ancient: [
    { id: "sword", name: "⚔️ شمشیر مفرغین", basePrice: 100, power: 5, desc: "خود مفرغین سپاه هخامنشی" },
    { id: "bow", name: "🏹 کمان پهلوی", basePrice: 150, power: 8, desc: "تیراندازان پارسی" },
    { id: "spear", name: "🔱 نیزه بلند", basePrice: 200, power: 12, desc: "نیزه‌داران جاودان" }
  ],
  islamic: [
    { id: "damascus", name: "🗡️ شمشیر دمشقی", basePrice: 250, power: 15, desc: "فولاد دمشق" },
    { id: "armor", name: "🛡️ زره زنجیرین", basePrice: 350, power: 12, desc: "محافظ سوارگان" },
    { id: "musket", name: "🔫 تفنگ فتیله‌ای", basePrice: 500, power: 25, desc: "تفنگ قورچیان" }
  ],
  modern: [
    { id: "bruno", name: "🔫 تفنگ برنو", basePrice: 400, power: 20, desc: "تفنگ اصلی ارتش" },
    { id: "maxim", name: "💣 مسلسل ماکسیم", basePrice: 700, power: 35, desc: "ساخت تهران" },
    { id: "fighter", name: "✈️ جنگنده آسمانی", basePrice: 2500, power: 90, desc: "خرید از آلمان" }
  ],
  khomeini: [
    { id: "rpg", name: "💥 آرپی‌جی ۷", basePrice: 500, power: 30, desc: "شکننده زره" },
    { id: "mortar", name: "💣 خمپاره ۶۰ مم", basePrice: 800, power: 45, desc: "پشتیبان آتش" },
    { id: "t72", name: "🚜 تانک T-72", basePrice: 3000, power: 100, desc: "غنیمتی از صدام" }
  ],
  khamenei: [
    { id: "shahab1", name: "🚀 موشک شهاب ۱", basePrice: 2000, power: 80, desc: "موشک کوتاه برد" },
    { id: "mohajer", name: "🛸 پهباد مهاجر", basePrice: 3500, power: 120, desc: "پهپاد تهاجمی" },
    { id: "missile", name: "💥 موشک خرمشهر", basePrice: 6000, power: 200, desc: "موشک بالستیک" }
  ]
};

// ==================== پادشاهان ====================
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

// ==================== دشمنان ====================
const enemiesList = {
  ancient: ["سپاه بابل", "شورشیان پارس", "مادها", "سکاها"],
  islamic: ["ارتش عثمانی", "ازبک‌ها", "پرتُغالی‌ها", "گورکانیان"],
  modern: ["شورشیان عشایر", "ارتش سرخ", "نیروهای متفقین"],
  khomeini: ["ارتش بعث", "منافقین", "صدام", "نیروهای متجاوز"],
  khamenei: ["آمریکا", "اسرائیل", "داعش", "تحریم‌های ظالمانه"]
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
    .text("📊 دفترچه", "status")
    .row()
    .text("🏆 نامه سروران", "leaderboard")
    .text("🔙 منوی اصلی", "back_main");
}

function getBackToGameMenu() {
  return new InlineKeyboard().text("🔙 بازگشت به بازی", "back_to_game");
}

// ==================== لیدربورد ====================
async function showLeaderboard(ctx) {
  const users = Array.from(usersDB.entries())
    .filter(([k]) => !String(k).includes("admin_"))
    .sort((a, b) => b[1].military - a[1].military)
    .slice(0, 10);
  
  if (users.length === 0) {
    await ctx.reply("📭 هنوز هیچ سروری یافت نشد.\n\nبا /start شروع کن و اولین فرمانروا باش!", { reply_markup: getBackToGameMenu() });
    return;
  }
  
  const text = users.map(([id, d], i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "📌";
    const goldDisplay = formatGold(d.gold, d.era);
    return `${medal} **${d.realName || d.kingName}**\n   💰 ${goldDisplay} | ⚔️ ${d.military} توان`;
  }).join("\n\n");
  
  await ctx.reply(`${getGlassBorder()}\n🏆 **نامه سروران**\n${getGlassBorder()}\n\n${text}`, { parse_mode: "Markdown", reply_markup: getBackToGameMenu() });
}

// ==================== وضعیت ====================
async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) {
    await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
    return;
  }
  const king = kings[user.king];
  const goldDisplay = formatGold(user.gold, user.era);
  await ctx.replyWithPhoto(king.image, {
    caption: `${getGlassBorder()}\n📊 **دفترچه ${user.kingName}**\n${getGlassBorder()}\n\n💰 تومان: ${goldDisplay}\n⚔️ توان رزمی: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}\n\n👸 حرمسرا: ${harams[user.king].queens.length} ملکه\n🎁 آیتم ویژه: ${harams[user.king].specialItem}`,
    parse_mode: "Markdown", reply_markup: getBackToGameMenu()
  });
}

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

  // دسته‌بندی
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

  // انتخاب پادشاه
  else if (data.startsWith("select_")) {
    const kingId = data.replace("select_", "");
    const king = kings[kingId];
    const baseGold = king.era === "khamenei" ? 500000000 : (king.era === "khomeini" ? 5000 : 500);
    
    usersDB.set(userId, {
      king: kingId, kingName: king.name, era: king.era, realName: ctx.from.first_name,
      gold: baseGold, exp: 0, military: 50, weapon: null, battleCount: 0
    });
    
    const goldDisplay = formatGold(baseGold, king.era);
    await ctx.replyWithPhoto(king.image, {
      caption: `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 تومان: ${goldDisplay}\n⚔️ توان رزمی: ۵۰`,
      parse_mode: "Markdown", reply_markup: getGameMenu()
    });
  }

  // حرمسرا
  else if (data === "haram") {
    const user = usersDB.get(userId);
    if (!user) { await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") }); return; }
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

  // انتخاب ملکه
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

  // بازارچه
  else if (data === "shop") {
    const user = usersDB.get(userId);
    if (!user) { await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") }); return; }
    const weapons = baseWeapons[user.era];
    const goldDisplay = formatGold(user.gold, user.era);
    const keyboard = new InlineKeyboard();
    weapons.forEach(w => {
      const priceDisplay = formatPrice(w.basePrice, user.era);
      keyboard.text(`${w.name} - ${priceDisplay}`, `buy_${w.id}`);
    });
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    
    await ctx.reply(`🪞 **بازارچه شیشه‌ای**\n\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}\n\n${weapons.map(w => {
      const priceDisplay = formatPrice(w.basePrice, user.era);
      return `• ${w.name} - ${priceDisplay} (قدرت +${w.power})\n   ${w.desc}`;
    }).join("\n")}`, { parse_mode: "Markdown", reply_markup: keyboard });
  }

  // خرید سلاح
  else if (data.startsWith("buy_")) {
    const user = usersDB.get(userId);
    if (!user) return;
    const weaponId = data.replace("buy_", "");
    const weapon = baseWeapons[user.era].find(w => w.id === weaponId);
    if (!weapon) return;
    
    const finalPrice = weapon.basePrice * inflationRates[user.era];
    if (user.gold >= finalPrice) {
      user.gold -= finalPrice;
      if (user.weapon) user.military -= user.weapon.power;
      user.weapon = { name: weapon.name, power: weapon.power };
      user.military += weapon.power;
      usersDB.set(userId, user);
      const goldDisplay = formatGold(user.gold, user.era);
      await ctx.reply(`✅ **${weapon.name}** خریداری شد!\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`, { reply_markup: getBackToGameMenu() });
    } else {
      const need = finalPrice - user.gold;
      const needDisplay = formatPrice(need / inflationRates[user.era], user.era);
      await ctx.reply(`❌ تومان کافی نیست! نیاز به ${needDisplay} بیشتر.`, { reply_markup: getBackToGameMenu() });
    }
  }

  // جنگ
  else if (data === "battle") {
    const user = usersDB.get(userId);
    if (!user) return;
    
    const enemies = enemiesList[user.era];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const playerPower = user.military + (user.weapon?.power || 0);
    const isWin = playerPower + (Math.random() * 30 - 10) > 50;
    const reward = isWin ? 
      { gold: Math.floor(100 * inflationRates[user.era]), exp: 30 } : 
      { gold: Math.floor(10 * inflationRates[user.era]), exp: 5 };
    
    user.gold += reward.gold;
    user.exp += reward.exp;
    usersDB.set(userId, user);
    
    const goldDisplay = formatGold(user.gold, user.era);
    const rewardDisplay = formatGold(reward.gold, user.era);
    
    await ctx.reply(`${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${rewardDisplay} تومان\n⭐ +${reward.exp} تجربه\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`, { reply_markup: getBackToGameMenu() });
  }

  // وضعیت
  else if (data === "status") {
    await showStatus(ctx);
  }

  // لیدربورد
  else if (data === "leaderboard") {
    await showLeaderboard(ctx);
  }

  // بازگشت به بازی (منوی پادشاه)
  else if (data === "back_to_game") {
    const user = usersDB.get(userId);
    if (!user) {
      await ctx.reply("❌ خطا! لطفاً /start رو بزن.", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
      return;
    }
    const king = kings[user.king];
    const goldDisplay = formatGold(user.gold, user.era);
    await ctx.replyWithPhoto(king.image, {
      caption: `${getGlassBorder()}\n✅ **${user.kingName}**\n${getGlassBorder()}\n\n💰 تومان: ${goldDisplay}\n⚔️ توان رزمی: ${user.military}`,
      parse_mode: "Markdown", reply_markup: getGameMenu()
    });
  }

  // بازگشت به منوی اصلی (اول بازی)
  else if (data === "back_main") {
    await ctx.reply(
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

console.log("🎮 بازی بقای باستانی - نسخه نهایی با سیستم بازگشت هوشمند روشن شد...");