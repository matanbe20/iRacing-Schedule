// Populate season info from data.js
document.getElementById('season-label').textContent = SEASON_LABEL;
document.getElementById('season-dates').textContent = SEASON_DATES;
document.title = 'iRacing ' + SEASON_LABEL + ' Schedule';

// Determine current week
function getCurrentWeek() {
  const seasonStart = new Date('2026-03-17');
  const now = new Date();
  const diff = now - seasonStart;
  if (diff < 0) return 1;
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(week, 12);
}

const currentWeek = getCurrentWeek();

function getWeekDateRange(weekNum) {
  const seasonStart = new Date('2026-03-17');
  const start = new Date(seasonStart.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt = d => months[d.getMonth()] + ' ' + d.getDate();
  return 'Week ' + weekNum + ' \u2014 ' + fmt(start) + ' \u2013 ' + fmt(end);
}

// Category to CSS class mapping
function catClass(cat) {
  return {
    'OVAL': 'oval',
    'SPORTS CAR': 'sports',
    'FORMULA CAR': 'formula',
    'DIRT OVAL': 'dirt-oval',
    'DIRT ROAD': 'dirt-road',
    'UNRANKED': 'unranked'
  }[cat] || 'unranked';
}

function catLabel(cat) {
  return {
    'OVAL': 'Oval',
    'SPORTS CAR': 'Sports Car',
    'FORMULA CAR': 'Formula',
    'DIRT OVAL': 'Dirt Oval',
    'DIRT ROAD': 'Dirt Road',
    'UNRANKED': 'Unranked'
  }[cat] || cat;
}

function catLabelShort(cat) {
  return {
    'OVAL': 'Oval',
    'SPORTS CAR': 'S.Car',
    'FORMULA CAR': 'Formula',
    'DIRT OVAL': 'D.Oval',
    'DIRT ROAD': 'D.Road',
    'UNRANKED': 'Unrnk'
  }[cat] || cat;
}

// All possible values
const ALL_CATEGORIES = ["OVAL", "SPORTS CAR", "FORMULA CAR", "DIRT OVAL", "DIRT ROAD", "UNRANKED"];
const ALL_CLASSES = ["R", "D", "C", "B", "A"];
const STORAGE_KEY = 'iracing-2026s2-filters';
const MY_SCHEDULE_KEY = 'iracing-2026s2-my-schedule';
const FAVORITES_KEY = 'iracing-2026s2-favorites';
let mySchedule = {};
let favorites = new Set();
let activeTab = 'all';

// Load state: URL params take priority > localStorage > defaults (all active)
function loadState() {
  const params = new URLSearchParams(window.location.search);
  const hasUrlParams = params.has('cat') || params.has('cls') || params.has('q') || params.has('cars') || params.has('tracks');

  if (hasUrlParams) {
    const cats = params.get('cat');
    const cls = params.get('cls');
    const cars = params.get('cars');
    const tracks = params.get('tracks');
    return {
      categories: cats ? cats.split(',').filter(c => ALL_CATEGORIES.includes(c)) : [...ALL_CATEGORIES],
      classes: cls ? cls.split(',').filter(c => ALL_CLASSES.includes(c)) : [...ALL_CLASSES],
      search: params.get('q') || '',
      cars: cars ? cars.split(',').filter(Boolean) : [],
      tracks: tracks ? tracks.split(',').filter(Boolean) : []
    };
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return {
      categories: (saved.categories || ALL_CATEGORIES).filter(c => ALL_CATEGORIES.includes(c)),
      classes: (saved.classes || ALL_CLASSES).filter(c => ALL_CLASSES.includes(c)),
      search: saved.search || '',
      cars: saved.cars || [],
      tracks: saved.tracks || []
    };
  } catch {}

  return { categories: [...ALL_CATEGORIES], classes: [...ALL_CLASSES], search: '', cars: [], tracks: [] };
}

function saveState() {
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    categories: [...activeCategories],
    classes: [...activeClasses],
    search: searchQuery,
    cars: [...activeCars],
    tracks: [...activeTracks]
  }));

  // Update URL params
  const params = new URLSearchParams();
  const allCatsActive = ALL_CATEGORIES.every(c => activeCategories.has(c));
  const allClsActive = ALL_CLASSES.every(c => activeClasses.has(c));

  if (!allCatsActive) params.set('cat', [...activeCategories].join(','));
  if (!allClsActive) params.set('cls', [...activeClasses].join(','));
  if (searchQuery) params.set('q', searchQuery);
  if (activeCars.size > 0) params.set('cars', [...activeCars].join(','));
  if (activeTracks.size > 0) params.set('tracks', [...activeTracks].join(','));
  if (activeTab === 'my' || activeTab === 'week') params.set('tab', activeTab);

  const qs = params.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', url);
}

