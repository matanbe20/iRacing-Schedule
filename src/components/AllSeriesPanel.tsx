import React, { useMemo, useEffect } from 'react';
import useStore from '../store/useStore';
import { SCHEDULE_DATA } from '../data';
import { ALL_CLASSES } from '../store/useStore';
import { cleanName, baseTrackName } from '../utils/helpers';
import SeriesCard from './SeriesCard';

const CAT_ORDER = ['SPORTS CAR', 'FORMULA CAR', 'OVAL', 'DIRT OVAL', 'DIRT ROAD', 'UNRANKED'];

export default function AllSeriesPanel() {
  const activeCategories = useStore(s => s.activeCategories);
  const activeClasses = useStore(s => s.activeClasses);
  const searchQuery = useStore(s => s.searchQuery);
  const activeCars = useStore(s => s.activeCars);
  const activeTracks = useStore(s => s.activeTracks);
  const setFilteredCount = useStore(s => s.setFilteredCount);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return SCHEDULE_DATA.filter(s => {
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
    }).sort((a, b) => {
      const classDiff = ALL_CLASSES.indexOf(a.class) - ALL_CLASSES.indexOf(b.class);
      if (classDiff !== 0) return classDiff;
      const catDiff = CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return cleanName(a.name).localeCompare(cleanName(b.name));
    });
  }, [activeCategories, activeClasses, searchQuery, activeCars, activeTracks]);

  useEffect(() => {
    setFilteredCount(filtered.length);
  }, [filtered.length]);

  return (
    <div className="series-grid">
      {filtered.length === 0 ? (
        <div className="no-results">
          No series match your filters<br />
          <span className="no-results-hint">Check the filters applied</span>
        </div>
      ) : (
        filtered.map(s => <SeriesCard key={s.name} series={s} />)
      )}
    </div>
  );
}
