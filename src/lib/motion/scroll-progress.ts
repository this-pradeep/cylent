export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function mapScrollToStep(progress: number, stepCount: number): number {
  const clamped = clampProgress(progress);
  return Math.min(stepCount - 1, Math.floor(clamped * stepCount));
}
