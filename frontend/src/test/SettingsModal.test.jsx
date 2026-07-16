import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import api from '../api';
import SettingsModal from '../components/SettingsModal';

// ─── Default preferences fixture ─────────────────────────────────────────────
const defaultPrefs = { timezone: 'UTC', coreHoursStart: 9, coreHoursEnd: 17 };

function mockGetPrefs(prefs = defaultPrefs) {
  api.get.mockResolvedValueOnce({ data: prefs });
}

function mockPutSuccess() {
  api.put.mockResolvedValueOnce({ data: { message: 'Updated', preferences: defaultPrefs } });
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Visibility ───────────────────────────────────────────────────────────────

describe('SettingsModal — visibility', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SettingsModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders the modal panel when isOpen is true', async () => {
    mockGetPrefs();
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(await screen.findByText('Preferences')).toBeInTheDocument();
  });
});

// ─── Loading preferences ──────────────────────────────────────────────────────

describe('SettingsModal — loading preferences', () => {
  test('calls api.get with the preferences endpoint on open', async () => {
    mockGetPrefs();
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/user/preferences'));
  });

  test('populates the timezone selector with the loaded preference', async () => {
    mockGetPrefs({ timezone: 'Asia/Kolkata', coreHoursStart: 9, coreHoursEnd: 17 });
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    // Wait for the select to reflect the loaded value
    const select = await screen.findByDisplayValue('India (IST)');
    expect(select).toBeInTheDocument();
  });

  test('populates coreHoursStart with the loaded value', async () => {
    mockGetPrefs({ timezone: 'UTC', coreHoursStart: 8, coreHoursEnd: 18 });
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    // The coreHoursStart select should show 08:00
    const startSelect = await screen.findByDisplayValue('08:00');
    expect(startSelect).toBeInTheDocument();
  });
});

// ─── Saving preferences ───────────────────────────────────────────────────────

describe('SettingsModal — saving preferences', () => {
  test('calls api.put with the current preferences when Save is clicked', async () => {
    const user = userEvent.setup();
    mockGetPrefs();
    mockPutSuccess();

    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);

    // Wait for form to load
    await screen.findByDisplayValue('UTC');

    // Click Save without changing anything
    const saveBtn = screen.getByRole('button', { name: /Save Preferences/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/user/preferences', defaultPrefs);
    });
  });

  test('calls onClose after a successful save', async () => {
    const user = userEvent.setup();
    mockGetPrefs();
    mockPutSuccess();

    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    await screen.findByDisplayValue('UTC');

    await user.click(screen.getByRole('button', { name: /Save Preferences/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test('calls api.put with updated timezone when the user changes it', async () => {
    const user = userEvent.setup();
    mockGetPrefs();
    mockPutSuccess();

    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    await screen.findByDisplayValue('UTC');

    // Change timezone to Asia/Kolkata
    const tzSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(tzSelect, 'Asia/Kolkata');

    await user.click(screen.getByRole('button', { name: /Save Preferences/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/user/preferences', {
        timezone: 'Asia/Kolkata',
        coreHoursStart: 9,
        coreHoursEnd: 17,
      });
    });
  });

  test('calls api.put with updated coreHoursStart when the user changes it', async () => {
    const user = userEvent.setup();
    mockGetPrefs();
    mockPutSuccess();

    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    await screen.findByDisplayValue('UTC');

    // Core hours selects are the 2nd and 3rd comboboxes
    const startSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(startSelect, '8'); // hour 8 → value "8"

    await user.click(screen.getByRole('button', { name: /Save Preferences/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/api/user/preferences',
        expect.objectContaining({ coreHoursStart: 8 })
      );
    });
  });

  test('calls api.put with updated coreHoursEnd when the user changes it', async () => {
    const user = userEvent.setup();
    mockGetPrefs();
    mockPutSuccess();

    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    await screen.findByDisplayValue('UTC');

    const endSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(endSelect, '18');

    await user.click(screen.getByRole('button', { name: /Save Preferences/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/api/user/preferences',
        expect.objectContaining({ coreHoursEnd: 18 })
      );
    });
  });
});

// ─── Cancel ───────────────────────────────────────────────────────────────────

describe('SettingsModal — cancel', () => {
  test('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    mockGetPrefs();

    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    await screen.findByDisplayValue('UTC');

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does NOT call api.put when Cancel is clicked', async () => {
    const user = userEvent.setup();
    mockGetPrefs();

    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    await screen.findByDisplayValue('UTC');

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(api.put).not.toHaveBeenCalled();
  });

  test('calls onClose when the ✕ button is clicked', async () => {
    const user = userEvent.setup();
    mockGetPrefs();

    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    await screen.findByDisplayValue('UTC');

    await user.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
