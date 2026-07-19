export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Pointer {
  x: number;
  y: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function computeRotation(progress: number, pointer: Pointer, current: Rotation): Rotation {
  return {
    x: lerp(current.x, pointer.y * 0.3, 0.05),
    y: progress * Math.PI * 2,
    z: lerp(current.z, pointer.x * 0.15, 0.05),
  };
}
