
'use strict';

const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 5576592239;

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('ERROR: BOT_TOKEN is not set.');
}

const bot = new Telegraf(BOT_TOKEN);
const DATA_FILE = path.join(__dirname, 'data.json');
let DB = { users: {} };

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { DB = { users: {} }; }
}
function scheduleSave() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf8');
}
loadDB();

bot.command('give_res', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const args = ctx.message.text.split(' ');
  const userId = Number(args[1]);
  const key = args[2];
  const amount = Number(args[3]);
  if (!DB.users[userId]) DB.users[userId] = { resources: {} };
  DB.users[userId].resources[key] = (DB.users[userId].resources[key] || 0) + amount;
  scheduleSave();
  ctx.reply(`Added ${amount} ${key} to ${userId}`);
});

// Basic start
bot.start((ctx) => ctx.reply('Survival Bot is running!'));

bot.launch();
console.log('Bot started.');
