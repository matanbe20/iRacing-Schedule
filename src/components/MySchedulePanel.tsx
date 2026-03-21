import React from 'react';
import useStore from '../store/useStore';
import MyRaceCard from './MyRaceCard';
import ExportButtons from './ExportButtons';
import type { RaceEntry } from '../types';

export default function MySchedulePanel() {
  const mySchedule = useStore(s => s.mySchedule);
  const entries = Object.values(mySchedule);

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

  const groups: Record<string, RaceEntry[]> = {};
  const groupOrder: string[] = [];
  entries.forEach(e => {
    const key = 'Week ' + e.weekNum + ' \u2014 ' + e.date;
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(e);
  });

  return (
    <div>
      <div className="my-schedule-header">
        <span className="count-label">{entries.length} race{entries.length !== 1 ? 's' : ''} saved</span>
        <ExportButtons />
      </div>
      {groupOrder.map(key => (
        <div key={key} className="my-week-group">
          <div className="my-week-label">{key}</div>
          {groups[key].map(e => (
            <MyRaceCard key={e.id} entry={e} />
          ))}
        </div>
      ))}
    </div>
  );
}
