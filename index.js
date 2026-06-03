const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// ==================== دیتابیس کاربران ====================
const usersDB = new Map();

// ==================== ادمین‌ها ====================
const ADMINS = [5576592239];

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

// ==================== عکس نقشه ایران ====================
const mapImage = "AgACAgQAAxkBAAEqEn1qIIS1Cpu26NucbgH1ankioQm-9AACHRBrG4APAVHcgdJ7gFsdyAEAAwIAA3gAAzsE";

// ==================== انیمیشن‌ها ====================
const animations = {
  readyToFight: "CgACAgQAAxkBAAEqETVqIGusPLj-Qq0nd73vMUkiRiwY0wACTwYAArMmNVBb8-ES6JPGHzsE",
  cyrusAnimation: "CgACAgQAAxkBAAEqEUpqIG2RakeSSSNpKkC-3UfiGpoEYwACGQMAAt5HJVNbjZO7dqLofTsE",
  missileAnimation: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA",
  explosion: "CgACAgQAAxkBAAEqEo9qIIXeZFa4e4pPIR67chxvh9D2XwACbwMAAlhtBFOyrDZljZRTyjsE",
  levelUp: "CgACAgQAAxkBAAEqErVqIIjJ-bv5gGzhZo8th5sZ3n1dhwACdSMAAvQVAVEMU_-bjeLRCjsE",
  defeat: "CgACAgQAAxkBAAEqEu1qII15onal3AqvYITzkqdm5MI00gACeyMAAvQVAVF1fh97_aRKYDsE",
  victory: "CgACAgQAAxkBAAEqEw1qIJDV8z7vf7hG_oP0l4aaTPm7ZQACgCMAAvQVAVEjsoZnsyyDgTsE"
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

// ==================== ساخت سلاح ====================
const craftRecipes = {
  ancient: [
    { id: "iron_sword", name: "شمشیر آهنی", power: 20, price: 200, requiredItem: "sword", requiredItemName: "شمشیر مفرغی", desc: "شمشیر آهنی محکم‌تر" },
    { id: "composite_bow", name: "کمان کامپوزیت", power: 25, price: 300, requiredItem: "bow", requiredItemName: "تیر و کمان", desc: "کمان چندلایه" }
  ],
  islamic: [
    { id: "upgrade_musket", name: "تفنگ سرپر", power: 40, price: 400, requiredItem: "musket", requiredItemName: "تفنگ فتیله‌ای", desc: "تفنگ با دقت بالا" },
    { id: "big_cannon", name: "توپ جنگی بزرگ", power: 60, price: 500, requiredItem: "cannon", requiredItemName: "توپ‌خانه", desc: "توپ سنگین" }
  ],
  modern: [
    { id: "heavy_maxim", name: "مسلسل برنو", power: 50, price: 600, requiredItem: "maxim", requiredItemName: "مسلسل ماکسیم", desc: "مسلسل سنگین" }
  ],
  khomeini: [
    { id: "fateh_missile", name: "موشک فاتح", power: 80, price: 800, requiredItem: "collage", requiredItemName: "کلاژ", desc: "موشک کوتاه برد" }
  ],
  khamenei: [
    { id: "nuclear_missile", name: "موشک هسته‌ای عماد", power: 300, price: 1000, requiredItem: "shahab3", requiredItemName: "موشک شهاب ۳", desc: "قابلیت حمل کلاهک هسته‌ای" },
    { id: "shahad136", name: "پهباد شاهد ۱۳۶", power: 250, price: 1500, requiredItem: "mohajer", requiredItemName: "پهباد مهاجر", desc: "پهباد شناور" },
    { id: "bavar_advance", name: "باور ۳۷۳ پیشرفته", power: 400, price: 2000, requiredItem: "bavar", requiredItemName: "سامانه باور ۳۷۳", desc: "پدافند هوایی" },
    { id: "icbm", name: "موشک قاره‌پیما آرش", power: 500, price: 3000, requiredItem: "khorramshahr", requiredItemName: "موشک خرمشهر", desc: "برد ۱۰۰۰۰ کیلومتر" }
  ]
};

// ==================== NPCها ====================
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
  { name: "چنگیز مغول", power: 90, era: "ancient", desc: "تهاجم مغول" },
  { name: "تیمور لنگ", power: 88, era: "islamic", desc: "تهاجم تیموری" },
  { name: "هلاکوخان", power: 85, era: "islamic", desc: "تهاجم مغول" }
];

