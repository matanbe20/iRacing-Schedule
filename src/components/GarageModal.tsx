import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import { SCHEDULE_DATA } from '../data';
import { baseTrackName } from '../utils/helpers';
import { FREE_CARS, FREE_TRACKS } from '../data/garage-defaults';

const FREE_CARS_SET = new Set(FREE_CARS);
const FREE_TRACKS_SET = new Set(FREE_TRACKS);

function buildCarList(): string[] {
  const s = new Set<string>();
  SCHEDULE_DATA.forEach(series =>
    series.cars.split(',').forEach(c => { const n = c.trim(); if (n && !n.startsWith('See race')) s.add(n); })
  );
  return [...s].sort((a, b) => a.localeCompare(b));
}

function buildTrackList(): string[] {
  const s = new Set<string>();
  SCHEDULE_DATA.forEach(series => series.weeks.forEach(w => { if (w.track) s.add(baseTrackName(w.track)); }));
  return [...s].sort((a, b) => a.localeCompare(b));
}

const ALL_CARS = buildCarList();
const ALL_TRACKS = buildTrackList();

type GarageTab = 'cars' | 'tracks';

export default function GarageModal() {
  const isOpen = useStore(s => s.isGarageModalOpen);
  const ownedCars = useStore(s => s.ownedCars);
  const ownedTracks = useStore(s => s.ownedTracks);
  const setOwnedCars = useStore(s => s.setOwnedCars);
  const setOwnedTracks = useStore(s => s.setOwnedTracks);
  const closeGarageModal = useStore(s => s.closeGarageModal);

  const [tab, setTab] = useState<GarageTab>('cars');
  const [search, setSearch] = useState('');
  const [localCars, setLocalCars] = useState<Set<string>>(new Set());
  const [localTracks, setLocalTracks] = useState<Set<string>>(new Set());
  const [garageCopied, setGarageCopied] = useState(false);

  // Sync local state from store when opening
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    setLocalCars(new Set(ownedCars));
    setLocalTracks(new Set(ownedTracks));
    setSearch('');
    setTab('cars');
  }
  if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  const filteredCars = useMemo(() => {
    const q = search.toLowerCase();
    return q ? ALL_CARS.filter(c => c.toLowerCase().includes(q)) : ALL_CARS;
  }, [search]);

  const filteredTracks = useMemo(() => {
    const q = search.toLowerCase();
    return q ? ALL_TRACKS.filter(t => t.toLowerCase().includes(q)) : ALL_TRACKS;
  }, [search]);

  function toggleCar(car: string) {
    setLocalCars(prev => {
      const next = new Set(prev);
      if (next.has(car)) next.delete(car); else next.add(car);
      return next;
    });
  }

  function toggleTrack(track: string) {
    setLocalTracks(prev => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track); else next.add(track);
      return next;
    });
  }

  function handleResetDefaults() {
    if (tab === 'cars') setLocalCars(new Set(FREE_CARS));
    else setLocalTracks(new Set(FREE_TRACKS));
  }

  function handleSelectAll() {
    if (tab === 'cars') setLocalCars(new Set(ALL_CARS));
    else setLocalTracks(new Set(ALL_TRACKS));
  }

  function handleClearAll() {
    if (tab === 'cars') setLocalCars(new Set());
    else setLocalTracks(new Set());
  }

  function handleSave() {
    setOwnedCars(new Set(localCars));
    setOwnedTracks(new Set(localTracks));
    closeGarageModal();
  }

  function handleShareGarage() {
    const encoded = btoa(JSON.stringify({ cars: [...ownedCars], tracks: [...ownedTracks] }));
    const url = location.origin + location.pathname + '?garage=' + encoded;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setGarageCopied(true);
        setTimeout(() => setGarageCopied(false), 2000);
      }).catch(() => { prompt('Copy this URL:', url); });
    } else {
      prompt('Copy this URL:', url);
      setGarageCopied(true);
      setTimeout(() => setGarageCopied(false), 2000);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeGarageModal();
  }

  if (!isOpen) return null;

  const items = tab === 'cars' ? filteredCars : filteredTracks;
  const localSet = tab === 'cars' ? localCars : localTracks;
  const freeSet = tab === 'cars' ? FREE_CARS_SET : FREE_TRACKS_SET;
  const checkedCount = tab === 'cars' ? localCars.size : localTracks.size;
  const totalCount = tab === 'cars' ? ALL_CARS.length : ALL_TRACKS.length;

  return (
    <div className="garage-modal-overlay" onClick={handleOverlayClick}>
      <div className="garage-modal">
        <div className="garage-modal-header">
          <span className="garage-modal-title">My Garage</span>
          <button className="share-modal-close" onClick={closeGarageModal} title="Close">&#x2715;</button>
        </div>

        <div className="garage-modal-tabs">
          <button
            className={'garage-tab-btn' + (tab === 'cars' ? ' active' : '')}
            onClick={() => { setTab('cars'); setSearch(''); }}
          >
            Cars <span className="garage-tab-count">{localCars.size}</span>
          </button>
          <button
            className={'garage-tab-btn' + (tab === 'tracks' ? ' active' : '')}
            onClick={() => { setTab('tracks'); setSearch(''); }}
          >
            Tracks <span className="garage-tab-count">{localTracks.size}</span>
          </button>
        </div>

        <div className="garage-modal-toolbar">
          <input
            className="garage-search"
            type="text"
            placeholder={tab === 'cars' ? 'Search cars…' : 'Search tracks…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoComplete="off"
          />
          <div className="garage-toolbar-actions">
            <button className="garage-action-btn" onClick={handleResetDefaults} title="Select all items included with iRacing membership">
              Free defaults
            </button>
            <button className="garage-action-btn" onClick={handleSelectAll}>All</button>
            <button className="garage-action-btn" onClick={handleClearAll}>None</button>
          </div>
        </div>

        <div className="garage-modal-summary">
          {checkedCount} / {totalCount} {tab === 'cars' ? 'cars' : 'tracks'} selected
        </div>

        <div className="garage-modal-list">
          {items.map(item => {
            const checked = localSet.has(item);
            const isFree = freeSet.has(item);
            return (
              <label key={item} className={'garage-item' + (checked ? ' checked' : '')}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => tab === 'cars' ? toggleCar(item) : toggleTrack(item)}
                />
                <span className="garage-item-name">{item}</span>
                {isFree && <span className="garage-free-badge">Free</span>}
              </label>
            );
          })}
          {items.length === 0 && (
            <div className="garage-empty">No results for "{search}"</div>
          )}
        </div>

        <div className="garage-modal-footer">
          <button className={'garage-share-btn' + (garageCopied ? ' copied' : '')} onClick={handleShareGarage}>
            {garageCopied ? '✓ Copied!' : 'Share Garage'}
          </button>
          <div className="garage-footer-right">
            <button className="garage-cancel-btn" onClick={closeGarageModal}>Cancel</button>
            <button className="garage-save-btn" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
