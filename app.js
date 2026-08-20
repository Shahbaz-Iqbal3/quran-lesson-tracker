'use strict';

/* =========================================================================
   SABAQ — Quran lesson tracker (minimalist redesign)
   ========================================================================= */

const BRAND_COLORS = ['#176B52', '#2E8B68', '#3F6C7A', '#6B5CA5', '#C58A32'];

const QURAN_FONTS = {
  amiri:        { label: 'Amiri Quran',        css: "'Amiri Quran', 'Traditional Arabic', serif" },
  indopak:      { label: 'Indo-Pak',           css: "'IndoPak', 'Amiri Quran', 'Traditional Arabic', serif" },
  scheherazade: { label: 'Scheherazade',       css: "'Scheherazade New', 'Scheherazade', 'Traditional Arabic', serif" },
  traditional:  { label: 'Traditional Arabic',  css: "'Traditional Arabic', 'Geeza Pro', serif" },
  naskh:        { label: 'Naskh (Noto)',       css: "'Noto Naskh Arabic', 'Droid Arabic Naskh', 'Naskh', serif" },
  serif:        { label: 'System serif',       css: 'serif' }
};
const UI_FONTS = {
  inter:    { label: 'Inter (default)',   css: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  fraunces: { label: 'Fraunces (serif)',  css: "'Fraunces', Georgia, 'Times New Roman', serif" }
};

function quranFontCss() {
  const f = QURAN_FONTS[state.settings.quranFont];
  return f ? f.css : QURAN_FONTS.amiri.css;
}
function uiFontCss() {
  const f = UI_FONTS[state.settings.uiFont];
  return f ? f.css : UI_FONTS.inter.css;
}
function applyFonts() {
  const root = document.documentElement;
  root.style.setProperty('--font-arabic', quranFontCss());
  root.style.setProperty('--font-ui', uiFontCss());
}
function quranCanvasFont(size) {
  return `400 ${size}px ${quranFontCss()}`;
}

const DB_NAME = 'sabaq-db';
const DB_VERSION = 1;
const STORES = ['students', 'lessons', 'settings'];

const state = {
  view: 'students',
  students: [],
  lessons: [],
  settings: { schoolName: '', logoDataUrl: '', brandColorIdx: 0, quranFont: 'amiri', uiFont: 'inter' },
  quran: [],
  surahIndex: [],
  currentStudentId: null,
  readerSurahId: 1,
  selection: {
    active: false, mode: null, forStudentId: null, surahId: null,
    start: null, end: null, lockedSurah: false, complete: false, editingLessonId: null
  },
  pendingLesson: null,
  shareLessonId: null
};

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('students')) db.createObjectStore('students', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('lessons')) db.createObjectStore('lessons', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function dbGetAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(storeName, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClearAll() {
  const db = await openDb();
  return Promise.all(STORES.map(s => new Promise((resolve, reject) => {
    const tx = db.transaction(s, 'readwrite');
    tx.objectStore(s).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  })));
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function surahById(id) {
  return state.quran.find(s => s.id === id);
}

function surahMeta(id) {
  return state.surahIndex.find(s => s.id === id);
}

function todayIso() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function formatDateHuman(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonthYear(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function lessonsForStudent(studentId) {
  return state.lessons
    .filter(l => l.studentId === studentId)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

function lastLessonFor(studentId) {
  const list = lessonsForStudent(studentId);
  return list.length ? list[0] : null;
}

function dayLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(todayIso() + 'T00:00:00');
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : str;
  return d.innerHTML;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2200);
}

let _confirmResolve = null;

function confirmDialog(opts) {
  opts = opts || {};
  const overlay = document.getElementById('sheet-confirm');
  document.getElementById('confirm-title').textContent = opts.title || 'Are you sure?';
  document.getElementById('confirm-message').textContent = opts.message || '';
  const okBtn = document.getElementById('btn-confirm-ok');
  okBtn.textContent = opts.confirmText || 'Confirm';
  okBtn.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
  document.getElementById('btn-confirm-cancel').textContent = opts.cancelText || 'Cancel';
  return new Promise((resolve) => {
    _confirmResolve = resolve;
    openSheet('sheet-confirm');
  });
}

function _closeConfirm(result) {
  const overlay = document.getElementById('sheet-confirm');
  closeSheet('sheet-confirm');
  if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
}

function nextAyahRef(surahId, ayah) {
  const meta = surahMeta(surahId);
  if (!meta) return null;
  if (ayah < meta.count) return { surahId, ayah: ayah + 1 };
  if (surahId < 114) return { surahId: surahId + 1, ayah: 1 };
  return null;
}

function studentNextStart(student) {
  const last = lastLessonFor(student.id);
  if (student.surahId && student.ayah) {
    return { surahId: student.surahId, ayah: student.ayah };
  }
  if (last) {
    return { surahId: last.surahId, ayah: last.endAyah };
  }
  return null;
}

async function loadQuranData() {
  const [quranRes, indexRes] = await Promise.all([
    fetch('data/quran-data.json'),
    fetch('data/surah-index.json')
  ]);
  state.quran = await quranRes.json();
  state.surahIndex = await indexRes.json();
}

async function loadAppData() {
  const [students, lessons, settingsRows] = await Promise.all([
    dbGetAll('students'),
    dbGetAll('lessons'),
    dbGetAll('settings')
  ]);
  state.students = students.sort((a, b) => a.name.localeCompare(b.name));
  state.lessons = lessons;
  const settingsRow = settingsRows.find(r => r.key === 'app');
  if (settingsRow) state.settings = Object.assign(state.settings, settingsRow.value);
}

function showView(name) {
  state.view = name;
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + name).classList.remove('hidden');
  document.getElementById('bottom-nav').classList.toggle('hidden', name === 'detail');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', (name === 'students' && b.dataset.tab === 'students') ||
                                 (name === 'reader' && b.dataset.tab === 'reader') ||
                                 (name === 'settings' && b.dataset.tab === 'settings'));
  });
  window.scrollTo(0, 0);
}

