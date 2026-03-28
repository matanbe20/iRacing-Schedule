import React, { useState } from 'react';
import { SPECIAL_EVENTS } from '../data/special-events';
import type { SpecialEvent, SpecialEventType } from '../data/special-events';

type EventStatus = 'active' | 'upcoming' | 'completed' | 'tbd';
type ViewMode = 'grid' | 'list';

function getStatus(event: SpecialEvent, now: Date): EventStatus {
  if (!event.startDate) return 'tbd';
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  end.setHours(23, 59, 59, 999);
  if (now >= start && now <= end) return 'active';
  if (now > end) return 'completed';
  return 'upcoming';
}

function daysUntil(dateStr: string, now: Date): number {
  return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86400000);
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateRange(start: string, end: string): string {
  if (!start) return 'Date TBD';
  const s = new Date(start);
  const e = new Date(end);
  const sm = MONTH_SHORT[s.getUTCMonth()];
  const em = MONTH_SHORT[e.getUTCMonth()];
  const sd = s.getUTCDate();
  const ed = e.getUTCDate();
  const year = e.getUTCFullYear();
  if (sm === em) return `${sm} ${sd}–${ed}, ${year}`;
  return `${sm} ${sd} – ${em} ${ed}, ${year}`;
}

function typeBadgeClass(type: SpecialEventType): string {
  switch (type) {
    case 'TEAM EVENT': return 'se-type--team';
    case 'NASCAR IRACING SERIES': return 'se-type--nascar';
    case 'SUPER SESSION': return 'se-type--super';
    case 'SOLO': return 'se-type--solo';
  }
}

function typeLabel(type: SpecialEventType): string {
  switch (type) {
    case 'TEAM EVENT': return 'Team Event';
    case 'NASCAR IRACING SERIES': return 'NASCAR iRacing Series';
    case 'SUPER SESSION': return 'Super Session';
    case 'SOLO': return 'Solo Event';
  }
}

interface CardProps {
  event: SpecialEvent;
  now: Date;
  view: ViewMode;
}

function StatusBadge({ event, now, inline }: { event: SpecialEvent; now: Date; inline?: boolean }) {
  const status = getStatus(event, now);
  const cls = inline ? 'se-status-badge se-status-badge--inline' : 'se-status-badge';

  if (status === 'active') return <span className={`${cls} se-badge--active`}>Live Now</span>;
  if (status === 'completed') return <span className={`${cls} se-badge--completed`}>Completed</span>;
  if (status === 'tbd') return <span className={`${cls} se-badge--tbd`}>Date TBD</span>;
  const days = daysUntil(event.startDate, now);
  if (days <= 0) return <span className={`${cls} se-badge--upcoming`}>Today</span>;
  if (days === 1) return <span className={`${cls} se-badge--upcoming`}>Tomorrow</span>;
  return <span className={`${cls} se-badge--upcoming`}>In {days}d</span>;
}

