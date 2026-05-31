const { Telegraf } = require('telegraf');
const axios = require('axios'); // برای درخواست‌های HTTP احتمالی در آینده یا ارتباط با سرویس‌های دیگر

// --- تعریف ثابت‌ها ---
const RECOVERY_PRAYER_COUNT = 50; // تعداد دفعات دعا برای رسیدن به "حاج آقا"
const RECOVERY_QURAN_COUNT = 50; // تعداد دفعات قرآن‌خوانی
const RECOVERY_MOSQUE_COUNT = 25; // تعداد دفعات رفتن به مسجد
const RECOVERY_PRAYER_UNLOCK = 10; // تعداد دفعات دعا برای باز شدن قفل مسجد
const RECOVERY_QURAN_UNLOCK = 10; // تعداد دفعات قرآن‌خوانی برای باز شدن قفل مسجد

const MAX_SHELTER_LEVEL = 5;
const MISSIONS_PER_PAGE = 6; // تعداد ماموریت‌ها در هر صفحه کیبورد

// --- داده‌های ماموریت‌ها ---
// ساختار: missionId: { title, hpLoss: [min, max], moneyReward: [min, max], xp: [min, max], loot: [{ key, min, max, chance }] }
const MISSION_DEFS = {
  1: { title: "جمع آوری چوب", hpLoss: [1, 3], moneyReward: [5, 15], xp: [5, 10], loot: [
    { key: "wood", min: 5, max: 15, chance: 0.9 },
    { key: "stone", min: 1, max: 5, chance: 0.4 }
  ]},
  2: { title: "استخراج سنگ", hpLoss: [2, 5], moneyReward: [10, 25], xp: [8, 15], loot: [
    { key: "stone", min: 8, max: 20, chance: 0.85 },
    { key: "ironOre", min: 2, max: 7, chance: 0.3 }
  ]},
  3: { title: "جستجوی آهن", hpLoss: [3, 7], moneyReward: [15, 40], xp: [12, 20], loot: [
    { key: "ironOre", min: 5, max: 15, chance: 0.7 },
    { key: "stone", min: 5, max: 10, chance: 0.5 },
    { key: "goldOre", min: 1, max: 3, chance: 0.1 }
  ]},
  4: { title: "ذوب آهن", hpLoss: [4, 8], moneyReward: [20, 50], xp: [15, 25], loot: [
    { key: "iron", min: 3, max: 10, chance: 0.9 },
    { key: "stone", min: 3, max: 8, chance: 0.6 }
  ]},
  5: { title: "کار با طلا", hpLoss: [5, 10], moneyReward: [30, 70], xp: [20, 35], loot: [
    { key: "goldOre", min: 4, max: 12, chance: 0.6 },
    { key: "iron", min: 2, max: 7, chance: 0.5 },
    { key: "gold", min: 1, max: 4, chance: 0.4 }
  ]},
  6: { title: "ساخت و ساز ساده", hpLoss: [6, 12], moneyReward: [25, 60], xp: [25, 40], loot: [
    { key: "wood", min: 10, max: 25, chance: 0.7 },
    { key: "stone", min: 10, max: 20, chance: 0.7 },
    { key: "iron", min: 2, max: 6, chance: 0.6 }
  ]},
  7: { title: "تولید پارچه", hpLoss: [7, 13], moneyReward: [35, 80], xp: [30, 45], loot: [
    { key: "fabric", min: 5, max: 18, chance: 0.8 },
    { key: "wood", min: 5, max: 12, chance: 0.5 }
  ]},
  8: { title: "ساخت دارو", hpLoss: [8, 15], moneyReward: [40, 100], xp: [35, 55], loot: [
    { key: "medicine", min: 3, max: 10, chance: 0.7 },
    { key: "fabric", min: 3, max: 9, chance: 0.6 },
    { key: "goldOre", min: 1, max: 3, chance: 0.2 }
  ]},
  9: { title: "مونتاژ قطعات", hpLoss: [9, 17], moneyReward: [50, 120], xp: [40, 65], loot: [
    { key: "electronics", min: 2, max: 7, chance: 0.7 },
    { key: "iron", min: 4, max: 10, chance: 0.6 },
    { key: "fabric", min: 4, max: 8, chance: 0.5 }
  ]},
  10: { title: "ساخت باروت", hpLoss: [10, 18], moneyReward: [55, 130], xp: [45, 70], loot: [
    { key: "gunpowder", min: 3, max: 9, chance: 0.7 },
    { key: "stone", min: 5, max: 15, chance: 0.5 },
    { key: "coal", min: 5, max: 15, chance: 0.5 } // فرض می‌کنیم coal هم داریم
  ]},
  11: { title: "معدن طلای پیشرفته", hpLoss: [12, 22], moneyReward: [70, 160], xp: [55, 80], loot: [
    { key: "goldOre", min: 8, max: 20, chance: 0.8 },
    { key: "iron", min: 5, max: 12, chance: 0.6 },
    { key: "steel", min: 3, max: 8, chance: 0.5 }
  ]},
  12: { title: "عملیات ویژه", hpLoss: [15, 25], moneyReward: [90, 200], xp: [70, 100], loot: [
    { key: "electronics", min: 4, max: 10, chance: 0.7 },
    { key: "gunpowder", min: 5, max: 12, chance: 0.7 },
    { key: "medicine", min: 3, max: 8, chance: 0.6 },
    { key: "steel", min: 4, max: 10, chance: 0.7 }
  ]},
  // ماموریت‌های سطح بالاتر که نیاز به باز شدن دارند
  13: { title: "ساخت سلاح", hpLoss: [18, 30], moneyReward: [100, 220], xp: [80, 120], loot: [
    { key: "steel", min: 10, max: 20, chance: 0.8 },
    { key: "electronics", min: 5, max: 10, chance: 0.7 },
    { key: "gunpowder", min: 8, max: 15, chance: 0.7 }
  ]},
  14: { title: "تحقیق و توسعه", hpLoss: [20, 35], moneyReward: [120, 250], xp: [90, 140], loot: [
    { key: "electronics", min: 6, max: 12, chance: 0.8 },
    { key: "medicine", min: 4, max: 10, chance: 0.7 },
    { key: "gold", min: 2, max: 5, chance: 0.5 }
  ]},
  15: { title: "عملیات صنعتی", hpLoss: [22, 40], moneyReward: [150, 300], xp: [100, 160], loot: [
    { key: "steel", min: 15, max: 25, chance: 0.8 },
    { key: "iron", min: 10, max: 20, chance: 0.7 },
    { key: "goldOre", min: 5, max: 15, chance: 0.6 }
  ]},
};

