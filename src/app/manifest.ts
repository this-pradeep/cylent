import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site/contact";
import { LOGO_PATH } from "@/lib/site/seo";
import { STUDIO_NAME } from "@/lib/site/studio";

export const dynamic = "force-static";

/**
 * The web app manifest.
 *
 * Present for one reason: without it Android has no defined icon or colour for a page saved
 * to a home screen, and falls back to a screenshot of the page. It is not a claim that this
 * is an app.
 *
 * `display: "browser"` for the same reason. Standalone is the conventional value and the
 * wrong one here — it strips the URL bar and the back gesture from a site whose whole job is
 * to send people to a portfolio and then off to an email client.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STUDIO_NAME,
    short_name: "Cylent",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    icons: [
      { src: LOGO_PATH, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
