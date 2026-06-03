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

// ==================== عکس‌های رهبران (حفظ شده) ====================
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

// ==================== عکس نقشه ====================
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

// ==================== نام دوره‌ها به پارسی ====================
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
  ancient: [
    { id: "iron_sword", name: "شمشیر آهنین", power: 20, price: 200, requiredItem: "sword", requiredItemName: "شمشیر مفرغین", desc: "خود آهنین و برنده‌تر" },
    { id: "composite_bow", name: "کمان مرکب", power: 25, price: 300, requiredItem: "bow", requiredItemName: "کمان پهلوی", desc: "کمان چندلایه" }
  ],
  islamic: [
    { id: "upgrade_musket", name: "تفنگ سرپر", power: 40, price: 400, requiredItem: "musket", requiredItemName: "تفنگ فتیله‌ای", desc: "تفنگ با دقت بالا" },
    { id: "big_cannon", name: "توپ بزرگ", power: 60, price: 500, requiredItem: "cannon", requiredItemName: "توپ جنگی", desc: "توپ سنگین" }
  ],
  modern: [
    { id: "heavy_maxim", name: "مسلسل سنگین", power: 50, price: 600, requiredItem: "maxim", requiredItemName: "مسلسل ماکسیم", desc: "مسلسل سنگین" }
  ],
  khomeini: [
    { id: "fateh_missile", name: "موشک فاتح", power: 80, price: 800, requiredItem: "collage", requiredItemName: "کلاژ", desc: "موشک کوتاه برد" }
  ],
  khamenei: [
    { id: "nuclear_missile", name: "موشک هسته‌ای عماد", power: 300, price: 1000, requiredItem: "shahab3", requiredItemName: "موشک شهاب ۳", desc: "قابلیت حمل کلاهک هسته‌ای" },
    { id: "shahad136", name: "شاهد ۱۳۶", power: 250, price: 1500, requiredItem: "mohajer", requiredItemName: "پهباد مهاجر", desc: "پهباد شناور" },
    { id: "bavar_advance", name: "باور ۳۷۳ پیشرفته", power: 400, price: 2000, requiredItem: "bavar", requiredItemName: "باور ۳۷۳", desc: "پدافند هوایی" },
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
  { name: "تیمور لنگ", power: 88, era: "islamic", desc: "تهاجم تیموری" }
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
  { name: "🌪️ طوفان سخت", effect: { gold: -80, military: -15 }, desc: "طوفان به بناها آسیب رساند" },
  { name: "🎓 دوران زرین دانش", effect: { gold: 100, military: 20 }, desc: "پیشرفت دانش، دینار و توان را فزونی بخشید" }
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
  { id: "russia", name: "روسیه", cost: 500, militaryBonus: 30, goldBonus: 20, desc: "پیمان با همسایه شمالی" },
  { id: "china", name: "چین", cost: 600, militaryBonus: 40, goldBonus: 30, desc: "بازرگان خاوری" },
  { id: "germany", name: "آلمان", cost: 800, militaryBonus: 50, goldBonus: 40, desc: "فناوری پیشرفته" }
];

// ==================== توابع کمکی ====================
function getRandomNPC(era) {
  const filtered = npcList.filter(n => n.era === era);
  return filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : { name: "دشمن ناشناس", power: 50, era: era, desc: "نیروی مهاجم" };
}

function getLevel(exp) {
  return Math.floor(exp / 100) + 1;
}

// ==================== سیستم شانس برد بالا تا لول ۵ ====================
function calculateBattleResult(user, enemyPower) {
  const playerPower = user.military + (user.weapon?.power || 0);
  const level = getLevel(user.exp);
  
  let winChance = 0.5;
  if (level <= 5) winChance = 0.75;
  else if (level <= 10) winChance = 0.6;
  
  const isWin = Math.random() < winChance;
  let adjustedEnemyPower = isWin ? Math.floor(enemyPower * 0.7) : Math.floor(enemyPower * 1.3);
  const finalResult = playerPower + (Math.random() * 30 - 10) > adjustedEnemyPower;
  
  return { isWin: finalResult, adjustedEnemyPower };
}

