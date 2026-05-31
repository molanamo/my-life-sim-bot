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

function mainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔫 اسلحه خانه", callback_data: "menu_gun" }],
      [{ text: "🛠 کارگاه", callback_data: "menu_workshop" }],
      [{ text: "🏠 خانه", callback_data: "menu_home" }],
      [{ text: "🛒 فروشگاه", callback_data: "menu_shop" }],
      [{ text: "🕌 مسجد", callback_data: "menu_mosque" }]
    ]
  };
}

function gunKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔫 اسلحه‌ها", callback_data: "guns" },
        { text: "💣 مهمات", callback_data: "ammo" }
      ],
      [{ text: "🛡 زره", callback_data: "armor" }],
      [{ text: "⬅️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

function workshopKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔨 ساخت اسلحه", callback_data: "craft_gun" },
        { text: "🛡 ساخت زره", callback_data: "craft_armor" }
      ],
      [{ text: "⬅️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

function homeKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🪑 وسایل خانه", callback_data: "home_items" }],
      [{ text: "⬅️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

function shopKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🛒 خرید", callback_data: "shop_buy" },
        { text: "💰 فروش", callback_data: "shop_sell" }
      ],
      [{ text: "⬅️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

function mosqueKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🙏 دعا کردن", callback_data: "pray" }],
      [{ text: "📖 کلاس قرآن", callback_data: "quran_class" }],
      [{ text: "⬅️ بازگشت", callback_data: "back_main" }]
    ]
  };
}

async function sendMainMenu(chatId, name = "بازیکن") {
  await tg("sendMessage", {
    chat_id: chatId,
    text: `سلام ${name}\nبه بازی بقا خوش اومدی\nیکی از بخش‌ها را انتخاب کن`,
    reply_markup: mainKeyboard()
  });
}

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  const update = req.body;

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || "";

    if (text === "/start") {
      if (!userData.has(userId)) {
        userData.set(userId, {
          name: msg.from.first_name || "بازیکن",
          gold: 500,
          inventory: [],
          homeItems: ["تخت", "میز", "چراغ"],
          weapons: ["کلت", "چاقو"],
          ammo: ["9mm", "7.62"],
          armor: ["جلیقه سبک"]
        });
      }

      await sendMainMenu(chatId, msg.from.first_name || "بازیکن");
      return;
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: "برای شروع /start را بزن"
    });
  }

  if (update.callback_query) {
    const q = update.callback_query;
    const chatId = q.message.chat.id;
    const messageId = q.message.message_id;
    const userId = q.from.id;
    const data = q.data;

    await tg("answerCallbackQuery", {
      callback_query_id: q.id
    });

    if (!userData.has(userId)) {
      userData.set(userId, {
        name: q.from.first_name || "بازیکن",
        gold: 500,
        inventory: [],
        homeItems: ["تخت", "میز", "چراغ"],
        weapons: ["کلت", "چاقو"],
        ammo: ["9mm", "7.62"],
        armor: ["جلیقه سبک"]
      });
    }

    const user = userData.get(userId);

    switch (data) {
      case "back_main":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `سلام ${user.name}\nبه منوی اصلی برگشتی`,
          reply_markup: mainKeyboard()
        });
        break;

      case "menu_gun":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🔫 اسلحه خانه\nبخش مورد نظر را انتخاب کن",
          reply_markup: gunKeyboard()
        });
        break;

      case "menu_workshop":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🛠 کارگاه\nاینجا می‌تونی اسلحه و زره بسازی",
          reply_markup: workshopKeyboard()
        });
        break;

      case "menu_home":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🏠 خانه\nبخش مورد نظر را انتخاب کن",
          reply_markup: homeKeyboard()
        });
        break;

      case "menu_shop":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🛒 فروشگاه\nخرید یا فروش را انتخاب کن",
          reply_markup: shopKeyboard()
        });
        break;

      case "menu_mosque":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🕌 مسجد\nبخش مورد نظر را انتخاب کن",
          reply_markup: mosqueKeyboard()
        });
        break;

      case "guns":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `🔫 اسلحه‌ها\n${user.weapons.join("\n")}`,
          reply_markup: gunKeyboard()
        });
        break;

      case "ammo":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `💣 مهمات\n${user.ammo.join("\n")}`,
          reply_markup: gunKeyboard()
        });
        break;

      case "armor":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `🛡 زره‌ها\n${user.armor.join("\n")}`,
          reply_markup: gunKeyboard()
        });
        break;

      case "craft_gun":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🔨 ساخت اسلحه\nفعلاً بخش ساخت اسلحه آماده شده",
          reply_markup: workshopKeyboard()
        });
        break;

      case "craft_armor":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🛡 ساخت زره\nفعلاً بخش ساخت زره آماده شده",
          reply_markup: workshopKeyboard()
        });
        break;

      case "home_items":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: `🏠 وسایل خانه\n${user.homeItems.join("\n")}`,
          reply_markup: homeKeyboard()
        });
        break;

      case "shop_buy":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🛒 خرید\nفعلاً بخش خرید آماده شده",
          reply_markup: shopKeyboard()
        });
        break;

      case "shop_sell":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "💰 فروش\nفعلاً بخش فروش آماده شده",
          reply_markup: shopKeyboard()
        });
        break;

      case "pray":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "🙏 دعا کردی\nروحت آروم شد",
          reply_markup: mosqueKeyboard()
        });
        break;

      case "quran_class":
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "📖 کلاس قرآن\nدر کلاس قرآن شرکت کردی",
          reply_markup: mosqueKeyboard()
        });
        break;
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
