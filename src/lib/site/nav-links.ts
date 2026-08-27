import { scrollToId } from "@/lib/motion/scroll-to";

export type NavLink = {
  label: string;
  id: string;
};

/**
 * Single source of truth for the navbar and the footer index. The footer is specified to
 * mirror the navbar, so the two must not be able to drift apart.
 *
 * These are in-page targets today. Going multi-page means swapping each `id` for a `href`
 * and rendering `next/link` — the consumers already read this shape, so it stays one edit.
 */
export const NAV_LINKS: NavLink[] = [
  { label: "About", id: "about" },
  { label: "Web", id: "web" },
  { label: "Videos", id: "video" },
  { label: "Design", id: "graphics" },
];

/** Kept apart because the navbar renders it as a button, not as a nav item. */
export const CONTACT_LINK: NavLink = { label: "Contact", id: "contact" };

/** Every link the footer index lists. */
export const FOOTER_LINKS: NavLink[] = [...NAV_LINKS, CONTACT_LINK];

export function goTo(link: NavLink): void {
  scrollToId(link.id);
}

/** Where the link points when the page it names is not the page you are on. */
export function hrefFor(link: NavLink): string {
  return `/#${link.id}`;
}

/**
 * Whether this link's destination is on the page right now.
 *
 * The section ids live on the homepage, so on a work route there is nothing for a scroll to
 * find — which is exactly how these links came to do nothing at all when they were buttons
 * calling a scroll that silently returned. Contact is the exception and answers true
 * everywhere, because the footer is in the layout.
 *
 * Asked of the document rather than of the pathname, so the answer stays right no matter
 * which sections a route happens to render.
 */
export function isOnThisPage(link: NavLink): boolean {
  return typeof document !== "undefined" && document.getElementById(link.id) !== null;
}
