const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// --- لینک‌های عکس (حذف شده) ---
// const WELCOME_IMAGE = "";
// const MENU_IMAGES = {};
// const NEW_IMAGES = {};
// --- پایان لینک‌های عکس ---

// --- وضعیت کاربر ---
// 0: شروع (قبل از /start)، 1: منوی اصلی، 2: اسلحه خانه، 3: کارگاه، 4: خانه، 5: فروشگاه، 6: مسجد
const userStates = new Map();
// --- پایان وضعیت کاربر ---

// --- داده‌های کاربر ---
// Map برای ذخیره اطلاعات بازیکنان، مانند موجودی، آیتم‌ها و ...
// مثال: userData.set(userId, { name: "...", state: 1, inventory: { ammo: 10, armor: 1 }, gold: 100 });
const userData = new Map();
// --- پایان داده‌های کاربر ---

// --- توابع کمکی برای ساخت کیبوردها ---

// کیبورد اصلی بازی
function getMainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "⚔️ اسلحه خانه", callback_data: "menu_arms" }],
      [{ text: "🛠 کارگاه", callback_data: "menu_workshop" }],
      [{ text: "🏠 خانه", callback_data: "menu_house" }],
      [{ text: "💰 فروشگاه", callback_data: "menu_shop" }],
      [{ text: "🕌 مسجد", callback_data: "menu_mosque" }]
    ]
  };
}

// کیبورد اسلحه خانه
function getArmsKeyboard(user) {
  return {
    inline_keyboard: [
      [{ text: "🔫 اسلحه", callback_data: "arms_guns" }, { text: "🔥 مهمات", callback_data: "arms_ammo" }],
      [{ text: "🛡 زره", callback_data: "arms_armor" }],
      [{ text: "⬅️ بازگشت به منوی اصلی", callback_data: "back_main" }]
    ]
  };
}

// کیبورد کارگاه
function getWorkshopKeyboard() {
    return {
    inline_keyboard: [
      [{ text: "ساخت اسلحه", callback_data: "workshop_craft_gun" }, { text: "ساخت زره", callback_data: "workshop_craft_armor" }],
      [{ text: "⬅️ بازگشت به منوی اصلی", callback_data: "back_main" }]
    ]
  };
}

// کیبورد خانه
function getHouseKeyboard() {
    return {
    inline_keyboard: [
      [{ text: "وسایل خانه", callback_data: "house_items" }],
      [{ text: "⬅️ بازگشت به منوی اصلی", callback_data: "back_main" }]
    ]
  };
}

// کیبورد فروشگاه
function getShopKeyboard() {
    return {
    inline_keyboard: [
      [{ text: "خرید", callback_data: "shop_buy" }, { text: "فروش", callback_data: "shop_sell" }],
      [{ text: "⬅️ بازگشت به منوی اصلی", callback_data: "back_main" }]
    ]
  };
}

// کیبورد مسجد
function getMosqueKeyboard() {
    return {
    inline_keyboard: [
      [{ text: "دعا کردن 🙏", callback_data: "mosque_pray" }],
      [{ text: "کلاس قرآن 📖", callback_data: "mosque_quran" }],
      [{ text: "⬅️ بازگشت به منوی اصلی", callback_data: "back_main" }]
    ]
  };
}
// --- پایان توابع کمکی کیبورد ---

// --- توابع کمکی برای ارسال پیام‌ها ---
async function tg(method, payload) {
  try {
    const res = await axios.post(`${URL}/${method}`, payload);
    return res.data;
  } catch (err) {
    console.error(`TG Error: ${err.response?.data || err.message}`);
    return null;
  }
}

// ارسال پیام خوش آمدگویی و دکمه شروع (بدون عکس)
async function sendWelcome(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "به دنیای بقا خوش آمدی! برای شروع، روی دکمه بزن:",
    reply_markup: {
      inline_keyboard: [[{ text: "🚀 شروع بازی", callback_data: "start_game" }]]
    }
  });
}

// نمایش منوی اصلی بازی (بدون عکس)
async function showMainMenu(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "منوی اصلی بازی:",
    reply_markup: getMainKeyboard()
  });
}

// ارسال پیام برای یک بخش خاص (بدون عکس)
async function sendSectorMessage(chatId, sectorKey, sectorText, keyboard) {
    await tg("sendMessage", {
        chat_id: chatId,
        text: sectorText,
        reply_markup: keyboard
    });
}
// --- پایان توابع کمکی ارسال پیام ---


