/* =========================================
   QURAN APP — Frontend Logic
   ========================================= */

const API = '/api';

// State
let state = {
  surahs: [],
  currentSurah: null,
  currentAyatIndex: 0,  // 0-based index
  ayats: [],
  totalAyats: 0
};

// DOM refs
const screenSelect = document.getElementById('screen-select');
const screenRead   = document.getElementById('screen-read');
const surahGrid    = document.getElementById('surah-grid');
const surahSearch  = document.getElementById('surah-search');

const readerSurahName   = document.getElementById('reader-surah-name');
const readerSurahArabic = document.getElementById('reader-surah-arabic');
const ayatCounter       = document.getElementById('ayat-counter');
const progressBar       = document.getElementById('progress-bar');

const ayatCard     = document.getElementById('ayat-card');
const ayatLoading  = document.getElementById('ayat-loading');
const ayatContent  = document.getElementById('ayat-content');
const surahComplete = document.getElementById('surah-complete');

const arabicText   = document.getElementById('arabic-text');
const urduText     = document.getElementById('urdu-text');
const englishText  = document.getElementById('english-text');
const ayatNumAr    = document.getElementById('ayat-num-ar');
const ayatNum      = document.getElementById('ayat-num');

const btnPrev  = document.getElementById('btn-prev');
const btnNext  = document.getElementById('btn-next');
const btnBack  = document.getElementById('btn-back');
const navDots  = document.getElementById('nav-dots');

const btnRestart       = document.getElementById('btn-restart');
const btnSelectAnother = document.getElementById('btn-select-another');

// Arabic numeral converter
const toArabicNumerals = (n) => {
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).split('').map(d => arabicDigits[+d] || d).join('');
};

// ============================
// API calls
// ============================
async function fetchSurahs() {
  const res = await fetch(`${API}/surahs`);
  if (!res.ok) throw new Error('Failed to fetch surahs');
  const data = await res.json();
  return data.data;
}

async function fetchAyats(surahNumber) {
  const res = await fetch(`${API}/ayats/${surahNumber}`);
  if (!res.ok) throw new Error('Failed to fetch ayats');
  const data = await res.json();
  return data.data;
}

// ============================
// Render Surah Grid
// ============================
function renderSurahGrid(surahs) {
  surahGrid.innerHTML = '';
  if (!surahs.length) {
    surahGrid.innerHTML = '<div class="loading-state"><p>No surahs found</p></div>';
    return;
  }
  surahs.forEach(surah => {
    const card = document.createElement('div');
    card.className = 'surah-card';
    card.dataset.number = surah.number;
    const type = surah.revelationType?.toLowerCase() === 'medinan' ? 'medinan' : 'meccan';
    card.innerHTML = `
      <div class="card-number">Surah ${surah.number}</div>
      <div class="card-arabic">${surah.name}</div>
      <div class="card-english">${surah.englishName}</div>
      <div class="card-urdu">${surah.urduName}</div>
      <div class="card-meta">
        <span class="card-ayats">${surah.totalAyats} Ayats</span>
        <span class="card-type ${type}">${surah.revelationType || ''}</span>
      </div>
    `;
    card.addEventListener('click', () => openSurah(surah));
    surahGrid.appendChild(card);
  });
}

// ============================
// Open a Surah
// ============================
async function openSurah(surah) {
  state.currentSurah = surah;
  state.currentAyatIndex = 0;

  // Update reader header
  readerSurahName.textContent = surah.englishName;
  readerSurahArabic.textContent = surah.name;

  // Switch screens
  screenSelect.classList.add('hidden');
  screenRead.classList.remove('hidden');
  window.scrollTo(0, 0);

  // Show loading
  showAyatLoading(true);
  surahComplete.classList.add('hidden');
  ayatContent.style.display = 'flex';

  try {
    state.ayats = await fetchAyats(surah.number);
    state.totalAyats = state.ayats.length;

    buildNavDots();
    renderAyat(0);
  } catch (err) {
    showToast('Error loading ayats. Please try again.', true);
    showAyatLoading(false);
  }
}

