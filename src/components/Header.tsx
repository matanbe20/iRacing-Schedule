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
  const setActiveTab = useStore(s => s.setActiveTab);
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
          href="https://discord.gg/brRFWVQk"
          target="_blank"
          rel="noreferrer"
          className="discord-mobile-btn"
          aria-label="Join Discord"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 127.14 96.36" fill="#5865F2">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
        </a>
        <a
          href="https://ko-fi.com/matanbm91"
          target="_blank"
          rel="noreferrer"
          className="kofi-mobile-btn"
          aria-label="Buy Me a Coffee"
        >
          <img src="https://storage.ko-fi.com/cdn/logomarkLogo.png" alt="Ko-fi" />
        </a>
        <div className="header-left">
          <h1 className="site-title" onClick={() => setActiveTab('all')}><span>iRacing</span> Hub</h1>
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
