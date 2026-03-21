import React from 'react';
import useStore from '../store/useStore';
import { getCurrentWeek } from '../utils/schedule';
import { baseTrackName } from '../utils/helpers';
import type { Series, Week } from '../types';

const currentWeek = getCurrentWeek();

const RainDropSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.5 9.5 4 13.5 4 17a8 8 0 0 0 16 0c0-3.5-2.5-7.5-8-15z"/>
  </svg>
);

interface WeekCellProps {
  series: Series;
  week: Week;
}

export default function WeekCell({ series, week }: WeekCellProps) {
  const mySchedule = useStore(s => s.mySchedule);
  const toggleRace = useStore(s => s.toggleRace);
  const ownedTracks = useStore(s => s.ownedTracks);

  const isCurrent = week.week === currentWeek;
  const isOwned = ownedTracks.size > 0 && ownedTracks.has(baseTrackName(week.track));
  const raceId = series.name + '_' + week.week;
  const isAdded = !!mySchedule[raceId];

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    toggleRace(series.name, week.week);
  }

  return (
    <div className={'week-cell' + (isCurrent ? ' current' : '') + (isOwned ? ' owned' : '')} style={{ paddingBottom: '1.8rem' }}>
      <div className="week-num">
        Week {week.week} {isCurrent ? '(Current)' : ''}
        <span style={{ float: 'right', color: 'var(--text-dim)', fontWeight: 400 }}>{week.date}</span>
      </div>
      <div className="week-track">{week.track}</div>
      {week.car && <div className="week-meta" style={{ fontStyle: 'italic' }}>{week.car}</div>}
      {week.laps && <span className="week-laps">{week.laps}</span>}
      {week.rain != null && week.rain > 0 && (
        <span className="week-rain">
          <RainDropSvg /> {week.rain}%
        </span>
      )}
      <button
        className={'week-add-btn' + (isAdded ? ' added' : '')}
        data-raw-name={series.name}
        data-week={week.week}
        onClick={handleToggle}
        title={isAdded ? 'Remove from My Schedule' : 'Add to My Schedule'}
      >
        {isAdded ? '✓' : '+'}
      </button>
    </div>
  );
}
