import express from 'express';

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_PATH = process.env.SECRET_PATH || 'my-secret-life-bot';
const PORT = process.env.PORT || 3000;
const ADMIN_ID = '5576592239';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is missing!');
  process.exit(1);
}

// In-memory storage
const users = new Map();

function getUser(chatId) {
  if (!users.has(chatId)) {
    users.set(chatId, {
      chatId,
      name: '',
      age: null,
      gender: null,
      province: null,
      stage: 'start',
      createdAt: Date.now(),
      xp: 0,
      level: 1,
      money: 200,
      energy: 100,
      health: 100,
      happiness: 100,
      hunger: 100,
      thirst: 100,
      job: null,
      inventory: [],
      lastActionAt: 0,
      lastWorkAt: 0,
      lastRestAt: 0,
      lastExploreAt: 0,
    });
  }
  return users.get(chatId);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function statusText(u) {
  return [
    `⭐ سطح: ${u.level}`,
    `✨ XP: ${u.xp}`,
    `💰 پول: ${u.money}`,
    `⚡ انرژی: ${u.energy}`,
    `❤️ سلامتی: ${u.health}`,
    `😊 شادی: ${u.happiness}`,
    `🍗 گرسنگی: ${u.hunger}`,
    `💧 تشنگی: ${u.thirst}`,
    u.job ? `💼 شغل: ${u.job.name}` : '💼 شغل: ندارد',
  ].join('\n');
}

function mainMenu() {
  return {
    keyboard: [
      [{ text: '👤 پروفایل' }, { text: '💼 کار' }],
      [{ text: '🛌 استراحت' }, { text: '🧭 اکتشاف' }],
      [{ text: '🎒 موجودی' }, { text: '🏪 فروشگاه' }],
      [{ text: 'ℹ️ وضعیت' }, { text: '🔄 منوی اصلی' }],
    ],
    resize_keyboard: true,
  };
}

function backMenu() {
  return {
    keyboard: [[{ text: '🔙 بازگشت به منو' }]],
    resize_keyboard: true,
  };
}

const jobs = [
  { name: 'پیک موتوری', income: [20, 45], energy: [10, 18] },
  { name: 'فروشنده', income: [25, 55], energy: [8, 15] },
  { name: 'برنامه‌نویس', income: [50, 120], energy: [15, 25] },
  { name: 'نویسنده', income: [35, 80], energy: [10, 18] },
  { name: 'طراح گرافیک', income: [40, 95], energy: [12, 20] },
  { name: 'معلم', income: [30, 70], energy: [10, 16] },
  { name: 'راننده تاکسی', income: [25, 65], energy: [10, 18] },
  { name: 'کارگر', income: [20, 50], energy: [12, 20] },
  { name: 'پزشک', income: [60, 140], energy: [18, 28] },
  { name: 'پرستار', income: [45, 100], energy: [15, 24] },
  { name: 'نگهبان', income: [25, 60], energy: [8, 16] },
  { name: 'آشپز', income: [30, 75], energy: [10, 18] },
  { name: 'مکانیک', income: [35, 85], energy: [12, 20] },
  { name: 'عکاس', income: [40, 90], energy: [8, 14] },
  { name: 'فریلنسر', income: [20, 160], energy: [14, 28] },
  { name: 'نوازنده', income: [15, 100], energy: [10, 18] },
  { name: 'ورزشکار', income: [25, 110], energy: [16, 30] },
  { name: 'کشاورز', income: [20, 55], energy: [12, 20] },
  { name: 'سازنده محتوا', income: [30, 130], energy: [12, 22] },
  { name: 'فروشنده آنلاین', income: [20, 140], energy: [8, 18] },
];

const restActions = [
  { name: 'خواب کوتاه', energy: [15, 25], health: [2, 5], happiness: [0, 3] },
  { name: 'خواب عمیق', energy: [30, 45], health: [5, 10], happiness: [-2, 2] },
  { name: 'چرت عصرگاهی', energy: [10, 18], health: [1, 3], happiness: [1, 4] },
  { name: 'حمام گرم', energy: [8, 14], health: [2, 4], happiness: [4, 8] },
  { name: 'پیاده‌روی آرام', energy: [10, 16], health: [3, 6], happiness: [3, 7] },
  { name: 'موسیقی گوش دادن', energy: [6, 12], health: [0, 2], happiness: [6, 12] },
  { name: 'مدیتیشن', energy: [12, 20], health: [4, 8], happiness: [2, 5] },
  { name: 'تماشای فیلم', energy: [8, 14], health: [0, 2], happiness: [8, 14] },
  { name: 'گپ با دوست', energy: [6, 10], health: [1, 2], happiness: [5, 10] },
  { name: 'استراحت در خانه', energy: [18, 28], health: [3, 6], happiness: [2, 5] },
];

const exploreEvents = [
  () => ({ text: 'در خیابان یک اسکناس پیدا کردی!', money: rand(20, 80), xp: rand(5, 12), energy: -rand(5, 10) }),
  () => ({ text: 'یک سکه‌ی قدیمی پیدا کردی و فروختی.', money: rand(30, 100), xp: rand(6, 14), energy: -rand(5, 12) }),
  () => ({ text: 'یک فروش ویژه دیدی و کمی پول ذخیره کردی.', money: rand(10, 40), xp: rand(4, 8), energy: -rand(4, 8) }),
  () => ({ text: 'یک حادثه‌ی کوچک رخ داد و کمی آسیب دیدی.', money: -rand(10, 35), health: -rand(5, 12), energy: -rand(8, 15) }),
  () => ({ text: 'یک پلیس جریمه‌ات کرد!', money: -rand(20, 70), xp: rand(0, 4), energy: -rand(3, 8) }),
  () => ({ text: 'یک کافه پیدا کردی و کمی استراحت کردی.', money: -rand(5, 20), energy: rand(10, 20), happiness: rand(4, 10) }),
  () => ({ text: 'یک آیتم کاربردی پیدا کردی.', item: pick(['باند پزشکی', 'نوشیدنی انرژی‌زا', 'نان', 'آب معدنی']), xp: rand(6, 12), energy: -rand(5, 10) }),
  () => ({ text: 'یک غریبه به تو کمک کرد و حال خوب گرفتی.', happiness: rand(6, 14), xp: rand(4, 10) }),
  () => ({ text: 'چیزی پیدا نکردی اما تجربه کسب کردی.', xp: rand(8, 16), energy: -rand(6, 12) }),
  () => ({ text: 'یک مسیر مخفی پیدا کردی و کمی پول و XP گرفتی.', money: rand(15, 60), xp: rand(8, 18), energy: -rand(6, 12) }),
];

async function tg(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function safeText(s) {
  return String(s || '').replace(/[<>&]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m]));
}