let _scrollLockY = 0;
function lockBackgroundScroll() {
  if (document.body.dataset.scrollLocked) return;
  _scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.dataset.scrollLocked = '1';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${_scrollLockY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}
function unlockBackgroundScroll() {
  if (!document.body.dataset.scrollLocked) return;
  delete document.body.dataset.scrollLocked;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, _scrollLockY);
}
function isAnySheetOpen() {
  return [...document.querySelectorAll('.sheet-overlay')].some(o => !o.classList.contains('hidden'));
}
function openSheet(id) {
  const ov = document.getElementById(id);
  const sh = ov.querySelector('.sheet');
  if (sh) sh.style.transform = '';
  ov.classList.remove('hidden');
  lockBackgroundScroll();
}
function closeSheet(id) {
  document.getElementById(id).classList.add('hidden');
  if (!isAnySheetOpen()) unlockBackgroundScroll();
}

function renderStudents() {
  const list = document.getElementById('student-list');
  const empty = document.getElementById('student-empty');
  const subtitle = document.getElementById('students-subtitle');
  const total = state.students.length;

  subtitle.textContent = `${total} students · Today`;

  let completedToday = 0;
  for (const s of state.students) {
    if (lessonsForStudent(s.id).some(l => l.date === todayIso())) completedToday++;
  }
  document.getElementById('progress-text').textContent = `${completedToday} / ${total}`;
  document.getElementById('progress-fill').style.width =
    total ? (completedToday / total * 100) + '%' : '0%';

  const q = (document.getElementById('input-search-students').value || '').trim().toLowerCase();

  list.innerHTML = '';
  if (!total) {
    empty.classList.remove('hidden');
    list.classList.add('hidden');
    return;
  }

  let rendered = 0;
  for (const student of state.students) {
    if (q && !student.name.toLowerCase().includes(q)) continue;

    const last = lastLessonFor(student.id);
    let sub;
    if (last) {
      const meta = surahMeta(last.surahId);
      sub = `Surah ${meta.translit} · ${last.startAyah}–${last.endAyah}`;
    } else if (student.surahId && student.ayah) {
      const meta = surahMeta(student.surahId);
      sub = `Surah ${meta.translit} · Ayah ${student.ayah}`;
    } else {
      sub = 'No lessons yet';
    }

    const hasToday = lessonsForStudent(student.id).some(l => l.date === todayIso());
    const statusHtml = hasToday
      ? `<div class="status status-completed"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M20 6L9 17l-5-5"/></svg>Completed</div>`
      : `<div class="status status-pending"><span class="dot"></span>Pending</div>`;

    const card = document.createElement('button');
    card.className = 'student-row';
    card.setAttribute('data-student-id', student.id);
    card.innerHTML = `
      <div class="avatar">${initials(student.name)}</div>
      <div class="info">
        <div class="name">${escapeHtml(student.name)}</div>
        <div class="sub">${escapeHtml(sub)}</div>
      </div>
      ${statusHtml}
    `;
    card.addEventListener('click', () => openStudentDetail(student.id));
    list.appendChild(card);
    rendered++;
  }

  if (rendered === 0) {
    empty.classList.remove('hidden');
    list.classList.add('hidden');
  } else {
    empty.classList.add('hidden');
    list.classList.remove('hidden');
  }
}

function openStudentDetail(studentId) {
  state.currentStudentId = studentId;
  renderStudentDetail();
  showView('detail');
}

function renderStudentDetail() {
  const student = state.students.find(s => s.id === state.currentStudentId);
  if (!student) { showView('students'); return; }

  document.getElementById('detail-avatar').textContent = initials(student.name);
  document.getElementById('detail-name').textContent = student.name;
  document.getElementById('detail-meta').textContent =
    student.joinedAt ? `Joined ${formatMonthYear(student.joinedAt)}` : '';

  const continueCard = document.getElementById('continue-card');
  const firstBtn = document.getElementById('btn-first-lesson');
  const base = studentNextStart(student);

  if (!base) {
    continueCard.classList.add('hidden');
    firstBtn.classList.remove('hidden');
  } else {
    const next = nextAyahRef(base.surahId, base.ayah);
    firstBtn.classList.add('hidden');
    continueCard.classList.remove('hidden');
    const last = lastLessonFor(student.id);

    if (!next) {
      document.getElementById('continue-surah').textContent = '';
      document.getElementById('continue-ayah').textContent = '';
      document.getElementById('continue-desc').textContent = 'Completed the Quran';
      continueCard.dataset.nextSurah = '';
      continueCard.dataset.nextAyah = '';
      document.getElementById('btn-continue').classList.add('hidden');
    } else {
      const nextMeta = surahMeta(next.surahId);
      document.getElementById('continue-surah').textContent = nextMeta.translit;
      document.getElementById('continue-ayah').textContent = `${next.ayah} ?`;
      document.getElementById('continue-desc').textContent =
        last ? `Last lesson ended at Ayah ${base.ayah}`
             : `Starting from ${surahMeta(base.surahId).translit} ${base.ayah}`;
      continueCard.dataset.nextSurah = next.surahId;
      continueCard.dataset.nextAyah = next.ayah;
      document.getElementById('btn-continue').classList.remove('hidden');
    }
  }

  const lessons = lessonsForStudent(student.id);
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  historyList.innerHTML = '';

  if (!lessons.length) {
    historyEmpty.classList.remove('hidden');
    return;
  }
  historyEmpty.classList.add('hidden');

  const groups = {};
  const order = [];
  for (const lesson of lessons) {
    if (!groups[lesson.date]) { groups[lesson.date] = []; order.push(lesson.date); }
    groups[lesson.date].push(lesson);
  }

  for (const key of order) {
    const groupEl = document.createElement('div');
    groupEl.className = 'history-group';
    groupEl.innerHTML = `<div class="history-date">${dayLabel(key)}</div>`;

    for (const lesson of groups[key]) {
      const meta = surahMeta(lesson.surahId);
      const row = document.createElement('div');
      row.className = 'history-row';
      row.setAttribute('data-lesson-id', lesson.id);
      row.innerHTML = `
        <div class="history-timeline"><div class="node"></div><div class="line"></div></div>
        <div class="history-body">
          <div class="ref-line">
            <span class="surah-name">${escapeHtml(meta.translit)}</span>
            <span class="ayat-range">${lesson.startAyah}–${lesson.endAyah}</span>
          </div>
          <div class="date">${lesson.time ? `Completed · ${escapeHtml(lesson.time)}` : 'Completed'}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn-sm" data-action="share" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
          </button>
          <button class="icon-btn-sm" data-action="edit" aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn-sm" data-action="delete" aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      `;
      row.querySelector('[data-action="share"]').addEventListener('click', (e) => { e.stopPropagation(); openShareSheet(lesson.id); });
      row.querySelector('[data-action="edit"]').addEventListener('click', (e) => { e.stopPropagation(); editLesson(lesson.id); });
      row.querySelector('[data-action="delete"]').addEventListener('click', (e) => { e.stopPropagation(); deleteLesson(lesson.id); });
      row.addEventListener('click', () => openReader(lesson.surahId, lesson.startAyah));
      groupEl.appendChild(row);
    }
    historyList.appendChild(groupEl);
  }
}

