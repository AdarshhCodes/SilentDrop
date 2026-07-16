import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskMeter from '../components/RiskMeter';

/**
 * RiskMeter renders an SVG ring whose stroke colour is determined by the `value`
 * prop directly (not the animated value), so all colour assertions are
 * animation-independent.
 *
 * SVG structure:
 *   circle[0]  — background track (always stroke-[#374151])
 *   circle[1]  — progress ring (colour class driven by `value` prop)
 *
 * Colour logic:
 *   value < 40   → stroke-indigo-400 (low risk)
 *   40 ≤ value < 70 → stroke-indigo-600 (medium risk)
 *   value ≥ 70   → stroke-indigo-800 (high risk)
 */

// Stub requestAnimationFrame so the animation loop never fires.
// This keeps animatedValue at 0 for the duration of each test, which is fine
// because all colour assertions use the `value` prop, not the animated value.
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn());
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RiskMeter — SVG structure', () => {
  test('renders two circles (background track + progress ring)', () => {
    const { container } = render(<RiskMeter value={0} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  test('renders a percentage text element in the centre', () => {
    render(<RiskMeter value={0} />);
    // animatedValue is 0 when rAF is stubbed; value=0 also skips the effect
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('RiskMeter — colour states based on `value` prop', () => {
  function getProgressRing(container) {
    return container.querySelectorAll('circle')[1];
  }

  test('value = 0 → low-risk colour (stroke-indigo-400)', () => {
    const { container } = render(<RiskMeter value={0} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-400');
  });

  test('value = 1 → low-risk colour (stroke-indigo-400)', () => {
    const { container } = render(<RiskMeter value={1} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-400');
  });

  test('value = 39 → low-risk colour (stroke-indigo-400) — one below medium threshold', () => {
    const { container } = render(<RiskMeter value={39} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-400');
    expect(getProgressRing(container)).not.toHaveClass('stroke-indigo-600');
  });

  test('value = 40 → medium-risk colour (stroke-indigo-600) — at medium threshold', () => {
    const { container } = render(<RiskMeter value={40} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-600');
    expect(getProgressRing(container)).not.toHaveClass('stroke-indigo-400');
  });

  test('value = 50 → medium-risk colour (stroke-indigo-600)', () => {
    const { container } = render(<RiskMeter value={50} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-600');
  });

  test('value = 69 → medium-risk colour (stroke-indigo-600) — one below high threshold', () => {
    const { container } = render(<RiskMeter value={69} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-600');
    expect(getProgressRing(container)).not.toHaveClass('stroke-indigo-800');
  });

  test('value = 70 → high-risk colour (stroke-indigo-800) — at high threshold', () => {
    const { container } = render(<RiskMeter value={70} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-800');
    expect(getProgressRing(container)).not.toHaveClass('stroke-indigo-600');
  });

  test('value = 85 → high-risk colour (stroke-indigo-800)', () => {
    const { container } = render(<RiskMeter value={85} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-800');
  });

  test('value = 100 → high-risk colour (stroke-indigo-800)', () => {
    const { container } = render(<RiskMeter value={100} />);
    expect(getProgressRing(container)).toHaveClass('stroke-indigo-800');
  });
});

describe('RiskMeter — strokeDashoffset reflects animatedValue', () => {
  test('progress ring has a stroke-dasharray attribute set', () => {
    const { container } = render(<RiskMeter value={50} />);
    const ring = container.querySelectorAll('circle')[1];
    // React serialises the JSX prop strokeDasharray to the DOM attribute stroke-dasharray
    expect(ring).toHaveAttribute('stroke-dasharray');
  });

  test('when value=0 the progress ring starts at full offset (no fill)', () => {
    const { container } = render(<RiskMeter value={0} />);
    const ring = container.querySelectorAll('circle')[1];
    // When animatedValue=0, offset = circumference (ring is empty)
    const offset = parseFloat(ring.style.strokeDashoffset);
    // DOM attribute is kebab-case even though the JSX prop is camelCase
    const circumference = parseFloat(ring.getAttribute('stroke-dasharray'));
    expect(offset).toBeCloseTo(circumference, 0);
  });
});