// ==================== بیگ مکس خفن ====================
async function applyBigMax(user, ctx) {
  const oldLevel = getLevel(user.exp - 100);
  const newLevel = getLevel(user.exp);
  
  if (newLevel > oldLevel) {
    const bonus = {
      gold: 5000,
      military: 200,
      exp: 500,
      weapon: { id: `bigmax_${newLevel}`, name: `🔥 خود بیگ مکس سطح ${newLevel} 🔥`, power: 100 * newLevel }
    };
    
    user.gold += bonus.gold;
    user.military += bonus.military;
    user.exp += bonus.exp;
    
    if (!user.weapon || user.weapon.power < bonus.weapon.power) {
      user.weapon = bonus.weapon;
    }
    
    const bigMaxFrame = `
${P.glassBorder}
🔥🌟🌟🌟 **بیگ مکس خفن** 🌟🌟🌟🔥
⚡ **لول آپ افسانه‌ای** ⚡
💰 +${bonus.gold} دینار
⚔️ +${bonus.military} توان رزمی
⭐ +${bonus.exp} تجربه
🗡️ ${bonus.weapon.name}
🔥🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🔥
${P.glassBorder}
`;
    await ctx.replyWithAnimation(animations.levelUp, { caption: bigMaxFrame, parse_mode: "Markdown" });
    return true;
  }
  return false;
}

// ==================== توابع کمکی مأموریت ====================
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

