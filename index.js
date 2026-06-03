// این رو به آخر فایل اضافه کن، قبل از bot.start()
bot.on("message:photo", async (ctx) => {
  // آخرین (بزرگ‌ترین) سایز عکس رو می‌گیره
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileId = photo.file_id;
  
  await ctx.reply(
    `✅ file_id عکس تو:\n\n\`${fileId}\`\n\n` +
    `این کد رو کپی کن و تو جای لینک عکس بذار.`,
    { parse_mode: "Markdown" }
  );
  
  console.log("file_id جدید:", fileId);
});