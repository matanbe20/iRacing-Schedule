import React from 'react';
import useStore from '../store/useStore';
import { catClass, catLabel, catLabelShort, cleanName } from '../utils/helpers';
import type { Series, Week } from '../types';

interface TwCardProps {
  series: Series;
  week: Week;
}

export default function TwCard({ series, week }: TwCardProps) {
  const mySchedule = useStore(s => s.mySchedule);
  const favorites = useStore(s => s.favorites);
  const toggleRace = useStore(s => s.toggleRace);
  const toggleFavorite = useStore(s => s.toggleFavorite);

  const cc = catClass(series.category);
  const raceId = series.name + '_' + week.week;
  const isAdded = !!mySchedule[raceId];
  const isFav = favorites.has(series.name);
  const meta = [week.track, week.laps, series.cars].filter(Boolean).join(' · ');

  function handleToggleRace(e: React.MouseEvent) {
    e.stopPropagation();
    toggleRace(series.name, week.week);
  }

  return (
    <div className="tw-card">
      <span className={'cat-badge ' + cc} data-short={catLabelShort(series.category)}>{catLabel(series.category)}</span>
      <span className={'class-badge ' + series.class}>{series.class}</span>
      <div className="tw-card-info">
        <div className="tw-card-title">{cleanName(series.name)}</div>
        <div className="tw-card-meta">{meta}</div>
      </div>
      <button
        className={'tw-fav-btn' + (isFav ? ' active' : '')}
        onClick={() => toggleFavorite(series.name)}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFav ? '★' : '☆'}
      </button>
      <button
        className={'week-add-btn' + (isAdded ? ' added' : '')}
        data-raw-name={series.name}
        data-week={week.week}
        onClick={handleToggleRace}
        title={isAdded ? 'Remove from My Schedule' : 'Add to My Schedule'}
      >
        {isAdded ? '✓' : '+'}
      </button>
    </div>
  );
}