// --- مدیریت وضعیت کاربران ---
// Map<userId, { hp, gold, level, xp, resources: {wood, stone, ...}, recovery: {prayer, quran, mosque, lastVisit}, lastMissionTimestamp }>
const userStates = new Map();

// --- توابع کمکی ---

// تابع برای دریافت وضعیت کاربر یا ایجاد وضعیت جدید
function getUserState(userId) {
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      hp: 100,
      gold: 50,
      level: 1,
      xp: 0,
      resources: { wood: 0, stone: 0, ironOre: 0, goldOre: 0, fabric: 0, medicine: 0, electronics: 0, gunpowder: 0, iron: 0, steel: 0, gold: 0, coal: 0 },
      recovery: { prayer: 0, quran: 0, mosque: 0, lastVisit: null },
      lastMissionTimestamp: 0
    });
  }
  return userStates.get(userId);
}

// تابع برای محاسبه مقدار تصادفی
function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// تابع برای به‌روزرسانی منابع
function updateResources(resources, itemKey, amount) {
  resources[itemKey] = (resources[itemKey] || 0) + amount;
  if (resources[itemKey] < 0) resources[itemKey] = 0; // اطمینان از عدم منفی شدن منابع
}

// تابع برای نمایش وضعیت کاربر
function getUserStatusMessage(state) {
  let resourcesList = Object.entries(state.resources)
    .filter(([key, value]) => value > 0)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  if (!resourcesList) resourcesList = "هیچ منبعی ندارید.";

  let recoveryTitles = getRecoveryTitles(state.recovery);

  return `
🌟 وضعیت شما 🌟
❤️ سلامتی: ${state.hp}/100
💰 طلا: ${state.gold}
📈 سطح: ${state.level} (XP: ${state.xp})
📦 منابع:
${resourcesList}
✨ وضعیت معنوی: ${recoveryTitles}
  `;
}

