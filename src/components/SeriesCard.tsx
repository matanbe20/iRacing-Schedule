import React, { useState } from 'react';
import useStore from '../store/useStore';
import { catClass, catLabel, catLabelShort, cleanName, isFixed } from '../utils/helpers';
import WeekCell from './WeekCell';
import type { Series } from '../types';

const RainDropSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.5 9.5 4 13.5 4 17a8 8 0 0 0 16 0c0-3.5-2.5-7.5-8-15z"/>
  </svg>
);

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const mySchedule = useStore(s => s.mySchedule);
  const toggleSeries = useStore(s => s.toggleSeries);
  const filterByCategory = useStore(s => s.filterByCategory);
  const filterByClass = useStore(s => s.filterByClass);

  const cc = catClass(series.category);
  const displayName = cleanName(series.name);
  const fixed = isFixed(series.name);
  const hasRain = series.weeks.some(w => w.rain != null && w.rain > 0);
  const allAdded = series.weeks.every(w => !!mySchedule[series.name + '_' + w.week]);

  function handleToggleSeries(e: React.MouseEvent) {
    e.stopPropagation();
    toggleSeries(series.name);
  }

  function handleFilterCat(e: React.MouseEvent) {
    e.stopPropagation();
    filterByCategory(series.category);
  }

  function handleFilterClass(e: React.MouseEvent) {
    e.stopPropagation();
    filterByClass(series.class);
  }

  return (
    <div className={'series-card' + (expanded ? ' expanded' : '')}>
      <div className="series-header" onClick={() => setExpanded(e => !e)}>
        <span
          className={'cat-badge ' + cc + ' filterable'}
          data-short={catLabelShort(series.category)}
          onClick={handleFilterCat}
          title={'Filter by ' + catLabel(series.category)}
        >
          {catLabel(series.category)}
        </span>
        <span
          className={'class-badge ' + series.class + ' filterable'}
          onClick={handleFilterClass}
          title={'Filter by class ' + series.class}
        >
          {series.class}
        </span>
        <span className="series-title">
          {displayName}
          {fixed && <span style={{ opacity: 0.5, fontSize: '0.75rem' }}> [Fixed]</span>}
        </span>
        <span className="series-cars" title={series.cars}>{series.cars}</span>
        <span className="series-freq">{series.frequency}</span>
        {hasRain && (
          <span className="series-rain-icon" title="Rain forecast in some weeks">
            <RainDropSvg />
          </span>
        )}
        <button
          className={'series-add-btn' + (allAdded ? ' added' : '')}
          data-raw-name={series.name}
          onClick={handleToggleSeries}
          title={allAdded ? 'Remove all weeks from My Schedule' : 'Add all weeks to My Schedule'}
        >
          {allAdded ? '✓ All' : '+ All'}
        </button>
        <span className="expand-icon">&#9662;</span>
      </div>
      <div className="schedule-body">
        <div className="schedule-body-inner">
          <div className="week-grid">
            {series.weeks.map((week, i) => (
              <WeekCell key={i} series={series} week={week} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
