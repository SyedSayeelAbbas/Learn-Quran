# 📖 Learn Quran — Full Stack App

A beautiful web application to read the Holy Quran with **Urdu** and **English** translations, featuring a clean ayat-by-ayat reading experience.

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
The `.env` file is already configured with your MongoDB URI:
```
MONGODB_URI=mongodb+srv://...
PORT=3000
```

### 3. Seed the Database (First Time Only)
This fetches all 114 Surahs and 6,236 Ayats from a free API and stores them in MongoDB:
```bash
npm run seed
```
> ⏳ This takes ~2–3 minutes to download all translations.

### 4. Start the Server
```bash
npm start
```

### 5. Open in Browser
Visit: **http://localhost:3000**

---

## 📁 Project Structure

```
quran-app/
├── server.js          # Express server entry point
├── seed.js            # Database seeder (run once)
├── .env               # MongoDB URI & config
├── models/
│   └── quran.js       # Mongoose models (Surah, Ayat)
├── routes/
│   └── quran.js       # REST API routes
└── public/
    ├── index.html     # Frontend HTML
    ├── css/
    │   └── style.css  # Styles
    └── js/
        └── app.js     # Frontend JS logic
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surahs` | List all 114 surahs |
| GET | `/api/surah/:number` | Get single surah info |
| GET | `/api/ayats/:surah` | Get all ayats of a surah |
| GET | `/api/ayat/:surah/:ayat` | Get a specific ayat |

---

## ✨ Features

- **114 Surahs** with Arabic names, English & Urdu names
- **6,236 Ayats** with Arabic text, English (Sahih International) & Urdu (Junagarhi) translation
- **Ayat-by-ayat** reading with Previous/Next navigation
- **Progress bar** and dot navigation
- **Search** surahs by name (English, Arabic, Urdu)
- Keyboard navigation (← → arrow keys)
- Surah completion screen
- Fully responsive design

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Quran Data**: [AlQuran.cloud API](https://alquran.cloud/api)
