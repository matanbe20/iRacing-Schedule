import React from 'react';
import useStore from '../store/useStore';
import { catClass, catLabel, catLabelShort } from '../utils/helpers';
import type { RaceEntry } from '../types';

interface MyRaceCardProps {
  entry: RaceEntry;
}

export default function MyRaceCard({ entry }: MyRaceCardProps) {
  const removeRace = useStore(s => s.removeRace);
  const cc = catClass(entry.category);
  return (
    <div className="my-race-card">
      <span className={'cat-badge ' + cc} data-short={catLabelShort(entry.category)}>{catLabel(entry.category)}</span>
      <span className={'class-badge ' + entry.cls}>{entry.cls}</span>
      <div className="my-race-info">
        <div className="my-race-title">{entry.displayName}</div>
        <div className="my-race-meta">
          <span className="tw-card-track">{entry.track}</span>
          {entry.laps && <span className="tw-card-laps">{entry.laps}</span>}
          {entry.rain != null && entry.rain > 0 && <span className="week-rain">💧 {entry.rain}%</span>}
          {entry.cars && <span className="tw-card-cars"> · {entry.cars}</span>}
        </div>
      </div>
      <button className="my-race-remove" onClick={() => removeRace(entry.id)} title="Remove">&#x2715;</button>
    </div>
  );
}
