import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import { SCHEDULE_DATA } from '../data';
import { baseTrackName } from '../utils/helpers';
import { TRACK_SKUS, CAR_SKUS } from '../data/iracing-skus';
import { calcTotal, DISCOUNT_TIERS } from '../data/iracing-prices';

type BuyTab = 'tracks' | 'cars';

function buildTrackList(): string[] {
  const s = new Set<string>();
  SCHEDULE_DATA.forEach(series => series.weeks.forEach(w => { if (w.track) s.add(baseTrackName(w.track)); }));
  return [...s].sort((a, b) => a.localeCompare(b));
}

function buildCarList(): string[] {
  const s = new Set<string>();
  SCHEDULE_DATA.forEach(series =>
    series.cars.split(',').forEach(c => { const n = c.trim(); if (n && !n.startsWith('See race')) s.add(n); })
  );
  return [...s].sort((a, b) => a.localeCompare(b));
}

const ALL_TRACKS = buildTrackList();
const ALL_CARS = buildCarList();

const IRACING_STORE_URL = 'https://members.iracing.com/membersite/member/store_r.jsp';

const IconCar = () => (
  <svg width="16" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 7L5.5 2h7l2 5" />
    <rect x="1" y="7" width="16" height="4" rx="1.5" />
    <circle cx="4.5" cy="12" r="1.5" />
    <circle cx="13.5" cy="12" r="1.5" />
  </svg>
);

const IconTrack = () => (
  <svg width="16" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="9" cy="7" rx="7.5" ry="5" />
    <ellipse cx="9" cy="7" rx="4" ry="2.2" />
  </svg>
);
const FALLBACK_PRICE = 11.95;

function getTrackPrice(name: string): number {
  return TRACK_SKUS[name]?.price ?? FALLBACK_PRICE;
}
function getCarPrice(name: string): number {
  return CAR_SKUS[name]?.price ?? FALLBACK_PRICE;
}
function getTrackSku(name: string): number | null {
  return TRACK_SKUS[name]?.sku ?? null;
}
function getCarSku(name: string): number | null {
  return CAR_SKUS[name]?.sku ?? null;
}

