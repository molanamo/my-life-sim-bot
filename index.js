

const { Telegraf, Markup, Scenes, session } = require('telegraf');
const fs = require('fs');
const path = require('path');

// ---- Bot Configuration ----
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN'; // حتماً توکن خودت رو بذار
const ADMIN_ID = 5576592239; // آی‌دی ادمین
const DATA_FILE = path.join(__dirname, 'data.json'); // فایل ذخیره اطلاعات

// ---- Translation & Configuration ----
const GAME_CONFIG = {
    XP_PER_LEVEL: 100,
    STARTING_MONEY: 200,
    STARTING_XP: 0,
    STARTING_LEVEL: 1,
    STARTING_STATS: { power: 5, faith: 5, speed: 5, intelligence: 5 },
    STARTING_INVENTORY: {},
    STARTING_RESOURCES: {}, // برای منابع مثل چوب، سنگ و ...
    STARTING_HP: 100,
    MAX_HP: 100,
    STARTING_HUNGER: 100,
    MAX_HUNGER: 100,
    STARTING_THIRST: 100,
    MAX_THIRST: 100,
    STARTING_TITLE: 'تازه‌کار',
};

const TRANSLATIONS = {
    // Player Stats
    power: '💪 قدرت',
    faith: '✨ ایمان',
    speed: '⚡ سرعت',
    intelligence: '🧠 هوش',

    // Inventory Categories (Placeholder)
    food: '🍞 غذا',
    water: '💧 آب',
    med: '🩹 دارو',
    res: '🎒 منابع',
    weapons: '⚔️ سلاح',
    armors: '🛡️ زره',
    misc: '✨ متفرقه',

    // Shop Sections
    shop_weapons: '🛒 فروشگاه تسلیحات',
    shop_supplies: '🛒 فروشگاه ملزومات',

    // Titles (Placeholder)
    level_titles: [
        { level: 1, title: 'تازه‌کار' },
        { level: 5, title: 'ماجراجو' },
        { level: 10, title: 'جنگجو' },
        // ... Add more titles up to level 20 and beyond
    ],
};

// ---- Bot Initialization ----
if (BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.error('FATAL ERROR: BOT_TOKEN is missing. Please set the BOT_TOKEN environment variable or replace the placeholder.');
    // process.exit(1); // Uncomment to stop execution if token is missing
}

const bot = new Telegraf(BOT_TOKEN);

// ---- Data Management ----
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading data file:', error);
            return { users: {}, global: {} }; // Return default structure on error
        }
    }
    return { users: {}, global: {} }; // Default structure if file doesn't exist
}

function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving data file:', error);
    }
}

let botData = loadData();

// ---- Utility Functions ----
function getUser(userId) {
    if (!botData.users[userId]) {
        // Initialize new user
        botData.users[userId] = {
            id: userId,
            username: '', // Will be filled on first interaction
            firstName: '', // Will be filled on first interaction
            level: GAME_CONFIG.STARTING_LEVEL,
            xp: GAME_CONFIG.STARTING_XP,
            maxXP: GAME_CONFIG.XP_PER_LEVEL,
            money: GAME_CONFIG.STARTING_MONEY,
            stats: { ...GAME_CONFIG.STARTING_STATS },
            inventory: { ...GAME_CONFIG.STARTING_INVENTORY },
            resources: { ...GAME_CONFIG.STARTING_RESOURCES },
            hp: GAME_CONFIG.STARTING_HP,
            maxHp: GAME_CONFIG.MAX_HP,
            hunger: GAME_CONFIG.STARTING_HUNGER,
            maxHunger: GAME_CONFIG.MAX_HUNGER,
            thirst: GAME_CONFIG.STARTING_THIRST,
            maxThirst: GAME_CONFIG.MAX_THIRST,
            title: GAME_CONFIG.STARTING_TITLE,
            equipped: { weapon: null, armor: null }, // For equipped items
            // Add other game states like missions, battle status, etc. later
        };
        saveData(botData); // Save the newly created user
    }
    return botData.users[userId];
}

function getTitleByLevel(level) {
    const titleEntry = TRANSLATIONS.level_titles.slice().reverse().find(t => level >= t.level);
    return titleEntry ? titleEntry.title : 'موجود ناشناخته'; // Fallback title
}