// ============================
// Render a specific ayat by index
// ============================
function renderAyat(index) {
  const ayat = state.ayats[index];
  if (!ayat) return;

  showAyatLoading(true);

  // Small timeout for smooth transition feel
  setTimeout(() => {
    arabicText.textContent = ayat.arabic;
    urduText.textContent   = ayat.urdu;
    englishText.textContent = ayat.english;
    ayatNumAr.textContent  = toArabicNumerals(ayat.ayatNumber);
    ayatNum.textContent    = ayat.ayatNumber;

    // Counter & progress
    ayatCounter.textContent = `${index + 1} / ${state.totalAyats}`;
    const pct = ((index + 1) / state.totalAyats) * 100;
    progressBar.style.width = `${pct}%`;

    // Nav buttons
    btnPrev.disabled = index === 0;
    btnNext.disabled = false;

    // Update dots
    updateNavDots(index);

    showAyatLoading(false);

    // Animate card content
    ayatContent.style.animation = 'none';
    ayatContent.offsetHeight; // reflow
    ayatContent.style.animation = 'slideIn 0.35s ease';
  }, 150);
}

// ============================
// Nav Dots (show up to 12)
// ============================
function buildNavDots() {
  navDots.innerHTML = '';
  const max = Math.min(state.totalAyats, 20);
  for (let i = 0; i < max; i++) {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.dataset.index = i;
    dot.addEventListener('click', () => {
      state.currentAyatIndex = i;
      renderAyat(i);
    });
    navDots.appendChild(dot);
  }
  // If more than 20, add ellipsis dot as info
  if (state.totalAyats > 20) {
    const more = document.createElement('div');
    more.className = 'nav-dot';
    more.style.opacity = '0.3';
    navDots.appendChild(more);
  }
}

function updateNavDots(currentIndex) {
  const dots = navDots.querySelectorAll('.nav-dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'visited');
    if (i === currentIndex) dot.classList.add('active');
    else if (i < currentIndex) dot.classList.add('visited');
  });
}

// ============================
// Loading State
// ============================
function showAyatLoading(show) {
  if (show) {
    ayatLoading.classList.remove('hidden');
  } else {
    ayatLoading.classList.add('hidden');
  }
}

// ============================
// Navigation
// ============================
btnNext.addEventListener('click', () => {
  if (state.currentAyatIndex < state.totalAyats - 1) {
    state.currentAyatIndex++;
    renderAyat(state.currentAyatIndex);
  } else {
    // Surah complete
    showSurahComplete();
  }
});

btnPrev.addEventListener('click', () => {
  if (state.currentAyatIndex > 0) {
    state.currentAyatIndex--;
    renderAyat(state.currentAyatIndex);
  }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (screenRead.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') btnNext.click();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   btnPrev.click();
});

// ============================
// Surah Complete
// ============================
function showSurahComplete() {
  surahComplete.classList.remove('hidden');
  ayatContent.style.display = 'none';
  btnNext.disabled = true;
  progressBar.style.width = '100%';
}

btnRestart.addEventListener('click', () => {
  surahComplete.classList.add('hidden');
  ayatContent.style.display = 'flex';
  state.currentAyatIndex = 0;
  renderAyat(0);
});

btnSelectAnother.addEventListener('click', goBack);

// ============================
// Back to select
// ============================
btnBack.addEventListener('click', goBack);

function goBack() {
  screenRead.classList.add('hidden');
  screenSelect.classList.remove('hidden');
  state.currentSurah = null;
  state.ayats = [];
  window.scrollTo(0, 0);
}

// ============================
// Search
// ============================
surahSearch.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    renderSurahGrid(state.surahs);
    return;
  }
  const filtered = state.surahs.filter(s =>
    s.englishName.toLowerCase().includes(q) ||
    s.name.includes(q) ||
    s.urduName.includes(q) ||
    String(s.number).includes(q)
  );
  renderSurahGrid(filtered);
});

// ============================
// Toast
// ============================
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============================
// Init
// ============================
async function init() {
  surahGrid.innerHTML = `
    <div class="loading-state" style="grid-column:1/-1">
      <div class="spinner"></div>
      <p>Loading Surahs...</p>
    </div>`;
  try {
    state.surahs = await fetchSurahs();
    renderSurahGrid(state.surahs);
  } catch (err) {
    surahGrid.innerHTML = `
      <div class="loading-state" style="grid-column:1/-1">
        <p style="color:#fca5a5">⚠ Could not load surahs.<br>Make sure the server is running and the database is seeded.</p>
      </div>`;
    showToast('Failed to connect to server', true);
  }
}

init();
