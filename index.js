// index.js
// شبیه‌ساز زندگی — ربات تلگرام (Polling)
// مهم: توکن را فقط در Railway Variables با نام BOT_TOKEN بگذارید.

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN تنظیم نشده است");

const bot = new TelegramBot(token, { polling: true });

/** ---------------- ذخیره‌سازی موقت (بعداً دیتابیس) ---------------- */
const users = new Map();   // userId -> { profile, stats, createdAt }
const states = new Map();  // userId -> { section, temp }

/** ---------------- داده‌ها ---------------- */
// ۳۱ استان + حداقل ۱۰ شهرستان/شهر برای هرکدام
const IRAN = {
  "آذربایجان شرقی": ["تبریز","مراغه","مرند","میانه","اهر","سراب","بناب","شبستر","جلفا","هریس"],
  "آذربایجان غربی": ["ارومیه","خوی","مهاباد","بوکان","میاندوآب","سلماس","نقده","پیرانشهر","شاهین‌دژ","تکاب"],
  "اردبیل": ["اردبیل","پارس‌آباد","مشگین‌شهر","خلخال","گرمی","بیله‌سوار","نمین","کوثر","نیر","اصلاندوز"],
  "اصفهان": ["اصفهان","کاشان","نجف‌آباد","خمینی‌شهر","شاهین‌شهر","فولادشهر","گلپایگان","سمیرم","فریدن","آران و بیدگل"],
  "البرز": ["کرج","فردیس","نظرآباد","هشتگرد","طالقان","اشتهارد","ماهدشت","محمدشهر","مشکین‌دشت","چهارباغ"],
  "ایلام": ["ایلام","دهلران","آبدانان","ایوان","مهران","دره‌شهر","چرداول","بدره","ملکشاهی","هلیلان"],
  "بوشهر": ["بوشهر","دشتستان","برازجان","گناوه","دشتی","دیر","کنگان","جم","عسلویه","دیلم"],
  "تهران": ["تهران","ری","اسلامشهر","شهریار","ورامین","قدس","ملارد","دماوند","فیروزکوه","پردیس"],
  "چهارمحال و بختیاری": ["شهرکرد","بروجن","فارسان","لردگان","سامان","کیار","اردل","کوهرنگ","بن","فلارد"],
  "خراسان جنوبی": ["بیرجند","قائن","فردوس","طبس","نهبندان","سرایان","بشرویه","درمیان","زیرکوه","خوسف"],
  "خراسان رضوی": ["مشهد","نیشابور","سبزوار","تربت حیدریه","کاشمر","قوچان","چناران","خواف","تایباد","گناباد"],
  "خراسان شمالی": ["بجنورد","شیروان","اسفراین","جاجرم","فاروج","گرمه","مانه","سملقان","راز","جرگلان"],
  "خوزستان": ["اهواز","آبادان","خرمشهر","دزفول","اندیمشک","ماهشهر","شادگان","بهبهان","ایذه","شوشتر"],
  "زنجان": ["زنجان","ابهر","خدابنده","خرمدره","طارم","ماهنشان","ایجرود","سلطانیه","قیدار","زرین‌آباد"],
  "سمنان": ["سمنان","شاهرود","دامغان","گرمسار","مهدی‌شهر","آرادان","میامی","سرخه","ایوانکی","بسطام"],
  "سیستان و بلوچستان": ["زاهدان","چابهار","ایرانشهر","زابل","خاش","سراوان","نیکشهر","کنارک","زهک","هیرمند"],
  "فارس": ["شیراز","مرودشت","کازرون","لار","جهرم","فسا","داراب","فیروزآباد","اقلید","آباده"],
  "قزوین": ["قزوین","تاکستان","آبیک","بوئین‌زهرا","الوند","محمدیه","اقبالیه","آوج","شال","خرمدشت"],
  "قم": ["قم","کهک","جعفریه","دستجرد","قنوات","سلفچگان","پردیسان","نیزار","قمرود","قاهان"],
  "کردستان": ["سنندج","سقز","مریوان","بانه","قروه","بیجار","کامیاران","دیواندره","دهگلان","سروآباد"],
  "کرمان": ["کرمان","رفسنجان","جیرفت","سیرجان","زرند","بم","کهنوج","بردسیر","شهربابک","راور"],
  "کرمانشاه": ["کرمانشاه","اسلام‌آباد غرب","جوانرود","پاوه","سنقر","کنگاور","هرسین","صحنه","گیلانغرب","سرپل ذهاب"],
  "کهگیلویه و بویراحمد": ["یاسوج","گچساران","دهدشت","باشت","چرام","سی‌سخت","لیکک","لنده","مارگون","دنا"],
  "گلستان": ["گرگان","گنبدکاووس","علی‌آباد","آق‌قلا","بندرترکمن","کردکوی","مینودشت","کلاله","آزادشهر","رامیان"],
  "گیلان": ["رشت","انزلی","لاهیجان","لنگرود","آستارا","تالش","رودسر","فومن","صومعه‌سرا","ماسال"],
  "لرستان": ["خرم‌آباد","بروجرد","دورود","الیگودرز","کوهدشت","ازنا","نورآباد","پلدختر","الشتر","چگنی"],
  "مازندران": ["ساری","بابل","آمل","قائم‌شهر","بابلسر","نوشهر","چالوس","تنکابن","بهشهر","جویبار"],
  "مرکزی": ["اراک","ساوه","خمین","محلات","دلیجان","تفرش","شازند","زرندیه","آشتیان","کمیجان"],
  "هرمزگان": ["بندرعباس","قشم","کیش","میناب","بندرلنگه","حاجی‌آباد","رودان","جاسک","پارسیان","بستک"],
  "همدان": ["همدان","ملایر","نهاوند","تویسرکان","کبودرآهنگ","رزن","اسدآباد","بهار","فامنین","لالجین"],
  "یزد": ["یزد","میبد","اردکان","بافق","مهریز","تفت","ابرکوه","اشکذر","خاتم","هرات"]
};

