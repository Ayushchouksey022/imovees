import { useTitle } from '../useTitle.js';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi } from '../useApi.js';
import Countdown from '../components/Countdown.jsx';
import Poster from '../components/Poster.jsx';
import { ErrorState, Loading } from '../components/State.jsx';
import { errorText, fmtDateTime, money } from '../format.js';

/** DEMONSTRATION checkout: no card fields, no real payment. The outcome is chosen by the user for testing. */
export default function Checkout() {
  useTitle('Checkout');
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: b, loading, error, reload } = useApi(`/bookings/${id}`);
  const [outcome, setOutcome] = useState('SUCCESS');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (loading && !b) return <Loading label="Loading checkout…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (b.status !== 'PENDING') return <Navigate to={`/bookings/${id}`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const r = await api(`/bookings/${id}/pay`, { method: 'POST', body: { outcome } });
      navigate(`/bookings/${id}`, { replace: true, state: { paid: r.data.payment.status } });
    } catch (err) { setMsg(errorText(err)); setBusy(false); reload(); }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <div className="alert py-3" role="note" style={{ background: 'rgba(245,179,1,0.06)', border: '1px solid rgba(245,179,1,0.2)', color: 'var(--im-accent-light)', borderRadius: 'var(--im-radius-sm)' }}>
        <strong>Demonstration checkout.</strong> This is a simulated payment — no real money moves and no card details are requested. Never enter real card information here.
      </div>
      <div className="card im-card">
        <form className="card-body" onSubmit={submit}>
          <h1 className="h4" style={{ fontFamily: 'Outfit, sans-serif' }}>Checkout</h1>
          <div className="d-flex gap-3 mb-3">
            <Poster title={b.show.movie.title} url={b.show.movie.posterUrl} className="poster-thumb" decorative />
            <p className="text-secondary mb-0">{b.show.movie.title} · {b.show.theater.name} · {b.show.screenName}<br />{fmtDateTime(b.show.startsAt)}</p>
          </div>
          <ul className="list-group list-group-flush mb-3">
            {b.seats.map((s) => <li key={s.label} className="list-group-item bg-transparent d-flex justify-content-between" style={{ borderColor: 'var(--im-border)' }}><span>Seat {s.label} <span className="text-secondary small">({s.category.toLowerCase()})</span></span><span>{money(s.price)}</span></li>)}
            <li className="list-group-item bg-transparent d-flex justify-content-between" style={{ borderColor: 'var(--im-border)' }}><span>Tickets</span><span>{b.seats.length}</span></li>
            <li className="list-group-item bg-transparent d-flex justify-content-between fw-bold" style={{ borderColor: 'var(--im-border)' }}><span>Total</span><span style={{ color: 'var(--im-accent)' }}>{money(b.totalAmount)}</span></li>
          </ul>
          <p className="small" style={{ color: 'var(--im-text-secondary)' }}>Seats held for <Countdown until={b.expiresAt} onExpire={reload} /></p>
          <fieldset className="mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--im-border)', borderRadius: 'var(--im-radius-sm)', padding: '16px' }}>
            <legend className="h6" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem' }}>Simulated outcome (for testing)</legend>
            <div className="form-check"><input className="form-check-input" type="radio" name="outcome" id="o-ok" checked={outcome === 'SUCCESS'} onChange={() => setOutcome('SUCCESS')} /><label className="form-check-label" htmlFor="o-ok">Payment succeeds</label></div>
            <div className="form-check"><input className="form-check-input" type="radio" name="outcome" id="o-fail" checked={outcome === 'FAILURE'} onChange={() => setOutcome('FAILURE')} /><label className="form-check-label" htmlFor="o-fail">Payment fails (seats are released)</label></div>
          </fieldset>
          {msg && <div className="alert alert-danger py-2" role="alert">{msg}</div>}
          <div className="d-flex gap-2">
            <button className="btn btn-accent flex-grow-1" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(b.totalAmount)} (simulated)`}</button>
            <Link className="btn btn-outline-secondary" to={`/bookings/${id}`}>Back</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