// --- مسیرهای API ربات ---
app.get("/", (req, res) => {
  res.send("Survival Bot is running!");
});

// نقطه دریافت پیام‌ها از تلگرام (Webhook)
app.post(`/webhook/${process.env.SECRET_PATH || "webhook"}`, async (req, res) => {
  res.sendStatus(200); // پاسخ سریع به تلگرام
  const update = req.body;

  // اگر پیام متنی دریافت شد
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // اگر کاربر قبلا ثبت نام کرده بود (اطلاعاتش توی userData هست)
    if (userData.has(userId)) {
      // کاربر قبلا بازی کرده، پس مستقیم منوی اصلی رو نشون بده
      userStates.set(userId, 1); // وضعیت منوی اصلی
      await showMainMenu(chatId);
      return;
    }

    // اگر پیام "/start" بود و کاربر هنوز ثبت نام نکرده
    if (text === "/start") {
      userStates.set(userId, 0); // وضعیت شروع
      await sendWelcome(chatId); // ارسال پیام خوش آمدگویی
      return;
    }

    // اگر پیام چیز دیگری بود و کاربر ثبت نام نکرده
    await tg("sendMessage", { chatId, text: "لطفا اول با دستور /start بازی را شروع کنید." });

  // اگر دکمه‌ای (Callback Query) فشرده شد
  } else if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id; // شناسه پیامی که دکمه‌اش فشرده شده
    const data = query.data; // اطلاعات دکمه (callback_data)

    await tg("answerCallbackQuery", { callback_query_id: query.id }); // بستن دایره لودینگ روی دکمه

    // اگر کاربر هنوز ثبت نام نکرده ولی دکمه‌ای غیر از "شروع بازی" رو فشرده
    if (!userData.has(userId) && data !== "start_game") {
      await tg("sendMessage", { chatId, text: "لطفا اول با دستور /start بازی را شروع کنید." });
      return;
    }

    // اگر کاربر برای اولین بار دکمه "شروع بازی" رو فشرده، اطلاعات اولیه رو براش تنظیم کن
    if (!userData.has(userId) && data === "start_game") {
      userData.set(userId, {
        name: query.from.first_name, // نام کاربر
        state: 1, // وضعیت: منوی اصلی
        inventory: {}, // موجودی اولیه آیتم‌ها
        gold: 100 // طلای اولیه
      });
      userStates.set(userId, 1); // تنظیم وضعیت کاربر به منوی اصلی
      // پیام خوش آمدگویی رو ویرایش کن و منوی اصلی رو جایگزین کن
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `به دنیای بقا خوش آمدی، ${query.from.first_name}!`,
        reply_markup: getMainKeyboard() // نمایش منوی اصلی
      });
      return; // پایان پردازش این callback
    }

    // --- مدیریت فشردن دکمه‌های مختلف ---
    const currentUserState = userStates.get(userId); // وضعیت فعلی کاربر
    const userInfo = userData.get(userId); // اطلاعات فعلی کاربر

    switch (data) {
      case "back_main": // بازگشت به منوی اصلی
        userStates.set(userId, 1);
        await tg("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: "منوی اصلی بازی:",
          reply_markup: getMainKeyboard()
        });
        break;

      case "menu_arms": // رفتن به اسلحه خانه
        userStates.set(userId, 2);
        await sendSectorMessage(chatId, "arms", "🔫 **اسلحه خانه**\nاینجا می‌تونی انواع اسلحه، مهمات و زره رو پیدا کنی یا بخری.", getArmsKeyboard(userInfo));
        break;

      case "menu_workshop": // رفتن به کارگاه
        userStates.set(userId, 3);
        await sendSectorMessage(chatId, "workshop", "🛠 **کارگاه**\nاینجا می‌تونی با ترکیب آیتم‌ها، سلاح و زره‌های جدید بسازی.", getWorkshopKeyboard());
        break;

       case "menu_house": // رفتن به خانه
        userStates.set(userId, 4);
        await sendSectorMessage(chatId, "house", "🏠 **خانه شما**\nاینجا می‌تونی استراحت کنی، آیتم‌های شخصی‌ت رو ببینی و وضعیت کلی خودت رو چک کنی.", getHouseKeyboard());
        break;

        case "menu_shop": // رفتن به فروشگاه
        userStates.set(userId, 5);
        await sendSectorMessage(chatId, "shop", "💰 **فروشگاه**\nاینجا محل تبادل کالا و پوله. می‌تونی آیتم‌ها رو بخری یا بفروشی.", getShopKeyboard());
        break;

        case "menu_mosque": // رفتن به مسجد
        userStates.set(userId, 6);
        await sendSectorMessage(chatId, "mosque", "🕌 **مسجد**\nاینجا می‌تونی دعا کنی، ثواب جمع کنی یا توی کلاس‌های مذهبی شرکت کنی.", getMosqueKeyboard());
        break;

      // --- جزئیات بیشتر برای هر بخش ---
      // در اینجا باید منطق مربوط به هر دکمه اضافه شود:
      // مثال: خرید، فروش، ساخت، نمایش آیتم‌ها، و ...

      case "arms_guns": // نمایش اسلحه ها در اسلحه خانه
        await tg("editMessageText", {
             chat_id: chatId,
             message_id: messageId,
             text: "🔫 **اسلحه ها**\n\n" +
                   " AK-47: 150$\n" +
                   " Desert Eagle: 100$\n" +
                   " Sniper Rifle: 250$",
              reply_markup: getArmsKeyboard(userInfo) // نمایش دوباره کیبورد اسلحه خانه
         });
        break;
      case "arms_ammo": // نمایش مهمات
         await tg("editMessageText", {
             chat_id: chatId,
             message_id: messageId,
             text: "🔥 **مهمات**\n\n" +
                   " 9mm Bullet: 1$ (عدد)\n" +
                   " 7.62mm Bullet: 2$ (عدد)\n" +
                   " Shotgun Shell: 5$ (عدد)",
              reply_markup: getArmsKeyboard(userInfo)
         });
         break;
      case "arms_armor": // نمایش زره
        await tg("editMessageText", {
             chat_id: chatId,
             message_id: messageId,
             text: "🛡 **زره ها**\n\n" +
                   " Light Vest: 80$\n" +
                   " Heavy Armor: 200$",
              reply_markup: getArmsKeyboard(userInfo)
         });
        break;

       case "workshop_craft_gun": // ساخت اسلحه در کارگاه
         await tg("sendMessage", { chatId, text: "لطفا اسلحه مورد نظرت رو انتخاب کن تا بسازیم." });
         // اینجا باید منطق ساخت اسلحه پیاده سازی بشه
         break;
       case "workshop_craft_armor": // ساخت زره در کارگاه
         await tg("sendMessage", { chatId, text: "لطفا زره مورد نظرت رو انتخاب کن تا بسازیم." });
         // اینجا باید منطق ساخت زره پیاده سازی بشه
         break;

       case "house_items": // نمایش آیتم های خانه
         await tg("editMessageText", {
             chat_id: chatId,
             message_id: messageId,
             text: `🏠 **وسایل خانه شما**\n\n` +
                   `نام: ${userInfo.name}\n` +
                   `پول: ${userInfo.gold}$\n` +
                   `موجودی: ${JSON.stringify(userInfo.inventory) || "خالی"}`,
              reply_markup: getHouseKeyboard()
         });
         break;

       case "shop_buy": // خرید از فروشگاه
         await tg("sendMessage", { chatId, text: "چه آیتمی رو می‌خوای بخری؟" });
         // اینجا باید لیست آیتم های قابل خرید نمایش داده بشه
         break;
       case "shop_sell": // فروش به فروشگاه
         await tg("sendMessage", { chatId, text: "چه آیتمی رو می‌خوای بفروشی؟" });
         // اینجا باید لیست آیتم های قابل فروش نمایش داده بشه
         break;

       case "mosque_pray": // دعا کردن در مسجد
         await tg("editMessageText", {
             chat_id: chatId,
             message_id: messageId,
             text: "🙏 **دعای شما پذیرفته شد!**\n\n" +
                   "چند لحظه استراحت کردی و حس خوبی پیدا کردی.",
              reply_markup: getMosqueKeyboard()
         });
         // اینجا می‌تونی اثرات دعا رو روی بازیکن اعمال کنی (مثلا کمی جون اضافه بشه)
         break;
       case "mosque_quran": // کلاس قرآن در مسجد
         await tg("editMessageText", {
             chat_id: chatId,
             message_id: messageId,
             text: "📖 **کلاس قرآن**\n\n" +
                   "چند آیه از کلام خدا شنیدی و آرامش گرفتی.",
              reply_markup: getMosqueKeyboard()
         });
         // اینجا می‌تونی اثرات کلاس رو روی بازیکن اعمال کنی
         break;

      default:
        console.log("Unknown callback data:", data);
        break;
    }
  }
});

// اجرای سرور روی پورت مشخص شده
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
