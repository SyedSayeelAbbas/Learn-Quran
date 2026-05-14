/* =========================================
   QURAN APP — Frontend Logic
   ========================================= */

const API = '/api';

// ============================
// History Manager (localStorage)
// ============================
const History = {
  KEY: 'quran_reading_history',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch { return {}; }
  },

  get(surahNumber) {
    return this.getAll()[surahNumber] || null;
  },

  save(surah, ayatIndex, totalAyats) {
    const all = this.getAll();
    all[surah.number] = {
      surahNumber: surah.number,
      surahName: surah.englishName,
      surahArabic: surah.name,
      surahUrdu: surah.urduName,
      totalAyats,
      ayatIndex,          // 0-based
      ayatNumber: ayatIndex + 1,
      completed: ayatIndex + 1 >= totalAyats,
      lastRead: Date.now()
    };
    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  markComplete(surah, totalAyats) {
    const all = this.getAll();
    if (all[surah.number]) {
      all[surah.number].completed = true;
      all[surah.number].ayatIndex = totalAyats - 1;
      all[surah.number].ayatNumber = totalAyats;
      all[surah.number].lastRead = Date.now();
      localStorage.setItem(this.KEY, JSON.stringify(all));
    }
  },

  getRecent(limit = 5) {
    const all = this.getAll();
    return Object.values(all)
      .sort((a, b) => b.lastRead - a.lastRead)
      .slice(0, limit);
  },

  clear(surahNumber) {
    const all = this.getAll();
    delete all[surahNumber];
    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  formatTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hrs < 24)   return `${hrs}h ago`;
    if (days < 7)   return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  }
};

// State
let state = {
  surahs: [],
  currentSurah: null,
  currentAyatIndex: 0,
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

const ayatCard      = document.getElementById('ayat-card');
const ayatLoading   = document.getElementById('ayat-loading');
const ayatContent   = document.getElementById('ayat-content');
const surahComplete = document.getElementById('surah-complete');

const arabicText  = document.getElementById('arabic-text');
const urduText    = document.getElementById('urdu-text');
const englishText = document.getElementById('english-text');
const ayatNumAr   = document.getElementById('ayat-num-ar');
const ayatNum     = document.getElementById('ayat-num');

const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnBack = document.getElementById('btn-back');
const navDots = document.getElementById('nav-dots');

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
// Render History Section
// ============================
function renderHistorySection() {
  // Remove existing history section
  const existing = document.getElementById('history-section');
  if (existing) existing.remove();

  const recent = History.getRecent(5);
  if (!recent.length) return;

  const section = document.createElement('div');
  section.id = 'history-section';
  section.className = 'history-section';

  section.innerHTML = `
    <div class="history-header">
      <h2 class="history-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="history-icon">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Continue Reading
      </h2>
      <button class="history-clear-all" id="history-clear-all" title="Clear all history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        Clear History
      </button>
    </div>
    <div class="history-list">
      ${recent.map(entry => {
        const pct = Math.round(((entry.ayatIndex + 1) / entry.totalAyats) * 100);
        return `
          <div class="history-card" data-surah="${entry.surahNumber}">
            <div class="history-card-left">
              <div class="history-surah-num">${entry.surahNumber}</div>
              <div class="history-surah-info">
                <span class="history-surah-arabic">${entry.surahArabic}</span>
                <span class="history-surah-name">${entry.surahName}</span>
                <span class="history-meta">
                  ${entry.completed
                    ? '<span class="history-badge completed">✓ Completed</span>'
                    : `<span class="history-badge in-progress">Ayat ${entry.ayatNumber} / ${entry.totalAyats}</span>`
                  }
                  <span class="history-time">${History.formatTime(entry.lastRead)}</span>
                </span>
              </div>
            </div>
            <div class="history-card-right">
              <div class="history-progress-wrap">
                <div class="history-progress-bar" style="width:${pct}%"></div>
              </div>
              <div class="history-pct">${pct}%</div>
              <button class="history-resume-btn" data-surah="${entry.surahNumber}" title="Resume">
                ${entry.completed ? 'Read Again' : 'Resume'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button class="history-remove-btn" data-surah="${entry.surahNumber}" title="Remove from history">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Insert before the search wrap
  const searchWrap = document.querySelector('.search-wrap');
  searchWrap.parentNode.insertBefore(section, searchWrap);

  // Events
  section.querySelectorAll('.history-resume-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const num = parseInt(btn.dataset.surah);
      const entry = History.get(num);
      const surah = state.surahs.find(s => s.number === num);
      if (surah) {
        const resumeIndex = entry.completed ? 0 : entry.ayatIndex;
        await openSurah(surah, resumeIndex);
      }
    });
  });

  section.querySelectorAll('.history-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      History.clear(parseInt(btn.dataset.surah));
      renderHistorySection();
      renderSurahGrid(state.surahs); // refresh badges
    });
  });

  // Card click (whole card)
  section.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', async () => {
      const num = parseInt(card.dataset.surah);
      const entry = History.get(num);
      const surah = state.surahs.find(s => s.number === num);
      if (surah) {
        const resumeIndex = entry.completed ? 0 : entry.ayatIndex;
        await openSurah(surah, resumeIndex);
      }
    });
  });

  document.getElementById('history-clear-all')?.addEventListener('click', () => {
    if (confirm('Clear all reading history?')) {
      localStorage.removeItem(History.KEY);
      renderHistorySection();
      renderSurahGrid(state.surahs);
    }
  });
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

  const allHistory = History.getAll();

  surahs.forEach(surah => {
    const card = document.createElement('div');
    card.className = 'surah-card';
    card.dataset.number = surah.number;
    const type = surah.revelationType?.toLowerCase() === 'medinan' ? 'medinan' : 'meccan';
    const histEntry = allHistory[surah.number];
    const pct = histEntry ? Math.round(((histEntry.ayatIndex + 1) / histEntry.totalAyats) * 100) : 0;

    let progressBadge = '';
    if (histEntry) {
      if (histEntry.completed) {
        progressBadge = `<div class="card-history-badge completed" title="Completed">✓</div>`;
      } else {
        progressBadge = `<div class="card-history-badge in-progress" title="In progress — Ayat ${histEntry.ayatNumber}">${pct}%</div>`;
      }
    }

    let progressStrip = '';
    if (histEntry) {
      progressStrip = `
        <div class="card-progress-strip">
          <div class="card-progress-fill ${histEntry.completed ? 'complete' : ''}" style="width:${pct}%"></div>
        </div>`;
    }

    card.innerHTML = `
      ${progressBadge}
      <div class="card-number">Surah ${surah.number}</div>
      <div class="card-arabic">${surah.name}</div>
      <div class="card-english">${surah.englishName}</div>
      <div class="card-urdu">${surah.urduName}</div>
      <div class="card-meta">
        <span class="card-ayats">${surah.totalAyats} Ayats</span>
        <span class="card-type ${type}">${surah.revelationType || ''}</span>
      </div>
      ${progressStrip}
    `;
    card.addEventListener('click', () => openSurah(surah));
    surahGrid.appendChild(card);
  });
}

