const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const DB_PATH = './data.json';
const bot = new Telegraf(BOT_TOKEN);

let db = { users: {} };
if (fs.existsSync(DB_PATH)) {
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) { db = { users: {} }; }
}
function saveDB() { try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8'); } catch (e) {} }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// ==================== ۳۰ د