// My Schedule functions
function loadMySchedule() {
  try {
    const saved = JSON.parse(localStorage.getItem(MY_SCHEDULE_KEY));
    if (saved && typeof saved === 'object') mySchedule = saved;
  } catch {}
}

function saveMySchedule() {
  localStorage.setItem(MY_SCHEDULE_KEY, JSON.stringify(mySchedule));
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    if (Array.isArray(saved)) favorites = new Set(saved);
  } catch {}
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

function toggleFavorite(rawName) {
  if (favorites.has(rawName)) {
    favorites.delete(rawName);
  } else {
    favorites.add(rawName);
  }
  saveFavorites();
  renderThisWeek();
}

function addRace(rawName, weekNum) {
  const series = SCHEDULE_DATA.find(s => s.name === rawName);
  if (!series) return;
  const week = series.weeks.find(w => w.week === weekNum);
  if (!week) return;
  const id = rawName + '_' + weekNum;
  mySchedule[id] = {
    id,
    rawName,
    weekNum,
    displayName: cleanName(rawName),
    category: series.category,
    cls: series.class,
    cars: series.cars,
    track: week.track,
    date: week.date,
    laps: week.laps || ''
  };
  saveMySchedule();
  refreshWeekCellState(rawName, weekNum);
  updateMyScheduleBadge();
}

function removeRace(id) {
  if (!mySchedule[id]) return;
  const { rawName, weekNum } = mySchedule[id];
  delete mySchedule[id];
  saveMySchedule();
  refreshWeekCellState(rawName, weekNum);
  updateMyScheduleBadge();
  if (activeTab === 'my') renderMySchedule();
}

function toggleRace(event, rawName, weekNum) {
  event.stopPropagation();
  const id = rawName + '_' + weekNum;
  if (mySchedule[id]) {
    removeRace(id);
  } else {
    addRace(rawName, weekNum);
  }
  refreshSeriesState(rawName);
}

function isSeriesFullyAdded(rawName) {
  const series = SCHEDULE_DATA.find(s => s.name === rawName);
  if (!series) return false;
  return series.weeks.every(w => !!mySchedule[rawName + '_' + w.week]);
}

function toggleSeries(event, rawName) {
  event.stopPropagation();
  const series = SCHEDULE_DATA.find(s => s.name === rawName);
  if (!series) return;
  if (isSeriesFullyAdded(rawName)) {
    series.weeks.forEach(w => { delete mySchedule[rawName + '_' + w.week]; });
  } else {
    series.weeks.forEach(w => {
      const id = rawName + '_' + w.week;
      if (!mySchedule[id]) {
        mySchedule[id] = {
          id, rawName, weekNum: w.week,
          displayName: cleanName(rawName),
          category: series.category,
          cls: series.class,
          cars: series.cars,
          track: w.track,
          date: w.date,
          laps: w.laps || ''
        };
      }
    });
  }
  saveMySchedule();
  series.weeks.forEach(w => refreshWeekCellState(rawName, w.week));
  refreshSeriesState(rawName);
  updateMyScheduleBadge();
  if (activeTab === 'my') renderMySchedule();
  if (activeTab === 'week') renderThisWeek();
}

function refreshSeriesState(rawName) {
  const isAdded = isSeriesFullyAdded(rawName);
  document.querySelectorAll('.series-add-btn').forEach(btn => {
    if (btn.dataset.rawName === rawName) {
      btn.classList.toggle('added', isAdded);
      btn.title = isAdded ? 'Remove all weeks from My Schedule' : 'Add all weeks to My Schedule';
      btn.innerHTML = isAdded ? '&#x2713; All' : '+ All';
    }
  });
}