// ==================== مأموریت‌های روزانه ====================
const dailyMissions = [
  { id: 1, name: "⚔️ جنگجوی تازه‌کار", desc: "۱ بار جنگ کن", rewardGold: 100, rewardExp: 20, target: 1, type: "battle" },
  { id: 2, name: "🛒 خریدار حرفه‌ای", desc: "۱ سلاح بخر", rewardGold: 150, rewardExp: 15, target: 1, type: "buy" },
  { id: 3, name: "🔧 سازنده ماهر", desc: "۱ سلاح بساز", rewardGold: 200, rewardExp: 30, target: 1, type: "craft" },
  { id: 4, name: "💰 پولدار شو", desc: "۱۰۰۰ سکه جمع کن", rewardGold: 0, rewardExp: 50, target: 1000, type: "wealth" },
  { id: 5, name: "🏆 سردار جنگ", desc: "۳ بار جنگ کن", rewardGold: 300, rewardExp: 60, target: 3, type: "battle" }
];

// ==================== رویدادهای تاریخی ====================
const randomEvents = [
  { name: "🌾 قحطی بزرگ", effect: { gold: -150, military: -10 }, desc: "قحطی باعث کاهش درآمد شد" },
  { name: "💎 کشف معدن طلا", effect: { gold: 500, military: 0 }, desc: "معدن طلا پیدا شد!" },
  { name: "🤝 اتحاد با همسایگان", effect: { gold: 50, military: 30 }, desc: "اتحاد جدید قدرت نظامی رو افزایش داد" },
  { name: "🌪️ طوفان سهمگین", effect: { gold: -80, military: -15 }, desc: "طوفان به زیرساخت‌ها آسیب زد" },
  { name: "🎓 عصر طلایی علم", effect: { gold: 100, military: 20 }, desc: "پیشرفت علمی باعث رشد شد" }
];

// ==================== استان‌ها ====================
const provinces = [
  { id: "tehran", name: "تهران", baseIncome: 100, controlled: false, militaryNeeded: 50, owner: null },
  { id: "isfahan", name: "اصفهان", baseIncome: 80, controlled: false, militaryNeeded: 40, owner: null },
  { id: "shiraz", name: "شیراز", baseIncome: 70, controlled: false, militaryNeeded: 35, owner: null },
  { id: "tabriz", name: "تبریز", baseIncome: 60, controlled: false, militaryNeeded: 30, owner: null },
  { id: "mashhad", name: "مشهد", baseIncome: 90, controlled: false, militaryNeeded: 45, owner: null }
];

// ==================== اتحادها ====================
const alliances = [
  { id: "russia", name: "🇷🇺 روسیه", cost: 500, militaryBonus: 30, goldBonus: 20, desc: "اتحاد استراتژیک" },
  { id: "china", name: "🇨🇳 چین", cost: 600, militaryBonus: 40, goldBonus: 30, desc: "شریک تجاری" },
  { id: "germany", name: "🇩🇪 آلمان", cost: 800, militaryBonus: 50, goldBonus: 40, desc: "فناوری پیشرفته" }
];

// ==================== نام دوره‌ها ====================
const eraNames = {
  ancient: "باستان", islamic: "اسلامی", modern: "معاصر", khomeini: "دفاع مقدس", khamenei: "موشکی"
};

// ==================== توابع کمکی ====================
function getRandomNPC(era) {
  const filtered = npcList.filter(n => n.era === era);
  return filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : { name: "دشمن ناشناس", power: 50, era: era, desc: "نیروی مهاجم" };
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
        user.gold += m.rewardGold;
        user.exp += m.rewardExp;
      }
      return { ...m, progress: newProgress, completed };
    }
    if (type === "wealth" && m.type === "wealth") {
      const newProgress = Math.min(user.gold, m.target);
      return { ...m, progress: newProgress, completed: newProgress >= m.target };
    }
    return m;
  });
  usersDB.set(userId, user);
}

