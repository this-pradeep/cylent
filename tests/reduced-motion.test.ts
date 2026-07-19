import { describe, it, expect, vi, afterEach } from 'vitest';
import { prefersReducedMotion } from '../src/scripts/reduced-motion';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
  it('returns true when the media query matches', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });
});