function refreshWeekCellState(rawName, weekNum) {
  const id = rawName + '_' + weekNum;
  const isAdded = !!mySchedule[id];
  document.querySelectorAll('.week-add-btn').forEach(btn => {
    if (btn.dataset.rawName === rawName && Number(btn.dataset.week) === weekNum) {
      btn.classList.toggle('added', isAdded);
      btn.title = isAdded ? 'Remove from My Schedule' : 'Add to My Schedule';
      btn.textContent = isAdded ? '✓' : '+';
    }
  });
}

function updateMyScheduleBadge() {
  const count = Object.keys(mySchedule).length;
  const badge = document.getElementById('my-schedule-count');
  if (badge) badge.textContent = count > 0 ? String(count) : '';
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('all-series-panel').style.display = tab === 'all' ? '' : 'none';
  document.getElementById('my-schedule-panel').style.display = tab === 'my' ? '' : 'none';
  document.getElementById('this-week-panel').style.display = tab === 'week' ? '' : 'none';
  document.getElementById('tab-all').classList.toggle('active', tab === 'all');
  document.getElementById('tab-my').classList.toggle('active', tab === 'my');
  document.getElementById('tab-week').classList.toggle('active', tab === 'week');
  if (tab === 'my') renderMySchedule();
  if (tab === 'week') renderThisWeek();
  saveState();
}

function parseDateStr(dateStr) {
  try { return new Date(dateStr + ', 2026').getTime(); } catch { return 0; }
}

