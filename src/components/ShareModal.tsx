import React from 'react';
import useStore from '../store/useStore';
import { catClass, catLabel, catLabelShort } from '../utils/helpers';
import type { RaceEntry } from '../types';

function SharedRaceRow({ entry }: { entry: RaceEntry }) {
  const mySchedule = useStore(s => s.mySchedule);
  const addSharedRace = useStore(s => s.addSharedRace);
  const alreadyAdded = !!mySchedule[entry.id];
  const cc = catClass(entry.category);
  const meta = [entry.track, entry.laps, entry.cars].filter(Boolean).join(' · ');

  return (
    <div className="my-race-card">
      <span className={'cat-badge ' + cc} data-short={catLabelShort(entry.category)}>{catLabel(entry.category)}</span>
      <span className={'class-badge ' + entry.cls}>{entry.cls}</span>
      <div className="my-race-info">
        <div className="my-race-title">{entry.displayName}</div>
        <div className="my-race-meta">{meta}</div>
      </div>
      <button
        className={'share-modal-add-btn' + (alreadyAdded ? ' added' : '')}
        onClick={() => !alreadyAdded && addSharedRace(entry.id)}
        disabled={alreadyAdded}
      >
        {alreadyAdded ? '✓' : '+'}
      </button>
    </div>
  );
}

export default function ShareModal() {
  const isShareModalOpen = useStore(s => s.isShareModalOpen);
  const sharedEntries = useStore(s => s.sharedEntries);
  const mySchedule = useStore(s => s.mySchedule);
  const closeShareModal = useStore(s => s.closeShareModal);
  const addAllShared = useStore(s => s.addAllShared);

  if (!isShareModalOpen) return null;

  const groups: Record<string, RaceEntry[]> = {};
  const groupOrder: string[] = [];
  sharedEntries.forEach(e => {
    const key = 'Week ' + e.weekNum + ' \u2014 ' + e.date;
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(e);
  });

  const remaining = sharedEntries.filter(e => !mySchedule[e.id]).length;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeShareModal();
  }

  return (
    <div className="share-modal-overlay" onClick={handleOverlayClick} style={{ display: 'flex' }}>
      <div className="share-modal">
        <div className="share-modal-header">
          <span className="share-modal-title">Shared Schedule</span>
          <button className="share-modal-close" onClick={closeShareModal} title="Close">&#x2715;</button>
        </div>
        <div className="share-modal-body">
          {groupOrder.map(key => (
            <div key={key} className="my-week-group">
              <div className="my-week-label">{key}</div>
              {groups[key].map(e => (
                <SharedRaceRow key={e.id} entry={e} />
              ))}
            </div>
          ))}
        </div>
        <div className="share-modal-footer">
          <button
            className="share-modal-add-all"
            onClick={addAllShared}
            disabled={remaining === 0}
          >
            {remaining === 0 ? '\u2713 All Added' : '+ Add All (' + remaining + ')'}
          </button>
        </div>
      </div>
    </div>
  );
}
