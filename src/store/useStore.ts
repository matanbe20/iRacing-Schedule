import { create } from 'zustand';
import { SCHEDULE_DATA } from '../data';
import { cleanName } from '../utils/helpers';
import { FREE_CARS, FREE_TRACKS } from '../data/garage-defaults';
import { getCurrentWeek } from '../utils/schedule';
import type { Tab, Theme, MySchedule, RaceEntry } from '../types';

const ALL_CATEGORIES = ['SPORTS CAR', 'FORMULA CAR', 'OVAL', 'DIRT ROAD', 'DIRT OVAL', 'UNRANKED'];
const ALL_CLASSES = ['R', 'D', 'C', 'B', 'A'];
const STORAGE_KEY = 'iracing-2026s2-filters';
const MY_SCHEDULE_KEY = 'iracing-2026s2-my-schedule';
const FAVORITES_KEY = 'iracing-2026s2-favorites';
const THEME_KEY = 'iracing-theme';
const OWNED_KEY = 'iracing-2026s2-owned';

export { ALL_CATEGORIES, ALL_CLASSES };

// Track name migrations: old name → new name
const TRACK_RENAMES: Record<string, string> = {
  'Autodromo Internazionale Enzo e Dino Ferrari -': 'Autodromo Internazionale Enzo e Dino Ferrari',
};

function migrateTrackName(name: string): string {
  return TRACK_RENAMES[name] ?? name;
}

function migrateTrackSet(set: Set<string>): Set<string> {
  return new Set([...set].map(migrateTrackName));
}

export interface StoreState {
  // Filters
  activeCategories: Set<string>;
  activeClasses: Set<string>;
  searchQuery: string;
  activeCars: Set<string>;
  activeTracks: Set<string>;
  filterOwnedCars: boolean;
  filterOwnedTracks: boolean;

  // Navigation & UI
  activeTab: Tab;
  theme: Theme;
  isDrawerOpen: boolean;
  isShareModalOpen: boolean;
  sharedEntries: RaceEntry[];
  toastMessage: string | null;

  // User data
  mySchedule: MySchedule;
  favorites: Set<string>;

  // Ownership
  ownedCars: Set<string>;
  ownedTracks: Set<string>;
  isGarageModalOpen: boolean;

  // Shared garage
  isGarageShareModalOpen: boolean;
  sharedGarageCars: string[];
  sharedGarageTracks: string[];

  // Filtered count
  filteredCount: number;

  // Filter actions
  toggleCategory: (cat: string) => void;
  filterByCategory: (cat: string) => void;
  toggleClass: (cls: string) => void;
  filterByClass: (cls: string) => void;
  setSearchQuery: (query: string) => void;
  addCarFilter: (car: string) => void;
  removeCarFilter: (car: string) => void;
  clearCarFilter: () => void;
  addTrackFilter: (track: string) => void;
  removeTrackFilter: (track: string) => void;
  clearTrackFilter: () => void;
  clearAllFilters: () => void;
  toggleFilterOwnedCars: () => void;
  toggleFilterOwnedTracks: () => void;

  // Ownership actions
  addOwnedCar(car: string): void;
  removeOwnedCar(car: string): void;
  clearOwnedCars(): void;
  addOwnedTrack(track: string): void;
  removeOwnedTrack(track: string): void;
  clearOwnedTracks(): void;
  setOwnedCars(cars: Set<string>): void;
  setOwnedTracks(tracks: Set<string>): void;
  openGarageModal(): void;
  closeGarageModal(): void;
  openGarageShareModal(cars: string[], tracks: string[]): void;
  closeGarageShareModal(): void;
  mergeSharedGarage(): void;

  // Navigation
  setActiveTab: (tab: Tab) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;

  // Theme
  toggleTheme: () => void;

  // Schedule actions
  addRace: (rawName: string, weekNum: number) => void;
  removeRace: (id: string) => void;
  toggleRace: (rawName: string, weekNum: number) => void;
  toggleSeries: (rawName: string) => void;
  toggleFavorite: (rawName: string) => void;

  // Drawer
  openDrawer: () => void;
  closeDrawer: () => void;

  // Share modal
  openShareModal: (entries: RaceEntry[]) => void;
  closeShareModal: () => void;
  addSharedRace: (id: string) => void;
  addAllShared: () => void;

  // Filtered count
  setFilteredCount: (n: number) => void;

  // Toast
  showToast: (msg: string) => void;
  clearToast: () => void;
}

