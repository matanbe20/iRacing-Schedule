import React from 'react';
import useStore from '../store/useStore';
import { SEASON_LABEL, SEASON_DATES } from '../data';
import { ALL_CATEGORIES, ALL_CLASSES } from '../store/useStore';
import SearchBox from './SearchBox';

const MOON_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SUN_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

export default function Header() {
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const openDrawer = useStore(s => s.openDrawer);
  const activeCategories = useStore(s => s.activeCategories);
  const activeClasses = useStore(s => s.activeClasses);
  const activeCars = useStore(s => s.activeCars);
  const activeTracks = useStore(s => s.activeTracks);
  const searchQuery = useStore(s => s.searchQuery);

  const filterCount =
    (ALL_CATEGORIES.every(c => activeCategories.has(c)) ? 0 : 1) +
    (ALL_CLASSES.every(c => activeClasses.has(c)) ? 0 : 1) +
    (activeCars.size > 0 ? activeCars.size : 0) +
    (activeTracks.size > 0 ? activeTracks.size : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div className="header">
      <div className="header-inner">
        <a
          href="https://ko-fi.com/R5R41VWUGJ"
          target="_blank"
          rel="noreferrer"
          className="kofi-mobile-btn"
          aria-label="Buy Me a Coffee"
        >
          <img src="https://storage.ko-fi.com/cdn/logomarkLogo.png" alt="Ko-fi" />
        </a>
        <div className="header-left">
          <h1><span>iRacing</span> Hub</h1>
          <p className="season-label" id="season-label">{SEASON_LABEL}</p>
          <p className="subtitle" id="season-dates">{SEASON_DATES}</p>
        </div>
        <div className="header-right">
          <SearchBox />
          <button
            className="mobile-filter-btn"
            id="mobile-filter-btn"
            onClick={openDrawer}
          >
            Filters{' '}
            <span id="filter-active-count">
              {filterCount > 0 ? String(filterCount) : ''}
            </span>
          </button>
          <button
            className="theme-toggle"
            id="theme-toggle"
            onClick={toggleTheme}
            title="Toggle light/dark mode"
            aria-label="Toggle light/dark mode"
          >
            {theme === 'light' ? MOON_SVG : SUN_SVG}
          </button>
        </div>
      </div>
    </div>
  );
}
