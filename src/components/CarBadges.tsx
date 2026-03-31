import React, { useRef, useState } from 'react';
import useStore from '../store/useStore';
import { groupCarsByClass } from '../utils/helpers';

interface CarBadgesProps {
  cars: string;
}

export default function CarBadges({ cars }: CarBadgesProps) {
  const clearCarFilter = useStore(s => s.clearCarFilter);
  const addCarFilter = useStore(s => s.addCarFilter);
  const setActiveTab = useStore(s => s.setActiveTab);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [tooltipBelow, setTooltipBelow] = useState(false);

  const groups = groupCarsByClass(cars);

  function handleCarClick(e: React.MouseEvent, car: string) {
    e.stopPropagation();
    clearCarFilter();
    addCarFilter(car);
    setActiveTab('all');
  }

  function handleGroupClick(e: React.MouseEvent, carList: string[]) {
    e.stopPropagation();
    clearCarFilter();
    carList.forEach(car => addCarFilter(car));
    setActiveTab('all');
  }

  function openTooltip() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setTooltipBelow(rect.top < window.innerHeight / 2);
    }
    setOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  // < 3 cars: individual badges
  if (!groups) {
    const carList = cars.split(',').map(c => c.trim()).filter(Boolean);
    return (
      <>
        {carList.map((car, i) => (
          <span key={i} className="tw-card-cars-badge tw-card-cars-clickable" onClick={e => handleCarClick(e, car)}>
            {car}
          </span>
        ))}
      </>
    );
  }

  // Multiple class groups: single Multi-Class badge with structured tooltip
  if (groups.length > 1) {
    const allCars = groups.flatMap(g => g.cars);
    const tooltipClass = `cars-tooltip cars-multiclass-tooltip${tooltipBelow ? ' cars-tooltip-below' : ''}`;
    return (
      <span ref={wrapperRef} className="cars-group-wrapper" onMouseEnter={openTooltip} onMouseLeave={scheduleClose}>
        <span
          className="tw-card-cars-badge tw-card-cars-group"
          onClick={e => handleGroupClick(e, allCars)}
        >
          Multi-Class
        </span>
        {open && (
          <span className={tooltipClass} onMouseEnter={openTooltip} onMouseLeave={scheduleClose}>
            {groups.map((group, i) => (
              <span key={i} className="cars-multiclass-row" onClick={e => handleGroupClick(e, group.cars)}>
                <span className="cars-multiclass-label">{group.label}</span>
                <span className="cars-multiclass-cars">{group.cars.join(', ')}</span>
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  // Single class group
  const group = groups[0];
  return (
    <span ref={wrapperRef} className="cars-group-wrapper" onMouseEnter={openTooltip} onMouseLeave={scheduleClose}>
      {group.cars.length === 1 ? (
        <span
          className="tw-card-cars-badge tw-card-cars-clickable"
          onClick={e => handleCarClick(e, group.cars[0])}
        >
          {group.cars[0]}
        </span>
      ) : (
        <>
          <span
            className="tw-card-cars-badge tw-card-cars-group"
            onClick={e => handleGroupClick(e, group.cars)}
          >
            {group.label}
          </span>
          {open && (
            <span className={`cars-tooltip cars-multiclass-tooltip${tooltipBelow ? ' cars-tooltip-below' : ''}`} onMouseEnter={openTooltip} onMouseLeave={scheduleClose}>
              <span className="cars-multiclass-row" onClick={e => handleGroupClick(e, group.cars)}>
                <span className="cars-multiclass-label">{group.label}</span>
                <span className="cars-multiclass-cars">{group.cars.join(', ')}</span>
              </span>
            </span>
          )}
        </>
      )}
    </span>
  );
}