function renderMySchedule() {
  const panel = document.getElementById('my-schedule-panel');
  const entries = Object.values(mySchedule);
  if (!entries.length) {
    panel.innerHTML = `<div class="my-schedule-empty">
      <p>No races saved yet.</p>
      <small>Click the <strong>+</strong> button on any week cell to add races to your schedule.</small>
    </div>`;
    return;
  }

  entries.sort((a, b) => {
    if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
    return a.displayName.localeCompare(b.displayName);
  });

  const groups = {}, groupOrder = [];
  entries.forEach(e => {
    const key = 'Week ' + e.weekNum + ' \u2014 ' + e.date;
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(e);
  });

  const headerHtml = `<div class="my-schedule-header">
    <span class="count-label">${entries.length} race${entries.length !== 1 ? 's' : ''} saved</span>
    <div class="export-group">
      <button class="export-btn" onclick="shareSchedule(this)" title="Share"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg><span class="btn-label">Share</span></button>
      <button class="export-btn" onclick="exportCSV()" title="Download CSV"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span class="btn-label">Download CSV</span></button>
      <button class="export-btn" onclick="exportICS()" title="Download .ics"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span class="btn-label">Download .ics</span></button>
    </div>
  </div>`;

  const groupsHtml = groupOrder.map(key => {
    const racesHtml = groups[key].map(e => {
      const cc = catClass(e.category);
      const safeId = e.id.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<div class="my-race-card">
        <span class="cat-badge ${cc}" data-short="${catLabelShort(e.category)}">${catLabel(e.category)}</span>
        <span class="class-badge ${e.cls}">${e.cls}</span>
        <div class="my-race-info">
          <div class="my-race-title">${e.displayName}</div>
          <div class="my-race-meta">${e.track}${e.laps ? ' \xb7 ' + e.laps : ''}${e.cars ? ' \xb7 ' + e.cars : ''}</div>
        </div>
        <button class="my-race-remove" onclick="removeRace('${safeId}')" title="Remove">&#x2715;</button>
      </div>`;
    }).join('');
    return `<div class="my-week-group"><div class="my-week-label">${key}</div>${racesHtml}</div>`;
  }).join('');

  panel.innerHTML = headerHtml + groupsHtml;
}

function exportICS() {
  const entries = Object.values(mySchedule);
  if (!entries.length) return;
  entries.sort((a, b) => parseDateStr(a.date) - parseDateStr(b.date));
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//iRacing Schedule//2026 Season 2//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
  ];
  entries.forEach(e => {
    const d = new Date(e.date + ', 2026');
    const ds = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
    const uid = 'iracing-2026s2-' + e.id.replace(/[^a-zA-Z0-9]/g, '-') + '@iracing-schedule';
    lines.push(
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:' + ds,
      'DTEND;VALUE=DATE:' + ds,
      'SUMMARY:iRacing: ' + e.displayName + ' @ ' + e.track,
      'DESCRIPTION:Series: ' + e.displayName + '\\nTrack: ' + e.track + '\\nClass: ' + e.cls + '\\nCars: ' + e.cars + (e.laps ? '\\nLaps: ' + e.laps : ''),
      'UID:' + uid,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  downloadFile('iracing-2026s2-my-schedule.ics', lines.join('\r\n'), 'text/calendar');
}

function exportCSV() {
  const entries = Object.values(mySchedule);
  if (!entries.length) return;
  entries.sort((a, b) => a.weekNum !== b.weekNum ? a.weekNum - b.weekNum : a.displayName.localeCompare(b.displayName));
  const esc = v => '"' + String(v || '').replace(/"/g, '""') + '"';
  const rows = [['Week','Date','Series','Category','Class','Cars','Track','Laps'].map(esc).join(',')];
  entries.forEach(e => rows.push([e.weekNum, e.date, e.displayName, e.category, e.cls, e.cars, e.track, e.laps].map(esc).join(',')));
  downloadFile('iracing-2026s2-my-schedule.csv', rows.join('\n'), 'text/csv');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('toast-visible');
  setTimeout(() => toast.classList.remove('toast-visible'), 3500);
}

function shareSchedule(btn) {
  const ids = Object.keys(mySchedule);
  const encoded = btoa(JSON.stringify(ids));
  const url = location.origin + location.pathname + '?share=' + encoded + '&tab=my';
  const label = btn.querySelector('.btn-label');
  const orig = label ? label.textContent : btn.textContent;
  function onCopied() {
    if (label) { label.textContent = 'Copied!'; } else { btn.textContent = 'Copied!'; }
    btn.classList.add('export-btn-copied');
    setTimeout(() => { if (label) { label.textContent = orig; } else { btn.textContent = orig; } btn.classList.remove('export-btn-copied'); }, 2000);
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(onCopied).catch(() => { prompt('Copy this URL:', url); });
  } else {
    prompt('Copy this URL:', url);
    onCopied();
  }
}

function loadSharedSchedule(ids) {
  let added = 0;
  ids.forEach(id => {
    if (mySchedule[id]) return;
    const sep = id.lastIndexOf('_');
    if (sep === -1) return;
    const rawName = id.slice(0, sep);
    const weekNum = Number(id.slice(sep + 1));
    const series = SCHEDULE_DATA.find(s => s.name === rawName);
    if (!series) return;
    const week = series.weeks.find(w => w.week === weekNum);
    if (!week) return;
    mySchedule[id] = {
      id, rawName, weekNum,
      displayName: cleanName(rawName),
      category: series.category,
      cls: series.class,
      cars: series.cars,
      track: week.track,
      date: week.date,
      laps: week.laps || ''
    };
    added++;
  });
  if (added > 0) {
    saveMySchedule();
    updateMyScheduleBadge();
    showToast(added + ' race' + (added !== 1 ? 's' : '') + ' added to your schedule');
  }
}

function renderThisWeek() {
  const panel = document.getElementById('this-week-panel');
  const q = searchQuery.toLowerCase();
  const results = [];
  SCHEDULE_DATA.forEach(s => {
    if (!activeCategories.has(s.category)) return;
    if (!activeClasses.has(s.class)) return;
    if (activeCars.size > 0) {
      const seriesCars = s.cars.split(',').map(c => c.trim());
      if (!seriesCars.some(c => activeCars.has(c))) return;
    }
    const week = s.weeks.find(w => w.week === currentWeek);
    if (!week) return;
    if (activeTracks.size > 0 && !activeTracks.has(baseTrackName(week.track))) return;
    if (q) {
      const haystack = (s.name + ' ' + s.cars + ' ' + week.track + ' ' + (week.car || '')).toLowerCase();
      if (!haystack.includes(q)) return;
    }
    results.push({ s, week });
  });

  const dateRange = getWeekDateRange(currentWeek);
  const headerHtml = `<div class="week-view-header">
    <span class="week-view-title">${dateRange}</span>
    <span class="week-view-count">${results.length} series</span>
  </div>`;

  if (!results.length) {
    panel.innerHTML = headerHtml + '<div class="no-results">0 races this week match your filters</div>';
    return;
  }

  function makeCard({ s, week: w }) {
    const cc = catClass(s.category);
    const raceId = s.name + '_' + w.week;
    const isAdded = !!mySchedule[raceId];
    const isFav = favorites.has(s.name);
    const safeRawName = s.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const meta = [w.track, w.laps, s.cars].filter(Boolean).join(' \xb7 ');
    return `<div class="tw-card">
      <span class="cat-badge ${cc}" data-short="${catLabelShort(s.category)}">${catLabel(s.category)}</span>
      <span class="class-badge ${s.class}">${s.class}</span>
      <div class="tw-card-info">
        <div class="tw-card-title">${cleanName(s.name)}</div>
        <div class="tw-card-meta">${meta}</div>
      </div>
      <button class="tw-fav-btn${isFav ? ' active' : ''}" onclick="toggleFavorite('${safeRawName}')" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">${isFav ? '\u2605' : '\u2606'}</button>
      <button class="week-add-btn${isAdded ? ' added' : ''}" data-raw-name="${s.name.replace(/"/g, '&quot;')}" data-week="${w.week}" onclick="toggleRace(event,'${safeRawName}',${w.week})" title="${isAdded ? 'Remove from My Schedule' : 'Add to My Schedule'}">${isAdded ? '&#x2713;' : '+'}</button>
    </div>`;
  }

  const favResults = results.filter(r => favorites.has(r.s.name));
  const otherResults = results.filter(r => !favorites.has(r.s.name));

  let html = headerHtml;

  if (favResults.length > 0) {
    html += `<div class="tw-category-group">
      <div class="tw-category-header tw-favorites-header">\u2605 Favorites</div>
      ${favResults.map(makeCard).join('')}
    </div>`;
  }

  const groups = {};
  ALL_CATEGORIES.forEach(cat => { groups[cat] = []; });
  otherResults.forEach(r => groups[r.s.category].push(r));

  html += ALL_CATEGORIES.filter(cat => groups[cat].length > 0).map(cat => {
    const cc = catClass(cat);
    return `<div class="tw-category-group">
      <div class="tw-category-header ${cc}">${catLabel(cat)}</div>
      ${groups[cat].map(makeCard).join('')}
    </div>`;
  }).join('');

  panel.innerHTML = html;
}

// Initialize state
const initial = loadState();
let activeCategories = new Set(initial.categories);
let activeClasses = new Set(initial.classes);
let searchQuery = initial.search;
let activeCars = new Set(initial.cars || []);
let activeTracks = new Set(initial.tracks || []);

// Clean up series name
function cleanName(name) {
  return name
    .replace(/\s*-\s*2026 Season\s*\d?\s*-?\s*(Fixed)?$/i, '')
    .replace(/\s*-\s*2026 Season\s*\d?\s*(Fixed)?$/i, '')
    .replace(/\s*2026 Season\s*\d?\s*-?\s*(Fixed)?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFixed(name) {
  return /fixed/i.test(name);
}

function renderSeries() {
  const grid = document.getElementById('series-grid');
  const q = searchQuery.toLowerCase();

  const filtered = SCHEDULE_DATA.filter(s => {
    if (!activeCategories.has(s.category)) return false;
    if (!activeClasses.has(s.class)) return false;
    if (activeCars.size > 0) {
      const seriesCars = s.cars.split(',').map(c => c.trim());
      if (!seriesCars.some(c => activeCars.has(c))) return false;
    }
    if (activeTracks.size > 0) {
      if (!s.weeks.some(w => activeTracks.has(baseTrackName(w.track)))) return false;
    }
    if (q) {
      const haystack = (s.name + ' ' + s.cars + ' ' + s.weeks.map(w => w.track + ' ' + (w.car || '')).join(' ')).toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  document.getElementById('stats').textContent = `${filtered.length} series`;

  if (!filtered.length) {
    grid.innerHTML = '<div class="no-results">No series match your filters</div>';
    return;
  }

  grid.innerHTML = filtered.map((s, i) => {
    const cc = catClass(s.category);
    const displayName = cleanName(s.name);
    const fixed = isFixed(s.name) ? ' <span style="opacity:0.5;font-size:0.75rem">[Fixed]</span>' : '';

    const weeksHtml = s.weeks.map(w => {
      const isCurrent = w.week === currentWeek;
      const raceId = s.name + '_' + w.week;
      const isAdded = !!mySchedule[raceId];
      const safeRawName = s.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<div class="week-cell${isCurrent ? ' current' : ''}" style="padding-bottom:1.8rem">
        <div class="week-num">Week ${w.week} ${isCurrent ? '(Current)' : ''}<span style="float:right;color:var(--text-dim);font-weight:400">${w.date}</span></div>
        <div class="week-track">${w.track}</div>
        ${w.car ? `<div class="week-meta" style="font-style:italic">${w.car}</div>` : ''}
        ${w.laps ? `<span class="week-laps">${w.laps}</span>` : ''}
        <button class="week-add-btn${isAdded ? ' added' : ''}" data-raw-name="${s.name.replace(/"/g, '&quot;')}" data-week="${w.week}" onclick="toggleRace(event,'${safeRawName}',${w.week})" title="${isAdded ? 'Remove from My Schedule' : 'Add to My Schedule'}">${isAdded ? '&#x2713;' : '+'}</button>
      </div>`;
    }).join('');

    const allAdded = s.weeks.every(w => !!mySchedule[s.name + '_' + w.week]);
    const safeRawName = s.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<div class="series-card" data-idx="${i}">
      <div class="series-header" onclick="toggleCard(this)">
        <span class="cat-badge ${cc}" data-short="${catLabelShort(s.category)}">${catLabel(s.category)}</span>
        <span class="class-badge ${s.class}">${s.class}</span>
        <span class="series-title">${displayName}${fixed}</span>
        <span class="series-cars" title="${s.cars}">${s.cars}</span>
        <span class="series-freq">${s.frequency}</span>
        <button class="series-add-btn${allAdded ? ' added' : ''}" data-raw-name="${s.name.replace(/"/g, '&quot;')}" onclick="toggleSeries(event,'${safeRawName}')" title="${allAdded ? 'Remove all weeks from My Schedule' : 'Add all weeks to My Schedule'}">${allAdded ? '&#x2713; All' : '+ All'}</button>
        <span class="expand-icon">&#9662;</span>
      </div>
      <div class="schedule-body">
        <div class="week-grid">${weeksHtml}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleCard(header) {
  header.closest('.series-card').classList.toggle('expanded');
}