function SpecialEventCard({ event, now, view }: CardProps) {
  const status = getStatus(event, now);
  const isPast = status === 'completed';

  if (view === 'list') {
    return (
      <div className={'se-row' + (isPast ? ' se-card--past' : '')}>
        <div className="se-row-thumb">
          <img
            src={event.bannerUrl}
            alt={event.name}
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <div className="se-row-body">
          <div className="se-row-top">
            <span className={`se-type-badge ${typeBadgeClass(event.type)}`}>{typeLabel(event.type)}</span>
            <StatusBadge event={event} now={now} inline />
          </div>
          <div className="se-row-title">{event.name}</div>
          <div className="se-row-meta">
            <span>📅 {formatDateRange(event.startDate, event.endDate)}</span>
            <span className="se-row-sep">·</span>
            <span>🏁 {event.track}</span>
            <span className="se-row-sep">·</span>
            <span>🚗 {event.cars}</span>
          </div>
        </div>
        {(event.posterUrl || event.forumUrl) && (
          <div className="se-row-links">
            {event.posterUrl && (
              <a className="se-card-link" href={event.posterUrl} target="_blank" rel="noopener noreferrer">Poster ↗</a>
            )}
            {event.forumUrl && (
              <a className="se-card-link" href={event.forumUrl} target="_blank" rel="noopener noreferrer">Forum ↗</a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={'se-card' + (isPast ? ' se-card--past' : '')}>
      <div className="se-card-banner-wrap">
        <img
          className="se-card-banner"
          src={event.bannerUrl}
          alt={event.name}
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <StatusBadge event={event} now={now} />
      </div>
      <div className="se-card-body">
        <span className={`se-type-badge ${typeBadgeClass(event.type)}`}>{typeLabel(event.type)}</span>
        <div className="se-card-title">{event.name}</div>
        <div className="se-card-meta">
          <span className="se-card-meta-icon">📅</span>
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>
        <div className="se-card-meta">
          <span className="se-card-meta-icon">🏁</span>
          <span>{event.track}</span>
        </div>
        <div className="se-card-meta">
          <span className="se-card-meta-icon">🚗</span>
          <span>{event.cars}</span>
        </div>
        {(event.posterUrl || event.forumUrl) && (
          <div className="se-card-links">
            {event.posterUrl && (
              <a className="se-card-link" href={event.posterUrl} target="_blank" rel="noopener noreferrer">Poster ↗</a>
            )}
            {event.forumUrl && (
              <a className="se-card-link" href={event.forumUrl} target="_blank" rel="noopener noreferrer">Forum ↗</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveEventHero({ event, now }: { event: SpecialEvent; now: Date }) {
  return (
    <div className="se-live-hero">
      <div className="se-live-hero-banner">
        <img
          src={event.bannerUrl}
          alt={event.name}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="se-live-hero-overlay" />
        <span className="se-live-hero-badge">
          <span className="se-live-hero-dot" />
          Live Now
        </span>
      </div>
      <div className="se-live-hero-body">
        <span className={`se-type-badge ${typeBadgeClass(event.type)}`}>{typeLabel(event.type)}</span>
        <div className="se-live-hero-title">{event.name}</div>
        <div className="se-live-hero-meta">
          <span>📅 {formatDateRange(event.startDate, event.endDate)}</span>
          <span>🏁 {event.track}</span>
          <span>🚗 {event.cars}</span>
        </div>
        {(event.posterUrl || event.forumUrl) && (
          <div className="se-card-links">
            {event.posterUrl && (
              <a className="se-card-link" href={event.posterUrl} target="_blank" rel="noopener noreferrer">Poster ↗</a>
            )}
            {event.forumUrl && (
              <a className="se-card-link" href={event.forumUrl} target="_blank" rel="noopener noreferrer">Forum ↗</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid icon SVG
function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/>
    </svg>
  );
}

// List icon SVG
function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="1" y="2" width="13" height="2" rx="1"/>
      <rect x="1" y="6.5" width="13" height="2" rx="1"/>
      <rect x="1" y="11" width="13" height="2" rx="1"/>
    </svg>
  );
}

export default function SpecialEventsPanel() {
  const [view, setView] = useState<ViewMode>('grid');
  const now = new Date();

  const liveEvents = SPECIAL_EVENTS.filter(e => getStatus(e, now) === 'active');

  const upcoming = [...SPECIAL_EVENTS.filter(e => !e.past && getStatus(e, now) !== 'active')].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return a.startDate.localeCompare(b.startDate);
  });

  const past = [...SPECIAL_EVENTS.filter(e => e.past)].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );

  const containerClass = view === 'grid' ? 'se-grid' : 'se-list';

  return (
    <div className="se-panel">
      {liveEvents.length > 0 && (
        <div className="se-live-section">
          <div className="se-live-section-label">
            <span className="se-live-section-dot" />
            Happening Now
          </div>
          {liveEvents.map(e => <LiveEventHero key={e.id} event={e} now={now} />)}
        </div>
      )}

      <div className="se-panel-toolbar">
        <div className="se-section-header" style={{ border: 'none', margin: 0, padding: 0 }}>
          <h2>Upcoming iRacing Special Events</h2>
          <span className="se-event-count">{upcoming.length} events</span>
        </div>
        <div className="se-view-toggle">
          <button
            className={'se-view-btn' + (view === 'grid' ? ' active' : '')}
            onClick={() => setView('grid')}
            title="Grid view"
          >
            <GridIcon />
          </button>
          <button
            className={'se-view-btn' + (view === 'list' ? ' active' : '')}
            onClick={() => setView('list')}
            title="List view"
          >
            <ListIcon />
          </button>
        </div>
      </div>

      <div className={containerClass}>
        {upcoming.map(e => <SpecialEventCard key={e.id} event={e} now={now} view={view} />)}
      </div>

      <div className="se-section-header se-section-header--past">
        <h2>Past Events</h2>
        <span className="se-event-count">{past.length} events</span>
      </div>
      <div className={containerClass}>
        {past.map(e => <SpecialEventCard key={e.id} event={e} now={now} view={view} />)}
      </div>
    </div>
  );
}
