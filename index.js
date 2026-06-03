const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// فقط دوره معاصر - عکس‌هایی که قبلاً گرفتی
const modernLeaders = {
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

// سلاح‌های دوره معاصر
const modernWeapons = [
  { id: "bruno", name: "تفنگ برنو", price: 400, power: 20, desc: "تفنگ اصلی ارتش رضاشاه" },
  { id: "maxim", name: "مسلسل ماکسیم", price: 700, power: 35, desc: "ساخت کارخانه مسلسل‌سازی تهران" },
  { id: "cannon75", name: "توپ ۷۵ میلی‌متری", price: 1500, power: 60, desc: "خرید از چکسلواکی" },
  { id: "fighter", name: "جنگنده هواپیمایی", price: 2500, power: 90, desc: "خرید از آلمان" }
];

const usersDB = new Map();

// منوی اصلی - فقط دو گزینه معاصر
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("👑 رضاشاه پهلوی", "select_rezashah")
    .text("👑 محمدرضا پهلوی", "select_mohammadreza");

  await ctx.replyWithPhoto(modernLeaders.rezashah.image, {
    caption: "🏛️ **بازی بقای باستانی - دوره معاصر**\n\nیک پادشاه رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// انتخاب رهبر
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  if (data === "select_rezashah" || data === "select_mohammadreza") {
    const leaderKey = data.replace("select_", "");
    const leader = modernLeaders[leaderKey];
    
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
  
  else if (data === "open_shop") {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.reply("❌ اول یک رهبر انتخاب کن!");
      return;
    }
    
    const keyboard = new InlineKeyboard();
    modernWeapons.forEach(item => {
      keyboard.text(`${item.name} - ${item.price}💰`, `buy_${item.id}`);
    });
    keyboard.row().text("🔙 بازگشت", "back_to_game");
    
    await ctx.reply(
      `🛒 **فروشگاه دوره معاصر**\n\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح فعلی: ${user.weapon?.name || "ندارد"}\n\n` +
      modernWeapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})`).join("\n"),
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  
  else if (data.startsWith("buy_")) {
    const itemId = data.replace("buy_", "");
    const user = usersDB.get(ctx.from.id);
    const item = modernWeapons.find(w => w.id === itemId);
    
    if (!user || !item) return;
    
    if (user.gold >= item.price) {
      user.gold -= item.price;
      user.weapon = item;
      user.military += item.power;
      usersDB.set(ctx.from.id, user);
      await ctx.reply(`✅ ${item.name} خریداری شد!\n💰 باقی‌مانده: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}`);
    } else {
      await ctx.reply(`❌ سکه کافی نیست! نیاز به ${item.price - user.gold} سکه بیشتر.`);
    }
  }
  
  else if (data === "battle") {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const enemies = ["شورشیان عشایر", "نیروهای جدایی‌طلب", "ارتش متجاوز"];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const enemyPower = Math.floor(Math.random() * 80) + 30;
    const playerPower = user.military + (user.weapon?.power || 0);
    const result = playerPower + (Math.random() * 30 - 10) > enemyPower;
    
    if (result) {
      const reward = 200;
      user.gold += reward;
      usersDB.set(ctx.from.id, user);
      await ctx.reply(`⚔️ **نبرد با ${enemy}**\n🎉 پیروزی!\n💰 +${reward} سکه دریافت کردی.`);
    } else {
      await ctx.reply(`⚔️ **نبرد با ${enemy}**\n💔 شکست خوردی!\nسکه‌ای به دست نیاوردی.`);
    }
  }
  
  else if (data === "back_to_game") {
    const user = usersDB.get(ctx.from.id);
    const keyboard = new InlineKeyboard()
      .text("🛒 فروشگاه سلاح", "open_shop")
      .text("⚔️ جنگ", "battle");
    
    await ctx.reply(
      `🏛️ **دوره معاصر**\n👤 رهبر: ${user.leaderName}\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}`,
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
  }
  
  await ctx.answerCallbackQuery();
});

bot.start();
console.log("🎮 ربات دوره معاصر روشن شد...");