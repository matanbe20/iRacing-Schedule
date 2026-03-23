import { create } from 'zustand';
import { SCHEDULE_DATA } from '../data';
import { cleanName } from '../utils/helpers';
import { FREE_CARS, FREE_TRACKS } from '../data/garage-defaults';
import type { Tab, Theme, MySchedule, RaceEntry } from '../types';

const ALL_CATEGORIES = ['OVAL', 'SPORTS CAR', 'FORMULA CAR', 'DIRT OVAL', 'DIRT ROAD', 'UNRANKED'];
const ALL_CLASSES = ['R', 'D', 'C', 'B', 'A'];
const STORAGE_KEY = 'iracing-2026s2-filters';
const MY_SCHEDULE_KEY = 'iracing-2026s2-my-schedule';
const FAVORITES_KEY = 'iracing-2026s2-favorites';
const THEME_KEY = 'iracing-theme';
const OWNED_KEY = 'iracing-2026s2-owned';

export { ALL_CATEGORIES, ALL_CLASSES };

export interface StoreState {
  // Filters
  activeCategories: Set<string>;
  activeClasses: Set<string>;
  searchQuery: string;
  activeCars: Set<string>;
  activeTracks: Set<string>;

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

  // Navigation
  setActiveTab: (tab: Tab) => void;

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

  let filters: Pick<StoreState, 'activeCategories' | 'activeClasses' | 'searchQuery' | 'activeCars' | 'activeTracks'> | undefined;
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
          activeTracks: new Set(saved.tracks || []),
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
      };
    }
  }

  let mySchedule: MySchedule = {};
  try {
    const raw = localStorage.getItem(MY_SCHEDULE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && typeof saved === 'object') mySchedule = saved;
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
        if (Array.isArray(saved.tracks)) ownedTracks = new Set(saved.tracks);
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

  return { ...filters, mySchedule, favorites, ownedCars, ownedTracks, theme, activeTab, sharedEntries, isShareModalOpen };
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
  if (state.activeTab === 'my' || state.activeTab === 'week') params.set('tab', state.activeTab);

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

  // Navigation & UI
  activeTab: initialState.activeTab ?? 'all',
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

  clearAllFilters() {
    set({
      activeCategories: new Set(ALL_CATEGORIES),
      activeClasses: new Set(ALL_CLASSES),
      activeCars: new Set(),
      activeTracks: new Set(),
      searchQuery: '',
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

  // Navigation
  setActiveTab(tab) {
    set({ activeTab: tab });
    const s = get();
    syncUrlParams(s); saveFilters(s);
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
          rain: week.rain
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
