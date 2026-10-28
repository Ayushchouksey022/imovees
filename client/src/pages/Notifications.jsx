import { useTitle } from '../useTitle.js';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApi } from '../useApi.js';
import { EmptyState, ErrorState, Loading } from '../components/State.jsx';
import { fmtDateTime } from '../format.js';

export default function Notifications() {
  useTitle('Notifications');
  const { data, meta, loading, error, reload } = useApi('/notifications');
  if (loading && !data) return <Loading label="Loading notifications…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const changed = () => window.dispatchEvent(new Event('notifications:changed'));
  const markAll = async () => { await api('/notifications/read-all', { method: 'POST' }); reload(); changed(); };
  const markOne = async (id) => { await api(`/notifications/${id}/read`, { method: 'POST' }); reload(); changed(); };
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Notifications</h1>
          <p className="text-secondary small mb-0">Updates on your ticket reservations, confirmations, and alerts</p>
        </div>
        {meta?.unread > 0 && (
          <button className="btn btn-outline-light btn-sm px-3" onClick={markAll}>
            Mark all read ({meta.unread})
          </button>
        )}
      </div>
      {data.length === 0 ? (
        <EmptyState title="No notifications yet" message="When you reserve or confirm tickets, your alerts will show up here." />
      ) : (
        <div className="d-flex flex-column gap-3">
          {data.map((n) => (
            <div
              key={n.id}
              className="card im-card"
              style={{
                borderLeft: n.readAt ? '1px solid var(--im-border)' : '4px solid var(--im-accent)',
                background: n.readAt ? 'var(--im-surface)' : 'rgba(245, 179, 1, 0.04)',
              }}
            >
              <div className="card-body p-3.5">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-1.5">
                  <div className="d-flex align-items-center gap-2">
                    {!n.readAt && <span className="live-pulse" style={{ background: 'var(--im-accent)', boxShadow: '0 0 8px var(--im-accent)' }} />}
                    <h3 className={`h6 mb-0 ${n.readAt ? 'text-light' : 'text-accent fw-bold'}`}>
                      {n.title}
                    </h3>
                  </div>
                  <span className="small text-secondary" style={{ fontSize: '0.78rem' }}>
                    {fmtDateTime(n.createdAt)}
                  </span>
                </div>
                <div className={`small ${n.readAt ? 'text-secondary' : 'text-light'} mb-2`}>
                  {n.message}
                </div>
                <div className="d-flex justify-content-between align-items-center small pt-2 border-top border-secondary border-opacity-10">
                  <div>
                    {n.booking && (
                      <Link to={`/bookings/${n.booking}`} className="text-decoration-none fw-medium text-accent">
                        View booking →
                      </Link>
                    )}
                  </div>
                  {!n.readAt && (
                    <button
                      className="btn btn-link btn-sm p-0 text-decoration-none text-secondary"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => markOne(n.id)}
                    >
                      ✓ Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
