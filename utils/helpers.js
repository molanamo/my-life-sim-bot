// توابع کمکی بازی بقای فرمانروا

/**
 * فرمت اعداد بزرگ به صورت خلاصه
 * مثال: 1500 → 1.5K | 2500000 → 2.5M
 */
function formatNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return Math.floor(num).toString();
}

/**
 * عدد تصادفی بین min و max
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * انتخاب یه آیتم تصادفی از آرایه
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * حاشیه تزئینی شیشه‌ای
 */
function getGlassBorder() {
  return "✨⚜️✨⚜️✨⚜️✨⚜️✨⚜️✨";
}

/**
 * نوار پیشرفت
 * progressBar(3, 10) → "███░░░░░░░"
 */
function progressBar(current, max, length = 10) {
  const filled = Math.round((Math.max(0, Math.min(current, max)) / max) * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}

/**
 * درصد
 * percent(3, 10) → "30%"
 */
function percent(part, total) {
  if (total === 0) return "0%";
  return Math.round((part / total) * 100) + "%";
}

/**
 * تبدیل عدد به ایموجی عدد
 * numberToEmoji(42) → "4️⃣2️⃣"
 */
function numberToEmoji(num) {
  const emojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
  return String(num).split("").map(d => emojis[parseInt(d)]).join("");
}

/**
 * شانس درصدی
 * chance(30) → 30% احتمال true
 */
function chance(percent) {
  return Math.random() * 100 < percent;
}

/**
 * ساعت بازی بر اساس روز
 */
function getTimeOfDay(day) {
  const times = ["🌅 صبح", "☀️ ظهر", "🌤️ عصر", "🌙 شب"];
  return times[day % 4];
}

module.exports = {
  formatNumber,
  randomInt,
  pickRandom,
  getGlassBorder,
  progressBar,
  percent,
  numberToEmoji,
  chance,
  getTimeOfDay,
};