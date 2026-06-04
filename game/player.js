// مدیریت بازیکن - بقای فرمانروا
const CONFIG = require("../utils/config");
const { kings } = require("../data/kings");

// دیتابیس موقت (توی حافظه)
const players = new Map();

/**
 * ساخت پروفایل جدید برای بازیکن
 */
function createPlayer(userId, firstName, kingId) {
  const king = kings[kingId];
  if (!king) return null;

  const diff = CONFIG.DIFFICULTY;
  const startRes = CONFIG.START_RESOURCES[diff] || CONFIG.START_RESOURCES.normal;

  const player = {
    userId,
    firstName,
    
    // پادشاه
    kingId,
    kingName: king.name,
    era: king.era,
    
    // منابع
    gold: startRes.gold + (king.bonus?.gold || 0),
    food: king.startFood + (king.bonus?.food || 0),
    wood: startRes.wood + (king.bonus?.wood || 0),
    stone: startRes.stone + (king.bonus?.stone || 0),
    iron: startRes.iron + (king.bonus?.iron || 0),
    
    // نظامی
    soldiers: startRes.soldiers + (king.bonus?.soldiers || 0),
    health: startRes.health,
    maxHealth: startRes.health,
    
    // تجهیزات
    weapon: null,
    armor: null,
    
    // پناهگاه
    shelterLevel: 1,
    
    // ملکه‌ها
    queens: [],
    
    // پیشرفت
    day: 1,
    actionsLeft: CONFIG.ACTIONS_PER_DAY,
    exp: 0,
    level: 1,
    
    // آمار
    battlesWon: 0,
    bossesDefeated: 0,
    totalGoldEarned: 0,
    
    // وضعیت
    alive: true,
    bossDefeatedToday: false,
  };

  players.set(userId, player);
  return player;
}

/**
 * گرفتن اطلاعات بازیکن
 */
function getPlayer(userId) {
  return players.get(userId) || null;
}

/**
 * ذخیره بازیکن
 */
function savePlayer(userId, player) {
  players.set(userId, player);
}

/**
 * حذف بازیکن
 */
function deletePlayer(userId) {
  players.delete(userId);
}

/**
 * چک زنده بودن
 */
function isAlive(userId) {
  const p = getPlayer(userId);
  return p && p.alive;
}

/**
 * پایان روز - ریست اکشن‌ها و اعمال رویدادهای روزانه
 */
function endDay(userId) {
  const player = getPlayer(userId);
  if (!player) return false;

  // افزایش روز
  player.day += 1;
  player.actionsLeft = CONFIG.ACTIONS_PER_DAY;
  player.bossDefeatedToday = false;

  // مصرف غذای روزانه
  const foodNeeded = 1 + Math.floor(player.soldiers / 5);
  player.food -= foodNeeded;

  // گرسنگی → کاهش سلامت
  if (player.food < 0) {
    player.health += player.food * 5;
    player.food = 0;
  }

  // اثر ملکه‌ها
  if (player.queens.includes("atousa")) player.gold += 50;
  if (player.queens.includes("kasandan")) player.food += 2;
  if (player.queens.includes("parmis")) player.soldiers += 3;
  if (player.queens.includes("malek_jahan")) player.wood += 5;
  if (player.queens.includes("taj_olmoluk")) player.iron += 3;
  if (player.queens.includes("esmat")) player.stone += 5;
  if (player.queens.includes("khadijeh")) player.food += 3;
  if (player.queens.includes("mansoureh")) player.soldiers += 2;

  // درمان شبانه
  const shelterHeal = CONFIG.SHELTER[player.shelterLevel]?.healRate || 1;
  const queenHeal = player.queens.includes("shirin") ? 3 : 0;
  player.health = Math.min(player.maxHealth, player.health + shelterHeal + queenHeal);

  // دفاع ملکه آرتونیس
  if (player.queens.includes("artunis")) {
    player.health += 2;
  }

  // چک مرگ
  if (player.health <= 0) {
    player.alive = false;
    player.health = 0;
  }

  // اتمام بازی
  if (player.day > CONFIG.MAX_DAYS) {
    player.alive = false;
  }

  savePlayer(userId, player);
  return true;
}

/**
 * اضافه کردن تجربه و لول آپ
 */
function addExp(userId, amount) {
  const player = getPlayer(userId);
  if (!player) return;

  player.exp += amount;
  const newLevel = Math.floor(player.exp / 100) + 1;
  
  if (newLevel > player.level) {
    player.level = newLevel;
    player.maxHealth += 5;
    player.health = Math.min(player.health + 10, player.maxHealth);
    return true; // لول آپ شده
  }
  
  savePlayer(userId, player);
  return false;
}

module.exports = {
  createPlayer,
  getPlayer,
  savePlayer,
  deletePlayer,
  isAlive,
  endDay,
  addExp,
};