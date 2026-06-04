const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);
const usersDB = new Map();
const ADMINS = process.env.ADMINS ? process.env.ADMINS.split(',').map(Number) : [5576592239];

function getGlassBorder() { return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨"; }

const inflationRates = {
  ancient: 1, islamic: 5, modern: 10, khomeini: 50, khamenei: 5000000
};

const currencyNames = {
  ancient: "شکِل", islamic: "تومان", modern: "ریال", khomeini: "تومان", khamenei: "تومان"
};

function formatPrice(price, era) {
  const rate = inflationRates[era] || 1;
  const finalPrice = price * rate;
  const currency = currencyNames[era] || "تومان";
  if (era === "khamenei") {
    if (finalPrice >= 1000000000) return `${(finalPrice / 1000000000).toFixed(0)} میلیارد ${currency}`;
    return `${(finalPrice / 1000000).toFixed(0)} میلیون ${currency}`;
  }
  return `${finalPrice.toLocaleString()} ${currency}`;
}

function formatGold(gold, era) {
  const currency = currencyNames[era] || "تومان";
  if (era === "khamenei") {
    if (gold >= 1000000000) return `${(gold / 1000000000).toFixed(0)} میلیارد ${currency}`;
    return `${(gold / 1000000).toFixed(0)} میلیون ${currency}`;
  }
  return `${gold.toLocaleString()} ${currency}`;
}

const npcList = {
  ancient: ["سپاه بابل", "شورشیان پارس", "مادها", "سکاها", "سپاه ایلام", "سواره نظام ماد", "کمانداران مصری", "فیل‌های جنگی هند", "سپاه یونان", "دزدان دریایی خلیج فارس", "لشکر آشور", "سپاه اورارتو", "شورشیان سارد", "ساکاها", "سپاه هخامنشی شورشی"],
  islamic: ["ارتش عثمانی", "ازبک‌ها", "پرتُغالی‌ها", "گورکانیان هند", "سپاه روسیه تزاری", "شورشیان افغان", "سپاه ترکمن", "نیروی دریایی پرتغال", "سپاه عباسی", "سپاه اموی", "خوارج", "اسماعیلیان", "سپاه غزنوی", "سپاه سلجوقی", "مغولان"],
  modern: ["شورشیان عشایر", "ارتش سرخ", "نیروهای متفقین", "شورشیان کرد", "نیروهای انگلیسی", "سپاه قزاق", "شورشیان لرستان", "نیروهای سوئدی", "قوای روس", "نیروهای عثمانی"],
  khomeini: ["ارتش بعث", "منافقین", "صدام", "نیروهای متجاوز", "گروهک فرقان", "نیروی دریایی عراق", "سپاه قدس عراق", "شورشیان کرد عراق", "نیروهای کمکی عرب", "تک تیراندازان بعثی", "نیروی هوایی عراق", "توپخانه بعث", "شیمیایی‌های صدام", "نیروهای ضدانقلاب", "گروهک پژاک"],
  khamenei: ["آمریکا", "اسرائیل", "داعش", "تحریم‌های ظالمانه", "نیروهای ناتو", "مزدوران سعودی", "تروریست‌های تکفیری", "جیش العدل", "گروهک پژاک", "نیروهای بیگانه", "جاسوسان موساد", "پهپادهای آمریکایی", "نیروی دریایی آمریکا", "نیروهای دموکراتیک", "ارتش سایبری"]
};

const randomEvents = [
  { name: "🌾 قحطی بزرگ", effect: { gold: -0.1, military: -5 }, desc: "قحطی باعث کاهش درآمد و قدرت شد" },
  { name: "💎 کشف معدن طلا", effect: { gold: 0.3, military: 0 }, desc: "معدن طلا پیدا شد! ثروت زیادی به دست آوردی" },
  { name: "🤝 اتحاد با همسایگان", effect: { gold: 0, military: 10 }, desc: "اتحاد جدید قدرت نظامی را افزایش داد" },
  { name: "🌪️ طوفان سهمگین", effect: { gold: -0.05, military: -5 }, desc: "طوفان به زیرساخت‌ها آسیب زد" },
  { name: "🎓 عصر طلایی دانش", effect: { gold: 0.1, military: 5 }, desc: "پیشرفت علمی باعث رشد اقتصادی و نظامی شد" },
  { name: "🦠 بیماری واگیردار", effect: { gold: -0.15, military: -10 }, desc: "بیماری جمعیت و اقتصاد را کاهش داد" },
  { name: "🏗️ ساخت پروژه بزرگ", effect: { gold: -0.2, military: 15 }, desc: "پروژه عظیم هزینه داشت ولی قدرت دفاعی را بالا برد" },
  { name: "🌍 کشف راه تجاری جدید", effect: { gold: 0.2, military: 0 }, desc: "راه تجاری جدید درآمد هنگفتی ایجاد کرد" },
  { name: "🗡️ قیام مردمی", effect: { gold: -0.05, military: 10 }, desc: "مردم داوطلبانه به ارتش پیوستند" },
  { name: "✨ معجزه اقتصادی", effect: { gold: 0.4, military: 5 }, desc: "رشد اقتصادی بی‌سابقه!" },
  { name: "🛡️ فتح تاریخی", effect: { gold: 0.2, military: 20 }, desc: "سرزمین جدید فتح شد!" },
  { name: "🕋 حج سالانه", effect: { gold: -0.02, military: 5 }, desc: "وحدت مسلمانان قدرت معنوی را افزایش داد" },
  { name: "⚡ حمله غافلگیرانه", effect: { gold: -0.08, military: -15 }, desc: "دشمن غافلگیرت کرد! خسارت دیدی" },
  { name: "🎭 جشن بزرگ نوروز", effect: { gold: -0.03, military: 3 }, desc: "شادی مردم باعث افزایش روحیه سربازان شد" }
];

const alliancesList = [
  { id: "russia", name: "روسیه", emoji: "🇷🇺", cost: 500, militaryBonus: 30, goldBonus: 0.1, desc: "اتحاد استراتژیک با همسایه شمالی" },
  { id: "china", name: "چین", emoji: "🇨🇳", cost: 600, militaryBonus: 40, goldBonus: 0.15, desc: "شریک تجاری قدرتمند شرقی" },
  { id: "germany", name: "آلمان", emoji: "🇩🇪", cost: 800, militaryBonus: 50, goldBonus: 0.2, desc: "فناوری پیشرفته اروپایی" },
  { id: "turkey", name: "ترکیه", emoji: "🇹🇷", cost: 400, militaryBonus: 20, goldBonus: 0.05, desc: "همسایه غربی با روابط نزدیک" },
  { id: "india", name: "هند", emoji: "🇮🇳", cost: 450, militaryBonus: 25, goldBonus: 0.1, desc: "شریک جنوب آسیا" },
  { id: "yemen", name: "یمن", emoji: "🇾🇪", cost: 350, militaryBonus: 15, goldBonus: 0.05, desc: "متحد مقاومت" },
  { id: "lebanon", name: "لبنان", emoji: "🇱🇧", cost: 300, militaryBonus: 12, goldBonus: 0.03, desc: "حزب‌الله متحد" },
  { id: "syria", name: "سوریه", emoji: "🇸🇾", cost: 280, militaryBonus: 10, goldBonus: 0.02, desc: "محور مقاومت" }
];

const dailyMissions = [
  { id: 1, name: "⚔️ رزم‌آور تازه‌کار", desc: "۱ بار جنگ کن", rewardGold: 100, rewardExp: 20, target: 1, type: "battle" },
  { id: 2, name: "🛒 خریدار خود", desc: "۱ سلاح بخر", rewardGold: 150, rewardExp: 15, target: 1, type: "buy" },
  { id: 3, name: "🔧 خودساز ماهر", desc: "۱ سلاح بساز", rewardGold: 200, rewardExp: 30, target: 1, type: "craft" },
  { id: 4, name: "💰 پولدار شو", desc: "۱۰۰۰ تومان جمع کن", rewardGold: 0, rewardExp: 50, target: 1000, type: "wealth" },
  { id: 5, name: "🏆 سپهسالار", desc: "۳ بار جنگ کن", rewardGold: 300, rewardExp: 60, target: 3, type: "battle" },
  { id: 6, name: "🗡️ استاد شمشیر", desc: "۵ سلاح بخر", rewardGold: 500, rewardExp: 80, target: 5, type: "buy" },
  { id: 7, name: "⭐ افسانه", desc: "سطح ۵ برس", rewardGold: 1000, rewardExp: 100, target: 5, type: "level" }
];

const baseWeapons = {
  ancient: [
    { id: "sword", name: "⚔️ شمشیر مفرغین", basePrice: 100, power: 5, desc: "خود مفرغین سپاه هخامنشی" },
    { id: "bow", name: "🏹 کمان پهلوی", basePrice: 150, power: 8, desc: "تیراندازان پارسی" },
    { id: "spear", name: "🔱 نیزه بلند", basePrice: 200, power: 12, desc: "نیزه‌داران جاودان" },
    { id: "chariot", name: "🚀 ارابه جنگی", basePrice: 400, power: 25, desc: "نیروی ویژه کوروش" }
  ],
  islamic: [
    { id: "damascus", name: "🗡️ شمشیر دمشقی", basePrice: 250, power: 15, desc: "فولاد دمشق" },
    { id: "armor", name: "🛡️ زره زنجیرین", basePrice: 350, power: 12, desc: "محافظ سوارگان" },
    { id: "musket", name: "🔫 تفنگ فتیله‌ای", basePrice: 500, power: 25, desc: "تفنگ قورچیان" },
    { id: "cannon", name: "💥 توپ جنگی", basePrice: 800, power: 40, desc: "شکننده استحکامات" }
  ],
  modern: [
    { id: "bruno", name: "🔫 تفنگ برنو", basePrice: 400, power: 20, desc: "تفنگ اصلی ارتش" },
    { id: "maxim", name: "💣 مسلسل ماکسیم", basePrice: 700, power: 35, desc: "ساخت تهران" },
    { id: "fighter", name: "✈️ جنگنده آسمانی", basePrice: 2500, power: 90, desc: "خرید از آلمان" },
    { id: "tank", name: "🚜 تانک", basePrice: 3000, power: 100, desc: "نیروی زرهی" }
  ],
  khomeini: [
    { id: "rpg", name: "💥 آرپی‌جی ۷", basePrice: 500, power: 30, desc: "شکننده زره" },
    { id: "mortar", name: "💣 خمپاره ۶۰ مم", basePrice: 800, power: 45, desc: "پشتیبان آتش" },
    { id: "t72", name: "🚜 تانک T-72", basePrice: 3000, power: 100, desc: "غنیمتی از صدام" },
    { id: "phantom", name: "✈️ اف-۴ فانتوم", basePrice: 4000, power: 130, desc: "بازمانده از قبل انقلاب" }
  ],
  khamenei: [
    { id: "shahab1", name: "🚀 موشک شهاب ۱", basePrice: 2000, power: 80, desc: "موشک کوتاه برد" },
    { id: "mohajer", name: "🛸 پهباد مهاجر", basePrice: 3500, power: 120, desc: "پهپاد تهاجمی" },
    { id: "missile", name: "💥 موشک خرمشهر", basePrice: 6000, power: 200, desc: "موشک بالستیک" },
    { id: "bavar", name: "🛡️ باور ۳۷۳", basePrice: 5000, power: 180, desc: "سامانه پدافندی" }
  ]
};

const craftRecipes = {
  ancient: [{ id: "iron_sword", name: "🔨 شمشیر آهنین", power: 20, price: 200, required: "sword", requiredName: "شمشیر مفرغین", desc: "شمشیر آهنین محکم‌تر" }],
  islamic: [{ id: "heavy_musket", name: "🔨 تفنگ سنگین", power: 40, price: 400, required: "musket", requiredName: "تفنگ فتیله‌ای", desc: "تفنگ با برد بیشتر" }],
  modern: [{ id: "heavy_maxim", name: "🔨 مسلسل سنگین", power: 60, price: 600, required: "maxim", requiredName: "مسلسل ماکسیم", desc: "مسلسل با آتش سنگین" }],
  khomeini: [{ id: "upgrade_rpg", name: "🔨 آرپی‌جی پیشرفته", power: 80, price: 800, required: "rpg", requiredName: "آرپی‌جی ۷", desc: "قدرت ضدزره بیشتر" }],
  khamenei: [{ id: "hypersonic", name: "🔥 موشک هایپرسونیک", power: 300, price: 5000, required: "missile", requiredName: "موشک خرمشهر", desc: "موشک مافوق صوت غیرقابل رهگیری" }]
};

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

const mainMenuImage = "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE";

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
    .text("🔧 کارگاه", "craft")
    .text("🤝 اتحادها", "alliance")
    .row()
    .text("🌍 رویداد", "random_event")
    .text("📋 مأموریت", "missions")
    .row()
    .text("📚 کتابخانه", "library")
    .text("🏆 نامه سروران", "leaderboard")
    .row()
    .text("🔙 منوی اصلی", "back_main");
}

