// ==================== سلاح‌های مخصوص هر دوره ====================

const weaponsByEra = {
  ancient: {
    name: "🏛️ سلاح‌های دوره باستان",
    items: [
      { id: "sword", name: "شمشیر مفرغی", price: 100, power: 5, desc: "سلاح استاندارد سرباز هخامنشی" },
      { id: "bow", name: "تیر و کمان", price: 150, power: 8, desc: "کمانداران پارسی" },
      { id: "spear", name: "نیزه بلند", price: 200, power: 12, desc: "نیزه‌داران جاودان" },
      { id: "chariot", name: "ارابه جنگی", price: 400, power: 25, desc: "نیروی ویژه هخامنشی" },
      { id: "elephant", name: "فیل جنگی", price: 600, power: 35, desc: "زره‌پوش ساسانی" }
    ]
  },
  islamic: {
    name: "⚔️ سلاح‌های دوره اسلامی",
    items: [
      { id: "damascus", name: "شمشیر دمشقی", price: 250, power: 15, desc: "فولاد معروف، ساخت اصفهان" },
      { id: "armor", name: "زره زنجیری", price: 350, power: 12, desc: "محافظ سواره نظام صفوی" },
      { id: "musket", name: "تفنگ فتیله‌ای", price: 500, power: 25, desc: "ارتش شاه عباس - قورچی‌ها" },
      { id: "cannon", name: "توپ‌خانه", price: 800, power: 40, desc: "شکستن استحکامات عثمانی" },
      { id: "nader_gun", name: "تفنگ نادری", price: 1200, power: 60, desc: "ارتش نادرشاه - فتح هند" }
    ]
  },
  modern: {
    name: "🏭 سلاح‌های دوره معاصر (رضاشاه)",
    items: [
      { id: "bruno", name: "تفنگ برنو", price: 400, power: 20, desc: "تفنگ اصلی ارتش رضاشاه" },
      { id: "maxim", name: "مسلسل ماکسیم", price: 700, power: 35, desc: "ساخت کارخانه مسلسل‌سازی تهران" },
      { id: "cannon75", name: "توپ ۷۵ میلی‌متری", price: 1500, power: 60, desc: "خرید از چکسلواکی" },
      { id: "fighter", name: "جنگنده هواپیمایی", price: 2500, power: 90, desc: "خرید از آلمان" }
    ]
  },
  khomeini: {
    name: "🕌 سلاح‌های دوره دفاع مقدس (امام خمینی)",
    items: [
      { id: "rpg", name: "آرپی‌جی ۷", price: 500, power: 30, desc: "ضد زره، جنگ ایران و عراق" },
      { id: "mortar", name: "خمپاره ۶۰ مم", price: 800, power: 45, desc: "پشتیبانی آتش" },
      { id: "collage", name: "کلاژ (موشک‌انداز دوش‌پرتاب)", price: 1200, power: 60, desc: "موشک‌های ساخت سپاه" },
      { id: "t72", name: "تانک T-72", price: 3000, power: 100, desc: "غنیمتی از عراق" },
      { id: "phantom", name: "جنگنده اف-۴ فانتوم", price: 4000, power: 130, desc: "باقی‌مانده از قبل انقلاب" }
    ]
  },
  khamenei: {
    name: "🕌 سلاح‌های دوره پیشرفته (آیت‌الله خامنه‌ای)",
    items: [
      { id: "shahab1", name: "موشک شهاب ۱", price: 2000, power: 80, desc: "موشک کوتاه برد، ساخت داخل" },
      { id: "mohajer", name: "پهباد مهاجر", price: 3500, power: 120, desc: "پهپاد تهاجمی ساخت ایران" },
      { id: "bavar", name: "سامانه پدافندی باور ۳۷۳", price: 5000, power: 180, desc: "پدافند هوایی ایرانی" },
      { id: "shahab3", name: "موشک شهاب ۳", price: 4000, power: 150, desc: "موشک بالستیک میان‌برد" },
      { id: "khorramshahr", name: "موشک خرمشهر", price: 6000, power: 200, desc: "موشک قاره‌پیما" }
    ]
  }
};

