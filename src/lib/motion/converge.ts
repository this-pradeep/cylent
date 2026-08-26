/**
 * The convergence: four crafts most agencies print as a service list, collapsing onto one
 * line. Chapter 3 of the story argues that development, video, photography and design are
 * one experience rather than four departments — this is that argument as motion, so the
 * geometry lives here where it can be reasoned about without a DOM.
 */

/**
 * Fallback line spacing for the first pass, before the list has been laid out and measured.
 * Never used once `getBoundingClientRect` has a real height to give.
 */
export const CRAFT_STEP_PX = 56;

/**
 * How far each line must travel, in px, to meet the others on a shared baseline.
 *
 * The baseline is the stack's optical centre rather than the first or last line, so the
 * group collapses inward instead of sliding as a whole — a drift would read as the list
 * being pushed off the grid rather than as four things becoming one.
 *
 * Positive moves down, matching CSS `translateY`.
 */
export function convergeOffsets(count: number, stepPx: number): number[] {
  if (count <= 0) return [];
  const centre = ((count - 1) / 2) * stepPx;
  return Array.from({ length: count }, (_, index) => centre - index * stepPx);
}
