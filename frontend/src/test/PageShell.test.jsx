import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Module mocks (must be before component import) ──────────────────────────

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// Mock framer-motion: replace motion.* and AnimatePresence with plain HTML so
// jsdom doesn't need the Web Animations API.
vi.mock('framer-motion', () => ({
  motion: {
    div:  ({ children, initial, animate, exit, transition, layoutId, whileHover, ...p }) =>
            <div {...p}>{children}</div>,
    nav:  ({ children, initial, animate, exit, transition, layoutId, ...p }) =>
            <nav {...p}>{children}</nav>,
    main: ({ children, initial, animate, exit, transition, layoutId, ...p }) =>
            <main {...p}>{children}</main>,
    span: ({ children, initial, animate, exit, transition, layoutId, ...p }) =>
            <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock child components that perform their own API calls
vi.mock('../components/SettingsModal', () => ({ default: () => null }));
vi.mock('../components/ThemeToggle',   () => ({ default: () => null }));

// Mock the api module (PageShell no longer calls it directly after useQuery mock,
// but it is imported at module level so it must resolve cleanly)
vi.mock('../api', () => ({ default: { get: vi.fn() } }));

// ─── Import after mocks ───────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import PageShell from '../components/PageShell';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderShell(risk = 0) {
  useQuery.mockReturnValue({ data: { burnoutRisk: risk }, isLoading: false });
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <PageShell>
        <div data-testid="child-content">page content</div>
      </PageShell>
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear();
  localStorage.setItem('token', 'fake-token'); // satisfy useQuery `enabled` check
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

// ─── Digital Sunset (triggered at risk ≥ 75) ──────────────────────────────────

describe('PageShell — Digital Sunset overlay (risk ≥ 75)', () => {
  test('does NOT activate sunset at risk = 0', () => {
    const { container } = renderShell(0);
    const root = container.firstChild;
    // Normal mode: bg-slate-50, not sunset amber
    expect(root.className).toContain('bg-slate-50');
    expect(root.className).not.toContain('bg-[#2b2722]');
  });

  test('does NOT activate sunset at risk = 74 (one below threshold)', () => {
    const { container } = renderShell(74);
    const root = container.firstChild;
    expect(root.className).not.toContain('bg-[#2b2722]');
  });

  test('activates Digital Sunset at risk = 75 (exact threshold)', () => {
    const { container } = renderShell(75);
    const root = container.firstChild;
    expect(root.className).toContain('bg-[#2b2722]');
  });

  test('activates Digital Sunset at risk = 80', () => {
    const { container } = renderShell(80);
    const root = container.firstChild;
    expect(root.className).toContain('bg-[#2b2722]');
  });

  test('shows the amber overlay div when sunset is active', () => {
    const { container } = renderShell(75);
    // The amber overlay has bg-amber-900/10 and is only rendered when isDigitalSunset
    const overlay = container.querySelector('.bg-amber-900\\/10');
    expect(overlay).toBeInTheDocument();
  });

  test('does NOT show the amber overlay div when risk is below threshold', () => {
    const { container } = renderShell(74);
    const overlay = container.querySelector('.bg-amber-900\\/10');
    expect(overlay).not.toBeInTheDocument();
  });

  test('shows "Digital Sunset Active" label in the nav when risk = 75', () => {
    renderShell(75);
    expect(screen.getByText('Digital Sunset Active')).toBeInTheDocument();
  });
});

// ─── Breathe Overlay (triggered at risk ≥ 85, after 5 s) ─────────────────────

describe('PageShell — Breathe Overlay (risk ≥ 85)', () => {
  test('breathe overlay is NOT visible immediately at risk = 85', () => {
    renderShell(85);
    // Overlay text is inside the breathe component
    expect(screen.queryByText('Breathe')).not.toBeInTheDocument();
  });

  test('breathe overlay appears after the 5 000 ms delay at risk = 85', async () => {
    renderShell(85);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Breathe')).toBeInTheDocument();
  });

  test('breathe overlay does NOT appear before the 5 000 ms delay (at 4 999 ms)', async () => {
    renderShell(85);
    await act(async () => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.queryByText('Breathe')).not.toBeInTheDocument();
  });

  test('breathe overlay does NOT appear at risk = 84 (one below threshold)', async () => {
    renderShell(84);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Breathe')).not.toBeInTheDocument();
  });

  test('breathe overlay appears at risk = 100', async () => {
    renderShell(100);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Breathe')).toBeInTheDocument();
  });

  test('breathe overlay does NOT appear when sessionStorage already has "breathed"', async () => {
    sessionStorage.setItem('breathed', 'true');
    renderShell(90);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Breathe')).not.toBeInTheDocument();
  });

  test('"Continue softly" button closes the breathe overlay', async () => {
    renderShell(90);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Breathe')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Continue softly/i });
    await act(async () => { btn.click(); });

    expect(screen.queryByText('Breathe')).not.toBeInTheDocument();
  });
});

// ─── Children and nav ─────────────────────────────────────────────────────────

describe('PageShell — general rendering', () => {
  test('renders child content inside the page shell', () => {
    renderShell(0);
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  test('renders the SilentDrop brand name in the nav', () => {
    renderShell(0);
    expect(screen.getByText(/SilentDrop/)).toBeInTheDocument();
  });
});
