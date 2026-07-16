import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

// ─── Throwaway child that deliberately throws during render ───────────────────

function BrokenChild({ shouldThrow = true }) {
  if (shouldThrow) {
    throw new Error('Simulated render crash — test only');
  }
  return <div data-testid="working-child">All good</div>;
}

// ─── Suppress expected console.error noise in test output ────────────────────
// ErrorBoundary's componentDidCatch calls console.error intentionally.
// React itself also logs uncaught boundary errors. Silence both for clarity.
// We still assert that console.error WAS called with the right arguments.

let consoleSpy;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
  vi.restoreAllMocks();
});

// ─── 1. Fallback UI renders on child crash ────────────────────────────────────

describe('ErrorBoundary — fallback UI', () => {
  test('renders the fallback heading when a child throws during render', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
  });

  test('renders the user-facing fallback paragraph', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
  });

  test('does NOT expose the original thrown error message to the user', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );
    // The real error message must not appear anywhere in the rendered DOM.
    expect(screen.queryByText(/simulated render crash/i)).not.toBeInTheDocument();
  });

  test('does NOT expose any stack trace text to the user', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );
    // A stack trace would contain "at " — verify it's not in the DOM.
    const body = document.body.textContent || '';
    expect(body).not.toMatch(/\s+at\s+\w/); // "    at BrokenChild"
  });
});

// ─── 2. Children render normally when no error ───────────────────────────────

describe('ErrorBoundary — healthy children', () => {
  test('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('working-child')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});

// ─── 3. Error does not propagate uncaught to the test runner ─────────────────

describe('ErrorBoundary — error containment', () => {
  test('thrown render error is caught — test itself does not throw', () => {
    // If ErrorBoundary did NOT exist, rendering BrokenChild would throw and
    // this test would fail at the render() call. The fact that it completes
    // (and renders the fallback) proves containment.
    expect(() => {
      render(
        <ErrorBoundary>
          <BrokenChild shouldThrow />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });
});

// ─── 4. componentDidCatch logs to the console (local debugging) ───────────────

describe('ErrorBoundary — server-side logging (console.error)', () => {
  test('console.error is called with the error and component stack', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );

    // Find the call that our ErrorBoundary makes (it prefixes with '[ErrorBoundary]')
    const boundaryCall = consoleSpy.mock.calls.find(
      (args) => typeof args[0] === 'string' && args[0].includes('[ErrorBoundary]')
    );
    expect(boundaryCall).toBeDefined();

    // First arg is the label, second is the error object
    const [, loggedError] = boundaryCall;
    expect(loggedError).toBeInstanceOf(Error);
    expect(loggedError.message).toBe('Simulated render crash — test only');
  });
});

// ─── 5. Reload button is rendered and calls window.location.reload ────────────

describe('ErrorBoundary — reload button', () => {
  test('the reload button is present in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  test('clicking the reload button calls window.location.reload()', () => {
    // jsdom's window.location.reload is a no-op; replace it with a spy.
    const reloadSpy = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload: reloadSpy,
    });

    render(
      <ErrorBoundary>
        <BrokenChild shouldThrow />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /reload page/i });
    fireEvent.click(button);

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