// تعیین دوره بر اساس رهبر انتخاب شده
function getEraByLeader(leaderId) {
  const ancient = ["cyrus", "darius", "anushirvan"];
  const islamic = ["shahabbas", "nader", "karim"];
  const modern = ["rezashah"];
  const khomeiniLeaders = ["khomeini"];
  const khameneiLeaders = ["khamenei"];
  const mohammadreza = ["mohammadreza"];
  
  if (ancient.includes(leaderId)) return "ancient";
  if (islamic.includes(leaderId)) return "islamic";
  if (modern.includes(leaderId)) return "modern";
  if (khomeiniLeaders.includes(leaderId)) return "khomeini";
  if (khameneiLeaders.includes(leaderId)) return "khamenei";
  if (mohammadreza.includes(leaderId)) return "modern"; // محمدرضا همون دوره معاصر
  return "ancient";
}

// دیتابیس کاربران
const usersDB = new Map();

// ==================== نمایش فروشگاه ====================

async function showShop(ctx, userId) {
  const user = usersDB.get(userId);
  if (!user || !user.leader) {
    await ctx.reply("❌ ابتدا یک رهبر انتخاب کن. با /start شروع کن.");
    return;
  }
  
  const era = getEraByLeader(user.leader);
  const weapons = weaponsByEra[era];
  const playerWeapon = user.weapon || { name: "بدون سلاح", power: 0 };
  
  const keyboard = new InlineKeyboard();
  weapons.items.forEach(item => {
    keyboard.text(`${item.name} - ${item.price}💰`, `buy_${item.id}_${era}`);
  });
  keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
  keyboard.row().text("⚔️ جنگ", "battle_menu");
  
  await ctx.reply(
    `🛒 **${weapons.name}**\n\n` +
    `👤 رهبر فعلی: ${user.leaderName}\n` +
    `⚔️ سلاح فعلی: ${playerWeapon.name} (قدرت ${playerWeapon.power})\n` +
    `💰 سکه موجود: ${user.gold}\n` +
    `🏆 سطح نظامی: ${user.military}\n\n` +
    `**قابل خرید:**\n` +
    weapons.items.map(item => `• ${item.name} - ${item.price}💰 (قدرت +${item.power})\n   ${item.desc}`).join("\n"),
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}

// ==================== خرید سلاح ====================

async function buyWeapon(ctx, itemId, era) {
  const userId = ctx.from.id;
  const user = usersDB.get(userId);
  if (!user) return;
  
  const weapons = weaponsByEra[era];
  const item = weapons.items.find(i => i.id === itemId);
  if (!item) return;
  
  if (user.gold >= item.price) {
    user.gold -= item.price;
    user.weapon = { id: item.id, name: item.name, power: item.power };
    user.military += item.power;
    usersDB.set(userId, user);
    
    await ctx.reply(
      `✅ **${item.name}** خریداری شد!\n\n` +
      `⚔️ قدرت نظامی: +${item.power}\n` +
      `💰 باقی‌مانده: ${user.gold}\n` +
      `🏆 مجموع قدرت نظامی: ${user.military}`,
      { parse_mode: "Markdown" }
    );
    
    // نمایش مجدد فروشگاه
    await showShop(ctx, userId);
  } else {
    await ctx.reply(
      `❌ سکه کافی نیست!\n` +
      `نیاز به ${item.price - user.gold} سکه بیشتر داری.\n\n` +
      `💰 سکه فعلی: ${user.gold}`,
      { parse_mode: "Markdown" }
    );
  }
}

// ==================== سیستم جنگ ====================

async function startBattle(ctx) {
  const userId = ctx.from.id;
  const user = usersDB.get(userId);
  if (!user) {
    await ctx.reply("❌ ابتدا یک رهبر انتخاب کن.");
    return;
  }
  
  // دشمن تصادفی بر اساس دوره
  const enemies = {
    ancient: ["امپراتوری بابل", "شورشیان داخلی", "سکاها", "مصریان"],
    islamic: ["عثمانی", "ازبک‌ها", "پرتُغالی‌ها", "گورکانیان هند"],
    modern: ["شورشیان عشایر", "نیروهای جدایی‌طلب"],
    khomeini: ["ارتش عراق", "منافقین", "گروهک‌های ضدانقلاب"],
    khamenei: ["گروهک‌های تروریستی", "تحریم‌های اقتصادی", "جنگ نیابتی"]
  };
  
  const era = getEraByLeader(user.leader);
  const enemyList = enemies[era];
  const enemy = enemyList[Math.floor(Math.random() * enemyList.length)];
  const enemyPower = Math.floor(Math.random() * 100) + 30;
  
  // محاسبه نتیجه جنگ
  const playerPower = user.military + (user.weapon?.power || 0);
  const randomFactor = Math.floor(Math.random() * 40) - 15; // -15 تا +25
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
    reward = { gold: -100, exp: 5, military: -10 };
    message = "💔 **شکست خوردی!**\nارتش دشمن قوی‌تر بود.";
  }
  
  // اعمال پاداش/جریمه
  user.gold = Math.max(0, user.gold + reward.gold);
  user.exp += reward.exp;
  user.military = Math.max(0, user.military + reward.military);
  usersDB.set(userId, user);
  
  await ctx.reply(
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
    `🏆 قدرت نظامی: ${user.military}`,
    { parse_mode: "Markdown" }
  );
}