function checkLevelUp(user) {
    while (user.xp >= user.maxXP && user.level < 99) { // Limit max level if needed
        user.level++;
        user.xp -= user.maxXP;
        user.maxXP = Math.floor(user.maxXP * 1.2); // Increase XP needed for next level (example scaling)
        user.money += Math.floor(user.maxXP * 0.1); // Bonus money on level up

        // Stat increase on level up (example)
        user.stats.power += 1;
        user.stats.faith += 1;
        user.stats.speed += 1;
        user.stats.intelligence += 1;
        user.maxHp += 5; // Increase max HP
        user.hp = user.maxHp; // Heal to full HP on level up

        user.title = getTitleByLevel(user.level);
        saveData(botData); // Save after level up
        // Send a notification
        // bot.telegram.sendMessage(user.id, `🎉 تبریک! به سطح ${user.level} ارتقا پیدا کردید و لقب «${user.title}» را دریافت کردید!`);
    }
}

// ---- Menu Definitions ----

// Main Menu Keyboard (Reply Keyboard)
const mainMenuKeyboard = Markup.keyboard([
    ['👤 پروفایل', '🎒 اینونتوری'],
    ['🛒 فروشگاه', '⚔️ نبرد'],
    ['📜 ماموریت', '🏥 بیمارستان'] // Added Hospital for future use
]).resize();

// Function to generate Inline Inventory Menu
function generateInventoryMenu(user) {
    const inventory = user.inventory || {};
    const buttons = [];

    // Add categories based on TRANSLATIONS and actual items in inventory
    // Example: Food items
    const foodItems = Object.keys(inventory).filter(item => ['apple', 'bread', 'meat'].includes(item)); // Replace with actual item keys
    if (foodItems.length > 0) {
        buttons.push([Markup.button.callback(`🍞 ${TRANSLATIONS.food}`, 'inv_cat_food')]);
    }
    // Example: Water items
    const waterItems = Object.keys(inventory).filter(item => ['water_bottle', 'soda'].includes(item)); // Replace with actual item keys
     if (waterItems.length > 0) {
        buttons.push([Markup.button.callback(`💧 ${TRANSLATIONS.water}`, 'inv_cat_water')]);
    }
    // Add more categories like Med, Res, Weapons, Armors

    // Add a generic "Resources" category if any exist
    const resourceItems = Object.keys(inventory).filter(item => ['wood', 'stone', 'iron'].includes(item)); // Replace with actual item keys
    if (resourceItems.length > 0) {
        buttons.push([Markup.button.callback(`🎒 ${TRANSLATIONS.res}`, 'inv_cat_res')]);
    }

    // Back button
    buttons.push([Markup.button.callback('🔙 بازگشت به منوی اصلی', 'main_menu')]);

    return Markup.inlineKeyboard(buttons);
}

// Function to display items in a specific inventory category
function displayInventoryCategory(user, categoryKey) {
    const inventory = user.inventory || {};
    let categoryText = `📂 بخش ${TRANSLATIONS[categoryKey] || categoryKey}:\n\n`;
    let hasItems = false;

    // Placeholder: Replace with actual logic to check items in the category
    // This requires defining your items and their categories elsewhere
    const itemsInCategory = {
        food: ['apple', 'bread', 'meat'], // Example items
        water: ['water_bottle', 'soda'],
        res: ['wood', 'stone', 'iron'],
        // Add other categories
    };

    const relevantItems = itemsInCategory[categoryKey] || [];

    relevantItems.forEach(itemKey => {
        if (inventory[itemKey] && inventory[itemKey] > 0) {
            const itemName = TRANSLATIONS[itemKey] || itemKey; // Use translated name
            categoryText += `  - ${itemName}: ${inventory[itemKey]}\n`;
            hasItems = true;
        }
    });

    if (!hasItems) {
        categoryText = `در بخش ${TRANSLATIONS[categoryKey] || categoryKey} آیتمی ندارید.`;
    }

    // Return the text and the inventory menu
    return { text: categoryText, menu: generateInventoryMenu(user) };
}


// ---- Bot Command Handlers ----

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const user = getUser(userId); // Ensure user is loaded/created
    user.firstName = ctx.from.first_name;
    user.username = ctx.from.username || '';
    checkLevelUp(user); // Check for level up on start (in case data was loaded)

    await ctx.reply(`به بازی بقا خوش آمدی، ${user.firstName} (${user.title})!`, mainMenuKeyboard);
    saveData(botData); // Save any changes (like username/firstName update)
});

