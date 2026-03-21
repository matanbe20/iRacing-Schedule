import React from 'react';
import useStore from '../store/useStore';
import { ALL_CATEGORIES, ALL_CLASSES } from '../store/useStore';
import CategoryFilters from './CategoryFilters';
import ClassFilters from './ClassFilters';
import AutocompleteFilter from './AutocompleteFilter';

const GarageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <path d="M16 8h5l2 4v4h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

export default function FilterSidebar() {
  const activeCategories = useStore(s => s.activeCategories);
  const activeClasses = useStore(s => s.activeClasses);
  const searchQuery = useStore(s => s.searchQuery);
  const activeCars = useStore(s => s.activeCars);
  const activeTracks = useStore(s => s.activeTracks);
  const isDrawerOpen = useStore(s => s.isDrawerOpen);
  const closeDrawer = useStore(s => s.closeDrawer);
  const clearAllFilters = useStore(s => s.clearAllFilters);
  const clearCarFilter = useStore(s => s.clearCarFilter);
  const clearTrackFilter = useStore(s => s.clearTrackFilter);
  const addCarFilter = useStore(s => s.addCarFilter);
  const removeCarFilter = useStore(s => s.removeCarFilter);
  const addTrackFilter = useStore(s => s.addTrackFilter);
  const removeTrackFilter = useStore(s => s.removeTrackFilter);
  const ownedCars = useStore(s => s.ownedCars);
  const ownedTracks = useStore(s => s.ownedTracks);
  const openGarageModal = useStore(s => s.openGarageModal);

  const allDefault =
    ALL_CATEGORIES.every(c => activeCategories.has(c)) &&
    ALL_CLASSES.every(c => activeClasses.has(c)) &&
    activeCars.size === 0 &&
    activeTracks.size === 0 &&
    !searchQuery;

  return (
    <>
      <aside className={'filter-sidebar' + (isDrawerOpen ? ' drawer-open' : '')} id="filter-sidebar">
        <div className="filter-section">
          <div className="filter-section-header">
            Type
            <button
              className={'filter-clear-btn' + (!allDefault ? ' visible' : '')}
              id="all-clear-btn"
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          </div>
          <CategoryFilters />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">Class</div>
          <ClassFilters />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">
            Car
            <button
              className={'filter-clear-btn' + (activeCars.size > 0 ? ' visible' : '')}
              id="car-clear-btn"
              onClick={clearCarFilter}
            >
              Clear
            </button>
          </div>
          <AutocompleteFilter
            type="car"
            activeItems={activeCars}
            onAdd={addCarFilter}
            onRemove={removeCarFilter}
            onClear={clearCarFilter}
          />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">
            Track
            <button
              className={'filter-clear-btn' + (activeTracks.size > 0 ? ' visible' : '')}
              id="track-clear-btn"
              onClick={clearTrackFilter}
            >
              Clear
            </button>
          </div>
          <AutocompleteFilter
            type="track"
            activeItems={activeTracks}
            onAdd={addTrackFilter}
            onRemove={removeTrackFilter}
            onClear={clearTrackFilter}
          />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">My Garage</div>
          <button className="garage-open-btn" onClick={openGarageModal}>
            <GarageIcon />
            Manage My Garage
            <span className="garage-open-counts">
              {ownedCars.size}c / {ownedTracks.size}t
            </span>
          </button>
        </div>

        <a
          href="https://ko-fi.com/R5R41VWUGJ"
          target="_blank"
          rel="noreferrer"
          className="kofi-img-btn"
        >
          <img
            style={{ border: '0px' }}
            src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
            alt="Buy Me a Coffee at ko-fi.com"
          />
        </a>
      </aside>

      <div
        className={'drawer-overlay' + (isDrawerOpen ? ' visible' : '')}
        id="drawer-overlay"
        onClick={closeDrawer}
      />
    </>
  );
}
