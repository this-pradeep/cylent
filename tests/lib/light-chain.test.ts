import { describe, expect, it } from "vitest";
import {
  aperturePoints,
  collimate,
  jitter,
  perp,
  prismRotationFor,
  scatter,
} from "@/lib/light/chain";
import {
  BEAM_DIRECTION,
  dot,
  iorAt,
  length,
  normalize,
  tracePrism,
  trianglePoints,
  v2,
} from "@/lib/three/prism-optics";

describe("jitter", () => {
  it("is deterministic", () => {
    expect(jitter(7)).toBe(jitter(7));
  });

  it("stays inside [-1, 1]", () => {
    for (let i = 0; i < 200; i++) {
      expect(Math.abs(jitter(i))).toBeLessThanOrEqual(1);
    }
  });

  it("is not constant", () => {
    const values = new Set(Array.from({ length: 20 }, (_, i) => jitter(i)));
    expect(values.size).toBeGreaterThan(15);
  });
});

describe("perp", () => {
  it("is perpendicular and unit for unit input", () => {
    const d = normalize(v2(0.6, -0.8));
    const p = perp(d);
    expect(dot(d, p)).toBeCloseTo(0, 10);
    expect(length(p)).toBeCloseTo(1, 10);
  });
});

describe("scatter — Imagine", () => {
  const from = v2(0, 0);
  const target = v2(10, 0);

  it("emits every ray from the single source", () => {
    for (const s of scatter(from, target, 12, 3)) {
      expect(s.a).toEqual(from);
    }
  });

  it("spreads across the aperture rather than converging to a point", () => {
    const ends = scatter(from, target, 12, 3, 0).map((s) => s.b.y);
    expect(Math.max(...ends) - Math.min(...ends)).toBeGreaterThan(4);
  });

  it("is symmetric about the axis with no wobble", () => {
    const ends = scatter(from, target, 11, 3, 0).map((s) => s.b.y);
    expect(ends[0]).toBeCloseTo(-ends[ends.length - 1], 10);
    expect(ends[5]).toBeCloseTo(0, 10);
  });

  it("repeats exactly across calls", () => {
    expect(scatter(from, target, 9, 2)).toEqual(scatter(from, target, 9, 2));
  });

  it("handles a single ray without dividing by zero", () => {
    const one = scatter(from, target, 1, 3, 0);
    expect(one).toHaveLength(1);
    expect(Number.isFinite(one[0].b.x)).toBe(true);
    expect(Number.isFinite(one[0].b.y)).toBe(true);
  });
});

describe("collimate — Build", () => {
  const dir = normalize(v2(1, -0.4));
  const band = collimate(v2(2, 2), dir, 7, 3, 5);

  it("makes every ray parallel — that is the whole point of the station", () => {
    for (const s of band) {
      const d = normalize(v2(s.b.x - s.a.x, s.b.y - s.a.y));
      expect(dot(d, dir)).toBeCloseTo(1, 8);
    }
  });

  it("spaces them evenly", () => {
    const gaps: number[] = [];
    for (let i = 1; i < band.length; i++) {
      gaps.push(length(v2(band[i].a.x - band[i - 1].a.x, band[i].a.y - band[i - 1].a.y)));
    }
    for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 8);
  });

  it("gives every ray the requested length", () => {
    for (const s of band) {
      expect(length(v2(s.b.x - s.a.x, s.b.y - s.a.y))).toBeCloseTo(5, 8);
    }
  });
});

describe("aperturePoints", () => {
  it("centres the span on the station", () => {
    const pts = aperturePoints(v2(4, 1), v2(1, 0), 5, 2);
    expect(pts).toHaveLength(5);
    expect(pts[2].x).toBeCloseTo(4, 10);
    expect(pts[2].y).toBeCloseTo(1, 10);
    expect(pts[0].y).toBeCloseTo(-pts[4].y + 2, 10);
  });
});

describe("prismRotationFor — Inspire", () => {
  it("reproduces the measured hero relationship for the reference band", () => {
    expect(prismRotationFor(BEAM_DIRECTION)).toBeCloseTo(0, 10);
  });

  it("disperses every wavelength whichever way the band points", () => {
    for (let deg = -180; deg < 180; deg += 15) {
      const a = (deg * Math.PI) / 180;
      const dir = v2(Math.cos(a), Math.sin(a));
      const tri = trianglePoints(v2(0, 0), 1, prismRotationFor(dir));
      const origin = v2(-dir.x * 4, -dir.y * 4);

      let survived = 0;
      for (let i = 0; i < 24; i++) {
        if (tracePrism(origin, dir, tri, iorAt(i / 23))) survived++;
      }
      expect(survived, `band at ${deg}deg lost wavelengths`).toBe(24);
    }
  });

  it("fans the spectrum wide enough to read", () => {
    const dir = normalize(v2(1, 0.25));
    const tri = trianglePoints(v2(0, 0), 1, prismRotationFor(dir));
    const origin = v2(-dir.x * 4, -dir.y * 4);

    const angles: number[] = [];
    for (let i = 0; i < 24; i++) {
      const p = tracePrism(origin, dir, tri, iorAt(i / 23));
      if (p) angles.push(Math.atan2(p.outDir.y, p.outDir.x));
    }
    const spreadDeg = ((Math.max(...angles) - Math.min(...angles)) * 180) / Math.PI;
    expect(spreadDeg).toBeGreaterThan(15);
  });
});
