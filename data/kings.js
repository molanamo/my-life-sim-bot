// اطلاعات پاادشاهان - بقای فرمانروا
const { photos } = require("../assets");

const kings = {
  cyrus: {
    id: "cyrus",
    name: "کوروش بزرگ",
    era: "باستان",
    desc: "بنیادگزار هخامنشی، فاتح بابل",
    photo: photos.cyrus,
    bonus: { gold: 100, soldiers: 3 },
    startFood: 12,
  },
  darius: {
    id: "darius",
    name: "داریوش بزرگ",
    era: "باستان",
    desc: "سازنده پارسه و جاده شاهی",
    photo: photos.darius,
    bonus: { stone: 30, iron: 10 },
    startFood: 10,
  },
  anushirvan: {
    id: "anushirvan",
    name: "انوشیروان دادگر",
    era: "باستان",
    desc: "دادگستر ساسانی، دوران طلایی",
    photo: photos.anushirvan,
    bonus: { gold: 50, food: 5 },
    startFood: 15,
  },
  shahabbas: {
    id: "shahabbas",
    name: "شاه عباس صفوی",
    era: "اسلامی",
    desc: "شاه بزرگ صفوی، فاتح هرات",
    photo: photos.shahabbas,
    bonus: { soldiers: 8, iron: 5 },
    startFood: 10,
  },
  nader: {
    id: "nader",
    name: "نادرشاه افشار",
    era: "اسلامی",
    desc: "فاتح هند، ناپلئون ایران",
    photo: photos.nader,
    bonus: { soldiers: 10, gold: 50 },
    startFood: 8,
  },
  karim: {
    id: "karim",
    name: "کریم‌خان زند",
    era: "اسلامی",
    desc: "وکیل‌الرعایا، دوران صلح",
    photo: photos.karim,
    bonus: { gold: 150, wood: 20 },
    startFood: 12,
  },
  rezashah: {
    id: "rezashah",
    name: "رضاشاه پهلوی",
    era: "مدرن",
    desc: "بنیادگزار ارتش نوین ایران",
    photo: photos.rezashah,
    bonus: { iron: 20, soldiers: 5 },
    startFood: 10,
  },
  mohammadreza: {
    id: "mohammadreza",
    name: "محمدرضا پهلوی",
    era: "مدرن",
    desc: "پیشاهنگ سپید، مدرنیزاسیون",
    photo: photos.mohammadreza,
    bonus: { gold: 200, iron: 10 },
    startFood: 10,
  },
  khomeini: {
    id: "khomeini",
    name: "امام خمینی",
    era: "انقلاب",
    desc: "رهبر انقلاب اسلامی",
    photo: photos.khomeini,
    bonus: { soldiers: 8, food: 3 },
    startFood: 10,
  },
  khamenei: {
    id: "khamenei",
    name: "آیت‌الله خامنه‌ای",
    era: "جمهوری اسلامی",
    desc: "رهبر فرزانه انقلاب",
    photo: photos.khamenei,
    bonus: { iron: 15, gold: 100 },
    startFood: 10,
  },
};

// گروه‌بندی بر اساس دوره
const eras = {
  "باستان": ["cyrus", "darius", "anushirvan"],
  "اسلامی": ["shahabbas", "nader", "karim"],
  "مدرن": ["rezashah", "mohammadreza"],
  "انقلاب": ["khomeini", "khamenei"],
};

module.exports = { kings, eras };