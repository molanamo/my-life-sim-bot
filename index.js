// ... کدهای قبلی ...

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const msg = req.body.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  // چک کن که پیام دریافتی، جزو دستورات شناخته شده باشه
  if (PHOTO_LINKS[text]) {
    try {
      await axios.post(`${URL}/sendPhoto`, {
        chat_id: chatId,
        photo: PHOTO_LINKS[text],
        caption: `نمایش بخش: ${text}`
      });
      console.log(`عکس ${text} برای ${chatId} ارسال شد.`); // پیام برای دیباگ
    } catch (err) {
      console.error(`خطا در ارسال عکس ${text} برای ${chatId}:`, err.response?.data || err.message);
    }
  } else {
    // اگر دستور شناخته نشد، پیام راهنما بفرست
    try {
      await axios.post(`${URL}/sendMessage`, {
        chat_id: chatId,
        text: "دستورات: /start, /file, /market, /survival, /arms"
      });
      console.log(`پیام راهنما برای ${chatId} ارسال شد.`); // پیام برای دیباگ
    } catch (err) {
      console.error(`خطا در ارسال پیام راهنما برای ${chatId}:`, err.response?.data || err.message);
    }
  }
});

// ... بقیه کد ...
