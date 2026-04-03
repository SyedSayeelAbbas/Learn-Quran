const express = require('express');
const router = express.Router();
const { Ayat, Surah } = require('../models/quran');

// GET all surahs
router.get('/surahs', async (req, res) => {
  try {
    const surahs = await Surah.find().sort({ number: 1 });
    res.json({ success: true, data: surahs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single surah info
router.get('/surah/:number', async (req, res) => {
  try {
    const surah = await Surah.findOne({ number: req.params.number });
    if (!surah) return res.status(404).json({ success: false, message: 'Surah not found' });
    res.json({ success: true, data: surah });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET specific ayat
router.get('/ayat/:surah/:ayat', async (req, res) => {
  try {
    const ayat = await Ayat.findOne({
      surahNumber: req.params.surah,
      ayatNumber: req.params.ayat
    });
    if (!ayat) return res.status(404).json({ success: false, message: 'Ayat not found' });
    res.json({ success: true, data: ayat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all ayats for a surah
router.get('/ayats/:surah', async (req, res) => {
  try {
    const ayats = await Ayat.find({ surahNumber: req.params.surah }).sort({ ayatNumber: 1 });
    res.json({ success: true, data: ayats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;