function getBackToGameMenu() {
  return new InlineKeyboard().text("🔙 بازگشت به بازی", "back_to_game");
}

function getRandomNPC(era) { return npcList[era][Math.floor(Math.random() * npcList[era].length)]; }

async function triggerRandomEvent(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  const goldChange = Math.floor(user.gold * (event.effect.gold || 0));
  const militaryChange = event.effect.military || 0;
  
  user.gold = Math.max(0, user.gold + goldChange);
  user.military = Math.max(0, user.military + militaryChange);
  
  updateMissionProgress(ctx.from.id, "wealth");
  
  usersDB.set(ctx.from.id, user);
  
  const goldDisplay = formatGold(user.gold, user.era);
  const sign = goldChange >= 0 ? "+" : "";
  
  await ctx.replyWithPhoto(mainMenuImage, {
    caption: `🌍 **رویداد: ${event.name}**\n\n${event.desc}\n\n💰 طلا: ${sign}${formatGold(Math.abs(goldChange), user.era)}\n⚔️ توان: ${militaryChange >= 0 ? "+" : ""}${militaryChange}\n\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`,
    parse_mode: "Markdown",
    reply_markup: getBackToGameMenu()
  }).catch(err => console.error('Error in triggerRandomEvent:', err));
}

function resetDailyMissions(userId) {
  const user = usersDB.get(userId);
  if (user && (!user.lastMissionReset || Date.now() - user.lastMissionReset > 24 * 60 * 60 * 1000)) {
    user.dailyMissions = dailyMissions.map(m => ({ ...m, progress: 0, completed: false }));
    user.lastMissionReset = Date.now();
    usersDB.set(userId, user);
  }
}

