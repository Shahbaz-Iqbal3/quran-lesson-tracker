'use strict';

/* =========================================================================
   SABAQ — Quran lesson tracker
   Single-file app logic: storage, navigation, reader, share-card export.
   ========================================================================= */

/* ---------------------------- Constants ---------------------------- */

const AVATAR_COLORS = ['#123832', '#B08D2B', '#5C7A5A', '#A8562E', '#6B5CA5', '#3F6C7A'];

const DB_NAME = 'sabaq-db';
const DB_VERSION = 1;
const STORES = ['students', 'lessons', 'settings'];

/* ---------------------------- State ---------------------------- */

const state = {
  view: 'students',           // students | detail | reader | settings
  students: [],
  lessons: [],
  settings: { schoolName: '', logoDataUrl: '', brandColorIdx: 0 },
  quran: [],                  // [{id, name, translit, verses:[...]}]
  surahIndex: [],             // [{id, name, translit, count}]
  currentStudentId: null,

  // reader / selection state
  readerSurahId: 1,
  selection: {
    active: false,            // true while picking start/end via tap
    mode: null,               // 'start' | 'end'
    forStudentId: null,
    surahId: null,
    start: null,
    end: null,
    lockedSurah: false,       // true once a start ayah has been tapped
    editingLessonId: null     // set when re-selecting range for an existing lesson
  },

  pendingLesson: null,        // {studentId, surahId, start, end, lessonId?}
  shareLessonId: null
};

/* ---------------------------- IndexedDB ---------------------------- */

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

/* ---------------------------- Utilities ---------------------------- */

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

function lessonsForStudent(studentId) {
  return state.lessons
    .filter(l => l.studentId === studentId)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

function lastLessonFor(studentId) {
  const list = lessonsForStudent(studentId);
  return list.length ? list[0] : null;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2200);
}

/** Given a surah+ayah, return the next ayah reference (rolling into next surah if needed). */
function nextAyahRef(surahId, ayah) {
  const meta = surahMeta(surahId);
  if (!meta) return null;
  if (ayah < meta.count) return { surahId, ayah: ayah + 1 };
  if (surahId < 114) return { surahId: surahId + 1, ayah: 1 };
  return null; // end of Quran
}

/* ---------------------------- Data loading ---------------------------- */

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

/* ---------------------------- View navigation ---------------------------- */

function showView(name) {
  state.view = name;
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + name).classList.remove('hidden');
  document.getElementById('bottom-nav').classList.toggle('hidden', name === 'detail' || name === 'settings');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', (name === 'students' && b.dataset.tab === 'students') || (name === 'reader' && b.dataset.tab === 'reader'));
  });
  window.scrollTo(0, 0);
}

function openSheet(id) { document.getElementById(id).classList.remove('hidden'); }
function closeSheet(id) { document.getElementById(id).classList.add('hidden'); }

/* ---------------------------- Rendering: Students list ---------------------------- */