// تابع برای دریافت عنوان معنوی بر اساس شمارنده‌ها
function getRecoveryTitles(recoveryState) {
  if (recoveryState.prayer >= RECOVERY_PRAYER_COUNT && recoveryState.quran >= RECOVERY_QURAN_COUNT && recoveryState.mosque >= RECOVERY_MOSQUE_COUNT) {
    return "حاج آقا";
  } else if (recoveryState.prayer >= RECOVERY_PRAYER_COUNT / 2 && recoveryState.quran >= RECOVERY_QURAN_COUNT / 2) {
    return "پایبند";
  } else if (recoveryState.prayer >= RECOVERY_PRAYER_UNLOCK) {
    return "علاقه‌مند";
  } else {
    return "تازه‌کار";
  }
}

// تابع برای تولید کیبوردهای ماموریت
function getMissionKeyboard(userId, currentState) {
  const state = getUserState(userId);
  const missions = [];
  let availableMissions = 0;

  for (let i = 1; i <= Object.keys(MISSION_DEFS).length; i++) {
    const missionDef = MISSION_DEFS[i];
    const requiredLevel = Math.ceil(i / 2) + (i > 2 ? Math.floor((i-1)/2) : 0) ; // منطق پیچیده‌تر برای سطح مورد نیاز

    let buttonText;
    let callbackData;

    if (state.level >= requiredLevel) {
      buttonText = `${i}️⃣ ${missionDef.title}`;
      callbackData = `mission_${i}`;
      availableMissions++;
    } else {
      buttonText = `🔒 ماموریت ${i} | سطح ${requiredLevel}`;
      callbackData = "locked";
    }
    missions.push({ text: buttonText, callback_data: callbackData });
    if (missions.length % 2 === 0) { // دو ماموریت در هر ردیف
      // missions.push({ text: "\u200b", callback_data: "\u200b" }); // Space for layout if needed, usually not
    }
  }

  // تقسیم ماموریت‌ها به صفحات
  const totalMissions = Object.keys(MISSION_DEFS).length;
  const totalPages = Math.ceil(totalMissions / MISSIONS_PER_PAGE);
  const currentPage = Math.floor((currentState.missionPage || 0) / MISSIONS_PER_PAGE); // Use missionPage from state

  const pageButtons = [];
  const startMissionIndex = currentPage * MISSIONS_PER_PAGE;
  const endMissionIndex = Math.min(startMissionIndex + MISSIONS_PER_PAGE, totalMissions);

  const missionsOnPage = [];
  for(let i = startMissionIndex; i < endMissionIndex; i++) {
      const missionId = i + 1;
      const missionDef = MISSION_DEFS[missionId];
      const requiredLevel = Math.ceil(missionId / 2) + (missionId > 2 ? Math.floor((missionId-1)/2) : 0);

      let buttonText;
      let callbackData;

      if (state.level >= requiredLevel) {
          buttonText = `${missionId}️⃣ ${missionDef.title}`;
          callbackData = `mission_${missionId}`;
      } else {
          buttonText = `🔒 ماموریت ${missionId} | سطح ${requiredLevel}`;
          callbackData = "locked";
      }
      missionsOnPage.push({ text: buttonText, callback_data: callbackData });
  }

  // اضافه کردن دکمه‌های ناوبری صفحه
  if (currentPage > 0) {
    pageButtons.push({ text: "⬅️ قبلی", callback_data: `prev_mission_page` });
  }
  if (currentPage < totalPages - 1) {
    pageButtons.push({ text: "بعدی ➡️", callback_data: `next_mission_page` });
  }

  // ترکیب ماموریت‌های صفحه با دکمه‌های ناوبری
  const keyboardRows = [];
  for (let i = 0; i < missionsOnPage.length; i += 2) {
      if (missionsOnPage[i+1]) {
          keyboardRows.push([missionsOnPage[i], missionsOnPage[i+1]]);
      } else {
          keyboardRows.push([missionsOnPage[i]]);
      }
  }
  if (pageButtons.length > 0) {
      keyboardRows.push(pageButtons);
  }


  return { inline_keyboard: keyboardRows };
}


// تابع برای تولید کیبورد اصلی
function getMainKeyboard(userId) {
  const state = getUserState(userId);
  const recoveryTitles = getRecoveryTitles(state.recovery);

  const buttons = [
    [{ text: "📋 مأموریت‌ها", callback_data: "missions_page_0" }], // Start with page 0
    [{ text: "💪 ارتقاء پناهگاه", callback_data: "upgrade_shelter" }],
    [{ text: "✨ بخش معنوی", callback_data: "recovery_menu" }],
    [{ text: "🌟 وضعیت", callback_data: "status" }]
  ];

  return { inline_keyboard: buttons };
}

