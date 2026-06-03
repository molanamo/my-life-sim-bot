const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// ==================== عکس‌ها و اطلاعات رهبران ====================

const leaders = {
  // دوره باستان
  cyrus: {
    name: "کوروش بزرگ",
    desc: "بنیانگذار هخامنشی، منشور حقوق بشر",
    image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE",
    era: "ancient"
  },
  darius: {
    name: "داریوش بزرگ",
    desc: "سازنده تخت جمشید، سازماندهی اداری",
    image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE",
    era: "ancient"
  },
  anushirvan: {
    name: "انوشیروان",
    desc: "دادگر ساسانی، حامی علم و فلسفه",
    image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA",
    era: "ancient"
  },
  // دوره معاصر (قبلی)
  rezashah: {
    name: "رضاشاه پهلوی",
    desc: "بنیانگذار ارتش مدرن، راه‌سازی",
    image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE",
    era: "modern"
  },
  mohammadreza: {
    name: "محمدرضا پهلوی",
    desc: "انقلاب سفید، توسعه اقتصادی",
    image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE",
    era: "modern"
  }
};

// ==================== سلاح‌های هر دوره ====================

const weaponsByEra = {
  ancient: [
    { id: "sword", name: "شمشیر مفرغی", price: 100, power: 5, desc: "سلاح استاندارد سرباز هخامنشی" },
    { id: "bow", name: "تیر و کمان", price: 150, power: 8, desc: "کمانداران پارسی" },
    { id: "spear", name: "نیزه بلند", price: 200, power: 12, desc: "نیزه‌داران جاودان" },
    { id: "chariot", name: "ارابه جنگی", price: 400, power: 25, desc: "نیروی ویژه هخامنشی" },
    { id: "elephant", name: "فیل جنگی", price: 600, power: 35, desc: "زره‌پوش ساسانی" }
  ],
  modern: [
    { id: "bruno", name: "تفنگ برنو", price: 400, power: 20, desc: "تفنگ اصلی ارتش رضاشاه" },
    { id: "maxim", name: "مسلسل ماکسیم", price: 700, power: 35, desc: "ساخت کارخانه مسلسل‌سازی تهران" },
    { id: "cannon75", name: "توپ ۷۵ میلی‌متری", price: 1500, power: 60, desc: "خرید از چکسلواکی" },
    { id: "fighter", name: "جنگنده هواپیمایی", price: 2500, power: 90, desc: "خرید از آلمان" }
  ]
};

const usersDB = new Map();

