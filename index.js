const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// ==================== دسته‌بندی و عکس‌ها ====================

const categories = {
  ancient: {
    name: "🏛️ پادشاهان باستان",
    image: "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE",
    leaders: {
      cyrus: { name: "کوروش بزرگ", desc: "بنیانگذار هخامنشی، منشور حقوق بشر", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE" },
      darius: { name: "داریوش بزرگ", desc: "سازنده تخت جمشید، سازماندهی اداری", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE" },
      anushirvan: { name: "انوشیروان", desc: "دادگر ساسانی، حامی علم و فلسفه", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA" }
    }
  },
  islamic: {
    name: "⚔️ پادشاهان اسلامی",
    image: "AgACAgQAAxkBAAEqDUdqICQc6ZB0uinHD6hZ7wcT3u86oQAC4A5rG4APAVFQEaC3exIhHQEAAwIAA3kAAzsE",
    leaders: {
      shahabbas: { name: "شاه عباس کبیر", desc: "صفوی، اصفهان نصف جهان", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA" },
      nader: { name: "نادرشاه افشار", desc: "فاتح هند، احیای مرزهای ایران", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE" },
      karim: { name: "کریم‌خان زند", desc: "وکیل‌الرعایا، دوران آرامش", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA" }
    }
  },
  modern: {
    name: "🏭 پادشاهان معاصر",
    image: "AgACAgQAAxkBAAEqDW1qICTZj5vvNZdj8IfXm08Go-EoHAAC4w5rG4APAVF78qoubkaQrgEAAwIAA3kAAzsE",
    leaders: {
      rezashah: { name: "رضاشاه پهلوی", desc: "بنیانگذار ارتش مدرن، راه‌سازی", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE" },
      mohammadreza: { name: "محمدرضا پهلوی", desc: "انقلاب سفید، توسعه اقتصادی", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE" }
    }
  },
  republic: {
    name: "🕌 رهبران جمهوری اسلامی",
    image: "AgACAgQAAxkBAAEqDXxqICU_YmcR261F414EcCku6vMMCAAC5A5rG4APAVEmgDq8PfldMwEAAwIAA3gAAzsE",
    leaders: {
      khomeini: { name: "امام خمینی", desc: "رهبر انقلاب اسلامی", image: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE" },
      khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر کنونی ایران", image: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ" }
    }
  }
};

// ==================== منوی اصلی ====================

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ پادشاهان باستان", "cat_ancient")
    .text("⚔️ پادشاهان اسلامی", "cat_islamic")
    .row()
    .text("🏭 پادشاهان معاصر", "cat_modern")
    .text("🕌 رهبران جمهوری اسلامی", "cat_republic");

  await ctx.replyWithPhoto(categories.ancient.image, {
    caption: "🏛️ **بازی بقای باستانی**\n\nبه جمع پادشاهان و رهبران تاریخ ایران خوش آمدی.\n\n📜 یک دسته رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== نمایش دسته انتخاب شده ====================

async function showCategory(ctx, categoryId) {
  const cat = categories[categoryId];
  if (!cat) return;

  const keyboard = new InlineKeyboard();
  Object.entries(cat.leaders).forEach(([key, value]) => {
    keyboard.text(value.name, `temp_${categoryId}_${key}`);
  });
  keyboard.row().text("🔙 بازگشت به منوی اصلی", "back_main");

  await ctx.editMessageMedia({
    type: "photo",
    media: cat.image,
    caption: `📜 **${cat.name}**\n\n✨ یکی از پادشاهان یا رهبران زیر رو انتخاب کن:\n\n` +
      Object.entries(cat.leaders).map(([k, v]) => `• **${v.name}**\n   ${v.desc}`).join("\n"),
    parse_mode: "Markdown"
  }, { reply_markup: keyboard });
}

// ==================== نمایش جزئیات رهبر ====================

async function showLeaderDetail(ctx, categoryId, leaderKey) {
  const cat = categories[categoryId];
  const leader = cat.leaders[leaderKey];

  const keyboard = new InlineKeyboard()
    .text("✅ انتخاب این رهبر", `select_${categoryId}_${leaderKey}`)
    .text("🔙 بازگشت", `back_cat_${categoryId}`);

  await ctx.editMessageMedia({
    type: "photo",
    media: leader.image,
    caption: `👑 **${leader.name}**\n\n📖 **معرفی:**\n${leader.desc}\n\n❓ آیا می‌خواهی این رهبر رو انتخاب کنی؟`,
    parse_mode: "Markdown"
  }, { reply_markup: keyboard });
}

// ==================== مدیریت کلیک‌ها ====================

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  try {
    await ctx.answerCallbackQuery();

    if (data.startsWith("cat_")) {
      const categoryId = data.replace("cat_", "");
      await showCategory(ctx, categoryId);
    }
    else if (data.startsWith("temp_")) {
      const parts = data.split("_");
      const categoryId = parts[1];
      const leaderKey = parts[2];
      await showLeaderDetail(ctx, categoryId, leaderKey);
    }
    else if (data.startsWith("select_")) {
      const parts = data.split("_");
      const categoryId = parts[1];
      const leaderKey = parts[2];
      const cat = categories[categoryId];
      const leader = cat.leaders[leaderKey];

      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await ctx.replyWithPhoto(leader.image, {
        caption: `✅ **${leader.name}** با موفقیت انتخاب شد.\n\n🔧 مرحله اول سناریو به زودی اضافه می‌شه...\n\n🔄 برای شروع مجدد /start رو بزن.`,
        parse_mode: "Markdown"
      });

      console.log(`🎮 ${ctx.from.first_name} => ${cat.name} => ${leader.name}`);
    }
    else if (data.startsWith("back_cat_")) {
      const categoryId = data.replace("back_cat_", "");
      await showCategory(ctx, categoryId);
    }
    else if (data === "back_main") {
      const keyboard = new InlineKeyboard()
        .text("🏛️ پادشاهان باستان", "cat_ancient")
        .text("⚔️ پادشاهان اسلامی", "cat_islamic")
        .row()
        .text("🏭 پادشاهان معاصر", "cat_modern")
        .text("🕌 رهبران جمهوری اسلامی", "cat_republic");

      await ctx.editMessageMedia({
        type: "photo",
        media: categories.ancient.image,
        caption: "🏛️ **بازی بقای باستانی**\n\n📜 یک دسته رو انتخاب کن:",
        parse_mode: "Markdown"
      }, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("خطا:", error);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره /start رو بزن.");
  }
});

// ==================== دستورات کمکی ====================

bot.command("help", async (ctx) => {
  await ctx.reply(
    "🎮 **راهنمای بازی بقای باستانی**\n\n" +
    "/start - شروع بازی و انتخاب رهبر\n" +
    "/restart - شروع مجدد\n" +
    "/help - همین راهنما\n\n" +
    "📌 هر پادشاه یا رهبر عکس و توضیحات مخصوص داره.",
    { parse_mode: "Markdown" }
  );
});

bot.command("restart", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ پادشاهان باستان", "cat_ancient")
    .text("⚔️ پادشاهان اسلامی", "cat_islamic")
    .row()
    .text("🏭 پادشاهان معاصر", "cat_modern")
    .text("🕌 رهبران جمهوری اسلامی", "cat_republic");

  await ctx.replyWithPhoto(categories.ancient.image, {
    caption: "🏛️ **بازی بقای باستانی**\n\n📜 یک دسته رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== استارت ربات ====================

bot.start();
console.log("🎮 بازی بقای باستانی روشن شد...");