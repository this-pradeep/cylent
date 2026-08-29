import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/contact";
import { absoluteUrl } from "@/lib/site/seo";
import { DISCIPLINES } from "@/lib/site/projects";

/**
 * `output: "export"` refuses to build a route handler it cannot prove is static. This file
 * only reads build-time constants, so saying so is a formality — but it is a required one.
 */
export const dynamic = "force-static";

/**
 * Every page the site has, built from the same discipline list the routes are generated
 * from. Adding a discipline adds its work page, its route and its sitemap entry together —
 * a hand-written list is a list that goes stale the first time someone forgets it.
 *
 * `lastModified` is the build time, which for a static export is exactly when the content
 * last changed. `changeFrequency` and `priority` are omitted: Google has said for years it
 * ignores both, and guessing at them only adds noise to a file whose job is to be true.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: absoluteUrl("/"), lastModified },
    ...DISCIPLINES.map((discipline) => ({
      url: `${SITE_URL}/work/${discipline.id}`,
      lastModified,
    })),
  ];
}
