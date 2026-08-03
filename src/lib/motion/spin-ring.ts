/** Separator between repetitions of the label around the ring. */
const SEPARATOR = " · ";

/**
 * Length of the circular baseline the ring text is set on. Feeding this to the
 * `textLength` attribute forces the label to occupy exactly one revolution, so it can
 * never overlap itself at the seam or leave a gap.
 */
export function ringCircumference(radius: number): number {
  return 2 * Math.PI * radius;
}

/**
 * SVG path for a full circle usable as a `textPath` baseline. Two 180° arcs rather than
 * one, because a single elliptical arc cannot close on itself.
 */
export function ringPath(radius: number, center: number = radius): string {
  const diameter = radius * 2;
  return (
    `M${center},${center} m-${radius},0 ` +
    `a${radius},${radius} 0 1,1 ${diameter},0 ` +
    `a${radius},${radius} 0 1,1 -${diameter},0`
  );
}

/**
 * The label repeated around the ring, always ending with a separator — without the
 * trailing one the last and first words collide where the loop closes.
 */
export function ringLabel(label: string, repeats: number): string {
  const count = Math.max(1, Math.floor(repeats));
  return `${Array.from({ length: count }, () => label).join(SEPARATOR)}${SEPARATOR}`;
}
