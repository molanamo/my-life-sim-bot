const express = require('express')
const axios = require('axios')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const BOT_TOKEN = process.env.BOT_TOKEN
const SECRET_PATH = process.env.SECRET_PATH || 'mojaz0762'

async function tg(method, data) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`
  try {
    const res = await axios.post(url, data)
    console.log(method, res.data)
    return res.data
  } catch (e) {
    console.log('TG ERROR', method, e.response ? e.response.data : e.message)
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
  })
}

app.get('/', (req, res) => {
  res.send('ok')
})

app.get('/setwebhook', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  const hook = `${baseUrl}/webhook/${SECRET_PATH}`
  const result = await tg('setWebhook', { url: hook })
  res.json({ hook, result })
})

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  res.sendStatus(200)
  const update = req.body
  console.log('UPDATE:', JSON.stringify(update))

  if (update.message) {
    const chatId = update.message.chat.id
    const text = update.message.text || ''

    if (text === '/start' || text === 'شروع' || text === 'استارت') {
      await sendWelcome(chatId)
      return
    }

    await tg('sendMessage', {
      chat_id: chatId,
      text: 'برای شروع روی /start بزن',
    })
    return
  }

  if (update.callback_query) {
    const q = update.callback_query
    await tg('answerCallbackQuery', { callback_query_id: q.id })

    if (q.data === 'start_action') {
      await tg('sendMessage', {
        chat_id: q.message.chat.id,
        text: 'شروع شد'
      })
      return
    }

    if (q.data === 'back_action') {
      await tg('sendMessage', {
        chat_id: q.message.chat.id,
        text: 'برگشت'
      })
      return
    }
  }
})

app.listen(PORT, () => {
  console.log(`running on ${PORT}`)
})