function populateSurahSelect() {
  const optsHtml = state.surahIndex.map(s => `<option value="${s.id}">${s.id}. ${s.translit}</option>`).join('');
  document.getElementById('select-surah').innerHTML = optsHtml;
  document.getElementById('manual-surah').innerHTML = optsHtml;
  document.getElementById('select-student-surah').innerHTML = optsHtml;
}

function populateAyahSelect(surahId) {
  const meta = surahMeta(surahId);
  const sel = document.getElementById('select-ayah');
  let opts = '';
  for (let i = 1; i <= meta.count; i++) opts += `<option value="${i}">${i}</option>`;
  sel.innerHTML = opts;
}

function openReader(surahId, ayah, opts) {
  opts = opts || {};
  state.readerSurahId = surahId;
  document.getElementById('select-surah').value = String(surahId);
  populateAyahSelect(surahId);
  document.getElementById('select-ayah').value = String(ayah || 1);
  renderReaderContent(surahId);
  showView('reader');
  document.getElementById('jump-panel').classList.add('hidden');
  document.getElementById('reader-content').classList.remove('hidden');
  document.getElementById('btn-reader-confirm').classList.add('hidden');
  updateSelectionBanner();
  if (ayah) {
    requestAnimationFrame(() => scrollToAyah(ayah, true));
  }
}

function renderReaderContent(surahId) {
  const surah = surahById(surahId);
  const meta = surahMeta(surahId);
  const container = document.getElementById('reader-content');
  container.style.transform = '';
  container.style.transition = '';
  container.innerHTML = '';

  document.getElementById('reader-surah-name').textContent = meta.translit;

  const heading = document.createElement('div');
  heading.className = 'surah-heading';
  heading.innerHTML = `<div class="name-ar">${surah.name}</div><div class="name-translit">${meta.id}. ${meta.translit} · ${meta.count} ayat</div>`;
  container.appendChild(heading);

  if (surahId !== 9 && surahId !== 1) {
    const bismillah = document.createElement('div');
    bismillah.className = 'bismillah';
    bismillah.textContent = '?????? ??????? ???????????? ??????????';
    container.appendChild(bismillah);
  }

  surah.verses.forEach((text, idx) => {
    const ayahNum = idx + 1;
    const block = document.createElement('div');
    block.className = 'ayah-block';
    block.dataset.ayah = String(ayahNum);
    block.innerHTML = `<div class="ayah-num">${ayahNum}</div><div class="ayah-text">${text}</div>`;
    block.addEventListener('click', () => handleAyahTap(surahId, ayahNum, block));
    container.appendChild(block);
  });

  applySelectionHighlight();
}

