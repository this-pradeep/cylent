import { describe, it, expect } from 'vitest';
import { computeRotation } from '../src/islands/service-scene-math';

describe('computeRotation', () => {
  it('maps scroll progress 0..1 to a full rotation on the Y axis', () => {
    const start = computeRotation(0, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 });
    const end = computeRotation(1, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 });
    expect(start.y).toBe(0);
    expect(end.y).toBeCloseTo(Math.PI * 2);
  });

  it('eases x/z rotation toward the pointer instead of snapping instantly', () => {
    const current = { x: 0, y: 0, z: 0 };
    const next = computeRotation(0, { x: 1, y: 1 }, current);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(0.3);
    expect(next.z).toBeGreaterThan(0);
    expect(next.z).toBeLessThan(0.15);
  });
});
