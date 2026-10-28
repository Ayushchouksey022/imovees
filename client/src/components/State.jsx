import { errorText } from '../format.js';

export const Loading = ({ label = 'Loading…' }) => (
  <div className="text-center py-5" role="status" aria-live="polite">
    <div className="spinner-border text-accent" aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px' }} />
    <div className="mt-3 text-secondary" style={{ fontWeight: 500, letterSpacing: '0.02em' }}>{label}</div>
  </div>
);

export const EmptyState = ({ title, children }) => (
  <div className="text-center py-5" style={{ color: 'var(--im-text-secondary)' }}>
    <div className="fs-1 mb-2" aria-hidden="true" style={{ filter: 'drop-shadow(0 0 12px rgba(245,179,1,0.2))' }}>🎞️</div>
    <h2 className="h5" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h2>
    {children}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="alert d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert"
    style={{ background: 'rgba(229, 72, 77, 0.1)', border: '1px solid rgba(229, 72, 77, 0.3)', color: '#ff9a9e', borderRadius: 'var(--im-radius-sm)' }}>
    <span>{errorText(error)}</span>
    {onRetry && <button className="btn btn-sm btn-outline-light" onClick={onRetry}>Retry</button>}
  </div>
);
