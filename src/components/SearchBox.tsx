import React, { useEffect, useRef, useState } from 'react';
import useStore from '../store/useStore';

const PHRASES = ['Spa', 'Porsche Cup', 'GT3', 'Daytona', 'Formula 4', 'Dirt Oval', 'N\xfcrburgring', 'IMSA', 'Late Model'];

function useTypewriter(inputFocused: boolean, hasValue: boolean): string {
  const [text, setText] = useState('');
  const stateRef = useRef({ pi: 0, ci: 0, deleting: false, running: true, timer: null as ReturnType<typeof setTimeout> | null });

  useEffect(() => {
    const s = stateRef.current;
    s.running = true;

    function tick() {
      if (!s.running) return;
      if (hasValue || inputFocused) {
        setText('');
        return;
      }
      const phrase = PHRASES[s.pi];
      if (!s.deleting) {
        s.ci++;
        setText('Search ' + phrase.slice(0, s.ci));
        if (s.ci === phrase.length) {
          s.deleting = true;
          s.timer = setTimeout(tick, 2000);
          return;
        }
      } else {
        s.ci--;
        setText(s.ci ? 'Search ' + phrase.slice(0, s.ci) : 'Search');
        if (s.ci === 0) {
          s.deleting = false;
          s.pi = (s.pi + 1) % PHRASES.length;
          s.timer = setTimeout(tick, 500);
          return;
        }
      }
      s.timer = setTimeout(tick, s.deleting ? 40 : 80);
    }

    tick();

    return () => {
      s.running = false;
      if (s.timer != null) clearTimeout(s.timer);
    };
  }, [hasValue, inputFocused]);

  return text;
}

export default function SearchBox() {
  const searchQuery = useStore(s => s.searchQuery);
  const setSearchQuery = useStore(s => s.setSearchQuery);
  const [focused, setFocused] = useState(false);

  const hasValue = searchQuery.length > 0;
  const twText = useTypewriter(focused, hasValue);
  const showTypewriter = !focused && !hasValue;

  return (
    <div className="search-wrap">
      <svg className="search-icon-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
        <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        className="search-box"
        id="search"
        placeholder=""
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showTypewriter && (
        <div className="search-typewriter" id="search-typewriter" aria-hidden="true">
          <span className="tw-text">{twText}</span>
          <span className="tw-cursor"></span>
        </div>
      )}
    </div>
  );
}