// --- ربات تلگرام ---
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- هندلر دستورات ---

bot.start((ctx) => {
  const userId = ctx.from.id;
  getUserState(userId); // Initialize user state if not exists
  ctx.replyWithMarkdownV2(`به بازی بقا خوش آمدی، ${ctx.from.first_name}!\n\n*ماموریت شما شروع شده است\\.*\n\nاز دستورات زیر استفاده کن:`, getMainKeyboard(userId));
});

bot.command('help', (ctx) => {
  ctx.reply(`
دستورات موجود:
/start - شروع بازی
/status - نمایش وضعیت فعلی
/missions - لیست مأموریت‌ها
/upgrade - ارتقاء پناهگاه
/recovery - منوی بخش معنوی
/help - نمایش این پیام راهنما
  `);
});

// --- هندلر دکمه‌های کیبورد ---

bot.on('callback_query', async (ctx) => {
  const userId = ctx.callbackQuery.from.id;
  const state = getUserState(userId);
  const data = ctx.callbackQuery.data;

  // جلوگیری از انجام چندباره یک عملیات در فاصله زمانی کوتاه
  const now = Date.now();
  if (state.lastMissionTimestamp && (now - state.lastMissionTimestamp < 5000)) { // 5 ثانیه
      return ctx.answerCbQuery("لطفا کمی صبر کن، هنوز در حال پردازش عملیات قبلی هستم.", true);
  }


  if (data === 'status') {
    await ctx.editMessageText(getUserStatusMessage(state), { parse_mode: 'MarkdownV2' });
    await ctx.answerCbQuery();
  } else if (data.startsWith('mission_')) {
    const missionId = parseInt(data.split('_')[1]);
    const missionDef = MISSION_DEFS[missionId];

    if (!missionDef) {
      return ctx.answerCbQuery("ماموریت نامعتبر است.", true);
    }

    const requiredLevel = Math.ceil(missionId / 2) + (missionId > 2 ? Math.floor((missionId-1)/2) : 0); // سطح مورد نیاز برای ماموریت

    if (state.level < requiredLevel) {
        return ctx.answerCbQuery(`هنوز برای این ماموریت آماده نیستی. نیاز به سطح ${requiredLevel} داری.`, true);
    }

    // چک کردن Cooldown ماموریت
    const cooldownTime = 5000; // 5 ثانیه
    if (state.lastMissionTimestamp && (now - state.lastMissionTimestamp < cooldownTime)) {
        return ctx.answerCbQuery(`لطفا ${Math.ceil((cooldownTime - (now - state.lastMissionTimestamp)) / 1000)} ثانیه دیگر صبر کن.`, true);
    }


    // اجرای منطق ماموریت
    const hpLoss = getRandomValue(missionDef.hpLoss[0], missionDef.hpLoss[1]);
    let moneyReward = getRandomValue(missionDef.moneyReward[0], missionDef.moneyReward[1]);
    let xpReward = getRandomValue(missionDef.xp[0], missionDef.xp[1]);

    // محاسبه منابع غنیمت
    let gainedLoot = [];
    for (const loot of missionDef.loot) {
      if (Math.random() < loot.chance) {
        const amount = getRandomValue(loot.min, loot.max);
        updateResources(state.resources, loot.key, amount);
        gainedLoot.push(`${amount} ${loot.key}`);
      }
    }

    // اعمال کاهش سلامتی و افزایش طلا و XP
    state.hp -= hpLoss;
    if (state.hp < 0) state.hp = 0;
    state.gold += moneyReward;
    state.xp += xpReward;

    // محاسبه سطح جدید
    let nextLevelXp = state.level * 100; // XP مورد نیاز برای سطح بعدی
    while (state.xp >= nextLevelXp) {
      state.xp -= nextLevelXp;
      state.level++;
      nextLevelXp = state.level * 100;
      // اعمال پاداش سطح (مثلا افزایش حداکثر سلامتی یا منابع)
      state.hp = Math.min(100, state.hp + 20); // افزایش سلامتی با هر سطح
      moneyReward = Math.round(moneyReward * 1.1); // افزایش پاداش طلا با هر سطح
      xpReward = Math.round(xpReward * 1.1); // افزایش پاداش XP با هر سطح
      ctx.reply(`تبریک! به سطح ${state.level} رسیدی! 🎉`);
    }

    state.lastMissionTimestamp = now; // ثبت زمان اتمام ماموریت

    let message = `شما مأموریت "${missionDef.title}" را با موفقیت انجام دادید!\n\n`;
    message += `➖ سلامتی شما: ${hpLoss} ❤️\n`;
    message += `💰 پاداش طلا: ${moneyReward} 💰\n`;
    message += `✨ پاداش تجربه: ${xpReward} XP\n`;
    if (gainedLoot.length > 0) {
      message += `📦 منابع بدست آمده: ${gainedLoot.join(', ')}\n`;
    }

    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2' });
    // نمایش کیبورد اصلی پس از اتمام ماموریت
    setTimeout(() => {
        ctx.telegram.sendCopy(userId, { text: "عملیات بعدی؟" }, getMainKeyboard(userId));
    }, 2000); // 2 ثانیه تاخیر برای خوانایی پیام

  } else if (data === 'upgrade_shelter') {
    const currentLevel = state.level;
    const shelterLevel = state.shelterLevel || 1; // فرض می‌کنیم shelterLevel در state ذخیره می‌شود

    if (shelterLevel >= MAX_SHELTER_LEVEL) {
        return ctx.answerCbQuery("پناهگاه شما به بالاترین سطح ارتقا یافته است.", true);
    }

    // محاسبه هزینه ارتقا (مثال)
    const costGold = shelterLevel * 50;
    const costWood = shelterLevel * 10;
    const costStone = shelterLevel * 15;
    const costIron = shelterLevel * 5;

    let canUpgrade = true;
    let costMessage = `هزینه ارتقاء به سطح ${shelterLevel + 1}:\n`;
    if (state.gold < costGold) { costMessage += `💰 ${costGold} طلا (کافی نیست!)\n`; canUpgrade = false; } else { costMessage += `💰 ${costGold} طلا\n`; }
    if (state.resources.wood < costWood) { costMessage += `🪵 ${costWood} چوب (کافی نیست!)\n`; canUpgrade = false; } else { costMessage += `🪵 ${costWood} چوب\n`; }
    if (state.resources.stone < costStone) { costMessage += `🪨 ${costStone} سنگ (کافی نیست!)\n`; canUpgrade = false; } else { costMessage += `🪨 ${costStone} سنگ\n`; }
    if (state.resources.iron < costIron) { costMessage += `⛓️ ${costIron} آهن (کافی نیست!)\n`; canUpgrade = false; } else { costMessage += `⛓️ ${costIron} آهن\n`; }

    if (canUpgrade) {
      state.shelterLevel = shelterLevel + 1;
      state.gold -= costGold;
      updateResources(state.resources, "wood", -costWood);
      updateResources(state.resources, "stone", -costStone);
      updateResources(state.resources, "iron", -costIron);
      await ctx.editMessageText(`پناهگاه شما با موفقیت به سطح ${state.shelterLevel} ارتقا یافت!`, { parse_mode: 'MarkdownV2' });
      await ctx.answerCbQuery("ارتقاء موفقیت آمیز بود!");
      // نمایش کیبورد اصلی پس از ارتقا
      setTimeout(() => {
            ctx.telegram.sendCopy(userId, { text: "عملیات بعدی؟" }, getMainKeyboard(userId));
        }, 1500);
    } else {
      await ctx.answerCbQuery(costMessage, true);
      await ctx.editMessageText(`ارتقاء پناهگاه:\nسطح فعلی: ${shelterLevel}/${MAX_SHELTER_LEVEL}\n\n${costMessage}\nبرای ارتقاء به منابع کافی نیاز داری.`, { parse_mode: 'MarkdownV2' });
    }

  } else if (data === 'recovery_menu') {
    const recoveryTitles = getRecoveryTitles(state.recovery);
    const message = `
✨ بخش معنوی (سنگر بازیابی) ✨
وضعیت فعلی شما: *${recoveryTitles}*

فعالیت‌های معنوی به شما کمک می‌کنند تا وضعیت بهتری داشته باشید و القاب جدید کسب کنید.

*دعای روزانه:* ${state.recovery.prayer}/${RECOVERY_PRAYER_COUNT} (برای رسیدن به "حاج آقا")
*قرآن‌خوانی:* ${state.recovery.quran}/${RECOVERY_QURAN_COUNT} (برای رسیدن به "حاج آقا")
*حضور در مسجد:* ${state.recovery.mosque}/${RECOVERY_MOSQUE_COUNT} (نیاز به ${RECOVERY_PRAYER_UNLOCK} دعا و ${RECOVERY_QURAN_UNLOCK} قرآن‌خوانی برای باز شدن)

*فعالیت‌های قابل انجام:*
  - دعا کردن 🙏
  - خواندن قرآن 📖
  - رفتن به مسجد 🕌 (وقتی باز شود)
    `;
    const keyboard = {
      inline_keyboard: [
        [{ text: "🙏 دعا", callback_data: "do_prayer" }],
        [{ text: "📖 قرآن", callback_data: "do_quran" }],
        [{ text: "🕌 مسجد", callback_data: state.recovery.prayer >= RECOVERY_PRAYER_UNLOCK && state.recovery.quran >= RECOVERY_QURAN_UNLOCK ? "go_mosque" : "locked_mosque" }],
        [{ text: "بازگشت", callback_data: "main_menu" }]
      ]
    };
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2', ...keyboard });
    await ctx.answerCbQuery();

  } else if (data === 'do_prayer') {
    state.recovery.prayer++;
    state.gold = Math.min(1000, state.gold + 5); // پاداش کوچک برای دعا
    state.hp = Math.min(100, state.hp + 2); // افزایش جزئی سلامتی
    const newTitles = getRecoveryTitles(state.recovery);
    await ctx.answerCbQuery(`دعا کردی. ${newTitles}!\n+5 طلا, +2 سلامتی`);
    // به‌روزرسانی پیام بخش معنوی
    const recoveryTitles = getRecoveryTitles(state.recovery);
     const message = `
✨ بخش معنوی (سنگر بازیابی) ✨
وضعیت فعلی شما: *${recoveryTitles}*

فعالیت‌های معنوی به شما کمک می‌کنند تا وضعیت بهتری داشته باشید و القاب جدید کسب کنید.

*دعای روزانه:* ${state.recovery.prayer}/${RECOVERY_PRAYER_COUNT} (برای رسیدن به "حاج آقا")
*قرآن‌خوانی:* ${state.recovery.quran}/${RECOVERY_QURAN_COUNT} (برای رسیدن به "حاج آقا")
*حضور در مسجد:* ${state.recovery.mosque}/${RECOVERY_MOSQUE_COUNT} (نیاز به ${RECOVERY_PRAYER_UNLOCK} دعا و ${RECOVERY_QURAN_UNLOCK} قرآن‌خوانی برای باز شدن)

*فعالیت‌های قابل انجام:*
  - دعا کردن 🙏
  - خواندن قرآن 📖
  - رفتن به مسجد 🕌 (وقتی باز شود)
    `;
    const keyboard = {
      inline_keyboard: [
        [{ text: "🙏 دعا", callback_data: "do_prayer" }],
        [{ text: "📖 قرآن", callback_data: "do_quran" }],
        [{ text: "🕌 مسجد", callback_data: state.recovery.prayer >= RECOVERY_PRAYER_UNLOCK && state.recovery.quran >= RECOVERY_QURAN_UNLOCK ? "go_mosque" : "locked_mosque" }],
        [{ text: "بازگشت", callback_data: "main_menu" }]
      ]
    };
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2', ...keyboard });

  } else if (data === 'do_quran') {
    state.recovery.quran++;
    state.gold = Math.min(1000, state.gold + 7); // پاداش کمی بیشتر برای قرآن
    state.hp = Math.min(100, state.hp + 3); // افزایش جزئی سلامتی
    const newTitles = getRecoveryTitles(state.recovery);
    await ctx.answerCbQuery(`قرآن خواندی. ${newTitles}!\n+7 طلا, +3 سلامتی`);
     // به‌روزرسانی پیام بخش معنوی
    const recoveryTitles = getRecoveryTitles(state.recovery);
     const message = `
✨ بخش معنوی (سنگر بازیابی) ✨
وضعیت فعلی شما: *${recoveryTitles}*

فعالیت‌های معنوی به شما کمک می‌کنند تا وضعیت بهتری داشته باشید و القاب جدید کسب کنید.

*دعای روزانه:* ${state.recovery.prayer}/${RECOVERY_PRAYER_COUNT} (برای رسیدن به "حاج آقا")
*قرآن‌خوانی:* ${state.recovery.quran}/${RECOVERY_QURAN_COUNT} (برای رسیدن به "حاج آقا")
*حضور در مسجد:* ${state.recovery.mosque}/${RECOVERY_MOSQUE_COUNT} (نیاز به ${RECOVERY_PRAYER_UNLOCK} دعا و ${RECOVERY_QURAN_UNLOCK} قرآن‌خوانی برای باز شدن)

*فعالیت‌های قابل انجام:*
  - دعا کردن 🙏
  - خواندن قرآن 📖
  - رفتن به مسجد 🕌 (وقتی باز شود)
    `;
    const keyboard = {
      inline_keyboard: [
        [{ text: "🙏 دعا", callback_data: "do_prayer" }],
        [{ text: "📖 قرآن", callback_data: "do_quran" }],
        [{ text: "🕌 مسجد", callback_data: state.recovery.prayer >= RECOVERY_PRAYER_UNLOCK && state.recovery.quran >= RECOVERY_QURAN_UNLOCK ? "go_mosque" : "locked_mosque" }],
        [{ text: "بازگشت", callback_data: "main_menu" }]
      ]
    };
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2', ...keyboard });

  } else if (data === 'locked_mosque') {
      await ctx.answerCbQuery("هنوز قفل مسجد باز نشده است. دعا کن و قرآن بخوان!", true);
  }
   else if (data === 'go_mosque') {
    state.recovery.mosque++;
    state.gold = Math.min(1000, state.gold + 15); // پاداش خوب برای مسجد
    state.hp = Math.min(100, state.hp + 5); // افزایش سلامتی
    state.xp = state.xp + 10; // پاداش XP
    const newTitles = getRecoveryTitles(state.recovery);
    await ctx.answerCbQuery(`به مسجد رفتی. ${newTitles}!\n+15 طلا, +5 سلامتی, +10 XP`);

     // به‌روزرسانی پیام بخش معنوی
    const recoveryTitles = getRecoveryTitles(state.recovery);
     const message = `
✨ بخش معنوی (سنگر بازیابی) ✨
وضعیت فعلی شما: *${recoveryTitles}*

فعالیت‌های معنوی به شما کمک می‌کنند تا وضعیت بهتری داشته باشید و القاب جدید کسب کنید.

*دعای روزانه:* ${state.recovery.prayer}/${RECOVERY_PRAYER_COUNT} (برای رسیدن به "حاج آقا")
*قرآن‌خوانی:* ${state.recovery.quran}/${RECOVERY_QURAN_COUNT} (برای رسیدن به "حاج آقا")
*حضور در مسجد:* ${state.recovery.mosque}/${RECOVERY_MOSQUE_COUNT} (نیاز به ${RECOVERY_PRAYER_UNLOCK} دعا و ${RECOVERY_QURAN_UNLOCK} قرآن‌خوانی برای باز شدن)

*فعالیت‌های قابل انجام:*
  - دعا کردن 🙏
  - خواندن قرآن 📖
  - رفتن به مسجد 🕌 (وقتی باز شود)
    `;
    const keyboard = {
      inline_keyboard: [
        [{ text: "🙏 دعا", callback_data: "do_prayer" }],
        [{ text: "📖 قرآن", callback_data: "do_quran" }],
        [{ text: "🕌 مسجد", callback_data: state.recovery.prayer >= RECOVERY_PRAYER_UNLOCK && state.recovery.quran >= RECOVERY_QURAN_UNLOCK ? "go_mosque" : "locked_mosque" }],
        [{ text: "بازگشت", callback_data: "main_menu" }]
      ]
    };
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2', ...keyboard });

  } else if (data === 'main_menu') {
    await ctx.editMessageText("به منوی اصلی خوش آمدی!", getMainKeyboard(userId));
    await ctx.answerCbQuery();
  } else if (data.startsWith('missions_page_')) {
      // Extract page number
      const pageNumber = parseInt(data.split('_')[2]);
      // Update the current state's page number
      state.missionPage = pageNumber * MISSIONS_PER_PAGE; // Store the starting index for the page
      await ctx.editMessageText("ماموریت‌ها:", getMissionKeyboard(userId, state));
      await ctx.answerCbQuery();
  } else if (data === 'next_mission_page') {
      const totalMissions = Object.keys(MISSION_DEFS).length;
      const nextPageStart = (Math.floor((state.missionPage || 0) / MISSIONS_PER_PAGE) + 1) * MISSIONS_PER_PAGE;
      if (nextPageStart < totalMissions) {
          state.missionPage = nextPageStart;
          await ctx.editMessageText("ماموریت‌ها:", getMissionKeyboard(userId, state));
      }
      await ctx.answerCbQuery();
  } else if (data === 'prev_mission_page') {
      const prevPageStart = Math.max(0, (Math.floor((state.missionPage || 0) / MISSIONS_PER_PAGE) - 1) * MISSIONS_PER_PAGE);
      state.missionPage = prevPageStart;
      await ctx.editMessageText("ماموریت‌ها:", getMissionKeyboard(userId, state));
      await ctx.answerCbQuery();
  }

   else if (data === 'locked') {
    await ctx.answerCbQuery("این ماموریت هنوز قفل است. باید سطح خود را بالا ببرید.", true);
  }

  // اگر دکمه‌ای بود که هندلر نداشت
  else {
    await ctx.answerCbQuery(); // فقط تیک سبز را نشان می‌دهد
  }
});

