const { Bot, InlineKeyboard } = require("grammy");
const { photos, gifs } = require("./assets");

const bot = new Bot(process.env.BOT_TOKEN);

const photoList = Object.entries(photos).map(([key, id]) => ({ name: key, id }));
const gifList = Object.entries(gifs).map(([key, id]) => ({ name: key, id }));
const allItems = [...photoList, ...gifList];

let index = 0;

bot.command("start", async (ctx) => {
  index = 0;
  await ctx.reply(`📊 عکس: ${photoList.length} | گیف: ${gifList.length} | مجموع: ${allItems.length}\n\nدکمه «بعدی» رو بزن 👇`);
  await showNext(ctx);
});

async function showNext(ctx) {
  if (index >= allItems.length) {
    await ctx.reply(`✅ تموم شد! ${allItems.length} فایل سالم.`);
    return;
  }
  
  const item = allItems[index];
  const isPhoto = index < photoList.length;
  
  try {
    if (isPhoto) {
      await ctx.replyWithPhoto(item.id, {
        caption: `📸 ${index + 1}/${allItems.length} - ${item.name}`,
        reply_markup: new InlineKeyboard().text("▶️ بعدی", "next").text("⏹ توقف", "stop")
      });
    } else {
      await ctx.replyWithAnimation(item.id, {
        caption: `🎬 ${index + 1}/${allItems.length} - ${item.name}`,
        reply_markup: new InlineKeyboard().text("▶️ بعدی", "next").text("⏹ توقف", "stop")
      });
    }
    index++;
  } catch (e) {
    await ctx.reply(`❌ ${item.name}`);
    index++;
    await showNext(ctx);
  }
}

bot.on("callback_query:data", async (ctx) => {
  await ctx.answerCallbackQuery().catch(() => {});
  if (ctx.callbackQuery.data === "next") await showNext(ctx);
  if (ctx.callbackQuery.data === "stop") await ctx.reply(`⏹ توقف در ${index}/${allItems.length}`);
});

bot.catch(() => {});
bot.start();
console.log("🚀 تست assets روشن شد");