function scrollToAyah(ayah, instant) {
  const el = document.querySelector(`.ayah-block[data-ayah="${ayah}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'center' });
  el.classList.add('target-flash');
  setTimeout(() => el.classList.remove('target-flash'), 1400);
}

function applySelectionHighlight() {
  document.querySelectorAll('.ayah-block').forEach(b => b.classList.remove('in-range', 'range-start', 'range-end'));
  const sel = state.selection;
  if (!sel.active || !sel.surahId || !sel.start) return;
  const endVal = sel.end || sel.start;
  const lo = Math.min(sel.start, endVal), hi = Math.max(sel.start, endVal);
  for (let a = lo; a <= hi; a++) {
    const el = document.querySelector(`.ayah-block[data-ayah="${a}"]`);
    if (el) el.classList.add('in-range');
  }
  const startEl = document.querySelector(`.ayah-block[data-ayah="${sel.start}"]`);
  if (startEl) startEl.classList.add('range-start');
  if (sel.end) {
    const endEl = document.querySelector(`.ayah-block[data-ayah="${sel.end}"]`);
    if (endEl) endEl.classList.add('range-end');
  }
}

function updateSelectionBanner() {
  const banner = document.getElementById('selecting-banner');
  const text = document.getElementById('selecting-banner-text');
  if (!state.selection.active) { banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  text.textContent = state.selection.mode === 'start'
    ? "Tap the ayah where the lesson starts"
    : "Tap the ayah where the lesson ends";
}

function handleAyahTap(surahId, ayah, blockEl) {
  const sel = state.selection;
  if (!sel.active || sel.complete) return;
  if (sel.lockedSurah && sel.surahId && surahId !== sel.surahId) {
    toast('Lesson range must stay within one surah');
    return;
  }

  if (sel.mode === 'start') {
    sel.surahId = surahId;
    sel.start = ayah;
    sel.lockedSurah = true;
    sel.mode = 'end';
    updateSelectionBanner();
    applySelectionHighlight();
    return;
  }

  if (sel.mode === 'end') {
    if (ayah < sel.start) {
      sel.start = ayah;
      applySelectionHighlight();
      return;
    }
    sel.end = ayah;
    finishSelection();
  }
}

function finishSelection() {
  const sel = state.selection;
  state.pendingLesson = {
    studentId: sel.forStudentId,
    surahId: sel.surahId,
    start: sel.start,
    end: sel.end,
    editingLessonId: sel.editingLessonId
  };
  sel.complete = true;
  showReaderConfirm();
  applySelectionHighlight();
}

function showReaderConfirm() {
  document.getElementById('selecting-banner').classList.add('hidden');
  document.getElementById('btn-reader-confirm').classList.remove('hidden');
}

function resetSelection() {
  state.selection = {
    active: false, mode: null, forStudentId: null, surahId: null,
    start: null, end: null, lockedSurah: false, complete: false, editingLessonId: null
  };
  document.getElementById('selecting-banner').classList.add('hidden');
  document.getElementById('btn-reader-confirm').classList.add('hidden');
  applySelectionHighlight();
}

function beginContinueLesson(studentId, surahId, ayah) {
  state.selection = {
    active: true, mode: 'end', forStudentId: studentId,
    surahId, start: ayah, end: null, lockedSurah: true, complete: false, editingLessonId: null
  };
  openReader(surahId, ayah);
}

function beginFreshLesson(studentId) {
  state.selection = {
    active: true, mode: 'start', forStudentId: studentId,
    surahId: null, start: null, end: null, lockedSurah: false, complete: false, editingLessonId: null
  };
  openReader(state.readerSurahId || 1, 1);
}

/* ---------------------------- Lesson confirm sheet ---------------------------- */

function openLessonConfirmSheet() {
  const pl = state.pendingLesson;
  if (!pl) return;
  const student = state.students.find(s => s.id === pl.studentId);
  const meta = surahMeta(pl.surahId);
  if (!student) return;

  document.getElementById('lesson-student-name').textContent = `For ${student.name}`;
  document.getElementById('lesson-range-text').textContent = `${meta.translit} · ${pl.start}–${pl.end}`;
  document.getElementById('input-lesson-note').value = '';
  openSheet('sheet-lesson');
}

async function saveLessonFromSheet() {
  const pl = state.pendingLesson;
  if (!pl) return;
  const student = state.students.find(s => s.id === pl.studentId);
  if (!student) return;
  const note = document.getElementById('input-lesson-note').value.trim();
  const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const lesson = {
    id: pl.editingLessonId || uid(),
    studentId: pl.studentId,
    surahId: pl.surahId,
    startAyah: pl.start,
    endAyah: pl.end,
    date: todayIso(),
    time,
    note,
    createdAt: pl.editingLessonId
      ? (state.lessons.find(l => l.id === pl.editingLessonId) || {}).createdAt || new Date().toISOString()
      : new Date().toISOString()
  };

  if (!pl.editingLessonId) {
    student.surahId = pl.surahId;
    student.ayah = pl.end;
    await dbPut('students', student);
  }

  await dbPut('lessons', lesson);
  const idx = state.lessons.findIndex(l => l.id === lesson.id);
  if (idx >= 0) state.lessons[idx] = lesson; else state.lessons.push(lesson);

  closeSheet('sheet-lesson');
  state.pendingLesson = null;
  state.currentStudentId = pl.studentId;
  renderStudents();
  renderStudentDetail();
  showView('detail');
  toast('Sabaq recorded');
}

function editLesson(lessonId) {
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  const student = state.students.find(s => s.id === lesson.studentId);
  state.pendingLesson = {
    studentId: lesson.studentId, surahId: lesson.surahId,
    start: lesson.startAyah, end: lesson.endAyah, editingLessonId: lesson.id
  };
  document.getElementById('lesson-student-name').textContent =
    `For ${student ? student.name : ''}`;
  const meta = surahMeta(lesson.surahId);
  document.getElementById('lesson-range-text').textContent =
    `${meta.translit} · ${lesson.startAyah}–${lesson.endAyah}`;
  document.getElementById('input-lesson-note').value = lesson.note || '';
  openSheet('sheet-lesson');
}

async function deleteLesson(lessonId) {
  if (!await confirmDialog({ title: 'Delete lesson', message: 'Delete this lesson entry?', confirmText: 'Delete', danger: true })) return;
  await dbDelete('lessons', lessonId);
  state.lessons = state.lessons.filter(l => l.id !== lessonId);
  renderStudents();
  renderStudentDetail();
  toast('Lesson deleted');
}

function openManualRangeSheet() {
  const pl = state.pendingLesson;
  if (!pl) return;
  document.getElementById('manual-surah').value = String(pl.surahId);
  document.getElementById('manual-start').value = pl.start;
  document.getElementById('manual-end').value = pl.end;
  openSheet('sheet-manual-range');
}

function applyManualRange() {
  const pl = state.pendingLesson;
  if (!pl) return;
  const surahId = parseInt(document.getElementById('manual-surah').value, 10);
  const meta = surahMeta(surahId);
  let start = parseInt(document.getElementById('manual-start').value, 10);
  let end = parseInt(document.getElementById('manual-end').value, 10);
  if (!start || !end) { toast('Enter both ayah numbers'); return; }
  start = Math.max(1, Math.min(start, meta.count));
  end = Math.max(1, Math.min(end, meta.count));
  if (end < start) { const t = start; start = end; end = t; }

  pl.surahId = surahId;
  pl.start = start;
  pl.end = end;

  document.getElementById('lesson-range-text').textContent = `${meta.translit} · ${start}–${end}`;
  closeSheet('sheet-manual-range');
}

/* ---------------------------- Jump-to-surah search panel ---------------------------- */

function normalizeSearch(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function renderJumpList(filter) {
  const list = document.getElementById('jump-list');
  const q = normalizeSearch((filter || '').trim());
  const items = state.surahIndex.filter(s =>
    !q || normalizeSearch(s.translit).includes(q) || String(s.id) === q
  );
  list.innerHTML = items.map(s => `
    <div class="surah-jump-row" data-surah-id="${s.id}">
      <div class="num">${s.id}</div>
      <div class="translit">${s.translit}</div>
      <div class="ar">${s.name}</div>
    </div>
  `).join('');
  list.querySelectorAll('.surah-jump-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt(row.dataset.surahId, 10);
      document.getElementById('jump-panel').classList.add('hidden');
      document.getElementById('reader-content').classList.remove('hidden');
      openReaderSurahOnly(id);
    });
  });
}

function openReaderSurahOnly(surahId) {
  state.readerSurahId = surahId;
  document.getElementById('select-surah').value = String(surahId);
  populateAyahSelect(surahId);
  document.getElementById('select-ayah').value = '1';
  renderReaderContent(surahId);
}

/* ---------------------------- Share card (canvas) — minimalist ---------------------------- */

async function ensureFontsReady() {
  const specs = [
    '700 30px Inter', '500 26px Inter', '600 22px Inter', '500 22px Inter',
    '700 76px Inter', quranCanvasFont(96), '700 120px Inter',
    'italic 400 26px Inter', '400 22px Inter'
  ];
  await Promise.all(specs.map(s => document.fonts.load(s).catch(() => {})));
  await document.fonts.ready;
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawShareCard(lesson) {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const brand = BRAND_COLORS[state.settings.brandColorIdx % BRAND_COLORS.length];

  await ensureFontsReady();

  ctx.fillStyle = '#F7F9F8';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = brand;
  ctx.fillRect(72, 120, 6, H - 240);

  ctx.strokeStyle = '#E7EBE9';
  ctx.lineWidth = 2;
  roundRect(ctx, 48, 48, W - 96, H - 96, 28);
  ctx.stroke();

  const student = state.students.find(s => s.id === lesson.studentId);
  const meta = surahMeta(lesson.surahId);
  const school = state.settings.schoolName || 'Sabaq';
  const cx = W / 2;

  let y = 150;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#17201D';
  ctx.font = '700 30px Inter';
  ctx.letterSpacing = '2px';
  ctx.fillText('Sabaq', 56, y);
  ctx.letterSpacing = '0px';
  if (school && school !== 'Sabaq') {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#6B7470';
    ctx.font = '500 26px Inter';
    ctx.fillText(school, W - 56, y);
    ctx.textAlign = 'left';
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B7470';
  ctx.font = '600 22px Inter';
  ctx.letterSpacing = '4px';
  ctx.fillText('LESSON', cx, 240);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#17201D';
  ctx.font = '700 76px Inter';
  const nameLines = wrapCanvasText(ctx, student ? student.name : 'Student', W - 160);
  y = 330;
  for (const line of nameLines.slice(0, 2)) { ctx.fillText(line, cx, y); y += 86; }
  y += 30;

  ctx.font = quranCanvasFont(96);
  ctx.fillText(meta.name, cx, y);
  y += 110;

  ctx.fillStyle = '#6B7470';
  ctx.font = '500 22px Inter';
  ctx.letterSpacing = '2px';
  ctx.fillText(`SURAH ${meta.id} · ${meta.translit.toUpperCase()}`, cx, y);
  ctx.letterSpacing = '0px';
  y += 90;

  ctx.strokeStyle = '#E7EBE9';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 220, y); ctx.lineTo(cx + 220, y); ctx.stroke();
  y += 90;

  ctx.fillStyle = brand;
  ctx.font = '700 120px Inter';
  ctx.fillText(`${lesson.startAyah} — ${lesson.endAyah}`, cx, y + 20);
  y += 170;

  ctx.strokeStyle = '#E7EBE9';
  ctx.beginPath(); ctx.moveTo(cx - 220, y); ctx.lineTo(cx + 220, y); ctx.stroke();
  y += 70;

  if (lesson.note) {
    ctx.fillStyle = '#6B7470';
    ctx.font = 'italic 400 26px Inter';
    const noteLines = wrapCanvasText(ctx, lesson.note, W - 220);
    for (const line of noteLines.slice(0, 2)) { ctx.fillText(line, cx, y); y += 36; }
    y += 30;
  }

  ctx.fillStyle = '#6B7470';
  ctx.font = '500 22px Inter';
  ctx.fillText(`Sabaq recorded · ${formatDateHuman(lesson.date)}`, cx, H - 90);

  ctx.textAlign = 'left';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function openShareSheet(lessonId) {
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  state.shareLessonId = lessonId;
  const student = state.students.find(s => s.id === lesson.studentId);
  document.getElementById('share-sub').textContent =
    `For ${student ? student.name : ''} · ${formatDateHuman(lesson.date)}`;
  openSheet('sheet-share');
  await drawShareCard(lesson);
}

function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
}

async function shareCardDownload() {
  const canvas = document.getElementById('share-canvas');
  const blob = await canvasToBlob(canvas);
  const lesson = state.lessons.find(l => l.id === state.shareLessonId);
  const student = state.students.find(s => s.id === lesson.studentId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sabaq-${(student ? student.name : 'lesson').replace(/\s+/g, '-').toLowerCase()}-${lesson.date}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Image saved');
}

async function shareCardWhatsapp() {
  const canvas = document.getElementById('share-canvas');
  const blob = await canvasToBlob(canvas);
  const lesson = state.lessons.find(l => l.id === state.shareLessonId);
  const student = state.students.find(s => s.id === lesson.studentId);
  const meta = surahMeta(lesson.surahId);
  const fileName = `sabaq-${(student ? student.name : 'lesson').replace(/\s+/g, '-').toLowerCase()}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  const text = `${student ? student.name : ''}'s Quran lesson: ${meta.translit} ${lesson.startAyah}-${lesson.endAyah}`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Sabaq lesson', text });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  await shareCardDownload();
  toast('Image saved — attach it in WhatsApp');
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

/* ---------------------------- Touch gestures ---------------------------- */

function attachDrag(el, opts) {
  let active = false, axis = null, startX = 0, startY = 0, curX = 0, curY = 0, dragged = false;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { active = false; return; }
    const t = e.touches[0];
    startX = curX = t.clientX; startY = curY = t.clientY;
    active = true; axis = null; dragged = false;
    if (opts.onStart) opts.onStart(t, e);
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!active) return;
    const t = e.touches[0];
    curX = t.clientX; curY = t.clientY;
    const dx = curX - startX, dy = curY - startY;
    if (axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      dragged = true;
      if (opts.axis && opts.axis !== 'auto' && opts.axis !== axis) { active = false; return; }
    }
    if (axis === 'x') { if (e.cancelable) e.preventDefault(); }
    if (axis === 'x') { if (opts.onMoveX) opts.onMoveX(dx, dy, t, e); }
    else { if (opts.onMoveY) opts.onMoveY(dx, dy, t, e); }
  }, { passive: false });
  function finish(e) {
    if (!active) return;
    active = false;
    const dx = curX - startX, dy = curY - startY;
    if (axis === 'x') { if (opts.onEndX) opts.onEndX(dx, dy, e); }
    else if (axis === 'y') { if (opts.onEndY) opts.onEndY(dx, dy, e); }
    else { if (opts.onTap) opts.onTap(e); }
  }
  el.addEventListener('touchend', finish);
  el.addEventListener('touchcancel', () => { active = false; if (opts.onCancel) opts.onCancel(); });
  el.addEventListener('click', (e) => {
    if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
  }, true);
}