const GENDERS = [
  { id: "male", label: "👨 مرد" },
  { id: "female", label: "👩 زن" }
];

const AGES = [18, 20, 22, 24, 26, 28, 30, 33, 36, 40];

const SKIN_TONES = [
  { id: "very_fair", label: "🤍 خیلی روشن" },
  { id: "fair", label: "🩶 روشن" },
  { id: "wheatish", label: "🟤 گندمی" },
  { id: "tan", label: "🤎 سبزه" },
  { id: "dark", label: "🖤 تیره" }
];

const DIFFICULTIES = [
  { id: "easy", label: "🟢 آسان" },
  { id: "normal", label: "🟡 معمولی" },
  { id: "hard", label: "🟠 سخت" },
  { id: "brutal", label: "🔴 بی‌رحم" }
];

const BACKGROUNDS = [
  { id: "student", label: "🎓 دانش‌آموز/دانشجو" },
  { id: "intern", label: "🧑‍🔧 کارآموز" },
  { id: "unemployed", label: "💼 بیکار" },
  { id: "mid_family", label: "🏠 خانواده متوسط" },
  { id: "poor_family", label: "🏚 خانواده ضعیف" },
  { id: "rich_family", label: "👑 خانواده مرفه" }
];

const HEALTHS = [
  { id: "excellent", label: "💪 عالی" },
  { id: "good", label: "🙂 خوب" },
  { id: "normal", label: "😐 معمولی" },
  { id: "weak", label: "🤒 ضعیف" }
];

/** ---------------- UI ---------------- */
function replyMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["🏠 منوی اصلی", "🪪 پروفایل"],
        ["🧬 ساخت شخصیت", "ℹ️ راهنما"]
      ],
      resize_keyboard: true
    }
  };
}

function inlineMainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🧬 ساخت شخصیت", callback_data: "create:start" }],
        [{ text: "🪪 مشاهده پروفایل", callback_data: "profile:show" }]
      ]
    }
  };
}

function sendMainMenu(chatId) {
  bot.sendMessage(chatId, "🏠 منوی اصلی", replyMenu());
  return bot.sendMessage(chatId, "یکی از گزینه‌های زیر را انتخاب کن:", inlineMainMenu());
}

/** ---------------- Helpers ---------------- */
function pickLabel(list, id) {
  return list.find(x => x.id === id)?.label || id;
}

