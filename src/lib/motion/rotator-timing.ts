// Hero rotator cadence. Tuned for a hero-scale creative rather than a small inline
// pill: at the previous 1500ms/0.45s the form never settled before being pulled to
// the next state (motion-system.md — "Smooth Over Fast", hero timings 0.8s–1.5s).
export const ROTATE_INTERVAL_MS = 3000;

// Pill width + content crossfade.
export const SLIDE_DURATION_S = 0.9;

// Creative state transition. Same duration as the pill so the word and the form read
// as one gesture; different easing, so the word resolves while the form is still
// settling behind it.
export const MORPH_DURATION_S = 0.9;

// Opacity-only crossfade used when prefers-reduced-motion is set: the rotation still
// runs (a word swap is a content change, not movement), but nothing translates.
export const REDUCED_MOTION_FADE_S = 0.3;

/** Seconds a state holds still between transitions. Negative means it never settles. */
export function settleTimeS(
  intervalMs: number = ROTATE_INTERVAL_MS,
  transitionS: number = MORPH_DURATION_S,
): number {
  return intervalMs / 1000 - transitionS;
}