function renderStudents() {
  const list = document.getElementById('student-list');
  const empty = document.getElementById('student-empty');
  list.innerHTML = '';

  if (!state.students.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  for (const student of state.students) {
    const last = lastLessonFor(student.id);
    const card = document.createElement('button');
    card.className = 'student-card';
    card.setAttribute('data-student-id', student.id);

    let threadHtml = `<div class="empty-note">No lessons yet</div>`;
    if (last) {
      const meta = surahMeta(last.surahId);
      threadHtml = `<div class="thread-line"><span class="dot"></span>${meta.translit} ${last.startAyah}–${last.endAyah} · ${formatDateHuman(last.date)}</div>`;
    }

    card.innerHTML = `
      <div class="avatar" style="background:${AVATAR_COLORS[student.colorIdx % AVATAR_COLORS.length]}">${initials(student.name)}</div>
      <div class="info">
        <div class="name">${escapeHtml(student.name)}</div>
        ${threadHtml}
      </div>
      <svg class="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    `;
    card.addEventListener('click', () => openStudentDetail(student.id));
    list.appendChild(card);
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ---------------------------- Rendering: Student detail ---------------------------- */

function openStudentDetail(studentId) {
  state.currentStudentId = studentId;
  renderStudentDetail();
  showView('detail');
}

function renderStudentDetail() {
  const student = state.students.find(s => s.id === state.currentStudentId);
  if (!student) { showView('students'); return; }

  document.getElementById('detail-avatar').style.background = AVATAR_COLORS[student.colorIdx % AVATAR_COLORS.length];
  document.getElementById('detail-avatar').textContent = initials(student.name);
  document.getElementById('detail-name').textContent = student.name;

  const lessons = lessonsForStudent(student.id);
  document.getElementById('detail-sub').textContent = lessons.length
    ? `${lessons.length} lesson${lessons.length > 1 ? 's' : ''} recorded`
    : 'No lessons yet';

  const continueCard = document.getElementById('continue-card');
  const firstBtn = document.getElementById('btn-first-lesson');

  if (lessons.length) {
    const last = lessons[0];
    const meta = surahMeta(last.surahId);
    const next = nextAyahRef(last.surahId, last.endAyah);
    continueCard.classList.remove('hidden');
    firstBtn.classList.add('hidden');
    if (next) {
      const nextMeta = surahMeta(next.surahId);
      document.getElementById('continue-ref').innerHTML =
        `${nextMeta.translit} <span class="ar">${nextMeta.name}</span> · Ayah ${next.ayah}`;
      document.getElementById('continue-desc').textContent =
        `Last lesson ended at ${meta.translit} ${last.endAyah} on ${formatDateHuman(last.date)}`;
      continueCard.dataset.nextSurah = next.surahId;
      continueCard.dataset.nextAyah = next.ayah;
    } else {
      document.getElementById('continue-ref').textContent = 'Quran complete 🎉';
      document.getElementById('continue-desc').textContent = 'This student has finished the entire Quran.';
      continueCard.dataset.nextSurah = '';
    }
  } else {
    continueCard.classList.add('hidden');
    firstBtn.classList.remove('hidden');
  }

  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  historyList.innerHTML = '';
  if (!lessons.length) {
    historyEmpty.classList.remove('hidden');
  } else {
    historyEmpty.classList.add('hidden');
    for (const lesson of lessons) {
      const meta = surahMeta(lesson.surahId);
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `
        <div class="thread-marker"><div class="knot"></div><div class="stem"></div></div>
        <div class="history-body">
          <div class="ref-line">
            <span class="surah-name">${meta.translit}</span>
            <span class="ayat-range">${lesson.startAyah}–${lesson.endAyah}</span>
          </div>
          <div class="date">${formatDateHuman(lesson.date)}${lesson.note ? ' · ' + escapeHtml(lesson.note) : ''}</div>
        </div>
        <div class="history-actions">
          <button class="icon-btn-sm" data-action="share" data-lesson-id="${lesson.id}" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
          </button>
          <button class="icon-btn-sm" data-action="edit" data-lesson-id="${lesson.id}" aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn-sm" data-action="delete" data-lesson-id="${lesson.id}" aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      `;
      row.querySelector('[data-action="share"]').addEventListener('click', () => openShareSheet(lesson.id));
      row.querySelector('[data-action="edit"]').addEventListener('click', () => editLesson(lesson.id));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteLesson(lesson.id));
      historyList.appendChild(row);
    }
  }
}

/* ---------------------------- Reader ---------------------------- */

function populateSurahSelect() {
  const sel = document.getElementById('select-surah');
  sel.innerHTML = state.surahIndex.map(s => `<option value="${s.id}">${s.id}. ${s.translit}</option>`).join('');
  const manualSel = document.getElementById('manual-surah');
  manualSel.innerHTML = state.surahIndex.map(s => `<option value="${s.id}">${s.id}. ${s.translit}</option>`).join('');
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
  if (ayah) {
    requestAnimationFrame(() => scrollToAyah(ayah, true));
  }
  updateSelectionBanner();
}

function renderReaderContent(surahId) {
  const surah = surahById(surahId);
  const meta = surahMeta(surahId);
  const container = document.getElementById('reader-content');
  container.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'surah-heading';
  heading.innerHTML = `<div class="name-ar">${surah.name}</div><div class="name-translit">${meta.id}. ${meta.translit} · ${meta.count} ayat</div>`;
  container.appendChild(heading);

  if (surahId !== 9 && surahId !== 1) {
    const bismillah = document.createElement('div');
    bismillah.className = 'bismillah';
    bismillah.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
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
  document.querySelectorAll('.ayah-block').forEach(b => b.classList.remove('in-lesson', 'lesson-start', 'lesson-end'));
  const sel = state.selection;
  if (!sel.active || sel.surahId !== state.readerSurahId) return;
  const start = sel.start, end = sel.mode === 'end' ? null : null;
  if (sel.start) {
    const endVal = sel.end || sel.start;
    const lo = Math.min(sel.start, endVal), hi = Math.max(sel.start, endVal);
    for (let a = lo; a <= hi; a++) {
      const el = document.querySelector(`.ayah-block[data-ayah="${a}"]`);
      if (el) el.classList.add('in-lesson');
    }
    const startEl = document.querySelector(`.ayah-block[data-ayah="${sel.start}"]`);
    if (startEl) startEl.classList.add('lesson-start');
  }
}

function updateSelectionBanner() {
  const banner = document.getElementById('selecting-banner');
  const text = document.getElementById('selecting-banner-text');
  if (!state.selection.active) { banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  text.textContent = state.selection.mode === 'start'
    ? "Tap the ayah where today's lesson starts"
    : "Tap the ayah where today's lesson ends";
}

function handleAyahTap(surahId, ayah, blockEl) {
  const sel = state.selection;
  if (!sel.active) {
    // free browsing tap — just a gentle highlight pulse, no-op otherwise
    return;
  }
  if (sel.lockedSurah && surahId !== sel.surahId) {
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
      // teacher tapped before the start — treat as redefining the start point
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
    lessonId: sel.editingLessonId
  };
  resetSelection();
  openLessonConfirmSheet();
}

function resetSelection() {
  state.selection = { active: false, mode: null, forStudentId: null, surahId: null, start: null, end: null, lockedSurah: false, editingLessonId: null };
  document.getElementById('selecting-banner').classList.add('hidden');
  applySelectionHighlight();
}

/* Start "new lesson" flow — continuing from last lesson end (start is fixed) */
function beginContinueLesson(studentId, surahId, ayah) {
  state.selection = {
    active: true, mode: 'end', forStudentId: studentId,
    surahId, start: ayah, end: null, lockedSurah: true, editingLessonId: null
  };
  openReader(surahId, ayah);
}

/* Start "first lesson" flow — teacher picks both start and end */
function beginFreshLesson(studentId) {
  state.selection = {
    active: true, mode: 'start', forStudentId: studentId,
    surahId: null, start: null, end: null, lockedSurah: false, editingLessonId: null
  };
  openReader(state.readerSurahId || 1, 1);
}

/* ---------------------------- Lesson confirm sheet ---------------------------- */

function openLessonConfirmSheet() {
  const pl = state.pendingLesson;
  const student = state.students.find(s => s.id === pl.studentId);
  const meta = surahMeta(pl.surahId);

  document.getElementById('lesson-student-name').textContent = `For ${student.name}`;
  document.getElementById('lesson-range-surah').innerHTML = `${meta.translit} <span style="font-family:var(--font-arabic);font-size:15px">${meta.name}</span>`;
  document.getElementById('lesson-range-ayat').textContent = `Ayah ${pl.start}–${pl.end}`;
  document.getElementById('input-lesson-date').value = todayIso();
  document.getElementById('input-lesson-note').value = '';
  openSheet('sheet-lesson');
}

async function saveLessonFromSheet() {
  const pl = state.pendingLesson;
  const date = document.getElementById('input-lesson-date').value || todayIso();
  const note = document.getElementById('input-lesson-note').value.trim();

  const lesson = {
    id: pl.lessonId || uid(),
    studentId: pl.studentId,
    surahId: pl.surahId,
    startAyah: pl.start,
    endAyah: pl.end,
    date,
    note,
    createdAt: pl.lessonId
      ? (state.lessons.find(l => l.id === pl.lessonId) || {}).createdAt || new Date().toISOString()
      : new Date().toISOString()
  };

  await dbPut('lessons', lesson);
  const idx = state.lessons.findIndex(l => l.id === lesson.id);
  if (idx >= 0) state.lessons[idx] = lesson; else state.lessons.push(lesson);

  closeSheet('sheet-lesson');
  state.pendingLesson = null;
  state.currentStudentId = pl.studentId;
  renderStudents();
  renderStudentDetail();
  showView('detail');
  toast('Lesson saved');
}

function editLesson(lessonId) {
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  state.pendingLesson = {
    studentId: lesson.studentId, surahId: lesson.surahId,
    start: lesson.startAyah, end: lesson.endAyah, lessonId: lesson.id
  };
  document.getElementById('lesson-student-name').textContent =
    `For ${state.students.find(s => s.id === lesson.studentId).name}`;
  const meta = surahMeta(lesson.surahId);
  document.getElementById('lesson-range-surah').innerHTML = `${meta.translit} <span style="font-family:var(--font-arabic);font-size:15px">${meta.name}</span>`;
  document.getElementById('lesson-range-ayat').textContent = `Ayah ${lesson.startAyah}–${lesson.endAyah}`;
  document.getElementById('input-lesson-date').value = lesson.date;
  document.getElementById('input-lesson-note').value = lesson.note || '';
  openSheet('sheet-lesson');
}

async function deleteLesson(lessonId) {
  if (!confirm('Delete this lesson entry?')) return;
  await dbDelete('lessons', lessonId);
  state.lessons = state.lessons.filter(l => l.id !== lessonId);
  renderStudents();
  renderStudentDetail();
  toast('Lesson deleted');
}

/* Manual range entry (edit icon inside the confirm sheet) */
function openManualRangeSheet() {
  const pl = state.pendingLesson;
  document.getElementById('manual-surah').value = String(pl.surahId);
  document.getElementById('manual-start').value = pl.start;
  document.getElementById('manual-end').value = pl.end;
  openSheet('sheet-manual-range');
}

function applyManualRange() {
  const surahId = parseInt(document.getElementById('manual-surah').value, 10);
  const meta = surahMeta(surahId);
  let start = parseInt(document.getElementById('manual-start').value, 10);
  let end = parseInt(document.getElementById('manual-end').value, 10);
  if (!start || !end) { toast('Enter both ayah numbers'); return; }
  start = Math.max(1, Math.min(start, meta.count));
  end = Math.max(1, Math.min(end, meta.count));
  if (end < start) { const t = start; start = end; end = t; }

  state.pendingLesson.surahId = surahId;
  state.pendingLesson.start = start;
  state.pendingLesson.end = end;

  document.getElementById('lesson-range-surah').innerHTML = `${meta.translit} <span style="font-family:var(--font-arabic);font-size:15px">${meta.name}</span>`;
  document.getElementById('lesson-range-ayat').textContent = `Ayah ${start}–${end}`;

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

/* ---------------------------- Share card (canvas) ---------------------------- */

async function ensureFontsReady() {
  const specs = [
    '900 64px Fraunces', '700 40px Fraunces', '600 30px Fraunces',
    '400 60px "Amiri Quran"',
    '600 26px Inter', '700 26px Inter', '500 22px Inter', '400 22px Inter'
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
  const brand = AVATAR_COLORS[state.settings.brandColorIdx % AVATAR_COLORS.length];

  await ensureFontsReady();

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, shadeColor(brand, -8));
  grad.addColorStop(1, shadeColor(brand, 14));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Inset border frame
  ctx.strokeStyle = 'rgba(246,239,224,0.28)';
  ctx.lineWidth = 2;
  roundRect(ctx, 44, 44, W - 88, H - 88, 28);
  ctx.stroke();

  // Corner flourish (quarter arcs, subtle)
  drawCornerFlourish(ctx, 44, 44, 1, 1);
  drawCornerFlourish(ctx, W - 44, 44, -1, 1);
  drawCornerFlourish(ctx, 44, H - 44, 1, -1);
  drawCornerFlourish(ctx, W - 44, H - 44, -1, -1);

  const cx = W / 2;
  const student = state.students.find(s => s.id === lesson.studentId);
  const meta = surahMeta(lesson.surahId);
  const school = state.settings.schoolName || 'Sabaq';

  // Pre-measure the student name wrap so we can center the whole block vertically
  ctx.font = '900 68px Fraunces';
  const nameLines = wrapCanvasText(ctx, student ? student.name : 'Student', W - 200);
  const hasLogo = !!state.settings.logoDataUrl;

  let blockHeight = (hasLogo ? 76 : 0) + 56 + 64 + nameLines.length * 74 + 14 + 60 + 66 + 76 + 76 + 96;
  let y = Math.max(150, (H - blockHeight) / 2 - 40);

  // Logo + school name
  if (hasLogo) {
    try {
      const img = await loadImage(state.settings.logoDataUrl);
      const size = 84;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, y, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - size / 2, y - size / 2, size, size);
      ctx.restore();
      ctx.strokeStyle = 'rgba(246,239,224,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, y, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      y += 76;
    } catch (e) { /* ignore broken logo */ }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F6EFE0';
  ctx.font = '600 26px Inter';
  ctx.fillText(school, cx, y);
  y += 56;

  // Eyebrow
  ctx.fillStyle = '#E4D3A0';
  ctx.font = '700 22px Inter';
  ctx.save();
  ctx.letterSpacing = '4px';
  ctx.fillText("TODAY'S LESSON", cx, y);
  ctx.restore();
  y += 64;

  // Student name (wraps)
  ctx.fillStyle = '#FFFDF6';
  ctx.font = '900 68px Fraunces';
  for (const line of nameLines) { ctx.fillText(line, cx, y); y += 74; }
  y += 14;

  // Thread divider
  drawThreadDivider(ctx, cx, y, 240);
  y += 60;

  // Surah name (arabic) + transliteration
  ctx.fillStyle = '#F6EFE0';
  ctx.font = '400 64px "Amiri Quran"';
  ctx.fillText(meta.name, cx, y + 10);
  y += 66;
  ctx.fillStyle = 'rgba(246,239,224,0.72)';
  ctx.font = '500 24px Inter';
  ctx.save();
  ctx.letterSpacing = '2px';
  ctx.fillText(`SURAH ${meta.id} · ${meta.translit.toUpperCase()}`, cx, y);
  ctx.restore();
  y += 76;

  // Ayah range big numbers
  ctx.fillStyle = '#E4D3A0';
  ctx.font = '700 20px Inter';
  ctx.save();
  ctx.letterSpacing = '3px';
  ctx.fillText('AYAH', cx, y);
  ctx.restore();
  y += 78;
  ctx.fillStyle = '#FFFDF6';
  ctx.font = '700 100px Fraunces';
  ctx.fillText(`${lesson.startAyah}–${lesson.endAyah}`, cx, y);
  y += 56;

  // Note, if present, sits just under the ayah range
  if (lesson.note) {
    ctx.fillStyle = 'rgba(246,239,224,0.6)';
    ctx.font = 'italic 400 22px Inter';
    const noteLines = wrapCanvasText(ctx, '“' + lesson.note + '”', W - 280);
    for (const line of noteLines.slice(0, 2)) { ctx.fillText(line, cx, y); y += 32; }
  }

  // Decorative stitched thread running the width of the card — the app's signature motif
  drawStitchedThread(ctx, cx, H - 220, W - 200);

  // Footer: date + wordmark
  ctx.fillStyle = 'rgba(246,239,224,0.65)';
  ctx.font = '500 22px Inter';
  ctx.fillText(formatDateHuman(lesson.date), cx, H - 150);

  ctx.fillStyle = 'rgba(246,239,224,0.4)';
  ctx.font = '700 18px Inter';
  ctx.save();
  ctx.letterSpacing = '3px';
  ctx.fillText('SABAQ', cx, H - 90);
  ctx.restore();
}

function drawStitchedThread(ctx, cx, y, width) {
  const left = cx - width / 2, right = cx + width / 2;
  ctx.strokeStyle = 'rgba(176,141,43,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 14]);
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  ctx.setLineDash([]);
  // three knots along the thread — start, a lesson-in-progress, and today
  [0.18, 0.5, 0.82].forEach((t, i) => {
    const x = left + width * t;
    ctx.fillStyle = i === 2 ? '#B08D2B' : 'rgba(176,141,43,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, i === 2 ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawThreadDivider(ctx, cx, y, width) {
  ctx.strokeStyle = '#B08D2B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, y);
  ctx.lineTo(cx - 14, y);
  ctx.moveTo(cx + 14, y);
  ctx.lineTo(cx + width / 2, y);
  ctx.stroke();
  ctx.fillStyle = '#B08D2B';
  ctx.beginPath();
  ctx.arc(cx, y, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawCornerFlourish(ctx, x, y, dx, dy) {
  ctx.strokeStyle = 'rgba(176,141,43,0.55)';
  ctx.lineWidth = 2;
  for (let r = 16; r <= 40; r += 12) {
    ctx.beginPath();
    ctx.arc(x + dx * 4, y + dy * 4, r, Math.PI + (dx < 0 ? Math.PI / 2 : 0) * 0, Math.PI * 2, false);
    ctx.stroke();
  }
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

function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
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
  document.getElementById('share-sub').textContent = `For ${student ? student.name : ''} · ${formatDateHuman(lesson.date)}`;
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
      // fall through to fallback below
    }
  }
  // Fallback: save the image, then open WhatsApp with the text pre-filled
  await shareCardDownload();
  toast('Image saved — attach it in WhatsApp');
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

/* ---------------------------- Add / edit student ---------------------------- */

let editingStudentId = null;

function openAddStudentSheet() {
  editingStudentId = null;
  document.getElementById('student-sheet-title').textContent = 'Add student';
  document.getElementById('input-student-name').value = '';
  renderColorRow('student-color-row', 0);
  openSheet('sheet-student');
  setTimeout(() => document.getElementById('input-student-name').focus(), 200);
}

function openEditStudentSheet(student) {
  editingStudentId = student.id;
  document.getElementById('student-sheet-title').textContent = 'Edit student';
  document.getElementById('input-student-name').value = student.name;
  renderColorRow('student-color-row', student.colorIdx);
  openSheet('sheet-student');
}

function renderColorRow(containerId, selectedIdx) {
  const row = document.getElementById(containerId);
  row.innerHTML = AVATAR_COLORS.map((c, i) => `<div class="color-dot ${i === selectedIdx ? 'selected' : ''}" data-idx="${i}" style="background:${c}"></div>`).join('');
  row.dataset.selected = selectedIdx;
  row.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      row.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      row.dataset.selected = dot.dataset.idx;
    });
  });
}

async function saveStudentFromSheet() {
  const name = document.getElementById('input-student-name').value.trim();
  if (!name) { toast('Enter a name'); return; }
  const colorIdx = parseInt(document.getElementById('student-color-row').dataset.selected || '0', 10);

  if (editingStudentId) {
    const student = state.students.find(s => s.id === editingStudentId);
    student.name = name;
    student.colorIdx = colorIdx;
    await dbPut('students', student);
  } else {
    const student = { id: uid(), name, colorIdx, createdAt: new Date().toISOString() };
    await dbPut('students', student);
    state.students.push(student);
  }
  state.students.sort((a, b) => a.name.localeCompare(b.name));
  closeSheet('sheet-student');
  renderStudents();
  if (state.view === 'detail') renderStudentDetail();
  toast('Saved');
}

async function deleteCurrentStudent() {
  if (!confirm('Delete this student and all their lesson history? This cannot be undone.')) return;
  const id = state.currentStudentId;
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

/* ---------------------------- Settings ---------------------------- */

function renderSettingsView() {
  document.getElementById('input-school-name').value = state.settings.schoolName || '';
  const preview = document.getElementById('logo-preview');
  if (state.settings.logoDataUrl) {
    preview.innerHTML = `<img src="${state.settings.logoDataUrl}" alt="Logo">`;
  } else {
    preview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="22" height="22"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.83 0L15 15"/><path d="M14 14l1.5-1.5a2 2 0 0 1 2.83 0L21 15"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>`;
  }
  renderColorRow('brand-color-row', state.settings.brandColorIdx || 0);
  // brand row selection should persist live to settings on click
  document.querySelectorAll('#brand-color-row .color-dot').forEach(dot => {
    dot.addEventListener('click', () => { saveSettingsField('brandColorIdx', parseInt(dot.dataset.idx, 10)); });
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
    // downscale to keep storage small
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
    if (!confirm(`Import ${payload.students.length} student(s) and ${payload.lessons.length} lesson(s)? This merges with existing data.`)) return;
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
  // bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      resetSelection();
      if (btn.dataset.tab === 'students') showView('students');
      if (btn.dataset.tab === 'reader') openReader(state.readerSurahId || 1, null);
    });
  });

  // students view
  document.getElementById('btn-add-student').addEventListener('click', openAddStudentSheet);
  document.getElementById('btn-open-settings').addEventListener('click', () => { renderSettingsView(); showView('settings'); });

  // student sheet
  document.getElementById('btn-student-cancel').addEventListener('click', () => closeSheet('sheet-student'));
  document.getElementById('btn-student-save').addEventListener('click', saveStudentFromSheet);

  // detail view
  document.getElementById('btn-detail-back').addEventListener('click', () => showView('students'));
  document.getElementById('btn-detail-menu').addEventListener('click', () => openSheet('sheet-student-options'));
  document.getElementById('btn-edit-student').addEventListener('click', () => {
    closeSheet('sheet-student-options');
    const student = state.students.find(s => s.id === state.currentStudentId);
    openEditStudentSheet(student);
  });
  document.getElementById('btn-delete-student').addEventListener('click', deleteCurrentStudent);

  document.getElementById('btn-new-lesson').addEventListener('click', () => {
    const card = document.getElementById('continue-card');
    const surahId = parseInt(card.dataset.nextSurah, 10);
    const ayah = parseInt(card.dataset.nextAyah, 10);
    if (!surahId) { toast('This student has completed the Quran'); return; }
    beginContinueLesson(state.currentStudentId, surahId, ayah);
  });
  document.getElementById('btn-first-lesson').addEventListener('click', () => {
    beginFreshLesson(state.currentStudentId);
  });

  // reader view
  document.getElementById('btn-reader-back').addEventListener('click', () => {
    if (state.selection.active) { resetSelection(); }
    showView(state.currentStudentId ? 'detail' : 'students');
  });
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
    resetSelection();
    showView(state.currentStudentId ? 'detail' : 'students');
  });

  // lesson confirm sheet
  document.getElementById('btn-lesson-cancel').addEventListener('click', () => { closeSheet('sheet-lesson'); state.pendingLesson = null; });
  document.getElementById('btn-lesson-save').addEventListener('click', saveLessonFromSheet);
  document.getElementById('btn-edit-range').addEventListener('click', openManualRangeSheet);

  // manual range sheet
  document.getElementById('btn-manual-cancel').addEventListener('click', () => closeSheet('sheet-manual-range'));
  document.getElementById('btn-manual-apply').addEventListener('click', applyManualRange);

  // share sheet
  document.getElementById('btn-share-download').addEventListener('click', shareCardDownload);
  document.getElementById('btn-share-whatsapp').addEventListener('click', shareCardWhatsapp);
  document.getElementById('sheet-share').addEventListener('click', (e) => { if (e.target.id === 'sheet-share') closeSheet('sheet-share'); });

  // settings view
  document.getElementById('btn-settings-back').addEventListener('click', () => showView('students'));
  document.getElementById('btn-upload-logo').addEventListener('click', () => document.getElementById('input-logo').click());
  document.getElementById('input-logo').addEventListener('change', (e) => handleLogoUpload(e.target.files[0]));
  document.getElementById('input-school-name').addEventListener('change', (e) => saveSettingsField('schoolName', e.target.value.trim()));
  document.getElementById('btn-export-data').addEventListener('click', exportBackup);
  document.getElementById('btn-import-data').addEventListener('click', () => document.getElementById('input-import').click());
  document.getElementById('input-import').addEventListener('change', (e) => importBackup(e.target.files[0]));

  // dismiss sheets on backdrop click
  document.querySelectorAll('.sheet-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.add('hidden'); });
  });
}

/* ---------------------------- Init ---------------------------- */

async function init() {
  wireEvents();
  await loadQuranData();
  populateSurahSelect();
  await loadAppData();
  renderStudents();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
