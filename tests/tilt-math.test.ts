import { describe, it, expect } from 'vitest';
import { computeTilt } from '../src/scripts/tilt-math';

describe('computeTilt', () => {
  it('returns ~zero tilt at the exact center', () => {
    const { rotateX, rotateY } = computeTilt(0.5, 0.5, 10);
    expect(rotateX).toBeCloseTo(0);
    expect(rotateY).toBeCloseTo(0);
  });

  it('tilts toward the pointer at the edges, clamped by maxDeg', () => {
    const right = computeTilt(1, 0.5, 10);
    expect(right.rotateY).toBeCloseTo(10);

    const topLeft = computeTilt(0, 0, 10);
    expect(topLeft.rotateX).toBeCloseTo(10);
    expect(topLeft.rotateY).toBeCloseTo(-10);
  });
});
