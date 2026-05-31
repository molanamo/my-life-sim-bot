const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || "webhook";
const URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const userData = new Map();

async function tg(method, payload) {
  try {
    const { data } = await axios.post(`${URL}/${method}`, payload);
    return data;
  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function ensureUser(userId, from) {
  if (!userData.has(userId)) {
    userData.set(userId, {
      name: from.first_name || "سرباز",
      level: 1,
      xp: 0,

      gold: 100, // پول
      hp: 100,

      // پناهگاه/زمین
      shelter: { tier: 0, name: "قطعه زمین" },

      // منابع خام (برای ساخت‌وساز)
      resources: {
        wood: 0,
        stone: 0,
        iron: 0,
        steel: 0,
        goldOre: 0,
      },

      inventory: ["چاقوی زنگ‌زده"],
    });
  }
  return userData.get(userId);
}

function xpNeeded(level) {
  // ساده و قابل تنظیم
  return 60 + (level - 1) * 30;
}

function applyXpAndLevelUp(u, gainedXp) {
  u.xp += gainedXp;

  let leveled = false;
  while (u.xp >= xpNeeded(u.level)) {
    u.xp -= xpNeeded(u.level);
    u.level += 1;
    leveled = true;

    // پاداش کوچک برای ارتقا
    u.hp = clamp(u.hp + 10, 0, 100);
    u.gold += 20;
  }
  return leveled;
}

function getHeader(u) {
  const r = u.resources;
  return (
`🪖 پرسنل: ${u.name}
🎖 رده: ${u.level}  |  📌 XP: ${u.xp}/${xpNeeded(u.level)}
❤️ سلامتی: ${u.hp}/100
💰 اعتبار: ${u.gold}$

📦 منابع: چوب:${r.wood} | سنگ:${r.stone} | آهن:${r.iron} | فولاد:${r.steel} | سنگ‌طلا:${r.goldOre}
🏚 پناهگاه: ${u.shelter.name} (سطح ${u.shelter.tier})
━━━━━━━━━━━━━━━━━━━━━━
`
  );
}

/** منوها */
const menus = {
  main: () => ({
    inline_keyboard: [
      [{ text: "🔫 زرادخانه", callback_data: "menu_armory" }],
      [{ text: "🛠 کارگاه ساخت‌وساز", callback_data: "menu_workshop" }],
      [{ text: "🏚 پناهگاه", callback_data: "menu_shelter" }],
      [{ text: "🛒 بازار سیاه", callback_data: "menu_blackmarket" }],
      [{ text: "🎖 مأموریت‌های بقا", callback_data: "menu_missions" }],
      [{ text: "🕌 سنگر بازیابی", callback_data: "menu_recovery" }],
    ],
  }),
  backMain: () => ({
    inline_keyboard: [[{ text: "↩️ بازگشت به مرکز فرماندهی", callback_data: "back_main" }]],
  }),
};

function missionsKeyboard(u) {
  // قفل مأموریت‌ها بر اساس سطح
  const canMedium = u.level >= 3;
  const canHard = u.level >= 6;
  const canSpec = u.level >= 10;

  return {
    inline_keyboard: [
      [{ text: "🟢 گشت‌زنی اطراف (آسان)", callback_data: "mission_easy" }],
      [{ text: canMedium ? "🟡 کمین در حاشیه شهر (متوسط)" : "🔒 متوسط (سطح 3 لازم)", callback_data: canMedium ? "mission_medium" : "locked" }],
      [{ text: canHard ? "🔴 نفوذ به معدن متروکه (سخت)" : "🔒 سخت (سطح 6 لازم)", callback_data: canHard ? "mission_hard" : "locked" }],
      [{ text: canSpec ? "⚫ عملیات ویژه (مرگبار)" : "🔒 ویژه (سطح 10 لازم)", callback_data: canSpec ? "mission_special" : "locked" }],
      [{ text: "📊 گزارش مأموریت/وضعیت", callback_data: "mission_report" }],
      [{ text: "↩️ بازگشت", callback_data: "back_main" }],
    ],
  };
}

/** جدول مأموریت‌ها */
const MISSION_DEFS = {
  easy: {
    title: "🟢 گشت‌زنی اطراف",
    hpLoss: [2, 10],
    moneyReward: [5, 20],
    xp: [10, 18],
    loot: [
      { key: "wood", min: 2, max: 8, chance: 0.85 },
      { key: "stone", min: 1, max: 6, chance: 0.60 },
    ],
  },
  medium: {
    title: "🟡 کمین حاشیه شهر",
    hpLoss: [6, 18],
    moneyReward: [15, 40],
    xp: [18, 30],
    loot: [
      { key: "wood", min: 3, max: 12, chance: 0.75 },
      { key: "stone", min: 3, max: 12, chance: 0.75 },
      { key: "iron", min: 1, max: 5, chance: 0.45 },
    ],
  },
  hard: {
    title: "🔴 نفوذ به معدن متروکه",
    hpLoss: [12, 30],
    moneyReward: [30, 80],
    xp: [30, 55],
    loot: [
      { key: "stone", min: 6, max: 20, chance: 0.80 },
      { key: "iron", min: 3, max: 10, chance: 0.70 },
      { key: "steel", min: 1, max: 4, chance: 0.35 },
      { key: "goldOre", min: 1, max: 3, chance: 0.20 },
    ],
  },
  special: {
    title: "⚫ عملیات ویژه",
    hpLoss: [20, 55],
    moneyReward: [60, 160],
    xp: [60, 110],
    loot: [
      { key: "iron", min: 6, max: 18, chance: 0.85 },
      { key: "steel", min: 3, max: 10, chance: 0.65 },
      { key: "goldOre", min: 2, max: 8, chance: 0.50 },
    ],
  },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollLoot(u, missionDef) {
  const r = u.resources;
  const gained = [];

  for (const item of missionDef.loot) {
    if (Math.random() <= item.chance) {
      const amount = randInt(item.min, item.max);
      r[item.key] += amount;
      gained.push({ key: item.key, amount });
    }
  }
  return gained;
}

function formatLoot(gained) {
  if (!gained.length) return "هیچ. دست خالی برگشتی.";
  const nameMap = {
    wood: "چوب",
    stone: "سنگ",
    iron: "آهن",
    steel: "فولاد",
    goldOre: "سنگ‌طلا",
  };
  return gained.map(g => `+${g.amount} ${nameMap[g.key] || g.key}`).join("\n");
}

/** کارگاه: ارتقای پناهگاه با منابع */
function workshopKeyboard(u) {
  return {
    inline_keyboard: [
      [{ text: "🏗 ارتقای پناهگاه", callback_data: "upgrade_shelter" }],
      [{ text: "📦 نمایش منابع", callback_data: "show_resources" }],
      [{ text: "↩️ بازگشت", callback_data: "back_main" }],
    ],
  };
}

function shelterUpgradeCost(nextTier) {
  // هزینه‌ها به ازای tier
  const costs = {
    1: { wood: 20, stone: 10, iron: 0, steel: 0, goldOre: 0, gold: 25 },
    2: { wood: 50, stone: 35, iron: 10, steel: 0, goldOre: 0, gold: 60 },
    3: { wood: 90, stone: 70, iron: 25, steel: 6, goldOre: 0, gold: 120 },
    4: { wood: 140, stone: 120, iron: 45, steel: 18, goldOre: 3, gold: 220 },
  };
  return costs[nextTier] || null;
}

function shelterNameByTier(tier) {
  switch (tier) {
    case 0: return "قطعه زمین";
    case 1: return "کلبه موقت";
    case 2: return "پناهگاه چوبی";
    case 3: return "سنگر تقویت‌شده";
    case 4: return "پایگاه عملیاتی";
    default: return `پایگاه سطح ${tier}`;
  }
}

function canPayUpgrade(u, cost) {
  const r = u.resources;
  return (
    u.gold >= (cost.gold || 0) &&
    r.wood >= (cost.wood || 0) &&
    r.stone >= (cost.stone || 0) &&
    r.iron >= (cost.iron || 0) &&
    r.steel >= (cost.steel || 0) &&
    r.goldOre >= (cost.goldOre || 0)
  );
}

function payUpgrade(u, cost) {
  const r = u.resources;
  u.gold -= (cost.gold || 0);
  r.wood -= (cost.wood || 0);
  r.stone -= (cost.stone || 0);
  r.iron -= (cost.iron || 0);
  r.steel -= (cost.steel || 0);
  r.goldOre -= (cost.goldOre || 0);
}

/** روت وبهوک */
app.get("/", (req, res) => res.send("Bot is running"));

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  // پیام متنی
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || "";

    if (text === "/start") {
      const u = ensureUser(userId, msg.from);
      await tg("sendMessage", {
        chat_id: chatId,
        text: getHeader(u) + "📡 مرکز فرماندهی: انتخاب کن. وقت تلف نکن.",
        reply_markup: menus.main(),
      });
      return;
    }

    // فرمان وضعیت
    if (text === "/status") {
      const u = ensureUser(userId, msg.from);
      await tg("sendMessage", {
        chat_id: chatId,
        text: getHeader(u) + "📌 گزارش وضعیت ثبت شد.",
      });
      return;
    }

    await tg("sendMessage", { chat_id: chatId, text: "📛 دستور نامعتبر. /start" });
  }

  // دکمه‌ها
  if (update.callback_query) {
    const q = update.callback_query;
    const chatId = q.message.chat.id;
    const messageId = q.message.message_id;
    const userId = q.from.id;

    const u = ensureUser(userId, q.from);

    await tg("answerCallbackQuery", { callback_query_id: q.id });

    const edit = async (text, reply_markup) => {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup,
      });
    };

    if (q.data === "locked") {
      await tg("answerCallbackQuery", {
        callback_query_id: q.id,
        text: "🔒 دسترسی نداری. سطح پایین‌تر از حد مجاز است.",
        show_alert: true,
      });
      return;
    }

    switch (q.data) {
      case "back_main":
        await edit(getHeader(u) + "📡 مرکز فرماندهی: گزارش بده.", menus.main());
        break;

      case "menu_missions":
        await edit(getHeader(u) + "🎖 مأموریت‌های بقا: انتخاب کن. عقب‌نشینی بهانه نیست.", missionsKeyboard(u));
        break;

      case "mission_report":
        await edit(
          getHeader(u) +
            "📊 گزارش: منابع جمع‌آوری‌شده برای ساخت پناهگاه استفاده می‌شن. هر ارتقا، بقا رو تضمین می‌کنه.",
          missionsKeyboard(u)
        );
        break;

      case "mission_easy":
      case "mission_medium":
      case "mission_hard":
      case "mission_special": {
        const key = q.data.replace("mission_", "");
        const def = MISSION_DEFS[key];

        if (u.hp <= 0) {
          await edit(getHeader(u) + "☠️ وضعیت: مرده. مأموریت برای جنازه‌ها تعریف نشده.", menus.backMain());
          break;
        }

        const hpLoss = randInt(def.hpLoss[0], def.hpLoss[1]);
        const moneyReward = randInt(def.moneyReward[0], def.moneyReward[1]);
        const gainedXp = randInt(def.xp[0], def.xp[1]);

        u.hp = clamp(u.hp - hpLoss, 0, 100);
        u.gold += moneyReward;

        const loot = rollLoot(u, def);
        const leveledUp = applyXpAndLevelUp(u, gainedXp);

        let result =
          getHeader(u) +
          `${def.title}\n` +
          `💥 درگیری انجام شد.\n` +
          `🩸 تلفات: -${hpLoss} HP\n` +
          `💰 غنیمت نقدی: +${moneyReward}$\n` +
          `🎯 تجربه: +${gainedXp} XP\n\n` +
          `📦 لوت:\n${formatLoot(loot)}\n`;

        if (leveledUp) {
          result += `\n⬆️ ارتقا: سطح شما افزایش یافت. از این به بعد اشتباهات شما گران‌تر تمام می‌شود.\n`;
        }

        if (u.hp === 0) {
          result += `\n☠️ هشدار: سلامتی صفر شد. اگر بازیابی نکنی، دفعه بعد فقط اسم‌ت می‌مونه.\n`;
        }

        await edit(result, missionsKeyboard(u));
        break;
      }

      case "menu_workshop":
        await edit(getHeader(u) + "🛠 کارگاه: منابع را تبدیل کن. بی‌برنامه زنده نمی‌مانی.", workshopKeyboard(u));
        break;

      case "show_resources":
        await edit(getHeader(u) + "📦 موجودی منابع نمایش داده شد.", workshopKeyboard(u));
        break;

      case "upgrade_shelter": {
        const nextTier = u.shelter.tier + 1;
        const cost = shelterUpgradeCost(nextTier);

        if (!cost) {
          await edit(getHeader(u) + "🧱 پناهگاه: حداکثر ارتقا فعلاً همین است. بیشتر می‌خواهی؟ هزینه‌اش را هم باید تعریف کنیم.", workshopKeyboard(u));
          break;
        }

        if (!canPayUpgrade(u, cost)) {
          await edit(
            getHeader(u) +
              `❌ کمبود منابع برای ارتقا به سطح ${nextTier}.\n` +
              `هزینه لازم:\n` +
              `💰 پول: ${cost.gold || 0}$\n` +
              `🪵 چوب: ${cost.wood || 0}\n` +
              `🪨 سنگ: ${cost.stone || 0}\n` +
              `⛓ آهن: ${cost.iron || 0}\n` +
              `🧱 فولاد: ${cost.steel || 0}\n` +
              `🟡 سنگ‌طلا: ${cost.goldOre || 0}\n`,
            workshopKeyboard(u)
          );
          break;
        }

        payUpgrade(u, cost);
        u.shelter.tier = nextTier;
        u.shelter.name = shelterNameByTier(nextTier);

        await edit(getHeader(u) + `✅ ارتقا انجام شد. پناهگاه اکنون: ${u.shelter.name}\nدفعه بعد منابع بیشتری می‌خواهی.`, workshopKeyboard(u));
        break;
      }

      case "menu_shelter":
        await edit(getHeader(u) + "🏚 پناهگاه: اینجا خانه نیست؛ خط آخر دفاع توست.", menus.backMain());
        break;

      case "menu_blackmarket":
        await edit(getHeader(u) + "🛒 بازار سیاه: معامله کن، اما حواس‌ت جمع باشد.", menus.backMain());
        break;

      case "menu_armory":
        await edit(getHeader(u) + "🔫 زرادخانه: فعلاً نمایشی. بعداً با ساخت/خرید پر می‌شود.", menus.backMain());
        break;

      case "menu_recovery":
        u.hp = 100;
        await edit(getHeader(u) + "🕌 بازیابی انجام شد. برگرد سرِ مأموریت.", menus.backMain());
        break;

      default:
        // هیچ
        break;
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