bot.command('menu', async (ctx) => {
    const userId = ctx.from.id;
    const user = getUser(userId);
    await ctx.reply('منوی اصلی:', mainMenuKeyboard);
});

bot.command('profile', async (ctx) => {
    const userId = ctx.from.id;
    const user = getUser(userId);

    let statsText = `👤 **${user.firstName} (${user.title})**\n\n`;
    statsText += `✨ سطح: ${user.level} (${user.xp}/${user.maxXP} XP)\n`;
    statsText += `💰 پول: ${user.money}\n`;
    statsText += `❤️ سلامتی: ${user.hp}/${user.maxHp}\n`;
    statsText += `🍖 گرسنگی: ${user.hunger}/${user.maxHunger}\n`;
    statsText += `💧 تشنگی: ${user.thirst}/${user.maxThirst}\n\n`;
    statsText += `**آمار:**\n`;
    statsText += `${TRANSLATIONS.power}: ${user.stats.power}\n`;
    statsText += `${TRANSLATIONS.faith}: ${user.stats.faith}\n`;
    statsText += `${TRANSLATIONS.speed}: ${user.stats.speed}\n`;
    statsText += `${TRANSLATIONS.intelligence}: ${user.stats.intelligence}\n`;

    // Add equipped items info
    const weaponName = user.equipped.weapon ? (TRANSLATIONS[user.equipped.weapon] || user.equipped.weapon) : 'هیچ';
    const armorName = user.equipped.armor ? (TRANSLATIONS[user.equipped.armor] || user.equipped.armor) : 'هیچ';
    statsText += `\n⚔️ تجهیز شده:\n  - سلاح: ${weaponName}\n  - زره: ${armorName}\n`;

    await ctx.reply(statsText, { parse_mode: 'Markdown' });
});

// ---- Main Menu Button Handlers ----
bot.hears('👤 پروفایل', async (ctx) => {
    ctx.command('profile'); // Reuse the profile command logic
});

bot.hears('🎒 اینونتوری', async (ctx) => {
    const userId = ctx.from.id;
    const user = getUser(userId);
    const menu = generateInventoryMenu(user);
    await ctx.reply('🧰 موجودی شما:', menu);
});

bot.hears('🛒 فروشگاه', async (ctx) => {
    const shopMenu = Markup.inlineKeyboard([
        [Markup.button.callback(TRANSLATIONS.shop_weapons, 'shop_section_weapons')],
        [Markup.button.callback(TRANSLATIONS.shop_supplies, 'shop_section_supplies')],
        [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'main_menu')]
    ]);
    await ctx.reply('به فروشگاه خوش آمدید! کدام بخش را می‌خواهید ببینید؟', shopMenu);
});

bot.hears('⚔️ نبرد', async (ctx) => {
    await ctx.reply('نبرد هنوز فعال نیست. به زودی اضافه خواهد شد!');
    // Placeholder for battle system
});

bot.hears('📜 ماموریت', async (ctx) => {
    await ctx.reply('ماموریت‌ها هنوز فعال نیستند. به زودی اضافه خواهند شد!');
    // Placeholder for mission system
});

bot.hears('🏥 بیمارستان', async (ctx) => {
    await ctx.reply('بیمارستان هنوز فعال نیست. به زودی اضافه خواهد شد!');
    // Placeholder for hospital system
});

// ---- Inline Menu Action Handlers ----

bot.action('main_menu', async (ctx) => {
    await ctx.editMessageText('🏠 به منوی اصلی برگشتید.', mainMenuKeyboard);
});

// Shop Section Handlers
bot.action('shop_section_weapons', async (ctx) => {
    // Placeholder: Display weapons shop items
    await ctx.editMessageText('🗡️ **فروشگاه تسلیحات**\n\n(لیست سلاح‌ها و زره‌ها به زودی اینجا قرار می‌گیرد)', Markup.inlineKeyboard([
        [Markup.button.callback('🔙 بازگشت به فروشگاه', 'shop_main')] // Need to define shop_main action
    ]));
});

bot.action('shop_section_supplies', async (ctx) => {
     // Placeholder: Display supplies shop items (food, medicine)
     await ctx.editMessageText('🍎 **فروشگاه ملزومات**\n\n(لیست غذاها و داروها به زودی اینجا قرار می‌گیرد)', Markup.inlineKeyboard([
        [Markup.button.callback('🔙 بازگشت به فروشگاه', 'shop_main')] // Need to define shop_main action
    ]));
});

