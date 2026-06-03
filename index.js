const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// ==================== دیتابیس کاربران ====================
const usersDB = new Map();

// ==================== عکس‌های رهبران ====================
const leaders = {
  // دوره باستان
  cyrus: { name: "کوروش بزرگ", desc: "بنیانگذار هخامنشی، منشور حقوق بشر", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDexqIC3VJle3eBKrpyP2iPCb2nSHdgAC8g5rG4APAVFruE7qyqYySgEAAwIAA3kAAzsE" },
  darius: { name: "داریوش بزرگ", desc: "سازنده تخت جمشید، سازماندهی اداری", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDgRqIC6pWLzAhSz62YlMEYu1BBJXcAAC9Q5rG4APAVFi2sJMMLDVlwEAAwIAA3kAAzsE" },
  anushirvan: { name: "انوشیروان", desc: "دادگر ساسانی، حامی علم و فلسفه", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDgxqIC84TrWNGA0_YAj8HnqqpititgAC9g5rG4APAVHJULBSG_V9cgEAAwIAA3kAAzsE" },
  // دوره اسلامی
  shahabbas: { name: "شاه عباس کبیر", desc: "صفوی، اصفهان نصف جهان", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  nader: { name: "نادرشاه افشار", desc: "فاتح هند، احیای مرزهای ایران", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDhJqIC_JqhOlWXWY5bNFKEYODsErLgAC-A5rG4APAVFDa5CLbAKRpgEAAwIAA3kAAzsE" },
  karim: { name: "کریم‌خان زند", desc: "وکیل‌الرعایا، دوران آرامش", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  // دوره معاصر
  rezashah: { name: "رضاشاه پهلوی", desc: "بنیانگذار ارتش مدرن، راه‌سازی", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE", era: "modern", battleImage: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  mohammadreza: { name: "محمدرضا پهلوی", desc: "انقلاب سفید، توسعه اقتصادی", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE", era: "modern", battleImage: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  // دوره جمهوری اسلامی
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب اسلامی، دفاع مقدس", image: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE", era: "khomeini", battleImage: "AgACAgQAAxkBAAEqDiZqIDCc9bGzQWtIa_nd9kU4bYlLZAAC_g5rG4APAVFhExSQa7SOBAEAAwIAA3kAAzsE" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر کنونی ایران", image: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ", era: "khamenei", battleImage: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA" }
};

// ==================== عکس‌های دسته‌بندی ====================
const categoryImages = {
  ancient: "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE",
  islamic: "AgACAgQAAxkBAAEqDUdqICQc6ZB0uinHD6hZ7wcT3u86oQAC4A5rG4APAVFQEaC3exIhHQEAAwIAA3kAAzsE",
  modern: "AgACAgQAAxkBAAEqDW1qICTZj5vvNZdj8IfXm08Go-EoHAAC4w5rG4APAVF78qoubkaQrgEAAwIAA3kAAzsE",
  republic: "AgACAgQAAxkBAAEqDXxqICU_YmcR261F414EcCku6vMMCAAC5A5rG4APAVEmgDq8PfldMwEAAwIAA3gAAzsE"
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
  islamic: [
    { id: "damascus", name: "شمشیر دمشقی", price: 250, power: 15, desc: "فولاد معروف، ساخت اصفهان" },
    { id: "armor", name: "زره زنجیری", price: 350, power: 12, desc: "محافظ سواره نظام صفوی" },
    { id: "musket", name: "تفنگ فتیله‌ای", price: 500, power: 25, desc: "ارتش شاه عباس - قورچی‌ها" },
    { id: "cannon", name: "توپ‌خانه", price: 800, power: 40, desc: "شکستن استحکامات عثمانی" },
    { id: "nader_gun", name: "تفنگ نادری", price: 1200, power: 60, desc: "ارتش نادرشاه - فتح هند" }
  ],
  modern: [
    { id: "bruno", name: "تفنگ برنو", price: 400, power: 20, desc: "تفنگ اصلی ارتش رضاشاه" },
    { id: "maxim", name: "مسلسل ماکسیم", price: 700, power: 35, desc: "ساخت کارخانه مسلسل‌سازی تهران" },
    { id: "cannon75", name: "توپ ۷۵ میلی‌متری", price: 1500, power: 60, desc: "خرید از چکسلواکی" },
    { id: "fighter", name: "جنگنده هواپیمایی", price: 2500, power: 90, desc: "خرید از آلمان" }
  ],
  khomeini: [
    { id: "rpg", name: "آرپی‌جی ۷", price: 500, power: 30, desc: "ضد زره، جنگ ایران و عراق" },
    { id: "mortar", name: "خمپاره ۶۰ مم", price: 800, power: 45, desc: "پشتیبانی آتش" },
    { id: "collage", name: "کلاژ", price: 1200, power: 60, desc: "موشک‌انداز دوش‌پرتاب ساخت سپاه" },
    { id: "t72", name: "تانک T-72", price: 3000, power: 100, desc: "غنیمتی از عراق" },
    { id: "phantom", name: "جنگنده اف-۴ فانتوم", price: 4000, power: 130, desc: "باقی‌مانده از قبل انقلاب" }
  ],
  khamenei: [
    { id: "shahab1", name: "موشک شهاب ۱", price: 2000, power: 80, desc: "موشک کوتاه برد، ساخت داخل" },
    { id: "mohajer", name: "پهباد مهاجر", price: 3500, power: 120, desc: "پهپاد تهاجمی ساخت ایران" },
    { id: "bavar", name: "سامانه باور ۳۷۳", price: 5000, power: 180, desc: "پدافند هوایی ایرانی" },
    { id: "shahab3", name: "موشک شهاب ۳", price: 4000, power: 150, desc: "موشک بالستیک میان‌برد" },
    { id: "khorramshahr", name: "موشک خرمشهر", price: 6000, power: 200, desc: "موشک قاره‌پیما" }
  ]
};

// ==================== دشمنان هر دوره ====================
const enemiesByEra = {
  ancient: ["امپراتوری بابل", "شورشیان داخلی", "سکاها", "مصریان", "یونانیان"],
  islamic: ["عثمانی", "ازبک‌ها", "پرتُغالی‌ها", "گورکانیان هند", "افغان‌ها"],
  modern: ["شورشیان عشایر", "نیروهای جدایی‌طلب", "ارتش متجاوز خارجی"],
  khomeini: ["ارتش بعث عراق", "منافقین", "گروهک‌های ضدانقلاب", "نیروهای متجاوز"],
  khamenei: ["گروهک‌های تروریستی", "جنگ نیابتی", "تحریم‌های اقتصادی"]
};

// ==================== نام دوره‌ها ====================
const eraNames = {
  ancient: "باستان",
  islamic: "اسلامی",
  modern: "معاصر",
  khomeini: "دفاع مقدس",
  khamenei: "موشکی و پهبادی"
};

// ==================== گیف‌های متحرک ====================
const animations = {
  readyToFight: "CgACAgQAAxkBAAEqETVqIGusPLj-Qq0nd73vMUkiRiwY0wACTwYAArMmNVBb8-ES6JPGHzsE",
  cyrusAnimation: "CgACAgQAAxkBAAEqEUpqIG2RakeSSSNpKkC-3UfiGpoEYwACGQMAAt5HJVNbjZO7dqLofTsE",
  missileAnimation: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA"
};

// ==================== منوی اصلی ====================
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ پادشاهان باستان", "cat_ancient")
    .text("⚔️ پادشاهان اسلامی", "cat_islamic")
    .row()
    .text("🏭 پادشاهان معاصر", "cat_modern")
    .text("🕌 رهبران جمهوری اسلامی", "cat_republic");

  await ctx.replyWithPhoto(categoryImages.ancient, {
    caption: "🏛️ **بازی بقای باستانی**\n\nبه جمع پادشاهان و رهبران تاریخ ایران خوش آمدی.\n\n📜 یک دسته رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== نمایش رهبران دسته ====================
async function showCategory(ctx, categoryId) {
  let leadersList = [];
  let title = "";
  let image = "";

  if (categoryId === "ancient") {
    leadersList = ["cyrus", "darius", "anushirvan"];
    title = "🏛️ پادشاهان باستان";
    image = categoryImages.ancient;
  } else if (categoryId === "islamic") {
    leadersList = ["shahabbas", "nader", "karim"];
    title = "⚔️ پادشاهان اسلامی";
    image = categoryImages.islamic;
  } else if (categoryId === "modern") {
    leadersList = ["rezashah", "mohammadreza"];
    title = "🏭 پادشاهان معاصر";
    image = categoryImages.modern;
  } else if (categoryId === "republic") {
    leadersList = ["khomeini", "khamenei"];
    title = "🕌 رهبران جمهوری اسلامی";
    image = categoryImages.republic;
  }

  const keyboard = new InlineKeyboard();
  for (const key of leadersList) {
    keyboard.text(leaders[key].name, `temp_${key}`);
  }
  keyboard.row().text("🔙 بازگشت به منوی اصلی", "back_main");

  const caption = `📜 **${title}**\n\n✨ یکی از پادشاهان یا رهبران زیر رو انتخاب کن:\n\n` +
    leadersList.map(k => `• **${leaders[k].name}**\n   ${leaders[k].desc}`).join("\n");

  await ctx.editMessageMedia({
    type: "photo",
    media: image,
    caption: caption,
    parse_mode: "Markdown"
  }, { reply_markup: keyboard });
}

// ==================== نمایش جزئیات رهبر ====================
async function showLeaderDetail(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  let backCategory = leader.era;
  if (backCategory === "khomeini" || backCategory === "khamenei") backCategory = "republic";

  const keyboard = new InlineKeyboard()
    .text("✅ انتخاب این رهبر", `select_${leaderKey}`)
    .text("🔙 بازگشت", `back_cat_${backCategory}`);

  await ctx.editMessageMedia({
    type: "photo",
    media: leader.image,
    caption: `👑 **${leader.name}**\n\n📖 **معرفی:**\n${leader.desc}\n\n❓ آیا می‌خواهی این رهبر رو انتخاب کنی؟`,
    parse_mode: "Markdown"
  }, { reply_markup: keyboard });
}

// ==================== نمایش منوی بازی ====================
async function showGameMenu(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  const user = usersDB.get(ctx.from.id);

  const keyboard = new InlineKeyboard()
    .text("🛒 فروشگاه سلاح", "open_shop")
    .text("⚔️ جنگ", "battle")
    .row()
    .text("📊 وضعیت من", "my_status")
    .text("🔄 تغییر رهبر", "change_leader");

  await ctx.replyWithPhoto(leader.image, {
    caption: `✅ **${leader.name}** انتخاب شد!\n\n` +
      `📜 دوره: ${eraNames[leader.era]}\n` +
      `💰 سکه: ${user.gold}\n` +
      `⚔️ قدرت نظامی: ${user.military}\n` +
      `🗡️ سلاح فعلی: ${user.weapon?.name || "بدون سلاح"}\n\n` +
      `🛒 از فروشگاه سلاح بخر و وارد جنگ شو!`,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

// ==================== نمایش فروشگاه ====================
async function showShop(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;

  const weapons = weaponsByEra[user.era];
  const keyboard = new InlineKeyboard();
  
  for (const item of weapons) {
    const owned = user.weapon?.id === item.id;
    keyboard.text(`${item.name} - ${item.price}💰 ${owned ? "✅" : ""}`, `buy_${item.id}`);
  }
  keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");

  await ctx.reply(
    `🛒 **فروشگاه دوره ${eraNames[user.era]}**\n\n` +
    `💰 سکه: ${user.gold}\n` +
    `⚔️ قدرت نظامی: ${user.military}\n` +
    `🗡️ سلاح فعلی: ${user.weapon?.name || "ندارد"}\n\n` +
    `**قابل خرید:**\n` +
    weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})\n   ${w.desc}`).join("\n"),
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}

// ==================== سیستم جنگ ====================
async function startBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;

  const leader = leaders[user.leader];
  const enemyList = enemiesByEra[user.era];
  const enemy = enemyList[Math.floor(Math.random() * enemyList.length)];
  const enemyPower = Math.floor(Math.random() * 80) + 30;
  const playerPower = user.military + (user.weapon?.power || 0);
  const randomFactor = Math.floor(Math.random() * 40) - 15;
  const finalPower = playerPower + randomFactor;

  let result, message, reward;

  if (finalPower > enemyPower + 20) {
    result = "victory";
    reward = { gold: 300, exp: 50, military: 10 };
    message = "🎉 **پیروزی قاطع!**\nارتش تو دشمن رو درهم شکست.";
  } else if (finalPower > enemyPower - 10) {
    result = "stalemate";
    reward = { gold: 100, exp: 20, military: 0 };
    message = "🤝 **آتش‌بس!**\nنتیجه جنگ مساوی شد.";
  } else {
    result = "defeat";
    reward = { gold: 50, exp: 10, military: -5 };
    message = "💔 **شکست خوردی!**\nارتش دشمن قوی‌تر بود.";
  }

  user.gold = Math.max(0, user.gold + reward.gold);
  user.exp += reward.exp;
  user.military = Math.max(0, user.military + reward.military);
  usersDB.set(ctx.from.id, user);

  const battleCaption = 
    `⚔️ **نبرد با ${enemy}**\n\n` +
    `${message}\n\n` +
    `📊 **آمار نبرد:**\n` +
    `• قدرت تو: ${playerPower}\n` +
    `• قدرت دشمن: ${enemyPower}\n` +
    `• شانس تصادفی: ${randomFactor > 0 ? `+${randomFactor}` : randomFactor}\n\n` +
    `🎁 **نتیجه:**\n` +
    `• سکه: ${reward.gold > 0 ? `+${reward.gold}` : reward.gold}\n` +
    `• تجربه: +${reward.exp}\n` +
    `• قدرت نظامی: ${reward.military > 0 ? `+${reward.military}` : reward.military}\n\n` +
    `💰 سکه فعلی: ${user.gold}\n` +
    `⚔️ قدرت نظامی: ${user.military}`;

  // نمایش انیمیشن جنگ
  await ctx.replyWithAnimation(animations.readyToFight, { caption: battleCaption, parse_mode: "Markdown" });

  const keyboard = new InlineKeyboard()
    .text("🛒 فروشگاه", "open_shop")
    .text("⚔️ جنگ دوباره", "battle")
    .row()
    .text("🔙 منوی اصلی", "back_to_game");

  await ctx.reply("⚔️ **اداره جنگ:**\nچه کاری می‌خوای انجام بدی؟", { parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== وضعیت کاربر ====================
async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;

  const leader = leaders[user.leader];
  const level = Math.floor(user.exp / 100) + 1;
  const nextExp = level * 100 - user.exp;

  await ctx.replyWithPhoto(leader.image, {
    caption: `📊 **وضعیت ${leader.name}**\n\n` +
      `📜 دوره: ${eraNames[user.era]}\n` +
      `💰 سکه: ${user.gold}\n` +
      `⭐ سطح: ${level}\n` +
      `📈 تجربه: ${user.exp}/${level * 100} (${nextExp} تا سطح بعد)\n` +
      `⚔️ قدرت نظامی: ${user.military}\n` +
      `🗡️ سلاح: ${user.weapon?.name || "بدون سلاح"} ${user.weapon ? `(قدرت +${user.weapon.power})` : ""}\n` +
      `🏆 کل پیروزی‌ها: ${Math.floor(user.exp / 50)}`,
    parse_mode: "Markdown"
  });
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
      const leaderKey = data.replace("temp_", "");
      await showLeaderDetail(ctx, leaderKey);
    }
    else if (data.startsWith("select_")) {
      const leaderKey = data.replace("select_", "");
      const leader = leaders[leaderKey];

      usersDB.set(ctx.from.id, {
        leader: leaderKey,
        leaderName: leader.name,
        era: leader.era,
        gold: 500,
        exp: 0,
        military: 50,
        weapon: null
      });

      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await showGameMenu(ctx, leaderKey);
    }
    else if (data.startsWith("back_cat_")) {
      let categoryId = data.replace("back_cat_", "");
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
        media: categoryImages.ancient,
        caption: "🏛️ **بازی بقای باستانی**\n\n📜 یک دسته رو انتخاب کن:",
        parse_mode: "Markdown"
      }, { reply_markup: keyboard });
    }
    else if (data === "open_shop") {
      await showShop(ctx);
    }
    else if (data === "battle") {
      await startBattle(ctx);
    }
    else if (data === "my_status") {
      await showStatus(ctx);
    }
    else if (data === "change_leader") {
      const keyboard = new InlineKeyboard()
        .text("🏛️ پادشاهان باستان", "cat_ancient")
        .text("⚔️ پادشاهان اسلامی", "cat_islamic")
        .row()
        .text("🏭 پادشاهان معاصر", "cat_modern")
        .text("🕌 رهبران جمهوری اسلامی", "cat_republic");

      await ctx.reply("🔄 **تغییر رهبر**\n\nدسته جدید رو انتخاب کن:", {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    else if (data === "back_to_game") {
      const user = usersDB.get(ctx.from.id);
      if (user) {
        await showGameMenu(ctx, user.leader);
      } else {
        await ctx.reply("❌ خطا! لطفاً /start رو بزن.");
      }
    }
    else if (data.startsWith("buy_")) {
      const itemId = data.replace("buy_", "");
      const user = usersDB.get(ctx.from.id);
      if (!user) return;

      const weapons = weaponsByEra[user.era];
      const item = weapons.find(w => w.id === itemId);
      if (!item) return;

      if (user.gold >= item.price) {
        user.gold -= item.price;
        if (user.weapon) {
          user.military -= user.weapon.power;
        }
        user.weapon = item;
        user.military += item.power;
        usersDB.set(ctx.from.id, user);
        
        await ctx.replyWithAnimation(animations.cyrusAnimation, {
          caption: `✅ **${item.name}** خریداری شد!\n💰 باقی‌مانده: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}`,
          parse_mode: "Markdown"
        });
        await showShop(ctx);
      } else {
        await ctx.reply(`❌ سکه کافی نیست! نیاز به ${item.price - user.gold} سکه بیشتر داری.`);
      }
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
    "📌 **امکانات بازی:**\n" +
    "• انتخاب بین ۱۰ رهبر تاریخی\n" +
    "• خرید سلاح متناسب با دوره\n" +
    "• جنگ با دشمنان تاریخی\n" +
    "• کسب سکه و تجربه\n" +
    "• ارتقا سطح و قدرت نظامی\n" +
    "• انیمیشن‌های جذاب برای خرید و جنگ",
    { parse_mode: "Markdown" }
  );
});

bot.command("restart", async (ctx) => {
  usersDB.delete(ctx.from.id);
  const keyboard = new InlineKeyboard()
    .text("🏛️ پادشاهان باستان", "cat_ancient")
    .text("⚔️ پادشاهان اسلامی", "cat_islamic")
    .row()
    .text("🏭 پادشاهان معاصر", "cat_modern")
    .text("🕌 رهبران جمهوری اسلامی", "cat_republic");

  await ctx.replyWithPhoto(categoryImages.ancient, {
    caption: "🏛️ **بازی بقای باستانی**\n\n📜 یک دسته رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== استارت ربات ====================
if (process.env.RAILWAY_ENV === "true" || process.env.PORT) {
  bot.start();
  console.log("🎮 بازی بقای باستانی روی Railway روشن شد...");
} else {
  bot.start();
  console.log("🎮 بازی بقای باستانی روشن شد...");
}