function updateMissionProgress(userId, type, amount = 1) {
  const user = usersDB.get(userId);
  if (!user || !user.dailyMissions) return;
  
  user.dailyMissions = user.dailyMissions.map(m => {
    if (m.completed) return m;
    
    if (m.type === type) {
      const newProgress = Math.min(m.progress + amount, m.target);
      const completed = newProgress >= m.target;
      if (completed && !m.completed) {
        user.gold += m.rewardGold * inflationRates[user.era];
        user.exp += m.rewardExp;
      }
      return { ...m, progress: newProgress, completed };
    }
    
    if (type === "wealth" && m.type === "wealth") {
      const baseGold = user.gold / inflationRates[user.era];
      const newProgress = Math.min(baseGold, m.target);
      const completed = newProgress >= m.target;
      if (completed && !m.completed) {
        user.gold += m.rewardGold * inflationRates[user.era];
        user.exp += m.rewardExp;
      }
      return { ...m, progress: newProgress, completed };
    }
    
    return m;
  });
  
  const level = Math.floor(user.exp / 100) + 1;
  user.dailyMissions = user.dailyMissions.map(m => {
    if (m.completed) return m;
    if (m.type === "level") {
      const newProgress = Math.min(level, m.target);
      const completed = newProgress >= m.target;
      if (completed && !m.completed) {
        user.gold += m.rewardGold * inflationRates[user.era];
        user.exp += m.rewardExp;
      }
      return { ...m, progress: newProgress, completed };
    }
    return m;
  });
  
  usersDB.set(userId, user);
}

