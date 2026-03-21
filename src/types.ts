export type Category = 'OVAL' | 'SPORTS CAR' | 'FORMULA CAR' | 'DIRT OVAL' | 'DIRT ROAD' | 'UNRANKED';
export type SeriesClass = 'R' | 'D' | 'C' | 'B' | 'A';
export type Tab = 'all' | 'week' | 'my';
export type Theme = 'dark' | 'light';

export interface Week {
  week: number;
  date: string;
  track: string;
  laps?: string;
  rain?: number;
  car?: string;
}

export interface Series {
  category: Category;
  class: SeriesClass;
  name: string;
  cars: string;
  license: string;
  frequency: string;
  weeks: Week[];
}

export interface RaceEntry {
  id: string;
  rawName: string;
  weekNum: number;
  displayName: string;
  category: string;
  cls: string;
  cars: string;
  track: string;
  date: string;
  laps: string;
}

export type MySchedule = Record<string, RaceEntry>;