function loadInitialState(): Partial<StoreState> {
  const params = new URLSearchParams(window.location.search);
  const hasUrlParams = params.has('cat') || params.has('cls') || params.has('q') || params.has('cars') || params.has('tracks');

  let filters: Pick<StoreState, 'activeCategories' | 'activeClasses' | 'searchQuery' | 'activeCars' | 'activeTracks' | 'filterOwnedCars' | 'filterOwnedTracks'> | undefined;
  if (hasUrlParams) {
    const cats = params.get('cat');
    const cls = params.get('cls');
    const cars = params.get('cars');
    const tracks = params.get('tracks');
    filters = {
      activeCategories: new Set(cats ? cats.split(',').filter(c => ALL_CATEGORIES.includes(c)) : ALL_CATEGORIES),
      activeClasses: new Set(cls ? cls.split(',').filter(c => ALL_CLASSES.includes(c)) : ALL_CLASSES),
      searchQuery: params.get('q') || '',
      activeCars: new Set(cars ? cars.split(',').filter(Boolean) : []),
      activeTracks: new Set(tracks ? tracks.split(',').filter(Boolean) : []),
      filterOwnedCars: false,
      filterOwnedTracks: false,
    };
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved) {
        filters = {
          activeCategories: new Set((saved.categories || ALL_CATEGORIES).filter((c: string) => ALL_CATEGORIES.includes(c))),
          activeClasses: new Set((saved.classes || ALL_CLASSES).filter((c: string) => ALL_CLASSES.includes(c))),
          searchQuery: saved.search || '',
          activeCars: new Set(saved.cars || []),
          activeTracks: migrateTrackSet(new Set(saved.tracks || [])),
          filterOwnedCars: saved.filterOwnedCars ?? false,
          filterOwnedTracks: saved.filterOwnedTracks ?? false,
        };
      }
    } catch { /* ignore */ }
    if (!filters) {
      filters = {
        activeCategories: new Set(ALL_CATEGORIES),
        activeClasses: new Set(ALL_CLASSES),
        searchQuery: '',
        activeCars: new Set(),
        activeTracks: new Set(),
        filterOwnedCars: false,
        filterOwnedTracks: false,
      };
    }
  }

  let mySchedule: MySchedule = {};
  try {
    const raw = localStorage.getItem(MY_SCHEDULE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && typeof saved === 'object') {
      mySchedule = Object.fromEntries(
        Object.entries(saved as MySchedule).map(([k, v]) => [k, { ...v, track: migrateTrackName(v.track) }])
      );
    }
  } catch { /* ignore */ }

  let favorites: Set<string> = new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (Array.isArray(saved)) favorites = new Set(saved);
  } catch { /* ignore */ }

  let ownedCars = new Set<string>();
  let ownedTracks = new Set<string>();
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (raw === null) {
      // First visit — pre-populate with items included with iRacing membership
      ownedCars = new Set(FREE_CARS);
      ownedTracks = new Set(FREE_TRACKS);
    } else {
      const saved = JSON.parse(raw);
      if (saved) {
        if (Array.isArray(saved.cars)) ownedCars = new Set(saved.cars);
        if (Array.isArray(saved.tracks)) ownedTracks = migrateTrackSet(new Set(saved.tracks));
      }
    }
  } catch { /* ignore */ }

  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme: Theme = (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : (prefersDark ? 'dark' : 'light');

  const tabParam = params.get('tab');
  let activeTab: Tab = 'all';
  if (tabParam === 'my') activeTab = 'my';
  else if (tabParam === 'week') activeTab = 'week';
  else if (tabParam === 'events') activeTab = 'events';

  const weekParam = Number(params.get('week'));
  const selectedWeek = (weekParam >= 1 && weekParam <= 12) ? weekParam : getCurrentWeek();

  let sharedEntries: RaceEntry[] = [];
  let isShareModalOpen = false;
  const shareParam = params.get('share');
  if (shareParam) {
    try {
      const sharedIds = JSON.parse(atob(shareParam));
      if (Array.isArray(sharedIds)) {
        (sharedIds as string[]).forEach(id => {
          const sep = id.lastIndexOf('_');
          if (sep === -1) return;
          const rawName = id.slice(0, sep);
          const weekNum = Number(id.slice(sep + 1));
          const series = SCHEDULE_DATA.find(s => s.name === rawName);
          if (!series) return;
          const week = series.weeks.find(w => w.week === weekNum);
          if (!week) return;
          sharedEntries.push({
            id, rawName, weekNum,
            displayName: cleanName(rawName),
            category: series.category,
            cls: series.class,
            cars: series.cars,
            track: week.track,
            date: week.date,
            laps: week.laps || '',
            rain: week.rain
          });
        });
        sharedEntries.sort((a, b) => {
          if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
          return a.displayName.localeCompare(b.displayName);
        });
        if (sharedEntries.length > 0) isShareModalOpen = true;
      }
    } catch { /* ignore */ }
    const cleanParams = new URLSearchParams(window.location.search);
    cleanParams.delete('share');
    const qs = cleanParams.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  let sharedGarageCars: string[] = [];
  let sharedGarageTracks: string[] = [];
  let isGarageShareModalOpen = false;
  const garageParam = params.get('garage');
  if (garageParam) {
    try {
      const parsed = JSON.parse(atob(garageParam));
      if (parsed && Array.isArray(parsed.cars)) sharedGarageCars = parsed.cars.filter((c: unknown) => typeof c === 'string');
      if (parsed && Array.isArray(parsed.tracks)) sharedGarageTracks = parsed.tracks.filter((t: unknown) => typeof t === 'string');
      if (sharedGarageCars.length > 0 || sharedGarageTracks.length > 0) isGarageShareModalOpen = true;
    } catch { /* ignore */ }
    const cleanParams = new URLSearchParams(window.location.search);
    cleanParams.delete('garage');
    const qs = cleanParams.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  return { ...filters, mySchedule, favorites, ownedCars, ownedTracks, theme, activeTab, selectedWeek, sharedEntries, isShareModalOpen, sharedGarageCars, sharedGarageTracks, isGarageShareModalOpen };
}

function syncUrlParams(state: StoreState): void {
  const params = new URLSearchParams();
  const allCatsActive = ALL_CATEGORIES.every(c => state.activeCategories.has(c));
  const allClsActive = ALL_CLASSES.every(c => state.activeClasses.has(c));

  if (!allCatsActive) params.set('cat', [...state.activeCategories].join(','));
  if (!allClsActive) params.set('cls', [...state.activeClasses].join(','));
  if (state.searchQuery) params.set('q', state.searchQuery);
  if (state.activeCars.size > 0) params.set('cars', [...state.activeCars].join(','));
  if (state.activeTracks.size > 0) params.set('tracks', [...state.activeTracks].join(','));
  if (state.activeTab === 'my' || state.activeTab === 'week' || state.activeTab === 'events') params.set('tab', state.activeTab);
  if (state.activeTab === 'week') params.set('week', String(state.selectedWeek));

  const qs = params.toString();
  const url = window.location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', url);
}

function saveFilters(state: StoreState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    categories: [...state.activeCategories],
    classes: [...state.activeClasses],
    search: state.searchQuery,
    cars: [...state.activeCars],
    tracks: [...state.activeTracks],
    filterOwnedCars: state.filterOwnedCars,
    filterOwnedTracks: state.filterOwnedTracks,
  }));
}

