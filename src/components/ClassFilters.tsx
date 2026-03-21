import React from 'react';
import useStore from '../store/useStore';
import { ALL_CLASSES } from '../store/useStore';

export default function ClassFilters() {
  const activeClasses = useStore(s => s.activeClasses);
  const toggleClass = useStore(s => s.toggleClass);

  return (
    <div className="filter-group" id="class-filters">
      {ALL_CLASSES.map(cls => (
        <button
          key={cls}
          className={'filter-btn' + (activeClasses.has(cls) ? ' active' : '')}
          data-cls={cls}
          onClick={() => toggleClass(cls)}
        >
          {cls}
        </button>
      ))}
    </div>
  );
}
