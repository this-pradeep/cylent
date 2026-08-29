import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/lib/site/contact";
import { DISCIPLINES } from "@/lib/site/projects";
import { LOGO_PATH, SHARE_IMAGE_PATH, absoluteUrl } from "@/lib/site/seo";
import {
  LEGAL_NAME,
  STUDIO_CITY,
  STUDIO_COUNTRY_CODE,
  STUDIO_NAME,
} from "@/lib/site/studio";

/**
 * JSON-LD for the site.
 *
 * Built here as plain data rather than hand-written into the markup, so every value comes
 * from the same constants the visible page reads. Structured data that disagrees with the
 * page it describes is worse than none — search engines treat the mismatch as a reason to
 * distrust the whole document — and the only way to guarantee they agree is to give them
 * one source.
 *
 * Deliberately absent:
 *
 * - `telephone`. The studio line is WhatsApp-only and is deliberately not offered to dial
 *   anywhere on the site; a `telephone` field would publish it as a dialable number and
 *   quietly undo that decision.
 * - `SearchAction` on the WebSite. It earns a sitelinks searchbox only for sites that have
 *   a search endpoint. This one does not, so declaring it would be a claim about a page
 *   that cannot answer.
 * - `aggregateRating` / `review`. Self-serving review markup is a manual-action risk and we
 *   have no third-party ratings to point at.
 */

/** A JSON-LD node. Loose by design — the shape is the vocabulary's, not TypeScript's. */
export type JsonLdNode = Record<string, unknown>;

/**
 * Stable identifier for the studio as an entity, distinct from the page that describes it.
 * Anything that needs to say "published by us" references this instead of restating it.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationSchema(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: STUDIO_NAME,
    legalName: LEGAL_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: STUDIO_CITY,
      addressCountry: STUDIO_COUNTRY_CODE,
    },
    /**
     * The square monogram, which is what a knowledge panel wants: a mark that survives being
     * shown small, on a background we do not control. The share card is the wide one and is
     * offered separately as `image`.
     */
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}${LOGO_PATH}`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}${SHARE_IMAGE_PATH}`,
    // What the studio does, taken from the three disciplines the site is organised around.
    knowsAbout: DISCIPLINES.map((discipline) => discipline.claim),
    /**
     * The profiles that corroborate the entity. This is the field social links exist for in
     * structured data: it is how a search engine confirms that the accounts and the site are
     * the same organisation.
     */
    sameAs: SOCIAL_LINKS.map((social) => social.href),
  };
}

export function websiteSchema(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: STUDIO_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
  };
}

export type Crumb = {
  name: string;
  /** Path from the site root, leading slash included. Omitted on the trail's last item. */
  path?: string;
};

/**
 * The breadcrumb trail for a page.
 *
 * Every crumb but the last has to resolve to a real page. There is no `/work` index route —
 * the disciplines are the only pages under it — so a trail runs Home → Discipline rather
 * than inserting a "Work" level that would point at a 404.
 */
export function breadcrumbSchema(crumbs: Crumb[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  };
}

/**
 * Wrap nodes into a single graph.
 *
 * One script carrying a @graph rather than several scripts each carrying a node: it lets the
 * nodes reference each other by @id — the WebSite naming the Organization as its publisher
 * — instead of restating the organisation on every page.
 */
export function graph(nodes: JsonLdNode[]): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": nodes };
}
