const { Bot, InlineKeyboard, session } = require("grammy");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// لینک‌های عکس (از سایت‌های معتبر تاریخی)
// می‌تونی این لینک‌ها رو با عکس‌های دلخواهت جایگزین کنی
const images = {
  // عکس دسته‌بندی‌ها
  category_ancient: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Persepolis_balcony.jpg/800px-Persepolis_balcony.jpg",
  category_islamic: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Naqsh-e_Jahan_Square_Isfahan.jpg/800px-Naqsh-e_Jahan_Square_Isfahan.jpg",
  category_modern: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Golestan_Palace%2C_Tehran.jpg/800px-Golestan_Palace%2C_Tehran.jpg",
  category_republic: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Iran_Tehran_11-12-2009_002.jpg/800px-Iran_Tehran_11-12-2009_002.jpg",
  
  // عکس پادشاهان باستان
  cyrus: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Cyrus_Cylinder_front_%28cropped%29.jpg/500px-Cyrus_Cylinder_front_%28cropped%29.jpg",
  darius: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Darius_I_%28Tachar%29.jpg/500px-Darius_I_%28Tachar%29.jpg",
  anushirvan: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Taq-e_Bostan_-_Khosrow_parvaneh.jpg/500px-Taq-e_Bostan_-_Khosrow_parvaneh.jpg",
  
  // عکس پادشاهان اسلامی
  shahabbas: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Shah_Abbas_I_%28cropped%29.jpg/500px-Shah_Abbas_I_%28cropped%29.jpg",
  nader: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Nader_Shah_Afshar_%28cropped%29.jpg/500px-Nader_Shah_Afshar_%28cropped%29.jpg",
  karim: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Karim_Khan_%28cropped%29.jpg/500px-Karim_Khan_%28cropped%29.jpg",
  
  // عکس پادشاهان معاصر
  aghamohammad: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Agha_Mohammad_Khan_Qajar_%28cropped%29.jpg/500px-Agha_Mohammad_Khan_Qajar_%28cropped%29.jpg",
  rezashah: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Reza_Shah_Pahlavi_%28cropped%29.jpg/500px-Reza_Shah_Pahlavi_%28cropped%29.jpg",
  mohammadreza: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Mohammad_Reza_Pahlavi_%28cropped%29.jpg/500px-Mohammad_Reza_Pahlavi_%28cropped%29.jpg",
  
  // عکس رهبران جمهوری اسلامی
  khomeini: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Khomeini_in_Exile_%28cropped%29.jpg/500px-Khomeini_in_Exile_%28cropped%29.jpg",
  khamenei: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Ali_Khamenei_%28cropped%29.jpg/500px-Ali_Khamenei_%28cropped%29.jpg"
};

// ساختار درختی رهبران
const categories = {
  ancient: {
    name: "🏛️ پادشاهان باستان (هخامنشیان و ساسانیان)",
    image: images.category_ancient,
    leaders: {
      cyrus: { name: "کوروش بزرگ (هخامنشی)", image: images.cyrus, description: "بنیانگذار امپراتوری هخامنشی، فاتح بابل، صادرکننده منشور حقوق بشر" },
      darius: { name: "داریوش بزرگ (هخامنشی)", image: images.darius, description: "سازنده تخت جمشید، سازماندهی اقتصادی و اداری ایران" },
      anushirvan: { name: "انوشیروان دادگر (ساسانی)", image: images.anushirvan, description: "مظهر عدالت، حامی علم و فلسفه، جنگ با رومیان" }
    }
  },
  islamic: {
    name: "⚔️ پادشاهان اسلامی (صفویان، افشاریه، زندیه)",
    image: images.category_islamic,
    leaders: {
      shahabbas: { name: "شاه عباس کبیر (صفوی)", image: images.shahabbas, description: "پایتخت را به اصفهان آورد، ارتش مدرن ساخت، شکوفایی هنر و تجارت" },
      nader: { name: "نادرشاه افشار", image: images.nader, description: "فتح هندوستان، احیای مرزهای ایران، شکست عثمانی و روسیه" },
      karim: { name: "کریم‌خان زند", image: images.karim, description: "لقب وکیل‌الرعایا، دوران آرامش و رفاه، پایتخت شیراز" }
    }
  },
  modern: {
    name: "🏭 پادشاهان معاصر (قاجار، پهلوی)",
    image: images.category_modern,
    leaders: {
      aghamohammad: { name: "آقا محمدخان قاجار", image: images.aghamohammad, description: "بنیانگذار سلسله قاجار، اتحاد مجدد ایران" },
      rezashah: { name: "رضاشاه پهلوی", image: images.rezashah, description: "بنیانگذار ارتش مدرن، کشف حجاب، راه‌سازی و صنعتی‌سازی" },
      mohammadreza: { name: "محمدرضا پهلوی", image: images.mohammadreza, description: "اصلاحات انقلاب سفید، توسعه اقتصادی، روابط نزدیک با غرب" }
    }
  },
  islamicRepublic: {
    name: "🕌 رهبران جمهوری اسلامی",
    image: images.category_republic,
    leaders: {
      khomeini: { name: "امام خمینی (ره)", image: images.khomeini, description: "رهبر انقلاب اسلامی، بنیانگذار نظام جمهوری اسلامی" },
      khamenei: { name: "آیت‌الله خامنه‌ای (ره)", image: images.khamenei, description: "مجتهد و رهبر کنونی ایران، مدیریت جنگ تحمیلی و تحریم‌ها" }
    }
  }
};

