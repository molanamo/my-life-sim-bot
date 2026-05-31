// ... (کدهای قبلی app.use, const, async function tg, async function setWebhook)

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  const update = req.body;

  // /start
  if (update.message && update.message.text === "/start") {
    const chatId = update.message.chat.id;

    // پیام خوش‌آمدگویی مرموز با دکمه شروع
    await tg("sendMessage", {
      chat_id: chatId,
      text: `        🌌⛓️💀   وارد زندگی شو...   👁️‍🗨️⏳`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚫ شروع", callback_data: "start_game" }]
        ]
      }
    });

    return;
  }

  // پردازش دکمه شروع بازی
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const callbackData = update.callback_query.data;

    await tg("answerCallbackQuery", {
      callback_query_id: update.callback_query.id
    });

    if (callbackData === "start_game") {
      // اینجا باید کدی قرار بگیرد که وقتی کاربر روی "شروع" کلیک می‌کند،
      // چه اتفاقی بیفتد. فعلاً فقط پیام خوش‌آمدگویی را ادیت می‌کنیم
      // یا یک پیام جدید می‌فرستیم.
      // برای شروع، پیام قبلی را با اطلاعات کاربر جایگزین می‌کنیم:
      const firstName = update.callback_query.from.first_name || "کاربر";
      const username = update.callback_query.from.username
        ? `@${update.callback_query.from.username}`
        : "ندارد";
      const userId = update.callback_query.from.id;

      await tg("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text:
          `╭━━━✨ *اطلاعات شما* ✨━━━╮\n` +
          `👤 نام شما: *${firstName}*\n` +
          `📌 یوزرنیم: *${username}*\n` +
          `🆔 آیدی: \`${userId}\`\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
          `یکی از گزینه‌های زیر را انتخاب کن:`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 پروفایل من", callback_data: "profile" }],
            [{ text: "ℹ️ اطلاعات بیشتر", callback_data: "info" }]
          ]
        }
      });
    }
    
    // کدهای مربوط به callbackData های دیگر مثل "profile", "info" و ...
    // در اینجا اضافه خواهند شد.
  }
  
  // ... (بقیه کدهای احتمالی برای پردازش پیام‌ها)
});

// ... (بقیه کدهای app.get و app.listen)