// --- هندلر دستورات متنی ---
bot.hears(/^(.*)$/, (ctx) => {
    const userId = ctx.from.id;
    const state = getUserState(userId);
    const messageText = ctx.message.text.toLowerCase();

    // پردازش دستورات متنی مانند "ساخت چوب" یا "فروش سنگ"
    // این بخش نیاز به منطق بیشتری دارد تا بتواند دستورات مختلف را تشخیص دهد
    // مثال:
    if (messageText.includes("وضعیت")) {
        ctx.replyWithMarkdownV2(getUserStatusMessage(state));
    } else if (messageText.includes("ماموریت")) {
         ctx.replyWithMarkdownV2("برای دیدن لیست ماموریت‌ها از دکمه '📋 مأموریت‌ها' استفاده کن.", getMainKeyboard(userId));
    }
    // ... سایر دستورات متنی
    else {
        ctx.reply("دستور نامفهوم است. از دکمه‌های موجود استفاده کن یا /help را بزن.", getMainKeyboard(userId));
    }
});


// --- راه‌اندازی ربات ---
// اگر از Railway استفاده می‌کنید، TOKEN را از تنظیمات دریافت کنید
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("خطا: توکن ربات (BOT_TOKEN) در متغیرهای محیطی یافت نشد!");
  process.exit(1);
}