function buildInitialStats(profile) {
  const base = {
    money: 1500,
    energy: 100,
    health: 100,
    happiness: 100,
    luck: 50
  };

  // اثر سختی
  switch (profile.difficulty) {
    case "easy":
      base.money = 3000; base.health = 110; base.luck = 70;
      break;
    case "normal":
      base.money = 1500; base.health = 100; base.luck = 50;
      break;
    case "hard":
      base.money = 900; base.health = 90; base.luck = 35;
      break;
    case "brutal":
      base.money = 400; base.health = 75; base.luck = 20; base.happiness = 85;
      break;
  }

  // اثر پیش‌زمینه
  switch (profile.background) {
    case "rich_family": base.money += 2000; break;
    case "poor_family": base.money -= 300; base.happiness -= 5; break;
    case "student": base.energy += 5; break;
    case "unemployed": base.happiness -= 8; break;
  }

  // اثر سلامت اولیه
  switch (profile.healthInit) {
    case "excellent": base.health += 10; break;
    case "good": base.health += 5; break;
    case "weak": base.health -= 10; break;
  }

  // محدودسازی
  base.money = Math.max(0, base.money);
  base.energy = Math.min(120, Math.max(0, base.energy));
  base.health = Math.min(120, Math.max(0, base.health));
  base.happiness = Math.min(120, Math.max(0, base.happiness));
  base.luck = Math.min(100, Math.max(0, base.luck));

  return base;
}

function profileText(profile, stats) {
  return [
    "🪪 پروفایل شخصیت",
    "",
    `👤 نام: ${profile.name}`,
    `🧬 جنسیت: ${pickLabel(GENDERS, profile.gender)}`,
    `🎂 سن: ${profile.age}`,
    `🗺 استان: ${profile.province}`,
    `🏙 شهرستان/شهر: ${profile.city}`,
    `🎨 رنگ پوست: ${pickLabel(SKIN_TONES, profile.skin)}`,
    `🧠 سختی زندگی: ${pickLabel(DIFFICULTIES, profile.difficulty)}`,
    `💼 پیش‌زمینه: ${pickLabel(BACKGROUNDS, profile.background)}`,
    `❤️ سلامت اولیه: ${pickLabel(HEALTHS, profile.healthInit)}`,
    "",
    "📊 وضعیت اولیه",
    `💰 پول: ${stats.money}`,
    `⚡ انرژی: ${stats.energy}`,
    `❤️ سلامتی: ${stats.health}`,
    `🙂 شادی: ${stats.happiness}`,
    `🍀 شانس: ${stats.luck}`
  ].join("\n");
}

/** ---------------- ویزارد ساخت شخصیت ---------------- */
function startCreation(userId, chatId) {
  states.set(userId, { section: "name", temp: {} });
  return bot.sendMessage(chatId, "🧬 ساخت شخصیت شروع شد.\n\n👤 اسم شخصیتت رو بفرست:", replyMenu());
}

function askGender(chatId) {
  return bot.sendMessage(chatId, "🧬 جنسیت را انتخاب کن:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👨 مرد", callback_data: "create:gender:male" },
          { text: "👩 زن", callback_data: "create:gender:female" }
        ],
        [{ text: "⬅️ بازگشت", callback_data: "create:back:name" }]
      ]
    }
  });
}

function askAge(chatId) {
  const rows = [];
  for (let i = 0; i < AGES.length; i += 5) {
    rows.push(
      AGES.slice(i, i + 5).map(a => ({ text: `🎂 ${a}`, callback_data: `create:age:${a}` }))
    );
  }
  rows.push([{ text: "⬅️ بازگشت", callback_data: "create:back:gender" }]);

  return bot.sendMessage(chatId, "🎂 سن را انتخاب کن:", {
    reply_markup: { inline_keyboard: rows }
  });
}

function askProvince(chatId) {
  const provinces = Object.keys(IRAN).sort((a, b) => a.localeCompare(b, "fa"));
  const rows = provinces.map(p => ([{ text: `🗺 ${p}`, callback_data: `create:province:${p}` }]));
  rows.push([{ text: "⬅️ بازگشت", callback_data: "create:back:age" }]);

  return bot.sendMessage(chatId, "🗺 استان را انتخاب کن:", {
    reply_markup: { inline_keyboard: rows }
  });
}

function askCity(chatId, province) {
  const cities = (IRAN[province] || []).slice(0, 10);
  const rows = cities.map(c => ([{ text: `🏙 ${c}`, callback_data: `create:city:${c}` }]));
  rows.push([{ text: "⬅️ بازگشت", callback_data: "create:back:province" }]);

  return bot.sendMessage(chatId, `🏙 از استان «${province}» یک شهر/شهرستان انتخاب کن:`, {
    reply_markup: { inline_keyboard: rows }
  });
}

function askSkin(chatId) {
  const rows = [
    SKIN_TONES.map(s => ({ text: s.label, callback_data: `create:skin:${s.id}` })),
    [{ text: "⬅️ بازگشت", callback_data: "create:back:city" }]
  ];

  return bot.sendMessage(chatId, "🎨 رنگ پوست را انتخاب کن:", {
    reply_markup: { inline_keyboard: rows }
  });
}