async function triggerRandomEvent(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  user.gold = Math.max(0, user.gold + (event.effect.gold || 0));
  user.military = Math.max(0, user.military + (event.effect.military || 0));
  usersDB.set(ctx.from.id, user);
  await ctx.replyWithAnimation(animations.explosion, { caption: `🌍 **رویداد: ${event.name}**\n\n${event.desc}\n\n💰 سکه: ${user.gold}\n⚔️ قدرت: ${user.military}`, parse_mode: "Markdown" });
}

// ==================== منوی اصلی ====================
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ باستان", "cat_ancient")
    .text("⚔️ اسلامی", "cat_islamic")
    .row()
    .text("🏭 معاصر", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");

  await ctx.replyWithPhoto(categoryImages.ancient, {
    caption: "🏛️ **بازی بقای باستانی**\n\nبه جمع پادشاهان و رهبران تاریخ ایران خوش آمدی.\n\n📜 یک دسته رو انتخاب کن:",
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== نمایش رهبران ====================
async function showCategory(ctx, categoryId) {
  let leadersList = [], title = "", image = "";
  if (categoryId === "ancient") { leadersList = ["cyrus", "darius", "anushirvan"]; title = "🏛️ پادشاهان باستان"; image = categoryImages.ancient; }
  else if (categoryId === "islamic") { leadersList = ["shahabbas", "nader", "karim"]; title = "⚔️ پادشاهان اسلامی"; image = categoryImages.islamic; }
  else if (categoryId === "modern") { leadersList = ["rezashah", "mohammadreza"]; title = "🏭 پادشاهان معاصر"; image = categoryImages.modern; }
  else if (categoryId === "republic") { leadersList = ["khomeini", "khamenei"]; title = "🕌 رهبران جمهوری اسلامی"; image = categoryImages.republic; }

  const keyboard = new InlineKeyboard();
  leadersList.forEach(k => keyboard.text(leaders[k].name, `temp_${k}`));
  keyboard.row().text("🔙 بازگشت", "back_main");

  await ctx.editMessageMedia({ type: "photo", media: image, caption: `📜 **${title}**\n\n` + leadersList.map(k => `• **${leaders[k].name}**\n   ${leaders[k].desc}`).join("\n"), parse_mode: "Markdown" }, { reply_markup: keyboard });
}

async function showLeaderDetail(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  const backCat = ["khomeini", "khamenei"].includes(leader.era) ? "republic" : leader.era;
  const keyboard = new InlineKeyboard().text("✅ انتخاب", `select_${leaderKey}`).text("🔙 بازگشت", `back_cat_${backCat}`);
  await ctx.editMessageMedia({ type: "photo", media: leader.image, caption: `👑 **${leader.name}**\n\n📖 ${leader.desc}\n\n❌ انتخاب می‌کنی؟`, parse_mode: "Markdown" }, { reply_markup: keyboard });
}

async function showGameMenu(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  const user = usersDB.get(ctx.from.id);
  const keyboard = new InlineKeyboard()
    .text("🛒 فروشگاه", "open_shop").text("🔧 ساخت", "craft_menu")
    .row().text("⚔️ جنگ", "battle").text("📊 وضعیت", "my_status")
    .row().text("📋 مأموریت", "show_missions").text("🌍 رویداد", "random_event")
    .row().text("🏆 لیدربورد", "show_leaderboard").text("🗺️ نقشه", "show_map")
    .row().text("🤝 اتحادها", "show_alliances").text("⭐ مهارت‌ها", "show_skills")
    .row().text("🔄 تغییر رهبر", "change_leader");
  if (ADMINS.includes(ctx.from.id)) keyboard.row().text("👑 پنل ادمین", "admin_panel_secret");

  await ctx.replyWithPhoto(leader.image, {
    caption: `✅ **${leader.name}** انتخاب شد!\n\n📜 ${eraNames[leader.era]}\n💰 سکه: ${user.gold}\n⚔️ قدرت: ${user.military}\n🗡️ سلاح: ${user.weapon?.name || "بدون سلاح"}`,
    parse_mode: "Markdown", reply_markup: keyboard
  });
}

// ==================== فروشگاه و ساخت ====================
async function showShop(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const weapons = weaponsByEra[user.era];
  const keyboard = new InlineKeyboard();
  weapons.forEach(w => keyboard.text(`${w.name} - ${w.price}💰`, `buy_${w.id}`));
  keyboard.row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🛒 **فروشگاه**\n💰 ${user.gold} سکه | ⚔️ ${user.military} قدرت\n\n` + weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
}

async function showCraftMenu(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const recipes = craftRecipes[user.era];
  if (!recipes?.length) { await ctx.reply("❌ در این دوره سلاحی قابل ساخت نیست."); return; }
  const keyboard = new InlineKeyboard();
  recipes.forEach(r => keyboard.text(`${r.name} - ${r.price}💰`, `craft_${r.id}`));
  keyboard.row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🔧 **کارگاه ساخت**\n💰 ${user.gold} سکه\n\n` + recipes.map(r => `• ${r.name} - ${r.price}💰 (قدرت +${r.power})\n   نیاز: ${r.requiredItemName}`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
}

async function craftWeapon(ctx, recipeId) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const recipe = craftRecipes[user.era]?.find(r => r.id === recipeId);
  if (!recipe) return;
  if (user.weapon?.id !== recipe.requiredItem) { await ctx.reply(`❌ به ${recipe.requiredItemName} نیاز داری!`); return; }
  if (user.gold < recipe.price) { await ctx.reply(`❌ سکه کافی نیست!`); return; }
  user.gold -= recipe.price;
  if (user.weapon) user.military -= user.weapon.power;
  user.weapon = { id: recipe.id, name: recipe.name, power: recipe.power };
  user.military += recipe.power;
  usersDB.set(ctx.from.id, user);
  updateMissionProgress(ctx.from.id, "craft");
  await ctx.replyWithAnimation(animations.levelUp, { caption: `✅ ${recipe.name} ساخته شد!\n💰 ${user.gold} سکه\n⚔️ ${user.military} قدرت`, parse_mode: "Markdown" });
}

// ==================== جنگ ====================
async function requestBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const npc = getRandomNPC(user.era);
  usersDB.set(ctx.from.id + "_pending", { npc });
  const keyboard = new InlineKeyboard().text("✅ بله", "confirm_battle").text("❌ نه", "cancel_battle");
  await ctx.reply(`⚔️ **دشمن: ${npc.name}**\n📖 ${npc.desc}\n💪 قدرت: ${npc.power}\n🏆 قدرت تو: ${user.military + (user.weapon?.power || 0)}\n\nجنگ کنی؟`, { parse_mode: "Markdown", reply_markup: keyboard });
}

async function confirmBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  const pending = usersDB.get(ctx.from.id + "_pending");
  if (!user || !pending) return;
  const npc = pending.npc;
  const playerPower = user.military + (user.weapon?.power || 0);
  const enemyPower = npc.power + Math.floor(Math.random() * 20) - 10;
  const result = playerPower + (Math.random() * 40 - 15) > enemyPower;
  const reward = result ? { gold: 300, exp: 50, military: 10 } : { gold: 30, exp: 5, military: -5 };
  user.gold = Math.max(0, user.gold + reward.gold);
  user.exp += reward.exp;
  user.military = Math.max(0, user.military + reward.military);
  usersDB.set(ctx.from.id, user);
  usersDB.delete(ctx.from.id + "_pending");
  updateMissionProgress(ctx.from.id, "battle");
  
  const anim = result ? animations.victory : animations.defeat;
  await ctx.replyWithAnimation(anim, { caption: `⚔️ **نبرد با ${npc.name}**\n${result ? "🎉 پیروزی!" : "💔 شکست!"}\n💰 سکه: ${reward.gold}\n⭐ تجربه: +${reward.exp}`, parse_mode: "Markdown" });
  
  const keyboard = new InlineKeyboard().text("🛒 فروشگاه", "open_shop").text("⚔️ جنگ جدید", "battle").text("🔙 منوی اصلی", "back_to_game");
  await ctx.reply("اداره جنگ:", { reply_markup: keyboard });
}

async function cancelBattle(ctx) {
  usersDB.delete(ctx.from.id + "_pending");
  await ctx.reply("🏃‍♂️ فرار کردی!");
}

// ==================== وضعیت ====================
async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const level = Math.floor(user.exp / 100) + 1;
  await ctx.replyWithPhoto(leaders[user.leader].image, {
    caption: `📊 **${user.leaderName}**\n💰 سکه: ${user.gold}\n⭐ سطح: ${level}\n📈 تجربه: ${user.exp}/${level*100}\n⚔️ قدرت: ${user.military}\n🗡️ سلاح: ${user.weapon?.name || "بدون"}`,
    parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game")
  });
}