export default function BuyGuidePanel() {
  const ownedTracks = useStore(s => s.ownedTracks);
  const ownedCars = useStore(s => s.ownedCars);
  const mySchedule = useStore(s => s.mySchedule);

  const [buyTab, setBuyTab] = useState<BuyTab>('tracks');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [selectedCars, setSelectedCars] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showOwned, setShowOwned] = useState(false);

  const myScheduleTracks = useMemo(() => {
    const s = new Set<string>();
    Object.values(mySchedule).forEach(e => s.add(baseTrackName(e.track)));
    return s;
  }, [mySchedule]);

  const myScheduleCars = useMemo(() => {
    const s = new Set<string>();
    Object.values(mySchedule).forEach(e =>
      e.cars.split(',').forEach(c => { const n = c.trim(); if (n && !n.startsWith('See race')) s.add(n); })
    );
    return s;
  }, [mySchedule]);

  const hasMySchedule = Object.keys(mySchedule).length > 0;

  const displayTracks = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_TRACKS.filter(t => {
      if (!showOwned && ownedTracks.has(t)) return false;
      if (q && !t.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, showOwned, ownedTracks]);

  const displayCars = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_CARS.filter(c => {
      if (!showOwned && ownedCars.has(c)) return false;
      if (q && !c.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, showOwned, ownedCars]);

  function toggleTrack(name: string) {
    setSelectedTracks(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function toggleCar(name: string) {
    setSelectedCars(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function handleSmartSelectTracks() {
    const needed = new Set<string>();
    myScheduleTracks.forEach(t => { if (!ownedTracks.has(t)) needed.add(t); });
    setSelectedTracks(needed);
  }

  function handleSmartSelectCars() {
    const needed = new Set<string>();
    myScheduleCars.forEach(c => { if (!ownedCars.has(c)) needed.add(c); });
    setSelectedCars(needed);
  }

  function handleSelectAll() {
    if (buyTab === 'tracks') {
      setSelectedTracks(new Set(displayTracks.filter(t => !ownedTracks.has(t))));
    } else {
      setSelectedCars(new Set(displayCars.filter(c => !ownedCars.has(c))));
    }
  }

  function handleClear() {
    if (buyTab === 'tracks') setSelectedTracks(new Set());
    else setSelectedCars(new Set());
  }

  // Price calculation: combined tracks + cars
  const selectedTrackPrices = [...selectedTracks].map(getTrackPrice);
  const selectedCarPrices = [...selectedCars].map(getCarPrice);
  const priceCalc = calcTotal([...selectedTrackPrices, ...selectedCarPrices]);

  function handleBuyOnIRacing() {
    const skus: number[] = [];
    selectedTracks.forEach(name => {
      const sku = getTrackSku(name);
      if (sku && sku > 0) skus.push(sku);
    });
    selectedCars.forEach(name => {
      const sku = getCarSku(name);
      if (sku && sku > 0) skus.push(sku);
    });
    if (skus.length === 0) return;
    const uniqueSkus = [...new Set(skus)];
    window.open(`${IRACING_STORE_URL}?skus=${uniqueSkus.join(',')}`, '_blank', 'noopener,noreferrer');
  }

  const totalSelected = selectedTracks.size + selectedCars.size;

  // Find next discount tier
  const nextTier = DISCOUNT_TIERS.find(t => t.minItems > priceCalc.count && t.minItems !== Infinity);

  return (
    <div className="buy-guide-panel">
      <div className="buy-guide-header">
        <div className="buy-guide-sub-tabs">
          <button
            className={'buy-sub-tab-btn' + (buyTab === 'tracks' ? ' active' : '')}
            onClick={() => setBuyTab('tracks')}
          >
            <IconTrack />Tracks
            <span className="buy-tab-count">{selectedTracks.size > 0 ? selectedTracks.size : ''}</span>
          </button>
          <button
            className={'buy-sub-tab-btn' + (buyTab === 'cars' ? ' active' : '')}
            onClick={() => setBuyTab('cars')}
          >
            <IconCar />Cars
            <span className="buy-tab-count">{selectedCars.size > 0 ? selectedCars.size : ''}</span>
          </button>
        </div>
        <div className="buy-guide-toolbar">
          <input
            className="buy-guide-search"
            type="text"
            placeholder={buyTab === 'tracks' ? 'Search tracks…' : 'Search cars…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="buy-toolbar-btn buy-smart-btn"
            onClick={buyTab === 'tracks' ? handleSmartSelectTracks : handleSmartSelectCars}
            disabled={!hasMySchedule}
            title={hasMySchedule ? 'Select items needed for My Schedule' : 'Add races to My Schedule first'}
          >
            ⚡ My Schedule
          </button>
          <button className="buy-toolbar-btn" onClick={handleSelectAll}>Select all</button>
          <button className="buy-toolbar-btn" onClick={handleClear}>Clear</button>
          <label className="buy-show-owned-toggle">
            <input
              type="checkbox"
              checked={showOwned}
              onChange={e => setShowOwned(e.target.checked)}
            />
            Show owned
          </label>
        </div>
      </div>

      <div className="buy-guide-list">
        {buyTab === 'tracks' && (
          displayTracks.length === 0
            ? <div className="buy-empty">No tracks found</div>
            : displayTracks.map(name => {
              const owned = ownedTracks.has(name);
              const selected = selectedTracks.has(name);
              const inMySchedule = myScheduleTracks.has(name) && !owned;
              const hasSku = getTrackSku(name) !== null;
              return (
                <label key={name} className={'buy-item' + (owned ? ' buy-item-owned' : '')}>
                  <input
                    type="checkbox"
                    checked={selected || owned}
                    disabled={owned}
                    onChange={() => !owned && toggleTrack(name)}
                  />
                  <span className={'buy-checkbox' + (selected || owned ? ' checked' : '')} />
                  <span className="buy-item-name">{name}</span>
                  {inMySchedule && <span className="buy-badge buy-badge-sched">My Schedule</span>}
                  {!owned && hasSku && (
                    <span className="buy-item-price">${getTrackPrice(name).toFixed(2)}</span>
                  )}
                  {owned && <span className="buy-badge buy-badge-owned">Owned</span>}
                  {!owned && !hasSku && <span className="buy-badge buy-badge-unknown">No SKU</span>}
                </label>
              );
            })
        )}
        {buyTab === 'cars' && (
          displayCars.length === 0
            ? <div className="buy-empty">No cars found</div>
            : displayCars.map(name => {
              const owned = ownedCars.has(name);
              const selected = selectedCars.has(name);
              const inMySchedule = myScheduleCars.has(name) && !owned;
              const hasSku = getCarSku(name) !== null;
              return (
                <label key={name} className={'buy-item' + (owned ? ' buy-item-owned' : '')}>
                  <input
                    type="checkbox"
                    checked={selected || owned}
                    disabled={owned}
                    onChange={() => !owned && toggleCar(name)}
                  />
                  <span className={'buy-checkbox' + (selected || owned ? ' checked' : '')} />
                  <span className="buy-item-name">{name}</span>
                  {inMySchedule && <span className="buy-badge buy-badge-sched">My Schedule</span>}
                  {!owned && hasSku && (
                    <span className="buy-item-price">${getCarPrice(name).toFixed(2)}</span>
                  )}
                  {owned && <span className="buy-badge buy-badge-owned">Owned</span>}
                  {!owned && !hasSku && <span className="buy-badge buy-badge-unknown">No SKU</span>}
                </label>
              );
            })
        )}
      </div>

      <div className={'buy-price-bar' + (totalSelected === 0 ? ' buy-price-bar-empty' : '')}>
        {totalSelected === 0 ? (
          <span className="buy-price-empty-msg">Select tracks or cars to see pricing</span>
        ) : (
          <>
            <div className="buy-price-summary">
              <span className="buy-price-count">
                {selectedTracks.size > 0 && `${selectedTracks.size} track${selectedTracks.size !== 1 ? 's' : ''}`}
                {selectedTracks.size > 0 && selectedCars.size > 0 && ' + '}
                {selectedCars.size > 0 && `${selectedCars.size} car${selectedCars.size !== 1 ? 's' : ''}`}
              </span>
              <span className="buy-price-subtotal">Subtotal: ${priceCalc.subtotal.toFixed(2)}</span>
              {priceCalc.discountPct > 0 && (
                <span className="buy-price-discount">
                  {priceCalc.discountPct}% off —{' '}
                  <span className="buy-price-discount-amount">−${priceCalc.discountAmount.toFixed(2)}</span>
                </span>
              )}
              {nextTier && (
                <span className="buy-price-next-tier">
                  Add {nextTier.minItems - priceCalc.count} more for {nextTier.discountPct}% off
                </span>
              )}
              <span className="buy-price-total">Total: ${priceCalc.total.toFixed(2)}</span>
            </div>
            <button
              className="buy-iracing-btn"
              onClick={handleBuyOnIRacing}
              title="Open iRacing store with selected items"
            >
              Buy on iRacing →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