// Need to define the 'shop_main' action if you have a main shop menu after selection
bot.action('shop_main', async (ctx) => {
     const shopMenu = Markup.inlineKeyboard([
        [Markup.button.callback(TRANSLATIONS.shop_weapons, 'shop_section_weapons')],
        [Markup.button.callback(TRANSLATIONS.shop_supplies, 'shop_section_supplies')],
        [Markup.button.callback('🔙 بازگشت به منوی اصلی', 'main_menu')]
    ]);
    await ctx.editMessageText('به فروشگاه خوش آمدید! کدام بخش را می‌خواهید ببینید؟', shopMenu);
});

// Inventory Category Handlers
bot.action(/^inv_cat_(\w+)$/, async (ctx) => {
    const categoryKey = ctx.match[1];
    const userId = ctx.from.id;
    const user = getUser(userId);

    const { text, menu } = displayInventoryCategory(user, categoryKey);
    await ctx.editMessageText(text, menu);
});

// ---- Admin Commands (Example) ----
bot.command('givemoney', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.reply('دسترسی غیرمجاز!');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('/givemoney <userId> <amount>');
    const targetUserId = parseInt(args[1]);
    const amount = parseInt(args[2]);
    if (isNaN(targetUserId) || isNaN(amount)) return ctx.reply('ورودی نامعتبر.');

    const targetUser = getUser(targetUserId);
    targetUser.money += amount;
    checkLevelUp(targetUser); // Check level up after receiving money
    saveData(botData);
    ctx.reply(`موفقیت! ${amount} پول به کاربر ${targetUserId} اضافه شد.`);
});

bot.command('givexp', async (ctx) => {
     if (ctx.from.id !== ADMIN_ID) return ctx.reply('دسترسی غیرمجاز!');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('/givexp <userId> <amount>');
    const targetUserId = parseInt(args[1]);
    const amount = parseInt(args[2]);
    if (isNaN(targetUserId) || isNaN(amount)) return ctx.reply('ورودی نامعتبر.');

    const targetUser = getUser(targetUserId);
    targetUser.xp += amount;
    checkLevelUp(targetUser); // Crucial to check level up
    saveData(botData);
    ctx.reply(`موفقیت! ${amount} XP به کاربر ${targetUserId} اضافه شد.`);
     // Optionally notify the user
    try {
        await bot.telegram.sendMessage(targetUserId, `شما ${amount} XP دریافت کردید.`);
    } catch (e) {
        console.error(`Failed to send XP notification to ${targetUserId}:`, e.message);
    }
});

bot.command('setlevel', async (ctx) => {
     if (ctx.from.id !== ADMIN_ID) return ctx.reply('دسترسی غیرمجاز!');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('/setlevel <userId> <level>');
    const targetUserId = parseInt(args[1]);
    let targetLevel = parseInt(args[2]);
    if (isNaN(targetUserId) || isNaN(targetLevel)) return ctx.reply('ورودی نامعتبر.');

    const targetUser = getUser(targetUserId);
    // Clamp level to a reasonable range if desired
    targetLevel = Math.max(1, targetLevel); // Ensure level is at least 1
    
    // To set a specific level, we need to recalculate XP needed and potentially grant rewards.
    // This is complex. For now, let's simplify: just set the level and reset XP/stats based on it.
    // A proper implementation would sum XP gains/losses or recalculate from scratch.
    targetUser.level = targetLevel;
    targetUser.xp = 0; // Reset XP for simplicity
    targetUser.maxXP = Math.floor(GAME_CONFIG.XP_PER_LEVEL * Math.pow(1.2, targetLevel - 1)); // Recalculate maxXP

    // Reset stats and HP based on new level (simplified)
    targetUser.stats = { ...GAME_CONFIG.STARTING_STATS };
    for (let i = 1; i < targetLevel; i++) {
         targetUser.stats.power += 1;
         targetUser.stats.faith += 1;
         targetUser.stats.speed += 1;
         targetUser.stats.intelligence += 1;
         targetUser.maxHp += 5;
    }
    targetUser.hp = targetUser.maxHp;
    targetUser.title = getTitleByLevel(targetUser.level);
    
    saveData(botData);
    ctx.reply(`سطح کاربر ${targetUserId} به ${targetLevel} تنظیم شد.`);
});


// ---- Bot Launch ----
bot.launch();

console.log('Survival Bot v0.1 started...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

