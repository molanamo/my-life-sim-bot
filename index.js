const { Bot, InlineKeyboard, session } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(session({
  initial: () => ({ currentMenu: "main", selectedLeader: null, battleCount: 0, lockUntil: null })
}));

const usersDB = new Map();
const ADMINS = [5576592239];

const MAX_BATTLES = 10;
const MIN_LOCK_HOURS = 1;
const MAX_LOCK_HOURS = 3;

function isLocked(userId) {
  const user = usersDB.get(userId);
  if (user && user.lockUntil && Date.now() < user.lockUntil) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return { locked: true, remainingMinutes };
  }
  return { locked: false };
}

function lockUser(userId) {
  const lockHours = MIN_LOCK_HOURS + Math.random() * (MAX_LOCK_HOURS - MIN_LOCK_HOURS);
  const lockUntil = Date.now() + (lockHours * 60 * 60 * 1000);
  const user = usersDB.get(userId);
  if (user) {
    user.lockUntil = lockUntil;
    user.battleCount = 0;
    usersDB.set(userId, user);
  }
  return Math.floor(lockHours);
}

const leaders = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE", era: "ancient" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE", era: "ancient" },
  anushirvan: { name: "انوشیروان", desc: "دادگستر ساسانی", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA", era: "ancient" },
  shahabbas: { name: "شاه عباس", desc: "صفوی", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA", era: "islamic" },
  nader: { name: "نادرشاه", desc: "فاتح هند", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE", era: "islamic" },
  karim: { name: "کریم‌خان", desc: "وکیل‌الرعایا", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA", era: "islamic" },
  rezashah: { name: "رضاشاه", desc: "بنیادگزار ارتش نوین", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE", era: "modern" },
  mohammadreza: { name: "محمدرضا", desc: "پیشاهنگ سپید", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE", era: "modern" },
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب", image: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE", era: "khomeini" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر فرزانه", image: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ", era: "khamenei" }
};

const categoryImages = {
  ancient: "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE",
  islamic: "AgACAgQAAxkBAAEqDUdqICQc6ZB0uinHD6hZ7wcT3u86oQAC4A5rG4APAVFQEaC3exIhHQEAAwIAA3kAAzsE",
  modern: "AgACAgQAAxkBAAEqDW1qICTZj5vvNZdj8IfXm08Go-EoHAAC4w5rG4APAVF78qoubkaQrgEAAwIAA3kAAzsE",
  republic: "AgACAgQAAxkBAAEqDXxqICU_YmcR261F414EcCku6vMMCAAC5A5rG4APAVEmgDq8PfldMwEAAwIAA3gAAzsE"
};

const animations = {
  victory: "CgACAgQAAxkBAAEqEw1qIJDV8z7vf7hG_oP0l4aaTPm7ZQACgCMAAvQVAVEjsoZnsyyDgTsE",
  defeat: "CgACAgQAAxkBAAEqEu1qII15onal3AqvYITzkqdm5MI00gACeyMAAvQVAVF1fh97_aRKYDsE"
};

const weaponsByEra = {
  ancient: [{ id: "sword", name: "⚔️ شمشیر مفرغین", price: 100, power: 5, icon: "⚔️" }],
  islamic: [{ id: "damascus", name: "🗡️ شمشیر دمشقی", price: 250, power: 15, icon: "🗡️" }],
  modern: [{ id: "bruno", name: "🔫 تفنگ برنو", price: 400, power: 20, icon: "🔫" }],
  khomeini: [{ id: "rpg", name: "💥 آرپی‌جی ۷", price: 500, power: 30, icon: "💥" }],
  khamenei: [{ id: "shahab1", name: "🚀 موشک شهاب ۱", price: 2000, power: 80, icon: "🚀" }]
};

const npcList = [
  { name: "سپاه دشمن", power: 50 }, { name: "شورشیان", power: 40 }, { name: "مهاجمان", power: 60 },
  { name: "ارتش متجاوز", power: 55 }, { name: "دشمن کهن", power: 65 }, { name: "غارتگران", power: 45 },
  { name: "صدام", power: 75 }, { name: "آمریکا", power: 85 }, { name: "اسرائیل", power: 80 }
];

function getRandomNPC() { return npcList[Math.floor(Math.random() * npcList.length)]; }
function getLevel(exp) { return Math.floor(exp / 100) + 1; }
function getGlassBorder() { return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨"; }

function getMainKeyboard() {
  return new InlineKeyboard()
    .text("🏛️ هخامنشیان", "cat_ancient")
    .text("⚔️ صفویان", "cat_islamic")
    .row()
    .text("🏭 پهلویان", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");
}

function getGameKeyboard() {
  return new InlineKeyboard()
    .text("🪞 بازارچه شیشه‌ای", "open_shop")
    .text("⚔️ میدان رزم", "battle")
    .row()
    .text("📊 دفترچه وضعیت", "my_status")
    .text("🏆 نامه سروران", "show_leaderboard")
    .row()
    .text("🔄 تغییر رهبر", "change_leader")
    .text("🔙 بازگشت", "back_main");
}

function getBackKeyboard() {
  return new InlineKeyboard().text("🔙 بازگشت", "back_to_game");
}

bot.command("start", async (ctx) => {
  ctx.session.currentMenu = "main";
  await ctx.replyWithPhoto(categoryImages.ancient, {
    caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
    parse_mode: "Markdown",
    reply_markup: getMainKeyboard()
  });
});

async function showCategory(ctx, categoryId) {
  let leadersList = [], title = "", image = "";
  if (categoryId === "ancient") { leadersList = ["cyrus", "darius", "anushirvan"]; title = "🏛️ شاهان هخامنشی و ساسانی"; image = categoryImages.ancient; }
  else if (categoryId === "islamic") { leadersList = ["shahabbas", "nader", "karim"]; title = "⚔️ شاهان صفوی و افشار"; image = categoryImages.islamic; }
  else if (categoryId === "modern") { leadersList = ["rezashah", "mohammadreza"]; title = "🏭 شاهان پهلوی"; image = categoryImages.modern; }
  else if (categoryId === "republic") { leadersList = ["khomeini", "khamenei"]; title = "🕌 رهبران جمهوری اسلامی"; image = categoryImages.republic; }

  const keyboard = new InlineKeyboard();
  leadersList.forEach(k => keyboard.text(leaders[k].name, `select_${k}`));
  keyboard.row().text("🔙 بازگشت", "back_main");

  await ctx.replyWithPhoto(image, {
    caption: `📜 ${title}\n\n${leadersList.map(k => `• ${leaders[k].name}\n   ${leaders[k].desc}`).join("\n")}`,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

async function selectLeader(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  usersDB.set(ctx.from.id, {
    leader: leaderKey, leaderName: leader.name, realName: ctx.from.first_name,
    era: leader.era, gold: 500, exp: 0, military: 50, weapon: null, alliances: [],
    battleCount: 0, lockUntil: null
  });
  ctx.session.currentMenu = "game";
  ctx.session.selectedLeader = leaderKey;

  await ctx.replyWithPhoto(leader.image, {
    caption: `${getGlassBorder()}\n✅ ${leader.name} برگزیده شد!\n${getGlassBorder()}\n\n💰 دینار: ۵۰۰\n⚔️ توان رزمی: ۵۰\n🗡️ خود: ندارد`,
    parse_mode: "Markdown",
    reply_markup: getGameKeyboard()
  });
}

async function showShop(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) { await ctx.reply("❌ ابتدا یک رهبر انتخاب کن!", { reply_markup: getMainKeyboard() }); return; }
  const weapons = weaponsByEra[user.era];
  const keyboard = new InlineKeyboard();
  weapons.forEach(w => keyboard.text(`${w.icon} ${w.name} - ${w.price}💰`, `buy_${w.id}`));
  keyboard.row().text("🔙 بازگشت به کاخ", "back_to_game");

  await ctx.reply(
    `🪞 ${getGlassBorder()} 🪞\n🛒 **بازارچه شیشه‌ای**\n${getGlassBorder()}\n\n💰 دینار: ${user.gold}\n⚔️ توان رزمی: ${user.military}\n\n${weapons.map(w => `${w.icon} ${w.name} - ${w.price}💰 (قدرت +${w.power})`).join("\n")}`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}

async function startBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) { await ctx.reply("❌ ابتدا یک رهبر انتخاب کن!", { reply_markup: getMainKeyboard() }); return; }

  const lockStatus = isLocked(ctx.from.id);
  if (lockStatus.locked) {
    await ctx.reply(
      `${getGlassBorder()}\n🏛️ **ای سردار بزرگ!**\n${getGlassBorder()}\n\nتوان رزمیات به پایان رسیده است.\nدر **حمام** بیاسای و بازگرد.\n\n⏱️ زمان باقی‌مانده: ${lockStatus.remainingMinutes} دقیقه\n\nپس از این زمان، دوباره به میدان رزم بازگرد.`,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
    return;
  }

  let battleCount = user.battleCount || 0;
  if (battleCount >= MAX_BATTLES) {
    const lockHours = lockUser(ctx.from.id);
    await ctx.reply(
      `${getGlassBorder()}\n⚔️ **ده نبرد پشت سر هم انجام دادی!**\n${getGlassBorder()}\n\nای سردار دلاور، توان رزمیات به پایان رسید.\nبه **حمام** برو و ${lockHours} ساعت بیاسای.\n\nپس از آن، دوباره به میدان رزم بازگرد.`,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
    return;
  }

  const npc = getRandomNPC();
  const playerPower = user.military + (user.weapon?.power || 0);
  const isWin = playerPower + (Math.random() * 30 - 10) > npc.power;
  const reward = isWin ? { gold: 200, exp: 30 } : { gold: 20, exp: 5 };
  
  user.gold += reward.gold;
  user.exp += reward.exp;
  user.battleCount = battleCount + 1;
  usersDB.set(ctx.from.id, user);

  const anim = isWin ? animations.victory : animations.defeat;
  const remainingBattles = MAX_BATTLES - (battleCount + 1);
  
  await ctx.replyWithAnimation(anim, {
    caption: `${getGlassBorder()}\n${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n${getGlassBorder()}\n\n⚔️ نبرد با ${npc.name}\n💰 +${reward.gold} دینار\n⭐ +${reward.exp} تجربه\n💰 دینار فعلی: ${user.gold}\n⚔️ توان فعلی: ${user.military}\n\n📊 نبردهای باقی‌مانده: ${remainingBattles}/${MAX_BATTLES}`,
    parse_mode: "Markdown"
  });

  if (remainingBattles > 0) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const keyboard = new InlineKeyboard()
      .text("⚔️ ادامه نبرد", "continue_battle")
      .text("🪞 بازارچه", "open_shop")
      .row()
      .text("🔙 بازگشت", "back_to_game");
    await ctx.reply("آیا می‌خواهی نبرد را ادامه دهی؟", { reply_markup: keyboard });
  } else {
    const lockHours = lockUser(ctx.from.id);
    await ctx.reply(
      `${getGlassBorder()}\n⚔️ **ده نبرد پشت سر هم انجام دادی!**\n${getGlassBorder()}\n\nای سردار دلاور، توان رزمیات به پایان رسید.\nبه **حمام** برو و ${lockHours} ساعت بیاسای.\n\nپس از آن، دوباره به میدان رزم بازگرد.`,
      { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
    );
  }
}

async function continueBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) { await ctx.reply("❌ خطا! /start رو بزن."); return; }
  const lockStatus = isLocked(ctx.from.id);
  if (lockStatus.locked) {
    await ctx.reply(`⏳ هنوز ${lockStatus.remainingMinutes} دقیقه تا باز شدن قفل باقی مانده است.`, { reply_markup: getBackKeyboard() });
    return;
  }
  await startBattle(ctx);
}

async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) { await ctx.reply("❌ ابتدا یک رهبر انتخاب کن!", { reply_markup: getMainKeyboard() }); return; }
  const level = getLevel(user.exp);
  await ctx.replyWithPhoto(leaders[user.leader].image, {
    caption: `${getGlassBorder()}\n📊 **دفترچه وضعیت**\n${getGlassBorder()}\n\n👑 نام: ${user.realName}\n🏛️ رهبر: ${user.leaderName}\n💰 دینار: ${user.gold}\n⭐ پایه: ${level}\n📈 تجربه: ${user.exp}/${level * 100}\n⚔️ توان رزمی: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}\n\n📊 نبردهای امروز: ${user.battleCount || 0}/${MAX_BATTLES}`,
    parse_mode: "Markdown",
    reply_markup: getBackKeyboard()
  });
}

async function showLeaderboard(ctx) {
  const users = Array.from(usersDB.entries())
    .filter(([k]) => !String(k).includes("admin_"))
    .sort((a, b) => b[1].military - a[1].military)
    .slice(0, 10);
  const text = users.map(([id, d], i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "📌";
    return `${medal} **${d.realName || d.leaderName}**\n   💰 ${d.gold} دینار | ⚔️ ${d.military} توان`;
  }).join("\n\n");
  await ctx.reply(
    `${getGlassBorder()}\n🏆 **نامه سروران**\n${getGlassBorder()}\n\n${text || "📭 هیچ سروری یافت نشد"}\n\n${getGlassBorder()}`,
    { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
  );
}

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  try {
    await ctx.answerCallbackQuery();
    if (data.startsWith("cat_")) await showCategory(ctx, data.replace("cat_", ""));
    else if (data.startsWith("select_")) await selectLeader(ctx, data.replace("select_", ""));
    else if (data === "back_main") {
      ctx.session.currentMenu = "main";
      await ctx.replyWithPhoto(categoryImages.ancient, {
        caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
        parse_mode: "Markdown",
        reply_markup: getMainKeyboard()
      });
    } else if (data === "back_to_game") {
      const user = usersDB.get(userId);
      if (user) {
        await ctx.replyWithPhoto(leaders[user.leader].image, {
          caption: `${getGlassBorder()}\n✅ ${user.leaderName}\n${getGlassBorder()}\n\n💰 دینار: ${user.gold}\n⚔️ توان: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}\n📊 نبردهای امروز: ${user.battleCount || 0}/${MAX_BATTLES}`,
          parse_mode: "Markdown",
          reply_markup: getGameKeyboard()
        });
      } else {
        await ctx.reply("❌ خطا! /start رو بزن.", { reply_markup: getMainKeyboard() });
      }
    } else if (data === "open_shop") await showShop(ctx);
    else if (data === "battle") await startBattle(ctx);
    else if (data === "continue_battle") await continueBattle(ctx);
    else if (data === "my_status") await showStatus(ctx);
    else if (data === "show_leaderboard") await showLeaderboard(ctx);
    else if (data === "change_leader") {
      usersDB.delete(userId);
      ctx.session.currentMenu = "main";
      await ctx.replyWithPhoto(categoryImages.ancient, {
        caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
        parse_mode: "Markdown",
        reply_markup: getMainKeyboard()
      });
    } else if (data.startsWith("buy_")) {
      const user = usersDB.get(userId);
      const itemId = data.replace("buy_", "");
      const item = weaponsByEra[user?.era]?.find(w => w.id === itemId);
      if (user && item && user.gold >= item.price) {
        user.gold -= item.price;
        if (user.weapon) user.military -= user.weapon.power;
        user.weapon = item;
        user.military += item.power;
        usersDB.set(userId, user);
        await ctx.reply(
          `${getGlassBorder()}\n✅ ${item.name} خریداری شد!\n${getGlassBorder()}\n💰 دینار باقی‌مانده: ${user.gold}\n⚔️ توان رزمی جدید: ${user.military}`,
          { parse_mode: "Markdown", reply_markup: getBackKeyboard() }
        );
      } else {
        await ctx.reply(`❌ دینار کافی نیست!`, { reply_markup: getBackKeyboard() });
      }
    }
  } catch (error) {
    console.error("خطا:", error);
    await ctx.reply("❌ خطایی رخ داد. لطفاً /start رو بزن.");
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `${getGlassBorder()}\n🎮 **راهنمای بازی بقای باستانی**\n${getGlassBorder()}\n\n/start - آغاز بازی\n/restart - نو کردن بازی\n/help - همین راهنما\n\n✨ با برگزیدن یک شاه، ایران را به شکوه بازگردان!\n⚔️ پس از ۱۰ نبرد، باید به حمام بروی و ۱ تا ۳ ساعت استراحت کنی.`,
    { parse_mode: "Markdown" }
  );
});

bot.command("restart", async (ctx) => {
  usersDB.delete(ctx.from.id);
  ctx.session.currentMenu = "main";
  await ctx.reply("🔄 بازی از نو آغاز شد!");
  await bot.commands.start(ctx);
});

bot.command("admin_panel", async (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) { await ctx.reply("❌ دسترسی غیرمجاز!"); return; }
  const keyboard = new InlineKeyboard()
    .text("💰 هدیه سکه", "admin_give_gold")
    .text("🏆 فول کردن", "admin_full_upgrade")
    .row()
    .text("📊 لیست کاربران", "admin_list_users")
    .text("🔙 بستن", "admin_close");
  await ctx.reply("👑 **پنل ادمین**", { parse_mode: "Markdown", reply_markup: keyboard });
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  if (data === "admin_give_gold" && ADMINS.includes(userId)) {
    await ctx.editMessageText("👑 ایدی کاربر و مقدار سکه رو بفرست (مثال: 123456789 1000)");
    usersDB.set(`admin_${userId}_action`, "waiting_for_gold");
  } else if (data === "admin_full_upgrade" && ADMINS.includes(userId)) {
    await ctx.editMessageText("👑 ایدی کاربر رو بفرست تا فول شود:");
    usersDB.set(`admin_${userId}_action`, "waiting_for_full");
  } else if (data === "admin_list_users" && ADMINS.includes(userId)) {
    const list = Array.from(usersDB.entries()).filter(([k]) => !String(k).includes("admin_")).map(([id, d]) => `${d.realName || d.leaderName} - ${id}`).join("\n");
    await ctx.editMessageText(`📊 لیست کاربران\n${list || "هیچ"}`);
  } else if (data === "admin_close" && ADMINS.includes(userId)) {
    await ctx.deleteMessage();
  }
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  if (!ADMINS.includes(userId)) return;
  const action = usersDB.get(`admin_${userId}_action`);
  if (!action) return;
  const text = ctx.message.text;
  if (action === "waiting_for_gold") {
    const parts = text.split(" ");
    const targetId = parseInt(parts[0]);
    const amount = parseInt(parts[1]);
    const target = usersDB.get(targetId);
    if (target && !isNaN(amount)) {
      target.gold += amount;
      usersDB.set(targetId, target);
      await ctx.reply(`✅ ${amount} سکه به کاربر ${targetId} اضافه شد. سکه فعلی: ${target.gold}`);
    } else await ctx.reply("❌ فرمت اشتباه! مثال: 123456789 1000");
    usersDB.delete(`admin_${userId}_action`);
  } else if (action === "waiting_for_full") {
    const targetId = parseInt(text);
    const target = usersDB.get(targetId);
    if (target) {
      target.gold = 100000;
      target.exp = 5000;
      target.military = 1000;
      target.weapon = { id: "ultimate", name: "سلاح نهایی", power: 500 };
      usersDB.set(targetId, target);
      await ctx.reply(`✅ کاربر ${targetId} فول شد!`);
    } else await ctx.reply("❌ کاربر پیدا نشد!");
    usersDB.delete(`admin_${userId}_action`);
  }
});

bot.start();
console.log("🎮 بازی بقای باستانی - نسخه نهایی با قفل ۱۰ نبرد و حمام روشن شد...");