import React, { useState } from 'react';
import useStore from '../store/useStore';
import { exportCSV, exportICS } from '../utils/helpers';

const ShareSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const DownloadSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CalSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export default function ExportButtons() {
  const mySchedule = useStore(s => s.mySchedule);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const ids = Object.keys(mySchedule);
    const encoded = btoa(JSON.stringify(ids));
    const url = location.origin + location.pathname + '?share=' + encoded + '&tab=my';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => { prompt('Copy this URL:', url); });
    } else {
      prompt('Copy this URL:', url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="export-group">
      <button
        className={'export-btn' + (copied ? ' export-btn-copied' : '')}
        onClick={handleShare}
        title="Share"
      >
        <ShareSvg />
        <span className="btn-label">{copied ? 'Copied!' : 'Share'}</span>
      </button>
      <button className="export-btn" onClick={() => exportCSV(mySchedule)} title="Download CSV">
        <DownloadSvg />
        <span className="btn-label">Download CSV</span>
      </button>
      <button className="export-btn" onClick={() => exportICS(mySchedule)} title="Download .ics">
        <CalSvg />
        <span className="btn-label">Download .ics</span>
      </button>
    </div>
  );
}
