import React, { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import MyRaceCard from './MyRaceCard';
import ExportButtons from './ExportButtons';
import { shortDate } from '../utils/helpers';
import { getCurrentWeek } from '../utils/schedule';
import type { RaceEntry } from '../types';

const currentWeek = getCurrentWeek();

export default function MySchedulePanel() {
  const mySchedule = useStore(s => s.mySchedule);
  const entries = Object.values(mySchedule);

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      document.documentElement.style.setProperty('--my-schedule-header-height', headerRef.current.offsetHeight + 'px');
    }
    const t = setTimeout(() => {
      document.getElementById('my-week-' + currentWeek)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => clearTimeout(t);
  }, []);

  if (!entries.length) {
    return (
      <div className="my-schedule-empty">
        <p>No races saved yet.</p>
        <small>Click the <strong>+</strong> button on any week cell to add races to your schedule.</small>
      </div>
    );
  }

  entries.sort((a, b) => {
    if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
    return a.displayName.localeCompare(b.displayName);
  });

  const groups: Record<number, RaceEntry[]> = {};
  const groupOrder: number[] = [];
  entries.forEach(e => {
    if (!groups[e.weekNum]) { groups[e.weekNum] = []; groupOrder.push(e.weekNum); }
    groups[e.weekNum].push(e);
  });

  return (
    <div>
      <div className="my-schedule-header" ref={headerRef}>
        <span className="count-label">{entries.length} race{entries.length !== 1 ? 's' : ''} saved</span>
        <ExportButtons />
      </div>
      {groupOrder.map(weekNum => (
        <div key={weekNum} id={'my-week-' + weekNum} className={'my-week-group' + (weekNum < currentWeek ? ' past' : '')}>
          <div className="my-week-label">
            Week {weekNum} &mdash; {shortDate(groups[weekNum][0].date)}
            {weekNum === currentWeek && <span className="my-week-now">Current</span>}
          </div>
          {groups[weekNum].map(e => (
            <MyRaceCard key={e.id} entry={e} />
          ))}
        </div>
      ))}
    </div>
  );
}