// Sync UI buttons to match loaded state
function syncUI() {
  document.querySelectorAll('#cat-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', activeCategories.has(btn.dataset.cat));
  });
  document.querySelectorAll('#class-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', activeClasses.has(btn.dataset.cls));
  });
  document.getElementById('search').value = searchQuery;
  renderTags('car');
  renderTags('track');
}

// Car + Track autocomplete filter system
let allCars = [];
let allTracks = [];

function buildCarListUI() {
  const carSet = new Set();
  SCHEDULE_DATA.forEach(s => s.cars.split(',').forEach(c => { const n = c.trim(); if (n) carSet.add(n); }));
  allCars = [...carSet].sort((a, b) => a.localeCompare(b));
  renderTags('car');
}

function baseTrackName(name) {
  const idx = name.indexOf(' - ');
  return (idx !== -1 ? name.slice(0, idx) : name).trim();
}

function buildTrackListUI() {
  const trackSet = new Set();
  SCHEDULE_DATA.forEach(s => s.weeks.forEach(w => { if (w.track) trackSet.add(baseTrackName(w.track)); }));
  allTracks = [...trackSet].sort((a, b) => a.localeCompare(b));
  renderTags('track');
}

function getActiveSet(type) { return type === 'car' ? activeCars : activeTracks; }
function getAllOptions(type) { return type === 'car' ? allCars : allTracks; }