async function showLeaderboard(ctx) {
  try {
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
    
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `${getGlassBorder()}\n🏆 **نامه سروران**\n${getGlassBorder()}\n\n${text}`,
      parse_mode: "Markdown",
      reply_markup: getBackToGameMenu()
    });
  } catch (err) {
    console.error('Error in showLeaderboard:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function showStatus(ctx) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) {
      await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
      return;
    }
    
    const king = kings[user.king];
    const goldDisplay = formatGold(user.gold, user.era);
    const level = Math.floor(user.exp / 100) + 1;
    
    updateMissionProgress(ctx.from.id, "wealth");
    
    await ctx.replyWithPhoto(king.image, {
      caption: `${getGlassBorder()}\n📊 **دفترچه ${user.kingName}**\n${getGlassBorder()}\n\n💰 تومان: ${goldDisplay}\n⭐ سطح: ${level}\n📈 تجربه: ${user.exp}\n⚔️ توان رزمی: ${user.military}\n🗡️ خود: ${user.weapon?.name || "ندارد"}\n\n👸 حرمسرا: ${harams[user.king].queens.length} ملکه\n🎁 آیتم ویژه: ${harams[user.king].specialItem}`,
      parse_mode: "Markdown",
      reply_markup: getBackToGameMenu()
    });
  } catch (err) {
    console.error('Error in showStatus:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function showMissions(ctx) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    resetDailyMissions(ctx.from.id);
    updateMissionProgress(ctx.from.id, "wealth");
    
    const text = user.dailyMissions.map(m => 
      `${m.completed ? "✅" : "⏳"} **${m.name}**\n   📊 ${Math.floor(m.progress)}/${m.target} | 🎁 ${m.rewardGold}💰 + ${m.rewardExp}⭐`
    ).join("\n\n");
    
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `📋 **وظیفه روزگار**\n\n${text}`,
      parse_mode: "Markdown",
      reply_markup: getBackToGameMenu()
    });
  } catch (err) {
    console.error('Error in showMissions:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function showAlliances(ctx) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const userAlliances = user.alliances || [];
    const keyboard = new InlineKeyboard();
    let hasAvailableAlliances = false;
    
    alliancesList.forEach(a => {
      if (!userAlliances.includes(a.id)) {
        const costDisplay = formatPrice(a.cost, user.era);
        keyboard.text(`${a.emoji} ${a.name} - ${costDisplay}`, `ally_${a.id}`);
        hasAvailableAlliances = true;
      }
    });
    
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    
    const goldDisplay = formatGold(user.gold, user.era);
    
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `🤝 **پیمان‌بندی**\n\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}\n\n${alliancesList.map(a => 
        `• ${a.emoji} ${a.name}: +${a.militaryBonus} توان, +${Math.floor(a.goldBonus * 100)}% درآمد\n   ${userAlliances.includes(a.id) ? "✅ فعال" : `💰 هزینه: ${formatPrice(a.cost, user.era)}`}`
      ).join("\n\n")}${!hasAvailableAlliances ? "\n\n🎉 تو با همه متحدان پیمان بسته‌ای!" : ""}`,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  } catch (err) {
    console.error('Error in showAlliances:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function createAlliance(ctx, allianceId) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const alliance = alliancesList.find(a => a.id === allianceId);
    if (!alliance) return;
    
    const finalCost = alliance.cost * inflationRates[user.era];
    
    if (user.alliances?.includes(allianceId)) {
      await ctx.reply("❌ این پیمان قبلاً بسته شده!", { reply_markup: getBackToGameMenu() });
      return;
    }
    
    if (user.gold >= finalCost) {
      user.gold -= finalCost;
      user.alliances = user.alliances || [];
      user.alliances.push(allianceId);
      user.military += alliance.militaryBonus;
      
      const bonusGold = Math.floor(user.gold * alliance.goldBonus);
      user.gold += bonusGold;
      
      usersDB.set(ctx.from.id, user);
      
      const goldDisplay = formatGold(user.gold, user.era);
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `✅ پیمان با ${alliance.emoji} ${alliance.name} بسته شد!\n⚔️ توان: +${alliance.militaryBonus}\n💰 جایزه نقدی: ${formatGold(bonusGold, user.era)}\n💰 تومان: ${goldDisplay}`,
        parse_mode: "Markdown",
        reply_markup: getBackToGameMenu()
      });
    } else {
      const need = finalCost - user.gold;
      const needDisplay = formatGold(need, user.era);
      await ctx.reply(`❌ تومان کافی نیست! نیاز به ${needDisplay} بیشتر.`, { reply_markup: getBackToGameMenu() });
    }
  } catch (err) {
    console.error('Error in createAlliance:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function showCraft(ctx) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const recipes = craftRecipes[user.era];
    if (!recipes || recipes.length === 0) {
      await ctx.reply("🔧 در این دوره هیچ خودی قابل ساختن نیست.", { reply_markup: getBackToGameMenu() });
      return;
    }
    
    const keyboard = new InlineKeyboard();
    recipes.forEach(r => {
      const priceDisplay = formatPrice(r.price, user.era);
      const hasRequired = user.weapon?.id === r.required || user.weapon?.id === r.id;
      keyboard.text(`${hasRequired ? "✅" : "🔒"} ${r.name} - ${priceDisplay}`, `craft_${r.id}`);
    });
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    
    const goldDisplay = formatGold(user.gold, user.era);
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `🔧 **کارگاه خودسازی**\n\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}\n🗡️ خود فعلی: ${user.weapon?.name || "ندارد"}\n\n${recipes.map(r => 
        `• ${r.name} - ${formatPrice(r.price, user.era)} (قدرت +${r.power})\n   نیاز: ${r.requiredName}\n   ${r.desc}`
      ).join("\n")}`,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  } catch (err) {
    console.error('Error in showCraft:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function craftWeapon(ctx, recipeId) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const recipe = craftRecipes[user.era]?.find(r => r.id === recipeId);
    if (!recipe) return;
    
    if (user.weapon?.id !== recipe.required) {
      await ctx.reply(`❌ برای ساخت ${recipe.name} به ${recipe.requiredName} نیاز داری!`, { reply_markup: getBackToGameMenu() });
      return;
    }
    
    const finalPrice = recipe.price * inflationRates[user.era];
    if (user.gold >= finalPrice) {
      user.gold -= finalPrice;
      if (user.weapon) user.military -= user.weapon.power;
      user.weapon = { id: recipe.id, name: recipe.name, power: recipe.power };
      user.military += recipe.power;
      
      usersDB.set(ctx.from.id, user);
      updateMissionProgress(ctx.from.id, "craft");
      updateMissionProgress(ctx.from.id, "wealth");
      
      const goldDisplay = formatGold(user.gold, user.era);
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `🔨 **${recipe.name}** ساخته شد!\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`,
        parse_mode: "Markdown",
        reply_markup: getBackToGameMenu()
      });
    } else {
      const need = finalPrice - user.gold;
      const needDisplay = formatGold(need, user.era);
      await ctx.reply(`❌ تومان کافی نیست! نیاز به ${needDisplay} بیشتر.`, { reply_markup: getBackToGameMenu() });
    }
  } catch (err) {
    console.error('Error in craftWeapon:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function showLibrary(ctx) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const books = {
      ancient: [
        { id: "avesta", name: "📖 اوستا", desc: "کتاب مقدس زرتشتیان", price: 200, power: 5 },
        { id: "bisotun", name: "📜 کتیبه بیستون", desc: "کتیبه داریوش بزرگ", price: 300, power: 8 }
      ],
      islamic: [
        { id: "shahnameh", name: "📖 شاهنامه فردوسی", desc: "حماسه ملی ایران", price: 800, power: 20 },
        { id: "masnavi", name: "📜 مثنوی مولوی", desc: "دفتر شعر عرفانی", price: 600, power: 15 }
      ],
      modern: [
        { id: "buf_kur", name: "📖 بوف کور", desc: "صادق هدایت", price: 300, power: 8 }
      ],
      khomeini: [
        { id: "sahifeh", name: "📖 صحیفه نور", desc: "سخنان امام خمینی", price: 1000, power: 25 }
      ],
      khamenei: [
        { id: "tarh_koli", name: "📖 طرح کلی اندیشه اسلامی", desc: "کتاب رهبری", price: 5000000, power: 100 }
      ]
    };
    
    const bookList = books[user.era] || [];
    const ownedBooks = user.ownedBooks || [];
    const goldDisplay = formatGold(user.gold, user.era);
    const keyboard = new InlineKeyboard();
    
    bookList.forEach((b, idx) => {
      const owned = ownedBooks.includes(b.id);
      keyboard.text(`${owned ? "✅" : "📖"} ${b.name} - ${formatPrice(b.price, user.era)}`, `buy_book_${idx}`);
    });
    
    keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
    
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `📚 **کتابخانه**\n\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}\n\n${bookList.map(b => 
        `• ${ownedBooks.includes(b.id) ? "✅" : "📖"} ${b.name} - ${formatPrice(b.price, user.era)} (قدرت +${b.power})\n   ${b.desc}`
      ).join("\n")}`,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  } catch (err) {
    console.error('Error in showLibrary:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

async function buyBook(ctx, bookIdx) {
  try {
    const user = usersDB.get(ctx.from.id);
    if (!user) return;
    
    const books = {
      ancient: [
        { id: "avesta", name: "📖 اوستا", price: 200, power: 5 },
        { id: "bisotun", name: "📜 کتیبه بیستون", price: 300, power: 8 }
      ],
      islamic: [
        { id: "shahnameh", name: "📖 شاهنامه", price: 800, power: 20 },
        { id: "masnavi", name: "📜 مثنوی", price: 600, power: 15 }
      ],
      modern: [
        { id: "buf_kur", name: "📖 بوف کور", price: 300, power: 8 }
      ],
      khomeini: [
        { id: "sahifeh", name: "📖 صحیفه نور", price: 1000, power: 25 }
      ],
      khamenei: [
        { id: "tarh_koli", name: "📖 طرح کلی", price: 5000000, power: 100 }
      ]
    };
    
    const book = books[user.era]?.[bookIdx];
    if (!book) return;
    
    user.ownedBooks = user.ownedBooks || [];
    if (user.ownedBooks.includes(book.id)) {
      await ctx.reply("❌ این کتاب رو قبلاً خریدی!", { reply_markup: getBackToGameMenu() });
      return;
    }
    
    const finalPrice = book.price * inflationRates[user.era];
    if (user.gold >= finalPrice) {
      user.gold -= finalPrice;
      user.military += book.power;
      user.ownedBooks.push(book.id);
      
      usersDB.set(ctx.from.id, user);
      updateMissionProgress(ctx.from.id, "wealth");
      
      const goldDisplay = formatGold(user.gold, user.era);
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `✅ **${book.name}** خریداری شد!\n📖 ${book.desc}\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`,
        parse_mode: "Markdown",
        reply_markup: getBackToGameMenu()
      });
    } else {
      const need = finalPrice - user.gold;
      const needDisplay = formatGold(need, user.era);
      await ctx.reply(`❌ تومان کافی نیست! نیاز به ${needDisplay} بیشتر.`, { reply_markup: getBackToGameMenu() });
    }
  } catch (err) {
    console.error('Error in buyBook:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.", { reply_markup: getBackToGameMenu() });
  }
}

bot.command("start", async (ctx) => {
  try {
    await ctx.replyWithPhoto(mainMenuImage, {
      caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
      parse_mode: "Markdown",
      reply_markup: getMainMenu()
    });
  } catch (err) {
    console.error('Error in start command:', err);
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.");
  }
});

bot.command("admin_panel", async (ctx) => {
  try {
    if (!ADMINS.includes(ctx.from.id)) {
      await ctx.reply("❌ دسترسی غیرمجاز!");
      return;
    }
    
    const keyboard = new InlineKeyboard()
      .text("💰 هدیه سکه", "admin_give_gold")
      .text("🏆 فول کردن", "admin_full_upgrade")
      .row()
      .text("📊 لیست کاربران", "admin_list_users")
      .text("🔙 بستن", "admin_close");
      
    await ctx.reply("👑 **پنل ادمین مخفی**", { parse_mode: "Markdown", reply_markup: keyboard });
  } catch (err) {
    console.error('Error in admin_panel:', err);
  }
});

bot.on("callback_query:data", async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    await ctx.answerCallbackQuery().catch(() => {});

    // منوهای انتخاب شاه با پیام جدید به جای editMessageMedia
    if (data === "cat_ancient") {
      const keyboard = new InlineKeyboard()
        .text("کوروش بزرگ", "select_cyrus")
        .text("داریوش بزرگ", "select_darius")
        .row()
        .text("انوشیروان", "select_anushirvan")
        .row()
        .text("🔙 منوی اصلی", "back_main");
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: "🏛️ **شاهان هخامنشی و ساسانی**\n\nیکی از شاهان را برگزین:",
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }
    else if (data === "cat_islamic") {
      const keyboard = new InlineKeyboard()
        .text("شاه عباس", "select_shahabbas")
        .text("نادرشاه", "select_nader")
        .row()
        .text("کریم‌خان", "select_karim")
        .row()
        .text("🔙 منوی اصلی", "back_main");
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: "⚔️ **شاهان صفوی و افشار**\n\nیکی از شاهان را برگزین:",
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }
    else if (data === "cat_modern") {
      const keyboard = new InlineKeyboard()
        .text("رضاشاه", "select_rezashah")
        .text("محمدرضا", "select_mohammadreza")
        .row()
        .text("🔙 منوی اصلی", "back_main");
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: "🏭 **شاهان پهلوی**\n\nیکی از شاهان را برگزین:",
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }
    else if (data === "cat_republic") {
      const keyboard = new InlineKeyboard()
        .text("امام خمینی", "select_khomeini")
        .text("آیت‌الله خامنه‌ای", "select_khamenei")
        .row()
        .text("🔙 منوی اصلی", "back_main");
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: "🕌 **رهبران جمهوری اسلامی**\n\nیکی از رهبران را برگزین:",
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }

    else if (data.startsWith("select_")) {
      const kingId = data.replace("select_", "");
      const king = kings[kingId];
      if (!king) return;
      
      const baseGold = king.era === "khamenei" ? 500000000 : (king.era === "khomeini" ? 5000 : 500);
      usersDB.set(userId, {
        king: kingId,
        kingName: king.name,
        era: king.era,
        realName: ctx.from.first_name,
        gold: baseGold,
        exp: 0,
        military: 50,
        weapon: null,
        alliances: [],
        ownedBooks: [],
        dailyMissions: dailyMissions.map(m => ({ ...m, progress: 0, completed: false })),
        lastMissionReset: Date.now()
      });
      
      const goldDisplay = formatGold(baseGold, king.era);
      await ctx.replyWithPhoto(king.image, {
        caption: `${getGlassBorder()}\n✅ **${king.name}** برگزیده شد!\n${getGlassBorder()}\n\n💰 تومان: ${goldDisplay}\n⚔️ توان رزمی: ۵۰`,
        parse_mode: "Markdown",
        reply_markup: getGameMenu()
      });
      return;
    }

    else if (data === "haram") {
      const user = usersDB.get(userId);
      if (!user) {
        await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
        return;
      }
      
      const haram = harams[user.king];
      if (!haram || haram.queens.length === 0) {
        await ctx.replyWithPhoto(mainMenuImage, {
          caption: `👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram?.specialItem || "ندارد"}\n\nهیچ ملکه‌ای یافت نشد.`,
          parse_mode: "Markdown",
          reply_markup: getBackToGameMenu()
        });
        return;
      }
      
      const keyboard = new InlineKeyboard();
      haram.queens.forEach((q, idx) => {
        keyboard.text(q.name, `queen_${user.king}_${idx}`);
      });
      keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
      
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `👸 **حرمسرای ${user.kingName}**\n\n🎁 آیتم ویژه: ${haram.specialItem}\n\n👩 ملکه‌ها:\n${haram.queens.map(q => `• ${q.name}: ${q.desc}`).join("\n")}`,
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }

    else if (data.startsWith("queen_")) {
      const parts = data.split("_");
      const kingId = parts[1];
      const queenIdx = parseInt(parts[2]);
      const queen = harams[kingId]?.queens[queenIdx];
      if (!queen) return;
      
      await ctx.replyWithPhoto(queen.image, {
        caption: `👸 **${queen.name}**\n\n📖 ${queen.desc}\n\n💝 وفادار به ${kings[kingId].name}\n\n🎁 آیتم ویژه: ${harams[kingId].specialItem}`,
        parse_mode: "Markdown",
        reply_markup: getBackToGameMenu()
      });
      return;
    }

    else if (data === "shop") {
      const user = usersDB.get(userId);
      if (!user) {
        await ctx.reply("❌ ابتدا یک پادشاه انتخاب کن!", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
        return;
      }
      
      const weapons = baseWeapons[user.era];
      const goldDisplay = formatGold(user.gold, user.era);
      const keyboard = new InlineKeyboard();
      
      weapons.forEach(w => {
        keyboard.text(`${w.name} - ${formatPrice(w.basePrice, user.era)}`, `buy_${w.id}`);
      });
      keyboard.row().text("🔙 بازگشت به بازی", "back_to_game");
      
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `🪞 **بازارچه شیشه‌ای**\n\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}\n\n${weapons.map(w => `• ${w.name} - ${formatPrice(w.basePrice, user.era)} (قدرت +${w.power})\n   ${w.desc}`).join("\n")}`,
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }

    else if (data.startsWith("buy_")) {
      const user = usersDB.get(userId);
      if (!user) return;
      
      const weaponId = data.replace("buy_", "");
      const weapon = baseWeapons[user.era]?.find(w => w.id === weaponId);
      if (!weapon) return;
      
      const finalPrice = weapon.basePrice * inflationRates[user.era];
      if (user.gold >= finalPrice) {
        user.gold -= finalPrice;
        if (user.weapon) user.military -= user.weapon.power;
        user.weapon = { id: weapon.id, name: weapon.name, power: weapon.power };
        user.military += weapon.power;
        
        usersDB.set(userId, user);
        updateMissionProgress(userId, "buy");
        updateMissionProgress(userId, "wealth");
        
        const goldDisplay = formatGold(user.gold, user.era);
        await ctx.replyWithPhoto(mainMenuImage, {
          caption: `✅ **${weapon.name}** خریداری شد!\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`,
          parse_mode: "Markdown",
          reply_markup: getBackToGameMenu()
        });
      } else {
        const need = finalPrice - user.gold;
        const needDisplay = formatGold(need, user.era);
        await ctx.reply(`❌ تومان کافی نیست! نیاز به ${needDisplay} بیشتر.`, { reply_markup: getBackToGameMenu() });
      }
      return;
    }

    else if (data === "battle") {
      const user = usersDB.get(userId);
      if (!user) return;
      
      const enemy = getRandomNPC(user.era);
      const playerPower = user.military + (user.weapon?.power || 0);
      const luckFactor = Math.random() * 30 - 10;
      const isWin = playerPower + luckFactor > 50;
      
      const reward = isWin
        ? { gold: Math.floor(100 * inflationRates[user.era]), exp: 30 }
        : { gold: Math.floor(10 * inflationRates[user.era]), exp: 5 };
      
      user.gold += reward.gold;
      user.exp += reward.exp;
      
      usersDB.set(userId, user);
      updateMissionProgress(userId, "battle");
      updateMissionProgress(userId, "wealth");
      updateMissionProgress(userId, "level");
      
      const goldDisplay = formatGold(user.gold, user.era);
      const rewardDisplay = formatGold(reward.gold, user.era);
      
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `${isWin ? "🎉 پیروزی بزرگ!" : "💔 شکست ننگین!"}\n\n⚔️ نبرد با ${enemy}\n💰 +${rewardDisplay} تومان\n⭐ +${reward.exp} تجربه\n💰 تومان: ${goldDisplay}\n⚔️ توان: ${user.military}`,
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard()
          .text("⚔️ جنگ دوباره", "battle")
          .text("🔙 بازگشت به بازی", "back_to_game")
      });
      return;
    }

    else if (data === "craft") {
      await showCraft(ctx);
      return;
    }
    else if (data.startsWith("craft_")) {
      await craftWeapon(ctx, data.replace("craft_", ""));
      return;
    }
    else if (data === "alliance") {
      await showAlliances(ctx);
      return;
    }
    else if (data.startsWith("ally_")) {
      await createAlliance(ctx, data.replace("ally_", ""));
      return;
    }
    else if (data === "random_event") {
      await triggerRandomEvent(ctx);
      return;
    }
    else if (data === "missions") {
      await showMissions(ctx);
      return;
    }
    else if (data === "library") {
      await showLibrary(ctx);
      return;
    }
    else if (data.startsWith("buy_book_")) {
      await buyBook(ctx, parseInt(data.replace("buy_book_", "")));
      return;
    }
    else if (data === "status") {
      await showStatus(ctx);
      return;
    }
    else if (data === "leaderboard") {
      await showLeaderboard(ctx);
      return;
    }

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
        parse_mode: "Markdown",
        reply_markup: getGameMenu()
      });
      return;
    }

    else if (data === "back_main") {
      await ctx.replyWithPhoto(mainMenuImage, {
        caption: `${getGlassBorder()}\n🪞 ⭐ فروغ جاودان ⭐ 🪞\n${getGlassBorder()}\n\n📜 یک دسته از شاهان را برگزین:`,
        parse_mode: "Markdown",
        reply_markup: getMainMenu()
      });
      return;
    }

    else if (data === "admin_give_gold" && ADMINS.includes(userId)) {
      await ctx.editMessageText("👑 ایدی کاربر و مقدار سکه رو بفرست (مثال: 123456789 1000)");
      usersDB.set(`admin_${userId}_action`, "waiting_for_gold");
      return;
    }
    else if (data === "admin_full_upgrade" && ADMINS.includes(userId)) {
      await ctx.editMessageText("👑 ایدی کاربر رو بفرست تا فول شود:");
      usersDB.set(`admin_${userId}_action`, "waiting_for_full");
      return;
    }
    else if (data === "admin_list_users" && ADMINS.includes(userId)) {
      const list = Array.from(usersDB.entries())
        .filter(([k]) => !String(k).includes("admin_"))
        .map(([id, d]) => `${d.realName || d.kingName} - ${id}`)
        .join("\n");
      await ctx.editMessageText(`📊 لیست کاربران:\n${list || "هیچ"}`, { reply_markup: new InlineKeyboard().text("🔙 بستن", "admin_close") });
      return;
    }
    else if (data === "admin_close" && ADMINS.includes(userId)) {
      await ctx.deleteMessage().catch(() => {});
      return;
    }
  } catch (err) {
    console.error('Error in callback_query:', err);
    try {
      await ctx.reply("❌ خطایی رخ داد. لطفاً /start رو بزن.", { reply_markup: new InlineKeyboard().text("🔙 منوی اصلی", "back_main") });
    } catch (e) {
      console.error('Error sending error message:', e);
    }
  }
});

