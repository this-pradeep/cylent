import { describe, expect, it } from "vitest";
import { SITE_METADATA, absoluteUrl, pageMetadata } from "@/lib/site/seo";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site/contact";
import { DISCIPLINES } from "@/lib/site/projects";

describe("pageMetadata", () => {
  it("gives the homepage the bare site name, not a templated one", () => {
    const meta = pageMetadata({ path: "/" });
    expect(meta.title).toBe("Cylent Solutions");
    expect(meta.title).not.toContain("—");
    expect(meta.description).toBe(SITE_DESCRIPTION);
  });

  it("suffixes an inner page's title, and spells the same title into og:title", () => {
    const meta = pageMetadata({ title: "Web", description: "Fast.", path: "/work/web" });
    expect(meta.title).toBe("Web — Cylent Solutions");
    expect(meta.openGraph?.title).toBe("Web — Cylent Solutions");
  });

  it("canonicalises to the page's own path", () => {
    expect(pageMetadata({ path: "/" }).alternates?.canonical).toBe("/");
    for (const discipline of DISCIPLINES) {
      const meta = pageMetadata({ title: discipline.label, path: `/work/${discipline.id}` });
      expect(meta.alternates?.canonical).toBe(`/work/${discipline.id}`);
    }
  });

  it("gives og:url an absolute URL, which is the only form it accepts", () => {
    const openGraph = pageMetadata({ path: "/work/web" }).openGraph;
    expect(openGraph && "url" in openGraph && openGraph.url).toBe(`${SITE_URL}/work/web`);
  });

  it("shares as a large-image card at the size the file actually is", () => {
    const meta = pageMetadata({ path: "/" });
    const [image] = meta.openGraph?.images as { url: string; width: number; height: number }[];
    expect(image.url).toBe("/og.png");
    expect([image.width, image.height]).toEqual([1200, 630]);
    expect((meta.twitter as { card: string }).card).toBe("summary_large_image");
  });

  it("keeps the description identical across title, og and twitter", () => {
    const meta = pageMetadata({ title: "Web", description: "Fast.", path: "/work/web" });
    expect(meta.openGraph?.description).toBe("Fast.");
    expect(meta.twitter?.description).toBe("Fast.");
  });
});

describe("absoluteUrl", () => {
  it("states the homepage the way its canonical does, with no trailing slash", () => {
    expect(absoluteUrl("/")).toBe(SITE_URL);
  });

  it("joins inner paths straight onto the origin", () => {
    expect(absoluteUrl("/work/web")).toBe(`${SITE_URL}/work/web`);
  });
});

describe("SITE_METADATA", () => {
  it("asks for large image previews, which is off by default", () => {
    const robots = SITE_METADATA.robots as { googleBot: Record<string, unknown> };
    expect(robots.googleBot["max-image-preview"]).toBe("large");
  });

  it("stays indexable", () => {
    const robots = SITE_METADATA.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });
});
