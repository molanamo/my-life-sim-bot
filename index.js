const express = require('express')
const axios = require('axios')
const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const BOT_TOKEN = process.env.BOT_TOKEN
const SECRET_PATH = process.env.SECRET_PATH || 'mojaz0762'

async function tg(method, data) {
  try {
    return await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data)
  } catch (e) { console.log('TG ERROR', e.message) }
}

app.get('/setwebhook', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/webhook/${SECRET_PATH}`
  await tg('setWebhook', { url })
  res.send('Webhook set to: ' + url)
})

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200)
  const update = req.body
  if (update.message?.text === '/start') {
    await tg('sendPhoto', {
      chat_id: update.message.chat.id,
      photo: process.env.WELCOME_PHOTO_URL || 'https://cdn.imgurl.ir/uploads/y805027_cac6a722-c71d-40b6-81fd-f9a4721ec845.png',
      caption: process.env.WELCOME_TEXT || 'زندگی خودته',
      reply_markup: { inline_keyboard: [[{ text: 'شروع', callback_data: 'start_action' }, { text: 'برگشت', callback_data: 'back_action' }]] }
    })
  } else if (update.callback_query) {
    await tg('answerCallbackQuery', { callback_query_id: update.callback_query.id })
    await tg('sendMessage', { chat_id: update.callback_query.message.chat.id, text: update.callback_query.data === 'start_action' ? 'شروع شد!' : 'برگشتیم!' })
  }
})

app.listen(PORT, () => console.log('Running'))
