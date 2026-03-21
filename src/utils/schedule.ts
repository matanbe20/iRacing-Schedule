export const SEASON_START = new Date('2026-03-17');

export function getCurrentWeek(): number {
  const now = new Date();
  const diff = now.getTime() - SEASON_START.getTime();
  if (diff < 0) return 1;
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(week, 12);
}