// ============================
// Open a Surah
// ============================
async function openSurah(surah, resumeIndex = null) {
  state.currentSurah = surah;

  // Check history for resume point
  const histEntry = History.get(surah.number);
  const startIndex = resumeIndex !== null
    ? resumeIndex
    : (histEntry && !histEntry.completed ? histEntry.ayatIndex : 0);

  state.currentAyatIndex = startIndex;

  readerSurahName.textContent = surah.englishName;
  readerSurahArabic.textContent = surah.name;

  screenSelect.classList.add('hidden');
  screenRead.classList.remove('hidden');
  window.scrollTo(0, 0);

  showAyatLoading(true);
  surahComplete.classList.add('hidden');
  ayatContent.style.display = 'flex';

  try {
    state.ayats = await fetchAyats(surah.number);
    state.totalAyats = state.ayats.length;

    buildNavDots();
    renderAyat(state.currentAyatIndex);

    // Show a toast if resuming mid-surah
    if (startIndex > 0 && resumeIndex === null) {
      showToast(`Resuming from Ayat ${startIndex + 1}`);
    }
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

  setTimeout(() => {
    arabicText.textContent  = ayat.arabic;
    urduText.textContent    = ayat.urdu;
    englishText.textContent = ayat.english;
    ayatNumAr.textContent   = toArabicNumerals(ayat.ayatNumber);
    ayatNum.textContent     = ayat.ayatNumber;

    ayatCounter.textContent = `${index + 1} / ${state.totalAyats}`;
    const pct = ((index + 1) / state.totalAyats) * 100;
    progressBar.style.width = `${pct}%`;

    btnPrev.disabled = index === 0;
    btnNext.disabled = false;

    updateNavDots(index);
    showAyatLoading(false);

    // Save to history
    History.save(state.currentSurah, index, state.totalAyats);

    ayatContent.style.animation = 'none';
    ayatContent.offsetHeight;
    ayatContent.style.animation = 'slideIn 0.35s ease';
  }, 150);
}

// ============================
// Nav Dots
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
  if (show) ayatLoading.classList.remove('hidden');
  else      ayatLoading.classList.add('hidden');
}

// ============================
// Navigation
// ============================
btnNext.addEventListener('click', () => {
  if (state.currentAyatIndex < state.totalAyats - 1) {
    state.currentAyatIndex++;
    renderAyat(state.currentAyatIndex);
  } else {
    History.markComplete(state.currentSurah, state.totalAyats);
    showSurahComplete();
  }
});

btnPrev.addEventListener('click', () => {
  if (state.currentAyatIndex > 0) {
    state.currentAyatIndex--;
    renderAyat(state.currentAyatIndex);
  }
});

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
  // Refresh history section and cards when returning
  renderHistorySection();
  renderSurahGrid(
    surahSearch.value.trim()
      ? state.surahs.filter(s =>
          s.englishName.toLowerCase().includes(surahSearch.value.toLowerCase()) ||
          s.name.includes(surahSearch.value) ||
          s.urduName.includes(surahSearch.value) ||
          String(s.number).includes(surahSearch.value)
        )
      : state.surahs
  );
  window.scrollTo(0, 0);
}

// ============================
// Search
// ============================
surahSearch.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) { renderSurahGrid(state.surahs); return; }
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
    renderHistorySection();
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