// ==================== اصلاح بخش انتخاب رهبر (اضافه کردن اطلاعات کاربر) ====================

// در قسمت select_leader، به جای کد قبلی، این رو بذار:
else if (data.startsWith("select_")) {
  const parts = data.split("_");
  const categoryId = parts[1];
  const leaderKey = parts[2];
  const cat = categories[categoryId];
  const leader = cat.leaders[leaderKey];
  
  // ذخیره اطلاعات کاربر
  usersDB.set(ctx.from.id, {
    leader: leaderKey,
    leaderName: leader.name,
    era: categoryId,
    gold: 500,
    exp: 0,
    military: 50,
    weapon: null,
    completedMissions: []
  });
  
  await ctx.editMessageReplyMarkup({ reply_markup: undefined });
  
  const keyboard = new InlineKeyboard()
    .text("🛒 فروشگاه سلاح", "open_shop")
    .text("⚔️ جنگ", "battle_menu");
  
  await ctx.replyWithPhoto(leader.image, {
    caption: `✅ **${leader.name}** با موفقیت انتخاب شد.\n\n` +
      `📖 **معرفی:** ${leader.desc}\n\n` +
      `💰 سکه شروع: ۵۰۰\n` +
      `🏆 قدرت نظامی پایه: ۵۰\n\n` +
      `🛒 از فروشگاه سلاح بخر و وارد جنگ شو!`,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
  
  console.log(`🎮 ${ctx.from.first_name} => ${cat.name} => ${leader.name}`);
}

// ==================== مدیریت دکمه‌های جدید ====================

else if (data === "open_shop") {
  await showShop(ctx, ctx.from.id);
}
else if (data === "battle_menu") {
  await startBattle(ctx);
}
else if (data === "back_to_game") {
  const user = usersDB.get(ctx.from.id);
  const keyboard = new InlineKeyboard()
    .text("🛒 فروشگاه سلاح", "open_shop")
    .text("⚔️ جنگ", "battle_menu");
  
  await ctx.reply(
    `🏛️ **بازی بقای باستانی**\n\n` +
    `👤 رهبر: ${user.leaderName}\n` +
    `💰 سکه: ${user.gold}\n` +
    `⚔️ قدرت نظامی: ${user.military}\n` +
    `🗡️ سلاح: ${user.weapon?.name || "بدون سلاح"}\n\n` +
    `یکی از گزینه‌های زیر رو انتخاب کن:`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}
else if (data.startsWith("buy_")) {
  const parts = data.split("_");
  const itemId = parts[1];
  const era = parts[2];
  await buyWeapon(ctx, itemId, era);
}