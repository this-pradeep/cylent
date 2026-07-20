export function computeTilt(
  relX: number,
  relY: number,
  maxDeg: number
): { rotateX: number; rotateY: number } {
  const rotateY = (relX - 0.5) * 2 * maxDeg;
  const rotateX = -(relY - 0.5) * 2 * maxDeg;
  return { rotateX, rotateY };
}