function showAutocomplete(type) {
  const query = document.getElementById(type + '-search').value;
  renderDropdown(type, query);
}

function hideAutocomplete(type) {
  const el = document.getElementById(type + '-dropdown');
  if (el) el.classList.remove('visible');
}

function renderDropdown(type, query) {
  const dropdown = document.getElementById(type + '-dropdown');
  if (!dropdown) return;
  const q = query.toLowerCase();
  const active = getActiveSet(type);
  const filtered = getAllOptions(type).filter(item => !active.has(item) && item.toLowerCase().includes(q));
  if (!filtered.length) { dropdown.classList.remove('visible'); return; }
  dropdown.innerHTML = filtered.slice(0, 60).map(item => {
    const safe = item.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const safeJs = item.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<div class="autocomplete-option" onmousedown="selectItem('${type}','${safeJs}',event)">${safe}</div>`;
  }).join('');
  dropdown.classList.add('visible');
}

function filterAutocomplete(type, query) {
  if (!query) { hideAutocomplete(type); return; }
  renderDropdown(type, query);
}

function selectItem(type, value, event) {
  event.preventDefault();
  getActiveSet(type).add(value);
  document.getElementById(type + '-search').value = '';
  hideAutocomplete(type);
  renderTags(type);
  applyFilters();
}

function removeTag(type, value) {
  getActiveSet(type).delete(value);
  renderTags(type);
  applyFilters();
}

function renderTags(type) {
  const el = document.getElementById(type + '-tags');
  if (!el) return;
  const active = getActiveSet(type);
  el.innerHTML = [...active].sort().map(item => {
    const safe = item.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const safeJs = item.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<span class="selected-tag"><span class="selected-tag-label">${safe}</span><button class="tag-remove" onclick="removeTag('${type}','${safeJs}')" title="Remove">&times;</button></span>`;
  }).join('');
}

