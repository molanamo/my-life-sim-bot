// ==================== index.js - فایل اصلی ربات بقای فرمانروا ====================
const { Bot } = require("grammy");
const { photos } = require("./assets");
const { mainMenu, gameMenu } = require("./bot/menus");
const { handleCallback } = require("./bot/handlers");
const { showAdminPanel, handleAdminCallback, handleAdminMessage } = require("./bot/admin");
const { getPlayer, getRevengeList, getAttackLog } = require("./game/player");
const { attackPlayer, revenge } = require("./game/battle");
const { getStatusText, pvpResultText } = require("./bot/display");
const { getGlassBorder } = require("./utils/helpers");
const { kings } = require("./data/kings");

const bot = new Bot(process.env.BOT_TOKEN);
const ADMINS = process.env.ADMINS ? process.env.ADMINS.split(",").map(Number) : [];

// ==================== دستور /start ====================
bot.command("start", async (ctx) => {
  try {
    const player = getPlayer(ctx.from.id);

    if (player && player.alive) {
      const king = kings[player.kingId];
      if (king && king.photo) {
        await ctx.replyWithPhoto(king.photo, {
          caption: getStatusText(player),
          parse_mode: "Markdown",
          reply_markup: gameMenu(),
        });
      } else {
        await ctx.reply(getStatusText(player), {
          parse_mode: "Markdown",
          reply_markup: gameMenu(),
        });
      }
      return;
    }

    await ctx.replyWithPhoto(photos.shir_khorshid, {
      caption: `${getGlassBorder()}\n🏰 **بقای فرمانروا** 🏰\n${getGlassBorder()}\n\nاز هیچ شروع کن، امپراتوری بساز، ۳۰ روز زنده بمون!\n\n📜 یه دوره انتخاب کن:`,
      parse_mode: "Markdown",
      reply_markup: mainMenu(),
    });
  } catch (err) {
    console.error("Error in start:", err.message);
    await ctx.reply("❌ خطا! دوباره /start رو بزن.");
  }
});

// ==================== پنل ادمین ====================
bot.command("admin", async (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) {
    await ctx.reply("❌ دسترسی غیرمجاز!");
    return;
  }
  await showAdminPanel(ctx);
});

// ==================== دستورات PvP ====================
bot.command("attack", async (ctx) => {
  const player = getPlayer(ctx.from.id);
  if (!player || !player.alive) return ctx.reply("❌ اول /start رو بزن.");

  const targetId = parseInt(ctx.message.text.split(" ")[1]);
  if (!targetId || isNaN(targetId)) return ctx.reply("❌ فرمت: /attack [user_id]");

  const result = attackPlayer(ctx.from.id, targetId);
  await ctx.reply(pvpResultText(result), { parse_mode: "Markdown", reply_markup: gameMenu() });
});

bot.command("revenge", async (ctx) => {
  const player = getPlayer(ctx.from.id);
  if (!player || !player.alive) return ctx.reply("❌ اول /start رو بزن.");

  const targetId = parseInt(ctx.message.text.split(" ")[1]);
  if (!targetId || isNaN(targetId)) return ctx.reply("❌ فرمت: /revenge [user_id]");

  const result = revenge(ctx.from.id, targetId);
  await ctx.reply(pvpResultText(result), { parse_mode: "Markdown", reply_markup: gameMenu() });
});

bot.command("revenge_list", async (ctx) => {
  const player = getPlayer(ctx.from.id);
  if (!player || !player.alive) return ctx.reply("❌ اول /start رو بزن.");

  const list = getRevengeList(ctx.from.id);
  if (list.length === 0) {
    await ctx.reply("😇 کسی بهت حمله نکرده!", { reply_markup: gameMenu() });
    return;
  }

  const text = list.map((r, i) =>
    `${i + 1}. ${r.attackerName} (${r.attackerKing})\n   📅 روز: ${r.day} | ${r.failed ? "💀 حمله ناموفق" : `💰 دزدید: ${r.stolen?.gold || 0} سکه`}\n   🔥 /revenge ${r.attackerId}`
  ).join("\n\n");

  await ctx.reply(`📋 **لیست دشمنان**\n\n${text}`, { parse_mode: "Markdown", reply_markup: gameMenu() });
});

bot.command("attack_log", async (ctx) => {
  const player = getPlayer(ctx.from.id);
  if (!player || !player.alive) return ctx.reply("❌ اول /start رو بزن.");

  const log = getAttackLog(ctx.from.id);
  if (log.length === 0) {
    await ctx.reply("📜 هنوز به کسی حمله نکردی!", { reply_markup: gameMenu() });
    return;
  }

  const text = log.map((l, i) =>
    `${i + 1}. حمله به ${l.targetName} (${l.targetKing})\n   📅 روز: ${l.day} | 💰 سکه: ${l.stolen?.gold || 0}`
  ).join("\n\n");

  await ctx.reply(`📜 **تاریخچه حملات**\n\n${text}`, { parse_mode: "Markdown", reply_markup: gameMenu() });
});

// ==================== هندلر callback ها ====================
bot.on("callback_query:data", async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery().catch(() => {});

    if (data.startsWith("admin_") && ADMINS.includes(ctx.from.id)) {
      await handleAdminCallback(ctx);
      return;
    }

    await handleCallback(ctx);
  } catch (err) {
    console.error("Callback error:", err.message);
  }
});

// ==================== هندلر پیام‌های ادمین ====================
bot.on("message:text", async (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) return;
  await handleAdminMessage(ctx);
});

// ==================== مدیریت خطا ====================
bot.catch((err) => {
  console.error("Bot error:", err.message);
});

// ==================== شروع ربات ====================
console.log("🏰 بقای فرمانروا - در حال اجرا...");

bot.start();