import React from 'react';
import useStore from '../store/useStore';
import type { Tab } from '../types';
import { SPECIAL_EVENTS } from '../data/special-events';

const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="6" height="6" rx="1.2" />
    <rect x="9" y="1" width="6" height="6" rx="1.2" />
    <rect x="1" y="9" width="6" height="6" rx="1.2" />
    <rect x="9" y="9" width="6" height="6" rx="1.2" />
  </svg>
);

const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" />
    <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" />
    <line x1="5" y1="1" x2="5" y2="4" />
    <line x1="11" y1="1" x2="11" y2="4" />
    <line x1="4.5" y1="10" x2="7.5" y2="10" />
  </svg>
);

const IconBookmark = () => (
  <svg width="14" height="15" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 1.5h10a.5.5 0 0 1 .5.5v12l-5.5-3.5L1.5 14V2a.5.5 0 0 1 .5-.5z" />
  </svg>
);

const IconTrophy = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 1h6v5.5A3 3 0 0 1 8 9.5a3 3 0 0 1-3-3V1z" />
    <path d="M5 3.5H2.5A1.5 1.5 0 0 0 1 5a2.5 2.5 0 0 0 2.5 2.5H5" />
    <path d="M11 3.5h2.5A1.5 1.5 0 0 1 15 5a2.5 2.5 0 0 1-2.5 2.5H11" />
    <line x1="8" y1="9.5" x2="8" y2="12" />
    <path d="M5 15h6" />
    <line x1="8" y1="12" x2="8" y2="15" />
  </svg>
);

const IconCart = () => (
  <svg width="16" height="15" viewBox="0 0 17 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 1h2.5l1.8 8h7.4l1.8-5.5H5" />
    <circle cx="7" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export default function TabNav() {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const mySchedule = useStore(s => s.mySchedule);
  const count = Object.keys(mySchedule).length;

  const now = new Date();
  const hasLiveEvent = SPECIAL_EVENTS.some(e => {
    if (!e.startDate) return false;
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    end.setHours(4, 0, 0, 0);
    return now >= start && now <= end;
  });

  return (
    <div className="tab-nav">
      <div className="tab-nav-inner">
        <button
          className={'tab-btn' + (activeTab === 'all' ? ' active' : '')}
          id="tab-all"
          onClick={() => setActiveTab('all' as Tab)}
        >
          <IconGrid />All Series
        </button>
        <button
          className={'tab-btn' + (activeTab === 'week' ? ' active' : '')}
          id="tab-week"
          onClick={() => setActiveTab('week' as Tab)}
        >
          <IconCalendar />By Week
        </button>
        <button
          className={'tab-btn' + (activeTab === 'my' ? ' active' : '')}
          id="tab-my"
          onClick={() => setActiveTab('my' as Tab)}
        >
          <IconBookmark />My Schedule{' '}
          <span className="tab-badge" id="my-schedule-count">
            {count > 0 ? String(count) : ''}
          </span>
        </button>
        <button
          className={'tab-btn' + (activeTab === 'buy' ? ' active' : '')}
          id="tab-buy"
          onClick={() => setActiveTab('buy' as Tab)}
        >
          <IconCart />Buy Guide
        </button>
        <button
          className={'tab-btn' + (activeTab === 'events' ? ' active' : '')}
          id="tab-events"
          onClick={() => setActiveTab('events' as Tab)}
        >
          <IconTrophy />Special Events{hasLiveEvent && <span className="tab-live-dot" />}
        </button>
      </div>
    </div>
  );
}
