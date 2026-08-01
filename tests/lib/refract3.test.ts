import { describe, expect, it } from "vitest";
import { dot3, normalize3, refract3 } from "@/lib/three/prism-optics";

const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const len3 = (a: { x: number; y: number; z: number }) => Math.hypot(a.x, a.y, a.z);

describe("refract3", () => {
  it("passes straight through at normal incidence", () => {
    const out = refract3(v3(0, -1, 0), v3(0, 1, 0), 1 / 1.5)!;
    expect(out.x).toBeCloseTo(0, 6);
    expect(out.y).toBeCloseTo(-1, 6);
    expect(out.z).toBeCloseTo(0, 6);
  });

  it("obeys Snell's law entering glass", () => {
    const theta = Math.PI / 5;
    const incident = normalize3(v3(Math.sin(theta), -Math.cos(theta), 0));
    const out = refract3(incident, v3(0, 1, 0), 1 / 1.5)!;
    expect(Math.asin(Math.abs(out.x))).toBeCloseTo(Math.asin(Math.sin(theta) / 1.5), 6);
  });

  it("bends toward the normal going in and away coming out", () => {
    const theta = Math.PI / 5;
    const incident = normalize3(v3(Math.sin(theta), -Math.cos(theta), 0));
    expect(Math.asin(Math.abs(refract3(incident, v3(0, 1, 0), 1 / 1.5)!.x))).toBeLessThan(theta);
    expect(Math.asin(Math.abs(refract3(incident, v3(0, 1, 0), 1.5)!.x))).toBeGreaterThan(theta);
  });

  it("returns null past the critical angle", () => {
    const theta = Math.PI / 3;
    const incident = normalize3(v3(Math.sin(theta), -Math.cos(theta), 0));
    expect(refract3(incident, v3(0, 1, 0), 1.5)).toBeNull();
  });

  it("stays unit length and works out of plane", () => {
    const incident = normalize3(v3(0.3, -0.8, 0.52));
    const out = refract3(incident, v3(0, 1, 0), 1 / 1.5)!;
    expect(len3(out)).toBeCloseTo(1, 6);
  });

  it("disperses: a higher index bends the ray further", () => {
    const incident = normalize3(v3(0.5, -0.86, 0));
    const red = refract3(incident, v3(0, 1, 0), 1 / 1.44)!;
    const violet = refract3(incident, v3(0, 1, 0), 1 / 1.7)!;
    const bend = (d: { x: number; y: number; z: number }) =>
      Math.acos(Math.min(1, dot3(d, incident)));
    expect(bend(violet)).toBeGreaterThan(bend(red));
  });

  it("tolerates unnormalised inputs", () => {
    const out = refract3(v3(0, -4, 0), v3(0, 9, 0), 1 / 1.5)!;
    expect(len3(out)).toBeCloseTo(1, 6);
  });
});