function saveOwned(state: StoreState): void {
  localStorage.setItem(OWNED_KEY, JSON.stringify({
    cars: [...state.ownedCars],
    tracks: [...state.ownedTracks],
  }));
}

const initialState = loadInitialState();

const useStore = create<StoreState>((set, get) => ({
  // Filters
  activeCategories: initialState.activeCategories ?? new Set(ALL_CATEGORIES),
  activeClasses: initialState.activeClasses ?? new Set(ALL_CLASSES),
  searchQuery: initialState.searchQuery ?? '',
  activeCars: initialState.activeCars ?? new Set(),
  activeTracks: initialState.activeTracks ?? new Set(),
  filterOwnedCars: initialState.filterOwnedCars ?? false,
  filterOwnedTracks: initialState.filterOwnedTracks ?? false,

  // Navigation & UI
  activeTab: initialState.activeTab ?? 'all',
  selectedWeek: initialState.selectedWeek ?? getCurrentWeek(),
  theme: initialState.theme ?? 'dark',
  isDrawerOpen: false,
  isShareModalOpen: initialState.isShareModalOpen ?? false,
  sharedEntries: initialState.sharedEntries ?? [],
  toastMessage: null,

  // User data
  mySchedule: initialState.mySchedule ?? {},
  favorites: initialState.favorites ?? new Set(),

  // Ownership
  ownedCars: initialState.ownedCars ?? new Set(FREE_CARS),
  ownedTracks: initialState.ownedTracks ?? new Set(FREE_TRACKS),
  isGarageModalOpen: false,
  isGarageShareModalOpen: initialState.isGarageShareModalOpen ?? false,
  sharedGarageCars: initialState.sharedGarageCars ?? [],
  sharedGarageTracks: initialState.sharedGarageTracks ?? [],

  // Filter actions
  toggleCategory(cat) {
    set(state => {
      const next = new Set(state.activeCategories);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return { activeCategories: next };
    });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  filterByCategory(cat) {
    set(() => ({ activeCategories: new Set([cat]) }));
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  toggleClass(cls) {
    set(state => {
      const next = new Set(state.activeClasses);
      if (next.has(cls)) next.delete(cls); else next.add(cls);
      return { activeClasses: next };
    });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  filterByClass(cls) {
    set(() => ({ activeClasses: new Set([cls]) }));
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  setSearchQuery(query) {
    set({ searchQuery: query });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  addCarFilter(car) {
    set(state => ({ activeCars: new Set([...state.activeCars, car]) }));
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  removeCarFilter(car) {
    set(state => {
      const next = new Set(state.activeCars);
      next.delete(car);
      return { activeCars: next };
    });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  clearCarFilter() {
    set({ activeCars: new Set() });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  addTrackFilter(track) {
    set(state => ({ activeTracks: new Set([...state.activeTracks, track]) }));
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  removeTrackFilter(track) {
    set(state => {
      const next = new Set(state.activeTracks);
      next.delete(track);
      return { activeTracks: next };
    });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  clearTrackFilter() {
    set({ activeTracks: new Set() });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  toggleFilterOwnedCars() {
    set(state => ({ filterOwnedCars: !state.filterOwnedCars }));
    saveFilters(get());
  },

  toggleFilterOwnedTracks() {
    set(state => ({ filterOwnedTracks: !state.filterOwnedTracks }));
    saveFilters(get());
  },

  clearAllFilters() {
    set({
      activeCategories: new Set(ALL_CATEGORIES),
      activeClasses: new Set(ALL_CLASSES),
      activeCars: new Set(),
      activeTracks: new Set(),
      searchQuery: '',
      filterOwnedCars: false,
      filterOwnedTracks: false,
    });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  // Ownership actions
  addOwnedCar(car) {
    set(state => ({ ownedCars: new Set([...state.ownedCars, car]) }));
    saveOwned(get());
  },

  removeOwnedCar(car) {
    set(state => {
      const next = new Set(state.ownedCars);
      next.delete(car);
      return { ownedCars: next };
    });
    saveOwned(get());
  },

  clearOwnedCars() {
    set({ ownedCars: new Set() });
    saveOwned(get());
  },

  addOwnedTrack(track) {
    set(state => ({ ownedTracks: new Set([...state.ownedTracks, track]) }));
    saveOwned(get());
  },

  removeOwnedTrack(track) {
    set(state => {
      const next = new Set(state.ownedTracks);
      next.delete(track);
      return { ownedTracks: next };
    });
    saveOwned(get());
  },

  clearOwnedTracks() {
    set({ ownedTracks: new Set() });
    saveOwned(get());
  },

  setOwnedCars(cars) {
    set({ ownedCars: cars });
    saveOwned(get());
  },

  setOwnedTracks(tracks) {
    set({ ownedTracks: tracks });
    saveOwned(get());
  },

  openGarageModal() { set({ isGarageModalOpen: true }); },
  closeGarageModal() { set({ isGarageModalOpen: false }); },

  openGarageShareModal(cars, tracks) { set({ sharedGarageCars: cars, sharedGarageTracks: tracks, isGarageShareModalOpen: true }); },
  closeGarageShareModal() { set({ isGarageShareModalOpen: false }); },

  mergeSharedGarage() {
    const { sharedGarageCars, sharedGarageTracks, ownedCars, ownedTracks } = get();
    const addedCars = sharedGarageCars.filter(c => !ownedCars.has(c)).length;
    const addedTracks = sharedGarageTracks.filter(t => !ownedTracks.has(t)).length;
    const newCars = new Set([...ownedCars, ...sharedGarageCars]);
    const newTracks = new Set([...ownedTracks, ...sharedGarageTracks]);
    set({ ownedCars: newCars, ownedTracks: newTracks, isGarageShareModalOpen: false });
    saveOwned(get());
    const parts = [];
    if (addedCars > 0) parts.push(addedCars + ' car' + (addedCars !== 1 ? 's' : ''));
    if (addedTracks > 0) parts.push(addedTracks + ' track' + (addedTracks !== 1 ? 's' : ''));
    if (parts.length > 0) get().showToast(parts.join(' and ') + ' added to your garage');
  },

  // Navigation
  setActiveTab(tab) {
    set({ activeTab: tab });
    const s = get();
    syncUrlParams(s); saveFilters(s);
  },

  setSelectedWeek(week) {
    set({ selectedWeek: week });
    const s = get();
    syncUrlParams(s);
  },

  // Theme
  toggleTheme() {
    set(state => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.dataset.theme = next;
      return { theme: next };
    });
  },

  // Schedule actions
  addRace(rawName, weekNum) {
    const series = SCHEDULE_DATA.find(s => s.name === rawName);
    if (!series) return;
    const week = series.weeks.find(w => w.week === weekNum);
    if (!week) return;
    const id = rawName + '_' + weekNum;
    set(state => ({
      mySchedule: {
        ...state.mySchedule,
        [id]: {
          id, rawName, weekNum,
          displayName: cleanName(rawName),
          category: series.category,
          cls: series.class,
          cars: series.cars,
          track: week.track,
          date: week.date,
          laps: week.laps || '',
          rain: week.rain,
          frequency: series.frequency
        }
      }
    }));
    const s = get();
    localStorage.setItem(MY_SCHEDULE_KEY, JSON.stringify(s.mySchedule));
  },

  removeRace(id) {
    set(state => {
      const next = { ...state.mySchedule };
      delete next[id];
      return { mySchedule: next };
    });
    const s = get();
    localStorage.setItem(MY_SCHEDULE_KEY, JSON.stringify(s.mySchedule));
  },

  toggleRace(rawName, weekNum) {
    const id = rawName + '_' + weekNum;
    const { mySchedule, addRace, removeRace } = get();
    if (mySchedule[id]) {
      removeRace(id);
    } else {
      addRace(rawName, weekNum);
    }
  },

  toggleSeries(rawName) {
    const series = SCHEDULE_DATA.find(s => s.name === rawName);
    if (!series) return;
    const { mySchedule } = get();
    const fullyAdded = series.weeks.every(w => !!mySchedule[rawName + '_' + w.week]);
    if (fullyAdded) {
      set(state => {
        const next = { ...state.mySchedule };
        series.weeks.forEach(w => { delete next[rawName + '_' + w.week]; });
        return { mySchedule: next };
      });
    } else {
      set(state => {
        const next = { ...state.mySchedule };
        series.weeks.forEach(w => {
          const id = rawName + '_' + w.week;
          if (!next[id]) {
            next[id] = {
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
        return { mySchedule: next };
      });
    }
    const s = get();
    localStorage.setItem(MY_SCHEDULE_KEY, JSON.stringify(s.mySchedule));
  },

  toggleFavorite(rawName) {
    set(state => {
      const next = new Set(state.favorites);
      if (next.has(rawName)) next.delete(rawName); else next.add(rawName);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return { favorites: next };
    });
  },

  // Drawer
  openDrawer() { set({ isDrawerOpen: true }); },
  closeDrawer() { set({ isDrawerOpen: false }); },

  // Share modal
  openShareModal(entries) { set({ sharedEntries: entries, isShareModalOpen: true }); },
  closeShareModal() { set({ isShareModalOpen: false }); },

  addSharedRace(id) {
    const { sharedEntries, mySchedule } = get();
    if (mySchedule[id]) return;
    const entry = sharedEntries.find(e => e.id === id);
    if (!entry) return;
    set(state => ({
      mySchedule: { ...state.mySchedule, [id]: { ...entry } }
    }));
    const s = get();
    localStorage.setItem(MY_SCHEDULE_KEY, JSON.stringify(s.mySchedule));
  },

  addAllShared() {
    const { sharedEntries, mySchedule } = get();
    const toAdd = sharedEntries.filter(e => !mySchedule[e.id]);
    if (!toAdd.length) return;
    set(state => {
      const next = { ...state.mySchedule };
      toAdd.forEach(e => { next[e.id] = { ...e }; });
      return { mySchedule: next };
    });
    const s = get();
    localStorage.setItem(MY_SCHEDULE_KEY, JSON.stringify(s.mySchedule));
    get().showToast(toAdd.length + ' race' + (toAdd.length !== 1 ? 's' : '') + ' added to your schedule');
  },

  // Filtered count
  filteredCount: 0,
  setFilteredCount(n) { set({ filteredCount: n }); },

  // Toast
  showToast(msg) {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 3500);
  },
  clearToast() { set({ toastMessage: null }); },
}));

export default useStore;
