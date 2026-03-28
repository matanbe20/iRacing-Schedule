import React from 'react';
import useStore from '../store/useStore';
import type { Tab } from '../types';

export default function TabNav() {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const mySchedule = useStore(s => s.mySchedule);
  const count = Object.keys(mySchedule).length;

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
          This Week
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
          Events
        </button>
      </div>
    </div>
  );
}
