const { Bot } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// لیست کامل file_idهای رهبران و ملکه‌ها (بر اساس عکس‌هایی که فرستادی)
const testList = [
  { name: "کوروش بزرگ", fileId: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3kAAzsE" },
  { name: "داریوش بزرگ", fileId: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE" },
  { name: "انوشیروان", fileId: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA" },
  { name: "شاه عباس", fileId: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA" },
  { name: "نادرشاه", fileId: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE" },
  { name: "کریم‌خان", fileId: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA" },
  { name: "رضاشاه", fileId: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE" },
  { name: "محمدرضا", fileId: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE" },
  { name: "امام خمینی", fileId: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE" },
  { name: "آیت‌الله خامنه‌ای", fileId: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ" }
];

bot.command("start", async (ctx) => {
  let working = 0;
  let failed = 0;
  
  for (const item of testList) {
    try {
      await ctx.replyWithPhoto(item.fileId, { caption: `✅ ${item.name} - عکس کار می‌کند` });
      working++;
    } catch (e) {
      await ctx.reply(`❌ ${item.name} - عکس خراب است`);
      failed++;
    }
  }
  
  await ctx.reply(`\n📊 نتیجه:\n✅ کار می‌کند: ${working}\n❌ خراب: ${failed}`);
});

bot.start();
console.log("📸 تست عکس‌ها...");