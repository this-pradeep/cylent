import { scrollToId, scrollToPillar } from "@/lib/motion/scroll-to";

export type NavLink = {
  label: string;
  id: string;
  /** Pillar panels live inside a pinned horizontal track and need the mapped scroll. */
  pillar?: boolean;
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
  { label: "Web", id: "web", pillar: true },
  { label: "Videos", id: "video", pillar: true },
  { label: "Design", id: "graphics", pillar: true },
];

/** Kept apart because the navbar renders it as a button, not as a nav item. */
export const CONTACT_LINK: NavLink = { label: "Contact", id: "contact" };

/** Every link the footer index lists. */
export const FOOTER_LINKS: NavLink[] = [...NAV_LINKS, CONTACT_LINK];

export function goTo(link: NavLink): void {
  if (link.pillar) {
    scrollToPillar(link.id);
    return;
  }
  scrollToId(link.id);
}