// ==================== منوی اصلی شیشه‌ای ====================
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🏛️ هخامنشیان", "cat_ancient")
    .text("⚔️ صفویان", "cat_islamic")
    .row()
    .text("🏭 پهلویان", "cat_modern")
    .text("🕌 جمهوری اسلامی", "cat_republic");

  const glassWelcome = `
${P.glassBorder}
🪞 **${P.welcome}** 🪞
${P.glassBorder}

**به بازی «بقای باستانی» خوش آمدی، ای سرور گرامی!**

در این جایگاه، تو یکی از **ده فرمانروای بزرگ ایران‌زمین** خواهی شد.
با **خرید خودها** و **پیکار با دشمنان**، نام خود را در **نامه سروران** جاودانه کن.

📜 **یک دسته از شاهان را برگزین:**
`;
  await ctx.replyWithPhoto(categoryImages.ancient, { caption: glassWelcome, parse_mode: "Markdown", reply_markup: keyboard });
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

  const menuText = `
${P.glassBorder}
🪞 **${user.realName || user.leaderName}** 🪞
${P.glassBorder}

👑 **${leader.name}**
📜 ${eraNames[leader.era]}
💰 ${P.gold}: ${user.gold}
⚔️ ${P.power}: ${user.military}
⭐ ${P.level}: ${level}
🗡️ ${P.weapon}: ${user.weapon?.name || "ندارد"}

${P.glassBorder}
`;
  await ctx.replyWithPhoto(leader.image, { caption: menuText, parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== فروشگاه شیشه‌ای ====================
async function showGlassShop(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const weapons = weaponsByEra[user.era];
  const keyboard = new InlineKeyboard();
  weapons.forEach(w => keyboard.text(`${w.name} - ${w.price}💰`, `buy_${w.id}`));
  keyboard.row().text(`🔙 ${P.back}`, "back_to_game");

  const weaponsList = weapons.map(w => `┌─────────────────┐\n│ ⚔️ **${w.name}**\n│ 📖 ${w.desc}\n│ 💰 ${w.price} دینار\n│ 💪 توان: +${w.power}\n└─────────────────┘`).join("\n\n");
  await ctx.reply(`🪞 **${P.shop}** 🪞\n\n💰 ${P.gold}: ${user.gold}\n⚔️ ${P.power}: ${user.military}\n\n${weaponsList}`, { parse_mode: "Markdown", reply_markup: keyboard });
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
  await ctx.replyWithAnimation(animations.levelUp, { caption: `✅ ${recipe.name} ساخته شد!\n💰 ${user.gold} دینار\n⚔️ ${user.military} توان`, parse_mode: "Markdown" });
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
  const { isWin, adjustedEnemyPower } = calculateBattleResult(user, npc.power);
  const reward = isWin ? { gold: 300, exp: 50, military: 10 } : { gold: 30, exp: 5, military: -5 };
  
  user.gold = Math.max(0, user.gold + reward.gold);
  user.exp += reward.exp;
  user.military = Math.max(0, user.military + reward.military);
  if (isWin) user.stats = user.stats || { wins: 0 }; user.stats.wins = (user.stats.wins || 0) + 1;
  usersDB.set(ctx.from.id, user);
  usersDB.delete(ctx.from.id + "_pending");
  updateMissionProgress(ctx.from.id, "battle");
  
  const anim = isWin ? animations.victory : animations.defeat;
  await ctx.replyWithAnimation(anim, { caption: `⚔️ **نبرد با ${npc.name}**\n${isWin ? "🎉 پیروزی!" : "💔 شکست!"}\n💰 ${reward.gold} دینار\n⭐ +${reward.exp} تجربه`, parse_mode: "Markdown" });
  
  const bigMaxApplied = await applyBigMax(user, ctx);
  if (!bigMaxApplied) {
    const keyboard = new InlineKeyboard().text(`🛒 ${P.shop}`, "open_shop").text(`⚔️ ${P.battle}`, "battle").text(`🔙 ${P.back}`, "back_to_game");
    await ctx.reply("اداره پیکار:", { reply_markup: keyboard });
  }
}

async function cancelBattle(ctx) {
  usersDB.delete(ctx.from.id + "_pending");
  await ctx.reply(`🏃‍♂️ ${P.cancel}`);
}

// ==================== وضعیت ====================
async function showStatus(ctx) {
  const user = usersDB.get(ctx.from.id);
  if (!user) return;
  const level = getLevel(user.exp);
  const nextExp = level * 100 - user.exp;
  await ctx.replyWithPhoto(leaders[user.leader].image, {
    caption: `📊 **${user.realName || user.leaderName}**\n\n💰 ${P.gold}: ${user.gold}\n⭐ ${P.level}: ${level}\n📈 تجربه: ${user.exp}/${level*100} (${nextExp} تا سطح بعد)\n⚔️ ${P.power}: ${user.military}\n🗡️ ${P.weapon}: ${user.weapon?.name || "ندارد"}`,
    parse_mode: "Markdown", reply_markup: new InlineKeyboard().text(`🔙 ${P.back}`, "back_to_game")
  });
}

// ==================== لیدربورد ====================
async function showLeaderboard(ctx) {
  const users = Array.from(usersDB.entries()).filter(([key]) => !String(key).includes("admin_") && !String(key).includes("pending"));
  const sorted = users.sort((a, b) => b[1].military - a[1].military).slice(0, 10);
  const text = sorted.map(([id, d], i) => `${i+1}. 👑 **${d.realName || d.leaderName}**\n   💰${d.gold} ⚔️${d.military}`).join("\n\n");
  const keyboard = new InlineKeyboard().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🏆 **${P.leaderboard}**\n\n${text || "هیچ سروری یافت نشد"}`, { parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== نقشه ====================
async function showMap(ctx) {
  const user = usersDB.get(ctx.from.id);
  const userIncome = provinces.filter(p => p.owner === ctx.from.id).reduce((s, p) => s + p.baseIncome, 0);
  const keyboard = new InlineKeyboard().text("⚔️ حمله", "attack_province").text("💰 مالیات", "collect_tax").row().text("🔙 بازگشت", "back_to_game");
  await ctx.replyWithPhoto(mapImage, { caption: `🗺️ **${P.map}**\n💰 درآمد روزانه: ${userIncome} دینار\n⚔️ توان: ${user.military}`, parse_mode: "Markdown", reply_markup: keyboard });
}

// ==================== اتحادها ====================
async function showAlliances(ctx) {
  const user = usersDB.get(ctx.from.id);
  const userAlliances = user.alliances || [];
  const keyboard = new InlineKeyboard();
  alliances.forEach(a => { if (!userAlliances.includes(a.id)) keyboard.text(`اتحاد ${a.name} - ${a.cost}💰`, `ally_${a.id}`); });
  keyboard.row().text("🔙 بازگشت", "back_to_game");
  await ctx.reply(`🤝 **${P.alliance}**\n💰 ${P.gold}: ${user.gold}\n\n` + alliances.map(a => `• ${a.name}: +${a.militaryBonus} توان, +${a.goldBonus} دینار`).join("\n"), { parse_mode: "Markdown", reply_markup: keyboard });
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
  await ctx.reply(`✅ پیمان با ${alliance.name} بسته شد!\n⚔️ +${alliance.militaryBonus} توان\n💰 +${alliance.goldBonus} دینار`);
}

// ==================== مأموریت ====================
async function showMissions(ctx) {
  const user = usersDB.get(ctx.from.id);
  resetDailyMissions(ctx.from.id);
  const text = user.dailyMissions.map(m => `${m.completed ? "✅" : "⏳"} **${m.name}**\n   ${m.progress}/${m.target}`).join("\n\n");
  await ctx.reply(`📋 **${P.mission}**\n\n${text}`, { parse_mode: "Markdown", reply_markup: new InlineKeyboard().text("🔙 بازگشت", "back_to_game") });
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
      const leader = leaders[leaderKey];
      const realName = ctx.from.first_name || "کاربر";
      usersDB.set(ctx.from.id, {
        leader: leaderKey, leaderName: leader.name, realName: realName, era: leader.era,
        gold: 500, exp: 0, military: 50, weapon: null, alliances: [], stats: {},
        dailyMissions: dailyMissions.map(m => ({ ...m, progress: 0, completed: false })),
        lastMissionReset: Date.now()
      });
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await showGameMenu(ctx, leaderKey);
    }
    else if (data.startsWith("back_cat_")) await showCategory(ctx, data.replace("back_cat_", ""));
    else if (data === "back_main") await ctx.reply("بازگشت...");
    else if (data === "open_shop") await showGlassShop(ctx);
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
        await ctx.replyWithAnimation(animations.cyrusAnimation, { caption: `✅ ${item.name} خریداری شد!\n💰 ${user.gold} دینار\n⚔️ ${user.military} توان` });
        await applyBigMax(user, ctx);
      } else await ctx.reply("دینار کافی نیست!");
    }
    else if (data.startsWith("ally_")) await createAlliance(ctx, data.replace("ally_", ""));
    else if (data === "admin_panel_secret" && ADMINS.includes(userId)) await showAdminPanel(ctx);
    else if (data === "admin_list_users" && ADMINS.includes(userId)) {
      const list = Array.from(usersDB.entries()).filter(([k]) => !String(k).includes("admin_")).map(([id, d]) => `${d.realName || d.leaderName} - ${id}`).join("\n");
      await ctx.editMessageText(`📊 لیست کاربران\n${list || "هیچ"}`);
    }
    else if (data === "admin_close") await ctx.deleteMessage();
  } catch (e) { console.error(e); await ctx.reply("❌ خطا"); }
});

// ==================== دستورات ====================
bot.command("help", async (ctx) => { await ctx.reply(`🎮 **بازی بقای باستانی**\n\n/start - آغاز\n/restart - نو کردن\n/admin_panel - پنل ادمین`, { parse_mode: "Markdown" }); });
bot.command("restart", async (ctx) => { usersDB.delete(ctx.from.id); await ctx.reply("🔄 نو شد!"); await bot.commands.start(ctx); });
bot.command("admin_panel", async (ctx) => { if (ADMINS.includes(ctx.from.id)) await showAdminPanel(ctx); else await ctx.reply("❌ دسترسی ندارید!"); });

// ==================== استارت ====================
bot.start();
console.log("🎮 بازی بقای باستانی - نسخه پارسی و شیشه‌ای روشن شد...");