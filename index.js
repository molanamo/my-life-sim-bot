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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ensureUser(userId, from) {
  if (!userData.has(userId)) {
    userData.set(userId, {
      name: from.first_name || "سرباز",
      title: "",
      level: 1,
      xp: 0,
      gold: 100,
      hp: 100,
      shelter: { tier: 0, name: "قطعه زمین" },
      resources: {
        wood: 0,
        stone: 0,
        iron: 0,
        steel: 0,
        goldOre: 0,
        copper: 0,
        cloth: 0,
        medicine: 0,
        electronics: 0,
        gunpowder: 0
      },
      inventory: ["چاقوی زنگ‌زده"],
      recovery: {
        totalActs: 0,
        prayCount: 0,
        quranCount: 0,
        mosqueCount: 0,
        namazCount: 0
      }
    });
  }
  return userData.get(userId);
}

function xpNeeded(level) {
  return 60 + (level - 1) * 35;
}

function applyXpAndLevelUp(u, gainedXp) {
  u.xp += gainedXp;
  let leveled = false;
  while (u.xp >= xpNeeded(u.level)) {
    u.xp -= xpNeeded(u.level);
    u.level += 1;
    leveled = true;
    u.hp = clamp(u.hp + 10, 0, 100);
    u.gold += 25;
  }
  return leveled;
}

function getRecoveryTitle(totalActs) {
  if (totalActs >= 20) return "حاج آقا";
  if (totalActs >= 10) return "طلبه";
  if (totalActs >= 5) return "بچه طلبه";
  if (totalActs >= 3) return "بچه هیئتی";
  return "";
}

function getDisplayName(u) {
  const label = getRecoveryTitle(u.recovery.totalActs);
  return label ? `${u.name} | ${label}` : u.name;
}

function getHeader(u) {
  const r = u.resources;
  return `🪖 نیرو: ${getDisplayName(u)}
🎖 سطح: ${u.level}/50 | 📌 XP: ${u.xp}/${xpNeeded(u.level)}
❤️ جان: ${u.hp}/100
💰 اعتبار: ${u.gold}$

📦 منابع:
🪵 چوب:${r.wood} | 🪨 سنگ:${r.stone} | ⛓ آهن:${r.iron} | 🧱 فولاد:${r.steel}
🟡 سنگ‌طلا:${r.goldOre} | 🟠 مس:${r.copper} | 🧵 پارچه:${r.cloth}
💊 دارو:${r.medicine} | 📟 قطعات:${r.electronics} | 💥 باروت:${r.gunpowder}

🏚 سنگر: ${u.shelter.name} | مرحله ${u.shelter.tier}
━━━━━━━━━━━━━━━━━━━━━━
`;
}

const menus = {
  main: () => ({
    inline_keyboard: [
      [{ text: "🔫 زرادخانه", callback_data: "menu_armory" }],
      [{ text: "🛠 کارگاه ساخت", callback_data: "menu_workshop" }],
      [{ text: "🏚 پناهگاه", callback_data: "menu_shelter" }],
      [{ text: "🛒 بازار سیاه", callback_data: "menu_blackmarket" }],
      [{ text: "🎖 ماموریت‌های بقا", callback_data: "menu_missions" }],
      [{ text: "🕌 سنگر بازیابی", callback_data: "menu_recovery" }]
    ]
  }),
  backMain: () => ({
    inline_keyboard: [[{ text: "↩️ بازگشت", callback_data: "back_main" }]]
  })
};