// ==================== منوی اصلی ====================

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ پادشاهان باستان", "menu_ancient")
    .text("🏭 پادشاهان معاصر", "menu_modern");

  await ctx.replyWithPhoto(leaders.cyrus.image, {
    caption: "🏛️ **بازی بقای باستانی**\n\nیک دسته رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== نمایش رهبران هر دسته ====================

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  // نمایش منوی باستان
  if (data === "menu_ancient") {
    const keyboard = new InlineKeyboard()
      .text("کوروش بزرگ", "select_cyrus")
      .text("داریوش بزرگ", "select_darius")
      .row()
      .text("انوشیروان", "select_anushirvan")
      .row()
      .text("🔙 بازگشت", "back_main");
    
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
    await ctx.reply("🏛️ **پادشاهان باستان**\n\nیکی رو انتخاب کن:", { parse_mode: "Markdown" });
  }
  
  // نمایش منوی معاصر
  else if (data === "menu_modern") {
    const keyboard = new InlineKeyboard()
      .text("رضاشاه پهلوی", "select_rezashah")
      .text("محمدرضا پهلوی", "select_mohammadreza")
      .row()
      .text("🔙 بازگشت", "back_main");
    
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
    await ctx.reply("🏭 **پادشاهان معاصر**\n\nیکی رو انتخاب کن:", { parse_mode: "Markdown" });
  }
  
  // انتخاب رهبر
  else if (data.startsWith("select_")) {
    const leaderKey = data.replace("select_", "");
    const leader = leaders[leaderKey];
    
    if (!leader) return;
    
    usersDB.set(ctx.from.id, {
      leader: leaderKey,
      leaderName: leader.name,
      era: leader.era,
      gold: 500,
      exp: 0,
      military: 50,
      weapon: null
    });
    
    const keyboard = new InlineKeyboard()
      .text("🛒 فروشگاه سلاح", "open_shop")
      .text("⚔️ جنگ", "battle");
    
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    await ctx.replyWithPhoto(leader.image, {
      caption: `✅ **${leader.name}** انتخاب شد!\n\n💰 سکه: ۵۰۰\n⚔️ قدرت نظامی: ۵۰\n\n🛒 از فروشگاه سلاح بخر و وارد جنگ شو:`,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  }
  
  // بازگشت به منوی اصلی
  else if (data === "back_main") {
    const keyboard = new InlineKeyboard()
      .text("🏛️ پادشاهان باستان", "menu_ancient")
      .text("🏭 پادشاهان معاصر", "menu_modern");
    
    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
    await ctx.reply("🏛️ **بازی بقای باستانی**\n\nیک دسته رو انتخاب کن:", { parse_mode: "Markdown" });
  }
  
  // فروشگاه
  else if (data === "open_shop") {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.reply("❌ اول یک رهبر انتخاب کن!");
      return;
    }
    
    const weapons = weaponsByEra[user.era];
    const keyboard = new InlineKeyboard();
    weapons.forEach(item => {
      keyboard.text(`${item.name} - ${item.price}💰`, `buy_${item.id}`);
    });
    keyboard.row().text("🔙 بازگشت", "back_to_game");
    
    await ctx.reply(
      `🛒 **فروشگاه ${user.era === "ancient" ? "دوره باستان" : "دوره معاصر"}**\n\n` +
      `💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح فعلی: ${user.weapon?.name || "ندارد"}\n\n` +
      weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})\n   ${w.desc}`).join("\n"),
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  
  // خرید سلاح
  else if (data.startsWith("buy_")) {
    const itemId = data.replace("buy_", "");
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const weapons = weaponsByEra[user.era];
    const item = weapons.find(w => w.id === itemId);
    if (!item) return;
    
    if (user.gold >= item.price) {
      user.gold -= item.price;
      user.weapon = item;
      user.military += item.power;
      usersDB.set(ctx.from.id, user);
      await ctx.reply(`✅ **${item.name}** خریداری شد!\n💰 باقی‌مانده: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}`);
    } else {
      await ctx.reply(`❌ سکه کافی نیست! نیاز به ${item.price - user.gold} سکه بیشتر.`);
    }
  }
  
  // جنگ
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const enemies = {
      ancient: ["امپراتوری بابل", "شورشیان داخلی", "سکاها", "مصریان"],
      modern: ["شورشیان عشایر", "نیروهای جدایی‌طلب", "ارتش متجاوز"]
    };
    
    const enemyList = enemies[user.era];
    const enemy = enemyList[Math.floor(Math.random() * enemyList.length)];
    const enemyPower = Math.floor(Math.random() * 80) + 30;
    const playerPower = user.military + (user.weapon?.power || 0);
    const result = playerPower + (Math.random() * 40 - 15) > enemyPower;
    
    if (result) {
      const reward = 200;
      user.gold += reward;
      usersDB.set(ctx.from.id, user);
      await ctx.reply(
        `⚔️ **نبرد با ${enemy}**\n\n` +
        `🎉 **پیروزی!**\n` +
        `💰 +${reward} سکه دریافت کردی.\n` +
        `💰 سکه فعلی: ${user.gold}`
      );
    } else {
      await ctx.reply(
        `⚔️ **نبرد با ${enemy}**\n\n` +
        `💔 **شکست خوردی!**\n` +
        `سکه‌ای به دست نیاوردی.\n` +
        `💰 سکه فعلی: ${user.gold}`
      );
    }
  }
  
  // بازگشت به بازی
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    const keyboard = new InlineKeyboard()
      .text("🛒 فروشگاه سلاح", "open_shop")
      .text("⚔️ جنگ", "battle");
    
    await ctx.reply(
      `🏛️ **${user.era === "ancient" ? "دوره باستان" : "دوره معاصر"}**\n\n` +
      `👤 رهبر: ${user.leaderName}\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح: ${user.weapon?.name || "ندارد"}`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  
  await ctx.answerCallbackQuery();
});

bot.start();
console.log("🎮 ربات بقای باستانی - دوره باستان و معاصر روشن شد...");