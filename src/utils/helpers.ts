import type { MySchedule } from '../types';

export function cleanName(name: string): string {
  return name
    .replace(/\s*-\s*2026 Season\s*\d?\s*-?\s*(Fixed)?$/i, '')
    .replace(/\s*-\s*2026 Season\s*\d?\s*(Fixed)?$/i, '')
    .replace(/\s*2026 Season\s*\d?\s*-?\s*(Fixed)?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function catClass(cat: string): string {
  return ({
    'OVAL': 'oval',
    'SPORTS CAR': 'sports',
    'FORMULA CAR': 'formula',
    'DIRT OVAL': 'dirt-oval',
    'DIRT ROAD': 'dirt-road',
    'UNRANKED': 'unranked'
  } as Record<string, string>)[cat] || 'unranked';
}

export function catLabel(cat: string): string {
  return ({
    'OVAL': 'Oval',
    'SPORTS CAR': 'Sports Car',
    'FORMULA CAR': 'Formula',
    'DIRT OVAL': 'Dirt Oval',
    'DIRT ROAD': 'Dirt Road',
    'UNRANKED': 'Unranked'
  } as Record<string, string>)[cat] || cat;
}

export function catLabelShort(cat: string): string {
  return ({
    'OVAL': 'Oval',
    'SPORTS CAR': 'S.Car',
    'FORMULA CAR': 'Formula',
    'DIRT OVAL': 'D.Oval',
    'DIRT ROAD': 'D.Road',
    'UNRANKED': 'Unrnk'
  } as Record<string, string>)[cat] || cat;
}

export function baseTrackName(name: string): string {
  const idx = name.indexOf(' - ');
  return (idx !== -1 ? name.slice(0, idx) : name).trim();
}

export function isFixed(name: string): boolean {
  return /fixed/i.test(name);
}

export function parseDateStr(dateStr: string): number {
  try { return new Date(dateStr + ', 2026').getTime(); } catch { return 0; }
}

export function getWeekDateRange(weekNum: number): string {
  const seasonStart = new Date('2026-03-17');
  const start = new Date(seasonStart.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt = (d: Date) => months[d.getMonth()] + ' ' + d.getDate();
  return 'Week ' + weekNum + ' \u2014 ' + fmt(start) + ' \u2013 ' + fmt(end);
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function exportCSV(mySchedule: MySchedule): void {
  const entries = Object.values(mySchedule);
  if (!entries.length) return;
  entries.sort((a, b) => a.weekNum !== b.weekNum ? a.weekNum - b.weekNum : a.displayName.localeCompare(b.displayName));
  const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [['Week','Date','Series','Category','Class','Cars','Track','Laps'].map(esc).join(',')];
  entries.forEach(e => rows.push([e.weekNum, e.date, e.displayName, e.category, e.cls, e.cars, e.track, e.laps].map(esc).join(',')));
  downloadFile('iracing-2026s2-my-schedule.csv', rows.join('\n'), 'text/csv');
}

export function exportICS(mySchedule: MySchedule): void {
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
