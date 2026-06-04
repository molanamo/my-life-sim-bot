const { Bot } = require("grammy");
const bot = new Bot(process.env.BOT_TOKEN);

// لیست file_idهایی که داری
const testIds = {
  "کوروش": "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3cAAzsE",
  "داریوش": "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE",
  "انوشیروان": "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA",
  "شاه عباس": "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA",
  "نادرشاه": "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE",
  "کریم‌خان": "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA",
  "محمدرضا": "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE",
  "امام خمینی": "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE",
  "خامنه‌ای": "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ"
};

bot.command("start", async (ctx) => {
  for (const [name, fileId] of Object.entries(testIds)) {
    try {
      await ctx.replyWithPhoto(fileId, { caption: `✅ ${name} - عکس کار می‌کند` });
    } catch (e) {
      await ctx.reply(`❌ ${name} - عکس خراب است یا وجود ندارد`);
    }
  }
});

bot.start();
console.log("🔍 تست عکس‌ها...");