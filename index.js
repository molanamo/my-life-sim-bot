const { Bot } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

const allImages = [
  // پادشاهان
  { name: "کوروش بزرگ", fileId: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3kAAzsE" },
  { name: "داریوش بزرگ", fileId: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE" },
  { name: "انوشیروان", fileId: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA" },
  { name: "شاه عباس", fileId: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA" },
  { name: "نادرشاه", fileId: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE" },
  { name: "کریم‌خان", fileId: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA" },
  { name: "رضاشاه", fileId: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE" },
  { name: "محمدرضا", fileId: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE" },
  { name: "امام خمینی", fileId: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE" },
  { name: "آیت‌الله خامنه‌ای", fileId: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ" },
  // ملکه‌ها
  { name: "آتوسا", fileId: "AgACAgQAAxkBAAEqF6NqIUGvMwVXtM8byLf_fcI64Dnh2AAClg1rG_JGCVGRD1_eTpeyTQEAAwIAA3kAAzsE" },
  { name: "بوران‌دخت", fileId: "AgACAgQAAxkBAAEqF6RqIUGvMJBx5IvNRofoZ8LIjEUQhgAClw1rG_JGCVEigufPgWVG4QEAAwIAA3kAAzsE" },
  { name: "آرتمیس", fileId: "AgACAgQAAxkBAAEqF6VqIUGvLWKsCa-lTLMvGzPDuoBUmgACmw1rG_JGCVFYnmKwrGD4vAEAAwIAA3kAAzsE" },
  { name: "گردآفرید", fileId: "AgACAgQAAxkBAAEqF6ZqIUGvhScsO4blT-CbwAVlN5CW2gACnA1rG_JGCVGyVXBSWWREhwEAAwIAA3kAAzsE" },
  { name: "همای چهرزاد", fileId: "AgACAgQAAxkBAAEqF6dqIUGvQR6I1D5rIDBzEc_D1Im-rQACnQ1rG_JGCVH-XHKbJOZwzwEAAwIAA3kAAzsE" },
  { name: "شیرین", fileId: "AgACAgQAAxkBAAEqF6hqIUGv35a--HGpzk9irxh-CzkWRQACng1rG_JGCVFCetGetnyO5QEAAwIAA3kAAzsE" },
  { name: "ملکه پارسی", fileId: "AgACAgQAAxkBAAEqF6lqIUGv10Tu1XXOsio5fGJ4kuFDtwACnw1rG_JGCVHj684FORlTOwEAAwIAA3kAAzsE" },
  { name: "مهدعلیا", fileId: "AgACAgQAAxkBAAEqF6pqIUGvvAABUx6U9AS7UUF1q0Uu0E0AAqANaxvyRglRpy5Msbn1-SMBAAMCAAN5AAM7BA" }
];

bot.command("start", async (ctx) => {
  let working = 0;
  let failed = 0;
  let failedNames = [];

  for (const item of allImages) {
    try {
      await ctx.replyWithPhoto(item.fileId, { caption: `✅ ${item.name}` });
      working++;
    } catch (e) {
      failed++;
      failedNames.push(item.name);
      await ctx.reply(`❌ ${item.name} - عکس خراب است`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await ctx.reply(`\n📊 نتیجه نهایی:\n✅ کار می‌کند: ${working}\n❌ خراب: ${failed}\n\nنام خراب‌ها: ${failedNames.join(", ") || "هیچکدام"}`);
});

bot.start();
console.log("📸 تست همه عکس‌های رهبران و ملکه‌ها...");