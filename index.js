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

const SHOP_ITEMS = {
  gold:   { name: 'طلا', price: 500, emoji: '🟡' },
  silver: { name: 'نقره', price: 200, emoji: '⚪' },
  wood:   { name: 'چوب', price: 50, emoji: '🪵' },
  stone:  { name: 'سنگ', price: 75, emoji: '🪨' },
  food:   { name: 'غذا', price: 100, emoji: '🍖' },
  water:  { name: 'آب', price: 80, emoji: '💧' },
};

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    DB = { users: {} };
  }
}

function scheduleSave() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2), 'utf8');
}

function ensureUser(userId) {
  if (!DB.users[userId]) {
    DB.users[userId] = {
      money: 0,
      resources: {},
    };
  }
  if (typeof DB.users[userId].money !== 'number') DB.users[userId].money = 0;
  if (!DB.users[userId].resources) DB.users[userId].resources = {};
  return DB.users[userId];
}

function getMoney(userId) {
  const u = ensureUser(userId);
  return u.money || 0;
}

function addMoney(userId, amount) {
  const u = ensureUser(userId);
  u.money += amount;
  scheduleSave();
}

function addResource(userId, key, amount) {
  const u = ensureUser(userId);
  u.resources[key] = (u.resources[key] || 0) + amount;
  scheduleSave();
}

function useMoney(userId, amount) {
  const u = ensureUser(userId);
  if (u.money < amount) return false;
  u.money -= amount;
  scheduleSave();
  return true;
}

function getMainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💰 کیف پول', 'wallet'), Markup.button.callback('🛒 فروشگاه', 'shop')],
    [Markup.button.callback('📦 منابع من', 'inv'), Markup.button.callback('ℹ️ راهنما', 'help')],
    [Markup.button.callback('👑 پنل ادمین', 'admin_menu')],
  ]);
}

function getShopMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🟡 خرید طلا', 'buy_gold'), Markup.button.callback('⚪ خرید نقره', 'buy_silver')],
    [Markup.button.callback('🪵 خرید چوب', 'buy_wood'), Markup.button.callback('🪨 خرید سنگ', 'buy_stone')],
    [Markup.button.callback('🍖 خرید غذا', 'buy_food'), Markup.button.callback('💧 خرید آب', 'buy_water')],
    [Markup.button.callback('⬅️ برگشت', 'back_main')],
  ]);
}

function getAdminMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ اضافه کردن پول', 'admin_add_money')],
    [Markup.button.callback('➕ اضافه کردن طلا', 'admin_add_gold')],
    [Markup.button.callback('➕ اضافه کردن نقره', 'admin_add_silver')],
    [Markup.button.callback('➕ اضافه کردن منابع', 'admin_add_res')],
    [Markup.button.callback('⬅️ برگشت', 'back_main')],
  ]);
}

loadDB();

bot.start((ctx) => {
  const userId = ctx.from.id;
  ensureUser(userId);
  ctx.reply(
    '✅ Survival Bot فعال شد.\nاز منو استفاده کن.',
    getMainMenu()
  );
});

bot.command('give_res', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const args = ctx.message.text.trim().split(/\s+/);
  // /give_res userId key amount
  const userId = Number(args[1]);
  const key = args[2];
  const amount = Number(args[3]);

  if (!userId || !key || !amount) {
    return ctx.reply('فرمت درست: /give_res userId key amount');
  }

  addResource(userId, key, amount);
  ctx.reply(`✅ ${amount} تا ${key} به ${userId} اضافه شد.`);
});

bot.command('give_money', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const args = ctx.message.text.trim().split(/\s+/);
  // /give_money userId amount
  const userId = Number(args[1]);
  const amount = Number(args[2]);

  if (!userId || !amount) {
    return ctx.reply('فرمت درست: /give_money userId amount');
  }

  addMoney(userId, amount);
  ctx.reply(`✅ ${amount} پول به ${userId} اضافه شد.`);
});

bot.hears(/^خرید\s+(\S+)\s+(\d+)$/, (ctx) => {
  const userId = ctx.from.id;
  const itemName = ctx.match[1];
  const targetId = Number(ctx.match[2]);

  if (userId !== ADMIN_ID) {
    return ctx.reply('فقط ادمین می‌تواند خرید انجام دهد.');
  }

  const item = SHOP_ITEMS[itemName];
  if (!item) {
    return ctx.reply('این آیتم وجود ندارد.');
  }

  addResource(targetId, itemName, 1);
  ctx.reply(`✅ یک عدد ${item.name} برای ${targetId} خرید/اضافه شد.`);
});

bot.hears(/^خرید\s+(\S+)\s+(\d+)\s+(\d+)$/, (ctx) => {
  const userId = ctx.from.id;
  const itemName = ctx.match[1];
  const targetId = Number(ctx.match[2]);
  const amount = Number(ctx.match[3]);

  if (userId !== ADMIN_ID) {
    return ctx.reply('فقط ادمین می‌تواند خرید انجام دهد.');
  }

  const item = SHOP_ITEMS[itemName];
  if (!item) {
    return ctx.reply('این آیتم وجود ندارد.');
  }

  addResource(targetId, itemName, amount);
  ctx.reply(`✅ ${amount} عدد ${item.name} برای ${targetId} خرید/اضافه شد.`);
});

bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  ensureUser(userId);

  if (data === 'wallet') {
    return ctx.editMessageText(
      `💰 کیف پول شما:\n\nپول: ${getMoney(userId)}`
    , getMainMenu());
  }

  if (data === 'inv') {
    const u = ensureUser(userId);
    const res = u.resources || {};
    const text = Object.keys(res).length
      ? Object.entries(res).map(([k, v]) => `• ${k}: ${v}`).join('\n')
      : 'هنوز چیزی نداری.';
    return ctx.editMessageText(`📦 منابع شما:\n\n${text}`, getMainMenu());
  }

  if (data === 'help') {
    return ctx.editMessageText(
      'راهنما:\n\n- از فروشگاه خرید کن\n- ادمین می‌تواند با دستور خرید منابع بدهد\n- منوی شیشه‌ای فعال است',
      getMainMenu()
    );
  }

  if (data === 'shop') {
    return ctx.editMessageText(
      '🛒 فروشگاه:\nیکی از آیتم‌ها را انتخاب کن.',
      getShopMenu()
    );
  }

  if (data === 'admin_menu') {
    if (userId !== ADMIN_ID) {
      return ctx.answerCbQuery('دسترسی نداری', { show_alert: true });
    }
    return ctx.editMessageText('👑 پنل ادمین:', getAdminMenu());
  }

  if (data === 'back_main') {
    return ctx.editMessageText('منوی اصلی:', getMainMenu());
  }

  const buyMap = {
    buy_gold: 'gold',
    buy_silver: 'silver',
    buy_wood: 'wood',
    buy_stone: 'stone',
    buy_food: 'food',
    buy_water: 'water',
  };

  if (buyMap[data]) {
    const key = buyMap[data];
    const item = SHOP_ITEMS[key];
    const price = item.price;

    if (!useMoney(userId, price)) {
      return ctx.answerCbQuery('پول کافی نداری', { show_alert: true });
    }

    addResource(userId, key, 1);
    return ctx.editMessageText(
      `✅ خرید انجام شد.\n\n${item.emoji} ${item.name} x1\n💰 هزینه: ${price}\n\nپول باقی‌مانده: ${getMoney(userId)}`,
      getMainMenu()
    );
  }

  return ctx.answerCbQuery();
});

bot.launch();
console.log('Bot started.');
