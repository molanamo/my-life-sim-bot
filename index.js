const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH;
const PORT = process.env.PORT || 3000;

const PHOTO_URL = 'https://i.postimg.cc/3JSpZxnJ/cac6a722-c71d-40b6-81fd-f9a4721ec845.png';

app.get('/', (req, res) => {
  res.send('Bot is alive');
});

app.get('/setwebhook', async (req, res) => {
  try {
    const webhookUrl = `https://${req.get('host')}/webhook/${SECRET_PATH}`;
    const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: webhookUrl
    });
    res.json(r.data);
  } catch (e) {
    res.status(500).json(e.response?.data || { error: e.message });
  }
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200);

  try {
    const msg = req.body.message;
    if (!msg || msg.text !== '/start') return;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      chat_id: msg.chat.id,
      photo: PHOTO_URL
    });

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: msg.chat.id,
      text: 'سلام! به شبیه‌ساز زندگی خوش اومدی 🌱'
    });

  } catch (e) {
    console.error('telegram error:', e.response?.data || e.message);
  }
});

app.listen(PORT, () => {
  console.log(`running on ${PORT}`);
});