// ==================== لیدربورد ====================
async function showLeaderboard(ctx) {
  const users = Array.from(usersDB.entries()).filter(([key]) => !String(key).includes("admin_") && !String(key).includes("pending"));
  const sorted = users.sort((a, b) => b[1].military - a[1].military).slice(0, 10);
  const text = sorted.map(([id, d], i) => `${i+1}. 👑 ${d.leaderName}\n   💰${d.gold} ⚔️${d.military}`).join("\n\n");
  const keyboard = new InlineKeyboard().text("🏆 نظامی", "lb_military").text("💰 سکه", "lb_gold").row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🏆 **قدرتمندترین رهبران**\n\n${text || "هیچ کاربری"}\n`, { parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== نقشه ====================
async function showMap(ctx) {
  const user = usersDB.get(ctx.from.id);
  const userIncome = provinces.filter(p => p.owner === ctx.from.id).reduce((s, p) => s + p.baseIncome, 0);
  const keyboard = new InlineKeyboard().text("⚔️ حمله", "attack_province").text("💰 مالیات", "collect_tax").row().text("🔙 بازگشت", "back_to_game");
  await ctx.replyWithPhoto(mapImage, { caption: `🗺️ **نقشه ایران**\n💰 درآمد روزانه: ${userIncome} سکه\n⚔️ قدرت: ${user.military}`, parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== اتحادها ====================
async function showAlliances(ctx) {
  const user = usersDB.get(ctx.from.id);
  const userAlliances = user.alliances || [];
  const keyboard = new InlineKeyboard();
  alliances.forEach(a => { if (!userAlliances.includes(a.id)) keyboard.text(`اتحاد ${a.name} - ${a.cost}💰`, `ally_${a.id}`); });
  keyboard.row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🤝 **اتحادها**\n💰 سکه: ${user.gold}\n\n` + alliances.map(a => `• ${a.name}: +${a.militaryBonus} قدرت, +${a.goldBonus} سکه`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
}

async function createAlliance(ctx, allianceId) {
  const user = usersDB.get(ctx.from.id);
  const alliance = alliances.find(a => a.id === allianceId);
  if (!alliance || user.gold < alliance.cost) { await ctx.reply("❌ سکه کافی نیست!"); return; }
  user.gold -= alliance.cost;
  user.alliances = user.alliances || [];
  user.alliances.push(allianceId);
  user.military += alliance.militaryBonus;
  user.gold += alliance.goldBonus;
  usersDB.set(ctx.from.id, user);
  await ctx.reply(`✅ اتحاد با ${alliance.name} برقرار شد!\n⚔️ +${alliance.militaryBonus} قدرت\n💰 +${alliance.goldBonus} سکه`);
}

// ==================== مأموریت‌ها ====================
async function showMissions(ctx) {
  const user = usersDB.get(ctx.from.id);
  resetDailyMissions(ctx.from.id);
  const text = user.dailyMissions.map(m => `${m.completed ? "✅" : "⏳"} **${m.name}**\n   ${m.progress}/${m.target}`).join("\n\n");
  await ctx.reply(`📋 **مأموریت‌ها**\n\n${text}`, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") });
}

// ==================== پنل ادمین ====================
async function showAdminPanel(ctx) {
  const keyboard = new InlineKeyboard()
    .text("🎁 هدیه گیف", "admin_give_gif").text("💰 هدیه سکه", "admin_give_gold")
    .row().text("🏆 فول کردن", "admin_full_upgrade").text("🗑️ ریست", "admin_reset_user")
    .row().text("📊 لیست کاربران", "admin_list_users").text("🔙 بستن", "admin_close");
  await ctx.reply("👑 **پنل ادمین**", { parse_mode: "Markdown", reply_markup: keyboard });
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
      usersDB.set(ctx.from.id, { leader: leaderKey, leaderName: leaders[leaderKey].name, era: leaders[leaderKey].era, gold: 500, exp: 0, military: 50, weapon: null, alliances: [], dailyMissions: dailyMissions.map(m => ({ ...m, progress: 0, completed: false })), lastMissionReset: Date.now() });
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await showGameMenu(ctx, leaderKey);
    }
    else if (data.startsWith("back_cat_")) await showCategory(ctx, data.replace("back_cat_", ""));
    else if (data === "back_main") await ctx.reply("بازگشت...");
    else if (data === "open_shop") await showShop(ctx);
    else if (data === "craft_menu") await showCraftMenu(ctx);
    else if (data.startsWith("craft_")) await craftWeapon(ctx, data.replace("craft_", ""));
    else if (data === "battle") await requestBattle(ctx);
    else if (data === "confirm_battle") await confirmBattle(ctx);
    else if (data === "cancel_battle") await cancelBattle(ctx);
    else if (data === "my_status") await showStatus(ctx);
    else if (data === "show_missions") await showMissions(ctx);
    else if (data === "random_event") await triggerRandomEvent(ctx);
    else if (data === "show_leaderboard") await showLeaderboard(ctx);
    else if (data === "show_map") await showMap(ctx);
    else if (data === "show_alliances") await showAlliances(ctx);
    else if (data === "back_to_game") { const u = usersDB.get(userId); if (u) await showGameMenu(ctx, u.leader); else await ctx.reply("/start"); }
    else if (data === "change_leader") await ctx.reply("🔄 /start رو بزن.");
    else if (data.startsWith("buy_")) {
      const user = usersDB.get(userId);
      const item = weaponsByEra[user?.era]?.find(w => w.id === data.replace("buy_", ""));
      if (user && item && user.gold >= item.price) {
        user.gold -= item.price;
        if (user.weapon) user.military -= user.weapon.power;
        user.weapon = item;
        user.military += item.power;
        usersDB.set(userId, user);
        updateMissionProgress(userId, "buy");
        await ctx.replyWithAnimation(animations.cyrusAnimation, { caption: `✅ ${item.name} خریداری شد!\n💰 ${user.gold} سکه` });
      } else await ctx.reply("❌ سکه کافی نیست!");
    }
    else if (data.startsWith("ally_") && ADMINS.includes(userId)) await createAlliance(ctx, data.replace("ally_", ""));
    else if (data === "admin_panel_secret" && ADMINS.includes(userId)) await showAdminPanel(ctx);
    else if (data === "admin_list_users" && ADMINS.includes(userId)) {
      const list = Array.from(usersDB.entries()).filter(([k]) => !String(k).includes("admin_")).map(([id, d]) => `${d.leaderName} - ${id}`).join("\n");
      await ctx.editMessageText(`📊 **لیست کاربران**\n${list || "هیچ"}`);
    }
    else if (data === "admin_close") await ctx.deleteMessage();
  } catch (e) { console.error(e); await ctx.reply("❌ خطا"); }
});

// ==================== دستورات ====================
bot.command("help", async (ctx) => { await ctx.reply("🎮 **بقای باستانی**\n/start - شروع\n/restart - ریست\n/admin_panel - پنل ادمین", { parse_mode: "Markdown" }); });
bot.command("restart", async (ctx) => { usersDB.delete(ctx.from.id); await ctx.reply("🔄 ریست شد!"); await bot.commands.start(ctx); });
bot.command("admin_panel", async (ctx) => { if (ADMINS.includes(ctx.from.id)) await showAdminPanel(ctx); else await ctx.reply("❌ دسترسی غیرمجاز!"); });

// ==================== استارت ====================
bot.start();
console.log("🎮 بازی بقای باستانی کامل روشن شد...");