bot.on("message:text", async (ctx) => {
  try {
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
        target.gold += amount * inflationRates[target.era];
        usersDB.set(targetId, target);
        await ctx.reply(`✅ ${amount} میلیون تومان به کاربر ${targetId} اضافه شد.`);
      } else {
        await ctx.reply("❌ فرمت اشتباه! مثال: 123456789 1000");
      }
      usersDB.delete(`admin_${userId}_action`);
    } else if (action === "waiting_for_full") {
      const targetId = parseInt(text);
      const target = usersDB.get(targetId);
      
      if (target) {
        target.gold = target.era === "khamenei" ? 10000000000 : 10000;
        target.exp = 5000;
        target.military = 1000;
        target.weapon = { id: "ultimate", name: "سلاح نهایی", power: 500 };
        target.alliances = alliancesList.map(a => a.id);
        usersDB.set(targetId, target);
        await ctx.reply(`✅ کاربر ${targetId} فول شد!`);
      } else {
        await ctx.reply("❌ کاربر پیدا نشد!");
      }
      usersDB.delete(`admin_${userId}_action`);
    }
  } catch (err) {
    console.error('Error in message handler:', err);
  }
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

if (process.env.RAILWAY_ENV === "true") {
  bot.start({ allowed_updates: ["message", "callback_query"] });
} else {
  bot.start();
}

console.log("🎮 بازی بقای باستانی - نسخه اصلاح شده نهایی روشن شد...");