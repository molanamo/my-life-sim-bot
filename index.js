const { Bot, InlineKeyboard } = require("grammy");

const bot = new Bot(process.env.BOT_TOKEN);

// لیست همه عکس‌ها
const allPhotos = [
  // منوی اصلی
  { name: "منوی اصلی - تخت جمشید", id: "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE" },
  // پادشاهان
  { name: "کوروش بزرگ", id: "AgACAgQAAxkBAAEqCuxqH_gzDC0lhnhq5XY5trPLrtNiKAACiQ5rG4APAVESIQfjCtTuagEAAwIAA3kAAzsE" },
  { name: "داریوش بزرگ", id: "AgACAgQAAxkBAAEqCwxqH_vHXf_othfTA2jTsuAZqqbuSQACkg5rG4APAVFF2KiazmU2oQEAAwIAA3kAAzsE" },
  { name: "انوشیروان", id: "AgACAgQAAxkBAAEqCxBqH_xgAAGDky46hdN3TNPOpoLa7CAAApQOaxuADwFRz7glJ8phpNsBAAMCAAN5AAM7BA" },
  { name: "شاه عباس", id: "AgACAgQAAxkBAAEqC1ZqIAABw4hu6fz4rv1Sm5C2Wxg654IAApUOaxuADwFREeM5uPDykG0BAAMCAAN5AAM7BA" },
  { name: "نادرشاه", id: "AgACAgQAAxkBAAEqC8BqIAqp_nwtXft1OGSIEp-AfmmTuwACpw5rG4APAVERR2QTdtSDlwEAAwIAA3kAAzsE" },
  { name: "کریم‌خان زند", id: "AgACAgQAAxkBAAEqDQpqICDyBdfDPIAlcnUqTvtg1bfXlwACyA5rG4APAVHI6esAAVBUeW0BAAMCAAN5AAM7BA" },
  { name: "رضاشاه", id: "AgACAgQAAxkBAAEqDRRqICGe82zWxY2HygESUHruXYt-pwAC1w5rG4APAVEE1NreIhRuWQEAAwIAA3kAAzsE" },
  { name: "محمدرضا پهلوی", id: "AgACAgQAAxkBAAEqDSBqICI_SreoP_nMRvgKJ_MB9q4CnQAC2A5rG4APAVHq3LzEIHc2lwEAAwIAA3kAAzsE" },
  { name: "امام خمینی", id: "AgACAgQAAxkBAAEqDSVqICKpjXkKp6VNQ5cFJXfaBxJ6SQAC2Q5rG4APAVFwaaT8pT6IowEAAwIAA3cAAzsE" },
  { name: "آیت‌الله خامنه‌ای", id: "AgACAgQAAxkBAAEqDSpqICL4y8wH9x-j28C2AAFizyn8n7AAAtoOaxuADwFRayCfRQAB1p5AAQADAgADdwADOwQ" },
  // ملکه‌ها
  { name: "آتوسا", id: "AgACAgQAAxkBAAEqF_VqIUiXDNrgihg0fmG12Gs01PrJ8QACxA1rG_JGCVFD_JpmxUMtsgEAAwIAA3kAAzsE" },
  { name: "کاساندان", id: "AgACAgQAAxkBAAEqF_ZqIUiXmwzuK0xxiuZqsSA9keytaAACxQ1rG_JGCVENMXkMV5UfAQEAAwIAA3kAAzsE" },
  { name: "پارمیس", id: "AgACAgQAAxkBAAEqF_dqIUiXZp0UrzV7tpEwjxIHJwL0ZwACxg1rG_JGCVEm2_xq5oJQjwEAAwIAA3gAAzsE" },
  { name: "آرتونیس", id: "AgACAgQAAxkBAAEqF_lqIUiXoX-Xe4NVgsZbLXA7KmRQtgACxw1rG_JGCVEigD-9RqTJpgEAAwIAA3kAAzsE" },
  { name: "شیرین", id: "AgACAgQAAxkBAAEqF_pqIUiX5hgu2spv5cqpQNhwkzoZWQACyA1rG_JGCVFjP_brzFcJeAEAAwIAA3kAAzsE" },
  { name: "ملک جهان", id: "AgACAgQAAxkBAAEqF_xqIUiXpjy1R-LudoyFGrJD2qEu3QACyg1rG_JGCVGeTGCNTHEaQQEAAwIAA3kAAzsE" },
  { name: "تاج الملوک", id: "AgACAgQAAxkBAAEqF_5qIUiXE2lOOvP0_IkqR5oCoPpBhAACyw1rG_JGCVHtjb_Kyi9t2AEAAwIAA3kAAzsE" },
  { name: "عصمت دولتشاهی", id: "AgACAgQAAxkBAAEqGAABaiFIl4W-9FJFZnQ4C2lkvXQnxmEAAs0NaxvyRglRrLHcR39hxqUBAAMCAAN5AAM7BA" },
  { name: "خدیجه ثقفی", id: "AgACAgQAAxkBAAEqGAJqIUiXDDIfX1SQmNRuQnojI3TFzgACzg1rG_JGCVFOZ9bATwodkAEAAwIAA3kAAzsE" },
  { name: "منصوره خجسته", id: "AgACAgQAAxkBAAEqGANqIUiXm9OB_AYLRM7ZqoWuB9_ykwAC0g1rG_JGCVF5zXNH_Dm_ewEAAwIAA3gAAzsE" },
  // زن‌های جنگجو
  { name: "گردآفرید", id: "AgACAgQAAxkBAAEqF6ZqIUGvhScsO4blT-CbwAVlN5CW2gACnA1rG_JGCVGyVXBSWWREhwEAAwIAA3kAAzsE" },
  { name: "ارتمیس", id: "AgACAgQAAxkBAAEqF6VqIUGvLWKsCa-lTLMvGzPDuoBUmgACmw1rG_JGCVFYnmKwrGD4vAEAAwIAA3kAAzsE" },
  { name: "بوران دخت", id: "AgACAgQAAxkBAAEqF6RqIUGvMJBx5IvNRofoZ8LIjEUQhgAClw1rG_JGCVEigufPgWVG4QEAAwIAA3kAAzsE" },
  { name: "همای چرزاد", id: "AgACAgQAAxkBAAEqF6dqIUGvQR6I1D5rIDBzEc_D1Im-rQACnQ1rG_JGCVH-XHKbJOZwzwEAAwIAA3kAAzsE" },
  // شخصیت‌های دیگر
  { name: "پرشین کوین", id: "AgACAgQAAxkBAAEqF6lqIUGv10Tu1XXOsio5fGJ4kuFDtwACnw1rG_JGCVHj684FORlTOwEAAwIAA3kAAzsE" },
  { name: "مهد علیا", id: "AgACAgQAAxkBAAEqF6pqIUGvvAABUx6U9AS7UUF1q0Uu0E0AAqANaxvyRglRpy5Msbn1-SMBAAMCAAN5AAM7BA" },
  { name: "رضا شاه کبیر", id: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  { name: "سرباز جنگ ایران و عراق", id: "AgACAgQAAxkBAAEqDiZqIDCc9bGzQWtIa_nd9kU4bYlLZAAC_g5rG4APAVFhExSQa7SOBAEAAwIAA3kAAzsE" },
  { name: "فرماندهان جنبش اسلامی", id: "AgACAgQAAxkBAAEqEadqIHW0aO79nY9EHGvTVLckjvKAlwAC6w9rG4APAVEa86AZ5XmHMQEAAwIAA3kAAzsE" },
  // سیراز
  { name: "سیراز", id: "AgACAgQAAxkBAAEqFodqISonjCvmbKmawsmFCzAV-A7hCwACdw1rG_JGCVHEOM2EpM4tHgEAAwIAA3kAAzsE" },
  // صحنه‌های جنگ
  { name: "نبرد کوروش", id: "AgACAgQAAxkBAAEqDexqIC3VJle3eBKrpyP2iPCb2nSHdgAC8g5rG4APAVFruE7qyqYySgEAAwIAA3kAAzsE" },
  { name: "نبرد داریوش", id: "AgACAgQAAxkBAAEqDgRqIC6pWLzAhSz62YlMEYu1BBJXcAAC9Q5rG4APAVFi2sJMMLDVlwEAAwIAA3kAAzsE" },
  { name: "نبرد انوشیروان", id: "AgACAgQAAxkBAAEqDgxqIC84TrWNGA0_YAj8HnqqpititgAC9g5rG4APAVHJULBSG_V9cgEAAwIAA3kAAzsE" },
  { name: "نبرد شاه عباس", id: "AgACAgQAAxkBAAEqDg5qIC-FmcT5wcvNUS8KV76mh2R2cAAC9w5rG4APAVGvRzPXUAGvzgEAAwIAA3kAAzsE" },
  { name: "نبرد نادرشاه", id: "AgACAgQAAxkBAAEqDhJqIC_JqhOlWXWY5bNFKEYODsErLgAC-A5rG4APAVFDa5CLbAKRpgEAAwIAA3kAAzsE" },
  { name: "ارتش رضاشاه", id: "AgACAgQAAxkBAAEqDhxqIDAr_kFEEVk6PpR6-6MQ8xtobQAC_A5rG4APAVFXBwkTZaZBUgEAAwIAA3gAAzsE" },
  { name: "جنگ ایران و عراق", id: "AgACAgQAAxkBAAEqDiZqIDCc9bGzQWtIa_nd9kU4bYlLZAAC_g5rG4APAVFhExSQa7SOBAEAAwIAA3kAAzsE" },
  { name: "نقشه ایران باستان", id: "AgACAgQAAxkBAAEqEn1qIIS1Cpu26NucbgH1ankioQm-9AACHRBrG4APAVHcgdJ7gFsdyAEAAwIAA3gAAzsE" },
  // دسته‌بندی‌ها
  { name: "هخامنشیان", id: "AgACAgQAAxkBAAEqDTBqICOASxW5zGuBthI4MCjwOCL9mgAC3w5rG4APAVH5dNZ45D-UwwEAAwIAA3kAAzsE" },
  { name: "صفویان", id: "AgACAgQAAxkBAAEqDUdqICQc6ZB0uinHD6hZ7wcT3u86oQAC4A5rG4APAVFQEaC3exIhHQEAAwIAA3kAAzsE" },
  { name: "پهلویان", id: "AgACAgQAAxkBAAEqDW1qICTZj5vvNZdj8IfXm08Go-EoHAAC4w5rG4APAVF78qoubkaQrgEAAwIAA3kAAzsE" },
  { name: "جمهوری اسلامی", id: "AgACAgQAAxkBAAEqDXxqICU_YmcR261F414EcCku6vMMCAAC5A5rG4APAVEmgDq8PfldMwEAAwIAA3gAAzsE" },
  // نمادها
  { name: "شیر و خورشید", id: "AgACAgQAAxkBAAEqGVJqIV2gHEUpDQUUfck0hwgJx_QTjQACPxBrG4APAVGrcr1xhhY1AQEAAwIAA3gAAzsE" },
  // موشک‌ها
  { name: "موشک فتاح", id: "AgACAgQAAxkBAAEqGXlqIV2h7RfXckZup-Ha8vlUAAGS_o0AAu4NaxvyRglRBRlbMEyrx0QBAAMCAAN5AAM7BA" },
  { name: "موشک خرمشهر", id: "AgACAgQAAxkBAAEqGXpqIV2hZ-cvrruLiDh0e7STIYck_QAC7w1rG_JGCVHQW9mL44xh9gEAAwIAA3gAAzsE" },
  { name: "موشک عماد", id: "AgACAgQAAxkBAAEqGXtqIV2hy_s3iKX_Hop76X_-gWPxswAC8A1rG_JGCVG0HRk0xqeRoAEAAwIAA3kAAzsE" },
  // حیوانات
  { name: "گربه", id: "AgACAgQAAxkBAAEqGh5qIWRNDSpzJewllQF7fruXWkTpgQACEQ5rG9cu8VCb-SHc4pXRuQEAAwIAA3kAAzsE" },
  { name: "سگ قفقاز", id: "AgACAgQAAxkBAAEqGiFqIWRNkPMGHk4RQg2704oOA16xRgACDw5rG9cu8VCgzsRC-8ekcwEAAwIAA3gAAzsE" },
  { name: "شاهین", id: "AgACAgQAAxkBAAEqGh9qIWRNEFEuC6g-IEo8SKjo2NJ1sgACEA5rG9cu8VDsCJNGgFooFAEAAwIAA3kAAzsE" },
  { name: "خروس لاری", id: "AgACAgQAAxkBAAEqGiJqIWRNK2YdTMGPe1nNmdyH_LIqPwACDg5rG9cu8VAcwQJY9G8vMgEAAwIAA3kAAzsE" },
  { name: "کهره (بز)", id: "AgACAgQAAxkBAAEqGiNqIWRNKT7S6u0rsLrfeMpe5lP5sQACZRBrG_TM8VB34Rt0cFHq8gEAAwIAA3gAAzsE" },
  { name: "شتر", id: "AgACAgQAAxkBAAEqGiRqIWRN4zd_hyuMYKbRrzjE6vbELwACZBBrG_TM8VC9RG-5ZoaCbQEAAwIAA3gAAzsE" },
  { name: "اسب", id: "AgACAgQAAxkBAAEqGiZqIWRNuSSxc0t6apD6Xes3yCBDvwACDA5rG9cu8VA3l4xXzSBheAEAAwIAA3kAAzsE" },
  // موجودات افسانه‌ای
  { name: "دیو سفید ۱", id: "AgACAgQAAxkBAAEqGihqIWRNpmPmDk-5cyte6ienlfnkNQACEg5rG9cu8VCIxhhpqkAcogEAAwIAA3kAAzsE" },
  { name: "دیو سفید ۲", id: "AgACAgQAAxkBAAEqGipqIWRNsx7JrE6YkujXwGWr03mDlwACEw5rG9cu8VA_llEP_rByBQEAAwIAA3kAAzsE" },
  { name: "شیطان سیاه", id: "AgACAgQAAxkBAAEqGixqIWRN8DLNITn4JpBR_8IOD_rcFwACFA5rG9cu8VA7Zix-clGfZAEAAwIAA3kAAzsE" },
  { name: "دیو دریا", id: "AgACAgQAAxkBAAEqGi5qIWRNv_hwVHRB5EGltkAfTZH1_AACFQ5rG9cu8VCYJTn9vjqD9QEAAwIAA3kAAzsE" },
  { name: "شیطان", id: "AgACAgQAAxkBAAEqGjBqIWRN4m9TIMsISLquTd6f05AwqQACFg5rG9cu8VA5kUT_RJVxWwEAAwIAA3kAAzsE" },
  { name: "مارشاه", id: "AgACAgQAAxkBAAEqGjFqIWRNCxh1-j1k-lJQtNqAGTop3AACFw5rG9cu8VDIa6hQ0ARWaQEAAwIAA3kAAzsE" },
  { name: "ام الجنی", id: "AgACAgQAAxkBAAEqGjVqIWRNa6NNNPA_W7iUJjAR3PUAAUAAAhkOaxvXLvFQ7I3gbmQTUL0BAAMCAAN5AAM7BA" },
  { name: "اژدهای کوهستان", id: "AgACAgQAAxkBAAEqGjZqIWRNe4Rmq4FSjQ7wdu22cfkwEQACHA5rG9cu8VBILeJFIlQ5kQEAAwIAA3kAAzsE" },
  { name: "ققنوس", id: "AgACAgQAAxkBAAEqGjNqIWRNIsQKOamq4k4eX8BP8LNqegACGA5rG9cu8VA167M5oqKbjwEAAwIAA3kAAzsE" },
  // سلاح‌ها
  { name: "خنجر", id: "AgACAgQAAxkBAAEqGjdqIWRNa9r2wExfUoeDAl9M9zJgvAACHw5rG9cu8VDMz1yDpuuBagEAAwIAA3kAAzsE" },
  { name: "شمشیر", id: "AgACAgQAAxkBAAEqGjhqIWRNXmPzB82LsD5xvQkAAfsEHP8AAiAOaxvXLvFQhNQt1fDaaBwBAAMCAAN5AAM7BA" },
  { name: "کمان", id: "AgACAgQAAxkBAAEqGjlqIWRN_W0AAS1cZ5FSHJsWMqu1GOYAAiEOaxvXLvFQz5eYDfG_HCsBAAMCAAN4AAM7BA" },
  { name: "تبر", id: "AgACAgQAAxkBAAEqGjpqIWRN876SySLLuGybhbtY0Qn1hAACIw5rG9cu8VCC1L_O6uURuQEAAwIAA3kAAzsE" },
  { name: "نیزه", id: "AgACAgQAAxkBAAEqGjtqIWRN8D4hqODSK-Ask7eW6BGHyAACJA5rG9cu8VCSKKiSX1WdgwEAAwIAA3kAAzsE" },
  { name: "خنجر ۲", id: "AgACAgQAAxkBAAEqGjxqIWRN3i4WBmIcu565RiZo2iqnXgACJQ5rG9cu8VCOvr949hsezwEAAwIAA3kAAzsE" },
  { name: "کمان ۲", id: "AgACAgQAAxkBAAEqGj1qIWRNhV62FhYmpw9Ehsfd9wiNuwACJg5rG9cu8VAfhZuNjCCP9QEAAwIAA3kAAzsE" },
  { name: "تبر ارتقایافته", id: "AgACAgQAAxkBAAEqGj5qIWRNJU7kW0Np53vO9qwUfHd2DAACJw5rG9cu8VDgX8i8bKvapwEAAwIAA3kAAzsE" },
  // زره‌ها
  { name: "سپر چوبی", id: "AgACAgQAAxkBAAEqGj9qIWRN24mpOT4EXo85JOsWG_4oXgACKA5rG9cu8VC3XDPKERbnSwEAAwIAA3gAAzsE" },
  { name: "زره چرمی", id: "AgACAgQAAxkBAAEqGkBqIWRN9DraVQKb5bDX8yIg_IaTbAACKQ5rG9cu8VDoUz7bhZsp9wEAAwIAA3kAAzsE" },
  { name: "زره طلایی", id: "AgACAgQAAxkBAAEqGkFqIWRNzAfpbRhmjJnnGUWqERJrgAACKw5rG9cu8VBY1M7y2fKW-QEAAwIAA3kAAzsE" },
  { name: "زره آهنی", id: "AgACAgQAAxkBAAEqGkJqIWRNIoY-Ihl8sf3ZnneFW-mwowACLA5rG9cu8VACPZe64yeL3gEAAwIAA3kAAzsE" },
  { name: "زره اژدها", id: "AgACAgQAAxkBAAEqGkNqIWRNoq5PaOKp1XA5gPQ6wD-AlQACLQ5rG9cu8VBBpjFoKUlNagEAAwIAA3kAAzsE" },
  // غذاها
  { name: "نان", id: "AgACAgQAAxkBAAEqGkRqIWRNjk3PYW8Vr5EOMywo7LBtNgACLg5rG9cu8VC4UQ7khx5hZgEAAwIAA3gAAzsE" },
  { name: "کباب", id: "AgACAgQAAxkBAAEqGkVqIWRNKQcNmYKZkZW28-BjraaBbgACLw5rG9cu8VCTGxXMyECjdAEAAwIAA3gAAzsE" },
  { name: "جوجه کباب", id: "AgACAgQAAxkBAAEqGkdqIWRNMSbB27hetvqG0GfnBVed9wACMQ5rG9cu8VBH9qkPer-ATAEAAwIAA3gAAzsE" },
  { name: "قیمه", id: "AgACAgQAAxkBAAEqGkhqIWRN9zfTFZb34UK19qWq3230qgACMg5rG9cu8VCanlTgXyHErQEAAwIAA3kAAzsE" },
  { name: "آش", id: "AgACAgQAAxkBAAEqGklqIWRNw-LVbRlGIkrISG9f5pfPKQACMw5rG9cu8VCzAoPV2QnjtwEAAwIAA3gAAzsE" },
  // محیط
  { name: "جنگل", id: "AgACAgQAAxkBAAEqGthqIWVzMwfaxnI-B5rOjcwXbjIQuQACWw5rG9cu8VCdHd1QnlSBAAEBAAMCAAN5AAM7BA" },
  { name: "کوهستان", id: "AgACAgQAAxkBAAEqGtlqIWVzEDs2E_WhvxarX5gOKBdDagACXA5rG9cu8VCBMGOJX1_gUQEAAwIAA3kAAzsE" },
  { name: "معدنگاه", id: "AgACAgQAAxkBAAEqGtpqIWVznlccktins9ewC4TMO_5_JwACXQ5rG9cu8VAGiO__vqKaNQEAAwIAA3kAAzsE" },
  { name: "کویر", id: "AgACAgQAAxkBAAEqGuBqIWWBKUKmhBTxIogigcacwBAcqAACWg5rG9cu8VDH39IGzx7XDgEAAwIAA3gAAzsE" },
  { name: "بازار", id: "AgACAgQAAxkBAAEqGtxqIWVz1IB6e_bilpzNtktK9IEntgACYQ5rG9cu8VAVr24v9PDF5QEAAwIAA3gAAzsE" },
];

// گیف‌ها جدا
const allGifs = [
  { name: "گیف آماده جنگ", id: "CgACAgQAAxkBAAEqETVqIGusPLj-Qq0nd73vMUkiRiwY0wACTwYAArMmNVBb8-ES6JPGHzsE" },
  { name: "گیف کوروش بزرگ", id: "CgACAgQAAxkBAAEqEUpqIG2RakeSSSNpKkC-3UfiGpoEYwACGQMAAt5HJVNbjZO7dqLofTsE" },
  { name: "گیف موشک (پیروزی)", id: "CgACAgQAAxkBAAEqDpBqIDYupm_2tWylUzv4N0qgCCCqLwACmSsAAts6AAFRSXGwyWxF4MU7BA" },
  { name: "گیف انفجار هسته‌ای", id: "CgACAgQAAxkBAAEqEo9qIIXeZFa4e4pPIR67chxvh9D2XwACbwMAAlhtBFOyrDZljZRTyjsE" },
  { name: "گیف گلادیاتور نبرد", id: "CgACAgQAAxkBAAEqGVBqIV2gqODeVyqJ0O_R9cB9o7VgGgAC5AcAAiE7PVC7dRhONkLo3zsE" },
  { name: "گیف گلادیاتور پیروزی", id: "CgACAgQAAxkBAAEqGVFqIV2gfrxazteWVHN08BObPyakpgACAwMAAsmSjFPUScicY8iOhzsE" },
];

let photoIndex = 0;
let gifIndex = 0;

// تست عکس‌ها
bot.command("test_photo", async (ctx) => {
  photoIndex = 0;
  await showPhoto(ctx);
});

async function showPhoto(ctx) {
  if (photoIndex >= allPhotos.length) {
    await ctx.reply("✅ همه عکس‌ها تموم شد. حالا /test_gif رو بزن.");
    return;
  }
  const photo = allPhotos[photoIndex];
  try {
    await ctx.replyWithPhoto(photo.id, {
      caption: `📸 عکس ${photoIndex + 1}/${allPhotos.length}\nنام: ${photo.name}`,
      reply_markup: new InlineKeyboard()
        .text("▶️ بعدی", "next_photo")
        .text("⏮ ۱۰ تا عقب", "prev10_photo")
        .text("⏭ ۱۰ تا جلو", "next10_photo")
        .row()
        .text("⏹ پایان", "stop_test")
    });
  } catch (e) {
    await ctx.reply(`❌ خطا در عکس ${photoIndex + 1}: ${photo.name}\n🆔: ${photo.id}`);
  }
}

// تست گیف‌ها
bot.command("test_gif", async (ctx) => {
  gifIndex = 0;
  await showGif(ctx);
});

async function showGif(ctx) {
  if (gifIndex >= allGifs.length) {
    await ctx.reply("✅ همه گیف‌ها تموم شد.");
    return;
  }
  const gif = allGifs[gifIndex];
  try {
    await ctx.replyWithAnimation(gif.id, {
      caption: `🎬 گیف ${gifIndex + 1}/${allGifs.length}\nنام: ${gif.name}`,
      reply_markup: new InlineKeyboard()
        .text("▶️ بعدی", "next_gif")
        .text("⏹ پایان", "stop_test")
    });
  } catch (e) {
    await ctx.reply(`❌ خطا در گیف ${gifIndex + 1}: ${gif.name}\n🆔: ${gif.id}`);
  }
}

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery().catch(() => {});
  
  if (data === "next_photo") {
    photoIndex++;
    await showPhoto(ctx);
  }
  if (data === "prev10_photo") {
    photoIndex = Math.max(0, photoIndex - 10);
    await showPhoto(ctx);
  }
  if (data === "next10_photo") {
    photoIndex = Math.min(allPhotos.length - 1, photoIndex + 10);
    await showPhoto(ctx);
  }
  if (data === "next_gif") {
    gifIndex++;
    await showGif(ctx);
  }
  if (data === "stop_test") {
    await ctx.reply("⏹ تست متوقف شد.");
  }
});

bot.command("start", async (ctx) => {
  await ctx.reply(
    "🔍 ربات تست عکس و گیف\n\n" +
    "/test_photo - تست همه عکس‌ها\n" +
    "/test_gif - تست همه گیف‌ها\n" +
    `/total - تعداد کل\n\n` +
    `📸 تعداد عکس: ${allPhotos.length}\n` +
    `🎬 تعداد گیف: ${allGifs.length}`
  );
});

bot.command("total", async (ctx) => {
  await ctx.reply(`📊 آمار:\n\n📸 عکس: ${allPhotos.length} عدد\n🎬 گیف: ${allGifs.length} عدد\n📦 مجموع: ${allPhotos.length + allGifs.length} فایل`);
});

bot.catch((err) => console.error("Bot error:", err));

bot.start();
console.log("🚀 ربات تست عکس روشن شد");