function attachSheetDismiss(overlay) {
  const sheet = overlay.querySelector('.sheet');
  if (!sheet) return;
  const id = overlay.id;
  attachDrag(overlay, {
    onMoveY(dx, dy, t, e) {
      if (dy <= 0) { sheet.style.transform = 'translateY(0)'; return; }
      if (sheet.scrollHeight > sheet.clientHeight && sheet.scrollTop > 0) return;
      if (e.cancelable) e.preventDefault();
      sheet.style.transition = 'none';
      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    },
    onEndY(dx, dy) {
      sheet.style.transition = '';
      const h = sheet.offsetHeight;
      if (dy > Math.min(130, h * 0.4)) {
        sheet.style.transform = `translateY(${h}px)`;
        setTimeout(() => { closeSheet(id); sheet.style.transform = ''; }, 220);
      } else {
        sheet.style.transform = '';
      }
    }
  });
}

function goToSurah(id) {
  if (id < 1 || id > 114) return;
  if (state.selection.active) return;
  const content = document.getElementById('reader-content');
  content.style.transform = '';
  openReaderSurahOnly(id);
}

function attachReaderSwipe() {
  const content = document.getElementById('reader-content');
  let ignore = false;
  attachDrag(content, {
    onStart(t) { ignore = t.clientX < 30; },
    onMoveX(dx) {
      if (ignore || state.selection.active) return;
      if (!document.getElementById('jump-panel').classList.contains('hidden')) return;
      content.style.transition = 'none';
      content.style.transform = `translateX(${dx * 0.35}px)`;
    },
    onEndX(dx) {
      if (ignore) return;
      content.style.transition = 'transform .25s ease';
      const w = content.offsetWidth || window.innerWidth;
      const threshold = Math.min(90, w * 0.25);
      if (dx < -threshold) goToSurah(state.readerSurahId + 1);
      else if (dx > threshold) goToSurah(state.readerSurahId - 1);
      else content.style.transform = '';
      setTimeout(() => { content.style.transform = ''; content.style.transition = ''; }, 280);
    }
  });
}

