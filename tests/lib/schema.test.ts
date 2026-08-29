import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_ID,
  breadcrumbSchema,
  graph,
  organizationSchema,
  websiteSchema,
} from "@/lib/site/schema";
import { SITE_URL, SOCIAL_LINKS } from "@/lib/site/contact";

describe("organizationSchema", () => {
  it("lists every social profile in sameAs", () => {
    const sameAs = organizationSchema().sameAs as string[];
    expect(sameAs).toEqual(SOCIAL_LINKS.map((social) => social.href));
    expect(sameAs).toHaveLength(3);
  });

  it("points sameAs at absolute profile URLs", () => {
    for (const href of organizationSchema().sameAs as string[]) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

  it("carries a locality and an alpha-2 country code", () => {
    const address = organizationSchema().address as Record<string, string>;
    expect(address.addressLocality).toBe("Indore");
    expect(address.addressCountry).toMatch(/^[A-Z]{2}$/);
  });

  it("never publishes a dialable number — the studio line is WhatsApp only", () => {
    expect(organizationSchema()).not.toHaveProperty("telephone");
  });

  it("points logo and image at absolute URLs on our own origin", () => {
    const org = organizationSchema();
    const logo = org.logo as Record<string, unknown>;
    expect(logo.url).toBe(`${SITE_URL}/icon.png`);
    expect(org.image).toBe(`${SITE_URL}/og.png`);
  });
});

describe("websiteSchema", () => {
  it("credits the organization by reference rather than restating it", () => {
    expect(websiteSchema().publisher).toEqual({ "@id": ORGANIZATION_ID });
  });

  it("declares no SearchAction, because the site has no search endpoint", () => {
    expect(websiteSchema()).not.toHaveProperty("potentialAction");
  });
});

describe("breadcrumbSchema", () => {
  it("numbers crumbs from one, in order", () => {
    const items = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Web" },
    ]).itemListElement as Record<string, unknown>[];

    expect(items.map((item) => item.position)).toEqual([1, 2]);
    expect(items.map((item) => item.name)).toEqual(["Home", "Web"]);
  });

  it("resolves crumb paths against the site origin", () => {
    const [home] = breadcrumbSchema([{ name: "Home", path: "/" }])
      .itemListElement as Record<string, unknown>[];
    expect(home.item).toBe(SITE_URL);
  });

  it("leaves the current page without an item URL", () => {
    const [last] = breadcrumbSchema([{ name: "Web" }])
      .itemListElement as Record<string, unknown>[];
    expect(last).not.toHaveProperty("item");
  });
});

describe("graph", () => {
  it("wraps nodes in one context so they can reference each other by id", () => {
    const wrapped = graph([organizationSchema(), websiteSchema()]);
    expect(wrapped["@context"]).toBe("https://schema.org");
    expect(wrapped["@graph"]).toHaveLength(2);
  });

  it("survives a round trip through JSON, which is how it reaches the page", () => {
    const wrapped = graph([organizationSchema(), websiteSchema()]);
    expect(JSON.parse(JSON.stringify(wrapped))).toEqual(wrapped);
  });
});