bot.launch().then(() => {
  console.log('ربات با موفقیت راه‌اندازی شد!');
}).catch((err) => {
  console.error('خطا در راه‌اندازی ربات:', err);
});

// --- مدیریت منابع (مثال برای ساخت) ---
// این بخش نیاز به پیاده‌سازی دقیق‌تر دارد، مثلاً دستور "ساخت X"
// const handleCrafting = (userId, itemToCraft, quantity) => {
//     const state = getUserState(userId);
//     let requiredResources = {};
//     let craftSuccess = false;

//     // تعریف منابع مورد نیاز برای هر آیتم
//     switch (itemToCraft) {
//         case 'wood': requiredResources = { wood: 1 }; break; // ساخت چوب از چوب (منطقی نیست، مثال)
//         case 'iron': requiredResources = { ironOre: 2, coal: 1 }; break;
//         case 'steel': requiredResources = { iron: 3, coal: 2 }; break;
//         // ... سایر آیتم‌ها
//     }

//     // چک کردن منابع
//     let canCraft = true;
//     for (const resource in requiredResources) {
//         if (state.resources[resource] < requiredResources[resource] * quantity) {
//             canCraft = false;
//             break;
//         }
//     }

//     if (canCraft) {
//         // کسر منابع
//         for (const resource in requiredResources) {
//             updateResources(state.resources, resource, -requiredResources[resource] * quantity);
//         }
//         // افزودن آیتم ساخته شده
//         updateResources(state.resources, itemToCraft, quantity);
//         craftSuccess = true;
//     }

//     return { success: craftSuccess, message: `Crafted ${quantity} ${itemToCraft}` };
// };