function attachEdgeBack(viewId, onBack) {
  const view = document.getElementById(viewId);
  let armed = false;
  attachDrag(view, {
    onStart(t) {
      if (state.selection.active) { armed = false; return; }
      if (t.clientX > 24 || t.clientY < 84) { armed = false; return; }
      armed = true;
      view.classList.add('edge-drag');
      view.style.transition = 'none';
    },
    onMoveX(dx) {
      if (!armed) return;
      view.style.transform = `translateX(${Math.max(0, dx)}px)`;
    },
    onEndX(dx) {
      if (!armed) return;
      view.style.transition = 'transform .25s ease';
      view.style.transform = '';
      view.classList.remove('edge-drag');
      armed = false;
      if (dx > 80) onBack();
    },
    onEndY() { if (armed) { armed = false; view.style.transition = ''; view.style.transform = ''; view.classList.remove('edge-drag'); } },
    onCancel() { armed = false; view.style.transition = ''; view.style.transform = ''; view.classList.remove('edge-drag'); }
  });
}

function detailBack() { showView('students'); }

function readerBack() {
  if (state.selection.active) resetSelection();
  showView(state.currentStudentId ? 'detail' : 'students');
}

/* ---------------------------- Add / edit student ---------------------------- */

let editingStudentId = null;

function openAddStudentSheet() {
  editingStudentId = null;
  document.getElementById('student-sheet-title').textContent = 'Add student';
  document.getElementById('input-student-name').value = '';
  document.getElementById('input-student-phone').value = '';
  document.getElementById('select-student-surah').value = '1';
  document.getElementById('input-student-ayah').value = '';
  openSheet('sheet-student');
  setTimeout(() => document.getElementById('input-student-name').focus(), 200);
}

function openEditStudentSheet(student) {
  editingStudentId = student.id;
  document.getElementById('student-sheet-title').textContent = 'Edit student';
  document.getElementById('input-student-name').value = student.name;
  document.getElementById('input-student-phone').value = student.phone || '';
  document.getElementById('select-student-surah').value = String(student.surahId || 1);
  document.getElementById('input-student-ayah').value = student.ayah || '';
  openSheet('sheet-student');
}