const userStates = new Map();

// منوی اصلی با عکس
async function showMainMenu(ctx) {
  const keyboard = new InlineKeyboard()
    .text("🏛️ پادشاهان باستان", "cat_ancient")
    .text("⚔️ پادشاهان اسلامی", "cat_islamic")
    .row()
    .text("🏭 پادشاهان معاصر", "cat_modern")
    .text("🕌 رهبران جمهوری اسلامی", "cat_islamicRepublic");

  const caption = "🏛️ **بازی بقای باستانی**\n\nبه جمع پادشاهان و رهبران تاریخ ایران خوش آمدی.\n\n📜 یک دسته رو انتخاب کن:";
  
  await ctx.replyWithPhoto(images.category_ancient, {
    caption: caption,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

// نمایش دسته بندی با عکس
async function showCategory(ctx, categoryId) {
  const category = categories[categoryId];
  if (!category) return;
  
  const keyboard = new InlineKeyboard();
  const leaders = Object.entries(category.leaders);
  
  for (let i = 0; i < leaders.length; i++) {
    const [key, value] = leaders[i];
    keyboard.text(value.name, `temp_${categoryId}_${key}`);
    if ((i + 1) % 2 === 0 && i + 1 < leaders.length) keyboard.row();
  }
  keyboard.row().text("🔙 بازگشت به منوی اصلی", "back_main");
  
  const caption = `📜 **${category.name}**\n\n✨ یکی از پادشاهان یا رهبران زیر رو انتخاب کن:`;
  
  await ctx.replyWithPhoto(category.image, {
    caption: caption,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

// نمایش مشخصات یک رهبر خاص (قبل از انتخاب نهایی)
async function showLeaderDetail(ctx, categoryId, leaderKey) {
  const category = categories[categoryId];
  const leader = category.leaders[leaderKey];
  
  const keyboard = new InlineKeyboard()
    .text("✅ انتخاب این رهبر", `select_${categoryId}_${leaderKey}`)
    .text("🔙 بازگشت", `back_cat_${categoryId}`);
  
  const caption = `👑 **${leader.name}**\n\n📖 **معرفی:**\n${leader.description}\n\n❓ آیا می‌خواهی این رهبر رو انتخاب کنی؟`;
  
  await ctx.replyWithPhoto(leader.image, {
    caption: caption,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

// استارت بازی
bot.command("start", async (ctx) => {
  userStates.delete(ctx.from.id);
  await showMainMenu(ctx);
});

// مدیریت کلیک روی دکمه‌ها
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  
  try {
    await ctx.answerCallbackQuery(); // بستن نوتیف اولیه
    
    // انتخاب دسته بندی
    if (data.startsWith("cat_")) {
      const categoryId = data.replace("cat_", "");
      await showCategory(ctx, categoryId);
    }
    
    // انتخاب موقت رهبر (برای نمایش جزئیات)
    else if (data.startsWith("temp_")) {
      const parts = data.split("_");
      const categoryId = parts[1];
      const leaderKey = parts[2];
      await showLeaderDetail(ctx, categoryId, leaderKey);
    }
    
    // تایید نهایی انتخاب رهبر
    else if (data.startsWith("select_")) {
      const parts = data.split("_");
      const categoryId = parts[1];
      const leaderKey = parts[2];
      const category = categories[categoryId];
      const leader = category.leaders[leaderKey];
      
      userStates.set(userId, { category: categoryId, leader: leaderKey });
      
      await ctx.reply(
        `✅ **${leader.name}** با موفقیت انتخاب شد.\n\n` +
        `🔧 مرحله اول بازی به زودی اضافه می‌شه...\n\n` +
        `🔄 برای شروع مجدد، /start رو بزن.`,
        { parse_mode: "Markdown" }
      );
      
      console.log(`🎮 ${ctx.from.first_name} => ${category.name} => ${leader.name}`);
    }
    
    // بازگشت به دسته بندی از صفحه جزئیات
    else if (data.startsWith("back_cat_")) {
      const categoryId = data.replace("back_cat_", "");
      await showCategory(ctx, categoryId);
    }
    
    // بازگشت به منوی اصلی
    else if (data === "back_main") {
      await showMainMenu(ctx);
    }
    
  } catch (error) {
    console.error("خطا:", error);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره /start رو بزن.");
  }
});

// دستورات کمکی
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
  userStates.delete(ctx.from.id);
  await showMainMenu(ctx);
});

// استارت ربات
bot.start();
console.log("🚀 ربات بقای باستانی (نسخه کامل با عکس) روشن شد...");