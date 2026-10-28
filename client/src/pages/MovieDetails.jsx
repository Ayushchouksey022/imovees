import { useTitle } from '../useTitle.js';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../useApi.js';
import Poster from '../components/Poster.jsx';
import { EmptyState, ErrorState, Loading } from '../components/State.jsx';
import { dayKey, duration, fmtDay, fmtTime } from '../format.js';

export default function MovieDetails() {
  const { id } = useParams();
  const movie = useApi(`/movies/${id}`);
  const shows = useApi(`/shows?movie=${id}&limit=100`);
  const [day, setDay] = useState(null);
  useTitle(movie.data?.title || 'Movie');

  if (movie.loading) return <Loading label="Loading movie…" />;
  if (movie.error) {
    return movie.error.status === 404
      ? <EmptyState title="Movie not found"><Link to="/" className="btn btn-accent btn-sm mt-2">Browse movies</Link></EmptyState>
      : <ErrorState error={movie.error} onRetry={movie.reload} />;
  }
  const m = movie.data;

  // group shows: day -> theater -> shows
  const days = new Map();
  for (const s of shows.data || []) {
    const k = dayKey(s.startsAt);
    if (!days.has(k)) days.set(k, { label: fmtDay(s.startsAt), theaters: new Map() });
    const d = days.get(k);
    if (!d.theaters.has(s.theater.id)) d.theaters.set(s.theater.id, { theater: s.theater, shows: [] });
    d.theaters.get(s.theater.id).shows.push(s);
  }
  const keys = [...days.keys()];
  const active = days.get(day) ? day : keys[0];

  return (
    <>
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4 col-lg-3">
          <div style={{ position: 'relative' }}>
            <Poster title={m.title} url={m.posterUrl} className="detail-poster" />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--im-radius-sm)', boxShadow: 'inset 0 -60px 40px -20px rgba(8,9,15,0.6)', pointerEvents: 'none' }} />
          </div>
        </div>
        <div className="col-12 col-md-8 col-lg-9">
          <h1 className="h2" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{m.title}</h1>
          <p className="mb-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {m.genres.map((g) => <span key={g} className="badge" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--im-text)', fontWeight: 500 }}>{g}</span>)}
            <span className="badge" style={{ background: 'transparent', border: '1px solid var(--im-accent)', color: 'var(--im-accent)', fontWeight: 600 }}>{m.certificate}</span>
          </p>
          <p className="text-secondary small" style={{ opacity: 0.8 }}>{duration(m.durationMinutes)} · {m.language} · Release: {new Date(m.releaseDate).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style={{ lineHeight: 1.7, color: 'var(--im-text)', opacity: 0.9 }}>{m.description}</p>
        </div>
      </div>

      <h2 className="h4 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Showtimes</h2>
      {shows.loading && <Loading label="Loading showtimes…" />}
      {shows.error && <ErrorState error={shows.error} onRetry={shows.reload} />}
      {!shows.loading && !shows.error && keys.length === 0 && (
        <EmptyState title="No upcoming shows"><p className="small">{new Date(m.releaseDate) > new Date() ? 'This movie has not been released yet.' : 'Check back soon for new showtimes.'}</p></EmptyState>
      )}
      {keys.length > 0 && (
        <>
          <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Show dates">
            {keys.map((k) => (
              <button key={k} type="button" aria-pressed={k === active} className={`btn btn-sm ${k === active ? 'btn-accent' : 'btn-outline-secondary'}`} onClick={() => setDay(k)}>{days.get(k).label}</button>
            ))}
          </div>
          {[...days.get(active).theaters.values()].map(({ theater, shows: list }) => (
            <div key={theater.id} className="card im-card mb-3">
              <div className="card-body">
                <h3 className="h6 mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>{theater.name}</h3>
                <div className="small text-secondary mb-3">{theater.address}</div>
                <div className="d-flex flex-wrap gap-2">
                  {list.map((s) => (
                    <Link key={s.id} to={`/shows/${s.id}/seats`} className={`btn btn-outline-light show-btn ${s.availableSeats === 0 ? 'disabled' : ''}`}
                      aria-disabled={s.availableSeats === 0} aria-label={`${fmtTime(s.startsAt)}, ${s.screenName}, ${s.availableSeats} seats left`}>
                      <strong>{fmtTime(s.startsAt)}</strong>
                      <small className="d-block text-secondary">{s.screenName} · {s.availableSeats === 0 ? 'Sold out' : `${s.availableSeats} left`}</small>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
