// منوها و کیبوردهای بازی بقای فرمانروا
const { InlineKeyboard } = require("grammy");

/**
 * منوی اصلی (اول بازی)
 */
function mainMenu() {
  return new InlineKeyboard()
    .text("👑 باستان", "era_ancient")
    .text("⚔️ اسلامی", "era_islamic").row()
    .text("🏭 مدرن", "era_modern")
    .text("🕌 انقلاب", "era_revolution").row()
    .text("📊 لیدربورد", "leaderboard")
    .text("⚔️ PvP", "pvp_menu");
}

/**
 * منوی اصلی بازی (بعد از انتخاب شاه)
 */
function gameMenu() {
  return new InlineKeyboard()
    .text("🌲 جمع‌آوری", "gather")
    .text("🏹 شکار", "hunt").row()
    .text("⚔️ نبرد با دشمن", "battle_menu")
    .text("👹 باس", "boss_fight").row()
    .text("🛒 بازار", "shop")
    .text("👸 حرمسرا", "harem").row()
    .text("🍳 آشپزی", "cook")
    .text("💤 استراحت", "rest").row()
    .text("🎉 عیاشی", "party")
    .text("🏗️ پناهگاه", "upgrade_shelter").row()
    .text("⚔️ حمله به بازیکن", "pvp_attack")
    .text("🔥 انتقام", "revenge_list").row()
    .text("📊 وضعیت", "status")
    .text("🌙 پایان روز", "end_day");
}

/**
 * دکمه برگشت ساده
 */
function backButton() {
  return new InlineKeyboard().text("🔙 بازگشت", "back_to_game");
}

/**
 * دکمه برگشت به منوی اصلی
 */
function backToMainButton() {
  return new InlineKeyboard().text("🔙 منوی اصلی", "back_start");
}

/**
 * پنل ادمین مخفی
 */
function adminPanel() {
  return new InlineKeyboard()
    .text("💰 سکه", "admin_give_gold")
    .text("🍖 غذا", "admin_give_food")
    .text("⚔️ سرباز", "admin_give_soldiers").row()
    .text("🪵 چوب", "admin_give_wood")
    .text("🪨 سنگ", "admin_give_stone")
    .text("⛓️ آهن", "admin_give_iron").row()
    .text("🏆 فول کردن", "admin_full")
    .text("💀 کشتن", "admin_kill").row()
    .text("🔄 ریست", "admin_reset")
    .text("📊 لیست بازیکن‌ها", "admin_list").row()
    .text("📈 آمار", "admin_stats")
    .text("⏹ بستن", "admin_close");
}

/**
 * منوی نبرد
 */
function battleMenu() {
  return new InlineKeyboard()
    .text("🐺 گرگ (آسون)", "battle_wolf")
    .text("🗡️ راهزن (متوسط)", "battle_bandit").row()
    .text("⚔️ سرباز تاریکی (سخت)", "battle_dark_soldier")
    .text("🥷 قاتل (خیلی سخت)", "battle_assassin").row()
    .text("🤖 ماشین جنگی (فوق‌العاده)", "battle_war_machine").row()
    .text("🔙 بازگشت", "back_to_game");
}

/**
 * منوی بازار
 */
function shopMenu() {
  return new InlineKeyboard()
    .text("🗡️ سلاح‌ها", "shop_weapons")
    .text("🛡️ زره‌ها", "shop_armors").row()
    .text("🍖 غذاها", "shop_foods")
    .text("📦 منابع", "shop_resources").row()
    .text("🔙 بازگشت", "back_to_game");
}

/**
 * منوی PvP
 */
function pvpMenu() {
  return new InlineKeyboard()
    .text("⚔️ حمله به بازیکن", "pvp_attack")
    .text("🔥 انتقام گرفتن", "revenge_list").row()
    .text("📜 تاریخچه حملات", "attack_log")
    .text("📋 لیست دشمنان", "revenge_list").row()
    .text("🔙 بازگشت", "back_to_game");
}

module.exports = {
  mainMenu,
  gameMenu,
  backButton,
  backToMainButton,
  adminPanel,
  battleMenu,
  shopMenu,
  pvpMenu,
};