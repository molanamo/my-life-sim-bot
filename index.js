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
  { name: "آتوسا", fileId: "AgACAgQAAxkBAAEqF_VqIUiXDNrgihg0fmG12Gs01PrJ8QACxA1rG_JGCVFD_JpmxUMtsgEAAwIAA3kAAzsE" },
  { name: "کاساندان", fileId: "AgACAgQAAxkBAAEqF_ZqIUiXmwzuK0xxiuZqsSA9keytaAACxQ1rG_JGCVENMXkMV5UfAQEAAwIAA3kAAzsE" },
  { name: "پارمیس", fileId: "AgACAgQAAxkBAAEqF_dqIUiXZp0UrzV7tpEwjxIHJwL0ZwACxg1rG_JGCVEm2_xq5oJQjwEAAwIAA3gAAzsE" },
  { name: "آرتونیس", fileId: "AgACAgQAAxkBAAEqF_lqIUiXoX-Xe4NVgsZbLXA7KmRQtgACxw1rG_JGCVEigD-9RqTJpgEAAwIAA3kAAzsE" },
  { name: "شیرین", fileId: "AgACAgQAAxkBAAEqF_pqIUiX5hgu2spv5cqpQNhwkzoZWQACyA1rG_JGCVFjP_brzFcJeAEAAwIAA3kAAzsE" },
  { name: "ملک جهان", fileId: "AgACAgQAAxkBAAEqF_xqIUiXpjy1R-LudoyFGrJD2qEu3QACyg1rG_JGCVGeTGCNTHEaQQEAAwIAA3kAAzsE" },
  { name: "تاج الملوک", fileId: "AgACAgQAAxkBAAEqF_5qIUiXE2lOOvP0_IkqR5oCoPpBhAACyw1rG_JGCVHtjb_Kyi9t2AEAAwIAA3kAAzsE" },
  { name: "عصمت دولتشاهی", fileId: "AgACAgQAAxkBAAEqGAABaiFIl4W-9FJFZnQ4C2lkvXQnxmEAAs0NaxvyRglRrLHcR39hxqUBAAMCAAN5AAM7BA" },
  { name: "خدیجه ثقفی", fileId: "AgACAgQAAxkBAAEqGAJqIUiXDDIfX1SQmNRuQnojI3TFzgACzg1rG_JGCVFOZ9bATwodkAEAAwIAA3kAAzsE" },
  { name: "منصوره خجسته", fileId: "AgACAgQAAxkBAAEqGANqIUiXm9OB_AYLRM7ZqoWuB9_ykwAC0g1rG_JGCVF5zXNH_Dm_ewEAAwIAA3gAAzsE" }
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
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  await ctx.reply(`\n📊 نتیجه نهایی:\n✅ کار می‌کند: ${working}\n❌ خراب: ${failed}\n\nنام خراب‌ها: ${failedNames.join(", ") || "هیچکدام"}`);
});

if (process.env.RAILWAY_ENV === "true") {
  bot.start({ allowed_updates: ["message"] });
} else {
  bot.start();
}

console.log("📸 تست همه عکس‌های پادشاهان و ملکه‌ها...");