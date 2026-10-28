import { useTitle } from '../../useTitle.js';
import { useRef, useState } from 'react';
import { useApi } from '../../useApi.js';
import { ErrorState, Loading } from '../../components/State.jsx';
import { money } from '../../format.js';
import AdminMovies from './AdminMovies.jsx';
import AdminTheaters from './AdminTheaters.jsx';
import AdminShows from './AdminShows.jsx';
import AdminBookings from './AdminBookings.jsx';

const TABS = [
  ['dashboard', '📊 Dashboard'],
  ['movies', '🎬 Movies'],
  ['theaters', '🏛️ Theaters'],
  ['shows', '🎟️ Shows'],
  ['bookings', '📋 Bookings'],
];

const ICONS = {
  'Active movies': '🎬',
  'Theaters': '🏛️',
  'Upcoming shows': '🎟️',
  'Customers': '👥',
  'Confirmed bookings': '✅',
  'Confirmed revenue (simulated)': '💰',
};

function Dashboard() {
  const { data: s, loading, error, reload } = useApi('/admin/stats');
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const cards = [
    ['Active movies', s.movies],
    ['Theaters', s.theaters],
    ['Upcoming shows', s.upcomingShows],
    ['Customers', s.customers],
    ['Confirmed bookings', s.bookingsByStatus.CONFIRMED || 0],
    ['Confirmed revenue (simulated)', money(s.confirmedRevenue)],
  ];
  return (
    <div className="row g-3">
      {cards.map(([t, v]) => (
        <div className="col-12 col-sm-6 col-md-4" key={t}>
          <div
            className="card im-card h-100"
            style={{
              background: 'linear-gradient(145deg, rgba(22, 27, 46, 0.8) 0%, rgba(12, 15, 26, 0.8) 100%)',
              border: '1px solid var(--im-border)',
            }}
          >
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-secondary fw-medium">{t}</span>
                <span style={{ fontSize: '1.4rem' }}>{ICONS[t] || '📈'}</span>
              </div>
              <div className="h3 mb-0 text-white font-monospace" style={{ letterSpacing: '-0.02em' }}>
                {v}
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="col-12 mt-4">
        <div className="card im-card p-3">
          <div className="small text-secondary mb-2 fw-medium">Bookings by status:</div>
          <div className="d-flex flex-wrap gap-2">
            {Object.entries(s.bookingsByStatus).length > 0 ? (
              Object.entries(s.bookingsByStatus).map(([k, v]) => (
                <span
                  key={k}
                  className="badge px-3 py-2 rounded-pill"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--im-border)',
                    fontSize: '0.82rem',
                    color: 'var(--im-text)',
                  }}
                >
                  <span className="text-secondary me-1">{k}:</span>
                  <strong className="text-accent">{v}</strong>
                </span>
              ))
            ) : (
              <span className="text-secondary small">none yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  useTitle('Admin');
  const [tab, setTab] = useState('dashboard');
  const refs = useRef({});
  const onKey = (e, i) => { // roving tabindex + arrow keys (WAI-ARIA tabs pattern)
    const target = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    const next = TABS[(target + TABS.length) % TABS.length][0];
    setTab(next);
    refs.current[next]?.focus();
  };
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-10">
        <div>
          <h1 className="h3 mb-1 text-white">Admin Console</h1>
          <p className="text-secondary small mb-0">Manage catalog, theaters, show schedules, and simulated bookings</p>
        </div>
        <span className="badge text-bg-warning text-dark px-3 py-2 fw-bold">Admin Mode</span>
      </div>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="nav nav-pills mb-4 flex-wrap gap-2 p-1.5 rounded-3"
        style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--im-border)', width: 'fit-content' }}
      >
        {TABS.map(([k, t], i) => (
          <button
            key={k}
            ref={(el) => { refs.current[k] = el; }}
            id={`tab-${k}`}
            role="tab"
            type="button"
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            tabIndex={tab === k ? 0 : -1}
            className={`nav-link px-3.5 py-2 ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'movies' && <AdminMovies />}
        {tab === 'theaters' && <AdminTheaters />}
        {tab === 'shows' && <AdminShows />}
        {tab === 'bookings' && <AdminBookings />}
      </div>
    </>
  );
}
