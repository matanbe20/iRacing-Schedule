import React, { useEffect, useRef } from 'react';
import useStore from './store/useStore';
import Header from './components/Header';
import TabNav from './components/TabNav';
import FilterSidebar from './components/FilterSidebar';
import AllSeriesPanel from './components/AllSeriesPanel';
import ThisWeekPanel from './components/ThisWeekPanel';
import MySchedulePanel from './components/MySchedulePanel';
import ShareModal from './components/ShareModal';
import Toast from './components/Toast';

export default function App() {
  const theme = useStore(s => s.theme);
  const isDrawerOpen = useStore(s => s.isDrawerOpen);
  const isShareModalOpen = useStore(s => s.isShareModalOpen);
  const activeTab = useStore(s => s.activeTab);
  const stickyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('drawer-active', isDrawerOpen);
    return () => document.body.classList.remove('drawer-active');
  }, [isDrawerOpen]);

  useEffect(() => {
    document.body.classList.toggle('share-modal-open', isShareModalOpen);
    return () => document.body.classList.remove('share-modal-open');
  }, [isShareModalOpen]);

  useEffect(() => {
    if (!stickyRef.current) return;
    const update = () => {
      const h = stickyRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty('--sticky-height', h + 'px');
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stickyRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <>
      <div className="sticky-top" ref={stickyRef}>
        <Header />
        <TabNav />
      </div>

      <div className="main-layout">
        <FilterSidebar />
        <div className="content-area">
          <div className="container">
            {activeTab === 'all' && <AllSeriesPanel />}
            {activeTab === 'week' && <ThisWeekPanel />}
            {activeTab === 'my' && <MySchedulePanel />}
          </div>
        </div>
      </div>

      <Toast />
      <ShareModal />
    </>
  );
}
