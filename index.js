const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// ==================== دیتابیس کاربران ====================
const usersDB = new Map();

// ==================== ادمین‌ها ====================
const ADMINS = [5576592239]; // ایدی عددی ادمین

// ==================== عکس‌های رهبران ====================
const leaders = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیانگذار هخامنشی، منشور حقوق بشر", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDexqIC3VJle3eBKrpyP2iPCb2nSHdgAC8g5rG4APAVFruE7qyqYySgEAAwIAA3kAAzsE" },
  darius: { name: "داریوش بزرگ", desc: "سازنده تخت جمشید، سازماندهی اداری", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDgRqIC6pWLzAhSz62YlMEYu1BBJXcAAC9Q5rG4APAVFi2sJMMLDVlwEAAwIAA3kAAzsE" },
  anushirvan: { name: "انوشیروان", desc: "دادگر ساسانی، حامی علم و فلسفه", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDgxqIC84TrWNGA0_YAj8HnqqpititgAC9g5rG4APAVHJULBSG_V9cgEAAwIAA3kAAzsE" },
  shahabbas: { name: "شاه عباس کبیر", desc: "صفوی، اصفهان نصف جهان", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  nader: { name: "نادرشاه افشار", desc: "فاتح هند، احیای مرزهای ایران", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDhJqIC_JqhOlWXWY5bNFKEYODsErLgAC-A5rG4APAVFDa5CLbAKRpgEAAwIAA3kAAzsE" },
  karim: { name: "کریم‌خان زند", desc: "وکیل‌الرعایا، دوران آرامش", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  rezashah: { name: "رضاشاه پهلوی", desc: "بنیانگذار ارتش مدرن، راه‌سازی", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE", era: "modern", battleImage: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  mohammadreza: { name: "محمدرضا پهلوی", desc: "انقلاب سفید، توسعه اقتصادی", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE", era: "modern", battleImage: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
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

// ==================== مواد اولیه و ساخت سلاح ====================
const craftRecipes = {
  ancient: [
    { id: "iron_sword", name: "شمشیر آهنی", power: 20, price: 200, requiredItem: "sword", requiredItemName: "شمشیر مفرغی", desc: "شمشیر آهنی محکم‌تر و برنده‌تر" },
    { id: "composite_bow", name: "کمان کامپوزیت", power: 25, price: 300, requiredItem: "bow", requiredItemName: "تیر و کمان", desc: "کمان چندلایه با برد بیشتر" }
  ],
  islamic: [
    { id: "upgrade_musket", name: "تفنگ سرپر", power: 40, price: 400, requiredItem: "musket", requiredItemName: "تفنگ فتیله‌ای", desc: "تفنگ با دقت و برد بالاتر" },
    { id: "big_cannon", name: "توپ جنگی بزرگ", power: 60, price: 500, requiredItem: "cannon", requiredItemName: "توپ‌خانه", desc: "توپ سنگین با برد تخریبی بالا" }
  ],
  modern: [
    { id: "heavy_maxim", name: "مسلسل برنو", power: 50, price: 600, requiredItem: "maxim", requiredItemName: "مسلسل ماکسیم", desc: "مسلسل سنگین با برد و آتش بیشتر" }
  ],
  khomeini: [
    { id: "fateh_missile", name: "موشک فاتح", power: 80, price: 800, requiredItem: "collage", requiredItemName: "کلاژ", desc: "موشک کوتاه برد با دقت بالا" }
  ],
  khamenei: [
    { id: "nuclear_missile", name: "موشک هسته‌ای عماد", power: 300, price: 1000, requiredItem: "shahab3", requiredItemName: "موشک شهاب ۳", desc: "موشک بالستیک با قابلیت حمل کلاهک هسته‌ای" },
    { id: "shahad136", name: "پهباد شاهد ۱۳۶", power: 250, price: 1500, requiredItem: "mohajer", requiredItemName: "پهباد مهاجر", desc: "پهباد شناور انتحاری با برد بالا" },
    { id: "bavar_advance", name: "باور ۳۷۳ پیشرفته", power: 400, price: 2000, requiredItem: "bavar", requiredItemName: "سامانه باور ۳۷۳", desc: "سامانه پدافندی دوربرد - شکارچی جنگنده‌ها" },
    { id: "icbm", name: "موشک قاره‌پیما آرش", power: 500, price: 3000, requiredItem: "khorramshahr", requiredItemName: "موشک خرمشهر", desc: "موشک قاره‌پیما با برد ۱۰۰۰۰ کیلومتر" },
    { id: "hypersonic", name: "موشک هایپرسونیک فتاح", power: 450, price: 3500, requiredItem: "shahab1", requiredItemName: "موشک شهاب ۱", desc: "موشک مافوق صوت غیرقابل رهگیری" }
  ]
};

// ==================== ۵۰ NPC فیک ====================
const npcList = [
  { name: "سردار بابک", power: 45, era: "ancient", desc: "شورشی مازندران" },
  { name: "مهرداد شورشی", power: 38, era: "ancient", desc: "فرماندار یاغی" },
  { name: "اسپهبد خسرو", power: 52, era: "ancient", desc: "نیروهای ساسانی" },
  { name: "والی هرات", power: 48, era: "islamic", desc: "حاکم یاغی شرق" },
  { name: "خان ازبک", power: 55, era: "islamic", desc: "تهاجم از شمال شرق" },
  { name: "ژنرال روس", power: 60, era: "modern", desc: "نیروهای تزاری" },
  { name: "کلنل انگلیسی", power: 58, era: "modern", desc: "نفوذ جنوب" },
  { name: "صدام حسین", power: 75, era: "khomeini", desc: "ارتش بعث عراق" },
  { name: "مسعود رجوی", power: 50, era: "khomeini", desc: "منافقین" },
  { name: "داعش", power: 65, era: "khamenei", desc: "تروریست‌های تکفیری" },
  { name: "آمریکا", power: 85, era: "khamenei", desc: "نیروهای بیگانه" },
  { name: "اسرائیل", power: 80, era: "khamenei", desc: "رژیم صهیونیستی" },
  { name: "شورشیان سیستان", power: 35, era: "ancient", desc: "اغتشاش‌گران" },
  { name: "قزاق‌ها", power: 48, era: "modern", desc: "نیروهای مهاجم" },
  { name: "منافقین", power: 55, era: "khomeini", desc: "گروهک ضدانقلاب" },
  { name: "پژاک", power: 60, era: "khamenei", desc: "تروریست‌های کرد" },
  { name: "جیش العدل", power: 58, era: "khamenei", desc: "گروهک تروریستی" },
  { name: "طالبان", power: 62, era: "khamenei", desc: "نیروهای افراطی" },
  { name: "پاکستان", power: 70, era: "khamenei", desc: "کشور همسایه" },
  { name: "ترکیه", power: 68, era: "khamenei", desc: "نیروهای ناتو" },
  { name: "عربستان", power: 65, era: "khamenei", desc: "ائتلاف سعودی" },
  { name: "انگلیس", power: 72, era: "modern", desc: "نیروهای استعماری" },
  { name: "شوروی", power: 78, era: "modern", desc: "ارتش سرخ" },
  { name: "چنگیز مغول", power: 90, era: "ancient", desc: "تهاجم مغول" },
  { name: "تیمور لنگ", power: 88, era: "islamic", desc: "تهاجم تیموری" },
  { name: "بابک خرمدین", power: 50, era: "islamic", desc: "قیام آزادیبخش" },
  { name: "هلاکوخان", power: 85, era: "islamic", desc: "تهاجم مغول" }
];

// ==================== انیمیشن‌ها ====================
const animations = {
  readyToFight: "CgACAgQAAxkBAAEqETVqIGusPLj-Qq0nd73vMUkiRiwY0wACTwYAArMmNVBb8-ES6JPGHzsE",
  cyrusAnimation: "CgACAgQAAxkBAAEqEUpqIG2RakeSSSNpKkC-3UfiGpoEYwACGQMAAt5HJVNbjZO7dqLofTsE",
  missileAnimation: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA"
};

// ==================== نام دوره‌ها ====================
const eraNames = {
  ancient: "باستان",
  islamic: "اسلامی",
  modern: "معاصر",
  khomeini: "دفاع مقدس",
  khamenei: "موشکی و پهبادی"
};

// ==================== توابع کمکی ====================
function getRandomNPC(era) {
  const filtered = npcList.filter(npc => npc.era === era);
  if (filtered.length === 0) return { name: "دشمن ناشناس", power: 50, era: era, desc: "نیروی مهاجم" };
  return filtered[Math.floor(Math.random() * filtered.length)];
}

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
  let leadersList = [], title = "", image = "";
  if (categoryId === "ancient") { leadersList = ["cyrus", "darius", "anushirvan"]; title = "🏛️ پادشاهان باستان"; image = categoryImages.ancient; }
  else if (categoryId === "islamic") { leadersList = ["shahabbas", "nader", "karim"]; title = "⚔️ پادشاهان اسلامی"; image = categoryImages.islamic; }
  else if (categoryId === "modern") { leadersList = ["rezashah", "mohammadreza"]; title = "🏭 پادشاهان معاصر"; image = categoryImages.modern; }
  else if (categoryId === "republic") { leadersList = ["khomeini", "khamenei"]; title = "🕌 رهبران جمهوری اسلامی"; image = categoryImages.republic; }

  const keyboard = new InlineKeyboard();
  for (const key of leadersList) keyboard.text(leaders[key].name, `temp_${key}`);
  keyboard.row().text("🔙 بازگشت به منوی اصلی", "back_main");

  const caption = `📜 **${title}**\n\n✨ یکی از پادشاهان یا رهبران زیر رو انتخاب کن:\n\n` + leadersList.map(k => `• **${leaders[k].name}**\n   ${leaders[k].desc}`).join("\n");
  await ctx.editMessageMedia({ type: "photo", media: image, caption: caption, parse_mode: "Markdown" }, { reply_markup: keyboard });
}

// ==================== نمایش جزئیات رهبر ====================
async function showLeaderDetail(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  let backCategory = leader.era === "khomeini" || leader.era === "khamenei" ? "republic" : leader.era;
  const keyboard = new InlineKeyboard().text("✅ انتخاب این رهبر", `select_${leaderKey}`).text("🔙 بازگشت", `back_cat_${backCategory}`);
  await ctx.editMessageMedia({ type: "photo", media: leader.image, caption: `👑 **${leader.name}**\n\n📖 **معرفی:**\n${leader.desc}\n\n❓ آیا می‌خواهی این رهبر رو انتخاب کنی؟`, parse_mode: "Markdown" }, { reply_markup: keyboard });
}

// ==================== نمایش منوی بازی ====================
async function showGameMenu(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  const user = usersDB.get(ctx.from.id);
  const keyboard = new InlineKeyboard()
    .text("🛒 فروشگاه سلاح", "open_shop")
    .text("🔧 ساخت سلاح", "craft_menu")
    .row()
    .text("⚔️ جنگ", "battle")
    .text("📊 وضعیت من", "my_status")
    .row()
    .text("🔄 تغییر رهبر", "change_leader");
  if (ADMINS.includes(ctx.from.id)) keyboard.row().text("👑 پنل ادمین", "admin_panel_secret");

  await ctx.replyWithPhoto(leader.image, {
    caption: `✅ **${leader.name}** انتخاب شد!\n\n📜 دوره: ${eraNames[leader.era]}\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح فعلی: ${user.weapon?.name || "بدون سلاح"}\n\n🛒 از فروشگاه سلاح بخر و وارد جنگ شو!`,
    parse_mode: "Markdown", reply_markup: keyboard
  });
}

// ==================== فروشگاه ====================
async function showShop(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const weapons = weaponsByEra[user.era];
  const keyboard = new InlineKeyboard();
  for (const item of weapons) keyboard.text(`${item.name} - ${item.price}💰 ${user.weapon?.id === item.id ? "✅" : ""}`, `buy_${item.id}`);
  keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
  await ctx.reply(`🛒 **فروشگاه دوره ${eraNames[user.era]}**\n\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح فعلی: ${user.weapon?.name || "ندارد"}\n\n**قابل خرید:**\n` + weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})\n   ${w.desc}`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== ساخت سلاح ====================
async function showCraftMenu(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const recipes = craftRecipes[user.era];
  if (!recipes || recipes.length === 0) { await ctx.reply("❌ در این دوره هیچ سلاحی قابل ساخت نیست."); return; }
  const keyboard = new InlineKeyboard();
  for (const recipe of recipes) keyboard.text(`${recipe.name} - ${recipe.price}💰 ${user.weapon?.id === recipe.requiredItem ? "✅" : "🔒"}`, `craft_${recipe.id}`);
  keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
  await ctx.reply(`🔧 **کارگاه ساخت سلاح - دوره ${eraNames[user.era]}**\n\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح فعلی: ${user.weapon?.name || "ندارد"}\n\n**قابل ساخت:**\n` + recipes.map(r => `• ${r.name} - ${r.price}💰 (قدرت +${r.power})\n   نیاز: ${r.requiredItemName}\n   ${r.desc}`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
}

async function craftWeapon(ctx, recipeId) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const recipes = craftRecipes[user.era];
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return;
  if (user.weapon?.id !== recipe.requiredItem) { await ctx.reply(`❌ برای ساخت ${recipe.name} به ${recipe.requiredItemName} نیاز داری!`); return; }
  if (user.gold < recipe.price) { await ctx.reply(`❌ سکه کافی نیست! نیاز به ${recipe.price - user.gold} سکه بیشتر داری.`); return; }
  user.gold -= recipe.price;
  user.military -= user.weapon.power;
  user.weapon = { id: recipe.id, name: recipe.name, power: recipe.power };
  user.military += recipe.power;
  usersDB.set(ctx.from.id, user);
  await ctx.replyWithAnimation(animations.cyrusAnimation, { caption: `✅ **${recipe.name}** ساخته شد!\n💰 سکه: ${user.gold}\n⚔️ قدرت نظامی: ${user.military}`, parse_mode: "Markdown" });
  await showCraftMenu(ctx);
}

// ==================== درخواست جنگ ====================
async function requestBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const npc = getRandomNPC(user.era);
  usersDB.set(ctx.from.id + "_pending", { npc, timestamp: Date.now() });
  const keyboard = new InlineKeyboard().text("✅ بله، می‌جنگم", "confirm_battle").text("❌ نه، فرار می‌کنم", "cancel_battle");
  await ctx.reply(`⚔️ **دشمنی پیدا شد!**\n\n👤 **نام:** ${npc.name}\n📜 **دوره:** ${eraNames[npc.era]}\n📖 **توضیح:** ${npc.desc}\n💪 **قدرت دشمن:** ${npc.power}\n🏆 **قدرت تو:** ${user.military + (user.weapon?.power || 0)}\n\nآیا می‌خوای با این دشمن بجنگی؟`, { parse_mode: "Markdown", reply_markup: keyboard });
}

async function confirmBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  const pending = usersDB.get(ctx.from.id + "_pending");
  if (!user || !pending) { await ctx.reply("❌ خطا! لطفاً دوباره /start رو بزن."); return; }
  const npc = pending.npc;
  const playerPower = user.military + (user.weapon?.power || 0);
  const enemyPower = npc.power + Math.floor(Math.random() * 20) - 10;
  const randomFactor = Math.floor(Math.random() * 40) - 15;
  const finalPower = playerPower + randomFactor;
  let reward, message;
  if (finalPower > enemyPower + 20) { reward = { gold: 300, exp: 50, military: 10 }; message = "🎉 **پیروزی قاطع!**"; }
  else if (finalPower > enemyPower - 10) { reward = { gold: 100, exp: 20, military: 0 }; message = "🤝 **آتش‌بس!**"; }
  else { reward = { gold: 30, exp: 5, military: -5 }; message = "💔 **شکست خوردی!**"; }
  user.gold = Math.max(0, user.gold + reward.gold);
  user.exp += reward.exp;
  user.military = Math.max(0, user.military + reward.military);
  usersDB.set(ctx.from.id, user);
  usersDB.delete(ctx.from.id + "_pending");
  const battleCaption = `⚔️ **نبرد با ${npc.name}**\n\n${message}\n\n📊 **آمار:**\n• قدرت تو: ${playerPower}\n• قدرت ${npc.name}: ${enemyPower}\n• شانس: ${randomFactor > 0 ? `+${randomFactor}` : randomFactor}\n\n🎁 **نتیجه:**\n• سکه: ${reward.gold}\n• تجربه: +${reward.exp}\n• قدرت: ${reward.military}\n\n💰 سکه فعلی: ${user.gold}`;
  await ctx.replyWithAnimation(animations.readyToFight, { caption: battleCaption, parse_mode: "Markdown" });
  const keyboard = new InlineKeyboard().text("🛒 فروشگاه", "open_shop").text("⚔️ جنگ جدید", "battle").row().text("🔙 منوی اصلی", "back_to_game");
  await ctx.reply("⚔️ **اداره جنگ:**", { reply_markup: keyboard });
}

async function cancelBattle(ctx) {
  usersDB.delete(ctx.from.id + "_pending");
  await ctx.reply("🏃‍♂️ **تو از میدان جنگ فرار کردی!**");
  const keyboard = new InlineKeyboard().text("🛒 فروشگاه", "open_shop").text("⚔️ جنگ جدید", "battle").row().text("🔙 منوی اصلی", "back_to_game");
  await ctx.reply("به منوی اصلی برگشتی:", { reply_markup: keyboard });
}

// ==================== وضعیت کاربر ====================
async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const leader = leaders[user.leader];
  const level = Math.floor(user.exp / 100) + 1;
  const nextExp = level * 100 - user.exp;
  const keyboard = new InlineKeyboard().text("🔙 بازگشت به بازی", "back_to_game");
  await ctx.replyWithPhoto(leader.image, { caption: `📊 **وضعیت ${leader.name}**\n\n📜 دوره: ${eraNames[user.era]}\n💰 سکه: ${user.gold}\n⭐ سطح: ${level}\n📈 تجربه: ${user.exp}/${level * 100}\n⚔️ قدرت نظامی: ${user.military}\n🗡️ سلاح: ${user.weapon?.name || "بدون سلاح"}\n🏆 پیروزی‌ها: ${Math.floor(user.exp / 50)}`, parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== پنل ادمین ====================
async function showAdminPanel(ctx) {
  const keyboard = new InlineKeyboard()
    .text("🎁 هدیه گیف", "admin_give_gif").text("💰 هدیه سکه", "admin_give_gold")
    .row().text("⭐ هدیه تجربه", "admin_give_exp").text("⚔️ هدیه قدرت", "admin_give_power")
    .row().text("🏆 فول کردن", "admin_full_upgrade").text("🗑️ ریست کاربر", "admin_reset_user")
    .row().text("📊 لیست کاربران", "admin_list_users").text("🔙 بستن", "admin_close");
  await ctx.reply("👑 **پنل مدیریت مخفی**", { parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== مدیریت کلیک‌ها ====================
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  try {
    await ctx.answerCallbackQuery();
    if (data.startsWith("cat_")) await showCategory(ctx, data.replace("cat_", ""));
    else if (data.startsWith("temp_")) await showLeaderDetail(ctx, data.replace("temp_", ""));
    else if (data.startsWith("select_")) {
      const leaderKey = data.replace("select_", "");
      usersDB.set(ctx.from.id, { leader: leaderKey, leaderName: leaders[leaderKey].name, era: leaders[leaderKey].era, gold: 500, exp: 0, military: 50, weapon: null });
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await showGameMenu(ctx, leaderKey);
    }
    else if (data.startsWith("back_cat_")) await showCategory(ctx, data.replace("back_cat_", ""));
    else if (data === "back_main") {
      const keyboard = new InlineKeyboard().text("🏛️ پادشاهان باستان", "cat_ancient").text("⚔️ پادشاهان اسلامی", "cat_islamic").row().text("🏭 پادشاهان معاصر", "cat_modern").text("🕌 رهبران جمهوری اسلامی", "cat_republic");
      await ctx.editMessageMedia({ type: "photo", media: categoryImages.ancient, caption: "🏛️ **بازی بقای باستانی**\n\n📜 یک دسته رو انتخاب کن:", parse_mode: "Markdown" }, { reply_markup: keyboard });
    }
    else if (data === "open_shop") await showShop(ctx);
    else if (data === "craft_menu") await showCraftMenu(ctx);
    else if (data.startsWith("craft_")) await craftWeapon(ctx, data.replace("craft_", ""));
    else if (data === "battle") await requestBattle(ctx);
    else if (data === "confirm_battle") await confirmBattle(ctx);
    else if (data === "cancel_battle") await cancelBattle(ctx);
    else if (data === "my_status") await showStatus(ctx);
    else if (data === "change_leader") {
      const keyboard = new InlineKeyboard().text("🏛️ پادشاهان باستان", "cat_ancient").text("⚔️ پادشاهان اسلامی", "cat_islamic").row().text("🏭 پادشاهان معاصر", "cat_modern").text("🕌 رهبران جمهوری اسلامی", "cat_republic");
      await ctx.reply("🔄 **تغییر رهبر**", { parse_mode: "Markdown", reply_markup: keyboard });
    }
    else if (data === "back_to_game") { const user = usersDB.get(ctx.from.id); if (user) await showGameMenu(ctx, user.leader); else await ctx.reply("❌ خطا! /start رو بزن."); }
    else if (data.startsWith("buy_")) {
      const user = usersDB.get(ctx.from.id);
      if (!user) return;
      const item = weaponsByEra[user.era].find(w => w.id === data.replace("buy_", ""));
      if (!item) return;
      if (user.gold >= item.price) {
        user.gold -= item.price;
        if (user.weapon) user.military -= user.weapon.power;
        user.weapon = item;
        user.military += item.power;
        usersDB.set(ctx.from.id, user);
        await ctx.replyWithAnimation(animations.cyrusAnimation, { caption: `✅ ${item.name} خریداری شد!\n💰 سکه: ${user.gold}\n⚔️ قدرت: ${user.military}` });
        await showShop(ctx);
      } else await ctx.reply(`❌ سکه کافی نیست! نیاز به ${item.price - user.gold} سکه بیشتر.`);
    }
    else if (data === "admin_panel_secret" && ADMINS.includes(userId)) await showAdminPanel(ctx);
    else if (data === "admin_list_users" && ADMINS.includes(userId)) {
      const users = Array.from(usersDB.entries()).filter(([key]) => !String(key).includes("admin_") && !String(key).includes("pending"));
      if (users.length === 0) await ctx.editMessageText("📊 هیچ کاربری ثبت نشده.");
      else await ctx.editMessageText("📊 **لیست کاربران:**\n\n" + users.map(([id, d]) => `👤 ${d.leaderName} - ${id} - 💰${d.gold}`).join("\n"), { parse_mode: "Markdown" });
    }
    else if (data === "admin_close" && ADMINS.includes(userId)) await ctx.deleteMessage();
    else if (data.startsWith("admin_") && ADMINS.includes(userId)) {
      const actions = { admin_give_gif: "waiting_for_target_gif", admin_give_gold: "waiting_for_target_gold", admin_give_exp: "waiting_for_target_exp", admin_give_power: "waiting_for_target_power", admin_full_upgrade: "waiting_for_target_full", admin_reset_user: "waiting_for_target_reset" };
      if (actions[data]) {
        await ctx.editMessageText(`👑 وارد شدی. ایدی کاربر رو بفرست:`, { parse_mode: "Markdown" });
        usersDB.set(`admin_${userId}_action`, actions[data]);
      }
    }
  } catch (error) { console.error("خطا:", error); await ctx.reply("❌ خطایی رخ داد."); }
});

// ==================== دریافت متن از ادمین ====================
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  if (!ADMINS.includes(userId)) return;
  const action = usersDB.get(`admin_${userId}_action`);
  if (!action) return;
  const targetId = parseInt(ctx.message.text);
  if (isNaN(targetId)) { await ctx.reply("❌ ایدی نامعتبر!"); usersDB.delete(`admin_${userId}_action`); return; }
  usersDB.set(`admin_${userId}_target`, targetId);
  if (action === "waiting_for_target_gif") { usersDB.set(`admin_${userId}_action`, "waiting_for_gif_file"); await ctx.reply("✅ حالا گیف رو بفرست."); }
  else if (action === "waiting_for_target_gold") { usersDB.set(`admin_${userId}_action`, "waiting_for_gold_amount"); await ctx.reply("✅ حالا مقدار سکه رو بفرست."); }
  else if (action === "waiting_for_target_exp") { usersDB.set(`admin_${userId}_action`, "waiting_for_exp_amount"); await ctx.reply("✅ حالا مقدار تجربه رو بفرست."); }
  else if (action === "waiting_for_target_power") { usersDB.set(`admin_${userId}_action`, "waiting_for_power_amount"); await ctx.reply("✅ حالا مقدار قدرت رو بفرست."); }
  else if (action === "waiting_for_target_full") { await fullUpgrade(ctx, targetId); usersDB.delete(`admin_${userId}_action`); }
  else if (action === "waiting_for_target_reset") { if (usersDB.has(targetId)) usersDB.delete(targetId); await ctx.reply(`✅ کاربر ${targetId} ریست شد.`); usersDB.delete(`admin_${userId}_action`); }
});

async function fullUpgrade(ctx, targetId) {
  const user = usersDB.get(targetId);
  if (user) { user.gold = 100000; user.exp = 5000; user.military = 1000; user.weapon = { id: "ultimate", name: "سلاح نهایی", power: 500 }; usersDB.set(targetId, user); await ctx.reply(`✅ کاربر ${targetId} فول شد!`); }
  else await ctx.reply("❌ کاربر پیدا نشد!");
}

// ==================== دریافت گیف از ادمین ====================
bot.on("message:animation", async (ctx) => {
  const userId = ctx.from.id;
  if (!ADMINS.includes(userId)) return;
  const action = usersDB.get(`admin_${userId}_action`);
  if (action === "waiting_for_gif_file") {
    const targetId = usersDB.get(`admin_${userId}_target`);
    try { await bot.api.sendAnimation(targetId, ctx.message.animation.file_id, { caption: "🎁 هدیه از ادمین!" }); await ctx.reply(`✅ گیف به ${targetId} ارسال شد.`); } 
    catch (e) { await ctx.reply(`❌ خطا در ارسال به ${targetId}`); }
    usersDB.delete(`admin_${userId}_action`); usersDB.delete(`admin_${userId}_target`);
  }
});

// ==================== دستورات کمکی ====================
bot.command("help", async (ctx) => { await ctx.reply("🎮 **راهنمای بازی بقای باستانی**\n\n/start - شروع\n/restart - شروع مجدد\n/help - راهنما\n/admin_panel - پنل ادمین", { parse_mode: "Markdown" }); });
bot.command("restart", async (ctx) => { usersDB.delete(ctx.from.id); await ctx.reply("🔄 شروع مجدد..."); await bot.commands.start(ctx); });
bot.command("admin_panel", async (ctx) => { if (ADMINS.includes(ctx.from.id)) await showAdminPanel(ctx); else await ctx.reply("❌ دسترسی غیرمجاز!"); });

// ==================== استارت ربات ====================
bot.start();
console.log("🎮 بازی بقای باستانی کامل روشن شد...");