async function saveStudentFromSheet() {
  const name = document.getElementById('input-student-name').value.trim();
  if (!name) { toast('Enter a name'); return; }
  const phone = document.getElementById('input-student-phone').value.trim();
  const surahIdRaw = document.getElementById('select-student-surah').value;
  const surahId = surahIdRaw ? parseInt(surahIdRaw, 10) : null;
  const ayahRaw = document.getElementById('input-student-ayah').value.trim();
  const ayah = ayahRaw ? parseInt(ayahRaw, 10) : null;

  if (editingStudentId) {
    const student = state.students.find(s => s.id === editingStudentId);
    student.name = name;
    student.phone = phone;
    student.surahId = surahId;
    student.ayah = ayah;
    await dbPut('students', student);
  } else {
    const student = {
      id: uid(), name, phone,
      surahId, ayah,
      joinedAt: todayIso(),
      createdAt: new Date().toISOString()
    };
    await dbPut('students', student);
    state.students.push(student);
  }
  state.students.sort((a, b) => a.name.localeCompare(b.name));
  closeSheet('sheet-student');
  renderStudents();
  if (state.view === 'detail') renderStudentDetail();
  toast('Saved');
}

async function deleteStudentById(id) {
  const student = state.students.find(s => s.id === id);
  if (!student) return;
  if (!await confirmDialog({ title: 'Delete student', message: `Delete ${student.name} and all their lesson history? This cannot be undone.`, confirmText: 'Delete', danger: true })) return;
  await dbDelete('students', id);
  const toDelete = state.lessons.filter(l => l.studentId === id);
  for (const l of toDelete) await dbDelete('lessons', l.id);
  state.students = state.students.filter(s => s.id !== id);
  state.lessons = state.lessons.filter(l => l.studentId !== id);
  closeSheet('sheet-student-options');
  showView('students');
  renderStudents();
  toast('Student deleted');
}

async function deleteCurrentStudent() {
  await deleteStudentById(state.currentStudentId);
}

/* ---------------------------- Settings ---------------------------- */

function renderSettingsView() {
  document.getElementById('input-school-name').value = state.settings.schoolName || '';
  const preview = document.getElementById('logo-preview');
  if (state.settings.logoDataUrl) {
    preview.innerHTML = `<img src="${state.settings.logoDataUrl}" alt="Logo">`;
  } else {
    preview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="22" height="22"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.83 0L15 15"/><path d="M14 14l1.5-1.5a2 2 0 0 1 2.83 0L21 15"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>`;
  }
  renderBrandColorRow();
  renderFontSelect('select-quran-font', QURAN_FONTS, state.settings.quranFont || 'amiri');
  renderFontSelect('select-ui-font', UI_FONTS, state.settings.uiFont || 'inter');
}

function renderFontSelect(id, map, current) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = Object.keys(map).map(k =>
    `<option value="${k}" ${k === current ? 'selected' : ''}>${map[k].label}</option>`
  ).join('');
}

function renderBrandColorRow() {
  const row = document.getElementById('brand-color-row');
  const selected = state.settings.brandColorIdx || 0;
  row.innerHTML = BRAND_COLORS.map((c, i) =>
    `<div class="color-dot ${i === selected ? 'selected' : ''}" data-idx="${i}" style="background:${c}"></div>`
  ).join('');
  row.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      row.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      saveSettingsField('brandColorIdx', parseInt(dot.dataset.idx, 10));
    });
  });
}

async function saveSettingsField(key, value) {
  state.settings[key] = value;
  await dbPut('settings', { key: 'app', value: state.settings });
}

async function handleLogoUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const img = await loadImage(reader.result);
    const size = 240;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    const dataUrl = c.toDataURL('image/png', 0.9);
    await saveSettingsField('logoDataUrl', dataUrl);
    renderSettingsView();
    toast('Logo updated');
  };
  reader.readAsDataURL(file);
}

async function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    students: state.students,
    lessons: state.lessons,
    settings: state.settings
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sabaq-backup-${todayIso()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Backup downloaded');
}

async function importBackup(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!payload.students || !payload.lessons) throw new Error('Invalid file');
    if (!await confirmDialog({ title: 'Import backup', message: `Import ${payload.students.length} student(s) and ${payload.lessons.length} lesson(s)? This merges with existing data.`, confirmText: 'Import' })) return;
    for (const s of payload.students) await dbPut('students', s);
    for (const l of payload.lessons) await dbPut('lessons', l);
    if (payload.settings) { state.settings = Object.assign(state.settings, payload.settings); await dbPut('settings', { key: 'app', value: state.settings }); }
    await loadAppData();
    renderStudents();
    renderSettingsView();
    toast('Backup imported');
  } catch (e) {
    toast('Could not read that file');
  }
}

/* ---------------------------- Event wiring ---------------------------- */

function wireEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      resetSelection();
      if (btn.dataset.tab === 'students') showView('students');
      else if (btn.dataset.tab === 'reader') openReader(state.readerSurahId || 1, null);
      else if (btn.dataset.tab === 'settings') { renderSettingsView(); showView('settings'); }
    });
  });

  document.getElementById('btn-add-student').addEventListener('click', openAddStudentSheet);
  document.getElementById('btn-open-settings').addEventListener('click', () => { renderSettingsView(); showView('settings'); });
  document.getElementById('select-quran-font').addEventListener('change', async (e) => {
    await saveSettingsField('quranFont', e.target.value);
    applyFonts();
  });
  document.getElementById('select-ui-font').addEventListener('change', async (e) => {
    await saveSettingsField('uiFont', e.target.value);
    applyFonts();
  });
  document.getElementById('input-search-students').addEventListener('input', (e) => {
    e.stopPropagation();
    renderStudents();
  });

  document.getElementById('btn-student-cancel').addEventListener('click', () => closeSheet('sheet-student'));
  document.getElementById('btn-student-save').addEventListener('click', saveStudentFromSheet);

  document.getElementById('btn-detail-back').addEventListener('click', detailBack);
  document.getElementById('btn-detail-menu').addEventListener('click', () => openSheet('sheet-student-options'));
  document.getElementById('btn-edit-student').addEventListener('click', () => {
    closeSheet('sheet-student-options');
    const student = state.students.find(s => s.id === state.currentStudentId);
    if (student) openEditStudentSheet(student);
  });
  document.getElementById('btn-delete-student').addEventListener('click', deleteCurrentStudent);

  document.getElementById('btn-continue').addEventListener('click', () => {
    const card = document.getElementById('continue-card');
    const surahId = parseInt(card.dataset.nextSurah, 10);
    const ayah = parseInt(card.dataset.nextAyah, 10);
    if (!surahId || isNaN(surahId)) { toast('This student has completed the Quran'); return; }
    beginContinueLesson(state.currentStudentId, surahId, ayah);
  });
  document.getElementById('btn-first-lesson').addEventListener('click', () => {
    beginFreshLesson(state.currentStudentId);
  });

  document.getElementById('btn-reader-back').addEventListener('click', readerBack);
  document.getElementById('select-surah').addEventListener('change', (e) => {
    const id = parseInt(e.target.value, 10);
    if (state.selection.active && state.selection.lockedSurah && id !== state.selection.surahId) {
      toast('Finish or cancel the current selection first');
      e.target.value = String(state.readerSurahId);
      return;
    }
    openReaderSurahOnly(id);
  });
  document.getElementById('select-ayah').addEventListener('change', (e) => {
    scrollToAyah(parseInt(e.target.value, 10));
  });
  document.getElementById('btn-reader-search').addEventListener('click', () => {
    const panel = document.getElementById('jump-panel');
    const content = document.getElementById('reader-content');
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    content.classList.toggle('hidden', opening);
    if (opening) { renderJumpList(''); document.getElementById('jump-search-input').value = ''; document.getElementById('jump-search-input').focus(); }
  });
  document.getElementById('jump-search-input').addEventListener('input', (e) => renderJumpList(e.target.value));
  document.getElementById('btn-cancel-select').addEventListener('click', () => {
    const hadStudent = !!state.currentStudentId;
    resetSelection();
    showView(hadStudent ? 'detail' : 'students');
  });
  document.getElementById('btn-reader-confirm').addEventListener('click', openLessonConfirmSheet);

  document.getElementById('btn-lesson-cancel').addEventListener('click', () => { closeSheet('sheet-lesson'); state.pendingLesson = null; });
  document.getElementById('btn-lesson-save').addEventListener('click', saveLessonFromSheet);
  document.getElementById('btn-edit-range').addEventListener('click', openManualRangeSheet);

  document.getElementById('btn-manual-cancel').addEventListener('click', () => closeSheet('sheet-manual-range'));
  document.getElementById('btn-manual-apply').addEventListener('click', applyManualRange);

  document.getElementById('btn-share-download').addEventListener('click', shareCardDownload);
  document.getElementById('btn-share-whatsapp').addEventListener('click', shareCardWhatsapp);
  document.getElementById('sheet-share').addEventListener('click', (e) => { if (e.target.id === 'sheet-share') closeSheet('sheet-share'); });

  document.getElementById('btn-settings-back').addEventListener('click', () => showView('students'));
  document.getElementById('btn-upload-logo').addEventListener('click', () => document.getElementById('input-logo').click());
  document.getElementById('input-logo').addEventListener('change', (e) => handleLogoUpload(e.target.files[0]));
  document.getElementById('input-school-name').addEventListener('change', (e) => saveSettingsField('schoolName', e.target.value.trim()));
  document.getElementById('btn-export-data').addEventListener('click', exportBackup);
  document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('input-import').click());
  document.getElementById('input-import').addEventListener('change', (e) => importBackup(e.target.files[0]));

  document.querySelectorAll('.sheet-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(ov.id); });
  });

  document.getElementById('btn-confirm-ok').addEventListener('click', () => _closeConfirm(true));
  document.getElementById('btn-confirm-cancel').addEventListener('click', () => _closeConfirm(false));
  document.getElementById('sheet-confirm').addEventListener('click', (e) => {
    if (e.target.id === 'sheet-confirm') _closeConfirm(false);
  });
}

/* ---------------------------- Hardware back button (Android) ---------------------------- */
/* Trap the browser back via the History API so the device back button walks one
   step back inside the app (close sheets, then views) instead of closing it. */

let exitToastShown = false;
let exitToastTimer = null;

function doAppBack() {
  const sheets = [...document.querySelectorAll('.sheet-overlay')]
    .filter(o => !o.classList.contains('hidden'));
  if (sheets.length) {
    closeSheet(sheets[sheets.length - 1].id);
    return true;
  }
  const jump = document.getElementById('jump-panel');
  if (!jump.classList.contains('hidden')) {
    jump.classList.add('hidden');
    document.getElementById('reader-content').classList.remove('hidden');
    return true;
  }
  if (state.selection && state.selection.active) {
    resetSelection();
    return true;
  }
  switch (state.view) {
    case 'detail': detailBack(); return true;
    case 'reader': readerBack(); return true;
    case 'settings': showView('students'); return true;
    case 'students': {
      const search = document.getElementById('input-search-students');
      if (search.value) { search.value = ''; renderStudents(); return true; }
      return false;
    }
  }
  return false;
}

function onHardwareBack() {
  if (doAppBack()) {
    exitToastShown = false;
    if (exitToastTimer) clearTimeout(exitToastTimer);
    history.pushState({ app: 1 }, '');
    return;
  }
  if (!exitToastShown) {
    exitToastShown = true;
    toast('Press back again to exit');
    history.pushState({ app: 1 }, '');
    exitToastTimer = setTimeout(() => { exitToastShown = false; }, 2000);
  }
}

/* ---------------------------- Init ---------------------------- */

async function init() {
  wireEvents();
  document.querySelectorAll('.sheet-overlay').forEach(attachSheetDismiss);
  attachReaderSwipe();
  attachEdgeBack('view-detail', detailBack);
  attachEdgeBack('view-reader', readerBack);
  history.pushState({ app: 1 }, '');
  window.addEventListener('popstate', onHardwareBack);
  await loadQuranData();
  populateSurahSelect();
  await loadAppData();
  applyFonts();
  renderStudents();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);


