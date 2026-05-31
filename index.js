// ... (کدهای قبلی app.use, const, async function tg, async function setWebhook)

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  const update = req.body;

  // /start
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [ // کیبورد معمولی (نه inline)
          [
            { text: "⚫ شروع بازی" }, // دکمه اصلی شروع بازی (بدون callback_data چون پیام متنی است)
            { text: "☰ منو" } // دکمه جدید برای باز کردن منو
          ]
        ],
        resize_keyboard: true // اندازه کیبورد تنظیم شود
      }
    });
    return;
  }

  // اگر کاربر روی دکمه "⚫ شروع بازی" کلیک کرد (به عنوان پیام متنی)
  if (update.message && update.message.text === "⚫ شروع بازی") {
    const chatId = update.message.chat.id;

    // اینجا باید منطق شروع بازی را قرار دهیم
    // فعلاً فقط یک پیام تایید ارسال می‌کنیم
    await tg("sendMessage", {
      chat_id: chatId,
      text: "بازی شروع شد! به زودی مراحل بعدی را خواهید دید.",
      // اگر بخواهیم دکمه‌های inline را اینجا نمایش دهیم:
      // reply_markup: {
      //   inline_keyboard: [
      //     [{ text: "👤 پروفایل من", callback_data: "profile" }],
      //     [{ text: "ℹ️ اطلاعات بیشتر", callback_data: "info" }]
      //   ]
      // }
    });
    return;
  }

  // اگر کاربر روی دکمه "☰ منو" کلیک کرد (به عنوان پیام متنی)
  if (update.message && update.message.text === "☰ منو") {
    const chatId = update.message.chat.id;

    // اینجا باید منوی بازشونده را نمایش دهیم
    await tg("sendMessage", {
      chat_id: chatId,
      text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
      reply_markup: {
        inline_keyboard: [
          // گزینه‌های منو را اینجا اضافه می‌کنیم
          [{ text: "👤 پروفایل من", callback_data: "profile" }],
          [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
          [{ text: "ℹ️ راهنما", callback_data: "help" }],
          [{ text: "🔙 بازگشت به بازی", callback_data: "back_to_game" }] // مثالی برای بازگشت
        ]
      }
    });
    return;
  }

  // پردازش کلیک روی دکمه‌های inline (مثلاً از منوی باز شده)
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackData = update.callback_query.data;

    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    // پردازش گزینه‌های منو
    if (callbackData === "profile") {
      // کد نمایش پروفایل کاربر
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا اطلاعات پروفایل شما نمایش داده می‌شود.",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت", callback_data: "back_to_menu" }] // دکمه بازگشت به منوی قبلی
          ]
        }
      });
    } else if (callbackData === "settings") {
      // کد نمایش تنظیمات
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا تنظیمات ربات است.",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]
          ]
        }
      });
    } else if (callbackData === "help") {
      // کد نمایش راهنما
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا بخش راهنمای ربات است.",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 بازگشت", callback_data: "back_to_menu" }]
          ]
        }
      });
    } else if (callbackData === "back_to_game") {
      // اگر کاربر بخواهد به صفحه اول برگردد (که پیام خوش‌آمدگویی داشت)
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⚫ شروع", callback_data: "start_game" }]
          ]
        }
      });
    } else if (callbackData === "back_to_menu") {
      // بازگشت به منوی اصلی پس از دیدن جزئیات (پروفایل، تنظیمات و...)
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: "اینجا منوی اصلی است. لطفاً یکی از گزینه‌ها را انتخاب کنید:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 پروفایل من", callback_data: "profile" }],
            [{ text: "⚙️ تنظیمات", callback_data: "settings" }],
            [{ text: "ℹ️ راهنما", callback_data: "help" }],
            [{ text: "🔙 بازگشت به بازی", callback_data: "back_to_game" }]
          ]
        }
      });
    }
  }
});

// ... (بقیه کد app.get و app.listen)
