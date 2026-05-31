
const fs = require('fs');
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 5576592239;
const DATA_FILE = './data.json';

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is not set');

const bot = new Telegraf(BOT_TOKEN);

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function initUser(id) {
  if (!db[id]) db[id] = { hp: 100, maxHp: 100, money: 0, resources: { wood: 0, stone: 0, food: 0, water: 0, iron: 0, gold: 0, silver: 0 }, hospitalUntil: 0 };
  return db[id];
}
function isAdmin(ctx){ return ctx.from && ctx.from.id === ADMIN_ID; }
function mainMenu(isAdminUser=false){
  const rows = [
    [Markup.button.callback('🎒 اینونتوری', 'inv'), Markup.button.callback('🏠 خانه', 'home')],
    [Markup.button.callback('🪖 مبارزه', 'fight'), Markup.button.callback('🏥 بیمارستان', 'hospital')],
    [Markup.button.callback('💰 فروشگاه', 'shop'), Markup.button.callback('🛐 معنویت', 'spirit')],
  ];
  if (isAdminUser) rows.push([Markup.button.callback('⚙️ پنل ادمین', 'admin_panel')]);
  return Markup.inlineKeyboard(rows);
}
function adminMenu(){
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ پول', 'adm_money'), Markup.button.callback('➕ منابع', 'adm_res')],
    [Markup.button.callback('❤️ جون', 'adm_hp'), Markup.button.callback('🎁 آیتم', 'adm_item')],
    [Markup.button.callback('⬅️ بازگشت', 'back_main')]
  ]);
}
function textMenu(){
  return `سلام!\n\nمنوی اصلی:`;
}
function hospitalMenu(){
  return Markup.inlineKeyboard([
    [Markup.button.callback('💳 درمان فوری (100 پول)', 'hospital_fast')],
    [Markup.button.callback('⏳ درمان رایگان (زمان‌دار)', 'hospital_free')],
    [Markup.button.callback('⬅️ بازگشت', 'back_main')]
  ]);
}
function shopMenu(){
  return Markup.inlineKeyboard([
    [Markup.button.callback('🍞 خرید غذا', 'buy_food'), Markup.button.callback('💧 خرید آب', 'buy_water')],
    [Markup.button.callback('⛏ خرید چوب', 'buy_wood'), Markup.button.callback('🪨 خرید سنگ', 'buy_stone')],
    [Markup.button.callback('⬅️ بازگشت', 'back_main')]
  ]);
}

let db = loadData();

bot.start(async (ctx) => {
  const u = initUser(String(ctx.from.id)); saveData();
  await ctx.reply('به بازی بقا خوش آمدی!', mainMenu(isAdmin(ctx)));
});

bot.command('give_res', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('دسترسی نداری.');
  const [uid, key, amount] = ctx.message.text.split(/\s+/).slice(1);
  if (!uid || !key || !amount) return ctx.reply('فرمت: /give_res userId key amount');
  const u = initUser(String(uid));
  u.resources[key] = (u.resources[key] || 0) + Number(amount);
  saveData();
  ctx.reply('انجام شد.');
});
bot.command('give_hp', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('دسترسی نداری.');
  const [uid, amount] = ctx.message.text.split(/\s+/).slice(1);
  if (!uid || !amount) return ctx.reply('فرمت: /give_hp userId amount');
  const u = initUser(String(uid));
  u.hp = Math.min(u.maxHp, u.hp + Number(amount));
  saveData();
  ctx.reply('انجام شد.');
});
bot.command('give_item', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('دسترسی نداری.');
  const [uid, type, itemId] = ctx.message.text.split(/\s+/).slice(1);
  if (!uid || !type || !itemId) return ctx.reply('فرمت: /give_item userId weapon|armor itemId');
  const u = initUser(String(uid));
  u[type] = u[type] || [];
  u[type].push(itemId);
  saveData();
  ctx.reply('انجام شد.');
});
bot.command('give_money', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('دسترسی نداری.');
  const [uid, amount] = ctx.message.text.split(/\s+/).slice(1);
  if (!uid || !amount) return ctx.reply('فرمت: /give_money userId amount');
  const u = initUser(String(uid));
  u.money = (u.money || 0) + Number(amount);
  saveData();
  ctx.reply('انجام شد.');
});

