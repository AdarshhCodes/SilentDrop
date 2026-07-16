import React from 'react';

/**
 * ErrorBoundary — local React error boundary using the class-based
 * componentDidCatch / getDerivedStateFromError pattern.
 *
 * LOCAL-ONLY implementation.  No external error-tracking service (e.g. Sentry,
 * Bugsnag) is wired in here.  To add one, call its captureException() inside
 * componentDidCatch — the structure of this component does not need to change.
 *
 * What it does:
 *   - Catches any unhandled render / lifecycle error in its subtree.
 *   - Logs error + component stack to the console for local debugging.
 *   - Renders an on-brand fallback UI instead of a blank / crashed screen.
 *   - Never exposes stack traces or internal error messages to end users.
 */

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log to console for local debugging only — never send to an external
    // service from here in this implementation.
    console.error(
      '[ErrorBoundary] Uncaught render error:',
      error,
      info?.componentStack
    );
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          // Matches the dark-mode base from the app's design system (section §9)
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#e2e8f0',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* Minimal icon — no third-party icon lib needed */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}
          aria-hidden="true"
        >
          ⚠
        </div>

        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#f1f5f9',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            An unexpected error occurred. Your data is safe — this is likely a
            temporary glitch. Try reloading the page.
          </p>
        </div>

        <button
          onClick={this.handleReload}
          style={{
            padding: '0.6rem 1.6rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