function askDifficulty(chatId) {
  const rows = [
    DIFFICULTIES.map(d => ({ text: d.label, callback_data: `create:difficulty:${d.id}` })),
    [{ text: "⬅️ بازگشت", callback_data: "create:back:skin" }]
  ];

  return bot.sendMessage(chatId, "🧠 سختی زندگی را انتخاب کن:", {
    reply_markup: { inline_keyboard: rows }
  });
}

function askBackground(chatId) {
  const rows = [
    BACKGROUNDS.map(b => ({ text: b.label, callback_data: `create:background:${b.id}` })),
    [{ text: "⬅️ بازگشت", callback_data: "create:back:difficulty" }]
  ];

  return bot.sendMessage(chatId, "💼 پیش‌زمینه شروع را انتخاب کن:", {
    reply_markup: { inline_keyboard: rows }
  });
}

function askHealth(chatId) {
  const rows = [
    HEALTHS.map(h => ({ text: h.label, callback_data: `create:health:${h.id}` })),
    [{ text: "⬅️ بازگشت", callback_data: "create:back:background" }]
  ];

  return bot.sendMessage(chatId, "❤️ وضعیت سلامت اولیه را انتخاب کن:", {
    reply_markup: { inline_keyboard: rows }
  });
}

function askConfirm(chatId, userId) {
  const st = states.get(userId);
  const profile = st?.temp;
  if (!profile) return;

  const stats = buildInitialStats(profile);

  return bot.sendMessage(chatId, "✅ بررسی نهایی:\n\n" + profileText(profile, stats), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ تأیید و شروع بازی", callback_data: "create:confirm" },
          { text: "✏️ ویرایش", callback_data: "create:edit" }
        ],
        [{ text: "⬅️ بازگشت", callback_data: "create:back:health" }]
      ]
    }
  });
}

/** ---------------- Commands ---------------- */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sendMainMenu(chatId);

  const userId = msg.from.id;
  if (!users.has(userId)) {
    bot.sendMessage(chatId, "هنوز شخصیتی نساختی. از اینجا شروع کن:", {
      reply_markup: { inline_keyboard: [[{ text: "🧬 ساخت شخصیت", callback_data: "create:start" }]] }
    });
  }
});

bot.onText(/\/me/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const data = users.get(userId);
  if (!data) return bot.sendMessage(chatId, "هنوز پروفایلی ثبت نشده. اول شخصیت بساز.", replyMenu());
  return bot.sendMessage(chatId, profileText(data.profile, data.stats), replyMenu());
});

/** ---------------- Message handler (name input) ---------------- */
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!text) return;
  if (text.startsWith("/")) return;

  // Reply keyboard actions
  if (text === "🏠 منوی اصلی") return sendMainMenu(chatId);

  if (text === "🪪 پروفایل") {
    const data = users.get(userId);
    if (!data) return bot.sendMessage(chatId, "هنوز شخصیتی نساختی. روی «🧬 ساخت شخصیت» بزن.", replyMenu());
    return bot.sendMessage(chatId, profileText(data.profile, data.stats), replyMenu());
  }

  if (text === "🧬 ساخت شخصیت") return startCreation(userId, chatId);

  if (text === "ℹ️ راهنما") {
    return bot.sendMessage(
      chatId,
      "ℹ️ راهنما\n\n- برای شروع «🧬 ساخت شخصیت» را بزن.\n- برای دیدن وضعیت «🪪 پروفایل» را بزن.\n- هرجا خواستی می‌تونی با «⬅️ بازگشت» مرحله قبل رو تغییر بدی.",
      replyMenu()
    );
  }

  // Name input
  const st = states.get(userId);
  if (st?.section === "name") {
    const name = text.trim();
    if (name.length < 2 || name.length > 20) {
      return bot.sendMessage(chatId, "⚠️ اسم باید بین ۲ تا ۲۰ کاراکتر باشد.\n\n👤 دوباره اسم را بفرست:", replyMenu());
    }
    st.temp.name = name;
    st.section = "gender";
    states.set(userId, st);
    return askGender(chatId);
  }
});

