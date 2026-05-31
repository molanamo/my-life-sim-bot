const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || 'mojaz0762';

app.use(bodyParser.json());

async function tg(method, data) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
    await axios.post(url, data);
  } catch (error) {
    console.error(`Error in ${method}:`, error.response ? error.response.data : error.message);
  }
}

async function sendWelcome(chatId) {
  await tg('sendPhoto', {
    chat_id: chatId,
    photo: process.env.WELCOME_PHOTO_URL || 'https://cdn.imgurl.ir/uploads/y805027_cac6a722-c71d-40b6-81fd-f9a4721ec845.png',
    caption: process.env.WELCOME_TEXT || 'زندگی خودته',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'شروع', callback_data: 'start_action' }],
        [{ text: 'برگشت', callback_data: 'back_action' }]
      ]
    }
  });
}

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);
  const update = req.body;

  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text || '';

    if (text === 'شروع' || text === '/start' || text === 'استارت') {
      await sendWelcome(chatId);
      return;
    }

    await tg('sendMessage', {
      chat_id: chatId,
      text: 'روی دکمه «شروع» بزن',
      reply_markup: {
        keyboard: [[{ text: 'شروع' }]],
        resize_keyboard: true
      }
    });
    return;
  }

  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await tg('answerCallbackQuery', {
      callback_query_id: query.id
    });

    if (query.data === 'start_action') {
      await tg('editMessageCaption', {
        chat_id: chatId,
        message_id: messageId,
        caption: 'زندگی خودته\n\nشروع شد.',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'برگشت', callback_data: 'back_action' }]
          ]
        }
      });
      return;
    }

    if (query.data === 'back_action') {
      await tg('editMessageCaption', {
        chat_id: chatId,
        message_id: messageId,
        caption: process.env.WELCOME_TEXT || 'زندگی خودته',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'شروع', callback_data: 'start_action' }],
            [{ text: 'برگشت', callback_data: 'back_action' }]
          ]
        }
      });
      return;
    }
  }
});

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
