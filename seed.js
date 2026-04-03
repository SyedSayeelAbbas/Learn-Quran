require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { Ayat, Surah } = require('./models/quran');

// Urdu surah names
const urduNames = [
  'الفاتحہ','البقرہ','آل عمران','النساء','المائدہ','الانعام','الاعراف','الانفال','التوبہ','یونس',
  'ہود','یوسف','الرعد','ابراہیم','الحجر','النحل','الاسراء','الکہف','مریم','طہ',
  'الانبیاء','الحج','المومنون','النور','الفرقان','الشعراء','النمل','القصص','العنکبوت','الروم',
  'لقمان','السجدہ','الاحزاب','سبا','فاطر','یس','الصافات','ص','الزمر','غافر',
  'فصلت','الشوریٰ','الزخرف','الدخان','الجاثیہ','الاحقاف','محمد','الفتح','الحجرات','ق',
  'الذاریات','الطور','النجم','القمر','الرحمن','الواقعہ','الحدید','المجادلہ','الحشر','الممتحنہ',
  'الصف','الجمعہ','المنافقون','التغابن','الطلاق','التحریم','الملک','القلم','الحاقہ','المعارج',
  'نوح','الجن','المزمل','المدثر','القیامہ','الانسان','المرسلات','النبا','النازعات','عبس',
  'التکویر','الانفطار','المطففین','الانشقاق','البروج','الطارق','الاعلیٰ','الغاشیہ','الفجر','البلد',
  'الشمس','اللیل','الضحیٰ','الشرح','التین','العلق','القدر','البینہ','الزلزال','العادیات',
  'القارعہ','التکاثر','العصر','الہمزہ','الفیل','قریش','الماعون','الکوثر','الکافرون','النصر',
  'المسد','الاخلاص','الفلق','الناس'
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Check if already seeded
    const count = await Surah.countDocuments();
    if (count === 114) {
      console.log('Database already seeded with 114 surahs.');
      await mongoose.disconnect();
      return;
    }

    console.log('Fetching Surah list...');
    const surahListRes = await axios.get('https://api.alquran.cloud/v1/surah');
    const surahList = surahListRes.data.data;

    await Surah.deleteMany({});
    await Ayat.deleteMany({});

    const surahs = surahList.map((s, i) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      urduName: urduNames[i] || s.englishName,
      totalAyats: s.numberOfAyahs,
      revelationType: s.revelationType
    }));
    await Surah.insertMany(surahs);
    console.log('Surahs saved!');

    // Fetch translations
    console.log('Fetching Arabic text...');
    const arabicRes = await axios.get('https://api.alquran.cloud/v1/quran/quran-uthmani');
    const arabicSurahs = arabicRes.data.data.surahs;

    console.log('Fetching English translation...');
    const engRes = await axios.get('https://api.alquran.cloud/v1/quran/en.sahih');
    const engSurahs = engRes.data.data.surahs;

    console.log('Fetching Urdu translation...');
    const urduRes = await axios.get('https://api.alquran.cloud/v1/quran/ur.junagarhi');
    const urduSurahs = urduRes.data.data.surahs;

    console.log('Building ayats...');
    const allAyats = [];
    for (let i = 0; i < arabicSurahs.length; i++) {
      const arabicS = arabicSurahs[i];
      const engS = engSurahs[i];
      const urduS = urduSurahs[i];

      for (let j = 0; j < arabicS.ayahs.length; j++) {
        allAyats.push({
          surahNumber: arabicS.number,
          ayatNumber: arabicS.ayahs[j].numberInSurah,
          arabic: arabicS.ayahs[j].text,
          english: engS.ayahs[j].text,
          urdu: urduS.ayahs[j].text
        });
      }
      if ((i + 1) % 10 === 0) console.log(`Processed ${i + 1}/114 surahs...`);
    }

    console.log(`Inserting ${allAyats.length} ayats...`);
    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < allAyats.length; i += batchSize) {
      await Ayat.insertMany(allAyats.slice(i, i + batchSize));
    }

    console.log('✅ Database seeded successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