/** ---------------- Callback handler ---------------- */
bot.on("callback_query", (q) => {
  const data = q.data;
  const userId = q.from.id;
  const chatId = q.message.chat.id;

  bot.answerCallbackQuery(q.id).catch(() => {});

  if (data === "create:start") return startCreation(userId, chatId);

  if (data === "profile:show") {
    const u = users.get(userId);
    if (!u) return bot.sendMessage(chatId, "هنوز شخصیتی نساختی. از «🧬 ساخت شخصیت» شروع کن.", replyMenu());
    return bot.sendMessage(chatId, profileText(u.profile, u.stats), replyMenu());
  }

  const st = states.get(userId) || { section: "name", temp: {} };

  // Back navigation
  if (data.startsWith("create:back:")) {
    const target = data.replace("create:back:", "");
    st.section = target;
    states.set(userId, st);

    if (target === "name") return bot.sendMessage(chatId, "👤 اسم شخصیتت رو بفرست:", replyMenu());
    if (target === "gender") return askGender(chatId);
    if (target === "age") return askAge(chatId);
    if (target === "province") return askProvince(chatId);
    if (target === "city") return askCity(chatId, st.temp.province);
    if (target === "skin") return askSkin(chatId);
    if (target === "difficulty") return askDifficulty(chatId);
    if (target === "background") return askBackground(chatId);
    if (target === "health") return askHealth(chatId);
  }

  // Gender
  if (data.startsWith("create:gender:")) {
    st.temp.gender = data.replace("create:gender:", "");
    st.section = "age";
    states.set(userId, st);
    return askAge(chatId);
  }

  // Age
  if (data.startsWith("create:age:")) {
    st.temp.age = Number(data.replace("create:age:", ""));
    st.section = "province";
    states.set(userId, st);
    return askProvince(chatId);
  }

  // Province
  if (data.startsWith("create:province:")) {
    const province = data.replace("create:province:", "");
    st.temp.province = province;
    st.section = "city";
    states.set(userId, st);
    return askCity(chatId, province);
  }

  // City
  if (data.startsWith("create:city:")) {
    st.temp.city = data.replace("create:city:", "");
    st.section = "skin";
    states.set(userId, st);
    return askSkin(chatId);
  }

  // Skin
  if (data.startsWith("create:skin:")) {
    st.temp.skin = data.replace("create:skin:", "");
    st.section = "difficulty";
    states.set(userId, st);
    return askDifficulty(chatId);
  }

  // Difficulty
  if (data.startsWith("create:difficulty:")) {
    st.temp.difficulty = data.replace("create:difficulty:", "");
    st.section = "background";
    states.set(userId, st);
    return askBackground(chatId);
  }

  // Background
  if (data.startsWith("create:background:")) {
    st.temp.background = data.replace("create:background:", "");
    st.section = "health";
    states.set(userId, st);
    return askHealth(chatId);
  }

  // Health
  if (data.startsWith("create:health:")) {
    st.temp.healthInit = data.replace("create:health:", "");
    st.section = "confirm";
    states.set(userId, st);
    return askConfirm(chatId, userId);
  }

  // Confirm
  if (data === "create:confirm") {
    const profile = st.temp;

    const required = ["name","gender","age","province","city","skin","difficulty","background","healthInit"];
    const ok = required.every(k => profile && profile[k] !== undefined && profile[k] !== "");
    if (!ok) {
      states.set(userId, { section: "name", temp: {} });
      return bot.sendMessage(chatId, "⚠️ اطلاعات ناقص بود. دوباره تلاش کن.\n\n👤 اسم شخصیتت رو بفرست:", replyMenu());
    }

    const stats = buildInitialStats(profile);

    users.set(userId, { profile, stats, createdAt: Date.now() });
    states.delete(userId);

    bot.sendMessage(chatId, "✅ شخصیتت ساخته شد!", replyMenu());
    return bot.sendMessage(chatId, profileText(profile, stats), replyMenu());
  }

  // Edit menu
  if (data === "create:edit") {
    return bot.sendMessage(chatId, "✏️ کدوم بخش رو می‌خوای تغییر بدی؟", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 نام", callback_data: "create:back:name" }],
          [{ text: "🧬 جنسیت", callback_data: "create:back:gender" }],
          [{ text: "🎂 سن", callback_data: "create:back:age" }],
          [{ text: "🗺 استان", callback_data: "create:back:province" }],
          [{ text: "🏙 شهر/شهرستان", callback_data: "create:back:city" }],
          [{ text: "🎨 رنگ پوست", callback_data: "create:back:skin" }],
          [{ text: "🧠 سختی", callback_data: "create:back:difficulty" }],
          [{ text: "💼 پیش‌زمینه", callback_data: "create:back:background" }],
          [{ text: "❤️ سلامت اولیه", callback_data: "create:back:health" }]
        ]
      }
    });
  }
});

console.log("Bot is running...");