bot.action('back_main', async (ctx) => { await ctx.editMessageText(textMenu(), mainMenu(isAdmin(ctx))); });
bot.action('inv', async (ctx) => {
  const u = initUser(String(ctx.from.id));
  await ctx.editMessageText(`❤️ جون: ${u.hp}/${u.maxHp}\n💰 پول: ${u.money}\n\nمنابع:\n` + Object.entries(u.resources).map(([k,v])=>`${k}: ${v}`).join('\n'), mainMenu(isAdmin(ctx)));
});
bot.action('home', async (ctx) => { await ctx.answerCbQuery('خانه'); await ctx.editMessageText('🏠 بخش خانه هنوز در حال تکمیل است.', mainMenu(isAdmin(ctx))); });
bot.action('fight', async (ctx) => { await ctx.answerCbQuery('مبارزه'); await ctx.editMessageText('🪖 بخش مبارزه آماده است ولی در این نسخه ساده شده.', mainMenu(isAdmin(ctx))); });
bot.action('hospital', async (ctx) => { await ctx.editMessageText('🏥 بیمارستان\nیکی را انتخاب کن:', hospitalMenu()); });
bot.action('hospital_fast', async (ctx) => {
  const u = initUser(String(ctx.from.id));
  if ((u.money || 0) < 100) return ctx.answerCbQuery('پول کافی نداری');
  u.money -= 100; u.hp = u.maxHp; saveData();
  await ctx.editMessageText('درمان فوری انجام شد ✅', mainMenu(isAdmin(ctx)));
});
bot.action('hospital_free', async (ctx) => {
  const u = initUser(String(ctx.from.id));
  u.hospitalUntil = Date.now() + 60 * 60 * 1000;
  saveData();
  await ctx.editMessageText('درمان رایگان فعال شد. بعد از زمان مشخص ترخیص می‌شوی.', mainMenu(isAdmin(ctx)));
});
bot.action('shop', async (ctx) => { await ctx.editMessageText('🛒 فروشگاه:\nبا پول می‌تونی خرید کنی.', shopMenu()); });
bot.action('spirit', async (ctx) => { await ctx.editMessageText('🛐 بخش معنوی در حال تکمیل است.', mainMenu(isAdmin(ctx))); });
bot.action('admin_panel', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('دسترسی نداری');
  await ctx.editMessageText('⚙️ پنل ادمین', adminMenu());
});

bot.action('adm_money', async (ctx)=>{ if(!isAdmin(ctx)) return; await ctx.answerCbQuery('از دستور /give_money استفاده کن'); });
bot.action('adm_res', async (ctx)=>{ if(!isAdmin(ctx)) return; await ctx.answerCbQuery('از /give_res استفاده کن'); });
bot.action('adm_hp', async (ctx)=>{ if(!isAdmin(ctx)) return; await ctx.answerCbQuery('از /give_hp استفاده کن'); });
bot.action('adm_item', async (ctx)=>{ if(!isAdmin(ctx)) return; await ctx.answerCbQuery('از /give_item استفاده کن'); });

setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const id of Object.keys(db)) {
    const u = db[id];
    if (u.hospitalUntil && now >= u.hospitalUntil) {
      u.hospitalUntil = 0;
      u.hp = u.maxHp;
      changed = true;
    }
  }
  if (changed) saveData();
}, 30000);

process.once('SIGINT', () => { saveData(); process.exit(0); });
process.once('SIGTERM', () => { saveData(); process.exit(0); });

bot.launch();
