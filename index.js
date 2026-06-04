const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// ==================== دیتابیس کاربران ====================
const usersDB = new Map();

// ==================== ادمین ====================
const ADMINS = [5576592239];

// ==================== واژگان پارسی باستانی ====================
const P = {
  welcome: "⭐ فروغ جاودان ⭐",
  shop: "🛒 بازارچه شیشه‌ای",
  battle: "⚔️ میدان رزم",
  victory: "🏆 پیروزی بزرگ",
  defeat: "💔 شکست ننگین",
  gold: "دینار",
  power: "توان رزمی",
  level: "پایه",
  weapon: "خود",
  buy: "خریدن",
  craft: "ساختن",
  alliance: "پیمان‌بندی",
  mission: "وظیفه روزگار",
  event: "رخداد تاریخ",
  map: "نگاره ایران‌زمین",
  leaderboard: "نامه سروران",
  back: "بازگشت",
  confirm: "آری، چنین کنم",
  cancel: "نه، بازگردم",
  glassBorder: "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨"
};

// ==================== عکس‌های رهبران ====================
const leaders = {
  cyrus: { name: "کوروش بزرگ", desc: "بنیادگزار هخامنشی، بردارنده منشور آزادگی", image: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDexqIC3VJle3eBKrpyP2iPCb2nSHdgAC8g5rG4APAVFruE7qyqYySgEAAwIAA3kAAzsE" },
  darius: { name: "داریوش بزرگ", desc: "سازنده پارسه، سامان‌دهنده کشور", image: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDgRqIC6pWLzAhSz62YlMEYu1BBJXcAAC9Q5rG4APAVFi2sJMMLDVlwEAAwIAA3kAAzsE" },
  anushirvan: { name: "انوشیروان دادگر", desc: "دادگستر ساسانی، حامی دانش", image: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA", era: "ancient", battleImage: "AgACAgQAAxkBAAEqDgxqIC84TrWNGA0_YAj8HnqqpititgAC9g5rG4APAVHJULBSG_V9cgEAAwIAA3kAAzsE" },
  shahabbas: { name: "شاه عباس کبیر", desc: "صفوی، زنده‌کننده اصفهان", image: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  nader: { name: "نادرشاه افشار", desc: "فاتح هند، بازآورنده مرزها", image: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDhJqIC_JqhOlWXWY5bNFKEYODsErLgAC-A5rG4APAVFDa5CLbAKRpgEAAwIAA3kAAzsE" },
  karim: { name: "کریم‌خان زند", desc: "وکیل‌الرعایا، آرامش‌بخش", image: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA", era: "islamic", battleImage: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  rezashah: { name: "رضاشاه پهلوی", desc: "بنیادگزار ارتش نوین", image: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE", era: "modern", battleImage: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  mohammadreza: { name: "محمدرضا پهلوی", desc: "پیشاهنگ سپید انقلاب", image: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE", era: "modern", battleImage: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  khomeini: { name: "امام خمینی", desc: "رهبر انقلاب، بنیادگزار جمهوری", image: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE", era: "khomeini", battleImage: "AgACAgQAAxkBAAEqDiZqIDCc9bGzQWtIa_nd9kU4bYlLZAAC_g5rG4APAVFhExSQa7SOBAEAAwIAA3kAAzsE" },
  khamenei: { name: "آیت‌الله خامنه‌ای", desc: "رهبر فرزانه، سکاندار ایران", image: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ", era: "khamenei", battleImage: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA" }
};

// ==================== عکس‌های دسته‌بندی ====================
const categoryImages = {
  ancient: "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE",
  islamic: "AgACAgQAAxkBAAEqDUdqICQc6ZB0uinHD6hZ7wcT3u86oQAC4A5rG4APAVFQEaC3exIhHQEAAwIAA3kAAzsE",
  modern: "AgACAgQAAxkBAAEqDW1qICTZj5vvNZdj8IfXm08Go-EoHAAC4w5rG4APAVF78qoubkaQrgEAAwIAA3kAAzsE",
  republic: "AgACAgQAAxkBAAEqDXxqICU_YmcR261F414EcCku6vMMCAAC5A5rG4APAVEmgDq8PfldMwEAAwIAA3gAAzsE"
};

// ==================== عکس نقشه و استان‌ها ====================
const mapImage = "AgACAgQAAxkBAAEqEn1qIIS1Cpu26NucbgH1ankioQm-9AACHRBrG4APAVHcgdJ7gFsdyAEAAwIAA3gAAzsE";
const provinceImages = {
  tehran: "AgACAgQAAxkBAAEqFoVqISn_y2htCWJDDJhrs54w2IH9gwACdg1rG_JGCVFC0NbBvtxdnQEAAwIAA3kAAzsE",
  isfahan: "AgACAgQAAxkBAAEqFoNqISmO6C6SVlh4HHsGxiTXFAZ4agACdQ1rG_JGCVFPriQVMd4H8gEAAwIAA3kAAzsE",
  shiraz: "AgACAgQAAxkBAAEqFodqISonjCvmbKmawsmFCzAV-A7hCwACdw1rG_JGCVHEOM2EpM4tHgEAAwIAA3kAAzsE",
  tabriz: "AgACAgQAAxkBAAEqFolqISpFeZBcuCBSdC58r1-DKWFAuwACeA1rG_JGCVHqypz389Ai7gEAAwIAA3kAAzsE",
  bandar: "AgACAgQAAxkBAAEqFotqISppW_Bk6gZttLBsV1iWiXyAJQACeQ1rG_JGCVHCmE29MS_O4QEAAwIAA3gAAzsE",
  mashhad: "AgACAgQAAxkBAAEqFpdqISq6GooN7KQHs0yD73_lGgvjmQACeg1rG_JGCVG-VBRXdHCwdgEAAwIAA3gAAzsE"
};

// ==================== پس‌زمینه‌ها ====================
const backgrounds = {
  leaderboard: "AgACAgQAAxkBAAEqFttqIS9-dWgs8A1BaGYw4XZyEnyEvwACgw1rG_JGCVE1oaMxdv66cQEAAwIAA3kAAzsE",
  mission: "AgACAgQAAxkBAAEqFtxqIS9-DUetczzuUDDPSUx8dWrxBgAChA1rG_JGCVFEZMfvymt8xgEAAwIAA3cAAzsE",
  shop: "AgACAgQAAxkBAAEqFt1qIS9-K3ULXnCVBEB8KnU7fsdqQQAChQ1rG_JGCVEMmjqUItG-zgEAAwIAA3kAAzsE"
};

// ==================== انیمیشن‌ها ====================
const animations = {
  readyToFight: "CgACAgQAAxkBAAEqETVqIGusPLj-Qq0nd73vMUkiRiwY0wACTwYAArMmNVBb8-ES6JPGHzsE",
  cyrusAnimation: "CgACAgQAAxkBAAEqEUpqIG2RakeSSSNpKkC-3UfiGpoEYwACGQMAAt5HJVNbjZO7dqLofTsE",
  missileAnimation: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA",
  explosion: "CgACAgQAAxkBAAEqEo9qIIXeZFa4e4pPIR67chxvh9D2XwACbwMAAlhtBFOyrDZljZRTyjsE",
  levelUp: "CgACAgQAAxkBAAEqErVqIIjJ-bv5gGzhZo8th5sZ3n1dhwACdSMAAvQVAVEMU_-bjeLRCjsE",
  defeat: "CgACAgQAAxkBAAEqEu1qII15onal3AqvYITzkqdm5MI00gACeyMAAvQVAVF1fh97_aRKYDsE",
  victory: "CgACAgQAAxkBAAEqEw1qIJDV8z7vf7hG_oP0l4aaTPm7ZQACgCMAAvQVAVEjsoZnsyyDgTsE",
  khorramshahr: "CgACAgQAAxkBAAEqFitqISFPsrBbj35mi9V6eTBjYwi0ogAClxwAAr8OCFHP6gFbAvivDzsE"
};

// ==================== اتحادها ====================
const alliances = [
  { id: "russia", name: "روسیه", leader: "پوتین", cost: 500, militaryBonus: 30, goldBonus: 20, image: "AgACAgQAAxkBAAEqFqNqIS0fd92Bw8d7VBy7qWbZPwhrgwACfQ1rG_JGCVFDW7TnUnWLQwEAAwIAA3kAAzsE" },
  { id: "china", name: "چین", leader: "شی جین پینگ", cost: 600, militaryBonus: 40, goldBonus: 30, image: "AgACAgQAAxkBAAEqFqRqIS0fgiiBMoyilLWMQxx_nXtXIgACfg1rG_JGCVGFBdwZIw4ljQEAAwIAA3gAAzsE" },
  { id: "yemen", name: "یمن", leader: "حوثی", cost: 400, militaryBonus: 25, goldBonus: 15, image: "AgACAgQAAxkBAAEqFqVqIS0fjjjULm5MkISJT1QSsNI2fwACgA1rG_JGCVGe0QRisKs8gwEAAwIAA3gAAzsE" },
  { id: "lebanon", name: "لبنان", leader: "شیخ نعیم قاسم", cost: 450, militaryBonus: 25, goldBonus: 15, image: "AgACAgQAAxkBAAEqFqZqIS0fP2DkoVY32P8gk1ifFYR3wwACgQ1rG_JGCVGZ8h5GO7jxmwEAAwIAA3kAAzsE" }
];

// ==================== نام دوره‌ها ====================
const eraNames = {
  ancient: "هخامنشی و ساسانی",
  islamic: "صفوی و افشار",
  modern: "پهلوی",
  khomeini: "دفاع مقدس",
  khamenei: "موشکی و پهبادی"
};

// ==================== سلاح‌ها ====================
const weaponsByEra = {
  ancient: [
    { id: "sword", name: "شمشیر مفرغین", price: 100, power: 5, desc: "خود مفرغین سپاه هخامنشی" },
    { id: "bow", name: "کمان پهلوی", price: 150, power: 8, desc: "تیراندازان پارسی" },
    { id: "spear", name: "نیزه بلند", price: 200, power: 12, desc: "نیزه‌داران جاودان" },
    { id: "chariot", name: "ارابه جنگی", price: 400, power: 25, desc: "نیروی ویژه کوروش" },
    { id: "elephant", name: "پیل جنگی", price: 600, power: 35, desc: "زره‌پوش ساسانی" }
  ],
  islamic: [
    { id: "damascus", name: "شمشیر دمشقی", price: 250, power: 15, desc: "فولاد دمشق" },
    { id: "armor", name: "زره زنجیرین", price: 350, power: 12, desc: "محافظ سوارگان" },
    { id: "musket", name: "تفنگ فتیله‌ای", price: 500, power: 25, desc: "تفنگ قورچیان" },
    { id: "cannon", name: "توپ جنگی", price: 800, power: 40, desc: "شکننده استحکامات" },
    { id: "nader_gun", name: "تفنگ نادری", price: 1200, power: 60, desc: "فاتح هند" }
  ],
  modern: [
    { id: "bruno", name: "تفنگ برنو", price: 400, power: 20, desc: "تفنگ اصلی ارتش" },
    { id: "maxim", name: "مسلسل ماکسیم", price: 700, power: 35, desc: "ساخت تهران" },
    { id: "cannon75", name: "توپ ۷۵ مم", price: 1500, power: 60, desc: "خرید از چکسلواکی" },
    { id: "fighter", name: "جنگنده آسمانی", price: 2500, power: 90, desc: "خرید از آلمان" }
  ],
  khomeini: [
    { id: "rpg", name: "آرپی‌جی ۷", price: 500, power: 30, desc: "شکننده زره" },
    { id: "mortar", name: "خمپاره ۶۰ مم", price: 800, power: 45, desc: "پشتیبان آتش" },
    { id: "collage", name: "کلاژ", price: 1200, power: 60, desc: "موشک‌انداز سپاه" },
    { id: "t72", name: "تانک T-72", price: 3000, power: 100, desc: "غنیمتی از صدام" },
    { id: "phantom", name: "اف-۴ فانتوم", price: 4000, power: 130, desc: "بازمانده از گذشته" }
  ],
  khamenei: [
    { id: "shahab1", name: "موشک شهاب ۱", price: 2000, power: 80, desc: "ساخت ایران" },
    { id: "mohajer", name: "پهباد مهاجر", price: 3500, power: 120, desc: "پهپاد تهاجمی" },
    { id: "bavar", name: "باور ۳۷۳", price: 5000, power: 180, desc: "پدافند هوایی" },
    { id: "shahab3", name: "موشک شهاب ۳", price: 4000, power: 150, desc: "بالستیک میان‌برد" },
    { id: "khorramshahr", name: "موشک خرمشهر", price: 6000, power: 200, desc: "قاره‌پیما" }
  ]
};

// ==================== ساخت سلاح ====================
const craftRecipes = {
  khamenei: [
    { id: "khorramshahr_missile", name: "🔥 موشک خرمشهر 🔥", power: 750, price: 8000, requiredItem: "shahab3", requiredItemName: "موشک شهاب ۳", desc: "موشک بالستیک دوربرد - بازدارندگی کامل", craftTime: 180, specialAnimation: animations.khorramshahr }
  ]
};

// ==================== NPCها ====================
const npcList = [
  { name: "سردار بابک", power: 45, era: "ancient", desc: "شورشی مازندران" },
  { name: "صدام حسین", power: 75, era: "khomeini", desc: "ارتش بعث عراق" },
  { name: "آمریکا", power: 85, era: "khamenei", desc: "نیروهای بیگانه" },
  { name: "اسرائیل", power: 80, era: "khamenei", desc: "رژیم صهیونیستی" },
  { name: "چنگیز مغول", power: 90, era: "ancient", desc: "تهاجم مغول" },
  { name: "داعش", power: 65, era: "khamenei", desc: "تروریست‌های تکفیری" }
];

// ==================== مأموریت‌ها ====================
const dailyMissions = [
  { id: 1, name: "⚔️ رزم‌آور تازه‌کار", desc: "یک پیکار کن", rewardGold: 100, rewardExp: 20, target: 1, type: "battle" },
  { id: 2, name: "🛒 خریدار خود", desc: "یک خود بخر", rewardGold: 150, rewardExp: 15, target: 1, type: "buy" },
  { id: 3, name: "🔧 خودساز ماهر", desc: "یک خود بساز", rewardGold: 200, rewardExp: 30, target: 1, type: "craft" },
  { id: 4, name: "💰 دیناراندوز", desc: "۱۰۰۰ دینار جمع کن", rewardGold: 0, rewardExp: 50, target: 1000, type: "wealth" },
  { id: 5, name: "🏆 سپهسالار", desc: "سه پیکار کن", rewardGold: 300, rewardExp: 60, target: 3, type: "battle" }
];

// ==================== رویدادها ====================
const randomEvents = [
  { name: "🌾 قحطی بزرگ", effect: { gold: -150, military: -10 }, desc: "قحطی دینار و توان را کاست" },
  { name: "💎 یافتن گنج", effect: { gold: 500, military: 0 }, desc: "گنجی یافتی! دینار بسیار به چنگ آوردی" },
  { name: "🤝 پیمان با همسایگان", effect: { gold: 50, military: 30 }, desc: "پیمان نوین توان رزمی را افزود" },
  { name: "🎓 دوران زرین دانش", effect: { gold: 100, military: 20 }, desc: "پیشرفت دانش، دینار و توان را فزونی بخشید" }
];

// ==================== استان‌ها ====================
const provinces = [
  { id: "tehran", name: "تهران", image: provinceImages.tehran, baseIncome: 100, controlled: false, militaryNeeded: 50, owner: null },
  { id: "isfahan", name: "اصفهان", image: provinceImages.isfahan, baseIncome: 80, controlled: false, militaryNeeded: 40, owner: null },
  { id: "shiraz", name: "شیراز", image: provinceImages.shiraz, baseIncome: 70, controlled: false, militaryNeeded: 35, owner: null },
  { id: "tabriz", name: "تبریز", image: provinceImages.tabriz, baseIncome: 60, controlled: false, militaryNeeded: 30, owner: null },
  { id: "mashhad", name: "مشهد", image: provinceImages.mashhad, baseIncome: 90, controlled: false, militaryNeeded: 45, owner: null }
];

// ==================== توابع کمکی ====================
function getRandomNPC(era) {
  const filtered = npcList.filter(n => n.era === era);
  return filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : { name: "دشمن ناشناس", power: 50, era: era, desc: "نیروی مهاجم" };
}

function getLevel(exp) { return Math.floor(exp / 100) + 1; }

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
      if (completed && !m.completed) { user.gold += m.rewardGold; user.exp += m.rewardExp; }
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

async function applyBigMax(user, ctx) {
  const oldLevel = getLevel(user.exp - 100);
  const newLevel = getLevel(user.exp);
  if (newLevel > oldLevel) {
    const bonus = { gold: 5000, military: 200, exp: 500, weapon: { id: `bigmax_${newLevel}`, name: `🔥 خود بیگ مکس سطح ${newLevel} 🔥`, power: 100 * newLevel } };
    user.gold += bonus.gold;
    user.military += bonus.military;
    user.exp += bonus.exp;
    if (!user.weapon || user.weapon.power < bonus.weapon.power) user.weapon = bonus.weapon;
    await ctx.replyWithAnimation(animations.levelUp, { caption: `${P.glassBorder}\n🔥🌟🌟🌟 بیگ مکس خفن 🌟🌟🌟🔥\n💰 +${bonus.gold} دینار\n⚔️ +${bonus.military} توان\n⭐ +${bonus.exp} تجربه\n${P.glassBorder}`, parse_mode: "Markdown" });
    return true;
  }
  return false;
}

// ==================== منوی اصلی ====================
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ هخامنشیان", "cat_ancient")
    .text("⚔️ صفویان", "cat_islamic")
    .row()
    .text("🏭 پهلویان", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");

  await ctx.replyWithPhoto(categoryImages.ancient, {
    caption: `${P.glassBorder}\n🪞 **${P.welcome}** 🪞\n${P.glassBorder}\n\n📜 **یک دسته از شاهان را برگزین:**`,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
});

// ==================== نمایش دسته ====================
async function showCategory(ctx, categoryId) {
  let leadersList = [], title = "", image = "";
  if (categoryId === "ancient") { leadersList = ["cyrus", "darius", "anushirvan"]; title = "🏛️ شاهان هخامنشی و ساسانی"; image = categoryImages.ancient; }
  else if (categoryId === "islamic") { leadersList = ["shahabbas", "nader", "karim"]; title = "⚔️ شاهان صفوی و افشار"; image = categoryImages.islamic; }
  else if (categoryId === "modern") { leadersList = ["rezashah", "mohammadreza"]; title = "🏭 شاهان پهلوی"; image = categoryImages.modern; }
  else if (categoryId === "republic") { leadersList = ["khomeini", "khamenei"]; title = "🕌 رهبران جمهوری اسلامی"; image = categoryImages.republic; }

  const keyboard = new InlineKeyboard();
  leadersList.forEach(k => keyboard.text(leaders[k].name, `temp_${k}`));
  keyboard.row().text("🔙 بازگشت", "back_main");

  await ctx.editMessageMedia({ type: "photo", media: image, caption: `📜 **${title}**\n\n` + leadersList.map(k => `• **${leaders[k].name}**\n   ${leaders[k].desc}`).join("\n"), parse_mode: "Markdown" }, { reply_markup: keyboard });
}

// ==================== نمایش جزئیات رهبر ====================
async function showLeaderDetail(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  const backCat = ["khomeini", "khamenei"].includes(leader.era) ? "republic" : leader.era;
  const keyboard = new InlineKeyboard().text("✅ برگزیدن", `select_${leaderKey}`).text("🔙 بازگشت", `back_cat_${backCat}`);
  await ctx.editMessageMedia({ type: "photo", media: leader.image, caption: `👑 **${leader.name}**\n\n📖 ${leader.desc}\n\nآیا این شاه را برمی‌گزینی؟`, parse_mode: "Markdown" }, { reply_markup: keyboard });
}

// ==================== منوی بازی ====================
async function showGameMenu(ctx, leaderKey) {
  const leader = leaders[leaderKey];
  const user = usersDB.get(ctx.from.id);
  const level = getLevel(user.exp);
  const keyboard = new InlineKeyboard()
    .text(`🛒 ${P.shop}`, "open_shop")
    .text(`🔧 ${P.craft}`, "craft_menu")
    .row()
    .text(`⚔️ ${P.battle}`, "battle")
    .text(`📊 وضعیت`, "my_status")
    .row()
    .text(`📋 ${P.mission}`, "show_missions")
    .text(`🌍 ${P.event}`, "random_event")
    .row()
    .text(`🏆 ${P.leaderboard}`, "show_leaderboard")
    .text(`🗺️ ${P.map}`, "show_map")
    .row()
    .text(`🤝 ${P.alliance}`, "show_alliances")
    .row()
    .text(`🔄 تغییر رهبر`, "change_leader");
  if (ADMINS.includes(ctx.from.id)) keyboard.row().text("👑 پنل ادمین", "admin_panel_secret");

  await ctx.replyWithPhoto(leader.image, {
    caption: `${P.glassBorder}\n🪞 **${user.realName || user.leaderName}** 🪞\n${P.glassBorder}\n\n👑 **${leader.name}**\n📜 ${eraNames[leader.era]}\n💰 ${P.gold}: ${user.gold}\n⚔️ ${P.power}: ${user.military}\n⭐ ${P.level}: ${level}\n🗡️ ${P.weapon}: ${user.weapon?.name || "ندارد"}`,
    parse_mode: "Markdown", reply_markup: keyboard
  });
}

// ==================== فروشگاه ====================
async function showShop(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const weapons = weaponsByEra[user.era];
  const keyboard = new InlineKeyboard();
  weapons.forEach(w => keyboard.text(`${w.name} - ${w.price}💰`, `buy_${w.id}`));
  keyboard.row().text(`🔙 ${P.back}`, "back_to_game");

  await ctx.replyWithPhoto(backgrounds.shop, {
    caption: `🪞 **${P.shop}** 🪞\n\n💰 ${P.gold}: ${user.gold}\n⚔️ ${P.power}: ${user.military}\n\n` + weapons.map(w => `• ${w.name} - ${w.price}💰 (قدرت +${w.power})\n   ${w.desc}`).join("\n"),
    parse_mode: "Markdown", reply_markup: keyboard
  });
}

// ==================== ساخت سلاح ====================
async function showCraftMenu(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const recipes = craftRecipes[user.era];
  if (!recipes?.length) { await ctx.reply("در این دوره هیچ خودی قابل ساختن نیست."); return; }
  const keyboard = new InlineKeyboard();
  recipes.forEach(r => keyboard.text(`${r.name} - ${r.price}💰`, `craft_${r.id}`));
  keyboard.row().text(`🔙 ${P.back}`, "back_to_game");

  await ctx.reply(`🔧 **${P.craft}**\n💰 ${P.gold}: ${user.gold}\n\n` + recipes.map(r => `• ${r.name} - ${r.price}💰 (توان +${r.power})\n   نیاز: ${r.requiredItemName}`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
}

async function craftWeapon(ctx, recipeId) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const recipe = craftRecipes[user.era]?.find(r => r.id === recipeId);
  if (!recipe) return;
  if (user.weapon?.id !== recipe.requiredItem) { await ctx.reply(`به ${recipe.requiredItemName} نیاز داری!`); return; }
  if (user.gold < recipe.price) { await ctx.reply(`دینار کافی نیست!`); return; }
  user.gold -= recipe.price;
  if (user.weapon) user.military -= user.weapon.power;
  user.weapon = { id: recipe.id, name: recipe.name, power: recipe.power };
  user.military += recipe.power;
  usersDB.set(ctx.from.id, user);
  updateMissionProgress(ctx.from.id, "craft");
  const anim = recipe.specialAnimation || animations.levelUp;
  await ctx.replyWithAnimation(anim, { caption: `✅ ${recipe.name} ساخته شد!\n💰 ${user.gold} دینار\n⚔️ ${user.military} توان`, parse_mode: "Markdown" });
  await applyBigMax(user, ctx);
}

// ==================== جنگ ====================
async function requestBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const npc = getRandomNPC(user.era);
  usersDB.set(ctx.from.id + "_pending", { npc });
  const keyboard = new InlineKeyboard().text(`✅ ${P.confirm}`, "confirm_battle").text(`❌ ${P.cancel}`, "cancel_battle");
  await ctx.reply(`⚔️ **${P.battle}**\n\n👤 **${npc.name}**\n📖 ${npc.desc}\n💪 توان دشمن: ${npc.power}\n🏆 توان تو: ${user.military + (user.weapon?.power || 0)}\n\n${P.confirm}؟`, { parse_mode: "Markdown", reply_markup: keyboard });
}

async function confirmBattle(ctx) {
  const user = usersDB.get(ctx.from.id);
  const pending = usersDB.get(ctx.from.id + "_pending");
  if (!user || !pending) return;
  const npc = pending.npc;
  const playerPower = user.military + (user.weapon?.power || 0);
  const isWin = playerPower + (Math.random() * 30 - 10) > npc.power;
  const reward = isWin ? { gold: 300, exp: 50, military: 10 } : { gold: 30, exp: 5, military: -5 };
  user.gold = Math.max(0, user.gold + reward.gold);
  user.exp += reward.exp;
  user.military = Math.max(0, user.military + reward.military);
  usersDB.set(ctx.from.id, user);
  usersDB.delete(ctx.from.id + "_pending");
  updateMissionProgress(ctx.from.id, "battle");
  const anim = isWin ? animations.victory : animations.defeat;
  await ctx.replyWithAnimation(anim, { caption: `⚔️ **نبرد با ${npc.name}**\n${isWin ? "🎉 پیروزی!" : "💔 شکست!"}\n💰 ${reward.gold} دینار\n⭐ +${reward.exp} تجربه`, parse_mode: "Markdown" });
  await applyBigMax(user, ctx);
  const keyboard = new InlineKeyboard().text(`🛒 ${P.shop}`, "open_shop").text(`⚔️ ${P.battle}`, "battle").text(`🔙 ${P.back}`, "back_to_game");
  await ctx.reply("اداره پیکار:", { reply_markup: keyboard });
}

async function cancelBattle(ctx) { usersDB.delete(ctx.from.id + "_pending"); await ctx.reply(`🏃‍♂️ ${P.cancel}`); }

// ==================== وضعیت ====================
async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const level = getLevel(user.exp);
  await ctx.replyWithPhoto(leaders[user.leader].image, { caption: `📊 **${user.realName || user.leaderName}**\n\n💰 ${P.gold}: ${user.gold}\n⭐ ${P.level}: ${level}\n📈 تجربه: ${user.exp}/${level*100}\n⚔️ ${P.power}: ${user.military}\n🗡️ ${P.weapon}: ${user.weapon?.name || "ندارد"}`, parse_mode: "Markdown", reply_markup: new InlineKeyboard().text(`🔙 ${P.back}`, "back_to_game") });
}

// ==================== لیدربورد ====================
async function showLeaderboard(ctx) {
  const users = Array.from(usersDB.entries()).filter(([key]) => !String(key).includes("admin_") && !String(key).includes("pending"));
  const sorted = users.sort((a, b) => b[1].military - a[1].military).slice(0, 10);
  const text = sorted.map(([id, d], i) => `${i+1}. 👑 **${d.realName || d.leaderName}**\n   💰${d.gold} ⚔️${d.military}`).join("\n\n");
  await ctx.replyWithPhoto(backgrounds.leaderboard, { caption: `🏆 **${P.leaderboard}**\n\n${text || "هیچ سروری یافت نشد"}`, parse_mode: "Markdown", reply_markup: new InlineKeyboard().text(`🔙 ${P.back}`, "back_to_game") });
}

// ==================== نقشه ====================
async function showMap(ctx) {
  const user = usersDB.get(ctx.from.id);
  const userIncome = provinces.filter(p => p.owner === ctx.from.id).reduce((s, p) => s + p.baseIncome, 0);
  const provinceList = provinces.map(p => `• **${p.name}** - ${p.owner === ctx.from.id ? "✅ فتح شده" : "❌ فتح نشده"} | درآمد: ${p.baseIncome}💰`).join("\n");
  const keyboard = new InlineKeyboard().text("⚔️ حمله", "attack_province").text("💰 مالیات", "collect_tax").row().text("🔙 بازگشت", "back_to_game");
  await ctx.replyWithPhoto(mapImage, { caption: `🗺️ **${P.map}**\n\n${provinceList}\n\n💰 درآمد روزانه: ${userIncome} دینار\n⚔️ توان: ${user.military}`, parse_mode: "Markdown", reply_markup: keyboard });
}

async function attackProvince(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const available = provinces.filter(p => !p.controlled || p.owner === ctx.from.id);
  if (available.length === 0) { await ctx.reply("❌ همه استان‌ها فتح شده‌اند!"); return; }
  const keyboard = new InlineKeyboard();
  available.forEach(p => keyboard.text(`${p.name} (نیاز ${p.militaryNeeded} توان)`, `conquer_${p.id}`));
  keyboard.row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply("⚔️ **انتخاب استان برای حمله:**", { reply_markup: keyboard });
}

async function conquerProvince(ctx, provinceId) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const province = provinces.find(p => p.id === provinceId);
  if (!province) return;
  if (user.military < province.militaryNeeded) { await ctx.reply(`❌ توان کافی نیست! نیاز به ${province.militaryNeeded - user.military} توان بیشتر.`); return; }
  province.controlled = true;
  province.owner = ctx.from.id;
  user.military -= 10;
  usersDB.set(ctx.from.id, user);
  await ctx.replyWithPhoto(province.image, { caption: `✅ **${province.name} فتح شد!**\n💰 درآمد روزانه +${province.baseIncome} دینار\n⚔️ توان -۱۰`, parse_mode: "Markdown" });
}

async function collectTax(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const lastTax = user.lastTax || 0;
  if (Date.now() - lastTax < 24 * 60 * 60 * 1000) {
    const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - lastTax)) / (60 * 60 * 1000));
    await ctx.reply(`⏳ مالیات فقط هر ۲۴ ساعت یکبار قابل دریافت است. ${hoursLeft} ساعت دیگر اقدام کن.`);
    return;
  }
  const income = provinces.filter(p => p.owner === ctx.from.id).reduce((s, p) => s + p.baseIncome, 0);
  user.gold += income;
  user.lastTax = Date.now();
  usersDB.set(ctx.from.id, user);
  await ctx.reply(`💰 **مالیات دریافت شد!**\nدرآمد: ${income} دینار\n💰 سکه فعلی: ${user.gold}`);
}

// ==================== اتحادها ====================
async function showAlliances(ctx) {
  const user = usersDB.get(ctx.from.id);
  const userAlliances = user.alliances || [];
  const allianceList = alliances.map(a => `• **${a.name}** (${a.leader}) - ${userAlliances.includes(a.id) ? "✅ متحد" : `❌ هزینه: ${a.cost}💰 | پاداش: +${a.militaryBonus} توان`}`).join("\n");
  const keyboard = new InlineKeyboard();
  alliances.forEach(a => { if (!userAlliances.includes(a.id)) keyboard.text(`اتحاد با ${a.name} - ${a.cost}💰`, `ally_${a.id}`); });
  keyboard.row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🤝 **${P.alliance}**\n💰 سکه: ${user.gold}\n\n${allianceList}`, { parse_mode: "Markdown", reply_markup: keyboard });
}

async function createAlliance(ctx, allianceId) {
  const user = usersDB.get(ctx.from.id);
  const alliance = alliances.find(a => a.id === allianceId);
  if (!alliance || user.gold < alliance.cost) { await ctx.reply("دینار کافی نیست!"); return; }
  user.gold -= alliance.cost;
  user.alliances = user.alliances || [];
  user.alliances.push(allianceId);
  user.military += alliance.militaryBonus;
  user.gold += alliance.goldBonus;
  usersDB.set(ctx.from.id, user);
  await ctx.replyWithPhoto(alliance.image, { caption: `✅ پیمان با ${alliance.name} بسته شد!\n⚔️ +${alliance.militaryBonus} توان\n💰 +${alliance.goldBonus} دینار`, parse_mode: "Markdown" });
}

// ==================== مأموریت ====================
async function showMissions(ctx) {
  const user = usersDB.get(ctx.from.id);
  resetDailyMissions(ctx.from.id);
  const text = user.dailyMissions.map(m => `${m.completed ? "✅" : "⏳"} **${m.name}**\n   ${m.progress}/${m.target} | پاداش: ${m.rewardGold}💰 + ${m.rewardExp}⭐`).join("\n\n");
  await ctx.replyWithPhoto(backgrounds.mission, { caption: `📋 **${P.mission}**\n\n${text}`, parse_mode: "Markdown", reply_markup: new InlineKeyboard().text(`🔙 ${P.back}`, "back_to_game") });
}

// ==================== رویداد ====================
async function triggerRandomEvent(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  user.gold = Math.max(0, user.gold + (event.effect.gold || 0));
  user.military = Math.max(0, user.military + (event.effect.military || 0));
  usersDB.set(ctx.from.id, user);
  const keyboard = new InlineKeyboard().text("🌍 رویداد جدید", "random_event").text("🔙 بازگشت", "back_to_game");
  await ctx.replyWithAnimation(animations.explosion, { caption: `🌍 **${P.event}: ${event.name}**\n\n${event.desc}\n\n💰 ${P.gold}: ${user.gold}\n⚔️ ${P.power}: ${user.military}`, parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== پنل ادمین ====================
async function showAdminPanel(ctx) {
  const keyboard = new InlineKeyboard()
    .text("💰 هدیه سکه", "admin_give_gold")
    .text("🏆 فول کردن", "admin_full_upgrade")
    .row()
    .text("📊 لیست کاربران", "admin_list_users")
    .text("🔙 بستن", "admin_close");
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
      const leader = leaders[leaderKey];
      usersDB.set(ctx.from.id, {
        leader: leaderKey, leaderName: leader.name, realName: ctx.from.first_name, era: leader.era,
        gold: 500, exp: 0, military: 50, weapon: null, alliances: [], stats: {},
        dailyMissions: dailyMissions.map(m => ({ ...m, progress: 0, completed: false })),
        lastMissionReset: Date.now()
      });
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await showGameMenu(ctx, leaderKey);
    }
    else if (data.startsWith("back_cat_")) await showCategory(ctx, data.replace("back_cat_", ""));
    else if (data === "back_main") {
      const keyboard = new InlineKeyboard().text("🏛️ هخامنشیان", "cat_ancient").text("⚔️ صفویان", "cat_islamic").row().text("🏭 پهلویان", "cat_modern").text("🕌 جمهوری اسلامی", "cat_republic");
      await ctx.editMessageMedia({ type: "photo", media: categoryImages.ancient, caption: `${P.glassBorder}\n🪞 **${P.welcome}** 🪞\n${P.glassBorder}\n\n📜 یک دسته از شاهان را برگزین:`, parse_mode: "Markdown" }, { reply_markup: keyboard });
    }
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
    else if (data === "attack_province") await attackProvince(ctx);
    else if (data.startsWith("conquer_")) await conquerProvince(ctx, data.replace("conquer_", ""));
    else if (data === "collect_tax") await collectTax(ctx);
    else if (data === "show_alliances") await showAlliances(ctx);
    else if (data.startsWith("ally_")) await createAlliance(ctx, data.replace("ally_", ""));
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
        await ctx.replyWithAnimation(animations.cyrusAnimation, { caption: `✅ ${item.name} خریداری شد!\n💰 ${user.gold} دینار` });
        await applyBigMax(user, ctx);
      } else await ctx.reply("دینار کافی نیست!");
    }
    else if (data === "admin_panel_secret" && ADMINS.includes(userId)) await showAdminPanel(ctx);
    else if (data === "admin_list_users" && ADMINS.includes(userId)) {
      const list = Array.from(usersDB.entries()).filter(([k]) => !String(k).includes("admin_")).map(([id, d]) => `${d.realName || d.leaderName} - ${id}`).join("\n");
      await ctx.editMessageText(`📊 لیست کاربران\n${list || "هیچ"}`);
    }
    else if (data === "admin_close") await ctx.deleteMessage();
    else if (data === "admin_give_gold" && ADMINS.includes(userId)) {
      usersDB.set(`admin_${userId}_action`, "waiting_for_gold");
      await ctx.editMessageText("👑 ایدی کاربر و مقدار سکه رو بفرست (مثال: 123456789 1000)");
    }
    else if (data === "admin_full_upgrade" && ADMINS.includes(userId)) {
      usersDB.set(`admin_${userId}_action`, "waiting_for_full");
      await ctx.editMessageText("👑 ایدی کاربر رو بفرست تا فول شود:");
    }
  } catch (e) { console.error(e); await ctx.reply("❌ خطا"); }
});

// ==================== دریافت پیام از ادمین ====================
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

// ==================== دستورات ====================
bot.command("help", async (ctx) => { await ctx.reply(`🎮 **بازی بقای باستانی**\n\n/start - آغاز\n/restart - نو کردن\n/admin_panel - پنل ادمین`, { parse_mode: "Markdown" }); });
bot.command("restart", async (ctx) => { usersDB.delete(ctx.from.id); await ctx.reply("🔄 نو شد!"); await bot.commands.start(ctx); });
bot.command("admin_panel", async (ctx) => { if (ADMINS.includes(ctx.from.id)) await showAdminPanel(ctx); else await ctx.reply("❌ دسترسی ندارید!"); });

// ==================== استارت ====================
bot.start();
console.log("🎮 بازی بقای باستانی - نسخه کامل با تمام عکس‌ها روشن شد...");