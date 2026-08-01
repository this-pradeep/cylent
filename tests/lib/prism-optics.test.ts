import { describe, expect, it } from "vitest";
import {
  BASE_ROTATION,
  BEAM_DIRECTION,
  IOR_RED,
  IOR_VIOLET,
  dot,
  intersectTriangle,
  iorAt,
  length,
  normalize,
  refract,
  tracePrism,
  trianglePoints,
  v2,
} from "@/lib/three/prism-optics";

const TRI = trianglePoints(v2(0, 0), 1, 0);

describe("refract", () => {
  it("passes a ray straight through at normal incidence", () => {
    const out = refract(v2(0, -1), v2(0, 1), 1 / 1.5);
    expect(out).not.toBeNull();
    expect(out!.x).toBeCloseTo(0, 6);
    expect(out!.y).toBeCloseTo(-1, 6);
  });

  it("obeys Snell's law entering a denser medium", () => {
    const theta = Math.PI / 6;
    const incident = normalize(v2(Math.sin(theta), -Math.cos(theta)));
    const out = refract(incident, v2(0, 1), 1 / 1.5)!;
    const outAngle = Math.asin(Math.abs(out.x) / length(out));
    // n1 sin(t1) = n2 sin(t2)
    expect(Math.sin(outAngle)).toBeCloseTo(Math.sin(theta) / 1.5, 5);
  });

  it("bends toward the normal going in, away coming out", () => {
    const theta = Math.PI / 5;
    const incident = normalize(v2(Math.sin(theta), -Math.cos(theta)));
    const into = refract(incident, v2(0, 1), 1 / 1.5)!;
    const intoAngle = Math.asin(Math.abs(into.x));
    expect(intoAngle).toBeLessThan(theta);

    const outOf = refract(incident, v2(0, 1), 1.5)!;
    expect(Math.asin(Math.abs(outOf.x))).toBeGreaterThan(theta);
  });

  it("returns null on total internal reflection", () => {
    // Well past the critical angle for glass -> air (~41.8 degrees).
    const theta = Math.PI / 3;
    const incident = normalize(v2(Math.sin(theta), -Math.cos(theta)));
    expect(refract(incident, v2(0, 1), 1.5)).toBeNull();
  });

  it("preserves unit length", () => {
    const incident = normalize(v2(0.4, -0.9));
    const out = refract(incident, v2(0, 1), 1 / 1.5)!;
    expect(length(out)).toBeCloseTo(1, 6);
  });
});

describe("trianglePoints", () => {
  it("puts every vertex on the circumradius", () => {
    for (const p of trianglePoints(v2(2, -1), 0.5, 0.7)) {
      expect(length(v2(p.x - 2, p.y + 1))).toBeCloseTo(0.5, 6);
    }
  });
});

describe("intersectTriangle", () => {
  it("finds the near edge and returns an outward normal", () => {
    const hit = intersectTriangle(v2(-4, 0), v2(1, 0), TRI);
    expect(hit).not.toBeNull();
    expect(hit!.point.x).toBeLessThan(0);
    // Outward normal must oppose a ray travelling inward.
    expect(dot(hit!.normal, v2(1, 0))).toBeLessThan(0);
  });

  it("returns null when the ray misses", () => {
    expect(intersectTriangle(v2(-4, 9), v2(1, 0), TRI)).toBeNull();
  });

  it("ignores hits nearer than minT", () => {
    const first = intersectTriangle(v2(-4, 0), v2(1, 0), TRI)!;
    const second = intersectTriangle(v2(-4, 0), v2(1, 0), TRI, first.t + 1e-4)!;
    expect(second.t).toBeGreaterThan(first.t);
  });
});

describe("iorAt", () => {
  it("runs red to violet and clamps outside the range", () => {
    expect(iorAt(0)).toBeCloseTo(IOR_RED, 6);
    expect(iorAt(1)).toBeCloseTo(IOR_VIOLET, 6);
    expect(iorAt(-3)).toBeCloseTo(IOR_RED, 6);
    expect(iorAt(4)).toBeCloseTo(IOR_VIOLET, 6);
  });
});

describe("tracePrism", () => {
  // The measured working configuration: a beam from the upper left onto a prism at
  // BASE_ROTATION. At shallower incidence every wavelength total-internally reflects
  // at the exit face and nothing leaves the glass at all.
  const dir = normalize(BEAM_DIRECTION);
  const origin = v2(-dir.x * 4, -dir.y * 4);
  const PRISM = trianglePoints(v2(0, 0), 1, BASE_ROTATION);

  it("enters and leaves the glass", () => {
    const path = tracePrism(origin, dir, PRISM, 1.5)!;
    expect(path).not.toBeNull();
    expect(length(v2(path.exit.x - path.entry.x, path.exit.y - path.entry.y))).toBeGreaterThan(0);
    expect(length(path.outDir)).toBeCloseTo(1, 6);
  });

  it("deviates the ray from its original direction", () => {
    const path = tracePrism(origin, dir, PRISM, 1.5)!;
    expect(dot(path.outDir, dir)).toBeLessThan(0.999);
  });

  it("disperses: violet deviates further than red", () => {
    const red = tracePrism(origin, dir, PRISM, IOR_RED)!;
    const violet = tracePrism(origin, dir, PRISM, IOR_VIOLET)!;
    expect(red).not.toBeNull();
    expect(violet).not.toBeNull();

    const bend = (d: { x: number; y: number }) => Math.acos(Math.min(1, dot(d, dir)));
    expect(bend(violet.outDir)).toBeGreaterThan(bend(red.outDir));
  });

  it("returns null when the ray misses the prism entirely", () => {
    expect(tracePrism(v2(-3, 8), v2(1, 0), PRISM, 1.5)).toBeNull();
  });
});
