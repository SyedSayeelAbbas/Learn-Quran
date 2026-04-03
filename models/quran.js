const mongoose = require('mongoose');

const ayatSchema = new mongoose.Schema({
  surahNumber: { type: Number, required: true },
  ayatNumber: { type: Number, required: true },
  arabic: { type: String, required: true },
  english: { type: String, required: true },
  urdu: { type: String, required: true }
});

const surahSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  name: { type: String, required: true },        // Arabic name
  englishName: { type: String, required: true }, // English name
  urduName: { type: String, required: true },    // Urdu name
  totalAyats: { type: Number, required: true },
  revelationType: { type: String }
});

const Ayat = mongoose.model('Ayat', ayatSchema);
const Surah = mongoose.model('Surah', surahSchema);

module.exports = { Ayat, Surah };
