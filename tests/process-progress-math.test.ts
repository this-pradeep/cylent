import { describe, it, expect } from 'vitest';
import { stepThresholds, activeStepIndex } from '../src/scripts/process-progress-math';

describe('stepThresholds', () => {
  it('splits progress evenly across steps', () => {
    expect(stepThresholds(4)).toEqual([0.25, 0.5, 0.75, 1]);
  });
});

describe('activeStepIndex', () => {
  it('returns the first step at the start of scroll', () => {
    expect(activeStepIndex(0, 4)).toBe(0);
  });

  it('returns the last step at the end of scroll', () => {
    expect(activeStepIndex(1, 4)).toBe(3);
  });

  it('returns the matching middle step', () => {
    expect(activeStepIndex(0.6, 4)).toBe(2);
  });
});
