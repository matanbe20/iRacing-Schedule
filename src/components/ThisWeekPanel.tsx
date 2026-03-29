import React, { useMemo } from 'react';
import useStore from '../store/useStore';
import { SCHEDULE_DATA } from '../data';
import { ALL_CATEGORIES } from '../store/useStore';
import { catClass, catLabel, baseTrackName, getWeekDateRange } from '../utils/helpers';
import { getCurrentWeek } from '../utils/schedule';
import TwCard from './TwCard';
import type { Series, Week } from '../types';

const currentWeek = getCurrentWeek();

export default function ThisWeekPanel() {
  const activeCategories = useStore(s => s.activeCategories);
  const activeClasses = useStore(s => s.activeClasses);
  const searchQuery = useStore(s => s.searchQuery);
  const activeCars = useStore(s => s.activeCars);
  const activeTracks = useStore(s => s.activeTracks);
  const filterOwnedCars = useStore(s => s.filterOwnedCars);
  const filterOwnedTracks = useStore(s => s.filterOwnedTracks);
  const ownedCars = useStore(s => s.ownedCars);
  const ownedTracks = useStore(s => s.ownedTracks);
  const favorites = useStore(s => s.favorites);
  const selectedWeek = useStore(s => s.selectedWeek);
  const setSelectedWeek = useStore(s => s.setSelectedWeek);

  const results = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return SCHEDULE_DATA.filter(s => {
      if (!activeCategories.has(s.category)) return false;
      if (!activeClasses.has(s.class)) return false;
      if (activeCars.size > 0) {
        const seriesCars = s.cars.split(',').map(c => c.trim());
        if (!seriesCars.some(c => activeCars.has(c))) return false;
      }
      const week = s.weeks.find(w => w.week === selectedWeek);
      if (!week) return false;
      if (activeTracks.size > 0 && !activeTracks.has(baseTrackName(week.track))) return false;
      if (filterOwnedCars && ownedCars.size > 0) {
        const seriesCars = s.cars.split(',').map(c => c.trim());
        if (!seriesCars.some(c => ownedCars.has(c))) return false;
      }
      if (filterOwnedTracks && ownedTracks.size > 0 && !ownedTracks.has(baseTrackName(week.track))) return false;
      if (q) {
        const haystack = (s.name + ' ' + s.cars + ' ' + week.track + ' ' + (week.car || '')).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).map(s => ({ s, week: s.weeks.find(w => w.week === selectedWeek) as Week }));
  }, [activeCategories, activeClasses, searchQuery, activeCars, activeTracks, filterOwnedCars, filterOwnedTracks, ownedCars, ownedTracks, selectedWeek]);

  const dateRange = getWeekDateRange(selectedWeek);
  const favResults = results.filter(r => favorites.has(r.s.name));
  const otherResults = results.filter(r => !favorites.has(r.s.name));

  const groups: Record<string, Array<{ s: Series; week: Week }>> = {};
  ALL_CATEGORIES.forEach(cat => { groups[cat] = []; });
  otherResults.forEach(r => groups[r.s.category].push(r));

  return (
    <div>
      <div className="week-selector">
        <span className="week-selector-label">Week</span>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            className={
              'week-btn' +
              (w === selectedWeek ? ' active' : '') +
              (w === currentWeek && w !== selectedWeek ? ' current' : '')
            }
            onClick={() => setSelectedWeek(w)}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="week-view-header">
        <span className="week-view-title">{dateRange}</span>
        <span className="week-view-count">{results.length} series</span>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          0 races this week match your filters<br />
          <span className="no-results-hint">Check the filters applied</span>
        </div>
      ) : (
        <>
          {favResults.length > 0 && (
            <div className="tw-category-group">
              <div className="tw-category-header tw-favorites-header">★ Favorites</div>
              {favResults.map(({ s, week }) => (
                <TwCard key={s.name} series={s} week={week} />
              ))}
            </div>
          )}
          {ALL_CATEGORIES.filter(cat => groups[cat].length > 0).map(cat => (
            <div key={cat} className="tw-category-group">
              <div className={'tw-category-header ' + catClass(cat)}>{catLabel(cat)}</div>
              {groups[cat].map(({ s, week }) => (
                <TwCard key={s.name} series={s} week={week} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