function applyFilters() {
  saveState();
  updateCarFilterBadge();
  renderSeries();
  if (activeTab === 'week') renderThisWeek();
}

function updateCarFilterBadge() {
  const carClear = document.getElementById('car-clear-btn');
  if (carClear) carClear.classList.toggle('visible', activeCars.size > 0);
  const trackClear = document.getElementById('track-clear-btn');
  if (trackClear) trackClear.classList.toggle('visible', activeTracks.size > 0);
  const total = activeCars.size + activeTracks.size;
  const badge = document.getElementById('filter-active-count');
  if (badge) badge.textContent = total > 0 ? String(total) : '';
}

function clearCarFilter() {
  activeCars.clear();
  renderTags('car');
  applyFilters();
}

function clearTrackFilter() {
  activeTracks.clear();
  renderTags('track');
  applyFilters();
}

function updateSidebarTop() {
  const h = document.querySelector('.sticky-top').offsetHeight;
  document.documentElement.style.setProperty('--sticky-height', h + 'px');
}

function openFilterDrawer() {
  document.getElementById('filter-sidebar').classList.add('drawer-open');
  document.getElementById('drawer-overlay').classList.add('visible');
  document.body.classList.add('drawer-active');
}

function closeFilterDrawer() {
  document.getElementById('filter-sidebar').classList.remove('drawer-open');
  document.getElementById('drawer-overlay').classList.remove('visible');
  document.body.classList.remove('drawer-active');
}

// Filter handlers
document.getElementById('cat-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const cat = btn.dataset.cat;
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    activeCategories.add(cat);
  } else {
    activeCategories.delete(cat);
  }
  saveState();
  renderSeries();
  if (activeTab === 'week') renderThisWeek();
});

document.getElementById('class-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const cls = btn.dataset.cls;
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    activeClasses.add(cls);
  } else {
    activeClasses.delete(cls);
  }
  saveState();
  renderSeries();
  if (activeTab === 'week') renderThisWeek();
});

document.getElementById('search').addEventListener('input', e => {
  searchQuery = e.target.value;
  saveState();
  renderSeries();
  if (activeTab === 'week') renderThisWeek();
});

// Load my schedule, favorites, and restore tab from URL
loadMySchedule();
loadFavorites();

const shareParam = new URLSearchParams(window.location.search).get('share');
if (shareParam) {
  try {
    const sharedIds = JSON.parse(atob(shareParam));
    if (Array.isArray(sharedIds)) loadSharedSchedule(sharedIds);
  } catch {}
  const cleanParams = new URLSearchParams(window.location.search);
  cleanParams.delete('share');
  const qs = cleanParams.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

const tabParam = new URLSearchParams(window.location.search).get('tab');
if (tabParam === 'my') activeTab = 'my';
else if (tabParam === 'week') activeTab = 'week';

// Initial render
buildCarListUI();
buildTrackListUI();
updateSidebarTop();
updateCarFilterBadge();
window.addEventListener('resize', updateSidebarTop);
syncUI();
renderSeries();
updateMyScheduleBadge();
if (activeTab === 'my') switchTab('my');
else if (activeTab === 'week') switchTab('week');
