import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/contact";

/**
 * `output: "export"` refuses to build a route handler it cannot prove is static. This file
 * only reads build-time constants, so saying so is a formality — but it is a required one.
 */
export const dynamic = "force-static";

/**
 * Emitted as a real /robots.txt file by the static export — this runs at build time, not on
 * a server, so there is nothing here that the export cannot answer.
 *
 * Everything is crawlable. There is no admin surface, no search-result page and no
 * duplicate-parameter route to keep out of an index; a disallow list invented in advance of
 * a reason is a way to accidentally hide the site from itself.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