async function sendMessage(chatId, text, reply_markup = mainMenu(), parse_mode = undefined) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup,
    parse_mode,
  });
}

async function answerCallbackQuery(id, text = '') {
  return tg('answerCallbackQuery', { callback_query_id: id, text });
}

function levelUp(user) {
  const need = user.level * 100;
  if (user.xp >= need) {
    user.level += 1;
    user.xp -= need;
    user.money += user.level * 50;
    user.health = clamp(user.health + 10, 0, 100);
    user.happiness = clamp(user.happiness + 10, 0, 100);
    return true;
  }
  return false;
}

function reward(user, amount) {
  user.money += amount;
}

function punishment(user, amount) {
  user.money = Math.max(0, user.money - amount);
}

function ensureNeeds(user) {
  user.energy = clamp(user.energy, 0, 100);
  user.health = clamp(user.health, 0, 100);
  user.happiness = clamp(user.happiness, 0, 100);
  user.hunger = clamp(user.hunger, 0, 100);
  user.thirst = clamp(user.thirst, 0, 100);
}

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.post(`/webhook/${SECRET_PATH}`, async (req, res) => {
  try {
    const { message, callback_query } = req.body || {};

    if (message) {
      const chatId = message.chat.id.toString();
      const user = getUser(chatId);
      const text = (message.text || '').trim();

      if (text === '/start') {
        user.stage = 'name';
        await sendMessage(chatId, 'سلام! 👋\nاسم شخصیتت رو وارد کن:', backMenu());
        return res.sendStatus(200);
      }

      if (text === '🔙 بازگشت به منو' || text === '🔄 منوی اصلی') {
        user.stage = 'main';
        await sendMessage(chatId, 'به منوی اصلی برگشتی ✅', mainMenu());
        return res.sendStatus(200);
      }

      if (user.stage === 'name') {
        user.name = text;
        user.stage = 'age';
        await sendMessage(chatId, 'سن شخصیتت را وارد کن:', backMenu());
        return res.sendStatus(200);
      }

      if (user.stage === 'age') {
        const age = parseInt(text, 10);
        if (Number.isNaN(age) || age < 10 || age > 100) {
          await sendMessage(chatId, 'سن نامعتبره. یک عدد بین 10 تا 100 بفرست.', backMenu());
          return res.sendStatus(200);
        }
        user.age = age;
        user.stage = 'gender';
        await sendMessage(chatId, 'جنسیت را وارد کن: پسر / دختر', backMenu());
        return res.sendStatus(200);
      }

      if (user.stage === 'gender') {
        user.gender = text;
        user.stage = 'province';
        await sendMessage(chatId, 'استانت را وارد کن:', backMenu());
        return res.sendStatus(200);
      }

      if (user.stage === 'province') {
        user.province = text;
        user.stage = 'main';
        await sendMessage(
          chatId,
          `🎉 شخصیتت ساخته شد!\n\nنام: ${safeText(user.name)}\nسن: ${user.age}\nجنسیت: ${safeText(user.gender)}\nاستان: ${safeText(user.province)}\n\n${statusText(user)}`,
          mainMenu()
        );
        return res.sendStatus(200);
      }

      if (text === '👤 پروفایل') {
        const profile = `👤 پروفایل\n\nنام: ${safeText(user.name || 'نامشخص')}\nسن: ${user.age || '-'}\nجنسیت: ${safeText(user.gender || '-')}\nاستان: ${safeText(user.province || '-')}\n\n${statusText(user)}`;
        await sendMessage(chatId, profile, mainMenu());
        return res.sendStatus(200);
      }

      if (text === 'ℹ️ وضعیت') {
        await sendMessage(chatId, `📊 وضعیت فعلی\n\n${statusText(user)}`, mainMenu());
        return res.sendStatus(200);
      }

      if (text === '🎒 موجودی') {
        const items = user.inventory.length ? user.inventory.map((x, i) => `${i + 1}. ${x}`).join('\n') : 'خالی';
        await sendMessage(chatId, `🎒 موجودی:\n\n${items}`, mainMenu());
        return res.sendStatus(200);
      }

      if (text === '💼 کار') {
        if (user.energy < 10) {
          await sendMessage(chatId, 'انرژی کافی نداری. اول استراحت کن.', mainMenu());
          return res.sendStatus(200);
        }
        const job = pick(jobs);
        const income = rand(job.income[0], job.income[1]);
        const cost = rand(job.energy[0], job.energy[1]);

        user.job = job;
        reward(user, income);
        user.energy = clamp(user.energy - cost, 0, 100);
        user.xp += rand(8, 18);
        user.hunger = clamp(user.hunger - rand(3, 8), 0, 100);
        user.thirst = clamp(user.thirst - rand(4, 10), 0, 100);

        const leveled = levelUp(user);
        ensureNeeds(user);

        await sendMessage(
          chatId,
          `💼 ${job.name}\n\n💰 درآمد: +${income}\n⚡ مصرف انرژی: -${cost}\n${leveled ? '🎉 یک لول آپ کردی!\n\n' : ''}${statusText(user)}`,
          mainMenu()
        );
        return res.sendStatus(200);
      }

      if (text === '🛌 استراحت') {
        const action = pick(restActions);
        user.energy = clamp(user.energy + rand(action.energy[0], action.energy[1]), 0, 100);
        user.health = clamp(user.health + rand(action.health[0], action.health[1]), 0, 100);
        user.happiness = clamp(user.happiness + rand(action.happiness[0], action.happiness[1]), 0, 100);
        user.hunger = clamp(user.hunger - rand(2, 6), 0, 100);
        user.thirst = clamp(user.thirst - rand(1, 4), 0, 100);
        user.xp += rand(3, 8);

        const leveled = levelUp(user);
        ensureNeeds(user);

        await sendMessage(
          chatId,
          `🛌 ${action.name}\n\n${leveled ? '🎉 یک لول آپ کردی!\n\n' : ''}${statusText(user)}`,
          mainMenu()
        );
        return res.sendStatus(200);
      }

      if (text === '🧭 اکتشاف') {
        if (user.energy < 8) {
          await sendMessage(chatId, 'برای اکتشاف انرژی کافی نداری.', mainMenu());
          return res.sendStatus(200);
        }

        const event = pick(exploreEvents)();
        let result = `🧭 ${event.text}\n\n`;

        if (event.money) {
          if (event.money > 0) {
            reward(user, event.money);
            result += `💰 پول: +${event.money}\n`;
          } else {
            punishment(user, Math.abs(event.money));
            result += `💰 پول: ${event.money}\n`;
          }
        }

        if (event.health) {
          user.health = clamp(user.health + event.health, 0, 100);
          result += `❤️ سلامتی: ${event.health > 0 ? '+' : ''}${event.health}\n`;
        }

        if (event.happiness) {
          user.happiness = clamp(user.happiness + event.happiness, 0, 100);
          result += `😊 شادی: ${event.happiness > 0 ? '+' : ''}${event.happiness}\n`;
        }

        if (event.energy) {
          user.energy = clamp(user.energy + event.energy, 0, 100);
          result += `⚡ انرژی: ${event.energy > 0 ? '+' : ''}${event.energy}\n`;
        }

        if (event.item) {
          user.inventory.push(event.item);
          result += `🎁 آیتم: ${event.item}\n`;
        }

        user.xp += rand(6, 16);
        const leveled = levelUp(user);
        ensureNeeds(user);

        result += `\n${leveled ? '🎉 یک لول آپ کردی!\n\n' : ''}${statusText(user)}`;

        await sendMessage(chatId, result, mainMenu());
        return res.sendStatus(200);
      }

      if (text === '🏪 فروشگاه') {
        await sendMessage(
          chatId,
          `🏪 فروشگاه\n\nفعلاً فروشگاه کامل نشده، ولی می‌تونیم بعداً آیتم‌های زیر را اضافه کنیم:\n- آب معدنی\n- غذا\n- دارو\n- انرژی‌زا`,
          mainMenu()
        );
        return res.sendStatus(200);
      }

      if (chatId === ADMIN_ID && text === '/users') {
        await sendMessage(chatId, `تعداد کاربران در حافظه: ${users.size}`, mainMenu());
        return res.sendStatus(200);
      }

      await sendMessage(chatId, 'دستور نامعتبره. از منو استفاده کن.', mainMenu());
      return res.sendStatus(200);
    }

    if (callback_query) {
      await answerCallbackQuery(callback_query.id, 'انجام شد');
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    return res.sendStatus(200);
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const webhookUrl = process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/webhook/${SECRET_PATH}`
      : process.env.PUBLIC_URL
        ? `${process.env.PUBLIC_URL}/webhook/${SECRET_PATH}`
        : null;

    if (webhookUrl) {
      const result = await tg('setWebhook', {
        url: webhookUrl,
        drop_pending_updates: true,
      });
      console.log('Webhook set:', result);
    } else {
      console.log('No PUBLIC_URL / RENDER_EXTERNAL_URL found, webhook not auto-set');
    }
  } catch (err) {
    console.error('Failed to set webhook:', err);
  }
});
