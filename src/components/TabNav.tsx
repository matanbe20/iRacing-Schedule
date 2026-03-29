import React from 'react';
import useStore from '../store/useStore';
import type { Tab } from '../types';
import { SPECIAL_EVENTS } from '../data/special-events';

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
          All Series
        </button>
        <button
          className={'tab-btn' + (activeTab === 'week' ? ' active' : '')}
          id="tab-week"
          onClick={() => setActiveTab('week' as Tab)}
        >
          By Week
        </button>
        <button
          className={'tab-btn' + (activeTab === 'my' ? ' active' : '')}
          id="tab-my"
          onClick={() => setActiveTab('my' as Tab)}
        >
          My Schedule{' '}
          <span className="tab-badge" id="my-schedule-count">
            {count > 0 ? String(count) : ''}
          </span>
        </button>
        <button
          className={'tab-btn' + (activeTab === 'events' ? ' active' : '')}
          id="tab-events"
          onClick={() => setActiveTab('events' as Tab)}
        >
          Special Events{hasLiveEvent && <span className="tab-live-dot" />}
        </button>
      </div>
    </div>
  );
}
