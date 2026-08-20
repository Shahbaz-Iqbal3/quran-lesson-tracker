# Sabaq — Quran Lesson Tracker

A installable, offline-first PWA for Quran teachers to track each student's
daily lesson (sabaq) and share it to WhatsApp as a branded image card.

## What it does

- **Students** — add each student once. Their card shows where they left off.
- **Continuing lessons** — tap "New lesson" and the app already knows where
  yesterday's lesson ended (e.g. `10:33`) — you just tap the ayah where
  today's lesson ends. No retyping ranges.
- **Full Mushaf navigation** — every ayah of the Quran, Arabic text, browsable
  by surah or jumped to directly. Tapping a past lesson opens the reader at
  that exact ayah.
- **Share to WhatsApp** — every lesson can be exported as a branded image
  card (your logo, school name, accent color) and shared straight to
  WhatsApp via the native share sheet, or downloaded and attached manually.
- **Fully offline, on-device** — no login, no server. All data lives in the
  browser's IndexedDB via a service worker, so it keeps working with no
  signal. Use Settings → Export backup occasionally, since data is local to
  one device/browser only (as you asked for).

## Running it

Any static file server works — the app is plain HTML/CSS/JS, no build step.

```bash
cd quran-lesson-tracker
python3 -m http.server 8080
# open http://localhost:8080
```

**Important:** service workers (needed for offline support) only work over
`https://` or `localhost`. For real teacher use, host it on any static host
over HTTPS — GitHub Pages, Netlify, Vercel, Cloudflare Pages, or your own
server all work with zero configuration changes.

## Installing as an app

Once hosted over HTTPS, open the site on a phone:
- **Android/Chrome**: menu → "Install app" / "Add to Home screen"
- **iPhone/Safari**: Share button → "Add to Home Screen"

It then behaves like a native app — own icon, no browser bar, works offline.

## Data notes

- Quran text is the Uthmani-style Arabic script (114 surahs, 6,236 ayat),
  bundled locally in `data/quran-data.json` so navigation works fully
  offline after the first load.
- A lesson range is assumed to stay within a single surah (matching how you
  described lessons — e.g. `10.20–10.32`). If a real lesson ever crosses a
  surah boundary, log it as two lesson entries for that day.
- "Delete student" removes that student's whole lesson history — the app
  asks for confirmation first.

## File structure

```
index.html            App shell — all views
style.css              Design tokens + styles
app.js                  All app logic (storage, reader, share-card export)
service-worker.js      Offline caching
manifest.json           PWA install config
data/quran-data.json    Full Quran Arabic text, by surah
data/surah-index.json   Surah names + ayah counts (lightweight index)
assets/fonts/           Self-hosted fonts (Amiri Quran, Fraunces, Inter)
assets/icons/           App icons
```

## Customizing

- Colors/type live as CSS variables at the top of `style.css`.
- Avatar/brand color palette is the `AVATAR_COLORS` array at the top of
  `app.js` — add or change hex values there.
- The share-card layout is generated in `drawShareCard()` in `app.js`.
