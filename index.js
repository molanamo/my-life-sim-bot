// ... (کدهای قبلی)

  // /start
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    // پیام خوش‌آمدگویی مرموز با دکمه شروع
    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [ // این قسمت کیبورد معمولی را تعریف می‌کند
          // یک ردیف دکمه شامل دکمه "شروع"
          [{ text: "⚫ شروع", callback_data: "start_game" }] // این دکمه inline هست، باید به کیبورد معمولی تبدیل شه
        ],
        resize_keyboard: true // کیبورد اندازه مناسبی داشته باشد
      }
    });
    return;
  }

// ... (بقیه کد)
