const { Bot, InlineKeyboard, session } = require("grammy");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// ساختار درختی رهبران
const categories = {
  ancient: {
    name: "🏛️ پادشاهان باستان",
    leaders: {
      cyrus: "کوروش بزرگ (هخامنشی)",
      darius: "داریوش بزرگ (هخامنشی)",
      anushirvan: "انوشیروان دادگر (ساسانی)"
    }
  },
  islamic: {
    name: "⚔️ پادشاهان اسلامی",
    leaders: {
      shahabbas: "شاه عباس کبیر (صفوی)",
      nader: "نادرشاه افشار",
      karim: "کریم‌خان زند"
    }
  },
  modern: {
    name: "🏭 پادشاهان معاصر",
    leaders: {
      aghamohammad: "آقا محمدخان قاجار",
      rezashah: "رضاشاه پهلوی",
      mohammadreza: "محمدرضا پهلوی"
    }
  },
  islamicRepublic: {
    name: "🕌 رهبران جمهوری اسلامی",
    leaders: {
      khomeini: "امام خمینی (ره)",
      khamenei: "آیت‌الله خامنه‌ای (ره)"
    }
  }
};

const userStates = new Map(); // ذخیره موقعیت کاربر در منو

// منوی اصلی (دسته‌بندی)
function getMainMenu() {
  const keyboard = new InlineKeyboard()
    .text(categories.ancient.name, "cat_ancient")
    .text(categories.islamic.name, "cat_islamic")
    .row()
    .text(categories.modern.name, "cat_modern")
    .text(categories.islamicRepublic.name, "cat_islamicRepublic")
    .row()
    .text("🔙 بازگشت به منوی اصلی", "back_main");

  return keyboard;
}

// منوی رهبران یک دسته خاص
function getLeadersMenu(categoryId) {
  const category = categories[categoryId];
  if (!category) return getMainMenu();

  const keyboard = new InlineKeyboard();
  const leaders = Object.entries(category.leaders);
  
  for (let i = 0; i < leaders.length; i++) {
    const [key, name] = leaders[i];
    keyboard.text(name, `leader_${categoryId}_${key}`);
    if ((i + 1) % 2 === 0 && i + 1 < leaders.length) keyboard.row();
  }
  
  keyboard.row().text("🔙 بازگشت به دسته‌بندی", `back_${categoryId}`);
  return keyboard;
}

// استارت بازی
bot.command("start", async (ctx) => {
  userStates.delete(ctx.from.id);
  await ctx.reply(
    "🏛️ به بازی «بقای باستانی» خوش آمدی!\n\n" +
    "یک دسته از پادشاهان یا رهبران تاریخ ایران رو انتخاب کن،\n" +
    "بعد از اون، شخص مورد نظرت رو انتخاب کن:\n",
    { reply_markup: getMainMenu() }
  );
});

// مدیریت کلیک روی دکمه‌ها
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  // انتخاب دسته بندی
  if (data.startsWith("cat_")) {
    const categoryId = data.replace("cat_", "");
    const category = categories[categoryId];
    
    if (category) {
      await ctx.editMessageText(
        `📜 دسته: **${category.name}**\n\n` +
        `یکی از پادشاهان یا رهبران زیر رو انتخاب کن:`,
        {
          parse_mode: "Markdown",
          reply_markup: getLeadersMenu(categoryId)
        }
      );
    }
  }
  
  // انتخاب یک رهبر خاص
  else if (data.startsWith("leader_")) {
    const parts = data.split("_");
    const categoryId = parts[1];
    const leaderKey = parts[2];
    const category = categories[categoryId];
    const leaderName = category.leaders[leaderKey];
    
    // ذخیره انتخاب نهایی
    userStates.set(userId, { category: categoryId, leader: leaderKey });
    
    // حذف کیبورد از پیام فعلی
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    
    // تایید نهایی
    await ctx.reply(
      `✅ تو **${leaderName}** رو به عنوان رهبر خود انتخاب کردی.\n\n` +
      `🔧 مرحله اول بازی به زودی میاد...\n` +
      `🔄 برای شروع مجدد، /start رو بزن.`,
      { parse_mode: "Markdown" }
    );
    
    console.log(`👤 ${ctx.from.first_name} => ${category.name} => ${leaderName}`);
  }
  
  // بازگشت به دسته‌بندی از منوی رهبران
  else if (data.startsWith("back_") && data !== "back_main") {
    const categoryId = data.replace("back_", "");
    await ctx.editMessageText(
      "🏛️ یک دسته از رهبران تاریخ ایران رو انتخاب کن:",
      { reply_markup: getMainMenu() }
    );
  }
  
  // بازگشت به منوی اصلی
  else if (data === "back_main") {
    await ctx.editMessageText(
      "🏛️ منوی اصلی - یک دسته رو انتخاب کن:",
      { reply_markup: getMainMenu() }
    );
  }
  
  await ctx.answerCallbackQuery();
});

// دستورات کمکی
bot.command("help", async (ctx) => {
  await ctx.reply(
    "🎮 **راهنمای بازی بقای باستانی**\n\n" +
    "/start - شروع بازی و انتخاب رهبر\n" +
    "/restart - شروع مجدد از اول\n" +
    "/help - همین راهنما\n\n" +
    "📌 اول دسته رو انتخاب کن، بعد پادشاه یا رهبر مورد نظرت رو.",
    { parse_mode: "Markdown" }
  );
});

bot.command("restart", async (ctx) => {
  userStates.delete(ctx.from.id);
  await ctx.reply("🔄 شروع مجدد...", { reply_markup: getMainMenu() });
});

// استارت ربات
bot.start();
console.log("🚀 ربات بقای باستانی (نسخه دسته‌بندی شده) روشن شد...");