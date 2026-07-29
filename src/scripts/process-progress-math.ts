export function stepThresholds(stepCount: number): number[] {
  return Array.from({ length: stepCount }, (_, i) => (i + 1) / stepCount);
}

export function activeStepIndex(progress: number, stepCount: number): number {
  const thresholds = stepThresholds(stepCount);
  const index = thresholds.findIndex((threshold) => progress <= threshold);
  return index === -1 ? stepCount - 1 : index;
}
