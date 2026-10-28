import { useTitle } from '../useTitle.js';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { watchShow } from '../realtime.js';
import { useApi } from '../useApi.js';
import { useAuth } from '../AuthContext.jsx';
import SeatMap, { SeatLegend } from '../components/SeatMap.jsx';
import Poster from '../components/Poster.jsx';
import { ErrorState, Loading } from '../components/State.jsx';
import { errorText, fmtDateTime, money } from '../format.js';

const MAX_SEATS = 8; // mirrors the server default (MAX_SEATS_PER_BOOKING); the server enforces it
const POLL_MS = 15000; // fallback only; Socket.IO pushes updates instantly

export default function SeatSelection() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const show = useApi(`/shows/${id}`);
  useTitle(show.data ? `Seats – ${show.data.movie.title}` : 'Select seats');
  const [map, setMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState(null); // { text, bookingId }
  const [busy, setBusy] = useState(false);

  const loadSeats = useCallback(() => api(`/shows/${id}/seats`).then((r) => {
    setMap(r.data); setMapError(null);
    // drop selected seats that someone else just took
    setSelected((prev) => {
      const ok = new Set(r.data.seats.filter((s) => s.status === 'AVAILABLE').map((s) => s.label));
      const next = new Set([...prev].filter((l) => ok.has(l)));
      if (next.size !== prev.size) setNotice('Some seats you selected were just taken and were removed from your selection.');
      return next;
    });
  }).catch((e) => setMapError(e)), [id]);

  useEffect(() => { loadSeats(); }, [loadSeats, user]);
  useEffect(() => watchShow(id, loadSeats), [id, loadSeats]);
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) loadSeats(); }, POLL_MS);
    return () => clearInterval(t);
  }, [loadSeats]);

  const toggle = (seat) => {
    setNotice(''); setProblem(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.label)) next.delete(seat.label);
      else if (next.size >= MAX_SEATS) setNotice(`You can select up to ${MAX_SEATS} seats.`);
      else next.add(seat.label);
      return next;
    });
  };

  const chosen = (map?.seats || []).filter((s) => selected.has(s.label));
  const total = chosen.reduce((sum, s) => sum + s.price, 0); // display only - the server recomputes the total

  const reserve = async () => {
    setBusy(true); setProblem(null); setNotice('');
    try {
      const r = await api('/bookings/reserve', { method: 'POST', body: { showId: id, seats: [...selected] } });
      navigate(`/bookings/${r.data.id}`);
    } catch (e) {
      setProblem({ text: e.status === 409 && e.details?.unavailableSeats ? `${e.message}: ${e.details.unavailableSeats.join(', ')}` : errorText(e), bookingId: e.details?.bookingId });
      await loadSeats();
      setBusy(false);
    }
  };

  if (show.loading) return <Loading label="Loading show…" />;
  if (show.error) return <ErrorState error={show.error} onRetry={show.reload} />;
  const s = show.data;

  return (
    <>
      <nav aria-label="Breadcrumb" className="small mb-3">
        <Link to={`/movies/${s.movie.id}`} className="text-decoration-none text-secondary">
          <span className="me-1">←</span> Back to <span className="text-accent">{s.movie.title}</span>
        </Link>
      </nav>

      {/* Show header banner */}
      <div className="card im-card mb-4 p-3 border-0" style={{ background: 'linear-gradient(135deg, rgba(20, 24, 42, 0.7) 0%, rgba(12, 14, 24, 0.8) 100%)' }}>
        <div className="d-flex gap-3 align-items-center">
          <Poster title={s.movie.title} url={s.movie.posterUrl} className="poster-thumb shadow-sm" decorative />
          <div>
            <h1 className="h4 mb-1 text-white">{s.movie.title}</h1>
            <div className="d-flex flex-wrap gap-2 align-items-center text-secondary small">
              <span className="badge text-bg-dark border border-secondary">{s.theater.name}</span>
              <span>·</span>
              <span className="text-light">{s.screenName}</span>
              <span>·</span>
              <span>{fmtDateTime(s.startsAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          {!map && !mapError && <Loading label="Loading seats…" />}
          {mapError && <ErrorState error={mapError} onRetry={loadSeats} />}
          {map && (
            <div className="cinema-stage">
              <SeatLegend />
              <SeatMap seats={map.seats} selected={selected} onToggle={toggle} />
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 pt-3 border-top border-secondary border-opacity-10">
                <div className="small text-secondary" aria-live="polite">
                  <span className="live-pulse" />
                  <strong className="text-light">{map.summary.AVAILABLE}</strong> seats available
                </div>
                <div className="small text-secondary">
                  Live updates synced · Backup refresh {POLL_MS / 1000}s
                </div>
              </div>
            </div>
          )}
        </div>
        <aside className="col-12 col-lg-4" aria-label="Booking summary">
          <div className="card im-card sticky-lg-top summary-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Your selection</h2>
                {chosen.length > 0 && (
                  <span className="badge rounded-pill text-bg-warning text-dark px-2.5 py-1 fw-bold">
                    {chosen.length} / {MAX_SEATS}
                  </span>
                )}
              </div>
              {chosen.length === 0 ? (
                <div className="text-center py-4 my-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--im-border)' }}>
                  <p className="text-secondary small mb-0">Select up to {MAX_SEATS} seats on the screen map.</p>
                </div>
              ) : (
                <ul className="list-unstyled small mb-3">
                  {chosen.map((c) => (
                    <li key={c.label} className="d-flex justify-content-between align-items-center py-1.5 border-bottom border-secondary border-opacity-10">
                      <span>
                        <strong className="text-accent me-1">{c.label}</strong>
                        <span className="text-secondary small text-capitalize">({c.category.toLowerCase()})</span>
                      </span>
                      <span className="font-monospace text-light">{money(c.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="d-flex justify-content-between fw-bold border-top pt-3 mb-3">
                <span>Total</span>
                <span className="h5 mb-0 text-accent font-monospace">{money(total)}</span>
              </div>
              {notice && <div className="alert alert-warning py-2 small" role="status">{notice}</div>}
              {problem && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {problem.text}
                  {problem.bookingId && <> <Link to={`/bookings/${problem.bookingId}`}>View pending reservation</Link></>}
                </div>
              )}
              {user ? (
                <button
                  className="btn btn-accent w-100 py-2.5 shadow"
                  disabled={chosen.length === 0 || busy}
                  onClick={reserve}
                >
                  {busy ? 'Reserving…' : `Reserve ${chosen.length || ''} seat${chosen.length === 1 ? '' : 's'}`}
                </button>
              ) : (
                <Link className="btn btn-accent w-100 py-2.5 shadow" to="/login" state={{ from: `/shows/${id}/seats` }}>
                  Log in to reserve
                </Link>
              )}
              <p className="small text-secondary mt-3 mb-0 text-center" style={{ fontSize: '0.75rem' }}>
                Seats are held for a few minutes after you reserve. Final price is confirmed by the server.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
