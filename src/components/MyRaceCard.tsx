import React from 'react';
import useStore from '../store/useStore';
import { catClass, catLabel, catLabelShort, baseTrackName } from '../utils/helpers';
import CarBadges from './CarBadges';
import type { RaceEntry } from '../types';

interface MyRaceCardProps {
  entry: RaceEntry;
}

export default function MyRaceCard({ entry }: MyRaceCardProps) {
  const removeRace = useStore(s => s.removeRace);
  const clearTrackFilter = useStore(s => s.clearTrackFilter);
  const addTrackFilter = useStore(s => s.addTrackFilter);
  const setActiveTab = useStore(s => s.setActiveTab);
  const ownedTracks = useStore(s => s.ownedTracks);
  const cc = catClass(entry.category);
  const trackOwned = ownedTracks.size > 0 && ownedTracks.has(baseTrackName(entry.track));

  function handleTrackClick(e: React.MouseEvent) {
    e.stopPropagation();
    clearTrackFilter();
    addTrackFilter(baseTrackName(entry.track));
    setActiveTab('all');
  }

  return (
    <div className="my-race-card">
      <span className={'cat-badge ' + cc} data-short={catLabelShort(entry.category)}>{catLabel(entry.category)}</span>
      <span className={'class-badge ' + entry.cls}>{entry.cls}</span>
      <div className="my-race-info">
        <div className="my-race-title">{entry.displayName}</div>
        <div className="my-race-meta">
          <span className="my-race-track-badge" onClick={handleTrackClick} title="Filter by this track">{entry.track}{trackOwned && <span className="track-owned-badge">Owned</span>}</span>
          {entry.laps && <span className="tw-card-laps">{entry.laps}</span>}
          {entry.rain != null && entry.rain > 0 && <span className="week-rain">💧 {entry.rain}%</span>}
          {entry.cars && <CarBadges cars={entry.cars} />}
        </div>
      </div>
      <button className="my-race-remove" onClick={() => removeRace(entry.id)} title="Remove">&#x2715;</button>
    </div>
  );
}
