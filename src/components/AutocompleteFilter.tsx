import React, { useState, useRef } from 'react';
import { SCHEDULE_DATA } from '../data';
import { baseTrackName } from '../utils/helpers';

function buildCarList(): string[] {
  const carSet = new Set<string>();
  SCHEDULE_DATA.forEach(s => s.cars.split(',').forEach(c => { const n = c.trim(); if (n) carSet.add(n); }));
  return [...carSet].sort((a, b) => a.localeCompare(b));
}

function buildTrackList(): string[] {
  const trackSet = new Set<string>();
  SCHEDULE_DATA.forEach(s => s.weeks.forEach(w => { if (w.track) trackSet.add(baseTrackName(w.track)); }));
  return [...trackSet].sort((a, b) => a.localeCompare(b));
}

const ALL_CARS = buildCarList();
const ALL_TRACKS = buildTrackList();

interface AutocompleteFilterProps {
  type: 'car' | 'track';
  activeItems: Set<string>;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  onClear: () => void;
}

export default function AutocompleteFilter({ type, activeItems, onAdd, onRemove, onClear: _onClear }: AutocompleteFilterProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = type === 'car' ? ALL_CARS : ALL_TRACKS;
  const placeholder = type === 'car' ? 'Search cars...' : 'Search tracks...';

  const filtered = query
    ? allOptions.filter(item => !activeItems.has(item) && item.toLowerCase().includes(query.toLowerCase()))
    : allOptions.filter(item => !activeItems.has(item));

  function handleFocus() {
    setShowDropdown(true);
  }

  function handleBlur() {
    setTimeout(() => setShowDropdown(false), 150);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setShowDropdown(true);
  }

  function handleSelect(item: string, e: React.MouseEvent) {
    e.preventDefault();
    onAdd(item);
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  const visibleOptions = filtered.slice(0, 60);
  const dropdownVisible = showDropdown && visibleOptions.length > 0;

  return (
    <>
      <div className="autocomplete-wrap">
        <input
          ref={inputRef}
          type="text"
          className="car-search-input"
          placeholder={placeholder}
          autoComplete="off"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <div className={'autocomplete-dropdown' + (dropdownVisible ? ' visible' : '')}>
          {visibleOptions.map(item => (
            <div
              key={item}
              className="autocomplete-option"
              onMouseDown={e => handleSelect(item, e)}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="selected-tags">
        {[...activeItems].sort().map(item => (
          <span key={item} className="selected-tag">
            <span className="selected-tag-label">{item}</span>
            <button className="tag-remove" onClick={() => onRemove(item)} title="Remove">&times;</button>
          </span>
        ))}
      </div>
    </>
  );
}
