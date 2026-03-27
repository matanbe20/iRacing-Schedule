import React from 'react';
import useStore from '../store/useStore';

export default function SharedGarageModal() {
  const isOpen = useStore(s => s.isGarageShareModalOpen);
  const sharedGarageCars = useStore(s => s.sharedGarageCars);
  const sharedGarageTracks = useStore(s => s.sharedGarageTracks);
  const ownedCars = useStore(s => s.ownedCars);
  const ownedTracks = useStore(s => s.ownedTracks);
  const closeGarageShareModal = useStore(s => s.closeGarageShareModal);
  const mergeSharedGarage = useStore(s => s.mergeSharedGarage);

  if (!isOpen) return null;

  const newCars = sharedGarageCars.filter(c => !ownedCars.has(c)).length;
  const newTracks = sharedGarageTracks.filter(t => !ownedTracks.has(t)).length;
  const hasNew = newCars > 0 || newTracks > 0;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeGarageShareModal();
  }

  return (
    <div className="share-modal-overlay" onClick={handleOverlayClick} style={{ display: 'flex' }}>
      <div className="share-modal">
        <div className="share-modal-header">
          <span className="share-modal-title">Shared Garage</span>
          <button className="share-modal-close" onClick={closeGarageShareModal} title="Close">&#x2715;</button>
        </div>

        <div className="share-modal-body">
          {sharedGarageCars.length > 0 && (
            <div className="shared-garage-section">
              <div className="shared-garage-section-label">
                Cars <span className="shared-garage-count">{sharedGarageCars.length}</span>
              </div>
              {sharedGarageCars.map(car => (
                <div key={car} className={'shared-garage-item' + (ownedCars.has(car) ? ' owned' : '')}>
                  <span className="shared-garage-name">{car}</span>
                  {ownedCars.has(car) && <span className="shared-garage-owned-badge">Owned</span>}
                </div>
              ))}
            </div>
          )}

          {sharedGarageTracks.length > 0 && (
            <div className="shared-garage-section">
              <div className="shared-garage-section-label">
                Tracks <span className="shared-garage-count">{sharedGarageTracks.length}</span>
              </div>
              {sharedGarageTracks.map(track => (
                <div key={track} className={'shared-garage-item' + (ownedTracks.has(track) ? ' owned' : '')}>
                  <span className="shared-garage-name">{track}</span>
                  {ownedTracks.has(track) && <span className="shared-garage-owned-badge">Owned</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="share-modal-footer">
          <button
            className="share-modal-add-all"
            onClick={mergeSharedGarage}
            disabled={!hasNew}
          >
            {hasNew
              ? '+ Add to my garage (' + [newCars > 0 && newCars + ' car' + (newCars !== 1 ? 's' : ''), newTracks > 0 && newTracks + ' track' + (newTracks !== 1 ? 's' : '')].filter(Boolean).join(', ') + ')'
              : '\u2713 Already in your garage'}
          </button>
        </div>
      </div>
    </div>
  );
}
