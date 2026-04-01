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
  const filterOwnedCars = useStore(s => s.filterOwnedCars);
  const filterOwnedTracks = useStore(s => s.filterOwnedTracks);
  const toggleFilterOwnedCars = useStore(s => s.toggleFilterOwnedCars);
  const toggleFilterOwnedTracks = useStore(s => s.toggleFilterOwnedTracks);
  const openGarageModal = useStore(s => s.openGarageModal);

  const allDefault =
    ALL_CATEGORIES.every(c => activeCategories.has(c)) &&
    ALL_CLASSES.every(c => activeClasses.has(c)) &&
    activeCars.size === 0 &&
    activeTracks.size === 0 &&
    !searchQuery &&
    !filterOwnedCars &&
    !filterOwnedTracks;

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
          <div className="garage-filter-row">
            <button
              className={'garage-filter-btn' + (filterOwnedCars ? ' active' : '')}
              onClick={toggleFilterOwnedCars}
              disabled={ownedCars.size === 0}
              title="Show only series where you own a car"
            >
              Owned Cars
            </button>
            <button
              className={'garage-filter-btn' + (filterOwnedTracks ? ' active' : '')}
              onClick={toggleFilterOwnedTracks}
              disabled={ownedTracks.size === 0}
              title="Show only series where you own the track"
            >
              Owned Tracks
            </button>
          </div>
        </div>

        <div className="sidebar-support-btns">
          <a
            href="https://discord.gg/brRFWVQk"
            target="_blank"
            rel="noreferrer"
            className="discord-sidebar-btn"
            aria-label="Join Discord"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Join My Discord
          </a>
          <a
            href="https://ko-fi.com/matanbm91"
            target="_blank"
            rel="noreferrer"
            className="kofi-sidebar-btn"
            aria-label="Buy Me a Coffee"
          >
            <img src="https://storage.ko-fi.com/cdn/logomarkLogo.png" alt="Ko-fi" width="20" height="20" style={{objectFit:'contain'}} />
            Buy me a coffee
          </a>
        </div>
      </aside>

      <div
        className={'drawer-overlay' + (isDrawerOpen ? ' visible' : '')}
        id="drawer-overlay"
        onClick={closeDrawer}
      />
    </>
  );
}
