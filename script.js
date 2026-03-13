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

// All possible values
const ALL_CATEGORIES = ["OVAL", "SPORTS CAR", "FORMULA CAR", "DIRT OVAL", "DIRT ROAD", "UNRANKED"];
const ALL_CLASSES = ["R", "D", "C", "B", "A"];
const STORAGE_KEY = 'iracing-2026s2-filters';
const MY_SCHEDULE_KEY = 'iracing-2026s2-my-schedule';
let mySchedule = {};
let activeTab = 'all';

// Load state: URL params take priority > localStorage > defaults (all active)
function loadState() {
  const params = new URLSearchParams(window.location.search);
  const hasUrlParams = params.has('cat') || params.has('cls') || params.has('q');

  if (hasUrlParams) {
    const cats = params.get('cat');
    const cls = params.get('cls');
    return {
      categories: cats ? cats.split(',').filter(c => ALL_CATEGORIES.includes(c)) : [...ALL_CATEGORIES],
      classes: cls ? cls.split(',').filter(c => ALL_CLASSES.includes(c)) : [...ALL_CLASSES],
      search: params.get('q') || ''
    };
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return {
      categories: (saved.categories || ALL_CATEGORIES).filter(c => ALL_CATEGORIES.includes(c)),
      classes: (saved.classes || ALL_CLASSES).filter(c => ALL_CLASSES.includes(c)),
      search: saved.search || ''
    };
  } catch {}

  return { categories: [...ALL_CATEGORIES], classes: [...ALL_CLASSES], search: '' };
}

function saveState() {
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    categories: [...activeCategories],
    classes: [...activeClasses],
    search: searchQuery
  }));

  // Update URL params
  const params = new URLSearchParams();
  const allCatsActive = ALL_CATEGORIES.every(c => activeCategories.has(c));
  const allClsActive = ALL_CLASSES.every(c => activeClasses.has(c));

  if (!allCatsActive) params.set('cat', [...activeCategories].join(','));
  if (!allClsActive) params.set('cls', [...activeClasses].join(','));
  if (searchQuery) params.set('q', searchQuery);
  if (activeTab === 'my') params.set('tab', 'my');

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
  document.getElementById('tab-all').classList.toggle('active', tab === 'all');
  document.getElementById('tab-my').classList.toggle('active', tab === 'my');
  if (tab === 'my') renderMySchedule();
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
    const da = parseDateStr(a.date), db = parseDateStr(b.date);
    if (da !== db) return da - db;
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
      <button class="export-btn" onclick="exportCSV()">Download CSV</button>
      <button class="export-btn" onclick="exportICS()">Download .ics</button>
    </div>
  </div>`;

  const groupsHtml = groupOrder.map(key => {
    const racesHtml = groups[key].map(e => {
      const cc = catClass(e.category);
      const safeId = e.id.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<div class="my-race-card">
        <span class="cat-badge ${cc}">${catLabel(e.category)}</span>
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

// Initialize state
const initial = loadState();
let activeCategories = new Set(initial.categories);
let activeClasses = new Set(initial.classes);
let searchQuery = initial.search;

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
      return `<div class="week-cell${isCurrent ? ' current' : ''}">
        <div class="week-num">Week ${w.week} ${isCurrent ? '(Current)' : ''}<span style="float:right;color:var(--text-dim);font-weight:400">${w.date}</span></div>
        <div class="week-track">${w.track}</div>
        ${w.car ? `<div class="week-meta" style="font-style:italic">${w.car}</div>` : ''}
        <div class="week-meta">${w.laps || ''}</div>
        <button class="week-add-btn${isAdded ? ' added' : ''}" data-raw-name="${s.name.replace(/"/g, '&quot;')}" data-week="${w.week}" onclick="toggleRace(event,'${safeRawName}',${w.week})" title="${isAdded ? 'Remove from My Schedule' : 'Add to My Schedule'}">${isAdded ? '&#x2713;' : '+'}</button>
      </div>`;
    }).join('');

    return `<div class="series-card" data-idx="${i}">
      <div class="series-header" onclick="toggleCard(this)">
        <span class="cat-badge ${cc}">${catLabel(s.category)}</span>
        <span class="class-badge ${s.class}">${s.class}</span>
        <span class="series-title">${displayName}${fixed}</span>
        <span class="series-cars">${s.cars}</span>
        <span class="series-freq">${s.frequency}</span>
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
});

document.getElementById('search').addEventListener('input', e => {
  searchQuery = e.target.value;
  saveState();
  renderSeries();
});

// Load my schedule and restore tab from URL
loadMySchedule();
const tabParam = new URLSearchParams(window.location.search).get('tab');
if (tabParam === 'my') activeTab = 'my';

// Initial render
syncUI();
renderSeries();
updateMyScheduleBadge();
if (activeTab === 'my') switchTab('my');