function missionsKeyboard(u) {
  return {
    inline_keyboard: [
      [{ text: "1️⃣ جمع‌آوری اطراف اردوگاه", callback_data: "mission_1" }],
      [{ text: "2️⃣ پاکسازی جاده فرعی", callback_data: "mission_2" }],
      [{ text: "3️⃣ یورش به انبار متروکه", callback_data: "mission_3" }],
      [{ text: u.level >= 4 ? "4️⃣ معدن سنگ" : "🔒 ماموریت 4 | سطح 4", callback_data: u.level >= 4 ? "mission_4" : "locked" }],
      [{ text: u.level >= 6 ? "5️⃣ حمله شبانه" : "🔒 ماموریت 5 | سطح 6", callback_data: u.level >= 6 ? "mission_5" : "locked" }],
      [{ text: u.level >= 8 ? "6️⃣ تونل آهن" : "🔒 ماموریت 6 | سطح 8", callback_data: u.level >= 8 ? "mission_6" : "locked" }],
      [{ text: u.level >= 10 ? "7️⃣ کاروان غارت‌شده" : "🔒 ماموریت 7 | سطح 10", callback_data: u.level >= 10 ? "mission_7" : "locked" }],
      [{ text: u.level >= 13 ? "8️⃣ کارخانه سوخته" : "🔒 ماموریت 8 | سطح 13", callback_data: u.level >= 13 ? "mission_8" : "locked" }],
      [{ text: u.level >= 16 ? "9️⃣ پالایشگاه رهاشده" : "🔒 ماموریت 9 | سطح 16", callback_data: u.level >= 16 ? "mission_9" : "locked" }],
      [{ text: u.level >= 20 ? "🔟 دژ فولادی" : "🔒 ماموریت 10 | سطح 20", callback_data: u.level >= 20 ? "mission_10" : "locked" }],
      [{ text: u.level >= 25 ? "1️⃣1️⃣ معدن طلا", callback_data: "mission_11" } : { text: "🔒 ماموریت 11 | سطح 25", callback_data: "locked" }],
      [{ text: u.level >= 35 ? "1️⃣2️⃣ عملیات آخرالزمان", callback_data: "mission_12" } : { text: "🔒 ماموریت 12 | سطح 35", callback_data: "locked" }],
      [{ text: "📊 گزارش بقا", callback_data: "mission_report" }],
      [{ text: "↩️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

function recoveryKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🤲 دعا کردن", callback_data: "recovery_pray" }],
      [{ text: "📖 قرآن خواندن", callback_data: "recovery_quran" }],
      [{ text: "🕌 رفتن به مسجد", callback_data: "recovery_mosque" }],
      [{ text: "🧎 نماز خواندن", callback_data: "recovery_namaz" }],
      [{ text: "📿 گزارش معنوی", callback_data: "recovery_report" }],
      [{ text: "↩️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

const MISSION_DEFS = {
  1: { title: "جمع‌آوری اطراف اردوگاه", hpLoss: [2, 8], moneyReward: [5, 15], xp: [8, 15], loot: [
    { key: "wood", min: 3, max: 10, chance: 0.9 },
    { key: "stone", min: 2, max: 8, chance: 0.7 }
  ]},
  2: { title: "پاکسازی جاده فرعی", hpLoss: [4, 12], moneyReward: [10, 25], xp: [12, 20], loot: [
    { key: "wood", min: 4, max: 12, chance: 0.75 },
    { key: "stone", min: 4, max: 10, chance: 0.75 },
    { key: "cloth", min: 1, max: 4, chance: 0.35 }
  ]},
  3: { title: "یورش به انبار متروکه", hpLoss: [5, 14], moneyReward: [12, 30], xp: [14, 24], loot: [
    { key: "wood", min: 5, max: 12, chance: 0.7 },
    { key: "stone", min: 4, max: 12, chance: 0.7 },
    { key: "iron", min: 1, max: 4, chance: 0.4 }
  ]},
  4: { title: "معدن سنگ", hpLoss: [8, 18], moneyReward: [20, 40], xp: [20, 32], loot: [
    { key: "stone", min: 10, max: 22, chance: 0.95 },
    { key: "iron", min: 2, max: 5, chance: 0.35 }
  ]},
  5: { title: "حمله شبانه", hpLoss: [10, 20], moneyReward: [25, 50], xp: [22, 35], loot: [
    { key: "gunpowder", min: 2, max: 6, chance: 0.55 },
    { key: "cloth", min: 2, max: 5, chance: 0.45 },
    { key: "medicine", min: 1, max: 3, chance: 0.25 }
  ]},
  6: { title: "تونل آهن", hpLoss: [12, 24], moneyReward: [30, 60], xp: [28, 42], loot: [
    { key: "iron", min: 5, max: 14, chance: 0.85 },
    { key: "stone", min: 6, max: 15, chance: 0.7 }
  ]},
  7: { title: "کاروان غارت‌شده", hpLoss: [13, 26], moneyReward: [35, 75], xp: [30, 48], loot: [
    { key: "wood", min: 6, max: 18, chance: 0.55 },
    { key: "cloth", min: 3, max: 8, chance: 0.65 },
    { key: "electronics", min: 1, max: 3, chance: 0.35 },
    { key: "medicine", min: 1, max: 4, chance: 0.4 }
  ]},
  8: { title: "کارخانه سوخته", hpLoss: [16, 30], moneyReward: [45, 90], xp: [38, 56], loot: [
    { key: "iron", min: 5, max: 12, chance: 0.75 },
    { key: "steel", min: 2, max: 5, chance: 0.5 },
    { key: "electronics", min: 2, max: 5, chance: 0.45 }
  ]},
  9: { title: "پالایشگاه رهاشده", hpLoss: [18, 34], moneyReward: [55, 110], xp: [45, 68], loot: [
    { key: "steel", min: 3, max: 8, chance: 0.6 },
    { key: "gunpowder", min: 3, max: 8, chance: 0.5 },
    { key: "copper", min: 4, max: 10, chance: 0.7 }
  ]},
  10: { title: "دژ فولادی", hpLoss: [22, 40], moneyReward: [70, 140], xp: [55, 80], loot: [
    { key: "steel", min: 6, max: 14, chance: 0.75 },
    { key: "iron", min: 6, max: 15, chance: 0.7 },
    { key: "medicine", min: 2, max: 5, chance: 0.4 }
  ]},
  11: { title: "معدن طلا", hpLoss: [24, 44], moneyReward: [90, 180], xp: [65, 95], loot: [
    { key: "goldOre", min: 3, max: 9, chance: 0.8 },
    { key: "iron", min: 4, max: 12, chance: 0.55 },
    { key: "steel", min: 2, max: 6, chance: 0.35 }
  ]},
  12: { title: "عملیات آخرالزمان", hpLoss: [28, 55], moneyReward: [120, 250], xp: [90, 140], loot: [
    { key: "goldOre", min: 5, max: 14, chance: 0.75 },
    { key: "steel", min: 5, max: 12, chance: 0.75 },
    { key: "electronics", min: 3, max: 8, chance: 0.6 },
    { key: "gunpowder", min: 4, max: 10, chance: 0.6 },
    { key: "medicine", min: 2, max: 6, chance: 0.5 }
  ]}
};

function rollLoot(u, missionDef) {
  const gained = [];
  for (const item of missionDef.loot) {
    if (Math.random() <= item.chance) {
      const amount = randInt(item.min, item.max);
      u.resources[item.key] += amount;
      gained.push({ key: item.key, amount });
    }
  }
  return gained;
}

function formatLoot(gained) {
  if (!gained.length) return "هیچ";
  const names = {
    wood: "چوب",
    stone: "سنگ",
    iron: "آهن",
    steel: "فولاد",
    goldOre: "سنگ طلا",
    copper: "مس",
    cloth: "پارچه",
    medicine: "دارو",
    electronics: "قطعات الکترونیک",
    gunpowder: "باروت"
  };
  return gained.map(x => `+${x.amount} ${names[x.key]}`).join("\n");
}

function workshopKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🏗 ارتقای پناهگاه", callback_data: "upgrade_shelter" }],
      [{ text: "📦 نمایش منابع", callback_data: "show_resources" }],
      [{ text: "↩️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

function shelterUpgradeCost(nextTier) {
  const costs = {
    1: { wood: 20, stone: 10, iron: 0, steel: 0, goldOre: 0, copper: 0, cloth: 0, medicine: 0, electronics: 0, gunpowder: 0, gold: 20 },
    2: { wood: 45, stone: 30, iron: 8, steel: 0, goldOre: 0, copper: 0, cloth: 5, medicine: 0, electronics: 0, gunpowder: 0, gold: 50 },
    3: { wood: 80, stone: 60, iron: 20, steel: 5, goldOre: 0, copper: 5, cloth: 10, medicine: 2, electronics: 0, gunpowder: 0, gold: 100 },
    4: { wood: 120, stone: 100, iron: 35, steel: 15, goldOre: 2, copper: 10, cloth: 12, medicine: 4, electronics: 3, gunpowder: 2, gold: 180 },
    5: { wood: 180, stone: 150, iron: 55, steel: 30, goldOre: 5, copper: 20, cloth: 18, medicine: 6, electronics: 8, gunpowder: 5, gold: 300 }
  };
  return costs[nextTier] || null;
}

function shelterNameByTier(tier) {
  switch (tier) {
    case 0: return "قطعه زمین";
    case 1: return "آلونک اضطراری";
    case 2: return "کلبه بقا";
    case 3: return "سنگر مستحکم";
    case 4: return "پایگاه تاکتیکی";
    case 5: return "قلعه بقا";
    default: return `پایگاه سطح ${tier}`;
  }
}

function canPayUpgrade(u, cost) {
  const r = u.resources;
  return u.gold >= cost.gold &&
    r.wood >= cost.wood &&
    r.stone >= cost.stone &&
    r.iron >= cost.iron &&
    r.steel >= cost.steel &&
    r.goldOre >= cost.goldOre &&
    r.copper >= cost.copper &&
    r.cloth >= cost.cloth &&
    r.medicine >= cost.medicine &&
    r.electronics >= cost.electronics &&
    r.gunpowder >= cost.gunpowder;
}

function payUpgrade(u, cost) {
  const r = u.resources;
  u.gold -= cost.gold;
  r.wood -= cost.wood;
  r.stone -= cost.stone;
  r.iron -= cost.iron;
  r.steel -= cost.steel;
  r.goldOre -= cost.goldOre;
  r.copper -= cost.copper;
  r.cloth -= cost.cloth;
  r.medicine -= cost.medicine;
  r.electronics -= cost.electronics;
  r.gunpowder -= cost.gunpowder;
}

app.get("/", (req, res) => res.send("Bot is running"));

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || "";

    if (text === "/start") {
      const u = ensureUser(userId, msg.from);
      await tg("sendMessage", {
        chat_id: chatId,
        text: getHeader(u) + "📡 مرکز فرماندهی فعال شد",
        reply_markup: menus.main()
      });
      return;
    }

    if (text === "/status") {
      const u = ensureUser(userId, msg.from);
      await tg("sendMessage", {
        chat_id: chatId,
        text: getHeader(u) + "📋 گزارش وضعیت"
      });
      return;
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: "📛 دستور نامعتبر"
    });
  }

  if (update.callback_query) {
    const q = update.callback_query;
    const chatId = q.message.chat.id;
    const messageId = q.message.message_id;
    const userId = q.from.id;
    const u = ensureUser(userId, q.from);

    const edit = async (text, reply_markup) => {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup
      });
    };

    if (q.data === "locked") {
      await tg("answerCallbackQuery", {
        callback_query_id: q.id,
        text: "🔒 این عملیات هنوز برای تو باز نشده",
        show_alert: true
      });
      return;
    }

    await tg("answerCallbackQuery", { callback_query_id: q.id });

    switch (q.data) {
      case "back_main":
        await edit(getHeader(u) + "📡 مرکز فرماندهی", menus.main());
        break;

      case "menu_missions":
        await edit(getHeader(u) + "🎖 فهرست ماموریت‌های بقا", missionsKeyboard(u));
        break;

      case "mission_report":
        await edit(getHeader(u) + "📊 هرچه سطح بالاتر بره عملیات سنگین‌تر و غنیمت بیشتر میشه", missionsKeyboard(u));
        break;

      case "menu_workshop":
        await edit(getHeader(u) + "🛠 کارگاه ساخت و ارتقا", workshopKeyboard());
        break;

      case "show_resources":
        await edit(getHeader(u) + "📦 این کل دارایی عملیاتی توئه", workshopKeyboard());
        break;

      case "upgrade_shelter": {
        const nextTier = u.shelter.tier + 1;
        const cost = shelterUpgradeCost(nextTier);

        if (!cost) {
          await edit(getHeader(u) + "🏚 سنگر به آخرین سطح فعلی رسیده", workshopKeyboard());
          break;
        }

        if (!canPayUpgrade(u, cost)) {
          await edit(
            getHeader(u) +
            `❌ منابع کافی نیست
💰 پول:${cost.gold}
🪵 چوب:${cost.wood}
🪨 سنگ:${cost.stone}
⛓ آهن:${cost.iron}
🧱 فولاد:${cost.steel}
🟡 سنگ طلا:${cost.goldOre}
🟠 مس:${cost.copper}
🧵 پارچه:${cost.cloth}
💊 دارو:${cost.medicine}
📟 قطعات:${cost.electronics}
💥 باروت:${cost.gunpowder}`,
            workshopKeyboard()
          );
          break;
        }

        payUpgrade(u, cost);
        u.shelter.tier = nextTier;
        u.shelter.name = shelterNameByTier(nextTier);

        await edit(getHeader(u) + `✅ ارتقا انجام شد\nسنگر جدید: ${u.shelter.name}`, workshopKeyboard());
        break;
      }

      case "menu_shelter":
        await edit(getHeader(u) + "🏚 اینجا تنها دارایی تو در آخرالزمانه", menus.backMain());
        break;

      case "menu_blackmarket":
        await edit(getHeader(u) + "🛒 بازار سیاه فعال شد", menus.backMain());
        break;

      case "menu_armory":
        await edit(getHeader(u) + "🔫 زرادخانه در انتظار تجهیز", menus.backMain());
        break;

      case "menu_recovery":
        await edit(getHeader(u) + "🕌 سنگر بازیابی\nعملیات معنوی را انتخاب کن", recoveryKeyboard());
        break;

      case "recovery_pray":
      case "recovery_quran":
      case "recovery_mosque":
      case "recovery_namaz": {
        let actionText = "";

        if (q.data === "recovery_pray") {
          u.recovery.prayCount += 1;
          actionText = "🤲 دعا انجام شد";
        }
        if (q.data === "recovery_quran") {
          u.recovery.quranCount += 1;
          actionText = "📖 قرآن خوانده شد";
        }
        if (q.data === "recovery_mosque") {
          u.recovery.mosqueCount += 1;
          actionText = "🕌 حضور در مسجد ثبت شد";
        }
        if (q.data === "recovery_namaz") {
          u.recovery.namazCount += 1;
          actionText = "🧎 نماز اقامه شد";
        }

        u.recovery.totalActs += 1;
        u.hp = clamp(u.hp + 10, 0, 100);

        const currentTitle = getRecoveryTitle(u.recovery.totalActs);

        await edit(
          getHeader(u) +
          `${actionText}
❤️ بازیابی جان: +10
📿 مجموع اعمال معنوی: ${u.recovery.totalActs}
${currentTitle ? `🏷 لقب فعال: ${currentTitle}` : "🏷 هنوز لقبی ثبت نشده"}`,
          recoveryKeyboard()
        );
        break;
      }

      case "recovery_report":
        await edit(
          getHeader(u) +
          `📿 گزارش معنوی
🤲 دعا: ${u.recovery.prayCount}
📖 قرآن: ${u.recovery.quranCount}
🕌 مسجد: ${u.recovery.mosqueCount}
🧎 نماز: ${u.recovery.namazCount}
✅ مجموع: ${u.recovery.totalActs}
🏷 لقب: ${getRecoveryTitle(u.recovery.totalActs) || "ندارد"}`,
          recoveryKeyboard()
        );
        break;

      default:
        if (q.data.startsWith("mission_")) {
          const id = q.data.split("_")[1];
          const def = MISSION_DEFS[id];
          if (!def) return;

          if (u.hp <= 0) {
            await edit(getHeader(u) + "☠️ تو توان عملیات نداری", menus.backMain());
            return;
          }

          const hpLoss = randInt(def.hpLoss[0], def.hpLoss[1]);
          const moneyReward = randInt(def.moneyReward[0], def.moneyReward[1]);
          const gainedXp = randInt(def.xp[0], def.xp[1]);

          u.hp = clamp(u.hp - hpLoss, 0, 100);
          u.gold += moneyReward;

          const loot = rollLoot(u, def);
          const leveled = applyXpAndLevelUp(u, gainedXp);

          let text = getHeader(u) +
            `🎯 ماموریت: ${def.title}
💥 آسیب: ${hpLoss}
💰 پاداش: ${moneyReward}$
📌 XP: ${gainedXp}

📦 غنیمت:
${formatLoot(loot)}
`;

          if (leveled) {
            text += `\n⬆️ ارتقا انجام شد`;
          }

          if (u.hp === 0) {
            text += `\n☠️ هشدار: جان تو به صفر رسیده`;
          }

          await edit(text, missionsKeyboard(u));
        }
        break;
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
